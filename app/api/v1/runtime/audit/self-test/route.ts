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

type SelfTestCheck = {
  id: string;
  label: string;
  required: boolean;
  status: CheckStatus;
  durationMs: number;
  details: Record<string, unknown>;
  error: string | null;
};

type SchemaColumnRow = {
  column_name?: unknown;
  data_type?: unknown;
  udt_name?: unknown;
  is_nullable?: unknown;
  column_default?: unknown;
};

type GenericRow = Record<string, unknown>;

type CountRow = {
  record_count?: unknown;
};

type ColumnDefinition = {
  name: string;
  dataType: string;
  udtName: string;
  nullable: boolean;
  defaultValue: string | null;
};

type CandidateValue = {
  value: HbceDatabaseQueryValue;
  expected: unknown;
  sqlCast?: "jsonb" | "timestamptz" | "bigint";
};

const REVISION =
  "HBCE-RUNTIME-AUDIT-SELF-TEST-v1_0";

const PRODUCT =
  "HBCE IPR Operational Identity & Proof Layer";

const API_VERSION = "v1";

const RUNTIME_NAME =
  "AI_JOKER_C2_SAAS_CORE_v0_1";

const TEST_RUNTIME_IPR =
  "IPR-AI-0001";

const TEST_HUMAN_IPR =
  "IPR-HBCE-AUDIT-SELF-TEST";

const TEST_TENANT =
  "HBCE-TENANT-SELF-PILOT";

const TEST_WORKSPACE =
  "HBCE-WORKSPACE-RND";

const TEST_SUBSCRIPTION =
  "HBCE-SUBSCRIPTION-SELF-PILOT";

const TEST_AUDIT_KIND =
  "RUNTIME_SELF_TEST";

const TEST_AUDIT_STATUS =
  "PERSISTED";

const TEST_VERIFICATION_STATUS =
  "VERIFIABLE";

const BIRTH_ANCHOR_LOCAL =
  "2026-01-19T15:30:00+01:00";

const BIRTH_ANCHOR_UTC =
  "2026-01-19T14:30:00.000Z";

const SAFE_IDENTIFIER =
  /^[a-z_][a-z0-9_]*$/;

function nowMs(): number {
  return Date.now();
}

function elapsedMs(startedAt: number): number {
  return Math.max(0, Date.now() - startedAt);
}

function normalizeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return "UNKNOWN_ERROR";
  }
}

function valueAsString(
  value: unknown,
): string | null {
  if (typeof value === "string") {
    return value;
  }

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

function valueAsBoolean(
  value: unknown,
): boolean | null {
  if (typeof value === "boolean") {
    return value;
  }

  if (
    value === "true" ||
    value === 1 ||
    value === "1"
  ) {
    return true;
  }

  if (
    value === "false" ||
    value === 0 ||
    value === "0"
  ) {
    return false;
  }

  return null;
}

function valueAsNumber(
  value: unknown,
): number | null {
  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    return value;
  }

  if (typeof value === "bigint") {
    return Number(value);
  }

  if (typeof value === "string") {
    const parsed = Number(value);

    return Number.isFinite(parsed)
      ? parsed
      : null;
  }

  return null;
}

function isValidTimestamp(
  value: unknown,
): boolean {
  if (value instanceof Date) {
    return !Number.isNaN(value.getTime());
  }

  return (
    typeof value === "string" &&
    !Number.isNaN(Date.parse(value))
  );
}

function stableJson(value: unknown): string {
  if (
    value === null ||
    typeof value !== "object"
  ) {
    return JSON.stringify(value);
  }

  if (value instanceof Date) {
    return JSON.stringify(
      value.toISOString(),
    );
  }

  if (Array.isArray(value)) {
    return `[${value
      .map((item) => stableJson(item))
      .join(",")}]`;
  }

  const record =
    value as Record<string, unknown>;

  return `{${Object.keys(record)
    .sort()
    .map(
      (key) =>
        `${JSON.stringify(
          key,
        )}:${stableJson(record[key])}`,
    )
    .join(",")}}`;
}

function sha256(value: string): string {
  return `sha256:${createHash("sha256")
    .update(value, "utf8")
    .digest("hex")}`;
}

function quoteIdentifier(
  identifier: string,
): string {
  if (!SAFE_IDENTIFIER.test(identifier)) {
    throw new Error(
      `UNSAFE_SQL_IDENTIFIER:${identifier}`,
    );
  }

  return `"${identifier}"`;
}

