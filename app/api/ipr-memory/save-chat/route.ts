import { createHash, randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import {
  ensureHbceDatabaseReady,
  persistIprChatMessageToDatabase,
  queryHbceDatabase,
  saveIprChatToMemoryDatabase,
  toPublicIprChatMemorySave,
  toPublicIprChatMessage,
  toPublicIprChatThread,
  toPublicIprMemoryRecord,
  toPublicRegisteredMemoryEvent,
  upsertIprChatThreadToDatabase,
  type IprChatMessageDatabaseInput
} from "@/lib/ipr-database";
import {
  HBCE_CURRENT_EVENT_FAMILY,
  HBCE_CURRENT_OPERATIONAL_AI_EVT,
  HBCE_CURRENT_OPERATIONAL_CYCLE,
  HBCE_CURRENT_OPERATIONAL_EVT,
  HBCE_DATABASE_PERSISTENCE_MODE,
  HBCE_DATABASE_SCHEMA_VERSION,
  HBCE_JOKER_C2_BIRTH_ANCHOR_LOCAL,
  HBCE_JOKER_C2_BIRTH_ANCHOR_UTC,
  HBCE_JOKER_C2_BIRTH_TIME_ZONE,
  HBCE_JOKER_C2_TEMPORAL_CERTIFICATE_BOUNDARY,
  HBCE_JOKER_C2_TEMPORAL_CERTIFICATE_NAME,
  HBCE_MONTHLY_REFERENCE,
  HBCE_SELF_PILOT_ACCOUNT_ID,
  HBCE_SELF_PILOT_HUMAN_IPR,
  HBCE_SELF_PILOT_SUBSCRIPTION_ID,
  HBCE_SELF_PILOT_SUBSCRIPTION_TIER,
  HBCE_SELF_PILOT_TENANT_ID,
  HBCE_SELF_PILOT_WORKSPACE_ID,
  HBCE_TARGET_RELEASE
} from "@/lib/ipr-database-schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROUTE_NAME = "HBCE IPR Memory Save Chat Route";
const ROUTE_VERSION = "HBCE-IPR-MEMORY-SAVE-CHAT-v1.7";
const THREAD_AUTHORITY_RUNTIME_VALIDATED = "SERVER_RUNTIME_VALIDATED";
const THREAD_SCOPE_RUNTIME_ONLY = "RUNTIME_ONLY";
const SAVE_INTENT_USER_EXPLICIT_TO_IPR = "USER_EXPLICIT_SAVE_TO_IPR";
const RUNTIME_DECISION_ALLOW = "ALLOW";
const RUNTIME_DECISION_BLOCK = "BLOCK";
const RUNTIME_DECISION_ESCALATE = "ESCALATE";
const DEFAULT_RUNTIME_IPR = "IPR-AI-0001";
const DEFAULT_THREAD_TITLE = "JOKER-C2 IPR saved chat";
const DEFAULT_MEMORY_TITLE = "Saved JOKER-C2 chat on IPR";
const DEFAULT_MEMORY_SUMMARY =
  "Explicit user-authorized JOKER-C2 chat save bound to IPR as Intenzione Primaria Radicale.";
const MAX_MESSAGE_INPUT = 300;
const MAX_MESSAGE_CONTENT_LENGTH = 80_000;

type JsonRecord = Record<string, unknown>;

type SaveChatMessageInput = {
  messageId?: string | null;
  role?: string | null;
  content?: string | null;
  evtId?: string | null;
  opcProofId?: string | null;
  opcChainHash?: string | null;
  runtimeState?: string | null;
  runtimeDecision?: string | null;
  generationClass?: string | null;
  messageVisibility?: string | null;
  createdAt?: string | Date | null;
  metadata?: JsonRecord | null;
};

type SaveChatRouteInput = {
  confirmSaveToIpr?: boolean | string | number | null;
  humanIpr?: string | null;
  runtimeIpr?: string | null;
  tenantId?: string | null;
  workspaceId?: string | null;
  subscriptionId?: string | null;
  accountId?: string | null;
  sessionId?: string | null;
  threadId?: string | null;
  threadTitle?: string | null;
  memoryTitle?: string | null;
  memorySummary?: string | null;
  primaryIntention?: string | null;
  radicalIntention?: string | null;
  saveIntent?: string | null;
  saveScope?: string | null;
  classification?: string | null;
  evtId?: string | null;
  opcProofId?: string | null;
  auditId?: string | null;
  usageId?: string | null;
  previousSaveHash?: string | null;
  selectedMessageIds?: unknown;
  messages?: unknown;
  messageCount?: number | string | null;
  saveRaw?: boolean | string | number | null;
  saveSynthesis?: boolean | string | number | null;
  reusableInPrompt?: boolean | string | number | null;
  rawContentSaved?: boolean | string | number | null;
  rawContentPolicy?: string | null;
  createThreadIfMissing?: boolean | string | number | null;
  persistProvidedMessages?: boolean | string | number | null;
  strictIdentity?: boolean | string | number | null;
  temporalCertificate?: JsonRecord | null;
  createdAt?: string | Date | null;
  payload?: JsonRecord | null;
  metadata?: JsonRecord | null;
};

type SaveChatRouteContext = {
  confirmSaveToIpr: boolean;
  humanIpr: string | null;
  runtimeIpr: string;
  tenantId: string | null;
  workspaceId: string | null;
  subscriptionId: string | null;
  accountId: string | null;
  sessionId: string | null;
  threadId: string | null;
  threadTitle: string;
  memoryTitle: string;
  memorySummary: string;
  primaryIntention: string;
  radicalIntention: string;
  saveIntent: string;
  saveScope: string;
  classification: string;
  evtId: string | null;
  opcProofId: string | null;
  auditId: string | null;
  usageId: string | null;
  previousSaveHash: string | null;
  selectedMessageIds: string[];
  messages: SaveChatMessageInput[];
  messageCount: number;
  saveRaw: boolean;
  saveSynthesis: boolean;
  reusableInPrompt: boolean;
  rawContentSaved: boolean;
  rawContentPolicy: string;
  createThreadIfMissing: boolean;
  persistProvidedMessages: boolean;
  strictIdentity: boolean;
  temporalCertificate: JsonRecord;
  responseUtc: string;
  birthAnchorLocal: string;
  birthAnchorUtc: string;
  jokerLifetime: string;
  jokerLifeSeconds: number;
  createdAt: string | Date | null;
  payload: JsonRecord;
  metadata: JsonRecord;
};

function jsonResponse(payload: JsonRecord, init?: ResponseInit) {
  return NextResponse.json(
    {
      ...payload,
      route: ROUTE_NAME,
      routeVersion: ROUTE_VERSION,
      schemaVersion: HBCE_DATABASE_SCHEMA_VERSION,
      persistenceMode: HBCE_DATABASE_PERSISTENCE_MODE,
      legalCertification: false,
      boundary:
        "Save this chat to IPR is an explicit user-authorized operational memory endpoint. It creates technical SaaS records only, not legal certification, not qualified timestamping and not public authority validation."
    },
    init
  );
}

function normalizeString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function truncateString(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, Math.max(0, maxLength - 20))}\n[TRUNCATED_BY_ROUTE]`;
}

function normalizeTimestampForDatabase(value: unknown, fallbackIso: string | null = null): string | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? fallbackIso : value.toISOString();
  }

  if (typeof value !== "string") {
    return fallbackIso;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return fallbackIso;
  }

  const directDate = new Date(trimmed);
  if (!Number.isNaN(directDate.getTime())) {
    return directDate.toISOString();
  }

  const italianDateTime = trimmed.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:,?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
  );

  if (italianDateTime) {
    const [, dayRaw, monthRaw, yearRaw, hourRaw = "0", minuteRaw = "0", secondRaw = "0"] = italianDateTime;
    const day = Number.parseInt(dayRaw, 10);
    const month = Number.parseInt(monthRaw, 10);
    const year = Number.parseInt(yearRaw, 10);
    const hour = Number.parseInt(hourRaw, 10);
    const minute = Number.parseInt(minuteRaw, 10);
    const second = Number.parseInt(secondRaw, 10);

    const valid =
      year >= 1970 &&
      month >= 1 &&
      month <= 12 &&
      day >= 1 &&
      day <= 31 &&
      hour >= 0 &&
      hour <= 23 &&
      minute >= 0 &&
      minute <= 59 &&
      second >= 0 &&
      second <= 59;

    if (valid) {
      const normalizedLocal = `${yearRaw}-${monthRaw.padStart(2, "0")}-${dayRaw.padStart(2, "0")}T${hourRaw.padStart(
        2,
        "0"
      )}:${minuteRaw.padStart(2, "0")}:${secondRaw.padStart(2, "0")}+02:00`;
      const parsedItalianDate = new Date(normalizedLocal);
      if (!Number.isNaN(parsedItalianDate.getTime())) {
        return parsedItalianDate.toISOString();
      }
    }
  }

  return fallbackIso;
}

function normalizeRuntimeDecisionForDatabase(value: unknown): string {
  const normalized = normalizeString(value);
  if (!normalized) {
    return RUNTIME_DECISION_ALLOW;
  }

  const token = normalized
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  if (!token) {
    return RUNTIME_DECISION_ALLOW;
  }

  if (token === RUNTIME_DECISION_BLOCK || token.includes("BLOCK") || token.includes("DENY") || token.includes("FAIL_CLOSED")) {
    return RUNTIME_DECISION_BLOCK;
  }

  if (token === RUNTIME_DECISION_ESCALATE || token.includes("ESCALATE") || token.includes("HUMAN_REVIEW")) {
    return RUNTIME_DECISION_ESCALATE;
  }

  return RUNTIME_DECISION_ALLOW;
}

function normalizeRuntimeStateForDatabase(value: unknown): string | null {
  const normalized = normalizeString(value);
  if (!normalized) {
    return null;
  }

  const token = normalized
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  if (!token) {
    return null;
  }

  /*
   * Legacy Neon/Postgres databases may still expose chat_messages_runtime_state_check.
   * Runtime state has evolved from a small enum into a descriptive runtime label
   * such as COMPLETED, ACCESS_GRANTED, ASSISTANT_RESPONSE, USER_MESSAGE or
   * JOKER_C2_SAAS_CORE_HEALTHY. Passing those labels directly can violate the
   * legacy check. We store the raw value in metadata and keep the database column
   * null, which is valid for CHECK constraints and avoids corrupt enum mapping.
   */
  return null;
}



function buildFallbackMemoryId(context: SaveChatRouteContext, savedChatId: string | null): string {
  const seed = [
    "HBCE-IPR-MEMORY-FALLBACK",
    context.humanIpr ?? "NO_HUMAN_IPR",
    context.threadId ?? "NO_THREAD",
    savedChatId ?? "NO_SAVED_CHAT",
    context.evtId ?? "NO_EVT",
    context.primaryIntention
  ].join("|");

  return `MEM-IPR-${createHash("sha256").update(seed).digest("hex").slice(0, 16).toUpperCase()}`;
}

function buildFallbackRegisteredEventId(memoryId: string, eventName: string): string {
  return `REVT-${createHash("sha256").update(`${memoryId}|${eventName}`).digest("hex").slice(0, 16).toUpperCase()}`;
}

function buildFallbackMemoryKeyHash(context: SaveChatRouteContext): string {
  return createHash("sha256")
    .update(
      [
        context.humanIpr ?? "NO_HUMAN_IPR",
        context.runtimeIpr,
        context.tenantId ?? "NO_TENANT",
        context.workspaceId ?? "NO_WORKSPACE",
        context.sessionId ?? "NO_SESSION",
        context.threadId ?? "NO_THREAD",
        "IPR_BOUND_EXPLICIT_SAVE"
      ].join("|")
    )
    .digest("hex");
}

async function persistFallbackMemoryRecordToDatabase(input: {
  context: SaveChatRouteContext;
  savedChatId: string | null;
  memoryId: string | null;
  selectedMessageIds: string[];
  providedMessagesPersisted: number;
}) {
  const memoryId = input.memoryId ?? buildFallbackMemoryId(input.context, input.savedChatId);
  const memoryKeyHash = buildFallbackMemoryKeyHash(input.context);
  const recordPayload: JsonRecord = {
    source: "SAVE_CHAT_ROUTE_MEMORY_RECORD_FALLBACK",
    routeVersion: ROUTE_VERSION,
    savedChatId: input.savedChatId,
    memoryId,
    primaryIntention: input.context.primaryIntention,
    radicalIntention: input.context.radicalIntention,
    selectedMessageIds: input.selectedMessageIds,
    providedMessagesPersisted: input.providedMessagesPersisted,
    evtId: input.context.evtId,
    opcProofId: input.context.opcProofId,
    auditId: input.context.auditId,
    usageId: input.context.usageId,
    policy: {
      saveRaw: input.context.saveRaw,
      saveSynthesis: input.context.saveSynthesis,
      reusableInPrompt: input.context.reusableInPrompt,
      rawContentSaved: input.context.rawContentSaved,
      rawContentPolicy: input.context.rawContentPolicy,
      legalCertification: false
    },
    boundary: {
      opc: "technical proof receipt only",
      legalCertification: false
    }
  };
  const memoryHash = createHash("sha256").update(JSON.stringify(recordPayload)).digest("hex");
  const memoryChainHash = createHash("sha256")
    .update(`${input.context.previousSaveHash ?? "NO_PREVIOUS_SAVE"}|${memoryHash}`)
    .digest("hex");

  return queryHbceDatabase<Record<string, unknown>>(
    `
