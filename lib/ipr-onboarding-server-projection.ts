import { createHash } from "node:crypto";

import type {
  IprAccountProfileUpsertInput
} from "./ipr-account-store";

export const IPR_ONBOARDING_SERVER_PROJECTION_VERSION =
  "HBCE-IPR-ONBOARDING-SERVER-PROJECTION-v1.0";

export const IPR_ONBOARDING_SERVER_PROJECTION_SOURCE =
  "HBCE_IPR_ONBOARDING_SERVER_PROJECTION";

const CORE_JOKER_SCOPE = "JOKER_C2_ACCESS";
const ONBOARDING_JOKER_SCOPE =
  "JOKER-C2-GOVERNED-RUNTIME";

const FINAL_OPERATIONAL_PHASE = 9;

export type IprOnboardingProjectionEvidence = {
  iprId: string;
  subjectId: string;

  iprStatus: string;
  iprCardStatus: string;
  certificateStatus: string;
  revocationState: string;
  jokerC2AccessStatus: string;

  latestPhaseNumber: number | null;
  latestPhaseCertificateHash: string | null;

  certificateId: string;
  certificateHash: string;
  certificateScope: string[] | string;

  cardSerial: string;
};

export type IprOnboardingProjectionServerContext = {
  tenantId: string;
  workspaceId: string;
  accountId: string;
  entity: string;

  allowJokerC2Access: boolean;
  verifiedBiologicalSubject: boolean;
  matrixActive: boolean;
  iprBoundMemory: boolean;
};

export type IprOnboardingProjectionFailureReason =
  | "MISSING_IPR_ID"
  | "MISSING_SUBJECT_ID"
  | "IPR_NOT_VERIFIED"
  | "IPR_CARD_NOT_ISSUED"
  | "CERTIFICATE_NOT_ACTIVE"
  | "REVOCATION_NOT_CLEAR"
  | "JOKER_ACCESS_NOT_ENABLED"
  | "FINAL_OPERATIONAL_PHASE_REQUIRED"
  | "PHASE_CERTIFICATE_HASH_REQUIRED"
  | "CERTIFICATE_ID_REQUIRED"
  | "CERTIFICATE_HASH_REQUIRED"
  | "CERTIFICATE_SCOPE_NOT_COMPATIBLE"
  | "CARD_SERIAL_REQUIRED"
  | "TENANT_REQUIRED"
  | "WORKSPACE_REQUIRED"
  | "ACCOUNT_REQUIRED"
  | "ENTITY_REQUIRED"
  | "SERVER_POLICY_ACCESS_REQUIRED"
  | "SERVER_POLICY_IDENTITY_REQUIRED"
  | "SERVER_POLICY_MATRIX_REQUIRED"
  | "SERVER_POLICY_MEMORY_REQUIRED";

export type IprOnboardingProjectionDenied = {
  ok: false;
  status: "PROJECTION_DENIED";
  reason: IprOnboardingProjectionFailureReason;
  runtimeAuthorized: false;
  authority: "PROFILE_CANDIDATE_ONLY";
  legalCertification: false;
};

export type IprOnboardingProjectionEligible = {
  ok: true;
  status: "PROFILE_CANDIDATE_ELIGIBLE";
  reason: "ALL_PROJECTION_PRECONDITIONS_SATISFIED";
  runtimeAuthorized: false;
  authority: "PROFILE_CANDIDATE_ONLY";
  evidenceHash: string;
  handoffHash: string;
  profileInput: IprAccountProfileUpsertInput;
  legalCertification: false;
};

export type IprOnboardingProjectionResult =
  | IprOnboardingProjectionDenied
  | IprOnboardingProjectionEligible;

