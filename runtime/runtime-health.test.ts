/**
 * HERMETICUM B.C.E.
 * AI JOKER-C2
 *
 * Runtime Health Tests
 *
 * Verifies health projection from the canonical generic
 * runtime.modules composition boundary.
 */

import { test } from "vitest";

import assert from "node:assert/strict";

import {
    createJokerRuntime,
    type JokerRuntimeModule,
} from "./create-joker-runtime";

import {
    inspectRuntimeHealth,
} from "./runtime-health";

function createActiveRuntime() {

    const modules:
        readonly JokerRuntimeModule[] = [

            {
                name:
                    "RESEARCH_RUNTIME",

                status:
                    "active",

                capabilities: [
                    "scientific-method",
                ],
            },

            {
                name:
                    "AUDIT_RUNTIME",

                status:
                    "active",

                capabilities: [
                    "audit-ledger",
                ],
            },

        ];

    return createJokerRuntime({
        modules,
    });

}

test(
    "runtime health is healthy when every registered module is active",
    () => {

        const runtime =
            createActiveRuntime();

        const health =
            inspectRuntimeHealth(
                runtime,
                new Date(
                    "2026-01-19T15:30:00.000Z",
                ),
            );

        assert.equal(
            health.status,
            "healthy",
        );

        assert.equal(
            health.healthy,
            true,
        );

        assert.equal(
            health.moduleCount,
            2,
        );

        assert.equal(
            health.activeModuleCount,
            2,
        );

        assert.equal(
            health.degradedModuleCount,
            0,
        );

        assert.equal(
            health.unavailableModuleCount,
            0,
        );

        assert.equal(
            health.modules.length,
            2,
        );

    },
);

test(
    "runtime health timestamp is preserved through an isolated Date",
    () => {

        const runtime =
            createJokerRuntime();

        const timestamp =
            new Date(
                "2026-01-19T15:30:00.000Z",
            );

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
    "runtime health module projection marks active modules healthy",
    () => {

        const runtime =
            createActiveRuntime();

        const health =
            inspectRuntimeHealth(
                runtime,
            );

        for (
            const module
            of health.modules
        ) {

            assert.equal(
                module.status,
                "active",
            );

            assert.equal(
                module.healthy,
                true,
            );

        }

    },
);

test(
    "runtime health result is immutable",
    () => {

        const runtime =
            createActiveRuntime();

        const health =
            inspectRuntimeHealth(
                runtime,
            );

        assert.equal(
            Object.isFrozen(
                health,
            ),
            true,
        );

        assert.equal(
            Object.isFrozen(
                health.modules,
            ),
            true,
        );

        assert.equal(
            Object.isFrozen(
                health.modules[0],
            ),
            true,
        );

        assert.equal(
            Object.isFrozen(
                health.capabilities,
            ),
            true,
        );

    },
);

test(
    "runtime health rejects an invalid check timestamp",
    () => {

        const runtime =
            createJokerRuntime();

        assert.throws(
            () =>
                inspectRuntimeHealth(
                    runtime,
                    new Date(
                        Number.NaN,
                    ),
                ),
            /must be a valid date/,
        );

    },
);
