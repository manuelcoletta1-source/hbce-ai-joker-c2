import type { NextRequest } from "next/server";

import {
  IPR_AUTH_BOUNDARY,
  IPR_AUTH_COOKIE_NAME,
  IPR_AUTH_DATABASE_REQUIREMENT,
  IPR_AUTH_PASSWORD_BOUNDARY,
  IPR_AUTH_SESSION_BOUNDARY
} from "./ipr-auth";

import {
  describeDefaultIprAuthStore,
  getDefaultIprAuthStore,
  getPublicSessionFromStoredSession
} from "./ipr-session-store";

import {
  IPR_ACCOUNT_DATABASE_REQUIREMENT,
  IPR_ACCOUNT_PROFILE_BOUNDARY,
  IPR_ACCOUNT_STORE_BOUNDARY,
  describeDefaultIprAccountStore,
  getDefaultIprAccountStore,
  toIprHandoffPayloadFromAccountProfile,
  toPublicIprAccountProfile
} from "./ipr-account-store";

import type {
  IprAccountProfile,
  PublicIprAccountProfile
} from "./ipr-account-store";

import type {
  IprBoundMemoryHandoffEvaluation,
  MemoryScope
} from "./ipr-bound-memory";

export type IprAccountSessionResolutionReason =
  | "SESSION_ACTIVE"
  | "SESSION_COOKIE_MISSING"
  | "SESSION_NOT_FOUND"
  | "SESSION_REVOKED"
  | "SESSION_EXPIRED"
  | "IPR_ACCOUNT_PROFILE_NOT_FOUND";

export type IprAccountSessionAccessDecision =
  | "ACCESS_GRANTED"
  | "AUTHENTICATION_REQUIRED"
  | "ACCOUNT_PROFILE_REQUIRED";

export type IprAccountSessionResolutionBoundary = {
  legalCertification: false;
  authBoundary: string;
  passwordBoundary: string;
  sessionBoundary: string;
  authDatabaseRequirement: string;
  accountStoreBoundary: string;
  accountProfileBoundary: string;
  accountDatabaseRequirement: string;
};

export type IprAccountSessionResolutionStores = {
  auth: ReturnType<typeof describeDefaultIprAuthStore>;
  account: ReturnType<typeof describeDefaultIprAccountStore>;
};

export type PublicIprAccountSession = ReturnType<
  typeof getPublicSessionFromStoredSession
>;

export type IprAccountProfileLookupAttempt = {
  strategy: string;
  method: string;
  keyHash: string;
  found: boolean;
};

export type IprAccountProfileLookupDiagnostic = {
  attempted: boolean;
  found: boolean;
  matchedStrategy: string | null;
  matchedMethod: string | null;
  matchedKeyHash: string | null;
  attempts: IprAccountProfileLookupAttempt[];
  boundary: string;
};

export type IprAccountSessionResolution = {
  ok: true;
  authenticated: boolean;
  reason: IprAccountSessionResolutionReason;
  cookieName: string;
  access: {
    decision: IprAccountSessionAccessDecision;
    scope: string;
    identityBinding: string;
    humanIpr?: string;
    runtimeIpr?: string;
    accountId?: string;
  };
  memory: {
    expectedScope: MemoryScope;
    expectedAuthority: "SERVER_RUNTIME_VALIDATED" | "SESSION_RUNTIME_ONLY";
    expectedPersistence: string;
    reason: string;
  };
  matrix: {
    expectedState: string;
    active: boolean;
    reason: string;
  };
  session: PublicIprAccountSession | null;
  accountProfile: PublicIprAccountProfile | null;
  reconstructedIprHandoff: Record<string, unknown> | null;
  runtimeHandoff: IprBoundMemoryHandoffEvaluation;
  profileLookup: IprAccountProfileLookupDiagnostic;
  stores: IprAccountSessionResolutionStores;
  boundary: IprAccountSessionResolutionBoundary;
};

export const IPR_AUTH_SESSION_RESOLVER_BOUNDARY =
  "The IPR auth session resolver reconstructs JOKER-C2 runtime identity from a server-side authenticated IPR session and account profile. It must not treat client-side text, URL parameters or user-declared metadata as authoritative identity.";

