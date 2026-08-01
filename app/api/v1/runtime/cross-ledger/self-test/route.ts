import { createHash, randomUUID } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import {
  describeDefaultHbceDatabase,
  isHbceDatabaseConfigured,
  queryHbceDatabase,
  type HbceDatabaseQueryValue,
} from "@/lib/ipr-database";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

type CheckStatus = "PASS" | "FAIL" | "SKIPPED";

type Check = {
  id: string;
  label: string;
  required: boolean;
  status: CheckStatus;
  durationMs: number;
  details: Record<string, unknown>;
  error: string | null;
};

type SchemaRow = {
  column_name?: unknown;
  data_type?: unknown;
  udt_name?: unknown;
  is_nullable?: unknown;
  column_default?: unknown;
};

type Column = {
  name: string;
  dataType: string;
  udtName: string;
  nullable: boolean;
  hasDefault: boolean;
};

type GenericRow = Record<string, unknown>;

type CountRow = {
  record_count?: unknown;
};

type Candidate = {
  value: HbceDatabaseQueryValue;
  expected: unknown;
  cast?: "jsonb" | "timestamptz" | "bigint";
};

type LedgerSpec = {
  key: LedgerKey;
  table: string;
  identifierCandidates: readonly string[];
  candidates: Record<string, Candidate>;
};

type LedgerKey =
  | "memory"
  | "evt"
  | "opc"
  | "audit"
  | "usage";

type InsertedLedger = {
  key: LedgerKey;
  table: string;
  identifierColumn: string;
  identifierValue: string;
  selectedColumns: string[];
};

const REVISION =
  "HBCE-RUNTIME-CROSS-LEDGER-TRANSACTION-SELF-TEST-v1_0";

const PRODUCT =
  "HBCE IPR Operational Identity & Proof Layer";

const API_VERSION = "v1";
const RUNTIME_NAME = "AI_JOKER_C2_SAAS_CORE_v0_1";

const HUMAN_IPR = "IPR-HBCE-CROSS-LEDGER-SELF-TEST";
const RUNTIME_IPR = "IPR-AI-0001";
const TENANT_ID = "HBCE-TENANT-SELF-PILOT";
const WORKSPACE_ID = "HBCE-WORKSPACE-RND";
const SUBSCRIPTION_ID = "HBCE-SUBSCRIPTION-SELF-PILOT";

const BIRTH_ANCHOR_LOCAL = "2026-01-19T15:30:00+01:00";
const BIRTH_ANCHOR_UTC = "2026-01-19T14:30:00.000Z";

const SAFE_IDENTIFIER = /^[a-z_][a-z0-9_]*$/;

function nowMs(): number {
  return Date.now();
}

function elapsedMs(startedAt: number): number {
  return Math.max(0, Date.now() - startedAt);
}

function normalizeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;

  try {
    return JSON.stringify(error);
  } catch {
    return "UNKNOWN_ERROR";
  }
}

function asString(value: unknown): string | null {
  if (typeof value === "string") return value;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime())
      ? null
      : value.toISOString();
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint"
  ) {
    return String(value);
  }

  return null;
}

function asBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (value === "true" || value === 1 || value === "1") return true;
  if (value === "false" || value === 0 || value === "0") return false;
  return null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "bigint") return Number(value);

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function stableJson(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (value instanceof Date) {
    return JSON.stringify(value.toISOString());
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableJson).join(",")}]`;
  }

  const record = value as Record<string, unknown>;

  return `{${Object.keys(record)
    .sort()
    .map(
      (key) =>
        `${JSON.stringify(key)}:${stableJson(record[key])}`,
    )
    .join(",")}}`;
}

function sha256(value: string): string {
  return `sha256:${createHash("sha256")
    .update(value, "utf8")
    .digest("hex")}`;
}

function quoteIdentifier(identifier: string): string {
  if (!SAFE_IDENTIFIER.test(identifier)) {
    throw new Error(`UNSAFE_SQL_IDENTIFIER:${identifier}`);
  }

  return `"${identifier}"`;
}

function jsonCandidate(value: Record<string, unknown>): Candidate {
  return {
    value: stableJson(value),
    expected: value,
    cast: "jsonb",
  };
}

function timestampCandidate(value: string): Candidate {
  return {
    value,
    expected: value,
    cast: "timestamptz",
  };
}

function createCheck(input: {
  id: string;
  label: string;
  required?: boolean;
  status: CheckStatus;
  durationMs: number;
  details?: Record<string, unknown>;
  error?: string | null;
}): Check {
  return {
    id: input.id,
    label: input.label,
    required: input.required ?? true,
    status: input.status,
    durationMs: input.durationMs,
    details: input.details ?? {},
    error: input.error ?? null,
  };
}

function skipped(
  id: string,
  label: string,
  reason: string,
): Check {
  return createCheck({
    id,
    label,
    status: "SKIPPED",
    durationMs: 0,
    details: { reason },
    error: `${id}_SKIPPED`,
  });
}

function getOrigin(request: NextRequest): string {
  const proto = request.headers.get("x-forwarded-proto");
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost ?? request.headers.get("host");

  return host
    ? `${proto ?? "https"}://${host}`
    : request.nextUrl.origin;
}

function buildSummary(checks: Check[], durationMs: number) {
  const required = checks.filter((check) => check.required);

  return {
    totalChecks: checks.length,
    passedChecks: checks.filter((check) => check.status === "PASS").length,
    failedChecks: checks.filter((check) => check.status === "FAIL").length,
    skippedChecks: checks.filter((check) => check.status === "SKIPPED").length,
    requiredChecks: required.length,
    requiredPassed: required.filter((check) => check.status === "PASS").length,
    requiredFailed: required.filter((check) => check.status !== "PASS").length,
    durationMs,
  };
}

function sqlExpression(index: number, candidate: Candidate): string {
  if (candidate.cast === "jsonb") return `$${index}::jsonb`;
  if (candidate.cast === "timestamptz") return `$${index}::timestamptz`;
  if (candidate.cast === "bigint") return `$${index}::bigint`;
  return `$${index}`;
}

function valuesMatch(expected: unknown, stored: unknown): boolean {
  if (expected === null) return stored === null;
  if (typeof expected === "boolean") return asBoolean(stored) === expected;
  if (typeof expected === "number") return asNumber(stored) === expected;

  if (typeof expected === "object") {
    return (
      stored !== null &&
      typeof stored === "object" &&
      stableJson(stored) === stableJson(expected)
    );
  }

  return asString(stored) === String(expected);
}

