import { compileRealFunction, symbolicOrNumericDerivative } from "../math/parser";
import { formatNumber } from "../math/format";
import { MethodConfig, SolveResult } from "../types/numerical";
import { approxPercent, makeResult, rowPercent, rowValue, shouldStop } from "./common";

export function solveNewton(expression: string, config: MethodConfig): SolveResult {
  const f = compileRealFunction(expression);
  const df = symbolicOrNumericDerivative(expression, config.derivative);
  const rows = [];
  let x = config.x0;
  let fx = f(x);
  let error = Number.POSITIVE_INFINITY;
  let converged = false;

  for (let k = 1; k <= config.maxIterations; k += 1) {
    const xi = x;
    fx = f(xi);
    const dfx = df(xi);
    if (Math.abs(dfx) < 1e-14) throw new Error("Division entre cero: f'(xi) es cero o demasiado pequeno.");
    const next = xi - fx / dfx;
    error = approxPercent(next, xi);

    rows.push({
      it: k,
      xi: rowValue(xi),
      "f(xi)": rowValue(fx),
      "f'(xi)": rowValue(dfx),
      "xi+1": rowValue(next),
      Ea: rowPercent(error),
    });

    x = next;
    fx = f(x);
    converged = shouldStop(config.stopCriterion, {
      teacherError: Math.abs(next - xi),
      approxError: error,
      fx,
      tolerance: config.tolerance,
      iteration: k,
      maxIterations: config.maxIterations,
    });
    if (converged) break;
  }

  return makeResult({
    method: "newton",
    methodName: "Newton-Raphson",
    expression,
    initialData: `x0=${config.x0}`,
    tolerance: config.tolerance,
    iterations: rows,
    converged,
    maxReached: !converged,
    roots: [formatNumber(x, 12)],
    finalFx: formatNumber(fx, 12),
    finalError: rowPercent(error),
    explanation: `Aplicando Newton-Raphson desde x0=${config.x0}, se obtuvo x = ${formatNumber(x, 12)}.`,
    configSnapshot: {
      x0: config.x0,
      derivada: config.derivative || "numerica docente",
      criterio: config.stopCriterion,
    },
  });
}
