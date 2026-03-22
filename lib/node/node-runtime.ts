import {
  runC2LexSession,
  type C2LexSessionRunResult
} from "@/lib/c2-lex-session-store";

import { nodeAppendEvent } from "@/lib/node/node-ledger";
import { nodeGetContinuityStatus } from "@/lib/node/node-continuity";

import type {
  HBCEContinuityStatus,
  HBCENodeRuntimeEventResult
} from "@/lib/node/node-types";

export type HBCENodeRuntimeInput = {
  sessionId: string;
  message: string;
  role: string;
  nodeContext: string;
  continuityReference?: string;
  actor?: string;
};

export type HBCENodeRuntimeResult = {
  execution: C2LexSessionRunResult;
  continuity_status: HBCEContinuityStatus;
  ledger_events: HBCENodeRuntimeEventResult[];
};

function buildLedgerActor(input: HBCENodeRuntimeInput): string {
  return input.actor?.trim() || input.role?.trim() || "JOKER-C2";
}

async function appendSessionOpenedEvent(
  input: HBCENodeRuntimeInput,
  execution: C2LexSessionRunResult
): Promise<HBCENodeRuntimeEventResult | null> {
  if (!execution.created) {
    return null;
  }

  return nodeAppendEvent({
    kind: "c2lex.session.opened",
    actor: buildLedgerActor(input),
    node: input.nodeContext,
    payload: {
      session_id: execution.session.sessionId,
      role: execution.session.role,
      node_context: execution.session.nodeContext,
      continuity_reference: execution.session.continuityReference,
      opened_at: execution.session.openedAt
    }
  });
}

async function appendInputReceivedEvent(
  input: HBCENodeRuntimeInput,
  execution: C2LexSessionRunResult
): Promise<HBCENodeRuntimeEventResult> {
  return nodeAppendEvent({
    kind: "c2lex.input.received",
    actor: buildLedgerActor(input),
    node: input.nodeContext,
    payload: {
      session_id: execution.session.sessionId,
      continuity_reference: execution.result.continuityReference,
      message: input.message,
      turn_count: execution.session.turnCount
    }
  });
}

async function appendIntentClassifiedEvent(
  input: HBCENodeRuntimeInput,
  execution: C2LexSessionRunResult
): Promise<HBCENodeRuntimeEventResult> {
  return nodeAppendEvent({
    kind: "c2lex.intent.classified",
    actor: buildLedgerActor(input),
    node: input.nodeContext,
    payload: {
      session_id: execution.session.sessionId,
      continuity_reference: execution.result.continuityReference,
      intent_class: execution.result.intentClass,
      policy_scope: execution.result.policyScope
    }
  });
}

async function appendGovernanceEvaluatedEvent(
  input: HBCENodeRuntimeInput,
  execution: C2LexSessionRunResult
): Promise<HBCENodeRuntimeEventResult> {
  return nodeAppendEvent({
    kind: "c2lex.governance.evaluated",
    actor: buildLedgerActor(input),
    node: input.nodeContext,
    payload: {
      session_id: execution.session.sessionId,
      continuity_reference: execution.result.continuityReference,
      governance_checks: execution.result.governanceChecks,
      session_state: execution.result.sessionState
    }
  });
}

async function appendOutcomeEmittedEvent(
  input: HBCENodeRuntimeInput,
  execution: C2LexSessionRunResult
): Promise<HBCENodeRuntimeEventResult> {
  return nodeAppendEvent({
    kind: "c2lex.outcome.emitted",
    actor: buildLedgerActor(input),
    node: input.nodeContext,
    payload: {
      session_id: execution.session.sessionId,
      continuity_reference: execution.result.continuityReference,
      outcome_class: execution.result.outcomeClass,
      summary: execution.result.summary,
      next_step: execution.result.nextStep,
      session_state: execution.result.sessionState
    }
  });
}

export async function runNodeRuntime(
  input: HBCENodeRuntimeInput
): Promise<HBCENodeRuntimeResult> {
  const execution = runC2LexSession({
    sessionId: input.sessionId,
    message: input.message,
    role: input.role,
    nodeContext: input.nodeContext,
    continuityReference: input.continuityReference
  });

  const ledgerEvents: HBCENodeRuntimeEventResult[] = [];

  const openedEvent = await appendSessionOpenedEvent(input, execution);
  if (openedEvent) {
    ledgerEvents.push(openedEvent);
  }

  ledgerEvents.push(await appendInputReceivedEvent(input, execution));
  ledgerEvents.push(await appendIntentClassifiedEvent(input, execution));
  ledgerEvents.push(await appendGovernanceEvaluatedEvent(input, execution));
  ledgerEvents.push(await appendOutcomeEmittedEvent(input, execution));

  return {
    execution,
    continuity_status: nodeGetContinuityStatus(),
    ledger_events: ledgerEvents
  };
}
