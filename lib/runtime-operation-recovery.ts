import { randomUUID } from "node:crypto";

import {
  queryHbceDatabase,
  type HbceDatabaseQueryValue,
} from "@/lib/ipr-database";

import {
  createInitialRuntimeWorkflowState,
  shouldRuntimeWorkflowRecover,
  transitionRuntimeWorkflow,
  type RuntimeOperationStatus,
  type RuntimeRecoveryStatus,
  type RuntimeWorkflowCheckpoint,
  type RuntimeWorkflowState,
  type RuntimeWorkflowTransitionReason,
} from "@/lib/runtime-workflow-state-machine";

export const HBCE_RUNTIME_OPERATION_RECOVERY_REVISION =
  "HBCE-RUNTIME-OPERATION-RECOVERY-v1_0";

export type RuntimeOperationRecord = {
  operationId: string;
  idempotencyKey: string;

  tenantId: string | null;
  workspaceId: string | null;
  subscriptionId: string | null;

  humanIpr: string;
  runtimeIpr: string;

  sessionId: string;
  threadId: string | null;
  requestId: string | null;

  workflowKind: string;

  operationStatus: RuntimeOperationStatus;
  checkpoint: RuntimeWorkflowCheckpoint;
  recoveryStatus: RuntimeRecoveryStatus;

  leaseOwner: string | null;
  leaseToken: string | null;
  leaseAcquiredAt: string | null;
  leaseExpiresAt: string | null;
  heartbeatAt: string | null;

  attemptCount: number;
  recoveryCount: number;
  maxAttempts: number;

  inputHash: string | null;
  outputHash: string | null;
  policyHash: string | null;
  stateHash: string;
  chainHash: string | null;

  lastEvtId: string | null;
  lastOpcProofId: string | null;
  lastAuditId: string | null;
  lastUsageId: string | null;
  lastMemoryId: string | null;

  interruptionReason: string | null;
  failureReason: string | null;
  completionReason: string | null;

  startedAt: string | null;
  interruptedAt: string | null;
  recoveryStartedAt: string | null;
  completedAt: string | null;
  failedAt: string | null;

  createdAt: string;
  updatedAt: string;

  statePayload: Record<string, unknown>;
  checkpointPayload: Record<string, unknown>;
  recoveryPayload: Record<string, unknown>;
  tracePayload: Record<string, unknown>;

  legalCertification: false;
};

export type CreateRuntimeOperationInput = {
  operationId: string;
  idempotencyKey: string;

  tenantId?: string | null;
  workspaceId?: string | null;
  subscriptionId?: string | null;

  humanIpr: string;
  runtimeIpr?: string;

  sessionId: string;
  threadId?: string | null;
  requestId?: string | null;

  workflowKind?: string;
  maxAttempts?: number;

  inputHash?: string | null;
  policyHash?: string | null;

  statePayload?: Record<string, unknown>;
  checkpointPayload?: Record<string, unknown>;
  tracePayload?: Record<string, unknown>;
};

export type AcquireRecoveryLeaseInput = {
  operationId: string;
  leaseOwner: string;
  leaseDurationMs?: number;
  now?: string;
};

export type RuntimeOperationMutationResult =
  | {
      ok: true;
      record: RuntimeOperationRecord;
      revision: string;
      error: null;
    }
  | {
      ok: false;
      record: null;
      revision: string;
      error: string;
    };

type GenericRow = Record<string, unknown>;

const DEFAULT_RUNTIME_IPR = "IPR-AI-0001";
const DEFAULT_WORKFLOW_KIND = "HBCE_DURABLE_WORKFLOW";
const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_LEASE_DURATION_MS = 60_000;
const DEFAULT_STALE_AFTER_MS = 60_000;

function normalizeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return "UNKNOWN_ERROR";
  }
}

function asString(value: unknown): string | null {
  if (typeof value === "string") {
    return value;
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint"
  ) {
    return String(value);
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }

  return null;
}

function asNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "bigint") {
    return Number(value);
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    return value as Record<string, unknown>;
  }

  return {};
}

function requireNonBlank(
  value: string,
  label: string,
): void {
  if (!value || value.trim().length === 0) {
    throw new Error(`${label}_REQUIRED`);
  }
}

function requireIsoTimestamp(
  value: string,
  label: string,
): void {
  if (Number.isNaN(Date.parse(value))) {
    throw new Error(`${label}_INVALID`);
  }
}

function toDatabaseParameters(
  values: unknown[],
): HbceDatabaseQueryValue[] {
  return values.map(
    (value): HbceDatabaseQueryValue => {
      if (value === null) {
        return null;
      }

      if (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
      ) {
        return value;
      }

      if (typeof value === "bigint") {
        return value.toString();
      }

      if (value instanceof Date) {
        return value;
      }

      if (Buffer.isBuffer(value)) {
        return value.toString("base64");
      }

      return JSON.stringify(value);
    },
  );
}

