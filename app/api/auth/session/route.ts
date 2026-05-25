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

import {
  describeDefaultHbceDatabase,
  getHbceDatabaseBoundary,
  isHbceDatabaseAvailable,
  isHbceDatabaseConfigured
} from "@/lib/ipr-database";

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

const PROJECT_BIRTH_DATE = "2026-01-19" as const;
const PROJECT_BIRTH_DISPLAY_DATE = "19/01/2026" as const;
const PROJECT_BIRTH_LABEL =
  "HBCE R&D / AI JOKER-C2 project birth date" as const;

const MONTHLY_REFERENCE = "UP-MESE-4" as const;
const MONTHLY_REFERENCE_LABEL =
  "Fourth monthly synchronization cycle" as const;

const CURRENT_OPERATIONAL_EVT = "EVT-0016" as const;
const CURRENT_OPERATIONAL_AI_EVT = "EVT-0016-AI" as const;
const CURRENT_OPERATIONAL_CYCLE = "UP-CANONICO" as const;
const CURRENT_EVENT_FAMILY = "UP-EVT" as const;

const SAAS_CORE_VERSION = "v0.1" as const;
const SAAS_TARGET_PERSISTENCE = "DATABASE_PERSISTENT" as const;

const AUTH_SESSION_ROUTE_BOUNDARY =
  "This route verifies the HBCE IPR account session through the server-side session store and resolves the IPR account profile from the server-side account profile store. It does not trust client-side identity text, does not issue official identity, does not replace CIE, SPID, EUDI Wallet, passport, codice fiscale or eIDAS qualified trust services, and does not create legal certification.";

const AUTH_SESSION_SAAS_BOUNDARY =
  "JOKER-C2 SaaS Core v0.1 requires DATABASE_PERSISTENT storage for durable account, session, memory, EVT, OPC, tenant, workspace and audit continuity. If the database is not configured or available, runtime must not claim durable SaaS continuity.";

function buildSaasCoreContext() {
  return {
    saasCore: SAAS_CORE_VERSION,
    targetPersistence: SAAS_TARGET_PERSISTENCE,
    projectBirth: {
      date: PROJECT_BIRTH_DATE,
      displayDate: PROJECT_BIRTH_DISPLAY_DATE,
      label: PROJECT_BIRTH_LABEL
    },
    monthlyReference: {
      cycle: MONTHLY_REFERENCE,
      label: MONTHLY_REFERENCE_LABEL
    },
    currentOperationalEvent: {
      humanEvt: CURRENT_OPERATIONAL_EVT,
      aiEvt: CURRENT_OPERATIONAL_AI_EVT,
      cycle: CURRENT_OPERATIONAL_CYCLE,
      eventFamily: CURRENT_EVENT_FAMILY
    },
    legalCertification: false
  };
}

function buildDatabaseFrame() {
  const configured = isHbceDatabaseConfigured();
  const available = isHbceDatabaseAvailable();

  return {
    configured,
    available,
    description: describeDefaultHbceDatabase(),
    boundary: getHbceDatabaseBoundary(),
    targetPersistence: SAAS_TARGET_PERSISTENCE,
    legalCertification: false
  };
}

