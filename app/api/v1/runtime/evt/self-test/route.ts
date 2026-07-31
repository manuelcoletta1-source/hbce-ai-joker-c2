import { createHash, randomUUID } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import {
  describeDefaultHbceDatabase,
  isHbceDatabaseConfigured,
  queryHbceDatabase,
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

type GenericDatabaseRow = Record<string, unknown>;

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
  value: unknown;
  cast?: "jsonb" | "timestamp" | "bigint";
};

const REVISION = "HBCE-RUNTIME-EVT-SELF-TEST-v1_1";

const PRODUCT = "HBCE IPR Operational Identity & Proof Layer";
const API_VERSION = "v1";
const RUNTIME_NAME = "AI_JOKER_C2_SAAS_CORE_v0_1";

const TEST_RUNTIME_IPR = "IPR-AI-0001";
const TEST_HUMAN_IPR = "IPR-HBCE-EVT-SELF-TEST";

const TEST_TENANT = "HBCE-TENANT-SELF-PILOT";
const TEST_WORKSPACE = "HBCE-WORKSPACE-RND";
const TEST_SUBSCRIPTION = "HBCE-SUBSCRIPTION-SELF-PILOT";

const TEST_EVENT_TYPE = "AUDIT_LOG_RECORD";
const TEST_EVENT_KIND = "RUNTIME_SELF_TEST";
const TEST_EVENT_FAMILY = "UP-EVT";
const TEST_CYCLE = "UP-CANONICO";

const BIRTH_ANCHOR_LOCAL = "2026-01-19T15:30:00+01:00";
const BIRTH_ANCHOR_UTC = "2026-01-19T14:30:00.000Z";

const SAFE_COLUMN_NAME = /^[a-z_][a-z0-9_]*$/;

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

function valueAsString(value: unknown): string | null {
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

function valueAsBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") {
    return value;
  }

  if (value === true || value === "true" || value === 1 || value === "1") {
    return true;
  }

  if (value === false || value === "false" || value === 0 || value === "0") {
    return false;
  }

  return null;
}

function valueAsNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
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

function stableJson(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (value instanceof Date) {
    return JSON.stringify(value.toISOString());
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableJson(item)).join(",")}]`;
  }

  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();

  return `{${keys
    .map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`)
    .join(",")}}`;
}

function sha256(value: string): string {
  return `sha256:${createHash("sha256")
    .update(value, "utf8")
    .digest("hex")}`;
}

function isValidTimestamp(value: unknown): boolean {
  if (value instanceof Date) {
    return !Number.isNaN(value.getTime());
  }

  if (typeof value === "string") {
    return !Number.isNaN(Date.parse(value));
  }

  return false;
}

function quoteIdentifier(identifier: string): string {
  if (!SAFE_COLUMN_NAME.test(identifier)) {
    throw new Error(`UNSAFE_SQL_IDENTIFIER:${identifier}`);
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
    details: {
      reason,
    },
    error: `${id}_SKIPPED`,
  });
}

function getRequestOrigin(request: NextRequest): string {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost ?? request.headers.get("host");

  if (host) {
    return `${forwardedProto ?? "https"}://${host}`;
  }

  return request.nextUrl.origin;
}

function buildSummary(
  checks: SelfTestCheck[],
  durationMs: number,
): Record<string, number> {
  const requiredChecks = checks.filter((check) => check.required);

  return {
    totalChecks: checks.length,
    passedChecks: checks.filter((check) => check.status === "PASS").length,
    failedChecks: checks.filter((check) => check.status === "FAIL").length,
    skippedChecks: checks.filter((check) => check.status === "SKIPPED").length,
    requiredChecks: requiredChecks.length,
    requiredPassed: requiredChecks.filter(
      (check) => check.status === "PASS",
    ).length,
    requiredFailed: requiredChecks.filter(
      (check) => check.status !== "PASS",
    ).length,
    durationMs,
  };
}

