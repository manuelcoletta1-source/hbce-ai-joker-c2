import { createHash } from "node:crypto";

import { queryHbceDatabase } from "@/lib/ipr-database";

export const HBCE_RATE_LIMIT_QUOTA_REVISION =
  "HBCE-RATE-LIMIT-QUOTA-v0.1-CONTROLLED_B2G_PILOT_GUARD" as const;

export const HBCE_RATE_LIMIT_QUOTA_LEGAL_CERTIFICATION = false as const;

export const HBCE_RATE_LIMIT_QUOTA_BOUNDARY = {
  legalCertification: HBCE_RATE_LIMIT_QUOTA_LEGAL_CERTIFICATION,
  opcBoundary: "technical proof receipt only",
  evtBoundary: "technical event trace only",
  quotaBoundary: "technical SaaS usage-control boundary only",
  authorityBoundary:
    "HBCE/JOKER-C2 is runtime governance and audit-ready infrastructure, not a public authority and not a legal certifier."
} as const;

export const HBCE_RATE_LIMIT_TABLE = "hbce_rate_limit_events" as const;
export const HBCE_QUOTA_LEDGER_TABLE = "hbce_quota_ledger" as const;
export const HBCE_QUOTA_PROFILES_TABLE = "hbce_quota_profiles" as const;

export type HbceQuotaEnvironment = "SELF_PILOT" | "DEMO" | "B2G_PILOT" | "PRODUCTION";

export type HbceQuotaDecision = "ALLOW" | "WARN" | "LIMIT" | "DENY";

export type HbceQuotaStatus =
  | "QUOTA_HEALTHY"
  | "QUOTA_WARNING"
  | "QUOTA_LIMITED"
  | "QUOTA_EXCEEDED";

export type HbceRateLimitWindow = "MINUTE" | "HOUR" | "DAY" | "MONTH";

export type HbceRateLimitFailReason =
  | "NONE"
  | "RATE_LIMIT_STORE_UNAVAILABLE"
  | "QUOTA_LEDGER_STORE_UNAVAILABLE"
  | "RATE_LIMIT_EXCEEDED"
  | "QUOTA_EXCEEDED"
  | "QUOTA_PROFILE_DISABLED"
  | "TENANT_SCOPE_REQUIRED"
  | "WORKSPACE_SCOPE_REQUIRED"
  | "CREDENTIAL_SCOPE_REQUIRED";

export type HbceQuotaUsageKind =
  | "REQUEST"
  | "CHAT_REQUEST"
  | "OPERATION_REQUEST"
  | "SOURCE_INTELLIGENCE_RUN"
  | "FILE_UPLOAD"
  | "EXPORT_CREATE"
  | "WEBHOOK_DELIVERY"
  | "MODEL_COST_UNIT";

export type HbceRateLimitQuotaProfile = {
  profileId: string;
  name: string;
  environment: HbceQuotaEnvironment;
  enabled: boolean;
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  chatRequestsPerDay: number;
  operationsPerDay: number;
  sourceIntelligenceRunsPerDay: number;
  fileUploadsPerDay: number;
  exportsPerDay: number;
  webhookDeliveriesPerDay: number;
  maxCostUnitsPerMonth: number;
  warningRatio: number;
  legalCertification: false;
};

export type HbceRateLimitQuotaInput = {
  tenantId?: string | null;
  workspaceId?: string | null;
  credentialId?: string | null;
  profileId?: string | null;
  endpoint: string;
  method: string;
  usageKind?: HbceQuotaUsageKind;
  costUnits?: number;
  requestId?: string | null;
  auditId?: string | null;
  usageId?: string | null;
  evtId?: string | null;
  opcId?: string | null;
  now?: Date;
  dryRun?: boolean;
};

export type HbceRateLimitQuotaSnapshot = {
  profile: HbceRateLimitQuotaProfile;
  tenantId: string;
  workspaceId: string;
  credentialId: string;
  endpoint: string;
  method: string;
  usageKind: HbceQuotaUsageKind;
  costUnits: number;
  minuteCount: number;
  hourCount: number;
  dayRequestCount: number;
  dayChatCount: number;
  dayOperationCount: number;
  daySourceIntelligenceCount: number;
  dayFileUploadCount: number;
  dayExportCount: number;
  dayWebhookDeliveryCount: number;
  monthCostUnits: number;
  remaining: {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
    chatRequestsPerDay: number;
    operationsPerDay: number;
    sourceIntelligenceRunsPerDay: number;
    fileUploadsPerDay: number;
    exportsPerDay: number;
    webhookDeliveriesPerDay: number;
    maxCostUnitsPerMonth: number;
  };
  resetAt: {
    minute: string;
    hour: string;
    day: string;
    month: string;
  };
  legalCertification: false;
};

