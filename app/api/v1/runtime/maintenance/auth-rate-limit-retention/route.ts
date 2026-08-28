import {
  createHash,
  timingSafeEqual
} from "node:crypto";

import {
  NextRequest,
  NextResponse
} from "next/server";

import {
  resolveIprAccountSessionFromRequestAsync
} from "@/lib/ipr-auth-session-resolver";

import {
  IPR_AUTH_RATE_LIMIT_BOUNDARY,
  getDefaultIprAuthRateLimitStore
} from "@/lib/ipr-auth-rate-limit-store";


export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

export const revalidate =
  0;


const REVISION =
  "HBCE-C5X-RATE-LIMIT-RETENTION-MAINTENANCE-v1_0";


const PREFLIGHT_REVISION =
  "HBCE-C5X-RATE-LIMIT-RETENTION-PREFLIGHT-v1_0";

const MAINTENANCE_SECRET_HEADER =
  "x-hbce-maintenance-secret";

const MAINTENANCE_SECRET_ENV =
  "HBCE_AUTH_RATE_LIMIT_MAINTENANCE_SECRET";

const MINIMUM_SECRET_BYTES =
  32;


function noStoreHeaders() {
  return {
    "Cache-Control":
      "no-store, no-cache, must-revalidate, proxy-revalidate",
    Pragma:
      "no-cache",
    Expires:
      "0"
  };
}


function readMaintenanceSecret():
  string {

  return (
    process.env[
      MAINTENANCE_SECRET_ENV
    ] || ""
  ).trim();
}


