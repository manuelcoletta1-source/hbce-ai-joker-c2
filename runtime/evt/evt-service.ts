/**
 * HERMETICUM B.C.E.
 * AI JOKER-C2
 *
 * EVT Service
 *
 * Canonical event service.
 */

import {
    createEvtRecord,
    type CreateEvtRecordConfiguration,
    type EvtRecord,
} from "./evt-record";

import {
    type EvtStore,
} from "./evt-store";

export interface EvtService {

    publish(
        configuration: CreateEvtRecordConfiguration,
    ): EvtRecord;

    list(): readonly EvtRecord[];

    clear(): void;

}

export function createEvtService(
    store: EvtStore,
): EvtService {

    return {

        publish(
            configuration: CreateEvtRecordConfiguration,
        ): EvtRecord {

            const event =
                createEvtRecord(
                    configuration,
                );

            store.append(
                event,
            );

            return event;

        },

        list(): readonly EvtRecord[] {

            return store.list();

        },

        clear(): void {

            store.clear();

        },

    };

}