function normalizeColumnDefinition(row: SchemaColumnRow): ColumnDefinition | null {
  const name = valueAsString(row.column_name);
  const dataType = valueAsString(row.data_type);
  const udtName = valueAsString(row.udt_name);
  const nullableRaw = valueAsString(row.is_nullable);
  const defaultValue = valueAsString(row.column_default);

  if (!name || !dataType || !udtName || !SAFE_COLUMN_NAME.test(name)) {
    return null;
  }

  return {
    name,
    dataType,
    udtName,
    nullable: nullableRaw === "YES",
    defaultValue,
  };
}

function valuesMatch(expected: unknown, stored: unknown): boolean {
  if (expected === null) {
    return stored === null;
  }

  if (typeof expected === "boolean") {
    return valueAsBoolean(stored) === expected;
  }

  if (typeof expected === "number") {
    return valueAsNumber(stored) === expected;
  }

  if (typeof expected === "object") {
    return (
      stored !== null &&
      typeof stored === "object" &&
      stableJson(stored) === stableJson(expected)
    );
  }

  return valueAsString(stored) === String(expected);
}

function createCandidateValues(input: {
  evtId: string;
  sessionId: string;
  threadId: string;
  generatedAt: string;
  jokerLifeSeconds: number;
  eventHash: string;
  chainHash: string;
  publicHash: string;
  fullHash: string;
  inputHash: string;
  outputHash: string;
  policyHash: string;
  payload: Record<string, unknown>;
  eventPayload: Record<string, unknown>;
  trace: Record<string, unknown>;
  temporalCertificate: Record<string, unknown>;
  operationalContext: Record<string, unknown>;
  anchors: Record<string, unknown>;
}): Record<string, CandidateValue> {
  const {
    evtId,
    sessionId,
    threadId,
    generatedAt,
    jokerLifeSeconds,
    eventHash,
    chainHash,
    publicHash,
    fullHash,
    inputHash,
    outputHash,
    policyHash,
    payload,
    eventPayload,
    trace,
    temporalCertificate,
    operationalContext,
    anchors,
  } = input;

  return {
    evt_id: { value: evtId },
    event_id: { value: evtId },

    prev_evt_id: { value: null },
    prev_event_id: { value: null },

    tenant: { value: TEST_TENANT },
    tenant_id: { value: TEST_TENANT },

    workspace: { value: TEST_WORKSPACE },
    workspace_id: { value: TEST_WORKSPACE },

    subscription: { value: TEST_SUBSCRIPTION },
    subscription_id: { value: TEST_SUBSCRIPTION },

    human_ipr: { value: TEST_HUMAN_IPR },
    subject_ipr: { value: TEST_HUMAN_IPR },
    runtime_ipr: { value: TEST_RUNTIME_IPR },

    session_id: { value: sessionId },
    thread_id: { value: threadId },

    event_kind: { value: TEST_EVENT_KIND },
    event_type: { value: TEST_EVENT_TYPE },
    kind: { value: "EVT_TECHNICAL_SELF_TEST" },

    event_family: { value: TEST_EVENT_FAMILY },
    cycle: { value: TEST_CYCLE },

    runtime_state: { value: "READY" },
    state: { value: "VERIFIED" },

    runtime_decision: { value: "ALLOW" },
    decision: { value: "ALLOW" },
    policy_decision: { value: "ALLOW" },
    risk_level: { value: "LOW" },

    memory_scope: { value: "RUNTIME_ONLY" },
    context_class: { value: "TECHNICAL_DIAGNOSTIC" },
    intent_class: { value: "RUNTIME_SELF_TEST" },
    project_domain: { value: "HBCE_RUNTIME" },
    hbce_module: { value: "EVT" },

    evt_hash: { value: eventHash },
    event_hash: { value: eventHash },
    hash: { value: eventHash },

    public_hash: { value: publicHash },
    full_hash: { value: fullHash },
    chain_hash: { value: chainHash },

    input_hash: { value: inputHash },
    output_hash: { value: outputHash },
    policy_hash: { value: policyHash },

    response_utc: {
      value: generatedAt,
      cast: "timestamp",
    },

    birth_anchor_local: { value: BIRTH_ANCHOR_LOCAL },

    birth_anchor_utc: {
      value: BIRTH_ANCHOR_UTC,
      cast: "timestamp",
    },

    joker_lifetime: {
      value: `${jokerLifeSeconds} seconds`,
    },

    joker_life_seconds: {
      value: jokerLifeSeconds,
      cast: "bigint",
    },

    temporal_certificate: {
      value: temporalCertificate,
      cast: "jsonb",
    },

    operational_context: {
      value: operationalContext,
      cast: "jsonb",
    },

    anchors: {
      value: anchors,
      cast: "jsonb",
    },

    trace: {
      value: trace,
      cast: "jsonb",
    },

    payload: {
      value: payload,
      cast: "jsonb",
    },

    event_payload: {
      value: eventPayload,
      cast: "jsonb",
    },

    legal_certification: {
      value: false,
    },
  };
}

