import {
  createHash,
  randomUUID,
} from "node:crypto";

import { sql } from "@vercel/postgres";
import {
  NextRequest,
  NextResponse,
} from "next/server";

import type {
  RuntimeBootstrapInput,
} from "@/lib/runtime/bootstrap";

import {
  IPR_AUTH_COOKIE_NAME,
} from "@/lib/ipr-auth";

import {
  RuntimePersistentHumanAuthorizationError,
  resolveRuntimePersistentHumanAuthorization,
} from "@/src/runtime/authorization/runtime-persistent-human-authorization.service";

import {
  executeRuntimeAndPersist,
  RuntimeExecutionPersistenceError,
} from "@/src/runtime/orchestration/runtime-execution-persistence.service";

import {
  RuntimeOperationsPersistentAppendError,
} from "@/src/runtime/operations/runtime-operations-persistent-append.service";

import {
  getLatestRuntimeOperationsLedgerEntry,
  getRuntimeOperationsLedgerEntryByOperationIdSha256,
} from "@/src/runtime/operations/runtime-operations-ledger-repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REVISION =
  "HBCE-RUNTIME-EXECUTION-PERSISTENCE-SELF-TEST-v1_2" as const;

const MANUAL_AUTHORIZATION_HEADER =
  "x-hbce-ledger-self-test-token" as const;

const RUNTIME_IPR =
  "IPR-AI-0001" as const;

const HUMAN_AUTHORITY_IPR =
  "IPR-3" as const;

const ORGANIZATION =
  "HERMETICUM B.C.E. S.r.l." as const;

const HERMETICUM_SIGIL =
  "🜏" as const;

const HERMETICUM_SIGIL_CODEPOINT =
  "U+1F70F" as const;

const VERIFICATION_PAGE_SIZE =
  500 as const;

const MAX_VERIFICATION_ENTRIES =
  10_000 as const;

type Check = {
  id: string;
  description: string;
  passed: boolean;
  expected: unknown;
  actual: unknown;
};

function check(
  id: string,
  description: string,
  expected: unknown,
  actual: unknown,
): Check {
  return {
    id,
    description,
    passed:
      Object.is(
        expected,
        actual,
      ),
    expected,
    actual,
  };
}

function sha256(
  value: string,
): string {
  return createHash(
    "sha256",
  )
    .update(
      value,
      "utf8",
    )
    .digest(
      "hex",
    );
}

function getExpectedManualToken():
  string | null {
  const value =
    process.env
      .HBCE_LEDGER_SELF_TEST_TOKEN;

  if (
    typeof value !== "string" ||
    value.length < 16
  ) {
    return null;
  }

  return value;
}

function commonHeaders(
  persistence:
    | "false"
    | "true"
    | "FAIL_CLOSED",
) {
  return {
    "Cache-Control":
      "no-store, no-cache, must-revalidate",

    "X-HBCE-Revision":
      REVISION,

    "X-HBCE-Persistence":
      persistence,

    "X-HBCE-Runtime-Activation":
      "false",

    "X-HBCE-Autonomous-Authorization":
      "false",

    "X-HBCE-No-Submit-From-Code":
      "true",

    "X-HBCE-Legal-Certification":
      "false",

    "X-HBCE-Qualified-Electronic-Signature":
      "false",

    "X-HBCE-Hermeticum-Sigil-Codepoint":
      HERMETICUM_SIGIL_CODEPOINT,
  };
}

function unauthorized(
  reason: string,
) {
  return NextResponse.json(
    {
      ok: false,

      status:
        "HBCE_RUNTIME_EXECUTION_PERSISTENCE_SELF_TEST_UNAUTHORIZED",

      operationalStatus:
        "FAIL_CLOSED",

      revision:
        REVISION,

      reason,

      governance: {
        persistenceExecuted:
          false,

        persistenceAttempted:
          false,

        humanAuthorizationRequired:
          true,

        autonomousAuthorization:
          false,

        runtimeActivation:
          false,

        noSubmitFromCode:
          true,

        legalCertification:
          false,

        qualifiedElectronicSignature:
          false,
      },
    },
    {
      status:
        401,

      headers: {
        ...commonHeaders(
          "false",
        ),

        "X-HBCE-Authorization":
          "REJECTED",
      },
    },
  );
}

