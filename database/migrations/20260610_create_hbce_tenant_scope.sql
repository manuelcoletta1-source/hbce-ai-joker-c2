-- HBCE Tenant Scope Migration
-- Revision: HBCE-TENANT-SCOPE-MIGRATION-v0.1-CONTROLLED_B2G_PILOT_ISOLATION
-- Target path: database/migrations/20260610_create_hbce_tenant_scope.sql
--
-- Purpose:
--   Create the tenant/workspace/account/subscription control-plane tables used by
--   lib/tenant-scope.ts and the HBCE IPR Runtime API v1 controlled B2G pilot gate.
--
-- Boundary:
--   legalCertification=false
--   OPC is a technical proof receipt only.
--   EVT is a technical event trace only.
--   IPR is an operational identity/proof layer only.
--   HBCE/JOKER-C2 is runtime governance and audit-ready infrastructure,
--   not a public authority and not a legal certifier.

BEGIN;

CREATE OR REPLACE FUNCTION hbce_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS hbce_tenants (
  tenant_id TEXT PRIMARY KEY,
  client_name TEXT NOT NULL,
  client_type TEXT NOT NULL DEFAULT 'B2G_PILOT',
  country TEXT,
  region TEXT,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  environment TEXT NOT NULL DEFAULT 'B2G_PILOT',
  data_boundary TEXT NOT NULL DEFAULT 'PUBLIC_OR_SYNTHETIC_ONLY',
  notes TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  suspended_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  legal_certification BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT hbce_tenants_status_check CHECK (
    status IN ('DRAFT', 'ACTIVE', 'SUSPENDED', 'CLOSED', 'ARCHIVED')
  ),
  CONSTRAINT hbce_tenants_environment_check CHECK (
    environment IN ('SELF_PILOT', 'DEMO', 'B2G_PILOT', 'PRODUCTION')
  ),
  CONSTRAINT hbce_tenants_legal_certification_false CHECK (
    legal_certification = false
  )
);

