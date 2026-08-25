/**
 * HERMETICUM B.C.E.
 * AI JOKER-C2
 *
 * Canonical Runtime Composition Test
 *
 * Verifies the public JOKER-C2 runtime composition boundary.
 * Domain implementations are represented through immutable
 * JokerRuntimeModule descriptors rather than fixed properties
 * on the composition root.
 */

import { test } from "vitest";

import assert from "node:assert/strict";

import {
    createJokerRuntime,
    type JokerRuntimeModule,
} from "./create-joker-runtime";

test(
    "createJokerRuntime exposes the canonical public composition boundary",
    () => {

        const runtime =
            createJokerRuntime();

        assert.ok(
            runtime,
            "JOKER-C2 runtime must be created.",
        );

        assert.equal(
            runtime.name,
            "HERMETICUM B.C.E. AI JOKER-C2 RUNTIME",
        );

        assert.equal(
            runtime.version,
            "1.0.0",
        );

        assert.equal(
            runtime.status,
            "ready",
        );

        assert.deepEqual(
            runtime.modules,
            [],
        );

        assert.deepEqual(
            runtime.capabilities,
            [
                "mission-runtime",
                "deterministic-execution",
                "fail-closed",
                "audit-first",
                "source-intelligence",
                "traceability",
                "llm-agnostic",
            ],
        );

        assert.ok(
            runtime.createdAt instanceof Date,
        );

    },
);

test(
    "createJokerRuntime composes immutable registered runtime modules",
    () => {

        const researchModule:
            JokerRuntimeModule = {

                name:
                    "RESEARCH_RUNTIME",

                status:
                    "active",

                capabilities: [
                    "scientific-method",
                    "experiment-cycle",
                ],

            };

        const auditModule:
            JokerRuntimeModule = {

                name:
                    "AUDIT_RUNTIME",

                status:
                    "degraded",

                capabilities: [
                    "traceability",
                    "audit-ledger",
                ],

            };

        const runtime =
            createJokerRuntime({

                modules: [
                    researchModule,
                    auditModule,
                ],

                capabilities: [
                    "runtime-governance",
                ],

            });

        assert.equal(
            runtime.status,
            "degraded",
        );

        assert.equal(
            runtime.modules.length,
            2,
        );

        assert.equal(
            runtime.modules[0]?.name,
            "RESEARCH_RUNTIME",
        );

        assert.equal(
            runtime.modules[1]?.name,
            "AUDIT_RUNTIME",
        );

        assert.deepEqual(
            runtime.capabilities,
            [
                "runtime-governance",
                "scientific-method",
                "experiment-cycle",
                "traceability",
                "audit-ledger",
            ],
        );

        assert.equal(
            Object.isFrozen(runtime),
            true,
        );

        assert.equal(
            Object.isFrozen(
                runtime.modules,
            ),
            true,
        );

        assert.equal(
            Object.isFrozen(
                runtime.modules[0],
            ),
            true,
        );

        assert.equal(
            Object.isFrozen(
                runtime.modules[1],
            ),
            true,
        );

        assert.equal(
            Object.isFrozen(
                runtime.capabilities,
            ),
            true,
        );

    },
);

test(
    "createJokerRuntime creates isolated runtime compositions",
    () => {

        const module:
            JokerRuntimeModule = {

                name:
                    "IPR_RUNTIME",

                status:
                    "active",

                capabilities: [
                    "ipr-boundary",
                ],

            };

        const firstRuntime =
            createJokerRuntime({

                modules: [
                    module,
                ],

            });

        const secondRuntime =
            createJokerRuntime({

                modules: [
                    module,
                ],

            });

        assert.notStrictEqual(
            firstRuntime,
            secondRuntime,
            "Each factory call must return a distinct runtime.",
        );

        assert.notStrictEqual(
            firstRuntime.modules,
            secondRuntime.modules,
            "Runtime module collections must be isolated.",
        );

        assert.notStrictEqual(
            firstRuntime.modules[0],
            secondRuntime.modules[0],
            "Normalized runtime modules must be isolated.",
        );

        assert.notStrictEqual(
            firstRuntime.capabilities,
            secondRuntime.capabilities,
            "Runtime capability collections must be isolated.",
        );

        assert.notStrictEqual(
            firstRuntime.createdAt,
            secondRuntime.createdAt,
            "Runtime timestamps must not share Date instances.",
        );

        assert.deepEqual(
            firstRuntime.modules,
            secondRuntime.modules,
        );

        assert.deepEqual(
            firstRuntime.capabilities,
            secondRuntime.capabilities,
        );

    },
);
