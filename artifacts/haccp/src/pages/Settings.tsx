import { useRef, useState } from "react";
import { TempReport, CleanReport } from "../lib/data";
import {
  importTempCSV, importCleanCSV,
  downloadTempTemplate, downloadCleanTemplate,
  type ImportResult,
} from "../lib/csvImport";

interface Props {
  onClear: (type: "temp" | "cleaning" | "all") => void;
  currentName: string;
  onChangeName: () => void;
  onImportTemp: (reports: TempReport[]) => Promise<number>;
  onImportClean: (reports: CleanReport[]) => Promise<number>;
  onToast: (msg: string) => void;
}

type Preview =
  | { kind: "temp"; result: ImportResult<TempReport>; filename: string }
  | { kind: "clean"; result: ImportResult<CleanReport>; filename: string };

export function Settings({
  onClear, currentName, onChangeName,
  onImportTemp, onImportClean, onToast,
}: Props) {
  const tempInputRef = useRef<HTMLInputElement>(null);
  const cleanInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [busy, setBusy] = useState(false);

  const confirm_ = (type: "temp" | "cleaning" | "all") => {
    const labels = { temp: "alle temperatuurrapporten", cleaning: "alle reinigingsrapporten", all: "ALLE rapporten" };
    if (window.confirm(`Weet je zeker dat je ${labels[type]} permanent wil verwijderen?`)) onClear(type);
  };

  const rows: { title: string; desc: string; type: "temp" | "cleaning" | "all"; danger?: boolean }[] = [
    { title: "Temperatuurrapporten", desc: "Alle opgeslagen temperatuurmetingen verwijderen", type: "temp" },
    { title: "Reinigingsrapporten", desc: "Alle opgeslagen reinigingschecks verwijderen", type: "cleaning" },
    { title: "Alles wissen", desc: "Alle rapporten in één keer verwijderen", type: "all", danger: true },
  ];

  const readFile = (f: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result || ""));
      r.onerror = () => reject(r.error);
      r.readAsText(f, "utf-8");
    });

  const handleTempFile = async (f: File | null | undefined) => {
    if (!f || busy) return;
    try {
      const text = await readFile(f);
      const result = importTempCSV(text);
      setPreview({ kind: "temp", result, filename: f.name });
    } catch { onToast("Bestand kon niet worden gelezen."); }
    if (tempInputRef.current) tempInputRef.current.value = "";
  };

  const handleCleanFile = async (f: File | null | undefined) => {
    if (!f || busy) return;
    try {
      const text = await readFile(f);
      const result = importCleanCSV(text);
      setPreview({ kind: "clean", result, filename: f.name });
    } catch { onToast("Bestand kon niet worden gelezen."); }
    if (cleanInputRef.current) cleanInputRef.current.value = "";
  };

  const confirmImport = async () => {
    if (!preview) return;
    const total = preview.result.reports.length;
    setBusy(true);
    try {
      const count = preview.kind === "temp"
        ? await onImportTemp(preview.result.reports)
        : await onImportClean(preview.result.reports);
      if (count === total) {
        onToast(`${count} rapport${count === 1 ? "" : "en"} geïmporteerd`);
      } else {
        onToast(`${count} van ${total} rapporten geïmporteerd — ${total - count} mislukt`);
      }
      setPreview(null);
    } catch {
      onToast("Importeren mislukt");
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-4">
      <div className="card overflow-hidden">
        <div className="px-5 py-3" style={{ borderBottom: "1px solid var(--border)", background: "var(--beige-light)" }}>
          <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>Jouw naam</span>
        </div>
        <div className="px-5 py-4 flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-medium" style={{ color: "var(--text)" }}>{currentName || "—"}</div>
            <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              Deze naam wordt automatisch ingevuld bij nieuwe rapporten
            </div>
          </div>
          <button onClick={onChangeName} className="btn-secondary shrink-0">Wijzigen</button>
        </div>
      </div>

      {/* ── CSV import ───────────────────────────────────────── */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3" style={{ borderBottom: "1px solid var(--border)", background: "var(--beige-light)" }}>
          <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>CSV importeren</span>
        </div>
        <div className="px-5 py-4 space-y-4">
          {/* Temperature row */}
          <div className="rounded p-3 space-y-2" style={{ background: "var(--beige-light)" }}>
            <div className="text-xs font-semibold tracking-wider uppercase" style={{ color: "var(--text-muted)" }}>Temperatuur</div>
            <div className="flex flex-wrap gap-2 items-center">
              <button onClick={downloadTempTemplate} disabled={busy} className="btn-secondary text-sm">Sjabloon downloaden</button>
              <button onClick={() => tempInputRef.current?.click()} disabled={busy} className="btn-primary text-sm"
                style={{ opacity: busy ? 0.5 : 1 }}>CSV uploaden…</button>
              <input ref={tempInputRef} type="file" accept=".csv,text/csv" className="hidden" disabled={busy}
                onChange={e => handleTempFile(e.target.files?.[0])} />
            </div>
          </div>

          {/* Cleaning row */}
          <div className="rounded p-3 space-y-2" style={{ background: "var(--beige-light)" }}>
            <div className="text-xs font-semibold tracking-wider uppercase" style={{ color: "var(--text-muted)" }}>Reiniging</div>
            <div className="flex flex-wrap gap-2 items-center">
              <button onClick={downloadCleanTemplate} disabled={busy} className="btn-secondary text-sm">Sjabloon downloaden</button>
              <button onClick={() => cleanInputRef.current?.click()} disabled={busy} className="btn-primary text-sm"
                style={{ opacity: busy ? 0.5 : 1 }}>CSV uploaden…</button>
              <input ref={cleanInputRef} type="file" accept=".csv,text/csv" className="hidden" disabled={busy}
                onChange={e => handleCleanFile(e.target.files?.[0])} />
            </div>
          </div>

          {/* Preview / confirm */}
          {preview && (
            <div className="rounded p-3 space-y-3"
              style={{ background: "#fff", border: "1px solid var(--border)" }}>
              <div className="text-sm font-medium" style={{ color: "var(--text)" }}>
                Voorvertoning — {preview.filename}
              </div>
              <div className="text-sm" style={{ color: "var(--text-muted)" }}>
                <span className="font-semibold" style={{ color: "var(--text)" }}>{preview.result.reports.length}</span> rapport{preview.result.reports.length === 1 ? "" : "en"} klaar om te importeren
                {" · "}
                <span>{preview.result.rowsRead} regels gelezen</span>
                {preview.result.rowsSkipped > 0 && <span> · <span style={{ color: "#a04a00" }}>{preview.result.rowsSkipped} overgeslagen</span></span>}
              </div>

              {preview.result.reports.length > 0 && (
                <ul className="text-xs space-y-0.5 max-h-40 overflow-y-auto pl-4 list-disc"
                  style={{ color: "var(--text-muted)" }}>
                  {preview.result.reports.slice(0, 12).map((r, i) => (
                    <li key={i}>
                      {preview.kind === "temp"
                        ? `${(r as TempReport).week} — ${(r as TempReport).date || "geen datum"} — ${(r as TempReport).paraaf || "geen paraaf"}`
                        : `${(r as CleanReport).freq} — ${(r as CleanReport).datum} — ${(r as CleanReport).door || "geen naam"}`}
                    </li>
                  ))}
                  {preview.result.reports.length > 12 && <li>… en nog {preview.result.reports.length - 12}</li>}
                </ul>
              )}

              {preview.result.warnings.length > 0 && (
                <details className="text-xs" style={{ color: "#854f0b" }}>
                  <summary className="cursor-pointer">{preview.result.warnings.length} waarschuwing{preview.result.warnings.length === 1 ? "" : "en"}</summary>
                  <ul className="mt-1 pl-4 list-disc max-h-32 overflow-y-auto">
                    {preview.result.warnings.slice(0, 50).map((w, i) => <li key={i}>{w}</li>)}
                    {preview.result.warnings.length > 50 && <li>…</li>}
                  </ul>
                </details>
              )}

              <div className="flex flex-wrap gap-2 pt-1">
                <button onClick={confirmImport} disabled={busy || preview.result.reports.length === 0}
                  className="btn-primary"
                  style={{ opacity: busy || preview.result.reports.length === 0 ? 0.5 : 1 }}>
                  {busy ? "Importeren…" : `${preview.result.reports.length} importeren`}
                </button>
                <button onClick={() => setPreview(null)} disabled={busy} className="btn-secondary">Annuleren</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-3" style={{ borderBottom: "1px solid var(--border)", background: "var(--beige-light)" }}>
          <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--danger)" }}>Gegevens wissen</span>
        </div>
        {rows.map((row, i) => (
          <div key={row.type} className="px-5 py-4 flex items-center justify-between gap-4"
            style={{ borderBottom: i < rows.length - 1 ? "1px solid var(--beige-light)" : "none" }}>
            <div>
              <div className="text-sm font-medium" style={{ color: row.danger ? "var(--danger)" : "var(--text)" }}>{row.title}</div>
              <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{row.desc}</div>
            </div>
            <button onClick={() => confirm_(row.type)} className="btn-danger shrink-0">Wissen</button>
          </div>
        ))}
      </div>
    </div>
  );
}
