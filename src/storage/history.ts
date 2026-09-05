import { HistoryEntry, MethodConfig, SolveResult } from "../types/numerical";

const KEY = "metodos-numericos-octave-history";

export function readHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

export function saveHistoryEntry(result: SolveResult, config: MethodConfig): HistoryEntry[] {
  const entry: HistoryEntry = {
    id: crypto.randomUUID(),
    expression: result.expression,
    method: result.method,
    methodName: result.methodName,
    initialData: result.initialData,
    result: result.roots.join(", "),
    date: new Date().toISOString(),
    iterations: result.iterations.length,
    config,
  };
  const next = [entry, ...readHistory()].slice(0, 10);
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function deleteHistoryEntry(id: string): HistoryEntry[] {
  const next = readHistory().filter((entry) => entry.id !== id);
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function clearHistory(): HistoryEntry[] {
  localStorage.removeItem(KEY);
  return [];
}
