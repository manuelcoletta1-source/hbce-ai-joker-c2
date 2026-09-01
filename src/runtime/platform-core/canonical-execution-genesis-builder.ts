import {
  PlatformCoreCanonicalPayloadHashError,
  computePlatformCorePayloadSha256,
} from "./canonical-payload-hash";

import {
  validatePlatformCoreCanonicalSchema,
  type PlatformCoreStaticValidationIssue,
} from "./canonical-schema-validator";

import type {
  PlatformCoreCanonicalAuthorization,
  PlatformCoreAuthorizationState,
} from "./canonical-authorization-builder";

export const PLATFORM_CORE_CANONICAL_EXECUTION_GENESIS_BUILDER_PROTOCOL =
  "HBCE-PLATFORM-CORE-CANONICAL-EXECUTION-GENESIS-BUILDER-v1" as const;

export type PlatformCoreCanonicalExecutionGenesisBuilderErrorCode =
  | "INVALID_INPUT"
  | "RESERVED_FIELD"
  | "HASH_COMPUTATION_FAILED"
  | "SCHEMA_VALIDATION_FAILED";

export class PlatformCoreCanonicalExecutionGenesisBuilderError
  extends Error {
  readonly code:
    PlatformCoreCanonicalExecutionGenesisBuilderErrorCode;

  readonly validationIssues:
    readonly PlatformCoreStaticValidationIssue[];

  constructor(
    code:
      PlatformCoreCanonicalExecutionGenesisBuilderErrorCode,
    message: string,
    validationIssues:
      readonly PlatformCoreStaticValidationIssue[] = [],
  ) {
    super(message);

    this.name =
      "PlatformCoreCanonicalExecutionGenesisBuilderError";

    this.code =
      code;

    this.validationIssues =
      Object.freeze([
        ...validationIssues,
      ]);
  }
}

export type PlatformCoreExecutionBindingMatchState =
  | "MATCH"
  | "FAIL"
  | "UNKNOWN";

export type PlatformCoreExecutionValidityState =
  | "VALID"
  | "NOT_YET_VALID"
  | "EXPIRED"
  | "UNKNOWN";

export type PlatformCoreExecutionPassState =
  | "PASS"
  | "FAIL"
  | "UNKNOWN";

export type PlatformCoreExecutionReplayState =
  | "AVAILABLE"
  | "CONSUMED"
  | "EXHAUSTED"
  | "UNKNOWN";

export type PlatformCoreExecutionPrecheckDecision =
  | "ALLOW_EXECUTION"
  | "BLOCK_EXECUTION"
  | "UNKNOWN";

export type PlatformCoreExecutionObservationState =
  | "CAPTURED"
  | "NOT_AVAILABLE"
  | "UNKNOWN";

export type PlatformCoreExecutionEvidenceState =
  | "PRESENT"
  | "MISSING"
  | "NOT_APPLICABLE"
  | "UNKNOWN";

export interface PlatformCoreExecutionGenesisPrecheckInput {
  readonly evaluated_at: string;

  readonly validity_state:
    PlatformCoreExecutionValidityState;

  readonly authority_usability_state:
    PlatformCoreExecutionPassState;

  readonly dependency_binding_state:
    PlatformCoreExecutionPassState;

  readonly iospace_binding_state:
    PlatformCoreExecutionPassState;

  readonly enforcement_point_binding_state:
    PlatformCoreExecutionPassState;

  readonly replay_state:
    PlatformCoreExecutionReplayState;

  readonly decision:
    PlatformCoreExecutionPrecheckDecision;

  readonly evidence_reference:
    string | null;

  readonly authorization_consumption_atomic:
    boolean;
}

export interface PlatformCoreExecutionObservationInput {
  readonly observation_state:
    PlatformCoreExecutionObservationState;

  readonly state_ref:
    string | null;

  readonly state_sha256:
    string | null;
}

export interface PlatformCoreExecutionGenesisGenealogyInput {
  readonly cause: string;

  readonly evidence_reference:
    string | null;

  readonly timestamp:
    string;
}

