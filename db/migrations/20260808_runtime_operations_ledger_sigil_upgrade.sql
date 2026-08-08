-- 🜏 HERMETICUM B.C.E. S.r.l.
-- AI JOKER-C2
-- Runtime Operations Persistent Ledger
-- Hermeticum Sigil Upgrade
--
-- Revision:
-- HBCE-RUNTIME-OPERATIONS-LEDGER-SIGIL-DB-v1_0
--
-- Purpose:
--   Bind the canonical HERMETICUM symbolic sigil to every
--   persistent Runtime Operations ledger entry.
--
-- Important:
--   The sigil is an identity marker only.
--   It is NOT a cryptographic signature.
--   It is NOT a qualified electronic signature.
--   It is NOT legal certification.
--
-- Governance:
--   APPEND_ONLY
--   HASH_ONLY
--   FAIL_CLOSED
--   HUMAN_AUTHORIZATION_REQUIRED
--   NO_RUNTIME_ACTIVATION
--   NO_SUBMIT_FROM_CODE
--   LEGAL_CERTIFICATION=false
--   QUALIFIED_ELECTRONIC_SIGNATURE=false

BEGIN;

ALTER TABLE public.hbce_runtime_operations_ledger
  ADD COLUMN IF NOT EXISTS hermeticum_sigil TEXT
  NOT NULL
  DEFAULT '🜏';

ALTER TABLE public.hbce_runtime_operations_ledger
  ALTER COLUMN hermeticum_sigil
  SET DEFAULT '🜏';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.hbce_runtime_operations_ledger
    WHERE hermeticum_sigil IS DISTINCT FROM '🜏'
  ) THEN
    RAISE EXCEPTION
      'HBCE_RUNTIME_OPERATIONS_LEDGER_INVALID_HERMETICUM_SIGIL'
      USING
        ERRCODE = '23514',
        DETAIL =
          'All persistent ledger entries must use the canonical HERMETICUM sigil.';
  END IF;
END;
$$;

ALTER TABLE public.hbce_runtime_operations_ledger
  ALTER COLUMN hermeticum_sigil
  SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname =
      'hbce_runtime_operations_ledger_hermeticum_sigil_canonical'
      AND conrelid =
        'public.hbce_runtime_operations_ledger'::regclass
  ) THEN
    ALTER TABLE public.hbce_runtime_operations_ledger
      ADD CONSTRAINT
        hbce_runtime_operations_ledger_hermeticum_sigil_canonical
      CHECK (hermeticum_sigil = '🜏');
  END IF;
END;
$$;

COMMENT ON COLUMN
  public.hbce_runtime_operations_ledger.hermeticum_sigil
IS
  '🜏 Canonical HERMETICUM symbolic identity marker. '
  'Not a cryptographic signature, qualified electronic signature, '
  'or legal certification.';

COMMIT;
