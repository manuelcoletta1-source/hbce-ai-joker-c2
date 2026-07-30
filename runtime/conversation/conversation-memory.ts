/**
 * HERMETICUM B.C.E.
 * AI JOKER-C2
 *
 * Conversation Memory
 *
 * Canonical in-memory conversation history.
 */

export interface ConversationMessage {

    id: string;

    role: "system" | "user" | "assistant" | "tool";

    content: string;

    timestamp: Date;

    metadata: Record<string, unknown>;

}

export interface ConversationMemory {

    readonly messages: ConversationMessage[];

}

export function createConversationMemory(): ConversationMemory {

    return {

        messages: [],

    };

}

export function appendConversationMessage(

    memory: ConversationMemory,

    message: ConversationMessage,

): void {

    memory.messages.push({

        ...message,

        metadata: structuredClone(
            message.metadata,
        ),

    });

}

export function getConversationMessages(

    memory: ConversationMemory,

): readonly ConversationMessage[] {

    return memory.messages;

}

export function clearConversationMemory(

    memory: ConversationMemory,

): void {

    memory.messages.length = 0;

}
