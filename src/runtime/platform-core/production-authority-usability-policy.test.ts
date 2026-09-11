import {
  describe,
  expect,
  it,
} from "vitest";

import {
  buildPlatformCoreCanonicalAuthorityGenesis,
  type PlatformCoreCanonicalAuthority,
  type PlatformCoreCanonicalAuthorityGenesisInput,
} from "./canonical-authority-builder";

import {
  buildPlatformCoreCanonicalAuthorization,
  type PlatformCoreCanonicalAuthorization,
  type PlatformCoreCanonicalAuthorizationInput,
} from "./canonical-authorization-builder";

import {
  evaluatePlatformCoreProductionAuthorityUsability,
  PLATFORM_CORE_PRODUCTION_AUTHORITY_USABILITY_POLICY_PROTOCOL,
  type PlatformCoreProductionAuthorityUsabilityReason,
} from "./production-authority-usability-policy";

const A = "a".repeat(64);
const B = "b".repeat(64);
const C = "c".repeat(64);
const D = "d".repeat(64);
const E = "e".repeat(64);
const F = "f".repeat(64);

function authorityInput():
  PlatformCoreCanonicalAuthorityGenesisInput {
  return {
    authority_id:
      "AUT-POLICY:TEST",

    principal_ref:
      "PRINCIPAL:POLICY:TEST",

    actor_ref:
      "ACTOR:POLICY:TEST",

    mandate_ref:
      "MND-POLICY:TEST",

    mandate_version:
      1,

    capability_ref:
      "CAP-POLICY:TEST",

    capability_version:
      1,

    authority_source: {
      source_type:
        "SYSTEM_POLICY",

      source_ref:
        "POLICY:AUTHORITY:TEST",

      source_sha256:
        A,
    },

    scope: {
      action_classes: [
        "ACTION:POLICY:TEST",
      ],

      target_refs: [
        "TARGET:POLICY:TEST",
      ],

      iospace_refs: [
        "IOSPACE:POLICY:TEST",
      ],

      constraint_refs: [],
    },

    limits: {
      policy_refs: [],
      quantitative_limit_refs: [],
      condition_refs: [],
    },

    state:
      "ACTIVE",

    valid_from:
      "2026-09-01T12:00:00.000Z",

    valid_until:
      "2027-01-19T12:00:00.000Z",

    created_at:
      "2026-09-01T12:00:00.000Z",

    updated_at:
      "2026-09-01T12:00:00.000Z",

    evidence_state:
      "PRESENT",

    evidence_reference:
      "EVIDENCE:POLICY:AUTHORITY",

    genealogy: {
      cause:
        "PRODUCTION_AUTHORITY_USABILITY_POLICY_TEST",

      evidence_reference:
        "EVIDENCE:POLICY:AUTHORITY",

      timestamp:
        "2026-09-01T12:00:00.000Z",
    },
  };
}

function buildAuthority(
  patch:
    Partial<PlatformCoreCanonicalAuthorityGenesisInput> = {},
): PlatformCoreCanonicalAuthority {
  const input =
    authorityInput();

  return buildPlatformCoreCanonicalAuthorityGenesis({
    ...input,
    ...patch,
  });
}