function maintenanceSecretsEqual(
  suppliedSecret: string,
  expectedSecret: string
): boolean {

  if (
    Buffer.byteLength(
      expectedSecret,
      "utf8"
    ) < MINIMUM_SECRET_BYTES
  ) {
    return false;
  }

  if (!suppliedSecret) {
    return false;
  }

  const suppliedHash =
    createHash(
      "sha256"
    )
      .update(
        suppliedSecret,
        "utf8"
      )
      .digest();

  const expectedHash =
    createHash(
      "sha256"
    )
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


export async function GET(
  request: NextRequest
): Promise<NextResponse> {

  const sessionResolution =
    await resolveIprAccountSessionFromRequestAsync(
      request
    );

  if (
    !sessionResolution
      .runtimeAuthorized
  ) {
    return NextResponse.json(
      {
        ok:
          false,

        reason:
          "AUTHENTICATION_REQUIRED",

        legalCertification:
          false
      },
      {
        status:
          401,

        headers:
          noStoreHeaders()
      }
    );
  }

  const expectedSecret =
    readMaintenanceSecret();

  if (
    Buffer.byteLength(
      expectedSecret,
      "utf8"
    ) < MINIMUM_SECRET_BYTES
  ) {
    return NextResponse.json(
      {
        ok:
          false,

        reason:
          "MAINTENANCE_AUTHORITY_UNAVAILABLE",

        legalCertification:
          false
      },
      {
        status:
          503,

        headers:
          noStoreHeaders()
      }
    );
  }

  const suppliedSecret =
    (
      request.headers.get(
        MAINTENANCE_SECRET_HEADER
      ) || ""
    ).trim();

  if (
    !maintenanceSecretsEqual(
      suppliedSecret,
      expectedSecret
    )
  ) {
    return NextResponse.json(
      {
        ok:
          false,

        reason:
          "MAINTENANCE_AUTHORITY_DENIED",

        legalCertification:
          false
      },
      {
        status:
          403,

        headers:
          noStoreHeaders()
      }
    );
  }

  try {
    const store =
      getDefaultIprAuthRateLimitStore();

    const result =
      await store
        .inspectRetentionEligibilityAsync();

    return NextResponse.json(
      {
        ok:
          true,

        status:
          "PASS",

        mode:
          "AUTH_RATE_LIMIT_RETENTION_PREFLIGHT",

        revision:
          PREFLIGHT_REVISION,

        generatedAt:
          new Date()
            .toISOString(),

        result: {
          eligibleBuckets:
            result.eligibleBuckets,

          staleAfterSeconds:
            result.staleAfterSeconds,

          databaseReadOnly:
            true,

          legalCertification:
            false
        },

        boundary: {
          authenticatedSessionRequired:
            true,

          runtimeAuthorizationRequired:
            true,

          maintenanceSecretRequired:
            true,

          operation:
            "INSPECT_STALE_AUTH_RATE_LIMIT_BUCKETS",

          operationParameterized:
            false,

          acceptsClientHumanIpr:
            false,

          acceptsClientIp:
            false,

          acceptsRetentionOverride:
            false,

          performsDatabaseRead:
            true,

          performsDatabaseMutation:
            false,

          performsSchemaMutation:
            false,

          autoSchema:
            "NO_AUTO_SCHEMA",

          retentionPolicy:
            IPR_AUTH_RATE_LIMIT_BOUNDARY
              .retentionPolicy,

          sessionCreated:
            false,

          runtimeAuthorizationChanged:
            false,

          credentialBypass:
            false,

          legalCertification:
            false
        },

        legalCertification:
          false
      },
      {
        status:
          200,

        headers: {
          ...noStoreHeaders(),

          "X-HBCE-Maintenance-Mode":
            "auth-rate-limit-retention-preflight",

          "X-HBCE-Operational-Status":
            "PASS"
        }
      }
    );
  } catch {
    return NextResponse.json(
      {
        ok:
          false,

        status:
          "FAIL",

        mode:
          "AUTH_RATE_LIMIT_RETENTION_PREFLIGHT",

        reason:
          "AUTH_RATE_LIMIT_RETENTION_PREFLIGHT_FAILED",

        legalCertification:
          false
      },
      {
        status:
          503,

        headers:
          noStoreHeaders()
      }
    );
  }
}


export async function POST(
  request: NextRequest
): Promise<NextResponse> {

  const sessionResolution =
    await resolveIprAccountSessionFromRequestAsync(
      request
    );

  if (
    !sessionResolution
      .runtimeAuthorized
  ) {
    return NextResponse.json(
      {
        ok:
          false,

        reason:
          "AUTHENTICATION_REQUIRED",

        legalCertification:
          false
      },
      {
        status:
          401,

        headers:
          noStoreHeaders()
      }
    );
  }

  const expectedSecret =
    readMaintenanceSecret();

  if (
    Buffer.byteLength(
      expectedSecret,
      "utf8"
    ) < MINIMUM_SECRET_BYTES
  ) {
    return NextResponse.json(
      {
        ok:
          false,

        reason:
          "MAINTENANCE_AUTHORITY_UNAVAILABLE",

        legalCertification:
          false
      },
      {
        status:
          503,

        headers:
          noStoreHeaders()
      }
    );
  }

  const suppliedSecret =
    (
      request.headers.get(
        MAINTENANCE_SECRET_HEADER
      ) || ""
    ).trim();

  if (
    !maintenanceSecretsEqual(
      suppliedSecret,
      expectedSecret
    )
  ) {
    return NextResponse.json(
      {
        ok:
          false,

        reason:
          "MAINTENANCE_AUTHORITY_DENIED",

        legalCertification:
          false
      },
      {
        status:
          403,

        headers:
          noStoreHeaders()
      }
    );
  }

  try {
    const store =
      getDefaultIprAuthRateLimitStore();

    const result =
      await store
        .pruneStaleBucketsAsync();

    return NextResponse.json(
      {
        ok:
          true,

        status:
          "PASS",

        mode:
          "AUTH_RATE_LIMIT_RETENTION_MAINTENANCE",

        revision:
          REVISION,

        generatedAt:
          new Date()
            .toISOString(),

        result: {
          deletedBuckets:
            result.deletedBuckets,

          staleAfterSeconds:
            result.staleAfterSeconds,

          legalCertification:
            false
        },

        boundary: {
          authenticatedSessionRequired:
            true,

          runtimeAuthorizationRequired:
            true,

          maintenanceSecretRequired:
            true,

          maintenanceSecretEnvironmentVariable:
            MAINTENANCE_SECRET_ENV,

          operation:
            "PRUNE_STALE_AUTH_RATE_LIMIT_BUCKETS",

          operationParameterized:
            false,

          acceptsClientHumanIpr:
            false,

          acceptsClientIp:
            false,

          acceptsRetentionOverride:
            false,

          performsDatabaseRead:
            true,

          performsDatabaseMutation:
            true,

          performsSchemaMutation:
            false,

          autoSchema:
            "NO_AUTO_SCHEMA",

          retentionPolicy:
            IPR_AUTH_RATE_LIMIT_BOUNDARY
              .retentionPolicy,

          sessionCreated:
            false,

          runtimeAuthorizationChanged:
            false,

          credentialBypass:
            false,

          legalCertification:
            false
        },

        legalCertification:
          false
      },
      {
        status:
          200,

        headers: {
          ...noStoreHeaders(),

          "X-HBCE-Maintenance-Mode":
            "auth-rate-limit-retention",

          "X-HBCE-Operational-Status":
            "PASS"
        }
      }
    );
  } catch {
    return NextResponse.json(
      {
        ok:
          false,

        status:
          "FAIL",

        mode:
          "AUTH_RATE_LIMIT_RETENTION_MAINTENANCE",

        reason:
          "AUTH_RATE_LIMIT_RETENTION_MAINTENANCE_FAILED",

        legalCertification:
          false
      },
      {
        status:
          503,

        headers:
          noStoreHeaders()
      }
    );
  }
}
