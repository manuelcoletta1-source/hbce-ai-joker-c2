import { NextResponse } from "next/server";

import {
  SOURCE_ALLOWLIST_DOMAINS,
  SOURCE_DENYLIST_DOMAINS,
  SOURCE_INTELLIGENCE_BOUNDARY,
  SOURCE_INTELLIGENCE_MYTHOS_SOURCE_SET_ID,
  SOURCE_INTELLIGENCE_POLICY_REVISION,
  SOURCE_INTELLIGENCE_REVISION,
  MYTHOS_SOURCE_CATALOG
} from "@/lib/hbce-source-intelligence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: "SOURCE_INTELLIGENCE_HEALTHY",
    revision: SOURCE_INTELLIGENCE_REVISION,
    policyRevision: SOURCE_INTELLIGENCE_POLICY_REVISION,
    sourceSet: SOURCE_INTELLIGENCE_MYTHOS_SOURCE_SET_ID,
    catalogSources: MYTHOS_SOURCE_CATALOG.length,
    allowlistDomains: SOURCE_ALLOWLIST_DOMAINS,
    denylistDomains: SOURCE_DENYLIST_DOMAINS,
    fetchMode: "SERVER_SIDE_CONTROLLED",
    egressPolicy: "ALLOWLIST_ONLY",
    rawTextPersistence: false,
    promptInjectionScreening: "READY",
    legalCertification: false,
    opcBoundary: SOURCE_INTELLIGENCE_BOUNDARY
  });
}
