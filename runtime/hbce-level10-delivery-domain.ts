/**
 * HERMETICUM B.C.E. S.r.l.
 *
 * HBCE Runtime Level 10 - D001
 * Persistent Delivery Domain
 *
 * Revision:
 * HBCE-RUNTIME-LEVEL-10-D001-DELIVERY-DOMAIN-v1_0
 *
 * Scope:
 * - Canonical Delivery domain
 * - Canonical DeliveryAttempt domain
 * - Validation
 * - Public API projection
 *
 * Explicitly excluded:
 * - Database persistence
 * - Delivery workers
 * - Retry logic
 * - Webhooks
 * - Schedulers
 * - External delivery
 * - Dead-letter queues
 *
 * legalCertification=false
 */

export const HBCE_LEVEL_10_D001_REVISION =
  "HBCE-RUNTIME-LEVEL-10-D001-DELIVERY-DOMAIN-v1_0" as const;

export const HBCE_LEVEL_10_D001_LEGAL_CERTIFICATION = false as const;

export const HBCE_DELIVERY_STATUSES = [
  "PENDING",
  "IN_FLIGHT",
  "DELIVERED",
  "FAILED",
] as const;

export type HbceDeliveryStatus =
  (typeof HBCE_DELIVERY_STATUSES)[number];

export interface HbceDeliveryRecord {
  deliveryId: string;
  operationId: string;
  outboxId: string;

  tenantId: string;
  workspaceId: string;
  subjectIpr: string;
  idempotencyKey: string;

  destinationType: string;
  destinationRef: string;

  status: HbceDeliveryStatus;
  attemptCount: number;

  lastAttemptAt: string | null;
  deliveredAt: string | null;

  lastErrorCode: string | null;
  lastErrorMessageHash: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface HbceDeliveryAttemptRecord {
  attemptId: string;
  deliveryId: string;
  attemptNumber: number;

  workerId: string;
  leaseToken: string;

  startedAt: string;
  completedAt: string | null;

  requestHash: string | null;
  responseCode: number | null;
  responseHash: string | null;

  outcome: string | null;
  errorClass: string | null;

  createdAt: string;
}

export interface CreateHbceDeliveryInput {
  deliveryId: string;
  operationId: string;
  outboxId: string;

  tenantId: string;
  workspaceId: string;
  subjectIpr: string;
  idempotencyKey: string;

  destinationType: string;
  destinationRef: string;

  createdAt?: string;
}

export interface CreateHbceDeliveryAttemptInput {
  attemptId: string;
  deliveryId: string;
  attemptNumber: number;

  workerId: string;
  leaseToken: string;

  startedAt?: string;
  completedAt?: string | null;

  requestHash?: string | null;
  responseCode?: number | null;
  responseHash?: string | null;

  outcome?: string | null;
  errorClass?: string | null;

  createdAt?: string;
}

export interface HbcePublicDeliveryProjection {
  deliveryId: string;
  status: HbceDeliveryStatus;
  attemptCount: number;
}

export class HbceDeliveryDomainError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "HbceDeliveryDomainError";
    this.code = code;
  }
}

function requireNonEmptyString(
  value: unknown,
  fieldName: string,
): asserts value is string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new HbceDeliveryDomainError(
      "HBCE_DELIVERY_REQUIRED_FIELD_MISSING",
      `${fieldName} must be a non-empty string`,
    );
  }
}

function requireIsoTimestamp(
  value: unknown,
  fieldName: string,
): asserts value is string {
  requireNonEmptyString(value, fieldName);

  const parsed = Date.parse(value);

  if (!Number.isFinite(parsed)) {
    throw new HbceDeliveryDomainError(
      "HBCE_DELIVERY_INVALID_TIMESTAMP",
      `${fieldName} must be a valid ISO-8601 timestamp`,
    );
  }
}

