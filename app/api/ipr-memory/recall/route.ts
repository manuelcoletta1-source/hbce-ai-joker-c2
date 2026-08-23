import { NextRequest, NextResponse } from "next/server";
import { resolveIprAccountSessionFromRequestAsync } from "@/lib/ipr-auth-session-resolver";

import {
  ensureHbceDatabaseReady,
  recallReusableIprMemoryRecordsFromDatabase,
  toPublicIprMemoryRecord
} from "@/lib/ipr-database";
import {
  HBCE_DATABASE_PERSISTENCE_MODE,
  HBCE_DATABASE_SCHEMA_VERSION
} from "@/lib/ipr-database-schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROUTE_NAME = "HBCE IPR Memory Recall Route";
const ROUTE_VERSION = "HBCE-IPR-MEMORY-RECALL-v1.0";
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;
const DEFAULT_PROMPT_MAX_CHARS = 6000;
const MAX_PROMPT_MAX_CHARS = 16000;

type JsonRecord = Record<string, unknown>;

type RecallRouteInput = {
  humanIpr?: string | null;
  tenantId?: string | null;
  workspaceId?: string | null;
  sessionId?: string | null;
  query?: string | null;
  currentMessage?: string | null;
  classification?: string | null;
  includePromptBlock?: boolean | string | number | null;
  includeRecords?: boolean | string | number | null;
  includeDiagnostics?: boolean | string | number | null;
  strictIdentity?: boolean | string | number | null;
  limit?: number | string | null;
  promptMaxChars?: number | string | null;
};

type RecallRouteContext = {
  humanIpr: string | null;
  tenantId: string | null;
  workspaceId: string | null;
  sessionId: string | null;
  query: string | null;
  classification: string | null;
  includePromptBlock: boolean;
  includeRecords: boolean;
  includeDiagnostics: boolean;
  strictIdentity: boolean;
  limit: number;
  promptMaxChars: number;
};

type RecallItem = {
  memoryId: string | null;
  memoryTitle: string | null;
  memorySummary: string | null;
  classification: string | null;
  quality: string | null;
  memoryKind: string | null;
  memoryStatus: string | null;
  sourceKind: string | null;
  sourceThreadId: string | null;
  sourceSavedChatId: string | null;
  sessionId: string | null;
  lastEvtId: string | null;
  lastOpcProofId: string | null;
  lastOpcChainHash: string | null;
  updatedAt: string | null;
  recallScore: number;
  legalCertification: false;
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
        "IPR memory recall is a read-only context retrieval endpoint. It returns reusable synthesis records only; it does not create memory, does not save raw chat and does not create legal certification."
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

function normalizeUpperString(value: unknown): string | null {
  const normalized = normalizeString(value);
  return normalized ? normalized.toUpperCase() : null;
}

function readHeaderString(request: NextRequest, name: string): string | null {
  return normalizeString(request.headers.get(name));
}

function readSearchString(searchParams: URLSearchParams, name: string): string | null {
  return normalizeString(searchParams.get(name));
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
      if (["1", "true", "yes", "y", "on"].includes(normalized)) {
        return true;
      }
      if (["0", "false", "no", "n", "off"].includes(normalized)) {
        return false;
      }
    }
  }

  return defaultValue;
}

function clampNumber(value: unknown, fallback: number, max: number): number {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number.parseInt(value, 10)
        : Number.NaN;

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.max(1, Math.min(max, Math.round(parsed)));
}

function readInputFromSearchParams(searchParams: URLSearchParams): RecallRouteInput {
  return {
    humanIpr: readSearchString(searchParams, "humanIpr"),
    tenantId: readSearchString(searchParams, "tenantId"),
    workspaceId: readSearchString(searchParams, "workspaceId"),
    sessionId: readSearchString(searchParams, "sessionId"),
    query: readSearchString(searchParams, "query") ?? readSearchString(searchParams, "q"),
    currentMessage: readSearchString(searchParams, "currentMessage") ?? readSearchString(searchParams, "message"),
    classification: readSearchString(searchParams, "classification"),
    includePromptBlock: searchParams.get("includePromptBlock"),
    includeRecords: searchParams.get("includeRecords"),
    includeDiagnostics: searchParams.get("includeDiagnostics"),
    strictIdentity: searchParams.get("strictIdentity") ?? searchParams.get("strict"),
    limit: searchParams.get("limit"),
    promptMaxChars: searchParams.get("promptMaxChars")
  };
}

