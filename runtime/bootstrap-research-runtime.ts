/**
 * HERMETICUM B.C.E.
 * AI JOKER-C2
 *
 * Canonical Research Runtime Bootstrap
 *
 * Single entry point for the complete
 * Research Evolution Runtime.
 */

import {
    completeResearchMission,
    type ResearchMissionCompletion,
} from "./research-evolution-lifecycle";

import {
    createResearchEvolutionRuntime,
    type ResearchRuntimeConfiguration,
} from "./create-research-evolution-runtime";

export interface BootstrapResearchRuntime {
    runtime: ReturnType<
        typeof createResearchEvolutionRuntime
    >;

    completeMission(
        mission: ResearchMissionCompletion,
    ): ReturnType<
        typeof completeResearchMission
    >;
}

export function bootstrapResearchRuntime(
    configuration: ResearchRuntimeConfiguration,
): BootstrapResearchRuntime {

    const runtime =
        createResearchEvolutionRuntime(
            configuration,
        );

    return {

        runtime,

        completeMission(
            mission,
        ) {

            return completeResearchMission(
                mission,
                runtime.adapters,
            );

        },

    };

}