function assertNoRawSensitiveField(
  object: Record<string, unknown>,
): void {
  const forbiddenKeys = [
    "secret",
    "apiKey",
    "authorization",
    "authorizationHeader",
    "rawRequest",
    "rawResponse",
    "requestBody",
    "responseBody",
  ];

  for (const key of forbiddenKeys) {
    if (key in object) {
      throw new HbceDeliveryDomainError(
        "HBCE_DELIVERY_RAW_SENSITIVE_DATA_FORBIDDEN",
        `Forbidden raw or sensitive field detected: ${key}`,
      );
    }
  }
}

export function isHbceDeliveryStatus(
  value: unknown,
): value is HbceDeliveryStatus {
  return (
    typeof value === "string" &&
    HBCE_DELIVERY_STATUSES.includes(
      value as HbceDeliveryStatus,
    )
  );
}

export function createHbceDeliveryRecord(
  input: CreateHbceDeliveryInput,
): HbceDeliveryRecord {
  assertNoRawSensitiveField(
    input as unknown as Record<string, unknown>,
  );

  requireNonEmptyString(input.deliveryId, "deliveryId");
  requireNonEmptyString(input.operationId, "operationId");
  requireNonEmptyString(input.outboxId, "outboxId");

  requireNonEmptyString(input.tenantId, "tenantId");
  requireNonEmptyString(input.workspaceId, "workspaceId");
  requireNonEmptyString(input.subjectIpr, "subjectIpr");
  requireNonEmptyString(
    input.idempotencyKey,
    "idempotencyKey",
  );

  requireNonEmptyString(
    input.destinationType,
    "destinationType",
  );
  requireNonEmptyString(
    input.destinationRef,
    "destinationRef",
  );

  const timestamp = input.createdAt ?? new Date().toISOString();

  requireIsoTimestamp(timestamp, "createdAt");

  return Object.freeze({
    deliveryId: input.deliveryId.trim(),
    operationId: input.operationId.trim(),
    outboxId: input.outboxId.trim(),

    tenantId: input.tenantId.trim(),
    workspaceId: input.workspaceId.trim(),
    subjectIpr: input.subjectIpr.trim(),
    idempotencyKey: input.idempotencyKey.trim(),

    destinationType: input.destinationType.trim(),
    destinationRef: input.destinationRef.trim(),

    status: "PENDING",
    attemptCount: 0,

    lastAttemptAt: null,
    deliveredAt: null,

    lastErrorCode: null,
    lastErrorMessageHash: null,

    createdAt: timestamp,
    updatedAt: timestamp,
  });
}

export function createHbceDeliveryAttemptRecord(
  input: CreateHbceDeliveryAttemptInput,
): HbceDeliveryAttemptRecord {
  assertNoRawSensitiveField(
    input as unknown as Record<string, unknown>,
  );

  requireNonEmptyString(input.attemptId, "attemptId");
  requireNonEmptyString(input.deliveryId, "deliveryId");
  requireNonEmptyString(input.workerId, "workerId");
  requireNonEmptyString(input.leaseToken, "leaseToken");

  if (
    !Number.isInteger(input.attemptNumber) ||
    input.attemptNumber < 1
  ) {
    throw new HbceDeliveryDomainError(
      "HBCE_DELIVERY_INVALID_ATTEMPT_NUMBER",
      "attemptNumber must be a positive integer",
    );
  }

  const startedAt =
    input.startedAt ?? new Date().toISOString();
  const createdAt = input.createdAt ?? startedAt;

  requireIsoTimestamp(startedAt, "startedAt");
  requireIsoTimestamp(createdAt, "createdAt");

  if (input.completedAt !== null && input.completedAt !== undefined) {
    requireIsoTimestamp(input.completedAt, "completedAt");
  }

  if (
    input.responseCode !== null &&
    input.responseCode !== undefined &&
    (!Number.isInteger(input.responseCode) ||
      input.responseCode < 100 ||
      input.responseCode > 599)
  ) {
    throw new HbceDeliveryDomainError(
      "HBCE_DELIVERY_INVALID_RESPONSE_CODE",
      "responseCode must be an integer between 100 and 599",
    );
  }

  return Object.freeze({
    attemptId: input.attemptId.trim(),
    deliveryId: input.deliveryId.trim(),
    attemptNumber: input.attemptNumber,

    workerId: input.workerId.trim(),
    leaseToken: input.leaseToken.trim(),

    startedAt,
    completedAt: input.completedAt ?? null,

    requestHash: input.requestHash ?? null,
    responseCode: input.responseCode ?? null,
    responseHash: input.responseHash ?? null,

    outcome: input.outcome ?? null,
    errorClass: input.errorClass ?? null,

    createdAt,
  });
}

