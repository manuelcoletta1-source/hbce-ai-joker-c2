import { NextRequest, NextResponse } from "next/server";

import {
  ensureHbceDatabaseReady,
  listIprChatMemorySavesFromDatabase,
  listIprMemoryRecordsFromDatabase,
  listRegisteredMemoryEventsFromDatabase,
  toPublicIprChatMemorySave,
  toPublicIprMemoryRecord,
  toPublicRegisteredMemoryEvent
} from "@/lib/ipr-database";
import {
  HBCE_DATABASE_PERSISTENCE_MODE,
  HBCE_DATABASE_SCHEMA_VERSION,
  HBCE_SELF_PILOT_HUMAN_IPR,
  HBCE_SELF_PILOT_TENANT_ID,
  HBCE_SELF_PILOT_WORKSPACE_ID
} from "@/lib/ipr-database-schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROUTE_NAME = "HBCE IPR Memory Records Route";
const ROUTE_VERSION = "HBCE-IPR-MEMORY-RECORDS-v1.0";
const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 200;

type JsonRecord = Record<string, unknown>;

type RecordsRouteInput = {
  humanIpr?: string | null;
  tenantId?: string | null;
  workspaceId?: string | null;
  sessionId?: string | null;
  threadId?: string | null;
  sourceThreadId?: string | null;
  savedChatId?: string | null;
  sourceSavedChatId?: string | null;
  memoryId?: string | null;
  classification?: string | null;
  memoryStatus?: string | null;
  reusableInPrompt?: boolean | string | number | null;
  includeInactive?: boolean | string | number | null;
  includeMemorySaves?: boolean | string | number | null;
  includeRegisteredEvents?: boolean | string | number | null;
  strictIdentity?: boolean | string | number | null;
  limit?: number | string | null;
};

type RecordsRouteContext = {
  humanIpr: string | null;
  tenantId: string | null;
  workspaceId: string | null;
  sessionId: string | null;
  sourceThreadId: string | null;
  sourceSavedChatId: string | null;
  memoryId: string | null;
  classification: string | null;
  memoryStatus: string | null;
  reusableInPrompt: boolean | null;
  includeMemorySaves: boolean;
  includeRegisteredEvents: boolean;
  strictIdentity: boolean;
  limit: number;
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
        "IPR memory records retrieval is a read-only SaaS endpoint. It does not create legal certification, does not create new memory and does not replace official identity, public authority or trust-service workflows."
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

function coalesceOptionalBoolean(...values: unknown[]): boolean | null {
  for (const value of values) {
    if (value === null || value === undefined || value === "") {
      continue;
    }

    if (typeof value === "boolean") {
      return value;
    }

    if (typeof value === "number") {
      return value !== 0;
    }

    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (["any", "all", "null", "none", "*"] .includes(normalized)) {
        return null;
      }
      if (["1", "true", "yes", "y", "on"].includes(normalized)) {
        return true;
      }
      if (["0", "false", "no", "n", "off"].includes(normalized)) {
        return false;
      }
    }
  }

  return null;
}

