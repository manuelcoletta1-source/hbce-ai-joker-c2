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

const REVISION = "HBCE-RUNTIME-OPC-SELF-TEST-v1_0";

const PRODUCT =
  "HBCE IPR Operational Identity & Proof Layer";

const API_VERSION = "v1";

const RUNTIME_NAME =
  "AI_JOKER_C2_SAAS_CORE_v0_1";

const TEST_RUNTIME_IPR =
  "IPR-AI-0001";

const TEST_HUMAN_IPR =
  "IPR-HBCE-OPC-SELF-TEST";

const TEST_TENANT =
  "HBCE-TENANT-SELF-PILOT";

const TEST_WORKSPACE =
  "HBCE-WORKSPACE-RND";

const TEST_EVENT_TYPE =
  "OPC_TECHNICAL_PROOF_RECEIPT";

const TEST_PROOF_TYPE =
  "RUNTIME_SELF_TEST";

const TEST_STATUS =
  "TECHNICAL_PROOF_GENERATED";

const TEST_VERIFICATION =
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
    if (Number.isNaN(value.getTime())) {
      return null;
    }

    return value.toISOString();
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

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function isValidTimestamp(
  value: unknown,
): boolean {
  if (value instanceof Date) {
    return !Number.isNaN(
      value.getTime(),
    );
  }

  if (typeof value === "string") {
    return !Number.isNaN(
      Date.parse(value),
    );
  }

  return false;
}

function stableJson(
  value: unknown,
): string {
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

  const keys =
    Object.keys(record).sort();

  return `{${keys
    .map(
      (key) =>
        `${JSON.stringify(
          key,
        )}:${stableJson(record[key])}`,
    )
    .join(",")}}`;
}

function sha256(
  value: string,
): string {
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
    required:
      input.required ?? true,
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
    details: {
      reason,
    },
    error: `${id}_SKIPPED`,
  });
}

function buildSummary(
  checks: SelfTestCheck[],
  durationMs: number,
): Record<string, number> {
  const requiredChecks =
    checks.filter(
      (check) => check.required,
    );

  return {
    totalChecks:
      checks.length,

    passedChecks:
      checks.filter(
        (check) =>
          check.status === "PASS",
      ).length,

    failedChecks:
      checks.filter(
        (check) =>
          check.status === "FAIL",
      ).length,

    skippedChecks:
      checks.filter(
        (check) =>
          check.status === "SKIPPED",
      ).length,

    requiredChecks:
      requiredChecks.length,

    requiredPassed:
      requiredChecks.filter(
        (check) =>
          check.status === "PASS",
      ).length,

    requiredFailed:
      requiredChecks.filter(
        (check) =>
          check.status !== "PASS",
      ).length,

    durationMs,
  };
}

function getRequestOrigin(
  request: NextRequest,
): string {
  const forwardedProto =
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

  if (host) {
    return `${
      forwardedProto ?? "https"
    }://${host}`;
  }

  return request.nextUrl.origin;
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

  const nullable =
    valueAsString(
      row.is_nullable,
    ) === "YES";

  const defaultValue =
    valueAsString(
      row.column_default,
    );

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
    nullable,
    defaultValue,
  };
}

function buildSqlParameter(
  index: number,
  candidate: CandidateValue,
): string {
  if (candidate.sqlCast === "jsonb") {
    return `$${index}::jsonb`;
  }

  if (
    candidate.sqlCast ===
    "timestamptz"
  ) {
    return `$${index}::timestamptz`;
  }

  if (candidate.sqlCast === "bigint") {
    return `$${index}::bigint`;
  }

  return `$${index}`;
}

