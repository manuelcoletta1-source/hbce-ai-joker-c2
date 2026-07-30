/**
 * HERMETICUM B.C.E.
 * AI JOKER-C2
 *
 * Application Lifecycle
 *
 * Provides deterministic and immutable transitions
 * for the canonical application boundary.
 */

import {
    createApplication,
    type JokerApplication,
} from "./create-application";

export type ApplicationLifecycleAction =
    | "start"
    | "stop"
    | "restart";

export interface ApplicationLifecycleTransition {

    readonly action: ApplicationLifecycleAction;

    readonly previousStatus:
        JokerApplication["status"];

    readonly nextStatus:
        JokerApplication["status"];

    readonly application: JokerApplication;

    readonly transitionedAt: Date;

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

function requireApplication(
    application: JokerApplication,
): JokerApplication {

    if (
        application === null
        || application === undefined
    ) {

        throw new Error(
            "Application is required.",
        );

    }

    return application;

}

function createTransition(
    action: ApplicationLifecycleAction,
    previousStatus: JokerApplication["status"],
    application: JokerApplication,
    transitionedAt: Date,
): ApplicationLifecycleTransition {

    return Object.freeze({

        action,

        previousStatus,

        nextStatus:
            application.status,

        application,

        transitionedAt:
            new Date(
                transitionedAt.getTime(),
            ),

    });

}

export function stopApplication(
    application: JokerApplication,
    transitionedAt: Date = new Date(),
): ApplicationLifecycleTransition {

    const currentApplication =
        requireApplication(
            application,
        );

    const normalizedTransitionedAt =
        cloneValidDate(
            transitionedAt,
            "Application stop timestamp",
        );

    if (
        currentApplication.status === "stopped"
    ) {

        throw new Error(
            "Application is already stopped.",
        );

    }

    const stoppedApplication:
        JokerApplication =
        Object.freeze({

            ...currentApplication,

            status:
                "stopped" as const,

        });

    return createTransition(
        "stop",
        currentApplication.status,
        stoppedApplication,
        normalizedTransitionedAt,
    );

}

export function startApplication(
    application: JokerApplication,
    transitionedAt: Date = new Date(),
): ApplicationLifecycleTransition {

    const currentApplication =
        requireApplication(
            application,
        );

    const normalizedTransitionedAt =
        cloneValidDate(
            transitionedAt,
            "Application start timestamp",
        );

    if (
        currentApplication.status === "ready"
    ) {

        throw new Error(
            "Application is already ready.",
        );

    }

    const startedApplication:
        JokerApplication =
        Object.freeze({

            ...currentApplication,

            status:
                "ready" as const,

        });

    return createTransition(
        "start",
        currentApplication.status,
        startedApplication,
        normalizedTransitionedAt,
    );

}

export function restartApplication(
    application: JokerApplication,
    transitionedAt: Date = new Date(),
): ApplicationLifecycleTransition {

    const currentApplication =
        requireApplication(
            application,
        );

    const normalizedTransitionedAt =
        cloneValidDate(
            transitionedAt,
            "Application restart timestamp",
        );

    const restartedApplication =
        createApplication({

            version:
                currentApplication.version,

            createdAt:
                normalizedTransitionedAt,

            runtime: {

                bootstrappedAt:
                    normalizedTransitionedAt,

                requireHealthy:
                    true,

            },

        });

    return createTransition(
        "restart",
        currentApplication.status,
        restartedApplication,
        normalizedTransitionedAt,
    );

}
