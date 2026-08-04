import type {
  RuntimeCanonicalEffectPayload,
  RuntimeOperationEffect,
  RuntimeOutboxRecord,
  RuntimeOpcReceipt,
} from "../types/runtime-external-effect";

export interface RuntimeOperationEffectsRepository {

  createEffect(
    payload: RuntimeCanonicalEffectPayload,
    payloadHash: string,
    effectHash: string,
    chainHash: string
  ): Promise<RuntimeOperationEffect>;

  findEffect(
    operationId: string,
    effectType: string
  ): Promise<RuntimeOperationEffect | null>;

  findByIdempotency(
    idempotencyKey: string,
    effectType: string
  ): Promise<RuntimeOperationEffect | null>;

  createOutbox(
    effectId: string,
    operationId: string,
    eventType: string,
    payloadHash: string
  ): Promise<RuntimeOutboxRecord>;

  findOutbox(
    operationId: string,
    eventType: string
  ): Promise<RuntimeOutboxRecord | null>;

  createOpcReceipt(
    receipt: Omit<RuntimeOpcReceipt, "id">
  ): Promise<RuntimeOpcReceipt>;

  findOpcReceipt(
    operationId: string,
    receiptType: string
  ): Promise<RuntimeOpcReceipt | null>;

  countEffects(
    operationId: string
  ): Promise<number>;

  countOutbox(
    operationId: string
  ): Promise<number>;

  countOpcReceipts(
    operationId: string
  ): Promise<number>;

  deleteTemporaryRecords(
    operationId: string
  ): Promise<void>;
}

export class RuntimeDuplicateEffectError extends Error {

  constructor(
    message = "DUPLICATE_EXTERNAL_EFFECT"
  ) {

    super(message);

    this.name = "RuntimeDuplicateEffectError";
  }

}

export class RuntimeDuplicateOutboxError extends Error {

  constructor(
    message = "DUPLICATE_OUTBOX_EVENT"
  ) {

    super(message);

    this.name = "RuntimeDuplicateOutboxError";
  }

}

export class RuntimeDuplicateOpcReceiptError extends Error {

  constructor(
    message = "DUPLICATE_OPC_RECEIPT"
  ) {

    super(message);

    this.name = "RuntimeDuplicateOpcReceiptError";
  }

}

export class RuntimeEffectNotFoundError extends Error {

  constructor(
    message = "RUNTIME_EFFECT_NOT_FOUND"
  ) {

    super(message);

    this.name = "RuntimeEffectNotFoundError";
  }

}
