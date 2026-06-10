-- HBCE IPR Runtime API v1
-- Rate Limit & Quota Migration
-- Target path: database/migrations/20260610_create_hbce_rate_limit_quota.sql
-- Revision: HBCE-RATE-LIMIT-QUOTA-MIGRATION-v0.1-CONTROLLED_B2G_PILOT_GUARD
-- Boundary: legalCertification=false
-- OPC is a technical proof receipt only.
-- EVT is a technical event trace only.
-- IPR is an operational identity/proof layer only.
-- HBCE/JOKER-C2 is runtime governance and audit-ready infrastructure,
-- not a public authority and not a legal certifier.

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Shared updated_at trigger helper
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION hbce_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- 2. Quota profiles
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS hbce_quota_profiles (
  quota_profile_id TEXT PRIMARY KEY,
  profile_name TEXT NOT NULL,
  profile_kind TEXT NOT NULL DEFAULT 'B2G_PILOT',
  status TEXT NOT NULL DEFAULT 'ACTIVE',

  requests_per_minute INTEGER NOT NULL DEFAULT 30,
  requests_per_hour INTEGER NOT NULL DEFAULT 500,
  requests_per_day INTEGER NOT NULL DEFAULT 1000,

  chat_requests_per_day INTEGER NOT NULL DEFAULT 250,
  operations_per_day INTEGER NOT NULL DEFAULT 100,
  source_intelligence_runs_per_day INTEGER NOT NULL DEFAULT 50,
  file_uploads_per_day INTEGER NOT NULL DEFAULT 20,
  exports_per_day INTEGER NOT NULL DEFAULT 10,
  webhook_events_per_day INTEGER NOT NULL DEFAULT 250,

  max_file_size_mb INTEGER NOT NULL DEFAULT 10,
  max_cost_units_per_month INTEGER NOT NULL DEFAULT 10000,

  burst_multiplier NUMERIC(8, 2) NOT NULL DEFAULT 1.00,
  reset_timezone TEXT NOT NULL DEFAULT 'UTC',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  legal_certification BOOLEAN NOT NULL DEFAULT false,

  CONSTRAINT hbce_quota_profiles_kind_chk CHECK (
    profile_kind IN ('SELF_PILOT', 'DEMO', 'B2G_PILOT', 'PRODUCTION')
  ),
  CONSTRAINT hbce_quota_profiles_status_chk CHECK (
    status IN ('ACTIVE', 'SUSPENDED', 'ARCHIVED')
  ),
  CONSTRAINT hbce_quota_profiles_legal_false_chk CHECK (legal_certification = false),
  CONSTRAINT hbce_quota_profiles_non_negative_chk CHECK (
    requests_per_minute >= 0 AND
    requests_per_hour >= 0 AND
    requests_per_day >= 0 AND
    chat_requests_per_day >= 0 AND
    operations_per_day >= 0 AND
    source_intelligence_runs_per_day >= 0 AND
    file_uploads_per_day >= 0 AND
    exports_per_day >= 0 AND
    webhook_events_per_day >= 0 AND
    max_file_size_mb >= 0 AND
    max_cost_units_per_month >= 0 AND
    burst_multiplier >= 0
  )
);

DROP TRIGGER IF EXISTS hbce_quota_profiles_touch_updated_at ON hbce_quota_profiles;
CREATE TRIGGER hbce_quota_profiles_touch_updated_at
BEFORE UPDATE ON hbce_quota_profiles
FOR EACH ROW
EXECUTE FUNCTION hbce_touch_updated_at();

CREATE INDEX IF NOT EXISTS hbce_quota_profiles_kind_status_idx
ON hbce_quota_profiles (profile_kind, status);

-- -----------------------------------------------------------------------------
-- 3. Rate limit events
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS hbce_rate_limit_events (
  rate_limit_event_id TEXT PRIMARY KEY,

  tenant_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  credential_id TEXT,
  api_key_id TEXT,
  account_id TEXT,
  subscription_id TEXT,
  quota_profile_id TEXT,

  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  dimension TEXT NOT NULL DEFAULT 'request',
  window_kind TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  window_end TIMESTAMPTZ NOT NULL,

  request_count INTEGER NOT NULL DEFAULT 1,
  limit_value INTEGER NOT NULL,
  remaining_value INTEGER NOT NULL,
  retry_after_seconds INTEGER NOT NULL DEFAULT 0,

  decision TEXT NOT NULL,
  fail_reason TEXT,
  request_ip_hash TEXT,
  user_agent_hash TEXT,

  evt_id TEXT,
  opc_id TEXT,
  audit_id TEXT,
  usage_id TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  legal_certification BOOLEAN NOT NULL DEFAULT false,

  CONSTRAINT hbce_rate_limit_events_window_kind_chk CHECK (
    window_kind IN ('MINUTE', 'HOUR', 'DAY', 'MONTH')
  ),
  CONSTRAINT hbce_rate_limit_events_decision_chk CHECK (
    decision IN ('ALLOW', 'DENY_RATE_LIMIT', 'DENY_QUOTA', 'FAIL_CLOSED')
  ),
  CONSTRAINT hbce_rate_limit_events_legal_false_chk CHECK (legal_certification = false),
  CONSTRAINT hbce_rate_limit_events_counts_chk CHECK (
    request_count >= 0 AND
    limit_value >= 0 AND
    remaining_value >= 0 AND
    retry_after_seconds >= 0
  )
);

