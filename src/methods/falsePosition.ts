import { compileRealFunction } from "../math/parser";
import { formatNumber } from "../math/format";
import { MethodConfig, SolveResult } from "../types/numerical";
import { approxPercent, makeResult, rowPercent, rowValue, shouldStop } from "./common";

export function solveFalsePosition(expression: string, config: MethodConfig): SolveResult {
  const f = compileRealFunction(expression);
  let a = config.a;
  let b = config.b;
  let fxa = f(a);
  let fxb = f(b);

  if (fxa * fxb >= 0) {
    throw new Error("No existe cambio de signo en el intervalo: debe cumplirse f(a)*f(b)<0.");
  }

  const rows = [];
  let previous = a;
  let w = b;
  let fxw = fxb;
  let error = Number.POSITIVE_INFINITY;
  let converged = false;

  for (let k = 1; k <= config.maxIterations; k += 1) {
    const denominator = fxb - fxa;
    if (Math.abs(denominator) < 1e-14) throw new Error("Division entre cero: f(b)-f(a) es demasiado pequeno.");
    w = b - (fxb * (b - a)) / denominator;
    fxw = f(w);
    error = k === 1 ? 100 : approxPercent(w, previous);
    const teacherError = Math.abs(fxw);

    rows.push({
      it: k,
      a: rowValue(a),
      b: rowValue(b),
      aprox: rowValue(w),
      "f(aprox)": rowValue(fxw),
      Ea: rowPercent(error),
    });

    converged = shouldStop(config.stopCriterion, {
      teacherError,
      approxError: error,
      fx: fxw,
      tolerance: config.tolerance,
      iteration: k,
      maxIterations: config.maxIterations,
    });
    if (converged) break;

    if (fxa * fxw <= 0) {
      b = w;
      fxb = fxw;
    } else {
      a = w;
      fxa = fxw;
    }
    previous = w;
  }

  return makeResult({
    method: "false-position",
    methodName: "Regla falsa",
    expression,
    initialData: `a=${config.a}, b=${config.b}`,
    tolerance: config.tolerance,
    iterations: rows,
    converged,
    maxReached: !converged,
    roots: [formatNumber(w, 12)],
    finalFx: formatNumber(fxw, 12),
    finalError: rowPercent(error),
    explanation: `Aplicando regla falsa en [${config.a}, ${config.b}], se obtuvo x = ${formatNumber(w, 12)}.`,
    configSnapshot: {
      a: config.a,
      b: config.b,
      criterio: config.stopCriterion,
    },
  });
}
