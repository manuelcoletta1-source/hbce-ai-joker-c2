/**
 * HERMETICUM B.C.E.
 * AI JOKER-C2
 *
 * Services Health Projection Tests
 */

import { test } from "vitest";
import assert from "node:assert/strict";

import {
    createPlatform,
    type JokerPlatform,
} from "../platform";

import {
    createServices,
    type JokerServices,
} from "./create-services";

import {
    inspectServicesHealth,
} from "./services-health";

test(
    "inspectServicesHealth reports healthy services",
    () => {

        const checkedAt =
            new Date(
                "2026-01-19T15:30:00.000Z",
            );

        const services =
            createServices({

                capabilities: [
                    "research",
                    "conversation",
                    "audit",
                ],

            });

        const health =
            inspectServicesHealth(
                services,
                checkedAt,
            );

        assert.equal(
            health.status,
            "healthy",
        );

        assert.equal(
            health.servicesStatus,
            "ready",
        );

        assert.equal(
            health.platformStatus,
            "healthy",
        );

        assert.equal(
            health.capabilityCount,
            3,
        );

        assert.equal(
            health.operational,
            true,
        );

        assert.equal(
            health.checkedAt.getTime(),
            checkedAt.getTime(),
        );

    },
);

test(
    "inspectServicesHealth reports degraded services",
    () => {

        const services =
            createServices();

        const degradedServices:
            JokerServices =
            Object.freeze({

                ...services,

                status:
                    "degraded" as const,

            });

        const health =
            inspectServicesHealth(
                degradedServices,
            );

        assert.equal(
            health.status,
            "degraded",
        );

        assert.equal(
            health.servicesStatus,
            "degraded",
        );

        assert.equal(
            health.operational,
            false,
        );

    },
);

test(
    "inspectServicesHealth reports unavailable services",
    () => {

        const services =
            createServices();

        const unavailableServices:
            JokerServices =
            Object.freeze({

                ...services,

                status:
                    "unavailable" as const,

            });

        const health =
            inspectServicesHealth(
                unavailableServices,
            );

        assert.equal(
            health.status,
            "unavailable",
        );

        assert.equal(
            health.servicesStatus,
            "unavailable",
        );

        assert.equal(
            health.operational,
            false,
        );

    },
);

test(
    "inspectServicesHealth propagates degraded platform health",
    () => {

        const platform =
            createPlatform();

        const degradedPlatform:
            JokerPlatform =
            Object.freeze({

                ...platform,

                status:
                    "degraded" as const,

            });

        const services =
            createServices({

                platform:
                    degradedPlatform,

            });

        const readyServices:
            JokerServices =
            Object.freeze({

                ...services,

                status:
                    "ready" as const,

            });

        const health =
            inspectServicesHealth(
                readyServices,
            );

        assert.equal(
            health.status,
            "degraded",
        );

        assert.equal(
            health.platformStatus,
            "degraded",
        );

        assert.equal(
            health.operational,
            false,
        );

    },
);

test(
    "inspectServicesHealth propagates unavailable platform health",
    () => {

        const platform =
            createPlatform();

        const unavailablePlatform:
            JokerPlatform =
            Object.freeze({

                ...platform,

                status:
                    "unavailable" as const,

            });

        const services =
            createServices({

                platform:
                    unavailablePlatform,

            });

        const readyServices:
            JokerServices =
            Object.freeze({

                ...services,

                status:
                    "ready" as const,

            });

        const health =
            inspectServicesHealth(
                readyServices,
            );

        assert.equal(
            health.status,
            "unavailable",
        );

        assert.equal(
            health.platformStatus,
            "unavailable",
        );

        assert.equal(
            health.operational,
            false,
        );

    },
);

test(
    "inspectServicesHealth returns an immutable snapshot",
    () => {

        const health =
            inspectServicesHealth(
                createServices(),
            );

        assert.equal(
            Object.isFrozen(health),
            true,
        );

    },
);

test(
    "inspectServicesHealth preserves timestamp isolation",
    () => {

        const checkedAt =
            new Date(
                "2026-01-19T15:31:00.000Z",
            );

        const health =
            inspectServicesHealth(
                createServices(),
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
    "inspectServicesHealth rejects missing services",
    () => {

        assert.throws(
            () =>
                inspectServicesHealth(
                    undefined as unknown as JokerServices,
                ),
            /Services are required/,
        );

    },
);

test(
    "inspectServicesHealth rejects null services",
    () => {

        assert.throws(
            () =>
                inspectServicesHealth(
                    null as unknown as JokerServices,
                ),
            /Services are required/,
        );

    },
);

test(
    "inspectServicesHealth rejects invalid timestamps",
    () => {

        assert.throws(
            () =>
                inspectServicesHealth(
                    createServices(),
                    new Date(
                        Number.NaN,
                    ),
                ),
            /Services health timestamp must be a valid date/,
        );

    },
);
