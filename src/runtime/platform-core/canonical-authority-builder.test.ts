import {
  describe,
  expect,
  it,
} from "vitest";

import {
  buildPlatformCoreCanonicalAuthorityGenesis,
  buildPlatformCoreCanonicalAuthoritySuccessor,
  PlatformCoreCanonicalAuthorityBuilderError,
  type PlatformCoreCanonicalAuthority,
  type PlatformCoreCanonicalAuthorityBuilderErrorCode,
  type PlatformCoreCanonicalAuthorityGenesisInput,
  type PlatformCoreCanonicalAuthoritySuccessorInput,
} from "./canonical-authority-builder";

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
  PlatformCoreCanonicalAuthorityGenesisInput {
  return {
    authority_id:
      "AUT-TEST:BUILDER",

    principal_ref:
      "PRINCIPAL:TEST:BUILDER",

    actor_ref:
      "ACTOR:TEST:BUILDER",

    mandate_ref:
      "MND-TEST:BUILDER",

    mandate_version:
      1,

    capability_ref:
      "CAP-TEST:BUILDER",

    capability_version:
      1,

    authority_source: {
      source_type:
        "SYSTEM_POLICY",

      source_ref:
        "POLICY:TEST:AUTHORITY",

      source_sha256:
        A,
    },

    scope: {
      action_classes: [
        "ACTION:TEST:AUTHORITY",
      ],

      target_refs: [
        "TARGET:TEST:AUTHORITY",
      ],

      iospace_refs: [
        "IOSPACE:TEST:AUTHORITY",
      ],

      constraint_refs: [
        "CONSTRAINT:TEST:AUTHORITY",
      ],
    },

    limits: {
      policy_refs: [
        "POLICY:TEST:LIMIT",
      ],

      quantitative_limit_refs: [
        "LIMIT:TEST:QUANTITATIVE",
      ],

      condition_refs: [
        "CONDITION:TEST:AUTHORITY",
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

    evidence_state:
      "PRESENT",

    evidence_reference:
      "EVIDENCE:TEST:AUTHORITY:GENESIS",

    genealogy: {
      cause:
        "AUTHORITY_GENESIS_TEST",

      evidence_reference:
        "EVIDENCE:TEST:AUTHORITY:GENESIS",

      timestamp:
        "2026-09-09T12:00:00.000Z",
    },
  };
}

function validSuccessorInput():
  PlatformCoreCanonicalAuthoritySuccessorInput {
  return {
    principal_ref:
      "PRINCIPAL:TEST:BUILDER",

    actor_ref:
      "ACTOR:TEST:BUILDER",

    mandate_ref:
      "MND-TEST:BUILDER",

    mandate_version:
      1,

    capability_ref:
      "CAP-TEST:BUILDER",

    capability_version:
      1,

    authority_source: {
      source_type:
        "SYSTEM_POLICY",

      source_ref:
        "POLICY:TEST:AUTHORITY",

      source_sha256:
        A,
    },

    scope: {
      action_classes: [
        "ACTION:TEST:AUTHORITY",
      ],

      target_refs: [
        "TARGET:TEST:AUTHORITY",
      ],

      iospace_refs: [
        "IOSPACE:TEST:AUTHORITY",
      ],

      constraint_refs: [
        "CONSTRAINT:TEST:AUTHORITY",
      ],
    },

    limits: {
      policy_refs: [
        "POLICY:TEST:LIMIT",
      ],

      quantitative_limit_refs: [
        "LIMIT:TEST:QUANTITATIVE",
      ],

      condition_refs: [
        "CONDITION:TEST:AUTHORITY",
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

    evidence_state:
      "PRESENT",

    evidence_reference:
      "EVIDENCE:TEST:AUTHORITY:SUCCESSOR",

    genealogy: {
      cause:
        "AUTHORITY_SUCCESSOR_TEST",

      evidence_reference:
        "EVIDENCE:TEST:AUTHORITY:SUCCESSOR",

      timestamp:
        "2026-09-09T12:01:00.000Z",
    },
  };
}

function buildGenesis():
  PlatformCoreCanonicalAuthority {
  return buildPlatformCoreCanonicalAuthorityGenesis(
    validGenesisInput(),
  );
}

function buildV2():
  PlatformCoreCanonicalAuthority {
  return buildPlatformCoreCanonicalAuthoritySuccessor(
    buildGenesis(),
    validSuccessorInput(),
  );
}

function expectBuilderFailure(
  operation:
    () => unknown,
  code:
    PlatformCoreCanonicalAuthorityBuilderErrorCode,
): PlatformCoreCanonicalAuthorityBuilderError {
  try {
    operation();
  } catch (
    error
  ) {
    expect(
      error,
    ).toBeInstanceOf(
      PlatformCoreCanonicalAuthorityBuilderError,
    );

    const typed =
      error as
        PlatformCoreCanonicalAuthorityBuilderError;

    expect(
      typed.code,
    ).toBe(
      code,
    );

    return typed;
  }

  throw new Error(
    `Expected PlatformCoreCanonicalAuthorityBuilderError with code ${code}.`,
  );
}

function rehashAuthority(
  candidate:
    PlatformCoreCanonicalAuthority,
): PlatformCoreCanonicalAuthority {
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
    PlatformCoreCanonicalAuthority;
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
  "canonical Authority builder",
  () => {
    it(
      "AB01 genesis core derivation",
      () => {
        const canonical =
          buildGenesis();

        expect(
          canonical.proto,
        ).toBe(
          "HBCE-AUTHORITY-v1",
        );

        expect(
          canonical.kind,
        ).toBe(
          "HBCE_CORE_AUTHORITY",
        );

        expect(
          canonical.version,
        ).toBe(
          "v1",
        );

        expect(
          canonical.authority_id,
        ).toBe(
          "AUT-TEST:BUILDER",
        );

        expect(
          canonical.authority_version,
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
      "AB02 genesis canonical validity",
      () => {
        const canonical =
          buildGenesis();

        const validation =
          validatePlatformCoreCanonicalSchema(
            "AUTHORITY",
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
      "AB03 genesis genealogy boundary and immutability",
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
            canonical.authority_source,
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
            canonical.limits,
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
      "AB04 genesis source commitment fail closed",
      () => {
        const input = {
          ...validGenesisInput(),

          authority_source: {
            ...validGenesisInput()
              .authority_source,

            source_sha256:
              null,
          },
        };

        expectBuilderFailure(
          () =>
            buildPlatformCoreCanonicalAuthorityGenesis(
              input,
            ),
          "GENESIS_SOURCE_COMMITMENT_REQUIRED",
        );
      },
    );

    it(
      "AB05 genesis unknown field fail closed",
      () => {
        const input = {
          ...validGenesisInput(),

          unsupported_field:
            "UNSUPPORTED",
        } as unknown as
          PlatformCoreCanonicalAuthorityGenesisInput;

        expectBuilderFailure(
          () =>
            buildPlatformCoreCanonicalAuthorityGenesis(
              input,
            ),
          "INVALID_INPUT",
        );
      },
    );

    it(
      "AB06 genesis reserved field fail closed",
      () => {
        const input = {
          ...validGenesisInput(),

          payload_sha256:
            A,
        } as unknown as
          PlatformCoreCanonicalAuthorityGenesisInput;

        expectBuilderFailure(
          () =>
            buildPlatformCoreCanonicalAuthorityGenesis(
              input,
            ),
          "RESERVED_FIELD",
        );
      },
    );

    it(
      "AB07 genesis static schema failure",
      () => {
        const input = {
          ...validGenesisInput(),

          note:
            42,
        } as unknown as
          PlatformCoreCanonicalAuthorityGenesisInput;

        expectBuilderFailure(
          () =>
            buildPlatformCoreCanonicalAuthorityGenesis(
              input,
            ),
          "STATIC_SCHEMA_VALIDATION_FAILED",
        );
      },
    );

    it(
      "AB08 genesis required field fail closed",
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
            buildPlatformCoreCanonicalAuthorityGenesis(
              input as unknown as
                PlatformCoreCanonicalAuthorityGenesisInput,
            ),
          "INVALID_INPUT",
        );
      },
    );

    it(
      "AB09 genesis genealogy reserved field fail closed",
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
          PlatformCoreCanonicalAuthorityGenesisInput;

        expectBuilderFailure(
          () =>
            buildPlatformCoreCanonicalAuthorityGenesis(
              input,
            ),
          "RESERVED_FIELD",
        );
      },
    );

    it(
      "AB10 genesis genealogy envelope fail closed",
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
          PlatformCoreCanonicalAuthorityGenesisInput;

        expectBuilderFailure(
          () =>
            buildPlatformCoreCanonicalAuthorityGenesis(
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
            buildPlatformCoreCanonicalAuthorityGenesis(
              missingRequired as unknown as
                PlatformCoreCanonicalAuthorityGenesisInput,
            ),
          "INVALID_INPUT",
        );
      },
    );

    it(
      "AB11 successor core revision derivation",
      () => {
        const predecessor =
          buildGenesis();

        const successor =
          buildPlatformCoreCanonicalAuthoritySuccessor(
            predecessor,
            validSuccessorInput(),
          );

        expect(
          successor.authority_id,
        ).toBe(
          predecessor.authority_id,
        );

        expect(
          successor.authority_version,
        ).toBe(
          predecessor.authority_version +
            1,
        );

        expect(
          successor.genealogy.derived_from,
        ).toBe(
          predecessor.authority_id,
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
      "AB12 successor canonical validity",
      () => {
        const successor =
          buildV2();

        const validation =
          validatePlatformCoreCanonicalSchema(
            "AUTHORITY",
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
      "AB13 invalid predecessor shape",
      () => {
        for (
          const invalid of
          [
            null,
            "AUTHORITY",
            42,
            [],
          ]
        ) {
          expectBuilderFailure(
            () =>
              buildPlatformCoreCanonicalAuthoritySuccessor(
                invalid,
                validSuccessorInput(),
              ),
            "INVALID_PREDECESSOR",
          );
        }
      },
    );

    it(
      "AB14 predecessor payload hash mismatch",
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
            buildPlatformCoreCanonicalAuthoritySuccessor(
              tampered,
              validSuccessorInput(),
            ),
          "PREDECESSOR_HASH_MISMATCH",
        );
      },
    );

    it(
      "AB15 successor reserved input fail closed",
      () => {
        const predecessor =
          buildGenesis();

        const input = {
          ...validSuccessorInput(),

          authority_id:
            predecessor.authority_id,
        } as unknown as
          PlatformCoreCanonicalAuthoritySuccessorInput;

        expectBuilderFailure(
          () =>
            buildPlatformCoreCanonicalAuthoritySuccessor(
              predecessor,
              input,
            ),
          "RESERVED_FIELD",
        );
      },
    );

    it(
      "AB16 successor controlled input fail closed",
      () => {
        const predecessor =
          buildGenesis();

        const unknownField = {
          ...validSuccessorInput(),

          unsupported_field:
            "UNSUPPORTED",
        } as unknown as
          PlatformCoreCanonicalAuthoritySuccessorInput;

        expectBuilderFailure(
          () =>
            buildPlatformCoreCanonicalAuthoritySuccessor(
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
            buildPlatformCoreCanonicalAuthoritySuccessor(
              predecessor,
              missingRequired as unknown as
                PlatformCoreCanonicalAuthoritySuccessorInput,
            ),
          "INVALID_INPUT",
        );
      },
    );

    it(
      "AB17 predecessor state and genealogy relation",
      () => {
        const predecessor =
          buildGenesis();

        const mutated =
          rehashAuthority({
            ...predecessor,

            state:
              "LIMITED",
          } as PlatformCoreCanonicalAuthority);

        expect(
          validatePlatformCoreCanonicalSchema(
            "AUTHORITY",
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
            buildPlatformCoreCanonicalAuthoritySuccessor(
              mutated,
              validSuccessorInput(),
            ),
          "INVALID_PREDECESSOR",
        );
      },
    );

    it(
      "AB18 version one predecessor local relations",
      () => {
        const predecessor =
          buildGenesis();

        const cases:
          readonly PlatformCoreCanonicalAuthority[] =
          [
            rehashAuthority({
              ...predecessor,

              genealogy: {
                ...predecessor.genealogy,

                derived_from:
                  predecessor.authority_id,
              },
            } as PlatformCoreCanonicalAuthority),

            rehashAuthority({
              ...predecessor,

              genealogy: {
                ...predecessor.genealogy,

                previous_state:
                  "ACTIVE",
              },
            } as PlatformCoreCanonicalAuthority),

            rehashAuthority({
              ...predecessor,

              authority_source: {
                ...predecessor.authority_source,

                source_sha256:
                  null,
              },
            } as PlatformCoreCanonicalAuthority),

            rehashAuthority({
              ...predecessor,

              genealogy: {
                ...predecessor.genealogy,

                hash:
                  differentHash(
                    A,
                  ),
              },
            } as PlatformCoreCanonicalAuthority),
          ];

        for (
          const mutated of
          cases
        ) {
          expect(
            validatePlatformCoreCanonicalSchema(
              "AUTHORITY",
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
              buildPlatformCoreCanonicalAuthoritySuccessor(
                mutated,
                validSuccessorInput(),
              ),
            "INVALID_PREDECESSOR",
          );
        }
      },
    );

    it(
      "AB19 version greater than one predecessor local relations",
      () => {
        const predecessor =
          buildV2();

        const cases:
          readonly PlatformCoreCanonicalAuthority[] =
          [
            rehashAuthority({
              ...predecessor,

              genealogy: {
                ...predecessor.genealogy,

                derived_from:
                  "AUT-TEST:OTHER",
              },
            } as PlatformCoreCanonicalAuthority),

            rehashAuthority({
              ...predecessor,

              genealogy: {
                ...predecessor.genealogy,

                previous_state:
                  null,
              },
            } as PlatformCoreCanonicalAuthority),
          ];

        for (
          const mutated of
          cases
        ) {
          expect(
            validatePlatformCoreCanonicalSchema(
              "AUTHORITY",
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
              buildPlatformCoreCanonicalAuthoritySuccessor(
                mutated,
                validSuccessorInput(),
              ),
            "INVALID_PREDECESSOR",
          );
        }
      },
    );

    it(
      "AB20 no unavailable prior revision proof claim",
      () => {
        const predecessor =
          buildV2();

        const altered =
          rehashAuthority({
            ...predecessor,

            genealogy: {
              ...predecessor.genealogy,

              hash:
                differentHash(
                  predecessor.genealogy.hash,
                ),
            },
          } as PlatformCoreCanonicalAuthority);

        expect(
          validatePlatformCoreCanonicalSchema(
            "AUTHORITY",
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
          buildPlatformCoreCanonicalAuthoritySuccessor(
            altered,
            validSuccessorInput(),
          );

        expect(
          successor.authority_version,
        ).toBe(
          altered.authority_version +
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
      "AB21 authority version exact increment representability",
      () => {
        const predecessor =
          buildV2();

        const rejected =
          rehashAuthority({
            ...predecessor,

            authority_version:
              Number.MAX_SAFE_INTEGER,
          } as PlatformCoreCanonicalAuthority);

        expect(
          validatePlatformCoreCanonicalSchema(
            "AUTHORITY",
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
            buildPlatformCoreCanonicalAuthoritySuccessor(
              rejected,
              validSuccessorInput(),
            ),
          "INVALID_PREDECESSOR",
        );

        const accepted =
          rehashAuthority({
            ...predecessor,

            authority_version:
              Number.MAX_SAFE_INTEGER -
              1,
          } as PlatformCoreCanonicalAuthority);

        expect(
          validatePlatformCoreCanonicalSchema(
            "AUTHORITY",
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
          buildPlatformCoreCanonicalAuthoritySuccessor(
            accepted,
            validSuccessorInput(),
          );

        expect(
          successor.authority_version,
        ).toBe(
          Number.MAX_SAFE_INTEGER,
        );

        expect(
          Number.isSafeInteger(
            successor.authority_version,
          ),
        ).toBe(
          true,
        );
      },
    );
  },
);