function mapRuntimeOperationRow(
  row: GenericRow,
): RuntimeOperationRecord {
  return {
    operationId:
      asString(row.operation_id) ?? "",

    idempotencyKey:
      asString(row.idempotency_key) ?? "",

    tenantId:
      asString(row.tenant_id),

    workspaceId:
      asString(row.workspace_id),

    subscriptionId:
      asString(row.subscription_id),

    humanIpr:
      asString(row.human_ipr) ?? "",

    runtimeIpr:
      asString(row.runtime_ipr) ?? DEFAULT_RUNTIME_IPR,

    sessionId:
      asString(row.session_id) ?? "",

    threadId:
      asString(row.thread_id),

    requestId:
      asString(row.request_id),

    workflowKind:
      asString(row.workflow_kind) ?? DEFAULT_WORKFLOW_KIND,

    operationStatus:
      (asString(row.operation_status) ??
        "NEW") as RuntimeOperationStatus,

    checkpoint:
      (asString(row.checkpoint) ??
        "NEW") as RuntimeWorkflowCheckpoint,

    recoveryStatus:
      (asString(row.recovery_status) ??
        "NOT_REQUIRED") as RuntimeRecoveryStatus,

    leaseOwner:
      asString(row.lease_owner),

    leaseToken:
      asString(row.lease_token),

    leaseAcquiredAt:
      asString(row.lease_acquired_at),

    leaseExpiresAt:
      asString(row.lease_expires_at),

    heartbeatAt:
      asString(row.heartbeat_at),

    attemptCount:
      asNumber(row.attempt_count),

    recoveryCount:
      asNumber(row.recovery_count),

    maxAttempts:
      asNumber(row.max_attempts),

    inputHash:
      asString(row.input_hash),

    outputHash:
      asString(row.output_hash),

    policyHash:
      asString(row.policy_hash),

    stateHash:
      asString(row.state_hash) ?? "",

    chainHash:
      asString(row.chain_hash),

    lastEvtId:
      asString(row.last_evt_id),

    lastOpcProofId:
      asString(row.last_opc_proof_id),

    lastAuditId:
      asString(row.last_audit_id),

    lastUsageId:
      asString(row.last_usage_id),

    lastMemoryId:
      asString(row.last_memory_id),

    interruptionReason:
      asString(row.interruption_reason),

    failureReason:
      asString(row.failure_reason),

    completionReason:
      asString(row.completion_reason),

    startedAt:
      asString(row.started_at),

    interruptedAt:
      asString(row.interrupted_at),

    recoveryStartedAt:
      asString(row.recovery_started_at),

    completedAt:
      asString(row.completed_at),

    failedAt:
      asString(row.failed_at),

    createdAt:
      asString(row.created_at) ?? "",

    updatedAt:
      asString(row.updated_at) ?? "",

    statePayload:
      asRecord(row.state_payload),

    checkpointPayload:
      asRecord(row.checkpoint_payload),

    recoveryPayload:
      asRecord(row.recovery_payload),

    tracePayload:
      asRecord(row.trace_payload),

    legalCertification: false,
  };
}

async function readRuntimeOperation(
  operationId: string,
): Promise<RuntimeOperationRecord | null> {
  const result =
    await queryHbceDatabase<GenericRow>(
      `
        SELECT *
        FROM runtime_operations
        WHERE operation_id = $1
        LIMIT 1
      `,
      [operationId],
    );

  if (!result.ok) {
    throw new Error(
      result.error ??
      "RUNTIME_OPERATION_READ_FAILED",
    );
  }

  if (result.rowCount !== 1) {
    return null;
  }

  return mapRuntimeOperationRow(
    result.rows[0] ?? {},
  );
}

function buildTransitionInput(
  record: RuntimeOperationRecord,
  input: {
    toStatus: RuntimeOperationStatus;
    toRecoveryStatus: RuntimeRecoveryStatus;
    toCheckpoint: RuntimeWorkflowCheckpoint;
    reason: RuntimeWorkflowTransitionReason;

    occurredAt?: string;

    attemptCount?: number;
    recoveryCount?: number;

    leaseOwner?: string | null;
    leaseToken?: string | null;
    leaseExpiresAt?: string | null;
    heartbeatAt?: string | null;

    lastMemoryId?: string | null;
    lastEvtId?: string | null;
    lastOpcProofId?: string | null;
    lastAuditId?: string | null;
    lastUsageId?: string | null;

    interruptionReason?: string | null;
    failureReason?: string | null;
    completionReason?: string | null;
  },
) {
  return {
    operationId:
      record.operationId,

    fromStatus:
      record.operationStatus,

    toStatus:
      input.toStatus,

    fromRecoveryStatus:
      record.recoveryStatus,

    toRecoveryStatus:
      input.toRecoveryStatus,

    fromCheckpoint:
      record.checkpoint,

    toCheckpoint:
      input.toCheckpoint,

    reason:
      input.reason,

    attemptCount:
      input.attemptCount ??
      record.attemptCount,

    recoveryCount:
      input.recoveryCount ??
      record.recoveryCount,

    maxAttempts:
      record.maxAttempts,

    previousStateHash:
      record.stateHash,

    previousChainHash:
      record.chainHash,

    occurredAt:
      input.occurredAt,

    leaseOwner:
      input.leaseOwner ??
      record.leaseOwner,

    leaseToken:
      input.leaseToken ??
      record.leaseToken,

    leaseExpiresAt:
      input.leaseExpiresAt ??
      record.leaseExpiresAt,

    heartbeatAt:
      input.heartbeatAt ??
      record.heartbeatAt,

    lastMemoryId:
      input.lastMemoryId ??
      record.lastMemoryId,

    lastEvtId:
      input.lastEvtId ??
      record.lastEvtId,

    lastOpcProofId:
      input.lastOpcProofId ??
      record.lastOpcProofId,

    lastAuditId:
      input.lastAuditId ??
      record.lastAuditId,

    lastUsageId:
      input.lastUsageId ??
      record.lastUsageId,

    interruptionReason:
      input.interruptionReason ??
      record.interruptionReason,

    failureReason:
      input.failureReason ??
      record.failureReason,

    completionReason:
      input.completionReason ??
      record.completionReason,
  };
}

