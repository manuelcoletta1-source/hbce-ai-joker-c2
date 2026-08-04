/*
 * HBCE Runtime Level 9
 * External Effect Idempotency
 *
 * Artifact:
 * HBCE-RUNTIME-EXTERNAL-EFFECT-IDEMPOTENCY-SELF-TEST-v1_0
 *
 * Boundary:
 * legalCertification = false
 * technicalRuntimeTestOnly = true
 */

export const HBCE_RUNTIME_EFFECT_VERSION = "v1_0" as const;

export const HBCE_RUNTIME_EFFECT_TYPE =
  "HBCE_RUNTIME_TEST_LEDGER_ENTRY" as const;

export const HBCE_RUNTIME_RECEIPT_TYPE =
  "HBCE_RUNTIME_LEVEL_9_OPC_RECEIPT" as const;

export type RuntimeEffectStatus =
  | "PENDING"
  | "COMMITTED"
  | "RECONCILIATION_REQUIRED"
  | "RECONCILED"
  | "COMPLETED"
  | "FAILED";

export type RuntimeDeliveryStatus =
  | "PENDING"
  | "PROCESSING"
  | "DELIVERED"
  | "RETRY_REQUIRED"
  | "FAILED";

export interface RuntimeOperationEffect {

  id: string;

  operationId: string;

  idempotencyKey: string;

  effectType: string;

  effectStatus: RuntimeEffectStatus;

  payloadHash: string;

  effectHash: string;

  chainHash: string;

  createdAt: Date;

  updatedAt: Date;

  completedAt: Date | null;

  legalCertification: false;
}

export interface RuntimeOutboxRecord {

  id: string;

  operationId: string;

  effectId: string;

  eventType: string;

  deliveryStatus: RuntimeDeliveryStatus;

  attemptCount: number;

  payloadHash: string;

  createdAt: Date;

  updatedAt: Date;

  deliveredAt: Date | null;
}

export interface RuntimeOpcReceipt {

  id: string;

  operationId: string;

  receiptType: string;

  idempotencyKeyHash: string;

  effectHash: string;

  outboxHash: string;

  finalStateHash: string;

  finalChainHash: string;

  recoveryCount: number;

  attemptCount: number;

  completedAt: Date;

  legalCertification: false;
}

export interface RuntimeCanonicalEffectPayload {

  operationId: string;

  effectType: typeof HBCE_RUNTIME_EFFECT_TYPE;

  effectVersion: typeof HBCE_RUNTIME_EFFECT_VERSION;

  result: "TECHNICAL_TEST_EFFECT";

  legalCertification: false;
}

export interface RuntimeEffectReconciliationResult {

  existingEffectFound: boolean;

  existingEffectValid: boolean;

  existingOutboxFound: boolean;

  effectReused: boolean;

  newEffectCreated: boolean;

  effectCountBeforeRecovery: number;

  effectCountAfterRecovery: number;

  outboxCountBeforeRecovery: number;

  outboxCountAfterRecovery: number;
}

export interface RuntimeLevel9Boundary {

  legalCertification: false;

  technicalRuntimeTestOnly: true;

  usesPersistentExternalEffect: true;

  usesTransactionalOutbox: true;

  usesRecoveryReconciliation: true;

  usesUniqueEffectConstraint: true;
}

export interface RuntimeEffectHashes {

  payloadHash: string;

  effectHash: string;

  chainHash: string;
}

export interface RuntimeLevel9Summary {

  operationCount: number;

  effectCount: number;

  outboxCount: number;

  opcCount: number;

  duplicateLogicalExecution: false;

  duplicatePersistentEffect: false;
}
