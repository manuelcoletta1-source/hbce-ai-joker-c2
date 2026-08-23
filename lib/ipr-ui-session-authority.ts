export type UiSessionAuthorityInput = {
  authenticated?: boolean;
  sessionAuthenticated?: boolean;
  authorized?: boolean;
  access?: unknown;
  matrix?: unknown;
  memory?: unknown;
};

export type UiSessionAuthorityContract = {
  hasSessionPresence: boolean;
  hasResolvedAccountSession: boolean;
  hasServerAuthorizedSession: boolean;
};

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function readAccessDecision(
  session: UiSessionAuthorityInput | null | undefined
): string {
  if (!session || !isRecord(session.access)) {
    return "";
  }

  const decision =
    session.access.decision ??
    session.access.accessDecision;

  return typeof decision === "string"
    ? decision
    : "";
}

export function deriveUiSessionAuthority(
  session: UiSessionAuthorityInput | null | undefined
): UiSessionAuthorityContract {
  const hasSessionPresence =
    session?.sessionAuthenticated === true ||
    session?.authenticated === true;

  const hasResolvedAccountSession =
    session?.authenticated === true;

  const hasServerAuthorizedSession =
    hasSessionPresence &&
    hasResolvedAccountSession &&
    session?.authorized === true &&
    readAccessDecision(session) ===
      "ACCESS_GRANTED";

  return {
    hasSessionPresence,
    hasResolvedAccountSession,
    hasServerAuthorizedSession
  };
}

export type UiSessionAuthorityFrame = {
  accessDecision: string;
  identityBinding: string;
  matrixState: string;
  memoryScope: string;
  memoryAuthority: string;
};

function readFrameString(
  frame: unknown,
  keys: string[]
): string {
  if (!isRecord(frame)) {
    return "";
  }

  for (const key of keys) {
    const value = frame[key];

    if (
      typeof value === "string" &&
      value.trim()
    ) {
      return value.trim();
    }
  }

  return "";
}

export function deriveUiSessionAuthorityFrame(
  session: UiSessionAuthorityInput | null | undefined
): UiSessionAuthorityFrame | null {
  const authority =
    deriveUiSessionAuthority(session);

  if (!authority.hasSessionPresence) {
    return null;
  }

  return {
    accessDecision:
      readFrameString(
        session?.access,
        ["decision", "accessDecision"]
      ) ||
      "SERVER_VALIDATION_REQUIRED",

    identityBinding:
      readFrameString(
        session?.access,
        ["identityBinding", "identity_binding"]
      ) ||
      "NOT_VERIFIED",

    matrixState:
      readFrameString(
        session?.matrix,
        ["expectedState", "state"]
      ) ||
      "MATRIX_LIMITED",

    memoryScope:
      readFrameString(
        session?.memory,
        ["expectedScope", "scope"]
      ) ||
      "RUNTIME_ONLY",

    memoryAuthority:
      readFrameString(
        session?.memory,
        ["expectedAuthority", "authority"]
      ) ||
      "SESSION_RUNTIME_ONLY"
  };
}
