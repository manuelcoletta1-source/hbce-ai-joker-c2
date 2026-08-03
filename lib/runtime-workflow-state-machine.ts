import { createHash } from "node:crypto";

export const HBCE_RUNTIME_WORKFLOW_STATE_MACHINE_REVISION =
  "HBCE-RUNTIME-WORKFLOW-STATE-MACHINE-v1_0";

export type RuntimeOperationStatus =
  | "NEW"
  | "AUTHORIZED"
  | "RUNNING"
  | "MODEL_COMPLETED"
  | "LEDGER_PENDING"
  | "LEDGER_COMMITTED"
  | "INTERRUPTED"
  | "RECOVERY_REQUIRED"
  | "RECOVERING"
  | "COMPENSATED"
  | "COMPLETED"
  | "FAILED";

export type RuntimeRecoveryStatus =
  | "NOT_REQUIRED"
  | "REQUIRED"
  | "LEASE_PENDING"
  | "LEASE_ACQUIRED"
  | "RECOVERING"
  | "RECOVERED"
  | "COMPENSATION_REQUIRED"
  | "COMPENSATED"
  | "FAILED";

export type RuntimeWorkflowCheckpoint =
  | "NEW"
  | "AUTHORIZED"
  | "MODEL_CALL_STARTED"
  | "MODEL_COMPLETED"
  | "LEDGER_PENDING"
  | "MEMORY_PERSISTED"
  | "EVT_PERSISTED"
  | "OPC_PERSISTED"
  | "AUDIT_PERSISTED"
  | "MODEL_USAGE_PERSISTED"
  | "LEDGER_COMMITTED"
  | "COMPLETED"
  | "INTERRUPTED"
  | "RECOVERY_REQUIRED"
  | "RECOVERING"
  | "COMPENSATED"
  | "FAILED";

export type RuntimeWorkflowTransitionReason =
  | "OPERATION_CREATED"
  | "IDENTITY_AND_POLICY_AUTHORIZED"
  | "WORKFLOW_EXECUTION_STARTED"
  | "MODEL_EXECUTION_COMPLETED"
  | "LEDGER_TRANSACTION_PREPARED"
  | "MEMORY_WRITE_COMPLETED"
  | "EVT_WRITE_COMPLETED"
  | "OPC_WRITE_COMPLETED"
  | "AUDIT_WRITE_COMPLETED"
  | "MODEL_USAGE_WRITE_COMPLETED"
  | "LEDGER_TRANSACTION_COMMITTED"
  | "WORKFLOW_COMPLETED"
  | "PROCESS_INTERRUPTED"
  | "STALE_HEARTBEAT_DETECTED"
  | "LEASE_EXPIRED"
  | "RECOVERY_LEASE_ACQUIRED"
  | "WORKFLOW_RESUMED"
  | "COMPENSATION_REQUIRED"
  | "COMPENSATION_COMPLETED"
  | "MAX_ATTEMPTS_EXCEEDED"
  | "UNRECOVERABLE_FAILURE"
  | "OPERATOR_ABORTED";

export type RuntimeWorkflowState = {
  operationId: string;
  operationStatus: RuntimeOperationStatus;
  recoveryStatus: RuntimeRecoveryStatus;
  checkpoint: RuntimeWorkflowCheckpoint;

  attemptCount: number;
  recoveryCount: number;
  maxAttempts: number;

  previousStateHash: string | null;
  stateHash: string;
  chainHash: string;

  lastTransitionAt: string;
  lastTransitionReason: RuntimeWorkflowTransitionReason;

  leaseOwner: string | null;
  leaseToken: string | null;
  leaseExpiresAt: string | null;
  heartbeatAt: string | null;

  lastMemoryId: string | null;
  lastEvtId: string | null;
  lastOpcProofId: string | null;
  lastAuditId: string | null;
  lastUsageId: string | null;

  interruptionReason: string | null;
  failureReason: string | null;
  completionReason: string | null;

  legalCertification: false;
};

