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

type EventRecordRow = {
  evt_id?: unknown;
  event_id?: unknown;
  prev_evt_id?: unknown;
  prev_event_id?: unknown;
  tenant_id?: unknown;
  workspace_id?: unknown;
  subscription_id?: unknown;
  human_ipr?: unknown;
  subject_ipr?: unknown;
  runtime_ipr?: unknown;
  session_id?: unknown;
  thread_id?: unknown;
  event_kind?: unknown;
  event_type?: unknown;
  kind?: unknown;
  event_family?: unknown;
  cycle?: unknown;
  runtime_state?: unknown;
  state?: unknown;
  runtime_decision?: unknown;
  decision?: unknown;
  policy_decision?: unknown;
  risk_level?: unknown;
  memory_scope?: unknown;
  context_class?: unknown;
  intent_class?: unknown;
  project_domain?: unknown;
  hbce_module?: unknown;
  evt_hash?: unknown;
  event_hash?: unknown;
  hash?: unknown;
  public_hash?: unknown;
  full_hash?: unknown;
  chain_hash?: unknown;
  input_hash?: unknown;
  output_hash?: unknown;
  policy_hash?: unknown;
  memory_hash?: unknown;
  temporal_certificate?: unknown;
  response_utc?: unknown;
  birth_anchor_local?: unknown;
  birth_anchor_utc?: unknown;
  joker_lifetime?: unknown;
  joker_life_seconds?: unknown;
  operational_context?: unknown;
  anchors?: unknown;
  trace?: unknown;
  created_at?: unknown;
  payload?: unknown;
  event_payload?: unknown;
  legal_certification?: unknown;
};

type DeletedEventRow = {
  evt_id?: unknown;
};

type CountRow = {
  record_count?: unknown;
};

const REVISION = "HBCE-RUNTIME-EVT-SELF-TEST-v1_0";

const PRODUCT = "HBCE IPR Operational Identity & Proof Layer";
const API_VERSION = "v1";
const RUNTIME_NAME = "AI_JOKER_C2_SAAS_CORE_v0_1";

const TEST_RUNTIME_IPR = "IPR-AI-0001";
const TEST_HUMAN_IPR = "IPR-HBCE-EVT-SELF-TEST";

const TEST_TENANT = "HBCE-TENANT-SELF-PILOT";
const TEST_WORKSPACE = "HBCE-WORKSPACE-RND";
const TEST_SUBSCRIPTION = "HBCE-SUBSCRIPTION-SELF-PILOT";

const TEST_EVENT_KIND = "RUNTIME_SELF_TEST";
const TEST_EVENT_TYPE = "AUDIT_LOG_RECORD";
const TEST_KIND = "EVT_TECHNICAL_SELF_TEST";
const TEST_EVENT_FAMILY = "UP-EVT";
const TEST_CYCLE = "UP-CANONICO";

const TEST_RUNTIME_STATE = "READY";
const TEST_STATE = "VERIFIED";
const TEST_RUNTIME_DECISION = "ALLOW";
const TEST_DECISION = "ALLOW";
const TEST_POLICY_DECISION = "ALLOW";
const TEST_RISK_LEVEL = "LOW";

const TEST_MEMORY_SCOPE = "RUNTIME_ONLY";
const TEST_CONTEXT_CLASS = "TECHNICAL_DIAGNOSTIC";
const TEST_INTENT_CLASS = "RUNTIME_SELF_TEST";
const TEST_PROJECT_DOMAIN = "HBCE_RUNTIME";
const TEST_HBCE_MODULE = "EVT";

