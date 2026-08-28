import {
  NextRequest,
  NextResponse
} from "next/server";

import {
  evaluateIprPasswordPolicy,
  isValidHumanIpr,
  normalizeHumanIpr
} from "@/lib/ipr-auth";

import {
  getDefaultIprAuthRateLimitStore,
  resolveIprAuthRateLimitClientIp
} from "@/lib/ipr-auth-rate-limit-store";

import {
  executeIprPasswordRecovery
} from "@/lib/ipr-password-recovery-transaction";


export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";


type JsonRecord =
  Record<string, unknown>;


const IPR_PASSWORD_RECOVERY_ROUTE_BOUNDARY = {
  revision:
    "HBCE-IPR-PASSWORD-RECOVERY-HTTP-v1_0",

  route:
    "/api/auth/ipr-password-recovery",

  operation:
    "ROTATE_EXISTING_PASSWORD",

  grantIssuanceOverHttp:
    false,

  authoritySecretAcceptedOverHttp:
    false,

  publicSelfServiceGrantIssuance:
    false,

  recoveryTokenRequired:
    true,

  passwordPolicyRequired:
    true,

  recoveryRateLimitNamespace:
    "HBCE_C5X_PASSWORD_RECOVERY",

  accountEnumerationResistance:
    true,

  credentialCreationAuthority:
    false,

  sessionCreationAuthority:
    false,

  automaticLogin:
    false,

  authenticationAfterRecovery:
    "EXPLICIT_LOGIN_REQUIRED",

  rawRecoveryTokenLoggingAllowed:
    false,

  rawPasswordLoggingAllowed:
    false,

  legalCertification:
    false
} as const;


const RECOVERY_TOKEN_PATTERN =
  /^[A-Za-z0-9_-]{64}$/;


function isRecord(
  value:
    unknown
): value is JsonRecord {

  return Boolean(value) &&
    typeof value ===
      "object" &&
    !Array.isArray(
      value
    );
}


async function readJson(
  req:
    NextRequest
): Promise<JsonRecord> {

  try {
    const value =
      await req.json();

    return isRecord(value)
      ? value
      : {};
  } catch {
    return {};
  }
}


function readString(
  value:
    unknown
): string {

  return typeof value ===
    "string"
    ? value.trim()
    : "";
}


function buildBoundary() {
  return {
    route:
      IPR_PASSWORD_RECOVERY_ROUTE_BOUNDARY,

    recovery: {
      grant: {
        scope:
          "PASSWORD_ROTATION",

        oneUse:
          true,

        issuanceOverHttp:
          false
      },

      authority: {
        verification:
          "SERVER_SIDE_BEFORE_GRANT_ISSUANCE",

        authoritySecretAcceptedOverHttp:
          false,

        publicSelfServiceGrantIssuance:
          false
      },

      transaction: {
        isolationLevel:
          "SERIALIZABLE",

        credentialMutation:
          "UPDATE_EXISTING_ONLY",

        subjectSessionRevocation:
          "ALL_ACTIVE_SESSIONS",

        automaticLogin:
          false
      },

      rateLimit: {
        keyDomain:
          "HBCE_C5X_PASSWORD_RECOVERY",

        sharesLoginKeys:
          false,

        resetOnSuccessfulRecovery:
          false
      }
    },

    operationalConfigurationExposed:
      false,

    secretConfigurationExposed:
      false,

    databaseConfigurationExposed:
      false,

    legalCertification:
      false
  };
}


function errorResponse(
  status:
    number,
  reason:
    string,
  detail:
    string
) {
  return NextResponse.json(
    {
      ok:
        false,

      authenticated:
        false,

      authorized:
        false,

      reason,

      detail,

      sessionCreated:
        false,

      automaticLogin:
        false,

      boundary:
        buildBoundary(),

      legalCertification:
        false
    },
    {
      status
    }
  );
}


async function recordRecoveryFailure(
  humanIpr:
    string,
  clientIp:
    string
): Promise<boolean> {

  try {
    const store =
      getDefaultIprAuthRateLimitStore();

    await store
      .recordPasswordRecoveryFailureAsync({
        humanIpr,
        clientIp
      });

    return true;
  } catch {
    return false;
  }
}


export async function GET() {
  return NextResponse.json(
    {
      ok:
        true,

      route:
        IPR_PASSWORD_RECOVERY_ROUTE_BOUNDARY
          .route,

      runtime:
        "nodejs",

      operations: [
        "ROTATE_EXISTING_PASSWORD"
      ],

      grantIssuanceOverHttp:
        false,

      authoritySecretAcceptedOverHttp:
        false,

      automaticLogin:
        false,

      loginRequiredAfterRecovery:
        true,

      boundary:
        buildBoundary(),

      legalCertification:
        false
    },
    {
      status:
        200
    }
  );
}


