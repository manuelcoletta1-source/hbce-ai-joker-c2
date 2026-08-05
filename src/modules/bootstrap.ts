/**
 * HERMETICUM B.C.E.
 *
 * AI JOKER-C2
 * Operational Module Bootstrap
 *
 * Revision:
 * AIJC2-OPERATIONAL-MODULE-BOOTSTRAP-v1_0
 *
 * legalCertification=false
 */

import { loadOperationalModules } from "./loader";
import { OperationalModuleDefinition } from "./types";

export interface OperationalModuleBootstrapResult {
  initialized: boolean;
  loadedModules: number;
  failedModules: number;
  legalCertification: false;
}

export function bootstrapOperationalModules(
  modules: readonly OperationalModuleDefinition[],
): OperationalModuleBootstrapResult {

  const result = loadOperationalModules(modules);

  return Object.freeze({
    initialized: result.failed === 0,
    loadedModules: result.loaded,
    failedModules: result.failed,
    legalCertification: false,
  });

}

export const OPERATIONAL_MODULE_BOOTSTRAP_BOUNDARY =
Object.freeze({

  autoRegistration: true,

  runtimeInitializationOnly: true,

  persistentMemory: false,

  automaticRecall: false,

  legalCertification: false,

});
