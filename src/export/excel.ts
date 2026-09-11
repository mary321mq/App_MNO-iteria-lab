import * as XLSX from "xlsx-js-style";
import { SolveResult } from "../types/numerical";

type StyledCell = XLSX.CellObject & { s?: Record<string, unknown> };
type SheetTheme = "title" | "section" | "header" | "label" | "value" | "zebra" | "result";

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
  a: "a",
  b: "b",
  x0: "x0",
  x1: "x1",
  x2: "x2",
  aprox: "Aproximacion",
  "f(aprox)": "f(aprox)",
  dif: "Diferencia",
  Ea: "Error aproximado",
  criterio: "Criterio",
};

const border = {
  top: { style: "thin", color: { rgb: "B7C7DC" } },
  bottom: { style: "thin", color: { rgb: "B7C7DC" } },
  left: { style: "thin", color: { rgb: "B7C7DC" } },
  right: { style: "thin", color: { rgb: "B7C7DC" } },
};

function style(theme: SheetTheme): StyledCell["s"] {
  const base = {
    border,
    alignment: { vertical: "center", wrapText: true },
    font: { name: "Calibri", sz: 11, color: { rgb: "0B1F3A" } },
  };

  const themes: Record<SheetTheme, StyledCell["s"]> = {
    title: {
      ...base,
      font: { name: "Calibri", sz: 18, bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "0B1F3A" } },
      alignment: { horizontal: "center", vertical: "center" },
    },
    section: {
      ...base,
      font: { name: "Calibri", sz: 12, bold: true, color: { rgb: "0B1F3A" } },
      fill: { fgColor: { rgb: "DBEAFE" } },
      alignment: { horizontal: "center", vertical: "center" },
    },
    header: {
      ...base,
      font: { name: "Calibri", sz: 11, bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "1D4ED8" } },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
    },
    label: {
      ...base,
      font: { name: "Calibri", sz: 11, bold: true, color: { rgb: "0B1F3A" } },
      fill: { fgColor: { rgb: "EFF6FF" } },
    },
    value: {
      ...base,
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
    },
    zebra: {
      ...base,
      fill: { fgColor: { rgb: "F8FBFF" } },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
    },
    result: {
      ...base,
      font: { name: "Calibri", sz: 12, bold: true, color: { rgb: "0B1F3A" } },
      fill: { fgColor: { rgb: "BAE6FD" } },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
    },
  };

  return themes[theme];
}

function autoFit(sheet: XLSX.WorkSheet): void {
  const range = XLSX.utils.decode_range(sheet["!ref"] || "A1:A1");
  const cols = [];

  for (let c = range.s.c; c <= range.e.c; c += 1) {
    let width = 14;
    for (let r = range.s.r; r <= range.e.r; r += 1) {
      const current = sheet[XLSX.utils.encode_cell({ r, c })];
      if (current?.v !== undefined) width = Math.max(width, String(current.v).length + 2);
    }
    cols.push({ wch: Math.min(width, 44) });
  }

  sheet["!cols"] = cols;
}

function cell(sheet: XLSX.WorkSheet, address: string): StyledCell | undefined {
  return sheet[address] as StyledCell | undefined;
}

function paintCell(sheet: XLSX.WorkSheet, address: string, cellStyle: StyledCell["s"]): void {
  const current = cell(sheet, address);
  if (!current) return;
  current.s = { ...(current.s || {}), ...cellStyle };
}

function paintRange(sheet: XLSX.WorkSheet, rangeAddress: string, cellStyle: StyledCell["s"]): void {
  const range = XLSX.utils.decode_range(rangeAddress);

  for (let r = range.s.r; r <= range.e.r; r += 1) {
    for (let c = range.s.c; c <= range.e.c; c += 1) {
      paintCell(sheet, XLSX.utils.encode_cell({ r, c }), cellStyle);
    }
  }
}

