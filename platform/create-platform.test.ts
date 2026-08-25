/**
 * HERMETICUM B.C.E.
 * AI JOKER-C2
 *
 * Platform Composition Tests
 */

import { test } from "vitest";
import assert from "node:assert/strict";

import {
    createPlatform,
} from "./create-platform";

import {
    inspectApplicationHealth,
} from "../app";

test(
    "createPlatform builds an operational platform",
    () => {

        const platform =
            createPlatform();

        assert.equal(
            platform.name,
            "HERMETICUM B.C.E. AI JOKER-C2 PLATFORM",
        );

        assert.equal(
            platform.version,
            "1.0.0",
        );

        assert.equal(
            platform.status,
            "operational",
        );

        const health =
            inspectApplicationHealth(
                platform.application,
                platform.createdAt,
            );

        assert.equal(
            health.status,
            "healthy",
        );

        assert.equal(
            platform.application.status,
            "ready",
        );

    },
);

test(
    "createPlatform preserves the configured version",
    () => {

        const platform =
            createPlatform({

                version:
                    "2.1.0",

            });

        assert.equal(
            platform.version,
            "2.1.0",
        );

    },
);

test(
    "createPlatform trims version whitespace",
    () => {

        const platform =
            createPlatform({

                version:
                    " 3.0.0 ",

            });

        assert.equal(
            platform.version,
            "3.0.0",
        );

    },
);

test(
    "createPlatform preserves timestamps",
    () => {

        const timestamp =
            new Date(
                "2026-01-19T15:30:00.000Z",
            );

        const platform =
            createPlatform({

                createdAt:
                    timestamp,

            });

        assert.notStrictEqual(
            platform.createdAt,
            timestamp,
        );

        assert.equal(
            platform.createdAt.getTime(),
            timestamp.getTime(),
        );

        assert.equal(
            platform.application.createdAt.getTime(),
            timestamp.getTime(),
        );

        const health =
            inspectApplicationHealth(
                platform.application,
                platform.createdAt,
            );

        assert.equal(
            health.checkedAt.getTime(),
            timestamp.getTime(),
        );

    },
);

test(
    "platform composition is immutable",
    () => {

        const platform =
            createPlatform();

        assert.equal(
            Object.isFrozen(platform),
            true,
        );

        assert.equal(
            Object.isFrozen(
                platform.application,
            ),
            true,
        );

        const health =
            inspectApplicationHealth(
                platform.application,
                platform.createdAt,
            );

        assert.equal(
            Object.isFrozen(
                health,
            ),
            true,
        );

    },
);

test(
    "createPlatform rejects an empty version",
    () => {

        assert.throws(
            () =>
                createPlatform({

                    version:
                        "   ",

                }),
            /Platform version must not be empty\./,
        );

    },
);

test(
    "createPlatform rejects an invalid timestamp",
    () => {

        assert.throws(
            () =>
                createPlatform({

                    createdAt:
                        new Date(Number.NaN),

                }),
            /valid date/,
        );

    },
);

test(
    "platform is operational only when application health is healthy",
    () => {

        const platform =
            createPlatform();

        assert.equal(
            platform.status,
            "operational",
        );

        const health =
            inspectApplicationHealth(
                platform.application,
                platform.createdAt,
            );

        assert.equal(
            health.status,
            "healthy",
        );

    },
);
