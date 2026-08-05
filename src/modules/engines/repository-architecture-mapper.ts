/**
 * HERMETICUM B.C.E. S.r.l.
 *
 * AI JOKER-C2
 * MOD-001 Repository Architecture Mapper
 *
 * Revision:
 * AIJC2-MOD001-REPOSITORY-ARCHITECTURE-MAPPER-v1_0
 *
 * Scope:
 * - derive a deterministic architecture map from repository scanner input;
 * - classify directories and files by architectural role;
 * - identify entrypoints, boundaries and possible dependency zones;
 * - expose evidence-based architecture findings;
 * - preserve fail-closed behavior.
 *
 * Explicit exclusions:
 * - no filesystem access;
 * - no GitHub API access;
 * - no source-code execution;
 * - no AST parsing;
 * - no automatic mutation;
 * - no commit, push, merge or deploy;
 * - no persistent memory;
 * - no automatic recall;
 * - legalCertification=false.
 */

import type {
  RepositoryScannerDirectory,
  RepositoryScannerFile,
  RepositoryScannerOutput,
} from "./repository-scanner.types";

export const REPOSITORY_ARCHITECTURE_MAPPER_REVISION =
  "AIJC2-MOD001-REPOSITORY-ARCHITECTURE-MAPPER-v1_0" as const;

export const REPOSITORY_ARCHITECTURE_ROLES = [
  "API",
  "APPLICATION",
  "CONFIGURATION",
  "DOCUMENTATION",
  "ENGINE",
  "GOVERNANCE",
  "MODULE",
  "PERSISTENCE",
  "RUNTIME",
  "SECURITY",
  "TESTING",
  "UI",
  "UNKNOWN",
] as const;

export type RepositoryArchitectureRole =
  (typeof REPOSITORY_ARCHITECTURE_ROLES)[number];

export const REPOSITORY_ARCHITECTURE_NODE_TYPES = [
  "DIRECTORY",
  "FILE",
] as const;

export type RepositoryArchitectureNodeType =
  (typeof REPOSITORY_ARCHITECTURE_NODE_TYPES)[number];

export const REPOSITORY_ARCHITECTURE_FINDING_SEVERITIES = [
  "INFO",
  "LOW",
  "MEDIUM",
  "HIGH",
] as const;

export type RepositoryArchitectureFindingSeverity =
  (typeof REPOSITORY_ARCHITECTURE_FINDING_SEVERITIES)[number];

export interface RepositoryArchitectureNode {
  nodeId: string;
  type: RepositoryArchitectureNodeType;
  path: string;
  role: RepositoryArchitectureRole;
  fileCount: number | null;
  sizeBytes: number | null;
  inspected: boolean | null;
  evidence: readonly string[];
}

export interface RepositoryArchitectureZone {
  zoneId: string;
  role: RepositoryArchitectureRole;
  paths: readonly string[];
  fileCount: number;
  inspectedFileCount: number;
  totalSizeBytes: number;
}

export interface RepositoryArchitectureEntrypoint {
  path: string;
  role: RepositoryArchitectureRole;
  reason: string;
  evidence: readonly string[];
}

export interface RepositoryArchitectureBoundary {
  boundaryId: string;
  sourceRole: RepositoryArchitectureRole;
  targetRole: RepositoryArchitectureRole;
  sourcePaths: readonly string[];
  targetPaths: readonly string[];
  status: "OBSERVED" | "INFERRED";
  description: string;
}

export interface RepositoryArchitectureFinding {
  findingId: string;
  severity: RepositoryArchitectureFindingSeverity;
  title: string;
  description: string;
  affectedPaths: readonly string[];
  evidence: readonly string[];
}

export interface RepositoryArchitectureSummary {
  totalNodes: number;
  directoryNodes: number;
  fileNodes: number;
  identifiedRoles: readonly RepositoryArchitectureRole[];
  entrypointCount: number;
  boundaryCount: number;
  findingCount: number;
  inspectedFileCoverage: number;
}