function valuesMatch(
  expected: unknown,
  stored: unknown,
): boolean {
  if (expected === null) {
    return stored === null;
  }

  if (
    typeof expected === "boolean"
  ) {
    return (
      valueAsBoolean(stored) ===
      expected
    );
  }

  if (
    typeof expected === "number"
  ) {
    return (
      valueAsNumber(stored) ===
      expected
    );
  }

  if (
    typeof expected === "object"
  ) {
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

async function inspectOpcSchema(): Promise<{
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
            AND table_name = 'opc_proofs'
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
        id: "OPC_SCHEMA",
        label:
          "Inspect canonical OPC table schema",
        status:
          passed ? "PASS" : "FAIL",
        durationMs:
          elapsedMs(startedAt),
        details: {
          table:
            "opc_proofs",

          columnCount:
            columns.length,

          columns:
            columns.map(
              (column) => ({
                name:
                  column.name,

                dataType:
                  column.dataType,

                nullable:
                  column.nullable,

                hasDefault:
                  column.defaultValue !==
                  null,
              }),
            ),

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
              : "OPC_SCHEMA_NOT_AVAILABLE"
          ),
      }),
    };
  } catch (error) {
    return {
      columns: [],

      check: createCheck({
        id: "OPC_SCHEMA",
        label:
          "Inspect canonical OPC table schema",
        status: "FAIL",
        durationMs:
          elapsedMs(startedAt),
        error:
          normalizeError(error),
      }),
    };
  }
}

