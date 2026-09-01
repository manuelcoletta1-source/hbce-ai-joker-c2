import {
  describe,
  expect,
  it,
} from "vitest";

import {
  buildPlatformCoreCanonicalAuthorization,
  PlatformCoreCanonicalAuthorizationBuilderError,
  type PlatformCoreCanonicalAuthorizationInput,
} from "./canonical-authorization-builder";

import {
  computePlatformCorePayloadSha256,
  verifyPlatformCorePayloadSha256,
} from "./canonical-payload-hash";

import {
  validatePlatformCoreCanonicalSchema,
} from "./canonical-schema-validator";

const A = "a".repeat(64);
const B = "b".repeat(64);
const C = "c".repeat(64);
const D = "d".repeat(64);
const E = "e".repeat(64);
const F = "f".repeat(64);

function validInput():
  PlatformCoreCanonicalAuthorizationInput {
  return {
    authorization_id:
      "AZN-D125:TEST",

    authorization_version:
      1,

    principal_ref:
      "PRINCIPAL:D125",

    actor_ref:
      "ACTOR:D125",

    authority_ref:
      "AUT-D125:AUTHORITY",

    authority_version:
      1,

    mandate_ref:
      "MND-D125:MANDATE",

    mandate_version:
      1,

    capability_ref:
      "CAP-D125:CAPABILITY",

    capability_version:
      1,

    dependency_commitments: {
      authority_sha256: A,
      mandate_sha256: B,
      capability_sha256: C,
    },

    iospace_ref:
      "IOSPACE:D125",

    enforcement_point_ref:
      "ENFORCEMENT:D125",

    action_binding: {
      action_class:
        "ACTION:D125",

      target_ref:
        "TARGET:D125",

      action_sha256: D,
      request_sha256: E,
    },

    decision_source: {
      source_type:
        "HUMAN",

      authorizer_refs: [
        "AUTHOR:D125",
      ],
    },

    decision_basis: {
      policy_refs: [
        "POLICY:D125",
      ],

      condition_refs: [
        "CONDITION:D125",
      ],
    },

    state:
      "AUTHORIZED",

    decided_at:
      "2026-09-01T14:00:00.000Z",

    valid_from:
      "2026-09-01T14:00:00.000Z",

    valid_until:
      "2026-09-01T15:00:00.000Z",

    created_at:
      "2026-09-01T13:59:00.000Z",

    updated_at:
      "2026-09-01T14:00:00.000Z",

    evidence_state:
      "PRESENT",

    evidence_reference:
      "EVIDENCE:D125",

    replay_guard: {
      mode:
        "SINGLE_USE",

      replay_key_sha256:
        F,

      max_uses:
        1,

      usage_counter_ref:
        "COUNTER:D125",
    },

    genealogy: {
      derived_from:
        null,

      previous_state:
        null,

      new_state:
        "AUTHORIZED",

      cause:
        "TEST_AUTHORIZATION",

      evidence_reference:
        "EVIDENCE:D125",

      timestamp:
        "2026-09-01T14:00:00.000Z",

      hash:
        A,
    },
  };
}

