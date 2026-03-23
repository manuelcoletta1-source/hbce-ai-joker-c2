export function integrityCheck(option) {
  return option && typeof option.content === "string" && option.content.trim().length > 0 ? 1 : 0;
}

export function signatureCheck(option) {
  return option && option.source ? 1 : 0;
}

export function quorumCheck(option) {
  if (!option || typeof option.confidence !== "number") return 0;
  return option.confidence >= 0.7 ? 1 : 0;
}

export function anchorCheck(option) {
  return option && option.traceId ? 1 : 0;
}

export function ethicsCheck(option) {
  if (!option || typeof option.risk !== "number") return 0;
  return option.risk <= 0.4 ? 1 : 0;
}

export function calculateProbability({ H, S, Q, A, Xt }) {
  return (H + S + Q + A + Xt) / 5;
}

export function measureOption(option) {
  const H = integrityCheck(option);
  const S = signatureCheck(option);
  const Q = quorumCheck(option);
  const A = anchorCheck(option);
  const Xt = ethicsCheck(option);

  const valid = Boolean(H && S && Q && A && Xt);

  if (!valid) {
    return {
      valid: false,
      H,
      S,
      Q,
      A,
      Xt,
      probability: 0,
      state: "FAIL_CLOSED"
    };
  }

  return {
    valid: true,
    H,
    S,
    Q,
    A,
    Xt,
    probability: calculateProbability({ H, S, Q, A, Xt }),
    state: "PASS"
  };
}
