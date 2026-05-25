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

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type UnauthenticatedSessionReason =
  | "SESSION_COOKIE_MISSING"
  | "SESSION_NOT_FOUND"
  | "SESSION_REVOKED"
  | "SESSION_EXPIRED";

const AUTH_SESSION_BOUNDARY = {
  legalCertification: false,
  authBoundary: IPR_AUTH_BOUNDARY,
  passwordBoundary: IPR_AUTH_PASSWORD_BOUNDARY,
  sessionBoundary: IPR_AUTH_SESSION_BOUNDARY,
  databaseRequirement: IPR_AUTH_DATABASE_REQUIREMENT
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
          "No active server-side IPR session is available. JOKER-C2 must not infer persistent biological identity from client-side text or missing cookies."
      },
      boundary: AUTH_SESSION_BOUNDARY
    },
    { status: input.status ?? 200 }
  );
}

function toUnauthenticatedReason(
  reason: "SESSION_ACTIVE" | "SESSION_NOT_FOUND" | "SESSION_REVOKED" | "SESSION_EXPIRED"
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

  const store = getDefaultIprAuthStore();
  const verification = store.verifySessionToken(token);

  if (!verification.ok || !verification.session) {
    return buildUnauthenticatedResponse({
      reason: toUnauthenticatedReason(verification.reason)
    });
  }

  const publicSession = getPublicSessionFromStoredSession(verification.session);

  return NextResponse.json({
    ok: true,
    authenticated: true,
    reason: "SESSION_ACTIVE",
    cookieName: IPR_AUTH_COOKIE_NAME,
    session: publicSession,
    access: {
      decision: "ACCESS_GRANTED",
      scope: "JOKER_C2_ACCESS",
      identityBinding: "IPR_ACCOUNT_AUTHENTICATED",
      humanIpr: verification.session.humanIpr,
      runtimeIpr: verification.session.runtimeIpr
    },
    memory: {
      expectedScope: "IPR_BOUND",
      expectedAuthority: "SERVER_RUNTIME_VALIDATED",
      expectedPersistence:
        "PROCESS_AUTH_STORE_MVP until DATABASE_PERSISTENT is connected",
      reason:
        "A valid server-side IPR session is active. Runtime may use this session to restore IPR-bound continuity once chat, memory and database stores are connected."
    },
    matrix: {
      expectedState: "MATRIX_ACTIVE",
      reason:
        "Authenticated IPR account session can become the durable identity source for JOKER-C2 runtime access."
    },
    store: describeDefaultIprAuthStore(),
    boundary: AUTH_SESSION_BOUNDARY
  });
}

export async function POST(req: NextRequest) {
  return GET(req);
}
