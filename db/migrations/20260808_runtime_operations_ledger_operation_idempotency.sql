-- HBCE Runtime Operations Ledger
-- Additive operation-level idempotency upgrade.
--
-- Purpose:
--   Prevent the same logical runtime operation from being appended more than once
--   even when a retry would rebuild Evidence / OPC envelopes with a new generatedAt.
--
-- Governance:
--   - additive migration
--   - existing ledger entries remain valid
--   - no destructive rewrite
--   - raw operation identifiers are not stored
--   - only SHA-256(operationId) is persisted
--   - uniqueness is enforced by PostgreSQL

BEGIN;

ALTER TABLE public.hbce_runtime_operations_ledger
  ADD COLUMN IF NOT EXISTS operation_id_sha256 TEXT;

COMMENT ON COLUMN public.hbce_runtime_operations_ledger.operation_id_sha256 IS
  'SHA-256 of the caller-supplied stable logical operation identifier. Raw operation identifiers are not persisted. NULL is permitted only for legacy entries created before the idempotency upgrade.';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'hbce_runtime_operations_ledger_operation_id_sha256_format_check'
      AND conrelid = 'public.hbce_runtime_operations_ledger'::regclass
  ) THEN
    ALTER TABLE public.hbce_runtime_operations_ledger
      ADD CONSTRAINT hbce_runtime_operations_ledger_operation_id_sha256_format_check
      CHECK (
        operation_id_sha256 IS NULL
        OR operation_id_sha256 ~ '^[0-9a-f]{64}$'
      );
  END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS
  hbce_runtime_operations_ledger_operation_id_sha256_unique
ON public.hbce_runtime_operations_ledger (operation_id_sha256)
WHERE operation_id_sha256 IS NOT NULL;

COMMIT;
