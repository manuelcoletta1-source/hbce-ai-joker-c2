import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi
} from "vitest";

import { NextRequest } from "next/server";

import {
  getProcessIprAuthStore
} from "@/lib/ipr-session-store";

import {
  getProcessIprAccountStore
} from "@/lib/ipr-account-store";

const {
  mockWithHbceDatabaseTransaction
} = vi.hoisted(() => ({
  mockWithHbceDatabaseTransaction:
    vi.fn()
}));

vi.mock(
  "@/lib/ipr-database-transaction",
  () => ({
    withHbceDatabaseTransaction:
      mockWithHbceDatabaseTransaction
  })
);

import { POST } from "./route";

const AUTH_STORE_KIND_ENV =
  "IPR_AUTH_STORE_KIND";

const ACCOUNT_STORE_KIND_ENV =
  "IPR_ACCOUNT_STORE_KIND";

const BOOTSTRAP_ENABLED_ENV =
  "HBCE_IPR_CANONICAL_BOOTSTRAP_ENABLED";

const BOOTSTRAP_SECRET_ENV =
  "HBCE_IPR_CANONICAL_BOOTSTRAP_SECRET";

const CANONICAL_HUMAN_IPR_ENV =
  "HBCE_RUNTIME_CANONICAL_HUMAN_SUBJECT_IPR";

const CERTIFICATE_ID_ENV =
  "HBCE_IPR_CANONICAL_BOOTSTRAP_CERTIFICATE_ID";

const TENANT_ID_ENV =
  "HBCE_IPR_CANONICAL_BOOTSTRAP_TENANT_ID";

const WORKSPACE_ID_ENV =
  "HBCE_IPR_CANONICAL_BOOTSTRAP_WORKSPACE_ID";

const originalEnv = {
  authStoreKind:
    process.env[AUTH_STORE_KIND_ENV],
  accountStoreKind:
    process.env[ACCOUNT_STORE_KIND_ENV],
  bootstrapEnabled:
    process.env[BOOTSTRAP_ENABLED_ENV],
  bootstrapSecret:
    process.env[BOOTSTRAP_SECRET_ENV],
  canonicalHumanIpr:
    process.env[CANONICAL_HUMAN_IPR_ENV],
  certificateId:
    process.env[CERTIFICATE_ID_ENV],
  tenantId:
    process.env[TENANT_ID_ENV],
  workspaceId:
    process.env[WORKSPACE_ID_ENV]
};

function restoreEnv(
  key: string,
  value: string | undefined
) {
  if (typeof value === "string") {
    process.env[key] = value;
  } else {
    delete process.env[key];
  }
}

beforeEach(() => {
  process.env[AUTH_STORE_KIND_ENV] =
    "PROCESS_AUTH_STORE_MVP";

  process.env[ACCOUNT_STORE_KIND_ENV] =
    "PROCESS_ACCOUNT_STORE_MVP";

  process.env[BOOTSTRAP_ENABLED_ENV] =
    "true";

  process.env[BOOTSTRAP_SECRET_ENV] =
    "Expected-Canonical-Secret-2026";

  process.env[CANONICAL_HUMAN_IPR_ENV] =
    "IPR-3";

  process.env[CERTIFICATE_ID_ENV] =
    "CERTIFICATE-09-OPERATIONAL-TEST";

  process.env[TENANT_ID_ENV] =
    "HBCE-TENANT-TEST";

  process.env[WORKSPACE_ID_ENV] =
    "HBCE-WORKSPACE-TEST";

  getProcessIprAuthStore().clear();
  getProcessIprAccountStore().clear();

  mockWithHbceDatabaseTransaction
    .mockReset();
});

afterEach(() => {
  restoreEnv(
    AUTH_STORE_KIND_ENV,
    originalEnv.authStoreKind
  );

  restoreEnv(
    ACCOUNT_STORE_KIND_ENV,
    originalEnv.accountStoreKind
  );

  restoreEnv(
    BOOTSTRAP_ENABLED_ENV,
    originalEnv.bootstrapEnabled
  );

  restoreEnv(
    BOOTSTRAP_SECRET_ENV,
    originalEnv.bootstrapSecret
  );

  restoreEnv(
    CANONICAL_HUMAN_IPR_ENV,
    originalEnv.canonicalHumanIpr
  );

  restoreEnv(
    CERTIFICATE_ID_ENV,
    originalEnv.certificateId
  );

  restoreEnv(
    TENANT_ID_ENV,
    originalEnv.tenantId
  );

  restoreEnv(
    WORKSPACE_ID_ENV,
    originalEnv.workspaceId
  );

  getProcessIprAuthStore().clear();
  getProcessIprAccountStore().clear();
});

