/**
 * AI JOKER-C2 EVT Generator
 *
 * Runtime event generation for the HERMETICUM B.C.E. governed runtime.
 *
 * EVT records provide:
 * - runtime attribution
 * - project-domain binding
 * - operational continuity
 * - context classification
 * - governance decision trace
 * - risk and oversight metadata
 * - deterministic trace hash
 * - verification and audit status
 *
 * Canonical project domains:
 * - MATRIX
 * - CORPUS_ESOTEROLOGIA_ERMETICA
 * - APOKALYPSIS
 * - GENERAL
 * - MULTI_DOMAIN
 *
 * EVT creates traceability.
 * EVT does not create legal authorization, certification or compliance.
 */

import type {
  AuditStatus,
  ContextClass,
  IntentClass,
  OperationStatus,
  OversightState,
  PolicyOutcome,
  ProjectBinding,
  ProjectDomain,
  RiskClass,
  RuntimeDecision,
  RuntimeEvent,
  RuntimeSensitivity,
  RuntimeState,
  VerificationStatus
} from "./runtime-types";
import { createProjectBinding } from "./runtime-types";
import {
  DEFAULT_RUNTIME_STATE,
  getRuntimeIdentityForEvt
} from "./runtime-identity";
import {
  EVT_CANONICALIZATION,
  EVT_HASH_ALGORITHM,
  hashCanonical
} from "./evt-hash";

export type RuntimeEventInput = {
  prev?: string;
  runtimeState?: RuntimeState;

  projectDomain?: ProjectDomain;
  activeDomains?: ProjectDomain[];

  contextClass: ContextClass;
  intentClass: IntentClass;
  sensitivity?: RuntimeSensitivity;

  riskClass: RiskClass;
  decision: RuntimeDecision;
  policyReference: string;
  policyOutcome?: PolicyOutcome;
  humanOversight: OversightState;

  operationType: string;
  operationStatus: OperationStatus;
  operationTarget?: string;

  failClosed: boolean;
  reasons?: string[];

  verificationStatus?: VerificationStatus;
  auditStatus?: AuditStatus;
  timestamp?: string;
};

export type RuntimeEventPublicView = {
  evt: string;
  prev: string;
  entity: string;
  ipr: string;
  timestamp: string;
  runtime: {
    name: string;
    core: string;
    state: RuntimeState;
  };
  project: ProjectBinding;
  context: {
    class: ContextClass;
    intent: IntentClass;
    sensitivity: RuntimeSensitivity;
  };
  governance: {
    risk: RiskClass;
    decision: RuntimeDecision;
    policy: string;
    human_oversight: OversightState;
    fail_closed: boolean;
    policy_outcome?: PolicyOutcome;
  };
  operation: {
    type: string;
    status: OperationStatus;
    target?: string;
  };
  trace: {
    hash_algorithm: "sha256";
    canonicalization: "deterministic-json";
    hash: string;
  };
  verification: {
    status: VerificationStatus;
    audit_status: AuditStatus;
  };
};

export type RuntimeEventSummary = {
  evt: string;
  prev: string;
  timestamp: string;
  projectDomain: ProjectDomain;
  activeDomains: ProjectDomain[];
  contextClass: ContextClass;
  intentClass: IntentClass;
  riskClass: RiskClass;
  decision: RuntimeDecision;
  operationType: string;
  operationStatus: OperationStatus;
  verificationStatus: VerificationStatus;
  auditStatus: AuditStatus;
};

export type RuntimeEventTracePayload = Omit<RuntimeEvent, "trace"> & {
  trace: {
    hash_algorithm: "sha256";
    canonicalization: "deterministic-json";
  };
};

const DEFAULT_PREV = "GENESIS";

