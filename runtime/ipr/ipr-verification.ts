/**
 * HERMETICUM B.C.E.
 * AI JOKER-C2
 *
 * IPR Verification
 *
 * Canonical verification service.
 */

import type {
    IprContext,
    IprVerificationStatus,
} from "./ipr-context";

export interface VerificationResult {

    readonly verified: boolean;

    readonly status: IprVerificationStatus;

    readonly verifiedAt: Date | null;

}

export function verifyIprContext(
    context: IprContext,
): VerificationResult {

    return {

        verified:
            context.status === "verified",

        status:
            context.status,

        verifiedAt:
            context.verifiedAt,

    };

}

export function assertVerified(
    context: IprContext,
): void {

    if (context.status !== "verified") {

        throw new Error(
            "IPR identity is not verified.",
        );

    }

}

export function isRevoked(
    context: IprContext,
): boolean {

    return context.status === "revoked";

}

export function isPending(
    context: IprContext,
): boolean {

    return context.status === "pending";

}
