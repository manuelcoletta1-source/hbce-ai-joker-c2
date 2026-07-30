/**
 * HERMETICUM B.C.E.
 * AI JOKER-C2
 *
 * Conversation Context Factory
 *
 * Canonical factory assembling the complete
 * Conversation execution context.
 */

import {
    createConversationRuntime,
    type ConversationRuntime,
    type ConversationIdentity,
} from "./conversation-runtime";

import {
    createConversationState,
    type ConversationState,
} from "./conversation-state";

import {
    createConversationMemory,
    type ConversationMemory,
} from "./conversation-memory";

import type {
    JokerKernelRuntime,
} from "../kernel-runtime";

export interface ConversationContext
    extends ConversationRuntime {

    readonly state: ConversationState;

    readonly memory: ConversationMemory;

}

export interface ConversationContextConfiguration {

    kernel: JokerKernelRuntime;

    identity: ConversationIdentity;

}

export function createConversationContext(
    configuration: ConversationContextConfiguration,
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

        memory:
            createConversationMemory(),

    };

}
