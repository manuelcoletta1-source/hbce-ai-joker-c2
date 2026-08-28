import {
  createHash,
  timingSafeEqual
} from "node:crypto";

import {
  assertValidHumanIpr
} from "@/lib/ipr-auth";

import {
  issueIprPasswordRecoveryGrant,
  type IssuedIprPasswordRecoveryGrant
} from "@/lib/ipr-password-recovery-store";


export const IPR_PASSWORD_RECOVERY_AUTHORITY_BOUNDARY = {
  revision:
    "HBCE-IPR-PASSWORD-RECOVERY-AUTHORITY-v1_0",

  authorityMode:
    "SERVER_SECRET_R_AND_D_V1",

  enabledEnvironmentVariable:
    "HBCE_PASSWORD_RECOVERY_AUTHORITY_ENABLED",

  secretEnvironmentVariable:
    "HBCE_PASSWORD_RECOVERY_AUTHORITY_SECRET",

  authorityReferenceEnvironmentVariable:
    "HBCE_PASSWORD_RECOVERY_AUTHORITY_REF",

  minimumSecretBytes:
    32,

  issuerKind:
    "HBCE_SERVER_RECOVERY_AUTHORITY",

  serverVerifiedAuthorityBeforeGrantIssuance:
    true,

  authorityVerificationPerformedHere:
    true,

  publicSelfServiceAuthority:
    false,

  clientHandoffAuthority:
    false,

  userSelfAssertionAuthority:
    false,

  existingSessionAloneIsRecoveryAuthority:
    false,

  httpAuthorityExtractionPerformedHere:
    false,

  recoveryGrantIssuanceAuthority:
    true,

  passwordRotationExecutionAuthority:
    false,

  credentialCreationAuthority:
    false,

  sessionCreationAuthority:
    false,

  runtimeAuthorizationAuthority:
    false,

  automaticLoginAuthority:
    false,

  authoritySecretPersistence:
    false,

  authoritySecretLoggingAllowed:
    false,

  rawAuthorityReferencePersistence:
    false,

  legalCertification:
    false
} as const;


export type IssueServerVerifiedIprPasswordRecoveryGrantInput = {
  humanIpr:
    string;

  presentedAuthoritySecret:
    string;

  ttlSeconds?:
    number;

  notBefore?:
    string;
};


export type ServerVerifiedIprPasswordRecoveryGrant = {
  recoveryToken:
    string;

  scope:
    "PASSWORD_ROTATION";

  issuerKind:
    "HBCE_SERVER_RECOVERY_AUTHORITY";

  issuedAt:
    string;

  notBefore:
    string;

  expiresAt:
    string;

  ttlSeconds:
    number;

  authorityVerified:
    true;

  authorityMode:
    "SERVER_SECRET_R_AND_D_V1";

  oneUse:
    true;

  publicSelfService:
    false;

  credentialCreationAuthority:
    false;

  sessionCreationAuthority:
    false;

  automaticLogin:
    false;

  legalCertification:
    false;
};


const AUTHORITY_SECRET_DOMAIN =
  "HBCE_PASSWORD_RECOVERY_AUTHORITY_SECRET_V1";


function readEnabledFlag(): boolean {
  return (
    process.env
      .HBCE_PASSWORD_RECOVERY_AUTHORITY_ENABLED ||
    ""
  )
    .trim()
    .toLowerCase() ===
      "true";
}


function readConfiguredAuthoritySecret():
  string {

  const value =
    process.env
      .HBCE_PASSWORD_RECOVERY_AUTHORITY_SECRET;

  if (
    typeof value !==
      "string" ||
    !value.trim()
  ) {
    throw new Error(
      "HBCE_PASSWORD_RECOVERY_AUTHORITY_SECRET_REQUIRED"
    );
  }

  if (
    Buffer.byteLength(
      value,
      "utf8"
    ) <
    IPR_PASSWORD_RECOVERY_AUTHORITY_BOUNDARY
      .minimumSecretBytes
  ) {
    throw new Error(
      "HBCE_PASSWORD_RECOVERY_AUTHORITY_SECRET_TOO_SHORT"
    );
  }

  return value;
}


function readAuthorityReference():
  string {

  const value =
    (
      process.env
        .HBCE_PASSWORD_RECOVERY_AUTHORITY_REF ||
      ""
    ).trim();

  if (!value) {
    throw new Error(
      "HBCE_PASSWORD_RECOVERY_AUTHORITY_REF_REQUIRED"
    );
  }

  if (
    value.length <
      8 ||
    value.length >
      200
  ) {
    throw new Error(
      "HBCE_PASSWORD_RECOVERY_AUTHORITY_REF_INVALID"
    );
  }

  return value;
}


function authoritySecretDigest(
  value:
    string
): Buffer {

  return createHash(
    "sha256"
  )
    .update(
      [
        AUTHORITY_SECRET_DOMAIN,
        value
      ].join(
        "\0"
      ),
      "utf8"
    )
    .digest();
}


