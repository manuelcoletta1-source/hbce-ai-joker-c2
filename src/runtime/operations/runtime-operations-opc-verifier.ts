import {
  sha256Hex,
  stableStringify,
  type RuntimeOperationsEvidenceReceipt,
  type RuntimeOperationsEvidenceInput,
} from "./runtime-operations-evidence";

import {
  type RuntimeOperationsOpcEnvelope,
} from "./runtime-operations-opc-envelope";

export type RuntimeOperationsOpcVerificationCheck = {
  id: string;
  description: string;
  passed: boolean;
  expected: unknown;
  actual: unknown;
};

export type RuntimeOperationsOpcVerificationResult = {
  verificationType:
    "HBCE_RUNTIME_OPERATIONS_OPC_EVT_VERIFICATION";

  revision:
    "HBCE-RUNTIME-OPERATIONS-OPC-VERIFIER-v1_0";

  verified: boolean;

  operationalStatus:
    | "PASS"
    | "FAIL_CLOSED";

  checks: RuntimeOperationsOpcVerificationCheck[];

  summary: {
    totalChecks: number;
    passedChecks: number;
    failedChecks: number;
  };

  integrity: {
    evidenceSha256Expected: string;
    evidenceSha256Actual: string;

    envelopeSha256Expected: string;
    envelopeSha256Actual: string;

    internalSealExpected: string;
    internalSealActual: string;
  };

  governance: {
    failClosed: boolean;
    humanAuthorizationRequired: true;
    autonomousAuthorization: false;
    runtimeActivationFromVerification: false;
    noSubmitFromCode: true;
    legalCertification: false;
  };
};

function check(
  id: string,
  description: string,
  expected: unknown,
  actual: unknown,
): RuntimeOperationsOpcVerificationCheck {
  return {
    id,
    description,
    passed: Object.is(
      expected,
      actual,
    ),
    expected,
    actual,
  };
}

function rebuildEvidenceHash(
  sourceInput: RuntimeOperationsEvidenceInput,
): string {
  const canonicalPayload = {
    status:
      sourceInput.status,

    operationalStatus:
      sourceInput.operationalStatus,

    revision:
      sourceInput.revision,

    generatedAt:
      sourceInput.generatedAt,

    product:
      sourceInput.product,

    runtime:
      sourceInput.runtime,

    execution:
      sourceInput.execution,

    summary:
      sourceInput.summary,

    checks:
      sourceInput.checks,

    governance:
      sourceInput.governance,
  };

  return sha256Hex(
    stableStringify(
      canonicalPayload,
    ),
  );
}

function rebuildEnvelopeHash(
  envelope: RuntimeOperationsOpcEnvelope,
): string {
  const canonicalEnvelopePayload = {
    identity:
      envelope.identity,

    event:
      envelope.event,

    opc:
      envelope.opc,

    governance:
      envelope.governance,
  };

  return sha256Hex(
    stableStringify(
      canonicalEnvelopePayload,
    ),
  );
}

function rebuildInternalSeal(
  envelope: RuntimeOperationsOpcEnvelope,
  envelopeSha256: string,
): string {
  const internalSealPayload = {
    scheme:
      "HERMETICUM_INTERNAL_HASH_BOUND_SEAL_v1",

    runtimeIpr:
      envelope.identity.runtimeIpr,

    humanAuthorityIpr:
      envelope.identity
        .humanAuthorityIpr,

    organization:
      envelope.identity.organization,

    evidenceSha256:
      envelope.opc.evidenceSha256,

    envelopeSha256,
  };

  return sha256Hex(
    stableStringify(
      internalSealPayload,
    ),
  );
}

