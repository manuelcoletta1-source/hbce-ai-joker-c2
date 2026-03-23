import { appendLedgerEvent } from "@/lib/joker-ledger";

export type ConsensusLedgerPayload = {
  message: string;
  winner_text: string;
  winner_supporters: string[];
  threshold: number;
  total_candidates: number;
  valid_candidates: number;
  federation_nodes: number;
  parallel_models: number;
  votes: Array<{
    candidate_id: string;
    supporters: string[];
    score: number;
    elected: boolean;
  }>;
};

export type ConsensusLedgerEvent = {
  id: string;
  hash: string;
  prev_hash: string;
};

async function appendEvent(input: {
  kind: string;
  payload: Record<string, unknown>;
}): Promise<ConsensusLedgerEvent> {
  const event = await appendLedgerEvent({
    kind: input.kind,
    payload: input.payload
  });

  return {
    id: event.id,
    hash: event.hash,
    prev_hash: event.prev_hash
  };
}

export async function appendConsensusDecision(
  payload: ConsensusLedgerPayload
): Promise<ConsensusLedgerEvent> {
  return appendEvent({
    kind: "FEDERATION_CONSENSUS_DECISION",
    payload: {
      message: payload.message,
      winner_text: payload.winner_text,
      winner_supporters: payload.winner_supporters,
      threshold: payload.threshold,
      total_candidates: payload.total_candidates,
      valid_candidates: payload.valid_candidates,
      federation_nodes: payload.federation_nodes,
      parallel_models: payload.parallel_models,
      votes: payload.votes
    }
  });
}

export async function appendConsensusFailure(input: {
  message: string;
  reason: string;
  threshold: number;
  total_candidates: number;
  valid_candidates: number;
  federation_nodes: number;
  parallel_models: number;
}): Promise<ConsensusLedgerEvent> {
  return appendEvent({
    kind: "FEDERATION_CONSENSUS_FAILURE",
    payload: {
      message: input.message,
      reason: input.reason,
      threshold: input.threshold,
      total_candidates: input.total_candidates,
      valid_candidates: input.valid_candidates,
      federation_nodes: input.federation_nodes,
      parallel_models: input.parallel_models
    }
  });
}
