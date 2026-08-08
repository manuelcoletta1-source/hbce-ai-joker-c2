-- 🜏 HERMETICUM B.C.E. S.r.l.
-- AI JOKER-C2
-- Runtime Operations Ledger Idempotency Hardening
-- Revision: HBCE-RUNTIME-OPERATIONS-LEDGER-IDEMPOTENCY-DB-v1_0
--
-- Purpose:
--   Prevent duplicate persistence of the same verified evidence/envelope.
--   This migration adds database-level uniqueness so retries cannot create
--   duplicate ledger entries for the same cryptographic evidence.
--
-- Boundary:
--   This does not authorize runtime execution.
--   This does not create a legal certification or qualified signature.

BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.hbce_runtime_operations_ledger
    GROUP BY evidence_sha256
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION
      'HBCE_RUNTIME_OPERATIONS_LEDGER_DUPLICATE_EVIDENCE_PREEXISTS'
      USING
        ERRCODE = '23505',
        DETAIL =
          'Duplicate evidence_sha256 values exist. Migration fails closed.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.hbce_runtime_operations_ledger
    GROUP BY envelope_sha256
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION
      'HBCE_RUNTIME_OPERATIONS_LEDGER_DUPLICATE_ENVELOPE_PREEXISTS'
      USING
        ERRCODE = '23505',
        DETAIL =
          'Duplicate envelope_sha256 values exist. Migration fails closed.';
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname =
      'hbce_runtime_operations_ledger_evidence_sha256_unique'
      AND conrelid =
        'public.hbce_runtime_operations_ledger'::regclass
  ) THEN
    ALTER TABLE public.hbce_runtime_operations_ledger
      ADD CONSTRAINT
        hbce_runtime_operations_ledger_evidence_sha256_unique
      UNIQUE (evidence_sha256);
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname =
      'hbce_runtime_operations_ledger_envelope_sha256_unique'
      AND conrelid =
        'public.hbce_runtime_operations_ledger'::regclass
  ) THEN
    ALTER TABLE public.hbce_runtime_operations_ledger
      ADD CONSTRAINT
        hbce_runtime_operations_ledger_envelope_sha256_unique
      UNIQUE (envelope_sha256);
  END IF;
END;
$$;

COMMENT ON CONSTRAINT
  hbce_runtime_operations_ledger_evidence_sha256_unique
ON public.hbce_runtime_operations_ledger
IS
  '🜏 Idempotency boundary: the same evidence SHA-256 may be persisted only once.';

COMMENT ON CONSTRAINT
  hbce_runtime_operations_ledger_envelope_sha256_unique
ON public.hbce_runtime_operations_ledger
IS
  '🜏 Idempotency boundary: the same OPC/EVT envelope SHA-256 may be persisted only once.';

COMMIT;
