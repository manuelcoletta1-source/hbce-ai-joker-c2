import { NextRequest, NextResponse } from "next/server";

import {
  appendRuntimeOperationsPersistentEvidence,
  RuntimeOperationsPersistentAppendError,
} from "@/src/runtime/operations/runtime-operations-persistent-append.service";

import {
  getLatestRuntimeOperationsLedgerEntry,
} from "@/src/runtime/operations/runtime-operations-ledger-repository";

import type {
  RuntimeOperationsEvidenceInput,
} from "@/src/runtime/operations/runtime-operations-evidence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REVISION =
  "HBCE-RUNTIME-OPERATIONS-GENERAL-PERSISTENT-APPEND-SELF-TEST-v1_0" as const;

const REQUIRED_START_SEQUENCE =
  2 as const;

const REQUIRED_FINAL_SEQUENCE =
  3 as const;

const MANUAL_AUTHORIZATION_HEADER =
  "x-hbce-ledger-self-test-token" as const;

const HERMETICUM_SIGIL =
  "🜏" as const;

const HERMETICUM_SIGIL_CODEPOINT =
  "U+1F70F" as const;

function commonHeaders() {
  return {
    "Cache-Control":
      "no-store, no-cache, must-revalidate",

    "X-HBCE-Revision":
      REVISION,

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

function unauthorized(
  reason: string,
) {
  return NextResponse.json(
    {
      ok: false,

      status:
        "HBCE_RUNTIME_OPERATIONS_GENERAL_PERSISTENT_APPEND_SELF_TEST_UNAUTHORIZED",

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
        ...commonHeaders(),

        "X-HBCE-Authorization":
          "REJECTED",
      },
    },
  );
}

function preconditionFailClosed(
  generatedAt: string,
  reason: string,
  details?: unknown,
) {
  return NextResponse.json(
    {
      ok: false,

      status:
        "HBCE_RUNTIME_OPERATIONS_GENERAL_PERSISTENT_APPEND_SELF_TEST_PRECONDITION_FAIL_CLOSED",

      operationalStatus:
        "FAIL_CLOSED",

      revision:
        REVISION,

      generatedAt,

      reason,

      details:
        details ?? null,

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
        409,

      headers: {
        ...commonHeaders(),

        "X-HBCE-Authorization":
          "MANUAL_AUTHORIZATION_ACCEPTED",

        "X-HBCE-Append-State":
          "PRECONDITION_FAIL_CLOSED",
      },
    },
  );
}

function buildSequence3SourceInput(input: {
  generatedAt: string;

  previousSequence: number;

  previousEntrySha256: string;

  previousChainRootSha256: string;
}): RuntimeOperationsEvidenceInput {
  return {
    ok: true,

    status:
      "HBCE_RUNTIME_OPERATIONS_GENERAL_PERSISTENT_APPEND_SOURCE_PASS",

    operationalStatus:
      "PASS",

    revision:
      REVISION,

    generatedAt:
      input.generatedAt,

    product:
      "HBCE IPR Operational Identity & Proof Layer",

    runtime:
      "AI_JOKER_C2_SAAS_CORE_v0_1",

    execution: {
      mode:
        "MANUALLY_AUTHORIZED_GENERAL_PERSISTENT_APPEND_SERVICE_SEQUENCE_3_PROOF",

      persistence:
        true,

      externalEffects:
        true,

      runtimeActivation:
        false,

      autonomousExecution:
        false,

      submission:
        false,

      service:
        "appendRuntimeOperationsPersistentEvidence",

      expectedTransition: {
        fromSequence:
          input.previousSequence,

        toSequence:
          REQUIRED_FINAL_SEQUENCE,

        previousEntrySha256:
          input.previousEntrySha256,

        previousChainRootSha256:
          input.previousChainRootSha256,
      },
    },

    summary: {
      totalChecks:
        1,

      passedChecks:
        1,

      failedChecks:
        0,

      requiredChecks:
        1,

      requiredPassed:
        1,

      requiredFailed:
        0,
    },

    checks: [
      {
        id:
          "GENERAL-APPEND-SOURCE-001",

        description:
          "General persistent append service Sequence 3 source is manually authorized and canonical",

        passed:
          true,

        expected:
          "SEQUENCE_2_TO_SEQUENCE_3",

        actual:
          "SEQUENCE_2_TO_SEQUENCE_3",
      },
    ],

    governance: {
      humanAuthorizationRequired:
        true,

      autonomousAuthorization:
        false,

      runtimeActivationFromSelfTest:
        false,

      noSubmitFromCode:
        true,

      failClosed:
        false,

      legalCertification:
        false,
    },
  };
}

export async function GET() {
  try {
    const latest =
      await getLatestRuntimeOperationsLedgerEntry();

    const observedLatestSequence =
      latest?.entry
        .sequence ?? null;

    const eligible =
      observedLatestSequence ===
      REQUIRED_START_SEQUENCE;

    const completed =
      observedLatestSequence !== null &&
      observedLatestSequence >=
        REQUIRED_FINAL_SEQUENCE;

    const appendState =
      completed
        ? "COMPLETE"
        : eligible
          ? "ELIGIBLE"
          : "PRECONDITION_NOT_MET";

    const status =
      completed
        ? "HBCE_RUNTIME_OPERATIONS_GENERAL_PERSISTENT_APPEND_SELF_TEST_COMPLETE"
        : eligible
          ? "HBCE_RUNTIME_OPERATIONS_GENERAL_PERSISTENT_APPEND_SELF_TEST_READY"
          : "HBCE_RUNTIME_OPERATIONS_GENERAL_PERSISTENT_APPEND_SELF_TEST_PRECONDITION_FAIL_CLOSED";

    const operationalStatus =
      completed
        ? "PASS"
        : eligible
          ? "READY"
          : "FAIL_CLOSED";

    return NextResponse.json(
      {
        ok:
          completed ||
          eligible,

        status,

        operationalStatus,

        revision:
          REVISION,

        method:
          "POST",

        readOnly:
          true,

        sideEffects:
          false,

        message:
          completed
            ? "Sequence 3 or a later sequence already exists. This one-shot general persistent append proof is complete."
            : eligible
              ? "POST performs exactly one manually authorized append through the general persistent append service."
              : "The general persistent append Sequence 3 proof requires the current ledger tip to be sequence 2.",

        appendState,

        precondition: {
          requiredCurrentSequence:
            REQUIRED_START_SEQUENCE,

          requiredResultSequence:
            REQUIRED_FINAL_SEQUENCE,

          observedLatestSequence,

          observedLatestEntrySha256:
            latest?.entry
              .chain
              .entrySha256 ?? null,

          eligible,

          completed,
        },

        service: {
          function:
            "appendRuntimeOperationsPersistentEvidence",

          routeImplementsPersistence:
            false,

          serviceImplementsPersistence:
            true,
        },

        requirements: {
          environmentVariable:
            "HBCE_LEDGER_SELF_TEST_TOKEN",

          requestHeader:
            MANUAL_AUTHORIZATION_HEADER,

          minimumTokenLength:
            16,

          authorizationRequiredOnlyWhenEligible:
            true,
        },

        identity: {
          runtimeIpr:
            "IPR-AI-0001",

          humanAuthorityIpr:
            "IPR-3",

          organization:
            "HERMETICUM B.C.E. S.r.l.",

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
          completed ||
          eligible
            ? 200
            : 409,

        headers: {
          ...commonHeaders(),

          "X-HBCE-Authorization":
            eligible
              ? "HUMAN_AUTHORIZATION_REQUIRED"
              : completed
                ? "NOT_REQUIRED_APPEND_PROOF_COMPLETE"
                : "PRECONDITION_NOT_MET",

          "X-HBCE-Append-State":
            appendState,
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,

        status:
          "HBCE_RUNTIME_OPERATIONS_GENERAL_PERSISTENT_APPEND_SELF_TEST_READ_FAIL_CLOSED",

        operationalStatus:
          "FAIL_CLOSED",

        revision:
          REVISION,

        readOnly:
          true,

        sideEffects:
          false,

        error: {
          name:
            error instanceof Error
              ? error.name
              : "UnknownError",

          message:
            error instanceof Error
              ? error.message
              : String(error),
        },

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
          500,

        headers: {
          ...commonHeaders(),

          "X-HBCE-Authorization":
            "NOT_EVALUATED",

          "X-HBCE-Append-State":
            "FAIL_CLOSED",
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
      "Manual persistent append authorization token is invalid.",
    );
  }

  const generatedAt =
    new Date().toISOString();

  try {
    /*
     * Route-level one-shot precondition.
     *
     * This self-test is only for proving that the general service can
     * advance the already verified persistent ledger from Sequence 2
     * to Sequence 3.
     */
    const latestBefore =
      await getLatestRuntimeOperationsLedgerEntry();

    if (!latestBefore) {
      return preconditionFailClosed(
        generatedAt,
        "Persistent ledger is empty. Sequence 2 must exist before this proof.",
      );
    }

    if (
      latestBefore.entry
        .sequence !==
      REQUIRED_START_SEQUENCE
    ) {
      return preconditionFailClosed(
        generatedAt,
        "This one-shot proof requires the current persistent tip to be exactly sequence 2.",
        {
          requiredCurrentSequence:
            REQUIRED_START_SEQUENCE,

          observedCurrentSequence:
            latestBefore.entry
              .sequence,

          persistenceExecuted:
            false,

          completed:
            latestBefore.entry
              .sequence >=
            REQUIRED_FINAL_SEQUENCE,

          instruction:
            "Do not retry POST after Sequence 3 already exists.",
        },
      );
    }

    const sourceInput =
      buildSequence3SourceInput({
        generatedAt,

        previousSequence:
          latestBefore.entry
            .sequence,

        previousEntrySha256:
          latestBefore.entry
            .chain
            .entrySha256,

        previousChainRootSha256:
          latestBefore.entry
            .chain
            .chainRootSha256,
      });

    /*
     * The HTTP token is validated here and never passed to the service.
     * The service receives only a non-secret authorization reference.
     */
    const authorizationRef =
      `HBCE-MANUAL-AUTH-GENERAL-APPEND-${generatedAt}`;

    const result =
      await appendRuntimeOperationsPersistentEvidence({
        sourceInput,

        authorization: {
          humanAuthorized:
            true,

          authorizationRef,

          runtimeIpr:
            "IPR-AI-0001",

          humanAuthorityIpr:
            "IPR-3",

          organization:
            "HERMETICUM B.C.E. S.r.l.",
        },

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
            500,

          maximumEntries:
            10_000,
        },
      });

    const sequence3Created =
      result.persistence
        .sequence ===
      REQUIRED_FINAL_SEQUENCE;

    const fullChainPassed =
      result.verification
        .fullChain
        .verified ===
      true;

    const completePass =
      sequence3Created &&
      result.ok === true &&
      result.operationalStatus ===
        "PASS" &&
      result.persistence
        .confirmed ===
        true &&
      result.verification
        .rereadMatched ===
        true &&
      result.verification
        .appendedEntryVerified ===
        true &&
      fullChainPassed;

    return NextResponse.json(
      {
        ok:
          completePass,

        status:
          completePass
            ? "HBCE_RUNTIME_OPERATIONS_GENERAL_PERSISTENT_APPEND_SELF_TEST_PASS"
            : "HBCE_RUNTIME_OPERATIONS_GENERAL_PERSISTENT_APPEND_SELF_TEST_FAIL_CLOSED",

        operationalStatus:
          completePass
            ? "PASS"
            : "FAIL_CLOSED",

        revision:
          REVISION,

        generatedAt,

        product:
          "HBCE IPR Operational Identity & Proof Layer",

        runtime:
          "AI_JOKER_C2_SAAS_CORE_v0_1",

        service: {
          function:
            "appendRuntimeOperationsPersistentEvidence",

          serviceRevision:
            result.revision,

          routeImplementsPersistence:
            false,

          serviceImplementsPersistence:
            true,
        },

        transition: {
          fromSequence:
            REQUIRED_START_SEQUENCE,

          toSequence:
            result.persistence
              .sequence,

          expectedToSequence:
            REQUIRED_FINAL_SEQUENCE,

          previousEntrySha256:
            result.append
              .previousEntrySha256,

          entrySha256:
            result.append
              .entrySha256,

          chainRootSha256:
            result.append
              .chainRootSha256,

          linkedToRepositoryTipAtAppend:
            result.append
              .linkedToRepositoryTipAtAppend,

          concurrentTipAdvanceObserved:
            result.append
              .concurrentTipAdvanceObserved,
        },

        evidence:
          result.evidence,

        opcEvt:
          result.opcEvt,

        persistence:
          result.persistence,

        verification:
          result.verification,

        identity:
          result.identity,

        authorization: {
          humanAuthorized:
            result.authorization
              .humanAuthorized,

          authorizationRef:
            result.authorization
              .authorizationRef,

          rawCredentialPersisted:
            result.authorization
              .rawCredentialPersisted,
        },

        governance:
          result.governance,
      },
      {
        status:
          completePass
            ? 200
            : 500,

        headers: {
          ...commonHeaders(),

          "X-HBCE-Authorization":
            "MANUAL_AUTHORIZATION_ACCEPTED",

          "X-HBCE-Append-State":
            completePass
              ? "SEQUENCE_2_TO_3_PASS"
              : "FAIL_CLOSED",

          "X-HBCE-Persistence-Sequence":
            String(
              result.persistence
                .sequence,
            ),

          "X-HBCE-Ledger-Entry-SHA256":
            result.append
              .entrySha256,

          "X-HBCE-Previous-Entry-SHA256":
            result.append
              .previousEntrySha256 ?? "",

          "X-HBCE-Chain-Root-SHA256":
            result.append
              .chainRootSha256,
        },
      },
    );
  } catch (error) {
    const structured =
      error instanceof
      RuntimeOperationsPersistentAppendError;

    const persistenceAttempted =
      structured
        ? error.persistenceAttempted
        : false;

    const persistenceConfirmed =
      structured
        ? error.persistenceConfirmed
        : false;

    const persistedSequence =
      structured
        ? error.persistedSequence
        : null;

    return NextResponse.json(
      {
        ok: false,

        status:
          "HBCE_RUNTIME_OPERATIONS_GENERAL_PERSISTENT_APPEND_SELF_TEST_FAIL_CLOSED",

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
              : String(error),

          code:
            structured
              ? error.code
              : "HBCE_RUNTIME_OPERATIONS_GENERAL_PERSISTENT_APPEND_SELF_TEST_UNEXPECTED_FAILURE",

          stage:
            structured
              ? error.stage
              : "UNKNOWN",
        },

        persistence: {
          attempted:
            persistenceAttempted,

          confirmed:
            persistenceConfirmed,

          persistedSequence,

          persistenceMayHaveOccurred:
            persistenceAttempted &&
            !persistenceConfirmed,
        },

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
          500,

        headers: {
          ...commonHeaders(),

          "X-HBCE-Authorization":
            "MANUAL_AUTHORIZATION_ACCEPTED",

          "X-HBCE-Append-State":
            "FAIL_CLOSED",
        },
      },
    );
  }
}
