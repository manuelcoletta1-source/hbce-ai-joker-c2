import {
  beforeEach,
  describe,
  expect,
  it,
  vi
} from "vitest";

import {
  NextRequest
} from "next/server";


const {
  mockInspectRecovery,
  mockRecordRecoveryFailure,
  mockExecuteRecovery,
  mockResolveClientIp
} = vi.hoisted(() => ({
  mockInspectRecovery:
    vi.fn(),

  mockRecordRecoveryFailure:
    vi.fn(),

  mockExecuteRecovery:
    vi.fn(),

  mockResolveClientIp:
    vi.fn()
}));


vi.mock(
  "@/lib/ipr-auth-rate-limit-store",
  () => ({
    describeIprAuthRateLimitStore:
      () => ({
        revision:
          "HBCE-IPR-AUTH-RATE-LIMIT-v1_0",

        passwordRecoveryKeyDomain:
          "HBCE_C5X_PASSWORD_RECOVERY",

        passwordRecoveryBucketsShareLoginKeys:
          false,

        passwordRecoveryResetOnSuccess:
          false,

        legalCertification:
          false
      }),

    resolveIprAuthRateLimitClientIp:
      mockResolveClientIp,

    getDefaultIprAuthRateLimitStore:
      () => ({
        inspectPasswordRecoveryAsync:
          mockInspectRecovery,

        recordPasswordRecoveryFailureAsync:
          mockRecordRecoveryFailure
      })
  })
);


vi.mock(
  "@/lib/ipr-password-recovery-authority",
  () => ({
    describeIprPasswordRecoveryAuthority:
      () => ({
        revision:
          "HBCE-IPR-PASSWORD-RECOVERY-AUTHORITY-v1_0",

        authorityMode:
          "SERVER_SECRET_R_AND_D_V1",

        publicSelfServiceAuthority:
          false,

        legalCertification:
          false
      })
  })
);


vi.mock(
  "@/lib/ipr-password-recovery-store",
  () => ({
    describeIprPasswordRecoveryStore:
      () => ({
        revision:
          "HBCE-IPR-PASSWORD-RECOVERY-v1_0",

        scope:
          "PASSWORD_ROTATION",

        oneUse:
          true,

        legalCertification:
          false
      })
  })
);


vi.mock(
  "@/lib/ipr-password-recovery-transaction",
  () => ({
    describeIprPasswordRecoveryTransaction:
      () => ({
        revision:
          "HBCE-IPR-PASSWORD-RECOVERY-TRANSACTION-v1_0",

        credentialMutation:
          "UPDATE_EXISTING_ONLY",

        sessionCreationAuthority:
          false,

        automaticLoginAfterRecovery:
          false,

        legalCertification:
          false
      }),

    executeIprPasswordRecovery:
      mockExecuteRecovery
  })
);


import {
  GET,
  POST
} from "./route";


const HUMAN_IPR =
  "IPR-AAAAAAAAAAAA";

const VALID_TOKEN =
  "A".repeat(64);

const STRONG_PASSWORD =
  "ZetaFlux#4821Omega";


function request(
  body:
    Record<string, unknown>
) {
  return new NextRequest(
    "http://localhost/api/auth/ipr-password-recovery",
    {
      method:
        "POST",

      headers: {
        "content-type":
          "application/json",

        "x-forwarded-for":
          "203.0.113.44"
      },

      body:
        JSON.stringify(
          body
        )
    }
  );
}


function unblockedState() {
  return {
    blocked:
      false,

    blockedKinds:
      [],

    blockedUntil:
      null,

    ip:
      null,

    iprIp:
      null,

    legalCertification:
      false
  };
}


beforeEach(() => {
  vi.clearAllMocks();

  mockResolveClientIp
    .mockReturnValue(
      "203.0.113.44"
    );

  mockInspectRecovery
    .mockResolvedValue(
      unblockedState()
    );

  mockRecordRecoveryFailure
    .mockResolvedValue(
      unblockedState()
    );

  mockExecuteRecovery
    .mockResolvedValue({
      humanIpr:
        HUMAN_IPR,

      passwordUpdatedAt:
        "2026-08-28T21:30:00.000Z",

      revokedPersistentSessions:
        2,

      revokedProcessSessions:
        1,

      processFallbackSynchronization:
        "SYNCHRONIZED",

      processFallbackCleared:
        false,

      grantConsumed:
        true,

      sessionCreated:
        false,

      automaticLogin:
        false,

      transactionCommitted:
        true,

      legalCertification:
        false
    });
});


