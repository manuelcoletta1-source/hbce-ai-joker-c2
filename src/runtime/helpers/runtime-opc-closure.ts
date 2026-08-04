import type {

  RuntimeOpcReceipt,

} from "../types/runtime-external-effect";

import type {

  RuntimeOperationEffectsRepository,

} from "../repositories/runtime-operation-effects.repository";

export interface RuntimeOpcClosureInput {

  operationId: string;

  receiptType: string;

  idempotencyKeyHash: string;

  effectHash: string;

  outboxHash: string;

  finalStateHash: string;

  finalChainHash: string;

  recoveryCount: number;

  attemptCount: number;

}

export class RuntimeOpcClosure {

  constructor(

    private readonly repository: RuntimeOperationEffectsRepository

  ) {}

  public async close(

    input: RuntimeOpcClosureInput

  ): Promise<RuntimeOpcReceipt> {

    const existing = await this.repository.findOpcReceipt(

      input.operationId,

      input.receiptType

    );

    if (existing) {

      return existing;

    }

    return this.repository.createOpcReceipt({

      operationId: input.operationId,

      receiptType: input.receiptType,

      idempotencyKeyHash: input.idempotencyKeyHash,

      effectHash: input.effectHash,

      outboxHash: input.outboxHash,

      finalStateHash: input.finalStateHash,

      finalChainHash: input.finalChainHash,

      recoveryCount: input.recoveryCount,

      attemptCount: input.attemptCount,

      completedAt: new Date(),

      legalCertification: false,

    });

  }

}