function authorizationInput(
  authority:
    PlatformCoreCanonicalAuthority,
): PlatformCoreCanonicalAuthorizationInput {
  return {
    authorization_id:
      "AZN-POLICY:TEST",

    authorization_version:
      1,

    principal_ref:
      authority.principal_ref,

    actor_ref:
      authority.actor_ref,

    authority_ref:
      authority.authority_id,

    authority_version:
      authority.authority_version,

    mandate_ref:
      authority.mandate_ref,

    mandate_version:
      authority.mandate_version,

    capability_ref:
      authority.capability_ref,

    capability_version:
      authority.capability_version,

    dependency_commitments: {
      authority_sha256:
        authority.payload_sha256,

      mandate_sha256:
        B,

      capability_sha256:
        C,
    },

    iospace_ref:
      "IOSPACE:POLICY:TEST",

    enforcement_point_ref:
      "ENFORCEMENT:POLICY:TEST",

    action_binding: {
      action_class:
        "ACTION:POLICY:TEST",

      target_ref:
        "TARGET:POLICY:TEST",

      action_sha256:
        D,

      request_sha256:
        E,
    },

    decision_source: {
      source_type:
        "HUMAN",

      authorizer_refs: [
        "AUTHOR:POLICY:TEST",
      ],
    },

    decision_basis: {
      policy_refs: [
        "POLICY:AUTHORIZATION:TEST",
      ],

      condition_refs: [
        "CONDITION:AUTHORIZATION:TEST",
      ],
    },

    state:
      "AUTHORIZED",

    decided_at:
      "2026-09-01T13:00:00.000Z",

    valid_from:
      "2026-09-01T13:00:00.000Z",

    valid_until:
      "2026-09-01T14:00:00.000Z",

    created_at:
      "2026-09-01T12:59:00.000Z",

    updated_at:
      "2026-09-01T13:00:00.000Z",

    evidence_state:
      "PRESENT",

    evidence_reference:
      "EVIDENCE:POLICY:AUTHORIZATION",

    replay_guard: {
      mode:
        "SINGLE_USE",

      replay_key_sha256:
        F,

      max_uses:
        1,

      usage_counter_ref:
        "COUNTER:POLICY:TEST",
    },

    genealogy: {
      derived_from:
        null,

      previous_state:
        null,

      new_state:
        "AUTHORIZED",

      cause:
        "PRODUCTION_AUTHORITY_USABILITY_POLICY_TEST",

      evidence_reference:
        "EVIDENCE:POLICY:AUTHORIZATION",

      timestamp:
        "2026-09-01T13:00:00.000Z",

      hash:
        A,
    },
  };
}

function buildAuthorization(
  authority:
    PlatformCoreCanonicalAuthority,
): PlatformCoreCanonicalAuthorization {
  return buildPlatformCoreCanonicalAuthorization(
    authorizationInput(
      authority,
    ),
  );
}

function pair(): Readonly<{
  authority:
    PlatformCoreCanonicalAuthority;

  authorization:
    PlatformCoreCanonicalAuthorization;
}> {
  const authority =
    buildAuthority();

  const authorization =
    buildAuthorization(
      authority,
    );

  return Object.freeze({
    authority,
    authorization,
  });
}

function withAuthority(
  authority:
    PlatformCoreCanonicalAuthority,
  patch:
    Partial<PlatformCoreCanonicalAuthority>,
): PlatformCoreCanonicalAuthority {
  return {
    ...authority,
    ...patch,
  } as PlatformCoreCanonicalAuthority;
}

function withAuthorization(
  authorization:
    PlatformCoreCanonicalAuthorization,
  patch:
    Partial<PlatformCoreCanonicalAuthorization>,
): PlatformCoreCanonicalAuthorization {
  return {
    ...authorization,
    ...patch,
  } as PlatformCoreCanonicalAuthorization;
}

function expectCode(
  authority:
    PlatformCoreCanonicalAuthority,
  authorization:
    PlatformCoreCanonicalAuthorization,
  code:
    PlatformCoreProductionAuthorityUsabilityReason,
): void {
  expect(
    evaluatePlatformCoreProductionAuthorityUsability(
      authority,
      authorization,
    ),
  ).toEqual({
    protocol:
      PLATFORM_CORE_PRODUCTION_AUTHORITY_USABILITY_POLICY_PROTOCOL,

    usable:
      code === "AUTHORITY_USABLE",

    state:
      code === "AUTHORITY_USABLE"
        ? "PASS"
        : "FAIL",

    code,
  });
}

