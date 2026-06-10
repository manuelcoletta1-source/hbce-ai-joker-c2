import { randomBytes } from "node:crypto";

import { queryHbceDatabase } from "../lib/ipr-database";
import {
  createHbceApiCredentialSecret,
  HBCE_API_AUTH_BOUNDARY,
  HBCE_API_AUTH_REVISION,
  type HbceApiCredentialEnvironment,
  type HbceApiCredentialKind
} from "../lib/api-auth";

const SCRIPT_REVISION = "HBCE-CREATE-API-CREDENTIAL-v0.1-CONTROLLED_B2G_PILOT_SEED" as const;

const DEFAULT_SCOPES = [
  "v1:health:read",
  "v1:capabilities:read",
  "v1:ipr-session:create",
  "v1:ipr-session:read",
  "v1:chat:create",
  "v1:operations:create",
  "v1:operations:read",
  "v1:events:read",
  "v1:opc:read",
  "v1:audit:read",
  "v1:model-usage:read",
  "v1:source-intelligence:read"
] as const;

const DEFAULT_ALLOWED_ENDPOINTS = [
  "GET /api/v1/health",
  "GET /api/v1/capabilities",
  "POST /api/v1/ipr/session",
  "GET /api/v1/ipr/session/*",
  "POST /api/v1/chat",
  "POST /api/v1/operations",
  "GET /api/v1/operations/*",
  "GET /api/v1/events",
  "GET /api/v1/opc/*",
  "GET /api/v1/audit/*",
  "GET /api/v1/model-usage/*",
  "GET /api/v1/source-intelligence"
] as const;

const DEFAULT_ALLOWED_SOURCE_SETS = [
  "ANTHROPIC_MYTHOS_RECURSIVE_AI_RISK",
  "EU_AI_GOVERNANCE_REGULATORY_STACK",
  "ENISA_CYBER_THREAT_LANDSCAPE",
  "ECB_FINANCIAL_SYSTEM_AI_CYBER_RISK",
  "OPENAI_AGENTIC_SYSTEMS_SECURITY"
] as const;

type ParsedArgs = {
  tenantId: string;
  workspaceId: string;
  accountId: string | null;
  subscriptionId: string | null;
  credentialId: string;
  apiKeyId: string;
  keyId: string;
  credentialType: HbceApiCredentialKind;
  environment: HbceApiCredentialEnvironment;
  rateLimitProfileId: string | null;
  expiresAt: string | null;
  scopes: string[];
  allowedEndpoints: string[];
  allowedSourceSets: string[];
  dryRun: boolean;
};

function readArg(name: string): string | null {
  const prefix = `--${name}=`;
  const direct = process.argv.find((arg) => arg.startsWith(prefix));
  if (direct) {
    const value = direct.slice(prefix.length).trim();
    return value.length > 0 ? value : null;
  }

  const index = process.argv.indexOf(`--${name}`);
  if (index >= 0) {
    const value = process.argv[index + 1]?.trim();
    return value && !value.startsWith("--") ? value : null;
  }

  return null;
}

function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

function readRequired(name: string, envName: string): string {
  const value = readArg(name) ?? process.env[envName]?.trim();
  if (!value) {
    throw new Error(`Missing required argument --${name} or environment variable ${envName}.`);
  }
  return value;
}

function readOptional(name: string, envName: string): string | null {
  const value = readArg(name) ?? process.env[envName]?.trim() ?? null;
  return value && value.length > 0 ? value : null;
}

