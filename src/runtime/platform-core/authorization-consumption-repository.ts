import {
  randomUUID,
} from "node:crypto";

import {
  withHbceDatabaseTransaction,
  type HbceTransactionContext,
} from "../../../lib/ipr-database-transaction";

export const PLATFORM_CORE_AUTHORIZATION_CONSUMPTION_REPOSITORY_PROTOCOL =
  "HBCE-PLATFORM-CORE-AUTHORIZATION-CONSUMPTION-REPOSITORY-v1" as const;

export const PLATFORM_CORE_AUTHORIZATION_CONSUMPTION_TRANSACTION_ISOLATION =
  "SERIALIZABLE" as const;

export const PLATFORM_CORE_AUTHORIZATION_CONSUMPTION_MAX_ATTEMPTS =
  3 as const;

export type PlatformCoreAuthorizationReplayMode =
  | "SINGLE_USE"
  | "BOUNDED_USE";

export type PlatformCoreAuthorizationConsumptionInput = {
  readonly authorizationRef: string;
  readonly authorizationVersion: string;
  readonly authorizationSha256: string;

  readonly replayKeySha256: string;
  readonly replayMode: PlatformCoreAuthorizationReplayMode;
  readonly maxUses: number;
  readonly usageCounterRef: string | null;

  readonly executionId: string;
  readonly actionSha256: string;
  readonly requestSha256: string;
  readonly iospaceRef: string;
};

export type PlatformCoreAuthorizationConsumptionEvidence = {
  readonly consumptionEventRef: string;
  readonly executionId: string;
  readonly consumptionIndex: number;

  readonly authorizationRef: string;
  readonly authorizationVersion: string;
  readonly authorizationSha256: string;

  readonly replayKeySha256: string;
  readonly usageCounterRef: string | null;

  readonly actionSha256: string;
  readonly requestSha256: string;
  readonly iospaceRef: string;

  readonly consumedAt: string;
  readonly atomic: true;

  readonly idempotentReplay: boolean;
};

export type PlatformCoreAuthorizationConsumptionErrorCode =
  | "INVALID_INPUT"
  | "EXISTING_EXECUTION_BINDING_MISMATCH"
  | "AUTHORIZATION_BINDING_MISMATCH"
  | "REPLAY_POLICY_MISMATCH"
  | "AUTHORIZATION_EXHAUSTED"
  | "SERIALIZATION_RETRY_EXHAUSTED"
  | "DUPLICATE_RECONCILIATION_FAILED"
  | "TRANSACTION_FAILED"
  | "PERSISTENCE_AMBIGUITY";

export class PlatformCoreAuthorizationConsumptionError
  extends Error {
  readonly code:
    PlatformCoreAuthorizationConsumptionErrorCode;

  constructor(
    code:
      PlatformCoreAuthorizationConsumptionErrorCode,
    message: string,
  ) {
    super(message);

    this.name =
      "PlatformCoreAuthorizationConsumptionError";

    this.code =
      code;
  }
}

type StateRow = {
  readonly replay_key_sha256: unknown;
  readonly authorization_ref: unknown;
  readonly authorization_version: unknown;
  readonly authorization_sha256: unknown;
  readonly replay_mode: unknown;
  readonly max_uses: unknown;
  readonly usage_counter_ref: unknown;
  readonly committed_consumption_count: unknown;
  readonly last_consumed_at: unknown;
};

type EventRow = {
  readonly consumption_event_ref: unknown;
  readonly execution_id: unknown;
  readonly consumption_index: unknown;

  readonly authorization_ref: unknown;
  readonly authorization_version: unknown;
  readonly authorization_sha256: unknown;

  readonly replay_key_sha256: unknown;

  readonly action_sha256: unknown;
  readonly request_sha256: unknown;
  readonly iospace_ref: unknown;

  readonly usage_counter_ref: unknown;

  readonly consumed_at: unknown;
  readonly atomic: unknown;
};

type AttemptValue =
  | {
      readonly kind: "CONSUMED";
      readonly evidence:
        PlatformCoreAuthorizationConsumptionEvidence;
    }
  | {
      readonly kind: "IDEMPOTENT_REPLAY";
      readonly evidence:
        PlatformCoreAuthorizationConsumptionEvidence;
    }
  | {
      readonly kind: "REJECTED";
      readonly code:
        PlatformCoreAuthorizationConsumptionErrorCode;
      readonly message: string;
    };