INSERT INTO memory_records (
  memory_id,
  tenant_id,
  workspace_id,
  memory_key_hash,
  human_ipr,
  runtime_ipr,
  session_id,
  thread_id,
  scope,
  authority,
  persistence_mode,
  memory_kind,
  memory_status,
  source_kind,
  source_thread_id,
  source_saved_chat_id,
  source_message_ids,
  memory_title,
  memory_summary,
  save_raw,
  save_synthesis,
  reusable_in_prompt,
  classification,
  quality,
  threshold_detected,
  semantic_terms,
  memory_hash,
  memory_chain_hash,
  last_evt_id,
  last_opc_proof_id,
  last_opc_chain_hash,
  temporal_certificate,
  response_utc,
  birth_anchor_local,
  birth_anchor_utc,
  joker_lifetime,
  joker_life_seconds,
  record_payload,
  legal_certification,
  created_at,
  updated_at
)
VALUES (
  $1, $2, $3, $4, $5, COALESCE($6, 'IPR-AI-0001'), COALESCE($7, $8, $9),
  $8, 'RUNTIME_ONLY', 'SESSION_RUNTIME_ONLY', 'DATABASE_PERSISTENT', 'RUNTIME_MEMORY',
  'ACTIVE', 'RUNTIME_MEMORY', $8, $10, COALESCE($11::jsonb, '[]'::jsonb),
  $12, $13, $14, $15, $16, $17, 'CANONICAL', true,
  '[]'::jsonb, $18, $19, $20, $21, $22, COALESCE($23::jsonb, '{}'::jsonb),
  COALESCE($24::timestamptz, now()), $25, $26::timestamptz, $27, $28,
  COALESCE($29::jsonb, '{}'::jsonb), false, COALESCE($24::timestamptz, now()), now()
)
ON CONFLICT (memory_id)
DO UPDATE SET
  tenant_id = EXCLUDED.tenant_id,
  workspace_id = EXCLUDED.workspace_id,
  memory_key_hash = EXCLUDED.memory_key_hash,
  human_ipr = EXCLUDED.human_ipr,
  runtime_ipr = EXCLUDED.runtime_ipr,
  session_id = EXCLUDED.session_id,
  thread_id = EXCLUDED.thread_id,
  source_thread_id = EXCLUDED.source_thread_id,
  source_saved_chat_id = EXCLUDED.source_saved_chat_id,
  source_message_ids = EXCLUDED.source_message_ids,
  memory_title = EXCLUDED.memory_title,
  memory_summary = EXCLUDED.memory_summary,
  save_raw = EXCLUDED.save_raw,
  save_synthesis = EXCLUDED.save_synthesis,
  reusable_in_prompt = EXCLUDED.reusable_in_prompt,
  classification = EXCLUDED.classification,
  quality = EXCLUDED.quality,
  threshold_detected = EXCLUDED.threshold_detected,
  memory_hash = EXCLUDED.memory_hash,
  memory_chain_hash = EXCLUDED.memory_chain_hash,
  last_evt_id = EXCLUDED.last_evt_id,
  last_opc_proof_id = EXCLUDED.last_opc_proof_id,
  last_opc_chain_hash = EXCLUDED.last_opc_chain_hash,
  temporal_certificate = EXCLUDED.temporal_certificate,
  response_utc = EXCLUDED.response_utc,
  birth_anchor_local = EXCLUDED.birth_anchor_local,
  birth_anchor_utc = EXCLUDED.birth_anchor_utc,
  joker_lifetime = EXCLUDED.joker_lifetime,
  joker_life_seconds = EXCLUDED.joker_life_seconds,
  record_payload = EXCLUDED.record_payload,
  legal_certification = false,
  updated_at = now()
