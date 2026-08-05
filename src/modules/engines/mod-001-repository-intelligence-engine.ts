/**
 * HERMETICUM B.C.E. S.r.l.
 *
 * AI JOKER-C2 Operational Module Library
 * MOD-001 - Repository Intelligence Engine
 *
 * Revision:
 * AIJC2-MOD-001-REPOSITORY-INTELLIGENCE-ENGINE-v1_0
 *
 * Scope:
 * - analyse an explicitly supplied repository snapshot;
 * - classify evidence and findings;
 * - identify missing information;
 * - calculate a deterministic repository posture;
 * - recommend one atomic next mutation;
 * - preserve fail-closed and human-authorization boundaries.
 *
 * Explicit exclusions:
 * - no filesystem access;
 * - no GitHub API access;
 * - no automatic repository crawling;
 * - no code execution;
 * - no commit, push, merge or deploy;
 * - no persistent memory;
 * - no automatic recall;
 * - no legal certification.
 *
 * legalCertification=false
 */

export const MOD_001_ENGINE_REVISION =
  "AIJC2-MOD-001-REPOSITORY-INTELLIGENCE-ENGINE-v1_0" as const;

export const MOD_001_ENGINE_MODULE_ID =
  "MOD-001" as const;

export const MOD_001_ENGINE_VERSION =
  "1.0.0" as const;

export const MOD_001_EPISTEMIC_STATES = [
  "FACT",
  "INFERENCE",
  "HYPOTHESIS",
  "NOT_VERIFIABLE",
] as const;

export type Mod001EpistemicState =
  (typeof MOD_001_EPISTEMIC_STATES)[number];

export const MOD_001_FINDING_SEVERITIES = [
  "INFO",
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
] as const;

export type Mod001FindingSeverity =
  (typeof MOD_001_FINDING_SEVERITIES)[number];

export const MOD_001_FINDING_CATEGORIES = [
  "ARCHITECTURE",
  "BUILD",
  "CODE_QUALITY",
  "DEPENDENCY",
  "DOCUMENTATION",
  "GOVERNANCE",
  "PERSISTENCE",
  "RUNTIME",
  "SECURITY",
  "TESTING",
  "UNKNOWN",
] as const;

export type Mod001FindingCategory =
  (typeof MOD_001_FINDING_CATEGORIES)[number];

export type Mod001RepositoryFileKind =
  | "SOURCE"
  | "TEST"
  | "CONFIG"
  | "DOCUMENTATION"
  | "MIGRATION"
  | "GENERATED"
  | "UNKNOWN";

export interface Mod001RepositoryFileSnapshot {
  /**
   * Repository-relative path.
   *
   * Example:
   * app/api/v1/chat/route.ts
   */
  path: string;

  kind: Mod001RepositoryFileKind;

  /**
   * Optional SHA-256 or Git blob hash supplied by the operator.
   */
  hash?: string | null;

  /**
   * Optional byte size supplied by the operator.
   */
  sizeBytes?: number | null;

  /**
   * Optional content summary.
   *
   * Raw source text is not required by this engine.
   */
  summary?: string | null;

  /**
   * Direct dependencies observed in the file.
   */
  imports?: readonly string[];

  /**
   * Exported symbols observed in the file.
   */
  exports?: readonly string[];

  /**
   * Whether this file was actually inspected.
   */
  inspected: boolean;
}

export interface Mod001RepositoryStackSnapshot {
  languages: readonly string[];
  frameworks: readonly string[];
  runtimes: readonly string[];
  databases: readonly string[];
  packageManagers: readonly string[];
  testFrameworks: readonly string[];
  deploymentTargets: readonly string[];
}

export interface Mod001RepositoryEvidence {
  evidenceId: string;
  sourceType:
    | "FILE"
    | "LOG"
    | "TEST_OUTPUT"
    | "BUILD_OUTPUT"
    | "COMMIT"
    | "DOCUMENTATION"
    | "OPERATOR_DECLARATION";
  sourceRef: string;
  statement: string;
  epistemicState: Mod001EpistemicState;
}

export interface Mod001RepositoryTestSnapshot {
  command: string | null;
  executed: boolean;
  passed: boolean | null;
  totalTests: number | null;
  passedTests: number | null;
  failedTests: number | null;
  outputHash: string | null;
}

export interface Mod001RepositoryBuildSnapshot {
  command: string | null;
  executed: boolean;
  passed: boolean | null;
  outputHash: string | null;
}

