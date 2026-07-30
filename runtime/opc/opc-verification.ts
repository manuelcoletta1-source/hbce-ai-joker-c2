/**
 * HERMETICUM B.C.E.
 * AI JOKER-C2
 *
 * OPC Verification
 *
 * Canonical verification of Operational Proof records.
 */

import type {
    OpcRecord,
} from "./opc-record";

export interface OpcVerificationResult {

    readonly valid: boolean;

    readonly reason: string | null;

}

export function verifyOpcRecord(
    record: OpcRecord,
    previousRecord?: OpcRecord,
): OpcVerificationResult {

    if (record.legalCertification !== false) {

        return {

            valid: false,

            reason:
                "legalCertification must remain false.",

        };

    }

    if (record.status === "invalidated") {

        return {

            valid: false,

            reason:
                "Record has been invalidated.",

        };

    }

    if (previousRecord) {

        if (
            record.previousHash !== previousRecord.outputHash
        ) {

            return {

                valid: false,

                reason:
                    "Previous hash mismatch.",

            };

        }

    }

    return {

        valid: true,

        reason: null,

    };

}
