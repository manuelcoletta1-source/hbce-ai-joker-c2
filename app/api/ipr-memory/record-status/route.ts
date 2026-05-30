import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import {
  getIprMemoryRecordStatusFromDatabase,
  listDocumentProfilesFromDatabase,
  toPublicDocumentProfile,
  type DocumentProfileDatabaseRow,
  type IprMemoryRecordDatabaseRow
} from "@/lib/ipr-database";
import {
  HBCE_SELF_PILOT_HUMAN_IPR,
  HBCE_SELF_PILOT_TENANT_ID,
  HBCE_SELF_PILOT_WORKSPACE_ID
} from "@/lib/ipr-database-schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type MemoryRecordOperationalStatus =
  | "ACTIVE_REUSABLE"
  | "ACTIVE_NOT_REUSABLE"
  | "SOFT_DELETED"
  | "NOT_FOUND"
  | "DATABASE_UNAVAILABLE"
  | "INVALID_MEMORY_ID"
  | "UNKNOWN";

type DocumentRegistryOperationalStatus =
  | "AVAILABLE"
  | "NO_LINKED_PROFILE"
  | "SKIPPED"
  | "DATABASE_UNAVAILABLE";

type PublicDocumentRegistrySnapshot = {
  ok: boolean;
  status: DocumentRegistryOperationalStatus;
  linkedProfileCount: number;
  profiles: Record<string, unknown>[];
  durationMs: number | null;
  sqlHash: string | null;
  error: string | null;
  reason: string;
  legalCertification: false;
  opc: "technical proof receipt only";
};

type PublicMemoryRecordStatus = {
  ok: boolean;
  endpoint: "IPR_MEMORY_RECORD_STATUS";
  routeVersion: typeof ROUTE_VERSION;
  status: MemoryRecordOperationalStatus;
  exists: boolean;
  memoryId: string | null;
  humanIpr: string | null;
  tenantId: string | null;
  workspaceId: string | null;
  reusableInPrompt: boolean | null;
  promptEligible: boolean;
  memoryStatus: string | null;
  memoryTitle: string | null;
  memorySummary: string | null;
  classification: string | null;
  quality: string | null;
  memoryKind: string | null;
  sourceKind: string | null;
  sourceThreadId: string | null;
  sourceSavedChatId: string | null;
  sessionId: string | null;
  lastEvtId: string | null;
  lastOpcProofId: string | null;
  lastOpcChainHash: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  deletedAt: string | null;
  semanticTerms: unknown;
  recordHash: string | null;
  documentRegistry: PublicDocumentRegistrySnapshot;
  filtersApplied: {
    humanIpr: string | null;
    tenantId: string | null;
    workspaceId: string | null;
    useSelfPilotDefaults: boolean;
  };
  database: {
    ok: boolean;
    status: string | null;
    rowCount: number;
    durationMs: number | null;
    sqlHash: string | null;
    error: string | null;
  };
  reason: string;
  legalCertification: false;
  opc: "technical proof receipt only";
};

const ENDPOINT = "IPR_MEMORY_RECORD_STATUS" as const;
const ROUTE_VERSION = "HBCE-IPR-MEMORY-RECORD-STATUS-DOCUMENT-LINK-v3.0";
const MEMORY_ID_MAX_LENGTH = 128;
const MEMORY_ID_PATTERN = /^[A-Za-z0-9:_\-.]+$/;

const SOFT_DELETED_STATUSES = new Set([
  "SOFT_DELETED",
  "DISABLED",
  "DELETED",
  "INACTIVE"
]);

function stringOrNull(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed ? trimmed : null;
}

function booleanOrNull(value: unknown): boolean | null {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (["true", "t", "1", "yes", "y"].includes(normalized)) {
      return true;
    }

    if (["false", "f", "0", "no", "n"].includes(normalized)) {
      return false;
    }
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    if (value === 1) {
      return true;
    }

    if (value === 0) {
      return false;
    }
  }

  return null;
}

function normalizeOptionalFilter(value: unknown): string | null {
  const normalized = stringOrNull(value);

  if (!normalized || normalized === "*") {
    return null;
  }

  return normalized;
}

