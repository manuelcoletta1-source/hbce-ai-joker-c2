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
  "This page creates or verifies an HBCE IPR account session for AI JOKER-C2. It does not issue official identity, does not replace CIE, SPID, EUDI Wallet, passport, codice fiscale or eIDAS qualified trust services, and does not create legal certification.";

const WEAK_PROJECT_FRAGMENTS = [
  "joker",
  "hbce",
  "matrix",
  "ipr",
  "manuel",
  "coletta",
  "hermeticum",
  "bce",
  "ai",
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

function buildLoginSummary(payload: unknown): string[] {
  const authenticated = isRecord(payload) ? payload.authenticated : undefined;
  const reason = isRecord(payload) ? payload.reason : undefined;
  const mode = isRecord(payload) ? payload.mode : undefined;
  const humanIpr = isRecord(payload) ? payload.humanIpr : undefined;
  const access =
    isRecord(payload) && isRecord(payload.access) ? payload.access : {};
  const memory =
    isRecord(payload) && isRecord(payload.memory) ? payload.memory : {};
  const passwordPolicy =
    isRecord(payload) && isRecord(payload.passwordPolicy)
      ? payload.passwordPolicy
      : null;
  const violations =
    passwordPolicy && Array.isArray(passwordPolicy.violations)
      ? passwordPolicy.violations
          .map((item) => (typeof item === "string" ? item : ""))
          .filter(Boolean)
      : [];

  return [
    `Authenticated: ${
      typeof authenticated === "boolean" ? String(authenticated) : "unknown"
    }`,
    `Reason: ${typeof reason === "string" ? reason : "unknown"}`,
    `Mode: ${typeof mode === "string" ? mode : "unknown"}`,
    `Human IPR: ${typeof humanIpr === "string" ? humanIpr : "unknown"}`,
    `Access source: ${
      typeof access.source === "string" ? access.source : "unknown"
    }`,
    `Memory persistence: ${
      typeof memory.persistenceMode === "string"
        ? memory.persistenceMode
        : "unknown"
    }`,
    `Password violations: ${
      violations.length > 0 ? violations.join(" | ") : "none"
    }`
  ];
}

function buildSessionSummary(payload: unknown): string[] {
  const authenticated = isRecord(payload) ? payload.authenticated : undefined;
  const reason = isRecord(payload) ? payload.reason : undefined;
  const access =
    isRecord(payload) && isRecord(payload.access) ? payload.access : {};
  const matrix =
    isRecord(payload) && isRecord(payload.matrix) ? payload.matrix : {};
  const memory =
    isRecord(payload) && isRecord(payload.memory) ? payload.memory : {};

  return [
    `Authenticated: ${
      typeof authenticated === "boolean" ? String(authenticated) : "unknown"
    }`,
    `Reason: ${typeof reason === "string" ? reason : "unknown"}`,
    `Access source: ${
      typeof access.source === "string" ? access.source : "unknown"
    }`,
    `Matrix state: ${
      typeof matrix.expectedState === "string"
        ? matrix.expectedState
        : "unknown"
    }`,
    `Memory scope: ${
      typeof memory.expectedScope === "string"
        ? memory.expectedScope
        : "unknown"
    }`,
    `Memory persistence: ${
      typeof memory.persistenceMode === "string"
        ? memory.persistenceMode
        : "unknown"
    }`
  ];
}

function hasSymbol(password: string): boolean {
  return /[^A-Za-z0-9]/.test(password);
}

function hasProjectObviousFragment(password: string): boolean {
  const normalized = password.toLowerCase();

  return WEAK_PROJECT_FRAGMENTS.some((fragment) =>
    normalized.includes(fragment)
  );
}

function buildClientPasswordHints(
  mode: LoginMode,
  password: string,
  confirmPassword: string
): string[] {
  const hints: string[] = [];

  if (!password) {
    hints.push("Password is required.");
  }

  if (mode === "SET_PASSWORD" && password !== confirmPassword) {
    hints.push("Password confirmation does not match.");
  }

  if (password && !hasSymbol(password)) {
    hints.push("Password should include at least one symbol.");
  }

  if (password && hasProjectObviousFragment(password)) {
    hints.push(
      "Password should not include obvious project or personal fragments."
    );
  }

  return hints;
}

export default function HbceIprLoginPage() {
  const [mode, setMode] = useState<LoginMode>("SET_PASSWORD");
  const [humanIpr, setHumanIpr] = useState(HUMAN_IPR_CANONICAL);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [deviceLabel, setDeviceLabel] = useState("JOKER-C2 access device");
  const [handoffText, setHandoffText] = useState("");
  const [handoffLoaded, setHandoffLoaded] = useState(false);
  const [loginState, setLoginState] = useState<ApiState>(INITIAL_API_STATE);
  const [sessionState, setSessionState] =
    useState<ApiState>(INITIAL_API_STATE);

  const clientPasswordHints = useMemo(
    () => buildClientPasswordHints(mode, password, confirmPassword),
    [confirmPassword, mode, password]
  );

  const passwordsMatch = useMemo(
    () =>
      mode === "LOGIN" ||
      (password.length > 0 &&
        confirmPassword.length > 0 &&
        password === confirmPassword),
    [confirmPassword, mode, password]
  );

  const passwordHasSymbol = useMemo(() => hasSymbol(password), [password]);

  const passwordHasWeakFragment = useMemo(
    () => hasProjectObviousFragment(password),
    [password]
  );

  const loginSummary = useMemo(
    () => buildLoginSummary(loginState.payload),
    [loginState.payload]
  );

  const sessionSummary = useMemo(
    () => buildSessionSummary(sessionState.payload),
    [sessionState.payload]
  );

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
        setHumanIpr(normalizeHumanIpr(ipr));
      }
    } else {
      const ipr = findHumanIprFromUrl();

      if (ipr) {
        setHumanIpr(ipr);
      }
    }

    void runSessionCheck();
  }, [runSessionCheck]);

  const submitLogin = useCallback(async () => {
    const normalizedHumanIpr = normalizeHumanIpr(humanIpr);
    const parsedHandoff = handoffText.trim()
      ? parseJsonText(handoffText.trim())
      : null;

    if (mode === "SET_PASSWORD") {
      if (password !== confirmPassword) {
        setLoginState({
          status: "ERROR",
          httpStatus: null,
          payload: {
            ok: false,
            authenticated: false,
            reason: "IPR_PASSWORD_CONFIRMATION_MISMATCH",
            detail:
              "The IPR password and confirmation password do not match.",
            legalCertification: false
          },
          error: "The IPR password and confirmation password do not match.",
          receivedAt: nowIso()
        });
        return;
      }

      if (!passwordHasSymbol) {
        setLoginState({
          status: "ERROR",
          httpStatus: null,
          payload: {
            ok: false,
            authenticated: false,
            reason: "IPR_PASSWORD_CLIENT_POLICY_FAILED",
            detail: "Password should include at least one symbol.",
            legalCertification: false
          },
          error: "Password should include at least one symbol.",
          receivedAt: nowIso()
        });
        return;
      }

      if (passwordHasWeakFragment) {
        setLoginState({
          status: "ERROR",
          httpStatus: null,
          payload: {
            ok: false,
            authenticated: false,
            reason: "IPR_PASSWORD_CLIENT_POLICY_FAILED",
            detail:
              "Password should not include obvious project or personal fragments.",
            weakFragments: WEAK_PROJECT_FRAGMENTS,
            legalCertification: false
          },
          error:
            "Password should not include obvious project or personal fragments.",
          receivedAt: nowIso()
        });
        return;
      }

      if (handoffText.trim() && !parsedHandoff) {
        setLoginState({
          status: "ERROR",
          httpStatus: null,
          payload: {
            ok: false,
            authenticated: false,
            reason: "IPR_HANDOFF_JSON_INVALID",
            detail: "IPR handoff JSON is invalid.",
            legalCertification: false
          },
          error: "IPR handoff JSON is invalid.",
          receivedAt: nowIso()
        });
        return;
      }
    }

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
          mode,
          humanIpr: normalizedHumanIpr,
          password,
          deviceLabel,
          iprHandoff: mode === "SET_PASSWORD" ? parsedHandoff : undefined,
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
  }, [
    confirmPassword,
    deviceLabel,
    handoffText,
    humanIpr,
    mode,
    password,
    passwordHasSymbol,
    passwordHasWeakFragment,
    runSessionCheck
  ]);

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "32px",
        background:
          "radial-gradient(circle at top, rgba(56,189,248,0.12), transparent 34%), #05070a",
        color: "#f8fafc",
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: "1120px",
          margin: "0 auto"
        }}
      >
        <header
          style={{
            display: "grid",
            gap: "12px",
            marginBottom: "28px"
          }}
        >
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
            JOKER-C2 IPR Login
          </h1>

          <p
            style={{
              margin: 0,
              maxWidth: "840px",
              color: "#cbd5e1",
              fontSize: "17px",
              lineHeight: 1.6
            }}
          >
            Persistent HBCE IPR account access for AI JOKER-C2. Use SET_PASSWORD
            on the verified onboarding device, then use LOGIN from another
            device with the same Human IPR and password.
          </p>

          <p
            style={{
              margin: 0,
              color: "#94a3b8",
              fontSize: "14px"
            }}
          >
            HERMETICUM B.C.E. S.r.l.
          </p>
        </header>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))",
            gap: "18px",
            marginBottom: "18px"
          }}
        >
          <article
            style={{
              border: "1px solid rgba(148,163,184,0.28)",
              borderRadius: "18px",
              padding: "20px",
              background: "rgba(15,23,42,0.76)",
              boxShadow: "0 18px 60px rgba(0,0,0,0.28)"
            }}
          >
            <h2
              style={{
                marginTop: 0,
                marginBottom: "10px",
                fontSize: "22px"
              }}
            >
              IPR account access
            </h2>

            <div
              style={{
                display: "grid",
                gap: "14px"
              }}
            >
              <label
                style={{
                  display: "grid",
                  gap: "7px",
                  color: "#cbd5e1",
                  fontSize: "14px",
                  fontWeight: 700
                }}
              >
                Mode
                <select
                  value={mode}
                  onChange={(event) =>
                    setMode(event.target.value as LoginMode)
                  }
                  style={{
                    border: "1px solid rgba(148,163,184,0.35)",
                    borderRadius: "12px",
                    padding: "11px 12px",
                    background: "#020617",
                    color: "#f8fafc",
                    fontSize: "15px"
                  }}
                >
                  <option value="SET_PASSWORD">
                    SET_PASSWORD - first verified setup
                  </option>
                  <option value="LOGIN">
                    LOGIN - existing IPR account
                  </option>
                </select>
              </label>

              <label
                style={{
                  display: "grid",
                  gap: "7px",
                  color: "#cbd5e1",
                  fontSize: "14px",
                  fontWeight: 700
                }}
              >
                Human IPR
                <input
                  value={humanIpr}
                  onChange={(event) => setHumanIpr(event.target.value)}
                  spellCheck={false}
                  autoCapitalize="characters"
                  style={{
                    border: "1px solid rgba(148,163,184,0.35)",
                    borderRadius: "12px",
                    padding: "11px 12px",
                    background: "#020617",
                    color: "#f8fafc",
                    fontSize: "15px",
                    fontFamily:
                      "ui-monospace, SFMono-Regular, Menlo, monospace"
                  }}
                />
              </label>

              <label
                style={{
                  display: "grid",
                  gap: "7px",
                  color: "#cbd5e1",
                  fontSize: "14px",
                  fontWeight: 700
                }}
              >
                IPR password
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type="password"
                  autoComplete={
                    mode === "SET_PASSWORD"
                      ? "new-password"
                      : "current-password"
                  }
                  style={{
                    border: "1px solid rgba(148,163,184,0.35)",
                    borderRadius: "12px",
                    padding: "11px 12px",
                    background: "#020617",
                    color: "#f8fafc",
                    fontSize: "15px"
                  }}
                />
              </label>

              {mode === "SET_PASSWORD" ? (
                <label
                  style={{
                    display: "grid",
                    gap: "7px",
                    color: "#cbd5e1",
                    fontSize: "14px",
                    fontWeight: 700
                  }}
                >
                  Confirm IPR password
                  <input
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(event.target.value)
                    }
                    type="password"
                    autoComplete="new-password"
                    style={{
                      border: "1px solid rgba(148,163,184,0.35)",
                      borderRadius: "12px",
                      padding: "11px 12px",
                      background: "#020617",
                      color: "#f8fafc",
                      fontSize: "15px"
                    }}
                  />
                </label>
              ) : null}

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
                  Password checks
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
                  <li>
                    Password inserted: {password ? "yes" : "no"}
                  </li>
                  <li>
                    Confirmation match:{" "}
                    {mode === "LOGIN"
                      ? "not required for LOGIN"
                      : passwordsMatch
                        ? "yes"
                        : "no"}
                  </li>
                  <li>
                    Includes symbol: {passwordHasSymbol ? "yes" : "no"}
                  </li>
                  <li>
                    Obvious project fragment:{" "}
                    {passwordHasWeakFragment ? "detected" : "not detected"}
                  </li>
                </ul>

                {clientPasswordHints.length > 0 ? (
                  <p
                    style={{
                      margin: "10px 0 0",
                      color: "#fbbf24",
                      fontSize: "13px",
                      lineHeight: 1.5
                    }}
                  >
                    {clientPasswordHints.join(" ")}
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
                    Client-side password checks passed. Server-side policy still
                    performs the authoritative verification.
                  </p>
                )}
              </section>

              <label
                style={{
                  display: "grid",
                  gap: "7px",
                  color: "#cbd5e1",
                  fontSize: "14px",
                  fontWeight: 700
                }}
              >
                Device label
                <input
                  value={deviceLabel}
                  onChange={(event) => setDeviceLabel(event.target.value)}
                  style={{
                    border: "1px solid rgba(148,163,184,0.35)",
                    borderRadius: "12px",
                    padding: "11px 12px",
                    background: "#020617",
                    color: "#f8fafc",
                    fontSize: "15px"
                  }}
                />
              </label>

              <label
                style={{
                  display: "grid",
                  gap: "7px",
                  color: "#cbd5e1",
                  fontSize: "14px",
                  fontWeight: 700
                }}
              >
                HBCE IPR handoff JSON
                <textarea
                  value={handoffText}
                  onChange={(event) => setHandoffText(event.target.value)}
                  placeholder="Required for SET_PASSWORD. Not required for LOGIN after the account exists."
                  spellCheck={false}
                  rows={9}
                  style={{
                    border: "1px solid rgba(148,163,184,0.35)",
                    borderRadius: "12px",
                    padding: "11px 12px",
                    background: "#020617",
                    color: "#f8fafc",
                    fontSize: "13px",
                    fontFamily:
                      "ui-monospace, SFMono-Regular, Menlo, monospace",
                    lineHeight: 1.45,
                    resize: "vertical"
                  }}
                />
              </label>

              <p
                style={{
                  margin: 0,
                  color: handoffLoaded ? "#86efac" : "#fbbf24",
                  fontSize: "13px",
                  lineHeight: 1.5
                }}
              >
                {handoffLoaded
                  ? "IPR handoff loaded from URL or browser storage."
                  : "No IPR handoff auto-loaded. SET_PASSWORD requires a valid handoff from the onboarding flow."}
              </p>

              <button
                type="button"
                onClick={submitLogin}
                disabled={loginState.status === "LOADING"}
                style={{
                  cursor:
                    loginState.status === "LOADING"
                      ? "not-allowed"
                      : "pointer",
                  border: "1px solid rgba(255,255,255,0.22)",
                  borderRadius: "999px",
                  padding: "12px 18px",
                  background: "#38bdf8",
                  color: "#020617",
                  fontWeight: 900,
                  fontSize: "15px"
                }}
              >
                {loginState.status === "LOADING"
                  ? "Processing..."
                  : mode === "SET_PASSWORD"
                    ? "Create IPR password session"
                    : "Login with IPR password"}
              </button>

              <button
                type="button"
                onClick={runSessionCheck}
                disabled={sessionState.status === "LOADING"}
                style={{
                  cursor:
                    sessionState.status === "LOADING"
                      ? "not-allowed"
                      : "pointer",
                  border: "1px solid rgba(255,255,255,0.22)",
                  borderRadius: "999px",
                  padding: "12px 18px",
                  background: "#f8fafc",
                  color: "#020617",
                  fontWeight: 800,
                  fontSize: "15px"
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
                  padding: "12px 18px",
                  background: "rgba(15,23,42,0.9)",
                  color: "#f8fafc",
                  fontWeight: 800,
                  fontSize: "15px"
                }}
              >
                Open JOKER-C2 interface
              </a>
            </div>
          </article>

          <article
            style={{
              border: "1px solid rgba(148,163,184,0.28)",
              borderRadius: "18px",
              padding: "20px",
              background: "rgba(15,23,42,0.76)",
              boxShadow: "0 18px 60px rgba(0,0,0,0.28)"
            }}
          >
            <h2
              style={{
                marginTop: 0,
                marginBottom: "10px",
                fontSize: "22px"
              }}
            >
              Session status
            </h2>

            <div
              style={{
                color: "#e2e8f0",
                fontSize: "14px",
                lineHeight: 1.65,
                marginBottom: "14px"
              }}
            >
              <strong>Login request:</strong> {getStatusLabel(loginState)}
              {loginState.httpStatus ? (
                <>
                  <br />
                  <strong>Login HTTP:</strong> {loginState.httpStatus}
                </>
              ) : null}
              {loginState.receivedAt ? (
                <>
                  <br />
                  <strong>Login received:</strong> {loginState.receivedAt}
                </>
              ) : null}
              {loginState.error ? (
                <>
                  <br />
                  <strong>Login error:</strong> {loginState.error}
                </>
              ) : null}
            </div>

            <ul
              style={{
                margin: "0 0 18px",
                paddingLeft: "18px",
                color: "#cbd5e1",
                fontSize: "14px",
                lineHeight: 1.65
              }}
            >
              {loginSummary.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <div
              style={{
                color: "#e2e8f0",
                fontSize: "14px",
                lineHeight: 1.65,
                marginBottom: "14px"
              }}
            >
              <strong>Session check:</strong> {getStatusLabel(sessionState)}
              {sessionState.httpStatus ? (
                <>
                  <br />
                  <strong>Session HTTP:</strong> {sessionState.httpStatus}
                </>
              ) : null}
              {sessionState.receivedAt ? (
                <>
                  <br />
                  <strong>Session received:</strong> {sessionState.receivedAt}
                </>
              ) : null}
              {sessionState.error ? (
                <>
                  <br />
                  <strong>Session error:</strong> {sessionState.error}
                </>
              ) : null}
            </div>

            <ul
              style={{
                margin: 0,
                paddingLeft: "18px",
                color: "#cbd5e1",
                fontSize: "14px",
                lineHeight: 1.65
              }}
            >
              {sessionSummary.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
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
          <h2
            style={{
              marginTop: 0,
              marginBottom: "8px",
              fontSize: "20px"
            }}
          >
            Operational boundary
          </h2>

          <p
            style={{
              margin: 0,
              color: "#cbd5e1",
              lineHeight: 1.6
            }}
          >
            {PAGE_BOUNDARY}
          </p>
        </section>

        <section
          style={{
            display: "grid",
            gap: "18px"
          }}
        >
          <details
            style={{
              border: "1px solid rgba(148,163,184,0.22)",
              borderRadius: "18px",
              padding: "18px",
              background: "rgba(2,6,23,0.78)"
            }}
            open
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

            <pre
              style={{
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
              }}
            >
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

            <pre
              style={{
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
              }}
            >
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
