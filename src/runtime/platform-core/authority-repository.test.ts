import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const transactionHarness =
  vi.hoisted(
    () => ({
      plans:
        [] as Array<any>,

      options:
        [] as Array<any>,

      queries:
        [] as Array<{
          sql:
            string;

          parameters:
            readonly unknown[];
        }>,
    }),
  );

vi.mock(
  "../../../lib/ipr-database-transaction",
  () => ({
    withHbceDatabaseTransaction:
      vi.fn(
        async (
          operation:
            (context: any) =>
              Promise<any>,

          options:
            any = {},
        ) => {
          transactionHarness.options.push(
            options,
          );

          const plan =
            transactionHarness.plans.shift();

          if (!plan) {
            throw new Error(
              "UNPLANNED_TRANSACTION",
            );
          }

          if (
            plan.kind ===
              "FAIL"
          ) {
            return {
              ok:
                false,

              transactionId:
                "HBCE_AUTHORITY_TEST_TX",

              state:
                "ROLLED_BACK",

              startedAt:
                "2026-09-08T16:00:00.000Z",

              completedAt:
                "2026-09-08T16:00:00.001Z",

              durationMs:
                1,

              error:
                plan.error,

              rollbackError:
                null,
            };
          }

          const context = {
            client:
              {},

            transactionId:
              "HBCE_AUTHORITY_TEST_TX",

            startedAt:
              "2026-09-08T16:00:00.000Z",

            query:
              async (
                sql:
                  string,

                parameters:
                  readonly unknown[] =
                    [],
              ) => {
                transactionHarness.queries.push({
                  sql,
                  parameters,
                });

                const response =
                  plan.responses.shift();

                if (!response) {
                  throw new Error(
                    "UNPLANNED_QUERY",
                  );
                }

                return {
                  rows:
                    response.rows,
                };
              },
          };

          try {
            const value =
              await operation(
                context,
              );

            return {
              ok:
                true,

              transactionId:
                "HBCE_AUTHORITY_TEST_TX",

              state:
                "COMMITTED",

              startedAt:
                "2026-09-08T16:00:00.000Z",

              completedAt:
                "2026-09-08T16:00:00.001Z",

              durationMs:
                1,

              value,
            };
          } catch (
            error
          ) {
            return {
              ok:
                false,

              transactionId:
                "HBCE_AUTHORITY_TEST_TX",

              state:
                "ROLLED_BACK",

              startedAt:
                "2026-09-08T16:00:00.000Z",

              completedAt:
                "2026-09-08T16:00:00.001Z",

              durationMs:
                1,

              error:
                error instanceof Error
                  ? error.message
                  : String(
                      error,
                    ),

              rollbackError:
                null,
            };
          }
        },
      ),
  }),
);

import {
  PlatformCoreAuthorityRepositoryError,
  persistPlatformCoreCanonicalAuthority,
  readPlatformCoreCanonicalAuthority,
} from "./authority-repository";

import {
  canonicalizePlatformCorePayloadPreimage,
  computePlatformCorePayloadSha256,
} from "./canonical-payload-hash";

const PERSISTED_AT =
  "2026-09-08T16:30:00.000Z";

function queueTransaction(
  ...rowsByQuery:
    Array<readonly unknown[]>
): void {
  transactionHarness.plans.push({
    kind:
      "RUN",

    responses:
      rowsByQuery.map(
        (
          rows,
        ) => ({
          rows:
            [...rows],
        }),
      ),
  });
}

function queueFailure(
  error:
    string,
): void {
  transactionHarness.plans.push({
    kind:
      "FAIL",

    error,
  });
}

