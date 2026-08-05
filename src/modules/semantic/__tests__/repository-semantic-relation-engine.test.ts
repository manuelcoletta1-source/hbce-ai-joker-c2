/**
 * HERMETICUM B.C.E. S.r.l.
 *
 * AI JOKER-C2
 *
 * MOD-002
 * Repository Semantic Relation Engine
 *
 * Deterministic Tests
 *
 * Revision:
 * AIJC2-MOD002-SEMANTIC-RELATION-ENGINE-TEST-v1_0
 *
 * Purpose:
 * - verify deterministic relation construction;
 * - prevent self-relations;
 * - prevent unsupported cross-domain relations;
 * - preserve epistemic and governance boundaries;
 * - verify that no execution or persistence capability is implied.
 *
 * legalCertification=false
 */

import {
  describe,
  expect,
  test,
} from "vitest";

import {
  buildSemanticRelations,
  REPOSITORY_SEMANTIC_RELATION_ENGINE_REVISION,
} from "../repository-semantic-relation-engine";

import type {
  RepositorySemanticComponent,
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
      "Deterministic test responsibility.",

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
      [],

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

describe(
  "MOD-002 Repository Semantic Relation Engine",
  () => {
    test(
      "builds deterministic relations between components in the same domain",
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
            }),
          ];

        const relations =
          buildSemanticRelations(
            components,
          );

        expect(
          relations,
        ).toHaveLength(2);

        expect(
          relations[0],
        ).toEqual({
          relationId:
            "REL-1",

          sourceComponentId:
            "SEM-COMP-001",

          targetComponentId:
            "SEM-COMP-002",

          relationType:
            "USES",

          evidenceIds:
            [],

          epistemicState:
            "INFERENCE",

          confidence:
            60,
        });

        expect(
          relations[1],
        ).toEqual({
          relationId:
            "REL-2",

          sourceComponentId:
            "SEM-COMP-002",

          targetComponentId:
            "SEM-COMP-001",

          relationType:
            "USES",

          evidenceIds:
            [],

          epistemicState:
            "INFERENCE",

          confidence:
            60,
        });

        expect(
          REPOSITORY_SEMANTIC_RELATION_ENGINE_REVISION,
        ).toBe(
          "AIJC2-MOD002-SEMANTIC-RELATION-ENGINE-v1_0",
        );
      },
    );

    test(
      "does not create self-relations",
      () => {
        const component =
          createComponent({
            componentId:
              "SEM-COMP-001",

            path:
              "src/runtime/runtime-service.ts",

            name:
              "Runtime Service",

            domain:
              "RUNTIME",
          });

        const relations =
          buildSemanticRelations([
            component,
          ]);

        expect(
          relations,
        ).toEqual([]);
      },
    );

    test(
      "does not create relations across different semantic domains",
      () => {
        const components:
          readonly RepositorySemanticComponent[] =
          [
            createComponent({
              componentId:
                "SEM-COMP-001",

              path:
                "app/api/v1/chat/route.ts",

              name:
                "Chat Route",

              domain:
                "API",
            }),

            createComponent({
              componentId:
                "SEM-COMP-002",

              path:
                "src/runtime/chat-service.ts",

              name:
                "Chat Runtime Service",

              domain:
                "RUNTIME",
            }),
          ];

        const relations =
          buildSemanticRelations(
            components,
          );

        expect(
          relations,
        ).toEqual([]);
      },
    );

    test(
      "creates relations only within each matching domain group",
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
                "app/api/v1/operations/route.ts",

              name:
                "Operations API",

              domain:
                "API",
            }),

            createComponent({
              componentId:
                "SEM-RUNTIME-001",

              path:
                "src/runtime/chat-service.ts",

              name:
                "Chat Service",

              domain:
                "RUNTIME",
            }),

            createComponent({
              componentId:
                "SEM-RUNTIME-002",

              path:
                "src/runtime/operation-service.ts",

              name:
                "Operation Service",

              domain:
                "RUNTIME",
            }),
          ];

        const relations =
          buildSemanticRelations(
            components,
          );

        expect(
          relations,
        ).toHaveLength(4);

        expect(
          relations.every(
            (relation) => {
              const source =
                components.find(
                  (component) =>
                    component.componentId ===
                    relation.sourceComponentId,
                );

              const target =
                components.find(
                  (component) =>
                    component.componentId ===
                    relation.targetComponentId,
                );

              return (
                source !== undefined &&
                target !== undefined &&
                source.domain ===
                  target.domain
              );
            },
          ),
        ).toBe(true);
      },
    );

    test(
      "produces the same result for the same ordered input",
      () => {
        const components:
          readonly RepositorySemanticComponent[] =
          [
            createComponent({
              componentId:
                "SEM-COMP-001",

              path:
                "src/modules/module-a.ts",

              name:
                "Module A",

              domain:
                "OPERATIONAL_MODULES",
            }),

            createComponent({
              componentId:
                "SEM-COMP-002",

              path:
                "src/modules/module-b.ts",

              name:
                "Module B",

              domain:
                "OPERATIONAL_MODULES",
            }),

            createComponent({
              componentId:
                "SEM-COMP-003",

              path:
                "src/modules/module-c.ts",

              name:
                "Module C",

              domain:
                "OPERATIONAL_MODULES",
            }),
          ];

        const first =
          buildSemanticRelations(
            components,
          );

        const second =
          buildSemanticRelations(
            components,
          );

        expect(
          second,
        ).toEqual(first);

        expect(
          first,
        ).toHaveLength(6);
      },
    );

    test(
      "preserves inference status and does not fabricate evidence",
      () => {
        const components:
          readonly RepositorySemanticComponent[] =
          [
            createComponent({
              componentId:
                "SEM-COMP-001",

              path:
                "src/runtime/runtime-a.ts",

              name:
                "Runtime A",

              domain:
                "RUNTIME",

              evidenceIds: [
                "EVIDENCE-001",
              ],
            }),

            createComponent({
              componentId:
                "SEM-COMP-002",

              path:
                "src/runtime/runtime-b.ts",

              name:
                "Runtime B",

              domain:
                "RUNTIME",

              evidenceIds: [
                "EVIDENCE-002",
              ],
            }),
          ];

        const relations =
          buildSemanticRelations(
            components,
          );

        expect(
          relations.every(
            (relation) =>
              relation.epistemicState ===
                "INFERENCE" &&
              relation.confidence ===
                60 &&
              relation.evidenceIds
                .length === 0,
          ),
        ).toBe(true);
      },
    );

    test(
      "returns an immutable relation collection",
      () => {
        const components:
          readonly RepositorySemanticComponent[] =
          [
            createComponent({
              componentId:
                "SEM-COMP-001",

              path:
                "src/runtime/a.ts",

              name:
                "A",

              domain:
                "RUNTIME",
            }),

            createComponent({
              componentId:
                "SEM-COMP-002",

              path:
                "src/runtime/b.ts",

              name:
                "B",

              domain:
                "RUNTIME",
            }),
          ];

        const relations =
          buildSemanticRelations(
            components,
          );

        expect(
          Object.isFrozen(
            relations,
          ),
        ).toBe(true);
      },
    );

    test(
      "returns no relations when no components are supplied",
      () => {
        const relations =
          buildSemanticRelations(
            [],
          );

        expect(
          relations,
        ).toEqual([]);

        expect(
          Object.isFrozen(
            relations,
          ),
        ).toBe(true);
      },
    );
  },
);