describe(
  "POST /api/auth/ipr-login transaction mapping",
  () => {
    it(
      "maps canonical credential race conflict to 409",
      async () => {
        mockWithHbceDatabaseTransaction
          .mockResolvedValue({
            ok: false,
            transactionId:
              "HBCE-TX-TEST-CREDENTIAL-RACE",
            state: "ROLLED_BACK",
            startedAt:
              "2026-08-10T13:23:00.000Z",
            completedAt:
              "2026-08-10T13:23:00.001Z",
            durationMs: 1,
            error:
              "IPR_CANONICAL_BOOTSTRAP_ALREADY_COMPLETED",
            rollbackError: null
          });

        const request =
          new NextRequest(
            "http://localhost/api/auth/ipr-login",
            {
              method: "POST",
              headers: {
                "content-type":
                  "application/json",
                "x-hbce-ipr-bootstrap-secret":
                  "Expected-Canonical-Secret-2026"
              },
              body: JSON.stringify({
                mode:
                  "BOOTSTRAP_CANONICAL",
                humanIpr:
                  "IPR-3",
                password:
                  "C4n0nical!ZetaFlux27"
              })
            }
          );

        const response =
          await POST(request);

        const payload =
          await response.json();

        expect(
          mockWithHbceDatabaseTransaction
        ).toHaveBeenCalledTimes(1);

        expect(response.status).toBe(
          409
        );

        expect(payload).toMatchObject({
          ok: false,
          authenticated: false,
          reason:
            "IPR_CANONICAL_BOOTSTRAP_ALREADY_COMPLETED",
          detail:
            "A persistent credential already exists for the canonical Human IPR. Bootstrap did not modify it.",
          legalCertification: false
        });

        const [
          operation,
          options
        ] =
          mockWithHbceDatabaseTransaction
            .mock.calls[0];

        expect(
          typeof operation
        ).toBe("function");

        expect(options).toMatchObject({
          isolationLevel:
            "SERIALIZABLE",
          readOnly: false,
          statementTimeoutMs:
            30000,
          lockTimeoutMs:
            10000,
          idleInTransactionSessionTimeoutMs:
            30000
        });
      }
    );

    it(
      "maps canonical profile race conflict to 409",
      async () => {
        mockWithHbceDatabaseTransaction
          .mockResolvedValue({
            ok: false,
            transactionId:
              "HBCE-TX-TEST-PROFILE-RACE",
            state: "ROLLED_BACK",
            startedAt:
              "2026-08-10T13:27:00.000Z",
            completedAt:
              "2026-08-10T13:27:00.001Z",
            durationMs: 1,
            error:
              "IPR_CANONICAL_BOOTSTRAP_PROFILE_ALREADY_EXISTS",
            rollbackError: null
          });

        const request =
          new NextRequest(
            "http://localhost/api/auth/ipr-login",
            {
              method: "POST",
              headers: {
                "content-type":
                  "application/json",
                "x-hbce-ipr-bootstrap-secret":
                  "Expected-Canonical-Secret-2026"
              },
              body: JSON.stringify({
                mode:
                  "BOOTSTRAP_CANONICAL",
                humanIpr:
                  "IPR-3",
                password:
                  "C4n0nical!ZetaFlux27"
              })
            }
          );

        const response =
          await POST(request);

        const payload =
          await response.json();

        expect(
          mockWithHbceDatabaseTransaction
        ).toHaveBeenCalledTimes(1);

        expect(response.status).toBe(
          409
        );

        expect(payload).toMatchObject({
          ok: false,
          authenticated: false,
          reason:
            "IPR_CANONICAL_BOOTSTRAP_PROFILE_ALREADY_EXISTS",
          detail:
            "A persistent canonical Human IPR profile already exists. The bootstrap transaction was rolled back.",
          legalCertification: false
        });
      }
    );

    it(
      "maps generic transaction failure to 500",
      async () => {
        mockWithHbceDatabaseTransaction
          .mockResolvedValue({
            ok: false,
            transactionId:
              "HBCE-TX-TEST-GENERIC-FAILURE",
            state: "FAILED",
            startedAt:
              "2026-08-10T13:32:00.000Z",
            completedAt:
              "2026-08-10T13:32:00.001Z",
            durationMs: 1,
            error:
              "HBCE_TEST_DATABASE_FAILURE",
            rollbackError:
              "HBCE_TEST_ROLLBACK_FAILURE"
          });

        const request =
          new NextRequest(
            "http://localhost/api/auth/ipr-login",
            {
              method: "POST",
              headers: {
                "content-type":
                  "application/json",
                "x-hbce-ipr-bootstrap-secret":
                  "Expected-Canonical-Secret-2026"
              },
              body: JSON.stringify({
                mode:
                  "BOOTSTRAP_CANONICAL",
                humanIpr:
                  "IPR-3",
                password:
                  "C4n0nical!ZetaFlux27"
              })
            }
          );

        const response =
          await POST(request);

        const payload =
          await response.json();

        expect(
          mockWithHbceDatabaseTransaction
        ).toHaveBeenCalledTimes(1);

        expect(response.status).toBe(
          500
        );

        expect(payload).toMatchObject({
          ok: false,
          authenticated: false,
          reason:
            "IPR_CANONICAL_BOOTSTRAP_TRANSACTION_FAILED",
          detail:
            "Canonical Human IPR bootstrap persistence failed and was not committed.",
          legalCertification: false,
          transactionState:
            "FAILED",
          rollbackErrorPresent:
            true
        });
      }
    );

    it(
      "fails closed when committed profile cannot be read back",
      async () => {
        mockWithHbceDatabaseTransaction
          .mockResolvedValue({
            ok: true,
            transactionId:
              "HBCE-TX-TEST-READBACK-FAILURE",
            state: "COMMITTED",
            startedAt:
              "2026-08-10T14:42:00.000Z",
            completedAt:
              "2026-08-10T14:42:00.001Z",
            durationMs: 1,
            value: {
              humanIpr:
                "IPR-3",
              accountId:
                "ACCOUNT-IPR-3-TEST",
              certificateId:
                "CERTIFICATE-09-OPERATIONAL-TEST"
            }
          });

        const request =
          new NextRequest(
            "http://localhost/api/auth/ipr-login",
            {
              method: "POST",
              headers: {
                "content-type":
                  "application/json",
                "x-hbce-ipr-bootstrap-secret":
                  "Expected-Canonical-Secret-2026"
              },
              body: JSON.stringify({
                mode:
                  "BOOTSTRAP_CANONICAL",
                humanIpr:
                  "IPR-3",
                password:
                  "C4n0nical!ZetaFlux27"
              })
            }
          );

        const response =
          await POST(request);

        const payload =
          await response.json();

        expect(
          mockWithHbceDatabaseTransaction
        ).toHaveBeenCalledTimes(1);

        expect(response.status).toBe(
          500
        );

        expect(payload).toMatchObject({
          ok: false,
          authenticated: false,
          reason:
            "IPR_CANONICAL_BOOTSTRAP_PROFILE_READBACK_FAILED",
          detail:
            "Canonical bootstrap committed, but the persistent account profile could not be read back.",
          legalCertification: false
        });
      }
    );

    it(
      "completes bootstrap when committed profile is readable",
      async () => {
        mockWithHbceDatabaseTransaction
          .mockImplementation(
            async () => {
              await getProcessIprAccountStore()
                .upsertProfileAsync({
                  humanIpr:
                    "IPR-3",
                  certificateId:
                    "CERTIFICATE-09-OPERATIONAL-TEST",
                  accountId:
                    "ACCOUNT-IPR-3-READBACK-TEST",
                  tenantId:
                    "HBCE-TENANT-TEST",
                  workspaceId:
                    "HBCE-WORKSPACE-TEST",
                  certificateStatus:
                    "ACTIVE",
                  certificateScope: [
                    "JOKER_C2_ACCESS"
                  ],
                  accessDecision:
                    "ACCESS_GRANTED",
                  accessScope:
                    "JOKER_C2_ACCESS",
                  identityBinding:
                    "IPR_VERIFIED_BIOLOGICAL_SUBJECT",
                  matrixState:
                    "MATRIX_ACTIVE",
                  semanticMemoryScope:
                    "IPR_BOUND",
                  source:
                    "HBCE_CANONICAL_IPR_BOOTSTRAP"
                });

              return {
                ok: true,
                transactionId:
                  "HBCE-TX-TEST-READBACK-SUCCESS",
                state: "COMMITTED",
                startedAt:
                  "2026-08-10T14:55:00.000Z",
                completedAt:
                  "2026-08-10T14:55:00.001Z",
                durationMs: 1,
                value: {
                  humanIpr:
                    "IPR-3",
                  accountId:
                    "ACCOUNT-IPR-3-READBACK-TEST",
                  certificateId:
                    "CERTIFICATE-09-OPERATIONAL-TEST"
                }
              };
            }
          );

        const request =
          new NextRequest(
            "http://localhost/api/auth/ipr-login",
            {
              method: "POST",
              headers: {
                "content-type":
                  "application/json",
                "x-hbce-ipr-bootstrap-secret":
                  "Expected-Canonical-Secret-2026"
              },
              body: JSON.stringify({
                mode:
                  "BOOTSTRAP_CANONICAL",
                humanIpr:
                  "IPR-3",
                password:
                  "C4n0nical!ZetaFlux27",
                deviceLabel:
                  "HBCE canonical readback test"
              })
            }
          );

        const response =
          await POST(request);

        const payload =
          await response.json();

        expect(
          mockWithHbceDatabaseTransaction
        ).toHaveBeenCalledTimes(1);

        expect(response.status).toBe(
          200
        );

        expect(payload).toMatchObject({
          ok: true,
          authenticated: true,
          mode:
            "BOOTSTRAP_CANONICAL",
          bootstrapStatus:
            "CANONICAL_HUMAN_IPR_BOOTSTRAP_COMPLETED",
          humanIpr:
            "IPR-3",
          runtimeIpr:
            "IPR-AI-0001",
          accountProfile: {
            humanIpr:
              "IPR-3",
            accountId:
              "ACCOUNT-IPR-3-READBACK-TEST",
            certificateId:
              "CERTIFICATE-09-OPERATIONAL-TEST"
          },
          access: {
            decision:
              "ACCESS_GRANTED",
            identityBinding:
              "IPR_VERIFIED_BIOLOGICAL_SUBJECT",
            source:
              "HBCE_CANONICAL_IPR_BOOTSTRAP"
          },
          memory: {
            expectedScope:
              "IPR_BOUND",
            expectedAuthority:
              "SERVER_RUNTIME_VALIDATED",
            persistenceMode:
              "DATABASE_PERSISTENT"
          },
          matrix: {
            expectedState:
              "MATRIX_ACTIVE"
          },
          bootstrap: {
            oneTime: true,
            canonicalHumanAuthority:
              true,
            disableAfterCompletion:
              true
          },
          legalCertification:
            false
        });

        expect(payload.session).toBeTruthy();

        expect(
          response.headers.get(
            "set-cookie"
          )
        ).toBeTruthy();
      }
    );

    it(
      "persists and projects canonical login touch after bootstrap",
      async () => {
        mockWithHbceDatabaseTransaction
          .mockImplementation(
            async () => {
              const profile =
                await getProcessIprAccountStore()
                  .upsertProfileAsync({
                    humanIpr:
                      "IPR-3",
                    certificateId:
                      "CERTIFICATE-09-OPERATIONAL-TEST",
                    accountId:
                      "ACCOUNT-IPR-3-TOUCH-TEST",
                    source:
                      "HBCE_CANONICAL_IPR_BOOTSTRAP"
                  });

              expect(
                profile.lastLoginAt
              ).toBeNull();

              return {
                ok: true,
                transactionId:
                  "HBCE-TX-TEST-TOUCH-LOGIN",
                state:
                  "COMMITTED",
                startedAt:
                  "2026-08-10T16:26:00.000Z",
                completedAt:
                  "2026-08-10T16:26:00.001Z",
                durationMs:
                  1,
                value: {
                  humanIpr:
                    "IPR-3",
                  accountId:
                    "ACCOUNT-IPR-3-TOUCH-TEST",
                  certificateId:
                    "CERTIFICATE-09-OPERATIONAL-TEST"
                }
              };
            }
          );

        const request =
          new NextRequest(
            "http://localhost/api/auth/ipr-login",
            {
              method: "POST",
              headers: {
                "content-type":
                  "application/json",
                "x-hbce-ipr-bootstrap-secret":
                  "Expected-Canonical-Secret-2026"
              },
              body: JSON.stringify({
                mode:
                  "BOOTSTRAP_CANONICAL",
                humanIpr:
                  "IPR-3",
                password:
                  "C4n0nical!ZetaFlux27",
                deviceLabel:
                  "HBCE canonical touch-login test"
              })
            }
          );

        const response =
          await POST(request);

        const payload =
          await response.json();

        expect(response.status).toBe(
          200
        );

        expect(payload).toMatchObject({
          ok: true,
          authenticated: true,
          accountProfile: {
            humanIpr:
              "IPR-3",
            accountId:
              "ACCOUNT-IPR-3-TOUCH-TEST"
          }
        });

        const persistedProfile =
          await getProcessIprAccountStore()
            .getProfileAsync(
              "IPR-3"
            );

        expect(
          persistedProfile
        ).not.toBeNull();

        expect(
          persistedProfile?.lastLoginAt
        ).toEqual(
          expect.any(String)
        );

        expect(
          persistedProfile?.updatedAt
        ).toBe(
          persistedProfile?.lastLoginAt
        );

        expect(
          payload.accountProfile.lastLoginAt
        ).toBe(
          persistedProfile?.lastLoginAt
        );

        expect(
          payload.accountProfile.updatedAt
        ).toBe(
          persistedProfile?.updatedAt
        );
      }
    );

    it(
      "persists canonical session and verifies it from the cookie token",
      async () => {
        mockWithHbceDatabaseTransaction
          .mockImplementation(
            async () => {
              await getProcessIprAccountStore()
                .upsertProfileAsync({
                  humanIpr:
                    "IPR-3",
                  certificateId:
                    "CERTIFICATE-09-OPERATIONAL-TEST",
                  accountId:
                    "ACCOUNT-IPR-3-SESSION-TEST",
                  tenantId:
                    "HBCE-TENANT-TEST",
                  workspaceId:
                    "HBCE-WORKSPACE-TEST",
                  certificateStatus:
                    "ACTIVE",
                  certificateScope: [
                    "JOKER_C2_ACCESS"
                  ],
                  accessDecision:
                    "ACCESS_GRANTED",
                  accessScope:
                    "JOKER_C2_ACCESS",
                  identityBinding:
                    "IPR_VERIFIED_BIOLOGICAL_SUBJECT",
                  matrixState:
                    "MATRIX_ACTIVE",
                  semanticMemoryScope:
                    "IPR_BOUND",
                  source:
                    "HBCE_CANONICAL_IPR_BOOTSTRAP"
                });

              return {
                ok: true,
                transactionId:
                  "HBCE-TX-TEST-SESSION-PERSISTENCE",
                state:
                  "COMMITTED",
                startedAt:
                  "2026-08-10T16:45:00.000Z",
                completedAt:
                  "2026-08-10T16:45:00.001Z",
                durationMs:
                  1,
                value: {
                  humanIpr:
                    "IPR-3",
                  accountId:
                    "ACCOUNT-IPR-3-SESSION-TEST",
                  certificateId:
                    "CERTIFICATE-09-OPERATIONAL-TEST"
                }
              };
            }
          );

        const request =
          new NextRequest(
            "http://localhost/api/auth/ipr-login",
            {
              method:
                "POST",
              headers: {
                "content-type":
                  "application/json",
                "x-hbce-ipr-bootstrap-secret":
                  "Expected-Canonical-Secret-2026"
              },
              body: JSON.stringify({
                mode:
                  "BOOTSTRAP_CANONICAL",
                humanIpr:
                  "IPR-3",
                password:
                  "C4n0nical!ZetaFlux27",
                deviceLabel:
                  "HBCE canonical session persistence test"
              })
            }
          );

        const response =
          await POST(request);

        const payload =
          await response.json();

        expect(response.status).toBe(
          200
        );

        expect(payload).toMatchObject({
          ok:
            true,
          authenticated:
            true,
          humanIpr:
            "IPR-3",
          runtimeIpr:
            "IPR-AI-0001",
          session: {
            humanIpr:
              "IPR-3",
            runtimeIpr:
              "IPR-AI-0001",
            status:
              "ACTIVE",
            deviceLabel:
              "HBCE canonical session persistence test",
            legalCertification:
              false
          }
        });

        expect(
          payload.session
        ).not.toHaveProperty(
          "tokenHash"
        );

        const setCookie =
          response.headers.get(
            "set-cookie"
          );

        expect(setCookie).toBeTruthy();

        const cookiePair =
          setCookie!.split(";")[0];

        const separatorIndex =
          cookiePair.indexOf("=");

        expect(
          separatorIndex
        ).toBeGreaterThan(0);

        const rawSessionToken =
          cookiePair.slice(
            separatorIndex + 1
          );

        expect(
          rawSessionToken
        ).toMatch(
          /^IPRSESS_[A-F0-9]{64}$/
        );

        expect(
          JSON.stringify(payload)
        ).not.toContain(
          rawSessionToken
        );

        const verification =
          await getProcessIprAuthStore()
            .verifySessionTokenAsync(
              rawSessionToken
            );

        expect(
          verification
        ).toMatchObject({
          ok:
            true,
          authenticated:
            true,
          reason:
            "SESSION_ACTIVE",
          session: {
            sessionId:
              payload.session.sessionId,
            humanIpr:
              "IPR-3",
            runtimeIpr:
              "IPR-AI-0001",
            status:
              "ACTIVE",
            deviceLabel:
              "HBCE canonical session persistence test",
            legalCertification:
              false,
            sessionPayload: {
              mode:
                "BOOTSTRAP_CANONICAL",
              accountId:
                "ACCOUNT-IPR-3-SESSION-TEST",
              semanticMemoryScope:
                "IPR_BOUND",
              matrixState:
                "MATRIX_ACTIVE",
              canonicalHumanAuthority:
                true,
              legalCertification:
                false
            }
          }
        });

        expect(
          verification.session
        ).not.toBeNull();

        if (
          !verification.ok ||
          !verification.session
        ) {
          throw new Error(
            "HBCE_TEST_SESSION_VERIFICATION_FAILED"
          );
        }

        expect(
          verification.session.tokenHash
        ).not.toBe(
          rawSessionToken
        );

        expect(
          verification.session.tokenHash
        ).toEqual(
          expect.any(String)
        );

        expect(
          verification.session.lastSeenAt
        ).toEqual(
          expect.any(String)
        );
      }
    );

    it(
      "emits canonical session cookie with non-production security contract",
      async () => {
        vi.stubEnv(
          "NODE_ENV",
          "test"
        );

        try {

          mockWithHbceDatabaseTransaction
            .mockImplementation(
              async () => {
                await getProcessIprAccountStore()
                  .upsertProfileAsync({
                    humanIpr:
                      "IPR-3",
                    certificateId:
                      "CERTIFICATE-09-OPERATIONAL-TEST",
                    accountId:
                      "ACCOUNT-IPR-3-COOKIE-TEST",
                    source:
                      "HBCE_CANONICAL_IPR_BOOTSTRAP"
                  });

                return {
                  ok:
                    true,
                  transactionId:
                    "HBCE-TX-TEST-COOKIE-NONPROD",
                  state:
                    "COMMITTED",
                  startedAt:
                    "2026-08-10T17:50:00.000Z",
                  completedAt:
                    "2026-08-10T17:50:00.001Z",
                  durationMs:
                    1,
                  value: {
                    humanIpr:
                      "IPR-3",
                    accountId:
                      "ACCOUNT-IPR-3-COOKIE-TEST",
                    certificateId:
                      "CERTIFICATE-09-OPERATIONAL-TEST"
                  }
                };
              }
            );

          const request =
            new NextRequest(
              "http://localhost/api/auth/ipr-login",
              {
                method:
                  "POST",
                headers: {
                  "content-type":
                    "application/json",
                  "x-hbce-ipr-bootstrap-secret":
                    "Expected-Canonical-Secret-2026"
                },
                body: JSON.stringify({
                  mode:
                    "BOOTSTRAP_CANONICAL",
                  humanIpr:
                    "IPR-3",
                  password:
                    "C4n0nical!ZetaFlux27",
                  deviceLabel:
                    "HBCE canonical cookie contract test"
                })
              }
            );

          const response =
            await POST(request);

          const payload =
            await response.json();

          expect(
            response.status
          ).toBe(
            200
          );

          expect(payload).toMatchObject({
            ok:
              true,
            authenticated:
              true
          });

          const setCookie =
            response.headers.get(
              "set-cookie"
            );

          expect(
            setCookie
          ).toBeTruthy();

          expect(
            setCookie
          ).toMatch(
            /^hbce_ipr_session=IPRSESS_[A-F0-9]{64};/
          );

          const attributes =
            setCookie!
              .split(";")
              .slice(1)
              .map(
                (part) =>
                  part.trim().toLowerCase()
              );

          expect(
            attributes
          ).toContain(
            "httponly"
          );

          expect(
            attributes
          ).toContain(
            "samesite=lax"
          );

          expect(
            attributes
          ).toContain(
            "path=/"
          );

          expect(
            attributes
          ).toContain(
            "max-age=604800"
          );

          expect(
            attributes
          ).not.toContain(
            "secure"
          );
        } finally {
          vi.unstubAllEnvs();
        }
      }
    );

    it(
      "emits secure canonical session cookie in production",
      async () => {
        vi.stubEnv(
          "NODE_ENV",
          "production"
        );

        try {

          mockWithHbceDatabaseTransaction
            .mockImplementation(
              async () => {
                await getProcessIprAccountStore()
                  .upsertProfileAsync({
                    humanIpr:
                      "IPR-3",
                    certificateId:
                      "CERTIFICATE-09-OPERATIONAL-TEST",
                    accountId:
                      "ACCOUNT-IPR-3-COOKIE-PROD-TEST",
                    source:
                      "HBCE_CANONICAL_IPR_BOOTSTRAP"
                  });

                return {
                  ok:
                    true,
                  transactionId:
                    "HBCE-TX-TEST-COOKIE-PRODUCTION",
                  state:
                    "COMMITTED",
                  startedAt:
                    "2026-08-10T18:15:00.000Z",
                  completedAt:
                    "2026-08-10T18:15:00.001Z",
                  durationMs:
                    1,
                  value: {
                    humanIpr:
                      "IPR-3",
                    accountId:
                      "ACCOUNT-IPR-3-COOKIE-PROD-TEST",
                    certificateId:
                      "CERTIFICATE-09-OPERATIONAL-TEST"
                  }
                };
              }
            );

          const request =
            new NextRequest(
              "https://hbce.example/api/auth/ipr-login",
              {
                method:
                  "POST",
                headers: {
                  "content-type":
                    "application/json",
                  "x-hbce-ipr-bootstrap-secret":
                    "Expected-Canonical-Secret-2026"
                },
                body: JSON.stringify({
                  mode:
                    "BOOTSTRAP_CANONICAL",
                  humanIpr:
                    "IPR-3",
                  password:
                    "C4n0nical!ZetaFlux27",
                  deviceLabel:
                    "HBCE canonical production cookie test"
                })
              }
            );

          const response =
            await POST(request);

          const payload =
            await response.json();

          expect(
            response.status
          ).toBe(
            200
          );

          expect(payload).toMatchObject({
            ok:
              true,
            authenticated:
              true
          });

          const setCookie =
            response.headers.get(
              "set-cookie"
            );

          expect(
            setCookie
          ).toBeTruthy();

          expect(
            setCookie
          ).toMatch(
            /^hbce_ipr_session=IPRSESS_[A-F0-9]{64};/
          );

          const attributes =
            setCookie!
              .split(";")
              .slice(1)
              .map(
                (part) =>
                  part.trim().toLowerCase()
              );

          expect(
            attributes
          ).toContain(
            "httponly"
          );

          expect(
            attributes
          ).toContain(
            "secure"
          );

          expect(
            attributes
          ).toContain(
            "samesite=lax"
          );

          expect(
            attributes
          ).toContain(
            "path=/"
          );

          expect(
            attributes
          ).toContain(
            "max-age=604800"
          );
        } finally {
          vi.unstubAllEnvs();
        }
      }
    );

    it(
      "completes the full canonical bootstrap application contract",
      async () => {
        vi.stubEnv(
          "NODE_ENV",
          "test"
        );

        try {

          mockWithHbceDatabaseTransaction
            .mockImplementation(
              async () => {
                await getProcessIprAccountStore()
                  .upsertProfileAsync({
                    humanIpr:
                      "IPR-3",
                    certificateId:
                      "CERTIFICATE-09-OPERATIONAL-TEST",
                    accountId:
                      "ACCOUNT-IPR-3-FULL-CONTRACT",
                    tenantId:
                      "HBCE-TENANT-TEST",
                    workspaceId:
                      "HBCE-WORKSPACE-TEST",
                    certificateStatus:
                      "ACTIVE",
                    certificateScope: [
                      "JOKER_C2_ACCESS"
                    ],
                    accessDecision:
                      "ACCESS_GRANTED",
                    accessScope:
                      "JOKER_C2_ACCESS",
                    identityBinding:
                      "IPR_VERIFIED_BIOLOGICAL_SUBJECT",
                    matrixState:
                      "MATRIX_ACTIVE",
                    semanticMemoryScope:
                      "IPR_BOUND",
                    source:
                      "HBCE_CANONICAL_IPR_BOOTSTRAP"
                  });

                return {
                  ok:
                    true,
                  transactionId:
                    "HBCE-TX-FULL-CANONICAL-CONTRACT",
                  state:
                    "COMMITTED",
                  startedAt:
                    "2026-08-10T18:25:00.000Z",
                  completedAt:
                    "2026-08-10T18:25:00.001Z",
                  durationMs:
                    1,
                  value: {
                    humanIpr:
                      "IPR-3",
                    accountId:
                      "ACCOUNT-IPR-3-FULL-CONTRACT",
                    certificateId:
                      "CERTIFICATE-09-OPERATIONAL-TEST"
                  }
                };
              }
            );

          const request =
            new NextRequest(
              "http://localhost/api/auth/ipr-login",
              {
                method:
                  "POST",
                headers: {
                  "content-type":
                    "application/json",
                  "x-hbce-ipr-bootstrap-secret":
                    "Expected-Canonical-Secret-2026"
                },
                body: JSON.stringify({
                  mode:
                    "BOOTSTRAP_CANONICAL",
                  humanIpr:
                    "IPR-3",
                  password:
                    "C4n0nical!ZetaFlux27",
                  deviceLabel:
                    "HBCE full canonical contract test"
                })
              }
            );

          const response =
            await POST(request);

          const payload =
            await response.json();

          expect(
            mockWithHbceDatabaseTransaction
          ).toHaveBeenCalledTimes(
            1
          );

          const [
            operation,
            transactionOptions
          ] =
            mockWithHbceDatabaseTransaction
              .mock.calls[0];

          expect(
            typeof operation
          ).toBe(
            "function"
          );

          expect(
            transactionOptions
          ).toMatchObject({
            isolationLevel:
              "SERIALIZABLE",
            readOnly:
              false,
            statementTimeoutMs:
              30000,
            lockTimeoutMs:
              10000,
            idleInTransactionSessionTimeoutMs:
              30000
          });

          expect(
            response.status
          ).toBe(
            200
          );

          expect(payload).toMatchObject({
            ok:
              true,
            authenticated:
              true,
            mode:
              "BOOTSTRAP_CANONICAL",
            bootstrapStatus:
              "CANONICAL_HUMAN_IPR_BOOTSTRAP_COMPLETED",
            humanIpr:
              "IPR-3",
            runtimeIpr:
              "IPR-AI-0001",
            accountProfile: {
              humanIpr:
                "IPR-3",
              accountId:
                "ACCOUNT-IPR-3-FULL-CONTRACT",
              certificateId:
                "CERTIFICATE-09-OPERATIONAL-TEST",
              accessDecision:
                "ACCESS_GRANTED",
              identityBinding:
                "IPR_VERIFIED_BIOLOGICAL_SUBJECT",
              matrixState:
                "MATRIX_ACTIVE",
              semanticMemoryScope:
                "IPR_BOUND",
              source:
                "HBCE_CANONICAL_IPR_BOOTSTRAP",
              legalCertification:
                false
            },
            session: {
              humanIpr:
                "IPR-3",
              runtimeIpr:
                "IPR-AI-0001",
              status:
                "ACTIVE",
              deviceLabel:
                "HBCE full canonical contract test",
              legalCertification:
                false
            },
            access: {
              decision:
                "ACCESS_GRANTED",
              identityBinding:
                "IPR_VERIFIED_BIOLOGICAL_SUBJECT",
              source:
                "HBCE_CANONICAL_IPR_BOOTSTRAP"
            },
            memory: {
              expectedScope:
                "IPR_BOUND",
              expectedAuthority:
                "SERVER_RUNTIME_VALIDATED",
              persistenceMode:
                "DATABASE_PERSISTENT"
            },
            matrix: {
              expectedState:
                "MATRIX_ACTIVE"
            },
            bootstrap: {
              oneTime:
                true,
              canonicalHumanAuthority:
                true,
              disableAfterCompletion:
                true
            },
            legalCertification:
              false
          });

          expect(
            payload.accountProfile.lastLoginAt
          ).toEqual(
            expect.any(String)
          );

          expect(
            payload.accountProfile.updatedAt
          ).toBe(
            payload.accountProfile.lastLoginAt
          );

          expect(
            payload.session
          ).not.toHaveProperty(
            "tokenHash"
          );

          const persistedProfile =
            await getProcessIprAccountStore()
              .getProfileAsync(
                "IPR-3"
              );

          expect(
            persistedProfile
          ).not.toBeNull();

          expect(
            persistedProfile?.accountId
          ).toBe(
            "ACCOUNT-IPR-3-FULL-CONTRACT"
          );

          expect(
            persistedProfile?.lastLoginAt
          ).toBe(
            payload.accountProfile.lastLoginAt
          );

          const setCookie =
            response.headers.get(
              "set-cookie"
            );

          expect(
            setCookie
          ).toBeTruthy();

          expect(
            setCookie
          ).toMatch(
            /^hbce_ipr_session=IPRSESS_[A-F0-9]{64};/
          );

          const cookiePair =
            setCookie!.split(";")[0];

          const rawSessionToken =
            cookiePair.slice(
              cookiePair.indexOf("=") + 1
            );

          expect(
            JSON.stringify(payload)
          ).not.toContain(
            rawSessionToken
          );

          const verification =
            await getProcessIprAuthStore()
              .verifySessionTokenAsync(
                rawSessionToken
              );

          expect(
            verification
          ).toMatchObject({
            ok:
              true,
            authenticated:
              true,
            reason:
              "SESSION_ACTIVE",
            session: {
              sessionId:
                payload.session.sessionId,
              humanIpr:
                "IPR-3",
              runtimeIpr:
                "IPR-AI-0001",
              status:
                "ACTIVE",
              deviceLabel:
                "HBCE full canonical contract test",
              legalCertification:
                false,
              sessionPayload: {
                mode:
                  "BOOTSTRAP_CANONICAL",
                accountId:
                  "ACCOUNT-IPR-3-FULL-CONTRACT",
                semanticMemoryScope:
                  "IPR_BOUND",
                matrixState:
                  "MATRIX_ACTIVE",
                canonicalHumanAuthority:
                  true,
                legalCertification:
                  false
              }
            }
          });

          if (
            !verification.ok ||
            !verification.session
          ) {
            throw new Error(
              "HBCE_FULL_CANONICAL_SESSION_VERIFICATION_FAILED"
            );
          }

          expect(
            verification.session.tokenHash
          ).not.toBe(
            rawSessionToken
          );

          expect(
            verification.session.lastSeenAt
          ).toEqual(
            expect.any(String)
          );
        } finally {
          vi.unstubAllEnvs();
        }
      }
    );
  }
);

