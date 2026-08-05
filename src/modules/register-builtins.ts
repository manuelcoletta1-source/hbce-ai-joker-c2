/**
 * HERMETICUM B.C.E.
 *
 * AI JOKER-C2
 * Built-in Operational Module Registration
 *
 * Revision:
 * AIJC2-BUILTIN-MODULE-REGISTRATION-v1_0
 *
 * legalCertification=false
 */

import {
  registerModule,
  hasModule,
} from "./module-registry";

import {
  operationalModuleDefinitions,
} from "./definitions";

import type {
  OperationalModuleDefinition,
} from "./types";

export interface BuiltinRegistrationResult {

  registered: number;

  skipped: number;

  total: number;

  legalCertification: false;

}

export function registerBuiltinOperationalModules():
BuiltinRegistrationResult {

  let registered = 0;

  let skipped = 0;

  for (const moduleDefinition of operationalModuleDefinitions) {

    if (hasModule(moduleDefinition.identity.id)) {

      skipped++;

      continue;

    }

    registerModule(moduleDefinition);

    registered++;

  }

  return Object.freeze({

    registered,

    skipped,

    total: operationalModuleDefinitions.length,

    legalCertification: false,

  });

}

export const BUILTIN_OPERATIONAL_MODULE_BOUNDARY =
Object.freeze({

  deterministicRegistration: true,

  duplicateRegistrationRejected: true,

  automaticDiscovery: false,

  filesystemScanning: false,

  dynamicImports: false,

  persistentMemory: false,

  automaticRecall: false,

  legalCertification: false,

});
