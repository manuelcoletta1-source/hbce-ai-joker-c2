-- HBCE IPR Runtime API v1
-- Migration: create hbce_api_credentials
-- Target path: database/migrations/20260609_create_hbce_api_credentials.sql
-- Revision: HBCE-API-AUTH-CREDENTIALS-SCHEMA-v0.1-CONTROLLED_B2G_PILOT_GATE
-- Boundary: legalCertification=false
-- OPC: technical proof receipt only
-- EVT: technical event trace only
-- IPR: operational identity/proof layer only

BEGIN;

CREATE TABLE IF NOT EXISTS hbce_api_credentials (
  api_key_id TEXT PRIMARY KEY,
  credential_id TEXT UNIQUE,
  key_id TEXT,
  key_prefix TEXT NOT NULL,
  secret_hash TEXT NOT NULL UNIQUE,
  secret_last4 TEXT,

  credential_type TEXT NOT NULL DEFAULT 'API_KEY',
  environment TEXT NOT NULL DEFAULT 'B2G_PILOT',
  status TEXT NOT NULL DEFAULT 'ACTIVE',

  tenant_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  account_id TEXT,
  subscription_id TEXT,

  credential_name TEXT,
  client_label TEXT,
  created_by TEXT,

  scopes JSONB NOT NULL DEFAULT '[]'::jsonb,
  allowed_endpoints JSONB NOT NULL DEFAULT '[]'::jsonb,
  allowed_source_sets JSONB NOT NULL DEFAULT '[]'::jsonb,
  rate_limit_profile_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  rotated_at TIMESTAMPTZ,
  suspended_at TIMESTAMPTZ,

  last_used_at TIMESTAMPTZ,
  last_used_ip_hash TEXT,
  last_used_user_agent_hash TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  legal_certification BOOLEAN NOT NULL DEFAULT false,

  CONSTRAINT hbce_api_credentials_credential_type_chk
    CHECK (credential_type IN ('API_KEY', 'BEARER_TOKEN')),

  CONSTRAINT hbce_api_credentials_environment_chk
    CHECK (environment IN ('SELF_PILOT', 'DEMO', 'B2G_PILOT', 'PRODUCTION')),

  CONSTRAINT hbce_api_credentials_status_chk
    CHECK (status IN ('ACTIVE', 'SUSPENDED', 'REVOKED', 'EXPIRED', 'ROTATED')),

  CONSTRAINT hbce_api_credentials_scopes_array_chk
    CHECK (jsonb_typeof(scopes) = 'array'),

  CONSTRAINT hbce_api_credentials_allowed_endpoints_array_chk
    CHECK (jsonb_typeof(allowed_endpoints) = 'array'),

  CONSTRAINT hbce_api_credentials_allowed_source_sets_array_chk
    CHECK (jsonb_typeof(allowed_source_sets) = 'array'),

  CONSTRAINT hbce_api_credentials_metadata_object_chk
    CHECK (jsonb_typeof(metadata) = 'object'),

  CONSTRAINT hbce_api_credentials_secret_hash_format_chk
    CHECK (secret_hash ~ '^sha256:[0-9a-f]{64}$'),

  CONSTRAINT hbce_api_credentials_key_prefix_not_empty_chk
    CHECK (length(trim(key_prefix)) > 0),

  CONSTRAINT hbce_api_credentials_tenant_not_empty_chk
    CHECK (length(trim(tenant_id)) > 0),

  CONSTRAINT hbce_api_credentials_workspace_not_empty_chk
    CHECK (length(trim(workspace_id)) > 0),

  CONSTRAINT hbce_api_credentials_legal_certification_false_chk
    CHECK (legal_certification = false)
);

CREATE UNIQUE INDEX IF NOT EXISTS hbce_api_credentials_secret_hash_uidx
ON hbce_api_credentials (secret_hash);

CREATE INDEX IF NOT EXISTS hbce_api_credentials_tenant_workspace_idx
ON hbce_api_credentials (tenant_id, workspace_id);

CREATE INDEX IF NOT EXISTS hbce_api_credentials_tenant_workspace_status_idx
ON hbce_api_credentials (tenant_id, workspace_id, status);

CREATE INDEX IF NOT EXISTS hbce_api_credentials_status_idx
ON hbce_api_credentials (status);

CREATE INDEX IF NOT EXISTS hbce_api_credentials_environment_idx
ON hbce_api_credentials (environment);

CREATE INDEX IF NOT EXISTS hbce_api_credentials_expires_at_idx
ON hbce_api_credentials (expires_at);

CREATE INDEX IF NOT EXISTS hbce_api_credentials_last_used_at_idx
ON hbce_api_credentials (last_used_at);

CREATE INDEX IF NOT EXISTS hbce_api_credentials_rate_limit_profile_idx
ON hbce_api_credentials (rate_limit_profile_id);

CREATE INDEX IF NOT EXISTS hbce_api_credentials_active_scope_idx
ON hbce_api_credentials (tenant_id, workspace_id, credential_type)
WHERE status = 'ACTIVE';

CREATE OR REPLACE FUNCTION hbce_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS hbce_api_credentials_touch_updated_at ON hbce_api_credentials;

CREATE TRIGGER hbce_api_credentials_touch_updated_at
BEFORE UPDATE ON hbce_api_credentials
FOR EACH ROW
EXECUTE FUNCTION hbce_touch_updated_at();

CREATE OR REPLACE VIEW hbce_api_credentials_public AS
SELECT
  api_key_id,
  credential_id,
  key_id,
  key_prefix,
  secret_last4,
  credential_type,
  environment,
  status,
  tenant_id,
  workspace_id,
  account_id,
  subscription_id,
  credential_name,
  client_label,
  scopes,
  allowed_endpoints,
  allowed_source_sets,
  rate_limit_profile_id,
  expires_at,
  revoked_at,
  rotated_at,
  suspended_at,
  last_used_at,
  created_at,
  updated_at,
  legal_certification
FROM hbce_api_credentials;

COMMENT ON TABLE hbce_api_credentials IS
  'HBCE IPR Runtime API v1 API credential registry. Stores hashed API credentials for controlled B2G pilot access. legalCertification=false.';

COMMENT ON COLUMN hbce_api_credentials.secret_hash IS
  'SHA-256 hash of the API credential secret, generated server-side with HBCE_API_SECRET_PEPPER. Raw secret must never be stored.';

COMMENT ON COLUMN hbce_api_credentials.scopes IS
  'JSON array of allowed API scopes, for example v1:chat:create or v1:opc:read.';

COMMENT ON COLUMN hbce_api_credentials.allowed_endpoints IS
  'JSON array of allowed endpoint paths or method-path entries. Empty array means scope-only enforcement.';

COMMENT ON COLUMN hbce_api_credentials.allowed_source_sets IS
  'JSON array of allowed Source Intelligence sourceSet identifiers. Empty array means no explicit sourceSet allowance unless request does not use a sourceSet.';

COMMENT ON COLUMN hbce_api_credentials.legal_certification IS
  'Always false. HBCE API credentials are technical access records, not legal certificates.';

COMMIT;
