/**
 * HERMETICUM B.C.E.
 * AI JOKER-C2
 *
 * Canonical Service Layer Composition
 *
 * Creates the immutable service boundary built on top of the
 * canonical platform without mutating platform state.
 */

import {
    createPlatform,
    inspectPlatformHealth,
    type CreatePlatformOptions,
    type JokerPlatform,
} from "../platform";

export type ServicesStatus =
    | "ready"
    | "degraded"
    | "unavailable";

export interface JokerServices {

    readonly name:
        "AI JOKER-C2 Services";

    readonly version:
        string;

    readonly status:
        ServicesStatus;

    readonly platform:
        JokerPlatform;

    readonly capabilities:
        readonly string[];

    readonly createdAt:
        Date;

}

export interface CreateServicesOptions {

    readonly version?:
        string;

    readonly createdAt?:
        Date;

    readonly platform?:
        JokerPlatform;

    readonly platformOptions?:
        CreatePlatformOptions;

    readonly capabilities?:
        readonly string[];

}

const DEFAULT_SERVICES_VERSION =
    "1.0.0";

const DEFAULT_CAPABILITIES =
    Object.freeze([
        "research",
        "conversation",
        "ipr",
        "evt",
        "opc",
        "audit",
        "model-usage",
    ] as const);

function requireNonEmptyString(
    value: string,
    fieldName: string,
): string {

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

function normalizeCapabilities(
    capabilities:
        readonly string[],
): readonly string[] {

    const normalized =
        capabilities.map(
            (
                capability,
                index,
            ) =>
                requireNonEmptyString(
                    capability,
                    `Service capability at index ${index}`,
                ),
        );

    const uniqueCapabilities =
        [...new Set(normalized)];

    return Object.freeze(
        uniqueCapabilities,
    );

}

function resolveServicesStatus(
    platform: JokerPlatform,
    checkedAt: Date,
): ServicesStatus {

    const platformHealth =
        inspectPlatformHealth(
            platform,
            checkedAt,
        );

    if (
        platformHealth.status === "unavailable"
    ) {

        return "unavailable";

    }

    if (
        platformHealth.status === "degraded"
    ) {

        return "degraded";

    }

    return "ready";

}

export function createServices(
    options: CreateServicesOptions = {},
): JokerServices {

    if (
        options.platform !== undefined
        && options.platformOptions !== undefined
    ) {

        throw new Error(
            "Provide either platform or platformOptions, not both.",
        );

    }

    const createdAt =
        cloneValidDate(
            options.createdAt
            ?? new Date(),
            "Services creation timestamp",
        );

    const version =
        requireNonEmptyString(
            options.version
            ?? DEFAULT_SERVICES_VERSION,
            "Services version",
        );

    const platform =
        options.platform
        ?? createPlatform({

            ...options.platformOptions,

            createdAt:
                options.platformOptions
                    ?.createdAt
                ?? createdAt,

        });

    const capabilities =
        normalizeCapabilities(
            options.capabilities
            ?? DEFAULT_CAPABILITIES,
        );

    const status =
        resolveServicesStatus(
            platform,
            createdAt,
        );

    return Object.freeze({

        name:
            "AI JOKER-C2 Services",

        version,

        status,

        platform,

        capabilities,

        createdAt:
            new Date(
                createdAt.getTime(),
            ),

    });

}
