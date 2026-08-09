import { createHash } from "node:crypto";

import {
  hashIprSessionToken,
  normalizeHumanIpr
} from "@/lib/ipr-auth";

import {
  isHbceDatabaseConfigured,
  queryHbceDatabase
} from "@/lib/ipr-database";

import type {
  RuntimeOperationsPersistentAppendAuthorization
} from "@/src/runtime/operations/runtime-operations-persistent-append.service";

export const RUNTIME_PERSISTENT_HUMAN_AUTHORIZATION_SERVICE_REVISION =
  "HBCE-RUNTIME-PERSISTENT-HUMAN-AUTHORIZATION-SERVICE-v1_0" as const;

export const RUNTIME_CANONICAL_HUMAN_SUBJECT_IPR_ENV =
  "HBCE_RUNTIME_CANONICAL_HUMAN_SUBJECT_IPR" as const;

const CANONICAL_RUNTIME_IPR =
  "IPR-AI-0001" as const;

const CANONICAL_HUMAN_AUTHORITY_IPR =
  "IPR-3" as const;

const CANONICAL_ORGANIZATION =
  "HERMETICUM B.C.E. S.r.l." as const;

const ACCEPTED_IDENTITY_BINDINGS = new Set([
  "IPR_VERIFIED_BIOLOGICAL_SUBJECT",
  "IPR_ACCOUNT_AUTHENTICATED"
]);

type StrictSessionRow = {
  session_id: string;
  human_ipr: string;
  runtime_ipr: string;
  token_hash: string;
  status: string;
  expires_at: string | Date;
  revoked_at: string | Date | null;
  legal_certification: boolean;
};

type StrictProfileRow = {
  human_ipr: string;
  account_id: string;
  entity: string;
  subject_kind: string;
  certificate_id: string;
  certificate_status: string;
  access_decision: string;
  access_scope: string;
  identity_binding: string;
  matrix_state: string;
  semantic_memory_scope: string;
  source: string;
  profile_hash: string;
  handoff_hash: string | null;
  legal_certification: boolean;
};

export type RuntimePersistentHumanAuthorizationErrorCode =
  | "HBCE_RUNTIME_AUTH_DATABASE_NOT_CONFIGURED"
  | "HBCE_RUNTIME_AUTH_SESSION_TOKEN_REQUIRED"
  | "HBCE_RUNTIME_AUTH_CANONICAL_SUBJECT_NOT_CONFIGURED"
  | "HBCE_RUNTIME_AUTH_SESSION_DATABASE_QUERY_FAILED"
  | "HBCE_RUNTIME_AUTH_SESSION_NOT_FOUND"
  | "HBCE_RUNTIME_AUTH_SESSION_NOT_ACTIVE"
  | "HBCE_RUNTIME_AUTH_SESSION_REVOKED"
  | "HBCE_RUNTIME_AUTH_SESSION_EXPIRED"
  | "HBCE_RUNTIME_AUTH_RUNTIME_IPR_MISMATCH"
  | "HBCE_RUNTIME_AUTH_HUMAN_SUBJECT_MISMATCH"
  | "HBCE_RUNTIME_AUTH_PROFILE_DATABASE_QUERY_FAILED"
  | "HBCE_RUNTIME_AUTH_PROFILE_NOT_FOUND"
  | "HBCE_RUNTIME_AUTH_PROFILE_HUMAN_IPR_MISMATCH"
  | "HBCE_RUNTIME_AUTH_PROFILE_SUBJECT_NOT_BIOLOGICAL"
  | "HBCE_RUNTIME_AUTH_PROFILE_CERTIFICATE_NOT_ACTIVE"
  | "HBCE_RUNTIME_AUTH_PROFILE_ACCESS_NOT_GRANTED"
  | "HBCE_RUNTIME_AUTH_PROFILE_IDENTITY_BINDING_INVALID"
  | "HBCE_RUNTIME_AUTH_PROFILE_MATRIX_NOT_ACTIVE"
  | "HBCE_RUNTIME_AUTH_SELF_PILOT_FORBIDDEN"
  | "HBCE_RUNTIME_AUTH_LEGAL_CERTIFICATION_UNEXPECTED";

