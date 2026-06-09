import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

import { queryHbceDatabase } from "@/lib/ipr-database";

export const HBCE_API_AUTH_REVISION =
  "HBCE-API-AUTH-v0.1-CONTROLLED_B2G_PILOT_GATE" as const;

export const HBCE_API_CREDENTIALS_TABLE = "hbce_api_credentials" as const;

export const HBCE_API_AUTH_LEGAL_CERTIFICATION = false as const;

export const HBCE_API_AUTH_BOUNDARY = {
  legalCertification: HBCE_API_AUTH_LEGAL_CERTIFICATION,
  opcBoundary: "technical proof receipt only",
  evtBoundary: "technical event trace only",
  iprBoundary: "operational identity/proof layer only",
  authorityBoundary:
    "HBCE/JOKER-C2 is runtime governance and audit-ready infrastructure, not a public authority and not a legal certifier."
} as const;

export type HbceApiAuthMode =
  | "DISABLED_INTERNAL_SELF_PILOT"
  | "PILOT_OPTIONAL"
  | "PILOT_REQUIRED";

export type HbceApiCredentialKind = "API_KEY" | "BEARER_TOKEN";

export type HbceApiCredentialStatus =
  | "ACTIVE"
  | "SUSPENDED"
  | "REVOKED"
  | "EXPIRED"
  | "ROTATED";

export type HbceApiCredentialEnvironment =
  | "SELF_PILOT"
  | "DEMO"
  | "B2G_PILOT"
  | "PRODUCTION";

export type HbceApiAuthFailReason =
  | "AUTH_DISABLED_INTERNAL_SELF_PILOT"
  | "API_CREDENTIAL_REQUIRED"
  | "API_CREDENTIAL_INVALID"
  | "API_CREDENTIAL_STORE_UNAVAILABLE"
  | "API_CREDENTIAL_REVOKED"
  | "API_CREDENTIAL_SUSPENDED"
  | "API_CREDENTIAL_EXPIRED"
  | "API_CREDENTIAL_ROTATED"
  | "API_CREDENTIAL_STATUS_UNSUPPORTED"
  | "API_CREDENTIAL_SCOPE_DENIED"
  | "API_CREDENTIAL_ENDPOINT_DENIED"
  | "TENANT_SCOPE_MISMATCH"
  | "WORKSPACE_SCOPE_MISMATCH"
  | "SOURCESET_SCOPE_DENIED";

export type HbceApiScope =
  | "v1:root:read"
  | "v1:health:read"
  | "v1:capabilities:read"
  | "v1:ipr-session:create"
  | "v1:ipr-session:read"
  | "v1:chat:create"
  | "v1:files:create"
  | "v1:operations:create"
  | "v1:operations:read"
  | "v1:events:read"
  | "v1:opc:read"
  | "v1:audit:read"
  | "v1:model-usage:read"
  | "v1:openapi:read"
  | "v1:self-test:read"
  | "v1:source-intelligence:read"
  | "v1:audit:export"
  | "v1:model-usage:export"
  | "v1:events:export"
  | "v1:opc:export"
  | "v1:quota:read"
  | "v1:quota:export"
  | "v1:evidence-bundle:create"
  | "v1:pilot-report:create"
  | "v1:webhooks:manage"
  | "admin:tenants:manage"
  | "admin:credentials:manage"
  | "admin:runtime:read";

export type HeaderRecord = Record<string, string | string[] | undefined>;

export type HbceApiCredentialDatabaseRow = {
  api_key_id?: string | null;
  credential_id?: string | null;
  key_id?: string | null;
  key_prefix?: string | null;
  secret_hash?: string | null;
  secret_last4?: string | null;
  credential_type?: string | null;
  environment?: string | null;
  status?: string | null;
  tenant_id?: string | null;
  workspace_id?: string | null;
  account_id?: string | null;
  subscription_id?: string | null;
  scopes?: unknown;
  allowed_endpoints?: unknown;
  allowed_source_sets?: unknown;
  rate_limit_profile_id?: string | null;
  expires_at?: string | Date | null;
  revoked_at?: string | Date | null;
  created_at?: string | Date | null;
  updated_at?: string | Date | null;
  last_used_at?: string | Date | null;
  legal_certification?: boolean | null;
};

