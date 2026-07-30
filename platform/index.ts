/**
 * HERMETICUM B.C.E.
 * AI JOKER-C2
 *
 * Platform Layer Public API
 */

export {
    createPlatform,
    type CreatePlatformOptions,
    type JokerPlatform,
    type PlatformStatus,
} from "./create-platform";

export {
    inspectPlatformHealth,
    type PlatformHealth,
    type PlatformHealthStatus,
} from "./platform-health";

export {
    restartPlatform,
    startPlatform,
    stopPlatform,
    type PlatformLifecycleAction,
    type PlatformLifecycleTransition,
} from "./platform-lifecycle";
