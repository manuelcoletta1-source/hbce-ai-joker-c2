/**
 * HERMETICUM B.C.E. S.r.l.
 *
 * HBCE Runtime Level 10
 * D001 - Neon/PostgreSQL Delivery Repository
 *
 * Revision:
 * HBCE-RUNTIME-LEVEL-10-D001-NEON-DELIVERY-REPOSITORY-v1_0
 *
 * Scope:
 * - PostgreSQL/Neon repository implementation;
 * - physical persistence adapter for Delivery;
 * - physical persistence adapter for DeliveryAttempt;
 * - parameterized SQL only;
 * - append-only DeliveryAttempt persistence;
 * - no workers;
 * - no retries;
 * - no webhooks;
 * - no schedulers;
 * - no dead-letter queues;
 * - no real external delivery;
 * - legalCertification=false.
 */

import type {
  HbceDeliveryAttemptRecord,
  HbceDeliveryRecord,
  HbceDeliveryStatus,
} from "./hbce-level10-delivery-domain";

import {
  AbstractHbceDeliveryRepository,
  type HbceDeliverySearchCriteria,
  type HbceSyntheticCleanupResult,
} from "./hbce-level10-delivery-repository";

export const HBCE_LEVEL_10_D001_NEON_REPOSITORY_REVISION =
  "HBCE-RUNTIME-LEVEL-10-D001-NEON-DELIVERY-REPOSITORY-v1_0" as const;

export interface HbceDeliveryDatabaseQueryResult<
  Row = Record<string, unknown>,
> {
  rows: Row[];
  rowCount?: number | null;
}

export interface HbceDeliveryDatabaseClient {
  query<Row = Record<string, unknown>>(
    text: string,
    values?: readonly unknown[],
  ): Promise<HbceDeliveryDatabaseQueryResult<Row>>;

  release(): void;
}

export interface HbceDeliveryDatabasePool {
  query<Row = Record<string, unknown>>(
    text: string,
    values?: readonly unknown[],
  ): Promise<HbceDeliveryDatabaseQueryResult<Row>>;

  connect(): Promise<HbceDeliveryDatabaseClient>;
}

interface DeliveryRow {
  delivery_id: string;

  operation_id: string;
  outbox_id: string;

  tenant_id: string;
  workspace_id: string;
  subject_ipr: string;
  idempotency_key: string;

  destination_type: string;
  destination_ref: string;

  delivery_status: HbceDeliveryStatus;
  attempt_count: number;

  last_attempt_at: Date | string | null;
  delivered_at: Date | string | null;

  last_error_code: string | null;
  last_error_message_hash: string | null;

  created_at: Date | string;
  updated_at: Date | string;

  legal_certification: false;
}

interface DeliveryAttemptRow {
  attempt_id: string;

  delivery_id: string;
  attempt_number: number;

  worker_id: string;
  lease_token: string;

  started_at: Date | string;
  completed_at: Date | string | null;

  request_hash: string | null;
  response_code: number | null;
  response_hash: string | null;

  outcome: string | null;
  error_class: string | null;

  created_at: Date | string;

  legal_certification: false;
}

export class HbceDeliveryNeonRepositoryError extends Error {
  readonly code: string;

  constructor(
    code: string,
    message: string,
  ) {
    super(message);
    this.name = "HbceDeliveryNeonRepositoryError";
    this.code = code;
  }
}

function requireNonEmptyIdentifier(
  value: unknown,
  fieldName: string,
): asserts value is string {
  if (
    typeof value !== "string" ||
    value.trim().length === 0
  ) {
    throw new HbceDeliveryNeonRepositoryError(
      "HBCE_DELIVERY_REPOSITORY_INVALID_IDENTIFIER",
      `${fieldName} must be a non-empty string`,
    );
  }
}

function toIsoTimestamp(
  value: Date | string,
): string {
  if (value instanceof Date) {
    return value.toISOString();
  }

  const parsed = new Date(value);

  if (!Number.isFinite(parsed.getTime())) {
    throw new HbceDeliveryNeonRepositoryError(
      "HBCE_DELIVERY_REPOSITORY_INVALID_TIMESTAMP",
      `Invalid persisted timestamp: ${String(value)}`,
    );
  }

  return parsed.toISOString();
}

function toNullableIsoTimestamp(
  value: Date | string | null,
): string | null {
  if (value === null) {
    return null;
  }

  return toIsoTimestamp(value);
}

