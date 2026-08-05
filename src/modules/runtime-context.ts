/**
 * HERMETICUM B.C.E. S.r.l.
 *
 * AI JOKER-C2
 * Operational Module Runtime Context
 *
 * Revision:
 * AIJC2-OPERATIONAL-MODULE-RUNTIME-CONTEXT-v1_0
 *
 * Purpose:
 * - resolve an explicitly selected operational module;
 * - bind module execution to the governed runtime context;
 * - expose only safe module metadata;
 * - preserve session-only behavior;
 * - fail closed when an invalid or unavailable module is requested.
 *
 * Explicit exclusions:
 * - no automatic module selection;
 * - no filesystem scanning;
 * - no prompt-file loading;
 * - no persistent memory;
 * - no automatic recall;
 * - no EVT, UNEBDO or OPC persistence;
 * - no route modification.
 *
 * legalCertification=false
 */

import {
  getModule,
  toOperationalModulePublicProjection,
  type OperationalModuleDefinition,
  type OperationalModulePublicProjection,
} from "./index";

export const OPERATIONAL_MODULE_RUNTIME_CONTEXT_REVISION =
  "AIJC2-OPERATIONAL-MODULE-RUNTIME-CONTEXT-v1_0" as const;

export const DEFAULT_OPERATIONAL_MODULE_RUNTIME =
  "AI_JOKER_C2_SAAS_CORE_v0_1" as const;

export const DEFAULT_OPERATIONAL_MODULE_RUNTIME_IPR =
  "IPR-AI-0001" as const;

export const DEFAULT_OPERATIONAL_MODULE_TENANT =
  "HBCE-TENANT-SELF-PILOT" as const;

export const DEFAULT_OPERATIONAL_MODULE_WORKSPACE =
  "HBCE-WORKSPACE-RND" as const;

export type OperationalModuleSelectionState =
  | "NOT_REQUESTED"
  | "SELECTED"
  | "INVALID_MODULE_ID"
  | "MODULE_NOT_REGISTERED"
  | "MODULE_DISABLED"
  | "MODULE_NOT_ACTIVE";

export interface OperationalModuleRuntimeIdentity {
  humanIpr: string;
  runtimeIpr: string;
  tenant: string;
  workspace: string;
  sessionId: string;
}

export interface OperationalModuleRuntimeRequest {
  moduleId?: unknown;
  humanIpr: string;
  runtimeIpr?: string;
  tenant?: string;
  workspace?: string;
  sessionId: string;
}

export interface OperationalModuleRuntimeContext {
  revision: typeof OPERATIONAL_MODULE_RUNTIME_CONTEXT_REVISION;

  selection: {
    requestedModuleId: string | null;
    state: OperationalModuleSelectionState;
    failClosed: boolean;
    reason: string | null;
  };

  module: OperationalModulePublicProjection | null;

  identity: OperationalModuleRuntimeIdentity;

  execution: {
    mode: "EXPLICIT_SESSION_CONTEXT";
    promptInjectionAvailable: false;
    promptInjected: false;
    persistentMemoryAvailable: false;
    automaticRecallAvailable: false;
    automaticModuleSelection: false;
  };

  governance: {
    evtRequiredAtExecution: true;
    unebdoRegistrationRequiredForUpgrade: true;
    opcTechnicalClosureRequiredForVerifiedState: true;
    matrixInterpretationRequiredForUpgrade: true;
    humanAuthorizationRequired: true;
    legalCertification: false;
  };

  legalCertification: false;
}

export class OperationalModuleRuntimeContextError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "OperationalModuleRuntimeContextError";
    this.code = code;
  }
}

function normalizeRequiredString(
  value: unknown,
  fieldName: string,
): string {
  if (typeof value !== "string") {
    throw new OperationalModuleRuntimeContextError(
      "AIJC2_MODULE_RUNTIME_REQUIRED_FIELD",
      `${fieldName} must be a string`,
    );
  }

  const normalized = value.trim();

  if (normalized.length === 0) {
    throw new OperationalModuleRuntimeContextError(
      "AIJC2_MODULE_RUNTIME_REQUIRED_FIELD",
      `${fieldName} must not be empty`,
    );
  }

  return normalized;
}

