import { createHash } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import {
  IPR_AUTH_BOUNDARY,
  IPR_AUTH_COOKIE_NAME,
  IPR_AUTH_DATABASE_REQUIREMENT,
  IPR_AUTH_PASSWORD_BOUNDARY,
  IPR_AUTH_SESSION_BOUNDARY,
  createIprSessionToken,
  evaluateIprPasswordPolicy,
  hashIprPassword,
  normalizeHumanIpr,
  verifyIprPassword
} from "@/lib/ipr-auth";

import {
  describeDefaultIprAuthStore,
  getDefaultIprAuthStore,
  getPublicSessionFromStoredSession
} from "@/lib/ipr-session-store";

import {
  IPR_ACCOUNT_DATABASE_REQUIREMENT,
  IPR_ACCOUNT_PROFILE_BOUNDARY,
  IPR_ACCOUNT_STORE_BOUNDARY,
  describeDefaultIprAccountStore,
  getDefaultIprAccountStore,
  toPublicIprAccountProfile
} from "@/lib/ipr-account-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type JsonRecord = Record<string, unknown>;

type IprLoginMode = "LOGIN" | "SET_PASSWORD";

type MinimalIprHandoffEvaluation =
  | {
      ok: true;
      reason: "IPR_HANDOFF_VALID";
      humanIpr: string;
      entity: string;
      certificateId: string;
      certificateKind: string;
      certificateStatus: string;
      certificateScope: string[];
      cardSerial: string | null;
      certificateHash: string | null;
      accessDecision: string;
      accessScope: string;
      identityBinding: string;
      matrixState: string;
      semanticMemoryScope: string;
      handoffHash: string;
      source: string;
    }
  | {
      ok: false;
      reason:
        | "IPR_HANDOFF_MISSING"
        | "IPR_HANDOFF_SUBJECT_MISMATCH"
        | "IPR_HANDOFF_CERTIFICATE_MISSING"
        | "IPR_HANDOFF_CERTIFICATE_NOT_ACTIVE"
        | "IPR_HANDOFF_SCOPE_MISSING"
        | "IPR_HANDOFF_ACCESS_DENIED"
        | "IPR_HANDOFF_IDENTITY_BINDING_INVALID";
      detail: string;
    };

const DEFAULT_RUNTIME_IPR = "IPR-AI-0001";
const DEFAULT_ACCESS_SCOPE = "JOKER_C2_ACCESS";
const DEFAULT_SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

const ROUTE_BOUNDARY =
  "This route creates and verifies HBCE IPR account access for JOKER-C2. It stores password hashes and session token hashes only. It does not store plaintext passwords, does not issue official identity, does not replace CIE, SPID, EUDI Wallet, passport, codice fiscale or eIDAS qualified trust services, and does not create legal certification.";

function nowIso(): string {
  return new Date().toISOString();
}

function addSeconds(date: Date, seconds: number): Date {
  return new Date(date.getTime() + seconds * 1000);
}

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

async function readJson(req: NextRequest): Promise<JsonRecord> {
  try {
    const value = await req.json();

    return isRecord(value) ? value : {};
  } catch {
    return {};
  }
}

function firstString(
  value: unknown,
  paths: string[][],
  fallback = ""
): string {
  for (const path of paths) {
    let current: unknown = value;

    for (const key of path) {
      if (!isRecord(current)) {
        current = undefined;
        break;
      }

      current = current[key];
    }

    if (typeof current === "string" && current.trim()) {
      return current.trim();
    }
  }

  return fallback;
}

function firstBoolean(
  value: unknown,
  paths: string[][],
  fallback = false
): boolean {
  for (const path of paths) {
    let current: unknown = value;

    for (const key of path) {
      if (!isRecord(current)) {
        current = undefined;
        break;
      }

      current = current[key];
    }

    if (typeof current === "boolean") {
      return current;
    }
  }

  return fallback;
}

function stringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean);
  }

  if (typeof value === "string" && value.trim()) {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeMode(value: unknown): IprLoginMode {
  const candidate =
    typeof value === "string" ? value.trim().toUpperCase() : "";

  return candidate === "SET_PASSWORD" ? "SET_PASSWORD" : "LOGIN";
}

function sha256(input: string): string {
  return `sha256:${createHash("sha256").update(input).digest("hex")}`;
}

function buildUserAgentHash(req: NextRequest): string | null {
  const userAgent = req.headers.get("user-agent");

  if (!userAgent) {
    return null;
  }

  return sha256(userAgent);
}

function buildIpAddressHash(req: NextRequest): string | null {
  const forwardedFor =
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    "";

  const firstIp = forwardedFor
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)[0];

  if (!firstIp) {
    return null;
  }

  return sha256(firstIp);
}

function getRequestOrigin(req: NextRequest): string {
  const origin = req.headers.get("origin");

  if (origin) {
    return origin;
  }

  return req.nextUrl.origin;
}

function buildBoundary() {
  return {
    routeBoundary: ROUTE_BOUNDARY,
    authBoundary: IPR_AUTH_BOUNDARY,
    passwordBoundary: IPR_AUTH_PASSWORD_BOUNDARY,
    sessionBoundary: IPR_AUTH_SESSION_BOUNDARY,
    authDatabaseRequirement: IPR_AUTH_DATABASE_REQUIREMENT,
    accountStoreBoundary: IPR_ACCOUNT_STORE_BOUNDARY,
    accountProfileBoundary: IPR_ACCOUNT_PROFILE_BOUNDARY,
    accountDatabaseRequirement: IPR_ACCOUNT_DATABASE_REQUIREMENT,
    legalCertification: false
  };
}

function buildErrorResponse(
  status: number,
  reason: string,
  detail: string,
  extra: JsonRecord = {}
) {
  return NextResponse.json(
    {
      ok: false,
      authenticated: false,
      reason,
      detail,
      ...extra,
      stores: {
        auth: describeDefaultIprAuthStore(),
        account: describeDefaultIprAccountStore()
      },
      boundary: buildBoundary(),
      legalCertification: false
    },
    { status }
  );
}

function extractPasswordHashResult(value: unknown) {
  const record = isRecord(value) ? value : {};

  const passwordAlgorithm = firstString(
    record,
    [["passwordAlgorithm"], ["algorithm"], ["algo"]],
    "scrypt-sha256-v1"
  );

  const passwordHash = firstString(
    record,
    [["passwordHash"], ["hash"], ["digest"], ["derivedKey"]],
    ""
  );

  const passwordSalt = firstString(
    record,
    [["passwordSalt"], ["salt"]],
    ""
  );

  const passwordKeyLengthRaw =
    isRecord(record) && typeof record.passwordKeyLength === "number"
      ? record.passwordKeyLength
      : isRecord(record) && typeof record.keyLength === "number"
        ? record.keyLength
        : 64;

  const passwordKeyLength =
    Number.isFinite(passwordKeyLengthRaw) && passwordKeyLengthRaw > 0
      ? passwordKeyLengthRaw
      : 64;

  if (!passwordHash || !passwordSalt) {
    throw new Error("IPR_PASSWORD_HASH_RESULT_INVALID");
  }

  return {
    passwordAlgorithm,
    passwordHash,
    passwordSalt,
    passwordKeyLength
  };
}

function normalizePolicyResult(value: unknown) {
  const record = isRecord(value) ? value : {};

  const ok = firstBoolean(
    record,
    [["ok"], ["valid"], ["isValid"], ["passed"]],
    false
  );

  const violations = Array.isArray(record.violations)
    ? record.violations
    : Array.isArray(record.errors)
      ? record.errors
      : Array.isArray(record.reasons)
        ? record.reasons
        : [];

  return {
    ok,
    violations
  };
}

function normalizeVerificationResult(value: unknown): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (isRecord(value)) {
    return firstBoolean(
      value,
      [["ok"], ["valid"], ["verified"], ["match"], ["authenticated"]],
      false
    );
  }

  return false;
}