export const IPR_ACCOUNT_PROFILE_LOOKUP_BOUNDARY =
  "An authenticated IPR session is not sufficient to reconstruct biological identity unless the corresponding IPR account profile is found server-side. Missing account profile must degrade to runtime-only memory and MATRIX_LIMITED, not to stale identity recovery.";

const AUTH_SESSION_RESOLUTION_BOUNDARY: IprAccountSessionResolutionBoundary = {
  legalCertification: false,
  authBoundary: IPR_AUTH_BOUNDARY,
  passwordBoundary: IPR_AUTH_PASSWORD_BOUNDARY,
  sessionBoundary: IPR_AUTH_SESSION_BOUNDARY,
  authDatabaseRequirement: IPR_AUTH_DATABASE_REQUIREMENT,
  accountStoreBoundary: IPR_ACCOUNT_STORE_BOUNDARY,
  accountProfileBoundary: IPR_ACCOUNT_PROFILE_BOUNDARY,
  accountDatabaseRequirement: IPR_ACCOUNT_DATABASE_REQUIREMENT
};

type RuntimeSessionLookupSource = {
  humanIpr: string;
  runtimeIpr: string;
  accountId?: string;
  account_id?: string;
  profileId?: string;
  profile_id?: string;
  certificateId?: string;
  certificate_id?: string;
  cardSerial?: string;
  card_serial?: string;
  [key: string]: unknown;
};

type ProfileLookupCandidate = {
  strategy: string;
  value: string;
};

type ProfileLookupMethod =
  | "getProfile"
  | "getProfileByHumanIpr"
  | "findProfileByHumanIpr"
  | "getProfileByAccountId"
  | "findProfileByAccountId"
  | "getProfileByCertificateId"
  | "findProfileByCertificateId"
  | "getProfileByCardSerial"
  | "findProfileByCardSerial";

type AccountStoreWithOptionalLookupMethods = {
  [key in ProfileLookupMethod]?: (
    value: string
  ) => IprAccountProfile | null | undefined;
};

type ProfileLookupResult = {
  profile: IprAccountProfile | null;
  diagnostic: IprAccountProfileLookupDiagnostic;
};

function describeStores(): IprAccountSessionResolutionStores {
  return {
    auth: describeDefaultIprAuthStore(),
    account: describeDefaultIprAccountStore()
  };
}

function normalizeMemoryScope(value: string): MemoryScope {
  return value === "IPR_BOUND" ? "IPR_BOUND" : "RUNTIME_ONLY";
}

function sha256Safe(value: string): string {
  const crypto = require("node:crypto") as typeof import("node:crypto");

  return crypto
    .createHash("sha256")
    .update(value, "utf8")
    .digest("hex")
    .toUpperCase();
}

function keyHash(value: string): string {
  return `sha256:${sha256Safe(value).slice(0, 24)}`;
}

function safeRuntimeString(value: unknown): string {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return "";
}

function uniqueCandidates(candidates: ProfileLookupCandidate[]): ProfileLookupCandidate[] {
  const result: ProfileLookupCandidate[] = [];
  const seen = new Set<string>();

  for (const candidate of candidates) {
    const value = candidate.value.trim();

    if (!value) {
      continue;
    }

    const key = `${candidate.strategy}::${value}`;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push({
      strategy: candidate.strategy,
      value
    });
  }

  return result;
}

function buildProfileLookupCandidates(
  session: RuntimeSessionLookupSource
): ProfileLookupCandidate[] {
  return uniqueCandidates([
    {
      strategy: "humanIpr",
      value: safeRuntimeString(session.humanIpr)
    },
    {
      strategy: "accountId",
      value:
        safeRuntimeString(session.accountId) ||
        safeRuntimeString(session.account_id)
    },
    {
      strategy: "profileId",
      value:
        safeRuntimeString(session.profileId) ||
        safeRuntimeString(session.profile_id)
    },
    {
      strategy: "certificateId",
      value:
        safeRuntimeString(session.certificateId) ||
        safeRuntimeString(session.certificate_id)
    },
    {
      strategy: "cardSerial",
      value:
        safeRuntimeString(session.cardSerial) ||
        safeRuntimeString(session.card_serial)
    }
  ]);
}

