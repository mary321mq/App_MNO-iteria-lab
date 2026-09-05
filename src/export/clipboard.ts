import { SolveResult } from "../types/numerical";

export function resultToPlainText(result: SolveResult): string {
  const headers = Object.keys(result.iterations[0] || {});
  const table = [
    headers.join("\t"),
    ...result.iterations.map((row) => headers.map((header) => row[header]).join("\t")),
  ].join("\n");

  return [
    "Metodos Numericos con Octave",
    `Metodo: ${result.methodName}`,
    `Funcion: ${result.expression}`,
    `Datos iniciales: ${result.initialData}`,
    `Tolerancia: ${result.tolerance}`,
    `Estado: ${result.status}`,
    `Raiz/raices: ${result.roots.join(", ")}`,
    `f(x) final: ${result.finalFx}`,
    `Error: ${result.finalError}`,
    "",
    "Tabla de iteraciones",
    table,
  ].join("\n");
}

export async function copyResult(result: SolveResult): Promise<void> {
  await navigator.clipboard.writeText(resultToPlainText(result));
}
