import { createHash } from "node:crypto";

import { normalizeHumanIpr } from "./ipr-auth";

import type {
  HbceTransactionContext
} from "./ipr-database-transaction";

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

export type IprAccountPersistenceStage =
  | "RUNTIME_VOLATILE"
  | "DATABASE_CONTRACT_READY"
  | "DATABASE_PERSISTENT_ACTIVE"
  | "DATABASE_PERSISTENT_NOT_CONFIGURED"
  | "EXTERNAL_ADAPTER_TARGET";

export type IprAccountStoreCapability =
  | "IPR_ACCOUNT_PROFILE_STORAGE"
  | "IPR_HANDOFF_RECONSTRUCTION"
  | "IPR_SUBJECT_UPSERT"
  | "PROCESS_SCOPED_RUNTIME"
  | "DATABASE_CONTRACT"
  | "DATABASE_DURABILITY"
  | "TENANT_SCOPE"
  | "WORKSPACE_SCOPE"
  | "SERVER_SIDE_PROFILE_LOOKUP"
  | "SERVER_SIDE_PROFILE_RECOVERY"
  | "LOGIN_TOUCH"
  | "AUDIT_READY_BOUNDARY"
  | "RETENTION_REQUIRED"
  | "DELETION_REQUIRED"
  | "RECOVERY_REQUIRED"
  | "MONITORING_REQUIRED"
  | "EXTERNAL_ADAPTER_CONTRACT";

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
  tenantId: string | null;
  workspaceId: string | null;
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
  tenantId: string | null;
  workspaceId: string | null;
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
  tenantId?: string | null;
  workspaceId?: string | null;
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
  name: string;
  kind: IprAccountStoreKind;
  status: IprAccountStoreStatus;
  configured: boolean;
  available: boolean;
  persistenceMode: IprAccountStoreKind;
  persistenceStage: IprAccountPersistenceStage;
  databaseConfigured: boolean;
  databaseDescription?: ReturnType<typeof describeDefaultHbceDatabase>;
  accountBoundary: string;
  profileBoundary: string;
  databaseRequirement: string;
  recoveryBoundary: string;
  legalCertification: false;
  durable: boolean;
  runtimeScoped: boolean;
  saasReady: boolean;
  requiresDatabase: boolean;
  syncFallbackToProcess: boolean;
  capabilities: IprAccountStoreCapability[];
  requirements: string[];
};

export type IprAccountStoreAdapter = {
  describe(): IprAccountStoreDescription;

  getProfile(humanIpr: string): IprAccountProfile | null;
  upsertProfile(input: IprAccountProfileUpsertInput): IprAccountProfile;
  touchLogin(humanIpr: string): IprAccountProfile | null;

  getProfileByHumanIpr?(humanIpr: string): IprAccountProfile | null;
  getProfileByAccountId?(accountId: string): IprAccountProfile | null;
  getProfileByCertificateId?(certificateId: string): IprAccountProfile | null;
  getProfileByCardSerial?(cardSerial: string): IprAccountProfile | null;

  getProfileAsync(humanIpr: string): Promise<IprAccountProfile | null>;
  upsertProfileAsync(
    input: IprAccountProfileUpsertInput
  ): Promise<IprAccountProfile>;
  touchLoginAsync(humanIpr: string): Promise<IprAccountProfile | null>;

  getProfileByHumanIprAsync?(humanIpr: string): Promise<IprAccountProfile | null>;
  getProfileByAccountIdAsync?(accountId: string): Promise<IprAccountProfile | null>;
  getProfileByCertificateIdAsync?(
    certificateId: string
  ): Promise<IprAccountProfile | null>;
  getProfileByCardSerialAsync?(cardSerial: string): Promise<IprAccountProfile | null>;
};

