export type RuntimeOperationTone =
  | "PASS"
  | "ACTIVE"
  | "EXECUTED"
  | "READY"
  | "DUE"
  | "REVIEW"
  | "BLOCKED"
  | "FAIL"
  | "UNKNOWN";

export type RuntimeOperationSignal = {
  key: string;
  value: string;
  tone: RuntimeOperationTone;
  source: string;
};

export type RuntimeOperationsProjection = {
  revision: "HBCE-RUNTIME-OPERATIONS-PROJECTION-v1_0";
  operationalStatus:
    | "PASS"
    | "REVIEW_REQUIRED"
    | "BLOCKED"
    | "FAIL_CLOSED";
  signals: RuntimeOperationSignal[];
  summary: {
    totalSignals: number;
    pass: number;
    active: number;
    executed: number;
    ready: number;
    due: number;
    review: number;
    blocked: number;
    failed: number;
    unknown: number;
  };
  governance: {
    failClosed: boolean;
    humanAuthorizationRequired: true;
    autonomousAuthorization: false;
    legalCertification: false;
  };
};

type JsonObject = Record<string, unknown>;

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringifyValue(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint"
  ) {
    return String(value);
  }

  if (value === null) {
    return "null";
  }

  if (value === undefined) {
    return "undefined";
  }

  try {
    return JSON.stringify(value);
  } catch {
    return "[unserializable]";
  }
}

export function classifyRuntimeOperationTone(
  value: string,
): RuntimeOperationTone {
  const normalized = value.toUpperCase();

  if (
    normalized.includes("FAIL") ||
    normalized.includes("ERROR") ||
    normalized.includes("REJECTED")
  ) {
    return "FAIL";
  }

  if (
    normalized.includes("BLOCKED") ||
    normalized.includes("DENIED") ||
    normalized.includes("NO_ACTION")
  ) {
    return "BLOCKED";
  }

  if (
    normalized.includes("REVIEW_REQUIRED") ||
    normalized.includes("REVIEW") ||
    normalized.includes("MANUAL_REQUEST") ||
    normalized.includes("AUTHORIZATION_REQUIRED")
  ) {
    return "REVIEW";
  }

  if (normalized.includes("DUE")) {
    return "DUE";
  }

  if (normalized.includes("EXECUTED")) {
    return "EXECUTED";
  }

  if (
    normalized.includes("PASS") ||
    normalized.includes("VALID") ||
    normalized.includes("VERIFIED")
  ) {
    return "PASS";
  }

  if (
    normalized.includes("ACTIVE") ||
    normalized.includes("ENABLED") ||
    normalized.includes("BOUND")
  ) {
    return "ACTIVE";
  }

  if (
    normalized.includes("READY") ||
    normalized.includes("COMPLETED") ||
    normalized.includes("AVAILABLE")
  ) {
    return "READY";
  }

  return "UNKNOWN";
}

export function collectRuntimeOperationSignals(
  value: unknown,
  source: string,
  prefix = "",
  depth = 0,
): RuntimeOperationSignal[] {
  if (depth > 6) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item, index) =>
      collectRuntimeOperationSignals(
        item,
        source,
        prefix ? `${prefix}.${index}` : String(index),
        depth + 1,
      ),
    );
  }

  if (!isJsonObject(value)) {
    return [];
  }

  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;

    if (
      child === null ||
      typeof child === "string" ||
      typeof child === "number" ||
      typeof child === "boolean"
    ) {
      const text = stringifyValue(child);

      const interestingKey =
        /status|state|decision|mode|action|authorization|execution|operational|verification|legalCertification|runtime|scheduler|runner|cycle|review|ready|due|blocked|result/i.test(
          key,
        );

      const interestingValue =
        /PASS|FAIL|ACTIVE|BLOCKED|READY|DUE|REVIEW|EXECUTED|MANUAL|NO_ACTION|VERIFIED|COMPLETED|DENIED|REQUIRED/i.test(
          text,
        );

      if (!interestingKey && !interestingValue) {
        return [];
      }

      return [
        {
          key: path,
          value: text,
          tone: classifyRuntimeOperationTone(text),
          source,
        },
      ];
    }

    return collectRuntimeOperationSignals(
      child,
      source,
      path,
      depth + 1,
    );
  });
}

function deduplicateSignals(
  signals: RuntimeOperationSignal[],
): RuntimeOperationSignal[] {
  const unique = new Map<string, RuntimeOperationSignal>();

  for (const signal of signals) {
    const key = `${signal.source}:${signal.key}:${signal.value}`;

    if (!unique.has(key)) {
      unique.set(key, signal);
    }
  }

  return Array.from(unique.values());
}

export function buildRuntimeOperationsProjection(input: {
  brain?: unknown;
  scheduler?: unknown;
  sourcesAvailable?: {
    brain: boolean;
    scheduler: boolean;
  };
}): RuntimeOperationsProjection {
  const signals = deduplicateSignals([
    ...collectRuntimeOperationSignals(
      input.brain,
      "Runtime Brain",
    ),
    ...collectRuntimeOperationSignals(
      input.scheduler,
      "Runtime Scheduler",
    ),
  ]);

  const summary = {
    totalSignals: signals.length,
    pass: signals.filter((signal) => signal.tone === "PASS").length,
    active: signals.filter((signal) => signal.tone === "ACTIVE").length,
    executed: signals.filter(
      (signal) => signal.tone === "EXECUTED",
    ).length,
    ready: signals.filter((signal) => signal.tone === "READY").length,
    due: signals.filter((signal) => signal.tone === "DUE").length,
    review: signals.filter((signal) => signal.tone === "REVIEW").length,
    blocked: signals.filter(
      (signal) => signal.tone === "BLOCKED",
    ).length,
    failed: signals.filter((signal) => signal.tone === "FAIL").length,
    unknown: signals.filter(
      (signal) => signal.tone === "UNKNOWN",
    ).length,
  };

  const unavailableSource =
    input.sourcesAvailable !== undefined &&
    (!input.sourcesAvailable.brain ||
      !input.sourcesAvailable.scheduler);

  const failClosed =
    unavailableSource ||
    summary.failed > 0 ||
    summary.blocked > 0;

  let operationalStatus:
    | "PASS"
    | "REVIEW_REQUIRED"
    | "BLOCKED"
    | "FAIL_CLOSED";

  if (unavailableSource || summary.failed > 0) {
    operationalStatus = "FAIL_CLOSED";
  } else if (summary.blocked > 0) {
    operationalStatus = "BLOCKED";
  } else if (summary.review > 0 || summary.due > 0) {
    operationalStatus = "REVIEW_REQUIRED";
  } else {
    operationalStatus = "PASS";
  }

  return {
    revision: "HBCE-RUNTIME-OPERATIONS-PROJECTION-v1_0",

    operationalStatus,

    signals,

    summary,

    governance: {
      failClosed,
      humanAuthorizationRequired: true,
      autonomousAuthorization: false,
      legalCertification: false,
    },
  };
}
