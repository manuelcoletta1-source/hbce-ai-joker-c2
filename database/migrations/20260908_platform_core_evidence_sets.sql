/*
 * HERMETICUM B.C.E.
 * HBCE PLATFORM CORE
 *
 * Canonical EvidenceSet immutable revision store.
 *
 * Protocol:
 * HBCE-PLATFORM-CORE-EVIDENCE-SET-REPOSITORY-v1
 *
 * Durable identity:
 *
 *   (evidence_set_id, evidence_set_version)
 *
 * Canonical hash material is stored as:
 *
 *   payload_sha256
 *   canonical_payload_preimage_utf8
 *
 * canonical_payload_preimage_utf8 is the exact deterministic UTF-8
 * representation produced by the existing Platform Core canonical
 * payload canonicalizer before persistence.
 *
 * The canonical payload is intentionally not stored as JSONB.
 *
 * Hash-significant timestamps remain inside canonical payload text.
 * finalized_at_text is extracted only for durable lifecycle checks and
 * intentionally remains TEXT.
 *
 * The relation establishes durable revision identity, predecessor
 * existence, structural lifecycle constraints and append-only storage.
 *
 * It does not itself establish semantic truth or resolve external
 * canonical references.
 */

CREATE TABLE public.hbce_platform_core_evidence_sets (
  evidence_set_id TEXT
    NOT NULL,

  evidence_set_version INTEGER
    NOT NULL,

  payload_sha256 TEXT
    NOT NULL,

  canonical_payload_preimage_utf8 TEXT
    NOT NULL,

  state TEXT
    NOT NULL,

  case_id TEXT
    NOT NULL,

  domain TEXT
    NOT NULL,

  owner_subject_ref TEXT
    NOT NULL,

  authority_ref TEXT
    NOT NULL,

  authority_version INTEGER
    NOT NULL,

  authority_sha256 TEXT
    NOT NULL,

  result_reference TEXT
    NULL,

  finalized_at_text TEXT
    NULL,

  predecessor_evidence_set_version INTEGER
    NULL,

  predecessor_payload_sha256 TEXT
    NULL,

  persisted_at TIMESTAMPTZ
    NOT NULL
    DEFAULT NOW(),

  CONSTRAINT hbce_platform_core_evidence_sets_pkey
    PRIMARY KEY (
      evidence_set_id,
      evidence_set_version
    ),

  CONSTRAINT hbce_pc_evidence_sets_payload_sha256_unique
    UNIQUE (
      payload_sha256
    ),

  CONSTRAINT hbce_pc_evidence_sets_id_format
    CHECK (
      char_length(
        evidence_set_id
      ) BETWEEN 5 AND 128
      AND evidence_set_id
        ~ '^EVS-[0-9A-Z:_.-]+$'
    ),

  CONSTRAINT hbce_pc_evidence_sets_version
    CHECK (
      evidence_set_version >= 1
    ),

  CONSTRAINT hbce_pc_evidence_sets_payload_sha256_format
    CHECK (
      payload_sha256
        ~ '^[0-9a-f]{64}$'
    ),

  CONSTRAINT hbce_pc_evidence_sets_preimage_nonempty
    CHECK (
      octet_length(
        canonical_payload_preimage_utf8
      ) > 0
    ),

  CONSTRAINT hbce_pc_evidence_sets_state
    CHECK (
      state IN (
        'OPEN',
        'CLOSED'
      )
    ),

  CONSTRAINT hbce_pc_evidence_sets_case_id_format
    CHECK (
      char_length(
        case_id
      ) BETWEEN 3 AND 160
      AND case_id
        ~ '^[A-Z0-9_:.-]+$'
    ),

  CONSTRAINT hbce_pc_evidence_sets_domain_format
    CHECK (
      char_length(
        domain
      ) BETWEEN 3 AND 128
      AND domain
        ~ '^[a-z0-9][a-z0-9_:.-]*$'
    ),

  CONSTRAINT hbce_pc_evidence_sets_owner_subject_ref_format
    CHECK (
      char_length(
        owner_subject_ref
      ) BETWEEN 3 AND 160
      AND owner_subject_ref
        ~ '^[A-Z0-9_:.-]+$'
    ),

  CONSTRAINT hbce_pc_evidence_sets_authority_ref_format
    CHECK (
      char_length(
        authority_ref
      ) BETWEEN 5 AND 128
      AND authority_ref
        ~ '^AUT-[0-9A-Z:_.-]+$'
    ),

  CONSTRAINT hbce_pc_evidence_sets_authority_version
    CHECK (
      authority_version >= 1
    ),

  CONSTRAINT hbce_pc_evidence_sets_authority_sha256_format
    CHECK (
      authority_sha256
        ~ '^[0-9a-f]{64}$'
    ),

  CONSTRAINT hbce_pc_evidence_sets_result_ref_format
    CHECK (
      result_reference IS NULL
      OR (
        char_length(
          result_reference
        ) BETWEEN 3 AND 160
        AND result_reference
          ~ '^[A-Z0-9_:.-]+$'
      )
    ),

  CONSTRAINT hbce_pc_evidence_sets_finalized_text_nonempty
    CHECK (
      finalized_at_text IS NULL
      OR (
        octet_length(
          finalized_at_text
        ) > 0
        AND btrim(
          finalized_at_text
        ) = finalized_at_text
      )
    ),

  CONSTRAINT hbce_pc_evidence_sets_lifecycle
    CHECK (
      (
        state = 'OPEN'
        AND result_reference IS NULL
        AND finalized_at_text IS NULL
      )
      OR
      (
        state = 'CLOSED'
        AND result_reference IS NOT NULL
        AND finalized_at_text IS NOT NULL
      )
    ),

  CONSTRAINT hbce_pc_evidence_sets_predecessor_sha_format
    CHECK (
      predecessor_payload_sha256 IS NULL
      OR predecessor_payload_sha256
        ~ '^[0-9a-f]{64}$'
    ),

  CONSTRAINT hbce_pc_evidence_sets_revision_genealogy
    CHECK (
      (
        evidence_set_version = 1
        AND predecessor_evidence_set_version IS NULL
        AND predecessor_payload_sha256 IS NULL
      )
      OR
      (
        evidence_set_version > 1
        AND predecessor_evidence_set_version
          = evidence_set_version - 1
        AND predecessor_payload_sha256 IS NOT NULL
      )
    ),

  CONSTRAINT hbce_pc_evidence_sets_predecessor_fk
    FOREIGN KEY (
      evidence_set_id,
      predecessor_evidence_set_version
    )
    REFERENCES public.hbce_platform_core_evidence_sets (
      evidence_set_id,
      evidence_set_version
    )
    ON UPDATE RESTRICT
    ON DELETE RESTRICT
);

/*
 * Database-level append-only protection.
 *
 * Exact duplicate persistence is reconciled by repository logic.
 * Existing canonical revisions are never rewritten or deleted.
 */

CREATE OR REPLACE FUNCTION
  public.hbce_pc_evidence_sets_reject_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION
    'HBCE_PLATFORM_CORE_EVIDENCE_SET_APPEND_ONLY';
END;
$$;

CREATE TRIGGER
  hbce_pc_evidence_sets_reject_update
BEFORE UPDATE
ON public.hbce_platform_core_evidence_sets
FOR EACH ROW
EXECUTE FUNCTION
  public.hbce_pc_evidence_sets_reject_mutation();

CREATE TRIGGER
  hbce_pc_evidence_sets_reject_delete
BEFORE DELETE
ON public.hbce_platform_core_evidence_sets
FOR EACH ROW
EXECUTE FUNCTION
  public.hbce_pc_evidence_sets_reject_mutation();
