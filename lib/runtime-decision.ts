/**
 * AI JOKER-C2 Runtime Decision Engine
 *
 * Deterministic runtime decision module for the HBCE / MATRIX governed runtime.
 *
 * This module combines:
 * - runtime state
 * - policy evaluation
 * - risk classification
 * - human oversight
 * - data class
 * - context class
 *
 * into a final RuntimeDecisionResult.
 *
 * The decision object is the control point before:
 * - model calls
 * - file processing
 * - output generation
 * - EVT generation
 * - ledger operations
 */

import type {
  ContextClass,
  DataClass,
  IntentClass,
  OversightState,
  PolicyStatus,
  RiskClass,
  RuntimeDecision,
  RuntimeDecisionResult,
  RuntimeState
} from "./runtime-types";

export type RuntimeDecisionInput = {
  runtimeState?: RuntimeState;
  policyStatus: PolicyStatus;
  policyProhibited?: boolean;
  policyFailClosed?: boolean;
  riskClass: RiskClass;
  oversightState: OversightState;
  contextClass?: ContextClass;
  intentClass?: IntentClass;
  dataClass?: DataClass;
  hasFiles?: boolean;
  evtPreferred?: boolean;
  auditPreferred?: boolean;
};

type DecisionFlags = {
  allowExecution: boolean;
  allowModelCall: boolean;
  allowFileProcessing: boolean;
  evtRequired: boolean;
  auditRequired: boolean;
  failClosed: boolean;
};

const DEFAULT_RUNTIME_STATE: RuntimeState = "OPERATIONAL";

export function decideRuntimeAction(
  input: RuntimeDecisionInput
): RuntimeDecisionResult {
  const runtimeState = input.runtimeState ?? DEFAULT_RUNTIME_STATE;
  const reasons: string[] = [];

  const runtimeDecision = decideByRuntimeState(runtimeState);

  if (runtimeDecision) {
    return buildDecision(
      runtimeDecision.decision,
      runtimeDecision.flags,
      runtimeDecision.reasons
    );
  }

  const prohibitedDecision = decideByProhibition(input);

  if (prohibitedDecision) {
    return buildDecision(
      prohibitedDecision.decision,
      prohibitedDecision.flags,
      prohibitedDecision.reasons
    );
  }

  const oversightBlockDecision = decideByOversightBlock(input);

  if (oversightBlockDecision) {
    return buildDecision(
      oversightBlockDecision.decision,
      oversightBlockDecision.flags,
      oversightBlockDecision.reasons
    );
  }

  const dataDecision = decideByDataClass(input);

  if (dataDecision) {
    return buildDecision(
      dataDecision.decision,
      dataDecision.flags,
      dataDecision.reasons
    );
  }

  const criticalDecision = decideByCriticalRisk(input);

  if (criticalDecision) {
    return buildDecision(
      criticalDecision.decision,
      criticalDecision.flags,
      criticalDecision.reasons
    );
  }

  const highDecision = decideByHighRisk(input);

  if (highDecision) {
    return buildDecision(
      highDecision.decision,
      highDecision.flags,
      highDecision.reasons
    );
  }

  const unknownDecision = decideByUnknownRisk(input);

  if (unknownDecision) {
    return buildDecision(
      unknownDecision.decision,
      unknownDecision.flags,
      unknownDecision.reasons
    );
  }

  const mediumDecision = decideByMediumRisk(input);

  if (mediumDecision) {
    return buildDecision(
      mediumDecision.decision,
      mediumDecision.flags,
      mediumDecision.reasons
    );
  }

  const restrictedDecision = decideByRestrictedPolicy(input);

  if (restrictedDecision) {
    return buildDecision(
      restrictedDecision.decision,
      restrictedDecision.flags,
      restrictedDecision.reasons
    );
  }

  const lowDecision = decideByLowRisk(input);

  if (lowDecision) {
    return buildDecision(
      lowDecision.decision,
      lowDecision.flags,
      lowDecision.reasons
    );
  }

  reasons.push("No explicit runtime decision rule matched.");
  reasons.push("Defaulting to ESCALATE for conservative fail-closed behavior.");

  return buildDecision("ESCALATE", escalationFlags(true, true), reasons);
}

export function shouldAllowModelCall(decision: RuntimeDecisionResult): boolean {
  return decision.allowModelCall && decision.decision !== "BLOCK";
}

