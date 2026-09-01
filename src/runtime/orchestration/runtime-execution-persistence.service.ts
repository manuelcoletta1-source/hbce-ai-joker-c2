/**
 * AI JOKER-C2
 * Runtime Execution Persistence Orchestrator
 * HERMETICUM B.C.E.
 *
 * Converges the pure runtime execution path with the persistent,
 * idempotent HBCE Evidence / OPC / append-only ledger pipeline.
 *
 * The runtime engine remains pure.
 * Persistence is performed only after a successful, non-fail-closed
 * runtime execution and explicit human authorization.
 */

import {
  bootstrapRuntime,
  type RuntimeBootstrapInput,
} from "@/lib/runtime/bootstrap";

import type {
  RuntimeExecution,
} from "@/lib/runtime/runtime-engine";

import type {
  RuntimeOperationsEvidenceInput,
} from "@/src/runtime/operations/runtime-operations-evidence";

import {
  appendRuntimeOperationsPersistentEvidence,
  type RuntimeOperationsPersistentAppendAuthorization,
  type RuntimeOperationsPersistentAppendResult,
  type RuntimeOperationsPersistentAppendExpectedTip,
} from "@/src/runtime/operations/runtime-operations-persistent-append.service";

import {
  buildPlatformCoreCanonicalAuthorization,
  type PlatformCoreCanonicalAuthorizationInput,
} from "@/src/runtime/platform-core/canonical-authorization-builder";

import {
  buildPlatformCoreCanonicalExecutionGenesis,
  type PlatformCoreCanonicalExecutionGenesisInput,
} from "@/src/runtime/platform-core/canonical-execution-genesis-builder";

export const RUNTIME_EXECUTION_PERSISTENCE_SERVICE_REVISION =
  "HBCE-RUNTIME-EXECUTION-PERSISTENCE-SERVICE-v1_0" as const;

const PRODUCT =
  "HBCE IPR Operational Identity & Proof Layer" as const;

const RUNTIME =
  "AI_JOKER_C2_SAAS_CORE_v0_1" as const;

export type RuntimeExecutionPersistenceRequest = {
  /**
   * Stable logical operation identifier.
   *
   * Required at this orchestration boundary.
   * The raw identifier is never persisted by the persistent append service.
   */
  operationId: string;

  /**
   * Existing deterministic runtime input.
   */
  runtimeInput: RuntimeBootstrapInput;

  /**
   * Human authorization must already have been resolved by the caller.
   * No raw authorization credentials are accepted here.
   */
  authorization: RuntimeOperationsPersistentAppendAuthorization;

  /**
   * Explicit Platform Core canonical authorization source envelope.
   *
   * This is a distinct control from the legacy human persistence gate.
   * No canonical field is derived from the legacy authorization object.
   */
  canonicalAuthorizationSource:
    PlatformCoreCanonicalAuthorizationInput;

  /**
   * Explicit Platform Core canonical EXECUTION genesis source envelope.
   *
   * Authorization identity and binding commitments are taken only from
   * the retained canonical AUTHORIZATION object.
   */
  canonicalExecutionGenesisSource:
    PlatformCoreCanonicalExecutionGenesisInput;

  /**
   * Optional optimistic ledger-tip precondition.
   */
  expectedTip?: RuntimeOperationsPersistentAppendExpectedTip;

  verification?: {
    pageSize?: number;
    maximumEntries?: number;
  };
};

export type RuntimeExecutionPersistenceResult = {
  ok: true;

  status:
    "HBCE_RUNTIME_EXECUTION_PERSISTENCE_PASS";

  operationalStatus:
    "PASS";

  revision:
    typeof RUNTIME_EXECUTION_PERSISTENCE_SERVICE_REVISION;

  generatedAt:
    string;

  runtimeExecution:
    RuntimeExecution;

  persistence:
    RuntimeOperationsPersistentAppendResult;
};

export class RuntimeExecutionPersistenceError extends Error {
  readonly code:
    string;

  readonly stage:
    "INPUT" | "RUNTIME_EXECUTION";

  readonly runtimeExecution:
    RuntimeExecution | null;

  constructor(params: {
    code: string;
    stage: "INPUT" | "RUNTIME_EXECUTION";
    message: string;
    runtimeExecution?: RuntimeExecution | null;
  }) {
    super(params.message);

    this.name =
      "RuntimeExecutionPersistenceError";

    this.code =
      params.code;

    this.stage =
      params.stage;

    this.runtimeExecution =
      params.runtimeExecution ?? null;
  }
}

function assertOperationId(
  operationId: string,
): void {
  if (
    typeof operationId !== "string" ||
    operationId.length === 0 ||
    operationId.trim() !== operationId
  ) {
    throw new RuntimeExecutionPersistenceError({
      code:
        "HBCE_RUNTIME_EXECUTION_PERSISTENCE_INVALID_OPERATION_ID",

      stage:
        "INPUT",

      message:
        "operationId must be a non-empty stable identifier without leading or trailing whitespace.",
    });
  }
}

function assertRuntimeExecutionPass(
  execution: RuntimeExecution,
): void {
  if (
    execution.failClosed === true ||
    execution.authorized !== true ||
    execution.interpretationGenerated !== true ||
    execution.reason !== "SUCCESS"
  ) {
    throw new RuntimeExecutionPersistenceError({
      code:
        "HBCE_RUNTIME_EXECUTION_PERSISTENCE_RUNTIME_NOT_PASS",

      stage:
        "RUNTIME_EXECUTION",

      message:
        "Only successful non-fail-closed runtime executions may enter the persistent evidence pipeline.",

      runtimeExecution:
        execution,
    });
  }
}

