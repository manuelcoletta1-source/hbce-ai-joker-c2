import { NextResponse } from "next/server";

import {
  isHbceDatabaseConfigured,
  queryHbceDatabase
} from "@/lib/ipr-database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DatabaseHealthRow = {
  hbce_db_health_check: number;
};

export async function GET() {
  const configured = isHbceDatabaseConfigured();

  if (!configured) {
    return NextResponse.json(
      {
        ok: true,
        action: "HBCE_DATABASE_HEALTH",
        status: "DEGRADED",
        legalCertification: false
      },
      { status: 200 }
    );
  }

  const health = await queryHbceDatabase<DatabaseHealthRow>(
    "SELECT 1 AS hbce_db_health_check"
  );

  return NextResponse.json(
    {
      ok: health.ok,
      action: "HBCE_DATABASE_HEALTH",
      status: health.ok ? "AVAILABLE" : "UNAVAILABLE",
      legalCertification: false
    },
    { status: health.ok ? 200 : 503 }
  );
}

export async function POST() {
  return GET();
}