CREATE TABLE IF NOT EXISTS hbce_accounts (
  account_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES hbce_tenants (tenant_id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  commercial_owner TEXT,
  support_level TEXT NOT NULL DEFAULT 'PILOT_STANDARD',
  billing_mode TEXT NOT NULL DEFAULT 'MANUAL_PILOT',
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  notes TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  suspended_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  legal_certification BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT hbce_accounts_status_check CHECK (
    status IN ('ACTIVE', 'SUSPENDED', 'CLOSED', 'ARCHIVED')
  ),
  CONSTRAINT hbce_accounts_billing_mode_check CHECK (
    billing_mode IN ('MANUAL_PILOT', 'CONTRACT', 'INTERNAL_SELF_PILOT', 'FUTURE_BILLING')
  ),
  CONSTRAINT hbce_accounts_legal_certification_false CHECK (
    legal_certification = false
  )
);

CREATE TABLE IF NOT EXISTS hbce_subscriptions (
  subscription_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES hbce_tenants (tenant_id) ON DELETE CASCADE,
  account_id TEXT NOT NULL REFERENCES hbce_accounts (account_id) ON DELETE CASCADE,
  tier TEXT NOT NULL DEFAULT 'B2G_PILOT',
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  start_date DATE,
  end_date DATE,
  included_requests_per_day INTEGER NOT NULL DEFAULT 1000,
  included_chat_requests_per_day INTEGER NOT NULL DEFAULT 250,
  included_operations_per_day INTEGER NOT NULL DEFAULT 100,
  included_source_intelligence_runs_per_day INTEGER NOT NULL DEFAULT 50,
  included_file_uploads_per_day INTEGER NOT NULL DEFAULT 20,
  max_file_size_mb INTEGER NOT NULL DEFAULT 10,
  max_cost_units_per_month INTEGER NOT NULL DEFAULT 10000,
  support_level TEXT NOT NULL DEFAULT 'PILOT_STANDARD',
  notes TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  suspended_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  legal_certification BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT hbce_subscriptions_status_check CHECK (
    status IN ('ACTIVE', 'SUSPENDED', 'EXPIRED', 'CANCELLED')
  ),
  CONSTRAINT hbce_subscriptions_tier_check CHECK (
    tier IN ('SELF_PILOT', 'DEMO', 'B2G_PILOT', 'IPR', 'ENTERPRISE_PILOT', 'PRODUCTION')
  ),
  CONSTRAINT hbce_subscriptions_non_negative_limits_check CHECK (
    included_requests_per_day >= 0
    AND included_chat_requests_per_day >= 0
    AND included_operations_per_day >= 0
    AND included_source_intelligence_runs_per_day >= 0
    AND included_file_uploads_per_day >= 0
    AND max_file_size_mb >= 0
    AND max_cost_units_per_month >= 0
  ),
  CONSTRAINT hbce_subscriptions_legal_certification_false CHECK (
    legal_certification = false
  )
);

CREATE TABLE IF NOT EXISTS hbce_workspaces (
  workspace_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES hbce_tenants (tenant_id) ON DELETE CASCADE,
  account_id TEXT REFERENCES hbce_accounts (account_id) ON DELETE SET NULL,
  subscription_id TEXT REFERENCES hbce_subscriptions (subscription_id) ON DELETE SET NULL,
  workspace_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  risk_domain TEXT NOT NULL DEFAULT 'AI_GOVERNANCE',
  integration_mode TEXT NOT NULL DEFAULT 'CONTROLLED_API_PILOT',
  source_intelligence_enabled BOOLEAN NOT NULL DEFAULT false,
  document_handling_enabled BOOLEAN NOT NULL DEFAULT false,
  memory_enabled BOOLEAN NOT NULL DEFAULT true,
  export_enabled BOOLEAN NOT NULL DEFAULT false,
  webhook_enabled BOOLEAN NOT NULL DEFAULT false,
  rate_limit_profile_id TEXT,
  retention_profile_id TEXT,
  notes TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  suspended_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  legal_certification BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT hbce_workspaces_status_check CHECK (
    status IN ('DRAFT', 'ACTIVE', 'SUSPENDED', 'ARCHIVED')
  ),
  CONSTRAINT hbce_workspaces_integration_mode_check CHECK (
    integration_mode IN (
      'INTERNAL_RUNTIME',
      'GUIDED_DEMO',
      'CONTROLLED_API_PILOT',
      'SOURCE_INTELLIGENCE_REVIEW',
      'FULL_CONTROLLED_INTEGRATION_PILOT',
      'PRODUCTION'
    )
  ),
  CONSTRAINT hbce_workspaces_legal_certification_false CHECK (
    legal_certification = false
  )
);

CREATE TABLE IF NOT EXISTS hbce_tenant_operator_assignments (
  operator_assignment_id TEXT PRIMARY KEY,
  operator_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL REFERENCES hbce_tenants (tenant_id) ON DELETE CASCADE,
  workspace_id TEXT REFERENCES hbce_workspaces (workspace_id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  allowed_scopes JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  disabled_at TIMESTAMPTZ,
  legal_certification BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT hbce_operator_assignments_status_check CHECK (
    status IN ('ACTIVE', 'SUSPENDED', 'DISABLED', 'REMOVED')
  ),
  CONSTRAINT hbce_operator_assignments_role_check CHECK (
    role IN (
      'HBCE_SUPER_ADMIN',
      'HBCE_OPERATOR',
      'PILOT_OWNER',
      'TECHNICAL_OPERATOR',
      'AUDIT_REVIEWER',
      'SECURITY_REVIEWER',
      'READ_ONLY_VIEWER'
    )
  ),
  CONSTRAINT hbce_operator_assignments_legal_certification_false CHECK (
    legal_certification = false
  )
);

DROP TRIGGER IF EXISTS hbce_tenants_touch_updated_at ON hbce_tenants;
CREATE TRIGGER hbce_tenants_touch_updated_at
BEFORE UPDATE ON hbce_tenants
FOR EACH ROW
EXECUTE FUNCTION hbce_touch_updated_at();

DROP TRIGGER IF EXISTS hbce_accounts_touch_updated_at ON hbce_accounts;
CREATE TRIGGER hbce_accounts_touch_updated_at
BEFORE UPDATE ON hbce_accounts
FOR EACH ROW
EXECUTE FUNCTION hbce_touch_updated_at();

DROP TRIGGER IF EXISTS hbce_subscriptions_touch_updated_at ON hbce_subscriptions;
CREATE TRIGGER hbce_subscriptions_touch_updated_at
BEFORE UPDATE ON hbce_subscriptions
FOR EACH ROW
EXECUTE FUNCTION hbce_touch_updated_at();

DROP TRIGGER IF EXISTS hbce_workspaces_touch_updated_at ON hbce_workspaces;
CREATE TRIGGER hbce_workspaces_touch_updated_at
BEFORE UPDATE ON hbce_workspaces
FOR EACH ROW
EXECUTE FUNCTION hbce_touch_updated_at();

DROP TRIGGER IF EXISTS hbce_operator_assignments_touch_updated_at ON hbce_tenant_operator_assignments;
CREATE TRIGGER hbce_operator_assignments_touch_updated_at
BEFORE UPDATE ON hbce_tenant_operator_assignments
FOR EACH ROW
EXECUTE FUNCTION hbce_touch_updated_at();

CREATE INDEX IF NOT EXISTS hbce_tenants_status_idx
ON hbce_tenants (status);

CREATE INDEX IF NOT EXISTS hbce_tenants_environment_idx
ON hbce_tenants (environment);

CREATE INDEX IF NOT EXISTS hbce_accounts_tenant_idx
ON hbce_accounts (tenant_id);

CREATE INDEX IF NOT EXISTS hbce_subscriptions_tenant_account_idx
ON hbce_subscriptions (tenant_id, account_id);

CREATE INDEX IF NOT EXISTS hbce_subscriptions_status_idx
ON hbce_subscriptions (status);

CREATE INDEX IF NOT EXISTS hbce_workspaces_tenant_idx
ON hbce_workspaces (tenant_id);

CREATE INDEX IF NOT EXISTS hbce_workspaces_tenant_status_idx
ON hbce_workspaces (tenant_id, status);

CREATE INDEX IF NOT EXISTS hbce_workspaces_account_subscription_idx
ON hbce_workspaces (account_id, subscription_id);

CREATE INDEX IF NOT EXISTS hbce_operator_assignments_operator_idx
ON hbce_tenant_operator_assignments (operator_id);

CREATE INDEX IF NOT EXISTS hbce_operator_assignments_tenant_workspace_idx
ON hbce_tenant_operator_assignments (tenant_id, workspace_id);

CREATE OR REPLACE VIEW hbce_tenant_scope_public AS
SELECT
  t.tenant_id,
  t.client_name,
  t.client_type,
  t.country,
  t.region,
  t.status AS tenant_status,
  t.environment,
  t.data_boundary,
  w.workspace_id,
  w.workspace_name,
  w.status AS workspace_status,
  w.risk_domain,
  w.integration_mode,
  w.source_intelligence_enabled,
  w.document_handling_enabled,
  w.memory_enabled,
  w.export_enabled,
  w.webhook_enabled,
  a.account_id,
  a.status AS account_status,
  s.subscription_id,
  s.tier AS subscription_tier,
  s.status AS subscription_status,
  false AS legal_certification
FROM hbce_tenants t
LEFT JOIN hbce_workspaces w
  ON w.tenant_id = t.tenant_id
LEFT JOIN hbce_accounts a
  ON a.account_id = COALESCE(w.account_id, a.account_id)
  AND a.tenant_id = t.tenant_id
LEFT JOIN hbce_subscriptions s
  ON s.subscription_id = w.subscription_id
  AND s.tenant_id = t.tenant_id;

INSERT INTO hbce_tenants (
  tenant_id,
  client_name,
  client_type,
  country,
  region,
  status,
  environment,
  data_boundary,
  notes,
  created_by,
  legal_certification
)
VALUES (
  'HBCE-TENANT-SELF-PILOT',
  'HERMETICUM B.C.E. Self Pilot',
  'INTERNAL_SELF_PILOT',
  'IT',
  'EUROPE',
  'ACTIVE',
  'SELF_PILOT',
  'INTERNAL_RND',
  'Internal self-pilot tenant for HBCE/JOKER-C2 runtime validation. Not for external client use.',
  'MIGRATION_HBCE_TENANT_SCOPE_v0.1',
  false
)
ON CONFLICT (tenant_id) DO NOTHING;

INSERT INTO hbce_accounts (
  account_id,
  tenant_id,
  client_name,
  commercial_owner,
  support_level,
  billing_mode,
  status,
  notes,
  created_by,
  legal_certification
)
VALUES (
  'HBCE-ACCOUNT-SELF-PILOT',
  'HBCE-TENANT-SELF-PILOT',
  'HERMETICUM B.C.E. Self Pilot',
  'HBCE_SELF_PILOT',
  'INTERNAL_RND',
  'INTERNAL_SELF_PILOT',
  'ACTIVE',
  'Internal self-pilot account. Not for external billing claims.',
  'MIGRATION_HBCE_TENANT_SCOPE_v0.1',
  false
)
ON CONFLICT (account_id) DO NOTHING;

INSERT INTO hbce_subscriptions (
  subscription_id,
  tenant_id,
  account_id,
  tier,
  status,
  start_date,
  included_requests_per_day,
  included_chat_requests_per_day,
  included_operations_per_day,
  included_source_intelligence_runs_per_day,
  included_file_uploads_per_day,
  max_file_size_mb,
  max_cost_units_per_month,
  support_level,
  notes,
  created_by,
  legal_certification
)
VALUES (
  'HBCE-SUBSCRIPTION-SELF-PILOT',
  'HBCE-TENANT-SELF-PILOT',
  'HBCE-ACCOUNT-SELF-PILOT',
  'SELF_PILOT',
  'ACTIVE',
  CURRENT_DATE,
  10000,
  5000,
  1000,
  500,
  200,
  50,
  100000,
  'INTERNAL_RND',
  'Internal self-pilot subscription. Not a commercial production subscription.',
  'MIGRATION_HBCE_TENANT_SCOPE_v0.1',
  false
)
ON CONFLICT (subscription_id) DO NOTHING;

INSERT INTO hbce_workspaces (
  workspace_id,
  tenant_id,
  account_id,
  subscription_id,
  workspace_name,
  status,
  risk_domain,
  integration_mode,
  source_intelligence_enabled,
  document_handling_enabled,
  memory_enabled,
  export_enabled,
  webhook_enabled,
  rate_limit_profile_id,
  retention_profile_id,
  notes,
  created_by,
  legal_certification
)
VALUES (
  'HBCE-WORKSPACE-RND',
  'HBCE-TENANT-SELF-PILOT',
  'HBCE-ACCOUNT-SELF-PILOT',
  'HBCE-SUBSCRIPTION-SELF-PILOT',
  'HBCE R&D Self Pilot Workspace',
  'ACTIVE',
  'HBCE_RND',
  'INTERNAL_RUNTIME',
  true,
  true,
  true,
  true,
  false,
  'SELF_PILOT_UNLIMITED_INTERNAL',
  'INTERNAL_RND',
  'Internal self-pilot workspace for HBCE/JOKER-C2 runtime validation. Not for external client use.',
  'MIGRATION_HBCE_TENANT_SCOPE_v0.1',
  false
)
ON CONFLICT (workspace_id) DO NOTHING;

COMMENT ON TABLE hbce_tenants IS
'HBCE tenant control-plane table. legalCertification=false. Not a public authority registry.';

COMMENT ON TABLE hbce_accounts IS
'HBCE account control-plane table for SaaS/pilot scope. legalCertification=false.';

COMMENT ON TABLE hbce_subscriptions IS
'HBCE subscription scope table for pilot and SaaS limits. legalCertification=false.';

COMMENT ON TABLE hbce_workspaces IS
'HBCE workspace isolation table for governed runtime scope. legalCertification=false.';

COMMENT ON TABLE hbce_tenant_operator_assignments IS
'HBCE operator role assignment table for admin/operator console scope. legalCertification=false.';

COMMENT ON VIEW hbce_tenant_scope_public IS
'Public-safe tenant/workspace scope view without secrets. legalCertification=false.';

COMMIT;