async function deleteTestProof(
  identifierColumn: string,
  opcId: string,
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
          DELETE FROM opc_proofs
          WHERE ${identifier} = $1
          RETURNING ${identifier}
        `,
        [opcId],
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
      deletedId === opcId;

    return createCheck({
      id: "OPC_DELETE",
      label:
        "Delete temporary OPC proof",
      status:
        deleted ? "PASS" : "FAIL",
      durationMs:
        elapsedMs(startedAt),
      details: {
        opcId,
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
            : "OPC_DELETE_NOT_CONFIRMED"
        ),
    });
  } catch (error) {
    return createCheck({
      id: "OPC_DELETE",
      label:
        "Delete temporary OPC proof",
      status: "FAIL",
      durationMs:
        elapsedMs(startedAt),
      details: {
        opcId,
        identifierColumn,
      },
      error:
        normalizeError(error),
    });
  }
}

function createCandidates(input: {
  opcId: string;
  evtId: string;
  generatedAt: string;
  proofHash: string;
  eventHash: string;
  chainHash: string;
  inputHash: string;
  outputHash: string;
  policyHash: string;
  payload: Record<string, unknown>;
  proofPayload: Record<string, unknown>;
  trace: Record<string, unknown>;
  anchors: Record<string, unknown>;
  temporalCertificate:
    Record<string, unknown>;
}): Record<string, CandidateValue> {
  const {
    opcId,
    evtId,
    generatedAt,
    proofHash,
    eventHash,
    chainHash,
    inputHash,
    outputHash,
    policyHash,
    payload,
    proofPayload,
    trace,
    anchors,
    temporalCertificate,
  } = input;

  const jsonCandidate = (
    value: Record<string, unknown>,
  ): CandidateValue => ({
    value: stableJson(value),
    expected: value,
    sqlCast: "jsonb",
  });

  return {
    opc_id: {
      value: opcId,
      expected: opcId,
    },

    opc_proof_id: {
      value: opcId,
      expected: opcId,
    },

    proof_id: {
      value: opcId,
      expected: opcId,
    },

    evt_id: {
      value: evtId,
      expected: evtId,
    },

    event_id: {
      value: evtId,
      expected: evtId,
    },

    tenant_id: {
      value: TEST_TENANT,
      expected: TEST_TENANT,
    },

    tenant: {
      value: TEST_TENANT,
      expected: TEST_TENANT,
    },

    workspace_id: {
      value: TEST_WORKSPACE,
      expected: TEST_WORKSPACE,
    },

    workspace: {
      value: TEST_WORKSPACE,
      expected: TEST_WORKSPACE,
    },

    human_ipr: {
      value: TEST_HUMAN_IPR,
      expected: TEST_HUMAN_IPR,
    },

    subject_ipr: {
      value: TEST_HUMAN_IPR,
      expected: TEST_HUMAN_IPR,
    },

    runtime_ipr: {
      value: TEST_RUNTIME_IPR,
      expected: TEST_RUNTIME_IPR,
    },

    proof_type: {
      value: TEST_PROOF_TYPE,
      expected: TEST_PROOF_TYPE,
    },

    opc_type: {
      value: TEST_PROOF_TYPE,
      expected: TEST_PROOF_TYPE,
    },

    event_type: {
      value: TEST_EVENT_TYPE,
      expected: TEST_EVENT_TYPE,
    },

    proof_status: {
      value: TEST_STATUS,
      expected: TEST_STATUS,
    },

    status: {
      value: TEST_STATUS,
      expected: TEST_STATUS,
    },

    verification: {
      value: TEST_VERIFICATION,
      expected: TEST_VERIFICATION,
    },

    verification_status: {
      value: TEST_VERIFICATION,
      expected: TEST_VERIFICATION,
    },

    opc_hash: {
      value: proofHash,
      expected: proofHash,
    },

    proof_hash: {
      value: proofHash,
      expected: proofHash,
    },

    hash: {
      value: proofHash,
      expected: proofHash,
    },

    event_hash: {
      value: eventHash,
      expected: eventHash,
    },

    chain_hash: {
      value: chainHash,
      expected: chainHash,
    },

    opc_chain_hash: {
      value: chainHash,
      expected: chainHash,
    },

    input_hash: {
      value: inputHash,
      expected: inputHash,
    },

    output_hash: {
      value: outputHash,
      expected: outputHash,
    },

    policy_hash: {
      value: policyHash,
      expected: policyHash,
    },

    generated_at: {
      value: generatedAt,
      expected: generatedAt,
      sqlCast: "timestamptz",
    },

    response_utc: {
      value: generatedAt,
      expected: generatedAt,
      sqlCast: "timestamptz",
    },

    issued_at: {
      value: generatedAt,
      expected: generatedAt,
      sqlCast: "timestamptz",
    },

    birth_anchor_local: {
      value: BIRTH_ANCHOR_LOCAL,
      expected: BIRTH_ANCHOR_LOCAL,
    },

    birth_anchor_utc: {
      value: BIRTH_ANCHOR_UTC,
      expected: BIRTH_ANCHOR_UTC,
      sqlCast: "timestamptz",
    },

    payload:
      jsonCandidate(payload),

    proof_payload:
      jsonCandidate(proofPayload),

    opc_payload:
      jsonCandidate(proofPayload),

    trace:
      jsonCandidate(trace),

    anchors:
      jsonCandidate(anchors),

    temporal_certificate:
      jsonCandidate(
        temporalCertificate,
      ),

    legal_certification: {
      value: false,
      expected: false,
    },
  };
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse> {
  const startedAt = nowMs();

  const generatedAt =
    new Date().toISOString();

  const checks:
    SelfTestCheck[] = [];

  const compactTimestamp =
    generatedAt
      .replace(/\D/g, "")
      .slice(0, 14);

  const suffix =
    randomUUID()
      .replace(/-/g, "")
      .slice(0, 8)
      .toUpperCase();

  const opcId =
    `OPC-${compactTimestamp}-${suffix}`;

  const evtId =
    `EVT-OPC-SELF-TEST-${suffix}`;

  const inputPayload = {
    command:
      "HBCE_RUNTIME_OPC_SELF_TEST",
    revision:
      REVISION,
    opcId,
    evtId,
    generatedAt,
    legalCertification:
      false,
  };

  const outputPayload = {
    result:
      "TEMPORARY_OPC_CREATED",
    expectedCleanup:
      true,
    legalCertification:
      false,
  };

  const policyPayload = {
    decision:
      "ALLOW",
    riskLevel:
      "LOW",
    technicalProofOnly:
      true,
    legalCertification:
      false,
  };

  const inputHash =
    sha256(
      stableJson(inputPayload),
    );

  const outputHash =
    sha256(
      stableJson(outputPayload),
    );

  const policyHash =
    sha256(
      stableJson(policyPayload),
    );

  const eventHash =
    sha256(
      stableJson({
        evtId,
        eventType:
          TEST_EVENT_TYPE,
        generatedAt,
      }),
    );

  const proofPayload = {
    opcId,
    evtId,
    proofType:
      TEST_PROOF_TYPE,
    status:
      TEST_STATUS,
    verification:
      TEST_VERIFICATION,
    subjectIpr:
      TEST_HUMAN_IPR,
    runtimeIpr:
      TEST_RUNTIME_IPR,
    generatedAt,
    eventHash,
    inputHash,
    outputHash,
    policyHash,
    legalCertification:
      false,
    opcBoundary:
      "technical proof receipt only",
  };

  const proofHash =
    sha256(
      stableJson(proofPayload),
    );

  const chainHash =
    sha256(
      stableJson({
        previousOpcId:
          null,
        previousOpcHash:
          null,
        opcId,
        evtId,
        proofHash,
        eventHash,
      }),
    );

  const trace = {
    opcId,
    evtId,
    proofHash,
    eventHash,
    chainHash,
    inputHash,
    outputHash,
    policyHash,
  };

  const anchors = {
    evtId,
    previousOpcId:
      null,
    auditId:
      null,
  };

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

  const payload = {
    testType:
      "HBCE_RUNTIME_OPC_TRANSACTION",
    revision:
      REVISION,
    temporary:
      true,
    proofPayload,
    legalCertification:
      false,
  };

  const candidates =
    createCandidates({
      opcId,
      evtId,
      generatedAt,
      proofHash,
      eventHash,
      chainHash,
      inputHash,
      outputHash,
      policyHash,
      payload,
      proofPayload,
      trace,
      anchors,
      temporalCertificate,
    });

  let identifierColumn:
    string | null = null;

  let recordMayExist =
    false;

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
          "OPC_SCHEMA",
          "Inspect canonical OPC table schema",
          "DATABASE_NOT_CONFIGURED",
        ),
        createSkippedCheck(
          "OPC_INSERT",
          "Insert temporary OPC proof",
          "DATABASE_NOT_CONFIGURED",
        ),
        createSkippedCheck(
          "OPC_READ",
          "Read temporary OPC proof",
          "DATABASE_NOT_CONFIGURED",
        ),
        createSkippedCheck(
          "OPC_VERIFY",
          "Verify OPC integrity",
          "DATABASE_NOT_CONFIGURED",
        ),
        createSkippedCheck(
          "OPC_DELETE",
          "Delete temporary OPC proof",
          "DATABASE_NOT_CONFIGURED",
        ),
        createSkippedCheck(
          "OPC_CLEANUP_VERIFY",
          "Verify temporary OPC cleanup",
          "DATABASE_NOT_CONFIGURED",
        ),
      );
    } else {
      const schema =
        await inspectOpcSchema();

      checks.push(
        schema.check,
      );

      const columnNames =
        new Set(
          schema.columns.map(
            (column) =>
              column.name,
          ),
        );

      identifierColumn =
        columnNames.has("opc_id")
          ? "opc_id"
          : columnNames.has(
                "opc_proof_id",
              )
            ? "opc_proof_id"
            : columnNames.has(
                  "proof_id",
                )
              ? "proof_id"
              : null;

      const unsupportedRequired =
        schema.columns.filter(
          (column) =>
            !column.nullable &&
            column.defaultValue ===
              null &&
            !(column.name in candidates),
        );

      if (
        schema.check.status !==
          "PASS" ||
        !identifierColumn ||
        unsupportedRequired.length >
          0
      ) {
        checks.push(
          createCheck({
            id:
              "OPC_INSERT",
            label:
              "Insert temporary OPC proof",
            status:
              "FAIL",
            durationMs:
              0,
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
                ? "OPC_IDENTIFIER_COLUMN_NOT_FOUND"
                : unsupportedRequired.length >
                    0
                  ? `OPC_REQUIRED_COLUMNS_UNSUPPORTED:${unsupportedRequired
                      .map(
                        (column) =>
                          column.name,
                      )
                      .join(",")}`
                  : "OPC_SCHEMA_INSPECTION_FAILED",
          }),
        );

        checks.push(
          createSkippedCheck(
            "OPC_READ",
            "Read temporary OPC proof",
            "OPC_INSERT_NOT_ATTEMPTED",
          ),
          createSkippedCheck(
            "OPC_VERIFY",
            "Verify OPC integrity",
            "OPC_INSERT_NOT_ATTEMPTED",
          ),
          createSkippedCheck(
            "OPC_DELETE",
            "Delete temporary OPC proof",
            "OPC_INSERT_NOT_ATTEMPTED",
          ),
          createSkippedCheck(
            "OPC_CLEANUP_VERIFY",
            "Verify temporary OPC cleanup",
            "OPC_INSERT_NOT_ATTEMPTED",
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
          INSERT INTO opc_proofs (
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
          insertResult.rowCount ===
            1;

        recordMayExist =
          inserted;

        checks.push(
          createCheck({
            id:
              "OPC_INSERT",
            label:
              "Insert temporary OPC proof",
            status:
              inserted
                ? "PASS"
                : "FAIL",
            durationMs:
              elapsedMs(
                insertStartedAt,
              ),
            details: {
              opcId,
              evtId,
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
                  : "OPC_INSERT_FAILED"
              ),
          }),
        );

        if (!inserted) {
          checks.push(
            createSkippedCheck(
              "OPC_READ",
              "Read temporary OPC proof",
              "OPC_INSERT_FAILED",
            ),
            createSkippedCheck(
              "OPC_VERIFY",
              "Verify OPC integrity",
              "OPC_INSERT_FAILED",
            ),
            createSkippedCheck(
              "OPC_DELETE",
              "Delete temporary OPC proof",
              "OPC_INSERT_FAILED",
            ),
            createSkippedCheck(
              "OPC_CLEANUP_VERIFY",
              "Verify temporary OPC cleanup",
              "OPC_INSERT_FAILED",
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
                FROM opc_proofs
                WHERE ${identifier} = $1
                LIMIT 1
              `,
              [opcId],
            );

          const row =
            readResult.rows[0];

          const readSucceeded =
            readResult.ok &&
            readResult.rowCount ===
              1 &&
            Boolean(row);

          checks.push(
            createCheck({
              id:
                "OPC_READ",
              label:
                "Read temporary OPC proof",
              status:
                readSucceeded
                  ? "PASS"
                  : "FAIL",
              durationMs:
                elapsedMs(
                  readStartedAt,
                ),
              details: {
                opcId,
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
                    : "OPC_READ_FAILED"
                ),
            }),
          );

          if (!readSucceeded) {
            checks.push(
              createSkippedCheck(
                "OPC_VERIFY",
                "Verify OPC integrity",
                "OPC_READ_FAILED",
              ),
            );
          } else {
            const verifyStartedAt =
              nowMs();

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
              "response_utc" in row
            ) {
              comparisons.response_utc =
                isValidTimestamp(
                  row.response_utc,
                );
            }

            if (
              "legal_certification" in
              row
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
                  "OPC_VERIFY",
                label:
                  "Verify OPC integrity",
                status:
                  verified
                    ? "PASS"
                    : "FAIL",
                durationMs:
                  elapsedMs(
                    verifyStartedAt,
                  ),
                details: {
                  opcId,
                  evtId,
                  comparisons,
                  failedComparisons,
                  expectedProofHash:
                    proofHash,
                  storedProofHash:
                    valueAsString(
                      row.proof_hash ??
                        row.opc_hash ??
                        row.hash,
                    ),
                  expectedEventHash:
                    eventHash,
                  storedEventHash:
                    valueAsString(
                      row.event_hash,
                    ),
                  expectedChainHash:
                    chainHash,
                  storedChainHash:
                    valueAsString(
                      row.chain_hash ??
                        row.opc_chain_hash,
                    ),
                  storedCreatedAt:
                    valueAsString(
                      row.created_at,
                    ),
                },
                error:
                  verified
                    ? null
                    : `OPC_INTEGRITY_MISMATCH:${failedComparisons.join(
                        ",",
                      )}`,
              }),
            );
          }

          const deleteCheck =
            await deleteTestProof(
              identifierColumn,
              opcId,
            );

          checks.push(
            deleteCheck,
          );

          const cleanupStartedAt =
            nowMs();

          const cleanupResult =
            await queryHbceDatabase<CountRow>(
              `
                SELECT
                  COUNT(*)::int AS record_count
                FROM opc_proofs
                WHERE ${identifier} = $1
              `,
              [opcId],
            );

          const remainingRecords =
            valueAsNumber(
              cleanupResult
                .rows[0]
                ?.record_count,
            ) ?? -1;

          const cleanupVerified =
            cleanupResult.ok &&
            remainingRecords ===
              0;

          checks.push(
            createCheck({
              id:
                "OPC_CLEANUP_VERIFY",
              label:
                "Verify temporary OPC cleanup",
              status:
                cleanupVerified
                  ? "PASS"
                  : "FAIL",
              durationMs:
                elapsedMs(
                  cleanupStartedAt,
                ),
              details: {
                opcId,
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
                    : "OPC_CLEANUP_NOT_CONFIRMED"
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
          "Unhandled OPC self-test runtime error",
        status:
          "FAIL",
        durationMs:
          elapsedMs(startedAt),
        details: {
          opcId,
          evtId,
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
            DELETE FROM opc_proofs
            WHERE ${identifier} = $1
          `,
          [opcId],
        );
      } catch {
        // Pulizia best-effort.
      }
    }
  }

  const requiredFailed =
    checks.some(
      (check) =>
        check.required &&
        check.status !==
          "PASS",
    );

  const ok =
    !requiredFailed;

  const status =
    ok
      ? "HBCE_RUNTIME_OPC_PASS"
      : "HBCE_RUNTIME_OPC_FAIL";

  const durationMs =
    elapsedMs(startedAt);

  return NextResponse.json(
    {
      ok,
      status,

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
        opcId,
        evtId,
        identifierColumn,

        proofType:
          TEST_PROOF_TYPE,

        proofStatus:
          TEST_STATUS,

        verification:
          TEST_VERIFICATION,

        humanIpr:
          TEST_HUMAN_IPR,

        runtimeIpr:
          TEST_RUNTIME_IPR,

        proofHash,
        eventHash,
        chainHash,
        inputHash,
        outputHash,
        policyHash,

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
          )?.status ===
          "PASS",

        opcSchemaResolved:
          checks.find(
            (check) =>
              check.id ===
              "OPC_SCHEMA",
          )?.status ===
          "PASS",

        opcWriteSucceeded:
          checks.find(
            (check) =>
              check.id ===
              "OPC_INSERT",
          )?.status ===
          "PASS",

        opcReadSucceeded:
          checks.find(
            (check) =>
              check.id ===
              "OPC_READ",
          )?.status ===
          "PASS",

        opcIntegrityVerified:
          checks.find(
            (check) =>
              check.id ===
              "OPC_VERIFY",
          )?.status ===
          "PASS",

        temporaryOpcDeleted:
          checks.find(
            (check) =>
              check.id ===
              "OPC_DELETE",
          )?.status ===
          "PASS",

        cleanupVerified:
          checks.find(
            (check) =>
              check.id ===
              "OPC_CLEANUP_VERIFY",
          )?.status ===
          "PASS",
      },

      boundary: {
        legalCertification:
          false,

        opcBoundary:
          "technical proof receipt only",

        technicalRuntimeTestOnly:
          true,

        requiresExplicitPost:
          true,

        schemaAware:
          true,

        usesWhitelistedColumnsOnly:
          true,

        performsDatabaseRead:
          true,

        performsDatabaseMutation:
          true,

        performsTemporaryOpcWrite:
          true,

        performsTemporaryOpcDelete:
          true,

        persistsTestOpc:
          false,

        createsPersistentEvt:
          false,

        createsAuditRecord:
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

        "X-HBCE-OPC-Test-Revision":
          REVISION,

        "X-HBCE-OPC-Test-Status":
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
        "HBCE_RUNTIME_OPC_SELF_TEST_READY",

      revision:
        REVISION,

      endpoint:
        `${getRequestOrigin(
          request,
        )}/api/v1/runtime/opc/self-test`,

      executionMethod:
        "POST",

      description:
        "Esegue l'ispezione dello schema reale di opc_proofs e un ciclo temporaneo di inserimento, lettura, verifica, eliminazione e cleanup.",

      strategy: {
        schemaAware:
          true,

        dynamicColumnSelection:
          true,

        whitelistOnly:
          true,

        unsupportedRequiredColumnsFailClosed:
          true,

        identifierPriority: [
          "opc_id",
          "opc_proof_id",
          "proof_id",
        ],
      },

      warning:
        "GET non esegue il test perché POST effettua mutazioni temporanee sul database.",

      boundary: {
        legalCertification:
          false,

        opcBoundary:
          "technical proof receipt only",

        getPerformsDatabaseMutation:
          false,

        postPerformsTemporaryDatabaseMutation:
          true,

        persistsTestOpc:
          false,

        createsPersistentEvt:
          false,

        createsAuditRecord:
          false,

        createsMemory:
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

        "X-HBCE-OPC-Test-Revision":
          REVISION,

        "X-HBCE-Legal-Certification":
          "false",
      },
    },
  );
}
