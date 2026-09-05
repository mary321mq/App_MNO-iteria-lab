import { RotateCcw } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import Plotly from "plotly.js-dist-min";
import { PointSelection } from "../types/numerical";
import { formatNumber } from "../math/format";

interface FunctionGraphProps {
  expression: string;
  f: ((x: number) => number) | null;
  range: { min: number; max: number };
  points: PointSelection[];
  darkMode: boolean;
  onSelectPoint: (point: PointSelection) => void;
}

export function FunctionGraph({
  expression,
  f,
  range,
  points,
  darkMode,
  onSelectPoint,
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
        line: { color: "#1d4ed8", width: 3 },
        hovertemplate: "x=%{x:.6f}<br>f(x)=%{y:.6f}<extra></extra>",
      },
      {
        x: points.map((point) => point.x),
        y: points.map((point) => point.y),
        type: "scatter",
        mode: "markers+text",
        name: "Puntos",
        marker: { color: "#38bdf8", size: 10, line: { color: "#0b1f3a", width: 1 } },
        text: points.map((_, index) => `P${index + 1}`),
        textposition: "top center",
        hovertemplate: "x=%{x:.6f}<br>f(x)=%{y:.6f}<extra></extra>",
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
      legend: { orientation: "h", x: 0, y: 1.12 },
      hovermode: "closest",
    };

    Plotly.react(graphRef.current, data, layout, {
      responsive: true,
      displaylogo: false,
      scrollZoom: true,
      modeBarButtonsToRemove: ["lasso2d", "select2d"],
    });

    const graph = graphRef.current as HTMLElement & {
      on?: (event: string, handler: (event: { points?: Array<{ x: number }> }) => void) => void;
      removeAllListeners?: (event: string) => void;
    };
    graph.removeAllListeners?.("plotly_click");
    graph.on?.("plotly_click", (event) => {
      const x = event.points?.[0]?.x;
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
  }, [darkMode, expression, f, onSelectPoint, points, range.max, range.min, samples.x, samples.y]);

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
      <div className="selected-points">
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
    </section>
  );
}