RETURNING *;
`.trim(),
    [
      memoryId,
      input.context.tenantId,
      input.context.workspaceId,
      memoryKeyHash,
      input.context.humanIpr,
      input.context.runtimeIpr,
      input.context.sessionId,
      input.context.threadId,
      input.context.humanIpr,
      input.savedChatId,
      JSON.stringify(input.selectedMessageIds),
      input.context.memoryTitle,
      input.context.memorySummary,
      input.context.saveRaw,
      input.context.saveSynthesis,
      input.context.reusableInPrompt,
      input.context.classification,
      memoryHash,
      memoryChainHash,
      input.context.evtId,
      input.context.opcProofId,
      null,
      JSON.stringify(input.context.temporalCertificate),
      input.context.responseUtc,
      input.context.birthAnchorLocal,
      input.context.birthAnchorUtc,
      input.context.jokerLifetime,
      input.context.jokerLifeSeconds,
      JSON.stringify(recordPayload)
    ]
  );
}

async function persistFallbackRegisteredEventToDatabase(input: {
  context: SaveChatRouteContext;
  savedChatId: string | null;
  memoryId: string;
}) {
  const eventName = input.context.memoryTitle || input.context.primaryIntention || "Saved JOKER-C2 chat on IPR";
  const registeredEventId = buildFallbackRegisteredEventId(input.memoryId, eventName);
  const payload: JsonRecord = {
    source: "SAVE_CHAT_ROUTE_REGISTERED_EVENT_FALLBACK",
    routeVersion: ROUTE_VERSION,
    registeredEventId,
    savedChatId: input.savedChatId,
    memoryId: input.memoryId,
    eventName,
    evtId: input.context.evtId,
    opcProofId: input.context.opcProofId,
    auditId: input.context.auditId,
    usageId: input.context.usageId,
    legalCertification: false
  };
  const continuityHash = createHash("sha256").update(JSON.stringify(payload)).digest("hex");

  return queryHbceDatabase<Record<string, unknown>>(
    `
