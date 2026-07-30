/**
 * HERMETICUM B.C.E.
 * AI JOKER-C2
 *
 * Audit Record
 *
 * Canonical immutable audit projection linking
 * an EVT event to its corresponding OPC proof.
 */

import type {
    EvtRecord,
} from "../evt";

import type {
    OpcRecord,
} from "../opc";

export type AuditRecordStatus =
    | "complete"
    | "event-only"
    | "proof-only"
    | "inconsistent";

export interface AuditRecord {

    readonly id: string;

    readonly eventId: string | null;

    readonly opcId: string | null;

    readonly subjectId: string;

    readonly sessionId: string;

    readonly operation: string;

    readonly eventTimestamp: Date | null;

    readonly proofTimestamp: Date | null;

    readonly status: AuditRecordStatus;

    readonly event: EvtRecord | null;

    readonly proof: OpcRecord | null;

    readonly metadata: Readonly<Record<string, unknown>>;

}

export interface CreateAuditRecordConfiguration {

    id: string;

    event?: EvtRecord | null;

    proof?: OpcRecord | null;

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

function determineAuditStatus(
    event: EvtRecord | null,
    proof: OpcRecord | null,
): AuditRecordStatus {

    if (event && proof) {

        if (
            event.id !== proof.eventId
            || event.subjectId !== proof.subjectId
            || event.sessionId !== proof.sessionId
        ) {

            return "inconsistent";

        }

        return "complete";

    }

    if (event) {

        return "event-only";

    }

    if (proof) {

        return "proof-only";

    }

    return "inconsistent";

}

export function createAuditRecord(
    configuration: CreateAuditRecordConfiguration,
): AuditRecord {

    const event =
        configuration.event ?? null;

    const proof =
        configuration.proof ?? null;

    if (!event && !proof) {

        throw new Error(
            "Audit record requires an EVT event or an OPC proof.",
        );

    }

    const subjectId =
        requireNonEmptyValue(
            event?.subjectId
                ?? proof?.subjectId
                ?? "",
            "Subject id",
        );

    const sessionId =
        requireNonEmptyValue(
            event?.sessionId
                ?? proof?.sessionId
                ?? "",
            "Session id",
        );

    const operation =
        requireNonEmptyValue(
            proof?.operation
                ?? event?.type
                ?? "",
            "Operation",
        );

    return Object.freeze({

        id:
            requireNonEmptyValue(
                configuration.id,
                "Audit record id",
            ),

        eventId:
            event?.id ?? proof?.eventId ?? null,

        opcId:
            proof?.id ?? null,

        subjectId,

        sessionId,

        operation,

        eventTimestamp:
            event
                ? new Date(
                    event.timestamp.getTime(),
                )
                : null,

        proofTimestamp:
            proof
                ? new Date(
                    proof.createdAt.getTime(),
                )
                : null,

        status:
            determineAuditStatus(
                event,
                proof,
            ),

        event,

        proof,

        metadata:
            Object.freeze({
                ...(configuration.metadata ?? {}),
            }),

    });

}