function splitCsv(value: string | null, fallback: readonly string[]): string[] {
  if (!value) {
    return [...fallback];
  }
  return Array.from(
    new Set(
      value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );
}

function normalizeEnvironment(value: string | null): HbceApiCredentialEnvironment {
  const normalized = (value ?? "B2G_PILOT").trim().toUpperCase();
  if (normalized === "SELF_PILOT") return "SELF_PILOT";
  if (normalized === "DEMO") return "DEMO";
  if (normalized === "B2G_PILOT") return "B2G_PILOT";
  if (normalized === "PRODUCTION") return "PRODUCTION";
  throw new Error(`Unsupported environment: ${value}`);
}

function normalizeCredentialKind(value: string | null): HbceApiCredentialKind {
  const normalized = (value ?? "API_KEY").trim().toUpperCase();
  if (normalized === "API_KEY") return "API_KEY";
  if (normalized === "BEARER_TOKEN") return "BEARER_TOKEN";
  throw new Error(`Unsupported credential type: ${value}`);
}

function addDaysIso(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

function makeId(prefix: string): string {
  const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const suffix = randomBytes(4).toString("hex").toUpperCase();
  return `${prefix}-${timestamp}-${suffix}`;
}

function parseArgs(): ParsedArgs {
  const tenantId = readRequired("tenantId", "HBCE_API_CREDENTIAL_TENANT_ID");
  const workspaceId = readRequired("workspaceId", "HBCE_API_CREDENTIAL_WORKSPACE_ID");
  const credentialId = readOptional("credentialId", "HBCE_API_CREDENTIAL_ID") ?? makeId("APIKEY");
  const apiKeyId = readOptional("apiKeyId", "HBCE_API_KEY_ID") ?? credentialId;
  const keyId = readOptional("keyId", "HBCE_API_KEY_PUBLIC_ID") ?? credentialId;
  const expiresAt = readOptional("expiresAt", "HBCE_API_CREDENTIAL_EXPIRES_AT") ?? addDaysIso(90);

  return {
    tenantId,
    workspaceId,
    accountId: readOptional("accountId", "HBCE_API_CREDENTIAL_ACCOUNT_ID"),
    subscriptionId: readOptional("subscriptionId", "HBCE_API_CREDENTIAL_SUBSCRIPTION_ID"),
    credentialId,
    apiKeyId,
    keyId,
    credentialType: normalizeCredentialKind(readOptional("credentialType", "HBCE_API_CREDENTIAL_TYPE")),
    environment: normalizeEnvironment(readOptional("environment", "HBCE_API_CREDENTIAL_ENVIRONMENT")),
    rateLimitProfileId:
      readOptional("rateLimitProfileId", "HBCE_API_CREDENTIAL_RATE_LIMIT_PROFILE_ID") ?? "B2G_PILOT_STANDARD",
    expiresAt,
    scopes: splitCsv(readOptional("scopes", "HBCE_API_CREDENTIAL_SCOPES"), DEFAULT_SCOPES),
    allowedEndpoints: splitCsv(
      readOptional("allowedEndpoints", "HBCE_API_CREDENTIAL_ALLOWED_ENDPOINTS"),
      DEFAULT_ALLOWED_ENDPOINTS
    ),
    allowedSourceSets: splitCsv(
      readOptional("allowedSourceSets", "HBCE_API_CREDENTIAL_ALLOWED_SOURCESETS"),
      DEFAULT_ALLOWED_SOURCE_SETS
    ),
    dryRun: hasFlag("dryRun")
  };
}

function assertSafePilotInput(args: ParsedArgs): void {
  if (args.environment !== "SELF_PILOT" && args.tenantId === "HBCE-TENANT-SELF-PILOT") {
    throw new Error("External/demo/pilot credentials must not use HBCE-TENANT-SELF-PILOT.");
  }

  if (args.environment !== "SELF_PILOT" && args.workspaceId === "HBCE-WORKSPACE-RND") {
    throw new Error("External/demo/pilot credentials must not use HBCE-WORKSPACE-RND.");
  }

  if (args.scopes.includes("admin:tenants:manage") || args.scopes.includes("admin:credentials:manage")) {
    throw new Error("Admin scopes must not be seeded by this pilot credential script.");
  }
}

async function insertCredential(args: ParsedArgs, secret: ReturnType<typeof createHbceApiCredentialSecret>): Promise<void> {
  await queryHbceDatabase(
    `
      INSERT INTO hbce_api_credentials (
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
        legal_certification
      ) VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        'ACTIVE',
        $9,
        $10,
        $11,
        $12,
        $13::jsonb,
        $14::jsonb,
        $15::jsonb,
        $16,
        $17,
        false
      )
    `,
    [
      args.apiKeyId,
      args.credentialId,
      args.keyId,
      secret.keyPrefix,
      secret.secretHash,
      secret.secretLast4,
      args.credentialType,
      args.environment,
      args.tenantId,
      args.workspaceId,
      args.accountId,
      args.subscriptionId,
      JSON.stringify(args.scopes),
      JSON.stringify(args.allowedEndpoints),
      JSON.stringify(args.allowedSourceSets),
      args.rateLimitProfileId,
      args.expiresAt
    ]
  );
}

function buildOutput(args: ParsedArgs, secret: ReturnType<typeof createHbceApiCredentialSecret>, inserted: boolean) {
  return {
    status: inserted ? "HBCE_API_CREDENTIAL_CREATED" : "HBCE_API_CREDENTIAL_DRY_RUN_READY",
    scriptRevision: SCRIPT_REVISION,
    apiAuthRevision: HBCE_API_AUTH_REVISION,
    credential: {
      credentialId: args.credentialId,
      apiKeyId: args.apiKeyId,
      keyId: args.keyId,
      credentialType: args.credentialType,
      environment: args.environment,
      status: "ACTIVE",
      tenantId: args.tenantId,
      workspaceId: args.workspaceId,
      accountId: args.accountId,
      subscriptionId: args.subscriptionId,
      scopes: args.scopes,
      allowedEndpoints: args.allowedEndpoints,
      allowedSourceSets: args.allowedSourceSets,
      rateLimitProfileId: args.rateLimitProfileId,
      expiresAt: args.expiresAt,
      keyPrefix: secret.keyPrefix,
      secretLast4: secret.secretLast4
    },
    secretOneTimeDisplay: {
      rawSecret: secret.rawSecret,
      warning: "Store this secret now. It is intended to be shown only once and must not be committed."
    },
    boundary: HBCE_API_AUTH_BOUNDARY,
    legalCertification: false
  };
}

async function main(): Promise<void> {
  const args = parseArgs();
  assertSafePilotInput(args);

  const secretPrefix = args.credentialType === "BEARER_TOKEN" ? "hbce_bearer" : "hbce_pilot";
  const secret = createHbceApiCredentialSecret(secretPrefix);

  if (!args.dryRun) {
    await insertCredential(args, secret);
  }

  console.log(JSON.stringify(buildOutput(args, secret, !args.dryRun), null, 2));
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown credential creation error.";
  console.error(
    JSON.stringify(
      {
        status: "HBCE_API_CREDENTIAL_CREATE_FAILED",
        scriptRevision: SCRIPT_REVISION,
        message,
        boundary: HBCE_API_AUTH_BOUNDARY,
        legalCertification: false
      },
      null,
      2
    )
  );
  process.exit(1);
});
