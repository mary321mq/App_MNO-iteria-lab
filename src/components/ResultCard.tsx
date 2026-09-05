import { AlertTriangle, CheckCircle2, CircleDotDashed } from "lucide-react";
import { SolveResult } from "../types/numerical";

export function ResultCard({ result }: { result: SolveResult | null }) {
  if (!result) {
    return (
      <section className="panel result-card">
        <CircleDotDashed size={22} />
        <div>
          <h2>Resultado final</h2>
          <p>Configura un metodo y presiona Resolver.</p>
        </div>
      </section>
    );
  }

  const ok = result.status === "converged";

  return (
    <section className={`panel result-card ${ok ? "success" : "warning"}`}>
      {ok ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
      <div>
        <h2>{result.methodName}</h2>
        <p>{result.explanation}</p>
        <dl className="summary-grid">
          <div>
            <dt>Estado</dt>
            <dd>{ok ? "Convergio" : result.status === "max-iterations" ? "Maximo de iteraciones" : "No convergio"}</dd>
          </div>
          <div>
            <dt>Raiz</dt>
            <dd>{result.roots.join(", ")}</dd>
          </div>
          <div>
            <dt>f(x)</dt>
            <dd>{result.finalFx}</dd>
          </div>
          <div>
            <dt>Error</dt>
            <dd>{result.finalError}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
