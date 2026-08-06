/**
 * HERMETICUM B.C.E. S.r.l.
 * AI JOKER-C2
 *
 * Runtime Capability Assessment Tests
 *
 * Deterministic: true
 * Fail Closed: true
 * Read Only: true
 * Human Authorization Required: true
 * Automatic Execution: false
 * Automatic Repository Mutation: false
 * Legal Certification: false
 */

import {
  assessRuntimeCapabilities,
  RUNTIME_CAPABILITY_ASSESSMENT_REVISION,
  type RuntimeCapabilityAssessmentInput,
} from "../runtime-capability-assessment";

import type {
  RuntimeSelfState,
} from "../runtime-self.service";

function createRuntimeSelfState(
  overrides: Partial<RuntimeSelfState> = {},
): RuntimeSelfState {
  return {
    revision:
      "AIJC2-RUNTIME-SELF-STATE-TEST-v1_0",

    generatedAt:
      "2026-08-06T17:45:00+02:00",

    runtimeVersion:
      "AI_JOKER_C2_SAAS_CORE_v0_1",

    repository: {
      repository:
        "hbce-ai-joker-c2",

      branch:
        "main",

      commit:
        "TEST-COMMIT",

      fileCount:
        120,

      directoryCount:
        24,

      inspectedFileCount:
        30,

      buildPassed:
        true,

      testsPassed:
        true,
    },

    evolution: {
      enabled:
        true,

      addedFiles:
        2,

      removedFiles:
        0,

      modifiedFiles:
        4,

      unchangedFiles:
        114,
    },

    integration: {
      available:
        true,

      plannerAvailable:
        true,

      validatorAvailable:
        true,

      operatorAuthorized:
        true,
    },

    knowledge: {
      available:
        true,

      operatorAuthorized:
        true,

      automaticPersistence:
        false,

      automaticRecall:
        false,
    },

    capabilities:
      Object.freeze([]),

    capabilityRegistry: {
      revision:
        "TEST-REGISTRY",

      capabilities:
        Object.freeze([]),

      capabilityIds:
        Object.freeze([]),

      totalCapabilities:
        0,

      operatorAuthorized:
        true,

      humanAuthorizationRequired:
        true,

      automaticDiscovery:
        false,

      automaticPersistence:
        false,

      automaticRecall:
        false,

      legalCertification:
        false,
    },

    capabilityAnalysis: {
      revision:
        "TEST-CAPABILITY-ANALYSIS",

      totalCapabilities:
        2,

      averageScore:
        62,

      operationalCapabilities:
        1,

      degradedCapabilities:
        1,

      blockedCapabilities:
        0,

      gaps:
        Object.freeze([
          Object.freeze({
            id:
              "CAPABILITY-GAP-001",

            capabilityId:
              "REPOSITORY-SEMANTIC-ANALYSIS",

            title:
              "Semantic analysis is incomplete",

            description:
              "MOD-002 is not yet receiving all inspected repository files.",

            score:
              45,

            severity:
              "HIGH",
          }),
        ]),

      recommendations:
        Object.freeze([]),

      operationalStatus:
        "DEGRADED",

      legalCertification:
        false,
    },

    operationalStatus:
      "DEGRADED",

    operatorAuthorized:
      true,

    humanAuthorizationRequired:
      true,

    automaticPersistence:
      false,

    automaticRecall:
      false,

    legalCertification:
      false,

    ...overrides,
  } as RuntimeSelfState;
}

function createInput(
  overrides: Partial<RuntimeCapabilityAssessmentInput> = {},
): RuntimeCapabilityAssessmentInput {
  return {
    assessmentId:
      "HBCE-CAPABILITY-ASSESSMENT-001",

    generatedAt:
      "2026-08-06T17:45:00+02:00",

    runtimeSelfState:
      createRuntimeSelfState(),

    operatorAuthorized:
      true,

    ...overrides,
  };
}

