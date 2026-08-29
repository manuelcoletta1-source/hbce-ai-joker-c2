import {
  createHash,
  timingSafeEqual
} from "node:crypto";

import {
  NextRequest,
  NextResponse
} from "next/server";

import {
  runSelfPilotPasswordRecoveryPreflight
} from "@/lib/ipr-password-recovery-preflight";


export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

export const revalidate =
  0;


const REVISION =
  "HBCE-IPR-PASSWORD-RECOVERY-PREFLIGHT-HTTP-v1_0";

const PREFLIGHT_SECRET_HEADER =
  "x-hbce-password-recovery-preflight-secret";

const PREFLIGHT_SECRET_ENV =
  "HBCE_PASSWORD_RECOVERY_PREFLIGHT_SECRET";

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


function readExpectedSecret():
  string {

  return (
    process.env[
      PREFLIGHT_SECRET_ENV
    ] || ""
  ).trim();
}


function secretsEqual(
  suppliedSecret:
    string,

  expectedSecret:
    string
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
  request:
    NextRequest
): Promise<NextResponse> {

  /*
   * This endpoint is intentionally fixed-subject.
   * No query parameter is accepted because the caller
   * must never choose which Human IPR is inspected.
   */
  if (
    request.nextUrl.searchParams
      .size >
    0
  ) {
    return NextResponse.json(
      {
        ok:
          false,

        reason:
          "PARAMETERS_NOT_ALLOWED",

        legalCertification:
          false
      },
      {
        status:
          400,

        headers:
          noStoreHeaders()
      }
    );
  }

  const expectedSecret =
    readExpectedSecret();

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
          "RECOVERY_PREFLIGHT_AUTHORITY_UNAVAILABLE",

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
        PREFLIGHT_SECRET_HEADER
      ) || ""
    ).trim();

  if (
    !secretsEqual(
      suppliedSecret,
      expectedSecret
    )
  ) {
    return NextResponse.json(
      {
        ok:
          false,

        reason:
          "RECOVERY_PREFLIGHT_AUTHORITY_DENIED",

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
    const result =
      await runSelfPilotPasswordRecoveryPreflight();

    return NextResponse.json(
      {
        ok:
          result.ok,

        status:
          result.status,

        mode:
          "SELF_PILOT_PERSISTENT_RECOVERY_READ_ONLY_PREFLIGHT",

        revision:
          REVISION,

        generatedAt:
          new Date()
            .toISOString(),

        result,

        authoritySecretAcceptedOverHttp:
          false,

        grantIssuance:
          false,

        passwordRotation:
          false,

        credentialMutation:
          false,

        sessionCreation:
          false,

        legalCertification:
          false
      },
      {
        status:
          result.ok
            ? 200
            : 409,

        headers:
          noStoreHeaders()
      }
    );
  } catch {
    return NextResponse.json(
      {
        ok:
          false,

        status:
          "FAIL_CLOSED",

        reason:
          "RECOVERY_PREFLIGHT_EXECUTION_FAILED",

        legalCertification:
          false
      },
      {
        status:
          500,

        headers:
          noStoreHeaders()
      }
    );
  }
}
