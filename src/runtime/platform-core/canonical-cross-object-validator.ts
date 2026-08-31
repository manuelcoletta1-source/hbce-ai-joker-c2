import {
  validatePlatformCoreCanonicalSchema,
} from "./canonical-schema-validator";

export const PLATFORM_CORE_CROSS_OBJECT_VALIDATOR_PROTOCOL =
  "HBCE-PLATFORM-CORE-CANONICAL-CROSS-OBJECT-VALIDATOR-v1" as const;

export const PLATFORM_CORE_CROSS_OBJECT_FULL_RELATION_CHECK_COUNT =
  31 as const;

export const PLATFORM_CORE_CROSS_OBJECT_HASH_BINDING_MODE =
  "DECLARED_PAYLOAD_SHA256_COMMITMENT_EQUALITY" as const;

export const PLATFORM_CORE_CROSS_OBJECT_VALIDATOR_CONTRACT =
  Object.freeze({
    staticCanonicalValidationRequired:
      true,

    exactReferenceBinding:
      true,

    exactVersionBinding:
      true,

    declaredPayloadCommitmentBinding:
      true,

    cryptographicPayloadRecomputation:
      false,

    actionDigestBinding:
      true,

    requestDigestBinding:
      true,

    iospaceBinding:
      true,

    terminalExecutionStateBinding:
      true,

    identityEqualityInference:
      false,

    authorizationConsumptionMutation:
      false,

    replayCounterMutation:
      false,

    temporalNowEvaluation:
      false,

    matrixTransitionValidation:
      false,

    feedbackSourceValidation:
      false,

    feedbackInfluence:
      false,

    evtOpcPersistence:
      false,

    executionSideEffects:
      false,
  } as const);

export type PlatformCoreCrossObjectBundleKey =
  | "mandate"
  | "capability"
  | "authority"
  | "authorization"
  | "execution"
  | "outcome"
  | "consequence";

export interface PlatformCoreCrossObjectBundle {
  readonly mandate?: unknown;
  readonly capability?: unknown;
  readonly authority?: unknown;
  readonly authorization?: unknown;
  readonly execution?: unknown;
  readonly outcome?: unknown;
  readonly consequence?: unknown;
}

export interface PlatformCoreCrossObjectValidationOptions {
  readonly repositoryRoot?:
    string;
}

export type PlatformCoreCrossObjectIssueCode =
  | "HBCE_PLATFORM_CORE_CROSS_OBJECT_INPUT_INVALID"
  | "HBCE_PLATFORM_CORE_CROSS_OBJECT_UNKNOWN_BUNDLE_KEY"
  | "HBCE_PLATFORM_CORE_CROSS_OBJECT_DEPENDENCY_MISSING"
  | "HBCE_PLATFORM_CORE_CROSS_OBJECT_STATIC_INVALID"
  | "HBCE_PLATFORM_CORE_CROSS_OBJECT_VALIDATION_UNAVAILABLE"
  | "HBCE_PLATFORM_CORE_CROSS_OBJECT_RELATION_MISMATCH"
  | "HBCE_PLATFORM_CORE_CROSS_OBJECT_INTERNAL_INVARIANT_FAILED";

export interface PlatformCoreCrossObjectIssue {
  readonly code:
    PlatformCoreCrossObjectIssueCode;

  readonly relation:
    string;

  readonly sourceKind:
    string;

  readonly targetKind:
    string | null;

  readonly field:
    string;
}

export interface PlatformCoreCrossObjectValidationSuccess {
  readonly valid:
    true;

  readonly code:
    null;

  readonly checkedRelations:
    number;

  readonly issues:
    readonly [];
}

export interface PlatformCoreCrossObjectValidationFailure {
  readonly valid:
    false;

  readonly code:
    PlatformCoreCrossObjectIssueCode;

  readonly checkedRelations:
    number;

  readonly issues:
    readonly PlatformCoreCrossObjectIssue[];
}

export type PlatformCoreCrossObjectValidationResult =
  | PlatformCoreCrossObjectValidationSuccess
  | PlatformCoreCrossObjectValidationFailure;

const BUNDLE_KIND_MAP =
  Object.freeze({
    mandate:
      "MANDATE",

    capability:
      "CAPABILITY",

    authority:
      "AUTHORITY",

    authorization:
      "AUTHORIZATION",

    execution:
      "EXECUTION",

    outcome:
      "OUTCOME",

    consequence:
      "CONSEQUENCE",
  } as const);

