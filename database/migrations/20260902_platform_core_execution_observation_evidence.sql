/*
 * HERMETICUM B.C.E.
 * HBCE PLATFORM CORE
 *
 * Durable immutable execution-observation evidence.
 *
 * This relation stores provenance for one exact observation event.
 *
 * evidence_reference identifies the exact observation-event material.
 *
 * For CAPTURED observations, state_ref must already identify an immutable
 * canonical observed-state snapshot.
 *
 * observed_at is stored as TEXT intentionally.
 *
 * Its exact textual representation is hash-significant under:
 *
 * HBCE_PLATFORM_CORE_EXECUTION_OBSERVATION_EVIDENCE_V1_SHA256
 *
 * Therefore the database MUST NOT normalize observed_at into TIMESTAMPTZ.
 *
 * created_at is database metadata only and is not evidence hash material.
 */

CREATE TABLE public.hbce_platform_core_execution_observation_evidence (
  evidence_reference TEXT
    PRIMARY KEY,

  execution_id TEXT
    NOT NULL,

  execution_version SMALLINT
    NOT NULL,

  execution_sha256 TEXT
    NOT NULL,

  execution_engine_ref TEXT
    NOT NULL,

  enforcement_point_ref TEXT
    NOT NULL,

  terminal_state_observed TEXT
    NOT NULL,

  observation_state TEXT
    NOT NULL,

  state_ref TEXT
    NULL,

  state_sha256 TEXT
    NULL,

  observed_at TEXT
    NOT NULL,

  created_at TIMESTAMPTZ
    NOT NULL
    DEFAULT NOW(),

  CONSTRAINT hbce_pc_obs_evidence_ref_format
    CHECK (
      evidence_reference
        ~ '^HBCE:OBS:EVIDENCE:V1:SHA256:[0-9A-F]{64}$'
    ),

  CONSTRAINT hbce_pc_obs_evidence_execution_id_nonempty
    CHECK (
      octet_length(
        execution_id
      ) > 0
      AND btrim(
        execution_id
      ) = execution_id
    ),

  CONSTRAINT hbce_pc_obs_evidence_exec_version
    CHECK (
      execution_version = 2
    ),

  CONSTRAINT hbce_pc_obs_evidence_exec_sha_format
    CHECK (
      execution_sha256
        ~ '^[0-9a-f]{64}$'
    ),

  CONSTRAINT hbce_pc_obs_evidence_engine_ref_nonempty
    CHECK (
      octet_length(
        execution_engine_ref
      ) > 0
      AND btrim(
        execution_engine_ref
      ) = execution_engine_ref
    ),

  CONSTRAINT hbce_pc_obs_evidence_enforcement_ref_nonempty
    CHECK (
      octet_length(
        enforcement_point_ref
      ) > 0
      AND btrim(
        enforcement_point_ref
      ) = enforcement_point_ref
    ),

  CONSTRAINT hbce_pc_obs_evidence_terminal_state
    CHECK (
      terminal_state_observed IN (
        'EXECUTED',
        'FAILED',
        'ABORTED'
      )
    ),

  CONSTRAINT hbce_pc_obs_evidence_observation_state
    CHECK (
      observation_state IN (
        'CAPTURED',
        'NOT_AVAILABLE',
        'UNKNOWN'
      )
    ),

  CONSTRAINT hbce_pc_obs_evidence_state_material
    CHECK (
      (
        observation_state = 'CAPTURED'
        AND state_ref IS NOT NULL
        AND state_sha256 IS NOT NULL
      )
      OR
      (
        observation_state IN (
          'NOT_AVAILABLE',
          'UNKNOWN'
        )
        AND state_ref IS NULL
        AND state_sha256 IS NULL
      )
    ),

  CONSTRAINT hbce_pc_obs_evidence_executed_captured
    CHECK (
      terminal_state_observed <> 'EXECUTED'
      OR observation_state = 'CAPTURED'
    ),

  CONSTRAINT hbce_pc_obs_evidence_state_ref_format
    CHECK (
      state_ref IS NULL
      OR state_ref
        ~ '^HBCE:STATE:OBSERVED:V1:SHA256:[0-9A-F]{64}$'
    ),

  CONSTRAINT hbce_pc_obs_evidence_state_sha_format
    CHECK (
      state_sha256 IS NULL
      OR state_sha256
        ~ '^[0-9a-f]{64}$'
    ),

  CONSTRAINT hbce_pc_obs_evidence_state_ref_sha_binding
    CHECK (
      (
        state_ref IS NULL
        AND state_sha256 IS NULL
      )
      OR
      (
        state_ref IS NOT NULL
        AND state_sha256 IS NOT NULL
        AND lower(
          substring(
            state_ref
            FROM
            char_length(
              'HBCE:STATE:OBSERVED:V1:SHA256:'
            ) + 1
          )
        ) = state_sha256
      )
    ),

  CONSTRAINT hbce_pc_obs_evidence_observed_at_nonempty
    CHECK (
      octet_length(
        observed_at
      ) > 0
      AND btrim(
        observed_at
      ) = observed_at
    ),

  CONSTRAINT hbce_pc_obs_evidence_state_ref_fk
    FOREIGN KEY (
      state_ref
    )
    REFERENCES public.hbce_platform_core_canonical_state_snapshots (
      state_ref
    )
    ON UPDATE RESTRICT
    ON DELETE RESTRICT
);

/*
 * Append-only durable protection.
 *
 * Exact duplicate persistence is reconciled by repository logic as an
 * idempotent replay. Existing evidence rows are never rewritten.
 */

CREATE OR REPLACE FUNCTION
  public.hbce_pc_execution_observation_evidence_reject_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION
    'HBCE_PLATFORM_CORE_EXECUTION_OBSERVATION_EVIDENCE_APPEND_ONLY';
END;
$$;

CREATE TRIGGER
  hbce_pc_execution_observation_evidence_reject_update
BEFORE UPDATE
ON public.hbce_platform_core_execution_observation_evidence
FOR EACH ROW
EXECUTE FUNCTION
  public.hbce_pc_execution_observation_evidence_reject_mutation();

CREATE TRIGGER
  hbce_pc_execution_observation_evidence_reject_delete
BEFORE DELETE
ON public.hbce_platform_core_execution_observation_evidence
FOR EACH ROW
EXECUTE FUNCTION
  public.hbce_pc_execution_observation_evidence_reject_mutation();
