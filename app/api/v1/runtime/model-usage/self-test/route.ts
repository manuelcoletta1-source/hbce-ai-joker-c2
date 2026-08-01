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
  "HBCE-RUNTIME-MODEL-USAGE-SELF-TEST-v1_0";

const PRODUCT =
  "HBCE IPR Operational Identity & Proof Layer";

const API_VERSION = "v1";

const RUNTIME_NAME =
  "AI_JOKER_C2_SAAS_CORE_v0_1";

const TEST_RUNTIME_IPR =
  "IPR-AI-0001";

const TEST_HUMAN_IPR =
  "IPR-HBCE-MODEL-USAGE-SELF-TEST";

const TEST_TENANT =
  "HBCE-TENANT-SELF-PILOT";

const TEST_WORKSPACE =
  "HBCE-WORKSPACE-RND";

const TEST_SUBSCRIPTION =
  "HBCE-SUBSCRIPTION-SELF-PILOT";

const TEST_PROVIDER =
  "LOCAL";

const TEST_PROVIDER_STATE =
  "COMPLETED";

const TEST_MODEL =
  "hbce-self-test-model";

const TEST_MODEL_LEVEL =
  "STANDARD";

const TEST_INPUT_TOKENS = 128;
const TEST_OUTPUT_TOKENS = 64;
const TEST_TOTAL_TOKENS =
  TEST_INPUT_TOKENS + TEST_OUTPUT_TOKENS;

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
  return Math.max(
    0,
    Date.now() - startedAt,
  );
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

async function inspectModelUsageSchema(): Promise<{
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
            AND table_name = 'model_usage'
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
        id: "MODEL_USAGE_SCHEMA",
        label:
          "Inspect canonical model usage table schema",
        status:
          passed ? "PASS" : "FAIL",
        durationMs:
          elapsedMs(startedAt),
        details: {
          table:
            "model_usage",
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
              : "MODEL_USAGE_SCHEMA_NOT_AVAILABLE"
          ),
      }),
    };
  } catch (error) {
    return {
      columns: [],

      check: createCheck({
        id: "MODEL_USAGE_SCHEMA",
        label:
          "Inspect canonical model usage table schema",
        status: "FAIL",
        durationMs:
          elapsedMs(startedAt),
        error:
          normalizeError(error),
      }),
    };
  }
}

