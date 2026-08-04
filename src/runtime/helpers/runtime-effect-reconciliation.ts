import type {
  RuntimeEffectReconciliationResult,
} from "../types/runtime-external-effect";

import type {
  RuntimeOperationEffectsRepository,
} from "../repositories/runtime-operation-effects.repository";

export class RuntimeEffectReconciliation {

  constructor(
    private readonly repository: RuntimeOperationEffectsRepository
  ) {}

  public async reconcile(
    operationId: string,
    idempotencyKey: string,
    effectType: string,
    eventType: string
  ): Promise<RuntimeEffectReconciliationResult> {

    const existingEffect =
      await this.repository.findEffect(
        operationId,
        effectType
      );

    const existingOutbox =
      await this.repository.findOutbox(
        operationId,
        eventType
      );

    const effectCountBeforeRecovery =
      await this.repository.countEffects(
        operationId
      );

    const outboxCountBeforeRecovery =
      await this.repository.countOutbox(
        operationId
      );

    const existingEffectFound =
      existingEffect !== null;

    const existingOutboxFound =
      existingOutbox !== null;

    const existingEffectValid =
      existingEffectFound &&
      existingEffect.idempotencyKey === idempotencyKey;

    if (!existingEffectValid) {

      throw new Error(
        "RECONCILIATION_REQUIRED"
      );

    }

    const effectCountAfterRecovery =
      await this.repository.countEffects(
        operationId
      );

    const outboxCountAfterRecovery =
      await this.repository.countOutbox(
        operationId
      );

    return {

      existingEffectFound,

      existingEffectValid,

      existingOutboxFound,

      effectReused: true,

      newEffectCreated: false,

      effectCountBeforeRecovery,

      effectCountAfterRecovery,

      outboxCountBeforeRecovery,

      outboxCountAfterRecovery,

    };

  }

}
