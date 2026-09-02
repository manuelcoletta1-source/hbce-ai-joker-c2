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
  PLATFORM_CORE_EXECUTION_OBSERVATION_EVIDENCE_MAX_ATTEMPTS,
  PLATFORM_CORE_EXECUTION_OBSERVATION_EVIDENCE_REPOSITORY_PROTOCOL,
  PLATFORM_CORE_EXECUTION_OBSERVATION_EVIDENCE_TRANSACTION_ISOLATION,
  PlatformCoreExecutionObservationEvidenceRepositoryError,
  persistPlatformCoreExecutionObservationEvidence,
  readPlatformCoreExecutionObservationEvidence,
  type PlatformCoreExecutionObservationEvidenceRepositoryInput,
} from "./execution-observation-evidence-repository";

import {
  derivePlatformCoreExecutionObservationEvidenceReference,
} from "./execution-observation-evidence-reference";

import {
  derivePlatformCoreCanonicalObservedStateReference,
} from "./canonical-observed-state-reference";

const CREATED_AT =
  "2026-09-02T19:00:00.000Z";

const OBSERVED_AT =
  "2026-09-02T18:30:00.000Z";

const EXECUTION_SHA256 =
  "a".repeat(
    64,
  );

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

const STATE =
  derivePlatformCoreCanonicalObservedStateReference(
    OBSERVED_STATE,
  );

const CAPTURED_INPUT:
  PlatformCoreExecutionObservationEvidenceRepositoryInput =
  Object.freeze({
    executionId:
      "EXE-D235-CAPTURED",

    executionVersion:
      2,

    executionSha256:
      EXECUTION_SHA256,

    executionEngineRef:
      "ENGINE:HBCE:D235",

    enforcementPointRef:
      "ENFORCEMENT:HBCE:D235",

    terminalStateObserved:
      "EXECUTED",

    observationState:
      "CAPTURED",

    stateRef:
      STATE.stateRef,

    stateSha256:
      STATE.stateSha256,

    observedAt:
      OBSERVED_AT,
  });

const UNKNOWN_INPUT:
  PlatformCoreExecutionObservationEvidenceRepositoryInput =
  Object.freeze({
    executionId:
      "EXE-D235-UNKNOWN",

    executionVersion:
      2,

    executionSha256:
      "b".repeat(
        64,
      ),

    executionEngineRef:
      "ENGINE:HBCE:D235",

    enforcementPointRef:
      "ENFORCEMENT:HBCE:D235",

    terminalStateObserved:
      "FAILED",

    observationState:
      "UNKNOWN",

    stateRef:
      null,

    stateSha256:
      null,

    observedAt:
      OBSERVED_AT,
  });

function evidenceRow(
  input:
    PlatformCoreExecutionObservationEvidenceRepositoryInput,
  overrides:
    Record<string, unknown> = {},
): Record<string, unknown> {
  const derived =
    derivePlatformCoreExecutionObservationEvidenceReference(
      input,
    );

  return {
    evidence_reference:
      derived.evidenceReference,

    execution_id:
      input.executionId,

    execution_version:
      2,

    execution_sha256:
      input.executionSha256,

    execution_engine_ref:
      input.executionEngineRef,

    enforcement_point_ref:
      input.enforcementPointRef,

    terminal_state_observed:
      input.terminalStateObserved,

    observation_state:
      input.observationState,

    state_ref:
      input.stateRef,

    state_sha256:
      input.stateSha256,

    observed_at:
      input.observedAt,

    created_at:
      CREATED_AT,

    ...overrides,
  };
}

