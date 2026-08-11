-- =============================================================================
-- HERMETICUM B.C.E. S.r.l.
-- AI JOKER-C2
--
-- HBCE Runtime Level 10
-- D001 - Persistent Delivery Domain
--
-- Artifact:
-- HBCE-RUNTIME-LEVEL-10-D001-DELIVERY-PERSISTENCE-v1_0
--
-- Scope:
-- - physical persistence for Delivery
-- - physical persistence for DeliveryAttempt
-- - no worker implementation
-- - no retry implementation
-- - no webhook implementation
-- - no scheduler implementation
-- - no dead-letter queue implementation
-- - no real external delivery
-- - no raw request/response body persistence
-- - legalCertification=false
-- =============================================================================

BEGIN;

-- =============================================================================
-- Canonical Delivery
-- =============================================================================

CREATE TABLE IF NOT EXISTS runtime_deliveries (
    delivery_id TEXT PRIMARY KEY,

    operation_id TEXT NOT NULL,
    outbox_id TEXT NOT NULL,

    tenant_id TEXT NOT NULL,
    workspace_id TEXT NOT NULL,
    subject_ipr TEXT NOT NULL,
    idempotency_key TEXT NOT NULL,

    destination_type TEXT NOT NULL,
    destination_ref TEXT NOT NULL,

    delivery_status TEXT NOT NULL DEFAULT 'PENDING',
    attempt_count INTEGER NOT NULL DEFAULT 0,

    last_attempt_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,

    last_error_code TEXT,
    last_error_message_hash TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    legal_certification BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT runtime_deliveries_operation_fk
        FOREIGN KEY (operation_id)
        REFERENCES runtime_operations(operation_id)
        ON DELETE CASCADE,

    CONSTRAINT runtime_deliveries_operation_unique
        UNIQUE (operation_id),

    CONSTRAINT runtime_deliveries_outbox_unique
        UNIQUE (outbox_id),

    CONSTRAINT runtime_deliveries_delivery_id_not_blank
        CHECK (length(trim(delivery_id)) > 0),

    CONSTRAINT runtime_deliveries_operation_id_not_blank
        CHECK (length(trim(operation_id)) > 0),

    CONSTRAINT runtime_deliveries_outbox_id_not_blank
        CHECK (length(trim(outbox_id)) > 0),

    CONSTRAINT runtime_deliveries_tenant_id_not_blank
        CHECK (length(trim(tenant_id)) > 0),

    CONSTRAINT runtime_deliveries_workspace_id_not_blank
        CHECK (length(trim(workspace_id)) > 0),

    CONSTRAINT runtime_deliveries_subject_ipr_not_blank
        CHECK (length(trim(subject_ipr)) > 0),

    CONSTRAINT runtime_deliveries_idempotency_key_not_blank
        CHECK (length(trim(idempotency_key)) > 0),

    CONSTRAINT runtime_deliveries_destination_type_not_blank
        CHECK (length(trim(destination_type)) > 0),

    CONSTRAINT runtime_deliveries_destination_ref_not_blank
        CHECK (length(trim(destination_ref)) > 0),

    CONSTRAINT runtime_deliveries_attempt_count_nonnegative
        CHECK (attempt_count >= 0),

    CONSTRAINT runtime_deliveries_status_valid
        CHECK (
            delivery_status IN (
                'PENDING',
                'IN_FLIGHT',
                'DELIVERED',
                'FAILED'
            )
        ),

    CONSTRAINT runtime_deliveries_legal_boundary
        CHECK (legal_certification = FALSE)
);

-- =============================================================================
-- Append-only DeliveryAttempt
-- =============================================================================