export function toHbcePublicDeliveryProjection(
  delivery: HbceDeliveryRecord,
): HbcePublicDeliveryProjection {
  requireNonEmptyString(
    delivery.deliveryId,
    "delivery.deliveryId",
  );

  if (!isHbceDeliveryStatus(delivery.status)) {
    throw new HbceDeliveryDomainError(
      "HBCE_DELIVERY_INVALID_STATUS",
      `Unsupported delivery status: ${String(delivery.status)}`,
    );
  }

  if (
    !Number.isInteger(delivery.attemptCount) ||
    delivery.attemptCount < 0
  ) {
    throw new HbceDeliveryDomainError(
      "HBCE_DELIVERY_INVALID_ATTEMPT_COUNT",
      "attemptCount must be a non-negative integer",
    );
  }

  /*
   * Deliberately excludes:
   * - leaseToken
   * - workerId
   * - internal errors
   * - request/response hashes
   * - tenant/workspace internals
   * - secrets
   */
  return Object.freeze({
    deliveryId: delivery.deliveryId,
    status: delivery.status,
    attemptCount: delivery.attemptCount,
  });
}

export function getHbceDeliveryAttemptUniquenessKey(
  deliveryId: string,
  attemptNumber: number,
): string {
  requireNonEmptyString(deliveryId, "deliveryId");

  if (!Number.isInteger(attemptNumber) || attemptNumber < 1) {
    throw new HbceDeliveryDomainError(
      "HBCE_DELIVERY_INVALID_ATTEMPT_NUMBER",
      "attemptNumber must be a positive integer",
    );
  }

  return `${deliveryId.trim()}:${attemptNumber}`;
}

export function assertHbceDeliveryRuntimeBinding(
  delivery: HbceDeliveryRecord,
  expected: {
    tenantId: string;
    workspaceId: string;
    subjectIpr: string;
    idempotencyKey: string;
  },
): void {
  requireNonEmptyString(expected.tenantId, "expected.tenantId");
  requireNonEmptyString(
    expected.workspaceId,
    "expected.workspaceId",
  );
  requireNonEmptyString(
    expected.subjectIpr,
    "expected.subjectIpr",
  );
  requireNonEmptyString(
    expected.idempotencyKey,
    "expected.idempotencyKey",
  );

  if (delivery.tenantId !== expected.tenantId) {
    throw new HbceDeliveryDomainError(
      "HBCE_DELIVERY_TENANT_BINDING_MISMATCH",
      "Delivery tenant binding does not match runtime context",
    );
  }

  if (delivery.workspaceId !== expected.workspaceId) {
    throw new HbceDeliveryDomainError(
      "HBCE_DELIVERY_WORKSPACE_BINDING_MISMATCH",
      "Delivery workspace binding does not match runtime context",
    );
  }

  if (delivery.subjectIpr !== expected.subjectIpr) {
    throw new HbceDeliveryDomainError(
      "HBCE_DELIVERY_SUBJECT_IPR_BINDING_MISMATCH",
      "Delivery subject IPR binding does not match operation subject",
    );
  }

  if (delivery.idempotencyKey !== expected.idempotencyKey) {
    throw new HbceDeliveryDomainError(
      "HBCE_DELIVERY_IDEMPOTENCY_BINDING_MISMATCH",
      "Delivery idempotency binding does not match operation key",
    );
  }
}

export const HBCE_LEVEL_10_D001_BOUNDARY = Object.freeze({
  realExternalDelivery: false,
  workerImplemented: false,
  retryImplemented: false,
  webhookImplemented: false,
  schedulerImplemented: false,
  deadLetterQueueImplemented: false,
  legalCertification: false,
  humanAuthorizationRequired: true,
});
