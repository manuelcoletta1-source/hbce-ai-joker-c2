import crypto from "crypto";

export type JokerAnchor = {
  algorithm: "SHA-256";
  hash: string;
  timestamp: string;
};

function nowIso(): string {
  return new Date().toISOString();
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();

  return `{${keys
    .map((key) => `${JSON.stringify(key)}:${stableStringify(obj[key])}`)
    .join(",")}}`;
}

export function createAnchor(payload: Record<string, unknown>): JokerAnchor {
  const serialized = stableStringify(payload);
  const hash = crypto.createHash("sha256").update(serialized).digest("hex");

  return {
    algorithm: "SHA-256",
    hash,
    timestamp: nowIso()
  };
}
