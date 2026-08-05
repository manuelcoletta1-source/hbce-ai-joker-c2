/**
 * HERMETICUM B.C.E. S.r.l.
 *
 * AI JOKER-C2 Operational Module Library
 * Shared Module Types
 *
 * Revision:
 * AIJC2-OPERATIONAL-MODULE-TYPES-v1_0
 *
 * legalCertification=false
 */

export const OPERATIONAL_MODULE_CONTRACT_VERSION = "1.0.0" as const;

export const OPERATIONAL_MODULE_CATEGORIES = [
  "CORE_ENGINEERING",
  "GOVERNANCE",
  "ENGINEERING",
  "RESEARCH",
  "BUSINESS",
  "CUSTOM",
] as const;

export type OperationalModuleCategory =
  (typeof OPERATIONAL_MODULE_CATEGORIES)[number];

export const OPERATIONAL_MODULE_STATUSES = [
  "PROPOSED",
  "DESIGNED",
  "DOCUMENTED",
  "REVIEW",
  "ACTIVE",
  "UPGRADE",
  "SUPERSEDED",
  "ARCHIVED",
] as const;

export type OperationalModuleStatus =
  (typeof OPERATIONAL_MODULE_STATUSES)[number];

export const OPERATIONAL_MODULE_EPISTEMIC_STATES = [
  "FACT",
  "INFERENCE",
  "HYPOTHESIS",
  "NOT_VERIFIABLE",
] as const;

export type OperationalModuleEpistemicState =
  (typeof OPERATIONAL_MODULE_EPISTEMIC_STATES)[number];

export interface OperationalModuleIdentity {
  /**
   * Stable identifier. It must not change across module versions.
   *
   * Example: MOD-001
   */
  id: `MOD-${string}`;

  /**
   * Human-readable module name.
   */
  name: string;

  /**
   * Semantic version.
   *
   * Example: 1.0.0
   */
  version: string;

  category: OperationalModuleCategory;
  status: OperationalModuleStatus;

  description: string;
}

export interface OperationalModuleGovernance {
  /**
   * EVT identifying the module creation or latest verified upgrade.
   */
  evtId: string | null;

  /**
   * UNEBDO append-only temporal registration identifier.
   */
  unebdoEventId: string | null;

  /**
   * OPC technical-state receipt identifier.
   */
  opcId: string | null;

  /**
   * Whether MATRIX interpretation is defined for this module version.
   */
  matrixEnabled: boolean;

  /**
   * OPC is a technical proof receipt only.
   */
  legalCertification: false;

  /**
   * Final decisions remain under human authority.
   */
  humanAuthorizationRequired: true;
}

export interface OperationalModuleResources {
  /**
   * Repository-relative path to the governed module specification.
   */
  specificationPath: string;

  /**
   * Repository-relative path to the shared execution model.
   */
  executionModelPath: string;

  /**
   * Repository-relative path to the shared module contract.
   */
  contractPath: string;

  /**
   * Repository-relative path to the shared lifecycle specification.
   */
  lifecyclePath: string;

  /**
   * Repository-relative path to the shared identity specification.
   */
  identityPath: string;
}

export interface OperationalModuleCapabilities {
  /**
   * Whether the module can be selected by the runtime or UI.
   */
  enabled: boolean;

  /**
   * Whether its prompt can be explicitly inserted into session context.
   */
  sessionContextAvailable: boolean;

  /**
   * Persistent module-training memory is not implied by module existence.
   */
  persistentMemoryAvailable: boolean;

  /**
   * Automatic recall is not implied by module existence.
   */
  automaticRecallAvailable: boolean;

  /**
   * Whether the module has been integrated into the production UI.
   */
  productionUiIntegrated: boolean;

  /**
   * Whether defined behavioral tests have actually been executed.
   */
  behavioralTestsExecuted: boolean;
}

export interface OperationalModuleDefinition {
  identity: OperationalModuleIdentity;
  governance: OperationalModuleGovernance;
  resources: OperationalModuleResources;
  capabilities: OperationalModuleCapabilities;

  /**
   * Contract version implemented by the module.
   */
  contractVersion: typeof OPERATIONAL_MODULE_CONTRACT_VERSION;

  /**
   * Search and grouping tags for UI and runtime discovery.
   */
  tags: readonly string[];
}

export interface OperationalModuleRegistryDocument {
  version: string;
  product: "AI_JOKER_C2_SAAS_CORE_v0_1";
  library: "Operational Module Library";
  legalCertification: false;
  modules: readonly OperationalModuleDefinition[];
}

export interface OperationalModuleListOptions {
  category?: OperationalModuleCategory;
  status?: OperationalModuleStatus;
  enabledOnly?: boolean;
}

