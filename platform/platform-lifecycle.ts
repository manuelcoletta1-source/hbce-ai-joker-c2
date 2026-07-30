/**
 * HERMETICUM B.C.E.
 * AI JOKER-C2
 *
 * Canonical Platform Lifecycle
 *
 * Provides immutable and deterministic lifecycle operations for
 * the canonical JokerPlatform boundary.
 *
 * Every lifecycle operation preserves all required platform fields:
 *
 * - name
 * - version
 * - status
 * - application
 * - capabilities
 * - createdAt
 */

import {
    type JokerPlatform,
    type PlatformStatus,
} from "./create-platform";

export type PlatformLifecycleAction =
    | "start"
    | "stop"
    | "restart"
    | "mark-operational"
    | "mark-degraded"
    | "mark-unavailable";

export interface PlatformLifecycleTransition {

    readonly action:
        PlatformLifecycleAction;

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

export type PlatformLifecycleResult =
    PlatformLifecycleTransition;

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

    if (
        !Array.isArray(
            platform.capabilities,
        )
    ) {

        throw new Error(
            "Platform capabilities are required.",
        );

    }

    if (
        !(platform.createdAt instanceof Date)
        || Number.isNaN(
            platform.createdAt.getTime(),
        )
    ) {

        throw new Error(
            "Platform creation timestamp must be a valid date.",
        );

    }

    return platform;

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

function cloneCapabilities(
    capabilities: readonly string[],
): readonly string[] {

    return Object.freeze([
        ...capabilities,
    ]);

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

    switch (
        currentStatus
    ) {

        case "operational":

            return (
                nextStatus === "degraded"
                || nextStatus === "unavailable"
            );

        case "degraded":

            return (
                nextStatus === "operational"
                || nextStatus === "unavailable"
            );

        case "unavailable":

            return (
                nextStatus === "operational"
                || nextStatus === "degraded"
            );

        default:

            return false;

    }

}

function createPlatformSnapshot(
    platform: JokerPlatform,
    status: PlatformStatus,
): JokerPlatform {

    const currentPlatform =
        requirePlatform(
            platform,
        );

    const normalizedStatus =
        requirePlatformStatus(
            status,
        );

    return Object.freeze({

        name:
            currentPlatform.name,

        version:
            currentPlatform.version,

        status:
            normalizedStatus,

        application:
            currentPlatform.application,

        capabilities:
            cloneCapabilities(
                currentPlatform.capabilities,
            ),

        createdAt:
            new Date(
                currentPlatform
                    .createdAt
                    .getTime(),
            ),

    });

}

function createTransition(
    platform: JokerPlatform,
    action: PlatformLifecycleAction,
    nextStatus: PlatformStatus,
    transitionedAt: Date,
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

        action,

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

export function transitionPlatformStatus(
    platform: JokerPlatform,
    nextStatus: PlatformStatus,
    transitionedAt: Date = new Date(),
): PlatformLifecycleTransition {

    const action:
        PlatformLifecycleAction =
        nextStatus === "operational"
            ? "mark-operational"
            : nextStatus === "degraded"
                ? "mark-degraded"
                : "mark-unavailable";

    return createTransition(
        platform,
        action,
        nextStatus,
        transitionedAt,
    );

}

export function startPlatform(
    platform: JokerPlatform,
    transitionedAt: Date = new Date(),
): PlatformLifecycleTransition {

    return createTransition(
        platform,
        "start",
        "operational",
        transitionedAt,
    );

}

export function stopPlatform(
    platform: JokerPlatform,
    transitionedAt: Date = new Date(),
): PlatformLifecycleTransition {

    return createTransition(
        platform,
        "stop",
        "unavailable",
        transitionedAt,
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

    const restartedPlatform =
        createPlatformSnapshot(
            currentPlatform,
            "operational",
        );

    return Object.freeze({

        action:
            "restart",

        previousStatus:
            currentPlatform.status,

        nextStatus:
            "operational",

        platform:
            restartedPlatform,

        changed:
            currentPlatform.status
            !== "operational",

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

    return createTransition(
        platform,
        "mark-operational",
        "operational",
        transitionedAt,
    );

}

export function markPlatformDegraded(
    platform: JokerPlatform,
    transitionedAt: Date = new Date(),
): PlatformLifecycleTransition {

    return createTransition(
        platform,
        "mark-degraded",
        "degraded",
        transitionedAt,
    );

}

export function markPlatformUnavailable(
    platform: JokerPlatform,
    transitionedAt: Date = new Date(),
): PlatformLifecycleTransition {

    return createTransition(
        platform,
        "mark-unavailable",
        "unavailable",
        transitionedAt,
    );

}
