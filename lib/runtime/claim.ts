/**
 * AI JOKER-C2
 * Claim Classification Runtime
 * HERMETICUM B.C.E.
 */

export type ClaimType =
  | "OBSERVED_FACT"
  | "SOURCE_DERIVED_FACT"
  | "SCIENTIFIC_CONSENSUS"
  | "LEGAL_FACT"
  | "USER_DECLARATION"
  | "PROJECT_RECORD"
  | "INFERENCE"
  | "SRSC_INTERPRETATION"
  | "HYPOTHESIS"
  | "SPECULATION"
  | "OBJECTIVE"
  | "RECOMMENDATION"
  | "UNKNOWN";

export interface Claim {

  id: string;

  text: string;

  type: ClaimType;

  sourceIds: string[];

  frameworkIds: string[];

  confidence: number;

  requiresHumanReview: boolean;

  requiresExplicitLabel: boolean;

}

export function isFact(claim: Claim): boolean {

  return [

    "OBSERVED_FACT",

    "SOURCE_DERIVED_FACT",

    "SCIENTIFIC_CONSENSUS",

    "LEGAL_FACT",

    "PROJECT_RECORD"

  ].includes(claim.type);

}

export function isInterpretation(claim: Claim): boolean {

  return [

    "INFERENCE",

    "SRSC_INTERPRETATION",

    "HYPOTHESIS",

    "SPECULATION"

  ].includes(claim.type);

}

export function validateClaim(claim: Claim): boolean {

  if (claim.sourceIds.length === 0) {

    return false;

  }

  if (claim.frameworkIds.length === 0) {

    return false;

  }

  return true;

}
