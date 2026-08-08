import {
  stableStringify,
  sha256Hex,
  type RuntimeOperationsEvidenceReceipt,
} from "./runtime-operations-evidence";

export type RuntimeOperationsOpcEnvelopeInput = {
  evidence: RuntimeOperationsEvidenceReceipt;

  actor?: {
    ipr: string;
    role: string;
  };

  organization?: {
    name: string;
    jurisdiction: string;
  };
};

export type RuntimeOperationsOpcEnvelope = {
  envelopeType:
    "HBCE_RUNTIME_OPERATIONS_OPC_EVT_ENVELOPE";

  revision:
    "HBCE-RUNTIME-OPERATIONS-OPC-EVT-v1_0";

  identity: {
    runtimeIpr: "IPR-AI-0001";
    humanAuthorityIpr: "IPR-3";
    organization: "HERMETICUM B.C.E. S.r.l.";
  };

  event: {
    family: "EVT";
    eventType:
      "RUNTIME_OPERATIONS_GOVERNANCE_EVIDENCE";
    sourceRevision: string;
    sourceGeneratedAt: string;
    operationalStatus: string;
  };

  opc: {
    evidenceRevision: string;
    evidenceSha256: string;
    verificationPassed: boolean;
  };

  integrity: {
    algorithm: "SHA-256";
    canonicalization:
      "HBCE_STABLE_JSON_SORTED_KEYS_v1";
    envelopeSha256: string;
  };

  governance: {
    appendOnlyIntent: true;
    hashOnlyEvidence: true;
    failClosed: true;
    humanAuthorizationRequired: true;
    autonomousAuthorization: false;
    runtimeActivation: false;
    legalCertification: false;
  };

  internalSeal: {
    scheme:
      "HERMETICUM_INTERNAL_HASH_BOUND_SEAL_v1";
    value: string;
    qualifiedElectronicSignature: false;
  };
};

export function buildRuntimeOperationsOpcEnvelope(
  input: RuntimeOperationsOpcEnvelopeInput,
): RuntimeOperationsOpcEnvelope {
  const identity = {
    runtimeIpr:
      "IPR-AI-0001" as const,

    humanAuthorityIpr:
      "IPR-3" as const,

    organization:
      "HERMETICUM B.C.E. S.r.l." as const,
  };

  const event = {
    family: "EVT" as const,

    eventType:
      "RUNTIME_OPERATIONS_GOVERNANCE_EVIDENCE" as const,

    sourceRevision:
      input.evidence.source.revision,

    sourceGeneratedAt:
      input.evidence.source.generatedAt,

    operationalStatus:
      input.evidence.source.operationalStatus,
  };

  const opc = {
    evidenceRevision:
      input.evidence.revision,

    evidenceSha256:
      input.evidence.integrity.sha256,

    verificationPassed:
      input.evidence.verification
        .allRequiredChecksPassed,
  };

  const governance = {
    appendOnlyIntent:
      true as const,

    hashOnlyEvidence:
      true as const,

    failClosed:
      true as const,

    humanAuthorizationRequired:
      true as const,

    autonomousAuthorization:
      false as const,

    runtimeActivation:
      false as const,

    legalCertification:
      false as const,
  };

  const canonicalEnvelopePayload = {
    identity,
    event,
    opc,
    governance,
  };

  const canonicalEnvelope =
    stableStringify(
      canonicalEnvelopePayload,
    );

  const envelopeSha256 =
    sha256Hex(
      canonicalEnvelope,
    );

  const internalSealPayload = {
    scheme:
      "HERMETICUM_INTERNAL_HASH_BOUND_SEAL_v1",

    runtimeIpr:
      identity.runtimeIpr,

    humanAuthorityIpr:
      identity.humanAuthorityIpr,

    organization:
      identity.organization,

    evidenceSha256:
      opc.evidenceSha256,

    envelopeSha256,
  };

  const internalSeal =
    sha256Hex(
      stableStringify(
        internalSealPayload,
      ),
    );

  return {
    envelopeType:
      "HBCE_RUNTIME_OPERATIONS_OPC_EVT_ENVELOPE",

    revision:
      "HBCE-RUNTIME-OPERATIONS-OPC-EVT-v1_0",

    identity,

    event,

    opc,

    integrity: {
      algorithm:
        "SHA-256",

      canonicalization:
        "HBCE_STABLE_JSON_SORTED_KEYS_v1",

      envelopeSha256,
    },

    governance,

    internalSeal: {
      scheme:
        "HERMETICUM_INTERNAL_HASH_BOUND_SEAL_v1",

      value:
        internalSeal,

      qualifiedElectronicSignature:
        false,
    },
  };
}
