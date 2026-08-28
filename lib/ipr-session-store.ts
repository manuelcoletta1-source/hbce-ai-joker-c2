import { randomBytes } from "node:crypto";

import {
  IPR_AUTH_DATABASE_REQUIREMENT,
  hashIprSessionToken,
  isIprSessionExpired,
  normalizeHumanIpr
} from "./ipr-auth";

import {
  describeDefaultHbceDatabase,
  isHbceDatabaseConfigured,
  queryHbceDatabase
} from "./ipr-database";

export type IprAuthStoreKind =
  | "PROCESS_AUTH_STORE_MVP"
  | "DATABASE_READY"
  | "DATABASE_PERSISTENT"
  | "EXTERNAL_ADAPTER";

export type IprAuthStoreStatus =
  | "AVAILABLE"
  | "NOT_CONFIGURED"
  | "DEGRADED";

export type IprAuthPersistenceStage =
  | "RUNTIME_VOLATILE"
  | "DATABASE_CONTRACT_READY"
  | "DATABASE_PERSISTENT_ACTIVE"
  | "DATABASE_PERSISTENT_NOT_CONFIGURED"
  | "EXTERNAL_ADAPTER_TARGET";

export type IprAuthStoreCapability =
  | "IPR_CREDENTIAL_STORAGE"
  | "PASSWORD_HASH_STORAGE"
  | "LOGIN_ATTEMPT_GOVERNANCE"
  | "SESSION_TOKEN_HASH_STORAGE"
  | "SESSION_CREATE"
  | "SESSION_VERIFY"
  | "SESSION_REVOKE"
  | "SESSION_EXPIRY"
  | "SESSION_TOUCH"
  | "PROCESS_SCOPED_RUNTIME"
  | "SYNC_PROCESS_FALLBACK"
  | "ASYNC_DATABASE_RESTORE"
  | "DATABASE_CONTRACT"
  | "DATABASE_DURABILITY"
  | "SUBJECT_UPSERT"
  | "DEVICE_METADATA"
  | "AUDIT_READY_BOUNDARY"
  | "RETENTION_REQUIRED"
  | "DELETION_REQUIRED"
  | "RECOVERY_REQUIRED"
  | "MONITORING_REQUIRED"
  | "EXTERNAL_ADAPTER_CONTRACT";

export type IprStoredSessionStatus =
  | "ACTIVE"
  | "REVOKED"
  | "EXPIRED";

export type IprAuthCredentialCreateInput = {
  humanIpr: string;
  passwordAlgorithm: string;
  passwordHash: string;
  passwordSalt: string;
  passwordKeyLength: number;
  credentialPayload?: Record<string, unknown>;
};

export type IprLoginFailureInput = {
  humanIpr: string;
  maxFailedAttempts: number;
  lockDurationSeconds: number;
};

export type IprAuthStoredCredential = {
  humanIpr: string;
  passwordAlgorithm: string;
  passwordHash: string;
  passwordSalt: string;
  passwordKeyLength: number;
  passwordCreatedAt: string;
  passwordUpdatedAt: string;
  passwordLastVerifiedAt: string | null;
  failedAttempts: number;
  lockedUntil: string | null;
  credentialPayload: Record<string, unknown>;
  legalCertification: false;
};

export type IprSessionCreateInput = {
  sessionId?: string;
  humanIpr: string;
  runtimeIpr?: string;
  token?: string;
  tokenHash?: string;
  status?: IprStoredSessionStatus;
  createdAt?: string;
  expiresAt: string;
  revokedAt?: string | null;
  lastSeenAt?: string | null;
  deviceLabel?: string | null;
  userAgentHash?: string | null;
  ipAddressHash?: string | null;
  sessionPayload?: Record<string, unknown>;
};

export type IprAuthStoredSession = {
  sessionId: string;
  humanIpr: string;
  runtimeIpr: string;
  tokenHash: string;
  status: IprStoredSessionStatus;
  createdAt: string;
  expiresAt: string;
  revokedAt: string | null;
  lastSeenAt: string | null;
  deviceLabel: string | null;
  userAgentHash: string | null;
  ipAddressHash: string | null;
  sessionPayload: Record<string, unknown>;
  legalCertification: false;
};

export type PublicIprSession = {
  sessionId: string;
  humanIpr: string;
  runtimeIpr: string;
  status: IprStoredSessionStatus;
  createdAt: string;
  expiresAt: string;
  revokedAt: string | null;
  lastSeenAt: string | null;
  deviceLabel: string | null;
  legalCertification: false;
};

export type IprSessionLookupResult =
  | {
      ok: true;
      authenticated: true;
      reason: "SESSION_ACTIVE";
      session: IprAuthStoredSession;
    }
  | {
      ok: false;
      authenticated: false;
      reason: "SESSION_NOT_FOUND" | "SESSION_REVOKED" | "SESSION_EXPIRED";
      session: IprAuthStoredSession | null;
    };

export type IprAuthRecoveryProcessFallbackSyncResult = {
  humanIpr: string;
  credentialReplaced: true;
  revokedSessions: number;
  databaseWritePerformed: false;
  sessionCreationAuthority: false;
  runtimeAuthorizationAuthority: false;
  legalCertification: false;
};


export type IprAuthStoreDescription = {
  name: string;
  kind: IprAuthStoreKind;
  status: IprAuthStoreStatus;
  configured: boolean;
  available: boolean;
  persistenceMode: IprAuthStoreKind;
  persistenceStage: IprAuthPersistenceStage;
  databaseConfigured: boolean;
  databaseDescription?: ReturnType<typeof describeDefaultHbceDatabase>;
  sessionBoundary: string;
  asyncDatabaseRestoreBoundary: string;
  databaseRequirement: string;
  legalCertification: false;
  durable: boolean;
  runtimeScoped: boolean;
  saasReady: boolean;
  requiresDatabase: boolean;
  syncFallbackToProcess: boolean;
  capabilities: IprAuthStoreCapability[];
  requirements: string[];
};

export type IprAuthStoreAdapter = {
  describe(): IprAuthStoreDescription;

  getCredential(humanIpr: string): IprAuthStoredCredential | null;
  setCredential(input: IprAuthCredentialCreateInput): IprAuthStoredCredential;

  createSession(input: IprSessionCreateInput): IprAuthStoredSession;
  verifySessionToken(token: string): IprSessionLookupResult;
  revokeSession(sessionId: string): IprAuthStoredSession | null;

  getCredentialAsync(humanIpr: string): Promise<IprAuthStoredCredential | null>;
  setCredentialAsync(
    input: IprAuthCredentialCreateInput
  ): Promise<IprAuthStoredCredential>;

  recordFailedLoginAttemptAsync(
    input: IprLoginFailureInput
  ): Promise<IprAuthStoredCredential | null>;

  resetLoginAttemptsAsync(
    humanIpr: string
  ): Promise<IprAuthStoredCredential | null>;

  createSessionAsync(input: IprSessionCreateInput): Promise<IprAuthStoredSession>;
  verifySessionTokenAsync(token: string): Promise<IprSessionLookupResult>;
  revokeSessionAsync(sessionId: string): Promise<IprAuthStoredSession | null>;
};

type IprAuthCredentialRow = {
  human_ipr: string;
  password_algorithm: string;
  password_hash: string;
  password_salt: string;
  password_key_length: number;
  password_created_at: string | Date;
  password_updated_at: string | Date;
  password_last_verified_at: string | Date | null;
  failed_attempts: number;
  locked_until: string | Date | null;
  credential_payload: Record<string, unknown> | string | null;
  legal_certification: boolean;
};

