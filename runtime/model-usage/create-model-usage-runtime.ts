/**
 * HERMETICUM B.C.E.
 * AI JOKER-C2
 *
 * Model Usage Runtime Factory
 *
 * Canonical assembly of the immutable
 * model usage runtime.
 */

import {
    createModelUsageStore,
    type ModelUsageStore,
} from "./model-usage-store";

import {
    createModelUsageService,
    type ModelUsageService,
} from "./model-usage-service";

export interface ModelUsageRuntime {

    readonly store: ModelUsageStore;

    readonly service: ModelUsageService;

}

export function createModelUsageRuntime(): ModelUsageRuntime {

    const store =
        createModelUsageStore();

    const service =
        createModelUsageService(
            store,
        );

    return {

        store,

        service,

    };

}