async function inspectTable(
  table: string,
): Promise<{
  columns: Column[];
  check: Check;
}> {
  const startedAt = nowMs();

  const result = await queryHbceDatabase<SchemaRow>(
    `
      SELECT
        column_name,
        data_type,
        udt_name,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND table_name = $1
      ORDER BY ordinal_position
    `,
    [table],
  );

  const columns = result.rows
    .map((row): Column | null => {
      const name = asString(row.column_name);
      const dataType = asString(row.data_type);
      const udtName = asString(row.udt_name);

      if (
        !name ||
        !dataType ||
        !udtName ||
        !SAFE_IDENTIFIER.test(name)
      ) {
        return null;
      }

      return {
        name,
        dataType,
        udtName,
        nullable: asString(row.is_nullable) === "YES",
        hasDefault: asString(row.column_default) !== null,
      };
    })
    .filter((column): column is Column => column !== null);

  const ok = result.ok && columns.length > 0;

  return {
    columns,
    check: createCheck({
      id: `SCHEMA_${table.toUpperCase()}`,
      label: `Inspect ${table} schema`,
      status: ok ? "PASS" : "FAIL",
      durationMs: elapsedMs(startedAt),
      details: {
        table,
        columnCount: columns.length,
        columns,
        queryStatus: result.status,
        queryDurationMs: result.durationMs,
        sqlHash: result.sqlHash,
      },
      error:
        result.error ??
        (ok ? null : `SCHEMA_NOT_AVAILABLE:${table}`),
    }),
  };
}

function resolveIdentifier(
  columns: Column[],
  candidates: readonly string[],
): string | null {
  const names = new Set(columns.map((column) => column.name));

  for (const candidate of candidates) {
    if (names.has(candidate)) return candidate;
  }

  return null;
}

async function insertLedger(
  spec: LedgerSpec,
  columns: Column[],
): Promise<{
  check: Check;
  inserted: InsertedLedger | null;
}> {
  const startedAt = nowMs();

  const identifierColumn = resolveIdentifier(
    columns,
    spec.identifierCandidates,
  );

  if (!identifierColumn) {
    return {
      inserted: null,
      check: createCheck({
        id: `INSERT_${spec.key.toUpperCase()}`,
        label: `Insert ${spec.key} cross-ledger record`,
        status: "FAIL",
        durationMs: 0,
        details: {
          table: spec.table,
          identifierCandidates: spec.identifierCandidates,
        },
        error: `IDENTIFIER_COLUMN_NOT_FOUND:${spec.table}`,
      }),
    };
  }

  const unsupportedRequired = columns.filter(
    (column) =>
      !column.nullable &&
      !column.hasDefault &&
      !(column.name in spec.candidates),
  );

  if (unsupportedRequired.length > 0) {
    return {
      inserted: null,
      check: createCheck({
        id: `INSERT_${spec.key.toUpperCase()}`,
        label: `Insert ${spec.key} cross-ledger record`,
        status: "FAIL",
        durationMs: 0,
        details: {
          table: spec.table,
          identifierColumn,
          unsupportedRequiredColumns:
            unsupportedRequired.map((column) => column.name),
        },
        error: `UNSUPPORTED_REQUIRED_COLUMNS:${spec.table}:${unsupportedRequired
          .map((column) => column.name)
          .join(",")}`,
      }),
    };
  }

  const selectedColumns = columns
    .filter((column) => column.name in spec.candidates)
    .map((column) => column.name);

  const parameters: HbceDatabaseQueryValue[] = [];
  const expressions = selectedColumns.map((columnName) => {
    const candidate = spec.candidates[columnName];
    parameters.push(candidate.value);
    return sqlExpression(parameters.length, candidate);
  });

  const identifierValue = String(
    spec.candidates[identifierColumn]?.expected ?? "",
  );

  const result = await queryHbceDatabase<GenericRow>(
    `
      INSERT INTO ${quoteIdentifier(spec.table)} (
        ${selectedColumns.map(quoteIdentifier).join(", ")}
      )
      VALUES (
        ${expressions.join(", ")}
      )
      RETURNING *
    `,
    parameters,
  );

  const ok = result.ok && result.rowCount === 1;

  return {
    inserted: ok
      ? {
          key: spec.key,
          table: spec.table,
          identifierColumn,
          identifierValue,
          selectedColumns,
        }
      : null,

    check: createCheck({
      id: `INSERT_${spec.key.toUpperCase()}`,
      label: `Insert ${spec.key} cross-ledger record`,
      status: ok ? "PASS" : "FAIL",
      durationMs: elapsedMs(startedAt),
      details: {
        table: spec.table,
        identifierColumn,
        identifierValue,
        selectedColumnCount: selectedColumns.length,
        selectedColumns,
        rowCount: result.rowCount,
        queryStatus: result.status,
        queryDurationMs: result.durationMs,
        sqlHash: result.sqlHash,
      },
      error:
        result.error ??
        (ok ? null : `INSERT_FAILED:${spec.table}`),
    }),
  };
}

async function readAndVerifyLedger(
  spec: LedgerSpec,
  inserted: InsertedLedger,
): Promise<Check> {
  const startedAt = nowMs();
  const identifier = quoteIdentifier(inserted.identifierColumn);

  const result = await queryHbceDatabase<GenericRow>(
    `
      SELECT *
      FROM ${quoteIdentifier(inserted.table)}
      WHERE ${identifier} = $1
      LIMIT 1
    `,
    [inserted.identifierValue],
  );

  const row = result.rows[0];
  const readOk = result.ok && result.rowCount === 1 && Boolean(row);

  if (!readOk) {
    return createCheck({
      id: `VERIFY_${spec.key.toUpperCase()}`,
      label: `Read and verify ${spec.key} cross-ledger record`,
      status: "FAIL",
      durationMs: elapsedMs(startedAt),
      details: {
        table: inserted.table,
        identifierColumn: inserted.identifierColumn,
        identifierValue: inserted.identifierValue,
        rowCount: result.rowCount,
        queryStatus: result.status,
        queryDurationMs: result.durationMs,
        sqlHash: result.sqlHash,
      },
      error:
        result.error ??
        `READ_FAILED:${inserted.table}`,
    });
  }

  const comparisons: Record<string, boolean> = {};

  for (const columnName of inserted.selectedColumns) {
    comparisons[columnName] = valuesMatch(
      spec.candidates[columnName].expected,
      row[columnName],
    );
  }

  if ("created_at" in row) {
    const createdAt = asString(row.created_at);
    comparisons.created_at =
      createdAt !== null &&
      !Number.isNaN(Date.parse(createdAt));
  }

  if ("legal_certification" in row) {
    comparisons.legal_certification =
      asBoolean(row.legal_certification) === false;
  }

  const failedComparisons = Object.entries(comparisons)
    .filter(([, passed]) => !passed)
    .map(([name]) => name);

  const ok = failedComparisons.length === 0;

  return createCheck({
    id: `VERIFY_${spec.key.toUpperCase()}`,
    label: `Read and verify ${spec.key} cross-ledger record`,
    status: ok ? "PASS" : "FAIL",
    durationMs: elapsedMs(startedAt),
    details: {
      table: inserted.table,
      identifierColumn: inserted.identifierColumn,
      identifierValue: inserted.identifierValue,
      comparisons,
      failedComparisons,
      queryStatus: result.status,
      queryDurationMs: result.durationMs,
      sqlHash: result.sqlHash,
    },
    error:
      ok
        ? null
        : `INTEGRITY_MISMATCH:${inserted.table}:${failedComparisons.join(",")}`,
  });
}

