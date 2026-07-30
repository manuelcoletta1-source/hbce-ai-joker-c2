/**
 * HERMETICUM B.C.E.
 * AI JOKER-C2
 *
 * Canonical Application Composition
 *
 * Creates the application boundary around the
 * bootstrapped JOKER-C2 runtime.
 */

import {
    bootstrapJokerRuntime,
    type BootstrapJokerRuntimeOptions,
    type JokerRuntimeBootstrap,
} from "../runtime/bootstrap";

export type ApplicationStatus =
    | "ready"
    | "stopped";

export interface JokerApplication {

    readonly name: "AI JOKER-C2";

    readonly version: string;

    readonly status: ApplicationStatus;

    readonly runtimeBootstrap: JokerRuntimeBootstrap;

    readonly createdAt: Date;

}

export interface CreateApplicationOptions {

    readonly version?: string;

    readonly createdAt?: Date;

    readonly runtime?: BootstrapJokerRuntimeOptions;

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

export function createApplication(
    options: CreateApplicationOptions = {},
): JokerApplication {

    const version =
        requireNonEmptyString(
            options.version
                ?? "1.0.0",
            "Application version",
        );

    const createdAt =
        cloneValidDate(
            options.createdAt
                ?? new Date(),
            "Application creation timestamp",
        );

    const runtimeBootstrap =
        bootstrapJokerRuntime({

            ...options.runtime,

            bootstrappedAt:
                options.runtime?.bootstrappedAt
                ?? createdAt,

        });

    return Object.freeze({

        name:
            "AI JOKER-C2" as const,

        version,

        status:
            "ready" as const,

        runtimeBootstrap,

        createdAt:
            new Date(
                createdAt.getTime(),
            ),

    });

}
