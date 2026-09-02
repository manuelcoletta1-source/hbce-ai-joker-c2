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
  PLATFORM_CORE_EXECUTION_TERMINAL_RECOVERY_MAX_ATTEMPTS,
  PLATFORM_CORE_EXECUTION_TERMINAL_RECOVERY_REPOSITORY_PROTOCOL,
  PlatformCoreExecutionTerminalRecoveryRepositoryError,
  persistPlatformCoreExecutionTerminalRecovery,
  readPlatformCoreExecutionTerminalRecovery,
  type PlatformCoreExecutionTerminalRecoveryInput,
} from "./execution-terminal-recovery-repository";

const EXECUTION_ID =
  "EXE-D188-R3-TERMINAL-RECOVERY";

const PREDECESSOR_SHA256 =
  "a".repeat(
    64,
  );

const STATE_SHA256 =
  "b".repeat(
    64,
  );

const STATE_REF =
  "STATE:D188:R3:AFTER";

const PERSISTED_EVENT_REF =
  "HBCE_EXE_TERM_EVT:0123456789ABCDEF0123456789ABCDEF";

const COMPLETED_AT =
  "2026-09-02T15:30:00.000Z";

const CREATED_AT =
  "2026-09-02T15:30:00.100Z";

function input(
  overrides:
    Partial<
      PlatformCoreExecutionTerminalRecoveryInput
    > = {},
): PlatformCoreExecutionTerminalRecoveryInput {
  return {
    executionId:
      EXECUTION_ID,

    predecessorExecutionVersion:
      2,

    predecessorPayloadSha256:
      PREDECESSOR_SHA256,

    targetState:
      "EXECUTED",

    stateAfter: {
      observationState:
        "CAPTURED",

      stateRef:
        STATE_REF,

      stateSha256:
        STATE_SHA256,
    },

    ...overrides,
  };
}

function persistedRow(
  source:
    PlatformCoreExecutionTerminalRecoveryInput,
  overrides:
    Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    terminal_event_ref:
      PERSISTED_EVENT_REF,

    execution_id:
      source.executionId,

    predecessor_execution_version:
      source.predecessorExecutionVersion,

    predecessor_payload_sha256:
      source.predecessorPayloadSha256,

    target_state:
      source.targetState,

    completed_at:
      COMPLETED_AT,

    state_after_observation_state:
      source.stateAfter
        .observationState,

    state_after_ref:
      source.stateAfter
        .stateRef,

    state_after_sha256:
      source.stateAfter
        .stateSha256,

    atomic:
      true,

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
      PlatformCoreExecutionTerminalRecoveryRepositoryError
  )
    ? error.code
    : null;
}

beforeEach(
  () => {
    vi.clearAllMocks();

    vi.useFakeTimers();

    vi.setSystemTime(
      new Date(
        COMPLETED_AT,
      ),
    );

    installTransactionRunner();
  },
);

