/**
 * HERMETICUM B.C.E.
 * AI JOKER-C2
 *
 * IPR Runtime Factory
 *
 * Canonical assembly of the IPR Runtime.
 */

import {
    createIprContext,
    type CreateIprContextConfiguration,
    type IprContext,
} from "./ipr-context";

import {
    createIprSession,
    type IprSession,
} from "./ipr-session";

import {
    authorize,
    requireAuthorization,
} from "./ipr-authorization";

import {
    verifyIprContext,
    assertVerified,
} from "./ipr-verification";

export interface IprRuntime {

    readonly context: IprContext;

    readonly session: IprSession;

    readonly authorize: typeof authorize;

    readonly requireAuthorization: typeof requireAuthorization;

    readonly verify: typeof verifyIprContext;

    readonly assertVerified: typeof assertVerified;

}

export interface CreateIprRuntimeConfiguration
    extends CreateIprContextConfiguration {

    sessionId: string;

    sessionTtlMilliseconds: number;

}

export function createIprRuntime(
    configuration: CreateIprRuntimeConfiguration,
): IprRuntime {

    const context =
        createIprContext(configuration);

    const session =
        createIprSession({

            id:
                configuration.sessionId,

            context,

            ttlMilliseconds:
                configuration.sessionTtlMilliseconds,

        });

    return {

        context,

        session,

        authorize,

        requireAuthorization,

        verify:
            verifyIprContext,

        assertVerified,

    };

}
