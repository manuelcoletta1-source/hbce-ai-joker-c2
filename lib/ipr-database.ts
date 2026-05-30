import { createHash, randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";


import {
  HBCE_DATABASE_LEGAL_CERTIFICATION_BOUNDARY,
  HBCE_DATABASE_PERSISTENCE_MODE,
  HBCE_DATABASE_SCHEMA,
  HBCE_DATABASE_SCHEMA_BOUNDARY,
  HBCE_DATABASE_SCHEMA_SQL,
  HBCE_DATABASE_SCHEMA_TABLES,
  HBCE_DATABASE_SCHEMA_VERSION
} from "./ipr-database-schema";


export type HbceDatabaseStatus =
  | "AVAILABLE"
  | "NOT_CONFIGURED"
  | "DRIVER_AVAILABLE"
  | "INITIALIZATION_FAILED"
  | "QUERY_FAILED";


export type HbceDatabaseKind =
  | "NEON_POSTGRES_HTTP"
  | "POSTGRES_COMPATIBLE"
  | "DISABLED";


export type HbceDatabaseQueryValue =
  | string
  | number
  | boolean
  | null
  | Date
  | Record<string, unknown>
  | unknown[];


export type HbceDatabaseQueryRow = Record<string, unknown>;


export type HbceDatabaseQueryResult<
  Row extends HbceDatabaseQueryRow = HbceDatabaseQueryRow
> = {
  ok: boolean;
  status: HbceDatabaseStatus;
  rows: Row[];
  rowCount: number;
  error: string | null;
  sqlHash: string | null;
  durationMs: number;
};


export type HbceDatabaseDescription = {
  configured: boolean;
  available: boolean;
  kind: HbceDatabaseKind;
  status: HbceDatabaseStatus;
  schemaVersion: typeof HBCE_DATABASE_SCHEMA_VERSION;
  persistenceMode: typeof HBCE_DATABASE_PERSISTENCE_MODE;
  databaseUrlPresent: boolean;
  driver: string;
  mode: "HTTP_QUERY";
  boundary: string;
  legalCertificationBoundary: string;
  legalCertification: false;
};


export type HbceDatabaseAdapter = {
  describe(): HbceDatabaseDescription;


  initializeSchema(): Promise<HbceDatabaseQueryResult>;


  query<Row extends HbceDatabaseQueryRow = HbceDatabaseQueryRow>(
    sql: string,
    params?: HbceDatabaseQueryValue[]
  ): Promise<HbceDatabaseQueryResult<Row>>;
};


export type HbceDatabaseReadyResult = {
  ok: boolean;
  description: HbceDatabaseDescription;
  initialization: HbceDatabaseQueryResult;
  schema: typeof HBCE_DATABASE_SCHEMA;
};


export type RegisteredMemoryEventDatabaseInput = {
  registeredEventId?: string | null;
  eventName: string;
  normalizedEventName?: string;
  evt: string;
  opcProofId?: string | null;
  opcChainHash?: string | null;
  auditId?: string | null;
  usageId?: string | null;
  memoryId: string;
  memoryKeyHash?: string | null;
  humanIpr?: string | null;
  runtimeIpr?: string | null;
  tenantId?: string | null;
  workspaceId?: string | null;
  subscriptionId?: string | null;
  accountId?: string | null;
  sessionId?: string | null;
  threadId?: string | null;
  saasTier?: string | null;
  source?: string | null;
  riskLevel?: string | null;
  securityOutcome?: string | null;
  operationDecision?: string | null;
  policyDecision?: string | null;
  createdAt?: string | Date | null;
  recordPayload?: Record<string, unknown>;
};

export type RegisteredMemoryEventDatabaseRow = HbceDatabaseQueryRow & {
  registered_event_id?: unknown;
  event_name?: unknown;
  normalized_event_name?: unknown;
  evt?: unknown;
  opc_proof_id?: unknown;
  opc_chain_hash?: unknown;
  audit_id?: unknown;
  usage_id?: unknown;
  memory_id?: unknown;
  memory_key_hash?: unknown;
  human_ipr?: unknown;
  runtime_ipr?: unknown;
  tenant_id?: unknown;
  workspace_id?: unknown;
  subscription_id?: unknown;
  account_id?: unknown;
  session_id?: unknown;
  thread_id?: unknown;
  saas_tier?: unknown;
  source?: unknown;
  risk_level?: unknown;
  security_outcome?: unknown;
  operation_decision?: unknown;
  policy_decision?: unknown;
  record_payload?: unknown;
  legal_certification?: unknown;
  created_at?: unknown;
  updated_at?: unknown;
};


export type IprChatThreadDatabaseInput = {
  threadId: string;
  tenantId?: string | null;
  workspaceId?: string | null;
  humanIpr?: string | null;
  runtimeIpr?: string | null;
  sessionId?: string | null;
  title?: string | null;
  scope?: string | null;
  authority?: string | null;
  continuityRef?: string | null;
  lastEvtId?: string | null;
  lastOpcProofId?: string | null;
  lastOpcChainHash?: string | null;
  recentStatus?: string | null;
  pinned?: boolean | null;
  archived?: boolean | null;
  lastMessagePreview?: string | null;
  metadata?: Record<string, unknown>;
};

export type IprChatThreadDatabaseRow = HbceDatabaseQueryRow & {
  thread_id?: unknown;
  tenant_id?: unknown;
  workspace_id?: unknown;
  human_ipr?: unknown;
  runtime_ipr?: unknown;
  session_id?: unknown;
  title?: unknown;
  scope?: unknown;
  authority?: unknown;
  created_at?: unknown;
  updated_at?: unknown;
  last_message_at?: unknown;
  continuity_ref?: unknown;
  last_evt_id?: unknown;
  last_opc_proof_id?: unknown;
  last_opc_chain_hash?: unknown;
  recent_status?: unknown;
  saved_to_ipr?: unknown;
  saved_chat_id?: unknown;
  saved_memory_id?: unknown;
  memory_save_status?: unknown;
  message_count?: unknown;
  pinned?: unknown;
  archived?: unknown;
  last_message_preview?: unknown;
  metadata?: unknown;
  legal_certification?: unknown;
};

export type IprChatMessageDatabaseInput = {
  messageId: string;
  threadId: string;
  role: "user" | "assistant" | "system" | "tool" | string;
  content: string;
  tenantId?: string | null;
  workspaceId?: string | null;
  humanIpr?: string | null;
  runtimeIpr?: string | null;
  sessionId?: string | null;
  messageHash?: string | null;
  evtId?: string | null;
  opcProofId?: string | null;
  opcChainHash?: string | null;
  temporalCertificate?: Record<string, unknown>;
  responseUtc?: string | Date | null;
  birthAnchorLocal?: string | null;
  birthAnchorUtc?: string | Date | null;
  jokerLifetime?: string | null;
  jokerLifeSeconds?: number | null;
  runtimeState?: string | null;
  runtimeDecision?: string | null;
  generationClass?: string | null;
  messageVisibility?: string | null;
  includedInIprMemory?: boolean | null;
  saveCandidate?: boolean | null;
  sourceSaveId?: string | null;
  contentHashPolicy?: string | null;
  metadata?: Record<string, unknown>;
  createdAt?: string | Date | null;
};

export type IprChatMessageDatabaseRow = HbceDatabaseQueryRow & {
  message_id?: unknown;
  tenant_id?: unknown;
  workspace_id?: unknown;
  thread_id?: unknown;
  human_ipr?: unknown;
  runtime_ipr?: unknown;
  session_id?: unknown;
  role?: unknown;
  content?: unknown;
  message_hash?: unknown;
  evt_id?: unknown;
  opc_proof_id?: unknown;
  opc_chain_hash?: unknown;
  temporal_certificate?: unknown;
  response_utc?: unknown;
  birth_anchor_local?: unknown;
  birth_anchor_utc?: unknown;
  joker_lifetime?: unknown;
  joker_life_seconds?: unknown;
  runtime_state?: unknown;
  runtime_decision?: unknown;
  generation_class?: unknown;
  message_visibility?: unknown;
  included_in_ipr_memory?: unknown;
  save_candidate?: unknown;
  source_save_id?: unknown;
  content_hash_policy?: unknown;
  created_at?: unknown;
  metadata?: unknown;
  legal_certification?: unknown;
};

export type IprChatMemorySaveDatabaseInput = {
  savedChatId?: string | null;
  tenantId?: string | null;
  workspaceId?: string | null;
  subscriptionId?: string | null;
  accountId?: string | null;
  humanIpr?: string | null;
  runtimeIpr?: string | null;
  sessionId?: string | null;
  threadId: string;
  memoryId?: string | null;
  registeredEventId?: string | null;
  evtId?: string | null;
  opcProofId?: string | null;
  auditId?: string | null;
  usageId?: string | null;
  saveIntent?: string | null;
  primaryIntention?: string | null;
  radicalIntention?: string | null;
  saveScope?: string | null;
  saveStatus?: string | null;
  memoryStatus?: string | null;
  memoryTitle?: string | null;
  memorySummary?: string | null;
  classification?: string | null;
  rawContentSaved?: boolean | null;
  rawContentPolicy?: string | null;
  saveRaw?: boolean | null;
  saveSynthesis?: boolean | null;
  reusableInPrompt?: boolean | null;
  selectedMessageIds?: string[];
  messageCount?: number | null;
  saveHash?: string | null;
  memoryHash?: string | null;
  previousSaveHash?: string | null;
  continuityHash?: string | null;
  temporalCertificate?: Record<string, unknown>;
  responseUtc?: string | Date | null;
  birthAnchorLocal?: string | null;
  birthAnchorUtc?: string | Date | null;
  jokerLifetime?: string | null;
  jokerLifeSeconds?: number | null;
  payload?: Record<string, unknown>;
  createdAt?: string | Date | null;
};

export type IprChatMemorySaveDatabaseRow = HbceDatabaseQueryRow & {
  saved_chat_id?: unknown;
  tenant_id?: unknown;
  workspace_id?: unknown;
  subscription_id?: unknown;
  account_id?: unknown;
  human_ipr?: unknown;
  runtime_ipr?: unknown;
  session_id?: unknown;
  thread_id?: unknown;
  memory_id?: unknown;
  registered_event_id?: unknown;
  evt_id?: unknown;
  opc_proof_id?: unknown;
  audit_id?: unknown;
  usage_id?: unknown;
  save_intent?: unknown;
  save_scope?: unknown;
  save_status?: unknown;
  memory_status?: unknown;
  memory_title?: unknown;
  memory_summary?: unknown;
  classification?: unknown;
  raw_content_saved?: unknown;
  raw_content_policy?: unknown;
  save_raw?: unknown;
  save_synthesis?: unknown;
  reusable_in_prompt?: unknown;
  selected_message_ids?: unknown;
  message_count?: unknown;
  save_hash?: unknown;
  memory_hash?: unknown;
  previous_save_hash?: unknown;
  continuity_hash?: unknown;
  temporal_certificate?: unknown;
  response_utc?: unknown;
  birth_anchor_local?: unknown;
  birth_anchor_utc?: unknown;
  joker_lifetime?: unknown;
  joker_life_seconds?: unknown;
  created_at?: unknown;
  updated_at?: unknown;
  payload?: unknown;
  legal_certification?: unknown;
};

export type IprMemoryRecordDatabaseInput = {
  memoryId: string;
  tenantId?: string | null;
  workspaceId?: string | null;
  memoryKeyHash?: string | null;
  humanIpr?: string | null;
  runtimeIpr?: string | null;
  sessionId?: string | null;
  threadId?: string | null;
  scope?: string | null;
  authority?: string | null;
  persistenceMode?: string | null;
  memoryKind?: string | null;
  memoryStatus?: string | null;
  sourceKind?: string | null;
  sourceThreadId?: string | null;
  sourceSavedChatId?: string | null;
  sourceMessageIds?: string[];
  memoryTitle?: string | null;
  memorySummary?: string | null;
  saveRaw?: boolean | null;
  saveSynthesis?: boolean | null;
  reusableInPrompt?: boolean | null;
  classification?: string | null;
  quality?: string | null;
  thresholdDetected?: boolean | null;
  semanticTerms?: unknown[];
  memoryHash?: string | null;
  memoryChainHash?: string | null;
  lastEvtId?: string | null;
  lastOpcProofId?: string | null;
  lastOpcChainHash?: string | null;
  temporalCertificate?: Record<string, unknown>;
  responseUtc?: string | Date | null;
  birthAnchorLocal?: string | null;
  birthAnchorUtc?: string | Date | null;
  jokerLifetime?: string | null;
  jokerLifeSeconds?: number | null;
  recordPayload?: Record<string, unknown>;
  createdAt?: string | Date | null;
};

export type IprMemoryRecordDatabaseRow = HbceDatabaseQueryRow & {
  memory_id?: unknown;
  tenant_id?: unknown;
  workspace_id?: unknown;
  memory_key_hash?: unknown;
  human_ipr?: unknown;
  runtime_ipr?: unknown;
  session_id?: unknown;
  thread_id?: unknown;
  scope?: unknown;
  authority?: unknown;
  persistence_mode?: unknown;
  memory_kind?: unknown;
  memory_status?: unknown;
  source_kind?: unknown;
  source_thread_id?: unknown;
  source_saved_chat_id?: unknown;
  source_message_ids?: unknown;
  memory_title?: unknown;
  memory_summary?: unknown;
  save_raw?: unknown;
  save_synthesis?: unknown;
  reusable_in_prompt?: unknown;
  classification?: unknown;
  quality?: unknown;
  threshold_detected?: unknown;
  semantic_terms?: unknown;
  memory_hash?: unknown;
  memory_chain_hash?: unknown;
  last_evt_id?: unknown;
  last_opc_proof_id?: unknown;
  last_opc_chain_hash?: unknown;
  temporal_certificate?: unknown;
  response_utc?: unknown;
  birth_anchor_local?: unknown;
  birth_anchor_utc?: unknown;
  joker_lifetime?: unknown;
  joker_life_seconds?: unknown;
  created_at?: unknown;
  updated_at?: unknown;
  record_payload?: unknown;
  legal_certification?: unknown;
};

export type SaveIprChatToMemoryDatabaseResult = {
  ok: boolean;
  savedChatId: string;
  memoryId: string;
  saveResult: HbceDatabaseQueryResult<IprChatMemorySaveDatabaseRow>;
  memoryResult: HbceDatabaseQueryResult<IprMemoryRecordDatabaseRow>;
  registeredEventResult: HbceDatabaseQueryResult<RegisteredMemoryEventDatabaseRow>;
  threadResult: HbceDatabaseQueryResult<IprChatThreadDatabaseRow>;
  messageUpdateResult: HbceDatabaseQueryResult<IprChatMessageDatabaseRow>;
  legalCertification: false;
};


type HbceSchemaStatementRow = HbceDatabaseQueryRow & {
  index: number;
  ok: boolean;
  status:
    | "EXECUTED"
    | "FAILED"
    | "TABLE_PRESENT"
    | "TABLE_MISSING"
    | "COLUMN_PRESENT"
    | "COLUMN_MISSING";
  sqlHash: string | null;
  tableName?: string;
  columnName?: string;
  error: string | null;
};


const NEON_SERVERLESS_DRIVER = "@neondatabase/serverless";


const DATABASE_URL_ENV_KEYS = [
  "DATABASE_URL",
  "POSTGRES_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL_NON_POOLING",
  "NEON_DATABASE_URL"
];


const MEMORY_RECORDS_COMPATIBILITY_SCHEMA_SQL = [
  `
CREATE TABLE IF NOT EXISTS memory_records (
  memory_id text PRIMARY KEY,
  tenant_id text,
  workspace_id text,
  memory_key_hash text NOT NULL,
  human_ipr text,
  runtime_ipr text NOT NULL DEFAULT 'IPR-AI-0001',
  session_id text NOT NULL DEFAULT 'UNKNOWN_SESSION',
  thread_id text,
  scope text,
  authority text,
  persistence_mode text NOT NULL DEFAULT 'DATABASE_PERSISTENT',
  memory_hash text,
  memory_chain_hash text,
  last_evt_id text,
  last_opc_proof_id text,
  last_opc_chain_hash text,
  record_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  legal_certification boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
`.trim(),
  `
ALTER TABLE IF EXISTS memory_records
  DROP CONSTRAINT IF EXISTS memory_records_thread_id_fkey;
`.trim(),
  `
ALTER TABLE IF EXISTS memory_records
  DROP CONSTRAINT IF EXISTS memory_records_tenant_id_fkey;
`.trim(),
  `
ALTER TABLE IF EXISTS memory_records
  DROP CONSTRAINT IF EXISTS memory_records_workspace_id_fkey;
`.trim(),
  `
ALTER TABLE IF EXISTS memory_records
  DROP CONSTRAINT IF EXISTS memory_records_human_ipr_fkey;
`.trim(),
  `
ALTER TABLE IF EXISTS memory_records
  DROP CONSTRAINT IF EXISTS memory_records_runtime_ipr_fkey;
`.trim(),
  `
ALTER TABLE IF EXISTS memory_records
  DROP CONSTRAINT IF EXISTS memory_records_session_id_fkey;
`.trim(),
  `
ALTER TABLE IF EXISTS memory_records
  ADD COLUMN IF NOT EXISTS memory_id text;
`.trim(),
  `
ALTER TABLE IF EXISTS memory_records
  ADD COLUMN IF NOT EXISTS tenant_id text;
`.trim(),
  `
ALTER TABLE IF EXISTS memory_records
  ADD COLUMN IF NOT EXISTS workspace_id text;
`.trim(),
  `
ALTER TABLE IF EXISTS memory_records
  ADD COLUMN IF NOT EXISTS memory_key_hash text;
`.trim(),
  `
ALTER TABLE IF EXISTS memory_records
  ADD COLUMN IF NOT EXISTS human_ipr text;
`.trim(),
  `
ALTER TABLE IF EXISTS memory_records
  ADD COLUMN IF NOT EXISTS runtime_ipr text DEFAULT 'IPR-AI-0001';
`.trim(),
  `
ALTER TABLE IF EXISTS memory_records
  ADD COLUMN IF NOT EXISTS session_id text DEFAULT 'UNKNOWN_SESSION';
`.trim(),
  `
ALTER TABLE IF EXISTS memory_records
  ADD COLUMN IF NOT EXISTS thread_id text;
`.trim(),
  `
ALTER TABLE IF EXISTS memory_records
  ADD COLUMN IF NOT EXISTS scope text;
`.trim(),
  `
ALTER TABLE IF EXISTS memory_records
  ADD COLUMN IF NOT EXISTS authority text;
`.trim(),
  `
ALTER TABLE IF EXISTS memory_records
  ADD COLUMN IF NOT EXISTS persistence_mode text DEFAULT 'DATABASE_PERSISTENT';
`.trim(),
  `
ALTER TABLE IF EXISTS memory_records
  ADD COLUMN IF NOT EXISTS memory_hash text;
`.trim(),
  `
ALTER TABLE IF EXISTS memory_records
  ADD COLUMN IF NOT EXISTS memory_chain_hash text;
`.trim(),
  `
ALTER TABLE IF EXISTS memory_records
  ADD COLUMN IF NOT EXISTS last_evt_id text;
`.trim(),
  `
ALTER TABLE IF EXISTS memory_records
  ADD COLUMN IF NOT EXISTS last_opc_proof_id text;
`.trim(),
  `
ALTER TABLE IF EXISTS memory_records
  ADD COLUMN IF NOT EXISTS last_opc_chain_hash text;
`.trim(),
  `
ALTER TABLE IF EXISTS memory_records
  ADD COLUMN IF NOT EXISTS record_payload jsonb DEFAULT '{}'::jsonb;
`.trim(),
  `
ALTER TABLE IF EXISTS memory_records
  ADD COLUMN IF NOT EXISTS legal_certification boolean DEFAULT false;
`.trim(),
  `
ALTER TABLE IF EXISTS memory_records
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
`.trim(),
  `
ALTER TABLE IF EXISTS memory_records
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
`.trim(),
  `
UPDATE memory_records
SET
  runtime_ipr = COALESCE(runtime_ipr, 'IPR-AI-0001'),
  session_id = COALESCE(session_id, 'UNKNOWN_SESSION'),
  persistence_mode = COALESCE(persistence_mode, 'DATABASE_PERSISTENT'),
  legal_certification = COALESCE(legal_certification, false),
  created_at = COALESCE(created_at, now()),
  updated_at = COALESCE(updated_at, now())
WHERE
  runtime_ipr IS NULL
  OR session_id IS NULL
  OR persistence_mode IS NULL
  OR legal_certification IS NULL
  OR created_at IS NULL
  OR updated_at IS NULL;
`.trim(),
  `
ALTER TABLE IF EXISTS memory_records
  ALTER COLUMN runtime_ipr SET DEFAULT 'IPR-AI-0001';
`.trim(),
  `
ALTER TABLE IF EXISTS memory_records
  ALTER COLUMN session_id SET DEFAULT 'UNKNOWN_SESSION';
`.trim(),
  `
ALTER TABLE IF EXISTS memory_records
  ALTER COLUMN persistence_mode SET DEFAULT 'DATABASE_PERSISTENT';
`.trim(),
  `
ALTER TABLE IF EXISTS memory_records
  ALTER COLUMN legal_certification SET DEFAULT false;
`.trim(),
  `
ALTER TABLE IF EXISTS memory_records
  ALTER COLUMN created_at SET DEFAULT now();
`.trim(),
  `
ALTER TABLE IF EXISTS memory_records
  ALTER COLUMN updated_at SET DEFAULT now();
`.trim(),
  `
CREATE UNIQUE INDEX IF NOT EXISTS memory_records_memory_id_uidx
ON memory_records (memory_id);
`.trim(),
  `
CREATE INDEX IF NOT EXISTS memory_records_memory_key_hash_idx
ON memory_records (memory_key_hash);
`.trim(),
  `
CREATE INDEX IF NOT EXISTS memory_records_human_ipr_idx
ON memory_records (human_ipr);
`.trim(),
  `
CREATE INDEX IF NOT EXISTS memory_records_runtime_ipr_idx
ON memory_records (runtime_ipr);
`.trim(),
  `
CREATE INDEX IF NOT EXISTS memory_records_session_id_idx
ON memory_records (session_id);
`.trim(),
  `
CREATE INDEX IF NOT EXISTS memory_records_thread_id_idx
ON memory_records (thread_id);
`.trim(),
  `
CREATE INDEX IF NOT EXISTS memory_records_tenant_workspace_idx
ON memory_records (tenant_id, workspace_id);
`.trim(),
  `
CREATE INDEX IF NOT EXISTS memory_records_updated_at_idx
ON memory_records (updated_at DESC);
`.trim(),
  `
CREATE INDEX IF NOT EXISTS memory_records_legal_certification_idx
ON memory_records (legal_certification);
`.trim()
];


const MEMORY_REGISTERED_EVENTS_COMPATIBILITY_SCHEMA_SQL = [
  `
CREATE TABLE IF NOT EXISTS memory_registered_events (
  registered_event_id text,
  event_name text NOT NULL,
  normalized_event_name text NOT NULL,
  evt text NOT NULL,
  opc_proof_id text,
  opc_chain_hash text,
  audit_id text,
  usage_id text,
  memory_id text NOT NULL,
  memory_key_hash text,
  human_ipr text,
  runtime_ipr text NOT NULL DEFAULT 'IPR-AI-0001',
  tenant_id text,
  workspace_id text,
  subscription_id text,
  account_id text,
  session_id text,
  thread_id text,
  saas_tier text,
  source text,
  risk_level text,
  security_outcome text,
  operation_decision text,
  policy_decision text,
  record_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  legal_certification boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (memory_id, normalized_event_name)
);
`.trim(),
  `
ALTER TABLE IF EXISTS memory_registered_events
  ADD COLUMN IF NOT EXISTS registered_event_id text;
`.trim(),
  `
ALTER TABLE IF EXISTS memory_registered_events
  ADD COLUMN IF NOT EXISTS event_name text;
`.trim(),
  `
ALTER TABLE IF EXISTS memory_registered_events
  ADD COLUMN IF NOT EXISTS normalized_event_name text;
`.trim(),
  `
ALTER TABLE IF EXISTS memory_registered_events
  ADD COLUMN IF NOT EXISTS evt text;
`.trim(),
  `
ALTER TABLE IF EXISTS memory_registered_events
  ADD COLUMN IF NOT EXISTS opc_proof_id text;
`.trim(),
  `
ALTER TABLE IF EXISTS memory_registered_events
  ADD COLUMN IF NOT EXISTS opc_chain_hash text;
`.trim(),
  `
ALTER TABLE IF EXISTS memory_registered_events
  ADD COLUMN IF NOT EXISTS audit_id text;
`.trim(),
  `
ALTER TABLE IF EXISTS memory_registered_events
  ADD COLUMN IF NOT EXISTS usage_id text;
`.trim(),
  `
ALTER TABLE IF EXISTS memory_registered_events
  ADD COLUMN IF NOT EXISTS memory_id text;
`.trim(),
  `
ALTER TABLE IF EXISTS memory_registered_events
  ADD COLUMN IF NOT EXISTS memory_key_hash text;
`.trim(),
  `
ALTER TABLE IF EXISTS memory_registered_events
  ADD COLUMN IF NOT EXISTS human_ipr text;
`.trim(),
  `
ALTER TABLE IF EXISTS memory_registered_events
  ADD COLUMN IF NOT EXISTS runtime_ipr text DEFAULT 'IPR-AI-0001';
`.trim(),
  `
ALTER TABLE IF EXISTS memory_registered_events
  ADD COLUMN IF NOT EXISTS tenant_id text;
`.trim(),
  `
ALTER TABLE IF EXISTS memory_registered_events
  ADD COLUMN IF NOT EXISTS workspace_id text;
`.trim(),
  `
ALTER TABLE IF EXISTS memory_registered_events
  ADD COLUMN IF NOT EXISTS subscription_id text;
`.trim(),
  `
ALTER TABLE IF EXISTS memory_registered_events
  ADD COLUMN IF NOT EXISTS account_id text;
`.trim(),
  `
ALTER TABLE IF EXISTS memory_registered_events
  ADD COLUMN IF NOT EXISTS session_id text;
`.trim(),
  `
ALTER TABLE IF EXISTS memory_registered_events
  ADD COLUMN IF NOT EXISTS thread_id text;
`.trim(),
  `
ALTER TABLE IF EXISTS memory_registered_events
  ADD COLUMN IF NOT EXISTS saas_tier text;
`.trim(),
  `
ALTER TABLE IF EXISTS memory_registered_events
  ADD COLUMN IF NOT EXISTS source text;
`.trim(),
  `
ALTER TABLE IF EXISTS memory_registered_events
  ADD COLUMN IF NOT EXISTS risk_level text;
`.trim(),
  `
ALTER TABLE IF EXISTS memory_registered_events
  ADD COLUMN IF NOT EXISTS security_outcome text;
`.trim(),
  `
ALTER TABLE IF EXISTS memory_registered_events
  ADD COLUMN IF NOT EXISTS operation_decision text;
`.trim(),
  `
ALTER TABLE IF EXISTS memory_registered_events
  ADD COLUMN IF NOT EXISTS policy_decision text;
`.trim(),
  `
ALTER TABLE IF EXISTS memory_registered_events
  ADD COLUMN IF NOT EXISTS record_payload jsonb DEFAULT '{}'::jsonb;
`.trim(),
  `
ALTER TABLE IF EXISTS memory_registered_events
  ADD COLUMN IF NOT EXISTS legal_certification boolean DEFAULT false;
`.trim(),
  `
ALTER TABLE IF EXISTS memory_registered_events
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
`.trim(),
  `
ALTER TABLE IF EXISTS memory_registered_events
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
`.trim(),
  `
UPDATE memory_registered_events
SET
  registered_event_id = COALESCE(NULLIF(registered_event_id, ''), 'REVT-' || upper(substr(md5(COALESCE(memory_id, '') || ':' || COALESCE(event_name, evt, 'unnamed_event')), 1, 16))),
  normalized_event_name = COALESCE(NULLIF(normalized_event_name, ''), lower(regexp_replace(COALESCE(event_name, evt, 'unnamed_event'), '\s+', '_', 'g'))),
  runtime_ipr = COALESCE(runtime_ipr, 'IPR-AI-0001'),
  record_payload = COALESCE(record_payload, '{}'::jsonb),
  legal_certification = COALESCE(legal_certification, false),
  created_at = COALESCE(created_at, now()),
  updated_at = COALESCE(updated_at, now())
WHERE
  registered_event_id IS NULL
  OR registered_event_id = ''
  OR normalized_event_name IS NULL
  OR normalized_event_name = ''
  OR runtime_ipr IS NULL
  OR record_payload IS NULL
  OR legal_certification IS NULL
  OR created_at IS NULL
  OR updated_at IS NULL;
`.trim(),
  `
CREATE UNIQUE INDEX IF NOT EXISTS memory_registered_events_memory_name_uidx
ON memory_registered_events (memory_id, normalized_event_name);
`.trim(),
  `
CREATE INDEX IF NOT EXISTS memory_registered_events_name_idx
ON memory_registered_events (normalized_event_name);
`.trim(),
  `
CREATE INDEX IF NOT EXISTS memory_registered_events_evt_idx
ON memory_registered_events (evt);
`.trim(),
  `
CREATE INDEX IF NOT EXISTS memory_registered_events_human_ipr_idx
ON memory_registered_events (human_ipr);
`.trim(),
  `
CREATE INDEX IF NOT EXISTS memory_registered_events_tenant_workspace_idx
ON memory_registered_events (tenant_id, workspace_id);
`.trim(),
  `
CREATE INDEX IF NOT EXISTS memory_registered_events_created_at_idx
ON memory_registered_events (created_at DESC);
`.trim()
];


const MEMORY_RECORDS_REQUIRED_COLUMNS = [
  "memory_id",
  "tenant_id",
  "workspace_id",
  "memory_key_hash",
  "human_ipr",
  "runtime_ipr",
  "session_id",
  "thread_id",
  "scope",
  "authority",
  "persistence_mode",
  "memory_hash",
  "memory_chain_hash",
  "last_evt_id",
  "last_opc_proof_id",
  "last_opc_chain_hash",
  "record_payload",
  "legal_certification",
  "created_at",
  "updated_at"
];


const MEMORY_REGISTERED_EVENTS_REQUIRED_COLUMNS = [
  "registered_event_id",
  "event_name",
  "normalized_event_name",
  "evt",
  "opc_proof_id",
  "opc_chain_hash",
  "audit_id",
  "usage_id",
  "memory_id",
  "memory_key_hash",
  "human_ipr",
  "runtime_ipr",
  "tenant_id",
  "workspace_id",
  "subscription_id",
  "account_id",
  "session_id",
  "thread_id",
  "saas_tier",
  "source",
  "risk_level",
  "security_outcome",
  "operation_decision",
  "policy_decision",
  "record_payload",
  "legal_certification",
  "created_at",
  "updated_at"
];


const DISABLED_DATABASE_DESCRIPTION: HbceDatabaseDescription = {
  configured: false,
  available: false,
  kind: "DISABLED",
  status: "NOT_CONFIGURED",
  schemaVersion: HBCE_DATABASE_SCHEMA_VERSION,
  persistenceMode: HBCE_DATABASE_PERSISTENCE_MODE,
  databaseUrlPresent: false,
  driver: NEON_SERVERLESS_DRIVER,
  mode: "HTTP_QUERY",
  boundary: HBCE_DATABASE_SCHEMA_BOUNDARY,
  legalCertificationBoundary: HBCE_DATABASE_LEGAL_CERTIFICATION_BOUNDARY,
  legalCertification: false
};


function nowMs(): number {
  return Date.now();
}


function safeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }


  if (typeof error === "string") {
    return error;
  }


  try {
    return JSON.stringify(error);
  } catch {
    return "UNKNOWN_DATABASE_ERROR";
  }
}