async function persistTransition(
  record: RuntimeOperationRecord,
  nextState: RuntimeWorkflowState,
  extra: {
    checkpointPayload?: Record<string, unknown>;
    recoveryPayload?: Record<string, unknown>;
    tracePayload?: Record<string, unknown>;

    startedAt?: string | null;
    interruptedAt?: string | null;
    recoveryStartedAt?: string | null;
    completedAt?: string | null;
    failedAt?: string | null;
  } = {},
): Promise<RuntimeOperationRecord> {
  const result =
    await queryHbceDatabase<GenericRow>(
      `
        UPDATE runtime_operations
        SET
          operation_status = $2,
          checkpoint = $3,
          recovery_status = $4,

          lease_owner = $5::text,
          lease_token = $6::text,
          lease_acquired_at = CASE
            WHEN $5::text IS NULL THEN NULL
            ELSE COALESCE(lease_acquired_at, $7::timestamptz)
          END,
          lease_expires_at = $8::timestamptz,
          heartbeat_at = $9::timestamptz,

          attempt_count = $10,
          recovery_count = $11,

          state_hash = $12,
          chain_hash = $13,

          last_memory_id = $14,
          last_evt_id = $15,
          last_opc_proof_id = $16,
          last_audit_id = $17,
          last_usage_id = $18,

          interruption_reason = $19,
          failure_reason = $20,
          completion_reason = $21,

          started_at = COALESCE($22::timestamptz, started_at),
          interrupted_at = COALESCE($23::timestamptz, interrupted_at),
          recovery_started_at = COALESCE($24::timestamptz, recovery_started_at),
          completed_at = COALESCE($25::timestamptz, completed_at),
          failed_at = COALESCE($26::timestamptz, failed_at),

          state_payload = $27::jsonb,
          checkpoint_payload = $28::jsonb,
          recovery_payload = $29::jsonb,
          trace_payload = $30::jsonb,

          legal_certification = false
        WHERE operation_id = $1
        RETURNING *
      `,
      toDatabaseParameters([
        record.operationId,
        nextState.operationStatus,
        nextState.checkpoint,
        nextState.recoveryStatus,

        nextState.leaseOwner,
        nextState.leaseToken,
        nextState.lastTransitionAt,
        nextState.leaseExpiresAt,
        nextState.heartbeatAt,

        nextState.attemptCount,
        nextState.recoveryCount,

        nextState.stateHash,
        nextState.chainHash,

        nextState.lastMemoryId,
        nextState.lastEvtId,
        nextState.lastOpcProofId,
        nextState.lastAuditId,
        nextState.lastUsageId,

        nextState.interruptionReason,
        nextState.failureReason,
        nextState.completionReason,

        extra.startedAt ?? null,
        extra.interruptedAt ?? null,
        extra.recoveryStartedAt ?? null,
        extra.completedAt ?? null,
        extra.failedAt ?? null,

        nextState,
        extra.checkpointPayload ??
          record.checkpointPayload,

        extra.recoveryPayload ??
          record.recoveryPayload,

        {
          ...record.tracePayload,
          ...(extra.tracePayload ?? {}),
          lastTransition: {
            fromStatus:
              record.operationStatus,
            toStatus:
              nextState.operationStatus,
            fromCheckpoint:
              record.checkpoint,
            toCheckpoint:
              nextState.checkpoint,
            reason:
              nextState.lastTransitionReason,
            occurredAt:
              nextState.lastTransitionAt,
            stateHash:
              nextState.stateHash,
            chainHash:
              nextState.chainHash,
          },
        },
      ]),
    );

  if (!result.ok || result.rowCount !== 1) {
    throw new Error(
      result.error ??
      "RUNTIME_OPERATION_TRANSITION_PERSIST_FAILED",
    );
  }

  return mapRuntimeOperationRow(
    result.rows[0] ?? {},
  );
}

