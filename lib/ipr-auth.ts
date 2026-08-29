import {
  createHash,
  randomBytes,
  scrypt as nodeScrypt,
  timingSafeEqual
} from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(nodeScrypt) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number
) => Promise<Buffer>;

export type IprAuthPasswordAlgorithm = "scrypt-sha256-v1";

export type IprAuthBoundaryMode =
  | "IPR_ACCOUNT_LOGIN"
  | "SESSION_RESTORE"
  | "PASSWORD_SETUP"
  | "PASSWORD_VERIFY"
  | "SESSION_REVOKE";

export type IprAuthPasswordPolicyReport = {
  valid: boolean;
  score: number;
  reasons: string[];
  minLength: number;
  requiresUppercase: boolean;
  requiresLowercase: boolean;
  requiresNumber: boolean;
  requiresSymbol: boolean;
};

export type IprAuthCredentialRecord = {
  humanIpr: string;
  passwordAlgorithm: IprAuthPasswordAlgorithm;
  passwordHash: string;
  passwordSalt: string;
  passwordKeyLength: number;
  createdAt: string;
  updatedAt: string;
  lastVerifiedAt?: string;
};

export type IprAuthSessionToken = {
  sessionId: string;
  humanIpr: string;
  runtimeIpr: string;
  token: string;
  tokenHash: string;
  issuedAt: string;
  expiresAt: string;
  ttlSeconds: number;
};

export type IprAuthCookieSameSite = "lax" | "strict" | "none";

export type IprAuthCookieOptions = {
  httpOnly: true;
  secure: boolean;
  sameSite: IprAuthCookieSameSite;
  path: string;
  maxAge: number;
};

export type IprAuthCookie = {
  name: string;
  value: string;
  options: IprAuthCookieOptions;
};

export type IprAuthSessionCookieInput = {
  token: IprAuthSessionToken;
  secure?: boolean;
  sameSite?: IprAuthCookieSameSite;
  path?: string;
};

export type IprAuthPasswordHashInput = {
  humanIpr: string;
  password: string;
  now?: string;
};

export type IprAuthPasswordVerifyInput = {
  humanIpr: string;
  password: string;
  credential: IprAuthCredentialRecord;
  now?: string;
};

export type IprAuthPasswordVerifyResult = {
  ok: boolean;
  humanIpr: string;
  reason:
    | "PASSWORD_VERIFIED"
    | "INVALID_HUMAN_IPR"
    | "IPR_MISMATCH"
    | "UNSUPPORTED_PASSWORD_ALGORITHM"
    | "INVALID_PASSWORD"
    | "INVALID_CREDENTIAL_RECORD";
  verifiedAt?: string;
};

export type IprAuthSessionTokenInput = {
  humanIpr: string;
  runtimeIpr: string;
  ttlSeconds?: number;
  now?: string;
};

export type IprAuthPublicSession = {
  sessionId: string;
  humanIpr: string;
  runtimeIpr: string;
  issuedAt: string;
  expiresAt: string;
  ttlSeconds: number;
};

export const IPR_AUTH_COOKIE_NAME = "hbce_ipr_session";

export const IPR_AUTH_PASSWORD_ALGORITHM: IprAuthPasswordAlgorithm =
  "scrypt-sha256-v1";

export const IPR_AUTH_PASSWORD_KEY_LENGTH = 64;

export const IPR_AUTH_PASSWORD_SALT_BYTES = 32;

export const IPR_AUTH_SESSION_TOKEN_BYTES = 48;

export const IPR_AUTH_DEFAULT_SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

export const IPR_AUTH_BOUNDARY =
  "IPR authentication verifies access to a governed JOKER-C2 runtime account. It does not issue official public identity, does not replace CIE, SPID, EUDI Wallet, passport, codice fiscale or eIDAS qualified trust services, and does not create legal certification.";

export const IPR_AUTH_PASSWORD_BOUNDARY =
  "Passwords must never be stored in plain text. HBCE stores only salted password hashes and verifies passwords server-side. User-provided IPR or password text is never authoritative by itself.";

export const IPR_AUTH_SESSION_BOUNDARY =
  "JOKER-C2 persistent access must use server-side session validation and HttpOnly cookies. Client-side handoff data alone is transport context, not durable account authentication.";

export const IPR_AUTH_DATABASE_REQUIREMENT =
  "Persistent IPR login requires a database-backed credential store, session store, chat thread store, memory store, EVT/OPC ledger and revocation workflow before production-grade use.";

const HUMAN_IPR_PATTERN = /^IPR-[A-Z0-9]{12,80}$/;

