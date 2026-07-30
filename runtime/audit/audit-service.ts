/**
 * HERMETICUM B.C.E.
 * AI JOKER-C2
 *
 * Audit Service
 *
 * Canonical service for creating and querying
 * immutable audit projections.
 */

import type {
    EvtRecord,
} from "../evt";

import type {
    OpcRecord,
} from "../opc";

import {
    createAuditRecord,
    type AuditRecord,
    type AuditRecordStatus,
} from "./audit-record";

import type {
    AuditStore,
} from "./audit-store";

export interface CreateAuditProjectionConfiguration {

    readonly id: string;

    readonly event?: EvtRecord | null;

    readonly proof?: OpcRecord | null;

    readonly metadata?: Readonly<Record<string, unknown>>;

}

export interface AuditService {

    project(
        configuration: CreateAuditProjectionConfiguration,
    ): AuditRecord;

    findById(
        id: string,
    ): AuditRecord | undefined;

    findByEventId(
        eventId: string,
    ): AuditRecord | undefined;

    findByOpcId(
        opcId: string,
    ): AuditRecord | undefined;

    findBySubjectId(
        subjectId: string,
    ): readonly AuditRecord[];

    findBySessionId(
        sessionId: string,
    ): readonly AuditRecord[];

    findByStatus(
        status: AuditRecordStatus,
    ): readonly AuditRecord[];

    list(): readonly AuditRecord[];

    clear(): void;

}

function requireNonEmptyValue(
    value: string,
    fieldName: string,
): string {

    const normalizedValue =
        value.trim();

    if (!normalizedValue) {

        throw new Error(
            `${fieldName} is required.`,
        );

    }

    return normalizedValue;

}

function assertProjectionNotRegistered(
    store: AuditStore,
    event: EvtRecord | null,
    proof: OpcRecord | null,
): void {

    if (event) {

        const existingEventProjection =
            store.findByEventId(
                event.id,
            );

        if (existingEventProjection) {

            throw new Error(
                `Audit projection already exists for EVT record: ${event.id}`,
            );

        }

    }

    if (proof) {

        const existingProofProjection =
            store.findByOpcId(
                proof.id,
            );

        if (existingProofProjection) {

            throw new Error(
                `Audit projection already exists for OPC record: ${proof.id}`,
            );

        }

    }

}

export function createAuditService(
    store: AuditStore,
): AuditService {

    return {

        project(
            configuration: CreateAuditProjectionConfiguration,
        ): AuditRecord {

            const id =
                requireNonEmptyValue(
                    configuration.id,
                    "Audit record id",
                );

            const event =
                configuration.event ?? null;

            const proof =
                configuration.proof ?? null;

            if (store.findById(id)) {

                throw new Error(
                    `Audit record already exists: ${id}`,
                );

            }

            assertProjectionNotRegistered(
                store,
                event,
                proof,
            );

            const record =
                createAuditRecord({

                    id,

                    event,

                    proof,

                    metadata: {
                        ...(configuration.metadata ?? {}),
                    },

                });

            store.append(
                record,
            );

            return record;

        },

        findById(
            id: string,
        ): AuditRecord | undefined {

            return store.findById(
                requireNonEmptyValue(
                    id,
                    "Audit record id",
                ),
            );

        },

        findByEventId(
            eventId: string,
        ): AuditRecord | undefined {

            return store.findByEventId(
                requireNonEmptyValue(
                    eventId,
                    "EVT record id",
                ),
            );

        },

        findByOpcId(
            opcId: string,
        ): AuditRecord | undefined {

            return store.findByOpcId(
                requireNonEmptyValue(
                    opcId,
                    "OPC record id",
                ),
            );

        },

        findBySubjectId(
            subjectId: string,
        ): readonly AuditRecord[] {

            return store.findBySubjectId(
                requireNonEmptyValue(
                    subjectId,
                    "Subject id",
                ),
            );

        },

        findBySessionId(
            sessionId: string,
        ): readonly AuditRecord[] {

            return store.findBySessionId(
                requireNonEmptyValue(
                    sessionId,
                    "Session id",
                ),
            );

        },

        findByStatus(
            status: AuditRecordStatus,
        ): readonly AuditRecord[] {

            return store.findByStatus(
                status,
            );

        },

        list(): readonly AuditRecord[] {

            return store.list();

        },

        clear(): void {

            store.clear();

        },

    };

}
