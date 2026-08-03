-- =============================================================================
-- HBCE / AI JOKER-C2
-- LEVEL 8: Crash Recovery, Durable State Machine and Workflow Resumption
-- UNEBDO OPENING: Durable runtime operation registry
-- legalCertification=false
-- =============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS runtime_operations (
  operation_id TEXT PRIMARY KEY,
  idempotency_key TEXT NOT NULL,

  tenant_id TEXT,
  workspace_id TEXT,
  subscription_id TEXT,

  human_ipr TEXT NOT NULL,
  runtime_ipr TEXT NOT NULL DEFAULT 'IPR-AI-0001',
  session_id TEXT NOT NULL,
  thread_id TEXT,
  request_id TEXT,

  workflow_kind TEXT NOT NULL DEFAULT 'HBCE_DURABLE_WORKFLOW',
  operation_status TEXT NOT NULL DEFAULT 'NEW',
  checkpoint TEXT NOT NULL DEFAULT 'NEW',
  recovery_status TEXT NOT NULL DEFAULT 'NOT_REQUIRED',

  lease_owner TEXT,
  lease_token TEXT,
  lease_acquired_at TIMESTAMPTZ,
  lease_expires_at TIMESTAMPTZ,
  heartbeat_at TIMESTAMPTZ,

  attempt_count INTEGER NOT NULL DEFAULT 0,
  recovery_count INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,

  input_hash TEXT,
  output_hash TEXT,
  policy_hash TEXT,
  state_hash TEXT NOT NULL,
  chain_hash TEXT,

  last_evt_id TEXT,
  last_opc_proof_id TEXT,
  last_audit_id TEXT,
  last_usage_id TEXT,
  last_memory_id TEXT,

  interruption_reason TEXT,
  failure_reason TEXT,
  completion_reason TEXT,

  started_at TIMESTAMPTZ,
  interrupted_at TIMESTAMPTZ,
  recovery_started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  state_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  checkpoint_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  recovery_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  trace_payload JSONB NOT NULL DEFAULT '{}'::jsonb,

  legal_certification BOOLEAN NOT NULL DEFAULT FALSE,

  CONSTRAINT runtime_operations_idempotency_key_not_blank
    CHECK (length(trim(idempotency_key)) > 0),

  CONSTRAINT runtime_operations_human_ipr_not_blank
    CHECK (length(trim(human_ipr)) > 0),

  CONSTRAINT runtime_operations_runtime_ipr_not_blank
    CHECK (length(trim(runtime_ipr)) > 0),

  CONSTRAINT runtime_operations_session_id_not_blank
    CHECK (length(trim(session_id)) > 0),

  CONSTRAINT runtime_operations_state_hash_not_blank
    CHECK (length(trim(state_hash)) > 0),

  CONSTRAINT runtime_operations_attempt_count_nonnegative
    CHECK (attempt_count >= 0),

  CONSTRAINT runtime_operations_recovery_count_nonnegative
    CHECK (recovery_count >= 0),

  CONSTRAINT runtime_operations_max_attempts_positive
    CHECK (max_attempts > 0),

  CONSTRAINT runtime_operations_attempt_count_bounded
    CHECK (attempt_count <= max_attempts),

  CONSTRAINT runtime_operations_legal_certification_false
    CHECK (legal_certification = FALSE),

  CONSTRAINT runtime_operations_status_valid
    CHECK (
      operation_status IN (
        'NEW',
        'AUTHORIZED',
        'RUNNING',
        'MODEL_COMPLETED',
        'LEDGER_PENDING',
        'LEDGER_COMMITTED',
        'INTERRUPTED',
        'RECOVERY_REQUIRED',
        'RECOVERING',
        'COMPENSATED',
        'COMPLETED',
        'FAILED'
      )
    ),

  CONSTRAINT runtime_operations_recovery_status_valid
    CHECK (
      recovery_status IN (
        'NOT_REQUIRED',
        'REQUIRED',
        'LEASE_PENDING',
        'LEASE_ACQUIRED',
        'RECOVERING',
        'RECOVERED',
        'COMPENSATION_REQUIRED',
        'COMPENSATED',
        'FAILED'
      )
    ),

  CONSTRAINT runtime_operations_lease_consistency
    CHECK (
      (
        lease_owner IS NULL
        AND lease_token IS NULL
        AND lease_acquired_at IS NULL
        AND lease_expires_at IS NULL
      )
      OR
      (
        lease_owner IS NOT NULL
        AND lease_token IS NOT NULL
        AND lease_acquired_at IS NOT NULL
        AND lease_expires_at IS NOT NULL
        AND lease_expires_at > lease_acquired_at
      )
    ),

  CONSTRAINT runtime_operations_completed_state_consistency
    CHECK (
      operation_status <> 'COMPLETED'
      OR completed_at IS NOT NULL
    ),

  CONSTRAINT runtime_operations_failed_state_consistency
    CHECK (
      operation_status <> 'FAILED'
      OR failed_at IS NOT NULL
    ),

  CONSTRAINT runtime_operations_interrupted_state_consistency
    CHECK (
      operation_status NOT IN ('INTERRUPTED', 'RECOVERY_REQUIRED')
      OR interrupted_at IS NOT NULL
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS
  runtime_operations_idempotency_scope_uidx
ON runtime_operations (
  COALESCE(tenant_id, ''),
  COALESCE(workspace_id, ''),
  idempotency_key
);

CREATE INDEX IF NOT EXISTS
  runtime_operations_status_idx
ON runtime_operations (operation_status, updated_at);

CREATE INDEX IF NOT EXISTS
  runtime_operations_recovery_scan_idx
ON runtime_operations (
  recovery_status,
  lease_expires_at,
  heartbeat_at,
  updated_at
)
WHERE operation_status IN (
  'RUNNING',
  'INTERRUPTED',
  'RECOVERY_REQUIRED',
  'RECOVERING'
);

CREATE INDEX IF NOT EXISTS
  runtime_operations_tenant_workspace_idx
ON runtime_operations (
  tenant_id,
  workspace_id,
  created_at DESC
);

CREATE INDEX IF NOT EXISTS
  runtime_operations_session_thread_idx
ON runtime_operations (
  session_id,
  thread_id,
  created_at DESC
);

CREATE INDEX IF NOT EXISTS
  runtime_operations_last_evt_idx
ON runtime_operations (last_evt_id)
WHERE last_evt_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS
  runtime_operations_last_opc_idx
ON runtime_operations (last_opc_proof_id)
WHERE last_opc_proof_id IS NOT NULL;

CREATE OR REPLACE FUNCTION hbce_runtime_operations_touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS
  runtime_operations_touch_updated_at
ON runtime_operations;

CREATE TRIGGER runtime_operations_touch_updated_at
BEFORE UPDATE ON runtime_operations
FOR EACH ROW
EXECUTE FUNCTION hbce_runtime_operations_touch_updated_at();

COMMENT ON TABLE runtime_operations IS
  'HBCE durable operation registry for crash recovery, workflow resumption, lease control and checkpoint persistence. Technical runtime evidence only; legalCertification=false.';

COMMENT ON COLUMN runtime_operations.operation_id IS
  'Canonical durable workflow operation identifier.';

COMMENT ON COLUMN runtime_operations.idempotency_key IS
  'Canonical request key used to prevent duplicate logical execution inside tenant/workspace scope.';

COMMENT ON COLUMN runtime_operations.checkpoint IS
  'Last durable workflow checkpoint successfully persisted.';

COMMENT ON COLUMN runtime_operations.lease_token IS
  'Opaque token required for exclusive recovery ownership.';

COMMENT ON COLUMN runtime_operations.heartbeat_at IS
  'Last worker liveness signal for abandoned-operation detection.';

COMMENT ON COLUMN runtime_operations.state_hash IS
  'Hash of the current canonical operation state.';

COMMENT ON COLUMN runtime_operations.chain_hash IS
  'Optional append-only state transition chain hash.';

COMMIT;
