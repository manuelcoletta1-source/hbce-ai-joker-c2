/**
 * HERMETICUM B.C.E.
 * AI JOKER-C2
 *
 * EVT Store
 *
 * Canonical in-memory event store.
 */

import type {
    EvtRecord,
} from "./evt-record";

export interface EvtStore {

    append(
        event: EvtRecord,
    ): void;

    list(): readonly EvtRecord[];

    clear(): void;

}

export function createEvtStore(): EvtStore {

    const events: EvtRecord[] = [];

    return {

        append(
            event: EvtRecord,
        ): void {

            events.push(event);

        },

        list(): readonly EvtRecord[] {

            return [...events];

        },

        clear(): void {

            events.length = 0;

        },

    };

}
