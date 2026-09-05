export type MethodId =
  | "bisection"
  | "false-position"
  | "fixed-point"
  | "newton"
  | "secant"
  | "muller"
  | "bairstow";

export type StopCriterion = "teacher" | "approx-percent" | "function-abs" | "iterations";

export type SolveStatus = "converged" | "not-converged" | "max-iterations" | "error";

export type NumericCell = number | string;

export interface IterationRow {
  [key: string]: NumericCell;
}

export interface PointSelection {
  id: string;
  x: number;
  y: number;
}

export interface ScanInterval {
  a: number;
  b: number;
  kind: "negative" | "positive" | "mixed";
}

export interface MethodConfig {
  method: MethodId;
  a: number;
  b: number;
  x0: number;
  x1: number;
  x2: number;
  tolerance: number;
  maxIterations: number;
  stopCriterion: StopCriterion;
  derivative: string;
  gExpressions: string[];
  selectedGIndex: number;
  coefficients: string;
  r: number;
  s: number;
}

export interface SolveResult {
  method: MethodId;
  methodName: string;
  expression: string;
  initialData: string;
  tolerance: number;
  iterations: IterationRow[];
  status: SolveStatus;
  roots: string[];
  finalFx: string;
  finalError: string;
  explanation: string;
  configSnapshot: Record<string, string | number>;
}

export interface HistoryEntry {
  id: string;
  expression: string;
  method: MethodId;
  methodName: string;
  initialData: string;
  result: string;
  date: string;
  iterations: number;
  config: MethodConfig;
}

export interface ConvergenceCheck {
  expression: string;
  derivativeAtX0: number | null;
  message: string;
  converges: boolean | null;
}
