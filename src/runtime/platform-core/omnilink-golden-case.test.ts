import {
  readFileSync,
} from "node:fs";

import {
  join,
} from "node:path";

import {
  describe,
  expect,
  it,
} from "vitest";

import {
  buildPlatformCoreCanonicalEvidenceSetGenesis,
  buildPlatformCoreCanonicalEvidenceSetSuccessor,
  type PlatformCoreCanonicalEvidenceSet,
} from "./canonical-evidence-set-builder";

import {
  verifyPlatformCorePayloadSha256,
} from "./canonical-payload-hash";

import {
  validatePlatformCoreCanonicalSchema,
} from "./canonical-schema-validator";

type GoldenCaseFixture =
  Readonly<{
    fixture_protocol:
      string;

    fixture_role:
      string;

    case_id:
      string;

    domain:
      string;

    target:
      Readonly<{
        name:
          string;

        target_class:
          string;

        target_ref:
          string;

        system_ref:
          string;
      }>;

    control:
      Readonly<{
        id:
          string;

        reference:
          string;

        property:
          string;

        expected_condition:
          string;
      }>;

    finding:
      Readonly<{
        classification:
          string;

        statement:
          string;
      }>;

    remediation:
      Readonly<{
        bridge_instance_id_generation:
          string;

        canonical_transaction_identity:
          readonly string[];
      }>;

    assessment:
      Readonly<{
        reference:
          string;

        result:
          string;
      }>;

    external_confirmation:
      Readonly<{
        reference:
          string;

        confirmed:
          boolean;
      }>;

    further_action:
      string;

    environment_issue:
      Readonly<{
        issue:
          string;

        separate:
          boolean;

        non_blocking:
          boolean;

        affects_control_result:
          boolean;
      }>;

    references:
      Readonly<{
        evidence_set:
          string;

        evidence:
          string;

        control:
          string;

        result:
          string;

        external_confirmation:
          string;
      }>;

    canonical_projection:
      Readonly<{
        evidence_set_id:
          string;

        case_id:
          string;

        domain:
          string;

        target:
          Readonly<{
            target_class:
              string;

            target_ref:
              string;

            system_ref:
              string;
          }>;

        state:
          string;

        evidence_state:
          string;

        evidence_reference:
          string;

        control_references:
          readonly string[];

        observation_references:
          readonly string[];

        result_reference:
          string;

        artifact_references:
          readonly string[];

        external_confirmation_references:
          readonly string[];

        event_references:
          readonly string[];

        evt_reference:
          string | null;

        opc_reference:
          string | null;
      }>;

    boundary:
      Readonly<{
        case_not_architecture:
          boolean;

        state_not_result:
          boolean;

        outcome_not_result_by_assumption:
          boolean;

        external_confirmation_not_result:
          boolean;

        environment_issue_not_control_result:
          boolean;
      }>;
  }>;

const FIXTURE_PATH =
  join(
    process.cwd(),
    "src/runtime/platform-core/golden-cases/ext-case-0001-omnilink.json",
  );

const AUTHORITY_SHA256 =
  "a".repeat(
    64,
  );

const CREATED_AT =
  "2026-09-08T12:00:00.000Z";

const FINALIZED_AT =
  "2026-09-08T12:01:00.000Z";

function loadFixture():
  GoldenCaseFixture {
  return JSON.parse(
    readFileSync(
      FIXTURE_PATH,
      "utf8",
    ),
  ) as GoldenCaseFixture;
}