function parseBooleanFlag(value: unknown): boolean {
  return booleanOrNull(value) === true;
}

function normalizeMemoryId(value: unknown): {
  ok: boolean;
  memoryId: string | null;
  error: string | null;
} {
  const memoryId = stringOrNull(value);

  if (!memoryId) {
    return {
      ok: false,
      memoryId: null,
      error: "MISSING_MEMORY_ID"
    };
  }

  if (memoryId.length > MEMORY_ID_MAX_LENGTH) {
    return {
      ok: false,
      memoryId: memoryId.slice(0, MEMORY_ID_MAX_LENGTH),
      error: "INVALID_MEMORY_ID_LENGTH"
    };
  }

  if (!MEMORY_ID_PATTERN.test(memoryId)) {
    return {
      ok: false,
      memoryId,
      error: "INVALID_MEMORY_ID_FORMAT"
    };
  }

  return {
    ok: true,
    memoryId,
    error: null
  };
}

function buildHash(value: unknown): string {
  const normalized = typeof value === "string" ? value : JSON.stringify(value ?? null);

  return `sha256:${createHash("sha256").update(normalized).digest("hex")}`;
}

function normalizeDatabaseTimestamp(value: unknown): string | null {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return new Date(value).toISOString();
  }

  return stringOrNull(value);
}

function normalizeMemoryStatus(value: unknown): string | null {
  const normalized = stringOrNull(value);

  return normalized ? normalized.toUpperCase() : null;
}

function isSoftDeletedRecord(args: {
  memoryStatus: string | null;
  deletedAt: string | null;
}): boolean {
  return Boolean(args.deletedAt) || SOFT_DELETED_STATUSES.has(args.memoryStatus || "");
}

function resolveOperationalStatus(args: {
  exists: boolean;
  memoryStatus: string | null;
  reusableInPrompt: boolean | null;
  deletedAt: string | null;
}): MemoryRecordOperationalStatus {
  if (!args.exists) {
    return "NOT_FOUND";
  }

  if (
    isSoftDeletedRecord({
      memoryStatus: args.memoryStatus,
      deletedAt: args.deletedAt
    })
  ) {
    return "SOFT_DELETED";
  }

  const normalizedStatus = args.memoryStatus || "ACTIVE";

  if (normalizedStatus === "ACTIVE" && args.reusableInPrompt === true) {
    return "ACTIVE_REUSABLE";
  }

  if (normalizedStatus === "ACTIVE" && args.reusableInPrompt === false) {
    return "ACTIVE_NOT_REUSABLE";
  }

  if (args.reusableInPrompt === true) {
    return "ACTIVE_REUSABLE";
  }

  if (args.reusableInPrompt === false) {
    return "ACTIVE_NOT_REUSABLE";
  }

  return "UNKNOWN";
}

function isPromptEligible(status: MemoryRecordOperationalStatus): boolean {
  return status === "ACTIVE_REUSABLE";
}

function buildReason(status: MemoryRecordOperationalStatus): string {
  switch (status) {
    case "ACTIVE_REUSABLE":
      return "Memory record exists, is active and is reusable in prompt recall.";
    case "ACTIVE_NOT_REUSABLE":
      return "Memory record exists but is not reusable in prompt recall.";
    case "SOFT_DELETED":
      return "Memory record exists but is excluded from prompt recall by soft-delete, inactive status or deleted_at.";
    case "NOT_FOUND":
      return "No memory record was found for the requested memoryId and filters.";
    case "DATABASE_UNAVAILABLE":
      return "The memory database query failed or is currently unavailable.";
    case "INVALID_MEMORY_ID":
      return "The requested memoryId is missing or invalid.";
    case "UNKNOWN":
    default:
      return "Memory record exists, but its operational recall status could not be classified deterministically.";
  }
}