export interface PlatformCoreCanonicalExecutionGenesisInput {
  readonly execution_id:
    string;

  readonly execution_engine_ref:
    string;

  readonly execution_action_sha256:
    string;

  readonly execution_request_sha256:
    string;

  readonly requested_at:
    string;

  readonly precheck:
    PlatformCoreExecutionGenesisPrecheckInput;

  readonly state_before:
    PlatformCoreExecutionObservationInput;

  readonly state_after:
    PlatformCoreExecutionObservationInput;

  readonly evidence_state:
    PlatformCoreExecutionEvidenceState;

  readonly evidence_reference:
    string | null;

  readonly outcome_reference:
    string | null;

  readonly consequence_reference:
    string | null;

  readonly evt_reference:
    string | null;

  readonly opc_reference:
    string | null;

  readonly genealogy:
    PlatformCoreExecutionGenesisGenealogyInput;

  readonly note?:
    string | null;
}

const BOUNDARY = Object.freeze({
  data_minimization: true,
  reference_over_raw_evidence: true,
  execution_requires_authorization: true,
  authorization_not_execution: true,
  authorized_not_executed: true,
  execution_not_success: true,
  execution_not_outcome: true,
  execution_not_consequence: true,
  exact_authorization_version_required: true,
  authorization_hash_binding_required: true,
  action_digest_match_required: true,
  request_digest_match_required: true,
  iospace_match_required: true,
  enforcement_point_match_required: true,
  precheck_allow_required_before_start: true,
  pending_not_consumed: true,
  authorization_consumption_required_before_start: true,
  atomic_consumption_required: true,
  state_before_required_before_start: true,
  state_after_required_after_terminal_execution: true,
  failed_or_aborted_state_after_may_be_unavailable: true,
  stale_or_revoked_authorization_blocks_start: true,
  unknown_blocks_start: true,
  blocked_not_executed: true,
  cross_object_binding_runtime_validation_required: true,
  temporal_order_runtime_validation_required: true,
  atomic_consumption_runtime_enforcement_required: true,
  append_only_genealogy: true,
  no_automatic_success_claim: true,
  no_regulated_certification_claim: true,
  no_public_authority_claim: true,
  fail_closed: true,
} as const);

export type PlatformCoreCanonicalExecutionGenesis =
  Readonly<{
    readonly proto:
      "HBCE-EXECUTION-v1";

    readonly kind:
      "HBCE_CORE_EXECUTION";

    readonly version:
      "v1";

    readonly execution_id:
      string;

    readonly execution_version:
      1;

    readonly principal_ref:
      string;

    readonly actor_ref:
      string;

    readonly authorization_ref:
      string;

    readonly authorization_version:
      number;

    readonly authorization_sha256:
      string;

    readonly iospace_ref:
      string;

    readonly enforcement_point_ref:
      string;

    readonly execution_engine_ref:
      string;

    readonly binding_check:
      Readonly<{
        readonly action_class:
          string;

        readonly target_ref:
          string;

        readonly authorization_action_sha256:
          string;

        readonly execution_action_sha256:
          string;

        readonly authorization_request_sha256:
          string;

        readonly execution_request_sha256:
          string;

        readonly action_match_state:
          PlatformCoreExecutionBindingMatchState;

        readonly request_match_state:
          PlatformCoreExecutionBindingMatchState;
      }>;

    readonly precheck:
      Readonly<{
        readonly evaluated_at:
          string;

        readonly authorization_state_observed:
          PlatformCoreAuthorizationState;

        readonly validity_state:
          PlatformCoreExecutionValidityState;

        readonly authority_usability_state:
          PlatformCoreExecutionPassState;

        readonly dependency_binding_state:
          PlatformCoreExecutionPassState;

        readonly iospace_binding_state:
          PlatformCoreExecutionPassState;

        readonly enforcement_point_binding_state:
          PlatformCoreExecutionPassState;

        readonly replay_state:
          PlatformCoreExecutionReplayState;

        readonly decision:
          PlatformCoreExecutionPrecheckDecision;

        readonly evidence_reference:
          string | null;
      }>;

    readonly authorization_consumption:
      Readonly<{
        readonly state:
          "NOT_CONSUMED";

        readonly replay_key_sha256:
          string;

        readonly usage_counter_ref:
          string | null;

        readonly consumption_event_ref:
          null;

        readonly consumption_index:
          null;

        readonly consumed_at:
          null;

        readonly atomic:
          boolean;
      }>;

    readonly state_before:
      Readonly<
        PlatformCoreExecutionObservationInput
      >;

    readonly state_after:
      Readonly<
        PlatformCoreExecutionObservationInput
      >;

    readonly state:
      "PENDING";

    readonly requested_at:
      string;

    readonly started_at:
      null;

    readonly completed_at:
      null;

    readonly evidence_state:
      PlatformCoreExecutionEvidenceState;

    readonly evidence_reference:
      string | null;

    readonly outcome_reference:
      string | null;

    readonly consequence_reference:
      string | null;

    readonly evt_reference:
      string | null;

    readonly opc_reference:
      string | null;

    readonly payload_sha256:
      string;

    readonly append_only:
      true;

    readonly genealogy:
      Readonly<{
        readonly derived_from:
          null;

        readonly previous_state:
          null;

        readonly new_state:
          "PENDING";

        readonly cause:
          string;

        readonly evidence_reference:
          string | null;

        readonly timestamp:
          string;

        readonly hash:
          string;
      }>;

    readonly boundary:
      typeof BOUNDARY;

    readonly note?:
      string | null;
  }>;