export function createRuntimeEvent(input: RuntimeEventInput): RuntimeEvent {
  const timestamp = input.timestamp ?? new Date().toISOString();
  const runtimeState = input.runtimeState ?? DEFAULT_RUNTIME_STATE;
  const identity = getRuntimeIdentityForEvt(runtimeState);
  const evt = buildEventId(timestamp);
  const prev = input.prev?.trim() || DEFAULT_PREV;

  const projectDomain =
    input.projectDomain ?? inferProjectDomainFromContext(input.contextClass);

  const project = createProjectBinding(projectDomain, input.activeDomains);

  const eventWithoutHash: RuntimeEvent = {
    evt,
    prev,
    entity: identity.entity,
    ipr: identity.ipr,
    timestamp,
    runtime: identity.runtime,
    project,
    context: {
      class: input.contextClass,
      intent: input.intentClass,
      sensitivity: input.sensitivity ?? "UNKNOWN"
    },
    governance: {
      risk: input.riskClass,
      decision: input.decision,
      policy: input.policyReference,
      policy_outcome: input.policyOutcome,
      human_oversight: input.humanOversight,
      fail_closed: input.failClosed,
      reasons: uniqueReasons(input.reasons ?? [])
    },
    operation: {
      type: sanitizeOperationType(input.operationType),
      status: input.operationStatus,
      target: sanitizeOptionalTarget(input.operationTarget)
    },
    trace: {
      hash_algorithm: EVT_HASH_ALGORITHM,
      canonicalization: EVT_CANONICALIZATION,
      hash: ""
    },
    verification: {
      status: input.verificationStatus ?? "VERIFIABLE",
      audit_status: input.auditStatus ?? inferAuditStatus(input.decision)
    }
  };

  const tracePayload = buildTracePayload(eventWithoutHash);
  const trace = hashCanonical(tracePayload);

  return {
    ...eventWithoutHash,
    trace: {
      hash_algorithm: trace.algorithm,
      canonicalization: trace.canonicalization,
      hash: trace.hash
    }
  };
}

export function createBlockedRuntimeEvent(
  input: Omit<
    RuntimeEventInput,
    "decision" | "operationStatus" | "failClosed" | "verificationStatus"
  >
): RuntimeEvent {
  return createRuntimeEvent({
    ...input,
    decision: "BLOCK",
    operationStatus: "BLOCKED",
    failClosed: true,
    verificationStatus: "VERIFIABLE",
    auditStatus: input.auditStatus ?? "REQUIRED"
  });
}

export function createAuditRuntimeEvent(
  input: Omit<
    RuntimeEventInput,
    "decision" | "failClosed" | "verificationStatus"
  >
): RuntimeEvent {
  return createRuntimeEvent({
    ...input,
    decision: "AUDIT",
    failClosed: false,
    verificationStatus: "VERIFIABLE",
    auditStatus: input.auditStatus ?? "READY"
  });
}

export function createNoopRuntimeEvent(
  input: Omit<
    RuntimeEventInput,
    "decision" | "operationStatus" | "failClosed"
  >
): RuntimeEvent {
  return createRuntimeEvent({
    ...input,
    decision: "NOOP",
    operationStatus: "NOOP",
    failClosed: true,
    auditStatus: input.auditStatus ?? "REQUIRED"
  });
}

export function toPublicRuntimeEvent(
  event: RuntimeEvent
): RuntimeEventPublicView {
  const project =
    event.project ??
    createProjectBinding(inferProjectDomainFromContext(event.context.class));

  return {
    evt: event.evt,
    prev: event.prev,
    entity: event.entity,
    ipr: event.ipr,
    timestamp: event.timestamp,
    runtime: {
      name: event.runtime.name,
      core: event.runtime.core,
      state: event.runtime.state
    },
    project,
    context: {
      class: event.context.class,
      intent: event.context.intent,
      sensitivity: event.context.sensitivity
    },
    governance: {
      risk: event.governance.risk,
      decision: event.governance.decision,
      policy: event.governance.policy,
      policy_outcome: event.governance.policy_outcome,
      human_oversight: event.governance.human_oversight,
      fail_closed: event.governance.fail_closed
    },
    operation: {
      type: event.operation.type,
      status: event.operation.status,
      target: event.operation.target
    },
    trace: {
      hash_algorithm: event.trace.hash_algorithm,
      canonicalization: event.trace.canonicalization,
      hash: event.trace.hash
    },
    verification: {
      status: event.verification.status,
      audit_status: event.verification.audit_status
    }
  };
}

