/**
 * HERMETICUM B.C.E.
 * AI JOKER-C2
 *
 * IPR Context
 *
 * Canonical identity context bound to a runtime session.
 */

export type IprVerificationStatus =
    | "pending"
    | "verified"
    | "revoked";

export interface IprContext {

    readonly iprId: string;

    readonly subjectId: string;

    readonly sessionId: string;

    readonly verifiedAt: Date | null;

    readonly status: IprVerificationStatus;

    readonly metadata: Readonly<Record<string, unknown>>;

}

export interface CreateIprContextConfiguration {

    iprId: string;

    subjectId: string;

    sessionId: string;

    verifiedAt?: Date | null;

    status?: IprVerificationStatus;

    metadata?: Record<string, unknown>;

}

export function createIprContext(
    configuration: CreateIprContextConfiguration,
): IprContext {

    if (!configuration.iprId.trim()) {
        throw new Error("IPR id is required.");
    }

    if (!configuration.subjectId.trim()) {
        throw new Error("Subject id is required.");
    }

    if (!configuration.sessionId.trim()) {
        throw new Error("Session id is required.");
    }

    return {

        iprId:
            configuration.iprId,

        subjectId:
            configuration.subjectId,

        sessionId:
            configuration.sessionId,

        verifiedAt:
            configuration.verifiedAt ?? null,

        status:
            configuration.status ?? "pending",

        metadata:
            Object.freeze({
                ...(configuration.metadata ?? {}),
            }),

    };

}
