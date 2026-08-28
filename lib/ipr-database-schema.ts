export const HBCE_DATABASE_SCHEMA_VERSION = "HBCE-IPR-DB-v1.13";


export const HBCE_DATABASE_SCHEMA_BOUNDARY =
  "HBCE database persistence stores operational identity, SaaS tenants, workspaces, memberships, subscriptions, sessions, chat continuity, explicit IPR chat memory saves, IPR-bound memory, EVT records, OPC technical proof receipts, runtime audit logs, model usage logs and MATRIX Transformative Memory for runtime audit. Runtime persistence tables are intentionally tolerant during SaaS Core v0.1: tenant, workspace, subscription, session, EVT, OPC, audit and memory references may be null or payload-only until the full relational ledger is active. HBCE-IPR-DB-v1.13 preserves the HBCE-IPR-DB-v1.12 distributed anti-abuse governance contract and adds persistent server-verifiable one-use password recovery grants for governed credential rotation. Recovery grants persist only opaque SHA-256 recovery-token hashes, HMAC-SHA256 subject and authority binding hashes and minimized lifecycle metadata; raw recovery tokens, raw Human IPR recovery bindings, raw recovery authority references, raw recovery authority secrets and plaintext passwords are never persisted. Only minimized operational scope and deterministic hashes are persisted; raw Human IPR, raw onboarding nonces, raw service credentials, raw issuer authorization references, biometric material and document content remain outside this policy record. The policy record cannot create sessions, authorize runtime execution, bypass replay validation or directly persist an account profile. Existing Temporal Runtime Certificate, account profile, memory, EVT, OPC, runtime audit, model usage, MATRIX and internal self-pilot semantics remain unchanged. The temporal certificate is a technical runtime frame built from UTC response time, the canonical local birth anchor and AI JOKER-C2 lifetime; it is not a qualified timestamp or legal certification. This database layer does not create legal certification, does not replace official identity documents, does not replace CIE, SPID, EUDI Wallet, passport, codice fiscale, eIDAS qualified trust services, qualified timestamping or public authority validation.";


export const HBCE_DATABASE_LEGAL_CERTIFICATION_BOUNDARY =
  "All HBCE database records remain technical-operational records. legal_certification must remain false unless a future legally recognized qualified trust service, public authority process or regulated certification workflow is explicitly integrated.";


export const HBCE_DATABASE_PERSISTENCE_MODE = "DATABASE_PERSISTENT";


export const HBCE_PROJECT_BIRTH_DATE = "2026-01-19";


export const HBCE_JOKER_C2_BIRTH_ANCHOR_LOCAL =
  "2026-01-19T15:30:00+01:00";


export const HBCE_JOKER_C2_BIRTH_TIME_ZONE = "Europe/Rome";


export const HBCE_JOKER_C2_BIRTH_ANCHOR_UTC =
  "2026-01-19T14:30:00.000Z";


export const HBCE_JOKER_C2_TEMPORAL_CERTIFICATE_NAME =
  "JOKER-C2 Temporal Runtime Certificate";


export const HBCE_JOKER_C2_TEMPORAL_CERTIFICATE_BOUNDARY =
  "JOKER-C2 Temporal Runtime Certificate links UTC response time, canonical local birth anchor and AI JOKER-C2 lifetime as a technical-operational temporal frame. It is not legal certification, not a qualified timestamp and not public authority validation.";


export const HBCE_PROJECT_BIRTH_LABEL =
  "HBCE R&D / AI JOKER-C2 project birth date";


export const HBCE_MONTHLY_REFERENCE = "UP-MESE-4";


export const HBCE_CURRENT_OPERATIONAL_EVT = "UP-EVT-0016";


export const HBCE_CURRENT_OPERATIONAL_AI_EVT = "UP-EVT-0016-AI";


export const HBCE_CURRENT_OPERATIONAL_CYCLE = "UP-CANONICO";


export const HBCE_CURRENT_EVENT_FAMILY = "UP-EVT";


export const HBCE_TARGET_RELEASE = "SaaS Core v0.1";


export const HBCE_TARGET_CHECKPOINT_DATE = "2026-06-19T15:30:00+02:00";


export const HBCE_TARGET_CYCLE = "UP-MESE-5";


export const HBCE_SELF_PILOT_TENANT_ID = "HBCE-TENANT-SELF-PILOT";


export const HBCE_SELF_PILOT_TENANT_SLUG = "hbce-self-pilot";


export const HBCE_SELF_PILOT_TENANT_NAME =
  "HERMETICUM B.C.E. S.r.l. - Internal R&D Self-Pilot";


export const HBCE_SELF_PILOT_WORKSPACE_ID = "HBCE-WORKSPACE-RND";


export const HBCE_SELF_PILOT_WORKSPACE_SLUG = "rnd-saas-core";


export const HBCE_SELF_PILOT_WORKSPACE_NAME =
  "HBCE R&D SaaS Core Workspace";


export const HBCE_SELF_PILOT_SUBSCRIPTION_ID = "HBCE-SUB-SAAS-CORE-V01";


export const HBCE_SELF_PILOT_SUBSCRIPTION_TIER = "IPR";


export const HBCE_SELF_PILOT_ACCOUNT_ID = "HBCE-ACCOUNT-MANUEL-SELF-PILOT";


export const HBCE_SELF_PILOT_MEMBERSHIP_ID =
  "HBCE-MEMBER-MANUEL-SELF-PILOT";


export const HBCE_SELF_PILOT_HUMAN_IPR =
  "IPR-88505FE91013DCFE97C56ED1";


export const HBCE_SELF_PILOT_ENTITY = "Manuel Coletta";


export const HBCE_SELF_PILOT_CERTIFICATE_ID =
  "HBCE-CERT-4591712414205BC5F3A42894";


export const HBCE_SELF_PILOT_CARD_SERIAL =
  "IPR-CARD-88505FE91013DCFE97C56ED1";


export const HBCE_DATABASE_SCHEMA_TABLES = [
  "hbce_schema_migrations",
  "saas_tenants",
  "ipr_subjects",
  "saas_workspaces",
  "saas_workspace_memberships",
  "subscriptions",
  "ipr_auth_credentials",
  "ipr_auth_rate_limit_buckets",
  "ipr_password_recovery_grants",
  "ipr_sessions",
  "ipr_account_profiles",
  "ipr_onboarding_projection_receipts",
  "ipr_onboarding_projection_nonces",
  "ipr_onboarding_pre_profile_policy_records",
  "chat_threads",
  "chat_messages",
  "ipr_chat_memory_saves",
  "memory_records",
  "memory_registered_events",
  "evt_records",
  "opc_proofs",
  "runtime_audit_logs",
  "model_usage",
  "matrix_transformative_memory"
] as const;


export type HbceDatabaseSchemaTable =
  (typeof HBCE_DATABASE_SCHEMA_TABLES)[number];


export type HbceDatabaseSchemaDefinition = {
  version: typeof HBCE_DATABASE_SCHEMA_VERSION;
  persistenceMode: typeof HBCE_DATABASE_PERSISTENCE_MODE;
  boundary: string;
  legalCertificationBoundary: string;
  projectBirthDate: typeof HBCE_PROJECT_BIRTH_DATE;
  temporalRuntime: {
    certificateName: typeof HBCE_JOKER_C2_TEMPORAL_CERTIFICATE_NAME;
    birthAnchorLocal: typeof HBCE_JOKER_C2_BIRTH_ANCHOR_LOCAL;
    birthTimeZone: typeof HBCE_JOKER_C2_BIRTH_TIME_ZONE;
    birthAnchorUtc: typeof HBCE_JOKER_C2_BIRTH_ANCHOR_UTC;
    boundary: typeof HBCE_JOKER_C2_TEMPORAL_CERTIFICATE_BOUNDARY;
  };
  monthlyReference: typeof HBCE_MONTHLY_REFERENCE;
  currentOperationalEvt: typeof HBCE_CURRENT_OPERATIONAL_EVT;
  currentOperationalAiEvt: typeof HBCE_CURRENT_OPERATIONAL_AI_EVT;
  currentOperationalCycle: typeof HBCE_CURRENT_OPERATIONAL_CYCLE;
  currentEventFamily: typeof HBCE_CURRENT_EVENT_FAMILY;
  targetRelease: typeof HBCE_TARGET_RELEASE;
  targetCheckpointDate: typeof HBCE_TARGET_CHECKPOINT_DATE;
  targetCycle: typeof HBCE_TARGET_CYCLE;
  selfPilot: {
    tenantId: typeof HBCE_SELF_PILOT_TENANT_ID;
    tenantSlug: typeof HBCE_SELF_PILOT_TENANT_SLUG;
    tenantName: typeof HBCE_SELF_PILOT_TENANT_NAME;
    workspaceId: typeof HBCE_SELF_PILOT_WORKSPACE_ID;
    workspaceSlug: typeof HBCE_SELF_PILOT_WORKSPACE_SLUG;
    workspaceName: typeof HBCE_SELF_PILOT_WORKSPACE_NAME;
    subscriptionId: typeof HBCE_SELF_PILOT_SUBSCRIPTION_ID;
    subscriptionTier: typeof HBCE_SELF_PILOT_SUBSCRIPTION_TIER;
    accountId: typeof HBCE_SELF_PILOT_ACCOUNT_ID;
    membershipId: typeof HBCE_SELF_PILOT_MEMBERSHIP_ID;
    humanIpr: typeof HBCE_SELF_PILOT_HUMAN_IPR;
    entity: typeof HBCE_SELF_PILOT_ENTITY;
    certificateId: typeof HBCE_SELF_PILOT_CERTIFICATE_ID;
    cardSerial: typeof HBCE_SELF_PILOT_CARD_SERIAL;
  };
  tables: readonly HbceDatabaseSchemaTable[];
  sql: readonly string[];
};


