/**
 * HERMETICUM B.C.E. S.r.l.
 *
 * AI JOKER-C2
 * Operational Module Package
 *
 * Revision:
 * AIJC2-OPERATIONAL-MODULE-PACKAGE-v1_0
 *
 * legalCertification=false
 */

export * from "./types";

export * from "./module-registry";

export * from "./loader";

/**
 * Package metadata
 */
export const OperationalModulePackage = Object.freeze({
  name: "AI_JOKER_C2_OPERATIONAL_MODULES",

  version: "1.0.0",

  revision: "AIJC2-OPERATIONAL-MODULE-PACKAGE-v1_0",

  runtime: "AI_JOKER_C2_SAAS_CORE_v0_1",

  legalCertification: false,
});

/**
 * Runtime boundary
 */
export const OPERATIONAL_MODULE_PACKAGE_BOUNDARY =
  Object.freeze({
    registry: true,

    loader: true,

    sharedTypes: true,

    automaticDiscovery: false,

    filesystemScanning: false,

    dynamicLoading: false,

    persistentMemory: false,

    automaticRecall: false,

    runtimeIntegration: false,

    dashboardIntegration: false,

    legalCertification: false,
  });