type IprSessionRow = {
  session_id: string;
  human_ipr: string;
  runtime_ipr: string;
  token_hash: string;
  status: IprStoredSessionStatus;
  created_at: string | Date;
  expires_at: string | Date;
  revoked_at: string | Date | null;
  last_seen_at: string | Date | null;
  device_label: string | null;
  user_agent_hash: string | null;
  ip_address_hash: string | null;
  session_payload: Record<string, unknown> | string | null;
  legal_certification: boolean;
};

const DEFAULT_RUNTIME_IPR = "IPR-AI-0001";

const DATABASE_STORE_NOT_CONFIGURED_ERROR =
  "IPR_AUTH_DATABASE_STORE_NOT_CONFIGURED";

const EXTERNAL_STORE_NOT_CONFIGURED_ERROR =
  "IPR_AUTH_EXTERNAL_ADAPTER_NOT_CONFIGURED";

export const IPR_AUTH_STORE_BOUNDARY =
  "The current IPR auth store may run as PROCESS_AUTH_STORE_MVP for R&D only. Production-grade JOKER-C2 access requires DATABASE_PERSISTENT storage, session revocation, audit logging, retention policy, device management and recovery workflow.";

export const IPR_AUTH_DATABASE_READY_BOUNDARY =
  "DATABASE_READY means that the authentication contract is prepared for durable storage, but active credential and session persistence still requires a configured HBCE database and production controls.";

export const IPR_AUTH_DATABASE_PERSISTENT_BOUNDARY =
  "DATABASE_PERSISTENT IPR auth stores password hashes, session token hashes and operational session metadata in HBCE Postgres storage. It does not store plaintext passwords or plaintext session tokens, does not issue official identity and does not create legal certification.";

export const IPR_AUTH_ASYNC_DATABASE_RESTORE_BOUNDARY =
  "Cold-start and redeploy recovery from DATABASE_PERSISTENT auth storage requires asynchronous session verification. Synchronous verification may use only the process fallback and must not invent authenticated sessions from client cookies.";

export const IPR_AUTH_EXTERNAL_ADAPTER_BOUNDARY =
  "EXTERNAL_ADAPTER declares a future authentication adapter supplied by the runtime. External auth adapters must preserve HBCE IPR boundaries, token hashing, session revocation, auditability, fail-closed behavior and legalCertification=false.";

const PROCESS_AUTH_CAPABILITIES: IprAuthStoreCapability[] = [
  "IPR_CREDENTIAL_STORAGE",
  "PASSWORD_HASH_STORAGE",
  "LOGIN_ATTEMPT_GOVERNANCE",
  "SESSION_TOKEN_HASH_STORAGE",
  "SESSION_CREATE",
  "SESSION_VERIFY",
  "SESSION_REVOKE",
  "SESSION_EXPIRY",
  "SESSION_TOUCH",
  "PROCESS_SCOPED_RUNTIME",
  "SYNC_PROCESS_FALLBACK"
];

const DATABASE_READY_CAPABILITIES: IprAuthStoreCapability[] = [
  "IPR_CREDENTIAL_STORAGE",
  "PASSWORD_HASH_STORAGE",
  "LOGIN_ATTEMPT_GOVERNANCE",
  "SESSION_TOKEN_HASH_STORAGE",
  "SESSION_CREATE",
  "SESSION_VERIFY",
  "SESSION_REVOKE",
  "SESSION_EXPIRY",
  "SESSION_TOUCH",
  "DATABASE_CONTRACT",
  "SYNC_PROCESS_FALLBACK",
  "ASYNC_DATABASE_RESTORE",
  "AUDIT_READY_BOUNDARY",
  "RETENTION_REQUIRED",
  "DELETION_REQUIRED"
];

const DATABASE_PERSISTENT_CAPABILITIES: IprAuthStoreCapability[] = [
  "IPR_CREDENTIAL_STORAGE",
  "PASSWORD_HASH_STORAGE",
  "LOGIN_ATTEMPT_GOVERNANCE",
  "SESSION_TOKEN_HASH_STORAGE",
  "SESSION_CREATE",
  "SESSION_VERIFY",
  "SESSION_REVOKE",
  "SESSION_EXPIRY",
  "SESSION_TOUCH",
  "DATABASE_CONTRACT",
  "DATABASE_DURABILITY",
  "SUBJECT_UPSERT",
  "DEVICE_METADATA",
  "SYNC_PROCESS_FALLBACK",
  "ASYNC_DATABASE_RESTORE",
  "AUDIT_READY_BOUNDARY",
  "RETENTION_REQUIRED",
  "DELETION_REQUIRED",
  "RECOVERY_REQUIRED",
  "MONITORING_REQUIRED"
];

const EXTERNAL_ADAPTER_CAPABILITIES: IprAuthStoreCapability[] = [
  "IPR_CREDENTIAL_STORAGE",
  "PASSWORD_HASH_STORAGE",
  "LOGIN_ATTEMPT_GOVERNANCE",
  "SESSION_TOKEN_HASH_STORAGE",
  "SESSION_CREATE",
  "SESSION_VERIFY",
  "SESSION_REVOKE",
  "SESSION_EXPIRY",
  "SESSION_TOUCH",
  "EXTERNAL_ADAPTER_CONTRACT",
  "AUDIT_READY_BOUNDARY",
  "RETENTION_REQUIRED",
  "DELETION_REQUIRED"
];

const PROCESS_AUTH_REQUIREMENTS = [
  "Use only for R&D and MVP runtime demonstration.",
  "Do not treat process auth storage as durable SaaS authentication.",
  "Expect session and credential loss on redeploy, cold start, instance recycling or runtime migration.",
  "Do not rely on this store for enterprise account continuity, audit retention, device management or recovery."
];

const DATABASE_READY_REQUIREMENTS = [
  "Configure HBCE database storage.",
  "Run the required credential and session schema.",
  "Validate password hash storage and session token hash storage.",
  "Define session revocation workflow.",
  "Define retention and deletion workflow.",
  "Define audit logging before production use.",
  "Use asynchronous session verification for cold-start recovery.",
  "Keep legalCertification=false."
];

const DATABASE_PERSISTENT_REQUIREMENTS = [
  "Store only password hashes, salts and session token hashes, never plaintext passwords or plaintext tokens.",
  "Persist IPR subjects, credentials and sessions in HBCE database storage.",
  "Enforce session revocation and expiry.",
  "Persist lastSeenAt for authenticated sessions.",
  "Preserve device metadata only as minimized labels or hashes.",
  "Use asynchronous session verification to restore authenticated sessions after deploy, cold start or runtime migration.",
  "Define audit logging for credential creation/update, session creation, verification and revocation.",
  "Define retention, deletion, recovery and monitoring workflows.",
  "Do not claim official identity issuance or legal certification.",
  "Keep legalCertification=false."
];

const EXTERNAL_ADAPTER_REQUIREMENTS = [
  "External adapter must implement the full IprAuthStoreAdapter contract.",
  "External adapter must never store plaintext passwords or plaintext session tokens.",
  "External adapter must preserve token hashing, revocation and expiry.",
  "External adapter must enforce HBCE IPR boundaries and fail-closed behavior.",
  "External adapter must preserve legalCertification=false unless a regulated certification layer is explicitly integrated later."
];

function nowIso(): string {
  return new Date().toISOString();
}

function assertPositiveInteger(
  value: number,
  label: string
): number {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(
      `IPR_AUTH_INVALID_${label.toUpperCase()}`
    );
  }

  return value;
}

function generateSessionId(): string {
  return `IPR-SESSION-${randomBytes(12).toString("hex").toUpperCase()}`;
}

function toIso(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = new Date(value);

    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }

    return value;
  }

  return nowIso();
}

function toIsoOrNull(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  return toIso(value);
}

function toJsonRecord(value: unknown): Record<string, unknown> {
  if (!value) {
    return {};
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);

      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }

      return {};
    } catch {
      return {};
    }
  }

  if (typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}

