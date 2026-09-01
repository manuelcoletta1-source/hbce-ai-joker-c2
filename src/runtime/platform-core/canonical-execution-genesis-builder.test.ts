import {
  describe,
  expect,
  it,
} from "vitest";

import {
  buildPlatformCoreCanonicalAuthorization,
  type PlatformCoreCanonicalAuthorizationInput,
} from "./canonical-authorization-builder";

import {
  buildPlatformCoreCanonicalExecutionGenesis,
  PlatformCoreCanonicalExecutionGenesisBuilderError,
  type PlatformCoreCanonicalExecutionGenesisInput,
} from "./canonical-execution-genesis-builder";

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

function validAuthorizationInput():
  PlatformCoreCanonicalAuthorizationInput {
  return {
    authorization_id:
      "AZN-D145:TEST",

    authorization_version:
      1,

    principal_ref:
      "PRINCIPAL:D145",

    actor_ref:
      "ACTOR:D145",

    authority_ref:
      "AUT-D145:AUTHORITY",

    authority_version:
      1,

    mandate_ref:
      "MND-D145:MANDATE",

    mandate_version:
      1,

    capability_ref:
      "CAP-D145:CAPABILITY",

    capability_version:
      1,

    dependency_commitments: {
      authority_sha256: A,
      mandate_sha256: B,
      capability_sha256: C,
    },

    iospace_ref:
      "IOSPACE:D145",

    enforcement_point_ref:
      "ENFORCEMENT:D145",

    action_binding: {
      action_class:
        "ACTION:D145",

      target_ref:
        "TARGET:D145",

      action_sha256:
        D,

      request_sha256:
        E,
    },

    decision_source: {
      source_type:
        "HUMAN",

      authorizer_refs: [
        "AUTHOR:D145",
      ],
    },

    decision_basis: {
      policy_refs: [
        "POLICY:D145",
      ],

      condition_refs: [
        "CONDITION:D145",
      ],
    },

    state:
      "AUTHORIZED",

    decided_at:
      "2026-09-01T15:00:00.000Z",

    valid_from:
      "2026-09-01T15:00:00.000Z",

    valid_until:
      "2026-09-01T16:00:00.000Z",

    created_at:
      "2026-09-01T14:59:00.000Z",

    updated_at:
      "2026-09-01T15:00:00.000Z",

    evidence_state:
      "PRESENT",

    evidence_reference:
      "EVIDENCE:D145:AUTH",

    replay_guard: {
      mode:
        "SINGLE_USE",

      replay_key_sha256:
        F,

      max_uses:
        1,

      usage_counter_ref:
        "COUNTER:D145",
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
        "EVIDENCE:D145:AUTH",

      timestamp:
        "2026-09-01T15:00:00.000Z",

      hash:
        A,
    },
  };
}

const canonicalAuthorization =
  buildPlatformCoreCanonicalAuthorization(
    validAuthorizationInput(),
  );

function validGenesisInput():
  PlatformCoreCanonicalExecutionGenesisInput {
  return {
    execution_id:
      "EXE-D145:TEST",

    execution_engine_ref:
      "ENGINE:JOKER-C2",

    execution_action_sha256:
      D,

    execution_request_sha256:
      E,

    requested_at:
      "2026-09-01T15:01:00.000Z",

    precheck: {
      evaluated_at:
        "2026-09-01T15:01:01.000Z",

      validity_state:
        "VALID",

      authority_usability_state:
        "PASS",

      dependency_binding_state:
        "PASS",

      iospace_binding_state:
        "PASS",

      enforcement_point_binding_state:
        "PASS",

      replay_state:
        "AVAILABLE",

      decision:
        "ALLOW_EXECUTION",

      evidence_reference:
        "EVIDENCE:D145:PRECHECK",

      authorization_consumption_atomic:
        true,
    },

    state_before: {
      observation_state:
        "CAPTURED",

      state_ref:
        "STATE:D145:BEFORE",

      state_sha256:
        A,
    },

    state_after: {
      observation_state:
        "NOT_AVAILABLE",

      state_ref:
        null,

      state_sha256:
        null,
    },

    evidence_state:
      "PRESENT",

    evidence_reference:
      "EVIDENCE:D145:EXECUTION",

    outcome_reference:
      null,

    consequence_reference:
      null,

    evt_reference:
      null,

    opc_reference:
      null,

    genealogy: {
      cause:
        "EXECUTION_REQUEST_ACCEPTED_FOR_PRECHECK",

      evidence_reference:
        "EVIDENCE:D145:PRECHECK",

      timestamp:
        "2026-09-01T15:01:01.000Z",
    },
  };
}