export interface RepositoryArchitectureMap {
  ok: boolean;

  status:
    | "REPOSITORY_ARCHITECTURE_MAP_READY"
    | "REPOSITORY_ARCHITECTURE_MAP_FAIL_CLOSED";

  revision: typeof REPOSITORY_ARCHITECTURE_MAPPER_REVISION;

  repository: {
    repositoryId: string;
    repositoryName: string;
    branch: string;
    commitSha: string;
  };

  summary: RepositoryArchitectureSummary;

  nodes: readonly RepositoryArchitectureNode[];
  zones: readonly RepositoryArchitectureZone[];
  entrypoints: readonly RepositoryArchitectureEntrypoint[];
  boundaries: readonly RepositoryArchitectureBoundary[];
  findings: readonly RepositoryArchitectureFinding[];

  governance: {
    evidenceBased: true;
    deterministic: true;
    astParsing: false;
    sourceExecution: false;
    humanAuthorizationRequired: true;
    persistentMemoryCreated: false;
    automaticRecallUsed: false;
    legalCertification: false;
  };

  legalCertification: false;
}

export class RepositoryArchitectureMapperError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "RepositoryArchitectureMapperError";
    this.code = code;
  }
}

function normalizePath(value: string): string {
  return value
    .trim()
    .replaceAll("\\", "/")
    .replace(/^\.\/+/, "")
    .replace(/\/{2,}/g, "/")
    .replace(/\/$/, "");
}

function clampPercentage(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(100, Math.round(value)),
  );
}

function classifyPathRole(
  path: string,
): RepositoryArchitectureRole {
  const normalized = normalizePath(path).toLowerCase();

  if (
    normalized.startsWith("app/api/") ||
    normalized.includes("/app/api/") ||
    normalized.startsWith("pages/api/") ||
    normalized.includes("/pages/api/")
  ) {
    return "API";
  }

  if (
    normalized.startsWith("src/runtime/") ||
    normalized.includes("/src/runtime/") ||
    normalized.startsWith("runtime/") ||
    normalized.includes("/runtime/")
  ) {
    return "RUNTIME";
  }

  if (
    normalized.startsWith("src/modules/") ||
    normalized.includes("/src/modules/") ||
    normalized.startsWith("modules/") ||
    normalized.includes("/modules/")
  ) {
    return "MODULE";
  }

  if (
    normalized.includes("/engines/") ||
    normalized.startsWith("src/engines/") ||
    normalized.endsWith("-engine.ts")
  ) {
    return "ENGINE";
  }

  if (
    normalized.includes("/repositories/") ||
    normalized.includes("/persistence/") ||
    normalized.includes("/database/") ||
    normalized.includes("/db/") ||
    normalized.includes("/migrations/")
  ) {
    return "PERSISTENCE";
  }

  if (
    normalized.includes("/security/") ||
    normalized.includes("/auth/") ||
    normalized.includes("api-auth") ||
    normalized.includes("rate-limit")
  ) {
    return "SECURITY";
  }

  if (
    normalized.includes("/__tests__/") ||
    normalized.includes("/tests/") ||
    normalized.includes(".test.") ||
    normalized.includes(".spec.")
  ) {
    return "TESTING";
  }

  if (
    normalized.startsWith("app/") ||
    normalized.startsWith("pages/") ||
    normalized.includes("/components/") ||
    normalized.includes("/ui/")
  ) {
    return "UI";
  }

  if (
    normalized.startsWith("docs/") ||
    normalized.includes("/docs/") ||
    normalized.endsWith(".md") ||
    normalized.endsWith(".mdx")
  ) {
    return "DOCUMENTATION";
  }

  if (
    normalized.startsWith(".github/") ||
    normalized.endsWith(".json") ||
    normalized.endsWith(".yaml") ||
    normalized.endsWith(".yml") ||
    normalized.endsWith(".toml") ||
    normalized.includes("config.")
  ) {
    return "CONFIGURATION";
  }

  if (
    normalized.includes("governance") ||
    normalized.includes("policy") ||
    normalized.includes("opc") ||
    normalized.includes("unebdo") ||
    normalized.includes("matrix") ||
    normalized.includes("ipr")
  ) {
    return "GOVERNANCE";
  }

  if (
    normalized.startsWith("src/") ||
    normalized.startsWith("lib/") ||
    normalized.includes("/src/") ||
    normalized.includes("/lib/")
  ) {
    return "APPLICATION";
  }

  return "UNKNOWN";
}

