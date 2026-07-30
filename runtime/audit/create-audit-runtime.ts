/**
 * HERMETICUM B.C.E.
 * AI JOKER-C2
 *
 * Audit Runtime Factory
 *
 * Canonical assembly of the immutable audit runtime.
 */

import {
    createAuditStore,
    type AuditStore,
} from "./audit-store";

import {
    createAuditService,
    type AuditService,
} from "./audit-service";

export interface AuditRuntime {

    readonly store: AuditStore;

    readonly service: AuditService;

}

export function createAuditRuntime(): AuditRuntime {

    const store =
        createAuditStore();

    const service =
        createAuditService(
            store,
        );

    return {

        store,

        service,

    };

}