export async function createRuntimeOperation(
  input: CreateRuntimeOperationInput,
): Promise<RuntimeOperationMutationResult> {
  try {
    requireNonBlank(
      input.operationId,
      "OPERATION_ID",
    );

    requireNonBlank(
      input.idempotencyKey,
      "IDEMPOTENCY_KEY",
    );

    requireNonBlank(
      input.humanIpr,
      "HUMAN_IPR",
    );

    requireNonBlank(
      input.sessionId,
      "SESSION_ID",
    );

    const occurredAt =
      new Date().toISOString();

    const initialState =
      createInitialRuntimeWorkflowState({
        operationId:
          input.operationId,

        occurredAt,

        maxAttempts:
          input.maxAttempts ??
          DEFAULT_MAX_ATTEMPTS,
      });

    const result =
      await queryHbceDatabase<GenericRow>(
        `
          INSERT INTO runtime_operations (
            operation_id,
            idempotency_key,

            tenant_id,
            workspace_id,
            subscription_id,

            human_ipr,
            runtime_ipr,

            session_id,
            thread_id,
            request_id,

            workflow_kind,

            operation_status,
            checkpoint,
            recovery_status,

            attempt_count,
            recovery_count,
            max_attempts,

            input_hash,
            policy_hash,
            state_hash,
            chain_hash,

            state_payload,
            checkpoint_payload,
            recovery_payload,
            trace_payload,

            legal_certification
          )
          VALUES (
            $1, $2,
            $3, $4, $5,
            $6, $7,
            $8, $9, $10,
            $11,
            $12, $13, $14,
            $15, $16, $17,
            $18, $19, $20, $21,
            $22::jsonb,
            $23::jsonb,
            '{}'::jsonb,
            $24::jsonb,
            false
          )
          ON CONFLICT (
            COALESCE(tenant_id, ''),
            COALESCE(workspace_id, ''),
            idempotency_key
          )
          DO NOTHING
          RETURNING *
        `,
        toDatabaseParameters([
          input.operationId,
          input.idempotencyKey,

          input.tenantId ?? null,
          input.workspaceId ?? null,
          input.subscriptionId ?? null,

          input.humanIpr,
          input.runtimeIpr ??
            DEFAULT_RUNTIME_IPR,

          input.sessionId,
          input.threadId ?? null,
          input.requestId ?? null,

          input.workflowKind ??
            DEFAULT_WORKFLOW_KIND,

          initialState.operationStatus,
          initialState.checkpoint,
          initialState.recoveryStatus,

          initialState.attemptCount,
          initialState.recoveryCount,
          initialState.maxAttempts,

          input.inputHash ?? null,
          input.policyHash ?? null,
          initialState.stateHash,
          initialState.chainHash,

          {
            ...initialState,
            ...(input.statePayload ?? {}),
          },

          input.checkpointPayload ?? {},

          {
            ...(input.tracePayload ?? {}),
            createdAt:
              occurredAt,
            revision:
              HBCE_RUNTIME_OPERATION_RECOVERY_REVISION,
          },
        ]),
      );

    if (!result.ok) {
      return {
        ok: false,
        record: null,
        revision:
          HBCE_RUNTIME_OPERATION_RECOVERY_REVISION,
        error:
          result.error ??
          "RUNTIME_OPERATION_CREATE_FAILED",
      };
    }

    if (result.rowCount === 1) {
      return {
        ok: true,
        record:
          mapRuntimeOperationRow(
            result.rows[0] ?? {},
          ),
        revision:
          HBCE_RUNTIME_OPERATION_RECOVERY_REVISION,
        error: null,
      };
    }

    const existing =
      await findRuntimeOperationByIdempotencyKey({
        tenantId:
          input.tenantId ?? null,
        workspaceId:
          input.workspaceId ?? null,
        idempotencyKey:
          input.idempotencyKey,
      });

    if (!existing) {
      return {
        ok: false,
        record: null,
        revision:
          HBCE_RUNTIME_OPERATION_RECOVERY_REVISION,
        error:
          "IDEMPOTENT_OPERATION_EXISTS_BUT_COULD_NOT_BE_READ",
      };
    }

    return {
      ok: true,
      record: existing,
      revision:
        HBCE_RUNTIME_OPERATION_RECOVERY_REVISION,
      error: null,
    };
  } catch (error) {
    return {
      ok: false,
      record: null,
      revision:
        HBCE_RUNTIME_OPERATION_RECOVERY_REVISION,
      error:
        normalizeError(error),
    };
  }
}

export async function getRuntimeOperation(
  operationId: string,
): Promise<RuntimeOperationRecord | null> {
  requireNonBlank(
    operationId,
    "OPERATION_ID",
  );

  return readRuntimeOperation(
    operationId,
  );
}