const STATE_TABLE =
  "public.hbce_platform_core_authorization_consumption_state";

const EVENT_TABLE =
  "public.hbce_platform_core_authorization_consumption_events";

const SHA256_PATTERN =
  /^[a-f0-9]{64}$/;

const AUTHORIZATION_REF_PATTERN =
  /^AZN-[0-9A-Z:_.-]+$/;

const EXECUTION_ID_PATTERN =
  /^EXE-[0-9A-Z:_.-]+$/;

const CONTROLLED_REF_PATTERN =
  /^[A-Z0-9_:.-]+$/;

function failClosed(
  code:
    PlatformCoreAuthorizationConsumptionErrorCode,
  message: string,
): never {
  throw new PlatformCoreAuthorizationConsumptionError(
    code,
    message,
  );
}

function requireString(
  value: unknown,
  label: string,
): string {
  if (
    typeof value !== "string"
    || value.length === 0
  ) {
    failClosed(
      "PERSISTENCE_AMBIGUITY",
      `${label} is not a non-empty string`,
    );
  }

  return value;
}

function requireNullableString(
  value: unknown,
  label: string,
): string | null {
  if (value === null) {
    return null;
  }

  return requireString(
    value,
    label,
  );
}

function requireBoolean(
  value: unknown,
  label: string,
): boolean {
  if (typeof value !== "boolean") {
    failClosed(
      "PERSISTENCE_AMBIGUITY",
      `${label} is not boolean`,
    );
  }

  return value;
}

function requireSafeInteger(
  value: unknown,
  label: string,
): number {
  let parsed: number;

  if (typeof value === "number") {
    parsed =
      value;
  } else if (typeof value === "bigint") {
    parsed =
      Number(value);
  } else if (
    typeof value === "string"
    && /^[0-9]+$/.test(value)
  ) {
    parsed =
      Number(value);
  } else {
    failClosed(
      "PERSISTENCE_AMBIGUITY",
      `${label} is not an integer`,
    );
  }

  if (
    !Number.isSafeInteger(parsed)
    || parsed < 0
  ) {
    failClosed(
      "PERSISTENCE_AMBIGUITY",
      `${label} is outside safe integer bounds`,
    );
  }

  return parsed;
}

function normalizeTimestamp(
  value: unknown,
  label: string,
): string {
  if (value instanceof Date) {
    return value.toISOString();
  }

  const raw =
    requireString(
      value,
      label,
    );

  const parsed =
    new Date(raw);

  if (
    Number.isNaN(
      parsed.getTime(),
    )
  ) {
    failClosed(
      "PERSISTENCE_AMBIGUITY",
      `${label} is not a valid timestamp`,
    );
  }

  return parsed.toISOString();
}

function validateInput(
  input:
    PlatformCoreAuthorizationConsumptionInput,
): void {
  if (
    input.authorizationRef.length < 5
    || input.authorizationRef.length > 128
    || !AUTHORIZATION_REF_PATTERN.test(
      input.authorizationRef,
    )
  ) {
    failClosed(
      "INVALID_INPUT",
      "authorizationRef is invalid",
    );
  }

  if (
    input.authorizationVersion.length === 0
  ) {
    failClosed(
      "INVALID_INPUT",
      "authorizationVersion is invalid",
    );
  }

  if (
    !SHA256_PATTERN.test(
      input.authorizationSha256,
    )
  ) {
    failClosed(
      "INVALID_INPUT",
      "authorizationSha256 is invalid",
    );
  }

  if (
    !SHA256_PATTERN.test(
      input.replayKeySha256,
    )
  ) {
    failClosed(
      "INVALID_INPUT",
      "replayKeySha256 is invalid",
    );
  }

  if (
    input.replayMode !== "SINGLE_USE"
    && input.replayMode !== "BOUNDED_USE"
  ) {
    failClosed(
      "INVALID_INPUT",
      "replayMode is invalid",
    );
  }

  if (
    !Number.isSafeInteger(
      input.maxUses,
    )
    || input.maxUses < 1
  ) {
    failClosed(
      "INVALID_INPUT",
      "maxUses is invalid",
    );
  }

  if (
    input.replayMode === "SINGLE_USE"
    && input.maxUses !== 1
  ) {
    failClosed(
      "INVALID_INPUT",
      "SINGLE_USE requires maxUses=1",
    );
  }

  if (
    input.usageCounterRef !== null
    && (
      input.usageCounterRef.length < 3
      || input.usageCounterRef.length > 160
      || !CONTROLLED_REF_PATTERN.test(
        input.usageCounterRef,
      )
    )
  ) {
    failClosed(
      "INVALID_INPUT",
      "usageCounterRef is invalid",
    );
  }

  if (
    input.executionId.length < 5
    || input.executionId.length > 128
    || !EXECUTION_ID_PATTERN.test(
      input.executionId,
    )
  ) {
    failClosed(
      "INVALID_INPUT",
      "executionId is invalid",
    );
  }

  if (
    !SHA256_PATTERN.test(
      input.actionSha256,
    )
  ) {
    failClosed(
      "INVALID_INPUT",
      "actionSha256 is invalid",
    );
  }

  if (
    !SHA256_PATTERN.test(
      input.requestSha256,
    )
  ) {
    failClosed(
      "INVALID_INPUT",
      "requestSha256 is invalid",
    );
  }

  if (
    input.iospaceRef.length < 3
    || input.iospaceRef.length > 160
    || !CONTROLLED_REF_PATTERN.test(
      input.iospaceRef,
    )
  ) {
    failClosed(
      "INVALID_INPUT",
      "iospaceRef is invalid",
    );
  }
}

