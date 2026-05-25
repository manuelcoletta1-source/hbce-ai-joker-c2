import { NextResponse } from "next/server";

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
  "This endpoint initializes the HBCE persistent database schema for R&D deployment. It must be protected, restricted or removed before production exposure. It does not create legal certification, public authority validation, eIDAS qualified trust service output or official identity issuance.";

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
  const configured = isHbceDatabaseConfigured();
  const description = describeDefaultHbceDatabase();

  return NextResponse.json(
    {
      ok: true,
      action: "HBCE_DATABASE_INIT_INFO",
      database: {
        configured,
        description
      },
      schema: {
        version: HBCE_DATABASE_SCHEMA_VERSION,
        tables: HBCE_DATABASE_SCHEMA_TABLES
      },
      usage: {
        method: "POST",
        path: "/api/database/init",
        effect:
          "Initializes the HBCE persistent database schema if DATABASE_URL or POSTGRES_URL is configured."
      },
      boundary: {
        ...getHbceDatabaseBoundary(),
        endpointBoundary: DATABASE_INIT_BOUNDARY
      },
      legalCertification: false
    },
    { status: 200 }
  );
}

export async function POST() {
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