export interface Mod001RepositorySnapshot {
  repositoryId: string;
  repositoryName: string;
  branch: string | null;
  commitSha: string | null;
  objective: string | null;

  stack: Mod001RepositoryStackSnapshot;
  files: readonly Mod001RepositoryFileSnapshot[];
  evidence: readonly Mod001RepositoryEvidence[];

  build: Mod001RepositoryBuildSnapshot;
  tests: Mod001RepositoryTestSnapshot;

  /**
   * Files explicitly declared as relevant to the current objective.
   */
  targetFiles: readonly string[];

  /**
   * Known constraints supplied by the operator.
   */
  constraints: readonly string[];

  /**
   * Human authorization is required before proposing implementation.
   */
  humanAuthorization: boolean;

  legalCertification: false;
}

export interface Mod001RepositoryFinding {
  findingId: string;
  title: string;
  category: Mod001FindingCategory;
  severity: Mod001FindingSeverity;
  epistemicState: Mod001EpistemicState;
  description: string;
  evidenceIds: readonly string[];
  affectedFiles: readonly string[];
  recommendedAction: string | null;
}

export interface Mod001AtomicMutationRecommendation {
  allowed: boolean;
  reason: string;

  filePath: string | null;
  responsibility: string | null;
  expectedChange: string | null;

  verification: readonly string[];
  rollback: string | null;

  requiresHumanAuthorization: true;
}

export interface Mod001RepositoryPosture {
  evidenceCoverage: number;
  inspectedFileCoverage: number;
  buildConfidence: number;
  testConfidence: number;
  overallConfidence: number;

  risk:
    | "LOW"
    | "MODERATE"
    | "HIGH"
    | "UNKNOWN";
}

export interface Mod001RepositoryAnalysisResult {
  ok: boolean;

  status:
    | "MOD001_REPOSITORY_ANALYSIS_READY"
    | "MOD001_REPOSITORY_ANALYSIS_FAIL_CLOSED";

  revision: typeof MOD_001_ENGINE_REVISION;
  moduleId: typeof MOD_001_ENGINE_MODULE_ID;
  version: typeof MOD_001_ENGINE_VERSION;

  repository: {
    repositoryId: string;
    repositoryName: string;
    branch: string | null;
    commitSha: string | null;
  };

  objective: {
    supplied: boolean;
    value: string | null;
  };

  posture: Mod001RepositoryPosture;

  findings: readonly Mod001RepositoryFinding[];
  missingEvidence: readonly string[];

  nextMutation: Mod001AtomicMutationRecommendation;

  governance: {
    evtRequiredAfterExecution: true;
    unebdoRegistrationRequiredForUpgrade: true;
    opcClosureRequiresVerificationEvidence: true;
    matrixInterpretationRequired: true;
    humanAuthorizationRequired: true;
    persistentMemoryCreated: false;
    automaticRecallUsed: false;
    legalCertification: false;
  };

  legalCertification: false;
}

export class Mod001RepositoryIntelligenceError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "Mod001RepositoryIntelligenceError";
    this.code = code;
  }
}