async function deleteLedger(
  inserted: InsertedLedger,
): Promise<Check> {
  const startedAt = nowMs();
  const identifier = quoteIdentifier(inserted.identifierColumn);

  const result = await queryHbceDatabase<GenericRow>(
    `
      DELETE FROM ${quoteIdentifier(inserted.table)}
      WHERE ${identifier} = $1
      RETURNING ${identifier}
    `,
    [inserted.identifierValue],
  );

  const deletedId = asString(
    result.rows[0]?.[inserted.identifierColumn],
  );

  const ok =
    result.ok &&
    result.rowCount === 1 &&
    deletedId === inserted.identifierValue;

  return createCheck({
    id: `DELETE_${inserted.key.toUpperCase()}`,
    label: `Delete ${inserted.key} cross-ledger record`,
    status: ok ? "PASS" : "FAIL",
    durationMs: elapsedMs(startedAt),
    details: {
      table: inserted.table,
      identifierColumn: inserted.identifierColumn,
      identifierValue: inserted.identifierValue,
      deletedId,
      deletedRowCount: result.rowCount,
      queryStatus: result.status,
      queryDurationMs: result.durationMs,
      sqlHash: result.sqlHash,
    },
    error:
      result.error ??
      (ok ? null : `DELETE_NOT_CONFIRMED:${inserted.table}`),
  });
}