function methodsForCandidate(strategy: string): ProfileLookupMethod[] {
  if (strategy === "humanIpr") {
    return ["getProfile", "getProfileByHumanIpr", "findProfileByHumanIpr"];
  }

  if (strategy === "accountId" || strategy === "profileId") {
    return ["getProfileByAccountId", "findProfileByAccountId", "getProfile"];
  }

  if (strategy === "certificateId") {
    return ["getProfileByCertificateId", "findProfileByCertificateId"];
  }

  if (strategy === "cardSerial") {
    return ["getProfileByCardSerial", "findProfileByCardSerial"];
  }

  return ["getProfile"];
}

function isIprAccountProfile(value: unknown): value is IprAccountProfile {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    typeof record.entity === "string" &&
    typeof record.humanIpr === "string" &&
    typeof record.runtimeIpr === "string" &&
    typeof record.certificateId === "string" &&
    typeof record.certificateStatus === "string" &&
    Array.isArray(record.certificateScope)
  );
}

function callProfileLookupMethod(input: {
  store: AccountStoreWithOptionalLookupMethods;
  method: ProfileLookupMethod;
  value: string;
}): IprAccountProfile | null {
  const fn = input.store[input.method];

  if (typeof fn !== "function") {
    return null;
  }

  try {
    const result = fn.call(input.store, input.value);

    return isIprAccountProfile(result) ? result : null;
  } catch {
    return null;
  }
}

function buildEmptyProfileLookupDiagnostic(): IprAccountProfileLookupDiagnostic {
  return {
    attempted: false,
    found: false,
    matchedStrategy: null,
    matchedMethod: null,
    matchedKeyHash: null,
    attempts: [],
    boundary: IPR_ACCOUNT_PROFILE_LOOKUP_BOUNDARY
  };
}

function resolveAccountProfileFromSession(input: {
  accountStore: AccountStoreWithOptionalLookupMethods;
  session: RuntimeSessionLookupSource;
}): ProfileLookupResult {
  const candidates = buildProfileLookupCandidates(input.session);
  const attempts: IprAccountProfileLookupAttempt[] = [];

  for (const candidate of candidates) {
    const methods = methodsForCandidate(candidate.strategy);

    for (const method of methods) {
      const profile = callProfileLookupMethod({
        store: input.accountStore,
        method,
        value: candidate.value
      });

      const attempt: IprAccountProfileLookupAttempt = {
        strategy: candidate.strategy,
        method,
        keyHash: keyHash(candidate.value),
        found: Boolean(profile)
      };

      attempts.push(attempt);

      if (profile) {
        return {
          profile,
          diagnostic: {
            attempted: true,
            found: true,
            matchedStrategy: candidate.strategy,
            matchedMethod: method,
            matchedKeyHash: attempt.keyHash,
            attempts,
            boundary: IPR_ACCOUNT_PROFILE_LOOKUP_BOUNDARY
          }
        };
      }
    }
  }

  return {
    profile: null,
    diagnostic: {
      attempted: attempts.length > 0,
      found: false,
      matchedStrategy: null,
      matchedMethod: null,
      matchedKeyHash: null,
      attempts,
      boundary: IPR_ACCOUNT_PROFILE_LOOKUP_BOUNDARY
    }
  };
}

function buildRuntimeOnlyHandoff(reason: string): IprBoundMemoryHandoffEvaluation {
  return {
    isValid: false,
    source: "IPR_AUTH_SESSION_RESOLVER",
    authority: "SESSION_RUNTIME_ONLY",
    matrixState: "MATRIX_LIMITED",
    semanticMemoryScope: "RUNTIME_ONLY",
    reason,
    accessDecision: "AUTHENTICATION_REQUIRED",
    identityBinding: "NO_AUTHENTICATED_IPR_SESSION"
  };
}

