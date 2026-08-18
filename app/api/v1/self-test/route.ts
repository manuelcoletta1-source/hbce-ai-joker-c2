import { NextResponse } from "next/server";

const API_REVISION =
  "HBCE-IPR-RUNTIME-API-v1-SELF-TEST-PUBLIC-v1_0" as const;

const API_VERSION = "v1" as const;

const PRODUCT_NAME =
  "HBCE IPR Operational Identity & Proof Layer" as const;

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    {
      ok: true,
      status: "HBCE_IPR_RUNTIME_API_SELF_TEST_READY",
      mode: "STATIC_CONTRACT_MATRIX_ONLY",
      revision: API_REVISION,
      generatedAt: new Date().toISOString(),
      product: PRODUCT_NAME,
      apiVersion: API_VERSION,
      checks: {
        performsHttpFetch: false,
        performsDatabaseLookup: false,
        performsRuntimeMutation: false,
        performsMemoryWrite: false
      }
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
        Pragma: "no-cache",
        Expires: "0",
        "X-HBCE-API-Version": API_VERSION
      }
    }
  );
}
