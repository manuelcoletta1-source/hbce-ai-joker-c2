/*
 * HERMETICUM B.C.E.
 * HBCE PLATFORM CORE
 *
 * Canonical EXECUTION terminal-v3 durable recovery journal.
 *
 * Protocol:
 * HBCE-PLATFORM-CORE-EXECUTION-TERMINAL-RECOVERY-REPOSITORY-v1
 *
 * This table is NOT the canonical EXECUTION object.
 *
 * It persists only the minimum durable facts required to reconstruct
 * exactly one canonical EXECUTING/v2 -> terminal/v3 transition after a
 * process crash.
 *
 * Invariants:
 *
 * - one terminal recovery record per execution_id;
 * - predecessor is exactly canonical EXECUTING version 2;
 * - terminal state is EXECUTED, FAILED or ABORTED;
 * - terminal_event_ref and completed_at become authoritative after commit;
 * - state_after is explicit and never inferred by the repository;
 * - records are append-only;
 * - no authorization consumption occurs here;
 * - no canonical EXECUTION v3 object is stored here;
 * - no OUTCOME, CONSEQUENCE, MATRIX or FEEDBACK object is created here.
 */

CREATE TABLE public.hbce_platform_core_execution_terminal_recovery (
  terminal_event_ref TEXT
    NOT NULL,

  execution_id TEXT
    PRIMARY KEY,

  predecessor_execution_version INTEGER
    NOT NULL,

  predecessor_payload_sha256 TEXT
    NOT NULL,

  target_state TEXT
    NOT NULL,

  completed_at TIMESTAMPTZ
    NOT NULL,

  state_after_observation_state TEXT
    NOT NULL,

  state_after_ref TEXT
    NULL,

  state_after_sha256 TEXT
    NULL,

  atomic BOOLEAN
    NOT NULL,

  created_at TIMESTAMPTZ
    NOT NULL
    DEFAULT NOW(),

  CONSTRAINT hbce_platform_core_execution_terminal_recovery_terminal_event_ref_unique
    UNIQUE (
      terminal_event_ref
    ),

  CONSTRAINT hbce_platform_core_execution_terminal_recovery_terminal_event_ref_format
    CHECK (
      terminal_event_ref
        ~ '^HBCE_EXE_TERM_EVT:[0-9A-F]{32}$'
    ),

  CONSTRAINT hbce_platform_core_execution_terminal_recovery_execution_id_format
    CHECK (
      char_length(execution_id)
        BETWEEN 5 AND 128
      AND execution_id
        ~ '^EXE-[0-9A-Z:_.-]+$'
    ),

  CONSTRAINT hbce_platform_core_execution_terminal_recovery_predecessor_version
    CHECK (
      predecessor_execution_version = 2
    ),

  CONSTRAINT hbce_platform_core_execution_terminal_recovery_predecessor_sha256
    CHECK (
      predecessor_payload_sha256
        ~ '^[0-9a-f]{64}$'
    ),

  CONSTRAINT hbce_platform_core_execution_terminal_recovery_target_state
    CHECK (
      target_state IN (
        'EXECUTED',
        'FAILED',
        'ABORTED'
      )
    ),

  CONSTRAINT hbce_platform_core_execution_terminal_recovery_state_after_observation
    CHECK (
      state_after_observation_state IN (
        'CAPTURED',
        'NOT_AVAILABLE',
        'UNKNOWN'
      )
    ),

  CONSTRAINT hbce_platform_core_execution_terminal_recovery_state_after_ref_format
    CHECK (
      state_after_ref IS NULL
      OR (
        char_length(state_after_ref)
          BETWEEN 3 AND 160
        AND state_after_ref
          ~ '^[A-Z0-9_:\.-]+$'
      )
    ),

  CONSTRAINT hbce_platform_core_execution_terminal_recovery_state_after_sha256
    CHECK (
      state_after_sha256 IS NULL
      OR state_after_sha256
        ~ '^[0-9a-f]{64}$'
    ),

  CONSTRAINT hbce_platform_core_execution_terminal_recovery_state_after_consistency
    CHECK (
      (
        state_after_observation_state = 'CAPTURED'
        AND state_after_ref IS NOT NULL
        AND state_after_sha256 IS NOT NULL
      )
      OR
      (
        state_after_observation_state IN (
          'NOT_AVAILABLE',
          'UNKNOWN'
        )
        AND state_after_ref IS NULL
        AND state_after_sha256 IS NULL
      )
    ),

  CONSTRAINT hbce_platform_core_execution_terminal_recovery_executed_state_after
    CHECK (
      target_state <> 'EXECUTED'
      OR state_after_observation_state = 'CAPTURED'
    ),

  CONSTRAINT hbce_platform_core_execution_terminal_recovery_atomic
    CHECK (
      atomic IS TRUE
    )
);

/*
 * Database-level append-only protection.
 *
 * The repository API will expose no UPDATE or DELETE operation, but the
 * durable relation itself also rejects mutation of committed rows.
 */

CREATE OR REPLACE FUNCTION
  public.hbce_platform_core_execution_terminal_recovery_reject_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION
    'HBCE_PLATFORM_CORE_EXECUTION_TERMINAL_RECOVERY_APPEND_ONLY';
END;
$$;

CREATE TRIGGER
  hbce_platform_core_execution_terminal_recovery_reject_update
BEFORE UPDATE
ON public.hbce_platform_core_execution_terminal_recovery
FOR EACH ROW
EXECUTE FUNCTION
  public.hbce_platform_core_execution_terminal_recovery_reject_mutation();

CREATE TRIGGER
  hbce_platform_core_execution_terminal_recovery_reject_delete
BEFORE DELETE
ON public.hbce_platform_core_execution_terminal_recovery
FOR EACH ROW
EXECUTE FUNCTION
  public.hbce_platform_core_execution_terminal_recovery_reject_mutation();