export type RuntimePersistentHumanAuthorizationStage =
  | "CONFIGURATION"
  | "SESSION_LOOKUP"
  | "SESSION_VALIDATION"
  | "PROFILE_LOOKUP"
  | "PROFILE_VALIDATION"
  | "AUTHORIZATION_BUILD";

export class RuntimePersistentHumanAuthorizationError extends Error {
  readonly code:
    RuntimePersistentHumanAuthorizationErrorCode;

  readonly stage:
    RuntimePersistentHumanAuthorizationStage;

  readonly causeValue?: unknown;

  constructor(input: {
    code:
      RuntimePersistentHumanAuthorizationErrorCode;
    stage:
      RuntimePersistentHumanAuthorizationStage;
    message:
      string;
    causeValue?:
      unknown;
  }) {
    super(input.message);

    this.name =
      "RuntimePersistentHumanAuthorizationError";

    this.code =
      input.code;

    this.stage =
      input.stage;

    this.causeValue =
      input.causeValue;
  }
}

export type ResolveRuntimePersistentHumanAuthorizationInput = {
  /**
   * Raw browser session token.
   *
   * It exists only at the authentication boundary.
   * It MUST NOT enter Evidence, EVT, OPC or the runtime ledger.
   */
  sessionToken:
    string;
};

export type RuntimePersistentHumanAuthorizationResult = {
  revision:
    typeof RUNTIME_PERSISTENT_HUMAN_AUTHORIZATION_SERVICE_REVISION;

  authorization:
    RuntimeOperationsPersistentAppendAuthorization;

  proof: {
    persistenceMode:
      "DATABASE_PERSISTENT_STRICT";

    processFallbackUsed:
      false;

    selfPilotAccepted:
      false;

    rawSessionTokenPersisted:
      false;

    rawSessionIdPersisted:
      false;

    rawAuthenticatedHumanIprPersisted:
      false;

    authenticatedHumanIprSha256:
      string;

    sessionIdSha256:
      string;

    profileHash:
      string;

    runtimeIpr:
      typeof CANONICAL_RUNTIME_IPR;

    humanAuthorityIpr:
      typeof CANONICAL_HUMAN_AUTHORITY_IPR;

    organization:
      typeof CANONICAL_ORGANIZATION;

    subjectKind:
      "BIOLOGICAL_SUBJECT";

    certificateStatus:
      "ACTIVE";

    accessDecision:
      "ACCESS_GRANTED";

    matrixState:
      "MATRIX_ACTIVE";

    identityBinding:
      string;
  };
};

function fail(input: {
  code:
    RuntimePersistentHumanAuthorizationErrorCode;
  stage:
    RuntimePersistentHumanAuthorizationStage;
  message:
    string;
  causeValue?:
    unknown;
}): never {
  throw new RuntimePersistentHumanAuthorizationError(
    input
  );
}

function sha256(value: string): string {
  return createHash("sha256")
    .update(value, "utf8")
    .digest("hex");
}

function requireSessionToken(
  value: string
): string {
  if (
    typeof value !== "string" ||
    value.length === 0
  ) {
    fail({
      code:
        "HBCE_RUNTIME_AUTH_SESSION_TOKEN_REQUIRED",
      stage:
        "CONFIGURATION",
      message:
        "A non-empty HBCE IPR session token is required."
    });
  }

  return value;
}

function requireCanonicalHumanSubjectIpr():
  string {
  const raw =
    process.env[
      RUNTIME_CANONICAL_HUMAN_SUBJECT_IPR_ENV
    ];

  const normalized =
    normalizeHumanIpr(
      String(raw || "")
    );

  if (!normalized) {
    fail({
      code:
        "HBCE_RUNTIME_AUTH_CANONICAL_SUBJECT_NOT_CONFIGURED",
      stage:
        "CONFIGURATION",
      message:
        `${RUNTIME_CANONICAL_HUMAN_SUBJECT_IPR_ENV} must bind the authenticated operational Human IPR to canonical authority ${CANONICAL_HUMAN_AUTHORITY_IPR}.`
    });
  }

  return normalized;
}

