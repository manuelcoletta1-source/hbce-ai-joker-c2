import {
  randomUUID,
} from "node:crypto";

import {
  withHbceDatabaseTransaction,
  type HbceTransactionContext,
} from "../../../lib/ipr-database-transaction";

export const PLATFORM_CORE_EXECUTION_TERMINAL_RECOVERY_REPOSITORY_PROTOCOL =
  "HBCE-PLATFORM-CORE-EXECUTION-TERMINAL-RECOVERY-REPOSITORY-v1" as const;

export const PLATFORM_CORE_EXECUTION_TERMINAL_RECOVERY_TRANSACTION_ISOLATION =
  "SERIALIZABLE" as const;

export const PLATFORM_CORE_EXECUTION_TERMINAL_RECOVERY_MAX_ATTEMPTS =
  3 as const;

const TABLE =
  "public.hbce_platform_core_execution_terminal_recovery" as const;

const EXECUTION_ID_PATTERN =
  /^EXE-[0-9A-Z:\-_.]+$/;

const SHA256_PATTERN =
  /^[a-f0-9]{64}$/;

const REFERENCE_PATTERN =
  /^[A-Z0-9_:\-.]+$/;

const TERMINAL_EVENT_REF_PATTERN =
  /^HBCE_EXE_TERM_EVT:[A-F0-9]{32}$/;

export type PlatformCoreExecutionTerminalState =
  | "EXECUTED"
  | "FAILED"
  | "ABORTED";

export type PlatformCoreExecutionTerminalStateAfterObservation =
  | "CAPTURED"
  | "NOT_AVAILABLE"
  | "UNKNOWN";

export type PlatformCoreExecutionTerminalRecoveryStateAfterInput =
  Readonly<{
    observationState:
      PlatformCoreExecutionTerminalStateAfterObservation;

    stateRef:
      string | null;

    stateSha256:
      string | null;
  }>;

export type PlatformCoreExecutionTerminalRecoveryInput =
  Readonly<{
    executionId:
      string;

    predecessorExecutionVersion:
      2;

    predecessorPayloadSha256:
      string;

    targetState:
      PlatformCoreExecutionTerminalState;

    stateAfter:
      PlatformCoreExecutionTerminalRecoveryStateAfterInput;
  }>;

export type PlatformCoreExecutionTerminalRecoveryRecord =
  Readonly<{
    terminalEventRef:
      string;

    executionId:
      string;

    predecessorExecutionVersion:
      2;

    predecessorPayloadSha256:
      string;

    targetState:
      PlatformCoreExecutionTerminalState;

    completedAt:
      string;

    stateAfter:
      Readonly<{
        observationState:
          PlatformCoreExecutionTerminalStateAfterObservation;

        stateRef:
          string | null;

        stateSha256:
          string | null;
      }>;

    atomic:
      true;

    createdAt:
      string;
  }>;

export type PlatformCoreExecutionTerminalRecoveryEvidence =
  Readonly<
    PlatformCoreExecutionTerminalRecoveryRecord
    & {
      idempotentReplay:
        boolean;
    }
  >;

export type PlatformCoreExecutionTerminalRecoveryErrorCode =
  | "INVALID_INPUT"
  | "PREDECESSOR_BINDING_INVALID"
  | "STATE_AFTER_INVALID"
  | "EXISTING_EXECUTION_BINDING_MISMATCH"
  | "PERSISTENCE_AMBIGUITY"
  | "SERIALIZATION_RETRY_EXHAUSTED"
  | "DATABASE_FAILURE";

export class PlatformCoreExecutionTerminalRecoveryRepositoryError
  extends Error {
  readonly code:
    PlatformCoreExecutionTerminalRecoveryErrorCode;

  readonly causeValue:
    unknown;

  constructor(input: {
    code:
      PlatformCoreExecutionTerminalRecoveryErrorCode;

    message:
      string;

    causeValue?:
      unknown;
  }) {
    super(
      input.message,
    );

    this.name =
      "PlatformCoreExecutionTerminalRecoveryRepositoryError";

    this.code =
      input.code;

    this.causeValue =
      input.causeValue;
  }
}