function buildRuntimeInput(
  status:
    | "AUTHORIZED"
    | "DRAFT",
): RuntimeBootstrapInput {
  const claimId =
    "HBCE-RUNTIME-CONVERGENCE-CLAIM-001";

  return {
    mission: {
      missionId:
        "HBCE-RUNTIME-CONVERGENCE-MISSION-001",

      iprSubject:
        RUNTIME_IPR,

      operatorId:
        HUMAN_AUTHORITY_IPR,

      objective:
        "Verify runtime execution to persistent evidence convergence.",

      scope:
        "HBCE_RUNTIME_CONVERGENCE_SELF_TEST",

      allowedSources: [
        "HBCE-RUNTIME-CONVERGENCE-SOURCE-001",
      ],

      allowedFrameworks: [
        {
          frameworkId:
            "SRSC-V17.1",

          mode:
            "INTERPRETIVE",

          mayGenerateFacts:
            false,

          requiresExplicitLabel:
            true,
        },
      ],

      allowedTools: [],

      forbiddenActions: [
        "AUTONOMOUS_SUBMISSION",
        "AUTONOMOUS_AUTHORIZATION",
      ],

      authorizationLevel:
        "HUMAN_AUTHORIZED",

      riskClass:
        "SELF_TEST",

      epistemicPolicy:
        "FAIL_CLOSED",

      createdAt:
        "2026-08-09T00:00:00.000Z",

      status,
    },

    claims: [
      {
        id:
          claimId,

        text:
          "The runtime convergence self-test is executing against an explicitly defined trusted source.",

        type:
          "PROJECT_RECORD",

        sourceIds: [
          "HBCE-RUNTIME-CONVERGENCE-SOURCE-001",
        ],

        frameworkIds: [
          "SRSC-V17.1",
        ],

        confidence:
          1,

        requiresHumanReview:
          false,

        requiresExplicitLabel:
          false,
      },
    ],

    sources: [
      {
        sourceId:
          "HBCE-RUNTIME-CONVERGENCE-SOURCE-001",

        authorityDomain:
          "HERMETICUM_BCE_INTERNAL_SELF_TEST",

        sourceClass:
          "PROJECT_RECORD",

        trusted:
          true,
      },
    ],

    layers: [
      {
        id:
          "REAL_RESISTANT",

        description:
          "Persistent runtime outcome exists independently of narrative interpretation.",

        evidenceClaimIds: [
          claimId,
        ],

        confidence:
          1,
      },

      {
        id:
          "MEDIATION",

        description:
          "Runtime input is mediated through the canonical execution engine.",

        evidenceClaimIds: [
          claimId,
        ],

        confidence:
          1,
      },

      {
        id:
          "NARRATIVE",

        description:
          "Interpretation remains explicitly separated from persistent evidence.",

        evidenceClaimIds: [
          claimId,
        ],

        confidence:
          1,
      },

      {
        id:
          "DECISION",

        description:
          "Runtime authorization produces an explicit execution decision.",

        evidenceClaimIds: [
          claimId,
        ],

        confidence:
          1,
      },

      {
        id:
          "COST",

        description:
          "Persistence occurs only after runtime authorization succeeds.",

        evidenceClaimIds: [
          claimId,
        ],

        confidence:
          1,
      },

      {
        id:
          "TRACE",

        description:
          "Execution is bound to cryptographic persistent evidence.",

        evidenceClaimIds: [
          claimId,
        ],

        confidence:
          1,
      },

      {
        id:
          "TIME",

        description:
          "Execution and persistence are recorded in an ordered append-only ledger.",

        evidenceClaimIds: [
          claimId,
        ],

        confidence:
          1,
      },

      {
        id:
          "LIMIT",

        description:
          "Fail-closed boundaries prevent unauthorized execution persistence.",

        evidenceClaimIds: [
          claimId,
        ],

        confidence:
          1,
      },
    ],
  };
}

/*
 * Persistent runtime authorization MUST NOT be synthesized here.
 *
 * The raw HBCE IPR session token exists only at the HTTP boundary.
 * Canonical persistent authorization is derived through strict
 * PostgreSQL-backed verification.
 */
