/**
 * HERMETICUM B.C.E.
 * AI JOKER-C2
 *
 * Conversation Runtime Factory
 *
 * Canonical factory that creates a complete
 * Conversation Runtime with its initial state.
 */

import {
    createConversationRuntime,
    type ConversationIdentity,
    type ConversationRuntime,
} from "./conversation-runtime";

import {
    createConversationState,
    type ConversationState,
} from "./conversation-state";

import type {
    JokerKernelRuntime,
} from "../kernel-runtime";

export interface ConversationContext
    extends ConversationRuntime {

    readonly state: ConversationState;

}

export interface ConversationConfiguration {

    kernel: JokerKernelRuntime;

    identity: ConversationIdentity;

}

export function createConversationContext(
    configuration: ConversationConfiguration,
): ConversationContext {

    const runtime =
        createConversationRuntime({
            kernel: configuration.kernel,
            identity: configuration.identity,
        });

    return {

        ...runtime,

        state:
            createConversationState(),

    };

}