export type RuntimeWorkflowTransitionInput = {
  operationId: string;

  fromStatus: RuntimeOperationStatus;
  toStatus: RuntimeOperationStatus;

  fromRecoveryStatus: RuntimeRecoveryStatus;
  toRecoveryStatus: RuntimeRecoveryStatus;

  fromCheckpoint: RuntimeWorkflowCheckpoint;
  toCheckpoint: RuntimeWorkflowCheckpoint;

  reason: RuntimeWorkflowTransitionReason;

  attemptCount: number;
  recoveryCount: number;
  maxAttempts: number;

  previousStateHash: string | null;
  previousChainHash: string | null;

  occurredAt?: string;

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
};

export type RuntimeWorkflowTransitionResult =
  | {
      ok: true;
      state: RuntimeWorkflowState;
      revision: string;
      error: null;
    }
  | {
      ok: false;
      state: null;
      revision: string;
      error: string;
    };

const ALLOWED_TRANSITIONS: Readonly<
  Record<RuntimeOperationStatus, readonly RuntimeOperationStatus[]>
> = {
  NEW: ["AUTHORIZED", "FAILED"],

  AUTHORIZED: [
    "RUNNING",
    "INTERRUPTED",
    "FAILED",
  ],

  RUNNING: [
    "MODEL_COMPLETED",
    "INTERRUPTED",
    "FAILED",
  ],

  MODEL_COMPLETED: [
    "LEDGER_PENDING",
    "INTERRUPTED",
    "FAILED",
  ],

  LEDGER_PENDING: [
    "LEDGER_COMMITTED",
    "INTERRUPTED",
    "FAILED",
  ],

  LEDGER_COMMITTED: [
    "COMPLETED",
    "INTERRUPTED",
    "FAILED",
  ],

  INTERRUPTED: [
    "RECOVERY_REQUIRED",
    "FAILED",
  ],

  RECOVERY_REQUIRED: [
    "RECOVERING",
    "FAILED",
  ],

  RECOVERING: [
    "RUNNING",
    "MODEL_COMPLETED",
    "LEDGER_PENDING",
    "LEDGER_COMMITTED",
    "COMPLETED",
    "COMPENSATED",
    "FAILED",
  ],

  COMPENSATED: [
    "FAILED",
    "COMPLETED",
  ],

  COMPLETED: [],

  FAILED: [],
};

const CHECKPOINT_ORDER: Readonly<
  Record<RuntimeWorkflowCheckpoint, number>
> = {
  NEW: 0,
  AUTHORIZED: 10,
  MODEL_CALL_STARTED: 20,
  MODEL_COMPLETED: 30,
  LEDGER_PENDING: 40,
  MEMORY_PERSISTED: 50,
  EVT_PERSISTED: 60,
  OPC_PERSISTED: 70,
  AUDIT_PERSISTED: 80,
  MODEL_USAGE_PERSISTED: 90,
  LEDGER_COMMITTED: 100,
  COMPLETED: 110,

  INTERRUPTED: 1000,
  RECOVERY_REQUIRED: 1010,
  RECOVERING: 1020,
  COMPENSATED: 1030,
  FAILED: 1040,
};

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

function isValidIsoTimestamp(
  value: string | null | undefined,
): boolean {
  if (!value) {
    return false;
  }

  return !Number.isNaN(Date.parse(value));
}

function isTerminalStatus(
  status: RuntimeOperationStatus,
): boolean {
  return (
    status === "COMPLETED" ||
    status === "FAILED"
  );
}

function isRecoveryStatus(
  status: RuntimeOperationStatus,
): boolean {
  return (
    status === "INTERRUPTED" ||
    status === "RECOVERY_REQUIRED" ||
    status === "RECOVERING" ||
    status === "COMPENSATED"
  );
}

