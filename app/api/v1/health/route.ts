const HBCE_IPR_RUNTIME_API_HEALTH_REVISION =
  "HBCE-IPR-RUNTIME-API-v1-HEALTH-OPERATIONAL_IDENTITY_PROOF_LAYER-v1_0";

const HBCE_IPR_RUNTIME_API_VERSION = "v1";

const HBCE_IPR_RUNTIME_PRODUCT =
  "HBCE IPR Operational Identity & Proof Layer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(): Promise<Response> {
  return Response.json(
    {
      ok: true,
      status: "HBCE_IPR_RUNTIME_API_READY",
      revision: HBCE_IPR_RUNTIME_API_HEALTH_REVISION,
      generatedAt: new Date().toISOString(),
      product: HBCE_IPR_RUNTIME_PRODUCT,
      apiVersion: HBCE_IPR_RUNTIME_API_VERSION
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
        Pragma: "no-cache",
        Expires: "0",
        "X-HBCE-API-Version": HBCE_IPR_RUNTIME_API_VERSION
      }
    }
  );
}
