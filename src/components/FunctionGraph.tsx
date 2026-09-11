import { RotateCcw } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import Plotly from "plotly.js-dist-min";
import { PointSelection, ScanInterval } from "../types/numerical";
import { formatNumber } from "../math/format";

interface FunctionGraphProps {
  expression: string;
  f: ((x: number) => number) | null;
  range: { min: number; max: number };
  points: PointSelection[];
  detectedIntervals: ScanInterval[];
  darkMode: boolean;
  onSelectPoint: (point: PointSelection) => void;
  onUseDetectedInterval: (a: number, b: number) => void;
}

interface DetectedRoot {
  root: number;
  a: number;
  b: number;
}

function refineRoot(f: (x: number) => number, a: number, b: number): number | null {
  let left = a;
  let right = b;
  let fLeft = f(left);
  let fRight = f(right);

  if (!Number.isFinite(fLeft) || !Number.isFinite(fRight)) return null;
  if (Math.abs(fLeft) < 1e-12) return left;
  if (Math.abs(fRight) < 1e-12) return right;
  if (fLeft * fRight > 0) return (left + right) / 2;

  for (let index = 0; index < 42; index += 1) {
    const mid = (left + right) / 2;
    const fMid = f(mid);
    if (!Number.isFinite(fMid)) return null;
    if (Math.abs(fMid) < 1e-12) return mid;

    if (fLeft * fMid <= 0) {
      right = mid;
      fRight = fMid;
    } else {
      left = mid;
      fLeft = fMid;
    }
  }

  return (left + right) / 2;
}