describe(
  "terminal recovery repository permanent behavior",
  () => {
    it(
      "exposes the locked repository protocol",
      () => {
        expect(
          PLATFORM_CORE_EXECUTION_TERMINAL_RECOVERY_REPOSITORY_PROTOCOL,
        ).toBe(
          "HBCE-PLATFORM-CORE-EXECUTION-TERMINAL-RECOVERY-REPOSITORY-v1",
        );

        expect(
          PLATFORM_CORE_EXECUTION_TERMINAL_RECOVERY_MAX_ATTEMPTS,
        ).toBe(
          3,
        );
      },
    );

    it(
      "persists a first EXECUTED terminal recovery record",
      async () => {
        const source =
          input();

        mocks.query.mockImplementation(
          async (
            sql:
              string,
            params:
              unknown[],
          ) => {
            if (
              sql.includes(
                "SELECT",
              )
            ) {
              return {
                rows:
                  [],
              };
            }

            if (
              sql.includes(
                "INSERT INTO",
              )
            ) {
              expect(
                sql,
              ).toContain(
                "TRUE",
              );

              expect(
                params,
              ).toHaveLength(
                9,
              );

              return {
                rows: [
                  {
                    terminal_event_ref:
                      params[0],

                    execution_id:
                      params[1],

                    predecessor_execution_version:
                      params[2],

                    predecessor_payload_sha256:
                      params[3],

                    target_state:
                      params[4],

                    completed_at:
                      params[5],

                    state_after_observation_state:
                      params[6],

                    state_after_ref:
                      params[7],

                    state_after_sha256:
                      params[8],

                    atomic:
                      true,

                    created_at:
                      CREATED_AT,
                  },
                ],
              };
            }

            throw new Error(
              "UNEXPECTED_QUERY",
            );
          },
        );

        const result =
          await persistPlatformCoreExecutionTerminalRecovery(
            source,
          );

        expect(
          result.executionId,
        ).toBe(
          EXECUTION_ID,
        );

        expect(
          result.targetState,
        ).toBe(
          "EXECUTED",
        );

        expect(
          result.completedAt,
        ).toBe(
          COMPLETED_AT,
        );

        expect(
          result.terminalEventRef,
        ).toMatch(
          /^HBCE_EXE_TERM_EVT:[A-F0-9]{32}$/,
        );

        expect(
          result.stateAfter,
        ).toEqual(
          source.stateAfter,
        );

        expect(
          result.atomic,
        ).toBe(
          true,
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
          Object.isFrozen(
            result.stateAfter,
          ),
        ).toBe(
          true,
        );

        expect(
          mocks.query,
        ).toHaveBeenCalledTimes(
          2,
        );
      },
    );

    it(
      "allows FAILED with UNKNOWN state_after",
      async () => {
        const source =
          input({
            targetState:
              "FAILED",

            stateAfter: {
              observationState:
                "UNKNOWN",

              stateRef:
                null,

              stateSha256:
                null,
            },
          });

        mocks.query.mockImplementation(
          async (
            sql:
              string,
            params:
              unknown[],
          ) => {
            if (
              sql.includes(
                "SELECT",
              )
            ) {
              return {
                rows:
                  [],
              };
            }

            expect(
              params,
            ).toHaveLength(
              9,
            );

            return {
              rows: [
                {
                  terminal_event_ref:
                    params[0],

                  execution_id:
                    params[1],

                  predecessor_execution_version:
                    params[2],

                  predecessor_payload_sha256:
                    params[3],

                  target_state:
                    params[4],

                  completed_at:
                    params[5],

                  state_after_observation_state:
                    params[6],

                  state_after_ref:
                    params[7],

                  state_after_sha256:
                    params[8],

                  atomic:
                    true,

                  created_at:
                    CREATED_AT,
                },
              ],
            };
          },
        );

        const result =
          await persistPlatformCoreExecutionTerminalRecovery(
            source,
          );

        expect(
          result.targetState,
        ).toBe(
          "FAILED",
        );

        expect(
          result.stateAfter,
        ).toEqual({
          observationState:
            "UNKNOWN",

          stateRef:
            null,

          stateSha256:
            null,
        });
      },
    );

    it(
      "returns persisted metadata on exact idempotent replay",
      async () => {
        const source =
          input();

        mocks.query.mockResolvedValue({
          rows: [
            persistedRow(
              source,
            ),
          ],
        });

        const result =
          await persistPlatformCoreExecutionTerminalRecovery(
            source,
          );

        expect(
          result.idempotentReplay,
        ).toBe(
          true,
        );

        expect(
          result.terminalEventRef,
        ).toBe(
          PERSISTED_EVENT_REF,
        );

        expect(
          result.completedAt,
        ).toBe(
          COMPLETED_AT,
        );

        expect(
          mocks.query,
        ).toHaveBeenCalledTimes(
          1,
        );
      },
    );

    it(
      "fails closed when execution_id is already bound differently",
      async () => {
        const source =
          input();

        mocks.query.mockResolvedValue({
          rows: [
            persistedRow(
              {
                ...source,

                targetState:
                  "FAILED",
              },
            ),
          ],
        });

        await expect(
          persistPlatformCoreExecutionTerminalRecovery(
            source,
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
            "EXISTING_EXECUTION_BINDING_MISMATCH",
        );
      },
    );

    it(
      "rejects EXECUTED without CAPTURED state_after before transaction entry",
      async () => {
        const source =
          input({
            stateAfter: {
              observationState:
                "UNKNOWN",

              stateRef:
                null,

              stateSha256:
                null,
            },
          });

        await expect(
          persistPlatformCoreExecutionTerminalRecovery(
            source,
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
            "STATE_AFTER_INVALID",
        );

        expect(
          mocks.transaction,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "rejects invalid predecessor payload binding before transaction entry",
      async () => {
        const source =
          input({
            predecessorPayloadSha256:
              "BAD",
          });

        await expect(
          persistPlatformCoreExecutionTerminalRecovery(
            source,
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
            "PREDECESSOR_BINDING_INVALID",
        );

        expect(
          mocks.transaction,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "retries a serialization failure and then succeeds",
      async () => {
        const source =
          input();

        mocks.transaction
          .mockResolvedValueOnce({
            ok:
              false,

            error:
              "serialization failure SQLSTATE 40001",
          });

        installTransactionRunner();

        mocks.query.mockImplementation(
          async (
            sql:
              string,
            params:
              unknown[],
          ) => {
            if (
              sql.includes(
                "SELECT",
              )
            ) {
              return {
                rows:
                  [],
              };
            }

            expect(
              params,
            ).toHaveLength(
              9,
            );

            return {
              rows: [
                {
                  terminal_event_ref:
                    params[0],

                  execution_id:
                    params[1],

                  predecessor_execution_version:
                    params[2],

                  predecessor_payload_sha256:
                    params[3],

                  target_state:
                    params[4],

                  completed_at:
                    params[5],

                  state_after_observation_state:
                    params[6],

                  state_after_ref:
                    params[7],

                  state_after_sha256:
                    params[8],

                  atomic:
                    true,

                  created_at:
                    CREATED_AT,
                },
              ],
            };
          },
        );

        const result =
          await persistPlatformCoreExecutionTerminalRecovery(
            source,
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
          persistPlatformCoreExecutionTerminalRecovery(
            input(),
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
      "classifies ordinary database failure fail-closed",
      async () => {
        mocks.transaction.mockResolvedValue({
          ok:
            false,

          error:
            "connection refused",
        });

        await expect(
          persistPlatformCoreExecutionTerminalRecovery(
            input(),
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
      },
    );

    it(
      "reads an existing durable recovery record by execution_id",
      async () => {
        const source =
          input();

        mocks.query.mockResolvedValue({
          rows: [
            persistedRow(
              source,
            ),
          ],
        });

        const result =
          await readPlatformCoreExecutionTerminalRecovery(
            EXECUTION_ID,
          );

        expect(
          result,
        ).not.toBeNull();

        expect(
          result?.terminalEventRef,
        ).toBe(
          PERSISTED_EVENT_REF,
        );

        expect(
          result?.completedAt,
        ).toBe(
          COMPLETED_AT,
        );

        expect(
          result?.targetState,
        ).toBe(
          "EXECUTED",
        );

        expect(
          Object.isFrozen(
            result,
          ),
        ).toBe(
          true,
        );
      },
    );

    it(
      "returns null when no durable recovery record exists",
      async () => {
        mocks.query.mockResolvedValue({
          rows:
            [],
        });

        const result =
          await readPlatformCoreExecutionTerminalRecovery(
            EXECUTION_ID,
          );

        expect(
          result,
        ).toBeNull();
      },
    );
  },
);