type RecoveryRow = {
  readonly terminal_event_ref:
    unknown;

  readonly execution_id:
    unknown;

  readonly predecessor_execution_version:
    unknown;

  readonly predecessor_payload_sha256:
    unknown;

  readonly target_state:
    unknown;

  readonly completed_at:
    unknown;

  readonly state_after_observation_state:
    unknown;

  readonly state_after_ref:
    unknown;

  readonly state_after_sha256:
    unknown;

  readonly atomic:
    unknown;

  readonly created_at:
    unknown;
};

type AttemptResult =
  | Readonly<{
      kind:
        "INSERTED";

      record:
        PlatformCoreExecutionTerminalRecoveryRecord;
    }>
  | Readonly<{
      kind:
        "IDEMPOTENT_REPLAY";

      record:
        PlatformCoreExecutionTerminalRecoveryRecord;
    }>
  | Readonly<{
      kind:
        "REJECTED";

      code:
        "EXISTING_EXECUTION_BINDING_MISMATCH";

      message:
        string;
    }>;

const INPUT_FIELDS =
  new Set<string>([
    "executionId",
    "predecessorExecutionVersion",
    "predecessorPayloadSha256",
    "targetState",
    "stateAfter",
  ]);

const STATE_AFTER_FIELDS =
  new Set<string>([
    "observationState",
    "stateRef",
    "stateSha256",
  ]);

function failClosed(
  code:
    PlatformCoreExecutionTerminalRecoveryErrorCode,
  message:
    string,
  causeValue?:
    unknown,
): never {
  throw new PlatformCoreExecutionTerminalRecoveryRepositoryError({
    code,
    message,
    causeValue,
  });
}

function isPlainRecord(
  value:
    unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object"
    && value !== null
    && !Array.isArray(
      value,
    )
  );
}

function assertExactKeys(
  value:
    Record<string, unknown>,
  expected:
    ReadonlySet<string>,
  path:
    string,
): void {
  const actual =
    Object.keys(
      value,
    );

  if (
    actual.length
      !== expected.size
    || actual.some(
      (key) =>
        !expected.has(
          key,
        ),
    )
  ) {
    failClosed(
      "INVALID_INPUT",
      `${path} contains an unknown or missing field.`,
      {
        actual:
          actual.sort(),
        expected:
          Array.from(
            expected,
          ).sort(),
      },
    );
  }
}

function requireString(
  value:
    unknown,
  field:
    string,
): string {
  if (
    typeof value !== "string"
    || value.length === 0
  ) {
    failClosed(
      "PERSISTENCE_AMBIGUITY",
      `${field} must be a non-empty string.`,
      value,
    );
  }

  return value;
}

function requireNullableString(
  value:
    unknown,
  field:
    string,
): string | null {
  if (
    value === null
  ) {
    return null;
  }

  if (
    typeof value !== "string"
    || value.length === 0
  ) {
    failClosed(
      "PERSISTENCE_AMBIGUITY",
      `${field} must be null or a non-empty string.`,
      value,
    );
  }

  return value;
}

function requireSafeInteger(
  value:
    unknown,
  field:
    string,
): number {
  if (
    typeof value !== "number"
    || !Number.isSafeInteger(
      value,
    )
  ) {
    failClosed(
      "PERSISTENCE_AMBIGUITY",
      `${field} must be a safe integer.`,
      value,
    );
  }

  return value;
}

function requireTrue(
  value:
    unknown,
  field:
    string,
): true {
  if (
    value !== true
  ) {
    failClosed(
      "PERSISTENCE_AMBIGUITY",
      `${field} must be true.`,
      value,
    );
  }

  return true;
}

