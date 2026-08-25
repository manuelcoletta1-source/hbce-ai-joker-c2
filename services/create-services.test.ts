/**
 * HERMETICUM B.C.E.
 * AI JOKER-C2
 *
 * Canonical Service Layer Composition Tests
 */

import { test } from "vitest";
import assert from "node:assert/strict";

import {
    createPlatform,
    type JokerPlatform,
} from "../platform";

import {
    createServices,
} from "./create-services";

test(
    "createServices creates the canonical ready service boundary",
    () => {

        const createdAt =
            new Date(
                "2026-01-19T15:30:00.000Z",
            );

        const services =
            createServices({

                version:
                    "1.2.0",

                createdAt,

            });

        assert.equal(
            services.name,
            "AI JOKER-C2 Services",
        );

        assert.equal(
            services.version,
            "1.2.0",
        );

        assert.equal(
            services.status,
            "ready",
        );

        assert.equal(
            services.platform.status,
            "operational",
        );

        assert.equal(
            services.createdAt.getTime(),
            createdAt.getTime(),
        );

        assert.deepEqual(
            services.capabilities,
            [
                "research",
                "conversation",
                "ipr",
                "evt",
                "opc",
                "audit",
                "model-usage",
            ],
        );

    },
);

test(
    "createServices creates a platform when one is not supplied",
    () => {

        const createdAt =
            new Date(
                "2026-01-19T15:31:00.000Z",
            );

        const services =
            createServices({

                createdAt,

                platformOptions: {

                    version:
                        "2.0.0",

                },

            });

        assert.equal(
            services.platform.version,
            "2.0.0",
        );

        assert.equal(
            services.platform.createdAt.getTime(),
            createdAt.getTime(),
        );

        assert.equal(
            services.status,
            "ready",
        );

    },
);

test(
    "createServices accepts an existing platform",
    () => {

        const platform =
            createPlatform({

                version:
                    "3.0.0",

            });

        const services =
            createServices({

                platform,

            });

        assert.strictEqual(
            services.platform,
            platform,
        );

        assert.equal(
            services.platform.version,
            "3.0.0",
        );

        assert.equal(
            services.status,
            "ready",
        );

    },
);

test(
    "createServices derives degraded status from a degraded platform",
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

        assert.equal(
            services.status,
            "degraded",
        );

    },
);

test(
    "createServices derives unavailable status from an unavailable platform",
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

        assert.equal(
            services.status,
            "unavailable",
        );

    },
);

test(
    "createServices normalizes and deduplicates capabilities",
    () => {

        const services =
            createServices({

                capabilities: [

                    "research",

                    " conversation ",

                    "research",

                    "audit",

                    "audit",

                ],

            });

        assert.deepEqual(
            services.capabilities,
            [
                "research",
                "conversation",
                "audit",
            ],
        );

        assert.equal(
            Object.isFrozen(
                services.capabilities,
            ),
            true,
        );

    },
);

test(
    "createServices preserves timestamp isolation",
    () => {

        const createdAt =
            new Date(
                "2026-01-19T15:32:00.000Z",
            );

        const services =
            createServices({

                createdAt,

            });

        assert.notStrictEqual(
            services.createdAt,
            createdAt,
        );

        assert.equal(
            services.createdAt.getTime(),
            createdAt.getTime(),
        );

    },
);

test(
    "createServices returns an immutable service boundary",
    () => {

        const services =
            createServices();

        assert.equal(
            Object.isFrozen(services),
            true,
        );

        assert.equal(
            Object.isFrozen(
                services.capabilities,
            ),
            true,
        );

    },
);

test(
    "createServices rejects simultaneous platform and platformOptions",
    () => {

        const platform =
            createPlatform();

        assert.throws(
            () =>
                createServices({

                    platform,

                    platformOptions: {

                        version:
                            "4.0.0",

                    },

                }),
            /either platform or platformOptions/,
        );

    },
);

test(
    "createServices rejects an empty version",
    () => {

        assert.throws(
            () =>
                createServices({

                    version:
                        "   ",

                }),
            /Services version must not be empty/,
        );

    },
);

test(
    "createServices rejects empty capabilities",
    () => {

        assert.throws(
            () =>
                createServices({

                    capabilities: [

                        "research",

                        "   ",

                    ],

                }),
            /Service capability at index 1 must not be empty/,
        );

    },
);

test(
    "createServices rejects an invalid creation timestamp",
    () => {

        assert.throws(
            () =>
                createServices({

                    createdAt:
                        new Date(
                            Number.NaN,
                        ),

                }),
            /Services creation timestamp must be a valid date/,
        );

    },
);
