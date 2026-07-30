/**
 * HERMETICUM B.C.E.
 * AI JOKER-C2
 *
 * OPC Runtime Factory
 *
 * Canonical assembly of the Operational Proof
 * & Compliance runtime.
 */

import {
    createOpcStore,
    type OpcStore,
} from "./opc-store";

import {
    createOpcService,
    type OpcService,
} from "./opc-service";

export interface OpcRuntime {

    readonly store: OpcStore;

    readonly service: OpcService;

}

export function createOpcRuntime(): OpcRuntime {

    const store =
        createOpcStore();

    const service =
        createOpcService(
            store,
        );

    return {

        store,

        service,

    };

}
