import { createHash } from "node:crypto";

import type {
  HbceApiAuthResult
} from "./api-auth";

import type {
  IprOnboardingProjectionEvidence
} from "./ipr-onboarding-server-projection";

export const IPR_ONBOARDING_TRUSTED_INGRESS_VERSION =
  "HBCE-IPR-ONBOARDING-TRUSTED-INGRESS-v1.0" as const;

export const IPR_ONBOARDING_TRUSTED_INGRESS_ENDPOINT =
  "/api/internal/ipr/onboarding-projection" as const;

export const IPR_ONBOARDING_TRUSTED_INGRESS_SCOPE =
  "internal:ipr-onboarding:project" as const;

export const IPR_ONBOARDING_TRUSTED_INGRESS_METHOD =
  "POST" as const;

export const IPR_ONBOARDING_TRUSTED_INGRESS_MAX_AGE_MS =
  5 * 60 * 1000;

export const IPR_ONBOARDING_TRUSTED_INGRESS_MAX_FUTURE_SKEW_MS =
  60 * 1000;

const MIN_NONCE_LENGTH = 16;
const MAX_NONCE_LENGTH = 128;

const ALLOWED_ENVELOPE_FIELDS = new Set([
  "version",
  "issuedAt",
  "nonce",
  "evidence"
]);

const ALLOWED_EVIDENCE_FIELDS = new Set([
  "iprId",
  "subjectId",
  "iprStatus",
  "iprCardStatus",
  "certificateStatus",
  "revocationState",
  "jokerC2AccessStatus",
  "latestPhaseNumber",
  "latestPhaseCertificateHash",
  "certificateId",
  "certificateHash",
  "certificateScope",
  "cardSerial"
]);

const FORBIDDEN_AUTHORITY_KEYS = new Set([
  "tenantid",
  "workspaceid",
  "accountid",
  "allowjokerc2access",
  "verifiedbiologicalsubject",
  "matrixactive",
  "iprboundmemory",
  "accessdecision",
  "accessscope",
  "identitybinding",
  "matrixstate",
  "semanticmemoryscope",
  "runtimeauthorized",
  "sessionauthenticated",
  "verifiedsubject"
]);

const FORBIDDEN_SENSITIVE_KEYS = new Set([
  "rawdocument",
  "documentraw",
  "documentimage",
  "taxid",
  "taxidentifier",
  "fiscalidentifier",
  "codicefiscale",
  "photo",
  "photograph",
  "video",
  "biometric",
  "biometrics",
  "liveness",
  "facetemplate",
  "fingerprint",
  "dateofbirth",
  "birthdate"
]);

export type IprOnboardingTrustedIngressFailureReason =
  | "API_AUTH_REQUIRED"
  | "AUTH_ENDPOINT_MISMATCH"
  | "AUTH_METHOD_MISMATCH"
  | "AUTH_REQUIRED_SCOPE_MISSING"
  | "CREDENTIAL_DEDICATED_SCOPE_MISSING"
  | "TENANT_SCOPE_REQUIRED"
  | "WORKSPACE_SCOPE_REQUIRED"
  | "INGRESS_VERSION_INVALID"
  | "INGRESS_TIMESTAMP_INVALID"
  | "INGRESS_TIMESTAMP_STALE"
  | "INGRESS_TIMESTAMP_IN_FUTURE"
  | "INGRESS_NONCE_INVALID"
  | "INGRESS_ENVELOPE_REQUIRED"
  | "INGRESS_EVIDENCE_REQUIRED"
  | "UNEXPECTED_ENVELOPE_FIELD"
  | "UNEXPECTED_EVIDENCE_FIELD"
  | "CLIENT_AUTHORITY_FIELD_FORBIDDEN"
  | "SENSITIVE_FIELD_FORBIDDEN";

export type IprOnboardingTrustedIngressDenied = {
  ok: false;
  status: "TRUSTED_INGRESS_DENIED";
  reason: IprOnboardingTrustedIngressFailureReason;

  runtimeAuthorized: false;
  sessionAuthenticated: false;
  profilePersistenceAuthorized: false;

  authority: "TRANSPORT_EVIDENCE_ONLY";

  legalCertification: false;
};

export type IprOnboardingTrustedIngressValidated = {
  ok: true;
  status: "TRUSTED_INGRESS_VALIDATED";

  runtimeAuthorized: false;
  sessionAuthenticated: false;
  profilePersistenceAuthorized: false;

  authority: "TRANSPORT_EVIDENCE_ONLY";

  service: {
    credentialId: string;
    tenantId: string;
    workspaceId: string;
  };

  issuedAt: string;

  nonceHash: string;
  payloadHash: string;
  projectionKey: string;

  replay: {
    status: "NOT_EVALUATED";
  };

  evidence:
    IprOnboardingProjectionEvidence;

  legalCertification: false;
};

export type IprOnboardingTrustedIngressResult =
  | IprOnboardingTrustedIngressDenied
  | IprOnboardingTrustedIngressValidated;