const BUNDLE_KEYS =
  Object.freeze(
    Object.keys(
      BUNDLE_KIND_MAP,
    ) as PlatformCoreCrossObjectBundleKey[],
  );

function isRecord(
  value:
    unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function hasOwn(
  value:
    Record<string, unknown>,

  key:
    string,
): boolean {
  return Object.prototype.hasOwnProperty.call(
    value,
    key,
  );
}

function freezeIssue(
  issue:
    PlatformCoreCrossObjectIssue,
): PlatformCoreCrossObjectIssue {
  return Object.freeze({
    ...issue,
  });
}

function freezeIssues(
  issues:
    readonly PlatformCoreCrossObjectIssue[],
): readonly PlatformCoreCrossObjectIssue[] {
  return Object.freeze(
    issues.map(
      freezeIssue,
    ),
  );
}

function makeSuccess(
  checkedRelations:
    number,
): PlatformCoreCrossObjectValidationSuccess {
  return Object.freeze({
    valid:
      true,

    code:
      null,

    checkedRelations,

    issues:
      Object.freeze(
        [] as const,
      ),
  });
}

function makeFailure(
  code:
    PlatformCoreCrossObjectIssueCode,

  issues:
    readonly PlatformCoreCrossObjectIssue[],

  checkedRelations:
    number,
): PlatformCoreCrossObjectValidationFailure {
  return Object.freeze({
    valid:
      false,

    code,

    checkedRelations,

    issues:
      freezeIssues(
        issues,
      ),
  });
}

function issue(
  code:
    PlatformCoreCrossObjectIssueCode,

  relation:
    string,

  sourceKind:
    string,

  targetKind:
    string | null,

  field:
    string,
): PlatformCoreCrossObjectIssue {
  return {
    code,
    relation,
    sourceKind,
    targetKind,
    field,
  };
}

function getRecord(
  value:
    unknown,
): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new Error(
      "Validated canonical object is not an object.",
    );
  }

  return value;
}

function getNestedRecord(
  value:
    Record<string, unknown>,

  key:
    string,
): Record<string, unknown> {
  return getRecord(
    value[key],
  );
}

