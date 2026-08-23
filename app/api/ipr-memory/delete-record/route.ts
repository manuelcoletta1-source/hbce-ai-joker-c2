import { NextRequest, NextResponse } from "next/server";
import { resolveIprAccountSessionFromRequestAsync } from "@/lib/ipr-auth-session-resolver";

import {
  ensureHbceDatabaseReady,
  queryHbceDatabase
} from "@/lib/ipr-database";
import {
  HBCE_DATABASE_PERSISTENCE_MODE,
  HBCE_DATABASE_SCHEMA_VERSION
} from "@/lib/ipr-database-schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const ROUTE_NAME = "HBCE IPR Memory Delete Record Route";
const ROUTE_VERSION = "HBCE-IPR-MEMORY-DELETE-RECORD-v1.3";
const DELETE_MODE_SOFT_DELETE = "SOFT_DELETE";
const DELETE_REASON_DEFAULT = "USER_EXPLICIT_REMOVE_FROM_IPR_RECALL";
const SOFT_DELETED_MEMORY_STATUS = "DELETED";
const LEGACY_SOFT_DELETED_MEMORY_STATUS = "SOFT_DELETED";
const LEGACY_DISABLED_MEMORY_STATUS = "DISABLED";
const DELETE_READY_STATUS = "IPR_MEMORY_RECORD_SOFT_DELETED";
const DELETE_ALREADY_OUTSIDE_RECALL_STATUS = "IPR_MEMORY_RECORD_ALREADY_OUTSIDE_RECALL";
const RECORD_STATUS_EXPECTED_AFTER_DELETE = "NOT_PROMPT_ELIGIBLE";

const MEMORY_STATUSES_OUTSIDE_RECALL = new Set([
  SOFT_DELETED_MEMORY_STATUS,
  LEGACY_SOFT_DELETED_MEMORY_STATUS,
  LEGACY_DISABLED_MEMORY_STATUS,
  "INACTIVE"
]);

type JsonRecord = Record<string, unknown>;

type DeleteRecordInput = {
  memoryId?: string | null;
  humanIpr?: string | null;
  tenantId?: string | null;
  workspaceId?: string | null;
  confirmDeleteFromIpr?: boolean | string | number | null;
  deleteMode?: string | null;
  reason?: string | null;
  strictIdentity?: boolean | string | number | null;
};

type DeleteRecordContext = {
  memoryId: string | null;
  humanIpr: string | null;
  tenantId: string | null;
  workspaceId: string | null;
  confirmDeleteFromIpr: boolean;
  deleteMode: string;
  reason: string;
  strictIdentity: boolean;
};

type MemoryRecordRow = {
  memory_id?: string | null;
  human_ipr?: string | null;
  tenant_id?: string | null;
  workspace_id?: string | null;
  memory_status?: string | null;
  reusable_in_prompt?: boolean | null;
  classification?: string | null;
  quality?: string | null;
  memory_title?: string | null;
  memory_summary?: string | null;
  source_thread_id?: string | null;
  source_saved_chat_id?: string | null;
  last_evt_id?: string | null;
  last_opc_proof_id?: string | null;
  deleted_at?: string | Date | null;
  updated_at?: string | Date | null;
  record_payload?: unknown;
};