function simpleHash(input: string): string {
  let hash = 0;


  for (let index = 0; index < input.length; index += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(index);
    hash |= 0;
  }


  return `sqlhash:${Math.abs(hash).toString(16).padStart(8, "0")}`;
}


function normalizeSql(sql: string): string {
  return sql.replace(/\s+/g, " ").trim();
}


function sqlLiteral(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}


function getDatabaseUrlFromEnv(): string | null {
  for (const key of DATABASE_URL_ENV_KEYS) {
    const value = process.env[key];


    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }


  return null;
}


function isDatabaseUrlConfigured(): boolean {
  return Boolean(getDatabaseUrlFromEnv());
}


function inferDatabaseKind(databaseUrl: string | null): HbceDatabaseKind {
  if (!databaseUrl) {
    return "DISABLED";
  }


  const normalized = databaseUrl.toLowerCase();


  if (normalized.includes("neon.tech") || normalized.includes("neon")) {
    return "NEON_POSTGRES_HTTP";
  }


  return "POSTGRES_COMPATIBLE";
}


function isRecord(value: unknown): value is HbceDatabaseQueryRow {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}


function normalizeRows<Row extends HbceDatabaseQueryRow>(
  value: unknown
): Row[] {
  if (!Array.isArray(value)) {
    return [];
  }


  return value.filter(isRecord) as Row[];
}


