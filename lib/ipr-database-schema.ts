export const HBCE_DATABASE_SCHEMA_VERSION = "HBCE-IPR-DB-v1.2";

export const HBCE_DATABASE_SCHEMA_BOUNDARY =
  "HBCE database persistence stores operational identity, SaaS tenants, workspaces, memberships, subscriptions, sessions, chat continuity, IPR-bound memory, EVT records, OPC technical proof receipts, runtime audit logs, model usage logs and MATRIX Transformative Memory for runtime audit. It does not create legal certification, does not replace official identity documents, does not replace CIE, SPID, EUDI Wallet, passport, codice fiscale, eIDAS qualified trust services, qualified timestamping or public authority validation.";

export const HBCE_DATABASE_LEGAL_CERTIFICATION_BOUNDARY =
  "All HBCE database records remain technical-operational records. legal_certification must remain false unless a future legally recognized qualified trust service, public authority process or regulated certification workflow is explicitly integrated.";

export const HBCE_DATABASE_PERSISTENCE_MODE = "DATABASE_PERSISTENT";

export const HBCE_PROJECT_BIRTH_DATE = "2026-01-19";

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

export const HBCE_DATABASE_SCHEMA_TABLES = [
  "hbce_schema_migrations",
  "saas_tenants",
  "ipr_subjects",
  "saas_workspaces",
  "saas_workspace_memberships",
  "subscriptions",
  "ipr_auth_credentials",
  "ipr_sessions",
  "ipr_account_profiles",
  "chat_threads",
  "chat_messages",
  "memory_records",
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
  monthlyReference: typeof HBCE_MONTHLY_REFERENCE;
  currentOperationalEvt: typeof HBCE_CURRENT_OPERATIONAL_EVT;
  currentOperationalAiEvt: typeof HBCE_CURRENT_OPERATIONAL_AI_EVT;
  currentOperationalCycle: typeof HBCE_CURRENT_OPERATIONAL_CYCLE;
  currentEventFamily: typeof HBCE_CURRENT_EVENT_FAMILY;
  targetRelease: typeof HBCE_TARGET_RELEASE;
  targetCheckpointDate: typeof HBCE_TARGET_CHECKPOINT_DATE;
  targetCycle: typeof HBCE_TARGET_CYCLE;
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
  CONSTRAINT saas_tenants_status_check
    CHECK (status IN ('ACTIVE', 'SUSPENDED', 'REVOKED', 'ARCHIVED')),
  CONSTRAINT saas_tenants_plan_check
    CHECK (plan IN ('INTERNAL_R_AND_D', 'PILOT', 'PROFESSIONAL', 'ENTERPRISE', 'PUBLIC_SECTOR')),
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
  CONSTRAINT ipr_subjects_human_ipr_format
    CHECK (human_ipr LIKE 'IPR-%'),
  CONSTRAINT ipr_subjects_status_check
    CHECK (status IN ('ACTIVE', 'SUSPENDED', 'REVOKED', 'EXPIRED', 'UNKNOWN')),
  CONSTRAINT ipr_subjects_legal_certification_false
    CHECK (legal_certification = false)
);
`.trim(),

  `
CREATE TABLE IF NOT EXISTS saas_workspaces (
  workspace_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL
    REFERENCES saas_tenants(tenant_id)
    ON DELETE CASCADE,
  workspace_slug TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  legal_certification BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (tenant_id, workspace_slug),
  CONSTRAINT saas_workspaces_status_check
    CHECK (status IN ('ACTIVE', 'SUSPENDED', 'ARCHIVED')),
  CONSTRAINT saas_workspaces_legal_certification_false
    CHECK (legal_certification = false)
);
`.trim(),

  `
CREATE TABLE IF NOT EXISTS saas_workspace_memberships (
  membership_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL
    REFERENCES saas_tenants(tenant_id)
    ON DELETE CASCADE,
  workspace_id TEXT NOT NULL
    REFERENCES saas_workspaces(workspace_id)
    ON DELETE CASCADE,
  human_ipr TEXT NOT NULL
    REFERENCES ipr_subjects(human_ipr)
    ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'OPERATOR',
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  legal_certification BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (workspace_id, human_ipr),
  CONSTRAINT saas_workspace_memberships_role_check
    CHECK (role IN ('OWNER', 'ADMIN', 'OPERATOR', 'AUDITOR', 'VIEWER')),
  CONSTRAINT saas_workspace_memberships_status_check
    CHECK (status IN ('ACTIVE', 'SUSPENDED', 'REVOKED')),
  CONSTRAINT saas_workspace_memberships_legal_certification_false
    CHECK (legal_certification = false)
);
`.trim(),

  `
