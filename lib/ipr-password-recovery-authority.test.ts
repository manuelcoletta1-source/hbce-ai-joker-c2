import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi
} from "vitest";


const {
  mockIssueRecoveryGrant
} = vi.hoisted(() => ({
  mockIssueRecoveryGrant:
    vi.fn()
}));


vi.mock(
  "@/lib/ipr-password-recovery-store",
  () => ({
    issueIprPasswordRecoveryGrant:
      mockIssueRecoveryGrant
  })
);


import {
  describeIprPasswordRecoveryAuthority,
  issueServerVerifiedIprPasswordRecoveryGrant,
  IPR_PASSWORD_RECOVERY_AUTHORITY_BOUNDARY
} from "@/lib/ipr-password-recovery-authority";


const ORIGINAL_ENABLED =
  process.env
    .HBCE_PASSWORD_RECOVERY_AUTHORITY_ENABLED;

const ORIGINAL_SECRET =
  process.env
    .HBCE_PASSWORD_RECOVERY_AUTHORITY_SECRET;

const ORIGINAL_REF =
  process.env
    .HBCE_PASSWORD_RECOVERY_AUTHORITY_REF;


const HUMAN_IPR =
  "IPR-AAAAAAAAAAAA";

const VALID_SECRET =
  "HBCE-RECOVERY-AUTHORITY-TEST-SECRET-0123456789-ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const AUTHORITY_REF =
  "HBCE-R_AND_D-RECOVERY-AUTHORITY-TEST-001";


function configureValidAuthority() {
  process.env
    .HBCE_PASSWORD_RECOVERY_AUTHORITY_ENABLED =
      "true";

  process.env
    .HBCE_PASSWORD_RECOVERY_AUTHORITY_SECRET =
      VALID_SECRET;

  process.env
    .HBCE_PASSWORD_RECOVERY_AUTHORITY_REF =
      AUTHORITY_REF;
}


beforeEach(() => {
  mockIssueRecoveryGrant
    .mockReset();

  configureValidAuthority();

  mockIssueRecoveryGrant
    .mockResolvedValue({
      recoveryToken:
        "HBCE_TEST_ONE_USE_RECOVERY_TOKEN",

      scope:
        "PASSWORD_ROTATION",

      issuerKind:
        "HBCE_SERVER_RECOVERY_AUTHORITY",

      issuedAt:
        "2026-08-28T20:55:00.000Z",

      notBefore:
        "2026-08-28T20:55:00.000Z",

      expiresAt:
        "2026-08-28T21:10:00.000Z",

      ttlSeconds:
        900,

      oneUse:
        true,

      legalCertification:
        false
    });
});


afterEach(() => {
  if (
    typeof ORIGINAL_ENABLED ===
      "string"
  ) {
    process.env
      .HBCE_PASSWORD_RECOVERY_AUTHORITY_ENABLED =
        ORIGINAL_ENABLED;
  } else {
    delete process.env
      .HBCE_PASSWORD_RECOVERY_AUTHORITY_ENABLED;
  }

  if (
    typeof ORIGINAL_SECRET ===
      "string"
  ) {
    process.env
      .HBCE_PASSWORD_RECOVERY_AUTHORITY_SECRET =
        ORIGINAL_SECRET;
  } else {
    delete process.env
      .HBCE_PASSWORD_RECOVERY_AUTHORITY_SECRET;
  }

  if (
    typeof ORIGINAL_REF ===
      "string"
  ) {
    process.env
      .HBCE_PASSWORD_RECOVERY_AUTHORITY_REF =
        ORIGINAL_REF;
  } else {
    delete process.env
      .HBCE_PASSWORD_RECOVERY_AUTHORITY_REF;
  }
});