function buildFileNode(
  file: RepositoryScannerFile,
  index: number,
): RepositoryArchitectureNode {
  const path = normalizePath(file.path);
  const role = classifyPathRole(path);

  return Object.freeze({
    nodeId:
      `ARCH-FILE-${String(index + 1).padStart(4, "0")}`,

    type:
      "FILE",

    path,

    role,

    fileCount:
      null,

    sizeBytes:
      file.sizeBytes,

    inspected:
      file.inspected,

    evidence: Object.freeze([
      `FILE_PATH:${path}`,
      `FILE_EXTENSION:${file.extension || "NONE"}`,
      `FILE_DIRECTORY:${file.directory}`,
      `FILE_INSPECTED:${String(file.inspected)}`,
    ]),
  });
}

function buildDirectoryNode(
  directory: RepositoryScannerDirectory,
  index: number,
): RepositoryArchitectureNode {
  const path = normalizePath(directory.path);
  const role = classifyPathRole(path);

  return Object.freeze({
    nodeId:
      `ARCH-DIR-${String(index + 1).padStart(4, "0")}`,

    type:
      "DIRECTORY",

    path,

    role,

    fileCount:
      directory.fileCount,

    sizeBytes:
      null,

    inspected:
      null,

    evidence: Object.freeze([
      `DIRECTORY_PATH:${path}`,
      `DIRECTORY_FILE_COUNT:${directory.fileCount}`,
    ]),
  });
}

function buildZones(
  fileNodes: readonly RepositoryArchitectureNode[],
): readonly RepositoryArchitectureZone[] {
  const grouped =
    new Map<
      RepositoryArchitectureRole,
      RepositoryArchitectureNode[]
    >();

  for (const node of fileNodes) {
    const current =
      grouped.get(node.role) ?? [];

    current.push(node);
    grouped.set(node.role, current);
  }

  return Object.freeze(
    [...grouped.entries()]
      .sort(([left], [right]) =>
        left.localeCompare(right),
      )
      .map(([role, nodes], index) =>
        Object.freeze({
          zoneId:
            `ARCH-ZONE-${String(index + 1).padStart(3, "0")}`,

          role,

          paths:
            Object.freeze(
              nodes
                .map((node) => node.path)
                .sort(),
            ),

          fileCount:
            nodes.length,

          inspectedFileCount:
            nodes.filter(
              (node) => node.inspected === true,
            ).length,

          totalSizeBytes:
            nodes.reduce(
              (total, node) =>
                total +
                (node.sizeBytes ?? 0),
              0,
            ),
        }),
      ),
  );
}

