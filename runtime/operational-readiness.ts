/**
 * HERMETICUM B.C.E. - JOKER-C2 B2B
 * Operational Readiness Gate
 *
 * Readiness is NOT execution authorization.
 * No LLM may authorize an operation.
 */

import type { JokerRuntime } from "./create-joker-runtime";

export type OperationalReadinessReason =
    | "INVALID_RUNTIME"
    | "POLICY_NOT_CONFIGURED"
    | "RUNTIME_NOT_READY"
    | "REQUIRED_MODULE_MISSING"
    | "REQUIRED_MODULE_NOT_ACTIVE";

export interface OperationalReadinessResult {
    readonly status: "ready" | "blocked";
    readonly reasons: readonly OperationalReadinessReason[];
    readonly missingModules: readonly string[];
    readonly inactiveModules: readonly string[];
}

export function inspectOperationalReadiness(
    runtime: JokerRuntime,
    requiredModuleNames: readonly string[],
): OperationalReadinessResult {

    const reasons: OperationalReadinessReason[] = [];
    const missingModules: string[] = [];
    const inactiveModules: string[] = [];

    const validRuntime =
        runtime !== null &&
        typeof runtime === "object" &&
        Array.isArray(runtime.modules) &&
        Array.isArray(runtime.capabilities);

    const validPolicy =
        Array.isArray(requiredModuleNames) &&
        requiredModuleNames.length > 0 &&
        requiredModuleNames.every(
            name =>
                typeof name === "string" &&
                name.trim().length > 0
        );

    if (!validRuntime) {
        reasons.push("INVALID_RUNTIME");
    }

    if (!validPolicy) {
        reasons.push("POLICY_NOT_CONFIGURED");
    }

    if (validRuntime && runtime.status !== "ready") {
        reasons.push("RUNTIME_NOT_READY");
    }

    if (validRuntime && validPolicy) {
        for (const requiredName of new Set(
            requiredModuleNames.map(name => name.trim())
        )) {
            const module = runtime.modules.find(
                item => item?.name === requiredName
            );

            if (!module) {
                missingModules.push(requiredName);
            } else if (module.status !== "active") {
                inactiveModules.push(requiredName);
            }
        }
    }

    if (missingModules.length > 0) {
        reasons.push("REQUIRED_MODULE_MISSING");
    }

    if (inactiveModules.length > 0) {
        reasons.push("REQUIRED_MODULE_NOT_ACTIVE");
    }

    return Object.freeze({
        status: reasons.length === 0
            ? "ready" as const
            : "blocked" as const,
        reasons: Object.freeze(reasons),
        missingModules: Object.freeze(missingModules),
        inactiveModules: Object.freeze(inactiveModules),
    });
}
