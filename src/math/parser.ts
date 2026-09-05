import { all, create, MathJsInstance } from "mathjs";
import { ComplexValue, toComplex } from "./complex";

const math = create(all, {});

export function getMath(): MathJsInstance {
  return math;
}

export function normalizeExpression(expression: string): string {
  return expression.replace(/sen\(/gi, "sin(").replace(/tag\(/gi, "tan(").trim();
}

export function compileRealFunction(expression: string): (x: number) => number {
  const normalized = normalizeExpression(expression);
  if (!normalized) throw new Error("Ingrese una funcion.");
  let compiled: { evaluate: (scope: { x: number }) => unknown };
  try {
    compiled = math.compile(normalized);
  } catch {
    throw new Error(
      "No se pudo interpretar la funcion. Revise la sintaxis: use sin(x), exp(x), x^2 y parentesis cuando sea necesario.",
    );
  }

  return (x: number) => {
    let value: unknown;
    try {
      value = compiled.evaluate({ x });
    } catch {
      throw new Error("No se pudo evaluar la funcion en ese valor de x.");
    }
    if (typeof value !== "number" || !Number.isFinite(value)) {
      throw new Error("La funcion no esta definida para uno de los valores usados.");
    }
    return value;
  };
}

export function compileComplexFunction(expression: string): (x: ComplexValue) => ComplexValue {
  const normalized = normalizeExpression(expression);
  let compiled: { evaluate: (scope: { x: unknown }) => unknown };
  try {
    compiled = math.compile(normalized);
  } catch {
    throw new Error("No se pudo interpretar la funcion para el metodo de Muller.");
  }

  return (x: ComplexValue) => {
    const value = compiled.evaluate({ x: math.complex(x.re, x.im) });
    return toComplex(value);
  };
}

export function derivativeAt(f: (x: number) => number, x: number): number {
  const h = x > 1 ? 0.01 * x : 0.01;
  return 0.5 * (f(x + h) - f(x - h)) / h;
}

export function symbolicOrNumericDerivative(
  expression: string,
  derivativeExpression: string,
): (x: number) => number {
  if (derivativeExpression.trim()) {
    return compileRealFunction(derivativeExpression);
  }
  const f = compileRealFunction(expression);
  return (x: number) => derivativeAt(f, x);
}

export function evaluateDerivativeExpression(expression: string, x0: number): number | null {
  try {
    const node = math.derivative(normalizeExpression(expression), "x");
    const value = node.evaluate({ x: x0 });
    return typeof value === "number" && Number.isFinite(value) ? value : null;
  } catch {
    try {
      return derivativeAt(compileRealFunction(expression), x0);
    } catch {
      return null;
    }
  }
}
