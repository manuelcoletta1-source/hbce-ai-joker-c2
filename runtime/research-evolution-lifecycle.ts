/**
 * HERMETICUM B.C.E.
 * AI JOKER-C2
 *
 * Research Evolution Lifecycle
 *
 * Canonical execution chain:
 *
 * Research Mission
 *        ↓
 * OBSERVED BER
 *        ↓
 * EVT
 *        ↓
 * UNEBDO
 *        ↓
 * OPC
 *        ↓
 * VERIFIED BER
 *        ↓
 * Append-Only BER Registry
 *
 * Fail-closed invariant:
 * A BER record becomes VERIFIED only after valid EVT,
 * UNEBDO and OPC identifiers have been produced.
 */

import {
  assertValidBerRecord,
  type BenchmarkEvidence,
  type BiocyberneticEvolutionRecord,
  type IprBinding,
  type KnowledgeRecord,
  type ResearchArtifactBinding,
} from "../research/ber/biocybernetic-evolution-register";

/**
 * Input supplied when an R&D mission has completed.
 */
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

/**
 * Canonical input for EVT creation.
 */
export interface EventEvidenceInput {
  eventType: "HBCE_RND_BER_CREATED";

  subjectIprId: string;

  cyberneticIprId: string;

  occurredAt: string;

  payload: BiocyberneticEvolutionRecord;
}

/**
 * Canonical input for UNEBDO temporal anchoring.
 */
export interface UnebdoAnchorInput {
  eventId: string;

  occurredAt: string;

  subjectIprId: string;

  payloadSha256?: string;
}

/**
 * Canonical input for OPC receipt creation.
 */
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

/**
 * Runtime adapters required by the lifecycle.
 *
 * Infrastructure implementations remain external.
 */
export interface ResearchEvolutionAdapters {
  createEvent(
    input: EventEvidenceInput,
  ): Promise<{
    eventId: string;
  }>;

  createUnebdoAnchor(
    input: UnebdoAnchorInput,
  ): Promise<{
    unebdoAnchorId: string;
  }>;

  createOpcReceipt(
    input: OpcReceiptInput,
  ): Promise<{
    opcReceiptId: string;
  }>;

  persistBerRecord(
    record: BiocyberneticEvolutionRecord,
  ): Promise<void>;
}

/**
 * Successful lifecycle result.
 */
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

function requireNonEmpty(
  value: string,
  fieldName: string,
): string {
  if (!value || !value.trim()) {
    throw new ResearchEvolutionLifecycleError(
      "INVALID_INPUT",
      `${fieldName} is required.`,
    );
  }

  return value;
}

function buildObservedRecord(
  input: ResearchMissionCompletion,
): BiocyberneticEvolutionRecord {
  requireNonEmpty(input.berId, "berId");
  requireNonEmpty(input.missionId, "missionId");
  requireNonEmpty(input.title, "title");
  requireNonEmpty(
    input.researchTrack,
    "researchTrack",
  );
  requireNonEmpty(input.completedAt, "completedAt");

  const completedAt =
    Date.parse(input.completedAt);

  if (Number.isNaN(completedAt)) {
    throw new ResearchEvolutionLifecycleError(
      "INVALID_INPUT",
      "completedAt must be a valid ISO-8601 date.",
    );
  }

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
      `Mission ${input.missionId} cannot produce a valid BER record.`,
      error,
    );
  }

  return record;
}

function buildVerifiedRecord(
  observedRecord: BiocyberneticEvolutionRecord,
  eventId: string,
  unebdoAnchorId: string,
  opcReceiptId: string,
): BiocyberneticEvolutionRecord {
  const verifiedRecord: BiocyberneticEvolutionRecord = {
    ...observedRecord,

    evidenceChain: {
      ...observedRecord.evidenceChain,

      eventId,

      unebdoAnchorId,

      opcReceiptId,
    },

    status: "VERIFIED",
  };

  try {
    assertValidBerRecord(verifiedRecord);
  } catch (error) {
    throw new ResearchEvolutionLifecycleError(
      "INVALID_INPUT",
      `Verified BER record ${verifiedRecord.berId} is invalid.`,
      error,
    );
  }

  return verifiedRecord;
}

/**
 * Executes the complete HBCE research evolution lifecycle.
 *
 * No synthetic identifiers are generated.
 * No partial BER record is persisted.
 * Any failed evidence stage stops execution.
 */
export async function completeResearchMission(
  input: ResearchMissionCompletion,
  adapters: ResearchEvolutionAdapters,
): Promise<ResearchEvolutionResult> {
  const observedRecord =
    buildObservedRecord(input);

  let eventId: string;

  try {
    const event =
      await adapters.createEvent({
        eventType: "HBCE_RND_BER_CREATED",

        subjectIprId:
          observedRecord.ipr.biologicalIprId,

        cyberneticIprId:
          observedRecord.ipr.cyberneticIprId,

        occurredAt:
          observedRecord.createdAt,

        payload: observedRecord,
      });

    eventId = requireNonEmpty(
      event.eventId,
      "eventId",
    );
  } catch (error) {
    if (
      error instanceof
      ResearchEvolutionLifecycleError
    ) {
      throw error;
    }

    throw new ResearchEvolutionLifecycleError(
      "EVT_CREATION_FAILED",
      `EVT creation failed for BER ${observedRecord.berId}.`,
      error,
    );
  }

  let unebdoAnchorId: string;

  try {
    const anchor =
      await adapters.createUnebdoAnchor({
        eventId,

        occurredAt:
          observedRecord.createdAt,

        subjectIprId:
          observedRecord.ipr.biologicalIprId,

        payloadSha256:
          observedRecord.artifact.artifactSha256,
      });

    unebdoAnchorId = requireNonEmpty(
      anchor.unebdoAnchorId,
      "unebdoAnchorId",
    );
  } catch (error) {
    if (
      error instanceof
      ResearchEvolutionLifecycleError
    ) {
      throw error;
    }

    throw new ResearchEvolutionLifecycleError(
      "UNEBDO_ANCHOR_FAILED",
      `UNEBDO anchoring failed for BER ${observedRecord.berId}.`,
      error,
    );
  }

  let opcReceiptId: string;

  try {
    const receipt =
      await adapters.createOpcReceipt({
        eventId,

        unebdoAnchorId,

        subjectIprId:
          observedRecord.ipr.biologicalIprId,

        cyberneticIprId:
          observedRecord.ipr.cyberneticIprId,

        occurredAt:
          observedRecord.createdAt,

        claim: "HBCE_RND_BER_VERIFIED",
      });

    opcReceiptId = requireNonEmpty(
      receipt.opcReceiptId,
      "opcReceiptId",
    );
  } catch (error) {
    if (
      error instanceof
      ResearchEvolutionLifecycleError
    ) {
      throw error;
    }

    throw new ResearchEvolutionLifecycleError(
      "OPC_RECEIPT_FAILED",
      `OPC receipt creation failed for BER ${observedRecord.berId}.`,
      error,
    );
  }

  const verifiedRecord =
    buildVerifiedRecord(
      observedRecord,
      eventId,
      unebdoAnchorId,
      opcReceiptId,
    );

  try {
    await adapters.persistBerRecord(
      verifiedRecord,
    );
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
