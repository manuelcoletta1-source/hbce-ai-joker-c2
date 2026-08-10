import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi
} from "vitest";

const {
  mockPoolConnect,
  mockPoolEnd,
  mockPoolOn,
  mockClientQuery,
  mockClientRelease
} = vi.hoisted(() => ({
  mockPoolConnect: vi.fn(),
  mockPoolEnd: vi.fn(),
  mockPoolOn: vi.fn(),
  mockClientQuery: vi.fn(),
  mockClientRelease: vi.fn()
}));

vi.mock("@neondatabase/serverless", () => ({
  Pool: class MockPool {
    connect = mockPoolConnect;
    end = mockPoolEnd;
    on = mockPoolOn;
  }
}));

import {
  closeHbceTransactionPool,
  withHbceDatabaseTransaction
} from "@/lib/ipr-database-transaction";

const originalDatabaseUrl =
  process.env.DATABASE_URL;

function emptyQueryResult() {
  return {
    command: "",
    rowCount: 0,
    oid: 0,
    rows: [],
    fields: []
  };
}

beforeEach(() => {
  process.env.DATABASE_URL =
    "postgresql://hbce-transaction-test.invalid/hbce";

  mockPoolConnect.mockReset();
  mockPoolEnd.mockReset();
  mockPoolOn.mockReset();
  mockClientQuery.mockReset();
  mockClientRelease.mockReset();

  mockClientQuery.mockResolvedValue(
    emptyQueryResult()
  );

  mockClientRelease.mockReturnValue(
    undefined
  );

  mockPoolEnd.mockResolvedValue(
    undefined
  );

  mockPoolConnect.mockResolvedValue({
    query: mockClientQuery,
    release: mockClientRelease
  });
});

afterEach(async () => {
  await closeHbceTransactionPool();

  if (
    typeof originalDatabaseUrl ===
    "string"
  ) {
    process.env.DATABASE_URL =
      originalDatabaseUrl;
  } else {
    delete process.env.DATABASE_URL;
  }
});

describe(
  "withHbceDatabaseTransaction",
  () => {
    it(
      "rolls back an active transaction when the operation fails",
      async () => {
        const result =
          await withHbceDatabaseTransaction(
            async ({ query }) => {
              await query(
                "INSERT INTO hbce_test(value) VALUES ($1)",
                ["alpha"]
              );

              throw new Error(
                "HBCE_TEST_OPERATION_FAILURE"
              );
            },
            {
              isolationLevel:
                "SERIALIZABLE",
              readOnly: false,
              statementTimeoutMs:
                30000,
              lockTimeoutMs:
                10000,
              idleInTransactionSessionTimeoutMs:
                30000
            }
          );

        expect(result).toMatchObject({
          ok: false,
          state: "ROLLED_BACK",
          error:
            "HBCE_TEST_OPERATION_FAILURE",
          rollbackError: null
        });

        expect(
          mockPoolConnect
        ).toHaveBeenCalledTimes(1);

        expect(
          mockClientRelease
        ).toHaveBeenCalledTimes(1);

        const sqlCalls =
          mockClientQuery.mock.calls.map(
            ([sql]) =>
              String(sql)
                .replace(/\s+/g, " ")
                .trim()
          );

        expect(sqlCalls[0]).toBe(
          "BEGIN ISOLATION LEVEL SERIALIZABLE READ WRITE NOT DEFERRABLE"
        );

        expect(sqlCalls).toContain(
          "INSERT INTO hbce_test(value) VALUES ($1)"
        );

        expect(
          sqlCalls.at(-1)
        ).toBe("ROLLBACK");

        expect(sqlCalls).not.toContain(
          "COMMIT"
        );
      }
    );

    it(
      "reports FAILED when rollback itself fails",
      async () => {
        mockClientQuery.mockImplementation(
          async (sql: unknown) => {
            const normalizedSql =
              String(sql)
                .replace(/\s+/g, " ")
                .trim();

            if (
              normalizedSql ===
              "ROLLBACK"
            ) {
              throw new Error(
                "HBCE_TEST_ROLLBACK_FAILURE"
              );
            }

            return emptyQueryResult();
          }
        );

        const result =
          await withHbceDatabaseTransaction(
            async ({ query }) => {
              await query(
                "INSERT INTO hbce_test(value) VALUES ($1)",
                ["beta"]
              );

              throw new Error(
                "HBCE_TEST_PRIMARY_FAILURE"
              );
            },
            {
              isolationLevel:
                "SERIALIZABLE",
              readOnly: false,
              statementTimeoutMs:
                30000,
              lockTimeoutMs:
                10000,
              idleInTransactionSessionTimeoutMs:
                30000
            }
          );

        expect(result).toMatchObject({
          ok: false,
          state: "FAILED",
          error:
            "HBCE_TEST_PRIMARY_FAILURE",
          rollbackError:
            "HBCE_TEST_ROLLBACK_FAILURE"
        });

        expect(
          mockPoolConnect
        ).toHaveBeenCalledTimes(1);

        expect(
          mockClientRelease
        ).toHaveBeenCalledTimes(1);

        const sqlCalls =
          mockClientQuery.mock.calls.map(
            ([sql]) =>
              String(sql)
                .replace(/\s+/g, " ")
                .trim()
          );

        expect(sqlCalls).toContain(
          "ROLLBACK"
        );

        expect(sqlCalls).not.toContain(
          "COMMIT"
        );
      }
    );

    it(
      "commits a successful active transaction",
      async () => {
        const result =
          await withHbceDatabaseTransaction(
            async ({ query }) => {
              await query(
                "INSERT INTO hbce_test(value) VALUES ($1)",
                ["gamma"]
              );

              return {
                status:
                  "HBCE_TEST_COMMIT_VALUE"
              };
            },
            {
              isolationLevel:
                "SERIALIZABLE",
              readOnly: false,
              statementTimeoutMs:
                30000,
              lockTimeoutMs:
                10000,
              idleInTransactionSessionTimeoutMs:
                30000
            }
          );

        expect(result).toMatchObject({
          ok: true,
          state: "COMMITTED",
          value: {
            status:
              "HBCE_TEST_COMMIT_VALUE"
          }
        });

        expect(
          mockPoolConnect
        ).toHaveBeenCalledTimes(1);

        expect(
          mockClientRelease
        ).toHaveBeenCalledTimes(1);

        const sqlCalls =
          mockClientQuery.mock.calls.map(
            ([sql]) =>
              String(sql)
                .replace(/\s+/g, " ")
                .trim()
          );

        expect(sqlCalls[0]).toBe(
          "BEGIN ISOLATION LEVEL SERIALIZABLE READ WRITE NOT DEFERRABLE"
        );

        expect(sqlCalls).toContain(
          "INSERT INTO hbce_test(value) VALUES ($1)"
        );

        expect(
          sqlCalls.at(-1)
        ).toBe("COMMIT");

        expect(sqlCalls).not.toContain(
          "ROLLBACK"
        );
      }
    );
  }
);