function requireSingleRow<Row>(
  result: HbceDeliveryDatabaseQueryResult<Row>,
  code: string,
  message: string,
): Row {
  const row = result.rows[0];

  if (!row) {
    throw new HbceDeliveryNeonRepositoryError(
      code,
      message,
    );
  }

  return row;
}

function mapDelivery(
  row: DeliveryRow,
): HbceDeliveryRecord {
  return Object.freeze({
    deliveryId: row.delivery_id,
    operationId: row.operation_id,
    outboxId: row.outbox_id,

    tenantId: row.tenant_id,
    workspaceId: row.workspace_id,
    subjectIpr: row.subject_ipr,
    idempotencyKey: row.idempotency_key,

    destinationType: row.destination_type,
    destinationRef: row.destination_ref,

    status: row.delivery_status,
    attemptCount: Number(row.attempt_count),

    lastAttemptAt:
      toNullableIsoTimestamp(row.last_attempt_at),

    deliveredAt:
      toNullableIsoTimestamp(row.delivered_at),

    lastErrorCode: row.last_error_code,

    lastErrorMessageHash:
      row.last_error_message_hash,

    createdAt:
      toIsoTimestamp(row.created_at),

    updatedAt:
      toIsoTimestamp(row.updated_at),
  });
}

function mapAttempt(
  row: DeliveryAttemptRow,
): HbceDeliveryAttemptRecord {
  return Object.freeze({
    attemptId: row.attempt_id,
    deliveryId: row.delivery_id,
    attemptNumber: Number(row.attempt_number),

    workerId: row.worker_id,
    leaseToken: row.lease_token,

    startedAt:
      toIsoTimestamp(row.started_at),

    completedAt:
      toNullableIsoTimestamp(row.completed_at),

    requestHash: row.request_hash,
    responseCode:
      row.response_code === null
        ? null
        : Number(row.response_code),

    responseHash: row.response_hash,

    outcome: row.outcome,
    errorClass: row.error_class,

    createdAt:
      toIsoTimestamp(row.created_at),
  });
}

function databaseErrorCode(
  error: unknown,
): string | null {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error
  ) {
    const code = (error as { code?: unknown }).code;

    return typeof code === "string"
      ? code
      : null;
  }

  return null;
}

function databaseConstraint(
  error: unknown,
): string | null {
  if (
    typeof error === "object" &&
    error !== null &&
    "constraint" in error
  ) {
    const constraint =
      (error as { constraint?: unknown }).constraint;

    return typeof constraint === "string"
      ? constraint
      : null;
  }

  return null;
}

function normalizeDatabaseError(
  error: unknown,
): HbceDeliveryNeonRepositoryError {
  if (
    error instanceof
    HbceDeliveryNeonRepositoryError
  ) {
    return error;
  }

  const code = databaseErrorCode(error);
  const constraint = databaseConstraint(error);

  if (code === "23505") {
    switch (constraint) {
      case "runtime_deliveries_pkey":
        return new HbceDeliveryNeonRepositoryError(
          "HBCE_DELIVERY_ID_ALREADY_EXISTS",
          "Delivery identifier already exists",
        );

      case "runtime_deliveries_operation_unique":
        return new HbceDeliveryNeonRepositoryError(
          "HBCE_DELIVERY_OPERATION_ALREADY_BOUND",
          "Operation already has a canonical delivery",
        );

      case "runtime_deliveries_outbox_unique":
        return new HbceDeliveryNeonRepositoryError(
          "HBCE_DELIVERY_OUTBOX_ALREADY_BOUND",
          "Outbox already has a canonical delivery",
        );

      case "runtime_delivery_attempts_pkey":
        return new HbceDeliveryNeonRepositoryError(
          "HBCE_DELIVERY_ATTEMPT_ID_ALREADY_EXISTS",
          "DeliveryAttempt identifier already exists",
        );

      case "runtime_delivery_attempts_delivery_number_unique":
        return new HbceDeliveryNeonRepositoryError(
          "HBCE_DELIVERY_ATTEMPT_ALREADY_EXISTS",
          "Delivery attempt number already exists",
        );

      default:
        return new HbceDeliveryNeonRepositoryError(
          "HBCE_DELIVERY_REPOSITORY_UNIQUE_CONSTRAINT_VIOLATION",
          "Delivery persistence unique constraint violation",
        );
    }
  }

  if (code === "23503") {
    return new HbceDeliveryNeonRepositoryError(
      "HBCE_DELIVERY_REPOSITORY_FOREIGN_KEY_VIOLATION",
      "Delivery persistence foreign-key boundary violation",
    );
  }

  if (code === "23514") {
    return new HbceDeliveryNeonRepositoryError(
      "HBCE_DELIVERY_REPOSITORY_CHECK_CONSTRAINT_VIOLATION",
      "Delivery persistence check constraint violation",
    );
  }

  return new HbceDeliveryNeonRepositoryError(
    "HBCE_DELIVERY_REPOSITORY_DATABASE_ERROR",
    error instanceof Error
      ? error.message
      : String(error),
  );
}

