/**
 * AI JOKER-C2 EVT Ledger
 *
 * Append-only ledger for HBCE / MATRIX runtime events.
 *
 * This module supports:
 * - append-only EVT persistence
 * - database-backed EVT persistence target
 * - previous event reference lookup
 * - previous event hash lookup
 * - event reading
 * - event lookup by EVT ID
 * - chain verification
 * - public-safe ledger summaries
 * - compatibility with OPC proof receipts
 *
 * Prototype note:
 * The file-based JSONL ledger is suitable for local and prototype use.
 * Controlled deployment requires database storage, access control, backup,
 * retention rules and external review.
 *
 * Serverless note:
 * On Vercel/serverless runtimes, local filesystem persistence may fail or
 * reset between invocations. Database persistence is therefore the SaaS target.
 *
 * EVT creates traceability.
 * OPC creates the audit-oriented proof receipt.
 *
 * EVT does not create legal authorization, certification or compliance.
 */


import { appendFile, mkdir, readFile, stat, writeFile } from "fs/promises";
import os from "os";
import path from "path";
import { createHash } from "node:crypto";


import type { RuntimeEvent, VerificationStatus } from "./runtime-types";


import {
  buildEventChainReference,
  buildEventLine,
  isRuntimeEventHashValid,
  isRuntimeEventStructurallyValid,
  parseEventLine,
  summarizeRuntimeEvent,
  verifyRuntimeEvent
} from "./evt";


import {
  verifyRuntimeEventChain,
  type RuntimeEventBatchVerificationReport
} from "./evt-verify";


import {
  isHbceDatabaseAvailable,
  isHbceDatabaseConfigured,
  queryHbceDatabase
} from "./ipr-database";


import type {
  HbceDatabaseQueryRow,
  HbceDatabaseQueryValue
} from "./ipr-database";


const DEFAULT_LEDGER_FILENAME = "hbce-ai-joker-c2-events.jsonl";


export const DEFAULT_LEDGER_DIR =
  process.env.JOKER_EVT_LEDGER_DIR ||
  process.env.HBCE_EVT_LEDGER_DIR ||
  path.join(os.tmpdir(), "hbce-ai-joker-c2");


export const DEFAULT_LEDGER_FILE =
  process.env.JOKER_EVT_LEDGER_FILE ||
  process.env.HBCE_EVT_LEDGER_FILE ||
  path.join(DEFAULT_LEDGER_DIR, DEFAULT_LEDGER_FILENAME);


export const EVT_LEDGER_DATABASE_TABLE = "evt_records";


export type LedgerAppendStatus = "APPENDED" | "REJECTED" | "FAILED";


export type LedgerReadStatus = "READY" | "EMPTY" | "MISSING" | "FAILED";


export type EvtDatabasePersistenceStatus =
  | "PERSISTED"
  | "DATABASE_NOT_CONFIGURED"
  | "DATABASE_NOT_AVAILABLE"
  | "DATABASE_TABLE_MISSING"
  | "DATABASE_SCHEMA_UNSUPPORTED"
  | "DATABASE_WRITE_FAILED"
  | "DATABASE_SKIPPED";


export type EvtPersistenceMode =
  | "PROCESS_FILE_LEDGER"
  | "DATABASE_PERSISTENT_TARGET"
  | "DATABASE_PERSISTENT"
  | "FAILED";


export type EvtDatabasePersistenceResult = {
  ok: boolean;
  status: EvtDatabasePersistenceStatus;
  mode: EvtPersistenceMode;
  evt: string;
  prev: string;
  hash: string;
  chainHash: string;
  table: string;
  writtenColumns: string[];
  error: string | null;
  legalCertification: false;
};


export type LedgerAppendResult = {
  ok: boolean;
  status: LedgerAppendStatus;
  evt?: string;
  prev?: string;
  hash?: string;
  chainReference?: string;
  ledgerPath: string;
  reason: string;
  verificationStatus?: VerificationStatus;
  alreadyPresent?: boolean;
  database?: EvtDatabasePersistenceResult;
  legalCertification?: false;
};


export type LedgerReadResult = {
  ok: boolean;
  status: LedgerReadStatus;
  ledgerPath: string;
  events: RuntimeEvent[];
  invalidLines: number;
  summary: LedgerSummary;
  reason: string;
};


export type LedgerSummary = {
  ledgerPath: string;
  totalEvents: number;
  lastEvent: string;
  lastPrev: string;
  lastHash: string;
  lastChainReference: string;
  lastProjectDomain: string;
  lastHbceModule: string;
  verificationStatus: VerificationStatus;
  invalidLines: number;
  hashValid: boolean;
  chainValid: boolean;
};


export type LedgerLookupResult = {
  found: boolean;
  event?: RuntimeEvent;
  ledgerPath: string;
  reason: string;
};


export type LedgerIntegrityResult = {
  status: VerificationStatus;
  ledgerPath: string;
  totalEvents: number;
  invalidLines: number;
  hashValid: boolean;
  chainValid: boolean;
  warnings: string[];
  verification: RuntimeEventBatchVerificationReport;
};


export type EventReference = {
  evt: string;
  prev: string;
  hash: string;
  chainReference: string;
  projectDomain: string;
  hbceModule: string;
};


export type EvtLedgerHealth = {
  configured: true;
  fileLedgerPath: string;
  databaseConfigured: boolean;
  databaseAvailable: boolean;
  databaseTable: typeof EVT_LEDGER_DATABASE_TABLE;
  databaseTarget: "DATABASE_PERSISTENT";
  legalCertification: false;
  boundary: string;
};


type EventDatabaseFields = {
  evtId: string;
  prevEvtId: string | null;
  evtHash: string;
  chainHash: string;
  runtimeIpr: string | null;
  humanIpr: string | null;
  tenantId: string | null;
  workspaceId: string | null;
  subscriptionId: string | null;
  sessionId: string | null;
  threadId: string | null;
  opcProofId: string | null;
  auditId: string | null;
  memoryId: string | null;
  accountId: string | null;
  usageId: string | null;
  eventName: string | null;
  eventFamily: string | null;
  cycle: string | null;
  source: string | null;
  saasTier: string | null;
  eventKind: string;
  runtimeState: string;
  runtimeDecision: string;
  projectDomain: string | null;
  hbceModule: string | null;
  payloadJson: string;
  legalCertification: false;
};


type EventColumnValue = {
  column: string;
  value: HbceDatabaseQueryValue;
  jsonb?: boolean;
};


type InformationSchemaColumnRow = HbceDatabaseQueryRow & {
  column_name?: string;
};


type EvtDatabaseRow = HbceDatabaseQueryRow & {
  evt_id?: string;
  event_id?: string;
  evt_hash?: string;
  event_hash?: string;
  chain_hash?: string;
};


