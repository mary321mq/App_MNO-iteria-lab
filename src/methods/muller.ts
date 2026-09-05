import { compileComplexFunction } from "../math/parser";
import { abs, add, complex, div, mul, neg, scale, sqrtComplex, sub } from "../math/complex";
import { formatComplex, formatNumber, formatPercent } from "../math/format";
import { MethodConfig, SolveResult } from "../types/numerical";
import { makeResult } from "./common";

export function solveMuller(expression: string, config: MethodConfig): SolveResult {
  const f = compileComplexFunction(expression);
  let x0 = complex(config.x0);
  let x1 = complex(config.x1);
  let x2 = complex(config.x2);
  const rows = [];
  let x3 = x2;
  let fx3 = f(x3);
  let error = Number.POSITIVE_INFINITY;
  let converged = false;

  for (let k = 1; k <= config.maxIterations; k += 1) {
    const f0 = f(x0);
    const f1 = f(x1);
    const f2 = f(x2);
    const h0 = sub(x1, x0);
    const h1 = sub(x2, x1);
    const delta0 = div(sub(f1, f0), h0);
    const delta1 = div(sub(f2, f1), h1);
    const a = div(sub(delta1, delta0), add(h1, h0));
    const b = add(mul(a, h1), delta1);
    const c = f2;
    const discriminant = sub(mul(b, b), scale(mul(a, c), 4));
    const root = sqrtComplex(discriminant);
    const denominatorPlus = add(b, root);
    const denominatorMinus = sub(b, root);
    const denominator =
      abs(denominatorPlus) >= abs(denominatorMinus) ? denominatorPlus : denominatorMinus;
    x3 = add(x2, div(scale(neg(c), 2), denominator));
    fx3 = f(x3);
    error = abs(x3) < 1e-14 ? abs(sub(x3, x2)) * 100 : (abs(sub(x3, x2)) / abs(x3)) * 100;

    rows.push({
      it: k,
      x0: formatComplex(x0),
      x1: formatComplex(x1),
      x2: formatComplex(x2),
      a: formatComplex(a),
      b: formatComplex(b),
      c: formatComplex(c),
      x3: formatComplex(x3),
      "f(x3)": formatComplex(fx3),
      Ea: formatPercent(error),
    });

    if (error <= config.tolerance || abs(fx3) <= config.tolerance) {
      converged = true;
      break;
    }

    x0 = x1;
    x1 = x2;
    x2 = x3;
  }

  return makeResult({
    method: "muller",
    methodName: "Muller",
    expression,
    initialData: `x0=${config.x0}, x1=${config.x1}, x2=${config.x2}`,
    tolerance: config.tolerance,
    iterations: rows,
    converged,
    maxReached: !converged,
    roots: [formatComplex(x3, 12)],
    finalFx: formatComplex(fx3, 12),
    finalError: formatPercent(error),
    explanation: `Aplicando Muller con tres aproximaciones, se obtuvo x = ${formatComplex(x3, 12)}.`,
    configSnapshot: {
      x0: config.x0,
      x1: config.x1,
      x2: config.x2,
      criterio: "Ea o |f(x3)|",
    },
  });
}
