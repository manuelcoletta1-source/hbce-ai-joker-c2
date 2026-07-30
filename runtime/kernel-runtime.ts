/**
 * HERMETICUM B.C.E.
 * AI JOKER-C2
 *
 * Kernel Runtime
 *
 * Canonical root runtime for the JOKER-C2 platform.
 */

import {
    bootstrapResearchRuntime,
    type BootstrapResearchRuntime,
} from "./bootstrap-research-runtime";

import type {
    ResearchRuntimeConfiguration,
} from "./create-research-evolution-runtime";

export interface JokerKernelRuntime {

    readonly research: BootstrapResearchRuntime;

    readonly startedAt: Date;

    readonly version: string;

}

export interface JokerKernelConfiguration {

    version: string;

    research: ResearchRuntimeConfiguration;

}

export function createKernelRuntime(
    configuration: JokerKernelConfiguration,
): JokerKernelRuntime {

    const research =
        bootstrapResearchRuntime(
            configuration.research,
        );

    return {

        version:
            configuration.version,

        startedAt:
            new Date(),

        research,

    };

}