export function verifyRuntimeOperationsOpcEnvelope(
  input: {
    sourceInput: RuntimeOperationsEvidenceInput;
    evidence: RuntimeOperationsEvidenceReceipt;
    envelope: RuntimeOperationsOpcEnvelope;
  },
): RuntimeOperationsOpcVerificationResult {
  const evidenceSha256Actual =
    rebuildEvidenceHash(
      input.sourceInput,
    );

  const evidenceSha256Expected =
    input.evidence.integrity.sha256;

  const envelopeSha256Actual =
    rebuildEnvelopeHash(
      input.envelope,
    );

  const envelopeSha256Expected =
    input.envelope.integrity
      .envelopeSha256;

  const internalSealActual =
    rebuildInternalSeal(
      input.envelope,
      envelopeSha256Actual,
    );

  const internalSealExpected =
    input.envelope.internalSeal.value;

  const checks: RuntimeOperationsOpcVerificationCheck[] =
    [];

  checks.push(
    check(
      "OPC-VERIFY-001",
      "Evidence SHA-256 matches canonical source payload",
      evidenceSha256Expected,
      evidenceSha256Actual,
    ),
  );

  checks.push(
    check(
      "OPC-VERIFY-002",
      "Envelope evidence SHA-256 matches evidence receipt",
      evidenceSha256Expected,
      input.envelope.opc
        .evidenceSha256,
    ),
  );

  checks.push(
    check(
      "OPC-VERIFY-003",
      "Envelope SHA-256 matches canonical envelope payload",
      envelopeSha256Expected,
      envelopeSha256Actual,
    ),
  );

  checks.push(
    check(
      "OPC-VERIFY-004",
      "Internal seal matches canonical hash-bound seal",
      internalSealExpected,
      internalSealActual,
    ),
  );

  checks.push(
    check(
      "OPC-VERIFY-005",
      "Runtime IPR binding is canonical",
      "IPR-AI-0001",
      input.envelope.identity
        .runtimeIpr,
    ),
  );

  checks.push(
    check(
      "OPC-VERIFY-006",
      "Human authority IPR binding is canonical",
      "IPR-3",
      input.envelope.identity
        .humanAuthorityIpr,
    ),
  );

  checks.push(
    check(
      "OPC-VERIFY-007",
      "Organization binding is canonical",
      "HERMETICUM B.C.E. S.r.l.",
      input.envelope.identity
        .organization,
    ),
  );

  checks.push(
    check(
      "OPC-VERIFY-008",
      "EVT family is canonical",
      "EVT",
      input.envelope.event.family,
    ),
  );

  checks.push(
    check(
      "OPC-VERIFY-009",
      "EVT event type is canonical",
      "RUNTIME_OPERATIONS_GOVERNANCE_EVIDENCE",
      input.envelope.event
        .eventType,
    ),
  );

  checks.push(
    check(
      "OPC-VERIFY-010",
      "Evidence revision matches OPC reference",
      input.evidence.revision,
      input.envelope.opc
        .evidenceRevision,
    ),
  );

  checks.push(
    check(
      "OPC-VERIFY-011",
      "Source revision matches EVT source revision",
      input.sourceInput.revision,
      input.envelope.event
        .sourceRevision,
    ),
  );

  checks.push(
    check(
      "OPC-VERIFY-012",
      "Source generatedAt matches EVT source timestamp",
      input.sourceInput.generatedAt,
      input.envelope.event
        .sourceGeneratedAt,
    ),
  );

  checks.push(
    check(
      "OPC-VERIFY-013",
      "Operational status matches EVT projection",
      input.sourceInput
        .operationalStatus,
      input.envelope.event
        .operationalStatus,
    ),
  );

  checks.push(
    check(
      "OPC-VERIFY-014",
      "Required verification passed",
      true,
      input.envelope.opc
        .verificationPassed,
    ),
  );

  checks.push(
    check(
      "OPC-VERIFY-015",
      "Human authorization remains required",
      true,
      input.envelope.governance
        .humanAuthorizationRequired,
    ),
  );

  checks.push(
    check(
      "OPC-VERIFY-016",
      "Autonomous authorization remains disabled",
      false,
      input.envelope.governance
        .autonomousAuthorization,
    ),
  );

  checks.push(
    check(
      "OPC-VERIFY-017",
      "Runtime activation remains disabled",
      false,
      input.envelope.governance
        .runtimeActivation,
    ),
  );

  checks.push(
    check(
      "OPC-VERIFY-018",
      "Legal certification remains disabled",
      false,
      input.envelope.governance
        .legalCertification,
    ),
  );

  checks.push(
    check(
      "OPC-VERIFY-019",
      "Qualified electronic signature claim remains disabled",
      false,
      input.envelope.internalSeal
        .qualifiedElectronicSignature,
    ),
  );

  checks.push(
    check(
      "OPC-VERIFY-020",
      "Internal seal scheme is canonical",
      "HERMETICUM_INTERNAL_HASH_BOUND_SEAL_v1",
      input.envelope.internalSeal
        .scheme,
    ),
  );

  const passedChecks =
    checks.filter(
      (item) => item.passed,
    ).length;

  const failedChecks =
    checks.length -
    passedChecks;

  const verified =
    failedChecks === 0;

  return {
    verificationType:
      "HBCE_RUNTIME_OPERATIONS_OPC_EVT_VERIFICATION",

    revision:
      "HBCE-RUNTIME-OPERATIONS-OPC-VERIFIER-v1_0",

    verified,

    operationalStatus:
      verified
        ? "PASS"
        : "FAIL_CLOSED",

    checks,

    summary: {
      totalChecks:
        checks.length,

      passedChecks,

      failedChecks,
    },

    integrity: {
      evidenceSha256Expected,
      evidenceSha256Actual,

      envelopeSha256Expected,
      envelopeSha256Actual,

      internalSealExpected,
      internalSealActual,
    },

    governance: {
      failClosed:
        !verified,

      humanAuthorizationRequired:
        true,

      autonomousAuthorization:
        false,

      runtimeActivationFromVerification:
        false,

      noSubmitFromCode:
        true,

      legalCertification:
        false,
    },
  };
}
