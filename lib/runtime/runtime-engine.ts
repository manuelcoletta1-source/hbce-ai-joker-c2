/**
 * AI JOKER-C2
 * Runtime Engine v0.1
 * HERMETICUM B.C.E.
 */

import type { Mission } from "./mission";
import type { Claim } from "./claim";
import type { SourceReference } from "./source-intelligence";
import {
  evaluateClaim,
  requireClaimAuthorization
} from "./source-intelligence";

import {
  createSrscInterpretation,
  type SrscInput,
  type SrscLayer
} from "./srsc-engine";

export interface RuntimeExecution {

  authorized: boolean;

  evaluationScore: number;

  interpretationGenerated: boolean;

  failClosed: boolean;

  reason: string;

}

export function executeRuntime(

  mission: Mission,

  claims: Claim[],

  sources: SourceReference[],

  layers: SrscLayer[]

): RuntimeExecution {

  if (mission.status !== "AUTHORIZED") {

    return {

      authorized: false,

      evaluationScore: 0,

      interpretationGenerated: false,

      failClosed: true,

      reason: "MISSION_NOT_AUTHORIZED"

    };

  }

  for (const claim of claims) {

    const evaluation = evaluateClaim(claim, sources);

    if (!requireClaimAuthorization(evaluation)) {

      return {

        authorized: false,

        evaluationScore: evaluation.score,

        interpretationGenerated: false,

        failClosed: true,

        reason: "CLAIM_VALIDATION_FAILED"

      };

    }

  }

  const input: SrscInput = {

    missionId: mission.missionId,

    subjectId: mission.iprSubject,

    claims,

    context: mission.objective,

    timestamp: new Date().toISOString()

  };

  const interpretation = createSrscInterpretation(input, layers);

  return {

    authorized: interpretation.valid,

    evaluationScore: 100,

    interpretationGenerated: interpretation.valid,

    failClosed: !interpretation.valid,

    reason: interpretation.valid ? "SUCCESS" : "SRSC_FAILED"

  };

}