function isExpired(
  value: string | Date
): boolean {
  const timestamp =
    value instanceof Date
      ? value.getTime()
      : new Date(value).getTime();

  if (!Number.isFinite(timestamp)) {
    return true;
  }

  return timestamp <= Date.now();
}

function isSelfPilotSource(
  value: string
): boolean {
  return value
    .trim()
    .toUpperCase()
    .includes("SELF_PILOT");
}

function buildAuthorizationRef(input: {
  sessionId: string;
  authenticatedHumanIpr: string;
  runtimeIpr: string;
  profileHash: string;
  accountId: string;
  certificateId: string;
}): string {
  const digest =
    sha256(
      [
        RUNTIME_PERSISTENT_HUMAN_AUTHORIZATION_SERVICE_REVISION,
        "DATABASE_PERSISTENT_STRICT",
        input.sessionId,
        input.authenticatedHumanIpr,
        input.runtimeIpr,
        input.profileHash,
        input.accountId,
        input.certificateId,
        CANONICAL_HUMAN_AUTHORITY_IPR,
        CANONICAL_ORGANIZATION
      ].join("\n")
    );

  return `HBCE-RUNTIME-AUTH-SHA256:${digest}`;
}

export async function resolveRuntimePersistentHumanAuthorization(
  input:
    ResolveRuntimePersistentHumanAuthorizationInput
): Promise<RuntimePersistentHumanAuthorizationResult> {
  if (!isHbceDatabaseConfigured()) {
    fail({
      code:
        "HBCE_RUNTIME_AUTH_DATABASE_NOT_CONFIGURED",
      stage:
        "CONFIGURATION",
      message:
        "Canonical runtime authorization requires configured HBCE PostgreSQL persistence."
    });
  }

  const sessionToken =
    requireSessionToken(
      input.sessionToken
    );

  const expectedHumanIpr =
    requireCanonicalHumanSubjectIpr();

  const tokenHash =
    hashIprSessionToken(
      sessionToken
    );

  /*
   * STRICT SESSION LOOKUP
   *
   * Deliberately bypasses getDefaultIprAuthStore(),
   * getSaasTargetIprAuthStore() and their process
   * fallback behavior.
   */
  const sessionResult =
    await queryHbceDatabase<StrictSessionRow>(
      `
SELECT
  session_id,
  human_ipr,
  runtime_ipr,
  token_hash,
  status,
  expires_at,
  revoked_at,
  legal_certification
FROM ipr_sessions
WHERE token_hash = $1
LIMIT 1
      `.trim(),
      [tokenHash]
    );

  if (!sessionResult.ok) {
    fail({
      code:
        "HBCE_RUNTIME_AUTH_SESSION_DATABASE_QUERY_FAILED",
      stage:
        "SESSION_LOOKUP",
      message:
        "Persistent HBCE IPR session lookup failed closed.",
      causeValue:
        sessionResult.error
    });
  }

  const session =
    sessionResult.rows[0];

  if (!session) {
    fail({
      code:
        "HBCE_RUNTIME_AUTH_SESSION_NOT_FOUND",
      stage:
        "SESSION_LOOKUP",
      message:
        "The HBCE IPR session does not exist in persistent storage."
    });
  }

  if (
    session.status === "REVOKED" ||
    session.revoked_at
  ) {
    fail({
      code:
        "HBCE_RUNTIME_AUTH_SESSION_REVOKED",
      stage:
        "SESSION_VALIDATION",
      message:
        "The persistent HBCE IPR session is revoked."
    });
  }

  if (
    session.status === "EXPIRED" ||
    isExpired(session.expires_at)
  ) {
    fail({
      code:
        "HBCE_RUNTIME_AUTH_SESSION_EXPIRED",
      stage:
        "SESSION_VALIDATION",
      message:
        "The persistent HBCE IPR session is expired."
    });
  }

  if (session.status !== "ACTIVE") {
    fail({
      code:
        "HBCE_RUNTIME_AUTH_SESSION_NOT_ACTIVE",
      stage:
        "SESSION_VALIDATION",
      message:
        "The persistent HBCE IPR session is not ACTIVE.",
      causeValue:
        session.status
    });
  }

  if (
    session.runtime_ipr !==
    CANONICAL_RUNTIME_IPR
  ) {
    fail({
      code:
        "HBCE_RUNTIME_AUTH_RUNTIME_IPR_MISMATCH",
      stage:
        "SESSION_VALIDATION",
      message:
        "Authenticated session Runtime IPR is not canonical.",
      causeValue: {
        expected:
          CANONICAL_RUNTIME_IPR,
        actual:
          session.runtime_ipr
      }
    });
  }

  const authenticatedHumanIpr =
    normalizeHumanIpr(
      session.human_ipr
    );

  if (
    authenticatedHumanIpr !==
    expectedHumanIpr
  ) {
    fail({
      code:
        "HBCE_RUNTIME_AUTH_HUMAN_SUBJECT_MISMATCH",
      stage:
        "SESSION_VALIDATION",
      message:
        "Authenticated Human IPR is not the operational subject bound to canonical authority IPR-3."
    });
  }

  if (session.legal_certification !== false) {
    fail({
      code:
        "HBCE_RUNTIME_AUTH_LEGAL_CERTIFICATION_UNEXPECTED",
      stage:
        "SESSION_VALIDATION",
      message:
        "Runtime authorization requires legalCertification=false at the HBCE internal operational boundary."
    });
  }

  /*
   * STRICT PROFILE LOOKUP
   *
   * Deliberately bypasses getProfileAsync() because
   * that method may recover from process memory or
   * synthesize the canonical R&D recovery profile.
   */
  const profileResult =
    await queryHbceDatabase<StrictProfileRow>(
      `
SELECT
  human_ipr,
  account_id,
  entity,
  subject_kind,
  certificate_id,
  certificate_status,
  access_decision,
  access_scope,
  identity_binding,
  matrix_state,
  semantic_memory_scope,
  source,
  profile_hash,
  handoff_hash,
  legal_certification
FROM ipr_account_profiles
WHERE human_ipr = $1
LIMIT 1
      `.trim(),
      [authenticatedHumanIpr]
    );

  if (!profileResult.ok) {
    fail({
      code:
        "HBCE_RUNTIME_AUTH_PROFILE_DATABASE_QUERY_FAILED",
      stage:
        "PROFILE_LOOKUP",
      message:
        "Persistent HBCE IPR account profile lookup failed closed.",
      causeValue:
        profileResult.error
    });
  }

  const profile =
    profileResult.rows[0];

  if (!profile) {
    fail({
      code:
        "HBCE_RUNTIME_AUTH_PROFILE_NOT_FOUND",
      stage:
        "PROFILE_LOOKUP",
      message:
        "No persistent HBCE IPR account profile exists for the authenticated Human IPR."
    });
  }

  if (
    normalizeHumanIpr(
      profile.human_ipr
    ) !== authenticatedHumanIpr
  ) {
    fail({
      code:
        "HBCE_RUNTIME_AUTH_PROFILE_HUMAN_IPR_MISMATCH",
      stage:
        "PROFILE_VALIDATION",
      message:
        "Persistent account profile Human IPR does not match the authenticated session."
    });
  }

  if (
    profile.subject_kind !==
    "BIOLOGICAL_SUBJECT"
  ) {
    fail({
      code:
        "HBCE_RUNTIME_AUTH_PROFILE_SUBJECT_NOT_BIOLOGICAL",
      stage:
        "PROFILE_VALIDATION",
      message:
        "Canonical human authorization requires a BIOLOGICAL_SUBJECT profile.",
      causeValue:
        profile.subject_kind
    });
  }

  if (
    profile.certificate_status !==
    "ACTIVE"
  ) {
    fail({
      code:
        "HBCE_RUNTIME_AUTH_PROFILE_CERTIFICATE_NOT_ACTIVE",
      stage:
        "PROFILE_VALIDATION",
      message:
        "Canonical human authorization requires an ACTIVE HBCE certificate.",
      causeValue:
        profile.certificate_status
    });
  }

  if (
    profile.access_decision !==
    "ACCESS_GRANTED"
  ) {
    fail({
      code:
        "HBCE_RUNTIME_AUTH_PROFILE_ACCESS_NOT_GRANTED",
      stage:
        "PROFILE_VALIDATION",
      message:
        "Canonical runtime persistence requires ACCESS_GRANTED.",
      causeValue:
        profile.access_decision
    });
  }

  if (
    !ACCEPTED_IDENTITY_BINDINGS.has(
      profile.identity_binding
    )
  ) {
    fail({
      code:
        "HBCE_RUNTIME_AUTH_PROFILE_IDENTITY_BINDING_INVALID",
      stage:
        "PROFILE_VALIDATION",
      message:
        "Persistent profile identity binding is not accepted for canonical runtime authorization.",
      causeValue:
        profile.identity_binding
    });
  }

  if (
    profile.matrix_state !==
    "MATRIX_ACTIVE"
  ) {
    fail({
      code:
        "HBCE_RUNTIME_AUTH_PROFILE_MATRIX_NOT_ACTIVE",
      stage:
        "PROFILE_VALIDATION",
      message:
        "Canonical runtime persistence requires MATRIX_ACTIVE.",
      causeValue:
        profile.matrix_state
    });
  }

  if (
    isSelfPilotSource(
      profile.source
    )
  ) {
    fail({
      code:
        "HBCE_RUNTIME_AUTH_SELF_PILOT_FORBIDDEN",
      stage:
        "PROFILE_VALIDATION",
      message:
        "SELF_PILOT identity/profile sources cannot authorize canonical persistent runtime execution."
    });
  }

  if (profile.legal_certification !== false) {
    fail({
      code:
        "HBCE_RUNTIME_AUTH_LEGAL_CERTIFICATION_UNEXPECTED",
      stage:
        "PROFILE_VALIDATION",
      message:
        "Runtime authorization requires legalCertification=false at the HBCE internal operational boundary."
    });
  }

  const authorizationRef =
    buildAuthorizationRef({
      sessionId:
        session.session_id,
      authenticatedHumanIpr,
      runtimeIpr:
        session.runtime_ipr,
      profileHash:
        profile.profile_hash,
      accountId:
        profile.account_id,
      certificateId:
        profile.certificate_id
    });

  const authorization:
    RuntimeOperationsPersistentAppendAuthorization =
    {
      humanAuthorized:
        true,

      authorizationRef,

      runtimeIpr:
        CANONICAL_RUNTIME_IPR,

      humanAuthorityIpr:
        CANONICAL_HUMAN_AUTHORITY_IPR,

      organization:
        CANONICAL_ORGANIZATION
    };

  return {
    revision:
      RUNTIME_PERSISTENT_HUMAN_AUTHORIZATION_SERVICE_REVISION,

    authorization,

    proof: {
      persistenceMode:
        "DATABASE_PERSISTENT_STRICT",

      processFallbackUsed:
        false,

      selfPilotAccepted:
        false,

      rawSessionTokenPersisted:
        false,

      rawSessionIdPersisted:
        false,

      rawAuthenticatedHumanIprPersisted:
        false,

      authenticatedHumanIprSha256:
        sha256(
          authenticatedHumanIpr
        ),

      sessionIdSha256:
        sha256(
          session.session_id
        ),

      profileHash:
        profile.profile_hash,

      runtimeIpr:
        CANONICAL_RUNTIME_IPR,

      humanAuthorityIpr:
        CANONICAL_HUMAN_AUTHORITY_IPR,

      organization:
        CANONICAL_ORGANIZATION,

      subjectKind:
        "BIOLOGICAL_SUBJECT",

      certificateStatus:
        "ACTIVE",

      accessDecision:
        "ACCESS_GRANTED",

      matrixState:
        "MATRIX_ACTIVE",

      identityBinding:
        profile.identity_binding
    }
  };
}