function createCheck(input: {
  id: string;
  label: string;
  required?: boolean;
  status: CheckStatus;
  durationMs: number;
  details?: Record<string, unknown>;
  error?: string | null;
}): SelfTestCheck {
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

function createSkippedCheck(
  id: string,
  label: string,
  reason: string,
): SelfTestCheck {
  return createCheck({
    id,
    label,
    status: "SKIPPED",
    durationMs: 0,
    details: { reason },
    error: `${id}_SKIPPED`,
  });
}

function buildSummary(
  checks: SelfTestCheck[],
  durationMs: number,
): Record<string, number> {
  const required =
    checks.filter((check) => check.required);

  return {
    totalChecks: checks.length,
    passedChecks: checks.filter(
      (check) => check.status === "PASS",
    ).length,
    failedChecks: checks.filter(
      (check) => check.status === "FAIL",
    ).length,
    skippedChecks: checks.filter(
      (check) => check.status === "SKIPPED",
    ).length,
    requiredChecks: required.length,
    requiredPassed: required.filter(
      (check) => check.status === "PASS",
    ).length,
    requiredFailed: required.filter(
      (check) => check.status !== "PASS",
    ).length,
    durationMs,
  };
}

function getRequestOrigin(
  request: NextRequest,
): string {
  const proto =
    request.headers.get(
      "x-forwarded-proto",
    );

  const forwardedHost =
    request.headers.get(
      "x-forwarded-host",
    );

  const host =
    forwardedHost ??
    request.headers.get("host");

  return host
    ? `${proto ?? "https"}://${host}`
    : request.nextUrl.origin;
}

function normalizeColumn(
  row: SchemaColumnRow,
): ColumnDefinition | null {
  const name =
    valueAsString(row.column_name);

  const dataType =
    valueAsString(row.data_type);

  const udtName =
    valueAsString(row.udt_name);

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
    nullable:
      valueAsString(
        row.is_nullable,
      ) === "YES",
    defaultValue:
      valueAsString(
        row.column_default,
      ),
  };
}

function jsonCandidate(
  document: Record<string, unknown>,
): CandidateValue {
  return {
    value: stableJson(document),
    expected: document,
    sqlCast: "jsonb",
  };
}

function buildSqlParameter(
  index: number,
  candidate: CandidateValue,
): string {
  switch (candidate.sqlCast) {
    case "jsonb":
      return `$${index}::jsonb`;

    case "timestamptz":
      return `$${index}::timestamptz`;

    case "bigint":
      return `$${index}::bigint`;

    default:
      return `$${index}`;
  }
}

function valuesMatch(
  expected: unknown,
  stored: unknown,
): boolean {
  if (expected === null) {
    return stored === null;
  }

  if (typeof expected === "boolean") {
    return (
      valueAsBoolean(stored) === expected
    );
  }

  if (typeof expected === "number") {
    return valueAsNumber(stored) === expected;
  }

  if (typeof expected === "object") {
    return (
      stored !== null &&
      typeof stored === "object" &&
      stableJson(stored) ===
        stableJson(expected)
    );
  }

  return (
    valueAsString(stored) ===
    String(expected)
  );
}

async function inspectAuditSchema(): Promise<{
  check: SelfTestCheck;
  columns: ColumnDefinition[];
}> {
  const startedAt = nowMs();

  try {
    const result =
      await queryHbceDatabase<SchemaColumnRow>(
        `
          SELECT
            column_name,
            data_type,
            udt_name,
            is_nullable,
            column_default
          FROM information_schema.columns
          WHERE table_schema = current_schema()
            AND table_name = 'runtime_audit_logs'
          ORDER BY ordinal_position
        `,
      );

    const columns =
      result.rows
        .map(normalizeColumn)
        .filter(
          (
            column,
          ): column is ColumnDefinition =>
            column !== null,
        );

    const passed =
      result.ok &&
      columns.length > 0;

    return {
      columns,

      check: createCheck({
        id: "AUDIT_SCHEMA",
        label:
          "Inspect canonical audit table schema",
        status:
          passed ? "PASS" : "FAIL",
        durationMs:
          elapsedMs(startedAt),
        details: {
          table:
            "runtime_audit_logs",
          columnCount:
            columns.length,
          columns:
            columns.map((column) => ({
              name: column.name,
              dataType:
                column.dataType,
              udtName:
                column.udtName,
              nullable:
                column.nullable,
              hasDefault:
                column.defaultValue !== null,
            })),
          queryStatus:
            result.status,
          queryDurationMs:
            result.durationMs,
          sqlHash:
            result.sqlHash,
        },
        error:
          result.error ??
          (
            passed
              ? null
              : "AUDIT_SCHEMA_NOT_AVAILABLE"
          ),
      }),
    };
  } catch (error) {
    return {
      columns: [],

      check: createCheck({
        id: "AUDIT_SCHEMA",
        label:
          "Inspect canonical audit table schema",
        status: "FAIL",
        durationMs:
          elapsedMs(startedAt),
        error:
          normalizeError(error),
      }),
    };
  }
}

