import { Calculator, History, Keyboard, Moon, Sun, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FunctionGraph } from "./components/FunctionGraph";
import { IterationTable } from "./components/IterationTable";
import { ResultCard } from "./components/ResultCard";
import { copyResult } from "./export/clipboard";
import { exportToExcel } from "./export/excel";
import { compileRealFunction } from "./math/parser";
import { scanIntervals } from "./math/scan";
import { analyzeFixedPoint } from "./methods/fixedPoint";
import { methodNames, solveMethod } from "./methods";
import { clearHistory, deleteHistoryEntry, readHistory, saveHistoryEntry } from "./storage/history";
import { HistoryEntry, MethodConfig, MethodId, PointSelection, SolveResult } from "./types/numerical";

const mathTemplates = [
  { label: "x", value: "x" },
  { label: "x^2", value: "x^2" },
  { label: "x^3", value: "x^3" },
  { label: "x^4", value: "x^4" },
  { label: "sin", value: "sin(x)" },
  { label: "cos", value: "cos(x)" },
  { label: "tan", value: "tan(x)" },
  { label: "exp", value: "exp(x)" },
  { label: "log", value: "log(x)" },
  { label: "sqrt", value: "sqrt(x)" },
  { label: "pi", value: "pi" },
  { label: "( )", value: "()" },
  { label: "+", value: "+" },
  { label: "-", value: "-" },
  { label: "*", value: "*" },
  { label: "/", value: "/" },
];

const defaultConfig: MethodConfig = {
  method: "bisection",
  a: 1,
  b: 2,
  x0: 1.5,
  x1: 2,
  x2: 2.5,
  tolerance: 0.0005,
  maxIterations: 50,
  stopCriterion: "teacher",
  derivative: "",
  gExpressions: ["20/(x^2+2*x+10)", "exp(-x)", "(x+exp(-x))/2"],
  selectedGIndex: 0,
  coefficients: "1, -2, -4, -4, -4",
  r: 0,
  s: 0,
};

const methodOrder: MethodId[] = [
  "bisection",
  "false-position",
  "fixed-point",
  "newton",
  "secant",
  "muller",
  "bairstow",
];

const methodCards: Record<MethodId, { formula: string; hint: string; fields: string }> = {
  bisection: {
    formula: "c=(a+b)/2",
    hint: "Seguro cuando hay cambio de signo.",
    fields: "a, b",
  },
  "false-position": {
    formula: "xr por recta",
    hint: "Cerrado, pero usa interpolacion.",
    fields: "a, b",
  },
  "fixed-point": {
    formula: "x=g(x)",
    hint: "Compara formulas y convergencia.",
    fields: "g(x), x0",
  },
  newton: {
    formula: "tangente",
    hint: "Rapido si el punto inicial es bueno.",
    fields: "x0, f'(x)",
  },
  secant: {
    formula: "dos puntos",
    hint: "Como Newton, sin derivada.",
    fields: "x0, x1",
  },
  muller: {
    formula: "parabola",
    hint: "Puede encontrar raices complejas.",
    fields: "x0, x1, x2",
  },
  bairstow: {
    formula: "polinomios",
    hint: "Factores cuadraticos y raices.",
    fields: "coef, r, s",
  },
};