export type HbceApiCredentialPublicSnapshot = {
  credentialId: string;
  apiKeyId: string;
  keyPrefix: string;
  secretLast4: string | null;
  credentialType: HbceApiCredentialKind;
  environment: HbceApiCredentialEnvironment | "UNKNOWN";
  status: HbceApiCredentialStatus;
  tenantId: string;
  workspaceId: string;
  accountId: string | null;
  subscriptionId: string | null;
  scopes: string[];
  allowedEndpoints: string[];
  allowedSourceSets: string[];
  rateLimitProfileId: string | null;
  expiresAt: string | null;
  revokedAt: string | null;
  lastUsedAt: string | null;
  legalCertification: false;
};

export type HbceApiAuthValidationInput = {
  headers: Headers | HeaderRecord | { get(name: string): string | null };
  endpoint: string;
  method: string;
  requiredScopes?: string[];
  tenantId?: string | null;
  workspaceId?: string | null;
  sourceSet?: string | null;
  authMode?: HbceApiAuthMode;
  requestIp?: string | null;
  userAgent?: string | null;
  now?: Date;
};

export type HbceApiAuthGranted = {
  ok: true;
  status: "API_AUTH_GRANTED";
  revision: typeof HBCE_API_AUTH_REVISION;
  authMode: HbceApiAuthMode;
  credentialKind: HbceApiCredentialKind;
  credential: HbceApiCredentialPublicSnapshot;
  endpoint: string;
  method: string;
  requiredScopes: string[];
  policy: {
    decision: "ALLOW";
    tenantScope: "PASS";
    workspaceScope: "PASS";
    endpointScope: "PASS";
    sourceSetScope: "PASS" | "NOT_REQUESTED";
  };
  boundary: typeof HBCE_API_AUTH_BOUNDARY;
  legalCertification: false;
};

export type HbceApiAuthDenied = {
  ok: false;
  status: "API_AUTH_DENIED";
  revision: typeof HBCE_API_AUTH_REVISION;
  authMode: HbceApiAuthMode;
  failReason: HbceApiAuthFailReason;
  httpStatus: 401 | 403 | 503;
  endpoint: string;
  method: string;
  requiredScopes: string[];
  message: string;
  credential?: Partial<HbceApiCredentialPublicSnapshot> | null;
  policy: {
    decision: "FAIL_CLOSED";
    tenantScope: "PASS" | "FAIL" | "NOT_CHECKED";
    workspaceScope: "PASS" | "FAIL" | "NOT_CHECKED";
    endpointScope: "PASS" | "FAIL" | "NOT_CHECKED";
    sourceSetScope: "PASS" | "FAIL" | "NOT_REQUESTED" | "NOT_CHECKED";
  };
  boundary: typeof HBCE_API_AUTH_BOUNDARY;
  legalCertification: false;
};

export type HbceApiAuthResult = HbceApiAuthGranted | HbceApiAuthDenied;

export type HbceCreatedApiSecret = {
  rawSecret: string;
  secretHash: string;
  keyPrefix: string;
  secretLast4: string;
  legalCertification: false;
};

export const HBCE_API_CREDENTIALS_SCHEMA_SQL = `
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
  scopes JSONB NOT NULL DEFAULT '[]'::jsonb,
  allowed_endpoints JSONB NOT NULL DEFAULT '[]'::jsonb,
  allowed_source_sets JSONB NOT NULL DEFAULT '[]'::jsonb,
  rate_limit_profile_id TEXT,
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ,
  last_used_ip_hash TEXT,
  last_used_user_agent_hash TEXT,
  legal_certification BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS hbce_api_credentials_secret_hash_idx
ON hbce_api_credentials (secret_hash);

CREATE INDEX IF NOT EXISTS hbce_api_credentials_tenant_workspace_idx
ON hbce_api_credentials (tenant_id, workspace_id);

CREATE INDEX IF NOT EXISTS hbce_api_credentials_status_idx
ON hbce_api_credentials (status);
`;

const DEFAULT_AUTH_MODE: HbceApiAuthMode = "PILOT_REQUIRED";
const API_SECRET_PREFIX = "hbce_pilot";
const SECRET_RANDOM_BYTES = 32;
const MAX_ENDPOINT_LENGTH = 220;
const MAX_SCOPE_LENGTH = 120;
const MAX_SOURCE_SET_LENGTH = 160;
const WILDCARD = "*";

