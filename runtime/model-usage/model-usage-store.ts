/**
 * HERMETICUM B.C.E.
 * AI JOKER-C2
 *
 * Model Usage Store
 *
 * Canonical in-memory store for immutable
 * model execution records.
 */

import type {
    ModelUsageRecord,
    ModelUsageStatus,
} from "./model-usage-record";

export interface ModelUsageStore {

    append(
        record: ModelUsageRecord,
    ): void;

    list(): readonly ModelUsageRecord[];

    findById(
        id: string,
    ): ModelUsageRecord | undefined;

    findByEventId(
        eventId: string,
    ): readonly ModelUsageRecord[];

    findByOpcId(
        opcId: string,
    ): readonly ModelUsageRecord[];

    findBySubjectId(
        subjectId: string,
    ): readonly ModelUsageRecord[];

    findBySessionId(
        sessionId: string,
    ): readonly ModelUsageRecord[];

    findByProvider(
        provider: string,
    ): readonly ModelUsageRecord[];

    findByModel(
        model: string,
    ): readonly ModelUsageRecord[];

    findByStatus(
        status: ModelUsageStatus,
    ): readonly ModelUsageRecord[];

    clear(): void;

}

export function createModelUsageStore(): ModelUsageStore {

    const records: ModelUsageRecord[] = [];

    return {

        append(
            record: ModelUsageRecord,
        ): void {

            const existingRecord =
                records.find(
                    candidate =>
                        candidate.id === record.id,
                );

            if (existingRecord) {

                throw new Error(
                    `Model usage record already exists: ${record.id}`,
                );

            }

            records.push(
                record,
            );

        },

        list(): readonly ModelUsageRecord[] {

            return [...records];

        },

        findById(
            id: string,
        ): ModelUsageRecord | undefined {

            return records.find(
                record =>
                    record.id === id,
            );

        },

        findByEventId(
            eventId: string,
        ): readonly ModelUsageRecord[] {

            return records.filter(
                record =>
                    record.eventId === eventId,
            );

        },

        findByOpcId(
            opcId: string,
        ): readonly ModelUsageRecord[] {

            return records.filter(
                record =>
                    record.opcId === opcId,
            );

        },

        findBySubjectId(
            subjectId: string,
        ): readonly ModelUsageRecord[] {

            return records.filter(
                record =>
                    record.subjectId === subjectId,
            );

        },

        findBySessionId(
            sessionId: string,
        ): readonly ModelUsageRecord[] {

            return records.filter(
                record =>
                    record.sessionId === sessionId,
            );

        },

        findByProvider(
            provider: string,
        ): readonly ModelUsageRecord[] {

            return records.filter(
                record =>
                    record.provider === provider,
            );

        },

        findByModel(
            model: string,
        ): readonly ModelUsageRecord[] {

            return records.filter(
                record =>
                    record.model === model,
            );

        },

        findByStatus(
            status: ModelUsageStatus,
        ): readonly ModelUsageRecord[] {

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