describe(
  "HBCE server-verified password recovery authority",
  () => {

    it(
      "fails closed when recovery authority is disabled and never issues a grant",
      async () => {

        process.env
          .HBCE_PASSWORD_RECOVERY_AUTHORITY_ENABLED =
            "false";

        await expect(
          issueServerVerifiedIprPasswordRecoveryGrant({
            humanIpr:
              HUMAN_IPR,

            presentedAuthoritySecret:
              VALID_SECRET
          })
        ).rejects.toThrow(
          "HBCE_PASSWORD_RECOVERY_AUTHORITY_DISABLED"
        );

        expect(
          mockIssueRecoveryGrant
        ).not.toHaveBeenCalled();
      }
    );


    it(
      "fails closed when the configured authority secret is missing or too short",
      async () => {

        delete process.env
          .HBCE_PASSWORD_RECOVERY_AUTHORITY_SECRET;

        await expect(
          issueServerVerifiedIprPasswordRecoveryGrant({
            humanIpr:
              HUMAN_IPR,

            presentedAuthoritySecret:
              VALID_SECRET
          })
        ).rejects.toThrow(
          "HBCE_PASSWORD_RECOVERY_AUTHORITY_SECRET_REQUIRED"
        );

        expect(
          mockIssueRecoveryGrant
        ).not.toHaveBeenCalled();

        process.env
          .HBCE_PASSWORD_RECOVERY_AUTHORITY_SECRET =
            "too-short";

        await expect(
          issueServerVerifiedIprPasswordRecoveryGrant({
            humanIpr:
              HUMAN_IPR,

            presentedAuthoritySecret:
              "too-short"
          })
        ).rejects.toThrow(
          "HBCE_PASSWORD_RECOVERY_AUTHORITY_SECRET_TOO_SHORT"
        );

        expect(
          mockIssueRecoveryGrant
        ).not.toHaveBeenCalled();
      }
    );


    it(
      "denies an incorrect presented authority secret before grant issuance",
      async () => {

        await expect(
          issueServerVerifiedIprPasswordRecoveryGrant({
            humanIpr:
              HUMAN_IPR,

            presentedAuthoritySecret:
              "WRONG-RECOVERY-AUTHORITY-SECRET-0123456789-ABCDEFGHIJKLMNOPQRSTUVWXYZ"
          })
        ).rejects.toThrow(
          "HBCE_PASSWORD_RECOVERY_AUTHORITY_DENIED"
        );

        expect(
          mockIssueRecoveryGrant
        ).not.toHaveBeenCalled();
      }
    );


    it(
      "issues a one-use password rotation grant only after server-side authority verification",
      async () => {

        const result =
          await issueServerVerifiedIprPasswordRecoveryGrant({
            humanIpr:
              " ipr-aaaaaaaaaaaa ",

            presentedAuthoritySecret:
              VALID_SECRET,

            ttlSeconds:
              900,

            notBefore:
              "2026-08-28T20:55:00.000Z"
          });

        expect(
          mockIssueRecoveryGrant
        ).toHaveBeenCalledTimes(
          1
        );

        expect(
          mockIssueRecoveryGrant
        ).toHaveBeenCalledWith({
          humanIpr:
            HUMAN_IPR,

          issuerAuthorityRef:
            AUTHORITY_REF,

          issuerKind:
            "HBCE_SERVER_RECOVERY_AUTHORITY",

          ttlSeconds:
            900,

          notBefore:
            "2026-08-28T20:55:00.000Z"
        });

        expect(result).toEqual({
          recoveryToken:
            "HBCE_TEST_ONE_USE_RECOVERY_TOKEN",

          scope:
            "PASSWORD_ROTATION",

          issuerKind:
            "HBCE_SERVER_RECOVERY_AUTHORITY",

          issuedAt:
            "2026-08-28T20:55:00.000Z",

          notBefore:
            "2026-08-28T20:55:00.000Z",

          expiresAt:
            "2026-08-28T21:10:00.000Z",

          ttlSeconds:
            900,

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
        });
      }
    );


    it(
      "describes configuration state without exposing authority secret or authority reference values",
      () => {

        const description =
          describeIprPasswordRecoveryAuthority();

        expect(description).toMatchObject({
          revision:
            "HBCE-IPR-PASSWORD-RECOVERY-AUTHORITY-v1_0",

          authorityMode:
            "SERVER_SECRET_R_AND_D_V1",

          enabled:
            true,

          secretConfigured:
            true,

          authorityReferenceConfigured:
            true,

          secretValueExposed:
            false,

          authorityReferenceValueExposed:
            false,

          publicSelfServiceAuthority:
            false,

          clientHandoffAuthority:
            false,

          userSelfAssertionAuthority:
            false,

          authorityVerificationPerformedHere:
            true,

          legalCertification:
            false
        });

        const serialized =
          JSON.stringify(
            description
          );

        expect(
          serialized
        ).not.toContain(
          VALID_SECRET
        );

        expect(
          serialized
        ).not.toContain(
          AUTHORITY_REF
        );

        expect(
          IPR_PASSWORD_RECOVERY_AUTHORITY_BOUNDARY
            .passwordRotationExecutionAuthority
        ).toBe(false);

        expect(
          IPR_PASSWORD_RECOVERY_AUTHORITY_BOUNDARY
            .sessionCreationAuthority
        ).toBe(false);

        expect(
          IPR_PASSWORD_RECOVERY_AUTHORITY_BOUNDARY
            .automaticLoginAuthority
        ).toBe(false);
      }
    );


    it(
      "fails closed when the governed grant store returns a grant outside the authority contract",
      async () => {

        mockIssueRecoveryGrant
          .mockResolvedValueOnce({
            recoveryToken:
              "INVALID_TEST_TOKEN",

            scope:
              "PASSWORD_ROTATION",

            issuerKind:
              "UNTRUSTED_ISSUER",

            issuedAt:
              "2026-08-28T20:55:00.000Z",

            notBefore:
              "2026-08-28T20:55:00.000Z",

            expiresAt:
              "2026-08-28T21:10:00.000Z",

            ttlSeconds:
              900,

            oneUse:
              true,

            legalCertification:
              false
          });

        await expect(
          issueServerVerifiedIprPasswordRecoveryGrant({
            humanIpr:
              HUMAN_IPR,

            presentedAuthoritySecret:
              VALID_SECRET
          })
        ).rejects.toThrow(
          "HBCE_PASSWORD_RECOVERY_AUTHORITY_ISSUED_GRANT_INVALID"
        );

        expect(
          mockIssueRecoveryGrant
        ).toHaveBeenCalledTimes(
          1
        );
      }
    );
  }
);