const ALLOWED_SOURCE_FIELDS =
  new Set<string>([
    "execution_id",
    "execution_engine_ref",
    "execution_action_sha256",
    "execution_request_sha256",
    "requested_at",
    "precheck",
    "state_before",
    "state_after",
    "evidence_state",
    "evidence_reference",
    "outcome_reference",
    "consequence_reference",
    "evt_reference",
    "opc_reference",
    "genealogy",
    "note",
  ]);

const RESERVED_SOURCE_FIELDS =
  new Set<string>([
    "proto",
    "kind",
    "version",
    "execution_version",
    "principal_ref",
    "actor_ref",
    "authorization_ref",
    "authorization_version",
    "authorization_sha256",
    "iospace_ref",
    "enforcement_point_ref",
    "binding_check",
    "authorization_consumption",
    "state",
    "started_at",
    "completed_at",
    "payload_sha256",
    "append_only",
    "boundary",
  ]);

const PRECHECK_FIELDS =
  new Set<string>([
    "evaluated_at",
    "validity_state",
    "authority_usability_state",
    "dependency_binding_state",
    "iospace_binding_state",
    "enforcement_point_binding_state",
    "replay_state",
    "decision",
    "evidence_reference",
    "authorization_consumption_atomic",
  ]);

const OBSERVATION_FIELDS =
  new Set<string>([
    "observation_state",
    "state_ref",
    "state_sha256",
  ]);

const GENEALOGY_FIELDS =
  new Set<string>([
    "cause",
    "evidence_reference",
    "timestamp",
  ]);

function isPlainRecord(
  value: unknown,
): value is Record<string, unknown> {
  if (
    typeof value !== "object"
    || value === null
    || Array.isArray(value)
  ) {
    return false;
  }

  const prototype =
    Object.getPrototypeOf(value);

  return (
    prototype === Object.prototype
    || prototype === null
  );
}

function assertExactKeys(
  value: unknown,
  allowed: ReadonlySet<string>,
  path: string,
): asserts value is Record<string, unknown> {
  if (!isPlainRecord(value)) {
    throw new PlatformCoreCanonicalExecutionGenesisBuilderError(
      "INVALID_INPUT",
      `${path} must be a plain object.`,
    );
  }

  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      throw new PlatformCoreCanonicalExecutionGenesisBuilderError(
        "INVALID_INPUT",
        `${path}.${key} is not allowed.`,
      );
    }
  }
}

