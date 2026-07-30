/**
 * HERMETICUM B.C.E.
 * AI JOKER-C2
 *
 * Bootstrap Tests
 */

import test from "node:test";
import assert from "node:assert/strict";

import {
    bootstrapJokerRuntime,
} from "./bootstrap";

test(
    "bootstrap creates a healthy runtime",
    () => {

        const result =
            bootstrapJokerRuntime();

        assert.ok(result.runtime);

        assert.ok(result.health);

        assert.equal(
            result.health.status,
            "healthy",
        );

    },
);

test(
    "bootstrap preserves timestamp",
    () => {

        const timestamp =
            new Date("2026-01-19T15:30:00.000Z");

        const result =
            bootstrapJokerRuntime({

                bootstrappedAt:
                    timestamp,

            });

        assert.notStrictEqual(
            result.bootstrappedAt,
            timestamp,
        );

        assert.equal(
            result.bootstrappedAt.getTime(),
            timestamp.getTime(),
        );

        assert.equal(
            result.health.checkedAt.getTime(),
            timestamp.getTime(),
        );

    },
);

test(
    "bootstrap result is immutable",
    () => {

        const result =
            bootstrapJokerRuntime();

        assert.equal(
            Object.isFrozen(result),
            true,
        );

    },
);

test(
    "bootstrap accepts healthy runtime when required",
    () => {

        const result =
            bootstrapJokerRuntime({

                requireHealthy: true,

            });

        assert.equal(
            result.health.status,
            "healthy",
        );

    },
);

test(
    "bootstrap also succeeds when health enforcement is disabled",
    () => {

        const result =
            bootstrapJokerRuntime({

                requireHealthy: false,

            });

        assert.ok(result.runtime);

        assert.ok(result.health);

    },
);

test(
    "invalid bootstrap timestamp throws",
    () => {

        assert.throws(
            () =>
                bootstrapJokerRuntime({

                    bootstrappedAt:
                        new Date(Number.NaN),

                }),
        );

    },
);