function normalizeText(value: unknown): string {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function normalizeState(value: unknown): string {
  return normalizeText(value).toLowerCase();
}

function stableJson(value: unknown): string {
  if (
    value === null ||
    typeof value !== "object"
  ) {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value
      .map(stableJson)
      .join(",")}]`;
  }

  const record =
    value as Record<string, unknown>;

  return `{${Object.keys(record)
    .sort()
    .map(
      (key) =>
        `${JSON.stringify(key)}:${stableJson(
          record[key]
        )}`
    )
    .join(",")}}`;
}

function sha256(value: unknown): string {
  return `sha256:${createHash("sha256")
    .update(stableJson(value), "utf8")
    .digest("hex")}`;
}

function normalizeScopeInput(
  value: string[] | string
): string[] {
  const source = Array.isArray(value)
    ? value
    : [value];

  return source
    .map(normalizeText)
    .filter(Boolean);
}

function hasCompatibleJokerScope(
  value: string[] | string
): boolean {
  return normalizeScopeInput(value).some(
    (scope) =>
      scope === CORE_JOKER_SCOPE ||
      scope === ONBOARDING_JOKER_SCOPE
  );
}

function deny(
  reason: IprOnboardingProjectionFailureReason
): IprOnboardingProjectionDenied {
  return {
    ok: false,
    status: "PROJECTION_DENIED",
    reason,
    runtimeAuthorized: false,
    authority: "PROFILE_CANDIDATE_ONLY",
    legalCertification: false
  };
}

export function projectVerifiedOnboardingToIprAccountProfile(
  input: {
    evidence: IprOnboardingProjectionEvidence;
    server: IprOnboardingProjectionServerContext;
  }
): IprOnboardingProjectionResult {
  const evidence = input.evidence;
  const server = input.server;

  const humanIpr =
    normalizeText(evidence.iprId);

  const subjectId =
    normalizeText(evidence.subjectId);

  const phaseHash =
    normalizeText(
      evidence.latestPhaseCertificateHash
    );

  const certificateId =
    normalizeText(evidence.certificateId);

  const certificateHash =
    normalizeText(evidence.certificateHash);

  const cardSerial =
    normalizeText(evidence.cardSerial);

  const tenantId =
    normalizeText(server.tenantId);

  const workspaceId =
    normalizeText(server.workspaceId);

  const accountId =
    normalizeText(server.accountId);

  const entity =
    normalizeText(server.entity);

  if (!humanIpr) {
    return deny("MISSING_IPR_ID");
  }

  if (!subjectId) {
    return deny("MISSING_SUBJECT_ID");
  }

  if (
    normalizeState(evidence.iprStatus) !==
    "verified"
  ) {
    return deny("IPR_NOT_VERIFIED");
  }

  if (
    normalizeState(evidence.iprCardStatus) !==
    "issued"
  ) {
    return deny("IPR_CARD_NOT_ISSUED");
  }

  if (
    normalizeState(
      evidence.certificateStatus
    ) !== "active"
  ) {
    return deny("CERTIFICATE_NOT_ACTIVE");
  }

  if (
    normalizeState(evidence.revocationState) !==
    "clear"
  ) {
    return deny("REVOCATION_NOT_CLEAR");
  }

  if (
    normalizeState(
      evidence.jokerC2AccessStatus
    ) !== "enabled"
  ) {
    return deny("JOKER_ACCESS_NOT_ENABLED");
  }

  if (
    evidence.latestPhaseNumber !==
    FINAL_OPERATIONAL_PHASE
  ) {
    return deny(
      "FINAL_OPERATIONAL_PHASE_REQUIRED"
    );
  }

  if (!phaseHash) {
    return deny(
      "PHASE_CERTIFICATE_HASH_REQUIRED"
    );
  }

  if (!certificateId) {
    return deny("CERTIFICATE_ID_REQUIRED");
  }

  if (!certificateHash) {
    return deny("CERTIFICATE_HASH_REQUIRED");
  }

  if (
    !hasCompatibleJokerScope(
      evidence.certificateScope
    )
  ) {
    return deny(
      "CERTIFICATE_SCOPE_NOT_COMPATIBLE"
    );
  }

  if (!cardSerial) {
    return deny("CARD_SERIAL_REQUIRED");
  }

  if (!tenantId) {
    return deny("TENANT_REQUIRED");
  }

  if (!workspaceId) {
    return deny("WORKSPACE_REQUIRED");
  }

  if (!accountId) {
    return deny("ACCOUNT_REQUIRED");
  }

  if (!entity) {
    return deny("ENTITY_REQUIRED");
  }

  if (!server.allowJokerC2Access) {
    return deny(
      "SERVER_POLICY_ACCESS_REQUIRED"
    );
  }

  if (!server.verifiedBiologicalSubject) {
    return deny(
      "SERVER_POLICY_IDENTITY_REQUIRED"
    );
  }

  if (!server.matrixActive) {
    return deny(
      "SERVER_POLICY_MATRIX_REQUIRED"
    );
  }

  if (!server.iprBoundMemory) {
    return deny(
      "SERVER_POLICY_MEMORY_REQUIRED"
    );
  }

  const minimizedEvidence = {
    projectionVersion:
      IPR_ONBOARDING_SERVER_PROJECTION_VERSION,
    source:
      IPR_ONBOARDING_SERVER_PROJECTION_SOURCE,
    subjectReferenceHash:
      sha256(subjectId),
    humanIpr,
    latestPhaseNumber:
      FINAL_OPERATIONAL_PHASE,
    latestPhaseCertificateHash:
      phaseHash,
    certificateId,
    certificateHash,
    certificateScope: [
      CORE_JOKER_SCOPE
    ],
    cardSerial,
    revocationState: "clear"
  };

  const evidenceHash =
    sha256(minimizedEvidence);

  const handoffHash = sha256({
    evidenceHash,
    humanIpr,
    tenantId,
    workspaceId,
    accountId,
    certificateId,
    certificateHash,
    accessScope: CORE_JOKER_SCOPE,
    identityBinding:
      "IPR_VERIFIED_BIOLOGICAL_SUBJECT",
    matrixState: "MATRIX_ACTIVE",
    semanticMemoryScope: "IPR_BOUND"
  });

  const profileInput:
    IprAccountProfileUpsertInput = {
      humanIpr,
      tenantId,
      workspaceId,
      accountId,
      entity,
      subjectKind: "BIOLOGICAL_SUBJECT",

      certificateId,
      certificateKind:
        "CERTIFICATE_09_OPERATIONAL",
      certificateStatus: "ACTIVE",
      certificateScope: [
        CORE_JOKER_SCOPE
      ],
      cardSerial,
      certificateHash,

      accessDecision: "ACCESS_GRANTED",
      accessScope: CORE_JOKER_SCOPE,
      identityBinding:
        "IPR_VERIFIED_BIOLOGICAL_SUBJECT",
      matrixState: "MATRIX_ACTIVE",
      semanticMemoryScope: "IPR_BOUND",

      source:
        IPR_ONBOARDING_SERVER_PROJECTION_SOURCE,
      handoffHash,

      profilePayload: {
        projection: {
          ...minimizedEvidence,
          evidenceHash
        },
        legalCertification: false
      }
    };

  return {
    ok: true,
    status: "PROFILE_CANDIDATE_ELIGIBLE",
    reason:
      "ALL_PROJECTION_PRECONDITIONS_SATISFIED",
    runtimeAuthorized: false,
    authority: "PROFILE_CANDIDATE_ONLY",
    evidenceHash,
    handoffHash,
    profileInput,
    legalCertification: false
  };
}
