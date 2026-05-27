export const HBCE_DATABASE_SCHEMA_VERSION = "HBCE-IPR-DB-v1.4";

export const HBCE_DATABASE_SCHEMA_BOUNDARY =
  "HBCE database persistence stores operational identity, SaaS tenants, workspaces, memberships, subscriptions, sessions, chat continuity, IPR-bound memory, EVT records, OPC technical proof receipts, runtime audit logs, model usage logs and MATRIX Transformative Memory for runtime audit. Runtime persistence tables are intentionally tolerant during SaaS Core v0.1: tenant, workspace, subscription, session, EVT, OPC, audit and memory references may be null or payload-only until the full relational ledger is active. HBCE-IPR-DB-v1.4 introduces the canonical HBCE internal self-pilot SaaS seed for tenant, workspace, subscription, IPR subject, membership and account profile continuity. This database layer does not create legal certification, does not replace official identity documents, does not replace CIE, SPID, EUDI Wallet, passport, codice fiscale, eIDAS qualified trust services, qualified timestamping or public authority validation.";

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
  CONSTRAINT ipr_account_profiles_legal_certification_false
    CHECK (legal_certification = false)
);
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
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  legal_certification BOOLEAN NOT NULL DEFAULT false,
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
  runtime_state TEXT,
  runtime_decision TEXT,
  generation_class TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  legal_certification BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT chat_messages_legal_certification_false
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
  memory_hash TEXT NOT NULL,
  memory_chain_hash TEXT,
  last_evt_id TEXT,
  last_opc_proof_id TEXT,
  last_opc_chain_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  record_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  legal_certification BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT memory_records_legal_certification_false
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
    'legalCertification', false
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
    'legalCertification', false
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
    'legalCertification', false
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
    'legalCertification', false
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
    'legalCertification', false
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
    'legalCertification', false
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
  'HBCE-IPR-DB-v1.4',
  'HBCE SaaS Core v0.1 persistent database schema with canonical internal self-pilot seed for HERMETICUM B.C.E. tenant, R&D workspace, IPR subscription, Manuel Coletta IPR account profile, workspace membership, IPR subject, memory, EVT, OPC, runtime audit logs, model usage and MATRIX Transformative Memory. Runtime persistence tables remain tolerant of MVP-stage nullable relational references and preserve reconstruction data in JSONB payloads.',
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
      "HBCE SaaS Core v0.1 requires DATABASE_PERSISTENT storage for account, subscription, memory, EVT, OPC, runtime audit, model usage, tenant and workspace continuity. Runtime persistence tables are tolerant during MVP/SaaS transition and preserve full reconstruction data in JSONB payloads. HBCE-IPR-DB-v1.4 seeds the internal HERMETICUM B.C.E. self-pilot tenant, workspace, subscription and IPR account profile."
  };
}
