/**
 * HERMETICUM B.C.E.
 * AI JOKER-C2
 *
 * Platform Health Tests
 */

import test from "node:test";
import assert from "node:assert/strict";

import {
    createPlatform,
    type JokerPlatform,
} from "./create-platform";

import {
    inspectPlatformHealth,
} from "./platform-health";

test(
    "inspectPlatformHealth reports a healthy operational platform",
    () => {

        const platform =
            createPlatform();

        const checkedAt =
            new Date(
                "2026-01-19T15:30:00.000Z",
            );

        const health =
            inspectPlatformHealth(
                platform,
                checkedAt,
            );

        assert.equal(
            health.status,
            "healthy",
        );

        assert.equal(
            health.platformStatus,
            "operational",
        );

        assert.equal(
            health.applicationStatus,
            "healthy",
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
    "inspectPlatformHealth preserves timestamp immutability",
    () => {

        const platform =
            createPlatform();

        const checkedAt =
            new Date(
                "2026-01-19T15:31:00.000Z",
            );

        const health =
            inspectPlatformHealth(
                platform,
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
    "inspectPlatformHealth reports degraded platform state",
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

        const health =
            inspectPlatformHealth(
                degradedPlatform,
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
            health.applicationStatus,
            "healthy",
        );

        assert.equal(
            health.operational,
            false,
        );

    },
);

test(
    "inspectPlatformHealth reports unavailable platform state",
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

        const health =
            inspectPlatformHealth(
                unavailablePlatform,
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
    "platform health snapshot is immutable",
    () => {

        const platform =
            createPlatform();

        const health =
            inspectPlatformHealth(
                platform,
            );

        assert.equal(
            Object.isFrozen(health),
            true,
        );

    },
);

test(
    "inspectPlatformHealth rejects a missing platform",
    () => {

        assert.throws(
            () =>
                inspectPlatformHealth(
                    undefined as never,
                ),
            /Platform is required/,
        );

        assert.throws(
            () =>
                inspectPlatformHealth(
                    null as never,
                ),
            /Platform is required/,
        );

    },
);

test(
    "inspectPlatformHealth rejects an invalid timestamp",
    () => {

        const platform =
            createPlatform();

        assert.throws(
            () =>
                inspectPlatformHealth(
                    platform,
                    new Date(Number.NaN),
                ),
            /must be a valid date/,
        );

    },
);

test(
    "healthy status requires operational platform and healthy application",
    () => {

        const platform =
            createPlatform();

        const health =
            inspectPlatformHealth(
                platform,
            );

        assert.equal(
            health.platformStatus,
            "operational",
        );

        assert.equal(
            health.applicationStatus,
            "healthy",
        );

        assert.equal(
            health.status,
            "healthy",
        );

        assert.equal(
            health.operational,
            true,
        );

    },
);
