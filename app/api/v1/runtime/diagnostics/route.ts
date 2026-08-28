import { NextRequest, NextResponse } from "next/server";

import {
  resolveIprAccountSessionFromRequestAsync
} from "@/lib/ipr-auth-session-resolver";

import {
  inspectIprDatabasePhysicalSchema
} from "@/lib/ipr-database-physical-proof";

import {
  inspectIprAuthRateLimitPhysicalSchema
} from "@/lib/ipr-auth-rate-limit-physical-proof";

import {
  IPR_AUTH_RATE_LIMIT_BOUNDARY,
  getDefaultIprAuthRateLimitStore,
  resolveIprAuthRateLimitClientIp
} from "@/lib/ipr-auth-rate-limit-store";

import {
  describeDefaultHbceDatabase,
  getHbceDatabaseBoundary,
  isHbceDatabaseConfigured,
  queryHbceDatabase,
  queryHbceDatabaseWithoutSchemaInitialization,
} from "@/lib/ipr-database";

import {
  HBCE_DATABASE_SCHEMA_TABLES,
  HBCE_DATABASE_SCHEMA_VERSION,
  getHbceDatabaseSchemaDefinition,
  getHbceDatabaseTableNames,
} from "@/lib/ipr-database-schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

type DiagnosticStatus = "PASS" | "WARN" | "FAIL";

type DiagnosticCheck = {
  id: string;
  label: string;
  required: boolean;
  status: DiagnosticStatus;
  durationMs: number;
  details: Record<string, unknown>;
  error: string | null;
};

type DatabaseIdentityRow = {
  database_name?: unknown;
  database_user?: unknown;
  database_schema?: unknown;
  server_version?: unknown;
  server_time?: unknown;
};

type ExistingTableRow = {
  table_name?: unknown;
};

type AuthLoginGovernanceRow = {
  human_ipr?: unknown;
  failed_attempts?: unknown;
  locked_until?: unknown;
  password_last_verified_at?: unknown;
  legal_certification?: unknown;
};

const REVISION = "HBCE-RUNTIME-DIAGNOSTICS-v1_1";
const PRODUCT = "HBCE IPR Operational Identity & Proof Layer";
const API_VERSION = "v1";
const RUNTIME_NAME = "AI_JOKER_C2_SAAS_CORE_v0_1";

function nowMs(): number {
  return Date.now();
}

function elapsedMs(startedAt: number): number {
  return Math.max(0, Date.now() - startedAt);
}

function normalizeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return "UNKNOWN_ERROR";
  }
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

function getRequestOrigin(request: NextRequest): string {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost ?? request.headers.get("host");

  if (host) {
    return `${forwardedProto ?? "https"}://${host}`;
  }

  return request.nextUrl.origin;
}

function createCheck(input: {
  id: string;
  label: string;
  required: boolean;
  status: DiagnosticStatus;
  durationMs: number;
  details?: Record<string, unknown>;
  error?: string | null;
}): DiagnosticCheck {
  return {
    id: input.id,
    label: input.label,
    required: input.required,
    status: input.status,
    durationMs: input.durationMs,
    details: input.details ?? {},
    error: input.error ?? null,
  };
}

async function inspectDatabaseConfiguration(): Promise<DiagnosticCheck> {
  const startedAt = nowMs();

  try {
    const configured = isHbceDatabaseConfigured();
    const description = describeDefaultHbceDatabase();
    const boundary = getHbceDatabaseBoundary();

    return createCheck({
      id: "DATABASE_CONFIGURATION",
      label: "HBCE database configuration",
      required: true,
      status: configured ? "PASS" : "FAIL",
      durationMs: elapsedMs(startedAt),
      details: {
        configured,
        available: description.available,
        kind: description.kind,
        driver: description.driver,
        mode: description.mode,
        status: description.status,
        databaseUrlPresent: description.databaseUrlPresent,
        schemaVersion: description.schemaVersion,
        persistenceMode: description.persistenceMode,
        boundary,
      },
      error: configured ? null : "DATABASE_URL_NOT_CONFIGURED",
    });
  } catch (error) {
    return createCheck({
      id: "DATABASE_CONFIGURATION",
      label: "HBCE database configuration",
      required: true,
      status: "FAIL",
      durationMs: elapsedMs(startedAt),
      error: normalizeError(error),
    });
  }
}

