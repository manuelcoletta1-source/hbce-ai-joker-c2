/**
 * HERMETICUM B.C.E. S.r.l.
 *
 * AI JOKER-C2
 * Operational Module Loader
 *
 * Revision:
 * AIJC2-OPERATIONAL-MODULE-LOADER-v1_0
 *
 * legalCertification=false
 */

import {
  OperationalModuleDefinition,
  OperationalModuleContractError,
  assertOperationalModuleDefinition,
} from "./types";

import { registerModule } from "./module-registry";

export interface ModuleLoadResult {
  loaded: number;
  failed: number;
  modules: readonly string[];
  errors: readonly string[];
  legalCertification: false;
}

export class OperationalModuleLoader {
  private readonly modules: OperationalModuleDefinition[] = [];

  add(module: OperationalModuleDefinition): this {
    assertOperationalModuleDefinition(module);
    this.modules.push(module);
    return this;
  }

  addMany(
    modules: readonly OperationalModuleDefinition[],
  ): this {
    for (const module of modules) {
      this.add(module);
    }

    return this;
  }

  load(): ModuleLoadResult {
    const loaded: string[] = [];
    const errors: string[] = [];

    for (const module of this.modules) {
      try {
        registerModule(module);
        loaded.push(module.identity.id);
      } catch (error) {
        if (error instanceof Error) {
          errors.push(
            `${module.identity.id}: ${error.message}`,
          );
        } else {
          errors.push(
            `${module.identity.id}: unknown loader error`,
          );
        }
      }
    }

    return Object.freeze({
      loaded: loaded.length,
      failed: errors.length,
      modules: Object.freeze(loaded),
      errors: Object.freeze(errors),
      legalCertification: false,
    });
  }
}

/**
 * Convenience helper.
 */
export function loadOperationalModules(
  modules: readonly OperationalModuleDefinition[],
): ModuleLoadResult {
  return new OperationalModuleLoader()
    .addMany(modules)
    .load();
}

/**
 * Fail-closed validation helper.
 */
export function validateOperationalModules(
  modules: readonly OperationalModuleDefinition[],
): void {
  for (const module of modules) {
    try {
      assertOperationalModuleDefinition(module);
    } catch (error) {
      if (error instanceof OperationalModuleContractError) {
        throw error;
      }

      throw new OperationalModuleContractError(
        "AIJC2_MODULE_VALIDATION_FAILED",
        "Operational module validation failed",
      );
    }
  }
}

export const OperationalModuleLoaderVersion =
  "1.0.0" as const;

export const OPERATIONAL_MODULE_LOADER_BOUNDARY =
  Object.freeze({
    automaticDiscovery: false,
    filesystemScanning: false,
    dynamicImports: false,
    persistentMemory: false,
    automaticRecall: false,
    legalCertification: false,
    humanAuthorizationRequired: true,
  });
