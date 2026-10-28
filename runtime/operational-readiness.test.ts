import { test } from "vitest";
import assert from "node:assert/strict";

import { createJokerRuntime } from "./create-joker-runtime";
import { inspectOperationalReadiness } from "./operational-readiness";

test("blocks when required modules are missing", () => {
    const runtime = createJokerRuntime();
    const result = inspectOperationalReadiness(runtime, ["IPR_RUNTIME"]);

    assert.equal(result.status, "blocked");
    assert.deepEqual(result.missingModules, ["IPR_RUNTIME"]);
    assert.ok(result.reasons.includes("REQUIRED_MODULE_MISSING"));
});

test("blocks when policy is not configured", () => {
    const result = inspectOperationalReadiness(createJokerRuntime(), []);

    assert.equal(result.status, "blocked");
    assert.ok(result.reasons.includes("POLICY_NOT_CONFIGURED"));
});

test("blocks when required module is degraded", () => {
    const runtime = createJokerRuntime({
        modules: [{
            name: "IPR_RUNTIME",
            status: "degraded",
            capabilities: ["ipr-boundary"],
        }],
    });

    const result = inspectOperationalReadiness(runtime, ["IPR_RUNTIME"]);

    assert.equal(result.status, "blocked");
    assert.deepEqual(result.inactiveModules, ["IPR_RUNTIME"]);
    assert.ok(result.reasons.includes("REQUIRED_MODULE_NOT_ACTIVE"));
});

test("blocks when another module makes runtime unavailable", () => {
    const runtime = createJokerRuntime({
        modules: [
            { name: "IPR_RUNTIME", status: "active", capabilities: [] },
            { name: "AUDIT_RUNTIME", status: "unavailable", capabilities: [] },
        ],
    });

    const result = inspectOperationalReadiness(runtime, ["IPR_RUNTIME"]);

    assert.equal(result.status, "blocked");
    assert.ok(result.reasons.includes("RUNTIME_NOT_READY"));
});

test("reports ready only with active required modules", () => {
    const runtime = createJokerRuntime({
        modules: [
            { name: "IPR_RUNTIME", status: "active", capabilities: [] },
            { name: "AUDIT_RUNTIME", status: "active", capabilities: [] },
        ],
    });

    const result = inspectOperationalReadiness(
        runtime,
        ["IPR_RUNTIME", "AUDIT_RUNTIME"],
    );

    assert.equal(result.status, "ready");
    assert.deepEqual(result.reasons, []);
    assert.deepEqual(result.missingModules, []);
    assert.deepEqual(result.inactiveModules, []);
});

test("blocks invalid runtime input", () => {
    const result = inspectOperationalReadiness(
        undefined as never,
        ["IPR_RUNTIME"],
    );

    assert.equal(result.status, "blocked");
    assert.ok(result.reasons.includes("INVALID_RUNTIME"));
});