INSERT INTO memory_registered_events (
  registered_event_id,
  tenant_id,
  workspace_id,
  subscription_id,
  account_id,
  human_ipr,
  runtime_ipr,
  memory_id,
  source_saved_chat_id,
  evt_id,
  opc_proof_id,
  audit_id,
  usage_id,
  event_name,
  event_scope,
  event_status,
  continuity_hash,
  temporal_certificate,
  response_utc,
  birth_anchor_local,
  birth_anchor_utc,
  joker_lifetime,
  joker_life_seconds,
  payload,
  legal_certification,
  created_at
)
VALUES (
  $1, $2, $3, $4, $5, $6, COALESCE($7, 'IPR-AI-0001'), $8, $9, $10,
  $11, $12, $13, $14, 'IPR_BOUND', 'ACTIVE', $15, COALESCE($16::jsonb, '{}'::jsonb),
  COALESCE($17::timestamptz, now()), $18, $19::timestamptz, $20, $21,
  COALESCE($22::jsonb, '{}'::jsonb), false, COALESCE($17::timestamptz, now())
)
ON CONFLICT (registered_event_id)
DO UPDATE SET
  tenant_id = EXCLUDED.tenant_id,
  workspace_id = EXCLUDED.workspace_id,
  subscription_id = EXCLUDED.subscription_id,
  account_id = EXCLUDED.account_id,
  human_ipr = EXCLUDED.human_ipr,
  runtime_ipr = EXCLUDED.runtime_ipr,
  memory_id = EXCLUDED.memory_id,
  source_saved_chat_id = EXCLUDED.source_saved_chat_id,
  evt_id = EXCLUDED.evt_id,
  opc_proof_id = EXCLUDED.opc_proof_id,
  audit_id = EXCLUDED.audit_id,
  usage_id = EXCLUDED.usage_id,
  event_name = EXCLUDED.event_name,
  event_scope = EXCLUDED.event_scope,
  event_status = EXCLUDED.event_status,
  continuity_hash = EXCLUDED.continuity_hash,
  temporal_certificate = EXCLUDED.temporal_certificate,
  response_utc = EXCLUDED.response_utc,
  birth_anchor_local = EXCLUDED.birth_anchor_local,
  birth_anchor_utc = EXCLUDED.birth_anchor_utc,
  joker_lifetime = EXCLUDED.joker_lifetime,
  joker_life_seconds = EXCLUDED.joker_life_seconds,
  payload = EXCLUDED.payload,
  legal_certification = false
RETURNING *;
`.trim(),
    [
      registeredEventId,
      input.context.tenantId,
      input.context.workspaceId,
      input.context.subscriptionId,
      input.context.accountId,
      input.context.humanIpr,
      input.context.runtimeIpr,
      input.memoryId,
      input.savedChatId,
      input.context.evtId,
      input.context.opcProofId,
      input.context.auditId,
      input.context.usageId,
      eventName,
      continuityHash,
      JSON.stringify(input.context.temporalCertificate),
      input.context.responseUtc,
      input.context.birthAnchorLocal,
      input.context.birthAnchorUtc,
      input.context.jokerLifetime,
      input.context.jokerLifeSeconds,
      JSON.stringify(payload)
    ]
  );
}

function readHeaderString(request: NextRequest, name: string): string | null {
  return normalizeString(request.headers.get(name));
}

function coalesceString(...values: unknown[]): string | null {
  for (const value of values) {
    const normalized = normalizeString(value);
    if (normalized) {
      return normalized;
    }
  }

  return null;
}

function coalesceBoolean(defaultValue: boolean, ...values: unknown[]): boolean {
  for (const value of values) {
    if (typeof value === "boolean") {
      return value;
    }

    if (typeof value === "number") {
      return value !== 0;
    }

    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (["1", "true", "yes", "y", "on", "allow", "confirmed", "confirm"].includes(normalized)) {
        return true;
      }
      if (["0", "false", "no", "n", "off", "deny", "denied"].includes(normalized)) {
        return false;
      }
    }
  }

  return defaultValue;
}

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}


function extractErrorDiagnostics(error: unknown): JsonRecord {
  const record = isRecord(error) ? error : {};
  const name =
    error instanceof Error ? error.name : normalizeString(record.name) ?? "UnknownError";
  const message =
    error instanceof Error ? error.message : normalizeString(record.message) ?? String(error);

  return {
    name,
    message,
    code: normalizeString(record.code),
    constraint: normalizeString(record.constraint),
    table: normalizeString(record.table),
    column: normalizeString(record.column),
    detail: normalizeString(record.detail),
    hint: normalizeString(record.hint),
    severity: normalizeString(record.severity)
  };
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .map((item) => normalizeString(item))
        .filter((item): item is string => Boolean(item))
    )
  );
}

function normalizeMessages(value: unknown): SaveChatMessageInput[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .slice(0, MAX_MESSAGE_INPUT)
    .filter(isRecord)
    .map((message) => {
      const content = normalizeString(message.content);
      return {
        messageId: normalizeString(message.messageId) ?? normalizeString(message.id),
        role: normalizeString(message.role) ?? "user",
        content: content ? truncateString(content, MAX_MESSAGE_CONTENT_LENGTH) : null,
        evtId: normalizeString(message.evtId),
        opcProofId: normalizeString(message.opcProofId),
        opcChainHash: normalizeString(message.opcChainHash),
        runtimeState: normalizeRuntimeStateForDatabase(message.runtimeState),
        runtimeDecision: normalizeRuntimeDecisionForDatabase(message.runtimeDecision),
        generationClass: normalizeString(message.generationClass),
        messageVisibility: normalizeString(message.messageVisibility),
        createdAt: normalizeTimestampForDatabase(message.createdAt),
        metadata: isRecord(message.metadata) ? message.metadata : null
      };
    })
    .filter((message) => Boolean(message.content));
}

function parseInteger(value: unknown, fallback: number): number {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number.parseInt(value, 10)
        : Number.NaN;

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.max(0, Math.round(parsed));
}

function buildMessageId(index: number): string {
  return `CHAT-MSG-${Date.now()}-${index + 1}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

function buildJokerLifetime(now: Date) {
  const birth = new Date(HBCE_JOKER_C2_BIRTH_ANCHOR_UTC);
  const seconds = Math.max(0, Math.floor((now.getTime() - birth.getTime()) / 1000));
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);

  return {
    seconds,
    label: `${days}d ${hours}h ${minutes}m since ${HBCE_JOKER_C2_BIRTH_ANCHOR_LOCAL}`
  };
}

function buildTemporalCertificate(input: {
  base?: JsonRecord | null;
  responseUtc: string;
  jokerLifetime: string;
  jokerLifeSeconds: number;
}): JsonRecord {
  return {
    ...(input.base ?? {}),
    certificateName: HBCE_JOKER_C2_TEMPORAL_CERTIFICATE_NAME,
    responseUtc: input.responseUtc,
    birthAnchorLocal: HBCE_JOKER_C2_BIRTH_ANCHOR_LOCAL,
    birthAnchorUtc: HBCE_JOKER_C2_BIRTH_ANCHOR_UTC,
    birthTimeZone: HBCE_JOKER_C2_BIRTH_TIME_ZONE,
    jokerLifetime: input.jokerLifetime,
    jokerLifeSeconds: input.jokerLifeSeconds,
    currentOperationalEvt: HBCE_CURRENT_OPERATIONAL_EVT,
    currentOperationalAiEvt: HBCE_CURRENT_OPERATIONAL_AI_EVT,
    eventFamily: HBCE_CURRENT_EVENT_FAMILY,
    operationalCycle: HBCE_CURRENT_OPERATIONAL_CYCLE,
    monthlyReference: HBCE_MONTHLY_REFERENCE,
    targetRelease: HBCE_TARGET_RELEASE,
    boundary: HBCE_JOKER_C2_TEMPORAL_CERTIFICATE_BOUNDARY,
    legalCertification: false
  };
}

