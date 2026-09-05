import { IterationRow, SolveResult, StopCriterion } from "../types/numerical";
import { formatNumber, formatPercent } from "../math/format";

export function approxPercent(current: number, previous: number): number {
  if (Math.abs(current) < 1e-14) return Math.abs(current - previous) * 100;
  return Math.abs((current - previous) / current) * 100;
}

export function shouldStop(
  criterion: StopCriterion,
  options: {
    teacherError: number;
    approxError: number;
    fx: number;
    tolerance: number;
    iteration: number;
    maxIterations: number;
  },
): boolean {
  if (criterion === "teacher") return options.teacherError <= options.tolerance;
  if (criterion === "approx-percent") return options.approxError <= options.tolerance;
  if (criterion === "function-abs") return Math.abs(options.fx) <= options.tolerance;
  return options.iteration >= options.maxIterations;
}

export function makeResult(params: {
  method: SolveResult["method"];
  methodName: string;
  expression: string;
  initialData: string;
  tolerance: number;
  iterations: IterationRow[];
  converged: boolean;
  maxReached?: boolean;
  roots: string[];
  finalFx: string;
  finalError: string;
  explanation: string;
  configSnapshot: Record<string, string | number>;
}): SolveResult {
  return {
    method: params.method,
    methodName: params.methodName,
    expression: params.expression,
    initialData: params.initialData,
    tolerance: params.tolerance,
    iterations: params.iterations,
    status: params.converged ? "converged" : params.maxReached ? "max-iterations" : "not-converged",
    roots: params.roots,
    finalFx: params.finalFx,
    finalError: params.finalError,
    explanation: params.explanation,
    configSnapshot: params.configSnapshot,
  };
}

export function rowValue(value: number): string {
  return formatNumber(value, 10);
}

export function rowPercent(value: number): string {
  return formatPercent(value);
}