function normalizeOptionalString(
  value: unknown,
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();

  return normalized.length > 0
    ? normalized
    : null;
}

function normalizeRequestedModuleId(
  value: unknown,
): string | null {
  return normalizeOptionalString(value);
}

function isOperationalModuleIdFormat(
  value: string,
): boolean {
  return /^MOD-\d{3,}$/.test(value);
}

function isModuleSelectable(
  module: OperationalModuleDefinition,
): {
  selectable: boolean;
  state:
    | "SELECTED"
    | "MODULE_DISABLED"
    | "MODULE_NOT_ACTIVE";
  reason: string | null;
} {
  if (!module.capabilities.enabled) {
    return {
      selectable: false,
      state: "MODULE_DISABLED",
      reason:
        `Operational module ${module.identity.id} is registered but disabled`,
    };
  }

  if (module.identity.status !== "ACTIVE") {
    return {
      selectable: false,
      state: "MODULE_NOT_ACTIVE",
      reason:
        `Operational module ${module.identity.id} is not ACTIVE`,
    };
  }

  return {
    selectable: true,
    state: "SELECTED",
    reason: null,
  };
}

function buildIdentity(
  request: OperationalModuleRuntimeRequest,
): OperationalModuleRuntimeIdentity {
  return Object.freeze({
    humanIpr:
      normalizeRequiredString(
        request.humanIpr,
        "humanIpr",
      ),

    runtimeIpr:
      normalizeOptionalString(
        request.runtimeIpr,
      ) ??
      DEFAULT_OPERATIONAL_MODULE_RUNTIME_IPR,

    tenant:
      normalizeOptionalString(
        request.tenant,
      ) ??
      DEFAULT_OPERATIONAL_MODULE_TENANT,

    workspace:
      normalizeOptionalString(
        request.workspace,
      ) ??
      DEFAULT_OPERATIONAL_MODULE_WORKSPACE,

    sessionId:
      normalizeRequiredString(
        request.sessionId,
        "sessionId",
      ),
  });
}

function buildContext(
  input: {
    requestedModuleId: string | null;
    state: OperationalModuleSelectionState;
    reason: string | null;
    module: OperationalModuleDefinition | null;
    identity: OperationalModuleRuntimeIdentity;
  },
): OperationalModuleRuntimeContext {
  const failClosed =
    input.state !== "NOT_REQUESTED" &&
    input.state !== "SELECTED";

  return Object.freeze({
    revision:
      OPERATIONAL_MODULE_RUNTIME_CONTEXT_REVISION,

    selection: Object.freeze({
      requestedModuleId:
        input.requestedModuleId,

      state:
        input.state,

      failClosed,

      reason:
        input.reason,
    }),

    module:
      input.module
        ? toOperationalModulePublicProjection(
            input.module,
          )
        : null,

    identity:
      input.identity,

    execution: Object.freeze({
      mode:
        "EXPLICIT_SESSION_CONTEXT",

      /*
       * The current module definitions expose metadata and repository
       * documentation paths, but no runtime-safe prompt payload yet.
       */
      promptInjectionAvailable:
        false,

      promptInjected:
        false,

      persistentMemoryAvailable:
        false,

      automaticRecallAvailable:
        false,

      automaticModuleSelection:
        false,
    }),

    governance: Object.freeze({
      evtRequiredAtExecution:
        true,

      unebdoRegistrationRequiredForUpgrade:
        true,

      opcTechnicalClosureRequiredForVerifiedState:
        true,

      matrixInterpretationRequiredForUpgrade:
        true,

      humanAuthorizationRequired:
        true,

      legalCertification:
        false,
    }),

    legalCertification:
      false,
  });
}

/**
 * Resolves an explicitly requested operational module.
 *
 * No module is selected automatically.
 *
 * An absent moduleId is valid and produces NOT_REQUESTED.
 * An invalid or unavailable module request produces a fail-closed context.
 */