function App() {
  const [expression, setExpression] = useState("exp(-x)+sin(x)-x^2");
  const [config, setConfig] = useState<MethodConfig>(defaultConfig);
  const [range, setRange] = useState({ min: -5, max: 5 });
  const [darkMode, setDarkMode] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [selectedPoints, setSelectedPoints] = useState<PointSelection[]>([]);
  const [result, setResult] = useState<SolveResult | null>(null);
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const expressionRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    setHistory(readHistory());
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowSplash(false), 2100);
    return () => window.clearTimeout(timer);
  }, []);

  const validation = useMemo(() => {
    try {
      return { f: compileRealFunction(expression), error: "" };
    } catch (error) {
      return { f: null, error: error instanceof Error ? error.message : "Funcion invalida." };
    }
  }, [expression]);
  const compiled = validation.f;

  const intervals = useMemo(() => {
    if (!compiled || range.max <= range.min) return [];
    return scanIntervals(compiled, range.min, range.max);
  }, [compiled, range.max, range.min]);

  const convergence = useMemo(
    () => analyzeFixedPoint(config.gExpressions, config.x0),
    [config.gExpressions, config.x0],
  );

  const updateConfig = <K extends keyof MethodConfig>(key: K, value: MethodConfig[K]) => {
    setConfig((current) => ({ ...current, [key]: value }));
  };

  const insertTemplate = (value: string) => {
    const input = expressionRef.current;
    if (!input) {
      setExpression((current) => `${current}${value}`);
      return;
    }

    const start = input.selectionStart;
    const end = input.selectionEnd;
    const next = `${expression.slice(0, start)}${value}${expression.slice(end)}`;
    const cursorOffset = value === "()" ? 1 : value.endsWith("(x)") ? value.length - 2 : value.length;
    setExpression(next);
    requestAnimationFrame(() => {
      input.focus();
      input.setSelectionRange(start + cursorOffset, start + cursorOffset);
    });
  };

  const setPoint = (point: PointSelection, target: "a" | "b" | "x0" | "x1" | "x2") => {
    updateConfig(target, Number(point.x.toFixed(8)));
  };

  const onSelectPoint = useCallback((point: PointSelection) => {
    setSelectedPoints((current) => [...current.slice(-4), point]);
  }, []);

  const solve = () => {
    try {
      const solved = solveMethod(expression, config);
      setResult(solved);
      setHistory(saveHistoryEntry(solved, config));
      setMessage("Ejercicio resuelto.");
    } catch (error) {
      setResult(null);
      setMessage(error instanceof Error ? error.message : "No se pudo resolver el ejercicio.");
    }
  };

  const loadHistory = (entry: HistoryEntry) => {
    setExpression(entry.expression);
    setConfig(entry.config);
    setMessage("Ejercicio cargado desde el historial.");
  };

  const useInterval = (a: number, b: number) => {
    setConfig((current) => ({ ...current, a: Number(a.toFixed(6)), b: Number(b.toFixed(6)) }));
  };

  const negativeIntervals = intervals.filter((item) => item.kind === "negative");
  const positiveIntervals = intervals.filter((item) => item.kind === "positive");

  if (showSplash) {
    return (
      <main className="splash-screen">
        <section className="splash-card" aria-label="Bienvenida a MaryLab">
          <div className="splash-image">
            <img src="/anime-math-guide.png" alt="" />
          </div>
          <div className="splash-copy">
            <span>Laboratorio de convergencia</span>
            <h1>Bienvenida a MaryLab</h1>
            <p>Raices numericas, paso a paso.</p>
            <small>Preparando graficas, metodos y tablas...</small>
            <div className="loading-track" aria-hidden="true">
              <div className="loading-bar" />
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="anime-hero" aria-hidden="true">
          <img src="/anime-math-guide.png" alt="" />
        </div>
        <div className="brand-block brand-centered">
          <span className="eyebrow">Laboratorio de convergencia</span>
          <h1>MaryLab</h1>
          <p className="lead-line">Raices numericas, paso a paso.</p>
          <p>Explora funciones, encuentra raices y sigue cada iteracion hasta la solucion.</p>
        </div>
        <button className="theme-toggle" type="button" onClick={() => setDarkMode((value) => !value)}>
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          {darkMode ? "Claro" : "Oscuro"}
        </button>
      </header>

      <div className="workspace-grid">
        <aside className="left-column">
          <section className="panel">
            <div className="section-title-row">
              <div>
                <h2>Ingrese f(x)</h2>
                <p>Usa sin(x), cos(x), tan(x), exp(x), log(x), sqrt(x) y potencias como x^2.</p>
              </div>
            </div>
            <textarea
              value={expression}
              onChange={(event) => setExpression(event.target.value)}
              spellCheck={false}
              className="function-input"
              ref={expressionRef}
            />
            <div className="math-pad">
              <div className="math-pad-title">
                <Keyboard size={16} />
                Atajos matematicos
              </div>
              <div className="symbol-grid">
                {mathTemplates.map((item) => (
                  <button key={item.label} type="button" onClick={() => insertTemplate(item.value)}>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="quick-presets">
              {["exp(-x)+sin(x)-x^2", "x-tan(x)", "x+log(x)"].map((item) => (
                <button key={item} type="button" onClick={() => setExpression(item)}>
                  {item}
                </button>
              ))}
            </div>
            {(validation.error || message) && <p className="status-message">{validation.error || message}</p>}
          </section>

          <section className="panel">
            <h2>Rango de grafica</h2>
            <div className="field-grid two">
              <label>
                X minimo
                <input
                  type="number"
                  value={range.min}
                  onChange={(event) => setRange((current) => ({ ...current, min: Number(event.target.value) }))}
                />
              </label>
              <label>
                X maximo
                <input
                  type="number"
                  value={range.max}
                  onChange={(event) => setRange((current) => ({ ...current, max: Number(event.target.value) }))}
                />
              </label>
            </div>
            <div className="exam-tools">
              <button
                type="button"
                disabled={!negativeIntervals.length}
                onClick={() => {
                  const item = negativeIntervals[negativeIntervals.length - 1];
                  if (item) useInterval(item.a, item.b);
                }}
              >
                Mayor raiz negativa
              </button>
              <button
                type="button"
                disabled={!positiveIntervals.length}
                onClick={() => {
                  const item = positiveIntervals[0];
                  if (item) useInterval(item.a, item.b);
                }}
              >
                Menor raiz positiva
              </button>
            </div>
          </section>

          <section className="panel">
            <div className="section-title-row">
              <div>
                <h2>Metodo numerico</h2>
                <p>Elige segun el tipo de ejercicio y sus datos iniciales.</p>
              </div>
            </div>
            <div className="method-selector" role="list" aria-label="Seleccion de metodo">
              {methodOrder.map((method) => (
                <button
                  key={method}
                  type="button"
                  className={`method-pill ${config.method === method ? "active" : ""}`}
                  onClick={() => updateConfig("method", method)}
                >
                  <strong>{methodNames[method]}</strong>
                  <small>{methodCards[method].fields}</small>
                </button>
              ))}
            </div>
            <div className="method-detail">
              <div>
                <span>{methodNames[config.method]}</span>
                <strong>{methodCards[config.method].formula}</strong>
              </div>
              <p>{methodCards[config.method].hint}</p>
            </div>
            <div className="field-grid two">
              <label>
                Tolerancia
                <input
                  type="number"
                  step="any"
                  value={config.tolerance}
                  onChange={(event) => updateConfig("tolerance", Number(event.target.value))}
                />
              </label>
              <label>
                Max. iteraciones
                <input
                  type="number"
                  value={config.maxIterations}
                  onChange={(event) => updateConfig("maxIterations", Number(event.target.value))}
                />
              </label>
            </div>
            <label>
              Criterio de parada
              <select
                value={config.stopCriterion}
                onChange={(event) => updateConfig("stopCriterion", event.target.value as MethodConfig["stopCriterion"])}
              >
                <option value="teacher">Docente por defecto</option>
                <option value="approx-percent">Error aproximado porcentual</option>
                <option value="function-abs">Valor absoluto de f(x)</option>
                <option value="iterations">Numero maximo de iteraciones</option>
              </select>
            </label>
            <DynamicFields config={config} updateConfig={updateConfig} convergence={convergence} />
            <button className="solve-button" type="button" onClick={solve}>
              <Calculator size={18} />
              Resolver
            </button>
          </section>

          <section className="panel">
            <div className="section-title-row">
              <div>
                <h2>Puntos de la grafica</h2>
                <p>Tambien puedes escribir los valores manualmente.</p>
              </div>
              <button className="icon-action" type="button" onClick={() => setSelectedPoints([])} title="Limpiar puntos">
                <Trash2 size={16} />
              </button>
            </div>
            <div className="point-list">
              {selectedPoints.map((point, index) => (
                <div key={point.id} className="point-card">
                  <strong>P{index + 1}</strong>
                  <span>x={point.x.toFixed(5)}</span>
                  <div>
                    {(["a", "b", "x0", "x1", "x2"] as const).map((target) => (
                      <button key={target} type="button" onClick={() => setPoint(point, target)}>
                        {target}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {!selectedPoints.length && <p className="empty-text">Selecciona puntos haciendo clic en la curva.</p>}
            </div>
          </section>

          <section className="panel history-panel">
            <div className="section-title-row">
              <div>
                <h2>Historial</h2>
                <p>Ultimos ejercicios resueltos.</p>
              </div>
              <History size={18} />
            </div>
            {history.map((entry) => (
              <article key={entry.id} className="history-item">
                <button type="button" onClick={() => loadHistory(entry)}>
                  <strong>{entry.methodName}</strong>
                  <span>{entry.expression}</span>
                  <small>{entry.result}</small>
                </button>
                <button type="button" onClick={() => setHistory(deleteHistoryEntry(entry.id))} title="Eliminar">
                  <Trash2 size={15} />
                </button>
              </article>
            ))}
            {history.length > 0 && (
              <button className="ghost-wide" type="button" onClick={() => setHistory(clearHistory())}>
                Limpiar historial
              </button>
            )}
            {!history.length && <p className="empty-text">Aun no hay ejercicios guardados.</p>}
          </section>
        </aside>

        <section className="right-column">
          <FunctionGraph
            expression={expression}
            f={compiled}
            range={range}
            points={selectedPoints}
            darkMode={darkMode}
            onSelectPoint={onSelectPoint}
          />
          <ResultCard result={result} />
          <IterationTable
            result={result}
            onCopy={() => result && copyResult(result)}
            onExport={() => result && exportToExcel(result, range)}
          />
        </section>
      </div>
    </main>
  );
}

function DynamicFields({
  config,
  updateConfig,
  convergence,
}: {
  config: MethodConfig;
  updateConfig: <K extends keyof MethodConfig>(key: K, value: MethodConfig[K]) => void;
  convergence: ReturnType<typeof analyzeFixedPoint>;
}) {
  if (config.method === "bisection" || config.method === "false-position") {
    return (
      <div className="field-grid two">
        <label>
          Limite inferior a
          <input type="number" step="any" value={config.a} onChange={(e) => updateConfig("a", Number(e.target.value))} />
        </label>
        <label>
          Limite superior b
          <input type="number" step="any" value={config.b} onChange={(e) => updateConfig("b", Number(e.target.value))} />
        </label>
      </div>
    );
  }

  if (config.method === "fixed-point") {
    return (
      <>
        <div className="field-grid two">
          <label>
            Valor inicial x0
            <input type="number" step="any" value={config.x0} onChange={(e) => updateConfig("x0", Number(e.target.value))} />
          </label>
          <label>
            Formula elegida
            <select
              value={config.selectedGIndex}
              onChange={(event) => updateConfig("selectedGIndex", Number(event.target.value))}
            >
              {config.gExpressions.map((_, index) => (
                <option key={index} value={index}>
                  g{index + 1}(x)
                </option>
              ))}
            </select>
          </label>
        </div>
        {config.gExpressions.map((value, index) => (
          <label key={index}>
            g{index + 1}(x)
            <input
              value={value}
              onChange={(event) => {
                const next = [...config.gExpressions];
                next[index] = event.target.value;
                updateConfig("gExpressions", next);
              }}
            />
          </label>
        ))}
        <div className="convergence-list">
          {convergence.map((item, index) => (
            <p key={`${item.expression}-${index}`} className={item.converges ? "good" : "bad"}>
              g{index + 1}: {item.message}
            </p>
          ))}
        </div>
      </>
    );
  }

  if (config.method === "newton") {
    return (
      <>
        <label>
          Valor inicial x0
          <input type="number" step="any" value={config.x0} onChange={(e) => updateConfig("x0", Number(e.target.value))} />
        </label>
        <label>
          Derivada f'(x) opcional
          <input
            value={config.derivative}
            placeholder="Vacio: usa derivada numerica docente"
            onChange={(event) => updateConfig("derivative", event.target.value)}
          />
        </label>
      </>
    );
  }

  if (config.method === "secant") {
    return (
      <div className="field-grid two">
        <label>
          x0
          <input type="number" step="any" value={config.x0} onChange={(e) => updateConfig("x0", Number(e.target.value))} />
        </label>
        <label>
          x1
          <input type="number" step="any" value={config.x1} onChange={(e) => updateConfig("x1", Number(e.target.value))} />
        </label>
      </div>
    );
  }

  if (config.method === "muller") {
    return (
      <div className="field-grid three">
        <label>
          x0
          <input type="number" step="any" value={config.x0} onChange={(e) => updateConfig("x0", Number(e.target.value))} />
        </label>
        <label>
          x1
          <input type="number" step="any" value={config.x1} onChange={(e) => updateConfig("x1", Number(e.target.value))} />
        </label>
        <label>
          x2
          <input type="number" step="any" value={config.x2} onChange={(e) => updateConfig("x2", Number(e.target.value))} />
        </label>
      </div>
    );
  }

  return (
    <>
      <label>
        Coeficientes del polinomio
        <input
          value={config.coefficients}
          onChange={(event) => updateConfig("coefficients", event.target.value)}
        />
      </label>
      <div className="field-grid two">
        <label>
          r inicial
          <input type="number" step="any" value={config.r} onChange={(e) => updateConfig("r", Number(e.target.value))} />
        </label>
        <label>
          s inicial
          <input type="number" step="any" value={config.s} onChange={(e) => updateConfig("s", Number(e.target.value))} />
        </label>
      </div>
      <p className="note">Bairstow usa implementacion estandar; la guia recibida solo lo menciona.</p>
    </>
  );
}

export default App;
