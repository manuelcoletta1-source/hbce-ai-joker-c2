import { NextResponse } from "next/server";

import {
  describeDefaultHbceDatabase,
  getHbceDatabaseBoundary,
  isHbceDatabaseConfigured,
  queryHbceDatabase
} from "@/lib/ipr-database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DatabaseHealthRow = {
  hbce_db_health_check: number;
  hbce_db_now: string;
};

export async function GET() {
  const description = describeDefaultHbceDatabase();
  const boundary = getHbceDatabaseBoundary();
  const configured = isHbceDatabaseConfigured();

  if (!configured) {
    return NextResponse.json(
      {
        ok: true,
        database: {
          configured: false,
          available: false,
          status: "NOT_CONFIGURED",
          reason:
            "DATABASE_URL or POSTGRES_URL is not configured. HBCE runtime must remain in process-memory MVP mode and must not claim DATABASE_PERSISTENT continuity."
        },
        description,
        boundary,
        legalCertification: false
      },
      { status: 200 }
    );
  }

  const health = await queryHbceDatabase<DatabaseHealthRow>(
    "SELECT 1 AS hbce_db_health_check, now()::text AS hbce_db_now"
  );

  return NextResponse.json(
    {
      ok: health.ok,
      database: {
        configured: true,
        available: health.ok,
        status: health.status,
        rowCount: health.rowCount,
        durationMs: health.durationMs,
        sqlHash: health.sqlHash,
        healthCheck: health.rows[0] || null,
        error: health.error
      },
      description,
      boundary,
      legalCertification: false
    },
    { status: health.ok ? 200 : 503 }
  );
}

export async function POST() {
  return GET();
}
