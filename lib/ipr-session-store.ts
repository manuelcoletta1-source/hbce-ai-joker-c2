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

export type IprAuthStoreDescription = {
  kind: IprAuthStoreKind;
  status: IprAuthStoreStatus;
  configured: boolean;
  available: boolean;
  persistenceMode: IprAuthStoreKind;
  databaseConfigured: boolean;
  databaseDescription?: ReturnType<typeof describeDefaultHbceDatabase>;
  sessionBoundary: string;
  databaseRequirement: string;
  legalCertification: false;
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

export const IPR_AUTH_STORE_BOUNDARY =
  "The current IPR auth store may run as PROCESS_AUTH_STORE_MVP for R&D only. Production-grade JOKER-C2 access requires DATABASE_PERSISTENT storage, session revocation, audit logging, retention policy, device management and recovery workflow.";

export const IPR_AUTH_DATABASE_PERSISTENT_BOUNDARY =
  "DATABASE_PERSISTENT IPR auth stores password hashes, session token hashes and operational session metadata in HBCE Postgres storage. It does not store plaintext passwords or plaintext session tokens, does not issue official identity and does not create legal certification.";

function nowIso(): string {
  return new Date().toISOString();
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
    status: row.status,
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

function buildDescription(
  kind: IprAuthStoreKind,
  status: IprAuthStoreStatus,
  configured: boolean,
  available: boolean
): IprAuthStoreDescription {
  const databaseConfigured = isHbceDatabaseConfigured();

  return {
    kind,
    status,
    configured,
    available,
    persistenceMode: kind,
    databaseConfigured,
    databaseDescription: databaseConfigured
      ? describeDefaultHbceDatabase()
      : undefined,
    sessionBoundary:
      kind === "DATABASE_PERSISTENT"
        ? IPR_AUTH_DATABASE_PERSISTENT_BOUNDARY
        : IPR_AUTH_STORE_BOUNDARY,
    databaseRequirement: IPR_AUTH_DATABASE_REQUIREMENT,
    legalCertification: false
  };
}

class ProcessIprAuthStore implements IprAuthStoreAdapter {
  private readonly credentials = new Map<string, IprAuthStoredCredential>();
  private readonly sessions = new Map<string, IprAuthStoredSession>();

  describe(): IprAuthStoreDescription {
    return buildDescription(
      "PROCESS_AUTH_STORE_MVP",
      "AVAILABLE",
      true,
      true
    );
  }

  getCredential(humanIpr: string): IprAuthStoredCredential | null {
    return this.credentials.get(normalizeHumanIpr(humanIpr)) || null;
  }

  setCredential(input: IprAuthCredentialCreateInput): IprAuthStoredCredential {
    const credential = buildStoredCredential(input);
    this.credentials.set(credential.humanIpr, credential);

    return credential;
  }

  createSession(input: IprSessionCreateInput): IprAuthStoredSession {
    const session = buildStoredSession(input);
    this.sessions.set(session.sessionId, session);

    return session;
  }

  verifySessionToken(token: string): IprSessionLookupResult {
    const tokenHash = hashIprSessionToken(token);
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
    const session = this.sessions.get(sessionId);

    if (!session) {
      return null;
    }

    const revokedSession: IprAuthStoredSession = {
      ...session,
      status: "REVOKED",
      revokedAt: nowIso()
    };

    this.sessions.set(sessionId, revokedSession);

    return revokedSession;
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

class DatabasePersistentIprAuthStore implements IprAuthStoreAdapter {
  private readonly processFallback: ProcessIprAuthStore;

  constructor(processFallback: ProcessIprAuthStore) {
    this.processFallback = processFallback;
  }

  describe(): IprAuthStoreDescription {
    if (!isHbceDatabaseConfigured()) {
      return buildDescription(
        "DATABASE_PERSISTENT",
        "NOT_CONFIGURED",
        false,
        false
      );
    }

    return buildDescription(
      "DATABASE_PERSISTENT",
      "AVAILABLE",
      true,
      true
    );
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

  private async upsertSubject(humanIpr: string): Promise<void> {
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

  async createSessionAsync(
    input: IprSessionCreateInput
  ): Promise<IprAuthStoredSession> {
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
    this.processFallback.createSession(storedSession);

    return storedSession;
  }

  async verifySessionTokenAsync(
    token: string
  ): Promise<IprSessionLookupResult> {
    const tokenHash = hashIprSessionToken(token);

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
      return {
        ok: false,
        authenticated: false,
        reason: "SESSION_NOT_FOUND",
        session: null
      };
    }

    const session = sessionFromRow(result.rows[0]);

    if (session.status === "REVOKED" || session.revokedAt) {
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

    return {
      ok: true,
      authenticated: true,
      reason: "SESSION_ACTIVE",
      session: refreshedSession || session
    };
  }

  private async touchSession(
    sessionId: string
  ): Promise<IprAuthStoredSession | null> {
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
      [sessionId]
    );

    if (!result.ok || !result.rows[0]) {
      return null;
    }

    return sessionFromRow(result.rows[0]);
  }

  private async markSessionExpired(
    session: IprAuthStoredSession
  ): Promise<IprAuthStoredSession> {
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

    return sessionFromRow(result.rows[0]);
  }

  async revokeSessionAsync(
    sessionId: string
  ): Promise<IprAuthStoredSession | null> {
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
      [sessionId]
    );

    if (!result.ok || !result.rows[0]) {
      return null;
    }

    return sessionFromRow(result.rows[0]);
  }
}

class DatabaseReadyIprAuthStore implements IprAuthStoreAdapter {
  private readonly processFallback: ProcessIprAuthStore;

  constructor(processFallback: ProcessIprAuthStore) {
    this.processFallback = processFallback;
  }

  describe(): IprAuthStoreDescription {
    return buildDescription(
      "DATABASE_READY",
      "DEGRADED",
      true,
      true
    );
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

const globalForIprAuthStore = globalThis as typeof globalThis & {
  __hbceProcessIprAuthStore?: ProcessIprAuthStore;
  __hbceDatabaseReadyIprAuthStore?: DatabaseReadyIprAuthStore;
  __hbceDatabasePersistentIprAuthStore?: DatabasePersistentIprAuthStore;
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

export function getDefaultIprAuthStore(): IprAuthStoreAdapter {
  const requested = getRequestedStoreKindFromEnv();

  if (requested === "PROCESS_AUTH_STORE_MVP") {
    return getProcessIprAuthStore();
  }

  if (requested === "DATABASE_READY") {
    return getDatabaseReadyIprAuthStore();
  }

  if (requested === "DATABASE_PERSISTENT") {
    return getDatabasePersistentIprAuthStore();
  }

  if (isHbceDatabaseConfigured()) {
    return getDatabasePersistentIprAuthStore();
  }

  return getProcessIprAuthStore();
}

export function describeDefaultIprAuthStore(): IprAuthStoreDescription {
  return getDefaultIprAuthStore().describe();
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

export function clearProcessIprAuthStore(): void {
  getProcessIprAuthStore().clear();
}