export function shouldAllowExecution(decision: RuntimeDecisionResult): boolean {
  return decision.allowExecution && decision.decision !== "BLOCK";
}

export function shouldGenerateEvt(decision: RuntimeDecisionResult): boolean {
  return decision.evtRequired;
}

export function shouldAudit(decision: RuntimeDecisionResult): boolean {
  return decision.auditRequired;
}

export function isFailClosed(decision: RuntimeDecisionResult): boolean {
  return decision.failClosed;
}

export function isTerminalDecision(decision: RuntimeDecisionResult): boolean {
  return decision.decision === "BLOCK" || decision.decision === "NOOP";
}

export function buildDecisionSummary(
  decision: RuntimeDecisionResult
): string {
  return [
    `Decision: ${decision.decision}`,
    `Execution: ${decision.allowExecution ? "allowed" : "not allowed"}`,
    `Model call: ${decision.allowModelCall ? "allowed" : "not allowed"}`,
    `File processing: ${
      decision.allowFileProcessing ? "allowed" : "not allowed"
    }`,
    `EVT required: ${decision.evtRequired ? "yes" : "no"}`,
    `Audit required: ${decision.auditRequired ? "yes" : "no"}`,
    `Fail-closed: ${decision.failClosed ? "yes" : "no"}`
  ].join("\n");
}

function decideByRuntimeState(input: RuntimeState):
  | {
      decision: RuntimeDecision;
      flags: DecisionFlags;
      reasons: string[];
    }
  | null {
  switch (input) {
    case "OPERATIONAL":
      return null;

    case "DEGRADED":
      return {
        decision: "DEGRADE",
        flags: degradedFlags(true, true),
        reasons: [
          "Runtime state is DEGRADED.",
          "Only limited safe support is allowed."
        ]
      };

    case "AUDIT_ONLY":
      return {
        decision: "AUDIT",
        flags: auditFlags(false, true),
        reasons: [
          "Runtime state is AUDIT_ONLY.",
          "The runtime may record or review but should not execute sensitive operations."
        ]
      };

    case "MAINTENANCE":
      return {
        decision: "NOOP",
        flags: noopFlags(true),
        reasons: [
          "Runtime state is MAINTENANCE.",
          "Operational execution is suspended."
        ]
      };

    case "BLOCKED":
      return {
        decision: "BLOCK",
        flags: blockFlags(true, true),
        reasons: [
          "Runtime state is BLOCKED.",
          "No operation may proceed."
        ]
      };

    case "INVALID":
      return {
        decision: "BLOCK",
        flags: blockFlags(true, true),
        reasons: [
          "Runtime state is INVALID.",
          "Invalid runtime state triggers fail-closed blocking."
        ]
      };

    default:
      return {
        decision: "BLOCK",
        flags: blockFlags(true, true),
        reasons: [
          "Runtime state is unknown.",
          "Unknown runtime state triggers fail-closed blocking."
        ]
      };
  }
}

function decideByProhibition(input: RuntimeDecisionInput):
  | {
      decision: RuntimeDecision;
      flags: DecisionFlags;
      reasons: string[];
    }
  | null {
  if (
    input.policyProhibited ||
    input.policyStatus === "PROHIBITED" ||
    input.riskClass === "PROHIBITED" ||
    input.oversightState === "BLOCKED"
  ) {
    return {
      decision: "BLOCK",
      flags: blockFlags(true, true),
      reasons: [
        "Policy, risk or oversight marked the operation as prohibited.",
        "Prohibited operations must be blocked."
      ]
    };
  }

  if (input.intentClass === "PROHIBITED") {
    return {
      decision: "BLOCK",
      flags: blockFlags(true, true),
      reasons: [
        "Intent class is PROHIBITED.",
        "Prohibited intent must be blocked."
      ]
    };
  }

  return null;
}

function decideByOversightBlock(input: RuntimeDecisionInput):
  | {
      decision: RuntimeDecision;
      flags: DecisionFlags;
      reasons: string[];
    }
  | null {
  if (input.oversightState === "REJECTED") {
    return {
      decision: "BLOCK",
      flags: blockFlags(true, true),
      reasons: [
        "Human oversight rejected the operation.",
        "Rejected operations must not proceed."
      ]
    };
  }

  if (input.oversightState === "UNKNOWN" && input.riskClass !== "LOW") {
    return {
      decision: "ESCALATE",
      flags: escalationFlags(true, true),
      reasons: [
        "Human oversight state is UNKNOWN in a non-low-risk context.",
        "Unknown oversight must be escalated."
      ]
    };
  }

  return null;
}