async function readInputFromRequest(request: NextRequest): Promise<SaveChatRouteInput> {
  try {
    const body = (await request.json()) as SaveChatRouteInput | null;
    return isRecord(body) ? body : {};
  } catch {
    return {};
  }
}

function resolveContext(request: NextRequest, input: SaveChatRouteInput): SaveChatRouteContext {
  const strictIdentity = coalesceBoolean(false, input.strictIdentity, readHeaderString(request, "x-hbce-strict-identity"));
  const now = new Date();
  const responseUtc = now.toISOString();
  const lifetime = buildJokerLifetime(now);

  const humanIpr = coalesceString(
    input.humanIpr,
    readHeaderString(request, "x-hbce-human-ipr"),
    readHeaderString(request, "x-ipr-human"),
    strictIdentity ? null : HBCE_SELF_PILOT_HUMAN_IPR
  );

  const tenantId = coalesceString(
    input.tenantId,
    readHeaderString(request, "x-hbce-tenant-id"),
    strictIdentity ? null : HBCE_SELF_PILOT_TENANT_ID
  );

  const workspaceId = coalesceString(
    input.workspaceId,
    readHeaderString(request, "x-hbce-workspace-id"),
    strictIdentity ? null : HBCE_SELF_PILOT_WORKSPACE_ID
  );

  const subscriptionId = coalesceString(
    input.subscriptionId,
    readHeaderString(request, "x-hbce-subscription-id"),
    strictIdentity ? null : HBCE_SELF_PILOT_SUBSCRIPTION_ID
  );

  const accountId = coalesceString(
    input.accountId,
    readHeaderString(request, "x-hbce-account-id"),
    strictIdentity ? null : HBCE_SELF_PILOT_ACCOUNT_ID
  );

  const threadId = coalesceString(input.threadId, readHeaderString(request, "x-hbce-thread-id"));
  const messages = normalizeMessages(input.messages);
  const selectedMessageIds = normalizeStringArray(input.selectedMessageIds);
  const primaryIntention =
    coalesceString(input.primaryIntention, input.radicalIntention, input.memorySummary, input.memoryTitle) ??
    DEFAULT_MEMORY_SUMMARY;
  const saveRaw = coalesceBoolean(false, input.saveRaw);
  const rawContentSaved = coalesceBoolean(saveRaw, input.rawContentSaved);
  const temporalCertificate = buildTemporalCertificate({
    base: isRecord(input.temporalCertificate) ? input.temporalCertificate : null,
    responseUtc,
    jokerLifetime: lifetime.label,
    jokerLifeSeconds: lifetime.seconds
  });

  return {
    confirmSaveToIpr: coalesceBoolean(
      false,
      input.confirmSaveToIpr,
      readHeaderString(request, "x-hbce-confirm-save-to-ipr")
    ),
    humanIpr,
    runtimeIpr: coalesceString(input.runtimeIpr, readHeaderString(request, "x-hbce-runtime-ipr")) ?? DEFAULT_RUNTIME_IPR,
    tenantId,
    workspaceId,
    subscriptionId,
    accountId,
    sessionId: coalesceString(input.sessionId, readHeaderString(request, "x-hbce-session-id")),
    threadId,
    threadTitle: coalesceString(input.threadTitle, input.memoryTitle) ?? DEFAULT_THREAD_TITLE,
    memoryTitle: coalesceString(input.memoryTitle) ?? DEFAULT_MEMORY_TITLE,
    memorySummary: coalesceString(input.memorySummary, input.primaryIntention, input.radicalIntention) ?? DEFAULT_MEMORY_SUMMARY,
    primaryIntention,
    radicalIntention: coalesceString(input.radicalIntention, input.primaryIntention) ?? primaryIntention,
    saveIntent: coalesceString(input.saveIntent) ?? SAVE_INTENT_USER_EXPLICIT_TO_IPR,
    saveScope: coalesceString(input.saveScope) ?? "IPR_BOUND",
    classification: coalesceString(input.classification) ?? "USER_SELECTED_CHAT_MEMORY",
    evtId: coalesceString(input.evtId, readHeaderString(request, "x-hbce-evt-id")),
    opcProofId: coalesceString(input.opcProofId, readHeaderString(request, "x-hbce-opc-proof-id")),
    auditId: coalesceString(input.auditId, readHeaderString(request, "x-hbce-audit-id")),
    usageId: coalesceString(input.usageId, readHeaderString(request, "x-hbce-usage-id")),
    previousSaveHash: coalesceString(input.previousSaveHash),
    selectedMessageIds,
    messages,
    messageCount: parseInteger(input.messageCount, selectedMessageIds.length || messages.length),
    saveRaw,
    saveSynthesis: coalesceBoolean(true, input.saveSynthesis),
    reusableInPrompt: coalesceBoolean(true, input.reusableInPrompt),
    rawContentSaved,
    rawContentPolicy:
      coalesceString(input.rawContentPolicy) ??
      (rawContentSaved ? "FULL_CHAT_CONTENT_USER_AUTHORIZED" : "SYNTHESIS_ONLY_BY_DEFAULT"),
    createThreadIfMissing: coalesceBoolean(true, input.createThreadIfMissing),
    persistProvidedMessages: coalesceBoolean(messages.length > 0, input.persistProvidedMessages),
    strictIdentity,
    temporalCertificate,
    responseUtc,
    birthAnchorLocal: HBCE_JOKER_C2_BIRTH_ANCHOR_LOCAL,
    birthAnchorUtc: HBCE_JOKER_C2_BIRTH_ANCHOR_UTC,
    jokerLifetime: lifetime.label,
    jokerLifeSeconds: lifetime.seconds,
    createdAt: normalizeTimestampForDatabase(input.createdAt, responseUtc),
    payload: {
      ...(isRecord(input.payload) ? input.payload : {}),
      iprSaaSMeaning: {
        identityPrimaryRecord:
          "IPR binds the biological or operational subject to tenant, workspace, session, EVT, OPC and audit.",
        intenzionePrimariaRadicale:
          "IPR also stores the primary radical intention selected from the chat when the user explicitly presses Save this chat to IPR.",
        saveMode: "EXPLICIT_USER_ACTION",
        legalCertification: false
      },
      selfPilot: {
        subscriptionTier: HBCE_SELF_PILOT_SUBSCRIPTION_TIER
      }
    },
    metadata: isRecord(input.metadata) ? input.metadata : {}
  };
}

