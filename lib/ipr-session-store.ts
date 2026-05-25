import {
  IPR_AUTH_DATABASE_REQUIREMENT,
  hashIprSessionToken,
  isIprSessionExpired,
  normalizeHumanIpr
} from "./ipr-auth";

import type {
  IprAuthCredentialRecord,
  IprAuthPublicSession,
  IprAuthSessionToken
} from "./ipr-auth";

export type IprAuthStoreKind =
  | "PROCESS_AUTH_STORE_MVP"
  | "DATABASE_READY"
  | "DATABASE_PERSISTENT"
  | "EXTERNAL_ADAPTER";

export type IprAuthStoreStatus =
  | "AVAILABLE"
  | "NOT_CONFIGURED"
  | "DEGRADED";

export type IprAuthStoreDescription = {
  kind: IprAuthStoreKind;
  status: IprAuthStoreStatus;
  persistence: "PROCESS_MEMORY_ONLY" | "DATABASE_BACKED" | "EXTERNAL";
  credentialCount: number;
  activeSessionCount: number;
  revokedSessionCount: number;
  expiredSessionCount: number;
  boundary: string;
};

export type IprAuthStoredSession = {
  sessionId: string;
  humanIpr: string;
  runtimeIpr: string;
  tokenHash: string;
  issuedAt: string;
  expiresAt: string;
  ttlSeconds: number;
  createdAt: string;
  updatedAt: string;
  revokedAt?: string;
  deviceLabel?: string;
  userAgentHash?: string;
};

export type IprSessionCreateInput = {
  token: IprAuthSessionToken;
  deviceLabel?: string;
  userAgentHash?: string;
  now?: string;
};

export type IprSessionLookupResult = {
  ok: boolean;
  reason:
    | "SESSION_ACTIVE"
    | "SESSION_NOT_FOUND"
    | "SESSION_REVOKED"
    | "SESSION_EXPIRED";
  session: IprAuthStoredSession | null;
};

export type IprAuthStoreAdapter = {
  kind: IprAuthStoreKind;
  getCredential(humanIpr: string): IprAuthCredentialRecord | null;
  setCredential(credential: IprAuthCredentialRecord): void;
  deleteCredential(humanIpr: string): void;
  createSession(input: IprSessionCreateInput): IprAuthStoredSession;
  getSessionById(sessionId: string): IprAuthStoredSession | null;
  getSessionByTokenHash(tokenHash: string): IprAuthStoredSession | null;
  verifySessionToken(token: string): IprSessionLookupResult;
  listSessionsByHumanIpr(humanIpr: string): IprAuthStoredSession[];
  revokeSession(sessionId: string, now?: string): IprAuthStoredSession | null;
  revokeAllSessionsForHumanIpr(humanIpr: string, now?: string): number;
  cleanupExpiredSessions(now?: string): number;
  size(): {
    credentials: number;
    sessions: number;
  };
  clear(): void;
  describe(): IprAuthStoreDescription;
};

export const IPR_AUTH_STORE_BOUNDARY =
  "The current IPR auth store may run as PROCESS_AUTH_STORE_MVP for R&D only. Production-grade JOKER-C2 access requires DATABASE_PERSISTENT storage, session revocation, audit logging, retention policy, device management and recovery workflow.";

function nowIso(input?: string): string {
  return input && input.trim() ? input.trim() : new Date().toISOString();
}

function normalizeSessionId(value: string): string {
  return value.trim().toUpperCase();
}

function toPublicSession(session: IprAuthStoredSession): IprAuthPublicSession {
  return {
    sessionId: session.sessionId,
    humanIpr: session.humanIpr,
    runtimeIpr: session.runtimeIpr,
    issuedAt: session.issuedAt,
    expiresAt: session.expiresAt,
    ttlSeconds: session.ttlSeconds
  };
}

function isStoredSessionExpired(session: IprAuthStoredSession): boolean {
  return isIprSessionExpired({
    expiresAt: session.expiresAt
  });
}

class ProcessIprAuthStore implements IprAuthStoreAdapter {
  public readonly kind: IprAuthStoreKind = "PROCESS_AUTH_STORE_MVP";

  private readonly credentials = new Map<string, IprAuthCredentialRecord>();

  private readonly sessionsById = new Map<string, IprAuthStoredSession>();

  private readonly sessionIdByTokenHash = new Map<string, string>();

