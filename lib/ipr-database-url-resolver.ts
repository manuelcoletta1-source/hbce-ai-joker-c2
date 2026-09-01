export const HBCE_DATABASE_URL_ENV_KEYS = [
  "POSTGRES_URL",
  "DATABASE_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL_NON_POOLING",
  "NEON_DATABASE_URL",
  "po_POSTGRES_URL",
  "po_DATABASE_URL",
  "po_POSTGRES_PRISMA_URL",
  "po_POSTGRES_URL_NON_POOLING",
  "po_DATABASE_URL_UNPOOLED",
] as const;

export type HbceDatabaseUrlEnvKey =
  (typeof HBCE_DATABASE_URL_ENV_KEYS)[number];

export type HbceDatabaseUrlResolutionStatus =
  | "CONFIGURED"
  | "NOT_CONFIGURED"
  | "INVALID_CONFIGURATION";

export type HbceDatabaseUrlResolution = {
  readonly status:
    HbceDatabaseUrlResolutionStatus;

  readonly configured:
    boolean;

  readonly sourceKey:
    HbceDatabaseUrlEnvKey | null;

  readonly databaseUrl:
    string | null;

  readonly invalidCandidateKeys:
    readonly HbceDatabaseUrlEnvKey[];
};

export type HbceDatabaseUrlResolutionDescription = {
  readonly status:
    HbceDatabaseUrlResolutionStatus;

  readonly configured:
    boolean;

  readonly sourceKey:
    HbceDatabaseUrlEnvKey | null;

  readonly invalidCandidateKeys:
    readonly HbceDatabaseUrlEnvKey[];
};

type HbceDatabaseEnvironment =
  Readonly<
    Record<
      string,
      string | undefined
    >
  >;

function normalizeCandidate(
  value: string | undefined,
): string | null {
  if (
    typeof value !== "string"
  ) {
    return null;
  }

  const normalized =
    value.trim();

  return normalized
    ? normalized
    : null;
}

export function isHbceDirectPostgresDatabaseUrl(
  value: string,
): boolean {
  const candidate =
    value.trim();

  if (!candidate) {
    return false;
  }

  try {
    const parsed =
      new URL(candidate);

    if (
      parsed.protocol !==
        "postgres:" &&
      parsed.protocol !==
        "postgresql:"
    ) {
      return false;
    }

    if (!parsed.hostname) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export function resolveHbceDatabaseUrl(
  environment:
    HbceDatabaseEnvironment =
      process.env,
): HbceDatabaseUrlResolution {
  const invalidCandidateKeys:
    HbceDatabaseUrlEnvKey[] = [];

  for (
    const key
    of HBCE_DATABASE_URL_ENV_KEYS
  ) {
    const candidate =
      normalizeCandidate(
        environment[key],
      );

    if (!candidate) {
      continue;
    }

    if (
      isHbceDirectPostgresDatabaseUrl(
        candidate,
      )
    ) {
      return {
        status:
          "CONFIGURED",

        configured:
          true,

        sourceKey:
          key,

        databaseUrl:
          candidate,

        invalidCandidateKeys:
          Object.freeze(
            [
              ...invalidCandidateKeys,
            ],
          ),
      };
    }

    invalidCandidateKeys.push(
      key,
    );
  }

  if (
    invalidCandidateKeys.length >
    0
  ) {
    return {
      status:
        "INVALID_CONFIGURATION",

      configured:
        false,

      sourceKey:
        null,

      databaseUrl:
        null,

      invalidCandidateKeys:
        Object.freeze(
          [
            ...invalidCandidateKeys,
          ],
        ),
    };
  }

  return {
    status:
      "NOT_CONFIGURED",

    configured:
      false,

    sourceKey:
      null,

    databaseUrl:
      null,

    invalidCandidateKeys:
      Object.freeze([]),
  };
}

export function describeHbceDatabaseUrlResolution(
  environment:
    HbceDatabaseEnvironment =
      process.env,
): HbceDatabaseUrlResolutionDescription {
  const resolution =
    resolveHbceDatabaseUrl(
      environment,
    );

  return {
    status:
      resolution.status,

    configured:
      resolution.configured,

    sourceKey:
      resolution.sourceKey,

    invalidCandidateKeys:
      Object.freeze(
        [
          ...resolution
            .invalidCandidateKeys,
        ],
      ),
  };
}

export function isHbceDatabaseUrlConfigured(
  environment:
    HbceDatabaseEnvironment =
      process.env,
): boolean {
  return resolveHbceDatabaseUrl(
    environment,
  ).configured;
}

export function requireHbceDatabaseUrl(
  environment:
    HbceDatabaseEnvironment =
      process.env,
): string {
  const resolution =
    resolveHbceDatabaseUrl(
      environment,
    );

  if (
    resolution.status ===
      "CONFIGURED" &&
    resolution.databaseUrl
  ) {
    return resolution.databaseUrl;
  }

  if (
    resolution.status ===
    "INVALID_CONFIGURATION"
  ) {
    throw new Error(
      "HBCE_DATABASE_URL_INVALID_CONFIGURATION",
    );
  }

  throw new Error(
    "HBCE_DATABASE_URL_NOT_CONFIGURED",
  );
}