function buildRuntimeHandoffFromAccountProfile(
  profile: IprAccountProfile
): IprBoundMemoryHandoffEvaluation {
  return {
    isValid:
      profile.certificateStatus === "ACTIVE" &&
      profile.accessDecision === "ACCESS_GRANTED" &&
      normalizeMemoryScope(profile.semanticMemoryScope) === "IPR_BOUND",
    source: "IPR_ACCOUNT_SESSION",
    authority: "SERVER_RUNTIME_VALIDATED",
    matrixState: profile.matrixState,
    semanticMemoryScope: normalizeMemoryScope(profile.semanticMemoryScope),
    reason:
      "Authenticated IPR account session resolved server-side from HttpOnly cookie, session store and account profile store.",
    accessDecision: profile.accessDecision,
    identityBinding: profile.identityBinding,
    subject: {
      entity: profile.entity,
      ipr: profile.humanIpr,
      kind: profile.subjectKind
    },
    certificate: {
      certificateId: profile.certificateId,
      certificateStatus: profile.certificateStatus,
      certificateScope: profile.certificateScope,
      certificateKind: profile.certificateKind,
      ...(profile.cardSerial ? { cardSerial: profile.cardSerial } : {}),
      ...(profile.certificateHash ? { certificateHash: profile.certificateHash } : {})
    }
  };
}

function buildUnauthenticatedResolution(input: {
  reason: Exclude<IprAccountSessionResolutionReason, "SESSION_ACTIVE">;
  session?: PublicIprAccountSession | null;
  humanIpr?: string;
  runtimeIpr?: string;
  profileLookup?: IprAccountProfileLookupDiagnostic;
}): IprAccountSessionResolution {
  const hasSessionWithoutProfile = input.reason === "IPR_ACCOUNT_PROFILE_NOT_FOUND";

  return {
    ok: true,
    authenticated: false,
    reason: input.reason,
    cookieName: IPR_AUTH_COOKIE_NAME,
    access: {
      decision: hasSessionWithoutProfile
        ? "ACCOUNT_PROFILE_REQUIRED"
        : "AUTHENTICATION_REQUIRED",
      scope: "JOKER_C2_ACCESS",
      identityBinding: hasSessionWithoutProfile
        ? "SESSION_WITHOUT_IPR_ACCOUNT_PROFILE"
        : "NO_AUTHENTICATED_IPR_SESSION",
      ...(input.humanIpr ? { humanIpr: input.humanIpr } : {}),
      ...(input.runtimeIpr ? { runtimeIpr: input.runtimeIpr } : {})
    },
    memory: {
      expectedScope: "RUNTIME_ONLY",
      expectedAuthority: "SESSION_RUNTIME_ONLY",
      expectedPersistence:
        "PROCESS_AUTH_STORE_MVP and PROCESS_ACCOUNT_STORE_MVP until DATABASE_PERSISTENT is connected",
      reason: hasSessionWithoutProfile
        ? [
            "A server-side session exists, but no IPR account profile is available.",
            "JOKER-C2 must not reconstruct IPR-bound memory without the account profile.",
            "The resolver attempted profile lookup diagnostics before falling back to runtime-only memory.",
            IPR_ACCOUNT_PROFILE_LOOKUP_BOUNDARY
          ].join(" ")
        : "No active server-side IPR session is available. JOKER-C2 must not infer persistent biological identity from client-side text, URL transport data or missing cookies."
    },
    matrix: {
      expectedState: "MATRIX_LIMITED",
      active: false,
      reason: hasSessionWithoutProfile
        ? "MATRIX_ACTIVE requires both authenticated IPR session and account profile reconstruction. Existing session token alone is not enough."
        : "Without a valid server-side IPR session, MATRIX remains limited for account-level continuity."
    },
    session: input.session || null,
    accountProfile: null,
    reconstructedIprHandoff: null,
    runtimeHandoff: buildRuntimeOnlyHandoff(input.reason),
    profileLookup: input.profileLookup || buildEmptyProfileLookupDiagnostic(),
    stores: describeStores(),
    boundary: AUTH_SESSION_RESOLUTION_BOUNDARY
  };
}

