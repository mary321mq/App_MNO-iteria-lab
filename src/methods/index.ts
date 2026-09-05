import { MethodConfig, SolveResult } from "../types/numerical";
import { solveBairstow } from "./bairstow";
import { solveBisection } from "./bisection";
import { solveFalsePosition } from "./falsePosition";
import { solveFixedPoint } from "./fixedPoint";
import { solveMuller } from "./muller";
import { solveNewton } from "./newton";
import { solveSecant } from "./secant";

export const methodNames: Record<MethodConfig["method"], string> = {
  bisection: "Biseccion",
  "false-position": "Regla falsa",
  "fixed-point": "Punto fijo",
  newton: "Newton-Raphson",
  secant: "Secante",
  muller: "Muller",
  bairstow: "Bairstow",
};

export function solveMethod(expression: string, config: MethodConfig): SolveResult {
  switch (config.method) {
    case "bisection":
      return solveBisection(expression, config);
    case "false-position":
      return solveFalsePosition(expression, config);
    case "fixed-point":
      return solveFixedPoint(expression, config);
    case "newton":
      return solveNewton(expression, config);
    case "secant":
      return solveSecant(expression, config);
    case "muller":
      return solveMuller(expression, config);
    case "bairstow":
      return solveBairstow(expression, config);
    default:
      throw new Error("Metodo no soportado.");
  }
}