function buildRuntimeExecutionEvidenceInput(params: {
  runtimeInput: RuntimeBootstrapInput;
  execution: RuntimeExecution;
  generatedAt: string;
}): RuntimeOperationsEvidenceInput {
  const {
    runtimeInput,
    execution,
    generatedAt,
  } = params;

  const checks: RuntimeOperationsEvidenceInput["checks"] = [
    {
      id:
        "RUNTIME-EXEC-001",

      description:
        "Mission and claim evaluation produced an authorized runtime execution",

      passed:
        execution.authorized === true,

      expected:
        true,

      actual:
        execution.authorized,
    },

    {
      id:
        "RUNTIME-EXEC-002",

      description:
        "Runtime execution generated a valid SRSC interpretation",

      passed:
        execution.interpretationGenerated === true,

      expected:
        true,

      actual:
        execution.interpretationGenerated,
    },

    {
      id:
        "RUNTIME-EXEC-003",

      description:
        "Runtime execution remained outside fail-closed state",

      passed:
        execution.failClosed === false,

      expected:
        false,

      actual:
        execution.failClosed,
    },

    {
      id:
        "RUNTIME-EXEC-004",

      description:
        "Runtime execution completed with SUCCESS reason",

      passed:
        execution.reason === "SUCCESS",

      expected:
        "SUCCESS",

      actual:
        execution.reason,
    },
  ];

  const passedChecks =
    checks.filter(
      (check) =>
        check.passed,
    ).length;

  const failedChecks =
    checks.length -
    passedChecks;

  return {
    ok:
      failedChecks === 0,

    status:
      "HBCE_RUNTIME_EXECUTION_PASS",

    operationalStatus:
      "PASS",

    revision:
      RUNTIME_EXECUTION_PERSISTENCE_SERVICE_REVISION,

    generatedAt,

    product:
      PRODUCT,

    runtime:
      RUNTIME,

    execution: {
      missionId:
        runtimeInput.mission.missionId,

      iprSubject:
        runtimeInput.mission.iprSubject,

      authorized:
        execution.authorized,

      evaluationScore:
        execution.evaluationScore,

      interpretationGenerated:
        execution.interpretationGenerated,

      failClosed:
        execution.failClosed,

      reason:
        execution.reason,
    },

    summary: {
      totalChecks:
        checks.length,

      passedChecks,

      failedChecks,

      requiredChecks:
        checks.length,

      requiredPassed:
        passedChecks,

      requiredFailed:
        failedChecks,
    },

    checks,

    governance: {
      humanAuthorizationRequired:
        true,

      autonomousAuthorization:
        false,

      runtimeActivationFromSelfTest:
        false,

      noSubmitFromCode:
        true,

      legalCertification:
        false,

      appendOnly:
        true,

      hashOnlyEvidence:
        true,
    },
  };
}

export async function executeRuntimeAndPersist(
  request:
    RuntimeExecutionPersistenceRequest,
): Promise<
  RuntimeExecutionPersistenceResult
> {
  assertOperationId(
    request.operationId,
  );

  /*
   * Build and statically validate the canonical AUTHORIZATION before
   * entering the runtime execution boundary.
   *
   * During this migration step the resulting canonical object remains
   * internal to this orchestration boundary:
   *
   * - it is not derived from the legacy human authorization;
   * - it is not exposed in the orchestration result;
   * - it is not yet consumed;
   * - it is not yet bound to a canonical EXECUTION object.
   */
  const canonicalAuthorization =
    buildPlatformCoreCanonicalAuthorization(
      request.canonicalAuthorizationSource,
    );

  /*
   * Build and retain the immutable PENDING/v1 canonical EXECUTION
   * genesis before entering the legacy runtime boundary.
   *
   * execution_id remains explicitly caller supplied and is not derived
   * from operationId, mission identifiers, legacy runtime output or
   * persistent human authorization.
   *
   * No authorization consumption occurs during this migration step.
   */
  const canonicalExecutionGenesis =
    buildPlatformCoreCanonicalExecutionGenesis(
      request.canonicalExecutionGenesisSource,
      canonicalAuthorization,
    );

  void canonicalExecutionGenesis;

  /*
   * Runtime execution remains synchronous and pure.
   * No persistence is attempted before this boundary succeeds.
   */
  const runtimeExecution =
    bootstrapRuntime(
      request.runtimeInput,
    );

  assertRuntimeExecutionPass(
    runtimeExecution,
  );

  const generatedAt =
    new Date().toISOString();

  const sourceInput =
    buildRuntimeExecutionEvidenceInput({
      runtimeInput:
        request.runtimeInput,

      execution:
        runtimeExecution,

      generatedAt,
    });

  /*
   * The persistent service owns:
   *
   * - human authorization invariant verification
   * - operation-id hashing
   * - idempotent replay
   * - optimistic tip verification
   * - Evidence construction
   * - OPC/EVT construction and verification
   * - append-only persistence
   * - reread verification
   * - full-chain verification
   */
  const persistence =
    await appendRuntimeOperationsPersistentEvidence({
      sourceInput,

      authorization:
        request.authorization,

      operationId:
        request.operationId,

      expectedTip:
        request.expectedTip,

      verification:
        request.verification,
    });

  return {
    ok:
      true,

    status:
      "HBCE_RUNTIME_EXECUTION_PERSISTENCE_PASS",

    operationalStatus:
      "PASS",

    revision:
      RUNTIME_EXECUTION_PERSISTENCE_SERVICE_REVISION,

    generatedAt,

    runtimeExecution,

    persistence,
  };
}