async function deleteAuditRecord(
  identifierColumn: string,
  auditId: string,
): Promise<SelfTestCheck> {
  const startedAt = nowMs();

  try {
    const identifier =
      quoteIdentifier(
        identifierColumn,
      );

    const result =
      await queryHbceDatabase<GenericRow>(
        `
          DELETE FROM runtime_audit_logs
          WHERE ${identifier} = $1
          RETURNING ${identifier}
        `,
        [auditId],
      );

    const deletedId =
      valueAsString(
        result.rows[0]?.[
          identifierColumn
        ],
      );

    const deleted =
      result.ok &&
      result.rowCount === 1 &&
      deletedId === auditId;

    return createCheck({
      id: "AUDIT_DELETE",
      label:
        "Delete temporary audit record",
      status:
        deleted ? "PASS" : "FAIL",
      durationMs:
        elapsedMs(startedAt),
      details: {
        auditId,
        identifierColumn,
        deletedId,
        deletedRowCount:
          result.rowCount,
        queryStatus:
          result.status,
        queryDurationMs:
          result.durationMs,
        sqlHash:
          result.sqlHash,
      },
      error:
        result.error ??
        (
          deleted
            ? null
            : "AUDIT_DELETE_NOT_CONFIRMED"
        ),
    });
  } catch (error) {
    return createCheck({
      id: "AUDIT_DELETE",
      label:
        "Delete temporary audit record",
      status: "FAIL",
      durationMs:
        elapsedMs(startedAt),
      details: {
        auditId,
        identifierColumn,
      },
      error:
        normalizeError(error),
    });
  }
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse> {
  const startedAt = nowMs();

  const generatedAt =
    new Date().toISOString();

  const checks: SelfTestCheck[] = [];

  const compactTimestamp =
    generatedAt
      .replace(/\D/g, "")
      .slice(0, 14);

  const suffix =
    randomUUID()
      .replace(/-/g, "")
      .slice(0, 8)
      .toUpperCase();

  const auditId =
    `AUDIT-${compactTimestamp}-${suffix}`;

  const evtId =
    `EVT-AUDIT-SELF-TEST-${suffix}`;

  const proofId =
    `OPC-AUDIT-SELF-TEST-${suffix}`;

  const sessionId =
    `HBCE-AUDIT-SELF-TEST-SESSION-${randomUUID()}`;

  const threadId =
    `HBCE-AUDIT-SELF-TEST-THREAD-${randomUUID()}`;

  const inputHash =
    sha256(
      stableJson({
        command:
          "HBCE_RUNTIME_AUDIT_SELF_TEST",
        auditId,
        evtId,
        proofId,
        generatedAt,
      }),
    );

  const outputHash =
    sha256(
      stableJson({
        result:
          "TEMPORARY_AUDIT_CREATED",
        expectedCleanup:
          true,
      }),
    );

  const decisionHash =
    sha256(
      stableJson({
        decision:
          "ALLOW",
        riskLevel:
          "LOW",
      }),
    );

  const eventHash =
    sha256(
      stableJson({
        evtId,
        generatedAt,
      }),
    );

  const proofHash =
    sha256(
      stableJson({
        proofId,
        evtId,
        generatedAt,
      }),
    );

  const auditDocument = {
    auditId,
    evtId,
    proofId,
    auditKind:
      TEST_AUDIT_KIND,
    auditStatus:
      TEST_AUDIT_STATUS,
    verificationStatus:
      TEST_VERIFICATION_STATUS,
    humanIpr:
      TEST_HUMAN_IPR,
    runtimeIpr:
      TEST_RUNTIME_IPR,
    generatedAt,
    inputHash,
    outputHash,
    decisionHash,
    eventHash,
    proofHash,
    legalCertification:
      false,
    auditBoundary:
      "technical audit receipt only",
    opcBoundary:
      "technical proof receipt only",
  };

  const auditHash =
    sha256(
      stableJson(auditDocument),
    );

  const chainHash =
    sha256(
      stableJson({
        previousAuditHash:
          null,
        auditId,
        evtId,
        proofId,
        auditHash,
      }),
    );

  const temporalCertificate = {
    status:
      "DUAL_TIME_SEAL_READY",
    generatedAtUtc:
      generatedAt,
    locality:
      "Torino / Italia / Europa",
    runtimeBirth:
      BIRTH_ANCHOR_LOCAL,
    timezone:
      "Europe/Rome",
    legalCertification:
      false,
  };

  const runtimeDocument = {
    runtime:
      RUNTIME_NAME,
    state:
      "READY",
    decision:
      "ALLOW",
  };

  const identityDocument = {
    humanIpr:
      TEST_HUMAN_IPR,
    runtimeIpr:
      TEST_RUNTIME_IPR,
    tenantId:
      TEST_TENANT,
    workspaceId:
      TEST_WORKSPACE,
  };

  const eventDocument = {
    evtId,
    eventHash,
  };

  const proofDocument = {
    proofId,
    proofHash,
  };

  const verificationDocument = {
    status:
      TEST_VERIFICATION_STATUS,
    auditHashMatches:
      true,
    eventHashMatches:
      true,
    proofHashMatches:
      true,
    legalCertification:
      false,
  };

  const boundaryDocument = {
    legalCertification:
      false,
    auditBoundary:
      "technical audit receipt only",
    opcBoundary:
      "technical proof receipt only",
    rawAuditLogExposure:
      false,
    replacesHumanReview:
      false,
  };

  const payloadDocument = {
    testType:
      "HBCE_RUNTIME_AUDIT_TRANSACTION",
    revision:
      REVISION,
    temporary:
      true,
    audit:
      auditDocument,
    legalCertification:
      false,
  };

  const candidates:
    Record<string, CandidateValue> = {
      audit_id: {
        value: auditId,
        expected: auditId,
      },

      id: {
        value: auditId,
        expected: auditId,
      },

      evt_id: {
        value: evtId,
        expected: evtId,
      },

      event_id: {
        value: evtId,
        expected: evtId,
      },

      proof_id: {
        value: proofId,
        expected: proofId,
      },

      opc_id: {
        value: proofId,
        expected: proofId,
      },

      opc_proof_id: {
        value: proofId,
        expected: proofId,
      },

      tenant_id: {
        value: TEST_TENANT,
        expected: TEST_TENANT,
      },

      workspace_id: {
        value: TEST_WORKSPACE,
        expected: TEST_WORKSPACE,
      },

      subscription_id: {
        value:
          TEST_SUBSCRIPTION,
        expected:
          TEST_SUBSCRIPTION,
      },

      human_ipr: {
        value:
          TEST_HUMAN_IPR,
        expected:
          TEST_HUMAN_IPR,
      },

      subject_ipr: {
        value:
          TEST_HUMAN_IPR,
        expected:
          TEST_HUMAN_IPR,
      },

      runtime_ipr: {
        value:
          TEST_RUNTIME_IPR,
        expected:
          TEST_RUNTIME_IPR,
      },

      session_id: {
        value: sessionId,
        expected: sessionId,
      },

      thread_id: {
        value: threadId,
        expected: threadId,
      },

      kind: {
        value:
          TEST_AUDIT_KIND,
        expected:
          TEST_AUDIT_KIND,
      },

      audit_kind: {
        value:
          TEST_AUDIT_KIND,
        expected:
          TEST_AUDIT_KIND,
      },

      audit_type: {
        value:
          "RUNTIME_AUDIT_LOG",
        expected:
          "RUNTIME_AUDIT_LOG",
      },

      audit_status: {
        value:
          TEST_AUDIT_STATUS,
        expected:
          TEST_AUDIT_STATUS,
      },

      status: {
        value:
          TEST_AUDIT_STATUS,
        expected:
          TEST_AUDIT_STATUS,
      },

      persistence_mode: {
        value:
          "DATABASE_PERSISTENT",
        expected:
          "DATABASE_PERSISTENT",
      },

      persistence_status: {
        value:
          "PERSISTED",
        expected:
          "PERSISTED",
      },

      verification_status: {
        value:
          TEST_VERIFICATION_STATUS,
        expected:
          TEST_VERIFICATION_STATUS,
      },

      runtime_state: {
        value: "READY",
        expected: "READY",
      },

      runtime_decision: {
        value: "ALLOW",
        expected: "ALLOW",
      },

      policy_decision: {
        value: "ALLOW",
        expected: "ALLOW",
      },

      risk_level: {
        value: "LOW",
        expected: "LOW",
      },

      risk_class: {
        value: "LOW",
        expected: "LOW",
      },

      project_domain: {
        value:
          "HBCE_RUNTIME",
        expected:
          "HBCE_RUNTIME",
      },

      hbce_module: {
        value: "AUDIT",
        expected: "AUDIT",
      },

      input_hash: {
        value: inputHash,
        expected: inputHash,
      },

      output_hash: {
        value: outputHash,
        expected: outputHash,
      },

      decision_hash: {
        value: decisionHash,
        expected: decisionHash,
      },

      event_hash: {
        value: eventHash,
        expected: eventHash,
      },

      evt_hash: {
        value: eventHash,
        expected: eventHash,
      },

      proof_hash: {
        value: proofHash,
        expected: proofHash,
      },

      opc_hash: {
        value: proofHash,
        expected: proofHash,
      },

      audit_hash: {
        value: auditHash,
        expected: auditHash,
      },

      hash: {
        value: auditHash,
        expected: auditHash,
      },

      chain_hash: {
        value: chainHash,
        expected: chainHash,
      },

      previous_audit_hash: {
        value: null,
        expected: null,
      },

      response_utc: {
        value: generatedAt,
        expected: generatedAt,
        sqlCast:
          "timestamptz",
      },

      generated_at: {
        value: generatedAt,
        expected: generatedAt,
        sqlCast:
          "timestamptz",
      },

      birth_anchor_local: {
        value:
          BIRTH_ANCHOR_LOCAL,
        expected:
          BIRTH_ANCHOR_LOCAL,
      },

      birth_anchor_utc: {
        value:
          BIRTH_ANCHOR_UTC,
        expected:
          BIRTH_ANCHOR_UTC,
        sqlCast:
          "timestamptz",
      },

      temporal_certificate:
        jsonCandidate(
          temporalCertificate,
        ),

      operational_context:
        jsonCandidate({
          test:
            "AUDIT_TRANSACTION_SELF_TEST",
          revision:
            REVISION,
          temporary:
            true,
        }),

      identity:
        jsonCandidate(
          identityDocument,
        ),

      runtime:
        jsonCandidate(
          runtimeDocument,
        ),

      event:
        jsonCandidate(
          eventDocument,
        ),

      proof:
        jsonCandidate(
          proofDocument,
        ),

      audit:
        jsonCandidate(
          auditDocument,
        ),

      verification:
        jsonCandidate(
          verificationDocument,
        ),

      boundary:
        jsonCandidate(
          boundaryDocument,
        ),

      payload:
        jsonCandidate(
          payloadDocument,
        ),

      audit_payload:
        jsonCandidate(
          auditDocument,
        ),

      legal_certification: {
        value: false,
        expected: false,
      },
    };

  let identifierColumn:
    string | null = null;

  let recordMayExist = false;

  try {
    const configurationStartedAt =
      nowMs();

    const configured =
      isHbceDatabaseConfigured();

    const databaseDescription =
      describeDefaultHbceDatabase();

    checks.push(
      createCheck({
        id:
          "DATABASE_CONFIGURATION",
        label:
          "HBCE database configuration",
        status:
          configured
            ? "PASS"
            : "FAIL",
        durationMs:
          elapsedMs(
            configurationStartedAt,
          ),
        details: {
          configured,
          available:
            databaseDescription.available,
          kind:
            databaseDescription.kind,
          driver:
            databaseDescription.driver,
          mode:
            databaseDescription.mode,
          databaseUrlPresent:
            databaseDescription.databaseUrlPresent,
          schemaVersion:
            databaseDescription.schemaVersion,
          persistenceMode:
            databaseDescription.persistenceMode,
        },
        error:
          configured
            ? null
            : "DATABASE_URL_NOT_CONFIGURED",
      }),
    );

    if (!configured) {
      checks.push(
        createSkippedCheck(
          "AUDIT_SCHEMA",
          "Inspect canonical audit table schema",
          "DATABASE_NOT_CONFIGURED",
        ),
        createSkippedCheck(
          "AUDIT_INSERT",
          "Insert temporary audit record",
          "DATABASE_NOT_CONFIGURED",
        ),
        createSkippedCheck(
          "AUDIT_READ",
          "Read temporary audit record",
          "DATABASE_NOT_CONFIGURED",
        ),
        createSkippedCheck(
          "AUDIT_VERIFY",
          "Verify audit integrity",
          "DATABASE_NOT_CONFIGURED",
        ),
        createSkippedCheck(
          "AUDIT_DELETE",
          "Delete temporary audit record",
          "DATABASE_NOT_CONFIGURED",
        ),
        createSkippedCheck(
          "AUDIT_CLEANUP_VERIFY",
          "Verify temporary audit cleanup",
          "DATABASE_NOT_CONFIGURED",
        ),
      );
    } else {
      const schema =
        await inspectAuditSchema();

      checks.push(schema.check);

      const columnNames =
        new Set(
          schema.columns.map(
            (column) =>
              column.name,
          ),
        );

      identifierColumn =
        columnNames.has(
          "audit_id",
        )
          ? "audit_id"
          : columnNames.has("id")
            ? "id"
            : null;

      const unsupportedRequired =
        schema.columns.filter(
          (column) =>
            !column.nullable &&
            column.defaultValue === null &&
            !(column.name in candidates),
        );

      if (
        schema.check.status !==
          "PASS" ||
        !identifierColumn ||
        unsupportedRequired.length > 0
      ) {
        checks.push(
          createCheck({
            id: "AUDIT_INSERT",
            label:
              "Insert temporary audit record",
            status: "FAIL",
            durationMs: 0,
            details: {
              identifierColumn,
              unsupportedRequiredColumns:
                unsupportedRequired.map(
                  (column) =>
                    column.name,
                ),
            },
            error:
              !identifierColumn
                ? "AUDIT_IDENTIFIER_COLUMN_NOT_FOUND"
                : unsupportedRequired.length >
                    0
                  ? `AUDIT_REQUIRED_COLUMNS_UNSUPPORTED:${unsupportedRequired
                      .map(
                        (column) =>
                          column.name,
                      )
                      .join(",")}`
                  : "AUDIT_SCHEMA_INSPECTION_FAILED",
          }),
        );

        checks.push(
          createSkippedCheck(
            "AUDIT_READ",
            "Read temporary audit record",
            "AUDIT_INSERT_NOT_ATTEMPTED",
          ),
          createSkippedCheck(
            "AUDIT_VERIFY",
            "Verify audit integrity",
            "AUDIT_INSERT_NOT_ATTEMPTED",
          ),
          createSkippedCheck(
            "AUDIT_DELETE",
            "Delete temporary audit record",
            "AUDIT_INSERT_NOT_ATTEMPTED",
          ),
          createSkippedCheck(
            "AUDIT_CLEANUP_VERIFY",
            "Verify temporary audit cleanup",
            "AUDIT_INSERT_NOT_ATTEMPTED",
          ),
        );
      } else {
        const selectedColumns =
          schema.columns
            .filter(
              (column) =>
                column.name in
                candidates,
            )
            .map(
              (column) =>
                column.name,
            );

        const parameters:
          HbceDatabaseQueryValue[] = [];

        const expressions =
          selectedColumns.map(
            (columnName) => {
              const candidate =
                candidates[
                  columnName
                ];

              parameters.push(
                candidate.value,
              );

              return buildSqlParameter(
                parameters.length,
                candidate,
              );
            },
          );

        const insertSql = `
          INSERT INTO runtime_audit_logs (
            ${selectedColumns
              .map(
                quoteIdentifier,
              )
              .join(", ")}
          )
          VALUES (
            ${expressions.join(", ")}
          )
          RETURNING *
        `;

        const insertStartedAt =
          nowMs();

        const insertResult =
          await queryHbceDatabase<GenericRow>(
            insertSql,
            parameters,
          );

        const inserted =
          insertResult.ok &&
          insertResult.rowCount === 1;

        recordMayExist = inserted;

        checks.push(
          createCheck({
            id:
              "AUDIT_INSERT",
            label:
              "Insert temporary audit record",
            status:
              inserted
                ? "PASS"
                : "FAIL",
            durationMs:
              elapsedMs(
                insertStartedAt,
              ),
            details: {
              auditId,
              evtId,
              proofId,
              identifierColumn,
              selectedColumnCount:
                selectedColumns.length,
              selectedColumns,
              rowCount:
                insertResult.rowCount,
              queryStatus:
                insertResult.status,
              queryDurationMs:
                insertResult.durationMs,
              sqlHash:
                insertResult.sqlHash,
            },
            error:
              insertResult.error ??
              (
                inserted
                  ? null
                  : "AUDIT_INSERT_FAILED"
              ),
          }),
        );

        if (!inserted) {
          checks.push(
            createSkippedCheck(
              "AUDIT_READ",
              "Read temporary audit record",
              "AUDIT_INSERT_FAILED",
            ),
            createSkippedCheck(
              "AUDIT_VERIFY",
              "Verify audit integrity",
              "AUDIT_INSERT_FAILED",
            ),
            createSkippedCheck(
              "AUDIT_DELETE",
              "Delete temporary audit record",
              "AUDIT_INSERT_FAILED",
            ),
            createSkippedCheck(
              "AUDIT_CLEANUP_VERIFY",
              "Verify temporary audit cleanup",
              "AUDIT_INSERT_FAILED",
            ),
          );
        } else {
          const identifier =
            quoteIdentifier(
              identifierColumn,
            );

          const readStartedAt =
            nowMs();

          const readResult =
            await queryHbceDatabase<GenericRow>(
              `
                SELECT *
                FROM runtime_audit_logs
                WHERE ${identifier} = $1
                LIMIT 1
              `,
              [auditId],
            );

          const row =
            readResult.rows[0];

          const readSucceeded =
            readResult.ok &&
            readResult.rowCount === 1 &&
            Boolean(row);

          checks.push(
            createCheck({
              id: "AUDIT_READ",
              label:
                "Read temporary audit record",
              status:
                readSucceeded
                  ? "PASS"
                  : "FAIL",
              durationMs:
                elapsedMs(
                  readStartedAt,
                ),
              details: {
                auditId,
                identifierColumn,
                rowCount:
                  readResult.rowCount,
                queryStatus:
                  readResult.status,
                queryDurationMs:
                  readResult.durationMs,
                sqlHash:
                  readResult.sqlHash,
              },
              error:
                readResult.error ??
                (
                  readSucceeded
                    ? null
                    : "AUDIT_READ_FAILED"
                ),
            }),
          );

          if (!readSucceeded) {
            checks.push(
              createSkippedCheck(
                "AUDIT_VERIFY",
                "Verify audit integrity",
                "AUDIT_READ_FAILED",
              ),
            );
          } else {
            const comparisons:
              Record<
                string,
                boolean
              > = {};

            for (
              const columnName of
              selectedColumns
            ) {
              comparisons[
                columnName
              ] = valuesMatch(
                candidates[
                  columnName
                ].expected,
                row[columnName],
              );
            }

            if (
              "created_at" in row
            ) {
              comparisons.created_at =
                isValidTimestamp(
                  row.created_at,
                );
            }

            if (
              "legal_certification" in row
            ) {
              comparisons.legal_certification =
                valueAsBoolean(
                  row.legal_certification,
                ) === false;
            }

            const failedComparisons =
              Object.entries(
                comparisons,
              )
                .filter(
                  (
                    [, passed],
                  ) => !passed,
                )
                .map(
                  ([name]) =>
                    name,
                );

            const verified =
              failedComparisons.length ===
              0;

            checks.push(
              createCheck({
                id:
                  "AUDIT_VERIFY",
                label:
                  "Verify audit integrity",
                status:
                  verified
                    ? "PASS"
                    : "FAIL",
                durationMs: 0,
                details: {
                  auditId,
                  evtId,
                  proofId,
                  comparisons,
                  failedComparisons,
                  expectedAuditHash:
                    auditHash,
                  storedAuditHash:
                    valueAsString(
                      row.audit_hash ??
                        row.hash,
                    ),
                  expectedEventHash:
                    eventHash,
                  storedEventHash:
                    valueAsString(
                      row.event_hash ??
                        row.evt_hash,
                    ),
                  expectedProofHash:
                    proofHash,
                  storedProofHash:
                    valueAsString(
                      row.proof_hash ??
                        row.opc_hash,
                    ),
                  expectedChainHash:
                    chainHash,
                  storedChainHash:
                    valueAsString(
                      row.chain_hash,
                    ),
                },
                error:
                  verified
                    ? null
                    : `AUDIT_INTEGRITY_MISMATCH:${failedComparisons.join(
                        ",",
                      )}`,
              }),
            );
          }

          checks.push(
            await deleteAuditRecord(
              identifierColumn,
              auditId,
            ),
          );

          const cleanupResult =
            await queryHbceDatabase<CountRow>(
              `
                SELECT
                  COUNT(*)::int AS record_count
                FROM runtime_audit_logs
                WHERE ${identifier} = $1
              `,
              [auditId],
            );

          const remainingRecords =
            valueAsNumber(
              cleanupResult
                .rows[0]
                ?.record_count,
            ) ?? -1;

          const cleanupVerified =
            cleanupResult.ok &&
            remainingRecords === 0;

          checks.push(
            createCheck({
              id:
                "AUDIT_CLEANUP_VERIFY",
              label:
                "Verify temporary audit cleanup",
              status:
                cleanupVerified
                  ? "PASS"
                  : "FAIL",
              durationMs:
                cleanupResult.durationMs,
              details: {
                auditId,
                identifierColumn,
                remainingRecords,
                queryStatus:
                  cleanupResult.status,
                queryDurationMs:
                  cleanupResult.durationMs,
                sqlHash:
                  cleanupResult.sqlHash,
              },
              error:
                cleanupResult.error ??
                (
                  cleanupVerified
                    ? null
                    : "AUDIT_CLEANUP_NOT_CONFIRMED"
                ),
            }),
          );

          recordMayExist =
            !cleanupVerified;
        }
      }
    }
  } catch (error) {
    checks.push(
      createCheck({
        id:
          "UNHANDLED_RUNTIME_ERROR",
        label:
          "Unhandled audit self-test runtime error",
        status: "FAIL",
        durationMs:
          elapsedMs(startedAt),
        details: {
          auditId,
          evtId,
          proofId,
          identifierColumn,
        },
        error:
          normalizeError(error),
      }),
    );
  } finally {
    if (
      recordMayExist &&
      identifierColumn
    ) {
      try {
        const identifier =
          quoteIdentifier(
            identifierColumn,
          );

        await queryHbceDatabase(
          `
            DELETE FROM runtime_audit_logs
            WHERE ${identifier} = $1
          `,
          [auditId],
        );
      } catch {
        // Pulizia best-effort.
      }
    }
  }

  const ok =
    !checks.some(
      (check) =>
        check.required &&
        check.status !== "PASS",
    );

  const durationMs =
    elapsedMs(startedAt);

  return NextResponse.json(
    {
      ok,
      status:
        ok
          ? "HBCE_RUNTIME_AUDIT_PASS"
          : "HBCE_RUNTIME_AUDIT_FAIL",
      operationalStatus:
        ok ? "PASS" : "FAIL",
      revision:
        REVISION,
      generatedAt,
      product:
        PRODUCT,
      apiVersion:
        API_VERSION,
      runtime:
        RUNTIME_NAME,

      deployment: {
        origin:
          getRequestOrigin(
            request,
          ),
        runtimeEnvironment:
          process.env.VERCEL_ENV ??
          process.env.NODE_ENV ??
          "unknown",
        vercelEnvironment:
          process.env.VERCEL_ENV ??
          null,
        vercelRegion:
          process.env.VERCEL_REGION ??
          process.env.AWS_REGION ??
          null,
        nodeVersion:
          process.version,
      },

      testRecord: {
        auditId,
        evtId,
        proofId,
        identifierColumn,
        auditKind:
          TEST_AUDIT_KIND,
        auditStatus:
          TEST_AUDIT_STATUS,
        verificationStatus:
          TEST_VERIFICATION_STATUS,
        auditHash,
        eventHash,
        proofHash,
        chainHash,
        inputHash,
        outputHash,
        decisionHash,
        temporary:
          true,
        retained:
          recordMayExist,
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

        auditSchemaResolved:
          checks.find(
            (check) =>
              check.id ===
              "AUDIT_SCHEMA",
          )?.status === "PASS",

        auditWriteSucceeded:
          checks.find(
            (check) =>
              check.id ===
              "AUDIT_INSERT",
          )?.status === "PASS",

        auditReadSucceeded:
          checks.find(
            (check) =>
              check.id ===
              "AUDIT_READ",
          )?.status === "PASS",

        auditIntegrityVerified:
          checks.find(
            (check) =>
              check.id ===
              "AUDIT_VERIFY",
          )?.status === "PASS",

        temporaryAuditDeleted:
          checks.find(
            (check) =>
              check.id ===
              "AUDIT_DELETE",
          )?.status === "PASS",

        cleanupVerified:
          checks.find(
            (check) =>
              check.id ===
              "AUDIT_CLEANUP_VERIFY",
          )?.status === "PASS",
      },

      boundary: {
        legalCertification:
          false,
        auditBoundary:
          "technical audit receipt only",
        opcBoundary:
          "technical proof receipt only",
        rawAuditLogExposure:
          false,
        technicalRuntimeTestOnly:
          true,
        requiresExplicitPost:
          true,
        schemaAware:
          true,
        persistsTestAudit:
          false,
        createsPersistentEvt:
          false,
        createsPersistentOpc:
          false,
        createsMemory:
          false,
        performsModelCall:
          false,
        replacesHumanReview:
          false,
      },
    },
    {
      status:
        ok ? 200 : 503,
      headers: {
        "Cache-Control":
          "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma:
          "no-cache",
        Expires:
          "0",
        "X-HBCE-Audit-Test-Revision":
          REVISION,
        "X-HBCE-Audit-Test-Status":
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
        "HBCE_RUNTIME_AUDIT_SELF_TEST_READY",
      revision:
        REVISION,
      endpoint:
        `${getRequestOrigin(
          request,
        )}/api/v1/runtime/audit/self-test`,
      executionMethod:
        "POST",
      description:
        "Esegue l'ispezione dello schema reale di runtime_audit_logs e un ciclo temporaneo di inserimento, lettura, verifica, eliminazione e cleanup.",
      warning:
        "GET non esegue il test perché POST effettua mutazioni temporanee sul database.",
      boundary: {
        legalCertification:
          false,
        auditBoundary:
          "technical audit receipt only",
        rawAuditLogExposure:
          false,
        getPerformsDatabaseMutation:
          false,
        postPerformsTemporaryDatabaseMutation:
          true,
        persistsTestAudit:
          false,
      },
    },
    {
      status: 200,
      headers: {
        "Cache-Control":
          "no-store",
        "X-HBCE-Audit-Test-Revision":
          REVISION,
        "X-HBCE-Legal-Certification":
          "false",
      },
    },
  );
}
