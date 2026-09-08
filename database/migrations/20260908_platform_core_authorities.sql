/*
 * HBCE Platform Core canonical Authority durable store.
 *
 * Boundary:
 *
 * - stores only already-canonical HBCE_CORE_AUTHORITY revisions;
 * - does not create or issue Authority;
 * - does not infer Authority from identity, IPR, EvidenceSet or registry;
 * - does not define cross-revision lifecycle semantics;
 * - preserves exact append-only canonical revisions.
 *
 * Canonical durable identity:
 *
 *   (authority_id, authority_version)
 *
 * Canonical payload commitment:
 *
 *   payload_sha256
 *
 * canonical_payload_preimage_utf8 is the exact deterministic UTF-8
 * representation defined by HBCE-PLATFORM-CORE-PAYLOAD-SHA256-v1,
 * containing the complete canonical Authority payload with only its
 * top-level payload_sha256 member omitted.
 *
 * Exact schema validation, canonical reconstruction and payload hash
 * verification remain application repository responsibilities.
 */

CREATE TABLE public.hbce_platform_core_authorities (
  authority_id TEXT
    NOT NULL,

  authority_version INTEGER
    NOT NULL,

  payload_sha256 TEXT
    NOT NULL,

  canonical_payload_preimage_utf8 TEXT
    NOT NULL,

  state TEXT
    NOT NULL,

  persisted_at TIMESTAMPTZ
    NOT NULL
    DEFAULT NOW(),

  CONSTRAINT hbce_platform_core_authorities_pkey
    PRIMARY KEY (
      authority_id,
      authority_version
    ),

  CONSTRAINT hbce_pc_authorities_payload_sha256_unique
    UNIQUE (
      payload_sha256
    ),

  CONSTRAINT hbce_pc_authorities_id_format
    CHECK (
      char_length(
        authority_id
      ) BETWEEN 5 AND 128
      AND authority_id
        ~ '^AUT-[0-9A-Z:_.-]+$'
    ),

  CONSTRAINT hbce_pc_authorities_version
    CHECK (
      authority_version >= 1
    ),

  CONSTRAINT hbce_pc_authorities_payload_sha256_format
    CHECK (
      payload_sha256
        ~ '^[0-9a-f]{64}$'
    ),

  CONSTRAINT hbce_pc_authorities_preimage_nonempty
    CHECK (
      octet_length(
        canonical_payload_preimage_utf8
      ) > 0
    ),

  CONSTRAINT hbce_pc_authorities_state
    CHECK (
      state IN (
        'DRAFT',
        'PENDING',
        'ACTIVE',
        'LIMITED',
        'SUSPENDED',
        'CONTESTED',
        'COMPROMISED',
        'EXPIRED',
        'REVOKED',
        'SUPERSEDED',
        'UNKNOWN'
      )
    )
);

/*
 * Database-level append-only protection.
 *
 * Exact duplicate persistence is reconciled by future repository logic.
 * Previously persisted canonical Authority revisions are never rewritten
 * or deleted.
 */

CREATE OR REPLACE FUNCTION
  public.hbce_pc_authorities_reject_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION
    'HBCE_PLATFORM_CORE_AUTHORITY_APPEND_ONLY';
END;
$$;

CREATE TRIGGER
  hbce_pc_authorities_reject_update
BEFORE UPDATE
ON public.hbce_platform_core_authorities
FOR EACH ROW
EXECUTE FUNCTION
  public.hbce_pc_authorities_reject_mutation();

CREATE TRIGGER
  hbce_pc_authorities_reject_delete
BEFORE DELETE
ON public.hbce_platform_core_authorities
FOR EACH ROW
EXECUTE FUNCTION
  public.hbce_pc_authorities_reject_mutation();
