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
  issueGrant:
    vi.fn()
}));


vi.mock(
  "@/lib/ipr-password-recovery-production-issuer",
  () => ({
    issueProductionGovernedSelfPilotPasswordRecoveryGrant:
      mocks.issueGrant
  })
);


import {
  POST
} from "@/app/api/v1/runtime/maintenance/password-recovery-grant-issuer/route";


const INVOCATION_ENV =
  "HBCE_PASSWORD_RECOVERY_ISSUER_INVOCATION_SECRET";

const VALID_INVOCATION_SECRET =
  "HBCE-RECOVERY-ISSUER-INVOCATION-SECRET-0123456789-ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const originalInvocationSecret =
  process.env[
    INVOCATION_ENV
  ];

const originalVercelEnv =
  process.env
    .VERCEL_ENV;


function createRequest(
  options?: {
    secret?: string;
    body?: string;
    query?: string;
  }
) {

  const query =
    options?.query
      ? `?${options.query}`
      : "";

  const headers =
    new Headers();

  if (
    options?.secret !==
      undefined
  ) {
    headers.set(
      "x-hbce-password-recovery-issuer-secret",
      options.secret
    );
  }

  return new NextRequest(
    `https://hbce.example/api/v1/runtime/maintenance/password-recovery-grant-issuer${query}`,
    {
      method:
        "POST",

      headers,

      body:
        options?.body
    }
  );
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
      "2026-08-29T15:00:00.000Z",

    notBefore:
      "2026-08-29T15:00:00.000Z",

    expiresAt:
      "2026-08-29T15:15:00.000Z",

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
  "HBCE governed production recovery grant HTTP boundary",
  () => {

    beforeEach(() => {
      vi.clearAllMocks();

      process.env
        .VERCEL_ENV =
        "production";

      process.env[
        INVOCATION_ENV
      ] =
        VALID_INVOCATION_SECRET;

      mocks.issueGrant
        .mockResolvedValue(
          validGrant()
        );
    });


    afterEach(() => {
      if (
        originalInvocationSecret ===
          undefined
      ) {
        delete process.env[
          INVOCATION_ENV
        ];
      } else {
        process.env[
          INVOCATION_ENV
        ] =
          originalInvocationSecret;
      }

      if (
        originalVercelEnv ===
          undefined
      ) {
        delete process.env
          .VERCEL_ENV;
      } else {
        process.env
          .VERCEL_ENV =
          originalVercelEnv;
      }
    });


    it(
      "fails closed outside Production",
      async () => {

        process.env
          .VERCEL_ENV =
          "preview";

        const response =
          await POST(
            createRequest({
              secret:
                VALID_INVOCATION_SECRET
            })
          );

        expect(
          response.status
        ).toBe(503);

        expect(
          mocks.issueGrant
        ).not.toHaveBeenCalled();
      }
    );


    it(
      "rejects all query parameters before issuance",
      async () => {

        const response =
          await POST(
            createRequest({
              secret:
                VALID_INVOCATION_SECRET,

              query:
                "humanIpr=IPR-ATTACKER"
            })
          );

        expect(
          response.status
        ).toBe(400);

        expect(
          mocks.issueGrant
        ).not.toHaveBeenCalled();
      }
    );


    it(
      "rejects every non-empty request body",
      async () => {

        const response =
          await POST(
            createRequest({
              secret:
                VALID_INVOCATION_SECRET,

              body:
                JSON.stringify({
                  ttlSeconds:
                    3600
                })
            })
          );

        expect(
          response.status
        ).toBe(400);

        expect(
          mocks.issueGrant
        ).not.toHaveBeenCalled();
      }
    );


    it(
      "fails closed when invocation secret configuration is unavailable",
      async () => {

        delete process.env[
          INVOCATION_ENV
        ];

        const response =
          await POST(
            createRequest({
              secret:
                VALID_INVOCATION_SECRET
            })
          );

        expect(
          response.status
        ).toBe(503);

        expect(
          mocks.issueGrant
        ).not.toHaveBeenCalled();
      }
    );


    it(
      "denies missing or incorrect invocation secrets",
      async () => {

        const missing =
          await POST(
            createRequest()
          );

        expect(
          missing.status
        ).toBe(403);

        const wrong =
          await POST(
            createRequest({
              secret:
                "wrong-secret"
            })
          );

        expect(
          wrong.status
        ).toBe(403);

        expect(
          mocks.issueGrant
        ).not.toHaveBeenCalled();
      }
    );


    it(
      "issues exactly one governed grant for an authorized zero-input request",
      async () => {

        const response =
          await POST(
            createRequest({
              secret:
                VALID_INVOCATION_SECRET
            })
          );

        const json =
          await response.json();

        expect(
          response.status
        ).toBe(200);

        expect(
          mocks.issueGrant
        ).toHaveBeenCalledTimes(
          1
        );

        expect(
          json
        ).toMatchObject({
          ok:
            true,

          status:
            "IPR_PASSWORD_RECOVERY_GRANT_ISSUED",

          recoveryToken:
            "A".repeat(64),

          scope:
            "PASSWORD_ROTATION",

          ttlSeconds:
            900,

          oneUse:
            true,

          authorityVerified:
            true,

          publicSelfService:
            false,

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
        });

        expect(
          response.headers.get(
            "cache-control"
          )
        ).toContain(
          "no-store"
        );
      }
    );


    it(
      "fails closed without exposing internal issuance failure details",
      async () => {

        mocks.issueGrant
          .mockRejectedValue(
            new Error(
              "HBCE_INTERNAL_SENSITIVE_FAILURE"
            )
          );

        const response =
          await POST(
            createRequest({
              secret:
                VALID_INVOCATION_SECRET
            })
          );

        const json =
          await response.json();

        expect(
          response.status
        ).toBe(503);

        expect(
          json.reason
        ).toBe(
          "RECOVERY_GRANT_ISSUANCE_FAILED"
        );

        expect(
          JSON.stringify(
            json
          )
        ).not.toContain(
          "HBCE_INTERNAL_SENSITIVE_FAILURE"
        );
      }
    );
  }
);
