/**
 * HERMETICUM B.C.E. S.r.l.
 * AI JOKER-C2
 *
 * Knowledge Runtime Engine
 *
 * Creates one governed knowledge cycle from explicitly supplied input.
 *
 * Deterministic: true
 * Fail Closed: true
 * Human Authorization Required: true
 * Automatic Persistence: false
 * Automatic Recall: false
 * Automatic Repository Mutation: false
 * Legal Certification: false
 */

import type {
  KnowledgeCycle,
  KnowledgeCycleInput,
  KnowledgeCycleResult,
  KnowledgeDecision,
} from "./knowledge-types";

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

function validateKnowledgeCycleInput(
  input: KnowledgeCycleInput,
): void {
  requireNonEmptyString(
    input.id,
    "KNOWLEDGE_CYCLE_ID_REQUIRED",
  );

  requireNonEmptyString(
    input.createdAt,
    "KNOWLEDGE_CYCLE_TIMESTAMP_REQUIRED",
  );

  requireNonEmptyString(
    input.hypothesis.id,
    "KNOWLEDGE_HYPOTHESIS_ID_REQUIRED",
  );

  requireNonEmptyString(
    input.hypothesis.statement,
    "KNOWLEDGE_HYPOTHESIS_STATEMENT_REQUIRED",
  );

  requireNonEmptyString(
    input.hypothesis.expectedEffect,
    "KNOWLEDGE_HYPOTHESIS_EXPECTED_EFFECT_REQUIRED",
  );

  requireNonEmptyString(
    input.action.id,
    "KNOWLEDGE_ACTION_ID_REQUIRED",
  );

  requireNonEmptyString(
    input.action.hypothesisId,
    "KNOWLEDGE_ACTION_HYPOTHESIS_ID_REQUIRED",
  );

  requireNonEmptyString(
    input.action.description,
    "KNOWLEDGE_ACTION_DESCRIPTION_REQUIRED",
  );

  if (
    input.action.hypothesisId !==
    input.hypothesis.id
  ) {
    throw new Error(
      "KNOWLEDGE_ACTION_HYPOTHESIS_MISMATCH",
    );
  }

  if (
    input.action.humanAuthorizationRequired !==
    true
  ) {
    throw new Error(
      "KNOWLEDGE_ACTION_AUTHORIZATION_INVARIANT_VIOLATION",
    );
  }

  const observationIds =
    input.observations.map(
      (observation) =>
        requireNonEmptyString(
          observation.id,
          "KNOWLEDGE_OBSERVATION_ID_REQUIRED",
        ),
    );

  if (
    new Set(observationIds).size !==
    observationIds.length
  ) {
    throw new Error(
      "KNOWLEDGE_DUPLICATE_OBSERVATION_ID",
    );
  }

  for (
    const supportingObservationId
    of input.hypothesis.supportingObservationIds
  ) {
    if (
      !observationIds.includes(
        supportingObservationId,
      )
    ) {
      throw new Error(
        `KNOWLEDGE_UNKNOWN_SUPPORTING_OBSERVATION:${supportingObservationId}`,
      );
    }
  }
}

export function createKnowledgeCycle(
  input: KnowledgeCycleInput,
): Readonly<KnowledgeCycleResult> {
  validateKnowledgeCycleInput(
    input,
  );

  const operatorAuthorized =
    input.operatorAuthorized === true &&
    input.action.operatorAuthorized === true;

  const cycle: Readonly<KnowledgeCycle> =
    Object.freeze({
      id:
        input.id.trim(),

      observations:
        Object.freeze([
          ...input.observations,
        ]),

      hypothesis:
        input.hypothesis,

      action:
        input.action,

      evaluation:
        undefined,

      learning:
        undefined,

      status:
        operatorAuthorized
          ? "AUTHORIZED"
          : "HYPOTHESIZED",

      operatorAuthorized,

      humanAuthorizationRequired:
        true,

      createdAt:
        input.createdAt.trim(),

      completedAt:
        undefined,
    });

  const decision: KnowledgeDecision =
    operatorAuthorized
      ? "ACCEPT"
      : "REVIEW_REQUIRED";

  const reasons =
    operatorAuthorized
      ? Object.freeze([
          "Operator authorization present.",
          "Knowledge cycle created without automatic persistence or recall.",
        ])
      : Object.freeze([
          "Operator authorization required.",
        ]);

  return Object.freeze({
    cycle,
    decision,
    reasons,
  });
}
