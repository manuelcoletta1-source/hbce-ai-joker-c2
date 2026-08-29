import {
  createHash,
  timingSafeEqual
} from "node:crypto";

import {
  NextRequest,
  NextResponse
} from "next/server";

import {
  issueProductionGovernedSelfPilotPasswordRecoveryGrant
} from "@/lib/ipr-password-recovery-production-issuer";


export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

export const revalidate =
  0;


const ROUTE_BOUNDARY = {
  revision:
    "HBCE-IPR-PASSWORD-RECOVERY-GRANT-ISSUER-HTTP-v1_0",

  route:
    "/api/v1/runtime/maintenance/password-recovery-grant-issuer",

  method:
    "POST",

  requiredVercelEnvironment:
    "production",

  invocationSecretEnvironment:
    "HBCE_PASSWORD_RECOVERY_ISSUER_INVOCATION_SECRET",

  invocationSecretHeader:
    "x-hbce-password-recovery-issuer-secret",

  minimumInvocationSecretBytes:
    32,

  acceptsClientHumanIpr:
    false,

  acceptsClientTtl:
    false,

  acceptsClientNotBefore:
    false,

  acceptsRequestBody:
    false,

  acceptsQueryParameters:
    false,

  authoritySecretAcceptedOverHttp:
    false,

  invocationSecretAcceptedOverHttp:
    true,

  canonicalSubjectOnly:
    true,

  persistencePreflightRequired:
    true,

  priorActiveGrantRevocation:
    true,

  rawRecoveryTokenLoggingAllowed:
    false,

  passwordRotation:
    false,

  credentialMutation:
    false,

  sessionCreation:
    false,

  automaticLogin:
    false,

  legalCertification:
    false
} as const;


const INVOCATION_SECRET_DOMAIN =
  "HBCE_PASSWORD_RECOVERY_ISSUER_INVOCATION_SECRET_V1";


function noStoreHeaders() {
  return {
    "Cache-Control":
      "no-store, no-cache, must-revalidate, max-age=0",

    "Pragma":
      "no-cache",

    "Expires":
      "0",

    "X-Content-Type-Options":
      "nosniff"
  };
}


function digestSecret(
  value:
    string
): Buffer {

  return createHash(
    "sha256"
  )
    .update(
      [
        INVOCATION_SECRET_DOMAIN,
        value
      ].join("\0"),
      "utf8"
    )
    .digest();
}


function invocationSecretsEqual(
  presented:
    string,
  configured:
    string
): boolean {

  return timingSafeEqual(
    digestSecret(
      presented
    ),
    digestSecret(
      configured
    )
  );
}


function errorResponse(
  status:
    number,
  reason:
    string
) {

  return NextResponse.json(
    {
      ok:
        false,

      reason,

      grantIssued:
        false,

      passwordRotation:
        false,

      credentialMutation:
        false,

      sessionCreation:
        false,

      automaticLogin:
        false,

      authoritySecretAcceptedOverHttp:
        false,

      legalCertification:
        false
    },
    {
      status,
      headers:
        noStoreHeaders()
    }
  );
}


function readConfiguredInvocationSecret():
  string {

  const secret =
    (
      process.env[
        ROUTE_BOUNDARY
          .invocationSecretEnvironment
      ] || ""
    ).trim();

  if (
    Buffer.byteLength(
      secret,
      "utf8"
    ) <
    ROUTE_BOUNDARY
      .minimumInvocationSecretBytes
  ) {
    throw new Error(
      "HBCE_PASSWORD_RECOVERY_ISSUER_INVOCATION_SECRET_UNAVAILABLE"
    );
  }

  return secret;
}


export async function POST(
  req:
    NextRequest
) {

  /*
   * This boundary is intentionally Production-only.
   */
  if (
    (
      process.env
        .VERCEL_ENV || ""
    ).trim() !==
      ROUTE_BOUNDARY
        .requiredVercelEnvironment
  ) {
    return errorResponse(
      503,
      "RECOVERY_GRANT_ISSUER_ENVIRONMENT_DENIED"
    );
  }


  /*
   * No query parameter may influence subject,
   * TTL, timing or any other issuance property.
   */
  if (
    req.nextUrl
      .searchParams
      .size >
    0
  ) {
    return errorResponse(
      400,
      "PARAMETERS_NOT_ALLOWED"
    );
  }


  /*
   * This route is deliberately zero-input.
   * The request body cannot carry a subject,
   * recovery authority secret, TTL or notBefore.
   */
  const body =
    await req.text();

  if (
    body.trim()
      .length >
    0
  ) {
    return errorResponse(
      400,
      "REQUEST_BODY_NOT_ALLOWED"
    );
  }


  let configuredInvocationSecret:
    string;

  try {
    configuredInvocationSecret =
      readConfiguredInvocationSecret();
  } catch {
    return errorResponse(
      503,
      "RECOVERY_GRANT_ISSUER_AUTHORITY_UNAVAILABLE"
    );
  }


  const presentedInvocationSecret =
    (
      req.headers.get(
        ROUTE_BOUNDARY
          .invocationSecretHeader
      ) || ""
    ).trim();


  if (
    !presentedInvocationSecret ||
    !invocationSecretsEqual(
      presentedInvocationSecret,
      configuredInvocationSecret
    )
  ) {
    return errorResponse(
      403,
      "RECOVERY_GRANT_ISSUER_AUTHORITY_DENIED"
    );
  }


  try {
    /*
     * The HTTP invocation secret stops here.
     *
     * The actual recovery authority secret is
     * loaded internally from the Vercel runtime
     * by the production issuer and never crosses
     * this request boundary.
     */
    const grant =
      await issueProductionGovernedSelfPilotPasswordRecoveryGrant();


    return NextResponse.json(
      {
        ok:
          true,

        status:
          "IPR_PASSWORD_RECOVERY_GRANT_ISSUED",

        revision:
          ROUTE_BOUNDARY
            .revision,

        recoveryToken:
          grant.recoveryToken,

        scope:
          grant.scope,

        issuedAt:
          grant.issuedAt,

        notBefore:
          grant.notBefore,

        expiresAt:
          grant.expiresAt,

        ttlSeconds:
          grant.ttlSeconds,

        oneUse:
          grant.oneUse,

        authorityVerified:
          grant.authorityVerified,

        publicSelfService:
          grant.publicSelfService,

        grantIssued:
          true,

        rawRecoveryTokenReturnedInThisResponse:
          true,

        rawRecoveryTokenLoggingAllowed:
          false,

        authoritySecretAcceptedOverHttp:
          false,

        passwordRotation:
          false,

        credentialMutation:
          false,

        sessionCreation:
          false,

        automaticLogin:
          false,

        legalCertification:
          false
      },
      {
        status:
          200,

        headers:
          noStoreHeaders()
      }
    );
  } catch {
    /*
     * Do not leak whether failure occurred in
     * persistence preflight, authority verification
     * or grant persistence.
     */
    return errorResponse(
      503,
      "RECOVERY_GRANT_ISSUANCE_FAILED"
    );
  }
}