function serializeQueryValue(value: HbceDatabaseQueryValue): unknown {
  if (value instanceof Date) {
    return value.toISOString();
  }


  if (value === null) {
    return null;
  }


  if (Array.isArray(value)) {
    return JSON.stringify(value);
  }


  if (typeof value === "object") {
    return JSON.stringify(value);
  }


  return value;
}


function serializeQueryParams(params: HbceDatabaseQueryValue[]): unknown[] {
  return params.map((param) => serializeQueryValue(param));
}


function buildResult<Row extends HbceDatabaseQueryRow>(input: {
  ok: boolean;
  status: HbceDatabaseStatus;
  rows?: Row[];
  rowCount?: number;
  error?: string | null;
  sql?: string | null;
  startedAt: number;
}): HbceDatabaseQueryResult<Row> {
  const rows = input.rows || [];


  return {
    ok: input.ok,
    status: input.status,
    rows,
    rowCount: typeof input.rowCount === "number" ? input.rowCount : rows.length,
    error: input.error || null,
    sqlHash: input.sql ? simpleHash(normalizeSql(input.sql)) : null,
    durationMs: Math.max(0, nowMs() - input.startedAt)
  };
}


function shouldAutoApplySchema(): boolean {
  const raw =
    process.env.HBCE_DATABASE_AUTO_SCHEMA ||
    process.env.JOKER_DATABASE_AUTO_SCHEMA ||
    "true";


  return raw.trim().toLowerCase() !== "false";
}


function shouldInitializeBeforeQuery(sqlText: string): boolean {
  const normalized = normalizeSql(sqlText).toLowerCase();


  if (!normalized) {
    return false;
  }


  if (normalized.includes("hbce_schema_migrations")) {
    return false;
  }


  if (normalized.startsWith("create table")) {
    return false;
  }


  if (normalized.startsWith("alter table")) {
    return false;
  }


  if (normalized.startsWith("create index")) {
    return false;
  }


  return true;
}


function buildRequiredTablesCheckSql(): string {
  const tableList = HBCE_DATABASE_SCHEMA_TABLES
    .map((tableName) => sqlLiteral(tableName))
    .join(", ");


  return `
SELECT table_name
FROM information_schema.tables
WHERE table_schema IN ('public', current_schema())
  AND table_name IN (${tableList});
`.trim();
}


function buildMemoryRecordsRequiredColumnsCheckSql(): string {
  const columnList = MEMORY_RECORDS_REQUIRED_COLUMNS
    .map((columnName) => sqlLiteral(columnName))
    .join(", ");


  return `
SELECT column_name
FROM information_schema.columns
WHERE table_schema IN ('public', current_schema())
  AND table_name = 'memory_records'
  AND column_name IN (${columnList});
`.trim();
}


function buildMemoryRegisteredEventsRequiredColumnsCheckSql(): string {
  const columnList = MEMORY_REGISTERED_EVENTS_REQUIRED_COLUMNS
    .map((columnName) => sqlLiteral(columnName))
    .join(", ");


  return `
SELECT column_name
FROM information_schema.columns
WHERE table_schema IN ('public', current_schema())
  AND table_name = 'memory_registered_events'
  AND column_name IN (${columnList});
`.trim();
}


class DisabledHbceDatabaseAdapter implements HbceDatabaseAdapter {
  describe(): HbceDatabaseDescription {
    return DISABLED_DATABASE_DESCRIPTION;
  }


  async initializeSchema(): Promise<HbceDatabaseQueryResult> {
    const startedAt = nowMs();


    return buildResult({
      ok: false,
      status: "NOT_CONFIGURED",
      rows: [],
      rowCount: 0,
      error:
        "DATABASE_URL is not configured. HBCE persistence remains unavailable and runtime must not claim DATABASE_PERSISTENT continuity.",
      startedAt
    });
  }


  async query<Row extends HbceDatabaseQueryRow = HbceDatabaseQueryRow>(
    sql: string
  ): Promise<HbceDatabaseQueryResult<Row>> {
    const startedAt = nowMs();


    return buildResult<Row>({
      ok: false,
      status: "NOT_CONFIGURED",
      rows: [],
      rowCount: 0,
      error: "DATABASE_URL is not configured. Query was not executed.",
      sql,
      startedAt
    });
  }
}


class NeonHttpHbceDatabaseAdapter implements HbceDatabaseAdapter {
  private readonly databaseUrl: string;
  private readonly kind: HbceDatabaseKind;
  private schemaInitializationPromise: Promise<HbceDatabaseQueryResult> | null = null;
  private schemaInitialized = false;


  constructor(databaseUrl: string) {
    this.databaseUrl = databaseUrl;
    this.kind = inferDatabaseKind(databaseUrl);
  }


  describe(): HbceDatabaseDescription {
    return {
      configured: true,
      available: true,
      kind: this.kind,
      status: "DRIVER_AVAILABLE",
      schemaVersion: HBCE_DATABASE_SCHEMA_VERSION,
      persistenceMode: HBCE_DATABASE_PERSISTENCE_MODE,
      databaseUrlPresent: true,
      driver: NEON_SERVERLESS_DRIVER,
      mode: "HTTP_QUERY",
      boundary: HBCE_DATABASE_SCHEMA_BOUNDARY,
      legalCertificationBoundary: HBCE_DATABASE_LEGAL_CERTIFICATION_BOUNDARY,
      legalCertification: false
    };
  }


  private getSql() {
    return neon(this.databaseUrl);
  }


  async initializeSchema(): Promise<HbceDatabaseQueryResult> {
    if (this.schemaInitialized && this.schemaInitializationPromise) {
      return this.schemaInitializationPromise;
    }


    if (this.schemaInitializationPromise) {
      return this.schemaInitializationPromise;
    }


    this.schemaInitializationPromise = this.initializeSchemaOnce();


    const result = await this.schemaInitializationPromise;


    if (result.ok) {
      this.schemaInitialized = true;
    } else {
      this.schemaInitializationPromise = null;
      this.schemaInitialized = false;
    }


    return result;
  }


