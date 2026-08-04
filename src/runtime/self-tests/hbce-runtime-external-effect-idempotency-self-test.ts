import { createHash, randomUUID } from "node:crypto";

import {
  HBCE_RUNTIME_EFFECT_TYPE,
  HBCE_RUNTIME_EFFECT_VERSION,
  HBCE_RUNTIME_RECEIPT_TYPE,
  type RuntimeCanonicalEffectPayload,
  type RuntimeEffectReconciliationResult,
  type RuntimeOperationEffect,
  type RuntimeOpcReceipt,
  type RuntimeOutboxRecord,
} from "../types/runtime-external-effect";

/**
 * HBCE Runtime Level 9
 *
 * Artifact:
 * HBCE-RUNTIME-EXTERNAL-EFFECT-IDEMPOTENCY-SELF-TEST-v1_0
 *
 * This module orchestrates the Level 9 runtime test through an injected
 * persistent adapter. It performs no real model call and no real process kill.
 *
 * Boundary:
 * legalCertification=false
 * technicalRuntimeTestOnly=true
 * failClosed=true
 * noRawText=true
 */

export const HBCE_RUNTIME_LEVEL_9_REVISION =
  "HBCE-RUNTIME-EXTERNAL-EFFECT-IDEMPOTENCY-SELF-TEST-v1_0" as const;

export const HBCE_RUNTIME_LEVEL_9_PASS_STATUS =
  "HBCE_RUNTIME_EXTERNAL_EFFECT_IDEMPOTENCY_PASS" as const;

export const HBCE_RUNTIME_LEVEL_9_FAIL_STATUS =
  "HBCE_RUNTIME_EXTERNAL_EFFECT_IDEMPOTENCY_FAIL" as const;

export const HBCE_RUNTIME_LEVEL_9_EVENT_TYPE =
  "HBCE_RUNTIME_TEST_EFFECT_COMMITTED" as const;

export type RuntimeLevel9CheckStatus = "PASS" | "FAIL" | "SKIPPED";

export type RuntimeLevel9OperationStatus =
  | "NEW"
  | "AUTHORIZED"
  | "RUNNING"
  | "MODEL_COMPLETED"
  | "LEDGER_PENDING"
  | "INTERRUPTED"
  | "RECOVERY_REQUIRED"
  | "RECOVERING"
  | "LEDGER_COMPLETED"
  | "OPC_PENDING"
  | "OPC_COMPLETED"
  | "COMPLETED";

export type RuntimeLevel9Checkpoint = RuntimeLevel9OperationStatus;

export type RuntimeLevel9RecoveryStatus =
  | "NOT_REQUIRED"
  | "REQUIRED"
  | "LEASE_ACQUIRED"
  | "RECOVERED";

export interface RuntimeLevel9OperationRecord {
  operationId: string;
  idempotencyKey: string;
  operationStatus: RuntimeLevel9OperationStatus;
  checkpoint: RuntimeLevel9Checkpoint;
  recoveryStatus: RuntimeLevel9RecoveryStatus;
  attemptCount: number;
  recoveryCount: number;
  maxAttempts: number;
  leaseOwner: string | null;
  leaseTokenPresent: boolean;
  stateHash: string;
  chainHash: string;
  interruptionReason: string | null;
  completionReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
  legalCertification: false;
}

export interface RuntimeLevel9Configuration {
  configured: boolean;
  persistentSession: boolean;
  supportsTransactions: boolean;
  runtimeOperationsTable: boolean;
  runtimeEffectsTable: boolean;
  runtimeOutboxTable: boolean;
  runtimeOpcTable: boolean;
  operationEffectUniqueConstraint: boolean;
  idempotencyEffectUniqueConstraint: boolean;
  operationEventUniqueConstraint: boolean;
  operationReceiptUniqueConstraint: boolean;
  recoveryHelper: boolean;
  reconciliationHelper: boolean;
}

export interface RuntimeLevel9RecoveryDecision {
  recover: boolean;
  reason: "STALE_HEARTBEAT" | "INTERRUPTED_OPERATION" | string;
  record: RuntimeLevel9OperationRecord;
}

export interface RuntimeLevel9LeaseAttempt {
  acquired: boolean;
  error: string | null;
  record: RuntimeLevel9OperationRecord | null;
}

export interface RuntimeLevel9PersistentCounts {
  operationCount: number;
  effectCount: number;
  outboxCount: number;
  opcCount: number;
}

export interface RuntimeLevel9CleanupResult {
  remainingOperation: RuntimeLevel9OperationRecord | null;
  remainingEffect: RuntimeOperationEffect | null;
  remainingOutbox: RuntimeOutboxRecord | null;
  remainingOpc: RuntimeOpcReceipt | null;
}

/**
 * The production adapter must bind these operations to Neon/PostgreSQL and to
 * the existing Level 8 durable workflow implementation.
 *
 * createEffectAndOutboxAtomic MUST execute effect and outbox inserts inside
 * one BEGIN/COMMIT transaction and MUST rollback both writes on failure.
 */
export interface RuntimeLevel9Adapter {
  getConfiguration(): Promise<RuntimeLevel9Configuration>;

  createDurableOperation(input: {
    operationId: string;
    idempotencyKey: string;
    maxAttempts: number;
    legalCertification: false;
  }): Promise<RuntimeLevel9OperationRecord>;