function toInactiveReason(
  reason: "SESSION_ACTIVE" | "SESSION_NOT_FOUND" | "SESSION_REVOKED" | "SESSION_EXPIRED"
): Exclude<IprAccountSessionResolutionReason, "SESSION_ACTIVE" | "IPR_ACCOUNT_PROFILE_NOT_FOUND"> {
  if (reason === "SESSION_ACTIVE") {
    return "SESSION_NOT_FOUND";
  }

  return reason;
}

export function resolveIprAccountSessionFromRequest(
  req: NextRequest
): IprAccountSessionResolution {
  const token = req.cookies.get(IPR_AUTH_COOKIE_NAME)?.value || "";

  if (!token) {
    return buildUnauthenticatedResolution({
      reason: "SESSION_COOKIE_MISSING"
    });
  }

  const authStore = getDefaultIprAuthStore();
  const accountStore = getDefaultIprAccountStore();
  const verification = authStore.verifySessionToken(token);

  if (!verification.ok || !verification.session) {
    return buildUnauthenticatedResolution({
      reason: toInactiveReason(verification.reason)
    });
  }

  const publicSession = getPublicSessionFromStoredSession(verification.session);
  const profileLookup = resolveAccountProfileFromSession({
    accountStore: accountStore as AccountStoreWithOptionalLookupMethods,
    session: verification.session as RuntimeSessionLookupSource
  });

  if (!profileLookup.profile) {
    return buildUnauthenticatedResolution({
      reason: "IPR_ACCOUNT_PROFILE_NOT_FOUND",
      session: publicSession,
      humanIpr: verification.session.humanIpr,
      runtimeIpr: verification.session.runtimeIpr,
      profileLookup: profileLookup.diagnostic
    });
  }

  const accountProfile = profileLookup.profile;
  const publicAccountProfile = toPublicIprAccountProfile(accountProfile);
  const runtimeHandoff = buildRuntimeHandoffFromAccountProfile(accountProfile);
  const reconstructedIprHandoff =
    toIprHandoffPayloadFromAccountProfile(accountProfile);

  return {
    ok: true,
    authenticated: runtimeHandoff.isValid,
    reason: "SESSION_ACTIVE",
    cookieName: IPR_AUTH_COOKIE_NAME,
    access: {
      decision: runtimeHandoff.isValid
        ? "ACCESS_GRANTED"
        : "AUTHENTICATION_REQUIRED",
      scope: accountProfile.accessScope,
      identityBinding: accountProfile.identityBinding,
      humanIpr: verification.session.humanIpr,
      runtimeIpr: verification.session.runtimeIpr,
      accountId: accountProfile.accountId
    },
    memory: {
      expectedScope: runtimeHandoff.semanticMemoryScope,
      expectedAuthority: runtimeHandoff.isValid
        ? "SERVER_RUNTIME_VALIDATED"
        : "SESSION_RUNTIME_ONLY",
      expectedPersistence:
        "PROCESS_AUTH_STORE_MVP and PROCESS_ACCOUNT_STORE_MVP until DATABASE_PERSISTENT is connected",
      reason: runtimeHandoff.isValid
        ? "A valid server-side IPR session and account profile are active. Runtime may use this session to restore IPR-bound continuity."
        : "A session and account profile exist, but runtime handoff validation did not resolve to an active IPR-bound identity."
    },
    matrix: {
      expectedState: accountProfile.matrixState,
      active: accountProfile.matrixState === "MATRIX_ACTIVE" && runtimeHandoff.isValid,
      reason:
        "Authenticated IPR account session plus account profile can become the durable identity source for JOKER-C2 runtime access."
    },
    session: publicSession,
    accountProfile: publicAccountProfile,
    reconstructedIprHandoff,
    runtimeHandoff,
    profileLookup: profileLookup.diagnostic,
    stores: describeStores(),
    boundary: AUTH_SESSION_RESOLUTION_BOUNDARY
  };
}

export function resolveRuntimeHandoffFromRequest(
  req: NextRequest
): IprBoundMemoryHandoffEvaluation {
  return resolveIprAccountSessionFromRequest(req).runtimeHandoff;
}
