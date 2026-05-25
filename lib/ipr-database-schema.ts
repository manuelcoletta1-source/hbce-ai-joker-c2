export const HBCE_DATABASE_SCHEMA_VERSION = "HBCE-IPR-DB-v1";

export const HBCE_DATABASE_SCHEMA_BOUNDARY =
  "HBCE database persistence stores operational identity, sessions, chat continuity, memory, EVT records, OPC technical proof receipts and MATRIX Transformative Memory for runtime audit. It does not create legal certification, does not replace official identity documents, does not replace CIE, SPID, EUDI Wallet, passport, codice fiscale, eIDAS qualified trust services, qualified timestamping or public authority validation.";

export const HBCE_DATABASE_LEGAL_CERTIFICATION_BOUNDARY =
  "All HBCE database records remain technical-operational records. legal_certification must remain false unless a future legally recognized qualified trust service, public authority process or regulated certification workflow is explicitly integrated.";

export const HBCE_DATABASE_PERSISTENCE_MODE = "DATABASE_PERSISTENT";

export const HBCE_DATABASE_SCHEMA_TABLES = [
  "hbce_schema_migrations",
  "ipr_subjects",
  "ipr_auth_credentials",
  "ipr_sessions",
  "ipr_account_profiles",
  "chat_threads",
  "chat_messages",
  "memory_records",
  "evt_records",
  "opc_proofs",
  "matrix_transformative_memory"
] as const;

export type HbceDatabaseSchemaTable =
  (typeof HBCE_DATABASE_SCHEMA_TABLES)[number];

export type HbceDatabaseSchemaDefinition = {
  version: typeof HBCE_DATABASE_SCHEMA_VERSION;
  persistenceMode: typeof HBCE_DATABASE_PERSISTENCE_MODE;
  boundary: string;
  legalCertificationBoundary: string;
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
      runtime_state IN ('OPERATIONAL', 'DEGRADED', 'BLOCKED', 'INVALID', 'UNKNOWN')
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
    CHECK (persistence_mode IN ('PROCESS_MEMORY_MVP', 'DATABASE_PERSISTENT', 'EXTERNAL_ADAPTER')),
  CONSTRAINT memory_records_legal_certification_false
    CHECK (legal_certification = false)
);
`.trim(),

  `
CREATE TABLE IF NOT EXISTS evt_records (
  evt_id TEXT PRIMARY KEY,
  prev_evt_id TEXT,
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
  runtime_state TEXT NOT NULL,
  runtime_decision TEXT NOT NULL,
  context_class TEXT,
  intent_class TEXT,
  project_domain TEXT,
  hbce_module TEXT,
  event_hash TEXT NOT NULL,
  public_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  legal_certification BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT evt_records_runtime_state_check
    CHECK (runtime_state IN ('OPERATIONAL', 'DEGRADED', 'BLOCKED', 'INVALID', 'UNKNOWN')),
  CONSTRAINT evt_records_runtime_decision_check
    CHECK (runtime_decision IN ('ALLOW', 'BLOCK', 'ESCALATE', 'DEGRADE', 'AUDIT', 'NOOP', 'UNKNOWN')),
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  legal_certification BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT opc_proofs_audit_status_check
    CHECK (audit_status IN ('NOT_REQUIRED', 'READY', 'REQUIRED')),
  CONSTRAINT opc_proofs_verification_status_check
    CHECK (verification_status IN ('VERIFIABLE', 'PARTIAL', 'UNVERIFIED')),
  CONSTRAINT opc_proofs_legal_certification_false
    CHECK (legal_certification = false)
);
`.trim(),

  `
CREATE TABLE IF NOT EXISTS matrix_transformative_memory (
  evaluation_id TEXT PRIMARY KEY,
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
CREATE INDEX IF NOT EXISTS idx_chat_threads_human_ipr_updated_at
  ON chat_threads(human_ipr, updated_at DESC);
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
CREATE INDEX IF NOT EXISTS idx_evt_records_human_ipr_created_at
  ON evt_records(human_ipr, created_at DESC);
`.trim(),

  `
CREATE INDEX IF NOT EXISTS idx_evt_records_session_id_created_at
  ON evt_records(session_id, created_at DESC);
`.trim(),

  `
CREATE INDEX IF NOT EXISTS idx_opc_proofs_human_ipr_created_at
  ON opc_proofs(human_ipr, created_at DESC);
`.trim(),

  `
CREATE INDEX IF NOT EXISTS idx_opc_proofs_chain_hash
  ON opc_proofs(chain_hash);
`.trim(),

  `
CREATE INDEX IF NOT EXISTS idx_matrix_transformative_memory_human_ipr_created_at
  ON matrix_transformative_memory(human_ipr, created_at DESC);
`.trim(),

  `
INSERT INTO hbce_schema_migrations (
  version,
  description,
  schema_payload,
  legal_certification
)
VALUES (
  'HBCE-IPR-DB-v1',
  'Initial HBCE persistent database schema for IPR auth, account profiles, sessions, chat, memory, EVT, OPC and MATRIX Transformative Memory.',
  jsonb_build_object(
    'persistenceMode', 'DATABASE_PERSISTENT',
    'legalCertification', false,
    'tables', jsonb_build_array(
      'ipr_subjects',
      'ipr_auth_credentials',
      'ipr_sessions',
      'ipr_account_profiles',
      'chat_threads',
      'chat_messages',
      'memory_records',
      'evt_records',
      'opc_proofs',
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