function jsonParam(value: Record<string, unknown> | undefined): string {
  return JSON.stringify(value || {});
}

function normalizeRuntimeIpr(value: string | undefined): string {
  const candidate = typeof value === "string" ? value.trim() : "";

  return candidate.startsWith("IPR-") ? candidate : DEFAULT_RUNTIME_IPR;
}

function normalizeSessionStatus(
  value: string | undefined
): IprStoredSessionStatus {
  if (value === "REVOKED" || value === "EXPIRED") {
    return value;
  }

  return "ACTIVE";
}

function assertToken(token: string): string {
  const normalized = typeof token === "string" ? token.trim() : "";

  if (!normalized) {
    throw new Error("IPR_AUTH_EMPTY_SESSION_TOKEN");
  }

  return normalized;
}

function assertSessionId(sessionId: string): string {
  const normalized = typeof sessionId === "string" ? sessionId.trim() : "";

  if (!normalized) {
    throw new Error("IPR_AUTH_EMPTY_SESSION_ID");
  }

  return normalized;
}

function assertDatabaseConfigured(): void {
  if (!isHbceDatabaseConfigured()) {
    throw new Error(DATABASE_STORE_NOT_CONFIGURED_ERROR);
  }
}

function buildStoredCredential(
  input: IprAuthCredentialCreateInput,
  timestamps?: {
    createdAt?: string;
    updatedAt?: string;
    lastVerifiedAt?: string | null;
  }
): IprAuthStoredCredential {
  const timestamp = nowIso();

  return {
    humanIpr: normalizeHumanIpr(input.humanIpr),
    passwordAlgorithm: input.passwordAlgorithm,
    passwordHash: input.passwordHash,
    passwordSalt: input.passwordSalt,
    passwordKeyLength: input.passwordKeyLength,
    passwordCreatedAt: timestamps?.createdAt || timestamp,
    passwordUpdatedAt: timestamps?.updatedAt || timestamp,
    passwordLastVerifiedAt: timestamps?.lastVerifiedAt || null,
    failedAttempts: 0,
    lockedUntil: null,
    credentialPayload: input.credentialPayload || {},
    legalCertification: false
  };
}

function buildStoredSession(input: IprSessionCreateInput): IprAuthStoredSession {
  const humanIpr = normalizeHumanIpr(input.humanIpr);
  const sessionId = input.sessionId || generateSessionId();
  const tokenHash = input.tokenHash || hashIprSessionToken(input.token || sessionId);

  return {
    sessionId,
    humanIpr,
    runtimeIpr: normalizeRuntimeIpr(input.runtimeIpr),
    tokenHash,
    status: normalizeSessionStatus(input.status),
    createdAt: input.createdAt || nowIso(),
    expiresAt: input.expiresAt,
    revokedAt: input.revokedAt || null,
    lastSeenAt: input.lastSeenAt || null,
    deviceLabel: input.deviceLabel || null,
    userAgentHash: input.userAgentHash || null,
    ipAddressHash: input.ipAddressHash || null,
    sessionPayload: input.sessionPayload || {},
    legalCertification: false
  };
}

function toSessionCreateInputFromStoredSession(
  session: IprAuthStoredSession
): IprSessionCreateInput {
  return {
    sessionId: session.sessionId,
    humanIpr: session.humanIpr,
    runtimeIpr: session.runtimeIpr,
    tokenHash: session.tokenHash,
    status: session.status,
    createdAt: session.createdAt,
    expiresAt: session.expiresAt,
    revokedAt: session.revokedAt,
    lastSeenAt: session.lastSeenAt,
    deviceLabel: session.deviceLabel,
    userAgentHash: session.userAgentHash,
    ipAddressHash: session.ipAddressHash,
    sessionPayload: session.sessionPayload
  };
}

function credentialFromRow(row: IprAuthCredentialRow): IprAuthStoredCredential {
  return {
    humanIpr: row.human_ipr,
    passwordAlgorithm: row.password_algorithm,
    passwordHash: row.password_hash,
    passwordSalt: row.password_salt,
    passwordKeyLength: Number(row.password_key_length),
    passwordCreatedAt: toIso(row.password_created_at),
    passwordUpdatedAt: toIso(row.password_updated_at),
    passwordLastVerifiedAt: toIsoOrNull(row.password_last_verified_at),
    failedAttempts: Number(row.failed_attempts || 0),
    lockedUntil: toIsoOrNull(row.locked_until),
    credentialPayload: toJsonRecord(row.credential_payload),
    legalCertification: false
  };
}

function sessionFromRow(row: IprSessionRow): IprAuthStoredSession {
  return {
    sessionId: row.session_id,
    humanIpr: row.human_ipr,
    runtimeIpr: row.runtime_ipr,
    tokenHash: row.token_hash,
    status: normalizeSessionStatus(row.status),
    createdAt: toIso(row.created_at),
    expiresAt: toIso(row.expires_at),
    revokedAt: toIsoOrNull(row.revoked_at),
    lastSeenAt: toIsoOrNull(row.last_seen_at),
    deviceLabel: row.device_label || null,
    userAgentHash: row.user_agent_hash || null,
    ipAddressHash: row.ip_address_hash || null,
    sessionPayload: toJsonRecord(row.session_payload),
    legalCertification: false
  };
}

function buildDescription(input: {
  name: string;
  kind: IprAuthStoreKind;
  status: IprAuthStoreStatus;
  configured: boolean;
  available: boolean;
  persistenceStage: IprAuthPersistenceStage;
  sessionBoundary: string;
  durable: boolean;
  runtimeScoped: boolean;
  saasReady: boolean;
  requiresDatabase: boolean;
  syncFallbackToProcess: boolean;
  capabilities: IprAuthStoreCapability[];
  requirements: string[];
}): IprAuthStoreDescription {
  const databaseConfigured = isHbceDatabaseConfigured();

  return {
    name: input.name,
    kind: input.kind,
    status: input.status,
    configured: input.configured,
    available: input.available,
    persistenceMode: input.kind,
    persistenceStage: input.persistenceStage,
    databaseConfigured,
    databaseDescription: databaseConfigured
      ? describeDefaultHbceDatabase()
      : undefined,
    sessionBoundary: input.sessionBoundary,
    asyncDatabaseRestoreBoundary: IPR_AUTH_ASYNC_DATABASE_RESTORE_BOUNDARY,
    databaseRequirement: IPR_AUTH_DATABASE_REQUIREMENT,
    legalCertification: false,
    durable: input.durable,
    runtimeScoped: input.runtimeScoped,
    saasReady: input.saasReady,
    requiresDatabase: input.requiresDatabase,
    syncFallbackToProcess: input.syncFallbackToProcess,
    capabilities: input.capabilities,
    requirements: input.requirements
  };
}

class ProcessIprAuthStore implements IprAuthStoreAdapter {
  private readonly credentials = new Map<string, IprAuthStoredCredential>();
  private readonly sessions = new Map<string, IprAuthStoredSession>();

  describe(): IprAuthStoreDescription {
    return buildDescription({
      name: "HBCE_JOKER_C2_PROCESS_AUTH_STORE",
      kind: "PROCESS_AUTH_STORE_MVP",
      status: "AVAILABLE",
      configured: true,
      available: true,
      persistenceStage: "RUNTIME_VOLATILE",
      sessionBoundary: IPR_AUTH_STORE_BOUNDARY,
      durable: false,
      runtimeScoped: true,
      saasReady: false,
      requiresDatabase: false,
      syncFallbackToProcess: false,
      capabilities: PROCESS_AUTH_CAPABILITIES,
      requirements: PROCESS_AUTH_REQUIREMENTS
    });
  }

