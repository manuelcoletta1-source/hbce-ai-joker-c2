/**
 * HERMETICUM B.C.E.
 * AI JOKER-C2
 *
 * Application Lifecycle Tests
 */

import { test } from "vitest";
import assert from "node:assert/strict";

import {
    createApplication,
} from "./create-application";

import {
    restartApplication,
    startApplication,
    stopApplication,
} from "./application-lifecycle";

test(
    "stopApplication transitions a ready application to stopped",
    () => {

        const application =
            createApplication();

        const transitionedAt =
            new Date(
                "2026-01-19T15:30:00.000Z",
            );

        const transition =
            stopApplication(
                application,
                transitionedAt,
            );

        assert.equal(
            transition.action,
            "stop",
        );

        assert.equal(
            transition.previousStatus,
            "ready",
        );

        assert.equal(
            transition.nextStatus,
            "stopped",
        );

        assert.equal(
            transition.application.status,
            "stopped",
        );

        assert.equal(
            transition.transitionedAt.getTime(),
            transitionedAt.getTime(),
        );

    },
);

test(
    "startApplication transitions a stopped application to ready",
    () => {

        const application =
            createApplication();

        const stopped =
            stopApplication(
                application,
            );

        const transitionedAt =
            new Date(
                "2026-01-19T15:31:00.000Z",
            );

        const transition =
            startApplication(
                stopped.application,
                transitionedAt,
            );

        assert.equal(
            transition.action,
            "start",
        );

        assert.equal(
            transition.previousStatus,
            "stopped",
        );

        assert.equal(
            transition.nextStatus,
            "ready",
        );

        assert.equal(
            transition.application.status,
            "ready",
        );

        assert.equal(
            transition.transitionedAt.getTime(),
            transitionedAt.getTime(),
        );

    },
);

test(
    "restartApplication creates a new ready application",
    () => {

        const application =
            createApplication({

                version:
                    "1.2.3",

            });

        const transitionedAt =
            new Date(
                "2026-01-19T15:32:00.000Z",
            );

        const transition =
            restartApplication(
                application,
                transitionedAt,
            );

        assert.equal(
            transition.action,
            "restart",
        );

        assert.equal(
            transition.previousStatus,
            "ready",
        );

        assert.equal(
            transition.nextStatus,
            "ready",
        );

        assert.equal(
            transition.application.status,
            "ready",
        );

        assert.equal(
            transition.application.version,
            "1.2.3",
        );

        assert.notStrictEqual(
            transition.application,
            application,
        );

        assert.notStrictEqual(
            transition.application.runtimeBootstrap,
            application.runtimeBootstrap,
        );

        assert.equal(
            transition.application.createdAt.getTime(),
            transitionedAt.getTime(),
        );

        assert.equal(
            transition
                .application
                .runtimeBootstrap
                .bootstrappedAt
                .getTime(),
            transitionedAt.getTime(),
        );

    },
);

test(
    "restartApplication can restart a stopped application",
    () => {

        const application =
            createApplication();

        const stopped =
            stopApplication(
                application,
            );

        const transition =
            restartApplication(
                stopped.application,
            );

        assert.equal(
            transition.previousStatus,
            "stopped",
        );

        assert.equal(
            transition.application.status,
            "ready",
        );

        assert.equal(
            transition
                .application
                .runtimeBootstrap
                .health
                .status,
            "healthy",
        );

    },
);

test(
    "lifecycle transitions are immutable",
    () => {

        const application =
            createApplication();

        const transition =
            stopApplication(
                application,
            );

        assert.equal(
            Object.isFrozen(transition),
            true,
        );

        assert.equal(
            Object.isFrozen(
                transition.application,
            ),
            true,
        );

    },
);

test(
    "stopApplication rejects an already stopped application",
    () => {

        const application =
            createApplication();

        const stopped =
            stopApplication(
                application,
            );

        assert.throws(
            () =>
                stopApplication(
                    stopped.application,
                ),
            /already stopped/,
        );

    },
);

test(
    "startApplication rejects an already ready application",
    () => {

        const application =
            createApplication();

        assert.throws(
            () =>
                startApplication(
                    application,
                ),
            /already ready/,
        );

    },
);

test(
    "lifecycle operations reject a missing application",
    () => {

        assert.throws(
            () =>
                stopApplication(
                    undefined as never,
                ),
            /Application is required/,
        );

        assert.throws(
            () =>
                startApplication(
                    undefined as never,
                ),
            /Application is required/,
        );

        assert.throws(
            () =>
                restartApplication(
                    undefined as never,
                ),
            /Application is required/,
        );

    },
);

test(
    "lifecycle operations reject invalid timestamps",
    () => {

        const application =
            createApplication();

        const invalidTimestamp =
            new Date(Number.NaN);

        assert.throws(
            () =>
                stopApplication(
                    application,
                    invalidTimestamp,
                ),
            /must be a valid date/,
        );

        const stopped =
            stopApplication(
                application,
            );

        assert.throws(
            () =>
                startApplication(
                    stopped.application,
                    invalidTimestamp,
                ),
            /must be a valid date/,
        );

        assert.throws(
            () =>
                restartApplication(
                    application,
                    invalidTimestamp,
                ),
            /must be a valid date/,
        );

    },
);
