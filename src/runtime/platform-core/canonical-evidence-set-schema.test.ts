import {
  describe,
  expect,
  it,
} from "vitest";

import {
  PLATFORM_CORE_CANONICAL_SCHEMA_COUNT,
  PLATFORM_CORE_CANONICAL_SOURCE_COMMIT,
  PLATFORM_CORE_SCHEMA_KINDS,
  getPlatformCoreCanonicalSchema,
} from "./canonical-schema-registry";

import {
  loadPlatformCoreCanonicalSchema,
} from "./canonical-schema-loader";

import {
  compilePlatformCoreCanonicalSchemas,
} from "./canonical-schema-compiler";

import {
  validatePlatformCoreCanonicalSchema,
} from "./canonical-schema-validator";

const A = "a".repeat(64);
const B = "b".repeat(64);

function validOpenGenesis():
  Record<string, unknown> {
  return {
    proto:
      "HBCE-EVIDENCE-SET-v1",

    kind:
      "HBCE_CORE_EVIDENCE_SET",

    version:
      "v1",

    evidence_set_id:
      "EVS-D017:GENESIS",

    evidence_set_version:
      1,

    case_id:
      "EXT-CASE-D017",

    domain:
      "external_system_validation",

    target: {
      target_class:
        "mobile_bridge",

      target_ref:
        "TARGET:D017",

      system_ref:
        "SYSTEM:D017",
    },

    owner_subject_ref:
      "SUBJECT:D017",

    authority_ref:
      "AUT-D017:AUTHORITY",

    authority_version:
      1,

    authority_sha256:
      A,

    state:
      "OPEN",

    created_at:
      "2026-09-08T08:00:00.000Z",

    finalized_at:
      null,

    evidence_state:
      "PRESENT",

    evidence_reference:
      "EVIDENCE:D017",

    control_references: [
      "CONTROL:D017",
    ],

    observation_references: [],

    result_reference:
      null,

    artifact_references: [],

    external_confirmation_references: [],

    event_references: [],

    evt_reference:
      null,

    opc_reference:
      null,

    payload_sha256:
      B,

    append_only:
      true,

    genealogy: {
      derived_from:
        null,

      previous_state:
        null,

      new_state:
        "OPEN",

      cause:
        "D017_GENESIS",

      evidence_reference:
        "EVIDENCE:D017",

      timestamp:
        "2026-09-08T08:00:00.000Z",

      hash:
        A,
    },

    boundary: {
      data_minimization:
        true,

      reference_over_raw_evidence:
        true,

      identity_binding_required:
        true,

      authority_binding_required:
        true,

      evidence_set_not_authority:
        true,

      evidence_set_not_authorization:
        true,

      evidence_set_not_execution:
        true,

      evidence_set_not_outcome:
        true,

      result_separate_from_state:
        true,

      external_confirmation_separate_from_result:
        true,

      environment_issue_separate_from_control_result:
        true,

      analysis_not_canonical_evidence:
        true,

      closed_history_not_silently_mutable:
        true,

      domain_specific_semantics_in_adapters:
        true,

      unknown_not_pass:
        true,

      missing_evidence_not_verified:
        true,

      append_only_genealogy:
        true,

      no_regulated_certification_claim:
        true,

      no_public_authority_claim:
        true,

      fail_closed:
        true,
    },
  };
}

function cloneFixture():
  Record<string, any> {
  return structuredClone(
    validOpenGenesis(),
  ) as Record<string, any>;
}

/*
 * The public static validator intentionally returns a
 * discriminated result object rather than exposing AJV
 * internals directly.
 *
 * Keep this decoder narrow and fail if its public result
 * shape ever stops exposing an explicit boolean
 * discriminator.
 */
function staticValidationAccepted(
  result: unknown,
): boolean {
  if (
    result === null ||
    typeof result !== "object"
  ) {
    throw new Error(
      "HBCE_D017_STATIC_VALIDATOR_RESULT_INVALID",
    );
  }

  const record =
    result as Record<string, unknown>;

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
    "HBCE_D017_STATIC_VALIDATOR_BOOLEAN_DISCRIMINATOR_MISSING",
  );
}

