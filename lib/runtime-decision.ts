/**
 * AI JOKER-C2 Runtime Decision Engine
 *
 * Deterministic runtime decision module for the HBCE / IPR governed runtime.
 *
 * This module combines:
 * - runtime state
 * - IPR binding
 * - project domain
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
 * - EVT/IPR-bound memory updates
 * - OPC proof receipt generation
 * - ledger operations
 *
 * Canonical hierarchy:
 * - IPR = primary operational identity and proof instrument
 * - AI JOKER-C2 = governed runtime demonstrator
 * - MATRIX = operational infrastructure architecture
 * - U.S.E. = MATRIX-derived political-institutional application
 * - CORPUS_ESOTEROLOGIA_ERMETICA = disciplinary grammar
 * - APOKALYPSIS = historical threshold analysis
 * - EVT = event trace
 * - EVT/IPR memory = runtime continuity
 * - OPC = operational proof receipt
 */

import type {
  ContextClass,
  DataClass,
  IntentClass,
  OversightState,
  PolicyOutcome,
  PolicyStatus,
  ProjectDomain,
  RiskClass,
  RuntimeDecision,
  RuntimeDecisionResult,
  RuntimeState
} from "./runtime-types";

export type RuntimeDecisionInput = {
  runtimeState?: RuntimeState;
  policyStatus: PolicyStatus;
  policyOutcome?: PolicyOutcome;
  policyProhibited?: boolean;
  policyFailClosed?: boolean;
  riskClass: RiskClass;
  oversightState: OversightState;
  contextClass?: ContextClass;
  intentClass?: IntentClass;
  dataClass?: DataClass;
  projectDomain?: ProjectDomain;
  activeDomains?: ProjectDomain[];
  hasFiles?: boolean;
  evtPreferred?: boolean;
  auditPreferred?: boolean;
  memoryPreferred?: boolean;
  opcPreferred?: boolean;
  iprBindingPreferred?: boolean;

  /**
   * Civic safety flag.
   *
   * Must be true when a request attempts to connect personal identity
   * with democratic choice content, vote content, ballot content or
   * civic-choice content.
   */
  identityChoiceLinkage?: boolean;
};

type DecisionFlags = {
  allowExecution: boolean;
  allowModelCall: boolean;
  allowFileProcessing: boolean;
  evtRequired: boolean;
  auditRequired: boolean;
  failClosed: boolean;
  memoryRequired: boolean;
  opcRequired: boolean;
};

type DecisionEnvelope = {
  decision: RuntimeDecision;
  flags: DecisionFlags;
  reasons: string[];
};

const DEFAULT_RUNTIME_STATE: RuntimeState = "OPERATIONAL";

