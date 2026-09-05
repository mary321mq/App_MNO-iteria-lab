import { Copy, Download } from "lucide-react";
import { SolveResult } from "../types/numerical";

interface IterationTableProps {
  result: SolveResult | null;
  onCopy: () => void;
  onExport: () => void;
}

export function IterationTable({ result, onCopy, onExport }: IterationTableProps) {
  if (!result) {
    return (
      <section className="panel">
        <h2>Tabla de iteraciones</h2>
        <p className="empty-text">Resuelve un ejercicio para ver la tabla.</p>
      </section>
    );
  }

  const headers = Object.keys(result.iterations[0] || {});

  return (
    <section className="panel">
      <div className="section-title-row">
        <div>
          <h2>Tabla de iteraciones</h2>
          <p>Formato claro para Octave, Excel y Word.</p>
        </div>
        <div className="inline-actions">
          <button type="button" onClick={onCopy}>
            <Copy size={16} />
            Copiar
          </button>
          <button type="button" onClick={onExport}>
            <Download size={16} />
            Excel
          </button>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {headers.map((header) => (
                <th key={header}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.iterations.map((row, rowIndex) => (
              <tr key={`${result.method}-${rowIndex}`}>
                {headers.map((header) => (
                  <td key={header}>{row[header]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
