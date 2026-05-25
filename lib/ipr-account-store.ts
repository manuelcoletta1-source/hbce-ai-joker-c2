import { createHash } from "node:crypto";

import {
  IPR_AUTH_DATABASE_REQUIREMENT,
  normalizeHumanIpr
} from "./ipr-auth";

export type IprAccountStoreKind =
  | "PROCESS_ACCOUNT_STORE_MVP"
  | "DATABASE_READY"
  | "DATABASE_PERSISTENT"
  | "EXTERNAL_ADAPTER";

export type IprAccountStoreStatus =
  | "AVAILABLE"
  | "NOT_CONFIGURED"
  | "DEGRADED";

export type IprAccountSubjectKind =
  | "BIOLOGICAL_SUBJECT"
  | "AI_RUNTIME"
  | "UNKNOWN"
  | string;

export type IprAccountCertificateStatus =
  | "ACTIVE"
  | "REVOKED"
  | "EXPIRED"
  | "SUSPENDED"
  | "UNKNOWN"
  | string;

export type IprAccountAccessDecision =
  | "ACCESS_GRANTED"
  | "ACCESS_DENIED"
  | "PENDING_SERVER_VALIDATION"
  | string;

export type IprAccountMatrixState =
  | "MATRIX_ACTIVE"
  | "MATRIX_LIMITED"
  | string;

export type IprAccountSemanticMemoryScope =
  | "IPR_BOUND"
  | "RUNTIME_ONLY"
  | string;

export type IprAccountIdentityBinding =
  | "IPR_VERIFIED_BIOLOGICAL_SUBJECT"
  | "NO_VERIFIED_BIOLOGICAL_SUBJECT"
  | "IPR_ACCOUNT_AUTHENTICATED"
  | string;

export type IprAccountProfileInput = {
  humanIpr: string;
  entity: string;
  subjectKind?: IprAccountSubjectKind;
  certificateId: string;
  certificateKind?: string;
  certificateStatus: IprAccountCertificateStatus;
  certificateScope: string[];
  cardSerial?: string | null;
  certificateHash?: string | null;
  accessDecision?: IprAccountAccessDecision;
  accessScope?: string;
  identityBinding?: IprAccountIdentityBinding;
  matrixState?: IprAccountMatrixState;
  semanticMemoryScope?: IprAccountSemanticMemoryScope;
  source?: string;
  handoffHash?: string | null;
  now?: string;
};

export type IprAccountProfile = {
  accountId: string;
  humanIpr: string;
  entity: string;
  subjectKind: IprAccountSubjectKind;
  certificateId: string;
  certificateKind: string;
  certificateStatus: IprAccountCertificateStatus;
  certificateScope: string[];
  cardSerial?: string;
  certificateHash?: string;
  accessDecision: IprAccountAccessDecision;
  accessScope: string;
  identityBinding: IprAccountIdentityBinding;
  matrixState: IprAccountMatrixState;
  semanticMemoryScope: IprAccountSemanticMemoryScope;
  source: string;
  handoffHash?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  profileHash: string;
};

export type PublicIprAccountProfile = Omit<
  IprAccountProfile,
  "certificateHash"
> & {
  certificateHash?: string;
  legalCertification: false;
};

export type IprAccountStoreDescription = {
  kind: IprAccountStoreKind;
  status: IprAccountStoreStatus;
  persistence: "PROCESS_MEMORY_ONLY" | "DATABASE_BACKED" | "EXTERNAL";
  accountCount: number;
  activeAccountCount: number;
  boundary: string;
};

export type IprAccountStoreAdapter = {
  kind: IprAccountStoreKind;
  getProfile(humanIpr: string): IprAccountProfile | null;
  upsertProfile(input: IprAccountProfileInput): IprAccountProfile;
  touchLogin(humanIpr: string, now?: string): IprAccountProfile | null;
  deleteProfile(humanIpr: string): void;
  listProfiles(): IprAccountProfile[];
  size(): number;
  clear(): void;
  describe(): IprAccountStoreDescription;
};

