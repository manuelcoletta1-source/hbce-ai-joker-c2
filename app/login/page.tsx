"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type LoginMode = "SET_PASSWORD" | "LOGIN";
type RequestStatus = "IDLE" | "LOADING" | "SUCCESS" | "ERROR";

type ApiState = {
  status: RequestStatus;
  httpStatus: number | null;
  payload: unknown;
  error: string | null;
  receivedAt: string | null;
};

const INITIAL_API_STATE: ApiState = {
  status: "IDLE",
  httpStatus: null,
  payload: null,
  error: null,
  receivedAt: null
};

const HUMAN_IPR_CANONICAL = "IPR-88505FE91013DCFE97C56ED1";

const PAGE_BOUNDARY =
  "This page creates or verifies an HBCE IPR account session for AI JOKER-C2. SET_PASSWORD creates the password only after a verified HBCE IPR handoff. LOGIN verifies an existing password. The page does not issue official identity, does not replace CIE, SPID, EUDI Wallet, passport, codice fiscale or eIDAS qualified trust services, and does not create legal certification.";

const WEAK_PROJECT_FRAGMENTS = [
  "joker",
  "hbce",
  "matrix",
  "ipr",
  "manuel",
  "coletta",
  "hermeticum",
  "bce",
  "openai"
];

