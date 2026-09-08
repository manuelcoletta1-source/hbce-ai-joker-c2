import {
  describe,
  expect,
  it,
} from "vitest";

import {
  buildPlatformCoreCanonicalEvidenceSetGenesis,
  buildPlatformCoreCanonicalEvidenceSetSuccessor,
  PlatformCoreCanonicalEvidenceSetBuilderError,
  type PlatformCoreCanonicalEvidenceSet,
  type PlatformCoreCanonicalEvidenceSetGenesisInput,
  type PlatformCoreCanonicalEvidenceSetSuccessorInput,
} from "./canonical-evidence-set-builder";

import {
  verifyPlatformCorePayloadSha256,
} from "./canonical-payload-hash";

import {
  validatePlatformCoreCanonicalSchema,
} from "./canonical-schema-validator";

const A =
  "a".repeat(64);

const B =
  "b".repeat(64);

const C =
  "c".repeat(64);

function validGenesisInput():
  PlatformCoreCanonicalEvidenceSetGenesisInput {
  return {
    evidence_set_id:
      "EVS-D023:CASE",

    case_id:
      "EXT-CASE-D023",

    domain:
      "external_system_validation",

    target: {
      target_class:
        "controlled_system",

      target_ref:
        "TARGET:D023",

      system_ref:
        "SYSTEM:D023",
    },

    owner_subject_ref:
      "SUBJECT:D023",

    authority_ref:
      "AUT-D023:AUTHORITY",

    authority_version:
      1,

    authority_sha256:
      A,

    created_at:
      "2026-09-08T08:00:00.000Z",

    evidence_state:
      "PRESENT",

    evidence_reference:
      "EVIDENCE:D023:GENESIS",

    control_references: [
      "CONTROL:D023:1",
    ],

    observation_references: [],

    artifact_references: [],

    external_confirmation_references: [],

    event_references: [
      "EVENT:D023:1",
    ],

    evt_reference:
      "EVT:D023:1",

    opc_reference:
      "OPC:D023:1",

    genealogy: {
      cause:
        "D023_GENESIS",

      evidence_reference:
        "EVIDENCE:D023:GENESIS",

      timestamp:
        "2026-09-08T08:00:00.000Z",
    },
  };
}

function openSuccessorInput():
  PlatformCoreCanonicalEvidenceSetSuccessorInput {
  return {
    state:
      "OPEN",

    finalized_at:
      null,

    result_reference:
      null,

    evidence_state:
      "PRESENT",

    evidence_reference:
      "EVIDENCE:D023:OPEN:2",

    control_references: [
      "CONTROL:D023:1",
    ],

    observation_references: [
      "OBSERVATION:D023:1",
    ],

    artifact_references: [
      "ARTIFACT:D023:1",
    ],

    external_confirmation_references: [],

    event_references: [
      "EVENT:D023:1",
      "EVENT:D023:2",
    ],

    evt_reference:
      "EVT:D023:2",

    opc_reference:
      "OPC:D023:2",

    genealogy: {
      cause:
        "D023_OPEN_REVISION",

      evidence_reference:
        "EVIDENCE:D023:OPEN:2",

      timestamp:
        "2026-09-08T08:01:00.000Z",
    },
  };
}

function closedSuccessorInput():
  PlatformCoreCanonicalEvidenceSetSuccessorInput {
  return {
    state:
      "CLOSED",

    finalized_at:
      "2026-09-08T08:02:00.000Z",

    result_reference:
      "RESULT:D023:1",

    evidence_state:
      "PRESENT",

    evidence_reference:
      "EVIDENCE:D023:CLOSED:2",

    control_references: [
      "CONTROL:D023:1",
    ],

    observation_references: [
      "OBSERVATION:D023:1",
    ],

    artifact_references: [
      "ARTIFACT:D023:1",
    ],

    external_confirmation_references: [
      "CONFIRMATION:D023:1",
    ],

    event_references: [
      "EVENT:D023:1",
      "EVENT:D023:2",
    ],

    evt_reference:
      "EVT:D023:2",

    opc_reference:
      "OPC:D023:2",

    genealogy: {
      cause:
        "D023_FINALIZE",

      evidence_reference:
        "EVIDENCE:D023:CLOSED:2",

      timestamp:
        "2026-09-08T08:02:00.000Z",
    },
  };
}