function buildBoundary() {
  return {
    routeBoundary: AUTH_SESSION_ROUTE_BOUNDARY,
    saasBoundary: AUTH_SESSION_SAAS_BOUNDARY,
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

function buildMemoryFrame(input?: {
  expectedScope?: string;
  expectedAuthority?: string;
  persistenceMode?: string;
}) {
  return {
    expectedScope: input?.expectedScope || "RUNTIME_ONLY",
    expectedAuthority: input?.expectedAuthority || "SESSION_RUNTIME_ONLY",
    persistenceMode: input?.persistenceMode || SAAS_TARGET_PERSISTENCE,
    targetPersistence: SAAS_TARGET_PERSISTENCE,
    legalCertification: false
  };
}

function buildMatrixFrame(input?: {
  expectedState?: string;
  active?: boolean;
}) {
  const expectedState = input?.expectedState || "MATRIX_LIMITED";

  return {
    expectedState,
    active:
      typeof input?.active === "boolean"
        ? input.active
        : expectedState === "MATRIX_ACTIVE",
    legalCertification: false
  };
}

function buildAccessFrame(input: {
  decision: string;
  source: "IPR_ACCOUNT_SESSION";
  scope?: string;
  identityBinding?: string;
}) {
  return {
    decision: input.decision,
    scope: input.scope,
    identityBinding: input.identityBinding,
    source: input.source,
    legalCertification: false
  };
}

function buildBaseResponse(input: {
  ok: boolean;
  authenticated: boolean;
  reason: SessionRouteReason;
  detail?: string;
}) {
  return {
    ok: input.ok,
    authenticated: input.authenticated,
    reason: input.reason,
    detail: input.detail,
    cookieName: IPR_AUTH_COOKIE_NAME,
    saas: buildSaasCoreContext(),
    database: buildDatabaseFrame(),
    stores: buildStores(),
    boundary: buildBoundary(),
    legalCertification: false
  };
}

function buildUnauthenticatedResponse(
  reason: UnauthenticatedSessionReason,
  status = 401,
  detail?: string
) {
  return NextResponse.json(
    {
      ...buildBaseResponse({
        ok: false,
        authenticated: false,
        reason,
        detail:
          detail ||
          "No active HBCE IPR account session is available for this request."
      }),
      access: buildAccessFrame({
        decision: "AUTHENTICATION_REQUIRED",
        source: "IPR_ACCOUNT_SESSION"
      }),
      memory: buildMemoryFrame(),
      matrix: buildMatrixFrame()
    },
    { status }
  );
}

function buildProfileMissingResponse(session: IprAuthStoredSession) {
  return NextResponse.json(
    {
      ...buildBaseResponse({
        ok: false,
        authenticated: false,
        reason: "IPR_ACCOUNT_PROFILE_NOT_FOUND",
        detail:
          "The HBCE IPR session is valid, but the persistent IPR account profile was not found. Run SET_PASSWORD again with a valid HBCE IPR handoff to rebuild the account profile."
      }),
      session: getPublicSessionFromStoredSession(session),
      access: buildAccessFrame({
        decision: "ACCOUNT_PROFILE_REQUIRED",
        source: "IPR_ACCOUNT_SESSION",
        identityBinding: "SESSION_WITHOUT_IPR_ACCOUNT_PROFILE"
      }),
      memory: buildMemoryFrame(),
      matrix: buildMatrixFrame()
    },
    { status: 409 }
  );
}

function toUnauthenticatedReason(
  reason:
    | "SESSION_ACTIVE"
    | "SESSION_NOT_FOUND"
    | "SESSION_REVOKED"
    | "SESSION_EXPIRED"
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
      ...buildBaseResponse({
        ok: true,
        authenticated: true,
        reason: "SESSION_ACTIVE",
        detail:
          "The HBCE IPR account session is active and the server-side IPR account profile has been resolved."
      }),
      session: publicSession,
      accountProfile: publicAccountProfile,
      reconstructedIprHandoff,
      access: buildAccessFrame({
        decision: "ACCESS_GRANTED",
        source: "IPR_ACCOUNT_SESSION",
        scope: touchedProfile.accessScope,
        identityBinding: touchedProfile.identityBinding
      }),
      memory: buildMemoryFrame({
        expectedScope: touchedProfile.semanticMemoryScope,
        expectedAuthority: "SERVER_RUNTIME_VALIDATED",
        persistenceMode: SAAS_TARGET_PERSISTENCE
      }),
      matrix: buildMatrixFrame({
        expectedState: touchedProfile.matrixState,
        active: touchedProfile.matrixState === "MATRIX_ACTIVE"
      })
    },
    { status: 200 }
  );
}

export async function POST(req: NextRequest) {
  return GET(req);
}
