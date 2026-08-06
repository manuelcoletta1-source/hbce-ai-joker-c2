/**
 * HERMETICUM B.C.E. S.r.l.
 * AI JOKER-C2
 *
 * Governed Integration Planner
 *
 * Deterministic input projection
 * Fail Closed
 * Human Authorization Required
 * Automatic Repository Mutation: false
 * Legal Certification: false
 */

import type {
  IntegrationPlan,
  IntegrationPlannerInput,
  IntegrationPlannerOutput,
} from "./integration-types";

function requireNonEmptyString(
  value: string,
  code: string,
): string {
  const normalized = value.trim();

  if (normalized.length === 0) {
    throw new Error(code);
  }

  return normalized;
}

function buildPlanId(
  input: IntegrationPlannerInput,
): string {
  const hypothesisId =
    requireNonEmptyString(
      input.hypothesis.id,
      "INTEGRATION_PLANNER_HYPOTHESIS_ID_REQUIRED",
    );

  return `INTEGRATION-PLAN-${hypothesisId}`;
}

export function createIntegrationPlan(
  input: IntegrationPlannerInput,
): Readonly<IntegrationPlannerOutput> {
  const objective =
    requireNonEmptyString(
      input.objective,
      "INTEGRATION_PLANNER_OBJECTIVE_REQUIRED",
    );

  if (
    !Array.isArray(input.candidateTargets) ||
    input.candidateTargets.length === 0
  ) {
    throw new Error(
      "INTEGRATION_PLANNER_TARGETS_REQUIRED",
    );
  }

  if (
    !Array.isArray(input.constraints)
  ) {
    throw new Error(
      "INTEGRATION_PLANNER_CONSTRAINTS_REQUIRED",
    );
  }

  const operatorAuthorized =
    input.operatorAuthorized === true;

  const plan: Readonly<IntegrationPlan> =
    Object.freeze({
      id:
        buildPlanId(input),

      title:
        objective,

      objective,

      hypothesis:
        input.hypothesis,

      targets:
        Object.freeze([
          ...input.candidateTargets,
        ]),

      constraints:
        Object.freeze([
          ...input.constraints,
        ]),

      expectedImpact:
        input.expectedImpact,

      status:
        operatorAuthorized
          ? "AUTHORIZED"
          : "READY_FOR_REVIEW",

      humanAuthorizationRequired:
        true,

      operatorAuthorized,

      /**
       * Deterministic placeholder.
       *
       * The current IntegrationPlannerInput contract does not yet expose
       * an external timestamp. No runtime clock is consulted.
       */
      createdAt:
        "NOT_PROVIDED",
    });

  return Object.freeze({
    plan,

    decision:
      operatorAuthorized
        ? "ACCEPT"
        : "REVIEW_REQUIRED",

    reasons:
      operatorAuthorized
        ? Object.freeze([
            "Operator authorization present.",
            "Integration plan created without repository mutation.",
          ])
        : Object.freeze([
            "Human authorization required.",
          ]),
  });
}
