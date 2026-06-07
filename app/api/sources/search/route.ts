import { NextRequest, NextResponse } from "next/server";

import { searchSourceCatalog } from "@/lib/hbce-source-intelligence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SearchBody = {
  query?: string;
  sourceSet?: string;
  domains?: string[];
  limit?: number;
};

async function readBody(request: NextRequest): Promise<SearchBody> {
  try {
    const body = await request.json();
    return body && typeof body === "object" ? (body as SearchBody) : {};
  } catch {
    return {};
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await readBody(request);
  const result = searchSourceCatalog({
    query: body.query || "Anthropic Mythos recursive self improvement cyber capability",
    sourceSet: body.sourceSet,
    domains: Array.isArray(body.domains) ? body.domains : undefined,
    limit: body.limit
  });

  return NextResponse.json({
    status: "SOURCE_SEARCH_READY",
    ...result
  });
}