function detectEntrypoints(
  fileNodes: readonly RepositoryArchitectureNode[],
): readonly RepositoryArchitectureEntrypoint[] {
  const entrypoints:
    RepositoryArchitectureEntrypoint[] = [];

  for (const node of fileNodes) {
    const normalized =
      node.path.toLowerCase();

    if (
      normalized.endsWith("/route.ts") ||
      normalized.endsWith("/route.js")
    ) {
      entrypoints.push({
        path:
          node.path,

        role:
          "API",

        reason:
          "Next.js API route entrypoint detected from canonical route filename.",

        evidence:
          Object.freeze([
            `FILE_PATH:${node.path}`,
            "RULE:ENDS_WITH_ROUTE_TS_OR_JS",
          ]),
      });

      continue;
    }

    if (
      normalized === "src/index.ts" ||
      normalized === "src/main.ts" ||
      normalized === "src/app.ts" ||
      normalized === "app/page.tsx" ||
      normalized === "pages/index.tsx"
    ) {
      entrypoints.push({
        path:
          node.path,

        role:
          node.role,

        reason:
          "Conventional application entrypoint detected.",

        evidence:
          Object.freeze([
            `FILE_PATH:${node.path}`,
            "RULE:CONVENTIONAL_ENTRYPOINT",
          ]),
      });

      continue;
    }

    if (
      normalized.endsWith("/bootstrap.ts") ||
      normalized.endsWith("/index.ts")
    ) {
      entrypoints.push({
        path:
          node.path,

        role:
          node.role,

        reason:
          "Potential composition entrypoint inferred from bootstrap or index filename.",

        evidence:
          Object.freeze([
            `FILE_PATH:${node.path}`,
            "RULE:BOOTSTRAP_OR_INDEX_FILENAME",
          ]),
      });
    }
  }

  return Object.freeze(
    entrypoints
      .sort((left, right) =>
        left.path.localeCompare(right.path),
      )
      .map((entrypoint) =>
        Object.freeze({
          ...entrypoint,
          evidence:
            Object.freeze([
              ...entrypoint.evidence,
            ]),
        }),
      ),
  );
}

function buildBoundaries(
  zones: readonly RepositoryArchitectureZone[],
): readonly RepositoryArchitectureBoundary[] {
  const zoneByRole =
    new Map(
      zones.map((zone) => [
        zone.role,
        zone,
      ]),
    );

  const boundaries:
    RepositoryArchitectureBoundary[] = [];

  const addBoundary = (
    sourceRole: RepositoryArchitectureRole,
    targetRole: RepositoryArchitectureRole,
    description: string,
  ) => {
    const source =
      zoneByRole.get(sourceRole);

    const target =
      zoneByRole.get(targetRole);

    if (!source || !target) {
      return;
    }

    boundaries.push({
      boundaryId:
        `ARCH-BOUNDARY-${String(boundaries.length + 1).padStart(3, "0")}`,

      sourceRole,

      targetRole,

      sourcePaths:
        source.paths,

      targetPaths:
        target.paths,

      status:
        "INFERRED",

      description,
    });
  };

  addBoundary(
    "API",
    "RUNTIME",
    "API routes are expected to delegate governed execution to runtime services.",
  );

  addBoundary(
    "RUNTIME",
    "PERSISTENCE",
    "Runtime components are expected to use repository or persistence abstractions for durable state.",
  );

  addBoundary(
    "MODULE",
    "ENGINE",
    "Operational modules are expected to expose or invoke specialized engine capabilities.",
  );

  addBoundary(
    "API",
    "SECURITY",
    "Public API surfaces are expected to cross authentication, authorization or rate-limiting controls.",
  );

  addBoundary(
    "TESTING",
    "ENGINE",
    "Test files provide verification evidence for engine behavior.",
  );

  return Object.freeze(
    boundaries.map((boundary) =>
      Object.freeze({
        ...boundary,

        sourcePaths:
          Object.freeze([
            ...boundary.sourcePaths,
          ]),

        targetPaths:
          Object.freeze([
            ...boundary.targetPaths,
          ]),
      }),
    ),
  );
}