export function summarizeRuntimeEvent(
  event: RuntimeEvent
): RuntimeEventSummary {
  const project =
    event.project ??
    createProjectBinding(inferProjectDomainFromContext(event.context.class));

  return {
    evt: event.evt,
    prev: event.prev,
    timestamp: event.timestamp,
    projectDomain: project.domain,
    activeDomains: project.active_domains ?? [project.domain],
    contextClass: event.context.class,
    intentClass: event.context.intent,
    riskClass: event.governance.risk,
    decision: event.governance.decision,
    operationType: event.operation.type,
    operationStatus: event.operation.status,
    verificationStatus: event.verification.status,
    auditStatus: event.verification.audit_status
  };
}

export function buildTracePayload(
  event: RuntimeEvent
): RuntimeEventTracePayload {
  const project =
    event.project ??
    createProjectBinding(inferProjectDomainFromContext(event.context.class));

  return {
    evt: event.evt,
    prev: event.prev,
    entity: event.entity,
    ipr: event.ipr,
    timestamp: event.timestamp,
    runtime: event.runtime,
    project,
    context: event.context,
    governance: event.governance,
    operation: event.operation,
    trace: {
      hash_algorithm: event.trace.hash_algorithm,
      canonicalization: event.trace.canonicalization
    },
    verification: event.verification
  };
}

export function rebuildRuntimeEventHash(event: RuntimeEvent): string {
  const tracePayload = buildTracePayload(event);
  return hashCanonical(tracePayload).hash;
}

export function isRuntimeEventHashValid(event: RuntimeEvent): boolean {
  return rebuildRuntimeEventHash(event) === event.trace.hash;
}

export function isRuntimeEventStructurallyValid(event: RuntimeEvent): boolean {
  return Boolean(
    event.evt &&
      event.prev &&
      event.entity &&
      event.ipr &&
      event.timestamp &&
      event.runtime?.name &&
      event.runtime?.core &&
      event.runtime?.state &&
      event.project?.ecosystem &&
      event.project?.domain &&
      event.project?.domain_type &&
      event.context?.class &&
      event.context?.intent &&
      event.context?.sensitivity &&
      event.governance?.risk &&
      event.governance?.decision &&
      event.governance?.policy &&
      event.governance?.human_oversight &&
      typeof event.governance?.fail_closed === "boolean" &&
      event.operation?.type &&
      event.operation?.status &&
      event.trace?.hash_algorithm === "sha256" &&
      event.trace?.canonicalization === "deterministic-json" &&
      event.trace?.hash &&
      event.verification?.status &&
      event.verification?.audit_status
  );
}