CREATE INDEX IF NOT EXISTS hbce_rate_limit_events_tenant_workspace_created_idx
ON hbce_rate_limit_events (tenant_id, workspace_id, created_at DESC);

CREATE INDEX IF NOT EXISTS hbce_rate_limit_events_credential_created_idx
ON hbce_rate_limit_events (credential_id, created_at DESC);

CREATE INDEX IF NOT EXISTS hbce_rate_limit_events_window_idx
ON hbce_rate_limit_events (tenant_id, workspace_id, credential_id, dimension, window_kind, window_start, window_end);

CREATE INDEX IF NOT EXISTS hbce_rate_limit_events_decision_idx
ON hbce_rate_limit_events (decision, created_at DESC);

-- -----------------------------------------------------------------------------
-- 4. Quota ledger
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS hbce_quota_ledger (
  quota_ledger_id TEXT PRIMARY KEY,

  tenant_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  credential_id TEXT,
  api_key_id TEXT,
  account_id TEXT,
  subscription_id TEXT,
  quota_profile_id TEXT,

  period_kind TEXT NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  dimension TEXT NOT NULL,

  used_units INTEGER NOT NULL DEFAULT 0,
  limit_units INTEGER NOT NULL,
  remaining_units INTEGER NOT NULL,
  last_increment_units INTEGER NOT NULL DEFAULT 0,

  status TEXT NOT NULL DEFAULT 'ACTIVE',
  last_event_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  legal_certification BOOLEAN NOT NULL DEFAULT false,

  CONSTRAINT hbce_quota_ledger_period_kind_chk CHECK (
    period_kind IN ('DAY', 'MONTH')
  ),
  CONSTRAINT hbce_quota_ledger_status_chk CHECK (
    status IN ('ACTIVE', 'WARNING', 'EXCEEDED', 'CLOSED')
  ),
  CONSTRAINT hbce_quota_ledger_legal_false_chk CHECK (legal_certification = false),
  CONSTRAINT hbce_quota_ledger_units_chk CHECK (
    used_units >= 0 AND
    limit_units >= 0 AND
    remaining_units >= 0 AND
    last_increment_units >= 0
  ),
  CONSTRAINT hbce_quota_ledger_unique_scope_period_dimension UNIQUE (
    tenant_id,
    workspace_id,
    COALESCE(credential_id, ''),
    period_kind,
    period_start,
    period_end,
    dimension
  )
);

DROP TRIGGER IF EXISTS hbce_quota_ledger_touch_updated_at ON hbce_quota_ledger;
CREATE TRIGGER hbce_quota_ledger_touch_updated_at
BEFORE UPDATE ON hbce_quota_ledger
FOR EACH ROW
EXECUTE FUNCTION hbce_touch_updated_at();

CREATE INDEX IF NOT EXISTS hbce_quota_ledger_tenant_workspace_period_idx
ON hbce_quota_ledger (tenant_id, workspace_id, period_kind, period_start, period_end);

CREATE INDEX IF NOT EXISTS hbce_quota_ledger_credential_period_idx
ON hbce_quota_ledger (credential_id, period_kind, period_start, period_end);

CREATE INDEX IF NOT EXISTS hbce_quota_ledger_status_idx
ON hbce_quota_ledger (status, updated_at DESC);

-- -----------------------------------------------------------------------------
-- 5. Quota profile seeds
-- -----------------------------------------------------------------------------

INSERT INTO hbce_quota_profiles (
  quota_profile_id,
  profile_name,
  profile_kind,
  status,
  requests_per_minute,
  requests_per_hour,
  requests_per_day,
  chat_requests_per_day,
  operations_per_day,
  source_intelligence_runs_per_day,
  file_uploads_per_day,
  exports_per_day,
  webhook_events_per_day,
  max_file_size_mb,
  max_cost_units_per_month,
  burst_multiplier,
  reset_timezone,
  metadata,
  legal_certification
)
VALUES
  (
    'SELF_PILOT_INTERNAL',
    'HBCE Self-Pilot Internal',
    'SELF_PILOT',
    'ACTIVE',
    120,
    2000,
    10000,
    2000,
    1000,
    500,
    250,
    100,
    1000,
    25,
    100000,
    1.00,
    'UTC',
    jsonb_build_object(
      'purpose', 'Internal HBCE/JOKER-C2 self-pilot quota profile',
      'boundary', 'legalCertification=false'
    ),
    false
  ),
  (
    'B2G_PILOT_STANDARD',
    'B2G Pilot Standard',
    'B2G_PILOT',
    'ACTIVE',
    30,
    500,
    1000,
    250,
    100,
    50,
    20,
    10,
    250,
    10,
    10000,
    1.00,
    'UTC',
    jsonb_build_object(
      'purpose', 'Controlled B2G pilot default quota profile',
      'boundary', 'legalCertification=false'
    ),
    false
  ),
  (
    'B2G_PILOT_RESTRICTED',
    'B2G Pilot Restricted',
    'B2G_PILOT',
    'ACTIVE',
    10,
    100,
    250,
    75,
    25,
    10,
    5,
    3,
    50,
    5,
    2500,
    1.00,
    'UTC',
    jsonb_build_object(
      'purpose', 'Restricted controlled B2G pilot quota profile',
      'boundary', 'legalCertification=false'
    ),
    false
  )
