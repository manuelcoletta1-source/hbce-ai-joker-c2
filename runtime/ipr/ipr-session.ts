/**
 * HERMETICUM B.C.E.
 * AI JOKER-C2
 *
 * IPR Session
 *
 * Canonical runtime session bound to an IPR Context.
 */

import type {
    IprContext,
} from "./ipr-context";

export interface IprSession {

    readonly id: string;

    readonly context: IprContext;

    readonly startedAt: Date;

    lastActivityAt: Date;

    expiresAt: Date;

    active: boolean;

}

export interface CreateIprSessionConfiguration {

    id: string;

    context: IprContext;

    ttlMilliseconds: number;

}

export function createIprSession(
    configuration: CreateIprSessionConfiguration,
): IprSession {

    if (!configuration.id.trim()) {
        throw new Error("IPR session id is required.");
    }

    if (configuration.ttlMilliseconds <= 0) {
        throw new Error("Session TTL must be greater than zero.");
    }

    const now = new Date();

    return {

        id:
            configuration.id,

        context:
            configuration.context,

        startedAt:
            now,

        lastActivityAt:
            now,

        expiresAt:
            new Date(
                now.getTime() +
                configuration.ttlMilliseconds,
            ),

        active:
            true,

    };

}

export function refreshIprSession(
    session: IprSession,
    ttlMilliseconds: number,
): void {

    const now = new Date();

    session.lastActivityAt = now;

    session.expiresAt = new Date(
        now.getTime() + ttlMilliseconds,
    );

}

export function closeIprSession(
    session: IprSession,
): void {

    session.active = false;

    session.lastActivityAt = new Date();

}

export function isIprSessionExpired(
    session: IprSession,
): boolean {

    return (
        !session.active ||
        session.expiresAt.getTime() <= Date.now()
    );

}