function formatSheetNumbers(sheet: XLSX.WorkSheet, percentColumns: number[] = []): void {
  const range = XLSX.utils.decode_range(sheet["!ref"] || "A1:A1");

  for (let r = range.s.r; r <= range.e.r; r += 1) {
    for (let c = range.s.c; c <= range.e.c; c += 1) {
      const current = cell(sheet, XLSX.utils.encode_cell({ r, c }));
      if (!current || current.t !== "n") continue;
      current.z = percentColumns.includes(c) ? "0.00000000%" : "0.0000000000";
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

function buildSummarySheet(result: SolveResult, criterionLabel: string, date: Date): XLSX.WorkSheet {
  const rows = [
    ["MaryLab - Reporte de metodo numerico", "", "", ""],
    [],
    ["Resumen del ejercicio", "", "", ""],
    ["Metodo", result.methodName, "Estado", statusLabels[result.status] || result.status],
    ["Funcion", result.expression, "Fecha", date.toLocaleString()],
    ["Datos iniciales", result.initialData, "Iteraciones", result.iterations.length],
    ["Criterio de parada", criterionLabel, "Tolerancia", result.tolerance],
    [],
    ["Resultado final", result.roots.join(", "), "f(x) final", parseExcelValue("finalFx", result.finalFx)],
    ["Error", parseExcelValue("Ea", result.finalError), "", ""],
    [],
    ["Interpretacion", result.explanation, "", ""],
  ];
  const sheet = XLSX.utils.aoa_to_sheet(rows);

  sheet["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 3 } },
    { s: { r: 11, c: 1 }, e: { r: 11, c: 3 } },
  ];
  sheet["!rows"] = [{ hpt: 28 }, { hpt: 8 }, { hpt: 22 }, ...Array(9).fill({ hpt: 24 })];

  paintRange(sheet, "A1:D1", style("title"));
  paintRange(sheet, "A3:D3", style("section"));
  paintRange(sheet, "A4:A10", style("label"));
  paintRange(sheet, "C4:C10", style("label"));
  paintRange(sheet, "B4:B10", style("value"));
  paintRange(sheet, "D4:D10", style("value"));
  paintRange(sheet, "A9:D10", style("result"));
  paintRange(sheet, "A12:D12", style("value"));
  paintCell(sheet, "A12", style("label"));
  formatSheetNumbers(sheet, [1]);
  autoFit(sheet);

  return sheet;
}

function buildIterationSheet(result: SolveResult): XLSX.WorkSheet {
  if (!result.iterations.length) return XLSX.utils.aoa_to_sheet([["Sin iteraciones para mostrar"]]);

  const keys = Object.keys(result.iterations[0]);
  const headerRow = 3;
  const rows = [
    ["Tabla de iteraciones", "", "", "", "", "", "", ""],
    [`Metodo: ${result.methodName}`, `Funcion: ${result.expression}`, "", "", "", "", "", ""],
    [],
    keys.map((key) => iterationLabels[key] || key),
    ...result.iterations.map((row) => keys.map((key) => parseExcelValue(key, row[key]))),
  ];
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  const lastColumn = Math.max(keys.length - 1, 0);
  const lastRow = result.iterations.length + headerRow;
  const percentColumns = keys.reduce<number[]>((columns, key, index) => {
    if (key === "Ea") columns.push(index);
    return columns;
  }, []);

  sheet["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: lastColumn } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: lastColumn } },
  ];
  sheet["!autofilter"] = {
    ref: XLSX.utils.encode_range({ s: { r: headerRow, c: 0 }, e: { r: lastRow, c: lastColumn } }),
  };
  sheet["!rows"] = [
    { hpt: 28 },
    { hpt: 22 },
    { hpt: 8 },
    { hpt: 24 },
    ...result.iterations.map(() => ({ hpt: 21 })),
  ];

  paintRange(sheet, XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: 0, c: lastColumn } }), style("title"));
  paintRange(sheet, XLSX.utils.encode_range({ s: { r: 1, c: 0 }, e: { r: 1, c: lastColumn } }), style("section"));
  paintRange(sheet, XLSX.utils.encode_range({ s: { r: headerRow, c: 0 }, e: { r: headerRow, c: lastColumn } }), style("header"));

  for (let r = headerRow + 1; r <= lastRow; r += 1) {
    const rowStyle = (r - headerRow) % 2 === 0 ? style("zebra") : style("value");
    paintRange(sheet, XLSX.utils.encode_range({ s: { r, c: 0 }, e: { r, c: lastColumn } }), rowStyle);
  }

  formatSheetNumbers(sheet, percentColumns);
  autoFit(sheet);

  return sheet;
}

function buildConfigSheet(result: SolveResult, graphRange: { min: number; max: number }): XLSX.WorkSheet {
  const configRows = Object.entries(result.configSnapshot).map(([key, value]) => [
    configLabels[key] || key,
    parseExcelValue(key, value),
  ]);
  const rows = [
    ["Configuracion usada", ""],
    ["Rango X minimo", graphRange.min],
    ["Rango X maximo", graphRange.max],
    ...configRows,
  ];
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  const lastRow = rows.length;

  sheet["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];
  sheet["!rows"] = [{ hpt: 26 }, ...Array(lastRow - 1).fill({ hpt: 22 })];
  paintRange(sheet, "A1:B1", style("title"));
  paintRange(sheet, `A2:A${lastRow}`, style("label"));
  paintRange(sheet, `B2:B${lastRow}`, style("value"));
  formatSheetNumbers(sheet);
  autoFit(sheet);

  return sheet;
}

export function exportToExcel(result: SolveResult, graphRange: { min: number; max: number }): void {
  const wb = XLSX.utils.book_new();
  const date = new Date();
  const criterion = String(result.configSnapshot.criterio || result.configSnapshot.stopCriterion || "teacher");
  const criterionLabel = stopCriterionLabels[criterion] || criterion;

  XLSX.utils.book_append_sheet(wb, buildSummarySheet(result, criterionLabel, date), "Resumen");
  XLSX.utils.book_append_sheet(wb, buildIterationSheet(result), "Iteraciones");
  XLSX.utils.book_append_sheet(wb, buildConfigSheet(result, graphRange), "Configuracion");

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