async function hashNewIprPassword(password: string): Promise<unknown> {
  const hasher = hashIprPassword as unknown as (
    ...args: unknown[]
  ) => Promise<unknown> | unknown;

  const attempts: unknown[][] = [
    [
      {
        password
      }
    ],
    [
      {
        plainPassword: password
      }
    ],
    [
      {
        value: password
      }
    ]
  ];

  let lastError: unknown = null;

  for (const args of attempts) {
    try {
      return await hasher(...args);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("IPR_PASSWORD_HASH_FAILED");
}

async function verifyStoredPassword(
  password: string,
  credential: {
    passwordAlgorithm: string;
    passwordHash: string;
    passwordSalt: string;
    passwordKeyLength: number;
  }
): Promise<boolean> {
  const verifier = verifyIprPassword as unknown as (
    ...args: unknown[]
  ) => Promise<unknown> | unknown;

  const attempts: unknown[][] = [
    [
      password,
      {
        passwordAlgorithm: credential.passwordAlgorithm,
        passwordHash: credential.passwordHash,
        passwordSalt: credential.passwordSalt,
        passwordKeyLength: credential.passwordKeyLength
      }
    ],
    [
      {
        password,
        passwordAlgorithm: credential.passwordAlgorithm,
        passwordHash: credential.passwordHash,
        passwordSalt: credential.passwordSalt,
        passwordKeyLength: credential.passwordKeyLength
      }
    ],
    [
      password,
      credential.passwordHash,
      credential.passwordSalt,
      credential.passwordKeyLength,
      credential.passwordAlgorithm
    ]
  ];

  for (const args of attempts) {
    try {
      const result = await verifier(...args);

      if (normalizeVerificationResult(result)) {
        return true;
      }
    } catch {
      // Try the next supported call shape. Compatibility beats ritual purity.
    }
  }

  return false;
}

function extractRawSessionToken(value: unknown): string {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  if (isRecord(value)) {
    const token = firstString(
      value,
      [["token"], ["sessionToken"], ["rawToken"], ["value"]],
      ""
    );

    if (token) {
      return token;
    }
  }

  throw new Error("IPR_SESSION_TOKEN_VALUE_MISSING");
}

function extractSessionExpiresAt(value: unknown): string {
  if (isRecord(value)) {
    const expiresAt = firstString(
      value,
      [["expiresAt"], ["expires_at"], ["expiration"]],
      ""
    );

    if (expiresAt) {
      return expiresAt;
    }
  }

  return addSeconds(new Date(), DEFAULT_SESSION_TTL_SECONDS).toISOString();
}

function extractSessionMaxAge(value: unknown): number {
  if (isRecord(value)) {
    const candidates = [
      value.maxAgeSeconds,
      value.ttlSeconds,
      value.expiresInSeconds,
      value.maxAge
    ];

    for (const candidate of candidates) {
      if (typeof candidate === "number" && Number.isFinite(candidate)) {
        return candidate;
      }
    }
  }

  return DEFAULT_SESSION_TTL_SECONDS;
}

function createRuntimeSessionToken(input: {
  humanIpr: string;
  runtimeIpr: string;
}) {
  const creator = createIprSessionToken as unknown as (
    ...args: unknown[]
  ) => unknown;

  try {
    return creator(input);
  } catch {
    return creator();
  }
}

function setSessionCookie(
  response: NextResponse,
  rawSessionToken: string,
  sessionTokenPayload: unknown
): void {
  response.cookies.set(IPR_AUTH_COOKIE_NAME, rawSessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: extractSessionMaxAge(sessionTokenPayload)
  });
}

function evaluateMinimalIprHandoff(
  handoff: unknown,
  expectedHumanIpr: string
): MinimalIprHandoffEvaluation {
  if (!isRecord(handoff)) {
    return {
      ok: false,
      reason: "IPR_HANDOFF_MISSING",
      detail:
        "SET_PASSWORD requires a valid HBCE IPR handoff from the onboarding flow."
    };
  }

  const expected = normalizeHumanIpr(expectedHumanIpr);

  const humanIpr = normalizeHumanIpr(
    firstString(
      handoff,
      [
        ["subject", "ipr"],
        ["subjectIpr"],
        ["humanIpr"],
        ["human_ipr"],
        ["ipr"]
      ],
      ""
    )
  );

  if (!humanIpr || humanIpr !== expected) {
    return {
      ok: false,
      reason: "IPR_HANDOFF_SUBJECT_MISMATCH",
      detail:
        "The IPR handoff subject does not match the requested Human IPR."
    };
  }

  const certificateId = firstString(
    handoff,
    [
      ["certificate", "certificate_id"],
      ["certificate", "certificateId"],
      ["certificateId"],
      ["certificate_id"]
    ],
    ""
  );

  if (!certificateId) {
    return {
      ok: false,
      reason: "IPR_HANDOFF_CERTIFICATE_MISSING",
      detail: "The IPR handoff does not contain a certificate ID."
    };
  }

  const certificateStatus = firstString(
    handoff,
    [
      ["certificate", "certificate_status"],
      ["certificate", "certificateStatus"],
      ["certificateStatus"],
      ["certificate_status"]
    ],
    "UNKNOWN"
  ).toUpperCase();

  if (certificateStatus !== "ACTIVE") {
    return {
      ok: false,
      reason: "IPR_HANDOFF_CERTIFICATE_NOT_ACTIVE",
      detail: "The IPR handoff certificate is not ACTIVE."
    };
  }

  const accessScope = firstString(
    handoff,
    [["access", "scope"], ["accessScope"], ["scope"]],
    DEFAULT_ACCESS_SCOPE
  );

  const certificateScope = stringArray(
    isRecord(handoff.certificate)
      ? handoff.certificate.certificate_scope ??
          handoff.certificate.certificateScope
      : undefined
  );

  const hasJokerScope =
    accessScope === DEFAULT_ACCESS_SCOPE ||
    certificateScope.includes(DEFAULT_ACCESS_SCOPE);

  if (!hasJokerScope) {
    return {
      ok: false,
      reason: "IPR_HANDOFF_SCOPE_MISSING",
      detail: "The IPR handoff does not grant JOKER_C2_ACCESS scope."
    };
  }

  const accessDecision = firstString(
    handoff,
    [["access", "decision"], ["accessDecision"], ["decision"]],
    "ACCESS_GRANTED"
  ).toUpperCase();

  if (accessDecision !== "ACCESS_GRANTED") {
    return {
      ok: false,
      reason: "IPR_HANDOFF_ACCESS_DENIED",
      detail: "The IPR handoff does not grant access."
    };
  }

  const identityBinding = firstString(
    handoff,
    [
      ["access", "identity_binding"],
      ["access", "identityBinding"],
      ["identityBinding"],
      ["identity_binding"]
    ],
    "IPR_VERIFIED_BIOLOGICAL_SUBJECT"
  ).toUpperCase();

  if (identityBinding !== "IPR_VERIFIED_BIOLOGICAL_SUBJECT") {
    return {
      ok: false,
      reason: "IPR_HANDOFF_IDENTITY_BINDING_INVALID",
      detail:
        "The IPR handoff does not bind a verified biological subject."
    };
  }

  const entity = firstString(
    handoff,
    [["subject", "entity"], ["entity"], ["name"]],
    "HBCE IPR Subject"
  );

  const certificateKind = firstString(
    handoff,
    [
      ["certificate", "certificate_kind"],
      ["certificate", "certificateKind"],
      ["certificateKind"],
      ["certificate_kind"]
    ],
    "CERTIFICATE_09_OPERATIONAL"
  );

  const cardSerial = firstString(
    handoff,
    [
      ["certificate", "card_serial"],
      ["certificate", "cardSerial"],
      ["cardSerial"],
      ["card_serial"]
    ],
    ""
  );

  const certificateHash = firstString(
    handoff,
    [
      ["certificate", "certificate_hash"],
      ["certificate", "certificateHash"],
      ["certificateHash"],
      ["certificate_hash"]
    ],
    ""
  );

  const matrixState = firstString(
    handoff,
    [["matrix", "state"], ["matrixState"], ["matrix"]],
    "MATRIX_ACTIVE"
  ).toUpperCase();

  const semanticMemoryScope = firstString(
    handoff,
    [
      ["memory", "semantic_memory_scope"],
      ["memory", "semanticMemoryScope"],
      ["semanticMemoryScope"],
      ["semantic_memory_scope"]
    ],
    "IPR_BOUND"
  ).toUpperCase();

  const handoffHash =
    firstString(handoff, [["handoff_hash"], ["handoffHash"], ["hash"]], "") ||
    sha256(JSON.stringify(handoff));

  const source = firstString(handoff, [["source"]], "HBCE_IPR_HANDOFF");

  return {
    ok: true,
    reason: "IPR_HANDOFF_VALID",
    humanIpr,
    entity,
    certificateId,
    certificateKind,
    certificateStatus,
    certificateScope:
      certificateScope.length > 0 ? certificateScope : [DEFAULT_ACCESS_SCOPE],
    cardSerial: cardSerial || null,
    certificateHash: certificateHash || null,
    accessDecision,
    accessScope,
    identityBinding,
    matrixState:
      matrixState === "MATRIX_ACTIVE" ? "MATRIX_ACTIVE" : "MATRIX_LIMITED",
    semanticMemoryScope:
      semanticMemoryScope === "IPR_BOUND" ? "IPR_BOUND" : "RUNTIME_ONLY",
    handoffHash,
    source
  };
}

async function createAuthenticatedSession(input: {
  req: NextRequest;
  humanIpr: string;
  runtimeIpr: string;
  deviceLabel: string;
  sessionPayload: JsonRecord;
}) {
  const authStore = getDefaultIprAuthStore();
  const sessionTokenPayload = createRuntimeSessionToken({
    humanIpr: input.humanIpr,
    runtimeIpr: input.runtimeIpr
  });
  const rawSessionToken = extractRawSessionToken(sessionTokenPayload);
  const expiresAt = extractSessionExpiresAt(sessionTokenPayload);

  const storedSession = await authStore.createSessionAsync({
    token: rawSessionToken,
    humanIpr: input.humanIpr,
    runtimeIpr: input.runtimeIpr,
    expiresAt,
    deviceLabel: input.deviceLabel,
    userAgentHash: buildUserAgentHash(input.req),
    ipAddressHash: buildIpAddressHash(input.req),
    sessionPayload: input.sessionPayload
  });

  return {
    rawSessionToken,
    sessionTokenPayload,
    storedSession
  };
}

async function handleSetPassword(
  req: NextRequest,
  body: JsonRecord,
  humanIpr: string,
  password: string
) {
  const handoff = evaluateMinimalIprHandoff(
    body.iprHandoff || body.handoff || body.ipr_handoff,
    humanIpr
  );

  if (!handoff.ok) {
    return buildErrorResponse(403, handoff.reason, handoff.detail);
  }

  const passwordPolicy = normalizePolicyResult(
    evaluateIprPasswordPolicy(password)
  );

  if (!passwordPolicy.ok) {
    return buildErrorResponse(
      400,
      "IPR_PASSWORD_POLICY_FAILED",
      "The supplied password does not satisfy the HBCE IPR password policy.",
      {
        passwordPolicy
      }
    );
  }

  const authStore = getDefaultIprAuthStore();
  const accountStore = getDefaultIprAccountStore();

  const passwordHash = extractPasswordHashResult(
    await hashNewIprPassword(password)
  );

  await authStore.setCredentialAsync({
    humanIpr,
    passwordAlgorithm: passwordHash.passwordAlgorithm,
    passwordHash: passwordHash.passwordHash,
    passwordSalt: passwordHash.passwordSalt,
    passwordKeyLength: passwordHash.passwordKeyLength,
    credentialPayload: {
      source: "IPR_LOGIN_SET_PASSWORD",
      origin: getRequestOrigin(req),
      createdAt: nowIso(),
      legalCertification: false
    }
  });

  const accountProfile = await accountStore.upsertProfileAsync({
    humanIpr,
    entity: handoff.entity,
    subjectKind: "BIOLOGICAL_SUBJECT",
    certificateId: handoff.certificateId,
    certificateKind: handoff.certificateKind,
    certificateStatus: handoff.certificateStatus,
    certificateScope: handoff.certificateScope,
    cardSerial: handoff.cardSerial,
    certificateHash: handoff.certificateHash,
    accessDecision: handoff.accessDecision,
    accessScope: handoff.accessScope,
    identityBinding: handoff.identityBinding,
    matrixState: handoff.matrixState,
    semanticMemoryScope: handoff.semanticMemoryScope,
    source: handoff.source,
    handoffHash: handoff.handoffHash,
    profilePayload: {
      source: "IPR_LOGIN_SET_PASSWORD",
      origin: getRequestOrigin(req),
      handoffReason: handoff.reason,
      legalCertification: false
    }
  });

  const touchedProfile =
    (await accountStore.touchLoginAsync(humanIpr)) || accountProfile;

  const session = await createAuthenticatedSession({
    req,
    humanIpr,
    runtimeIpr: DEFAULT_RUNTIME_IPR,
    deviceLabel: firstString(
      body,
      [["deviceLabel"], ["device_label"]],
      "JOKER-C2 access device"
    ),
    sessionPayload: {
      mode: "SET_PASSWORD",
      accountId: touchedProfile.accountId,
      profileHash: touchedProfile.profileHash,
      semanticMemoryScope: touchedProfile.semanticMemoryScope,
      matrixState: touchedProfile.matrixState,
      legalCertification: false
    }
  });

  const response = NextResponse.json(
    {
      ok: true,
      authenticated: true,
      mode: "SET_PASSWORD",
      humanIpr,
      runtimeIpr: DEFAULT_RUNTIME_IPR,
      session: getPublicSessionFromStoredSession(session.storedSession),
      accountProfile: toPublicIprAccountProfile(touchedProfile),
      access: {
        decision: "ACCESS_GRANTED",
        scope: touchedProfile.accessScope,
        identityBinding: touchedProfile.identityBinding,
        source: "IPR_ACCOUNT_SESSION_CREATED"
      },
      memory: {
        expectedScope: touchedProfile.semanticMemoryScope,
        expectedAuthority: "SERVER_RUNTIME_VALIDATED",
        persistenceMode: "DATABASE_PERSISTENT"
      },
      matrix: {
        expectedState: touchedProfile.matrixState
      },
      stores: {
        auth: describeDefaultIprAuthStore(),
        account: describeDefaultIprAccountStore()
      },
      boundary: buildBoundary(),
      legalCertification: false
    },
    { status: 200 }
  );

  setSessionCookie(response, session.rawSessionToken, session.sessionTokenPayload);

  return response;
}

async function handleLogin(
  req: NextRequest,
  body: JsonRecord,
  humanIpr: string,
  password: string
) {
  const authStore = getDefaultIprAuthStore();
  const accountStore = getDefaultIprAccountStore();

  const credential = await authStore.getCredentialAsync(humanIpr);

  if (!credential) {
    return buildErrorResponse(
      401,
      "IPR_CREDENTIAL_NOT_FOUND",
      "No HBCE IPR password credential exists for this Human IPR. Run SET_PASSWORD with a valid IPR handoff first."
    );
  }

  const verified = await verifyStoredPassword(password, credential);

  if (!verified) {
    return buildErrorResponse(
      401,
      "IPR_PASSWORD_INVALID",
      "The supplied password does not match the stored HBCE IPR credential."
    );
  }

  const accountProfile = await accountStore.getProfileAsync(humanIpr);

  if (!accountProfile) {
    return buildErrorResponse(
      409,
      "IPR_ACCOUNT_PROFILE_NOT_FOUND",
      "The password credential exists, but the IPR account profile was not found. Run SET_PASSWORD again with a valid HBCE IPR handoff to rebuild the account profile."
    );
  }

  const touchedProfile =
    (await accountStore.touchLoginAsync(humanIpr)) || accountProfile;

  const session = await createAuthenticatedSession({
    req,
    humanIpr,
    runtimeIpr: DEFAULT_RUNTIME_IPR,
    deviceLabel: firstString(
      body,
      [["deviceLabel"], ["device_label"]],
      "JOKER-C2 access device"
    ),
    sessionPayload: {
      mode: "LOGIN",
      accountId: touchedProfile.accountId,
      profileHash: touchedProfile.profileHash,
      semanticMemoryScope: touchedProfile.semanticMemoryScope,
      matrixState: touchedProfile.matrixState,
      legalCertification: false
    }
  });

  const response = NextResponse.json(
    {
      ok: true,
      authenticated: true,
      mode: "LOGIN",
      humanIpr,
      runtimeIpr: DEFAULT_RUNTIME_IPR,
      session: getPublicSessionFromStoredSession(session.storedSession),
      accountProfile: toPublicIprAccountProfile(touchedProfile),
      access: {
        decision: "ACCESS_GRANTED",
        scope: touchedProfile.accessScope,
        identityBinding: touchedProfile.identityBinding,
        source: "IPR_ACCOUNT_SESSION_CREATED"
      },
      memory: {
        expectedScope: touchedProfile.semanticMemoryScope,
        expectedAuthority: "SERVER_RUNTIME_VALIDATED",
        persistenceMode: "DATABASE_PERSISTENT"
      },
      matrix: {
        expectedState: touchedProfile.matrixState
      },
      stores: {
        auth: describeDefaultIprAuthStore(),
        account: describeDefaultIprAccountStore()
      },
      boundary: buildBoundary(),
      legalCertification: false
    },
    { status: 200 }
  );

  setSessionCookie(response, session.rawSessionToken, session.sessionTokenPayload);

  return response;
}

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      route: "/api/auth/ipr-login",
      runtime: "nodejs",
      modes: ["SET_PASSWORD", "LOGIN"],
      cookieName: IPR_AUTH_COOKIE_NAME,
      authStore: describeDefaultIprAuthStore(),
      accountStore: describeDefaultIprAccountStore(),
      flow: {
        setPassword:
          "Human IPR + password + valid HBCE IPR handoff creates credential, persistent account profile and server-side IPR session.",
        login:
          "Human IPR + password verifies persistent credential and creates server-side IPR session cookie."
      },
      boundary: buildBoundary(),
      legalCertification: false
    },
    { status: 200 }
  );
}

