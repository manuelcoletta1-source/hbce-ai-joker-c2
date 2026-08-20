import { NextRequest, NextResponse } from "next/server";
import { resolveIprAccountSessionFromRequestAsync } from "@/lib/ipr-auth-session-resolver";

import {
  ensureHbceDatabaseReady,
  listIprChatMemorySavesFromDatabase,
  listIprMemoryRecordsFromDatabase,
  listRecentIprChatThreadsFromDatabase,
  listIprChatMessagesFromDatabase,
  toPublicIprChatMemorySave,
  toPublicIprChatMessage,
  toPublicIprChatThread,
  toPublicIprMemoryRecord
} from "@/lib/ipr-database";
import {
  HBCE_DATABASE_PERSISTENCE_MODE,
  HBCE_DATABASE_SCHEMA_VERSION
} from "@/lib/ipr-database-schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROUTE_NAME = "HBCE IPR Memory Recent Route";
const ROUTE_VERSION = "HBCE-IPR-MEMORY-RECENT-v1.0";
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const DEFAULT_MESSAGE_LIMIT = 20;
const MAX_MESSAGE_LIMIT = 200;

type DatabaseRow = Record<string, unknown>;

type RecentRouteInput = {
  humanIpr?: string | null;
  tenantId?: string | null;
  workspaceId?: string | null;
  sessionId?: string | null;
  threadId?: string | null;
  includeArchived?: boolean | null;
  includeMessages?: boolean | null;
  includeMemorySaves?: boolean | null;
  includeReusableMemory?: boolean | null;
  strictIdentity?: boolean | null;
  limit?: number | string | null;
  messageLimit?: number | string | null;
};

type RecentRouteContext = {
  humanIpr: string | null;
  tenantId: string | null;
  workspaceId: string | null;
  sessionId: string | null;
  threadId: string | null;
  includeArchived: boolean;
  includeMessages: boolean;
  includeMemorySaves: boolean;
  includeReusableMemory: boolean;
  strictIdentity: boolean;
  limit: number;
  messageLimit: number;
};

