import * as XLSX from "xlsx";
import { SolveResult } from "../types/numerical";

type StyledCell = XLSX.CellObject & { s?: Record<string, unknown> };

const statusLabels: Record<string, string> = {
  converged: "Convergio",
  "not-converged": "No convergio",
  "max-iterations": "Llego al maximo de iteraciones",
  error: "Error",
};

const stopCriterionLabels: Record<string, string> = {
  teacher: "Recomendado por el metodo",
  "approx-percent": "Error aproximado porcentual",
  "function-abs": "Valor absoluto de f(x)",
  iterations: "Numero maximo de iteraciones",
};

const configLabels: Record<string, string> = {
  a: "Limite inferior a",
  b: "Limite superior b",
  x0: "Valor inicial x0",
  x1: "Valor inicial x1",
  x2: "Valor inicial x2",
  criterio: "Criterio de parada",
  derivative: "Derivada f'(x)",
  selectedGIndex: "Formula g(x) elegida",
  coefficients: "Coeficientes del polinomio",
  r: "Valor inicial r",
  s: "Valor inicial s",
};

const iterationLabels: Record<string, string> = {
  it: "Iteracion",
  aprox: "Aproximacion",
  "f(aprox)": "f(aprox)",
  dif: "Diferencia",
  Ea: "Error aproximado",
  criterio: "Criterio",
};

function autoFit(sheet: XLSX.WorkSheet): void {
  const range = XLSX.utils.decode_range(sheet["!ref"] || "A1:A1");
  const cols = [];
  for (let c = range.s.c; c <= range.e.c; c += 1) {
    let width = 14;
    for (let r = range.s.r; r <= range.e.r; r += 1) {
      const cell = sheet[XLSX.utils.encode_cell({ r, c })];
      if (cell?.v !== undefined) width = Math.max(width, String(cell.v).length + 2);
    }
    cols.push({ wch: Math.min(width, 42) });
  }
  sheet["!cols"] = cols;
}

function cell(sheet: XLSX.WorkSheet, address: string): StyledCell | undefined {
  return sheet[address] as StyledCell | undefined;
}

function paintCell(sheet: XLSX.WorkSheet, address: string, style: StyledCell["s"]): void {
  const current = cell(sheet, address);
  if (!current) return;
  current.s = { ...(current.s || {}), ...style };
}

function paintRange(sheet: XLSX.WorkSheet, rangeAddress: string, style: StyledCell["s"]): void {
  const range = XLSX.utils.decode_range(rangeAddress);
  for (let r = range.s.r; r <= range.e.r; r += 1) {
    for (let c = range.s.c; c <= range.e.c; c += 1) {
      paintCell(sheet, XLSX.utils.encode_cell({ r, c }), style);
    }
  }
}

function formatNumbers(sheet: XLSX.WorkSheet): void {
  const range = XLSX.utils.decode_range(sheet["!ref"] || "A1:A1");
  for (let r = range.s.r; r <= range.e.r; r += 1) {
    for (let c = range.s.c; c <= range.e.c; c += 1) {
      const current = cell(sheet, XLSX.utils.encode_cell({ r, c }));
      if (!current) continue;
      if (current.t === "n") current.z = "0.0000000000";
    }
  }
}

function parseExcelValue(key: string, value: string | number): string | number {
  if (typeof value === "number") return value;
  if (key === "criterio" || key === "stopCriterion") return stopCriterionLabels[value] || value;

  const trimmed = value.trim();
  if (trimmed.endsWith("%")) {
    const numeric = Number(trimmed.slice(0, -1));
    return Number.isFinite(numeric) ? numeric / 100 : value;
  }

  const numeric = Number(trimmed);
  return trimmed !== "" && Number.isFinite(numeric) ? numeric : value;
}

function buildIterationSheet(result: SolveResult): XLSX.WorkSheet {
  if (!result.iterations.length) return XLSX.utils.aoa_to_sheet([["Sin iteraciones para mostrar"]]);

  const keys = Object.keys(result.iterations[0]);
  const rows = [
    keys.map((key) => iterationLabels[key] || key),
    ...result.iterations.map((row) => keys.map((key) => parseExcelValue(key, row[key]))),
  ];
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  sheet["!autofilter"] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: 0, c: keys.length - 1 } }) };
  autoFit(sheet);
  formatNumbers(sheet);
  keys.forEach((key, index) => {
    if (key === "Ea") {
      for (let row = 1; row <= result.iterations.length; row += 1) {
        const current = cell(sheet, XLSX.utils.encode_cell({ r: row, c: index }));
        if (current?.t === "n") current.z = "0.00000000%";
      }
    }
  });
  paintRange(sheet, XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: 0, c: keys.length - 1 } }), headerStyle());
  return sheet;
}

