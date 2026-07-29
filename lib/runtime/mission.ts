/**
 * AI JOKER-C2
 * Mission Runtime v0.1
 * HERMETICUM B.C.E.
 */

export type MissionState =
  | "DRAFT"
  | "IDENTITY_VERIFIED"
  | "SOURCES_AUTHORIZED"
  | "FRAMEWORK_AUTHORIZED"
  | "AUTHORIZED"
  | "RUNNING"
  | "WAITING_HUMAN"
  | "COMPLETED"
  | "REJECTED"
  | "FAILED_CLOSED";

export interface AllowedFramework {
  frameworkId: string;
  mode: "INTERPRETIVE" | "EXECUTION";
  mayGenerateFacts: boolean;
  requiresExplicitLabel: boolean;
}

export interface Mission {

  missionId: string;

  iprSubject: string;

  operatorId: string;

  objective: string;

  scope: string;

  allowedSources: string[];

  allowedFrameworks: AllowedFramework[];

  allowedTools: string[];

  forbiddenActions: string[];

  authorizationLevel: string;

  riskClass: string;

  epistemicPolicy: string;

  previousEventHash?: string;

  createdAt: string;

  expiresAt?: string;

  status: MissionState;

}

export const DEFAULT_MISSION_STATE: MissionState = "DRAFT";

export function canRunMission(mission: Mission): boolean {

  return (

    mission.status === "AUTHORIZED" &&

    mission.allowedSources.length > 0 &&

    mission.allowedFrameworks.length > 0

  );

}

export function failClosed(mission: Mission): Mission {

  return {

    ...mission,

    status: "FAILED_CLOSED"

  };

}