  getCredential(humanIpr: string): IprAuthCredentialRecord | null {
    const normalized = normalizeHumanIpr(humanIpr);

    return this.credentials.get(normalized) ?? null;
  }

  setCredential(credential: IprAuthCredentialRecord): void {
    const humanIpr = normalizeHumanIpr(credential.humanIpr);

    this.credentials.set(humanIpr, {
      ...credential,
      humanIpr
    });
  }

  deleteCredential(humanIpr: string): void {
    const normalized = normalizeHumanIpr(humanIpr);

    this.credentials.delete(normalized);
    this.revokeAllSessionsForHumanIpr(normalized);
  }

  createSession(input: IprSessionCreateInput): IprAuthStoredSession {
    const createdAt = nowIso(input.now);
    const session: IprAuthStoredSession = {
      sessionId: normalizeSessionId(input.token.sessionId),
      humanIpr: normalizeHumanIpr(input.token.humanIpr),
      runtimeIpr: input.token.runtimeIpr.trim().toUpperCase(),
      tokenHash: input.token.tokenHash,
      issuedAt: input.token.issuedAt,
      expiresAt: input.token.expiresAt,
      ttlSeconds: input.token.ttlSeconds,
      createdAt,
      updatedAt: createdAt,
      deviceLabel: input.deviceLabel,
      userAgentHash: input.userAgentHash
    };

    this.sessionsById.set(session.sessionId, session);
    this.sessionIdByTokenHash.set(session.tokenHash, session.sessionId);

    return session;
  }

  getSessionById(sessionId: string): IprAuthStoredSession | null {
    return this.sessionsById.get(normalizeSessionId(sessionId)) ?? null;
  }

  getSessionByTokenHash(tokenHash: string): IprAuthStoredSession | null {
    const sessionId = this.sessionIdByTokenHash.get(tokenHash);

    if (!sessionId) {
      return null;
    }

    return this.getSessionById(sessionId);
  }

  verifySessionToken(token: string): IprSessionLookupResult {
    const tokenHash = hashIprSessionToken(token);
    const session = this.getSessionByTokenHash(tokenHash);

    if (!session) {
      return {
        ok: false,
        reason: "SESSION_NOT_FOUND",
        session: null
      };
    }

    if (session.revokedAt) {
      return {
        ok: false,
        reason: "SESSION_REVOKED",
        session
      };
    }

    if (isStoredSessionExpired(session)) {
      return {
        ok: false,
        reason: "SESSION_EXPIRED",
        session
      };
    }

    return {
      ok: true,
      reason: "SESSION_ACTIVE",
      session
    };
  }

  listSessionsByHumanIpr(humanIpr: string): IprAuthStoredSession[] {
    const normalized = normalizeHumanIpr(humanIpr);

    return Array.from(this.sessionsById.values())
      .filter((session) => session.humanIpr === normalized)
      .sort((left, right) => right.issuedAt.localeCompare(left.issuedAt));
  }

  revokeSession(sessionId: string, now?: string): IprAuthStoredSession | null {
    const normalized = normalizeSessionId(sessionId);
    const existing = this.sessionsById.get(normalized);

    if (!existing) {
      return null;
    }

    const revokedAt = nowIso(now);
    const updated: IprAuthStoredSession = {
      ...existing,
      revokedAt,
      updatedAt: revokedAt
    };

    this.sessionsById.set(normalized, updated);

    return updated;
  }

  revokeAllSessionsForHumanIpr(humanIpr: string, now?: string): number {
    const normalized = normalizeHumanIpr(humanIpr);
    const revokedAt = nowIso(now);
    let count = 0;

    for (const session of this.sessionsById.values()) {
      if (session.humanIpr !== normalized || session.revokedAt) {
        continue;
      }

      this.sessionsById.set(session.sessionId, {
        ...session,
        revokedAt,
        updatedAt: revokedAt
      });

      count += 1;
    }

    return count;
  }

  cleanupExpiredSessions(now?: string): number {
    const referenceTime = new Date(nowIso(now)).getTime();
    let count = 0;

    for (const session of this.sessionsById.values()) {
      const expired = new Date(session.expiresAt).getTime() <= referenceTime;

      if (!expired) {
        continue;
      }

      this.sessionsById.delete(session.sessionId);
      this.sessionIdByTokenHash.delete(session.tokenHash);
      count += 1;
    }

    return count;
  }

  size(): { credentials: number; sessions: number } {
    return {
      credentials: this.credentials.size,
      sessions: this.sessionsById.size
    };
  }