function decideByDataClass(input: RuntimeDecisionInput):
  | {
      decision: RuntimeDecision;
      flags: DecisionFlags;
      reasons: string[];
    }
  | null {
  switch (input.dataClass) {
    case "SECRET":
      return {
        decision: "BLOCK",
        flags: blockFlags(true, true),
        reasons: [
          "Data class is SECRET.",
          "Secrets must not be processed as ordinary runtime content."
        ]
      };

    case "CRITICAL_OPERATIONAL":
      return {
        decision: "ESCALATE",
        flags: escalationFlags(true, true),
        reasons: [
          "Data class is CRITICAL_OPERATIONAL.",
          "Critical operational data requires specialist review."
        ]
      };

    case "UNKNOWN":
      if (input.riskClass !== "LOW") {
        return {
          decision: "ESCALATE",
          flags: escalationFlags(true, true),
          reasons: [
            "Data class is UNKNOWN in a non-low-risk context.",
            "Unknown sensitive data must be handled conservatively."
          ]
        };
      }

      return null;

    default:
      return null;
  }
}

function decideByCriticalRisk(input: RuntimeDecisionInput):
  | {
      decision: RuntimeDecision;
      flags: DecisionFlags;
      reasons: string[];
    }
  | null {
  if (input.riskClass !== "CRITICAL") {
    return null;
  }

  if (input.oversightState === "COMPLETED") {
    return {
      decision: "AUDIT",
      flags: auditFlags(true, true),
      reasons: [
        "Risk class is CRITICAL.",
        "Human review is completed.",
        "Operation may proceed only as auditable controlled support."
      ]
    };
  }

  return {
    decision: "ESCALATE",
    flags: escalationFlags(true, true),
    reasons: [
      "Risk class is CRITICAL.",
      "Critical risk requires escalation before operational use."
    ]
  };
}

function decideByHighRisk(input: RuntimeDecisionInput):
  | {
      decision: RuntimeDecision;
      flags: DecisionFlags;
      reasons: string[];
    }
  | null {
  if (input.riskClass !== "HIGH") {
    return null;
  }

  if (input.oversightState === "COMPLETED") {
    return {
      decision: "AUDIT",
      flags: auditFlags(true, true),
      reasons: [
        "Risk class is HIGH.",
        "Human review is completed.",
        "Operation may proceed with audit requirement."
      ]
    };
  }

  if (
    input.contextClass === "SECURITY" ||
    input.contextClass === "DUAL_USE" ||
    input.contextClass === "CRITICAL_INFRASTRUCTURE"
  ) {
    return {
      decision: "DEGRADE",
      flags: degradedFlags(true, true),
      reasons: [
        "Risk class is HIGH in a sensitive context.",
        "Only limited safe support is allowed before review."
      ]
    };
  }

  return {
    decision: "ESCALATE",
    flags: escalationFlags(true, true),
    reasons: [
      "Risk class is HIGH.",
      "Human review is required before operational reliance."
    ]
  };
}

function decideByUnknownRisk(input: RuntimeDecisionInput):
  | {
      decision: RuntimeDecision;
      flags: DecisionFlags;
      reasons: string[];
    }
  | null {
  if (input.riskClass !== "UNKNOWN") {
    return null;
  }

  return {
    decision: "ESCALATE",
    flags: escalationFlags(true, true),
    reasons: [
      "Risk class is UNKNOWN.",
      "Unknown risk must not be treated as permission."
    ]
  };
}

