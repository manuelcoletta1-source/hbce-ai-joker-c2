/**
 * HERMETICUM B.C.E.
 * AI JOKER-C2
 *
 * Runtime Health Tests
 */

import test from "node:test";
import assert from "node:assert/strict";

import {
    createJokerRuntime,
} from "./create-joker-runtime";

import {
    inspectRuntimeHealth,
} from "./runtime-health";

test(
    "runtime health is healthy when every module exists",
    () => {

        const runtime =
            createJokerRuntime();

        const health =
            inspectRuntimeHealth(
                runtime,
                new Date("2026-01-19T15:30:00.000Z"),
            );

        assert.equal(
            health.status,
            "healthy",
        );

        assert.equal(
            health.availableModuleCount,
            7,
        );

        assert.equal(
            health.totalModuleCount,
            7,
        );

        assert.equal(
            health.modules.length,
            7,
        );

    },
);

test(
    "runtime health timestamp is preserved",
    () => {

        const runtime =
            createJokerRuntime();

        const timestamp =
            new Date("2026-01-19T15:30:00.000Z");

        const health =
            inspectRuntimeHealth(
                runtime,
                timestamp,
            );

        assert.notStrictEqual(
            health.checkedAt,
            timestamp,
        );

        assert.equal(
            health.checkedAt.getTime(),
            timestamp.getTime(),
        );

    },
);

test(
    "runtime health modules are all available",
    () => {

        const runtime =
            createJokerRuntime();

        const health =
            inspectRuntimeHealth(runtime);

        for (const module of health.modules) {

            assert.equal(
                module.available,
                true,
            );

        }

    },
);

test(
    "runtime health result is immutable",
    () => {

        const runtime =
            createJokerRuntime();

        const health =
            inspectRuntimeHealth(runtime);

        assert.equal(
            Object.isFrozen(health),
            true,
        );

        assert.equal(
            Object.isFrozen(health.modules),
            true,
        );

    },
);

test(
    "invalid date throws",
    () => {

        const runtime =
            createJokerRuntime();

        assert.throws(
            () =>
                inspectRuntimeHealth(
                    runtime,
                    new Date(Number.NaN),
                ),
        );

    },
);
