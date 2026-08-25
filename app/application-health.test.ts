/**
 * HERMETICUM B.C.E.
 * AI JOKER-C2
 *
 * Application Health Tests
 */

import { test } from "vitest";
import assert from "node:assert/strict";

import {
    createApplication,
    type JokerApplication,
} from "./create-application";

import {
    inspectApplicationHealth,
} from "./application-health";

test(
    "inspectApplicationHealth reports a healthy ready application",
    () => {

        const application =
            createApplication();

        const health =
            inspectApplicationHealth(
                application,
            );

        assert.equal(
            health.applicationName,
            "AI JOKER-C2",
        );

        assert.equal(
            health.applicationVersion,
            "1.0.0",
        );

        assert.equal(
            health.applicationStatus,
            "ready",
        );

        assert.equal(
            health.runtimeStatus,
            "healthy",
        );

        assert.equal(
            health.status,
            "healthy",
        );

    },
);

test(
    "inspectApplicationHealth preserves the health-check timestamp",
    () => {

        const application =
            createApplication();

        const checkedAt =
            new Date(
                "2026-01-19T15:30:00.000Z",
            );

        const health =
            inspectApplicationHealth(
                application,
                checkedAt,
            );

        assert.notStrictEqual(
            health.checkedAt,
            checkedAt,
        );

        assert.equal(
            health.checkedAt.getTime(),
            checkedAt.getTime(),
        );

    },
);

test(
    "inspectApplicationHealth reports unavailable when application is stopped",
    () => {

        const application =
            createApplication();

        const stoppedApplication:
            JokerApplication =
            Object.freeze({

                ...application,

                status:
                    "stopped" as const,

            });

        const health =
            inspectApplicationHealth(
                stoppedApplication,
            );

        assert.equal(
            health.applicationStatus,
            "stopped",
        );

        assert.equal(
            health.status,
            "unavailable",
        );

    },
);

test(
    "inspectApplicationHealth reports degraded when runtime is degraded",
    () => {

        const application =
            createApplication();

        const degradedApplication =
            Object.freeze({

                ...application,

                runtimeBootstrap:
                    Object.freeze({

                        ...application
                            .runtimeBootstrap,

                        health:
                            Object.freeze({

                                ...application
                                    .runtimeBootstrap
                                    .health,

                                status:
                                    "degraded" as const,

                            }),

                    }),

            }) satisfies JokerApplication;

        const health =
            inspectApplicationHealth(
                degradedApplication,
            );

        assert.equal(
            health.applicationStatus,
            "ready",
        );

        assert.equal(
            health.runtimeStatus,
            "degraded",
        );

        assert.equal(
            health.status,
            "degraded",
        );

    },
);

test(
    "inspectApplicationHealth reports unavailable when runtime is unavailable",
    () => {

        const application =
            createApplication();

        const unavailableApplication =
            Object.freeze({

                ...application,

                runtimeBootstrap:
                    Object.freeze({

                        ...application
                            .runtimeBootstrap,

                        health:
                            Object.freeze({

                                ...application
                                    .runtimeBootstrap
                                    .health,

                                status:
                                    "unavailable" as const,

                            }),

                    }),

            }) satisfies JokerApplication;

        const health =
            inspectApplicationHealth(
                unavailableApplication,
            );

        assert.equal(
            health.runtimeStatus,
            "unavailable",
        );

        assert.equal(
            health.status,
            "unavailable",
        );

    },
);

test(
    "inspectApplicationHealth returns an immutable health projection",
    () => {

        const application =
            createApplication();

        const health =
            inspectApplicationHealth(
                application,
            );

        assert.equal(
            Object.isFrozen(health),
            true,
        );

    },
);

test(
    "inspectApplicationHealth rejects a missing application",
    () => {

        assert.throws(
            () =>
                inspectApplicationHealth(
                    undefined as unknown as JokerApplication,
                ),
            /Application is required/,
        );

    },
);

test(
    "inspectApplicationHealth rejects an invalid timestamp",
    () => {

        const application =
            createApplication();

        assert.throws(
            () =>
                inspectApplicationHealth(
                    application,
                    new Date(Number.NaN),
                ),
            /must be a valid date/,
        );

    },
);