function authoritySecretsEqual(
  presented:
    string,
  configured:
    string
): boolean {

  const presentedDigest =
    authoritySecretDigest(
      presented
    );

  const configuredDigest =
    authoritySecretDigest(
      configured
    );

  return timingSafeEqual(
    presentedDigest,
    configuredDigest
  );
}


function verifyServerRecoveryAuthority(
  presentedAuthoritySecret:
    string
): {
  authorityRef:
    string;

  issuerKind:
    "HBCE_SERVER_RECOVERY_AUTHORITY";
} {

  if (
    !readEnabledFlag()
  ) {
    throw new Error(
      "HBCE_PASSWORD_RECOVERY_AUTHORITY_DISABLED"
    );
  }

  const configuredSecret =
    readConfiguredAuthoritySecret();

  const authorityRef =
    readAuthorityReference();

  const presentedSecret =
    typeof presentedAuthoritySecret ===
      "string"
      ? presentedAuthoritySecret
      : "";

  /*
   * Compare fixed-size digests so secret length does not
   * control timingSafeEqual input length.
   */
  if (
    !authoritySecretsEqual(
      presentedSecret,
      configuredSecret
    )
  ) {
    throw new Error(
      "HBCE_PASSWORD_RECOVERY_AUTHORITY_DENIED"
    );
  }

  return {
    authorityRef,

    issuerKind:
      "HBCE_SERVER_RECOVERY_AUTHORITY"
  };
}


function mapIssuedGrant(
  issued:
    IssuedIprPasswordRecoveryGrant
): ServerVerifiedIprPasswordRecoveryGrant {

  if (
    issued.scope !==
      "PASSWORD_ROTATION" ||
    issued.issuerKind !==
      "HBCE_SERVER_RECOVERY_AUTHORITY" ||
    issued.oneUse !==
      true ||
    issued.legalCertification !==
      false
  ) {
    throw new Error(
      "HBCE_PASSWORD_RECOVERY_AUTHORITY_ISSUED_GRANT_INVALID"
    );
  }

  return {
    recoveryToken:
      issued.recoveryToken,

    scope:
      "PASSWORD_ROTATION",

    issuerKind:
      "HBCE_SERVER_RECOVERY_AUTHORITY",

    issuedAt:
      issued.issuedAt,

    notBefore:
      issued.notBefore,

    expiresAt:
      issued.expiresAt,

    ttlSeconds:
      issued.ttlSeconds,

    authorityVerified:
      true,

    authorityMode:
      "SERVER_SECRET_R_AND_D_V1",

    oneUse:
      true,

    publicSelfService:
      false,

    credentialCreationAuthority:
      false,

    sessionCreationAuthority:
      false,

    automaticLogin:
      false,

    legalCertification:
      false
  };
}


export function describeIprPasswordRecoveryAuthority() {
  const configuredSecret =
    process.env
      .HBCE_PASSWORD_RECOVERY_AUTHORITY_SECRET;

  const authorityRef =
    (
      process.env
        .HBCE_PASSWORD_RECOVERY_AUTHORITY_REF ||
      ""
    ).trim();

  return {
    ...IPR_PASSWORD_RECOVERY_AUTHORITY_BOUNDARY,

    enabled:
      readEnabledFlag(),

    secretConfigured:
      (
        typeof configuredSecret ===
          "string" &&
        configuredSecret.trim().length >
          0 &&
        Buffer.byteLength(
          configuredSecret,
          "utf8"
        ) >=
          IPR_PASSWORD_RECOVERY_AUTHORITY_BOUNDARY
            .minimumSecretBytes
      ),

    authorityReferenceConfigured:
      authorityRef.length >=
        8 &&
      authorityRef.length <=
        200,

    secretValueExposed:
      false,

    authorityReferenceValueExposed:
      false,

    legalCertification:
      false
  } as const;
}


export async function issueServerVerifiedIprPasswordRecoveryGrant(
  input:
    IssueServerVerifiedIprPasswordRecoveryGrantInput
): Promise<
  ServerVerifiedIprPasswordRecoveryGrant
> {

  const humanIpr =
    assertValidHumanIpr(
      input.humanIpr
    );

  /*
   * Verification occurs BEFORE grant issuance.
   *
   * No boolean supplied by a caller can bypass this gate.
   */
  const verifiedAuthority =
    verifyServerRecoveryAuthority(
      input.presentedAuthoritySecret
    );

  const issued =
    await issueIprPasswordRecoveryGrant({
      humanIpr,

      issuerAuthorityRef:
        verifiedAuthority
          .authorityRef,

      issuerKind:
        verifiedAuthority
          .issuerKind,

      ttlSeconds:
        input.ttlSeconds,

      notBefore:
        input.notBefore
    });

  return mapIssuedGrant(
    issued
  );
}
