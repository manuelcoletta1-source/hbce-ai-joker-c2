/**
 * HERMETICUM B.C.E.
 * AI JOKER-C2
 *
 * Conversation State
 *
 * Canonical mutable state associated with a conversation runtime.
 */

export interface ConversationState {

    readonly createdAt: Date;

    updatedAt: Date;

    messageCount: number;

    metadata: Record<string, unknown>;

}

export function createConversationState(): ConversationState {

    const now = new Date();

    return {

        createdAt: now,

        updatedAt: now,

        messageCount: 0,

        metadata: {},

    };

}

export function incrementConversationMessages(
    state: ConversationState,
): void {

    state.messageCount += 1;

    state.updatedAt = new Date();

}

export function updateConversationMetadata(
    state: ConversationState,
    key: string,
    value: unknown,
): void {

    state.metadata[key] = value;

    state.updatedAt = new Date();

}
