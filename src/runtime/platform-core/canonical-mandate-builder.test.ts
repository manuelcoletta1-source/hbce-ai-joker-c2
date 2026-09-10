/*
 * HBCE PLATFORM G3-D109-R1
 * CANONICAL MANDATE BUILDER TEST — STRUCTURAL ANALOGUE CANDIDATE
 *
 * MATERIALIZATION ONLY.
 * MB01-MB21 SEMANTIC RECONCILIATION IS NOT CLAIMED BY THIS GATE.
 * NOT EXECUTED.
 */

import {
  describe,
  expect,
  it,
} from "vitest";

import {
  buildPlatformCoreCanonicalMandateGenesis,
  buildPlatformCoreCanonicalMandateSuccessor,
  PlatformCoreCanonicalMandateBuilderError,
  type PlatformCoreCanonicalMandate,
  type PlatformCoreCanonicalMandateBuilderErrorCode,
  type PlatformCoreCanonicalMandateGenesisInput,
  type PlatformCoreCanonicalMandateSuccessorInput,
} from "./canonical-mandate-builder";

import {
  computePlatformCorePayloadSha256,
  verifyPlatformCorePayloadSha256,
} from "./canonical-payload-hash";

import {
  validatePlatformCoreCanonicalSchema,
} from "./canonical-schema-validator";

const A =
  "a".repeat(64);

function validGenesisInput():
  PlatformCoreCanonicalMandateGenesisInput {
  return {
    mandate_id:
      "MND-TEST:BUILDER",

    principal_ref:
      "PRINCIPAL:TEST:BUILDER",

    actor_ref:
      "ACTOR:TEST:BUILDER",
    issuing_source: {
      source_type:
        "SYSTEM_POLICY",

      issuer_ref:
        "POLICY:TEST:MANDATE",

      source_sha256:
        A,
    },

    scope: {
      action_classes: [
        "ACTION:TEST:MANDATE",
      ],
      target_refs: [
        "TARGET:TEST:MANDATE",
      ],
      iospace_refs: [
        "IOSPACE:TEST:MANDATE",
      ],
    },
    constraints: {
      constraint_refs: [
        "CONSTRAINT:TEST:MANDATE",
      ],
      policy_refs: [
        "POLICY:TEST:LIMIT",
      ],
    },

    state:
      "ACTIVE",

    valid_from:
      "2026-09-09T12:00:00.000Z",

    valid_until:
      "2027-01-19T12:00:00.000Z",

    created_at:
      "2026-09-09T12:00:00.000Z",

    updated_at:
      "2026-09-09T12:00:00.000Z",
    evidence_reference:
      "EVIDENCE:TEST:MANDATE:GENESIS",

    genealogy: {
      cause:
        "MANDATE_GENESIS_TEST",

      evidence_reference:
        "EVIDENCE:TEST:MANDATE:GENESIS",

      timestamp:
        "2026-09-09T12:00:00.000Z",
    },
  };
}

function validSuccessorInput():
  PlatformCoreCanonicalMandateSuccessorInput {
  return {
    principal_ref:
      "PRINCIPAL:TEST:BUILDER",

    actor_ref:
      "ACTOR:TEST:BUILDER",
    issuing_source: {
      source_type:
        "SYSTEM_POLICY",

      issuer_ref:
        "POLICY:TEST:MANDATE",

      source_sha256:
        A,
    },

    scope: {
      action_classes: [
        "ACTION:TEST:MANDATE",
      ],
      target_refs: [
        "TARGET:TEST:MANDATE",
      ],
      iospace_refs: [
        "IOSPACE:TEST:MANDATE",
      ],
    },
    constraints: {
      constraint_refs: [
        "CONSTRAINT:TEST:MANDATE",
      ],
      policy_refs: [
        "POLICY:TEST:LIMIT",
      ],
    },

    state:
      "LIMITED",

    valid_from:
      "2026-09-09T12:00:00.000Z",

    valid_until:
      "2027-01-19T12:00:00.000Z",

    created_at:
      "2026-09-09T12:00:00.000Z",

    updated_at:
      "2026-09-09T12:01:00.000Z",
    evidence_reference:
      "EVIDENCE:TEST:MANDATE:SUCCESSOR",

    genealogy: {
      cause:
        "MANDATE_SUCCESSOR_TEST",

      evidence_reference:
        "EVIDENCE:TEST:MANDATE:SUCCESSOR",

      timestamp:
        "2026-09-09T12:01:00.000Z",
    },
  };
}

