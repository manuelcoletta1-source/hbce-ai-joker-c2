/**
 * HERMETICUM B.C.E. S.r.l.
 * AI JOKER-C2
 *
 * Knowledge Runtime Engine
 *
 * Deterministic
 * Fail Closed
 * Human Authorization Required
 */

import type {
  KnowledgeCycle,
  KnowledgeCycleInput,
  KnowledgeCycleResult,
  KnowledgeDecision,
} from "./knowledge-types";

export function createKnowledgeCycle(
  input: KnowledgeCycleInput,
): Readonly<KnowledgeCycleResult> {

  const cycle: KnowledgeCycle = Object.freeze({

    id: input.id,

    observations: Object.freeze([
      ...input.observations,
    ]),

    hypothesis: input.hypothesis,

    action: input.action,

    evaluation: undefined,

    learning: undefined,

    status: input.operatorAuthorized
      ? "AUTHORIZED"
      : "HYPOTHESIZED",

    operatorAuthorized:
      input.operatorAuthorized,

    humanAuthorizationRequired: true,

    createdAt: input.createdAt,

    completedAt: undefined,

  });

  const decision: KnowledgeDecision =
    input.operatorAuthorized
      ? "ACCEPT"
      : "REVIEW_REQUIRED";

  const reasons =
    input.operatorAuthorized
      ? Object.freeze([
          "Operator authorization present.",
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
