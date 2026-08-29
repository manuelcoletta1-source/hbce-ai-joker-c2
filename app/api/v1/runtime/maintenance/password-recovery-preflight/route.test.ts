import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi
} from "vitest";

import {
  NextRequest
} from "next/server";


const mocks = vi.hoisted(() => ({
  runPreflight:
    vi.fn()
}));


vi.mock(
  "@/lib/ipr-password-recovery-preflight",
  () => ({
    runSelfPilotPasswordRecoveryPreflight:
      mocks.runPreflight
  })
);


import {
  GET
} from "./route";


const ENV_NAME =
  "HBCE_PASSWORD_RECOVERY_PREFLIGHT_SECRET";

const HEADER_NAME =
  "x-hbce-password-recovery-preflight-secret";

const VALID_SECRET =
  "HBCE-RECOVERY-PREFLIGHT-SECRET-0123456789-ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const originalSecret =
  process.env[
    ENV_NAME
  ];


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


function request(
  secret?: string,
  query?: string
): NextRequest {

  const headers:
    Record<string, string> = {};

  if (
    secret !==
      undefined
  ) {
    headers[
      HEADER_NAME
    ] = secret;
  }

  const suffix =
    query
      ? `?${query}`
      : "";

  return new NextRequest(
    `https://hbce.example/api/v1/runtime/maintenance/password-recovery-preflight${suffix}`,
    {
      method:
        "GET",

      headers
    }
  );
}


describe(
  "HBCE password recovery persistent preflight maintenance route",
  () => {

    beforeEach(() => {
      vi.clearAllMocks();

      process.env[
        ENV_NAME
      ] =
        VALID_SECRET;

      mocks.runPreflight
        .mockResolvedValue(
          passingPreflight()
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
      "rejects all query parameters before executing the recovery preflight",
      async () => {

        const response =
          await GET(
            request(
              VALID_SECRET,
              "humanIpr=IPR-CLIENT-CONTROLLED"
            )
          );

        const body =
          await response.json();

        expect(
          response.status
        ).toBe(
          400
        );

        expect(
          body
        ).toEqual({
          ok:
            false,

          reason:
            "PARAMETERS_NOT_ALLOWED",

          legalCertification:
            false
        });

        expect(
          mocks.runPreflight
        ).not.toHaveBeenCalled();
      }
    );


    it(
      "fails closed when the dedicated preflight authority secret is not configured",
      async () => {

        delete process.env[
          ENV_NAME
        ];

        const response =
          await GET(
            request(
              VALID_SECRET
            )
          );

        const body =
          await response.json();

        expect(
          response.status
        ).toBe(
          503
        );

        expect(
          body.reason
        ).toBe(
          "RECOVERY_PREFLIGHT_AUTHORITY_UNAVAILABLE"
        );

        expect(
          body.legalCertification
        ).toBe(false);

        expect(
          mocks.runPreflight
        ).not.toHaveBeenCalled();
      }
    );


    it(
      "denies a missing or incorrect preflight secret without executing the database preflight",
      async () => {

        const missingResponse =
          await GET(
            request()
          );

        expect(
          missingResponse.status
        ).toBe(
          403
        );

        const wrongResponse =
          await GET(
            request(
              "WRONG-RECOVERY-PREFLIGHT-SECRET"
            )
          );

        expect(
          wrongResponse.status
        ).toBe(
          403
        );

        expect(
          mocks.runPreflight
        ).not.toHaveBeenCalled();
      }
    );


    it(
      "returns PASS only after the dedicated HTTP authority gate and persistent preflight both succeed",
      async () => {

        const response =
          await GET(
            request(
              VALID_SECRET
            )
          );

        const body =
          await response.json();

        expect(
          response.status
        ).toBe(
          200
        );

        expect(
          mocks.runPreflight
        ).toHaveBeenCalledTimes(
          1
        );

        expect(
          body
        ).toMatchObject({
          ok:
            true,

          status:
            "PASS",

          mode:
            "SELF_PILOT_PERSISTENT_RECOVERY_READ_ONLY_PREFLIGHT",

          revision:
            "HBCE-IPR-PASSWORD-RECOVERY-PREFLIGHT-HTTP-v1_0",

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
        });

        expect(
          body.result
        ).toMatchObject({
          persistentSubjectExists:
            true,

          persistentProfileExists:
            true,

          persistentCredentialExists:
            true,

          readyForGovernedGrantIssuance:
            true,

          legalCertification:
            false
        });

        expect(
          JSON.stringify(
            body
          )
        ).not.toContain(
          VALID_SECRET
        );
      }
    );


    it(
      "returns conflict and preserves fail-closed state when persistent recovery evidence is incomplete",
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

        const response =
          await GET(
            request(
              VALID_SECRET
            )
          );

        const body =
          await response.json();

        expect(
          response.status
        ).toBe(
          409
        );

        expect(
          body.ok
        ).toBe(false);

        expect(
          body.status
        ).toBe(
          "FAIL_CLOSED"
        );

        expect(
          body.result
            .persistentCredentialExists
        ).toBe(false);

        expect(
          body.grantIssuance
        ).toBe(false);

        expect(
          body.passwordRotation
        ).toBe(false);

        expect(
          body.legalCertification
        ).toBe(false);
      }
    );


    it(
      "fails closed when preflight execution throws",
      async () => {

        mocks.runPreflight
          .mockRejectedValue(
            new Error(
              "DATABASE_TEST_FAILURE"
            )
          );

        const response =
          await GET(
            request(
              VALID_SECRET
            )
          );

        const body =
          await response.json();

        expect(
          response.status
        ).toBe(
          500
        );

        expect(
          body
        ).toEqual({
          ok:
            false,

          status:
            "FAIL_CLOSED",

          reason:
            "RECOVERY_PREFLIGHT_EXECUTION_FAILED",

          legalCertification:
            false
        });
      }
    );


    it(
      "sets no-store response headers for authorized and denied responses",
      async () => {

        const authorized =
          await GET(
            request(
              VALID_SECRET
            )
          );

        const denied =
          await GET(
            request(
              "INVALID"
            )
          );

        expect(
          authorized.headers.get(
            "cache-control"
          )
        ).toContain(
          "no-store"
        );

        expect(
          denied.headers.get(
            "cache-control"
          )
        ).toContain(
          "no-store"
        );
      }
    );
  }
);
