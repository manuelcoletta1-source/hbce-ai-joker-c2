import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { queryHbceDatabase } from "@/lib/ipr-database";
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
  | "UNKNOWN";

type MemoryRecordStatusRow = Record<string, unknown> & {
  memory_id?: unknown;
  human_ipr?: unknown;
  tenant_id?: unknown;
  workspace_id?: unknown;
  memory_title?: unknown;
  memory_summary?: unknown;
  classification?: unknown;
  quality?: unknown;
  memory_kind?: unknown;
  memory_status?: unknown;
  source_kind?: unknown;
  source_thread_id?: unknown;
  source_saved_chat_id?: unknown;
  session_id?: unknown;
  last_evt_id?: unknown;
  last_opc_proof_id?: unknown;
  last_opc_chain_hash?: unknown;
  reusable_in_prompt?: unknown;
  legal_certification?: unknown;
  created_at?: unknown;
  updated_at?: unknown;
  deleted_at?: unknown;
  semantic_terms?: unknown;
};

type PublicMemoryRecordStatus = {
  ok: boolean;
  endpoint: "IPR_MEMORY_RECORD_STATUS";
  status: MemoryRecordOperationalStatus;
  exists: boolean;
  memoryId: string | null;
  humanIpr: string | null;
  tenantId: string | null;
  workspaceId: string | null;
  reusableInPrompt: boolean | null;
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
  reason: string;
  legalCertification: false;
  opc: "technical proof receipt only";
};

const ENDPOINT = "IPR_MEMORY_RECORD_STATUS" as const;
const MEMORY_ID_MAX_LENGTH = 128;

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

function normalizeMemoryId(value: unknown): string | null {
  const memoryId = stringOrNull(value);

  if (!memoryId) {
    return null;
  }

  return memoryId.slice(0, MEMORY_ID_MAX_LENGTH);
}

function normalizeOptionalFilter(value: unknown): string | null {
  const normalized = stringOrNull(value);

  if (!normalized || normalized === "*") {
    return null;
  }

  return normalized;
}

function buildHash(value: unknown): string {
  const normalized = typeof value === "string" ? value : JSON.stringify(value ?? null);

  return `sha256:${createHash("sha256").update(normalized).digest("hex")}`;
}

function normalizeDatabaseTimestamp(value: unknown): string | null {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return stringOrNull(value);
}

function resolveOperationalStatus(args: {
  exists: boolean;
  memoryStatus: string | null;
  reusableInPrompt: boolean | null;
}): MemoryRecordOperationalStatus {
  if (!args.exists) {
    return "NOT_FOUND";
  }

  const normalizedStatus = (args.memoryStatus || "").trim().toUpperCase();

  if (
    normalizedStatus === "SOFT_DELETED" ||
    normalizedStatus === "DELETED" ||
    normalizedStatus === "INACTIVE" ||
    normalizedStatus === "DISABLED"
  ) {
    return "SOFT_DELETED";
  }

  if (normalizedStatus === "ACTIVE" && args.reusableInPrompt === true) {
    return "ACTIVE_REUSABLE";
  }

  if (normalizedStatus === "ACTIVE" && args.reusableInPrompt === false) {
    return "ACTIVE_NOT_REUSABLE";
  }

  if (args.reusableInPrompt === false) {
    return "ACTIVE_NOT_REUSABLE";
  }

  return "UNKNOWN";
}

function buildReason(status: MemoryRecordOperationalStatus): string {
  switch (status) {
    case "ACTIVE_REUSABLE":
      return "Memory record exists, is ACTIVE and is reusable in prompt recall.";
    case "ACTIVE_NOT_REUSABLE":
      return "Memory record exists but is not reusable in prompt recall.";
    case "SOFT_DELETED":
      return "Memory record exists but is excluded from prompt recall by soft-delete or inactive status.";
    case "NOT_FOUND":
      return "No memory record was found for the requested memoryId and filters.";
    case "DATABASE_UNAVAILABLE":
      return "The memory database query failed or is currently unavailable.";
    case "UNKNOWN":
    default:
      return "Memory record exists, but its operational recall status could not be classified deterministically.";
  }
}