function staticValidationAccepted(
  result:
    unknown,
): boolean {
  if (
    result === null
    ||
    typeof result !==
      "object"
  ) {
    throw new Error(
      "HBCE_G2_GOLDEN_CASE_STATIC_VALIDATOR_RESULT_INVALID",
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
    "HBCE_G2_GOLDEN_CASE_STATIC_VALIDATOR_BOOLEAN_DISCRIMINATOR_MISSING",
  );
}

function buildGenesis(
  fixture:
    GoldenCaseFixture,
): PlatformCoreCanonicalEvidenceSet {
  const projection =
    fixture.canonical_projection;

  return buildPlatformCoreCanonicalEvidenceSetGenesis({
    evidence_set_id:
      projection.evidence_set_id,

    case_id:
      projection.case_id,

    domain:
      projection.domain,

    target: {
      target_class:
        projection.target
          .target_class,

      target_ref:
        projection.target
          .target_ref,

      system_ref:
        projection.target
          .system_ref,
    },

    owner_subject_ref:
      "SUBJECT:HBCE:GOLDEN-CASE",

    authority_ref:
      "AUT-EXT-CASE-0001-OMNILINK",

    authority_version:
      1,

    authority_sha256:
      AUTHORITY_SHA256,

    created_at:
      CREATED_AT,

    evidence_state:
      "PRESENT",

    evidence_reference:
      projection
        .evidence_reference,

    control_references: [
      ...projection
        .control_references,
    ],

    observation_references:
      [],

    artifact_references:
      [],

    external_confirmation_references:
      [],

    event_references:
      [],

    evt_reference:
      null,

    opc_reference:
      null,

    genealogy: {
      cause:
        "GOLDEN_CASE_GENESIS",

      evidence_reference:
        projection
          .evidence_reference,

      timestamp:
        CREATED_AT,
    },
  });
}

function buildClosed(
  fixture:
    GoldenCaseFixture,
): Readonly<{
  genesis:
    PlatformCoreCanonicalEvidenceSet;

  closed:
    PlatformCoreCanonicalEvidenceSet;
}> {
  const projection =
    fixture.canonical_projection;

  const genesis =
    buildGenesis(
      fixture,
    );

  const closed =
    buildPlatformCoreCanonicalEvidenceSetSuccessor(
      genesis,
      {
        state:
          "CLOSED",

        finalized_at:
          FINALIZED_AT,

        result_reference:
          projection
            .result_reference,

        evidence_state:
          "PRESENT",

        evidence_reference:
          projection
            .evidence_reference,

        control_references: [
          ...projection
            .control_references,
        ],

        observation_references:
          [],

        artifact_references:
          [],

        external_confirmation_references: [
          ...projection
            .external_confirmation_references,
        ],

        event_references:
          [],

        evt_reference:
          null,

        opc_reference:
          null,

        genealogy: {
          cause:
            "GOLDEN_CASE_FINALIZATION",

          evidence_reference:
            projection
              .evidence_reference,

          timestamp:
            FINALIZED_AT,
        },
      },
    );

  return Object.freeze({
    genesis,
    closed,
  });
}

function collectKeys(
  value:
    unknown,
  keys:
    Set<string> =
      new Set<string>(),
): Set<string> {
  if (
    value === null
    ||
    typeof value !==
      "object"
  ) {
    return keys;
  }

  if (
    Array.isArray(
      value,
    )
  ) {
    for (
      const item of value
    ) {
      collectKeys(
        item,
        keys,
      );
    }

    return keys;
  }

  for (
    const [
      key,
      child,
    ] of Object.entries(
      value as Record<
        string,
        unknown
      >,
    )
  ) {
    keys.add(
      key,
    );

    collectKeys(
      child,
      keys,
    );
  }

  return keys;
}

describe(
  "EXT-CASE-0001-OMNILINK Golden Case",
  () => {
    it(
      "G01 loads the frozen Golden Case identity and assessment semantics",
      () => {
        const fixture =
          loadFixture();

        expect(
          fixture.fixture_protocol,
        ).toBe(
          "HBCE-GOLDEN-CASE-v1",
        );

        expect(
          fixture.case_id,
        ).toBe(
          "EXT-CASE-0001-OMNILINK",
        );

        expect(
          fixture.control.id,
        ).toBe(
          "BRIDGE-RESTART-IDENTITY",
        );

        expect(
          fixture.assessment.result,
        ).toBe(
          "PASS",
        );

        expect(
          fixture.canonical_projection.state,
        ).toBe(
          "CLOSED",
        );
      },
    );

    it(
      "G02 proves seq-only identity collides while bridge_instance_id plus seq does not",
      () => {
        const seq =
          42;

        const first =
          Object.freeze({
            bridge_instance_id:
              "11111111-1111-4111-8111-111111111111",
            seq,
          });

        const second =
          Object.freeze({
            bridge_instance_id:
              "22222222-2222-4222-8222-222222222222",
            seq,
          });

        expect(
          first.seq,
        ).toBe(
          second.seq,
        );

        expect(
          [
            first.bridge_instance_id,
            first.seq,
          ],
        ).not.toEqual(
          [
            second.bridge_instance_id,
            second.seq,
          ],
        );
      },
    );

    it(
      "G03 builds canonical OPEN EvidenceSet genesis from case projection",
      () => {
        const fixture =
          loadFixture();

        const genesis =
          buildGenesis(
            fixture,
          );

        expect(
          genesis.evidence_set_id,
        ).toBe(
          fixture.references.evidence_set,
        );

        expect(
          genesis.case_id,
        ).toBe(
          fixture.case_id,
        );

        expect(
          genesis.state,
        ).toBe(
          "OPEN",
        );

        expect(
          genesis.result_reference,
        ).toBeNull();
      },
    );

    it(
      "G04 OPEN genesis passes canonical EvidenceSet static validation",
      () => {
        const genesis =
          buildGenesis(
            loadFixture(),
          );

        expect(
          staticValidationAccepted(
            validatePlatformCoreCanonicalSchema(
              "EVIDENCE_SET",
              genesis,
            ),
          ),
        ).toBe(true);
      },
    );

    it(
      "G05 OPEN genesis carries a valid canonical payload hash",
      () => {
        const genesis =
          buildGenesis(
            loadFixture(),
          );

        expect(
          verifyPlatformCorePayloadSha256(
            genesis,
          ),
        ).toBe(true);
      },
    );

    it(
      "G06 finalizes the Golden Case as canonical CLOSED EvidenceSet revision",
      () => {
        const fixture =
          loadFixture();

        const {
          closed,
        } =
          buildClosed(
            fixture,
          );

        expect(
          closed.evidence_set_version,
        ).toBe(2);

        expect(
          closed.state,
        ).toBe(
          "CLOSED",
        );

        expect(
          closed.finalized_at,
        ).toBe(
          FINALIZED_AT,
        );
      },
    );

    it(
      "G07 CLOSED revision passes canonical EvidenceSet validation and payload verification",
      () => {
        const {
          closed,
        } =
          buildClosed(
            loadFixture(),
          );

        expect(
          staticValidationAccepted(
            validatePlatformCoreCanonicalSchema(
              "EVIDENCE_SET",
              closed,
            ),
          ),
        ).toBe(true);

        expect(
          verifyPlatformCorePayloadSha256(
            closed,
          ),
        ).toBe(true);
      },
    );

    it(
      "G08 keeps PASS separate from CLOSED through exact Result reference binding",
      () => {
        const fixture =
          loadFixture();

        const {
          closed,
        } =
          buildClosed(
            fixture,
          );

        expect(
          fixture.assessment.result,
        ).toBe(
          "PASS",
        );

        expect(
          closed.state,
        ).toBe(
          "CLOSED",
        );

        expect(
          closed.result_reference,
        ).toBe(
          fixture.assessment.reference,
        );

        expect(
          closed.state,
        ).not.toBe(
          fixture.assessment.result,
        );
      },
    );

    it(
      "G09 keeps external confirmation distinct from assessment Result",
      () => {
        const fixture =
          loadFixture();

        const {
          closed,
        } =
          buildClosed(
            fixture,
          );

        expect(
          fixture.external_confirmation.confirmed,
        ).toBe(true);

        expect(
          closed.external_confirmation_references,
        ).toEqual([
          fixture.external_confirmation.reference,
        ]);

        expect(
          fixture.external_confirmation.reference,
        ).not.toBe(
          fixture.assessment.reference,
        );
      },
    );

    it(
      "G10 keeps the independent environment issue non-blocking without altering PASS CLOSED",
      () => {
        const fixture =
          loadFixture();

        const {
          closed,
        } =
          buildClosed(
            fixture,
          );

        expect(
          fixture.environment_issue.separate,
        ).toBe(true);

        expect(
          fixture.environment_issue.non_blocking,
        ).toBe(true);

        expect(
          fixture.environment_issue.affects_control_result,
        ).toBe(false);

        expect(
          fixture.assessment.result,
        ).toBe(
          "PASS",
        );

        expect(
          closed.state,
        ).toBe(
          "CLOSED",
        );
      },
    );

    it(
      "G11 prevents OmniLink domain semantics from becoming canonical EvidenceSet fields",
      () => {
        const fixture =
          loadFixture();

        const {
          closed,
        } =
          buildClosed(
            fixture,
          );

        const keys =
          collectKeys(
            closed,
          );

        for (
          const forbiddenKey of [
            "bridge_instance_id",
            "seq",
            "finding",
            "remediation",
            "assessment",
            "environment_issue",
            "further_action",
            "property",
            "expected_condition",
            "confirmed",
          ]
        ) {
          expect(
            keys.has(
              forbiddenKey,
            ),
          ).toBe(false);
        }

        const serialized =
          JSON.stringify(
            closed,
          );

        expect(
          serialized,
        ).not.toContain(
          "omnilink-lib unavailable",
        );

        expect(
          serialized,
        ).not.toContain(
          "(bridge_instance_id=A, seq=N)",
        );
      },
    );

    it(
      "G12 anchors successor genealogy to the exact OPEN predecessor without redefining architecture",
      () => {
        const fixture =
          loadFixture();

        const {
          genesis,
          closed,
        } =
          buildClosed(
            fixture,
          );

        expect(
          closed.evidence_set_id,
        ).toBe(
          genesis.evidence_set_id,
        );

        expect(
          closed.evidence_set_version,
        ).toBe(
          genesis.evidence_set_version
          + 1,
        );

        expect(
          closed.genealogy.derived_from,
        ).toBe(
          genesis.evidence_set_id,
        );

        expect(
          closed.genealogy.previous_state,
        ).toBe(
          "OPEN",
        );

        expect(
          closed.genealogy.new_state,
        ).toBe(
          "CLOSED",
        );

        expect(
          closed.genealogy.hash,
        ).toBe(
          genesis.payload_sha256,
        );

        expect(
          fixture.boundary.case_not_architecture,
        ).toBe(true);
      },
    );
  },
);
