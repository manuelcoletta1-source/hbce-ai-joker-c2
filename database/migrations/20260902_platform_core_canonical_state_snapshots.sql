/*
 * HERMETICUM B.C.E.
 * HBCE PLATFORM CORE
 *
 * Immutable canonical observed-state content store.
 *
 * This relation stores content only.
 *
 * It does NOT store:
 *
 * - execution identity;
 * - observation-event identity;
 * - evidenceReference;
 * - observedAt;
 * - authorization information;
 * - OUTCOME, MATRIX or FEEDBACK material.
 *
 * state_ref and state_sha256 are derived from canonical_state_utf8 by
 * Platform Core application logic before persistence and are verified again
 * when content is read.
 */

CREATE TABLE public.hbce_platform_core_canonical_state_snapshots (
  state_ref TEXT
    PRIMARY KEY,

  state_sha256 TEXT
    NOT NULL
    UNIQUE,

  canonical_state_utf8 TEXT
    NOT NULL,

  created_at TIMESTAMPTZ
    NOT NULL
    DEFAULT NOW(),

  CONSTRAINT hbce_platform_core_canonical_state_snapshots_state_ref_format
    CHECK (
      state_ref
        ~ '^HBCE:STATE:OBSERVED:V1:SHA256:[0-9A-F]{64}$'
    ),

  CONSTRAINT hbce_platform_core_canonical_state_snapshots_state_sha256_format
    CHECK (
      state_sha256
        ~ '^[0-9a-f]{64}$'
    ),

  CONSTRAINT hbce_platform_core_canonical_state_snapshots_ref_hash_binding
    CHECK (
      lower(
        substring(
          state_ref
          FROM
          char_length(
            'HBCE:STATE:OBSERVED:V1:SHA256:'
          ) + 1
        )
      ) = state_sha256
    ),

  CONSTRAINT hbce_platform_core_canonical_state_snapshots_canonical_state_nonempty
    CHECK (
      octet_length(
        canonical_state_utf8
      ) > 0
    )
);

/*
 * Append-only durable protection.
 *
 * Exact duplicate persistence is reconciled by the repository as an
 * idempotent replay. Existing rows themselves are never rewritten.
 */

CREATE OR REPLACE FUNCTION
  public.hbce_platform_core_canonical_state_snapshots_reject_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION
    'HBCE_PLATFORM_CORE_CANONICAL_STATE_SNAPSHOT_APPEND_ONLY';
END;
$$;

CREATE TRIGGER
  hbce_platform_core_canonical_state_snapshots_reject_update
BEFORE UPDATE
ON public.hbce_platform_core_canonical_state_snapshots
FOR EACH ROW
EXECUTE FUNCTION
  public.hbce_platform_core_canonical_state_snapshots_reject_mutation();

CREATE TRIGGER
  hbce_platform_core_canonical_state_snapshots_reject_delete
BEFORE DELETE
ON public.hbce_platform_core_canonical_state_snapshots
FOR EACH ROW
EXECUTE FUNCTION
  public.hbce_platform_core_canonical_state_snapshots_reject_mutation();
