import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

type ParallelResult = {
  model: string;
  ok: boolean;
  text?: string;
  error?: string;
};

type ParallelOutput = {
  winner: string;
  responses: ParallelResult[];
};

async function runModel(model: string, requestBody: any): Promise<ParallelResult> {
  try {
    const res: any = await openai.responses.create({
      ...requestBody,
      model
    });

    const text =
      typeof res.output_text === "string" ? res.output_text.trim() : "";

    return {
      model,
      ok: true,
      text
    };
  } catch (err: any) {
    return {
      model,
      ok: false,
      error: err?.message || "error"
    };
  }
}

function scoreText(text: string): number {
  if (!text) return 0;

  let score = 0;

  // lunghezza
  score += Math.min(text.length / 50, 10);

  // struttura
  if (text.includes("\n")) score += 2;

  // presenza termini tecnici
  if (text.match(/(analysis|strategic|system|architecture)/i)) score += 3;

  return score;
}

function pickWinner(results: ParallelResult[]): string {
  let bestScore = -1;
  let winner = results[0]?.model || "unknown";

  for (const r of results) {
    if (!r.ok || !r.text) continue;

    const s = scoreText(r.text);

    if (s > bestScore) {
      bestScore = s;
      winner = r.model;
    }
  }

  return winner;
}

export async function executeParallel(
  requestBody: any
): Promise<ParallelOutput> {
  const models = [
    "gpt-4.1-mini",
    "gpt-4.1-mini" // qui dopo metteremo altri provider
  ];

  const results = await Promise.all(
    models.map((m) => runModel(m, requestBody))
  );

  const winner = pickWinner(results);

  return {
    winner,
    responses: results
  };
}