function makeCanonicalAuthorityFixture(
  overrides:
    Record<string, unknown> = {},
): Record<string, any> {
  const candidate:
    Record<string, any> = {
      proto:
        "HBCE-AUTHORITY-v1",

      kind:
        "HBCE_CORE_AUTHORITY",

      version:
        "v1",

      authority_id:
        "AUT-TEST-001",

      authority_version:
        7,

      principal_ref:
        "PRINCIPAL:TEST:001",

      actor_ref:
        "ACTOR:TEST:001",

      mandate_ref:
        "MND-TEST-001",

      mandate_version:
        3,

      capability_ref:
        "CAP-TEST-001",

      capability_version:
        4,

      authority_source: {
        source_type:
          "SYSTEM_POLICY",

        source_ref:
          "POLICY:TEST:AUTHORITY",
      },

      scope: {
        action_classes: [
          "ACTION:TEST:PERSIST",
        ],

        target_refs: [
          "TARGET:TEST:AUTHORITY",
        ],

        iospace_refs: [
          "IOSPACE:TEST",
        ],

        constraint_refs:
          [],
      },

      limits: {
        policy_refs: [
          "POLICY:TEST:LIMIT",
        ],

        quantitative_limit_refs:
          [],

        condition_refs:
          [],
      },

      state:
        "ACTIVE",

      valid_from:
        "2026-09-08T15:00:00.000Z",

      valid_until:
        null,

      created_at:
        "2026-09-08T15:00:00.000Z",

      updated_at:
        "2026-09-08T15:00:00.000Z",

      evidence_state:
        "PRESENT",

      evidence_reference:
        "EVIDENCE:TEST:AUTHORITY",

      append_only:
        true,

      genealogy: {
        derived_from:
          null,

        previous_state:
          null,

        new_state:
          "ACTIVE",

        cause:
          "TEST_FIXTURE",

        evidence_reference:
          "EVIDENCE:TEST:AUTHORITY",

        timestamp:
          "2026-09-08T15:00:00.000Z",

        hash:
          "b".repeat(
            64,
          ),
      },

      boundary: {
        data_minimization:
          true,

        reference_over_raw_evidence:
          true,

        authority_not_identity:
          true,

        authority_not_mandate:
          true,

        authority_not_capability:
          true,

        authority_not_authorization:
          true,

        authority_not_execution:
          true,

        active_authority_not_authorization:
          true,

        dependency_versions_explicit:
          true,

        append_only_genealogy:
          true,

        no_automatic_execution_claim:
          true,

        no_regulated_certification_claim:
          true,

        no_public_authority_claim:
          true,

        fail_closed:
          true,
      },

      ...overrides,
    };

  candidate.payload_sha256 =
    computePlatformCorePayloadSha256(
      candidate,
    );

  return candidate;
}

function rowFrom(
  authority:
    Record<string, any>,
  overrides:
    Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    authority_id:
      authority.authority_id,

    authority_version:
      authority.authority_version,

    payload_sha256:
      authority.payload_sha256,

    canonical_payload_preimage_utf8:
      canonicalizePlatformCorePayloadPreimage(
        authority,
      ),

    state:
      authority.state,

    persisted_at:
      PERSISTED_AT,

    ...overrides,
  };
}

function errorCode(
  error:
    unknown,
): string | null {
  return (
    error instanceof
      PlatformCoreAuthorityRepositoryError
  )
    ? error.code
    : null;
}

beforeEach(
  () => {
    transactionHarness.plans.length =
      0;

    transactionHarness.options.length =
      0;

    transactionHarness.queries.length =
      0;

    vi.clearAllMocks();
  },
);

