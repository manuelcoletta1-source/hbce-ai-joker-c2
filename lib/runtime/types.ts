export type RuntimeStatus = "ACTIVE" | "INACTIVE";

export interface RuntimeIdentity {
  id: string;
  authorization: boolean;
}

export interface RuntimeMission {
  id: string;
  name: string;
  description?: string;
}

export interface RuntimeClaim {
  id: string;
  text: string;
  confidence: number;
}

export interface RuntimeSource {
  id: string;
  name: string;
  reliability: number;
}

export interface RuntimeContext {
  identity: RuntimeIdentity;
  mission: RuntimeMission;
  claims: RuntimeClaim[];
  sources: RuntimeSource[];
}

export interface RuntimeResult {
  success: boolean;
  timestamp: string;
  version: string;
  status: RuntimeStatus;
  message: string;
}