CREATE TABLE IF NOT EXISTS runtime_delivery_attempts (
    attempt_id TEXT PRIMARY KEY,

    delivery_id TEXT NOT NULL,
    attempt_number INTEGER NOT NULL,

    worker_id TEXT NOT NULL,
    lease_token TEXT NOT NULL,

    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,

    request_hash TEXT,
    response_code INTEGER,
    response_hash TEXT,

    outcome TEXT,
    error_class TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    legal_certification BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT runtime_delivery_attempts_delivery_fk
        FOREIGN KEY (delivery_id)
        REFERENCES runtime_deliveries(delivery_id)
        ON DELETE CASCADE,

    CONSTRAINT runtime_delivery_attempts_delivery_number_unique
        UNIQUE (delivery_id, attempt_number),

    CONSTRAINT runtime_delivery_attempts_attempt_id_not_blank
        CHECK (length(trim(attempt_id)) > 0),

    CONSTRAINT runtime_delivery_attempts_delivery_id_not_blank
        CHECK (length(trim(delivery_id)) > 0),

    CONSTRAINT runtime_delivery_attempts_attempt_number_positive
        CHECK (attempt_number >= 1),

    CONSTRAINT runtime_delivery_attempts_worker_id_not_blank
        CHECK (length(trim(worker_id)) > 0),

    CONSTRAINT runtime_delivery_attempts_lease_token_not_blank
        CHECK (length(trim(lease_token)) > 0),

    CONSTRAINT runtime_delivery_attempts_response_code_valid
        CHECK (
            response_code IS NULL
            OR response_code BETWEEN 100 AND 599
        ),

    CONSTRAINT runtime_delivery_attempts_legal_boundary
        CHECK (legal_certification = FALSE)
);

-- =============================================================================
-- Lookup / durability indexes
-- =============================================================================

CREATE INDEX IF NOT EXISTS runtime_deliveries_operation_idx
    ON runtime_deliveries (operation_id);

CREATE INDEX IF NOT EXISTS runtime_deliveries_outbox_idx
    ON runtime_deliveries (outbox_id);

CREATE INDEX IF NOT EXISTS runtime_deliveries_idempotency_idx
    ON runtime_deliveries (
        tenant_id,
        workspace_id,
        idempotency_key
    );

CREATE INDEX IF NOT EXISTS runtime_deliveries_status_idx
    ON runtime_deliveries (
        delivery_status,
        updated_at
    );

CREATE INDEX IF NOT EXISTS runtime_deliveries_subject_idx
    ON runtime_deliveries (
        subject_ipr,
        created_at
    );

CREATE INDEX IF NOT EXISTS runtime_delivery_attempts_delivery_idx
    ON runtime_delivery_attempts (
        delivery_id,
        attempt_number
    );

CREATE INDEX IF NOT EXISTS runtime_delivery_attempts_created_idx
    ON runtime_delivery_attempts (
        delivery_id,
        created_at
    );

-- =============================================================================
-- Technical boundary documentation
-- =============================================================================

COMMENT ON TABLE runtime_deliveries IS
'Canonical persistent HBCE Runtime Level 10 D001 delivery records. Records bind a durable runtime operation to an opaque destination reference. No real external delivery is performed by this schema. Technical runtime persistence only; legalCertification=false.';

COMMENT ON TABLE runtime_delivery_attempts IS
'Append-only HBCE Runtime Level 10 D001 delivery attempt evidence. Stores identifiers, timestamps, outcome metadata and request/response hashes only. Raw request and response bodies are outside this persistence contract. Technical runtime evidence only; legalCertification=false.';

COMMENT ON COLUMN runtime_deliveries.outbox_id IS
'Canonical D001 outbox identifier represented as TEXT to preserve the Delivery domain contract. Physical FK binding to runtime_operation_outbox is intentionally deferred to the explicit Level 10 Outbox integration mutation.';

COMMENT ON COLUMN runtime_deliveries.destination_ref IS
'Opaque destination reference. Secrets, authorization headers, API keys and raw credential material must not be persisted here.';

COMMENT ON COLUMN runtime_deliveries.last_error_message_hash IS
'Optional hash/reference for the last delivery error message. Raw error message persistence is outside the D001 persistence boundary.';

COMMENT ON COLUMN runtime_delivery_attempts.request_hash IS
'Optional request representation hash. Raw request bodies are forbidden by the D001 domain boundary.';

COMMENT ON COLUMN runtime_delivery_attempts.response_hash IS
'Optional response representation hash. Raw response bodies are forbidden by the D001 domain boundary.';

COMMENT ON COLUMN runtime_deliveries.legal_certification IS
'Always false. D001 persistence is technical runtime evidence and does not constitute legal certification.';

COMMENT ON COLUMN runtime_delivery_attempts.legal_certification IS
'Always false. DeliveryAttempt evidence is technical runtime evidence and does not constitute legal certification.';

COMMIT;
