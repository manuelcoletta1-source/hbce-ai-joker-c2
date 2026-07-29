import { createHash } from "node:crypto";

import { RUNTIME_VERSION } from "./constants";

export type RuntimeEventStatus =
  | "CREATED"
  | "COMPLETED"
  | "REJECTED"
  | "FAILED";

export interface RuntimeEventInput {
  eventId: string;
  identityId: string;
  missionId: string;
  action: string;
  status: RuntimeEventStatus;
  timestamp: string;
  inputHash?: string;
  outputHash?: string;
  previousEventHash?: string | null;
  metadata?: Record<string, unknown>;
}

export interface RuntimeEvent {
  eventId: string;
  identityId: string;
  missionId: string;
  action: string;
  status: RuntimeEventStatus;
  timestamp: string;
  runtimeVersion: string;
  inputHash: string | null;
  outputHash: string | null;
  previousEventHash: string | null;
  metadata: Record<string, unknown>;
  eventHash: string;
}

function canonicalize(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(canonicalize).join(",")}]`;
  }

  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();

  return `{${keys
    .map((key) => `${JSON.stringify(key)}:${canonicalize(record[key])}`)
    .join(",")}}`;
}

function sha256(value: unknown): string {
  return createHash("sha256")
    .update(canonicalize(value), "utf8")
    .digest("hex");
}

export function createRuntimeEvent(
  input: RuntimeEventInput,
): RuntimeEvent {
  if (!input.eventId.trim()) {
    throw new Error("EVT_EVENT_ID_REQUIRED");
  }

  if (!input.identityId.trim()) {
    throw new Error("EVT_IDENTITY_REQUIRED");
  }

  if (!input.missionId.trim()) {
    throw new Error("EVT_MISSION_REQUIRED");
  }

  if (!input.action.trim()) {
    throw new Error("EVT_ACTION_REQUIRED");
  }

  if (Number.isNaN(Date.parse(input.timestamp))) {
    throw new Error("EVT_TIMESTAMP_INVALID");
  }

  const eventPayload = {
    eventId: input.eventId,
    identityId: input.identityId,
    missionId: input.missionId,
    action: input.action,
    status: input.status,
    timestamp: input.timestamp,
    runtimeVersion: RUNTIME_VERSION,
    inputHash: input.inputHash ?? null,
    outputHash: input.outputHash ?? null,
    previousEventHash: input.previousEventHash ?? null,
    metadata: input.metadata ?? {},
  };

  return {
    ...eventPayload,
    eventHash: sha256(eventPayload),
  };
}

export function verifyRuntimeEvent(event: RuntimeEvent): boolean {
  const { eventHash, ...eventPayload } = event;

  return sha256(eventPayload) === eventHash;
}
