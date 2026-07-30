/**
 * HERMETICUM B.C.E.
 * AI JOKER-C2
 *
 * Model Usage Service
 *
 * Canonical service for recording and querying
 * immutable model execution evidence.
 */

import {
    createModelUsageRecord,
    type CreateModelUsageRecordConfiguration,
    type ModelUsageRecord,
    type ModelUsageStatus,
} from "./model-usage-record";

import type {
    ModelUsageStore,
} from "./model-usage-store";

export interface ModelUsageSummary {

    readonly executionCount: number;

    readonly completedCount: number;

    readonly failedCount: number;

    readonly cancelledCount: number;

    readonly inputTokens: number;

    readonly outputTokens: number;

    readonly totalTokens: number;

    readonly totalLatencyMs: number;

    readonly averageLatencyMs: number;

    readonly costByCurrency:
        Readonly<Record<string, number>>;

}

export interface ModelUsageService {

    record(
        configuration: CreateModelUsageRecordConfiguration,
    ): ModelUsageRecord;

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

    summarize(
        records?: readonly ModelUsageRecord[],
    ): ModelUsageSummary;

    list(): readonly ModelUsageRecord[];

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

function createSummary(
    records: readonly ModelUsageRecord[],
): ModelUsageSummary {

    let completedCount = 0;
    let failedCount = 0;
    let cancelledCount = 0;

    let inputTokens = 0;
    let outputTokens = 0;
    let totalTokens = 0;
    let totalLatencyMs = 0;

    const costByCurrency:
        Record<string, number> = {};

    for (const record of records) {

        if (record.status === "completed") {

            completedCount += 1;

        } else if (record.status === "failed") {

            failedCount += 1;

        } else {

            cancelledCount += 1;

        }

        inputTokens +=
            record.tokens.input;

        outputTokens +=
            record.tokens.output;

        totalTokens +=
            record.tokens.total;

        totalLatencyMs +=
            record.latencyMs;

        if (record.cost) {

            const currency =
                record.cost.currency;

            costByCurrency[currency] =
                (costByCurrency[currency] ?? 0)
                + record.cost.total;

        }

    }

    const executionCount =
        records.length;

    return Object.freeze({

        executionCount,

        completedCount,

        failedCount,

        cancelledCount,

        inputTokens,

        outputTokens,

        totalTokens,

        totalLatencyMs,

        averageLatencyMs:
            executionCount === 0
                ? 0
                : totalLatencyMs
                / executionCount,

        costByCurrency:
            Object.freeze({
                ...costByCurrency,
            }),

    });

}

export function createModelUsageService(
    store: ModelUsageStore,
): ModelUsageService {

    return {

        record(
            configuration:
                CreateModelUsageRecordConfiguration,
        ): ModelUsageRecord {

            const existingRecord =
                store.findById(
                    configuration.id,
                );

            if (existingRecord) {

                throw new Error(
                    `Model usage record already exists: ${configuration.id}`,
                );

            }

            const record =
                createModelUsageRecord(
                    configuration,
                );

            store.append(
                record,
            );

            return record;

        },

        findById(
            id: string,
        ): ModelUsageRecord | undefined {

            return store.findById(
                requireNonEmptyValue(
                    id,
                    "Model usage record id",
                ),
            );

        },

        findByEventId(
            eventId: string,
        ): readonly ModelUsageRecord[] {

            return store.findByEventId(
                requireNonEmptyValue(
                    eventId,
                    "EVT record id",
                ),
            );

        },

        findByOpcId(
            opcId: string,
        ): readonly ModelUsageRecord[] {

            return store.findByOpcId(
                requireNonEmptyValue(
                    opcId,
                    "OPC record id",
                ),
            );

        },

        findBySubjectId(
            subjectId: string,
        ): readonly ModelUsageRecord[] {

            return store.findBySubjectId(
                requireNonEmptyValue(
                    subjectId,
                    "Subject id",
                ),
            );

        },

        findBySessionId(
            sessionId: string,
        ): readonly ModelUsageRecord[] {

            return store.findBySessionId(
                requireNonEmptyValue(
                    sessionId,
                    "Session id",
                ),
            );

        },

        findByProvider(
            provider: string,
        ): readonly ModelUsageRecord[] {

            return store.findByProvider(
                requireNonEmptyValue(
                    provider,
                    "Model provider",
                ),
            );

        },

        findByModel(
            model: string,
        ): readonly ModelUsageRecord[] {

            return store.findByModel(
                requireNonEmptyValue(
                    model,
                    "Model name",
                ),
            );

        },

        findByStatus(
            status: ModelUsageStatus,
        ): readonly ModelUsageRecord[] {

            return store.findByStatus(
                status,
            );

        },

        summarize(
            records?: readonly ModelUsageRecord[],
        ): ModelUsageSummary {

            return createSummary(
                records ?? store.list(),
            );

        },

        list(): readonly ModelUsageRecord[] {

            return store.list();

        },

        clear(): void {

            store.clear();

        },

    };

}
