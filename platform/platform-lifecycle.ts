/**
 * HERMETICUM B.C.E.
 * AI JOKER-C2
 *
 * Canonical Platform Lifecycle
 *
 * Produces immutable platform snapshots while preserving every
 * required JokerPlatform property, including capabilities.
 */

import {
    type JokerPlatform,
    type PlatformStatus,
} from "./create-platform";

export interface PlatformLifecycleTransition {

    readonly previousStatus:
        PlatformStatus;

    readonly nextStatus:
        PlatformStatus;

    readonly platform:
        JokerPlatform;

    readonly changed:
        boolean;

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

function requirePlatformStatus(
    status: PlatformStatus,
): PlatformStatus {

    if (
        status !== "operational"
        && status !== "degraded"
        && status !== "unavailable"
    ) {

        throw new Error(
            `Unsupported platform status "${String(status)}".`,
        );

    }

    return status;

}

function isTransitionAllowed(
    currentStatus: PlatformStatus,
    nextStatus: PlatformStatus,
): boolean {

    if (
        currentStatus === nextStatus
    ) {

        return true;

    }

    if (
        currentStatus === "operational"
    ) {

        return (
            nextStatus === "degraded"
            || nextStatus === "unavailable"
        );

    }

    if (
        currentStatus === "degraded"
    ) {

        return (
            nextStatus === "operational"
            || nextStatus === "unavailable"
        );

    }

    return (
        currentStatus === "unavailable"
        && nextStatus === "operational"
    );

}

function createPlatformSnapshot(
    platform: JokerPlatform,
    status: PlatformStatus,
): JokerPlatform {

    const currentPlatform =
        requirePlatform(
            platform,
        );

    const nextStatus =
        requirePlatformStatus(
            status,
        );

    return Object.freeze({

        name:
            currentPlatform.name,

        version:
            currentPlatform.version,

        status:
            nextStatus,

        application:
            currentPlatform.application,

        capabilities:
            Object.freeze([
                ...currentPlatform.capabilities,
            ]),

        createdAt:
            new Date(
                currentPlatform.createdAt.getTime(),
            ),

    });

}

export function transitionPlatformStatus(
    platform: JokerPlatform,
    nextStatus: PlatformStatus,
    transitionedAt: Date = new Date(),
): PlatformLifecycleTransition {

    const currentPlatform =
        requirePlatform(
            platform,
        );

    const normalizedNextStatus =
        requirePlatformStatus(
            nextStatus,
        );

    const normalizedTransitionedAt =
        cloneValidDate(
            transitionedAt,
            "Platform lifecycle transition timestamp",
        );

    if (
        !isTransitionAllowed(
            currentPlatform.status,
            normalizedNextStatus,
        )
    ) {

        throw new Error(
            `Cannot transition platform from "${currentPlatform.status}" to "${normalizedNextStatus}".`,
        );

    }

    const changed =
        currentPlatform.status
        !== normalizedNextStatus;

    const nextPlatform =
        changed
            ? createPlatformSnapshot(
                currentPlatform,
                normalizedNextStatus,
            )
            : currentPlatform;

    return Object.freeze({

        previousStatus:
            currentPlatform.status,

        nextStatus:
            normalizedNextStatus,

        platform:
            nextPlatform,

        changed,

        transitionedAt:
            new Date(
                normalizedTransitionedAt.getTime(),
            ),

    });

}

export function markPlatformOperational(
    platform: JokerPlatform,
    transitionedAt: Date = new Date(),
): PlatformLifecycleTransition {

    return transitionPlatformStatus(
        platform,
        "operational",
        transitionedAt,
    );

}

export function markPlatformDegraded(
    platform: JokerPlatform,
    transitionedAt: Date = new Date(),
): PlatformLifecycleTransition {

    return transitionPlatformStatus(
        platform,
        "degraded",
        transitionedAt,
    );

}

export function markPlatformUnavailable(
    platform: JokerPlatform,
    transitionedAt: Date = new Date(),
): PlatformLifecycleTransition {

    return transitionPlatformStatus(
        platform,
        "unavailable",
        transitionedAt,
    );

}