ON CONFLICT (quota_profile_id) DO UPDATE
SET
  profile_name = EXCLUDED.profile_name,
  profile_kind = EXCLUDED.profile_kind,
  status = EXCLUDED.status,
  requests_per_minute = EXCLUDED.requests_per_minute,
  requests_per_hour = EXCLUDED.requests_per_hour,
  requests_per_day = EXCLUDED.requests_per_day,
  chat_requests_per_day = EXCLUDED.chat_requests_per_day,
  operations_per_day = EXCLUDED.operations_per_day,
  source_intelligence_runs_per_day = EXCLUDED.source_intelligence_runs_per_day,
  file_uploads_per_day = EXCLUDED.file_uploads_per_day,
  exports_per_day = EXCLUDED.exports_per_day,
  webhook_events_per_day = EXCLUDED.webhook_events_per_day,
  max_file_size_mb = EXCLUDED.max_file_size_mb,
  max_cost_units_per_month = EXCLUDED.max_cost_units_per_month,
  burst_multiplier = EXCLUDED.burst_multiplier,
  reset_timezone = EXCLUDED.reset_timezone,
  metadata = EXCLUDED.metadata,
  legal_certification = false,
  updated_at = now();

-- -----------------------------------------------------------------------------
-- 6. Public views without secret-bearing/request-origin internals
-- -----------------------------------------------------------------------------

CREATE OR REPLACE VIEW hbce_quota_profiles_public AS
SELECT
  quota_profile_id,
  profile_name,
  profile_kind,
  status,
  requests_per_minute,
  requests_per_hour,
  requests_per_day,
  chat_requests_per_day,
  operations_per_day,
  source_intelligence_runs_per_day,
  file_uploads_per_day,
  exports_per_day,
  webhook_events_per_day,
  max_file_size_mb,
  max_cost_units_per_month,
  burst_multiplier,
  reset_timezone,
  metadata,
  created_at,
  updated_at,
  false AS legal_certification
FROM hbce_quota_profiles;

CREATE OR REPLACE VIEW hbce_quota_ledger_public AS
SELECT
  quota_ledger_id,
  tenant_id,
  workspace_id,
  credential_id,
  api_key_id,
  account_id,
  subscription_id,
  quota_profile_id,
  period_kind,
  period_start,
  period_end,
  dimension,
  used_units,
  limit_units,
  remaining_units,
  last_increment_units,
  status,
  last_event_id,
  metadata,
  created_at,
  updated_at,
  false AS legal_certification
FROM hbce_quota_ledger;

CREATE OR REPLACE VIEW hbce_rate_limit_events_public AS
SELECT
  rate_limit_event_id,
  tenant_id,
  workspace_id,
  credential_id,
  api_key_id,
  account_id,
  subscription_id,
  quota_profile_id,
  endpoint,
  method,
  dimension,
  window_kind,
  window_start,
  window_end,
  request_count,
  limit_value,
  remaining_value,
  retry_after_seconds,
  decision,
  fail_reason,
  evt_id,
  opc_id,
  audit_id,
  usage_id,
  created_at,
  false AS legal_certification
FROM hbce_rate_limit_events;

-- -----------------------------------------------------------------------------
-- 7. Documentation comments
-- -----------------------------------------------------------------------------

COMMENT ON TABLE hbce_quota_profiles IS
  'HBCE API v1 quota profiles. technical runtime configuration only. legalCertification=false.';

COMMENT ON TABLE hbce_rate_limit_events IS
  'HBCE API v1 rate limit event ledger. technical request accounting only. legalCertification=false.';

COMMENT ON TABLE hbce_quota_ledger IS
  'HBCE API v1 quota ledger. technical usage accounting only. legalCertification=false.';

COMMENT ON COLUMN hbce_quota_profiles.legal_certification IS
  'Always false. HBCE/JOKER-C2 does not issue legal certification.';

COMMENT ON COLUMN hbce_rate_limit_events.legal_certification IS
  'Always false. Rate limit events are technical accounting records only.';

COMMENT ON COLUMN hbce_quota_ledger.legal_certification IS
  'Always false. Quota records are technical accounting records only.';

COMMIT;