async function countRowsByOperationHash(
  operationIdSha256: string,
): Promise<number> {
  const result =
    await sql`
      SELECT COUNT(*)::int AS count
      FROM public.hbce_runtime_operations_ledger
      WHERE operation_id_sha256 = ${operationIdSha256}
    `;

  const value =
    result.rows[0]
      ?.count;

  const count =
    typeof value ===
      "number"
      ? value
      : Number(
          value ?? Number.NaN,
        );

  if (
    !Number.isSafeInteger(
      count,
    ) ||
    count < 0
  ) {
    throw new Error(
      "HBCE_RUNTIME_EXECUTION_PERSISTENCE_INVALID_DATABASE_COUNT",
    );
  }

  return count;
}

async function countRawIdentifierOccurrences(
  operationId: string,
): Promise<number> {
  const pattern =
    `%${operationId}%`;

  const result =
    await sql`
      SELECT COUNT(*)::int AS count
      FROM public.hbce_runtime_operations_ledger AS ledger
      WHERE to_jsonb(ledger)::text LIKE ${pattern}
    `;

  const value =
    result.rows[0]
      ?.count;

  const count =
    typeof value ===
      "number"
      ? value
      : Number(
          value ?? Number.NaN,
        );

  if (
    !Number.isSafeInteger(
      count,
    ) ||
    count < 0
  ) {
    throw new Error(
      "HBCE_RUNTIME_EXECUTION_PERSISTENCE_INVALID_RAW_IDENTIFIER_COUNT",
    );
  }

  return count;
}

