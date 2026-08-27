import { NextRequest, NextResponse } from "next/server";

import {
  IPR_AUTH_BOUNDARY,
  IPR_AUTH_COOKIE_NAME,
  IPR_AUTH_DATABASE_REQUIREMENT,
  IPR_AUTH_PASSWORD_BOUNDARY,
  IPR_AUTH_SESSION_BOUNDARY,
  buildExpiredIprSessionCookie
} from "@/lib/ipr-auth";

import {
  describeDefaultIprAuthStore,
  getDefaultIprAuthStore,
  getPublicSessionFromStoredSession
} from "@/lib/ipr-session-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const AUTH_LOGOUT_BOUNDARY = {
  legalCertification: false,
  authBoundary: IPR_AUTH_BOUNDARY,
  passwordBoundary: IPR_AUTH_PASSWORD_BOUNDARY,
  sessionBoundary: IPR_AUTH_SESSION_BOUNDARY,
  databaseRequirement: IPR_AUTH_DATABASE_REQUIREMENT
};

function buildLogoutResponse(input: {
  revoked: boolean;
  reason:
    | "SESSION_REVOKED"
    | "SESSION_COOKIE_MISSING"
    | "SESSION_NOT_FOUND"
    | "SESSION_ALREADY_REVOKED"
    | "SESSION_EXPIRED";
  session?: ReturnType<typeof getPublicSessionFromStoredSession> | null;
}) {
  const response = NextResponse.json({
    ok: true,
    authenticated: false,
    revoked: input.revoked,
    reason: input.reason,
    cookieName: IPR_AUTH_COOKIE_NAME,
    session: input.session || null,
    access: {
      decision: "SESSION_CLOSED",
      scope: "JOKER_C2_ACCESS",
      identityBinding: "NO_AUTHENTICATED_IPR_SESSION"
    },
    memory: {
      expectedScope: "RUNTIME_ONLY",
      expectedAuthority: "SESSION_RUNTIME_ONLY",
      reason:
        "The IPR account session has been closed or is unavailable. JOKER-C2 must not continue persistent biological identity recognition from a revoked or missing session."
    },
    boundary: AUTH_LOGOUT_BOUNDARY,
    store: describeDefaultIprAuthStore()
  });

  const expiredCookie = buildExpiredIprSessionCookie();

  response.cookies.set(
    expiredCookie.name,
    expiredCookie.value,
    expiredCookie.options
  );

  return response;
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get(IPR_AUTH_COOKIE_NAME)?.value || "";

  if (!token) {
    return buildLogoutResponse({
      revoked: false,
      reason: "SESSION_COOKIE_MISSING"
    });
  }

  const store = getDefaultIprAuthStore();
  const verification = await store.verifySessionTokenAsync(token);

  if (!verification.session) {
    return buildLogoutResponse({
      revoked: false,
      reason: "SESSION_NOT_FOUND"
    });
  }

  const publicSession = getPublicSessionFromStoredSession(verification.session);

  if (verification.reason === "SESSION_REVOKED") {
    return buildLogoutResponse({
      revoked: false,
      reason: "SESSION_ALREADY_REVOKED",
      session: publicSession
    });
  }

  if (verification.reason === "SESSION_EXPIRED") {
    return buildLogoutResponse({
      revoked: false,
      reason: "SESSION_EXPIRED",
      session: publicSession
    });
  }

  const revoked = await store.revokeSessionAsync(verification.session.sessionId);

  return buildLogoutResponse({
    revoked: Boolean(revoked),
    reason: revoked ? "SESSION_REVOKED" : "SESSION_NOT_FOUND",
    session: revoked ? getPublicSessionFromStoredSession(revoked) : publicSession
  });
}

export async function GET(req: NextRequest) {
  return POST(req);
}