function buildDatabaseSnapshot(args?: {
  ok?: boolean;
  status?: unknown;
  rowCount?: unknown;
  durationMs?: unknown;
  sqlHash?: unknown;
  error?: unknown;
}): PublicMemoryRecordStatus["database"] {
  return {
    ok: args?.ok === true,
    status: stringOrNull(args?.status),
    rowCount:
      typeof args?.rowCount === "number" && Number.isFinite(args.rowCount)
        ? args.rowCount
        : 0,
    durationMs:
      typeof args?.durationMs === "number" && Number.isFinite(args.durationMs)
        ? args.durationMs
        : null,
    sqlHash: stringOrNull(args?.sqlHash),
    error: stringOrNull(args?.error)
  };
}

function buildDocumentRegistrySnapshot(args?: {
  status?: DocumentRegistryOperationalStatus;
  profiles?: DocumentProfileDatabaseRow[];
  durationMs?: unknown;
  sqlHash?: unknown;
  error?: unknown;
  reason?: string;
}): PublicDocumentRegistrySnapshot {
  const profiles = Array.isArray(args?.profiles) ? args.profiles : [];
  const status: DocumentRegistryOperationalStatus =
    args?.status || (profiles.length > 0 ? "AVAILABLE" : "NO_LINKED_PROFILE");
  const error = stringOrNull(args?.error);

  return {
    ok: status === "AVAILABLE" || status === "NO_LINKED_PROFILE" || status === "SKIPPED",
    status,
    linkedProfileCount: profiles.length,
    profiles: profiles.map((profile) => toPublicDocumentProfile(profile)),
    durationMs:
      typeof args?.durationMs === "number" && Number.isFinite(args.durationMs)
        ? args.durationMs
        : null,
    sqlHash: stringOrNull(args?.sqlHash),
    error,
    reason:
      args?.reason ||
      (status === "AVAILABLE"
        ? "One or more document profiles are linked to this memoryId."
        : status === "NO_LINKED_PROFILE"
          ? "No document profile is currently linked to this memoryId."
          : status === "DATABASE_UNAVAILABLE"
            ? "The document profile registry query failed or is currently unavailable."
            : "Document profile lookup was skipped for this status."),
    legalCertification: false,
    opc: "technical proof receipt only"
  };
}

async function resolveLinkedDocumentRegistry(input: {
  memoryId: string | null;
  humanIpr: string | null;
  tenantId: string | null;
  workspaceId: string | null;
  memoryExists: boolean;
  memoryStatus: MemoryRecordOperationalStatus;
}): Promise<PublicDocumentRegistrySnapshot> {
  if (!input.memoryId || input.memoryStatus === "INVALID_MEMORY_ID") {
    return buildDocumentRegistrySnapshot({
      status: "SKIPPED",
      reason: "Document profile lookup skipped because the memoryId is missing or invalid."
    });
  }

  if (!input.memoryExists) {
    return buildDocumentRegistrySnapshot({
      status: "SKIPPED",
      reason: "Document profile lookup skipped because the memory record was not found."
    });
  }

  if (input.memoryStatus === "DATABASE_UNAVAILABLE") {
    return buildDocumentRegistrySnapshot({
      status: "SKIPPED",
      reason: "Document profile lookup skipped because the memory database is unavailable."
    });
  }

  try {
    const result = await listDocumentProfilesFromDatabase({
      memoryId: input.memoryId,
      humanIpr: input.humanIpr,
      tenantId: input.tenantId,
      workspaceId: input.workspaceId,
      includeSoftDeleted: false,
      limit: 25
    });

    if (!result.ok) {
      return buildDocumentRegistrySnapshot({
        status: "DATABASE_UNAVAILABLE",
        profiles: [],
        durationMs: result.durationMs,
        sqlHash: result.sqlHash,
        error: result.error || "DOCUMENT_PROFILE_REGISTRY_QUERY_FAILED"
      });
    }

    return buildDocumentRegistrySnapshot({
      status: result.rows.length > 0 ? "AVAILABLE" : "NO_LINKED_PROFILE",
      profiles: result.rows,
      durationMs: result.durationMs,
      sqlHash: result.sqlHash,
      reason:
        result.rows.length > 0
          ? "Linked document profiles were found for this memoryId."
          : "The memory record exists, but no document profile is currently linked to it."
    });
  } catch (error) {
    return buildDocumentRegistrySnapshot({
      status: "DATABASE_UNAVAILABLE",
      profiles: [],
      error:
        error instanceof Error
          ? error.message
          : "DOCUMENT_PROFILE_REGISTRY_UNEXPECTED_ERROR"
    });
  }
}