async function verifyCleanup(
  inserted: InsertedLedger,
): Promise<Check> {
  const startedAt = nowMs();
  const identifier = quoteIdentifier(inserted.identifierColumn);

  const result = await queryHbceDatabase<CountRow>(
    `
      SELECT COUNT(*)::int AS record_count
      FROM ${quoteIdentifier(inserted.table)}
      WHERE ${identifier} = $1
    `,
    [inserted.identifierValue],
  );

  const remainingRecords =
    asNumber(result.rows[0]?.record_count) ?? -1;

  const ok =
    result.ok &&
    remainingRecords === 0;

  return createCheck({
    id: `CLEANUP_${inserted.key.toUpperCase()}`,
    label: `Verify ${inserted.key} cleanup`,
    status: ok ? "PASS" : "FAIL",
    durationMs: elapsedMs(startedAt),
    details: {
      table: inserted.table,
      identifierColumn: inserted.identifierColumn,
      identifierValue: inserted.identifierValue,
      remainingRecords,
      queryStatus: result.status,
      queryDurationMs: result.durationMs,
      sqlHash: result.sqlHash,
    },
    error:
      result.error ??
      (ok ? null : `CLEANUP_NOT_CONFIRMED:${inserted.table}`),
  });
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse> {
  const startedAt = nowMs();
  const generatedAt = new Date().toISOString();
  const checks: Check[] = [];
  const inserted: InsertedLedger[] = [];

  const compactTimestamp = generatedAt
    .replace(/\D/g, "")
    .slice(0, 14);

  const suffix = randomUUID()
    .replace(/-/g, "")
    .slice(0, 8)
    .toUpperCase();

  const transactionId =
    `HBCE-XLEDGER-${compactTimestamp}-${suffix}`;

  const memoryId =
    `MEM-XLEDGER-${compactTimestamp}-${suffix}`;

  const evtId =
    `EVT-${compactTimestamp}-${suffix}`;

  const proofId =
    `OPC-${compactTimestamp}-${suffix}`;

  const auditId =
    `AUDIT-${compactTimestamp}-${suffix}`;

  const usageId =
    `USAGE-${compactTimestamp}-${suffix}`;

  const sessionId =
    `HBCE-XLEDGER-SESSION-${randomUUID()}`;

  const threadId =
    `HBCE-XLEDGER-THREAD-${randomUUID()}`;

  const inputHash = sha256(
    stableJson({
      transactionId,
      generatedAt,
      command:
        "HBCE_RUNTIME_CROSS_LEDGER_TRANSACTION_SELF_TEST",
    }),
  );

  const outputHash = sha256(
    stableJson({
      result:
        "TEMPORARY_CROSS_LEDGER_TRANSACTION_CREATED",
      expectedCleanup: true,
    }),
  );

  const policyHash = sha256(
    stableJson({
      decision: "ALLOW",
      riskLevel: "LOW",
      temporaryTechnicalTest: true,
    }),
  );

  const memoryPayload = {
    transactionId,
    memoryId,
    sessionId,
    threadId,
    generatedAt,
    temporary: true,
    legalCertification: false,
  };

  const memoryHash = sha256(stableJson(memoryPayload));

  const eventPayload = {
    transactionId,
    evtId,
    memoryId,
    humanIpr: HUMAN_IPR,
    runtimeIpr: RUNTIME_IPR,
    generatedAt,
    inputHash,
    outputHash,
    policyHash,
    memoryHash,
    legalCertification: false,
  };

  const eventHash = sha256(stableJson(eventPayload));

  const proofPayload = {
    transactionId,
    proofId,
    evtId,
    memoryId,
    eventHash,
    memoryHash,
    generatedAt,
    legalCertification: false,
    opcBoundary: "technical proof receipt only",
  };

  const proofHash = sha256(stableJson(proofPayload));

  const auditPayload = {
    transactionId,
    auditId,
    evtId,
    proofId,
    memoryId,
    eventHash,
    proofHash,
    generatedAt,
    legalCertification: false,
  };

  const auditHash = sha256(stableJson(auditPayload));

  const usagePayload = {
    transactionId,
    usageId,
    evtId,
    proofId,
    auditId,
    memoryId,
    provider: "LOCAL",
    model: "hbce-cross-ledger-self-test",
    inputTokens: 128,
    outputTokens: 64,
    totalTokens: 192,
    generatedAt,
    legalCertification: false,
  };

  const usageHash = sha256(stableJson(usagePayload));

  const temporalCertificate = {
    status: "DUAL_TIME_SEAL_READY",
    generatedAtUtc: generatedAt,
    locality: "Torino / Italia / Europa",
    runtimeBirth: BIRTH_ANCHOR_LOCAL,
    timezone: "Europe/Rome",
    legalCertification: false,
  };

  const specs: LedgerSpec[] = [
    {
      key: "memory",
      table: "memory_records",
      identifierCandidates: ["memory_id"],
      candidates: {
        memory_id: { value: memoryId, expected: memoryId },
        memory_key_hash: {
          value: sha256(`memory-key:${memoryId}`),
          expected: sha256(`memory-key:${memoryId}`),
        },
        human_ipr: { value: HUMAN_IPR, expected: HUMAN_IPR },
        runtime_ipr: { value: RUNTIME_IPR, expected: RUNTIME_IPR },
        session_id: { value: sessionId, expected: sessionId },
        scope: { value: "RUNTIME_ONLY", expected: "RUNTIME_ONLY" },
        authority: {
          value: "SESSION_RUNTIME_ONLY",
          expected: "SESSION_RUNTIME_ONLY",
        },
        persistence_mode: {
          value: "DATABASE_PERSISTENT",
          expected: "DATABASE_PERSISTENT",
        },
        memory_kind: {
          value: "RUNTIME_MEMORY",
          expected: "RUNTIME_MEMORY",
        },
        memory_status: { value: "ACTIVE", expected: "ACTIVE" },
        source_kind: {
          value: "RUNTIME_MEMORY",
          expected: "RUNTIME_MEMORY",
        },
        memory_title: {
          value: "HBCE Cross-Ledger Self-Test",
          expected: "HBCE Cross-Ledger Self-Test",
        },
        memory_summary: {
          value:
            "Temporary memory root for the HBCE cross-ledger transaction self-test.",
          expected:
            "Temporary memory root for the HBCE cross-ledger transaction self-test.",
        },
        save_raw: { value: false, expected: false },
        save_synthesis: { value: true, expected: true },
        reusable_in_prompt: { value: false, expected: false },
        classification: {
          value: "INTERNAL_TECHNICAL_TEST",
          expected: "INTERNAL_TECHNICAL_TEST",
        },
        quality: {
          value: "VERIFIED_SELF_TEST",
          expected: "VERIFIED_SELF_TEST",
        },
        threshold_detected: { value: false, expected: false },
        semantic_terms: {
          value: "[]",
          expected: [],
          cast: "jsonb",
        },
        memory_hash: { value: memoryHash, expected: memoryHash },
        memory_chain_hash: {
          value: sha256(
            stableJson({
              previousHash: null,
              memoryHash,
              transactionId,
            }),
          ),
          expected: sha256(
            stableJson({
              previousHash: null,
              memoryHash,
              transactionId,
            }),
          ),
        },
        record_payload: jsonCandidate(memoryPayload),
        legal_certification: { value: false, expected: false },
        response_utc: timestampCandidate(generatedAt),
      },
    },

    {
      key: "evt",
      table: "evt_records",
      identifierCandidates: ["evt_id", "event_id"],
      candidates: {
        evt_id: { value: evtId, expected: evtId },
        event_id: { value: evtId, expected: evtId },
        tenant_id: { value: TENANT_ID, expected: TENANT_ID },
        workspace_id: { value: WORKSPACE_ID, expected: WORKSPACE_ID },
        subscription_id: {
          value: SUBSCRIPTION_ID,
          expected: SUBSCRIPTION_ID,
        },
        human_ipr: { value: HUMAN_IPR, expected: HUMAN_IPR },
        subject_ipr: { value: HUMAN_IPR, expected: HUMAN_IPR },
        runtime_ipr: { value: RUNTIME_IPR, expected: RUNTIME_IPR },
        session_id: { value: sessionId, expected: sessionId },
        thread_id: { value: threadId, expected: threadId },
        memory_id: { value: memoryId, expected: memoryId },
        event_kind: {
          value: "RUNTIME_SELF_TEST",
          expected: "RUNTIME_SELF_TEST",
        },
        event_type: {
          value: "CROSS_LEDGER_TRANSACTION",
          expected: "CROSS_LEDGER_TRANSACTION",
        },
        kind: {
          value: "EVT_TECHNICAL_SELF_TEST",
          expected: "EVT_TECHNICAL_SELF_TEST",
        },
        event_family: { value: "UP-EVT", expected: "UP-EVT" },
        cycle: { value: "UP-CANONICO", expected: "UP-CANONICO" },
        runtime_state: { value: "READY", expected: "READY" },
        state: { value: "VERIFIED", expected: "VERIFIED" },
        runtime_decision: { value: "ALLOW", expected: "ALLOW" },
        decision: { value: "ALLOW", expected: "ALLOW" },
        policy_decision: { value: "ALLOW", expected: "ALLOW" },
        risk_level: { value: "LOW", expected: "LOW" },
        memory_scope: { value: "RUNTIME_ONLY", expected: "RUNTIME_ONLY" },
        context_class: {
          value: "TECHNICAL_DIAGNOSTIC",
          expected: "TECHNICAL_DIAGNOSTIC",
        },
        intent_class: {
          value: "RUNTIME_SELF_TEST",
          expected: "RUNTIME_SELF_TEST",
        },
        project_domain: {
          value: "HBCE_RUNTIME",
          expected: "HBCE_RUNTIME",
        },
        hbce_module: { value: "EVT", expected: "EVT" },
        evt_hash: { value: eventHash, expected: eventHash },
        event_hash: { value: eventHash, expected: eventHash },
        hash: { value: eventHash, expected: eventHash },
        chain_hash: {
          value: sha256(
            stableJson({
              previousEventId: null,
              evtId,
              eventHash,
              memoryId,
            }),
          ),
          expected: sha256(
            stableJson({
              previousEventId: null,
              evtId,
              eventHash,
              memoryId,
            }),
          ),
        },
        input_hash: { value: inputHash, expected: inputHash },
        output_hash: { value: outputHash, expected: outputHash },
        policy_hash: { value: policyHash, expected: policyHash },
        memory_hash: { value: memoryHash, expected: memoryHash },
        temporal_certificate: jsonCandidate(temporalCertificate),
        response_utc: timestampCandidate(generatedAt),
        birth_anchor_local: {
          value: BIRTH_ANCHOR_LOCAL,
          expected: BIRTH_ANCHOR_LOCAL,
        },
        birth_anchor_utc: timestampCandidate(BIRTH_ANCHOR_UTC),
        operational_context: jsonCandidate({
          transactionId,
          mode: "CROSS_LEDGER_TRANSACTION_SELF_TEST",
        }),
        anchors: jsonCandidate({
          memoryId,
          proofId,
          auditId,
          usageId,
        }),
        trace: jsonCandidate({
          inputHash,
          outputHash,
          policyHash,
          memoryHash,
          eventHash,
        }),
        payload: jsonCandidate(eventPayload),
        event_payload: jsonCandidate(eventPayload),
        legal_certification: { value: false, expected: false },
      },
    },

    {
      key: "opc",
      table: "opc_proofs",
      identifierCandidates: ["proof_id", "id"],
      candidates: {
        proof_id: { value: proofId, expected: proofId },
        id: { value: proofId, expected: proofId },
        evt_id: { value: evtId, expected: evtId },
        event_id: { value: evtId, expected: evtId },
        tenant_id: { value: TENANT_ID, expected: TENANT_ID },
        workspace_id: { value: WORKSPACE_ID, expected: WORKSPACE_ID },
        subscription_id: {
          value: SUBSCRIPTION_ID,
          expected: SUBSCRIPTION_ID,
        },
        human_ipr: { value: HUMAN_IPR, expected: HUMAN_IPR },
        subject_ipr: { value: HUMAN_IPR, expected: HUMAN_IPR },
        runtime_ipr: { value: RUNTIME_IPR, expected: RUNTIME_IPR },
        session_id: { value: sessionId, expected: sessionId },
        thread_id: { value: threadId, expected: threadId },
        memory_id: { value: memoryId, expected: memoryId },
        kind: {
          value: "RUNTIME_SELF_TEST",
          expected: "RUNTIME_SELF_TEST",
        },
        proof_kind: {
          value: "CROSS_LEDGER_TRANSACTION",
          expected: "CROSS_LEDGER_TRANSACTION",
        },
        receipt_type: {
          value: "OPC_TECHNICAL_PROOF_RECEIPT",
          expected: "OPC_TECHNICAL_PROOF_RECEIPT",
        },
        persistence_mode: {
          value: "DATABASE_PERSISTENT",
          expected: "DATABASE_PERSISTENT",
        },
        persistence_status: { value: "PERSISTED", expected: "PERSISTED" },
        input_hash: { value: inputHash, expected: inputHash },
        output_hash: { value: outputHash, expected: outputHash },
        decision_hash: { value: policyHash, expected: policyHash },
        event_hash: { value: eventHash, expected: eventHash },
        evt_hash: { value: eventHash, expected: eventHash },
        memory_hash: { value: memoryHash, expected: memoryHash },
        previous_proof_hash: { value: null, expected: null },
        chain_hash: {
          value: sha256(
            stableJson({
              previousProofHash: null,
              proofId,
              evtId,
              memoryId,
              proofHash,
            }),
          ),
          expected: sha256(
            stableJson({
              previousProofHash: null,
              proofId,
              evtId,
              memoryId,
              proofHash,
            }),
          ),
        },
        audit_status: { value: "NOT_CREATED", expected: "NOT_CREATED" },
        verification_status: {
          value: "VERIFIABLE",
          expected: "VERIFIABLE",
        },
        runtime_state: { value: "READY", expected: "READY" },
        runtime_decision: { value: "ALLOW", expected: "ALLOW" },
        risk_class: { value: "LOW", expected: "LOW" },
        policy_reference: {
          value: REVISION,
          expected: REVISION,
        },
        project_domain: {
          value: "HBCE_RUNTIME",
          expected: "HBCE_RUNTIME",
        },
        hbce_module: { value: "OPC", expected: "OPC" },
        temporal_certificate: jsonCandidate(temporalCertificate),
        response_utc: timestampCandidate(generatedAt),
        birth_anchor_local: {
          value: BIRTH_ANCHOR_LOCAL,
          expected: BIRTH_ANCHOR_LOCAL,
        },
        birth_anchor_utc: timestampCandidate(BIRTH_ANCHOR_UTC),
        operational_context: jsonCandidate({
          transactionId,
          mode: "CROSS_LEDGER_TRANSACTION_SELF_TEST",
        }),
        identity: jsonCandidate({
          humanIpr: HUMAN_IPR,
          runtimeIpr: RUNTIME_IPR,
        }),
        engine: jsonCandidate({
          runtime: RUNTIME_NAME,
          revision: REVISION,
        }),
        event: jsonCandidate({
          evtId,
          eventHash,
          memoryId,
        }),
        memory: jsonCandidate({
          memoryId,
          memoryHash,
        }),
        runtime: jsonCandidate({
          state: "READY",
          decision: "ALLOW",
        }),
        proof: jsonCandidate({
          ...proofPayload,
          proofHash,
        }),
        audit: jsonCandidate({
          auditStatus: "NOT_CREATED",
          auditId,
        }),
        verification: jsonCandidate({
          status: "VERIFIABLE",
          proofHash,
          eventHash,
          memoryHash,
        }),
        boundary: jsonCandidate({
          legalCertification: false,
          opcBoundary: "technical proof receipt only",
        }),
        payload: jsonCandidate(proofPayload),
        proof_payload: jsonCandidate({
          ...proofPayload,
          proofHash,
        }),
        legal_certification: { value: false, expected: false },
      },
    },

    {
      key: "audit",
      table: "runtime_audit_logs",
      identifierCandidates: ["audit_id"],
      candidates: {
        audit_id: { value: auditId, expected: auditId },
        source: { value: REVISION, expected: REVISION },
        request_id: { value: transactionId, expected: transactionId },
        tenant_id: { value: TENANT_ID, expected: TENANT_ID },
        workspace_id: { value: WORKSPACE_ID, expected: WORKSPACE_ID },
        subscription_id: {
          value: SUBSCRIPTION_ID,
          expected: SUBSCRIPTION_ID,
        },
        human_ipr: { value: HUMAN_IPR, expected: HUMAN_IPR },
        runtime_ipr: { value: RUNTIME_IPR, expected: RUNTIME_IPR },
        session_id: { value: sessionId, expected: sessionId },
        thread_id: { value: threadId, expected: threadId },
        evt_id: { value: evtId, expected: evtId },
        evt_ref: { value: evtId, expected: evtId },
        evt_hash: { value: eventHash, expected: eventHash },
        opc_proof_id: { value: proofId, expected: proofId },
        opc_ref: { value: proofId, expected: proofId },
        opc_proof_hash: { value: proofHash, expected: proofHash },
        memory_id: { value: memoryId, expected: memoryId },
        memory_ref: { value: memoryId, expected: memoryId },
        memory_hash: { value: memoryHash, expected: memoryHash },
        identity_state: { value: "VERIFIED", expected: "VERIFIED" },
        organization_state: { value: "SELF_PILOT", expected: "SELF_PILOT" },
        workspace_state: { value: "ACTIVE", expected: "ACTIVE" },
        audit_kind: {
          value: "RUNTIME_SELF_TEST",
          expected: "RUNTIME_SELF_TEST",
        },
        runtime_state: { value: "READY", expected: "READY" },
        runtime_decision: { value: "ALLOW", expected: "ALLOW" },
        audit_state: { value: "PERSISTED", expected: "PERSISTED" },
        risk_level: { value: "LOW", expected: "LOW" },
        data_class: {
          value: "INTERNAL_TECHNICAL_TEST",
          expected: "INTERNAL_TECHNICAL_TEST",
        },
        context_class: {
          value: "TECHNICAL_DIAGNOSTIC",
          expected: "TECHNICAL_DIAGNOSTIC",
        },
        project_domain: {
          value: "HBCE_RUNTIME",
          expected: "HBCE_RUNTIME",
        },
        hbce_module: { value: "AUDIT", expected: "AUDIT" },
        access_decision: { value: "ALLOW", expected: "ALLOW" },
        c2_allowed: { value: true, expected: true },
        c2_fail_closed: { value: false, expected: false },
        blocked: { value: false, expected: false },
        allowed: { value: true, expected: true },
        fail_closed: { value: false, expected: false },
        human_oversight: {
          value: "NOT_REQUIRED",
          expected: "NOT_REQUIRED",
        },
        memory_scope: { value: "RUNTIME_ONLY", expected: "RUNTIME_ONLY" },
        memory_authority: {
          value: "SESSION_RUNTIME_ONLY",
          expected: "SESSION_RUNTIME_ONLY",
        },
        persistence_mode: {
          value: "DATABASE_PERSISTENT",
          expected: "DATABASE_PERSISTENT",
        },
        evt_required: { value: true, expected: true },
        opc_required: { value: true, expected: true },
        audit_required: { value: true, expected: true },
        input_hash: { value: inputHash, expected: inputHash },
        output_hash: { value: outputHash, expected: outputHash },
        decision_hash: { value: policyHash, expected: policyHash },
        policy_hash: { value: policyHash, expected: policyHash },
        temporal_certificate: jsonCandidate(temporalCertificate),
        response_utc: timestampCandidate(generatedAt),
        birth_anchor_local: {
          value: BIRTH_ANCHOR_LOCAL,
          expected: BIRTH_ANCHOR_LOCAL,
        },
        birth_anchor_utc: timestampCandidate(BIRTH_ANCHOR_UTC),
        audit_hash: { value: auditHash, expected: auditHash },
        reason: {
          value: "HBCE cross-ledger transaction self-test",
          expected: "HBCE cross-ledger transaction self-test",
        },
        payload: jsonCandidate(auditPayload),
        audit_payload: jsonCandidate({
          ...auditPayload,
          auditHash,
        }),
        legal_certification: { value: false, expected: false },
      },
    },

    {
      key: "usage",
      table: "model_usage",
      identifierCandidates: ["usage_id"],
      candidates: {
        usage_id: { value: usageId, expected: usageId },
        source: { value: REVISION, expected: REVISION },
        provider: { value: "LOCAL", expected: "LOCAL" },
        tenant_id: { value: TENANT_ID, expected: TENANT_ID },
        workspace_id: { value: WORKSPACE_ID, expected: WORKSPACE_ID },
        subscription_id: {
          value: SUBSCRIPTION_ID,
          expected: SUBSCRIPTION_ID,
        },
        human_ipr: { value: HUMAN_IPR, expected: HUMAN_IPR },
        runtime_ipr: { value: RUNTIME_IPR, expected: RUNTIME_IPR },
        session_id: { value: sessionId, expected: sessionId },
        thread_id: { value: threadId, expected: threadId },
        request_id: { value: transactionId, expected: transactionId },
        evt_id: { value: evtId, expected: evtId },
        evt_ref: { value: evtId, expected: evtId },
        evt_hash: { value: eventHash, expected: eventHash },
        opc_proof_id: { value: proofId, expected: proofId },
        opc_ref: { value: proofId, expected: proofId },
        opc_proof_hash: { value: proofHash, expected: proofHash },
        audit_id: { value: auditId, expected: auditId },
        selected_model: {
          value: "hbce-cross-ledger-self-test",
          expected: "hbce-cross-ledger-self-test",
        },
        model: {
          value: "hbce-cross-ledger-self-test",
          expected: "hbce-cross-ledger-self-test",
        },
        model_level: { value: "STANDARD", expected: "STANDARD" },
        model_routing_reason: {
          value: "TECHNICAL_SELF_TEST",
          expected: "TECHNICAL_SELF_TEST",
        },
        routing_reason: {
          value: "TECHNICAL_SELF_TEST",
          expected: "TECHNICAL_SELF_TEST",
        },
        saas_tier: { value: "IPR", expected: "IPR" },
        risk_level: { value: "LOW", expected: "LOW" },
        runtime_decision: { value: "ALLOW", expected: "ALLOW" },
        audit_state: { value: "PERSISTED", expected: "PERSISTED" },
        operational_value: {
          value: "TECHNICAL_VALIDATION",
          expected: "TECHNICAL_VALIDATION",
        },
        cyber_relevance: { value: "LOW", expected: "LOW" },
        c2_boundary: {
          value: "TECHNICAL_RUNTIME_TEST_ONLY",
          expected: "TECHNICAL_RUNTIME_TEST_ONLY",
        },
        proof_requirement: {
          value: "EVT_OPC_AUDIT_REQUIRED",
          expected: "EVT_OPC_AUDIT_REQUIRED",
        },
        evt_required: { value: true, expected: true },
        opc_required: { value: true, expected: true },
        audit_required: { value: true, expected: true },
        input_tokens: { value: 128, expected: 128 },
        output_tokens: { value: 64, expected: 64 },
        total_tokens: { value: 192, expected: 192 },
        cached_input_tokens: { value: 0, expected: 0 },
        reasoning_tokens: { value: 0, expected: 0 },
        estimated_cost_units: { value: 0, expected: 0 },
        estimated_cost_minor: { value: 0, expected: 0 },
        currency: { value: "EUR", expected: "EUR" },
        accounting_mode: {
          value: "TECHNICAL_SELF_TEST",
          expected: "TECHNICAL_SELF_TEST",
        },
        blocked: { value: false, expected: false },
        allowed: { value: true, expected: true },
        fail_closed: { value: false, expected: false },
        persistence_mode: {
          value: "DATABASE_PERSISTENT",
          expected: "DATABASE_PERSISTENT",
        },
        temporal_certificate: jsonCandidate(temporalCertificate),
        response_utc: timestampCandidate(generatedAt),
        birth_anchor_local: {
          value: BIRTH_ANCHOR_LOCAL,
          expected: BIRTH_ANCHOR_LOCAL,
        },
        birth_anchor_utc: timestampCandidate(BIRTH_ANCHOR_UTC),
        usage_hash: { value: usageHash, expected: usageHash },
        reason: {
          value: "HBCE cross-ledger transaction self-test",
          expected: "HBCE cross-ledger transaction self-test",
        },
        payload: jsonCandidate(usagePayload),
        usage_payload: jsonCandidate({
          ...usagePayload,
          usageHash,
        }),
        legal_certification: { value: false, expected: false },
      },
    },
  ];

  const specByKey = new Map(
    specs.map((spec) => [spec.key, spec]),
  );

  try {
    const configurationStartedAt = nowMs();

    const configured = isHbceDatabaseConfigured();
    const databaseDescription = describeDefaultHbceDatabase();

    checks.push(
      createCheck({
        id: "DATABASE_CONFIGURATION",
        label: "HBCE database configuration",
        status: configured ? "PASS" : "FAIL",
        durationMs: elapsedMs(configurationStartedAt),
        details: {
          configured,
          available: databaseDescription.available,
          kind: databaseDescription.kind,
          driver: databaseDescription.driver,
          mode: databaseDescription.mode,
          databaseUrlPresent:
            databaseDescription.databaseUrlPresent,
          schemaVersion: databaseDescription.schemaVersion,
          persistenceMode: databaseDescription.persistenceMode,
        },
        error:
          configured
            ? null
            : "DATABASE_URL_NOT_CONFIGURED",
      }),
    );

    if (!configured) {
      for (const spec of specs) {
        checks.push(
          skipped(
            `SCHEMA_${spec.key.toUpperCase()}`,
            `Inspect ${spec.table} schema`,
            "DATABASE_NOT_CONFIGURED",
          ),
          skipped(
            `INSERT_${spec.key.toUpperCase()}`,
            `Insert ${spec.key} cross-ledger record`,
            "DATABASE_NOT_CONFIGURED",
          ),
          skipped(
            `VERIFY_${spec.key.toUpperCase()}`,
            `Verify ${spec.key} cross-ledger record`,
            "DATABASE_NOT_CONFIGURED",
          ),
        );
      }
    } else {
      const schemas = new Map<LedgerKey, Column[]>();
      let schemaFailure = false;

      for (const spec of specs) {
        const schema = await inspectTable(spec.table);
        checks.push(schema.check);
        schemas.set(spec.key, schema.columns);

        if (schema.check.status !== "PASS") {
          schemaFailure = true;
        }
      }

      if (schemaFailure) {
        for (const spec of specs) {
          checks.push(
            skipped(
              `INSERT_${spec.key.toUpperCase()}`,
              `Insert ${spec.key} cross-ledger record`,
              "SCHEMA_DISCOVERY_FAILED",
            ),
            skipped(
              `VERIFY_${spec.key.toUpperCase()}`,
              `Verify ${spec.key} cross-ledger record`,
              "SCHEMA_DISCOVERY_FAILED",
            ),
          );
        }
      } else {
        let insertionFailed = false;

        for (const spec of specs) {
          if (insertionFailed) {
            checks.push(
              skipped(
                `INSERT_${spec.key.toUpperCase()}`,
                `Insert ${spec.key} cross-ledger record`,
                "PREVIOUS_LEDGER_INSERT_FAILED",
              ),
              skipped(
                `VERIFY_${spec.key.toUpperCase()}`,
                `Verify ${spec.key} cross-ledger record`,
                "PREVIOUS_LEDGER_INSERT_FAILED",
              ),
            );
            continue;
          }

          const result = await insertLedger(
            spec,
            schemas.get(spec.key) ?? [],
          );

          checks.push(result.check);

          if (!result.inserted) {
            insertionFailed = true;
            checks.push(
              skipped(
                `VERIFY_${spec.key.toUpperCase()}`,
                `Verify ${spec.key} cross-ledger record`,
                "INSERT_FAILED",
              ),
            );
            continue;
          }

          inserted.push(result.inserted);

          checks.push(
            await readAndVerifyLedger(
              spec,
              result.inserted,
            ),
          );
        }

        if (!insertionFailed && inserted.length === specs.length) {
          const crossStartedAt = nowMs();

          const crossResult =
            await queryHbceDatabase<GenericRow>(
              `
                SELECT
                  m.memory_id,
                  e.evt_id,
                  e.memory_id AS evt_memory_id,
                  o.proof_id,
                  o.evt_id AS opc_evt_id,
                  o.memory_id AS opc_memory_id,
                  a.audit_id,
                  a.evt_id AS audit_evt_id,
                  a.opc_proof_id AS audit_opc_proof_id,
                  a.memory_id AS audit_memory_id,
                  u.usage_id,
                  u.evt_id AS usage_evt_id,
                  u.opc_proof_id AS usage_opc_proof_id,
                  u.audit_id AS usage_audit_id
                FROM memory_records m
                JOIN evt_records e
                  ON e.memory_id = m.memory_id
                JOIN opc_proofs o
                  ON o.evt_id = e.evt_id
                 AND o.memory_id = m.memory_id
                JOIN runtime_audit_logs a
                  ON a.evt_id = e.evt_id
                 AND a.opc_proof_id = o.proof_id
                 AND a.memory_id = m.memory_id
                JOIN model_usage u
                  ON u.evt_id = e.evt_id
                 AND u.opc_proof_id = o.proof_id
                 AND u.audit_id = a.audit_id
                WHERE m.memory_id = $1
                  AND e.evt_id = $2
                  AND o.proof_id = $3
                  AND a.audit_id = $4
                  AND u.usage_id = $5
                LIMIT 1
              `,
              [memoryId, evtId, proofId, auditId, usageId],
            );

          const row = crossResult.rows[0];

          const comparisons = {
            memoryId:
              asString(row?.memory_id) === memoryId,
            evtId:
              asString(row?.evt_id) === evtId,
            evtMemoryId:
              asString(row?.evt_memory_id) === memoryId,
            proofId:
              asString(row?.proof_id) === proofId,
            opcEvtId:
              asString(row?.opc_evt_id) === evtId,
            opcMemoryId:
              asString(row?.opc_memory_id) === memoryId,
            auditId:
              asString(row?.audit_id) === auditId,
            auditEvtId:
              asString(row?.audit_evt_id) === evtId,
            auditOpcProofId:
              asString(row?.audit_opc_proof_id) === proofId,
            auditMemoryId:
              asString(row?.audit_memory_id) === memoryId,
            usageId:
              asString(row?.usage_id) === usageId,
            usageEvtId:
              asString(row?.usage_evt_id) === evtId,
            usageOpcProofId:
              asString(row?.usage_opc_proof_id) === proofId,
            usageAuditId:
              asString(row?.usage_audit_id) === auditId,
          };

          const failedComparisons = Object.entries(comparisons)
            .filter(([, passed]) => !passed)
            .map(([name]) => name);

          const crossOk =
            crossResult.ok &&
            crossResult.rowCount === 1 &&
            failedComparisons.length === 0;

          checks.push(
            createCheck({
              id: "CROSS_LEDGER_JOIN_VERIFY",
              label:
                "Verify linked Memory → EVT → OPC → Audit → Model Usage chain",
              status: crossOk ? "PASS" : "FAIL",
              durationMs: elapsedMs(crossStartedAt),
              details: {
                transactionId,
                memoryId,
                evtId,
                proofId,
                auditId,
                usageId,
                rowCount: crossResult.rowCount,
                comparisons,
                failedComparisons,
                queryStatus: crossResult.status,
                queryDurationMs: crossResult.durationMs,
                sqlHash: crossResult.sqlHash,
              },
              error:
                crossResult.error ??
                (crossOk
                  ? null
                  : `CROSS_LEDGER_JOIN_FAILED:${failedComparisons.join(",")}`),
            }),
          );
        } else {
          checks.push(
            skipped(
              "CROSS_LEDGER_JOIN_VERIFY",
              "Verify linked Memory → EVT → OPC → Audit → Model Usage chain",
              "INCOMPLETE_LEDGER_INSERTION",
            ),
          );
        }
      }
    }
  } catch (error) {
    checks.push(
      createCheck({
        id: "UNHANDLED_RUNTIME_ERROR",
        label:
          "Unhandled cross-ledger transaction self-test runtime error",
        status: "FAIL",
        durationMs: elapsedMs(startedAt),
        details: {
          transactionId,
          memoryId,
          evtId,
          proofId,
          auditId,
          usageId,
        },
        error: normalizeError(error),
      }),
    );
  } finally {
    /*
     * Cleanup inverso intenzionale:
     * Model Usage → Audit → OPC → EVT → Memory.
     */
    for (const record of [...inserted].reverse()) {
      try {
        checks.push(await deleteLedger(record));
        checks.push(await verifyCleanup(record));
      } catch (error) {
        checks.push(
          createCheck({
            id: `CLEANUP_EXCEPTION_${record.key.toUpperCase()}`,
            label: `Cleanup ${record.key} cross-ledger record`,
            status: "FAIL",
            durationMs: 0,
            details: {
              table: record.table,
              identifierColumn: record.identifierColumn,
              identifierValue: record.identifierValue,
            },
            error: normalizeError(error),
          }),
        );
      }
    }
  }

  const requiredFailed = checks.some(
    (check) =>
      check.required &&
      check.status !== "PASS",
  );

  const ok = !requiredFailed;
  const durationMs = elapsedMs(startedAt);

  const firstFailure =
    checks.find(
      (check) =>
        check.required &&
        check.status !== "PASS",
    ) ?? null;

  return NextResponse.json(
    {
      ok,

      status: ok
        ? "HBCE_RUNTIME_CROSS_LEDGER_TRANSACTION_PASS"
        : "HBCE_RUNTIME_CROSS_LEDGER_TRANSACTION_FAIL",

      operationalStatus:
        ok ? "PASS" : "FAIL",

      revision: REVISION,
      generatedAt,
      product: PRODUCT,
      apiVersion: API_VERSION,
      runtime: RUNTIME_NAME,

      deployment: {
        origin: getOrigin(request),
        runtimeEnvironment:
          process.env.VERCEL_ENV ??
          process.env.NODE_ENV ??
          "unknown",
        vercelEnvironment:
          process.env.VERCEL_ENV ?? null,
        vercelRegion:
          process.env.VERCEL_REGION ??
          process.env.AWS_REGION ??
          null,
        nodeVersion: process.version,
      },

      transaction: {
        transactionId,
        executionMode:
          "DIRECT_CROSS_LEDGER_DATABASE_TRANSACTION_TEST",
        insertionOrder: [
          "memory_records",
          "evt_records",
          "opc_proofs",
          "runtime_audit_logs",
          "model_usage",
        ],
        cleanupOrder: [
          "model_usage",
          "runtime_audit_logs",
          "opc_proofs",
          "evt_records",
          "memory_records",
        ],
        identifiers: {
          memoryId,
          evtId,
          proofId,
          auditId,
          usageId,
          sessionId,
          threadId,
        },
        hashes: {
          memoryHash,
          eventHash,
          proofHash,
          auditHash,
          usageHash,
          inputHash,
          outputHash,
          policyHash,
        },
        firstFailure:
          firstFailure
            ? {
                id: firstFailure.id,
                error: firstFailure.error,
              }
            : null,
      },

      summary:
        buildSummary(
          checks,
          durationMs,
        ),

      checks,

      interpretation: {
        databaseConfigured:
          checks.find(
            (check) =>
              check.id ===
              "DATABASE_CONFIGURATION",
          )?.status === "PASS",

        memoryInsertedAndVerified:
          checks.find(
            (check) =>
              check.id === "VERIFY_MEMORY",
          )?.status === "PASS",

        evtInsertedAndVerified:
          checks.find(
            (check) =>
              check.id === "VERIFY_EVT",
          )?.status === "PASS",

        opcInsertedAndVerified:
          checks.find(
            (check) =>
              check.id === "VERIFY_OPC",
          )?.status === "PASS",

        auditInsertedAndVerified:
          checks.find(
            (check) =>
              check.id === "VERIFY_AUDIT",
          )?.status === "PASS",

        modelUsageInsertedAndVerified:
          checks.find(
            (check) =>
              check.id === "VERIFY_USAGE",
          )?.status === "PASS",

        crossLedgerReferencesVerified:
          checks.find(
            (check) =>
              check.id ===
              "CROSS_LEDGER_JOIN_VERIFY",
          )?.status === "PASS",

        reverseCleanupCompleted:
          inserted.every((record) =>
            checks.some(
              (check) =>
                check.id ===
                  `CLEANUP_${record.key.toUpperCase()}` &&
                check.status === "PASS",
            ),
          ),

        completeCrossLedgerTransactionPassed:
          ok,
      },

      boundary: {
        legalCertification: false,
        technicalRuntimeTestOnly: true,
        performsDirectDatabaseMutation: true,
        performsTemporaryCrossLedgerWrites: true,
        verifiesCrossRecordReferences: true,
        verifiesSharedLinkedDataset: true,
        databaseTransactionAtomicity:
          "NOT_GUARANTEED_BY_NEON_HTTP_MULTI_QUERY_SEQUENCE",
        rollbackMode:
          "EXPLICIT_REVERSE_CLEANUP",
        downstreamRecordsRetained: false,
        performsRealModelCall: false,
        createsPersistentBusinessData: false,
        replacesHumanReview: false,
        note:
          "This Level 2 test creates one temporary linked dataset across Memory, EVT, OPC, Audit and Model Usage, verifies the cross-ledger joins, then removes the records in reverse dependency order. Because the Neon HTTP driver executes separate statements, this is a linked multi-step transaction test, not a single PostgreSQL BEGIN/COMMIT atomic transaction.",
      },
    },
    {
      status: ok ? 200 : 503,
      headers: {
        "Cache-Control":
          "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
        "X-HBCE-Cross-Ledger-Test-Revision":
          REVISION,
        "X-HBCE-Cross-Ledger-Test-Status":
          ok ? "PASS" : "FAIL",
        "X-HBCE-Legal-Certification":
          "false",
      },
    },
  );
}

export async function GET(
  request: NextRequest,
): Promise<NextResponse> {
  return NextResponse.json(
    {
      ok: true,
      status:
        "HBCE_RUNTIME_CROSS_LEDGER_TRANSACTION_SELF_TEST_READY",
      revision: REVISION,
      endpoint:
        `${getOrigin(
          request,
        )}/api/v1/runtime/cross-ledger/self-test`,
      executionMethod: "POST",
      description:
        "Crea un dataset temporaneo realmente collegato tra memory_records, evt_records, opc_proofs, runtime_audit_logs e model_usage; verifica i riferimenti incrociati e applica cleanup inverso.",
      flow: [
        "MEMORY_INSERT_AND_VERIFY",
        "EVT_INSERT_AND_VERIFY_WITH_MEMORY_LINK",
        "OPC_INSERT_AND_VERIFY_WITH_EVT_AND_MEMORY_LINKS",
        "AUDIT_INSERT_AND_VERIFY_WITH_EVT_OPC_MEMORY_LINKS",
        "MODEL_USAGE_INSERT_AND_VERIFY_WITH_EVT_OPC_AUDIT_LINKS",
        "CROSS_LEDGER_JOIN_VERIFY",
        "REVERSE_CLEANUP",
      ],
      warning:
        "GET non esegue il test. POST effettua scritture temporanee dirette nei cinque ledger e le elimina in ordine inverso.",
      boundary: {
        legalCertification: false,
        technicalRuntimeTestOnly: true,
        performsTemporaryCrossLedgerWrites: true,
        verifiesCrossRecordReferences: true,
        databaseTransactionAtomicity:
          "NOT_GUARANTEED_BY_NEON_HTTP_MULTI_QUERY_SEQUENCE",
        rollbackMode:
          "EXPLICIT_REVERSE_CLEANUP",
        performsRealModelCall: false,
        createsPersistentBusinessData: false,
      },
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
        "X-HBCE-Cross-Ledger-Test-Revision":
          REVISION,
        "X-HBCE-Legal-Certification":
          "false",
      },
    },
  );
}