describe(
  "Platform Core canonical execution genesis builder",
  () => {
    it(
      "builds and validates PENDING execution genesis",
      () => {
        const built =
          buildPlatformCoreCanonicalExecutionGenesis(
            validGenesisInput(),
            canonicalAuthorization,
          );

        expect(
          validatePlatformCoreCanonicalSchema(
            "EXECUTION",
            built,
          ).valid,
        ).toBe(true);

        expect(built.proto)
          .toBe("HBCE-EXECUTION-v1");

        expect(built.kind)
          .toBe("HBCE_CORE_EXECUTION");

        expect(built.version)
          .toBe("v1");

        expect(built.execution_version)
          .toBe(1);

        expect(built.state)
          .toBe("PENDING");

        expect(built.started_at)
          .toBeNull();

        expect(built.completed_at)
          .toBeNull();

        expect(built.append_only)
          .toBe(true);
      },
    );

    it(
      "uses the Platform Core payload hash utility",
      () => {
        const built =
          buildPlatformCoreCanonicalExecutionGenesis(
            validGenesisInput(),
            canonicalAuthorization,
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
      "binds exact canonical authorization identity",
      () => {
        const built =
          buildPlatformCoreCanonicalExecutionGenesis(
            validGenesisInput(),
            canonicalAuthorization,
          );

        expect(built.principal_ref)
          .toBe(
            canonicalAuthorization
              .principal_ref,
          );

        expect(built.actor_ref)
          .toBe(
            canonicalAuthorization
              .actor_ref,
          );

        expect(built.authorization_ref)
          .toBe(
            canonicalAuthorization
              .authorization_id,
          );

        expect(
          built.authorization_version,
        ).toBe(
          canonicalAuthorization
            .authorization_version,
        );

        expect(
          built.authorization_sha256,
        ).toBe(
          canonicalAuthorization
            .payload_sha256,
        );

        expect(built.iospace_ref)
          .toBe(
            canonicalAuthorization
              .iospace_ref,
          );

        expect(
          built.enforcement_point_ref,
        ).toBe(
          canonicalAuthorization
            .enforcement_point_ref,
        );
      },
    );

    it(
      "computes exact MATCH binding states",
      () => {
        const built =
          buildPlatformCoreCanonicalExecutionGenesis(
            validGenesisInput(),
            canonicalAuthorization,
          );

        expect(
          built.binding_check
            .action_match_state,
        ).toBe("MATCH");

        expect(
          built.binding_check
            .request_match_state,
        ).toBe("MATCH");
      },
    );

    it(
      "computes FAIL for action digest mismatch",
      () => {
        const input =
          validGenesisInput();

        const built =
          buildPlatformCoreCanonicalExecutionGenesis(
            {
              ...input,

              execution_action_sha256:
                A,
            },
            canonicalAuthorization,
          );

        expect(
          built.binding_check
            .action_match_state,
        ).toBe("FAIL");

        expect(
          built.binding_check
            .request_match_state,
        ).toBe("MATCH");
      },
    );

    it(
      "computes FAIL for request digest mismatch",
      () => {
        const input =
          validGenesisInput();

        const built =
          buildPlatformCoreCanonicalExecutionGenesis(
            {
              ...input,

              execution_request_sha256:
                B,
            },
            canonicalAuthorization,
          );

        expect(
          built.binding_check
            .action_match_state,
        ).toBe("MATCH");

        expect(
          built.binding_check
            .request_match_state,
        ).toBe("FAIL");
      },
    );

    it(
      "locks PENDING authorization consumption without fabricating consumption evidence",
      () => {
        const built =
          buildPlatformCoreCanonicalExecutionGenesis(
            validGenesisInput(),
            canonicalAuthorization,
          );

        expect(
          built.authorization_consumption
            .state,
        ).toBe("NOT_CONSUMED");

        expect(
          built.authorization_consumption
            .replay_key_sha256,
        ).toBe(
          canonicalAuthorization
            .replay_guard
            .replay_key_sha256,
        );

        expect(
          built.authorization_consumption
            .usage_counter_ref,
        ).toBe(
          canonicalAuthorization
            .replay_guard
            .usage_counter_ref,
        );

        expect(
          built.authorization_consumption
            .consumption_event_ref,
        ).toBeNull();

        expect(
          built.authorization_consumption
            .consumption_index,
        ).toBeNull();

        expect(
          built.authorization_consumption
            .consumed_at,
        ).toBeNull();

        expect(
          built.authorization_consumption
            .atomic,
        ).toBe(true);
      },
    );

    it(
      "locks genesis genealogy to authorization hash",
      () => {
        const built =
          buildPlatformCoreCanonicalExecutionGenesis(
            validGenesisInput(),
            canonicalAuthorization,
          );

        expect(
          built.genealogy.derived_from,
        ).toBeNull();

        expect(
          built.genealogy.previous_state,
        ).toBeNull();

        expect(
          built.genealogy.new_state,
        ).toBe("PENDING");

        expect(
          built.genealogy.hash,
        ).toBe(
          canonicalAuthorization
            .payload_sha256,
        );
      },
    );

    it(
      "does not mutate caller source or canonical authorization",
      () => {
        const input =
          validGenesisInput();

        const inputBefore =
          JSON.stringify(input);

        const authorizationBefore =
          JSON.stringify(
            canonicalAuthorization,
          );

        buildPlatformCoreCanonicalExecutionGenesis(
          input,
          canonicalAuthorization,
        );

        expect(
          JSON.stringify(input),
        ).toBe(inputBefore);

        expect(
          JSON.stringify(
            canonicalAuthorization,
          ),
        ).toBe(
          authorizationBefore,
        );
      },
    );

    it(
      "rejects caller control of reserved fields",
      () => {
        const input = {
          ...validGenesisInput(),

          payload_sha256:
            A,
        } as unknown as
          PlatformCoreCanonicalExecutionGenesisInput;

        expect(
          () =>
            buildPlatformCoreCanonicalExecutionGenesis(
              input,
              canonicalAuthorization,
            ),
        ).toThrowError(
          PlatformCoreCanonicalExecutionGenesisBuilderError,
        );

        try {
          buildPlatformCoreCanonicalExecutionGenesis(
            input,
            canonicalAuthorization,
          );
        } catch (error) {
          expect(error)
            .toBeInstanceOf(
              PlatformCoreCanonicalExecutionGenesisBuilderError,
            );

          expect(
            (
              error as
                PlatformCoreCanonicalExecutionGenesisBuilderError
            ).code,
          ).toBe("RESERVED_FIELD");
        }
      },
    );

    it(
      "rejects unsupported source fields",
      () => {
        const input = {
          ...validGenesisInput(),

          mystery:
            "NO",
        } as unknown as
          PlatformCoreCanonicalExecutionGenesisInput;

        expect(
          () =>
            buildPlatformCoreCanonicalExecutionGenesis(
              input,
              canonicalAuthorization,
            ),
        ).toThrowError(
          PlatformCoreCanonicalExecutionGenesisBuilderError,
        );
      },
    );

    it(
      "fails closed on malformed EXE identifier",
      () => {
        const input =
          validGenesisInput();

        expect(
          () =>
            buildPlatformCoreCanonicalExecutionGenesis(
              {
                ...input,

                execution_id:
                  "BAD-ID",
              },
              canonicalAuthorization,
            ),
        ).toThrowError(
          PlatformCoreCanonicalExecutionGenesisBuilderError,
        );
      },
    );

    it(
      "fails closed on malformed execution digest",
      () => {
        const input =
          validGenesisInput();

        expect(
          () =>
            buildPlatformCoreCanonicalExecutionGenesis(
              {
                ...input,

                execution_action_sha256:
                  "not-a-hash",
              },
              canonicalAuthorization,
            ),
        ).toThrowError(
          PlatformCoreCanonicalExecutionGenesisBuilderError,
        );
      },
    );

    it(
      "preserves absence of optional note",
      () => {
        const built =
          buildPlatformCoreCanonicalExecutionGenesis(
            validGenesisInput(),
            canonicalAuthorization,
          );

        expect(
          Object.prototype.hasOwnProperty.call(
            built,
            "note",
          ),
        ).toBe(false);
      },
    );

    it(
      "preserves explicit null note",
      () => {
        const built =
          buildPlatformCoreCanonicalExecutionGenesis(
            {
              ...validGenesisInput(),

              note:
                null,
            },
            canonicalAuthorization,
          );

        expect(
          Object.prototype.hasOwnProperty.call(
            built,
            "note",
          ),
        ).toBe(true);

        expect(built.note)
          .toBeNull();
      },
    );

    it(
      "emits all execution boundary controls as true",
      () => {
        const built =
          buildPlatformCoreCanonicalExecutionGenesis(
            validGenesisInput(),
            canonicalAuthorization,
          );

        expect(
          Object.keys(
            built.boundary,
          ),
        ).toHaveLength(32);

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
  },
);
