/**
 * AI JOKER-C2
 * SRSC Interpretation Engine v0.1
 * HERMETICUM B.C.E.
 */

import type { Claim } from "./claim";

export interface SrscInput {
  missionId: string;
  subjectId: string;
  claims: Claim[];
  context: string;
  timestamp: string;
}

export interface SrscLayer {
  id:
    | "REAL_RESISTANT"
    | "MEDIATION"
    | "NARRATIVE"
    | "DECISION"
    | "COST"
    | "TRACE"
    | "TIME"
    | "LIMIT";
  description: string;
  evidenceClaimIds: string[];
  confidence: number;
}

export interface SrscInterpretation {
  missionId: string;
  subjectId: string;
  frameworkId: "SRSC-V17.1";
  claimType: "SRSC_INTERPRETATION";
  layers: SrscLayer[];
  valid: boolean;
  missingLayers: SrscLayer["id"][];
  requiresHumanReview: boolean;
  generatedAt: string;
}

const REQUIRED_LAYERS: SrscLayer["id"][] = [
  "REAL_RESISTANT",
  "MEDIATION",
  "NARRATIVE",
  "DECISION",
  "COST",
  "TRACE",
  "TIME",
  "LIMIT"
];

export function validateSrscLayers(
  layers: SrscLayer[]
): {
  valid: boolean;
  missingLayers: SrscLayer["id"][];
} {
  const presentLayers = new Set(layers.map((layer) => layer.id));

  const missingLayers = REQUIRED_LAYERS.filter(
    (layerId) => !presentLayers.has(layerId)
  );

  return {
    valid: missingLayers.length === 0,
    missingLayers
  };
}

export function createSrscInterpretation(
  input: SrscInput,
  layers: SrscLayer[]
): SrscInterpretation {
  const validation = validateSrscLayers(layers);

  const invalidConfidence = layers.some(
    (layer) =>
      !Number.isFinite(layer.confidence) ||
      layer.confidence < 0 ||
      layer.confidence > 1
  );

  const unsupportedLayers = layers.some(
    (layer) => layer.evidenceClaimIds.length === 0
  );

  const valid =
    validation.valid &&
    !invalidConfidence &&
    !unsupportedLayers &&
    input.claims.length > 0;

  return {
    missionId: input.missionId,
    subjectId: input.subjectId,
    frameworkId: "SRSC-V17.1",
    claimType: "SRSC_INTERPRETATION",
    layers,
    valid,
    missingLayers: validation.missingLayers,
    requiresHumanReview: !valid,
    generatedAt: new Date().toISOString()
  };
}

export function failClosedSrsc(
  interpretation: SrscInterpretation
): string {
  if (interpretation.valid) {
    return "NONE";
  }

  if (interpretation.missingLayers.length > 0) {
    return `FAIL_CLOSED:SRSC_MISSING_LAYERS:${interpretation.missingLayers.join(
      ","
    )}`;
  }

  return "FAIL_CLOSED:SRSC_INVALID_INTERPRETATION";
}
