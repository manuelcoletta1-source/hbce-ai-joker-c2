type NodeTrustRecord = {
  node_id: string;
  success_count: number;
  failure_count: number;
  avg_score: number;
  last_seen: string;
};

const trustStore: Record<string, NodeTrustRecord> = {};

function now(): string {
  return new Date().toISOString();
}

export function updateTrust(
  node_id: string,
  success: boolean,
  score: number
) {
  if (!trustStore[node_id]) {
    trustStore[node_id] = {
      node_id,
      success_count: 0,
      failure_count: 0,
      avg_score: 0,
      last_seen: now()
    };
  }

  const record = trustStore[node_id];

  if (success) {
    record.success_count += 1;
  } else {
    record.failure_count += 1;
  }

  // aggiornamento media semplice
  record.avg_score =
    (record.avg_score + score) / 2;

  record.last_seen = now();
}

export function getTrustScore(node_id: string): number {
  const record = trustStore[node_id];

  if (!record) return 1;

  const reliability =
    record.success_count /
    (record.success_count + record.failure_count || 1);

  return reliability * record.avg_score;
}

export function getTrustSnapshot() {
  return trustStore;
}
