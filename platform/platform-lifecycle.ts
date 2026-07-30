/**
 * HERMETICUM B.C.E.
 * AI JOKER-C2
 *
 * Platform Lifecycle
 *
 * Provides deterministic and immutable lifecycle transitions
 * for the canonical platform boundary.
 */

import {
    restartApplication,
    startApplication,
    stopApplication,
    type JokerApplication,
} from "../app";

import {
    type JokerPlatform,
    type PlatformStatus,
} from "./create-platform";

import {
    inspectPlatformHealth,
} from "./platform-health";

export type PlatformLifecycleAction =
    | "start"
    | "stop"
    | "restart";

export interface PlatformLifecycleTransition {

    readonly action:
        PlatformLifecycleAction;

    readonly previousStatus:
        PlatformStatus;

    readonly nextStatus:
        PlatformStatus;

    readonly platform:
        JokerPlatform;

    readonly transitionedAt:
        Date;

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

function createPlatformSnapshot(
    source: JokerPlatform,
    application: JokerApplication,
    status: PlatformStatus,
    transitionedAt: Date,
): JokerPlatform {

    const provisionalPlatform:
        JokerPlatform =
        Object.freeze({

            name:
                source.name,

            version:
                source.version,

            status,

            application,

            health:
                source.health,

            createdAt:
                new Date(
                    source.createdAt.getTime(),
                ),

        });

    const health =
        inspectPlatformHealth(
            provisionalPlatform,
            transitionedAt,
        );

    return Object.freeze({

        ...provisionalPlatform,

        health:
            Object.freeze({

                status:
                    health.status === "healthy"
                        ? "healthy"
                        : health.status,

                applicationStatus:
                    health.applicationStatus,

                runtimeStatus:
                    application
                        .runtimeBootstrap
                        .health
                        .status,

                operational:
                    health.operational,

                checkedAt:
                    new Date(
                        health.checkedAt.getTime(),
                    ),

            }),

    });

}

function createTransition(
    action: PlatformLifecycleAction,
    previousStatus: PlatformStatus,
    platform: JokerPlatform,
    transitionedAt: Date,
): PlatformLifecycleTransition {

    return Object.freeze({

        action,

        previousStatus,

        nextStatus:
            platform.status,

        platform,

        transitionedAt:
            new Date(
                transitionedAt.getTime(),
            ),

    });

}

export function stopPlatform(
    platform: JokerPlatform,
    transitionedAt: Date = new Date(),
): PlatformLifecycleTransition {

    const currentPlatform =
        requirePlatform(
            platform,
        );

    const normalizedTransitionedAt =
        cloneValidDate(
            transitionedAt,
            "Platform stop timestamp",
        );

    if (
        currentPlatform.status === "unavailable"
    ) {

        throw new Error(
            "Platform is already unavailable.",
        );

    }

    const applicationTransition =
        stopApplication(
            currentPlatform.application,
            normalizedTransitionedAt,
        );

    const stoppedPlatform =
        createPlatformSnapshot(
            currentPlatform,
            applicationTransition.application,
            "unavailable",
            normalizedTransitionedAt,
        );

    return createTransition(
        "stop",
        currentPlatform.status,
        stoppedPlatform,
        normalizedTransitionedAt,
    );

}

export function startPlatform(
    platform: JokerPlatform,
    transitionedAt: Date = new Date(),
): PlatformLifecycleTransition {

    const currentPlatform =
        requirePlatform(
            platform,
        );

    const normalizedTransitionedAt =
        cloneValidDate(
            transitionedAt,
            "Platform start timestamp",
        );

    if (
        currentPlatform.status === "operational"
    ) {

        throw new Error(
            "Platform is already operational.",
        );

    }

    const applicationTransition =
        startApplication(
            currentPlatform.application,
            normalizedTransitionedAt,
        );

    const startedPlatform =
        createPlatformSnapshot(
            currentPlatform,
            applicationTransition.application,
            "operational",
            normalizedTransitionedAt,
        );

    return createTransition(
        "start",
        currentPlatform.status,
        startedPlatform,
        normalizedTransitionedAt,
    );

}

export function restartPlatform(
    platform: JokerPlatform,
    transitionedAt: Date = new Date(),
): PlatformLifecycleTransition {

    const currentPlatform =
        requirePlatform(
            platform,
        );

    const normalizedTransitionedAt =
        cloneValidDate(
            transitionedAt,
            "Platform restart timestamp",
        );

    const applicationTransition =
        restartApplication(
            currentPlatform.application,
            normalizedTransitionedAt,
        );

    const restartedPlatform =
        createPlatformSnapshot(
            currentPlatform,
            applicationTransition.application,
            "operational",
            normalizedTransitionedAt,
        );

    return createTransition(
        "restart",
        currentPlatform.status,
        restartedPlatform,
        normalizedTransitionedAt,
    );

}
