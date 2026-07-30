/**
 * HERMETICUM B.C.E.
 * AI JOKER-C2
 *
 * OPC Service
 *
 * Canonical issuance and verification service
 * for Operational Proof & Compliance records.
 */

import {
    createOpcRecord,
    type CreateOpcRecordConfiguration,
    type OpcRecord,
} from "./opc-record";

import type {
    OpcStore,
} from "./opc-store";

import {
    verifyOpcRecord,
    type OpcVerificationResult,
} from "./opc-verification";

export interface OpcService {

    issue(
        configuration: CreateOpcRecordConfiguration,
    ): OpcRecord;

    verify(
        record: OpcRecord,
        previousRecord?: OpcRecord,
    ): OpcVerificationResult;

    findById(
        id: string,
    ): OpcRecord | undefined;

    list(): readonly OpcRecord[];

    last(): OpcRecord | undefined;

    clear(): void;

}

export function createOpcService(
    store: OpcStore,
): OpcService {

    return {

        issue(
            configuration: CreateOpcRecordConfiguration,
        ): OpcRecord {

            const existingRecord =
                store.findById(
                    configuration.id,
                );

            if (existingRecord) {

                throw new Error(
                    `OPC record already exists: ${configuration.id}`,
                );

            }

            const previousRecord =
                store.last();

            const record =
                createOpcRecord({

                    ...configuration,

                    previousHash:
                        configuration.previousHash === undefined
                            ? previousRecord?.outputHash ?? null
                            : configuration.previousHash,

                });

            const verification =
                verifyOpcRecord(
                    record,
                    previousRecord,
                );

            if (!verification.valid) {

                throw new Error(
                    verification.reason
                        ?? "OPC verification failed.",
                );

            }

            store.append(
                record,
            );

            return record;

        },

        verify(
            record: OpcRecord,
            previousRecord?: OpcRecord,
        ): OpcVerificationResult {

            return verifyOpcRecord(
                record,
                previousRecord,
            );

        },

        findById(
            id: string,
        ): OpcRecord | undefined {

            return store.findById(
                id,
            );

        },

        list(): readonly OpcRecord[] {

            return store.list();

        },

        last(): OpcRecord | undefined {

            return store.last();

        },

        clear(): void {

            store.clear();

        },

    };

}