function jsonResponse(payload: Record<string, unknown>, init?: ResponseInit) {
  return NextResponse.json(
    {
      ...payload,
      route: ROUTE_NAME,
      routeVersion: ROUTE_VERSION,
      schemaVersion: HBCE_DATABASE_SCHEMA_VERSION,
      persistenceMode: HBCE_DATABASE_PERSISTENCE_MODE,
      legalCertification: false,
      boundary:
        "IPR recent chat retrieval is an operational SaaS memory-read endpoint. It does not create legal certification, does not save new memory records and does not replace official identity or trust-service workflows."
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

function readInputFromSearchParams(searchParams: URLSearchParams): RecentRouteInput {
  return {
    humanIpr: readSearchString(searchParams, "humanIpr"),
    tenantId: readSearchString(searchParams, "tenantId"),
    workspaceId: readSearchString(searchParams, "workspaceId"),
    sessionId: readSearchString(searchParams, "sessionId"),
    threadId: readSearchString(searchParams, "threadId"),
    includeArchived: coalesceBoolean(false, searchParams.get("includeArchived")),
    includeMessages: coalesceBoolean(false, searchParams.get("includeMessages")),
    includeMemorySaves: coalesceBoolean(true, searchParams.get("includeMemorySaves")),
    includeReusableMemory: coalesceBoolean(false, searchParams.get("includeReusableMemory")),
    strictIdentity: coalesceBoolean(false, searchParams.get("strictIdentity"), searchParams.get("strict")),
    limit: searchParams.get("limit"),
    messageLimit: searchParams.get("messageLimit")
  };
}

async function readInputFromRequest(request: NextRequest): Promise<RecentRouteInput> {
  const searchInput = readInputFromSearchParams(new URL(request.url).searchParams);

  if (request.method !== "POST") {
    return searchInput;
  }

  try {
    const body = (await request.json()) as Partial<RecentRouteInput> | null;
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

function resolveContext(request: NextRequest, input: RecentRouteInput): RecentRouteContext {
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
    threadId: coalesceString(input.threadId),
    includeArchived: coalesceBoolean(false, input.includeArchived),
    includeMessages: coalesceBoolean(false, input.includeMessages),
    includeMemorySaves: coalesceBoolean(true, input.includeMemorySaves),
    includeReusableMemory: coalesceBoolean(false, input.includeReusableMemory),
    strictIdentity,
    limit: clampLimit(input.limit, DEFAULT_LIMIT, MAX_LIMIT),
    messageLimit: clampLimit(input.messageLimit, DEFAULT_MESSAGE_LIMIT, MAX_MESSAGE_LIMIT)
  };
}

async function buildRecentPayload(request: NextRequest) {
  const input = await readInputFromRequest(request);
  const requestedContext = resolveContext(request, input);

  const accountSessionResolution =
    await resolveIprAccountSessionFromRequestAsync(request);

  if (
    !accountSessionResolution.authenticated ||
    accountSessionResolution.access.decision !== "ACCESS_GRANTED" ||
    !accountSessionResolution.accountProfile
  ) {
    return jsonResponse(
      {
        ok: false,
        status: "IPR_MEMORY_RECENT_AUTHENTICATION_REQUIRED",
        error:
          "A canonical server-proven IPR account session is required before recent persistent memory retrieval.",
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
        status: "IPR_MEMORY_RECENT_AUTHORIZED_SCOPE_REQUIRED",
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
        status: "IPR_MEMORY_RECENT_REQUESTED_SCOPE_NOT_AUTHORIZED",
        error:
          "Requested Human IPR, tenant or workspace does not match the authenticated server-side authority scope.",
        legalCertification: false
      },
      { status: 403 }
    );
  }

  const context: RecentRouteContext = {
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
          "humanIpr is required when strictIdentity=true. The recent chat route refuses unbound memory reads in strict B2G mode.",
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
          "HBCE database is not ready for persistent IPR recent chat retrieval.",
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

  const threadsResult = await listRecentIprChatThreadsFromDatabase({
    humanIpr: context.humanIpr,
    tenantId: context.tenantId,
    workspaceId: context.workspaceId,
    sessionId: context.sessionId,
    includeArchived: context.includeArchived,
    limit: context.limit
  });

  if (!threadsResult.ok) {
    return jsonResponse(
      {
        ok: false,
        status: "RECENT_CHAT_QUERY_FAILED",
        error: threadsResult.error || "Unable to query recent IPR chat threads.",
        database: {
          status: threadsResult.status,
          sqlHash: threadsResult.sqlHash,
          durationMs: threadsResult.durationMs
        }
      },
      { status: 500 }
    );
  }

  const filteredThreadRows = context.threadId
    ? threadsResult.rows.filter((row: DatabaseRow) => normalizeString(row.thread_id) === context.threadId)
    : threadsResult.rows;

  const threads = filteredThreadRows.map(toPublicIprChatThread);

  const messagesByThread = context.includeMessages
    ? Object.fromEntries(
        await Promise.all(
          filteredThreadRows.map(async (row: DatabaseRow) => {
            const threadId = normalizeString(row.thread_id);
            if (!threadId) {
              return ["UNKNOWN_THREAD", []] as const;
            }

            const messagesResult = await listIprChatMessagesFromDatabase({
              threadId,
              humanIpr: context.humanIpr,
              tenantId: context.tenantId,
              workspaceId: context.workspaceId,
              limit: context.messageLimit
            });

            return [
              threadId,
              messagesResult.ok ? messagesResult.rows.map(toPublicIprChatMessage) : []
            ] as const;
          })
        )
      )
    : null;

  const memorySavesResult = context.includeMemorySaves
    ? await listIprChatMemorySavesFromDatabase({
        humanIpr: context.humanIpr,
        tenantId: context.tenantId,
        workspaceId: context.workspaceId,
        threadId: context.threadId,
        limit: context.limit
      })
    : null;

  const reusableMemoryResult = context.includeReusableMemory
    ? await listIprMemoryRecordsFromDatabase({
        humanIpr: context.humanIpr,
        tenantId: context.tenantId,
        workspaceId: context.workspaceId,
        sourceThreadId: context.threadId,
        reusableInPrompt: true,
        memoryStatus: "ACTIVE",
        limit: context.limit
      })
    : null;

  return jsonResponse({
    ok: true,
    status: "RECENT_IPR_CHAT_THREADS_RETRIEVED",
    context: {
      humanIpr: context.humanIpr,
      tenantId: context.tenantId,
      workspaceId: context.workspaceId,
      sessionId: context.sessionId,
      threadId: context.threadId,
      includeArchived: context.includeArchived,
      includeMessages: context.includeMessages,
      includeMemorySaves: context.includeMemorySaves,
      includeReusableMemory: context.includeReusableMemory,
      strictIdentity: context.strictIdentity,
      limit: context.limit,
      messageLimit: context.messageLimit
    },
    iprMeaning: {
      identityPrimaryRecord:
        "The verified operational identity chain used to bind subject, runtime, tenant, workspace, EVT, OPC and audit.",
      intenzionePrimariaRadicale:
        "The primary radical intention saved from a chat only when the user explicitly authorizes Save this chat to IPR. This recent route reads it; it does not create it."
    },
    counts: {
      threads: threads.length,
      memorySaves: memorySavesResult?.ok ? memorySavesResult.rows.length : 0,
      reusableMemory: reusableMemoryResult?.ok ? reusableMemoryResult.rows.length : 0
    },
    threads,
    messagesByThread,
    memorySaves: memorySavesResult?.ok
      ? memorySavesResult.rows.map(toPublicIprChatMemorySave)
      : [],
    reusableMemory: reusableMemoryResult?.ok
      ? reusableMemoryResult.rows.map(toPublicIprMemoryRecord)
      : [],
    diagnostics: {
      database: {
        available: databaseReady.description.available,
        configured: databaseReady.description.configured,
        kind: databaseReady.description.kind,
        initializationStatus: databaseReady.initialization.status
      },
      query: {
        threads: {
          ok: threadsResult.ok,
          rowCount: threadsResult.rowCount,
          durationMs: threadsResult.durationMs,
          sqlHash: threadsResult.sqlHash
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
        reusableMemory: reusableMemoryResult
          ? {
              ok: reusableMemoryResult.ok,
              rowCount: reusableMemoryResult.rowCount,
              durationMs: reusableMemoryResult.durationMs,
              sqlHash: reusableMemoryResult.sqlHash,
              error: reusableMemoryResult.error
            }
          : null
      }
    }
  });
}

export async function GET(request: NextRequest) {
  try {
    return await buildRecentPayload(request);
  } catch (error) {
    return jsonResponse(
      {
        ok: false,
        status: "RECENT_IPR_CHAT_ROUTE_ERROR",
        error: error instanceof Error ? error.message : "Unknown recent IPR chat route error."
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    return await buildRecentPayload(request);
  } catch (error) {
    return jsonResponse(
      {
        ok: false,
        status: "RECENT_IPR_CHAT_ROUTE_ERROR",
        error: error instanceof Error ? error.message : "Unknown recent IPR chat route error."
      },
      { status: 500 }
    );
  }
}