function nowIso(): string {
  return new Date().toISOString();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stringifyPayload(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function normalizeHumanIpr(value: string): string {
  return value.trim().toUpperCase();
}

function extractString(value: unknown, path: string[]): string | null {
  let current: unknown = value;

  for (const key of path) {
    if (!isRecord(current)) {
      return null;
    }

    current = current[key];
  }

  return typeof current === "string" && current.trim()
    ? current.trim()
    : null;
}

function extractBoolean(value: unknown, path: string[]): boolean | null {
  let current: unknown = value;

  for (const key of path) {
    if (!isRecord(current)) {
      return null;
    }

    current = current[key];
  }

  return typeof current === "boolean" ? current : null;
}

function extractHumanIprFromHandoff(value: unknown): string | null {
  return (
    extractString(value, ["subject", "ipr"]) ||
    extractString(value, ["humanIpr"]) ||
    extractString(value, ["human_ipr"]) ||
    extractString(value, ["subjectIpr"]) ||
    extractString(value, ["ipr"])
  );
}

function decodeBase64Json(value: string): unknown | null {
  try {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = window.atob(normalized);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

function parseJsonText(value: string): unknown | null {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function findHandoffFromUrl(): unknown | null {
  const params = new URLSearchParams(window.location.search);

  const b64 =
    params.get("hbce_ipr_handoff_b64") ||
    params.get("ipr_handoff_b64") ||
    params.get("handoff_b64");

  if (b64) {
    const decoded = decodeBase64Json(b64);

    if (decoded) {
      return decoded;
    }
  }

  const json =
    params.get("hbce_ipr_handoff") ||
    params.get("iprHandoff") ||
    params.get("ipr_handoff") ||
    params.get("handoff");

  if (json) {
    const decodedText = decodeURIComponent(json);
    const parsed = parseJsonText(decodedText);

    if (parsed) {
      return parsed;
    }
  }

  return null;
}

function findHandoffFromStorage(): unknown | null {
  const keys = [
    "hbce_ipr_handoff",
    "hbce_ipr_handoff_b64",
    "hbce_joker_c2_ipr_handoff",
    "hbce_joker_c2_ipr_handoff_b64",
    "joker_c2_ipr_handoff",
    "joker_c2_ipr_handoff_b64"
  ];

  for (const key of keys) {
    const localValue = window.localStorage.getItem(key);
    const sessionValue = window.sessionStorage.getItem(key);
    const value = localValue || sessionValue;

    if (!value) {
      continue;
    }

    if (key.endsWith("_b64")) {
      const decoded = decodeBase64Json(value);

      if (decoded) {
        return decoded;
      }
    }

    const parsed = parseJsonText(value);

    if (parsed) {
      return parsed;
    }
  }

  return null;
}

function findHumanIprFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);

  const value =
    params.get("humanIpr") ||
    params.get("human_ipr") ||
    params.get("subjectIpr") ||
    params.get("subject_ipr") ||
    params.get("ipr");

  return value ? normalizeHumanIpr(value) : null;
}

function getStatusLabel(state: ApiState): string {
  if (state.status === "IDLE") {
    return "Not executed";
  }

  if (state.status === "LOADING") {
    return "Loading";
  }

  if (state.status === "SUCCESS") {
    return "Success";
  }

  return "Error";
}

function hasSymbol(password: string): boolean {
  return /[^A-Za-z0-9]/.test(password);
}

function hasWeakProjectFragment(password: string): boolean {
  const normalized = password.toLowerCase();

  return WEAK_PROJECT_FRAGMENTS.some((fragment) =>
    normalized.includes(fragment)
  );
}

function buildCreatePasswordHints(
  password: string,
  confirmPassword: string,
  handoffText: string
): string[] {
  const hints: string[] = [];

  if (!password) {
    hints.push("Password is required.");
  }

  if (!confirmPassword) {
    hints.push("Password confirmation is required.");
  }

  if (password && confirmPassword && password !== confirmPassword) {
    hints.push("Password confirmation does not match.");
  }

  if (password && !hasSymbol(password)) {
    hints.push("Password should include at least one symbol.");
  }

  if (password && hasWeakProjectFragment(password)) {
    hints.push("Password should not include obvious project or personal fragments.");
  }

  if (!handoffText.trim()) {
    hints.push("Verified HBCE IPR handoff is required to create the password.");
  }

  return hints;
}

function buildLoginSummary(payload: unknown): string[] {
  const authenticated = extractBoolean(payload, ["authenticated"]);
  const mode = extractString(payload, ["mode"]);
  const reason = extractString(payload, ["reason"]);
  const detail = extractString(payload, ["detail"]);
  const humanIpr = extractString(payload, ["humanIpr"]);
  const accessSource = extractString(payload, ["access", "source"]);
  const matrixState = extractString(payload, ["matrix", "expectedState"]);
  const memoryScope = extractString(payload, ["memory", "expectedScope"]);
  const memoryPersistence = extractString(payload, ["memory", "persistenceMode"]);

  return [
    `Authenticated: ${authenticated === null ? "unknown" : String(authenticated)}`,
    `Mode: ${mode || "unknown"}`,
    `Reason: ${reason || "unknown"}`,
    `Human IPR: ${humanIpr || "unknown"}`,
    `Access source: ${accessSource || "unknown"}`,
    `Matrix state: ${matrixState || "unknown"}`,
    `Memory scope: ${memoryScope || "unknown"}`,
    `Memory persistence: ${memoryPersistence || "unknown"}`,
    `Detail: ${detail || "none"}`
  ];
}

function buildSessionSummary(payload: unknown): string[] {
  const authenticated = extractBoolean(payload, ["authenticated"]);
  const reason = extractString(payload, ["reason"]);
  const humanIpr =
    extractString(payload, ["session", "humanIpr"]) ||
    extractString(payload, ["accountProfile", "humanIpr"]);
  const accessSource = extractString(payload, ["access", "source"]);
  const matrixState = extractString(payload, ["matrix", "expectedState"]);
  const memoryScope = extractString(payload, ["memory", "expectedScope"]);
  const memoryPersistence = extractString(payload, ["memory", "persistenceMode"]);

  return [
    `Authenticated: ${authenticated === null ? "unknown" : String(authenticated)}`,
    `Reason: ${reason || "unknown"}`,
    `Human IPR: ${humanIpr || "unknown"}`,
    `Access source: ${accessSource || "unknown"}`,
    `Matrix state: ${matrixState || "unknown"}`,
    `Memory scope: ${memoryScope || "unknown"}`,
    `Memory persistence: ${memoryPersistence || "unknown"}`
  ];
}

function isAuthenticated(payload: unknown): boolean {
  return extractBoolean(payload, ["authenticated"]) === true;
}

export default function HbceJokerLoginPage() {
  const [mode, setMode] = useState<LoginMode>("LOGIN");

  const [createHumanIpr, setCreateHumanIpr] = useState(HUMAN_IPR_CANONICAL);
  const [createPassword, setCreatePassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [handoffText, setHandoffText] = useState("");
  const [handoffLoaded, setHandoffLoaded] = useState(false);

  const [loginHumanIpr, setLoginHumanIpr] = useState(HUMAN_IPR_CANONICAL);
  const [loginPassword, setLoginPassword] = useState("");

  const [deviceLabel, setDeviceLabel] = useState("JOKER-C2 login device");
  const [loginState, setLoginState] = useState<ApiState>(INITIAL_API_STATE);
  const [sessionState, setSessionState] = useState<ApiState>(INITIAL_API_STATE);

  const createPasswordHints = useMemo(
    () => buildCreatePasswordHints(createPassword, confirmPassword, handoffText),
    [confirmPassword, createPassword, handoffText]
  );

  const loginSummary = useMemo(
    () => buildLoginSummary(loginState.payload),
    [loginState.payload]
  );

  const sessionSummary = useMemo(
    () => buildSessionSummary(sessionState.payload),
    [sessionState.payload]
  );

  const activeSession = useMemo(
    () => isAuthenticated(sessionState.payload),
    [sessionState.payload]
  );

  const loginSucceeded = useMemo(
    () => isAuthenticated(loginState.payload),
    [loginState.payload]
  );

  const passwordsMatch =
    createPassword.length > 0 &&
    confirmPassword.length > 0 &&
    createPassword === confirmPassword;

  const createPasswordReady =
    createPassword.length > 0 &&
    confirmPassword.length > 0 &&
    passwordsMatch &&
    hasSymbol(createPassword) &&
    !hasWeakProjectFragment(createPassword) &&
    handoffText.trim().length > 0;

  const runSessionCheck = useCallback(async () => {
    setSessionState({
      status: "LOADING",
      httpStatus: null,
      payload: null,
      error: null,
      receivedAt: null
    });

    try {
      const response = await fetch("/api/auth/session", {
        method: "GET",
        headers: {
          Accept: "application/json"
        },
        credentials: "include",
        cache: "no-store"
      });

      const payload = await response.json();

      setSessionState({
        status: response.ok ? "SUCCESS" : "ERROR",
        httpStatus: response.status,
        payload,
        error: response.ok
          ? null
          : `HTTP ${response.status} ${response.statusText}`,
        receivedAt: nowIso()
      });
    } catch (error) {
      setSessionState({
        status: "ERROR",
        httpStatus: null,
        payload: null,
        error:
          error instanceof Error
            ? error.message
            : "UNKNOWN_SESSION_CHECK_ERROR",
        receivedAt: nowIso()
      });
    }
  }, []);

  useEffect(() => {
    const handoff = findHandoffFromUrl() || findHandoffFromStorage();

    if (handoff) {
      setHandoffText(JSON.stringify(handoff, null, 2));
      setHandoffLoaded(true);

      const ipr = extractHumanIprFromHandoff(handoff);

      if (ipr) {
        const normalized = normalizeHumanIpr(ipr);
        setCreateHumanIpr(normalized);
        setLoginHumanIpr(normalized);
      }
    } else {
      const ipr = findHumanIprFromUrl();

      if (ipr) {
        setCreateHumanIpr(ipr);
        setLoginHumanIpr(ipr);
      }
    }

    void runSessionCheck();
  }, [runSessionCheck]);

  const submitCreatePassword = useCallback(async () => {
    const normalizedHumanIpr = normalizeHumanIpr(createHumanIpr);
    const parsedHandoff = handoffText.trim()
      ? parseJsonText(handoffText.trim())
      : null;

    if (!normalizedHumanIpr) {
      setLoginState({
        status: "ERROR",
        httpStatus: null,
        payload: {
          ok: false,
          authenticated: false,
          reason: "HUMAN_IPR_MISSING",
          detail: "Human IPR is required.",
          legalCertification: false
        },
        error: "Human IPR is required.",
        receivedAt: nowIso()
      });
      return;
    }

    if (!createPassword || !confirmPassword) {
      setLoginState({
        status: "ERROR",
        httpStatus: null,
        payload: {
          ok: false,
          authenticated: false,
          reason: "IPR_PASSWORD_MISSING",
          detail: "Password and confirmation password are required.",
          legalCertification: false
        },
        error: "Password and confirmation password are required.",
        receivedAt: nowIso()
      });
      return;
    }

    if (createPassword !== confirmPassword) {
      setLoginState({
        status: "ERROR",
        httpStatus: null,
        payload: {
          ok: false,
          authenticated: false,
          reason: "IPR_PASSWORD_CONFIRMATION_MISMATCH",
          detail: "The IPR password and confirmation password do not match.",
          legalCertification: false
        },
        error: "The IPR password and confirmation password do not match.",
        receivedAt: nowIso()
      });
      return;
    }

    if (!parsedHandoff) {
      setLoginState({
        status: "ERROR",
        httpStatus: null,
        payload: {
          ok: false,
          authenticated: false,
          reason: "IPR_HANDOFF_REQUIRED",
          detail: "A valid HBCE IPR handoff JSON is required to create the password.",
          legalCertification: false
        },
        error: "A valid HBCE IPR handoff JSON is required to create the password.",
        receivedAt: nowIso()
      });
      return;
    }

    setMode("SET_PASSWORD");
    setLoginState({
      status: "LOADING",
      httpStatus: null,
      payload: null,
      error: null,
      receivedAt: null
    });

    try {
      const response = await fetch("/api/auth/ipr-login", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify({
          mode: "SET_PASSWORD",
          humanIpr: normalizedHumanIpr,
          password: createPassword,
          deviceLabel,
          iprHandoff: parsedHandoff,
          legalCertification: false
        })
      });

      const payload = await response.json();

      setLoginState({
        status: response.ok ? "SUCCESS" : "ERROR",
        httpStatus: response.status,
        payload,
        error: response.ok
          ? null
          : `HTTP ${response.status} ${response.statusText}`,
        receivedAt: nowIso()
      });

      if (response.ok) {
        setLoginHumanIpr(normalizedHumanIpr);
        setLoginPassword(createPassword);
        await runSessionCheck();
      }
    } catch (error) {
      setLoginState({
        status: "ERROR",
        httpStatus: null,
        payload: null,
        error:
          error instanceof Error
            ? error.message
            : "UNKNOWN_IPR_SET_PASSWORD_ERROR",
        receivedAt: nowIso()
      });
    }
  }, [
    confirmPassword,
    createHumanIpr,
    createPassword,
    deviceLabel,
    handoffText,
    runSessionCheck
  ]);

  const submitLogin = useCallback(async () => {
    const normalizedHumanIpr = normalizeHumanIpr(loginHumanIpr);

    if (!normalizedHumanIpr) {
      setLoginState({
        status: "ERROR",
        httpStatus: null,
        payload: {
          ok: false,
          authenticated: false,
          reason: "HUMAN_IPR_MISSING",
          detail: "Human IPR is required.",
          legalCertification: false
        },
        error: "Human IPR is required.",
        receivedAt: nowIso()
      });
      return;
    }

    if (!loginPassword) {
      setLoginState({
        status: "ERROR",
        httpStatus: null,
        payload: {
          ok: false,
          authenticated: false,
          reason: "IPR_PASSWORD_MISSING",
          detail: "IPR password is required.",
          legalCertification: false
        },
        error: "IPR password is required.",
        receivedAt: nowIso()
      });
      return;
    }

    setMode("LOGIN");
    setLoginState({
      status: "LOADING",
      httpStatus: null,
      payload: null,
      error: null,
      receivedAt: null
    });

    try {
      const response = await fetch("/api/auth/ipr-login", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify({
          mode: "LOGIN",
          humanIpr: normalizedHumanIpr,
          password: loginPassword,
          deviceLabel,
          legalCertification: false
        })
      });

      const payload = await response.json();

      setLoginState({
        status: response.ok ? "SUCCESS" : "ERROR",
        httpStatus: response.status,
        payload,
        error: response.ok
          ? null
          : `HTTP ${response.status} ${response.statusText}`,
        receivedAt: nowIso()
      });

      if (response.ok) {
        await runSessionCheck();
      }
    } catch (error) {
      setLoginState({
        status: "ERROR",
        httpStatus: null,
        payload: null,
        error:
          error instanceof Error
            ? error.message
            : "UNKNOWN_IPR_LOGIN_ERROR",
        receivedAt: nowIso()
      });
    }
  }, [deviceLabel, loginHumanIpr, loginPassword, runSessionCheck]);

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "32px",
        background:
          "radial-gradient(circle at top, rgba(56,189,248,0.13), transparent 34%), #05070a",
        color: "#f8fafc",
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
      }}
    >
      <section style={{ width: "100%", maxWidth: "1180px", margin: "0 auto" }}>
        <header style={{ display: "grid", gap: "12px", marginBottom: "28px" }}>
          <p
            style={{
              margin: 0,
              color: "#9ca3af",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              fontSize: "12px"
            }}
          >
            HERMETICUM - BLINDATA · COMPUTABILE · EVOLUTIVA
          </p>

          <h1
            style={{
              margin: 0,
              fontSize: "clamp(34px, 5vw, 58px)",
              lineHeight: 1
            }}
          >
            JOKER-C2 IPR Access
          </h1>

          <p
            style={{
              margin: 0,
              maxWidth: "860px",
              color: "#cbd5e1",
              fontSize: "17px",
              lineHeight: 1.6
            }}
          >
            Create an IPR password after verified onboarding, or login with an
            existing IPR password to enter AI JOKER-C2 through a persistent
            HBCE account session.
          </p>

          <p style={{ margin: 0, color: "#94a3b8", fontSize: "14px" }}>
            HERMETICUM B.C.E. S.r.l.
          </p>
        </header>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
            gap: "18px",
            marginBottom: "18px"
          }}
        >
          <article
            style={{
              border: "1px solid rgba(148,163,184,0.28)",
              borderRadius: "18px",
              padding: "20px",
              background:
                mode === "SET_PASSWORD"
                  ? "rgba(8,47,73,0.78)"
                  : "rgba(15,23,42,0.76)",
              boxShadow: "0 18px 60px rgba(0,0,0,0.28)"
            }}
          >
            <h2 style={{ marginTop: 0, marginBottom: "10px", fontSize: "22px" }}>
              1. Create IPR password
            </h2>

            <p
              style={{
                marginTop: 0,
                marginBottom: "18px",
                color: "#cbd5e1",
                lineHeight: 1.55,
                fontSize: "14px"
              }}
            >
              Use this only after verified IPR onboarding. It creates or updates
              the password linked to the verified Human IPR account.
            </p>

            <div style={{ display: "grid", gap: "14px" }}>
              <label style={labelStyle}>
                Human IPR
                <input
                  value={createHumanIpr}
                  onChange={(event) => setCreateHumanIpr(event.target.value)}
                  spellCheck={false}
                  autoCapitalize="characters"
                  autoComplete="username"
                  style={monoInputStyle}
                />
              </label>

              <label style={labelStyle}>
                Create password
                <input
                  value={createPassword}
                  onChange={(event) => setCreatePassword(event.target.value)}
                  type="password"
                  autoComplete="new-password"
                  style={inputStyle}
                />
              </label>

              <label style={labelStyle}>
                Confirm password
                <input
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  type="password"
                  autoComplete="new-password"
                  style={inputStyle}
                />
              </label>

              <section
                style={{
                  border: "1px solid rgba(148,163,184,0.22)",
                  borderRadius: "14px",
                  padding: "12px",
                  background: "rgba(2,6,23,0.62)"
                }}
              >
                <p
                  style={{
                    margin: "0 0 8px",
                    color: "#e2e8f0",
                    fontWeight: 800,
                    fontSize: "14px"
                  }}
                >
                  Create password checks
                </p>

                <ul
                  style={{
                    margin: 0,
                    paddingLeft: "18px",
                    color: "#cbd5e1",
                    fontSize: "13px",
                    lineHeight: 1.6
                  }}
                >
                  <li>Password inserted: {createPassword ? "yes" : "no"}</li>
                  <li>Confirmation match: {passwordsMatch ? "yes" : "no"}</li>
                  <li>Includes symbol: {hasSymbol(createPassword) ? "yes" : "no"}</li>
                  <li>
                    Obvious project fragment:{" "}
                    {hasWeakProjectFragment(createPassword)
                      ? "detected"
                      : "not detected"}
                  </li>
                  <li>Verified handoff loaded: {handoffLoaded ? "yes" : "no"}</li>
                </ul>

                {createPasswordHints.length > 0 ? (
                  <p
                    style={{
                      margin: "10px 0 0",
                      color: "#fbbf24",
                      fontSize: "13px",
                      lineHeight: 1.5
                    }}
                  >
                    {createPasswordHints.join(" ")}
                  </p>
                ) : (
                  <p
                    style={{
                      margin: "10px 0 0",
                      color: "#86efac",
                      fontSize: "13px",
                      lineHeight: 1.5
                    }}
                  >
                    Client-side checks passed. Server-side policy remains
                    authoritative.
                  </p>
                )}
              </section>

              <details>
                <summary
                  style={{
                    cursor: "pointer",
                    color: "#dbeafe",
                    fontWeight: 800,
                    fontSize: "14px"
                  }}
                >
                  HBCE IPR handoff JSON
                </summary>

                <textarea
                  value={handoffText}
                  onChange={(event) => setHandoffText(event.target.value)}
                  placeholder="Required for password creation."
                  spellCheck={false}
                  rows={8}
                  style={{
                    ...monoInputStyle,
                    marginTop: "10px",
                    width: "100%",
                    resize: "vertical",
                    lineHeight: 1.45
                  }}
                />
              </details>

              <button
                type="button"
                onClick={submitCreatePassword}
                disabled={loginState.status === "LOADING" || !createPasswordReady}
                style={{
                  ...primaryButtonStyle,
                  cursor:
                    loginState.status === "LOADING" || !createPasswordReady
                      ? "not-allowed"
                      : "pointer",
                  opacity:
                    loginState.status === "LOADING" || !createPasswordReady
                      ? 0.65
                      : 1
                }}
              >
                {loginState.status === "LOADING" && mode === "SET_PASSWORD"
                  ? "Creating password..."
                  : "Create IPR password"}
              </button>
            </div>
          </article>

          <article
            style={{
              border: "1px solid rgba(148,163,184,0.28)",
              borderRadius: "18px",
              padding: "20px",
              background:
                mode === "LOGIN"
                  ? "rgba(20,83,45,0.42)"
                  : "rgba(15,23,42,0.76)",
              boxShadow: "0 18px 60px rgba(0,0,0,0.28)"
            }}
          >
            <h2 style={{ marginTop: 0, marginBottom: "10px", fontSize: "22px" }}>
              2. Login to JOKER-C2
            </h2>

            <p
              style={{
                marginTop: 0,
                marginBottom: "18px",
                color: "#cbd5e1",
                lineHeight: 1.55,
                fontSize: "14px"
              }}
            >
              Use this after the password already exists. One Human IPR, one
              password, then enter the governed runtime. Miracolo: un login che
              somiglia a un login.
            </p>

            <div style={{ display: "grid", gap: "14px" }}>
              <label style={labelStyle}>
                Human IPR
                <input
                  value={loginHumanIpr}
                  onChange={(event) => setLoginHumanIpr(event.target.value)}
                  spellCheck={false}
                  autoCapitalize="characters"
                  autoComplete="username"
                  style={monoInputStyle}
                />
              </label>

              <label style={labelStyle}>
                IPR password
                <input
                  value={loginPassword}
                  onChange={(event) => setLoginPassword(event.target.value)}
                  type="password"
                  autoComplete="current-password"
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      void submitLogin();
                    }
                  }}
                  style={inputStyle}
                />
              </label>

              <label style={labelStyle}>
                Device label
                <input
                  value={deviceLabel}
                  onChange={(event) => setDeviceLabel(event.target.value)}
                  autoComplete="off"
                  style={inputStyle}
                />
              </label>

              <button
                type="button"
                onClick={submitLogin}
                disabled={loginState.status === "LOADING"}
                style={{
                  ...primaryButtonStyle,
                  cursor:
                    loginState.status === "LOADING"
                      ? "not-allowed"
                      : "pointer"
                }}
              >
                {loginState.status === "LOADING" && mode === "LOGIN"
                  ? "Logging in..."
                  : "Login to JOKER-C2"}
              </button>

              <button
                type="button"
                onClick={runSessionCheck}
                disabled={sessionState.status === "LOADING"}
                style={{
                  ...secondaryButtonStyle,
                  cursor:
                    sessionState.status === "LOADING"
                      ? "not-allowed"
                      : "pointer"
                }}
              >
                {sessionState.status === "LOADING"
                  ? "Checking session..."
                  : "Check IPR session"}
              </button>

              <a
                href="/interface"
                style={{
                  display: "inline-flex",
                  justifyContent: "center",
                  textDecoration: "none",
                  border: "1px solid rgba(148,163,184,0.35)",
                  borderRadius: "999px",
                  padding: "13px 18px",
                  background:
                    activeSession || loginSucceeded
                      ? "#22c55e"
                      : "rgba(15,23,42,0.9)",
                  color:
                    activeSession || loginSucceeded ? "#020617" : "#f8fafc",
                  fontWeight: 900,
                  fontSize: "15px"
                }}
              >
                Open JOKER-C2 interface
              </a>
            </div>
          </article>
        </section>

        <section
          style={{
            border: "1px solid rgba(148,163,184,0.28)",
            borderRadius: "18px",
            padding: "20px",
            background: "rgba(15,23,42,0.76)",
            boxShadow: "0 18px 60px rgba(0,0,0,0.28)",
            marginBottom: "18px"
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: "10px", fontSize: "22px" }}>
            Access status
          </h2>

          <div
            style={{
              border: "1px solid rgba(148,163,184,0.22)",
              borderRadius: "14px",
              padding: "14px",
              background:
                activeSession || loginSucceeded
                  ? "rgba(34,197,94,0.12)"
                  : "rgba(2,6,23,0.62)",
              marginBottom: "16px"
            }}
          >
            <p
              style={{
                margin: 0,
                color: activeSession || loginSucceeded ? "#86efac" : "#fbbf24",
                fontWeight: 900,
                fontSize: "15px"
              }}
            >
              {activeSession || loginSucceeded
                ? "IPR account session active."
                : "IPR account session not active yet."}
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "18px"
            }}
          >
            <div>
              <p style={statusTitleStyle}>
                Login request: {getStatusLabel(loginState)}
              </p>

              {loginState.httpStatus ? (
                <p style={statusTextStyle}>HTTP: {loginState.httpStatus}</p>
              ) : null}

              {loginState.receivedAt ? (
                <p style={statusTextStyle}>Received: {loginState.receivedAt}</p>
              ) : null}

              {loginState.error ? (
                <p style={errorTextStyle}>Error: {loginState.error}</p>
              ) : null}

              <ul style={summaryListStyle}>
                {loginSummary.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div>
              <p style={statusTitleStyle}>
                Session check: {getStatusLabel(sessionState)}
              </p>

              {sessionState.httpStatus ? (
                <p style={statusTextStyle}>HTTP: {sessionState.httpStatus}</p>
              ) : null}

              {sessionState.receivedAt ? (
                <p style={statusTextStyle}>Received: {sessionState.receivedAt}</p>
              ) : null}

              {sessionState.error ? (
                <p style={errorTextStyle}>Error: {sessionState.error}</p>
              ) : null}

              <ul style={summaryListStyle}>
                {sessionSummary.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section
          style={{
            border: "1px solid rgba(148,163,184,0.22)",
            borderRadius: "18px",
            padding: "18px",
            background: "rgba(2,6,23,0.78)",
            marginBottom: "18px"
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: "8px", fontSize: "20px" }}>
            Operational boundary
          </h2>

          <p style={{ margin: 0, color: "#cbd5e1", lineHeight: 1.6 }}>
            {PAGE_BOUNDARY}
          </p>
        </section>

        <section style={{ display: "grid", gap: "18px" }}>
          <details
            style={{
              border: "1px solid rgba(148,163,184,0.22)",
              borderRadius: "18px",
              padding: "18px",
              background: "rgba(2,6,23,0.78)"
            }}
          >
            <summary
              style={{
                cursor: "pointer",
                fontWeight: 900,
                marginBottom: "12px"
              }}
            >
              Login response
            </summary>

            <pre style={preStyle}>
              {stringifyPayload(
                loginState.payload || {
                  status: loginState.status,
                  error: loginState.error
                }
              )}
            </pre>
          </details>

          <details
            style={{
              border: "1px solid rgba(148,163,184,0.22)",
              borderRadius: "18px",
              padding: "18px",
              background: "rgba(2,6,23,0.78)"
            }}
          >
            <summary
              style={{
                cursor: "pointer",
                fontWeight: 900,
                marginBottom: "12px"
              }}
            >
              Session response
            </summary>

            <pre style={preStyle}>
              {stringifyPayload(
                sessionState.payload || {
                  status: sessionState.status,
                  error: sessionState.error
                }
              )}
            </pre>
          </details>
        </section>
      </section>
    </main>
  );
}

