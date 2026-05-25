import { createHash } from "node:crypto";

import { normalizeHumanIpr } from "./ipr-auth";

import {
  describeDefaultHbceDatabase,
  isHbceDatabaseConfigured,
  queryHbceDatabase
} from "./ipr-database";

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

export type IprAccountProfile = {
  humanIpr: string;
  accountId: string;
  entity: string;
  subjectKind: IprAccountSubjectKind;
  certificateId: string;
  certificateKind: string;
  certificateStatus: IprAccountCertificateStatus;
  certificateScope: string[];
  cardSerial: string | null;
  certificateHash: string | null;
  accessDecision: IprAccountAccessDecision;
  accessScope: string;
  identityBinding: IprAccountIdentityBinding;
  matrixState: IprAccountMatrixState;
  semanticMemoryScope: IprAccountSemanticMemoryScope;
  source: string;
  handoffHash: string | null;
  profileHash: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
  profilePayload: Record<string, unknown>;
  legalCertification: false;
};

export type PublicIprAccountProfile = {
  humanIpr: string;
  accountId: string;
  entity: string;
  subjectKind: IprAccountSubjectKind;
  certificateId: string;
  certificateKind: string;
  certificateStatus: IprAccountCertificateStatus;
  certificateScope: string[];
  cardSerial: string | null;
  certificateHash: string | null;
  accessDecision: IprAccountAccessDecision;
  accessScope: string;
  identityBinding: IprAccountIdentityBinding;
  matrixState: IprAccountMatrixState;
  semanticMemoryScope: IprAccountSemanticMemoryScope;
  source: string;
  handoffHash: string | null;
  profileHash: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
  legalCertification: false;
};

export type IprAccountProfileUpsertInput = {
  humanIpr: string;
  accountId?: string;
  entity?: string;
  subjectKind?: IprAccountSubjectKind;
  certificateId: string;
  certificateKind?: string;
  certificateStatus?: IprAccountCertificateStatus;
  certificateScope?: string[];
  cardSerial?: string | null;
  certificateHash?: string | null;
  accessDecision?: IprAccountAccessDecision;
  accessScope?: string;
  identityBinding?: IprAccountIdentityBinding;
  matrixState?: IprAccountMatrixState;
  semanticMemoryScope?: IprAccountSemanticMemoryScope;
  source?: string;
  handoffHash?: string | null;
  profilePayload?: Record<string, unknown>;
};

export type IprAccountStoreDescription = {
  kind: IprAccountStoreKind;
  status: IprAccountStoreStatus;
  configured: boolean;
  available: boolean;
  persistenceMode: IprAccountStoreKind;
  databaseConfigured: boolean;
  databaseDescription?: ReturnType<typeof describeDefaultHbceDatabase>;
  accountBoundary: string;
  profileBoundary: string;
  databaseRequirement: string;
  legalCertification: false;
};

export type IprAccountStoreAdapter = {
  describe(): IprAccountStoreDescription;

  getProfile(humanIpr: string): IprAccountProfile | null;
  upsertProfile(input: IprAccountProfileUpsertInput): IprAccountProfile;
  touchLogin(humanIpr: string): IprAccountProfile | null;

  getProfileAsync(humanIpr: string): Promise<IprAccountProfile | null>;
  upsertProfileAsync(
    input: IprAccountProfileUpsertInput
  ): Promise<IprAccountProfile>;
  touchLoginAsync(humanIpr: string): Promise<IprAccountProfile | null>;
};

type IprAccountProfileRow = {
  human_ipr: string;
  account_id: string;
  entity: string;
  subject_kind: string;
  certificate_id: string;
  certificate_kind: string;
  certificate_status: string;
  certificate_scope: unknown;
  card_serial: string | null;
  certificate_hash: string | null;
  access_decision: string;
  access_scope: string;
  identity_binding: string;
  matrix_state: string;
  semantic_memory_scope: string;
  source: string;
  handoff_hash: string | null;
  profile_hash: string | null;
  created_at: string | Date;
  updated_at: string | Date;
  last_login_at: string | Date | null;
  profile_payload: unknown;
  legal_certification: boolean;
};

const DEFAULT_CERTIFICATE_KIND = "CERTIFICATE_09_OPERATIONAL";
const DEFAULT_ACCESS_SCOPE = "JOKER_C2_ACCESS";

