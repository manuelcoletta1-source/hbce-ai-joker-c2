import {
  readFileSync,
} from "node:fs";

import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const mocks =
  vi.hoisted(
    () => ({
      query:
        vi.fn(),

      transaction:
        vi.fn(),
    }),
  );

vi.mock(
  "../../../lib/ipr-database-transaction",
  () => ({
    withHbceDatabaseTransaction:
      mocks.transaction,
  }),
);

import {
  PLATFORM_CORE_CANONICAL_STATE_SNAPSHOT_MAX_ATTEMPTS,
  PLATFORM_CORE_CANONICAL_STATE_SNAPSHOT_REPOSITORY_PROTOCOL,
  PLATFORM_CORE_CANONICAL_STATE_SNAPSHOT_TRANSACTION_ISOLATION,
  PlatformCoreCanonicalStateSnapshotRepositoryError,
  persistPlatformCoreCanonicalStateSnapshot,
  readPlatformCoreCanonicalStateSnapshot,
} from "./canonical-state-snapshot-repository";

import {
  derivePlatformCoreCanonicalObservedStateReference,
  type PlatformCoreCanonicalObservedStateReference,
} from "./canonical-observed-state-reference";

const CREATED_AT =
  "2026-09-02T18:30:00.000Z";

const OBSERVED_STATE = {
  account: {
    status:
      "ACTIVE",

    balance:
      1250,
  },

  sequence: [
    1,
    2,
    3,
  ],
};

const MATERIAL =
  derivePlatformCoreCanonicalObservedStateReference(
    OBSERVED_STATE,
  );

function rowFromMaterial(
  material:
    PlatformCoreCanonicalObservedStateReference = MATERIAL,
  overrides:
    Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    state_ref:
      material.stateRef,

    state_sha256:
      material.stateSha256,

    canonical_state_utf8:
      material.canonicalStateUtf8,

    created_at:
      CREATED_AT,

    ...overrides,
  };
}

function installTransactionRunner():
  void {
  mocks.transaction.mockImplementation(
    async (
      callback:
        (
          transaction: {
            query:
              typeof mocks.query;
          },
        ) => Promise<unknown>,
    ) => {
      try {
        const value =
          await callback({
            query:
              mocks.query,
          });

        return {
          ok:
            true,

          value,
        };
      } catch (
        error
      ) {
        return {
          ok:
            false,

          error:
            error instanceof Error
              ? error.message
              : String(
                  error,
                ),
        };
      }
    },
  );
}

function errorCode(
  error:
    unknown,
): string | null {
  return (
    error instanceof
      PlatformCoreCanonicalStateSnapshotRepositoryError
  )
    ? error.code
    : null;
}

beforeEach(
  () => {
    vi.clearAllMocks();

    installTransactionRunner();
  },
);