const labelStyle: React.CSSProperties = {
  display: "grid",
  gap: "7px",
  color: "#cbd5e1",
  fontSize: "14px",
  fontWeight: 700
};

const inputStyle: React.CSSProperties = {
  border: "1px solid rgba(148,163,184,0.35)",
  borderRadius: "12px",
  padding: "12px 13px",
  background: "#020617",
  color: "#f8fafc",
  fontSize: "15px"
};

const monoInputStyle: React.CSSProperties = {
  ...inputStyle,
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace"
};

const primaryButtonStyle: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.22)",
  borderRadius: "999px",
  padding: "13px 18px",
  background: "#38bdf8",
  color: "#020617",
  fontWeight: 900,
  fontSize: "15px"
};

const secondaryButtonStyle: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.22)",
  borderRadius: "999px",
  padding: "13px 18px",
  background: "#f8fafc",
  color: "#020617",
  fontWeight: 800,
  fontSize: "15px"
};

const statusTitleStyle: React.CSSProperties = {
  margin: "0 0 8px",
  color: "#e2e8f0",
  fontWeight: 900,
  fontSize: "15px"
};

const statusTextStyle: React.CSSProperties = {
  margin: "0 0 6px",
  color: "#cbd5e1",
  fontSize: "13px"
};

const errorTextStyle: React.CSSProperties = {
  margin: "0 0 6px",
  color: "#fca5a5",
  fontSize: "13px"
};

const summaryListStyle: React.CSSProperties = {
  margin: "10px 0 0",
  paddingLeft: "18px",
  color: "#cbd5e1",
  fontSize: "14px",
  lineHeight: 1.65
};

const preStyle: React.CSSProperties = {
  overflowX: "auto",
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
  margin: 0,
  padding: "16px",
  borderRadius: "14px",
  background: "#020617",
  color: "#dbeafe",
  fontSize: "13px",
  lineHeight: 1.5
};