export const HBCE_DATABASE_SCHEMA_SQL: readonly string[] = [
  `
CREATE TABLE IF NOT EXISTS hbce_schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  description TEXT NOT NULL,
  schema_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  legal_certification BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT hbce_schema_migrations_legal_certification_false
    CHECK (legal_certification = false)
);
`.trim(),


  `
CREATE TABLE IF NOT EXISTS saas_tenants (
  tenant_id TEXT PRIMARY KEY,
  tenant_slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  plan TEXT NOT NULL DEFAULT 'INTERNAL_R_AND_D',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  legal_certification BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT saas_tenants_legal_certification_false
    CHECK (legal_certification = false)
);
`.trim(),


  `
CREATE TABLE IF NOT EXISTS ipr_subjects (
  human_ipr TEXT PRIMARY KEY,
  entity TEXT NOT NULL,
  subject_kind TEXT NOT NULL DEFAULT 'BIOLOGICAL_SUBJECT',
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ,
  profile_hash TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  legal_certification BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT ipr_subjects_legal_certification_false
    CHECK (legal_certification = false)
);
`.trim(),


  `
CREATE TABLE IF NOT EXISTS saas_workspaces (
  workspace_id TEXT PRIMARY KEY,
  tenant_id TEXT,
  workspace_slug TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  legal_certification BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (tenant_id, workspace_slug),
  CONSTRAINT saas_workspaces_legal_certification_false
    CHECK (legal_certification = false)
);
`.trim(),


  `
CREATE TABLE IF NOT EXISTS saas_workspace_memberships (
  membership_id TEXT PRIMARY KEY,
  tenant_id TEXT,
  workspace_id TEXT,
  human_ipr TEXT,
  role TEXT NOT NULL DEFAULT 'OPERATOR',
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  legal_certification BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (workspace_id, human_ipr),
  CONSTRAINT saas_workspace_memberships_legal_certification_false
    CHECK (legal_certification = false)
);
`.trim(),


  `
CREATE TABLE IF NOT EXISTS subscriptions (
  subscription_id TEXT PRIMARY KEY,
  tenant_id TEXT,
  workspace_id TEXT,
  tier TEXT NOT NULL DEFAULT 'BASE',
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  billing_mode TEXT NOT NULL DEFAULT 'INTERNAL_R_AND_D',
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  model_limit_daily INTEGER,
  message_limit_daily INTEGER,
  memory_limit_records INTEGER,
  evt_required BOOLEAN NOT NULL DEFAULT true,
  opc_required BOOLEAN NOT NULL DEFAULT true,
  audit_required BOOLEAN NOT NULL DEFAULT true,
  model_usage_logging_required BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  legal_certification BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT subscriptions_limits_non_negative
    CHECK (
      (model_limit_daily IS NULL OR model_limit_daily >= 0) AND
      (message_limit_daily IS NULL OR message_limit_daily >= 0) AND
      (memory_limit_records IS NULL OR memory_limit_records >= 0)
    ),
  CONSTRAINT subscriptions_legal_certification_false
    CHECK (legal_certification = false)
);
`.trim(),


  `
CREATE TABLE IF NOT EXISTS ipr_auth_credentials (
  human_ipr TEXT PRIMARY KEY,
  password_algorithm TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  password_key_length INTEGER NOT NULL,
  password_created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  password_updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  password_last_verified_at TIMESTAMPTZ,
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  credential_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  legal_certification BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT ipr_auth_credentials_failed_attempts_non_negative
    CHECK (failed_attempts >= 0),
  CONSTRAINT ipr_auth_credentials_password_key_length_positive
    CHECK (password_key_length > 0),
  CONSTRAINT ipr_auth_credentials_legal_certification_false
    CHECK (legal_certification = false)
);
`.trim(),


  `
CREATE TABLE IF NOT EXISTS ipr_auth_rate_limit_buckets (
  bucket_key_hash TEXT PRIMARY KEY,
  bucket_kind TEXT NOT NULL,
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  window_started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_failed_at TIMESTAMPTZ,
  blocked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  bucket_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  legal_certification BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT ipr_auth_rate_limit_bucket_kind_valid
    CHECK (bucket_kind IN ('IP', 'IPR_IP')),
  CONSTRAINT ipr_auth_rate_limit_failed_attempts_non_negative
    CHECK (failed_attempts >= 0),
  CONSTRAINT ipr_auth_rate_limit_block_after_window
    CHECK (
      blocked_until IS NULL OR
      blocked_until > window_started_at
    ),
  CONSTRAINT ipr_auth_rate_limit_legal_certification_false
    CHECK (legal_certification = false)
);
`.trim(),


  `
CREATE INDEX IF NOT EXISTS
  ipr_auth_rate_limit_buckets_blocked_until_idx
ON ipr_auth_rate_limit_buckets (blocked_until);
`.trim(),


  `
CREATE INDEX IF NOT EXISTS
  ipr_auth_rate_limit_buckets_kind_updated_idx
ON ipr_auth_rate_limit_buckets (
  bucket_kind,
  updated_at
);
`.trim(),


  `
CREATE TABLE IF NOT EXISTS ipr_password_recovery_grants (
  grant_hash TEXT PRIMARY KEY,
  human_ipr_hash TEXT NOT NULL,

  scope TEXT NOT NULL DEFAULT 'PASSWORD_ROTATION',
  status TEXT NOT NULL DEFAULT 'ISSUED',

  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  not_before TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,

  consumed_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,

  issuer_kind TEXT NOT NULL DEFAULT
    'HBCE_SERVER_RECOVERY_AUTHORITY',

  issuer_authority_ref_hash TEXT NOT NULL,

  grant_payload JSONB NOT NULL DEFAULT '{}'::jsonb,

  legal_certification BOOLEAN NOT NULL DEFAULT false,

  CONSTRAINT ipr_password_recovery_grants_grant_hash_sha256
    CHECK (
      grant_hash ~ '^[0-9a-f]{64}$'
    ),

  CONSTRAINT ipr_password_recovery_grants_human_ipr_hash_hmac_sha256
    CHECK (
      human_ipr_hash ~ '^[0-9a-f]{64}$'
    ),

  CONSTRAINT ipr_password_recovery_grants_issuer_ref_hash_sha256
    CHECK (
      issuer_authority_ref_hash ~ '^[0-9a-f]{64}$'
    ),

  CONSTRAINT ipr_password_recovery_grants_scope_valid
    CHECK (
      scope = 'PASSWORD_ROTATION'
    ),

  CONSTRAINT ipr_password_recovery_grants_status_valid
    CHECK (
      status IN (
        'ISSUED',
        'CONSUMED',
        'REVOKED'
      )
    ),

  CONSTRAINT ipr_password_recovery_grants_expiry_valid
    CHECK (
      expires_at > issued_at
      AND not_before <= expires_at
    ),

  CONSTRAINT ipr_password_recovery_grants_lifecycle_valid
    CHECK (
      (
        status = 'ISSUED'
        AND consumed_at IS NULL
        AND revoked_at IS NULL
      )
      OR
      (
        status = 'CONSUMED'
        AND consumed_at IS NOT NULL
        AND revoked_at IS NULL
      )
      OR
      (
        status = 'REVOKED'
        AND revoked_at IS NOT NULL
        AND consumed_at IS NULL
      )
    ),

  CONSTRAINT ipr_password_recovery_grants_legal_certification_false
    CHECK (
      legal_certification = false
    )
);
`.trim(),


  `
CREATE INDEX IF NOT EXISTS
  ipr_password_recovery_grants_subject_status_idx
ON ipr_password_recovery_grants (
  human_ipr_hash,
  status,
  expires_at
);
`.trim(),


  `
CREATE INDEX IF NOT EXISTS
  ipr_password_recovery_grants_expiry_idx
ON ipr_password_recovery_grants (
  expires_at
);
`.trim(),


  `
CREATE TABLE IF NOT EXISTS ipr_sessions (
  session_id TEXT PRIMARY KEY,
  human_ipr TEXT NOT NULL,
  runtime_ipr TEXT NOT NULL DEFAULT 'IPR-AI-0001',
  token_hash TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ,
  device_label TEXT,
  user_agent_hash TEXT,
  ip_address_hash TEXT,
  session_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  legal_certification BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT ipr_sessions_expires_after_created
    CHECK (expires_at > created_at),
  CONSTRAINT ipr_sessions_legal_certification_false
    CHECK (legal_certification = false)
);
`.trim(),


  `
CREATE TABLE IF NOT EXISTS ipr_account_profiles (
  human_ipr TEXT PRIMARY KEY,
  tenant_id TEXT,
  workspace_id TEXT,
  account_id TEXT NOT NULL UNIQUE,
  entity TEXT NOT NULL,
  subject_kind TEXT NOT NULL DEFAULT 'BIOLOGICAL_SUBJECT',
  certificate_id TEXT NOT NULL,
  certificate_kind TEXT NOT NULL DEFAULT 'CERTIFICATE_09_OPERATIONAL',
  certificate_status TEXT NOT NULL DEFAULT 'UNKNOWN',
  certificate_scope JSONB NOT NULL DEFAULT '[]'::jsonb,
  card_serial TEXT,
  certificate_hash TEXT,
  access_decision TEXT NOT NULL DEFAULT 'AUTHENTICATION_REQUIRED',
  access_scope TEXT NOT NULL DEFAULT 'NO_ACCESS_SCOPE',
  identity_binding TEXT NOT NULL DEFAULT 'NO_AUTHENTICATED_IPR_SESSION',
  matrix_state TEXT NOT NULL DEFAULT 'MATRIX_LIMITED',
  semantic_memory_scope TEXT NOT NULL DEFAULT 'RUNTIME_ONLY',
  source TEXT NOT NULL DEFAULT 'UNVERIFIED_PROFILE_INPUT',
  handoff_hash TEXT,
  profile_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login_at TIMESTAMPTZ,
  profile_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  legal_certification BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT ipr_account_profiles_legal_certification_false
    CHECK (legal_certification = false)
);
`.trim(),


  `
ALTER TABLE IF EXISTS ipr_account_profiles
  ADD COLUMN IF NOT EXISTS tenant_id TEXT;
`.trim(),

  `
ALTER TABLE IF EXISTS ipr_account_profiles
  ADD COLUMN IF NOT EXISTS workspace_id TEXT;
`.trim(),

  `
ALTER TABLE IF EXISTS ipr_account_profiles
  ALTER COLUMN certificate_status SET DEFAULT 'UNKNOWN',
  ALTER COLUMN access_decision SET DEFAULT 'AUTHENTICATION_REQUIRED',
  ALTER COLUMN access_scope SET DEFAULT 'NO_ACCESS_SCOPE',
  ALTER COLUMN identity_binding SET DEFAULT 'NO_AUTHENTICATED_IPR_SESSION',
  ALTER COLUMN matrix_state SET DEFAULT 'MATRIX_LIMITED',
  ALTER COLUMN semantic_memory_scope SET DEFAULT 'RUNTIME_ONLY',
  ALTER COLUMN source SET DEFAULT 'UNVERIFIED_PROFILE_INPUT';
`.trim(),


  `
CREATE TABLE IF NOT EXISTS ipr_onboarding_projection_receipts (
  projection_key TEXT PRIMARY KEY,
  payload_hash TEXT NOT NULL,
  first_credential_id_hash TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  human_ipr_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  first_accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  replay_count INTEGER NOT NULL DEFAULT 0,
  legal_certification BOOLEAN NOT NULL DEFAULT false,

  CONSTRAINT ipr_onboarding_projection_receipts_projection_key_sha256
    CHECK (projection_key ~ '^[0-9a-f]{64}$'),

  CONSTRAINT ipr_onboarding_projection_receipts_payload_hash_sha256
    CHECK (payload_hash ~ '^[0-9a-f]{64}$'),

  CONSTRAINT ipr_onboarding_projection_receipts_credential_hash_sha256
    CHECK (first_credential_id_hash ~ '^[0-9a-f]{64}$'),

  CONSTRAINT ipr_onboarding_projection_receipts_human_ipr_hash_sha256
    CHECK (human_ipr_hash ~ '^[0-9a-f]{64}$'),

  CONSTRAINT ipr_onboarding_projection_receipts_replay_count_non_negative
    CHECK (replay_count >= 0),

  CONSTRAINT ipr_onboarding_projection_receipts_status_valid
    CHECK (
      status IN (
        'PENDING',
        'PROFILE_PERSISTED'
      )
    ),

  CONSTRAINT ipr_onboarding_projection_receipts_legal_certification_false
    CHECK (legal_certification = false)
);
`.trim(),


  `
CREATE INDEX IF NOT EXISTS idx_ipr_onboarding_projection_receipts_scope
  ON ipr_onboarding_projection_receipts(
    tenant_id,
    workspace_id
  );
`.trim(),


  `
CREATE INDEX IF NOT EXISTS idx_ipr_onboarding_projection_receipts_human_ipr_hash
  ON ipr_onboarding_projection_receipts(
    human_ipr_hash
  );
`.trim(),


  `
CREATE TABLE IF NOT EXISTS ipr_onboarding_projection_nonces (
  nonce_hash TEXT PRIMARY KEY,
  projection_key TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  credential_id_hash TEXT NOT NULL,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  legal_certification BOOLEAN NOT NULL DEFAULT false,

  CONSTRAINT ipr_onboarding_projection_nonces_nonce_hash_sha256
    CHECK (nonce_hash ~ '^[0-9a-f]{64}$'),

  CONSTRAINT ipr_onboarding_projection_nonces_projection_key_sha256
    CHECK (projection_key ~ '^[0-9a-f]{64}$'),

  CONSTRAINT ipr_onboarding_projection_nonces_payload_hash_sha256
    CHECK (payload_hash ~ '^[0-9a-f]{64}$'),

  CONSTRAINT ipr_onboarding_projection_nonces_credential_hash_sha256
    CHECK (credential_id_hash ~ '^[0-9a-f]{64}$'),

  CONSTRAINT ipr_onboarding_projection_nonces_legal_certification_false
    CHECK (legal_certification = false)
);
`.trim(),


  `
CREATE INDEX IF NOT EXISTS idx_ipr_onboarding_projection_nonces_projection_key
  ON ipr_onboarding_projection_nonces(
    projection_key
  );
`.trim(),


  `
CREATE TABLE IF NOT EXISTS ipr_onboarding_pre_profile_policy_records (
  policy_record_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  human_ipr_hash TEXT NOT NULL,
  projection_key TEXT NOT NULL,
  payload_hash TEXT NOT NULL,

  decision TEXT NOT NULL DEFAULT 'DENY',

  allow_joker_c2_access BOOLEAN NOT NULL DEFAULT false,
  verified_biological_subject BOOLEAN NOT NULL DEFAULT false,
  matrix_active BOOLEAN NOT NULL DEFAULT false,
  ipr_bound_memory BOOLEAN NOT NULL DEFAULT false,

  issuer_kind TEXT NOT NULL,
  issuer_credential_id_hash TEXT NOT NULL,
  issuer_authorization_ref_hash TEXT NOT NULL,

  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  not_before TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,

  supersedes_policy_record_id TEXT,
  revokes_policy_record_id TEXT,

  legal_certification BOOLEAN NOT NULL DEFAULT false,

  CONSTRAINT ipr_onboarding_pre_profile_policy_record_id_sha256
    CHECK (policy_record_id ~ '^[0-9a-f]{64}$'),

  CONSTRAINT ipr_onboarding_pre_profile_policy_human_ipr_hash_sha256
    CHECK (human_ipr_hash ~ '^[0-9a-f]{64}$'),

  CONSTRAINT ipr_onboarding_pre_profile_policy_projection_key_sha256
    CHECK (projection_key ~ '^[0-9a-f]{64}$'),

  CONSTRAINT ipr_onboarding_pre_profile_policy_payload_hash_sha256
    CHECK (payload_hash ~ '^[0-9a-f]{64}$'),

  CONSTRAINT ipr_onboarding_pre_profile_policy_issuer_credential_hash_sha256
    CHECK (issuer_credential_id_hash ~ '^[0-9a-f]{64}$'),

  CONSTRAINT ipr_onboarding_pre_profile_policy_issuer_authorization_hash_sha256
    CHECK (issuer_authorization_ref_hash ~ '^[0-9a-f]{64}$'),

  CONSTRAINT ipr_onboarding_pre_profile_policy_supersedes_hash_sha256
    CHECK (
      supersedes_policy_record_id IS NULL
      OR supersedes_policy_record_id ~ '^[0-9a-f]{64}$'
    ),

  CONSTRAINT ipr_onboarding_pre_profile_policy_revokes_hash_sha256
    CHECK (
      revokes_policy_record_id IS NULL
      OR revokes_policy_record_id ~ '^[0-9a-f]{64}$'
    ),

  CONSTRAINT ipr_onboarding_pre_profile_policy_scope_non_empty
    CHECK (
      btrim(tenant_id) <> ''
      AND btrim(workspace_id) <> ''
    ),

  CONSTRAINT ipr_onboarding_pre_profile_policy_issuer_kind_non_empty
    CHECK (btrim(issuer_kind) <> ''),

  CONSTRAINT ipr_onboarding_pre_profile_policy_decision_valid
    CHECK (
      decision IN (
        'GRANT',
        'DENY',
        'REVOKE'
      )
    ),

  CONSTRAINT ipr_onboarding_pre_profile_policy_grant_all_flags_true
    CHECK (
      decision <> 'GRANT'
      OR (
        allow_joker_c2_access = true
        AND verified_biological_subject = true
        AND matrix_active = true
        AND ipr_bound_memory = true
      )
    ),

  CONSTRAINT ipr_onboarding_pre_profile_policy_non_grant_flags_false
    CHECK (
      decision = 'GRANT'
      OR (
        allow_joker_c2_access = false
        AND verified_biological_subject = false
        AND matrix_active = false
        AND ipr_bound_memory = false
      )
    ),

  CONSTRAINT ipr_onboarding_pre_profile_policy_grant_expiry_required
    CHECK (
      decision <> 'GRANT'
      OR expires_at IS NOT NULL
    ),

  CONSTRAINT ipr_onboarding_pre_profile_policy_validity_window
    CHECK (
      expires_at IS NULL
      OR expires_at > COALESCE(not_before, issued_at)
    ),

  CONSTRAINT ipr_onboarding_pre_profile_policy_revoke_reference_required
    CHECK (
      decision <> 'REVOKE'
      OR revokes_policy_record_id IS NOT NULL
    ),

  CONSTRAINT ipr_onboarding_pre_profile_policy_non_revoke_reference_forbidden
    CHECK (
      decision = 'REVOKE'
      OR revokes_policy_record_id IS NULL
    ),

  CONSTRAINT ipr_onboarding_pre_profile_policy_genealogy_exclusive
    CHECK (
      NOT (
        supersedes_policy_record_id IS NOT NULL
        AND revokes_policy_record_id IS NOT NULL
      )
    ),

  CONSTRAINT ipr_onboarding_pre_profile_policy_no_self_supersession
    CHECK (
      supersedes_policy_record_id IS NULL
      OR supersedes_policy_record_id <> policy_record_id
    ),

  CONSTRAINT ipr_onboarding_pre_profile_policy_no_self_revocation
    CHECK (
      revokes_policy_record_id IS NULL
      OR revokes_policy_record_id <> policy_record_id
    ),

  CONSTRAINT ipr_onboarding_pre_profile_policy_legal_certification_false
    CHECK (legal_certification = false)
);
`.trim(),


  `
CREATE INDEX IF NOT EXISTS idx_ipr_onboarding_pre_profile_policy_subject_scope
  ON ipr_onboarding_pre_profile_policy_records(
    tenant_id,
    workspace_id,
    human_ipr_hash,
    issued_at DESC
  );
`.trim(),


  `
CREATE INDEX IF NOT EXISTS idx_ipr_onboarding_pre_profile_policy_projection
  ON ipr_onboarding_pre_profile_policy_records(
    projection_key,
    payload_hash,
    issued_at DESC
  );
`.trim(),


  `
CREATE INDEX IF NOT EXISTS idx_ipr_onboarding_pre_profile_policy_revokes
  ON ipr_onboarding_pre_profile_policy_records(
    revokes_policy_record_id
  );
`.trim(),


  `
CREATE INDEX IF NOT EXISTS idx_ipr_onboarding_pre_profile_policy_supersedes
  ON ipr_onboarding_pre_profile_policy_records(
    supersedes_policy_record_id
  );
`.trim(),


  `
CREATE OR REPLACE FUNCTION
  hbce_reject_ipr_onboarding_pre_profile_policy_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION
    'HBCE_APPEND_ONLY_PRE_PROFILE_POLICY_MUTATION_FORBIDDEN'
    USING ERRCODE = '55000';

  RETURN NULL;
END;
$$;
`.trim(),


  `
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname =
      'trg_ipr_onboarding_pre_profile_policy_append_only'
      AND tgrelid =
        'ipr_onboarding_pre_profile_policy_records'::regclass
  ) THEN

    CREATE TRIGGER
      trg_ipr_onboarding_pre_profile_policy_append_only
    BEFORE UPDATE OR DELETE
    ON ipr_onboarding_pre_profile_policy_records
    FOR EACH ROW
    EXECUTE FUNCTION
      hbce_reject_ipr_onboarding_pre_profile_policy_mutation();

  END IF;
END;
$$;
`.trim(),


  `
CREATE TABLE IF NOT EXISTS chat_threads (
  thread_id TEXT PRIMARY KEY,
  tenant_id TEXT,
  workspace_id TEXT,
  human_ipr TEXT,
  runtime_ipr TEXT NOT NULL DEFAULT 'IPR-AI-0001',
  session_id TEXT,
  title TEXT NOT NULL DEFAULT 'JOKER-C2 Chat',
  scope TEXT NOT NULL DEFAULT 'RUNTIME_ONLY',
  authority TEXT NOT NULL DEFAULT 'SESSION_RUNTIME_ONLY',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_message_at TIMESTAMPTZ,
  continuity_ref TEXT,
  last_evt_id TEXT,
  last_opc_proof_id TEXT,
  last_opc_chain_hash TEXT,
  recent_status TEXT NOT NULL DEFAULT 'ACTIVE',
  saved_to_ipr BOOLEAN NOT NULL DEFAULT false,
  saved_chat_id TEXT,
  saved_memory_id TEXT,
  memory_save_status TEXT NOT NULL DEFAULT 'NOT_SAVED',
  message_count INTEGER NOT NULL DEFAULT 0,
  pinned BOOLEAN NOT NULL DEFAULT false,
  archived BOOLEAN NOT NULL DEFAULT false,
  last_message_preview TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  legal_certification BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT chat_threads_message_count_non_negative
    CHECK (message_count >= 0),
  CONSTRAINT chat_threads_legal_certification_false
    CHECK (legal_certification = false)
);
`.trim(),


  `
CREATE TABLE IF NOT EXISTS chat_messages (
  message_id TEXT PRIMARY KEY,
  tenant_id TEXT,
  workspace_id TEXT,
  thread_id TEXT NOT NULL,
  human_ipr TEXT,
  runtime_ipr TEXT NOT NULL DEFAULT 'IPR-AI-0001',
  session_id TEXT,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  message_hash TEXT NOT NULL,
  evt_id TEXT,
  opc_proof_id TEXT,
  opc_chain_hash TEXT,
  temporal_certificate JSONB NOT NULL DEFAULT '{}'::jsonb,
  response_utc TIMESTAMPTZ,
  birth_anchor_local TEXT,
  birth_anchor_utc TIMESTAMPTZ,
  joker_lifetime TEXT,
  joker_life_seconds BIGINT,
  runtime_state TEXT,
  runtime_decision TEXT,
  generation_class TEXT,
  message_visibility TEXT NOT NULL DEFAULT 'THREAD',
  included_in_ipr_memory BOOLEAN NOT NULL DEFAULT false,
  save_candidate BOOLEAN NOT NULL DEFAULT false,
  source_save_id TEXT,
  content_hash_policy TEXT NOT NULL DEFAULT 'FULL_CONTENT_HASHED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  legal_certification BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT chat_messages_legal_certification_false
    CHECK (legal_certification = false)
);
`.trim(),


  `
CREATE TABLE IF NOT EXISTS ipr_chat_memory_saves (
  saved_chat_id TEXT PRIMARY KEY,
  tenant_id TEXT,
  workspace_id TEXT,
  subscription_id TEXT,
  account_id TEXT,
  human_ipr TEXT,
  runtime_ipr TEXT NOT NULL DEFAULT 'IPR-AI-0001',
  session_id TEXT,
  thread_id TEXT,
  memory_id TEXT,
  registered_event_id TEXT,
  evt_id TEXT,
  opc_proof_id TEXT,
  audit_id TEXT,
  usage_id TEXT,
  save_intent TEXT NOT NULL DEFAULT 'USER_EXPLICIT_SAVE_TO_IPR',
  save_scope TEXT NOT NULL DEFAULT 'IPR_BOUND',
  save_status TEXT NOT NULL DEFAULT 'SAVED',
  memory_status TEXT NOT NULL DEFAULT 'ACTIVE',
  memory_title TEXT NOT NULL DEFAULT 'Saved JOKER-C2 chat',
  memory_summary TEXT NOT NULL DEFAULT '',
  classification TEXT NOT NULL DEFAULT 'USER_SELECTED_CHAT_MEMORY',
  raw_content_saved BOOLEAN NOT NULL DEFAULT false,
  raw_content_policy TEXT NOT NULL DEFAULT 'SYNTHESIS_ONLY_BY_DEFAULT',
  save_raw BOOLEAN NOT NULL DEFAULT false,
  save_synthesis BOOLEAN NOT NULL DEFAULT true,
  reusable_in_prompt BOOLEAN NOT NULL DEFAULT true,
  selected_message_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  message_count INTEGER NOT NULL DEFAULT 0,
  save_hash TEXT,
  memory_hash TEXT,
  previous_save_hash TEXT,
  continuity_hash TEXT,
  temporal_certificate JSONB NOT NULL DEFAULT '{}'::jsonb,
  response_utc TIMESTAMPTZ,
  birth_anchor_local TEXT,
  birth_anchor_utc TIMESTAMPTZ,
  joker_lifetime TEXT,
  joker_life_seconds BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  legal_certification BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT ipr_chat_memory_saves_message_count_non_negative
    CHECK (message_count >= 0),
  CONSTRAINT ipr_chat_memory_saves_legal_certification_false
    CHECK (legal_certification = false)
);
`.trim(),


  `
CREATE TABLE IF NOT EXISTS memory_records (
  memory_id TEXT PRIMARY KEY,
  tenant_id TEXT,
  workspace_id TEXT,
  memory_key_hash TEXT NOT NULL,
  human_ipr TEXT,
  runtime_ipr TEXT NOT NULL DEFAULT 'IPR-AI-0001',
  session_id TEXT NOT NULL,
  thread_id TEXT,
  scope TEXT NOT NULL DEFAULT 'RUNTIME_ONLY',
  authority TEXT NOT NULL DEFAULT 'SESSION_RUNTIME_ONLY',
  persistence_mode TEXT NOT NULL DEFAULT 'DATABASE_PERSISTENT',
  memory_kind TEXT NOT NULL DEFAULT 'RUNTIME_MEMORY',
  memory_status TEXT NOT NULL DEFAULT 'ACTIVE',
  source_kind TEXT NOT NULL DEFAULT 'RUNTIME_MEMORY',
  source_thread_id TEXT,
  source_saved_chat_id TEXT,
  source_message_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  memory_title TEXT,
  memory_summary TEXT,
  save_raw BOOLEAN NOT NULL DEFAULT false,
  save_synthesis BOOLEAN NOT NULL DEFAULT true,
  reusable_in_prompt BOOLEAN NOT NULL DEFAULT false,
  classification TEXT,
  quality TEXT,
  threshold_detected BOOLEAN,
  semantic_terms JSONB NOT NULL DEFAULT '[]'::jsonb,
  memory_hash TEXT NOT NULL,
  memory_chain_hash TEXT,
  last_evt_id TEXT,
  last_opc_proof_id TEXT,
  last_opc_chain_hash TEXT,
  temporal_certificate JSONB NOT NULL DEFAULT '{}'::jsonb,
  response_utc TIMESTAMPTZ,
  birth_anchor_local TEXT,
  birth_anchor_utc TIMESTAMPTZ,
  joker_lifetime TEXT,
  joker_life_seconds BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  record_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  legal_certification BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT memory_records_legal_certification_false
    CHECK (legal_certification = false)
);
`.trim(),


  `
CREATE TABLE IF NOT EXISTS memory_registered_events (
  registered_event_id TEXT PRIMARY KEY,
  tenant_id TEXT,
  workspace_id TEXT,
  subscription_id TEXT,
  account_id TEXT,
  human_ipr TEXT,
  runtime_ipr TEXT DEFAULT 'IPR-AI-0001',
  memory_id TEXT,
  source_saved_chat_id TEXT,
  evt_id TEXT,
  opc_proof_id TEXT,
  audit_id TEXT,
  usage_id TEXT,
  event_name TEXT NOT NULL,
  event_scope TEXT DEFAULT 'IPR_BOUND',
  event_status TEXT DEFAULT 'ACTIVE',
  continuity_hash TEXT,
  temporal_certificate JSONB NOT NULL DEFAULT '{}'::jsonb,
  response_utc TIMESTAMPTZ,
  birth_anchor_local TEXT,
  birth_anchor_utc TIMESTAMPTZ,
  joker_lifetime TEXT,
  joker_life_seconds BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  legal_certification BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT memory_registered_events_legal_certification_false
    CHECK (legal_certification = false)
);
`.trim(),


  `
CREATE TABLE IF NOT EXISTS evt_records (
  evt_id TEXT PRIMARY KEY,
  event_id TEXT,
  prev_evt_id TEXT,
  prev_event_id TEXT,
  prev TEXT,
  tenant_id TEXT,
  workspace_id TEXT,
  subscription_id TEXT,
  human_ipr TEXT,
  subject_ipr TEXT,
  runtime_ipr TEXT DEFAULT 'IPR-AI-0001',
  session_id TEXT,
  thread_id TEXT,
  memory_id TEXT,
  opc_proof_id TEXT,
  audit_id TEXT,
  event_kind TEXT DEFAULT 'CHAT_OPERATION',
  event_type TEXT,
  kind TEXT,
  event_family TEXT DEFAULT 'UP-EVT',
  cycle TEXT DEFAULT 'UP-CANONICO',
  runtime_state TEXT,
  state TEXT,
  runtime_decision TEXT,
  decision TEXT,
  policy_decision TEXT,
  risk_level TEXT,
  memory_scope TEXT,
  context_class TEXT,
  intent_class TEXT,
  project_domain TEXT,
  hbce_module TEXT,
  evt_hash TEXT,
  event_hash TEXT,
  hash TEXT,
  public_hash TEXT,
  full_hash TEXT,
  chain_hash TEXT,
  input_hash TEXT,
  output_hash TEXT,
  policy_hash TEXT,
  memory_hash TEXT,
  temporal_certificate JSONB NOT NULL DEFAULT '{}'::jsonb,
  response_utc TIMESTAMPTZ,
  birth_anchor_local TEXT,
  birth_anchor_utc TIMESTAMPTZ,
  joker_lifetime TEXT,
  joker_life_seconds BIGINT,
  operational_context JSONB NOT NULL DEFAULT '{}'::jsonb,
  anchors JSONB NOT NULL DEFAULT '{}'::jsonb,
  trace JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  event_payload JSONB,
  legal_certification BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT evt_records_legal_certification_false
    CHECK (legal_certification = false)
);
`.trim(),


  `
CREATE TABLE IF NOT EXISTS opc_proofs (
  proof_id TEXT PRIMARY KEY,
  id TEXT,
  evt_id TEXT,
  event_id TEXT,
  tenant_id TEXT,
  workspace_id TEXT,
  subscription_id TEXT,
  human_ipr TEXT,
  subject_ipr TEXT,
  runtime_ipr TEXT DEFAULT 'IPR-AI-0001',
  session_id TEXT,
  thread_id TEXT,
  memory_id TEXT,
  kind TEXT DEFAULT 'OPERATIONAL_PROOF_RECORD',
  proof_kind TEXT,
  receipt_type TEXT DEFAULT 'OPC_TECHNICAL_PROOF_RECEIPT',
  persistence_mode TEXT DEFAULT 'DATABASE_READY',
  persistence_status TEXT DEFAULT 'DATABASE_CONTRACT_READY',
  provider TEXT,
  model TEXT,
  model_level TEXT,
  input_hash TEXT,
  output_hash TEXT,
  decision_hash TEXT,
  event_hash TEXT,
  evt_hash TEXT,
  engine_hash TEXT,
  identity_hash TEXT,
  handoff_hash TEXT,
  memory_hash TEXT,
  previous_proof_hash TEXT,
  chain_hash TEXT,
  audit_status TEXT DEFAULT 'NOT_REQUIRED',
  verification_status TEXT DEFAULT 'VERIFIABLE',
  runtime_state TEXT,
  runtime_decision TEXT,
  risk_class TEXT,
  policy_reference TEXT,
  project_domain TEXT,
  hbce_module TEXT,
  temporal_certificate JSONB NOT NULL DEFAULT '{}'::jsonb,
  response_utc TIMESTAMPTZ,
  birth_anchor_local TEXT,
  birth_anchor_utc TIMESTAMPTZ,
  joker_lifetime TEXT,
  joker_life_seconds BIGINT,
  operational_context JSONB NOT NULL DEFAULT '{}'::jsonb,
  identity JSONB NOT NULL DEFAULT '{}'::jsonb,
  engine JSONB NOT NULL DEFAULT '{}'::jsonb,
  event JSONB NOT NULL DEFAULT '{}'::jsonb,
  memory JSONB NOT NULL DEFAULT '{}'::jsonb,
  runtime JSONB NOT NULL DEFAULT '{}'::jsonb,
  proof JSONB NOT NULL DEFAULT '{}'::jsonb,
  audit JSONB NOT NULL DEFAULT '{}'::jsonb,
  verification JSONB NOT NULL DEFAULT '{}'::jsonb,
  boundary JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  proof_payload JSONB,
  legal_certification BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT opc_proofs_legal_certification_false
    CHECK (legal_certification = false)
);
`.trim(),


  `
CREATE TABLE IF NOT EXISTS runtime_audit_logs (
  audit_id TEXT PRIMARY KEY,
  source TEXT,
  request_id TEXT,
  tenant_id TEXT,
  workspace_id TEXT,
  subscription_id TEXT,
  human_ipr TEXT,
  organization_ipr TEXT,
  runtime_ipr TEXT DEFAULT 'IPR-AI-0001',
  session_id TEXT,
  thread_id TEXT,
  evt_id TEXT,
  evt_ref TEXT,
  evt_hash TEXT,
  opc_proof_id TEXT,
  opc_ref TEXT,
  opc_proof_hash TEXT,
  memory_id TEXT,
  memory_ref TEXT,
  memory_hash TEXT,
  identity_state TEXT,
  organization_state TEXT,
  workspace_state TEXT,
  audit_kind TEXT DEFAULT 'RUNTIME_DECISION',
  runtime_state TEXT DEFAULT 'UNKNOWN',
  runtime_decision TEXT DEFAULT 'UNKNOWN',
  audit_state TEXT DEFAULT 'NOT_REQUIRED',
  risk_level TEXT DEFAULT 'UNKNOWN',
  data_class TEXT,
  context_class TEXT,
  project_domain TEXT,
  hbce_module TEXT,
  model_level TEXT,
  selected_model TEXT,
  model_routing_reason TEXT,
  saas_tier TEXT,
  tier_decision TEXT,
  access_decision TEXT,
  cyber_relevance TEXT,
  c2_boundary TEXT,
  c2_decision TEXT,
  c2_allowed BOOLEAN,
  c2_fail_closed BOOLEAN,
  blocked BOOLEAN NOT NULL DEFAULT false,
  allowed BOOLEAN,
  fail_closed BOOLEAN NOT NULL DEFAULT false,
  human_oversight TEXT DEFAULT 'NOT_REQUIRED',
  memory_scope TEXT,
  memory_authority TEXT,
  persistence_mode TEXT,
  evt_required BOOLEAN,
  opc_required BOOLEAN,
  audit_required BOOLEAN,
  input_hash TEXT,
  output_hash TEXT,
  decision_hash TEXT,
  policy_hash TEXT,
  temporal_certificate JSONB NOT NULL DEFAULT '{}'::jsonb,
  response_utc TIMESTAMPTZ,
  birth_anchor_local TEXT,
  birth_anchor_utc TIMESTAMPTZ,
  joker_lifetime TEXT,
  joker_life_seconds BIGINT,
  audit_hash TEXT,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  audit_payload JSONB,
  legal_certification BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT runtime_audit_logs_legal_certification_false
    CHECK (legal_certification = false)
);
`.trim(),


  `
CREATE TABLE IF NOT EXISTS model_usage (
  usage_id TEXT PRIMARY KEY,
  source TEXT,
  provider TEXT DEFAULT 'UNKNOWN',
  tenant_id TEXT,
  workspace_id TEXT,
  subscription_id TEXT,
  human_ipr TEXT,
  organization_ipr TEXT,
  runtime_ipr TEXT DEFAULT 'IPR-AI-0001',
  session_id TEXT,
  thread_id TEXT,
  request_id TEXT,
  evt_id TEXT,
  evt_ref TEXT,
  evt_hash TEXT,
  opc_proof_id TEXT,
  opc_ref TEXT,
  opc_proof_hash TEXT,
  audit_id TEXT,
  selected_model TEXT,
  model TEXT,
  model_level TEXT DEFAULT 'UNKNOWN',
  model_routing_reason TEXT,
  routing_reason TEXT,
  saas_tier TEXT DEFAULT 'BASE',
  risk_level TEXT,
  runtime_decision TEXT,
  audit_state TEXT,
  operational_value TEXT,
  cyber_relevance TEXT,
  c2_boundary TEXT,
  proof_requirement TEXT,
  evt_required BOOLEAN,
  opc_required BOOLEAN,
  audit_required BOOLEAN,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  cached_input_tokens INTEGER DEFAULT 0,
  reasoning_tokens INTEGER DEFAULT 0,
  estimated_cost_units NUMERIC DEFAULT 0,
  estimated_cost_minor INTEGER DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EUR',
  accounting_mode TEXT,
  blocked BOOLEAN NOT NULL DEFAULT false,
  allowed BOOLEAN,
  fail_closed BOOLEAN NOT NULL DEFAULT false,
  persistence_mode TEXT,
  temporal_certificate JSONB NOT NULL DEFAULT '{}'::jsonb,
  response_utc TIMESTAMPTZ,
  birth_anchor_local TEXT,
  birth_anchor_utc TIMESTAMPTZ,
  joker_lifetime TEXT,
  joker_life_seconds BIGINT,
  usage_hash TEXT,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  usage_payload JSONB,
  legal_certification BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT model_usage_tokens_non_negative
    CHECK (
      COALESCE(input_tokens, 0) >= 0 AND
      COALESCE(output_tokens, 0) >= 0 AND
      COALESCE(total_tokens, 0) >= 0 AND
      COALESCE(cached_input_tokens, 0) >= 0 AND
      COALESCE(reasoning_tokens, 0) >= 0
    ),
  CONSTRAINT model_usage_cost_non_negative
    CHECK (
      COALESCE(estimated_cost_units, 0) >= 0 AND
      COALESCE(estimated_cost_minor, 0) >= 0
    ),
  CONSTRAINT model_usage_legal_certification_false
    CHECK (legal_certification = false)
);
`.trim(),


  `
CREATE TABLE IF NOT EXISTS matrix_transformative_memory (
  evaluation_id TEXT PRIMARY KEY,
  tenant_id TEXT,
  workspace_id TEXT,
  source_evt_id TEXT,
  source_opc_proof_id TEXT,
  human_ipr TEXT,
  runtime_ipr TEXT NOT NULL DEFAULT 'IPR-AI-0001',
  session_id TEXT,
  thread_id TEXT,
  memory_id TEXT,
  temporal_certificate JSONB NOT NULL DEFAULT '{}'::jsonb,
  response_utc TIMESTAMPTZ,
  birth_anchor_local TEXT,
  birth_anchor_utc TIMESTAMPTZ,
  joker_lifetime TEXT,
  joker_life_seconds BIGINT,
  evaluation_hash TEXT NOT NULL,
  memory_scope TEXT NOT NULL DEFAULT 'RUNTIME_ONLY',
  memory_authority TEXT NOT NULL DEFAULT 'SESSION_RUNTIME_ONLY',
  memory_persistence_mode TEXT NOT NULL DEFAULT 'DATABASE_PERSISTENT',
  insight_count INTEGER NOT NULL DEFAULT 0,
  accepted_fact_count INTEGER NOT NULL DEFAULT 0,
  rejected_trace_count INTEGER NOT NULL DEFAULT 0,
  attack_pattern_count INTEGER NOT NULL DEFAULT 0,
  architecture_lesson_count INTEGER NOT NULL DEFAULT 0,
  roadmap_requirement_count INTEGER NOT NULL DEFAULT 0,
  canonical_candidate_count INTEGER NOT NULL DEFAULT 0,
  database_requirement_count INTEGER NOT NULL DEFAULT 0,
  requires_database_persistent BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  legal_certification BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT matrix_transformative_memory_counts_non_negative
    CHECK (
      insight_count >= 0 AND
      accepted_fact_count >= 0 AND
      rejected_trace_count >= 0 AND
      attack_pattern_count >= 0 AND
      architecture_lesson_count >= 0 AND
      roadmap_requirement_count >= 0 AND
      canonical_candidate_count >= 0 AND
      database_requirement_count >= 0
    ),
  CONSTRAINT matrix_transformative_memory_legal_certification_false
    CHECK (legal_certification = false)
);
`.trim(),


  `
ALTER TABLE evt_records
  DROP CONSTRAINT IF EXISTS evt_records_runtime_state_check;
`.trim(),


  `
ALTER TABLE evt_records
  DROP CONSTRAINT IF EXISTS evt_records_runtime_decision_check;
`.trim(),


  `
ALTER TABLE evt_records
  DROP CONSTRAINT IF EXISTS evt_records_event_family_check;
`.trim(),


  `
ALTER TABLE runtime_audit_logs
  DROP CONSTRAINT IF EXISTS runtime_audit_logs_runtime_state_check;
`.trim(),


  `
ALTER TABLE runtime_audit_logs
  DROP CONSTRAINT IF EXISTS runtime_audit_logs_runtime_decision_check;
`.trim(),


  `
ALTER TABLE runtime_audit_logs
  DROP CONSTRAINT IF EXISTS runtime_audit_logs_risk_level_check;
`.trim(),


  `
ALTER TABLE runtime_audit_logs
  DROP CONSTRAINT IF EXISTS runtime_audit_logs_human_oversight_check;
`.trim(),


  `
ALTER TABLE runtime_audit_logs
  DROP CONSTRAINT IF EXISTS runtime_audit_logs_saas_tier_check;
`.trim(),


  `
ALTER TABLE model_usage
  DROP CONSTRAINT IF EXISTS model_usage_model_level_check;
`.trim(),


  `
ALTER TABLE model_usage
  DROP CONSTRAINT IF EXISTS model_usage_saas_tier_check;
`.trim(),





  `
ALTER TABLE chat_messages
  DROP CONSTRAINT IF EXISTS chat_messages_thread_id_fkey;
`.trim(),


  `
ALTER TABLE memory_records
  DROP CONSTRAINT IF EXISTS memory_records_thread_id_fkey;
`.trim(),


  `
ALTER TABLE memory_registered_events
  DROP CONSTRAINT IF EXISTS memory_registered_events_memory_id_fkey;
`.trim(),


  `
ALTER TABLE memory_registered_events
  DROP CONSTRAINT IF EXISTS memory_registered_events_evt_id_fkey;
`.trim(),


  `
ALTER TABLE memory_registered_events
  DROP CONSTRAINT IF EXISTS memory_registered_events_opc_proof_id_fkey;
`.trim(),


  `
ALTER TABLE evt_records
  DROP CONSTRAINT IF EXISTS evt_records_thread_id_fkey;
`.trim(),


  `
ALTER TABLE evt_records
  DROP CONSTRAINT IF EXISTS evt_records_memory_id_fkey;
`.trim(),


  `
ALTER TABLE evt_records
  DROP CONSTRAINT IF EXISTS evt_records_human_ipr_fkey;
`.trim(),


  `
ALTER TABLE opc_proofs
  DROP CONSTRAINT IF EXISTS opc_proofs_evt_id_fkey;
`.trim(),


  `
ALTER TABLE opc_proofs
  DROP CONSTRAINT IF EXISTS opc_proofs_thread_id_fkey;
`.trim(),


  `
ALTER TABLE runtime_audit_logs
  DROP CONSTRAINT IF EXISTS runtime_audit_logs_evt_id_fkey;
`.trim(),


  `
ALTER TABLE runtime_audit_logs
  DROP CONSTRAINT IF EXISTS runtime_audit_logs_opc_proof_id_fkey;
`.trim(),


  `
ALTER TABLE runtime_audit_logs
  DROP CONSTRAINT IF EXISTS runtime_audit_logs_thread_id_fkey;
`.trim(),


  `
ALTER TABLE model_usage
  DROP CONSTRAINT IF EXISTS model_usage_evt_id_fkey;
`.trim(),


  `
ALTER TABLE model_usage
  DROP CONSTRAINT IF EXISTS model_usage_opc_proof_id_fkey;
`.trim(),


  `
ALTER TABLE model_usage
  DROP CONSTRAINT IF EXISTS model_usage_thread_id_fkey;
`.trim(),


  `
ALTER TABLE evt_records
  ALTER COLUMN runtime_state DROP NOT NULL;
`.trim(),


  `
ALTER TABLE evt_records
  ALTER COLUMN runtime_decision DROP NOT NULL;
`.trim(),


  `
ALTER TABLE evt_records
  ADD COLUMN IF NOT EXISTS event_id TEXT;
`.trim(),


  `
ALTER TABLE evt_records
  ADD COLUMN IF NOT EXISTS prev_event_id TEXT;
`.trim(),


  `
ALTER TABLE evt_records
  ADD COLUMN IF NOT EXISTS prev TEXT;
`.trim(),


  `
ALTER TABLE evt_records
  ADD COLUMN IF NOT EXISTS subscription_id TEXT;
`.trim(),


  `
ALTER TABLE evt_records
  ADD COLUMN IF NOT EXISTS subject_ipr TEXT;
`.trim(),


  `
ALTER TABLE evt_records
  ADD COLUMN IF NOT EXISTS opc_proof_id TEXT;
`.trim(),


  `
ALTER TABLE evt_records
  ADD COLUMN IF NOT EXISTS audit_id TEXT;
`.trim(),


  `
ALTER TABLE evt_records
  ADD COLUMN IF NOT EXISTS event_type TEXT;
`.trim(),


  `
ALTER TABLE evt_records
  ADD COLUMN IF NOT EXISTS kind TEXT;
`.trim(),


  `
ALTER TABLE evt_records
  ADD COLUMN IF NOT EXISTS state TEXT;
`.trim(),


  `
ALTER TABLE evt_records
  ADD COLUMN IF NOT EXISTS decision TEXT;
`.trim(),


  `
ALTER TABLE evt_records
  ADD COLUMN IF NOT EXISTS policy_decision TEXT;
`.trim(),


  `
ALTER TABLE evt_records
  ADD COLUMN IF NOT EXISTS risk_level TEXT;
`.trim(),


  `
ALTER TABLE evt_records
  ADD COLUMN IF NOT EXISTS memory_scope TEXT;
`.trim(),


  `
ALTER TABLE evt_records
  ADD COLUMN IF NOT EXISTS evt_hash TEXT;
`.trim(),


  `
ALTER TABLE evt_records
  ADD COLUMN IF NOT EXISTS event_hash TEXT;
`.trim(),


  `
ALTER TABLE evt_records
  ADD COLUMN IF NOT EXISTS hash TEXT;
`.trim(),


  `
ALTER TABLE evt_records
  ADD COLUMN IF NOT EXISTS chain_hash TEXT;
`.trim(),


  `
ALTER TABLE evt_records
  ADD COLUMN IF NOT EXISTS input_hash TEXT;
`.trim(),


  `
ALTER TABLE evt_records
  ADD COLUMN IF NOT EXISTS output_hash TEXT;
`.trim(),


  `
ALTER TABLE evt_records
  ADD COLUMN IF NOT EXISTS policy_hash TEXT;
`.trim(),


  `
ALTER TABLE evt_records
  ADD COLUMN IF NOT EXISTS memory_hash TEXT;
`.trim(),


  `
ALTER TABLE evt_records
  ADD COLUMN IF NOT EXISTS anchors JSONB NOT NULL DEFAULT '{}'::jsonb;
`.trim(),


  `
ALTER TABLE evt_records
  ADD COLUMN IF NOT EXISTS trace JSONB NOT NULL DEFAULT '{}'::jsonb;
`.trim(),


  `
ALTER TABLE evt_records
  ADD COLUMN IF NOT EXISTS event_payload JSONB;
`.trim(),


  `
ALTER TABLE opc_proofs
  ALTER COLUMN input_hash DROP NOT NULL;
`.trim(),


  `
ALTER TABLE opc_proofs
  ALTER COLUMN output_hash DROP NOT NULL;
`.trim(),


  `
ALTER TABLE opc_proofs
  ALTER COLUMN decision_hash DROP NOT NULL;
`.trim(),


  `
ALTER TABLE opc_proofs
  ALTER COLUMN event_hash DROP NOT NULL;
`.trim(),


  `
ALTER TABLE opc_proofs
  ALTER COLUMN engine_hash DROP NOT NULL;
`.trim(),


  `
ALTER TABLE opc_proofs
  ALTER COLUMN identity_hash DROP NOT NULL;
`.trim(),


  `
ALTER TABLE opc_proofs
  ALTER COLUMN memory_hash DROP NOT NULL;
`.trim(),


  `
ALTER TABLE opc_proofs
  ALTER COLUMN chain_hash DROP NOT NULL;
`.trim(),


  `
ALTER TABLE opc_proofs
  ADD COLUMN IF NOT EXISTS id TEXT;
`.trim(),


  `
ALTER TABLE opc_proofs
  ADD COLUMN IF NOT EXISTS event_id TEXT;
`.trim(),


  `
ALTER TABLE opc_proofs
  ADD COLUMN IF NOT EXISTS subscription_id TEXT;
`.trim(),


  `
ALTER TABLE opc_proofs
  ADD COLUMN IF NOT EXISTS subject_ipr TEXT;
`.trim(),


  `
ALTER TABLE opc_proofs
  ADD COLUMN IF NOT EXISTS kind TEXT DEFAULT 'OPERATIONAL_PROOF_RECORD';
`.trim(),


  `
ALTER TABLE opc_proofs
  ADD COLUMN IF NOT EXISTS proof_kind TEXT;
`.trim(),


  `
ALTER TABLE opc_proofs
  ADD COLUMN IF NOT EXISTS receipt_type TEXT DEFAULT 'OPC_TECHNICAL_PROOF_RECEIPT';
`.trim(),


  `
ALTER TABLE opc_proofs
  ADD COLUMN IF NOT EXISTS provider TEXT;
`.trim(),


  `
ALTER TABLE opc_proofs
  ADD COLUMN IF NOT EXISTS model TEXT;
`.trim(),


  `
ALTER TABLE opc_proofs
  ADD COLUMN IF NOT EXISTS model_level TEXT;
`.trim(),


  `
ALTER TABLE opc_proofs
  ADD COLUMN IF NOT EXISTS evt_hash TEXT;
`.trim(),


  `
ALTER TABLE opc_proofs
  ADD COLUMN IF NOT EXISTS runtime_state TEXT;
`.trim(),


  `
ALTER TABLE opc_proofs
  ADD COLUMN IF NOT EXISTS runtime_decision TEXT;
`.trim(),


  `
ALTER TABLE opc_proofs
  ADD COLUMN IF NOT EXISTS risk_class TEXT;
`.trim(),


  `
ALTER TABLE opc_proofs
  ADD COLUMN IF NOT EXISTS policy_reference TEXT;
`.trim(),


  `
ALTER TABLE opc_proofs
  ADD COLUMN IF NOT EXISTS project_domain TEXT;
`.trim(),


  `
ALTER TABLE opc_proofs
  ADD COLUMN IF NOT EXISTS hbce_module TEXT;
`.trim(),


  `
ALTER TABLE opc_proofs
  ADD COLUMN IF NOT EXISTS identity JSONB NOT NULL DEFAULT '{}'::jsonb;
`.trim(),


  `
ALTER TABLE opc_proofs
  ADD COLUMN IF NOT EXISTS engine JSONB NOT NULL DEFAULT '{}'::jsonb;
`.trim(),


  `
ALTER TABLE opc_proofs
  ADD COLUMN IF NOT EXISTS event JSONB NOT NULL DEFAULT '{}'::jsonb;
`.trim(),


  `
ALTER TABLE opc_proofs
  ADD COLUMN IF NOT EXISTS memory JSONB NOT NULL DEFAULT '{}'::jsonb;
`.trim(),


  `
ALTER TABLE opc_proofs
  ADD COLUMN IF NOT EXISTS runtime JSONB NOT NULL DEFAULT '{}'::jsonb;
`.trim(),


  `
ALTER TABLE opc_proofs
  ADD COLUMN IF NOT EXISTS proof JSONB NOT NULL DEFAULT '{}'::jsonb;
`.trim(),


  `
ALTER TABLE opc_proofs
  ADD COLUMN IF NOT EXISTS audit JSONB NOT NULL DEFAULT '{}'::jsonb;
`.trim(),


  `
ALTER TABLE opc_proofs
  ADD COLUMN IF NOT EXISTS verification JSONB NOT NULL DEFAULT '{}'::jsonb;
`.trim(),


  `
ALTER TABLE opc_proofs
  ADD COLUMN IF NOT EXISTS boundary JSONB NOT NULL DEFAULT '{}'::jsonb;
`.trim(),


  `
ALTER TABLE opc_proofs
  ADD COLUMN IF NOT EXISTS proof_payload JSONB;
`.trim(),


  `
ALTER TABLE runtime_audit_logs
  ADD COLUMN IF NOT EXISTS source TEXT;
`.trim(),


  `
ALTER TABLE runtime_audit_logs
  ADD COLUMN IF NOT EXISTS request_id TEXT;
`.trim(),


  `
ALTER TABLE runtime_audit_logs
  ADD COLUMN IF NOT EXISTS organization_ipr TEXT;
`.trim(),


  `
ALTER TABLE runtime_audit_logs
  ADD COLUMN IF NOT EXISTS evt_ref TEXT;
`.trim(),


  `
ALTER TABLE runtime_audit_logs
  ADD COLUMN IF NOT EXISTS opc_ref TEXT;
`.trim(),


  `
ALTER TABLE runtime_audit_logs
  ADD COLUMN IF NOT EXISTS opc_proof_hash TEXT;
`.trim(),


  `
ALTER TABLE runtime_audit_logs
  ADD COLUMN IF NOT EXISTS memory_ref TEXT;
`.trim(),


  `
ALTER TABLE runtime_audit_logs
  ADD COLUMN IF NOT EXISTS identity_state TEXT;
`.trim(),


  `
ALTER TABLE runtime_audit_logs
  ADD COLUMN IF NOT EXISTS organization_state TEXT;
`.trim(),


  `
ALTER TABLE runtime_audit_logs
  ADD COLUMN IF NOT EXISTS workspace_state TEXT;
`.trim(),


  `
ALTER TABLE runtime_audit_logs
  ADD COLUMN IF NOT EXISTS audit_state TEXT DEFAULT 'NOT_REQUIRED';
`.trim(),


  `
ALTER TABLE runtime_audit_logs
  ADD COLUMN IF NOT EXISTS selected_model TEXT;
`.trim(),


  `
ALTER TABLE runtime_audit_logs
  ADD COLUMN IF NOT EXISTS model_routing_reason TEXT;
`.trim(),


  `
ALTER TABLE runtime_audit_logs
  ADD COLUMN IF NOT EXISTS tier_decision TEXT;
`.trim(),


  `
ALTER TABLE runtime_audit_logs
  ADD COLUMN IF NOT EXISTS access_decision TEXT;
`.trim(),


  `
ALTER TABLE runtime_audit_logs
  ADD COLUMN IF NOT EXISTS cyber_relevance TEXT;
`.trim(),


  `
ALTER TABLE runtime_audit_logs
  ADD COLUMN IF NOT EXISTS c2_decision TEXT;
`.trim(),


  `
ALTER TABLE runtime_audit_logs
  ADD COLUMN IF NOT EXISTS c2_allowed BOOLEAN;
`.trim(),


  `
ALTER TABLE runtime_audit_logs
  ADD COLUMN IF NOT EXISTS c2_fail_closed BOOLEAN;
`.trim(),


  `
ALTER TABLE runtime_audit_logs
  ADD COLUMN IF NOT EXISTS allowed BOOLEAN;
`.trim(),


  `
ALTER TABLE runtime_audit_logs
  ADD COLUMN IF NOT EXISTS memory_scope TEXT;
`.trim(),


  `
ALTER TABLE runtime_audit_logs
  ADD COLUMN IF NOT EXISTS memory_authority TEXT;
`.trim(),


  `
ALTER TABLE runtime_audit_logs
  ADD COLUMN IF NOT EXISTS persistence_mode TEXT;
`.trim(),


  `
ALTER TABLE runtime_audit_logs
  ADD COLUMN IF NOT EXISTS evt_required BOOLEAN;
`.trim(),


  `
ALTER TABLE runtime_audit_logs
  ADD COLUMN IF NOT EXISTS opc_required BOOLEAN;
`.trim(),


  `
ALTER TABLE runtime_audit_logs
  ADD COLUMN IF NOT EXISTS audit_required BOOLEAN;
`.trim(),


  `
ALTER TABLE runtime_audit_logs
  ADD COLUMN IF NOT EXISTS input_hash TEXT;
`.trim(),


  `
ALTER TABLE runtime_audit_logs
  ADD COLUMN IF NOT EXISTS output_hash TEXT;
`.trim(),


  `
ALTER TABLE runtime_audit_logs
  ADD COLUMN IF NOT EXISTS decision_hash TEXT;
`.trim(),


  `
ALTER TABLE runtime_audit_logs
  ADD COLUMN IF NOT EXISTS policy_hash TEXT;
`.trim(),


  `
ALTER TABLE runtime_audit_logs
  ADD COLUMN IF NOT EXISTS reason TEXT;
`.trim(),


  `
ALTER TABLE runtime_audit_logs
  ADD COLUMN IF NOT EXISTS audit_payload JSONB;
`.trim(),


  `
ALTER TABLE model_usage
  ALTER COLUMN model DROP NOT NULL;
`.trim(),


  `
ALTER TABLE model_usage
  ALTER COLUMN model_level DROP NOT NULL;
`.trim(),


  `
ALTER TABLE model_usage
  ALTER COLUMN saas_tier DROP NOT NULL;
`.trim(),


  `
ALTER TABLE model_usage
  ALTER COLUMN usage_hash DROP NOT NULL;
`.trim(),


  `
ALTER TABLE model_usage
  ADD COLUMN IF NOT EXISTS source TEXT;
`.trim(),


  `
ALTER TABLE model_usage
  ADD COLUMN IF NOT EXISTS organization_ipr TEXT;
`.trim(),


  `
ALTER TABLE model_usage
  ADD COLUMN IF NOT EXISTS request_id TEXT;
`.trim(),


  `
ALTER TABLE model_usage
  ADD COLUMN IF NOT EXISTS evt_ref TEXT;
`.trim(),


  `
ALTER TABLE model_usage
  ADD COLUMN IF NOT EXISTS opc_ref TEXT;
`.trim(),


  `
ALTER TABLE model_usage
  ADD COLUMN IF NOT EXISTS opc_proof_hash TEXT;
`.trim(),


  `
ALTER TABLE model_usage
  ADD COLUMN IF NOT EXISTS selected_model TEXT;
`.trim(),


  `
ALTER TABLE model_usage
  ADD COLUMN IF NOT EXISTS model_routing_reason TEXT;
`.trim(),


  `
ALTER TABLE model_usage
  ADD COLUMN IF NOT EXISTS risk_level TEXT;
`.trim(),


  `
ALTER TABLE model_usage
  ADD COLUMN IF NOT EXISTS runtime_decision TEXT;
`.trim(),


  `
ALTER TABLE model_usage
  ADD COLUMN IF NOT EXISTS audit_state TEXT;
`.trim(),


  `
ALTER TABLE model_usage
  ADD COLUMN IF NOT EXISTS operational_value TEXT;
`.trim(),


  `
ALTER TABLE model_usage
  ADD COLUMN IF NOT EXISTS cyber_relevance TEXT;
`.trim(),


  `
ALTER TABLE model_usage
  ADD COLUMN IF NOT EXISTS c2_boundary TEXT;
`.trim(),


  `
ALTER TABLE model_usage
  ADD COLUMN IF NOT EXISTS proof_requirement TEXT;
`.trim(),


  `
ALTER TABLE model_usage
  ADD COLUMN IF NOT EXISTS evt_required BOOLEAN;
`.trim(),


  `
ALTER TABLE model_usage
  ADD COLUMN IF NOT EXISTS opc_required BOOLEAN;
`.trim(),


  `
ALTER TABLE model_usage
  ADD COLUMN IF NOT EXISTS audit_required BOOLEAN;
`.trim(),


  `
ALTER TABLE model_usage
  ADD COLUMN IF NOT EXISTS cached_input_tokens INTEGER DEFAULT 0;
`.trim(),


  `
ALTER TABLE model_usage
  ADD COLUMN IF NOT EXISTS reasoning_tokens INTEGER DEFAULT 0;
`.trim(),


  `
ALTER TABLE model_usage
  ADD COLUMN IF NOT EXISTS estimated_cost_units NUMERIC DEFAULT 0;
`.trim(),


  `
ALTER TABLE model_usage
  ADD COLUMN IF NOT EXISTS accounting_mode TEXT;
`.trim(),


  `
ALTER TABLE model_usage
  ADD COLUMN IF NOT EXISTS allowed BOOLEAN;
`.trim(),


  `
ALTER TABLE model_usage
  ADD COLUMN IF NOT EXISTS fail_closed BOOLEAN NOT NULL DEFAULT false;
`.trim(),


  `
ALTER TABLE model_usage
  ADD COLUMN IF NOT EXISTS persistence_mode TEXT;
`.trim(),


  `
ALTER TABLE model_usage
  ADD COLUMN IF NOT EXISTS reason TEXT;
`.trim(),


  `
ALTER TABLE model_usage
  ADD COLUMN IF NOT EXISTS usage_payload JSONB;
`.trim(),






  `
ALTER TABLE chat_threads
  ADD COLUMN IF NOT EXISTS tenant_id TEXT;
`.trim(),

  `
ALTER TABLE chat_threads
  ADD COLUMN IF NOT EXISTS workspace_id TEXT;
`.trim(),

  `
ALTER TABLE chat_threads
  ADD COLUMN IF NOT EXISTS human_ipr TEXT;
`.trim(),

  `
ALTER TABLE chat_threads
  ADD COLUMN IF NOT EXISTS runtime_ipr TEXT NOT NULL DEFAULT 'IPR-AI-0001';
`.trim(),

  `
ALTER TABLE chat_threads
  ADD COLUMN IF NOT EXISTS session_id TEXT;
`.trim(),

  `
ALTER TABLE chat_threads
  ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT 'JOKER-C2 Chat';
`.trim(),

  `
ALTER TABLE chat_threads
  ADD COLUMN IF NOT EXISTS scope TEXT NOT NULL DEFAULT 'RUNTIME_ONLY';
`.trim(),

  `
ALTER TABLE chat_threads
  ADD COLUMN IF NOT EXISTS authority TEXT NOT NULL DEFAULT 'SESSION_RUNTIME_ONLY';
`.trim(),

  `
ALTER TABLE chat_threads
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
`.trim(),

  `
ALTER TABLE chat_threads
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
`.trim(),

  `
ALTER TABLE chat_threads
  ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMPTZ;
`.trim(),

  `
ALTER TABLE chat_threads
  ADD COLUMN IF NOT EXISTS continuity_ref TEXT;
`.trim(),

  `
ALTER TABLE chat_threads
  ADD COLUMN IF NOT EXISTS last_evt_id TEXT;
`.trim(),

  `
ALTER TABLE chat_threads
  ADD COLUMN IF NOT EXISTS last_opc_proof_id TEXT;
`.trim(),

  `
ALTER TABLE chat_threads
  ADD COLUMN IF NOT EXISTS last_opc_chain_hash TEXT;
`.trim(),

  `
ALTER TABLE chat_threads
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
`.trim(),

  `
ALTER TABLE chat_threads
  ADD COLUMN IF NOT EXISTS legal_certification BOOLEAN NOT NULL DEFAULT false;
`.trim(),

  `
ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS tenant_id TEXT;
`.trim(),

  `
ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS workspace_id TEXT;
`.trim(),

  `
ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS human_ipr TEXT;
`.trim(),

  `
ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS runtime_ipr TEXT NOT NULL DEFAULT 'IPR-AI-0001';
`.trim(),

  `
ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS session_id TEXT;
`.trim(),

  `
ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS message_hash TEXT;
`.trim(),

  `
ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS evt_id TEXT;
`.trim(),

  `
ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS opc_proof_id TEXT;
`.trim(),

  `
ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS opc_chain_hash TEXT;
`.trim(),

  `
ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS runtime_state TEXT;
`.trim(),

  `
ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS runtime_decision TEXT;
`.trim(),

  `
ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS generation_class TEXT;
`.trim(),

  `
ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
`.trim(),

  `
ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS legal_certification BOOLEAN NOT NULL DEFAULT false;
`.trim(),

  `
ALTER TABLE ipr_chat_memory_saves
  ADD COLUMN IF NOT EXISTS tenant_id TEXT;
`.trim(),

  `
ALTER TABLE ipr_chat_memory_saves
  ADD COLUMN IF NOT EXISTS workspace_id TEXT;
`.trim(),

  `
ALTER TABLE ipr_chat_memory_saves
  ADD COLUMN IF NOT EXISTS subscription_id TEXT;
`.trim(),

  `
ALTER TABLE ipr_chat_memory_saves
  ADD COLUMN IF NOT EXISTS account_id TEXT;
`.trim(),

  `
ALTER TABLE ipr_chat_memory_saves
  ADD COLUMN IF NOT EXISTS human_ipr TEXT;
`.trim(),

  `
ALTER TABLE ipr_chat_memory_saves
  ADD COLUMN IF NOT EXISTS runtime_ipr TEXT NOT NULL DEFAULT 'IPR-AI-0001';
`.trim(),

  `
ALTER TABLE ipr_chat_memory_saves
  ADD COLUMN IF NOT EXISTS session_id TEXT;
`.trim(),

  `
ALTER TABLE ipr_chat_memory_saves
  ADD COLUMN IF NOT EXISTS thread_id TEXT;
`.trim(),

  `
ALTER TABLE ipr_chat_memory_saves
  ADD COLUMN IF NOT EXISTS memory_id TEXT;
`.trim(),

  `
ALTER TABLE ipr_chat_memory_saves
  ADD COLUMN IF NOT EXISTS registered_event_id TEXT;
`.trim(),

  `
ALTER TABLE ipr_chat_memory_saves
  ADD COLUMN IF NOT EXISTS evt_id TEXT;
`.trim(),

  `
ALTER TABLE ipr_chat_memory_saves
  ADD COLUMN IF NOT EXISTS opc_proof_id TEXT;
`.trim(),

  `
ALTER TABLE ipr_chat_memory_saves
  ADD COLUMN IF NOT EXISTS audit_id TEXT;
`.trim(),

  `
ALTER TABLE ipr_chat_memory_saves
  ADD COLUMN IF NOT EXISTS usage_id TEXT;
`.trim(),

  `
ALTER TABLE ipr_chat_memory_saves
  ADD COLUMN IF NOT EXISTS save_intent TEXT NOT NULL DEFAULT 'USER_EXPLICIT_SAVE_TO_IPR';
`.trim(),

  `
ALTER TABLE ipr_chat_memory_saves
  ADD COLUMN IF NOT EXISTS save_scope TEXT NOT NULL DEFAULT 'IPR_BOUND';
`.trim(),

  `
ALTER TABLE ipr_chat_memory_saves
  ADD COLUMN IF NOT EXISTS save_status TEXT NOT NULL DEFAULT 'SAVED';
`.trim(),

  `
ALTER TABLE ipr_chat_memory_saves
  ADD COLUMN IF NOT EXISTS memory_status TEXT NOT NULL DEFAULT 'ACTIVE';
`.trim(),

  `
ALTER TABLE ipr_chat_memory_saves
  ADD COLUMN IF NOT EXISTS memory_title TEXT NOT NULL DEFAULT 'Saved JOKER-C2 chat';
`.trim(),

  `
ALTER TABLE ipr_chat_memory_saves
  ADD COLUMN IF NOT EXISTS memory_summary TEXT NOT NULL DEFAULT '';
`.trim(),

  `
ALTER TABLE ipr_chat_memory_saves
  ADD COLUMN IF NOT EXISTS classification TEXT NOT NULL DEFAULT 'USER_SELECTED_CHAT_MEMORY';
`.trim(),

  `
ALTER TABLE ipr_chat_memory_saves
  ADD COLUMN IF NOT EXISTS raw_content_saved BOOLEAN NOT NULL DEFAULT false;
`.trim(),

  `
ALTER TABLE ipr_chat_memory_saves
  ADD COLUMN IF NOT EXISTS raw_content_policy TEXT NOT NULL DEFAULT 'SYNTHESIS_ONLY_BY_DEFAULT';
`.trim(),

  `
ALTER TABLE ipr_chat_memory_saves
  ADD COLUMN IF NOT EXISTS save_raw BOOLEAN NOT NULL DEFAULT false;
`.trim(),

  `
ALTER TABLE ipr_chat_memory_saves
  ADD COLUMN IF NOT EXISTS save_synthesis BOOLEAN NOT NULL DEFAULT true;
`.trim(),

  `
ALTER TABLE ipr_chat_memory_saves
  ADD COLUMN IF NOT EXISTS reusable_in_prompt BOOLEAN NOT NULL DEFAULT true;
`.trim(),

  `
ALTER TABLE ipr_chat_memory_saves
  ADD COLUMN IF NOT EXISTS selected_message_ids JSONB NOT NULL DEFAULT '[]'::jsonb;
`.trim(),

  `
ALTER TABLE ipr_chat_memory_saves
  ADD COLUMN IF NOT EXISTS message_count INTEGER NOT NULL DEFAULT 0;
`.trim(),

  `
ALTER TABLE ipr_chat_memory_saves
  ADD COLUMN IF NOT EXISTS save_hash TEXT;
`.trim(),

  `
ALTER TABLE ipr_chat_memory_saves
  ADD COLUMN IF NOT EXISTS memory_hash TEXT;
`.trim(),

  `
ALTER TABLE ipr_chat_memory_saves
  ADD COLUMN IF NOT EXISTS previous_save_hash TEXT;
`.trim(),

  `
ALTER TABLE ipr_chat_memory_saves
  ADD COLUMN IF NOT EXISTS continuity_hash TEXT;
`.trim(),

  `
ALTER TABLE ipr_chat_memory_saves
  ADD COLUMN IF NOT EXISTS temporal_certificate JSONB NOT NULL DEFAULT '{}'::jsonb;
`.trim(),

  `
ALTER TABLE ipr_chat_memory_saves
  ADD COLUMN IF NOT EXISTS response_utc TIMESTAMPTZ;
`.trim(),

  `
ALTER TABLE ipr_chat_memory_saves
  ADD COLUMN IF NOT EXISTS birth_anchor_local TEXT;
`.trim(),

  `
ALTER TABLE ipr_chat_memory_saves
  ADD COLUMN IF NOT EXISTS birth_anchor_utc TIMESTAMPTZ;
`.trim(),

  `
ALTER TABLE ipr_chat_memory_saves
  ADD COLUMN IF NOT EXISTS joker_lifetime TEXT;
`.trim(),

  `
ALTER TABLE ipr_chat_memory_saves
  ADD COLUMN IF NOT EXISTS joker_life_seconds BIGINT;
`.trim(),

  `
ALTER TABLE ipr_chat_memory_saves
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
`.trim(),

  `
ALTER TABLE ipr_chat_memory_saves
  ADD COLUMN IF NOT EXISTS payload JSONB NOT NULL DEFAULT '{}'::jsonb;
`.trim(),

  `
ALTER TABLE ipr_chat_memory_saves
  ADD COLUMN IF NOT EXISTS legal_certification BOOLEAN NOT NULL DEFAULT false;
`.trim(),

  `
ALTER TABLE memory_records
  ADD COLUMN IF NOT EXISTS tenant_id TEXT;
`.trim(),

  `
ALTER TABLE memory_records
  ADD COLUMN IF NOT EXISTS workspace_id TEXT;
`.trim(),

  `
ALTER TABLE memory_records
  ADD COLUMN IF NOT EXISTS human_ipr TEXT;
`.trim(),

  `
ALTER TABLE memory_records
  ADD COLUMN IF NOT EXISTS runtime_ipr TEXT NOT NULL DEFAULT 'IPR-AI-0001';
`.trim(),

  `
ALTER TABLE memory_records
  ADD COLUMN IF NOT EXISTS thread_id TEXT;
`.trim(),

  `
ALTER TABLE memory_records
  ADD COLUMN IF NOT EXISTS memory_key_hash TEXT;
`.trim(),

  `
ALTER TABLE memory_records
  ADD COLUMN IF NOT EXISTS memory_hash TEXT;
`.trim(),

  `
ALTER TABLE memory_records
  ADD COLUMN IF NOT EXISTS memory_chain_hash TEXT;
`.trim(),

  `
ALTER TABLE memory_records
  ADD COLUMN IF NOT EXISTS last_evt_id TEXT;
`.trim(),

  `
ALTER TABLE memory_records
  ADD COLUMN IF NOT EXISTS last_opc_proof_id TEXT;
`.trim(),

  `
ALTER TABLE memory_records
  ADD COLUMN IF NOT EXISTS last_opc_chain_hash TEXT;
`.trim(),

  `
ALTER TABLE memory_records
  ADD COLUMN IF NOT EXISTS record_payload JSONB NOT NULL DEFAULT '{}'::jsonb;
`.trim(),

  `
ALTER TABLE memory_registered_events
  ADD COLUMN IF NOT EXISTS tenant_id TEXT;
`.trim(),

  `
ALTER TABLE memory_registered_events
  ADD COLUMN IF NOT EXISTS workspace_id TEXT;
`.trim(),

  `
ALTER TABLE memory_registered_events
  ADD COLUMN IF NOT EXISTS subscription_id TEXT;
`.trim(),

  `
ALTER TABLE memory_registered_events
  ADD COLUMN IF NOT EXISTS account_id TEXT;
`.trim(),

  `
ALTER TABLE memory_registered_events
  ADD COLUMN IF NOT EXISTS human_ipr TEXT;
`.trim(),

  `
ALTER TABLE memory_registered_events
  ADD COLUMN IF NOT EXISTS runtime_ipr TEXT DEFAULT 'IPR-AI-0001';
`.trim(),

  `
ALTER TABLE memory_registered_events
  ADD COLUMN IF NOT EXISTS memory_id TEXT;
`.trim(),

  `
ALTER TABLE memory_registered_events
  ADD COLUMN IF NOT EXISTS evt_id TEXT;
`.trim(),

  `
ALTER TABLE memory_registered_events
  ADD COLUMN IF NOT EXISTS opc_proof_id TEXT;
`.trim(),

  `
ALTER TABLE memory_registered_events
  ADD COLUMN IF NOT EXISTS audit_id TEXT;
`.trim(),

  `
ALTER TABLE memory_registered_events
  ADD COLUMN IF NOT EXISTS usage_id TEXT;
`.trim(),

  `
ALTER TABLE memory_registered_events
  ADD COLUMN IF NOT EXISTS event_scope TEXT DEFAULT 'IPR_BOUND';
`.trim(),

  `
ALTER TABLE memory_registered_events
  ADD COLUMN IF NOT EXISTS event_status TEXT DEFAULT 'ACTIVE';
`.trim(),

  `
ALTER TABLE memory_registered_events
  ADD COLUMN IF NOT EXISTS continuity_hash TEXT;
`.trim(),

  `
ALTER TABLE memory_registered_events
  ADD COLUMN IF NOT EXISTS payload JSONB NOT NULL DEFAULT '{}'::jsonb;
`.trim(),

  `
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema IN ('public', current_schema())
      AND table_name = 'ipr_chat_memory_saves'
      AND column_name = 'selected_message_ids'
      AND data_type = 'ARRAY'
  ) THEN
    ALTER TABLE ipr_chat_memory_saves
      ALTER COLUMN selected_message_ids TYPE JSONB
      USING to_jsonb(selected_message_ids);
  END IF;
END $$;
`.trim(),

  `
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema IN ('public', current_schema())
      AND table_name = 'memory_records'
      AND column_name = 'source_message_ids'
      AND data_type = 'ARRAY'
  ) THEN
    ALTER TABLE memory_records
      ALTER COLUMN source_message_ids TYPE JSONB
      USING to_jsonb(source_message_ids);
  END IF;
END $$;
`.trim(),

  `
ALTER TABLE ipr_chat_memory_saves
  ALTER COLUMN selected_message_ids SET DEFAULT '[]'::jsonb;
`.trim(),

  `
ALTER TABLE memory_records
  ALTER COLUMN source_message_ids SET DEFAULT '[]'::jsonb;
`.trim(),

  `
ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS temporal_certificate JSONB NOT NULL DEFAULT '{}'::jsonb;
`.trim(),

  `
ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS response_utc TIMESTAMPTZ;
`.trim(),

  `
ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS birth_anchor_local TEXT;
`.trim(),

  `
ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS birth_anchor_utc TIMESTAMPTZ;
`.trim(),

  `
ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS joker_lifetime TEXT;
`.trim(),

  `
ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS joker_life_seconds BIGINT;
`.trim(),

  `
ALTER TABLE chat_threads
  ADD COLUMN IF NOT EXISTS recent_status TEXT NOT NULL DEFAULT 'ACTIVE';
`.trim(),

  `
ALTER TABLE chat_threads
  ADD COLUMN IF NOT EXISTS saved_to_ipr BOOLEAN NOT NULL DEFAULT false;
`.trim(),

  `
ALTER TABLE chat_threads
  ADD COLUMN IF NOT EXISTS saved_chat_id TEXT;
`.trim(),

  `
ALTER TABLE chat_threads
  ADD COLUMN IF NOT EXISTS saved_memory_id TEXT;
`.trim(),

  `
ALTER TABLE chat_threads
  ADD COLUMN IF NOT EXISTS memory_save_status TEXT NOT NULL DEFAULT 'NOT_SAVED';
`.trim(),

  `
ALTER TABLE chat_threads
  ADD COLUMN IF NOT EXISTS message_count INTEGER NOT NULL DEFAULT 0;
`.trim(),

  `
ALTER TABLE chat_threads
  ADD COLUMN IF NOT EXISTS pinned BOOLEAN NOT NULL DEFAULT false;
`.trim(),

  `
ALTER TABLE chat_threads
  ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT false;
`.trim(),

  `
ALTER TABLE chat_threads
  ADD COLUMN IF NOT EXISTS last_message_preview TEXT;
`.trim(),

  `
ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS message_visibility TEXT NOT NULL DEFAULT 'THREAD';
`.trim(),

  `
ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS included_in_ipr_memory BOOLEAN NOT NULL DEFAULT false;
`.trim(),

  `
ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS save_candidate BOOLEAN NOT NULL DEFAULT false;
`.trim(),

  `
ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS source_save_id TEXT;
`.trim(),

  `
ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS content_hash_policy TEXT NOT NULL DEFAULT 'FULL_CONTENT_HASHED';
`.trim(),

  `
ALTER TABLE memory_records
  ADD COLUMN IF NOT EXISTS temporal_certificate JSONB NOT NULL DEFAULT '{}'::jsonb;
`.trim(),

  `
ALTER TABLE memory_records
  ADD COLUMN IF NOT EXISTS response_utc TIMESTAMPTZ;
`.trim(),

  `
ALTER TABLE memory_records
  ADD COLUMN IF NOT EXISTS birth_anchor_local TEXT;
`.trim(),

  `
ALTER TABLE memory_records
  ADD COLUMN IF NOT EXISTS birth_anchor_utc TIMESTAMPTZ;
`.trim(),

  `
ALTER TABLE memory_records
  ADD COLUMN IF NOT EXISTS joker_lifetime TEXT;
`.trim(),

  `
ALTER TABLE memory_records
  ADD COLUMN IF NOT EXISTS joker_life_seconds BIGINT;
`.trim(),

  `
ALTER TABLE memory_records
  ADD COLUMN IF NOT EXISTS memory_kind TEXT NOT NULL DEFAULT 'RUNTIME_MEMORY';
`.trim(),

  `
ALTER TABLE memory_records
  ADD COLUMN IF NOT EXISTS memory_status TEXT NOT NULL DEFAULT 'ACTIVE';
`.trim(),

  `
ALTER TABLE memory_records
  ADD COLUMN IF NOT EXISTS source_kind TEXT NOT NULL DEFAULT 'RUNTIME_MEMORY';
`.trim(),

  `
ALTER TABLE memory_records
  ADD COLUMN IF NOT EXISTS source_thread_id TEXT;
`.trim(),

  `
ALTER TABLE memory_records
  ADD COLUMN IF NOT EXISTS source_saved_chat_id TEXT;
`.trim(),

  `
ALTER TABLE memory_records
  ADD COLUMN IF NOT EXISTS source_message_ids JSONB NOT NULL DEFAULT '[]'::jsonb;
`.trim(),

  `
ALTER TABLE memory_records
  ADD COLUMN IF NOT EXISTS memory_title TEXT;
`.trim(),

  `
ALTER TABLE memory_records
  ADD COLUMN IF NOT EXISTS memory_summary TEXT;
`.trim(),

  `
ALTER TABLE memory_records
  ADD COLUMN IF NOT EXISTS save_raw BOOLEAN NOT NULL DEFAULT false;
`.trim(),

  `
ALTER TABLE memory_records
  ADD COLUMN IF NOT EXISTS save_synthesis BOOLEAN NOT NULL DEFAULT true;
`.trim(),

  `
ALTER TABLE memory_records
  ADD COLUMN IF NOT EXISTS reusable_in_prompt BOOLEAN NOT NULL DEFAULT false;
`.trim(),

  `
ALTER TABLE memory_records
  ADD COLUMN IF NOT EXISTS classification TEXT;
`.trim(),

  `
ALTER TABLE memory_records
  ADD COLUMN IF NOT EXISTS quality TEXT;
`.trim(),

  `
ALTER TABLE memory_records
  ADD COLUMN IF NOT EXISTS threshold_detected BOOLEAN;
`.trim(),

  `
ALTER TABLE memory_records
  ADD COLUMN IF NOT EXISTS semantic_terms JSONB NOT NULL DEFAULT '[]'::jsonb;
`.trim(),

  `
ALTER TABLE memory_registered_events
  ADD COLUMN IF NOT EXISTS source_saved_chat_id TEXT;
`.trim(),

  `
ALTER TABLE memory_registered_events
  ADD COLUMN IF NOT EXISTS temporal_certificate JSONB NOT NULL DEFAULT '{}'::jsonb;
`.trim(),

  `
ALTER TABLE memory_registered_events
  ADD COLUMN IF NOT EXISTS response_utc TIMESTAMPTZ;
`.trim(),

  `
ALTER TABLE memory_registered_events
  ADD COLUMN IF NOT EXISTS birth_anchor_local TEXT;
`.trim(),

  `
ALTER TABLE memory_registered_events
  ADD COLUMN IF NOT EXISTS birth_anchor_utc TIMESTAMPTZ;
`.trim(),

  `
ALTER TABLE memory_registered_events
  ADD COLUMN IF NOT EXISTS joker_lifetime TEXT;
`.trim(),

  `
ALTER TABLE memory_registered_events
  ADD COLUMN IF NOT EXISTS joker_life_seconds BIGINT;
`.trim(),

  `
ALTER TABLE evt_records
  ADD COLUMN IF NOT EXISTS temporal_certificate JSONB NOT NULL DEFAULT '{}'::jsonb;
`.trim(),

  `
ALTER TABLE evt_records
  ADD COLUMN IF NOT EXISTS response_utc TIMESTAMPTZ;
`.trim(),

  `
ALTER TABLE evt_records
  ADD COLUMN IF NOT EXISTS birth_anchor_local TEXT;
`.trim(),

  `
ALTER TABLE evt_records
  ADD COLUMN IF NOT EXISTS birth_anchor_utc TIMESTAMPTZ;
`.trim(),

  `
ALTER TABLE evt_records
  ADD COLUMN IF NOT EXISTS joker_lifetime TEXT;
`.trim(),

  `
ALTER TABLE evt_records
  ADD COLUMN IF NOT EXISTS joker_life_seconds BIGINT;
`.trim(),

  `
ALTER TABLE opc_proofs
  ADD COLUMN IF NOT EXISTS temporal_certificate JSONB NOT NULL DEFAULT '{}'::jsonb;
`.trim(),

  `
ALTER TABLE opc_proofs
  ADD COLUMN IF NOT EXISTS response_utc TIMESTAMPTZ;
`.trim(),

  `
ALTER TABLE opc_proofs
  ADD COLUMN IF NOT EXISTS birth_anchor_local TEXT;
`.trim(),

  `
ALTER TABLE opc_proofs
  ADD COLUMN IF NOT EXISTS birth_anchor_utc TIMESTAMPTZ;
`.trim(),

  `
ALTER TABLE opc_proofs
  ADD COLUMN IF NOT EXISTS joker_lifetime TEXT;
`.trim(),

  `
ALTER TABLE opc_proofs
  ADD COLUMN IF NOT EXISTS joker_life_seconds BIGINT;
`.trim(),

  `
ALTER TABLE runtime_audit_logs
  ADD COLUMN IF NOT EXISTS temporal_certificate JSONB NOT NULL DEFAULT '{}'::jsonb;
`.trim(),

  `
ALTER TABLE runtime_audit_logs
  ADD COLUMN IF NOT EXISTS response_utc TIMESTAMPTZ;
`.trim(),

  `
ALTER TABLE runtime_audit_logs
  ADD COLUMN IF NOT EXISTS birth_anchor_local TEXT;
`.trim(),

  `
ALTER TABLE runtime_audit_logs
  ADD COLUMN IF NOT EXISTS birth_anchor_utc TIMESTAMPTZ;
`.trim(),

  `
ALTER TABLE runtime_audit_logs
  ADD COLUMN IF NOT EXISTS joker_lifetime TEXT;
`.trim(),

  `
ALTER TABLE runtime_audit_logs
  ADD COLUMN IF NOT EXISTS joker_life_seconds BIGINT;
`.trim(),

  `
ALTER TABLE model_usage
  ADD COLUMN IF NOT EXISTS temporal_certificate JSONB NOT NULL DEFAULT '{}'::jsonb;
`.trim(),

  `
ALTER TABLE model_usage
  ADD COLUMN IF NOT EXISTS response_utc TIMESTAMPTZ;
`.trim(),

  `
ALTER TABLE model_usage
  ADD COLUMN IF NOT EXISTS birth_anchor_local TEXT;
`.trim(),

  `
ALTER TABLE model_usage
  ADD COLUMN IF NOT EXISTS birth_anchor_utc TIMESTAMPTZ;
`.trim(),

  `
ALTER TABLE model_usage
  ADD COLUMN IF NOT EXISTS joker_lifetime TEXT;
`.trim(),

  `
ALTER TABLE model_usage
  ADD COLUMN IF NOT EXISTS joker_life_seconds BIGINT;
`.trim(),

  `
ALTER TABLE matrix_transformative_memory
  ADD COLUMN IF NOT EXISTS temporal_certificate JSONB NOT NULL DEFAULT '{}'::jsonb;
`.trim(),

  `
ALTER TABLE matrix_transformative_memory
  ADD COLUMN IF NOT EXISTS response_utc TIMESTAMPTZ;
`.trim(),

  `
ALTER TABLE matrix_transformative_memory
  ADD COLUMN IF NOT EXISTS birth_anchor_local TEXT;
`.trim(),

  `
ALTER TABLE matrix_transformative_memory
  ADD COLUMN IF NOT EXISTS birth_anchor_utc TIMESTAMPTZ;
`.trim(),

  `
ALTER TABLE matrix_transformative_memory
  ADD COLUMN IF NOT EXISTS joker_lifetime TEXT;
`.trim(),

  `
ALTER TABLE matrix_transformative_memory
  ADD COLUMN IF NOT EXISTS joker_life_seconds BIGINT;
`.trim(),


  `
ALTER TABLE evt_records
  ADD COLUMN IF NOT EXISTS workspace_id TEXT;
`.trim(),

  `
ALTER TABLE evt_records
  ADD COLUMN IF NOT EXISTS event_family TEXT DEFAULT 'UP-EVT';
`.trim(),

  `
ALTER TABLE evt_records
  ADD COLUMN IF NOT EXISTS cycle TEXT DEFAULT 'UP-CANONICO';
`.trim(),

  `
ALTER TABLE opc_proofs
  ADD COLUMN IF NOT EXISTS workspace_id TEXT;
`.trim(),

  `
ALTER TABLE opc_proofs
  ADD COLUMN IF NOT EXISTS persistence_mode TEXT DEFAULT 'DATABASE_READY';
`.trim(),

  `
ALTER TABLE opc_proofs
  ADD COLUMN IF NOT EXISTS persistence_status TEXT DEFAULT 'DATABASE_CONTRACT_READY';
`.trim(),

  `
ALTER TABLE matrix_transformative_memory
  ADD COLUMN IF NOT EXISTS workspace_id TEXT;
`.trim(),


  `
CREATE INDEX IF NOT EXISTS idx_saas_tenants_slug
  ON saas_tenants(tenant_slug);
`.trim(),


  `
CREATE INDEX IF NOT EXISTS idx_saas_workspaces_tenant_slug
  ON saas_workspaces(tenant_id, workspace_slug);
`.trim(),


  `
CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant_status
  ON subscriptions(tenant_id, status);
`.trim(),


  `
CREATE INDEX IF NOT EXISTS idx_subscriptions_workspace_status
  ON subscriptions(workspace_id, status);
`.trim(),


  `
CREATE INDEX IF NOT EXISTS idx_saas_workspace_memberships_human_ipr
  ON saas_workspace_memberships(human_ipr);
`.trim(),


  `
CREATE INDEX IF NOT EXISTS idx_ipr_sessions_human_ipr
  ON ipr_sessions(human_ipr);
`.trim(),


  `
CREATE INDEX IF NOT EXISTS idx_ipr_sessions_token_hash
  ON ipr_sessions(token_hash);
`.trim(),


  `
CREATE INDEX IF NOT EXISTS idx_ipr_account_profiles_account_id
  ON ipr_account_profiles(account_id);
`.trim(),


  `
CREATE INDEX IF NOT EXISTS idx_ipr_account_profiles_tenant_workspace
  ON ipr_account_profiles(tenant_id, workspace_id);
`.trim(),


  `
CREATE INDEX IF NOT EXISTS idx_chat_threads_human_ipr_updated_at
  ON chat_threads(human_ipr, updated_at DESC);
`.trim(),


  `
CREATE INDEX IF NOT EXISTS idx_chat_threads_workspace_updated_at
  ON chat_threads(workspace_id, updated_at DESC);
`.trim(),


  `
CREATE INDEX IF NOT EXISTS idx_chat_messages_thread_created_at
  ON chat_messages(thread_id, created_at ASC);
`.trim(),


  `
CREATE INDEX IF NOT EXISTS idx_chat_threads_saved_to_ipr_updated_at
  ON chat_threads(saved_to_ipr, updated_at DESC);
`.trim(),


  `
CREATE INDEX IF NOT EXISTS idx_chat_threads_memory_save_status_updated_at
  ON chat_threads(memory_save_status, updated_at DESC);
`.trim(),


  `
CREATE INDEX IF NOT EXISTS idx_ipr_chat_memory_saves_human_ipr_created_at
  ON ipr_chat_memory_saves(human_ipr, created_at DESC);
`.trim(),


  `
CREATE INDEX IF NOT EXISTS idx_ipr_chat_memory_saves_workspace_created_at
  ON ipr_chat_memory_saves(tenant_id, workspace_id, created_at DESC);
`.trim(),


  `
CREATE INDEX IF NOT EXISTS idx_ipr_chat_memory_saves_thread_created_at
  ON ipr_chat_memory_saves(thread_id, created_at DESC);
`.trim(),


  `
CREATE INDEX IF NOT EXISTS idx_ipr_chat_memory_saves_memory_id
  ON ipr_chat_memory_saves(memory_id);
`.trim(),


  `
CREATE INDEX IF NOT EXISTS idx_ipr_chat_memory_saves_evt_id
  ON ipr_chat_memory_saves(evt_id);
`.trim(),


  `
CREATE INDEX IF NOT EXISTS idx_ipr_chat_memory_saves_opc_proof_id
  ON ipr_chat_memory_saves(opc_proof_id);
`.trim(),


  `
CREATE INDEX IF NOT EXISTS idx_memory_records_memory_key_hash
  ON memory_records(memory_key_hash);
`.trim(),


  `
CREATE INDEX IF NOT EXISTS idx_memory_records_human_ipr_updated_at
  ON memory_records(human_ipr, updated_at DESC);
`.trim(),


  `
CREATE INDEX IF NOT EXISTS idx_memory_records_tenant_workspace_updated_at
  ON memory_records(tenant_id, workspace_id, updated_at DESC);
`.trim(),


  `
CREATE INDEX IF NOT EXISTS idx_memory_records_source_thread_updated_at
  ON memory_records(source_thread_id, updated_at DESC);
`.trim(),


  `
CREATE INDEX IF NOT EXISTS idx_memory_records_source_saved_chat_updated_at
  ON memory_records(source_saved_chat_id, updated_at DESC);
`.trim(),


  `
CREATE INDEX IF NOT EXISTS idx_memory_records_reusable_prompt_updated_at
  ON memory_records(human_ipr, reusable_in_prompt, updated_at DESC);
`.trim(),


  `
CREATE INDEX IF NOT EXISTS idx_memory_registered_events_human_ipr_created_at
  ON memory_registered_events(human_ipr, created_at DESC);
`.trim(),


  `
CREATE INDEX IF NOT EXISTS idx_memory_registered_events_evt_id
  ON memory_registered_events(evt_id);
`.trim(),


  `
CREATE INDEX IF NOT EXISTS idx_memory_registered_events_workspace_created_at
  ON memory_registered_events(tenant_id, workspace_id, created_at DESC);
`.trim(),


  `
CREATE INDEX IF NOT EXISTS idx_memory_registered_events_event_name
  ON memory_registered_events(event_name);
`.trim(),


  `
CREATE UNIQUE INDEX IF NOT EXISTS idx_memory_registered_events_scope_name_uidx
  ON memory_registered_events(tenant_id, workspace_id, human_ipr, event_name);
`.trim(),


  `
CREATE INDEX IF NOT EXISTS idx_evt_records_evt_hash
  ON evt_records(evt_hash);
`.trim(),


  `
CREATE INDEX IF NOT EXISTS idx_evt_records_event_hash
  ON evt_records(event_hash);
`.trim(),


  `
CREATE INDEX IF NOT EXISTS idx_evt_records_chain_hash
  ON evt_records(chain_hash);
`.trim(),


  `
CREATE INDEX IF NOT EXISTS idx_evt_records_human_ipr_created_at
  ON evt_records(human_ipr, created_at DESC);
`.trim(),


  `
CREATE INDEX IF NOT EXISTS idx_evt_records_session_id_created_at
  ON evt_records(session_id, created_at DESC);
`.trim(),


  `
CREATE INDEX IF NOT EXISTS idx_evt_records_workspace_created_at
  ON evt_records(workspace_id, created_at DESC);
`.trim(),


  `
CREATE INDEX IF NOT EXISTS idx_evt_records_event_family_cycle
  ON evt_records(event_family, cycle);
`.trim(),


  `
CREATE INDEX IF NOT EXISTS idx_opc_proofs_evt_id
  ON opc_proofs(evt_id);
`.trim(),


  `
CREATE INDEX IF NOT EXISTS idx_opc_proofs_human_ipr_created_at
  ON opc_proofs(human_ipr, created_at DESC);
`.trim(),


  `
CREATE INDEX IF NOT EXISTS idx_opc_proofs_workspace_created_at
  ON opc_proofs(workspace_id, created_at DESC);
`.trim(),


  `
CREATE INDEX IF NOT EXISTS idx_opc_proofs_chain_hash
  ON opc_proofs(chain_hash);
`.trim(),


  `
CREATE INDEX IF NOT EXISTS idx_opc_proofs_persistence_mode
  ON opc_proofs(persistence_mode, persistence_status);
`.trim(),


  `
CREATE INDEX IF NOT EXISTS idx_runtime_audit_logs_human_ipr_created_at
  ON runtime_audit_logs(human_ipr, created_at DESC);
`.trim(),


  `
CREATE INDEX IF NOT EXISTS idx_runtime_audit_logs_workspace_created_at
  ON runtime_audit_logs(workspace_id, created_at DESC);
`.trim(),


  `
CREATE INDEX IF NOT EXISTS idx_runtime_audit_logs_evt_id
  ON runtime_audit_logs(evt_id);
`.trim(),


  `
CREATE INDEX IF NOT EXISTS idx_runtime_audit_logs_risk_decision
  ON runtime_audit_logs(risk_level, runtime_decision);
`.trim(),


  `
CREATE INDEX IF NOT EXISTS idx_model_usage_human_ipr_created_at
  ON model_usage(human_ipr, created_at DESC);
`.trim(),


  `
CREATE INDEX IF NOT EXISTS idx_model_usage_workspace_created_at
  ON model_usage(workspace_id, created_at DESC);
`.trim(),


  `
CREATE INDEX IF NOT EXISTS idx_model_usage_subscription_created_at
  ON model_usage(subscription_id, created_at DESC);
`.trim(),


  `
CREATE INDEX IF NOT EXISTS idx_model_usage_model_level
  ON model_usage(model, model_level);
`.trim(),


  `
CREATE INDEX IF NOT EXISTS idx_matrix_transformative_memory_human_ipr_created_at
  ON matrix_transformative_memory(human_ipr, created_at DESC);
`.trim(),


  `
CREATE INDEX IF NOT EXISTS idx_matrix_transformative_memory_workspace_created_at
  ON matrix_transformative_memory(workspace_id, created_at DESC);
`.trim(),





  `
CREATE INDEX IF NOT EXISTS idx_evt_records_response_utc
  ON evt_records(response_utc DESC);
`.trim(),


  `
CREATE INDEX IF NOT EXISTS idx_opc_proofs_response_utc
  ON opc_proofs(response_utc DESC);
`.trim(),


  `
CREATE INDEX IF NOT EXISTS idx_runtime_audit_logs_response_utc
  ON runtime_audit_logs(response_utc DESC);
`.trim(),


  `
CREATE INDEX IF NOT EXISTS idx_model_usage_response_utc
  ON model_usage(response_utc DESC);
`.trim(),


  `
INSERT INTO saas_tenants (
  tenant_id,
  tenant_slug,
  name,
  status,
  plan,
  metadata,
  legal_certification
)
VALUES (
  '${HBCE_SELF_PILOT_TENANT_ID}',
  '${HBCE_SELF_PILOT_TENANT_SLUG}',
  '${HBCE_SELF_PILOT_TENANT_NAME}',
  'ACTIVE',
  'INTERNAL_R_AND_D',
  jsonb_build_object(
    'project', 'Project HBCE R&D Transfer SaaS',
    'release', 'SaaS Core v0.1',
    'role', 'INTERNAL_SELF_PILOT_TENANT',
    'sourceEvent', 'UP-EVT-0016',
    'targetCheckpointDate', '2026-06-19T15:30:00+02:00',
    'legalCertification', false,
    'temporalCertificate', '${HBCE_JOKER_C2_TEMPORAL_CERTIFICATE_NAME}',
    'birthAnchorLocal', '${HBCE_JOKER_C2_BIRTH_ANCHOR_LOCAL}',
    'birthTimeZone', '${HBCE_JOKER_C2_BIRTH_TIME_ZONE}'
  ),
  false
)
ON CONFLICT (tenant_id) DO UPDATE SET
  tenant_slug = EXCLUDED.tenant_slug,
  name = EXCLUDED.name,
  status = EXCLUDED.status,
  plan = EXCLUDED.plan,
  metadata = EXCLUDED.metadata,
  updated_at = now(),
  legal_certification = false;
`.trim(),


  `
INSERT INTO ipr_subjects (
  human_ipr,
  entity,
  subject_kind,
  status,
  last_seen_at,
  metadata,
  legal_certification
)
VALUES (
  '${HBCE_SELF_PILOT_HUMAN_IPR}',
  '${HBCE_SELF_PILOT_ENTITY}',
  'BIOLOGICAL_SUBJECT',
  'ACTIVE',
  now(),
  jsonb_build_object(
    'tenantId', '${HBCE_SELF_PILOT_TENANT_ID}',
    'workspaceId', '${HBCE_SELF_PILOT_WORKSPACE_ID}',
    'accountId', '${HBCE_SELF_PILOT_ACCOUNT_ID}',
    'role', 'HBCE_INTERNAL_SELF_PILOT_OPERATOR',
    'runtimeAccess', 'JOKER_C2_ACCESS',
    'identityBinding', 'IPR_VERIFIED_BIOLOGICAL_SUBJECT',
    'legalCertification', false,
    'temporalCertificate', '${HBCE_JOKER_C2_TEMPORAL_CERTIFICATE_NAME}',
    'birthAnchorLocal', '${HBCE_JOKER_C2_BIRTH_ANCHOR_LOCAL}',
    'birthTimeZone', '${HBCE_JOKER_C2_BIRTH_TIME_ZONE}'
  ),
  false
)
ON CONFLICT (human_ipr) DO UPDATE SET
  entity = EXCLUDED.entity,
  subject_kind = EXCLUDED.subject_kind,
  status = EXCLUDED.status,
  last_seen_at = now(),
  metadata = EXCLUDED.metadata,
  updated_at = now(),
  legal_certification = false;
`.trim(),


  `
INSERT INTO saas_workspaces (
  workspace_id,
  tenant_id,
  workspace_slug,
  name,
  status,
  metadata,
  legal_certification
)
VALUES (
  '${HBCE_SELF_PILOT_WORKSPACE_ID}',
  '${HBCE_SELF_PILOT_TENANT_ID}',
  '${HBCE_SELF_PILOT_WORKSPACE_SLUG}',
  '${HBCE_SELF_PILOT_WORKSPACE_NAME}',
  'ACTIVE',
  jsonb_build_object(
    'project', 'Project HBCE R&D Transfer SaaS',
    'release', 'SaaS Core v0.1',
    'role', 'INTERNAL_R_AND_D_WORKSPACE',
    'runtime', 'JOKER-C2',
    'memoryTarget', 'DATABASE_PERSISTENT',
    'evtRequired', true,
    'opcRequired', true,
    'auditRequired', true,
    'modelUsageLoggingRequired', true,
    'legalCertification', false,
    'temporalCertificate', '${HBCE_JOKER_C2_TEMPORAL_CERTIFICATE_NAME}',
    'birthAnchorLocal', '${HBCE_JOKER_C2_BIRTH_ANCHOR_LOCAL}',
    'birthTimeZone', '${HBCE_JOKER_C2_BIRTH_TIME_ZONE}'
  ),
  false
)
ON CONFLICT (workspace_id) DO UPDATE SET
  tenant_id = EXCLUDED.tenant_id,
  workspace_slug = EXCLUDED.workspace_slug,
  name = EXCLUDED.name,
  status = EXCLUDED.status,
  metadata = EXCLUDED.metadata,
  updated_at = now(),
  legal_certification = false;
`.trim(),


  `
INSERT INTO saas_workspace_memberships (
  membership_id,
  tenant_id,
  workspace_id,
  human_ipr,
  role,
  status,
  metadata,
  legal_certification
)
VALUES (
  '${HBCE_SELF_PILOT_MEMBERSHIP_ID}',
  '${HBCE_SELF_PILOT_TENANT_ID}',
  '${HBCE_SELF_PILOT_WORKSPACE_ID}',
  '${HBCE_SELF_PILOT_HUMAN_IPR}',
  'OWNER_OPERATOR',
  'ACTIVE',
  jsonb_build_object(
    'project', 'Project HBCE R&D Transfer SaaS',
    'release', 'SaaS Core v0.1',
    'role', 'HBCE_INTERNAL_SELF_PILOT_OWNER_OPERATOR',
    'humanOversightRole', 'SELF_PILOT_REVIEWER',
    'legalCertification', false,
    'temporalCertificate', '${HBCE_JOKER_C2_TEMPORAL_CERTIFICATE_NAME}',
    'birthAnchorLocal', '${HBCE_JOKER_C2_BIRTH_ANCHOR_LOCAL}',
    'birthTimeZone', '${HBCE_JOKER_C2_BIRTH_TIME_ZONE}'
  ),
  false
)
ON CONFLICT (workspace_id, human_ipr) DO UPDATE SET
  membership_id = EXCLUDED.membership_id,
  tenant_id = EXCLUDED.tenant_id,
  role = EXCLUDED.role,
  status = EXCLUDED.status,
  metadata = EXCLUDED.metadata,
  updated_at = now(),
  legal_certification = false;
`.trim(),


  `
INSERT INTO subscriptions (
  subscription_id,
  tenant_id,
  workspace_id,
  tier,
  status,
  billing_mode,
  starts_at,
  model_limit_daily,
  message_limit_daily,
  memory_limit_records,
  evt_required,
  opc_required,
  audit_required,
  model_usage_logging_required,
  metadata,
  legal_certification
)
VALUES (
  '${HBCE_SELF_PILOT_SUBSCRIPTION_ID}',
  '${HBCE_SELF_PILOT_TENANT_ID}',
  '${HBCE_SELF_PILOT_WORKSPACE_ID}',
  '${HBCE_SELF_PILOT_SUBSCRIPTION_TIER}',
  'ACTIVE',
  'INTERNAL_R_AND_D',
  now(),
  NULL,
  NULL,
  NULL,
  true,
  true,
  true,
  true,
  jsonb_build_object(
    'project', 'Project HBCE R&D Transfer SaaS',
    'release', 'SaaS Core v0.1',
    'subscriptionRole', 'INTERNAL_SELF_PILOT_SUBSCRIPTION',
    'memoryTarget', 'DATABASE_PERSISTENT',
    'evtRequired', true,
    'opcRequired', true,
    'auditRequired', true,
    'modelUsageLoggingRequired', true,
    'legalCertification', false,
    'temporalCertificate', '${HBCE_JOKER_C2_TEMPORAL_CERTIFICATE_NAME}',
    'birthAnchorLocal', '${HBCE_JOKER_C2_BIRTH_ANCHOR_LOCAL}',
    'birthTimeZone', '${HBCE_JOKER_C2_BIRTH_TIME_ZONE}'
  ),
  false
)
ON CONFLICT (subscription_id) DO UPDATE SET
  tenant_id = EXCLUDED.tenant_id,
  workspace_id = EXCLUDED.workspace_id,
  tier = EXCLUDED.tier,
  status = EXCLUDED.status,
  billing_mode = EXCLUDED.billing_mode,
  evt_required = EXCLUDED.evt_required,
  opc_required = EXCLUDED.opc_required,
  audit_required = EXCLUDED.audit_required,
  model_usage_logging_required = EXCLUDED.model_usage_logging_required,
  metadata = EXCLUDED.metadata,
  updated_at = now(),
  legal_certification = false;
`.trim(),


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
  profile_payload,
  legal_certification
)
VALUES (
  '${HBCE_SELF_PILOT_HUMAN_IPR}',
  '${HBCE_SELF_PILOT_TENANT_ID}',
  '${HBCE_SELF_PILOT_WORKSPACE_ID}',
  '${HBCE_SELF_PILOT_ACCOUNT_ID}',
  '${HBCE_SELF_PILOT_ENTITY}',
  'BIOLOGICAL_SUBJECT',
  '${HBCE_SELF_PILOT_CERTIFICATE_ID}',
  'CERTIFICATE_09_OPERATIONAL',
  'ACTIVE',
  jsonb_build_array('JOKER_C2_ACCESS'),
  '${HBCE_SELF_PILOT_CARD_SERIAL}',
  NULL,
  'ACCESS_GRANTED',
  'JOKER_C2_ACCESS',
  'IPR_VERIFIED_BIOLOGICAL_SUBJECT',
  'MATRIX_ACTIVE',
  'IPR_BOUND',
  'HBCE_INTERNAL_SELF_PILOT_SEED',
  jsonb_build_object(
    'project', 'Project HBCE R&D Transfer SaaS',
    'release', 'SaaS Core v0.1',
    'tenantId', '${HBCE_SELF_PILOT_TENANT_ID}',
    'workspaceId', '${HBCE_SELF_PILOT_WORKSPACE_ID}',
    'subscriptionId', '${HBCE_SELF_PILOT_SUBSCRIPTION_ID}',
    'tier', '${HBCE_SELF_PILOT_SUBSCRIPTION_TIER}',
    'runtime', 'JOKER-C2',
    'memoryScope', 'IPR_BOUND',
    'memoryPersistence', 'DATABASE_PERSISTENT',
    'evtRequired', true,
    'opcRequired', true,
    'auditRequired', true,
    'modelUsageLoggingRequired', true,
    'legalCertification', false,
    'temporalCertificate', '${HBCE_JOKER_C2_TEMPORAL_CERTIFICATE_NAME}',
    'birthAnchorLocal', '${HBCE_JOKER_C2_BIRTH_ANCHOR_LOCAL}',
    'birthTimeZone', '${HBCE_JOKER_C2_BIRTH_TIME_ZONE}'
  ),
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
  profile_payload = EXCLUDED.profile_payload,
  updated_at = now(),
  legal_certification = false;
`.trim(),


  `
INSERT INTO hbce_schema_migrations (
  version,
  description,
  schema_payload,
  legal_certification
)
VALUES (
  'HBCE-IPR-DB-v1.10',
  'HBCE-IPR-DB-v1.10 additive migration extending HBCE-IPR-DB-v1.9 with durable minimized onboarding projection receipts and transport nonce-consumption records. Only deterministic hashes and operational tenant/workspace scope are introduced for replay protection; raw onboarding nonces, raw service credentials and raw biological identity material remain outside these replay tables. Existing account, session, memory, EVT, OPC, runtime audit, model usage, MATRIX and Temporal Runtime Certificate semantics remain unchanged.',
  jsonb_build_object(
    'projectBirthDate', '2026-01-19',
    'temporalCertificateName', '${HBCE_JOKER_C2_TEMPORAL_CERTIFICATE_NAME}',
    'birthAnchorLocal', '${HBCE_JOKER_C2_BIRTH_ANCHOR_LOCAL}',
    'birthTimeZone', '${HBCE_JOKER_C2_BIRTH_TIME_ZONE}',
    'birthAnchorUtc', '${HBCE_JOKER_C2_BIRTH_ANCHOR_UTC}',
    'temporalCertificateBoundary', '${HBCE_JOKER_C2_TEMPORAL_CERTIFICATE_BOUNDARY}',
    'projectBirthLabel', 'HBCE R&D / AI JOKER-C2 project birth date',
    'monthlyReference', 'UP-MESE-4',
    'currentOperationalEvt', 'UP-EVT-0016',
    'currentOperationalAiEvt', 'UP-EVT-0016-AI',
    'currentOperationalCycle', 'UP-CANONICO',
    'currentEventFamily', 'UP-EVT',
    'targetRelease', 'SaaS Core v0.1',
    'targetCheckpointDate', '2026-06-19T15:30:00+02:00',
    'targetCycle', 'UP-MESE-5',
    'persistenceMode', 'DATABASE_PERSISTENT',
    'schemaPolicy', 'runtime_tolerant_payload_first_with_self_pilot_seed',
    'selfPilot', jsonb_build_object(
      'tenantId', '${HBCE_SELF_PILOT_TENANT_ID}',
      'tenantSlug', '${HBCE_SELF_PILOT_TENANT_SLUG}',
      'workspaceId', '${HBCE_SELF_PILOT_WORKSPACE_ID}',
      'workspaceSlug', '${HBCE_SELF_PILOT_WORKSPACE_SLUG}',
      'subscriptionId', '${HBCE_SELF_PILOT_SUBSCRIPTION_ID}',
      'subscriptionTier', '${HBCE_SELF_PILOT_SUBSCRIPTION_TIER}',
      'accountId', '${HBCE_SELF_PILOT_ACCOUNT_ID}',
      'membershipId', '${HBCE_SELF_PILOT_MEMBERSHIP_ID}',
      'humanIpr', '${HBCE_SELF_PILOT_HUMAN_IPR}',
      'entity', '${HBCE_SELF_PILOT_ENTITY}',
      'certificateId', '${HBCE_SELF_PILOT_CERTIFICATE_ID}',
      'cardSerial', '${HBCE_SELF_PILOT_CARD_SERIAL}'
    ),
    'legalCertification', false,
    'tables', jsonb_build_array(
      'saas_tenants',
      'saas_workspaces',
      'saas_workspace_memberships',
      'subscriptions',
      'ipr_subjects',
      'ipr_auth_credentials',
      'ipr_sessions',
      'ipr_account_profiles',
      'ipr_onboarding_projection_receipts',
      'ipr_onboarding_projection_nonces',
      'chat_threads',
      'chat_messages',
      'ipr_chat_memory_saves',
      'memory_records',
      'memory_registered_events',
      'evt_records',
      'opc_proofs',
      'runtime_audit_logs',
      'model_usage',
      'matrix_transformative_memory'
    )
  ),
  false
)
ON CONFLICT (version) DO NOTHING;
`.trim(),


  `
INSERT INTO hbce_schema_migrations (
  version,
  description,
  schema_payload,
  legal_certification
)
VALUES (
  'HBCE-IPR-DB-v1.11',
  'HBCE-IPR-DB-v1.11 additive migration extending HBCE-IPR-DB-v1.10 with append-only minimized pre-profile policy records. Policy records bind tenant/workspace scope, replay projection evidence and explicit hashed issuer authorization context before account-profile candidate construction. GRANT is complete and time-bounded; DENY and REVOKE carry no authority flags. Raw Human IPR, raw onboarding nonces, raw service credentials, raw authorization references, biometric material and document content are not persisted. Policy records cannot create sessions, authorize runtime execution, bypass replay validation or directly persist account profiles. legalCertification remains false.',
  jsonb_build_object(
    'migrationFrom', 'HBCE-IPR-DB-v1.10',
    'migrationTo', 'HBCE-IPR-DB-v1.11',
    'migrationKind', 'ADDITIVE',
    'policyTable', 'ipr_onboarding_pre_profile_policy_records',
    'policyRecordMutability', 'APPEND_ONLY',
    'defaultDecision', 'DENY',
    'grantSemantics', 'ALL_FLAGS_TRUE_AND_TIME_BOUND',
    'nonGrantSemantics', 'ALL_FLAGS_FALSE',
    'revocationSemantics', 'NEW_RECORD_REFERENCES_PRIOR_RECORD',
    'requiredIssuerScope', 'internal:ipr-policy:issue',
    'policyRecordAuthority', 'SERVER_POLICY_CONTEXT_CANDIDATE_ONLY',
    'sessionCreationAuthority', false,
    'runtimeAuthorizationAuthority', false,
    'profileDirectWriteAuthority', false,
    'replayBypassAuthority', false,
    'legalCertification', false,
    'tables', jsonb_build_array(
      'ipr_onboarding_pre_profile_policy_records'
    )
  ),
  false
)
ON CONFLICT (version) DO NOTHING;
`.trim(),


  `
INSERT INTO hbce_schema_migrations (
  version,
  description,
  schema_payload,
  legal_certification
)
VALUES (
  'HBCE-IPR-DB-v1.12',
  'HBCE-IPR-DB-v1.12 additive migration extending HBCE-IPR-DB-v1.11 with persistent minimized authentication rate-limit buckets for distributed anti-abuse governance. The rate-limit layer persists opaque server-derived bucket hashes, counters and temporal block state only. Raw IP addresses, raw user-agent strings and duplicated raw Human IPR values are excluded. Rate-limit state cannot create sessions, grant runtime authority, bypass credential verification or create legal certification.',
  jsonb_build_object(
    'migrationFrom', 'HBCE-IPR-DB-v1.11',
    'migrationTo', 'HBCE-IPR-DB-v1.12',
    'migrationKind', 'ADDITIVE',
    'rateLimitTable',
      'ipr_auth_rate_limit_buckets',
    'bucketKinds', jsonb_build_array(
      'IP',
      'IPR_IP'
    ),
    'bucketKeyAuthority',
      'SERVER_DERIVED_OPAQUE_HASH_ONLY',
    'rawIpPersisted', false,
    'rawHumanIprPersisted', false,
    'rawUserAgentPersisted', false,
    'sessionCreationAuthority', false,
    'runtimeAuthorizationAuthority', false,
    'credentialBypassAuthority', false,
    'legalCertification', false,
    'tables', jsonb_build_array(
      'ipr_auth_rate_limit_buckets'
    )
  ),
  false
)
ON CONFLICT (version) DO NOTHING;
`.trim(),


  `
INSERT INTO hbce_schema_migrations (
  version,
  description,
  schema_payload,
  legal_certification
)
VALUES (
  'HBCE-IPR-DB-v1.13',

  'HBCE-IPR-DB-v1.13 additive migration extending HBCE-IPR-DB-v1.12 with persistent server-verifiable one-use password recovery grants. Recovery grants are subject-bound, purpose-bound, time-bounded and replay-resistant. Only opaque SHA-256 recovery-token hashes, HMAC-SHA256 subject and authority binding hashes and minimized lifecycle metadata are persisted. Raw recovery tokens, plaintext passwords and raw recovery authority secrets are excluded. Recovery grants cannot create authenticated sessions, cannot create new Human IPR credentials, cannot independently grant JOKER-C2 runtime authority and cannot create legal certification.',

  jsonb_build_object(
    'migrationFrom',
      'HBCE-IPR-DB-v1.12',

    'migrationTo',
      'HBCE-IPR-DB-v1.13',

    'migrationKind',
      'ADDITIVE',

    'recoveryGrantTable',
      'ipr_password_recovery_grants',

    'scope',
      'PASSWORD_ROTATION',

    'tokenPersistence',
      'SHA256_HASH_ONLY',

    'subjectBinding',
      'HUMAN_IPR_HMAC_SHA256',

    'issuerAuthorityBinding',
      'AUTHORITY_REF_HMAC_SHA256',

    'recoveryTokenBinding',
      'RANDOM_TOKEN_SHA256',

    'hashSecretEnvironmentVariable',
      'HBCE_PASSWORD_RECOVERY_HASH_SECRET',

    'oneUse',
      true,

    'replayProtection',
      true,

    'sessionCreationAuthority',
      false,

    'credentialCreationAuthority',
      false,

    'runtimeAuthorizationAuthority',
      false,

    'legalCertification',
      false,

    'tables',
      jsonb_build_array(
        'ipr_password_recovery_grants'
      )
  ),

  false
)
ON CONFLICT (version) DO NOTHING;
`.trim()
];


export const HBCE_DATABASE_SCHEMA: HbceDatabaseSchemaDefinition = {
  version: HBCE_DATABASE_SCHEMA_VERSION,
  persistenceMode: HBCE_DATABASE_PERSISTENCE_MODE,
  boundary: HBCE_DATABASE_SCHEMA_BOUNDARY,
  legalCertificationBoundary: HBCE_DATABASE_LEGAL_CERTIFICATION_BOUNDARY,
  projectBirthDate: HBCE_PROJECT_BIRTH_DATE,
  temporalRuntime: {
    certificateName: HBCE_JOKER_C2_TEMPORAL_CERTIFICATE_NAME,
    birthAnchorLocal: HBCE_JOKER_C2_BIRTH_ANCHOR_LOCAL,
    birthTimeZone: HBCE_JOKER_C2_BIRTH_TIME_ZONE,
    birthAnchorUtc: HBCE_JOKER_C2_BIRTH_ANCHOR_UTC,
    boundary: HBCE_JOKER_C2_TEMPORAL_CERTIFICATE_BOUNDARY
  },
  monthlyReference: HBCE_MONTHLY_REFERENCE,
  currentOperationalEvt: HBCE_CURRENT_OPERATIONAL_EVT,
  currentOperationalAiEvt: HBCE_CURRENT_OPERATIONAL_AI_EVT,
  currentOperationalCycle: HBCE_CURRENT_OPERATIONAL_CYCLE,
  currentEventFamily: HBCE_CURRENT_EVENT_FAMILY,
  targetRelease: HBCE_TARGET_RELEASE,
  targetCheckpointDate: HBCE_TARGET_CHECKPOINT_DATE,
  targetCycle: HBCE_TARGET_CYCLE,
  selfPilot: {
    tenantId: HBCE_SELF_PILOT_TENANT_ID,
    tenantSlug: HBCE_SELF_PILOT_TENANT_SLUG,
    tenantName: HBCE_SELF_PILOT_TENANT_NAME,
    workspaceId: HBCE_SELF_PILOT_WORKSPACE_ID,
    workspaceSlug: HBCE_SELF_PILOT_WORKSPACE_SLUG,
    workspaceName: HBCE_SELF_PILOT_WORKSPACE_NAME,
    subscriptionId: HBCE_SELF_PILOT_SUBSCRIPTION_ID,
    subscriptionTier: HBCE_SELF_PILOT_SUBSCRIPTION_TIER,
    accountId: HBCE_SELF_PILOT_ACCOUNT_ID,
    membershipId: HBCE_SELF_PILOT_MEMBERSHIP_ID,
    humanIpr: HBCE_SELF_PILOT_HUMAN_IPR,
    entity: HBCE_SELF_PILOT_ENTITY,
    certificateId: HBCE_SELF_PILOT_CERTIFICATE_ID,
    cardSerial: HBCE_SELF_PILOT_CARD_SERIAL
  },
  tables: HBCE_DATABASE_SCHEMA_TABLES,
  sql: HBCE_DATABASE_SCHEMA_SQL
};


export function buildHbceDatabaseSchemaSql(): string {
  return HBCE_DATABASE_SCHEMA_SQL.join("\n\n");
}


export function getHbceDatabaseSchemaDefinition(): HbceDatabaseSchemaDefinition {
  return HBCE_DATABASE_SCHEMA;
}


export function getHbceDatabaseTableNames(): HbceDatabaseSchemaTable[] {
  return [...HBCE_DATABASE_SCHEMA_TABLES];
}


export function isHbceDatabaseSchemaTable(
  value: string
): value is HbceDatabaseSchemaTable {
  return HBCE_DATABASE_SCHEMA_TABLES.includes(value as HbceDatabaseSchemaTable);
}


export function getHbceDatabaseSaasCoreContext() {
  return {
    schemaVersion: HBCE_DATABASE_SCHEMA_VERSION,
    persistenceMode: HBCE_DATABASE_PERSISTENCE_MODE,
    projectBirthDate: HBCE_PROJECT_BIRTH_DATE,
    projectBirthLabel: HBCE_PROJECT_BIRTH_LABEL,
    temporalRuntime: {
      certificateName: HBCE_JOKER_C2_TEMPORAL_CERTIFICATE_NAME,
      birthAnchorLocal: HBCE_JOKER_C2_BIRTH_ANCHOR_LOCAL,
      birthTimeZone: HBCE_JOKER_C2_BIRTH_TIME_ZONE,
      birthAnchorUtc: HBCE_JOKER_C2_BIRTH_ANCHOR_UTC,
      boundary: HBCE_JOKER_C2_TEMPORAL_CERTIFICATE_BOUNDARY
    },
    monthlyReference: HBCE_MONTHLY_REFERENCE,
    currentOperationalEvt: HBCE_CURRENT_OPERATIONAL_EVT,
    currentOperationalAiEvt: HBCE_CURRENT_OPERATIONAL_AI_EVT,
    currentOperationalCycle: HBCE_CURRENT_OPERATIONAL_CYCLE,
    currentEventFamily: HBCE_CURRENT_EVENT_FAMILY,
    targetRelease: HBCE_TARGET_RELEASE,
    targetCheckpointDate: HBCE_TARGET_CHECKPOINT_DATE,
    targetCycle: HBCE_TARGET_CYCLE,
    selfPilot: {
      tenantId: HBCE_SELF_PILOT_TENANT_ID,
      tenantSlug: HBCE_SELF_PILOT_TENANT_SLUG,
      tenantName: HBCE_SELF_PILOT_TENANT_NAME,
      workspaceId: HBCE_SELF_PILOT_WORKSPACE_ID,
      workspaceSlug: HBCE_SELF_PILOT_WORKSPACE_SLUG,
      workspaceName: HBCE_SELF_PILOT_WORKSPACE_NAME,
      subscriptionId: HBCE_SELF_PILOT_SUBSCRIPTION_ID,
      subscriptionTier: HBCE_SELF_PILOT_SUBSCRIPTION_TIER,
      accountId: HBCE_SELF_PILOT_ACCOUNT_ID,
      membershipId: HBCE_SELF_PILOT_MEMBERSHIP_ID,
      humanIpr: HBCE_SELF_PILOT_HUMAN_IPR,
      entity: HBCE_SELF_PILOT_ENTITY,
      certificateId: HBCE_SELF_PILOT_CERTIFICATE_ID,
      cardSerial: HBCE_SELF_PILOT_CARD_SERIAL
    },
    legalCertification: false,
    statement:
      "HBCE SaaS Core v0.1 requires DATABASE_PERSISTENT storage for account, subscription, chat continuity, explicit IPR chat memory saves, memory, registered memory events, EVT, OPC, runtime audit, model usage, tenant and workspace continuity. HBCE-IPR-DB-v1.13 preserves the JOKER-C2 Temporal Runtime Certificate, the HBCE-IPR-DB-v1.12 distributed authentication rate-limit contract and all prior account-profile compatibility while adding persistent server-verifiable one-use password recovery grants. Runtime persistence tables are tolerant during MVP/SaaS transition and preserve full reconstruction data in JSONB payloads. Explicit Save this chat to IPR is modeled outside /api/chat through ipr_chat_memory_saves, with tolerant migration support for already-existing chat_threads, chat_messages, memory_records and memory_registered_events tables, allowing /api/chat to answer while memory save operations remain auditable, consent-based and IPR-bound. HBCE-IPR-DB-v1.9 preserves the existing internal HERMETICUM B.C.E. self-pilot tenant, workspace, subscription and IPR account profile."
  };
}


export function getHbceJokerTemporalRuntimeCertificateDefinition() {
  return {
    certificateName: HBCE_JOKER_C2_TEMPORAL_CERTIFICATE_NAME,
    birthAnchorLocal: HBCE_JOKER_C2_BIRTH_ANCHOR_LOCAL,
    birthTimeZone: HBCE_JOKER_C2_BIRTH_TIME_ZONE,
    birthAnchorUtc: HBCE_JOKER_C2_BIRTH_ANCHOR_UTC,
    boundary: HBCE_JOKER_C2_TEMPORAL_CERTIFICATE_BOUNDARY,
    legalCertification: false
  };
}

