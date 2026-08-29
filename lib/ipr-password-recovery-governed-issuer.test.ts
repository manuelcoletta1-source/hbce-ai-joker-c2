import {
  beforeEach,
  describe,
  expect,
  it,
  vi
} from "vitest";


const mocks = vi.hoisted(() => ({
  runPreflight:
    vi.fn(),

  issueServerGrant:
    vi.fn()
}));


vi.mock(
  "@/lib/ipr-password-recovery-preflight",
  () => ({
    runSelfPilotPasswordRecoveryPreflight:
      mocks.runPreflight
  })
);


vi.mock(
  "@/lib/ipr-password-recovery-authority",
  () => ({
    issueServerVerifiedIprPasswordRecoveryGrant:
      mocks.issueServerGrant
  })
);


import {
  HBCE_SELF_PILOT_HUMAN_IPR
} from "@/lib/ipr-database-schema";

import {
  IPR_PASSWORD_RECOVERY_BOUNDARY
} from "@/lib/ipr-password-recovery-store";

import {
  IPR_PASSWORD_RECOVERY_GOVERNED_ISSUER_BOUNDARY,
  issueGovernedSelfPilotPasswordRecoveryGrant
} from "@/lib/ipr-password-recovery-governed-issuer";


const AUTHORITY_SECRET =
  "TEST-AUTHORITY-SECRET-0123456789-ABCDEFGHIJKLMNOPQRSTUVWXYZ";


function passingPreflight() {
  return {
    ok:
      true,

    status:
      "PASS",

    revision:
      "HBCE-IPR-PASSWORD-RECOVERY-PREFLIGHT-v1_0",

    canonicalSubject:
      true,

    databaseConfigured:
      true,

    recoveryStoreDatabaseConfigured:
      true,

    recoveryHashSecretConfigured:
      true,

    recoveryAuthorityEnabled:
      true,

    recoveryAuthoritySecretConfigured:
      true,

    recoveryAuthorityReferenceConfigured:
      true,

    persistentSubjectExists:
      true,

    persistentProfileExists:
      true,

    persistentCredentialExists:
      true,

    profileLegalCertificationFalse:
      true,

    credentialLegalCertificationFalse:
      true,

    databaseReadOnly:
      true,

    schemaMutation:
      false,

    readyForGovernedGrantIssuance:
      true,

    legalCertification:
      false
  };
}


function validGrant() {
  return {
    recoveryToken:
      "A".repeat(64),

    scope:
      "PASSWORD_ROTATION",

    issuerKind:
      "HBCE_SERVER_RECOVERY_AUTHORITY",

    issuedAt:
      "2026-08-29T12:00:00.000Z",

    notBefore:
      "2026-08-29T12:00:00.000Z",

    expiresAt:
      "2026-08-29T12:15:00.000Z",

    ttlSeconds:
      IPR_PASSWORD_RECOVERY_BOUNDARY
        .defaultTtlSeconds,

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


beforeEach(() => {
  vi.clearAllMocks();

  mocks.runPreflight
    .mockResolvedValue(
      passingPreflight()
    );

  mocks.issueServerGrant
    .mockResolvedValue(
      validGrant()
    );
});


describe(
  "HBCE governed self-pilot password recovery issuer",
  () => {

    it(
      "declares a fixed-subject non-HTTP non-password-mutation boundary",
      () => {

        expect(
          IPR_PASSWORD_RECOVERY_GOVERNED_ISSUER_BOUNDARY
        ).toMatchObject({
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

          persistencePreflightRequired:
            true,

          serverVerifiedAuthorityRequired:
            true,

          publicSelfService:
            false,

          httpIngressDefinedHere:
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
        });
      }
    );


    it(
      "does not call the authority issuer when persistence preflight fails",
      async () => {

        mocks.runPreflight
          .mockResolvedValue({
            ...passingPreflight(),

            ok:
              false,

            status:
              "FAIL_CLOSED",

            persistentCredentialExists:
              false,

            readyForGovernedGrantIssuance:
              false
          });

        await expect(
          issueGovernedSelfPilotPasswordRecoveryGrant({
            presentedAuthoritySecret:
              AUTHORITY_SECRET
          })
        ).rejects.toThrow(
          "HBCE_PASSWORD_RECOVERY_GOVERNED_ISSUER_PREFLIGHT_FAILED"
        );

        expect(
          mocks.issueServerGrant
        ).not.toHaveBeenCalled();
      }
    );


    it(
      "binds issuance to the canonical self-pilot subject and fixed default TTL",
      async () => {

        await issueGovernedSelfPilotPasswordRecoveryGrant({
          presentedAuthoritySecret:
            AUTHORITY_SECRET
        });

        expect(
          mocks.issueServerGrant
        ).toHaveBeenCalledTimes(
          1
        );

        expect(
          mocks.issueServerGrant
        ).toHaveBeenCalledWith({
          humanIpr:
            HBCE_SELF_PILOT_HUMAN_IPR,

          presentedAuthoritySecret:
            AUTHORITY_SECRET,

          ttlSeconds:
            IPR_PASSWORD_RECOVERY_BOUNDARY
              .defaultTtlSeconds
        });
      }
    );


    it(
      "returns the valid server-verified one-use password rotation grant unchanged",
      async () => {

        const result =
          await issueGovernedSelfPilotPasswordRecoveryGrant({
            presentedAuthoritySecret:
              AUTHORITY_SECRET
          });

        expect(
          result
        ).toEqual(
          validGrant()
        );
      }
    );


    it(
      "fails closed if the authority returns a grant with an invalid TTL",
      async () => {

        mocks.issueServerGrant
          .mockResolvedValue({
            ...validGrant(),

            ttlSeconds:
              3600
          });

        await expect(
          issueGovernedSelfPilotPasswordRecoveryGrant({
            presentedAuthoritySecret:
              AUTHORITY_SECRET
          })
        ).rejects.toThrow(
          "HBCE_PASSWORD_RECOVERY_GOVERNED_ISSUER_GRANT_INVARIANT_FAILED"
        );
      }
    );


    it(
      "fails closed if the authority returns a grant that creates session authority",
      async () => {

        mocks.issueServerGrant
          .mockResolvedValue({
            ...validGrant(),

            sessionCreationAuthority:
              true
          });

        await expect(
          issueGovernedSelfPilotPasswordRecoveryGrant({
            presentedAuthoritySecret:
              AUTHORITY_SECRET
          })
        ).rejects.toThrow(
          "HBCE_PASSWORD_RECOVERY_GOVERNED_ISSUER_GRANT_INVARIANT_FAILED"
        );
      }
    );
  }
);