export async function findRuntimeOperationByIdempotencyKey(
  input: {
    tenantId: string | null;
    workspaceId: string | null;
    idempotencyKey: string;
  },
): Promise<RuntimeOperationRecord | null> {
  requireNonBlank(
    input.idempotencyKey,
    "IDEMPOTENCY_KEY",
  );

  const result =
    await queryHbceDatabase<GenericRow>(
      `
        SELECT *
        FROM runtime_operations
        WHERE
          COALESCE(tenant_id, '') =
            COALESCE($1, '')
          AND
          COALESCE(workspace_id, '') =
            COALESCE($2, '')
          AND
          idempotency_key = $3
        LIMIT 1
      `,
      [
        input.tenantId,
        input.workspaceId,
        input.idempotencyKey,
      ],
    );

  if (!result.ok) {
    throw new Error(
      result.error ??
      "RUNTIME_OPERATION_IDEMPOTENCY_LOOKUP_FAILED",
    );
  }

  if (result.rowCount !== 1) {
    return null;
  }

  return mapRuntimeOperationRow(
    result.rows[0] ?? {},
  );
}

export async function transitionRuntimeOperation(
  input: {
    operationId: string;

    toStatus: RuntimeOperationStatus;
    toRecoveryStatus: RuntimeRecoveryStatus;
    toCheckpoint: RuntimeWorkflowCheckpoint;
    reason: RuntimeWorkflowTransitionReason;

    attemptCount?: number;
    recoveryCount?: number;

    leaseOwner?: string | null;
    leaseToken?: string | null;
    leaseExpiresAt?: string | null;
    heartbeatAt?: string | null;

    lastMemoryId?: string | null;
    lastEvtId?: string | null;
    lastOpcProofId?: string | null;
    lastAuditId?: string | null;
    lastUsageId?: string | null;

    interruptionReason?: string | null;
    failureReason?: string | null;
    completionReason?: string | null;

    checkpointPayload?: Record<string, unknown>;
    recoveryPayload?: Record<string, unknown>;
    tracePayload?: Record<string, unknown>;
  },
): Promise<RuntimeOperationMutationResult> {
  try {
    const record =
      await readRuntimeOperation(
        input.operationId,
      );

    if (!record) {
      return {
        ok: false,
        record: null,
        revision:
          HBCE_RUNTIME_OPERATION_RECOVERY_REVISION,
        error:
          "RUNTIME_OPERATION_NOT_FOUND",
      };
    }

    const occurredAt =
      new Date().toISOString();

    const transition =
      transitionRuntimeWorkflow(
        buildTransitionInput(
          record,
          {
            ...input,
            occurredAt,
          },
        ),
      );

    if (!transition.ok) {
      return {
        ok: false,
        record: null,
        revision:
          HBCE_RUNTIME_OPERATION_RECOVERY_REVISION,
        error:
          transition.error,
      };
    }

    const nextRecord =
      await persistTransition(
        record,
        transition.state,
        {
          checkpointPayload:
            input.checkpointPayload,

          recoveryPayload:
            input.recoveryPayload,

          tracePayload:
            input.tracePayload,

          startedAt:
            input.toStatus === "RUNNING"
              ? occurredAt
              : null,

          interruptedAt:
            input.toStatus ===
              "INTERRUPTED" ||
            input.toStatus ===
              "RECOVERY_REQUIRED"
              ? occurredAt
              : null,

          recoveryStartedAt:
            input.toStatus ===
              "RECOVERING"
              ? occurredAt
              : null,

          completedAt:
            input.toStatus ===
              "COMPLETED"
              ? occurredAt
              : null,

          failedAt:
            input.toStatus ===
              "FAILED"
              ? occurredAt
              : null,
        },
      );

    return {
      ok: true,
      record:
        nextRecord,
      revision:
        HBCE_RUNTIME_OPERATION_RECOVERY_REVISION,
      error: null,
    };
  } catch (error) {
    return {
      ok: false,
      record: null,
      revision:
        HBCE_RUNTIME_OPERATION_RECOVERY_REVISION,
      error:
        normalizeError(error),
    };
  }
}

