/**
 * HERMETICUM B.C.E. S.r.l.
 * AI JOKER-C2
 *
 * Governed Integration Validator
 *
 * Deterministic: true
 * Fail Closed: true
 * Human Authorization Required: true
 * Automatic Repository Mutation: false
 * Legal Certification: false
 */

import type {
  IntegrationConstraint,
  IntegrationPlan,
  IntegrationRiskLevel,
  IntegrationTarget,
} from "./integration-types";

export type IntegrationValidationStatus =
  | "VALID"
  | "INVALID"
  | "REVIEW_REQUIRED";

export interface IntegrationValidationIssue {
  readonly code: string;
  readonly message: string;
  readonly path?: string;
}

export interface IntegrationValidationResult {
  readonly status: IntegrationValidationStatus;
  readonly valid: boolean;
  readonly executable: boolean;

  readonly errors: readonly IntegrationValidationIssue[];
  readonly warnings: readonly IntegrationValidationIssue[];
}

const ALLOWED_ACTIONS = Object.freeze([
  "CREATE_FILE",
  "UPDATE_FILE",
  "DELETE_FILE",
  "ADD_EXPORT",
  "ADD_IMPORT",
  "ADD_TEST",
  "UPDATE_TEST",
  "UPDATE_ROUTE",
  "UPDATE_SERVICE",
  "UPDATE_DASHBOARD",
  "UPDATE_DOCUMENTATION",
] as const);

const ALLOWED_RISK_LEVELS = Object.freeze([
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
] as const);

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizePath(path: string): string {
  return path.trim().replaceAll("\\", "/");
}

function isAbsoluteOrUnsafePath(path: string): boolean {
  return (
    path.startsWith("/") ||
    path.startsWith("../") ||
    path.includes("/../") ||
    /^[a-zA-Z]:\//.test(path)
  );
}

function hasDuplicateValues(values: readonly string[]): boolean {
  return new Set(values).size !== values.length;
}

function validateTarget(
  target: IntegrationTarget,
  index: number,
): readonly IntegrationValidationIssue[] {
  const issues: IntegrationValidationIssue[] = [];

  if (!isNonEmptyString(target.path)) {
    issues.push(
      Object.freeze({
        code: "INTEGRATION_TARGET_PATH_REQUIRED",
        message: `Target ${index} does not contain a valid path.`,
      }),
    );

    return Object.freeze(issues);
  }

  const normalizedPath = normalizePath(target.path);

  if (isAbsoluteOrUnsafePath(normalizedPath)) {
    issues.push(
      Object.freeze({
        code: "INTEGRATION_TARGET_PATH_UNSAFE",
        message: "Target path must be repository-relative and traversal-free.",
        path: normalizedPath,
      }),
    );
  }

  if (!ALLOWED_ACTIONS.includes(target.action)) {
    issues.push(
      Object.freeze({
        code: "INTEGRATION_TARGET_ACTION_INVALID",
        message: `Unsupported integration action: ${String(target.action)}.`,
        path: normalizedPath,
      }),
    );
  }

  if (!isNonEmptyString(target.reason)) {
    issues.push(
      Object.freeze({
        code: "INTEGRATION_TARGET_REASON_REQUIRED",
        message: "Every integration target requires an explicit reason.",
        path: normalizedPath,
      }),
    );
  }

  return Object.freeze(issues);
}

function validateConstraint(
  constraint: IntegrationConstraint,
  index: number,
): readonly IntegrationValidationIssue[] {
  const issues: IntegrationValidationIssue[] = [];

  if (!isNonEmptyString(constraint.id)) {
    issues.push(
      Object.freeze({
        code: "INTEGRATION_CONSTRAINT_ID_REQUIRED",
        message: `Constraint ${index} does not contain a valid identifier.`,
      }),
    );
  }

  if (!isNonEmptyString(constraint.description)) {
    issues.push(
      Object.freeze({
        code: "INTEGRATION_CONSTRAINT_DESCRIPTION_REQUIRED",
        message: `Constraint ${index} does not contain a description.`,
      }),
    );
  }

  if (typeof constraint.required !== "boolean") {
    issues.push(
      Object.freeze({
        code: "INTEGRATION_CONSTRAINT_REQUIRED_FLAG_INVALID",
        message: `Constraint ${index} has an invalid required flag.`,
      }),
    );
  }

  return Object.freeze(issues);
}

function validateRiskLevel(
  riskLevel: IntegrationRiskLevel,
): readonly IntegrationValidationIssue[] {
  if (ALLOWED_RISK_LEVELS.includes(riskLevel)) {
    return Object.freeze([]);
  }

  return Object.freeze([
    Object.freeze({
      code: "INTEGRATION_RISK_LEVEL_INVALID",
      message: `Unsupported risk level: ${String(riskLevel)}.`,
    }),
  ]);
}