describe("canonical bootstrap scope fail-closed", () => {
  it("fails closed before transaction when canonical tenant scope is missing", async () => {
    process.env[AUTH_STORE_KIND_ENV] =
      "PROCESS_AUTH_STORE_MVP";

    process.env[ACCOUNT_STORE_KIND_ENV] =
      "PROCESS_ACCOUNT_STORE_MVP";

    process.env[BOOTSTRAP_ENABLED_ENV] =
      "true";

    process.env[BOOTSTRAP_SECRET_ENV] =
      "Expected-Canonical-Secret-2026";

    process.env[CANONICAL_HUMAN_IPR_ENV] =
      "IPR-3";

    process.env[CERTIFICATE_ID_ENV] =
      "CERTIFICATE-09-OPERATIONAL-TEST";

    delete process.env[TENANT_ID_ENV];

    process.env[WORKSPACE_ID_ENV] =
      "HBCE-WORKSPACE-TEST";

    const authStore =
      getProcessIprAuthStore();

    const accountStore =
      getProcessIprAccountStore();

    authStore.clear();
    accountStore.clear();

    mockWithHbceDatabaseTransaction.mockClear();

    const request = new NextRequest(
      "http://localhost/api/auth/ipr-login",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-hbce-ipr-bootstrap-secret":
            "Expected-Canonical-Secret-2026"
        },
        body: JSON.stringify({
          mode: "BOOTSTRAP_CANONICAL",
          humanIpr: "IPR-3",
          password: "C4n0nical!ZetaFlux27"
        })
      }
    );

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(503);

    expect(payload).toMatchObject({
      ok: false,
      authenticated: false,
      reason:
        "IPR_CANONICAL_BOOTSTRAP_SCOPE_NOT_CONFIGURED",
      detail:
        "Canonical bootstrap requires explicit server-side tenant and workspace identifiers.",
      legalCertification: false
    });

    expect(
      mockWithHbceDatabaseTransaction
    ).not.toHaveBeenCalled();

    expect(
      await authStore.getCredentialAsync("IPR-3")
    ).toBeNull();

    expect(
      await accountStore.getProfileAsync("IPR-3")
    ).toBeNull();
  });

  it("fails closed before transaction when canonical workspace scope is missing", async () => {
    process.env[AUTH_STORE_KIND_ENV] =
      "PROCESS_AUTH_STORE_MVP";

    process.env[ACCOUNT_STORE_KIND_ENV] =
      "PROCESS_ACCOUNT_STORE_MVP";

    process.env[BOOTSTRAP_ENABLED_ENV] =
      "true";

    process.env[BOOTSTRAP_SECRET_ENV] =
      "Expected-Canonical-Secret-2026";

    process.env[CANONICAL_HUMAN_IPR_ENV] =
      "IPR-3";

    process.env[CERTIFICATE_ID_ENV] =
      "CERTIFICATE-09-OPERATIONAL-TEST";

    process.env[TENANT_ID_ENV] =
      "HBCE-TENANT-TEST";

    delete process.env[WORKSPACE_ID_ENV];

    const authStore =
      getProcessIprAuthStore();

    const accountStore =
      getProcessIprAccountStore();

    authStore.clear();
    accountStore.clear();

    mockWithHbceDatabaseTransaction.mockClear();

    const request = new NextRequest(
      "http://localhost/api/auth/ipr-login",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-hbce-ipr-bootstrap-secret":
            "Expected-Canonical-Secret-2026"
        },
        body: JSON.stringify({
          mode: "BOOTSTRAP_CANONICAL",
          humanIpr: "IPR-3",
          password: "C4n0nical!ZetaFlux27"
        })
      }
    );

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(503);

    expect(payload).toMatchObject({
      ok: false,
      authenticated: false,
      reason:
        "IPR_CANONICAL_BOOTSTRAP_SCOPE_NOT_CONFIGURED",
      detail:
        "Canonical bootstrap requires explicit server-side tenant and workspace identifiers.",
      legalCertification: false
    });

    expect(
      mockWithHbceDatabaseTransaction
    ).not.toHaveBeenCalled();

    expect(
      await authStore.getCredentialAsync("IPR-3")
    ).toBeNull();

    expect(
      await accountStore.getProfileAsync("IPR-3")
    ).toBeNull();
  });
});
