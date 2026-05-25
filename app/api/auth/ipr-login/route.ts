import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import {
  IPR_AUTH_BOUNDARY,
  IPR_AUTH_COOKIE_NAME,
  IPR_AUTH_DATABASE_REQUIREMENT,
  IPR_AUTH_PASSWORD_BOUNDARY,
  IPR_AUTH_SESSION_BOUNDARY,
  buildIprSessionCookie,
  createIprSessionToken,
  evaluateIprPasswordPolicy,
  hashIprPassword,
  normalizeHumanIpr,
  toPublicIprSession,
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

import type {
  IprAccountProfile,
  PublicIprAccountProfile
} from "@/lib/ipr-account-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type IprLoginMode = "LOGIN" | "SET_PASSWORD";

type IprLoginBody = {
  mode?: IprLoginMode;
  humanIpr?: string;
  password?: string;
  runtimeIpr?: string;
  iprHandoff?: unknown;
  deviceLabel?: string;
  ttlSeconds?: number;
};

type MinimalVerifiedSubject = {
  entity: string;
  ipr: string;
  certificateId: string;
  certificateKind: string;
  certificateStatus: "ACTIVE";
  certificateScope: string[];
  cardSerial: string | null;
  certificateHash: string | null;
  accessDecision: "ACCESS_GRANTED";
  accessScope: string;
  identityBinding: "IPR_VERIFIED_BIOLOGICAL_SUBJECT";
};

type MinimalHandoffEvaluation = {
  valid: boolean;
  status: "NOT_PRESENT" | "VALID" | "INVALID";
  error: string | null;
  source: string | null;
  rawHash: string | null;
  verifiedSubject: MinimalVerifiedSubject | null;
};

const DEFAULT_RUNTIME_IPR = "IPR-AI-0001";
const JOKER_C2_ACCESS_SCOPE = "JOKER_C2_ACCESS";

const AUTH_RESPONSE_BOUNDARY = {
  legalCertification: false,
  authBoundary: IPR_AUTH_BOUNDARY,
  passwordBoundary: IPR_AUTH_PASSWORD_BOUNDARY,
  sessionBoundary: IPR_AUTH_SESSION_BOUNDARY,
  databaseRequirement: IPR_AUTH_DATABASE_REQUIREMENT,
  accountStoreBoundary: IPR_ACCOUNT_STORE_BOUNDARY,
  accountProfileBoundary: IPR_ACCOUNT_PROFILE_BOUNDARY,
  accountDatabaseRequirement: IPR_ACCOUNT_DATABASE_REQUIREMENT
};

function sha256Short(value: unknown): string {
  return `sha256:${createHash("sha256")
    .update(JSON.stringify(value), "utf8")
    .digest("hex")
    .slice(0, 16)}`;
}

function sha256Hex(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex").toUpperCase();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readPath(value: unknown, path: string[]): unknown {
  let current: unknown = value;

  for (const key of path) {
    if (!isRecord(current)) {
      return undefined;
    }

    current = current[key];
  }

  return current;
}

function safeString(value: unknown, fallback = ""): string {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return fallback;
}

function firstString(value: unknown, paths: string[][], fallback = ""): string {
  for (const path of paths) {
    const item = readPath(value, path);
    const text = safeString(item, "");

    if (text) {
      return text;
    }
  }

  return fallback;
}

function normalizeScope(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => safeString(item, ""))
      .map((item) => item.trim())
      .filter(Boolean);
  }

  const text = safeString(value, "");

  if (!text) {
    return [];
  }

  return text
    .split(/[,\s|]+/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

function hasJokerAccessScope(scope: string[]): boolean {
  return scope.some((item) => item.toUpperCase() === JOKER_C2_ACCESS_SCOPE);
}

function buildUserAgentHash(req: NextRequest): string {
  const userAgent = req.headers.get("user-agent") || "unknown-user-agent";

  return sha256Hex(userAgent);
}

function evaluateMinimalIprHandoff(
  value: unknown,
  expectedHumanIpr: string
): MinimalHandoffEvaluation {
  if (value === null || typeof value === "undefined") {
    return {
      valid: false,
      status: "NOT_PRESENT",
      error: "IPR_HANDOFF_REQUIRED_FOR_PASSWORD_SETUP",
      source: null,
      rawHash: null,
      verifiedSubject: null
    };
  }

  if (!isRecord(value)) {
    return {
      valid: false,
      status: "INVALID",
      error: "IPR_HANDOFF_NOT_OBJECT",
      source: null,
      rawHash: sha256Short(value),
      verifiedSubject: null
    };
  }

  const rawHash = sha256Short(value);

  const handoffType =
    firstString(value, [["handoff_type"], ["type"]], "") || "HBCE_IPR_HANDOFF";

  const source =
    firstString(
      value,
      [
        ["source"],
        ["issuer"],
        ["app"],
        ["client_context", "transport_source"]
      ],
      ""
    ) || "UNKNOWN_HANDOFF_SOURCE";

  const subjectEntity = firstString(
    value,
    [
      ["subject", "entity"],
      ["subject", "name"],
      ["subject", "full_name"],
      ["verifiedSubject", "entity"],
      ["verifiedSubject", "name"],
      ["verified_subject", "entity"],
      ["verified_subject", "name"],
      ["holder", "name"],
      ["holder", "full_name"],
      ["identity", "name"],
      ["identity", "full_name"]
    ],
    "VERIFIED_BIOLOGICAL_SUBJECT"
  );

  const subjectIpr = normalizeHumanIpr(
    firstString(
      value,
      [
        ["subject", "ipr"],
        ["subject", "ipr_id"],
        ["verifiedSubject", "ipr"],
        ["verified_subject", "ipr"],
        ["verified_subject_ipr"],
        ["subject_ipr"],
        ["ipr"],
        ["ipr_id"],
        ["identity", "ipr"]
      ],
      ""
    )
  );

  const certificateId = firstString(
    value,
    [
      ["certificate", "certificate_id"],
      ["certificate", "id"],
      ["operationalCertificate", "certificate_id"],
      ["operational_certificate", "certificate_id"],
      ["verified_subject_certificate_id"],
      ["certificate_id"]
    ],
    ""
  );

  const certificateKind =
    firstString(
      value,
      [
        ["certificate", "certificate_kind"],
        ["certificate", "kind"],
        ["operationalCertificate", "certificate_kind"],
        ["operational_certificate", "certificate_kind"],
        ["certificate_kind"]
      ],
      ""
    ) || "CERTIFICATE_09_OPERATIONAL";

  const certificateStatus =
    firstString(
      value,
      [
        ["certificate", "certificate_status"],
        ["certificate", "status"],
        ["operationalCertificate", "certificate_status"],
        ["operational_certificate", "certificate_status"],
        ["verified_subject_certificate_status"],
        ["certificate_status"]
      ],
      ""
    ).toUpperCase() || "UNKNOWN";

  const certificateScope = normalizeScope(
    readPath(value, ["certificate", "certificate_scope"]) ??
      readPath(value, ["certificate", "scope"]) ??
      readPath(value, ["operationalCertificate", "certificate_scope"]) ??
      readPath(value, ["operational_certificate", "certificate_scope"]) ??
      readPath(value, ["verified_subject_certificate_scope"]) ??
      readPath(value, ["certificate_scope"]) ??
      readPath(value, ["scope"])
  );

  const cardSerial = firstString(
    value,
    [
      ["certificate", "card_serial"],
      ["certificate", "cardSerial"],
      ["operationalCertificate", "card_serial"],
      ["operational_certificate", "card_serial"],
      ["verified_subject_card_serial"],
      ["card_serial"],
      ["cardSerial"]
    ],
    ""
  );

  const certificateHash = firstString(
    value,
    [
      ["certificate", "certificate_hash"],
      ["certificate", "hash"],
      ["operationalCertificate", "certificate_hash"],
      ["operational_certificate", "certificate_hash"],
      ["certificate_hash"],
      ["hash"]
    ],
    ""
  );

  const accessDecision =
    firstString(
      value,
      [
        ["access", "decision"],
        ["access_decision"],
        ["verified_subject_access_decision"]
      ],
      ""
    ).toUpperCase() || "PENDING_SERVER_VALIDATION";

  const accessScope =
    firstString(
      value,
      [
        ["access", "scope"],
        ["verified_subject_certificate_scope"],
        ["certificate_scope"]
      ],
      ""
    ) || (hasJokerAccessScope(certificateScope) ? JOKER_C2_ACCESS_SCOPE : "UNKNOWN");

  const identityBinding =
    firstString(
      value,
      [
        ["access", "identity_binding"],
        ["access", "identityBinding"],
        ["identity_binding"]
      ],
      ""
    ) || "IPR_VERIFIED_BIOLOGICAL_SUBJECT";

  const errors: string[] = [];

  if (handoffType !== "HBCE_IPR_HANDOFF") {
    errors.push("INVALID_HANDOFF_TYPE");
  }

  if (!subjectIpr) {
    errors.push("MISSING_SUBJECT_IPR");
  }

  if (subjectIpr !== expectedHumanIpr) {
    errors.push("HANDOFF_IPR_MISMATCH");
  }

  if (!certificateId) {
    errors.push("MISSING_CERTIFICATE_ID");
  }

  if (certificateStatus !== "ACTIVE") {
    errors.push("CERTIFICATE_NOT_ACTIVE");
  }

  if (!hasJokerAccessScope(certificateScope)) {
    errors.push("MISSING_JOKER_C2_ACCESS_SCOPE");
  }

  if (accessDecision !== "ACCESS_GRANTED") {
    errors.push("ACCESS_DECISION_NOT_GRANTED");
  }

  if (identityBinding !== "IPR_VERIFIED_BIOLOGICAL_SUBJECT") {
    errors.push("INVALID_IDENTITY_BINDING");
  }

  if (errors.length > 0) {
    return {
      valid: false,
      status: "INVALID",
      error: errors.join("|"),
      source,
      rawHash,
      verifiedSubject: null
    };
  }

  return {
    valid: true,
    status: "VALID",
    error: null,
    source,
    rawHash,
    verifiedSubject: {
      entity: subjectEntity,
      ipr: subjectIpr,
      certificateId,
      certificateKind,
      certificateStatus: "ACTIVE",
      certificateScope,
      cardSerial: cardSerial || null,
      certificateHash: certificateHash || null,
      accessDecision: "ACCESS_GRANTED",
      accessScope,
      identityBinding: "IPR_VERIFIED_BIOLOGICAL_SUBJECT"
    }
  };
}

function normalizeLoginBody(value: unknown): IprLoginBody {
  if (!isRecord(value)) {
    return {};
  }

  const mode = safeString(value.mode, "LOGIN").toUpperCase();

  return {
    mode: mode === "SET_PASSWORD" ? "SET_PASSWORD" : "LOGIN",
    humanIpr: safeString(value.humanIpr ?? value.human_ipr ?? value.ipr, ""),
    password: safeString(value.password, ""),
    runtimeIpr: safeString(value.runtimeIpr ?? value.runtime_ipr, DEFAULT_RUNTIME_IPR),
    iprHandoff: value.iprHandoff ?? value.ipr_handoff ?? null,
    deviceLabel: safeString(value.deviceLabel ?? value.device_label, ""),
    ttlSeconds:
      typeof value.ttlSeconds === "number" && Number.isFinite(value.ttlSeconds)
        ? value.ttlSeconds
        : undefined
  };
}

function jsonError(
  status: number,
  error: string,
  details?: Record<string, unknown>
): NextResponse {
  return NextResponse.json(
    {
      ok: false,
      error,
      ...(details || {}),
      boundary: AUTH_RESPONSE_BOUNDARY
    },
    { status }
  );
}

function upsertAccountProfileFromHandoff(input: {
  humanIpr: string;
  handoff: MinimalHandoffEvaluation;
}): IprAccountProfile {
  if (!input.handoff.valid || !input.handoff.verifiedSubject) {
    throw new Error("VALID_HANDOFF_REQUIRED_FOR_ACCOUNT_PROFILE");
  }

  const subject = input.handoff.verifiedSubject;
  const accountStore = getDefaultIprAccountStore();

  return accountStore.upsertProfile({
    humanIpr: input.humanIpr,
    entity: subject.entity,
    subjectKind: "BIOLOGICAL_SUBJECT",
    certificateId: subject.certificateId,
    certificateKind: subject.certificateKind,
    certificateStatus: subject.certificateStatus,
    certificateScope: subject.certificateScope,
    cardSerial: subject.cardSerial,
    certificateHash: subject.certificateHash,
    accessDecision: subject.accessDecision,
    accessScope: subject.accessScope,
    identityBinding: subject.identityBinding,
    matrixState: "MATRIX_ACTIVE",
    semanticMemoryScope: "IPR_BOUND",
    source: input.handoff.source || "HBCE_IPR_HANDOFF",
    handoffHash: input.handoff.rawHash
  });
}

function buildLoginSuccessResponse(input: {
  mode: IprLoginMode;
  humanIpr: string;
  runtimeIpr: string;
  sessionToken: ReturnType<typeof createIprSessionToken>;
  handoff: MinimalHandoffEvaluation | null;
  accountProfile: PublicIprAccountProfile;
}) {
  return {
    ok: true,
    mode: input.mode,
    authenticated: true,
    humanIpr: input.humanIpr,
    runtimeIpr: input.runtimeIpr,
    session: toPublicIprSession(input.sessionToken),
    accountProfile: input.accountProfile,
    iprHandoff: input.handoff
      ? {
          valid: input.handoff.valid,
          status: input.handoff.status,
          error: input.handoff.error,
          source: input.handoff.source,
          rawHash: input.handoff.rawHash,
          verifiedSubject: input.handoff.verifiedSubject
        }
      : null,
    access: {
      decision: "ACCESS_GRANTED",
      scope: "JOKER_C2_ACCESS",
      identityBinding: input.accountProfile.identityBinding,
      sessionCookie: IPR_AUTH_COOKIE_NAME
    },
    memory: {
      expectedScope: input.accountProfile.semanticMemoryScope,
      expectedAuthority: "SERVER_RUNTIME_VALIDATED",
      persistenceMode: "PROCESS_AUTH_STORE_MVP_UNTIL_DATABASE_PERSISTENT"
    },
    matrix: {
      expectedState: input.accountProfile.matrixState,
      active: input.accountProfile.matrixState === "MATRIX_ACTIVE"
    },
    stores: {
      auth: describeDefaultIprAuthStore(),
      account: describeDefaultIprAccountStore()
    },
    boundary: AUTH_RESPONSE_BOUNDARY
  };
}

export async function POST(req: NextRequest) {
  let rawBody: unknown;

  try {
    rawBody = await req.json();
  } catch {
    return jsonError(400, "INVALID_JSON_BODY");
  }

  const body = normalizeLoginBody(rawBody);
  const mode = body.mode || "LOGIN";
  const humanIpr = normalizeHumanIpr(body.humanIpr || "");
  const runtimeIpr = (body.runtimeIpr || DEFAULT_RUNTIME_IPR).trim().toUpperCase();
  const password = body.password || "";

  if (!humanIpr) {
    return jsonError(400, "MISSING_HUMAN_IPR");
  }

  if (!password) {
    return jsonError(400, "MISSING_PASSWORD");
  }

  if (!runtimeIpr) {
    return jsonError(400, "MISSING_RUNTIME_IPR");
  }

  const authStore = getDefaultIprAuthStore();
  const accountStore = getDefaultIprAccountStore();

  if (mode === "SET_PASSWORD") {
    const passwordPolicy = evaluateIprPasswordPolicy(password);

    if (!passwordPolicy.valid) {
      return jsonError(400, "WEAK_IPR_PASSWORD", {
        passwordPolicy
      });
    }

    const handoff = evaluateMinimalIprHandoff(body.iprHandoff, humanIpr);

    if (!handoff.valid) {
      return jsonError(403, "VALID_IPR_HANDOFF_REQUIRED_FOR_PASSWORD_SETUP", {
        iprHandoff: {
          valid: handoff.valid,
          status: handoff.status,
          error: handoff.error,
          source: handoff.source,
          rawHash: handoff.rawHash
        }
      });
    }

    const credential = await hashIprPassword({
      humanIpr,
      password
    });

    authStore.setCredential(credential);

    const accountProfile = upsertAccountProfileFromHandoff({
      humanIpr,
      handoff
    });

    const touchedProfile = accountStore.touchLogin(humanIpr) || accountProfile;

    const sessionToken = createIprSessionToken({
      humanIpr,
      runtimeIpr,
      ttlSeconds: body.ttlSeconds
    });

    const storedSession = authStore.createSession({
      token: sessionToken,
      deviceLabel: body.deviceLabel || "JOKER-C2 access device",
      userAgentHash: buildUserAgentHash(req)
    });

    const response = NextResponse.json({
      ...buildLoginSuccessResponse({
        mode,
        humanIpr,
        runtimeIpr,
        sessionToken,
        handoff,
        accountProfile: toPublicIprAccountProfile(touchedProfile)
      }),
      storedSession: getPublicSessionFromStoredSession(storedSession)
    });

    const cookie = buildIprSessionCookie({
      token: sessionToken
    });

    response.cookies.set(cookie.name, cookie.value, cookie.options);

    return response;
  }

  const credential = authStore.getCredential(humanIpr);

  if (!credential) {
    return jsonError(404, "IPR_CREDENTIAL_NOT_FOUND", {
      instruction:
        "Create a password first through SET_PASSWORD after a valid HBCE IPR handoff.",
      stores: {
        auth: authStore.describe(),
        account: accountStore.describe()
      }
    });
  }

  const accountProfile = accountStore.touchLogin(humanIpr);

  if (!accountProfile) {
    return jsonError(404, "IPR_ACCOUNT_PROFILE_NOT_FOUND", {
      instruction:
        "Re-run SET_PASSWORD with a valid HBCE IPR handoff so the runtime can create the account profile linked to this IPR.",
      stores: {
        auth: authStore.describe(),
        account: accountStore.describe()
      }
    });
  }

  const verification = await verifyIprPassword({
    humanIpr,
    password,
    credential
  });

  if (!verification.ok) {
    return jsonError(401, "IPR_PASSWORD_VERIFICATION_FAILED", {
      reason: verification.reason
    });
  }

  const sessionToken = createIprSessionToken({
    humanIpr,
    runtimeIpr,
    ttlSeconds: body.ttlSeconds
  });

  const storedSession = authStore.createSession({
    token: sessionToken,
    deviceLabel: body.deviceLabel || "JOKER-C2 access device",
    userAgentHash: buildUserAgentHash(req)
  });

  const response = NextResponse.json({
    ...buildLoginSuccessResponse({
      mode,
      humanIpr,
      runtimeIpr,
      sessionToken,
      handoff: null,
      accountProfile: toPublicIprAccountProfile(accountProfile)
    }),
    storedSession: getPublicSessionFromStoredSession(storedSession)
  });

  const cookie = buildIprSessionCookie({
    token: sessionToken
  });

  response.cookies.set(cookie.name, cookie.value, cookie.options);

  return response;
}

export async function GET() {
  const authStore = getDefaultIprAuthStore();
  const accountStore = getDefaultIprAccountStore();

  return NextResponse.json({
    ok: true,
    route: "/api/auth/ipr-login",
    modes: ["SET_PASSWORD", "LOGIN"],
    cookieName: IPR_AUTH_COOKIE_NAME,
    stores: {
      auth: authStore.describe(),
      account: accountStore.describe()
    },
    boundary: AUTH_RESPONSE_BOUNDARY,
    warning:
      "Current auth and account storage are still MVP unless DATABASE_PERSISTENT is connected. Process memory may reset on deploy, cold start or runtime recycle."
  });
}
