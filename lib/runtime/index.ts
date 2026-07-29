/**
 * AI JOKER-C2
 * Runtime Public API
 * HERMETICUM B.C.E.
 */

export * from "./mission";
export * from "./claim";
export * from "./source-intelligence";
export * from "./srsc-engine";
export * from "./runtime-engine";

/**
 * Runtime Version
 */

export const RUNTIME_VERSION = "1.0.0";

/**
 * Runtime Name
 */

export const RUNTIME_NAME = "AI JOKER-C2 Mission Runtime";

/**
 * Runtime Framework
 */

export const RUNTIME_FRAMEWORK = "SRSC-V17.1";

/**
 * Runtime Status
 */

export const RUNTIME_STATUS = "ACTIVE";

/**
 * Runtime Boundaries
 */

export const RUNTIME_BOUNDARIES = [

  "NO_IDENTITY_NO_ACTION",

  "NO_MISSION_NO_ACTION",

  "NO_SOURCE_NO_CLAIM",

  "NO_FRAMEWORK_WITHOUT_LABEL",

  "NO_AUTHORIZATION_NO_ACTION",

  "NO_TRACE_NO_ACTION",

  "FAIL_CLOSED"

] as const;

/**
 * Runtime Information
 */

export function runtimeInfo() {

  return {

    name: RUNTIME_NAME,

    version: RUNTIME_VERSION,

    framework: RUNTIME_FRAMEWORK,

    status: RUNTIME_STATUS,

    boundaries: [...RUNTIME_BOUNDARIES]

  };

}
