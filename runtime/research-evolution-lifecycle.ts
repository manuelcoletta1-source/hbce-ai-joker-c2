/**
 * HERMETICUM B.C.E.
 * AI JOKER-C2 â€” R&D Evolution Lifecycle
 *
 * Integrates the Biocybernetic Evolution Register (BER) into the runtime
 * without hard-coding storage, EVT, UNEBDO or OPC implementations.
 *
 * Runtime order:
 * 1. Validate research completion input.
 * 2. Build a BER record.
 * 3. Create EVT evidence.
 * 4. Anchor the event through UNEBDO.
 * 5. Issue the OPC receipt.
 * 6. Persist the final VERIFIED BER record.
 *
 * Fail-closed rule:
 * The record is VERIFIED only when EVT, UNEBDO and OPC identifiers exist.
 */

import {
  assertValidBerRecord,
  type BenchmarkEvidence,
  type BiocyberneticEvolutionRecord,
  type IprBinding,
  type KnowledgeRecord,
  type ResearchArtifactBinding,
} from "../research/ber/biocybernetic-evolution-register";

export interface ResearchMissionCompletion {
  berId: string;
  missionId: string;
  title: string;
  researchTrack: string;
  ipr: IprBinding;
  artifact: ResearchArtifactBinding;
  benchmark?: BenchmarkEvidence;
  knowledge: KnowledgeRecord;
  completedAt: string;
  previousBerId?: string;
}

export interface EventEvidenceInput {
  eventType: "HBCE_RND_BER_CREATED";
  subjectIprId: string;
  cyberneticIprId: string;
  occurredAt: string;
  payload: BiocyberneticEvolutionRecord;
}

export interface UnebdoAnchorInput {
  eventId: string;
  occurredAt: string;
  subjectIprId: string;
  payloadSha256?: string;
}

export interface OpcReceiptInput {
  eventId: string;
  unebdoAnchorId: string;
  subjectIprId: string;
  cyberneticIprId: string;
  occurredAt: string;
  claim:
    | "HBCE_RND_BER_OBSERVED"
    | "HBCE_RND_BER_VERIFIED";
}

export interface ResearchEvolutionAdapters {
  createEvent(input: EventEvidenceInput): Promise<{ eventId: string }>;

  createUnebdoAnchor(
    input: UnebdoAnchorInput,
  ): Promise<{ unebdoAnchorId: string }>;

  createOpcReceipt(
    input: OpcReceiptInput,
  ): Promise<{ opcReceiptId: string }>;

  persistBerRecord(
    record: BiocyberneticEvolutionRecord,
  ): Promise<void>;
}

export interface ResearchEvolutionResult {
  record: BiocyberneticEvolutionRecord;
  eventId: string;
  unebdoAnchorId: string;
  opcReceiptId: string;
}

export class ResearchEvolutionLifecycleError extends Error {
  readonly code:
    | "INVALID_INPUT"
    | "EVT_CREATION_FAILED"
    | "UNEBDO_ANCHOR_FAILED"
    | "OPC_RECEIPT_FAILED"
    | "BER_PERSISTENCE_FAILED";

  constructor(
    code: ResearchEvolutionLifecycleError["code"],
    message: string,
    cause?: unknown,
  ) {
    super(message, { cause });
    this.name = "ResearchEvolutionLifecycleError";
    this.code = code;
  }
}

function requireNonEmpty(value: string, code: string): void {
  if (!value.trim()) {
    throw new ResearchEvolutionLifecycleError(
      "INVALID_INPUT",
      `${code} is required.`,
    );
  }
}

function buildObservedRecord(
  input: ResearchMissionCompletion,
): BiocyberneticEvolutionRecord {
  requireNonEmpty(input.berId, "berId");
  requireNonEmpty(input.missionId, "missionId");
  requireNonEmpty(input.title, "title");
  requireNonEmpty(input.researchTrack, "researchTrack");
  requireNonEmpty(input.completedAt, "completedAt");

  const record: BiocyberneticEvolutionRecord = {
    berId: input.berId,
    schemaVersion: "1.0",
    company: "HERMETICUM B.C.E.",
    division: "Research & Development",
    program: "AI JOKER-C2",
    researchTrack: input.researchTrack,
    missionId: input.missionId,
    title: input.title,
    ipr: input.ipr,
    artifact: input.artifact,
    benchmark: input.benchmark,
    knowledge: input.knowledge,
    evidenceChain: {
      previousBerId: input.previousBerId,
    },
    createdAt: input.completedAt,
    status: "OBSERVED",
  };

  try {
    assertValidBerRecord(record);
  } catch (error) {
    throw new ResearchEvolutionLifecycleError(
      "INVALID_INPUT",
      `Research completion cannot produce a valid BER record: ${input.berId}`,
      error,
    );
  }

  return record;
}