function buildGenesis():
  PlatformCoreCanonicalMandate {
  return buildPlatformCoreCanonicalMandateGenesis(
    validGenesisInput(),
  );
}

function buildV2():
  PlatformCoreCanonicalMandate {
  return buildPlatformCoreCanonicalMandateSuccessor(
    buildGenesis(),
    validSuccessorInput(),
  );
}

function expectBuilderFailure(
  operation:
    () => unknown,
  code:
    PlatformCoreCanonicalMandateBuilderErrorCode,
): PlatformCoreCanonicalMandateBuilderError {
  try {
    operation();
  } catch (
    error
  ) {
    expect(
      error,
    ).toBeInstanceOf(
      PlatformCoreCanonicalMandateBuilderError,
    );

    const typed =
      error as
        PlatformCoreCanonicalMandateBuilderError;

    expect(
      typed.code,
    ).toBe(
      code,
    );

    return typed;
  }

  throw new Error(
    `Expected PlatformCoreCanonicalMandateBuilderError with code ${code}.`,
  );
}

function rehashMandate(
  candidate:
    PlatformCoreCanonicalMandate,
): PlatformCoreCanonicalMandate {
  const preimage:
    Record<string, unknown> =
    {
      ...candidate,
    };

  delete preimage[
    "payload_sha256"
  ];

  return {
    ...preimage,

    payload_sha256:
      computePlatformCorePayloadSha256(
        preimage,
      ),
  } as unknown as
    PlatformCoreCanonicalMandate;
}

function differentHash(
  value:
    string,
): string {
  return (
    (
      value.startsWith(
        "a",
      )
        ? "b"
        : "a"
    )
    +
    value.slice(
      1,
    )
  );
}

