import { queryHbceDatabase } from "@/lib/ipr-database";

export const HBCE_TENANT_SCOPE_REVISION =
  "HBCE-TENANT-SCOPE-v0.1-CONTROLLED_B2G_PILOT_ISOLATION" as const;

export const HBCE_TENANT_SCOPE_LEGAL_CERTIFICATION = false as const;

export const HBCE_TENANT_SCOPE_BOUNDARY = {
  legalCertification: HBCE_TENANT_SCOPE_LEGAL_CERTIFICATION,
  opcBoundary: "technical proof receipt only",
  evtBoundary: "technical event trace only",
  iprBoundary: "operational identity/proof layer only",
  authorityBoundary:
    "HBCE/JOKER-C2 is runtime governance and audit-ready infrastructure, not a public authority and not a legal certifier."
} as const;

export const HBCE_TENANT_SCOPE_TABLES = {
  tenants: "hbce_tenants",
  workspaces: "hbce_workspaces",
  accounts: "hbce_accounts",
  subscriptions: "hbce_subscriptions",
  operators: "hbce_operators"
} as const;

export type HbceTenantStatus = "DRAFT" | "ACTIVE" | "SUSPENDED" | "CLOSED" | "ARCHIVED";
export type HbceWorkspaceStatus = "DRAFT" | "ACTIVE" | "SUSPENDED" | "CLOSED" | "ARCHIVED";
export type HbceAccountStatus = "ACTIVE" | "SUSPENDED" | "CLOSED" | "ARCHIVED";
export type HbceSubscriptionStatus = "ACTIVE" | "SUSPENDED" | "EXPIRED" | "CANCELLED";
export type HbcePilotEnvironment = "SELF_PILOT" | "DEMO" | "B2G_PILOT" | "PRODUCTION" | "UNKNOWN";

export type HbceTenantScopeFailReason =
  | "TENANT_REQUIRED"
  | "WORKSPACE_REQUIRED"
  | "TENANT_STORE_UNAVAILABLE"
  | "WORKSPACE_STORE_UNAVAILABLE"
  | "ACCOUNT_STORE_UNAVAILABLE"
  | "SUBSCRIPTION_STORE_UNAVAILABLE"
  | "TENANT_NOT_FOUND"
  | "WORKSPACE_NOT_FOUND"
  | "WORKSPACE_TENANT_MISMATCH"
  | "TENANT_NOT_ACTIVE"
  | "WORKSPACE_NOT_ACTIVE"
  | "ACCOUNT_NOT_ACTIVE"
  | "SUBSCRIPTION_NOT_ACTIVE"
  | "SUBSCRIPTION_EXPIRED"
  | "SELF_PILOT_SCOPE_DENIED"
  | "PILOT_SCOPE_MISMATCH";

export type HbceTenantDatabaseRow = {
  tenant_id?: string | null;
  client_name?: string | null;
  client_type?: string | null;
  country?: string | null;
  region?: string | null;
  environment?: string | null;
  status?: string | null;
  data_boundary?: string | null;
  created_at?: string | Date | null;
  updated_at?: string | Date | null;
  legal_certification?: boolean | null;
};

export type HbceWorkspaceDatabaseRow = {
  workspace_id?: string | null;
  tenant_id?: string | null;
  workspace_name?: string | null;
  risk_domain?: string | null;
  integration_mode?: string | null;
  environment?: string | null;
  status?: string | null;
  source_intelligence_enabled?: boolean | null;
  document_handling_enabled?: boolean | null;
  memory_enabled?: boolean | null;
  export_enabled?: boolean | null;
  webhook_enabled?: boolean | null;
  rate_limit_profile_id?: string | null;
  quota_profile_id?: string | null;
  created_at?: string | Date | null;
  updated_at?: string | Date | null;
  legal_certification?: boolean | null;
};

export type HbceAccountDatabaseRow = {
  account_id?: string | null;
  tenant_id?: string | null;
  client_name?: string | null;
  status?: string | null;
  billing_mode?: string | null;
  support_level?: string | null;
  created_at?: string | Date | null;
  updated_at?: string | Date | null;
  legal_certification?: boolean | null;
};

export type HbceSubscriptionDatabaseRow = {
  subscription_id?: string | null;
  tenant_id?: string | null;
  account_id?: string | null;
  tier?: string | null;
  status?: string | null;
  starts_at?: string | Date | null;
  expires_at?: string | Date | null;
  included_requests_per_day?: number | null;
  included_operations_per_day?: number | null;
  included_source_intelligence_runs_per_day?: number | null;
  included_file_uploads_per_day?: number | null;
  max_cost_units_per_month?: number | null;
  created_at?: string | Date | null;
  updated_at?: string | Date | null;
  legal_certification?: boolean | null;
};

