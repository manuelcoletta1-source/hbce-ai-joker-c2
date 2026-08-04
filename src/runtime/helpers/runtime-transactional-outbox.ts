import type {
  RuntimeCanonicalEffectPayload,
  RuntimeEffectHashes,
  RuntimeOperationEffect,
  RuntimeOutboxRecord,
} from "../types/runtime-external-effect";

import type {
  RuntimeOperationEffectsRepository,
} from "../repositories/runtime-operation-effects.repository";

export interface RuntimeTransactionalOutboxResult {

  effect: RuntimeOperationEffect;

  outbox: RuntimeOutboxRecord;

}

export class RuntimeTransactionalOutbox {

  constructor(
    private readonly repository: RuntimeOperationEffectsRepository
  ) {}

  public async execute(

    payload: RuntimeCanonicalEffectPayload,

    hashes: RuntimeEffectHashes,

    eventType: string

  ): Promise<RuntimeTransactionalOutboxResult> {

    /*
     * IMPORTANT
     *
     * Repository implementation MUST execute
     * the following operations inside ONE
     * database transaction.
     *
     * BEGIN
     *
     * INSERT runtime_operation_effects
     *
     * INSERT runtime_operation_outbox
     *
     * COMMIT
     *
     * Any failure MUST rollback.
     */

    const effect = await this.repository.createEffect(

      payload,

      hashes.payloadHash,

      hashes.effectHash,

      hashes.chainHash

    );

    const outbox = await this.repository.createOutbox(

      effect.id,

      payload.operationId,

      eventType,

      hashes.payloadHash

    );

    return {

      effect,

      outbox,

    };

  }

}
