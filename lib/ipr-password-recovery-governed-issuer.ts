import {
  HBCE_SELF_PILOT_HUMAN_IPR
} from "@/lib/ipr-database-schema";

import {
  IPR_PASSWORD_RECOVERY_BOUNDARY
} from "@/lib/ipr-password-recovery-store";

import {
  issueServerVerifiedIprPasswordRecoveryGrant,
  type ServerVerifiedIprPasswordRecoveryGrant
} from "@/lib/ipr-password-recovery-authority";

import {
  runSelfPilotPasswordRecoveryPreflight
} from "@/lib/ipr-password-recovery-preflight";


export const IPR_PASSWORD_RECOVERY_GOVERNED_ISSUER_BOUNDARY = {
  revision:
    "HBCE-IPR-PASSWORD-RECOVERY-GOVERNED-ISSUER-v1_0",

  mode:
    "SELF_PILOT_SERVER_GOVERNED_GRANT_ISSUANCE",

  subjectSource:
    "SERVER_CANONICAL_SELF_PILOT",

  acceptsClientHumanIpr:
    false,

  acceptsTtlOverride:
    false,

  acceptsNotBeforeOverride:
    false,

  fixedTtlSeconds:
    IPR_PASSWORD_RECOVERY_BOUNDARY
      .defaultTtlSeconds,

  persistencePreflightRequired:
    true,

  serverVerifiedAuthorityRequired:
    true,

  publicSelfService:
    false,

  httpIngressDefinedHere:
    false,

  authoritySecretLoggingAllowed:
    false,

  recoveryTokenLoggingAllowed:
    false,

  passwordRotationAuthority:
    false,

  credentialCreationAuthority:
    false,

  sessionCreationAuthority:
    false,

  automaticLogin:
    false,

  legalCertification:
    false
} as const;


export type IssueGovernedSelfPilotPasswordRecoveryGrantInput = {
  presentedAuthoritySecret:
    string;
};


function assertIssuedGrantInvariant(
  grant:
    ServerVerifiedIprPasswordRecoveryGrant
): void {

  if (
    grant.scope !==
      "PASSWORD_ROTATION" ||
    grant.issuerKind !==
      "HBCE_SERVER_RECOVERY_AUTHORITY" ||
    grant.authorityVerified !==
      true ||
    grant.oneUse !==
      true ||
    grant.publicSelfService !==
      false ||
    grant.credentialCreationAuthority !==
      false ||
    grant.sessionCreationAuthority !==
      false ||
    grant.automaticLogin !==
      false ||
    grant.legalCertification !==
      false ||
    grant.ttlSeconds !==
      IPR_PASSWORD_RECOVERY_GOVERNED_ISSUER_BOUNDARY
        .fixedTtlSeconds
  ) {
    throw new Error(
      "HBCE_PASSWORD_RECOVERY_GOVERNED_ISSUER_GRANT_INVARIANT_FAILED"
    );
  }
}


export async function issueGovernedSelfPilotPasswordRecoveryGrant(
  input:
    IssueGovernedSelfPilotPasswordRecoveryGrantInput
): Promise<
  ServerVerifiedIprPasswordRecoveryGrant
> {

  /*
   * Persistence and configuration must be physically
   * proven before any recovery grant may be issued.
   */
  const preflight =
    await runSelfPilotPasswordRecoveryPreflight();

  if (
    preflight.ok !==
      true ||
    preflight.status !==
      "PASS" ||
    preflight.readyForGovernedGrantIssuance !==
      true ||
    preflight.persistentSubjectExists !==
      true ||
    preflight.persistentProfileExists !==
      true ||
    preflight.persistentCredentialExists !==
      true ||
    preflight.profileLegalCertificationFalse !==
      true ||
    preflight.credentialLegalCertificationFalse !==
      true ||
    preflight.legalCertification !==
      false
  ) {
    throw new Error(
      "HBCE_PASSWORD_RECOVERY_GOVERNED_ISSUER_PREFLIGHT_FAILED"
    );
  }

  /*
   * The caller cannot choose the subject, TTL or notBefore.
   *
   * Authority verification remains delegated to the
   * dedicated server recovery authority module.
   */
  const grant =
    await issueServerVerifiedIprPasswordRecoveryGrant({
      humanIpr:
        HBCE_SELF_PILOT_HUMAN_IPR,

      presentedAuthoritySecret:
        input.presentedAuthoritySecret,

      ttlSeconds:
        IPR_PASSWORD_RECOVERY_GOVERNED_ISSUER_BOUNDARY
          .fixedTtlSeconds
    });

  assertIssuedGrantInvariant(
    grant
  );

  return grant;
}