export type HbceTenantSnapshot = {
  tenantId: string;
  clientName: string | null;
  clientType: string | null;
  country: string | null;
  region: string | null;
  environment: HbcePilotEnvironment;
  status: HbceTenantStatus;
  dataBoundary: string | null;
  createdAt: string | null;
  legalCertification: false;
};

export type HbceWorkspaceSnapshot = {
  workspaceId: string;
  tenantId: string;
  workspaceName: string | null;
  riskDomain: string | null;
  integrationMode: string | null;
  environment: HbcePilotEnvironment;
  status: HbceWorkspaceStatus;
  sourceIntelligenceEnabled: boolean;
  documentHandlingEnabled: boolean;
  memoryEnabled: boolean;
  exportEnabled: boolean;
  webhookEnabled: boolean;
  rateLimitProfileId: string | null;
  quotaProfileId: string | null;
  createdAt: string | null;
  legalCertification: false;
};

export type HbceAccountSnapshot = {
  accountId: string;
  tenantId: string;
  clientName: string | null;
  status: HbceAccountStatus;
  billingMode: string | null;
  supportLevel: string | null;
  createdAt: string | null;
  legalCertification: false;
};

export type HbceSubscriptionSnapshot = {
  subscriptionId: string;
  tenantId: string;
  accountId: string | null;
  tier: string | null;
  status: HbceSubscriptionStatus;
  startsAt: string | null;
  expiresAt: string | null;
  includedRequestsPerDay: number | null;
  includedOperationsPerDay: number | null;
  includedSourceIntelligenceRunsPerDay: number | null;
  includedFileUploadsPerDay: number | null;
  maxCostUnitsPerMonth: number | null;
  legalCertification: false;
};

export type HbceTenantScopeValidationInput = {
  tenantId?: string | null;
  workspaceId?: string | null;
  accountId?: string | null;
  subscriptionId?: string | null;
  expectedEnvironment?: HbcePilotEnvironment | null;
  allowSelfPilotScope?: boolean;
  requireAccount?: boolean;
  requireSubscription?: boolean;
  now?: Date;
};

export type HbceTenantScopeValidationGranted = {
  ok: true;
  status: "TENANT_SCOPE_GRANTED";
  revision: typeof HBCE_TENANT_SCOPE_REVISION;
  tenant: HbceTenantSnapshot;
  workspace: HbceWorkspaceSnapshot;
  account: HbceAccountSnapshot | null;
  subscription: HbceSubscriptionSnapshot | null;
  policy: {
    decision: "ALLOW";
    tenantScope: "PASS";
    workspaceScope: "PASS";
    accountScope: "PASS" | "NOT_REQUIRED";
    subscriptionScope: "PASS" | "NOT_REQUIRED";
    selfPilotBoundary: "PASS" | "NOT_SELF_PILOT";
  };
  boundary: typeof HBCE_TENANT_SCOPE_BOUNDARY;
  legalCertification: false;
};

export type HbceTenantScopeValidationDenied = {
  ok: false;
  status: "TENANT_SCOPE_DENIED";
  revision: typeof HBCE_TENANT_SCOPE_REVISION;
  failReason: HbceTenantScopeFailReason;
  httpStatus: 400 | 403 | 404 | 503;
  message: string;
  tenantId: string | null;
  workspaceId: string | null;
  accountId: string | null;
  subscriptionId: string | null;
  tenant?: Partial<HbceTenantSnapshot> | null;
  workspace?: Partial<HbceWorkspaceSnapshot> | null;
  account?: Partial<HbceAccountSnapshot> | null;
  subscription?: Partial<HbceSubscriptionSnapshot> | null;
  policy: {
    decision: "FAIL_CLOSED";
    tenantScope: "PASS" | "FAIL" | "NOT_CHECKED";
    workspaceScope: "PASS" | "FAIL" | "NOT_CHECKED";
    accountScope: "PASS" | "FAIL" | "NOT_REQUIRED" | "NOT_CHECKED";
    subscriptionScope: "PASS" | "FAIL" | "NOT_REQUIRED" | "NOT_CHECKED";
    selfPilotBoundary: "PASS" | "FAIL" | "NOT_SELF_PILOT" | "NOT_CHECKED";
  };
  boundary: typeof HBCE_TENANT_SCOPE_BOUNDARY;
  legalCertification: false;
};