function buildVerifiedRecord(
  observed: BiocyberneticEvolutionRecord,
  eventId: string,
  unebdoAnchorId: string,
  opcReceiptId: string,
): BiocyberneticEvolutionRecord {
  const verified: BiocyberneticEvolutionRecord = {
    ...observed,
    evidenceChain: {
      ...observed.evidenceChain,
      eventId,
      unebdoAnchorId,
      opcReceiptId,
    },
    status: "VERIFIED",
  };

  assertValidBerRecord(verified);
  return verified;
}

/**
 * Completes one R&D mission and produces one append-only verified BER record.
 *
 * The caller supplies adapters for the existing AI JOKER-C2 services.
 * This keeps the lifecycle deterministic and prevents accidental coupling
 * to provisional API paths.
 */
export async function completeResearchMission(
  input: ResearchMissionCompletion,
  adapters: ResearchEvolutionAdapters,
): Promise<ResearchEvolutionResult> {
  const observedRecord = buildObservedRecord(input);

  let eventId: string;

  try {
    const event = await adapters.createEvent({
      eventType: "HBCE_RND_BER_CREATED",
      subjectIprId: observedRecord.ipr.biologicalIprId,
      cyberneticIprId: observedRecord.ipr.cyberneticIprId,
      occurredAt: observedRecord.createdAt,
      payload: observedRecord,
    });

    requireNonEmpty(event.eventId, "eventId");
    eventId = event.eventId;
  } catch (error) {
    if (error instanceof ResearchEvolutionLifecycleError) throw error;

    throw new ResearchEvolutionLifecycleError(
      "EVT_CREATION_FAILED",
      `EVT creation failed for ${observedRecord.berId}.`,
      error,
    );
  }

  let unebdoAnchorId: string;

  try {
    const anchor = await adapters.createUnebdoAnchor({
      eventId,
      occurredAt: observedRecord.createdAt,
      subjectIprId: observedRecord.ipr.biologicalIprId,
      payloadSha256: observedRecord.artifact.artifactSha256,
    });

    requireNonEmpty(anchor.unebdoAnchorId, "unebdoAnchorId");
    unebdoAnchorId = anchor.unebdoAnchorId;
  } catch (error) {
    if (error instanceof ResearchEvolutionLifecycleError) throw error;

    throw new ResearchEvolutionLifecycleError(
      "UNEBDO_ANCHOR_FAILED",
      `UNEBDO anchoring failed for ${observedRecord.berId}.`,
      error,
    );
  }

  let opcReceiptId: string;

  try {
    const receipt = await adapters.createOpcReceipt({
      eventId,
      unebdoAnchorId,
      subjectIprId: observedRecord.ipr.biologicalIprId,
      cyberneticIprId: observedRecord.ipr.cyberneticIprId,
      occurredAt: observedRecord.createdAt,
      claim: "HBCE_RND_BER_VERIFIED",
    });

    requireNonEmpty(receipt.opcReceiptId, "opcReceiptId");
    opcReceiptId = receipt.opcReceiptId;
  } catch (error) {
    if (error instanceof ResearchEvolutionLifecycleError) throw error;

    throw new ResearchEvolutionLifecycleError(
      "OPC_RECEIPT_FAILED",
      `OPC receipt creation failed for ${observedRecord.berId}.`,
      error,
    );
  }

  const verifiedRecord = buildVerifiedRecord(
    observedRecord,
    eventId,
    unebdoAnchorId,
    opcReceiptId,
  );

  try {
    await adapters.persistBerRecord(verifiedRecord);
  } catch (error) {
    throw new ResearchEvolutionLifecycleError(
      "BER_PERSISTENCE_FAILED",
      `BER persistence failed for ${verifiedRecord.berId}.`,
      error,
    );
  }

  return {
    record: verifiedRecord,
    eventId,
    unebdoAnchorId,
    opcReceiptId,
  };
}
