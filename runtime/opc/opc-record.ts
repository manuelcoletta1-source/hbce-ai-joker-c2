/**
 * HERMETICUM B.C.E.
 * AI JOKER-C2
 *
 * OPC Record
 *
 * Canonical immutable Operational Proof & Compliance record.
 *
 * OPC provides technical evidence of a runtime operation.
 * It does not constitute legal certification.
 */

export type OpcRecordStatus =
    | "issued"
    | "verified"
    | "invalidated";

export interface OpcRecord {

    readonly id: string;

    readonly eventId: string;

    readonly iprId: string;

    readonly subjectId: string;

    readonly sessionId: string;

    readonly operation: string;

    readonly inputHash: string | null;

    readonly outputHash: string | null;

    readonly previousHash: string | null;

    readonly createdAt: Date;

    readonly status: OpcRecordStatus;

    readonly legalCertification: false;

    readonly metadata: Readonly<Record<string, unknown>>;

}

export interface CreateOpcRecordConfiguration {

    id: string;

    eventId: string;

    iprId: string;

    subjectId: string;

    sessionId: string;

    operation: string;

    inputHash?: string | null;

    outputHash?: string | null;

    previousHash?: string | null;

    createdAt?: Date;

    status?: OpcRecordStatus;

    metadata?: Record<string, unknown>;

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

function normalizeOptionalHash(
    value: string | null | undefined,
): string | null {

    if (value === null || value === undefined) {
        return null;
    }

    const normalizedValue =
        value.trim();

    return normalizedValue || null;

}

export function createOpcRecord(
    configuration: CreateOpcRecordConfiguration,
): OpcRecord {

    const createdAt =
        configuration.createdAt
            ? new Date(configuration.createdAt.getTime())
            : new Date();

    if (
        Number.isNaN(
            createdAt.getTime(),
        )
    ) {
        throw new Error(
            "OPC creation date is invalid.",
        );
    }

    return Object.freeze({

        id:
            requireNonEmptyValue(
                configuration.id,
                "OPC record id",
            ),

        eventId:
            requireNonEmptyValue(
                configuration.eventId,
                "Event id",
            ),

        iprId:
            requireNonEmptyValue(
                configuration.iprId,
                "IPR id",
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

        operation:
            requireNonEmptyValue(
                configuration.operation,
                "Operation",
            ),

        inputHash:
            normalizeOptionalHash(
                configuration.inputHash,
            ),

        outputHash:
            normalizeOptionalHash(
                configuration.outputHash,
            ),

        previousHash:
            normalizeOptionalHash(
                configuration.previousHash,
            ),

        createdAt,

        status:
            configuration.status ?? "issued",

        legalCertification:
            false as const,

        metadata:
            Object.freeze({
                ...(configuration.metadata ?? {}),
            }),

    });

}
