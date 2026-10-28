/**
 * HBCE JOKER-C2 - Cognitive Provenance
 * Describes cognitive execution, not operational authority.
 */

export type CognitiveProvenance = Readonly<{
  origin:
    | "MODEL_OUTPUT"
    | "LOCAL_BRANCH"
    | "LOCAL_FALLBACK"
    | "PROVIDER_ERROR";
  requestedProvider: string | null;
  attemptedProvider: string | null;
  executedProvider: string | null;
  requestedModel: string | null;
  executedModel: string | null;
}>;

export function validateCognitiveProvenance(
  input: CognitiveProvenance
): CognitiveProvenance {
  if (!["MODEL_OUTPUT", "LOCAL_BRANCH", "LOCAL_FALLBACK", "PROVIDER_ERROR"].includes(input.origin)) {
    throw new Error("INVALID_COGNITIVE_PROVENANCE_ORIGIN");
  }

  if (input.origin === "MODEL_OUTPUT") {
    if (
      !input.attemptedProvider ||
      !input.executedProvider ||
      !input.executedModel ||
      input.attemptedProvider !== input.executedProvider
    ) {
      throw new Error("INVALID_MODEL_PROVENANCE");
    }
  } else if (
    input.executedProvider !== null ||
    input.executedModel !== null
  ) {
    throw new Error("INVALID_LOCAL_PROVENANCE");
  }

  if (
    input.origin === "LOCAL_BRANCH" &&
    input.attemptedProvider !== null
  ) {
    throw new Error("INVALID_LOCAL_BRANCH_PROVENANCE");
  }

  return Object.freeze({ ...input });
}
