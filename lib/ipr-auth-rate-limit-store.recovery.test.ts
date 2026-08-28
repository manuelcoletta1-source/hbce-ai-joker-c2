import {
  beforeEach,
  describe,
  expect,
  it,
  vi
} from "vitest";


const {
  mockQueryWithoutSchemaInitialization,
  mockTransaction,
  mockTransactionQuery
} = vi.hoisted(() => ({
  mockQueryWithoutSchemaInitialization:
    vi.fn(),

  mockTransaction:
    vi.fn(),

  mockTransactionQuery:
    vi.fn()
}));


vi.mock(
  "@/lib/ipr-database",
  () => ({
    queryHbceDatabaseWithoutSchemaInitialization:
      mockQueryWithoutSchemaInitialization
  })
);


vi.mock(
  "@/lib/ipr-database-transaction",
  () => ({
    withHbceDatabaseTransaction:
      mockTransaction
  })
);


import {
  IPR_AUTH_RATE_LIMIT_BOUNDARY,
  PersistentIprAuthRateLimitStore,
  describeIprAuthRateLimitStore
} from "@/lib/ipr-auth-rate-limit-store";


function databaseResult(
  rows:
    Array<Record<string, unknown>>
) {
  return {
    ok:
      true,

    status:
      "AVAILABLE",

    rows,

    rowCount:
      rows.length,

    error:
      null,

    sqlHash:
      null,

    durationMs:
      0
  };
}


function transactionQueryResult(
  kind:
    "IP" | "IPR_IP"
) {
  return {
    command:
      "",

    rowCount:
      1,

    oid:
      0,

    rows: [
      {
        bucket_kind:
          kind,

        failed_attempts:
          1,

        window_started_at:
          "2026-08-28T20:00:00.000Z",

        last_failed_at:
          "2026-08-28T20:00:01.000Z",

        blocked_until:
          null,

        legal_certification:
          false
      }
    ],

    fields:
      []
  };
}


beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();

  vi.stubEnv(
    "HBCE_AUTH_RATE_LIMIT_HASH_SECRET",
    "A".repeat(64)
  );

  mockQueryWithoutSchemaInitialization
    .mockResolvedValue(
      databaseResult([])
    );

  mockTransactionQuery
    .mockImplementation(
      async (
        _sql:
          unknown,
        parameters:
          readonly unknown[] = []
      ) => {

        const kind =
          parameters[1];

        if (
          kind !== "IP" &&
          kind !== "IPR_IP"
        ) {
          throw new Error(
            "HBCE_TEST_INVALID_BUCKET_KIND"
          );
        }

        return transactionQueryResult(
          kind
        );
      }
    );

  mockTransaction
    .mockImplementation(
      async (
        operation:
          (
            context: {
              query:
                typeof mockTransactionQuery;
            }
          ) => Promise<unknown>
      ) => {

        const value =
          await operation({
            query:
              mockTransactionQuery
          });

        return {
          ok:
            true,

          state:
            "COMMITTED",

          value,

          error:
            null,

          rollbackError:
            null
        };
      }
    );
});


describe(
  "HBCE password recovery rate-limit namespace",
  () => {

    it(
      "preserves the existing login HMAC keys while deriving distinct recovery keys",
      async () => {

        const store =
          new PersistentIprAuthRateLimitStore();

        const input = {
          humanIpr:
            "IPR-AAAAAAAAAAAA",

          clientIp:
            "203.0.113.10"
        };

        await store.inspectAsync(
          input
        );

        const loginKeys =
          mockQueryWithoutSchemaInitialization
            .mock
            .calls
            .map(
              (
                call
              ) =>
                call[1][0]
            );

        expect(
          loginKeys
        ).toHaveLength(
          2
        );

        mockQueryWithoutSchemaInitialization
          .mockClear();

        mockQueryWithoutSchemaInitialization
          .mockResolvedValue(
            databaseResult([])
          );

        await store
          .inspectPasswordRecoveryAsync(
            input
          );

        const recoveryKeys =
          mockQueryWithoutSchemaInitialization
            .mock
            .calls
            .map(
              (
                call
              ) =>
                call[1][0]
            );

        expect(
          recoveryKeys
        ).toHaveLength(
          2
        );

        expect(
          recoveryKeys[0]
        ).not.toBe(
          loginKeys[0]
        );

        expect(
          recoveryKeys[1]
        ).not.toBe(
          loginKeys[1]
        );

        for (
          const key of [
            ...loginKeys,
            ...recoveryKeys
          ]
        ) {
          expect(
            String(key)
          ).toMatch(
            /^hmac-sha256:[a-f0-9]{64}$/
          );
        }
      }
    );


    it(
      "records recovery failures in keys distinct from login failure buckets",
      async () => {

        const store =
          new PersistentIprAuthRateLimitStore();

        const input = {
          humanIpr:
            "IPR-AAAAAAAAAAAA",

          clientIp:
            "203.0.113.10"
        };

        await store.recordFailureAsync(
          input
        );

        const loginKeys =
          mockTransactionQuery
            .mock
            .calls
            .map(
              (
                call
              ) =>
                call[1][0]
            );

        expect(
          loginKeys
        ).toHaveLength(
          2
        );

        expect(
          mockTransactionQuery
            .mock
            .calls[0][1][1]
        ).toBe(
          "IP"
        );

        expect(
          mockTransactionQuery
            .mock
            .calls[1][1][1]
        ).toBe(
          "IPR_IP"
        );

        mockTransactionQuery
          .mockClear();

        await store
          .recordPasswordRecoveryFailureAsync(
            input
          );

        const recoveryKeys =
          mockTransactionQuery
            .mock
            .calls
            .map(
              (
                call
              ) =>
                call[1][0]
            );

        expect(
          recoveryKeys
        ).toHaveLength(
          2
        );

        expect(
          recoveryKeys[0]
        ).not.toBe(
          loginKeys[0]
        );

        expect(
          recoveryKeys[1]
        ).not.toBe(
          loginKeys[1]
        );

        expect(
          mockTransactionQuery
            .mock
            .calls[0][1][1]
        ).toBe(
          "IP"
        );

        expect(
          mockTransactionQuery
            .mock
            .calls[1][1][1]
        ).toBe(
          "IPR_IP"
        );
      }
    );


    it(
      "declares recovery isolation without granting reset or authentication authority",
      () => {

        expect(
          IPR_AUTH_RATE_LIMIT_BOUNDARY
            .passwordRecoveryKeyDomain
        ).toBe(
          "HBCE_C5X_PASSWORD_RECOVERY"
        );

        expect(
          IPR_AUTH_RATE_LIMIT_BOUNDARY
            .passwordRecoveryBucketsShareLoginKeys
        ).toBe(false);

        expect(
          IPR_AUTH_RATE_LIMIT_BOUNDARY
            .passwordRecoveryResetOnSuccess
        ).toBe(false);

        const description =
          describeIprAuthRateLimitStore();

        expect(
          description
            .passwordRecoveryKeyDomain
        ).toBe(
          "HBCE_C5X_PASSWORD_RECOVERY"
        );

        expect(
          description
            .passwordRecoveryBucketsShareLoginKeys
        ).toBe(false);

        expect(
          description
            .passwordRecoveryResetOnSuccess
        ).toBe(false);

        expect(
          description
            .sessionCreationAuthority
        ).toBe(false);

        expect(
          description
            .runtimeAuthorizationAuthority
        ).toBe(false);

        expect(
          description
            .credentialBypassAuthority
        ).toBe(false);
      }
    );
  }
);
