import {
  issueGovernedSelfPilotPasswordRecoveryGrant
} from "@/lib/ipr-password-recovery-governed-issuer";

import type {
  ServerVerifiedIprPasswordRecoveryGrant
} from "@/lib/ipr-password-recovery-authority";


export const IPR_PASSWORD_RECOVERY_PRODUCTION_ISSUER_BOUNDARY = {
  revision:
    "HBCE-IPR-PASSWORD-RECOVERY-PRODUCTION-ISSUER-v1_0",

  mode:
    "PRODUCTION_INTERNAL_SERVER_AUTHORITY_BINDING",

  acceptsInput:
    false,

  acceptsClientHumanIpr:
    false,

  acceptsClientAuthoritySecret:
    false,

  authoritySecretSource:
    "SERVER_ENVIRONMENT_ONLY",

  authoritySecretEnvironment:
    "HBCE_PASSWORD_RECOVERY_AUTHORITY_SECRET",

  minimumAuthoritySecretBytes:
    32,

  httpIngressDefinedHere:
    false,

  persistencePreflightRequired:
    true,

  governedIssuerRequired:
    true,

  authoritySecretLoggingAllowed:
    false,

  recoveryTokenLoggingAllowed:
    false,

  credentialMutationAuthority:
    false,

  passwordRotationAuthority:
    false,

  sessionCreationAuthority:
    false,

  automaticLogin:
    false,

  legalCertification:
    false
} as const;


function readProductionRecoveryAuthoritySecret():
  string {

  const secret =
    (
      process.env[
        IPR_PASSWORD_RECOVERY_PRODUCTION_ISSUER_BOUNDARY
          .authoritySecretEnvironment
      ] || ""
    ).trim();

  if (
    Buffer.byteLength(
      secret,
      "utf8"
    ) <
    IPR_PASSWORD_RECOVERY_PRODUCTION_ISSUER_BOUNDARY
      .minimumAuthoritySecretBytes
  ) {
    throw new Error(
      "HBCE_PASSWORD_RECOVERY_PRODUCTION_AUTHORITY_UNAVAILABLE"
    );
  }

  return secret;
}


export async function issueProductionGovernedSelfPilotPasswordRecoveryGrant():
  Promise<ServerVerifiedIprPasswordRecoveryGrant> {

  /*
   * The recovery authority secret is resolved exclusively
   * from the server runtime environment.
   *
   * No HTTP request, client body, query parameter or caller
   * may provide or override this value.
   */
  const presentedAuthoritySecret =
    readProductionRecoveryAuthoritySecret();

  /*
   * The downstream governed issuer fixes:
   * - canonical self-pilot subject
   * - TTL
   * - persistence preflight
   * - one-use grant semantics
   * - server authority verification
   */
  return issueGovernedSelfPilotPasswordRecoveryGrant({
    presentedAuthoritySecret
  });
}
