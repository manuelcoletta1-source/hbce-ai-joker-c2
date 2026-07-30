/**
 * HERMETICUM B.C.E.
 * AI JOKER-C2
 *
 * Canonical Joker Runtime Composition
 *
 * This module defines the public runtime composition boundary.
 *
 * It does not import architectural modules that are not present
 * inside the runtime directory.
 *
 * Domain implementations remain external to this composition and
 * can be registered as immutable runtime modules.
 */

export type JokerRuntimeStatus =
    | "ready"
    | "degraded"
    | "unavailable";

export type JokerRuntimeModuleStatus =
    | "active"
    | "degraded"
    | "unavailable";

export interface JokerRuntimeModule {

    readonly name:
        string;

    readonly status:
        JokerRuntimeModuleStatus;

    readonly capabilities:
        readonly string[];

}

export interface JokerRuntime {

    readonly name:
        "HERMETICUM B.C.E. AI JOKER-C2 RUNTIME";

    readonly version:
        string;

    readonly status:
        JokerRuntimeStatus;

    readonly modules:
        readonly JokerRuntimeModule[];

    readonly capabilities:
        readonly string[];

    readonly createdAt:
        Date;

}

export interface CreateJokerRuntimeOptions {

    readonly version?:
        string;

    readonly modules?:
        readonly JokerRuntimeModule[];

    readonly capabilities?:
        readonly string[];

    readonly createdAt?:
        Date;

}

const DEFAULT_RUNTIME_VERSION =
    "1.0.0";

const DEFAULT_RUNTIME_CAPABILITIES =
    Object.freeze([
        "mission-runtime",
        "deterministic-execution",
        "fail-closed",
        "audit-first",
        "source-intelligence",
        "traceability",
        "llm-agnostic",
    ] as const);

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

    const normalizedValue =
        value.trim();

    if (
        normalizedValue.length === 0
    ) {

        throw new Error(
            `${fieldName} must not be empty.`,
        );

    }

    return normalizedValue;

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

function requireModuleStatus(
    status: JokerRuntimeModuleStatus,
    fieldName: string,
): JokerRuntimeModuleStatus {

    if (
        status !== "active"
        && status !== "degraded"
        && status !== "unavailable"
    ) {

        throw new Error(
            `${fieldName} contains an unsupported status.`,
        );

    }

    return status;

}

function normalizeCapabilities(
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

    const normalizedCapabilities =
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
            normalizedCapabilities,
        ),
    ]);

}

function normalizeModule(
    module: JokerRuntimeModule,
    index: number,
): JokerRuntimeModule {

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
            `Runtime module at index ${index}`,
        );

    const capabilities =
        normalizeCapabilities(
            module.capabilities,
            `Runtime module capabilities at index ${index}`,
        );

    return Object.freeze({

        name,

        status,

        capabilities,

    });

}

function normalizeModules(
    modules: readonly JokerRuntimeModule[],
): readonly JokerRuntimeModule[] {

    if (
        !Array.isArray(
            modules,
        )
    ) {

        throw new Error(
            "Runtime modules must be an array.",
        );

    }

    const normalizedModules =
        modules.map(
            normalizeModule,
        );

    const moduleNames =
        normalizedModules.map(
            (
                module,
            ) =>
                module.name,
        );

    if (
        new Set(
            moduleNames,
        ).size !== moduleNames.length
    ) {

        throw new Error(
            "Runtime module names must be unique.",
        );

    }

    return Object.freeze([
        ...normalizedModules,
    ]);

}

function resolveRuntimeStatus(
    modules: readonly JokerRuntimeModule[],
): JokerRuntimeStatus {

    if (
        modules.some(
            (
                module,
            ) =>
                module.status === "unavailable",
        )
    ) {

        return "unavailable";

    }

    if (
        modules.some(
            (
                module,
            ) =>
                module.status === "degraded",
        )
    ) {

        return "degraded";

    }

    return "ready";

}

function collectRuntimeCapabilities(
    explicitCapabilities: readonly string[],
    modules: readonly JokerRuntimeModule[],
): readonly string[] {

    const moduleCapabilities =
        modules.flatMap(
            (
                module,
            ) =>
                module.capabilities,
        );

    return normalizeCapabilities(
        [
            ...explicitCapabilities,
            ...moduleCapabilities,
        ],
        "Runtime capabilities",
    );

}

export function createJokerRuntime(
    options: CreateJokerRuntimeOptions = {},
): JokerRuntime {

    const version =
        requireNonEmptyString(
            options.version
            ?? DEFAULT_RUNTIME_VERSION,
            "Runtime version",
        );

    const createdAt =
        cloneValidDate(
            options.createdAt
            ?? new Date(),
            "Runtime creation timestamp",
        );

    const modules =
        normalizeModules(
            options.modules
            ?? [],
        );

    const explicitCapabilities =
        normalizeCapabilities(
            options.capabilities
            ?? DEFAULT_RUNTIME_CAPABILITIES,
            "Runtime capabilities",
        );

    const capabilities =
        collectRuntimeCapabilities(
            explicitCapabilities,
            modules,
        );

    const status =
        resolveRuntimeStatus(
            modules,
        );

    return Object.freeze({

        name:
            "HERMETICUM B.C.E. AI JOKER-C2 RUNTIME",

        version,

        status,

        modules,

        capabilities,

        createdAt:
            new Date(
                createdAt.getTime(),
            ),

    });

}