type SafeEventSummary = {
  projectDomain: string;
  hbceModule: string;
};


const NO_EVT_DATABASE_COLUMNS: string[] = [];


function sha256(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}


function sha256Prefixed(value: unknown): string {
  return `sha256:${sha256(value)}`;
}


function stableStringify(value: unknown): string {
  if (value === null || value === undefined) {
    return String(value);
  }


  if (typeof value !== "object") {
    return JSON.stringify(value);
  }


  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }


  const record = value as Record<string, unknown>;


  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(",")}}`;
}


function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}


function getPathValue(value: unknown, pathParts: string[]): unknown {
  let current: unknown = value;


  for (const key of pathParts) {
    if (!isRecord(current)) {
      return undefined;
    }


    current = current[key];
  }


  return current;
}


function firstStringPath(
  value: unknown,
  paths: string[][],
  fallback: string | null = null
): string | null {
  for (const pathParts of paths) {
    const candidate = getPathValue(value, pathParts);


    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }


    if (typeof candidate === "number" || typeof candidate === "boolean") {
      return String(candidate);
    }
  }


  return fallback;
}


function nullableText(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }


  const trimmed = value.trim();


  if (!trimmed) {
    return null;
  }


  const normalized = trimmed.toUpperCase();


  if (
    normalized === "NONE" ||
    normalized === "NULL" ||
    normalized === "UNKNOWN" ||
    normalized === "NOT_AVAILABLE" ||
    normalized === "NOT_VERIFIED" ||
    normalized === "NO_TENANT" ||
    normalized === "NO_WORKSPACE" ||
    normalized === "NO_SUBSCRIPTION" ||
    normalized === "NO_SESSION" ||
    normalized === "NO_THREAD" ||
    normalized === "NO_OPC" ||
    normalized === "NO_AUDIT" ||
    normalized === "NO_MEMORY"
  ) {
    return null;
  }


  return trimmed;
}


function safeDatabaseError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }


  if (typeof error === "string") {
    return error;
  }


  try {
    return JSON.stringify(error);
  } catch {
    return "UNKNOWN_EVT_DATABASE_ERROR";
  }
}


function toDatabaseValue(value: string | number | boolean | null): HbceDatabaseQueryValue {
  return value;
}


function normalizeDatabaseRuntimeDecision(value: string | null): string | null {
  if (!value) {
    return null;
  }


  const normalized = value.toUpperCase();


  if (
    normalized === "ALLOW" ||
    normalized === "BLOCK" ||
    normalized === "ESCALATE" ||
    normalized === "FAIL_CLOSED"
  ) {
    return normalized;
  }


  if (
    normalized === "ACCESS_GRANTED" ||
    normalized === "ACCESS_GRANTED_ACCOUNT_SESSION" ||
    normalized === "COMPLETED" ||
    normalized === "OK"
  ) {
    return "ALLOW";
  }


  if (
    normalized === "SERVER_VALIDATION_REQUIRED" ||
    normalized === "PENDING_SERVER_VALIDATION" ||
    normalized === "ACCESS_LIMITED" ||
    normalized === "MATRIX_LIMITED" ||
    normalized === "NOT_VERIFIED"
  ) {
    return "ESCALATE";
  }


  if (normalized === "DENIED" || normalized === "REJECTED" || normalized === "ACCESS_DENIED") {
    return "BLOCK";
  }


  return null;
}


function normalizeDatabaseRuntimeState(value: string | null): string | null {
  if (!value) {
    return null;
  }


  const normalized = value.toUpperCase();


  if (
    normalized === "OPERATIONAL" ||
    normalized === "BLOCKED" ||
    normalized === "INVALID" ||
    normalized === "COMPLETED" ||
    normalized === "FAILED" ||
    normalized === "DEGRADED" ||
    normalized === "AUDIT_ONLY" ||
    normalized === "MAINTENANCE" ||
    normalized === "UNKNOWN"
  ) {
    return normalized;
  }


  if (
    normalized === "LOCAL_FALLBACK" ||
    normalized === "OPENAI_CONFIGURED" ||
    normalized === "ONLINE" ||
    normalized === "ALLOW" ||
    normalized === "ACCESS_GRANTED" ||
    normalized === "MATRIX_ACTIVE"
  ) {
    return "OPERATIONAL";
  }


  if (
    normalized === "PROVIDER_ERROR" ||
    normalized === "DATABASE_WRITE_FAILED" ||
    normalized === "MATRIX_LIMITED"
  ) {
    return "DEGRADED";
  }


  if (normalized === "BLOCK") {
    return "BLOCKED";
  }


  if (normalized === "FAIL_CLOSED") {
    return "INVALID";
  }


  return null;
}


function safeSummarizeRuntimeEvent(event: RuntimeEvent): SafeEventSummary {
  const eventRecord = event as unknown;


  const fallbackProjectDomain =
    firstStringPath(
      eventRecord,
      [
        ["projectDomain"],
        ["project_domain"],
        ["runtime", "projectDomain"],
        ["runtime", "project_domain"],
        ["context", "projectDomain"],
        ["context", "project_domain"],
        ["payload", "projectDomain"],
        ["payload", "project_domain"],
        ["payload", "saas", "project"]
      ],
      "GENERAL"
    ) ?? "GENERAL";


  const fallbackHbceModule =
    firstStringPath(
      eventRecord,
      [
        ["hbceModule"],
        ["hbce_module"],
        ["runtime", "hbceModule"],
        ["runtime", "hbce_module"],
        ["context", "hbceModule"],
        ["context", "hbce_module"],
        ["payload", "hbceModule"],
        ["payload", "hbce_module"],
        ["payload", "hbceModuleName"]
      ],
      "NONE"
    ) ?? "NONE";


  try {
    const summary = summarizeRuntimeEvent(event) as Partial<SafeEventSummary>;


    return {
      projectDomain:
        typeof summary.projectDomain === "string" && summary.projectDomain.trim()
          ? summary.projectDomain
          : fallbackProjectDomain,
      hbceModule:
        typeof summary.hbceModule === "string" && summary.hbceModule.trim()
          ? summary.hbceModule
          : fallbackHbceModule
    };
  } catch {
    return {
      projectDomain: fallbackProjectDomain,
      hbceModule: fallbackHbceModule
    };
  }
}


function safeEventId(event: RuntimeEvent): string {
  const eventRecord = event as unknown;


  return (
    firstStringPath(
      eventRecord,
      [
        ["evt"],
        ["id"],
        ["eventId"],
        ["event_id"]
      ],
      null
    ) || "EVT-UNKNOWN"
  );
}


function safePreviousEventId(event: RuntimeEvent): string {
  const eventRecord = event as unknown;


  return (
    firstStringPath(
      eventRecord,
      [
        ["prev"],
        ["previousEvt"],
        ["previous_evt"],
        ["prevEvtId"],
        ["prev_evt_id"],
        ["previousEventId"],
        ["previous_event_id"]
      ],
      null
    ) || "GENESIS"
  );
}


function safeEventChainReference(event: Partial<RuntimeEvent>): string {
  const eventRecord = event as unknown;
  const evt =
    firstStringPath(
      eventRecord,
      [
        ["evt"],
        ["id"],
        ["eventId"],
        ["event_id"]
      ],
      null
    ) || "UNKNOWN_EVT";


  const hash =
    firstStringPath(
      eventRecord,
      [
        ["trace", "hash"],
        ["hash"],
        ["evtHash"],
        ["evt_hash"],
        ["eventHash"],
        ["event_hash"],
        ["anchors", "hash"],
        ["anchors", "publicHash"],
        ["anchors", "fullHash"]
      ],
      null
    ) || null;


  if (evt && hash) {
    return `${evt}:${hash}`;
  }


  return evt;
}


function safeEventHash(event: RuntimeEvent): string {
  const eventRecord = event as unknown;


  return (
    firstStringPath(
      eventRecord,
      [
        ["trace", "hash"],
        ["hash"],
        ["evtHash"],
        ["evt_hash"],
        ["eventHash"],
        ["event_hash"],
        ["anchors", "hash"],
        ["anchors", "publicHash"],
        ["anchors", "fullHash"]
      ],
      null
    ) || sha256Prefixed(event)
  );
}


function buildEventChainHash(event: RuntimeEvent): string {
  return sha256Prefixed({
    evt: safeEventId(event),
    prev: safePreviousEventId(event),
    hash: safeEventHash(event),
    chainReference: safeEventChainReference(event)
  });
}


function buildEventDatabaseFields(event: RuntimeEvent): EventDatabaseFields {
  const summary = safeSummarizeRuntimeEvent(event);
  const eventRecord = event as unknown;


  const evtId = safeEventId(event);
  const prevEvtId = safePreviousEventId(event);
  const evtHash = safeEventHash(event);
  const chainHash = buildEventChainHash(event);


  const runtimeIpr = firstStringPath(
    eventRecord,
    [
      ["runtime", "ipr"],
      ["identity", "runtimeIpr"],
      ["identity", "runtime_ipr"],
      ["runtimeIpr"],
      ["runtime_ipr"]
    ],
    null
  );


  const humanIpr = firstStringPath(
    eventRecord,
    [
      ["identity", "humanIpr"],
      ["identity", "human_ipr"],
      ["subject", "ipr"],
      ["verifiedSubject", "ipr"],
      ["humanIpr"],
      ["human_ipr"],
      ["subjectIpr"],
      ["subject_ipr"]
    ],
    null
  );


  const tenantId = firstStringPath(
    eventRecord,
    [
      ["saas", "tenantId"],
      ["saas", "tenant_id"],
      ["tenantId"],
      ["tenant_id"]
    ],
    null
  );


  const workspaceId = firstStringPath(
    eventRecord,
    [
      ["saas", "workspaceId"],
      ["saas", "workspace_id"],
      ["workspaceId"],
      ["workspace_id"]
    ],
    null
  );


  const subscriptionId = firstStringPath(
    eventRecord,
    [
      ["saas", "subscriptionId"],
      ["saas", "subscription_id"],
      ["subscriptionId"],
      ["subscription_id"]
    ],
    null
  );


  const sessionId = firstStringPath(
    eventRecord,
    [
      ["sessionId"],
      ["session_id"],
      ["session", "id"],
      ["runtime", "sessionId"]
    ],
    null
  );


  const threadId = firstStringPath(
    eventRecord,
    [
      ["threadId"],
      ["thread_id"],
      ["conversationId"],
      ["conversation_id"],
      ["runtime", "threadId"]
    ],
    null
  );


  const opcProofId = firstStringPath(
    eventRecord,
    [
      ["opcProofId"],
      ["opc_proof_id"],
      ["opc", "proofId"],
      ["opc", "id"],
      ["proof", "proofId"]
    ],
    null
  );


  const auditId = firstStringPath(
    eventRecord,
    [
      ["auditId"],
      ["audit_id"],
      ["audit", "auditId"],
      ["audit", "id"]
    ],
    null
  );


  const memoryId = firstStringPath(
    eventRecord,
    [
      ["memoryId"],
      ["memory_id"],
      ["memory", "id"],
      ["memory", "memoryId"]
    ],
    null
  );


  const accountId = firstStringPath(
    eventRecord,
    [
      ["saas", "accountId"],
      ["saas", "account_id"],
      ["accountId"],
      ["account_id"],
      ["identity", "accountId"],
      ["identity", "account_id"]
    ],
    null
  );


  const usageId = firstStringPath(
    eventRecord,
    [
      ["usageId"],
      ["usage_id"],
      ["usage", "usageId"],
      ["usage", "id"],
      ["modelUsage", "usageId"],
      ["model_usage", "usage_id"]
    ],
    null
  );


  const eventName = firstStringPath(
    eventRecord,
    [
      ["eventName"],
      ["event_name"],
      ["namedEvent"],
      ["named_event"],
      ["memory", "eventName"],
      ["memory", "registeredEvent", "eventName"],
      ["payload", "eventName"],
      ["payload", "event_name"]
    ],
    null
  );


  const eventFamily = firstStringPath(
    eventRecord,
    [
      ["eventFamily"],
      ["event_family"],
      ["family"],
      ["runtime", "eventFamily"],
      ["payload", "eventFamily"]
    ],
    "UP-EVT"
  );


  const cycle = firstStringPath(
    eventRecord,
    [
      ["cycle"],
      ["runtime", "cycle"],
      ["payload", "cycle"]
    ],
    "UP-CANONICO"
  );


  const source = firstStringPath(
    eventRecord,
    [
      ["source"],
      ["saas", "source"],
      ["runtime", "source"],
      ["payload", "source"]
    ],
    null
  );


  const saasTier = firstStringPath(
    eventRecord,
    [
      ["saas", "tier"],
      ["saas", "saasTier"],
      ["saas", "subscriptionTier"],
      ["tier"],
      ["saasTier"],
      ["subscriptionTier"]
    ],
    null
  );


  const runtimeDecision =
    normalizeDatabaseRuntimeDecision(
      firstStringPath(
        eventRecord,
        [
          ["decision"],
          ["runtimeDecision"],
          ["runtime_decision"],
          ["policy", "decision"],
          ["governance", "decision"],
          ["access", "decision"],
          ["identity", "accessDecision"]
        ],
        null
      )
    ) ?? "ALLOW";


  const runtimeState =
    normalizeDatabaseRuntimeState(
      firstStringPath(
        eventRecord,
        [
          ["state"],
          ["runtimeState"],
          ["runtime_state"],
          ["runtime", "state"],
          ["governance", "state"],
          ["matrix", "state"]
        ],
        null
      )
    ) ?? "OPERATIONAL";


  const eventKind =
    firstStringPath(
      eventRecord,
      [
        ["kind"],
        ["eventKind"],
        ["event_kind"],
        ["type"],
        ["event_type"]
      ],
      "RUNTIME_EVENT"
    ) ?? "RUNTIME_EVENT";


  const payload = {
    ...((isRecord(eventRecord) ? eventRecord : {}) as Record<string, unknown>),
    evtDatabasePersistence: {
      table: EVT_LEDGER_DATABASE_TABLE,
      evt: evtId,
      prev: prevEvtId,
      hash: evtHash,
      eventHash: evtHash,
      evtHash,
      chainReference: safeEventChainReference(event),
      chainHash,
      runtimeState,
      runtimeDecision,
      projectDomain: summary.projectDomain,
      hbceModule: summary.hbceModule,
      runtimeIpr,
      humanIpr,
      tenantId,
      workspaceId,
      subscriptionId,
      sessionId,
      threadId,
      opcProofId,
      auditId,
      memoryId,
      accountId,
      usageId,
      eventName,
      eventFamily,
      cycle,
      source,
      saasTier,
      legalCertification: false
    }
  };


  return {
    evtId,
    prevEvtId: nullableText(prevEvtId),
    evtHash,
    chainHash,
    runtimeIpr: nullableText(runtimeIpr),
    humanIpr: nullableText(humanIpr),
    tenantId: nullableText(tenantId),
    workspaceId: nullableText(workspaceId),
    subscriptionId: nullableText(subscriptionId),
    sessionId: nullableText(sessionId),
    threadId: nullableText(threadId),
    opcProofId: nullableText(opcProofId),
    auditId: nullableText(auditId),
    memoryId: nullableText(memoryId),
    accountId: nullableText(accountId),
    usageId: nullableText(usageId),
    eventName: nullableText(eventName),
    eventFamily: nullableText(eventFamily),
    cycle: nullableText(cycle),
    source: nullableText(source),
    saasTier: nullableText(saasTier),
    eventKind,
    runtimeState,
    runtimeDecision,
    projectDomain: nullableText(summary.projectDomain),
    hbceModule: nullableText(summary.hbceModule),
    payloadJson: JSON.stringify(payload),
    legalCertification: false
  };
}


function quoteIdentifier(identifier: string): string {
  if (!/^[a-z_][a-z0-9_]*$/i.test(identifier)) {
    throw new Error(`Unsafe SQL identifier: ${identifier}`);
  }


  return `"${identifier}"`;
}


function chooseColumn(
  available: Set<string>,
  candidates: string[]
): string | null {
  for (const candidate of candidates) {
    if (available.has(candidate)) {
      return candidate;
    }
  }


  return null;
}


function hasColumnValue(target: EventColumnValue[], column: string): boolean {
  return target.some((item) => item.column === column);
}


function addColumnValue(
  target: EventColumnValue[],
  available: Set<string>,
  candidates: string[],
  value: HbceDatabaseQueryValue,
  options: { jsonb?: boolean; required?: boolean } = {}
): void {
  const column = chooseColumn(available, candidates);


  if (!column) {
    if (options.required) {
      throw new Error(`EVT schema missing required column: ${candidates.join(" | ")}`);
    }


    return;
  }


  if (hasColumnValue(target, column)) {
    return;
  }


  target.push({
    column,
    value,
    jsonb: options.jsonb
  });
}


function addEveryColumnValue(
  target: EventColumnValue[],
  available: Set<string>,
  candidates: string[],
  value: HbceDatabaseQueryValue,
  options: { jsonb?: boolean; required?: boolean } = {}
): void {
  let written = false;


  for (const column of candidates) {
    if (!available.has(column) || hasColumnValue(target, column)) {
      continue;
    }


    target.push({
      column,
      value,
      jsonb: options.jsonb
    });


    written = true;
  }


  if (!written && options.required) {
    throw new Error(`EVT schema missing required column: ${candidates.join(" | ")}`);
  }
}


async function getEvtDatabaseColumns(): Promise<Set<string>> {
  const result = await queryHbceDatabase<InformationSchemaColumnRow>(
    `
