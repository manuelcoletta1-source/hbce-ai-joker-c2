import {
  createHash,
  timingSafeEqual
} from "node:crypto";

import {
  NextRequest,
  NextResponse
} from "next/server";

import {
  describeDefaultHbceDatabase,
  ensureHbceDatabaseReady,
  getHbceDatabaseBoundary,
  isHbceDatabaseConfigured
} from "@/lib/ipr-database";

import {
  HBCE_DATABASE_SCHEMA_TABLES,
  HBCE_DATABASE_SCHEMA_VERSION
} from "@/lib/ipr-database-schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DATABASE_INIT_BOUNDARY =
  "This endpoint initializes the HBCE persistent database schema for R&D deployment. POST requires dedicated database-independent bootstrap-secret authorization before database configuration or schema mutation is evaluated. It does not create legal certification, public authority validation, eIDAS qualified trust service output or official identity issuance.";

const DATABASE_INIT_SECRET_HEADER =
  "x-hbce-database-init-secret";

const DATABASE_INIT_SECRET_ENV =
  "HBCE_DATABASE_INIT_SECRET";

function readDatabaseInitSecretEnv(): string {
  const value =
    process.env[
      DATABASE_INIT_SECRET_ENV
    ];

  return typeof value === "string"
    ? value.trim()
    : "";
}

function databaseInitSecretsEqual(
  suppliedSecret: string,
  expectedSecret: string
): boolean {
  const suppliedHash =
    createHash("sha256")
      .update(
        suppliedSecret,
        "utf8"
      )
      .digest();

  const expectedHash =
    createHash("sha256")
      .update(
        expectedSecret,
        "utf8"
      )
      .digest();

  return timingSafeEqual(
    suppliedHash,
    expectedHash
  );
}

function buildDatabaseInitAuthorizationFailure(
  reason:
    | "DATABASE_INIT_SECRET_NOT_CONFIGURED"
    | "DATABASE_INIT_SECRET_MISSING"
    | "DATABASE_INIT_SECRET_INVALID",
  status: 401 | 403 | 503
) {
  return NextResponse.json(
    {
      ok: false,
      action:
        "HBCE_DATABASE_INIT",
      initialized: false,
      reason,
      authorization: {
        required: true,
        mode:
          "DATABASE_INDEPENDENT_BOOTSTRAP_SECRET",
        requiredHeader:
          DATABASE_INIT_SECRET_HEADER,
        requiredEnvironmentVariable:
          DATABASE_INIT_SECRET_ENV,
        decision:
          "FAIL_CLOSED"
      },
      boundary: {
        ...getHbceDatabaseBoundary(),
        endpointBoundary:
          DATABASE_INIT_BOUNDARY
      },
      legalCertification: false
    },
    {
      status,
      headers:
        status === 401
          ? {
              "WWW-Authenticate":
                'HBCE-Database-Init realm="HBCE database initialization"'
            }
          : undefined
    }
  );
}

function validateDatabaseInitAuthorization(
  request: NextRequest
): NextResponse | null {
  const expectedSecret =
    readDatabaseInitSecretEnv();

  if (!expectedSecret) {
    return buildDatabaseInitAuthorizationFailure(
      "DATABASE_INIT_SECRET_NOT_CONFIGURED",
      503
    );
  }

  const suppliedSecret =
    request.headers
      .get(
        DATABASE_INIT_SECRET_HEADER
      )
      ?.trim() || "";

  if (!suppliedSecret) {
    return buildDatabaseInitAuthorizationFailure(
      "DATABASE_INIT_SECRET_MISSING",
      401
    );
  }

  if (
    !databaseInitSecretsEqual(
      suppliedSecret,
      expectedSecret
    )
  ) {
    return buildDatabaseInitAuthorizationFailure(
      "DATABASE_INIT_SECRET_INVALID",
      403
    );
  }

  return null;
}

function buildNotConfiguredResponse() {
  return NextResponse.json(
    {
      ok: false,
      action: "HBCE_DATABASE_INIT",
      initialized: false,
      reason: "DATABASE_NOT_CONFIGURED",
      database: {
        configured: false,
        available: false,
        requiredEnvironmentVariable: "DATABASE_URL",
        acceptedFallbackEnvironmentVariable: "POSTGRES_URL"
      },
      schema: {
        version: HBCE_DATABASE_SCHEMA_VERSION,
        tables: HBCE_DATABASE_SCHEMA_TABLES
      },
      boundary: {
        ...getHbceDatabaseBoundary(),
        endpointBoundary: DATABASE_INIT_BOUNDARY
      },
      instruction:
        "Connect a Neon/Postgres database to the Vercel project and expose DATABASE_URL before running schema initialization.",
      legalCertification: false
    },
    { status: 503 }
  );
}

export async function GET() {
  return NextResponse.json(
    {
      ok: false,
      action: "HBCE_DATABASE_INIT",
      reason: "METHOD_NOT_ALLOWED",
      allowedMethods: [
        "POST"
      ],
      legalCertification: false
    },
    {
      status: 405,
      headers: {
        Allow: "POST"
      }
    }
  );
}

export async function POST(
  request: NextRequest
) {
  const authorizationFailure =
    validateDatabaseInitAuthorization(
      request
    );

  if (authorizationFailure) {
    return authorizationFailure;
  }

  if (!isHbceDatabaseConfigured()) {
    return buildNotConfiguredResponse();
  }

  try {
    const result = await ensureHbceDatabaseReady();

    return NextResponse.json(
      {
        ok: result.ok,
        action: "HBCE_DATABASE_INIT",
        initialized: result.ok,
        database: {
          description: result.description,
          initialization: result.initialization
        },
        schema: {
          version: result.schema.version,
          persistenceMode: result.schema.persistenceMode,
          tables: result.schema.tables
        },
        boundary: {
          ...getHbceDatabaseBoundary(),
          endpointBoundary: DATABASE_INIT_BOUNDARY
        },
        legalCertification: false
      },
      { status: result.ok ? 200 : 503 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        action: "HBCE_DATABASE_INIT",
        initialized: false,
        reason: "DATABASE_INITIALIZATION_EXCEPTION",
        error: error instanceof Error ? error.message : "UNKNOWN_DATABASE_INIT_ERROR",
        database: {
          description: describeDefaultHbceDatabase()
        },
        schema: {
          version: HBCE_DATABASE_SCHEMA_VERSION,
          tables: HBCE_DATABASE_SCHEMA_TABLES
        },
        boundary: {
          ...getHbceDatabaseBoundary(),
          endpointBoundary: DATABASE_INIT_BOUNDARY
        },
        legalCertification: false
      },
      { status: 500 }
    );
  }
}
