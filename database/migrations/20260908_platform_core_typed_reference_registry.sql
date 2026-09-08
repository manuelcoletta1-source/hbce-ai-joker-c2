/*
 * HBCE Platform Core
 * Durable typed reference registry.
 *
 * Runtime trust/persistence infrastructure only.
 *
 * This table is NOT:
 *   - a canonical Platform Core object store;
 *   - an eleventh canonical kind;
 *   - the HBCE public REGISTRY;
 *   - an Authority store;
 *   - an EvidenceSet self-proof mechanism.
 *
 * Exact typed identity:
 *   (reference_type, reference)
 *
 * A registration commits to backing material through:
 *   backing_commitment_profile
 *   backing_commitment_sha256
 *
 * That commitment is runtime trust metadata and MUST NOT be interpreted
 * as Platform Core canonical payload_sha256.
 */

CREATE TABLE public.hbce_platform_core_typed_reference_registry (
  reference_type TEXT NOT NULL,
  reference TEXT NOT NULL,
  backing_commitment_profile TEXT NOT NULL,
  backing_commitment_sha256 TEXT NOT NULL,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT hbce_pc_typed_reference_registry_pkey
    PRIMARY KEY (
      reference_type,
      reference
    ),

  CONSTRAINT hbce_pc_typed_reference_registry_type_check
    CHECK (
      reference_type IN (
        'EVIDENCE',
        'CONTROL',
        'OBSERVATION',
        'RESULT',
        'ARTIFACT',
        'EXTERNAL_CONFIRMATION',
        'EVENT',
        'EVT',
        'OPC'
      )
    ),

  CONSTRAINT hbce_pc_typed_reference_registry_reference_length_check
    CHECK (
      char_length(reference)
        BETWEEN 3 AND 160
    ),

  CONSTRAINT hbce_pc_typed_reference_registry_reference_syntax_check
    CHECK (
      reference ~ '^[A-Z0-9_:\-.]+$'
    ),

  CONSTRAINT hbce_pc_typed_reference_registry_profile_length_check
    CHECK (
      char_length(backing_commitment_profile)
        BETWEEN 1 AND 160
    ),

  CONSTRAINT hbce_pc_typed_reference_registry_profile_trimmed_check
    CHECK (
      backing_commitment_profile =
        btrim(backing_commitment_profile)
    ),

  CONSTRAINT hbce_pc_typed_reference_registry_commitment_sha256_check
    CHECK (
      backing_commitment_sha256 ~ '^[0-9a-f]{64}$'
    )
);

/*
 * Typed reference registrations are append-only.
 *
 * Existing registrations must never be rewritten or deleted.
 */
CREATE OR REPLACE FUNCTION
  public.hbce_pc_typed_reference_registry_reject_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION
    'HBCE_PLATFORM_CORE_TYPED_REFERENCE_REGISTRY_APPEND_ONLY';
END;
$$;

CREATE TRIGGER
  hbce_pc_typed_reference_registry_reject_update
BEFORE UPDATE
ON public.hbce_platform_core_typed_reference_registry
FOR EACH ROW
EXECUTE FUNCTION
  public.hbce_pc_typed_reference_registry_reject_mutation();

CREATE TRIGGER
  hbce_pc_typed_reference_registry_reject_delete
BEFORE DELETE
ON public.hbce_platform_core_typed_reference_registry
FOR EACH ROW
EXECUTE FUNCTION
  public.hbce_pc_typed_reference_registry_reject_mutation();