CREATE TABLE IF NOT EXISTS subscriptions (
  subscription_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL
    REFERENCES saas_tenants(tenant_id)
    ON DELETE CASCADE,
  workspace_id TEXT
    REFERENCES saas_workspaces(workspace_id)
    ON DELETE SET NULL,
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
  CONSTRAINT subscriptions_tier_check
    CHECK (tier IN ('BASE', 'IPR', 'PRO', 'GOVERNANCE', 'C2_DEFENSE', 'STRATEGIC')),
  CONSTRAINT subscriptions_status_check
    CHECK (status IN ('ACTIVE', 'TRIAL', 'PAUSED', 'SUSPENDED', 'CANCELLED', 'EXPIRED')),
  CONSTRAINT subscriptions_billing_mode_check
    CHECK (billing_mode IN ('INTERNAL_R_AND_D', 'PILOT', 'MANUAL_CONTRACT', 'STRIPE_READY', 'PUBLIC_SECTOR_CONTRACT')),
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
  human_ipr TEXT PRIMARY KEY
    REFERENCES ipr_subjects(human_ipr)
    ON DELETE CASCADE,
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
CREATE TABLE IF NOT EXISTS ipr_sessions (
  session_id TEXT PRIMARY KEY,
  human_ipr TEXT NOT NULL
    REFERENCES ipr_subjects(human_ipr)
    ON DELETE CASCADE,
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
  CONSTRAINT ipr_sessions_status_check
    CHECK (status IN ('ACTIVE', 'REVOKED', 'EXPIRED')),
  CONSTRAINT ipr_sessions_runtime_ipr_format
    CHECK (runtime_ipr LIKE 'IPR-%'),
  CONSTRAINT ipr_sessions_expires_after_created
    CHECK (expires_at > created_at),
  CONSTRAINT ipr_sessions_legal_certification_false
    CHECK (legal_certification = false)
);
`.trim(),

  `
CREATE TABLE IF NOT EXISTS ipr_account_profiles (
  human_ipr TEXT PRIMARY KEY
    REFERENCES ipr_subjects(human_ipr)
    ON DELETE CASCADE,
  tenant_id TEXT
    REFERENCES saas_tenants(tenant_id)
    ON DELETE SET NULL,
  workspace_id TEXT
    REFERENCES saas_workspaces(workspace_id)
    ON DELETE SET NULL,
  account_id TEXT NOT NULL UNIQUE,
  entity TEXT NOT NULL,
  subject_kind TEXT NOT NULL DEFAULT 'BIOLOGICAL_SUBJECT',
  certificate_id TEXT NOT NULL,
  certificate_kind TEXT NOT NULL DEFAULT 'CERTIFICATE_09_OPERATIONAL',
  certificate_status TEXT NOT NULL DEFAULT 'ACTIVE',
  certificate_scope JSONB NOT NULL DEFAULT '[]'::jsonb,
  card_serial TEXT,
  certificate_hash TEXT,
  access_decision TEXT NOT NULL DEFAULT 'ACCESS_GRANTED',
  access_scope TEXT NOT NULL DEFAULT 'JOKER_C2_ACCESS',
  identity_binding TEXT NOT NULL DEFAULT 'IPR_VERIFIED_BIOLOGICAL_SUBJECT',
  matrix_state TEXT NOT NULL DEFAULT 'MATRIX_ACTIVE',
  semantic_memory_scope TEXT NOT NULL DEFAULT 'IPR_BOUND',
  source TEXT NOT NULL DEFAULT 'HBCE_IPR_HANDOFF',
  handoff_hash TEXT,
  profile_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login_at TIMESTAMPTZ,
  profile_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  legal_certification BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT ipr_account_profiles_certificate_status_check
    CHECK (certificate_status IN ('ACTIVE', 'REVOKED', 'EXPIRED', 'SUSPENDED', 'UNKNOWN')),
  CONSTRAINT ipr_account_profiles_access_decision_check
    CHECK (access_decision IN ('ACCESS_GRANTED', 'ACCESS_DENIED', 'PENDING_SERVER_VALIDATION')),
  CONSTRAINT ipr_account_profiles_matrix_state_check
    CHECK (matrix_state IN ('MATRIX_ACTIVE', 'MATRIX_LIMITED')),
  CONSTRAINT ipr_account_profiles_semantic_memory_scope_check
    CHECK (semantic_memory_scope IN ('IPR_BOUND', 'RUNTIME_ONLY')),
  CONSTRAINT ipr_account_profiles_legal_certification_false
    CHECK (legal_certification = false)
);
`.trim(),

  `
CREATE TABLE IF NOT EXISTS chat_threads (
  thread_id TEXT PRIMARY KEY,
  tenant_id TEXT
    REFERENCES saas_tenants(tenant_id)
    ON DELETE SET NULL,
  workspace_id TEXT
    REFERENCES saas_workspaces(workspace_id)
    ON DELETE SET NULL,
  human_ipr TEXT
    REFERENCES ipr_subjects(human_ipr)
    ON DELETE SET NULL,
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
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  legal_certification BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT chat_threads_runtime_ipr_format
    CHECK (runtime_ipr LIKE 'IPR-%'),
  CONSTRAINT chat_threads_scope_check
    CHECK (scope IN ('IPR_BOUND', 'RUNTIME_ONLY')),
  CONSTRAINT chat_threads_authority_check
    CHECK (authority IN ('SERVER_RUNTIME_VALIDATED', 'SESSION_RUNTIME_ONLY')),
  CONSTRAINT chat_threads_legal_certification_false
    CHECK (legal_certification = false)
);
`.trim(),

  `
CREATE TABLE IF NOT EXISTS chat_messages (
  message_id TEXT PRIMARY KEY,
  tenant_id TEXT
    REFERENCES saas_tenants(tenant_id)
    ON DELETE SET NULL,
  workspace_id TEXT
    REFERENCES saas_workspaces(workspace_id)
    ON DELETE SET NULL,
  thread_id TEXT NOT NULL
    REFERENCES chat_threads(thread_id)
    ON DELETE CASCADE,
  human_ipr TEXT
    REFERENCES ipr_subjects(human_ipr)
    ON DELETE SET NULL,
  runtime_ipr TEXT NOT NULL DEFAULT 'IPR-AI-0001',
  session_id TEXT,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  message_hash TEXT NOT NULL,
  evt_id TEXT,
  opc_proof_id TEXT,
  opc_chain_hash TEXT,
  runtime_state TEXT,
  runtime_decision TEXT,
  generation_class TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  legal_certification BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT chat_messages_role_check
    CHECK (role IN ('user', 'assistant', 'system', 'runtime', 'tool')),
  CONSTRAINT chat_messages_runtime_state_check
    CHECK (
      runtime_state IS NULL OR
      runtime_state IN ('OPERATIONAL', 'DEGRADED', 'BLOCKED', 'INVALID', 'AUDIT_ONLY', 'MAINTENANCE', 'UNKNOWN')
    ),
  CONSTRAINT chat_messages_runtime_decision_check
    CHECK (
      runtime_decision IS NULL OR
      runtime_decision IN ('ALLOW', 'BLOCK', 'ESCALATE', 'DEGRADE', 'AUDIT', 'NOOP', 'UNKNOWN')
    ),
  CONSTRAINT chat_messages_legal_certification_false
    CHECK (legal_certification = false)
);
`.trim(),

  `
CREATE TABLE IF NOT EXISTS memory_records (
  memory_id TEXT PRIMARY KEY,
  tenant_id TEXT
    REFERENCES saas_tenants(tenant_id)
    ON DELETE SET NULL,
  workspace_id TEXT
    REFERENCES saas_workspaces(workspace_id)
    ON DELETE SET NULL,
  memory_key_hash TEXT NOT NULL,
  human_ipr TEXT
    REFERENCES ipr_subjects(human_ipr)
    ON DELETE SET NULL,
  runtime_ipr TEXT NOT NULL DEFAULT 'IPR-AI-0001',
  session_id TEXT NOT NULL,
  thread_id TEXT
    REFERENCES chat_threads(thread_id)
    ON DELETE SET NULL,
  scope TEXT NOT NULL DEFAULT 'RUNTIME_ONLY',
  authority TEXT NOT NULL DEFAULT 'SESSION_RUNTIME_ONLY',
  persistence_mode TEXT NOT NULL DEFAULT 'DATABASE_PERSISTENT',
  memory_hash TEXT NOT NULL,
  memory_chain_hash TEXT,
  last_evt_id TEXT,
  last_opc_proof_id TEXT,
  last_opc_chain_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  record_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  legal_certification BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT memory_records_scope_check
    CHECK (scope IN ('IPR_BOUND', 'RUNTIME_ONLY')),
  CONSTRAINT memory_records_authority_check
    CHECK (authority IN ('SERVER_RUNTIME_VALIDATED', 'SESSION_RUNTIME_ONLY')),
  CONSTRAINT memory_records_persistence_mode_check
    CHECK (persistence_mode IN ('PROCESS_MEMORY_MVP', 'DATABASE_READY', 'DATABASE_PERSISTENT', 'EXTERNAL_ADAPTER')),
  CONSTRAINT memory_records_legal_certification_false
    CHECK (legal_certification = false)
);
`.trim(),

  `
CREATE TABLE IF NOT EXISTS evt_records (
  evt_id TEXT PRIMARY KEY,
  prev_evt_id TEXT,
  tenant_id TEXT
    REFERENCES saas_tenants(tenant_id)
    ON DELETE SET NULL,
  workspace_id TEXT
    REFERENCES saas_workspaces(workspace_id)
    ON DELETE SET NULL,
  human_ipr TEXT
    REFERENCES ipr_subjects(human_ipr)
    ON DELETE SET NULL,
  runtime_ipr TEXT NOT NULL DEFAULT 'IPR-AI-0001',
  session_id TEXT,
  thread_id TEXT
    REFERENCES chat_threads(thread_id)
    ON DELETE SET NULL,
  memory_id TEXT
    REFERENCES memory_records(memory_id)
    ON DELETE SET NULL,
  event_kind TEXT NOT NULL DEFAULT 'CHAT_OPERATION',
  event_family TEXT NOT NULL DEFAULT 'UP-EVT',
  cycle TEXT NOT NULL DEFAULT 'UP-CANONICO',
  runtime_state TEXT NOT NULL,
  runtime_decision TEXT NOT NULL,
  context_class TEXT,
  intent_class TEXT,
  project_domain TEXT,
  hbce_module TEXT,
  event_hash TEXT NOT NULL,
  public_hash TEXT,
  operational_context JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  legal_certification BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT evt_records_runtime_state_check
    CHECK (runtime_state IN ('OPERATIONAL', 'DEGRADED', 'BLOCKED', 'INVALID', 'AUDIT_ONLY', 'MAINTENANCE', 'UNKNOWN')),
  CONSTRAINT evt_records_runtime_decision_check
    CHECK (runtime_decision IN ('ALLOW', 'BLOCK', 'ESCALATE', 'DEGRADE', 'AUDIT', 'NOOP', 'UNKNOWN')),
  CONSTRAINT evt_records_event_family_check
    CHECK (event_family IN ('UP-EVT', 'EVT', 'UP-MESE', 'RUNTIME')),
  CONSTRAINT evt_records_legal_certification_false
    CHECK (legal_certification = false)
);
`.trim(),

  `
CREATE TABLE IF NOT EXISTS opc_proofs (
  proof_id TEXT PRIMARY KEY,
  evt_id TEXT
    REFERENCES evt_records(evt_id)
    ON DELETE SET NULL,
  tenant_id TEXT
    REFERENCES saas_tenants(tenant_id)
    ON DELETE SET NULL,
  workspace_id TEXT
    REFERENCES saas_workspaces(workspace_id)
    ON DELETE SET NULL,
  human_ipr TEXT
    REFERENCES ipr_subjects(human_ipr)
    ON DELETE SET NULL,
  runtime_ipr TEXT NOT NULL DEFAULT 'IPR-AI-0001',
  session_id TEXT,
  thread_id TEXT
    REFERENCES chat_threads(thread_id)
    ON DELETE SET NULL,
  memory_id TEXT
    REFERENCES memory_records(memory_id)
    ON DELETE SET NULL,
  persistence_mode TEXT NOT NULL DEFAULT 'DATABASE_PERSISTENT',
  persistence_status TEXT NOT NULL DEFAULT 'DATABASE_PERSISTENT_ACTIVE',
  input_hash TEXT NOT NULL,
  output_hash TEXT NOT NULL,
  decision_hash TEXT NOT NULL,
  event_hash TEXT NOT NULL,
  engine_hash TEXT NOT NULL,
  identity_hash TEXT NOT NULL,
  handoff_hash TEXT,
  memory_hash TEXT NOT NULL,
  previous_proof_hash TEXT,
  chain_hash TEXT NOT NULL,
  audit_status TEXT NOT NULL DEFAULT 'NOT_REQUIRED',
  verification_status TEXT NOT NULL DEFAULT 'VERIFIABLE',
  operational_context JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  legal_certification BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT opc_proofs_persistence_mode_check
    CHECK (persistence_mode IN ('RUNTIME_ONLY', 'PROCESS_PROOF_MVP', 'DATABASE_READY', 'DATABASE_PERSISTENT', 'EXTERNAL_ADAPTER')),
  CONSTRAINT opc_proofs_persistence_status_check
    CHECK (persistence_status IN ('NOT_PERSISTED', 'PROCESS_SCOPED', 'DATABASE_CONTRACT_READY', 'DATABASE_PERSISTENT_REQUIRED', 'DATABASE_PERSISTENT_ACTIVE', 'EXTERNAL_ADAPTER_REQUIRED')),
  CONSTRAINT opc_proofs_audit_status_check
    CHECK (audit_status IN ('NOT_REQUIRED', 'READY', 'REQUIRED', 'OPEN', 'IN_REVIEW', 'REVIEWED', 'DISPUTED', 'LOCKED', 'REJECTED', 'CLOSED', 'FAILED')),
  CONSTRAINT opc_proofs_verification_status_check
    CHECK (verification_status IN ('VERIFIABLE', 'PARTIAL', 'INVALID', 'UNVERIFIED', 'ANCHORED', 'SUPERSEDED', 'DISPUTED')),
  CONSTRAINT opc_proofs_legal_certification_false
    CHECK (legal_certification = false)
);
`.trim(),

  `
CREATE TABLE IF NOT EXISTS runtime_audit_logs (
  audit_id TEXT PRIMARY KEY,
  tenant_id TEXT
    REFERENCES saas_tenants(tenant_id)
    ON DELETE SET NULL,
  workspace_id TEXT
    REFERENCES saas_workspaces(workspace_id)
    ON DELETE SET NULL,
  subscription_id TEXT
    REFERENCES subscriptions(subscription_id)
    ON DELETE SET NULL,
  human_ipr TEXT
    REFERENCES ipr_subjects(human_ipr)
    ON DELETE SET NULL,
  runtime_ipr TEXT NOT NULL DEFAULT 'IPR-AI-0001',
  session_id TEXT,
  thread_id TEXT
    REFERENCES chat_threads(thread_id)
    ON DELETE SET NULL,
  evt_id TEXT
    REFERENCES evt_records(evt_id)
    ON DELETE SET NULL,
  opc_proof_id TEXT
    REFERENCES opc_proofs(proof_id)
    ON DELETE SET NULL,
  memory_id TEXT
    REFERENCES memory_records(memory_id)
    ON DELETE SET NULL,
  audit_kind TEXT NOT NULL DEFAULT 'RUNTIME_DECISION',
  runtime_state TEXT NOT NULL DEFAULT 'UNKNOWN',
  runtime_decision TEXT NOT NULL DEFAULT 'UNKNOWN',
  risk_level TEXT NOT NULL DEFAULT 'UNKNOWN',
  data_class TEXT,
  context_class TEXT,
  project_domain TEXT,
  hbce_module TEXT,
  model_level TEXT,
  saas_tier TEXT,
  c2_boundary TEXT,
  blocked BOOLEAN NOT NULL DEFAULT false,
  fail_closed BOOLEAN NOT NULL DEFAULT false,
  human_oversight TEXT NOT NULL DEFAULT 'NOT_REQUIRED',
  audit_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  legal_certification BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT runtime_audit_logs_runtime_state_check
    CHECK (runtime_state IN ('OPERATIONAL', 'DEGRADED', 'BLOCKED', 'INVALID', 'AUDIT_ONLY', 'MAINTENANCE', 'UNKNOWN')),
  CONSTRAINT runtime_audit_logs_runtime_decision_check
    CHECK (runtime_decision IN ('ALLOW', 'BLOCK', 'ESCALATE', 'DEGRADE', 'AUDIT', 'NOOP', 'UNKNOWN')),
  CONSTRAINT runtime_audit_logs_risk_level_check
    CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'UNKNOWN')),
  CONSTRAINT runtime_audit_logs_human_oversight_check
    CHECK (human_oversight IN ('NOT_REQUIRED', 'RECOMMENDED', 'REQUIRED', 'MANDATORY_REVIEW')),
  CONSTRAINT runtime_audit_logs_saas_tier_check
    CHECK (saas_tier IS NULL OR saas_tier IN ('BASE', 'IPR', 'PRO', 'GOVERNANCE', 'C2_DEFENSE', 'STRATEGIC', 'UNKNOWN')),
  CONSTRAINT runtime_audit_logs_legal_certification_false
    CHECK (legal_certification = false)
);
`.trim(),

  `
