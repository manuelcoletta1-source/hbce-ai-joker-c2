/**
 * HERMETICUM B.C.E.
 * AI JOKER-C2
 *
 * Application Health
 *
 * Projects the public health state of the application
 * from its application status and runtime health.
 */

import type {
    JokerApplication,
} from "./create-application";

export type ApplicationHealthStatus =
    | "healthy"
    | "degraded"
    | "unavailable";

export interface ApplicationHealth {

    readonly applicationName: string;

    readonly applicationVersion: string;

    readonly applicationStatus:
        JokerApplication["status"];

    readonly runtimeStatus:
        JokerApplication["runtimeBootstrap"]["health"]["status"];

    readonly status: ApplicationHealthStatus;

    readonly checkedAt: Date;

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

export function inspectApplicationHealth(
    application: JokerApplication,
    checkedAt: Date = new Date(),
): ApplicationHealth {

    if (
        application === null
        || application === undefined
    ) {

        throw new Error(
            "Application is required.",
        );

    }

    const normalizedCheckedAt =
        cloneValidDate(
            checkedAt,
            "Application health check timestamp",
        );

    const runtimeStatus =
        application
            .runtimeBootstrap
            .health
            .status;

    let status: ApplicationHealthStatus;

    if (
        application.status === "ready"
        && runtimeStatus === "healthy"
    ) {

        status = "healthy";

    } else if (
        application.status === "stopped"
        || runtimeStatus === "unavailable"
    ) {

        status = "unavailable";

    } else {

        status = "degraded";

    }

    return Object.freeze({

        applicationName:
            application.name,

        applicationVersion:
            application.version,

        applicationStatus:
            application.status,

        runtimeStatus,

        status,

        checkedAt:
            normalizedCheckedAt,

    });

}