function snapshotRow(
  overrides:
    Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    state_ref:
      STATE.stateRef,

    state_sha256:
      STATE.stateSha256,

    canonical_state_utf8:
      STATE.canonicalStateUtf8,

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
      PlatformCoreExecutionObservationEvidenceRepositoryError
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
  "Platform Core execution observation evidence repository",
  () => {
    it(
      "locks repository protocol, isolation and retry count",
      () => {
        expect(
          PLATFORM_CORE_EXECUTION_OBSERVATION_EVIDENCE_REPOSITORY_PROTOCOL,
        ).toBe(
          "HBCE-PLATFORM-CORE-EXECUTION-OBSERVATION-EVIDENCE-REPOSITORY-v1",
        );

        expect(
          PLATFORM_CORE_EXECUTION_OBSERVATION_EVIDENCE_TRANSACTION_ISOLATION,
        ).toBe(
          "SERIALIZABLE",
        );

        expect(
          PLATFORM_CORE_EXECUTION_OBSERVATION_EVIDENCE_MAX_ATTEMPTS,
        ).toBe(
          3,
        );
      },
    );

    it(
      "locks durable migration semantics",
      () => {
        const sql =
          readFileSync(
            new URL(
              "../../../database/migrations/20260902_platform_core_execution_observation_evidence.sql",
              import.meta.url,
            ),
            "utf8",
          );

        expect(
          sql,
        ).toContain(
          "CREATE TABLE public.hbce_platform_core_execution_observation_evidence",
        );

        expect(
          sql,
        ).toContain(
          "observed_at TEXT",
        );

        expect(
          sql,
        ).toContain(
          "created_at TIMESTAMPTZ",
        );

        expect(
          sql,
        ).not.toMatch(
          /\bobserved_at\s+TIMESTAMPTZ\b/,
        );

        expect(
          sql,
        ).toContain(
          "REFERENCES public.hbce_platform_core_canonical_state_snapshots",
        );

        expect(
          sql,
        ).toContain(
          "hbce_pc_execution_observation_evidence_reject_update",
        );

        expect(
          sql,
        ).toContain(
          "hbce_pc_execution_observation_evidence_reject_delete",
        );
      },
    );

    it(
      "persists first CAPTURED evidence only after verifying durable snapshot",
      async () => {
        mocks.query.mockImplementation(
          async (
            sql:
              string,
            params:
              unknown[],
          ) => {
            if (
              sql.includes(
                "FROM public.hbce_platform_core_canonical_state_snapshots",
              )
            ) {
              expect(
                params,
              ).toEqual([
                STATE.stateRef,
              ]);

              return {
                rows: [
                  snapshotRow(),
                ],
              };
            }

            if (
              sql.includes(
                "INSERT INTO public.hbce_platform_core_execution_observation_evidence",
              )
            ) {
              const expected =
                derivePlatformCoreExecutionObservationEvidenceReference(
                  CAPTURED_INPUT,
                );

              expect(
                params,
              ).toEqual([
                expected.evidenceReference,
                CAPTURED_INPUT.executionId,
                2,
                CAPTURED_INPUT.executionSha256,
                CAPTURED_INPUT.executionEngineRef,
                CAPTURED_INPUT.enforcementPointRef,
                CAPTURED_INPUT.terminalStateObserved,
                CAPTURED_INPUT.observationState,
                CAPTURED_INPUT.stateRef,
                CAPTURED_INPUT.stateSha256,
                CAPTURED_INPUT.observedAt,
              ]);

              return {
                rows: [
                  evidenceRow(
                    CAPTURED_INPUT,
                  ),
                ],
              };
            }

            throw new Error(
              "UNEXPECTED_QUERY",
            );
          },
        );

        const result =
          await persistPlatformCoreExecutionObservationEvidence(
            CAPTURED_INPUT,
          );

        const expected =
          derivePlatformCoreExecutionObservationEvidenceReference(
            CAPTURED_INPUT,
          );

        expect(
          result.evidenceReference,
        ).toBe(
          expected.evidenceReference,
        );

        expect(
          result.stateRef,
        ).toBe(
          STATE.stateRef,
        );

        expect(
          result.stateSha256,
        ).toBe(
          STATE.stateSha256,
        );

        expect(
          result.observedAt,
        ).toBe(
          OBSERVED_AT,
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
          2,
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
      "preserves exact observedAt string without normalization",
      async () => {
        const exactObservedAt =
          "2026-09-02T18:30:00Z";

        const input:
          PlatformCoreExecutionObservationEvidenceRepositoryInput =
          {
            ...CAPTURED_INPUT,

            executionId:
              "EXE-D235-EXACT-TIME",

            observedAt:
              exactObservedAt,
          };

        mocks.query.mockImplementation(
          async (
            sql:
              string,
            params:
              unknown[],
          ) => {
            if (
              sql.includes(
                "canonical_state_snapshots",
              )
            ) {
              return {
                rows: [
                  snapshotRow(),
                ],
              };
            }

            if (
              sql.includes(
                "INSERT INTO",
              )
            ) {
              expect(
                params[10],
              ).toBe(
                exactObservedAt,
              );

              return {
                rows: [
                  evidenceRow(
                    input,
                  ),
                ],
              };
            }

            throw new Error(
              "UNEXPECTED_QUERY",
            );
          },
        );

        const result =
          await persistPlatformCoreExecutionObservationEvidence(
            input,
          );

        expect(
          result.observedAt,
        ).toBe(
          exactObservedAt,
        );

        expect(
          result.observedAt,
        ).not.toBe(
          "2026-09-02T18:30:00.000Z",
        );
      },
    );

    it(
      "persists non-CAPTURED evidence without snapshot lookup",
      async () => {
        mocks.query.mockImplementation(
          async (
            sql:
              string,
          ) => {
            expect(
              sql,
            ).toContain(
              "INSERT INTO public.hbce_platform_core_execution_observation_evidence",
            );

            expect(
              sql,
            ).not.toContain(
              "canonical_state_snapshots",
            );

            return {
              rows: [
                evidenceRow(
                  UNKNOWN_INPUT,
                ),
              ],
            };
          },
        );

        const result =
          await persistPlatformCoreExecutionObservationEvidence(
            UNKNOWN_INPUT,
          );

        expect(
          result.observationState,
        ).toBe(
          "UNKNOWN",
        );

        expect(
          result.stateRef,
        ).toBeNull();

        expect(
          result.stateSha256,
        ).toBeNull();

        expect(
          mocks.query,
        ).toHaveBeenCalledTimes(
          1,
        );
      },
    );

    it(
      "returns exact existing evidence as idempotent replay",
      async () => {
        mocks.query.mockImplementation(
          async (
            sql:
              string,
          ) => {
            if (
              sql.includes(
                "canonical_state_snapshots",
              )
            ) {
              return {
                rows: [
                  snapshotRow(),
                ],
              };
            }

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
                "FROM public.hbce_platform_core_execution_observation_evidence",
              )
            ) {
              return {
                rows: [
                  evidenceRow(
                    CAPTURED_INPUT,
                  ),
                ],
              };
            }

            throw new Error(
              "UNEXPECTED_QUERY",
            );
          },
        );

        const result =
          await persistPlatformCoreExecutionObservationEvidence(
            CAPTURED_INPUT,
          );

        expect(
          result.idempotentReplay,
        ).toBe(
          true,
        );

        expect(
          mocks.query,
        ).toHaveBeenCalledTimes(
          3,
        );
      },
    );

    it(
      "rejects invalid event material before transaction entry",
      async () => {
        const invalid =
          {
            ...CAPTURED_INPUT,

            observationState:
              "UNKNOWN",

            stateRef:
              null,

            stateSha256:
              null,
          } as
            PlatformCoreExecutionObservationEvidenceRepositoryInput;

        await expect(
          persistPlatformCoreExecutionObservationEvidence(
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
            "INVALID_INPUT",
        );

        expect(
          mocks.transaction,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "fails closed when CAPTURED snapshot is missing",
      async () => {
        mocks.query.mockResolvedValue({
          rows:
            [],
        });

        await expect(
          persistPlatformCoreExecutionObservationEvidence(
            CAPTURED_INPUT,
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
            "SNAPSHOT_NOT_FOUND",
        );

        expect(
          mocks.query,
        ).toHaveBeenCalledTimes(
          1,
        );
      },
    );

    it(
      "fails closed when CAPTURED snapshot canonical content is corrupted",
      async () => {
        mocks.query.mockResolvedValue({
          rows: [
            snapshotRow({
              canonical_state_utf8:
                "{\"tampered\":true}",
            }),
          ],
        });

        await expect(
          persistPlatformCoreExecutionObservationEvidence(
            CAPTURED_INPUT,
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
            "SNAPSHOT_INVALID",
        );
      },
    );

    it(
      "fails closed when durable snapshot identity mismatches observation",
      async () => {
        mocks.query.mockResolvedValue({
          rows: [
            snapshotRow({
              state_sha256:
                "c".repeat(
                  64,
                ),
            }),
          ],
        });

        await expect(
          persistPlatformCoreExecutionObservationEvidence(
            CAPTURED_INPUT,
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
            "SNAPSHOT_INVALID",
        );
      },
    );

    it(
      "fails closed when inserted durable evidence is corrupted",
      async () => {
        mocks.query.mockImplementation(
          async (
            sql:
              string,
          ) => {
            if (
              sql.includes(
                "canonical_state_snapshots",
              )
            ) {
              return {
                rows: [
                  snapshotRow(),
                ],
              };
            }

            return {
              rows: [
                evidenceRow(
                  CAPTURED_INPUT,
                  {
                    observed_at:
                      "2026-09-02T18:31:00.000Z",
                  },
                ),
              ],
            };
          },
        );

        await expect(
          persistPlatformCoreExecutionObservationEvidence(
            CAPTURED_INPUT,
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
                "canonical_state_snapshots",
              )
            ) {
              return {
                rows: [
                  snapshotRow(),
                ],
              };
            }

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
                "FROM public.hbce_platform_core_execution_observation_evidence",
              )
            ) {
              return {
                rows: [
                  evidenceRow(
                    CAPTURED_INPUT,
                  ),
                  evidenceRow(
                    CAPTURED_INPUT,
                  ),
                ],
              };
            }

            throw new Error(
              "UNEXPECTED_QUERY",
            );
          },
        );

        await expect(
          persistPlatformCoreExecutionObservationEvidence(
            CAPTURED_INPUT,
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
      "retries one serialization failure and then persists",
      async () => {
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
          ) => {
            if (
              sql.includes(
                "canonical_state_snapshots",
              )
            ) {
              return {
                rows: [
                  snapshotRow(),
                ],
              };
            }

            return {
              rows: [
                evidenceRow(
                  CAPTURED_INPUT,
                ),
              ],
            };
          },
        );

        const result =
          await persistPlatformCoreExecutionObservationEvidence(
            CAPTURED_INPUT,
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
      "fails closed after three persistence serialization failures",
      async () => {
        mocks.transaction.mockResolvedValue({
          ok:
            false,

          error:
            "SQLSTATE 40001 serialization failure",
        });

        await expect(
          persistPlatformCoreExecutionObservationEvidence(
            CAPTURED_INPUT,
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
      "classifies ordinary persistence transaction failure as database failure",
      async () => {
        mocks.transaction.mockResolvedValue({
          ok:
            false,

          error:
            "connection refused",
        });

        await expect(
          persistPlatformCoreExecutionObservationEvidence(
            CAPTURED_INPUT,
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
      "reads and re-verifies exact CAPTURED evidence and snapshot",
      async () => {
        const evidence =
          derivePlatformCoreExecutionObservationEvidenceReference(
            CAPTURED_INPUT,
          );

        mocks.query.mockImplementation(
          async (
            sql:
              string,
          ) => {
            if (
              sql.includes(
                "FROM public.hbce_platform_core_execution_observation_evidence",
              )
            ) {
              return {
                rows: [
                  evidenceRow(
                    CAPTURED_INPUT,
                  ),
                ],
              };
            }

            if (
              sql.includes(
                "FROM public.hbce_platform_core_canonical_state_snapshots",
              )
            ) {
              return {
                rows: [
                  snapshotRow(),
                ],
              };
            }

            throw new Error(
              "UNEXPECTED_QUERY",
            );
          },
        );

        const result =
          await readPlatformCoreExecutionObservationEvidence(
            evidence.evidenceReference,
          );

        expect(
          result,
        ).not.toBeNull();

        expect(
          result?.evidenceReference,
        ).toBe(
          evidence.evidenceReference,
        );

        expect(
          result?.stateRef,
        ).toBe(
          STATE.stateRef,
        );

        expect(
          result?.observedAt,
        ).toBe(
          OBSERVED_AT,
        );

        expect(
          mocks.query,
        ).toHaveBeenCalledTimes(
          2,
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
      "reads non-CAPTURED evidence without snapshot lookup",
      async () => {
        const evidence =
          derivePlatformCoreExecutionObservationEvidenceReference(
            UNKNOWN_INPUT,
          );

        mocks.query.mockImplementation(
          async (
            sql:
              string,
          ) => {
            expect(
              sql,
            ).toContain(
              "FROM public.hbce_platform_core_execution_observation_evidence",
            );

            expect(
              sql,
            ).not.toContain(
              "canonical_state_snapshots",
            );

            return {
              rows: [
                evidenceRow(
                  UNKNOWN_INPUT,
                ),
              ],
            };
          },
        );

        const result =
          await readPlatformCoreExecutionObservationEvidence(
            evidence.evidenceReference,
          );

        expect(
          result?.observationState,
        ).toBe(
          "UNKNOWN",
        );

        expect(
          mocks.query,
        ).toHaveBeenCalledTimes(
          1,
        );
      },
    );

    it(
      "returns null when evidence reference is not found",
      async () => {
        const evidence =
          derivePlatformCoreExecutionObservationEvidenceReference(
            UNKNOWN_INPUT,
          );

        mocks.query.mockResolvedValue({
          rows:
            [],
        });

        const result =
          await readPlatformCoreExecutionObservationEvidence(
            evidence.evidenceReference,
          );

        expect(
          result,
        ).toBeNull();

        expect(
          mocks.query,
        ).toHaveBeenCalledTimes(
          1,
        );
      },
    );

    it(
      "fails closed when persisted evidence fails read-back derivation",
      async () => {
        const evidence =
          derivePlatformCoreExecutionObservationEvidenceReference(
            UNKNOWN_INPUT,
          );

        mocks.query.mockResolvedValue({
          rows: [
            evidenceRow(
              UNKNOWN_INPUT,
              {
                observed_at:
                  "2026-09-02T18:31:00.000Z",
              },
            ),
          ],
        });

        await expect(
          readPlatformCoreExecutionObservationEvidence(
            evidence.evidenceReference,
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
      "fails closed when persisted CAPTURED evidence references missing snapshot",
      async () => {
        const evidence =
          derivePlatformCoreExecutionObservationEvidenceReference(
            CAPTURED_INPUT,
          );

        mocks.query.mockImplementation(
          async (
            sql:
              string,
          ) => {
            if (
              sql.includes(
                "execution_observation_evidence",
              )
            ) {
              return {
                rows: [
                  evidenceRow(
                    CAPTURED_INPUT,
                  ),
                ],
              };
            }

            if (
              sql.includes(
                "canonical_state_snapshots",
              )
            ) {
              return {
                rows:
                  [],
              };
            }

            throw new Error(
              "UNEXPECTED_QUERY",
            );
          },
        );

        await expect(
          readPlatformCoreExecutionObservationEvidence(
            evidence.evidenceReference,
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
            "SNAPSHOT_NOT_FOUND",
        );
      },
    );

    it(
      "rejects invalid evidence reference before transaction entry",
      async () => {
        await expect(
          readPlatformCoreExecutionObservationEvidence(
            "HBCE:OBS:EVIDENCE:INVALID",
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
      "retries one serialization failure during read",
      async () => {
        const evidence =
          derivePlatformCoreExecutionObservationEvidenceReference(
            CAPTURED_INPUT,
          );

        mocks.transaction
          .mockResolvedValueOnce({
            ok:
              false,

            error:
              "code 40001 serialization failure",
          });

        installTransactionRunner();

        mocks.query.mockImplementation(
          async (
            sql:
              string,
          ) => {
            if (
              sql.includes(
                "execution_observation_evidence",
              )
            ) {
              return {
                rows: [
                  evidenceRow(
                    CAPTURED_INPUT,
                  ),
                ],
              };
            }

            return {
              rows: [
                snapshotRow(),
              ],
            };
          },
        );

        const result =
          await readPlatformCoreExecutionObservationEvidence(
            evidence.evidenceReference,
          );

        expect(
          result?.evidenceReference,
        ).toBe(
          evidence.evidenceReference,
        );

        expect(
          mocks.transaction,
        ).toHaveBeenCalledTimes(
          2,
        );
      },
    );

    it(
      "captures caller event material once and never re-reads it after canonical derivation",
      async () => {
        const descriptorReads =
          new Map<
            PropertyKey,
            number
          >();

        const proxied =
          new Proxy(
            {
              ...CAPTURED_INPUT,

              executionId:
                "EXE-D235-SINGLE-SNAPSHOT",
            },
            {
              getOwnPropertyDescriptor(
                target,
                property,
              ) {
                const next =
                  (
                    descriptorReads.get(
                      property,
                    )
                    ?? 0
                  ) + 1;

                descriptorReads.set(
                  property,
                  next,
                );

                if (
                  next > 1
                ) {
                  throw new Error(
                    `CALLER_PROPERTY_REREAD:${String(property)}`,
                  );
                }

                return Reflect.getOwnPropertyDescriptor(
                  target,
                  property,
                );
              },
            },
          );

        const stableInput:
          PlatformCoreExecutionObservationEvidenceRepositoryInput =
          {
            ...CAPTURED_INPUT,

            executionId:
              "EXE-D235-SINGLE-SNAPSHOT",
          };

        mocks.query.mockImplementation(
          async (
            sql:
              string,
          ) => {
            if (
              sql.includes(
                "canonical_state_snapshots",
              )
            ) {
              return {
                rows: [
                  snapshotRow(),
                ],
              };
            }

            if (
              sql.includes(
                "INSERT INTO",
              )
            ) {
              return {
                rows: [
                  evidenceRow(
                    stableInput,
                  ),
                ],
              };
            }

            throw new Error(
              "UNEXPECTED_QUERY",
            );
          },
        );

        const result =
          await persistPlatformCoreExecutionObservationEvidence(
            proxied,
          );

        const expected =
          derivePlatformCoreExecutionObservationEvidenceReference(
            stableInput,
          );

        expect(
          result.evidenceReference,
        ).toBe(
          expected.evidenceReference,
        );

        expect(
          Array.from(
            descriptorReads.values(),
          ).every(
            (
              count,
            ) =>
              count === 1,
          ),
        ).toBe(
          true,
        );
      },
    );
  },
);