describe(
  "Platform Core canonical state snapshot repository",
  () => {
    it(
      "locks repository protocol, isolation and retry count",
      () => {
        expect(
          PLATFORM_CORE_CANONICAL_STATE_SNAPSHOT_REPOSITORY_PROTOCOL,
        ).toBe(
          "HBCE-PLATFORM-CORE-CANONICAL-STATE-SNAPSHOT-REPOSITORY-v1",
        );

        expect(
          PLATFORM_CORE_CANONICAL_STATE_SNAPSHOT_TRANSACTION_ISOLATION,
        ).toBe(
          "SERIALIZABLE",
        );

        expect(
          PLATFORM_CORE_CANONICAL_STATE_SNAPSHOT_MAX_ATTEMPTS,
        ).toBe(
          3,
        );
      },
    );

    it(
      "locks migration as content-only append-only storage",
      () => {
        const sql =
          readFileSync(
            new URL(
              "../../../database/migrations/20260902_platform_core_canonical_state_snapshots.sql",
              import.meta.url,
            ),
            "utf8",
          );

        expect(
          sql,
        ).toContain(
          "CREATE TABLE public.hbce_platform_core_canonical_state_snapshots",
        );

        expect(
          sql,
        ).toContain(
          "state_ref TEXT",
        );

        expect(
          sql,
        ).toContain(
          "state_sha256 TEXT",
        );

        expect(
          sql,
        ).toContain(
          "canonical_state_utf8 TEXT",
        );

        expect(
          sql,
        ).toContain(
          "hbce_platform_core_canonical_state_snapshots_reject_update",
        );

        expect(
          sql,
        ).toContain(
          "hbce_platform_core_canonical_state_snapshots_reject_delete",
        );

        const tableBody =
          sql.match(
            /CREATE TABLE public\.hbce_platform_core_canonical_state_snapshots \(([\s\S]*?)\n\);/,
          )?.[1] ?? "";

        expect(
          tableBody,
        ).not.toContain(
          "execution_id",
        );

        expect(
          tableBody,
        ).not.toContain(
          "evidence_reference",
        );

        expect(
          tableBody,
        ).not.toContain(
          "observed_at",
        );

        expect(
          tableBody,
        ).not.toContain(
          "authorization_ref",
        );
      },
    );

    it(
      "persists a first canonical snapshot",
      async () => {
        mocks.query.mockImplementation(
          async (
            sql:
              string,
            params:
              unknown[],
          ) => {
            expect(
              sql,
            ).toContain(
              "INSERT INTO",
            );

            expect(
              sql,
            ).toContain(
              "ON CONFLICT DO NOTHING",
            );

            expect(
              params,
            ).toEqual([
              MATERIAL.stateRef,
              MATERIAL.stateSha256,
              MATERIAL.canonicalStateUtf8,
            ]);

            return {
              rows: [
                rowFromMaterial(),
              ],
            };
          },
        );

        const result =
          await persistPlatformCoreCanonicalStateSnapshot(
            OBSERVED_STATE,
          );

        expect(
          result.stateRef,
        ).toBe(
          MATERIAL.stateRef,
        );

        expect(
          result.stateSha256,
        ).toBe(
          MATERIAL.stateSha256,
        );

        expect(
          result.canonicalStateUtf8,
        ).toBe(
          MATERIAL.canonicalStateUtf8,
        );

        expect(
          result.createdAt,
        ).toBe(
          CREATED_AT,
        );

        expect(
          result.idempotentReplay,
        ).toBe(
          false,
        );

        expect(
          Object.isFrozen(
            result,
          ),
        ).toBe(
          true,
        );

        expect(
          mocks.query,
        ).toHaveBeenCalledTimes(
          1,
        );

        expect(
          mocks.transaction,
        ).toHaveBeenCalledWith(
          expect.any(
            Function,
          ),
          {
            isolationLevel:
              "SERIALIZABLE",
          },
        );
      },
    );

    it(
      "returns exact existing content as idempotent replay",
      async () => {
        mocks.query.mockImplementation(
          async (
            sql:
              string,
          ) => {
            if (
              sql.includes(
                "INSERT INTO",
              )
            ) {
              return {
                rows:
                  [],
              };
            }

            if (
              sql.includes(
                "SELECT",
              )
            ) {
              return {
                rows: [
                  rowFromMaterial(),
                ],
              };
            }

            throw new Error(
              "UNEXPECTED_QUERY",
            );
          },
        );

        const result =
          await persistPlatformCoreCanonicalStateSnapshot(
            OBSERVED_STATE,
          );

        expect(
          result.idempotentReplay,
        ).toBe(
          true,
        );

        expect(
          result.stateRef,
        ).toBe(
          MATERIAL.stateRef,
        );

        expect(
          mocks.query,
        ).toHaveBeenCalledTimes(
          2,
        );
      },
    );

    it(
      "rejects non-canonical observed input before transaction entry",
      async () => {
        await expect(
          persistPlatformCoreCanonicalStateSnapshot(
            undefined,
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
            "INVALID_INPUT",
        );

        expect(
          mocks.transaction,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "fails closed when inserted durable content is corrupted",
      async () => {
        mocks.query.mockResolvedValue({
          rows: [
            rowFromMaterial(
              MATERIAL,
              {
                canonical_state_utf8:
                  '{"corrupted":true}',
              },
            ),
          ],
        });

        await expect(
          persistPlatformCoreCanonicalStateSnapshot(
            OBSERVED_STATE,
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
            "PERSISTENCE_AMBIGUITY",
        );
      },
    );

    it(
      "fails closed on ambiguous conflict reconciliation",
      async () => {
        mocks.query.mockImplementation(
          async (
            sql:
              string,
          ) => {
            if (
              sql.includes(
                "INSERT INTO",
              )
            ) {
              return {
                rows:
                  [],
              };
            }

            return {
              rows: [
                rowFromMaterial(),
                rowFromMaterial(),
              ],
            };
          },
        );

        await expect(
          persistPlatformCoreCanonicalStateSnapshot(
            OBSERVED_STATE,
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
            "PERSISTENCE_AMBIGUITY",
        );
      },
    );

    it(
      "retries a serialization failure and then persists",
      async () => {
        mocks.transaction
          .mockResolvedValueOnce({
            ok:
              false,

            error:
              "serialization failure SQLSTATE 40001",
          });

        installTransactionRunner();

        mocks.query.mockResolvedValue({
          rows: [
            rowFromMaterial(),
          ],
        });

        const result =
          await persistPlatformCoreCanonicalStateSnapshot(
            OBSERVED_STATE,
          );

        expect(
          result.idempotentReplay,
        ).toBe(
          false,
        );

        expect(
          mocks.transaction,
        ).toHaveBeenCalledTimes(
          2,
        );
      },
    );

    it(
      "fails closed after three serialization failures",
      async () => {
        mocks.transaction.mockResolvedValue({
          ok:
            false,

          error:
            "SQLSTATE 40001 serialization failure",
        });

        await expect(
          persistPlatformCoreCanonicalStateSnapshot(
            OBSERVED_STATE,
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
            "SERIALIZATION_RETRY_EXHAUSTED",
        );

        expect(
          mocks.transaction,
        ).toHaveBeenCalledTimes(
          3,
        );
      },
    );

    it(
      "classifies ordinary persistence failure as database failure",
      async () => {
        mocks.transaction.mockResolvedValue({
          ok:
            false,

          error:
            "connection refused",
        });

        await expect(
          persistPlatformCoreCanonicalStateSnapshot(
            OBSERVED_STATE,
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
          mocks.transaction,
        ).toHaveBeenCalledTimes(
          1,
        );
      },
    );

    it(
      "reads and verifies an exact durable snapshot by stateRef",
      async () => {
        mocks.query.mockResolvedValue({
          rows: [
            rowFromMaterial(),
          ],
        });

        const result =
          await readPlatformCoreCanonicalStateSnapshot(
            MATERIAL.stateRef,
          );

        expect(
          result,
        ).not.toBeNull();

        expect(
          result?.stateRef,
        ).toBe(
          MATERIAL.stateRef,
        );

        expect(
          result?.stateSha256,
        ).toBe(
          MATERIAL.stateSha256,
        );

        expect(
          result?.canonicalStateUtf8,
        ).toBe(
          MATERIAL.canonicalStateUtf8,
        );

        expect(
          Object.isFrozen(
            result,
          ),
        ).toBe(
          true,
        );

        expect(
          mocks.transaction,
        ).toHaveBeenCalledWith(
          expect.any(
            Function,
          ),
          {
            isolationLevel:
              "SERIALIZABLE",

            readOnly:
              true,
          },
        );
      },
    );

    it(
      "returns null when a stateRef is not found",
      async () => {
        mocks.query.mockResolvedValue({
          rows:
            [],
        });

        const result =
          await readPlatformCoreCanonicalStateSnapshot(
            MATERIAL.stateRef,
          );

        expect(
          result,
        ).toBeNull();
      },
    );

    it(
      "fails closed when read-back canonical content is corrupted",
      async () => {
        mocks.query.mockResolvedValue({
          rows: [
            rowFromMaterial(
              MATERIAL,
              {
                canonical_state_utf8:
                  '{"tampered":true}',
              },
            ),
          ],
        });

        await expect(
          readPlatformCoreCanonicalStateSnapshot(
            MATERIAL.stateRef,
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
            "PERSISTENCE_AMBIGUITY",
        );
      },
    );

    it(
      "fails closed when read-back returns another valid content address",
      async () => {
        const otherMaterial =
          derivePlatformCoreCanonicalObservedStateReference({
            another:
              "state",
          });

        mocks.query.mockResolvedValue({
          rows: [
            rowFromMaterial(
              otherMaterial,
            ),
          ],
        });

        await expect(
          readPlatformCoreCanonicalStateSnapshot(
            MATERIAL.stateRef,
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
            "PERSISTENCE_AMBIGUITY",
        );
      },
    );

    it(
      "rejects invalid stateRef before transaction entry",
      async () => {
        await expect(
          readPlatformCoreCanonicalStateSnapshot(
            "STATE:NOT:CANONICAL",
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
            "INVALID_INPUT",
        );

        expect(
          mocks.transaction,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "retries a serialization failure during read",
      async () => {
        mocks.transaction
          .mockResolvedValueOnce({
            ok:
              false,

            error:
              "code 40001 serialization failure",
          });

        installTransactionRunner();

        mocks.query.mockResolvedValue({
          rows: [
            rowFromMaterial(),
          ],
        });

        const result =
          await readPlatformCoreCanonicalStateSnapshot(
            MATERIAL.stateRef,
          );

        expect(
          result?.stateRef,
        ).toBe(
          MATERIAL.stateRef,
        );

        expect(
          mocks.transaction,
        ).toHaveBeenCalledTimes(
          2,
        );
      },
    );
  },
);
