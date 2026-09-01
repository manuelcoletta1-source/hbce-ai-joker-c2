import type {
  PlatformCoreCanonicalAuthorization,
} from "./canonical-authorization-builder";

import type {
  PlatformCoreCanonicalExecutionGenesis,
} from "./canonical-execution-genesis-builder";

import type {
  PlatformCoreAuthorizationConsumptionInput,
} from "./authorization-consumption-repository";

export const PLATFORM_CORE_CANONICAL_AUTHORIZATION_CONSUMPTION_ADAPTER_PROTOCOL =
  "HBCE-PLATFORM-CORE-CANONICAL-AUTHORIZATION-CONSUMPTION-ADAPTER-v1" as const;

export type PlatformCoreCanonicalAuthorizationConsumptionAdapterErrorCode =
  | "AUTHORIZATION_NOT_EXECUTABLE"
  | "AUTHORIZATION_VERSION_INVALID"
  | "EXECUTION_GENESIS_INVALID"
  | "PRECHECK_NOT_EXECUTABLE"
  | "BINDING_MISMATCH"
  | "CONSUMPTION_STATE_INVALID"
  | "GENESIS_GENEALOGY_INVALID";

export class PlatformCoreCanonicalAuthorizationConsumptionAdapterError
  extends Error {
  readonly code:
    PlatformCoreCanonicalAuthorizationConsumptionAdapterErrorCode;

  constructor(
    code:
      PlatformCoreCanonicalAuthorizationConsumptionAdapterErrorCode,
    message: string,
  ) {
    super(message);

    this.name =
      "PlatformCoreCanonicalAuthorizationConsumptionAdapterError";

    this.code =
      code;
  }
}

function failClosed(
  code:
    PlatformCoreCanonicalAuthorizationConsumptionAdapterErrorCode,
  message: string,
): never {
  throw new PlatformCoreCanonicalAuthorizationConsumptionAdapterError(
    code,
    message,
  );
}

function requireCondition(
  condition: boolean,
  code:
    PlatformCoreCanonicalAuthorizationConsumptionAdapterErrorCode,
  message: string,
): void {
  if (!condition) {
    failClosed(
      code,
      message,
    );
  }
}

/**
 * Pure adapter from already-built canonical AUTHORIZATION and canonical
 * EXECUTION PENDING/v1 objects to the exact repository consumption input.
 *
 * This function performs no persistence and creates no consumption
 * evidence. All gates are evaluated before an input object is returned.
 */