function toPublicMemoryRecordStatus(
  row: MemoryRecordStatusRow | null,
  fallbackMemoryId: string | null,
  statusOverride?: MemoryRecordOperationalStatus
): PublicMemoryRecordStatus {
  const exists = Boolean(row);
  const memoryStatus = stringOrNull(row?.memory_status);
  const reusableInPrompt = booleanOrNull(row?.reusable_in_prompt);
  const status = statusOverride ||
    resolveOperationalStatus({
      exists,
      memoryStatus,
      reusableInPrompt
    });

  const recordSnapshot = row
    ? {
        memoryId: stringOrNull(row.memory_id),
        humanIpr: stringOrNull(row.human_ipr),
        tenantId: stringOrNull(row.tenant_id),
        workspaceId: stringOrNull(row.workspace_id),
        memoryStatus,
        reusableInPrompt,
        updatedAt: normalizeDatabaseTimestamp(row.updated_at),
        deletedAt: normalizeDatabaseTimestamp(row.deleted_at)
      }
    : null;

  return {
    ok: status !== "DATABASE_UNAVAILABLE",
    endpoint: ENDPOINT,
    status,
    exists,
    memoryId: stringOrNull(row?.memory_id) || fallbackMemoryId,
    humanIpr: stringOrNull(row?.human_ipr),
    tenantId: stringOrNull(row?.tenant_id),
    workspaceId: stringOrNull(row?.workspace_id),
    reusableInPrompt,
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
    deletedAt: normalizeDatabaseTimestamp(row?.deleted_at),
    semanticTerms: row?.semantic_terms ?? null,
    recordHash: recordSnapshot ? buildHash(recordSnapshot) : null,
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
}) {
  return NextResponse.json(
    {
      ...toPublicMemoryRecordStatus(null, args.memoryId, args.status),
      ok: false,
      error: args.message
    },
    { status: args.httpStatus }
  );
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const memoryId = normalizeMemoryId(url.searchParams.get("memoryId"));

  if (!memoryId) {
    return buildErrorResponse({
      status: "NOT_FOUND",
      memoryId: null,
      message: "MISSING_MEMORY_ID",
      httpStatus: 400
    });
  }

  const humanIpr =
    normalizeOptionalFilter(url.searchParams.get("humanIpr")) ||
    HBCE_SELF_PILOT_HUMAN_IPR;
  const tenantId =
    normalizeOptionalFilter(url.searchParams.get("tenantId")) ||
    HBCE_SELF_PILOT_TENANT_ID;
  const workspaceId =
    normalizeOptionalFilter(url.searchParams.get("workspaceId")) ||
    HBCE_SELF_PILOT_WORKSPACE_ID;

  try {
    const result = await queryHbceDatabase<MemoryRecordStatusRow>(
      `
SELECT
  memory_id,
  human_ipr,
  tenant_id,
  workspace_id,
  memory_title,
  memory_summary,
  classification,
  quality,
  memory_kind,
  memory_status,
  source_kind,
  source_thread_id,
  source_saved_chat_id,
  session_id,
  last_evt_id,
  last_opc_proof_id,
  last_opc_chain_hash,
  reusable_in_prompt,
  legal_certification,
  created_at,
  updated_at,
  deleted_at,
  semantic_terms
FROM memory_records
WHERE memory_id = $1
  AND ($2::text IS NULL OR human_ipr = $2)
  AND ($3::text IS NULL OR tenant_id = $3)
  AND ($4::text IS NULL OR workspace_id = $4)
  AND legal_certification = false
ORDER BY updated_at DESC NULLS LAST
LIMIT 1
      `.trim(),
      [memoryId, humanIpr || null, tenantId || null, workspaceId || null]
    );

    if (!result.ok) {
      return buildErrorResponse({
        status: "DATABASE_UNAVAILABLE",
        memoryId,
        message: result.error || "MEMORY_RECORD_STATUS_QUERY_FAILED",
        httpStatus: 503
      });
    }

    const row = result.rows[0] || null;
    const publicStatus = toPublicMemoryRecordStatus(row, memoryId);

    return NextResponse.json(publicStatus, {
      status: publicStatus.exists ? 200 : 404
    });
  } catch (error) {
    return buildErrorResponse({
      status: "DATABASE_UNAVAILABLE",
      memoryId,
      message: error instanceof Error ? error.message : "MEMORY_RECORD_STATUS_UNEXPECTED_ERROR",
      httpStatus: 503
    });
  }
}