export async function heartbeatRuntimeOperation(
  input: {
    operationId: string;
    leaseOwner: string;
    leaseToken: string;
    extendLeaseMs?: number;
    now?: string;
  },
): Promise<RuntimeOperationMutationResult> {
  try {
    requireNonBlank(
      input.operationId,
      "OPERATION_ID",
    );

    requireNonBlank(
      input.leaseOwner,
      "LEASE_OWNER",
    );

    requireNonBlank(
      input.leaseToken,
      "LEASE_TOKEN",
    );

    const now =
      input.now ??
      new Date().toISOString();

    requireIsoTimestamp(
      now,
      "HEARTBEAT_TIMESTAMP",
    );

    const extensionMs =
      input.extendLeaseMs ??
      DEFAULT_LEASE_DURATION_MS;

    const leaseExpiresAt =
      new Date(
        Date.parse(now) +
        extensionMs,
      ).toISOString();

    const result =
      await queryHbceDatabase<GenericRow>(
        `
          UPDATE runtime_operations
          SET
            heartbeat_at = $4::timestamptz,
            lease_expires_at = $5::timestamptz,
            recovery_payload =
              recovery_payload ||
              $6::jsonb
          WHERE
            operation_id = $1
            AND lease_owner = $2
            AND lease_token = $3
            AND lease_expires_at >
              $4::timestamptz
            AND operation_status =
              'RECOVERING'
          RETURNING *
        `,
        toDatabaseParameters([
          input.operationId,
          input.leaseOwner,
          input.leaseToken,
          now,
          leaseExpiresAt,
          {
            lastHeartbeatAt:
              now,
            leaseExtendedTo:
              leaseExpiresAt,
          },
        ]),
      );

    if (!result.ok) {
      return {
        ok: false,
        record: null,
        revision:
          HBCE_RUNTIME_OPERATION_RECOVERY_REVISION,
        error:
          result.error ??
          "RUNTIME_OPERATION_HEARTBEAT_FAILED",
      };
    }

    if (result.rowCount !== 1) {
      return {
        ok: false,
        record: null,
        revision:
          HBCE_RUNTIME_OPERATION_RECOVERY_REVISION,
        error:
          "HEARTBEAT_REJECTED_LEASE_NOT_OWNED_OR_EXPIRED",
      };
    }

    return {
      ok: true,
      record:
        mapRuntimeOperationRow(
          result.rows[0] ?? {},
        ),
      revision:
        HBCE_RUNTIME_OPERATION_RECOVERY_REVISION,
      error: null,
    };
  } catch (error) {
    return {
      ok: false,
      record: null,
      revision:
        HBCE_RUNTIME_OPERATION_RECOVERY_REVISION,
      error:
        normalizeError(error),
    };
  }
}

export async function markRuntimeOperationInterrupted(
  input: {
    operationId: string;
    interruptionReason: string;
    checkpointPayload?: Record<string, unknown>;
    tracePayload?: Record<string, unknown>;
  },
): Promise<RuntimeOperationMutationResult> {
  requireNonBlank(
    input.interruptionReason,
    "INTERRUPTION_REASON",
  );

  const record =
    await readRuntimeOperation(
      input.operationId,
    );

  if (!record) {
    return {
      ok: false,
      record: null,
      revision:
        HBCE_RUNTIME_OPERATION_RECOVERY_REVISION,
      error:
        "RUNTIME_OPERATION_NOT_FOUND",
    };
  }

  return transitionRuntimeOperation({
    operationId:
      input.operationId,

    toStatus:
      "INTERRUPTED",

    toRecoveryStatus:
      "REQUIRED",

    toCheckpoint:
      "INTERRUPTED",

    reason:
      "PROCESS_INTERRUPTED",

    interruptionReason:
      input.interruptionReason,

    checkpointPayload:
      input.checkpointPayload,

    tracePayload:
      input.tracePayload,

    leaseOwner: null,
    leaseToken: null,
    leaseExpiresAt: null,
    heartbeatAt:
      record.heartbeatAt,
  });
}

export async function markRuntimeOperationRecoveryRequired(
  input: {
    operationId: string;
    reason:
      "STALE_HEARTBEAT_DETECTED" |
      "LEASE_EXPIRED";
    interruptionReason: string;
    recoveryPayload?: Record<string, unknown>;
  },
): Promise<RuntimeOperationMutationResult> {
  requireNonBlank(
    input.interruptionReason,
    "INTERRUPTION_REASON",
  );

  return transitionRuntimeOperation({
    operationId:
      input.operationId,

    toStatus:
      "RECOVERY_REQUIRED",

    toRecoveryStatus:
      "REQUIRED",

    toCheckpoint:
      "RECOVERY_REQUIRED",

    reason:
      input.reason,

    interruptionReason:
      input.interruptionReason,

    recoveryPayload:
      input.recoveryPayload,

    leaseOwner: null,
    leaseToken: null,
    leaseExpiresAt: null,
  });
}