async function inspectDatabaseConnection(): Promise<DiagnosticCheck> {
  const startedAt = nowMs();

  try {
    const result = await queryHbceDatabase<DatabaseIdentityRow>(
      `
        SELECT
          current_database() AS database_name,
          current_user AS database_user,
          current_schema() AS database_schema,
          current_setting('server_version') AS server_version,
          CURRENT_TIMESTAMP::text AS server_time
      `,
    );

    const row = result.rows[0] ?? {};

    return createCheck({
      id: "DATABASE_CONNECTION",
      label: "Neon/Postgres read-only connection",
      required: true,
      status: result.ok ? "PASS" : "FAIL",
      durationMs: elapsedMs(startedAt),
      details: {
        queryStatus: result.status,
        rowCount: result.rowCount,
        queryDurationMs: result.durationMs,
        sqlHash: result.sqlHash,
        databaseName: stringOrNull(row.database_name),
        databaseUser: stringOrNull(row.database_user),
        databaseSchema: stringOrNull(row.database_schema),
        serverVersion: stringOrNull(row.server_version),
        serverTime: stringOrNull(row.server_time),
      },
      error: result.error,
    });
  } catch (error) {
    return createCheck({
      id: "DATABASE_CONNECTION",
      label: "Neon/Postgres read-only connection",
      required: true,
      status: "FAIL",
      durationMs: elapsedMs(startedAt),
      error: normalizeError(error),
    });
  }
}

async function inspectDatabaseSchema(): Promise<DiagnosticCheck> {
  const startedAt = nowMs();

  try {
    const canonicalTables = getHbceDatabaseTableNames();

    /*
     * Non passiamo la lista delle tabelle come array PostgreSQL.
     *
     * Il wrapper queryHbceDatabase può serializzare gli array JavaScript
     * come JSON testuale. PostgreSQL, invece, per un text[] si aspetta
     * una sintassi array nativa.
     *
     * Leggiamo quindi tutte le tabelle dello schema corrente e facciamo
     * il confronto localmente in TypeScript.
     */
    const result = await queryHbceDatabase<ExistingTableRow>(
      `
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = current_schema()
          AND table_type = 'BASE TABLE'
        ORDER BY table_name ASC
      `,
    );

    const allExistingTables = result.rows
      .map((row) => stringOrNull(row.table_name))
      .filter((value): value is string => Boolean(value));

    const allExistingTableSet = new Set<string>(allExistingTables);
    const canonicalTableSet = new Set<string>(canonicalTables);

    const existingCanonicalTables = canonicalTables.filter((tableName) =>
      allExistingTableSet.has(tableName),
    );

    const missingTables = canonicalTables.filter(
      (tableName) => !allExistingTableSet.has(tableName),
    );

    const additionalTables = allExistingTables.filter(
      (tableName) => !canonicalTableSet.has(tableName),
    );

    let status: DiagnosticStatus = "FAIL";

    if (result.ok && missingTables.length === 0) {
      status = "PASS";
    } else if (result.ok && existingCanonicalTables.length > 0) {
      status = "WARN";
    }

    return createCheck({
      id: "DATABASE_SCHEMA",
      label: "Canonical HBCE database schema",
      required: true,
      status,
      durationMs: elapsedMs(startedAt),
      details: {
        expectedSchemaVersion: HBCE_DATABASE_SCHEMA_VERSION,
        expectedTableCount: canonicalTables.length,
        databaseTableCount: allExistingTables.length,
        existingCanonicalTableCount: existingCanonicalTables.length,
        missingTableCount: missingTables.length,
        additionalTableCount: additionalTables.length,
        existingCanonicalTables,
        missingTables,
        additionalTables,
        queryStatus: result.status,
        queryDurationMs: result.durationMs,
        sqlHash: result.sqlHash,
      },
      error:
        result.error ??
        (missingTables.length > 0
          ? `MISSING_CANONICAL_TABLES:${missingTables.join(",")}`
          : null),
    });
  } catch (error) {
    return createCheck({
      id: "DATABASE_SCHEMA",
      label: "Canonical HBCE database schema",
      required: true,
      status: "FAIL",
      durationMs: elapsedMs(startedAt),
      error: normalizeError(error),
    });
  }
}