function normalizeRequiredString(
  value: unknown,
  fieldName: string,
): string {
  if (typeof value !== "string") {
    throw new Mod001RepositoryIntelligenceError(
      "MOD001_REQUIRED_STRING",
      `${fieldName} must be a string`,
    );
  }

  const normalized = value.trim();

  if (normalized.length === 0) {
    throw new Mod001RepositoryIntelligenceError(
      "MOD001_REQUIRED_STRING",
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

function clampPercentage(
  value: number,
): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(100, Math.round(value)),
  );
}

function calculateInspectedFileCoverage(
  files: readonly Mod001RepositoryFileSnapshot[],
): number {
  if (files.length === 0) {
    return 0;
  }

  const inspected =
    files.filter(
      (file) => file.inspected,
    ).length;

  return clampPercentage(
    (inspected / files.length) * 100,
  );
}

function calculateEvidenceCoverage(
  snapshot: Mod001RepositorySnapshot,
): number {
  const evidenceCount =
    snapshot.evidence.length;

  const targetCount =
    snapshot.targetFiles.length;

  if (
    evidenceCount === 0 &&
    targetCount === 0
  ) {
    return 0;
  }

  const denominator =
    Math.max(1, targetCount);

  return clampPercentage(
    Math.min(
      1,
      evidenceCount / denominator,
    ) * 100,
  );
}

function calculateBuildConfidence(
  build: Mod001RepositoryBuildSnapshot,
): number {
  if (!build.executed) {
    return 0;
  }

  return build.passed
    ? 100
    : 20;
}

function calculateTestConfidence(
  tests: Mod001RepositoryTestSnapshot,
): number {
  if (!tests.executed) {
    return 0;
  }

  if (tests.passed === true) {
    return 100;
  }

  if (
    typeof tests.totalTests === "number" &&
    tests.totalTests > 0 &&
    typeof tests.passedTests === "number"
  ) {
    return clampPercentage(
      (
        tests.passedTests /
        tests.totalTests
      ) * 100,
    );
  }

  return 20;
}

function calculateRepositoryPosture(
  snapshot: Mod001RepositorySnapshot,
): Mod001RepositoryPosture {
  const evidenceCoverage =
    calculateEvidenceCoverage(snapshot);

  const inspectedFileCoverage =
    calculateInspectedFileCoverage(
      snapshot.files,
    );

  const buildConfidence =
    calculateBuildConfidence(
      snapshot.build,
    );

  const testConfidence =
    calculateTestConfidence(
      snapshot.tests,
    );

  const overallConfidence =
    clampPercentage(
      evidenceCoverage * 0.3 +
      inspectedFileCoverage * 0.3 +
      buildConfidence * 0.2 +
      testConfidence * 0.2,
    );

  let risk:
    Mod001RepositoryPosture["risk"];

  if (overallConfidence >= 80) {
    risk = "LOW";
  } else if (overallConfidence >= 55) {
    risk = "MODERATE";
  } else if (overallConfidence > 0) {
    risk = "HIGH";
  } else {
    risk = "UNKNOWN";
  }

  return Object.freeze({
    evidenceCoverage,
    inspectedFileCoverage,
    buildConfidence,
    testConfidence,
    overallConfidence,
    risk,
  });
}

function findDuplicatePaths(
  files: readonly Mod001RepositoryFileSnapshot[],
): string[] {
  const seen =
    new Set<string>();

  const duplicates =
    new Set<string>();

  for (const file of files) {
    const normalized =
      file.path.trim();

    if (seen.has(normalized)) {
      duplicates.add(normalized);
      continue;
    }

    seen.add(normalized);
  }

  return [...duplicates].sort();
}

function findUninspectedTargetFiles(
  snapshot: Mod001RepositorySnapshot,
): string[] {
  const fileByPath =
    new Map(
      snapshot.files.map(
        (file) => [
          file.path.trim(),
          file,
        ],
      ),
    );

  return snapshot.targetFiles
    .map((path) => path.trim())
    .filter((path) => {
      const file =
        fileByPath.get(path);

      return (
        !file ||
        file.inspected !== true
      );
    });
}

function buildFindings(
  snapshot: Mod001RepositorySnapshot,
): Mod001RepositoryFinding[] {
  const findings:
    Mod001RepositoryFinding[] = [];

  if (!normalizeOptionalString(snapshot.objective)) {
    findings.push({
      findingId:
        "MOD001-FINDING-OBJECTIVE-MISSING",

      title:
        "Operational objective is missing",

      category:
        "GOVERNANCE",

      severity:
        "HIGH",

      epistemicState:
        "FACT",

      description:
        "No concrete repository objective was supplied. Implementation should not proceed without a measurable target.",

      evidenceIds:
        [],

      affectedFiles:
        [],

      recommendedAction:
        "Define one concrete technical or product objective before proposing repository mutations.",
    });
  }

  if (snapshot.files.length === 0) {
    findings.push({
      findingId:
        "MOD001-FINDING-NO-FILES",

      title:
        "No repository files supplied",

      category:
        "UNKNOWN",

      severity:
        "CRITICAL",

      epistemicState:
        "FACT",

      description:
        "The repository snapshot contains no files and cannot support architectural or implementation conclusions.",

      evidenceIds:
        [],

      affectedFiles:
        [],

      recommendedAction:
        "Supply the relevant repository tree and inspect the target files.",
    });
  }

  const duplicatePaths =
    findDuplicatePaths(snapshot.files);

  if (duplicatePaths.length > 0) {
    findings.push({
      findingId:
        "MOD001-FINDING-DUPLICATE-PATHS",

      title:
        "Duplicate file paths detected in repository snapshot",

      category:
        "CODE_QUALITY",

      severity:
        "MEDIUM",

      epistemicState:
        "FACT",

      description:
        "The supplied repository snapshot contains repeated file paths, making the analysis ambiguous.",

      evidenceIds:
        [],

      affectedFiles:
        duplicatePaths,

      recommendedAction:
        "Deduplicate the repository snapshot before planning a mutation.",
    });
  }

  const uninspectedTargets =
    findUninspectedTargetFiles(snapshot);

  if (uninspectedTargets.length > 0) {
    findings.push({
      findingId:
        "MOD001-FINDING-TARGETS-NOT-INSPECTED",

      title:
        "Relevant target files were not inspected",

      category:
        "GOVERNANCE",

      severity:
        "HIGH",

      epistemicState:
        "FACT",

      description:
        "One or more files declared relevant to the objective have not been inspected.",

      evidenceIds:
        [],

      affectedFiles:
        uninspectedTargets,

      recommendedAction:
        "Inspect every target file before producing code or a commit recommendation.",
    });
  }

  if (!snapshot.build.executed) {
    findings.push({
      findingId:
        "MOD001-FINDING-BUILD-NOT-EXECUTED",

      title:
        "Build evidence is unavailable",

      category:
        "BUILD",

      severity:
        "MEDIUM",

      epistemicState:
        "NOT_VERIFIABLE",

      description:
        "No build execution was supplied, so repository build integrity cannot be confirmed.",

      evidenceIds:
        [],

      affectedFiles:
        [],

      recommendedAction:
        "Run the canonical build command after the atomic mutation.",
    });
  } else if (snapshot.build.passed === false) {
    findings.push({
      findingId:
        "MOD001-FINDING-BUILD-FAILED",

      title:
        "Repository build is failing",

      category:
        "BUILD",

      severity:
        "CRITICAL",

      epistemicState:
        "FACT",

      description:
        "The supplied build result indicates failure.",

      evidenceIds:
        [],

      affectedFiles:
        [],

      recommendedAction:
        "Resolve the failing build before adding unrelated functionality.",
    });
  }

  if (!snapshot.tests.executed) {
    findings.push({
      findingId:
        "MOD001-FINDING-TESTS-NOT-EXECUTED",

      title:
        "Test evidence is unavailable",

      category:
        "TESTING",

      severity:
        "MEDIUM",

      epistemicState:
        "NOT_VERIFIABLE",

      description:
        "No test execution was supplied, so regression safety cannot be confirmed.",

      evidenceIds:
        [],

      affectedFiles:
        [],

      recommendedAction:
        "Execute the relevant test suite and preserve the output hash.",
    });
  } else if (snapshot.tests.passed === false) {
    findings.push({
      findingId:
        "MOD001-FINDING-TESTS-FAILED",

      title:
        "Repository tests are failing",

      category:
        "TESTING",

      severity:
        "CRITICAL",

      epistemicState:
        "FACT",

      description:
        "The supplied test result indicates at least one failing test.",

      evidenceIds:
        [],

      affectedFiles:
        [],

      recommendedAction:
        "Resolve or explicitly isolate the existing regression before implementing a new mutation.",
    });
  }

  if (snapshot.evidence.length === 0) {
    findings.push({
      findingId:
        "MOD001-FINDING-NO-EVIDENCE",

      title:
        "No repository evidence supplied",

      category:
        "GOVERNANCE",

      severity:
        "HIGH",

      epistemicState:
        "NOT_VERIFIABLE",

      description:
        "No file, log, test, build, commit or documentation evidence was supplied.",

      evidenceIds:
        [],

      affectedFiles:
        [],

      recommendedAction:
        "Supply direct evidence before asserting architecture, defects or completion.",
    });
  }

  return findings;
}

function buildMissingEvidence(
  snapshot: Mod001RepositorySnapshot,
): string[] {
  const missing =
    new Set<string>();

  if (!normalizeOptionalString(snapshot.objective)) {
    missing.add(
      "Concrete and measurable repository objective",
    );
  }

  if (!normalizeOptionalString(snapshot.commitSha)) {
    missing.add(
      "Repository commit SHA",
    );
  }

  if (!normalizeOptionalString(snapshot.branch)) {
    missing.add(
      "Repository branch",
    );
  }

  if (snapshot.files.length === 0) {
    missing.add(
      "Repository file snapshot",
    );
  }

  for (
    const targetFile
    of findUninspectedTargetFiles(snapshot)
  ) {
    missing.add(
      `Inspected target file: ${targetFile}`,
    );
  }

  if (!snapshot.build.executed) {
    missing.add(
      "Build execution evidence",
    );
  }

  if (!snapshot.tests.executed) {
    missing.add(
      "Test execution evidence",
    );
  }

  return [...missing];
}

function isBlockingFinding(
  finding: Mod001RepositoryFinding,
): boolean {
  return (
    finding.severity === "CRITICAL" ||
    (
      finding.severity === "HIGH" &&
      finding.category === "GOVERNANCE"
    )
  );
}

function selectAtomicMutation(
  snapshot: Mod001RepositorySnapshot,
  posture: Mod001RepositoryPosture,
  findings: readonly Mod001RepositoryFinding[],
): Mod001AtomicMutationRecommendation {
  const blockingFinding =
    findings.find(
      isBlockingFinding,
    );

  if (!snapshot.humanAuthorization) {
    return Object.freeze({
      allowed:
        false,

      reason:
        "Human authorization is absent.",

      filePath:
        null,

      responsibility:
        null,

      expectedChange:
        null,

      verification:
        [],

      rollback:
        null,

      requiresHumanAuthorization:
        true,
    });
  }

  if (blockingFinding) {
    return Object.freeze({
      allowed:
        false,

      reason:
        `Fail closed due to blocking finding: ${blockingFinding.title}`,

      filePath:
        null,

      responsibility:
        null,

      expectedChange:
        null,

      verification:
        [],

      rollback:
        null,

      requiresHumanAuthorization:
        true,
    });
  }

  if (posture.overallConfidence < 55) {
    return Object.freeze({
      allowed:
        false,

      reason:
        "Repository confidence is insufficient for an atomic implementation recommendation.",

      filePath:
        null,

      responsibility:
        null,

      expectedChange:
        null,

      verification:
        [],

      rollback:
        null,

      requiresHumanAuthorization:
        true,
    });
  }

  if (snapshot.targetFiles.length !== 1) {
    return Object.freeze({
      allowed:
        false,

      reason:
        "Exactly one target file is required for the next atomic mutation.",

      filePath:
        null,

      responsibility:
        null,

      expectedChange:
        null,

      verification:
        [],

      rollback:
        null,

      requiresHumanAuthorization:
        true,
    });
  }

  const targetFile =
    snapshot.targetFiles[0]?.trim() ??
    null;

  if (!targetFile) {
    return Object.freeze({
      allowed:
        false,

      reason:
        "No valid target file is available.",

      filePath:
        null,

      responsibility:
        null,

      expectedChange:
        null,

      verification:
        [],

      rollback:
        null,

      requiresHumanAuthorization:
        true,
    });
  }

  return Object.freeze({
    allowed:
      true,

    reason:
      "One inspected target file, sufficient evidence and human authorization are available.",

    filePath:
      targetFile,

    responsibility:
      "Implement one isolated change that directly advances the supplied repository objective.",

    expectedChange:
      normalizeOptionalString(
        snapshot.objective,
      ),

    verification: Object.freeze([
      "Review the resulting diff",
      "Run TypeScript type-check",
      "Run the relevant test suite",
      "Run the canonical build",
      "Verify regression-sensitive runtime checks",
    ]),

    rollback:
      "Revert the single atomic commit if verification fails.",

    requiresHumanAuthorization:
      true,
  });
}

function validateSnapshot(
  snapshot: Mod001RepositorySnapshot,
): void {
  normalizeRequiredString(
    snapshot.repositoryId,
    "repositoryId",
  );

  normalizeRequiredString(
    snapshot.repositoryName,
    "repositoryName",
  );

  if (snapshot.legalCertification !== false) {
    throw new Mod001RepositoryIntelligenceError(
      "MOD001_LEGAL_BOUNDARY_VIOLATION",
      "Repository Intelligence requires legalCertification=false",
    );
  }

  for (const file of snapshot.files) {
    normalizeRequiredString(
      file.path,
      "file.path",
    );

    if (
      file.sizeBytes !== null &&
      file.sizeBytes !== undefined &&
      (
        !Number.isInteger(file.sizeBytes) ||
        file.sizeBytes < 0
      )
    ) {
      throw new Mod001RepositoryIntelligenceError(
        "MOD001_INVALID_FILE_SIZE",
        `Invalid file size for ${file.path}`,
      );
    }
  }

  for (
    const evidence
    of snapshot.evidence
  ) {
    normalizeRequiredString(
      evidence.evidenceId,
      "evidence.evidenceId",
    );

    normalizeRequiredString(
      evidence.sourceRef,
      "evidence.sourceRef",
    );

    normalizeRequiredString(
      evidence.statement,
      "evidence.statement",
    );
  }
}

export function analyseRepositorySnapshot(
  snapshot: Mod001RepositorySnapshot,
): Mod001RepositoryAnalysisResult {
  validateSnapshot(snapshot);
  const repositoryScan = scanRepository({
    repositoryId: snapshot.repositoryId,
    repositoryName: snapshot.repositoryName,
    branch: snapshot.branch ?? "UNKNOWN",
    commitSha: snapshot.commitSha ?? "UNKNOWN",
    files: snapshot.files.map((file) => ({
      path: file.path,
      extension: "",
      directory: "",
      sizeBytes: file.sizeBytes ?? 0,
      inspected: file.inspected,
      hash: file.hash ?? undefined,
    })),
  });


  const posture =
    calculateRepositoryPosture(snapshot);

  const findings =
    Object.freeze(
      buildFindings(snapshot),
    );

  const missingEvidence =
    Object.freeze(
      buildMissingEvidence(snapshot),
    );

  const nextMutation =
    selectAtomicMutation(
      snapshot,
      repositoryScanSummary: Object.freeze({
      totalFiles: repositoryScan.statistics.totalFiles,
      directories: repositoryScan.statistics.directories,
      sourceFiles: repositoryScan.statistics.sourceFiles,
      moduleFiles: repositoryScan.statistics.moduleFiles,
      runtimeFiles: repositoryScan.statistics.runtimeFiles,
      testFiles: repositoryScan.statistics.testFiles,
    }),

    posture,
      findings,
    );

  const blockingFinding =
    findings.find(
      isBlockingFinding,
    );

  const ok =
    blockingFinding === undefined &&
    posture.overallConfidence >= 55;

  return Object.freeze({
    ok,

    status:
      ok
        ? "MOD001_REPOSITORY_ANALYSIS_READY"
        : "MOD001_REPOSITORY_ANALYSIS_FAIL_CLOSED",

    revision:
      MOD_001_ENGINE_REVISION,

    moduleId:
      MOD_001_ENGINE_MODULE_ID,

    version:
      MOD_001_ENGINE_VERSION,

    repository: Object.freeze({
      repositoryId:
        snapshot.repositoryId.trim(),

      repositoryName:
        snapshot.repositoryName.trim(),

      branch:
        normalizeOptionalString(
          snapshot.branch,
        ),

      commitSha:
        normalizeOptionalString(
          snapshot.commitSha,
        ),
    }),

    objective: Object.freeze({
      supplied:
        normalizeOptionalString(
          snapshot.objective,
        ) !== null,

      value:
        normalizeOptionalString(
          snapshot.objective,
        ),
    }),

    repositoryScanSummary: Object.freeze({
      totalFiles: repositoryScan.statistics.totalFiles,
      directories: repositoryScan.statistics.directories,
      sourceFiles: repositoryScan.statistics.sourceFiles,
      moduleFiles: repositoryScan.statistics.moduleFiles,
      runtimeFiles: repositoryScan.statistics.runtimeFiles,
      testFiles: repositoryScan.statistics.testFiles,
    }),

    posture,

    findings,

    missingEvidence,

    nextMutation,

    governance: Object.freeze({
      evtRequiredAfterExecution:
        true,

      unebdoRegistrationRequiredForUpgrade:
        true,

      opcClosureRequiresVerificationEvidence:
        true,

      matrixInterpretationRequired:
        true,

      humanAuthorizationRequired:
        true,

      persistentMemoryCreated:
        false,

      automaticRecallUsed:
        false,

      legalCertification:
        false,
    }),

    legalCertification:
      false,
  });
}

export const MOD_001_REPOSITORY_INTELLIGENCE_ENGINE_BOUNDARY =
  Object.freeze({
    explicitSnapshotRequired:
      true,

    repositoryFilesystemAccess:
      false,

    githubApiAccess:
      false,

    automaticRepositoryCrawling:
      false,

    codeExecution:
      false,

    automaticMutation:
      false,

    commitExecution:
      false,

    pushExecution:
      false,

    mergeExecution:
      false,

    deployExecution:
      false,

    persistentMemory:
      false,

    automaticRecall:
      false,

    humanAuthorizationRequired:
      true,

    legalCertification:
      false,
  });
