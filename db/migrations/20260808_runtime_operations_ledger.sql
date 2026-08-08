-- HERMETICUM B.C.E. S.r.l.
-- AI JOKER-C2
-- Runtime Operations Persistent Append-Only Ledger
-- Revision: HBCE-RUNTIME-OPERATIONS-LEDGER-DB-v1_0
--
-- Purpose:
--   Persist only hash-bound runtime operations evidence metadata.
--   Raw evidence payloads are intentionally excluded.
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

CREATE TABLE IF NOT EXISTS public.hbce_runtime_operations_ledger (
  sequence BIGINT PRIMARY KEY,

  entry_type TEXT NOT NULL,
  revision TEXT NOT NULL,

  runtime_ipr TEXT NOT NULL,
  human_authority_ipr TEXT NOT NULL,
  organization TEXT NOT NULL,

  evidence_revision TEXT NOT NULL,
  evidence_sha256 TEXT NOT NULL,

  envelope_revision TEXT NOT NULL,
  envelope_sha256 TEXT NOT NULL,

  internal_seal TEXT NOT NULL,

  event_type TEXT NOT NULL,
  source_revision TEXT NOT NULL,
  source_generated_at TIMESTAMPTZ NOT NULL,
  operational_status TEXT NOT NULL,

  verifier_revision TEXT NOT NULL,
  verified BOOLEAN NOT NULL,

  verification_total_checks INTEGER NOT NULL,
  verification_passed_checks INTEGER NOT NULL,
  verification_failed_checks INTEGER NOT NULL,

  previous_entry_sha256 TEXT NULL,
  entry_sha256 TEXT NOT NULL,
  chain_root_sha256 TEXT NOT NULL,

  append_only BOOLEAN NOT NULL,
  hash_only_evidence BOOLEAN NOT NULL,
  human_authorization_required BOOLEAN NOT NULL,
  autonomous_authorization BOOLEAN NOT NULL,
  runtime_activation BOOLEAN NOT NULL,
  no_submit_from_code BOOLEAN NOT NULL,
  legal_certification BOOLEAN NOT NULL,
  qualified_electronic_signature BOOLEAN NOT NULL,

  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT hbce_runtime_operations_ledger_sequence_positive
    CHECK (sequence > 0),

  CONSTRAINT hbce_runtime_operations_ledger_entry_type_canonical
    CHECK (
      entry_type =
      'HBCE_RUNTIME_OPERATIONS_APPEND_ONLY_LEDGER_ENTRY'
    ),

  CONSTRAINT hbce_runtime_operations_ledger_revision_canonical
    CHECK (
      revision =
      'HBCE-RUNTIME-OPERATIONS-LEDGER-v1_0'
    ),

  CONSTRAINT hbce_runtime_operations_ledger_runtime_ipr_canonical
    CHECK (runtime_ipr = 'IPR-AI-0001'),

  CONSTRAINT hbce_runtime_operations_ledger_human_ipr_canonical
    CHECK (human_authority_ipr = 'IPR-3'),

  CONSTRAINT hbce_runtime_operations_ledger_organization_canonical
    CHECK (
      organization =
      'HERMETICUM B.C.E. S.r.l.'
    ),

  CONSTRAINT hbce_runtime_operations_ledger_event_type_canonical
    CHECK (
      event_type =
      'RUNTIME_OPERATIONS_GOVERNANCE_EVIDENCE'
    ),

  CONSTRAINT hbce_runtime_operations_ledger_evidence_sha256_format
    CHECK (
      evidence_sha256 ~ '^[0-9a-f]{64}$'
    ),

  CONSTRAINT hbce_runtime_operations_ledger_envelope_sha256_format
    CHECK (
      envelope_sha256 ~ '^[0-9a-f]{64}$'
    ),

  CONSTRAINT hbce_runtime_operations_ledger_internal_seal_format
    CHECK (
      internal_seal ~ '^[0-9a-f]{64}$'
    ),

  CONSTRAINT hbce_runtime_operations_ledger_previous_sha256_format
    CHECK (
      previous_entry_sha256 IS NULL
      OR previous_entry_sha256 ~ '^[0-9a-f]{64}$'
    ),

  CONSTRAINT hbce_runtime_operations_ledger_entry_sha256_format
    CHECK (
      entry_sha256 ~ '^[0-9a-f]{64}$'
    ),

  CONSTRAINT hbce_runtime_operations_ledger_chain_root_sha256_format
    CHECK (
      chain_root_sha256 ~ '^[0-9a-f]{64}$'
    ),

  CONSTRAINT hbce_runtime_operations_ledger_verification_counts_valid
    CHECK (
      verification_total_checks >= 0
      AND verification_passed_checks >= 0
      AND verification_failed_checks >= 0
      AND verification_passed_checks
          + verification_failed_checks
          = verification_total_checks
    ),

  CONSTRAINT hbce_runtime_operations_ledger_verified_required
    CHECK (verified = TRUE),

  CONSTRAINT hbce_runtime_operations_ledger_zero_failed_checks
    CHECK (verification_failed_checks = 0),

  CONSTRAINT hbce_runtime_operations_ledger_append_only_required
    CHECK (append_only = TRUE),

  CONSTRAINT hbce_runtime_operations_ledger_hash_only_required
    CHECK (hash_only_evidence = TRUE),

  CONSTRAINT hbce_runtime_operations_ledger_human_authorization_required
    CHECK (human_authorization_required = TRUE),

  CONSTRAINT hbce_runtime_operations_ledger_autonomous_authorization_disabled
    CHECK (autonomous_authorization = FALSE),

  CONSTRAINT hbce_runtime_operations_ledger_runtime_activation_disabled
    CHECK (runtime_activation = FALSE),

  CONSTRAINT hbce_runtime_operations_ledger_no_submit_required
    CHECK (no_submit_from_code = TRUE),

  CONSTRAINT hbce_runtime_operations_ledger_legal_certification_disabled
    CHECK (legal_certification = FALSE),

  CONSTRAINT hbce_runtime_operations_ledger_qes_claim_disabled
    CHECK (qualified_electronic_signature = FALSE),

  CONSTRAINT hbce_runtime_operations_ledger_entry_sha256_unique
    UNIQUE (entry_sha256),

  CONSTRAINT hbce_runtime_operations_ledger_chain_root_sha256_unique
    UNIQUE (chain_root_sha256)
);