  getOrCreateCanonicalOperation(input: {
    requestedOperationId: string;
    idempotencyKey: string;
    maxAttempts: number;
    legalCertification: false;
  }): Promise<RuntimeLevel9OperationRecord>;

  findOperation(
    operationId: string,
  ): Promise<RuntimeLevel9OperationRecord | null>;

  transitionOperation(input: {
    operationId: string;
    operationStatus: RuntimeLevel9OperationStatus;
    checkpoint: RuntimeLevel9Checkpoint;
    recoveryStatus?: RuntimeLevel9RecoveryStatus;
    interruptionReason?: string | null;
    completionReason?: string | null;
    incrementAttempt?: boolean;
    completedAt?: Date | null;
  }): Promise<RuntimeLevel9OperationRecord>;

  createEffectAndOutboxAtomic(input: {
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
  }>;

  findEffect(
    operationId: string,
    effectType: string,
  ): Promise<RuntimeOperationEffect | null>;

  findOutbox(
    operationId: string,
    eventType: string,
  ): Promise<RuntimeOutboxRecord | null>;

  countPersistentRecords(
    operationId: string,
  ): Promise<RuntimeLevel9PersistentCounts>;

  detectRecoveryNeed(
    operationId: string,
  ): Promise<RuntimeLevel9RecoveryDecision>;

  markRecoveryRequired(input: {
    operationId: string;
    reason: string;
  }): Promise<RuntimeLevel9OperationRecord>;

  acquireRecoveryLease(input: {
    operationId: string;
    workerId: string;
  }): Promise<RuntimeLevel9LeaseAttempt>;

  releaseRecoveryLease(input: {
    operationId: string;
    workerId: string;
  }): Promise<RuntimeLevel9OperationRecord>;

  reconcileExistingEffect(input: {
    operationId: string;
    idempotencyKey: string;
    effectType: string;
    eventType: string;
  }): Promise<RuntimeEffectReconciliationResult>;

  attemptDuplicateEffectInsert(input: {
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
  }>;

  createOrGetOpcReceipt(input: {
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
  }>;

  cleanupTemporaryRecords(
    operationId: string,
  ): Promise<RuntimeLevel9CleanupResult>;
}

export interface RuntimeLevel9Deployment {
  origin: string;
  runtimeEnvironment: string;
  vercelEnvironment: string;
  vercelRegion: string;
  nodeVersion: string;
}

export interface RuntimeLevel9Check {
  id: string;
  label: string;
  required: true;
  status: RuntimeLevel9CheckStatus;
  durationMs: number;
  details: unknown;
  error: string | null;
}

export interface RuntimeLevel9Result {
  ok: boolean;
  status:
    | typeof HBCE_RUNTIME_LEVEL_9_PASS_STATUS
    | typeof HBCE_RUNTIME_LEVEL_9_FAIL_STATUS;
  operationalStatus: "PASS" | "FAIL";
  revision: typeof HBCE_RUNTIME_LEVEL_9_REVISION;
  generatedAt: string;
  product: "HBCE IPR Operational Identity & Proof Layer";
  apiVersion: "v1";
  runtime: "AI_JOKER_C2_SAAS_CORE_v0_1";
  deployment: RuntimeLevel9Deployment;
  execution: {
    mode: "PERSISTENT_EXTERNAL_EFFECT_IDEMPOTENCY_AND_TRANSACTIONAL_OUTBOX_RECONCILIATION";
    operationId: string;
    idempotencyKey: string;
    originalWorker: string;
    recoveryWorker: string;
    competingWorker: string;
    crashPoint: "AFTER_EXTERNAL_EFFECT_AND_OUTBOX_COMMIT_BEFORE_WORKFLOW_CHECKPOINT_UPDATE";
    recoveryStrategy: "EXCLUSIVE_LEASE_EFFECT_RECONCILIATION_AND_WORKFLOW_RESUMPTION";
    firstFailure: string | null;
  };
  summary: {
    totalChecks: 16;
    passedChecks: number;
    failedChecks: number;
    skippedChecks: number;
    requiredChecks: 16;
    requiredPassed: number;
    requiredFailed: number;
    durationMs: number;
  };
  checks: RuntimeLevel9Check[];
  interpretation: {
    durableOperationCreated: boolean;
    idempotencyReplayResolved: boolean;
    persistentExternalEffectCreated: boolean;
    transactionalOutboxCreated: boolean;
    controlledCrashPersistedAfterEffectCommit: boolean;
    recoveryNeedDetected: boolean;
    exclusiveRecoveryLeaseAcquired: boolean;
    competingWorkerRejected: boolean;
    existingEffectReconciled: boolean;
    duplicateEffectRejected: boolean;
    workflowResumedWithoutDuplicateEffect: boolean;
    opcClosureGenerated: boolean;
    completedReplayResolvedWithoutNewEffects: boolean;
    cleanupCompleted: boolean;
    externalEffectIdempotencyPassed: boolean;
  };
  boundary: {
    legalCertification: false;
    technicalRuntimeTestOnly: true;
    uneBdoOpening: true;
    space: "HBCE_PRODUCTION_RUNTIME";
    time: string;
    usesDurableOperationRegistry: true;
    usesDurableStateMachine: true;
    usesCheckpointPersistence: true;
    usesExclusiveRecoveryLease: true;
    usesHeartbeat: true;
    rejectsCompetingRecoveryWorker: true;
    idempotencyRequired: true;
    usesPersistentExternalEffect: true;
    usesUniqueEffectConstraint: true;
    usesTransactionalOutbox: true;
    usesRecoveryReconciliation: true;
    performsControlledCrashInjection: true;
    performsRealProcessTermination: false;
    performsRealModelCall: false;
    createsTemporaryPersistentTestData: true;
    testRecordRetained: false;
    opcGeneratedAtClosure: true;
    replacesDisasterRecoveryTesting: false;
    replacesMultiRegionFailoverTesting: false;
    replacesHumanReview: false;
    externalDeliverySemantics: "AT_LEAST_ONCE_DELIVERY_WITH_IDEMPOTENT_CONSUMER_REQUIREMENT";
    note: string;
  };
}

export interface RuntimeLevel9SelfTestOptions {
  deployment?: Partial<RuntimeLevel9Deployment>;
  now?: () => Date;
}

function sha256(value: string): string {
  return `sha256:${createHash("sha256").update(value, "utf8").digest("hex")}`;
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
    .map((key) => `${JSON.stringify(key)}:${canonicalize(record[key])}`)
    .join(",")}}`;
}

function assertCondition(
  condition: unknown,
  message: string,
): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function normalizeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function createCheck(
  id: string,
  label: string,
): RuntimeLevel9Check {
  return {
    id,
    label,
    required: true,
    status: "SKIPPED",
    durationMs: 0,
    details: null,
    error: null,
  };
}

async function executeCheck(
  check: RuntimeLevel9Check,
  action: () => Promise<unknown>,
): Promise<void> {
  const startedAt = Date.now();

  try {
    check.details = await action();
    check.status = "PASS";
  } catch (error) {
    check.status = "FAIL";
    check.error = normalizeError(error);
  } finally {
    check.durationMs = Date.now() - startedAt;
  }
}

function assertPreviousChecksPassed(
  checks: RuntimeLevel9Check[],
): void {
  const failed = checks.find((check) => check.status === "FAIL");

  if (failed) {
    throw new Error(
      `FAIL_CLOSED_PREVIOUS_CHECK_FAILED:${failed.id}:${failed.error ?? "UNKNOWN"}`,
    );
  }
}

export async function runHbceRuntimeLevel9SelfTest(
  adapter: RuntimeLevel9Adapter,
  options: RuntimeLevel9SelfTestOptions = {},
): Promise<RuntimeLevel9Result> {
  const startedAt = Date.now();
  const now = options.now ?? (() => new Date());
  const generatedAt = now();

  const suffix = `${generatedAt
    .toISOString()
    .replace(/\D/g, "")
    .slice(0, 14)}-${randomUUID().slice(0, 8)}`;

  const operationId = `HBCE-L9-${suffix}`;
  const replayOperationId = `HBCE-L9-REPLAY-${suffix}`;
  const idempotencyKey = `HBCE-L9-IDEMPOTENCY-${suffix}`;

  const originalWorker = `HBCE-L9-WORKER-A-${suffix}`;
  const recoveryWorker = `HBCE-L9-WORKER-B-${suffix}`;
  const competingWorker = `HBCE-L9-WORKER-C-${suffix}`;

  const checks: RuntimeLevel9Check[] = [
    createCheck("RUNTIME_CONFIGURATION", "Runtime configuration"),
    createCheck("DURABLE_OPERATION_CREATE", "Create durable operation"),
    createCheck(
      "DURABLE_IDEMPOTENCY_REPLAY",
      "Replay durable operation creation",
    ),
    createCheck(
      "PRE_EFFECT_WORKFLOW_ADVANCE",
      "Advance workflow to ledger pending",
    ),
    createCheck(
      "PERSISTENT_EFFECT_WRITE",
      "Persist effect and transactional outbox",
    ),
    createCheck(
      "CONTROLLED_CRASH_AFTER_EFFECT_COMMIT",
      "Persist controlled interruption after effect commit",
    ),
    createCheck(
      "RECOVERY_NEED_DETECTION",
      "Detect interrupted recoverable workflow",
    ),
    createCheck(
      "RECOVERY_LEASE_ACQUIRE",
      "Acquire exclusive recovery lease",
    ),
    createCheck(
      "RECOVERY_DOUBLE_LEASE_GUARD",
      "Reject competing recovery worker",
    ),
    createCheck(
      "RECOVERY_RECONCILIATION",
      "Reconcile existing persistent effect",
    ),
    createCheck(
      "UNIQUE_CONSTRAINT_GUARD",
      "Reject duplicate persistent effect",
    ),
    createCheck(
      "WORKFLOW_RESUMPTION",
      "Resume workflow without duplicate effect",
    ),
    createCheck(
      "OPC_CLOSURE_RECEIPT",
      "Generate unique technical OPC receipt",
    ),
    createCheck(
      "COMPLETED_REPLAY_GUARD",
      "Resolve completed replay without new effects",
    ),
    createCheck(
      "FINAL_STATE_VERIFY",
      "Verify final Level 9 state",
    ),
    createCheck(
      "CLEANUP",
      "Remove temporary Level 9 records",
    ),
  ];

  let canonicalOperation: RuntimeLevel9OperationRecord | null = null;
  let effect: RuntimeOperationEffect | null = null;
  let outbox: RuntimeOutboxRecord | null = null;
  let opcReceipt: RuntimeOpcReceipt | null = null;
  let reconciliation: RuntimeEffectReconciliationResult | null = null;
  let firstFailure: string | null = null;

  const payload: RuntimeCanonicalEffectPayload = {
    operationId,
    effectType: HBCE_RUNTIME_EFFECT_TYPE,
    effectVersion: HBCE_RUNTIME_EFFECT_VERSION,
    result: "TECHNICAL_TEST_EFFECT",
    legalCertification: false,
  };

  const payloadHash = sha256(canonicalize(payload));

  const effectHash = sha256(
    canonicalize({
      operationId,
      effectType: HBCE_RUNTIME_EFFECT_TYPE,
      payloadHash,
      legalCertification: false,
    }),
  );

  const initialChainHash = sha256(
    canonicalize({
      previousChainHash: "GENESIS",
      operationId,
      effectHash,
    }),
  );

  await executeCheck(checks[0], async () => {
    const configuration = await adapter.getConfiguration();

    assertCondition(configuration.configured, "RUNTIME_NOT_CONFIGURED");
    assertCondition(
      configuration.persistentSession,
      "PERSISTENT_SESSION_NOT_AVAILABLE",
    );
    assertCondition(
      configuration.supportsTransactions,
      "BEGIN_COMMIT_ROLLBACK_NOT_AVAILABLE",
    );
    assertCondition(
      configuration.runtimeOperationsTable,
      "RUNTIME_OPERATIONS_TABLE_MISSING",
    );
    assertCondition(
      configuration.runtimeEffectsTable,
      "RUNTIME_EFFECTS_TABLE_MISSING",
    );
    assertCondition(
      configuration.runtimeOutboxTable,
      "RUNTIME_OUTBOX_TABLE_MISSING",
    );
    assertCondition(
      configuration.runtimeOpcTable,
      "RUNTIME_OPC_TABLE_MISSING",
    );
    assertCondition(
      configuration.operationEffectUniqueConstraint,
      "OPERATION_EFFECT_UNIQUE_CONSTRAINT_MISSING",
    );
    assertCondition(
      configuration.idempotencyEffectUniqueConstraint,
      "IDEMPOTENCY_EFFECT_UNIQUE_CONSTRAINT_MISSING",
    );
    assertCondition(
      configuration.operationEventUniqueConstraint,
      "OPERATION_EVENT_UNIQUE_CONSTRAINT_MISSING",
    );
    assertCondition(
      configuration.operationReceiptUniqueConstraint,
      "OPERATION_RECEIPT_UNIQUE_CONSTRAINT_MISSING",
    );
    assertCondition(
      configuration.recoveryHelper,
      "RECOVERY_HELPER_MISSING",
    );
    assertCondition(
      configuration.reconciliationHelper,
      "RECONCILIATION_HELPER_MISSING",
    );

    return configuration;
  });

  await executeCheck(checks[1], async () => {
    assertPreviousChecksPassed(checks.slice(0, 1));

    canonicalOperation = await adapter.createDurableOperation({
      operationId,
      idempotencyKey,
      maxAttempts: 3,
      legalCertification: false,
    });

    assertCondition(
      canonicalOperation.operationId === operationId,
      "OPERATION_ID_MISMATCH",
    );
    assertCondition(
      canonicalOperation.operationStatus === "NEW",
      "INITIAL_OPERATION_STATUS_INVALID",
    );
    assertCondition(
      canonicalOperation.checkpoint === "NEW",
      "INITIAL_CHECKPOINT_INVALID",
    );
    assertCondition(
      canonicalOperation.maxAttempts === 3,
      "MAX_ATTEMPTS_INVALID",
    );
    assertCondition(
      canonicalOperation.legalCertification === false,
      "LEGAL_CERTIFICATION_BOUNDARY_VIOLATED",
    );

    return canonicalOperation;
  });

  await executeCheck(checks[2], async () => {
    assertPreviousChecksPassed(checks.slice(0, 2));

    const replay = await adapter.getOrCreateCanonicalOperation({
      requestedOperationId: replayOperationId,
      idempotencyKey,
      maxAttempts: 3,
      legalCertification: false,
    });

    const sameCanonicalOperation = replay.operationId === operationId;

    assertCondition(
      sameCanonicalOperation,
      "IDEMPOTENCY_REPLAY_CREATED_SECOND_OPERATION",
    );

    return {
      requestedReplayOperationId: replayOperationId,
      canonicalOperationId: replay.operationId,
      sameCanonicalOperation,
    };
  });

  await executeCheck(checks[3], async () => {
    assertPreviousChecksPassed(checks.slice(0, 3));

    const authorized = await adapter.transitionOperation({
      operationId,
      operationStatus: "AUTHORIZED",
      checkpoint: "AUTHORIZED",
    });

    const running = await adapter.transitionOperation({
      operationId,
      operationStatus: "RUNNING",
      checkpoint: "RUNNING",
      incrementAttempt: true,
    });

    const modelCompleted = await adapter.transitionOperation({
      operationId,
      operationStatus: "MODEL_COMPLETED",
      checkpoint: "MODEL_COMPLETED",
    });

    const ledgerPending = await adapter.transitionOperation({
      operationId,
      operationStatus: "LEDGER_PENDING",
      checkpoint: "LEDGER_PENDING",
    });

    assertCondition(
      running.attemptCount === 1,
      "INITIAL_ATTEMPT_COUNT_INVALID",
    );
    assertCondition(
      ledgerPending.checkpoint === "LEDGER_PENDING",
      "LEDGER_PENDING_CHECKPOINT_NOT_PERSISTED",
    );

    return {
      authorized,
      running,
      modelCompleted,
      ledgerPending,
      realModelCallPerformed: false,
    };
  });

  await executeCheck(checks[4], async () => {
    assertPreviousChecksPassed(checks.slice(0, 4));

    const result = await adapter.createEffectAndOutboxAtomic({
      operationId,
      idempotencyKey,
      effectType: HBCE_RUNTIME_EFFECT_TYPE,
      effectStatus: "COMMITTED",
      eventType: HBCE_RUNTIME_LEVEL_9_EVENT_TYPE,
      payloadHash,
      effectHash,
      chainHash: initialChainHash,
      legalCertification: false,
    });

    effect = result.effect;
    outbox = result.outbox;

    const counts = await adapter.countPersistentRecords(operationId);

    assertCondition(counts.effectCount === 1, "EFFECT_COUNT_NOT_ONE");
    assertCondition(counts.outboxCount === 1, "OUTBOX_COUNT_NOT_ONE");
    assertCondition(
      effect.payloadHash === payloadHash,
      "EFFECT_PAYLOAD_HASH_MISMATCH",
    );
    assertCondition(
      outbox.payloadHash === payloadHash,
      "OUTBOX_PAYLOAD_HASH_MISMATCH",
    );

    return {
      effect,
      outbox,
      effectCount: counts.effectCount,
      outboxCount: counts.outboxCount,
      transactionCommitted: true,
    };
  });

  await executeCheck(checks[5], async () => {
    assertPreviousChecksPassed(checks.slice(0, 5));

    const interrupted = await adapter.transitionOperation({
      operationId,
      operationStatus: "INTERRUPTED",
      checkpoint: "INTERRUPTED",
      recoveryStatus: "REQUIRED",
      interruptionReason:
        "HBCE_CONTROLLED_CRASH_AFTER_EXTERNAL_EFFECT_COMMIT",
    });

    assertCondition(
      interrupted.operationStatus === "INTERRUPTED",
      "CONTROLLED_INTERRUPTION_NOT_PERSISTED",
    );
    assertCondition(
      interrupted.recoveryStatus === "REQUIRED",
      "RECOVERY_NOT_MARKED_REQUIRED",
    );

    return {
      crashPoint:
        "AFTER_EXTERNAL_EFFECT_AND_OUTBOX_COMMIT_BEFORE_WORKFLOW_CHECKPOINT_UPDATE",
      record: interrupted,
      realProcessTermination: false,
    };
  });

  await executeCheck(checks[6], async () => {
    assertPreviousChecksPassed(checks.slice(0, 6));

    const decision = await adapter.detectRecoveryNeed(operationId);

    assertCondition(decision.recover, "RECOVERY_NEED_NOT_DETECTED");
    assertCondition(
      decision.reason === "STALE_HEARTBEAT" ||
        decision.reason === "INTERRUPTED_OPERATION",
      "RECOVERY_REASON_INVALID",
    );

    await adapter.markRecoveryRequired({
      operationId,
      reason: "ORIGINAL_WORKER_UNAVAILABLE_AFTER_CONTROLLED_CRASH",
    });

    return decision;
  });

  await executeCheck(checks[7], async () => {
    assertPreviousChecksPassed(checks.slice(0, 7));

    const lease = await adapter.acquireRecoveryLease({
      operationId,
      workerId: recoveryWorker,
    });

    assertCondition(lease.acquired, "RECOVERY_LEASE_NOT_ACQUIRED");
    assertCondition(
      lease.record?.leaseOwner === recoveryWorker,
      "RECOVERY_LEASE_OWNER_INVALID",
    );
    assertCondition(
      lease.record?.recoveryCount === 1,
      "RECOVERY_COUNT_INVALID",
    );

    return {
      recoveryWorker,
      record: lease.record,
    };
  });

  await executeCheck(checks[8], async () => {
    assertPreviousChecksPassed(checks.slice(0, 8));

    const competingLease = await adapter.acquireRecoveryLease({
      operationId,
      workerId: competingWorker,
    });

    assertCondition(
      competingLease.acquired === false,
      "COMPETING_RECOVERY_WORKER_ACCEPTED",
    );
    assertCondition(
      competingLease.error === "RECOVERY_LEASE_NOT_ACQUIRED",
      "COMPETING_RECOVERY_ERROR_INVALID",
    );

    return {
      activeWorker: recoveryWorker,
      competingWorker,
      competingLeaseAccepted: competingLease.acquired,
      competingError: competingLease.error,
    };
  });

  await executeCheck(checks[9], async () => {
    assertPreviousChecksPassed(checks.slice(0, 9));

    reconciliation = await adapter.reconcileExistingEffect({
      operationId,
      idempotencyKey,
      effectType: HBCE_RUNTIME_EFFECT_TYPE,
      eventType: HBCE_RUNTIME_LEVEL_9_EVENT_TYPE,
    });

    assertCondition(
      reconciliation.existingEffectFound,
      "EXISTING_EFFECT_NOT_FOUND",
    );
    assertCondition(
      reconciliation.existingEffectValid,
      "EXISTING_EFFECT_INVALID",
    );
    assertCondition(
      reconciliation.existingOutboxFound,
      "EXISTING_OUTBOX_NOT_FOUND",
    );
    assertCondition(
      reconciliation.effectReused,
      "EXISTING_EFFECT_NOT_REUSED",
    );
    assertCondition(
      reconciliation.newEffectCreated === false,
      "RECOVERY_CREATED_NEW_EFFECT",
    );
    assertCondition(
      reconciliation.effectCountBeforeRecovery === 1 &&
        reconciliation.effectCountAfterRecovery === 1,
      "EFFECT_COUNT_CHANGED_DURING_RECONCILIATION",
    );
    assertCondition(
      reconciliation.outboxCountBeforeRecovery === 1 &&
        reconciliation.outboxCountAfterRecovery === 1,
      "OUTBOX_COUNT_CHANGED_DURING_RECONCILIATION",
    );

    return reconciliation;
  });

  await executeCheck(checks[10], async () => {
    assertPreviousChecksPassed(checks.slice(0, 10));

    const duplicate = await adapter.attemptDuplicateEffectInsert({
      operationId,
      idempotencyKey,
      effectType: HBCE_RUNTIME_EFFECT_TYPE,
      eventType: HBCE_RUNTIME_LEVEL_9_EVENT_TYPE,
      payloadHash,
      effectHash,
      chainHash: initialChainHash,
    });

    assertCondition(
      duplicate.accepted === false,
      "DUPLICATE_EXTERNAL_EFFECT_ACCEPTED",
    );

    const counts = await adapter.countPersistentRecords(operationId);

    assertCondition(
      counts.effectCount === 1,
      "DUPLICATE_EFFECT_PERSISTED",
    );
    assertCondition(
      counts.outboxCount === 1,
      "DUPLICATE_OUTBOX_PERSISTED",
    );

    return {
      duplicateEffectAccepted: duplicate.accepted,
      duplicateError: duplicate.error,
      effectCount: counts.effectCount,
      outboxCount: counts.outboxCount,
    };
  });

  await executeCheck(checks[11], async () => {
    assertPreviousChecksPassed(checks.slice(0, 11));

    const ledgerCompleted = await adapter.transitionOperation({
      operationId,
      operationStatus: "LEDGER_COMPLETED",
      checkpoint: "LEDGER_COMPLETED",
      recoveryStatus: "LEASE_ACQUIRED",
      incrementAttempt: true,
    });

    const opcPending = await adapter.transitionOperation({
      operationId,
      operationStatus: "OPC_PENDING",
      checkpoint: "OPC_PENDING",
      recoveryStatus: "LEASE_ACQUIRED",
    });

    assertCondition(
      ledgerCompleted.attemptCount === 2,
      "RECOVERY_ATTEMPT_COUNT_INVALID",
    );
    assertCondition(
      ledgerCompleted.recoveryCount === 1,
      "WORKFLOW_RECOVERY_COUNT_INVALID",
    );

    const counts = await adapter.countPersistentRecords(operationId);

    assertCondition(
      counts.effectCount === 1 && counts.outboxCount === 1,
      "WORKFLOW_RESUMPTION_DUPLICATED_PERSISTENT_RECORDS",
    );

    return {
      resumedFrom: "EXTERNAL_EFFECT_ALREADY_COMMITTED",
      ledgerCompleted,
      opcPending,
      repeatedModelCall: false,
      repeatedEffectWrite: false,
      repeatedOutboxWrite: false,
      counts,
    };
  });

  await executeCheck(checks[12], async () => {
    assertPreviousChecksPassed(checks.slice(0, 12));

    assertCondition(effect !== null, "EFFECT_NOT_AVAILABLE_FOR_OPC");
    assertCondition(outbox !== null, "OUTBOX_NOT_AVAILABLE_FOR_OPC");

    const currentOperation = await adapter.findOperation(operationId);

    assertCondition(
      currentOperation !== null,
      "OPERATION_NOT_AVAILABLE_FOR_OPC",
    );

    const outboxHash = sha256(
      canonicalize({
        id: outbox.id,
        operationId: outbox.operationId,
        effectId: outbox.effectId,
        eventType: outbox.eventType,
        payloadHash: outbox.payloadHash,
      }),
    );

    const finalStateHash = sha256(
      canonicalize({
        operationId,
        operationStatus: "COMPLETED",
        checkpoint: "COMPLETED",
        recoveryStatus: "RECOVERED",
        attemptCount: 2,
        recoveryCount: 1,
      }),
    );

    const finalChainHash = sha256(
      canonicalize({
        previousChainHash: currentOperation.chainHash,
        finalStateHash,
        effectHash: effect.effectHash,
        outboxHash,
      }),
    );

    const opcResult = await adapter.createOrGetOpcReceipt({
      operationId,
      receiptType: HBCE_RUNTIME_RECEIPT_TYPE,
      idempotencyKeyHash: sha256(idempotencyKey),
      effectHash: effect.effectHash,
      outboxHash,
      finalStateHash,
      finalChainHash,
      recoveryCount: 1,
      attemptCount: 2,
      completedAt: now(),
      legalCertification: false,
    });

    opcReceipt = opcResult.receipt;

    await adapter.transitionOperation({
      operationId,
      operationStatus: "OPC_COMPLETED",
      checkpoint: "OPC_COMPLETED",
      recoveryStatus: "LEASE_ACQUIRED",
    });

    const completed = await adapter.transitionOperation({
      operationId,
      operationStatus: "COMPLETED",
      checkpoint: "COMPLETED",
      recoveryStatus: "RECOVERED",
      completionReason:
        "WORKFLOW_RESUMED_WITH_EXISTING_EXTERNAL_EFFECT_AND_OPC_CLOSURE",
      completedAt: now(),
    });

    const released = await adapter.releaseRecoveryLease({
      operationId,
      workerId: recoveryWorker,
    });

    assertCondition(
      opcReceipt.legalCertification === false,
      "OPC_LEGAL_CERTIFICATION_BOUNDARY_VIOLATED",
    );
    assertCondition(
      released.leaseOwner === null &&
        released.leaseTokenPresent === false,
      "RECOVERY_LEASE_NOT_RELEASED",
    );

    return {
      opcReceipt,
      opcCreated: opcResult.created,
      completed,
      finalLeaseReleasedRecord: released,
    };
  });

  await executeCheck(checks[13], async () => {
    assertPreviousChecksPassed(checks.slice(0, 13));

    const before = await adapter.countPersistentRecords(operationId);

    const replay = await adapter.getOrCreateCanonicalOperation({
      requestedOperationId: `HBCE-L9-COMPLETED-REPLAY-${suffix}`,
      idempotencyKey,
      maxAttempts: 3,
      legalCertification: false,
    });

    const after = await adapter.countPersistentRecords(operationId);

    assertCondition(
      replay.operationId === operationId,
      "COMPLETED_REPLAY_RETURNED_NON_CANONICAL_OPERATION",
    );
    assertCondition(
      replay.operationStatus === "COMPLETED",
      "COMPLETED_REPLAY_OPERATION_NOT_COMPLETED",
    );
    assertCondition(
      before.operationCount === 1 &&
        before.effectCount === 1 &&
        before.outboxCount === 1 &&
        before.opcCount === 1,
      "PRE_REPLAY_COUNTS_INVALID",
    );
    assertCondition(
      canonicalize(before) === canonicalize(after),
      "COMPLETED_REPLAY_CREATED_NEW_RECORDS",
    );

    return {
      canonicalOperationReturned: true,
      operationAlreadyCompleted: true,
      newEffectCreated: false,
      newOutboxCreated: false,
      newOpcCreated: false,
      counts: after,
    };
  });

  await executeCheck(checks[14], async () => {
    assertPreviousChecksPassed(checks.slice(0, 14));

    const actual = await adapter.findOperation(operationId);
    const counts = await adapter.countPersistentRecords(operationId);

    assertCondition(actual !== null, "FINAL_OPERATION_MISSING");
    assertCondition(
      actual.operationStatus === "COMPLETED",
      "FINAL_OPERATION_STATUS_INVALID",
    );
    assertCondition(
      actual.checkpoint === "COMPLETED",
      "FINAL_CHECKPOINT_INVALID",
    );
    assertCondition(
      actual.recoveryStatus === "RECOVERED",
      "FINAL_RECOVERY_STATUS_INVALID",
    );
    assertCondition(
      actual.attemptCount === 2,
      "FINAL_ATTEMPT_COUNT_INVALID",
    );
    assertCondition(
      actual.recoveryCount === 1,
      "FINAL_RECOVERY_COUNT_INVALID",
    );
    assertCondition(
      actual.leaseOwner === null &&
        actual.leaseTokenPresent === false,
      "FINAL_LEASE_NOT_RELEASED",
    );
    assertCondition(
      counts.operationCount === 1 &&
        counts.effectCount === 1 &&
        counts.outboxCount === 1 &&
        counts.opcCount === 1,
      "FINAL_PERSISTENT_COUNTS_INVALID",
    );

    return {
      expected: {
        operationStatus: "COMPLETED",
        checkpoint: "COMPLETED",
        recoveryStatus: "RECOVERED",
        attemptCount: 2,
        recoveryCount: 1,
        leaseReleased: true,
        effectCount: 1,
        outboxCount: 1,
        opcCount: 1,
        duplicateLogicalExecution: false,
        duplicatePersistentEffect: false,
        legalCertification: false,
      },
      actual: {
        ...actual,
        effectCount: counts.effectCount,
        outboxCount: counts.outboxCount,
        opcCount: counts.opcCount,
        duplicateLogicalExecution: false,
        duplicatePersistentEffect: false,
      },
    };
  });

  await executeCheck(checks[15], async () => {
    assertPreviousChecksPassed(checks.slice(0, 15));

    const cleanup = await adapter.cleanupTemporaryRecords(operationId);

    assertCondition(
      cleanup.remainingOperation === null,
      "TEMPORARY_OPERATION_NOT_REMOVED",
    );
    assertCondition(
      cleanup.remainingEffect === null,
      "TEMPORARY_EFFECT_NOT_REMOVED",
    );
    assertCondition(
      cleanup.remainingOutbox === null,
      "TEMPORARY_OUTBOX_NOT_REMOVED",
    );
    assertCondition(
      cleanup.remainingOpc === null,
      "TEMPORARY_OPC_NOT_REMOVED",
    );

    return cleanup;
  });

  const passedChecks = checks.filter(
    (check) => check.status === "PASS",
  ).length;

  const failedChecks = checks.filter(
    (check) => check.status === "FAIL",
  ).length;

  const skippedChecks = checks.filter(
    (check) => check.status === "SKIPPED",
  ).length;

  const firstFailedCheck = checks.find(
    (check) => check.status === "FAIL",
  );

  if (firstFailedCheck) {
    firstFailure = `${firstFailedCheck.id}:${firstFailedCheck.error ?? "UNKNOWN"}`;
  }

  const ok =
    passedChecks === 16 &&
    failedChecks === 0 &&
    skippedChecks === 0;

  return {
    ok,
    status: ok
      ? HBCE_RUNTIME_LEVEL_9_PASS_STATUS
      : HBCE_RUNTIME_LEVEL_9_FAIL_STATUS,
    operationalStatus: ok ? "PASS" : "FAIL",
    revision: HBCE_RUNTIME_LEVEL_9_REVISION,
    generatedAt: generatedAt.toISOString(),
    product: "HBCE IPR Operational Identity & Proof Layer",
    apiVersion: "v1",
    runtime: "AI_JOKER_C2_SAAS_CORE_v0_1",
    deployment: {
      origin:
        options.deployment?.origin ??
        process.env.VERCEL_PROJECT_PRODUCTION_URL ??
        "LOCAL_RUNTIME",
      runtimeEnvironment:
        options.deployment?.runtimeEnvironment ??
        process.env.NODE_ENV ??
        "unknown",
      vercelEnvironment:
        options.deployment?.vercelEnvironment ??
        process.env.VERCEL_ENV ??
        "local",
      vercelRegion:
        options.deployment?.vercelRegion ??
        process.env.VERCEL_REGION ??
        "local",
      nodeVersion:
        options.deployment?.nodeVersion ??
        process.version,
    },
    execution: {
      mode:
        "PERSISTENT_EXTERNAL_EFFECT_IDEMPOTENCY_AND_TRANSACTIONAL_OUTBOX_RECONCILIATION",
      operationId,
      idempotencyKey,
      originalWorker,
      recoveryWorker,
      competingWorker,
      crashPoint:
        "AFTER_EXTERNAL_EFFECT_AND_OUTBOX_COMMIT_BEFORE_WORKFLOW_CHECKPOINT_UPDATE",
      recoveryStrategy:
        "EXCLUSIVE_LEASE_EFFECT_RECONCILIATION_AND_WORKFLOW_RESUMPTION",
      firstFailure,
    },
    summary: {
      totalChecks: 16,
      passedChecks,
      failedChecks,
      skippedChecks,
      requiredChecks: 16,
      requiredPassed: passedChecks,
      requiredFailed: failedChecks,
      durationMs: Date.now() - startedAt,
    },
    checks,
    interpretation: {
      durableOperationCreated: checks[1].status === "PASS",
      idempotencyReplayResolved: checks[2].status === "PASS",
      persistentExternalEffectCreated: checks[4].status === "PASS",
      transactionalOutboxCreated: checks[4].status === "PASS",
      controlledCrashPersistedAfterEffectCommit:
        checks[5].status === "PASS",
      recoveryNeedDetected: checks[6].status === "PASS",
      exclusiveRecoveryLeaseAcquired: checks[7].status === "PASS",
      competingWorkerRejected: checks[8].status === "PASS",
      existingEffectReconciled: checks[9].status === "PASS",
      duplicateEffectRejected: checks[10].status === "PASS",
      workflowResumedWithoutDuplicateEffect:
        checks[11].status === "PASS",
      opcClosureGenerated: checks[12].status === "PASS",
      completedReplayResolvedWithoutNewEffects:
        checks[13].status === "PASS",
      cleanupCompleted: checks[15].status === "PASS",
      externalEffectIdempotencyPassed: ok,
    },
    boundary: {
      legalCertification: false,
      technicalRuntimeTestOnly: true,
      uneBdoOpening: true,
      space: "HBCE_PRODUCTION_RUNTIME",
      time: generatedAt.toISOString(),
      usesDurableOperationRegistry: true,
      usesDurableStateMachine: true,
      usesCheckpointPersistence: true,
      usesExclusiveRecoveryLease: true,
      usesHeartbeat: true,
      rejectsCompetingRecoveryWorker: true,
      idempotencyRequired: true,
      usesPersistentExternalEffect: true,
      usesUniqueEffectConstraint: true,
      usesTransactionalOutbox: true,
      usesRecoveryReconciliation: true,
      performsControlledCrashInjection: true,
      performsRealProcessTermination: false,
      performsRealModelCall: false,
      createsTemporaryPersistentTestData: true,
      testRecordRetained: false,
      opcGeneratedAtClosure: true,
      replacesDisasterRecoveryTesting: false,
      replacesMultiRegionFailoverTesting: false,
      replacesHumanReview: false,
      externalDeliverySemantics:
        "AT_LEAST_ONCE_DELIVERY_WITH_IDEMPOTENT_CONSUMER_REQUIREMENT",
      note:
        "Level 9 writes one synthetic persistent effect and one outbox record atomically, interrupts the workflow before its checkpoint update, acquires an exclusive recovery lease, reconciles the already committed effect, rejects duplicate persistence, generates one technical OPC receipt and completes without duplicate logical execution. It does not prove exactly-once delivery to external systems.",
    },
  };
}
