import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
} as const;

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    {
      ok: true,
      status: "OK",
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: NO_STORE_HEADERS,
    },
  );
}

export async function HEAD(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: NO_STORE_HEADERS,
  });
}

export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 204,
    headers: {
      ...NO_STORE_HEADERS,
      Allow: "GET, HEAD, OPTIONS",
    },
  });
}