function buildFindings(
  nodes: readonly RepositoryArchitectureNode[],
  zones: readonly RepositoryArchitectureZone[],
  entrypoints:
    readonly RepositoryArchitectureEntrypoint[],
): readonly RepositoryArchitectureFinding[] {
  const findings:
    RepositoryArchitectureFinding[] = [];

  const unknownNodes =
    nodes.filter(
      (node) =>
        node.role === "UNKNOWN",
    );

  if (unknownNodes.length > 0) {
    findings.push({
      findingId:
        "ARCH-FINDING-UNKNOWN-ROLES",

      severity:
        "LOW",

      title:
        "Unclassified architecture nodes detected",

      description:
        "One or more repository paths could not be mapped to a known architectural role using deterministic path rules.",

      affectedPaths:
        Object.freeze(
          unknownNodes.map(
            (node) => node.path,
          ),
        ),

      evidence:
        Object.freeze([
          `UNKNOWN_NODE_COUNT:${unknownNodes.length}`,
        ]),
    });
  }

  const uninspectedFiles =
    nodes.filter(
      (node) =>
        node.type === "FILE" &&
        node.inspected === false,
    );

  if (uninspectedFiles.length > 0) {
    findings.push({
      findingId:
        "ARCH-FINDING-UNINSPECTED-FILES",

      severity:
        "MEDIUM",

      title:
        "Architecture map contains uninspected files",

      description:
        "Architectural classification is path-based for one or more files whose contents were not inspected.",

      affectedPaths:
        Object.freeze(
          uninspectedFiles.map(
            (node) => node.path,
          ),
        ),

      evidence:
        Object.freeze([
          `UNINSPECTED_FILE_COUNT:${uninspectedFiles.length}`,
        ]),
    });
  }

  if (entrypoints.length === 0) {
    findings.push({
      findingId:
        "ARCH-FINDING-NO-ENTRYPOINT",

      severity:
        "HIGH",

      title:
        "No architecture entrypoint detected",

      description:
        "No conventional route, bootstrap, index or application entrypoint was detected in the supplied repository snapshot.",

      affectedPaths:
        Object.freeze([]),

      evidence:
        Object.freeze([
          "ENTRYPOINT_COUNT:0",
        ]),
    });
  }

  const persistenceZone =
    zones.find(
      (zone) =>
        zone.role === "PERSISTENCE",
    );

  const runtimeZone =
    zones.find(
      (zone) =>
        zone.role === "RUNTIME",
    );

  if (
    runtimeZone &&
    !persistenceZone
  ) {
    findings.push({
      findingId:
        "ARCH-FINDING-RUNTIME-WITHOUT-PERSISTENCE-ZONE",

      severity:
        "MEDIUM",

      title:
        "Runtime zone detected without an explicit persistence zone",

      description:
        "Runtime files exist, but no repository path was classified as persistence, database, migration or repository infrastructure.",

      affectedPaths:
        runtimeZone.paths,

      evidence:
        Object.freeze([
          `RUNTIME_FILE_COUNT:${runtimeZone.fileCount}`,
          "PERSISTENCE_ZONE:ABSENT",
        ]),
    });
  }

  return Object.freeze(
    findings.map((finding) =>
      Object.freeze({
        ...finding,

        affectedPaths:
          Object.freeze([
            ...finding.affectedPaths,
          ]),

        evidence:
          Object.freeze([
            ...finding.evidence,
          ]),
      }),
    ),
  );
}

function calculateInspectedCoverage(
  fileNodes: readonly RepositoryArchitectureNode[],
): number {
  if (fileNodes.length === 0) {
    return 0;
  }

  const inspected =
    fileNodes.filter(
      (node) =>
        node.inspected === true,
    ).length;

  return clampPercentage(
    (inspected / fileNodes.length) * 100,
  );
}