export type HbceRateLimitQuotaGranted = {
  ok: true;
  status: "RATE_LIMIT_QUOTA_GRANTED";
  revision: typeof HBCE_RATE_LIMIT_QUOTA_REVISION;
  decision: Extract<HbceQuotaDecision, "ALLOW" | "WARN">;
  quotaStatus: Extract<HbceQuotaStatus, "QUOTA_HEALTHY" | "QUOTA_WARNING">;
  failReason: "NONE";
  snapshot: HbceRateLimitQuotaSnapshot;
  headers: Record<string, string>;
  boundary: typeof HBCE_RATE_LIMIT_QUOTA_BOUNDARY;
  legalCertification: false;
};

export type HbceRateLimitQuotaDenied = {
  ok: false;
  status: "RATE_LIMIT_QUOTA_DENIED";
  revision: typeof HBCE_RATE_LIMIT_QUOTA_REVISION;
  decision: Extract<HbceQuotaDecision, "LIMIT" | "DENY">;
  quotaStatus: Extract<HbceQuotaStatus, "QUOTA_LIMITED" | "QUOTA_EXCEEDED">;
  failReason: HbceRateLimitFailReason;
  httpStatus: 400 | 403 | 429 | 503;
  message: string;
  snapshot?: HbceRateLimitQuotaSnapshot;
  headers: Record<string, string>;
  boundary: typeof HBCE_RATE_LIMIT_QUOTA_BOUNDARY;
  legalCertification: false;
};

export type HbceRateLimitQuotaResult = HbceRateLimitQuotaGranted | HbceRateLimitQuotaDenied;

type CountRow = {
  request_count?: number | string | null;
  chat_count?: number | string | null;
  operation_count?: number | string | null;
  source_intelligence_count?: number | string | null;
  file_upload_count?: number | string | null;
  export_count?: number | string | null;
  webhook_delivery_count?: number | string | null;
  cost_units?: number | string | null;
};

type ProfileRow = {
  profile_id?: string | null;
  name?: string | null;
  environment?: string | null;
  enabled?: boolean | null;
  requests_per_minute?: number | string | null;
  requests_per_hour?: number | string | null;
  requests_per_day?: number | string | null;
  chat_requests_per_day?: number | string | null;
  operations_per_day?: number | string | null;
  source_intelligence_runs_per_day?: number | string | null;
  file_uploads_per_day?: number | string | null;
  exports_per_day?: number | string | null;
  webhook_deliveries_per_day?: number | string | null;
  max_cost_units_per_month?: number | string | null;
  warning_ratio?: number | string | null;
  legal_certification?: boolean | null;
};

const DEFAULT_PROFILE_ID = "B2G_PILOT_STANDARD";
const UNKNOWN_SCOPE = "UNKNOWN";
const MAX_ID_LENGTH = 160;
const MAX_ENDPOINT_LENGTH = 240;

export const HBCE_RATE_LIMIT_QUOTA_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS hbce_quota_profiles (
  profile_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  environment TEXT NOT NULL DEFAULT 'B2G_PILOT',
  enabled BOOLEAN NOT NULL DEFAULT true,
  requests_per_minute INTEGER NOT NULL DEFAULT 30,
  requests_per_hour INTEGER NOT NULL DEFAULT 300,
  requests_per_day INTEGER NOT NULL DEFAULT 1000,
  chat_requests_per_day INTEGER NOT NULL DEFAULT 250,
  operations_per_day INTEGER NOT NULL DEFAULT 100,
  source_intelligence_runs_per_day INTEGER NOT NULL DEFAULT 50,
  file_uploads_per_day INTEGER NOT NULL DEFAULT 20,
  exports_per_day INTEGER NOT NULL DEFAULT 20,
  webhook_deliveries_per_day INTEGER NOT NULL DEFAULT 500,
  max_cost_units_per_month INTEGER NOT NULL DEFAULT 10000,
  warning_ratio NUMERIC NOT NULL DEFAULT 0.8,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  legal_certification BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT hbce_quota_profiles_legal_false CHECK (legal_certification = false)
);

CREATE TABLE IF NOT EXISTS hbce_rate_limit_events (
  rate_limit_event_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  credential_id TEXT NOT NULL,
  profile_id TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  usage_kind TEXT NOT NULL,
  cost_units INTEGER NOT NULL DEFAULT 0,
  request_hash TEXT,
  audit_id TEXT,
  usage_id TEXT,
  evt_id TEXT,
  opc_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  legal_certification BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT hbce_rate_limit_events_legal_false CHECK (legal_certification = false)
);

CREATE TABLE IF NOT EXISTS hbce_quota_ledger (
  quota_ledger_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  credential_id TEXT NOT NULL,
  profile_id TEXT NOT NULL,
  usage_kind TEXT NOT NULL,
  cost_units INTEGER NOT NULL DEFAULT 0,
  request_hash TEXT,
  audit_id TEXT,
  usage_id TEXT,
  evt_id TEXT,
  opc_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  legal_certification BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT hbce_quota_ledger_legal_false CHECK (legal_certification = false)
);

CREATE INDEX IF NOT EXISTS hbce_rate_limit_events_scope_time_idx
ON hbce_rate_limit_events (tenant_id, workspace_id, credential_id, created_at DESC);

CREATE INDEX IF NOT EXISTS hbce_rate_limit_events_profile_time_idx
ON hbce_rate_limit_events (profile_id, created_at DESC);