function normalizeTimestamp(
  value:
    unknown,
  field:
    string,
): string {
  if (
    value instanceof Date
  ) {
    const millis =
      value.getTime();

    if (
      !Number.isFinite(
        millis,
      )
    ) {
      failClosed(
        "PERSISTENCE_AMBIGUITY",
        `${field} is not a valid timestamp.`,
        value,
      );
    }

    return value.toISOString();
  }

  if (
    typeof value !== "string"
  ) {
    failClosed(
      "PERSISTENCE_AMBIGUITY",
      `${field} must be a timestamp string.`,
      value,
    );
  }

  const millis =
    Date.parse(
      value,
    );

  if (
    !Number.isFinite(
      millis,
    )
  ) {
    failClosed(
      "PERSISTENCE_AMBIGUITY",
      `${field} is not a valid timestamp.`,
      value,
    );
  }

  return new Date(
    millis,
  ).toISOString();
}

function assertExecutionId(
  executionId:
    unknown,
): asserts executionId is string {
  if (
    typeof executionId !== "string"
    || executionId.length < 5
    || executionId.length > 128
    || !EXECUTION_ID_PATTERN.test(
      executionId,
    )
  ) {
    failClosed(
      "INVALID_INPUT",
      "executionId is invalid.",
      executionId,
    );
  }
}

function assertSha256(
  value:
    unknown,
  field:
    string,
  code:
    PlatformCoreExecutionTerminalRecoveryErrorCode =
      "INVALID_INPUT",
): asserts value is string {
  if (
    typeof value !== "string"
    || !SHA256_PATTERN.test(
      value,
    )
  ) {
    failClosed(
      code,
      `${field} must be a lowercase SHA-256 hex digest.`,
      value,
    );
  }
}

function assertReference(
  value:
    unknown,
  field:
    string,
): asserts value is string {
  if (
    typeof value !== "string"
    || value.length < 3
    || value.length > 160
    || !REFERENCE_PATTERN.test(
      value,
    )
  ) {
    failClosed(
      "STATE_AFTER_INVALID",
      `${field} is not a valid canonical reference.`,
      value,
    );
  }
}

function assertTerminalState(
  value:
    unknown,
): asserts value is PlatformCoreExecutionTerminalState {
  if (
    value !== "EXECUTED"
    && value !== "FAILED"
    && value !== "ABORTED"
  ) {
    failClosed(
      "INVALID_INPUT",
      "targetState must be EXECUTED, FAILED or ABORTED.",
      value,
    );
  }
}

function assertStateAfter(
  targetState:
    PlatformCoreExecutionTerminalState,
  value:
    unknown,
): asserts value is PlatformCoreExecutionTerminalRecoveryStateAfterInput {
  if (
    !isPlainRecord(
      value,
    )
  ) {
    failClosed(
      "STATE_AFTER_INVALID",
      "stateAfter must be an object.",
      value,
    );
  }

  assertExactKeys(
    value,
    STATE_AFTER_FIELDS,
    "$.stateAfter",
  );

  const observationState =
    value[
      "observationState"
    ];

  if (
    observationState !== "CAPTURED"
    && observationState !== "NOT_AVAILABLE"
    && observationState !== "UNKNOWN"
  ) {
    failClosed(
      "STATE_AFTER_INVALID",
      "stateAfter.observationState is invalid.",
      observationState,
    );
  }

  const stateRef =
    value[
      "stateRef"
    ];

  const stateSha256 =
    value[
      "stateSha256"
    ];

  if (
    observationState === "CAPTURED"
  ) {
    assertReference(
      stateRef,
      "stateAfter.stateRef",
    );

    assertSha256(
      stateSha256,
      "stateAfter.stateSha256",
      "STATE_AFTER_INVALID",
    );
  } else {
    if (
      stateRef !== null
      || stateSha256 !== null
    ) {
      failClosed(
        "STATE_AFTER_INVALID",
        "NOT_AVAILABLE or UNKNOWN stateAfter requires null stateRef and stateSha256.",
        value,
      );
    }
  }

  if (
    targetState === "EXECUTED"
    && observationState !== "CAPTURED"
  ) {
    failClosed(
      "STATE_AFTER_INVALID",
      "EXECUTED requires CAPTURED stateAfter.",
      value,
    );
  }
}