function validateCounters(input: {
  attemptCount: number;
  recoveryCount: number;
  maxAttempts: number;
}): string | null {
  if (
    !Number.isInteger(input.attemptCount) ||
    input.attemptCount < 0
  ) {
    return "INVALID_ATTEMPT_COUNT";
  }

  if (
    !Number.isInteger(input.recoveryCount) ||
    input.recoveryCount < 0
  ) {
    return "INVALID_RECOVERY_COUNT";
  }

  if (
    !Number.isInteger(input.maxAttempts) ||
    input.maxAttempts <= 0
  ) {
    return "INVALID_MAX_ATTEMPTS";
  }

  if (
    input.attemptCount >
    input.maxAttempts
  ) {
    return "ATTEMPT_COUNT_EXCEEDS_MAX_ATTEMPTS";
  }

  return null;
}

function validateLease(input: {
  toStatus: RuntimeOperationStatus;
  toRecoveryStatus: RuntimeRecoveryStatus;
  leaseOwner?: string | null;
  leaseToken?: string | null;
  leaseExpiresAt?: string | null;
  heartbeatAt?: string | null;
}): string | null {
  const leaseRequired =
    input.toStatus === "RECOVERING" ||
    input.toRecoveryStatus ===
      "LEASE_ACQUIRED" ||
    input.toRecoveryStatus ===
      "RECOVERING";

  if (!leaseRequired) {
    return null;
  }

  if (
    !input.leaseOwner ||
    input.leaseOwner.trim().length === 0
  ) {
    return "RECOVERY_LEASE_OWNER_REQUIRED";
  }

  if (
    !input.leaseToken ||
    input.leaseToken.trim().length === 0
  ) {
    return "RECOVERY_LEASE_TOKEN_REQUIRED";
  }

  if (
    !isValidIsoTimestamp(
      input.leaseExpiresAt,
    )
  ) {
    return "RECOVERY_LEASE_EXPIRY_REQUIRED";
  }

  if (
    !isValidIsoTimestamp(
      input.heartbeatAt,
    )
  ) {
    return "RECOVERY_HEARTBEAT_REQUIRED";
  }

  const heartbeatTime =
    Date.parse(input.heartbeatAt!);

  const expiryTime =
    Date.parse(input.leaseExpiresAt!);

  if (expiryTime <= heartbeatTime) {
    return "RECOVERY_LEASE_ALREADY_EXPIRED";
  }

  return null;
}

function validateTransition(
  input: RuntimeWorkflowTransitionInput,
): string | null {
  if (
    !input.operationId ||
    input.operationId.trim().length === 0
  ) {
    return "OPERATION_ID_REQUIRED";
  }

  if (
    isTerminalStatus(input.fromStatus)
  ) {
    return "TERMINAL_STATE_TRANSITION_FORBIDDEN";
  }

  const allowedTargets =
    ALLOWED_TRANSITIONS[
      input.fromStatus
    ];

  if (
    !allowedTargets.includes(
      input.toStatus,
    )
  ) {
    return `INVALID_STATUS_TRANSITION:${input.fromStatus}->${input.toStatus}`;
  }

  const countersError =
    validateCounters(input);

  if (countersError) {
    return countersError;
  }

  if (
    input.toStatus === "RECOVERING" &&
    input.recoveryCount <= 0
  ) {
    return "RECOVERY_COUNT_REQUIRED";
  }

  if (
    input.toStatus === "COMPLETED" &&
    !input.completionReason
  ) {
    return "COMPLETION_REASON_REQUIRED";
  }

  if (
    input.toStatus === "FAILED" &&
    !input.failureReason
  ) {
    return "FAILURE_REASON_REQUIRED";
  }

  if (
    (
      input.toStatus === "INTERRUPTED" ||
      input.toStatus ===
        "RECOVERY_REQUIRED"
    ) &&
    !input.interruptionReason
  ) {
    return "INTERRUPTION_REASON_REQUIRED";
  }

  const leaseError =
    validateLease(input);

  if (leaseError) {
    return leaseError;
  }

  if (
    !isRecoveryStatus(
      input.toStatus,
    ) &&
    input.toCheckpoint !==
      "FAILED" &&
    input.toCheckpoint !==
      "COMPLETED"
  ) {
    const fromOrder =
      CHECKPOINT_ORDER[
        input.fromCheckpoint
      ];

    const toOrder =
      CHECKPOINT_ORDER[
        input.toCheckpoint
      ];

    if (toOrder < fromOrder) {
      return `CHECKPOINT_REGRESSION_FORBIDDEN:${input.fromCheckpoint}->${input.toCheckpoint}`;
    }
  }

  if (
    input.toStatus ===
      "LEDGER_COMMITTED" &&
    (
      !input.lastMemoryId ||
      !input.lastEvtId ||
      !input.lastOpcProofId ||
      !input.lastAuditId ||
      !input.lastUsageId
    )
  ) {
    return "LEDGER_COMMIT_REFERENCES_INCOMPLETE";
  }

  return null;
}

