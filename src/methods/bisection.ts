import { compileRealFunction } from "../math/parser";
import { formatNumber } from "../math/format";
import { MethodConfig, SolveResult } from "../types/numerical";
import { approxPercent, makeResult, rowPercent, rowValue, shouldStop } from "./common";

export function solveBisection(expression: string, config: MethodConfig): SolveResult {
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
  let m = (a + b) / 2;
  let fxm = f(m);
  let error = Number.POSITIVE_INFINITY;
  let converged = false;

  for (let k = 1; k <= config.maxIterations; k += 1) {
    m = (a + b) / 2;
    fxm = f(m);
    const dif = b - a;
    const teacherError = Math.abs(dif) / 2;
    error = k === 1 ? 100 : approxPercent(m, previous);

    rows.push({
      it: k,
      a: rowValue(a),
      b: rowValue(b),
      aprox: rowValue(m),
      "f(aprox)": rowValue(fxm),
      dif: rowValue(dif),
      Ea: rowPercent(error),
    });

    converged = shouldStop(config.stopCriterion, {
      teacherError,
      approxError: error,
      fx: fxm,
      tolerance: config.tolerance,
      iteration: k,
      maxIterations: config.maxIterations,
    });
    if (converged) break;

    if (fxa * fxm <= 0) {
      b = m;
      fxb = fxm;
    } else {
      a = m;
      fxa = fxm;
    }
    previous = m;
  }

  return makeResult({
    method: "bisection",
    methodName: "Biseccion",
    expression,
    initialData: `a=${config.a}, b=${config.b}`,
    tolerance: config.tolerance,
    iterations: rows,
    converged,
    maxReached: !converged,
    roots: [formatNumber(m, 12)],
    finalFx: formatNumber(fxm, 12),
    finalError: rowPercent(error),
    explanation: `Aplicando biseccion en [${config.a}, ${config.b}], se obtuvo x = ${formatNumber(m, 12)}.`,
    configSnapshot: {
      a: config.a,
      b: config.b,
      criterio: config.stopCriterion,
    },
  });
}
