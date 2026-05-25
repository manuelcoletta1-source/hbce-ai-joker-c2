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
  stores: IprAccountSessionResolutionStores;
  boundary: IprAccountSessionResolutionBoundary;
};

export const IPR_AUTH_SESSION_RESOLVER_BOUNDARY =
  "The IPR auth session resolver reconstructs JOKER-C2 runtime identity from a server-side authenticated IPR session and account profile. It must not treat client-side text, URL parameters or user-declared metadata as authoritative identity.";

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

function describeStores(): IprAccountSessionResolutionStores {
  return {
    auth: describeDefaultIprAuthStore(),
    account: describeDefaultIprAccountStore()
  };
}

function normalizeMemoryScope(value: string): MemoryScope {
  return value === "IPR_BOUND" ? "IPR_BOUND" : "RUNTIME_ONLY";
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
        ? "A server-side session exists, but no IPR account profile is available. JOKER-C2 must not reconstruct IPR-bound memory without the account profile."
        : "No active server-side IPR session is available. JOKER-C2 must not infer persistent biological identity from client-side text, URL transport data or missing cookies."
    },
    matrix: {
      expectedState: "MATRIX_LIMITED",
      active: false,
      reason: hasSessionWithoutProfile
        ? "MATRIX_ACTIVE requires both authenticated IPR session and account profile reconstruction."
        : "Without a valid server-side IPR session, MATRIX remains limited for account-level continuity."
    },
    session: input.session || null,
    accountProfile: null,
    reconstructedIprHandoff: null,
    runtimeHandoff: buildRuntimeOnlyHandoff(input.reason),
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
  const accountProfile = accountStore.getProfile(verification.session.humanIpr);

  if (!accountProfile) {
    return buildUnauthenticatedResolution({
      reason: "IPR_ACCOUNT_PROFILE_NOT_FOUND",
      session: publicSession,
      humanIpr: verification.session.humanIpr,
      runtimeIpr: verification.session.runtimeIpr
    });
  }

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
    stores: describeStores(),
    boundary: AUTH_SESSION_RESOLUTION_BOUNDARY
  };
}

export function resolveRuntimeHandoffFromRequest(
  req: NextRequest
): IprBoundMemoryHandoffEvaluation {
  return resolveIprAccountSessionFromRequest(req).runtimeHandoff;
}
