/**
 * HERMETICUM B.C.E.
 * AI JOKER-C2
 *
 * Canonical Platform Composition
 *
 * Creates the immutable platform boundary around
 * the complete AI JOKER-C2 application layer.
 */

import {
    createApplication,
    inspectApplicationHealth,
    type ApplicationHealth,
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

    readonly version: string;

    readonly status: PlatformStatus;

    readonly application: JokerApplication;

    readonly health: ApplicationHealth;

    readonly createdAt: Date;

}

export interface CreatePlatformOptions {

    readonly version?: string;

    readonly createdAt?: Date;

    readonly application?: CreateApplicationOptions;

}

function requireNonEmptyString(
    value: string,
    fieldName: string,
): string {

    const normalized =
        value.trim();

    if (normalized.length === 0) {

        throw new Error(
            `${fieldName} must be a non-empty string.`,
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

function resolvePlatformStatus(
    health: ApplicationHealth,
): PlatformStatus {

    if (health.status === "healthy") {

        return "operational";

    }

    if (health.status === "degraded") {

        return "degraded";

    }

    return "unavailable";

}

export function createPlatform(
    options: CreatePlatformOptions = {},
): JokerPlatform {

    const version =
        requireNonEmptyString(
            options.version
                ?? "1.0.0",
            "Platform version",
        );

    const createdAt =
        cloneValidDate(
            options.createdAt
                ?? new Date(),
            "Platform creation timestamp",
        );

    const application =
        createApplication({

            ...options.application,

            createdAt:
                options.application?.createdAt
                ?? createdAt,

        });

    const health =
        inspectApplicationHealth(
            application,
            createdAt,
        );

    const status =
        resolvePlatformStatus(
            health,
        );

    return Object.freeze({

        name:
            "HERMETICUM B.C.E. AI JOKER-C2 PLATFORM"
            as const,

        version,

        status,

        application,

        health,

        createdAt:
            new Date(
                createdAt.getTime(),
            ),

    });

}
