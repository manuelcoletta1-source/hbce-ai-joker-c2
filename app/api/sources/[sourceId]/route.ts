import { NextRequest, NextResponse } from "next/server";

import {
  findCatalogEntryById,
  SOURCE_INTELLIGENCE_BOUNDARY,
  SOURCE_INTELLIGENCE_REVISION
} from "@/lib/hbce-source-intelligence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function extractSourceIdFromUrl(request: NextRequest): string {
  const pathname = new URL(request.url).pathname;
  const segments = pathname.split("/").filter(Boolean);
  const lastSegment = segments.at(-1) ?? "";
  return decodeURIComponent(lastSegment).trim();
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const sourceId = extractSourceIdFromUrl(request);

  if (!sourceId || sourceId === "api" || sourceId === "sources") {
    return NextResponse.json(
      {
        status: "SOURCE_ID_MISSING",
        revision: SOURCE_INTELLIGENCE_REVISION,
        sourceId: "NO_SOURCE_ID",
        rawTextPersistence: false,
        legalCertification: false,
        opcBoundary: SOURCE_INTELLIGENCE_BOUNDARY
      },
      { status: 400 }
    );
  }

  const source = findCatalogEntryById(sourceId);

  if (!source) {
    return NextResponse.json(
      {
        status: "SOURCE_NOT_FOUND",
        revision: SOURCE_INTELLIGENCE_REVISION,
        sourceId,
        rawTextPersistence: false,
        legalCertification: false,
        opcBoundary: SOURCE_INTELLIGENCE_BOUNDARY
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    status: "SOURCE_PROFILE_READY",
    revision: SOURCE_INTELLIGENCE_REVISION,
    sourceId,
    source,
    rawTextPersistence: false,
    legalCertification: false,
    opcBoundary: SOURCE_INTELLIGENCE_BOUNDARY
  });
}
