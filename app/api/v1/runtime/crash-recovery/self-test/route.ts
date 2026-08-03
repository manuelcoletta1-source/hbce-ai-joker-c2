import { createHash, randomUUID } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import {
  describeHbceTransactionDatabase,
  isHbceTransactionDatabaseConfigured,
} from "@/lib/ipr-database-transaction";

import {
  acquireRuntimeOperationRecoveryLease,
  createRuntimeOperation,
  deleteRuntimeOperationForSelfTest,
  getRuntimeOperation,
  heartbeatRuntimeOperation,
  inspectRuntimeOperationRecoveryNeed,
  markRuntimeOperationInterrupted,
  markRuntimeOperationRecoveryRequired,
  releaseRuntimeOperationRecoveryLease,
  transitionRuntimeOperation,
  type RuntimeOperationRecord,
} from "@/lib/runtime-operation-recovery";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;
export const maxDuration = 300;

const REVISION =
  "HBCE-RUNTIME-CRASH-RECOVERY-WORKFLOW-RESUMPTION-SELF-TEST-v1_0";

const PRODUCT =
  "HBCE IPR Operational Identity & Proof Layer";

const API_VERSION = "v1";
const RUNTIME_NAME = "AI_JOKER_C2_SAAS_CORE_v0_1";

type CheckStatus = "PASS" | "FAIL" | "SKIPPED";

type Check = {
  id: string;
  label: string;
  required: boolean;
  status: CheckStatus;
  durationMs: number;
  details: Record<string, unknown>;
  error: string | null;
};

function nowMs(): number {
  return Date.now();
}

function elapsedMs(startedAt: number): number {
  return Math.max(0, Date.now() - startedAt);
}

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

function stableJson(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (value instanceof Date) {
    return JSON.stringify(value.toISOString());
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableJson).join(",")}]`;
  }

  const record = value as Record<string, unknown>;

  return `{${Object.keys(record)
    .sort()
    .map(
      (key) =>
        `${JSON.stringify(key)}:${stableJson(record[key])}`,
    )
    .join(",")}}`;
}

function sha256(value: string): string {
  return `sha256:${createHash("sha256")
    .update(value, "utf8")
    .digest("hex")}`;
}

function createCheck(input: {
  id: string;
  label: string;
  required?: boolean;
  status: CheckStatus;
  durationMs: number;
  details?: Record<string, unknown>;
  error?: string | null;
}): Check {
  return {
    id: input.id,
    label: input.label,
    required: input.required ?? true,
    status: input.status,
    durationMs: input.durationMs,
    details: input.details ?? {},
    error: input.error ?? null,
  };
}

function createSkippedCheck(
  id: string,
  label: string,
  reason: string,
): Check {
  return createCheck({
    id,
    label,
    status: "SKIPPED",
    durationMs: 0,
    details: { reason },
    error: `${id}_SKIPPED`,
  });
}

function buildSummary(
  checks: Check[],
  durationMs: number,
): Record<string, number> {
  const requiredChecks =
    checks.filter((check) => check.required);

  return {
    totalChecks: checks.length,
    passedChecks:
      checks.filter(
        (check) => check.status === "PASS",
      ).length,
    failedChecks:
      checks.filter(
        (check) => check.status === "FAIL",
      ).length,
    skippedChecks:
      checks.filter(
        (check) => check.status === "SKIPPED",
      ).length,
    requiredChecks: requiredChecks.length,
    requiredPassed:
      requiredChecks.filter(
        (check) => check.status === "PASS",
      ).length,
    requiredFailed:
      requiredChecks.filter(
        (check) => check.status !== "PASS",
      ).length,
    durationMs,
  };
}

function getRequestOrigin(request: NextRequest): string {
  const forwardedProto =
    request.headers.get("x-forwarded-proto");

  const forwardedHost =
    request.headers.get("x-forwarded-host");

  const host =
    forwardedHost ??
    request.headers.get("host");

  if (host) {
    return `${forwardedProto ?? "https"}://${host}`;
  }

  return request.nextUrl.origin;
}

function compactRecord(
  record: RuntimeOperationRecord | null,
): Record<string, unknown> | null {
  if (!record) {
    return null;
  }

  return {
    operationId:
      record.operationId,
    operationStatus:
      record.operationStatus,
    checkpoint:
      record.checkpoint,
    recoveryStatus:
      record.recoveryStatus,
    attemptCount:
      record.attemptCount,
    recoveryCount:
      record.recoveryCount,
    maxAttempts:
      record.maxAttempts,
    leaseOwner:
      record.leaseOwner,
    leaseTokenPresent:
      Boolean(record.leaseToken),
    leaseAcquiredAt:
      record.leaseAcquiredAt,
    leaseExpiresAt:
      record.leaseExpiresAt,
    heartbeatAt:
      record.heartbeatAt,
    stateHash:
      record.stateHash,
    chainHash:
      record.chainHash,
    interruptionReason:
      record.interruptionReason,
    completionReason:
      record.completionReason,
    createdAt:
      record.createdAt,
    updatedAt:
      record.updatedAt,
    completedAt:
      record.completedAt,
    legalCertification:
      record.legalCertification,
  };
}

