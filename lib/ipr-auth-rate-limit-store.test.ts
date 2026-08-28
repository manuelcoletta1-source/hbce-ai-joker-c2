import {
  beforeEach,
  describe,
  expect,
  it,
  vi
} from "vitest";


const {
  mockQueryWithoutSchemaInitialization,
  mockTransaction
} = vi.hoisted(() => ({
  mockQueryWithoutSchemaInitialization:
    vi.fn(),

  mockTransaction:
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
  describeIprAuthRateLimitStore,
  resolveIprAuthRateLimitClientIp
} from "@/lib/ipr-auth-rate-limit-store";


function databaseResult(
  rows: Array<Record<string, unknown>>
) {
  return {
    ok: true,
    status: "AVAILABLE",
    rows,
    rowCount: rows.length,
    error: null,
    sqlHash: null,
    durationMs: 0
  };
}


function bucketRow(
  kind: "IP" | "IPR_IP",
  failedAttempts = 1
) {
  return {
    bucket_kind: kind,
    failed_attempts: failedAttempts,
    window_started_at:
      "2026-08-27 18:00:00+00",
    last_failed_at:
      "2026-08-27 18:01:00+00",
    blocked_until: null,
    legal_certification: false
  };
}


describe(
  "PersistentIprAuthRateLimitStore",
  () => {

    beforeEach(() => {
      vi.clearAllMocks();
      vi.unstubAllEnvs();

      vi.stubEnv(
        "HBCE_AUTH_RATE_LIMIT_HASH_SECRET",
        "A".repeat(64)
      );
    });


    it(
      "preserves the C5X privacy and authority boundary",
      () => {
        expect(
          IPR_AUTH_RATE_LIMIT_BOUNDARY
            .schemaVersion
        ).toBe(
          "HBCE-IPR-DB-v1.12"
        );

        expect(
          IPR_AUTH_RATE_LIMIT_BOUNDARY
            .table
        ).toBe(
          "ipr_auth_rate_limit_buckets"
        );

        expect(
          IPR_AUTH_RATE_LIMIT_BOUNDARY
            .keyDerivation
        ).toBe(
          "HMAC-SHA256"
        );

        expect(
          IPR_AUTH_RATE_LIMIT_BOUNDARY
            .rawIpPersistence
        ).toBe(false);

        expect(
          IPR_AUTH_RATE_LIMIT_BOUNDARY
            .rawHumanIprPersistence
        ).toBe(false);

        expect(
          IPR_AUTH_RATE_LIMIT_BOUNDARY
            .rawUserAgentPersistence
        ).toBe(false);

        expect(
          IPR_AUTH_RATE_LIMIT_BOUNDARY
            .globalIpResetOnSuccessfulLogin
        ).toBe(false);

        expect(
          IPR_AUTH_RATE_LIMIT_BOUNDARY
            .iprIpResetOnSuccessfulLogin
        ).toBe(true);

        expect(
          IPR_AUTH_RATE_LIMIT_BOUNDARY
            .sessionCreationAuthority
        ).toBe(false);

        expect(
          IPR_AUTH_RATE_LIMIT_BOUNDARY
            .runtimeAuthorizationAuthority
        ).toBe(false);

        expect(
          IPR_AUTH_RATE_LIMIT_BOUNDARY
            .credentialBypassAuthority
        ).toBe(false);

        expect(
          IPR_AUTH_RATE_LIMIT_BOUNDARY
            .legalCertification
        ).toBe(false);
      }
    );


    it(
      "uses the first Vercel forwarded IP in production",
      () => {
        vi.stubEnv(
          "NODE_ENV",
          "production"
        );

        const headers =
          new Headers({
            "x-forwarded-for":
              "203.0.113.9, 10.0.0.1",
            "x-real-ip":
              "198.51.100.8"
          });

        expect(
          resolveIprAuthRateLimitClientIp(
            headers
          )
        ).toBe(
          "203.0.113.9"
        );
      }
    );


    it(
      "does not trust x-real-ip fallback in production",
      () => {
        vi.stubEnv(
          "NODE_ENV",
          "production"
        );

        const headers =
          new Headers({
            "x-forwarded-for":
              "not-an-ip",
            "x-real-ip":
              "198.51.100.8"
          });

        expect(
          resolveIprAuthRateLimitClientIp(
            headers
          )
        ).toBeNull();
      }
    );


    it(
      "accepts x-real-ip only as non-production fallback",
      () => {
        vi.stubEnv(
          "NODE_ENV",
          "test"
        );

        const headers =
          new Headers({
            "x-real-ip":
              "198.51.100.8"
          });

        expect(
          resolveIprAuthRateLimitClientIp(
            headers
          )
        ).toBe(
          "198.51.100.8"
        );
      }
    );


    it(
      "fails closed when the HMAC secret is missing",
      async () => {
        vi.stubEnv(
          "HBCE_AUTH_RATE_LIMIT_HASH_SECRET",
          ""
        );

        const store =
          new PersistentIprAuthRateLimitStore();

        await expect(
          store.inspectAsync({
            humanIpr: "IPR-3",
            clientIp:
              "203.0.113.9"
          })
        ).rejects.toThrow(
          "HBCE_AUTH_RATE_LIMIT_HASH_SECRET_REQUIRED"
        );

        expect(
          mockQueryWithoutSchemaInitialization
        ).not.toHaveBeenCalled();
      }
    );


    it(
      "derives opaque distinct HMAC keys without raw IP or Human IPR",
      async () => {
        mockQueryWithoutSchemaInitialization
          .mockResolvedValue(
            databaseResult([])
          );

        const store =
          new PersistentIprAuthRateLimitStore();

        const result =
          await store.inspectAsync({
            humanIpr: "IPR-3",
            clientIp:
              "203.0.113.9"
          });

        expect(
          result.blocked
        ).toBe(false);

        expect(
          mockQueryWithoutSchemaInitialization
        ).toHaveBeenCalledTimes(2);

        const firstKey =
          mockQueryWithoutSchemaInitialization
            .mock.calls[0][1][0];

        const secondKey =
          mockQueryWithoutSchemaInitialization
            .mock.calls[1][1][0];

        expect(
          typeof firstKey
        ).toBe("string");

        expect(
          typeof secondKey
        ).toBe("string");

        expect(
          firstKey
        ).toMatch(
          /^hmac-sha256:[0-9a-f]{64}$/
        );

        expect(
          secondKey
        ).toMatch(
          /^hmac-sha256:[0-9a-f]{64}$/
        );

        expect(
          firstKey
        ).not.toBe(
          secondKey
        );

        expect(
          firstKey
        ).not.toContain(
          "203.0.113.9"
        );

        expect(
          secondKey
        ).not.toContain(
          "203.0.113.9"
        );

        expect(
          firstKey
        ).not.toContain(
          "IPR-3"
        );

        expect(
          secondKey
        ).not.toContain(
          "IPR-3"
        );
      }
    );


    it(
      "records IP before IPR_IP in one transaction",
      async () => {
        const query =
          vi.fn(
            async (
              _sql: string,
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
                  "UNEXPECTED_BUCKET_KIND"
                );
              }

              return {
                rows: [
                  bucketRow(
                    kind
                  )
                ]
              };
            }
          );

        mockTransaction
          .mockImplementation(
            async (
              operation:
                (
                  context: {
                    query:
                      typeof query;
                    transactionId:
                      string;
                    startedAt:
                      string;
                  }
                ) =>
                  Promise<unknown>
            ) => {
              const value =
                await operation({
                  query,
                  transactionId:
                    "HBCE-C5X-TEST-TX",
                  startedAt:
                    "2026-08-27T18:00:00.000Z"
                });

              return {
                ok: true,
                transactionId:
                  "HBCE-C5X-TEST-TX",
                state: "COMMITTED",
                startedAt:
                  "2026-08-27T18:00:00.000Z",
                completedAt:
                  "2026-08-27T18:00:01.000Z",
                durationMs: 1,
                value
              };
            }
          );

        const store =
          new PersistentIprAuthRateLimitStore();

        const result =
          await store.recordFailureAsync({
            humanIpr: "IPR-3",
            clientIp:
              "203.0.113.9"
          });

        expect(
          mockTransaction
        ).toHaveBeenCalledTimes(1);

        expect(
          query
        ).toHaveBeenCalledTimes(2);

        expect(
          query.mock.calls[0]![1]![1]
        ).toBe("IP");

        expect(
          query.mock.calls[1]![1]![1]
        ).toBe("IPR_IP");

        expect(
          result.ip?.bucketKind
        ).toBe("IP");

        expect(
          result.iprIp?.bucketKind
        ).toBe("IPR_IP");

        expect(
          result.legalCertification
        ).toBe(false);
      }
    );


    it(
      "resets only the IPR_IP pair bucket after valid authentication",
      async () => {
        const query =
          vi.fn(
            async (
              sql: string,
              _parameters:
                readonly unknown[] = []
            ) => {
              expect(
                sql
              ).toContain(
                "bucket_kind = 'IPR_IP'"
              );

              expect(
                sql
              ).not.toContain(
                "bucket_kind = 'IP'"
              );

              return {
                rows: [
                  bucketRow(
                    "IPR_IP",
                    0
                  )
                ]
              };
            }
          );

        mockTransaction
          .mockImplementation(
            async (
              operation:
                (
                  context: {
                    query:
                      typeof query;
                    transactionId:
                      string;
                    startedAt:
                      string;
                  }
                ) =>
                  Promise<unknown>
            ) => {
              const value =
                await operation({
                  query,
                  transactionId:
                    "HBCE-C5X-RESET-TX",
                  startedAt:
                    "2026-08-27T18:00:00.000Z"
                });

              return {
                ok: true,
                transactionId:
                  "HBCE-C5X-RESET-TX",
                state: "COMMITTED",
                startedAt:
                  "2026-08-27T18:00:00.000Z",
                completedAt:
                  "2026-08-27T18:00:01.000Z",
                durationMs: 1,
                value
              };
            }
          );

        const store =
          new PersistentIprAuthRateLimitStore();

        const result =
          await store
            .resetIprIpAfterSuccessAsync({
              humanIpr: "IPR-3",
              clientIp:
                "203.0.113.9"
            });

        expect(
          query
        ).toHaveBeenCalledTimes(1);

        expect(
          result?.bucketKind
        ).toBe(
          "IPR_IP"
        );

        expect(
          result?.failedAttempts
        ).toBe(0);
      }
    );


    it(
      "reports secret configuration without exposing the secret",
      () => {
        const description =
          describeIprAuthRateLimitStore();

        expect(
          description.secretConfigured
        ).toBe(true);

        expect(
          JSON.stringify(
            description
          )
        ).not.toContain(
          "A".repeat(64)
        );

        expect(
          description.legalCertification
        ).toBe(false);
      }
    );
  }
);
