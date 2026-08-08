import { createHash } from "node:crypto";

export type RuntimeOperationsEvidenceInput = {
  ok: boolean;
  status: string;
  operationalStatus: string;
  revision: string;
  generatedAt: string;

  product: string;
  runtime: string;

  execution: Record<string, unknown>;

  summary: {
    totalChecks: number;
    passedChecks: number;
    failedChecks: number;
    requiredChecks: number;
    requiredPassed: number;
    requiredFailed: number;
  };

  checks: Array<{
    id: string;
    description: string;
    passed: boolean;
    expected: unknown;
    actual: unknown;
  }>;

  governance: Record<string, unknown>;
};

export type RuntimeOperationsEvidenceReceipt = {
  receiptType:
    "HBCE_RUNTIME_OPERATIONS_GOVERNANCE_EVIDENCE";

  revision:
    "HBCE-RUNTIME-OPERATIONS-EVIDENCE-v1_0";

  source: {
    revision: string;
    status: string;
    operationalStatus: string;
    generatedAt: string;
  };

  verification: {
    totalChecks: number;
    passedChecks: number;
    failedChecks: number;
    allRequiredChecksPassed: boolean;
  };

  integrity: {
    algorithm: "SHA-256";
    canonicalization:
      "HBCE_STABLE_JSON_SORTED_KEYS_v1";
    sha256: string;
  };

  governance: {
    humanAuthorizationRequired: true;
    autonomousAuthorization: false;
    runtimeActivationFromEvidence: false;
    noSubmitFromCode: true;
    legalCertification: false;
  };
};

function stableNormalize(
  value: unknown,
): unknown {
  if (Array.isArray(value)) {
    return value.map(stableNormalize);
  }

  if (
    typeof value === "object" &&
    value !== null
  ) {
    const object =
      value as Record<string, unknown>;

    const normalized:
      Record<string, unknown> = {};

    for (
      const key of Object.keys(object).sort()
    ) {
      normalized[key] =
        stableNormalize(object[key]);
    }

    return normalized;
  }

  return value;
}

export function stableStringify(
  value: unknown,
): string {
  return JSON.stringify(
    stableNormalize(value),
  );
}

export function sha256Hex(
  value: string,
): string {
  return createHash("sha256")
    .update(value, "utf8")
    .digest("hex");
}

export function buildRuntimeOperationsEvidence(
  input: RuntimeOperationsEvidenceInput,
): RuntimeOperationsEvidenceReceipt {
  const canonicalPayload = {
    status: input.status,
    operationalStatus:
      input.operationalStatus,

    revision:
      input.revision,

    generatedAt:
      input.generatedAt,

    product:
      input.product,

    runtime:
      input.runtime,

    execution:
      input.execution,

    summary:
      input.summary,

    checks:
      input.checks,

    governance:
      input.governance,
  };

  const canonical =
    stableStringify(canonicalPayload);

  const hash =
    sha256Hex(canonical);

  const allRequiredChecksPassed =
    input.ok === true &&
    input.summary.failedChecks === 0 &&
    input.summary.requiredFailed === 0 &&
    input.summary.requiredPassed ===
      input.summary.requiredChecks;

  return {
    receiptType:
      "HBCE_RUNTIME_OPERATIONS_GOVERNANCE_EVIDENCE",

    revision:
      "HBCE-RUNTIME-OPERATIONS-EVIDENCE-v1_0",

    source: {
      revision:
        input.revision,

      status:
        input.status,

      operationalStatus:
        input.operationalStatus,

      generatedAt:
        input.generatedAt,
    },

    verification: {
      totalChecks:
        input.summary.totalChecks,

      passedChecks:
        input.summary.passedChecks,

      failedChecks:
        input.summary.failedChecks,

      allRequiredChecksPassed,
    },

    integrity: {
      algorithm:
        "SHA-256",

      canonicalization:
        "HBCE_STABLE_JSON_SORTED_KEYS_v1",

      sha256:
        hash,
    },

    governance: {
      humanAuthorizationRequired:
        true,

      autonomousAuthorization:
        false,

      runtimeActivationFromEvidence:
        false,

      noSubmitFromCode:
        true,

      legalCertification:
        false,
    },
  };
}