async function requireTransition(
  input: Parameters<typeof transitionRuntimeOperation>[0],
): Promise<RuntimeOperationRecord> {
  const result =
    await transitionRuntimeOperation(input);

  if (!result.ok) {
    throw new Error(result.error);
  }

  return result.record;
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse> {
  const startedAt = nowMs();
  const generatedAt = new Date().toISOString();
  const checks: Check[] = [];

  const timestamp =
    generatedAt
      .replace(/\D/g, "")
      .slice(0, 14);

  const suffix =
    randomUUID()
      .replace(/-/g, "")
      .slice(0, 8)
      .toUpperCase();

  const operationId =
    `HBCE-RECOVERY-${timestamp}-${suffix}`;

  const idempotencyKey =
    `HBCE-RECOVERY-IDEMPOTENCY-${timestamp}-${suffix}`;

  const sessionId =
    `HBCE-RECOVERY-SESSION-${randomUUID()}`;

  const threadId =
    `HBCE-RECOVERY-THREAD-${randomUUID()}`;

  const requestId =
    `HBCE-RECOVERY-REQUEST-${randomUUID()}`;

  const firstWorker =
    `HBCE-RECOVERY-WORKER-A-${suffix}`;

  const recoveryWorker =
    `HBCE-RECOVERY-WORKER-B-${suffix}`;

  const competingWorker =
    `HBCE-RECOVERY-WORKER-C-${suffix}`;

  const inputHash =
    sha256(
      stableJson({
        operationId,
        scenario:
          "CRASH_RECOVERY_DURABLE_WORKFLOW_RESUMPTION",
        generatedAt,
      }),
    );

  const policyHash =
    sha256(
      stableJson({
        failClosed: true,
        idempotencyRequired: true,
        leaseRequired: true,
        noDoubleExecution: true,
        legalCertification: false,
      }),
    );

  const configured =
    isHbceTransactionDatabaseConfigured();

  checks.push(
    createCheck({
      id: "RECOVERY_RUNTIME_CONFIGURATION",
      label:
        "Crash recovery runtime configuration",
      status:
        configured ? "PASS" : "FAIL",
      durationMs: 0,
      details: {
        configured,
        transaction:
          describeHbceTransactionDatabase(),
        table:
          "runtime_operations",
        stateMachine:
          "HBCE-RUNTIME-WORKFLOW-STATE-MACHINE-v1_0",
        recoveryHelper:
          "HBCE-RUNTIME-OPERATION-RECOVERY-v1_0",
      },
      error:
        configured
          ? null
          : "TRANSACTION_DATABASE_NOT_CONFIGURED",
    }),
  );

  let recordCreated = false;

  if (!configured) {
    const reason =
      "TRANSACTION_DATABASE_NOT_CONFIGURED";

    checks.push(
      createSkippedCheck(
        "DURABLE_OPERATION_CREATE",
        "Create durable workflow operation",
        reason,
      ),
      createSkippedCheck(
        "DURABLE_IDEMPOTENCY_REPLAY",
        "Replay durable operation creation",
        reason,
      ),
      createSkippedCheck(
        "WORKFLOW_PRE_CRASH_ADVANCE",
        "Advance workflow to durable checkpoint",
        reason,
      ),
      createSkippedCheck(
        "CONTROLLED_CRASH_PERSIST",
        "Persist controlled interruption",
        reason,
      ),
      createSkippedCheck(
        "RECOVERY_NEED_DETECTION",
        "Detect recoverable interrupted workflow",
        reason,
      ),
      createSkippedCheck(
        "RECOVERY_REQUIRED_TRANSITION",
        "Mark workflow recovery required",
        reason,
      ),
      createSkippedCheck(
        "RECOVERY_LEASE_ACQUIRE",
        "Acquire exclusive recovery lease",
        reason,
      ),
      createSkippedCheck(
        "RECOVERY_DOUBLE_LEASE_GUARD",
        "Reject competing recovery worker",
        reason,
      ),
      createSkippedCheck(
        "RECOVERY_HEARTBEAT",
        "Renew recovery heartbeat and lease",
        reason,
      ),
      createSkippedCheck(
        "WORKFLOW_RESUMPTION",
        "Resume workflow from durable checkpoint",
        reason,
      ),
      createSkippedCheck(
        "RECOVERY_FINAL_STATE_VERIFY",
        "Verify completed recovered workflow",
        reason,
      ),
      createSkippedCheck(
        "RECOVERY_SELF_TEST_CLEANUP",
        "Remove temporary recovered workflow",
        reason,
      ),
    );
  } else {
    try {
      const createStartedAt = nowMs();

      const created =
        await createRuntimeOperation({
          operationId,
          idempotencyKey,

          tenantId:
            "HBCE-TENANT-SELF-PILOT",

          workspaceId:
            "HBCE-WORKSPACE-RND",

          subscriptionId:
            "HBCE-SUBSCRIPTION-SELF-PILOT",

          humanIpr:
            "IPR-HBCE-CRASH-RECOVERY-SELF-TEST",

          runtimeIpr:
            "IPR-AI-0001",

          sessionId,
          threadId,
          requestId,

          workflowKind:
            "HBCE_LEVEL_8_CRASH_RECOVERY_SELF_TEST",

          maxAttempts: 3,

          inputHash,
          policyHash,

          statePayload: {
            uneBdoOpening:
              true,
            operationalSpace:
              "HBCE_PRODUCTION_RUNTIME",
            operationalTime:
              generatedAt,
            firstWorker,
          },

          checkpointPayload: {
            checkpoint:
              "NEW",
            durable:
              true,
          },

          tracePayload: {
            level: 8,
            test:
              "CRASH_RECOVERY_DURABLE_STATE_MACHINE_WORKFLOW_RESUMPTION",
          },
        });

      if (!created.ok) {
        throw new Error(created.error);
      }

      recordCreated = true;

      checks.push(
        createCheck({
          id: "DURABLE_OPERATION_CREATE",
          label:
            "Create durable workflow operation",
          status: "PASS",
          durationMs:
            elapsedMs(createStartedAt),
          details: {
            operationId,
            idempotencyKey,
            record:
              compactRecord(created.record),
          },
        }),
      );

      const replayStartedAt = nowMs();

      const replay =
        await createRuntimeOperation({
          operationId:
            `HBCE-RECOVERY-REPLAY-${timestamp}-${suffix}`,

          idempotencyKey,

          tenantId:
            "HBCE-TENANT-SELF-PILOT",

          workspaceId:
            "HBCE-WORKSPACE-RND",

          subscriptionId:
            "HBCE-SUBSCRIPTION-SELF-PILOT",

          humanIpr:
            "IPR-HBCE-CRASH-RECOVERY-SELF-TEST",

          runtimeIpr:
            "IPR-AI-0001",

          sessionId:
            `HBCE-RECOVERY-REPLAY-SESSION-${randomUUID()}`,

          threadId,
          requestId,

          workflowKind:
            "HBCE_LEVEL_8_CRASH_RECOVERY_SELF_TEST",

          maxAttempts: 3,

          inputHash,
          policyHash,
        });

      const replayPassed =
        replay.ok &&
        replay.record.operationId ===
          operationId;

      checks.push(
        createCheck({
          id: "DURABLE_IDEMPOTENCY_REPLAY",
          label:
            "Replay durable operation creation",
          status:
            replayPassed ? "PASS" : "FAIL",
          durationMs:
            elapsedMs(replayStartedAt),
          details: {
            requestedReplayOperationId:
              `HBCE-RECOVERY-REPLAY-${timestamp}-${suffix}`,
            canonicalOperationId:
              replay.ok
                ? replay.record.operationId
                : null,
            sameCanonicalOperation:
              replayPassed,
          },
          error:
            replayPassed
              ? null
              : replay.ok
                ? "IDEMPOTENCY_REPLAY_CREATED_DIFFERENT_OPERATION"
                : replay.error,
        }),
      );

      const advanceStartedAt = nowMs();

      const authorized =
        await requireTransition({
          operationId,

          toStatus:
            "AUTHORIZED",

          toRecoveryStatus:
            "NOT_REQUIRED",

          toCheckpoint:
            "AUTHORIZED",

          reason:
            "IDENTITY_AND_POLICY_AUTHORIZED",

          checkpointPayload: {
            authorizedAt:
              new Date().toISOString(),
            inputHash,
            policyHash,
          },

          tracePayload: {
            authorizedBy:
              "SERVER_RUNTIME_VALIDATED",
          },
        });

      const running =
        await requireTransition({
          operationId,

          toStatus:
            "RUNNING",

          toRecoveryStatus:
            "NOT_REQUIRED",

          toCheckpoint:
            "MODEL_CALL_STARTED",

          reason:
            "WORKFLOW_EXECUTION_STARTED",

          attemptCount:
            1,

          heartbeatAt:
            new Date().toISOString(),

          checkpointPayload: {
            durableCheckpoint:
              "MODEL_CALL_STARTED",
            firstWorker,
          },

          tracePayload: {
            worker:
              firstWorker,
            phase:
              "PRE_CRASH_EXECUTION",
          },
        });

      const modelCompleted =
        await requireTransition({
          operationId,

          toStatus:
            "MODEL_COMPLETED",

          toRecoveryStatus:
            "NOT_REQUIRED",

          toCheckpoint:
            "MODEL_COMPLETED",

          reason:
            "MODEL_EXECUTION_COMPLETED",

          attemptCount:
            1,

          heartbeatAt:
            new Date().toISOString(),

          checkpointPayload: {
            durableCheckpoint:
              "MODEL_COMPLETED",
            modelOutputHash:
              sha256(
                "HBCE_LEVEL_8_SYNTHETIC_VALIDATED_MODEL_OUTPUT",
              ),
            rawOutputPersisted:
              false,
          },

          tracePayload: {
            worker:
              firstWorker,
            modelCall:
              "SYNTHETIC_LEVEL_8_CHECKPOINT_ONLY",
          },
        });

      const ledgerPending =
        await requireTransition({
          operationId,

          toStatus:
            "LEDGER_PENDING",

          toRecoveryStatus:
            "NOT_REQUIRED",

          toCheckpoint:
            "LEDGER_PENDING",

          reason:
            "LEDGER_TRANSACTION_PREPARED",

          attemptCount:
            1,

          heartbeatAt:
            new Date().toISOString(),

          checkpointPayload: {
            durableCheckpoint:
              "LEDGER_PENDING",
            resumeTarget:
              "COMPLETE_FROM_PERSISTED_CHECKPOINT",
          },

          tracePayload: {
            worker:
              firstWorker,
            crashInjectionPoint:
              "AFTER_DURABLE_LEDGER_PENDING_CHECKPOINT",
          },
        });

      const advancePassed =
        authorized.operationStatus ===
          "AUTHORIZED" &&
        running.operationStatus ===
          "RUNNING" &&
        modelCompleted.operationStatus ===
          "MODEL_COMPLETED" &&
        ledgerPending.operationStatus ===
          "LEDGER_PENDING" &&
        ledgerPending.checkpoint ===
          "LEDGER_PENDING";

      checks.push(
        createCheck({
          id: "WORKFLOW_PRE_CRASH_ADVANCE",
          label:
            "Advance workflow to durable checkpoint",
          status:
            advancePassed
              ? "PASS"
              : "FAIL",
          durationMs:
            elapsedMs(advanceStartedAt),
          details: {
            authorized:
              compactRecord(authorized),
            running:
              compactRecord(running),
            modelCompleted:
              compactRecord(modelCompleted),
            durableCheckpoint:
              compactRecord(ledgerPending),
          },
          error:
            advancePassed
              ? null
              : "PRE_CRASH_WORKFLOW_STATE_MISMATCH",
        }),
      );

      const crashStartedAt = nowMs();

      const interrupted =
        await markRuntimeOperationInterrupted({
          operationId,

          interruptionReason:
            "HBCE_CONTROLLED_CRASH_AFTER_LEDGER_PENDING_CHECKPOINT",

          checkpointPayload: {
            lastDurableBusinessCheckpoint:
              "LEDGER_PENDING",
            crashInjected:
              true,
            crashInjectedAt:
              new Date().toISOString(),
          },

          tracePayload: {
            previousWorker:
              firstWorker,
            processTerminated:
              true,
            runtimeRestartRequired:
              true,
          },
        });

      if (!interrupted.ok) {
        throw new Error(interrupted.error);
      }

      const interruptedPassed =
        interrupted.record.operationStatus ===
          "INTERRUPTED" &&
        interrupted.record.recoveryStatus ===
          "REQUIRED" &&
        interrupted.record.interruptionReason ===
          "HBCE_CONTROLLED_CRASH_AFTER_LEDGER_PENDING_CHECKPOINT";

      checks.push(
        createCheck({
          id: "CONTROLLED_CRASH_PERSIST",
          label:
            "Persist controlled interruption",
          status:
            interruptedPassed
              ? "PASS"
              : "FAIL",
          durationMs:
            elapsedMs(crashStartedAt),
          details: {
            crashPoint:
              "AFTER_LEDGER_PENDING_CHECKPOINT",
            record:
              compactRecord(interrupted.record),
          },
          error:
            interruptedPassed
              ? null
              : "CONTROLLED_CRASH_STATE_NOT_PERSISTED",
        }),
      );

      const detectionStartedAt = nowMs();

      const recoveryNeed =
        await inspectRuntimeOperationRecoveryNeed({
          operationId,
          staleAfterMs: 1,
        });

      const detectionPassed =
        recoveryNeed.recover &&
        recoveryNeed.reason ===
          "INTERRUPTED_OPERATION";

      checks.push(
        createCheck({
          id: "RECOVERY_NEED_DETECTION",
          label:
            "Detect recoverable interrupted workflow",
          status:
            detectionPassed
              ? "PASS"
              : "FAIL",
          durationMs:
            elapsedMs(detectionStartedAt),
          details: {
            recover:
              recoveryNeed.recover,
            reason:
              recoveryNeed.reason,
            record:
              compactRecord(recoveryNeed.record),
          },
          error:
            detectionPassed
              ? null
              : "INTERRUPTED_WORKFLOW_NOT_DETECTED_FOR_RECOVERY",
        }),
      );

      const requiredStartedAt = nowMs();

      const recoveryRequired =
        await markRuntimeOperationRecoveryRequired({
          operationId,

          reason:
            "STALE_HEARTBEAT_DETECTED",

          interruptionReason:
            "ORIGINAL_WORKER_UNAVAILABLE_AFTER_CONTROLLED_CRASH",

          recoveryPayload: {
            detectedAt:
              new Date().toISOString(),
            previousWorker:
              firstWorker,
            resumeFrom:
              "LEDGER_PENDING",
          },
        });

      if (!recoveryRequired.ok) {
        throw new Error(
          recoveryRequired.error,
        );
      }

      const recoveryRequiredPassed =
        recoveryRequired.record.operationStatus ===
          "RECOVERY_REQUIRED" &&
        recoveryRequired.record.recoveryStatus ===
          "REQUIRED";

      checks.push(
        createCheck({
          id: "RECOVERY_REQUIRED_TRANSITION",
          label:
            "Mark workflow recovery required",
          status:
            recoveryRequiredPassed
              ? "PASS"
              : "FAIL",
          durationMs:
            elapsedMs(requiredStartedAt),
          details: {
            record:
              compactRecord(
                recoveryRequired.record,
              ),
          },
          error:
            recoveryRequiredPassed
              ? null
              : "RECOVERY_REQUIRED_STATE_MISMATCH",
        }),
      );

      const leaseStartedAt = nowMs();

      const lease =
        await acquireRuntimeOperationRecoveryLease({
          operationId,
          leaseOwner:
            recoveryWorker,
          leaseDurationMs:
            60_000,
        });

      if (!lease.ok) {
        throw new Error(lease.error);
      }

      const leasePassed =
        lease.record.operationStatus ===
          "RECOVERING" &&
        lease.record.recoveryStatus ===
          "LEASE_ACQUIRED" &&
        lease.record.leaseOwner ===
          recoveryWorker &&
        Boolean(lease.record.leaseToken);

      checks.push(
        createCheck({
          id: "RECOVERY_LEASE_ACQUIRE",
          label:
            "Acquire exclusive recovery lease",
          status:
            leasePassed
              ? "PASS"
              : "FAIL",
          durationMs:
            elapsedMs(leaseStartedAt),
          details: {
            recoveryWorker,
            record:
              compactRecord(lease.record),
          },
          error:
            leasePassed
              ? null
              : "RECOVERY_LEASE_STATE_MISMATCH",
        }),
      );

      const competingStartedAt = nowMs();

      const competing =
        await acquireRuntimeOperationRecoveryLease({
          operationId,
          leaseOwner:
            competingWorker,
          leaseDurationMs:
            60_000,
        });

      const competingGuardPassed =
        !competing.ok &&
        competing.error ===
          "RECOVERY_LEASE_NOT_ACQUIRED";

      checks.push(
        createCheck({
          id: "RECOVERY_DOUBLE_LEASE_GUARD",
          label:
            "Reject competing recovery worker",
          status:
            competingGuardPassed
              ? "PASS"
              : "FAIL",
          durationMs:
            elapsedMs(competingStartedAt),
          details: {
            activeWorker:
              recoveryWorker,
            competingWorker,
            competingLeaseAccepted:
              competing.ok,
            competingError:
              competing.ok
                ? null
                : competing.error,
          },
          error:
            competingGuardPassed
              ? null
              : "COMPETING_RECOVERY_WORKER_WAS_NOT_REJECTED",
        }),
      );

      const heartbeatStartedAt = nowMs();

      const leaseToken =
        lease.record.leaseToken;

      if (!leaseToken) {
        throw new Error(
          "ACTIVE_RECOVERY_LEASE_TOKEN_MISSING",
        );
      }

      const heartbeat =
        await heartbeatRuntimeOperation({
          operationId,
          leaseOwner:
            recoveryWorker,
          leaseToken,
          extendLeaseMs:
            60_000,
        });

      if (!heartbeat.ok) {
        throw new Error(
          heartbeat.error,
        );
      }

      const heartbeatPassed =
        heartbeat.record.leaseOwner ===
          recoveryWorker &&
        heartbeat.record.leaseToken ===
          leaseToken &&
        Boolean(
          heartbeat.record.heartbeatAt,
        ) &&
        Boolean(
          heartbeat.record.leaseExpiresAt,
        );

      checks.push(
        createCheck({
          id: "RECOVERY_HEARTBEAT",
          label:
            "Renew recovery heartbeat and lease",
          status:
            heartbeatPassed
              ? "PASS"
              : "FAIL",
          durationMs:
            elapsedMs(heartbeatStartedAt),
          details: {
            record:
              compactRecord(
                heartbeat.record,
              ),
          },
          error:
            heartbeatPassed
              ? null
              : "RECOVERY_HEARTBEAT_NOT_PERSISTED",
        }),
      );

      const resumeStartedAt = nowMs();

      const resumed =
        await requireTransition({
          operationId,

          toStatus:
            "COMPLETED",

          toRecoveryStatus:
            "RECOVERED",

          toCheckpoint:
            "COMPLETED",

          reason:
            "WORKFLOW_RESUMED",

          attemptCount:
            2,

          recoveryCount:
            heartbeat.record.recoveryCount,

          leaseOwner:
            recoveryWorker,

          leaseToken,

          leaseExpiresAt:
            heartbeat.record.leaseExpiresAt,

          heartbeatAt:
            heartbeat.record.heartbeatAt,

          completionReason:
            "WORKFLOW_RESUMED_FROM_DURABLE_LEDGER_PENDING_CHECKPOINT",

          checkpointPayload: {
            resumedFrom:
              "LEDGER_PENDING",
            resumedBy:
              recoveryWorker,
            duplicateModelExecution:
              false,
            duplicateLedgerExecution:
              false,
            completedAt:
              new Date().toISOString(),
          },

          recoveryPayload: {
            recoveryCompleted:
              true,
            originalWorker:
              firstWorker,
            recoveryWorker,
            recoveryStrategy:
              "RESUME_FROM_DURABLE_CHECKPOINT",
          },

          tracePayload: {
            noDoubleExecution:
              true,
            noDuplicateOperation:
              true,
            finalAuthority:
              "SERVER_RUNTIME_VALIDATED",
          },
        });

      const released =
        await releaseRuntimeOperationRecoveryLease({
          operationId,
          leaseOwner:
            recoveryWorker,
          leaseToken,
        });

      if (!released.ok) {
        throw new Error(
          released.error,
        );
      }

      const resumePassed =
        resumed.operationStatus ===
          "COMPLETED" &&
        resumed.recoveryStatus ===
          "RECOVERED" &&
        resumed.checkpoint ===
          "COMPLETED" &&
        resumed.attemptCount ===
          2 &&
        resumed.recoveryCount ===
          1 &&
        released.record.leaseOwner ===
          null &&
        released.record.leaseToken ===
          null;

      checks.push(
        createCheck({
          id: "WORKFLOW_RESUMPTION",
          label:
            "Resume workflow from durable checkpoint",
          status:
            resumePassed
              ? "PASS"
              : "FAIL",
          durationMs:
            elapsedMs(resumeStartedAt),
          details: {
            resumedFrom:
              "LEDGER_PENDING",
            originalWorker:
              firstWorker,
            recoveryWorker,
            resumedRecord:
              compactRecord(resumed),
            finalLeaseReleasedRecord:
              compactRecord(released.record),
          },
          error:
            resumePassed
              ? null
              : "WORKFLOW_RESUMPTION_STATE_MISMATCH",
        }),
      );

      const verifyStartedAt = nowMs();

      const finalRecord =
        await getRuntimeOperation(
          operationId,
        );

      const finalPassed =
        Boolean(finalRecord) &&
        finalRecord?.operationStatus ===
          "COMPLETED" &&
        finalRecord?.recoveryStatus ===
          "RECOVERED" &&
        finalRecord?.checkpoint ===
          "COMPLETED" &&
        finalRecord?.attemptCount ===
          2 &&
        finalRecord?.recoveryCount ===
          1 &&
        finalRecord?.leaseOwner ===
          null &&
        finalRecord?.leaseToken ===
          null &&
        finalRecord?.legalCertification ===
          false;

      checks.push(
        createCheck({
          id: "RECOVERY_FINAL_STATE_VERIFY",
          label:
            "Verify completed recovered workflow",
          status:
            finalPassed
              ? "PASS"
              : "FAIL",
          durationMs:
            elapsedMs(verifyStartedAt),
          details: {
            expected: {
              operationStatus:
                "COMPLETED",
              recoveryStatus:
                "RECOVERED",
              checkpoint:
                "COMPLETED",
              attemptCount:
                2,
              recoveryCount:
                1,
              leaseReleased:
                true,
              legalCertification:
                false,
            },
            actual:
              compactRecord(finalRecord),
          },
          error:
            finalPassed
              ? null
              : "RECOVERED_WORKFLOW_FINAL_STATE_INVALID",
        }),
      );
    } catch (error) {
      checks.push(
        createCheck({
          id: "CRASH_RECOVERY_UNHANDLED_ERROR",
          label:
            "Unhandled crash recovery self-test error",
          status: "FAIL",
          durationMs:
            elapsedMs(startedAt),
          details: {
            operationId,
            idempotencyKey,
          },
          error:
            normalizeError(error),
        }),
      );
    } finally {
      const cleanupStartedAt = nowMs();

      try {
        if (recordCreated) {
          await deleteRuntimeOperationForSelfTest(
            operationId,
          );
        }

        const remaining =
          await getRuntimeOperation(
            operationId,
          );

        const cleanupPassed =
          remaining === null;

        checks.push(
          createCheck({
            id: "RECOVERY_SELF_TEST_CLEANUP",
            label:
              "Remove temporary recovered workflow",
            status:
              cleanupPassed
                ? "PASS"
                : "FAIL",
            durationMs:
              elapsedMs(cleanupStartedAt),
            details: {
              operationId,
              remaining:
                compactRecord(remaining),
            },
            error:
              cleanupPassed
                ? null
                : "RECOVERY_SELF_TEST_RECORD_REMAINS",
          }),
        );
      } catch (cleanupError) {
        checks.push(
          createCheck({
            id: "RECOVERY_SELF_TEST_CLEANUP",
            label:
              "Remove temporary recovered workflow",
            status: "FAIL",
            durationMs:
              elapsedMs(cleanupStartedAt),
            details: {
              operationId,
            },
            error:
              normalizeError(
                cleanupError,
              ),
          }),
        );
      }
    }
  }

  const requiredFailed =
    checks.some(
      (check) =>
        check.required &&
        check.status !== "PASS",
    );

  const ok = !requiredFailed;

  const firstFailure =
    checks.find(
      (check) =>
        check.required &&
        check.status !== "PASS",
    ) ?? null;

  const durationMs =
    elapsedMs(startedAt);

  return NextResponse.json(
    {
      ok,

      status:
        ok
          ? "HBCE_RUNTIME_CRASH_RECOVERY_WORKFLOW_RESUMPTION_PASS"
          : "HBCE_RUNTIME_CRASH_RECOVERY_WORKFLOW_RESUMPTION_FAIL",

      operationalStatus:
        ok ? "PASS" : "FAIL",

      revision:
        REVISION,

      generatedAt,

      product:
        PRODUCT,

      apiVersion:
        API_VERSION,

      runtime:
        RUNTIME_NAME,

      deployment: {
        origin:
          getRequestOrigin(request),

        runtimeEnvironment:
          process.env.VERCEL_ENV ??
          process.env.NODE_ENV ??
          "unknown",

        vercelEnvironment:
          process.env.VERCEL_ENV ??
          null,

        vercelRegion:
          process.env.VERCEL_REGION ??
          process.env.AWS_REGION ??
          null,

        nodeVersion:
          process.version,
      },

      execution: {
        mode:
          "DURABLE_STATE_MACHINE_CRASH_INJECTION_AND_WORKFLOW_RESUMPTION",

        operationId,
        idempotencyKey,
        firstWorker,
        recoveryWorker,
        competingWorker,

        crashPoint:
          "AFTER_LEDGER_PENDING_DURABLE_CHECKPOINT",

        recoveryStrategy:
          "EXCLUSIVE_LEASE_AND_RESUME_FROM_DURABLE_CHECKPOINT",

        firstFailure:
          firstFailure
            ? {
                id:
                  firstFailure.id,
                error:
                  firstFailure.error,
              }
            : null,
      },

      summary:
        buildSummary(
          checks,
          durationMs,
        ),

      checks,

      interpretation: {
        durableOperationCreated:
          checks.find(
            (check) =>
              check.id ===
              "DURABLE_OPERATION_CREATE",
          )?.status === "PASS",

        idempotencyReplayResolved:
          checks.find(
            (check) =>
              check.id ===
              "DURABLE_IDEMPOTENCY_REPLAY",
          )?.status === "PASS",

        durableCheckpointPersisted:
          checks.find(
            (check) =>
              check.id ===
              "WORKFLOW_PRE_CRASH_ADVANCE",
          )?.status === "PASS",

        controlledCrashPersisted:
          checks.find(
            (check) =>
              check.id ===
              "CONTROLLED_CRASH_PERSIST",
          )?.status === "PASS",

        recoveryNeedDetected:
          checks.find(
            (check) =>
              check.id ===
              "RECOVERY_NEED_DETECTION",
          )?.status === "PASS",

        exclusiveRecoveryLeaseAcquired:
          checks.find(
            (check) =>
              check.id ===
              "RECOVERY_LEASE_ACQUIRE",
          )?.status === "PASS",

        competingWorkerRejected:
          checks.find(
            (check) =>
              check.id ===
              "RECOVERY_DOUBLE_LEASE_GUARD",
          )?.status === "PASS",

        heartbeatRenewed:
          checks.find(
            (check) =>
              check.id ===
              "RECOVERY_HEARTBEAT",
          )?.status === "PASS",

        workflowResumed:
          checks.find(
            (check) =>
              check.id ===
              "WORKFLOW_RESUMPTION",
          )?.status === "PASS",

        recoveredWorkflowCompleted:
          checks.find(
            (check) =>
              check.id ===
              "RECOVERY_FINAL_STATE_VERIFY",
          )?.status === "PASS",

        cleanupCompleted:
          checks.find(
            (check) =>
              check.id ===
              "RECOVERY_SELF_TEST_CLEANUP",
          )?.status === "PASS",

        crashRecoveryWorkflowResumptionPassed:
          ok,
      },

      boundary: {
        legalCertification:
          false,

        technicalRuntimeTestOnly:
          true,

        uneBdoOpening:
          true,

        space:
          "HBCE_PRODUCTION_RUNTIME",

        time:
          generatedAt,

        usesDurableOperationRegistry:
          true,

        usesDurableStateMachine:
          true,

        usesCheckpointPersistence:
          true,

        usesExclusiveRecoveryLease:
          true,

        usesHeartbeat:
          true,

        rejectsCompetingRecoveryWorker:
          true,

        idempotencyRequired:
          true,

        noDoubleExecution:
          true,

        performsControlledCrashInjection:
          true,

        performsRealProcessTermination:
          false,

        performsRealModelCall:
          false,

        createsPersistentBusinessData:
          false,

        testRecordRetained:
          false,

        opcGeneratedAtClosure:
          false,

        replacesDisasterRecoveryTesting:
          false,

        replacesMultiRegionFailoverTesting:
          false,

        replacesHumanReview:
          false,

        note:
          "Level 8 creates one durable runtime operation, persists checkpoints, records a controlled interruption, detects recovery need, acquires an exclusive lease for a second worker, rejects a competing worker, renews heartbeat, resumes from the durable checkpoint and verifies a completed terminal state without duplicate logical execution. The test uses a controlled state interruption rather than killing the Vercel process, because a terminated request cannot synchronously return its own verification result.",
      },
    },
    {
      status:
        ok ? 200 : 503,

      headers: {
        "Cache-Control":
          "no-store, no-cache, must-revalidate, proxy-revalidate",

        Pragma:
          "no-cache",

        Expires:
          "0",

        "X-HBCE-Level-8-Revision":
          REVISION,

        "X-HBCE-Level-8-Status":
          ok ? "PASS" : "FAIL",

        "X-HBCE-Legal-Certification":
          "false",
      },
    },
  );
}

export async function GET(
  request: NextRequest,
): Promise<NextResponse> {
  return NextResponse.json(
    {
      ok: true,

      status:
        "HBCE_RUNTIME_CRASH_RECOVERY_WORKFLOW_RESUMPTION_SELF_TEST_READY",

      revision:
        REVISION,

      endpoint:
        `${getRequestOrigin(request)}/api/v1/runtime/crash-recovery/self-test`,

      executionMethod:
        "POST",

      description:
        "Crea un'operazione durevole, avanza fino a un checkpoint persistente, registra un crash controllato, rileva la necessità di recovery, assegna una lease esclusiva a un secondo worker, respinge un worker concorrente, rinnova heartbeat e completa il workflow dal checkpoint senza duplicazioni.",

      executionPlan: [
        "CREATE DURABLE OPERATION",
        "VERIFY IDEMPOTENT REPLAY",
        "AUTHORIZED",
        "RUNNING",
        "MODEL COMPLETED",
        "LEDGER PENDING CHECKPOINT",
        "CONTROLLED INTERRUPTION",
        "RECOVERY REQUIRED",
        "ACQUIRE EXCLUSIVE LEASE",
        "REJECT COMPETING WORKER",
        "HEARTBEAT",
        "RESUME FROM DURABLE CHECKPOINT",
        "COMPLETED",
        "RELEASE LEASE",
        "VERIFY FINAL STATE",
        "CLEANUP",
      ],

      requiredFiles: [
        "database/migrations/010_runtime_operations.sql",
        "lib/runtime-workflow-state-machine.ts",
        "lib/runtime-operation-recovery.ts",
      ],

      warning:
        "GET non esegue il test. POST crea e rimuove un record temporaneo in runtime_operations. Il crash è rappresentato da un'interruzione durevole controllata, non dalla terminazione fisica della funzione Vercel.",

      boundary: {
        legalCertification:
          false,

        technicalRuntimeTestOnly:
          true,

        uneBdoOpening:
          true,

        usesDurableOperationRegistry:
          true,

        usesDurableStateMachine:
          true,

        usesCheckpointPersistence:
          true,

        usesExclusiveRecoveryLease:
          true,

        usesHeartbeat:
          true,

        performsControlledCrashInjection:
          true,

        performsRealProcessTermination:
          false,

        performsRealModelCall:
          false,

        createsPersistentBusinessData:
          false,

        testRecordRetained:
          false,

        opcGeneratedAtClosure:
          false,
      },
    },
    {
      status: 200,

      headers: {
        "Cache-Control":
          "no-store",

        "X-HBCE-Level-8-Revision":
          REVISION,

        "X-HBCE-Legal-Certification":
          "false",
      },
    },
  );
}
