/**
 * AI JOKER-C2
 * Source Intelligence Runtime
 * HERMETICUM B.C.E.
 */

import { Claim } from "./claim";

export interface SourceReference {

  sourceId: string;

  authorityDomain: string;

  sourceClass: string;

  trusted: boolean;

}

export interface ClaimEvaluation {

  valid: boolean;

  score: number;

  missing: string[];

}

export function evaluateClaim(

  claim: Claim,

  sources: SourceReference[]

): ClaimEvaluation {

  const missing: string[] = [];

  if (claim.sourceIds.length === 0) {

    missing.push("SOURCE");

  }

  if (claim.frameworkIds.length === 0) {

    missing.push("FRAMEWORK");

  }

  const trustedSources = sources.filter(s => s.trusted);

  if (trustedSources.length === 0) {

    missing.push("TRUSTED_SOURCE");

  }

  return {

    valid: missing.length === 0,

    score: Math.max(0, 100 - missing.length * 25),

    missing

  };

}

export function requireClaimAuthorization(

  evaluation: ClaimEvaluation

): boolean {

  return evaluation.valid;

}

export function failClosedReason(

  evaluation: ClaimEvaluation

): string {

  if (evaluation.valid) {

    return "NONE";

  }

  return `FAIL_CLOSED:${evaluation.missing.join(",")}`;

}