function createConsumptionEventRef(): string {
  return (
    "HBCE_AC_EVT:"
    + randomUUID()
      .replaceAll(
        "-",
        "",
      )
      .toUpperCase()
  );
}

function isSerializationFailureMessage(
  error: string,
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

function isExecutionIdUniqueViolationMessage(
  error: string,
): boolean {
  const normalized =
    error.toLowerCase();

  const executionConstraint =
    normalized.includes(
      "hbce_pc_ac_event_execution_uq",
    );

  const uniqueViolation =
    normalized.includes(
      "duplicate key value violates unique constraint",
    )
    || normalized.includes(
      "sqlstate 23505",
    )
    || normalized.includes(
      "code 23505",
    )
    || normalized.includes(
      "23505",
    );

  return (
    executionConstraint
    && uniqueViolation
  );
}

function eventRowToEvidence(
  row: EventRow,
  idempotentReplay: boolean,
): PlatformCoreAuthorizationConsumptionEvidence {
  const atomic =
    requireBoolean(
      row.atomic,
      "event.atomic",
    );

  if (atomic !== true) {
    failClosed(
      "PERSISTENCE_AMBIGUITY",
      "persisted consumption event is not atomic",
    );
  }

  const consumptionIndex =
    requireSafeInteger(
      row.consumption_index,
      "event.consumption_index",
    );

  if (consumptionIndex < 1) {
    failClosed(
      "PERSISTENCE_AMBIGUITY",
      "consumption index must be >= 1",
    );
  }

  return {
    consumptionEventRef:
      requireString(
        row.consumption_event_ref,
        "event.consumption_event_ref",
      ),

    executionId:
      requireString(
        row.execution_id,
        "event.execution_id",
      ),

    consumptionIndex,

    authorizationRef:
      requireString(
        row.authorization_ref,
        "event.authorization_ref",
      ),

    authorizationVersion:
      requireString(
        row.authorization_version,
        "event.authorization_version",
      ),

    authorizationSha256:
      requireString(
        row.authorization_sha256,
        "event.authorization_sha256",
      ),

    replayKeySha256:
      requireString(
        row.replay_key_sha256,
        "event.replay_key_sha256",
      ),

    usageCounterRef:
      requireNullableString(
        row.usage_counter_ref,
        "event.usage_counter_ref",
      ),

    actionSha256:
      requireString(
        row.action_sha256,
        "event.action_sha256",
      ),

    requestSha256:
      requireString(
        row.request_sha256,
        "event.request_sha256",
      ),

    iospaceRef:
      requireString(
        row.iospace_ref,
        "event.iospace_ref",
      ),

    consumedAt:
      normalizeTimestamp(
        row.consumed_at,
        "event.consumed_at",
      ),

    atomic: true,

    idempotentReplay,
  };
}

function eventMatchesInput(
  evidence:
    PlatformCoreAuthorizationConsumptionEvidence,
  input:
    PlatformCoreAuthorizationConsumptionInput,
): boolean {
  return (
    evidence.executionId
      === input.executionId
    && evidence.authorizationRef
      === input.authorizationRef
    && evidence.authorizationVersion
      === input.authorizationVersion
    && evidence.authorizationSha256
      === input.authorizationSha256
    && evidence.replayKeySha256
      === input.replayKeySha256
    && evidence.usageCounterRef
      === input.usageCounterRef
    && evidence.actionSha256
      === input.actionSha256
    && evidence.requestSha256
      === input.requestSha256
    && evidence.iospaceRef
      === input.iospaceRef
  );
}

async function readEventByExecutionId(
  transaction: HbceTransactionContext,
  executionId: string,
): Promise<EventRow | null> {
  const result =
    await transaction.query(
      `
        SELECT
          consumption_event_ref,
          execution_id,
          consumption_index,
          authorization_ref,
          authorization_version,
          authorization_sha256,
          replay_key_sha256,
          action_sha256,
          request_sha256,
          iospace_ref,
          usage_counter_ref,
          consumed_at,
          atomic
        FROM ${EVENT_TABLE}
        WHERE execution_id = $1
        LIMIT 1
      `,
      [
        executionId,
      ],
    );

  return (
    (result.rows[0] as
      | EventRow
      | undefined)
    ?? null
  );
}

async function executeConsumptionAttempt(
  transaction: HbceTransactionContext,
  input:
    PlatformCoreAuthorizationConsumptionInput,
  consumptionEventRef: string,
): Promise<AttemptValue> {
  const priorBeforeLock =
    await readEventByExecutionId(
      transaction,
      input.executionId,
    );

  if (priorBeforeLock !== null) {
    const evidence =
      eventRowToEvidence(
        priorBeforeLock,
        true,
      );

    if (
      !eventMatchesInput(
        evidence,
        input,
      )
    ) {
      return {
        kind: "REJECTED",
        code:
          "EXISTING_EXECUTION_BINDING_MISMATCH",
        message:
          "execution_id already belongs to a different consumption binding",
      };
    }

    return {
      kind:
        "IDEMPOTENT_REPLAY",
      evidence,
    };
  }

  await transaction.query(
    `
      INSERT INTO ${STATE_TABLE} (
        replay_key_sha256,
        authorization_ref,
        authorization_version,
        authorization_sha256,
        replay_mode,
        max_uses,
        usage_counter_ref,
        committed_consumption_count,
        last_consumed_at
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        0,
        NULL
      )
      ON CONFLICT (replay_key_sha256)
      DO NOTHING
    `,
    [
      input.replayKeySha256,
      input.authorizationRef,
      input.authorizationVersion,
      input.authorizationSha256,
      input.replayMode,
      input.maxUses,
      input.usageCounterRef,
    ],
  );

  const stateResult =
    await transaction.query(
      `
        SELECT
          replay_key_sha256,
          authorization_ref,
          authorization_version,
          authorization_sha256,
          replay_mode,
          max_uses,
          usage_counter_ref,
          committed_consumption_count,
          last_consumed_at
        FROM ${STATE_TABLE}
        WHERE replay_key_sha256 = $1
        FOR UPDATE
      `,
      [
        input.replayKeySha256,
      ],
    );

  const state =
    (
      stateResult.rows[0] as
        | StateRow
        | undefined
    );

  if (state === undefined) {
    failClosed(
      "PERSISTENCE_AMBIGUITY",
      "authorization consumption state disappeared after initialization",
    );
  }

  /*
   * Re-check after acquiring the replay-key row lock.
   * This is required for concurrent same-execution replay.
   */
  const priorAfterLock =
    await readEventByExecutionId(
      transaction,
      input.executionId,
    );

  if (priorAfterLock !== null) {
    const evidence =
      eventRowToEvidence(
        priorAfterLock,
        true,
      );

    if (
      !eventMatchesInput(
        evidence,
        input,
      )
    ) {
      return {
        kind: "REJECTED",
        code:
          "EXISTING_EXECUTION_BINDING_MISMATCH",
        message:
          "execution_id became bound to a different consumption event",
      };
    }

    return {
      kind:
        "IDEMPOTENT_REPLAY",
      evidence,
    };
  }

  const stateAuthorizationRef =
    requireString(
      state.authorization_ref,
      "state.authorization_ref",
    );

  const stateAuthorizationVersion =
    requireString(
      state.authorization_version,
      "state.authorization_version",
    );

  const stateAuthorizationSha256 =
    requireString(
      state.authorization_sha256,
      "state.authorization_sha256",
    );

  if (
    stateAuthorizationRef
      !== input.authorizationRef
    || stateAuthorizationVersion
      !== input.authorizationVersion
    || stateAuthorizationSha256
      !== input.authorizationSha256
  ) {
    return {
      kind: "REJECTED",
      code:
        "AUTHORIZATION_BINDING_MISMATCH",
      message:
        "replay key is already bound to a different authorization",
    };
  }

  const replayMode =
    requireString(
      state.replay_mode,
      "state.replay_mode",
    );

  const maxUses =
    requireSafeInteger(
      state.max_uses,
      "state.max_uses",
    );

  const usageCounterRef =
    requireNullableString(
      state.usage_counter_ref,
      "state.usage_counter_ref",
    );

  if (
    replayMode
      !== input.replayMode
    || maxUses
      !== input.maxUses
    || usageCounterRef
      !== input.usageCounterRef
  ) {
    return {
      kind: "REJECTED",
      code:
        "REPLAY_POLICY_MISMATCH",
      message:
        "persisted replay policy differs from requested replay policy",
    };
  }

  if (
    replayMode !== "SINGLE_USE"
    && replayMode !== "BOUNDED_USE"
  ) {
    failClosed(
      "PERSISTENCE_AMBIGUITY",
      "persisted replay mode is unknown",
    );
  }

  if (
    replayMode === "SINGLE_USE"
    && maxUses !== 1
  ) {
    failClosed(
      "PERSISTENCE_AMBIGUITY",
      "persisted SINGLE_USE policy has max_uses != 1",
    );
  }

  const committedCount =
    requireSafeInteger(
      state.committed_consumption_count,
      "state.committed_consumption_count",
    );

  if (committedCount > maxUses) {
    failClosed(
      "PERSISTENCE_AMBIGUITY",
      "persisted consumption count exceeds max_uses",
    );
  }

  if (committedCount >= maxUses) {
    return {
      kind: "REJECTED",
      code:
        "AUTHORIZATION_EXHAUSTED",
      message:
        "authorization consumption allowance is exhausted",
    };
  }

  const nextIndex =
    committedCount + 1;

  if (
    !Number.isSafeInteger(
      nextIndex,
    )
    || nextIndex < 1
    || nextIndex > maxUses
  ) {
    failClosed(
      "PERSISTENCE_AMBIGUITY",
      "next consumption index is invalid",
    );
  }

  const updateResult =
    await transaction.query(
      `
        UPDATE ${STATE_TABLE}
        SET
          committed_consumption_count = $2,
          last_consumed_at = NOW(),
          updated_at = NOW()
        WHERE
          replay_key_sha256 = $1
          AND committed_consumption_count = $3
        RETURNING
          committed_consumption_count,
          last_consumed_at
      `,
      [
        input.replayKeySha256,
        nextIndex,
        committedCount,
      ],
    );

  if (updateResult.rows.length !== 1) {
    failClosed(
      "PERSISTENCE_AMBIGUITY",
      "authorization consumption state advancement was not singular",
    );
  }

  const updatedRow =
    updateResult.rows[0] as
      Record<string, unknown>;

  const committedAfter =
    requireSafeInteger(
      updatedRow[
        "committed_consumption_count"
      ],
      "updated.committed_consumption_count",
    );

  if (committedAfter !== nextIndex) {
    failClosed(
      "PERSISTENCE_AMBIGUITY",
      "persisted consumption index differs from requested next index",
    );
  }

  const consumedAt =
    normalizeTimestamp(
      updatedRow[
        "last_consumed_at"
      ],
      "updated.last_consumed_at",
    );

  const insertResult =
    await transaction.query(
      `
        INSERT INTO ${EVENT_TABLE} (
          consumption_event_ref,
          execution_id,
          consumption_index,
          authorization_ref,
          authorization_version,
          authorization_sha256,
          replay_key_sha256,
          action_sha256,
          request_sha256,
          iospace_ref,
          usage_counter_ref,
          consumed_at,
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
          $10,
          $11,
          $12,
          TRUE
        )
        RETURNING
          consumption_event_ref,
          execution_id,
          consumption_index,
          authorization_ref,
          authorization_version,
          authorization_sha256,
          replay_key_sha256,
          action_sha256,
          request_sha256,
          iospace_ref,
          usage_counter_ref,
          consumed_at,
          atomic
      `,
      [
        consumptionEventRef,
        input.executionId,
        nextIndex,
        input.authorizationRef,
        input.authorizationVersion,
        input.authorizationSha256,
        input.replayKeySha256,
        input.actionSha256,
        input.requestSha256,
        input.iospaceRef,
        input.usageCounterRef,
        consumedAt,
      ],
    );

  if (insertResult.rows.length !== 1) {
    failClosed(
      "PERSISTENCE_AMBIGUITY",
      "consumption event insertion was not singular",
    );
  }

  const evidence =
    eventRowToEvidence(
      insertResult.rows[0] as EventRow,
      false,
    );

  if (
    !eventMatchesInput(
      evidence,
      input,
    )
  ) {
    failClosed(
      "PERSISTENCE_AMBIGUITY",
      "persisted consumption event does not match transaction input",
    );
  }

  if (
    evidence.consumptionIndex
      !== nextIndex
  ) {
    failClosed(
      "PERSISTENCE_AMBIGUITY",
      "persisted consumption event index mismatch",
    );
  }

  return {
    kind: "CONSUMED",
    evidence,
  };
}

async function reconcileDuplicateExecution(
  input:
    PlatformCoreAuthorizationConsumptionInput,
): Promise<
  PlatformCoreAuthorizationConsumptionEvidence
> {
  const outcome =
    await withHbceDatabaseTransaction(
      async (
        transaction,
      ) => {
        const row =
          await readEventByExecutionId(
            transaction,
            input.executionId,
          );

        if (row === null) {
          return null;
        }

        return eventRowToEvidence(
          row,
          true,
        );
      },
      {
        isolationLevel:
          PLATFORM_CORE_AUTHORIZATION_CONSUMPTION_TRANSACTION_ISOLATION,
        readOnly: true,
      },
    );

  if (!outcome.ok) {
    failClosed(
      "DUPLICATE_RECONCILIATION_FAILED",
      "duplicate execution reconciliation transaction failed",
    );
  }

  if (outcome.value === null) {
    failClosed(
      "DUPLICATE_RECONCILIATION_FAILED",
      "duplicate database condition had no committed execution event",
    );
  }

  if (
    !eventMatchesInput(
      outcome.value,
      input,
    )
  ) {
    failClosed(
      "EXISTING_EXECUTION_BINDING_MISMATCH",
      "duplicate execution_id belongs to a different consumption binding",
    );
  }

  return outcome.value;
}

export async function consumePlatformCoreAuthorization(
  input:
    PlatformCoreAuthorizationConsumptionInput,
): Promise<
  PlatformCoreAuthorizationConsumptionEvidence
> {
  validateInput(
    input,
  );

  /*
   * Generated once, outside the retry loop.
   * A serialization retry therefore represents the same logical
   * consumption attempt rather than manufacturing a new identity.
   */
  const consumptionEventRef =
    createConsumptionEventRef();

  for (
    let attempt = 1;
    attempt
      <= PLATFORM_CORE_AUTHORIZATION_CONSUMPTION_MAX_ATTEMPTS;
    attempt += 1
  ) {
    const outcome =
      await withHbceDatabaseTransaction(
        async (
          transaction,
        ) =>
          executeConsumptionAttempt(
            transaction,
            input,
            consumptionEventRef,
          ),
        {
          isolationLevel:
            PLATFORM_CORE_AUTHORIZATION_CONSUMPTION_TRANSACTION_ISOLATION,
        },
      );

    if (outcome.ok) {
      const result =
        outcome.value;

      if (
        result.kind === "REJECTED"
      ) {
        failClosed(
          result.code,
          result.message,
        );
      }

      /*
       * atomic=true becomes externally observable only here,
       * after withHbceDatabaseTransaction reports COMMITTED.
       */
      return result.evidence;
    }

    const serializationFailure =
      isSerializationFailureMessage(
        outcome.error,
      );

    if (serializationFailure) {
      if (
        attempt
        < PLATFORM_CORE_AUTHORIZATION_CONSUMPTION_MAX_ATTEMPTS
      ) {
        continue;
      }

      failClosed(
        "SERIALIZATION_RETRY_EXHAUSTED",
        "SERIALIZABLE authorization consumption retries exhausted",
      );
    }

    const executionIdUniqueViolation =
      isExecutionIdUniqueViolationMessage(
        outcome.error,
      );

    if (executionIdUniqueViolation) {
      return reconcileDuplicateExecution(
        input,
      );
    }

    failClosed(
      "TRANSACTION_FAILED",
      "authorization consumption transaction failed closed",
    );
  }

  failClosed(
    "SERIALIZATION_RETRY_EXHAUSTED",
    "authorization consumption retry loop terminated unexpectedly",
  );
}
