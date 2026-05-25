import { NextRequest, NextResponse } from "next/server";

import {
  IPR_AUTH_BOUNDARY,
  IPR_AUTH_COOKIE_NAME,
  IPR_AUTH_DATABASE_REQUIREMENT,
  IPR_AUTH_PASSWORD_BOUNDARY,
  IPR_AUTH_SESSION_BOUNDARY
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
  toIprHandoffPayloadFromAccountProfile,
  toPublicIprAccountProfile
} from "@/lib/ipr-account-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type UnauthenticatedSessionReason =
  | "SESSION_COOKIE_MISSING"
  | "SESSION_NOT_FOUND"
  | "SESSION_REVOKED"
  | "SESSION_EXPIRED";

type SessionVerificationReason =
  | "SESSION_ACTIVE"
  | "SESSION_NOT_FOUND"
  | "SESSION_REVOKED"
  | "SESSION_EXPIRED";

const AUTH_SESSION_BOUNDARY = {
  legalCertification: false,
  authBoundary: IPR_AUTH_BOUNDARY,
  passwordBoundary: IPR_AUTH_PASSWORD_BOUNDARY,
  sessionBoundary: IPR_AUTH_SESSION_BOUNDARY,
  databaseRequirement: IPR_AUTH_DATABASE_REQUIREMENT,
  accountStoreBoundary: IPR_ACCOUNT_STORE_BOUNDARY,
  accountProfileBoundary: IPR_ACCOUNT_PROFILE_BOUNDARY,
  accountDatabaseRequirement: IPR_ACCOUNT_DATABASE_REQUIREMENT
};

function buildUnauthenticatedResponse(input: {
  reason: UnauthenticatedSessionReason;
  status?: number;
}) {
  return NextResponse.json(
    {
      ok: true,
      authenticated: false,
      reason: input.reason,
      cookieName: IPR_AUTH_COOKIE_NAME,
      access: {
        decision: "AUTHENTICATION_REQUIRED",
        scope: "JOKER_C2_ACCESS",
        identityBinding: "NO_AUTHENTICATED_IPR_SESSION"
      },
      memory: {
        expectedScope: "RUNTIME_ONLY",
        expectedAuthority: "SESSION_RUNTIME_ONLY",
        reason:
          "No active server-side IPR session is available. JOKER-C2 must not infer persistent biological identity from client-side text, URL transport data or missing cookies."
      },
      matrix: {
        expectedState: "MATRIX_LIMITED",
        reason:
          "Without a valid server-side IPR session, MATRIX remains limited for account-level continuity."
      },
      stores: {
        auth: describeDefaultIprAuthStore(),
        account: describeDefaultIprAccountStore()
      },
      boundary: AUTH_SESSION_BOUNDARY
    },
    { status: input.status ?? 200 }
  );
}

function buildProfileMissingResponse(input: {
  humanIpr: string;
  runtimeIpr: string;
  session: ReturnType<typeof getPublicSessionFromStoredSession>;
}) {
  return NextResponse.json(
    {
      ok: true,
      authenticated: false,
      reason: "IPR_ACCOUNT_PROFILE_NOT_FOUND",
      cookieName: IPR_AUTH_COOKIE_NAME,
      session: input.session,
      access: {
        decision: "ACCOUNT_PROFILE_REQUIRED",
        scope: "JOKER_C2_ACCESS",
        identityBinding: "SESSION_WITHOUT_IPR_ACCOUNT_PROFILE",
        humanIpr: input.humanIpr,
        runtimeIpr: input.runtimeIpr
      },
      memory: {
        expectedScope: "RUNTIME_ONLY",
        expectedAuthority: "SESSION_RUNTIME_ONLY",
        reason:
          "A server-side session exists, but no IPR account profile is available. JOKER-C2 must not reconstruct IPR-bound memory without the account profile."
      },
      matrix: {
        expectedState: "MATRIX_LIMITED",
        reason:
          "MATRIX_ACTIVE requires both authenticated IPR session and account profile reconstruction."
      },
      stores: {
        auth: describeDefaultIprAuthStore(),
        account: describeDefaultIprAccountStore()
      },
      boundary: AUTH_SESSION_BOUNDARY,
      instruction:
        "Run SET_PASSWORD again through /api/auth/ipr-login with a valid HBCE IPR handoff so the account profile can be created."
    },
    { status: 409 }
  );
}

function toUnauthenticatedReason(
  reason: SessionVerificationReason
): UnauthenticatedSessionReason {
  if (reason === "SESSION_ACTIVE") {
    return "SESSION_NOT_FOUND";
  }

  return reason;
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get(IPR_AUTH_COOKIE_NAME)?.value || "";

  if (!token) {
    return buildUnauthenticatedResponse({
      reason: "SESSION_COOKIE_MISSING"
    });
  }

  const authStore = getDefaultIprAuthStore();
  const accountStore = getDefaultIprAccountStore();
  const verification = authStore.verifySessionToken(token);

  if (!verification.ok || !verification.session) {
    return buildUnauthenticatedResponse({
      reason: toUnauthenticatedReason(verification.reason)
    });
  }

  const publicSession = getPublicSessionFromStoredSession(verification.session);
  const accountProfile = accountStore.getProfile(verification.session.humanIpr);

  if (!accountProfile) {
    return buildProfileMissingResponse({
      humanIpr: verification.session.humanIpr,
      runtimeIpr: verification.session.runtimeIpr,
      session: publicSession
    });
  }

  const publicAccountProfile = toPublicIprAccountProfile(accountProfile);
  const reconstructedIprHandoff =
    toIprHandoffPayloadFromAccountProfile(accountProfile);

  return NextResponse.json({
    ok: true,
    authenticated: true,
    reason: "SESSION_ACTIVE",
    cookieName: IPR_AUTH_COOKIE_NAME,
    session: publicSession,
    accountProfile: publicAccountProfile,
    reconstructedIprHandoff,
    access: {
      decision: "ACCESS_GRANTED",
      scope: accountProfile.accessScope,
      identityBinding: accountProfile.identityBinding,
      humanIpr: verification.session.humanIpr,
      runtimeIpr: verification.session.runtimeIpr,
      accountId: accountProfile.accountId
    },
    memory: {
      expectedScope: accountProfile.semanticMemoryScope,
      expectedAuthority: "SERVER_RUNTIME_VALIDATED",
      expectedPersistence:
        "PROCESS_AUTH_STORE_MVP and PROCESS_ACCOUNT_STORE_MVP until DATABASE_PERSISTENT is connected",
      reason:
        "A valid server-side IPR session and account profile are active. Runtime may use this session to restore IPR-bound continuity once /api/chat is connected to account-session resolution."
    },
    matrix: {
      expectedState: accountProfile.matrixState,
      active: accountProfile.matrixState === "MATRIX_ACTIVE",
      reason:
        "Authenticated IPR account session plus account profile can become the durable identity source for JOKER-C2 runtime access."
    },
    stores: {
      auth: authStore.describe(),
      account: accountStore.describe()
    },
    boundary: AUTH_SESSION_BOUNDARY
  });
}

export async function POST(req: NextRequest) {
  return GET(req);
}