  private async initializeSchemaOnce(): Promise<HbceDatabaseQueryResult> {
    const startedAt = nowMs();
    const compatibilitySql = [
      ...MEMORY_RECORDS_COMPATIBILITY_SCHEMA_SQL,
      ...MEMORY_REGISTERED_EVENTS_COMPATIBILITY_SCHEMA_SQL
    ].join("\n\n");
    const joinedSql = [
      HBCE_DATABASE_SCHEMA_SQL.join("\n\n"),
      compatibilitySql
    ].join("\n\n");
    const sql = this.getSql();
    const rows: HbceSchemaStatementRow[] = [];


    let executedStatements = 0;
    let failedStatements = 0;


    const allStatements = [
      ...HBCE_DATABASE_SCHEMA_SQL,
      ...MEMORY_RECORDS_COMPATIBILITY_SCHEMA_SQL,
      ...MEMORY_REGISTERED_EVENTS_COMPATIBILITY_SCHEMA_SQL
    ];


    for (let index = 0; index < allStatements.length; index += 1) {
      const statement = allStatements[index];
      const normalized = statement.trim();


      if (!normalized) {
        continue;
      }


      try {
        await sql.query(normalized, []);
        executedStatements += 1;


        rows.push({
          index,
          ok: true,
          status: "EXECUTED",
          sqlHash: simpleHash(normalizeSql(normalized)),
          error: null
        });
      } catch (error) {
        failedStatements += 1;


        rows.push({
          index,
          ok: false,
          status: "FAILED",
          sqlHash: simpleHash(normalizeSql(normalized)),
          error: safeError(error)
        });
      }
    }


    let missingTables: string[] = [];


    try {
      const tableResult = await sql.query(buildRequiredTablesCheckSql(), []);
      const existingRows = normalizeRows<{ table_name?: unknown }>(tableResult);
      const existingTables = new Set(
        existingRows
          .map((row) => row.table_name)
          .filter((value): value is string => typeof value === "string")
      );


      missingTables = HBCE_DATABASE_SCHEMA_TABLES.filter(
        (tableName) => !existingTables.has(tableName)
      );


      for (const tableName of HBCE_DATABASE_SCHEMA_TABLES) {
        const present = existingTables.has(tableName);


        rows.push({
          index: allStatements.length,
          ok: present,
          status: present ? "TABLE_PRESENT" : "TABLE_MISSING",
          sqlHash: null,
          tableName,
          error: present ? null : `Required table ${tableName} is missing.`
        });
      }
    } catch (error) {
      return buildResult<HbceDatabaseQueryRow>({
        ok: false,
        status: "INITIALIZATION_FAILED",
        rows,
        rowCount: executedStatements,
        error: `Schema statements executed with ${failedStatements} statement error(s), but required table verification failed: ${safeError(error)}`,
        sql: joinedSql,
        startedAt
      });
    }


    let missingMemoryColumns: string[] = [];


    try {
      const columnResult = await sql.query(
        buildMemoryRecordsRequiredColumnsCheckSql(),
        []
      );
      const existingColumnRows = normalizeRows<{ column_name?: unknown }>(
        columnResult
      );
      const existingColumns = new Set(
        existingColumnRows
          .map((row) => row.column_name)
          .filter((value): value is string => typeof value === "string")
      );


      missingMemoryColumns = MEMORY_RECORDS_REQUIRED_COLUMNS.filter(
        (columnName) => !existingColumns.has(columnName)
      );


      for (const columnName of MEMORY_RECORDS_REQUIRED_COLUMNS) {
        const present = existingColumns.has(columnName);


        rows.push({
          index: allStatements.length + 1,
          ok: present,
          status: present ? "COLUMN_PRESENT" : "COLUMN_MISSING",
          sqlHash: null,
          tableName: "memory_records",
          columnName,
          error: present
            ? null
            : `Required column memory_records.${columnName} is missing.`
        });
      }
    } catch (error) {
      return buildResult<HbceDatabaseQueryRow>({
        ok: false,
        status: "INITIALIZATION_FAILED",
        rows,
        rowCount: executedStatements,
        error: `Schema statements executed with ${failedStatements} statement error(s), but memory_records column verification failed: ${safeError(error)}`,
        sql: joinedSql,
        startedAt
      });
    }


    let missingRegisteredEventColumns: string[] = [];


    try {
      const registeredEventColumnResult = await sql.query(
        buildMemoryRegisteredEventsRequiredColumnsCheckSql(),
        []
      );
      const existingRegisteredEventColumnRows = normalizeRows<{ column_name?: unknown }>(
        registeredEventColumnResult
      );
      const existingRegisteredEventColumns = new Set(
        existingRegisteredEventColumnRows
          .map((row) => row.column_name)
          .filter((value): value is string => typeof value === "string")
      );


      missingRegisteredEventColumns = MEMORY_REGISTERED_EVENTS_REQUIRED_COLUMNS.filter(
        (columnName) => !existingRegisteredEventColumns.has(columnName)
      );


      for (const columnName of MEMORY_REGISTERED_EVENTS_REQUIRED_COLUMNS) {
        const present = existingRegisteredEventColumns.has(columnName);


        rows.push({
          index: allStatements.length + 2,
          ok: present,
          status: present ? "COLUMN_PRESENT" : "COLUMN_MISSING",
          sqlHash: null,
          tableName: "memory_registered_events",
          columnName,
          error: present
            ? null
            : `Required column memory_registered_events.${columnName} is missing.`
        });
      }
    } catch (error) {
      return buildResult<HbceDatabaseQueryRow>({
        ok: false,
        status: "INITIALIZATION_FAILED",
        rows,
        rowCount: executedStatements,
        error: `Schema statements executed with ${failedStatements} statement error(s), but memory_registered_events column verification failed: ${safeError(error)}`,
        sql: joinedSql,
        startedAt
      });
    }


    if (missingTables.length > 0 || missingMemoryColumns.length > 0 || missingRegisteredEventColumns.length > 0) {
      return buildResult<HbceDatabaseQueryRow>({
        ok: false,
        status: "INITIALIZATION_FAILED",
        rows,
        rowCount: executedStatements,
        error:
          `HBCE database schema initialization incomplete. ` +
          `Missing tables: ${missingTables.length ? missingTables.join(", ") : "none"}. ` +
          `Missing memory_records columns: ${missingMemoryColumns.length ? missingMemoryColumns.join(", ") : "none"}. ` +
          `Missing memory_registered_events columns: ${missingRegisteredEventColumns.length ? missingRegisteredEventColumns.join(", ") : "none"}. ` +
          `Statement failures: ${failedStatements}.`,
        sql: joinedSql,
        startedAt
      });
    }


    return buildResult<HbceDatabaseQueryRow>({
      ok: true,
      status: "AVAILABLE",
      rows,
      rowCount: executedStatements,
      error:
        failedStatements > 0
          ? `Schema available with ${failedStatements} non-fatal statement failure(s). Existing incompatible constraints or legacy columns may already have been normalized.`
          : null,
      sql: joinedSql,
      startedAt
    });
  }


  async query<Row extends HbceDatabaseQueryRow = HbceDatabaseQueryRow>(
    sqlText: string,
    params: HbceDatabaseQueryValue[] = []
  ): Promise<HbceDatabaseQueryResult<Row>> {
    const startedAt = nowMs();
    const normalizedSql = sqlText.trim();


    if (!normalizedSql) {
      return buildResult<Row>({
        ok: false,
        status: "QUERY_FAILED",
        rows: [],
        rowCount: 0,
        error: "EMPTY_SQL_QUERY",
        sql: sqlText,
        startedAt
      });
    }


    if (shouldAutoApplySchema() && shouldInitializeBeforeQuery(normalizedSql)) {
      await this.initializeSchema();
    }


    try {
      const sql = this.getSql();
      const result = await sql.query(
        normalizedSql,
        serializeQueryParams(params)
      );
      const rows = normalizeRows<Row>(result);


      return buildResult<Row>({
        ok: true,
        status: "AVAILABLE",
        rows,
        rowCount: rows.length,
        sql: sqlText,
        startedAt
      });
    } catch (error) {
      return buildResult<Row>({
        ok: false,
        status: "QUERY_FAILED",
        rows: [],
        rowCount: 0,
        error: safeError(error),
        sql: sqlText,
        startedAt
      });
    }
  }
}


const globalForHbceDatabase = globalThis as typeof globalThis & {
  __hbceDatabaseAdapter?: HbceDatabaseAdapter;
};


export function createHbceDatabaseAdapter(): HbceDatabaseAdapter {
  const databaseUrl = getDatabaseUrlFromEnv();


  if (!databaseUrl) {
    return new DisabledHbceDatabaseAdapter();
  }


  return new NeonHttpHbceDatabaseAdapter(databaseUrl);
}


export function getDefaultHbceDatabase(): HbceDatabaseAdapter {
  if (!globalForHbceDatabase.__hbceDatabaseAdapter) {
    globalForHbceDatabase.__hbceDatabaseAdapter = createHbceDatabaseAdapter();
  }


  return globalForHbceDatabase.__hbceDatabaseAdapter;
}


export function resetDefaultHbceDatabaseForTests(): void {
  delete globalForHbceDatabase.__hbceDatabaseAdapter;
}


export function describeDefaultHbceDatabase(): HbceDatabaseDescription {
  return getDefaultHbceDatabase().describe();
}


export function isHbceDatabaseConfigured(): boolean {
  return isDatabaseUrlConfigured();
}


export function isHbceDatabaseAvailable(): boolean {
  const description = describeDefaultHbceDatabase();


  return description.configured && description.available;
}


export async function initializeHbceDatabaseSchema(): Promise<HbceDatabaseQueryResult> {
  return getDefaultHbceDatabase().initializeSchema();
}


export async function applyHbceDatabaseSchemaAsync(): Promise<HbceDatabaseQueryResult> {
  return initializeHbceDatabaseSchema();
}


export async function queryHbceDatabase<
  Row extends HbceDatabaseQueryRow = HbceDatabaseQueryRow
>(
  sql: string,
  params: HbceDatabaseQueryValue[] = []
): Promise<HbceDatabaseQueryResult<Row>> {
  return getDefaultHbceDatabase().query<Row>(sql, params);
}


export async function ensureHbceDatabaseReady(): Promise<HbceDatabaseReadyResult> {
  const database = getDefaultHbceDatabase();
  const initialization = await database.initializeSchema();


  return {
    ok: initialization.ok,
    description: database.describe(),
    initialization,
    schema: HBCE_DATABASE_SCHEMA
  };
}


function normalizeRegisteredEventName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9:_-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "") || "unnamed_event";
}


function stringOrNull(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }


  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }


  return null;
}


function booleanOrFalse(value: unknown): boolean {
  return value === true;
}

function numberOrNull(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "bigint") {
    return Number(value);
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function jsonOrNull(value: unknown): unknown {
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  return value ?? null;
}

function toIsoDateOrNull(value: string | Date | null | undefined): string | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return value;
}

function clampDatabaseLimit(value: number | null | undefined, fallback: number, max: number): number {
  return Math.max(1, Math.min(max, Math.round(value ?? fallback)));
}

function normalizeMessagePreview(content: string, maxLength = 220): string {
  const normalized = content.replace(/\s+/g, " ").trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1)}…`;
}

function sha256(input: string): string {
  return `sha256:${createHash("sha256").update(input).digest("hex")}`;
}

function createDatabaseId(prefix: string): string {
  const timePart = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
  const randomPart = randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();

  return `${prefix}-${timePart}-${randomPart}`;
}

function buildIprRadicalIntentionPayload(input: {
  primaryIntention?: string | null;
  radicalIntention?: string | null;
  payload?: Record<string, unknown>;
}): Record<string, unknown> {
  const primaryIntention = stringOrNull(input.primaryIntention ?? input.radicalIntention);

  return {
    ...(input.payload ?? {}),
    iprMemoryMeaning: {
      identityPrimaryRecord: "Operational identity chain bound to IPR, EVT, OPC and audit.",
      intenzionePrimariaRadicale:
        primaryIntention ||
        "Explicit user-authorized operational intention extracted from the saved chat.",
      saveMode: "USER_EXPLICIT_SAVE_TO_IPR",
      rawContentDefault: "SYNTHESIS_ONLY_BY_DEFAULT"
    },
    legalCertification: false
  };
}



export async function upsertIprChatThreadToDatabase(
  input: IprChatThreadDatabaseInput
): Promise<HbceDatabaseQueryResult<IprChatThreadDatabaseRow>> {
  return queryHbceDatabase<IprChatThreadDatabaseRow>(
    `
