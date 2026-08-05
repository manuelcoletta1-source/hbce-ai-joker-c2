/**
 * HERMETICUM B.C.E. S.r.l.
 *
 * HBCE Runtime Level 10
 * D001 - Delivery Repository Abstraction
 *
 * Revision:
 * HBCE-RUNTIME-LEVEL-10-D001-DELIVERY-REPOSITORY-v1_0
 *
 * Scope:
 * - Repository contract only
 * - No PostgreSQL implementation
 * - No external delivery
 * - No workers
 * - No retries
 * - legalCertification=false
 */

import type {
  HbceDeliveryRecord,
  HbceDeliveryAttemptRecord,
} from "./hbce-level10-delivery-domain";

export interface HbceDeliverySearchCriteria {
  deliveryId?: string;
  operationId?: string;
  outboxId?: string;
  idempotencyKey?: string;
}

export interface HbceSyntheticCleanupResult {
  deletedDeliveries: number;
  deletedAttempts: number;
}

export interface HbceDeliveryRepository {

  /**
   * Creates a canonical Delivery record.
   */
  createDelivery(
    delivery: HbceDeliveryRecord,
  ): Promise<HbceDeliveryRecord>;

  /**
   * Returns one Delivery by its identifier.
   */
  findByDeliveryId(
    deliveryId: string,
  ): Promise<HbceDeliveryRecord | null>;

  /**
   * Returns one Delivery by Outbox identifier.
   */
  findByOutboxId(
    outboxId: string,
  ): Promise<HbceDeliveryRecord | null>;

  /**
   * Returns one Delivery by Operation identifier.
   */
  findByOperationId(
    operationId: string,
  ): Promise<HbceDeliveryRecord | null>;

  /**
   * Generic lookup.
   */
  findOne(
    criteria: HbceDeliverySearchCriteria,
  ): Promise<HbceDeliveryRecord | null>;

  /**
   * Checks canonical uniqueness.
   */
  existsByOutboxId(
    outboxId: string,
  ): Promise<boolean>;

  /**
   * Updates Delivery state.
   */
  updateDelivery(
    delivery: HbceDeliveryRecord,
  ): Promise<HbceDeliveryRecord>;

  /**
   * Creates append-only DeliveryAttempt.
   */
  createAttempt(
    attempt: HbceDeliveryAttemptRecord,
  ): Promise<HbceDeliveryAttemptRecord>;

  /**
   * Returns Delivery attempts.
   */
  findAttempts(
    deliveryId: string,
  ): Promise<HbceDeliveryAttemptRecord[]>;

  /**
   * Returns latest DeliveryAttempt.
   */
  findLatestAttempt(
    deliveryId: string,
  ): Promise<HbceDeliveryAttemptRecord | null>;

  /**
   * Removes synthetic records created by tests.
   */
  cleanupSyntheticData(): Promise<HbceSyntheticCleanupResult>;
}

/**
 * Optional base implementation.
 * Concrete repositories (PostgreSQL, in-memory, etc.)
 * should extend this class.
 */
export abstract class AbstractHbceDeliveryRepository
  implements HbceDeliveryRepository {

  abstract createDelivery(
    delivery: HbceDeliveryRecord,
  ): Promise<HbceDeliveryRecord>;

  abstract findByDeliveryId(
    deliveryId: string,
  ): Promise<HbceDeliveryRecord | null>;

  abstract findByOutboxId(
    outboxId: string,
  ): Promise<HbceDeliveryRecord | null>;

  abstract findByOperationId(
    operationId: string,
  ): Promise<HbceDeliveryRecord | null>;

  abstract findOne(
    criteria: HbceDeliverySearchCriteria,
  ): Promise<HbceDeliveryRecord | null>;

  abstract existsByOutboxId(
    outboxId: string,
  ): Promise<boolean>;

  abstract updateDelivery(
    delivery: HbceDeliveryRecord,
  ): Promise<HbceDeliveryRecord>;

  abstract createAttempt(
    attempt: HbceDeliveryAttemptRecord,
  ): Promise<HbceDeliveryAttemptRecord>;

  abstract findAttempts(
    deliveryId: string,
  ): Promise<HbceDeliveryAttemptRecord[]>;

  abstract findLatestAttempt(
    deliveryId: string,
  ): Promise<HbceDeliveryAttemptRecord | null>;

  abstract cleanupSyntheticData(): Promise<HbceSyntheticCleanupResult>;
}

/**
 * Repository boundaries for D001.
 */
export const HBCE_LEVEL_10_D001_REPOSITORY_BOUNDARY = Object.freeze({

  persistenceDefined: true,

  postgresqlImplemented: false,

  workersImplemented: false,

  retriesImplemented: false,

  webhooksImplemented: false,

  schedulerImplemented: false,

  externalDeliveryImplemented: false,

  deadLetterQueueImplemented: false,

  legalCertification: false,

});
