import { NextRequest, NextResponse } from "next/server";

import {
  buildSourceContextBlock,
  fetchSourceProfile,
  findCatalogEntryById,
  MYTHOS_SOURCE_CATALOG,
  SOURCE_INTELLIGENCE_BOUNDARY,
  SOURCE_INTELLIGENCE_MYTHOS_SOURCE_SET_ID,
  SOURCE_INTELLIGENCE_REVISION
} from "@/lib/hbce-source-intelligence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type SummarizeBody = {
  sourceIds?: string[];
  sourceSet?: string;
  fetchLive?: boolean;
};

async function readBody(request: NextRequest): Promise<SummarizeBody> {
  try {
    const body = await request.json();
    return body && typeof body === "object" ? (body as SummarizeBody) : {};
  } catch {
    return {};
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await readBody(request);
  const sourceSet = body.sourceSet || SOURCE_INTELLIGENCE_MYTHOS_SOURCE_SET_ID;
  const entries = Array.isArray(body.sourceIds) && body.sourceIds.length
    ? body.sourceIds.map((sourceId) => findCatalogEntryById(sourceId)).filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
    : MYTHOS_SOURCE_CATALOG.filter((entry) => entry.sourceSet === sourceSet);

  const profiles = await Promise.all(entries.map((entry) => fetchSourceProfile({ url: entry.url, maxTextChars: 60000 })));
  const contextBlock = buildSourceContextBlock(profiles);

  return NextResponse.json({
    status: "SOURCE_SUMMARY_READY",
    revision: SOURCE_INTELLIGENCE_REVISION,
    sourceSet,
    sourcesRequested: entries.length,
    sourcesVerified: profiles.filter((profile) => profile.verificationStatus === "SOURCE_VERIFIED").length,
    sourceContextBlock: contextBlock,
    sourceProfiles: profiles.map((profile) => ({
      ...profile,
      textPreview: profile.textPreview.slice(0, 500)
    })),
    rawTextPersistence: false,
    legalCertification: false,
    opcBoundary: SOURCE_INTELLIGENCE_BOUNDARY
  });
}