function validateScannerOutput(
  scan: RepositoryScannerOutput,
): void {
  if (
    typeof scan.repositoryId !== "string" ||
    scan.repositoryId.trim().length === 0
  ) {
    throw new RepositoryArchitectureMapperError(
      "ARCHITECTURE_MAPPER_REPOSITORY_ID_REQUIRED",
      "repositoryId is required",
    );
  }

  if (
    typeof scan.repositoryName !== "string" ||
    scan.repositoryName.trim().length === 0
  ) {
    throw new RepositoryArchitectureMapperError(
      "ARCHITECTURE_MAPPER_REPOSITORY_NAME_REQUIRED",
      "repositoryName is required",
    );
  }

  if (!Array.isArray(scan.directories)) {
    throw new RepositoryArchitectureMapperError(
      "ARCHITECTURE_MAPPER_DIRECTORIES_REQUIRED",
      "directories must be an array",
    );
  }

  if (scan.legalCertification !== false) {
    throw new RepositoryArchitectureMapperError(
      "ARCHITECTURE_MAPPER_LEGAL_BOUNDARY_VIOLATION",
      "Repository Architecture Mapper requires legalCertification=false",
    );
  }
}

/**
 * Builds an evidence-based architecture map from scanner output and the
 * canonical normalized file list used to produce that output.
 *
 * Scanner output does not contain the full file list, so both values are
 * required explicitly. This avoids inventing repository structure.
 */
export function mapRepositoryArchitecture(
  scan: RepositoryScannerOutput,
  files: readonly RepositoryScannerFile[],
): RepositoryArchitectureMap {
  validateScannerOutput(scan);

  if (!Array.isArray(files)) {
    throw new RepositoryArchitectureMapperError(
      "ARCHITECTURE_MAPPER_FILES_REQUIRED",
      "files must be an array",
    );
  }

  const fileNodes =
    Object.freeze(
      files
        .map(buildFileNode)
        .sort((left, right) =>
          left.path.localeCompare(right.path),
        ),
    );

  const directoryNodes =
    Object.freeze(
      scan.directories
        .map(buildDirectoryNode)
        .sort((left, right) =>
          left.path.localeCompare(right.path),
        ),
    );

  const nodes =
    Object.freeze([
      ...directoryNodes,
      ...fileNodes,
    ]);

  const zones =
    buildZones(fileNodes);

  const entrypoints =
    detectEntrypoints(fileNodes);

  const boundaries =
    buildBoundaries(zones);

  const findings =
    buildFindings(
      nodes,
      zones,
      entrypoints,
    );

  const identifiedRoles =
    Object.freeze(
      [...new Set(
        nodes.map(
          (node) => node.role,
        ),
      )].sort(),
    );

  const inspectedFileCoverage =
    calculateInspectedCoverage(
      fileNodes,
    );

  const hasBlockingFinding =
    findings.some(
      (finding) =>
        finding.severity === "HIGH",
    );

  return Object.freeze({
    ok:
      !hasBlockingFinding,

    status:
      hasBlockingFinding
        ? "REPOSITORY_ARCHITECTURE_MAP_FAIL_CLOSED"
        : "REPOSITORY_ARCHITECTURE_MAP_READY",

    revision:
      REPOSITORY_ARCHITECTURE_MAPPER_REVISION,

    repository: Object.freeze({
      repositoryId:
        scan.repositoryId.trim(),

      repositoryName:
        scan.repositoryName.trim(),

      branch:
        scan.branch.trim(),

      commitSha:
        scan.commitSha.trim(),
    }),

    summary: Object.freeze({
      totalNodes:
        nodes.length,

      directoryNodes:
        directoryNodes.length,

      fileNodes:
        fileNodes.length,

      identifiedRoles,

      entrypointCount:
        entrypoints.length,

      boundaryCount:
        boundaries.length,

      findingCount:
        findings.length,

      inspectedFileCoverage,
    }),

    nodes,

    zones,

    entrypoints,

    boundaries,

    findings,

    governance: Object.freeze({
      evidenceBased:
        true,

      deterministic:
        true,

      astParsing:
        false,

      sourceExecution:
        false,

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

export const REPOSITORY_ARCHITECTURE_MAPPER_BOUNDARY =
  Object.freeze({
    scannerOutputRequired:
      true,

    explicitFileListRequired:
      true,

    filesystemAccess:
      false,

    githubApiAccess:
      false,

    astParsing:
      false,

    sourceExecution:
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