function closedContinuationInput(
  predecessor:
    PlatformCoreCanonicalEvidenceSet,
):
  PlatformCoreCanonicalEvidenceSetSuccessorInput {
  return {
    state:
      "CLOSED",

    finalized_at:
      predecessor.finalized_at,

    result_reference:
      predecessor.result_reference,

    evidence_state:
      "PRESENT",

    evidence_reference:
      "EVIDENCE:D023:CLOSED:3",

    control_references: [
      ...predecessor.control_references,
    ],

    observation_references: [
      ...predecessor.observation_references,
      "OBSERVATION:D023:2",
    ],

    artifact_references: [
      ...predecessor.artifact_references,
    ],

    external_confirmation_references: [
      ...predecessor.external_confirmation_references,
      "CONFIRMATION:D023:2",
    ],

    event_references: [
      ...predecessor.event_references,
      "EVENT:D023:3",
    ],

    evt_reference:
      "EVT:D023:3",

    opc_reference:
      "OPC:D023:3",

    genealogy: {
      cause:
        "D023_CLOSED_APPEND",

      evidence_reference:
        "EVIDENCE:D023:CLOSED:3",

      timestamp:
        "2026-09-08T08:03:00.000Z",
    },
  };
}

function buildGenesis():
  PlatformCoreCanonicalEvidenceSet {
  return buildPlatformCoreCanonicalEvidenceSetGenesis(
    validGenesisInput(),
  );
}

function buildClosed():
  PlatformCoreCanonicalEvidenceSet {
  return buildPlatformCoreCanonicalEvidenceSetSuccessor(
    buildGenesis(),
    closedSuccessorInput(),
  );
}

function staticValidationAccepted(
  result:
    unknown,
): boolean {
  if (
    result === null ||
    typeof result !==
      "object"
  ) {
    throw new Error(
      "HBCE_D023_STATIC_VALIDATOR_RESULT_INVALID",
    );
  }

  const record =
    result as Record<
      string,
      unknown
    >;

  for (
    const key of [
      "valid",
      "ok",
      "success",
    ] as const
  ) {
    if (
      typeof record[key] ===
      "boolean"
    ) {
      return record[key];
    }
  }

  throw new Error(
    "HBCE_D023_STATIC_VALIDATOR_BOOLEAN_DISCRIMINATOR_MISSING",
  );
}

function staticAccepts(
  value:
    unknown,
): boolean {
  return staticValidationAccepted(
    validatePlatformCoreCanonicalSchema(
      "EVIDENCE_SET",
      value,
    ),
  );
}

function expectBuilderError(
  operation:
    () => unknown,
  code:
    PlatformCoreCanonicalEvidenceSetBuilderError["code"],
): void {
  let captured:
    unknown;

  try {
    operation();
  } catch (error) {
    captured =
      error;
  }

  expect(
    captured,
  ).toBeInstanceOf(
    PlatformCoreCanonicalEvidenceSetBuilderError,
  );

  expect(
    (
      captured as
        PlatformCoreCanonicalEvidenceSetBuilderError
    ).code,
  ).toBe(
    code,
  );
}

function isDeepFrozen(
  value:
    unknown,
  seen:
    WeakSet<object> =
      new WeakSet<object>(),
): boolean {
  if (
    value === null ||
    typeof value !==
      "object"
  ) {
    return true;
  }

  const object =
    value as object;

  if (
    seen.has(
      object,
    )
  ) {
    return true;
  }

  seen.add(
    object,
  );

  if (
    !Object.isFrozen(
      object,
    )
  ) {
    return false;
  }

  for (
    const key of
    Reflect.ownKeys(
      object,
    )
  ) {
    const descriptor =
      Object.getOwnPropertyDescriptor(
        object,
        key,
      );

    if (
      descriptor !== undefined &&
      Object.prototype.hasOwnProperty.call(
        descriptor,
        "value",
      ) &&
      !isDeepFrozen(
        descriptor.value,
        seen,
      )
    ) {
      return false;
    }
  }

  return true;
}