function inspectSchemaContract(): DiagnosticCheck {
  const startedAt = nowMs();

  try {
    const schema = getHbceDatabaseSchemaDefinition();
    const canonicalTables = getHbceDatabaseTableNames();

    const uniqueTables = new Set<string>(canonicalTables);

    const hasValidVersion =
      typeof schema.version === "string" &&
      schema.version === HBCE_DATABASE_SCHEMA_VERSION;

    const hasExpectedTables =
      canonicalTables.length === HBCE_DATABASE_SCHEMA_TABLES.length &&
      uniqueTables.size === canonicalTables.length;

    const hasMemoryLayer =
      uniqueTables.has("ipr_chat_memory_saves") &&
      uniqueTables.has("memory_records") &&
      uniqueTables.has("memory_registered_events");

    const hasEvidenceLayer =
      uniqueTables.has("evt_records") &&
      uniqueTables.has("opc_proofs") &&
      uniqueTables.has("runtime_audit_logs");

    const hasModelUsageLayer = uniqueTables.has("model_usage");

    const valid =
      hasValidVersion &&
      hasExpectedTables &&
      hasMemoryLayer &&
      hasEvidenceLayer &&
      hasModelUsageLayer;

    return createCheck({
      id: "SCHEMA_CONTRACT",
      label: "Static HBCE schema contract",
      required: true,
      status: valid ? "PASS" : "FAIL",
      durationMs: elapsedMs(startedAt),
      details: {
        schemaVersion: schema.version,
        persistenceMode: schema.persistenceMode,
        canonicalTableCount: canonicalTables.length,
        uniqueTableCount: uniqueTables.size,
        hasMemoryLayer,
        hasEvidenceLayer,
        hasModelUsageLayer,
        legalCertificationBoundary: schema.legalCertificationBoundary,
      },
      error: valid ? null : "HBCE_SCHEMA_CONTRACT_INVALID",
    });
  } catch (error) {
    return createCheck({
      id: "SCHEMA_CONTRACT",
      label: "Static HBCE schema contract",
      required: true,
      status: "FAIL",
      durationMs: elapsedMs(startedAt),
      error: normalizeError(error),
    });
  }
}

function inspectRuntimeEnvironment(request: NextRequest): DiagnosticCheck {
  const startedAt = nowMs();

  try {
    const origin = getRequestOrigin(request);
    const nodeVersion = process.version;

    const runtimeEnvironment =
      process.env.VERCEL_ENV ??
      process.env.NODE_ENV ??
      "unknown";

    const vercelRegion =
      process.env.VERCEL_REGION ??
      process.env.AWS_REGION ??
      null;

    const valid =
      typeof origin === "string" &&
      origin.length > 0 &&
      typeof nodeVersion === "string" &&
      nodeVersion.length > 0;

    return createCheck({
      id: "RUNTIME_ENVIRONMENT",
      label: "Runtime deployment environment",
      required: true,
      status: valid ? "PASS" : "FAIL",
      durationMs: elapsedMs(startedAt),
      details: {
        origin,
        runtimeEnvironment,
        vercelEnvironment: process.env.VERCEL_ENV ?? null,
        vercelRegion,
        nodeVersion,
        nextRuntime: "nodejs",
      },
      error: valid ? null : "RUNTIME_ENVIRONMENT_UNRESOLVED",
    });
  } catch (error) {
    return createCheck({
      id: "RUNTIME_ENVIRONMENT",
      label: "Runtime deployment environment",
      required: true,
      status: "FAIL",
      durationMs: elapsedMs(startedAt),
      error: normalizeError(error),
    });
  }
}

function calculateOperationalStatus(
  checks: DiagnosticCheck[],
): DiagnosticStatus {
  const requiredChecks = checks.filter((check) => check.required);

  if (requiredChecks.some((check) => check.status === "FAIL")) {
    return "FAIL";
  }

  if (checks.some((check) => check.status === "WARN")) {
    return "WARN";
  }

  return "PASS";
}