function validateInput(
  input:
    PlatformCoreExecutionTerminalRecoveryInput,
): void {
  if (
    !isPlainRecord(
      input,
    )
  ) {
    failClosed(
      "INVALID_INPUT",
      "input must be an object.",
      input,
    );
  }

  assertExactKeys(
    input,
    INPUT_FIELDS,
    "$",
  );

  assertExecutionId(
    input.executionId,
  );

  if (
    input.predecessorExecutionVersion
      !== 2
  ) {
    failClosed(
      "PREDECESSOR_BINDING_INVALID",
      "predecessorExecutionVersion must equal 2.",
      input.predecessorExecutionVersion,
    );
  }

  assertSha256(
    input.predecessorPayloadSha256,
    "predecessorPayloadSha256",
    "PREDECESSOR_BINDING_INVALID",
  );

  assertTerminalState(
    input.targetState,
  );

  assertStateAfter(
    input.targetState,
    input.stateAfter,
  );
}

function createTerminalEventRef():
  string {
  return (
    "HBCE_EXE_TERM_EVT:"
    + randomUUID()
      .replaceAll(
        "-",
        "",
      )
      .toUpperCase()
  );
}

function createCompletedAt():
  string {
  return new Date()
    .toISOString();
}

function isSerializationFailureMessage(
  error:
    string,
): boolean {
  const normalized =
    error.toLowerCase();

  return (
    normalized.includes(
      "serialization failure",
    )
    || normalized.includes(
      "sqlstate 40001",
    )
    || normalized.includes(
      "code 40001",
    )
    || normalized.includes(
      "40001",
    )
  );
}

function isUniqueViolationMessage(
  error:
    string,
): boolean {
  const normalized =
    error.toLowerCase();

  return (
    normalized.includes(
      "duplicate key",
    )
    || normalized.includes(
      "unique violation",
    )
    || normalized.includes(
      "23505",
    )
  );
}

function isExecutionIdUniqueViolationMessage(
  error:
    string,
): boolean {
  if (
    !isUniqueViolationMessage(
      error,
    )
  ) {
    return false;
  }

  const normalized =
    error.toLowerCase();

  return (
    normalized.includes(
      "execution_id",
    )
    || normalized.includes(
      "hbce_platform_core_execution_terminal_recovery_pkey",
    )
  );
}

function isTerminalEventRefUniqueViolationMessage(
  error:
    string,
): boolean {
  if (
    !isUniqueViolationMessage(
      error,
    )
  ) {
    return false;
  }

  return error
    .toLowerCase()
    .includes(
      "terminal_event_ref",
    );
}