export const IPR_ACCOUNT_STORE_BOUNDARY =
  "The IPR account profile store preserves operational account metadata for JOKER-C2 access. It does not issue official identity, does not replace CIE, SPID, EUDI Wallet, passport, codice fiscale or eIDAS qualified trust services, and does not create legal certification.";

export const IPR_ACCOUNT_PROFILE_BOUNDARY =
  "An IPR account profile may restore JOKER-C2 operational identity only after server-side authentication and profile lookup. Client-side profile text is not authoritative.";

export const IPR_ACCOUNT_DATABASE_REQUIREMENT =
  "Persistent IPR account profiles require DATABASE_PERSISTENT storage before durable multi-device login, chat history restore, audit continuity, retention, deletion, recovery, revocation and production-grade reliance.";

export const IPR_ACCOUNT_DATABASE_PERSISTENT_BOUNDARY =
  "DATABASE_PERSISTENT IPR account profiles preserve the operational identity metadata needed to reconstruct the JOKER-C2 IPR handoff server-side. They do not create public authority validation, legal certification or official identity issuance.";

function nowIso(): string {
  return new Date().toISOString();
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

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean);
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);

      if (Array.isArray(parsed)) {
        return toStringArray(parsed);
      }
    } catch {
      return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  return [];
}

function jsonParam(value: unknown): string {
  return JSON.stringify(value ?? {});
}

function hashJson(value: unknown): string {
  return `sha256:${createHash("sha256")
    .update(JSON.stringify(value))
    .digest("hex")}`;
}

function buildAccountId(humanIpr: string): string {
  const digest = createHash("sha256")
    .update(normalizeHumanIpr(humanIpr))
    .digest("hex")
    .slice(0, 24)
    .toUpperCase();

  return `IPR-ACCOUNT-${digest}`;
}

function buildEntityLabel(humanIpr: string): string {
  return `HBCE IPR Subject ${normalizeHumanIpr(humanIpr)}`;
}

function normalizeCertificateScope(value: string[] | undefined): string[] {
  const scope = Array.isArray(value) ? value.filter(Boolean) : [];

  return scope.length > 0 ? scope : [DEFAULT_ACCESS_SCOPE];
}

function buildProfile(input: IprAccountProfileUpsertInput): IprAccountProfile {
  const humanIpr = normalizeHumanIpr(input.humanIpr);
  const timestamp = nowIso();
  const certificateScope = normalizeCertificateScope(input.certificateScope);

  const profilePayload = {
    ...(input.profilePayload || {}),
    legalCertification: false
  };

  const profileBase = {
    humanIpr,
    accountId: input.accountId || buildAccountId(humanIpr),
    entity: input.entity || buildEntityLabel(humanIpr),
    subjectKind: input.subjectKind || "BIOLOGICAL_SUBJECT",
    certificateId: input.certificateId,
    certificateKind: input.certificateKind || DEFAULT_CERTIFICATE_KIND,
    certificateStatus: input.certificateStatus || "ACTIVE",
    certificateScope,
    cardSerial: input.cardSerial || null,
    certificateHash: input.certificateHash || null,
    accessDecision: input.accessDecision || "ACCESS_GRANTED",
    accessScope: input.accessScope || DEFAULT_ACCESS_SCOPE,
    identityBinding:
      input.identityBinding || "IPR_VERIFIED_BIOLOGICAL_SUBJECT",
    matrixState: input.matrixState || "MATRIX_ACTIVE",
    semanticMemoryScope: input.semanticMemoryScope || "IPR_BOUND",
    source: input.source || "HBCE_IPR_HANDOFF",
    handoffHash: input.handoffHash || null,
    profilePayload
  };

  const profileHash = hashJson(profileBase);

  return {
    ...profileBase,
    profileHash,
    createdAt: timestamp,
    updatedAt: timestamp,
    lastLoginAt: null,
    legalCertification: false
  };
}