describe(
  "production authority usability policy",
  () => {
    it(
      "passes ACTIVE authority with exact bindings and deterministic structured result",
      () => {
        const current =
          pair();

        const first =
          evaluatePlatformCoreProductionAuthorityUsability(
            current.authority,
            current.authorization,
          );

        const second =
          evaluatePlatformCoreProductionAuthorityUsability(
            current.authority,
            current.authorization,
          );

        expect(first)
          .toEqual(second);

        expect(
          Object.isFrozen(first),
        ).toBe(true);

        expectCode(
          current.authority,
          current.authorization,
          "AUTHORITY_USABLE",
        );
      },
    );

    it(
      "fails when authorization is not AUTHORIZED",
      () => {
        const current = pair();

        expectCode(
          current.authority,
          withAuthorization(
            current.authorization,
            {
              state:
                "PENDING",
            },
          ),
          "AUTHORIZATION_NOT_AUTHORIZED",
        );
      },
    );

    it(
      "fails for missing or invalid decided_at",
      () => {
        const current = pair();

        expectCode(
          current.authority,
          withAuthorization(
            current.authorization,
            {
              decided_at:
                null,
            },
          ),
          "AUTHORIZATION_DECIDED_AT_REQUIRED",
        );

        expectCode(
          current.authority,
          withAuthorization(
            current.authorization,
            {
              decided_at:
                "not-a-date",
            },
          ),
          "AUTHORIZATION_DECIDED_AT_INVALID",
        );
      },
    );

    it(
      "fails when authority evidence is absent or reference is null",
      () => {
        const current = pair();

        expectCode(
          withAuthority(
            current.authority,
            {
              evidence_state:
                "MISSING",
            },
          ),
          current.authorization,
          "AUTHORITY_EVIDENCE_NOT_PRESENT",
        );

        expectCode(
          withAuthority(
            current.authority,
            {
              evidence_reference:
                null,
            },
          ),
          current.authorization,
          "AUTHORITY_EVIDENCE_REFERENCE_REQUIRED",
        );
      },
    );

    it(
      "fails exact authority identity/version/hash bindings",
      () => {
        const current = pair();

        expectCode(
          current.authority,
          withAuthorization(
            current.authorization,
            {
              authority_ref:
                "AUT-POLICY:OTHER",
            },
          ),
          "AUTHORITY_REF_MISMATCH",
        );

        expectCode(
          current.authority,
          withAuthorization(
            current.authorization,
            {
              authority_version:
                2,
            },
          ),
          "AUTHORITY_VERSION_MISMATCH",
        );

        expectCode(
          current.authority,
          withAuthorization(
            current.authorization,
            {
              dependency_commitments: {
                ...current.authorization
                  .dependency_commitments,

                authority_sha256:
                  "9".repeat(64),
              },
            },
          ),
          "AUTHORITY_HASH_MISMATCH",
        );
      },
    );

    it(
      "fails principal and actor bindings",
      () => {
        const current = pair();

        expectCode(
          current.authority,
          withAuthorization(
            current.authorization,
            {
              principal_ref:
                "PRINCIPAL:OTHER",
            },
          ),
          "PRINCIPAL_MISMATCH",
        );

        expectCode(
          current.authority,
          withAuthorization(
            current.authorization,
            {
              actor_ref:
                "ACTOR:OTHER",
            },
          ),
          "ACTOR_MISMATCH",
        );
      },
    );

    it(
      "fails mandate ref/version bindings",
      () => {
        const current = pair();

        expectCode(
          current.authority,
          withAuthorization(
            current.authorization,
            {
              mandate_ref:
                "MND-POLICY:OTHER",
            },
          ),
          "MANDATE_REF_MISMATCH",
        );

        expectCode(
          current.authority,
          withAuthorization(
            current.authorization,
            {
              mandate_version:
                2,
            },
          ),
          "MANDATE_VERSION_MISMATCH",
        );
      },
    );

    it(
      "fails capability ref/version bindings",
      () => {
        const current = pair();

        expectCode(
          current.authority,
          withAuthorization(
            current.authorization,
            {
              capability_ref:
                "CAP-POLICY:OTHER",
            },
          ),
          "CAPABILITY_REF_MISMATCH",
        );

        expectCode(
          current.authority,
          withAuthorization(
            current.authorization,
            {
              capability_version:
                2,
            },
          ),
          "CAPABILITY_VERSION_MISMATCH",
        );
      },
    );

    it(
      "fails closed for LIMITED authority",
      () => {
        const current = pair();

        expectCode(
          withAuthority(
            current.authority,
            {
              state:
                "LIMITED",
            },
          ),
          current.authorization,
          "AUTHORITY_STATE_LIMITED_UNSUPPORTED",
        );
      },
    );

    const nonUsableStates =
      [
        "DRAFT",
        "PENDING",
        "SUSPENDED",
        "CONTESTED",
        "COMPROMISED",
        "EXPIRED",
        "REVOKED",
        "SUPERSEDED",
        "UNKNOWN",
      ] as const;

    for (
      const state
      of nonUsableStates
    ) {
      it(
        `fails closed for non-usable authority state ${state}`,
        () => {
          const current = pair();

          expectCode(
            withAuthority(
              current.authority,
              {
                state,
              },
            ),
            current.authorization,
            "AUTHORITY_STATE_NOT_USABLE",
          );
        },
      );
    }

    it(
      "fails for invalid authority validity timestamps",
      () => {
        const current = pair();

        expectCode(
          withAuthority(
            current.authority,
            {
              valid_from:
                "not-a-date",
            },
          ),
          current.authorization,
          "AUTHORITY_VALID_FROM_INVALID",
        );

        expectCode(
          withAuthority(
            current.authority,
            {
              valid_until:
                "not-a-date",
            },
          ),
          current.authorization,
          "AUTHORITY_VALID_UNTIL_INVALID",
        );
      },
    );

    it(
      "fails when decided_at precedes authority valid_from",
      () => {
        const current = pair();

        expectCode(
          withAuthority(
            current.authority,
            {
              valid_from:
                "2026-09-01T13:00:00.001Z",
            },
          ),
          current.authorization,
          "AUTHORITY_NOT_YET_VALID_AT_DECISION",
        );
      },
    );

    it(
      "fails when decided_at exceeds authority valid_until",
      () => {
        const current = pair();

        expectCode(
          withAuthority(
            current.authority,
            {
              valid_until:
                "2026-09-01T12:59:59.999Z",
            },
          ),
          current.authorization,
          "AUTHORITY_EXPIRED_AT_DECISION",
        );
      },
    );

    it(
      "allows null authority valid_until",
      () => {
        const authority =
          buildAuthority({
            valid_until:
              null,
          });

        const authorization =
          buildAuthorization(
            authority,
          );

        expectCode(
          authority,
          authorization,
          "AUTHORITY_USABLE",
        );
      },
    );

    it(
      "fails action, target, and IOSPACE scope mismatches",
      () => {
        const current = pair();

        expectCode(
          current.authority,
          withAuthorization(
            current.authorization,
            {
              action_binding: {
                ...current.authorization
                  .action_binding,

                action_class:
                  "ACTION:OTHER",
              },
            },
          ),
          "ACTION_CLASS_OUT_OF_SCOPE",
        );

        expectCode(
          current.authority,
          withAuthorization(
            current.authorization,
            {
              action_binding: {
                ...current.authorization
                  .action_binding,

                target_ref:
                  "TARGET:OTHER",
              },
            },
          ),
          "TARGET_REF_OUT_OF_SCOPE",
        );

        expectCode(
          current.authority,
          withAuthorization(
            current.authorization,
            {
              iospace_ref:
                "IOSPACE:OTHER",
            },
          ),
          "IOSPACE_REF_OUT_OF_SCOPE",
        );
      },
    );

    it(
      "fails closed when constraint evaluation is required",
      () => {
        const current = pair();

        expectCode(
          withAuthority(
            current.authority,
            {
              scope: {
                ...current.authority.scope,
                constraint_refs: [
                  "CONSTRAINT:REQUIRED",
                ],
              },
            },
          ),
          current.authorization,
          "AUTHORITY_CONSTRAINT_EVALUATOR_REQUIRED",
        );
      },
    );

    it(
      "fails closed when policy evaluation is required",
      () => {
        const current = pair();

        expectCode(
          withAuthority(
            current.authority,
            {
              limits: {
                ...current.authority.limits,
                policy_refs: [
                  "POLICY:REQUIRED",
                ],
              },
            },
          ),
          current.authorization,
          "AUTHORITY_POLICY_EVALUATOR_REQUIRED",
        );
      },
    );

    it(
      "fails closed when quantitative limit evaluation is required",
      () => {
        const current = pair();

        expectCode(
          withAuthority(
            current.authority,
            {
              limits: {
                ...current.authority.limits,
                quantitative_limit_refs: [
                  "LIMIT:REQUIRED",
                ],
              },
            },
          ),
          current.authorization,
          "AUTHORITY_QUANTITATIVE_LIMIT_EVALUATOR_REQUIRED",
        );
      },
    );

    it(
      "fails closed when condition evaluation is required",
      () => {
        const current = pair();

        expectCode(
          withAuthority(
            current.authority,
            {
              limits: {
                ...current.authority.limits,
                condition_refs: [
                  "CONDITION:REQUIRED",
                ],
              },
            },
          ),
          current.authorization,
          "AUTHORITY_CONDITION_EVALUATOR_REQUIRED",
        );
      },
    );
  },
);
