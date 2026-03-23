import { measureOption } from "./phi-measure.js";

export function phiEngine(possibilities = []) {
  const evaluated = possibilities.map((option) => {
    const measurement = measureOption(option);

    return {
      option,
      measurement
    };
  });

  const validEffects = evaluated.filter(e => e.measurement.valid);

  if (validEffects.length === 0) {
    return {
      status: "FAIL_CLOSED",
      effect: null,
      evaluated
    };
  }

  validEffects.sort((a, b) => b.measurement.probability - a.measurement.probability);

  return {
    status: "PASS",
    effect: validEffects[0].option,
    measurement: validEffects[0].measurement,
    evaluated
  };
}
