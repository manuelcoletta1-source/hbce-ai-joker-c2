/**
 * AI JOKER-C2 Runtime Identity
 *
 * Canonical identity module for the HBCE / MATRIX governed runtime.
 *
 * This file centralizes the operational identity of AI JOKER-C2 so that
 * runtime modules, EVT records, diagnostics and API routes do not duplicate
 * identity literals across the codebase.
 *
 * Identity provides attribution and continuity.
 * Identity does not authorize unsafe execution.
 */

import type { RuntimeIdentity, RuntimeState } from "./runtime-types";

export const RUNTIME_IDENTITY: RuntimeIdentity = {
  publicName: "AI JOKER-C2",
  entity: "AI_JOKER",
  ipr: "IPR-AI-0001",
  checkpoint: "EVT-0014-AI",
  core: "HBCE-CORE-v3",
  framework: "MATRIX",
  infrastructure: "HBCE",
  organization: "HERMETICUM B.C.E. S.r.l.",
  territorialAnchor: "Torino, Italy, Europe"
} as const;

export const DEFAULT_RUNTIME_STATE: RuntimeState = "OPERATIONAL";

export type RuntimeIdentitySnapshot = {
  publicName: string;
  entity: string;
  ipr: string;
  checkpoint: string;
  core: string;
  framework: string;
  infrastructure: string;
  organization: string;
  territorialAnchor: string;
  state: RuntimeState;
  generatedAt: string;
};

export type PublicRuntimeIdentity = {
  publicName: string;
  entity: string;
  ipr: string;
  checkpoint: string;
  core: string;
  framework: string;
  infrastructure: string;
  organization: string;
  territorialAnchor: string;
  state: RuntimeState;
};

export function getRuntimeIdentity(): RuntimeIdentity {
  return RUNTIME_IDENTITY;
}

export function getRuntimeIdentitySnapshot(
  state: RuntimeState = DEFAULT_RUNTIME_STATE
): RuntimeIdentitySnapshot {
  return {
    ...RUNTIME_IDENTITY,
    state,
    generatedAt: new Date().toISOString()
  };
}

export function getPublicRuntimeIdentity(
  state: RuntimeState = DEFAULT_RUNTIME_STATE
): PublicRuntimeIdentity {
  return {
    ...RUNTIME_IDENTITY,
    state
  };
}

export function getRuntimeEntity(): string {
  return RUNTIME_IDENTITY.entity;
}

export function getRuntimeIpr(): string {
  return RUNTIME_IDENTITY.ipr;
}

export function getRuntimeCheckpoint(): string {
  return RUNTIME_IDENTITY.checkpoint;
}

export function getRuntimeCore(): string {
  return RUNTIME_IDENTITY.core;
}

export function getRuntimeName(): string {
  return RUNTIME_IDENTITY.publicName;
}

export function assertRuntimeIdentity(): RuntimeIdentity {
  if (!RUNTIME_IDENTITY.entity || !RUNTIME_IDENTITY.ipr) {
    throw new Error("AI JOKER-C2 runtime identity is invalid.");
  }

  if (!RUNTIME_IDENTITY.checkpoint || !RUNTIME_IDENTITY.core) {
    throw new Error("AI JOKER-C2 runtime continuity metadata is invalid.");
  }

  return RUNTIME_IDENTITY;
}

export function isRuntimeIdentityValid(identity: RuntimeIdentity): boolean {
  return Boolean(
    identity.publicName &&
      identity.entity &&
      identity.ipr &&
      identity.checkpoint &&
      identity.core &&
      identity.framework &&
      identity.infrastructure &&
      identity.organization &&
      identity.territorialAnchor
  );
}

export function buildRuntimeHeader(
  state: RuntimeState = DEFAULT_RUNTIME_STATE
): string {
  return [
    `${RUNTIME_IDENTITY.publicName}`,
    `Entity: ${RUNTIME_IDENTITY.entity}`,
    `IPR: ${RUNTIME_IDENTITY.ipr}`,
    `Checkpoint: ${RUNTIME_IDENTITY.checkpoint}`,
    `Core: ${RUNTIME_IDENTITY.core}`,
    `State: ${state}`
  ].join("\n");
}

export function buildRuntimeDiagnostic(
  state: RuntimeState = DEFAULT_RUNTIME_STATE
): Record<string, string> {
  return {
    publicName: RUNTIME_IDENTITY.publicName,
    entity: RUNTIME_IDENTITY.entity,
    ipr: RUNTIME_IDENTITY.ipr,
    checkpoint: RUNTIME_IDENTITY.checkpoint,
    core: RUNTIME_IDENTITY.core,
    framework: RUNTIME_IDENTITY.framework,
    infrastructure: RUNTIME_IDENTITY.infrastructure,
    organization: RUNTIME_IDENTITY.organization,
    territorialAnchor: RUNTIME_IDENTITY.territorialAnchor,
    state
  };
}

export function getRuntimeContinuityRef(): string {
  return `${RUNTIME_IDENTITY.entity}/${RUNTIME_IDENTITY.ipr}/${RUNTIME_IDENTITY.checkpoint}`;
}

export function getRuntimeIdentityForEvt(
  state: RuntimeState = DEFAULT_RUNTIME_STATE
): {
  entity: string;
  ipr: string;
  runtime: {
    name: string;
    core: string;
    state: RuntimeState;
  };
} {
  return {
    entity: RUNTIME_IDENTITY.entity,
    ipr: RUNTIME_IDENTITY.ipr,
    runtime: {
      name: RUNTIME_IDENTITY.publicName,
      core: RUNTIME_IDENTITY.core,
      state
    }
  };
}