export async function acquireRuntimeOperationRecoveryLease(
  input: AcquireRecoveryLeaseInput,
): Promise<RuntimeOperationMutationResult> {
  try {
    requireNonBlank(
      input.operationId,
      "OPERATION_ID",
    );

    requireNonBlank(
      input.leaseOwner,
      "LEASE_OWNER",
    );

    const now =
      input.now ??
      new Date().toISOString();

    requireIsoTimestamp(
      now,
      "LEASE_TIMESTAMP",
    );

    const leaseDurationMs =
      input.leaseDurationMs ??
      DEFAULT_LEASE_DURATION_MS;

    const leaseToken =
      `HBCE-LEASE-${randomUUID()}`;

    const leaseExpiresAt =
      new Date(
        Date.parse(now) +
        leaseDurationMs,
      ).toISOString();

    const result =
      await queryHbceDatabase<GenericRow>(
        `
          UPDATE runtime_operations
          SET
            operation_status =
              'RECOVERING',
            recovery_status =
              'LEASE_ACQUIRED',
            checkpoint =
              'RECOVERING',

            lease_owner = $2,
            lease_token = $3,
            lease_acquired_at =
              $4::timestamptz,
            lease_expires_at =
              $5::timestamptz,
            heartbeat_at =
              $4::timestamptz,

            recovery_count =
              recovery_count + 1,

            recovery_started_at =
              COALESCE(
                recovery_started_at,
                $4::timestamptz
              ),

            recovery_payload =
              recovery_payload ||
              $6::jsonb

          WHERE
            operation_id = $1
            AND operation_status IN (
              'INTERRUPTED',
              'RECOVERY_REQUIRED',
              'RECOVERING'
            )
            AND (
              lease_token IS NULL
              OR lease_expires_at IS NULL
              OR lease_expires_at <=
                $4::timestamptz
            )
            AND attempt_count <
              max_attempts

          RETURNING *
        `,
        toDatabaseParameters([
          input.operationId,
          input.leaseOwner,
          leaseToken,
          now,
          leaseExpiresAt,
          {
            leaseOwner:
              input.leaseOwner,
            leaseToken,
            leaseAcquiredAt:
              now,
            leaseExpiresAt,
            revision:
              HBCE_RUNTIME_OPERATION_RECOVERY_REVISION,
          },
        ]),
      );

    if (!result.ok) {
      return {
        ok: false,
        record: null,
        revision:
          HBCE_RUNTIME_OPERATION_RECOVERY_REVISION,
        error:
          result.error ??
          "RECOVERY_LEASE_ACQUIRE_FAILED",
      };
    }

    if (result.rowCount !== 1) {
      return {
        ok: false,
        record: null,
        revision:
          HBCE_RUNTIME_OPERATION_RECOVERY_REVISION,
        error:
          "RECOVERY_LEASE_NOT_ACQUIRED",
      };
    }

    const record =
      mapRuntimeOperationRow(
        result.rows[0] ?? {},
      );

    const transition =
      transitionRuntimeWorkflow(
        buildTransitionInput(
          {
            ...record,
            operationStatus:
              "RECOVERY_REQUIRED",
            recoveryStatus:
              "REQUIRED",
            checkpoint:
              "RECOVERY_REQUIRED",
            recoveryCount:
              Math.max(
                0,
                record.recoveryCount - 1,
              ),
            leaseOwner: null,
            leaseToken: null,
            leaseExpiresAt: null,
          },
          {
            toStatus:
              "RECOVERING",

            toRecoveryStatus:
              "LEASE_ACQUIRED",

            toCheckpoint:
              "RECOVERING",

            reason:
              "RECOVERY_LEASE_ACQUIRED",

            recoveryCount:
              record.recoveryCount,

            leaseOwner:
              record.leaseOwner,

            leaseToken:
              record.leaseToken,

            leaseExpiresAt:
              record.leaseExpiresAt,

            heartbeatAt:
              record.heartbeatAt,
          },
        ),
      );

    if (!transition.ok) {
      await releaseRuntimeOperationRecoveryLease({
        operationId:
          input.operationId,
        leaseOwner:
          input.leaseOwner,
        leaseToken,
      });

      return {
        ok: false,
        record: null,
        revision:
          HBCE_RUNTIME_OPERATION_RECOVERY_REVISION,
        error:
          transition.error,
      };
    }

    const statePersisted =
      await queryHbceDatabase<GenericRow>(
        `
          UPDATE runtime_operations
          SET
            state_hash = $4,
            chain_hash = $5,
            state_payload = $6::jsonb
          WHERE
            operation_id = $1
            AND lease_owner = $2
            AND lease_token = $3
          RETURNING *
        `,
        toDatabaseParameters([
          input.operationId,
          input.leaseOwner,
          leaseToken,
          transition.state.stateHash,
          transition.state.chainHash,
          transition.state,
        ]),
      );

    if (
      !statePersisted.ok ||
      statePersisted.rowCount !== 1
    ) {
      return {
        ok: false,
        record: null,
        revision:
          HBCE_RUNTIME_OPERATION_RECOVERY_REVISION,
        error:
          statePersisted.error ??
          "RECOVERY_LEASE_STATE_HASH_PERSIST_FAILED",
      };
    }

    return {
      ok: true,
      record:
        mapRuntimeOperationRow(
          statePersisted.rows[0] ?? {},
        ),
      revision:
        HBCE_RUNTIME_OPERATION_RECOVERY_REVISION,
      error: null,
    };
  } catch (error) {
    return {
      ok: false,
      record: null,
      revision:
        HBCE_RUNTIME_OPERATION_RECOVERY_REVISION,
      error:
        normalizeError(error),
    };
  }
}