export function buildPlatformCoreCanonicalAuthorizationConsumptionInput(
  canonicalAuthorization:
    PlatformCoreCanonicalAuthorization,
  canonicalExecutionGenesis:
    PlatformCoreCanonicalExecutionGenesis,
): PlatformCoreAuthorizationConsumptionInput {
  requireCondition(
    canonicalAuthorization.state
      === "AUTHORIZED",
    "AUTHORIZATION_NOT_EXECUTABLE",
    "Canonical AUTHORIZATION state must be AUTHORIZED.",
  );

  requireCondition(
    canonicalAuthorization
      .replay_guard
      .requires_atomic_consumption
      === true,
    "AUTHORIZATION_NOT_EXECUTABLE",
    "Canonical AUTHORIZATION must require atomic consumption.",
  );

  requireCondition(
    Number.isSafeInteger(
      canonicalAuthorization.authorization_version,
    )
      && canonicalAuthorization.authorization_version >= 1,
    "AUTHORIZATION_VERSION_INVALID",
    "Canonical AUTHORIZATION version must be a positive safe integer.",
  );

  requireCondition(
    canonicalExecutionGenesis.execution_version
      === 1,
    "EXECUTION_GENESIS_INVALID",
    "Canonical EXECUTION genesis version must equal 1.",
  );

  requireCondition(
    canonicalExecutionGenesis.state
      === "PENDING",
    "EXECUTION_GENESIS_INVALID",
    "Canonical EXECUTION genesis state must be PENDING.",
  );

  requireCondition(
    canonicalExecutionGenesis
      .precheck
      .authorization_state_observed
      === "AUTHORIZED",
    "PRECHECK_NOT_EXECUTABLE",
    "Execution precheck must observe AUTHORIZED.",
  );

  requireCondition(
    canonicalExecutionGenesis
      .precheck
      .validity_state
      === "VALID",
    "PRECHECK_NOT_EXECUTABLE",
    "Execution precheck validity must be VALID.",
  );

  requireCondition(
    canonicalExecutionGenesis
      .precheck
      .authority_usability_state
      === "PASS",
    "PRECHECK_NOT_EXECUTABLE",
    "Execution authority-usability precheck must PASS.",
  );

  requireCondition(
    canonicalExecutionGenesis
      .precheck
      .dependency_binding_state
      === "PASS",
    "PRECHECK_NOT_EXECUTABLE",
    "Execution dependency-binding precheck must PASS.",
  );

  requireCondition(
    canonicalExecutionGenesis
      .precheck
      .iospace_binding_state
      === "PASS",
    "PRECHECK_NOT_EXECUTABLE",
    "Execution IOSPACE-binding precheck must PASS.",
  );

  requireCondition(
    canonicalExecutionGenesis
      .precheck
      .enforcement_point_binding_state
      === "PASS",
    "PRECHECK_NOT_EXECUTABLE",
    "Execution enforcement-point precheck must PASS.",
  );

  requireCondition(
    canonicalExecutionGenesis
      .precheck
      .replay_state
      === "AVAILABLE",
    "PRECHECK_NOT_EXECUTABLE",
    "Execution replay precheck must be AVAILABLE.",
  );

  requireCondition(
    canonicalExecutionGenesis
      .precheck
      .decision
      === "ALLOW_EXECUTION",
    "PRECHECK_NOT_EXECUTABLE",
    "Execution precheck decision must ALLOW_EXECUTION.",
  );

  requireCondition(
    canonicalExecutionGenesis
      .binding_check
      .action_match_state
      === "MATCH",
    "BINDING_MISMATCH",
    "Execution action binding must MATCH.",
  );

  requireCondition(
    canonicalExecutionGenesis
      .binding_check
      .request_match_state
      === "MATCH",
    "BINDING_MISMATCH",
    "Execution request binding must MATCH.",
  );

  requireCondition(
    canonicalExecutionGenesis.principal_ref
      === canonicalAuthorization.principal_ref,
    "BINDING_MISMATCH",
    "Execution principal does not match AUTHORIZATION.",
  );

  requireCondition(
    canonicalExecutionGenesis.actor_ref
      === canonicalAuthorization.actor_ref,
    "BINDING_MISMATCH",
    "Execution actor does not match AUTHORIZATION.",
  );

  requireCondition(
    canonicalExecutionGenesis.authorization_ref
      === canonicalAuthorization.authorization_id,
    "BINDING_MISMATCH",
    "Execution authorization reference does not match.",
  );

  requireCondition(
    canonicalExecutionGenesis.authorization_version
      === canonicalAuthorization.authorization_version,
    "BINDING_MISMATCH",
    "Execution authorization version does not match.",
  );

  requireCondition(
    canonicalExecutionGenesis.authorization_sha256
      === canonicalAuthorization.payload_sha256,
    "BINDING_MISMATCH",
    "Execution authorization hash does not match.",
  );

  requireCondition(
    canonicalExecutionGenesis.iospace_ref
      === canonicalAuthorization.iospace_ref,
    "BINDING_MISMATCH",
    "Execution IOSPACE does not match AUTHORIZATION.",
  );

  requireCondition(
    canonicalExecutionGenesis.enforcement_point_ref
      === canonicalAuthorization.enforcement_point_ref,
    "BINDING_MISMATCH",
    "Execution enforcement point does not match AUTHORIZATION.",
  );

  requireCondition(
    canonicalExecutionGenesis
      .binding_check
      .action_class
      === canonicalAuthorization
        .action_binding
        .action_class,
    "BINDING_MISMATCH",
    "Execution action class does not match AUTHORIZATION.",
  );

  requireCondition(
    canonicalExecutionGenesis
      .binding_check
      .target_ref
      === canonicalAuthorization
        .action_binding
        .target_ref,
    "BINDING_MISMATCH",
    "Execution target does not match AUTHORIZATION.",
  );

  requireCondition(
    canonicalExecutionGenesis
      .binding_check
      .authorization_action_sha256
      === canonicalAuthorization
        .action_binding
        .action_sha256,
    "BINDING_MISMATCH",
    "Execution authorization action commitment does not match.",
  );

  requireCondition(
    canonicalExecutionGenesis
      .binding_check
      .execution_action_sha256
      === canonicalAuthorization
        .action_binding
        .action_sha256,
    "BINDING_MISMATCH",
    "Execution action commitment does not match AUTHORIZATION.",
  );

  requireCondition(
    canonicalExecutionGenesis
      .binding_check
      .authorization_request_sha256
      === canonicalAuthorization
        .action_binding
        .request_sha256,
    "BINDING_MISMATCH",
    "Execution authorization request commitment does not match.",
  );

  requireCondition(
    canonicalExecutionGenesis
      .binding_check
      .execution_request_sha256
      === canonicalAuthorization
        .action_binding
        .request_sha256,
    "BINDING_MISMATCH",
    "Execution request commitment does not match AUTHORIZATION.",
  );

  requireCondition(
    canonicalExecutionGenesis
      .authorization_consumption
      .state
      === "NOT_CONSUMED",
    "CONSUMPTION_STATE_INVALID",
    "Execution authorization consumption state must be NOT_CONSUMED.",
  );

  requireCondition(
    canonicalExecutionGenesis
      .authorization_consumption
      .replay_key_sha256
      === canonicalAuthorization
        .replay_guard
        .replay_key_sha256,
    "BINDING_MISMATCH",
    "Execution replay key does not match AUTHORIZATION.",
  );

  requireCondition(
    canonicalExecutionGenesis
      .authorization_consumption
      .usage_counter_ref
      === canonicalAuthorization
        .replay_guard
        .usage_counter_ref,
    "BINDING_MISMATCH",
    "Execution usage-counter reference does not match AUTHORIZATION.",
  );

  requireCondition(
    canonicalExecutionGenesis
      .authorization_consumption
      .consumption_event_ref
      === null,
    "CONSUMPTION_STATE_INVALID",
    "PENDING execution must not contain a consumption event reference.",
  );

  requireCondition(
    canonicalExecutionGenesis
      .authorization_consumption
      .consumption_index
      === null,
    "CONSUMPTION_STATE_INVALID",
    "PENDING execution must not contain a consumption index.",
  );

  requireCondition(
    canonicalExecutionGenesis
      .authorization_consumption
      .consumed_at
      === null,
    "CONSUMPTION_STATE_INVALID",
    "PENDING execution must not contain a consumption timestamp.",
  );

  requireCondition(
    canonicalExecutionGenesis
      .authorization_consumption
      .atomic
      === true,
    "CONSUMPTION_STATE_INVALID",
    "Execution authorization consumption must require atomic enforcement.",
  );

  requireCondition(
    canonicalExecutionGenesis
      .genealogy
      .derived_from
      === null,
    "GENESIS_GENEALOGY_INVALID",
    "Genesis execution derived_from must be null.",
  );

  requireCondition(
    canonicalExecutionGenesis
      .genealogy
      .previous_state
      === null,
    "GENESIS_GENEALOGY_INVALID",
    "Genesis execution previous_state must be null.",
  );

  requireCondition(
    canonicalExecutionGenesis
      .genealogy
      .new_state
      === "PENDING",
    "GENESIS_GENEALOGY_INVALID",
    "Genesis execution new_state must be PENDING.",
  );

  requireCondition(
    canonicalExecutionGenesis
      .genealogy
      .hash
      === canonicalAuthorization.payload_sha256,
    "GENESIS_GENEALOGY_INVALID",
    "Genesis execution genealogy hash must equal AUTHORIZATION payload hash.",
  );

  return Object.freeze({
    authorizationRef:
      canonicalAuthorization.authorization_id,

    authorizationVersion:
      String(
        canonicalAuthorization.authorization_version,
      ),

    authorizationSha256:
      canonicalAuthorization.payload_sha256,

    replayKeySha256:
      canonicalAuthorization
        .replay_guard
        .replay_key_sha256,

    replayMode:
      canonicalAuthorization
        .replay_guard
        .mode,

    maxUses:
      canonicalAuthorization
        .replay_guard
        .max_uses,

    usageCounterRef:
      canonicalAuthorization
        .replay_guard
        .usage_counter_ref,

    executionId:
      canonicalExecutionGenesis.execution_id,

    actionSha256:
      canonicalExecutionGenesis
        .binding_check
        .execution_action_sha256,

    requestSha256:
      canonicalExecutionGenesis
        .binding_check
        .execution_request_sha256,

    iospaceRef:
      canonicalExecutionGenesis.iospace_ref,
  });
}
