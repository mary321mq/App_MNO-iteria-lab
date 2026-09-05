import * as XLSX from "xlsx";
import { SolveResult } from "../types/numerical";

function autoFit(sheet: XLSX.WorkSheet): void {
  const range = XLSX.utils.decode_range(sheet["!ref"] || "A1:A1");
  const cols = [];
  for (let c = range.s.c; c <= range.e.c; c += 1) {
    let width = 12;
    for (let r = range.s.r; r <= range.e.r; r += 1) {
      const cell = sheet[XLSX.utils.encode_cell({ r, c })];
      if (cell?.v !== undefined) width = Math.max(width, String(cell.v).length + 2);
    }
    cols.push({ wch: Math.min(width, 36) });
  }
  sheet["!cols"] = cols;
}

export function exportToExcel(result: SolveResult, graphRange: { min: number; max: number }): void {
  const wb = XLSX.utils.book_new();
  const date = new Date();

  const summary = XLSX.utils.aoa_to_sheet([
    ["Metodos Numericos con Octave"],
    ["Metodo", result.methodName],
    ["Funcion", result.expression],
    ["Datos iniciales", result.initialData],
    ["Tolerancia", result.tolerance],
    ["Resultado final", result.roots.join(", ")],
    ["f(x) final", result.finalFx],
    ["Error", result.finalError],
    ["Iteraciones", result.iterations.length],
    ["Estado", result.status],
    ["Fecha", date.toLocaleString()],
  ]);
  autoFit(summary);
  XLSX.utils.book_append_sheet(wb, summary, "Resumen");

  const table = XLSX.utils.json_to_sheet(result.iterations);
  autoFit(table);
  XLSX.utils.book_append_sheet(wb, table, "Tabla de iteraciones");

  const configRows = Object.entries(result.configSnapshot).map(([key, value]) => [key, value]);
  const configuration = XLSX.utils.aoa_to_sheet([
    ["Configuracion"],
    ["Rango X minimo", graphRange.min],
    ["Rango X maximo", graphRange.max],
    ...configRows,
  ]);
  autoFit(configuration);
  XLSX.utils.book_append_sheet(wb, configuration, "Configuracion");

  const safeMethod = result.methodName.replace(/\s+/g, "");
  const stamp = date.toISOString().slice(0, 10);
  XLSX.writeFile(wb, `MetodoNumerico_${safeMethod}_${stamp}.xlsx`, {
    cellStyles: true,
  });
}
