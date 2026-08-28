import {
  beforeEach,
  describe,
  expect,
  it,
  vi
} from "vitest";


const {
  mockQueryDatabase,
  mockDatabaseConfigured
} = vi.hoisted(() => ({
  mockQueryDatabase:
    vi.fn(),

  mockDatabaseConfigured:
    vi.fn()
}));


vi.mock(
  "@/lib/ipr-database",
  () => ({
    describeDefaultHbceDatabase:
      () => ({
        configured:
          true
      }),

    isHbceDatabaseConfigured:
      mockDatabaseConfigured,

    queryHbceDatabase:
      mockQueryDatabase
  })
);


import {
  getDatabasePersistentIprAuthStore,
  getProcessIprAuthStore
} from "@/lib/ipr-session-store";


const TOKEN =
  "HBCE-PERSISTENT-SESSION-AUTHORITY-TEST-TOKEN-2026";

const HUMAN_IPR =
  "IPR-AAAAAAAAAAAA";


function seedProcessFallback() {
  return getProcessIprAuthStore()
    .createSession({
      sessionId:
        "HBCE-SESSION-PERSISTENT-AUTHORITY-TEST",

      humanIpr:
        HUMAN_IPR,

      runtimeIpr:
        "IPR-AI-0001",

      token:
        TOKEN,

      status:
        "ACTIVE",

      createdAt:
        "2026-08-28T20:00:00.000Z",

      expiresAt:
        "2099-08-28T20:00:00.000Z",

      revokedAt:
        null,

      lastSeenAt:
        null,

      sessionPayload: {
        source:
          "HBCE_TEST_PROCESS_FALLBACK",

        legalCertification:
          false
      }
    });
}


beforeEach(() => {
  vi.clearAllMocks();

  getProcessIprAuthStore()
    .clear();

  mockDatabaseConfigured
    .mockReturnValue(
      true
    );
});


describe(
  "DATABASE_PERSISTENT session verification authority",
  () => {

    it(
      "does not authenticate synchronously from process fallback",
      () => {

        seedProcessFallback();

        const processResult =
          getProcessIprAuthStore()
            .verifySessionToken(
              TOKEN
            );

        expect(
          processResult.ok
        ).toBe(true);

        expect(
          processResult.authenticated
        ).toBe(true);


        const persistentResult =
          getDatabasePersistentIprAuthStore()
            .verifySessionToken(
              TOKEN
            );

        expect(
          persistentResult
        ).toEqual({
          ok:
            false,

          authenticated:
            false,

          reason:
            "SESSION_NOT_FOUND",

          session:
            null
        });
      }
    );


    it(
      "treats a persistent database miss as authoritative even when process fallback contains an active session",
      async () => {

        seedProcessFallback();

        mockQueryDatabase
          .mockResolvedValueOnce({
            ok:
              true,

            status:
              "AVAILABLE",

            rows:
              [],

            rowCount:
              0,

            error:
              null,

            sqlHash:
              null,

            durationMs:
              0
          });


        const result =
          await getDatabasePersistentIprAuthStore()
            .verifySessionTokenAsync(
              TOKEN
            );


        expect(
          result
        ).toEqual({
          ok:
            false,

          authenticated:
            false,

          reason:
            "SESSION_NOT_FOUND",

          session:
            null
        });


        /*
         * The stale process copy still physically exists,
         * proving the persistent verifier did not consult it.
         */
        const staleFallback =
          getProcessIprAuthStore()
            .verifySessionToken(
              TOKEN
            );

        expect(
          staleFallback.ok
        ).toBe(true);

        expect(
          staleFallback.authenticated
        ).toBe(true);

        expect(
          mockQueryDatabase
        ).toHaveBeenCalledTimes(
          1
        );
      }
    );


    it(
      "fails closed on persistent database verification error instead of authenticating from process fallback",
      async () => {

        seedProcessFallback();

        mockQueryDatabase
          .mockResolvedValueOnce({
            ok:
              false,

            status:
              "DEGRADED",

            rows:
              [],

            rowCount:
              0,

            error:
              "HBCE_TEST_DATABASE_UNAVAILABLE",

            sqlHash:
              null,

            durationMs:
              0
          });


        await expect(
          getDatabasePersistentIprAuthStore()
            .verifySessionTokenAsync(
              TOKEN
            )
        ).rejects.toThrow(
          "HBCE_TEST_DATABASE_UNAVAILABLE"
        );


        const staleFallback =
          getProcessIprAuthStore()
            .verifySessionToken(
              TOKEN
            );

        expect(
          staleFallback.ok
        ).toBe(true);

        expect(
          staleFallback.authenticated
        ).toBe(true);

        expect(
          mockQueryDatabase
        ).toHaveBeenCalledTimes(
          1
        );
      }
    );


    it(
      "leaves explicit PROCESS_AUTH_STORE_MVP behavior unchanged",
      () => {

        seedProcessFallback();

        const result =
          getProcessIprAuthStore()
            .verifySessionToken(
              TOKEN
            );

        expect(
          result.ok
        ).toBe(true);

        expect(
          result.authenticated
        ).toBe(true);

        expect(
          result.reason
        ).toBe(
          "SESSION_ACTIVE"
        );
      }
    );
  }
);
