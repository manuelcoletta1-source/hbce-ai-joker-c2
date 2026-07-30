/**
 * HERMETICUM B.C.E.
 * AI JOKER-C2
 *
 * Research Evolution Runtime Adapters
 *
 * Purpose:
 * - Connect the R&D lifecycle to the existing EVT, UNEBDO, OPC and BER services.
 * - Keep infrastructure details outside the lifecycle engine.
 * - Preserve fail-closed execution.
 */

import type {
  BiocyberneticEvolutionRecord,
} from "../research/ber/biocybernetic-evolution-register";

import type {
  BiocyberneticEvolutionRegistry,
} from "../research/ber/registry";

import type {
  EventEvidenceInput,
  OpcReceiptInput,
  ResearchEvolutionAdapters,
  UnebdoAnchorInput,
} from "./research-evolution-lifecycle";

export interface EventService {
  createEvent(
    input: EventEvidenceInput,
  ): Promise<{
    eventId: string;
  }>;
}

export interface UnebdoService {
  createAnchor(
    input: UnebdoAnchorInput,
  ): Promise<{
    unebdoAnchorId: string;
  }>;
}

export interface OpcService {
  createReceipt(
    input: OpcReceiptInput,
  ): Promise<{
    opcReceiptId: string;
  }>;
}

export interface ResearchEvolutionDependencies {
  eventService: EventService;
  unebdoService: UnebdoService;
  opcService: OpcService;
  berRegistry: BiocyberneticEvolutionRegistry;
}

export class ResearchEvolutionAdapterError extends Error {
  readonly code:
    | "EVT_ADAPTER_FAILURE"
    | "UNEBDO_ADAPTER_FAILURE"
    | "OPC_ADAPTER_FAILURE"
    | "BER_REGISTRY_FAILURE";

  constructor(
    code: ResearchEvolutionAdapterError["code"],
    message: string,
    cause?: unknown,
  ) {
    super(message, { cause });

    this.name = "ResearchEvolutionAdapterError";
    this.code = code;
  }
}

function requireIdentifier(
  value: string,
  identifierName: string,
): string {
  if (!value || !value.trim()) {
    throw new Error(
      `${identifierName} was not returned by the service.`,
    );
  }

  return value;
}

/**
 * Creates the adapter set consumed by completeResearchMission().
 *
 * No fallback identifiers are generated.
 * Missing evidence identifiers stop the lifecycle immediately.
 */
export function createResearchEvolutionAdapters(
  dependencies: ResearchEvolutionDependencies,
): ResearchEvolutionAdapters {
  return {
    async createEvent(
      input: EventEvidenceInput,
    ): Promise<{ eventId: string }> {
      try {
        const result =
          await dependencies.eventService.createEvent(input);

        return {
          eventId: requireIdentifier(
            result.eventId,
            "eventId",
          ),
        };
      } catch (error) {
        throw new ResearchEvolutionAdapterError(
          "EVT_ADAPTER_FAILURE",
          `Unable to create EVT evidence for BER ${input.payload.berId}.`,
          error,
        );
      }
    },

    async createUnebdoAnchor(
      input: UnebdoAnchorInput,
    ): Promise<{ unebdoAnchorId: string }> {
      try {
        const result =
          await dependencies.unebdoService.createAnchor(
            input,
          );

        return {
          unebdoAnchorId: requireIdentifier(
            result.unebdoAnchorId,
            "unebdoAnchorId",
          ),
        };
      } catch (error) {
        throw new ResearchEvolutionAdapterError(
          "UNEBDO_ADAPTER_FAILURE",
          `Unable to create UNEBDO anchor for EVT ${input.eventId}.`,
          error,
        );
      }
    },

    async createOpcReceipt(
      input: OpcReceiptInput,
    ): Promise<{ opcReceiptId: string }> {
      try {
        const result =
          await dependencies.opcService.createReceipt(
            input,
          );

        return {
          opcReceiptId: requireIdentifier(
            result.opcReceiptId,
            "opcReceiptId",
          ),
        };
      } catch (error) {
        throw new ResearchEvolutionAdapterError(
          "OPC_ADAPTER_FAILURE",
          `Unable to create OPC receipt for EVT ${input.eventId}.`,
          error,
        );
      }
    },

    async persistBerRecord(
      record: BiocyberneticEvolutionRecord,
    ): Promise<void> {
      try {
        await dependencies.berRegistry.append(record);
      } catch (error) {
        throw new ResearchEvolutionAdapterError(
          "BER_REGISTRY_FAILURE",
          `Unable to append BER record ${record.berId}.`,
          error,
        );
      }
    },
  };
}
