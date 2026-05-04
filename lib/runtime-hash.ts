import { createHash } from "crypto";

export type RuntimeHashAlgorithm = "sha256";

export type RuntimeHashInput =
  | string
  | number
  | boolean
  | null
  | undefined
  | bigint
  | Date
  | RuntimeHashInput[]
  | {
      [key: string]: RuntimeHashInput;
    };

export type RuntimeHashRecord = {
  algorithm: RuntimeHashAlgorithm;
  fullHash: string;
  publicHash: string;
  digest: string;
  publicDigest: string;
  inputBytes: number;
  canonicalLength: number;
};

export type RuntimeHashOptions = {
  publicLength?: number;
  prefix?: RuntimeHashAlgorithm;
};

const DEFAULT_PUBLIC_HASH_LENGTH = 16;
const DEFAULT_ALGORITHM: RuntimeHashAlgorithm = "sha256";

function normalizePublicLength(value?: number): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return DEFAULT_PUBLIC_HASH_LENGTH;
  }

  if (value < 8) {
    return 8;
  }

  if (value > 64) {
    return 64;
  }

  return Math.floor(value);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object") {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);

  return prototype === Object.prototype || prototype === null;
}

function normalizeHashInput(value: unknown): RuntimeHashInput {
  if (value === undefined) {
    return null;
  }

  if (value === null) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      return String(value);
    }

    return value;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "bigint") {
    return value.toString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeHashInput(item));
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack || null
    };
  }

  if (isPlainObject(value)) {
    const output: Record<string, RuntimeHashInput> = {};

    for (const key of Object.keys(value).sort()) {
      const item = value[key];

      if (typeof item === "function" || typeof item === "symbol") {
        continue;
      }

      output[key] = normalizeHashInput(item);
    }

    return output;
  }

  return String(value);
}

export function stableStringify(value: unknown): string {
  return JSON.stringify(normalizeHashInput(value));
}

export function sha256Digest(value: unknown): string {
  const canonical = stableStringify(value);

  return createHash(DEFAULT_ALGORITHM).update(canonical).digest("hex");
}

export function buildRuntimeHash(
  value: unknown,
  options: RuntimeHashOptions = {}
): RuntimeHashRecord {
  const canonical = stableStringify(value);
  const digest = createHash(DEFAULT_ALGORITHM).update(canonical).digest("hex");
  const publicLength = normalizePublicLength(options.publicLength);
  const prefix = options.prefix || DEFAULT_ALGORITHM;
  const publicDigest = digest.slice(0, publicLength);

  return {
    algorithm: DEFAULT_ALGORITHM,
    fullHash: `${prefix}:${digest}`,
    publicHash: `${prefix}:${publicDigest}`,
    digest,
    publicDigest,
    inputBytes: Buffer.byteLength(canonical, "utf8"),
    canonicalLength: canonical.length
  };
}

export function buildFullTraceHash(value: unknown): string {
  return buildRuntimeHash(value).fullHash;
}

export function buildPublicTraceHash(
  value: unknown,
  publicLength = DEFAULT_PUBLIC_HASH_LENGTH
): string {
  return buildRuntimeHash(value, { publicLength }).publicHash;
}

export function buildTraceHash(value: unknown): string {
  return buildPublicTraceHash(value);
}

export function buildProofHash(value: unknown): string {
  return buildFullTraceHash(value);
}

export function shortenHash(hash: string, publicLength = DEFAULT_PUBLIC_HASH_LENGTH): string {
  const length = normalizePublicLength(publicLength);

  if (!hash || typeof hash !== "string") {
    return "";
  }

  const [prefix, digest] = hash.includes(":")
    ? (hash.split(":", 2) as [string, string])
    : [DEFAULT_ALGORITHM, hash];

  if (!digest) {
    return hash.slice(0, length);
  }

  return `${prefix}:${digest.slice(0, length)}`;
}

export function isFullSha256Hash(value: string): boolean {
  return /^sha256:[a-f0-9]{64}$/i.test(value);
}

export function isPublicSha256Hash(value: string): boolean {
  return /^sha256:[a-f0-9]{8,63}$/i.test(value);
}

export function normalizeHashForPublicView(
  value: string | null | undefined,
  publicLength = DEFAULT_PUBLIC_HASH_LENGTH
): string {
  if (!value) {
    return "";
  }

  if (isFullSha256Hash(value)) {
    return shortenHash(value, publicLength);
  }

  return value;
}

export function compareRuntimeHashes(input: {
  expectedFullHash?: string | null;
  expectedPublicHash?: string | null;
  value: unknown;
}): {
  ok: boolean;
  computed: RuntimeHashRecord;
  reason: string;
} {
  const computed = buildRuntimeHash(input.value);

  if (input.expectedFullHash) {
    const ok = computed.fullHash === input.expectedFullHash;

    return {
      ok,
      computed,
      reason: ok
        ? "Full SHA-256 proof hash matches."
        : "Full SHA-256 proof hash mismatch."
    };
  }

  if (input.expectedPublicHash) {
    const ok = computed.publicHash === input.expectedPublicHash;

    return {
      ok,
      computed,
      reason: ok
        ? "Public SHA-256 hash matches."
        : "Public SHA-256 hash mismatch."
    };
  }

  return {
    ok: false,
    computed,
    reason: "No expected hash supplied."
  };
}
