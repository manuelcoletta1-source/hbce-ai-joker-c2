/**
 * HERMETICUM B.C.E.
 * AI JOKER-C2 — Biocybernetic Evolution Register (BER)
 *
 * Purpose:
 * - Track the verifiable evolution of the collaboration between a biological
 *   operator and a cybernetic entity.
 * - Bind each R&D experiment to identity (IPR), evidence, time, benchmark
 *   results, knowledge gained, EVT, UNEBDO and OPC.
 *
 * Boundary:
 * - A benchmark score is evidence of the evaluated submission only.
 * - It is not proof of AGI, legal certification, or validation of the full HBCE architecture.
 */

export type BerStatus =
  | "DRAFT"
  | "OBSERVED"
  | "VERIFIED"
  | "REJECTED"
  | "SUPERSEDED";

export type KnowledgeOutcome =
  | "POSITIVE"
  | "NEGATIVE"
  | "NEUTRAL"
  | "INCONCLUSIVE";

export interface IprBinding {
  biologicalIprId: string;
  biologicalSubjectName: string;
  cyberneticIprId: string;
  cyberneticEntityName: string;
}

export interface BenchmarkEvidence {
  provider: string;
  competition: string;
  score: number;
  scoreScale?: string;
  observedAt: string;
  observedLocation: string;
  submissionId?: string;
  notebookVersion?: string;
  notebookSha256?: string;
  runtimeSha256?: string;
  submissionSha256?: string;
  officialResult: boolean;
  claimScope: string;
  limitations: string[];
}

export interface ResearchArtifactBinding {
  repository: string;
  branch?: string;
  gitCommit?: string;
  filePath?: string;
  artifactSha256?: string;
}

export interface KnowledgeRecord {
  outcome: KnowledgeOutcome;
  hypothesis: string;
  intervention: string;
  observation: string;
  knowledgeGained: string[];
  lessonsLearned: string[];
  nextDecision?: string;
}

export interface EvidenceChain {
  eventId?: string;
  unebdoAnchorId?: string;
  opcReceiptId?: string;
  previousBerId?: string;
}

export interface BiocyberneticEvolutionRecord {
  berId: string;
  schemaVersion: "1.0";
  company: "HERMETICUM B.C.E.";
  division: "Research & Development";
  program: "AI JOKER-C2";
  researchTrack: string;
  missionId: string;
  title: string;
  ipr: IprBinding;
  artifact: ResearchArtifactBinding;
  benchmark?: BenchmarkEvidence;
  knowledge: KnowledgeRecord;
  evidenceChain: EvidenceChain;
  createdAt: string;
  status: BerStatus;
}

