type ConsensusCandidate = {
  model: string;
  ok: boolean;
  text?: string;
  error?: string;
};

export type ConsensusVote = {
  candidate_id: string;
  normalized_text: string;
  supporters: string[];
  score: number;
  elected: boolean;
};

export type ConsensusResult = {
  ok: boolean;
  threshold: number;
  total_candidates: number;
  valid_candidates: number;
  winner_text: string;
  winner_supporters: string[];
  votes: ConsensusVote[];
  reason: string;
};

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function compactText(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

function similarity(a: string, b: string): number {
  const aWords = new Set(normalizeText(a).split(" ").filter(Boolean));
  const bWords = new Set(normalizeText(b).split(" ").filter(Boolean));

  if (aWords.size === 0 || bWords.size === 0) {
    return 0;
  }

  let intersection = 0;

  for (const word of aWords) {
    if (bWords.has(word)) {
      intersection += 1;
    }
  }

  const union = new Set([...aWords, ...bWords]).size;
  return union === 0 ? 0 : intersection / union;
}

function scoreText(text: string): number {
  let score = 0;

  if (text.length >= 80) score += 2;
  if (text.length >= 160) score += 2;
  if (text.includes("\n")) score += 1;
  if (/\b(ipr|ledger|signature|verify|node|hbce|joker-c2)\b/i.test(text)) {
    score += 2;
  }
  if (/\b(system|architecture|operational|identity|evidence|verification|consensus)\b/i.test(text)) {
    score += 2;
  }

  return score;
}

export function computeConsensus(
  candidates: ConsensusCandidate[],
  threshold = 0.55
): ConsensusResult {
  const valid = candidates.filter(
    (candidate) => candidate.ok && typeof candidate.text === "string" && candidate.text.trim()
  );

  if (valid.length === 0) {
    return {
      ok: false,
      threshold,
      total_candidates: candidates.length,
      valid_candidates: 0,
      winner_text: "",
      winner_supporters: [],
      votes: [],
      reason: "No valid candidate available for consensus."
    };
  }

  const votes: ConsensusVote[] = valid.map((candidate, index) => {
    const baseText = compactText(candidate.text || "");
    const supporters: string[] = [candidate.model];

    for (let i = 0; i < valid.length; i += 1) {
      if (i === index) continue;

      const other = valid[i];
      const ratio = similarity(baseText, other.text || "");

      if (ratio >= threshold) {
        supporters.push(other.model);
      }
    }

    const diversityScore = supporters.length;
    const qualityScore = scoreText(baseText);

    return {
      candidate_id: candidate.model,
      normalized_text: baseText,
      supporters,
      score: diversityScore * 10 + qualityScore,
      elected: false
    };
  });

  votes.sort((a, b) => b.score - a.score);

  const winner = votes[0];

  if (!winner) {
    return {
      ok: false,
      threshold,
      total_candidates: candidates.length,
      valid_candidates: valid.length,
      winner_text: "",
      winner_supporters: [],
      votes: [],
      reason: "Consensus could not determine a winner."
    };
  }

  winner.elected = true;

  return {
    ok: true,
    threshold,
    total_candidates: candidates.length,
    valid_candidates: valid.length,
    winner_text: winner.normalized_text,
    winner_supporters: winner.supporters,
    votes,
    reason: "Consensus elected the highest-supported candidate."
  };
}
