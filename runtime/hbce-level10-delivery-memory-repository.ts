/**
 * HERMETICUM B.C.E. S.r.l.
 *
 * HBCE Runtime Level 10
 * D001 - In-Memory Delivery Repository
 *
 * Revision:
 * HBCE-RUNTIME-LEVEL-10-D001-MEMORY-DELIVERY-REPOSITORY-v1_0
 *
 * Purpose:
 * - deterministic repository implementation;
 * - domain and invariant verification;
 * - test support before persistent adapter integration.
 *
 * Explicit exclusions:
 * - PostgreSQL;
 * - Redis persistence;
 * - external delivery;
 * - workers;
 * - retries;
 * - webhooks;
 * - schedulers;
 * - dead-letter queues.
 *
 * legalCertification=false
 */

import type {
  HbceDeliveryAttemptRecord,
  HbceDeliveryRecord,
} from "./hbce-level10-delivery-domain";

import {
  AbstractHbceDeliveryRepository,
  type HbceDeliverySearchCriteria,
  type HbceSyntheticCleanupResult,
} from "./hbce-level10-delivery-repository";

export const HBCE_LEVEL_10_D001_MEMORY_REPOSITORY_REVISION =
  "HBCE-RUNTIME-LEVEL-10-D001-MEMORY-DELIVERY-REPOSITORY-v1_0" as const;

export class HbceDeliveryRepositoryError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "HbceDeliveryRepositoryError";
    this.code = code;
  }
}

function requireNonEmptyIdentifier(
  value: unknown,
  fieldName: string,
): asserts value is string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new HbceDeliveryRepositoryError(
      "HBCE_DELIVERY_REPOSITORY_INVALID_IDENTIFIER",
      `${fieldName} must be a non-empty string`,
    );
  }
}

function cloneDelivery(
  delivery: HbceDeliveryRecord,
): HbceDeliveryRecord {
  return Object.freeze({ ...delivery });
}

function cloneAttempt(
  attempt: HbceDeliveryAttemptRecord,
): HbceDeliveryAttemptRecord {
  return Object.freeze({ ...attempt });
}

/**
 * Deterministic in-memory implementation.
 *
 * This repository exists to validate the D001 persistence contract before
 * introducing a concrete database adapter.
 */
