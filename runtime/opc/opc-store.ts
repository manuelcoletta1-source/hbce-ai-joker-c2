/**
 * HERMETICUM B.C.E.
 * AI JOKER-C2
 *
 * OPC Store
 *
 * Canonical in-memory store for OPC records.
 */

import type {
    OpcRecord,
} from "./opc-record";

export interface OpcStore {

    append(
        record: OpcRecord,
    ): void;

    list(): readonly OpcRecord[];

    findById(
        id: string,
    ): OpcRecord | undefined;

    last(): OpcRecord | undefined;

    clear(): void;

}

export function createOpcStore(): OpcStore {

    const records: OpcRecord[] = [];

    return {

        append(
            record: OpcRecord,
        ): void {

            records.push(
                record,
            );

        },

        list(): readonly OpcRecord[] {

            return [...records];

        },

        findById(
            id: string,
        ): OpcRecord | undefined {

            return records.find(
                record => record.id === id,
            );

        },

        last(): OpcRecord | undefined {

            if (records.length === 0) {
                return undefined;
            }

            return records[
                records.length - 1
            ];

        },

        clear(): void {

            records.length = 0;

        },

    };

}