type IprAccountProfileRow = {
  human_ipr: string;
  tenant_id?: string | null;
  workspace_id?: string | null;
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

const DEFAULT_CANONICAL_RECOVERY_HUMAN_IPR =
  "IPR-88505FE91013DCFE97C56ED1";
const DEFAULT_CANONICAL_RECOVERY_ENTITY = "manuel coletta";
const DEFAULT_CANONICAL_RECOVERY_CERTIFICATE_ID =
  "HBCE-CERT-4591712414205BC5F3A42894";
const DEFAULT_CANONICAL_RECOVERY_CARD_SERIAL =
  "IPR-CARD-88505FE91013DCFE97C56ED1";

const DATABASE_STORE_NOT_CONFIGURED_ERROR =
  "IPR_ACCOUNT_DATABASE_STORE_NOT_CONFIGURED";

const EXTERNAL_STORE_NOT_CONFIGURED_ERROR =
  "IPR_ACCOUNT_EXTERNAL_ADAPTER_NOT_CONFIGURED";

export const IPR_ACCOUNT_STORE_BOUNDARY =
  "The IPR account profile store preserves operational account metadata for JOKER-C2 access. It does not issue official identity, does not replace CIE, SPID, EUDI Wallet, passport, codice fiscale or eIDAS qualified trust services, and does not create legal certification.";

export const IPR_ACCOUNT_PROFILE_BOUNDARY =
  "An IPR account profile may restore JOKER-C2 operational identity only after server-side authentication and profile lookup. Client-side profile text is not authoritative.";

export const IPR_ACCOUNT_PROFILE_RECOVERY_BOUNDARY =
  "A canonical recovery profile may be used only to rebuild the local process fallback for a previously authenticated HBCE/JOKER-C2 self-pilot subject when the server-side session is already valid but the volatile profile cache is missing. Recovery does not create official identity, legal certification, public authority validation or a replacement for database persistence.";

export const IPR_ACCOUNT_DATABASE_REQUIREMENT =
  "Persistent IPR account profiles require DATABASE_PERSISTENT storage before durable multi-device login, chat history restore, audit continuity, retention, deletion, recovery, revocation and production-grade reliance.";

export const IPR_ACCOUNT_DATABASE_READY_BOUNDARY =
  "DATABASE_READY means that the account profile contract is prepared for durable storage, but active profile persistence still requires a configured HBCE database, tenant/workspace scoping and production controls.";

export const IPR_ACCOUNT_DATABASE_PERSISTENT_BOUNDARY =
  "DATABASE_PERSISTENT IPR account profiles preserve the operational identity metadata needed to reconstruct the JOKER-C2 IPR handoff server-side. They do not create public authority validation, legal certification or official identity issuance.";

export const IPR_ACCOUNT_EXTERNAL_ADAPTER_BOUNDARY =
  "EXTERNAL_ADAPTER declares a future account profile adapter supplied by the runtime. External account adapters must preserve HBCE IPR boundaries, tenant/workspace scoping, auditability, fail-closed behavior and legalCertification=false.";

const PROCESS_ACCOUNT_CAPABILITIES: IprAccountStoreCapability[] = [
  "IPR_ACCOUNT_PROFILE_STORAGE",
  "IPR_HANDOFF_RECONSTRUCTION",
  "PROCESS_SCOPED_RUNTIME",
  "SERVER_SIDE_PROFILE_LOOKUP",
  "SERVER_SIDE_PROFILE_RECOVERY",
  "LOGIN_TOUCH"
];

const DATABASE_READY_CAPABILITIES: IprAccountStoreCapability[] = [
  "IPR_ACCOUNT_PROFILE_STORAGE",
  "IPR_HANDOFF_RECONSTRUCTION",
  "IPR_SUBJECT_UPSERT",
  "DATABASE_CONTRACT",
  "SERVER_SIDE_PROFILE_LOOKUP",
  "SERVER_SIDE_PROFILE_RECOVERY",
  "LOGIN_TOUCH",
  "TENANT_SCOPE",
  "WORKSPACE_SCOPE",
  "AUDIT_READY_BOUNDARY",
  "RETENTION_REQUIRED",
  "DELETION_REQUIRED"
];

const DATABASE_PERSISTENT_CAPABILITIES: IprAccountStoreCapability[] = [
  "IPR_ACCOUNT_PROFILE_STORAGE",
  "IPR_HANDOFF_RECONSTRUCTION",
  "IPR_SUBJECT_UPSERT",
  "DATABASE_CONTRACT",
  "DATABASE_DURABILITY",
  "SERVER_SIDE_PROFILE_LOOKUP",
  "SERVER_SIDE_PROFILE_RECOVERY",
  "LOGIN_TOUCH",
  "TENANT_SCOPE",
  "WORKSPACE_SCOPE",
  "AUDIT_READY_BOUNDARY",
  "RETENTION_REQUIRED",
  "DELETION_REQUIRED",
  "RECOVERY_REQUIRED",
  "MONITORING_REQUIRED"
];

const EXTERNAL_ADAPTER_CAPABILITIES: IprAccountStoreCapability[] = [
  "IPR_ACCOUNT_PROFILE_STORAGE",
  "IPR_HANDOFF_RECONSTRUCTION",
  "EXTERNAL_ADAPTER_CONTRACT",
  "SERVER_SIDE_PROFILE_LOOKUP",
  "LOGIN_TOUCH",
  "TENANT_SCOPE",
  "WORKSPACE_SCOPE",
  "AUDIT_READY_BOUNDARY",
  "RETENTION_REQUIRED",
  "DELETION_REQUIRED"
];

const PROCESS_ACCOUNT_REQUIREMENTS = [
  "Use only for R&D and MVP runtime demonstration.",
  "Do not treat process account storage as durable SaaS account persistence.",
  "Expect account profile loss on redeploy, cold start, instance recycling or runtime migration.",
  "Do not rely on this store for multi-device account continuity, enterprise audit retention, recovery or production use.",
  "Canonical recovery profile may rebuild only a self-pilot local fallback after server-side session validation."
];

const DATABASE_READY_REQUIREMENTS = [
  "Configure HBCE database storage.",
  "Run the required account profile schema.",
  "Validate tenant_id and workspace_id compatibility.",
  "Define tenant and workspace access control before production use.",
  "Define retention and deletion workflows.",
  "Define audit logging before production use.",
  "Keep legalCertification=false."
];

const DATABASE_PERSISTENT_REQUIREMENTS = [
  "Persist IPR subjects and account profiles in HBCE database storage.",
  "Preserve tenant and workspace references when available.",
  "Reconstruct IPR handoff only from server-side authenticated account profiles.",
  "Preserve certificate metadata without claiming official identity issuance.",
  "Persist lastLoginAt for authenticated sessions.",
  "Define audit logging for profile creation, update, lookup and login touch.",
  "Define retention, deletion, recovery and monitoring workflows.",
  "Do not claim public authority validation or legal certification.",
  "Keep legalCertification=false."
];

const EXTERNAL_ADAPTER_REQUIREMENTS = [
  "External adapter must implement the full IprAccountStoreAdapter contract.",
  "External adapter must preserve server-side IPR account profile lookup.",
  "External adapter must preserve tenant and workspace scoping when used in SaaS mode.",
  "External adapter must preserve fail-closed behavior and legalCertification=false.",
  "External adapter must not transform IPR profile data into official identity issuance claims."
];

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

function canonicalize(value: unknown): string {
  return JSON.stringify(sortCanonical(value));
}

function sortCanonical(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sortCanonical(item));
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;

    return Object.keys(record)
      .sort()
      .reduce<Record<string, unknown>>((accumulator, key) => {
        const item = record[key];

        if (typeof item !== "undefined") {
          accumulator[key] = sortCanonical(item);
        }

        return accumulator;
      }, {});
  }

  return value;
}