function buildPublicDiagnostics(result: Awaited<ReturnType<typeof saveIprChatToMemoryDatabase>>) {
  return {
    saveResult: {
      ok: result.saveResult.ok,
      rowCount: result.saveResult.rowCount,
      status: result.saveResult.status,
      sqlHash: result.saveResult.sqlHash,
      durationMs: result.saveResult.durationMs,
      error: result.saveResult.error
    },
    memoryResult: {
      ok: result.memoryResult.ok,
      rowCount: result.memoryResult.rowCount,
      status: result.memoryResult.status,
      sqlHash: result.memoryResult.sqlHash,
      durationMs: result.memoryResult.durationMs,
      error: result.memoryResult.error
    },
    registeredEventResult: {
      ok: result.registeredEventResult.ok,
      rowCount: result.registeredEventResult.rowCount,
      status: result.registeredEventResult.status,
      sqlHash: result.registeredEventResult.sqlHash,
      durationMs: result.registeredEventResult.durationMs,
      error: result.registeredEventResult.error
    },
    threadResult: {
      ok: result.threadResult.ok,
      rowCount: result.threadResult.rowCount,
      status: result.threadResult.status,
      sqlHash: result.threadResult.sqlHash,
      durationMs: result.threadResult.durationMs,
      error: result.threadResult.error
    },
    messageUpdateResult: {
      ok: result.messageUpdateResult.ok,
      rowCount: result.messageUpdateResult.rowCount,
      status: result.messageUpdateResult.status,
      sqlHash: result.messageUpdateResult.sqlHash,
      durationMs: result.messageUpdateResult.durationMs,
      error: result.messageUpdateResult.error
    }
  };
}

async function persistProvidedMessages(context: SaveChatRouteContext) {
  if (!context.persistProvidedMessages || !context.threadId || context.messages.length === 0) {
    return [];
  }

  const results = await Promise.all(
    context.messages.map((message, index) => {
      const input: IprChatMessageDatabaseInput = {
        messageId: normalizeString(message.messageId) ?? buildMessageId(index),
        tenantId: context.tenantId,
        workspaceId: context.workspaceId,
        threadId: context.threadId as string,
        humanIpr: context.humanIpr,
        runtimeIpr: context.runtimeIpr,
        sessionId: context.sessionId,
        role: normalizeString(message.role) ?? "user",
        content: normalizeString(message.content) ?? "[EMPTY_MESSAGE]",
        evtId: normalizeString(message.evtId) ?? context.evtId,
        opcProofId: normalizeString(message.opcProofId) ?? context.opcProofId,
        opcChainHash: normalizeString(message.opcChainHash),
        temporalCertificate: context.temporalCertificate,
        responseUtc: context.responseUtc,
        birthAnchorLocal: context.birthAnchorLocal,
        birthAnchorUtc: context.birthAnchorUtc,
        jokerLifetime: context.jokerLifetime,
        jokerLifeSeconds: context.jokerLifeSeconds,
        runtimeState: normalizeRuntimeStateForDatabase(message.runtimeState),
        runtimeDecision: normalizeRuntimeDecisionForDatabase(message.runtimeDecision),
        generationClass: normalizeString(message.generationClass) ?? "CHAT_MEMORY_SAVE",
        messageVisibility: normalizeString(message.messageVisibility) ?? "THREAD",
        includedInIprMemory: true,
        saveCandidate: false,
        contentHashPolicy: context.rawContentSaved
          ? "FULL_CONTENT_HASHED_USER_AUTHORIZED"
          : "THREAD_CONTENT_HASHED_SYNTHESIS_MEMORY",
        metadata: {
          ...(message.metadata ?? {}),
          source: "IPR_MEMORY_SAVE_CHAT_ROUTE",
          originalRuntimeState: normalizeString(message.runtimeState) ?? "IPR_MEMORY_SAVE_ROUTE",
          runtimeStateDatabasePolicy: "NULL_TO_SATISFY_LEGACY_CHAT_MESSAGES_RUNTIME_STATE_CHECK",
          rawContentSavedInMemory: context.rawContentSaved,
          legalCertification: false
        },
        createdAt: normalizeTimestampForDatabase(message.createdAt, context.responseUtc)
      };

      return persistIprChatMessageToDatabase(input);
    })
  );

  return results;
}