  getCredential(humanIpr: string): IprAuthStoredCredential | null {
    return this.credentials.get(normalizeHumanIpr(humanIpr)) || null;
  }

  setCredential(input: IprAuthCredentialCreateInput): IprAuthStoredCredential {
    const credential = buildStoredCredential(input);
    this.credentials.set(credential.humanIpr, credential);

    return credential;
  }

  replaceCredential(
    credential: IprAuthStoredCredential
  ): IprAuthStoredCredential {
    this.credentials.set(
      normalizeHumanIpr(credential.humanIpr),
      credential
    );

    return credential;
  }

  recordFailedLoginAttempt(
    input: IprLoginFailureInput
  ): IprAuthStoredCredential | null {
    const credential = this.getCredential(
      input.humanIpr
    );

    if (!credential) {
      return null;
    }

    const maxFailedAttempts =
      assertPositiveInteger(
        input.maxFailedAttempts,
        "max_failed_attempts"
      );

    const lockDurationSeconds =
      assertPositiveInteger(
        input.lockDurationSeconds,
        "lock_duration_seconds"
      );

    const now = Date.now();

    const currentLockExpiry =
      credential.lockedUntil
        ? Date.parse(credential.lockedUntil)
        : Number.NaN;

    const lockActive =
      Number.isFinite(currentLockExpiry) &&
      currentLockExpiry > now;

    const previousLockExpired =
      Number.isFinite(currentLockExpiry) &&
      currentLockExpiry <= now;

    const failedAttempts =
      lockActive
        ? credential.failedAttempts
        : (
            previousLockExpired
              ? 0
              : credential.failedAttempts
          ) + 1;

    const lockedUntil =
      lockActive
        ? credential.lockedUntil
        : failedAttempts >= maxFailedAttempts
          ? new Date(
              now
              + lockDurationSeconds * 1000
            ).toISOString()
          : null;

    const updated: IprAuthStoredCredential = {
      ...credential,
      failedAttempts,
      lockedUntil
    };

    return this.replaceCredential(updated);
  }

  resetLoginAttempts(
    humanIpr: string
  ): IprAuthStoredCredential | null {
    const credential =
      this.getCredential(humanIpr);

    if (!credential) {
      return null;
    }

    const updated: IprAuthStoredCredential = {
      ...credential,
      failedAttempts: 0,
      lockedUntil: null,
      passwordLastVerifiedAt: nowIso()
    };

    return this.replaceCredential(updated);
  }

  createSession(input: IprSessionCreateInput): IprAuthStoredSession {
    const session = buildStoredSession(input);
    this.sessions.set(session.sessionId, session);

    return session;
  }

  verifySessionToken(token: string): IprSessionLookupResult {
    const tokenHash = hashIprSessionToken(assertToken(token));
    const session = [...this.sessions.values()].find(
      (candidate) => candidate.tokenHash === tokenHash
    );

    if (!session) {
      return {
        ok: false,
        authenticated: false,
        reason: "SESSION_NOT_FOUND",
        session: null
      };
    }

    if (session.status === "REVOKED" || session.revokedAt) {
      return {
        ok: false,
        authenticated: false,
        reason: "SESSION_REVOKED",
        session
      };
    }

    if (session.status === "EXPIRED" || isIprSessionExpired(session)) {
      const expiredSession: IprAuthStoredSession = {
        ...session,
        status: "EXPIRED"
      };

      this.sessions.set(expiredSession.sessionId, expiredSession);

      return {
        ok: false,
        authenticated: false,
        reason: "SESSION_EXPIRED",
        session: expiredSession
      };
    }

    const refreshedSession: IprAuthStoredSession = {
      ...session,
      lastSeenAt: nowIso()
    };

    this.sessions.set(refreshedSession.sessionId, refreshedSession);

    return {
      ok: true,
      authenticated: true,
      reason: "SESSION_ACTIVE",
      session: refreshedSession
    };
  }

  revokeSession(sessionId: string): IprAuthStoredSession | null {
    const safeSessionId = assertSessionId(sessionId);
    const session = this.sessions.get(safeSessionId);

    if (!session) {
      return null;
    }

    const revokedSession: IprAuthStoredSession = {
      ...session,
      status: "REVOKED",
      revokedAt: nowIso()
    };

    this.sessions.set(safeSessionId, revokedSession);

    return revokedSession;
  }

  revokeSubjectSessions(
    humanIpr: string
  ): number {
    const normalizedHumanIpr =
      normalizeHumanIpr(
        humanIpr
      );

    if (!normalizedHumanIpr) {
      throw new Error(
        "IPR_AUTH_RECOVERY_HUMAN_IPR_REQUIRED"
      );
    }

    const revokedAt =
      nowIso();

    let revokedSessions =
      0;

    for (
      const [
        sessionId,
        session
      ] of this.sessions.entries()
    ) {
      if (
        session.humanIpr !==
          normalizedHumanIpr
      ) {
        continue;
      }

      if (
        session.status !==
          "ACTIVE" ||
        session.revokedAt
      ) {
        continue;
      }

      this.sessions.set(
        sessionId,
        {
          ...session,
          status:
            "REVOKED",
          revokedAt
        }
      );

      revokedSessions +=
        1;
    }

    return revokedSessions;
  }


  async getCredentialAsync(
    humanIpr: string
  ): Promise<IprAuthStoredCredential | null> {
    return this.getCredential(humanIpr);
  }

  async setCredentialAsync(
    input: IprAuthCredentialCreateInput
  ): Promise<IprAuthStoredCredential> {
    return this.setCredential(input);
  }

  async recordFailedLoginAttemptAsync(
    input: IprLoginFailureInput
  ): Promise<IprAuthStoredCredential | null> {
    return this.recordFailedLoginAttempt(input);
  }

  async resetLoginAttemptsAsync(
    humanIpr: string
  ): Promise<IprAuthStoredCredential | null> {
    return this.resetLoginAttempts(humanIpr);
  }

  async createSessionAsync(
    input: IprSessionCreateInput
  ): Promise<IprAuthStoredSession> {
    return this.createSession(input);
  }

  async verifySessionTokenAsync(
    token: string
  ): Promise<IprSessionLookupResult> {
    return this.verifySessionToken(token);
  }

  async revokeSessionAsync(
    sessionId: string
  ): Promise<IprAuthStoredSession | null> {
    return this.revokeSession(sessionId);
  }

  clear(): void {
    this.credentials.clear();
    this.sessions.clear();
  }
}

class DatabaseReadyIprAuthStore implements IprAuthStoreAdapter {
  private readonly processFallback: ProcessIprAuthStore;

  constructor(processFallback: ProcessIprAuthStore) {
    this.processFallback = processFallback;
  }

  describe(): IprAuthStoreDescription {
    return buildDescription({
      name: "HBCE_JOKER_C2_DATABASE_READY_AUTH_STORE",
      kind: "DATABASE_READY",
      status: "DEGRADED",
      configured: true,
      available: true,
      persistenceStage: "DATABASE_CONTRACT_READY",
      sessionBoundary: IPR_AUTH_DATABASE_READY_BOUNDARY,
      durable: false,
      runtimeScoped: true,
      saasReady: false,
      requiresDatabase: true,
      syncFallbackToProcess: true,
      capabilities: DATABASE_READY_CAPABILITIES,
      requirements: DATABASE_READY_REQUIREMENTS
    });
  }

  getCredential(humanIpr: string): IprAuthStoredCredential | null {
    return this.processFallback.getCredential(humanIpr);
  }

  setCredential(input: IprAuthCredentialCreateInput): IprAuthStoredCredential {
    return this.processFallback.setCredential(input);
  }

  createSession(input: IprSessionCreateInput): IprAuthStoredSession {
    return this.processFallback.createSession(input);
  }

