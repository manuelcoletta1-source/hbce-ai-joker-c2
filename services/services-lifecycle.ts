/**
 * HERMETICUM B.C.E.
 * AI JOKER-C2
 *
 * Canonical Services Lifecycle
 *
 * Controls the service-layer lifecycle without mutating the
 * original service boundary.
 *
 * Every transition returns a new immutable snapshot.
 */

import {
    type JokerServices,
} from "./create-services";

export type ServicesLifecycleStatus =
    | "created"
    | "starting"
    | "running"
    | "stopping"
    | "stopped"
    | "failed";

export interface ServicesLifecycle {

    readonly services:
        JokerServices;

    readonly status:
        ServicesLifecycleStatus;

    readonly revision:
        number;

    readonly createdAt:
        Date;

    readonly updatedAt:
        Date;

    readonly failureReason?:
        string;

}

export interface CreateServicesLifecycleOptions {

    readonly createdAt?:
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

function requireLifecycle(
    lifecycle: ServicesLifecycle,
): ServicesLifecycle {

    if (
        lifecycle === null
        || lifecycle === undefined
        || typeof lifecycle !== "object"
    ) {

        throw new Error(
            "Services lifecycle is required.",
        );

    }

    return lifecycle;

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

function requireChronologicalTimestamp(
    currentTimestamp: Date,
    nextTimestamp: Date,
): void {

    if (
        nextTimestamp.getTime()
        < currentTimestamp.getTime()
    ) {

        throw new Error(
            "Services lifecycle timestamp must not move backwards.",
        );

    }

}

function createLifecycleSnapshot(
    lifecycle: ServicesLifecycle,
    status: ServicesLifecycleStatus,
    updatedAt: Date,
    failureReason?: string,
): ServicesLifecycle {

    const currentLifecycle =
        requireLifecycle(
            lifecycle,
        );

    const normalizedUpdatedAt =
        cloneValidDate(
            updatedAt,
            "Services lifecycle timestamp",
        );

    requireChronologicalTimestamp(
        currentLifecycle.updatedAt,
        normalizedUpdatedAt,
    );

    const snapshot:
        ServicesLifecycle = {

            services:
                currentLifecycle.services,

            status,

            revision:
                currentLifecycle.revision + 1,

            createdAt:
                new Date(
                    currentLifecycle
                        .createdAt
                        .getTime(),
                ),

            updatedAt:
                new Date(
                    normalizedUpdatedAt
                        .getTime(),
                ),

            ...(
                failureReason === undefined
                    ? {}
                    : {
                        failureReason,
                    }
            ),

        };

    return Object.freeze(
        snapshot,
    );

}

export function createServicesLifecycle(
    services: JokerServices,
    options: CreateServicesLifecycleOptions = {},
): ServicesLifecycle {

    const currentServices =
        requireServices(
            services,
        );

    const createdAt =
        cloneValidDate(
            options.createdAt
            ?? new Date(),
            "Services lifecycle creation timestamp",
        );

    return Object.freeze({

        services:
            currentServices,

        status:
            "created",

        revision:
            0,

        createdAt:
            new Date(
                createdAt.getTime(),
            ),

        updatedAt:
            new Date(
                createdAt.getTime(),
            ),

    });

}

export function startServicesLifecycle(
    lifecycle: ServicesLifecycle,
    updatedAt: Date = new Date(),
): ServicesLifecycle {

    const currentLifecycle =
        requireLifecycle(
            lifecycle,
        );

    if (
        currentLifecycle.status !== "created"
        && currentLifecycle.status !== "stopped"
    ) {

        throw new Error(
            `Cannot start services from lifecycle status "${currentLifecycle.status}".`,
        );

    }

    if (
        currentLifecycle.services.status
        === "unavailable"
    ) {

        throw new Error(
            "Cannot start unavailable services.",
        );

    }

    return createLifecycleSnapshot(
        currentLifecycle,
        "starting",
        updatedAt,
    );

}

export function markServicesRunning(
    lifecycle: ServicesLifecycle,
    updatedAt: Date = new Date(),
): ServicesLifecycle {

    const currentLifecycle =
        requireLifecycle(
            lifecycle,
        );

    if (
        currentLifecycle.status !== "starting"
    ) {

        throw new Error(
            `Cannot mark services as running from lifecycle status "${currentLifecycle.status}".`,
        );

    }

    return createLifecycleSnapshot(
        currentLifecycle,
        "running",
        updatedAt,
    );

}

export function stopServicesLifecycle(
    lifecycle: ServicesLifecycle,
    updatedAt: Date = new Date(),
): ServicesLifecycle {

    const currentLifecycle =
        requireLifecycle(
            lifecycle,
        );

    if (
        currentLifecycle.status !== "running"
    ) {

        throw new Error(
            `Cannot stop services from lifecycle status "${currentLifecycle.status}".`,
        );

    }

    return createLifecycleSnapshot(
        currentLifecycle,
        "stopping",
        updatedAt,
    );

}

export function markServicesStopped(
    lifecycle: ServicesLifecycle,
    updatedAt: Date = new Date(),
): ServicesLifecycle {

    const currentLifecycle =
        requireLifecycle(
            lifecycle,
        );

    if (
        currentLifecycle.status !== "stopping"
    ) {

        throw new Error(
            `Cannot mark services as stopped from lifecycle status "${currentLifecycle.status}".`,
        );

    }

    return createLifecycleSnapshot(
        currentLifecycle,
        "stopped",
        updatedAt,
    );

}

export function failServicesLifecycle(
    lifecycle: ServicesLifecycle,
    failureReason: string,
    updatedAt: Date = new Date(),
): ServicesLifecycle {

    const currentLifecycle =
        requireLifecycle(
            lifecycle,
        );

    if (
        currentLifecycle.status === "stopped"
        || currentLifecycle.status === "failed"
    ) {

        throw new Error(
            `Cannot fail services from lifecycle status "${currentLifecycle.status}".`,
        );

    }

    const normalizedFailureReason =
        requireNonEmptyString(
            failureReason,
            "Services lifecycle failure reason",
        );

    return createLifecycleSnapshot(
        currentLifecycle,
        "failed",
        updatedAt,
        normalizedFailureReason,
    );

}
