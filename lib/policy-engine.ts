import { classifyRisk, type RiskAssessment } from "./risk-classifier";
import {
  applyAutonomyGuard,
  type AutonomyGuardResult
} from "./autonomy-guard";
import {
  applyCapabilityGuard,
  type CapabilityGuardResult
} from "./capability-guard";
import {
  applyIdentityGuard,
  type IdentityGuardResult
} from "./identity-guard";
import {
  applyDefenseGuard,
  type DefenseGuardResult
} from "./defense-guard";
import {
  applyNumericGuard,
  type NumericGuardResult
} from "./numeric-guard";
import {
  resolveContextLink,
  type ContextLinkResult
} from "./context-link-guard";
import {
  resolveLanguage,
  type LanguageLockResult
} from "./language-lock";
import {
  evaluateTruthScope,
  type TruthScopeResult
} from "./truth-scope";

export type HBCEPolicyInput = {
  message: string;
  response?: string;
  research: boolean;
  history?: string[];
  strong_sources_count?: number;
  weak_sources_count?: number;
};

export type HBCEPolicyDecision = {
  blocked: boolean;
  block_reason?: string;
  block_response?: string;
  prompt_guidance: string[];
  risk: RiskAssessment;
  autonomy_guard: AutonomyGuardResult;
  capability_guard: CapabilityGuardResult;
  identity_guard: IdentityGuardResult;
  defense_guard: DefenseGuardResult;
  numeric_guard: NumericGuardResult;
  context_link: ContextLinkResult;
  language_lock: LanguageLockResult;
  truth_scope: TruthScopeResult;
  mode: "allow" | "rewrite" | "block";
};

function compactLines(lines: Array<string | undefined | null | false>): string[] {
  return lines
    .filter(Boolean)
    .map((item) => String(item).trim())
    .filter((item, index, arr) => item.length > 0 && item !== arr[index - 1]);
}

export function evaluateHBCEPolicy(
  input: HBCEPolicyInput
): HBCEPolicyDecision {
  const history = Array.isArray(input.history) ? input.history : [];

  const risk = classifyRisk({ message: input.message });
  const autonomy = applyAutonomyGuard({ message: input.message });
  const capability = applyCapabilityGuard({ message: input.message });
  const identity = applyIdentityGuard({ message: input.message });
  const defense = applyDefenseGuard({ message: input.message });
  const contextLink = resolveContextLink({
    message: input.message,
    history
  });
  const languageLock = resolveLanguage({
    history,
    message: input.message
  });
  const truthScope = evaluateTruthScope({
    message: input.message
  });
  const numeric = applyNumericGuard({
    message: input.message,
    response: input.response || "",
    research: input.research,
    strong_sources_count: input.strong_sources_count,
    weak_sources_count: input.weak_sources_count
  });

  if (defense.blocked) {
    return {
      blocked: true,
      block_reason: defense.reason,
      block_response: defense.safe_response,
      prompt_guidance: [],
      risk,
      autonomy_guard: autonomy,
      capability_guard: capability,
      identity_guard: identity,
      defense_guard: defense,
      numeric_guard: numeric,
      context_link: contextLink,
      language_lock: languageLock,
      truth_scope: truthScope,
      mode: "block"
    };
  }

  if (autonomy.blocked) {
    return {
      blocked: true,
      block_reason: autonomy.reason,
      block_response: autonomy.safe_response,
      prompt_guidance: [],
      risk,
      autonomy_guard: autonomy,
      capability_guard: capability,
      identity_guard: identity,
      defense_guard: defense,
      numeric_guard: numeric,
      context_link: contextLink,
      language_lock: languageLock,
      truth_scope: truthScope,
      mode: "block"
    };
  }

  if (risk.blocked) {
    return {
      blocked: true,
      block_reason: "risk_classifier_block",
      block_response: [
        "Non posso supportare questa richiesta nel formato operativo richiesto.",
        "",
        "Posso però aiutarti a rifattorizzarla in forma conforme, verificabile e compatibile con il quadro UE/HBCE."
      ].join("\n"),
      prompt_guidance: [],
      risk,
      autonomy_guard: autonomy,
      capability_guard: capability,
      identity_guard: identity,
      defense_guard: defense,
      numeric_guard: numeric,
      context_link: contextLink,
      language_lock: languageLock,
      truth_scope: truthScope,
      mode: "block"
    };
  }

  const promptGuidance = compactLines([
    contextLink.resolved
      ? `Context policy: the user is referring to a previously structured block. Resolve the request against the most recent numbered outline. Selected point index: ${contextLink.index ?? "unspecified"}.`
      : "",

    languageLock.language === "it"
      ? "Language policy: answer entirely in Italian."
      : languageLock.language === "en"
        ? "Language policy: answer entirely in English."
        : "",

    capability.guidance_prefix
      ? `Capability policy: ${capability.guidance_prefix}`
      : "",

    identity.rewrite_prefix
      ? `Identity policy: ${identity.rewrite_prefix}`
      : "",

    numeric.mode === "estimated-range"
      ? "Numeric policy: if quantified values are used, present them only as indicative ranges, never as certified exact figures."
      : "",

    numeric.mode === "insufficient-evidence"
      ? "Numeric policy: do not provide precise euro or percentage values as verified facts; explain that evidence is insufficient."
      : "",

    risk.level === "LIMITED"
      ? "Risk policy: keep the answer high-level, cautious, and governance-oriented."
      : "",

    truthScope.applyWarning
      ? "Truth policy: factual claims may require caution and verification treatment."
      : "Truth policy: do not add warning-style framing for casual, structural, or purely drafting requests."
  ]);

  const mode =
    promptGuidance.length > 0 ||
    numeric.mode !== "official-data" ||
    contextLink.resolved
      ? "rewrite"
      : "allow";

  return {
    blocked: false,
    prompt_guidance: promptGuidance,
    risk,
    autonomy_guard: autonomy,
    capability_guard: capability,
    identity_guard: identity,
    defense_guard: defense,
    numeric_guard: numeric,
    context_link: contextLink,
    language_lock: languageLock,
    truth_scope: truthScope,
    mode
  };
}