function assertInput(
  input:
    PlatformCoreCanonicalExecutionGenesisInput,
  canonicalAuthorization:
    PlatformCoreCanonicalAuthorization,
): void {
  if (!isPlainRecord(input)) {
    throw new PlatformCoreCanonicalExecutionGenesisBuilderError(
      "INVALID_INPUT",
      "Canonical EXECUTION genesis input must be a plain object.",
    );
  }

  for (const key of Object.keys(input)) {
    if (RESERVED_SOURCE_FIELDS.has(key)) {
      throw new PlatformCoreCanonicalExecutionGenesisBuilderError(
        "RESERVED_FIELD",
        `Canonical EXECUTION genesis source may not control reserved field ${key}.`,
      );
    }

    if (!ALLOWED_SOURCE_FIELDS.has(key)) {
      throw new PlatformCoreCanonicalExecutionGenesisBuilderError(
        "INVALID_INPUT",
        `Canonical EXECUTION genesis source contains unsupported field ${key}.`,
      );
    }
  }

  assertExactKeys(
    input.precheck,
    PRECHECK_FIELDS,
    "$.precheck",
  );

  assertExactKeys(
    input.state_before,
    OBSERVATION_FIELDS,
    "$.state_before",
  );

  assertExactKeys(
    input.state_after,
    OBSERVATION_FIELDS,
    "$.state_after",
  );

  assertExactKeys(
    input.genealogy,
    GENEALOGY_FIELDS,
    "$.genealogy",
  );

  if (!isPlainRecord(canonicalAuthorization)) {
    throw new PlatformCoreCanonicalExecutionGenesisBuilderError(
      "INVALID_INPUT",
      "Canonical AUTHORIZATION must be a plain object.",
    );
  }

  if (
    !isPlainRecord(
      canonicalAuthorization.action_binding,
    )
  ) {
    throw new PlatformCoreCanonicalExecutionGenesisBuilderError(
      "INVALID_INPUT",
      "Canonical AUTHORIZATION action_binding must be a plain object.",
    );
  }

  if (
    !isPlainRecord(
      canonicalAuthorization.replay_guard,
    )
  ) {
    throw new PlatformCoreCanonicalExecutionGenesisBuilderError(
      "INVALID_INPUT",
      "Canonical AUTHORIZATION replay_guard must be a plain object.",
    );
  }
}

function copyObservation(
  input:
    PlatformCoreExecutionObservationInput,
): PlatformCoreExecutionObservationInput {
  return {
    observation_state:
      input.observation_state,

    state_ref:
      input.state_ref,

    state_sha256:
      input.state_sha256,
  };
}

