import { evaluateDerivativeExpression, compileRealFunction } from "../math/parser";
import { formatNumber } from "../math/format";
import { ConvergenceCheck, MethodConfig, SolveResult } from "../types/numerical";
import { approxPercent, makeResult, rowPercent, rowValue, shouldStop } from "./common";

export function analyzeFixedPoint(gExpressions: string[], x0: number): ConvergenceCheck[] {
  return gExpressions
    .filter((expression) => expression.trim())
    .map((expression) => {
      const derivative = evaluateDerivativeExpression(expression, x0);
      const magnitude = derivative === null ? null : Math.abs(derivative);
      return {
        expression,
        derivativeAtX0: derivative,
        converges: magnitude === null ? null : magnitude < 1,
        message:
          magnitude === null
            ? "No se pudo estimar |g'(x0)|."
            : magnitude < 1
              ? `La formula parece converger porque |g'(x0)| = ${formatNumber(magnitude, 8)} < 1.`
              : `La formula puede no converger porque |g'(x0)| = ${formatNumber(magnitude, 8)} > 1.`,
      };
    });
}

export function solveFixedPoint(expression: string, config: MethodConfig): SolveResult {
  const gExpression = config.gExpressions[config.selectedGIndex] || "";
  const g = compileRealFunction(gExpression);
  const f = compileRealFunction(expression);
  const rows = [];
  let x = config.x0;
  let error = Number.POSITIVE_INFINITY;
  let converged = false;

  for (let k = 1; k <= config.maxIterations; k += 1) {
    const x0 = x;
    x = g(x0);
    const differ = x - x0;
    error = approxPercent(x, x0);

    rows.push({
      it: k,
      "x anterior": rowValue(x0),
      x: rowValue(x),
      difer: rowValue(differ),
      Ea: rowPercent(error),
      "f(x)": rowValue(f(x)),
    });

    if (
      shouldStop(config.stopCriterion, {
        teacherError: Math.abs(x - x0),
        approxError: error,
        fx: f(x),
        tolerance: config.tolerance,
        iteration: k,
        maxIterations: config.maxIterations,
      })
    ) {
      converged = true;
      break;
    }
  }

  const fx = f(x);
  return makeResult({
    method: "fixed-point",
    methodName: "Punto fijo",
    expression,
    initialData: `g(x)=${gExpression}, x0=${config.x0}`,
    tolerance: config.tolerance,
    iterations: rows,
    converged,
    maxReached: !converged,
    roots: [formatNumber(x, 12)],
    finalFx: formatNumber(fx, 12),
    finalError: rowPercent(error),
    explanation: `Con la iteracion x=g(x), se obtuvo x = ${formatNumber(x, 12)}.`,
    configSnapshot: {
      x0: config.x0,
      "g(x)": gExpression,
      criterio: "abs(x-x0) y Ea",
    },
  });
}