export async function releaseRuntimeOperationRecoveryLease(
  input: {
    operationId: string;
    leaseOwner: string;
    leaseToken: string;
  },
): Promise<RuntimeOperationMutationResult> {
  try {
    const result =
      await queryHbceDatabase<GenericRow>(
        `
          UPDATE runtime_operations
          SET
            lease_owner = NULL,
            lease_token = NULL,
            lease_acquired_at = NULL,
            lease_expires_at = NULL,
            heartbeat_at = NULL,
            recovery_payload =
              recovery_payload ||
              $4::jsonb
          WHERE
            operation_id = $1
            AND lease_owner = $2
            AND lease_token = $3
          RETURNING *
        `,
        toDatabaseParameters([
          input.operationId,
          input.leaseOwner,
          input.leaseToken,
          {
            leaseReleasedAt:
              new Date().toISOString(),
          },
        ]),
      );

    if (!result.ok) {
      return {
        ok: false,
        record: null,
        revision:
          HBCE_RUNTIME_OPERATION_RECOVERY_REVISION,
        error:
          result.error ??
          "RECOVERY_LEASE_RELEASE_FAILED",
      };
    }

    if (result.rowCount !== 1) {
      return {
        ok: false,
        record: null,
        revision:
          HBCE_RUNTIME_OPERATION_RECOVERY_REVISION,
        error:
          "RECOVERY_LEASE_RELEASE_REJECTED",
      };
    }

    return {
      ok: true,
      record:
        mapRuntimeOperationRow(
          result.rows[0] ?? {},
        ),
      revision:
        HBCE_RUNTIME_OPERATION_RECOVERY_REVISION,
      error: null,
    };
  } catch (error) {
    return {
      ok: false,
      record: null,
      revision:
        HBCE_RUNTIME_OPERATION_RECOVERY_REVISION,
      error:
        normalizeError(error),
    };
  }
}

export async function scanRuntimeOperationsForRecovery(
  input: {
    limit?: number;
    now?: string;
    staleAfterMs?: number;
  } = {},
): Promise<RuntimeOperationRecord[]> {
  const now =
    input.now ??
    new Date().toISOString();

  requireIsoTimestamp(
    now,
    "RECOVERY_SCAN_TIMESTAMP",
  );

  const staleAfterMs =
    input.staleAfterMs ??
    DEFAULT_STALE_AFTER_MS;

  const staleBefore =
    new Date(
      Date.parse(now) -
      staleAfterMs,
    ).toISOString();

  const limit =
    Math.min(
      Math.max(
        input.limit ?? 50,
        1,
      ),
      500,
    );

  const result =
    await queryHbceDatabase<GenericRow>(
      `
        SELECT *
        FROM runtime_operations
        WHERE
          operation_status IN (
            'RUNNING',
            'INTERRUPTED',
            'RECOVERY_REQUIRED',
            'RECOVERING'
          )
          AND attempt_count <
            max_attempts
          AND (
            operation_status IN (
              'INTERRUPTED',
              'RECOVERY_REQUIRED'
            )
            OR heartbeat_at IS NULL
            OR heartbeat_at <=
              $1::timestamptz
            OR lease_expires_at <=
              $2::timestamptz
          )
        ORDER BY updated_at ASC
        LIMIT $3
      `,
      [
        staleBefore,
        now,
        limit,
      ],
    );

  if (!result.ok) {
    throw new Error(
      result.error ??
      "RUNTIME_OPERATION_RECOVERY_SCAN_FAILED",
    );
  }

  return result.rows
    .map(mapRuntimeOperationRow)
    .filter((record) => {
      const decision =
        shouldRuntimeWorkflowRecover({
          operationStatus:
            record.operationStatus,

          recoveryStatus:
            record.recoveryStatus,

          heartbeatAt:
            record.heartbeatAt,

          leaseExpiresAt:
            record.leaseExpiresAt,

          now,

          staleAfterMs,
        });

      return decision.recover;
    });
}

export async function inspectRuntimeOperationRecoveryNeed(
  input: {
    operationId: string;
    now?: string;
    staleAfterMs?: number;
  },
): Promise<{
  recover: boolean;
  reason: string | null;
  record: RuntimeOperationRecord | null;
}> {
  const record =
    await readRuntimeOperation(
      input.operationId,
    );

  if (!record) {
    return {
      recover: false,
      reason:
        "RUNTIME_OPERATION_NOT_FOUND",
      record: null,
    };
  }

  const decision =
    shouldRuntimeWorkflowRecover({
      operationStatus:
        record.operationStatus,

      recoveryStatus:
        record.recoveryStatus,

      heartbeatAt:
        record.heartbeatAt,

      leaseExpiresAt:
        record.leaseExpiresAt,

      now:
        input.now,

      staleAfterMs:
        input.staleAfterMs ??
        DEFAULT_STALE_AFTER_MS,
    });

  return {
    ...decision,
    record,
  };
}

export async function deleteRuntimeOperationForSelfTest(
  operationId: string,
): Promise<boolean> {
  const result =
    await queryHbceDatabase<GenericRow>(
      `
        DELETE FROM runtime_operations
        WHERE operation_id = $1
        RETURNING operation_id
      `,
      [operationId],
    );

  if (!result.ok) {
    throw new Error(
      result.error ??
      "RUNTIME_OPERATION_DELETE_FAILED",
    );
  }

  return result.rowCount === 1;
}