const ENDPOINT_SCOPE_MAP: ReadonlyArray<{
  method: string;
  pattern: RegExp;
  scopes: HbceApiScope[];
}> = [
  { method: "GET", pattern: /^\/api\/v1\/?$/, scopes: ["v1:root:read"] },
  { method: "GET", pattern: /^\/api\/v1\/health\/?$/, scopes: ["v1:health:read"] },
  { method: "GET", pattern: /^\/api\/v1\/capabilities\/?$/, scopes: ["v1:capabilities:read"] },
  { method: "POST", pattern: /^\/api\/v1\/ipr\/session\/?$/, scopes: ["v1:ipr-session:create"] },
  { method: "GET", pattern: /^\/api\/v1\/ipr\/session\/[^/]+\/?$/, scopes: ["v1:ipr-session:read"] },
  { method: "POST", pattern: /^\/api\/v1\/chat\/?$/, scopes: ["v1:chat:create"] },
  { method: "POST", pattern: /^\/api\/v1\/files\/?$/, scopes: ["v1:files:create"] },
  { method: "POST", pattern: /^\/api\/v1\/operations\/?$/, scopes: ["v1:operations:create"] },
  { method: "GET", pattern: /^\/api\/v1\/operations\/[^/]+\/?$/, scopes: ["v1:operations:read"] },
  { method: "GET", pattern: /^\/api\/v1\/events\/?$/, scopes: ["v1:events:read"] },
  { method: "GET", pattern: /^\/api\/v1\/opc\/[^/]+\/?$/, scopes: ["v1:opc:read"] },
  { method: "GET", pattern: /^\/api\/v1\/audit\/[^/]+\/?$/, scopes: ["v1:audit:read"] },
  { method: "GET", pattern: /^\/api\/v1\/model-usage\/[^/]+\/?$/, scopes: ["v1:model-usage:read"] },
  { method: "GET", pattern: /^\/api\/v1\/openapi\/?$/, scopes: ["v1:openapi:read"] },
  { method: "GET", pattern: /^\/api\/v1\/self-test\/?$/, scopes: ["v1:self-test:read"] },
  { method: "GET", pattern: /^\/api\/v1\/source-intelligence\/?$/, scopes: ["v1:source-intelligence:read"] }
];

function utcNowIso(now = new Date()): string {
  return now.toISOString();
}

function normalizeString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function truncate(value: string, maxLength: number): string {
  return value.length > maxLength ? value.slice(0, maxLength) : value;
}

function normalizeEndpoint(endpoint: string): string {
  const clean = truncate(endpoint.trim(), MAX_ENDPOINT_LENGTH);
  if (clean.startsWith("/")) {
    return clean.replace(/\/+$/, "") || "/";
  }
  return `/${clean}`.replace(/\/+$/, "") || "/";
}

function normalizeMethod(method: string): string {
  return method.trim().toUpperCase();
}

function normalizeHeaderName(name: string): string {
  return name.trim().toLowerCase();
}

function getHeaderValue(
  headers: Headers | HeaderRecord | { get(name: string): string | null },
  name: string
): string | null {
  const directGet = (headers as { get?: unknown }).get;
  if (typeof directGet === "function") {
    const value = (headers as { get(name: string): string | null }).get(name);
    return normalizeString(value);
  }

  const wanted = normalizeHeaderName(name);
  const record = headers as HeaderRecord;
  for (const [key, value] of Object.entries(record)) {
    if (normalizeHeaderName(key) !== wanted) {
      continue;
    }
    if (Array.isArray(value)) {
      return normalizeString(value[0]);
    }
    return normalizeString(value);
  }

  return null;
}

function extractBearerToken(authorizationHeader: string | null): string | null {
  if (!authorizationHeader) {
    return null;
  }
  const match = authorizationHeader.match(/^Bearer\s+(.+)$/i);
  return match ? normalizeString(match[1]) : null;
}