export type HbceTenantScopeValidationResult =
  | HbceTenantScopeValidationGranted
  | HbceTenantScopeValidationDenied;

export const HBCE_TENANT_SCOPE_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS hbce_tenants (
  tenant_id TEXT PRIMARY KEY,
  client_name TEXT,
  client_type TEXT,
  country TEXT,
  region TEXT,
  environment TEXT NOT NULL DEFAULT 'B2G_PILOT',
  status TEXT NOT NULL DEFAULT 'DRAFT',
  data_boundary TEXT NOT NULL DEFAULT 'PUBLIC_OR_SYNTHETIC_ONLY',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  legal_certification BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT hbce_tenants_legal_false CHECK (legal_certification = false)
);

CREATE TABLE IF NOT EXISTS hbce_workspaces (
  workspace_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES hbce_tenants(tenant_id) ON DELETE RESTRICT,
  workspace_name TEXT,
  risk_domain TEXT,
  integration_mode TEXT,
  environment TEXT NOT NULL DEFAULT 'B2G_PILOT',
  status TEXT NOT NULL DEFAULT 'DRAFT',
  source_intelligence_enabled BOOLEAN NOT NULL DEFAULT false,
  document_handling_enabled BOOLEAN NOT NULL DEFAULT false,
  memory_enabled BOOLEAN NOT NULL DEFAULT false,
  export_enabled BOOLEAN NOT NULL DEFAULT false,
  webhook_enabled BOOLEAN NOT NULL DEFAULT false,
  rate_limit_profile_id TEXT,
  quota_profile_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  legal_certification BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT hbce_workspaces_legal_false CHECK (legal_certification = false)
);

CREATE TABLE IF NOT EXISTS hbce_accounts (
  account_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES hbce_tenants(tenant_id) ON DELETE RESTRICT,
  client_name TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  billing_mode TEXT,
  support_level TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  legal_certification BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT hbce_accounts_legal_false CHECK (legal_certification = false)
);

CREATE TABLE IF NOT EXISTS hbce_subscriptions (
  subscription_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES hbce_tenants(tenant_id) ON DELETE RESTRICT,
  account_id TEXT REFERENCES hbce_accounts(account_id) ON DELETE SET NULL,
  tier TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  included_requests_per_day INTEGER,
  included_operations_per_day INTEGER,
  included_source_intelligence_runs_per_day INTEGER,
  included_file_uploads_per_day INTEGER,
  max_cost_units_per_month INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  legal_certification BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT hbce_subscriptions_legal_false CHECK (legal_certification = false)
);

