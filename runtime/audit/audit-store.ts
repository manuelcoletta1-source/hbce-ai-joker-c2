/**
 * HERMETICUM B.C.E.
 * AI JOKER-C2
 *
 * Audit Store
 *
 * Canonical in-memory store for immutable audit records.
 */

import type {
    AuditRecord,
    AuditRecordStatus,
} from "./audit-record";

export interface AuditStore {

    append(
        record: AuditRecord,
    ): void;

    list(): readonly AuditRecord[];

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

    clear(): void;

}

export function createAuditStore(): AuditStore {

    const records: AuditRecord[] = [];

    return {

        append(
            record: AuditRecord,
        ): void {

            const existingRecord =
                records.find(
                    candidate =>
                        candidate.id === record.id,
                );

            if (existingRecord) {

                throw new Error(
                    `Audit record already exists: ${record.id}`,
                );

            }

            records.push(
                record,
            );

        },

        list(): readonly AuditRecord[] {

            return [...records];

        },

        findById(
            id: string,
        ): AuditRecord | undefined {

            return records.find(
                record => record.id === id,
            );

        },

        findByEventId(
            eventId: string,
        ): AuditRecord | undefined {

            return records.find(
                record => record.eventId === eventId,
            );

        },

        findByOpcId(
            opcId: string,
        ): AuditRecord | undefined {

            return records.find(
                record => record.opcId === opcId,
            );

        },

        findBySubjectId(
            subjectId: string,
        ): readonly AuditRecord[] {

            return records.filter(
                record =>
                    record.subjectId === subjectId,
            );

        },

        findBySessionId(
            sessionId: string,
        ): readonly AuditRecord[] {

            return records.filter(
                record =>
                    record.sessionId === sessionId,
            );

        },

        findByStatus(
            status: AuditRecordStatus,
        ): readonly AuditRecord[] {

            return records.filter(
                record =>
                    record.status === status,
            );

        },

        clear(): void {

            records.length = 0;

        },

    };

}