CREATE INDEX IF NOT EXISTS hbce_quota_ledger_scope_time_idx
ON hbce_quota_ledger (tenant_id, workspace_id, credential_id, created_at DESC);

INSERT INTO hbce_quota_profiles (
  profile_id,
  name,
  environment,
  enabled,
  requests_per_minute,
  requests_per_hour,
  requests_per_day,
  chat_requests_per_day,
  operations_per_day,
  source_intelligence_runs_per_day,
  file_uploads_per_day,
  exports_per_day,
  webhook_deliveries_per_day,
  max_cost_units_per_month,
  warning_ratio,
  legal_certification
)
VALUES (
  'B2G_PILOT_STANDARD',
  'B2G Pilot Standard',
  'B2G_PILOT',
  true,
  30,
  300,
  1000,
  250,
  100,
  50,
  20,
  20,
  500,
  10000,
  0.8,
  false
)
ON CONFLICT (profile_id) DO NOTHING;
`;

function normalizeString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeId(value: unknown, fallback = UNKNOWN_SCOPE): string {
  const normalized = normalizeString(value) ?? fallback;
  return normalized.slice(0, MAX_ID_LENGTH);
}

function normalizeEndpoint(value: unknown): string {
  const endpoint = normalizeString(value) ?? "/api/v1/unknown";
  const prefixed = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return prefixed.slice(0, MAX_ENDPOINT_LENGTH);
}

function normalizeMethod(value: unknown): string {
  return (normalizeString(value) ?? "GET").toUpperCase().slice(0, 20);
}

function asPositiveInteger(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.floor(value));
  }
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed)) {
      return Math.max(0, parsed);
    }
  }
  return fallback;
}

function asRatio(value: unknown, fallback: number): number {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number.parseFloat(value) : NaN;
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.min(0.99, Math.max(0.01, parsed));
}

function normalizeEnvironment(value: unknown): HbceQuotaEnvironment {
  const normalized = (normalizeString(value) ?? "B2G_PILOT").toUpperCase();
  if (normalized === "SELF_PILOT") return "SELF_PILOT";
  if (normalized === "DEMO") return "DEMO";
  if (normalized === "PRODUCTION") return "PRODUCTION";
  return "B2G_PILOT";
}

function normalizeUsageKind(value: unknown): HbceQuotaUsageKind {
  const normalized = (normalizeString(value) ?? "REQUEST").toUpperCase();
  if (normalized === "CHAT_REQUEST") return "CHAT_REQUEST";
  if (normalized === "OPERATION_REQUEST") return "OPERATION_REQUEST";
  if (normalized === "SOURCE_INTELLIGENCE_RUN") return "SOURCE_INTELLIGENCE_RUN";
  if (normalized === "FILE_UPLOAD") return "FILE_UPLOAD";
  if (normalized === "EXPORT_CREATE") return "EXPORT_CREATE";
  if (normalized === "WEBHOOK_DELIVERY") return "WEBHOOK_DELIVERY";
  if (normalized === "MODEL_COST_UNIT") return "MODEL_COST_UNIT";
  return "REQUEST";
}

function addMs(date: Date, ms: number): Date {
  return new Date(date.getTime() + ms);
}

function startOfMinute(date: Date): Date {
  const copy = new Date(date);
  copy.setUTCSeconds(0, 0);
  return copy;
}

function startOfHour(date: Date): Date {
  const copy = new Date(date);
  copy.setUTCMinutes(0, 0, 0);
  return copy;
}

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setUTCHours(0, 0, 0, 0);
  return copy;
}

function startOfMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0, 0));
}

function nextMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1, 0, 0, 0, 0));
}

function hashValue(value: string): string {
  return `sha256:${createHash("sha256").update(value, "utf8").digest("hex")}`;
}

function buildEventId(prefix: string, now: Date, requestHash: string): string {
  const stamp = now.toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const digest = createHash("sha256").update(`${prefix}:${requestHash}:${now.toISOString()}`).digest("hex").slice(0, 12).toUpperCase();
  return `${prefix}-${stamp}-${digest}`;
}

function toProfile(row: ProfileRow | null): HbceRateLimitQuotaProfile {
  if (!row) {
    return getDefaultB2gPilotQuotaProfile();
  }

  return {
    profileId: normalizeId(row.profile_id, DEFAULT_PROFILE_ID),
    name: normalizeString(row.name) ?? "B2G Pilot Standard",
    environment: normalizeEnvironment(row.environment),
    enabled: row.enabled !== false,
    requestsPerMinute: asPositiveInteger(row.requests_per_minute, 30),
    requestsPerHour: asPositiveInteger(row.requests_per_hour, 300),
    requestsPerDay: asPositiveInteger(row.requests_per_day, 1000),
    chatRequestsPerDay: asPositiveInteger(row.chat_requests_per_day, 250),
    operationsPerDay: asPositiveInteger(row.operations_per_day, 100),
    sourceIntelligenceRunsPerDay: asPositiveInteger(row.source_intelligence_runs_per_day, 50),
    fileUploadsPerDay: asPositiveInteger(row.file_uploads_per_day, 20),
    exportsPerDay: asPositiveInteger(row.exports_per_day, 20),
    webhookDeliveriesPerDay: asPositiveInteger(row.webhook_deliveries_per_day, 500),
    maxCostUnitsPerMonth: asPositiveInteger(row.max_cost_units_per_month, 10000),
    warningRatio: asRatio(row.warning_ratio, 0.8),
    legalCertification: false
  };
}

function numberFromRow(value: unknown): number {
  return asPositiveInteger(value, 0);
}

function buildHeaders(snapshot?: HbceRateLimitQuotaSnapshot, retryAfterSeconds?: number): Record<string, string> {
  const headers: Record<string, string> = {
    "X-HBCE-Legal-Certification": "false",
    "X-HBCE-Quota-Boundary": "technical SaaS usage-control boundary only"
  };

  if (snapshot) {
    headers["X-RateLimit-Limit"] = String(snapshot.profile.requestsPerMinute);
    headers["X-RateLimit-Remaining"] = String(snapshot.remaining.requestsPerMinute);
    headers["X-RateLimit-Reset"] = snapshot.resetAt.minute;
    headers["X-HBCE-Quota-Profile"] = snapshot.profile.profileId;
    headers["X-HBCE-Quota-Remaining-Day"] = String(snapshot.remaining.requestsPerDay);
    headers["X-HBCE-Quota-Remaining-Month-Cost-Units"] = String(snapshot.remaining.maxCostUnitsPerMonth);
  }

  if (typeof retryAfterSeconds === "number") {
    headers["Retry-After"] = String(Math.max(1, Math.ceil(retryAfterSeconds)));
  }

  return headers;
}

function getRetryAfterSeconds(now: Date): number {
  const nextMinute = addMs(startOfMinute(now), 60_000);
  return Math.max(1, Math.ceil((nextMinute.getTime() - now.getTime()) / 1000));
}

function exceeds(limit: number, actual: number): boolean {
  return limit > 0 && actual > limit;
}

function warn(limit: number, actual: number, ratio: number): boolean {
  return limit > 0 && actual >= Math.floor(limit * ratio);
}

function computeRemaining(limit: number, actual: number): number {
  if (limit <= 0) {
    return 0;
  }
  return Math.max(0, limit - actual);
}

function buildDenied(input: {
  failReason: HbceRateLimitFailReason;
  httpStatus: 400 | 403 | 429 | 503;
  message: string;
  snapshot?: HbceRateLimitQuotaSnapshot;
  retryAfterSeconds?: number;
}): HbceRateLimitQuotaDenied {
  return {
    ok: false,
    status: "RATE_LIMIT_QUOTA_DENIED",
    revision: HBCE_RATE_LIMIT_QUOTA_REVISION,
    decision: input.httpStatus === 429 ? "LIMIT" : "DENY",
    quotaStatus: input.httpStatus === 429 ? "QUOTA_LIMITED" : "QUOTA_EXCEEDED",
    failReason: input.failReason,
    httpStatus: input.httpStatus,
    message: input.message,
    snapshot: input.snapshot,
    headers: buildHeaders(input.snapshot, input.retryAfterSeconds),
    boundary: HBCE_RATE_LIMIT_QUOTA_BOUNDARY,
    legalCertification: false
  };
}

export function getDefaultB2gPilotQuotaProfile(): HbceRateLimitQuotaProfile {
  return {
    profileId: DEFAULT_PROFILE_ID,
    name: "B2G Pilot Standard",
    environment: "B2G_PILOT",
    enabled: true,
    requestsPerMinute: 30,
    requestsPerHour: 300,
    requestsPerDay: 1000,
    chatRequestsPerDay: 250,
    operationsPerDay: 100,
    sourceIntelligenceRunsPerDay: 50,
    fileUploadsPerDay: 20,
    exportsPerDay: 20,
    webhookDeliveriesPerDay: 500,
    maxCostUnitsPerMonth: 10000,
    warningRatio: 0.8,
    legalCertification: false
  };
}

export async function getHbceQuotaProfile(profileId?: string | null): Promise<HbceRateLimitQuotaProfile> {
  const normalizedProfileId = normalizeId(profileId, DEFAULT_PROFILE_ID);

  try {
    const result = await queryHbceDatabase<ProfileRow>(
      `
        SELECT
          profile_id,
          name,
          environment,
          enabled,
          requests_per_minute,
          requests_per_hour,
          requests_per_day,
          chat_requests_per_day,
          operations_per_day,
          source_intelligence_runs_per_day,
          file_uploads_per_day,
          exports_per_day,
          webhook_deliveries_per_day,
          max_cost_units_per_month,
          warning_ratio,
          legal_certification
        FROM hbce_quota_profiles
        WHERE profile_id = $1
        LIMIT 1
      `,
      [normalizedProfileId]
    );

    return toProfile(result.rows[0] ?? null);
  } catch {
    return getDefaultB2gPilotQuotaProfile();
  }
}

async function countRateLimitWindow(input: {
  tenantId: string;
  workspaceId: string;
  credentialId: string;
  from: Date;
}): Promise<number> {
  const result = await queryHbceDatabase<CountRow>(
    `
      SELECT COUNT(*)::int AS request_count
      FROM hbce_rate_limit_events
      WHERE tenant_id = $1
        AND workspace_id = $2
        AND credential_id = $3
        AND created_at >= $4
    `,
    [input.tenantId, input.workspaceId, input.credentialId, input.from.toISOString()]
  );

  return numberFromRow(result.rows[0]?.request_count);
}

async function countQuotaDay(input: {
  tenantId: string;
  workspaceId: string;
  credentialId: string;
  from: Date;
}): Promise<CountRow> {
  const result = await queryHbceDatabase<CountRow>(
    `
      SELECT
        COUNT(*)::int AS request_count,
        COUNT(*) FILTER (WHERE usage_kind = 'CHAT_REQUEST')::int AS chat_count,
        COUNT(*) FILTER (WHERE usage_kind = 'OPERATION_REQUEST')::int AS operation_count,
        COUNT(*) FILTER (WHERE usage_kind = 'SOURCE_INTELLIGENCE_RUN')::int AS source_intelligence_count,
        COUNT(*) FILTER (WHERE usage_kind = 'FILE_UPLOAD')::int AS file_upload_count,
        COUNT(*) FILTER (WHERE usage_kind = 'EXPORT_CREATE')::int AS export_count,
        COUNT(*) FILTER (WHERE usage_kind = 'WEBHOOK_DELIVERY')::int AS webhook_delivery_count
      FROM hbce_quota_ledger
      WHERE tenant_id = $1
        AND workspace_id = $2
        AND credential_id = $3
        AND created_at >= $4
    `,
    [input.tenantId, input.workspaceId, input.credentialId, input.from.toISOString()]
  );

  return result.rows[0] ?? {};
}

async function countQuotaMonthCostUnits(input: {
  tenantId: string;
  workspaceId: string;
  credentialId: string;
  from: Date;
}): Promise<number> {
  const result = await queryHbceDatabase<CountRow>(
    `
      SELECT COALESCE(SUM(cost_units), 0)::int AS cost_units
      FROM hbce_quota_ledger
      WHERE tenant_id = $1
        AND workspace_id = $2
        AND credential_id = $3
        AND created_at >= $4
    `,
    [input.tenantId, input.workspaceId, input.credentialId, input.from.toISOString()]
  );

  return numberFromRow(result.rows[0]?.cost_units);
}

async function insertRateLimitQuotaEvent(input: {
  tenantId: string;
  workspaceId: string;
  credentialId: string;
  profileId: string;
  endpoint: string;
  method: string;
  usageKind: HbceQuotaUsageKind;
  costUnits: number;
  requestHash: string;
  auditId: string | null;
  usageId: string | null;
  evtId: string | null;
  opcId: string | null;
  now: Date;
}): Promise<void> {
  const rateLimitEventId = buildEventId("RLIM", input.now, input.requestHash);
  const quotaLedgerId = buildEventId("QLED", input.now, `${input.requestHash}:ledger`);

  await queryHbceDatabase(
    `
      INSERT INTO hbce_rate_limit_events (
        rate_limit_event_id,
        tenant_id,
        workspace_id,
        credential_id,
        profile_id,
        endpoint,
        method,
        usage_kind,
        cost_units,
        request_hash,
        audit_id,
        usage_id,
        evt_id,
        opc_id,
        created_at,
        legal_certification
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, false)
      ON CONFLICT (rate_limit_event_id) DO NOTHING
    `,
    [
      rateLimitEventId,
      input.tenantId,
      input.workspaceId,
      input.credentialId,
      input.profileId,
      input.endpoint,
      input.method,
      input.usageKind,
      input.costUnits,
      input.requestHash,
      input.auditId,
      input.usageId,
      input.evtId,
      input.opcId,
      input.now.toISOString()
    ]
  );

  await queryHbceDatabase(
    `
      INSERT INTO hbce_quota_ledger (
        quota_ledger_id,
        tenant_id,
        workspace_id,
        credential_id,
        profile_id,
        usage_kind,
        cost_units,
        request_hash,
        audit_id,
        usage_id,
        evt_id,
        opc_id,
        created_at,
        legal_certification
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, false)
      ON CONFLICT (quota_ledger_id) DO NOTHING
    `,
    [
      quotaLedgerId,
      input.tenantId,
      input.workspaceId,
      input.credentialId,
      input.profileId,
      input.usageKind,
      input.costUnits,
      input.requestHash,
      input.auditId,
      input.usageId,
      input.evtId,
      input.opcId,
      input.now.toISOString()
    ]
  );
}

function inferUsageKind(endpoint: string, method: string, explicit?: HbceQuotaUsageKind): HbceQuotaUsageKind {
  if (explicit) {
    return explicit;
  }
  const normalizedEndpoint = normalizeEndpoint(endpoint);
  const normalizedMethod = normalizeMethod(method);
  if (normalizedMethod === "POST" && normalizedEndpoint === "/api/v1/chat") return "CHAT_REQUEST";
  if (normalizedEndpoint.startsWith("/api/v1/operations")) return "OPERATION_REQUEST";
  if (normalizedEndpoint.startsWith("/api/v1/source-intelligence")) return "SOURCE_INTELLIGENCE_RUN";
  if (normalizedEndpoint.startsWith("/api/v1/files")) return "FILE_UPLOAD";
  if (normalizedEndpoint.includes("/export")) return "EXPORT_CREATE";
  if (normalizedEndpoint.includes("/webhook")) return "WEBHOOK_DELIVERY";
  return "REQUEST";
}

function computeRequestHash(input: HbceRateLimitQuotaInput, normalized: { tenantId: string; workspaceId: string; credentialId: string; now: Date }): string {
  const source = [
    normalizeString(input.requestId) ?? "NO_REQUEST_ID",
    normalized.tenantId,
    normalized.workspaceId,
    normalized.credentialId,
    normalizeMethod(input.method),
    normalizeEndpoint(input.endpoint),
    normalized.now.toISOString()
  ].join("|");
  return hashValue(source);
}

async function buildSnapshot(input: HbceRateLimitQuotaInput): Promise<HbceRateLimitQuotaSnapshot> {
  const now = input.now ?? new Date();
  const tenantId = normalizeId(input.tenantId);
  const workspaceId = normalizeId(input.workspaceId);
  const credentialId = normalizeId(input.credentialId);
  const endpoint = normalizeEndpoint(input.endpoint);
  const method = normalizeMethod(input.method);
  const usageKind = inferUsageKind(endpoint, method, input.usageKind);
  const costUnits = Math.max(0, asPositiveInteger(input.costUnits, usageKind === "CHAT_REQUEST" ? 1 : 0));
  const profile = await getHbceQuotaProfile(input.profileId);

  const minuteFrom = startOfMinute(now);
  const hourFrom = startOfHour(now);
  const dayFrom = startOfDay(now);
  const monthFrom = startOfMonth(now);

  const [minuteCount, hourCount, dayCounts, monthCostUnitsBase] = await Promise.all([
    countRateLimitWindow({ tenantId, workspaceId, credentialId, from: minuteFrom }),
    countRateLimitWindow({ tenantId, workspaceId, credentialId, from: hourFrom }),
    countQuotaDay({ tenantId, workspaceId, credentialId, from: dayFrom }),
    countQuotaMonthCostUnits({ tenantId, workspaceId, credentialId, from: monthFrom })
  ]);

  const projectedMinuteCount = minuteCount + 1;
  const projectedHourCount = hourCount + 1;
  const projectedDayRequestCount = numberFromRow(dayCounts.request_count) + 1;
  const projectedDayChatCount = numberFromRow(dayCounts.chat_count) + (usageKind === "CHAT_REQUEST" ? 1 : 0);
  const projectedDayOperationCount = numberFromRow(dayCounts.operation_count) + (usageKind === "OPERATION_REQUEST" ? 1 : 0);
  const projectedDaySourceIntelligenceCount =
    numberFromRow(dayCounts.source_intelligence_count) + (usageKind === "SOURCE_INTELLIGENCE_RUN" ? 1 : 0);
  const projectedDayFileUploadCount = numberFromRow(dayCounts.file_upload_count) + (usageKind === "FILE_UPLOAD" ? 1 : 0);
  const projectedDayExportCount = numberFromRow(dayCounts.export_count) + (usageKind === "EXPORT_CREATE" ? 1 : 0);
  const projectedDayWebhookDeliveryCount =
    numberFromRow(dayCounts.webhook_delivery_count) + (usageKind === "WEBHOOK_DELIVERY" ? 1 : 0);
  const projectedMonthCostUnits = monthCostUnitsBase + costUnits;

  return {
    profile,
    tenantId,
    workspaceId,
    credentialId,
    endpoint,
    method,
    usageKind,
    costUnits,
    minuteCount: projectedMinuteCount,
    hourCount: projectedHourCount,
    dayRequestCount: projectedDayRequestCount,
    dayChatCount: projectedDayChatCount,
    dayOperationCount: projectedDayOperationCount,
    daySourceIntelligenceCount: projectedDaySourceIntelligenceCount,
    dayFileUploadCount: projectedDayFileUploadCount,
    dayExportCount: projectedDayExportCount,
    dayWebhookDeliveryCount: projectedDayWebhookDeliveryCount,
    monthCostUnits: projectedMonthCostUnits,
    remaining: {
      requestsPerMinute: computeRemaining(profile.requestsPerMinute, projectedMinuteCount),
      requestsPerHour: computeRemaining(profile.requestsPerHour, projectedHourCount),
      requestsPerDay: computeRemaining(profile.requestsPerDay, projectedDayRequestCount),
      chatRequestsPerDay: computeRemaining(profile.chatRequestsPerDay, projectedDayChatCount),
      operationsPerDay: computeRemaining(profile.operationsPerDay, projectedDayOperationCount),
      sourceIntelligenceRunsPerDay: computeRemaining(
        profile.sourceIntelligenceRunsPerDay,
        projectedDaySourceIntelligenceCount
      ),
      fileUploadsPerDay: computeRemaining(profile.fileUploadsPerDay, projectedDayFileUploadCount),
      exportsPerDay: computeRemaining(profile.exportsPerDay, projectedDayExportCount),
      webhookDeliveriesPerDay: computeRemaining(profile.webhookDeliveriesPerDay, projectedDayWebhookDeliveryCount),
      maxCostUnitsPerMonth: computeRemaining(profile.maxCostUnitsPerMonth, projectedMonthCostUnits)
    },
    resetAt: {
      minute: addMs(minuteFrom, 60_000).toISOString(),
      hour: addMs(hourFrom, 3_600_000).toISOString(),
      day: addMs(dayFrom, 86_400_000).toISOString(),
      month: nextMonth(now).toISOString()
    },
    legalCertification: false
  };
}

function evaluateSnapshot(snapshot: HbceRateLimitQuotaSnapshot): HbceRateLimitQuotaDenied | null {
  if (!snapshot.profile.enabled) {
    return buildDenied({
      failReason: "QUOTA_PROFILE_DISABLED",
      httpStatus: 403,
      message: "Quota profile is disabled.",
      snapshot
    });
  }

  const retryAfterSeconds = getRetryAfterSeconds(new Date());

  if (exceeds(snapshot.profile.requestsPerMinute, snapshot.minuteCount)) {
    return buildDenied({
      failReason: "RATE_LIMIT_EXCEEDED",
      httpStatus: 429,
      message: "Rate limit exceeded for the current minute.",
      snapshot,
      retryAfterSeconds
    });
  }

  if (exceeds(snapshot.profile.requestsPerHour, snapshot.hourCount)) {
    return buildDenied({
      failReason: "RATE_LIMIT_EXCEEDED",
      httpStatus: 429,
      message: "Rate limit exceeded for the current hour.",
      snapshot,
      retryAfterSeconds
    });
  }

  if (exceeds(snapshot.profile.requestsPerDay, snapshot.dayRequestCount)) {
    return buildDenied({
      failReason: "QUOTA_EXCEEDED",
      httpStatus: 429,
      message: "Daily request quota exceeded.",
      snapshot,
      retryAfterSeconds
    });
  }

  if (exceeds(snapshot.profile.chatRequestsPerDay, snapshot.dayChatCount)) {
    return buildDenied({
      failReason: "QUOTA_EXCEEDED",
      httpStatus: 429,
      message: "Daily chat request quota exceeded.",
      snapshot,
      retryAfterSeconds
    });
  }

  if (exceeds(snapshot.profile.operationsPerDay, snapshot.dayOperationCount)) {
    return buildDenied({
      failReason: "QUOTA_EXCEEDED",
      httpStatus: 429,
      message: "Daily operations quota exceeded.",
      snapshot,
      retryAfterSeconds
    });
  }

  if (exceeds(snapshot.profile.sourceIntelligenceRunsPerDay, snapshot.daySourceIntelligenceCount)) {
    return buildDenied({
      failReason: "QUOTA_EXCEEDED",
      httpStatus: 429,
      message: "Daily Source Intelligence quota exceeded.",
      snapshot,
      retryAfterSeconds
    });
  }

  if (exceeds(snapshot.profile.fileUploadsPerDay, snapshot.dayFileUploadCount)) {
    return buildDenied({
      failReason: "QUOTA_EXCEEDED",
      httpStatus: 429,
      message: "Daily file upload quota exceeded.",
      snapshot,
      retryAfterSeconds
    });
  }

  if (exceeds(snapshot.profile.exportsPerDay, snapshot.dayExportCount)) {
    return buildDenied({
      failReason: "QUOTA_EXCEEDED",
      httpStatus: 429,
      message: "Daily export quota exceeded.",
      snapshot,
      retryAfterSeconds
    });
  }

  if (exceeds(snapshot.profile.webhookDeliveriesPerDay, snapshot.dayWebhookDeliveryCount)) {
    return buildDenied({
      failReason: "QUOTA_EXCEEDED",
      httpStatus: 429,
      message: "Daily webhook delivery quota exceeded.",
      snapshot,
      retryAfterSeconds
    });
  }

  if (exceeds(snapshot.profile.maxCostUnitsPerMonth, snapshot.monthCostUnits)) {
    return buildDenied({
      failReason: "QUOTA_EXCEEDED",
      httpStatus: 429,
      message: "Monthly cost-unit quota exceeded.",
      snapshot,
      retryAfterSeconds
    });
  }

  return null;
}

function isWarning(snapshot: HbceRateLimitQuotaSnapshot): boolean {
  const ratio = snapshot.profile.warningRatio;
  return (
    warn(snapshot.profile.requestsPerMinute, snapshot.minuteCount, ratio) ||
    warn(snapshot.profile.requestsPerHour, snapshot.hourCount, ratio) ||
    warn(snapshot.profile.requestsPerDay, snapshot.dayRequestCount, ratio) ||
    warn(snapshot.profile.chatRequestsPerDay, snapshot.dayChatCount, ratio) ||
    warn(snapshot.profile.operationsPerDay, snapshot.dayOperationCount, ratio) ||
    warn(snapshot.profile.sourceIntelligenceRunsPerDay, snapshot.daySourceIntelligenceCount, ratio) ||
    warn(snapshot.profile.fileUploadsPerDay, snapshot.dayFileUploadCount, ratio) ||
    warn(snapshot.profile.exportsPerDay, snapshot.dayExportCount, ratio) ||
    warn(snapshot.profile.webhookDeliveriesPerDay, snapshot.dayWebhookDeliveryCount, ratio) ||
    warn(snapshot.profile.maxCostUnitsPerMonth, snapshot.monthCostUnits, ratio)
  );
}

export async function validateHbceRateLimitQuota(
  input: HbceRateLimitQuotaInput
): Promise<HbceRateLimitQuotaResult> {
  const tenantId = normalizeId(input.tenantId);
  const workspaceId = normalizeId(input.workspaceId);
  const credentialId = normalizeId(input.credentialId);

  if (tenantId === UNKNOWN_SCOPE) {
    return buildDenied({
      failReason: "TENANT_SCOPE_REQUIRED",
      httpStatus: 400,
      message: "Tenant scope is required for rate-limit and quota validation."
    });
  }

  if (workspaceId === UNKNOWN_SCOPE) {
    return buildDenied({
      failReason: "WORKSPACE_SCOPE_REQUIRED",
      httpStatus: 400,
      message: "Workspace scope is required for rate-limit and quota validation."
    });
  }

  if (credentialId === UNKNOWN_SCOPE) {
    return buildDenied({
      failReason: "CREDENTIAL_SCOPE_REQUIRED",
      httpStatus: 400,
      message: "Credential scope is required for rate-limit and quota validation."
    });
  }

  let snapshot: HbceRateLimitQuotaSnapshot;
  try {
    snapshot = await buildSnapshot(input);
  } catch {
    return buildDenied({
      failReason: "RATE_LIMIT_STORE_UNAVAILABLE",
      httpStatus: 503,
      message: "Rate-limit or quota store is unavailable. Request rejected fail-closed."
    });
  }

  const denied = evaluateSnapshot(snapshot);
  if (denied) {
    return denied;
  }

  const warning = isWarning(snapshot);
  const now = input.now ?? new Date();
  const requestHash = computeRequestHash(input, { tenantId, workspaceId, credentialId, now });

  if (!input.dryRun) {
    try {
      await insertRateLimitQuotaEvent({
        tenantId,
        workspaceId,
        credentialId,
        profileId: snapshot.profile.profileId,
        endpoint: snapshot.endpoint,
        method: snapshot.method,
        usageKind: snapshot.usageKind,
        costUnits: snapshot.costUnits,
        requestHash,
        auditId: normalizeString(input.auditId),
        usageId: normalizeString(input.usageId),
        evtId: normalizeString(input.evtId),
        opcId: normalizeString(input.opcId),
        now
      });
    } catch {
      return buildDenied({
        failReason: "QUOTA_LEDGER_STORE_UNAVAILABLE",
        httpStatus: 503,
        message: "Quota ledger is unavailable. Request rejected fail-closed.",
        snapshot
      });
    }
  }

  return {
    ok: true,
    status: "RATE_LIMIT_QUOTA_GRANTED",
    revision: HBCE_RATE_LIMIT_QUOTA_REVISION,
    decision: warning ? "WARN" : "ALLOW",
    quotaStatus: warning ? "QUOTA_WARNING" : "QUOTA_HEALTHY",
    failReason: "NONE",
    snapshot,
    headers: buildHeaders(snapshot),
    boundary: HBCE_RATE_LIMIT_QUOTA_BOUNDARY,
    legalCertification: false
  };
}

export function buildHbceRateLimitQuotaErrorBody(result: HbceRateLimitQuotaDenied): Record<string, unknown> {
  return {
    ok: false,
    status: result.status,
    revision: result.revision,
    decision: result.decision,
    quotaStatus: result.quotaStatus,
    failReason: result.failReason,
    message: result.message,
    snapshot: result.snapshot,
    boundary: result.boundary,
    legalCertification: false
  };
}

export function describeHbceRateLimitQuotaStatus(): {
  status: "HBCE_RATE_LIMIT_QUOTA_READY";
  revision: typeof HBCE_RATE_LIMIT_QUOTA_REVISION;
  tables: string[];
  defaultProfile: HbceRateLimitQuotaProfile;
  boundary: typeof HBCE_RATE_LIMIT_QUOTA_BOUNDARY;
  legalCertification: false;
} {
  return {
    status: "HBCE_RATE_LIMIT_QUOTA_READY",
    revision: HBCE_RATE_LIMIT_QUOTA_REVISION,
    tables: [HBCE_RATE_LIMIT_TABLE, HBCE_QUOTA_LEDGER_TABLE, HBCE_QUOTA_PROFILES_TABLE],
    defaultProfile: getDefaultB2gPilotQuotaProfile(),
    boundary: HBCE_RATE_LIMIT_QUOTA_BOUNDARY,
    legalCertification: false
  };
}