function decideByMediumRisk(input: RuntimeDecisionInput):
  | {
      decision: RuntimeDecision;
      flags: DecisionFlags;
      reasons: string[];
    }
  | null {
  if (input.riskClass !== "MEDIUM") {
    return null;
  }

  if (
    input.policyStatus === "RESTRICTED" ||
    input.oversightState === "REQUIRED" ||
    input.oversightState === "ESCALATED" ||
    input.contextClass === "SECURITY" ||
    input.contextClass === "COMPLIANCE" ||
    input.contextClass === "AI_GOVERNANCE" ||
    input.contextClass === "DUAL_USE"
  ) {
    return {
      decision: "AUDIT",
      flags: auditFlags(true, true),
      reasons: [
        "Risk class is MEDIUM with restricted, sensitive or governance-relevant context.",
        "Operation may proceed with audit requirement."
      ]
    };
  }

  return {
    decision: "AUDIT",
    flags: auditFlags(true, Boolean(input.auditPreferred)),
    reasons: [
      "Risk class is MEDIUM.",
      "Audit-ready handling is recommended."
    ]
  };
}

function decideByRestrictedPolicy(input: RuntimeDecisionInput):
  | {
      decision: RuntimeDecision;
      flags: DecisionFlags;
      reasons: string[];
    }
  | null {
  if (input.policyStatus !== "RESTRICTED") {
    return null;
  }

  if (input.policyFailClosed) {
    return {
      decision: "ESCALATE",
      flags: escalationFlags(true, true),
      reasons: [
        "Policy status is RESTRICTED with fail-closed requirement.",
        "Escalation is required before execution."
      ]
    };
  }

  return {
    decision: "AUDIT",
    flags: auditFlags(true, true),
    reasons: [
      "Policy status is RESTRICTED.",
      "Operation may proceed only with audit-aware handling."
    ]
  };
}

function decideByLowRisk(input: RuntimeDecisionInput):
  | {
      decision: RuntimeDecision;
      flags: DecisionFlags;
      reasons: string[];
    }
  | null {
  if (input.riskClass !== "LOW") {
    return null;
  }

  if (input.oversightState === "RECOMMENDED") {
    return {
      decision: "ALLOW",
      flags: allowFlags(Boolean(input.evtPreferred), Boolean(input.auditPreferred)),
      reasons: [
        "Risk class is LOW.",
        "Human review is recommended but not required for ordinary use."
      ]
    };
  }

  return {
    decision: "ALLOW",
    flags: allowFlags(Boolean(input.evtPreferred), Boolean(input.auditPreferred)),
    reasons: [
      "Risk class is LOW.",
      "No blocking, escalation or audit trigger detected."
    ]
  };
}

function allowFlags(evtRequired = false, auditRequired = false): DecisionFlags {
  return {
    allowExecution: true,
    allowModelCall: true,
    allowFileProcessing: true,
    evtRequired,
    auditRequired,
    failClosed: false
  };
}

function auditFlags(
  allowModelCall: boolean,
  evtRequired = true
): DecisionFlags {
  return {
    allowExecution: true,
    allowModelCall,
    allowFileProcessing: true,
    evtRequired,
    auditRequired: true,
    failClosed: false
  };
}

function degradedFlags(
  evtRequired = true,
  auditRequired = true
): DecisionFlags {
  return {
    allowExecution: true,
    allowModelCall: true,
    allowFileProcessing: false,
    evtRequired,
    auditRequired,
    failClosed: false
  };
}

function escalationFlags(
  evtRequired = true,
  auditRequired = true
): DecisionFlags {
  return {
    allowExecution: false,
    allowModelCall: false,
    allowFileProcessing: false,
    evtRequired,
    auditRequired,
    failClosed: true
  };
}

function blockFlags(
  evtRequired = true,
  auditRequired = true
): DecisionFlags {
  return {
    allowExecution: false,
    allowModelCall: false,
    allowFileProcessing: false,
    evtRequired,
    auditRequired,
    failClosed: true
  };
}

function noopFlags(evtRequired = true): DecisionFlags {
  return {
    allowExecution: false,
    allowModelCall: false,
    allowFileProcessing: false,
    evtRequired,
    auditRequired: true,
    failClosed: true
  };
}

function buildDecision(
  decision: RuntimeDecision,
  flags: DecisionFlags,
  reasons: string[]
): RuntimeDecisionResult {
  return {
    decision,
    allowExecution: flags.allowExecution,
    allowModelCall: flags.allowModelCall,
    allowFileProcessing: flags.allowFileProcessing,
    evtRequired: flags.evtRequired,
    auditRequired: flags.auditRequired,
    failClosed: flags.failClosed,
    reasons: uniqueReasons(reasons)
  };
}

function uniqueReasons(reasons: string[]): string[] {
  return Array.from(new Set(reasons.filter(Boolean)));
}
