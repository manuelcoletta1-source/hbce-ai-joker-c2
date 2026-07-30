/**
 * HERMETICUM B.C.E.
 * AI JOKER-C2
 *
 * Canonical BER Runtime Factory
 *
 * Creates the complete runtime required by the
 * Research Evolution Lifecycle.
 */

import {
  BiocyberneticEvolutionRegistry,
  JsonlBerRegistryStorage,
} from "../research/ber";

import {
  createResearchEvolutionAdapters,
  type EventService,
  type UnebdoService,
  type OpcService,
} from "./research-evolution-adapters";

export interface ResearchRuntimeConfiguration {
  berRegistryFile: string;

  eventService: EventService;

  unebdoService: UnebdoService;

  opcService: OpcService;
}

export function createResearchEvolutionRuntime(
  configuration: ResearchRuntimeConfiguration,
) {
  const storage =
    new JsonlBerRegistryStorage({
      filePath:
        configuration.berRegistryFile,
    });

  const registry =
    new BiocyberneticEvolutionRegistry(
      storage,
    );

  const adapters =
    createResearchEvolutionAdapters({
      eventService:
        configuration.eventService,

      unebdoService:
        configuration.unebdoService,

      opcService:
        configuration.opcService,

      berRegistry:
        registry,
    });

  return {
    storage,

    registry,

    adapters,
  };
}
