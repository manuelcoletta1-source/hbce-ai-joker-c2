/**
 * HERMETICUM B.C.E.
 * AI JOKER-C2
 *
 * Conversation Memory Service
 *
 * Canonical API for interacting with the
 * Conversation Memory.
 */

import type {
    ConversationContext,
} from "./create-conversation-context";

import type {
    ConversationMessage,
} from "./conversation-memory";

import {
    appendConversationMessage,
    clearConversationMemory,
    getConversationMessages,
} from "./conversation-memory";

import {
    incrementConversationMessages,
} from "./conversation-state";

export class ConversationMemoryService {

    constructor(
        private readonly context: ConversationContext,
    ) {}

    append(
        message: ConversationMessage,
    ): void {

        appendConversationMessage(
            this.context.memory,
            message,
        );

        incrementConversationMessages(
            this.context.state,
        );

    }

    list(): readonly ConversationMessage[] {

        return getConversationMessages(
            this.context.memory,
        );

    }

    clear(): void {

        clearConversationMemory(
            this.context.memory,
        );

        this.context.state.messageCount = 0;
        this.context.state.updatedAt = new Date();

    }

}