CREATE INDEX IF NOT EXISTS hbce_workspaces_tenant_idx ON hbce_workspaces (tenant_id);
CREATE INDEX IF NOT EXISTS hbce_accounts_tenant_idx ON hbce_accounts (tenant_id);
CREATE INDEX IF NOT EXISTS hbce_subscriptions_tenant_idx ON hbce_subscriptions (tenant_id);
CREATE INDEX IF NOT EXISTS hbce_tenants_status_idx ON hbce_tenants (status);
CREATE INDEX IF NOT EXISTS hbce_workspaces_status_idx ON hbce_workspaces (status);
`;

const SELF_PILOT_TENANT_ID = "HBCE-TENANT-SELF-PILOT";
const SELF_PILOT_WORKSPACE_ID = "HBCE-WORKSPACE-RND";

function normalizeString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeDateIso(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function normalizeBoolean(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function normalizeNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function normalizeEnvironment(value: unknown): HbcePilotEnvironment {
  const normalized = normalizeString(value)?.toUpperCase();
  if (normalized === "SELF_PILOT") return "SELF_PILOT";
  if (normalized === "DEMO") return "DEMO";
  if (normalized === "B2G_PILOT") return "B2G_PILOT";
  if (normalized === "PRODUCTION") return "PRODUCTION";
  return "UNKNOWN";
}

function normalizeTenantStatus(value: unknown): HbceTenantStatus {
  const normalized = normalizeString(value)?.toUpperCase();
  if (normalized === "ACTIVE") return "ACTIVE";
  if (normalized === "SUSPENDED") return "SUSPENDED";
  if (normalized === "CLOSED") return "CLOSED";
  if (normalized === "ARCHIVED") return "ARCHIVED";
  return "DRAFT";
}

function normalizeWorkspaceStatus(value: unknown): HbceWorkspaceStatus {
  const normalized = normalizeString(value)?.toUpperCase();
  if (normalized === "ACTIVE") return "ACTIVE";
  if (normalized === "SUSPENDED") return "SUSPENDED";
  if (normalized === "CLOSED") return "CLOSED";
  if (normalized === "ARCHIVED") return "ARCHIVED";
  return "DRAFT";
}

function normalizeAccountStatus(value: unknown): HbceAccountStatus {
  const normalized = normalizeString(value)?.toUpperCase();
  if (normalized === "ACTIVE") return "ACTIVE";
  if (normalized === "SUSPENDED") return "SUSPENDED";
  if (normalized === "CLOSED") return "CLOSED";
  if (normalized === "ARCHIVED") return "ARCHIVED";
  return "SUSPENDED";
}

function normalizeSubscriptionStatus(
  value: unknown,
  expiresAt: string | null,
  now: Date
): HbceSubscriptionStatus {
  const expiry = expiresAt ? new Date(expiresAt) : null;
  if (expiry && !Number.isNaN(expiry.getTime()) && expiry.getTime() <= now.getTime()) {
    return "EXPIRED";
  }

  const normalized = normalizeString(value)?.toUpperCase();
  if (normalized === "ACTIVE") return "ACTIVE";
  if (normalized === "SUSPENDED") return "SUSPENDED";
  if (normalized === "EXPIRED") return "EXPIRED";
  if (normalized === "CANCELLED") return "CANCELLED";
  return "SUSPENDED";
}

function toTenantSnapshot(row: HbceTenantDatabaseRow): HbceTenantSnapshot {
  return {
    tenantId: normalizeString(row.tenant_id) ?? "NO_TENANT_ID",
    clientName: normalizeString(row.client_name),
    clientType: normalizeString(row.client_type),
    country: normalizeString(row.country),
    region: normalizeString(row.region),
    environment: normalizeEnvironment(row.environment),
    status: normalizeTenantStatus(row.status),
    dataBoundary: normalizeString(row.data_boundary),
    createdAt: normalizeDateIso(row.created_at),
    legalCertification: false
  };
}

function toWorkspaceSnapshot(row: HbceWorkspaceDatabaseRow): HbceWorkspaceSnapshot {
  return {
    workspaceId: normalizeString(row.workspace_id) ?? "NO_WORKSPACE_ID",
    tenantId: normalizeString(row.tenant_id) ?? "NO_TENANT_ID",
    workspaceName: normalizeString(row.workspace_name),
    riskDomain: normalizeString(row.risk_domain),
    integrationMode: normalizeString(row.integration_mode),
    environment: normalizeEnvironment(row.environment),
    status: normalizeWorkspaceStatus(row.status),
    sourceIntelligenceEnabled: normalizeBoolean(row.source_intelligence_enabled),
    documentHandlingEnabled: normalizeBoolean(row.document_handling_enabled),
    memoryEnabled: normalizeBoolean(row.memory_enabled),
    exportEnabled: normalizeBoolean(row.export_enabled),
    webhookEnabled: normalizeBoolean(row.webhook_enabled),
    rateLimitProfileId: normalizeString(row.rate_limit_profile_id),
    quotaProfileId: normalizeString(row.quota_profile_id),
    createdAt: normalizeDateIso(row.created_at),
    legalCertification: false
  };
}

function toAccountSnapshot(row: HbceAccountDatabaseRow): HbceAccountSnapshot {
  return {
    accountId: normalizeString(row.account_id) ?? "NO_ACCOUNT_ID",
    tenantId: normalizeString(row.tenant_id) ?? "NO_TENANT_ID",
    clientName: normalizeString(row.client_name),
    status: normalizeAccountStatus(row.status),
    billingMode: normalizeString(row.billing_mode),
    supportLevel: normalizeString(row.support_level),
    createdAt: normalizeDateIso(row.created_at),
    legalCertification: false
  };
}

function toSubscriptionSnapshot(
  row: HbceSubscriptionDatabaseRow,
  now: Date
): HbceSubscriptionSnapshot {
  const expiresAt = normalizeDateIso(row.expires_at);
  return {
    subscriptionId: normalizeString(row.subscription_id) ?? "NO_SUBSCRIPTION_ID",
    tenantId: normalizeString(row.tenant_id) ?? "NO_TENANT_ID",
    accountId: normalizeString(row.account_id),
    tier: normalizeString(row.tier),
    status: normalizeSubscriptionStatus(row.status, expiresAt, now),
    startsAt: normalizeDateIso(row.starts_at),
    expiresAt,
    includedRequestsPerDay: normalizeNumber(row.included_requests_per_day),
    includedOperationsPerDay: normalizeNumber(row.included_operations_per_day),
    includedSourceIntelligenceRunsPerDay: normalizeNumber(
      row.included_source_intelligence_runs_per_day
    ),
    includedFileUploadsPerDay: normalizeNumber(row.included_file_uploads_per_day),
    maxCostUnitsPerMonth: normalizeNumber(row.max_cost_units_per_month),
    legalCertification: false
  };
}

function buildDenied(input: {
  failReason: HbceTenantScopeFailReason;
  httpStatus: 400 | 403 | 404 | 503;
  message: string;
  tenantId?: string | null;
  workspaceId?: string | null;
  accountId?: string | null;
  subscriptionId?: string | null;
  tenant?: Partial<HbceTenantSnapshot> | null;
  workspace?: Partial<HbceWorkspaceSnapshot> | null;
  account?: Partial<HbceAccountSnapshot> | null;
  subscription?: Partial<HbceSubscriptionSnapshot> | null;
  tenantScope?: "PASS" | "FAIL" | "NOT_CHECKED";
  workspaceScope?: "PASS" | "FAIL" | "NOT_CHECKED";
  accountScope?: "PASS" | "FAIL" | "NOT_REQUIRED" | "NOT_CHECKED";
  subscriptionScope?: "PASS" | "FAIL" | "NOT_REQUIRED" | "NOT_CHECKED";
  selfPilotBoundary?: "PASS" | "FAIL" | "NOT_SELF_PILOT" | "NOT_CHECKED";
}): HbceTenantScopeValidationDenied {
  return {
    ok: false,
    status: "TENANT_SCOPE_DENIED",
    revision: HBCE_TENANT_SCOPE_REVISION,
    failReason: input.failReason,
    httpStatus: input.httpStatus,
    message: input.message,
    tenantId: normalizeString(input.tenantId),
    workspaceId: normalizeString(input.workspaceId),
    accountId: normalizeString(input.accountId),
    subscriptionId: normalizeString(input.subscriptionId),
    tenant: input.tenant ?? null,
    workspace: input.workspace ?? null,
    account: input.account ?? null,
    subscription: input.subscription ?? null,
    policy: {
      decision: "FAIL_CLOSED",
      tenantScope: input.tenantScope ?? "NOT_CHECKED",
      workspaceScope: input.workspaceScope ?? "NOT_CHECKED",
      accountScope: input.accountScope ?? "NOT_CHECKED",
      subscriptionScope: input.subscriptionScope ?? "NOT_CHECKED",
      selfPilotBoundary: input.selfPilotBoundary ?? "NOT_CHECKED"
    },
    boundary: HBCE_TENANT_SCOPE_BOUNDARY,
    legalCertification: false
  };
}

export async function findHbceTenantById(
  tenantId: string
): Promise<HbceTenantDatabaseRow | null> {
  const result = await queryHbceDatabase<HbceTenantDatabaseRow>(
    `
      SELECT
        tenant_id,
        client_name,
        client_type,
        country,
        region,
        environment,
        status,
        data_boundary,
        created_at,
        updated_at,
        legal_certification
      FROM hbce_tenants
      WHERE tenant_id = $1
      LIMIT 1
    `,
    [tenantId]
  );

  return result.rows[0] ?? null;
}

export async function findHbceWorkspaceById(
  workspaceId: string
): Promise<HbceWorkspaceDatabaseRow | null> {
  const result = await queryHbceDatabase<HbceWorkspaceDatabaseRow>(
    `
      SELECT
        workspace_id,
        tenant_id,
        workspace_name,
        risk_domain,
        integration_mode,
        environment,
        status,
        source_intelligence_enabled,
        document_handling_enabled,
        memory_enabled,
        export_enabled,
        webhook_enabled,
        rate_limit_profile_id,
        quota_profile_id,
        created_at,
        updated_at,
        legal_certification
      FROM hbce_workspaces
      WHERE workspace_id = $1
      LIMIT 1
    `,
    [workspaceId]
  );

  return result.rows[0] ?? null;
}

export async function findHbceAccountForTenant(input: {
  tenantId: string;
  accountId?: string | null;
}): Promise<HbceAccountDatabaseRow | null> {
  const accountId = normalizeString(input.accountId);
  const query = accountId
    ? `
        SELECT
          account_id,
          tenant_id,
          client_name,
          status,
          billing_mode,
          support_level,
          created_at,
          updated_at,
          legal_certification
        FROM hbce_accounts
        WHERE tenant_id = $1 AND account_id = $2
        LIMIT 1
      `
    : `
        SELECT
          account_id,
          tenant_id,
          client_name,
          status,
          billing_mode,
          support_level,
          created_at,
          updated_at,
          legal_certification
        FROM hbce_accounts
        WHERE tenant_id = $1
        ORDER BY created_at ASC
        LIMIT 1
      `;

  const params = accountId ? [input.tenantId, accountId] : [input.tenantId];
  const result = await queryHbceDatabase<HbceAccountDatabaseRow>(query, params);
  return result.rows[0] ?? null;
}

export async function findHbceSubscriptionForTenant(input: {
  tenantId: string;
  subscriptionId?: string | null;
  accountId?: string | null;
}): Promise<HbceSubscriptionDatabaseRow | null> {
  const subscriptionId = normalizeString(input.subscriptionId);
  const accountId = normalizeString(input.accountId);

  if (subscriptionId) {
    const result = await queryHbceDatabase<HbceSubscriptionDatabaseRow>(
      `
        SELECT
          subscription_id,
          tenant_id,
          account_id,
          tier,
          status,
          starts_at,
          expires_at,
          included_requests_per_day,
          included_operations_per_day,
          included_source_intelligence_runs_per_day,
          included_file_uploads_per_day,
          max_cost_units_per_month,
          created_at,
          updated_at,
          legal_certification
        FROM hbce_subscriptions
        WHERE tenant_id = $1 AND subscription_id = $2
        LIMIT 1
      `,
      [input.tenantId, subscriptionId]
    );
    return result.rows[0] ?? null;
  }

  const result = await queryHbceDatabase<HbceSubscriptionDatabaseRow>(
    `
      SELECT
        subscription_id,
        tenant_id,
        account_id,
        tier,
        status,
        starts_at,
        expires_at,
        included_requests_per_day,
        included_operations_per_day,
        included_source_intelligence_runs_per_day,
        included_file_uploads_per_day,
        max_cost_units_per_month,
        created_at,
        updated_at,
        legal_certification
      FROM hbce_subscriptions
      WHERE tenant_id = $1
        AND ($2::text IS NULL OR account_id = $2)
      ORDER BY created_at ASC
      LIMIT 1
    `,
    [input.tenantId, accountId]
  );

  return result.rows[0] ?? null;
}

export async function validateHbceTenantWorkspaceScope(
  input: HbceTenantScopeValidationInput
): Promise<HbceTenantScopeValidationResult> {
  const tenantId = normalizeString(input.tenantId);
  const workspaceId = normalizeString(input.workspaceId);
  const accountId = normalizeString(input.accountId);
  const subscriptionId = normalizeString(input.subscriptionId);
  const now = input.now ?? new Date();
  const allowSelfPilotScope = Boolean(input.allowSelfPilotScope);
  const requireAccount = Boolean(input.requireAccount);
  const requireSubscription = Boolean(input.requireSubscription);
  const expectedEnvironment = input.expectedEnvironment ?? null;

  if (!tenantId) {
    return buildDenied({
      failReason: "TENANT_REQUIRED",
      httpStatus: 400,
      message: "Tenant ID is required for scoped API execution.",
      tenantId,
      workspaceId
    });
  }

  if (!workspaceId) {
    return buildDenied({
      failReason: "WORKSPACE_REQUIRED",
      httpStatus: 400,
      message: "Workspace ID is required for scoped API execution.",
      tenantId,
      workspaceId,
      tenantScope: "PASS"
    });
  }

  const isSelfPilotScope = tenantId === SELF_PILOT_TENANT_ID || workspaceId === SELF_PILOT_WORKSPACE_ID;
  if (isSelfPilotScope && !allowSelfPilotScope) {
    return buildDenied({
      failReason: "SELF_PILOT_SCOPE_DENIED",
      httpStatus: 403,
      message:
        "Self-pilot tenant/workspace scope cannot be used for external controlled API pilot execution.",
      tenantId,
      workspaceId,
      selfPilotBoundary: "FAIL"
    });
  }

  let tenantRow: HbceTenantDatabaseRow | null = null;
  try {
    tenantRow = await findHbceTenantById(tenantId);
  } catch {
    return buildDenied({
      failReason: "TENANT_STORE_UNAVAILABLE",
      httpStatus: 503,
      message: "Tenant store is unavailable. Request rejected fail-closed.",
      tenantId,
      workspaceId
    });
  }

  if (!tenantRow) {
    return buildDenied({
      failReason: "TENANT_NOT_FOUND",
      httpStatus: 404,
      message: "Tenant not found.",
      tenantId,
      workspaceId,
      tenantScope: "FAIL"
    });
  }

  const tenant = toTenantSnapshot(tenantRow);
  if (tenant.status !== "ACTIVE") {
    return buildDenied({
      failReason: "TENANT_NOT_ACTIVE",
      httpStatus: 403,
      message: "Tenant is not active.",
      tenantId,
      workspaceId,
      tenant,
      tenantScope: "FAIL"
    });
  }

  if (expectedEnvironment && tenant.environment !== expectedEnvironment) {
    return buildDenied({
      failReason: "PILOT_SCOPE_MISMATCH",
      httpStatus: 403,
      message: "Tenant environment does not match expected pilot environment.",
      tenantId,
      workspaceId,
      tenant,
      tenantScope: "FAIL"
    });
  }

  let workspaceRow: HbceWorkspaceDatabaseRow | null = null;
  try {
    workspaceRow = await findHbceWorkspaceById(workspaceId);
  } catch {
    return buildDenied({
      failReason: "WORKSPACE_STORE_UNAVAILABLE",
      httpStatus: 503,
      message: "Workspace store is unavailable. Request rejected fail-closed.",
      tenantId,
      workspaceId,
      tenant,
      tenantScope: "PASS"
    });
  }

  if (!workspaceRow) {
    return buildDenied({
      failReason: "WORKSPACE_NOT_FOUND",
      httpStatus: 404,
      message: "Workspace not found.",
      tenantId,
      workspaceId,
      tenant,
      tenantScope: "PASS",
      workspaceScope: "FAIL"
    });
  }

  const workspace = toWorkspaceSnapshot(workspaceRow);
  if (workspace.tenantId !== tenant.tenantId) {
    return buildDenied({
      failReason: "WORKSPACE_TENANT_MISMATCH",
      httpStatus: 403,
      message: "Workspace does not belong to the requested tenant.",
      tenantId,
      workspaceId,
      tenant,
      workspace,
      tenantScope: "PASS",
      workspaceScope: "FAIL"
    });
  }

  if (workspace.status !== "ACTIVE") {
    return buildDenied({
      failReason: "WORKSPACE_NOT_ACTIVE",
      httpStatus: 403,
      message: "Workspace is not active.",
      tenantId,
      workspaceId,
      tenant,
      workspace,
      tenantScope: "PASS",
      workspaceScope: "FAIL"
    });
  }

  if (expectedEnvironment && workspace.environment !== expectedEnvironment) {
    return buildDenied({
      failReason: "PILOT_SCOPE_MISMATCH",
      httpStatus: 403,
      message: "Workspace environment does not match expected pilot environment.",
      tenantId,
      workspaceId,
      tenant,
      workspace,
      tenantScope: "PASS",
      workspaceScope: "FAIL"
    });
  }

  let account: HbceAccountSnapshot | null = null;
  if (requireAccount || accountId) {
    let accountRow: HbceAccountDatabaseRow | null = null;
    try {
      accountRow = await findHbceAccountForTenant({ tenantId, accountId });
    } catch {
      return buildDenied({
        failReason: "ACCOUNT_STORE_UNAVAILABLE",
        httpStatus: 503,
        message: "Account store is unavailable. Request rejected fail-closed.",
        tenantId,
        workspaceId,
        accountId,
        subscriptionId,
        tenant,
        workspace,
        tenantScope: "PASS",
        workspaceScope: "PASS",
        accountScope: "FAIL"
      });
    }

    if (!accountRow) {
      return buildDenied({
        failReason: "ACCOUNT_NOT_ACTIVE",
        httpStatus: 403,
        message: "No active account found for tenant scope.",
        tenantId,
        workspaceId,
        accountId,
        subscriptionId,
        tenant,
        workspace,
        tenantScope: "PASS",
        workspaceScope: "PASS",
        accountScope: "FAIL"
      });
    }

    account = toAccountSnapshot(accountRow);
    if (account.status !== "ACTIVE") {
      return buildDenied({
        failReason: "ACCOUNT_NOT_ACTIVE",
        httpStatus: 403,
        message: "Account is not active.",
        tenantId,
        workspaceId,
        accountId,
        subscriptionId,
        tenant,
        workspace,
        account,
        tenantScope: "PASS",
        workspaceScope: "PASS",
        accountScope: "FAIL"
      });
    }
  }

  let subscription: HbceSubscriptionSnapshot | null = null;
  if (requireSubscription || subscriptionId) {
    let subscriptionRow: HbceSubscriptionDatabaseRow | null = null;
    try {
      subscriptionRow = await findHbceSubscriptionForTenant({
        tenantId,
        subscriptionId,
        accountId: account?.accountId ?? accountId
      });
    } catch {
      return buildDenied({
        failReason: "SUBSCRIPTION_STORE_UNAVAILABLE",
        httpStatus: 503,
        message: "Subscription store is unavailable. Request rejected fail-closed.",
        tenantId,
        workspaceId,
        accountId,
        subscriptionId,
        tenant,
        workspace,
        account,
        tenantScope: "PASS",
        workspaceScope: "PASS",
        accountScope: account ? "PASS" : requireAccount ? "FAIL" : "NOT_REQUIRED",
        subscriptionScope: "FAIL"
      });
    }

    if (!subscriptionRow) {
      return buildDenied({
        failReason: "SUBSCRIPTION_NOT_ACTIVE",
        httpStatus: 403,
        message: "No active subscription found for tenant scope.",
        tenantId,
        workspaceId,
        accountId,
        subscriptionId,
        tenant,
        workspace,
        account,
        tenantScope: "PASS",
        workspaceScope: "PASS",
        accountScope: account ? "PASS" : requireAccount ? "FAIL" : "NOT_REQUIRED",
        subscriptionScope: "FAIL"
      });
    }

    subscription = toSubscriptionSnapshot(subscriptionRow, now);
    if (subscription.status === "EXPIRED") {
      return buildDenied({
        failReason: "SUBSCRIPTION_EXPIRED",
        httpStatus: 403,
        message: "Subscription has expired.",
        tenantId,
        workspaceId,
        accountId,
        subscriptionId,
        tenant,
        workspace,
        account,
        subscription,
        tenantScope: "PASS",
        workspaceScope: "PASS",
        accountScope: account ? "PASS" : requireAccount ? "FAIL" : "NOT_REQUIRED",
        subscriptionScope: "FAIL"
      });
    }

    if (subscription.status !== "ACTIVE") {
      return buildDenied({
        failReason: "SUBSCRIPTION_NOT_ACTIVE",
        httpStatus: 403,
        message: "Subscription is not active.",
        tenantId,
        workspaceId,
        accountId,
        subscriptionId,
        tenant,
        workspace,
        account,
        subscription,
        tenantScope: "PASS",
        workspaceScope: "PASS",
        accountScope: account ? "PASS" : requireAccount ? "FAIL" : "NOT_REQUIRED",
        subscriptionScope: "FAIL"
      });
    }
  }

  return {
    ok: true,
    status: "TENANT_SCOPE_GRANTED",
    revision: HBCE_TENANT_SCOPE_REVISION,
    tenant,
    workspace,
    account,
    subscription,
    policy: {
      decision: "ALLOW",
      tenantScope: "PASS",
      workspaceScope: "PASS",
      accountScope: account ? "PASS" : "NOT_REQUIRED",
      subscriptionScope: subscription ? "PASS" : "NOT_REQUIRED",
      selfPilotBoundary: isSelfPilotScope ? "PASS" : "NOT_SELF_PILOT"
    },
    boundary: HBCE_TENANT_SCOPE_BOUNDARY,
    legalCertification: false
  };
}

export function buildHbceTenantScopeErrorBody(
  result: HbceTenantScopeValidationDenied
): Record<string, unknown> {
  return {
    ok: false,
    status: result.status,
    revision: result.revision,
    failReason: result.failReason,
    message: result.message,
    tenantId: result.tenantId,
    workspaceId: result.workspaceId,
    accountId: result.accountId,
    subscriptionId: result.subscriptionId,
    policy: result.policy,
    boundary: result.boundary,
    legalCertification: false
  };
}

export function describeHbceTenantScopeStatus(): {
  status: "HBCE_TENANT_SCOPE_READY";
  revision: typeof HBCE_TENANT_SCOPE_REVISION;
  tables: typeof HBCE_TENANT_SCOPE_TABLES;
  boundary: typeof HBCE_TENANT_SCOPE_BOUNDARY;
  legalCertification: false;
} {
  return {
    status: "HBCE_TENANT_SCOPE_READY",
    revision: HBCE_TENANT_SCOPE_REVISION,
    tables: HBCE_TENANT_SCOPE_TABLES,
    boundary: HBCE_TENANT_SCOPE_BOUNDARY,
    legalCertification: false
  };
}
