export const RUNTIME_CONFIG = {
  version: "1.0.0",

  status: "ACTIVE",

  executionMode: "FAIL_CLOSED",

  governance: {
    identity: "IPR",
    framework: "SRSC",
    governance: "HBCE",
    traceability: "OPC",
  },

  api: {
    basePath: "/api/v1/runtime",
  },

  principles: [
    "deterministic",
    "audit-first",
    "traceable",
    "reproducible",
    "explainable",
    "llm-agnostic",
    "fail-closed",
  ],
} as const;

export type RuntimeConfig = typeof RUNTIME_CONFIG;
