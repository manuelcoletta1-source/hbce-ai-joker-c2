-- HBCE Runtime Level 9
-- External Effect Idempotency and Transactional Outbox
--
-- Artifact:
-- HBCE-RUNTIME-EXTERNAL-EFFECT-IDEMPOTENCY-SELF-TEST-v1_0
--
-- Boundary:
-- legalCertification=false
-- technicalRuntimeTestOnly=true
-- no raw model output
-- no personal data
-- fail closed

BEGIN;

CREATE TABLE IF NOT EXISTS runtime_operation_effects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    operation_id TEXT NOT NULL,
    idempotency_key TEXT NOT NULL,

    effect_type TEXT NOT NULL,
    effect_status TEXT NOT NULL DEFAULT 'PENDING',

    payload_hash TEXT NOT NULL,
    effect_hash TEXT NOT NULL,
    chain_hash TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,

    legal_certification BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT runtime_operation_effects_operation_fk
        FOREIGN KEY (operation_id)
        REFERENCES runtime_operations(operation_id)
        ON DELETE CASCADE,

    CONSTRAINT runtime_operation_effects_operation_type_unique
        UNIQUE (operation_id, effect_type),

    CONSTRAINT runtime_operation_effects_idempotency_type_unique
        UNIQUE (idempotency_key, effect_type),

    CONSTRAINT runtime_operation_effects_payload_hash_format
        CHECK (payload_hash ~ '^sha256:[a-f0-9]{64}$'),

    CONSTRAINT runtime_operation_effects_effect_hash_format
        CHECK (effect_hash ~ '^sha256:[a-f0-9]{64}$'),

    CONSTRAINT runtime_operation_effects_chain_hash_format
        CHECK (chain_hash ~ '^sha256:[a-f0-9]{64}$'),

    CONSTRAINT runtime_operation_effects_legal_boundary
        CHECK (legal_certification = FALSE),

    CONSTRAINT runtime_operation_effects_status_valid
        CHECK (
            effect_status IN (
                'PENDING',
                'COMMITTED',
                'RECONCILIATION_REQUIRED',
                'RECONCILED',
                'COMPLETED',
                'FAILED'
            )
        )
);

CREATE TABLE IF NOT EXISTS runtime_operation_outbox (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    operation_id TEXT NOT NULL,
    effect_id UUID NOT NULL,

    event_type TEXT NOT NULL,
    delivery_status TEXT NOT NULL DEFAULT 'PENDING',
    attempt_count INTEGER NOT NULL DEFAULT 0,

    payload_hash TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    delivered_at TIMESTAMPTZ,

    CONSTRAINT runtime_operation_outbox_operation_fk
        FOREIGN KEY (operation_id)
        REFERENCES runtime_operations(operation_id)
        ON DELETE CASCADE,

    CONSTRAINT runtime_operation_outbox_effect_fk
        FOREIGN KEY (effect_id)
        REFERENCES runtime_operation_effects(id)
        ON DELETE CASCADE,

    CONSTRAINT runtime_operation_outbox_operation_event_unique
        UNIQUE (operation_id, event_type),

    CONSTRAINT runtime_operation_outbox_payload_hash_format
        CHECK (payload_hash ~ '^sha256:[a-f0-9]{64}$'),

    CONSTRAINT runtime_operation_outbox_attempt_count_valid
        CHECK (attempt_count >= 0),

    CONSTRAINT runtime_operation_outbox_delivery_status_valid
        CHECK (
            delivery_status IN (
                'PENDING',
                'PROCESSING',
                'DELIVERED',
                'RETRY_REQUIRED',
                'FAILED'
            )
        )
);

CREATE TABLE IF NOT EXISTS runtime_operation_opc_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    operation_id TEXT NOT NULL,
    receipt_type TEXT NOT NULL,

    idempotency_key_hash TEXT NOT NULL,
    effect_hash TEXT NOT NULL,
    outbox_hash TEXT NOT NULL,
    final_state_hash TEXT NOT NULL,
    final_chain_hash TEXT NOT NULL,

    recovery_count INTEGER NOT NULL,
    attempt_count INTEGER NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ NOT NULL,

    legal_certification BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT runtime_operation_opc_receipts_operation_fk
        FOREIGN KEY (operation_id)
        REFERENCES runtime_operations(operation_id)
        ON DELETE CASCADE,

    CONSTRAINT runtime_operation_opc_receipts_operation_type_unique
        UNIQUE (operation_id, receipt_type),

    CONSTRAINT runtime_operation_opc_idempotency_hash_format
        CHECK (idempotency_key_hash ~ '^sha256:[a-f0-9]{64}$'),

    CONSTRAINT runtime_operation_opc_effect_hash_format
        CHECK (effect_hash ~ '^sha256:[a-f0-9]{64}$'),

    CONSTRAINT runtime_operation_opc_outbox_hash_format
        CHECK (outbox_hash ~ '^sha256:[a-f0-9]{64}$'),

    CONSTRAINT runtime_operation_opc_state_hash_format
        CHECK (final_state_hash ~ '^sha256:[a-f0-9]{64}$'),

    CONSTRAINT runtime_operation_opc_chain_hash_format
        CHECK (final_chain_hash ~ '^sha256:[a-f0-9]{64}$'),

    CONSTRAINT runtime_operation_opc_counts_valid
        CHECK (
            recovery_count >= 0
            AND attempt_count >= 0
        ),

    CONSTRAINT runtime_operation_opc_legal_boundary
        CHECK (legal_certification = FALSE)
);

CREATE INDEX IF NOT EXISTS runtime_operation_effects_operation_idx
    ON runtime_operation_effects (operation_id);

CREATE INDEX IF NOT EXISTS runtime_operation_effects_idempotency_idx
    ON runtime_operation_effects (idempotency_key);

CREATE INDEX IF NOT EXISTS runtime_operation_effects_status_idx
    ON runtime_operation_effects (effect_status);

CREATE INDEX IF NOT EXISTS runtime_operation_outbox_operation_idx
    ON runtime_operation_outbox (operation_id);

CREATE INDEX IF NOT EXISTS runtime_operation_outbox_effect_idx
    ON runtime_operation_outbox (effect_id);

CREATE INDEX IF NOT EXISTS runtime_operation_outbox_delivery_idx
    ON runtime_operation_outbox (delivery_status, created_at);

CREATE INDEX IF NOT EXISTS runtime_operation_opc_operation_idx
    ON runtime_operation_opc_receipts (operation_id);

COMMENT ON TABLE runtime_operation_effects IS
'Canonical persistent effects generated by durable HBCE runtime operations. Payload content is not retained; only deterministic SHA-256 hashes are stored.';

COMMENT ON TABLE runtime_operation_outbox IS
'Transactional outbox records paired atomically with runtime persistent effects. External delivery remains at-least-once and requires idempotent consumers.';

COMMENT ON TABLE runtime_operation_opc_receipts IS
'Internal technical OPC closure receipts. These records are not legal certifications.';

COMMENT ON COLUMN runtime_operation_effects.legal_certification IS
'Always false. This table records technical runtime evidence only.';

COMMENT ON COLUMN runtime_operation_opc_receipts.legal_certification IS
'Always false. OPC is an internal technical proof and compliance receipt, not a legal certification.';

COMMIT;