/**
 * Persistent Neon/PostgreSQL implementation of the canonical
 * HBCE Level 10 D001 Delivery Repository contract.
 *
 * The adapter assumes that the D001 migration has already been
 * applied to the target database.
 */
export class NeonHbceDeliveryRepository
  extends AbstractHbceDeliveryRepository {

  constructor(
    private readonly pool:
      HbceDeliveryDatabasePool,
  ) {
    super();
  }

  async createDelivery(
    delivery: HbceDeliveryRecord,
  ): Promise<HbceDeliveryRecord> {
    requireNonEmptyIdentifier(
      delivery.deliveryId,
      "delivery.deliveryId",
    );

    requireNonEmptyIdentifier(
      delivery.operationId,
      "delivery.operationId",
    );

    requireNonEmptyIdentifier(
      delivery.outboxId,
      "delivery.outboxId",
    );

    try {
      const result =
        await this.pool.query<DeliveryRow>(
          `
            INSERT INTO runtime_deliveries (
              delivery_id,
              operation_id,
              outbox_id,
              tenant_id,
              workspace_id,
              subject_ipr,
              idempotency_key,
              destination_type,
              destination_ref,
              delivery_status,
              attempt_count,
              last_attempt_at,
              delivered_at,
              last_error_code,
              last_error_message_hash,
              created_at,
              updated_at,
              legal_certification
            )
            VALUES (
              $1,
              $2,
              $3,
              $4,
              $5,
              $6,
              $7,
              $8,
              $9,
              $10,
              $11,
              $12,
              $13,
              $14,
              $15,
              $16,
              $17,
              FALSE
            )
            RETURNING *
          `,
          [
            delivery.deliveryId,
            delivery.operationId,
            delivery.outboxId,

            delivery.tenantId,
            delivery.workspaceId,
            delivery.subjectIpr,
            delivery.idempotencyKey,

            delivery.destinationType,
            delivery.destinationRef,

            delivery.status,
            delivery.attemptCount,

            delivery.lastAttemptAt,
            delivery.deliveredAt,

            delivery.lastErrorCode,
            delivery.lastErrorMessageHash,

            delivery.createdAt,
            delivery.updatedAt,
          ],
        );

      return mapDelivery(
        requireSingleRow(
          result,
          "HBCE_DELIVERY_PERSISTENT_CREATE_FAILED",
          "Persistent Delivery create returned no row",
        ),
      );
    } catch (error) {
      throw normalizeDatabaseError(error);
    }
  }

  async findByDeliveryId(
    deliveryId: string,
  ): Promise<HbceDeliveryRecord | null> {
    requireNonEmptyIdentifier(
      deliveryId,
      "deliveryId",
    );

    const result =
      await this.pool.query<DeliveryRow>(
        `
          SELECT *
          FROM runtime_deliveries
          WHERE delivery_id = $1
          LIMIT 1
        `,
        [deliveryId.trim()],
      );

    return result.rows[0]
      ? mapDelivery(result.rows[0])
      : null;
  }

  async findByOutboxId(
    outboxId: string,
  ): Promise<HbceDeliveryRecord | null> {
    requireNonEmptyIdentifier(
      outboxId,
      "outboxId",
    );

    const result =
      await this.pool.query<DeliveryRow>(
        `
          SELECT *
          FROM runtime_deliveries
          WHERE outbox_id = $1
          LIMIT 1
        `,
        [outboxId.trim()],
      );

    return result.rows[0]
      ? mapDelivery(result.rows[0])
      : null;
  }

  async findByOperationId(
    operationId: string,
  ): Promise<HbceDeliveryRecord | null> {
    requireNonEmptyIdentifier(
      operationId,
      "operationId",
    );

    const result =
      await this.pool.query<DeliveryRow>(
        `
          SELECT *
          FROM runtime_deliveries
          WHERE operation_id = $1
          LIMIT 1
        `,
        [operationId.trim()],
      );

    return result.rows[0]
      ? mapDelivery(result.rows[0])
      : null;
  }

  async findOne(
    criteria: HbceDeliverySearchCriteria,
  ): Promise<HbceDeliveryRecord | null> {
    if (criteria.deliveryId) {
      return this.findByDeliveryId(
        criteria.deliveryId,
      );
    }

    if (criteria.outboxId) {
      return this.findByOutboxId(
        criteria.outboxId,
      );
    }

    if (criteria.operationId) {
      return this.findByOperationId(
        criteria.operationId,
      );
    }

    if (criteria.idempotencyKey) {
      requireNonEmptyIdentifier(
        criteria.idempotencyKey,
        "criteria.idempotencyKey",
      );

      const result =
        await this.pool.query<DeliveryRow>(
          `
            SELECT *
            FROM runtime_deliveries
            WHERE idempotency_key = $1
            ORDER BY created_at ASC
            LIMIT 1
          `,
          [
            criteria.idempotencyKey.trim(),
          ],
        );

      return result.rows[0]
        ? mapDelivery(result.rows[0])
        : null;
    }

    throw new HbceDeliveryNeonRepositoryError(
      "HBCE_DELIVERY_SEARCH_CRITERIA_REQUIRED",
      "At least one delivery search criterion is required",
    );
  }

  async existsByOutboxId(
    outboxId: string,
  ): Promise<boolean> {
    requireNonEmptyIdentifier(
      outboxId,
      "outboxId",
    );

    const result =
      await this.pool.query<{ exists: boolean }>(
        `
          SELECT EXISTS (
            SELECT 1
            FROM runtime_deliveries
            WHERE outbox_id = $1
          ) AS exists
        `,
        [outboxId.trim()],
      );

    return result.rows[0]?.exists === true;
  }

  /**
   * Only mutable Delivery state is updated.
   *
   * Canonical bindings remain immutable:
   * - delivery_id
   * - operation_id
   * - outbox_id
   * - tenant_id
   * - workspace_id
   * - subject_ipr
   * - idempotency_key
   * - destination_type
   * - destination_ref
   * - created_at
   */
  async updateDelivery(
    delivery: HbceDeliveryRecord,
  ): Promise<HbceDeliveryRecord> {
    requireNonEmptyIdentifier(
      delivery.deliveryId,
      "delivery.deliveryId",
    );

    try {
      const result =
        await this.pool.query<DeliveryRow>(
          `
            UPDATE runtime_deliveries
            SET
              delivery_status = $2,
              attempt_count = $3,
              last_attempt_at = $4,
              delivered_at = $5,
              last_error_code = $6,
              last_error_message_hash = $7,
              updated_at = $8,
              legal_certification = FALSE
            WHERE delivery_id = $1
            RETURNING *
          `,
          [
            delivery.deliveryId,

            delivery.status,
            delivery.attemptCount,

            delivery.lastAttemptAt,
            delivery.deliveredAt,

            delivery.lastErrorCode,
            delivery.lastErrorMessageHash,

            delivery.updatedAt,
          ],
        );

      return mapDelivery(
        requireSingleRow(
          result,
          "HBCE_DELIVERY_NOT_FOUND",
          `Delivery not found: ${delivery.deliveryId}`,
        ),
      );
    } catch (error) {
      throw normalizeDatabaseError(error);
    }
  }

  async createAttempt(
    attempt: HbceDeliveryAttemptRecord,
  ): Promise<HbceDeliveryAttemptRecord> {
    requireNonEmptyIdentifier(
      attempt.attemptId,
      "attempt.attemptId",
    );

    requireNonEmptyIdentifier(
      attempt.deliveryId,
      "attempt.deliveryId",
    );

    try {
      const result =
        await this.pool.query<DeliveryAttemptRow>(
          `
            INSERT INTO runtime_delivery_attempts (
              attempt_id,
              delivery_id,
              attempt_number,
              worker_id,
              lease_token,
              started_at,
              completed_at,
              request_hash,
              response_code,
              response_hash,
              outcome,
              error_class,
              created_at,
              legal_certification
            )
            VALUES (
              $1,
              $2,
              $3,
              $4,
              $5,
              $6,
              $7,
              $8,
              $9,
              $10,
              $11,
              $12,
              $13,
              FALSE
            )
            RETURNING *
          `,
          [
            attempt.attemptId,
            attempt.deliveryId,
            attempt.attemptNumber,

            attempt.workerId,
            attempt.leaseToken,

            attempt.startedAt,
            attempt.completedAt,

            attempt.requestHash,
            attempt.responseCode,
            attempt.responseHash,

            attempt.outcome,
            attempt.errorClass,

            attempt.createdAt,
          ],
        );

      return mapAttempt(
        requireSingleRow(
          result,
          "HBCE_DELIVERY_ATTEMPT_PERSISTENT_CREATE_FAILED",
          "Persistent DeliveryAttempt create returned no row",
        ),
      );
    } catch (error) {
      throw normalizeDatabaseError(error);
    }
  }

  async findAttempts(
    deliveryId: string,
  ): Promise<HbceDeliveryAttemptRecord[]> {
    requireNonEmptyIdentifier(
      deliveryId,
      "deliveryId",
    );

    const result =
      await this.pool.query<DeliveryAttemptRow>(
        `
          SELECT *
          FROM runtime_delivery_attempts
          WHERE delivery_id = $1
          ORDER BY
            attempt_number ASC,
            created_at ASC
        `,
        [deliveryId.trim()],
      );

    return result.rows.map(mapAttempt);
  }

  async findLatestAttempt(
    deliveryId: string,
  ): Promise<HbceDeliveryAttemptRecord | null> {
    requireNonEmptyIdentifier(
      deliveryId,
      "deliveryId",
    );

    const result =
      await this.pool.query<DeliveryAttemptRow>(
        `
          SELECT *
          FROM runtime_delivery_attempts
          WHERE delivery_id = $1
          ORDER BY
            attempt_number DESC,
            created_at DESC
          LIMIT 1
        `,
        [deliveryId.trim()],
      );

    return result.rows[0]
      ? mapAttempt(result.rows[0])
      : null;
  }

  /**
   * Removes only explicitly synthetic D001 test data.
   *
   * The persistent adapter MUST NOT interpret cleanupSyntheticData()
   * as permission to truncate production delivery tables.
   *
   * Synthetic physical durability tests must therefore use identifiers
   * beginning with HBCE-D001-TEST-.
   */
  async cleanupSyntheticData():
    Promise<HbceSyntheticCleanupResult> {
    const client =
      await this.pool.connect();

    try {
      await client.query("BEGIN");

      const attemptsResult =
        await client.query<{ attempt_id: string }>(
          `
            DELETE FROM runtime_delivery_attempts
            WHERE delivery_id IN (
              SELECT delivery_id
              FROM runtime_deliveries
              WHERE
                delivery_id LIKE 'HBCE-D001-TEST-%'
                OR operation_id LIKE 'HBCE-D001-TEST-%'
                OR outbox_id LIKE 'HBCE-D001-TEST-%'
            )
            RETURNING attempt_id
          `,
        );

      const deliveriesResult =
        await client.query<{ delivery_id: string }>(
          `
            DELETE FROM runtime_deliveries
            WHERE
              delivery_id LIKE 'HBCE-D001-TEST-%'
              OR operation_id LIKE 'HBCE-D001-TEST-%'
              OR outbox_id LIKE 'HBCE-D001-TEST-%'
            RETURNING delivery_id
          `,
        );

      await client.query("COMMIT");

      return {
        deletedDeliveries:
          deliveriesResult.rowCount ??
          deliveriesResult.rows.length,

        deletedAttempts:
          attemptsResult.rowCount ??
          attemptsResult.rows.length,
      };
    } catch (error) {
      try {
        await client.query("ROLLBACK");
      } catch {
        /*
         * Preserve the primary persistence failure.
         */
      }

      throw normalizeDatabaseError(error);
    } finally {
      client.release();
    }
  }
}

export const HBCE_LEVEL_10_D001_NEON_REPOSITORY_BOUNDARY =
  Object.freeze({
    repositoryContractImplemented: true,

    neonAdapterImplemented: true,
    postgresqlAdapterImplemented: true,

    persistentSchemaRequired: true,
    persistentSchemaApplicationVerified: false,

    physicalDurabilityVerified: false,

    workersImplemented: false,
    retriesImplemented: false,
    webhooksImplemented: false,
    schedulerImplemented: false,
    deadLetterQueueImplemented: false,

    realExternalDelivery: false,

    rawRequestPersistence: false,
    rawResponsePersistence: false,

    humanAuthorizationRequired: true,
    legalCertification: false,
  });