export async function POST(
  req:
    NextRequest
) {

  const body =
    await readJson(
      req
    );

  const humanIprRaw =
    readString(
      body.humanIpr ??
      body.human_ipr ??
      body.ipr
    );

  const recoveryToken =
    readString(
      body.recoveryToken ??
      body.recovery_token
    );

  const newPassword =
    readString(
      body.newPassword ??
      body.new_password
    );


  /*
   * Format validation does not perform account lookup
   * and therefore does not disclose account existence.
   */
  if (!humanIprRaw) {
    return errorResponse(
      400,
      "IPR_PASSWORD_RECOVERY_INPUT_INVALID",
      "Human IPR, recovery token and new password are required."
    );
  }

  const humanIpr =
    normalizeHumanIpr(
      humanIprRaw
    );

  if (
    !isValidHumanIpr(
      humanIpr
    )
  ) {
    return errorResponse(
      400,
      "IPR_PASSWORD_RECOVERY_INPUT_INVALID",
      "Human IPR, recovery token and new password are required."
    );
  }

  if (
    !recoveryToken ||
    !newPassword
  ) {
    return errorResponse(
      400,
      "IPR_PASSWORD_RECOVERY_INPUT_INVALID",
      "Human IPR, recovery token and new password are required."
    );
  }


  /*
   * Establish persistent recovery-specific rate-limit
   * context before any expensive password KDF occurs.
   */
  const clientIp =
    resolveIprAuthRateLimitClientIp(
      req.headers
    );

  if (!clientIp) {
    return errorResponse(
      503,
      "IPR_PASSWORD_RECOVERY_RATE_LIMIT_UNAVAILABLE",
      "Password recovery governance is unavailable."
    );
  }

  const rateLimitStore =
    getDefaultIprAuthRateLimitStore();

  try {
    const rateLimitState =
      await rateLimitStore
        .inspectPasswordRecoveryAsync({
          humanIpr,
          clientIp
        });

    if (
      rateLimitState.blocked
    ) {
      return errorResponse(
        429,
        "IPR_PASSWORD_RECOVERY_THROTTLED",
        "Password recovery is temporarily unavailable for this request context."
      );
    }
  } catch {
    return errorResponse(
      503,
      "IPR_PASSWORD_RECOVERY_RATE_LIMIT_UNAVAILABLE",
      "Password recovery governance is unavailable."
    );
  }


  /*
   * Reject obviously malformed tokens before the
   * intentionally expensive scrypt password KDF.
   *
   * The response remains generic and the attempt is
   * recorded in the recovery-specific rate-limit buckets.
   */
  if (
    !RECOVERY_TOKEN_PATTERN.test(
      recoveryToken
    )
  ) {
    const governed =
      await recordRecoveryFailure(
        humanIpr,
        clientIp
      );

    if (!governed) {
      return errorResponse(
        503,
        "IPR_PASSWORD_RECOVERY_RATE_LIMIT_UNAVAILABLE",
        "Password recovery failure governance could not be completed."
      );
    }

    return errorResponse(
      401,
      "IPR_PASSWORD_RECOVERY_FAILED",
      "Password recovery authorization is invalid or unavailable."
    );
  }


  /*
   * Password policy is safe to expose because it does not
   * query whether an account exists and does not validate
   * the recovery grant.
   */
  const passwordPolicy =
    evaluateIprPasswordPolicy(
      newPassword
    );

  if (
    !passwordPolicy.valid
  ) {
    return NextResponse.json(
      {
        ok:
          false,

        authenticated:
          false,

        authorized:
          false,

        reason:
          "IPR_PASSWORD_POLICY_FAILED",

        detail:
          "The new password does not satisfy the HBCE IPR password policy.",

        passwordPolicy,

        sessionCreated:
          false,

        automaticLogin:
          false,

        boundary:
          buildBoundary(),

        legalCertification:
          false
      },
      {
        status:
          400
      }
    );
  }


  try {
    const result =
      await executeIprPasswordRecovery({
        humanIpr,
        recoveryToken,
        newPassword
      });

    /*
     * Successful recovery deliberately does NOT reset
     * recovery abuse buckets.
     *
     * Recovery evidence survives the password change.
     */
    return NextResponse.json(
      {
        ok:
          true,

        authenticated:
          false,

        authorized:
          false,

        operation:
          "ROTATE_EXISTING_PASSWORD",

        status:
          "IPR_PASSWORD_RECOVERY_COMMITTED",

        humanIpr:
          result.humanIpr,

        passwordUpdatedAt:
          result.passwordUpdatedAt,

        grantConsumed:
          result.grantConsumed,

        transactionCommitted:
          result.transactionCommitted,

        sessionCreated:
          false,

        automaticLogin:
          false,

        loginRequired:
          true,

        boundary:
          buildBoundary(),

        legalCertification:
          false
      },
      {
        status:
          200
      }
    );
  } catch (
    error
  ) {
    /*
     * Infrastructure configuration failure is not an
     * account-existence signal and may be reported as 503.
     */
    if (
      error instanceof Error &&
      error.message ===
        "HBCE_PASSWORD_RECOVERY_DATABASE_NOT_CONFIGURED"
    ) {
      return errorResponse(
        503,
        "IPR_PASSWORD_RECOVERY_UNAVAILABLE",
        "Password recovery persistence is unavailable."
      );
    }

    /*
     * Invalid / expired / replayed grant, missing existing
     * credential and transaction failures converge on one
     * public response.
     *
     * No account-enumeration detail crosses this boundary.
     */
    const governed =
      await recordRecoveryFailure(
        humanIpr,
        clientIp
      );

    if (!governed) {
      return errorResponse(
        503,
        "IPR_PASSWORD_RECOVERY_RATE_LIMIT_UNAVAILABLE",
        "Password recovery failure governance could not be completed."
      );
    }

    return errorResponse(
      401,
      "IPR_PASSWORD_RECOVERY_FAILED",
      "Password recovery authorization is invalid or unavailable."
    );
  }
}