CREATE TABLE IF NOT EXISTS model_usage (
  usage_id TEXT PRIMARY KEY,
  tenant_id TEXT
    REFERENCES saas_tenants(tenant_id)
    ON DELETE SET NULL,
  workspace_id TEXT
    REFERENCES saas_workspaces(workspace_id)
    ON DELETE SET NULL,
  subscription_id TEXT
    REFERENCES subscriptions(subscription_id)
    ON DELETE SET NULL,
  human_ipr TEXT
    REFERENCES ipr_subjects(human_ipr)
    ON DELETE SET NULL,
  runtime_ipr TEXT NOT NULL DEFAULT 'IPR-AI-0001',
  session_id TEXT,
  thread_id TEXT
    REFERENCES chat_threads(thread_id)
    ON DELETE SET NULL,
  evt_id TEXT
    REFERENCES evt_records(evt_id)
    ON DELETE SET NULL,
  opc_proof_id TEXT
    REFERENCES opc_proofs(proof_id)
    ON DELETE SET NULL,
  audit_id TEXT
    REFERENCES runtime_audit_logs(audit_id)
    ON DELETE SET NULL,
  provider TEXT NOT NULL DEFAULT 'openai',
  model TEXT NOT NULL,
  model_level TEXT NOT NULL DEFAULT 'BASE',
  saas_tier TEXT NOT NULL DEFAULT 'BASE',
  routing_reason TEXT,
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  estimated_cost_minor INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EUR',
  usage_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  legal_certification BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT model_usage_model_level_check
    CHECK (model_level IN ('BASE', 'STANDARD', 'ENHANCED', 'ADVANCED', 'C2', 'FRONTIER', 'UNKNOWN')),
  CONSTRAINT model_usage_saas_tier_check
    CHECK (saas_tier IN ('BASE', 'IPR', 'PRO', 'GOVERNANCE', 'C2_DEFENSE', 'STRATEGIC', 'UNKNOWN')),
  CONSTRAINT model_usage_tokens_non_negative
    CHECK (input_tokens >= 0 AND output_tokens >= 0 AND total_tokens >= 0),
  CONSTRAINT model_usage_cost_non_negative
    CHECK (estimated_cost_minor >= 0),
  CONSTRAINT model_usage_legal_certification_false
    CHECK (legal_certification = false)
);
`.trim(),

  `