describe(
  "Platform Core Authority repository",
  () => {
    it(
      "A01 valid canonical Authority insert persists exact material",
      async () => {
        const authority =
          makeCanonicalAuthorityFixture();

        queueTransaction([
          rowFrom(
            authority,
          ),
        ]);

        const result =
          await persistPlatformCoreCanonicalAuthority(
            authority,
          );

        expect(
          result.authority,
        ).toEqual(
          authority,
        );

        expect(
          result.idempotentReplay,
        ).toBe(
          false,
        );

        expect(
          result.persistedAt,
        ).toBe(
          PERSISTED_AT,
        );

        expect(
          transactionHarness.options[0],
        ).toMatchObject({
          isolationLevel:
            "SERIALIZABLE",
        });

        const insert =
          transactionHarness.queries.find(
            (
              query,
            ) =>
              query.sql.includes(
                "INSERT INTO",
              ),
          );

        expect(
          insert,
        ).toBeDefined();

        expect(
          insert!.parameters[0],
        ).toBe(
          authority.authority_id,
        );

        expect(
          insert!.parameters[1],
        ).toBe(
          authority.authority_version,
        );

        expect(
          insert!.parameters[2],
        ).toBe(
          authority.payload_sha256,
        );

        expect(
          insert!.parameters[3],
        ).toBe(
          canonicalizePlatformCorePayloadPreimage(
            authority,
          ),
        );
      },
    );

    it(
      "A02 exact duplicate is an idempotent replay",
      async () => {
        const authority =
          makeCanonicalAuthorityFixture();

        queueTransaction(
          [],
          [
            rowFrom(
              authority,
            ),
          ],
        );

        const result =
          await persistPlatformCoreCanonicalAuthority(
            authority,
          );

        expect(
          result.authority,
        ).toEqual(
          authority,
        );

        expect(
          result.idempotentReplay,
        ).toBe(
          true,
        );

        expect(
          transactionHarness.queries,
        ).toHaveLength(
          2,
        );
      },
    );

    it(
      "A03 same durable identity with different material fails closed",
      async () => {
        const authority =
          makeCanonicalAuthorityFixture();

        const conflicting =
          makeCanonicalAuthorityFixture({
            principal_ref:
              "PRINCIPAL:TEST:ALT",
          });

        queueTransaction(
          [],
          [
            rowFrom(
              conflicting,
            ),
          ],
        );

        await expect(
          persistPlatformCoreCanonicalAuthority(
            authority,
          ),
        ).rejects.toSatisfy(
          (
            error:
              unknown,
          ) =>
            errorCode(
              error,
            )
              ===
            "CONFLICTING_DUPLICATE",
        );
      },
    );

    it(
      "A04 ambiguous identity or payload reconciliation fails closed",
      async () => {
        const authority =
          makeCanonicalAuthorityFixture();

        const durablePayloadCollision =
          rowFrom(
            authority,
            {
              authority_id:
                "AUT-COLLISION-OTHER",
            },
          );

        queueTransaction(
          [],
          [
            rowFrom(
              authority,
            ),
            durablePayloadCollision,
          ],
        );

        await expect(
          persistPlatformCoreCanonicalAuthority(
            authority,
          ),
        ).rejects.toSatisfy(
          (
            error:
              unknown,
          ) =>
            errorCode(
              error,
            )
              ===
            "CONFLICTING_DUPLICATE",
        );
      },
    );

    it(
      "A05 structurally invalid canonical Authority fails before transaction entry",
      async () => {
        const invalid =
          makeCanonicalAuthorityFixture();

        delete invalid.actor_ref;

        await expect(
          persistPlatformCoreCanonicalAuthority(
            invalid,
          ),
        ).rejects.toSatisfy(
          (
            error:
              unknown,
          ) =>
            errorCode(
              error,
            )
              ===
            "STATIC_SCHEMA_VALIDATION_FAILED",
        );

        expect(
          transactionHarness.options,
        ).toHaveLength(
          0,
        );
      },
    );

    it(
      "A06 mismatching payload hash fails before transaction entry",
      async () => {
        const invalid = {
          ...makeCanonicalAuthorityFixture(),

          payload_sha256:
            "0".repeat(
              64,
            ),
        };

        await expect(
          persistPlatformCoreCanonicalAuthority(
            invalid,
          ),
        ).rejects.toSatisfy(
          (
            error:
              unknown,
          ) =>
            errorCode(
              error,
            )
              ===
            "PAYLOAD_HASH_MISMATCH",
        );

        expect(
          transactionHarness.options,
        ).toHaveLength(
          0,
        );
      },
    );

    it(
      "A07 exact read returns verified canonical Authority",
      async () => {
        const authority =
          makeCanonicalAuthorityFixture();

        queueTransaction([
          rowFrom(
            authority,
          ),
        ]);

        const result =
          await readPlatformCoreCanonicalAuthority(
            authority.authority_id,
            authority.authority_version,
          );

        expect(
          result,
        ).toEqual(
          authority,
        );
      },
    );

    it(
      "A08 absent exact revision returns null",
      async () => {
        const authority =
          makeCanonicalAuthorityFixture();

        queueTransaction(
          [],
        );

        const result =
          await readPlatformCoreCanonicalAuthority(
            authority.authority_id,
            authority.authority_version,
          );

        expect(
          result,
        ).toBeNull();
      },
    );

    it(
      "A09 malformed persisted canonical preimage fails closed",
      async () => {
        const authority =
          makeCanonicalAuthorityFixture();

        queueTransaction([
          rowFrom(
            authority,
            {
              canonical_payload_preimage_utf8:
                "{",
            },
          ),
        ]);

        await expect(
          readPlatformCoreCanonicalAuthority(
            authority.authority_id,
            authority.authority_version,
          ),
        ).rejects.toSatisfy(
          (
            error:
              unknown,
          ) =>
            errorCode(
              error,
            )
              ===
            "PERSISTED_RECORD_INVALID",
        );
      },
    );

    it(
      "A10 persisted extracted column mismatch fails closed",
      async () => {
        const authority =
          makeCanonicalAuthorityFixture();

        queueTransaction([
          rowFrom(
            authority,
            {
              state:
                "LIMITED",
            },
          ),
        ]);

        await expect(
          readPlatformCoreCanonicalAuthority(
            authority.authority_id,
            authority.authority_version,
          ),
        ).rejects.toSatisfy(
          (
            error:
              unknown,
          ) =>
            errorCode(
              error,
            )
              ===
            "PERSISTED_RECORD_INVALID",
        );
      },
    );

    it(
      "A11 write retries one serialization failure and then succeeds",
      async () => {
        const authority =
          makeCanonicalAuthorityFixture();

        queueFailure(
          "serialization failure SQLSTATE 40001",
        );

        queueTransaction([
          rowFrom(
            authority,
          ),
        ]);

        const result =
          await persistPlatformCoreCanonicalAuthority(
            authority,
          );

        expect(
          result.idempotentReplay,
        ).toBe(
          false,
        );

        expect(
          transactionHarness.options,
        ).toHaveLength(
          2,
        );
      },
    );

    it(
      "A12 write fails closed after three serialization failures",
      async () => {
        const authority =
          makeCanonicalAuthorityFixture();

        queueFailure(
          "SQLSTATE 40001 serialization failure",
        );

        queueFailure(
          "SQLSTATE 40001 serialization failure",
        );

        queueFailure(
          "SQLSTATE 40001 serialization failure",
        );

        await expect(
          persistPlatformCoreCanonicalAuthority(
            authority,
          ),
        ).rejects.toSatisfy(
          (
            error:
              unknown,
          ) =>
            errorCode(
              error,
            )
              ===
            "SERIALIZATION_RETRIES_EXHAUSTED",
        );

        expect(
          transactionHarness.options,
        ).toHaveLength(
          3,
        );
      },
    );

    it(
      "A13 ordinary write database failure is not retried",
      async () => {
        const authority =
          makeCanonicalAuthorityFixture();

        queueFailure(
          "database connection refused",
        );

        await expect(
          persistPlatformCoreCanonicalAuthority(
            authority,
          ),
        ).rejects.toSatisfy(
          (
            error:
              unknown,
          ) =>
            errorCode(
              error,
            )
              ===
            "DATABASE_FAILURE",
        );

        expect(
          transactionHarness.options,
        ).toHaveLength(
          1,
        );
      },
    );

    it(
      "A14 read uses SERIALIZABLE read-only transaction boundary",
      async () => {
        const authority =
          makeCanonicalAuthorityFixture();

        queueTransaction([
          rowFrom(
            authority,
          ),
        ]);

        await readPlatformCoreCanonicalAuthority(
          authority.authority_id,
          authority.authority_version,
        );

        expect(
          transactionHarness.options,
        ).toHaveLength(
          1,
        );

        expect(
          transactionHarness.options[0],
        ).toMatchObject({
          isolationLevel:
            "SERIALIZABLE",

          readOnly:
            true,
        });
      },
    );

    it(
      "A15 read retries serialization failure and then returns exact absence",
      async () => {
        const authority =
          makeCanonicalAuthorityFixture();

        queueFailure(
          "code 40001 serialization failure",
        );

        queueTransaction(
          [],
        );

        const result =
          await readPlatformCoreCanonicalAuthority(
            authority.authority_id,
            authority.authority_version,
          );

        expect(
          result,
        ).toBeNull();

        expect(
          transactionHarness.options,
        ).toHaveLength(
          2,
        );

        expect(
          transactionHarness.options[1],
        ).toMatchObject({
          isolationLevel:
            "SERIALIZABLE",

          readOnly:
            true,
        });
      },
    );

    it(
      "A16 multiple rows for exact revision fail closed",
      async () => {
        const authority =
          makeCanonicalAuthorityFixture();

        const row =
          rowFrom(
            authority,
          );

        queueTransaction([
          row,
          {
            ...row,
          },
        ]);

        await expect(
          readPlatformCoreCanonicalAuthority(
            authority.authority_id,
            authority.authority_version,
          ),
        ).rejects.toSatisfy(
          (
            error:
              unknown,
          ) =>
            errorCode(
              error,
            )
              ===
            "PERSISTED_RECORD_INVALID",
        );
      },
    );
  },
);