CREATE INDEX IF NOT EXISTS
  hbce_runtime_operations_ledger_source_generated_at_idx
ON public.hbce_runtime_operations_ledger (
  source_generated_at
);

CREATE INDEX IF NOT EXISTS
  hbce_runtime_operations_ledger_evidence_sha256_idx
ON public.hbce_runtime_operations_ledger (
  evidence_sha256
);

CREATE INDEX IF NOT EXISTS
  hbce_runtime_operations_ledger_envelope_sha256_idx
ON public.hbce_runtime_operations_ledger (
  envelope_sha256
);

CREATE OR REPLACE FUNCTION
  public.hbce_runtime_operations_ledger_validate_append()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_last_sequence BIGINT;
  v_last_entry_sha256 TEXT;
BEGIN
  PERFORM pg_advisory_xact_lock(
    hashtext(
      'HBCE_RUNTIME_OPERATIONS_LEDGER_APPEND_v1'
    )::BIGINT
  );

  SELECT
    sequence,
    entry_sha256
  INTO
    v_last_sequence,
    v_last_entry_sha256
  FROM public.hbce_runtime_operations_ledger
  ORDER BY sequence DESC
  LIMIT 1;

  IF v_last_sequence IS NULL THEN
    IF NEW.sequence <> 1 THEN
      RAISE EXCEPTION
        'HBCE_RUNTIME_OPERATIONS_LEDGER_GENESIS_SEQUENCE_REQUIRED'
        USING ERRCODE = '23514';
    END IF;

    IF NEW.previous_entry_sha256 IS NOT NULL THEN
      RAISE EXCEPTION
        'HBCE_RUNTIME_OPERATIONS_LEDGER_GENESIS_PREVIOUS_HASH_FORBIDDEN'
        USING ERRCODE = '23514';
    END IF;

    RETURN NEW;
  END IF;

  IF NEW.sequence <> v_last_sequence + 1 THEN
    RAISE EXCEPTION
      'HBCE_RUNTIME_OPERATIONS_LEDGER_SEQUENCE_DISCONTINUITY'
      USING
        ERRCODE = '23514',
        DETAIL = format(
          'Expected sequence %s, received %s.',
          v_last_sequence + 1,
          NEW.sequence
        );
  END IF;

  IF NEW.previous_entry_sha256 IS NULL THEN
    RAISE EXCEPTION
      'HBCE_RUNTIME_OPERATIONS_LEDGER_PREVIOUS_HASH_REQUIRED'
      USING ERRCODE = '23514';
  END IF;

  IF NEW.previous_entry_sha256 <> v_last_entry_sha256 THEN
    RAISE EXCEPTION
      'HBCE_RUNTIME_OPERATIONS_LEDGER_PREVIOUS_HASH_MISMATCH'
      USING
        ERRCODE = '23514',
        DETAIL = format(
          'Expected previous entry SHA-256 %s.',
          v_last_entry_sha256
        );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS
  hbce_runtime_operations_ledger_validate_append_trigger