  verifySessionToken(token: string): IprSessionLookupResult {
    return this.processFallback.verifySessionToken(token);
  }

  revokeSession(sessionId: string): IprAuthStoredSession | null {
    return this.processFallback.revokeSession(sessionId);
  }

  async getCredentialAsync(
    humanIpr: string
  ): Promise<IprAuthStoredCredential | null> {
    return this.processFallback.getCredentialAsync(humanIpr);
  }

  async setCredentialAsync(
    input: IprAuthCredentialCreateInput
  ): Promise<IprAuthStoredCredential> {
    return this.processFallback.setCredentialAsync(input);
  }

  async recordFailedLoginAttemptAsync(
    input: IprLoginFailureInput
  ): Promise<IprAuthStoredCredential | null> {
    return this.processFallback
      .recordFailedLoginAttemptAsync(input);
  }

  async resetLoginAttemptsAsync(
    humanIpr: string
  ): Promise<IprAuthStoredCredential | null> {
    return this.processFallback
      .resetLoginAttemptsAsync(humanIpr);
  }

  async createSessionAsync(
    input: IprSessionCreateInput
  ): Promise<IprAuthStoredSession> {
    return this.processFallback.createSessionAsync(input);
  }

  async verifySessionTokenAsync(
    token: string
  ): Promise<IprSessionLookupResult> {
    return this.processFallback.verifySessionTokenAsync(token);
  }

  async revokeSessionAsync(
    sessionId: string
  ): Promise<IprAuthStoredSession | null> {
    return this.processFallback.revokeSessionAsync(sessionId);
  }
}

class DatabasePersistentIprAuthStore implements IprAuthStoreAdapter {
  private readonly processFallback: ProcessIprAuthStore;

  constructor(processFallback: ProcessIprAuthStore) {
    this.processFallback = processFallback;
  }

  describe(): IprAuthStoreDescription {
    if (!isHbceDatabaseConfigured()) {
      return buildDescription({
        name: "HBCE_JOKER_C2_DATABASE_PERSISTENT_AUTH_STORE",
        kind: "DATABASE_PERSISTENT",
        status: "NOT_CONFIGURED",
        configured: false,
        available: false,
        persistenceStage: "DATABASE_PERSISTENT_NOT_CONFIGURED",
        sessionBoundary: IPR_AUTH_DATABASE_PERSISTENT_BOUNDARY,
        durable: false,
        runtimeScoped: true,
        saasReady: false,
        requiresDatabase: true,
        syncFallbackToProcess: true,
        capabilities: DATABASE_PERSISTENT_CAPABILITIES,
        requirements: DATABASE_PERSISTENT_REQUIREMENTS
      });
    }

    return buildDescription({
      name: "HBCE_JOKER_C2_DATABASE_PERSISTENT_AUTH_STORE",
      kind: "DATABASE_PERSISTENT",
      status: "AVAILABLE",
      configured: true,
      available: true,
      persistenceStage: "DATABASE_PERSISTENT_ACTIVE",
      sessionBoundary: IPR_AUTH_DATABASE_PERSISTENT_BOUNDARY,
      durable: true,
      runtimeScoped: false,
      saasReady: true,
      requiresDatabase: true,
      syncFallbackToProcess: true,
      capabilities: DATABASE_PERSISTENT_CAPABILITIES,
      requirements: DATABASE_PERSISTENT_REQUIREMENTS
    });
  }

  private persistCredentialFireAndForget(
    input: IprAuthCredentialCreateInput
  ): void {
    if (!isHbceDatabaseConfigured()) {
      return;
    }

    void this.setCredentialAsync(input).catch(() => undefined);
  }

  private persistSessionFireAndForget(session: IprAuthStoredSession): void {
    if (!isHbceDatabaseConfigured()) {
      return;
    }

    void this.createSessionAsync(toSessionCreateInputFromStoredSession(session)).catch(
      () => undefined
    );
  }

  private touchSessionFireAndForget(sessionId: string): void {
    if (!isHbceDatabaseConfigured()) {
      return;
    }

    void this.touchSession(sessionId).catch(() => undefined);
  }

  private revokeSessionFireAndForget(sessionId: string): void {
    if (!isHbceDatabaseConfigured()) {
      return;
    }

    void this.revokeSessionAsync(sessionId).catch(() => undefined);
  }

  getCredential(humanIpr: string): IprAuthStoredCredential | null {
    return this.processFallback.getCredential(humanIpr);
  }

  setCredential(input: IprAuthCredentialCreateInput): IprAuthStoredCredential {
    const credential = this.processFallback.setCredential(input);

    this.persistCredentialFireAndForget({
      humanIpr: credential.humanIpr,
      passwordAlgorithm: credential.passwordAlgorithm,
      passwordHash: credential.passwordHash,
      passwordSalt: credential.passwordSalt,
      passwordKeyLength: credential.passwordKeyLength,
      credentialPayload: credential.credentialPayload
    });

    return credential;
  }

  createSession(input: IprSessionCreateInput): IprAuthStoredSession {
    const session = this.processFallback.createSession(input);

    this.persistSessionFireAndForget(session);

    return session;
  }

  verifySessionToken(token: string): IprSessionLookupResult {
    const result = this.processFallback.verifySessionToken(token);

    if (result.ok && result.session) {
      this.touchSessionFireAndForget(result.session.sessionId);
    }

    return result;
  }

  revokeSession(sessionId: string): IprAuthStoredSession | null {
    const revoked = this.processFallback.revokeSession(sessionId);

    this.revokeSessionFireAndForget(sessionId);

    return revoked;
  }

  private async upsertSubject(humanIpr: string): Promise<void> {
    assertDatabaseConfigured();

    const normalizedHumanIpr = normalizeHumanIpr(humanIpr);

    await queryHbceDatabase(
      `
INSERT INTO ipr_subjects (
  human_ipr,
  entity,
  subject_kind,
  status,
  created_at,
  updated_at,
  last_seen_at,
  metadata,
  legal_certification
)
VALUES (
  $1,
  $2,
  'BIOLOGICAL_SUBJECT',
  'ACTIVE',
  now(),
  now(),
  now(),
  $3::jsonb,
  false
)
ON CONFLICT (human_ipr) DO UPDATE SET
  updated_at = now(),
  last_seen_at = now(),
  metadata = ipr_subjects.metadata || EXCLUDED.metadata,
  legal_certification = false
      `.trim(),
      [
        normalizedHumanIpr,
        `HBCE IPR Subject ${normalizedHumanIpr}`,
        JSON.stringify({
          source: "IPR_AUTH_STORE",
          persistenceMode: "DATABASE_PERSISTENT",
          legalCertification: false
        })
      ]
    );
  }

  async getCredentialAsync(
    humanIpr: string
  ): Promise<IprAuthStoredCredential | null> {
    assertDatabaseConfigured();

    const normalizedHumanIpr = normalizeHumanIpr(humanIpr);

    const result = await queryHbceDatabase<IprAuthCredentialRow>(
      `
SELECT
  human_ipr,
  password_algorithm,
  password_hash,
  password_salt,
  password_key_length,
  password_created_at,
  password_updated_at,
  password_last_verified_at,
  failed_attempts,
  locked_until,
  credential_payload,
  legal_certification
FROM ipr_auth_credentials
WHERE human_ipr = $1
LIMIT 1
      `.trim(),
      [normalizedHumanIpr]
    );

    if (!result.ok || !result.rows[0]) {
      return null;
    }

    return credentialFromRow(result.rows[0]);
  }