function buildParameterExpression(
  parameterIndex: number,
  candidate: CandidateValue,
): string {
  if (candidate.cast === "jsonb") {
    return `$${parameterIndex}::jsonb`;
  }

  if (candidate.cast === "timestamp") {
    return `$${parameterIndex}::timestamptz`;
  }

  if (candidate.cast === "bigint") {
    return `$${parameterIndex}::bigint`;
  }

  return `$${parameterIndex}`;
}

async function inspectEventSchema(): Promise<{
  check: SelfTestCheck;
  columns: ColumnDefinition[];
}> {
  const startedAt = nowMs();

  try {
    const result = await queryHbceDatabase<SchemaColumnRow>(
      `
        SELECT
          column_name,
          data_type,
          udt_name,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'evt_records'
        ORDER BY ordinal_position
      `,
    );

    const columns = result.rows
      .map(normalizeColumnDefinition)
      .filter((column): column is ColumnDefinition => column !== null);

    const passed = result.ok && columns.length > 0;

    return {
      columns,
      check: createCheck({
        id: "EVT_SCHEMA",
        label: "Inspect canonical EVT table schema",
        status: passed ? "PASS" : "FAIL",
        durationMs: elapsedMs(startedAt),
        details: {
          table: "evt_records",
          columnCount: columns.length,
          columns: columns.map((column) => ({
            name: column.name,
            dataType: column.dataType,
            nullable: column.nullable,
            hasDefault: column.defaultValue !== null,
          })),
          queryStatus: result.status,
          queryDurationMs: result.durationMs,
          sqlHash: result.sqlHash,
        },
        error:
          result.error ??
          (passed ? null : "EVT_SCHEMA_NOT_AVAILABLE"),
      }),
    };
  } catch (error) {
    return {
      columns: [],
      check: createCheck({
        id: "EVT_SCHEMA",
        label: "Inspect canonical EVT table schema",
        status: "FAIL",
        durationMs: elapsedMs(startedAt),
        error: normalizeError(error),
      }),
    };
  }
}