async function buildSavePayload(request: NextRequest) {
  const input = await readInputFromRequest(request);
  const context = resolveContext(request, input);

  if (!context.confirmSaveToIpr) {
    return jsonResponse(
      {
        ok: false,
        status: "SAVE_TO_IPR_CONFIRMATION_REQUIRED",
        error:
          "confirmSaveToIpr=true is required. Persistent IPR memory saves must be explicit user-authorized actions, not automatic chat side effects.",
        requiredField: "confirmSaveToIpr",
        context: {
          threadId: context.threadId,
          humanIpr: context.humanIpr,
          tenantId: context.tenantId,
          workspaceId: context.workspaceId
        }
      },
      { status: 400 }
    );
  }

  if (context.strictIdentity && !context.humanIpr) {
    return jsonResponse(
      {
        ok: false,
        status: "IPR_IDENTITY_REQUIRED",
        error:
          "humanIpr is required when strictIdentity=true. The save-chat route refuses unbound persistent memory writes in strict B2G mode.",
        context: {
          humanIpr: null,
          tenantId: context.tenantId,
          workspaceId: context.workspaceId,
          strictIdentity: true
        }
      },
      { status: 400 }
    );
  }

  if (!context.threadId) {
    return jsonResponse(
      {
        ok: false,
        status: "THREAD_ID_REQUIRED",
        error: "threadId is required to save a JOKER-C2 chat on IPR.",
        context: {
          humanIpr: context.humanIpr,
          tenantId: context.tenantId,
          workspaceId: context.workspaceId
        }
      },
      { status: 400 }
    );
  }

  const databaseReady = await ensureHbceDatabaseReady();

  if (!databaseReady.ok) {
    return jsonResponse(
      {
        ok: false,
        status: "DATABASE_NOT_READY",
        error:
          databaseReady.initialization.error ||
          "HBCE database is not ready for persistent IPR chat memory save.",
        database: {
          description: databaseReady.description,
          initialization: {
            ok: databaseReady.initialization.ok,
            status: databaseReady.initialization.status,
            rowCount: databaseReady.initialization.rowCount,
            error: databaseReady.initialization.error,
            durationMs: databaseReady.initialization.durationMs
          }
        }
      },
      { status: 503 }
    );
  }

  const threadUpsertResult = context.createThreadIfMissing
    ? await upsertIprChatThreadToDatabase({
        threadId: context.threadId,
        tenantId: context.tenantId,
        workspaceId: context.workspaceId,
        humanIpr: context.humanIpr,
        runtimeIpr: context.runtimeIpr,
        sessionId: context.sessionId,
        title: context.threadTitle,
        scope: THREAD_SCOPE_RUNTIME_ONLY,
        authority: THREAD_AUTHORITY_RUNTIME_VALIDATED,
        continuityRef: context.previousSaveHash,
        lastEvtId: context.evtId,
        lastOpcProofId: context.opcProofId,
        recentStatus: "ACTIVE",
        pinned: false,
        archived: false,
        lastMessagePreview: context.memorySummary,
        metadata: {
          ...context.metadata,
          createdOrTouchedBy: ROUTE_VERSION,
          threadAuthority: THREAD_AUTHORITY_RUNTIME_VALIDATED,
          threadScope: THREAD_SCOPE_RUNTIME_ONLY,
          iprMemoryScope: "IPR_BOUND_EXPLICIT_SAVE",
          saveIntent: context.saveIntent,
          legalCertification: false
        }
      })
    : null;

  if (threadUpsertResult && !threadUpsertResult.ok) {
    return jsonResponse(
      {
        ok: false,
        status: "THREAD_UPSERT_FAILED",
        error: threadUpsertResult.error || "Unable to create or update the IPR chat thread before save.",
        diagnostics: {
          rowCount: threadUpsertResult.rowCount,
          status: threadUpsertResult.status,
          sqlHash: threadUpsertResult.sqlHash,
          durationMs: threadUpsertResult.durationMs
        }
      },
      { status: 500 }
    );
  }

  const messagePersistResults = await persistProvidedMessages(context);
  const failedMessagePersist = messagePersistResults.find((result) => !result.ok);

  if (failedMessagePersist) {
    return jsonResponse(
      {
        ok: false,
        status: "MESSAGE_PERSISTENCE_FAILED",
        error:
          failedMessagePersist.error ||
          "One or more provided chat messages could not be persisted before the IPR memory save.",
        diagnostics: {
          persistedMessages: messagePersistResults.filter((result) => result.ok).length,
          failedMessages: messagePersistResults.filter((result) => !result.ok).length,
          firstFailure: {
            status: failedMessagePersist.status,
            sqlHash: failedMessagePersist.sqlHash,
            durationMs: failedMessagePersist.durationMs,
            error: failedMessagePersist.error
          }
        }
      },
      { status: 500 }
    );
  }

  const selectedMessageIds =
    context.selectedMessageIds.length > 0
      ? context.selectedMessageIds
      : messagePersistResults
          .flatMap((result) => result.rows)
          .map((row) => normalizeString(row.message_id))
          .filter((messageId): messageId is string => Boolean(messageId));

  let saveResult: Awaited<ReturnType<typeof saveIprChatToMemoryDatabase>>;

  try {
    saveResult = await saveIprChatToMemoryDatabase({
    tenantId: context.tenantId,
    workspaceId: context.workspaceId,
    subscriptionId: context.subscriptionId,
    accountId: context.accountId,
    humanIpr: context.humanIpr,
    runtimeIpr: context.runtimeIpr,
    sessionId: context.sessionId,
    threadId: context.threadId,
    evtId: context.evtId,
    opcProofId: context.opcProofId,
    auditId: context.auditId,
    usageId: context.usageId,
    saveIntent: context.saveIntent,
    primaryIntention: context.primaryIntention,
    radicalIntention: context.radicalIntention,
    saveScope: context.saveScope,
    saveStatus: "SAVED",
    memoryStatus: "ACTIVE",
    memoryTitle: context.memoryTitle,
    memorySummary: context.memorySummary,
    classification: context.classification,
    rawContentSaved: context.rawContentSaved,
    rawContentPolicy: context.rawContentPolicy,
    saveRaw: context.saveRaw,
    saveSynthesis: context.saveSynthesis,
    reusableInPrompt: context.reusableInPrompt,
    selectedMessageIds,
    messageCount: context.messageCount || selectedMessageIds.length,
    previousSaveHash: context.previousSaveHash,
    temporalCertificate: context.temporalCertificate,
    responseUtc: context.responseUtc,
    birthAnchorLocal: context.birthAnchorLocal,
    birthAnchorUtc: context.birthAnchorUtc,
    jokerLifetime: context.jokerLifetime,
    jokerLifeSeconds: context.jokerLifeSeconds,
    payload: {
      ...context.payload,
      threadTitle: context.threadTitle,
      selectedMessageIds,
      providedMessagesPersisted: messagePersistResults.length,
      rawContentSaved: context.rawContentSaved,
      rawContentPolicy: context.rawContentPolicy,
      routeVersion: ROUTE_VERSION
    },
    createdAt: context.createdAt
    });
  } catch (error) {
    return jsonResponse(
      {
        ok: false,
        status: "IPR_CHAT_MEMORY_SAVE_THROWN",
        error: error instanceof Error ? error.message : "Unhandled save-chat database error.",
        stage: "saveIprChatToMemoryDatabase",
        databaseOperation: "saveIprChatToMemoryDatabase",
        diagnostics: {
          routeVersion: ROUTE_VERSION,
          stage: "saveIprChatToMemoryDatabase",
          error: extractErrorDiagnostics(error),
          threadId: context.threadId,
          attemptedSelectedMessageIds: selectedMessageIds.length,
          persistedProvidedMessages: messagePersistResults.length,
          persistedProvidedMessageRows: messagePersistResults.reduce((total, result) => total + result.rowCount, 0),
          legalCertification: false
        }
      },
      { status: 207 }
    );
  }

  const publicSave = saveResult.saveResult.rows[0]
    ? toPublicIprChatMemorySave(saveResult.saveResult.rows[0])
    : null;
  const publicMemory = saveResult.memoryResult.rows[0]
    ? toPublicIprMemoryRecord(saveResult.memoryResult.rows[0])
    : null;
  const publicRegisteredEvent = saveResult.registeredEventResult.rows[0]
    ? toPublicRegisteredMemoryEvent(saveResult.registeredEventResult.rows[0])
    : null;
  const publicThread = saveResult.threadResult.rows[0]
    ? toPublicIprChatThread(saveResult.threadResult.rows[0])
    : threadUpsertResult?.rows[0]
      ? toPublicIprChatThread(threadUpsertResult.rows[0])
      : null;

  const publicPersistedMessages = messagePersistResults.flatMap((result) =>
    result.rows.map(toPublicIprChatMessage)
  );

  const fallbackMemoryResult = publicMemory
    ? null
    : await persistFallbackMemoryRecordToDatabase({
        context,
        savedChatId: saveResult.savedChatId,
        memoryId: saveResult.memoryId,
        selectedMessageIds,
        providedMessagesPersisted: messagePersistResults.length
      });

  const fallbackMemory = fallbackMemoryResult?.rows[0]
    ? toPublicIprMemoryRecord(fallbackMemoryResult.rows[0])
    : null;

  const effectiveMemory = publicMemory ?? fallbackMemory;
  const effectiveMemoryId =
    normalizeString((effectiveMemory as JsonRecord | null)?.memoryId) ?? saveResult.memoryId;

  const fallbackRegisteredEventResult = publicRegisteredEvent || !effectiveMemoryId
    ? null
    : await persistFallbackRegisteredEventToDatabase({
        context,
        savedChatId: saveResult.savedChatId,
        memoryId: effectiveMemoryId,
      });

  const fallbackRegisteredEvent = fallbackRegisteredEventResult?.rows[0]
    ? toPublicRegisteredMemoryEvent(fallbackRegisteredEventResult.rows[0])
    : null;

  const effectiveRegisteredEvent = publicRegisteredEvent ?? fallbackRegisteredEvent;
  const effectiveOk = Boolean(
    saveResult.saveResult.ok &&
      (publicMemory || (fallbackMemoryResult?.ok && fallbackMemory))
  );
  const httpStatus = effectiveOk ? 201 : 207;
  const status = effectiveOk
    ? publicMemory
      ? "IPR_CHAT_MEMORY_SAVED"
      : "IPR_CHAT_MEMORY_SAVED_WITH_ROUTE_MEMORY_FALLBACK"
    : "IPR_CHAT_MEMORY_SAVE_PARTIAL_OR_FAILED";

  return jsonResponse(
    {
      ok: effectiveOk,
      routeVersion: ROUTE_VERSION,
      status,
      context: {
        humanIpr: context.humanIpr,
        runtimeIpr: context.runtimeIpr,
        tenantId: context.tenantId,
        workspaceId: context.workspaceId,
        subscriptionId: context.subscriptionId,
        accountId: context.accountId,
        sessionId: context.sessionId,
        threadId: context.threadId,
        strictIdentity: context.strictIdentity,
        saveIntent: context.saveIntent,
        saveScope: context.saveScope,
        classification: context.classification
      },
      iprMeaning: {
        identityPrimaryRecord:
          "The verified operational identity chain binding subject, tenant, workspace, session, EVT, OPC and audit.",
        intenzionePrimariaRadicale:
          "The explicit primary radical intention selected by the user from this chat and persisted as reusable IPR-bound memory.",
        savedPrimaryIntention: context.primaryIntention
      },
      savedChatId: saveResult.savedChatId,
      memoryId: effectiveMemoryId,
      savedChat: publicSave,
      memory: effectiveMemory,
      registeredEvent: effectiveRegisteredEvent,
      thread: publicThread,
      persistedMessages: publicPersistedMessages,
      policy: {
        explicitUserAuthorization: context.confirmSaveToIpr,
        rawContentSaved: context.rawContentSaved,
        rawContentPolicy: context.rawContentPolicy,
        saveRaw: context.saveRaw,
        saveSynthesis: context.saveSynthesis,
        reusableInPrompt: context.reusableInPrompt,
        legalCertification: false
      },
      temporalCertificate: context.temporalCertificate,
      diagnostics: {
        routeStage: effectiveOk ? "SAVE_COMPLETED" : "SAVE_IPR_CHAT_TO_MEMORY_DATABASE_PARTIAL_OR_FAILED",
        controlledPartialFailure: !effectiveOk,
        databaseOperation: "saveIprChatToMemoryDatabase",
        database: {
          available: databaseReady.description.available,
          configured: databaseReady.description.configured,
          kind: databaseReady.description.kind,
          initializationStatus: databaseReady.initialization.status
        },
        threadUpsert: threadUpsertResult
          ? {
              ok: threadUpsertResult.ok,
              rowCount: threadUpsertResult.rowCount,
              status: threadUpsertResult.status,
              sqlHash: threadUpsertResult.sqlHash,
              durationMs: threadUpsertResult.durationMs,
              error: threadUpsertResult.error
            }
          : null,
        persistedProvidedMessages: {
          attempted: context.persistProvidedMessages,
          count: messagePersistResults.length,
          rowCount: messagePersistResults.reduce((total, result) => total + result.rowCount, 0)
        },
        save: buildPublicDiagnostics(saveResult),
        routeFallbackMemoryRecord: fallbackMemoryResult
          ? {
              attempted: true,
              ok: fallbackMemoryResult.ok,
              rowCount: fallbackMemoryResult.rowCount,
              status: fallbackMemoryResult.status,
              sqlHash: fallbackMemoryResult.sqlHash,
              durationMs: fallbackMemoryResult.durationMs,
              error: fallbackMemoryResult.error,
              memoryId: effectiveMemoryId
            }
          : {
              attempted: false,
              reason: publicMemory ? "LIBRARY_MEMORY_RECORD_PRESENT" : "NO_EFFECTIVE_MEMORY_ID"
            },
        routeFallbackRegisteredEvent: fallbackRegisteredEventResult
          ? {
              attempted: true,
              ok: fallbackRegisteredEventResult.ok,
              rowCount: fallbackRegisteredEventResult.rowCount,
              status: fallbackRegisteredEventResult.status,
              sqlHash: fallbackRegisteredEventResult.sqlHash,
              durationMs: fallbackRegisteredEventResult.durationMs,
              error: fallbackRegisteredEventResult.error
            }
          : {
              attempted: false,
              reason: publicRegisteredEvent ? "LIBRARY_REGISTERED_EVENT_PRESENT" : "NO_EFFECTIVE_MEMORY_ID"
            }
      }
    },
    { status: httpStatus }
  );
}

