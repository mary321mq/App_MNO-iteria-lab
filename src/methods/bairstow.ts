import { complex } from "../math/complex";
import { formatComplex, formatNumber, formatPercent } from "../math/format";
import { MethodConfig, SolveResult } from "../types/numerical";
import { makeResult } from "./common";

function parseCoefficients(input: string): number[] {
  const coefficients = input
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((value) => !Number.isNaN(value));
  if (coefficients.length < 3) throw new Error("Ingrese al menos tres coeficientes para un polinomio.");
  if (Math.abs(coefficients[0]) < 1e-14) throw new Error("El primer coeficiente no puede ser cero.");
  return coefficients;
}

function quadraticRoots(r: number, s: number) {
  const discriminant = r * r + 4 * s;
  if (discriminant >= 0) {
    return [complex((r + Math.sqrt(discriminant)) / 2), complex((r - Math.sqrt(discriminant)) / 2)];
  }
  return [complex(r / 2, Math.sqrt(-discriminant) / 2), complex(r / 2, -Math.sqrt(-discriminant) / 2)];
}

function remainingRoots(coefficients: number[]) {
  if (coefficients.length === 3) {
    const [a, b, c] = coefficients;
    const discriminant = b * b - 4 * a * c;
    if (discriminant >= 0) {
      return [complex((-b + Math.sqrt(discriminant)) / (2 * a)), complex((-b - Math.sqrt(discriminant)) / (2 * a))];
    }
    return [complex(-b / (2 * a), Math.sqrt(-discriminant) / (2 * a)), complex(-b / (2 * a), -Math.sqrt(-discriminant) / (2 * a))];
  }
  if (coefficients.length === 2) {
    return [complex(-coefficients[1] / coefficients[0])];
  }
  return [];
}

export function solveBairstow(expression: string, config: MethodConfig): SolveResult {
  let coefficients = parseCoefficients(config.coefficients);
  const roots = [];
  const rows = [];
  const factors: string[] = [];
  let r = config.r;
  let s = config.s;
  let converged = true;
  let lastError = Number.POSITIVE_INFINITY;

  while (coefficients.length > 3) {
    let factorConverged = false;
    for (let k = 1; k <= config.maxIterations; k += 1) {
      const n = coefficients.length - 1;
      const b = new Array(n + 1).fill(0);
      const c = new Array(n + 1).fill(0);
      b[0] = coefficients[0];
      b[1] = coefficients[1] + r * b[0];
      for (let i = 2; i <= n; i += 1) b[i] = coefficients[i] + r * b[i - 1] + s * b[i - 2];
      c[0] = b[0];
      c[1] = b[1] + r * c[0];
      for (let i = 2; i <= n; i += 1) c[i] = b[i] + r * c[i - 1] + s * c[i - 2];

      const det = c[n - 2] * c[n - 2] - c[n - 3] * c[n - 1];
      if (Math.abs(det) < 1e-14) throw new Error("Bairstow encontro un sistema singular. Cambie r y s iniciales.");

      const dr = (-b[n - 1] * c[n - 2] + b[n] * c[n - 3]) / det;
      const ds = (-b[n] * c[n - 2] + b[n - 1] * c[n - 1]) / det;
      r += dr;
      s += ds;
      const errorR = Math.abs(r) < 1e-14 ? Math.abs(dr) * 100 : Math.abs(dr / r) * 100;
      const errorS = Math.abs(s) < 1e-14 ? Math.abs(ds) * 100 : Math.abs(ds / s) * 100;
      lastError = Math.max(errorR, errorS);

      rows.push({
        it: rows.length + 1,
        r: formatNumber(r, 10),
        s: formatNumber(s, 10),
        "Delta r": formatNumber(dr, 10),
        "Delta s": formatNumber(ds, 10),
        "Error r": formatPercent(errorR),
        "Error s": formatPercent(errorS),
        b: b.map((value) => formatNumber(value, 6)).join(", "),
      });

      if (errorR <= config.tolerance && errorS <= config.tolerance) {
        factorConverged = true;
        factors.push(`x^2 - (${formatNumber(r)})x - (${formatNumber(s)})`);
        roots.push(...quadraticRoots(r, s));
        coefficients = b.slice(0, -2);
        break;
      }
    }
    if (!factorConverged) {
      converged = false;
      break;
    }
  }

  if (converged) roots.push(...remainingRoots(coefficients));

  return makeResult({
    method: "bairstow",
    methodName: "Bairstow",
    expression,
    initialData: `coeficientes=${config.coefficients}, r=${config.r}, s=${config.s}`,
    tolerance: config.tolerance,
    iterations: rows,
    converged,
    maxReached: !converged,
    roots: roots.map((root) => formatComplex(root, 12)),
    finalFx: "Ver raices del polinomio",
    finalError: formatPercent(lastError),
    explanation:
      "Bairstow se aplico como algoritmo estandar porque la guia recibida solo lo menciona en el temario.",
    configSnapshot: {
      coeficientes: config.coefficients,
      r: config.r,
      s: config.s,
      factores: factors.join("; ") || "pendiente",
    },
  });
}