INSERT INTO chat_threads (
  thread_id,
  tenant_id,
  workspace_id,
  human_ipr,
  runtime_ipr,
  session_id,
  title,
  scope,
  authority,
  continuity_ref,
  last_evt_id,
  last_opc_proof_id,
  last_opc_chain_hash,
  recent_status,
  pinned,
  archived,
  last_message_preview,
  metadata,
  legal_certification,
  created_at,
  updated_at
)
VALUES (
  $1, $2, $3, $4, COALESCE($5, 'IPR-AI-0001'), $6,
  COALESCE(NULLIF($7, ''), 'JOKER-C2 Chat'),
  COALESCE(NULLIF($8, ''), 'RUNTIME_ONLY'),
  COALESCE(NULLIF($9, ''), 'SESSION_RUNTIME_ONLY'),
  $10, $11, $12, $13,
  COALESCE(NULLIF($14, ''), 'ACTIVE'),
  COALESCE($15::boolean, false),
  COALESCE($16::boolean, false),
  $17,
  COALESCE($18::jsonb, '{}'::jsonb),
  false,
  now(),
  now()
)
ON CONFLICT (thread_id)
DO UPDATE SET
  tenant_id = COALESCE(EXCLUDED.tenant_id, chat_threads.tenant_id),
  workspace_id = COALESCE(EXCLUDED.workspace_id, chat_threads.workspace_id),
  human_ipr = COALESCE(EXCLUDED.human_ipr, chat_threads.human_ipr),
  runtime_ipr = COALESCE(EXCLUDED.runtime_ipr, chat_threads.runtime_ipr),
  session_id = COALESCE(EXCLUDED.session_id, chat_threads.session_id),
  title = COALESCE(NULLIF(EXCLUDED.title, ''), chat_threads.title),
  scope = COALESCE(NULLIF(EXCLUDED.scope, ''), chat_threads.scope),
  authority = COALESCE(NULLIF(EXCLUDED.authority, ''), chat_threads.authority),
  continuity_ref = COALESCE(EXCLUDED.continuity_ref, chat_threads.continuity_ref),
  last_evt_id = COALESCE(EXCLUDED.last_evt_id, chat_threads.last_evt_id),
  last_opc_proof_id = COALESCE(EXCLUDED.last_opc_proof_id, chat_threads.last_opc_proof_id),
  last_opc_chain_hash = COALESCE(EXCLUDED.last_opc_chain_hash, chat_threads.last_opc_chain_hash),
  recent_status = COALESCE(NULLIF(EXCLUDED.recent_status, ''), chat_threads.recent_status),
  pinned = EXCLUDED.pinned,
  archived = EXCLUDED.archived,
  last_message_preview = COALESCE(EXCLUDED.last_message_preview, chat_threads.last_message_preview),
  metadata = COALESCE(chat_threads.metadata, '{}'::jsonb) || COALESCE(EXCLUDED.metadata, '{}'::jsonb),
  legal_certification = false,
  updated_at = now()
RETURNING *;
`.trim(),
    [
      input.threadId,
      input.tenantId ?? null,
      input.workspaceId ?? null,
      input.humanIpr ?? null,
      input.runtimeIpr ?? null,
      input.sessionId ?? null,
      input.title ?? null,
      input.scope ?? null,
      input.authority ?? null,
      input.continuityRef ?? null,
      input.lastEvtId ?? null,
      input.lastOpcProofId ?? null,
      input.lastOpcChainHash ?? null,
      input.recentStatus ?? null,
      input.pinned ?? false,
      input.archived ?? false,
      input.lastMessagePreview ?? null,
      input.metadata ?? {}
    ]
  );
}

export async function persistIprChatMessageToDatabase(
  input: IprChatMessageDatabaseInput
): Promise<HbceDatabaseQueryResult<IprChatMessageDatabaseRow>> {
  const messageHash = input.messageHash || sha256(input.content);
  const preview = normalizeMessagePreview(input.content);
  const createdAt = toIsoDateOrNull(input.createdAt);

  const messageResult = await queryHbceDatabase<IprChatMessageDatabaseRow>(
    `
INSERT INTO chat_messages (
  message_id,
  tenant_id,
  workspace_id,
  thread_id,
  human_ipr,
  runtime_ipr,
  session_id,
  role,
  content,
  message_hash,
  evt_id,
  opc_proof_id,
  opc_chain_hash,
  temporal_certificate,
  response_utc,
  birth_anchor_local,
  birth_anchor_utc,
  joker_lifetime,
  joker_life_seconds,
  runtime_state,
  runtime_decision,
  generation_class,
  message_visibility,
  included_in_ipr_memory,
  save_candidate,
  source_save_id,
  content_hash_policy,
  created_at,
  metadata,
  legal_certification
)
VALUES (
  $1, $2, $3, $4, $5, COALESCE($6, 'IPR-AI-0001'), $7, $8, $9, $10,
  $11, $12, $13, COALESCE($14::jsonb, '{}'::jsonb), $15::timestamptz,
  $16, $17::timestamptz, $18, $19, $20, $21, $22,
  COALESCE(NULLIF($23, ''), 'THREAD'),
  COALESCE($24::boolean, false),
  COALESCE($25::boolean, false),
  $26,
  COALESCE(NULLIF($27, ''), 'FULL_CONTENT_HASHED'),
  COALESCE($28::timestamptz, now()),
  COALESCE($29::jsonb, '{}'::jsonb),
  false
)
ON CONFLICT (message_id)
DO UPDATE SET
  tenant_id = COALESCE(EXCLUDED.tenant_id, chat_messages.tenant_id),
  workspace_id = COALESCE(EXCLUDED.workspace_id, chat_messages.workspace_id),
  thread_id = EXCLUDED.thread_id,
  human_ipr = COALESCE(EXCLUDED.human_ipr, chat_messages.human_ipr),
  runtime_ipr = COALESCE(EXCLUDED.runtime_ipr, chat_messages.runtime_ipr),
  session_id = COALESCE(EXCLUDED.session_id, chat_messages.session_id),
  role = EXCLUDED.role,
  content = EXCLUDED.content,
  message_hash = EXCLUDED.message_hash,
  evt_id = COALESCE(EXCLUDED.evt_id, chat_messages.evt_id),
  opc_proof_id = COALESCE(EXCLUDED.opc_proof_id, chat_messages.opc_proof_id),
  opc_chain_hash = COALESCE(EXCLUDED.opc_chain_hash, chat_messages.opc_chain_hash),
  temporal_certificate = COALESCE(chat_messages.temporal_certificate, '{}'::jsonb) || COALESCE(EXCLUDED.temporal_certificate, '{}'::jsonb),
  response_utc = COALESCE(EXCLUDED.response_utc, chat_messages.response_utc),
  birth_anchor_local = COALESCE(EXCLUDED.birth_anchor_local, chat_messages.birth_anchor_local),
  birth_anchor_utc = COALESCE(EXCLUDED.birth_anchor_utc, chat_messages.birth_anchor_utc),
  joker_lifetime = COALESCE(EXCLUDED.joker_lifetime, chat_messages.joker_lifetime),
  joker_life_seconds = COALESCE(EXCLUDED.joker_life_seconds, chat_messages.joker_life_seconds),
  runtime_state = COALESCE(EXCLUDED.runtime_state, chat_messages.runtime_state),
  runtime_decision = COALESCE(EXCLUDED.runtime_decision, chat_messages.runtime_decision),
  generation_class = COALESCE(EXCLUDED.generation_class, chat_messages.generation_class),
  message_visibility = COALESCE(NULLIF(EXCLUDED.message_visibility, ''), chat_messages.message_visibility),
  included_in_ipr_memory = EXCLUDED.included_in_ipr_memory,
  save_candidate = EXCLUDED.save_candidate,
  source_save_id = COALESCE(EXCLUDED.source_save_id, chat_messages.source_save_id),
  content_hash_policy = COALESCE(NULLIF(EXCLUDED.content_hash_policy, ''), chat_messages.content_hash_policy),
  metadata = COALESCE(chat_messages.metadata, '{}'::jsonb) || COALESCE(EXCLUDED.metadata, '{}'::jsonb),
  legal_certification = false
RETURNING *;
`.trim(),
    [
      input.messageId,
      input.tenantId ?? null,
      input.workspaceId ?? null,
      input.threadId,
      input.humanIpr ?? null,
      input.runtimeIpr ?? null,
      input.sessionId ?? null,
      input.role,
      input.content,
      messageHash,
      input.evtId ?? null,
      input.opcProofId ?? null,
      input.opcChainHash ?? null,
      input.temporalCertificate ?? {},
      toIsoDateOrNull(input.responseUtc),
      input.birthAnchorLocal ?? null,
      toIsoDateOrNull(input.birthAnchorUtc),
      input.jokerLifetime ?? null,
      input.jokerLifeSeconds ?? null,
      input.runtimeState ?? null,
      input.runtimeDecision ?? null,
      input.generationClass ?? null,
      input.messageVisibility ?? null,
      input.includedInIprMemory ?? false,
      input.saveCandidate ?? false,
      input.sourceSaveId ?? null,
      input.contentHashPolicy ?? null,
      createdAt,
      input.metadata ?? {}
    ]
  );

  await queryHbceDatabase(
    `
UPDATE chat_threads
SET
  message_count = GREATEST(0, COALESCE(message_count, 0)) + 1,
  last_message_at = COALESCE($2::timestamptz, now()),
  last_message_preview = $3,
  updated_at = now(),
  legal_certification = false
WHERE thread_id = $1;
`.trim(),
    [input.threadId, createdAt, preview]
  );

  return messageResult;
}

export async function listRecentIprChatThreadsFromDatabase(input: {
  humanIpr?: string | null;
  tenantId?: string | null;
  workspaceId?: string | null;
  sessionId?: string | null;
  includeArchived?: boolean;
  limit?: number;
} = {}): Promise<HbceDatabaseQueryResult<IprChatThreadDatabaseRow>> {
  const limit = clampDatabaseLimit(input.limit, 20, 100);

  return queryHbceDatabase<IprChatThreadDatabaseRow>(
    `
SELECT *
FROM chat_threads
WHERE ($1::text IS NULL OR human_ipr = $1)
  AND ($2::text IS NULL OR tenant_id = $2)
  AND ($3::text IS NULL OR workspace_id = $3)
  AND ($4::text IS NULL OR session_id = $4)
  AND ($5::boolean = true OR archived = false)
ORDER BY pinned DESC, COALESCE(last_message_at, updated_at, created_at) DESC
LIMIT $6;
`.trim(),
    [
      input.humanIpr ?? null,
      input.tenantId ?? null,
      input.workspaceId ?? null,
      input.sessionId ?? null,
      input.includeArchived === true,
      limit
    ]
  );
}

export async function listIprChatMessagesFromDatabase(input: {
  threadId: string;
  humanIpr?: string | null;
  tenantId?: string | null;
  workspaceId?: string | null;
  limit?: number;
}): Promise<HbceDatabaseQueryResult<IprChatMessageDatabaseRow>> {
  const limit = clampDatabaseLimit(input.limit, 100, 500);

  return queryHbceDatabase<IprChatMessageDatabaseRow>(
    `
SELECT *
FROM chat_messages
WHERE thread_id = $1
  AND ($2::text IS NULL OR human_ipr = $2)
  AND ($3::text IS NULL OR tenant_id = $3)
  AND ($4::text IS NULL OR workspace_id = $4)
ORDER BY created_at ASC
LIMIT $5;
`.trim(),
    [
      input.threadId,
      input.humanIpr ?? null,
      input.tenantId ?? null,
      input.workspaceId ?? null,
      limit
    ]
  );
}

export async function persistIprMemoryRecordToDatabase(
  input: IprMemoryRecordDatabaseInput
): Promise<HbceDatabaseQueryResult<IprMemoryRecordDatabaseRow>> {
  const memoryKeyHash = input.memoryKeyHash || sha256([
    input.humanIpr || "UNKNOWN_IPR",
    input.sourceKind || "RUNTIME_MEMORY",
    input.sourceThreadId || input.threadId || "NO_THREAD",
    input.sourceSavedChatId || "NO_SAVED_CHAT",
    input.memoryTitle || input.memoryId
  ].join("|"));
  const memoryHash = input.memoryHash || sha256(JSON.stringify({
    memoryId: input.memoryId,
    title: input.memoryTitle ?? null,
    summary: input.memorySummary ?? null,
    semanticTerms: input.semanticTerms ?? [],
    payload: input.recordPayload ?? {}
  }));
  const createdAt = toIsoDateOrNull(input.createdAt);

  return queryHbceDatabase<IprMemoryRecordDatabaseRow>(
    `