export async function GET() {
  return jsonResponse({
    ok: true,
    routeVersion: ROUTE_VERSION,
    status: "SAVE_CHAT_ROUTE_READY",
    method: "POST",
    required: {
      confirmSaveToIpr: true,
      threadId: "string"
    },
    optional: {
      humanIpr: "string; required in strictIdentity mode",
      primaryIntention:
        "string; canonical meaning: IPR as Intenzione Primaria Radicale saved from the chat",
      selectedMessageIds: "string[]",
      messages: "optional message snapshots to persist before save; createdAt is normalized to ISO, runtimeDecision is normalized to ALLOW/BLOCK/ESCALATE and runtimeState is stored legacy-safe before database insert; v1.7 creates a route-level fallback memory_records row when the library save creates saved_chat but no reusable memory record",
      saveRaw: "boolean; default false",
      saveSynthesis: "boolean; default true",
      reusableInPrompt: "boolean; default true"
    },
    iprMeaning: {
      identityPrimaryRecord: "Operational identity chain.",
      intenzionePrimariaRadicale: "Primary radical intention explicitly selected for persistent memory."
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    return await buildSavePayload(request);
  } catch (error) {
    return jsonResponse(
      {
        ok: false,
        status: "SAVE_CHAT_ROUTE_THROWN",
        error: error instanceof Error ? error.message : "Unknown save-chat IPR memory route error.",
        stage: "POST_OUTER_CATCH",
        diagnostics: {
          routeVersion: ROUTE_VERSION,
          stage: "POST_OUTER_CATCH",
          error: extractErrorDiagnostics(error),
          legalCertification: false
        }
      },
      { status: 207 }
    );
  }
}