  async setCredentialAsync(
    input: IprAuthCredentialCreateInput
  ): Promise<IprAuthStoredCredential> {
    assertDatabaseConfigured();

    const credential = buildStoredCredential(input);

    await this.upsertSubject(credential.humanIpr);

    const result = await queryHbceDatabase<IprAuthCredentialRow>(
      `
INSERT INTO ipr_auth_credentials (
  human_ipr,
  password_algorithm,
  password_hash,
  password_salt,
  password_key_length,
  password_created_at,
  password_updated_at,
  password_last_verified_at,
  failed_attempts,
  locked_until,
  credential_payload,
  legal_certification
)
VALUES (
  $1,
  $2,
  $3,
  $4,
  $5,
  now(),
  now(),
  NULL,
  0,
  NULL,
  $6::jsonb,
  false
)
ON CONFLICT (human_ipr) DO UPDATE SET
  password_algorithm = EXCLUDED.password_algorithm,
  password_hash = EXCLUDED.password_hash,
  password_salt = EXCLUDED.password_salt,
  password_key_length = EXCLUDED.password_key_length,
  password_updated_at = now(),
  failed_attempts = 0,
  locked_until = NULL,
  credential_payload = EXCLUDED.credential_payload,
  legal_certification = false
RETURNING
  human_ipr,
  password_algorithm,
  password_hash,
  password_salt,
  password_key_length,
  password_created_at,
  password_updated_at,
  password_last_verified_at,
  failed_attempts,
  locked_until,
  credential_payload,
  legal_certification
      `.trim(),
      [
        credential.humanIpr,
        credential.passwordAlgorithm,
        credential.passwordHash,
        credential.passwordSalt,
        credential.passwordKeyLength,
        jsonParam(credential.credentialPayload)
      ]
    );

    if (!result.ok || !result.rows[0]) {
      throw new Error(
        result.error || "IPR_AUTH_CREDENTIAL_DATABASE_WRITE_FAILED"
      );
    }

    const storedCredential = credentialFromRow(result.rows[0]);

    this.processFallback.setCredential({
      humanIpr: storedCredential.humanIpr,
      passwordAlgorithm: storedCredential.passwordAlgorithm,
      passwordHash: storedCredential.passwordHash,
      passwordSalt: storedCredential.passwordSalt,
      passwordKeyLength: storedCredential.passwordKeyLength,
      credentialPayload: storedCredential.credentialPayload
    });

    return storedCredential;
  }

  async recordFailedLoginAttemptAsync(
    input: IprLoginFailureInput
  ): Promise<IprAuthStoredCredential | null> {
    assertDatabaseConfigured();

    const humanIpr =
      normalizeHumanIpr(input.humanIpr);

    const maxFailedAttempts =
      assertPositiveInteger(
        input.maxFailedAttempts,
        "max_failed_attempts"
      );

    const lockDurationSeconds =
      assertPositiveInteger(
        input.lockDurationSeconds,
        "lock_duration_seconds"
      );

    const result =
      await queryHbceDatabase<IprAuthCredentialRow>(
        `
UPDATE ipr_auth_credentials
SET
  failed_attempts = CASE
    WHEN locked_until IS NOT NULL
      AND locked_until > now()
    THEN failed_attempts
    WHEN locked_until IS NOT NULL
      AND locked_until <= now()
    THEN 1
    ELSE failed_attempts + 1
  END,
  locked_until = CASE
    WHEN locked_until IS NOT NULL
      AND locked_until > now()
    THEN locked_until
    WHEN (
      CASE
        WHEN locked_until IS NOT NULL
          AND locked_until <= now()
        THEN 1
        ELSE failed_attempts + 1
      END
    ) >= $2::integer
    THEN now() + (
      $3::integer * INTERVAL '1 second'
    )
    ELSE NULL
  END
WHERE human_ipr = $1
RETURNING
  human_ipr,
  password_algorithm,
  password_hash,
  password_salt,
  password_key_length,
  password_created_at,
  password_updated_at,
  password_last_verified_at,
  failed_attempts,
  locked_until,
  credential_payload,
  legal_certification
        `.trim(),
        [
          humanIpr,
          maxFailedAttempts,
          lockDurationSeconds
        ]
      );

    if (!result.ok) {
      throw new Error(
        result.error ||
          "IPR_AUTH_FAILED_ATTEMPT_DATABASE_WRITE_FAILED"
      );
    }

    if (!result.rows[0]) {
      return null;
    }

    const credential =
      credentialFromRow(result.rows[0]);

    this.processFallback
      .replaceCredential(credential);

    return credential;
  }

  async resetLoginAttemptsAsync(
    humanIpr: string
  ): Promise<IprAuthStoredCredential | null> {
    assertDatabaseConfigured();

    const normalizedHumanIpr =
      normalizeHumanIpr(humanIpr);

    const result =
      await queryHbceDatabase<IprAuthCredentialRow>(
        `
UPDATE ipr_auth_credentials
SET
  failed_attempts = 0,
  locked_until = NULL,
  password_last_verified_at = now()
WHERE human_ipr = $1
RETURNING
  human_ipr,
  password_algorithm,
  password_hash,
  password_salt,
  password_key_length,
  password_created_at,
  password_updated_at,
  password_last_verified_at,
  failed_attempts,
  locked_until,
  credential_payload,
  legal_certification
        `.trim(),
        [normalizedHumanIpr]
      );

    if (!result.ok) {
      throw new Error(
        result.error ||
          "IPR_AUTH_LOGIN_RESET_DATABASE_WRITE_FAILED"
      );
    }

    if (!result.rows[0]) {
      return null;
    }

    const credential =
      credentialFromRow(result.rows[0]);

    this.processFallback
      .replaceCredential(credential);

    return credential;
  }

  async createSessionAsync(
    input: IprSessionCreateInput
  ): Promise<IprAuthStoredSession> {
    assertDatabaseConfigured();

    const session = buildStoredSession(input);

    await this.upsertSubject(session.humanIpr);

    const result = await queryHbceDatabase<IprSessionRow>(
      `
INSERT INTO ipr_sessions (
  session_id,
  human_ipr,
  runtime_ipr,
  token_hash,
  status,
  created_at,
  expires_at,
  revoked_at,
  last_seen_at,
  device_label,
  user_agent_hash,
  ip_address_hash,
  session_payload,
  legal_certification
)
VALUES (
  $1,
  $2,
  $3,
  $4,
  $5,
  $6::timestamptz,
  $7::timestamptz,
  $8::timestamptz,
  $9::timestamptz,
  $10,
  $11,
  $12,
  $13::jsonb,
  false
)
ON CONFLICT (session_id) DO UPDATE SET
  human_ipr = EXCLUDED.human_ipr,
  runtime_ipr = EXCLUDED.runtime_ipr,
  token_hash = EXCLUDED.token_hash,
  status = EXCLUDED.status,
  expires_at = EXCLUDED.expires_at,
  revoked_at = EXCLUDED.revoked_at,
  last_seen_at = EXCLUDED.last_seen_at,
  device_label = EXCLUDED.device_label,
  user_agent_hash = EXCLUDED.user_agent_hash,
  ip_address_hash = EXCLUDED.ip_address_hash,
  session_payload = EXCLUDED.session_payload,
  legal_certification = false
RETURNING
  session_id,
  human_ipr,
  runtime_ipr,
  token_hash,
  status,
  created_at,
  expires_at,
  revoked_at,
  last_seen_at,
  device_label,
  user_agent_hash,
  ip_address_hash,
  session_payload,
  legal_certification
      `.trim(),
      [
        session.sessionId,
        session.humanIpr,
        session.runtimeIpr,
        session.tokenHash,
        session.status,
        session.createdAt,
        session.expiresAt,
        session.revokedAt,
        session.lastSeenAt,
        session.deviceLabel,
        session.userAgentHash,
        session.ipAddressHash,
        jsonParam(session.sessionPayload)
      ]
    );

    if (!result.ok || !result.rows[0]) {
      throw new Error(result.error || "IPR_SESSION_DATABASE_WRITE_FAILED");
    }

    const storedSession = sessionFromRow(result.rows[0]);

    this.processFallback.createSession(toSessionCreateInputFromStoredSession(storedSession));

    return storedSession;
  }

