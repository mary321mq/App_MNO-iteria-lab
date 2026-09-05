import { compileRealFunction } from "../math/parser";
import { formatNumber } from "../math/format";
import { MethodConfig, SolveResult } from "../types/numerical";
import { approxPercent, makeResult, rowPercent, rowValue, shouldStop } from "./common";

export function solveSecant(expression: string, config: MethodConfig): SolveResult {
  const f = compileRealFunction(expression);
  const rows = [];
  let x0 = config.x0;
  let x1 = config.x1;
  let x = x1;
  let fx = f(x);
  let error = Number.POSITIVE_INFINITY;
  let converged = false;

  for (let k = 1; k <= config.maxIterations; k += 1) {
    const fx0 = f(x0);
    const fx1 = f(x1);
    const denominator = fx1 - fx0;
    if (Math.abs(denominator) < 1e-14) {
      throw new Error("Division entre cero: f(x1)-f(x0) es demasiado pequeno.");
    }
    x = x1 - (fx1 * (x1 - x0)) / denominator;
    fx = f(x);
    error = approxPercent(x, x1);

    rows.push({
      it: k,
      x0: rowValue(x0),
      x1: rowValue(x1),
      x2: rowValue(x),
      aprox: rowValue(x),
      "f(x2)": rowValue(fx),
      Ea: rowPercent(error),
    });

    converged = shouldStop(config.stopCriterion, {
      teacherError: Math.abs(x - x1),
      approxError: error,
      fx,
      tolerance: config.tolerance,
      iteration: k,
      maxIterations: config.maxIterations,
    });
    if (converged) break;

    x0 = x1;
    x1 = x;
  }

  return makeResult({
    method: "secant",
    methodName: "Secante",
    expression,
    initialData: `x0=${config.x0}, x1=${config.x1}`,
    tolerance: config.tolerance,
    iterations: rows,
    converged,
    maxReached: !converged,
    roots: [formatNumber(x, 12)],
    finalFx: formatNumber(fx, 12),
    finalError: rowPercent(error),
    explanation: `Aplicando secante con x0=${config.x0} y x1=${config.x1}, se obtuvo x = ${formatNumber(x, 12)}.`,
    configSnapshot: {
      x0: config.x0,
      x1: config.x1,
      criterio: config.stopCriterion,
    },
  });
}