export function validateIntegrationPlan(
  plan: IntegrationPlan,
): Readonly<IntegrationValidationResult> {
  const errors: IntegrationValidationIssue[] = [];
  const warnings: IntegrationValidationIssue[] = [];

  if (!isNonEmptyString(plan.id)) {
    errors.push(
      Object.freeze({
        code: "INTEGRATION_PLAN_ID_REQUIRED",
        message: "Integration plan identifier is required.",
      }),
    );
  }

  if (!isNonEmptyString(plan.title)) {
    errors.push(
      Object.freeze({
        code: "INTEGRATION_PLAN_TITLE_REQUIRED",
        message: "Integration plan title is required.",
      }),
    );
  }

  if (!isNonEmptyString(plan.objective)) {
    errors.push(
      Object.freeze({
        code: "INTEGRATION_PLAN_OBJECTIVE_REQUIRED",
        message: "Integration plan objective is required.",
      }),
    );
  }

  if (!isNonEmptyString(plan.hypothesis.id)) {
    errors.push(
      Object.freeze({
        code: "INTEGRATION_HYPOTHESIS_ID_REQUIRED",
        message: "Integration hypothesis identifier is required.",
      }),
    );
  }

  if (!isNonEmptyString(plan.hypothesis.description)) {
    errors.push(
      Object.freeze({
        code: "INTEGRATION_HYPOTHESIS_DESCRIPTION_REQUIRED",
        message: "Integration hypothesis description is required.",
      }),
    );
  }

  if (!isNonEmptyString(plan.hypothesis.expectedEffect)) {
    errors.push(
      Object.freeze({
        code: "INTEGRATION_EXPECTED_EFFECT_REQUIRED",
        message: "Integration hypothesis expected effect is required.",
      }),
    );
  }

  if (!Array.isArray(plan.targets) || plan.targets.length === 0) {
    errors.push(
      Object.freeze({
        code: "INTEGRATION_TARGETS_REQUIRED",
        message: "At least one integration target is required.",
      }),
    );
  } else {
    plan.targets.forEach((target, index) => {
      errors.push(...validateTarget(target, index));
    });

    const normalizedPaths = plan.targets.map((target) =>
      normalizePath(target.path),
    );

    if (hasDuplicateValues(normalizedPaths)) {
      errors.push(
        Object.freeze({
          code: "INTEGRATION_TARGET_PATH_DUPLICATE",
          message: "Integration plan contains duplicate target paths.",
        }),
      );
    }
  }

  if (!Array.isArray(plan.constraints)) {
    errors.push(
      Object.freeze({
        code: "INTEGRATION_CONSTRAINTS_INVALID",
        message: "Integration constraints must be an array.",
      }),
    );
  } else {
    plan.constraints.forEach((constraint, index) => {
      errors.push(...validateConstraint(constraint, index));
    });

    const constraintIds = plan.constraints
      .map((constraint) => constraint.id.trim())
      .filter((id) => id.length > 0);

    if (hasDuplicateValues(constraintIds)) {
      errors.push(
        Object.freeze({
          code: "INTEGRATION_CONSTRAINT_ID_DUPLICATE",
          message: "Integration plan contains duplicate constraint identifiers.",
        }),
      );
    }
  }

  errors.push(
    ...validateRiskLevel(plan.expectedImpact.regressionRisk),
  );

  if (
    !Number.isFinite(plan.expectedImpact.capabilityGain) ||
    plan.expectedImpact.capabilityGain < 0
  ) {
    errors.push(
      Object.freeze({
        code: "INTEGRATION_CAPABILITY_GAIN_INVALID",
        message: "Expected capability gain must be a non-negative number.",
      }),
    );
  }

  if (!Number.isFinite(plan.expectedImpact.complexityChange)) {
    errors.push(
      Object.freeze({
        code: "INTEGRATION_COMPLEXITY_CHANGE_INVALID",
        message: "Expected complexity change must be a finite number.",
      }),
    );
  }

  if (plan.humanAuthorizationRequired !== true) {
    errors.push(
      Object.freeze({
        code: "INTEGRATION_HUMAN_AUTHORIZATION_INVARIANT_VIOLATION",
        message: "Human authorization must remain required.",
      }),
    );
  }

  if (
    plan.expectedImpact.regressionRisk === "HIGH" ||
    plan.expectedImpact.regressionRisk === "CRITICAL"
  ) {
    warnings.push(
      Object.freeze({
        code: "INTEGRATION_ELEVATED_REGRESSION_RISK",
        message:
          "The integration requires explicit operator review due to elevated regression risk.",
      }),
    );
  }

  if (!plan.operatorAuthorized) {
    warnings.push(
      Object.freeze({
        code: "INTEGRATION_OPERATOR_AUTHORIZATION_MISSING",
        message: "The integration plan has not been authorized by the operator.",
      }),
    );
  }

  const valid = errors.length === 0;
  const executable = valid && plan.operatorAuthorized;

  let status: IntegrationValidationStatus = "INVALID";

  if (valid && executable) {
    status = "VALID";
  } else if (valid) {
    status = "REVIEW_REQUIRED";
  }

  return Object.freeze({
    status,
    valid,
    executable,
    errors: Object.freeze(errors),
    warnings: Object.freeze(warnings),
  });
}