function profileFromRow(row: IprAccountProfileRow): IprAccountProfile {
  const fallbackHash = hashJson({
    humanIpr: row.human_ipr,
    accountId: row.account_id,
    certificateId: row.certificate_id,
    source: row.source
  });

  return {
    humanIpr: row.human_ipr,
    accountId: row.account_id,
    entity: row.entity,
    subjectKind: row.subject_kind,
    certificateId: row.certificate_id,
    certificateKind: row.certificate_kind,
    certificateStatus: row.certificate_status,
    certificateScope: toStringArray(row.certificate_scope),
    cardSerial: row.card_serial || null,
    certificateHash: row.certificate_hash || null,
    accessDecision: row.access_decision,
    accessScope: row.access_scope,
    identityBinding: row.identity_binding,
    matrixState: row.matrix_state,
    semanticMemoryScope: row.semantic_memory_scope,
    source: row.source,
    handoffHash: row.handoff_hash || null,
    profileHash: row.profile_hash || fallbackHash,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
    lastLoginAt: toIsoOrNull(row.last_login_at),
    profilePayload: toJsonRecord(row.profile_payload),
    legalCertification: false
  };
}

function buildDescription(
  kind: IprAccountStoreKind,
  status: IprAccountStoreStatus,
  configured: boolean,
  available: boolean
): IprAccountStoreDescription {
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
    accountBoundary:
      kind === "DATABASE_PERSISTENT"
        ? IPR_ACCOUNT_DATABASE_PERSISTENT_BOUNDARY
        : IPR_ACCOUNT_STORE_BOUNDARY,
    profileBoundary: IPR_ACCOUNT_PROFILE_BOUNDARY,
    databaseRequirement: IPR_ACCOUNT_DATABASE_REQUIREMENT,
    legalCertification: false
  };
}

class ProcessIprAccountStore implements IprAccountStoreAdapter {
  private readonly profiles = new Map<string, IprAccountProfile>();

  describe(): IprAccountStoreDescription {
    return buildDescription(
      "PROCESS_ACCOUNT_STORE_MVP",
      "AVAILABLE",
      true,
      true
    );
  }

  getProfile(humanIpr: string): IprAccountProfile | null {
    return this.profiles.get(normalizeHumanIpr(humanIpr)) || null;
  }

  upsertProfile(input: IprAccountProfileUpsertInput): IprAccountProfile {
    const existing = this.getProfile(input.humanIpr);
    const incoming = buildProfile(input);

    const profile: IprAccountProfile = {
      ...incoming,
      createdAt: existing?.createdAt || incoming.createdAt,
      lastLoginAt: existing?.lastLoginAt || incoming.lastLoginAt
    };

    this.profiles.set(profile.humanIpr, profile);

    return profile;
  }

  touchLogin(humanIpr: string): IprAccountProfile | null {
    const existing = this.getProfile(humanIpr);

    if (!existing) {
      return null;
    }

    const updated: IprAccountProfile = {
      ...existing,
      updatedAt: nowIso(),
      lastLoginAt: nowIso()
    };

    this.profiles.set(updated.humanIpr, updated);

    return updated;
  }

  async getProfileAsync(humanIpr: string): Promise<IprAccountProfile | null> {
    return this.getProfile(humanIpr);
  }

  async upsertProfileAsync(
    input: IprAccountProfileUpsertInput
  ): Promise<IprAccountProfile> {
    return this.upsertProfile(input);
  }

  async touchLoginAsync(humanIpr: string): Promise<IprAccountProfile | null> {
    return this.touchLogin(humanIpr);
  }

  clear(): void {
    this.profiles.clear();
  }
}

class DatabasePersistentIprAccountStore implements IprAccountStoreAdapter {
  private readonly processFallback: ProcessIprAccountStore;

  constructor(processFallback: ProcessIprAccountStore) {
    this.processFallback = processFallback;
  }

