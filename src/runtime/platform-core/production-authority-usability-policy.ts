import type {
  PlatformCoreCanonicalAuthority,
} from "./canonical-authority-builder";

import type {
  PlatformCoreCanonicalAuthorization,
} from "./canonical-authorization-builder";

export const PLATFORM_CORE_PRODUCTION_AUTHORITY_USABILITY_POLICY_PROTOCOL =
  "HBCE-PLATFORM-CORE-PRODUCTION-AUTHORITY-USABILITY-POLICY-v1" as const;

export type PlatformCoreProductionAuthorityUsabilityReason =
  | "AUTHORITY_USABLE"
  | "AUTHORIZATION_NOT_AUTHORIZED"
  | "AUTHORIZATION_DECIDED_AT_REQUIRED"
  | "AUTHORIZATION_DECIDED_AT_INVALID"
  | "AUTHORITY_EVIDENCE_NOT_PRESENT"
  | "AUTHORITY_EVIDENCE_REFERENCE_REQUIRED"
  | "AUTHORITY_REF_MISMATCH"
  | "AUTHORITY_VERSION_MISMATCH"
  | "AUTHORITY_HASH_MISMATCH"
  | "PRINCIPAL_MISMATCH"
  | "ACTOR_MISMATCH"
  | "MANDATE_REF_MISMATCH"
  | "MANDATE_VERSION_MISMATCH"
  | "CAPABILITY_REF_MISMATCH"
  | "CAPABILITY_VERSION_MISMATCH"
  | "AUTHORITY_STATE_LIMITED_UNSUPPORTED"
  | "AUTHORITY_STATE_NOT_USABLE"
  | "AUTHORITY_VALID_FROM_INVALID"
  | "AUTHORITY_VALID_UNTIL_INVALID"
  | "AUTHORITY_NOT_YET_VALID_AT_DECISION"
  | "AUTHORITY_EXPIRED_AT_DECISION"
  | "ACTION_CLASS_OUT_OF_SCOPE"
  | "TARGET_REF_OUT_OF_SCOPE"
  | "IOSPACE_REF_OUT_OF_SCOPE"
  | "AUTHORITY_CONSTRAINT_EVALUATOR_REQUIRED"
  | "AUTHORITY_POLICY_EVALUATOR_REQUIRED"
  | "AUTHORITY_QUANTITATIVE_LIMIT_EVALUATOR_REQUIRED"
  | "AUTHORITY_CONDITION_EVALUATOR_REQUIRED";

export type PlatformCoreProductionAuthorityUsabilityResult =
  Readonly<{
    protocol:
      typeof PLATFORM_CORE_PRODUCTION_AUTHORITY_USABILITY_POLICY_PROTOCOL;

    usable:
      boolean;

    state:
      "PASS" | "FAIL";

    code:
      PlatformCoreProductionAuthorityUsabilityReason;
  }>;

function result(
  usable: boolean,
  state: "PASS" | "FAIL",
  code: PlatformCoreProductionAuthorityUsabilityReason,
): PlatformCoreProductionAuthorityUsabilityResult {
  return Object.freeze({
    protocol:
      PLATFORM_CORE_PRODUCTION_AUTHORITY_USABILITY_POLICY_PROTOCOL,
    usable,
    state,
    code,
  });
}

function fail(
  code:
    Exclude<
      PlatformCoreProductionAuthorityUsabilityReason,
      "AUTHORITY_USABLE"
    >,
): PlatformCoreProductionAuthorityUsabilityResult {
  return result(
    false,
    "FAIL",
    code,
  );
}