type DatabaseErrorShape = {
  name?: string;
  message?: string;
  code?: string;
  detail?: string;
  hint?: string;
  constraint?: string;
  table?: string;
  column?: string;
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
        "IPR memory delete-record is a user-authorized operational soft-delete endpoint. It removes a memory from active recall and prompt injection, but does not create legal certification, qualified timestamping or public authority validation."
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

function normalizeDeleteMode(value: unknown): string {
  const normalized = normalizeUpperString(value);

  if (!normalized) {
    return DELETE_MODE_SOFT_DELETE;
  }

  if (["SOFT_DELETE", "DISABLE", "DISABLE_RECALL", "REMOVE_FROM_RECALL"].includes(normalized)) {
    return DELETE_MODE_SOFT_DELETE;
  }

  return normalized;
}

function normalizeReason(value: unknown): string {
  return normalizeUpperString(value) || DELETE_REASON_DEFAULT;
}

function readInputFromSearchParams(searchParams: URLSearchParams): DeleteRecordInput {
  return {
    memoryId: readSearchString(searchParams, "memoryId") ?? readSearchString(searchParams, "memory_id"),
    humanIpr: readSearchString(searchParams, "humanIpr") ?? readSearchString(searchParams, "human_ipr"),
    tenantId: readSearchString(searchParams, "tenantId") ?? readSearchString(searchParams, "tenant_id"),
    workspaceId: readSearchString(searchParams, "workspaceId") ?? readSearchString(searchParams, "workspace_id"),
    confirmDeleteFromIpr:
      searchParams.get("confirmDeleteFromIpr") ??
      searchParams.get("confirm") ??
      searchParams.get("confirmDelete"),
    deleteMode: readSearchString(searchParams, "deleteMode") ?? readSearchString(searchParams, "mode"),
    reason: readSearchString(searchParams, "reason") ?? readSearchString(searchParams, "deleteReason"),
    strictIdentity: searchParams.get("strictIdentity") ?? searchParams.get("strict")
  };
}

async function readInputFromRequest(request: NextRequest): Promise<DeleteRecordInput> {
  const searchInput = readInputFromSearchParams(new URL(request.url).searchParams);

  if (!["POST", "DELETE"].includes(request.method)) {
    return searchInput;
  }

  try {
    const body = (await request.json()) as Partial<DeleteRecordInput> | null;
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

function resolveContext(request: NextRequest, input: DeleteRecordInput): DeleteRecordContext {
  const strictIdentity = coalesceBoolean(false, input.strictIdentity);

  return {
    memoryId: coalesceString(input.memoryId),
    humanIpr: coalesceString(
      input.humanIpr,
      readHeaderString(request, "x-hbce-human-ipr"),
      readHeaderString(request, "x-ipr-human")
    ),
    tenantId: coalesceString(
      input.tenantId,
      readHeaderString(request, "x-hbce-tenant-id")
    ),
    workspaceId: coalesceString(
      input.workspaceId,
      readHeaderString(request, "x-hbce-workspace-id")
    ),
    confirmDeleteFromIpr: coalesceBoolean(false, input.confirmDeleteFromIpr),
    deleteMode: normalizeDeleteMode(input.deleteMode),
    reason: normalizeReason(input.reason),
    strictIdentity
  };
}

function extractErrorDiagnostics(error: unknown): DatabaseErrorShape {
  if (!error || typeof error !== "object") {
    return {
      message: typeof error === "string" ? error : "Unknown database error."
    };
  }

  const record = error as Record<string, unknown>;

  return {
    name: typeof record.name === "string" ? record.name : undefined,
    message: typeof record.message === "string" ? record.message : undefined,
    code: typeof record.code === "string" ? record.code : undefined,
    detail: typeof record.detail === "string" ? record.detail : undefined,
    hint: typeof record.hint === "string" ? record.hint : undefined,
    constraint: typeof record.constraint === "string" ? record.constraint : undefined,
    table: typeof record.table === "string" ? record.table : undefined,
    column: typeof record.column === "string" ? record.column : undefined
  };
}

function toIsoString(value: unknown): string | null {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  return null;
}

function isMemoryRecordOutsideRecall(row: MemoryRecordRow): boolean {
  const memoryStatus = normalizeUpperString(row.memory_status) || "";
  const deletedAt = toIsoString(row.deleted_at);

  return (
    MEMORY_STATUSES_OUTSIDE_RECALL.has(memoryStatus) ||
    row.reusable_in_prompt === false ||
    Boolean(deletedAt)
  );
}

function toPublicMemoryRecord(row: MemoryRecordRow | null): JsonRecord | null {
  if (!row) {
    return null;
  }

  return {
    memoryId: row.memory_id || null,
    humanIpr: row.human_ipr || null,
    tenantId: row.tenant_id || null,
    workspaceId: row.workspace_id || null,
    memoryStatus: row.memory_status || null,
    reusableInPrompt: row.reusable_in_prompt ?? null,
    classification: row.classification || null,
    quality: row.quality || null,
    memoryTitle: row.memory_title || null,
    memorySummary: row.memory_summary || null,
    sourceThreadId: row.source_thread_id || null,
    sourceSavedChatId: row.source_saved_chat_id || null,
    lastEvtId: row.last_evt_id || null,
    lastOpcProofId: row.last_opc_proof_id || null,
    deletedAt: toIsoString(row.deleted_at),
    updatedAt: toIsoString(row.updated_at),
    legalCertification: false
  };
}

async function findMemoryRecord(context: DeleteRecordContext) {
  return queryHbceDatabase<MemoryRecordRow>(
    `
SELECT
  memory_id,
  human_ipr,
  tenant_id,
  workspace_id,
  memory_status,
  reusable_in_prompt,
  classification,
  quality,
  memory_title,
  memory_summary,
  source_thread_id,
  source_saved_chat_id,
  last_evt_id,
  last_opc_proof_id,
  deleted_at,
  updated_at,
  record_payload
FROM memory_records
WHERE memory_id = $1
  AND legal_certification = false
  AND ($2::text IS NULL OR human_ipr = $2)
  AND ($3::text IS NULL OR tenant_id = $3)
  AND ($4::text IS NULL OR workspace_id = $4)
LIMIT 1
    `.trim(),
    [context.memoryId, context.humanIpr, context.tenantId, context.workspaceId]
  );
}

async function disableMemoryRecord(context: DeleteRecordContext, existing: MemoryRecordRow) {
  const removalPayload = {
    iprMemoryRemoval: {
      routeVersion: ROUTE_VERSION,
      deleteMode: DELETE_MODE_SOFT_DELETE,
      reason: context.reason,
      requestedByHumanIpr: context.humanIpr,
      tenantId: context.tenantId,
      workspaceId: context.workspaceId,
      previousMemoryStatus: existing.memory_status || null,
      previousReusableInPrompt: existing.reusable_in_prompt ?? null,
      previousDeletedAt: toIsoString(existing.deleted_at),
      nextMemoryStatus: SOFT_DELETED_MEMORY_STATUS,
      removedFromRecall: true,
      legalCertification: false,
      softDeletedAt: new Date().toISOString()
    }
  };

  return queryHbceDatabase<MemoryRecordRow>(
    `
UPDATE memory_records
SET
  memory_status = $5,
  reusable_in_prompt = false,
  deleted_at = COALESCE(deleted_at, now()),
  updated_at = now(),
  record_payload = COALESCE(record_payload, '{}'::jsonb) || $6::jsonb
WHERE memory_id = $1
  AND legal_certification = false
  AND ($2::text IS NULL OR human_ipr = $2)
  AND ($3::text IS NULL OR tenant_id = $3)
  AND ($4::text IS NULL OR workspace_id = $4)
RETURNING
  memory_id,
  human_ipr,
  tenant_id,
  workspace_id,
  memory_status,
  reusable_in_prompt,
  classification,
  quality,
  memory_title,
  memory_summary,
  source_thread_id,
  source_saved_chat_id,
  last_evt_id,
  last_opc_proof_id,
  deleted_at,
  updated_at,
  record_payload
    `.trim(),
    [
      context.memoryId,
      context.humanIpr,
      context.tenantId,
      context.workspaceId,
      SOFT_DELETED_MEMORY_STATUS,
      JSON.stringify(removalPayload)
    ]
  );
}

async function disableRegisteredEventsForMemory(context: DeleteRecordContext) {
  const removalPayload = {
    iprMemoryRemoval: {
      routeVersion: ROUTE_VERSION,
      deleteMode: DELETE_MODE_SOFT_DELETE,
      reason: context.reason,
      requestedByHumanIpr: context.humanIpr,
      removedFromRecall: true,
      legalCertification: false,
      softDeletedAt: new Date().toISOString()
    }
  };

  return queryHbceDatabase<Record<string, unknown>>(
    `
UPDATE memory_registered_events
SET
  event_status = 'DISABLED',
  payload = COALESCE(payload, '{}'::jsonb) || $5::jsonb
WHERE memory_id = $1
  AND legal_certification = false
  AND ($2::text IS NULL OR human_ipr = $2)
  AND ($3::text IS NULL OR tenant_id = $3)
  AND ($4::text IS NULL OR workspace_id = $4)
RETURNING registered_event_id, memory_id, event_status
    `.trim(),
    [
      context.memoryId,
      context.humanIpr,
      context.tenantId,
      context.workspaceId,
      JSON.stringify(removalPayload)
    ]
  );
}

async function buildDeleteRecordPayload(request: NextRequest) {
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
        status: "IPR_MEMORY_AUTHENTICATION_REQUIRED",
        error:
          "A canonical server-proven IPR account session is required before memory deletion.",
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
        status: "IPR_MEMORY_AUTHORIZED_SCOPE_REQUIRED",
        error:
          "The authenticated server profile does not provide a complete Human IPR, tenant and workspace authority scope.",
        legalCertification: false
      },
      { status: 403 }
    );
  }

  const humanIprMismatch =
    Boolean(requestedContext.humanIpr) &&
    requestedContext.humanIpr !== authorizedHumanIpr;

  const tenantMismatch =
    Boolean(requestedContext.tenantId) &&
    requestedContext.tenantId !== authorizedTenantId;

  const workspaceMismatch =
    Boolean(requestedContext.workspaceId) &&
    requestedContext.workspaceId !== authorizedWorkspaceId;

  if (humanIprMismatch || tenantMismatch || workspaceMismatch) {
    return jsonResponse(
      {
        ok: false,
        status: "IPR_MEMORY_REQUESTED_SCOPE_NOT_AUTHORIZED",
        error:
          "Requested Human IPR, tenant or workspace does not match the authenticated server-side authority scope.",
        legalCertification: false
      },
      { status: 403 }
    );
  }

  const context: DeleteRecordContext = {
    ...requestedContext,
    humanIpr: authorizedHumanIpr,
    tenantId: authorizedTenantId,
    workspaceId: authorizedWorkspaceId,
    strictIdentity: true
  };

  if (!context.memoryId) {
    return jsonResponse(
      {
        ok: false,
        status: "IPR_MEMORY_ID_REQUIRED",
        error: "memoryId is required to remove a memory record from IPR recall.",
        context: {
          memoryId: null,
          humanIpr: context.humanIpr,
          tenantId: context.tenantId,
          workspaceId: context.workspaceId,
          strictIdentity: context.strictIdentity
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
          "humanIpr is required when strictIdentity=true. The delete-record route refuses unbound memory removal in strict B2G mode.",
        context: {
          memoryId: context.memoryId,
          humanIpr: null,
          tenantId: context.tenantId,
          workspaceId: context.workspaceId,
          strictIdentity: true
        }
      },
      { status: 400 }
    );
  }

  if (!context.confirmDeleteFromIpr) {
    return jsonResponse(
      {
        ok: false,
        status: "IPR_MEMORY_DELETE_CONFIRMATION_REQUIRED",
        error:
          "confirmDeleteFromIpr=true is required. This endpoint intentionally refuses accidental memory removal.",
        context: {
          memoryId: context.memoryId,
          humanIpr: context.humanIpr,
          tenantId: context.tenantId,
          workspaceId: context.workspaceId,
          deleteMode: context.deleteMode,
          requiredConfirmation: "confirmDeleteFromIpr=true"
        }
      },
      { status: 400 }
    );
  }

  if (context.deleteMode !== DELETE_MODE_SOFT_DELETE) {
    return jsonResponse(
      {
        ok: false,
        status: "IPR_MEMORY_HARD_DELETE_REFUSED",
        error:
          "Only SOFT_DELETE is supported. Physical deletion is intentionally refused in this operational B2G memory layer.",
        context: {
          memoryId: context.memoryId,
          requestedDeleteMode: context.deleteMode,
          supportedDeleteMode: DELETE_MODE_SOFT_DELETE,
          legalCertification: false
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
          "HBCE database is not ready for persistent IPR memory delete-record operations.",
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

  const existingResult = await findMemoryRecord(context);

  if (!existingResult.ok) {
    return jsonResponse(
      {
        ok: false,
        status: "IPR_MEMORY_RECORD_LOOKUP_FAILED",
        error: existingResult.error || "Unable to look up IPR memory record before removal.",
        database: {
          status: existingResult.status,
          sqlHash: existingResult.sqlHash,
          durationMs: existingResult.durationMs
        }
      },
      { status: 500 }
    );
  }

  const existing = existingResult.rows[0] || null;

  if (!existing) {
    return jsonResponse(
      {
        ok: false,
        status: "IPR_MEMORY_RECORD_NOT_FOUND",
        error:
          "No matching IPR memory record was found for the provided memoryId, humanIpr, tenant and workspace scope.",
        context: {
          memoryId: context.memoryId,
          humanIpr: context.humanIpr,
          tenantId: context.tenantId,
          workspaceId: context.workspaceId,
          strictIdentity: context.strictIdentity
        }
      },
      { status: 404 }
    );
  }

  const existingPublic = toPublicMemoryRecord(existing);
  const alreadyOutsideRecall = isMemoryRecordOutsideRecall(existing);

  if (alreadyOutsideRecall) {
    return jsonResponse({
      ok: true,
      status: DELETE_ALREADY_OUTSIDE_RECALL_STATUS,
      memoryId: context.memoryId,
      removedFromRecall: true,
      reusableInPrompt: false,
      promptEligible: false,
      duplicateSafe: true,
      before: existingPublic,
      after: existingPublic,
      context: {
        humanIpr: context.humanIpr,
        tenantId: context.tenantId,
        workspaceId: context.workspaceId,
        deleteMode: context.deleteMode,
        reason: context.reason
      },
      deletionPolicy: {
        physicalDelete: false,
        softDelete: true,
        activeRecallExcluded: true,
        promptInjectionExcluded: true,
        promptEligible: false,
        recordStatusExpected: RECORD_STATUS_EXPECTED_AFTER_DELETE,
        auditTracePreserved: true,
        idempotent: true,
        legalCertification: false
      },
      diagnostics: {
        database: {
          lookup: {
            ok: existingResult.ok,
            rowCount: existingResult.rowCount,
            durationMs: existingResult.durationMs,
            sqlHash: existingResult.sqlHash
          }
        },
        recallImpact:
          "Record was already outside active recall because memory_status is not ACTIVE, reusable_in_prompt is false or deleted_at is already set. It remains promptEligible=false."
      }
    });
  }

  const updateResult = await disableMemoryRecord(context, existing);

  if (!updateResult.ok) {
    return jsonResponse(
      {
        ok: false,
        status: "IPR_MEMORY_RECORD_DISABLE_FAILED",
        error: updateResult.error || "Unable to disable the IPR memory record.",
        context: {
          memoryId: context.memoryId,
          humanIpr: context.humanIpr,
          tenantId: context.tenantId,
          workspaceId: context.workspaceId,
          deleteMode: context.deleteMode,
          reason: context.reason
        },
        database: {
          status: updateResult.status,
          sqlHash: updateResult.sqlHash,
          durationMs: updateResult.durationMs
        }
      },
      { status: 500 }
    );
  }

  const disabled = updateResult.rows[0] || null;
  const eventDisableResult = await disableRegisteredEventsForMemory(context);

  return jsonResponse({
    ok: true,
    status: DELETE_READY_STATUS,
    memoryId: context.memoryId,
    removedFromRecall: true,
    reusableInPrompt: false,
    promptEligible: false,
    memoryStatus: SOFT_DELETED_MEMORY_STATUS,
    recordStatusExpected: RECORD_STATUS_EXPECTED_AFTER_DELETE,
    deleteMode: DELETE_MODE_SOFT_DELETE,
    reason: context.reason,
    before: existingPublic,
    after: toPublicMemoryRecord(disabled),
    context: {
      humanIpr: context.humanIpr,
      tenantId: context.tenantId,
      workspaceId: context.workspaceId,
      strictIdentity: context.strictIdentity
    },
    iprMeaning: {
      identityPrimaryRecord:
        "The verified operational identity chain binding subject, tenant, workspace, runtime, EVT, OPC and audit.",
      intenzionePrimariaRadicale:
        "The user-selected memory intention is removed from future prompt recall without physically erasing the operational trace."
    },
    deletionPolicy: {
      physicalDelete: false,
      softDelete: true,
      activeRecallExcluded: true,
      promptInjectionExcluded: true,
      promptEligible: false,
      recordStatusExpected: RECORD_STATUS_EXPECTED_AFTER_DELETE,
      auditTracePreserved: true,
      legalCertification: false
    },
    diagnostics: {
      database: {
        lookup: {
          ok: existingResult.ok,
          rowCount: existingResult.rowCount,
          durationMs: existingResult.durationMs,
          sqlHash: existingResult.sqlHash
        },
        updateMemoryRecord: {
          ok: updateResult.ok,
          rowCount: updateResult.rowCount,
          durationMs: updateResult.durationMs,
          sqlHash: updateResult.sqlHash
        },
        updateRegisteredEvents: {
          ok: eventDisableResult.ok,
          rowCount: eventDisableResult.rowCount,
          durationMs: eventDisableResult.durationMs,
          sqlHash: eventDisableResult.sqlHash,
          error: eventDisableResult.error || null,
          errorDiagnostics: eventDisableResult.ok ? null : extractErrorDiagnostics(eventDisableResult.error)
        }
      },
      recallImpact:
        "Recall routes require memory_status=ACTIVE, reusable_in_prompt=true and deleted_at IS NULL. This memory is soft-deleted, promptEligible=false and excluded from future prompt memory blocks."
    }
  });
}

export async function GET() {
  return jsonResponse({
    ok: true,
    status: "DELETE_RECORD_ROUTE_READY",
    method: "POST or DELETE",
    successStatus: DELETE_READY_STATUS,
    idempotentOutsideRecallStatus: DELETE_ALREADY_OUTSIDE_RECALL_STATUS,
    required: {
      memoryId: "string",
      confirmDeleteFromIpr: true
    },
    optional: {
      humanIpr: "string; required in strictIdentity mode",
      tenantId: "string",
      workspaceId: "string",
      deleteMode: "SOFT_DELETE only; physical delete refused",
      reason: "string; default USER_EXPLICIT_REMOVE_FROM_IPR_RECALL",
      strictIdentity: "boolean"
    },
    effects: {
      memoryStatus: SOFT_DELETED_MEMORY_STATUS,
      reusableInPrompt: false,
      promptEligible: false,
      removedFromRecall: true,
      recordStatusExpected: RECORD_STATUS_EXPECTED_AFTER_DELETE,
      physicalDelete: false,
      auditTracePreserved: true,
      recordStatusEndpoint:
        "/api/ipr-memory/record-status?memoryId=IPR-MEM-..."
    },
    example: {
      memoryId: "IPR-MEM-20260530104506-70EC8570",
      confirmDeleteFromIpr: true,
      deleteMode: "SOFT_DELETE",
      reason: DELETE_REASON_DEFAULT
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    return await buildDeleteRecordPayload(request);
  } catch (error) {
    return jsonResponse(
      {
        ok: false,
        status: "IPR_MEMORY_DELETE_RECORD_ROUTE_ERROR",
        error: error instanceof Error ? error.message : "Unknown IPR memory delete-record route error.",
        diagnostics: {
          error: extractErrorDiagnostics(error)
        }
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    return await buildDeleteRecordPayload(request);
  } catch (error) {
    return jsonResponse(
      {
        ok: false,
        status: "IPR_MEMORY_DELETE_RECORD_ROUTE_ERROR",
        error: error instanceof Error ? error.message : "Unknown IPR memory delete-record route error.",
        diagnostics: {
          error: extractErrorDiagnostics(error)
        }
      },
      { status: 500 }
    );
  }
}