function toPublicMemoryRecordStatus(input: {
  row: IprMemoryRecordDatabaseRow | null;
  fallbackMemoryId: string | null;
  filtersApplied: PublicMemoryRecordStatus["filtersApplied"];
  database: PublicMemoryRecordStatus["database"];
  documentRegistry?: PublicDocumentRegistrySnapshot;
  statusOverride?: MemoryRecordOperationalStatus;
}): PublicMemoryRecordStatus {
  const row = input.row;
  const exists = Boolean(row);
  const memoryStatus = normalizeMemoryStatus(row?.memory_status);
  const reusableInPrompt = booleanOrNull(row?.reusable_in_prompt);
  const deletedAt = normalizeDatabaseTimestamp(row?.deleted_at);
  const status =
    input.statusOverride ||
    resolveOperationalStatus({
      exists,
      memoryStatus,
      reusableInPrompt,
      deletedAt
    });

  const publicMemoryId = stringOrNull(row?.memory_id) || input.fallbackMemoryId;
  const recordSnapshot = row
    ? {
        memoryId: publicMemoryId,
        humanIpr: stringOrNull(row.human_ipr),
        tenantId: stringOrNull(row.tenant_id),
        workspaceId: stringOrNull(row.workspace_id),
        memoryStatus,
        reusableInPrompt,
        updatedAt: normalizeDatabaseTimestamp(row.updated_at),
        deletedAt
      }
    : null;

  return {
    ok: status !== "DATABASE_UNAVAILABLE" && status !== "INVALID_MEMORY_ID",
    endpoint: ENDPOINT,
    routeVersion: ROUTE_VERSION,
    status,
    exists,
    memoryId: publicMemoryId,
    humanIpr: stringOrNull(row?.human_ipr),
    tenantId: stringOrNull(row?.tenant_id),
    workspaceId: stringOrNull(row?.workspace_id),
    reusableInPrompt,
    promptEligible: isPromptEligible(status),
    memoryStatus,
    memoryTitle: stringOrNull(row?.memory_title),
    memorySummary: stringOrNull(row?.memory_summary),
    classification: stringOrNull(row?.classification),
    quality: stringOrNull(row?.quality),
    memoryKind: stringOrNull(row?.memory_kind),
    sourceKind: stringOrNull(row?.source_kind),
    sourceThreadId: stringOrNull(row?.source_thread_id),
    sourceSavedChatId: stringOrNull(row?.source_saved_chat_id),
    sessionId: stringOrNull(row?.session_id),
    lastEvtId: stringOrNull(row?.last_evt_id),
    lastOpcProofId: stringOrNull(row?.last_opc_proof_id),
    lastOpcChainHash: stringOrNull(row?.last_opc_chain_hash),
    createdAt: normalizeDatabaseTimestamp(row?.created_at),
    updatedAt: normalizeDatabaseTimestamp(row?.updated_at),
    deletedAt,
    semanticTerms: row?.semantic_terms ?? null,
    recordHash: recordSnapshot ? buildHash(recordSnapshot) : null,
    documentRegistry:
      input.documentRegistry ||
      buildDocumentRegistrySnapshot({
        status: "SKIPPED",
        reason: "Document profile lookup was not executed for this response."
      }),
    filtersApplied: input.filtersApplied,
    database: input.database,
    reason: buildReason(status),
    legalCertification: false,
    opc: "technical proof receipt only"
  };
}

