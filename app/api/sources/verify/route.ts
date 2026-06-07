import { NextRequest, NextResponse } from "next/server";

import {
  buildSourceVerificationReceipt,
  fetchSourceProfile,
  isAllowedSourceUrl,
  SOURCE_INTELLIGENCE_BOUNDARY,
  SOURCE_INTELLIGENCE_REVISION
} from "@/lib/hbce-source-intelligence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type VerifyBody = {
  url?: string;
  expectedHash?: string;
  fetch?: boolean;
};

async function readBody(request: NextRequest): Promise<VerifyBody> {
  try {
    const body = await request.json();
    return body && typeof body === "object" ? (body as VerifyBody) : {};
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
        status: "SOURCE_VERIFY_FAIL",
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
        status: "SOURCE_VERIFY_REJECTED",
        revision: SOURCE_INTELLIGENCE_REVISION,
        url,
        verificationStatus: "SOURCE_REJECTED",
        failReason: "URL_NOT_HTTPS_OR_DOMAIN_NOT_ALLOWLISTED",
        legalCertification: false,
        opcBoundary: SOURCE_INTELLIGENCE_BOUNDARY
      },
      { status: 403 }
    );
  }

  const profile = await fetchSourceProfile({ url });
  const receipt = buildSourceVerificationReceipt(profile);
  const expectedHash = typeof body.expectedHash === "string" ? body.expectedHash.trim() : "";
  const hashMatch = expectedHash ? expectedHash === profile.sourceHash : null;

  return NextResponse.json({
    status: profile.verificationStatus === "SOURCE_VERIFIED" ? "SOURCE_VERIFY_READY" : "SOURCE_VERIFY_NOT_READY",
    revision: SOURCE_INTELLIGENCE_REVISION,
    receipt,
    hashMatch,
    profile: {
      ...profile,
      textPreview: profile.textPreview.slice(0, 500)
    }
  });
}