export class InMemoryHbceDeliveryRepository
  extends AbstractHbceDeliveryRepository {
  private readonly deliveriesById =
    new Map<string, HbceDeliveryRecord>();

  private readonly deliveryIdByOutboxId =
    new Map<string, string>();

  private readonly deliveryIdByOperationId =
    new Map<string, string>();

  private readonly attemptsByDeliveryId =
    new Map<string, HbceDeliveryAttemptRecord[]>();

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

    if (this.deliveriesById.has(delivery.deliveryId)) {
      throw new HbceDeliveryRepositoryError(
        "HBCE_DELIVERY_ID_ALREADY_EXISTS",
        `Delivery already exists: ${delivery.deliveryId}`,
      );
    }

    if (this.deliveryIdByOutboxId.has(delivery.outboxId)) {
      throw new HbceDeliveryRepositoryError(
        "HBCE_DELIVERY_OUTBOX_ALREADY_BOUND",
        `Outbox already has a canonical delivery: ${delivery.outboxId}`,
      );
    }

    if (
      this.deliveryIdByOperationId.has(delivery.operationId)
    ) {
      throw new HbceDeliveryRepositoryError(
        "HBCE_DELIVERY_OPERATION_ALREADY_BOUND",
        `Operation already has a canonical delivery: ${delivery.operationId}`,
      );
    }

    const stored = cloneDelivery(delivery);

    this.deliveriesById.set(
      stored.deliveryId,
      stored,
    );

    this.deliveryIdByOutboxId.set(
      stored.outboxId,
      stored.deliveryId,
    );

    this.deliveryIdByOperationId.set(
      stored.operationId,
      stored.deliveryId,
    );

    this.attemptsByDeliveryId.set(
      stored.deliveryId,
      [],
    );

    return cloneDelivery(stored);
  }

  async findByDeliveryId(
    deliveryId: string,
  ): Promise<HbceDeliveryRecord | null> {
    requireNonEmptyIdentifier(deliveryId, "deliveryId");

    const delivery = this.deliveriesById.get(
      deliveryId.trim(),
    );

    return delivery ? cloneDelivery(delivery) : null;
  }

  async findByOutboxId(
    outboxId: string,
  ): Promise<HbceDeliveryRecord | null> {
    requireNonEmptyIdentifier(outboxId, "outboxId");

    const deliveryId = this.deliveryIdByOutboxId.get(
      outboxId.trim(),
    );

    if (!deliveryId) {
      return null;
    }

    return this.findByDeliveryId(deliveryId);
  }

  async findByOperationId(
    operationId: string,
  ): Promise<HbceDeliveryRecord | null> {
    requireNonEmptyIdentifier(operationId, "operationId");

    const deliveryId =
      this.deliveryIdByOperationId.get(
        operationId.trim(),
      );

    if (!deliveryId) {
      return null;
    }

    return this.findByDeliveryId(deliveryId);
  }

  async findOne(
    criteria: HbceDeliverySearchCriteria,
  ): Promise<HbceDeliveryRecord | null> {
    if (criteria.deliveryId) {
      return this.findByDeliveryId(criteria.deliveryId);
    }

    if (criteria.outboxId) {
      return this.findByOutboxId(criteria.outboxId);
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

      for (const delivery of this.deliveriesById.values()) {
        if (
          delivery.idempotencyKey ===
          criteria.idempotencyKey.trim()
        ) {
          return cloneDelivery(delivery);
        }
      }

      return null;
    }

    throw new HbceDeliveryRepositoryError(
      "HBCE_DELIVERY_SEARCH_CRITERIA_REQUIRED",
      "At least one delivery search criterion is required",
    );
  }

  async existsByOutboxId(
    outboxId: string,
  ): Promise<boolean> {
    requireNonEmptyIdentifier(outboxId, "outboxId");

    return this.deliveryIdByOutboxId.has(
      outboxId.trim(),
    );
  }

  async updateDelivery(
    delivery: HbceDeliveryRecord,
  ): Promise<HbceDeliveryRecord> {
    requireNonEmptyIdentifier(
      delivery.deliveryId,
      "delivery.deliveryId",
    );

    const existing = this.deliveriesById.get(
      delivery.deliveryId,
    );

    if (!existing) {
      throw new HbceDeliveryRepositoryError(
        "HBCE_DELIVERY_NOT_FOUND",
        `Delivery does not exist: ${delivery.deliveryId}`,
      );
    }

    /*
     * Canonical identity bindings are immutable.
     */
    if (
      existing.operationId !== delivery.operationId ||
      existing.outboxId !== delivery.outboxId ||
      existing.tenantId !== delivery.tenantId ||
      existing.workspaceId !== delivery.workspaceId ||
      existing.subjectIpr !== delivery.subjectIpr ||
      existing.idempotencyKey !== delivery.idempotencyKey
    ) {
      throw new HbceDeliveryRepositoryError(
        "HBCE_DELIVERY_IMMUTABLE_BINDING_CHANGED",
        "Canonical delivery identity bindings cannot be changed",
      );
    }

    const stored = cloneDelivery(delivery);

    this.deliveriesById.set(
      stored.deliveryId,
      stored,
    );

    return cloneDelivery(stored);
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

    if (!this.deliveriesById.has(attempt.deliveryId)) {
      throw new HbceDeliveryRepositoryError(
        "HBCE_DELIVERY_ATTEMPT_PARENT_NOT_FOUND",
        `Delivery does not exist: ${attempt.deliveryId}`,
      );
    }

    const attempts =
      this.attemptsByDeliveryId.get(
        attempt.deliveryId,
      ) ?? [];

    const duplicateId = attempts.some(
      (existing) =>
        existing.attemptId === attempt.attemptId,
    );

    if (duplicateId) {
      throw new HbceDeliveryRepositoryError(
        "HBCE_DELIVERY_ATTEMPT_ID_ALREADY_EXISTS",
        `Attempt already exists: ${attempt.attemptId}`,
      );
    }

    const duplicateNumber = attempts.some(
      (existing) =>
        existing.attemptNumber ===
        attempt.attemptNumber,
    );

    if (duplicateNumber) {
      throw new HbceDeliveryRepositoryError(
        "HBCE_DELIVERY_ATTEMPT_NUMBER_ALREADY_EXISTS",
        `Attempt number already exists for delivery: ${attempt.attemptNumber}`,
      );
    }

    const stored = cloneAttempt(attempt);

    const nextAttempts = [
      ...attempts,
      stored,
    ].sort(
      (left, right) =>
        left.attemptNumber - right.attemptNumber,
    );

    this.attemptsByDeliveryId.set(
      attempt.deliveryId,
      nextAttempts,
    );

    return cloneAttempt(stored);
  }

  async findAttempts(
    deliveryId: string,
  ): Promise<HbceDeliveryAttemptRecord[]> {
    requireNonEmptyIdentifier(deliveryId, "deliveryId");

    const attempts =
      this.attemptsByDeliveryId.get(
        deliveryId.trim(),
      ) ?? [];

    return attempts.map(cloneAttempt);
  }

  async findLatestAttempt(
    deliveryId: string,
  ): Promise<HbceDeliveryAttemptRecord | null> {
    const attempts = await this.findAttempts(deliveryId);

    if (attempts.length === 0) {
      return null;
    }

    return cloneAttempt(
      attempts[attempts.length - 1],
    );
  }

  /**
   * Removes all repository records.
   *
   * This repository contains only synthetic, process-local data.
   * A future persistent adapter must restrict cleanup by test namespace,
   * operation prefix, tenant and explicit authorization.
   */
  async cleanupSyntheticData():
    Promise<HbceSyntheticCleanupResult> {
    let deletedAttempts = 0;

    for (
      const attempts
      of this.attemptsByDeliveryId.values()
    ) {
      deletedAttempts += attempts.length;
    }

    const deletedDeliveries =
      this.deliveriesById.size;

    /*
     * Referential order:
     * attempts first, deliveries second.
     */
    this.attemptsByDeliveryId.clear();
    this.deliveriesById.clear();
    this.deliveryIdByOutboxId.clear();
    this.deliveryIdByOperationId.clear();

    return {
      deletedDeliveries,
      deletedAttempts,
    };
  }

  /**
   * Test-only diagnostic counts.
   * No raw records or restricted fields are exposed.
   */
  getDiagnosticCounts(): {
    deliveries: number;
    attempts: number;
    outboxBindings: number;
    operationBindings: number;
  } {
    let attempts = 0;

    for (
      const storedAttempts
      of this.attemptsByDeliveryId.values()
    ) {
      attempts += storedAttempts.length;
    }

    return Object.freeze({
      deliveries: this.deliveriesById.size,
      attempts,
      outboxBindings:
        this.deliveryIdByOutboxId.size,
      operationBindings:
        this.deliveryIdByOperationId.size,
    });
  }
}

export const HBCE_LEVEL_10_D001_MEMORY_REPOSITORY_BOUNDARY =
  Object.freeze({
    repositoryImplemented: true,
    deterministic: true,
    processLocalOnly: true,
    persistentDatabaseImplemented: false,
    redisImplemented: false,
    postgresqlImplemented: false,
    workerImplemented: false,
    retryImplemented: false,
    webhookImplemented: false,
    schedulerImplemented: false,
    externalDeliveryImplemented: false,
    deadLetterQueueImplemented: false,
    legalCertification: false,
    humanAuthorizationRequired: true,
  });