const BIRTH_ANCHOR_LOCAL = "2026-01-19T15:30:00+01:00";
const BIRTH_ANCHOR_UTC = "2026-01-19T14:30:00.000Z";

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

  if (value === "true" || value === 1 || value === "1") {
    return true;
  }

  if (value === "false" || value === 0 || value === "0") {
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

function isValidTimestamp(value: unknown): boolean {
  if (value instanceof Date) {
    return !Number.isNaN(value.getTime());
  }

  if (typeof value === "string") {
    return !Number.isNaN(Date.parse(value));
  }

  return false;
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
  const forwardedProto =
    request.headers.get("x-forwarded-proto");

  const forwardedHost =
    request.headers.get("x-forwarded-host");

  const host =
    forwardedHost ??
    request.headers.get("host");

  if (host) {
    return `${forwardedProto ?? "https"}://${host}`;
  }

  return request.nextUrl.origin;
}

function buildSummary(
  checks: SelfTestCheck[],
  durationMs: number,
): Record<string, number> {
  const requiredChecks =
    checks.filter((check) => check.required);

  return {
    totalChecks: checks.length,

    passedChecks:
      checks.filter(
        (check) => check.status === "PASS",
      ).length,

    failedChecks:
      checks.filter(
        (check) => check.status === "FAIL",
      ).length,

    skippedChecks:
      checks.filter(
        (check) => check.status === "SKIPPED",
      ).length,

    requiredChecks:
      requiredChecks.length,

    requiredPassed:
      requiredChecks.filter(
        (check) => check.status === "PASS",
      ).length,

    requiredFailed:
      requiredChecks.filter(
        (check) => check.status !== "PASS",
      ).length,

    durationMs,
  };
}

async function cleanupTestEvent(
  evtId: string,
): Promise<SelfTestCheck> {
  const startedAt = nowMs();

  try {
    const deleteResult =
      await queryHbceDatabase<DeletedEventRow>(
        `
          DELETE FROM evt_records
          WHERE evt_id = $1
          RETURNING evt_id
        `,
        [evtId],
      );

    if (!deleteResult.ok) {
      return createCheck({
        id: "EVT_DELETE",
        label: "Delete temporary EVT record",
        status: "FAIL",
        durationMs: elapsedMs(startedAt),
        details: {
          evtId,
          queryStatus: deleteResult.status,
          queryDurationMs: deleteResult.durationMs,
          sqlHash: deleteResult.sqlHash,
        },
        error:
          deleteResult.error ??
          "EVT_DELETE_FAILED",
      });
    }

    const deletedEvtId =
      valueAsString(
        deleteResult.rows[0]?.evt_id,
      );

    const deleted =
      deleteResult.rowCount === 1 &&
      deletedEvtId === evtId;

    return createCheck({
      id: "EVT_DELETE",
      label: "Delete temporary EVT record",
      status: deleted ? "PASS" : "FAIL",
      durationMs: elapsedMs(startedAt),
      details: {
        evtId,
        deletedEvtId,
        deletedRowCount: deleteResult.rowCount,
        queryStatus: deleteResult.status,
        queryDurationMs: deleteResult.durationMs,
        sqlHash: deleteResult.sqlHash,
      },
      error:
        deleted
          ? null
          : "EVT_DELETE_NOT_CONFIRMED",
    });
  } catch (error) {
    return createCheck({
      id: "EVT_DELETE",
      label: "Delete temporary EVT record",
      status: "FAIL",
      durationMs: elapsedMs(startedAt),
      details: {
        evtId,
      },
      error: normalizeError(error),
    });
  }
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse> {
  const startedAt = nowMs();

  const responseUtc = new Date();
  const generatedAt = responseUtc.toISOString();

  const checks: SelfTestCheck[] = [];

  const compactTimestamp =
    generatedAt
      .replace(/\D/g, "")
      .slice(0, 14);

  const eventSuffix =
    randomUUID()
      .replace(/-/g, "")
      .slice(0, 8)
      .toUpperCase();

  const evtId =
    `EVT-${compactTimestamp}-${eventSuffix}`;

  const eventId = evtId;

  const sessionId =
    `HBCE-EVT-SELF-TEST-SESSION-${randomUUID()}`;

  const threadId =
    `HBCE-EVT-SELF-TEST-THREAD-${randomUUID()}`;

  const inputPayload = {
    command:
      "HBCE_RUNTIME_EVT_SELF_TEST",

    revision:
      REVISION,

    evtId,
    sessionId,
    threadId,

    humanIpr:
      TEST_HUMAN_IPR,

    runtimeIpr:
      TEST_RUNTIME_IPR,

    generatedAt,

    legalCertification:
      false,
  };

  const outputPayload = {
    result:
      "TEMPORARY_EVT_CREATED",

    expectedCleanup:
      true,

    reusableMemory:
      false,

    legalCertification:
      false,
  };

  const policyPayload = {
    decision:
      TEST_POLICY_DECISION,

    riskLevel:
      TEST_RISK_LEVEL,

    temporaryTechnicalTest:
      true,
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

  const eventPayload = {
    eventId,
    eventType:
      TEST_EVENT_TYPE,

    subjectIpr:
      TEST_HUMAN_IPR,

    runtimeIpr:
      TEST_RUNTIME_IPR,

    tenant:
      TEST_TENANT,

    workspace:
      TEST_WORKSPACE,

    createdAt:
      generatedAt,

    inputHash,
    outputHash,
    policyHash,

    legalCertification:
      false,

    opcBoundary:
      "technical proof receipt only",
  };

  const eventHash =
    sha256(
      stableJson(eventPayload),
    );

  const chainHash =
    sha256(
      stableJson({
        previousEventId: null,
        previousEventHash: null,
        eventHash,
        eventId,
      }),
    );

  const publicHash =
    sha256(
      stableJson({
        eventId,
        eventType:
          TEST_EVENT_TYPE,
        eventHash,
      }),
    );

  const fullHash =
    sha256(
      stableJson({
        eventPayload,
        chainHash,
        publicHash,
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

  const operationalContext = {
    test:
      "EVT_TRANSACTION_SELF_TEST",

    revision:
      REVISION,

    mode:
      "TEMPORARY_DATABASE_TRANSACTION",

    createsOpc:
      false,

    createsAudit:
      false,

    createsMemory:
      false,
  };

  const anchors = {
    previousEvtId:
      null,

    previousEventId:
      null,

    opcProofId:
      null,

    auditId:
      null,
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

  const jokerLifeSeconds =
    Math.max(
      0,
      Math.floor(
        (
          responseUtc.getTime() -
          new Date(BIRTH_ANCHOR_UTC).getTime()
        ) / 1000,
      ),
    );

  const jokerLifetime =
    `${jokerLifeSeconds} seconds`;

  let recordMayExist = false;

  try {
    const configurationStartedAt = nowMs();

    const configured =
      isHbceDatabaseConfigured();

    const databaseDescription =
      describeDefaultHbceDatabase();

    checks.push(
      createCheck({
        id: "DATABASE_CONFIGURATION",
        label: "HBCE database configuration",
        status: configured ? "PASS" : "FAIL",
        durationMs:
          elapsedMs(configurationStartedAt),
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
      const insertStartedAt = nowMs();

      const insertResult =
        await queryHbceDatabase<EventRecordRow>(
          `
            INSERT INTO evt_records (
              evt_id,
              event_id,
              prev_evt_id,
              prev_event_id,
              tenant_id,
              workspace_id,
              subscription_id,
              human_ipr,
              subject_ipr,
              runtime_ipr,
              session_id,
              thread_id,
              event_kind,
              event_type,
              kind,
              event_family,
              cycle,
              runtime_state,
              state,
              runtime_decision,
              decision,
              policy_decision,
              risk_level,
              memory_scope,
              context_class,
              intent_class,
              project_domain,
              hbce_module,
              evt_hash,
              event_hash,
              hash,
              public_hash,
              full_hash,
              chain_hash,
              input_hash,
              output_hash,
              policy_hash,
              temporal_certificate,
              response_utc,
              birth_anchor_local,
              birth_anchor_utc,
              joker_lifetime,
              joker_life_seconds,
              operational_context,
              anchors,
              trace,
              payload,
              event_payload,
              legal_certification,
              created_at
            )
            VALUES (
              $1,
              $2,
              NULL,
              NULL,
              $3,
              $4,
              $5,
              $6,
              $6,
              $7,
              $8,
              $9,
              $10,
              $11,
              $12,
              $13,
              $14,
              $15,
              $16,
              $17,
              $18,
              $19,
              $20,
              $21,
              $22,
              $23,
              $24,
              $25,
              $26,
              $26,
              $26,
              $27,
              $28,
              $29,
              $30,
              $31,
              $32,
              $33::jsonb,
              $34,
              $35,
              $36,
              $37,
              $38,
              $39::jsonb,
              $40::jsonb,
              $41::jsonb,
              $42::jsonb,
              $43::jsonb,
              false,
              CURRENT_TIMESTAMP
            )
            RETURNING
              evt_id,
              event_id,
              event_type,
              event_hash,
              chain_hash,
              legal_certification,
              response_utc,
              created_at
          `,
          [
            evtId,
            eventId,
            TEST_TENANT,
            TEST_WORKSPACE,
            TEST_SUBSCRIPTION,
            TEST_HUMAN_IPR,
            TEST_RUNTIME_IPR,
            sessionId,
            threadId,
            TEST_EVENT_KIND,
            TEST_EVENT_TYPE,
            TEST_KIND,
            TEST_EVENT_FAMILY,
            TEST_CYCLE,
            TEST_RUNTIME_STATE,
            TEST_STATE,
            TEST_RUNTIME_DECISION,
            TEST_DECISION,
            TEST_POLICY_DECISION,
            TEST_RISK_LEVEL,
            TEST_MEMORY_SCOPE,
            TEST_CONTEXT_CLASS,
            TEST_INTENT_CLASS,
            TEST_PROJECT_DOMAIN,
            TEST_HBCE_MODULE,
            eventHash,
            publicHash,
            fullHash,
            chainHash,
            inputHash,
            outputHash,
            policyHash,
            stableJson(
              temporalCertificate,
            ),
            generatedAt,
            BIRTH_ANCHOR_LOCAL,
            BIRTH_ANCHOR_UTC,
            jokerLifetime,
            jokerLifeSeconds,
            stableJson(
              operationalContext,
            ),
            stableJson(
              anchors,
            ),
            stableJson(
              trace,
            ),
            stableJson(
              inputPayload,
            ),
            stableJson(
              eventPayload,
            ),
          ],
        );

      const recordInserted =
        insertResult.ok &&
        insertResult.rowCount === 1;

      recordMayExist =
        recordInserted;

      checks.push(
        createCheck({
          id: "EVT_INSERT",
          label: "Insert temporary EVT record",
          status:
            recordInserted
              ? "PASS"
              : "FAIL",
          durationMs:
            elapsedMs(insertStartedAt),
          details: {
            evtId,
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
        );
      } else {
        const readStartedAt = nowMs();

        const readResult =
          await queryHbceDatabase<EventRecordRow>(
            `
              SELECT
                evt_id,
                event_id,
                prev_evt_id,
                prev_event_id,
                tenant_id,
                workspace_id,
                subscription_id,
                human_ipr,
                subject_ipr,
                runtime_ipr,
                session_id,
                thread_id,
                event_kind,
                event_type,
                kind,
                event_family,
                cycle,
                runtime_state,
                state,
                runtime_decision,
                decision,
                policy_decision,
                risk_level,
                memory_scope,
                context_class,
                intent_class,
                project_domain,
                hbce_module,
                evt_hash,
                event_hash,
                hash,
                public_hash,
                full_hash,
                chain_hash,
                input_hash,
                output_hash,
                policy_hash,
                temporal_certificate,
                response_utc,
                birth_anchor_local,
                birth_anchor_utc,
                joker_lifetime,
                joker_life_seconds,
                operational_context,
                anchors,
                trace,
                created_at,
                payload,
                event_payload,
                legal_certification
              FROM evt_records
              WHERE evt_id = $1
              LIMIT 1
            `,
            [evtId],
          );

        const readSucceeded =
          readResult.ok &&
          readResult.rowCount === 1 &&
          Boolean(readResult.rows[0]);

        checks.push(
          createCheck({
            id: "EVT_READ",
            label: "Read temporary EVT record",
            status:
              readSucceeded
                ? "PASS"
                : "FAIL",
            durationMs:
              elapsedMs(readStartedAt),
            details: {
              evtId,
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
          const row = readResult.rows[0];

          const storedEventPayload =
            row.event_payload !== null &&
            typeof row.event_payload === "object"
              ? row.event_payload
              : null;

          const storedTrace =
            row.trace !== null &&
            typeof row.trace === "object"
              ? row.trace
              : null;

          const comparisons = {
            evtId:
              valueAsString(row.evt_id) ===
              evtId,

            eventId:
              valueAsString(row.event_id) ===
              eventId,

            previousEvtId:
              row.prev_evt_id === null,

            previousEventId:
              row.prev_event_id === null,

            tenant:
              valueAsString(row.tenant_id) ===
              TEST_TENANT,

            workspace:
              valueAsString(row.workspace_id) ===
              TEST_WORKSPACE,

            subscription:
              valueAsString(
                row.subscription_id,
              ) === TEST_SUBSCRIPTION,

            humanIpr:
              valueAsString(row.human_ipr) ===
              TEST_HUMAN_IPR,

            subjectIpr:
              valueAsString(row.subject_ipr) ===
              TEST_HUMAN_IPR,

            runtimeIpr:
              valueAsString(row.runtime_ipr) ===
              TEST_RUNTIME_IPR,

            sessionId:
              valueAsString(row.session_id) ===
              sessionId,

            threadId:
              valueAsString(row.thread_id) ===
              threadId,

            eventKind:
              valueAsString(row.event_kind) ===
              TEST_EVENT_KIND,

            eventType:
              valueAsString(row.event_type) ===
              TEST_EVENT_TYPE,

            eventFamily:
              valueAsString(
                row.event_family,
              ) === TEST_EVENT_FAMILY,

            cycle:
              valueAsString(row.cycle) ===
              TEST_CYCLE,

            eventHash:
              valueAsString(row.event_hash) ===
              eventHash,

            evtHash:
              valueAsString(row.evt_hash) ===
              eventHash,

            genericHash:
              valueAsString(row.hash) ===
              eventHash,

            publicHash:
              valueAsString(row.public_hash) ===
              publicHash,

            fullHash:
              valueAsString(row.full_hash) ===
              fullHash,

            chainHash:
              valueAsString(row.chain_hash) ===
              chainHash,

            inputHash:
              valueAsString(row.input_hash) ===
              inputHash,

            outputHash:
              valueAsString(row.output_hash) ===
              outputHash,

            policyHash:
              valueAsString(row.policy_hash) ===
              policyHash,

            eventPayload:
              storedEventPayload !== null &&
              stableJson(storedEventPayload) ===
                stableJson(eventPayload),

            trace:
              storedTrace !== null &&
              stableJson(storedTrace) ===
                stableJson(trace),

            responseUtc:
              isValidTimestamp(
                row.response_utc,
              ),

            createdAt:
              isValidTimestamp(
                row.created_at,
              ),

            jokerLifeSeconds:
              valueAsNumber(
                row.joker_life_seconds,
              ) === jokerLifeSeconds,

            legalCertification:
              valueAsBoolean(
                row.legal_certification,
              ) === false,
          };

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
                    row.chain_hash,
                  ),
                storedResponseUtc:
                  valueAsString(
                    row.response_utc,
                  ),
                storedCreatedAt:
                  valueAsString(
                    row.created_at,
                  ),
              },
              error:
                integrityVerified
                  ? null
                  : `EVT_INTEGRITY_MISMATCH:${failedComparisons.join(",")}`,
            }),
          );
        }
      }

      const deleteCheck =
        await cleanupTestEvent(evtId);

      checks.push(deleteCheck);

      const cleanupVerifyStartedAt = nowMs();

      const cleanupResult =
        await queryHbceDatabase<CountRow>(
          `
            SELECT COUNT(*)::int AS record_count
            FROM evt_records
            WHERE evt_id = $1
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
            elapsedMs(cleanupVerifyStartedAt),
          details: {
            evtId,
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
                : "EVT_CLEANUP_NOT_CONFIRMED"
            ),
        }),
      );

      recordMayExist =
        !cleanupVerified;
    }
  } catch (error) {
    checks.push(
      createCheck({
        id: "UNHANDLED_RUNTIME_ERROR",
        label:
          "Unhandled EVT self-test runtime error",
        status: "FAIL",
        durationMs:
          elapsedMs(startedAt),
        details: {
          evtId,
        },
        error:
          normalizeError(error),
      }),
    );
  } finally {
    if (recordMayExist) {
      try {
        await queryHbceDatabase(
          `
            DELETE FROM evt_records
            WHERE evt_id = $1
          `,
          [evtId],
        );
      } catch {
        // Best-effort cleanup only.
      }
    }
  }

  const requiredFailed =
    checks.some(
      (check) =>
        check.required &&
        check.status !== "PASS",
    );

  const ok =
    !requiredFailed;

  const status =
    ok
      ? "HBCE_RUNTIME_EVT_PASS"
      : "HBCE_RUNTIME_EVT_FAIL";

  const durationMs =
    elapsedMs(startedAt);

  const responseBody = {
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
        getRequestOrigin(request),

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
      evtId,
      eventId,
      sessionId,
      threadId,

      eventType:
        TEST_EVENT_TYPE,

      eventKind:
        TEST_EVENT_KIND,

      humanIpr:
        TEST_HUMAN_IPR,

      runtimeIpr:
        TEST_RUNTIME_IPR,

      tenant:
        TEST_TENANT,

      workspace:
        TEST_WORKSPACE,

      eventHash,
      chainHash,
      publicHash,
      fullHash,
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
        )?.status === "PASS",

      evtWriteSucceeded:
        checks.find(
          (check) =>
            check.id ===
            "EVT_INSERT",
        )?.status === "PASS",

      evtReadSucceeded:
        checks.find(
          (check) =>
            check.id ===
            "EVT_READ",
        )?.status === "PASS",

      evtIntegrityVerified:
        checks.find(
          (check) =>
            check.id ===
            "EVT_VERIFY",
        )?.status === "PASS",

      temporaryEvtDeleted:
        checks.find(
          (check) =>
            check.id ===
            "EVT_DELETE",
        )?.status === "PASS",

      cleanupVerified:
        checks.find(
          (check) =>
            check.id ===
            "EVT_CLEANUP_VERIFY",
        )?.status === "PASS",
    },

    boundary: {
      legalCertification:
        false,

      technicalRuntimeTestOnly:
        true,

      requiresExplicitPost:
        true,

      performsDatabaseRead:
        true,

      performsDatabaseMutation:
        true,

      performsTemporaryEvtWrite:
        true,

      performsTemporaryEvtDelete:
        true,

      persistsTestEvt:
        false,

      createsOpc:
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
  };

  return NextResponse.json(
    responseBody,
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

      revision:
        REVISION,

      endpoint:
        `${getRequestOrigin(request)}/api/v1/runtime/evt/self-test`,

      executionMethod:
        "POST",

      description:
        "Executes a temporary EVT insert, read, deterministic hash verification, deletion and cleanup verification cycle against the canonical HBCE evt_records table.",

      eventContract: {
        eventIdFormat:
          "EVT-<YYYYMMDDHHMMSS>-<8_HEX>",

        eventType:
          TEST_EVENT_TYPE,

        eventFamily:
          TEST_EVENT_FAMILY,

        cycle:
          TEST_CYCLE,

        legalCertification:
          false,
      },

      warning:
        "GET does not execute the self-test because POST performs temporary database mutations.",

      boundary: {
        legalCertification:
          false,

        getPerformsDatabaseMutation:
          false,

        postPerformsTemporaryDatabaseMutation:
          true,

        persistsTestEvt:
          false,

        createsOpc:
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

        "X-HBCE-EVT-Test-Revision":
          REVISION,

        "X-HBCE-Legal-Certification":
          "false",
      },
    },
  );
}
