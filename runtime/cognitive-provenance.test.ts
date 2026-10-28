import { describe, expect, it } from "vitest";
import {
  validateCognitiveProvenance,
  type CognitiveProvenance
} from "./cognitive-provenance";

const modelOutput: CognitiveProvenance = {
  origin: "MODEL_OUTPUT",
  requestedProvider: "OPENAI",
  attemptedProvider: "OPENAI",
  executedProvider: "OPENAI",
  requestedModel: "requested-model",
  executedModel: "actual-model"
};

describe("HBCE Cognitive Provenance", () => {
  it("preserves verified model provenance", () => {
    const result = validateCognitiveProvenance(modelOutput);
    expect(result.executedModel).toBe("actual-model");
    expect(Object.isFrozen(result)).toBe(true);
  });

  it("rejects inconsistent model provenance", () => {
    expect(() => validateCognitiveProvenance({
      ...modelOutput,
      executedProvider: "OTHER_PROVIDER"
    })).toThrow("INVALID_MODEL_PROVENANCE");
  });

  it("rejects remote execution claims for local output", () => {
    expect(() => validateCognitiveProvenance({
      ...modelOutput,
      origin: "LOCAL_FALLBACK"
    })).toThrow("INVALID_LOCAL_PROVENANCE");
  });

  it("rejects provider attempts attributed to local branches", () => {
    expect(() => validateCognitiveProvenance({
      ...modelOutput,
      origin: "LOCAL_BRANCH",
      executedProvider: null,
      executedModel: null
    })).toThrow("INVALID_LOCAL_BRANCH_PROVENANCE");
  });

  it("represents provider errors without successful execution", () => {
    const result = validateCognitiveProvenance({
      ...modelOutput,
      origin: "PROVIDER_ERROR",
      executedProvider: null,
      executedModel: null
    });
    expect(result.attemptedProvider).toBe("OPENAI");
    expect(result.executedProvider).toBeNull();
  });

  it("rejects unknown runtime origins", () => {
    const invalid = {
      ...modelOutput,
      origin: "UNRECOGNIZED"
    } as unknown as CognitiveProvenance;

    expect(() => validateCognitiveProvenance(invalid))
      .toThrow("INVALID_COGNITIVE_PROVENANCE_ORIGIN");
  });
});