export function getRuntimeEventMissingFields(
  event: Partial<RuntimeEvent>
): string[] {
  const missing: string[] = [];

  if (!event.evt) missing.push("evt");
  if (!event.prev) missing.push("prev");
  if (!event.entity) missing.push("entity");
  if (!event.ipr) missing.push("ipr");
  if (!event.timestamp) missing.push("timestamp");

  if (!event.runtime?.name) missing.push("runtime.name");
  if (!event.runtime?.core) missing.push("runtime.core");
  if (!event.runtime?.state) missing.push("runtime.state");

  if (!event.project?.ecosystem) missing.push("project.ecosystem");
  if (!event.project?.domain) missing.push("project.domain");
  if (!event.project?.domain_type) missing.push("project.domain_type");

  if (!event.context?.class) missing.push("context.class");
  if (!event.context?.intent) missing.push("context.intent");
  if (!event.context?.sensitivity) missing.push("context.sensitivity");

  if (!event.governance?.risk) missing.push("governance.risk");
  if (!event.governance?.decision) missing.push("governance.decision");
  if (!event.governance?.policy) missing.push("governance.policy");

  if (!event.governance?.human_oversight) {
    missing.push("governance.human_oversight");
  }

  if (typeof event.governance?.fail_closed !== "boolean") {
    missing.push("governance.fail_closed");
  }

  if (!event.operation?.type) missing.push("operation.type");
  if (!event.operation?.status) missing.push("operation.status");

  if (!event.trace?.hash_algorithm) missing.push("trace.hash_algorithm");
  if (!event.trace?.canonicalization) missing.push("trace.canonicalization");
  if (!event.trace?.hash) missing.push("trace.hash");

  if (!event.verification?.status) missing.push("verification.status");

  if (!event.verification?.audit_status) {
    missing.push("verification.audit_status");
  }

  return missing;
}

export function inferAuditStatus(decision: RuntimeDecision): AuditStatus {
  switch (decision) {
    case "ALLOW":
      return "NOT_REQUIRED";
    case "AUDIT":
      return "READY";
    case "ESCALATE":
      return "REQUIRED";
    case "DEGRADE":
      return "READY";
    case "BLOCK":
      return "REQUIRED";
    case "NOOP":
      return "REQUIRED";
    default:
      return "REQUIRED";
  }
}

export function inferProjectDomainFromContext(
  contextClass: ContextClass
): ProjectDomain {
  switch (contextClass) {
    case "MATRIX":
    case "AI_GOVERNANCE":
    case "CRITICAL_INFRASTRUCTURE":
      return "MATRIX";

    case "CORPUS":
      return "CORPUS_ESOTEROLOGIA_ERMETICA";

    case "APOKALYPSIS":
      return "APOKALYPSIS";

    case "GITHUB":
    case "GOVERNANCE":
    case "COMPLIANCE":
    case "DUAL_USE":
      return "MULTI_DOMAIN";

    case "IDENTITY":
    case "DOCUMENTAL":
    case "TECHNICAL":
    case "EDITORIAL":
    case "STRATEGIC":
    case "SECURITY":
    case "GENERAL":
    default:
      return "GENERAL";
  }
}

export function buildEventId(timestamp = new Date().toISOString()): string {
  const compactTimestamp = timestamp
    .replace(/\D/g, "")
    .slice(0, 14)
    .padEnd(14, "0");

  const entropy =
    typeof globalThis.crypto !== "undefined" &&
    "randomUUID" in globalThis.crypto
      ? globalThis.crypto.randomUUID().replace(/-/g, "").slice(0, 8)
      : Math.random().toString(16).slice(2, 10).padEnd(8, "0");

  return `EVT-${compactTimestamp}-${entropy}`.toUpperCase();
}

export function isRuntimeEvent(value: unknown): value is RuntimeEvent {
  if (!value || typeof value !== "object") {
    return false;
  }

  return isRuntimeEventStructurallyValid(value as RuntimeEvent);
}

export function buildEventChainReference(event: RuntimeEvent): string {
  return `${event.evt}:${event.trace.hash}`;
}

export function buildEventLine(event: RuntimeEvent): string {
  return JSON.stringify(event);
}

export function parseEventLine(line: string): RuntimeEvent | null {
  try {
    const parsed = JSON.parse(line) as RuntimeEvent;

    if (!isRuntimeEvent(parsed)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function sanitizeOperationType(value: string): string {
  const normalized = value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_:-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");

  return normalized || "UNKNOWN_OPERATION";
}

function sanitizeOptionalTarget(value?: string): string | undefined {
  const trimmed = value?.trim();

  if (!trimmed) {
    return undefined;
  }

  return trimmed.slice(0, 500);
}

function uniqueReasons(reasons: string[]): string[] {
  return Array.from(new Set(reasons.filter(Boolean)));
}