function staticAccepts(
  value: unknown,
): boolean {
  const result =
    validatePlatformCoreCanonicalSchema(
      "EVIDENCE_SET",
      value,
    );

  return staticValidationAccepted(
    result,
  );
}

describe(
  "Platform Core canonical EvidenceSet schema",
  () => {
    it(
      "registers EVIDENCE_SET as the tenth canonical schema",
      () => {
        expect(
          PLATFORM_CORE_CANONICAL_SCHEMA_COUNT,
        ).toBe(10);

        expect(
          PLATFORM_CORE_SCHEMA_KINDS,
        ).toContain(
          "EVIDENCE_SET",
        );

        expect(
          PLATFORM_CORE_CANONICAL_SOURCE_COMMIT,
        ).toBe(
          "376e83950e0a46e620dd03dd4301453b4eb7a6c6",
        );
      },
    );

    it(
      "binds EVIDENCE_SET to the exact canonical snapshot descriptor",
      () => {
        const descriptor =
          getPlatformCoreCanonicalSchema(
            "EVIDENCE_SET",
          );

        expect(
          descriptor,
        ).toEqual({
          kind:
            "EVIDENCE_SET",

          filename:
            "hbce-evidence-set.schema.json",

          sha256:
            "378204b65d574837436f075e0dff65532a3efbda356f79e7e0d8e264b274f5bc",
        });
      },
    );

    it(
      "loads the byte-verified EVIDENCE_SET snapshot",
      () => {
        const loaded =
          loadPlatformCoreCanonicalSchema(
            "EVIDENCE_SET",
          );

        expect(
          loaded.kind,
        ).toBe(
          "EVIDENCE_SET",
        );

        expect(
          loaded.filename,
        ).toBe(
          "hbce-evidence-set.schema.json",
        );

        expect(
          loaded.sha256,
        ).toBe(
          "378204b65d574837436f075e0dff65532a3efbda356f79e7e0d8e264b274f5bc",
        );

        expect(
          loaded.schema,
        ).toMatchObject({
          $schema:
            "https://json-schema.org/draft/2020-12/schema",

          type:
            "object",
        });
      },
    );

    it(
      "compiles an EVIDENCE_SET validator and accepts a valid OPEN genesis",
      () => {
        const compiled =
          compilePlatformCoreCanonicalSchemas();

        const validator =
          compiled.getValidator(
            "EVIDENCE_SET",
          );

        const fixture =
          validOpenGenesis();

        expect(
          validator(
            fixture,
          ),
        ).toBe(true);

        expect(
          validator.errors,
        ).toBeNull();
      },
    );

    it(
      "accepts a valid OPEN genesis through the public static validator",
      () => {
        expect(
          staticAccepts(
            validOpenGenesis(),
          ),
        ).toBe(true);
      },
    );

    it(
      "rejects a CLOSED predecessor reopening to OPEN",
      () => {
        const fixture =
          cloneFixture();

        fixture.genealogy.previous_state =
          "CLOSED";

        fixture.genealogy.new_state =
          "OPEN";

        fixture.state =
          "OPEN";

        expect(
          staticAccepts(
            fixture,
          ),
        ).toBe(false);
      },
    );

    it(
      "rejects OPEN with a result reference",
      () => {
        const fixture =
          cloneFixture();

        fixture.result_reference =
          "RESULT:D017";

        expect(
          staticAccepts(
            fixture,
          ),
        ).toBe(false);
      },
    );

    it(
      "rejects CLOSED without a result reference",
      () => {
        const fixture =
          cloneFixture();

        fixture.evidence_set_version =
          2;

        fixture.state =
          "CLOSED";

        fixture.finalized_at =
          "2026-09-08T08:01:00.000Z";

        fixture.result_reference =
          null;

        fixture.genealogy.derived_from =
          "EVS-D017:GENESIS";

        fixture.genealogy.previous_state =
          "OPEN";

        fixture.genealogy.new_state =
          "CLOSED";

        fixture.genealogy.hash =
          B;

        expect(
          staticAccepts(
            fixture,
          ),
        ).toBe(false);
      },
    );

    it(
      "rejects an unknown top-level property",
      () => {
        const fixture =
          cloneFixture();

        fixture.omnilink_specific_magic =
          true;

        expect(
          staticAccepts(
            fixture,
          ),
        ).toBe(false);
      },
    );
  },
);