export async function GET() {
  const generatedAt =
    new Date().toISOString();

  try {
    const latest =
      await getLatestRuntimeOperationsLedgerEntry();

    const ready =
      latest !==
      null;

    return NextResponse.json(
      {
        ok:
          ready,

        status:
          ready
            ? "HBCE_RUNTIME_EXECUTION_PERSISTENCE_SELF_TEST_READY"
            : "HBCE_RUNTIME_EXECUTION_PERSISTENCE_SELF_TEST_PRECONDITION_FAIL_CLOSED",

        operationalStatus:
          ready
            ? "READY"
            : "FAIL_CLOSED",

        revision:
          REVISION,

        generatedAt,

        method:
          "POST",

        readOnly:
          true,

        sideEffects:
          false,

        observed: {
          persistentLedgerPresent:
            latest !==
            null,

          latestSequence:
            latest?.entry
              .sequence ?? null,

          latestEntrySha256:
            latest?.entry
              .chain
              .entrySha256 ?? null,
        },

        proofPlan: {
          authorizedRuntimeExecution:
            true,

          firstPersistenceInsert:
            true,

          idempotentReplay:
            true,

          sameSequenceOnReplay:
            true,

          sameEvidenceOnReplay:
            true,

          opcEvtVerification:
            true,

          rawOperationIdentifierPersistenceForbidden:
            true,

          fullChainVerification:
            true,

          unauthorizedMissionFailClosed:
            true,

          unauthorizedMissionPersistenceForbidden:
            true,
        },

        requirements: {
          environmentVariable:
            "HBCE_LEDGER_SELF_TEST_TOKEN",

          requestHeader:
            MANUAL_AUTHORIZATION_HEADER,

          minimumTokenLength:
            16,

          sessionCookie:
            IPR_AUTH_COOKIE_NAME,

          persistentHumanAuthorizationMode:
            "DATABASE_PERSISTENT_STRICT",
        },

        identity: {
          runtimeIpr:
            RUNTIME_IPR,

          humanAuthorityIpr:
            HUMAN_AUTHORITY_IPR,

          organization:
            ORGANIZATION,

          hermeticumSigil:
            HERMETICUM_SIGIL,

          hermeticumSigilCodepoint:
            HERMETICUM_SIGIL_CODEPOINT,
        },

        governance: {
          persistenceExecuted:
            false,

          persistenceAttempted:
            false,

          appendOnly:
            true,

          hashOnlyEvidence:
            true,

          humanAuthorizationRequired:
            true,

          autonomousAuthorization:
            false,

          runtimeActivation:
            false,

          noSubmitFromCode:
            true,

          legalCertification:
            false,

          qualifiedElectronicSignature:
            false,
        },
      },
      {
        status:
          ready
            ? 200
            : 409,

        headers: {
          ...commonHeaders(
            "false",
          ),

          "X-HBCE-Authorization":
            ready
              ? "HUMAN_AUTHORIZATION_REQUIRED"
              : "PRECONDITION_NOT_MET",
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,

        status:
          "HBCE_RUNTIME_EXECUTION_PERSISTENCE_SELF_TEST_READ_FAIL_CLOSED",

        operationalStatus:
          "FAIL_CLOSED",

        revision:
          REVISION,

        generatedAt,

        error: {
          name:
            error instanceof Error
              ? error.name
              : "UnknownError",

          message:
            error instanceof Error
              ? error.message
              : String(
                  error,
                ),
        },
      },
      {
        status:
          500,

        headers: {
          ...commonHeaders(
            "FAIL_CLOSED",
          ),

          "X-HBCE-Authorization":
            "NOT_EVALUATED",
        },
      },
    );
  }
}

export async function POST(
  request: NextRequest,
) {
  const expectedToken =
    getExpectedManualToken();

  if (!expectedToken) {
    return unauthorized(
      "HBCE_LEDGER_SELF_TEST_TOKEN is missing or shorter than 16 characters.",
    );
  }

  const suppliedToken =
    request.headers.get(
      MANUAL_AUTHORIZATION_HEADER,
    );

  if (
    suppliedToken !==
    expectedToken
  ) {
    return unauthorized(
      "Manual runtime execution persistence authorization token is invalid.",
    );
  }

  /*
   * The manual self-test token authorizes execution of the diagnostic only.
   *
   * It does NOT establish biological identity and does NOT authorize
   * persistent runtime writes.
   *
   * Persistent authorization derives from the authenticated HBCE IPR
   * HttpOnly session cookie and strict database verification.
   */
  const sessionToken =
    request.cookies.get(
      IPR_AUTH_COOKIE_NAME,
    )?.value ?? "";

  if (!sessionToken) {
    return unauthorized(
      "Authenticated HBCE IPR session cookie is required for persistent runtime authorization.",
    );
  }

  const generatedAt =
    new Date().toISOString();

  const checks:
    Check[] =
    [];

  let persistenceAttempted =
    false;

  let persistentHumanAuthorizationAccepted =
    false;

  try {
    const persistentHumanAuthorization =
      await resolveRuntimePersistentHumanAuthorization({
        sessionToken,
      });

    persistentHumanAuthorizationAccepted =
      true;

    checks.push(
      check(
        "EXEC-PERSIST-AUTH-001",
        "Persistent human authorization derives from strict database persistence",
        "DATABASE_PERSISTENT_STRICT",
        persistentHumanAuthorization
          .proof
          .persistenceMode,
      ),
    );

    checks.push(
      check(
        "EXEC-PERSIST-AUTH-002",
        "Persistent human authorization uses no process fallback",
        false,
        persistentHumanAuthorization
          .proof
          .processFallbackUsed,
      ),
    );

    checks.push(
      check(
        "EXEC-PERSIST-AUTH-003",
        "SELF_PILOT is forbidden for canonical persistent authorization",
        false,
        persistentHumanAuthorization
          .proof
          .selfPilotAccepted,
      ),
    );

    const latestBefore =
      await getLatestRuntimeOperationsLedgerEntry();

    checks.push(
      check(
        "EXEC-PERSIST-001",
        "Persistent ledger has an existing verified continuation tip",
        true,
        latestBefore !==
          null,
      ),
    );

    if (!latestBefore) {
      throw new Error(
        "HBCE_RUNTIME_EXECUTION_PERSISTENCE_LEDGER_TIP_REQUIRED",
      );
    }

    const initialSequence =
      latestBefore.entry
        .sequence;

    const runNonce =
      randomUUID();

    const operationId =
      `HBCE-RUNTIME-EXECUTION-PERSISTENCE-${runNonce}`;

    const blockedOperationId =
      `HBCE-RUNTIME-EXECUTION-BLOCKED-${runNonce}`;

    const operationIdSha256 =
      sha256(
        operationId,
      );

    const blockedOperationIdSha256 =
      sha256(
        blockedOperationId,
      );

    const runtimeInput =
      buildRuntimeInput(
        "AUTHORIZED",
      );

    persistenceAttempted =
      true;

    const first =
      await executeRuntimeAndPersist({
        operationId,

        runtimeInput,

        authorization:
          persistentHumanAuthorization
            .authorization,

        expectedTip: {
          sequence:
            latestBefore.entry
              .sequence,

          entrySha256:
            latestBefore.entry
              .chain
              .entrySha256,
        },

        verification: {
          pageSize:
            VERIFICATION_PAGE_SIZE,

          maximumEntries:
            MAX_VERIFICATION_ENTRIES,
        },
      });

    checks.push(
      check(
        "EXEC-PERSIST-002",
        "Authorized mission produces an authorized runtime execution",
        true,
        first.runtimeExecution
          .authorized,
      ),
    );

    checks.push(
      check(
        "EXEC-PERSIST-003",
        "Authorized runtime execution remains outside fail-closed state",
        false,
        first.runtimeExecution
          .failClosed,
      ),
    );

    checks.push(
      check(
        "EXEC-PERSIST-004",
        "Authorized runtime execution completes with SUCCESS",
        "SUCCESS",
        first.runtimeExecution
          .reason,
      ),
    );

    checks.push(
      check(
        "EXEC-PERSIST-005",
        "First converged runtime operation inserts exactly one ledger entry",
        true,
        first.persistence
          .idempotency
          .inserted,
      ),
    );

    checks.push(
      check(
        "EXEC-PERSIST-006",
        "First converged runtime operation is not an idempotent replay",
        false,
        first.persistence
          .idempotency
          .replayed,
      ),
    );

    checks.push(
      check(
        "EXEC-PERSIST-007",
        "First converged runtime operation advances ledger sequence by exactly one",
        initialSequence +
          1,
        first.persistence
          .persistence
          .sequence,
      ),
    );

    checks.push(
      check(
        "EXEC-PERSIST-008",
        "Persistent service derives the expected operation SHA-256",
        operationIdSha256,
        first.persistence
          .idempotency
          .operationIdSha256,
      ),
    );

    checks.push(
      check(
        "EXEC-PERSIST-009",
        "OPC/EVT envelope verifies successfully",
        true,
        first.persistence
          .opcEvt
          .verified,
      ),
    );

    checks.push(
      check(
        "EXEC-PERSIST-010",
        "OPC/EVT verification reports zero failures",
        0,
        first.persistence
          .opcEvt
          .failedChecks,
      ),
    );

    /*
     * Replay the same logical runtime operation.
     */
    const second =
      await executeRuntimeAndPersist({
        operationId,

        runtimeInput,

        authorization:
          persistentHumanAuthorization
            .authorization,

        verification: {
          pageSize:
            VERIFICATION_PAGE_SIZE,

          maximumEntries:
            MAX_VERIFICATION_ENTRIES,
        },
      });

    checks.push(
      check(
        "EXEC-PERSIST-011",
        "Retry does not insert another persistent row",
        false,
        second.persistence
          .idempotency
          .inserted,
      ),
    );

    checks.push(
      check(
        "EXEC-PERSIST-012",
        "Retry resolves as idempotent replay",
        true,
        second.persistence
          .idempotency
          .replayed,
      ),
    );

    checks.push(
      check(
        "EXEC-PERSIST-013",
        "Replay returns the original persistent sequence",
        first.persistence
          .persistence
          .sequence,
        second.persistence
          .persistence
          .sequence,
      ),
    );

    checks.push(
      check(
        "EXEC-PERSIST-014",
        "Replay returns the original ledger entry SHA-256",
        first.persistence
          .append
          .entrySha256,
        second.persistence
          .append
          .entrySha256,
      ),
    );

    checks.push(
      check(
        "EXEC-PERSIST-015",
        "Replay returns the original Evidence SHA-256",
        first.persistence
          .evidence
          .sha256,
        second.persistence
          .evidence
          .sha256,
      ),
    );

    const persistedRecord =
      await getRuntimeOperationsLedgerEntryByOperationIdSha256(
        operationIdSha256,
      );

    checks.push(
      check(
        "EXEC-PERSIST-016",
        "Converged runtime operation can be independently reread by operation hash",
        true,
        persistedRecord !==
          null,
      ),
    );

    checks.push(
      check(
        "EXEC-PERSIST-017",
        "Converged runtime operation exists in exactly one persistent row",
        1,
        await countRowsByOperationHash(
          operationIdSha256,
        ),
      ),
    );

    checks.push(
      check(
        "EXEC-PERSIST-018",
        "Raw logical operation identifier is absent from serialized persistent rows",
        0,
        await countRawIdentifierOccurrences(
          operationId,
        ),
      ),
    );

    /*
     * Negative proof.
     *
     * A non-authorized mission must fail in the runtime layer before the
     * persistent append service is reached.
     */
    let blockedCode:
      string | null =
      null;

    let blockedStage:
      string | null =
      null;

    let blockedReason:
      string | null =
      null;

    try {
      await executeRuntimeAndPersist({
        operationId:
          blockedOperationId,

        runtimeInput:
          buildRuntimeInput(
            "DRAFT",
          ),

        authorization:
          persistentHumanAuthorization
            .authorization,

        verification: {
          pageSize:
            VERIFICATION_PAGE_SIZE,

          maximumEntries:
            MAX_VERIFICATION_ENTRIES,
        },
      });

      blockedCode =
        "NO_ERROR";

      blockedStage =
        "NO_ERROR";

      blockedReason =
        "NO_ERROR";
    } catch (error) {
      if (
        error instanceof
        RuntimeExecutionPersistenceError
      ) {
        blockedCode =
          error.code;

        blockedStage =
          error.stage;

        blockedReason =
          error.runtimeExecution
            ?.reason ?? null;
      } else {
        throw error;
      }
    }

    checks.push(
      check(
        "EXEC-PERSIST-019",
        "Non-authorized mission fails before persistence",
        "HBCE_RUNTIME_EXECUTION_PERSISTENCE_RUNTIME_NOT_PASS",
        blockedCode,
      ),
    );

    checks.push(
      check(
        "EXEC-PERSIST-020",
        "Non-authorized mission fails in RUNTIME_EXECUTION stage",
        "RUNTIME_EXECUTION",
        blockedStage,
      ),
    );

    checks.push(
      check(
        "EXEC-PERSIST-021",
        "Non-authorized mission retains canonical fail-closed runtime reason",
        "MISSION_NOT_AUTHORIZED",
        blockedReason,
      ),
    );

    checks.push(
      check(
        "EXEC-PERSIST-022",
        "Blocked operation produces zero persistent rows",
        0,
        await countRowsByOperationHash(
          blockedOperationIdSha256,
        ),
      ),
    );

    const latestAfter =
      await getLatestRuntimeOperationsLedgerEntry();

    if (!latestAfter) {
      throw new Error(
        "HBCE_RUNTIME_EXECUTION_PERSISTENCE_FINAL_LEDGER_TIP_MISSING",
      );
    }

    checks.push(
      check(
        "EXEC-PERSIST-023",
        "Only the authorized logical runtime operation advances the ledger",
        initialSequence +
          1,
        latestAfter.entry
          .sequence,
      ),
    );

    checks.push(
      check(
        "EXEC-PERSIST-024",
        "Replay full-chain verification passes",
        true,
        second.persistence
          .verification
          .fullChain
          .verified,
      ),
    );

    checks.push(
      check(
        "EXEC-PERSIST-025",
        "Replay full-chain verification reports zero failures",
        0,
        second.persistence
          .verification
          .fullChain
          .totalFailedChecks,
      ),
    );

    checks.push(
      check(
        "EXEC-PERSIST-026",
        "Full-chain verification covers the current persistent tip",
        latestAfter.entry
          .sequence,
        second.persistence
          .verification
          .fullChain
          .latestSequence,
      ),
    );

    checks.push(
      check(
        "EXEC-PERSIST-027",
        "Ledger sequence continuity remains verified",
        true,
        second.persistence
          .verification
          .fullChain
          .sequenceContinuityVerified,
      ),
    );

    checks.push(
      check(
        "EXEC-PERSIST-028",
        "Previous-hash bindings remain verified",
        true,
        second.persistence
          .verification
          .fullChain
          .previousHashBindingsVerified,
      ),
    );

    checks.push(
      check(
        "EXEC-PERSIST-029",
        "All ledger entries independently cryptographically verify",
        true,
        second.persistence
          .verification
          .fullChain
          .allEntriesCryptographicallyVerified,
      ),
    );

    const failedChecks =
      checks.filter(
        (item) =>
          !item.passed,
      );

    const passedChecks =
      checks.length -
      failedChecks.length;

    const completePass =
      failedChecks.length ===
      0;

    return NextResponse.json(
      {
        ok:
          completePass,

        status:
          completePass
            ? "HBCE_RUNTIME_EXECUTION_PERSISTENCE_SELF_TEST_PASS"
            : "HBCE_RUNTIME_EXECUTION_PERSISTENCE_SELF_TEST_FAIL_CLOSED",

        operationalStatus:
          completePass
            ? "PASS"
            : "FAIL_CLOSED",

        revision:
          REVISION,

        generatedAt,

        execution: {
          mode:
            "RUNTIME_EXECUTION_TO_PERSISTENT_EVIDENCE_CONVERGENCE_PROOF",

          initialSequence,

          finalSequence:
            latestAfter.entry
              .sequence,

          authorizedLogicalOperations:
            1,

          blockedLogicalOperations:
            1,

          persistenceAttempted,
        },

        summary: {
          totalChecks:
            checks.length,

          passedChecks,

          failedChecks:
            failedChecks.length,

          requiredChecks:
            checks.length,

          requiredPassed:
            passedChecks,

          requiredFailed:
            failedChecks.length,
        },

        operation: {
          operationIdPersisted:
            false,

          operationIdSha256,

          sequence:
            first.persistence
              .persistence
              .sequence,

          entrySha256:
            first.persistence
              .append
              .entrySha256,

          evidenceSha256:
            first.persistence
              .evidence
              .sha256,

          opcEvtEnvelopeSha256:
            first.persistence
              .opcEvt
              .envelopeSha256,

          firstCall: {
            inserted:
              first.persistence
                .idempotency
                .inserted,

            replayed:
              first.persistence
                .idempotency
                .replayed,
          },

          replayCall: {
            inserted:
              second.persistence
                .idempotency
                .inserted,

            replayed:
              second.persistence
                .idempotency
                .replayed,
          },
        },

        blockedExecution: {
          operationIdPersisted:
            false,

          operationIdSha256:
            blockedOperationIdSha256,

          errorCode:
            blockedCode,

          errorStage:
            blockedStage,

          runtimeReason:
            blockedReason,

          persistentRows:
            await countRowsByOperationHash(
              blockedOperationIdSha256,
            ),
        },

        verification: {
          fullChain:
            second.persistence
              .verification
              .fullChain,
        },

        checks,

        identity: {
          runtimeIpr:
            RUNTIME_IPR,

          humanAuthorityIpr:
            HUMAN_AUTHORITY_IPR,

          organization:
            ORGANIZATION,

          hermeticumSigil:
            HERMETICUM_SIGIL,

          hermeticumSigilCodepoint:
            HERMETICUM_SIGIL_CODEPOINT,
        },

        governance: {
          failClosed:
            !completePass,

          appendOnly:
            true,

          hashOnlyEvidence:
            true,

          rawOperationIdentifiersPersisted:
            false,

          humanAuthorizationRequired:
            true,

          autonomousAuthorization:
            false,

          runtimeActivation:
            false,

          noSubmitFromCode:
            true,

          legalCertification:
            false,

          qualifiedElectronicSignature:
            false,
        },
      },
      {
        status:
          completePass
            ? 200
            : 503,

        headers: {
          ...commonHeaders(
            completePass
              ? "true"
              : "FAIL_CLOSED",
          ),

          "X-HBCE-Authorization":
            "PERSISTENT_HUMAN_AUTHORIZATION_ACCEPTED",

          "X-HBCE-Convergence":
            completePass
              ? "PASS"
              : "FAIL_CLOSED",

          "X-HBCE-Operation-SHA256":
            operationIdSha256,

          "X-HBCE-Initial-Sequence":
            String(
              initialSequence,
            ),

          "X-HBCE-Final-Sequence":
            String(
              latestAfter.entry
                .sequence,
            ),
        },
      },
    );
  } catch (error) {
    const authorizationError =
      error instanceof
      RuntimePersistentHumanAuthorizationError;

    const orchestrationError =
      error instanceof
      RuntimeExecutionPersistenceError;

    const persistenceError =
      error instanceof
      RuntimeOperationsPersistentAppendError;

    const authorizationInfrastructureFailure =
      authorizationError &&
      (
        error.code ===
          "HBCE_RUNTIME_AUTH_DATABASE_NOT_CONFIGURED" ||
        error.code ===
          "HBCE_RUNTIME_AUTH_CANONICAL_SUBJECT_NOT_CONFIGURED" ||
        error.code ===
          "HBCE_RUNTIME_AUTH_SESSION_DATABASE_QUERY_FAILED" ||
        error.code ===
          "HBCE_RUNTIME_AUTH_PROFILE_DATABASE_QUERY_FAILED"
      );

    const authorizationUnauthenticated =
      authorizationError &&
      (
        error.code ===
          "HBCE_RUNTIME_AUTH_SESSION_TOKEN_REQUIRED" ||
        error.code ===
          "HBCE_RUNTIME_AUTH_SESSION_NOT_FOUND" ||
        error.code ===
          "HBCE_RUNTIME_AUTH_SESSION_NOT_ACTIVE" ||
        error.code ===
          "HBCE_RUNTIME_AUTH_SESSION_REVOKED" ||
        error.code ===
          "HBCE_RUNTIME_AUTH_SESSION_EXPIRED"
      );

    const responseStatus =
      authorizationInfrastructureFailure
        ? 500
        : authorizationUnauthenticated
          ? 401
          : authorizationError
            ? 403
            : 500;

    return NextResponse.json(
      {
        ok: false,

        status:
          "HBCE_RUNTIME_EXECUTION_PERSISTENCE_SELF_TEST_FAIL_CLOSED",

        operationalStatus:
          "FAIL_CLOSED",

        revision:
          REVISION,

        generatedAt,

        error: {
          name:
            error instanceof Error
              ? error.name
              : "UnknownError",

          message:
            error instanceof Error
              ? error.message
              : String(
                  error,
                ),

          code:
            authorizationError
              ? error.code
              : orchestrationError
                ? error.code
                : persistenceError
                  ? error.code
                  : "HBCE_RUNTIME_EXECUTION_PERSISTENCE_SELF_TEST_UNEXPECTED_FAILURE",

          stage:
            authorizationError
              ? error.stage
              : orchestrationError
                ? error.stage
                : persistenceError
                  ? error.stage
                  : "UNKNOWN",
        },

        persistence: {
          attempted:
            persistenceError
              ? error.persistenceAttempted
              : persistenceAttempted,

          confirmed:
            persistenceError
              ? error.persistenceConfirmed
              : false,

          persistedSequence:
            persistenceError
              ? error.persistedSequence
              : null,
        },

        partialChecks:
          checks,

        governance: {
          failClosed:
            true,

          humanAuthorizationRequired:
            true,

          autonomousAuthorization:
            false,

          runtimeActivation:
            false,

          noSubmitFromCode:
            true,

          legalCertification:
            false,

          qualifiedElectronicSignature:
            false,
        },
      },
      {
        status:
          responseStatus,

        headers: {
          ...commonHeaders(
            authorizationError
              ? "false"
              : "FAIL_CLOSED",
          ),

          "X-HBCE-Authorization":
            persistentHumanAuthorizationAccepted
              ? "PERSISTENT_HUMAN_AUTHORIZATION_ACCEPTED"
              : "PERSISTENT_HUMAN_AUTHORIZATION_REJECTED",

          "X-HBCE-Convergence":
            "FAIL_CLOSED",
        },
      },
    );
  }
}



