/**
 * HERMETICUM B.C.E.
 * AI JOKER-C2
 *
 * Services Health Projection
 *
 * Inspects the canonical service boundary and produces
 * an immutable health snapshot derived from service and
 * platform states.
 */

import {
    inspectPlatformHealth,
    type PlatformHealthStatus,
} from "../platform";

import {
    type JokerServices,
    type ServicesStatus,
} from "./create-services";

export type ServicesHealthStatus =
    | "healthy"
    | "degraded"
    | "unavailable";

export interface ServicesHealth {

    readonly status:
        ServicesHealthStatus;

    readonly servicesStatus:
        ServicesStatus;

    readonly platformStatus:
        PlatformHealthStatus;

    readonly capabilityCount:
        number;

    readonly operational:
        boolean;

    readonly checkedAt:
        Date;

}

function requireServices(
    services: JokerServices,
): JokerServices {

    if (
        services === null
        || services === undefined
        || typeof services !== "object"
    ) {

        throw new Error(
            "Services are required.",
        );

    }

    return services;

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

function resolveServicesHealthStatus(
    servicesStatus: ServicesStatus,
    platformStatus: PlatformHealthStatus,
): ServicesHealthStatus {

    if (
        servicesStatus === "unavailable"
        || platformStatus === "unavailable"
    ) {

        return "unavailable";

    }

    if (
        servicesStatus === "degraded"
        || platformStatus === "degraded"
    ) {

        return "degraded";

    }

    return "healthy";

}

export function inspectServicesHealth(
    services: JokerServices,
    checkedAt: Date = new Date(),
): ServicesHealth {

    const currentServices =
        requireServices(
            services,
        );

    const normalizedCheckedAt =
        cloneValidDate(
            checkedAt,
            "Services health timestamp",
        );

    const platformHealth =
        inspectPlatformHealth(
            currentServices.platform,
            normalizedCheckedAt,
        );

    const status =
        resolveServicesHealthStatus(
            currentServices.status,
            platformHealth.status,
        );

    return Object.freeze({

        status,

        servicesStatus:
            currentServices.status,

        platformStatus:
            platformHealth.status,

        capabilityCount:
            currentServices
                .capabilities
                .length,

        operational:
            status === "healthy",

        checkedAt:
            new Date(
                normalizedCheckedAt.getTime(),
            ),

    });

}
