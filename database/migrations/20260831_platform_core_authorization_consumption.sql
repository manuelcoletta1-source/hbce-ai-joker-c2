-- HBCE Platform Core
-- Canonical Authorization Consumption Persistence
-- Revision: HBCE-PLATFORM-CORE-AUTHORIZATION-CONSUMPTION-DB-v1_0
--
-- P002 boundary:
-- - dedicated mutable authorization-consumption state
-- - dedicated immutable consumption events
-- - replay-key scoped
-- - exact authorization ref/version/hash binding
-- - SINGLE_USE and BOUNDED_USE
-- - append-only consumption evidence
-- - no external execution side effects
-- - no MATRIX transition
-- - no FEEDBACK generation
-- - no retroactive AUTHORIZATION payload mutation
--
-- Atomic consumption itself is performed by the runtime adapter inside
-- a PostgreSQL SERIALIZABLE transaction. This migration provides the
-- persistence invariants required by that adapter.

CREATE TABLE IF NOT EXISTS
public.hbce_platform_core_authorization_consumption_state (
  replay_key_sha256 TEXT PRIMARY KEY,

  authorization_ref TEXT NOT NULL,
  authorization_version TEXT NOT NULL,
  authorization_sha256 TEXT NOT NULL,

  replay_mode TEXT NOT NULL,
  max_uses INTEGER NOT NULL,

  usage_counter_ref TEXT,

  committed_consumption_count BIGINT NOT NULL DEFAULT 0,

  last_consumed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT
  hbce_pc_ac_state_replay_sha_fmt
  CHECK (
    replay_key_sha256 ~ '^[a-f0-9]{64}$'
  ),

  CONSTRAINT
  hbce_pc_ac_state_auth_ref_fmt
  CHECK (
    length(authorization_ref) BETWEEN 5 AND 128
    AND authorization_ref ~ '^AZN-[0-9A-Z:_.-]+$'
  ),

  CONSTRAINT
  hbce_pc_ac_state_auth_sha_fmt
  CHECK (
    authorization_sha256 ~ '^[a-f0-9]{64}$'
  ),

  CONSTRAINT
  hbce_pc_ac_state_mode_chk
  CHECK (
    replay_mode IN (
      'SINGLE_USE',
      'BOUNDED_USE'
    )
  ),

  CONSTRAINT
  hbce_pc_ac_state_max_uses_chk
  CHECK (
    max_uses >= 1
  ),

  CONSTRAINT
  hbce_pc_ac_state_single_use_chk
  CHECK (
    replay_mode <> 'SINGLE_USE'
    OR max_uses = 1
  ),

  CONSTRAINT
  hbce_pc_ac_state_counter_ref_fmt
  CHECK (
    usage_counter_ref IS NULL
    OR (
      length(usage_counter_ref) BETWEEN 3 AND 160
      AND usage_counter_ref ~ '^[A-Z0-9_:.-]+$'
    )
  ),

  CONSTRAINT
  hbce_pc_ac_state_count_nonneg_chk
  CHECK (
    committed_consumption_count >= 0
  ),

  CONSTRAINT
  hbce_pc_ac_state_count_bound_chk
  CHECK (
    committed_consumption_count <= max_uses
  ),

  CONSTRAINT
  hbce_pc_ac_state_last_time_chk
  CHECK (
    (
      committed_consumption_count = 0
      AND last_consumed_at IS NULL
    )
    OR
    (
      committed_consumption_count > 0
      AND last_consumed_at IS NOT NULL
    )
  ),

  CONSTRAINT
  hbce_pc_ac_state_binding_uq
  UNIQUE (
    replay_key_sha256,
    authorization_ref,
    authorization_version,
    authorization_sha256
  )
);