INSERT INTO memory_records (
  memory_id,
  tenant_id,
  workspace_id,
  memory_key_hash,
  human_ipr,
  runtime_ipr,
  session_id,
  thread_id,
  scope,
  authority,
  persistence_mode,
  memory_kind,
  memory_status,
  source_kind,
  source_thread_id,
  source_saved_chat_id,
  source_message_ids,
  memory_title,
  memory_summary,
  save_raw,
  save_synthesis,
  reusable_in_prompt,
  classification,
  quality,
  threshold_detected,
  semantic_terms,
  memory_hash,
  memory_chain_hash,
  last_evt_id,
  last_opc_proof_id,
  last_opc_chain_hash,
  temporal_certificate,
  response_utc,
  birth_anchor_local,
  birth_anchor_utc,
  joker_lifetime,
  joker_life_seconds,
  created_at,
  updated_at,
  record_payload,
  legal_certification
)
VALUES (
  $1, $2, $3, $4, $5, COALESCE($6, 'IPR-AI-0001'), COALESCE($7, 'UNKNOWN_SESSION'),
  $8, COALESCE(NULLIF($9, ''), 'RUNTIME_ONLY'), COALESCE(NULLIF($10, ''), 'SESSION_RUNTIME_ONLY'),
  COALESCE(NULLIF($11, ''), 'DATABASE_PERSISTENT'), COALESCE(NULLIF($12, ''), 'RUNTIME_MEMORY'),
  COALESCE(NULLIF($13, ''), 'ACTIVE'), COALESCE(NULLIF($14, ''), 'RUNTIME_MEMORY'),
  $15, $16, COALESCE($17::jsonb, '[]'::jsonb), $18, $19,
  COALESCE($20::boolean, false), COALESCE($21::boolean, true), COALESCE($22::boolean, false),
  $23, $24, $25::boolean, COALESCE($26::jsonb, '[]'::jsonb), $27, $28,
  $29, $30, $31, COALESCE($32::jsonb, '{}'::jsonb), $33::timestamptz,
  $34, $35::timestamptz, $36, $37,
  COALESCE($38::timestamptz, now()), now(), COALESCE($39::jsonb, '{}'::jsonb), false
)
ON CONFLICT (memory_id)
DO UPDATE SET
  tenant_id = COALESCE(EXCLUDED.tenant_id, memory_records.tenant_id),
  workspace_id = COALESCE(EXCLUDED.workspace_id, memory_records.workspace_id),
  memory_key_hash = EXCLUDED.memory_key_hash,
  human_ipr = COALESCE(EXCLUDED.human_ipr, memory_records.human_ipr),
  runtime_ipr = COALESCE(EXCLUDED.runtime_ipr, memory_records.runtime_ipr),
  session_id = COALESCE(EXCLUDED.session_id, memory_records.session_id),
  thread_id = COALESCE(EXCLUDED.thread_id, memory_records.thread_id),
  scope = COALESCE(NULLIF(EXCLUDED.scope, ''), memory_records.scope),
  authority = COALESCE(NULLIF(EXCLUDED.authority, ''), memory_records.authority),
  persistence_mode = COALESCE(NULLIF(EXCLUDED.persistence_mode, ''), memory_records.persistence_mode),
  memory_kind = COALESCE(NULLIF(EXCLUDED.memory_kind, ''), memory_records.memory_kind),
  memory_status = COALESCE(NULLIF(EXCLUDED.memory_status, ''), memory_records.memory_status),
  source_kind = COALESCE(NULLIF(EXCLUDED.source_kind, ''), memory_records.source_kind),
  source_thread_id = COALESCE(EXCLUDED.source_thread_id, memory_records.source_thread_id),
  source_saved_chat_id = COALESCE(EXCLUDED.source_saved_chat_id, memory_records.source_saved_chat_id),
  source_message_ids = COALESCE(EXCLUDED.source_message_ids, memory_records.source_message_ids),
  memory_title = COALESCE(EXCLUDED.memory_title, memory_records.memory_title),
  memory_summary = COALESCE(EXCLUDED.memory_summary, memory_records.memory_summary),
  save_raw = EXCLUDED.save_raw,
  save_synthesis = EXCLUDED.save_synthesis,
  reusable_in_prompt = EXCLUDED.reusable_in_prompt,
  classification = COALESCE(EXCLUDED.classification, memory_records.classification),
  quality = COALESCE(EXCLUDED.quality, memory_records.quality),
  threshold_detected = COALESCE(EXCLUDED.threshold_detected, memory_records.threshold_detected),
  semantic_terms = COALESCE(EXCLUDED.semantic_terms, memory_records.semantic_terms),
  memory_hash = EXCLUDED.memory_hash,
  memory_chain_hash = COALESCE(EXCLUDED.memory_chain_hash, memory_records.memory_chain_hash),
  last_evt_id = COALESCE(EXCLUDED.last_evt_id, memory_records.last_evt_id),
  last_opc_proof_id = COALESCE(EXCLUDED.last_opc_proof_id, memory_records.last_opc_proof_id),
  last_opc_chain_hash = COALESCE(EXCLUDED.last_opc_chain_hash, memory_records.last_opc_chain_hash),
  temporal_certificate = COALESCE(memory_records.temporal_certificate, '{}'::jsonb) || COALESCE(EXCLUDED.temporal_certificate, '{}'::jsonb),
  response_utc = COALESCE(EXCLUDED.response_utc, memory_records.response_utc),
  birth_anchor_local = COALESCE(EXCLUDED.birth_anchor_local, memory_records.birth_anchor_local),
  birth_anchor_utc = COALESCE(EXCLUDED.birth_anchor_utc, memory_records.birth_anchor_utc),
  joker_lifetime = COALESCE(EXCLUDED.joker_lifetime, memory_records.joker_lifetime),
  joker_life_seconds = COALESCE(EXCLUDED.joker_life_seconds, memory_records.joker_life_seconds),
  record_payload = COALESCE(memory_records.record_payload, '{}'::jsonb) || COALESCE(EXCLUDED.record_payload, '{}'::jsonb),
  legal_certification = false,
  updated_at = now()
RETURNING *;
`.trim(),
    [
      input.memoryId,
      input.tenantId ?? null,
      input.workspaceId ?? null,
      memoryKeyHash,
      input.humanIpr ?? null,
      input.runtimeIpr ?? null,
      input.sessionId ?? null,
      input.threadId ?? null,
      input.scope ?? null,
      input.authority ?? null,
      input.persistenceMode ?? null,
      input.memoryKind ?? null,
      input.memoryStatus ?? null,
      input.sourceKind ?? null,
      input.sourceThreadId ?? null,
      input.sourceSavedChatId ?? null,
      input.sourceMessageIds ?? [],
      input.memoryTitle ?? null,
      input.memorySummary ?? null,
      input.saveRaw ?? false,
      input.saveSynthesis ?? true,
      input.reusableInPrompt ?? false,
      input.classification ?? null,
      input.quality ?? null,
      input.thresholdDetected ?? null,
      input.semanticTerms ?? [],
      memoryHash,
      input.memoryChainHash ?? null,
      input.lastEvtId ?? null,
      input.lastOpcProofId ?? null,
      input.lastOpcChainHash ?? null,
      input.temporalCertificate ?? {},
      toIsoDateOrNull(input.responseUtc),
      input.birthAnchorLocal ?? null,
      toIsoDateOrNull(input.birthAnchorUtc),
      input.jokerLifetime ?? null,
      input.jokerLifeSeconds ?? null,
      createdAt,
      input.recordPayload ?? {}
    ]
  );
}

export async function saveIprChatToMemoryDatabase(
  input: IprChatMemorySaveDatabaseInput
): Promise<SaveIprChatToMemoryDatabaseResult> {
  const savedChatId = input.savedChatId || createDatabaseId("IPR-CHAT-SAVE");
  const memoryId = input.memoryId || createDatabaseId("IPR-MEM");
  const registeredEventId = input.registeredEventId || createDatabaseId("REVT");
  const selectedMessageIds = input.selectedMessageIds ?? [];
  const primaryIntention = stringOrNull(input.primaryIntention ?? input.radicalIntention);
  const memoryTitle = input.memoryTitle || "Saved JOKER-C2 chat on IPR";
  const memorySummary =
    input.memorySummary ||
    primaryIntention ||
    "Explicit user-authorized IPR chat memory save.";
  const payload = buildIprRadicalIntentionPayload({
    primaryIntention,
    radicalIntention: input.radicalIntention,
    payload: {
      ...(input.payload ?? {}),
      registeredEventId
    }
  });
  const createdAt = toIsoDateOrNull(input.createdAt);
  const memoryHash = input.memoryHash || sha256(JSON.stringify({
    savedChatId,
    memoryId,
    threadId: input.threadId,
    selectedMessageIds,
    memoryTitle,
    memorySummary,
    primaryIntention,
    payload
  }));
  const saveHash = input.saveHash || sha256(JSON.stringify({
    savedChatId,
    memoryId,
    threadId: input.threadId,
    selectedMessageIds,
    memoryHash,
    previousSaveHash: input.previousSaveHash ?? null
  }));
  const continuityHash = input.continuityHash || sha256([
    input.previousSaveHash || "GENESIS_IPR_CHAT_SAVE",
    saveHash,
    memoryHash
  ].join("|"));

  const saveResult = await queryHbceDatabase<IprChatMemorySaveDatabaseRow>(
    `
INSERT INTO ipr_chat_memory_saves (
  saved_chat_id,
  tenant_id,
  workspace_id,
  subscription_id,
  account_id,
  human_ipr,
  runtime_ipr,
  session_id,
  thread_id,
  memory_id,
  registered_event_id,
  evt_id,
  opc_proof_id,
  audit_id,
  usage_id,
  save_intent,
  save_scope,
  save_status,
  memory_status,
  memory_title,
  memory_summary,
  classification,
  raw_content_saved,
  raw_content_policy,
  save_raw,
  save_synthesis,
  reusable_in_prompt,
  selected_message_ids,
  message_count,
  save_hash,
  memory_hash,
  previous_save_hash,
  continuity_hash,
  temporal_certificate,
  response_utc,
  birth_anchor_local,
  birth_anchor_utc,
  joker_lifetime,
  joker_life_seconds,
  created_at,
  updated_at,
  payload,
  legal_certification
)
VALUES (
  $1, $2, $3, $4, $5, $6, COALESCE($7, 'IPR-AI-0001'), $8, $9, $10,
  $11, $12, $13, $14, $15,
  COALESCE(NULLIF($16, ''), 'USER_EXPLICIT_SAVE_TO_IPR'),
  COALESCE(NULLIF($17, ''), 'IPR_BOUND'),
  COALESCE(NULLIF($18, ''), 'SAVED'),
  COALESCE(NULLIF($19, ''), 'ACTIVE'),
  COALESCE(NULLIF($20, ''), 'Saved JOKER-C2 chat'),
  $21,
  COALESCE(NULLIF($22, ''), 'USER_SELECTED_CHAT_MEMORY'),
  COALESCE($23::boolean, false),
  COALESCE(NULLIF($24, ''), 'SYNTHESIS_ONLY_BY_DEFAULT'),
  COALESCE($25::boolean, false),
  COALESCE($26::boolean, true),
  COALESCE($27::boolean, true),
  COALESCE($28::jsonb, '[]'::jsonb),
  COALESCE($29::integer, 0),
  $30, $31, $32, $33,
  COALESCE($34::jsonb, '{}'::jsonb),
  $35::timestamptz,
  $36,
  $37::timestamptz,
  $38,
  $39,
  COALESCE($40::timestamptz, now()),
  now(),
  COALESCE($41::jsonb, '{}'::jsonb),
  false
)
ON CONFLICT (saved_chat_id)
DO UPDATE SET
  tenant_id = COALESCE(EXCLUDED.tenant_id, ipr_chat_memory_saves.tenant_id),
  workspace_id = COALESCE(EXCLUDED.workspace_id, ipr_chat_memory_saves.workspace_id),
  subscription_id = COALESCE(EXCLUDED.subscription_id, ipr_chat_memory_saves.subscription_id),
  account_id = COALESCE(EXCLUDED.account_id, ipr_chat_memory_saves.account_id),
  human_ipr = COALESCE(EXCLUDED.human_ipr, ipr_chat_memory_saves.human_ipr),
  runtime_ipr = COALESCE(EXCLUDED.runtime_ipr, ipr_chat_memory_saves.runtime_ipr),
  session_id = COALESCE(EXCLUDED.session_id, ipr_chat_memory_saves.session_id),
  thread_id = EXCLUDED.thread_id,
  memory_id = EXCLUDED.memory_id,
  registered_event_id = COALESCE(EXCLUDED.registered_event_id, ipr_chat_memory_saves.registered_event_id),
  evt_id = COALESCE(EXCLUDED.evt_id, ipr_chat_memory_saves.evt_id),
  opc_proof_id = COALESCE(EXCLUDED.opc_proof_id, ipr_chat_memory_saves.opc_proof_id),
  audit_id = COALESCE(EXCLUDED.audit_id, ipr_chat_memory_saves.audit_id),
  usage_id = COALESCE(EXCLUDED.usage_id, ipr_chat_memory_saves.usage_id),
  save_intent = COALESCE(NULLIF(EXCLUDED.save_intent, ''), ipr_chat_memory_saves.save_intent),
  save_scope = COALESCE(NULLIF(EXCLUDED.save_scope, ''), ipr_chat_memory_saves.save_scope),
  save_status = COALESCE(NULLIF(EXCLUDED.save_status, ''), ipr_chat_memory_saves.save_status),
  memory_status = COALESCE(NULLIF(EXCLUDED.memory_status, ''), ipr_chat_memory_saves.memory_status),
  memory_title = COALESCE(NULLIF(EXCLUDED.memory_title, ''), ipr_chat_memory_saves.memory_title),
  memory_summary = COALESCE(EXCLUDED.memory_summary, ipr_chat_memory_saves.memory_summary),
  classification = COALESCE(NULLIF(EXCLUDED.classification, ''), ipr_chat_memory_saves.classification),
  raw_content_saved = EXCLUDED.raw_content_saved,
  raw_content_policy = COALESCE(NULLIF(EXCLUDED.raw_content_policy, ''), ipr_chat_memory_saves.raw_content_policy),
  save_raw = EXCLUDED.save_raw,
  save_synthesis = EXCLUDED.save_synthesis,
  reusable_in_prompt = EXCLUDED.reusable_in_prompt,
  selected_message_ids = COALESCE(EXCLUDED.selected_message_ids, ipr_chat_memory_saves.selected_message_ids),
  message_count = EXCLUDED.message_count,
  save_hash = EXCLUDED.save_hash,
  memory_hash = EXCLUDED.memory_hash,
  previous_save_hash = COALESCE(EXCLUDED.previous_save_hash, ipr_chat_memory_saves.previous_save_hash),
  continuity_hash = EXCLUDED.continuity_hash,
  temporal_certificate = COALESCE(ipr_chat_memory_saves.temporal_certificate, '{}'::jsonb) || COALESCE(EXCLUDED.temporal_certificate, '{}'::jsonb),
  response_utc = COALESCE(EXCLUDED.response_utc, ipr_chat_memory_saves.response_utc),
  birth_anchor_local = COALESCE(EXCLUDED.birth_anchor_local, ipr_chat_memory_saves.birth_anchor_local),
  birth_anchor_utc = COALESCE(EXCLUDED.birth_anchor_utc, ipr_chat_memory_saves.birth_anchor_utc),
  joker_lifetime = COALESCE(EXCLUDED.joker_lifetime, ipr_chat_memory_saves.joker_lifetime),
  joker_life_seconds = COALESCE(EXCLUDED.joker_life_seconds, ipr_chat_memory_saves.joker_life_seconds),
  payload = COALESCE(ipr_chat_memory_saves.payload, '{}'::jsonb) || COALESCE(EXCLUDED.payload, '{}'::jsonb),
  legal_certification = false,
  updated_at = now()