function buildErrorResponse(args: {
  status: MemoryRecordOperationalStatus;
  memoryId: string | null;
  message: string;
  httpStatus: number;
  filtersApplied?: PublicMemoryRecordStatus["filtersApplied"];
  database?: PublicMemoryRecordStatus["database"];
}) {
  const response = toPublicMemoryRecordStatus({
    row: null,
    fallbackMemoryId: args.memoryId,
    filtersApplied:
      args.filtersApplied || {
        humanIpr: null,
        tenantId: null,
        workspaceId: null,
        useSelfPilotDefaults: false
      },
    database: args.database || buildDatabaseSnapshot(),
    statusOverride: args.status
  });

  return NextResponse.json(
    {
      ...response,
      ok: false,
      error: args.message
    },
    { status: args.httpStatus }
  );
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const parsedMemoryId = normalizeMemoryId(url.searchParams.get("memoryId"));

  if (!parsedMemoryId.ok) {
    return buildErrorResponse({
      status: "INVALID_MEMORY_ID",
      memoryId: parsedMemoryId.memoryId,
      message: parsedMemoryId.error || "INVALID_MEMORY_ID",
      httpStatus: 400
    });
  }

  const useSelfPilotDefaults = parseBooleanFlag(url.searchParams.get("useSelfPilotDefaults"));

  const humanIpr =
    normalizeOptionalFilter(url.searchParams.get("humanIpr")) ||
    (useSelfPilotDefaults ? HBCE_SELF_PILOT_HUMAN_IPR : null);
  const tenantId =
    normalizeOptionalFilter(url.searchParams.get("tenantId")) ||
    (useSelfPilotDefaults ? HBCE_SELF_PILOT_TENANT_ID : null);
  const workspaceId =
    normalizeOptionalFilter(url.searchParams.get("workspaceId")) ||
    (useSelfPilotDefaults ? HBCE_SELF_PILOT_WORKSPACE_ID : null);

  const filtersApplied = {
    humanIpr,
    tenantId,
    workspaceId,
    useSelfPilotDefaults
  };

  try {
    const result = await getIprMemoryRecordStatusFromDatabase({
      memoryId: parsedMemoryId.memoryId || "",
      humanIpr,
      tenantId,
      workspaceId
    });

    const database = buildDatabaseSnapshot(result);

    if (!result.ok) {
      return buildErrorResponse({
        status: "DATABASE_UNAVAILABLE",
        memoryId: parsedMemoryId.memoryId,
        message: result.error || "MEMORY_RECORD_STATUS_QUERY_FAILED",
        httpStatus: 503,
        filtersApplied,
        database
      });
    }

    const row = result.rows[0] || null;
    const memoryStatus = normalizeMemoryStatus(row?.memory_status);
    const reusableInPrompt = booleanOrNull(row?.reusable_in_prompt);
    const deletedAt = normalizeDatabaseTimestamp(row?.deleted_at);
    const operationalStatus = resolveOperationalStatus({
      exists: Boolean(row),
      memoryStatus,
      reusableInPrompt,
      deletedAt
    });
    const publicMemoryId = stringOrNull(row?.memory_id) || parsedMemoryId.memoryId;
    const documentRegistry = await resolveLinkedDocumentRegistry({
      memoryId: publicMemoryId,
      humanIpr: stringOrNull(row?.human_ipr) || humanIpr,
      tenantId: stringOrNull(row?.tenant_id) || tenantId,
      workspaceId: stringOrNull(row?.workspace_id) || workspaceId,
      memoryExists: Boolean(row),
      memoryStatus: operationalStatus
    });

    const publicStatus = toPublicMemoryRecordStatus({
      row,
      fallbackMemoryId: parsedMemoryId.memoryId,
      filtersApplied,
      database,
      documentRegistry,
      statusOverride: operationalStatus
    });

    return NextResponse.json(publicStatus, {
      status: 200
    });
  } catch (error) {
    return buildErrorResponse({
      status: "DATABASE_UNAVAILABLE",
      memoryId: parsedMemoryId.memoryId,
      message:
        error instanceof Error
          ? error.message
          : "MEMORY_RECORD_STATUS_UNEXPECTED_ERROR",
      httpStatus: 503,
      filtersApplied,
      database: buildDatabaseSnapshot({
        ok: false,
        status: "ERROR",
        error:
          error instanceof Error
            ? error.message
            : "MEMORY_RECORD_STATUS_UNEXPECTED_ERROR"
      })
    });
  }
}