SELECT column_name
FROM information_schema.columns
WHERE table_name = $1
  AND table_schema IN ('public', current_schema())
ORDER BY ordinal_position;
`.trim(),
    [EVT_LEDGER_DATABASE_TABLE]
  );


  if (!result.ok) {
    return new Set(NO_EVT_DATABASE_COLUMNS);
  }


  const columns = result.rows
    .map((row) => row.column_name)
    .filter((column): column is string => typeof column === "string" && column.length > 0);


  return new Set(columns);
}


function buildEvtInsertStatement(input: {
  columns: EventColumnValue[];
}): {
  sql: string;
  params: HbceDatabaseQueryValue[];
  writtenColumns: string[];
} {
  const writtenColumns = input.columns.map((item) => item.column);
  const params: HbceDatabaseQueryValue[] = input.columns.map((item) => item.value);


  const insertColumns = input.columns
    .map((item) => quoteIdentifier(item.column))
    .join(",\n  ");


  const values = input.columns
    .map((item, index) => {
      const placeholder = `$${index + 1}`;
      return item.jsonb ? `${placeholder}::jsonb` : placeholder;
    })
    .join(",\n  ");


  const updateColumns = input.columns
    .filter((item) => item.column !== "evt_id" && item.column !== "event_id")
    .map((item) => {
      const quoted = quoteIdentifier(item.column);
      return `${quoted} = EXCLUDED.${quoted}`;
    });


  const conflictColumn = input.columns.some((item) => item.column === "evt_id")
    ? "evt_id"
    : input.columns.some((item) => item.column === "event_id")
      ? "event_id"
      : null;


  if (!conflictColumn) {
    throw new Error("EVT insert requires evt_id or event_id column.");
  }


  const updateSql =
    updateColumns.length > 0
      ? `DO UPDATE SET\n  ${updateColumns.join(",\n  ")}`
      : "DO NOTHING";


  const sql = `
