import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi
} from "vitest";


const mocks = vi.hoisted(() => ({
  governedIssuer:
    vi.fn()
}));


vi.mock(
  "@/lib/ipr-password-recovery-governed-issuer",
  () => ({
    issueGovernedSelfPilotPasswordRecoveryGrant:
      mocks.governedIssuer
  })
);


import {
  IPR_PASSWORD_RECOVERY_PRODUCTION_ISSUER_BOUNDARY,
  issueProductionGovernedSelfPilotPasswordRecoveryGrant
} from "@/lib/ipr-password-recovery-production-issuer";


const ENV_NAME =
  "HBCE_PASSWORD_RECOVERY_AUTHORITY_SECRET";

const VALID_SECRET =
  "HBCE-PRODUCTION-RECOVERY-AUTHORITY-0123456789-ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const originalSecret =
  process.env[
    ENV_NAME
  ];


function validGrant() {
  return {
    recoveryToken:
      "A".repeat(64),

    scope:
      "PASSWORD_ROTATION",

    issuerKind:
      "HBCE_SERVER_RECOVERY_AUTHORITY",

    issuedAt:
      "2026-08-29T14:00:00.000Z",

    notBefore:
      "2026-08-29T14:00:00.000Z",

    expiresAt:
      "2026-08-29T14:15:00.000Z",

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
  };
}


describe(
  "HBCE production internal password recovery issuer",
  () => {

    beforeEach(() => {
      vi.clearAllMocks();

      process.env[
        ENV_NAME
      ] =
        VALID_SECRET;

      mocks.governedIssuer
        .mockResolvedValue(
          validGrant()
        );
    });


    afterEach(() => {
      if (
        originalSecret ===
          undefined
      ) {
        delete process.env[
          ENV_NAME
        ];
      } else {
        process.env[
          ENV_NAME
        ] =
          originalSecret;
      }
    });


    it(
      "declares a zero-input server-environment-only authority boundary",
      () => {

        expect(
          IPR_PASSWORD_RECOVERY_PRODUCTION_ISSUER_BOUNDARY
        ).toMatchObject({
          acceptsInput:
            false,

          acceptsClientHumanIpr:
            false,

          acceptsClientAuthoritySecret:
            false,

          authoritySecretSource:
            "SERVER_ENVIRONMENT_ONLY",

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
        });
      }
    );


    it(
      "fails closed when the production recovery authority secret is missing",
      async () => {

        delete process.env[
          ENV_NAME
        ];

        await expect(
          issueProductionGovernedSelfPilotPasswordRecoveryGrant()
        ).rejects.toThrow(
          "HBCE_PASSWORD_RECOVERY_PRODUCTION_AUTHORITY_UNAVAILABLE"
        );

        expect(
          mocks.governedIssuer
        ).not.toHaveBeenCalled();
      }
    );


    it(
      "fails closed when the production recovery authority secret is shorter than the minimum",
      async () => {

        process.env[
          ENV_NAME
        ] =
          "too-short";

        await expect(
          issueProductionGovernedSelfPilotPasswordRecoveryGrant()
        ).rejects.toThrow(
          "HBCE_PASSWORD_RECOVERY_PRODUCTION_AUTHORITY_UNAVAILABLE"
        );

        expect(
          mocks.governedIssuer
        ).not.toHaveBeenCalled();
      }
    );


    it(
      "passes the authority secret only internally to the governed issuer",
      async () => {

        await issueProductionGovernedSelfPilotPasswordRecoveryGrant();

        expect(
          mocks.governedIssuer
        ).toHaveBeenCalledTimes(
          1
        );

        expect(
          mocks.governedIssuer
        ).toHaveBeenCalledWith({
          presentedAuthoritySecret:
            VALID_SECRET
        });
      }
    );


    it(
      "returns the governed one-use grant unchanged",
      async () => {

        const expected =
          validGrant();

        mocks.governedIssuer
          .mockResolvedValue(
            expected
          );

        const result =
          await issueProductionGovernedSelfPilotPasswordRecoveryGrant();

        expect(
          result
        ).toEqual(
          expected
        );

        expect(
          result.oneUse
        ).toBe(true);

        expect(
          result.publicSelfService
        ).toBe(false);

        expect(
          result.sessionCreationAuthority
        ).toBe(false);

        expect(
          result.automaticLogin
        ).toBe(false);

        expect(
          result.legalCertification
        ).toBe(false);
      }
    );
  }
);
