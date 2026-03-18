export type NumericMode =
  | "official-data"
  | "estimated-range"
  | "insufficient-evidence";

export type NumericGuardInput = {
  message: string;
  response: string;
  research: boolean;
  strong_sources_count?: number;
  weak_sources_count?: number;
};

export type NumericGuardResult = {
  numeric_request: boolean;
  mode: NumericMode;
  block_precise_numbers: boolean;
  reasons: string[];
  guidance_prefix: string;
};

const NUMERIC_REQUEST_PATTERNS: RegExp[] = [
  /\bcon precisione\b/i,
  /\bprecis[io]\b/i,
  /\bdammi i numeri\b/i,
  /\bvalori specifici\b/i,
  /\bcalcola\b/i,
  /\bin euro\b/i,
  /\bin percentuale\b/i,
  /\bpercentual[ei]\b/i,
  /\bstima\b/i,
  /\bquantifica\b/i,
  /\bquanto pesa\b/i,
  /\bcosto della vita\b/i,
  /\baumento\b/i
];

const PRECISE_NUMBER_PATTERNS: RegExp[] = [
  /\b\d+(?:[.,]\d+)?\s?%\b/,
  /\b\d{1,3}(?:[.,]\d{3})*(?:\s?€|\s?euro)\b/i,
  /\b\d+(?:[.,]\d+)?\s?(?:miliardi|milioni)\b/i,
  /\btra\s+\d+(?:[.,]\d+)?\s?(?:e|ed|-)\s?\d+(?:[.,]\d+)?\b/i
];

function matchesAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

function countStrongSources(value?: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function countWeakSources(value?: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export function applyNumericGuard(
  input: NumericGuardInput
): NumericGuardResult {
  const message = input.message.trim();
  const response = input.response.trim();

  const numericRequest = matchesAny(message, NUMERIC_REQUEST_PATTERNS);
  const preciseNumbersDetected = matchesAny(response, PRECISE_NUMBER_PATTERNS);

  const strongSources = countStrongSources(input.strong_sources_count);
  const weakSources = countWeakSources(input.weak_sources_count);

  const reasons: string[] = [];

  if (!numericRequest) {
    return {
      numeric_request: false,
      mode: "official-data",
      block_precise_numbers: false,
      reasons: ["No numeric precision request detected."],
      guidance_prefix: ""
    };
  }

  if (!input.research) {
    reasons.push("Numeric request detected without active research mode.");

    return {
      numeric_request: true,
      mode: "insufficient-evidence",
      block_precise_numbers: true,
      reasons,
      guidance_prefix:
        "I cannot present precise quantified values here as verified data. Without strong current sources, I can only provide a qualitative assessment or a rough non-certified estimate."
    };
  }

  if (strongSources >= 2) {
    reasons.push("Numeric request supported by multiple strong sources.");

    return {
      numeric_request: true,
      mode: "official-data",
      block_precise_numbers: false,
      reasons,
      guidance_prefix: ""
    };
  }

  if (strongSources >= 1) {
    reasons.push("Numeric request supported by limited strong sourcing.");

    return {
      numeric_request: true,
      mode: "estimated-range",
      block_precise_numbers: false,
      reasons,
      guidance_prefix:
        "The following figures should be read as an informed range, not as a single certified number. The evidence base is partial, so the result is indicative rather than exact."
    };
  }

  if (weakSources > 0 || preciseNumbersDetected) {
    reasons.push("Numeric request relies on weak or incomplete sourcing.");
  } else {
    reasons.push("Numeric request lacks sufficient source support.");
  }

  return {
    numeric_request: true,
    mode: "insufficient-evidence",
    block_precise_numbers: true,
    reasons,
    guidance_prefix:
      "I cannot safely provide precise euro or percentage values as verified figures here. The available evidence is insufficient for exact quantification, so any number would only be speculative."
  };
}