function rowToRecord(
  row:
    RecoveryRow,
): PlatformCoreExecutionTerminalRecoveryRecord {
  const terminalEventRef =
    requireString(
      row.terminal_event_ref,
      "terminal_event_ref",
    );

  if (
    !TERMINAL_EVENT_REF_PATTERN.test(
      terminalEventRef,
    )
  ) {
    failClosed(
      "PERSISTENCE_AMBIGUITY",
      "Persisted terminal_event_ref has an invalid format.",
      terminalEventRef,
    );
  }

  const executionId =
    requireString(
      row.execution_id,
      "execution_id",
    );

  assertExecutionId(
    executionId,
  );

  const predecessorExecutionVersion =
    requireSafeInteger(
      row.predecessor_execution_version,
      "predecessor_execution_version",
    );

  if (
    predecessorExecutionVersion !== 2
  ) {
    failClosed(
      "PERSISTENCE_AMBIGUITY",
      "Persisted predecessor_execution_version must equal 2.",
      predecessorExecutionVersion,
    );
  }

  const predecessorPayloadSha256 =
    requireString(
      row.predecessor_payload_sha256,
      "predecessor_payload_sha256",
    );

  assertSha256(
    predecessorPayloadSha256,
    "predecessor_payload_sha256",
    "PERSISTENCE_AMBIGUITY",
  );

  const targetState =
    requireString(
      row.target_state,
      "target_state",
    );

  if (
    targetState !== "EXECUTED"
    && targetState !== "FAILED"
    && targetState !== "ABORTED"
  ) {
    failClosed(
      "PERSISTENCE_AMBIGUITY",
      "Persisted target_state is invalid.",
      targetState,
    );
  }

  const observationState =
    requireString(
      row.state_after_observation_state,
      "state_after_observation_state",
    );

  if (
    observationState !== "CAPTURED"
    && observationState !== "NOT_AVAILABLE"
    && observationState !== "UNKNOWN"
  ) {
    failClosed(
      "PERSISTENCE_AMBIGUITY",
      "Persisted state_after_observation_state is invalid.",
      observationState,
    );
  }

  const stateRef =
    requireNullableString(
      row.state_after_ref,
      "state_after_ref",
    );

  const stateSha256 =
    requireNullableString(
      row.state_after_sha256,
      "state_after_sha256",
    );

  const stateAfter = {
    observationState,
    stateRef,
    stateSha256,
  } satisfies
    PlatformCoreExecutionTerminalRecoveryStateAfterInput;

  assertStateAfter(
    targetState,
    stateAfter,
  );

  const atomic =
    requireTrue(
      row.atomic,
      "atomic",
    );

  return {
    terminalEventRef,

    executionId,

    predecessorExecutionVersion:
      2,

    predecessorPayloadSha256,

    targetState,

    completedAt:
      normalizeTimestamp(
        row.completed_at,
        "completed_at",
      ),

    stateAfter:
      Object.freeze({
        observationState:
          stateAfter.observationState,

        stateRef:
          stateAfter.stateRef,

        stateSha256:
          stateAfter.stateSha256,
      }),

    atomic,

    createdAt:
      normalizeTimestamp(
        row.created_at,
        "created_at",
      ),
  };
}

function recordMatchesInput(
  record:
    PlatformCoreExecutionTerminalRecoveryRecord,
  input:
    PlatformCoreExecutionTerminalRecoveryInput,
): boolean {
  return (
    record.executionId
      === input.executionId

    && record.predecessorExecutionVersion
      === input.predecessorExecutionVersion

    && record.predecessorPayloadSha256
      === input.predecessorPayloadSha256

    && record.targetState
      === input.targetState

    && record.stateAfter.observationState
      === input.stateAfter.observationState

    && record.stateAfter.stateRef
      === input.stateAfter.stateRef

    && record.stateAfter.stateSha256
      === input.stateAfter.stateSha256
  );
}

function recordToEvidence(
  record:
    PlatformCoreExecutionTerminalRecoveryRecord,
  idempotentReplay:
    boolean,
): PlatformCoreExecutionTerminalRecoveryEvidence {
  return Object.freeze({
    ...record,

    stateAfter:
      Object.freeze({
        ...record.stateAfter,
      }),

    idempotentReplay,
  });
}

async function readByExecutionId(
  transaction:
    HbceTransactionContext,
  executionId:
    string,
): Promise<RecoveryRow | null> {
  const result =
    await transaction.query(
      `
        SELECT
          terminal_event_ref,
          execution_id,
          predecessor_execution_version,
          predecessor_payload_sha256,
          target_state,
          completed_at,
          state_after_observation_state,
          state_after_ref,
          state_after_sha256,
          atomic,
          created_at
        FROM ${TABLE}
        WHERE execution_id = $1
        LIMIT 1
      `,
      [
        executionId,
      ],
    );

  return (
    (result.rows[0] as
      | RecoveryRow
      | undefined)
    ?? null
  );
}