export interface OperationalModulePublicProjection {
  id: string;
  name: string;
  version: string;
  category: OperationalModuleCategory;
  status: OperationalModuleStatus;
  description: string;
  enabled: boolean;
  tags: readonly string[];
  legalCertification: false;
}

export class OperationalModuleContractError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "OperationalModuleContractError";
    this.code = code;
  }
}

export function isOperationalModuleCategory(
  value: unknown,
): value is OperationalModuleCategory {
  return (
    typeof value === "string" &&
    OPERATIONAL_MODULE_CATEGORIES.includes(
      value as OperationalModuleCategory,
    )
  );
}

export function isOperationalModuleStatus(
  value: unknown,
): value is OperationalModuleStatus {
  return (
    typeof value === "string" &&
    OPERATIONAL_MODULE_STATUSES.includes(
      value as OperationalModuleStatus,
    )
  );
}

export function isOperationalModuleId(
  value: unknown,
): value is `MOD-${string}` {
  return (
    typeof value === "string" &&
    /^MOD-\d{3,}$/.test(value)
  );
}

export function assertOperationalModuleDefinition(
  module: OperationalModuleDefinition,
): void {
  if (!isOperationalModuleId(module.identity.id)) {
    throw new OperationalModuleContractError(
      "AIJC2_MODULE_INVALID_ID",
      `Invalid operational module ID: ${String(module.identity.id)}`,
    );
  }

  if (module.identity.name.trim().length === 0) {
    throw new OperationalModuleContractError(
      "AIJC2_MODULE_NAME_REQUIRED",
      "Operational module name is required",
    );
  }

  if (!isOperationalModuleCategory(module.identity.category)) {
    throw new OperationalModuleContractError(
      "AIJC2_MODULE_INVALID_CATEGORY",
      `Invalid module category: ${String(module.identity.category)}`,
    );
  }

  if (!isOperationalModuleStatus(module.identity.status)) {
    throw new OperationalModuleContractError(
      "AIJC2_MODULE_INVALID_STATUS",
      `Invalid module status: ${String(module.identity.status)}`,
    );
  }

  if (module.identity.description.trim().length === 0) {
    throw new OperationalModuleContractError(
      "AIJC2_MODULE_DESCRIPTION_REQUIRED",
      "Operational module description is required",
    );
  }

  if (
    module.contractVersion !==
    OPERATIONAL_MODULE_CONTRACT_VERSION
  ) {
    throw new OperationalModuleContractError(
      "AIJC2_MODULE_CONTRACT_VERSION_MISMATCH",
      `Unsupported module contract version: ${module.contractVersion}`,
    );
  }

  if (module.governance.legalCertification !== false) {
    throw new OperationalModuleContractError(
      "AIJC2_MODULE_LEGAL_BOUNDARY_VIOLATION",
      "Operational modules must preserve legalCertification=false",
    );
  }

  if (
    module.governance.humanAuthorizationRequired !== true
  ) {
    throw new OperationalModuleContractError(
      "AIJC2_MODULE_HUMAN_AUTHORITY_REQUIRED",
      "Operational modules require final human authorization",
    );
  }

  const requiredPaths: Array<
    [string, string]
  > = [
    ["specificationPath", module.resources.specificationPath],
    ["executionModelPath", module.resources.executionModelPath],
    ["contractPath", module.resources.contractPath],
    ["lifecyclePath", module.resources.lifecyclePath],
    ["identityPath", module.resources.identityPath],
  ];

  for (const [field, value] of requiredPaths) {
    if (value.trim().length === 0) {
      throw new OperationalModuleContractError(
        "AIJC2_MODULE_RESOURCE_PATH_REQUIRED",
        `${field} is required`,
      );
    }
  }
}

export function toOperationalModulePublicProjection(
  module: OperationalModuleDefinition,
): OperationalModulePublicProjection {
  assertOperationalModuleDefinition(module);

  return Object.freeze({
    id: module.identity.id,
    name: module.identity.name,
    version: module.identity.version,
    category: module.identity.category,
    status: module.identity.status,
    description: module.identity.description,
    enabled: module.capabilities.enabled,
    tags: Object.freeze([...module.tags]),
    legalCertification: false,
  });
}

export const OPERATIONAL_MODULE_TYPES_BOUNDARY =
  Object.freeze({
    registryDefined: false,
    loaderDefined: false,
    runtimeIntegrated: false,
    dashboardIntegrated: false,
    persistentMemoryImplied: false,
    automaticRecallImplied: false,
    legalCertification: false,
    humanAuthorizationRequired: true,
  });