CREATE TABLE IF NOT EXISTS matrix_transformative_memory (
  evaluation_id TEXT PRIMARY KEY,
  tenant_id TEXT
    REFERENCES saas_tenants(tenant_id)
    ON DELETE SET NULL,
  workspace_id TEXT
    REFERENCES saas_workspaces(workspace_id)
    ON DELETE SET NULL,
  source_evt_id TEXT
    REFERENCES evt_records(evt_id)
    ON DELETE SET NULL,
  source_opc_proof_id TEXT
    REFERENCES opc_proofs(proof_id)
    ON DELETE SET NULL,
  human_ipr TEXT
    REFERENCES ipr_subjects(human_ipr)
    ON DELETE SET NULL,
  runtime_ipr TEXT NOT NULL DEFAULT 'IPR-AI-0001',
  session_id TEXT,
  thread_id TEXT
    REFERENCES chat_threads(thread_id)
    ON DELETE SET NULL,
  memory_id TEXT
    REFERENCES memory_records(memory_id)
    ON DELETE SET NULL,
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
  CONSTRAINT matrix_transformative_memory_scope_check
    CHECK (memory_scope IN ('IPR_BOUND', 'RUNTIME_ONLY')),
  CONSTRAINT matrix_transformative_memory_authority_check
    CHECK (memory_authority IN ('SERVER_RUNTIME_VALIDATED', 'SESSION_RUNTIME_ONLY')),
  CONSTRAINT matrix_transformative_memory_persistence_mode_check
    CHECK (memory_persistence_mode IN ('PROCESS_MEMORY_MVP', 'DATABASE_READY', 'DATABASE_PERSISTENT', 'EXTERNAL_ADAPTER')),
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
ALTER TABLE ipr_account_profiles
  ADD COLUMN IF NOT EXISTS tenant_id TEXT
    REFERENCES saas_tenants(tenant_id)
    ON DELETE SET NULL;
`.trim(),

  `
ALTER TABLE ipr_account_profiles
  ADD COLUMN IF NOT EXISTS workspace_id TEXT
    REFERENCES saas_workspaces(workspace_id)
    ON DELETE SET NULL;
`.trim(),

  `
ALTER TABLE chat_threads
  ADD COLUMN IF NOT EXISTS tenant_id TEXT
    REFERENCES saas_tenants(tenant_id)
    ON DELETE SET NULL;
`.trim(),

  `
ALTER TABLE chat_threads
  ADD COLUMN IF NOT EXISTS workspace_id TEXT
    REFERENCES saas_workspaces(workspace_id)
    ON DELETE SET NULL;
`.trim(),

  `
ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS tenant_id TEXT
    REFERENCES saas_tenants(tenant_id)
    ON DELETE SET NULL;
`.trim(),

  `
ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS workspace_id TEXT
    REFERENCES saas_workspaces(workspace_id)
    ON DELETE SET NULL;
`.trim(),

  `
ALTER TABLE memory_records
  ADD COLUMN IF NOT EXISTS tenant_id TEXT
    REFERENCES saas_tenants(tenant_id)
    ON DELETE SET NULL;
`.trim(),

  `
ALTER TABLE memory_records
  ADD COLUMN IF NOT EXISTS workspace_id TEXT
    REFERENCES saas_workspaces(workspace_id)
    ON DELETE SET NULL;
`.trim(),

  `
ALTER TABLE memory_records
  ADD COLUMN IF NOT EXISTS thread_id TEXT
    REFERENCES chat_threads(thread_id)
    ON DELETE SET NULL;
`.trim(),

  `
ALTER TABLE evt_records
  ADD COLUMN IF NOT EXISTS tenant_id TEXT
    REFERENCES saas_tenants(tenant_id)
    ON DELETE SET NULL;
`.trim(),

  `
ALTER TABLE evt_records
  ADD COLUMN IF NOT EXISTS workspace_id TEXT
    REFERENCES saas_workspaces(workspace_id)
    ON DELETE SET NULL;
`.trim(),

  `
ALTER TABLE evt_records
  ADD COLUMN IF NOT EXISTS event_family TEXT NOT NULL DEFAULT 'UP-EVT';
`.trim(),

  `
ALTER TABLE evt_records
  ADD COLUMN IF NOT EXISTS cycle TEXT NOT NULL DEFAULT 'UP-CANONICO';
`.trim(),

  `
ALTER TABLE evt_records
  ADD COLUMN IF NOT EXISTS operational_context JSONB NOT NULL DEFAULT '{}'::jsonb;
`.trim(),

  `
ALTER TABLE opc_proofs
  ADD COLUMN IF NOT EXISTS tenant_id TEXT
    REFERENCES saas_tenants(tenant_id)
    ON DELETE SET NULL;
`.trim(),

  `
ALTER TABLE opc_proofs
  ADD COLUMN IF NOT EXISTS workspace_id TEXT
    REFERENCES saas_workspaces(workspace_id)
    ON DELETE SET NULL;
`.trim(),

  `
ALTER TABLE opc_proofs
  ADD COLUMN IF NOT EXISTS persistence_mode TEXT NOT NULL DEFAULT 'DATABASE_PERSISTENT';
`.trim(),

  `
ALTER TABLE opc_proofs
  ADD COLUMN IF NOT EXISTS persistence_status TEXT NOT NULL DEFAULT 'DATABASE_PERSISTENT_ACTIVE';
`.trim(),

  `
ALTER TABLE opc_proofs
  ADD COLUMN IF NOT EXISTS operational_context JSONB NOT NULL DEFAULT '{}'::jsonb;
`.trim(),

  `
ALTER TABLE matrix_transformative_memory
  ADD COLUMN IF NOT EXISTS tenant_id TEXT
    REFERENCES saas_tenants(tenant_id)
    ON DELETE SET NULL;
`.trim(),

  `
ALTER TABLE matrix_transformative_memory
  ADD COLUMN IF NOT EXISTS workspace_id TEXT
    REFERENCES saas_workspaces(workspace_id)
    ON DELETE SET NULL;
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
CREATE INDEX IF NOT EXISTS idx_saas_workspace_memberships_human_ipr
  ON saas_workspace_memberships(human_ipr);
`.trim(),

  `
CREATE INDEX IF NOT EXISTS idx_saas_workspace_memberships_workspace_role
  ON saas_workspace_memberships(workspace_id, role);
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
CREATE INDEX IF NOT EXISTS idx_subscriptions_tier_status
  ON subscriptions(tier, status);
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
CREATE INDEX IF NOT EXISTS idx_ipr_sessions_expires_at
  ON ipr_sessions(expires_at);
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
CREATE INDEX IF NOT EXISTS idx_chat_messages_workspace_created_at
  ON chat_messages(workspace_id, created_at DESC);
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
CREATE INDEX IF NOT EXISTS idx_memory_records_workspace_updated_at
  ON memory_records(workspace_id, updated_at DESC);
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
INSERT INTO hbce_schema_migrations (
  version,
  description,
  schema_payload,
  legal_certification
)
VALUES (
  'HBCE-IPR-DB-v1.2',
  'HBCE SaaS Core v0.1 persistent database schema for tenants, workspaces, memberships, subscriptions, IPR auth, account profiles, sessions, chat, memory, EVT, OPC, runtime audit logs, model usage and MATRIX Transformative Memory.',
  jsonb_build_object(
    'projectBirthDate', '2026-01-19',
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
      'chat_threads',
      'chat_messages',
      'memory_records',
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
`.trim()
];

export const HBCE_DATABASE_SCHEMA: HbceDatabaseSchemaDefinition = {
  version: HBCE_DATABASE_SCHEMA_VERSION,
  persistenceMode: HBCE_DATABASE_PERSISTENCE_MODE,
  boundary: HBCE_DATABASE_SCHEMA_BOUNDARY,
  legalCertificationBoundary: HBCE_DATABASE_LEGAL_CERTIFICATION_BOUNDARY,
  projectBirthDate: HBCE_PROJECT_BIRTH_DATE,
  monthlyReference: HBCE_MONTHLY_REFERENCE,
  currentOperationalEvt: HBCE_CURRENT_OPERATIONAL_EVT,
  currentOperationalAiEvt: HBCE_CURRENT_OPERATIONAL_AI_EVT,
  currentOperationalCycle: HBCE_CURRENT_OPERATIONAL_CYCLE,
  currentEventFamily: HBCE_CURRENT_EVENT_FAMILY,
  targetRelease: HBCE_TARGET_RELEASE,
  targetCheckpointDate: HBCE_TARGET_CHECKPOINT_DATE,
  targetCycle: HBCE_TARGET_CYCLE,
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
    monthlyReference: HBCE_MONTHLY_REFERENCE,
    currentOperationalEvt: HBCE_CURRENT_OPERATIONAL_EVT,
    currentOperationalAiEvt: HBCE_CURRENT_OPERATIONAL_AI_EVT,
    currentOperationalCycle: HBCE_CURRENT_OPERATIONAL_CYCLE,
    currentEventFamily: HBCE_CURRENT_EVENT_FAMILY,
    targetRelease: HBCE_TARGET_RELEASE,
    targetCheckpointDate: HBCE_TARGET_CHECKPOINT_DATE,
    targetCycle: HBCE_TARGET_CYCLE,
    legalCertification: false,
    statement:
      "HBCE SaaS Core v0.1 requires DATABASE_PERSISTENT storage for account, subscription, memory, EVT, OPC, runtime audit, model usage, tenant and workspace continuity."
  };
}