export function evaluatePlatformCoreProductionAuthorityUsability(
  authority:
    PlatformCoreCanonicalAuthority,
  authorization:
    PlatformCoreCanonicalAuthorization,
): PlatformCoreProductionAuthorityUsabilityResult {
  if (
    authorization.state !==
      "AUTHORIZED"
  ) {
    return fail(
      "AUTHORIZATION_NOT_AUTHORIZED",
    );
  }

  if (
    authorization.decided_at ===
      null
  ) {
    return fail(
      "AUTHORIZATION_DECIDED_AT_REQUIRED",
    );
  }

  const decidedAt =
    Date.parse(
      authorization.decided_at,
    );

  if (
    !Number.isFinite(
      decidedAt,
    )
  ) {
    return fail(
      "AUTHORIZATION_DECIDED_AT_INVALID",
    );
  }

  if (
    authority.evidence_state !==
      "PRESENT"
  ) {
    return fail(
      "AUTHORITY_EVIDENCE_NOT_PRESENT",
    );
  }

  if (
    authority.evidence_reference ===
      null
  ) {
    return fail(
      "AUTHORITY_EVIDENCE_REFERENCE_REQUIRED",
    );
  }

  if (
    authorization.authority_ref !==
      authority.authority_id
  ) {
    return fail(
      "AUTHORITY_REF_MISMATCH",
    );
  }

  if (
    authorization.authority_version !==
      authority.authority_version
  ) {
    return fail(
      "AUTHORITY_VERSION_MISMATCH",
    );
  }

  if (
    authorization
      .dependency_commitments
      .authority_sha256 !==
        authority.payload_sha256
  ) {
    return fail(
      "AUTHORITY_HASH_MISMATCH",
    );
  }

  if (
    authorization.principal_ref !==
      authority.principal_ref
  ) {
    return fail(
      "PRINCIPAL_MISMATCH",
    );
  }

  if (
    authorization.actor_ref !==
      authority.actor_ref
  ) {
    return fail(
      "ACTOR_MISMATCH",
    );
  }

  if (
    authorization.mandate_ref !==
      authority.mandate_ref
  ) {
    return fail(
      "MANDATE_REF_MISMATCH",
    );
  }

  if (
    authorization.mandate_version !==
      authority.mandate_version
  ) {
    return fail(
      "MANDATE_VERSION_MISMATCH",
    );
  }

  if (
    authorization.capability_ref !==
      authority.capability_ref
  ) {
    return fail(
      "CAPABILITY_REF_MISMATCH",
    );
  }

  if (
    authorization.capability_version !==
      authority.capability_version
  ) {
    return fail(
      "CAPABILITY_VERSION_MISMATCH",
    );
  }

  if (
    authority.state ===
      "LIMITED"
  ) {
    return fail(
      "AUTHORITY_STATE_LIMITED_UNSUPPORTED",
    );
  }

  if (
    authority.state !==
      "ACTIVE"
  ) {
    return fail(
      "AUTHORITY_STATE_NOT_USABLE",
    );
  }

  const validFrom =
    Date.parse(
      authority.valid_from,
    );

  if (
    !Number.isFinite(
      validFrom,
    )
  ) {
    return fail(
      "AUTHORITY_VALID_FROM_INVALID",
    );
  }

  if (
    decidedAt <
      validFrom
  ) {
    return fail(
      "AUTHORITY_NOT_YET_VALID_AT_DECISION",
    );
  }

  if (
    authority.valid_until !==
      null
  ) {
    const validUntil =
      Date.parse(
        authority.valid_until,
      );

    if (
      !Number.isFinite(
        validUntil,
      )
    ) {
      return fail(
        "AUTHORITY_VALID_UNTIL_INVALID",
      );
    }

    if (
      decidedAt >
        validUntil
    ) {
      return fail(
        "AUTHORITY_EXPIRED_AT_DECISION",
      );
    }
  }

  if (
    !authority.scope.action_classes.includes(
      authorization.action_binding
        .action_class,
    )
  ) {
    return fail(
      "ACTION_CLASS_OUT_OF_SCOPE",
    );
  }

  if (
    !authority.scope.target_refs.includes(
      authorization.action_binding
        .target_ref,
    )
  ) {
    return fail(
      "TARGET_REF_OUT_OF_SCOPE",
    );
  }

  if (
    !authority.scope.iospace_refs.includes(
      authorization.iospace_ref,
    )
  ) {
    return fail(
      "IOSPACE_REF_OUT_OF_SCOPE",
    );
  }

  if (
    authority.scope.constraint_refs.length >
      0
  ) {
    return fail(
      "AUTHORITY_CONSTRAINT_EVALUATOR_REQUIRED",
    );
  }

  if (
    authority.limits.policy_refs.length >
      0
  ) {
    return fail(
      "AUTHORITY_POLICY_EVALUATOR_REQUIRED",
    );
  }

  if (
    authority
      .limits
      .quantitative_limit_refs
      .length >
        0
  ) {
    return fail(
      "AUTHORITY_QUANTITATIVE_LIMIT_EVALUATOR_REQUIRED",
    );
  }

  if (
    authority.limits.condition_refs.length >
      0
  ) {
    return fail(
      "AUTHORITY_CONDITION_EVALUATOR_REQUIRED",
    );
  }

  return result(
    true,
    "PASS",
    "AUTHORITY_USABLE",
  );
}