export const IPR_ACCOUNT_STORE_BOUNDARY =
  "The IPR account profile store preserves operational account metadata for JOKER-C2 access. It does not issue official identity, does not replace CIE, SPID, EUDI Wallet, passport, codice fiscale or eIDAS qualified trust services, and does not create legal certification.";

export const IPR_ACCOUNT_PROFILE_BOUNDARY =
  "An IPR account profile may restore JOKER-C2 operational identity only after server-side authentication and profile lookup. Client-side profile text is not authoritative.";

export const IPR_ACCOUNT_DATABASE_REQUIREMENT =
  "Persistent IPR account profiles require DATABASE_PERSISTENT storage before durable multi-device login, chat history restore, audit continuity, retention, deletion, recovery, revocation and production-grade reliance.";

const JOKER_C2_ACCESS_SCOPE = "JOKER_C2_ACCESS";

function nowIso(input?: string): string {
  return input && input.trim() ? input.trim() : new Date().toISOString();
}

function stableStringify(value: unknown): string {
  if (typeof value === "undefined") {
    return "null";
  }

  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  const record = value as Record<string, unknown>;

  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(",")}}`;
}

function sha256Hex(value: unknown): string {
  return createHash("sha256")
    .update(stableStringify(value), "utf8")
    .digest("hex")
    .toUpperCase();
}

function normalizeText(value: string, fallback = ""): string {
  const normalized = String(value || "").replace(/\s+/g, " ").trim();

  return normalized || fallback;
}

function normalizeScope(scope: string[]): string[] {
  const output: string[] = [];
  const seen = new Set<string>();

  for (const item of scope) {
    const normalized = normalizeText(item, "").toUpperCase();

    if (!normalized || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    output.push(normalized);
  }

  return output;
}

function ensureJokerAccessScope(scope: string[]): string[] {
  const normalized = normalizeScope(scope);

  if (!normalized.includes(JOKER_C2_ACCESS_SCOPE)) {
    normalized.push(JOKER_C2_ACCESS_SCOPE);
  }

  return normalized;
}

function buildAccountId(humanIpr: string): string {
  return `IPR-ACCOUNT-${sha256Hex(`HBCE_IPR_ACCOUNT:${humanIpr}`).slice(0, 24)}`;
}

function buildProfileHash(profile: Omit<IprAccountProfile, "profileHash">): string {
  return sha256Hex({
    accountId: profile.accountId,
    humanIpr: profile.humanIpr,
    entity: profile.entity,
    subjectKind: profile.subjectKind,
    certificateId: profile.certificateId,
    certificateKind: profile.certificateKind,
    certificateStatus: profile.certificateStatus,
    certificateScope: profile.certificateScope,
    cardSerial: profile.cardSerial,
    certificateHash: profile.certificateHash,
    accessDecision: profile.accessDecision,
    accessScope: profile.accessScope,
    identityBinding: profile.identityBinding,
    matrixState: profile.matrixState,
    semanticMemoryScope: profile.semanticMemoryScope,
    source: profile.source,
    handoffHash: profile.handoffHash,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
    lastLoginAt: profile.lastLoginAt
  });
}

function createProfileFromInput(
  input: IprAccountProfileInput,
  existing?: IprAccountProfile | null
): IprAccountProfile {
  const humanIpr = normalizeHumanIpr(input.humanIpr);
  const updatedAt = nowIso(input.now);
  const createdAt = existing?.createdAt || updatedAt;

  const withoutHash: Omit<IprAccountProfile, "profileHash"> = {
    accountId: existing?.accountId || buildAccountId(humanIpr),
    humanIpr,
    entity: normalizeText(input.entity, "VERIFIED_BIOLOGICAL_SUBJECT"),
    subjectKind: input.subjectKind || "BIOLOGICAL_SUBJECT",
    certificateId: normalizeText(input.certificateId, ""),
    certificateKind: normalizeText(input.certificateKind || "", "CERTIFICATE_09_OPERATIONAL"),
    certificateStatus: normalizeText(input.certificateStatus, "UNKNOWN").toUpperCase(),
    certificateScope: ensureJokerAccessScope(input.certificateScope || []),
    cardSerial: input.cardSerial ? normalizeText(input.cardSerial) : undefined,
    certificateHash: input.certificateHash ? normalizeText(input.certificateHash) : undefined,
    accessDecision: input.accessDecision || "ACCESS_GRANTED",
    accessScope: input.accessScope || JOKER_C2_ACCESS_SCOPE,
    identityBinding: input.identityBinding || "IPR_VERIFIED_BIOLOGICAL_SUBJECT",
    matrixState: input.matrixState || "MATRIX_ACTIVE",
    semanticMemoryScope: input.semanticMemoryScope || "IPR_BOUND",
    source: input.source || "HBCE_IPR_HANDOFF",
    handoffHash: input.handoffHash ? normalizeText(input.handoffHash) : undefined,
    createdAt,
    updatedAt,
    lastLoginAt: existing?.lastLoginAt
  };

  return {
    ...withoutHash,
    profileHash: buildProfileHash(withoutHash)
  };
}

function isActiveProfile(profile: IprAccountProfile): boolean {
  return (
    profile.certificateStatus === "ACTIVE" &&
    profile.accessDecision === "ACCESS_GRANTED" &&
    profile.certificateScope.includes(JOKER_C2_ACCESS_SCOPE)
  );
}

class ProcessIprAccountStore implements IprAccountStoreAdapter {
  public readonly kind: IprAccountStoreKind = "PROCESS_ACCOUNT_STORE_MVP";

  private readonly profiles = new Map<string, IprAccountProfile>();

  getProfile(humanIpr: string): IprAccountProfile | null {
    const normalized = normalizeHumanIpr(humanIpr);

    return this.profiles.get(normalized) || null;
  }

  upsertProfile(input: IprAccountProfileInput): IprAccountProfile {
    const humanIpr = normalizeHumanIpr(input.humanIpr);
    const existing = this.getProfile(humanIpr);
    const profile = createProfileFromInput(input, existing);

    this.profiles.set(humanIpr, profile);

    return profile;
  }

  touchLogin(humanIpr: string, now?: string): IprAccountProfile | null {
    const normalized = normalizeHumanIpr(humanIpr);
    const existing = this.getProfile(normalized);

    if (!existing) {
      return null;
    }

    const updatedAt = nowIso(now);
    const withoutHash: Omit<IprAccountProfile, "profileHash"> = {
      ...existing,
      updatedAt,
      lastLoginAt: updatedAt
    };

    const updated: IprAccountProfile = {
      ...withoutHash,
      profileHash: buildProfileHash(withoutHash)
    };

    this.profiles.set(normalized, updated);

    return updated;
  }

  deleteProfile(humanIpr: string): void {
    const normalized = normalizeHumanIpr(humanIpr);

    this.profiles.delete(normalized);
  }

  listProfiles(): IprAccountProfile[] {
    return Array.from(this.profiles.values()).sort((left, right) =>
      right.updatedAt.localeCompare(left.updatedAt)
    );
  }

  size(): number {
    return this.profiles.size;
  }

  clear(): void {
    this.profiles.clear();
  }

  describe(): IprAccountStoreDescription {
    const profiles = this.listProfiles();

    return {
      kind: this.kind,
      status: "AVAILABLE",
      persistence: "PROCESS_MEMORY_ONLY",
      accountCount: profiles.length,
      activeAccountCount: profiles.filter((profile) => isActiveProfile(profile)).length,
      boundary:
        `${IPR_ACCOUNT_STORE_BOUNDARY} ${IPR_ACCOUNT_PROFILE_BOUNDARY} ${IPR_ACCOUNT_DATABASE_REQUIREMENT} ${IPR_AUTH_DATABASE_REQUIREMENT}`
    };
  }
}

class DatabaseReadyIprAccountStore implements IprAccountStoreAdapter {
  public readonly kind: IprAccountStoreKind = "DATABASE_READY";

  private readonly processFallback = new ProcessIprAccountStore();

  getProfile(humanIpr: string): IprAccountProfile | null {
    return this.processFallback.getProfile(humanIpr);
  }

  upsertProfile(input: IprAccountProfileInput): IprAccountProfile {
    return this.processFallback.upsertProfile(input);
  }

  touchLogin(humanIpr: string, now?: string): IprAccountProfile | null {
    return this.processFallback.touchLogin(humanIpr, now);
  }

  deleteProfile(humanIpr: string): void {
    this.processFallback.deleteProfile(humanIpr);
  }

  listProfiles(): IprAccountProfile[] {
    return this.processFallback.listProfiles();
  }

  size(): number {
    return this.processFallback.size();
  }

  clear(): void {
    this.processFallback.clear();
  }

  describe(): IprAccountStoreDescription {
    const fallback = this.processFallback.describe();

    return {
      ...fallback,
      kind: this.kind,
      status: "DEGRADED",
      persistence: "PROCESS_MEMORY_ONLY",
      boundary:
        "DATABASE_READY account store is a placeholder adapter. It currently falls back to process memory until a real persistent database driver is connected. " +
        IPR_ACCOUNT_STORE_BOUNDARY +
        " " +
        IPR_ACCOUNT_PROFILE_BOUNDARY +
        " " +
        IPR_ACCOUNT_DATABASE_REQUIREMENT
    };
  }
}

const processIprAccountStore = new ProcessIprAccountStore();
const databaseReadyIprAccountStore = new DatabaseReadyIprAccountStore();

export function getProcessIprAccountStore(): IprAccountStoreAdapter {
  return processIprAccountStore;
}

export function getDatabaseReadyIprAccountStore(): IprAccountStoreAdapter {
  return databaseReadyIprAccountStore;
}

export function getDefaultIprAccountStore(): IprAccountStoreAdapter {
  const preferred = process.env.IPR_ACCOUNT_STORE_KIND?.trim().toUpperCase();

  if (preferred === "DATABASE_READY") {
    return databaseReadyIprAccountStore;
  }

  return processIprAccountStore;
}

export function describeDefaultIprAccountStore(): IprAccountStoreDescription {
  return getDefaultIprAccountStore().describe();
}

export function toPublicIprAccountProfile(
  profile: IprAccountProfile
): PublicIprAccountProfile {
  return {
    ...profile,
    legalCertification: false
  };
}

export function toIprHandoffPayloadFromAccountProfile(
  profile: IprAccountProfile
): Record<string, unknown> {
  return {
    handoff_type: "HBCE_IPR_HANDOFF",
    source: "IPR_ACCOUNT_STORE",
    subject: {
      entity: profile.entity,
      ipr: profile.humanIpr,
      kind: profile.subjectKind
    },
    certificate: {
      certificate_id: profile.certificateId,
      certificate_kind: profile.certificateKind,
      certificate_status: profile.certificateStatus,
      certificate_scope: profile.certificateScope,
      card_serial: profile.cardSerial,
      certificate_hash: profile.certificateHash
    },
    access: {
      decision: profile.accessDecision,
      scope: profile.accessScope,
      identity_binding: profile.identityBinding
    },
    matrix: {
      state: profile.matrixState
    },
    memory: {
      semantic_memory_scope: profile.semanticMemoryScope
    },
    account: {
      account_id: profile.accountId,
      profile_hash: profile.profileHash,
      source: profile.source,
      handoff_hash: profile.handoffHash || null
    },
    legalCertification: false
  };
}

export function clearProcessIprAccountStore(): void {
  processIprAccountStore.clear();
}
