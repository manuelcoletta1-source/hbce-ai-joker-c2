/**
 * HERMETICUM B.C.E.
 * AI JOKER-C2
 *
 * Application Composition Tests
 */

import { test } from "vitest";
import assert from "node:assert/strict";

import {
    createApplication,
} from "./create-application";

test(
    "createApplication builds a ready AI JOKER-C2 application",
    () => {

        const application =
            createApplication();

        assert.equal(
            application.name,
            "AI JOKER-C2",
        );

        assert.equal(
            application.version,
            "1.0.0",
        );

        assert.equal(
            application.status,
            "ready",
        );

        assert.ok(
            application.runtimeBootstrap,
        );

        assert.equal(
            application.runtimeBootstrap.health.status,
            "healthy",
        );

    },
);

test(
    "createApplication preserves the configured version",
    () => {

        const application =
            createApplication({

                version:
                    "1.2.3",

            });

        assert.equal(
            application.version,
            "1.2.3",
        );

    },
);

test(
    "createApplication normalizes surrounding version whitespace",
    () => {

        const application =
            createApplication({

                version:
                    " 2.0.0 ",

            });

        assert.equal(
            application.version,
            "2.0.0",
        );

    },
);

test(
    "createApplication preserves the creation timestamp",
    () => {

        const timestamp =
            new Date("2026-01-19T15:30:00.000Z");

        const application =
            createApplication({

                createdAt:
                    timestamp,

            });

        assert.notStrictEqual(
            application.createdAt,
            timestamp,
        );

        assert.equal(
            application.createdAt.getTime(),
            timestamp.getTime(),
        );

        assert.equal(
            application.runtimeBootstrap.bootstrappedAt.getTime(),
            timestamp.getTime(),
        );

    },
);

test(
    "createApplication allows an explicit runtime bootstrap timestamp",
    () => {

        const createdAt =
            new Date("2026-01-19T15:30:00.000Z");

        const bootstrappedAt =
            new Date("2026-01-19T15:31:00.000Z");

        const application =
            createApplication({

                createdAt,

                runtime: {

                    bootstrappedAt,

                },

            });

        assert.equal(
            application.createdAt.getTime(),
            createdAt.getTime(),
        );

        assert.equal(
            application.runtimeBootstrap.bootstrappedAt.getTime(),
            bootstrappedAt.getTime(),
        );

    },
);

test(
    "createApplication returns an immutable application boundary",
    () => {

        const application =
            createApplication();

        assert.equal(
            Object.isFrozen(application),
            true,
        );

    },
);

test(
    "createApplication rejects an empty version",
    () => {

        assert.throws(
            () =>
                createApplication({

                    version:
                        "   ",

                }),
        );

    },
);

test(
    "createApplication rejects an invalid creation timestamp",
    () => {

        assert.throws(
            () =>
                createApplication({

                    createdAt:
                        new Date(Number.NaN),

                }),
        );

    },
);
