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
      mockQueryDatabase,

    queryHbceDatabaseWithoutSchemaInitialization:
      mockQueryDatabase
  })
);


import {
  getDatabasePersistentIprAuthStore,
  getProcessIprAuthStore,
  verifyDatabasePersistentIprSessionTokenReadOnly
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


describe("DATABASE_PERSISTENT read-only session verification", () => {
  const row = (overrides: Record<string, unknown> = {}) => ({
    session_id: "HBCE-SESSION-READ-ONLY-AUTHORITY-TEST",
    human_ipr: HUMAN_IPR,
    runtime_ipr: "IPR-AI-0001",
    token_hash: "HBCE-TEST-TOKEN-HASH",
    status: "ACTIVE",
    created_at: "2026-08-28T20:00:00.000Z",
    expires_at: "2099-08-28T20:00:00.000Z",
    revoked_at: null,
    last_seen_at: null,
    device_label: null,
    user_agent_hash: null,
    ip_address_hash: null,
    session_payload: { source: "HBCE_TEST_READ_ONLY_SESSION" },
    legal_certification: false,
    ...overrides
  });

  const expectSelectOnly = () => {
    expect(mockQueryDatabase).toHaveBeenCalledTimes(1);
    const sql = String(mockQueryDatabase.mock.calls[0]?.[0] || "");
    expect(sql.trim().startsWith("SELECT")).toBe(true);
    expect(sql).not.toMatch(/\b(INSERT|UPDATE|DELETE|MERGE|CREATE|ALTER|DROP|TRUNCATE)\b/i);
  };

  it("authenticates active session with SELECT only and no process-session hydration", async () => {
    mockQueryDatabase.mockResolvedValueOnce({ ok: true, rows: [row()] });
    const result = await verifyDatabasePersistentIprSessionTokenReadOnly(TOKEN);
    expect(result).toMatchObject({ ok: true, authenticated: true, reason: "SESSION_ACTIVE" });
    expectSelectOnly();
    expect(getProcessIprAuthStore().verifySessionToken(TOKEN)).toMatchObject({
      ok: false,
      authenticated: false,
      reason: "SESSION_NOT_FOUND"
    });
  });

  it("denies expired session without expiry write", async () => {
    mockQueryDatabase.mockResolvedValueOnce({
      ok: true,
      rows: [row({ expires_at: "2000-01-01T00:00:00.000Z" })]
    });
    const result = await verifyDatabasePersistentIprSessionTokenReadOnly(TOKEN);
    expect(result).toMatchObject({
      ok: false,
      authenticated: false,
      reason: "SESSION_EXPIRED",
      session: { status: "EXPIRED" }
    });
    expectSelectOnly();
  });

  it("denies revoked session without database mutation", async () => {
    mockQueryDatabase.mockResolvedValueOnce({
      ok: true,
      rows: [row({ status: "REVOKED", revoked_at: "2026-09-11T18:00:00.000Z" })]
    });
    const result = await verifyDatabasePersistentIprSessionTokenReadOnly(TOKEN);
    expect(result).toMatchObject({
      ok: false,
      authenticated: false,
      reason: "SESSION_REVOKED"
    });
    expectSelectOnly();
  });

  it("fails closed on database error even with active process fallback", async () => {
    seedProcessFallback();
    mockQueryDatabase.mockResolvedValueOnce({
      ok: false,
      rows: [],
      error: "HBCE_TEST_READ_ONLY_DATABASE_FAILURE"
    });
    await expect(
      verifyDatabasePersistentIprSessionTokenReadOnly(TOKEN)
    ).rejects.toThrow("HBCE_TEST_READ_ONLY_DATABASE_FAILURE");
    expectSelectOnly();
  });
});