function hashJson(value: unknown): string {
  return `sha256:${createHash("sha256")
    .update(canonicalize(value), "utf8")
    .digest("hex")}`;
}

function normalizeLookupValue(value: string | null | undefined): string {
  return typeof value === "string" ? value.trim() : "";
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

function normalizeOptionalId(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();

  return normalized ? normalized : null;
}

function normalizeCertificateScope(value: string[] | undefined): string[] {
  return Array.isArray(value)
    ? value.map((item) => item.trim()).filter(Boolean)
    : [];
}

function assertDatabaseConfigured(): void {
  if (!isHbceDatabaseConfigured()) {
    throw new Error(DATABASE_STORE_NOT_CONFIGURED_ERROR);
  }
}

function getEnvString(name: string, fallback: string): string {
  const value = process.env[name];

  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  return fallback;
}

function isCanonicalProfileRecoveryEnabled(): boolean {
  const raw = process.env.IPR_ACCOUNT_CANONICAL_RECOVERY_ENABLED;

  if (typeof raw !== "string" || !raw.trim()) {
    return false;
  }

  return raw.trim().toLowerCase() === "true";
}

function getCanonicalRecoveryHumanIpr(): string {
  return normalizeHumanIpr(
    getEnvString(
      "IPR_ACCOUNT_CANONICAL_RECOVERY_HUMAN_IPR",
      DEFAULT_CANONICAL_RECOVERY_HUMAN_IPR
    )
  );
}

function getCanonicalRecoveryProfileInput(
  humanIpr: string
): IprAccountProfileUpsertInput | null {
  const normalizedHumanIpr = normalizeHumanIpr(humanIpr);

  if (!isCanonicalProfileRecoveryEnabled()) {
    return null;
  }

  if (normalizedHumanIpr !== getCanonicalRecoveryHumanIpr()) {
    return null;
  }

  return {
    humanIpr: normalizedHumanIpr,
    tenantId: normalizeOptionalId(process.env.IPR_ACCOUNT_CANONICAL_RECOVERY_TENANT_ID),
    workspaceId: normalizeOptionalId(
      process.env.IPR_ACCOUNT_CANONICAL_RECOVERY_WORKSPACE_ID
    ),
    accountId:
      normalizeOptionalId(process.env.IPR_ACCOUNT_CANONICAL_RECOVERY_ACCOUNT_ID) ||
      buildAccountId(normalizedHumanIpr),
    entity: getEnvString(
      "IPR_ACCOUNT_CANONICAL_RECOVERY_ENTITY",
      DEFAULT_CANONICAL_RECOVERY_ENTITY
    ),
    subjectKind: "BIOLOGICAL_SUBJECT",
    certificateId: getEnvString(
      "IPR_ACCOUNT_CANONICAL_RECOVERY_CERTIFICATE_ID",
      DEFAULT_CANONICAL_RECOVERY_CERTIFICATE_ID
    ),
    certificateKind: getEnvString(
      "IPR_ACCOUNT_CANONICAL_RECOVERY_CERTIFICATE_KIND",
      DEFAULT_CERTIFICATE_KIND
    ),
    certificateStatus: getEnvString(
      "IPR_ACCOUNT_CANONICAL_RECOVERY_CERTIFICATE_STATUS",
      "ACTIVE"
    ),
    certificateScope: [
      getEnvString(
        "IPR_ACCOUNT_CANONICAL_RECOVERY_ACCESS_SCOPE",
        DEFAULT_ACCESS_SCOPE
      )
    ],
    cardSerial: getEnvString(
      "IPR_ACCOUNT_CANONICAL_RECOVERY_CARD_SERIAL",
      DEFAULT_CANONICAL_RECOVERY_CARD_SERIAL
    ),
    certificateHash: normalizeOptionalId(
      process.env.IPR_ACCOUNT_CANONICAL_RECOVERY_CERTIFICATE_HASH
    ),
    accessDecision: "ACCESS_GRANTED",
    accessScope: DEFAULT_ACCESS_SCOPE,
    identityBinding: "IPR_VERIFIED_BIOLOGICAL_SUBJECT",
    matrixState: "MATRIX_ACTIVE",
    semanticMemoryScope: "IPR_BOUND",
    source: "HBCE_CANONICAL_RECOVERY_PROFILE",
    handoffHash: null,
    profilePayload: {
      recovery: {
        enabled: true,
        source: "HBCE_CANONICAL_RECOVERY_PROFILE",
        reason:
          "Recovered local process fallback for an already authenticated self-pilot IPR session after volatile profile cache loss.",
        boundary: IPR_ACCOUNT_PROFILE_RECOVERY_BOUNDARY,
        legalCertification: false
      },
      legalCertification: false
    }
  };
}

function buildProfile(input: IprAccountProfileUpsertInput): IprAccountProfile {
  const humanIpr = normalizeHumanIpr(input.humanIpr);
  const timestamp = nowIso();
  const certificateScope = normalizeCertificateScope(input.certificateScope);

  const profilePayload = {
    ...(input.profilePayload || {}),
    saas: {
      tenantId: normalizeOptionalId(input.tenantId),
      workspaceId: normalizeOptionalId(input.workspaceId),
      ...(toJsonRecord(input.profilePayload?.saas) || {})
    },
    legalCertification: false
  };

  const profileBase = {
    humanIpr,
    tenantId: normalizeOptionalId(input.tenantId),
    workspaceId: normalizeOptionalId(input.workspaceId),
    accountId: input.accountId || buildAccountId(humanIpr),
    entity: input.entity || buildEntityLabel(humanIpr),
    subjectKind: input.subjectKind || "BIOLOGICAL_SUBJECT",
    certificateId: input.certificateId,
    certificateKind: input.certificateKind || DEFAULT_CERTIFICATE_KIND,
    certificateStatus: input.certificateStatus || "UNKNOWN",
    certificateScope,
    cardSerial: input.cardSerial || null,
    certificateHash: input.certificateHash || null,
    accessDecision:
      input.accessDecision || "AUTHENTICATION_REQUIRED",
    accessScope:
      input.accessScope || "NO_ACCESS_SCOPE",
    identityBinding:
      input.identityBinding || "NO_AUTHENTICATED_IPR_SESSION",
    matrixState:
      input.matrixState || "MATRIX_LIMITED",
    semanticMemoryScope:
      input.semanticMemoryScope || "RUNTIME_ONLY",
    source:
      input.source || "UNVERIFIED_PROFILE_INPUT",
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
    tenantId: row.tenant_id || null,
    workspaceId: row.workspace_id || null,
    accountId: row.account_id,
    certificateId: row.certificate_id,
    source: row.source
  });

  return {
    humanIpr: row.human_ipr,
    tenantId: row.tenant_id || null,
    workspaceId: row.workspace_id || null,
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


export const IPR_ACCOUNT_TRANSACTIONAL_PERSISTENCE_BOUNDARY =
  "Transaction-scoped IPR account persistence writes the subject and account profile through a caller-owned HBCE database transaction. It does not authenticate a subject, create a session, grant runtime authority or mutate the process fallback. The caller may synchronize volatile fallback state only after the enclosing transaction has committed successfully.";

export type IprAccountTransactionalPersistenceResult = {
  profile: IprAccountProfile;
  transactionScoped: true;
  subjectPersisted: true;
  profilePersisted: true;
  processFallbackMutated: false;
  sessionCreated: false;
  runtimeAuthorized: false;
  legalCertification: false;
};

export async function persistIprAccountProfileInTransaction(input: {
  transaction: Pick<HbceTransactionContext, "query">;
  profileInput: IprAccountProfileUpsertInput;
}): Promise<IprAccountTransactionalPersistenceResult> {
  const profile =
    buildProfile(
      input.profileInput
    );

  await input.transaction.query(
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
        source:
          "IPR_ACCOUNT_TRANSACTIONAL_PERSISTENCE",
        persistenceMode:
          "DATABASE_PERSISTENT",
        tenantId:
          profile.tenantId,
        workspaceId:
          profile.workspaceId,
        legalCertification:
          false
      })
    ]
  );

  const profileResult =
    await input.transaction.query<IprAccountProfileRow>(
      `
INSERT INTO ipr_account_profiles (
  human_ipr,
  tenant_id,
  workspace_id,
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
  $8,
  $9,
  $10::jsonb,
  $11,
  $12,
  $13,
  $14,
  $15,
  $16,
  $17,
  $18,
  $19,
  $20,
  now(),
  now(),
  NULL,
  $21::jsonb,
  false
)
ON CONFLICT (human_ipr) DO UPDATE SET
  tenant_id = EXCLUDED.tenant_id,
  workspace_id = EXCLUDED.workspace_id,
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
  tenant_id,
  workspace_id,
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
        profile.tenantId,
        profile.workspaceId,
        profile.accountId,
        profile.entity,
        profile.subjectKind,
        profile.certificateId,
        profile.certificateKind,
        profile.certificateStatus,
        JSON.stringify(
          profile.certificateScope
        ),
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
        jsonParam(
          profile.profilePayload
        )
      ]
    );

  const row =
    profileResult.rows[0];

  if (!row) {
    throw new Error(
      "IPR_ACCOUNT_TRANSACTIONAL_PROFILE_WRITE_MISSING"
    );
  }

  if (
    row.legal_certification !==
    false
  ) {
    throw new Error(
      "IPR_ACCOUNT_TRANSACTIONAL_LEGAL_CERTIFICATION_FORBIDDEN"
    );
  }

  const storedProfile =
    profileFromRow(
      row
    );

  if (
    storedProfile.humanIpr !==
      profile.humanIpr ||
    storedProfile.accountId !==
      profile.accountId ||
    storedProfile.tenantId !==
      profile.tenantId ||
    storedProfile.workspaceId !==
      profile.workspaceId ||
    storedProfile.profileHash !==
      profile.profileHash
  ) {
    throw new Error(
      "IPR_ACCOUNT_TRANSACTIONAL_PROFILE_MISMATCH"
    );
  }

  return {
    profile:
      storedProfile,
    transactionScoped:
      true,
    subjectPersisted:
      true,
    profilePersisted:
      true,
    processFallbackMutated:
      false,
    sessionCreated:
      false,
    runtimeAuthorized:
      false,
    legalCertification:
      false
  };
}


function buildDescription(input: {
  name: string;
  kind: IprAccountStoreKind;
  status: IprAccountStoreStatus;
  configured: boolean;
  available: boolean;
  persistenceStage: IprAccountPersistenceStage;
  accountBoundary: string;
  durable: boolean;
  runtimeScoped: boolean;
  saasReady: boolean;
  requiresDatabase: boolean;
  syncFallbackToProcess: boolean;
  capabilities: IprAccountStoreCapability[];
  requirements: string[];
}): IprAccountStoreDescription {
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
    accountBoundary: input.accountBoundary,
    profileBoundary: IPR_ACCOUNT_PROFILE_BOUNDARY,
    databaseRequirement: IPR_ACCOUNT_DATABASE_REQUIREMENT,
    recoveryBoundary: IPR_ACCOUNT_PROFILE_RECOVERY_BOUNDARY,
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

class ProcessIprAccountStore implements IprAccountStoreAdapter {
  private readonly profiles = new Map<string, IprAccountProfile>();

  describe(): IprAccountStoreDescription {
    return buildDescription({
      name: "HBCE_JOKER_C2_PROCESS_ACCOUNT_STORE",
      kind: "PROCESS_ACCOUNT_STORE_MVP",
      status: "AVAILABLE",
      configured: true,
      available: true,
      persistenceStage: "RUNTIME_VOLATILE",
      accountBoundary: IPR_ACCOUNT_STORE_BOUNDARY,
      durable: false,
      runtimeScoped: true,
      saasReady: false,
      requiresDatabase: false,
      syncFallbackToProcess: false,
      capabilities: PROCESS_ACCOUNT_CAPABILITIES,
      requirements: PROCESS_ACCOUNT_REQUIREMENTS
    });
  }

  getProfile(humanIpr: string): IprAccountProfile | null {
    return this.profiles.get(normalizeHumanIpr(humanIpr)) || null;
  }

  getProfileByHumanIpr(humanIpr: string): IprAccountProfile | null {
    return this.getProfile(humanIpr);
  }

  getProfileByAccountId(accountId: string): IprAccountProfile | null {
    const normalized = normalizeLookupValue(accountId);

    if (!normalized) {
      return null;
    }

    for (const profile of this.profiles.values()) {
      if (profile.accountId === normalized) {
        return profile;
      }
    }

    return null;
  }

  getProfileByCertificateId(certificateId: string): IprAccountProfile | null {
    const normalized = normalizeLookupValue(certificateId);

    if (!normalized) {
      return null;
    }

    for (const profile of this.profiles.values()) {
      if (profile.certificateId === normalized) {
        return profile;
      }
    }

    return null;
  }

  getProfileByCardSerial(cardSerial: string): IprAccountProfile | null {
    const normalized = normalizeLookupValue(cardSerial);

    if (!normalized) {
      return null;
    }

    for (const profile of this.profiles.values()) {
      if (profile.cardSerial === normalized) {
        return profile;
      }
    }

    return null;
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

    const timestamp = nowIso();

    const updated: IprAccountProfile = {
      ...existing,
      updatedAt: timestamp,
      lastLoginAt: timestamp
    };

    this.profiles.set(updated.humanIpr, updated);

    return updated;
  }

  async getProfileAsync(humanIpr: string): Promise<IprAccountProfile | null> {
    return this.getProfile(humanIpr);
  }

  async getProfileByHumanIprAsync(
    humanIpr: string
  ): Promise<IprAccountProfile | null> {
    return this.getProfileByHumanIpr(humanIpr);
  }

  async getProfileByAccountIdAsync(
    accountId: string
  ): Promise<IprAccountProfile | null> {
    return this.getProfileByAccountId(accountId);
  }

  async getProfileByCertificateIdAsync(
    certificateId: string
  ): Promise<IprAccountProfile | null> {
    return this.getProfileByCertificateId(certificateId);
  }

  async getProfileByCardSerialAsync(
    cardSerial: string
  ): Promise<IprAccountProfile | null> {
    return this.getProfileByCardSerial(cardSerial);
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

class DatabaseReadyIprAccountStore implements IprAccountStoreAdapter {
  private readonly processFallback: ProcessIprAccountStore;

  constructor(processFallback: ProcessIprAccountStore) {
    this.processFallback = processFallback;
  }

  describe(): IprAccountStoreDescription {
    return buildDescription({
      name: "HBCE_JOKER_C2_DATABASE_READY_ACCOUNT_STORE",
      kind: "DATABASE_READY",
      status: "DEGRADED",
      configured: true,
      available: true,
      persistenceStage: "DATABASE_CONTRACT_READY",
      accountBoundary: IPR_ACCOUNT_DATABASE_READY_BOUNDARY,
      durable: false,
      runtimeScoped: true,
      saasReady: false,
      requiresDatabase: true,
      syncFallbackToProcess: true,
      capabilities: DATABASE_READY_CAPABILITIES,
      requirements: DATABASE_READY_REQUIREMENTS
    });
  }

  getProfile(humanIpr: string): IprAccountProfile | null {
    return this.processFallback.getProfile(humanIpr);
  }

  getProfileByHumanIpr(humanIpr: string): IprAccountProfile | null {
    return this.processFallback.getProfileByHumanIpr(humanIpr);
  }

  getProfileByAccountId(accountId: string): IprAccountProfile | null {
    return this.processFallback.getProfileByAccountId(accountId);
  }

  getProfileByCertificateId(certificateId: string): IprAccountProfile | null {
    return this.processFallback.getProfileByCertificateId(certificateId);
  }

  getProfileByCardSerial(cardSerial: string): IprAccountProfile | null {
    return this.processFallback.getProfileByCardSerial(cardSerial);
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

  async getProfileByHumanIprAsync(
    humanIpr: string
  ): Promise<IprAccountProfile | null> {
    return this.processFallback.getProfileByHumanIprAsync(humanIpr);
  }

  async getProfileByAccountIdAsync(
    accountId: string
  ): Promise<IprAccountProfile | null> {
    return this.processFallback.getProfileByAccountIdAsync(accountId);
  }

  async getProfileByCertificateIdAsync(
    certificateId: string
  ): Promise<IprAccountProfile | null> {
    return this.processFallback.getProfileByCertificateIdAsync(certificateId);
  }

  async getProfileByCardSerialAsync(
    cardSerial: string
  ): Promise<IprAccountProfile | null> {
    return this.processFallback.getProfileByCardSerialAsync(cardSerial);
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

class DatabasePersistentIprAccountStore implements IprAccountStoreAdapter {
  private readonly processFallback: ProcessIprAccountStore;

  constructor(processFallback: ProcessIprAccountStore) {
    this.processFallback = processFallback;
  }

  describe(): IprAccountStoreDescription {
    if (!isHbceDatabaseConfigured()) {
      return buildDescription({
        name: "HBCE_JOKER_C2_DATABASE_PERSISTENT_ACCOUNT_STORE",
        kind: "DATABASE_PERSISTENT",
        status: "NOT_CONFIGURED",
        configured: false,
        available: false,
        persistenceStage: "DATABASE_PERSISTENT_NOT_CONFIGURED",
        accountBoundary: IPR_ACCOUNT_DATABASE_PERSISTENT_BOUNDARY,
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
      name: "HBCE_JOKER_C2_DATABASE_PERSISTENT_ACCOUNT_STORE",
      kind: "DATABASE_PERSISTENT",
      status: "AVAILABLE",
      configured: true,
      available: true,
      persistenceStage: "DATABASE_PERSISTENT_ACTIVE",
      accountBoundary: IPR_ACCOUNT_DATABASE_PERSISTENT_BOUNDARY,
      durable: true,
      runtimeScoped: false,
      saasReady: true,
      requiresDatabase: true,
      syncFallbackToProcess: true,
      capabilities: DATABASE_PERSISTENT_CAPABILITIES,
      requirements: DATABASE_PERSISTENT_REQUIREMENTS
    });
  }

  private recoverCanonicalProfile(humanIpr: string): IprAccountProfile | null {
    const recoveryInput = getCanonicalRecoveryProfileInput(humanIpr);

    if (!recoveryInput) {
      return null;
    }

    return this.processFallback.upsertProfile(recoveryInput);
  }

  private getProfileFromProcessFallback(humanIpr: string): IprAccountProfile | null {
    return this.processFallback.getProfile(humanIpr);
  }

  getProfile(humanIpr: string): IprAccountProfile | null {
    return this.getProfileFromProcessFallback(humanIpr);
  }

  getProfileByHumanIpr(humanIpr: string): IprAccountProfile | null {
    return this.getProfile(humanIpr);
  }

  getProfileByAccountId(accountId: string): IprAccountProfile | null {
    return this.processFallback.getProfileByAccountId(accountId);
  }

  getProfileByCertificateId(certificateId: string): IprAccountProfile | null {
    return this.processFallback.getProfileByCertificateId(certificateId);
  }

  getProfileByCardSerial(cardSerial: string): IprAccountProfile | null {
    return this.processFallback.getProfileByCardSerial(cardSerial);
  }

  upsertProfile(input: IprAccountProfileUpsertInput): IprAccountProfile {
    return this.processFallback.upsertProfile(input);
  }

  touchLogin(humanIpr: string): IprAccountProfile | null {
    const existing = this.getProfileFromProcessFallback(humanIpr);

    if (!existing) {
      return null;
    }

    return this.processFallback.touchLogin(existing.humanIpr);
  }

  private async upsertSubject(profile: IprAccountProfile): Promise<void> {
    assertDatabaseConfigured();

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
          tenantId: profile.tenantId,
          workspaceId: profile.workspaceId,
          legalCertification: false
        })
      ]
    );
  }

  private async getProfileByColumn(input: {
    column:
      | "human_ipr"
      | "account_id"
      | "certificate_id"
      | "card_serial";
    value: string;
  }): Promise<IprAccountProfile | null> {
    assertDatabaseConfigured();

    const normalizedValue =
      input.column === "human_ipr"
        ? normalizeHumanIpr(input.value)
        : normalizeLookupValue(input.value);

    if (!normalizedValue) {
      return null;
    }

    const result = await queryHbceDatabase<IprAccountProfileRow>(
      `
SELECT
  human_ipr,
  tenant_id,
  workspace_id,
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
WHERE ${input.column} = $1
LIMIT 1
      `.trim(),
      [normalizedValue]
    );

    if (!result.ok || !result.rows[0]) {
      return null;
    }

    const profile = profileFromRow(result.rows[0]);

    this.processFallback.upsertProfile({
      humanIpr: profile.humanIpr,
      tenantId: profile.tenantId,
      workspaceId: profile.workspaceId,
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

  async getProfileAsync(humanIpr: string): Promise<IprAccountProfile | null> {
    const profile = await this.getProfileByColumn({
      column: "human_ipr",
      value: humanIpr
    });

    if (profile) {
      return profile;
    }

    return this.getProfileFromProcessFallback(humanIpr);
  }

  async getProfileByHumanIprAsync(
    humanIpr: string
  ): Promise<IprAccountProfile | null> {
    return this.getProfileAsync(humanIpr);
  }

  async getProfileByAccountIdAsync(
    accountId: string
  ): Promise<IprAccountProfile | null> {
    const profile = await this.getProfileByColumn({
      column: "account_id",
      value: accountId
    });

    return profile || this.getProfileByAccountId(accountId);
  }

  async getProfileByCertificateIdAsync(
    certificateId: string
  ): Promise<IprAccountProfile | null> {
    const profile = await this.getProfileByColumn({
      column: "certificate_id",
      value: certificateId
    });

    return profile || this.getProfileByCertificateId(certificateId);
  }

  async getProfileByCardSerialAsync(
    cardSerial: string
  ): Promise<IprAccountProfile | null> {
    const profile = await this.getProfileByColumn({
      column: "card_serial",
      value: cardSerial
    });

    return profile || this.getProfileByCardSerial(cardSerial);
  }

  async upsertProfileAsync(
    input: IprAccountProfileUpsertInput
  ): Promise<IprAccountProfile> {
    assertDatabaseConfigured();

    const profile = buildProfile(input);

    await this.upsertSubject(profile);

    const result = await queryHbceDatabase<IprAccountProfileRow>(
      `
INSERT INTO ipr_account_profiles (
  human_ipr,
  tenant_id,
  workspace_id,
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
  $8,
  $9,
  $10::jsonb,
  $11,
  $12,
  $13,
  $14,
  $15,
  $16,
  $17,
  $18,
  $19,
  $20,
  now(),
  now(),
  NULL,
  $21::jsonb,
  false
)
ON CONFLICT (human_ipr) DO UPDATE SET
  tenant_id = EXCLUDED.tenant_id,
  workspace_id = EXCLUDED.workspace_id,
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
  tenant_id,
  workspace_id,
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
        profile.tenantId,
        profile.workspaceId,
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
      tenantId: storedProfile.tenantId,
      workspaceId: storedProfile.workspaceId,
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
    assertDatabaseConfigured();

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
  tenant_id,
  workspace_id,
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
      return this.touchLogin(normalizedHumanIpr);
    }

    const profile = profileFromRow(result.rows[0]);

    this.processFallback.upsertProfile({
      humanIpr: profile.humanIpr,
      tenantId: profile.tenantId,
      workspaceId: profile.workspaceId,
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

class ExternalAdapterPlaceholderIprAccountStore implements IprAccountStoreAdapter {
  describe(): IprAccountStoreDescription {
    return buildDescription({
      name: "HBCE_JOKER_C2_EXTERNAL_ACCOUNT_ADAPTER_PLACEHOLDER",
      kind: "EXTERNAL_ADAPTER",
      status: "NOT_CONFIGURED",
      configured: false,
      available: false,
      persistenceStage: "EXTERNAL_ADAPTER_TARGET",
      accountBoundary: IPR_ACCOUNT_EXTERNAL_ADAPTER_BOUNDARY,
      durable: true,
      runtimeScoped: false,
      saasReady: false,
      requiresDatabase: false,
      syncFallbackToProcess: false,
      capabilities: EXTERNAL_ADAPTER_CAPABILITIES,
      requirements: EXTERNAL_ADAPTER_REQUIREMENTS
    });
  }

  getProfile(humanIpr: string): IprAccountProfile | null {
    void humanIpr;
    throw new Error(EXTERNAL_STORE_NOT_CONFIGURED_ERROR);
  }

  getProfileByHumanIpr(humanIpr: string): IprAccountProfile | null {
    return this.getProfile(humanIpr);
  }

  getProfileByAccountId(accountId: string): IprAccountProfile | null {
    void accountId;
    throw new Error(EXTERNAL_STORE_NOT_CONFIGURED_ERROR);
  }

  getProfileByCertificateId(certificateId: string): IprAccountProfile | null {
    void certificateId;
    throw new Error(EXTERNAL_STORE_NOT_CONFIGURED_ERROR);
  }

  getProfileByCardSerial(cardSerial: string): IprAccountProfile | null {
    void cardSerial;
    throw new Error(EXTERNAL_STORE_NOT_CONFIGURED_ERROR);
  }

  upsertProfile(input: IprAccountProfileUpsertInput): IprAccountProfile {
    void input;
    throw new Error(EXTERNAL_STORE_NOT_CONFIGURED_ERROR);
  }

  touchLogin(humanIpr: string): IprAccountProfile | null {
    void humanIpr;
    throw new Error(EXTERNAL_STORE_NOT_CONFIGURED_ERROR);
  }

  async getProfileAsync(humanIpr: string): Promise<IprAccountProfile | null> {
    return this.getProfile(humanIpr);
  }

  async getProfileByHumanIprAsync(
    humanIpr: string
  ): Promise<IprAccountProfile | null> {
    return this.getProfileByHumanIpr(humanIpr);
  }

  async getProfileByAccountIdAsync(
    accountId: string
  ): Promise<IprAccountProfile | null> {
    return this.getProfileByAccountId(accountId);
  }

  async getProfileByCertificateIdAsync(
    certificateId: string
  ): Promise<IprAccountProfile | null> {
    return this.getProfileByCertificateId(certificateId);
  }

  async getProfileByCardSerialAsync(
    cardSerial: string
  ): Promise<IprAccountProfile | null> {
    return this.getProfileByCardSerial(cardSerial);
  }

  async upsertProfileAsync(
    input: IprAccountProfileUpsertInput
  ): Promise<IprAccountProfile> {
    return this.upsertProfile(input);
  }

  async touchLoginAsync(humanIpr: string): Promise<IprAccountProfile | null> {
    return this.touchLogin(humanIpr);
  }
}

const globalForIprAccountStore = globalThis as typeof globalThis & {
  __hbceProcessIprAccountStore?: ProcessIprAccountStore;
  __hbceDatabaseReadyIprAccountStore?: DatabaseReadyIprAccountStore;
  __hbceDatabasePersistentIprAccountStore?: DatabasePersistentIprAccountStore;
  __hbceExternalAdapterPlaceholderIprAccountStore?: ExternalAdapterPlaceholderIprAccountStore;
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

export function getExternalAdapterPlaceholderIprAccountStore(): ExternalAdapterPlaceholderIprAccountStore {
  if (!globalForIprAccountStore.__hbceExternalAdapterPlaceholderIprAccountStore) {
    globalForIprAccountStore.__hbceExternalAdapterPlaceholderIprAccountStore =
      new ExternalAdapterPlaceholderIprAccountStore();
  }

  return globalForIprAccountStore.__hbceExternalAdapterPlaceholderIprAccountStore;
}

export function createExternalIprAccountStoreAdapter(
  adapter: IprAccountStoreAdapter
): IprAccountStoreAdapter {
  const description = adapter.describe();

  if (description.kind !== "EXTERNAL_ADAPTER") {
    throw new Error("IPR_ACCOUNT_EXTERNAL_ADAPTER_KIND_REQUIRED");
  }

  if (description.legalCertification !== false) {
    throw new Error("IPR_ACCOUNT_EXTERNAL_ADAPTER_LEGAL_CERTIFICATION_FORBIDDEN");
  }

  if (!description.durable) {
    throw new Error("IPR_ACCOUNT_EXTERNAL_ADAPTER_MUST_BE_DURABLE");
  }

  if (description.runtimeScoped) {
    throw new Error("IPR_ACCOUNT_EXTERNAL_ADAPTER_MUST_NOT_BE_RUNTIME_SCOPED");
  }

  return adapter;
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

export function selectIprAccountStore(
  kind: IprAccountStoreKind
): IprAccountStoreAdapter {
  if (kind === "PROCESS_ACCOUNT_STORE_MVP") {
    return getProcessIprAccountStore();
  }

  if (kind === "DATABASE_READY") {
    return getDatabaseReadyIprAccountStore();
  }

  if (kind === "DATABASE_PERSISTENT") {
    return getDatabasePersistentIprAccountStore();
  }

  return getExternalAdapterPlaceholderIprAccountStore();
}

export function getDefaultIprAccountStore(): IprAccountStoreAdapter {
  const requested = getRequestedStoreKindFromEnv();

  if (requested) {
    return selectIprAccountStore(requested);
  }

  if (isHbceDatabaseConfigured()) {
    return getDatabasePersistentIprAccountStore();
  }

  return getProcessIprAccountStore();
}

export function getSaasTargetIprAccountStore(): IprAccountStoreAdapter {
  return getDatabasePersistentIprAccountStore();
}

export function describeDefaultIprAccountStore(): IprAccountStoreDescription {
  return getDefaultIprAccountStore().describe();
}

export function describeProcessIprAccountStore(): IprAccountStoreDescription {
  return getProcessIprAccountStore().describe();
}

export function describeDatabaseReadyIprAccountStore(): IprAccountStoreDescription {
  return getDatabaseReadyIprAccountStore().describe();
}

export function describeDatabasePersistentIprAccountStore(): IprAccountStoreDescription {
  return getDatabasePersistentIprAccountStore().describe();
}

export function describeExternalAdapterPlaceholderIprAccountStore(): IprAccountStoreDescription {
  return getExternalAdapterPlaceholderIprAccountStore().describe();
}

export function describeSaasTargetIprAccountStore(): IprAccountStoreDescription {
  return getSaasTargetIprAccountStore().describe();
}

export function listIprAccountStoreDescriptions(): IprAccountStoreDescription[] {
  return [
    describeProcessIprAccountStore(),
    describeDatabaseReadyIprAccountStore(),
    describeDatabasePersistentIprAccountStore(),
    describeExternalAdapterPlaceholderIprAccountStore()
  ];
}

export function toPublicIprAccountProfile(
  profile: IprAccountProfile
): PublicIprAccountProfile {
  return {
    humanIpr: profile.humanIpr,
    tenantId: profile.tenantId,
    workspaceId: profile.workspaceId,
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
    handoff_version: "1.0",
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
      semantic_memory_scope: profile.semanticMemoryScope,
      expected_authority: "SERVER_RUNTIME_VALIDATED",
      persistence_mode: "DATABASE_PERSISTENT"
    },
    account: {
      account_id: profile.accountId,
      tenant_id: profile.tenantId,
      workspace_id: profile.workspaceId,
      profile_hash: profile.profileHash,
      source: profile.source,
      handoff_hash: profile.handoffHash
    },
    saas: {
      targetPersistence: "DATABASE_PERSISTENT",
      tenantId: profile.tenantId,
      workspaceId: profile.workspaceId,
      legalCertification: false
    },
    recovery:
      profile.source === "HBCE_CANONICAL_RECOVERY_PROFILE"
        ? {
            source: profile.source,
            boundary: IPR_ACCOUNT_PROFILE_RECOVERY_BOUNDARY,
            legalCertification: false
          }
        : undefined,
    boundary: {
      accountBoundary: IPR_ACCOUNT_STORE_BOUNDARY,
      profileBoundary: IPR_ACCOUNT_PROFILE_BOUNDARY,
      recoveryBoundary: IPR_ACCOUNT_PROFILE_RECOVERY_BOUNDARY,
      databaseRequirement: IPR_ACCOUNT_DATABASE_REQUIREMENT,
      legalCertification: false
    },
    legalCertification: false
  };
}

export function clearProcessIprAccountStore(): void {
  getProcessIprAccountStore().clear();
}