  describe(): IprAccountStoreDescription {
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

  getProfile(humanIpr: string): IprAccountProfile | null {
    return this.processFallback.getProfile(humanIpr);
  }

  upsertProfile(input: IprAccountProfileUpsertInput): IprAccountProfile {
    return this.processFallback.upsertProfile(input);
  }

  touchLogin(humanIpr: string): IprAccountProfile | null {
    return this.processFallback.touchLogin(humanIpr);
  }

  private async upsertSubject(profile: IprAccountProfile): Promise<void> {
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
  profile_hash,
  metadata,
  legal_certification
)
VALUES (
  $1,
  $2,
  $3,
  'ACTIVE',
  now(),
  now(),
  now(),
  $4,
  $5::jsonb,
  false
)
ON CONFLICT (human_ipr) DO UPDATE SET
  entity = EXCLUDED.entity,
  subject_kind = EXCLUDED.subject_kind,
  status = 'ACTIVE',
  updated_at = now(),
  last_seen_at = now(),
  profile_hash = EXCLUDED.profile_hash,
  metadata = ipr_subjects.metadata || EXCLUDED.metadata,
  legal_certification = false
      `.trim(),
      [
        profile.humanIpr,
        profile.entity,
        profile.subjectKind,
        profile.profileHash,
        JSON.stringify({
          source: "IPR_ACCOUNT_STORE",
          persistenceMode: "DATABASE_PERSISTENT",
          legalCertification: false
        })
      ]
    );
  }

  async getProfileAsync(humanIpr: string): Promise<IprAccountProfile | null> {
    const normalizedHumanIpr = normalizeHumanIpr(humanIpr);

    const result = await queryHbceDatabase<IprAccountProfileRow>(
      `
SELECT
  human_ipr,
  account_id,
  entity,
  subject_kind,
  certificate_id,
  certificate_kind,
  certificate_status,
  certificate_scope,
  card_serial,
  certificate_hash,
  access_decision,
  access_scope,
  identity_binding,
  matrix_state,
  semantic_memory_scope,
  source,
  handoff_hash,
  profile_hash,
  created_at,
  updated_at,
  last_login_at,
  profile_payload,
  legal_certification
FROM ipr_account_profiles
WHERE human_ipr = $1
LIMIT 1
      `.trim(),
      [normalizedHumanIpr]
    );

    if (!result.ok || !result.rows[0]) {
      return null;
    }

    const profile = profileFromRow(result.rows[0]);
    this.processFallback.upsertProfile({
      humanIpr: profile.humanIpr,
      accountId: profile.accountId,
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
      profilePayload: profile.profilePayload
    });

    return profile;
  }

  async upsertProfileAsync(
    input: IprAccountProfileUpsertInput
  ): Promise<IprAccountProfile> {
    const profile = buildProfile(input);

    await this.upsertSubject(profile);

    const result = await queryHbceDatabase<IprAccountProfileRow>(
      `
INSERT INTO ipr_account_profiles (
  human_ipr,
  account_id,
  entity,
  subject_kind,
  certificate_id,
  certificate_kind,
  certificate_status,
  certificate_scope,
  card_serial,
  certificate_hash,
  access_decision,
  access_scope,
  identity_binding,
  matrix_state,
  semantic_memory_scope,
  source,
  handoff_hash,
  profile_hash,
  created_at,
  updated_at,
  last_login_at,
  profile_payload,
  legal_certification
)
VALUES (
  $1,
  $2,
  $3,
  $4,
  $5,
  $6,
  $7,
  $8::jsonb,
  $9,
  $10,
  $11,
  $12,
  $13,
  $14,
  $15,
  $16,
  $17,
  $18,
  now(),
  now(),
  NULL,
  $19::jsonb,
  false
)
ON CONFLICT (human_ipr) DO UPDATE SET
  account_id = EXCLUDED.account_id,
  entity = EXCLUDED.entity,
  subject_kind = EXCLUDED.subject_kind,
  certificate_id = EXCLUDED.certificate_id,
  certificate_kind = EXCLUDED.certificate_kind,
  certificate_status = EXCLUDED.certificate_status,
  certificate_scope = EXCLUDED.certificate_scope,
  card_serial = EXCLUDED.card_serial,
  certificate_hash = EXCLUDED.certificate_hash,
  access_decision = EXCLUDED.access_decision,
  access_scope = EXCLUDED.access_scope,
  identity_binding = EXCLUDED.identity_binding,
  matrix_state = EXCLUDED.matrix_state,
  semantic_memory_scope = EXCLUDED.semantic_memory_scope,
  source = EXCLUDED.source,
  handoff_hash = EXCLUDED.handoff_hash,
  profile_hash = EXCLUDED.profile_hash,
  updated_at = now(),
  profile_payload = EXCLUDED.profile_payload,
  legal_certification = false
RETURNING
  human_ipr,
  account_id,
  entity,
  subject_kind,
  certificate_id,
  certificate_kind,
  certificate_status,
  certificate_scope,
  card_serial,
  certificate_hash,
  access_decision,
  access_scope,
  identity_binding,
  matrix_state,
  semantic_memory_scope,
  source,
  handoff_hash,
  profile_hash,
  created_at,
  updated_at,
  last_login_at,
  profile_payload,
  legal_certification
      `.trim(),
      [
        profile.humanIpr,
        profile.accountId,
        profile.entity,
        profile.subjectKind,
        profile.certificateId,
        profile.certificateKind,
        profile.certificateStatus,
        JSON.stringify(profile.certificateScope),
        profile.cardSerial,
        profile.certificateHash,
        profile.accessDecision,
        profile.accessScope,
        profile.identityBinding,
        profile.matrixState,
        profile.semanticMemoryScope,
        profile.source,
        profile.handoffHash,
        profile.profileHash,
        jsonParam(profile.profilePayload)
      ]
    );

    if (!result.ok || !result.rows[0]) {
      throw new Error(result.error || "IPR_ACCOUNT_PROFILE_DATABASE_WRITE_FAILED");
    }

    const storedProfile = profileFromRow(result.rows[0]);

    this.processFallback.upsertProfile({
      humanIpr: storedProfile.humanIpr,
      accountId: storedProfile.accountId,
      entity: storedProfile.entity,
      subjectKind: storedProfile.subjectKind,
      certificateId: storedProfile.certificateId,
      certificateKind: storedProfile.certificateKind,
      certificateStatus: storedProfile.certificateStatus,
      certificateScope: storedProfile.certificateScope,
      cardSerial: storedProfile.cardSerial,
      certificateHash: storedProfile.certificateHash,
      accessDecision: storedProfile.accessDecision,
      accessScope: storedProfile.accessScope,
      identityBinding: storedProfile.identityBinding,
      matrixState: storedProfile.matrixState,
      semanticMemoryScope: storedProfile.semanticMemoryScope,
      source: storedProfile.source,
      handoffHash: storedProfile.handoffHash,
      profilePayload: storedProfile.profilePayload
    });

    return storedProfile;
  }

  async touchLoginAsync(humanIpr: string): Promise<IprAccountProfile | null> {
    const normalizedHumanIpr = normalizeHumanIpr(humanIpr);

    const result = await queryHbceDatabase<IprAccountProfileRow>(
      `
UPDATE ipr_account_profiles
SET
  updated_at = now(),
  last_login_at = now(),
  legal_certification = false
WHERE human_ipr = $1
RETURNING
  human_ipr,
  account_id,
  entity,
  subject_kind,
  certificate_id,
  certificate_kind,
  certificate_status,
  certificate_scope,
  card_serial,
  certificate_hash,
  access_decision,
  access_scope,
  identity_binding,
  matrix_state,
  semantic_memory_scope,
  source,
  handoff_hash,
  profile_hash,
  created_at,
  updated_at,
  last_login_at,
  profile_payload,
  legal_certification
      `.trim(),
      [normalizedHumanIpr]
    );

    if (!result.ok || !result.rows[0]) {
      return null;
    }

    const profile = profileFromRow(result.rows[0]);

    this.processFallback.upsertProfile({
      humanIpr: profile.humanIpr,
      accountId: profile.accountId,
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
      profilePayload: profile.profilePayload
    });

    return profile;
  }
}

class DatabaseReadyIprAccountStore implements IprAccountStoreAdapter {
  private readonly processFallback: ProcessIprAccountStore;

  constructor(processFallback: ProcessIprAccountStore) {
    this.processFallback = processFallback;
  }

  describe(): IprAccountStoreDescription {
    return buildDescription(
      "DATABASE_READY",
      "DEGRADED",
      true,
      true
    );
  }

  getProfile(humanIpr: string): IprAccountProfile | null {
    return this.processFallback.getProfile(humanIpr);
  }

  upsertProfile(input: IprAccountProfileUpsertInput): IprAccountProfile {
    return this.processFallback.upsertProfile(input);
  }

  touchLogin(humanIpr: string): IprAccountProfile | null {
    return this.processFallback.touchLogin(humanIpr);
  }

  async getProfileAsync(humanIpr: string): Promise<IprAccountProfile | null> {
    return this.processFallback.getProfileAsync(humanIpr);
  }

  async upsertProfileAsync(
    input: IprAccountProfileUpsertInput
  ): Promise<IprAccountProfile> {
    return this.processFallback.upsertProfileAsync(input);
  }

  async touchLoginAsync(humanIpr: string): Promise<IprAccountProfile | null> {
    return this.processFallback.touchLoginAsync(humanIpr);
  }
}

const globalForIprAccountStore = globalThis as typeof globalThis & {
  __hbceProcessIprAccountStore?: ProcessIprAccountStore;
  __hbceDatabaseReadyIprAccountStore?: DatabaseReadyIprAccountStore;
  __hbceDatabasePersistentIprAccountStore?: DatabasePersistentIprAccountStore;
};

export function getProcessIprAccountStore(): ProcessIprAccountStore {
  if (!globalForIprAccountStore.__hbceProcessIprAccountStore) {
    globalForIprAccountStore.__hbceProcessIprAccountStore =
      new ProcessIprAccountStore();
  }

  return globalForIprAccountStore.__hbceProcessIprAccountStore;
}

export function getDatabaseReadyIprAccountStore(): DatabaseReadyIprAccountStore {
  if (!globalForIprAccountStore.__hbceDatabaseReadyIprAccountStore) {
    globalForIprAccountStore.__hbceDatabaseReadyIprAccountStore =
      new DatabaseReadyIprAccountStore(getProcessIprAccountStore());
  }

  return globalForIprAccountStore.__hbceDatabaseReadyIprAccountStore;
}

export function getDatabasePersistentIprAccountStore(): DatabasePersistentIprAccountStore {
  if (!globalForIprAccountStore.__hbceDatabasePersistentIprAccountStore) {
    globalForIprAccountStore.__hbceDatabasePersistentIprAccountStore =
      new DatabasePersistentIprAccountStore(getProcessIprAccountStore());
  }

  return globalForIprAccountStore.__hbceDatabasePersistentIprAccountStore;
}

function getRequestedStoreKindFromEnv(): IprAccountStoreKind | null {
  const raw = process.env.IPR_ACCOUNT_STORE_KIND;

  if (!raw) {
    return null;
  }

  const normalized = raw.trim().toUpperCase();

  if (
    normalized === "PROCESS_ACCOUNT_STORE_MVP" ||
    normalized === "DATABASE_READY" ||
    normalized === "DATABASE_PERSISTENT" ||
    normalized === "EXTERNAL_ADAPTER"
  ) {
    return normalized;
  }

  return null;
}

export function getDefaultIprAccountStore(): IprAccountStoreAdapter {
  const requested = getRequestedStoreKindFromEnv();

  if (requested === "PROCESS_ACCOUNT_STORE_MVP") {
    return getProcessIprAccountStore();
  }

  if (requested === "DATABASE_READY") {
    return getDatabaseReadyIprAccountStore();
  }

  if (requested === "DATABASE_PERSISTENT") {
    return getDatabasePersistentIprAccountStore();
  }

  if (isHbceDatabaseConfigured()) {
    return getDatabasePersistentIprAccountStore();
  }

  return getProcessIprAccountStore();
}

export function describeDefaultIprAccountStore(): IprAccountStoreDescription {
  return getDefaultIprAccountStore().describe();
}

export function toPublicIprAccountProfile(
  profile: IprAccountProfile
): PublicIprAccountProfile {
  return {
    humanIpr: profile.humanIpr,
    accountId: profile.accountId,
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
    profileHash: profile.profileHash,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
    lastLoginAt: profile.lastLoginAt,
    legalCertification: false
  };
}

export function toIprHandoffPayloadFromAccountProfile(
  profile: IprAccountProfile
) {
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
      handoff_hash: profile.handoffHash
    },
    boundary: {
      accountBoundary: IPR_ACCOUNT_STORE_BOUNDARY,
      profileBoundary: IPR_ACCOUNT_PROFILE_BOUNDARY,
      databaseRequirement: IPR_ACCOUNT_DATABASE_REQUIREMENT,
      legalCertification: false
    },
    legalCertification: false
  };
}

export function clearProcessIprAccountStore(): void {
  getProcessIprAccountStore().clear();
}