export function FunctionGraph({
  expression,
  f,
  range,
  points,
  detectedIntervals,
  darkMode,
  onSelectPoint,
  onUseDetectedInterval,
}: FunctionGraphProps) {
  const graphRef = useRef<HTMLDivElement | null>(null);

  const samples = useMemo(() => {
    if (!f || range.max <= range.min) return { x: [], y: [] };
    const x: number[] = [];
    const y: Array<number | null> = [];
    const steps = 600;
    for (let i = 0; i <= steps; i += 1) {
      const value = range.min + ((range.max - range.min) * i) / steps;
      x.push(value);
      try {
        const evaluated = f(value);
        y.push(Number.isFinite(evaluated) && Math.abs(evaluated) < 1e8 ? evaluated : null);
      } catch {
        y.push(null);
      }
    }
    return { x, y };
  }, [f, range.max, range.min]);

  const detectedRoots = useMemo(() => {
    if (!f) return [];

    const roots = detectedIntervals
      .map((interval) => {
        const root = refineRoot(f, interval.a, interval.b);
        return root === null || !Number.isFinite(root) ? null : { root, a: interval.a, b: interval.b };
      })
      .filter((item): item is DetectedRoot => item !== null)
      .sort((left, right) => left.root - right.root);

    return roots.filter((item, index) => index === 0 || Math.abs(item.root - roots[index - 1].root) > 1e-5);
  }, [detectedIntervals, f]);

  useEffect(() => {
    if (!graphRef.current) return;
    const bg = darkMode ? "#071528" : "#ffffff";
    const grid = darkMode ? "#28415f" : "#d9e2ef";
    const text = darkMode ? "#e5eefb" : "#0b1f3a";

    const data = [
      {
        x: samples.x,
        y: samples.y,
        type: "scatter",
        mode: "lines",
        name: "f(x)",
        line: { color: "#6366f1", width: 3 },
        hovertemplate: "x=%{x:.6f}<br>f(x)=%{y:.6f}<extra></extra>",
      },
      {
        x: points.map((point) => point.x),
        y: points.map((point) => point.y),
        type: "scatter",
        mode: "markers+text",
        name: "Puntos ingresados",
        marker: { color: "#f59e0b", size: 13, line: { color: darkMode ? "#071528" : "#ffffff", width: 2 } },
        text: points.map((_, index) => `P${index + 1}`),
        textposition: "top center",
        textfont: { color: "#f59e0b", size: 12 },
        hovertemplate: "Punto ingresado<br>x=%{x:.6f}<br>f(x)=%{y:.6f}<extra></extra>",
      },
      {
        x: detectedRoots.map((item) => item.root),
        y: detectedRoots.map(() => 0),
        type: "scatter",
        mode: "markers+text",
        name: "Raices detectadas",
        marker: {
          color: "#10b981",
          size: 14,
          symbol: "diamond",
          line: { color: darkMode ? "#071528" : "#ffffff", width: 2 },
        },
        text: detectedRoots.map((_, index) => `R${index + 1}`),
        textposition: "bottom center",
        textfont: { color: "#10b981", size: 12 },
        customdata: detectedRoots.map((item) => [item.a, item.b]),
        hovertemplate: "Raiz detectada<br>x=%{x:.8f}<br>intervalo [%{customdata[0]:.5f}, %{customdata[1]:.5f}]<extra></extra>",
      },
    ];

    const layout = {
      title: { text: `f(x) = ${expression || "..."}`, font: { color: text, size: 16 } },
      paper_bgcolor: bg,
      plot_bgcolor: bg,
      font: { color: text },
      margin: { l: 48, r: 18, t: 48, b: 42 },
      xaxis: {
        title: "Eje X",
        gridcolor: grid,
        zerolinecolor: text,
        range: [range.min, range.max],
      },
      yaxis: {
        title: "Eje Y",
        gridcolor: grid,
        zerolinecolor: text,
        automargin: true,
      },
      legend: {
        orientation: "h",
        x: 0.98,
        y: 1.14,
        xanchor: "right",
        font: { color: text, size: 12 },
      },
      hovermode: "closest",
    };

    Plotly.react(graphRef.current, data, layout, {
      responsive: true,
      displaylogo: false,
      scrollZoom: true,
      modeBarButtonsToRemove: ["lasso2d", "select2d"],
    });

    const graph = graphRef.current as HTMLElement & {
      on?: (
        event: string,
        handler: (event: { points?: Array<{ x: number; curveNumber?: number; pointIndex?: number }> }) => void,
      ) => void;
      removeAllListeners?: (event: string) => void;
    };
    graph.removeAllListeners?.("plotly_click");
    graph.on?.("plotly_click", (event) => {
      const selected = event.points?.[0];
      if (selected?.curveNumber === 2 && typeof selected.pointIndex === "number") {
        const detected = detectedRoots[selected.pointIndex];
        if (detected) onUseDetectedInterval(detected.a, detected.b);
        return;
      }

      const x = selected?.x;
      if (typeof x !== "number" || !f) return;
      try {
        const y = f(x);
        onSelectPoint({ id: crypto.randomUUID(), x, y });
      } catch {
        return;
      }
    });

    return () => {
      graph.removeAllListeners?.("plotly_click");
    };
  }, [
    darkMode,
    detectedRoots,
    expression,
    f,
    onSelectPoint,
    onUseDetectedInterval,
    points,
    range.max,
    range.min,
    samples.x,
    samples.y,
  ]);

  return (
    <section className="panel graph-panel">
      <div className="section-title-row">
        <div>
          <h2>Grafica tipo Octave</h2>
          <p>Haz clic sobre la curva para tomar valores iniciales.</p>
        </div>
        <button
          className="icon-action"
          type="button"
          title="Reiniciar vista"
          onClick={() => graphRef.current && Plotly.Plots.resize(graphRef.current)}
        >
          <RotateCcw size={18} />
        </button>
      </div>
      <div className="plot-shell" ref={graphRef} />
      <div className="graph-insights">
        <div className="graph-insight-card points-card">
          <strong>Puntos ingresados</strong>
          <div className="graph-chip-list">
            {points.length === 0 ? (
              <span>No hay puntos seleccionados.</span>
            ) : (
              points.map((point, index) => (
                <span key={point.id}>
                  P{index + 1}: x={formatNumber(point.x, 7)}, f(x)={formatNumber(point.y, 7)}
                </span>
              ))
            )}
          </div>
        </div>
        <div className="graph-insight-card roots-card">
          <strong>Raices detectadas</strong>
          <div className="graph-chip-list root-list">
            {detectedRoots.length === 0 ? (
              <span>No se detectaron cruces en este rango.</span>
            ) : (
              detectedRoots.map((item, index) => (
                <div className="root-action-row" key={`${item.root}-${index}`}>
                  <span>
                    R{index + 1}: x={formatNumber(item.root, 10)} | [{formatNumber(item.a, 5)},{" "}
                    {formatNumber(item.b, 5)}]
                  </span>
                  <button type="button" onClick={() => onUseDetectedInterval(item.a, item.b)}>
                    Usar intervalo
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
