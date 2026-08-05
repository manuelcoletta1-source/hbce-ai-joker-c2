/**
 * HERMETICUM B.C.E. S.r.l.
 *
 * AI JOKER-C2
 * MOD-002 Repository Semantic Intelligence
 *
 * Repository Finding Engine
 * Deterministic Tests
 *
 * Revision:
 * AIJC2-MOD002-REPOSITORY-FINDING-ENGINE-TEST-v1_0
 *
 * Purpose:
 * - verify deterministic semantic finding generation;
 * - detect orphan and unverifiable components;
 * - detect duplicated responsibilities;
 * - detect declared and isolated capabilities;
 * - preserve fail-closed and governance boundaries.
 *
 * legalCertification=false
 */

import {
  describe,
  expect,
  test,
} from "vitest";

import {
  buildRepositoryFindings,
  REPOSITORY_FINDING_ENGINE_REVISION,
  type RepositoryFindingEngineInput,
} from "../repository-finding-engine";

import type {
  RepositorySemanticCapability,
  RepositorySemanticComponent,
  RepositorySemanticRelation,
} from "../repository-semantic-intelligence.types";

function createComponent(
  overrides:
    Partial<RepositorySemanticComponent> & {
      componentId: string;
      path: string;
      name: string;
      domain:
        RepositorySemanticComponent["domain"];
    },
): RepositorySemanticComponent {
  return {
    componentId:
      overrides.componentId,

    path:
      overrides.path,

    name:
      overrides.name,

    domain:
      overrides.domain,

    primaryResponsibility:
      overrides.primaryResponsibility ??
      "Provide a governed repository capability.",

    secondaryResponsibilities:
      overrides.secondaryResponsibilities ??
      [],

    capabilityIds:
      overrides.capabilityIds ??
      [],

    relationIds:
      overrides.relationIds ??
      [],

    evidenceIds:
      overrides.evidenceIds ??
      [
        `EVIDENCE-${overrides.componentId}`,
      ],

    epistemicState:
      overrides.epistemicState ??
      "FACT",

    confidence:
      overrides.confidence ??
      90,

    status:
      overrides.status ??
      "CLASSIFIED",
  };
}

function createCapability(
  overrides:
    Partial<RepositorySemanticCapability> & {
      capabilityId: string;
      name: string;
      domain:
        RepositorySemanticCapability["domain"];
      componentIds:
        readonly string[];
    },
): RepositorySemanticCapability {
  return {
    capabilityId:
      overrides.capabilityId,

    name:
      overrides.name,

    description:
      overrides.description ??
      "Deterministic repository capability.",

    domain:
      overrides.domain,

    componentIds:
      overrides.componentIds,

    evidenceIds:
      overrides.evidenceIds ??
      [
        `EVIDENCE-${overrides.capabilityId}`,
      ],

    state:
      overrides.state ??
      "IMPLEMENTED",

    epistemicState:
      overrides.epistemicState ??
      "FACT",

    confidence:
      overrides.confidence ??
      80,
  };
}

function createRelation(
  overrides:
    Partial<RepositorySemanticRelation> & {
      relationId: string;
      sourceComponentId: string;
      targetComponentId: string;
    },
): RepositorySemanticRelation {
  return {
    relationId:
      overrides.relationId,

    sourceComponentId:
      overrides.sourceComponentId,

    targetComponentId:
      overrides.targetComponentId,

    relationType:
      overrides.relationType ??
      "USES",

    evidenceIds:
      overrides.evidenceIds ??
      [],

    epistemicState:
      overrides.epistemicState ??
      "INFERENCE",

    confidence:
      overrides.confidence ??
      60,
  };
}

