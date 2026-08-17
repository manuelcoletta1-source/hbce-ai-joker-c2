import {
  createHash,
  timingSafeEqual
} from "node:crypto";

import {
  NextRequest,
  NextResponse
} from "next/server";

import {
  ensureHbceDatabaseReady,
  isHbceDatabaseConfigured
} from "@/lib/ipr-database";


export const runtime = "nodejs";
export const dynamic = "force-dynamic";


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

function buildDatabaseInitAuthorizationFailure() {
  return NextResponse.json(
    {
      ok: false,
      action: "HBCE_DATABASE_INIT",
      initialized: false,
      reason: "DATABASE_INIT_NOT_AVAILABLE",
      legalCertification: false
    },
    {
      status: 403
    }
  );
}

function validateDatabaseInitAuthorization(
  request: NextRequest
): NextResponse | null {
  const expectedSecret =
    readDatabaseInitSecretEnv();

  if (!expectedSecret) {
    return buildDatabaseInitAuthorizationFailure();
  }

  const suppliedSecret =
    request.headers
      .get(
        DATABASE_INIT_SECRET_HEADER
      )
      ?.trim() || "";

  if (!suppliedSecret) {
    return buildDatabaseInitAuthorizationFailure();
  }

  if (
    !databaseInitSecretsEqual(
      suppliedSecret,
      expectedSecret
    )
  ) {
    return buildDatabaseInitAuthorizationFailure();
  }

  return null;
}

function buildNotConfiguredResponse() {
  return NextResponse.json(
    {
      ok: false,
      action: "HBCE_DATABASE_INIT",
      initialized: false,
      reason: "DATABASE_INIT_NOT_AVAILABLE",
      legalCertification: false
    },
    {
      status: 503
    }
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
        legalCertification: false
      },
      {
        status: result.ok ? 200 : 503
      }
    );
  } catch {
    return NextResponse.json(
      {
        ok: false,
        action: "HBCE_DATABASE_INIT",
        initialized: false,
        reason: "DATABASE_INIT_FAILED",
        legalCertification: false
      },
      {
        status: 500
      }
    );
  }
}
