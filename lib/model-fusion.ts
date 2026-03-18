type FusionCandidate = {
  model: string;
  ok: boolean;
  text?: string;
  error?: string;
};

type FusionResult = {
  ok: boolean;
  fused_text: string;
  selected_models: string[];
  discarded_models: string[];
  notes: string[];
};

function splitSentences(text: string): string[] {
  return text
    .split(/\n+/)
    .flatMap((line) => line.split(/(?<=[.!?])\s+/))
    .map((part) => part.trim())
    .filter(Boolean);
}

function normalizeSentence(sentence: string): string {
  return sentence
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function sentenceScore(sentence: string): number {
  let score = 0;

  if (sentence.length >= 40) score += 2;
  if (sentence.length >= 80) score += 2;
  if (/\b(ipr|ledger|signature|verify|memory|node|hbce|joker-c2)\b/i.test(sentence)) {
    score += 3;
  }
  if (/\b(therefore|because|architecture|system|operational|identity|evidence|verification)\b/i.test(sentence)) {
    score += 2;
  }
  if (sentence.includes(":")) score += 1;

  return score;
}

function dedupeSentences(sentences: string[]): string[] {
  const seen = new Set<string>();
  const output: string[] = [];

  for (const sentence of sentences) {
    const normalized = normalizeSentence(sentence);
    if (!normalized) continue;
    if (seen.has(normalized)) continue;

    seen.add(normalized);
    output.push(sentence);
  }

  return output;
}

function rankCandidates(candidates: FusionCandidate[]): FusionCandidate[] {
  return [...candidates].sort((a, b) => {
    const aText = a.text || "";
    const bText = b.text || "";

    const aScore =
      (a.ok ? 10 : 0) +
      Math.min(aText.length / 100, 10) +
      (aText.includes("\n") ? 1 : 0);

    const bScore =
      (b.ok ? 10 : 0) +
      Math.min(bText.length / 100, 10) +
      (bText.includes("\n") ? 1 : 0);

    return bScore - aScore;
  });
}

export function fuseModelResponses(
  candidates: FusionCandidate[]
): FusionResult {
  const successful = rankCandidates(
    candidates.filter((candidate) => candidate.ok && candidate.text)
  );

  if (successful.length === 0) {
    return {
      ok: false,
      fused_text: "",
      selected_models: [],
      discarded_models: candidates.map((candidate) => candidate.model),
      notes: ["No successful model response available for fusion."]
    };
  }

  const selected = successful.slice(0, 2);
  const discarded = candidates
    .map((candidate) => candidate.model)
    .filter((model) => !selected.some((candidate) => candidate.model === model));

  const allSentences = selected.flatMap((candidate) =>
    splitSentences(candidate.text || "")
  );

  const uniqueSentences = dedupeSentences(allSentences);

  const rankedSentences = [...uniqueSentences].sort(
    (a, b) => sentenceScore(b) - sentenceScore(a)
  );

  const topSentences = rankedSentences.slice(0, 8);

  const fusedText = topSentences.join(" ").trim();

  if (!fusedText) {
    return {
      ok: false,
      fused_text: "",
      selected_models: selected.map((candidate) => candidate.model),
      discarded_models: discarded,
      notes: ["Fusion produced an empty output."]
    };
  }

  return {
    ok: true,
    fused_text: fusedText,
    selected_models: selected.map((candidate) => candidate.model),
    discarded_models: discarded,
    notes: [
      "Fusion selected the strongest successful responses.",
      "Duplicate or low-value sentences were removed.",
      "Highest-scoring sentences were merged into a single output."
    ]
  };
}
