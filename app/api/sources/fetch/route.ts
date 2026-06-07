import { NextRequest, NextResponse } from "next/server";

import { fetchSourceProfile, isAllowedSourceUrl, SOURCE_INTELLIGENCE_BOUNDARY, SOURCE_INTELLIGENCE_REVISION } from "@/lib/hbce-source-intelligence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type FetchBody = {
  url?: string;
  timeoutMs?: number;
  maxTextChars?: number;
};

async function readBody(request: NextRequest): Promise<FetchBody> {
  try {
    const body = await request.json();
    return body && typeof body === "object" ? (body as FetchBody) : {};
  } catch {
    return {};
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await readBody(request);
  const url = typeof body.url === "string" ? body.url.trim() : "";

  if (!url) {
    return NextResponse.json(
      {
        status: "SOURCE_FETCH_FAIL",
        revision: SOURCE_INTELLIGENCE_REVISION,
        failReason: "MISSING_URL",
        legalCertification: false,
        opcBoundary: SOURCE_INTELLIGENCE_BOUNDARY
      },
      { status: 400 }
    );
  }

  if (!isAllowedSourceUrl(url)) {
    return NextResponse.json(
      {
        status: "SOURCE_FETCH_BLOCKED",
        revision: SOURCE_INTELLIGENCE_REVISION,
        url,
        failReason: "URL_NOT_HTTPS_OR_DOMAIN_NOT_ALLOWLISTED",
        legalCertification: false,
        opcBoundary: SOURCE_INTELLIGENCE_BOUNDARY
      },
      { status: 403 }
    );
  }

  const profile = await fetchSourceProfile({
    url,
    timeoutMs: body.timeoutMs,
    maxTextChars: body.maxTextChars
  });

  return NextResponse.json({
    status: profile.fetchStatus === "FETCH_READY" ? "SOURCE_FETCH_READY" : "SOURCE_FETCH_NOT_READY",
    revision: SOURCE_INTELLIGENCE_REVISION,
    profile
  });
}
