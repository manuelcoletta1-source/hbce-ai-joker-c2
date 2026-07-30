/**
 * HERMETICUM B.C.E.
 * AI JOKER-C2
 *
 * Canonical Runtime Health Inspection
 *
 * Inspects the current JokerRuntime without assuming fixed module
 * properties such as runtime.research or runtime.conversation.
 *
 * Runtime modules are discovered exclusively through runtime.modules.
 */

import {
    type JokerRuntime,
    type JokerRuntimeModule,
    type JokerRuntimeModuleStatus,
    type JokerRuntimeStatus,
} from "./create-joker-runtime";

export type RuntimeHealthStatus =
    | "healthy"
    | "degraded"
    | "unavailable";

export interface RuntimeModuleHealth {

    readonly name:
        string;

    readonly status:
        JokerRuntimeModuleStatus;

    readonly healthy:
        boolean;

    readonly capabilities:
        readonly string[];

}

export interface RuntimeHealth {

    readonly runtimeName:
        JokerRuntime["name"];

    readonly runtimeVersion:
        string;

    readonly runtimeStatus:
        JokerRuntimeStatus;

    readonly status:
        RuntimeHealthStatus;

    readonly healthy:
        boolean;

    readonly moduleCount:
        number;

    readonly activeModuleCount:
        number;

    readonly degradedModuleCount:
        number;

    readonly unavailableModuleCount:
        number;

    readonly modules:
        readonly RuntimeModuleHealth[];

    readonly capabilities:
        readonly string[];

    readonly createdAt:
        Date;

    readonly checkedAt:
        Date;

}

function requireRuntime(
    runtime: JokerRuntime,
): JokerRuntime {

    if (
        runtime === null
        || runtime === undefined
        || typeof runtime !== "object"
    ) {

        throw new Error(
            "Runtime is required.",
        );

    }

    if (
        !Array.isArray(
            runtime.modules,
        )
    ) {

        throw new Error(
            "Runtime modules must be an array.",
        );

    }

    if (
        !Array.isArray(
            runtime.capabilities,
        )
    ) {

        throw new Error(
            "Runtime capabilities must be an array.",
        );

    }

    if (
        !(runtime.createdAt instanceof Date)
        || Number.isNaN(
            runtime.createdAt.getTime(),
        )
    ) {

        throw new Error(
            "Runtime creation timestamp must be a valid date.",
        );

    }

    return runtime;

}

function cloneValidDate(
    value: Date,
    fieldName: string,
): Date {

    if (
        !(value instanceof Date)
        || Number.isNaN(
            value.getTime(),
        )
    ) {

        throw new Error(
            `${fieldName} must be a valid date.`,
        );

    }

    return new Date(
        value.getTime(),
    );

}

function requireNonEmptyString(
    value: string,
    fieldName: string,
): string {

    if (
        typeof value !== "string"
    ) {

        throw new Error(
            `${fieldName} must be a string.`,
        );

    }

    const normalized =
        value.trim();

    if (
        normalized.length === 0
    ) {

        throw new Error(
            `${fieldName} must not be empty.`,
        );

    }

    return normalized;

}

function requireModuleStatus(
    status: JokerRuntimeModuleStatus,
    moduleName: string,
): JokerRuntimeModuleStatus {

    if (
        status !== "active"
        && status !== "degraded"
        && status !== "unavailable"
    ) {

        throw new Error(
            `Runtime module "${moduleName}" has an unsupported status.`,
        );

    }

    return status;

}

function cloneCapabilities(
    capabilities: readonly string[],
    fieldName: string,
): readonly string[] {

    if (
        !Array.isArray(
            capabilities,
        )
    ) {

        throw new Error(
            `${fieldName} must be an array.`,
        );

    }

    const normalized =
        capabilities.map(
            (
                capability,
                index,
            ) =>
                requireNonEmptyString(
                    capability,
                    `${fieldName} at index ${index}`,
                ),
        );

    return Object.freeze([
        ...new Set(
            normalized,
        ),
    ]);

}

function createModuleHealth(
    module: JokerRuntimeModule,
    index: number,
): RuntimeModuleHealth {

    if (
        module === null
        || module === undefined
        || typeof module !== "object"
    ) {

        throw new Error(
            `Runtime module at index ${index} is required.`,
        );

    }

    const name =
        requireNonEmptyString(
            module.name,
            `Runtime module name at index ${index}`,
        );

    const status =
        requireModuleStatus(
            module.status,
            name,
        );

    const capabilities =
        cloneCapabilities(
            module.capabilities,
            `Runtime module "${name}" capabilities`,
        );

    return Object.freeze({

        name,

        status,

        healthy:
            status === "active",

        capabilities,

    });

}

function resolveHealthStatus(
    runtimeStatus: JokerRuntimeStatus,
    modules: readonly RuntimeModuleHealth[],
): RuntimeHealthStatus {

    if (
        runtimeStatus === "unavailable"
        || modules.some(
            (
                module,
            ) =>
                module.status === "unavailable",
        )
    ) {

        return "unavailable";

    }

    if (
        runtimeStatus === "degraded"
        || modules.some(
            (
                module,
            ) =>
                module.status === "degraded",
        )
    ) {

        return "degraded";

    }

    return "healthy";

}

export function inspectRuntimeHealth(
    runtime: JokerRuntime,
    checkedAt: Date = new Date(),
): RuntimeHealth {

    const currentRuntime =
        requireRuntime(
            runtime,
        );

    const normalizedCheckedAt =
        cloneValidDate(
            checkedAt,
            "Runtime health check timestamp",
        );

    const modules =
        Object.freeze(
            currentRuntime.modules.map(
                createModuleHealth,
            ),
        );

    const activeModuleCount =
        modules.filter(
            (
                module,
            ) =>
                module.status === "active",
        ).length;

    const degradedModuleCount =
        modules.filter(
            (
                module,
            ) =>
                module.status === "degraded",
        ).length;

    const unavailableModuleCount =
        modules.filter(
            (
                module,
            ) =>
                module.status === "unavailable",
        ).length;

    const status =
        resolveHealthStatus(
            currentRuntime.status,
            modules,
        );

    return Object.freeze({

        runtimeName:
            currentRuntime.name,

        runtimeVersion:
            currentRuntime.version,

        runtimeStatus:
            currentRuntime.status,

        status,

        healthy:
            status === "healthy",

        moduleCount:
            modules.length,

        activeModuleCount,

        degradedModuleCount,

        unavailableModuleCount,

        modules,

        capabilities:
            cloneCapabilities(
                currentRuntime.capabilities,
                "Runtime capabilities",
            ),

        createdAt:
            new Date(
                currentRuntime.createdAt.getTime(),
            ),

        checkedAt:
            new Date(
                normalizedCheckedAt.getTime(),
            ),

    });

}

export function isRuntimeHealthy(
    runtime: JokerRuntime,
): boolean {

    return inspectRuntimeHealth(
        runtime,
    ).healthy;

}

export function isRuntimeAvailable(
    runtime: JokerRuntime,
): boolean {

    return (
        inspectRuntimeHealth(
            runtime,
        ).status !== "unavailable"
    );

}
