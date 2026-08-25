/**
 * HERMETICUM B.C.E.
 * AI JOKER-C2
 *
 * Platform Lifecycle Tests
 */

import { test } from "vitest";
import assert from "node:assert/strict";

import {
    createPlatform,
} from "./create-platform";

import {
    restartPlatform,
    startPlatform,
    stopPlatform,
} from "./platform-lifecycle";

test(
    "stopPlatform transitions an operational platform to unavailable",
    () => {

        const platform =
            createPlatform();

        const transitionedAt =
            new Date(
                "2026-01-19T15:30:00.000Z",
            );

        const transition =
            stopPlatform(
                platform,
                transitionedAt,
            );

        assert.equal(
            transition.action,
            "stop",
        );

        assert.equal(
            transition.previousStatus,
            "operational",
        );

        assert.equal(
            transition.nextStatus,
            "unavailable",
        );

        assert.equal(
            transition.platform.status,
            "unavailable",
        );

        assert.equal(
            transition.changed,
            true,
        );

        assert.strictEqual(
            transition.platform.application,
            platform.application,
        );

        assert.equal(
            transition.platform.application.status,
            "ready",
        );

        assert.equal(
            transition.transitionedAt.getTime(),
            transitionedAt.getTime(),
        );

    },
);

test(
    "startPlatform transitions an unavailable platform to operational",
    () => {

        const platform =
            createPlatform();

        const stopped =
            stopPlatform(
                platform,
            );

        const transitionedAt =
            new Date(
                "2026-01-19T15:31:00.000Z",
            );

        const transition =
            startPlatform(
                stopped.platform,
                transitionedAt,
            );

        assert.equal(
            transition.action,
            "start",
        );

        assert.equal(
            transition.previousStatus,
            "unavailable",
        );

        assert.equal(
            transition.nextStatus,
            "operational",
        );

        assert.equal(
            transition.platform.status,
            "operational",
        );

        assert.equal(
            transition.changed,
            true,
        );

        assert.strictEqual(
            transition.platform.application,
            stopped.platform.application,
        );

        assert.equal(
            transition.platform.application.status,
            "ready",
        );

        assert.equal(
            transition.transitionedAt.getTime(),
            transitionedAt.getTime(),
        );

    },
);

test(
    "restartPlatform creates a fresh platform snapshot while preserving application runtime",
    () => {

        const platform =
            createPlatform({

                version:
                    "2.4.0",

            });

        const transitionedAt =
            new Date(
                "2026-01-19T15:32:00.000Z",
            );

        const transition =
            restartPlatform(
                platform,
                transitionedAt,
            );

        assert.equal(
            transition.action,
            "restart",
        );

        assert.equal(
            transition.previousStatus,
            "operational",
        );

        assert.equal(
            transition.nextStatus,
            "operational",
        );

        assert.equal(
            transition.platform.version,
            "2.4.0",
        );

        assert.equal(
            transition.platform.status,
            "operational",
        );

        assert.equal(
            transition.changed,
            false,
        );

        assert.notStrictEqual(
            transition.platform,
            platform,
        );

        assert.strictEqual(
            transition.platform.application,
            platform.application,
        );

        assert.strictEqual(
            transition.platform.application.runtimeBootstrap,
            platform.application.runtimeBootstrap,
        );

        assert.equal(
            transition.platform.createdAt.getTime(),
            platform.createdAt.getTime(),
        );

        assert.equal(
            transition.transitionedAt.getTime(),
            transitionedAt.getTime(),
        );

    },
);

test(
    "restartPlatform can recover an unavailable platform",
    () => {

        const platform =
            createPlatform();

        const stopped =
            stopPlatform(
                platform,
            );

        const transition =
            restartPlatform(
                stopped.platform,
            );

        assert.equal(
            transition.previousStatus,
            "unavailable",
        );

        assert.equal(
            transition.nextStatus,
            "operational",
        );

        assert.equal(
            transition.platform.status,
            "operational",
        );

        assert.equal(
            transition.changed,
            true,
        );

        assert.notStrictEqual(
            transition.platform,
            stopped.platform,
        );

        assert.strictEqual(
            transition.platform.application,
            stopped.platform.application,
        );

    },
);

test(
    "platform lifecycle transitions preserve platform identity",
    () => {

        const platform =
            createPlatform({

                version:
                    "3.1.0",

                createdAt:
                    new Date(
                        "2026-01-19T15:30:00.000Z",
                    ),

            });

        const transition =
            stopPlatform(
                platform,
            );

        assert.equal(
            transition.platform.name,
            platform.name,
        );

        assert.equal(
            transition.platform.version,
            platform.version,
        );

        assert.equal(
            transition.platform.createdAt.getTime(),
            platform.createdAt.getTime(),
        );

        assert.notStrictEqual(
            transition.platform.createdAt,
            platform.createdAt,
        );

    },
);

test(
    "platform lifecycle transitions are immutable",
    () => {

        const platform =
            createPlatform();

        const transition =
            stopPlatform(
                platform,
            );

        assert.equal(
            Object.isFrozen(transition),
            true,
        );

        assert.equal(
            Object.isFrozen(
                transition.platform,
            ),
            true,
        );

        assert.equal(
            Object.isFrozen(
                transition.platform.application,
            ),
            true,
        );

        assert.equal(
            Object.isFrozen(
                transition.platform.capabilities,
            ),
            true,
        );

    },
);

test(
    "stopPlatform is idempotent for an already unavailable platform",
    () => {

        const platform =
            createPlatform();

        const stopped =
            stopPlatform(
                platform,
            );

        const repeated =
            stopPlatform(
                stopped.platform,
            );

        assert.equal(
            repeated.action,
            "stop",
        );

        assert.equal(
            repeated.previousStatus,
            "unavailable",
        );

        assert.equal(
            repeated.nextStatus,
            "unavailable",
        );

        assert.equal(
            repeated.changed,
            false,
        );

        assert.strictEqual(
            repeated.platform,
            stopped.platform,
        );

    },
);

test(
    "startPlatform is idempotent for an already operational platform",
    () => {

        const platform =
            createPlatform();

        const repeated =
            startPlatform(
                platform,
            );

        assert.equal(
            repeated.action,
            "start",
        );

        assert.equal(
            repeated.previousStatus,
            "operational",
        );

        assert.equal(
            repeated.nextStatus,
            "operational",
        );

        assert.equal(
            repeated.changed,
            false,
        );

        assert.strictEqual(
            repeated.platform,
            platform,
        );

    },
);

test(
    "platform lifecycle operations reject a missing platform",
    () => {

        assert.throws(
            () =>
                stopPlatform(
                    undefined as never,
                ),
            /Platform is required/,
        );

        assert.throws(
            () =>
                startPlatform(
                    undefined as never,
                ),
            /Platform is required/,
        );

        assert.throws(
            () =>
                restartPlatform(
                    undefined as never,
                ),
            /Platform is required/,
        );

    },
);

test(
    "platform lifecycle operations reject invalid timestamps",
    () => {

        const platform =
            createPlatform();

        const invalidTimestamp =
            new Date(Number.NaN);

        assert.throws(
            () =>
                stopPlatform(
                    platform,
                    invalidTimestamp,
                ),
            /must be a valid date/,
        );

        const stopped =
            stopPlatform(
                platform,
            );

        assert.throws(
            () =>
                startPlatform(
                    stopped.platform,
                    invalidTimestamp,
                ),
            /must be a valid date/,
        );

        assert.throws(
            () =>
                restartPlatform(
                    platform,
                    invalidTimestamp,
                ),
            /must be a valid date/,
        );

    },
);
