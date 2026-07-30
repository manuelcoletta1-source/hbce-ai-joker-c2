/**
 * HERMETICUM B.C.E.
 * AI JOKER-C2
 *
 * Platform Health Projection
 *
 * Inspects the canonical platform boundary and produces
 * an immutable health snapshot derived from the platform,
 * application and runtime states.
 */

import {
    inspectApplicationHealth,
    type ApplicationHealthStatus,
} from "../app";

import {
    type JokerPlatform,
    type PlatformStatus,
} from "./create-platform";

export type PlatformHealthStatus =
    | "healthy"
    | "degraded"
    | "unavailable";

export interface PlatformHealth {

    readonly status: PlatformHealthStatus;

    readonly platformStatus: PlatformStatus;

    readonly applicationStatus:
        ApplicationHealthStatus;

    readonly operational: boolean;

    readonly checkedAt: Date;

}

function requirePlatform(
    platform: JokerPlatform,
): JokerPlatform {

    if (
        platform === null
        || platform === undefined
        || typeof platform !== "object"
    ) {

        throw new Error(
            "Platform is required.",
        );

    }

    return platform;

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

function resolvePlatformHealthStatus(
    platformStatus: PlatformStatus,
    applicationStatus: ApplicationHealthStatus,
): PlatformHealthStatus {

    if (
        platformStatus === "unavailable"
        || applicationStatus === "unavailable"
    ) {

        return "unavailable";

    }

    if (
        platformStatus === "degraded"
        || applicationStatus === "degraded"
    ) {

        return "degraded";

    }

    return "healthy";

}

export function inspectPlatformHealth(
    platform: JokerPlatform,
    checkedAt: Date = new Date(),
): PlatformHealth {

    const currentPlatform =
        requirePlatform(
            platform,
        );

    const normalizedCheckedAt =
        cloneValidDate(
            checkedAt,
            "Platform health timestamp",
        );

    const applicationHealth =
        inspectApplicationHealth(
            currentPlatform.application,
            normalizedCheckedAt,
        );

    const status =
        resolvePlatformHealthStatus(
            currentPlatform.status,
            applicationHealth.status,
        );

    return Object.freeze({

        status,

        platformStatus:
            currentPlatform.status,

        applicationStatus:
            applicationHealth.status,

        operational:
            status === "healthy",

        checkedAt:
            new Date(
                normalizedCheckedAt.getTime(),
            ),

    });

}