function buildSummary(checks: DiagnosticCheck[], durationMs: number) {
  const requiredChecks = checks.filter((check) => check.required);
  const optionalChecks = checks.filter((check) => !check.required);

  return {
    totalChecks: checks.length,
    passedChecks: checks.filter((check) => check.status === "PASS").length,
    warningChecks: checks.filter((check) => check.status === "WARN").length,
    failedChecks: checks.filter((check) => check.status === "FAIL").length,
    requiredChecks: requiredChecks.length,
    requiredPassed: requiredChecks.filter(
      (check) => check.status === "PASS",
    ).length,
    requiredWarnings: requiredChecks.filter(
      (check) => check.status === "WARN",
    ).length,
    requiredFailed: requiredChecks.filter(
      (check) => check.status === "FAIL",
    ).length,
    optionalChecks: optionalChecks.length,
    optionalFailed: optionalChecks.filter(
      (check) => check.status === "FAIL",
    ).length,
    durationMs,
  };
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const sessionResolution =
    await resolveIprAccountSessionFromRequestAsync(request);

  if (!sessionResolution.runtimeAuthorized) {
    return NextResponse.json(
      {
        ok: false,
        reason: "AUTHENTICATION_REQUIRED",
        legalCertification: false
      },
      {
        status: 401,
        headers: {
          "Cache-Control": "no-store, max-age=0"
        }
      }
    );
  }

  const diagnosticMode =
    request.nextUrl.searchParams.get("mode");

  const diagnosticModeSupported =
    diagnosticMode === null ||
    diagnosticMode === "physical-schema-proof" ||
    diagnosticMode === "auth-rate-limit-physical-schema-proof" ||
    diagnosticMode === "auth-rate-limit-runtime-proof" ||
    diagnosticMode === "auth-login-governance-proof";

  if (!diagnosticModeSupported) {
    return NextResponse.json(
      {
        ok: false,
        reason: "UNSUPPORTED_DIAGNOSTIC_MODE",
        supportedModes: [
          "physical-schema-proof",
          "auth-rate-limit-physical-schema-proof",
          "auth-rate-limit-runtime-proof",
          "auth-login-governance-proof"
        ],
        legalCertification: false
      },
      {
        status: 400,
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0"
        }
      }
    );
  }

  if (diagnosticMode === "physical-schema-proof") {
    /*
     * Il selettore sceglie esclusivamente quale diagnostica
     * autenticata eseguire.
     *
     * Non attribuisce identità, sessione, capability o
     * autorità runtime.
     *
     * Questo ramo deve terminare prima del percorso legacy,
     * così nessuna query AUTO_SCHEMA_COMPATIBLE viene eseguita
     * prima della prova fisica strict NO_AUTO_SCHEMA.
     */
    if (request.method !== "GET") {
      return NextResponse.json(
        {
          ok: false,
          reason:
            "PHYSICAL_SCHEMA_PROOF_GET_REQUIRED",
          legalCertification: false
        },
        {
          status: 405,
          headers: {
            Allow: "GET",
            "Cache-Control":
              "no-store, no-cache, must-revalidate, proxy-revalidate",
            Pragma: "no-cache",
            Expires: "0"
          }
        }
      );
    }

    const proof =
      await inspectIprDatabasePhysicalSchema();

    return NextResponse.json(
      {
        ok: proof.ok,
        status: proof.status,
        mode: "PHYSICAL_SCHEMA_PROOF",
        revision: proof.revision,
        generatedAt: proof.checkedAt,
        product: PRODUCT,
        apiVersion: API_VERSION,
        runtime: RUNTIME_NAME,
        proof,
        boundary: {
          authority:
            "PHYSICAL_SCHEMA_EVIDENCE_ONLY",
          selectorAuthority: "NONE",
          performsDatabaseRead: true,
          performsDatabaseMutation: false,
          performsSchemaMutation: false,
          sessionCreated: false,
          runtimeAuthorizationChanged: false,
          legalCertification: false
        }
      },
      {
        status: proof.ok ? 200 : 503,
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
          "X-HBCE-Diagnostics-Mode":
            "physical-schema-proof",
          "X-HBCE-Operational-Status":
            proof.ok ? "PASS" : "FAIL"
        }
      }
    );
  }

  if (
    diagnosticMode ===
    "auth-rate-limit-physical-schema-proof"
  ) {
    /*
     * C5X physical schema proof.
     *
     * Read-only and strict NO_AUTO_SCHEMA.
     * It proves only the physical persistence contract for
     * authentication rate-limit buckets introduced by
     * HBCE-IPR-DB-v1.12.
     *
     * It does not expose bucket hashes, IP addresses,
     * Human IPR values or user-agent data.
     *
     * It does not mutate schema or data and cannot create
     * sessions, authorize runtime execution or bypass
     * credential verification.
     */
    if (request.method !== "GET") {
      return NextResponse.json(
        {
          ok: false,
          reason:
            "AUTH_RATE_LIMIT_PHYSICAL_SCHEMA_PROOF_GET_REQUIRED",
          legalCertification: false
        },
        {
          status: 405,
          headers: {
            Allow: "GET",
            "Cache-Control":
              "no-store, no-cache, must-revalidate, proxy-revalidate",
            Pragma: "no-cache",
            Expires: "0"
          }
        }
      );
    }

    const proof =
      await inspectIprAuthRateLimitPhysicalSchema();

    return NextResponse.json(
      {
        ok: proof.ok,
        status: proof.status,
        mode:
          "AUTH_RATE_LIMIT_PHYSICAL_SCHEMA_PROOF",
        revision: proof.revision,
        generatedAt: proof.checkedAt,
        product: PRODUCT,
        apiVersion: API_VERSION,
        runtime: RUNTIME_NAME,
        proof,
        boundary: {
          authority:
            "AUTH_RATE_LIMIT_PHYSICAL_SCHEMA_EVIDENCE_ONLY",
          selectorAuthority: "NONE",
          performsDatabaseRead: true,
          performsDatabaseMutation: false,
          performsSchemaMutation: false,
          sessionCreated: false,
          runtimeAuthorizationChanged: false,
          credentialBypass: false,
          rawIpRead: false,
          rawHumanIprRead: false,
          rawUserAgentRead: false,
          legalCertification: false
        }
      },
      {
        status: proof.ok ? 200 : 503,
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
          "X-HBCE-Diagnostics-Mode":
            "auth-rate-limit-physical-schema-proof",
          "X-HBCE-Operational-Status":
            proof.ok ? "PASS" : "FAIL"
        }
      }
    );
  }

  if (
    diagnosticMode ===
    "auth-rate-limit-runtime-proof"
  ) {
    /*
     * C5X authenticated runtime proof.
     *
     * Scope:
     * - current authenticated session only;
     * - current request network source only;
     * - persistent C5X bucket state read-only;
     * - strict NO_AUTO_SCHEMA through the rate-limit store.
     *
     * Privacy:
     * - no raw IP in response;
     * - no Human IPR in response;
     * - no HMAC bucket key in response;
     * - no user-agent data in response.
     *
     * Authority:
     * - cannot create sessions;
     * - cannot modify rate-limit state;
     * - cannot authorize runtime execution;
     * - cannot bypass credentials.
     */

    const humanIpr =
      sessionResolution.session?.humanIpr ||
      sessionResolution.access.humanIpr ||
      "";

    if (!humanIpr) {
      return NextResponse.json(
        {
          ok: false,
          status: "FAIL",
          mode:
            "AUTH_RATE_LIMIT_RUNTIME_PROOF",
          reason:
            "AUTHENTICATED_HUMAN_IPR_UNRESOLVED",
          legalCertification: false
        },
        {
          status: 409,
          headers: {
            "Cache-Control":
              "no-store, no-cache, must-revalidate, proxy-revalidate",
            Pragma: "no-cache",
            Expires: "0"
          }
        }
      );
    }

    const clientIp =
      resolveIprAuthRateLimitClientIp(
        request.headers
      );

    if (!clientIp) {
      return NextResponse.json(
        {
          ok: false,
          status: "FAIL",
          mode:
            "AUTH_RATE_LIMIT_RUNTIME_PROOF",
          reason:
            "AUTH_RATE_LIMIT_CLIENT_IP_UNRESOLVED",
          legalCertification: false
        },
        {
          status: 503,
          headers: {
            "Cache-Control":
              "no-store, no-cache, must-revalidate, proxy-revalidate",
            Pragma: "no-cache",
            Expires: "0"
          }
        }
      );
    }

    try {
      const store =
        getDefaultIprAuthRateLimitStore();

      const state =
        await store.inspectAsync({
          humanIpr,
          clientIp
        });

      const serializeBucket = (
        bucket:
          typeof state.ip
      ) => {
        if (!bucket) {
          return {
            present: false,
            failedAttempts: 0,
            windowStartedAt: null,
            lastFailedAt: null,
            blockedUntil: null,
            currentlyBlocked: false,
            legalCertification: false
          };
        }

        return {
          present: true,
          failedAttempts:
            bucket.failedAttempts,
          windowStartedAt:
            bucket.windowStartedAt,
          lastFailedAt:
            bucket.lastFailedAt,
          blockedUntil:
            bucket.blockedUntil,
          currentlyBlocked:
            bucket.currentlyBlocked,
          legalCertification: false
        };
      };

      return NextResponse.json(
        {
          ok: true,
          status: "PASS",
          mode:
            "AUTH_RATE_LIMIT_RUNTIME_PROOF",
          revision:
            "HBCE-AUTH-RATE-LIMIT-RUNTIME-PROOF-v1_0",
          generatedAt:
            new Date().toISOString(),

          operationalState:
            state.blocked
              ? "THROTTLED"
              : "AVAILABLE",

          proof: {
            blocked:
              state.blocked,

            blockedKinds:
              state.blockedKinds,

            blockedUntil:
              state.blockedUntil,

            globalIp:
              serializeBucket(
                state.ip
              ),

            authenticatedPair:
              serializeBucket(
                state.iprIp
              ),

            policy: {
              globalIp:
                IPR_AUTH_RATE_LIMIT_BOUNDARY
                  .ipPolicy,

              authenticatedPair:
                IPR_AUTH_RATE_LIMIT_BOUNDARY
                  .iprIpPolicy,

              globalIpResetOnSuccessfulLogin:
                false,

              authenticatedPairResetOnSuccessfulLogin:
                true
            },

            databaseReadOnly: true,
            autoSchema:
              "NO_AUTO_SCHEMA",
            legalCertification: false
          },

          boundary: {
            authority:
              "AUTHENTICATED_C5X_RUNTIME_EVIDENCE_ONLY",

            authenticatedSessionRequired:
              true,

            clientHumanIprAccepted:
              false,

            clientIpAcceptedFromBody:
              false,

            currentRequestNetworkSourceOnly:
              true,

            performsDatabaseRead:
              true,

            performsDatabaseMutation:
              false,

            performsSchemaMutation:
              false,

            rateLimitStateMutation:
              false,

            rawIpExposed:
              false,

            rawHumanIprExposed:
              false,

            bucketHashExposed:
              false,

            rawUserAgentExposed:
              false,

            credentialSecretsExposed:
              false,

            sessionCreated:
              false,

            runtimeAuthorizationChanged:
              false,

            credentialBypass:
              false,

            legalCertification:
              false
          },

          legalCertification: false
        },
        {
          status: 200,
          headers: {
            "Cache-Control":
              "no-store, no-cache, must-revalidate, proxy-revalidate",
            Pragma: "no-cache",
            Expires: "0",

            "X-HBCE-Diagnostics-Mode":
              "auth-rate-limit-runtime-proof",

            "X-HBCE-Operational-Status":
              "PASS"
          }
        }
      );
    } catch {
      /*
       * Fail closed.
       *
       * Do not expose database errors, HMAC secret status,
       * bucket keys or internal derivation details.
       */
      return NextResponse.json(
        {
          ok: false,
          status: "FAIL",
          mode:
            "AUTH_RATE_LIMIT_RUNTIME_PROOF",
          reason:
            "AUTH_RATE_LIMIT_RUNTIME_PROOF_UNAVAILABLE",
          legalCertification: false
        },
        {
          status: 503,
          headers: {
            "Cache-Control":
              "no-store, no-cache, must-revalidate, proxy-revalidate",
            Pragma: "no-cache",
            Expires: "0",

            "X-HBCE-Diagnostics-Mode":
              "auth-rate-limit-runtime-proof",

            "X-HBCE-Operational-Status":
              "FAIL"
          }
        }
      );
    }
  }

  if (diagnosticMode === "auth-login-governance-proof") {
    const humanIpr =
      sessionResolution.session?.humanIpr ||
      sessionResolution.access.humanIpr ||
      "";

    if (!humanIpr) {
      return NextResponse.json(
        {
          ok: false,
          reason: "AUTHENTICATED_HUMAN_IPR_UNRESOLVED",
          legalCertification: false
        },
        {
          status: 409,
          headers: {
            "Cache-Control":
              "no-store, no-cache, must-revalidate, proxy-revalidate",
            Pragma: "no-cache",
            Expires: "0"
          }
        }
      );
    }

    const result =
      await queryHbceDatabaseWithoutSchemaInitialization<AuthLoginGovernanceRow>(
        `
SELECT
  human_ipr,
  failed_attempts,
  locked_until::text AS locked_until,
  password_last_verified_at::text AS password_last_verified_at,
  legal_certification
FROM ipr_auth_credentials
WHERE human_ipr = $1
LIMIT 1
        `.trim(),
        [humanIpr]
      );

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          status: "FAIL",
          mode: "AUTH_LOGIN_GOVERNANCE_PROOF",
          reason: "AUTH_LOGIN_GOVERNANCE_QUERY_FAILED",
          queryStatus: result.status,
          sqlHash: result.sqlHash,
          legalCertification: false
        },
        {
          status: 503,
          headers: {
            "Cache-Control":
              "no-store, no-cache, must-revalidate, proxy-revalidate",
            Pragma: "no-cache",
            Expires: "0"
          }
        }
      );
    }

    const row = result.rows[0];

    if (!row) {
      return NextResponse.json(
        {
          ok: false,
          status: "FAIL",
          mode: "AUTH_LOGIN_GOVERNANCE_PROOF",
          reason: "AUTH_LOGIN_CREDENTIAL_ROW_NOT_FOUND",
          humanIpr,
          legalCertification: false
        },
        {
          status: 409,
          headers: {
            "Cache-Control":
              "no-store, no-cache, must-revalidate, proxy-revalidate",
            Pragma: "no-cache",
            Expires: "0"
          }
        }
      );
    }

    const failedAttempts =
      Number(row.failed_attempts || 0);

    const lockedUntil =
      stringOrNull(row.locked_until);

    const passwordLastVerifiedAt =
      stringOrNull(row.password_last_verified_at);

    const lockedUntilMs =
      lockedUntil
        ? Date.parse(lockedUntil)
        : Number.NaN;

    const currentlyLocked =
      Number.isFinite(lockedUntilMs) &&
      lockedUntilMs > Date.now();

    return NextResponse.json(
      {
        ok: true,
        status: "PASS",
        mode: "AUTH_LOGIN_GOVERNANCE_PROOF",
        revision:
          "HBCE-AUTH-LOGIN-GOVERNANCE-PROOF-v1_0",
        generatedAt: new Date().toISOString(),
        humanIpr,
        proof: {
          failedAttempts,
          lockedUntil,
          currentlyLocked,
          passwordLastVerifiedAt,
          databaseReadOnly: true,
          autoSchema: "NO_AUTO_SCHEMA",
          legalCertification: false
        },
        boundary: {
          authority:
            "AUTHENTICATED_SESSION_BOUND_IPR_ONLY",
          clientHumanIprAccepted: false,
          performsDatabaseRead: true,
          performsDatabaseMutation: false,
          performsSchemaMutation: false,
          credentialSecretsExposed: false,
          sessionCreated: false,
          runtimeAuthorizationChanged: false,
          legalCertification: false
        },
        legalCertification: false
      },
      {
        status: 200,
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
          "X-HBCE-Diagnostics-Mode":
            "auth-login-governance-proof",
          "X-HBCE-Operational-Status": "PASS"
        }
      }
    );
  }

  const startedAt = nowMs();
  const generatedAt = new Date().toISOString();

  const runtimeEnvironmentCheck = inspectRuntimeEnvironment(request);
  const schemaContractCheck = inspectSchemaContract();

  const databaseConfigurationCheck =
    await inspectDatabaseConfiguration();

  let databaseConnectionCheck: DiagnosticCheck;
  let databaseSchemaCheck: DiagnosticCheck;

  if (databaseConfigurationCheck.status === "FAIL") {
    databaseConnectionCheck = createCheck({
      id: "DATABASE_CONNECTION",
      label: "Neon/Postgres read-only connection",
      required: true,
      status: "FAIL",
      durationMs: 0,
      details: {
        skipped: true,
        reason: "DATABASE_NOT_CONFIGURED",
      },
      error: "DATABASE_CONNECTION_CHECK_SKIPPED",
    });

    databaseSchemaCheck = createCheck({
      id: "DATABASE_SCHEMA",
      label: "Canonical HBCE database schema",
      required: true,
      status: "FAIL",
      durationMs: 0,
      details: {
        skipped: true,
        reason: "DATABASE_NOT_CONFIGURED",
      },
      error: "DATABASE_SCHEMA_CHECK_SKIPPED",
    });
  } else {
    /*
     * Esecuzione sequenziale.
     *
     * La prima richiesta può riattivare un'istanza Neon sospesa.
     * Eseguire le query in parallelo può duplicare il ritardo di cold start.
     */
    databaseConnectionCheck = await inspectDatabaseConnection();

    if (databaseConnectionCheck.status === "FAIL") {
      databaseSchemaCheck = createCheck({
        id: "DATABASE_SCHEMA",
        label: "Canonical HBCE database schema",
        required: true,
        status: "FAIL",
        durationMs: 0,
        details: {
          skipped: true,
          reason: "DATABASE_CONNECTION_FAILED",
        },
        error: "DATABASE_SCHEMA_CHECK_SKIPPED",
      });
    } else {
      databaseSchemaCheck = await inspectDatabaseSchema();
    }
  }

  const checks: DiagnosticCheck[] = [
    runtimeEnvironmentCheck,
    schemaContractCheck,
    databaseConfigurationCheck,
    databaseConnectionCheck,
    databaseSchemaCheck,
  ];

  const durationMs = elapsedMs(startedAt);
  const operationalStatus = calculateOperationalStatus(checks);
  const ok = operationalStatus !== "FAIL";

  const responseBody = {
    ok,
    status:
      operationalStatus === "PASS"
        ? "HBCE_RUNTIME_DIAGNOSTICS_PASS"
        : operationalStatus === "WARN"
          ? "HBCE_RUNTIME_DIAGNOSTICS_WARN"
          : "HBCE_RUNTIME_DIAGNOSTICS_FAIL",
    operationalStatus,
    revision: REVISION,
    generatedAt,
    product: PRODUCT,
    apiVersion: API_VERSION,
    runtime: RUNTIME_NAME,
    deployment: {
      origin: getRequestOrigin(request),
      runtimeEnvironment:
        process.env.VERCEL_ENV ??
        process.env.NODE_ENV ??
        "unknown",
      vercelEnvironment: process.env.VERCEL_ENV ?? null,
      vercelRegion:
        process.env.VERCEL_REGION ??
        process.env.AWS_REGION ??
        null,
      nodeVersion: process.version,
    },
    summary: buildSummary(checks, durationMs),
    checks,
    layers: {
      runtime: runtimeEnvironmentCheck.status,
      databaseConfiguration: databaseConfigurationCheck.status,
      databaseConnection: databaseConnectionCheck.status,
      schemaContract: schemaContractCheck.status,
      databaseSchema: databaseSchemaCheck.status,
      memoryContract:
        schemaContractCheck.details.hasMemoryLayer === true
          ? "PASS"
          : "FAIL",
      evidenceContract:
        schemaContractCheck.details.hasEvidenceLayer === true
          ? "PASS"
          : "FAIL",
      modelUsageContract:
        schemaContractCheck.details.hasModelUsageLayer === true
          ? "PASS"
          : "FAIL",
    },
    interpretation: {
      runtimeEnvironmentResolved:
        runtimeEnvironmentCheck.status === "PASS",
      databaseConfigured:
        databaseConfigurationCheck.status === "PASS",
      databaseReachable:
        databaseConnectionCheck.status === "PASS",
      canonicalSchemaContractValid:
        schemaContractCheck.status === "PASS",
      canonicalTablesPresent:
        databaseSchemaCheck.status === "PASS",
      memoryLayerDeclared:
        schemaContractCheck.details.hasMemoryLayer === true,
      evtLayerDeclared:
        schemaContractCheck.details.hasEvidenceLayer === true,
      opcLayerDeclared:
        schemaContractCheck.details.hasEvidenceLayer === true,
      auditLayerDeclared:
        schemaContractCheck.details.hasEvidenceLayer === true,
      modelUsageLayerDeclared:
        schemaContractCheck.details.hasModelUsageLayer === true,
      memoryContinuityDirectlyTested: false,
      evtCreationDirectlyTested: false,
      opcCreationDirectlyTested: false,
      auditCreationDirectlyTested: false,
      modelCallPerformed: false,
    },
    boundary: {
      legalCertification: false,
      opcBoundary: "technical proof receipt only",
      readOnlyApplicationData: true,
      performsDatabaseRead: true,
      performsDatabaseMutation: false,
      performsSchemaMutation: false,
      performsMemoryWrite: false,
      performsModelCall: false,
      createsEvt: false,
      createsOpc: false,
      createsAuditRecord: false,
      replacesHumanReview: false,
    },
  };

  return NextResponse.json(responseBody, {
    status: ok ? 200 : 503,
    headers: {
      "Cache-Control":
        "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
      "X-HBCE-Diagnostics-Revision": REVISION,
      "X-HBCE-Operational-Status": operationalStatus,
    },
  });
}

export async function HEAD(request: NextRequest): Promise<NextResponse> {
  const response = await GET(request);

  return new NextResponse(null, {
    status: response.status,
    headers: response.headers,
  });
}
