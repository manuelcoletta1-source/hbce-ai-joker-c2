/**
 * HERMETICUM B.C.E.
 * AI JOKER-C2
 *
 * Canonical Platform Composition
 *
 * Creates the immutable platform boundary built on top of the
 * canonical application layer.
 */

import {
    createApplication,
    inspectApplicationHealth,
    type CreateApplicationOptions,
    type JokerApplication,
} from "../app";

export type PlatformStatus =
    | "operational"
    | "degraded"
    | "unavailable";

export interface JokerPlatform {

    readonly name:
        "HERMETICUM B.C.E. AI JOKER-C2 PLATFORM";

    readonly version:
        string;

    readonly status:
        PlatformStatus;

    readonly application:
        JokerApplication;

    readonly capabilities:
        readonly string[];

    readonly createdAt:
        Date;

}

export interface CreatePlatformOptions {

    readonly version?:
        string;

    readonly createdAt?:
        Date;

    readonly application?:
        JokerApplication;

    readonly applicationOptions?:
        CreateApplicationOptions;

    readonly capabilities?:
        readonly string[];

}

const DEFAULT_PLATFORM_VERSION =
    "1.0.0";

const DEFAULT_PLATFORM_CAPABILITIES =
    Object.freeze([
        "application",
        "runtime",
        "health",
        "lifecycle",
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
                    `Platform capability at index ${index}`,
                ),
        );

    return Object.freeze(
        [...new Set(normalized)],
    );

}

function resolvePlatformStatus(
    application: JokerApplication,
    checkedAt: Date,
): PlatformStatus {

    const applicationHealth =
        inspectApplicationHealth(
            application,
            checkedAt,
        );

    if (
        applicationHealth.status === "unavailable"
    ) {

        return "unavailable";

    }

    if (
        applicationHealth.status === "degraded"
    ) {

        return "degraded";

    }

    return "operational";

}

export function createPlatform(
    options: CreatePlatformOptions = {},
): JokerPlatform {

    if (
        options.application !== undefined
        && options.applicationOptions !== undefined
    ) {

        throw new Error(
            "Provide either application or applicationOptions, not both.",
        );

    }

    const createdAt =
        cloneValidDate(
            options.createdAt
            ?? new Date(),
            "Platform creation timestamp",
        );

    const version =
        requireNonEmptyString(
            options.version
            ?? DEFAULT_PLATFORM_VERSION,
            "Platform version",
        );

    const application =
        options.application
        ?? createApplication({

            ...options.applicationOptions,

            createdAt:
                options.applicationOptions
                    ?.createdAt
                ?? createdAt,

        });

    const capabilities =
        normalizeCapabilities(
            options.capabilities
            ?? DEFAULT_PLATFORM_CAPABILITIES,
        );

    const status =
        resolvePlatformStatus(
            application,
            createdAt,
        );

    return Object.freeze({

        name:
            "HERMETICUM B.C.E. AI JOKER-C2 PLATFORM",

        version,

        status,

        application,

        capabilities,

        createdAt:
            new Date(
                createdAt.getTime(),
            ),

    });

}
