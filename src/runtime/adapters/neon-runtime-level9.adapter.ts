import { createHash, randomUUID } from "node:crypto";

import type {
  RuntimeEffectReconciliationResult,
  RuntimeOperationEffect,
  RuntimeOpcReceipt,
  RuntimeOutboxRecord,
} from "../types/runtime-external-effect";

import type {
  RuntimeLevel9Adapter,
  RuntimeLevel9Checkpoint,
  RuntimeLevel9CleanupResult,
  RuntimeLevel9Configuration,
  RuntimeLevel9LeaseAttempt,
  RuntimeLevel9OperationRecord,
  RuntimeLevel9OperationStatus,
  RuntimeLevel9PersistentCounts,
  RuntimeLevel9RecoveryDecision,
  RuntimeLevel9RecoveryStatus,
} from "../self-tests/hbce-runtime-external-effect-idempotency-self-test";

/**
 * Minimal database contracts compatible with a persistent PostgreSQL pool.
 *
 * The application can wrap an existing @neondatabase/serverless Pool so the
 * adapter remains independent from the database bootstrap location.
 */
export interface RuntimeLevel9QueryResult<Row = Record<string, unknown>> {
  rows: Row[];
  rowCount?: number | null;
}

export interface RuntimeLevel9TransactionClient {
  query<Row = Record<string, unknown>>(
    text: string,
    values?: readonly unknown[],
  ): Promise<RuntimeLevel9QueryResult<Row>>;

  release(): void;
}

export interface RuntimeLevel9DatabasePool {
  query<Row = Record<string, unknown>>(
    text: string,
    values?: readonly unknown[],
  ): Promise<RuntimeLevel9QueryResult<Row>>;

  connect(): Promise<RuntimeLevel9TransactionClient>;
}

interface OperationRow {
  operation_id: string;
  idempotency_key: string;
  operation_status: RuntimeLevel9OperationStatus;
  checkpoint: RuntimeLevel9Checkpoint;
  recovery_status: RuntimeLevel9RecoveryStatus;
  attempt_count: number;
  recovery_count: number;
  max_attempts: number;
  lease_owner: string | null;
  lease_token: string | null;
  lease_acquired_at: Date | string | null;
  lease_expires_at: Date | string | null;
  heartbeat_at: Date | string | null;
  state_hash: string;
  chain_hash: string;
  interruption_reason: string | null;
  completion_reason: string | null;
  created_at: Date | string;
  updated_at: Date | string;
  completed_at: Date | string | null;
  legal_certification: false;
}

interface EffectRow {
  id: string;
  operation_id: string;
  idempotency_key: string;
  effect_type: string;
  effect_status:
    | "PENDING"
    | "COMMITTED"
    | "RECONCILIATION_REQUIRED"
    | "RECONCILED"
    | "COMPLETED"
    | "FAILED";
  payload_hash: string;
  effect_hash: string;
  chain_hash: string;
  created_at: Date | string;
  updated_at: Date | string;
  completed_at: Date | string | null;
  legal_certification: false;
}

interface OutboxRow {
  id: string;
  operation_id: string;
  effect_id: string;
  event_type: string;
  delivery_status:
    | "PENDING"
    | "PROCESSING"
    | "DELIVERED"
    | "RETRY_REQUIRED"
    | "FAILED";
  attempt_count: number;
  payload_hash: string;
  created_at: Date | string;
  updated_at: Date | string;
  delivered_at: Date | string | null;
}

interface OpcRow {
  id: string;
  operation_id: string;
  receipt_type: string;
  idempotency_key_hash: string;
  effect_hash: string;
  outbox_hash: string;
  final_state_hash: string;
  final_chain_hash: string;
  recovery_count: number;
  attempt_count: number;
  created_at: Date | string;
  completed_at: Date | string;
  legal_certification: false;
}

interface CountRow {
  count: string | number;
}

interface ConstraintRow {
  constraint_name: string;
}

interface TableRow {
  table_name: string;
}

const LEASE_DURATION_MS = 60_000;

const HBCE_LEVEL_9_HUMAN_IPR = "IPR-3";
const HBCE_LEVEL_9_RUNTIME_IPR = "IPR-AI-0001";
const HBCE_LEVEL_9_WORKFLOW_KIND =
  "HBCE_RUNTIME_LEVEL_9_EXTERNAL_EFFECT_IDEMPOTENCY_SELF_TEST";

function asDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

function asNullableDate(
  value: Date | string | null,
): Date | null {
  return value === null ? null : asDate(value);
}

function sha256(value: string): string {
  return `sha256:${createHash("sha256")
    .update(value, "utf8")
    .digest("hex")}`;
}

function canonicalize(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(canonicalize).join(",")}]`;
  }

  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();

  return `{${keys
    .map(
      (key) =>
        `${JSON.stringify(key)}:${canonicalize(record[key])}`,
    )
    .join(",")}}`;
}

function mapOperation(row: OperationRow): RuntimeLevel9OperationRecord {
  return {
    operationId: row.operation_id,
    idempotencyKey: row.idempotency_key,
    operationStatus: row.operation_status,
    checkpoint: row.checkpoint,
    recoveryStatus: row.recovery_status,
    attemptCount: Number(row.attempt_count),
    recoveryCount: Number(row.recovery_count),
    maxAttempts: Number(row.max_attempts),
    leaseOwner: row.lease_owner,
    leaseTokenPresent: row.lease_token !== null,
    stateHash: row.state_hash,
    chainHash: row.chain_hash,
    interruptionReason: row.interruption_reason,
    completionReason: row.completion_reason,
    createdAt: asDate(row.created_at),
    updatedAt: asDate(row.updated_at),
    completedAt: asNullableDate(row.completed_at),
    legalCertification: false,
  };
}

function mapEffect(row: EffectRow): RuntimeOperationEffect {
  return {
    id: row.id,
    operationId: row.operation_id,
    idempotencyKey: row.idempotency_key,
    effectType: row.effect_type,
    effectStatus: row.effect_status,
    payloadHash: row.payload_hash,
    effectHash: row.effect_hash,
    chainHash: row.chain_hash,
    createdAt: asDate(row.created_at),
    updatedAt: asDate(row.updated_at),
    completedAt: asNullableDate(row.completed_at),
    legalCertification: false,
  };
}

function mapOutbox(row: OutboxRow): RuntimeOutboxRecord {
  return {
    id: row.id,
    operationId: row.operation_id,
    effectId: row.effect_id,
    eventType: row.event_type,
    deliveryStatus: row.delivery_status,
    attemptCount: Number(row.attempt_count),
    payloadHash: row.payload_hash,
    createdAt: asDate(row.created_at),
    updatedAt: asDate(row.updated_at),
    deliveredAt: asNullableDate(row.delivered_at),
  };
}

function mapOpc(row: OpcRow): RuntimeOpcReceipt {
  return {
    id: row.id,
    operationId: row.operation_id,
    receiptType: row.receipt_type,
    idempotencyKeyHash: row.idempotency_key_hash,
    effectHash: row.effect_hash,
    outboxHash: row.outbox_hash,
    finalStateHash: row.final_state_hash,
    finalChainHash: row.final_chain_hash,
    recoveryCount: Number(row.recovery_count),
    attemptCount: Number(row.attempt_count),
    completedAt: asDate(row.completed_at),
    legalCertification: false,
  };
}

function requireSingleRow<Row>(
  result: RuntimeLevel9QueryResult<Row>,
  error: string,
): Row {
  const row = result.rows[0];

  if (!row) {
    throw new Error(error);
  }

  return row;
}

function normalizeDatabaseError(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "23505"
  ) {
    return "DUPLICATE_EXTERNAL_EFFECT";
  }

  return error instanceof Error ? error.message : String(error);
}

export class NeonRuntimeLevel9Adapter
  implements RuntimeLevel9Adapter
{
  public constructor(
    private readonly pool: RuntimeLevel9DatabasePool,
  ) {}

  public async getConfiguration(): Promise<RuntimeLevel9Configuration> {
    const tableResult = await this.pool.query<TableRow>(
      `
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name IN (
            'runtime_operations',
            'runtime_operation_effects',
            'runtime_operation_outbox',
            'runtime_operation_opc_receipts'
          )
      `,
    );

    const tables = new Set(
      tableResult.rows.map((row) => row.table_name),
    );

    const constraintResult =
      await this.pool.query<ConstraintRow>(
        `
          SELECT constraint_name
          FROM information_schema.table_constraints
          WHERE table_schema = 'public'
            AND constraint_name IN (
              'runtime_operation_effects_operation_type_unique',
              'runtime_operation_effects_idempotency_type_unique',
              'runtime_operation_outbox_operation_event_unique',
              'runtime_operation_opc_receipts_operation_type_unique'
            )
        `,
      );

    const constraints = new Set(
      constraintResult.rows.map(
        (row) => row.constraint_name,
      ),
    );

    let supportsTransactions = false;
    const client = await this.pool.connect();

    try {
      await client.query("BEGIN");
      await client.query("SELECT 1");
      await client.query("ROLLBACK");
      supportsTransactions = true;
    } finally {
      client.release();
    }

    return {
      configured: true,
      persistentSession: true,
      supportsTransactions,
      runtimeOperationsTable:
        tables.has("runtime_operations"),
      runtimeEffectsTable:
        tables.has("runtime_operation_effects"),
      runtimeOutboxTable:
        tables.has("runtime_operation_outbox"),
      runtimeOpcTable:
        tables.has("runtime_operation_opc_receipts"),
      operationEffectUniqueConstraint:
        constraints.has(
          "runtime_operation_effects_operation_type_unique",
        ),
      idempotencyEffectUniqueConstraint:
        constraints.has(
          "runtime_operation_effects_idempotency_type_unique",
        ),
      operationEventUniqueConstraint:
        constraints.has(
          "runtime_operation_outbox_operation_event_unique",
        ),
      operationReceiptUniqueConstraint:
        constraints.has(
          "runtime_operation_opc_receipts_operation_type_unique",
        ),
      recoveryHelper: true,
      reconciliationHelper: true,
    };
  }

  public async createDurableOperation(input: {
    operationId: string;
    idempotencyKey: string;
    maxAttempts: number;
    legalCertification: false;
  }): Promise<RuntimeLevel9OperationRecord> {
    const sessionId =
      `HBCE-L9-SESSION-${input.operationId}`;

    const statePayload = {
      operationId: input.operationId,
      idempotencyKey: input.idempotencyKey,
      humanIpr: HBCE_LEVEL_9_HUMAN_IPR,
      runtimeIpr: HBCE_LEVEL_9_RUNTIME_IPR,
      sessionId,
      workflowKind: HBCE_LEVEL_9_WORKFLOW_KIND,
      operationStatus: "NEW",
      checkpoint: "NEW",
      recoveryStatus: "NOT_REQUIRED",
      attemptCount: 0,
      recoveryCount: 0,
      maxAttempts: input.maxAttempts,
      legalCertification: false,
    };

    const stateHash = sha256(
      canonicalize(statePayload),
    );

    const chainHash = sha256(
      canonicalize({
        previousChainHash: "GENESIS",
        stateHash,
        operationId: input.operationId,
        humanIpr: HBCE_LEVEL_9_HUMAN_IPR,
        runtimeIpr: HBCE_LEVEL_9_RUNTIME_IPR,
      }),
    );

    const result = await this.pool.query<OperationRow>(
      `
        INSERT INTO runtime_operations (
          operation_id,
          idempotency_key,
          human_ipr,
          runtime_ipr,
          session_id,
          workflow_kind,
          operation_status,
          checkpoint,
          recovery_status,
          attempt_count,
          recovery_count,
          max_attempts,
          state_hash,
          chain_hash,
          state_payload,
          checkpoint_payload,
          recovery_payload,
          trace_payload,
          legal_certification
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          'NEW',
          'NEW',
          'NOT_REQUIRED',
          0,
          0,
          $7,
          $8,
          $9,
          $10::jsonb,
          '{}'::jsonb,
          '{}'::jsonb,
          $11::jsonb,
          FALSE
        )
        RETURNING *
      `,
      [
        input.operationId,
        input.idempotencyKey,
        HBCE_LEVEL_9_HUMAN_IPR,
        HBCE_LEVEL_9_RUNTIME_IPR,
        sessionId,
        HBCE_LEVEL_9_WORKFLOW_KIND,
        input.maxAttempts,
        stateHash,
        chainHash,
        JSON.stringify(statePayload),
        JSON.stringify({
          artifact:
            "HBCE-RUNTIME-EXTERNAL-EFFECT-IDEMPOTENCY-SELF-TEST-v1_0",
          level: "HBCE_RUNTIME_LEVEL_9",
          technicalRuntimeTestOnly: true,
          legalCertification: false,
        }),
      ],
    );

    return mapOperation(
      requireSingleRow(
        result,
        "DURABLE_OPERATION_CREATE_FAILED",
      ),
    );
  }

  public async getOrCreateCanonicalOperation(input: {
    requestedOperationId: string;
    idempotencyKey: string;
    maxAttempts: number;
    legalCertification: false;
  }): Promise<RuntimeLevel9OperationRecord> {
    const existing = await this.pool.query<OperationRow>(
      `
        SELECT *
        FROM runtime_operations
        WHERE idempotency_key = $1
        LIMIT 1
      `,
      [input.idempotencyKey],
    );

    if (existing.rows[0]) {
      return mapOperation(existing.rows[0]);
    }

    return this.createDurableOperation({
      operationId: input.requestedOperationId,
      idempotencyKey: input.idempotencyKey,
      maxAttempts: input.maxAttempts,
      legalCertification: false,
    });
  }

  public async findOperation(
    operationId: string,
  ): Promise<RuntimeLevel9OperationRecord | null> {
    const result = await this.pool.query<OperationRow>(
      `
        SELECT *
        FROM runtime_operations
        WHERE operation_id = $1
        LIMIT 1
      `,
      [operationId],
    );

    return result.rows[0]
      ? mapOperation(result.rows[0])
      : null;
  }

  public async transitionOperation(input: {
    operationId: string;
    operationStatus: RuntimeLevel9OperationStatus;
    checkpoint: RuntimeLevel9Checkpoint;
    recoveryStatus?: RuntimeLevel9RecoveryStatus;
    interruptionReason?: string | null;
    completionReason?: string | null;
    incrementAttempt?: boolean;
    completedAt?: Date | null;
  }): Promise<RuntimeLevel9OperationRecord> {
    const current = await this.findOperation(input.operationId);

    if (!current) {
      throw new Error("RUNTIME_OPERATION_NOT_FOUND");
    }

    const nextAttemptCount =
      current.attemptCount + (input.incrementAttempt ? 1 : 0);

    if (nextAttemptCount > current.maxAttempts) {
      throw new Error("MAX_ATTEMPTS_EXCEEDED");
    }

    const nextRecoveryStatus =
      input.recoveryStatus ?? current.recoveryStatus;

    const statePayload = {
      operationId: current.operationId,
      operationStatus: input.operationStatus,
      checkpoint: input.checkpoint,
      recoveryStatus: nextRecoveryStatus,
      attemptCount: nextAttemptCount,
      recoveryCount: current.recoveryCount,
      interruptionReason:
        input.interruptionReason ??
        current.interruptionReason,
      completionReason:
        input.completionReason ?? current.completionReason,
      completedAt:
        input.completedAt?.toISOString() ??
        current.completedAt?.toISOString() ??
        null,
      legalCertification: false,
    };

    const stateHash = sha256(canonicalize(statePayload));
    const chainHash = sha256(
      canonicalize({
        previousChainHash: current.chainHash,
        stateHash,
      }),
    );

    const result = await this.pool.query<OperationRow>(
      `
        UPDATE runtime_operations
        SET
          operation_status = $2,
          checkpoint = $3,
          recovery_status = $4,
          attempt_count = $5,
          interruption_reason = $6,
          completion_reason = $7,
          interrupted_at =
            CASE
              WHEN $2 IN ('INTERRUPTED', 'RECOVERY_REQUIRED')
              THEN NOW()
              ELSE interrupted_at
            END,
          completed_at = $8,
          state_hash = $9,
          chain_hash = $10,
          updated_at = NOW()
        WHERE operation_id = $1
        RETURNING *
      `,
      [
        input.operationId,
        input.operationStatus,
        input.checkpoint,
        nextRecoveryStatus,
        nextAttemptCount,
        input.interruptionReason ??
          current.interruptionReason,
        input.completionReason ??
          current.completionReason,
        input.completedAt ?? current.completedAt,
        stateHash,
        chainHash,
      ],
    );

    return mapOperation(
      requireSingleRow(result, "OPERATION_TRANSITION_FAILED"),
    );
  }

  public async createEffectAndOutboxAtomic(input: {
    operationId: string;
    idempotencyKey: string;
    effectType: string;
    effectStatus: "COMMITTED";
    eventType: string;
    payloadHash: string;
    effectHash: string;
    chainHash: string;
    legalCertification: false;
  }): Promise<{
    effect: RuntimeOperationEffect;
    outbox: RuntimeOutboxRecord;
  }> {
    const client = await this.pool.connect();

    try {
      await client.query("BEGIN");

      const effectResult = await client.query<EffectRow>(
        `
          INSERT INTO runtime_operation_effects (
            operation_id,
            idempotency_key,
            effect_type,
            effect_status,
            payload_hash,
            effect_hash,
            chain_hash,
            completed_at,
            legal_certification
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            NOW(),
            FALSE
          )
          RETURNING *
        `,
        [
          input.operationId,
          input.idempotencyKey,
          input.effectType,
          input.effectStatus,
          input.payloadHash,
          input.effectHash,
          input.chainHash,
        ],
      );

      const effectRow = requireSingleRow(
        effectResult,
        "PERSISTENT_EFFECT_INSERT_FAILED",
      );

      const outboxResult = await client.query<OutboxRow>(
        `
          INSERT INTO runtime_operation_outbox (
            operation_id,
            effect_id,
            event_type,
            delivery_status,
            attempt_count,
            payload_hash
          )
          VALUES (
            $1,
            $2,
            $3,
            'PENDING',
            0,
            $4
          )
          RETURNING *
        `,
        [
          input.operationId,
          effectRow.id,
          input.eventType,
          input.payloadHash,
        ],
      );

      const outboxRow = requireSingleRow(
        outboxResult,
        "TRANSACTIONAL_OUTBOX_INSERT_FAILED",
      );

      await client.query("COMMIT");

      return {
        effect: mapEffect(effectRow),
        outbox: mapOutbox(outboxRow),
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw new Error(normalizeDatabaseError(error));
    } finally {
      client.release();
    }
  }

  public async findEffect(
    operationId: string,
    effectType: string,
  ): Promise<RuntimeOperationEffect | null> {
    const result = await this.pool.query<EffectRow>(
      `
        SELECT *
        FROM runtime_operation_effects
        WHERE operation_id = $1
          AND effect_type = $2
        LIMIT 1
      `,
      [operationId, effectType],
    );

    return result.rows[0]
      ? mapEffect(result.rows[0])
      : null;
  }

  public async findOutbox(
    operationId: string,
    eventType: string,
  ): Promise<RuntimeOutboxRecord | null> {
    const result = await this.pool.query<OutboxRow>(
      `
        SELECT *
        FROM runtime_operation_outbox
        WHERE operation_id = $1
          AND event_type = $2
        LIMIT 1
      `,
      [operationId, eventType],
    );

    return result.rows[0]
      ? mapOutbox(result.rows[0])
      : null;
  }

  public async countPersistentRecords(
    operationId: string,
  ): Promise<RuntimeLevel9PersistentCounts> {
    const [operations, effects, outbox, opc] =
      await Promise.all([
        this.pool.query<CountRow>(
          `
            SELECT COUNT(*) AS count
            FROM runtime_operations
            WHERE operation_id = $1
          `,
          [operationId],
        ),
        this.pool.query<CountRow>(
          `
            SELECT COUNT(*) AS count
            FROM runtime_operation_effects
            WHERE operation_id = $1
          `,
          [operationId],
        ),
        this.pool.query<CountRow>(
          `
            SELECT COUNT(*) AS count
            FROM runtime_operation_outbox
            WHERE operation_id = $1
          `,
          [operationId],
        ),
        this.pool.query<CountRow>(
          `
            SELECT COUNT(*) AS count
            FROM runtime_operation_opc_receipts
            WHERE operation_id = $1
          `,
          [operationId],
        ),
      ]);

    return {
      operationCount: Number(operations.rows[0]?.count ?? 0),
      effectCount: Number(effects.rows[0]?.count ?? 0),
      outboxCount: Number(outbox.rows[0]?.count ?? 0),
      opcCount: Number(opc.rows[0]?.count ?? 0),
    };
  }

  public async detectRecoveryNeed(
    operationId: string,
  ): Promise<RuntimeLevel9RecoveryDecision> {
    const record = await this.findOperation(operationId);

    if (!record) {
      throw new Error("RUNTIME_OPERATION_NOT_FOUND");
    }

    const recover =
      record.operationStatus === "INTERRUPTED" ||
      record.recoveryStatus === "REQUIRED";

    return {
      recover,
      reason:
        record.operationStatus === "INTERRUPTED"
          ? "INTERRUPTED_OPERATION"
          : "STALE_HEARTBEAT",
      record,
    };
  }

  public async markRecoveryRequired(input: {
    operationId: string;
    reason: string;
  }): Promise<RuntimeLevel9OperationRecord> {
    return this.transitionOperation({
      operationId: input.operationId,
      operationStatus: "RECOVERY_REQUIRED",
      checkpoint: "RECOVERY_REQUIRED",
      recoveryStatus: "REQUIRED",
      interruptionReason: input.reason,
    });
  }

  public async acquireRecoveryLease(input: {
    operationId: string;
    workerId: string;
  }): Promise<RuntimeLevel9LeaseAttempt> {
    const leaseToken = randomUUID();
    const leaseExpiresAt = new Date(
      Date.now() + LEASE_DURATION_MS,
    );

    const result = await this.pool.query<OperationRow>(
      `
        UPDATE runtime_operations
        SET
          operation_status = 'RECOVERING',
          checkpoint = 'RECOVERING',
          recovery_status = 'LEASE_ACQUIRED',
          recovery_count = recovery_count + 1,
          lease_owner = $2,
          lease_token = $3,
          lease_acquired_at = NOW(),
          lease_expires_at = $4,
          heartbeat_at = NOW(),
          updated_at = NOW()
        WHERE operation_id = $1
          AND recovery_status = 'REQUIRED'
          AND (
            lease_owner IS NULL
            OR lease_expires_at IS NULL
            OR lease_expires_at < NOW()
          )
        RETURNING *
      `,
      [
        input.operationId,
        input.workerId,
        leaseToken,
        leaseExpiresAt,
      ],
    );

    if (!result.rows[0]) {
      return {
        acquired: false,
        error: "RECOVERY_LEASE_NOT_ACQUIRED",
        record: null,
      };
    }

    return {
      acquired: true,
      error: null,
      record: mapOperation(result.rows[0]),
    };
  }

  public async releaseRecoveryLease(input: {
    operationId: string;
    workerId: string;
  }): Promise<RuntimeLevel9OperationRecord> {
    const result = await this.pool.query<OperationRow>(
      `
        UPDATE runtime_operations
        SET
          lease_owner = NULL,
          lease_token = NULL,
          lease_acquired_at = NULL,
          lease_expires_at = NULL,
          heartbeat_at = NULL,
          updated_at = NOW()
        WHERE operation_id = $1
          AND lease_owner = $2
        RETURNING *
      `,
      [input.operationId, input.workerId],
    );

    return mapOperation(
      requireSingleRow(
        result,
        "RECOVERY_LEASE_RELEASE_FAILED",
      ),
    );
  }

  public async reconcileExistingEffect(input: {
    operationId: string;
    idempotencyKey: string;
    effectType: string;
    eventType: string;
  }): Promise<RuntimeEffectReconciliationResult> {
    const before =
      await this.countPersistentRecords(input.operationId);

    const [effect, outbox] = await Promise.all([
      this.findEffect(input.operationId, input.effectType),
      this.findOutbox(input.operationId, input.eventType),
    ]);

    const existingEffectFound = effect !== null;
    const existingOutboxFound = outbox !== null;

    const existingEffectValid =
      effect !== null &&
      effect.idempotencyKey === input.idempotencyKey &&
      effect.operationId === input.operationId;

    if (
      !existingEffectFound ||
      !existingEffectValid ||
      !existingOutboxFound
    ) {
      throw new Error("RECONCILIATION_REQUIRED");
    }

    const after =
      await this.countPersistentRecords(input.operationId);

    return {
      existingEffectFound,
      existingEffectValid,
      existingOutboxFound,
      effectReused: true,
      newEffectCreated: false,
      effectCountBeforeRecovery: before.effectCount,
      effectCountAfterRecovery: after.effectCount,
      outboxCountBeforeRecovery: before.outboxCount,
      outboxCountAfterRecovery: after.outboxCount,
    };
  }

  public async attemptDuplicateEffectInsert(input: {
    operationId: string;
    idempotencyKey: string;
    effectType: string;
    eventType: string;
    payloadHash: string;
    effectHash: string;
    chainHash: string;
  }): Promise<{
    accepted: boolean;
    error: string | null;
  }> {
    try {
      await this.createEffectAndOutboxAtomic({
        ...input,
        effectStatus: "COMMITTED",
        legalCertification: false,
      });

      return {
        accepted: true,
        error: null,
      };
    } catch (error) {
      return {
        accepted: false,
        error: normalizeDatabaseError(error),
      };
    }
  }

  public async createOrGetOpcReceipt(input: {
    operationId: string;
    receiptType: string;
    idempotencyKeyHash: string;
    effectHash: string;
    outboxHash: string;
    finalStateHash: string;
    finalChainHash: string;
    recoveryCount: number;
    attemptCount: number;
    completedAt: Date;
    legalCertification: false;
  }): Promise<{
    receipt: RuntimeOpcReceipt;
    created: boolean;
  }> {
    const existing = await this.pool.query<OpcRow>(
      `
        SELECT *
        FROM runtime_operation_opc_receipts
        WHERE operation_id = $1
          AND receipt_type = $2
        LIMIT 1
      `,
      [input.operationId, input.receiptType],
    );

    if (existing.rows[0]) {
      return {
        receipt: mapOpc(existing.rows[0]),
        created: false,
      };
    }

    const inserted = await this.pool.query<OpcRow>(
      `
        INSERT INTO runtime_operation_opc_receipts (
          operation_id,
          receipt_type,
          idempotency_key_hash,
          effect_hash,
          outbox_hash,
          final_state_hash,
          final_chain_hash,
          recovery_count,
          attempt_count,
          completed_at,
          legal_certification
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
          FALSE
        )
        RETURNING *
      `,
      [
        input.operationId,
        input.receiptType,
        input.idempotencyKeyHash,
        input.effectHash,
        input.outboxHash,
        input.finalStateHash,
        input.finalChainHash,
        input.recoveryCount,
        input.attemptCount,
        input.completedAt,
      ],
    );

    return {
      receipt: mapOpc(
        requireSingleRow(
          inserted,
          "OPC_RECEIPT_CREATE_FAILED",
        ),
      ),
      created: true,
    };
  }

  public async cleanupTemporaryRecords(
    operationId: string,
  ): Promise<RuntimeLevel9CleanupResult> {
    const client = await this.pool.connect();

    try {
      await client.query("BEGIN");

      await client.query(
        `
          DELETE FROM runtime_operation_opc_receipts
          WHERE operation_id = $1
        `,
        [operationId],
      );

      await client.query(
        `
          DELETE FROM runtime_operation_outbox
          WHERE operation_id = $1
        `,
        [operationId],
      );

      await client.query(
        `
          DELETE FROM runtime_operation_effects
          WHERE operation_id = $1
        `,
        [operationId],
      );

      await client.query(
        `
          DELETE FROM runtime_operations
          WHERE operation_id = $1
        `,
        [operationId],
      );

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    const [operation, effect, outbox, opc] =
      await Promise.all([
        this.findOperation(operationId),
        this.pool.query<EffectRow>(
          `
            SELECT *
            FROM runtime_operation_effects
            WHERE operation_id = $1
            LIMIT 1
          `,
          [operationId],
        ),
        this.pool.query<OutboxRow>(
          `
            SELECT *
            FROM runtime_operation_outbox
            WHERE operation_id = $1
            LIMIT 1
          `,
          [operationId],
        ),
        this.pool.query<OpcRow>(
          `
            SELECT *
            FROM runtime_operation_opc_receipts
            WHERE operation_id = $1
            LIMIT 1
          `,
          [operationId],
        ),
      ]);

    return {
      remainingOperation: operation,
      remainingEffect: effect.rows[0]
        ? mapEffect(effect.rows[0])
        : null,
      remainingOutbox: outbox.rows[0]
        ? mapOutbox(outbox.rows[0])
        : null,
      remainingOpc: opc.rows[0]
        ? mapOpc(opc.rows[0])
        : null,
    };
  }
}