ON public.hbce_runtime_operations_ledger;

CREATE TRIGGER
  hbce_runtime_operations_ledger_validate_append_trigger
BEFORE INSERT
ON public.hbce_runtime_operations_ledger
FOR EACH ROW
EXECUTE FUNCTION
  public.hbce_runtime_operations_ledger_validate_append();

CREATE OR REPLACE FUNCTION
  public.hbce_runtime_operations_ledger_reject_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION
    'HBCE_RUNTIME_OPERATIONS_LEDGER_APPEND_ONLY_VIOLATION'
    USING
      ERRCODE = '42501',
      DETAIL =
        'UPDATE, DELETE and TRUNCATE are forbidden on the append-only ledger.';
END;
$$;

DROP TRIGGER IF EXISTS
  hbce_runtime_operations_ledger_reject_update_delete_trigger
ON public.hbce_runtime_operations_ledger;

CREATE TRIGGER
  hbce_runtime_operations_ledger_reject_update_delete_trigger
BEFORE UPDATE OR DELETE
ON public.hbce_runtime_operations_ledger
FOR EACH ROW
EXECUTE FUNCTION
  public.hbce_runtime_operations_ledger_reject_mutation();

DROP TRIGGER IF EXISTS
  hbce_runtime_operations_ledger_reject_truncate_trigger
ON public.hbce_runtime_operations_ledger;

CREATE TRIGGER
  hbce_runtime_operations_ledger_reject_truncate_trigger
BEFORE TRUNCATE
ON public.hbce_runtime_operations_ledger
FOR EACH STATEMENT
EXECUTE FUNCTION
  public.hbce_runtime_operations_ledger_reject_mutation();

REVOKE UPDATE, DELETE, TRUNCATE
ON TABLE public.hbce_runtime_operations_ledger
FROM PUBLIC;

COMMENT ON TABLE public.hbce_runtime_operations_ledger IS
  'HBCE AI JOKER-C2 hash-only append-only Runtime Operations evidence ledger. '
  'Contains technical integrity metadata only. '
  'No raw evidence payload, no autonomous authorization, '
  'no runtime activation, no legal certification, '
  'and no qualified electronic signature claim.';

COMMENT ON COLUMN
  public.hbce_runtime_operations_ledger.recorded_at
IS
  'Database insertion timestamp. Not part of the runtime cryptographic chain.';

COMMIT;