export async function POST(req: NextRequest) {
  const body = await readJson(req);
  const mode = normalizeMode(body.mode);
  const humanIprRaw = firstString(
    body,
    [["humanIpr"], ["human_ipr"], ["ipr"], ["subjectIpr"], ["subject_ipr"]],
    ""
  );
  const password = firstString(
    body,
    [["password"], ["iprPassword"], ["ipr_password"]],
    ""
  );

  if (!humanIprRaw) {
    return buildErrorResponse(
      400,
      "HUMAN_IPR_MISSING",
      "Human IPR is required."
    );
  }

  const humanIpr = normalizeHumanIpr(humanIprRaw);

  if (!humanIpr || !humanIpr.startsWith("IPR-")) {
    return buildErrorResponse(
      400,
      "HUMAN_IPR_INVALID",
      "Human IPR must use the IPR-* format."
    );
  }

  if (!password) {
    return buildErrorResponse(
      400,
      "IPR_PASSWORD_MISSING",
      "IPR account password is required."
    );
  }

  try {
    if (mode === "SET_PASSWORD") {
      return await handleSetPassword(req, body, humanIpr, password);
    }

    return await handleLogin(req, body, humanIpr, password);
  } catch (error) {
    return buildErrorResponse(
      500,
      "IPR_LOGIN_ROUTE_EXCEPTION",
      error instanceof Error
        ? error.message
        : "Unknown IPR login route error."
    );
  }
}