describe(
  "canonical Mandate builder",
  () => {
    it(
      "MB01 genesis core derivation",
      () => {
        const canonical =
          buildGenesis();

        expect(
          canonical.proto,
        ).toBe(
          "HBCE-MANDATE-v1",
        );

        expect(
          canonical.kind,
        ).toBe(
          "HBCE_CORE_MANDATE",
        );

        expect(
          canonical.version,
        ).toBe(
          "v1",
        );

        expect(
          canonical.mandate_id,
        ).toBe(
          "MND-TEST:BUILDER",
        );

        expect(
          canonical.mandate_version,
        ).toBe(
          1,
        );

        expect(
          canonical.append_only,
        ).toBe(
          true,
        );
      },
    );

    it(
      "MB02 genesis canonical validity",
      () => {
        const canonical =
          buildGenesis();

        const validation =
          validatePlatformCoreCanonicalSchema(
            "MANDATE",
            canonical,
          );

        expect(
          validation.valid,
        ).toBe(
          true,
        );

        expect(
          verifyPlatformCorePayloadSha256(
            canonical,
          ),
        ).toBe(
          true,
        );
      },
    );

    it(
      "MB03 genesis genealogy boundary and immutability",
      () => {
        const canonical =
          buildGenesis();

        expect(
          canonical.genealogy.derived_from,
        ).toBeNull();

        expect(
          canonical.genealogy.previous_state,
        ).toBeNull();

        expect(
          canonical.genealogy.new_state,
        ).toBe(
          canonical.state,
        );

        expect(
          canonical.genealogy.hash,
        ).toBe(
          A,
        );

        for (
          const value of
          Object.values(
            canonical.boundary,
          )
        ) {
          expect(
            value,
          ).toBe(
            true,
          );
        }

        expect(
          Object.isFrozen(
            canonical,
          ),
        ).toBe(
          true,
        );

        expect(
          Object.isFrozen(
            canonical.issuing_source,
          ),
        ).toBe(
          true,
        );

        expect(
          Object.isFrozen(
            canonical.scope,
          ),
        ).toBe(
          true,
        );

        expect(
          Object.isFrozen(
            canonical.scope.action_classes,
          ),
        ).toBe(
          true,
        );

        expect(
          Object.isFrozen(
            canonical.constraints,
          ),
        ).toBe(
          true,
        );

        expect(
          Object.isFrozen(
            canonical.genealogy,
          ),
        ).toBe(
          true,
        );

        expect(
          Object.isFrozen(
            canonical.boundary,
          ),
        ).toBe(
          true,
        );
      },
    );

    it(
      "MB04 genesis source commitment fail closed",
      () => {
        const input = {
          ...validGenesisInput(),

          issuing_source: {
            ...validGenesisInput()
              .issuing_source,

            source_sha256:
              null,
          },
        };

        expectBuilderFailure(
          () =>
            buildPlatformCoreCanonicalMandateGenesis(
              input,
            ),
          "GENESIS_SOURCE_COMMITMENT_REQUIRED",
        );
      },
    );

    it(
      "MB05 genesis unknown field fail closed",
      () => {
        const input = {
          ...validGenesisInput(),

          unsupported_field:
            "UNSUPPORTED",
        } as unknown as
          PlatformCoreCanonicalMandateGenesisInput;

        expectBuilderFailure(
          () =>
            buildPlatformCoreCanonicalMandateGenesis(
              input,
            ),
          "INVALID_INPUT",
        );
      },
    );

    it(
      "MB06 genesis reserved field fail closed",
      () => {
        const input = {
          ...validGenesisInput(),

          payload_sha256:
            A,
        } as unknown as
          PlatformCoreCanonicalMandateGenesisInput;

        expectBuilderFailure(
          () =>
            buildPlatformCoreCanonicalMandateGenesis(
              input,
            ),
          "RESERVED_FIELD",
        );
      },
    );

    it(
      "MB07 genesis static schema failure",
      () => {
        const input = {
          ...validGenesisInput(),

          note:
            42,
        } as unknown as
          PlatformCoreCanonicalMandateGenesisInput;

        expectBuilderFailure(
          () =>
            buildPlatformCoreCanonicalMandateGenesis(
              input,
            ),
          "STATIC_SCHEMA_VALIDATION_FAILED",
        );
      },
    );

    it(
      "MB08 genesis required field fail closed",
      () => {
        const input = {
          ...validGenesisInput(),
        } as Record<
          string,
          unknown
        >;

        delete input[
          "actor_ref"
        ];

        expectBuilderFailure(
          () =>
            buildPlatformCoreCanonicalMandateGenesis(
              input as unknown as
                PlatformCoreCanonicalMandateGenesisInput,
            ),
          "INVALID_INPUT",
        );
      },
    );

    it(
      "MB09 genesis genealogy reserved field fail closed",
      () => {
        const input = {
          ...validGenesisInput(),

          genealogy: {
            ...validGenesisInput()
              .genealogy,

            derived_from:
              null,
          },
        } as unknown as
          PlatformCoreCanonicalMandateGenesisInput;

        expectBuilderFailure(
          () =>
            buildPlatformCoreCanonicalMandateGenesis(
              input,
            ),
          "RESERVED_FIELD",
        );
      },
    );

    it(
      "MB10 genesis genealogy envelope fail closed",
      () => {
        const unknownField = {
          ...validGenesisInput(),

          genealogy: {
            ...validGenesisInput()
              .genealogy,

            unsupported_genealogy_field:
              "UNSUPPORTED",
          },
        } as unknown as
          PlatformCoreCanonicalMandateGenesisInput;

        expectBuilderFailure(
          () =>
            buildPlatformCoreCanonicalMandateGenesis(
              unknownField,
            ),
          "INVALID_INPUT",
        );

        const missingRequired = {
          ...validGenesisInput(),

          genealogy: {
            ...validGenesisInput()
              .genealogy,
          },
        } as Record<
          string,
          unknown
        >;

        const genealogy =
          {
            ...(
              missingRequired[
                "genealogy"
              ] as Record<
                string,
                unknown
              >
            ),
          };

        delete genealogy[
          "timestamp"
        ];

        missingRequired[
          "genealogy"
        ] =
          genealogy;

        expectBuilderFailure(
          () =>
            buildPlatformCoreCanonicalMandateGenesis(
              missingRequired as unknown as
                PlatformCoreCanonicalMandateGenesisInput,
            ),
          "INVALID_INPUT",
        );
      },
    );

    it(
      "MB11 successor core revision derivation",
      () => {
        const predecessor =
          buildGenesis();

        const successor =
          buildPlatformCoreCanonicalMandateSuccessor(
            predecessor,
            validSuccessorInput(),
          );

        expect(
          successor.mandate_id,
        ).toBe(
          predecessor.mandate_id,
        );

        expect(
          successor.mandate_version,
        ).toBe(
          predecessor.mandate_version +
            1,
        );

        expect(
          successor.genealogy.derived_from,
        ).toBe(
          predecessor.mandate_id,
        );

        expect(
          successor.genealogy.previous_state,
        ).toBe(
          predecessor.state,
        );

        expect(
          successor.genealogy.new_state,
        ).toBe(
          successor.state,
        );

        expect(
          successor.genealogy.hash,
        ).toBe(
          predecessor.payload_sha256,
        );
      },
    );

    it(
      "MB12 successor canonical validity",
      () => {
        const successor =
          buildV2();

        const validation =
          validatePlatformCoreCanonicalSchema(
            "MANDATE",
            successor,
          );

        expect(
          validation.valid,
        ).toBe(
          true,
        );

        expect(
          verifyPlatformCorePayloadSha256(
            successor,
          ),
        ).toBe(
          true,
        );
      },
    );

    it(
      "MB13 invalid predecessor shape",
      () => {
        for (
          const invalid of
          [
            null,
            "MANDATE",
            42,
            [],
          ]
        ) {
          expectBuilderFailure(
            () =>
              buildPlatformCoreCanonicalMandateSuccessor(
                invalid,
                validSuccessorInput(),
              ),
            "INVALID_PREDECESSOR",
          );
        }
      },
    );

    it(
      "MB14 predecessor payload hash mismatch",
      () => {
        const predecessor =
          buildGenesis();

        const tampered = {
          ...predecessor,

          payload_sha256:
            differentHash(
              predecessor.payload_sha256,
            ),
        };

        expectBuilderFailure(
          () =>
            buildPlatformCoreCanonicalMandateSuccessor(
              tampered,
              validSuccessorInput(),
            ),
          "PREDECESSOR_HASH_MISMATCH",
        );
      },
    );

    it(
      "MB15 successor reserved input fail closed",
      () => {
        const predecessor =
          buildGenesis();

        const input = {
          ...validSuccessorInput(),

          mandate_id:
            predecessor.mandate_id,
        } as unknown as
          PlatformCoreCanonicalMandateSuccessorInput;

        expectBuilderFailure(
          () =>
            buildPlatformCoreCanonicalMandateSuccessor(
              predecessor,
              input,
            ),
          "RESERVED_FIELD",
        );
      },
    );

    it(
      "MB16 successor controlled input fail closed",
      () => {
        const predecessor =
          buildGenesis();

        const unknownField = {
          ...validSuccessorInput(),

          unsupported_field:
            "UNSUPPORTED",
        } as unknown as
          PlatformCoreCanonicalMandateSuccessorInput;

        expectBuilderFailure(
          () =>
            buildPlatformCoreCanonicalMandateSuccessor(
              predecessor,
              unknownField,
            ),
          "INVALID_INPUT",
        );

        const missingRequired = {
          ...validSuccessorInput(),
        } as Record<
          string,
          unknown
        >;

        delete missingRequired[
          "state"
        ];

        expectBuilderFailure(
          () =>
            buildPlatformCoreCanonicalMandateSuccessor(
              predecessor,
              missingRequired as unknown as
                PlatformCoreCanonicalMandateSuccessorInput,
            ),
          "INVALID_INPUT",
        );
      },
    );

    it(
      "MB17 predecessor state and genealogy relation",
      () => {
        const predecessor =
          buildGenesis();

        const mutated =
          rehashMandate({
            ...predecessor,

            state:
              "LIMITED",
          } as PlatformCoreCanonicalMandate);

        expect(
          validatePlatformCoreCanonicalSchema(
            "MANDATE",
            mutated,
          ).valid,
        ).toBe(
          true,
        );

        expect(
          verifyPlatformCorePayloadSha256(
            mutated,
          ),
        ).toBe(
          true,
        );

        expectBuilderFailure(
          () =>
            buildPlatformCoreCanonicalMandateSuccessor(
              mutated,
              validSuccessorInput(),
            ),
          "INVALID_PREDECESSOR",
        );
      },
    );

    it(
      "MB18 version one predecessor local relations",
      () => {
        const predecessor =
          buildGenesis();

        const cases:
          readonly PlatformCoreCanonicalMandate[] =
          [
            rehashMandate({
              ...predecessor,

              genealogy: {
                ...predecessor.genealogy,

                derived_from:
                  predecessor.mandate_id,
              },
            } as PlatformCoreCanonicalMandate),

            rehashMandate({
              ...predecessor,

              genealogy: {
                ...predecessor.genealogy,

                previous_state:
                  "ACTIVE",
              },
            } as PlatformCoreCanonicalMandate),

            rehashMandate({
              ...predecessor,

              issuing_source: {
                ...predecessor.issuing_source,

                source_sha256:
                  null,
              },
            } as PlatformCoreCanonicalMandate),

            rehashMandate({
              ...predecessor,

              genealogy: {
                ...predecessor.genealogy,

                hash:
                  differentHash(
                    A,
                  ),
              },
            } as PlatformCoreCanonicalMandate),
          ];

        for (
          const mutated of
          cases
        ) {
          expect(
            validatePlatformCoreCanonicalSchema(
              "MANDATE",
              mutated,
            ).valid,
          ).toBe(
            true,
          );

          expect(
            verifyPlatformCorePayloadSha256(
              mutated,
            ),
          ).toBe(
            true,
          );

          expectBuilderFailure(
            () =>
              buildPlatformCoreCanonicalMandateSuccessor(
                mutated,
                validSuccessorInput(),
              ),
            "INVALID_PREDECESSOR",
          );
        }
      },
    );

    it(
      "MB19 version greater than one predecessor local relations",
      () => {
        const predecessor =
          buildV2();

        const cases:
          readonly PlatformCoreCanonicalMandate[] =
          [
            rehashMandate({
              ...predecessor,

              genealogy: {
                ...predecessor.genealogy,

                derived_from:
                  "MND-TEST:OTHER",
              },
            } as PlatformCoreCanonicalMandate),

            rehashMandate({
              ...predecessor,

              genealogy: {
                ...predecessor.genealogy,

                previous_state:
                  null,
              },
            } as PlatformCoreCanonicalMandate),
          ];

        for (
          const mutated of
          cases
        ) {
          expect(
            validatePlatformCoreCanonicalSchema(
              "MANDATE",
              mutated,
            ).valid,
          ).toBe(
            true,
          );

          expect(
            verifyPlatformCorePayloadSha256(
              mutated,
            ),
          ).toBe(
            true,
          );

          expectBuilderFailure(
            () =>
              buildPlatformCoreCanonicalMandateSuccessor(
                mutated,
                validSuccessorInput(),
              ),
            "INVALID_PREDECESSOR",
          );
        }
      },
    );

    it(
      "MB20 no unavailable prior revision proof claim",
      () => {
        const predecessor =
          buildV2();

        const altered =
          rehashMandate({
            ...predecessor,

            genealogy: {
              ...predecessor.genealogy,

              hash:
                differentHash(
                  predecessor.genealogy.hash,
                ),
            },
          } as PlatformCoreCanonicalMandate);

        expect(
          validatePlatformCoreCanonicalSchema(
            "MANDATE",
            altered,
          ).valid,
        ).toBe(
          true,
        );

        expect(
          verifyPlatformCorePayloadSha256(
            altered,
          ),
        ).toBe(
          true,
        );

        const successor =
          buildPlatformCoreCanonicalMandateSuccessor(
            altered,
            validSuccessorInput(),
          );

        expect(
          successor.mandate_version,
        ).toBe(
          altered.mandate_version +
            1,
        );

        expect(
          successor.genealogy.hash,
        ).toBe(
          altered.payload_sha256,
        );
      },
    );

    it(
      "MB21 mandate version exact increment representability",
      () => {
        const predecessor =
          buildV2();

        const rejected =
          rehashMandate({
            ...predecessor,

            mandate_version:
              Number.MAX_SAFE_INTEGER,
          } as PlatformCoreCanonicalMandate);

        expect(
          validatePlatformCoreCanonicalSchema(
            "MANDATE",
            rejected,
          ).valid,
        ).toBe(
          true,
        );

        expect(
          verifyPlatformCorePayloadSha256(
            rejected,
          ),
        ).toBe(
          true,
        );

        expectBuilderFailure(
          () =>
            buildPlatformCoreCanonicalMandateSuccessor(
              rejected,
              validSuccessorInput(),
            ),
          "INVALID_PREDECESSOR",
        );

        const accepted =
          rehashMandate({
            ...predecessor,

            mandate_version:
              Number.MAX_SAFE_INTEGER -
              1,
          } as PlatformCoreCanonicalMandate);

        expect(
          validatePlatformCoreCanonicalSchema(
            "MANDATE",
            accepted,
          ).valid,
        ).toBe(
          true,
        );

        expect(
          verifyPlatformCorePayloadSha256(
            accepted,
          ),
        ).toBe(
          true,
        );

        const successor =
          buildPlatformCoreCanonicalMandateSuccessor(
            accepted,
            validSuccessorInput(),
          );

        expect(
          successor.mandate_version,
        ).toBe(
          Number.MAX_SAFE_INTEGER,
        );

        expect(
          Number.isSafeInteger(
            successor.mandate_version,
          ),
        ).toBe(
          true,
        );
      },
    );
  },
);
