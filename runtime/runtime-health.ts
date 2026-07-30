/**
 * HERMETICUM B.C.E.
 * AI JOKER-C2
 *
 * Runtime Health
 *
 * Produces a deterministic health projection
 * for the canonical JOKER-C2 runtime.
 */

import type {
    JokerRuntime,
} from "./create-joker-runtime";

export type RuntimeHealthStatus =
    | "healthy"
    | "degraded"
    | "unavailable";

export interface RuntimeModuleHealth {

    readonly name: string;

    readonly available: boolean;

}

export interface RuntimeHealth {

    readonly status: RuntimeHealthStatus;

    readonly checkedAt: Date;

    readonly availableModuleCount: number;

    readonly totalModuleCount: number;

    readonly modules:
        readonly RuntimeModuleHealth[];

}

function createModuleHealth(
    name: string,
    module: unknown,
): RuntimeModuleHealth {

    return Object.freeze({

        name,

        available:
            module !== null
            && module !== undefined,

    });

}

export function inspectRuntimeHealth(
    runtime: JokerRuntime,
    checkedAt: Date = new Date(),
): RuntimeHealth {

    if (
        !(checkedAt instanceof Date)
        || Number.isNaN(
            checkedAt.getTime(),
        )
    ) {

        throw new Error(
            "Runtime health check time must be a valid date.",
        );

    }

    const modules =
        Object.freeze([

            createModuleHealth(
                "research",
                runtime.research,
            ),

            createModuleHealth(
                "conversation",
                runtime.conversation,
            ),

            createModuleHealth(
                "ipr",
                runtime.ipr,
            ),

            createModuleHealth(
                "evt",
                runtime.evt,
            ),

            createModuleHealth(
                "opc",
                runtime.opc,
            ),

            createModuleHealth(
                "audit",
                runtime.audit,
            ),

            createModuleHealth(
                "model-usage",
                runtime.modelUsage,
            ),

        ]);

    const totalModuleCount =
        modules.length;

    const availableModuleCount =
        modules.filter(
            module =>
                module.available,
        ).length;

    let status: RuntimeHealthStatus;

    if (availableModuleCount === totalModuleCount) {

        status = "healthy";

    } else if (availableModuleCount === 0) {

        status = "unavailable";

    } else {

        status = "degraded";

    }

    return Object.freeze({

        status,

        checkedAt:
            new Date(
                checkedAt.getTime(),
            ),

        availableModuleCount,

        totalModuleCount,

        modules,

    });

}
