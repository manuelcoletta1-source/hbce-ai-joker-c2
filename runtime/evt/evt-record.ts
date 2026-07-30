/**
 * HERMETICUM B.C.E.
 * AI JOKER-C2
 *
 * EVT Record
 *
 * Canonical immutable event model.
 */

export interface EvtRecord {

    readonly id: string;

    readonly type: string;

    readonly subjectId: string;

    readonly sessionId: string;

    readonly timestamp: Date;

    readonly payload: Readonly<Record<string, unknown>>;

}

export interface CreateEvtRecordConfiguration {

    id: string;

    type: string;

    subjectId: string;

    sessionId: string;

    payload?: Record<string, unknown>;

}

export function createEvtRecord(
    configuration: CreateEvtRecordConfiguration,
): EvtRecord {

    if (!configuration.id.trim()) {
        throw new Error("Event id is required.");
    }

    if (!configuration.type.trim()) {
        throw new Error("Event type is required.");
    }

    if (!configuration.subjectId.trim()) {
        throw new Error("Subject id is required.");
    }

    if (!configuration.sessionId.trim()) {
        throw new Error("Session id is required.");
    }

    return {

        id: configuration.id,

        type: configuration.type,

        subjectId: configuration.subjectId,

        sessionId: configuration.sessionId,

        timestamp: new Date(),

        payload: Object.freeze({
            ...(configuration.payload ?? {}),
        }),

    };

}