  async verifySessionTokenAsync(
    token: string
  ): Promise<IprSessionLookupResult> {
    assertDatabaseConfigured();

    const tokenHash = hashIprSessionToken(assertToken(token));

    const result = await queryHbceDatabase<IprSessionRow>(
      `
SELECT
  session_id,
  human_ipr,
  runtime_ipr,
  token_hash,
  status,
  created_at,
  expires_at,
  revoked_at,
  last_seen_at,
  device_label,
  user_agent_hash,
  ip_address_hash,
  session_payload,
  legal_certification
FROM ipr_sessions
WHERE token_hash = $1
LIMIT 1
      `.trim(),
      [tokenHash]
    );

    if (!result.ok || !result.rows[0]) {
      return this.processFallback.verifySessionToken(token);
    }

    const session = sessionFromRow(result.rows[0]);

    if (session.status === "REVOKED" || session.revokedAt) {
      this.processFallback.createSession(toSessionCreateInputFromStoredSession(session));

      return {
        ok: false,
        authenticated: false,
        reason: "SESSION_REVOKED",
        session
      };
    }

    if (session.status === "EXPIRED" || isIprSessionExpired(session)) {
      const expired = await this.markSessionExpired(session);

      return {
        ok: false,
        authenticated: false,
        reason: "SESSION_EXPIRED",
        session: expired
      };
    }

    const refreshedSession = await this.touchSession(session.sessionId);
    const activeSession = refreshedSession || session;

    this.processFallback.createSession(toSessionCreateInputFromStoredSession(activeSession));

    return {
      ok: true,
      authenticated: true,
      reason: "SESSION_ACTIVE",
      session: activeSession
    };
  }

  private async touchSession(
    sessionId: string
  ): Promise<IprAuthStoredSession | null> {
    assertDatabaseConfigured();

    const result = await queryHbceDatabase<IprSessionRow>(
      `
UPDATE ipr_sessions
SET
  last_seen_at = now(),
  legal_certification = false
WHERE session_id = $1
RETURNING
  session_id,
  human_ipr,
  runtime_ipr,
  token_hash,
  status,
  created_at,
  expires_at,
  revoked_at,
  last_seen_at,
  device_label,
  user_agent_hash,
  ip_address_hash,
  session_payload,
  legal_certification
      `.trim(),
      [assertSessionId(sessionId)]
    );

    if (!result.ok || !result.rows[0]) {
      return null;
    }

    return sessionFromRow(result.rows[0]);
  }

  private async markSessionExpired(
    session: IprAuthStoredSession
  ): Promise<IprAuthStoredSession> {
    assertDatabaseConfigured();

    const result = await queryHbceDatabase<IprSessionRow>(
      `
UPDATE ipr_sessions
SET
  status = 'EXPIRED',
  legal_certification = false
WHERE session_id = $1
RETURNING
  session_id,
  human_ipr,
  runtime_ipr,
  token_hash,
  status,
  created_at,
  expires_at,
  revoked_at,
  last_seen_at,
  device_label,
  user_agent_hash,
  ip_address_hash,
  session_payload,
  legal_certification
      `.trim(),
      [session.sessionId]
    );

    if (!result.ok || !result.rows[0]) {
      return {
        ...session,
        status: "EXPIRED"
      };
    }

    const expiredSession = sessionFromRow(result.rows[0]);

    this.processFallback.createSession(toSessionCreateInputFromStoredSession(expiredSession));

    return expiredSession;
  }

  async revokeSessionAsync(
    sessionId: string
  ): Promise<IprAuthStoredSession | null> {
    assertDatabaseConfigured();

    const result = await queryHbceDatabase<IprSessionRow>(
      `
UPDATE ipr_sessions
SET
  status = 'REVOKED',
  revoked_at = now(),
  legal_certification = false
WHERE session_id = $1
RETURNING
  session_id,
  human_ipr,
  runtime_ipr,
  token_hash,
  status,
  created_at,
  expires_at,
  revoked_at,
  last_seen_at,
  device_label,
  user_agent_hash,
  ip_address_hash,
  session_payload,
  legal_certification
      `.trim(),
      [assertSessionId(sessionId)]
    );

    if (!result.ok || !result.rows[0]) {
      return null;
    }

    const revokedSession = sessionFromRow(result.rows[0]);

    this.processFallback.createSession(toSessionCreateInputFromStoredSession(revokedSession));

    return revokedSession;
  }
}

class ExternalAdapterPlaceholderIprAuthStore implements IprAuthStoreAdapter {
  describe(): IprAuthStoreDescription {
    return buildDescription({
      name: "HBCE_JOKER_C2_EXTERNAL_AUTH_ADAPTER_PLACEHOLDER",
      kind: "EXTERNAL_ADAPTER",
      status: "NOT_CONFIGURED",
      configured: false,
      available: false,
      persistenceStage: "EXTERNAL_ADAPTER_TARGET",
      sessionBoundary: IPR_AUTH_EXTERNAL_ADAPTER_BOUNDARY,
      durable: true,
      runtimeScoped: false,
      saasReady: false,
      requiresDatabase: false,
      syncFallbackToProcess: false,
      capabilities: EXTERNAL_ADAPTER_CAPABILITIES,
      requirements: EXTERNAL_ADAPTER_REQUIREMENTS
    });
  }

  getCredential(humanIpr: string): IprAuthStoredCredential | null {
    void humanIpr;
    throw new Error(EXTERNAL_STORE_NOT_CONFIGURED_ERROR);
  }

  setCredential(input: IprAuthCredentialCreateInput): IprAuthStoredCredential {
    void input;
    throw new Error(EXTERNAL_STORE_NOT_CONFIGURED_ERROR);
  }

  createSession(input: IprSessionCreateInput): IprAuthStoredSession {
    void input;
    throw new Error(EXTERNAL_STORE_NOT_CONFIGURED_ERROR);
  }

  verifySessionToken(token: string): IprSessionLookupResult {
    void token;
    throw new Error(EXTERNAL_STORE_NOT_CONFIGURED_ERROR);
  }

  revokeSession(sessionId: string): IprAuthStoredSession | null {
    void sessionId;
    throw new Error(EXTERNAL_STORE_NOT_CONFIGURED_ERROR);
  }

  async getCredentialAsync(
    humanIpr: string
  ): Promise<IprAuthStoredCredential | null> {
    return this.getCredential(humanIpr);
  }

  async setCredentialAsync(
    input: IprAuthCredentialCreateInput
  ): Promise<IprAuthStoredCredential> {
    return this.setCredential(input);
  }

  async recordFailedLoginAttemptAsync(
    input: IprLoginFailureInput
  ): Promise<IprAuthStoredCredential | null> {
    void input;
    throw new Error(
      EXTERNAL_STORE_NOT_CONFIGURED_ERROR
    );
  }

  async resetLoginAttemptsAsync(
    humanIpr: string
  ): Promise<IprAuthStoredCredential | null> {
    void humanIpr;
    throw new Error(
      EXTERNAL_STORE_NOT_CONFIGURED_ERROR
    );
  }

  async createSessionAsync(
    input: IprSessionCreateInput
  ): Promise<IprAuthStoredSession> {
    return this.createSession(input);
  }

  async verifySessionTokenAsync(
    token: string
  ): Promise<IprSessionLookupResult> {
    return this.verifySessionToken(token);
  }

  async revokeSessionAsync(
    sessionId: string
  ): Promise<IprAuthStoredSession | null> {
    return this.revokeSession(sessionId);
  }
}