  clear(): void {
    this.credentials.clear();
    this.sessionsById.clear();
    this.sessionIdByTokenHash.clear();
  }

  describe(): IprAuthStoreDescription {
    const sessions = Array.from(this.sessionsById.values());
    const activeSessionCount = sessions.filter(
      (session) => !session.revokedAt && !isStoredSessionExpired(session)
    ).length;
    const revokedSessionCount = sessions.filter((session) => Boolean(session.revokedAt)).length;
    const expiredSessionCount = sessions.filter((session) => isStoredSessionExpired(session)).length;

    return {
      kind: this.kind,
      status: "AVAILABLE",
      persistence: "PROCESS_MEMORY_ONLY",
      credentialCount: this.credentials.size,
      activeSessionCount,
      revokedSessionCount,
      expiredSessionCount,
      boundary: `${IPR_AUTH_STORE_BOUNDARY} ${IPR_AUTH_DATABASE_REQUIREMENT}`
    };
  }
}

class DatabaseReadyIprAuthStore implements IprAuthStoreAdapter {
  public readonly kind: IprAuthStoreKind = "DATABASE_READY";

  private readonly processFallback = new ProcessIprAuthStore();

  getCredential(humanIpr: string): IprAuthCredentialRecord | null {
    return this.processFallback.getCredential(humanIpr);
  }

  setCredential(credential: IprAuthCredentialRecord): void {
    this.processFallback.setCredential(credential);
  }

  deleteCredential(humanIpr: string): void {
    this.processFallback.deleteCredential(humanIpr);
  }

  createSession(input: IprSessionCreateInput): IprAuthStoredSession {
    return this.processFallback.createSession(input);
  }

  getSessionById(sessionId: string): IprAuthStoredSession | null {
    return this.processFallback.getSessionById(sessionId);
  }

  getSessionByTokenHash(tokenHash: string): IprAuthStoredSession | null {
    return this.processFallback.getSessionByTokenHash(tokenHash);
  }

  verifySessionToken(token: string): IprSessionLookupResult {
    return this.processFallback.verifySessionToken(token);
  }

  listSessionsByHumanIpr(humanIpr: string): IprAuthStoredSession[] {
    return this.processFallback.listSessionsByHumanIpr(humanIpr);
  }

  revokeSession(sessionId: string, now?: string): IprAuthStoredSession | null {
    return this.processFallback.revokeSession(sessionId, now);
  }

  revokeAllSessionsForHumanIpr(humanIpr: string, now?: string): number {
    return this.processFallback.revokeAllSessionsForHumanIpr(humanIpr, now);
  }

  cleanupExpiredSessions(now?: string): number {
    return this.processFallback.cleanupExpiredSessions(now);
  }

  size(): { credentials: number; sessions: number } {
    return this.processFallback.size();
  }

  clear(): void {
    this.processFallback.clear();
  }

  describe(): IprAuthStoreDescription {
    const fallback = this.processFallback.describe();

    return {
      ...fallback,
      kind: this.kind,
      status: "DEGRADED",
      persistence: "PROCESS_MEMORY_ONLY",
      boundary:
        "DATABASE_READY auth store is a placeholder adapter. It currently falls back to process memory until a real persistent database driver is connected. " +
        IPR_AUTH_STORE_BOUNDARY +
        " " +
        IPR_AUTH_DATABASE_REQUIREMENT
    };
  }
}

const processAuthStore = new ProcessIprAuthStore();
const databaseReadyAuthStore = new DatabaseReadyIprAuthStore();

export function getProcessIprAuthStore(): IprAuthStoreAdapter {
  return processAuthStore;
}

export function getDatabaseReadyIprAuthStore(): IprAuthStoreAdapter {
  return databaseReadyAuthStore;
}

export function getDefaultIprAuthStore(): IprAuthStoreAdapter {
  const preferred = process.env.IPR_AUTH_STORE_KIND?.trim().toUpperCase();

  if (preferred === "DATABASE_READY") {
    return databaseReadyAuthStore;
  }

  return processAuthStore;
}

export function describeDefaultIprAuthStore(): IprAuthStoreDescription {
  return getDefaultIprAuthStore().describe();
}

export function getPublicSessionFromStoredSession(
  session: IprAuthStoredSession
): IprAuthPublicSession {
  return toPublicSession(session);
}

export function clearProcessIprAuthStore(): void {
  processAuthStore.clear();
}