async function readInputFromRequest(request: NextRequest): Promise<RecallRouteInput> {
  const searchInput = readInputFromSearchParams(new URL(request.url).searchParams);

  if (request.method !== "POST") {
    return searchInput;
  }

  try {
    const body = (await request.json()) as Partial<RecallRouteInput> | null;
    if (!body || typeof body !== "object") {
      return searchInput;
    }

    return {
      ...searchInput,
      ...body
    };
  } catch {
    return searchInput;
  }
}

function resolveContext(request: NextRequest, input: RecallRouteInput): RecallRouteContext {
  const strictIdentity = coalesceBoolean(false, input.strictIdentity);

  const humanIpr = coalesceString(
    input.humanIpr,
    readHeaderString(request, "x-hbce-human-ipr"),
    readHeaderString(request, "x-ipr-human")
  );

  const tenantId = coalesceString(
    input.tenantId,
    readHeaderString(request, "x-hbce-tenant-id")
  );

  const workspaceId = coalesceString(
    input.workspaceId,
    readHeaderString(request, "x-hbce-workspace-id")
  );

  return {
    humanIpr,
    tenantId,
    workspaceId,
    sessionId: coalesceString(input.sessionId, readHeaderString(request, "x-hbce-session-id")),
    query: coalesceString(input.query, input.currentMessage),
    classification: normalizeUpperString(input.classification),
    includePromptBlock: coalesceBoolean(true, input.includePromptBlock),
    includeRecords: coalesceBoolean(false, input.includeRecords),
    includeDiagnostics: coalesceBoolean(true, input.includeDiagnostics),
    strictIdentity,
    limit: clampNumber(input.limit, DEFAULT_LIMIT, MAX_LIMIT),
    promptMaxChars: clampNumber(input.promptMaxChars, DEFAULT_PROMPT_MAX_CHARS, MAX_PROMPT_MAX_CHARS)
  };
}