const globalForIprAuthStore = globalThis as typeof globalThis & {
  __hbceProcessIprAuthStore?: ProcessIprAuthStore;
  __hbceDatabaseReadyIprAuthStore?: DatabaseReadyIprAuthStore;
  __hbceDatabasePersistentIprAuthStore?: DatabasePersistentIprAuthStore;
  __hbceExternalAdapterPlaceholderIprAuthStore?: ExternalAdapterPlaceholderIprAuthStore;
};

export function getProcessIprAuthStore(): ProcessIprAuthStore {
  if (!globalForIprAuthStore.__hbceProcessIprAuthStore) {
    globalForIprAuthStore.__hbceProcessIprAuthStore =
      new ProcessIprAuthStore();
  }

  return globalForIprAuthStore.__hbceProcessIprAuthStore;
}

export function getDatabaseReadyIprAuthStore(): DatabaseReadyIprAuthStore {
  if (!globalForIprAuthStore.__hbceDatabaseReadyIprAuthStore) {
    globalForIprAuthStore.__hbceDatabaseReadyIprAuthStore =
      new DatabaseReadyIprAuthStore(getProcessIprAuthStore());
  }

  return globalForIprAuthStore.__hbceDatabaseReadyIprAuthStore;
}

export function getDatabasePersistentIprAuthStore(): DatabasePersistentIprAuthStore {
  if (!globalForIprAuthStore.__hbceDatabasePersistentIprAuthStore) {
    globalForIprAuthStore.__hbceDatabasePersistentIprAuthStore =
      new DatabasePersistentIprAuthStore(getProcessIprAuthStore());
  }

  return globalForIprAuthStore.__hbceDatabasePersistentIprAuthStore;
}

export function getExternalAdapterPlaceholderIprAuthStore(): ExternalAdapterPlaceholderIprAuthStore {
  if (!globalForIprAuthStore.__hbceExternalAdapterPlaceholderIprAuthStore) {
    globalForIprAuthStore.__hbceExternalAdapterPlaceholderIprAuthStore =
      new ExternalAdapterPlaceholderIprAuthStore();
  }

  return globalForIprAuthStore.__hbceExternalAdapterPlaceholderIprAuthStore;
}

export function createExternalIprAuthStoreAdapter(
  adapter: IprAuthStoreAdapter
): IprAuthStoreAdapter {
  const description = adapter.describe();

  if (description.kind !== "EXTERNAL_ADAPTER") {
    throw new Error("IPR_AUTH_EXTERNAL_ADAPTER_KIND_REQUIRED");
  }

  if (description.legalCertification !== false) {
    throw new Error("IPR_AUTH_EXTERNAL_ADAPTER_LEGAL_CERTIFICATION_FORBIDDEN");
  }

  if (!description.durable) {
    throw new Error("IPR_AUTH_EXTERNAL_ADAPTER_MUST_BE_DURABLE");
  }

  if (description.runtimeScoped) {
    throw new Error("IPR_AUTH_EXTERNAL_ADAPTER_MUST_NOT_BE_RUNTIME_SCOPED");
  }

  return adapter;
}

function getRequestedStoreKindFromEnv(): IprAuthStoreKind | null {
  const raw = process.env.IPR_AUTH_STORE_KIND;

  if (!raw) {
    return null;
  }

  const normalized = raw.trim().toUpperCase();

  if (
    normalized === "PROCESS_AUTH_STORE_MVP" ||
    normalized === "DATABASE_READY" ||
    normalized === "DATABASE_PERSISTENT" ||
    normalized === "EXTERNAL_ADAPTER"
  ) {
    return normalized;
  }

  return null;
}

export function selectIprAuthStore(kind: IprAuthStoreKind): IprAuthStoreAdapter {
  if (kind === "PROCESS_AUTH_STORE_MVP") {
    return getProcessIprAuthStore();
  }

  if (kind === "DATABASE_READY") {
    return getDatabaseReadyIprAuthStore();
  }

  if (kind === "DATABASE_PERSISTENT") {
    return getDatabasePersistentIprAuthStore();
  }

  return getExternalAdapterPlaceholderIprAuthStore();
}

export function getDefaultIprAuthStore(): IprAuthStoreAdapter {
  const requested = getRequestedStoreKindFromEnv();

  if (requested) {
    return selectIprAuthStore(requested);
  }

  if (isHbceDatabaseConfigured()) {
    return getDatabasePersistentIprAuthStore();
  }

  return getProcessIprAuthStore();
}

export function getSaasTargetIprAuthStore(): IprAuthStoreAdapter {
  return getDatabasePersistentIprAuthStore();
}

export function describeDefaultIprAuthStore(): IprAuthStoreDescription {
  return getDefaultIprAuthStore().describe();
}

export function describeProcessIprAuthStore(): IprAuthStoreDescription {
  return getProcessIprAuthStore().describe();
}

export function describeDatabaseReadyIprAuthStore(): IprAuthStoreDescription {
  return getDatabaseReadyIprAuthStore().describe();
}

export function describeDatabasePersistentIprAuthStore(): IprAuthStoreDescription {
  return getDatabasePersistentIprAuthStore().describe();
}

export function describeExternalAdapterPlaceholderIprAuthStore(): IprAuthStoreDescription {
  return getExternalAdapterPlaceholderIprAuthStore().describe();
}

export function describeSaasTargetIprAuthStore(): IprAuthStoreDescription {
  return getSaasTargetIprAuthStore().describe();
}

export function listIprAuthStoreDescriptions(): IprAuthStoreDescription[] {
  return [
    describeProcessIprAuthStore(),
    describeDatabaseReadyIprAuthStore(),
    describeDatabasePersistentIprAuthStore(),
    describeExternalAdapterPlaceholderIprAuthStore()
  ];
}

export function getPublicSessionFromStoredSession(
  session: IprAuthStoredSession
): PublicIprSession {
  return {
    sessionId: session.sessionId,
    humanIpr: session.humanIpr,
    runtimeIpr: session.runtimeIpr,
    status: session.status,
    createdAt: session.createdAt,
    expiresAt: session.expiresAt,
    revokedAt: session.revokedAt,
    lastSeenAt: session.lastSeenAt,
    deviceLabel: session.deviceLabel,
    legalCertification: false
  };
}

export function synchronizeIprAuthRecoveryProcessFallback(
  credential: IprAuthStoredCredential
): IprAuthRecoveryProcessFallbackSyncResult {
  if (
    credential.legalCertification !==
      false
  ) {
    throw new Error(
      "IPR_AUTH_RECOVERY_LEGAL_CERTIFICATION_BOUNDARY_VIOLATED"
    );
  }

  const humanIpr =
    normalizeHumanIpr(
      credential.humanIpr
    );

  if (!humanIpr) {
    throw new Error(
      "IPR_AUTH_RECOVERY_HUMAN_IPR_REQUIRED"
    );
  }

  if (
    credential.failedAttempts !==
      0 ||
    credential.lockedUntil !==
      null
  ) {
    throw new Error(
      "IPR_AUTH_RECOVERY_CREDENTIAL_STATE_INVALID"
    );
  }

  const store =
    getProcessIprAuthStore();

  store.replaceCredential({
    ...credential,
    humanIpr,
    failedAttempts:
      0,
    lockedUntil:
      null,
    legalCertification:
      false
  });

  const revokedSessions =
    store.revokeSubjectSessions(
      humanIpr
    );

  return {
    humanIpr,
    credentialReplaced:
      true,
    revokedSessions,
    databaseWritePerformed:
      false,
    sessionCreationAuthority:
      false,
    runtimeAuthorizationAuthority:
      false,
    legalCertification:
      false
  };
}


export function clearProcessIprAuthStore(): void {
  getProcessIprAuthStore().clear();
}