async function deleteUsageRecord(
  identifierColumn: string,
  usageId: string,
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
          DELETE FROM model_usage
          WHERE ${identifier} = $1
          RETURNING ${identifier}
        `,
        [usageId],
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
      deletedId === usageId;

    return createCheck({
      id: "MODEL_USAGE_DELETE",
      label:
        "Delete temporary model usage record",
      status:
        deleted ? "PASS" : "FAIL",
      durationMs:
        elapsedMs(startedAt),
      details: {
        usageId,
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
            : "MODEL_USAGE_DELETE_NOT_CONFIRMED"
        ),
    });
  } catch (error) {
    return createCheck({
      id: "MODEL_USAGE_DELETE",
      label:
        "Delete temporary model usage record",
      status: "FAIL",
      durationMs:
        elapsedMs(startedAt),
      details: {
        usageId,
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

  const usageId =
    `USAGE-${compactTimestamp}-${suffix}`;

  const evtId =
    `EVT-MODEL-USAGE-SELF-TEST-${suffix}`;

  const auditId =
    `AUDIT-MODEL-USAGE-SELF-TEST-${suffix}`;

  const sessionId =
    `HBCE-MODEL-USAGE-SELF-TEST-SESSION-${randomUUID()}`;

  const threadId =
    `HBCE-MODEL-USAGE-SELF-TEST-THREAD-${randomUUID()}`;

  const inputHash =
    sha256(
      stableJson({
        command:
          "HBCE_RUNTIME_MODEL_USAGE_SELF_TEST",
        usageId,
        evtId,
        auditId,
        generatedAt,
      }),
    );

  const outputHash =
    sha256(
      stableJson({
        result:
          "TEMPORARY_MODEL_USAGE_CREATED",
        expectedCleanup:
          true,
      }),
    );

  const usageDocument = {
    usageId,
    provider:
      TEST_PROVIDER,
    providerState:
      TEST_PROVIDER_STATE,
    model:
      TEST_MODEL,
    modelLevel:
      TEST_MODEL_LEVEL,
    inputTokens:
      TEST_INPUT_TOKENS,
    outputTokens:
      TEST_OUTPUT_TOKENS,
    totalTokens:
      TEST_TOTAL_TOKENS,
    evtId,
    auditId,
    sessionId,
    threadId,
    generatedAt,
    inputHash,
    outputHash,
    legalCertification:
      false,
  };

  const usageHash =
    sha256(
      stableJson(usageDocument),
    );

  const chainHash =
    sha256(
      stableJson({
        previousUsageHash:
          null,
        usageId,
        evtId,
        auditId,
        usageHash,
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

  const telemetryDocument = {
    inputTokens:
      TEST_INPUT_TOKENS,
    outputTokens:
      TEST_OUTPUT_TOKENS,
    totalTokens:
      TEST_TOTAL_TOKENS,
    tokenTelemetryAvailable:
      true,
  };

  const providerDocument = {
    provider:
      TEST_PROVIDER,
    providerState:
      TEST_PROVIDER_STATE,
    model:
      TEST_MODEL,
    modelLevel:
      TEST_MODEL_LEVEL,
  };

  const relationDocument = {
    evtId,
    auditId,
    sessionId,
    threadId,
  };

  const boundaryDocument = {
    legalCertification:
      false,
    billingCertification:
      false,
    providerAttestation:
      false,
    modelOwnershipEvidence:
      false,
    technicalTelemetryOnly:
      true,
  };

  const payloadDocument = {
    testType:
      "HBCE_RUNTIME_MODEL_USAGE_TRANSACTION",
    revision:
      REVISION,
    temporary:
      true,
    usage:
      usageDocument,
    telemetry:
      telemetryDocument,
    provider:
      providerDocument,
    relations:
      relationDocument,
    legalCertification:
      false,
  };

  const candidates:
    Record<string, CandidateValue> = {
      usage_id: {
        value: usageId,
        expected: usageId,
      },

      id: {
        value: usageId,
        expected: usageId,
      },

      evt_id: {
        value: evtId,
        expected: evtId,
      },

      event_id: {
        value: evtId,
        expected: evtId,
      },

      audit_id: {
        value: auditId,
        expected: auditId,
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

      provider: {
        value:
          TEST_PROVIDER,
        expected:
          TEST_PROVIDER,
      },

      provider_state: {
        value:
          TEST_PROVIDER_STATE,
        expected:
          TEST_PROVIDER_STATE,
      },

      model: {
        value:
          TEST_MODEL,
        expected:
          TEST_MODEL,
      },

      selected_model: {
        value:
          TEST_MODEL,
        expected:
          TEST_MODEL,
      },

      model_name: {
        value:
          TEST_MODEL,
        expected:
          TEST_MODEL,
      },

      model_level: {
        value:
          TEST_MODEL_LEVEL,
        expected:
          TEST_MODEL_LEVEL,
      },

      input_tokens: {
        value:
          TEST_INPUT_TOKENS,
        expected:
          TEST_INPUT_TOKENS,
      },

      output_tokens: {
        value:
          TEST_OUTPUT_TOKENS,
        expected:
          TEST_OUTPUT_TOKENS,
      },

      total_tokens: {
        value:
          TEST_TOTAL_TOKENS,
        expected:
          TEST_TOTAL_TOKENS,
      },

      usage_hash: {
        value:
          usageHash,
        expected:
          usageHash,
      },

      hash: {
        value:
          usageHash,
        expected:
          usageHash,
      },

      chain_hash: {
        value:
          chainHash,
        expected:
          chainHash,
      },

      previous_usage_hash: {
        value:
          null,
        expected:
          null,
      },

      input_hash: {
        value:
          inputHash,
        expected:
          inputHash,
      },

      output_hash: {
        value:
          outputHash,
        expected:
          outputHash,
      },

      status: {
        value:
          "PERSISTED",
        expected:
          "PERSISTED",
      },

      persistence_status: {
        value:
          "PERSISTED",
        expected:
          "PERSISTED",
      },

      persistence_mode: {
        value:
          "DATABASE_PERSISTENT",
        expected:
          "DATABASE_PERSISTENT",
      },

      response_utc: {
        value:
          generatedAt,
        expected:
          generatedAt,
        sqlCast:
          "timestamptz",
      },

      generated_at: {
        value:
          generatedAt,
        expected:
          generatedAt,
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

      usage:
        jsonCandidate(
          usageDocument,
        ),

      telemetry:
        jsonCandidate(
          telemetryDocument,
        ),

      provider_payload:
        jsonCandidate(
          providerDocument,
        ),

      relations:
        jsonCandidate(
          relationDocument,
        ),

      temporal_certificate:
        jsonCandidate(
          temporalCertificate,
        ),

      boundary:
        jsonCandidate(
          boundaryDocument,
        ),

      payload:
        jsonCandidate(
          payloadDocument,
        ),

      usage_payload:
        jsonCandidate(
          usageDocument,
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
          "MODEL_USAGE_SCHEMA",
          "Inspect canonical model usage table schema",
          "DATABASE_NOT_CONFIGURED",
        ),
        createSkippedCheck(
          "MODEL_USAGE_INSERT",
          "Insert temporary model usage record",
          "DATABASE_NOT_CONFIGURED",
        ),
        createSkippedCheck(
          "MODEL_USAGE_READ",
          "Read temporary model usage record",
          "DATABASE_NOT_CONFIGURED",
        ),
        createSkippedCheck(
          "MODEL_USAGE_VERIFY",
          "Verify model usage integrity",
          "DATABASE_NOT_CONFIGURED",
        ),
        createSkippedCheck(
          "MODEL_USAGE_DELETE",
          "Delete temporary model usage record",
          "DATABASE_NOT_CONFIGURED",
        ),
        createSkippedCheck(
          "MODEL_USAGE_CLEANUP_VERIFY",
          "Verify temporary model usage cleanup",
          "DATABASE_NOT_CONFIGURED",
        ),
      );
    } else {
      const schema =
        await inspectModelUsageSchema();

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
          "usage_id",
        )
          ? "usage_id"
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
            id:
              "MODEL_USAGE_INSERT",
            label:
              "Insert temporary model usage record",
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
                ? "MODEL_USAGE_IDENTIFIER_COLUMN_NOT_FOUND"
                : unsupportedRequired.length >
                    0
                  ? `MODEL_USAGE_REQUIRED_COLUMNS_UNSUPPORTED:${unsupportedRequired
                      .map(
                        (column) =>
                          column.name,
                      )
                      .join(",")}`
                  : "MODEL_USAGE_SCHEMA_INSPECTION_FAILED",
          }),
        );

        checks.push(
          createSkippedCheck(
            "MODEL_USAGE_READ",
            "Read temporary model usage record",
            "MODEL_USAGE_INSERT_NOT_ATTEMPTED",
          ),
          createSkippedCheck(
            "MODEL_USAGE_VERIFY",
            "Verify model usage integrity",
            "MODEL_USAGE_INSERT_NOT_ATTEMPTED",
          ),
          createSkippedCheck(
            "MODEL_USAGE_DELETE",
            "Delete temporary model usage record",
            "MODEL_USAGE_INSERT_NOT_ATTEMPTED",
          ),
          createSkippedCheck(
            "MODEL_USAGE_CLEANUP_VERIFY",
            "Verify temporary model usage cleanup",
            "MODEL_USAGE_INSERT_NOT_ATTEMPTED",
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
          INSERT INTO model_usage (
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
              "MODEL_USAGE_INSERT",
            label:
              "Insert temporary model usage record",
            status:
              inserted
                ? "PASS"
                : "FAIL",
            durationMs:
              elapsedMs(
                insertStartedAt,
              ),
            details: {
              usageId,
              evtId,
              auditId,
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
                  : "MODEL_USAGE_INSERT_FAILED"
              ),
          }),
        );

        if (!inserted) {
          checks.push(
            createSkippedCheck(
              "MODEL_USAGE_READ",
              "Read temporary model usage record",
              "MODEL_USAGE_INSERT_FAILED",
            ),
            createSkippedCheck(
              "MODEL_USAGE_VERIFY",
              "Verify model usage integrity",
              "MODEL_USAGE_INSERT_FAILED",
            ),
            createSkippedCheck(
              "MODEL_USAGE_DELETE",
              "Delete temporary model usage record",
              "MODEL_USAGE_INSERT_FAILED",
            ),
            createSkippedCheck(
              "MODEL_USAGE_CLEANUP_VERIFY",
              "Verify temporary model usage cleanup",
              "MODEL_USAGE_INSERT_FAILED",
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
                FROM model_usage
                WHERE ${identifier} = $1
                LIMIT 1
              `,
              [usageId],
            );

          const row =
            readResult.rows[0];

          const readSucceeded =
            readResult.ok &&
            readResult.rowCount === 1 &&
            Boolean(row);

          checks.push(
            createCheck({
              id:
                "MODEL_USAGE_READ",
              label:
                "Read temporary model usage record",
              status:
                readSucceeded
                  ? "PASS"
                  : "FAIL",
              durationMs:
                elapsedMs(
                  readStartedAt,
                ),
              details: {
                usageId,
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
                    : "MODEL_USAGE_READ_FAILED"
                ),
            }),
          );

          if (!readSucceeded) {
            checks.push(
              createSkippedCheck(
                "MODEL_USAGE_VERIFY",
                "Verify model usage integrity",
                "MODEL_USAGE_READ_FAILED",
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
                  "MODEL_USAGE_VERIFY",
                label:
                  "Verify model usage integrity",
                status:
                  verified
                    ? "PASS"
                    : "FAIL",
                durationMs: 0,
                details: {
                  usageId,
                  evtId,
                  auditId,
                  comparisons,
                  failedComparisons,
                  expectedUsageHash:
                    usageHash,
                  storedUsageHash:
                    valueAsString(
                      row.usage_hash ??
                        row.hash,
                    ),
                  expectedInputTokens:
                    TEST_INPUT_TOKENS,
                  storedInputTokens:
                    valueAsNumber(
                      row.input_tokens,
                    ),
                  expectedOutputTokens:
                    TEST_OUTPUT_TOKENS,
                  storedOutputTokens:
                    valueAsNumber(
                      row.output_tokens,
                    ),
                  expectedTotalTokens:
                    TEST_TOTAL_TOKENS,
                  storedTotalTokens:
                    valueAsNumber(
                      row.total_tokens,
                    ),
                },
                error:
                  verified
                    ? null
                    : `MODEL_USAGE_INTEGRITY_MISMATCH:${failedComparisons.join(
                        ",",
                      )}`,
              }),
            );
          }

          checks.push(
            await deleteUsageRecord(
              identifierColumn,
              usageId,
            ),
          );

          const cleanupResult =
            await queryHbceDatabase<CountRow>(
              `
                SELECT
                  COUNT(*)::int AS record_count
                FROM model_usage
                WHERE ${identifier} = $1
              `,
              [usageId],
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
                "MODEL_USAGE_CLEANUP_VERIFY",
              label:
                "Verify temporary model usage cleanup",
              status:
                cleanupVerified
                  ? "PASS"
                  : "FAIL",
              durationMs:
                cleanupResult.durationMs,
              details: {
                usageId,
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
                    : "MODEL_USAGE_CLEANUP_NOT_CONFIRMED"
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
          "Unhandled model usage self-test runtime error",
        status: "FAIL",
        durationMs:
          elapsedMs(startedAt),
        details: {
          usageId,
          evtId,
          auditId,
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
            DELETE FROM model_usage
            WHERE ${identifier} = $1
          `,
          [usageId],
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
          ? "HBCE_RUNTIME_MODEL_USAGE_PASS"
          : "HBCE_RUNTIME_MODEL_USAGE_FAIL",
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
        usageId,
        evtId,
        auditId,
        identifierColumn,
        provider:
          TEST_PROVIDER,
        providerState:
          TEST_PROVIDER_STATE,
        model:
          TEST_MODEL,
        modelLevel:
          TEST_MODEL_LEVEL,
        inputTokens:
          TEST_INPUT_TOKENS,
        outputTokens:
          TEST_OUTPUT_TOKENS,
        totalTokens:
          TEST_TOTAL_TOKENS,
        usageHash,
        chainHash,
        inputHash,
        outputHash,
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

        modelUsageSchemaResolved:
          checks.find(
            (check) =>
              check.id ===
              "MODEL_USAGE_SCHEMA",
          )?.status === "PASS",

        modelUsageWriteSucceeded:
          checks.find(
            (check) =>
              check.id ===
              "MODEL_USAGE_INSERT",
          )?.status === "PASS",

        modelUsageReadSucceeded:
          checks.find(
            (check) =>
              check.id ===
              "MODEL_USAGE_READ",
          )?.status === "PASS",

        modelUsageIntegrityVerified:
          checks.find(
            (check) =>
              check.id ===
              "MODEL_USAGE_VERIFY",
          )?.status === "PASS",

        temporaryModelUsageDeleted:
          checks.find(
            (check) =>
              check.id ===
              "MODEL_USAGE_DELETE",
          )?.status === "PASS",

        cleanupVerified:
          checks.find(
            (check) =>
              check.id ===
              "MODEL_USAGE_CLEANUP_VERIFY",
          )?.status === "PASS",
      },

      boundary: {
        legalCertification:
          false,
        billingCertification:
          false,
        providerAttestation:
          false,
        modelOwnershipEvidence:
          false,
        technicalTelemetryOnly:
          true,
        requiresExplicitPost:
          true,
        schemaAware:
          true,
        persistsTestModelUsage:
          false,
        createsPersistentEvt:
          false,
        createsPersistentAudit:
          false,
        createsMemory:
          false,
        performsModelCall:
          false,
        replacesProviderBilling:
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
        "X-HBCE-Model-Usage-Test-Revision":
          REVISION,
        "X-HBCE-Model-Usage-Test-Status":
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
        "HBCE_RUNTIME_MODEL_USAGE_SELF_TEST_READY",
      revision:
        REVISION,
      endpoint:
        `${getRequestOrigin(
          request,
        )}/api/v1/runtime/model-usage/self-test`,
      executionMethod:
        "POST",
      description:
        "Esegue l'ispezione dello schema reale di model_usage e un ciclo temporaneo di inserimento, lettura, verifica, eliminazione e cleanup.",
      warning:
        "GET non esegue il test perché POST effettua mutazioni temporanee sul database.",
      boundary: {
        legalCertification:
          false,
        billingCertification:
          false,
        providerAttestation:
          false,
        technicalTelemetryOnly:
          true,
        getPerformsDatabaseMutation:
          false,
        postPerformsTemporaryDatabaseMutation:
          true,
        persistsTestModelUsage:
          false,
        performsModelCall:
          false,
      },
    },
    {
      status: 200,
      headers: {
        "Cache-Control":
          "no-store",
        "X-HBCE-Model-Usage-Test-Revision":
          REVISION,
        "X-HBCE-Legal-Certification":
          "false",
      },
    },
  );
}