export function createInitialRuntimeWorkflowState(
  input: {
    operationId: string;
    occurredAt?: string;
    maxAttempts?: number;
  },
): RuntimeWorkflowState {
  const occurredAt =
    input.occurredAt ??
    new Date().toISOString();

  const maxAttempts =
    input.maxAttempts ?? 3;

  if (
    !input.operationId ||
    input.operationId.trim().length === 0
  ) {
    throw new Error(
      "OPERATION_ID_REQUIRED",
    );
  }

  if (
    !Number.isInteger(maxAttempts) ||
    maxAttempts <= 0
  ) {
    throw new Error(
      "INVALID_MAX_ATTEMPTS",
    );
  }

  const canonicalState = {
    operationId: input.operationId,
    operationStatus:
      "NEW" as const,
    recoveryStatus:
      "NOT_REQUIRED" as const,
    checkpoint:
      "NEW" as const,
    attemptCount: 0,
    recoveryCount: 0,
    maxAttempts,
    previousStateHash: null,
    lastTransitionAt:
      occurredAt,
    lastTransitionReason:
      "OPERATION_CREATED" as const,
    leaseOwner: null,
    leaseToken: null,
    leaseExpiresAt: null,
    heartbeatAt: null,
    lastMemoryId: null,
    lastEvtId: null,
    lastOpcProofId: null,
    lastAuditId: null,
    lastUsageId: null,
    interruptionReason: null,
    failureReason: null,
    completionReason: null,
    legalCertification:
      false as const,
  };

  const stateHash =
    sha256(
      stableJson(canonicalState),
    );

  const chainHash =
    sha256(
      stableJson({
        operationId:
          input.operationId,
        previousChainHash: null,
        previousStateHash: null,
        stateHash,
        occurredAt,
      }),
    );

  return {
    ...canonicalState,
    stateHash,
    chainHash,
  };
}

export function transitionRuntimeWorkflow(
  input: RuntimeWorkflowTransitionInput,
): RuntimeWorkflowTransitionResult {
  const validationError =
    validateTransition(input);

  if (validationError) {
    return {
      ok: false,
      state: null,
      revision:
        HBCE_RUNTIME_WORKFLOW_STATE_MACHINE_REVISION,
      error:
        validationError,
    };
  }

  const occurredAt =
    input.occurredAt ??
    new Date().toISOString();

  if (
    !isValidIsoTimestamp(
      occurredAt,
    )
  ) {
    return {
      ok: false,
      state: null,
      revision:
        HBCE_RUNTIME_WORKFLOW_STATE_MACHINE_REVISION,
      error:
        "INVALID_TRANSITION_TIMESTAMP",
    };
  }

  const canonicalState = {
    operationId:
      input.operationId,

    operationStatus:
      input.toStatus,

    recoveryStatus:
      input.toRecoveryStatus,

    checkpoint:
      input.toCheckpoint,

    attemptCount:
      input.attemptCount,

    recoveryCount:
      input.recoveryCount,

    maxAttempts:
      input.maxAttempts,

    previousStateHash:
      input.previousStateHash,

    lastTransitionAt:
      occurredAt,

    lastTransitionReason:
      input.reason,

    leaseOwner:
      input.leaseOwner ?? null,

    leaseToken:
      input.leaseToken ?? null,

    leaseExpiresAt:
      input.leaseExpiresAt ?? null,

    heartbeatAt:
      input.heartbeatAt ?? null,

    lastMemoryId:
      input.lastMemoryId ?? null,

    lastEvtId:
      input.lastEvtId ?? null,

    lastOpcProofId:
      input.lastOpcProofId ?? null,

    lastAuditId:
      input.lastAuditId ?? null,

    lastUsageId:
      input.lastUsageId ?? null,

    interruptionReason:
      input.interruptionReason ??
      null,

    failureReason:
      input.failureReason ?? null,

    completionReason:
      input.completionReason ??
      null,

    legalCertification:
      false as const,
  };

  const stateHash =
    sha256(
      stableJson(canonicalState),
    );

  const chainHash =
    sha256(
      stableJson({
        operationId:
          input.operationId,

        fromStatus:
          input.fromStatus,

        toStatus:
          input.toStatus,

        fromCheckpoint:
          input.fromCheckpoint,

        toCheckpoint:
          input.toCheckpoint,

        previousChainHash:
          input.previousChainHash,

        previousStateHash:
          input.previousStateHash,

        stateHash,

        occurredAt,

        reason:
          input.reason,
      }),
    );

  return {
    ok: true,

    state: {
      ...canonicalState,
      stateHash,
      chainHash,
    },

    revision:
      HBCE_RUNTIME_WORKFLOW_STATE_MACHINE_REVISION,

    error: null,
  };
}