function headerStyle(): StyledCell["s"] {
  return {
    font: { bold: true, color: { rgb: "FFFFFF" } },
    fill: { fgColor: { rgb: "1D4ED8" } },
    alignment: { horizontal: "center", vertical: "center" },
  };
}

function titleStyle(): StyledCell["s"] {
  return {
    font: { bold: true, color: { rgb: "FFFFFF" }, sz: 18 },
    fill: { fgColor: { rgb: "0B1F3A" } },
    alignment: { horizontal: "center", vertical: "center" },
  };
}

function sectionStyle(): StyledCell["s"] {
  return {
    font: { bold: true, color: { rgb: "0B1F3A" } },
    fill: { fgColor: { rgb: "DBEAFE" } },
  };
}

export function exportToExcel(result: SolveResult, graphRange: { min: number; max: number }): void {
  const wb = XLSX.utils.book_new();
  const date = new Date();
  const criterion = String(result.configSnapshot.criterio || result.configSnapshot.stopCriterion || "teacher");
  const criterionLabel = stopCriterionLabels[criterion] || criterion;

  const summary = XLSX.utils.aoa_to_sheet([
    ["MaryLab - Reporte de metodo numerico", "", "", ""],
    [],
    ["Resumen del ejercicio", ""],
    ["Metodo", result.methodName],
    ["Funcion", result.expression],
    ["Datos iniciales", result.initialData],
    ["Criterio de parada", criterionLabel],
    ["Tolerancia", result.tolerance],
    ["Resultado final", result.roots.join(", ")],
    ["f(x) final", result.finalFx],
    ["Error", result.finalError],
    ["Iteraciones", result.iterations.length],
    ["Estado", statusLabels[result.status] || result.status],
    ["Fecha", date.toLocaleString()],
    [],
    ["Interpretacion", result.explanation],
  ]);
  summary["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }];
  paintRange(summary, "A1:D1", titleStyle());
  paintRange(summary, "A3:D3", sectionStyle());
  paintRange(summary, "A4:A13", { font: { bold: true } });
  autoFit(summary);
  formatNumbers(summary);
  XLSX.utils.book_append_sheet(wb, summary, "Resumen");

  XLSX.utils.book_append_sheet(wb, buildIterationSheet(result), "Iteraciones");

  const configRows = Object.entries(result.configSnapshot).map(([key, value]) => [
    configLabels[key] || key,
    parseExcelValue(key, value),
  ]);
  const configuration = XLSX.utils.aoa_to_sheet([
    ["Configuracion usada", ""],
    ["Rango X minimo", graphRange.min],
    ["Rango X maximo", graphRange.max],
    ...configRows,
  ]);
  paintRange(configuration, "A1:B1", sectionStyle());
  paintRange(configuration, `A2:A${configRows.length + 3}`, { font: { bold: true } });
  autoFit(configuration);
  formatNumbers(configuration);
  XLSX.utils.book_append_sheet(wb, configuration, "Configuracion");

  const guide = XLSX.utils.aoa_to_sheet([
    ["Guia rapida", ""],
    ["Criterio recomendado por el metodo", "Antes aparecia como teacher. Es la opcion automatica recomendada."],
    ["Biseccion", "Se detiene cuando el intervalo ya es suficientemente pequeno."],
    ["Regla falsa", "Se detiene cuando el valor absoluto de f(x) es suficientemente pequeno."],
    ["Newton, secante y punto fijo", "Se detienen cuando el cambio entre aproximaciones es pequeno."],
    ["Error aproximado porcentual", "Compara la aproximacion nueva con la anterior y lo muestra como porcentaje."],
  ]);
  paintRange(guide, "A1:B1", titleStyle());
  paintRange(guide, "A2:A6", { font: { bold: true } });
  autoFit(guide);
  XLSX.utils.book_append_sheet(wb, guide, "Guia");

  wb.Props = {
    Title: "MaryLab - Reporte de metodo numerico",
    Subject: result.methodName,
    Author: "MaryLab",
    CreatedDate: date,
  };

  const safeMethod = result.methodName.replace(/\s+/g, "");
  const stamp = date.toISOString().slice(0, 10);
  XLSX.writeFile(wb, `MaryLab_${safeMethod}_${stamp}.xlsx`, {
    cellStyles: true,
  });
}