describe(
  "Runtime Capability Assessment",
  () => {
    it(
      "produces deterministic findings and ranked interventions",
      () => {
        const result =
          assessRuntimeCapabilities(
            createInput(),
          );

        expect(
          result.revision,
        ).toBe(
          RUNTIME_CAPABILITY_ASSESSMENT_REVISION,
        );

        expect(
          result.summary.totalFindings,
        ).toBe(2);

        expect(
          result.summary.capabilityScore,
        ).toBe(62);

        expect(
          result.summary.registeredCapabilities,
        ).toBe(2);

        expect(
          result.summary.capabilityGaps,
        ).toBe(1);

        expect(
          result.findings.map(
            (finding) =>
              finding.category,
          ),
        ).toContain(
          "LOW_CAPABILITY_SCORE",
        );

        expect(
          result.findings.map(
            (finding) =>
              finding.category,
          ),
        ).toContain(
          "CAPABILITY_GAP",
        );

        expect(
          result.interventions.length,
        ).toBe(2);

        expect(
          result.interventions[0]
            .priorityScore,
        ).toBeGreaterThanOrEqual(
          result.interventions[1]
            .priorityScore,
        );
      },
    );

    it(
      "produces identical output for identical input",
      () => {
        const input =
          createInput();

        const first =
          assessRuntimeCapabilities(
            input,
          );

        const second =
          assessRuntimeCapabilities(
            input,
          );

        expect(second).toEqual(first);
      },
    );

    it(
      "detects the absence of registered capabilities",
      () => {
        const result =
          assessRuntimeCapabilities(
            createInput({
              runtimeSelfState:
                createRuntimeSelfState({
                  capabilityAnalysis: {
                    revision:
                      "TEST-CAPABILITY-ANALYSIS",

                    totalCapabilities:
                      0,

                    averageScore:
                      0,

                    operationalCapabilities:
                      0,

                    degradedCapabilities:
                      0,

                    blockedCapabilities:
                      0,

                    gaps:
                      Object.freeze([]),

                    recommendations:
                      Object.freeze([]),

                    operationalStatus:
                      "BLOCKED",

                    legalCertification:
                      false,
                  },
                }),
            }),
          );

        expect(
          result.findings.some(
            (finding) =>
              finding.category ===
              "NO_REGISTERED_CAPABILITIES",
          ),
        ).toBe(true);

        expect(
          result.summary.criticalFindings,
        ).toBeGreaterThan(0);
      },
    );

    it(
      "detects incomplete repository evidence",
      () => {
        const result =
          assessRuntimeCapabilities(
            createInput({
              runtimeSelfState:
                createRuntimeSelfState({
                  repository: {
                    repository:
                      "hbce-ai-joker-c2",

                    branch:
                      "main",

                    commit:
                      "TEST-COMMIT",

                    fileCount:
                      120,

                    directoryCount:
                      24,

                    inspectedFileCount:
                      0,

                    buildPassed:
                      true,

                    testsPassed:
                      true,
                  },
                }),
            }),
          );

        expect(
          result.findings.some(
            (finding) =>
              finding.category ===
              "REPOSITORY_EVIDENCE",
          ),
        ).toBe(true);
      },
    );

    it(
      "does not automatically recommend without operator authorization",
      () => {
        const result =
          assessRuntimeCapabilities(
            createInput({
              operatorAuthorized:
                false,
            }),
          );

        expect(
          result.operatorAuthorized,
        ).toBe(false);

        expect(
          result.interventions.every(
            (intervention) =>
              intervention.decision !==
              "RECOMMEND",
          ),
        ).toBe(true);

        expect(
          result.topRecommendation,
        ).toBeUndefined();
      },
    );

    it(
      "fails closed when legalCertification is not false",
      () => {
        const invalidState =
          createRuntimeSelfState() as RuntimeSelfState & {
            legalCertification: boolean;
          };

        Object.defineProperty(
          invalidState,
          "legalCertification",
          {
            value:
              true,

            configurable:
              true,
          },
        );

        expect(
          () =>
            assessRuntimeCapabilities(
              createInput({
                runtimeSelfState:
                  invalidState,
              }),
            ),
        ).toThrow(
          "RUNTIME_CAPABILITY_ASSESSMENT_LEGAL_BOUNDARY_VIOLATION",
        );
      },
    );

    it(
      "fails closed for invalid capability scores",
      () => {
        expect(
          () =>
            assessRuntimeCapabilities(
              createInput({
                runtimeSelfState:
                  createRuntimeSelfState({
                    capabilityAnalysis: {
                      revision:
                        "TEST-CAPABILITY-ANALYSIS",

                      totalCapabilities:
                        1,

                      averageScore:
                        101,

                      operationalCapabilities:
                        0,

                      degradedCapabilities:
                        1,

                      blockedCapabilities:
                        0,

                      gaps:
                        Object.freeze([]),

                      recommendations:
                        Object.freeze([]),

                      operationalStatus:
                        "DEGRADED",

                      legalCertification:
                        false,
                    },
                  }),
              }),
            ),
        ).toThrow(
          "RUNTIME_CAPABILITY_ASSESSMENT_AVERAGE_SCORE_INVALID",
        );
      },
    );

    it(
      "preserves every HBCE governance boundary",
      () => {
        const result =
          assessRuntimeCapabilities(
            createInput(),
          );

        expect(
          result.governance.readOnly,
        ).toBe(true);

        expect(
          result.governance.deterministic,
        ).toBe(true);

        expect(
          result.governance.failClosed,
        ).toBe(true);

        expect(
          result.governance
            .humanAuthorizationRequired,
        ).toBe(true);

        expect(
          result.governance
            .automaticExecution,
        ).toBe(false);

        expect(
          result.governance
            .automaticPersistence,
        ).toBe(false);

        expect(
          result.governance
            .automaticRecall,
        ).toBe(false);

        expect(
          result.governance
            .automaticRepositoryMutation,
        ).toBe(false);

        expect(
          result.governance
            .legalCertification,
        ).toBe(false);

        expect(
          result.legalCertification,
        ).toBe(false);
      },
    );
  },
);
