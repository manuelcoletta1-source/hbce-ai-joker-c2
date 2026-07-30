/**
 * HERMETICUM B.C.E.
 * AI JOKER-C2
 *
 * Model Usage Record
 *
 * Canonical immutable record describing
 * a single model execution.
 */

export type ModelUsageStatus =
    | "completed"
    | "failed"
    | "cancelled";

export interface ModelUsageTokenCount {

    readonly input: number;

    readonly output: number;

    readonly total: number;

}

export interface ModelUsageCost {

    readonly currency: string;

    readonly input: number;

    readonly output: number;

    readonly total: number;

}

export interface ModelUsageRecord {

    readonly id: string;

    readonly subjectId: string;

    readonly sessionId: string;

    readonly eventId: string | null;

    readonly opcId: string | null;

    readonly provider: string;

    readonly model: string;

    readonly operation: string;

    readonly startedAt: Date;

    readonly completedAt: Date;

    readonly latencyMs: number;

    readonly tokens: ModelUsageTokenCount;

    readonly cost: ModelUsageCost | null;

    readonly status: ModelUsageStatus;

    readonly errorCode: string | null;

    readonly inputHash: string;

    readonly outputHash: string | null;

    readonly metadata: Readonly<Record<string, unknown>>;

}

export interface CreateModelUsageRecordConfiguration {

    readonly id: string;

    readonly subjectId: string;

    readonly sessionId: string;

    readonly eventId?: string | null;

    readonly opcId?: string | null;

    readonly provider: string;

    readonly model: string;

    readonly operation: string;

    readonly startedAt: Date;

    readonly completedAt: Date;

    readonly tokens: {

        readonly input: number;

        readonly output: number;

    };

    readonly cost?: {

        readonly currency: string;

        readonly input: number;

        readonly output: number;

    } | null;

    readonly status: ModelUsageStatus;

    readonly errorCode?: string | null;

    readonly inputHash: string;

    readonly outputHash?: string | null;

    readonly metadata?: Readonly<Record<string, unknown>>;

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

function requireNonNegativeInteger(
    value: number,
    fieldName: string,
): number {

    if (
        !Number.isInteger(value)
        || value < 0
    ) {

        throw new Error(
            `${fieldName} must be a non-negative integer.`,
        );

    }

    return value;

}

function requireNonNegativeFiniteNumber(
    value: number,
    fieldName: string,
): number {

    if (
        !Number.isFinite(value)
        || value < 0
    ) {

        throw new Error(
            `${fieldName} must be a non-negative finite number.`,
        );

    }

    return value;

}

function copyValidDate(
    value: Date,
    fieldName: string,
): Date {

    if (
        !(value instanceof Date)
        || Number.isNaN(value.getTime())
    ) {

        throw new Error(
            `${fieldName} must be a valid date.`,
        );

    }

    return new Date(
        value.getTime(),
    );

}

export function createModelUsageRecord(
    configuration: CreateModelUsageRecordConfiguration,
): ModelUsageRecord {

    const startedAt =
        copyValidDate(
            configuration.startedAt,
            "Started at",
        );

    const completedAt =
        copyValidDate(
            configuration.completedAt,
            "Completed at",
        );

    if (
        completedAt.getTime()
        < startedAt.getTime()
    ) {

        throw new Error(
            "Completed at cannot precede started at.",
        );

    }

    const inputTokens =
        requireNonNegativeInteger(
            configuration.tokens.input,
            "Input tokens",
        );

    const outputTokens =
        requireNonNegativeInteger(
            configuration.tokens.output,
            "Output tokens",
        );

    const tokens: ModelUsageTokenCount =
        Object.freeze({

            input:
                inputTokens,

            output:
                outputTokens,

            total:
                inputTokens
                + outputTokens,

        });

    const cost =
        configuration.cost
            ? Object.freeze({

                currency:
                    requireNonEmptyValue(
                        configuration.cost.currency,
                        "Cost currency",
                    ).toUpperCase(),

                input:
                    requireNonNegativeFiniteNumber(
                        configuration.cost.input,
                        "Input cost",
                    ),

                output:
                    requireNonNegativeFiniteNumber(
                        configuration.cost.output,
                        "Output cost",
                    ),

                total:
                    requireNonNegativeFiniteNumber(
                        configuration.cost.input,
                        "Input cost",
                    )
                    + requireNonNegativeFiniteNumber(
                        configuration.cost.output,
                        "Output cost",
                    ),

            })
            : null;

    const errorCode =
        configuration.errorCode?.trim()
        || null;

    const outputHash =
        configuration.outputHash?.trim()
        || null;

    if (
        configuration.status === "completed"
        && !outputHash
    ) {

        throw new Error(
            "Completed model usage requires an output hash.",
        );

    }

    if (
        configuration.status === "failed"
        && !errorCode
    ) {

        throw new Error(
            "Failed model usage requires an error code.",
        );

    }

    return Object.freeze({

        id:
            requireNonEmptyValue(
                configuration.id,
                "Model usage record id",
            ),

        subjectId:
            requireNonEmptyValue(
                configuration.subjectId,
                "Subject id",
            ),

        sessionId:
            requireNonEmptyValue(
                configuration.sessionId,
                "Session id",
            ),

        eventId:
            configuration.eventId?.trim()
            || null,

        opcId:
            configuration.opcId?.trim()
            || null,

        provider:
            requireNonEmptyValue(
                configuration.provider,
                "Model provider",
            ),

        model:
            requireNonEmptyValue(
                configuration.model,
                "Model name",
            ),

        operation:
            requireNonEmptyValue(
                configuration.operation,
                "Operation",
            ),

        startedAt,

        completedAt,

        latencyMs:
            completedAt.getTime()
            - startedAt.getTime(),

        tokens,

        cost,

        status:
            configuration.status,

        errorCode,

        inputHash:
            requireNonEmptyValue(
                configuration.inputHash,
                "Input hash",
            ),

        outputHash,

        metadata:
            Object.freeze({
                ...(configuration.metadata ?? {}),
            }),

    });

}