export function resolveOperationalModuleRuntimeContext(
  request: OperationalModuleRuntimeRequest,
): OperationalModuleRuntimeContext {
  const identity =
    buildIdentity(request);

  const requestedModuleId =
    normalizeRequestedModuleId(
      request.moduleId,
    );

  if (!requestedModuleId) {
    return buildContext({
      requestedModuleId:
        null,

      state:
        "NOT_REQUESTED",

      reason:
        null,

      module:
        null,

      identity,
    });
  }

  if (
    !isOperationalModuleIdFormat(
      requestedModuleId,
    )
  ) {
    return buildContext({
      requestedModuleId,

      state:
        "INVALID_MODULE_ID",

      reason:
        "Requested operational module ID does not match MOD-XXX format",

      module:
        null,

      identity,
    });
  }

  const module =
    getModule(requestedModuleId);

  if (!module) {
    return buildContext({
      requestedModuleId,

      state:
        "MODULE_NOT_REGISTERED",

      reason:
        `Operational module is not registered: ${requestedModuleId}`,

      module:
        null,

      identity,
    });
  }

  const selectability =
    isModuleSelectable(module);

  if (!selectability.selectable) {
    return buildContext({
      requestedModuleId,

      state:
        selectability.state,

      reason:
        selectability.reason,

      module,

      identity,
    });
  }

  return buildContext({
    requestedModuleId,

    state:
      "SELECTED",

    reason:
      null,

    module,

    identity,
  });
}

/**
 * Returns true only when a requested module can be executed.
 *
 * NOT_REQUESTED is not considered an error because the existing chat
 * behavior must remain backward compatible.
 */
export function isOperationalModuleExecutionAllowed(
  context: OperationalModuleRuntimeContext,
): boolean {
  return (
    context.selection.state ===
      "NOT_REQUESTED" ||
    context.selection.state ===
      "SELECTED"
  );
}

/**
 * Throws only when a module was requested but cannot be selected.
 */
export function assertOperationalModuleExecutionAllowed(
  context: OperationalModuleRuntimeContext,
): void {
  if (
    isOperationalModuleExecutionAllowed(
      context,
    )
  ) {
    return;
  }

  throw new OperationalModuleRuntimeContextError(
    "AIJC2_OPERATIONAL_MODULE_SELECTION_DENIED",
    context.selection.reason ??
      "Operational module selection denied",
  );
}

/**
 * Safe diagnostic projection for API responses and audit metadata.
 *
 * It deliberately excludes:
 * - prompt contents;
 * - private module instructions;
 * - raw user input;
 * - persistent memory;
 * - internal Registry objects.
 */
export function toOperationalModuleRuntimeProjection(
  context: OperationalModuleRuntimeContext,
): {
  revision: string;
  requestedModuleId: string | null;
  selectionState: OperationalModuleSelectionState;
  selectedModule: OperationalModulePublicProjection | null;
  mode: "EXPLICIT_SESSION_CONTEXT";
  promptInjected: false;
  persistentMemoryAvailable: false;
  automaticRecallAvailable: false;
  failClosed: boolean;
  legalCertification: false;
} {
  return Object.freeze({
    revision:
      context.revision,

    requestedModuleId:
      context.selection.requestedModuleId,

    selectionState:
      context.selection.state,

    selectedModule:
      context.module,

    mode:
      context.execution.mode,

    promptInjected:
      false,

    persistentMemoryAvailable:
      false,

    automaticRecallAvailable:
      false,

    failClosed:
      context.selection.failClosed,

    legalCertification:
      false,
  });
}

export const OPERATIONAL_MODULE_RUNTIME_CONTEXT_BOUNDARY =
  Object.freeze({
    explicitSelectionOnly:
      true,

    automaticSelection:
      false,

    promptFileLoading:
      false,

    promptInjection:
      false,

    persistentMemory:
      false,

    automaticRecall:
      false,

    evtPersistence:
      false,

    unebdoPersistence:
      false,

    opcPersistence:
      false,

    matrixPersistence:
      false,

    routeIntegrated:
      false,

    legalCertification:
      false,

    humanAuthorizationRequired:
      true,
  });