const WEAK_PASSWORD_FRAGMENTS = [
  "password",
  "123456",
  "qwerty",
  "joker",
  "hermeticum",
  "manuel",
  "admin",
  "letmein",
  "accesso",
  "login"
];

function nowIso(input?: string): string {
  return input && input.trim() ? input.trim() : new Date().toISOString();
}

function base64Url(buffer: Buffer): string {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function sha256Hex(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex").toUpperCase();
}

function safeEqualHex(a: string, b: string): boolean {
  const left = Buffer.from(a, "hex");
  const right = Buffer.from(b, "hex");

  if (left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(left, right);
}

function addSeconds(isoDate: string, seconds: number): string {
  const date = new Date(isoDate);
  date.setSeconds(date.getSeconds() + seconds);

  return date.toISOString();
}

export function normalizeHumanIpr(value: string): string {
  return value
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/_/g, "-");
}

export function isValidHumanIpr(value: string): boolean {
  const normalized = normalizeHumanIpr(value);

  return HUMAN_IPR_PATTERN.test(normalized);
}

export function assertValidHumanIpr(value: string): string {
  const normalized = normalizeHumanIpr(value);

  if (!isValidHumanIpr(normalized)) {
    throw new Error("INVALID_HUMAN_IPR");
  }

  return normalized;
}

export function evaluateIprPasswordPolicy(
  password: string
): IprAuthPasswordPolicyReport {
  const minLength = 12;
  const reasons: string[] = [];
  const value = String(password || "");
  const normalized = value.toLowerCase();

  const hasMinLength = value.length >= minLength;
  const hasUppercase = /[A-Z]/.test(value);
  const hasLowercase = /[a-z]/.test(value);
  const hasNumber = /\d/.test(value);
  const hasSymbol = /[^A-Za-z0-9]/.test(value);
  const containsWeakFragment = WEAK_PASSWORD_FRAGMENTS.some((fragment) =>
    normalized.includes(fragment)
  );

  if (!hasMinLength) {
    reasons.push(`Password must be at least ${minLength} characters long.`);
  }

  if (!hasUppercase) {
    reasons.push("Password must include at least one uppercase letter.");
  }

  if (!hasLowercase) {
    reasons.push("Password must include at least one lowercase letter.");
  }

  if (!hasNumber) {
    reasons.push("Password must include at least one number.");
  }

  if (!hasSymbol) {
    reasons.push("Password must include at least one symbol.");
  }

  if (containsWeakFragment) {
    reasons.push("Password contains a weak or project-obvious fragment.");
  }

  const score = [
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSymbol,
    !containsWeakFragment
  ].filter(Boolean).length;

  return {
    valid: reasons.length === 0,
    score,
    reasons,
    minLength,
    requiresUppercase: true,
    requiresLowercase: true,
    requiresNumber: true,
    requiresSymbol: true
  };
}

export async function hashIprPassword(
  input: IprAuthPasswordHashInput
): Promise<IprAuthCredentialRecord> {
  const humanIpr = assertValidHumanIpr(input.humanIpr);
  const policy = evaluateIprPasswordPolicy(input.password);

  if (!policy.valid) {
    throw new Error(`WEAK_IPR_PASSWORD:${policy.reasons.join("|")}`);
  }

  const createdAt = nowIso(input.now);
  const passwordSalt = randomBytes(IPR_AUTH_PASSWORD_SALT_BYTES).toString("hex");
  const key = await scryptAsync(
    input.password,
    passwordSalt,
    IPR_AUTH_PASSWORD_KEY_LENGTH
  );

  return {
    humanIpr,
    passwordAlgorithm: IPR_AUTH_PASSWORD_ALGORITHM,
    passwordHash: key.toString("hex").toUpperCase(),
    passwordSalt,
    passwordKeyLength: IPR_AUTH_PASSWORD_KEY_LENGTH,
    createdAt,
    updatedAt: createdAt
  };
}

export async function verifyIprPassword(
  input: IprAuthPasswordVerifyInput
): Promise<IprAuthPasswordVerifyResult> {
  const humanIpr = normalizeHumanIpr(input.humanIpr);

  if (!isValidHumanIpr(humanIpr)) {
    return {
      ok: false,
      humanIpr,
      reason: "INVALID_HUMAN_IPR"
    };
  }

  if (!input.credential || typeof input.credential !== "object") {
    return {
      ok: false,
      humanIpr,
      reason: "INVALID_CREDENTIAL_RECORD"
    };
  }

  if (normalizeHumanIpr(input.credential.humanIpr) !== humanIpr) {
    return {
      ok: false,
      humanIpr,
      reason: "IPR_MISMATCH"
    };
  }

  if (input.credential.passwordAlgorithm !== IPR_AUTH_PASSWORD_ALGORITHM) {
    return {
      ok: false,
      humanIpr,
      reason: "UNSUPPORTED_PASSWORD_ALGORITHM"
    };
  }

  if (
    !input.credential.passwordHash ||
    !input.credential.passwordSalt ||
    !Number.isFinite(input.credential.passwordKeyLength)
  ) {
    return {
      ok: false,
      humanIpr,
      reason: "INVALID_CREDENTIAL_RECORD"
    };
  }

  const key = await scryptAsync(
    input.password,
    input.credential.passwordSalt,
    input.credential.passwordKeyLength
  );

  const candidateHash = key.toString("hex").toUpperCase();
  const expectedHash = input.credential.passwordHash.toUpperCase();

  if (!safeEqualHex(candidateHash, expectedHash)) {
    return {
      ok: false,
      humanIpr,
      reason: "INVALID_PASSWORD"
    };
  }

  return {
    ok: true,
    humanIpr,
    reason: "PASSWORD_VERIFIED",
    verifiedAt: nowIso(input.now)
  };
}

export function hashIprSessionToken(token: string): string {
  return sha256Hex(`HBCE_IPR_SESSION_TOKEN:${token}`);
}

export function createIprSessionToken(
  input: IprAuthSessionTokenInput
): IprAuthSessionToken {
  const humanIpr = assertValidHumanIpr(input.humanIpr);
  const runtimeIpr = input.runtimeIpr.trim().toUpperCase();

  if (!runtimeIpr) {
    throw new Error("INVALID_RUNTIME_IPR");
  }

  const issuedAt = nowIso(input.now);
  const ttlSeconds =
    typeof input.ttlSeconds === "number" &&
    Number.isFinite(input.ttlSeconds) &&
    input.ttlSeconds > 0
      ? Math.floor(input.ttlSeconds)
      : IPR_AUTH_DEFAULT_SESSION_TTL_SECONDS;

  const token = `IPRSESS_${base64Url(randomBytes(IPR_AUTH_SESSION_TOKEN_BYTES))}`;
  const tokenHash = hashIprSessionToken(token);

  const sessionId = `IPR-SESSION-${sha256Hex(
    `${humanIpr}:${runtimeIpr}:${issuedAt}:${tokenHash}:${randomBytes(16).toString("hex")}`
  ).slice(0, 24)}`;

  return {
    sessionId,
    humanIpr,
    runtimeIpr,
    token,
    tokenHash,
    issuedAt,
    expiresAt: addSeconds(issuedAt, ttlSeconds),
    ttlSeconds
  };
}

export function toPublicIprSession(
  session: IprAuthSessionToken
): IprAuthPublicSession {
  return {
    sessionId: session.sessionId,
    humanIpr: session.humanIpr,
    runtimeIpr: session.runtimeIpr,
    issuedAt: session.issuedAt,
    expiresAt: session.expiresAt,
    ttlSeconds: session.ttlSeconds
  };
}

export function buildIprSessionCookie(
  input: IprAuthSessionCookieInput
): IprAuthCookie {
  return {
    name: IPR_AUTH_COOKIE_NAME,
    value: input.token.token,
    options: {
      httpOnly: true,
      secure: input.secure ?? process.env.NODE_ENV === "production",
      sameSite: input.sameSite ?? "lax",
      path: input.path ?? "/",
      maxAge: input.token.ttlSeconds
    }
  };
}

export function buildExpiredIprSessionCookie(): IprAuthCookie {
  return {
    name: IPR_AUTH_COOKIE_NAME,
    value: "",
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0
    }
  };
}

export function isIprSessionExpired(
  value: Pick<IprAuthSessionToken, "expiresAt">
): boolean {
  return new Date(value.expiresAt).getTime() <= Date.now();
}

export function describeIprAuthBoundary(mode: IprAuthBoundaryMode): string {
  return [
    `Mode: ${mode}.`,
    IPR_AUTH_BOUNDARY,
    IPR_AUTH_PASSWORD_BOUNDARY,
    IPR_AUTH_SESSION_BOUNDARY,
    IPR_AUTH_DATABASE_REQUIREMENT,
    "Authenticated IPR access may restore runtime identity, chat history, IPR-bound memory, EVT/OPC continuity and MATRIX Transformative Memory only after server-side validation."
  ].join(" ");
}
