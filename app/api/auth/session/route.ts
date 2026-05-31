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

const AUTH_SESSION_ROUTE_REVISION =
  "HBCE-AUTH-SESSION-SELF_PILOT_HANDOFF_BRIDGE-v1" as const;


type UnauthenticatedSessionReason =
  | "SESSION_COOKIE_MISSING"
  | "SESSION_NOT_FOUND"
  | "SESSION_REVOKED"
  | "SESSION_EXPIRED";


type SessionRouteReason =
  | "SESSION_ACTIVE"
  | "SELF_PILOT_SESSION_BRIDGE_ACTIVE"
  | "IPR_ACCOUNT_PROFILE_NOT_FOUND"
  | UnauthenticatedSessionReason;

type AuthSessionSource =
  | "IPR_ACCOUNT_SESSION"
  | "SELF_PILOT_SESSION_BRIDGE";


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

const HBCE_SELF_PILOT_HUMAN_IPR =
  "IPR-88505FE91013DCFE97C56ED1" as const;
const HBCE_SELF_PILOT_TENANT_ID = "HBCE-TENANT-SELF-PILOT" as const;
const HBCE_SELF_PILOT_WORKSPACE_ID = "HBCE-WORKSPACE-RND" as const;
const HBCE_SELF_PILOT_ACCOUNT_ID = "HBCE-ACCOUNT-SELF-PILOT" as const;
const HBCE_SELF_PILOT_SUBSCRIPTION_ID =
  "HBCE-SUBSCRIPTION-SELF-PILOT" as const;
const HBCE_SELF_PILOT_CERTIFICATE_ID =
  "HBCE-SELF-PILOT-CERTIFICATE" as const;
const HBCE_SELF_PILOT_ACCESS_SCOPE =
  "JOKER_C2_ACCESS_SELF_PILOT" as const;
const HBCE_SELF_PILOT_IDENTITY_BINDING =
  "IPR_VERIFIED_BIOLOGICAL_SUBJECT_SELF_PILOT" as const;
const HBCE_SELF_PILOT_MATRIX_STATE = "MATRIX_ACTIVE" as const;
const HBCE_SELF_PILOT_MEMORY_SCOPE = "IPR_BOUND" as const;
const HBCE_SELF_PILOT_SOURCE = "SELF_PILOT_SESSION_BRIDGE" as const;


const AUTH_SESSION_ROUTE_BOUNDARY =
  "This route verifies the HBCE IPR account session through the server-side session store and resolves the IPR account profile from the server-side account profile store. In HBCE self-pilot mode it can also expose the internal R&D self-pilot IPR handoff when no browser cookie exists, so the JOKER-C2 interface and IPR memory console can operate without pretending to be a public identity provider. It does not issue official identity, does not replace CIE, SPID, EUDI Wallet, passport, codice fiscale or eIDAS qualified trust services, and does not create legal certification.";


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
  source: AuthSessionSource;
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
    routeRevision: AUTH_SESSION_ROUTE_REVISION,
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



function isFalseLike(value: string | null | undefined) {
  const normalized = String(value || "").trim().toLowerCase();
  return (
    normalized === "0" ||
    normalized === "false" ||
    normalized === "disabled" ||
    normalized === "off" ||
    normalized === "no"
  );
}


function shouldApplySelfPilotSessionBridge(req: NextRequest) {
  if (isFalseLike(process.env.HBCE_AUTH_SESSION_SELF_PILOT_BRIDGE)) {
    return false;
  }

  const queryValue =
    req.nextUrl.searchParams.get("selfPilot") ||
    req.nextUrl.searchParams.get("selfPilotSessionBridge") ||
    req.nextUrl.searchParams.get("hbceSelfPilot");

  const headerValue =
    req.headers.get("x-hbce-self-pilot-session-bridge") ||
    req.headers.get("x-hbce-self-pilot") ||
    req.headers.get("x-hbce-ipr-self-pilot");

  const referer = req.headers.get("referer") || "";
  const secFetchDest = req.headers.get("sec-fetch-dest") || "";

  if (isFalseLike(queryValue) || isFalseLike(headerValue)) {
    return false;
  }

  if (queryValue || headerValue) {
    return true;
  }

  /*
   * Self-pilot default:
   * the public /interface currently calls GET /api/auth/session with credentials
   * but without a body. Without this server-side bridge the route returns
   * SESSION_COOKIE_MISSING before the UI can pass the IPR memory scope.
   * This is an internal R&D bridge only and keeps legalCertification=false.
   */
  return referer.includes("/interface") || secFetchDest === "empty";
}