export function decideRuntimeAction(
  input: RuntimeDecisionInput
): RuntimeDecisionResult {
  const runtimeState = input.runtimeState ?? DEFAULT_RUNTIME_STATE;
  const reasons: string[] = [];

  const runtimeDecision = decideByRuntimeState(runtimeState);

  if (runtimeDecision) {
    return buildDecision(runtimeDecision, input);
  }

  const civicBlockDecision = decideByCivicProhibition(input);

  if (civicBlockDecision) {
    return buildDecision(civicBlockDecision, input);
  }

  const prohibitedDecision = decideByProhibition(input);

  if (prohibitedDecision) {
    return buildDecision(prohibitedDecision, input);
  }

  const oversightBlockDecision = decideByOversightBlock(input);

  if (oversightBlockDecision) {
    return buildDecision(oversightBlockDecision, input);
  }

  const dataDecision = decideByDataClass(input);

  if (dataDecision) {
    return buildDecision(dataDecision, input);
  }

  const civicDecision = decideByCivicContext(input);

  if (civicDecision) {
    return buildDecision(civicDecision, input);
  }

  const criticalDecision = decideByCriticalRisk(input);

  if (criticalDecision) {
    return buildDecision(criticalDecision, input);
  }

  const highDecision = decideByHighRisk(input);

  if (highDecision) {
    return buildDecision(highDecision, input);
  }

  const unknownDecision = decideByUnknownRisk(input);

  if (unknownDecision) {
    return buildDecision(unknownDecision, input);
  }

  const mediumDecision = decideByMediumRisk(input);

  if (mediumDecision) {
    return buildDecision(mediumDecision, input);
  }

  const restrictedDecision = decideByRestrictedPolicy(input);

  if (restrictedDecision) {
    return buildDecision(restrictedDecision, input);
  }

  const lowDecision = decideByLowRisk(input);

  if (lowDecision) {
    return buildDecision(lowDecision, input);
  }

  reasons.push("No explicit runtime decision rule matched.");
  reasons.push("Defaulting to ESCALATE for conservative fail-closed behavior.");

  return buildDecision(
    {
      decision: "ESCALATE",
      flags: escalationFlags(true, true),
      reasons
    },
    input
  );
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

export function shouldGenerateMemory(decision: RuntimeDecisionResult): boolean {
  return Boolean(decision.memoryRequired);
}

export function shouldGenerateOpc(decision: RuntimeDecisionResult): boolean {
  return Boolean(decision.opcRequired);
}

export function isFailClosed(decision: RuntimeDecisionResult): boolean {
  return decision.failClosed;
}

export function isTerminalDecision(decision: RuntimeDecisionResult): boolean {
  return decision.decision === "BLOCK" || decision.decision === "NOOP";
}

export function buildDecisionSummary(decision: RuntimeDecisionResult): string {
  return [
    `Decision: ${decision.decision}`,
    `Execution: ${decision.allowExecution ? "allowed" : "not allowed"}`,
    `Model call: ${decision.allowModelCall ? "allowed" : "not allowed"}`,
    `File processing: ${
      decision.allowFileProcessing ? "allowed" : "not allowed"
    }`,
    `IPR binding: ${decision.iprBinding ? "yes" : "no"}`,
    `EVT required: ${decision.evtRequired ? "yes" : "no"}`,
    `Memory required: ${decision.memoryRequired ? "yes" : "no"}`,
    `OPC required: ${decision.opcRequired ? "yes" : "no"}`,
    `Audit required: ${decision.auditRequired ? "yes" : "no"}`,
    `Fail-closed: ${decision.failClosed ? "yes" : "no"}`
  ].join("\n");
}

function decideByRuntimeState(runtimeState: RuntimeState): DecisionEnvelope | null {
  switch (runtimeState) {
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
        flags: auditFlags(false, true, true),
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

function decideByCivicProhibition(
  input: RuntimeDecisionInput
): DecisionEnvelope | null {
  if (
    input.identityChoiceLinkage ||
    input.dataClass === "DEMOCRATIC_CHOICE"
  ) {
    return {
      decision: "BLOCK",
      flags: blockFlags(true, true),
      reasons: [
        "Democratic choice content or identity-choice linkage detected.",
        "The runtime must not link personal identity to democratic vote or civic-choice content."
      ]
    };
  }

  return null;
}

function decideByProhibition(input: RuntimeDecisionInput): DecisionEnvelope | null {
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

function decideByOversightBlock(
  input: RuntimeDecisionInput
): DecisionEnvelope | null {
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

function decideByDataClass(input: RuntimeDecisionInput): DecisionEnvelope | null {
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

    case "CIVIC_SENSITIVE":
      return {
        decision: "AUDIT",
        flags: auditFlags(true, true, true),
        reasons: [
          "Data class is CIVIC_SENSITIVE.",
          "Civic-sensitive data may proceed only with audit-aware handling."
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

function decideByCivicContext(input: RuntimeDecisionInput): DecisionEnvelope | null {
  if (!isCivicOrDemocraticContext(input)) {
    return null;
  }

  if (input.riskClass === "LOW") {
    return {
      decision: "AUDIT",
      flags: auditFlags(true, true, true),
      reasons: [
        "U.S.E., CIVIC or DEMOCRATIC_INFRASTRUCTURE context detected.",
        "Low-risk civic documentation may proceed with audit-ready handling.",
        "Identity-choice separation must be preserved."
      ]
    };
  }

  if (input.riskClass === "MEDIUM") {
    return {
      decision: "AUDIT",
      flags: auditFlags(true, true, true),
      reasons: [
        "Civic or democratic infrastructure context detected with MEDIUM risk.",
        "Operation may proceed only with audit requirement and democratic safeguards."
      ]
    };
  }

  if (input.riskClass === "HIGH") {
    if (input.oversightState === "COMPLETED") {
      return {
        decision: "AUDIT",
        flags: auditFlags(true, true, true),
        reasons: [
          "Civic or democratic infrastructure context detected with HIGH risk.",
          "Human review is completed.",
          "Operation may proceed only as auditable controlled support."
        ]
      };
    }

    return {
      decision: "ESCALATE",
      flags: escalationFlags(true, true),
      reasons: [
        "Civic or democratic infrastructure context detected with HIGH risk.",
        "Human review is required before operational reliance."
      ]
    };
  }

  return null;
}

function decideByCriticalRisk(
  input: RuntimeDecisionInput
): DecisionEnvelope | null {
  if (input.riskClass !== "CRITICAL") {
    return null;
  }

  if (input.oversightState === "COMPLETED") {
    return {
      decision: "AUDIT",
      flags: auditFlags(true, true, true),
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

function decideByHighRisk(input: RuntimeDecisionInput): DecisionEnvelope | null {
  if (input.riskClass !== "HIGH") {
    return null;
  }

  if (input.oversightState === "COMPLETED") {
    return {
      decision: "AUDIT",
      flags: auditFlags(true, true, true),
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

function decideByUnknownRisk(input: RuntimeDecisionInput): DecisionEnvelope | null {
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

function decideByMediumRisk(input: RuntimeDecisionInput): DecisionEnvelope | null {
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
    input.contextClass === "GOVERNANCE" ||
    input.contextClass === "DUAL_USE" ||
    input.projectDomain === "U.S.E."
  ) {
    return {
      decision: "AUDIT",
      flags: auditFlags(true, true, true),
      reasons: [
        "Risk class is MEDIUM with restricted, sensitive or governance-relevant context.",
        "Operation may proceed with audit requirement."
      ]
    };
  }

  return {
    decision: "AUDIT",
    flags: auditFlags(true, true, Boolean(input.opcPreferred)),
    reasons: [
      "Risk class is MEDIUM.",
      "Audit-ready handling is recommended."
    ]
  };
}

function decideByRestrictedPolicy(
  input: RuntimeDecisionInput
): DecisionEnvelope | null {
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
    flags: auditFlags(true, true, true),
    reasons: [
      "Policy status is RESTRICTED.",
      "Operation may proceed only with audit-aware handling."
    ]
  };
}

function decideByLowRisk(input: RuntimeDecisionInput): DecisionEnvelope | null {
  if (input.riskClass !== "LOW") {
    return null;
  }

  if (input.oversightState === "RECOMMENDED") {
    return {
      decision: "ALLOW",
      flags: allowFlags(
        Boolean(input.evtPreferred),
        Boolean(input.auditPreferred),
        Boolean(input.memoryPreferred),
        Boolean(input.opcPreferred)
      ),
      reasons: [
        "Risk class is LOW.",
        "Human review is recommended but not required for ordinary use."
      ]
    };
  }

  return {
    decision: "ALLOW",
    flags: allowFlags(
      Boolean(input.evtPreferred),
      Boolean(input.auditPreferred),
      Boolean(input.memoryPreferred),
      Boolean(input.opcPreferred)
    ),
    reasons: [
      "Risk class is LOW.",
      "No blocking, escalation or audit trigger detected."
    ]
  };
}

function allowFlags(
  evtRequired = false,
  auditRequired = false,
  memoryRequired = false,
  opcRequired = false
): DecisionFlags {
  return {
    allowExecution: true,
    allowModelCall: true,
    allowFileProcessing: true,
    evtRequired,
    auditRequired,
    failClosed: false,
    memoryRequired,
    opcRequired
  };
}

function auditFlags(
  allowModelCall: boolean,
  evtRequired = true,
  opcRequired = false
): DecisionFlags {
  return {
    allowExecution: true,
    allowModelCall,
    allowFileProcessing: true,
    evtRequired,
    auditRequired: true,
    failClosed: false,
    memoryRequired: true,
    opcRequired
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
    failClosed: false,
    memoryRequired: true,
    opcRequired: auditRequired
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
    failClosed: true,
    memoryRequired: false,
    opcRequired: auditRequired
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
    failClosed: true,
    memoryRequired: false,
    opcRequired: auditRequired
  };
}

function noopFlags(evtRequired = true): DecisionFlags {
  return {
    allowExecution: false,
    allowModelCall: false,
    allowFileProcessing: false,
    evtRequired,
    auditRequired: true,
    failClosed: true,
    memoryRequired: false,
    opcRequired: false
  };
}

function buildDecision(
  envelope: DecisionEnvelope,
  input: RuntimeDecisionInput
): RuntimeDecisionResult {
  return {
    decision: envelope.decision,
    allowExecution: envelope.flags.allowExecution,
    allowModelCall: envelope.flags.allowModelCall,
    allowFileProcessing: envelope.flags.allowFileProcessing,
    evtRequired: envelope.flags.evtRequired,
    auditRequired: envelope.flags.auditRequired,
    failClosed: envelope.flags.failClosed,
    reasons: uniqueReasons(envelope.reasons),
    projectDomain: input.projectDomain,
    activeDomains: input.activeDomains,
    policyOutcome: input.policyOutcome,
    humanOversight: input.oversightState,
    riskClass: input.riskClass,
    iprBinding: shouldBindIpr(input),
    memoryRequired: envelope.flags.memoryRequired,
    opcRequired: envelope.flags.opcRequired
  };
}

function shouldBindIpr(input: RuntimeDecisionInput): boolean {
  if (input.iprBindingPreferred) {
    return true;
  }

  if (input.projectDomain && input.projectDomain !== "GENERAL") {
    return true;
  }

  if (
    input.contextClass === "IDENTITY" ||
    input.contextClass === "IPR" ||
    input.contextClass === "GOVERNANCE" ||
    input.contextClass === "COMPLIANCE" ||
    input.contextClass === "USE" ||
    input.contextClass === "CIVIC" ||
    input.contextClass === "DEMOCRATIC_INFRASTRUCTURE"
  ) {
    return true;
  }

  return Boolean(
    input.evtPreferred ||
      input.memoryPreferred ||
      input.opcPreferred ||
      input.auditPreferred
  );
}

function isCivicOrDemocraticContext(input: RuntimeDecisionInput): boolean {
  return (
    input.projectDomain === "U.S.E." ||
    input.contextClass === "USE" ||
    input.contextClass === "CIVIC" ||
    input.contextClass === "DEMOCRATIC_INFRASTRUCTURE" ||
    input.dataClass === "CIVIC_SENSITIVE" ||
    input.dataClass === "DEMOCRATIC_CHOICE"
  );
}

function uniqueReasons(reasons: string[]): string[] {
  return Array.from(new Set(reasons.filter(Boolean)));
}
