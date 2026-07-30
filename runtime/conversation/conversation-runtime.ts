/**
 * HERMETICUM B.C.E.
 * AI JOKER-C2
 *
 * Conversation Runtime
 *
 * Canonical conversation execution context.
 */

import type {
    JokerKernelRuntime,
} from "../kernel-runtime";

export interface ConversationIdentity {

    sessionId: string;

    subjectId: string;

    conversationId: string;

}

export interface ConversationRuntime {

    readonly kernel: JokerKernelRuntime;

    readonly identity: ConversationIdentity;

    readonly startedAt: Date;

}

export interface ConversationRuntimeConfiguration {

    kernel: JokerKernelRuntime;

    identity: ConversationIdentity;

}

export function createConversationRuntime(
    configuration: ConversationRuntimeConfiguration,
): ConversationRuntime {

    if (!configuration.identity.sessionId.trim()) {
        throw new Error(
            "Conversation sessionId is required.",
        );
    }

    if (!configuration.identity.subjectId.trim()) {
        throw new Error(
            "Conversation subjectId is required.",
        );
    }

    if (!configuration.identity.conversationId.trim()) {
        throw new Error(
            "Conversation conversationId is required.",
        );
    }

    return {

        kernel:
            configuration.kernel,

        identity:
            structuredClone(
                configuration.identity,
            ),

        startedAt:
            new Date(),

    };

}