CREATE TABLE IF NOT EXISTS
public.hbce_platform_core_authorization_consumption_events (
  consumption_event_ref TEXT PRIMARY KEY,

  execution_id TEXT NOT NULL,

  consumption_index BIGINT NOT NULL,

  authorization_ref TEXT NOT NULL,
  authorization_version TEXT NOT NULL,
  authorization_sha256 TEXT NOT NULL,

  replay_key_sha256 TEXT NOT NULL,

  action_sha256 TEXT NOT NULL,
  request_sha256 TEXT NOT NULL,
  iospace_ref TEXT NOT NULL,

  usage_counter_ref TEXT,

  consumed_at TIMESTAMPTZ NOT NULL,

  atomic BOOLEAN NOT NULL,

  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT
  hbce_pc_ac_event_ref_fmt
  CHECK (
    length(consumption_event_ref) BETWEEN 3 AND 160
    AND consumption_event_ref ~ '^[A-Z0-9_:.-]+$'
  ),

  CONSTRAINT
  hbce_pc_ac_event_execution_fmt
  CHECK (
    length(execution_id) BETWEEN 5 AND 128
    AND execution_id ~ '^EXE-[0-9A-Z:_.-]+$'
  ),

  CONSTRAINT
  hbce_pc_ac_event_index_chk
  CHECK (
    consumption_index >= 1
  ),

  CONSTRAINT
  hbce_pc_ac_event_auth_ref_fmt
  CHECK (
    length(authorization_ref) BETWEEN 5 AND 128
    AND authorization_ref ~ '^AZN-[0-9A-Z:_.-]+$'
  ),

  CONSTRAINT
  hbce_pc_ac_event_auth_sha_fmt
  CHECK (
    authorization_sha256 ~ '^[a-f0-9]{64}$'
  ),

  CONSTRAINT
  hbce_pc_ac_event_replay_sha_fmt
  CHECK (
    replay_key_sha256 ~ '^[a-f0-9]{64}$'
  ),

  CONSTRAINT
  hbce_pc_ac_event_action_sha_fmt
  CHECK (
    action_sha256 ~ '^[a-f0-9]{64}$'
  ),

  CONSTRAINT
  hbce_pc_ac_event_request_sha_fmt
  CHECK (
    request_sha256 ~ '^[a-f0-9]{64}$'
  ),

  CONSTRAINT
  hbce_pc_ac_event_iospace_fmt
  CHECK (
    length(iospace_ref) BETWEEN 3 AND 160
    AND iospace_ref ~ '^[A-Z0-9_:.-]+$'
  ),

  CONSTRAINT
  hbce_pc_ac_event_counter_ref_fmt
  CHECK (
    usage_counter_ref IS NULL
    OR (
      length(usage_counter_ref) BETWEEN 3 AND 160
      AND usage_counter_ref ~ '^[A-Z0-9_:.-]+$'
    )
  ),

  CONSTRAINT
  hbce_pc_ac_event_atomic_chk
  CHECK (
    atomic = TRUE
  ),

  CONSTRAINT
  hbce_pc_ac_event_execution_uq
  UNIQUE (
    execution_id
  ),

  CONSTRAINT
  hbce_pc_ac_event_replay_index_uq
  UNIQUE (
    replay_key_sha256,
    consumption_index
  ),

  CONSTRAINT
  hbce_pc_ac_event_state_fk
  FOREIGN KEY (
    replay_key_sha256,
    authorization_ref,
    authorization_version,
    authorization_sha256
  )
  REFERENCES
  public.hbce_platform_core_authorization_consumption_state (
    replay_key_sha256,
    authorization_ref,
    authorization_version,
    authorization_sha256
  )
);

CREATE INDEX IF NOT EXISTS
hbce_platform_core_auth_consumption_state_authorization_idx
ON public.hbce_platform_core_authorization_consumption_state (
  authorization_ref,
  authorization_version,
  authorization_sha256
);

CREATE INDEX IF NOT EXISTS
hbce_platform_core_auth_consumption_events_authorization_idx
ON public.hbce_platform_core_authorization_consumption_events (
  authorization_ref,
  authorization_version,
  authorization_sha256
);

CREATE INDEX IF NOT EXISTS
hbce_platform_core_auth_consumption_events_replay_idx
ON public.hbce_platform_core_authorization_consumption_events (
  replay_key_sha256,
  consumption_index
);

CREATE INDEX IF NOT EXISTS
hbce_platform_core_auth_consumption_events_consumed_at_idx
ON public.hbce_platform_core_authorization_consumption_events (
  consumed_at
);

CREATE OR REPLACE FUNCTION
public.hbce_pc_ac_events_reject_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION
    'HBCE_PLATFORM_CORE_AUTHORIZATION_CONSUMPTION_EVENT_APPEND_ONLY_VIOLATION'
    USING ERRCODE = '55000';
END;
$$;

DROP TRIGGER IF EXISTS
hbce_pc_ac_events_reject_ud
ON public.hbce_platform_core_authorization_consumption_events;

CREATE TRIGGER
hbce_pc_ac_events_reject_ud
BEFORE UPDATE OR DELETE
ON public.hbce_platform_core_authorization_consumption_events
FOR EACH ROW
EXECUTE FUNCTION
public.hbce_pc_ac_events_reject_mutation();

DROP TRIGGER IF EXISTS
hbce_pc_ac_events_reject_truncate
ON public.hbce_platform_core_authorization_consumption_events;

CREATE TRIGGER
hbce_pc_ac_events_reject_truncate
BEFORE TRUNCATE
ON public.hbce_platform_core_authorization_consumption_events
FOR EACH STATEMENT
EXECUTE FUNCTION
public.hbce_pc_ac_events_reject_mutation();

COMMENT ON TABLE
public.hbce_platform_core_authorization_consumption_state
IS
'HBCE Platform Core mutable canonical authorization-consumption counter state. Replay-key scoped. Updated only inside governed transactional consumption.';

COMMENT ON TABLE
public.hbce_platform_core_authorization_consumption_events
IS
'HBCE Platform Core immutable append-only authorization-consumption evidence. A committed event proves one persisted consumption index only; it does not itself prove external execution success.';

COMMENT ON COLUMN
public.hbce_platform_core_authorization_consumption_events.atomic
IS
'Must be TRUE only for a consumption event persisted atomically with its canonical counter-state transition.';