export function validatePlatformCoreCanonicalCrossObjectRelations(
  bundle:
    unknown,

  options:
    PlatformCoreCrossObjectValidationOptions = {},
): PlatformCoreCrossObjectValidationResult {
  if (!isRecord(bundle)) {
    return makeFailure(
      "HBCE_PLATFORM_CORE_CROSS_OBJECT_INPUT_INVALID",

      [
        issue(
          "HBCE_PLATFORM_CORE_CROSS_OBJECT_INPUT_INVALID",
          "BUNDLE_INPUT",
          "BUNDLE",
          null,
          "$",
        ),
      ],

      0,
    );
  }

  const unknownKeys =
    Object.keys(bundle)
      .filter(
        (key) =>
          !(
            BUNDLE_KEYS as readonly string[]
          ).includes(
            key,
          ),
      )
      .sort();

  if (unknownKeys.length > 0) {
    return makeFailure(
      "HBCE_PLATFORM_CORE_CROSS_OBJECT_UNKNOWN_BUNDLE_KEY",

      unknownKeys.map(
        (key) =>
          issue(
            "HBCE_PLATFORM_CORE_CROSS_OBJECT_UNKNOWN_BUNDLE_KEY",
            "BUNDLE_KEY",
            "BUNDLE",
            null,
            key,
          ),
      ),

      0,
    );
  }

  const dependencyIssues:
    PlatformCoreCrossObjectIssue[] = [];

  const requireDependency = (
    source:
      PlatformCoreCrossObjectBundleKey,

    dependency:
      PlatformCoreCrossObjectBundleKey,
  ): void => {
    if (
      hasOwn(
        bundle,
        source,
      ) &&
      !hasOwn(
        bundle,
        dependency,
      )
    ) {
      dependencyIssues.push(
        issue(
          "HBCE_PLATFORM_CORE_CROSS_OBJECT_DEPENDENCY_MISSING",
          `${source.toUpperCase()}_REQUIRES_${dependency.toUpperCase()}`,
          BUNDLE_KIND_MAP[source],
          BUNDLE_KIND_MAP[dependency],
          dependency,
        ),
      );
    }
  };

  requireDependency(
    "authority",
    "mandate",
  );

  requireDependency(
    "authority",
    "capability",
  );

  requireDependency(
    "authorization",
    "authority",
  );

  requireDependency(
    "authorization",
    "mandate",
  );

  requireDependency(
    "authorization",
    "capability",
  );

  requireDependency(
    "execution",
    "authorization",
  );

  requireDependency(
    "outcome",
    "execution",
  );

  requireDependency(
    "consequence",
    "execution",
  );

  if (dependencyIssues.length > 0) {
    return makeFailure(
      "HBCE_PLATFORM_CORE_CROSS_OBJECT_DEPENDENCY_MISSING",
      dependencyIssues,
      0,
    );
  }

  const staticOptions =
    options.repositoryRoot === undefined
      ? undefined
      : {
          repositoryRoot:
            options.repositoryRoot,
        };

  for (
    const key of
    BUNDLE_KEYS
  ) {
    if (
      !hasOwn(
        bundle,
        key,
      )
    ) {
      continue;
    }

    const kind =
      BUNDLE_KIND_MAP[key];

    const result =
      validatePlatformCoreCanonicalSchema(
        kind,
        bundle[key],
        staticOptions,
      );

    if (!result.valid) {
      const mappedCode:
        PlatformCoreCrossObjectIssueCode =
          result.code ===
          "HBCE_PLATFORM_CORE_SCHEMA_STRUCTURAL_INVALID"
            ? "HBCE_PLATFORM_CORE_CROSS_OBJECT_STATIC_INVALID"
            : "HBCE_PLATFORM_CORE_CROSS_OBJECT_VALIDATION_UNAVAILABLE";

      return makeFailure(
        mappedCode,

        [
          issue(
            mappedCode,
            "STATIC_CANONICAL_VALIDATION",
            kind,
            null,
            key,
          ),
        ],

        0,
      );
    }
  }

  try {
    if (
      hasOwn(
        bundle,
        "consequence",
      )
    ) {
      const consequence =
        getRecord(
          bundle.consequence,
        );

      const outcomeBinding =
        consequence[
          "outcome_binding"
        ];

      if (
        outcomeBinding !== null &&
        !hasOwn(
          bundle,
          "outcome",
        )
      ) {
        return makeFailure(
          "HBCE_PLATFORM_CORE_CROSS_OBJECT_DEPENDENCY_MISSING",

          [
            issue(
              "HBCE_PLATFORM_CORE_CROSS_OBJECT_DEPENDENCY_MISSING",
              "CONSEQUENCE_OUTCOME_BINDING_REQUIRES_OUTCOME",
              "CONSEQUENCE",
              "OUTCOME",
              "outcome",
            ),
          ],

          0,
        );
      }
    }

    const relationIssues:
      PlatformCoreCrossObjectIssue[] = [];

    let checkedRelations =
      0;

    const checkEqual = (
      relation:
        string,

      sourceKind:
        string,

      targetKind:
        string,

      field:
        string,

      actual:
        unknown,

      expected:
        unknown,
    ): void => {
      checkedRelations +=
        1;

      if (actual === expected) {
        return;
      }

      relationIssues.push(
        issue(
          "HBCE_PLATFORM_CORE_CROSS_OBJECT_RELATION_MISMATCH",
          relation,
          sourceKind,
          targetKind,
          field,
        ),
      );
    };

    if (
      hasOwn(
        bundle,
        "authority",
      )
    ) {
      const authority =
        getRecord(
          bundle.authority,
        );

      const mandate =
        getRecord(
          bundle.mandate,
        );

      const capability =
        getRecord(
          bundle.capability,
        );

      checkEqual(
        "AUTHORITY_MANDATE_REF",
        "AUTHORITY",
        "MANDATE",
        "mandate_ref",
        authority["mandate_ref"],
        mandate["mandate_id"],
      );

      checkEqual(
        "AUTHORITY_MANDATE_VERSION",
        "AUTHORITY",
        "MANDATE",
        "mandate_version",
        authority["mandate_version"],
        mandate["mandate_version"],
      );

      checkEqual(
        "AUTHORITY_CAPABILITY_REF",
        "AUTHORITY",
        "CAPABILITY",
        "capability_ref",
        authority["capability_ref"],
        capability["capability_id"],
      );

      checkEqual(
        "AUTHORITY_CAPABILITY_VERSION",
        "AUTHORITY",
        "CAPABILITY",
        "capability_version",
        authority["capability_version"],
        capability["capability_version"],
      );
    }

    if (
      hasOwn(
        bundle,
        "authorization",
      )
    ) {
      const authorization =
        getRecord(
          bundle.authorization,
        );

      const authority =
        getRecord(
          bundle.authority,
        );

      const mandate =
        getRecord(
          bundle.mandate,
        );

      const capability =
        getRecord(
          bundle.capability,
        );

      const commitments =
        getNestedRecord(
          authorization,
          "dependency_commitments",
        );

      checkEqual(
        "AUTHORIZATION_AUTHORITY_REF",
        "AUTHORIZATION",
        "AUTHORITY",
        "authority_ref",
        authorization["authority_ref"],
        authority["authority_id"],
      );

      checkEqual(
        "AUTHORIZATION_AUTHORITY_VERSION",
        "AUTHORIZATION",
        "AUTHORITY",
        "authority_version",
        authorization["authority_version"],
        authority["authority_version"],
      );

      checkEqual(
        "AUTHORIZATION_AUTHORITY_HASH",
        "AUTHORIZATION",
        "AUTHORITY",
        "dependency_commitments.authority_sha256",
        commitments[
          "authority_sha256"
        ],
        authority[
          "payload_sha256"
        ],
      );

      checkEqual(
        "AUTHORIZATION_MANDATE_REF",
        "AUTHORIZATION",
        "MANDATE",
        "mandate_ref",
        authorization["mandate_ref"],
        mandate["mandate_id"],
      );

      checkEqual(
        "AUTHORIZATION_MANDATE_VERSION",
        "AUTHORIZATION",
        "MANDATE",
        "mandate_version",
        authorization["mandate_version"],
        mandate["mandate_version"],
      );

      checkEqual(
        "AUTHORIZATION_MANDATE_HASH",
        "AUTHORIZATION",
        "MANDATE",
        "dependency_commitments.mandate_sha256",
        commitments[
          "mandate_sha256"
        ],
        mandate[
          "payload_sha256"
        ],
      );

      checkEqual(
        "AUTHORIZATION_CAPABILITY_REF",
        "AUTHORIZATION",
        "CAPABILITY",
        "capability_ref",
        authorization["capability_ref"],
        capability["capability_id"],
      );

      checkEqual(
        "AUTHORIZATION_CAPABILITY_VERSION",
        "AUTHORIZATION",
        "CAPABILITY",
        "capability_version",
        authorization["capability_version"],
        capability["capability_version"],
      );

      checkEqual(
        "AUTHORIZATION_CAPABILITY_HASH",
        "AUTHORIZATION",
        "CAPABILITY",
        "dependency_commitments.capability_sha256",
        commitments[
          "capability_sha256"
        ],
        capability[
          "payload_sha256"
        ],
      );
    }

    if (
      hasOwn(
        bundle,
        "execution",
      )
    ) {
      const execution =
        getRecord(
          bundle.execution,
        );

      const authorization =
        getRecord(
          bundle.authorization,
        );

      const binding =
        getNestedRecord(
          execution,
          "binding_check",
        );

      const actionBinding =
        getNestedRecord(
          authorization,
          "action_binding",
        );

      checkEqual(
        "EXECUTION_AUTHORIZATION_REF",
        "EXECUTION",
        "AUTHORIZATION",
        "authorization_ref",
        execution["authorization_ref"],
        authorization[
          "authorization_id"
        ],
      );

      checkEqual(
        "EXECUTION_AUTHORIZATION_VERSION",
        "EXECUTION",
        "AUTHORIZATION",
        "authorization_version",
        execution[
          "authorization_version"
        ],
        authorization[
          "authorization_version"
        ],
      );

      checkEqual(
        "EXECUTION_AUTHORIZATION_HASH",
        "EXECUTION",
        "AUTHORIZATION",
        "authorization_sha256",
        execution[
          "authorization_sha256"
        ],
        authorization[
          "payload_sha256"
        ],
      );

      checkEqual(
        "EXECUTION_IOSPACE",
        "EXECUTION",
        "AUTHORIZATION",
        "iospace_ref",
        execution[
          "iospace_ref"
        ],
        authorization[
          "iospace_ref"
        ],
      );

      checkEqual(
        "EXECUTION_AUTHORIZATION_ACTION_COMMITMENT",
        "EXECUTION",
        "AUTHORIZATION",
        "binding_check.authorization_action_sha256",
        binding[
          "authorization_action_sha256"
        ],
        actionBinding[
          "action_sha256"
        ],
      );

      checkEqual(
        "EXECUTION_ACTION_DIGEST_MATCH",
        "EXECUTION",
        "AUTHORIZATION",
        "binding_check.execution_action_sha256",
        binding[
          "execution_action_sha256"
        ],
        actionBinding[
          "action_sha256"
        ],
      );

      checkEqual(
        "EXECUTION_AUTHORIZATION_REQUEST_COMMITMENT",
        "EXECUTION",
        "AUTHORIZATION",
        "binding_check.authorization_request_sha256",
        binding[
          "authorization_request_sha256"
        ],
        actionBinding[
          "request_sha256"
        ],
      );

      checkEqual(
        "EXECUTION_REQUEST_DIGEST_MATCH",
        "EXECUTION",
        "AUTHORIZATION",
        "binding_check.execution_request_sha256",
        binding[
          "execution_request_sha256"
        ],
        actionBinding[
          "request_sha256"
        ],
      );
    }

    if (
      hasOwn(
        bundle,
        "outcome",
      )
    ) {
      const outcome =
        getRecord(
          bundle.outcome,
        );

      const execution =
        getRecord(
          bundle.execution,
        );

      checkEqual(
        "OUTCOME_EXECUTION_REF",
        "OUTCOME",
        "EXECUTION",
        "execution_ref",
        outcome[
          "execution_ref"
        ],
        execution[
          "execution_id"
        ],
      );

      checkEqual(
        "OUTCOME_EXECUTION_VERSION",
        "OUTCOME",
        "EXECUTION",
        "execution_version",
        outcome[
          "execution_version"
        ],
        execution[
          "execution_version"
        ],
      );

      checkEqual(
        "OUTCOME_EXECUTION_HASH",
        "OUTCOME",
        "EXECUTION",
        "execution_sha256",
        outcome[
          "execution_sha256"
        ],
        execution[
          "payload_sha256"
        ],
      );

      checkEqual(
        "OUTCOME_EXECUTION_TERMINAL_STATE",
        "OUTCOME",
        "EXECUTION",
        "execution_terminal_state_observed",
        outcome[
          "execution_terminal_state_observed"
        ],
        execution[
          "state"
        ],
      );
    }

    if (
      hasOwn(
        bundle,
        "consequence",
      )
    ) {
      const consequence =
        getRecord(
          bundle.consequence,
        );

      const execution =
        getRecord(
          bundle.execution,
        );

      checkEqual(
        "CONSEQUENCE_EXECUTION_REF",
        "CONSEQUENCE",
        "EXECUTION",
        "execution_ref",
        consequence[
          "execution_ref"
        ],
        execution[
          "execution_id"
        ],
      );

      checkEqual(
        "CONSEQUENCE_EXECUTION_VERSION",
        "CONSEQUENCE",
        "EXECUTION",
        "execution_version",
        consequence[
          "execution_version"
        ],
        execution[
          "execution_version"
        ],
      );

      checkEqual(
        "CONSEQUENCE_EXECUTION_HASH",
        "CONSEQUENCE",
        "EXECUTION",
        "execution_sha256",
        consequence[
          "execution_sha256"
        ],
        execution[
          "payload_sha256"
        ],
      );

      const outcomeBinding =
        consequence[
          "outcome_binding"
        ];

      if (outcomeBinding !== null) {
        const binding =
          getRecord(
            outcomeBinding,
          );

        const outcome =
          getRecord(
            bundle.outcome,
          );

        checkEqual(
          "CONSEQUENCE_OUTCOME_REF",
          "CONSEQUENCE",
          "OUTCOME",
          "outcome_binding.outcome_ref",
          binding[
            "outcome_ref"
          ],
          outcome[
            "outcome_id"
          ],
        );

        checkEqual(
          "CONSEQUENCE_OUTCOME_VERSION",
          "CONSEQUENCE",
          "OUTCOME",
          "outcome_binding.outcome_version",
          binding[
            "outcome_version"
          ],
          outcome[
            "outcome_version"
          ],
        );

        checkEqual(
          "CONSEQUENCE_OUTCOME_HASH",
          "CONSEQUENCE",
          "OUTCOME",
          "outcome_binding.outcome_sha256",
          binding[
            "outcome_sha256"
          ],
          outcome[
            "payload_sha256"
          ],
        );

      }
    }

    if (relationIssues.length > 0) {
      return makeFailure(
        "HBCE_PLATFORM_CORE_CROSS_OBJECT_RELATION_MISMATCH",
        relationIssues,
        checkedRelations,
      );
    }

    return makeSuccess(
      checkedRelations,
    );
  } catch {
    return makeFailure(
      "HBCE_PLATFORM_CORE_CROSS_OBJECT_INTERNAL_INVARIANT_FAILED",

      [
        issue(
          "HBCE_PLATFORM_CORE_CROSS_OBJECT_INTERNAL_INVARIANT_FAILED",
          "POST_STATIC_RELATION_ACCESS",
          "CORE",
          null,
          "$",
        ),
      ],

      0,
    );
  }
}