function getCredentialKindFromHeaders(
  headers: Headers | HeaderRecord | { get(name: string): string | null }
): { kind: HbceApiCredentialKind; secret: string } | null {
  const bearerToken = extractBearerToken(getHeaderValue(headers, "authorization"));
  if (bearerToken) {
    return { kind: "BEARER_TOKEN", secret: bearerToken };
  }

  const apiKey = getHeaderValue(headers, "x-hbce-api-key");
  if (apiKey) {
    return { kind: "API_KEY", secret: apiKey };
  }

  return null;
}

function stableSha256(value: string): string {
  return `sha256:${createHash("sha256").update(value, "utf8").digest("hex")}`;
}

function getSecretPepper(): string {
  return process.env.HBCE_API_SECRET_PEPPER ?? "HBCE_API_SECRET_PEPPER_NOT_CONFIGURED_SELF_PILOT";
}

function safeTimingEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }
  return timingSafeEqual(leftBuffer, rightBuffer);
}

function parseJsonArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeString(item)).filter((item): item is string => Boolean(item));
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return [];
    }
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      return parseJsonArray(parsed);
    } catch {
      return trimmed
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  return [];
}

function normalizeStringArray(values: string[]): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => normalizeString(value))
        .filter((value): value is string => Boolean(value))
        .map((value) => truncate(value, MAX_SCOPE_LENGTH))
    )
  );
}

