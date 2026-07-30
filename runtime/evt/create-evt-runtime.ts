/**
 * HERMETICUM B.C.E.
 * AI JOKER-C2
 *
 * EVT Runtime Factory
 *
 * Canonical assembly of the EVT Runtime.
 */

import {
    createEvtStore,
    type EvtStore,
} from "./evt-store";

import {
    createEvtService,
    type EvtService,
} from "./evt-service";

export interface EvtRuntime {

    readonly store: EvtStore;

    readonly service: EvtService;

}

export function createEvtRuntime(): EvtRuntime {

    const store =
        createEvtStore();

    const service =
        createEvtService(
            store,
        );

    return {

        store,

        service,

    };

}