describe(
  "Platform Core canonical authorization builder",
  () => {
    it(
      "builds and validates AUTHORIZATION",
      () => {
        const built =
          buildPlatformCoreCanonicalAuthorization(
            validInput(),
          );

        expect(
          validatePlatformCoreCanonicalSchema(
            "AUTHORIZATION",
            built,
          ).valid,
        ).toBe(true);

        expect(built.proto)
          .toBe(
            "HBCE-AUTHORIZATION-v1",
          );

        expect(built.kind)
          .toBe(
            "HBCE_CORE_AUTHORIZATION",
          );

        expect(built.version)
          .toBe("v1");

        expect(built.append_only)
          .toBe(true);

        expect(
          built.replay_guard
            .requires_atomic_consumption,
        ).toBe(true);

        expect(
          Object.values(
            built.boundary,
          ).every(
            (value) =>
              value === true,
          ),
        ).toBe(true);
      },
    );

    it(
      "uses the Platform Core payload hash utility",
      () => {
        const built =
          buildPlatformCoreCanonicalAuthorization(
            validInput(),
          );

        expect(
          built.payload_sha256,
        ).toBe(
          computePlatformCorePayloadSha256(
            built,
          ),
        );

        expect(
          verifyPlatformCorePayloadSha256(
            built,
          ),
        ).toBe(true);
      },
    );

    it(
      "emits lowercase raw hex64 without prefix",
      () => {
        const digest =
          buildPlatformCoreCanonicalAuthorization(
            validInput(),
          ).payload_sha256;

        expect(digest)
          .toMatch(
            /^[a-f0-9]{64}$/,
          );

        expect(
          digest.startsWith(
            "sha256:",
          ),
        ).toBe(false);
      },
    );

    it(
      "does not mutate caller input",
      () => {
        const input =
          validInput();

        const before =
          JSON.stringify(input);

        const built =
          buildPlatformCoreCanonicalAuthorization(
            input,
          );

        expect(
          JSON.stringify(input),
        ).toBe(before);

        expect(
          Object.prototype.hasOwnProperty.call(
            input.replay_guard,
            "requires_atomic_consumption",
          ),
        ).toBe(false);

        expect(
          built.replay_guard
            .requires_atomic_consumption,
        ).toBe(true);
      },
    );

    it(
      "ignores object insertion order for hashing",
      () => {
        const left =
          validInput();

        const base =
          validInput();

        const right:
          PlatformCoreCanonicalAuthorizationInput =
          {
            ...base,

            dependency_commitments: {
              capability_sha256: C,
              mandate_sha256: B,
              authority_sha256: A,
            },
          };

        expect(
          buildPlatformCoreCanonicalAuthorization(
            left,
          ).payload_sha256,
        ).toBe(
          buildPlatformCoreCanonicalAuthorization(
            right,
          ).payload_sha256,
        );
      },
    );

    it(
      "preserves array order as hash-significant",
      () => {
        const base =
          validInput();

        const left:
          PlatformCoreCanonicalAuthorizationInput =
          {
            ...base,

            decision_source: {
              ...base.decision_source,

              authorizer_refs: [
                "AUTHOR:D125:A",
                "AUTHOR:D125:B",
              ],
            },
          };

        const right:
          PlatformCoreCanonicalAuthorizationInput =
          {
            ...base,

            decision_source: {
              ...base.decision_source,

              authorizer_refs: [
                "AUTHOR:D125:B",
                "AUTHOR:D125:A",
              ],
            },
          };

        expect(
          buildPlatformCoreCanonicalAuthorization(
            left,
          ).payload_sha256,
        ).not.toBe(
          buildPlatformCoreCanonicalAuthorization(
            right,
          ).payload_sha256,
        );
      },
    );

    it(
      "fails closed on malformed AZN identifier",
      () => {
        const input:
          PlatformCoreCanonicalAuthorizationInput =
          {
            ...validInput(),
            authorization_id:
              "BAD-ID",
          };

        expect(() =>
          buildPlatformCoreCanonicalAuthorization(
            input,
          ),
        ).toThrow(
          PlatformCoreCanonicalAuthorizationBuilderError,
        );
      },
    );

    it(
      "fails closed when a required field is absent",
      () => {
        const input =
          {
            ...validInput(),
          } as unknown as
            Record<string, unknown>;

        delete input.authority_ref;

        expect(() =>
          buildPlatformCoreCanonicalAuthorization(
            input as unknown as
              PlatformCoreCanonicalAuthorizationInput,
          ),
        ).toThrow(
          PlatformCoreCanonicalAuthorizationBuilderError,
        );
      },
    );

    it(
      "fails closed for SINGLE_USE max_uses != 1",
      () => {
        const base =
          validInput();

        const input:
          PlatformCoreCanonicalAuthorizationInput =
          {
            ...base,

            replay_guard: {
              ...base.replay_guard,
              max_uses: 2,
            },
          };

        expect(() =>
          buildPlatformCoreCanonicalAuthorization(
            input,
          ),
        ).toThrow(
          PlatformCoreCanonicalAuthorizationBuilderError,
        );
      },
    );

    it(
      "fails closed for invalid AUTHORIZED evidence",
      () => {
        const base =
          validInput();

        const input:
          PlatformCoreCanonicalAuthorizationInput =
          {
            ...base,

            evidence_state:
              "MISSING",

            evidence_reference:
              null,

            replay_guard: {
              ...base.replay_guard,
              usage_counter_ref:
                null,
            },
          };

        expect(() =>
          buildPlatformCoreCanonicalAuthorization(
            input,
          ),
        ).toThrow(
          PlatformCoreCanonicalAuthorizationBuilderError,
        );
      },
    );

    it(
      "rejects caller boundary control",
      () => {
        const input =
          {
            ...validInput(),

            boundary: {
              fail_closed: false,
            },
          } as unknown as
            PlatformCoreCanonicalAuthorizationInput;

        expect(() =>
          buildPlatformCoreCanonicalAuthorization(
            input,
          ),
        ).toThrow(
          PlatformCoreCanonicalAuthorizationBuilderError,
        );
      },
    );

    it(
      "rejects caller payload_sha256 control",
      () => {
        const input =
          {
            ...validInput(),

            payload_sha256:
              "0".repeat(64),
          } as unknown as
            PlatformCoreCanonicalAuthorizationInput;

        expect(() =>
          buildPlatformCoreCanonicalAuthorization(
            input,
          ),
        ).toThrow(
          PlatformCoreCanonicalAuthorizationBuilderError,
        );
      },
    );

    it(
      "copies explicitly present optional fields",
      () => {
        const input:
          PlatformCoreCanonicalAuthorizationInput =
          {
            ...validInput(),

            revocation_reference:
              "REVOCATION:D125",

            supersedes:
              "AZN-D125:PREVIOUS",

            note:
              "CONTROLLED TEST NOTE",
          };

        const built =
          buildPlatformCoreCanonicalAuthorization(
            input,
          );

        expect(
          built.revocation_reference,
        ).toBe(
          "REVOCATION:D125",
        );

        expect(
          built.supersedes,
        ).toBe(
          "AZN-D125:PREVIOUS",
        );

        expect(
          built.note,
        ).toBe(
          "CONTROLLED TEST NOTE",
        );
      },
    );

    it(
      "preserves absence of optional fields",
      () => {
        const built =
          buildPlatformCoreCanonicalAuthorization(
            validInput(),
          );

        for (
          const field of [
            "revocation_reference",
            "supersedes",
            "note",
          ]
        ) {
          expect(
            Object.prototype.hasOwnProperty.call(
              built,
              field,
            ),
          ).toBe(false);
        }
      },
    );

    it(
      "distinguishes absence from explicit null",
      () => {
        const absent =
          buildPlatformCoreCanonicalAuthorization(
            validInput(),
          );

        const withNull:
          PlatformCoreCanonicalAuthorizationInput =
          {
            ...validInput(),
            note: null,
          };

        const explicitNull =
          buildPlatformCoreCanonicalAuthorization(
            withNull,
          );

        expect(
          Object.prototype.hasOwnProperty.call(
            absent,
            "note",
          ),
        ).toBe(false);

        expect(
          Object.prototype.hasOwnProperty.call(
            explicitNull,
            "note",
          ),
        ).toBe(true);

        expect(
          explicitNull.note,
        ).toBeNull();

        expect(
          absent.payload_sha256,
        ).not.toBe(
          explicitNull.payload_sha256,
        );
      },
    );
  },
);