function normalizeDateIso(value: string | Date | null | undefined): string | null {
  if (!value) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function isExpired(expiresAt: string | null, now: Date): boolean {
  if (!expiresAt) {
    return false;
  }
  const date = new Date(expiresAt);
  return !Number.isNaN(date.getTime()) && date.getTime() <= now.getTime();
}

function normalizeCredentialStatus(value: string | null | undefined, expiresAt: string | null, now: Date): HbceApiCredentialStatus {
  const normalized = (value ?? "ACTIVE").trim().toUpperCase();
  if (isExpired(expiresAt, now)) {
    return "EXPIRED";
  }
  if (normalized === "ACTIVE") return "ACTIVE";
  if (normalized === "SUSPENDED") return "SUSPENDED";
  if (normalized === "REVOKED") return "REVOKED";
  if (normalized === "EXPIRED") return "EXPIRED";
  if (normalized === "ROTATED") return "ROTATED";
  return "SUSPENDED";
}

function normalizeCredentialKind(value: string | null | undefined): HbceApiCredentialKind {
  const normalized = (value ?? "API_KEY").trim().toUpperCase();
  return normalized === "BEARER_TOKEN" ? "BEARER_TOKEN" : "API_KEY";
}

function normalizeEnvironment(value: string | null | undefined): HbceApiCredentialEnvironment | "UNKNOWN" {
  const normalized = (value ?? "UNKNOWN").trim().toUpperCase();
  if (normalized === "SELF_PILOT") return "SELF_PILOT";
  if (normalized === "DEMO") return "DEMO";
  if (normalized === "B2G_PILOT") return "B2G_PILOT";
  if (normalized === "PRODUCTION") return "PRODUCTION";
  return "UNKNOWN";
}

function endpointMatchesAllowed(endpoint: string, method: string, allowedEndpoints: string[]): boolean {
  if (allowedEndpoints.includes(WILDCARD)) {
    return true;
  }

  const normalizedEndpoint = normalizeEndpoint(endpoint);
  const normalizedMethod = normalizeMethod(method);
  const methodPath = `${normalizedMethod} ${normalizedEndpoint}`;

  return allowedEndpoints.some((allowed) => {
    const normalizedAllowed = allowed.trim();
    if (normalizedAllowed === normalizedEndpoint || normalizedAllowed === methodPath) {
      return true;
    }
    if (normalizedAllowed.endsWith("/*")) {
      const prefix = normalizedAllowed.slice(0, -1);
      return normalizedEndpoint.startsWith(prefix) || methodPath.startsWith(prefix);
    }
    return false;
  });
}

function hasAllScopes(credentialScopes: string[], requiredScopes: string[]): boolean {
  if (credentialScopes.includes(WILDCARD)) {
    return true;
  }
  return requiredScopes.every((scope) => credentialScopes.includes(scope));
}

function normalizeSourceSet(sourceSet: string | null | undefined): string | null {
  const normalized = normalizeString(sourceSet);
  return normalized ? truncate(normalized, MAX_SOURCE_SET_LENGTH) : null;
}

function sourceSetAllowed(allowedSourceSets: string[], sourceSet: string | null): boolean {
  if (!sourceSet) {
    return true;
  }
  if (allowedSourceSets.includes(WILDCARD)) {
    return true;
  }
  return allowedSourceSets.includes(sourceSet);
}

function buildDenied(input: {
  authMode: HbceApiAuthMode;
  failReason: HbceApiAuthFailReason;
  httpStatus: 401 | 403 | 503;
  endpoint: string;
  method: string;
  requiredScopes: string[];
  message: string;
  credential?: Partial<HbceApiCredentialPublicSnapshot> | null;
  tenantScope?: "PASS" | "FAIL" | "NOT_CHECKED";
  workspaceScope?: "PASS" | "FAIL" | "NOT_CHECKED";
  endpointScope?: "PASS" | "FAIL" | "NOT_CHECKED";
  sourceSetScope?: "PASS" | "FAIL" | "NOT_REQUESTED" | "NOT_CHECKED";
}): HbceApiAuthDenied {
  return {
    ok: false,
    status: "API_AUTH_DENIED",
    revision: HBCE_API_AUTH_REVISION,
    authMode: input.authMode,
    failReason: input.failReason,
    httpStatus: input.httpStatus,
    endpoint: normalizeEndpoint(input.endpoint),
    method: normalizeMethod(input.method),
    requiredScopes: input.requiredScopes,
    message: input.message,
    credential: input.credential ?? null,
    policy: {
      decision: "FAIL_CLOSED",
      tenantScope: input.tenantScope ?? "NOT_CHECKED",
      workspaceScope: input.workspaceScope ?? "NOT_CHECKED",
      endpointScope: input.endpointScope ?? "NOT_CHECKED",
      sourceSetScope: input.sourceSetScope ?? "NOT_CHECKED"
    },
    boundary: HBCE_API_AUTH_BOUNDARY,
    legalCertification: false
  };
}

function toPublicCredential(
  row: HbceApiCredentialDatabaseRow,
  now: Date
): HbceApiCredentialPublicSnapshot {
  const expiresAt = normalizeDateIso(row.expires_at ?? null);
  const revokedAt = normalizeDateIso(row.revoked_at ?? null);
  const lastUsedAt = normalizeDateIso(row.last_used_at ?? null);
  const scopes = normalizeStringArray(parseJsonArray(row.scopes));
  const allowedEndpoints = normalizeStringArray(parseJsonArray(row.allowed_endpoints));
  const allowedSourceSets = normalizeStringArray(parseJsonArray(row.allowed_source_sets));

  return {
    credentialId:
      normalizeString(row.credential_id) ?? normalizeString(row.api_key_id) ?? normalizeString(row.key_id) ?? "NO_CREDENTIAL_ID",
    apiKeyId: normalizeString(row.api_key_id) ?? normalizeString(row.key_id) ?? "NO_API_KEY_ID",
    keyPrefix: normalizeString(row.key_prefix) ?? "NO_KEY_PREFIX",
    secretLast4: normalizeString(row.secret_last4),
    credentialType: normalizeCredentialKind(row.credential_type),
    environment: normalizeEnvironment(row.environment),
    status: normalizeCredentialStatus(row.status, expiresAt, now),
    tenantId: normalizeString(row.tenant_id) ?? "NO_TENANT_ID",
    workspaceId: normalizeString(row.workspace_id) ?? "NO_WORKSPACE_ID",
    accountId: normalizeString(row.account_id),
    subscriptionId: normalizeString(row.subscription_id),
    scopes,
    allowedEndpoints,
    allowedSourceSets,
    rateLimitProfileId: normalizeString(row.rate_limit_profile_id),
    expiresAt,
    revokedAt,
    lastUsedAt,
    legalCertification: false
  };
}

function statusToFailReason(status: HbceApiCredentialStatus): HbceApiAuthFailReason {
  if (status === "REVOKED") return "API_CREDENTIAL_REVOKED";
  if (status === "SUSPENDED") return "API_CREDENTIAL_SUSPENDED";
  if (status === "EXPIRED") return "API_CREDENTIAL_EXPIRED";
  if (status === "ROTATED") return "API_CREDENTIAL_ROTATED";
  return "API_CREDENTIAL_STATUS_UNSUPPORTED";
}

function statusToMessage(status: HbceApiCredentialStatus): string {
  if (status === "REVOKED") return "API credential has been revoked.";
  if (status === "SUSPENDED") return "API credential is suspended.";
  if (status === "EXPIRED") return "API credential has expired.";
  if (status === "ROTATED") return "API credential has been rotated and must not be used.";
  return "API credential status is unsupported.";
}

export function resolveHbceApiAuthMode(explicitMode?: HbceApiAuthMode): HbceApiAuthMode {
  if (explicitMode) {
    return explicitMode;
  }

  const envMode = normalizeString(process.env.HBCE_API_AUTH_MODE)?.toUpperCase();
  if (envMode === "DISABLED_INTERNAL_SELF_PILOT") return "DISABLED_INTERNAL_SELF_PILOT";
  if (envMode === "PILOT_OPTIONAL") return "PILOT_OPTIONAL";
  if (envMode === "PILOT_REQUIRED") return "PILOT_REQUIRED";

  return DEFAULT_AUTH_MODE;
}

export function hashHbceApiSecret(rawSecret: string): string {
  const normalized = normalizeString(rawSecret);
  if (!normalized) {
    return stableSha256(`empty:${getSecretPepper()}`);
  }
  return stableSha256(`${getSecretPepper()}:${normalized}`);
}

export function createHbceApiCredentialSecret(prefix = API_SECRET_PREFIX): HbceCreatedApiSecret {
  const safePrefix = normalizeString(prefix)?.replace(/[^a-zA-Z0-9_\-]/g, "_") ?? API_SECRET_PREFIX;
  const randomPart = randomBytes(SECRET_RANDOM_BYTES).toString("base64url");
  const rawSecret = `${safePrefix}_${randomPart}`;
  return {
    rawSecret,
    secretHash: hashHbceApiSecret(rawSecret),
    keyPrefix: rawSecret.slice(0, Math.min(rawSecret.length, 16)),
    secretLast4: rawSecret.slice(-4),
    legalCertification: false
  };
}

export function getRequiredScopesForEndpoint(endpoint: string, method: string): string[] {
  const normalizedEndpoint = normalizeEndpoint(endpoint);
  const normalizedMethod = normalizeMethod(method);
  const match = ENDPOINT_SCOPE_MAP.find(
    (entry) => entry.method === normalizedMethod && entry.pattern.test(normalizedEndpoint)
  );
  return match ? [...match.scopes] : [];
}

export async function findHbceApiCredentialBySecretHash(
  secretHash: string
): Promise<HbceApiCredentialDatabaseRow | null> {
  const result = await queryHbceDatabase<HbceApiCredentialDatabaseRow>(
    `
      SELECT
        api_key_id,
        credential_id,
        key_id,
        key_prefix,
        secret_hash,
        secret_last4,
        credential_type,
        environment,
        status,
        tenant_id,
        workspace_id,
        account_id,
        subscription_id,
        scopes,
        allowed_endpoints,
        allowed_source_sets,
        rate_limit_profile_id,
        expires_at,
        revoked_at,
        created_at,
        updated_at,
        last_used_at,
        legal_certification
      FROM hbce_api_credentials
      WHERE secret_hash = $1
      LIMIT 1
    `,
    [secretHash]
  );

  return result.rows[0] ?? null;
}

export async function markHbceApiCredentialUsed(input: {
  credentialId: string;
  requestIp?: string | null;
  userAgent?: string | null;
  now?: Date;
}): Promise<void> {
  const credentialId = normalizeString(input.credentialId);
  if (!credentialId || credentialId === "NO_CREDENTIAL_ID") {
    return;
  }

  const requestIpHash = input.requestIp ? stableSha256(input.requestIp) : null;
  const userAgentHash = input.userAgent ? stableSha256(input.userAgent) : null;
  const nowIso = utcNowIso(input.now ?? new Date());

  await queryHbceDatabase(
    `
      UPDATE hbce_api_credentials
      SET
        last_used_at = $2,
        last_used_ip_hash = COALESCE($3, last_used_ip_hash),
        last_used_user_agent_hash = COALESCE($4, last_used_user_agent_hash),
        updated_at = $2
      WHERE credential_id = $1 OR api_key_id = $1
    `,
    [credentialId, nowIso, requestIpHash, userAgentHash]
  );
}

export async function validateHbceApiCredential(
  input: HbceApiAuthValidationInput
): Promise<HbceApiAuthResult> {
  const authMode = resolveHbceApiAuthMode(input.authMode);
  const endpoint = normalizeEndpoint(input.endpoint);
  const method = normalizeMethod(input.method);
  const requiredScopes = input.requiredScopes?.length
    ? normalizeStringArray(input.requiredScopes)
    : getRequiredScopesForEndpoint(endpoint, method);
  const now = input.now ?? new Date();

  if (authMode === "DISABLED_INTERNAL_SELF_PILOT") {
    return buildDenied({
      authMode,
      failReason: "AUTH_DISABLED_INTERNAL_SELF_PILOT",
      httpStatus: 503,
      endpoint,
      method,
      requiredScopes,
      message:
        "API authentication is disabled for internal self-pilot mode. External API pilot access is not available in this mode."
    });
  }

  const credentialCandidate = getCredentialKindFromHeaders(input.headers);
  if (!credentialCandidate) {
    if (authMode === "PILOT_OPTIONAL") {
      return buildDenied({
        authMode,
        failReason: "API_CREDENTIAL_REQUIRED",
        httpStatus: 401,
        endpoint,
        method,
        requiredScopes,
        message: "API credential is required for this endpoint in pilot mode."
      });
    }

    return buildDenied({
      authMode,
      failReason: "API_CREDENTIAL_REQUIRED",
      httpStatus: 401,
      endpoint,
      method,
      requiredScopes,
      message: "Missing HBCE API credential. Use x-hbce-api-key or Authorization: Bearer <token>."
    });
  }

  const candidateHash = hashHbceApiSecret(credentialCandidate.secret);

  let credentialRow: HbceApiCredentialDatabaseRow | null = null;
  try {
    credentialRow = await findHbceApiCredentialBySecretHash(candidateHash);
  } catch {
    return buildDenied({
      authMode,
      failReason: "API_CREDENTIAL_STORE_UNAVAILABLE",
      httpStatus: 503,
      endpoint,
      method,
      requiredScopes,
      message: "API credential store is unavailable or not migrated. Request rejected fail-closed."
    });
  }

  if (!credentialRow?.secret_hash || !safeTimingEqual(credentialRow.secret_hash, candidateHash)) {
    return buildDenied({
      authMode,
      failReason: "API_CREDENTIAL_INVALID",
      httpStatus: 401,
      endpoint,
      method,
      requiredScopes,
      message: "API credential is invalid."
    });
  }

  const credential = toPublicCredential(credentialRow, now);

  if (credential.credentialType !== credentialCandidate.kind) {
    return buildDenied({
      authMode,
      failReason: "API_CREDENTIAL_INVALID",
      httpStatus: 401,
      endpoint,
      method,
      requiredScopes,
      message: "API credential type does not match the authentication header used.",
      credential
    });
  }

  if (credential.status !== "ACTIVE") {
    return buildDenied({
      authMode,
      failReason: statusToFailReason(credential.status),
      httpStatus: 403,
      endpoint,
      method,
      requiredScopes,
      message: statusToMessage(credential.status),
      credential
    });
  }

  const tenantId = normalizeString(input.tenantId);
  if (tenantId && tenantId !== credential.tenantId) {
    return buildDenied({
      authMode,
      failReason: "TENANT_SCOPE_MISMATCH",
      httpStatus: 403,
      endpoint,
      method,
      requiredScopes,
      message: "Request tenant does not match API credential tenant scope.",
      credential,
      tenantScope: "FAIL"
    });
  }

  const workspaceId = normalizeString(input.workspaceId);
  if (workspaceId && workspaceId !== credential.workspaceId) {
    return buildDenied({
      authMode,
      failReason: "WORKSPACE_SCOPE_MISMATCH",
      httpStatus: 403,
      endpoint,
      method,
      requiredScopes,
      message: "Request workspace does not match API credential workspace scope.",
      credential,
      tenantScope: "PASS",
      workspaceScope: "FAIL"
    });
  }

  if (requiredScopes.length > 0 && !hasAllScopes(credential.scopes, requiredScopes)) {
    return buildDenied({
      authMode,
      failReason: "API_CREDENTIAL_SCOPE_DENIED",
      httpStatus: 403,
      endpoint,
      method,
      requiredScopes,
      message: "API credential does not include the required endpoint scope.",
      credential,
      tenantScope: "PASS",
      workspaceScope: "PASS",
      endpointScope: "FAIL"
    });
  }

  if (
    credential.allowedEndpoints.length > 0 &&
    !endpointMatchesAllowed(endpoint, method, credential.allowedEndpoints)
  ) {
    return buildDenied({
      authMode,
      failReason: "API_CREDENTIAL_ENDPOINT_DENIED",
      httpStatus: 403,
      endpoint,
      method,
      requiredScopes,
      message: "API credential is not allowed to access this endpoint.",
      credential,
      tenantScope: "PASS",
      workspaceScope: "PASS",
      endpointScope: "FAIL"
    });
  }

  const requestedSourceSet = normalizeSourceSet(input.sourceSet);
  if (!sourceSetAllowed(credential.allowedSourceSets, requestedSourceSet)) {
    return buildDenied({
      authMode,
      failReason: "SOURCESET_SCOPE_DENIED",
      httpStatus: 403,
      endpoint,
      method,
      requiredScopes,
      message: "API credential is not allowed to use the requested Source Intelligence sourceSet.",
      credential,
      tenantScope: "PASS",
      workspaceScope: "PASS",
      endpointScope: "PASS",
      sourceSetScope: "FAIL"
    });
  }

  void markHbceApiCredentialUsed({
    credentialId: credential.credentialId,
    requestIp: input.requestIp,
    userAgent: input.userAgent,
    now
  }).catch(() => undefined);

  return {
    ok: true,
    status: "API_AUTH_GRANTED",
    revision: HBCE_API_AUTH_REVISION,
    authMode,
    credentialKind: credentialCandidate.kind,
    credential,
    endpoint,
    method,
    requiredScopes,
    policy: {
      decision: "ALLOW",
      tenantScope: "PASS",
      workspaceScope: "PASS",
      endpointScope: "PASS",
      sourceSetScope: requestedSourceSet ? "PASS" : "NOT_REQUESTED"
    },
    boundary: HBCE_API_AUTH_BOUNDARY,
    legalCertification: false
  };
}

export function buildHbceApiAuthErrorBody(result: HbceApiAuthDenied): Record<string, unknown> {
  return {
    ok: false,
    status: result.status,
    revision: result.revision,
    failReason: result.failReason,
    message: result.message,
    endpoint: result.endpoint,
    method: result.method,
    requiredScopes: result.requiredScopes,
    policy: result.policy,
    boundary: result.boundary,
    legalCertification: false
  };
}

export function getHbceApiCredentialFingerprint(rawSecret: string): {
  keyPrefix: string;
  secretLast4: string;
  secretHash: string;
  legalCertification: false;
} {
  const normalized = normalizeString(rawSecret) ?? "";
  return {
    keyPrefix: normalized.slice(0, Math.min(normalized.length, 16)),
    secretLast4: normalized.slice(-4),
    secretHash: hashHbceApiSecret(normalized),
    legalCertification: false
  };
}

export function describeHbceApiAuthStatus(): {
  status: "HBCE_API_AUTH_READY";
  revision: typeof HBCE_API_AUTH_REVISION;
  table: typeof HBCE_API_CREDENTIALS_TABLE;
  defaultAuthMode: HbceApiAuthMode;
  supportedCredentialKinds: HbceApiCredentialKind[];
  boundary: typeof HBCE_API_AUTH_BOUNDARY;
  legalCertification: false;
} {
  return {
    status: "HBCE_API_AUTH_READY",
    revision: HBCE_API_AUTH_REVISION,
    table: HBCE_API_CREDENTIALS_TABLE,
    defaultAuthMode: resolveHbceApiAuthMode(),
    supportedCredentialKinds: ["API_KEY", "BEARER_TOKEN"],
    boundary: HBCE_API_AUTH_BOUNDARY,
    legalCertification: false
  };
}