async function executePersistenceAttempt(
  transaction:
    HbceTransactionContext,
  input:
    PlatformCoreExecutionTerminalRecoveryInput,
  terminalEventRef:
    string,
  completedAt:
    string,
): Promise<AttemptResult> {
  const prior =
    await readByExecutionId(
      transaction,
      input.executionId,
    );

  if (
    prior !== null
  ) {
    const record =
      rowToRecord(
        prior,
      );

    if (
      !recordMatchesInput(
        record,
        input,
      )
    ) {
      return {
        kind:
          "REJECTED",

        code:
          "EXISTING_EXECUTION_BINDING_MISMATCH",

        message:
          "execution_id already belongs to a different terminal recovery binding.",
      };
    }

    return {
      kind:
        "IDEMPOTENT_REPLAY",

      record,
    };
  }

  const inserted =
    await transaction.query(
      `
        INSERT INTO ${TABLE} (
          terminal_event_ref,
          execution_id,
          predecessor_execution_version,
          predecessor_payload_sha256,
          target_state,
          completed_at,
          state_after_observation_state,
          state_after_ref,
          state_after_sha256,
          atomic
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9,
          TRUE
        )
        RETURNING
          terminal_event_ref,
          execution_id,
          predecessor_execution_version,
          predecessor_payload_sha256,
          target_state,
          completed_at,
          state_after_observation_state,
          state_after_ref,
          state_after_sha256,
          atomic,
          created_at
      `,
      [
        terminalEventRef,
        input.executionId,
        input.predecessorExecutionVersion,
        input.predecessorPayloadSha256,
        input.targetState,
        completedAt,
        input.stateAfter.observationState,
        input.stateAfter.stateRef,
        input.stateAfter.stateSha256,
      ],
    );

  const row =
    inserted.rows[0] as
      | RecoveryRow
      | undefined;

  if (
    row === undefined
  ) {
    failClosed(
      "PERSISTENCE_AMBIGUITY",
      "Terminal recovery INSERT returned no row.",
    );
  }

  const record =
    rowToRecord(
      row,
    );

  if (
    record.terminalEventRef
      !== terminalEventRef
  ) {
    failClosed(
      "PERSISTENCE_AMBIGUITY",
      "Persisted terminal event reference differs from the generated event reference.",
      {
        expected:
          terminalEventRef,
        actual:
          record.terminalEventRef,
      },
    );
  }

  if (
    Date.parse(
      record.completedAt,
    )
    !== Date.parse(
      completedAt,
    )
  ) {
    failClosed(
      "PERSISTENCE_AMBIGUITY",
      "Persisted completed_at differs from the generated completion instant.",
      {
        expected:
          completedAt,
        actual:
          record.completedAt,
      },
    );
  }

  if (
    !recordMatchesInput(
      record,
      input,
    )
  ) {
    failClosed(
      "PERSISTENCE_AMBIGUITY",
      "Persisted terminal recovery row does not match its requested binding.",
      record,
    );
  }

  return {
    kind:
      "INSERTED",

    record,
  };
}

export async function readPlatformCoreExecutionTerminalRecovery(
  executionId:
    string,
): Promise<
  PlatformCoreExecutionTerminalRecoveryRecord | null
> {
  assertExecutionId(
    executionId,
  );

  const outcome =
    await withHbceDatabaseTransaction(
      async (
        transaction,
      ) =>
        readByExecutionId(
          transaction,
          executionId,
        ),
      {
        isolationLevel:
          PLATFORM_CORE_EXECUTION_TERMINAL_RECOVERY_TRANSACTION_ISOLATION,
      },
    );

  if (
    !outcome.ok
  ) {
    failClosed(
      "DATABASE_FAILURE",
      "Terminal recovery read failed closed.",
      outcome.error,
    );
  }

  if (
    outcome.value === null
  ) {
    return null;
  }

  return Object.freeze(
    rowToRecord(
      outcome.value,
    ),
  );
}

