/**
 * HERMETICUM B.C.E.
 * AI JOKER-C2
 *
 * Canonical Runtime Composition Test
 *
 * Verifies that the complete JOKER-C2 runtime
 * is assembled with every required domain module.
 */

import test from "node:test";

import assert from "node:assert/strict";

import {
    createJokerRuntime,
} from "./create-joker-runtime";

test(
    "createJokerRuntime assembles every canonical runtime module",
    () => {

        const runtime =
            createJokerRuntime();

        assert.ok(
            runtime,
            "JOKER-C2 runtime must be created.",
        );

        assert.ok(
            runtime.research,
            "Research Runtime must be available.",
        );

        assert.ok(
            runtime.conversation,
            "Conversation Runtime must be available.",
        );

        assert.ok(
            runtime.ipr,
            "IPR Runtime must be available.",
        );

        assert.ok(
            runtime.evt,
            "EVT Runtime must be available.",
        );

        assert.ok(
            runtime.opc,
            "OPC Runtime must be available.",
        );

        assert.ok(
            runtime.audit,
            "Audit Runtime must be available.",
        );

        assert.ok(
            runtime.modelUsage,
            "Model Usage Runtime must be available.",
        );

    },
);

test(
    "createJokerRuntime returns an immutable composition root",
    () => {

        const runtime =
            createJokerRuntime();

        assert.equal(
            Object.isFrozen(runtime),
            true,
            "JOKER-C2 runtime composition must be frozen.",
        );

    },
);

test(
    "createJokerRuntime creates isolated runtime instances",
    () => {

        const firstRuntime =
            createJokerRuntime();

        const secondRuntime =
            createJokerRuntime();

        assert.notStrictEqual(
            firstRuntime,
            secondRuntime,
            "Each factory call must return a distinct runtime.",
        );

        assert.notStrictEqual(
            firstRuntime.research,
            secondRuntime.research,
            "Research runtimes must be isolated.",
        );

        assert.notStrictEqual(
            firstRuntime.conversation,
            secondRuntime.conversation,
            "Conversation runtimes must be isolated.",
        );

        assert.notStrictEqual(
            firstRuntime.ipr,
            secondRuntime.ipr,
            "IPR runtimes must be isolated.",
        );

        assert.notStrictEqual(
            firstRuntime.evt,
            secondRuntime.evt,
            "EVT runtimes must be isolated.",
        );

        assert.notStrictEqual(
            firstRuntime.opc,
            secondRuntime.opc,
            "OPC runtimes must be isolated.",
        );

        assert.notStrictEqual(
            firstRuntime.audit,
            secondRuntime.audit,
            "Audit runtimes must be isolated.",
        );

        assert.notStrictEqual(
            firstRuntime.modelUsage,
            secondRuntime.modelUsage,
            "Model Usage runtimes must be isolated.",
        );

    },
);
