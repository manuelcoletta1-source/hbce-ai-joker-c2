/**
 * HERMETICUM B.C.E.
 * AI JOKER-C2
 *
 * Canonical Runtime Bootstrap
 *
 * Creates the complete runtime and verifies
 * its structural health before exposing it.
 */

import {
    createJokerRuntime,
    type JokerRuntime,
} from "./create-joker-runtime";

import {
    inspectRuntimeHealth,
    type RuntimeHealth,
} from "./runtime-health";

export interface JokerRuntimeBootstrap {

    readonly runtime: JokerRuntime;

    readonly health: RuntimeHealth;

    readonly bootstrappedAt: Date;

}

export interface BootstrapJokerRuntimeOptions {

    readonly bootstrappedAt?: Date;

    readonly requireHealthy?: boolean;

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

export function bootstrapJokerRuntime(
    options: BootstrapJokerRuntimeOptions = {},
): JokerRuntimeBootstrap {

    const bootstrappedAt =
        cloneValidDate(
            options.bootstrappedAt
                ?? new Date(),
            "Runtime bootstrap timestamp",
        );

    const requireHealthy =
        options.requireHealthy
        ?? true;

    const runtime =
        createJokerRuntime();

    const health =
        inspectRuntimeHealth(
            runtime,
            bootstrappedAt,
        );

    if (
        requireHealthy
        && health.status !== "healthy"
    ) {

        throw new Error(
            `JOKER-C2 runtime bootstrap failed with status: ${health.status}.`,
        );

    }

    return Object.freeze({

        runtime,

        health,

        bootstrappedAt:
            new Date(
                bootstrappedAt.getTime(),
            ),

    });

}