function buildSelfPilotSessionBridgePayload() {
  const now = new Date().toISOString();

  const session = {
    sessionId: "HBCE-SELF-PILOT-SESSION",
    humanIpr: HBCE_SELF_PILOT_HUMAN_IPR,
    runtimeIpr: "IPR-AI-0001",
    subject: "Verified biological subject",
    certificateId: HBCE_SELF_PILOT_CERTIFICATE_ID,
    certificateStatus: "SELF_PILOT_RND",
    accessScope: HBCE_SELF_PILOT_ACCESS_SCOPE,
    identityBinding: HBCE_SELF_PILOT_IDENTITY_BINDING,
    matrixState: HBCE_SELF_PILOT_MATRIX_STATE,
    semanticMemoryScope: HBCE_SELF_PILOT_MEMORY_SCOPE,
    tenantId: HBCE_SELF_PILOT_TENANT_ID,
    workspaceId: HBCE_SELF_PILOT_WORKSPACE_ID,
    subscriptionId: HBCE_SELF_PILOT_SUBSCRIPTION_ID,
    accountId: HBCE_SELF_PILOT_ACCOUNT_ID,
    source: HBCE_SELF_PILOT_SOURCE,
    createdAt: now,
    updatedAt: now,
    expiresAt: null,
    revokedAt: null,
    legalCertification: false
  };

  const accountProfile = {
    humanIpr: HBCE_SELF_PILOT_HUMAN_IPR,
    runtimeIpr: "IPR-AI-0001",
    accountId: HBCE_SELF_PILOT_ACCOUNT_ID,
    tenantId: HBCE_SELF_PILOT_TENANT_ID,
    workspaceId: HBCE_SELF_PILOT_WORKSPACE_ID,
    subscriptionId: HBCE_SELF_PILOT_SUBSCRIPTION_ID,
    certificateId: HBCE_SELF_PILOT_CERTIFICATE_ID,
    certificateStatus: "SELF_PILOT_RND",
    accessScope: HBCE_SELF_PILOT_ACCESS_SCOPE,
    identityBinding: HBCE_SELF_PILOT_IDENTITY_BINDING,
    matrixState: HBCE_SELF_PILOT_MATRIX_STATE,
    semanticMemoryScope: HBCE_SELF_PILOT_MEMORY_SCOPE,
    profileStatus: "SELF_PILOT_ACTIVE",
    source: HBCE_SELF_PILOT_SOURCE,
    updatedAt: now,
    legalCertification: false
  };

  const reconstructedIprHandoff = {
    humanIpr: HBCE_SELF_PILOT_HUMAN_IPR,
    runtimeIpr: "IPR-AI-0001",
    subject: "Verified biological subject",
    certificateId: HBCE_SELF_PILOT_CERTIFICATE_ID,
    certificateStatus: "SELF_PILOT_RND",
    tenantId: HBCE_SELF_PILOT_TENANT_ID,
    workspaceId: HBCE_SELF_PILOT_WORKSPACE_ID,
    subscriptionId: HBCE_SELF_PILOT_SUBSCRIPTION_ID,
    accountId: HBCE_SELF_PILOT_ACCOUNT_ID,
    accessScope: HBCE_SELF_PILOT_ACCESS_SCOPE,
    identityBinding: HBCE_SELF_PILOT_IDENTITY_BINDING,
    matrixState: HBCE_SELF_PILOT_MATRIX_STATE,
    memoryScope: HBCE_SELF_PILOT_MEMORY_SCOPE,
    semanticMemoryScope: HBCE_SELF_PILOT_MEMORY_SCOPE,
    source: HBCE_SELF_PILOT_SOURCE,
    legalCertification: false
  };

  return {
    session,
    accountProfile,
    reconstructedIprHandoff
  };
}


function buildSelfPilotSessionBridgeResponse(req: NextRequest) {
  const payload = buildSelfPilotSessionBridgePayload();
  const bridgeReason =
    "No hbce_ipr_session cookie was found, so the route applied the internal HBCE self-pilot session bridge for JOKER-C2 R&D. This is an operational handoff for the self-pilot tenant/workspace only; it is not a public login, not official identity and not legal certification.";

  return NextResponse.json(
    {
      ...buildBaseResponse({
        ok: true,
        authenticated: true,
        reason: "SELF_PILOT_SESSION_BRIDGE_ACTIVE",
        detail: bridgeReason
      }),
      selfPilotSessionBridge: {
        active: true,
        source: HBCE_SELF_PILOT_SOURCE,
        reason: "SESSION_COOKIE_MISSING_SELF_PILOT_BRIDGE_APPLIED",
        cookiePresent: Boolean(req.cookies.get(IPR_AUTH_COOKIE_NAME)?.value),
        legalCertification: false
      },
      session: payload.session,
      accountProfile: payload.accountProfile,
      reconstructedIprHandoff: payload.reconstructedIprHandoff,
      access: buildAccessFrame({
        decision: "ACCESS_GRANTED_SELF_PILOT",
        source: HBCE_SELF_PILOT_SOURCE,
        scope: HBCE_SELF_PILOT_ACCESS_SCOPE,
        identityBinding: HBCE_SELF_PILOT_IDENTITY_BINDING
      }),
      memory: buildMemoryFrame({
        expectedScope: HBCE_SELF_PILOT_MEMORY_SCOPE,
        expectedAuthority: "SELF_PILOT_SESSION_BRIDGE",
        persistenceMode: SAAS_TARGET_PERSISTENCE
      }),
      matrix: buildMatrixFrame({
        expectedState: HBCE_SELF_PILOT_MATRIX_STATE,
        active: true
      })
    },
    { status: 200 }
  );
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
    if (shouldApplySelfPilotSessionBridge(req)) {
      return buildSelfPilotSessionBridgeResponse(req);
    }

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