export function canTransitionRuntimeWorkflow(
  fromStatus: RuntimeOperationStatus,
  toStatus: RuntimeOperationStatus,
): boolean {
  return ALLOWED_TRANSITIONS[
    fromStatus
  ].includes(toStatus);
}

export function getAllowedRuntimeWorkflowTransitions(
  status: RuntimeOperationStatus,
): readonly RuntimeOperationStatus[] {
  return [
    ...ALLOWED_TRANSITIONS[
      status
    ],
  ];
}

export function isRuntimeWorkflowTerminal(
  status: RuntimeOperationStatus,
): boolean {
  return isTerminalStatus(status);
}

export function shouldRuntimeWorkflowRecover(
  input: {
    operationStatus:
      RuntimeOperationStatus;

    recoveryStatus:
      RuntimeRecoveryStatus;

    heartbeatAt:
      string | null;

    leaseExpiresAt:
      string | null;

    now?: string;

    staleAfterMs?: number;
  },
): {
  recover: boolean;
  reason: string | null;
} {
  const now =
    input.now ??
    new Date().toISOString();

  const staleAfterMs =
    input.staleAfterMs ??
    60_000;

  if (
    isTerminalStatus(
      input.operationStatus,
    )
  ) {
    return {
      recover: false,
      reason:
        "TERMINAL_OPERATION",
    };
  }

  if (
    input.operationStatus ===
      "RECOVERY_REQUIRED"
  ) {
    return {
      recover: true,
      reason:
        "RECOVERY_ALREADY_REQUIRED",
    };
  }

  if (
    input.leaseExpiresAt &&
    isValidIsoTimestamp(
      input.leaseExpiresAt,
    ) &&
    Date.parse(
      input.leaseExpiresAt,
    ) <= Date.parse(now)
  ) {
    return {
      recover: true,
      reason:
        "LEASE_EXPIRED",
    };
  }

  if (
    input.heartbeatAt &&
    isValidIsoTimestamp(
      input.heartbeatAt,
    ) &&
    (
      Date.parse(now) -
      Date.parse(
        input.heartbeatAt,
      )
    ) >= staleAfterMs
  ) {
    return {
      recover: true,
      reason:
        "STALE_HEARTBEAT",
    };
  }

  if (
    input.operationStatus ===
      "INTERRUPTED" ||
    input.recoveryStatus ===
      "REQUIRED"
  ) {
    return {
      recover: true,
      reason:
        "INTERRUPTED_OPERATION",
    };
  }

  return {
    recover: false,
    reason: null,
  };
}

export function verifyRuntimeWorkflowStateHash(
  state: RuntimeWorkflowState,
): boolean {
  const {
    stateHash,
    chainHash: _chainHash,
    ...canonicalState
  } = state;

  const expected =
    sha256(
      stableJson(
        canonicalState,
      ),
    );

  return stateHash === expected;
}
