/**
 * HERMETICUM B.C.E.
 * AI JOKER-C2
 *
 * Canonical Runtime Composition
 *
 * Assembles the independent domain runtimes
 * into one coherent JOKER-C2 runtime.
 */

import {
    createResearchRuntime,
    type ResearchRuntime,
} from "./research";

import {
    createConversationRuntime,
    type ConversationRuntime,
} from "./conversation";

import {
    createIprRuntime,
    type IprRuntime,
} from "./ipr";

import {
    createEvtRuntime,
    type EvtRuntime,
} from "./evt";

import {
    createOpcRuntime,
    type OpcRuntime,
} from "./opc";

import {
    createAuditRuntime,
    type AuditRuntime,
} from "./audit";

import {
    createModelUsageRuntime,
    type ModelUsageRuntime,
} from "./model-usage";

export interface JokerRuntime {

    readonly research: ResearchRuntime;

    readonly conversation: ConversationRuntime;

    readonly ipr: IprRuntime;

    readonly evt: EvtRuntime;

    readonly opc: OpcRuntime;

    readonly audit: AuditRuntime;

    readonly modelUsage: ModelUsageRuntime;

}

export function createJokerRuntime(): JokerRuntime {

    const research =
        createResearchRuntime();

    const conversation =
        createConversationRuntime();

    const ipr =
        createIprRuntime();

    const evt =
        createEvtRuntime();

    const opc =
        createOpcRuntime();

    const audit =
        createAuditRuntime();

    const modelUsage =
        createModelUsageRuntime();

    return Object.freeze({

        research,

        conversation,

        ipr,

        evt,

        opc,

        audit,

        modelUsage,

    });

}