export interface BerValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateBerRecord(
  record: BiocyberneticEvolutionRecord,
): BerValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!record.berId.trim()) errors.push("BER_ID_REQUIRED");
  if (!record.missionId.trim()) errors.push("MISSION_ID_REQUIRED");

  if (!record.ipr.biologicalIprId.trim()) {
    errors.push("BIOLOGICAL_IPR_REQUIRED");
  }

  if (!record.ipr.cyberneticIprId.trim()) {
    errors.push("CYBERNETIC_IPR_REQUIRED");
  }

  if (!record.artifact.repository.trim()) {
    errors.push("REPOSITORY_REQUIRED");
  }

  if (!record.knowledge.hypothesis.trim()) {
    errors.push("HYPOTHESIS_REQUIRED");
  }

  if (!record.knowledge.observation.trim()) {
    errors.push("OBSERVATION_REQUIRED");
  }

  if (record.knowledge.knowledgeGained.length === 0) {
    errors.push("KNOWLEDGE_GAIN_REQUIRED");
  }

  if (record.benchmark) {
    if (!Number.isFinite(record.benchmark.score)) {
      errors.push("BENCHMARK_SCORE_INVALID");
    }

    if (!record.benchmark.claimScope.trim()) {
      errors.push("BENCHMARK_CLAIM_SCOPE_REQUIRED");
    }

    if (record.benchmark.limitations.length === 0) {
      warnings.push("BENCHMARK_LIMITATIONS_EMPTY");
    }

    if (
      record.status === "VERIFIED" &&
      (!record.benchmark.submissionSha256 ||
        !record.benchmark.runtimeSha256)
    ) {
      warnings.push("VERIFIED_WITHOUT_COMPLETE_HASH_BINDING");
    }
  }

  if (
    record.status === "VERIFIED" &&
    (!record.evidenceChain.eventId ||
      !record.evidenceChain.unebdoAnchorId ||
      !record.evidenceChain.opcReceiptId)
  ) {
    warnings.push("VERIFIED_WITHOUT_COMPLETE_EVIDENCE_CHAIN");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function assertValidBerRecord(
  record: BiocyberneticEvolutionRecord,
): void {
  const result = validateBerRecord(record);

  if (!result.valid) {
    throw new Error(
      `Invalid BER record ${record.berId}: ${result.errors.join(", ")}`,
    );
  }
}

/**
 * First canonical HBCE R&D benchmark record.
 *
 * Important:
 * - Hashes and external identifiers remain undefined until bound to the
 *   actual notebook, runtime and Kaggle submission artifacts.
 * - Therefore the record is OBSERVED, not VERIFIED.
 */
export const BER_0001_ARC_AGI_022: BiocyberneticEvolutionRecord = {
  berId: "BER-0001",
  schemaVersion: "1.0",
  company: "HERMETICUM B.C.E.",
  division: "Research & Development",
  program: "AI JOKER-C2",
  researchTrack: "ARC-AGI",
  missionId: "MISSION-ARC-AGI-RD-001",
  title: "ARC-AGI external benchmark observation — score 0.22",
  ipr: {
    biologicalIprId: "IPR-3",
    biologicalSubjectName: "Manuel Coletta",
    cyberneticIprId: "IPR-AI-0001",
    cyberneticEntityName: "AI JOKER-C2",
  },
  artifact: {
    repository: "manuelcoletta1-source/hbce-ai-joker-c2",
    branch: "main",
    filePath:
      "research/ber/biocybernetic-evolution-register.ts",
  },
  benchmark: {
    provider: "Kaggle",
    competition: "ARC-AGI",
    score: 0.22,
    scoreScale: "official competition score",
    observedAt: "2026-07-28T00:00:00+02:00",
    observedLocation: "Torino, Italia",
    officialResult: true,
    claimScope:
      "The evaluated submission achieved an observed official score of 0.22 in the specified Kaggle competition.",
    limitations: [
      "Does not prove AGI.",
      "Does not validate the full HBCE architecture.",
      "Does not prove universal model superiority.",
      "Does not constitute legal certification.",
      "Requires binding to notebook, runtime and submission hashes for VERIFIED status.",
    ],
  },
  knowledge: {
    outcome: "POSITIVE",
    hypothesis:
      "The biocybernetic R&D process can be evaluated through reproducible external benchmark events.",
    intervention:
      "A specific AI JOKER-C2 research configuration was submitted to Kaggle ARC-AGI.",
    observation:
      "The evaluated configuration obtained an official score of 0.22.",
    knowledgeGained: [
      "External benchmarks can anchor the evolution of the biological-cybernetic collaboration to observable results.",
      "Benchmark performance and cumulative knowledge must be recorded as separate dimensions.",
      "A lower future experimental score must not erase validated knowledge already acquired.",
    ],
    lessonsLearned: [
      "Every benchmark claim must remain limited to the evaluated submission.",
      "Notebook, runtime and submission hashes are required before the record can become VERIFIED.",
      "Score progression may oscillate while the evidence-backed knowledge register remains append-only.",
    ],
    nextDecision:
      "Bind the actual notebook, runtime and submission hashes, then create EVT, UNEBDO and OPC identifiers.",
  },
  evidenceChain: {},
  createdAt: "2026-07-29T00:00:00+02:00",
  status: "OBSERVED",
};

assertValidBerRecord(BER_0001_ARC_AGI_022);