describe(
  "HBCE password recovery HTTP ingress",
  () => {

    it(
      "publishes a rotate-only boundary with no HTTP grant issuance or automatic login",
      async () => {

        const response =
          await GET();

        const payload =
          await response.json();

        expect(
          response.status
        ).toBe(200);

        expect(
          payload
        ).toMatchObject({
          ok:
            true,

          route:
            "/api/auth/ipr-password-recovery",

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

          legalCertification:
            false
        });
      }
    );


    it(
      "throttles before recovery execution when the recovery-specific bucket is blocked",
      async () => {

        mockInspectRecovery
          .mockResolvedValueOnce({
            ...unblockedState(),

            blocked:
              true,

            blockedKinds: [
              "IPR_IP"
            ],

            blockedUntil:
              "2026-08-28T22:00:00.000Z"
          });

        const response =
          await POST(
            request({
              humanIpr:
                HUMAN_IPR,

              recoveryToken:
                VALID_TOKEN,

              newPassword:
                STRONG_PASSWORD
            })
          );

        const payload =
          await response.json();

        expect(
          response.status
        ).toBe(429);

        expect(
          payload.reason
        ).toBe(
          "IPR_PASSWORD_RECOVERY_THROTTLED"
        );

        expect(
          mockExecuteRecovery
        ).not.toHaveBeenCalled();

        expect(
          mockRecordRecoveryFailure
        ).not.toHaveBeenCalled();
      }
    );


    it(
      "records malformed recovery tokens and returns only the generic recovery failure",
      async () => {

        const response =
          await POST(
            request({
              humanIpr:
                HUMAN_IPR,

              recoveryToken:
                "malformed-token",

              newPassword:
                STRONG_PASSWORD
            })
          );

        const payload =
          await response.json();

        expect(
          response.status
        ).toBe(401);

        expect(
          payload
        ).toMatchObject({
          ok:
            false,

          authenticated:
            false,

          authorized:
            false,

          reason:
            "IPR_PASSWORD_RECOVERY_FAILED",

          sessionCreated:
            false,

          automaticLogin:
            false,

          legalCertification:
            false
        });

        expect(
          mockRecordRecoveryFailure
        ).toHaveBeenCalledWith({
          humanIpr:
            HUMAN_IPR,

          clientIp:
            "203.0.113.44"
        });

        expect(
          mockExecuteRecovery
        ).not.toHaveBeenCalled();

        const serialized =
          JSON.stringify(
            payload
          );

        expect(
          serialized
        ).not.toContain(
          "malformed-token"
        );
      }
    );


    it(
      "rejects a weak new password without validating or consuming the recovery grant",
      async () => {

        const response =
          await POST(
            request({
              humanIpr:
                HUMAN_IPR,

              recoveryToken:
                VALID_TOKEN,

              newPassword:
                "weak"
            })
          );

        const payload =
          await response.json();

        expect(
          response.status
        ).toBe(400);

        expect(
          payload.reason
        ).toBe(
          "IPR_PASSWORD_POLICY_FAILED"
        );

        expect(
          payload.passwordPolicy
            .valid
        ).toBe(false);

        expect(
          mockExecuteRecovery
        ).not.toHaveBeenCalled();

        expect(
          mockRecordRecoveryFailure
        ).not.toHaveBeenCalled();
      }
    );


    it(
      "commits password recovery without authenticating, authorizing, creating a cookie or resetting recovery abuse evidence",
      async () => {

        const response =
          await POST(
            request({
              humanIpr:
                " ipr-aaaaaaaaaaaa ",

              recoveryToken:
                VALID_TOKEN,

              newPassword:
                STRONG_PASSWORD
            })
          );

        const payload =
          await response.json();

        expect(
          response.status
        ).toBe(200);

        expect(
          payload
        ).toMatchObject({
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
            HUMAN_IPR,

          grantConsumed:
            true,

          transactionCommitted:
            true,

          sessionCreated:
            false,

          automaticLogin:
            false,

          loginRequired:
            true,

          legalCertification:
            false
        });

        expect(
          mockExecuteRecovery
        ).toHaveBeenCalledTimes(
          1
        );

        expect(
          mockExecuteRecovery
        ).toHaveBeenCalledWith({
          humanIpr:
            HUMAN_IPR,

          recoveryToken:
            VALID_TOKEN,

          newPassword:
            STRONG_PASSWORD
        });

        /*
         * A successful recovery must not erase
         * recovery-abuse evidence.
         */
        expect(
          mockRecordRecoveryFailure
        ).not.toHaveBeenCalled();

        expect(
          response.headers.get(
            "set-cookie"
          )
        ).toBeNull();

        /*
         * Internal revocation counts and volatile fallback
         * synchronization state are not part of the public
         * recovery response.
         */
        expect(
          payload
        ).not.toHaveProperty(
          "revokedPersistentSessions"
        );

        expect(
          payload
        ).not.toHaveProperty(
          "revokedProcessSessions"
        );

        expect(
          payload
        ).not.toHaveProperty(
          "processFallbackSynchronization"
        );

        expect(
          payload
        ).not.toHaveProperty(
          "processFallbackCleared"
        );
      }
    );


    it(
      "maps internal grant, credential and transaction failures to one anti-enumeration response",
      async () => {

        mockExecuteRecovery
          .mockRejectedValueOnce(
            new Error(
              "HBCE_PASSWORD_RECOVERY_TRANSACTION_FAILED"
            )
          );

        const response =
          await POST(
            request({
              humanIpr:
                HUMAN_IPR,

              recoveryToken:
                VALID_TOKEN,

              newPassword:
                STRONG_PASSWORD
            })
          );

        const payload =
          await response.json();

        expect(
          response.status
        ).toBe(401);

        expect(
          payload.reason
        ).toBe(
          "IPR_PASSWORD_RECOVERY_FAILED"
        );

        expect(
          mockRecordRecoveryFailure
        ).toHaveBeenCalledTimes(
          1
        );

        const serialized =
          JSON.stringify(
            payload
          );

        expect(
          serialized
        ).not.toContain(
          "TRANSACTION_FAILED"
        );

        expect(
          serialized
        ).not.toContain(
          "EXISTING_CREDENTIAL_REQUIRED"
        );

        expect(
          serialized
        ).not.toContain(
          "HBCE_PASSWORD_RECOVERY_GRANT"
        );

        expect(
          serialized
        ).not.toContain(
          "GRANT_INVALID"
        );

        expect(
          serialized
        ).not.toContain(
          "GRANT_EXPIRED"
        );

        expect(
          serialized
        ).not.toContain(
          "GRANT_CONSUMED"
        );

        expect(
          serialized
        ).not.toContain(
          "GRANT_CONSUMPTION_INVALID"
        );

        expect(
          serialized
        ).not.toContain(
          VALID_TOKEN
        );
      }
    );


    it(
      "fails closed when recovery failure governance cannot be persisted",
      async () => {

        mockExecuteRecovery
          .mockRejectedValueOnce(
            new Error(
              "HBCE_PASSWORD_RECOVERY_TRANSACTION_FAILED"
            )
          );

        mockRecordRecoveryFailure
          .mockRejectedValueOnce(
            new Error(
              "HBCE_TEST_RATE_LIMIT_WRITE_FAILURE"
            )
          );

        const response =
          await POST(
            request({
              humanIpr:
                HUMAN_IPR,

              recoveryToken:
                VALID_TOKEN,

              newPassword:
                STRONG_PASSWORD
            })
          );

        const payload =
          await response.json();

        expect(
          response.status
        ).toBe(503);

        expect(
          payload.reason
        ).toBe(
          "IPR_PASSWORD_RECOVERY_RATE_LIMIT_UNAVAILABLE"
        );

        expect(
          payload.authenticated
        ).toBe(false);

        expect(
          payload.sessionCreated
        ).toBe(false);

        expect(
          payload.automaticLogin
        ).toBe(false);
      }
    );


    it(
      "reports infrastructure unavailability without pretending the recovery failed authorization",
      async () => {

        mockExecuteRecovery
          .mockRejectedValueOnce(
            new Error(
              "HBCE_PASSWORD_RECOVERY_DATABASE_NOT_CONFIGURED"
            )
          );

        const response =
          await POST(
            request({
              humanIpr:
                HUMAN_IPR,

              recoveryToken:
                VALID_TOKEN,

              newPassword:
                STRONG_PASSWORD
            })
          );

        const payload =
          await response.json();

        expect(
          response.status
        ).toBe(503);

        expect(
          payload.reason
        ).toBe(
          "IPR_PASSWORD_RECOVERY_UNAVAILABLE"
        );

        expect(
          mockRecordRecoveryFailure
        ).not.toHaveBeenCalled();

        expect(
          payload.authenticated
        ).toBe(false);

        expect(
          payload.sessionCreated
        ).toBe(false);
      }
    );
  }
);
