import { NextRequest, NextResponse } from "next/server";

import {
  buildHbceApiAuthErrorBody,
  validateHbceApiCredential
} from "@/lib/api-auth";

import {
  IPR_ONBOARDING_TRUSTED_INGRESS_ENDPOINT,
  IPR_ONBOARDING_TRUSTED_INGRESS_METHOD,
  IPR_ONBOARDING_TRUSTED_INGRESS_SCOPE,
  IPR_ONBOARDING_TRUSTED_INGRESS_VERSION,
  validateIprOnboardingTrustedIngress
} from "@/lib/ipr-onboarding-trusted-ingress";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ROUTE_REVISION =
  "HBCE-IPR-ONBOARDING-TRUSTED-INGRESS-ROUTE-v1.0" as const;

function json(
  body: Record<string, unknown>,
  status: number
) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-HBCE-Route-Revision": ROUTE_REVISION,
      "X-HBCE-Legal-Certification": "false"
    }
  });
}

export async function POST(
  request: NextRequest
) {
  const auth =
    await validateHbceApiCredential({
      headers: request.headers,
      endpoint:
        IPR_ONBOARDING_TRUSTED_INGRESS_ENDPOINT,
      method:
        IPR_ONBOARDING_TRUSTED_INGRESS_METHOD,
      requiredScopes: [
        IPR_ONBOARDING_TRUSTED_INGRESS_SCOPE
      ]
    });

  if (!auth.ok) {
    return json(
      buildHbceApiAuthErrorBody(auth),
      auth.httpStatus
    );
  }

  let envelope: unknown;

  try {
    envelope = await request.json();
  } catch {
    return json(
      {
        ok: false,
        status: "TRUSTED_INGRESS_DENIED",
        reason: "INGRESS_ENVELOPE_REQUIRED",
        runtimeAuthorized: false,
        sessionAuthenticated: false,
        profilePersistenceAuthorized: false,
        authority: "TRANSPORT_EVIDENCE_ONLY",
        legalCertification: false
      },
      400
    );
  }

  const ingress =
    validateIprOnboardingTrustedIngress({
      auth,
      envelope
    });

  if (!ingress.ok) {
    return json(
      ingress as unknown as Record<string, unknown>,
      400
    );
  }

  return json(
    {
      ...ingress,
      routeRevision: ROUTE_REVISION,
      ingressVersion:
        IPR_ONBOARDING_TRUSTED_INGRESS_VERSION,
      nextAction:
        "REPLAY_AND_SERVER_PROJECTION_NOT_YET_EXECUTED"
    },
    202
  );
}