RETURNING *;
`.trim(),
    [
      savedChatId,
      input.tenantId ?? null,
      input.workspaceId ?? null,
      input.subscriptionId ?? null,
      input.accountId ?? null,
      input.humanIpr ?? null,
      input.runtimeIpr ?? null,
      input.sessionId ?? null,
      input.threadId,
      memoryId,
      registeredEventId,
      input.evtId ?? null,
      input.opcProofId ?? null,
      input.auditId ?? null,
      input.usageId ?? null,
      input.saveIntent ?? null,
      input.saveScope ?? null,
      input.saveStatus ?? null,
      input.memoryStatus ?? null,
      memoryTitle,
      memorySummary,
      input.classification ?? null,
      input.rawContentSaved ?? false,
      input.rawContentPolicy ?? null,
      input.saveRaw ?? false,
      input.saveSynthesis ?? true,
      input.reusableInPrompt ?? true,
      selectedMessageIds,
      input.messageCount ?? selectedMessageIds.length,
      saveHash,
      memoryHash,
      input.previousSaveHash ?? null,
      continuityHash,
      input.temporalCertificate ?? {},
      toIsoDateOrNull(input.responseUtc),
      input.birthAnchorLocal ?? null,
      toIsoDateOrNull(input.birthAnchorUtc),
      input.jokerLifetime ?? null,
      input.jokerLifeSeconds ?? null,
      createdAt,
      payload
    ]
  );

  const memoryResult = await persistIprMemoryRecordToDatabase({
    memoryId,
    tenantId: input.tenantId ?? null,
    workspaceId: input.workspaceId ?? null,
    memoryKeyHash: sha256(`${input.humanIpr ?? "UNKNOWN_IPR"}|${input.threadId}|${savedChatId}`),
    humanIpr: input.humanIpr ?? null,
    runtimeIpr: input.runtimeIpr ?? null,
    sessionId: input.sessionId ?? null,
    threadId: input.threadId,
    scope: "IPR_BOUND",
    authority: "USER_EXPLICIT_SAVE_TO_IPR",
    persistenceMode: "DATABASE_PERSISTENT",
    memoryKind: "IPR_CHAT_MEMORY",
    memoryStatus: input.memoryStatus ?? "ACTIVE",
    sourceKind: "CHAT_SAVE",
    sourceThreadId: input.threadId,
    sourceSavedChatId: savedChatId,
    sourceMessageIds: selectedMessageIds,
    memoryTitle,
    memorySummary,
    saveRaw: input.saveRaw ?? false,
    saveSynthesis: input.saveSynthesis ?? true,
    reusableInPrompt: input.reusableInPrompt ?? true,
    classification: input.classification ?? "USER_SELECTED_CHAT_MEMORY",
    quality: "USER_CONFIRMED",
    thresholdDetected: true,
    semanticTerms: [
      "IPR",
      "Intenzione Primaria Radicale",
      "Identity Primary Record",
      "EVT",
      "OPC",
      "MATRIX"
    ],
    memoryHash,
    memoryChainHash: continuityHash,
    lastEvtId: input.evtId ?? null,
    lastOpcProofId: input.opcProofId ?? null,
    lastOpcChainHash: null,
    temporalCertificate: input.temporalCertificate ?? {},
    responseUtc: input.responseUtc ?? null,
    birthAnchorLocal: input.birthAnchorLocal ?? null,
    birthAnchorUtc: input.birthAnchorUtc ?? null,
    jokerLifetime: input.jokerLifetime ?? null,
    jokerLifeSeconds: input.jokerLifeSeconds ?? null,
    recordPayload: payload,
    createdAt: input.createdAt ?? null
  });

  const registeredEventResult = await persistRegisteredMemoryEventToDatabase({
    registeredEventId,
    eventName: memoryTitle,
    evt: input.evtId || registeredEventId,
    opcProofId: input.opcProofId ?? null,
    auditId: input.auditId ?? null,
    usageId: input.usageId ?? null,
    memoryId,
    memoryKeyHash: sha256(`${input.humanIpr ?? "UNKNOWN_IPR"}|${memoryId}|${registeredEventId}`),
    humanIpr: input.humanIpr ?? null,
    runtimeIpr: input.runtimeIpr ?? null,
    tenantId: input.tenantId ?? null,
    workspaceId: input.workspaceId ?? null,
    subscriptionId: input.subscriptionId ?? null,
    accountId: input.accountId ?? null,
    sessionId: input.sessionId ?? null,
    threadId: input.threadId,
    source: "IPR_CHAT_MEMORY_SAVE",
    riskLevel: "B2G_AUDIT_CONTROLLED",
    securityOutcome: "USER_EXPLICIT_SAVE_TO_IPR",
    operationDecision: "ALLOW_PERSISTENT_IPR_MEMORY_SAVE",
    policyDecision: "ALLOW_WITH_OPC_TECHNICAL_PROOF_BOUNDARY",
    createdAt: input.createdAt ?? null,
    recordPayload: payload
  });

  const threadResult = await queryHbceDatabase<IprChatThreadDatabaseRow>(
    `
UPDATE chat_threads
SET
  saved_to_ipr = true,
  saved_chat_id = $2,
  saved_memory_id = $3,
  memory_save_status = 'SAVED',
  last_evt_id = COALESCE($4, last_evt_id),
  last_opc_proof_id = COALESCE($5, last_opc_proof_id),
  updated_at = now(),
  legal_certification = false
WHERE thread_id = $1
RETURNING *;
`.trim(),
    [
      input.threadId,
      savedChatId,
      memoryId,
      input.evtId ?? null,
      input.opcProofId ?? null
    ]
  );

  const messageUpdateResult = await queryHbceDatabase<IprChatMessageDatabaseRow>(
    selectedMessageIds.length > 0
      ? `
UPDATE chat_messages
SET
  included_in_ipr_memory = true,
  source_save_id = $2,
  save_candidate = false,
  legal_certification = false
WHERE thread_id = $1
  AND message_id IN (
    SELECT jsonb_array_elements_text(COALESCE($3::jsonb, '[]'::jsonb))
  )
RETURNING *;
`.trim()
      : `
UPDATE chat_messages
SET
  included_in_ipr_memory = true,
  source_save_id = $2,
  save_candidate = false,
  legal_certification = false
WHERE thread_id = $1
RETURNING *;
`.trim(),
    selectedMessageIds.length > 0
      ? [input.threadId, savedChatId, selectedMessageIds]
      : [input.threadId, savedChatId]
  );

  return {
    ok:
      saveResult.ok &&
      memoryResult.ok &&
      registeredEventResult.ok &&
      threadResult.ok &&
      messageUpdateResult.ok,
    savedChatId,
    memoryId,
    saveResult,
    memoryResult,
    registeredEventResult,
    threadResult,
    messageUpdateResult,
    legalCertification: false
  };
}

export async function listIprChatMemorySavesFromDatabase(input: {
  humanIpr?: string | null;
  tenantId?: string | null;
  workspaceId?: string | null;
  threadId?: string | null;
  memoryStatus?: string | null;
  limit?: number;
} = {}): Promise<HbceDatabaseQueryResult<IprChatMemorySaveDatabaseRow>> {
  const limit = clampDatabaseLimit(input.limit, 20, 100);

  return queryHbceDatabase<IprChatMemorySaveDatabaseRow>(
    `
SELECT *
FROM ipr_chat_memory_saves
WHERE ($1::text IS NULL OR human_ipr = $1)
  AND ($2::text IS NULL OR tenant_id = $2)
  AND ($3::text IS NULL OR workspace_id = $3)
  AND ($4::text IS NULL OR thread_id = $4)
  AND ($5::text IS NULL OR memory_status = $5)
ORDER BY created_at DESC
LIMIT $6;
`.trim(),
    [
      input.humanIpr ?? null,
      input.tenantId ?? null,
      input.workspaceId ?? null,
      input.threadId ?? null,
      input.memoryStatus ?? null,
      limit
    ]
  );
}

export async function listIprMemoryRecordsFromDatabase(input: {
  humanIpr?: string | null;
  tenantId?: string | null;
  workspaceId?: string | null;
  sourceThreadId?: string | null;
  sourceSavedChatId?: string | null;
  reusableInPrompt?: boolean | null;
  memoryStatus?: string | null;
  limit?: number;
} = {}): Promise<HbceDatabaseQueryResult<IprMemoryRecordDatabaseRow>> {
  const limit = clampDatabaseLimit(input.limit, 20, 100);

  return queryHbceDatabase<IprMemoryRecordDatabaseRow>(
    `
SELECT *
FROM memory_records
WHERE ($1::text IS NULL OR human_ipr = $1)
  AND ($2::text IS NULL OR tenant_id = $2)
  AND ($3::text IS NULL OR workspace_id = $3)
  AND ($4::text IS NULL OR source_thread_id = $4 OR thread_id = $4)
  AND ($5::text IS NULL OR source_saved_chat_id = $5)
  AND ($6::boolean IS NULL OR reusable_in_prompt = $6)
  AND ($7::text IS NULL OR memory_status = $7)
