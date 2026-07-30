/**
 * HERMETICUM B.C.E.
 * AI JOKER-C2
 *
 * IPR Authorization
 *
 * Canonical authorization model.
 */

import type {
    IprSession,
} from "./ipr-session";

export type IprPermission =

    | "conversation:read"
    | "conversation:write"
    | "memory:read"
    | "memory:write"
    | "evt:append"
    | "opc:issue"
    | "admin";

export interface AuthorizationResult {

    readonly allowed: boolean;

    readonly permission: IprPermission;

    readonly reason?: string;

}

export function authorize(

    session: IprSession,

    permission: IprPermission,

): AuthorizationResult {

    if (!session.active) {

        return {

            allowed: false,

            permission,

            reason: "Session is inactive.",

        };

    }

    if (
        session.context.status !==
        "verified"
    ) {

        return {

            allowed: false,

            permission,

            reason: "IPR identity is not verified.",

        };

    }

    return {

        allowed: true,

        permission,

    };

}

export function requireAuthorization(

    session: IprSession,

    permission: IprPermission,

): void {

    const result =
        authorize(
            session,
            permission,
        );

    if (!result.allowed) {

        throw new Error(
            result.reason ??
            "Authorization denied.",
        );

    }

}