describe(
  "Platform Core canonical EvidenceSet builder",
  () => {
    it(
      "T01 builds a valid OPEN genesis",
      () => {
        const built =
          buildGenesis();

        expect(
          built.proto,
        ).toBe(
          "HBCE-EVIDENCE-SET-v1",
        );

        expect(
          built.kind,
        ).toBe(
          "HBCE_CORE_EVIDENCE_SET",
        );

        expect(
          built.version,
        ).toBe(
          "v1",
        );

        expect(
          built.evidence_set_version,
        ).toBe(1);

        expect(
          built.state,
        ).toBe(
          "OPEN",
        );

        expect(
          built.finalized_at,
        ).toBeNull();

        expect(
          built.result_reference,
        ).toBeNull();

        expect(
          built.append_only,
        ).toBe(true);
      },
    );

    it(
      "T02 genesis statically validates as EVIDENCE_SET",
      () => {
        expect(
          staticAccepts(
            buildGenesis(),
          ),
        ).toBe(true);
      },
    );

    it(
      "T03 genesis payload_sha256 verifies with canonical hash utility",
      () => {
        expect(
          verifyPlatformCorePayloadSha256(
            buildGenesis(),
          ),
        ).toBe(true);
      },
    );

    it(
      "T04 genesis genealogy hash equals authority_sha256",
      () => {
        const built =
          buildGenesis();

        expect(
          built.genealogy.hash,
        ).toBe(
          built.authority_sha256,
        );

        expect(
          built.genealogy.derived_from,
        ).toBeNull();

        expect(
          built.genealogy.previous_state,
        ).toBeNull();

        expect(
          built.genealogy.new_state,
        ).toBe(
          "OPEN",
        );
      },
    );

    it(
      "T05 genesis result is deeply immutable",
      () => {
        expect(
          isDeepFrozen(
            buildGenesis(),
          ),
        ).toBe(true);
      },
    );

    it(
      "T06 genesis does not mutate caller input",
      () => {
        const input =
          validGenesisInput();

        const before =
          structuredClone(
            input,
          );

        buildPlatformCoreCanonicalEvidenceSetGenesis(
          input,
        );

        expect(
          input,
        ).toEqual(
          before,
        );
      },
    );

    it(
      "T07 rejects caller-controlled genesis payload_sha256",
      () => {
        const input:
          Record<string, unknown> =
          {
            ...validGenesisInput(),

            payload_sha256:
              B,
          };

        expectBuilderError(
          () =>
            buildPlatformCoreCanonicalEvidenceSetGenesis(
              input as unknown as
                PlatformCoreCanonicalEvidenceSetGenesisInput,
            ),
          "RESERVED_FIELD_CONTROL",
        );
      },
    );

    it(
      "T08 rejects caller-controlled genesis boundary",
      () => {
        const input:
          Record<string, unknown> =
          {
            ...validGenesisInput(),

            boundary: {
              fail_closed:
                false,
            },
          };

        expectBuilderError(
          () =>
            buildPlatformCoreCanonicalEvidenceSetGenesis(
              input as unknown as
                PlatformCoreCanonicalEvidenceSetGenesisInput,
            ),
          "RESERVED_FIELD_CONTROL",
        );
      },
    );

    it(
      "T09 rejects malformed required authority material",
      () => {
        const input =
          {
            ...validGenesisInput(),

            authority_ref:
              "AUTHORITY-NOT-CANONICAL",
          };

        expectBuilderError(
          () =>
            buildPlatformCoreCanonicalEvidenceSetGenesis(
              input,
            ),
          "STATIC_SCHEMA_VALIDATION_FAILED",
        );
      },
    );

    it(
      "T10 rejects schema-invalid evidence reference material",
      () => {
        const input =
          {
            ...validGenesisInput(),

            control_references: [],
          };

        expectBuilderError(
          () =>
            buildPlatformCoreCanonicalEvidenceSetGenesis(
              input,
            ),
          "STATIC_SCHEMA_VALIDATION_FAILED",
        );
      },
    );

    it(
      "T11 builds OPEN v1 to OPEN v2",
      () => {
        const predecessor =
          buildGenesis();

        const successor =
          buildPlatformCoreCanonicalEvidenceSetSuccessor(
            predecessor,
            openSuccessorInput(),
          );

        expect(
          successor.evidence_set_version,
        ).toBe(2);

        expect(
          successor.state,
        ).toBe(
          "OPEN",
        );

        expect(
          successor.finalized_at,
        ).toBeNull();

        expect(
          successor.result_reference,
        ).toBeNull();

        expect(
          staticAccepts(
            successor,
          ),
        ).toBe(true);
      },
    );

    it(
      "T12 builds OPEN v1 to CLOSED v2",
      () => {
        const successor =
          buildPlatformCoreCanonicalEvidenceSetSuccessor(
            buildGenesis(),
            closedSuccessorInput(),
          );

        expect(
          successor.evidence_set_version,
        ).toBe(2);

        expect(
          successor.state,
        ).toBe(
          "CLOSED",
        );

        expect(
          successor.finalized_at,
        ).toBe(
          "2026-09-08T08:02:00.000Z",
        );

        expect(
          successor.result_reference,
        ).toBe(
          "RESULT:D023:1",
        );

        expect(
          staticAccepts(
            successor,
          ),
        ).toBe(true);
      },
    );

    it(
      "T13 builds CLOSED v2 to CLOSED v3",
      () => {
        const predecessor =
          buildClosed();

        const successor =
          buildPlatformCoreCanonicalEvidenceSetSuccessor(
            predecessor,
            closedContinuationInput(
              predecessor,
            ),
          );

        expect(
          successor.evidence_set_version,
        ).toBe(3);

        expect(
          successor.state,
        ).toBe(
          "CLOSED",
        );

        expect(
          successor.finalized_at,
        ).toBe(
          predecessor.finalized_at,
        );

        expect(
          successor.result_reference,
        ).toBe(
          predecessor.result_reference,
        );

        expect(
          staticAccepts(
            successor,
          ),
        ).toBe(true);
      },
    );

    it(
      "T14 successor genealogy binds exact predecessor payload_sha256",
      () => {
        const predecessor =
          buildGenesis();

        const successor =
          buildPlatformCoreCanonicalEvidenceSetSuccessor(
            predecessor,
            openSuccessorInput(),
          );

        expect(
          successor.genealogy.derived_from,
        ).toBe(
          predecessor.evidence_set_id,
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
      "T15 successor preserves stable EvidenceSet identity binding",
      () => {
        const predecessor =
          buildGenesis();

        const successor =
          buildPlatformCoreCanonicalEvidenceSetSuccessor(
            predecessor,
            openSuccessorInput(),
          );

        expect(
          successor.evidence_set_id,
        ).toBe(
          predecessor.evidence_set_id,
        );

        expect(
          successor.case_id,
        ).toBe(
          predecessor.case_id,
        );

        expect(
          successor.domain,
        ).toBe(
          predecessor.domain,
        );

        expect(
          successor.target,
        ).toEqual(
          predecessor.target,
        );

        expect(
          successor.owner_subject_ref,
        ).toBe(
          predecessor.owner_subject_ref,
        );

        expect(
          successor.authority_ref,
        ).toBe(
          predecessor.authority_ref,
        );

        expect(
          successor.authority_version,
        ).toBe(
          predecessor.authority_version,
        );

        expect(
          successor.authority_sha256,
        ).toBe(
          predecessor.authority_sha256,
        );

        expect(
          successor.created_at,
        ).toBe(
          predecessor.created_at,
        );
      },
    );

    it(
      "T16 successor payload_sha256 verifies",
      () => {
        const successor =
          buildPlatformCoreCanonicalEvidenceSetSuccessor(
            buildGenesis(),
            openSuccessorInput(),
          );

        expect(
          verifyPlatformCorePayloadSha256(
            successor,
          ),
        ).toBe(true);
      },
    );

    it(
      "T17 rejects tampered predecessor payload hash",
      () => {
        const predecessor =
          structuredClone(
            buildGenesis(),
          ) as
            PlatformCoreCanonicalEvidenceSet & {
              payload_sha256:
                string;
            };

        predecessor.payload_sha256 =
          C;

        expectBuilderError(
          () =>
            buildPlatformCoreCanonicalEvidenceSetSuccessor(
              predecessor,
              openSuccessorInput(),
            ),
          "PREDECESSOR_HASH_MISMATCH",
        );
      },
    );

    it(
      "T18 rejects schema-invalid predecessor",
      () => {
        const predecessor:
          Record<string, unknown> =
          structuredClone(
            buildGenesis(),
          ) as unknown as
            Record<string, unknown>;

        delete predecessor[
          "authority_ref"
        ];

        expectBuilderError(
          () =>
            buildPlatformCoreCanonicalEvidenceSetSuccessor(
              predecessor,
              openSuccessorInput(),
            ),
          "INVALID_PREDECESSOR",
        );
      },
    );

    it(
      "T19 rejects CLOSED to OPEN",
      () => {
        expectBuilderError(
          () =>
            buildPlatformCoreCanonicalEvidenceSetSuccessor(
              buildClosed(),
              openSuccessorInput(),
            ),
          "INVALID_TRANSITION",
        );
      },
    );

    it(
      "T20 rejects OPEN to CLOSED without result_reference",
      () => {
        const input =
          {
            ...closedSuccessorInput(),

            result_reference:
              null,
          };

        expectBuilderError(
          () =>
            buildPlatformCoreCanonicalEvidenceSetSuccessor(
              buildGenesis(),
              input,
            ),
          "INVALID_TRANSITION",
        );
      },
    );

    it(
      "T21 rejects OPEN to CLOSED without finalized_at",
      () => {
        const input =
          {
            ...closedSuccessorInput(),

            finalized_at:
              null,
          };

        expectBuilderError(
          () =>
            buildPlatformCoreCanonicalEvidenceSetSuccessor(
              buildGenesis(),
              input,
            ),
          "INVALID_TRANSITION",
        );
      },
    );

    it(
      "T22 rejects CLOSED successor changing result_reference",
      () => {
        const predecessor =
          buildClosed();

        const input =
          {
            ...closedContinuationInput(
              predecessor,
            ),

            result_reference:
              "RESULT:D023:REPLACED",
          };

        expectBuilderError(
          () =>
            buildPlatformCoreCanonicalEvidenceSetSuccessor(
              predecessor,
              input,
            ),
          "INVALID_TRANSITION",
        );
      },
    );

    it(
      "T23 rejects CLOSED successor changing finalized_at",
      () => {
        const predecessor =
          buildClosed();

        const input =
          {
            ...closedContinuationInput(
              predecessor,
            ),

            finalized_at:
              "2026-09-08T09:00:00.000Z",
          };

        expectBuilderError(
          () =>
            buildPlatformCoreCanonicalEvidenceSetSuccessor(
              predecessor,
              input,
            ),
          "INVALID_TRANSITION",
        );
      },
    );

    it(
      "T24 rejects caller control of successor version genealogy anchor and payload hash",
      () => {
        const predecessor =
          buildGenesis();

        const versionControlled:
          Record<string, unknown> =
          {
            ...openSuccessorInput(),

            evidence_set_version:
              99,
          };

        expectBuilderError(
          () =>
            buildPlatformCoreCanonicalEvidenceSetSuccessor(
              predecessor,
              versionControlled as unknown as
                PlatformCoreCanonicalEvidenceSetSuccessorInput,
            ),
          "RESERVED_FIELD_CONTROL",
        );

        const payloadControlled:
          Record<string, unknown> =
          {
            ...openSuccessorInput(),

            payload_sha256:
              B,
          };

        expectBuilderError(
          () =>
            buildPlatformCoreCanonicalEvidenceSetSuccessor(
              predecessor,
              payloadControlled as unknown as
                PlatformCoreCanonicalEvidenceSetSuccessorInput,
            ),
          "RESERVED_FIELD_CONTROL",
        );

        const genealogyControlled:
          Record<string, unknown> =
          {
            ...openSuccessorInput(),

            genealogy: {
              ...openSuccessorInput()
                .genealogy,

              derived_from:
                "EVS-D023:OTHER",
            },
          };

        expectBuilderError(
          () =>
            buildPlatformCoreCanonicalEvidenceSetSuccessor(
              predecessor,
              genealogyControlled as unknown as
                PlatformCoreCanonicalEvidenceSetSuccessorInput,
            ),
          "RESERVED_FIELD_CONTROL",
        );
      },
    );
  },
);
