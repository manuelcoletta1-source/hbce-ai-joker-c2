import { NextResponse } from "next/server";

import {
  SOURCE_ALLOWLIST_DOMAINS,
  SOURCE_CATALOG_ENTRIES,
  SOURCE_DENYLIST_DOMAINS,
  SOURCE_INTELLIGENCE_BOUNDARY,
  SOURCE_INTELLIGENCE_MYTHOS_SOURCE_SET_ID,
  SOURCE_INTELLIGENCE_POLICY_REVISION,
  SOURCE_INTELLIGENCE_REVISION,
  SOURCE_INTELLIGENCE_SOURCESET_REGISTRY_REVISION,
  MYTHOS_SOURCE_CATALOG,
  listSourceSetRegistry
} from "@/lib/hbce-source-intelligence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HEALTH_ROUTE_REVISION = "SOURCE_HEALTH_SOURCESET_REGISTRY_EXPOSURE-v0.3" as const;
const SOURCESET_REGISTRY_STATUS = "SOURCESET_REGISTRY_READY" as const;

function buildSourceSetHealthSummary() {
  const registry = listSourceSetRegistry();
  const sourceSetIds = registry.map((entry) => entry.sourceSet);
  const sourceSetSummary = registry.map((entry) => ({
    sourceSet: entry.sourceSet,
    label: entry.label,
    operationalDomain: entry.operationalDomain,
    status: entry.status,
    defaultSourceIds: entry.defaultSourceIds,
    defaultSourceCount: entry.defaultSourceIds.length,
    expectedMinimumSources: entry.expectedMinimumSources,
    riskPosture: entry.riskPosture,
    memoryProfileType: entry.memoryProfileType,
    failClosedOnMissingSource: entry.failClosedOnMissingSource,
    rawTextPersistence: entry.rawTextPersistence,
    legalCertification: entry.legalCertification,
    opcBoundary: entry.opcBoundary
  }));

  return {
    registry,
    sourceSetIds,
    sourceSetSummary,
    sourceSetsTotal: registry.length,
    sourceSetsActive: registry.filter((entry) => entry.status === "ACTIVE").length,
    sourceSetsSeedReady: registry.filter((entry) => entry.status === "SEED_READY").length,
    sourceSetsPlanned: registry.filter((entry) => entry.status === "PLANNED").length
  };
}

export async function GET(): Promise<NextResponse> {
  const sourceSetHealth = buildSourceSetHealthSummary();

  return NextResponse.json({
    status: "SOURCE_INTELLIGENCE_HEALTHY",
    revision: SOURCE_INTELLIGENCE_REVISION,
    routeRevision: HEALTH_ROUTE_REVISION,
    policyRevision: SOURCE_INTELLIGENCE_POLICY_REVISION,
    sourceSetRegistryRevision: SOURCE_INTELLIGENCE_SOURCESET_REGISTRY_REVISION,
    sourceSetRegistryStatus: SOURCESET_REGISTRY_STATUS,
    sourceSet: SOURCE_INTELLIGENCE_MYTHOS_SOURCE_SET_ID,
    defaultSourceSet: SOURCE_INTELLIGENCE_MYTHOS_SOURCE_SET_ID,
    sourceSets: sourceSetHealth.sourceSetsTotal,
    sourceSetsActive: sourceSetHealth.sourceSetsActive,
    sourceSetsSeedReady: sourceSetHealth.sourceSetsSeedReady,
    sourceSetsPlanned: sourceSetHealth.sourceSetsPlanned,
    sourceSetIds: sourceSetHealth.sourceSetIds,
    sourceSetSummary: sourceSetHealth.sourceSetSummary,
    catalogSources: SOURCE_CATALOG_ENTRIES.length,
    mythosCatalogSources: MYTHOS_SOURCE_CATALOG.length,
    allowlistDomains: SOURCE_ALLOWLIST_DOMAINS,
    allowlistDomainCount: SOURCE_ALLOWLIST_DOMAINS.length,
    denylistDomains: SOURCE_DENYLIST_DOMAINS,
    denylistDomainCount: SOURCE_DENYLIST_DOMAINS.length,
    fetchMode: "SERVER_SIDE_CONTROLLED",
    egressPolicy: "ALLOWLIST_ONLY",
    rawTextPersistence: false,
    promptInjectionScreening: "READY",
    sourceHashing: "SHA256_ON_FETCHED_TEXT_OR_BINARY_BODY",
    pdfBoundary: "PDF_BINARY_HASH_ONLY_UNTIL_EXPLICIT_TEXT_EXTRACTION",
    memoryProfilePolicy: "EXPLICIT_OPERATOR_SAVE_ONLY",
    legalCertification: false,
    opcBoundary: SOURCE_INTELLIGENCE_BOUNDARY
  });
}