function deny(
  reason: IprOnboardingTrustedIngressFailureReason
): IprOnboardingTrustedIngressDenied {
  return {
    ok: false,
    status: "TRUSTED_INGRESS_DENIED",
    reason,
    runtimeAuthorized: false,
    sessionAuthenticated: false,
    profilePersistenceAuthorized: false,
    authority: "TRANSPORT_EVIDENCE_ONLY",
    legalCertification: false
  };
}

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function normalizeText(
  value: unknown
): string {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function normalizeKey(
  value: string
): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function stableJson(
  value: unknown
): string {
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

function sha256(
  value: unknown
): string {
  return `sha256:${createHash("sha256")
    .update(stableJson(value), "utf8")
    .digest("hex")}`;
}

function containsForbiddenKey(
  value: unknown,
  forbidden: Set<string>
): boolean {
  if (Array.isArray(value)) {
    return value.some(
      (item) =>
        containsForbiddenKey(
          item,
          forbidden
        )
    );
  }

  if (!isRecord(value)) {
    return false;
  }

  for (const [key, item] of Object.entries(value)) {
    if (
      forbidden.has(
        normalizeKey(key)
      )
    ) {
      return true;
    }

    if (
      containsForbiddenKey(
        item,
        forbidden
      )
    ) {
      return true;
    }
  }

  return false;
}

function hasUnexpectedFields(
  record: Record<string, unknown>,
  allowed: Set<string>
): boolean {
  return Object.keys(record).some(
    (key) => !allowed.has(key)
  );
}

function normalizeScope(
  value: unknown
): string[] | string {
  if (Array.isArray(value)) {
    return value
      .map(normalizeText)
      .filter(Boolean);
  }

  return normalizeText(value);
}

function sanitizeEvidence(
  value: Record<string, unknown>
): IprOnboardingProjectionEvidence {
  return {
    iprId:
      normalizeText(value.iprId),

    subjectId:
      normalizeText(value.subjectId),

    iprStatus:
      normalizeText(value.iprStatus),

    iprCardStatus:
      normalizeText(value.iprCardStatus),

    certificateStatus:
      normalizeText(
        value.certificateStatus
      ),

    revocationState:
      normalizeText(
        value.revocationState
      ),

    jokerC2AccessStatus:
      normalizeText(
        value.jokerC2AccessStatus
      ),

    latestPhaseNumber:
      typeof value.latestPhaseNumber ===
        "number" &&
      Number.isFinite(
        value.latestPhaseNumber
      )
        ? value.latestPhaseNumber
        : null,

    latestPhaseCertificateHash:
      normalizeText(
        value.latestPhaseCertificateHash
      ) || null,

    certificateId:
      normalizeText(
        value.certificateId
      ),

    certificateHash:
      normalizeText(
        value.certificateHash
      ),

    certificateScope:
      normalizeScope(
        value.certificateScope
      ),

    cardSerial:
      normalizeText(
        value.cardSerial
      )
  };
}

function nonceValid(
  nonce: string
): boolean {
  if (
    nonce.length < MIN_NONCE_LENGTH ||
    nonce.length > MAX_NONCE_LENGTH
  ) {
    return false;
  }

  return /^[A-Za-z0-9._:-]+$/.test(
    nonce
  );
}

export function validateIprOnboardingTrustedIngress(
  input: {
    auth: HbceApiAuthResult;
    envelope: unknown;
    now?: Date;
  }
): IprOnboardingTrustedIngressResult {
  const auth = input.auth;

  if (!auth.ok) {
    return deny(
      "API_AUTH_REQUIRED"
    );
  }

  if (
    auth.endpoint !==
    IPR_ONBOARDING_TRUSTED_INGRESS_ENDPOINT
  ) {
    return deny(
      "AUTH_ENDPOINT_MISMATCH"
    );
  }

  if (
    auth.method !==
    IPR_ONBOARDING_TRUSTED_INGRESS_METHOD
  ) {
    return deny(
      "AUTH_METHOD_MISMATCH"
    );
  }

  if (
    !auth.requiredScopes.includes(
      IPR_ONBOARDING_TRUSTED_INGRESS_SCOPE
    )
  ) {
    return deny(
      "AUTH_REQUIRED_SCOPE_MISSING"
    );
  }

  /*
   * Wildcard is intentionally insufficient here.
   *
   * The onboarding service credential must explicitly contain the
   * dedicated ingress scope. A broad administrative/API credential
   * must not silently become an onboarding identity projection
   * credential.
   */
  if (
    !auth.credential.scopes.includes(
      IPR_ONBOARDING_TRUSTED_INGRESS_SCOPE
    )
  ) {
    return deny(
      "CREDENTIAL_DEDICATED_SCOPE_MISSING"
    );
  }

  const tenantId =
    normalizeText(
      auth.credential.tenantId
    );

  const workspaceId =
    normalizeText(
      auth.credential.workspaceId
    );

  if (
    !tenantId ||
    tenantId === "NO_TENANT_ID"
  ) {
    return deny(
      "TENANT_SCOPE_REQUIRED"
    );
  }

  if (
    !workspaceId ||
    workspaceId === "NO_WORKSPACE_ID"
  ) {
    return deny(
      "WORKSPACE_SCOPE_REQUIRED"
    );
  }

  if (!isRecord(input.envelope)) {
    return deny(
      "INGRESS_ENVELOPE_REQUIRED"
    );
  }

  const envelope =
    input.envelope;

  /*
   * Reject authority-bearing material before any semantic projection.
   * The onboarding transport may carry evidence, not core authority.
   */
  if (
    containsForbiddenKey(
      envelope,
      FORBIDDEN_AUTHORITY_KEYS
    )
  ) {
    return deny(
      "CLIENT_AUTHORITY_FIELD_FORBIDDEN"
    );
  }

  /*
   * Raw personal or biometric material is not permitted to cross this
   * boundary. Only minimized operational references/hashes belong in
   * the projection pipeline.
   */
  if (
    containsForbiddenKey(
      envelope,
      FORBIDDEN_SENSITIVE_KEYS
    )
  ) {
    return deny(
      "SENSITIVE_FIELD_FORBIDDEN"
    );
  }

  if (
    hasUnexpectedFields(
      envelope,
      ALLOWED_ENVELOPE_FIELDS
    )
  ) {
    return deny(
      "UNEXPECTED_ENVELOPE_FIELD"
    );
  }

  if (
    envelope.version !==
    IPR_ONBOARDING_TRUSTED_INGRESS_VERSION
  ) {
    return deny(
      "INGRESS_VERSION_INVALID"
    );
  }

  const issuedAt =
    normalizeText(
      envelope.issuedAt
    );

  const issuedAtMs =
    Date.parse(issuedAt);

  if (
    !issuedAt ||
    !Number.isFinite(issuedAtMs)
  ) {
    return deny(
      "INGRESS_TIMESTAMP_INVALID"
    );
  }

  const now =
    input.now ?? new Date();

  const nowMs =
    now.getTime();

  if (
    nowMs - issuedAtMs >
    IPR_ONBOARDING_TRUSTED_INGRESS_MAX_AGE_MS
  ) {
    return deny(
      "INGRESS_TIMESTAMP_STALE"
    );
  }

  if (
    issuedAtMs - nowMs >
    IPR_ONBOARDING_TRUSTED_INGRESS_MAX_FUTURE_SKEW_MS
  ) {
    return deny(
      "INGRESS_TIMESTAMP_IN_FUTURE"
    );
  }

  const nonce =
    normalizeText(
      envelope.nonce
    );

  if (!nonceValid(nonce)) {
    return deny(
      "INGRESS_NONCE_INVALID"
    );
  }

  if (!isRecord(envelope.evidence)) {
    return deny(
      "INGRESS_EVIDENCE_REQUIRED"
    );
  }

  if (
    hasUnexpectedFields(
      envelope.evidence,
      ALLOWED_EVIDENCE_FIELDS
    )
  ) {
    return deny(
      "UNEXPECTED_EVIDENCE_FIELD"
    );
  }

  const evidence =
    sanitizeEvidence(
      envelope.evidence
    );

  const semanticPayload = {
    version:
      IPR_ONBOARDING_TRUSTED_INGRESS_VERSION,

    evidence
  };

  /*
   * projectionKey identifies one canonical onboarding evidence
   * generation for one tenant/workspace.
   *
   * Transport timestamp and nonce are intentionally excluded so a
   * legitimate retry can resolve to the same idempotency identity.
   */
  const projectionKey =
    sha256({
      tenantId,
      workspaceId,

      iprId:
        evidence.iprId,

      certificateId:
        evidence.certificateId,

      certificateHash:
        evidence.certificateHash,

      latestPhaseCertificateHash:
        evidence.latestPhaseCertificateHash,

      cardSerial:
        evidence.cardSerial
    });

  /*
   * payloadHash binds all canonical semantic evidence.
   *
   * Same projectionKey + same payloadHash:
   *   future durable store may return IDEMPOTENT_SUCCESS.
   *
   * Same projectionKey + different payloadHash:
   *   future durable store must FAIL_CLOSED_CONFLICT.
   */
  const payloadHash =
    sha256(
      semanticPayload
    );

  /*
   * The raw nonce is never persisted by this contract.
   * Replay persistence receives only nonceHash.
   */
  const nonceHash =
    sha256({
      credentialId:
        auth.credential.credentialId,
      nonce
    });

  return {
    ok: true,
    status:
      "TRUSTED_INGRESS_VALIDATED",

    runtimeAuthorized: false,
    sessionAuthenticated: false,
    profilePersistenceAuthorized: false,

    authority:
      "TRANSPORT_EVIDENCE_ONLY",

    service: {
      credentialId:
        auth.credential.credentialId,

      tenantId,
      workspaceId
    },

    issuedAt:
      new Date(
        issuedAtMs
      ).toISOString(),

    nonceHash,
    payloadHash,
    projectionKey,

    replay: {
      status: "NOT_EVALUATED"
    },

    evidence,

    legalCertification: false
  };
}