export function buildPlatformCoreCanonicalExecutionGenesis(
  input:
    PlatformCoreCanonicalExecutionGenesisInput,
  canonicalAuthorization:
    PlatformCoreCanonicalAuthorization,
): PlatformCoreCanonicalExecutionGenesis {
  assertInput(
    input,
    canonicalAuthorization,
  );

  const actionMatchState:
    PlatformCoreExecutionBindingMatchState =
      input.execution_action_sha256
        === canonicalAuthorization
          .action_binding
          .action_sha256
        ? "MATCH"
        : "FAIL";

  const requestMatchState:
    PlatformCoreExecutionBindingMatchState =
      input.execution_request_sha256
        === canonicalAuthorization
          .action_binding
          .request_sha256
        ? "MATCH"
        : "FAIL";

  const candidate = {
    proto:
      "HBCE-EXECUTION-v1" as const,

    kind:
      "HBCE_CORE_EXECUTION" as const,

    version:
      "v1" as const,

    execution_id:
      input.execution_id,

    execution_version:
      1 as const,

    principal_ref:
      canonicalAuthorization.principal_ref,

    actor_ref:
      canonicalAuthorization.actor_ref,

    authorization_ref:
      canonicalAuthorization.authorization_id,

    authorization_version:
      canonicalAuthorization.authorization_version,

    authorization_sha256:
      canonicalAuthorization.payload_sha256,

    iospace_ref:
      canonicalAuthorization.iospace_ref,

    enforcement_point_ref:
      canonicalAuthorization.enforcement_point_ref,

    execution_engine_ref:
      input.execution_engine_ref,

    binding_check: {
      action_class:
        canonicalAuthorization
          .action_binding
          .action_class,

      target_ref:
        canonicalAuthorization
          .action_binding
          .target_ref,

      authorization_action_sha256:
        canonicalAuthorization
          .action_binding
          .action_sha256,

      execution_action_sha256:
        input.execution_action_sha256,

      authorization_request_sha256:
        canonicalAuthorization
          .action_binding
          .request_sha256,

      execution_request_sha256:
        input.execution_request_sha256,

      action_match_state:
        actionMatchState,

      request_match_state:
        requestMatchState,
    },

    precheck: {
      evaluated_at:
        input.precheck.evaluated_at,

      authorization_state_observed:
        canonicalAuthorization.state,

      validity_state:
        input.precheck.validity_state,

      authority_usability_state:
        input.precheck
          .authority_usability_state,

      dependency_binding_state:
        input.precheck
          .dependency_binding_state,

      iospace_binding_state:
        input.precheck
          .iospace_binding_state,

      enforcement_point_binding_state:
        input.precheck
          .enforcement_point_binding_state,

      replay_state:
        input.precheck.replay_state,

      decision:
        input.precheck.decision,

      evidence_reference:
        input.precheck.evidence_reference,
    },

    authorization_consumption: {
      state:
        "NOT_CONSUMED" as const,

      replay_key_sha256:
        canonicalAuthorization
          .replay_guard
          .replay_key_sha256,

      usage_counter_ref:
        canonicalAuthorization
          .replay_guard
          .usage_counter_ref,

      consumption_event_ref:
        null,

      consumption_index:
        null,

      consumed_at:
        null,

      atomic:
        input.precheck
          .authorization_consumption_atomic,
    },

    state_before:
      copyObservation(
        input.state_before,
      ),

    state_after:
      copyObservation(
        input.state_after,
      ),

    state:
      "PENDING" as const,

    requested_at:
      input.requested_at,

    started_at:
      null,

    completed_at:
      null,

    evidence_state:
      input.evidence_state,

    evidence_reference:
      input.evidence_reference,

    outcome_reference:
      input.outcome_reference,

    consequence_reference:
      input.consequence_reference,

    evt_reference:
      input.evt_reference,

    opc_reference:
      input.opc_reference,

    append_only:
      true as const,

    genealogy: {
      derived_from:
        null,

      previous_state:
        null,

      new_state:
        "PENDING" as const,

      cause:
        input.genealogy.cause,

      evidence_reference:
        input.genealogy
          .evidence_reference,

      timestamp:
        input.genealogy.timestamp,

      hash:
        canonicalAuthorization
          .payload_sha256,
    },

    boundary: {
      ...BOUNDARY,
    },

    ...(
      Object.prototype.hasOwnProperty.call(
        input,
        "note",
      )
        ? {
            note:
              input.note,
          }
        : {}
    ),
  };

  let payloadSha256:
    string;

  try {
    payloadSha256 =
      computePlatformCorePayloadSha256(
        candidate,
      );
  } catch (error) {
    if (
      error instanceof
      PlatformCoreCanonicalPayloadHashError
    ) {
      throw new PlatformCoreCanonicalExecutionGenesisBuilderError(
        "HASH_COMPUTATION_FAILED",
        `Canonical EXECUTION genesis hash computation failed: ${error.code}.`,
      );
    }

    throw error;
  }

  const built = {
    ...candidate,

    payload_sha256:
      payloadSha256,
  } satisfies PlatformCoreCanonicalExecutionGenesis;

  const validation =
    validatePlatformCoreCanonicalSchema(
      "EXECUTION",
      built,
    );

  if (!validation.valid) {
    throw new PlatformCoreCanonicalExecutionGenesisBuilderError(
      "SCHEMA_VALIDATION_FAILED",
      `Canonical EXECUTION genesis validation failed: ${validation.code}.`,
      validation.issues,
    );
  }

  return built;
}