function clampLimit(value: unknown, fallback: number, max: number): number {
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

function readInputFromSearchParams(searchParams: URLSearchParams): RecordsRouteInput {
  return {
    humanIpr: readSearchString(searchParams, "humanIpr"),
    tenantId: readSearchString(searchParams, "tenantId"),
    workspaceId: readSearchString(searchParams, "workspaceId"),
    sessionId: readSearchString(searchParams, "sessionId"),
    threadId: readSearchString(searchParams, "threadId"),
    sourceThreadId: readSearchString(searchParams, "sourceThreadId"),
    savedChatId: readSearchString(searchParams, "savedChatId"),
    sourceSavedChatId: readSearchString(searchParams, "sourceSavedChatId"),
    memoryId: readSearchString(searchParams, "memoryId"),
    classification: readSearchString(searchParams, "classification"),
    memoryStatus: readSearchString(searchParams, "memoryStatus"),
    reusableInPrompt: searchParams.get("reusableInPrompt"),
    includeInactive: searchParams.get("includeInactive"),
    includeMemorySaves: searchParams.get("includeMemorySaves"),
    includeRegisteredEvents: searchParams.get("includeRegisteredEvents"),
    strictIdentity: searchParams.get("strictIdentity") ?? searchParams.get("strict"),
    limit: searchParams.get("limit")
  };
}

async function readInputFromRequest(request: NextRequest): Promise<RecordsRouteInput> {
  const searchInput = readInputFromSearchParams(new URL(request.url).searchParams);

  if (request.method !== "POST") {
    return searchInput;
  }

  try {
    const body = (await request.json()) as Partial<RecordsRouteInput> | null;
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

function resolveContext(request: NextRequest, input: RecordsRouteInput): RecordsRouteContext {
  const strictIdentity = coalesceBoolean(false, input.strictIdentity);
  const includeInactive = coalesceBoolean(false, input.includeInactive);

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

  const explicitMemoryStatus = normalizeUpperString(input.memoryStatus);

  return {
    humanIpr,
    tenantId,
    workspaceId,
    sessionId: coalesceString(input.sessionId, readHeaderString(request, "x-hbce-session-id")),
    sourceThreadId: coalesceString(input.sourceThreadId, input.threadId),
    sourceSavedChatId: coalesceString(input.sourceSavedChatId, input.savedChatId),
    memoryId: coalesceString(input.memoryId),
    classification: normalizeUpperString(input.classification),
    memoryStatus: includeInactive ? explicitMemoryStatus : explicitMemoryStatus || "ACTIVE",
    reusableInPrompt: coalesceOptionalBoolean(input.reusableInPrompt),
    includeMemorySaves: coalesceBoolean(true, input.includeMemorySaves),
    includeRegisteredEvents: coalesceBoolean(true, input.includeRegisteredEvents),
    strictIdentity,
    limit: clampLimit(input.limit, DEFAULT_LIMIT, MAX_LIMIT)
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

function matchesOptionalString(value: string | null, expected: string | null): boolean {
  return !expected || value === expected;
}

function filterPublicMemoryRecords(
  records: Record<string, unknown>[],
  context: RecordsRouteContext
): Record<string, unknown>[] {
  return records.filter((record) => {
    const memoryId = getPublicString(record, "memoryId");
    const classification = normalizeUpperString(getPublicString(record, "classification"));
    const sessionId = getPublicString(record, "sessionId");
    const reusableInPrompt = getPublicBoolean(record, "reusableInPrompt");

    return (
      matchesOptionalString(memoryId, context.memoryId) &&
      matchesOptionalString(classification, context.classification) &&
      matchesOptionalString(sessionId, context.sessionId) &&
      (context.reusableInPrompt === null || reusableInPrompt === context.reusableInPrompt)
    );
  });
}

function filterPublicMemorySaves(
  saves: Record<string, unknown>[],
  context: RecordsRouteContext
): Record<string, unknown>[] {
  return saves.filter((save) => {
    const memoryId = getPublicString(save, "memoryId");
    const savedChatId = getPublicString(save, "savedChatId");
    const sessionId = getPublicString(save, "sessionId");
    const classification = normalizeUpperString(getPublicString(save, "classification"));

    return (
      matchesOptionalString(memoryId, context.memoryId) &&
      matchesOptionalString(savedChatId, context.sourceSavedChatId) &&
      matchesOptionalString(sessionId, context.sessionId) &&
      matchesOptionalString(classification, context.classification)
    );
  });
}

function filterPublicRegisteredEvents(
  events: Record<string, unknown>[],
  context: RecordsRouteContext,
  allowedMemoryIds: Set<string>
): Record<string, unknown>[] {
  return events.filter((event) => {
    const memoryId = getPublicString(event, "memoryId");
    const sessionId = getPublicString(event, "sessionId");

    return (
      (!context.memoryId || memoryId === context.memoryId) &&
      (!allowedMemoryIds.size || (memoryId ? allowedMemoryIds.has(memoryId) : false)) &&
      matchesOptionalString(sessionId, context.sessionId)
    );
  });
}

async function buildRecordsPayload(request: NextRequest) {
  const input = await readInputFromRequest(request);
  const context = resolveContext(request, input);

  if (context.strictIdentity && !context.humanIpr) {
    return jsonResponse(
      {
        ok: false,
        status: "IPR_IDENTITY_REQUIRED",
        error:
          "humanIpr is required when strictIdentity=true. The records route refuses unbound memory reads in strict B2G mode.",
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

  const databaseReady = await ensureHbceDatabaseReady();

  if (!databaseReady.ok) {
    return jsonResponse(
      {
        ok: false,
        status: "DATABASE_NOT_READY",
        error:
          databaseReady.initialization.error ||
          "HBCE database is not ready for persistent IPR memory records retrieval.",
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

  const memoryResult = await listIprMemoryRecordsFromDatabase({
    humanIpr: context.humanIpr,
    tenantId: context.tenantId,
    workspaceId: context.workspaceId,
    sourceThreadId: context.sourceThreadId,
    sourceSavedChatId: context.sourceSavedChatId,
    reusableInPrompt: context.reusableInPrompt,
    memoryStatus: context.memoryStatus,
    limit: context.limit
  });

  if (!memoryResult.ok) {
    return jsonResponse(
      {
        ok: false,
        status: "IPR_MEMORY_RECORDS_QUERY_FAILED",
        error: memoryResult.error || "Unable to query persistent IPR memory records.",
        database: {
          status: memoryResult.status,
          sqlHash: memoryResult.sqlHash,
          durationMs: memoryResult.durationMs
        }
      },
      { status: 500 }
    );
  }

  const memoryRecords = filterPublicMemoryRecords(
    memoryResult.rows.map(toPublicIprMemoryRecord),
    context
  );

  const allowedMemoryIds = new Set(
    memoryRecords
      .map((record) => getPublicString(record, "memoryId"))
      .filter((memoryId): memoryId is string => Boolean(memoryId))
  );

  const memorySavesResult = context.includeMemorySaves
    ? await listIprChatMemorySavesFromDatabase({
        humanIpr: context.humanIpr,
        tenantId: context.tenantId,
        workspaceId: context.workspaceId,
        threadId: context.sourceThreadId,
        limit: context.limit
      })
    : null;

  const registeredEventsResult = context.includeRegisteredEvents
    ? await listRegisteredMemoryEventsFromDatabase({
        memoryId: context.memoryId,
        humanIpr: context.humanIpr,
        tenantId: context.tenantId,
        workspaceId: context.workspaceId,
        limit: context.limit
      })
    : null;

  const memorySaves = memorySavesResult?.ok
    ? filterPublicMemorySaves(memorySavesResult.rows.map(toPublicIprChatMemorySave), context)
    : [];

  const registeredEvents = registeredEventsResult?.ok
    ? filterPublicRegisteredEvents(
        registeredEventsResult.rows.map(toPublicRegisteredMemoryEvent),
        context,
        allowedMemoryIds
      )
    : [];

  return jsonResponse({
    ok: true,
    status: "IPR_MEMORY_RECORDS_RETRIEVED",
    context: {
      humanIpr: context.humanIpr,
      tenantId: context.tenantId,
      workspaceId: context.workspaceId,
      sessionId: context.sessionId,
      sourceThreadId: context.sourceThreadId,
      sourceSavedChatId: context.sourceSavedChatId,
      memoryId: context.memoryId,
      classification: context.classification,
      memoryStatus: context.memoryStatus,
      reusableInPrompt: context.reusableInPrompt,
      includeMemorySaves: context.includeMemorySaves,
      includeRegisteredEvents: context.includeRegisteredEvents,
      strictIdentity: context.strictIdentity,
      limit: context.limit
    },
    iprMeaning: {
      identityPrimaryRecord:
        "The verified operational identity chain binding subject, tenant, workspace, runtime, EVT, OPC and audit.",
      intenzionePrimariaRadicale:
        "The primary radical intention selected from an explicitly saved chat and stored as a reusable memory synthesis, not as uncontrolled raw chat accumulation."
    },
    counts: {
      memoryRecords: memoryRecords.length,
      memorySaves: memorySaves.length,
      registeredEvents: registeredEvents.length
    },
    memoryRecords,
    memorySaves,
    registeredEvents,
    diagnostics: {
      database: {
        available: databaseReady.description.available,
        configured: databaseReady.description.configured,
        kind: databaseReady.description.kind,
        initializationStatus: databaseReady.initialization.status
      },
      query: {
        memoryRecords: {
          ok: memoryResult.ok,
          rowCount: memoryResult.rowCount,
          durationMs: memoryResult.durationMs,
          sqlHash: memoryResult.sqlHash
        },
        memorySaves: memorySavesResult
          ? {
              ok: memorySavesResult.ok,
              rowCount: memorySavesResult.rowCount,
              durationMs: memorySavesResult.durationMs,
              sqlHash: memorySavesResult.sqlHash,
              error: memorySavesResult.error
            }
          : null,
        registeredEvents: registeredEventsResult
          ? {
              ok: registeredEventsResult.ok,
              rowCount: registeredEventsResult.rowCount,
              durationMs: registeredEventsResult.durationMs,
              sqlHash: registeredEventsResult.sqlHash,
              error: registeredEventsResult.error
            }
          : null
      }
    }
  });
}

export async function GET(request: NextRequest) {
  try {
    return await buildRecordsPayload(request);
  } catch (error) {
    return jsonResponse(
      {
        ok: false,
        status: "IPR_MEMORY_RECORDS_ROUTE_ERROR",
        error: error instanceof Error ? error.message : "Unknown IPR memory records route error."
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    return await buildRecordsPayload(request);
  } catch (error) {
    return jsonResponse(
      {
        ok: false,
        status: "IPR_MEMORY_RECORDS_ROUTE_ERROR",
        error: error instanceof Error ? error.message : "Unknown IPR memory records route error."
      },
      { status: 500 }
    );
  }
}
