import { NextRequest, NextResponse } from "next/server";

import {
  IPR_AUTH_BOUNDARY,
  IPR_AUTH_COOKIE_NAME,
  IPR_AUTH_DATABASE_REQUIREMENT,
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

import type { IprAuthStoredSession } from "@/lib/ipr-session-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type UnauthenticatedSessionReason =
  | "SESSION_COOKIE_MISSING"
  | "SESSION_NOT_FOUND"
  | "SESSION_REVOKED"
  | "SESSION_EXPIRED";

type SessionRouteReason =
  | "SESSION_ACTIVE"
  | "IPR_ACCOUNT_PROFILE_NOT_FOUND"
  | UnauthenticatedSessionReason;

const AUTH_SESSION_ROUTE_BOUNDARY =
  "This route verifies the HBCE IPR account session through the server-side session store and resolves the IPR account profile from the server-side account profile store. It does not trust client-side identity text, does not issue official identity, does not replace CIE, SPID, EUDI Wallet, passport, codice fiscale or eIDAS qualified trust services, and does not create legal certification.";

function buildBoundary() {
  return {
    routeBoundary: AUTH_SESSION_ROUTE_BOUNDARY,
    authBoundary: IPR_AUTH_BOUNDARY,
    sessionBoundary: IPR_AUTH_SESSION_BOUNDARY,
    authDatabaseRequirement: IPR_AUTH_DATABASE_REQUIREMENT,
    accountStoreBoundary: IPR_ACCOUNT_STORE_BOUNDARY,
    accountProfileBoundary: IPR_ACCOUNT_PROFILE_BOUNDARY,
    accountDatabaseRequirement: IPR_ACCOUNT_DATABASE_REQUIREMENT,
    legalCertification: false
  };
}

function buildStores() {
  return {
    auth: describeDefaultIprAuthStore(),
    account: describeDefaultIprAccountStore()
  };
}

function buildUnauthenticatedResponse(
  reason: UnauthenticatedSessionReason,
  status = 401,
  detail?: string
) {
  return NextResponse.json(
    {
      ok: false,
      authenticated: false,
      reason,
      detail:
        detail ||
        "No active HBCE IPR account session is available for this request.",
      cookieName: IPR_AUTH_COOKIE_NAME,
      access: {
        decision: "AUTHENTICATION_REQUIRED",
        source: "IPR_ACCOUNT_SESSION",
        legalCertification: false
      },
      memory: {
        expectedScope: "RUNTIME_ONLY",
        expectedAuthority: "SESSION_RUNTIME_ONLY",
        persistenceMode: "DATABASE_PERSISTENT"
      },
      matrix: {
        expectedState: "MATRIX_LIMITED"
      },
      stores: buildStores(),
      boundary: buildBoundary(),
      legalCertification: false
    },
    { status }
  );
}

function buildProfileMissingResponse(session: IprAuthStoredSession) {
  return NextResponse.json(
    {
      ok: false,
      authenticated: false,
      reason: "IPR_ACCOUNT_PROFILE_NOT_FOUND" satisfies SessionRouteReason,
      detail:
        "The HBCE IPR session is valid, but the persistent IPR account profile was not found. Run SET_PASSWORD again with a valid HBCE IPR handoff to rebuild the account profile.",
      cookieName: IPR_AUTH_COOKIE_NAME,
      session: getPublicSessionFromStoredSession(session),
      access: {
        decision: "ACCOUNT_PROFILE_REQUIRED",
        source: "IPR_ACCOUNT_SESSION",
        identityBinding: "SESSION_WITHOUT_IPR_ACCOUNT_PROFILE",
        legalCertification: false
      },
      memory: {
        expectedScope: "RUNTIME_ONLY",
        expectedAuthority: "SESSION_RUNTIME_ONLY",
        persistenceMode: "DATABASE_PERSISTENT"
      },
      matrix: {
        expectedState: "MATRIX_LIMITED"
      },
      stores: buildStores(),
      boundary: buildBoundary(),
      legalCertification: false
    },
    { status: 409 }
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
  const token = req.cookies.get(IPR_AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return buildUnauthenticatedResponse(
      "SESSION_COOKIE_MISSING",
      401,
      "The hbce_ipr_session cookie is missing. Login with Human IPR and password before requesting a persistent JOKER-C2 session."
    );
  }

  const authStore = getDefaultIprAuthStore();
  const accountStore = getDefaultIprAccountStore();

  const verification = await authStore.verifySessionTokenAsync(token);

  if (!verification.ok || !verification.authenticated) {
    return buildUnauthenticatedResponse(
      toUnauthenticatedReason(verification.reason),
      401,
      "The hbce_ipr_session cookie is present, but the server-side HBCE IPR session is not active."
    );
  }

  const session = verification.session;
  const accountProfile = await accountStore.getProfileAsync(session.humanIpr);

  if (!accountProfile) {
    return buildProfileMissingResponse(session);
  }

  const touchedProfile =
    (await accountStore.touchLoginAsync(session.humanIpr)) || accountProfile;

  const publicSession = getPublicSessionFromStoredSession(session);
  const publicAccountProfile = toPublicIprAccountProfile(touchedProfile);
  const reconstructedIprHandoff =
    toIprHandoffPayloadFromAccountProfile(touchedProfile);

  return NextResponse.json(
    {
      ok: true,
      authenticated: true,
      reason: "SESSION_ACTIVE" satisfies SessionRouteReason,
      cookieName: IPR_AUTH_COOKIE_NAME,
      session: publicSession,
      accountProfile: publicAccountProfile,
      reconstructedIprHandoff,
      access: {
        decision: "ACCESS_GRANTED",
        scope: touchedProfile.accessScope,
        identityBinding: touchedProfile.identityBinding,
        source: "IPR_ACCOUNT_SESSION",
        legalCertification: false
      },
      memory: {
        expectedScope: touchedProfile.semanticMemoryScope,
        expectedAuthority: "SERVER_RUNTIME_VALIDATED",
        persistenceMode: "DATABASE_PERSISTENT"
      },
      matrix: {
        expectedState: touchedProfile.matrixState,
        active: touchedProfile.matrixState === "MATRIX_ACTIVE"
      },
      stores: buildStores(),
      boundary: buildBoundary(),
      legalCertification: false
    },
    { status: 200 }
  );
}

export async function POST(req: NextRequest) {
  return GET(req);
}
