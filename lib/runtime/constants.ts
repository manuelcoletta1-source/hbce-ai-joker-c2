export const RUNTIME_VERSION = "1.0.0";

export const RUNTIME_STATUS = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
} as const;

export const EXECUTION_MODE = {
  FAIL_CLOSED: "FAIL_CLOSED",
} as const;

export const GOVERNANCE = {
  IDENTITY: "IPR",
  FRAMEWORK: "SRSC",
  GOVERNANCE: "HBCE",
  TRACEABILITY: "OPC",
} as const;

export const API_ENDPOINTS = {
  HEALTH: "/health",
  INFO: "/info",
  VERSION: "/version",
  CAPABILITIES: "/capabilities",
  SELF_TEST: "/self-test",
  MANIFEST: "/manifest",
  EXECUTE: "/execute",
} as const;

export const DESIGN_PRINCIPLES = [
  "deterministic",
  "audit-first",
  "traceable",
  "reproducible",
  "explainable",
  "llm-agnostic",
  "fail-closed",
] as const;