function createBaseInput(
  overrides:
    Partial<RepositoryFindingEngineInput> = {},
): RepositoryFindingEngineInput {
  const components:
    readonly RepositorySemanticComponent[] =
    [
      createComponent({
        componentId:
          "SEM-COMP-001",

        path:
          "src/runtime/service-a.ts",

        name:
          "Runtime Service A",

        domain:
          "RUNTIME",
      }),

      createComponent({
        componentId:
          "SEM-COMP-002",

        path:
          "src/runtime/service-b.ts",

        name:
          "Runtime Service B",

        domain:
          "RUNTIME",

        primaryResponsibility:
          "Provide a secondary runtime capability.",
      }),
    ];

  const relations:
    readonly RepositorySemanticRelation[] =
    [
      createRelation({
        relationId:
          "SEM-REL-001",

        sourceComponentId:
          "SEM-COMP-001",

        targetComponentId:
          "SEM-COMP-002",
      }),
    ];

  return {
    components,

    capabilities:
      [],

    relations,

    ...overrides,
  };
}

describe(
  "MOD-002 Repository Finding Engine",
  () => {
    test(
      "returns no findings for connected classified components",
      () => {
        const result =
          buildRepositoryFindings(
            createBaseInput(),
          );

        expect(
          result.revision,
        ).toBe(
          REPOSITORY_FINDING_ENGINE_REVISION,
        );

        expect(
          result.findings,
        ).toEqual([]);

        expect(
          result.summary.totalFindings,
        ).toBe(0);

        expect(
          result.summary.blockingFindings,
        ).toBe(0);

        expect(
          result.legalCertification,
        ).toBe(false);
      },
    );

    test(
      "detects an orphan component",
      () => {
        const orphan =
          createComponent({
            componentId:
              "SEM-COMP-003",

            path:
              "src/modules/orphan-module.ts",

            name:
              "Orphan Module",

            domain:
              "OPERATIONAL_MODULES",
          });

        const result =
          buildRepositoryFindings(
            createBaseInput({
              components: [
                ...createBaseInput()
                  .components,
                orphan,
              ],
            }),
          );

        expect(
          result.findings.some(
            (finding) =>
              finding.type ===
                "ORPHAN_COMPONENT" &&
              finding.componentIds.includes(
                "SEM-COMP-003",
              ),
          ),
        ).toBe(true);

        expect(
          result.summary.orphanComponents,
        ).toBe(1);

        expect(
          result.summary.blockingFindings,
        ).toBeGreaterThanOrEqual(1);
      },
    );

    test(
      "detects an ambiguous component",
      () => {
        const ambiguous =
          createComponent({
            componentId:
              "SEM-COMP-003",

            path:
              "src/unknown/component.ts",

            name:
              "Unknown Component",

            domain:
              "UNKNOWN",

            status:
              "AMBIGUOUS",

            epistemicState:
              "INFERENCE",

            confidence:
              55,
          });

        const result =
          buildRepositoryFindings(
            createBaseInput({
              components: [
                ...createBaseInput()
                  .components,
                ambiguous,
              ],
            }),
          );

        expect(
          result.findings.some(
            (finding) =>
              finding.type ===
              "AMBIGUOUS_COMPONENT",
          ),
        ).toBe(true);

        expect(
          result.summary.ambiguousComponents,
        ).toBe(1);
      },
    );

    test(
      "detects an unverifiable component",
      () => {
        const unverifiable =
          createComponent({
            componentId:
              "SEM-COMP-003",

            path:
              "src/unknown/unverified.ts",

            name:
              "Unverified Component",

            domain:
              "UNKNOWN",

            status:
              "NOT_VERIFIABLE",

            epistemicState:
              "NOT_VERIFIABLE",

            confidence:
              0,

            primaryResponsibility:
              null,

            evidenceIds:
              [],
          });

        const result =
          buildRepositoryFindings(
            createBaseInput({
              components: [
                ...createBaseInput()
                  .components,
                unverifiable,
              ],
            }),
          );

        expect(
          result.findings.some(
            (finding) =>
              finding.type ===
              "UNVERIFIABLE_COMPONENT",
          ),
        ).toBe(true);

        expect(
          result.summary.unverifiableComponents,
        ).toBe(1);

        expect(
          result.summary.highFindings,
        ).toBeGreaterThanOrEqual(1);
      },
    );

    test(
      "detects duplicated primary responsibilities",
      () => {
        const components:
          readonly RepositorySemanticComponent[] =
          [
            createComponent({
              componentId:
                "SEM-COMP-001",

              path:
                "src/runtime/service-a.ts",

              name:
                "Service A",

              domain:
                "RUNTIME",

              primaryResponsibility:
                "Execute governed runtime operations.",
            }),

            createComponent({
              componentId:
                "SEM-COMP-002",

              path:
                "src/runtime/service-b.ts",

              name:
                "Service B",

              domain:
                "RUNTIME",

              primaryResponsibility:
                "Execute governed runtime operations.",
            }),
          ];

        const relations:
          readonly RepositorySemanticRelation[] =
          [
            createRelation({
              relationId:
                "SEM-REL-001",

              sourceComponentId:
                "SEM-COMP-001",

              targetComponentId:
                "SEM-COMP-002",
            }),
          ];

        const result =
          buildRepositoryFindings({
            components,

            capabilities:
              [],

            relations,
          });

        expect(
          result.findings.some(
            (finding) =>
              finding.type ===
              "DUPLICATED_PRIMARY_RESPONSIBILITY",
          ),
        ).toBe(true);

        expect(
          result.summary.duplicatedResponsibilities,
        ).toBe(1);
      },
    );

    test(
      "detects a declared-only capability",
      () => {
        const capability =
          createCapability({
            capabilityId:
              "SEM-CAP-001",

            name:
              "Repository Refactoring",

            domain:
              "OPERATIONAL_MODULES",

            componentIds: [
              "SEM-COMP-001",
            ],

            state:
              "DECLARED",

            confidence:
              45,
          });

        const result =
          buildRepositoryFindings(
            createBaseInput({
              capabilities: [
                capability,
              ],
            }),
          );

        expect(
          result.findings.some(
            (finding) =>
              finding.type ===
              "DECLARED_CAPABILITY_ONLY",
          ),
        ).toBe(true);

        expect(
          result.summary.declaredOnlyCapabilities,
        ).toBe(1);
      },
    );

    test(
      "detects an unverifiable capability",
      () => {
        const capability =
          createCapability({
            capabilityId:
              "SEM-CAP-001",

            name:
              "Unknown Capability",

            domain:
              "UNKNOWN",

            componentIds: [
              "SEM-COMP-001",
            ],

            state:
              "NOT_VERIFIABLE",

            epistemicState:
              "NOT_VERIFIABLE",

            confidence:
              0,

            evidenceIds:
              [],
          });

        const result =
          buildRepositoryFindings(
            createBaseInput({
              capabilities: [
                capability,
              ],
            }),
          );

        expect(
          result.findings.some(
            (finding) =>
              finding.type ===
              "UNVERIFIABLE_CAPABILITY",
          ),
        ).toBe(true);

        expect(
          result.summary.unverifiableCapabilities,
        ).toBe(1);
      },
    );

    test(
      "detects an isolated capability",
      () => {
        const isolatedComponent =
          createComponent({
            componentId:
              "SEM-COMP-003",

            path:
              "src/modules/isolated-engine.ts",

            name:
              "Isolated Engine",

            domain:
              "OPERATIONAL_MODULES",
          });

        const capability =
          createCapability({
            capabilityId:
              "SEM-CAP-001",

            name:
              "Isolated Analysis",

            domain:
              "OPERATIONAL_MODULES",

            componentIds: [
              "SEM-COMP-003",
            ],

            state:
              "IMPLEMENTED",
          });

        const result =
          buildRepositoryFindings(
            createBaseInput({
              components: [
                ...createBaseInput()
                  .components,
                isolatedComponent,
              ],

              capabilities: [
                capability,
              ],
            }),
          );

        expect(
          result.findings.some(
            (finding) =>
              finding.type ===
              "ISOLATED_CAPABILITY",
          ),
        ).toBe(true);

        expect(
          result.summary.isolatedCapabilities,
        ).toBe(1);
      },
    );

    test(
      "detects an API component without a runtime relation",
      () => {
        const components:
          readonly RepositorySemanticComponent[] =
          [
            createComponent({
              componentId:
                "SEM-API-001",

              path:
                "app/api/v1/chat/route.ts",

              name:
                "Chat API",

              domain:
                "API",
            }),

            createComponent({
              componentId:
                "SEM-API-002",

              path:
                "app/api/v1/files/route.ts",

              name:
                "Files API",

              domain:
                "API",
            }),
          ];

        const relations:
          readonly RepositorySemanticRelation[] =
          [
            createRelation({
              relationId:
                "SEM-REL-001",

              sourceComponentId:
                "SEM-API-001",

              targetComponentId:
                "SEM-API-002",
            }),
          ];

        const result =
          buildRepositoryFindings({
            components,

            capabilities:
              [],

            relations,
          });

        expect(
          result.findings.filter(
            (finding) =>
              finding.type ===
              "API_WITHOUT_RUNTIME_RELATION",
          ),
        ).toHaveLength(2);
      },
    );

    test(
      "detects a low-confidence component",
      () => {
        const lowConfidence =
          createComponent({
            componentId:
              "SEM-COMP-003",

            path:
              "src/runtime/low-confidence.ts",

            name:
              "Low Confidence",

            domain:
              "RUNTIME",

            confidence:
              35,
          });

        const relations:
          readonly RepositorySemanticRelation[] =
          [
            createRelation({
              relationId:
                "SEM-REL-001",

              sourceComponentId:
                "SEM-COMP-001",

              targetComponentId:
                "SEM-COMP-002",
            }),

            createRelation({
              relationId:
                "SEM-REL-002",

              sourceComponentId:
                "SEM-COMP-002",

              targetComponentId:
                "SEM-COMP-003",
            }),
          ];

        const result =
          buildRepositoryFindings({
            components: [
              ...createBaseInput()
                .components,
              lowConfidence,
            ],

            capabilities:
              [],

            relations,
          });

        expect(
          result.findings.some(
            (finding) =>
              finding.type ===
              "LOW_CONFIDENCE_COMPONENT",
          ),
        ).toBe(true);

        expect(
          result.summary.lowFindings,
        ).toBe(1);
      },
    );

    test(
      "returns findings in deterministic order",
      () => {
        const component =
          createComponent({
            componentId:
              "SEM-COMP-003",

            path:
              "src/unknown/unverified.ts",

            name:
              "Unverified",

            domain:
              "UNKNOWN",

            status:
              "NOT_VERIFIABLE",

            epistemicState:
              "NOT_VERIFIABLE",

            confidence:
              0,

            primaryResponsibility:
              null,

            evidenceIds:
              [],
          });

        const input =
          createBaseInput({
            components: [
              ...createBaseInput()
                .components,
              component,
            ],
          });

        const first =
          buildRepositoryFindings(
            input,
          );

        const second =
          buildRepositoryFindings(
            input,
          );

        expect(
          second,
        ).toEqual(first);

        expect(
          Object.isFrozen(
            first.findings,
          ),
        ).toBe(true);
      },
    );

    test(
      "preserves governance boundaries",
      () => {
        const result =
          buildRepositoryFindings(
            createBaseInput(),
          );

        expect(
          result.governance.deterministic,
        ).toBe(true);

        expect(
          result.governance.evidenceBased,
        ).toBe(true);

        expect(
          result.governance.failClosed,
        ).toBe(true);

        expect(
          result.governance.autonomousExecution,
        ).toBe(false);

        expect(
          result.governance.humanAuthorizationRequired,
        ).toBe(true);

        expect(
          result.governance.persistentMemoryCreated,
        ).toBe(false);

        expect(
          result.governance.automaticRecallUsed,
        ).toBe(false);

        expect(
          result.governance.legalCertification,
        ).toBe(false);

        expect(
          result.legalCertification,
        ).toBe(false);
      },
    );
  },
);
