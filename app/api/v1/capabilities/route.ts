const HBCE_IPR_RUNTIME_API_CAPABILITIES_REVISION =
  "HBCE-IPR-RUNTIME-API-v1-CAPABILITIES-PUBLIC-v1_0";

const HBCE_IPR_RUNTIME_API_VERSION = "v1";

const HBCE_IPR_RUNTIME_PRODUCT =
  "HBCE IPR Operational Identity & Proof Layer";

const PUBLIC_CAPABILITIES = [
  {
    id: "OPERATIONAL_IDENTITY",
    status: "AVAILABLE"
  },
  {
    id: "GOVERNED_AI_INTERACTION",
    status: "AVAILABLE"
  },
  {
    id: "TECHNICAL_TRACEABILITY",
    status: "AVAILABLE"
  },
  {
    id: "AUDITABILITY",
    status: "AVAILABLE"
  },
  {
    id: "CONTROLLED_FILE_WORKFLOWS",
    status: "AVAILABLE"
  }
] as const;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(): Promise<Response> {
  return Response.json(
    {
      ok: true,
      status: "HBCE_IPR_RUNTIME_CAPABILITIES_READY",
      revision: HBCE_IPR_RUNTIME_API_CAPABILITIES_REVISION,
      generatedAt: new Date().toISOString(),
      product: HBCE_IPR_RUNTIME_PRODUCT,
      apiVersion: HBCE_IPR_RUNTIME_API_VERSION,
      capabilities: PUBLIC_CAPABILITIES,
      total: PUBLIC_CAPABILITIES.length
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