function getPublicString(record: Record<string, unknown>, key: string): string | null {
  const value = record[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getPublicBoolean(record: Record<string, unknown>, key: string): boolean | null {
  const value = record[key];
  return typeof value === "boolean" ? value : null;
}

function normalizeForSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function extractSearchTerms(value: string | null): string[] {
  if (!value) {
    return [];
  }

  const stopWords = new Set([
    "che",
    "con",
    "del",
    "della",
    "delle",
    "degli",
    "dei",
    "per",
    "una",
    "uno",
    "nel",
    "nella",
    "nelle",
    "sono",
    "come",
    "questa",
    "questo",
    "quella",
    "quello",
    "the",
    "and",
    "for",
    "with",
    "from",
    "this",
    "that"
  ]);

  return Array.from(
    new Set(
      normalizeForSearch(value)
        .split(/[^a-z0-9_\-]+/)
        .map((term) => term.trim())
        .filter((term) => term.length >= 3 && !stopWords.has(term))
    )
  ).slice(0, 24);
}

function stringifyForSearch(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function scoreRecord(record: Record<string, unknown>, terms: string[], classification: string | null): number {
  let score = 0;

  const title = normalizeForSearch(getPublicString(record, "memoryTitle") || "");
  const summary = normalizeForSearch(getPublicString(record, "memorySummary") || "");
  const recordClassification = normalizeUpperString(getPublicString(record, "classification"));
  const quality = normalizeUpperString(getPublicString(record, "quality"));
  const semanticTerms = normalizeForSearch(stringifyForSearch(record.semanticTerms));

  if (recordClassification && classification && recordClassification === classification) {
    score += 12;
  }

  if (quality === "CANONICAL") {
    score += 4;
  } else if (quality === "HIGH") {
    score += 3;
  }

  if (getPublicBoolean(record, "reusableInPrompt") === true) {
    score += 8;
  }

  if (getPublicString(record, "lastEvtId")) {
    score += 1;
  }

  if (getPublicString(record, "lastOpcProofId")) {
    score += 1;
  }

  for (const term of terms) {
    if (title.includes(term)) {
      score += 5;
    }
    if (summary.includes(term)) {
      score += 3;
    }
    if (semanticTerms.includes(term)) {
      score += 2;
    }
  }

  return score;
}

function updatedAtMs(record: Record<string, unknown>): number {
  const updatedAt = getPublicString(record, "updatedAt") || getPublicString(record, "createdAt");
  if (!updatedAt) {
    return 0;
  }

  const parsed = Date.parse(updatedAt);
  return Number.isFinite(parsed) ? parsed : 0;
}

function filterAndRankRecords(
  records: Record<string, unknown>[],
  context: RecallRouteContext
): Array<Record<string, unknown> & { recallScore: number }> {
  const terms = extractSearchTerms(context.query);

  return records
    .filter((record) => {
      const reusableInPrompt = getPublicBoolean(record, "reusableInPrompt");
      const memoryStatus = normalizeUpperString(getPublicString(record, "memoryStatus"));
      const sessionId = getPublicString(record, "sessionId");
      const recordClassification = normalizeUpperString(getPublicString(record, "classification"));

      return (
        reusableInPrompt === true &&
        memoryStatus === "ACTIVE" &&
        (!context.sessionId || sessionId === context.sessionId || !sessionId) &&
        (!context.classification || recordClassification === context.classification)
      );
    })
    .map((record) => ({
      ...record,
      recallScore: scoreRecord(record, terms, context.classification)
    }))
    .filter((record) => {
      if (!terms.length) {
        return true;
      }

      return record.recallScore > 8;
    })
    .sort((a, b) => {
      if (b.recallScore !== a.recallScore) {
        return b.recallScore - a.recallScore;
      }

      return updatedAtMs(b) - updatedAtMs(a);
    })
    .slice(0, context.limit);
}

function toRecallItem(record: Record<string, unknown> & { recallScore: number }): RecallItem {
  return {
    memoryId: getPublicString(record, "memoryId"),
    memoryTitle: getPublicString(record, "memoryTitle"),
    memorySummary: getPublicString(record, "memorySummary"),
    classification: getPublicString(record, "classification"),
    quality: getPublicString(record, "quality"),
    memoryKind: getPublicString(record, "memoryKind"),
    memoryStatus: getPublicString(record, "memoryStatus"),
    sourceKind: getPublicString(record, "sourceKind"),
    sourceThreadId: getPublicString(record, "sourceThreadId"),
    sourceSavedChatId: getPublicString(record, "sourceSavedChatId"),
    sessionId: getPublicString(record, "sessionId"),
    lastEvtId: getPublicString(record, "lastEvtId"),
    lastOpcProofId: getPublicString(record, "lastOpcProofId"),
    lastOpcChainHash: getPublicString(record, "lastOpcChainHash"),
    updatedAt: getPublicString(record, "updatedAt"),
    recallScore: record.recallScore,
    legalCertification: false
  };
}

function truncateAtBoundary(value: string, maxChars: number): string {
  if (value.length <= maxChars) {
    return value;
  }

  const clipped = value.slice(0, Math.max(0, maxChars - 24));
  const boundary = Math.max(clipped.lastIndexOf("\n"), clipped.lastIndexOf(". "));
  const safeClip = boundary > 500 ? clipped.slice(0, boundary + 1) : clipped;

  return `${safeClip.trim()}\n[IPR_MEMORY_RECALL_TRUNCATED]`;
}

function buildPromptMemoryBlock(items: RecallItem[], maxChars: number): string {
  if (!items.length) {
    return "";
  }

  const lines: string[] = [
    "HBCE / JOKER-C2 IPR MEMORY RECALL",
    "Use these records only as verified reusable synthesis, not as raw conversation history.",
    "IPR means both Identity Primary Record and Intenzione Primaria Radicale in this memory context.",
    "Boundary: legalCertification=false; OPC is a technical proof receipt only.",
    ""
  ];

  items.forEach((item, index) => {
    lines.push(`MEMORY ${index + 1}`);
    lines.push(`memoryId: ${item.memoryId || "NO_MEMORY_ID"}`);
    lines.push(`title: ${item.memoryTitle || "Untitled IPR memory"}`);
    lines.push(`summary: ${item.memorySummary || "No memory summary available."}`);
    lines.push(`classification: ${item.classification || "UNCLASSIFIED"}`);
    lines.push(`quality: ${item.quality || "UNKNOWN"}`);
    lines.push(`sourceThreadId: ${item.sourceThreadId || "NO_SOURCE_THREAD"}`);
    lines.push(`sourceSavedChatId: ${item.sourceSavedChatId || "NO_SAVED_CHAT"}`);
    lines.push(`lastEvtId: ${item.lastEvtId || "NO_EVT"}`);
    lines.push(`lastOpcProofId: ${item.lastOpcProofId || "NO_OPC"}`);
    lines.push("");
  });

  return truncateAtBoundary(lines.join("\n"), maxChars);
}

async function buildRecallPayload(request: NextRequest) {
  const input = await readInputFromRequest(request);
  const requestedContext = resolveContext(request, input);

  const accountSessionResolution =
    await resolveIprAccountSessionFromRequestAsync(request);

  if (
    !accountSessionResolution.runtimeAuthorized ||
    accountSessionResolution.access.decision !== "ACCESS_GRANTED" ||
    !accountSessionResolution.accountProfile
  ) {
    return jsonResponse(
      {
        ok: false,
        status: "IPR_MEMORY_RECALL_AUTHENTICATION_REQUIRED",
        error:
          "A canonical server-proven IPR account session is required before persistent memory recall.",
        legalCertification: false
      },
      { status: 401 }
    );
  }

  const accountProfile = accountSessionResolution.accountProfile;

  const authorizedHumanIpr = coalesceString(accountProfile.humanIpr);
  const authorizedTenantId = coalesceString(accountProfile.tenantId);
  const authorizedWorkspaceId = coalesceString(accountProfile.workspaceId);

  if (
    !authorizedHumanIpr ||
    !authorizedTenantId ||
    !authorizedWorkspaceId
  ) {
    return jsonResponse(
      {
        ok: false,
        status: "IPR_MEMORY_RECALL_AUTHORIZED_SCOPE_REQUIRED",
        error:
          "The authenticated server profile does not provide a complete Human IPR, tenant and workspace authority scope.",
        legalCertification: false
      },
      { status: 403 }
    );
  }

  const scopeMismatch =
    (Boolean(requestedContext.humanIpr) &&
      requestedContext.humanIpr !== authorizedHumanIpr) ||
    (Boolean(requestedContext.tenantId) &&
      requestedContext.tenantId !== authorizedTenantId) ||
    (Boolean(requestedContext.workspaceId) &&
      requestedContext.workspaceId !== authorizedWorkspaceId);

  if (scopeMismatch) {
    return jsonResponse(
      {
        ok: false,
        status: "IPR_MEMORY_RECALL_REQUESTED_SCOPE_NOT_AUTHORIZED",
        error:
          "Requested Human IPR, tenant or workspace does not match the authenticated server-side authority scope.",
        legalCertification: false
      },
      { status: 403 }
    );
  }

  const context: RecallRouteContext = {
    ...requestedContext,
    humanIpr: authorizedHumanIpr,
    tenantId: authorizedTenantId,
    workspaceId: authorizedWorkspaceId,
    strictIdentity: true
  };

  if (context.strictIdentity && !context.humanIpr) {
    return jsonResponse(
      {
        ok: false,
        status: "IPR_IDENTITY_REQUIRED",
        error:
          "humanIpr is required when strictIdentity=true. The recall route refuses unbound memory reads in strict B2G mode.",
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

  if (!context.humanIpr) {
    return jsonResponse(
      {
        ok: false,
        status: "IPR_IDENTITY_MISSING",
        error:
          "humanIpr is required to recall persistent IPR memory. Recall must remain IPR-bound, not anonymous prompt stuffing.",
        context: {
          tenantId: context.tenantId,
          workspaceId: context.workspaceId,
          strictIdentity: context.strictIdentity
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
          "HBCE database is not ready for persistent IPR memory recall.",
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

  const memoryResult = await recallReusableIprMemoryRecordsFromDatabase({
    humanIpr: context.humanIpr,
    tenantId: context.tenantId,
    workspaceId: context.workspaceId,
    limit: Math.min(MAX_LIMIT, Math.max(context.limit * 3, context.limit))
  });

  if (!memoryResult.ok) {
    return jsonResponse(
      {
        ok: false,
        status: "IPR_MEMORY_RECALL_QUERY_FAILED",
        error: memoryResult.error || "Unable to query reusable persistent IPR memory records.",
        database: {
          status: memoryResult.status,
          sqlHash: memoryResult.sqlHash,
          durationMs: memoryResult.durationMs
        }
      },
      { status: 500 }
    );
  }

  const publicRecords = memoryResult.rows.map(toPublicIprMemoryRecord);
  const rankedRecords = filterAndRankRecords(publicRecords, context);
  const recallItems = rankedRecords.map(toRecallItem);
  const promptMemoryBlock = context.includePromptBlock
    ? buildPromptMemoryBlock(recallItems, context.promptMaxChars)
    : "";

  return jsonResponse({
    ok: true,
    status: "IPR_MEMORY_RECALL_READY",
    context: {
      humanIpr: context.humanIpr,
      tenantId: context.tenantId,
      workspaceId: context.workspaceId,
      sessionId: context.sessionId,
      queryProvided: Boolean(context.query),
      classification: context.classification,
      strictIdentity: context.strictIdentity,
      limit: context.limit,
      promptMaxChars: context.promptMaxChars
    },
    iprMeaning: {
      identityPrimaryRecord:
        "The verified operational identity chain binding subject, tenant, workspace, runtime, EVT, OPC and audit.",
      intenzionePrimariaRadicale:
        "The primary radical intention selected from an explicitly saved chat and recalled as reusable synthesis for future governed responses."
    },
    recallPolicy: {
      mode: "READ_ONLY_REUSABLE_SYNTHESIS",
      source: "ipr_memory_records",
      requiresReusableInPrompt: true,
      requiresActiveMemory: true,
      saveRaw: false,
      saveSynthesis: true,
      createsMemory: false,
      modifiesChat: false,
      canBeInjectedIntoApiChat: true,
      failClosedReason:
        recallItems.length > 0
          ? null
          : "No active reusable IPR memory matched the current identity, workspace and optional query filters."
    },
    counts: {
      databaseRows: memoryResult.rows.length,
      recalled: recallItems.length,
      promptBlockChars: promptMemoryBlock.length
    },
    recallItems,
    promptMemoryBlock,
    records: context.includeRecords ? rankedRecords : undefined,
    diagnostics: context.includeDiagnostics
      ? {
          database: {
            available: databaseReady.description.available,
            configured: databaseReady.description.configured,
            kind: databaseReady.description.kind,
            initializationStatus: databaseReady.initialization.status
          },
          query: {
            ok: memoryResult.ok,
            rowCount: memoryResult.rowCount,
            durationMs: memoryResult.durationMs,
            sqlHash: memoryResult.sqlHash
          },
          ranking: {
            queryTerms: extractSearchTerms(context.query),
            classificationFilter: context.classification,
            strategy:
              "Reusable ACTIVE memory records are ranked by classification match, canonical quality, query overlap, EVT/OPC presence and recency."
          }
        }
      : undefined
  });
}

export async function GET(request: NextRequest) {
  try {
    return await buildRecallPayload(request);
  } catch (error) {
    return jsonResponse(
      {
        ok: false,
        status: "IPR_MEMORY_RECALL_ROUTE_ERROR",
        error: error instanceof Error ? error.message : "Unknown IPR memory recall route error."
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    return await buildRecallPayload(request);
  } catch (error) {
    return jsonResponse(
      {
        ok: false,
        status: "IPR_MEMORY_RECALL_ROUTE_ERROR",
        error: error instanceof Error ? error.message : "Unknown IPR memory recall route error."
      },
      { status: 500 }
    );
  }
}