ORDER BY updated_at DESC, created_at DESC
LIMIT $8;
`.trim(),
    [
      input.humanIpr ?? null,
      input.tenantId ?? null,
      input.workspaceId ?? null,
      input.sourceThreadId ?? null,
      input.sourceSavedChatId ?? null,
      input.reusableInPrompt ?? null,
      input.memoryStatus ?? null,
      limit
    ]
  );
}

export async function recallReusableIprMemoryRecordsFromDatabase(input: {
  humanIpr: string;
  tenantId?: string | null;
  workspaceId?: string | null;
  limit?: number;
}): Promise<HbceDatabaseQueryResult<IprMemoryRecordDatabaseRow>> {
  return listIprMemoryRecordsFromDatabase({
    humanIpr: input.humanIpr,
    tenantId: input.tenantId ?? null,
    workspaceId: input.workspaceId ?? null,
    reusableInPrompt: true,
    memoryStatus: "ACTIVE",
    limit: input.limit ?? 10
  });
}

export function toPublicIprChatThread(
  row: IprChatThreadDatabaseRow
): Record<string, unknown> {
  return {
    threadId: stringOrNull(row.thread_id),
    tenantId: stringOrNull(row.tenant_id),
    workspaceId: stringOrNull(row.workspace_id),
    humanIpr: stringOrNull(row.human_ipr),
    runtimeIpr: stringOrNull(row.runtime_ipr),
    sessionId: stringOrNull(row.session_id),
    title: stringOrNull(row.title),
    scope: stringOrNull(row.scope),
    authority: stringOrNull(row.authority),
    createdAt: stringOrNull(row.created_at),
    updatedAt: stringOrNull(row.updated_at),
    lastMessageAt: stringOrNull(row.last_message_at),
    continuityRef: stringOrNull(row.continuity_ref),
    lastEvtId: stringOrNull(row.last_evt_id),
    lastOpcProofId: stringOrNull(row.last_opc_proof_id),
    lastOpcChainHash: stringOrNull(row.last_opc_chain_hash),
    recentStatus: stringOrNull(row.recent_status),
    savedToIpr: booleanOrFalse(row.saved_to_ipr),
    savedChatId: stringOrNull(row.saved_chat_id),
    savedMemoryId: stringOrNull(row.saved_memory_id),
    memorySaveStatus: stringOrNull(row.memory_save_status),
    messageCount: numberOrNull(row.message_count),
    pinned: booleanOrFalse(row.pinned),
    archived: booleanOrFalse(row.archived),
    lastMessagePreview: stringOrNull(row.last_message_preview),
    metadata: jsonOrNull(row.metadata),
    legalCertification: false
  };
}

export function toPublicIprChatMessage(
  row: IprChatMessageDatabaseRow
): Record<string, unknown> {
  return {
    messageId: stringOrNull(row.message_id),
    tenantId: stringOrNull(row.tenant_id),
    workspaceId: stringOrNull(row.workspace_id),
    threadId: stringOrNull(row.thread_id),
    humanIpr: stringOrNull(row.human_ipr),
    runtimeIpr: stringOrNull(row.runtime_ipr),
    sessionId: stringOrNull(row.session_id),
    role: stringOrNull(row.role),
    content: stringOrNull(row.content),
    messageHash: stringOrNull(row.message_hash),
    evtId: stringOrNull(row.evt_id),
    opcProofId: stringOrNull(row.opc_proof_id),
    opcChainHash: stringOrNull(row.opc_chain_hash),
    temporalCertificate: jsonOrNull(row.temporal_certificate),
    responseUtc: stringOrNull(row.response_utc),
    runtimeState: stringOrNull(row.runtime_state),
    runtimeDecision: stringOrNull(row.runtime_decision),
    generationClass: stringOrNull(row.generation_class),
    messageVisibility: stringOrNull(row.message_visibility),
    includedInIprMemory: booleanOrFalse(row.included_in_ipr_memory),
    saveCandidate: booleanOrFalse(row.save_candidate),
    sourceSaveId: stringOrNull(row.source_save_id),
    contentHashPolicy: stringOrNull(row.content_hash_policy),
    createdAt: stringOrNull(row.created_at),
    metadata: jsonOrNull(row.metadata),
    legalCertification: false
  };
}

export function toPublicIprChatMemorySave(
  row: IprChatMemorySaveDatabaseRow
): Record<string, unknown> {
  return {
    savedChatId: stringOrNull(row.saved_chat_id),
    tenantId: stringOrNull(row.tenant_id),
    workspaceId: stringOrNull(row.workspace_id),
    subscriptionId: stringOrNull(row.subscription_id),
    accountId: stringOrNull(row.account_id),
    humanIpr: stringOrNull(row.human_ipr),
    runtimeIpr: stringOrNull(row.runtime_ipr),
    sessionId: stringOrNull(row.session_id),
    threadId: stringOrNull(row.thread_id),
    memoryId: stringOrNull(row.memory_id),
    registeredEventId: stringOrNull(row.registered_event_id),
    evtId: stringOrNull(row.evt_id),
    opcProofId: stringOrNull(row.opc_proof_id),
    auditId: stringOrNull(row.audit_id),
    usageId: stringOrNull(row.usage_id),
    saveIntent: stringOrNull(row.save_intent),
    saveScope: stringOrNull(row.save_scope),
    saveStatus: stringOrNull(row.save_status),
    memoryStatus: stringOrNull(row.memory_status),
    memoryTitle: stringOrNull(row.memory_title),
    memorySummary: stringOrNull(row.memory_summary),
    classification: stringOrNull(row.classification),
    rawContentSaved: booleanOrFalse(row.raw_content_saved),
    rawContentPolicy: stringOrNull(row.raw_content_policy),
    saveRaw: booleanOrFalse(row.save_raw),
    saveSynthesis: row.save_synthesis !== false,
    reusableInPrompt: row.reusable_in_prompt !== false,
    selectedMessageIds: jsonOrNull(row.selected_message_ids),
    messageCount: numberOrNull(row.message_count),
    saveHash: stringOrNull(row.save_hash),
    memoryHash: stringOrNull(row.memory_hash),
    previousSaveHash: stringOrNull(row.previous_save_hash),
    continuityHash: stringOrNull(row.continuity_hash),
    temporalCertificate: jsonOrNull(row.temporal_certificate),
    responseUtc: stringOrNull(row.response_utc),
    createdAt: stringOrNull(row.created_at),
    updatedAt: stringOrNull(row.updated_at),
    payload: jsonOrNull(row.payload),
    legalCertification: false
  };
}

export function toPublicIprMemoryRecord(
  row: IprMemoryRecordDatabaseRow
): Record<string, unknown> {
  return {
    memoryId: stringOrNull(row.memory_id),
    tenantId: stringOrNull(row.tenant_id),
    workspaceId: stringOrNull(row.workspace_id),
    memoryKeyHash: stringOrNull(row.memory_key_hash),
    humanIpr: stringOrNull(row.human_ipr),
    runtimeIpr: stringOrNull(row.runtime_ipr),
    sessionId: stringOrNull(row.session_id),
    threadId: stringOrNull(row.thread_id),
    scope: stringOrNull(row.scope),
    authority: stringOrNull(row.authority),
    persistenceMode: stringOrNull(row.persistence_mode),
    memoryKind: stringOrNull(row.memory_kind),
    memoryStatus: stringOrNull(row.memory_status),
    sourceKind: stringOrNull(row.source_kind),
    sourceThreadId: stringOrNull(row.source_thread_id),
    sourceSavedChatId: stringOrNull(row.source_saved_chat_id),
    sourceMessageIds: jsonOrNull(row.source_message_ids),
    memoryTitle: stringOrNull(row.memory_title),
    memorySummary: stringOrNull(row.memory_summary),
    saveRaw: booleanOrFalse(row.save_raw),
    saveSynthesis: row.save_synthesis !== false,
    reusableInPrompt: booleanOrFalse(row.reusable_in_prompt),
    classification: stringOrNull(row.classification),
    quality: stringOrNull(row.quality),
    thresholdDetected: booleanOrFalse(row.threshold_detected),
    semanticTerms: jsonOrNull(row.semantic_terms),
    memoryHash: stringOrNull(row.memory_hash),
    memoryChainHash: stringOrNull(row.memory_chain_hash),
    lastEvtId: stringOrNull(row.last_evt_id),
    lastOpcProofId: stringOrNull(row.last_opc_proof_id),
    lastOpcChainHash: stringOrNull(row.last_opc_chain_hash),
    temporalCertificate: jsonOrNull(row.temporal_certificate),
    responseUtc: stringOrNull(row.response_utc),
    createdAt: stringOrNull(row.created_at),
    updatedAt: stringOrNull(row.updated_at),
    recordPayload: jsonOrNull(row.record_payload),
    legalCertification: false
  };
}

export async function persistRegisteredMemoryEventToDatabase(
  input: RegisteredMemoryEventDatabaseInput
): Promise<HbceDatabaseQueryResult<RegisteredMemoryEventDatabaseRow>> {
  const eventName = input.eventName.trim() || "UNNAMED_OPERATIONAL_EVENT";
  const normalizedEventName = normalizeRegisteredEventName(
    input.normalizedEventName || eventName
  );
  const createdAt = input.createdAt instanceof Date
    ? input.createdAt.toISOString()
    : input.createdAt || new Date().toISOString();


  const registeredEventId = input.registeredEventId || createDatabaseId("REVT");


  return queryHbceDatabase<RegisteredMemoryEventDatabaseRow>(
    `
INSERT INTO memory_registered_events (
  registered_event_id,
  event_name,
  normalized_event_name,
  evt,
  opc_proof_id,
  opc_chain_hash,
  audit_id,
  usage_id,
  memory_id,
  memory_key_hash,
  human_ipr,
  runtime_ipr,
  tenant_id,
  workspace_id,
  subscription_id,
  account_id,
  session_id,
  thread_id,
  saas_tier,
  source,
  risk_level,
  security_outcome,
  operation_decision,
  policy_decision,
  record_payload,
  legal_certification,
  created_at,
  updated_at
)
VALUES (
  $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
  COALESCE($12, 'IPR-AI-0001'), $13, $14, $15, $16, $17, $18,
  $19, $20, $21, $22, $23, $24, COALESCE($25::jsonb, '{}'::jsonb), false,
  COALESCE($26::timestamptz, now()), now()
)
ON CONFLICT (memory_id, normalized_event_name)
DO UPDATE SET
  event_name = EXCLUDED.event_name,
  evt = EXCLUDED.evt,
  opc_proof_id = EXCLUDED.opc_proof_id,
  opc_chain_hash = EXCLUDED.opc_chain_hash,
  audit_id = EXCLUDED.audit_id,
  usage_id = EXCLUDED.usage_id,
  memory_key_hash = EXCLUDED.memory_key_hash,
  human_ipr = EXCLUDED.human_ipr,
  runtime_ipr = EXCLUDED.runtime_ipr,
  tenant_id = EXCLUDED.tenant_id,
  workspace_id = EXCLUDED.workspace_id,
  subscription_id = EXCLUDED.subscription_id,
  account_id = EXCLUDED.account_id,
  session_id = EXCLUDED.session_id,
  thread_id = EXCLUDED.thread_id,
  saas_tier = EXCLUDED.saas_tier,
  source = EXCLUDED.source,
  risk_level = EXCLUDED.risk_level,
  security_outcome = EXCLUDED.security_outcome,
  operation_decision = EXCLUDED.operation_decision,
  policy_decision = EXCLUDED.policy_decision,
  record_payload = EXCLUDED.record_payload,
  legal_certification = false,
  updated_at = now()
RETURNING *;
`.trim(),
    [
      registeredEventId,
      eventName,
      normalizedEventName,
      input.evt,
      input.opcProofId ?? null,
      input.opcChainHash ?? null,
      input.auditId ?? null,
      input.usageId ?? null,
      input.memoryId,
      input.memoryKeyHash ?? null,
      input.humanIpr ?? null,
      input.runtimeIpr ?? null,
      input.tenantId ?? null,
      input.workspaceId ?? null,
      input.subscriptionId ?? null,
      input.accountId ?? null,
      input.sessionId ?? null,
      input.threadId ?? null,
      input.saasTier ?? null,
      input.source ?? null,
      input.riskLevel ?? null,
      input.securityOutcome ?? null,
      input.operationDecision ?? null,
      input.policyDecision ?? null,
      input.recordPayload ?? {},
      createdAt
    ]
  );
}


export async function getRegisteredMemoryEventFromDatabase(input: {
  eventName: string;
  memoryId?: string | null;
  humanIpr?: string | null;
  tenantId?: string | null;
  workspaceId?: string | null;
}): Promise<HbceDatabaseQueryResult<RegisteredMemoryEventDatabaseRow>> {
  const normalizedEventName = normalizeRegisteredEventName(input.eventName);


  return queryHbceDatabase<RegisteredMemoryEventDatabaseRow>(
    `
SELECT *
FROM memory_registered_events
WHERE normalized_event_name = $1
  AND ($2::text IS NULL OR memory_id = $2)
  AND ($3::text IS NULL OR human_ipr = $3)
  AND ($4::text IS NULL OR tenant_id = $4)
  AND ($5::text IS NULL OR workspace_id = $5)
ORDER BY updated_at DESC, created_at DESC
LIMIT 1;
`.trim(),
    [
      normalizedEventName,
      input.memoryId ?? null,
      input.humanIpr ?? null,
      input.tenantId ?? null,
      input.workspaceId ?? null
    ]
  );
}


export async function listRegisteredMemoryEventsFromDatabase(input: {
  memoryId?: string | null;
  humanIpr?: string | null;
  tenantId?: string | null;
  workspaceId?: string | null;
  limit?: number;
} = {}): Promise<HbceDatabaseQueryResult<RegisteredMemoryEventDatabaseRow>> {
  const limit = Math.max(1, Math.min(100, Math.round(input.limit ?? 20)));


  return queryHbceDatabase<RegisteredMemoryEventDatabaseRow>(
    `
SELECT *
FROM memory_registered_events
WHERE ($1::text IS NULL OR memory_id = $1)
  AND ($2::text IS NULL OR human_ipr = $2)
  AND ($3::text IS NULL OR tenant_id = $3)
  AND ($4::text IS NULL OR workspace_id = $4)
ORDER BY updated_at DESC, created_at DESC
LIMIT $5;
`.trim(),
    [
      input.memoryId ?? null,
      input.humanIpr ?? null,
      input.tenantId ?? null,
      input.workspaceId ?? null,
      limit
    ]
  );
}


export function toPublicRegisteredMemoryEvent(
  row: RegisteredMemoryEventDatabaseRow
): Record<string, unknown> {
  return {
    registeredEventId: stringOrNull(row.registered_event_id),
    eventName: stringOrNull(row.event_name),
    normalizedEventName: stringOrNull(row.normalized_event_name),
    evt: stringOrNull(row.evt),
    opcProofId: stringOrNull(row.opc_proof_id),
    opcChainHash: stringOrNull(row.opc_chain_hash),
    auditId: stringOrNull(row.audit_id),
    usageId: stringOrNull(row.usage_id),
    memoryId: stringOrNull(row.memory_id),
    memoryKeyHash: stringOrNull(row.memory_key_hash),
    humanIpr: stringOrNull(row.human_ipr),
    runtimeIpr: stringOrNull(row.runtime_ipr),
    tenantId: stringOrNull(row.tenant_id),
    workspaceId: stringOrNull(row.workspace_id),
    subscriptionId: stringOrNull(row.subscription_id),
    accountId: stringOrNull(row.account_id),
    sessionId: stringOrNull(row.session_id),
    threadId: stringOrNull(row.thread_id),
    saasTier: stringOrNull(row.saas_tier),
    source: stringOrNull(row.source),
    riskLevel: stringOrNull(row.risk_level),
    securityOutcome: stringOrNull(row.security_outcome),
    operationDecision: stringOrNull(row.operation_decision),
    policyDecision: stringOrNull(row.policy_decision),
    recordPayload: row.record_payload ?? null,
    legalCertification: false,
    createdAt: stringOrNull(row.created_at),
    updatedAt: stringOrNull(row.updated_at)
  };
}


export function getHbceDatabaseBoundary() {
  return {
    schemaVersion: HBCE_DATABASE_SCHEMA_VERSION,
    persistenceMode: HBCE_DATABASE_PERSISTENCE_MODE,
    autoSchemaApply: shouldAutoApplySchema(),
    boundary: HBCE_DATABASE_SCHEMA_BOUNDARY,
    legalCertificationBoundary: HBCE_DATABASE_LEGAL_CERTIFICATION_BOUNDARY,
    legalCertification: false
  };
}