INSERT INTO ${quoteIdentifier(EVT_LEDGER_DATABASE_TABLE)} (
  ${insertColumns}
)
VALUES (
  ${values}
)
ON CONFLICT (${quoteIdentifier(conflictColumn)}) ${updateSql}
RETURNING ${quoteIdentifier(conflictColumn)};
`.trim();


  return {
    sql,
    params,
    writtenColumns
  };
}


function buildEvtDatabaseColumnValues(
  available: Set<string>,
  fields: EventDatabaseFields
): EventColumnValue[] {
  const values: EventColumnValue[] = [];


  addEveryColumnValue(values, available, ["evt_id", "event_id"], toDatabaseValue(fields.evtId), {
    required: true
  });


  addEveryColumnValue(
    values,
    available,
    ["prev_evt_id", "prev_event_id", "prev"],
    toDatabaseValue(fields.prevEvtId)
  );


  addEveryColumnValue(
    values,
    available,
    ["evt_hash", "event_hash", "hash", "public_hash", "full_hash"],
    toDatabaseValue(fields.evtHash),
    {
      required: true
    }
  );


  addEveryColumnValue(values, available, ["chain_hash"], toDatabaseValue(fields.chainHash));
  addColumnValue(values, available, ["runtime_ipr"], toDatabaseValue(fields.runtimeIpr));
  addColumnValue(values, available, ["human_ipr", "subject_ipr"], toDatabaseValue(fields.humanIpr));
  addColumnValue(values, available, ["tenant_id"], toDatabaseValue(fields.tenantId));
  addColumnValue(values, available, ["workspace_id"], toDatabaseValue(fields.workspaceId));
  addColumnValue(values, available, ["subscription_id"], toDatabaseValue(fields.subscriptionId));
  addColumnValue(values, available, ["session_id"], toDatabaseValue(fields.sessionId));
  addColumnValue(values, available, ["thread_id"], toDatabaseValue(fields.threadId));
  addColumnValue(values, available, ["opc_proof_id"], toDatabaseValue(fields.opcProofId));
  addColumnValue(values, available, ["audit_id"], toDatabaseValue(fields.auditId));
  addColumnValue(values, available, ["memory_id"], toDatabaseValue(fields.memoryId));
  addColumnValue(values, available, ["account_id"], toDatabaseValue(fields.accountId));
  addColumnValue(values, available, ["usage_id"], toDatabaseValue(fields.usageId));
  addColumnValue(values, available, ["event_name", "named_event"], toDatabaseValue(fields.eventName));
  addColumnValue(values, available, ["event_family"], toDatabaseValue(fields.eventFamily));
  addColumnValue(values, available, ["cycle"], toDatabaseValue(fields.cycle));
  addColumnValue(values, available, ["source"], toDatabaseValue(fields.source));
  addColumnValue(values, available, ["saas_tier", "tier"], toDatabaseValue(fields.saasTier));


  addEveryColumnValue(
    values,
    available,
    ["event_kind", "event_type", "kind"],
    toDatabaseValue(fields.eventKind)
  );


  addEveryColumnValue(
    values,
    available,
    ["runtime_state", "state"],
    toDatabaseValue(fields.runtimeState)
  );


  addEveryColumnValue(
    values,
    available,
    ["runtime_decision", "decision"],
    toDatabaseValue(fields.runtimeDecision)
  );


  addColumnValue(values, available, ["project_domain"], toDatabaseValue(fields.projectDomain));
  addColumnValue(values, available, ["hbce_module"], toDatabaseValue(fields.hbceModule));


  addEveryColumnValue(
    values,
    available,
    ["payload", "event_payload"],
    toDatabaseValue(fields.payloadJson),
    {
      jsonb: true,
      required: true
    }
  );


  addColumnValue(values, available, ["legal_certification"], toDatabaseValue(false));


  return values;
}


export async function persistEventToDatabase(
  event: RuntimeEvent
): Promise<EvtDatabasePersistenceResult> {
  const fields = buildEventDatabaseFields(event);


  if (!isHbceDatabaseConfigured()) {
    return {
      ok: false,
      status: "DATABASE_NOT_CONFIGURED",
      mode: "PROCESS_FILE_LEDGER",
      evt: fields.evtId,
      prev: fields.prevEvtId ?? "",
      hash: fields.evtHash,
      chainHash: fields.chainHash,
      table: EVT_LEDGER_DATABASE_TABLE,
      writtenColumns: [],
      error: "DATABASE_URL is not configured. EVT remains file/process ledger only.",
      legalCertification: false
    };
  }


  if (!isHbceDatabaseAvailable()) {
    return {
      ok: false,
      status: "DATABASE_NOT_AVAILABLE",
      mode: "PROCESS_FILE_LEDGER",
      evt: fields.evtId,
      prev: fields.prevEvtId ?? "",
      hash: fields.evtHash,
      chainHash: fields.chainHash,
      table: EVT_LEDGER_DATABASE_TABLE,
      writtenColumns: [],
      error: "HBCE database adapter is not available. EVT remains file/process ledger only.",
      legalCertification: false
    };
  }


  try {
    const available = await getEvtDatabaseColumns();


    if (available.size === 0) {
      return {
        ok: false,
        status: "DATABASE_TABLE_MISSING",
        mode: "PROCESS_FILE_LEDGER",
        evt: fields.evtId,
        prev: fields.prevEvtId ?? "",
        hash: fields.evtHash,
        chainHash: fields.chainHash,
        table: EVT_LEDGER_DATABASE_TABLE,
        writtenColumns: [],
        error: "evt_records table was not found in the active database schema.",
        legalCertification: false
      };
    }


    const columnValues = buildEvtDatabaseColumnValues(available, fields);
    const statement = buildEvtInsertStatement({ columns: columnValues });


    const result = await queryHbceDatabase<EvtDatabaseRow>(
      statement.sql,
      statement.params
    );


    if (!result.ok) {
      return {
        ok: false,
        status: "DATABASE_WRITE_FAILED",
        mode: "FAILED",
        evt: fields.evtId,
        prev: fields.prevEvtId ?? "",
        hash: fields.evtHash,
        chainHash: fields.chainHash,
        table: EVT_LEDGER_DATABASE_TABLE,
        writtenColumns: statement.writtenColumns,
        error: result.error || "EVT_DATABASE_WRITE_FAILED",
        legalCertification: false
      };
    }


    return {
      ok: true,
      status: "PERSISTED",
      mode: "DATABASE_PERSISTENT",
      evt: fields.evtId,
      prev: fields.prevEvtId ?? "",
      hash: fields.evtHash,
      chainHash: fields.chainHash,
      table: EVT_LEDGER_DATABASE_TABLE,
      writtenColumns: statement.writtenColumns,
      error: null,
      legalCertification: false
    };
  } catch (error) {
    return {
      ok: false,
      status: "DATABASE_WRITE_FAILED",
      mode: "FAILED",
      evt: fields.evtId,
      prev: fields.prevEvtId ?? "",
      hash: fields.evtHash,
      chainHash: fields.chainHash,
      table: EVT_LEDGER_DATABASE_TABLE,
      writtenColumns: [],
      error: safeDatabaseError(error),
      legalCertification: false
    };
  }
}


export async function ensureLedger(
  ledgerPath = DEFAULT_LEDGER_FILE
): Promise<void> {
  const directory = path.dirname(ledgerPath);


  await mkdir(directory, { recursive: true });


  try {
    await stat(ledgerPath);
  } catch {
    await writeFile(ledgerPath, "", "utf8");
  }
}


export async function appendEvent(
  event: RuntimeEvent,
  ledgerPath = DEFAULT_LEDGER_FILE
): Promise<LedgerAppendResult> {
  let databasePersistence: EvtDatabasePersistenceResult | undefined;


  try {
    await ensureLedger(ledgerPath);


    const verification = verifyRuntimeEvent(event);


    if (!isRuntimeEventStructurallyValid(event)) {
      databasePersistence = await persistEventToDatabase(event);


      return {
        ok: databasePersistence.ok,
        status: databasePersistence.ok ? "APPENDED" : "REJECTED",
        evt: safeEventId(event),
        prev: safePreviousEventId(event),
        hash: safeEventHash(event),
        chainReference: safeEventChainReference(event),
        ledgerPath,
        verificationStatus: verification.status,
        alreadyPresent: false,
        database: databasePersistence,
        legalCertification: false,
        reason: databasePersistence.ok
          ? "Runtime event is structurally invalid for file ledger, but database persistence accepted the SaaS event contract."
          : [
              "Runtime event is structurally invalid and was not appended.",
              verification.reasons.join(" ")
            ].join(" ")
      };
    }


    if (!isRuntimeEventHashValid(event)) {
      databasePersistence = await persistEventToDatabase(event);


      return {
        ok: databasePersistence.ok,
        status: databasePersistence.ok ? "APPENDED" : "REJECTED",
        evt: safeEventId(event),
        prev: safePreviousEventId(event),
        hash: safeEventHash(event),
        chainReference: safeEventChainReference(event),
        ledgerPath,
        verificationStatus: verification.status,
        alreadyPresent: false,
        database: databasePersistence,
        legalCertification: false,
        reason: databasePersistence.ok
          ? "Runtime event hash is invalid for file ledger, but database persistence accepted the SaaS event contract."
          : [
              "Runtime event hash is invalid and was not appended.",
              `ExpectedHash: ${verification.expectedHash || "unavailable"}.`,
              `ActualHash: ${verification.actualHash || "unavailable"}.`
            ].join(" ")
      };
    }


    const existing = await readLedger(ledgerPath);


    if (existing.status === "FAILED") {
      databasePersistence = await persistEventToDatabase(event);


      return {
        ok: databasePersistence.ok,
        status: databasePersistence.ok ? "APPENDED" : "FAILED",
        evt: safeEventId(event),
        prev: safePreviousEventId(event),
        hash: safeEventHash(event),
        chainReference: safeEventChainReference(event),
        ledgerPath,
        verificationStatus: verification.status,
        alreadyPresent: false,
        database: databasePersistence,
        legalCertification: false,
        reason: databasePersistence.ok
          ? `File ledger read failed before append, but EVT database persistence succeeded: ${existing.reason}`
          : `Ledger read failed before append and database persistence failed: ${existing.reason}`
      };
    }


    const alreadyPresent = existing.events.some((item) =>
      isSameRuntimeEvent(item, event)
    );


    if (alreadyPresent) {
      databasePersistence = await persistEventToDatabase(event);


      return {
        ok: true,
        status: "APPENDED",
        evt: safeEventId(event),
        prev: safePreviousEventId(event),
        hash: safeEventHash(event),
        chainReference: safeEventChainReference(event),
        ledgerPath,
        verificationStatus: verification.status,
        alreadyPresent: true,
        database: databasePersistence,
        legalCertification: false,
        reason:
          "Runtime event is already present in the EVT ledger. Append treated as idempotent success."
      };
    }


    const continuity = validateAppendContinuity(existing.events, event);


    if (!continuity.ok) {
      databasePersistence = await persistEventToDatabase(event);


      return {
        ok: databasePersistence.ok,
        status: databasePersistence.ok ? "APPENDED" : "REJECTED",
        evt: safeEventId(event),
        prev: safePreviousEventId(event),
        hash: safeEventHash(event),
        chainReference: safeEventChainReference(event),
        ledgerPath,
        verificationStatus: verification.status,
        alreadyPresent: false,
        database: databasePersistence,
        legalCertification: false,
        reason: databasePersistence.ok
          ? `${continuity.reason} Database persistence accepted the event as an independent SaaS persistence target.`
          : continuity.reason
      };
    }


    const line = `${buildEventLine(event)}\n`;


    await appendFile(ledgerPath, line, "utf8");


    databasePersistence = await persistEventToDatabase(event);


    return {
      ok: true,
      status: "APPENDED",
      evt: safeEventId(event),
      prev: safePreviousEventId(event),
      hash: safeEventHash(event),
      chainReference: safeEventChainReference(event),
      ledgerPath,
      verificationStatus: verification.status,
      alreadyPresent: false,
      database: databasePersistence,
      legalCertification: false,
      reason:
        databasePersistence.ok
          ? "Runtime event appended to file ledger and persisted to database."
          : `${continuity.reason || "Runtime event appended to file ledger."} Database persistence did not complete: ${databasePersistence.error ?? databasePersistence.status}.`
    };
  } catch (error) {
    databasePersistence = await persistEventToDatabase(event).catch((databaseError) => ({
      ok: false,
      status: "DATABASE_WRITE_FAILED" as const,
      mode: "FAILED" as const,
      evt: safeEventId(event),
      prev: safePreviousEventId(event),
      hash: safeEventHash(event),
      chainHash: buildEventChainHash(event),
      table: EVT_LEDGER_DATABASE_TABLE,
      writtenColumns: [],
      error: safeDatabaseError(databaseError),
      legalCertification: false as const
    }));


    return {
      ok: databasePersistence.ok,
      status: databasePersistence.ok ? "APPENDED" : "FAILED",
      evt: safeEventId(event),
      prev: safePreviousEventId(event),
      hash: safeEventHash(event),
      chainReference: safeEventChainReference(event),
      ledgerPath,
      verificationStatus: "UNVERIFIED",
      alreadyPresent: false,
      database: databasePersistence,
      legalCertification: false,
      reason:
        error instanceof Error
          ? `EVT file ledger append failed: ${error.message}. Database status: ${databasePersistence.status}.`
          : `Unknown ledger append failure. Database status: ${databasePersistence.status}.`
    };
  }
}


export async function appendEvents(
  events: RuntimeEvent[],
  ledgerPath = DEFAULT_LEDGER_FILE
): Promise<LedgerAppendResult[]> {
  const results: LedgerAppendResult[] = [];


  for (const event of events) {
    results.push(await appendEvent(event, ledgerPath));
  }


  return results;
}


export async function readEvents(
  limit?: number,
  ledgerPath = DEFAULT_LEDGER_FILE
): Promise<RuntimeEvent[]> {
  const result = await readLedger(ledgerPath);


  if (typeof limit === "number" && limit > 0) {
    return result.events.slice(-limit);
  }


  return result.events;
}


export async function readLedger(
  ledgerPath = DEFAULT_LEDGER_FILE
): Promise<LedgerReadResult> {
  try {
    await ensureLedger(ledgerPath);


    const raw = await readFile(ledgerPath, "utf8");


    if (!raw.trim()) {
      return {
        ok: true,
        status: "EMPTY",
        ledgerPath,
        events: [],
        invalidLines: 0,
        summary: buildStaticLedgerSummary({
          ledgerPath,
          events: [],
          invalidLines: 0,
          verificationStatus: "UNVERIFIED",
          hashValid: true,
          chainValid: true
        }),
        reason: "Ledger exists but contains no events."
      };
    }


    const lines = raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);


    const events: RuntimeEvent[] = [];
    let invalidLines = 0;


    for (const line of lines) {
      const event = parseEventLine(line);


      if (!event) {
        invalidLines += 1;
        continue;
      }


      events.push(event);
    }


    const hashValid = events.every((event) => isRuntimeEventHashValid(event));
    const chainValid = verifyPreviousReferences(events);


    return {
      ok: true,
      status: events.length > 0 ? "READY" : "EMPTY",
      ledgerPath,
      events,
      invalidLines,
      summary: buildStaticLedgerSummary({
        ledgerPath,
        events,
        invalidLines,
        verificationStatus: inferLedgerVerificationStatus({
          totalEvents: events.length,
          invalidLines,
          hashValid,
          chainValid,
          verificationStatus:
            events.length > 0 && invalidLines === 0 && hashValid && chainValid
              ? "VERIFIABLE"
              : "PARTIAL"
        }),
        hashValid,
        chainValid
      }),
      reason:
        invalidLines > 0
          ? "Ledger read completed with invalid lines."
          : "Ledger read completed."
    };
  } catch (error) {
    return {
      ok: false,
      status: "FAILED",
      ledgerPath,
      events: [],
      invalidLines: 0,
      summary: buildStaticLedgerSummary({
        ledgerPath,
        events: [],
        invalidLines: 0,
        verificationStatus: "INVALID",
        hashValid: false,
        chainValid: false
      }),
      reason:
        error instanceof Error
          ? error.message
          : "Unknown ledger read failure."
    };
  }
}


export async function getLastEvent(
  ledgerPath = DEFAULT_LEDGER_FILE
): Promise<RuntimeEvent | null> {
  const events = await readEvents(undefined, ledgerPath);


  if (events.length === 0) {
    return null;
  }


  return events[events.length - 1] ?? null;
}


export async function getLastEventReference(
  ledgerPath = DEFAULT_LEDGER_FILE
): Promise<string> {
  const lastEvent = await getLastEvent(ledgerPath);


  return lastEvent?.evt ?? "GENESIS";
}


export async function getLastEventHash(
  ledgerPath = DEFAULT_LEDGER_FILE
): Promise<string> {
  const lastEvent = await getLastEvent(ledgerPath);


  return lastEvent?.trace.hash ?? "";
}


export async function getLastEventChainReference(
  ledgerPath = DEFAULT_LEDGER_FILE
): Promise<string> {
  const lastEvent = await getLastEvent(ledgerPath);


  return lastEvent ? buildEventChainReference(lastEvent) : "GENESIS";
}


export async function getLastEventReferenceObject(
  ledgerPath = DEFAULT_LEDGER_FILE
): Promise<EventReference | null> {
  const lastEvent = await getLastEvent(ledgerPath);


  if (!lastEvent) {
    return null;
  }


  const summary = safeSummarizeRuntimeEvent(lastEvent);


  return {
    evt: lastEvent.evt,
    prev: lastEvent.prev,
    hash: lastEvent.trace.hash,
    chainReference: buildEventChainReference(lastEvent),
    projectDomain: summary.projectDomain,
    hbceModule: summary.hbceModule
  };
}


export async function findEventById(
  evt: string,
  ledgerPath = DEFAULT_LEDGER_FILE
): Promise<LedgerLookupResult> {
  const normalizedEvt = evt.trim();


  if (!normalizedEvt) {
    return {
      found: false,
      ledgerPath,
      reason: "No EVT identifier was provided."
    };
  }


  const events = await readEvents(undefined, ledgerPath);
  const event = events.find((item) => item.evt === normalizedEvt);


  if (!event) {
    return {
      found: false,
      ledgerPath,
      reason: `Event ${normalizedEvt} was not found in the ledger.`
    };
  }


  return {
    found: true,
    event,
    ledgerPath,
    reason: `Event ${normalizedEvt} found.`
  };
}


export async function getEventById(
  evt: string,
  ledgerPath = DEFAULT_LEDGER_FILE
): Promise<RuntimeEvent | null> {
  const result = await findEventById(evt, ledgerPath);


  return result.event ?? null;
}


export async function verifyLedger(
  ledgerPath = DEFAULT_LEDGER_FILE
): Promise<LedgerIntegrityResult> {
  const readResult = await readLedger(ledgerPath);
  const events = readResult.events;


  if (readResult.status === "FAILED") {
    const verification = verifyRuntimeEventChain([]);


    return {
      status: "INVALID",
      ledgerPath,
      totalEvents: 0,
      invalidLines: 0,
      hashValid: false,
      chainValid: false,
      warnings: [`Ledger could not be read: ${readResult.reason}`],
      verification
    };
  }


  const verification = verifyRuntimeEventChain(events);


  const hashValid = events.every((event) => {
    const report = verifyRuntimeEvent(event);
    return report.hashMatches === true && report.status === "VERIFIABLE";
  });


  const chainValid = verifyPreviousReferences(events);
  const warnings = [
    ...verification.warnings,
    ...buildLedgerWarnings(readResult.invalidLines, hashValid, chainValid)
  ];


  return {
    status: inferLedgerVerificationStatus({
      totalEvents: events.length,
      invalidLines: readResult.invalidLines,
      hashValid,
      chainValid,
      verificationStatus: verification.status
    }),
    ledgerPath,
    totalEvents: events.length,
    invalidLines: readResult.invalidLines,
    hashValid,
    chainValid,
    warnings: uniqueWarnings(warnings),
    verification
  };
}


export async function buildLedgerSummary(
  ledgerPath = DEFAULT_LEDGER_FILE
): Promise<LedgerSummary> {
  const readResult = await readLedger(ledgerPath);
  const integrity = await verifyLedger(ledgerPath);


  return buildStaticLedgerSummary({
    ledgerPath,
    events: readResult.events,
    invalidLines: readResult.invalidLines,
    verificationStatus: integrity.status,
    hashValid: integrity.hashValid,
    chainValid: integrity.chainValid
  });
}


export async function clearLedgerForLocalDevelopmentOnly(
  ledgerPath = DEFAULT_LEDGER_FILE
): Promise<void> {
  await ensureLedger(ledgerPath);
  await writeFile(ledgerPath, "", "utf8");
}


export async function exportPublicLedgerView(
  limit?: number,
  ledgerPath = DEFAULT_LEDGER_FILE
): Promise<Array<ReturnType<typeof summarizeRuntimeEvent>>> {
  const events = await readEvents(limit, ledgerPath);


  return events.map((event) => {
    try {
      return summarizeRuntimeEvent(event);
    } catch {
      return safeSummarizeRuntimeEvent(event) as ReturnType<typeof summarizeRuntimeEvent>;
    }
  });
}


export async function buildLedgerDiagnostics(
  ledgerPath = DEFAULT_LEDGER_FILE
): Promise<Record<string, string | number | boolean>> {
  const summary = await buildLedgerSummary(ledgerPath);


  return {
    ledgerPath: summary.ledgerPath,
    totalEvents: summary.totalEvents,
    lastEvent: summary.lastEvent,
    lastPrev: summary.lastPrev,
    lastHash: summary.lastHash,
    lastChainReference: summary.lastChainReference,
    lastProjectDomain: summary.lastProjectDomain,
    lastHbceModule: summary.lastHbceModule,
    verificationStatus: summary.verificationStatus,
    invalidLines: summary.invalidLines,
    hashValid: summary.hashValid,
    chainValid: summary.chainValid
  };
}


export function getEvtLedgerHealth(): EvtLedgerHealth {
  const databaseConfigured = isHbceDatabaseConfigured();
  const databaseAvailable = isHbceDatabaseAvailable();


  return {
    configured: true,
    fileLedgerPath: DEFAULT_LEDGER_FILE,
    databaseConfigured,
    databaseAvailable,
    databaseTable: EVT_LEDGER_DATABASE_TABLE,
    databaseTarget: "DATABASE_PERSISTENT",
    legalCertification: false,
    boundary:
      databaseConfigured && databaseAvailable
        ? "EVT ledger is configured with database persistence target evt_records. File ledger remains best-effort for local/prototype continuity. EVT is technical traceability only; legalCertification=false."
        : "EVT ledger is currently limited to file/process persistence. Database persistence requires a configured and available HBCE database. EVT is technical traceability only; legalCertification=false."
  };
}


function buildStaticLedgerSummary(input: {
  ledgerPath: string;
  events: RuntimeEvent[];
  invalidLines: number;
  verificationStatus: VerificationStatus;
  hashValid: boolean;
  chainValid: boolean;
}): LedgerSummary {
  const lastEvent = input.events[input.events.length - 1] ?? null;
  const lastSummary = lastEvent ? safeSummarizeRuntimeEvent(lastEvent) : null;


  return {
    ledgerPath: input.ledgerPath,
    totalEvents: input.events.length,
    lastEvent: lastEvent?.evt ?? "GENESIS",
    lastPrev: lastEvent?.prev ?? "",
    lastHash: lastEvent?.trace.hash ?? "",
    lastChainReference: lastEvent ? buildEventChainReference(lastEvent) : "GENESIS",
    lastProjectDomain: lastSummary?.projectDomain ?? "GENERAL",
    lastHbceModule: lastSummary?.hbceModule ?? "NONE",
    verificationStatus: input.verificationStatus,
    invalidLines: input.invalidLines,
    hashValid: input.hashValid,
    chainValid: input.chainValid
  };
}


function validateAppendContinuity(
  events: RuntimeEvent[],
  nextEvent: RuntimeEvent
): { ok: boolean; reason: string } {
  if (!nextEvent.prev || !nextEvent.prev.trim()) {
    return {
      ok: false,
      reason: "Append continuity rejected: next event has no previous reference."
    };
  }


  if (events.length === 0) {
    return {
      ok: true,
      reason:
        nextEvent.prev === "GENESIS"
          ? "First event references GENESIS."
          : `First event references external runtime anchor ${nextEvent.prev}.`
    };
  }


  const lastEvent = events[events.length - 1];


  if (!lastEvent) {
    return {
      ok: false,
      reason: "Append continuity rejected: last ledger event is unavailable."
    };
  }


  if (nextEvent.prev !== lastEvent.evt) {
    return {
      ok: false,
      reason:
        `Append continuity rejected: next prev=${nextEvent.prev} does not match last evt=${lastEvent.evt}.`
    };
  }


  return {
    ok: true,
    reason: "Append continuity OK."
  };
}


function verifyPreviousReferences(events: RuntimeEvent[]): boolean {
  if (events.length === 0) {
    return true;
  }


  if (!events[0]?.prev) {
    return false;
  }


  for (let index = 1; index < events.length; index += 1) {
    const current = events[index];
    const previous = events[index - 1];


    if (!current || !previous) {
      return false;
    }


    if (current.prev !== previous.evt) {
      return false;
    }
  }


  return true;
}


function buildLedgerWarnings(
  invalidLines: number,
  hashValid: boolean,
  chainValid: boolean
): string[] {
  const warnings: string[] = [];


  if (invalidLines > 0) {
    warnings.push(`Ledger contains ${invalidLines} invalid line(s).`);
  }


  if (!hashValid) {
    warnings.push("One or more ledger event hashes are invalid.");
  }


  if (!chainValid) {
    warnings.push("Ledger previous-event continuity is invalid.");
  }


  warnings.push(
    "EVT ledger is a technical traceability layer and does not create legal certification by itself."
  );


  return warnings;
}


function inferLedgerVerificationStatus(input: {
  totalEvents: number;
  invalidLines: number;
  hashValid: boolean;
  chainValid: boolean;
  verificationStatus: VerificationStatus;
}): VerificationStatus {
  if (input.totalEvents === 0) {
    return "UNVERIFIED";
  }


  if (input.invalidLines > 0 || !input.hashValid) {
    return "INVALID";
  }


  if (!input.chainValid || input.verificationStatus === "PARTIAL") {
    return "PARTIAL";
  }


  return input.verificationStatus;
}


function isSameRuntimeEvent(left: RuntimeEvent, right: RuntimeEvent): boolean {
  return (
    left.evt === right.evt ||
    left.trace?.hash === right.trace?.hash ||
    buildEventChainReference(left) === buildEventChainReference(right)
  );
}


function uniqueWarnings(warnings: string[]): string[] {
  return Array.from(new Set(warnings.filter(Boolean)));
}
