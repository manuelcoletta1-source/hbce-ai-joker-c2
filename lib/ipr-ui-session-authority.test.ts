import {
  describe,
  expect,
  it
} from "vitest";

import {
  deriveUiSessionAuthority,
  deriveUiSessionAuthorityFrame
} from "@/lib/ipr-ui-session-authority";

describe(
  "deriveUiSessionAuthority",
  () => {
    it(
      "fails closed when no session exists",
      () => {
        expect(
          deriveUiSessionAuthority(null)
        ).toEqual({
          hasSessionPresence: false,
          hasResolvedAccountSession: false,
          hasServerAuthorizedSession: false
        });
      }
    );

    it(
      "recognizes session presence without resolved account profile",
      () => {
        expect(
          deriveUiSessionAuthority({
            sessionAuthenticated: true,
            authenticated: false,
            authorized: false,
            access: {
              decision:
                "ACCOUNT_PROFILE_REQUIRED"
            }
          })
        ).toEqual({
          hasSessionPresence: true,
          hasResolvedAccountSession: false,
          hasServerAuthorizedSession: false
        });
      }
    );

    it(
      "separates resolved profile from runtime authority",
      () => {
        expect(
          deriveUiSessionAuthority({
            sessionAuthenticated: true,
            authenticated: true,
            authorized: false,
            access: {
              decision:
                "AUTHENTICATION_REQUIRED"
            }
          })
        ).toEqual({
          hasSessionPresence: true,
          hasResolvedAccountSession: true,
          hasServerAuthorizedSession: false
        });
      }
    );

    it(
      "rejects authorized flag without ACCESS_GRANTED",
      () => {
        expect(
          deriveUiSessionAuthority({
            sessionAuthenticated: true,
            authenticated: true,
            authorized: true,
            access: {
              decision:
                "AUTHENTICATION_REQUIRED"
            }
          })
        ).toEqual({
          hasSessionPresence: true,
          hasResolvedAccountSession: true,
          hasServerAuthorizedSession: false
        });
      }
    );

    it(
      "rejects authority without resolved profile",
      () => {
        expect(
          deriveUiSessionAuthority({
            sessionAuthenticated: true,
            authenticated: false,
            authorized: true,
            access: {
              decision:
                "ACCESS_GRANTED"
            }
          })
        ).toEqual({
          hasSessionPresence: true,
          hasResolvedAccountSession: false,
          hasServerAuthorizedSession: false
        });
      }
    );

    it(
      "accepts complete server-proven authority",
      () => {
        expect(
          deriveUiSessionAuthority({
            sessionAuthenticated: true,
            authenticated: true,
            authorized: true,
            access: {
              decision:
                "ACCESS_GRANTED"
            }
          })
        ).toEqual({
          hasSessionPresence: true,
          hasResolvedAccountSession: true,
          hasServerAuthorizedSession: true
        });
      }
    );

    it(
      "preserves legacy authenticated compatibility",
      () => {
        expect(
          deriveUiSessionAuthority({
            authenticated: true,
            authorized: true,
            access: {
              accessDecision:
                "ACCESS_GRANTED"
            }
          })
        ).toEqual({
          hasSessionPresence: true,
          hasResolvedAccountSession: true,
          hasServerAuthorizedSession: true
        });
      }
    );
  }
);

describe(
  "deriveUiSessionAuthorityFrame",
  () => {
    it(
      "returns no authority frame when no server session is present",
      () => {
        expect(
          deriveUiSessionAuthorityFrame(null)
        ).toBeNull();
      }
    );

    it(
      "fails closed when session presence has no authority frames",
      () => {
        expect(
          deriveUiSessionAuthorityFrame({
            sessionAuthenticated: true,
            authenticated: false,
            authorized: false
          })
        ).toEqual({
          accessDecision:
            "SERVER_VALIDATION_REQUIRED",
          identityBinding:
            "NOT_VERIFIED",
          matrixState:
            "MATRIX_LIMITED",
          memoryScope:
            "RUNTIME_ONLY",
          memoryAuthority:
            "SESSION_RUNTIME_ONLY"
        });
      }
    );

    it(
      "preserves an explicit limited server frame",
      () => {
        expect(
          deriveUiSessionAuthorityFrame({
            sessionAuthenticated: true,
            authenticated: true,
            authorized: false,
            access: {
              decision:
                "AUTHENTICATION_REQUIRED",
              identityBinding:
                "NOT_VERIFIED"
            },
            matrix: {
              expectedState:
                "MATRIX_LIMITED"
            },
            memory: {
              expectedScope:
                "RUNTIME_ONLY",
              expectedAuthority:
                "SESSION_RUNTIME_ONLY"
            }
          })
        ).toEqual({
          accessDecision:
            "AUTHENTICATION_REQUIRED",
          identityBinding:
            "NOT_VERIFIED",
          matrixState:
            "MATRIX_LIMITED",
          memoryScope:
            "RUNTIME_ONLY",
          memoryAuthority:
            "SESSION_RUNTIME_ONLY"
        });
      }
    );

    it(
      "uses canonical server authority fields for an authorized session",
      () => {
        expect(
          deriveUiSessionAuthorityFrame({
            sessionAuthenticated: true,
            authenticated: true,
            authorized: true,
            access: {
              decision:
                "ACCESS_GRANTED",
              identityBinding:
                "IPR_VERIFIED_BIOLOGICAL_SUBJECT"
            },
            matrix: {
              expectedState:
                "MATRIX_ACTIVE"
            },
            memory: {
              expectedScope:
                "IPR_BOUND",
              expectedAuthority:
                "SERVER_RUNTIME_VALIDATED"
            }
          })
        ).toEqual({
          accessDecision:
            "ACCESS_GRANTED",
          identityBinding:
            "IPR_VERIFIED_BIOLOGICAL_SUBJECT",
          matrixState:
            "MATRIX_ACTIVE",
          memoryScope:
            "IPR_BOUND",
          memoryAuthority:
            "SERVER_RUNTIME_VALIDATED"
        });
      }
    );

    it(
      "prefers canonical expected fields over legacy frame aliases",
      () => {
        expect(
          deriveUiSessionAuthorityFrame({
            sessionAuthenticated: true,
            authenticated: true,
            authorized: true,
            access: {
              decision:
                "ACCESS_GRANTED"
            },
            matrix: {
              expectedState:
                "MATRIX_ACTIVE",
              state:
                "MATRIX_LIMITED"
            },
            memory: {
              expectedScope:
                "IPR_BOUND",
              scope:
                "RUNTIME_ONLY",
              expectedAuthority:
                "SERVER_RUNTIME_VALIDATED",
              authority:
                "SESSION_RUNTIME_ONLY"
            }
          })
        ).toMatchObject({
          matrixState:
            "MATRIX_ACTIVE",
          memoryScope:
            "IPR_BOUND",
          memoryAuthority:
            "SERVER_RUNTIME_VALIDATED"
        });
      }
    );
  }
);