async function cleanupTestEvent(
  identifierColumn: string,
  evtId: string,
): Promise<SelfTestCheck> {
  const startedAt = nowMs();

  try {
    const quotedIdentifier = quoteIdentifier(identifierColumn);

    const result = await queryHbceDatabase<GenericDatabaseRow>(
      `
        DELETE FROM evt_records
        WHERE ${quotedIdentifier} = $1
        RETURNING ${quotedIdentifier}
      `,
      [evtId],
    );

    const deletedId = valueAsString(
      result.rows[0]?.[identifierColumn],
    );

    const deleted =
      result.ok &&
      result.rowCount === 1 &&
      deletedId === evtId;

    return createCheck({
      id: "EVT_DELETE",
      label: "Delete temporary EVT record",
      status: deleted ? "PASS" : "FAIL",
      durationMs: elapsedMs(startedAt),
      details: {
        evtId,
        identifierColumn,
        deletedId,
        deletedRowCount: result.rowCount,
        queryStatus: result.status,
        queryDurationMs: result.durationMs,
        sqlHash: result.sqlHash,
      },
      error:
        result.error ??
        (deleted ? null : "EVT_DELETE_NOT_CONFIRMED"),
    });
  } catch (error) {
    return createCheck({
      id: "EVT_DELETE",
      label: "Delete temporary EVT record",
      status: "FAIL",
      durationMs: elapsedMs(startedAt),
      details: {
        evtId,
        identifierColumn,
      },
      error: normalizeError(error),
    });
  }
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse> {
  const startedAt = nowMs();
  const generatedAt = new Date().toISOString();

  const checks: SelfTestCheck[] = [];

  const compactTimestamp = generatedAt
    .replace(/\D/g, "")
    .slice(0, 14);

  const eventSuffix = randomUUID()
    .replace(/-/g, "")
    .slice(0, 8)
    .toUpperCase();

  const evtId = `EVT-${compactTimestamp}-${eventSuffix}`;

  const sessionId =
    `HBCE-EVT-SELF-TEST-SESSION-${randomUUID()}`;

  const threadId =
    `HBCE-EVT-SELF-TEST-THREAD-${randomUUID()}`;

  const jokerLifeSeconds = Math.max(
    0,
    Math.floor(
      (
        new Date(generatedAt).getTime() -
        new Date(BIRTH_ANCHOR_UTC).getTime()
      ) / 1000,
    ),
  );

  const payload = {
    testType: "HBCE_RUNTIME_EVT_TRANSACTION",
    revision: REVISION,
    evtId,
    sessionId,
    threadId,
    generatedAt,
    humanIpr: TEST_HUMAN_IPR,
    runtimeIpr: TEST_RUNTIME_IPR,
    temporary: true,
    legalCertification: false,
  };

  const inputHash = sha256(
    stableJson({
      command: "HBCE_RUNTIME_EVT_SELF_TEST",
      evtId,
      sessionId,
      generatedAt,
    }),
  );

  const outputHash = sha256(
    stableJson({
      result: "TEMPORARY_EVT_CREATED",
      expectedCleanup: true,
    }),
  );

  const policyHash = sha256(
    stableJson({
      decision: "ALLOW",
      riskLevel: "LOW",
      legalCertification: false,
    }),
  );

  const eventPayload = {
    eventId: evtId,
    eventType: TEST_EVENT_TYPE,
    subjectIpr: TEST_HUMAN_IPR,
    runtimeIpr: TEST_RUNTIME_IPR,
    tenant: TEST_TENANT,
    workspace: TEST_WORKSPACE,
    createdAt: generatedAt,
    inputHash,
    outputHash,
    policyHash,
    legalCertification: false,
    opcBoundary: "technical proof receipt only",
  };

  const eventHash = sha256(stableJson(eventPayload));

  const chainHash = sha256(
    stableJson({
      previousEventId: null,
      previousEventHash: null,
      eventId: evtId,
      eventHash,
    }),
  );

  const publicHash = sha256(
    stableJson({
      eventId: evtId,
      eventType: TEST_EVENT_TYPE,
      eventHash,
    }),
  );

  const fullHash = sha256(
    stableJson({
      eventPayload,
      chainHash,
      publicHash,
    }),
  );

  const temporalCertificate = {
    status: "DUAL_TIME_SEAL_READY",
    generatedAtUtc: generatedAt,
    locality: "Torino / Italia / Europa",
    runtimeBirth: BIRTH_ANCHOR_LOCAL,
    timezone: "Europe/Rome",
    legalCertification: false,
  };

  const operationalContext = {
    test: "EVT_TRANSACTION_SELF_TEST",
    revision: REVISION,
    mode: "TEMPORARY_DATABASE_TRANSACTION",
    createsOpc: false,
    createsAudit: false,
    createsMemory: false,
  };

  const anchors = {
    previousEvtId: null,
    previousEventId: null,
    opcProofId: null,
    auditId: null,
  };

  const trace = {
    inputHash,
    outputHash,
    policyHash,
    eventHash,
    chainHash,
    publicHash,
    fullHash,
  };

  const candidateValues = createCandidateValues({
    evtId,
    sessionId,
    threadId,
    generatedAt,
    jokerLifeSeconds,
    eventHash,
    chainHash,
    publicHash,
    fullHash,
    inputHash,
    outputHash,
    policyHash,
    payload,
    eventPayload,
    trace,
    temporalCertificate,
    operationalContext,
    anchors,
  });

  let identifierColumn: string | null = null;
  let recordInserted = false;

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
      checks.push(
        createSkippedCheck(
          "EVT_SCHEMA",
          "Inspect canonical EVT table schema",
          "DATABASE_NOT_CONFIGURED",
        ),
        createSkippedCheck(
          "EVT_INSERT",
          "Insert temporary EVT record",
          "DATABASE_NOT_CONFIGURED",
        ),
        createSkippedCheck(
          "EVT_READ",
          "Read temporary EVT record",
          "DATABASE_NOT_CONFIGURED",
        ),
        createSkippedCheck(
          "EVT_VERIFY",
          "Verify EVT integrity",
          "DATABASE_NOT_CONFIGURED",
        ),
        createSkippedCheck(
          "EVT_DELETE",
          "Delete temporary EVT record",
          "DATABASE_NOT_CONFIGURED",
        ),
        createSkippedCheck(
          "EVT_CLEANUP_VERIFY",
          "Verify temporary EVT cleanup",
          "DATABASE_NOT_CONFIGURED",
        ),
      );
    } else {
      const schemaInspection = await inspectEventSchema();

      checks.push(schemaInspection.check);

      const schemaColumns = schemaInspection.columns;
      const schemaColumnNames = new Set(
        schemaColumns.map((column) => column.name),
      );

      identifierColumn =
        schemaColumnNames.has("evt_id")
          ? "evt_id"
          : schemaColumnNames.has("event_id")
            ? "event_id"
            : null;

      const unsupportedRequiredColumns = schemaColumns.filter(
        (column) =>
          !column.nullable &&
          column.defaultValue === null &&
          !(column.name in candidateValues),
      );

      if (
        schemaInspection.check.status !== "PASS" ||
        !identifierColumn ||
        unsupportedRequiredColumns.length > 0
      ) {
        checks.push(
          createCheck({
            id: "EVT_INSERT",
            label: "Insert temporary EVT record",
            status: "FAIL",
            durationMs: 0,
            details: {
              identifierColumn,
              unsupportedRequiredColumns:
                unsupportedRequiredColumns.map(
                  (column) => column.name,
                ),
            },
            error:
              !identifierColumn
                ? "EVT_IDENTIFIER_COLUMN_NOT_FOUND"
                : unsupportedRequiredColumns.length > 0
                  ? `EVT_REQUIRED_COLUMNS_UNSUPPORTED:${unsupportedRequiredColumns
                      .map((column) => column.name)
                      .join(",")}`
                  : "EVT_SCHEMA_INSPECTION_FAILED",
          }),
        );

        checks.push(
          createSkippedCheck(
            "EVT_READ",
            "Read temporary EVT record",
            "EVT_INSERT_NOT_ATTEMPTED",
          ),
          createSkippedCheck(
            "EVT_VERIFY",
            "Verify EVT integrity",
            "EVT_INSERT_NOT_ATTEMPTED",
          ),
          createSkippedCheck(
            "EVT_DELETE",
            "Delete temporary EVT record",
            "EVT_INSERT_NOT_ATTEMPTED",
          ),
          createSkippedCheck(
            "EVT_CLEANUP_VERIFY",
            "Verify temporary EVT cleanup",
            "EVT_INSERT_NOT_ATTEMPTED",
          ),
        );
      } else {
        const selectedColumns = schemaColumns
          .filter((column) => column.name in candidateValues)
          .map((column) => column.name);

        const parameters: unknown[] = [];

        const parameterExpressions = selectedColumns.map(
          (columnName) => {
            const candidate = candidateValues[columnName];

            parameters.push(
              candidate.cast === "jsonb"
                ? stableJson(candidate.value)
                : candidate.value,
            );

            return buildParameterExpression(
              parameters.length,
              candidate,
            );
          },
        );

        const insertStartedAt = nowMs();

        const insertSql = `
          INSERT INTO evt_records (
            ${selectedColumns
              .map(quoteIdentifier)
              .join(", ")}
          )
          VALUES (
            ${parameterExpressions.join(", ")}
          )
          RETURNING *
        `;

        const insertResult =
          await queryHbceDatabase<GenericDatabaseRow>(
            insertSql,
            parameters,
          );

        recordInserted =
          insertResult.ok &&
          insertResult.rowCount === 1;

        checks.push(
          createCheck({
            id: "EVT_INSERT",
            label: "Insert temporary EVT record",
            status:
              recordInserted
                ? "PASS"
                : "FAIL",
            durationMs: elapsedMs(insertStartedAt),
            details: {
              evtId,
              identifierColumn,
              selectedColumnCount:
                selectedColumns.length,
              selectedColumns,
              rowCount: insertResult.rowCount,
              queryStatus: insertResult.status,
              queryDurationMs:
                insertResult.durationMs,
              sqlHash: insertResult.sqlHash,
            },
            error:
              insertResult.error ??
              (
                recordInserted
                  ? null
                  : "EVT_INSERT_FAILED"
              ),
          }),
        );

        if (!recordInserted) {
          checks.push(
            createSkippedCheck(
              "EVT_READ",
              "Read temporary EVT record",
              "EVT_INSERT_FAILED",
            ),
            createSkippedCheck(
              "EVT_VERIFY",
              "Verify EVT integrity",
              "EVT_INSERT_FAILED",
            ),
            createSkippedCheck(
              "EVT_DELETE",
              "Delete temporary EVT record",
              "EVT_INSERT_FAILED",
            ),
            createSkippedCheck(
              "EVT_CLEANUP_VERIFY",
              "Verify temporary EVT cleanup",
              "EVT_INSERT_FAILED",
            ),
          );
        } else {
          const quotedIdentifier =
            quoteIdentifier(identifierColumn);

          const readStartedAt = nowMs();

          const readResult =
            await queryHbceDatabase<GenericDatabaseRow>(
              `
                SELECT *
                FROM evt_records
                WHERE ${quotedIdentifier} = $1
                LIMIT 1
              `,
              [evtId],
            );

          const row = readResult.rows[0];

          const readSucceeded =
            readResult.ok &&
            readResult.rowCount === 1 &&
            Boolean(row);

          checks.push(
            createCheck({
              id: "EVT_READ",
              label: "Read temporary EVT record",
              status:
                readSucceeded
                  ? "PASS"
                  : "FAIL",
              durationMs: elapsedMs(readStartedAt),
              details: {
                evtId,
                identifierColumn,
                rowCount: readResult.rowCount,
                queryStatus: readResult.status,
                queryDurationMs:
                  readResult.durationMs,
                sqlHash: readResult.sqlHash,
              },
              error:
                readResult.error ??
                (
                  readSucceeded
                    ? null
                    : "EVT_READ_FAILED"
                ),
            }),
          );

          if (!readSucceeded) {
            checks.push(
              createSkippedCheck(
                "EVT_VERIFY",
                "Verify EVT integrity",
                "EVT_READ_FAILED",
              ),
            );
          } else {
            const verifyStartedAt = nowMs();

            const comparisons: Record<string, boolean> = {};

            for (const columnName of selectedColumns) {
              const candidate =
                candidateValues[columnName];

              comparisons[columnName] =
                valuesMatch(
                  candidate.value,
                  row[columnName],
                );
            }

            if ("created_at" in row) {
              comparisons.created_at =
                isValidTimestamp(row.created_at);
            }

            if ("response_utc" in row) {
              comparisons.response_utc =
                isValidTimestamp(row.response_utc);
            }

            if ("legal_certification" in row) {
              comparisons.legal_certification =
                valueAsBoolean(
                  row.legal_certification,
                ) === false;
            }

            const failedComparisons =
              Object.entries(comparisons)
                .filter(([, passed]) => !passed)
                .map(([name]) => name);

            const integrityVerified =
              failedComparisons.length === 0;

            checks.push(
              createCheck({
                id: "EVT_VERIFY",
                label: "Verify EVT integrity",
                status:
                  integrityVerified
                    ? "PASS"
                    : "FAIL",
                durationMs:
                  elapsedMs(verifyStartedAt),
                details: {
                  evtId,
                  comparisons,
                  failedComparisons,
                  expectedEventHash: eventHash,
                  storedEventHash:
                    valueAsString(
                      row.event_hash ??
                      row.evt_hash ??
                      row.hash,
                    ),
                  expectedChainHash: chainHash,
                  storedChainHash:
                    valueAsString(
                      row.chain_hash,
                    ),
                  storedCreatedAt:
                    valueAsString(
                      row.created_at,
                    ),
                  storedResponseUtc:
                    valueAsString(
                      row.response_utc,
                    ),
                },
                error:
                  integrityVerified
                    ? null
                    : `EVT_INTEGRITY_MISMATCH:${failedComparisons.join(",")}`,
              }),
            );
          }

          const deleteCheck =
            await cleanupTestEvent(
              identifierColumn,
              evtId,
            );

          checks.push(deleteCheck);

          const cleanupStartedAt = nowMs();

          const cleanupResult =
            await queryHbceDatabase<CountRow>(
              `
                SELECT COUNT(*)::int AS record_count
                FROM evt_records
                WHERE ${quotedIdentifier} = $1
              `,
              [evtId],
            );

          const remainingRecords =
            valueAsNumber(
              cleanupResult.rows[0]?.record_count,
            ) ?? -1;

          const cleanupVerified =
            cleanupResult.ok &&
            remainingRecords === 0;

          checks.push(
            createCheck({
              id: "EVT_CLEANUP_VERIFY",
              label: "Verify temporary EVT cleanup",
              status:
                cleanupVerified
                  ? "PASS"
                  : "FAIL",
              durationMs:
                elapsedMs(cleanupStartedAt),
              details: {
                evtId,
                identifierColumn,
                remainingRecords,
                queryStatus: cleanupResult.status,
                queryDurationMs:
                  cleanupResult.durationMs,
                sqlHash: cleanupResult.sqlHash,
              },
              error:
                cleanupResult.error ??
                (
                  cleanupVerified
                    ? null
                    : "EVT_CLEANUP_NOT_CONFIRMED"
                ),
            }),
          );

          recordInserted =
            !cleanupVerified;
        }
      }
    }
  } catch (error) {
    checks.push(
      createCheck({
        id: "UNHANDLED_RUNTIME_ERROR",
        label:
          "Unhandled EVT self-test runtime error",
        status: "FAIL",
        durationMs: elapsedMs(startedAt),
        details: {
          evtId,
          identifierColumn,
        },
        error: normalizeError(error),
      }),
    );
  } finally {
    if (recordInserted && identifierColumn) {
      try {
        const quotedIdentifier =
          quoteIdentifier(identifierColumn);

        await queryHbceDatabase(
          `
            DELETE FROM evt_records
            WHERE ${quotedIdentifier} = $1
          `,
          [evtId],
        );
      } catch {
        // Pulizia best-effort.
      }
    }
  }

  const requiredFailed = checks.some(
    (check) =>
      check.required &&
      check.status !== "PASS",
  );

  const ok = !requiredFailed;

  const status = ok
    ? "HBCE_RUNTIME_EVT_PASS"
    : "HBCE_RUNTIME_EVT_FAIL";

  const durationMs = elapsedMs(startedAt);

  return NextResponse.json(
    {
      ok,
      status,
      operationalStatus:
        ok ? "PASS" : "FAIL",
      revision: REVISION,
      generatedAt,
      product: PRODUCT,
      apiVersion: API_VERSION,
      runtime: RUNTIME_NAME,

      deployment: {
        origin: getRequestOrigin(request),
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

      testRecord: {
        evtId,
        identifierColumn,
        sessionId,
        threadId,
        eventType: TEST_EVENT_TYPE,
        eventKind: TEST_EVENT_KIND,
        humanIpr: TEST_HUMAN_IPR,
        runtimeIpr: TEST_RUNTIME_IPR,
        eventHash,
        chainHash,
        publicHash,
        fullHash,
        inputHash,
        outputHash,
        policyHash,
        temporary: true,
        retained: recordInserted,
      },

      summary: buildSummary(
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

        evtSchemaResolved:
          checks.find(
            (check) =>
              check.id === "EVT_SCHEMA",
          )?.status === "PASS",

        evtWriteSucceeded:
          checks.find(
            (check) =>
              check.id === "EVT_INSERT",
          )?.status === "PASS",

        evtReadSucceeded:
          checks.find(
            (check) =>
              check.id === "EVT_READ",
          )?.status === "PASS",

        evtIntegrityVerified:
          checks.find(
            (check) =>
              check.id === "EVT_VERIFY",
          )?.status === "PASS",

        temporaryEvtDeleted:
          checks.find(
            (check) =>
              check.id === "EVT_DELETE",
          )?.status === "PASS",

        cleanupVerified:
          checks.find(
            (check) =>
              check.id ===
              "EVT_CLEANUP_VERIFY",
          )?.status === "PASS",
      },

      boundary: {
        legalCertification: false,
        technicalRuntimeTestOnly: true,
        requiresExplicitPost: true,
        schemaAware: true,
        usesWhitelistedColumnsOnly: true,
        performsDatabaseRead: true,
        performsDatabaseMutation: true,
        performsTemporaryEvtWrite: true,
        performsTemporaryEvtDelete: true,
        persistsTestEvt: false,
        createsOpc: false,
        createsAuditRecord: false,
        createsMemory: false,
        performsModelCall: false,
        replacesHumanReview: false,
      },
    },
    {
      status: ok ? 200 : 503,
      headers: {
        "Cache-Control":
          "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
        "X-HBCE-EVT-Test-Revision":
          REVISION,
        "X-HBCE-EVT-Test-Status":
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
        "HBCE_RUNTIME_EVT_SELF_TEST_READY",
      revision: REVISION,
      endpoint:
        `${getRequestOrigin(request)}/api/v1/runtime/evt/self-test`,
      executionMethod: "POST",
      description:
        "Esegue l'ispezione dello schema reale di evt_records e un ciclo temporaneo di inserimento, lettura, verifica, eliminazione e controllo della pulizia.",
      strategy: {
        schemaAware: true,
        dynamicColumnSelection: true,
        whitelistOnly: true,
        unsupportedRequiredColumnsFailClosed: true,
        identifierPriority: [
          "evt_id",
          "event_id",
        ],
      },
      warning:
        "GET non esegue il test perché POST effettua mutazioni temporanee sul database.",
      boundary: {
        legalCertification: false,
        getPerformsDatabaseMutation: false,
        postPerformsTemporaryDatabaseMutation: true,
        persistsTestEvt: false,
        createsOpc: false,
        createsAuditRecord: false,
        createsMemory: false,
        performsModelCall: false,
      },
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
        "X-HBCE-EVT-Test-Revision":
          REVISION,
        "X-HBCE-Legal-Certification":
          "false",
      },
    },
  );
}