export async function persistPlatformCoreExecutionTerminalRecovery(
  input:
    PlatformCoreExecutionTerminalRecoveryInput,
): Promise<
  PlatformCoreExecutionTerminalRecoveryEvidence
> {
  validateInput(
    input,
  );

  /*
   * These two hash-significant terminal metadata values are generated
   * exactly once for this logical repository call, outside the
   * SERIALIZABLE retry loop.
   *
   * After a successful commit, later retries recover the persisted row
   * by execution_id and never replace either value.
   */
  const terminalEventRef =
    createTerminalEventRef();

  const completedAt =
    createCompletedAt();

  let executionConflictObserved =
    false;

  for (
    let attempt = 1;
    attempt
      <= PLATFORM_CORE_EXECUTION_TERMINAL_RECOVERY_MAX_ATTEMPTS;
    attempt += 1
  ) {
    const outcome =
      await withHbceDatabaseTransaction(
        async (
          transaction,
        ) =>
          executePersistenceAttempt(
            transaction,
            input,
            terminalEventRef,
            completedAt,
          ),
        {
          isolationLevel:
            PLATFORM_CORE_EXECUTION_TERMINAL_RECOVERY_TRANSACTION_ISOLATION,
        },
      );

    if (
      outcome.ok
    ) {
      const result =
        outcome.value;

      if (
        result.kind
          === "REJECTED"
      ) {
        failClosed(
          result.code,
          result.message,
          {
            executionId:
              input.executionId,
          },
        );
      }

      return recordToEvidence(
        result.record,
        result.kind
          === "IDEMPOTENT_REPLAY",
      );
    }

    const databaseError =
      String(
        outcome.error,
      );

    if (
      isSerializationFailureMessage(
        databaseError,
      )
    ) {
      if (
        attempt
          === PLATFORM_CORE_EXECUTION_TERMINAL_RECOVERY_MAX_ATTEMPTS
      ) {
        failClosed(
          "SERIALIZATION_RETRY_EXHAUSTED",
          "Terminal recovery SERIALIZABLE retry limit was exhausted.",
          databaseError,
        );
      }

      continue;
    }

    /*
     * Two concurrent requests can both pass the initial execution_id
     * lookup. The database primary key is authoritative. A fresh
     * transaction retries the lookup and either returns the winner
     * idempotently or fails closed on binding mismatch.
     */
    if (
      isExecutionIdUniqueViolationMessage(
        databaseError,
      )
    ) {
      executionConflictObserved =
        true;

      if (
        attempt
          === PLATFORM_CORE_EXECUTION_TERMINAL_RECOVERY_MAX_ATTEMPTS
      ) {
        failClosed(
          "PERSISTENCE_AMBIGUITY",
          "Concurrent execution_id conflict could not be reconciled.",
          databaseError,
        );
      }

      continue;
    }

    /*
     * terminal_event_ref belongs to this logical repository call.
     * A collision with a different persisted row must not be repaired
     * by manufacturing another event identity.
     */
    if (
      isTerminalEventRefUniqueViolationMessage(
        databaseError,
      )
    ) {
      failClosed(
        "PERSISTENCE_AMBIGUITY",
        "terminal_event_ref uniqueness conflict detected.",
        databaseError,
      );
    }

    failClosed(
      "DATABASE_FAILURE",
      "Terminal recovery persistence failed closed.",
      databaseError,
    );
  }

  failClosed(
    executionConflictObserved
      ? "PERSISTENCE_AMBIGUITY"
      : "SERIALIZATION_RETRY_EXHAUSTED",
    "Terminal recovery repository exited its retry loop without a durable result.",
  );
}
