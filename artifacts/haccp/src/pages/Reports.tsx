import { useState } from "react";
import { TempReport, CleanReport, statusLabel } from "../lib/data";
import { downloadTempReport, downloadCleanReport, exportAllTempCSV, exportAllCleanCSV, downloadMonthlyOverview } from "../lib/pdf";

interface Props {
  tempReports: TempReport[];
  cleanReports: CleanReport[];
  onDeleteTemp: (id: string) => void;
  onDeleteClean: (id: string) => void;
  onToast: (msg: string) => void;
}
type Tab = "temp" | "clean" | "maand";
type CleanFreq = "dagelijks" | "wekelijks" | "maandelijks";

function MonthlyPanel({ tempReports, cleanReports, onToast }: { tempReports: TempReport[]; cleanReports: CleanReport[]; onToast: (m: string) => void }) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const months = ["Januari","Februari","Maart","April","Mei","Juni","Juli","Augustus","September","Oktober","November","December"];
  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);
  const parse = (s: string) => { const p = s.split("/"); return p.length === 3 ? { m: parseInt(p[1]), y: parseInt(p[2]) } : null; };
  const fT = tempReports.filter(r => { const d = parse(r.date); return d && d.m === month && d.y === year; });
  const fC = cleanReports.filter(r => { const d = parse(r.datum); return d && d.m === month && d.y === year; });
  const total = fT.length + fC.length;
  const monthLabel = new Date(year, month - 1).toLocaleDateString("nl-BE", { month: "long", year: "numeric" });
  const nokT = fT.filter(r => r.overallStatus === "nok").length;
  const warnT = fT.filter(r => r.overallStatus === "warn").length;
  const doneC = fC.filter(r => r.overallStatus === "ok").length;
  return (
    <div className="card">
      <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border)", background: "var(--beige-light)" }}>
        <div className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "var(--text-muted)" }}>Selecteer periode</div>
        <div className="flex flex-wrap gap-3">
          <div>
            <label className="block text-xs mb-1.5 uppercase tracking-wide" style={{ color: "var(--text-muted)", fontSize: 11 }}>Maand</label>
            <select value={month} onChange={e => setMonth(Number(e.target.value))} className="input-brand" style={{ minWidth: 140 }}>
              {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs mb-1.5 uppercase tracking-wide" style={{ color: "var(--text-muted)", fontSize: 11 }}>Jaar</label>
            <select value={year} onChange={e => setYear(Number(e.target.value))} className="input-brand">
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
      </div>
      <div className="px-5 py-5">
        <div className="text-sm font-semibold mb-4 capitalize" style={{ color: "var(--text)" }}>{monthLabel}</div>
        {total === 0 ? (
          <div className="text-sm italic py-2" style={{ color: "var(--text-muted)" }}>Geen rapporten gevonden voor deze maand.</div>
        ) : (
          <div className="space-y-3 mb-5">
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: "var(--text-muted)" }}>Temperatuurrapporten</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{fT.length}</span>
                {nokT > 0 && <span className="badge-nok">{nokT} NOK</span>}
                {warnT > 0 && <span className="badge-warn">{warnT} let op</span>}
                {fT.length > 0 && !nokT && !warnT && <span className="badge-ok">Alles OK</span>}
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: "var(--text-muted)" }}>Reinigingsrapporten</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{fC.length}</span>
                {fC.length > 0 && <span className={doneC === fC.length ? "badge-ok" : "badge-warn"}>{doneC}/{fC.length} volledig</span>}
              </div>
            </div>
            <div className="flex items-center justify-between text-xs pt-2" style={{ borderTop: "1px solid var(--border)", color: "var(--text-muted)" }}>
              <span>Totaal rapporten</span>
              <span className="font-semibold" style={{ color: "var(--text)" }}>{total}</span>
            </div>
          </div>
        )}
        <button
          onClick={() => { if (!total) { onToast("Geen rapporten voor deze maand."); return; } downloadMonthlyOverview(month, year, tempReports, cleanReports); onToast("Maandoverzicht PDF gedownload"); }}
          className={total === 0 ? "btn-secondary opacity-50 cursor-not-allowed" : "btn-primary"}
          disabled={total === 0}
        >
          Maandoverzicht downloaden
        </button>
      </div>
    </div>
  );
}

export function Reports({ tempReports, cleanReports, onDeleteTemp, onDeleteClean, onToast }: Props) {
  const [tab, setTab] = useState<Tab>("temp");
  const [cleanFreq, setCleanFreq] = useState<CleanFreq>("dagelijks");
  const tabs: { key: Tab; label: string }[] = [{ key: "temp", label: "Temperatuur" }, { key: "clean", label: "Reiniging" }, { key: "maand", label: "Maandoverzicht" }];
  const cleanFreqs: { key: CleanFreq; label: string }[] = [{ key: "dagelijks", label: "Dagelijks" }, { key: "wekelijks", label: "Wekelijks" }, { key: "maandelijks", label: "Maandelijks" }];

  const delT = (id: string) => { if (confirm("Verwijderen?")) { onDeleteTemp(id); onToast("Rapport verwijderd"); } };
  const delC = (id: string) => { if (confirm("Verwijderen?")) { onDeleteClean(id); onToast("Rapport verwijderd"); } };
  const viewT = (r: TempReport) => alert(`${r.week}\n${r.date} | Paraaf: ${r.paraaf || "—"}\n\n` + r.rows.filter(row => row.avg).map(row => `${row.object}: ${row.avg}°C (${statusLabel(row.status)})${row.maatregel ? " – " + row.maatregel : ""}`).join("\n"));
  const viewC = (r: CleanReport) => alert(`${r.freq} – ${r.datum}\nDoor: ${r.door || "—"}\n\n` + r.rows.map(row => `${row.checked ? "✓" : "✗"} ${row.task}${row.note ? " – " + row.note : ""}`).join("\n"));

  return (
    <div className="space-y-4">
      <div className="flex gap-0" style={{ borderBottom: "1px solid var(--border)" }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="px-5 py-2.5 text-sm transition-all"
            style={{ background: tab === t.key ? "var(--sage)" : "transparent", color: tab === t.key ? "white" : "var(--text-muted)", fontWeight: tab === t.key ? 500 : 400, border: "none", cursor: "pointer" }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "temp" && (
        <div className="card overflow-hidden">
          <div className="px-5 py-3 flex items-center justify-between flex-wrap gap-2" style={{ borderBottom: "1px solid var(--border)", background: "var(--beige-light)" }}>
            <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>Temperatuurrapporten per week</span>
            <button onClick={() => { if (!tempReports.length) { onToast("Geen rapporten."); return; } exportAllTempCSV(tempReports); onToast("CSV gedownload"); }} className="btn-secondary text-xs py-1.5 px-3">CSV exporteren</button>
          </div>
          {tempReports.length === 0 ? <div className="px-5 py-8 text-center text-sm italic" style={{ color: "var(--text-muted)" }}>Nog geen temperatuurrapporten opgeslagen</div> : (
            <div>
              {tempReports.map((r, i) => {
                const nokCount = r.rows.filter(row => row.status === "nok").length;
                const warnCount = r.rows.filter(row => row.status === "warn").length;
                return (
                  <div key={r.id} className="px-5 py-4 flex flex-wrap items-start justify-between gap-3"
                    style={{ borderBottom: i < tempReports.length - 1 ? "1px solid var(--beige-light)" : "none" }}>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>{r.week}</div>
                      <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{r.rows.filter(row => row.avg).length} obj · {r.date} {r.time}{r.paraaf ? ` · ${r.paraaf}` : ""}</div>
                      <div className="flex gap-1.5 mt-1.5 flex-wrap">
                        {nokCount > 0 && <span className="badge-nok">{nokCount} NOK</span>}
                        {warnCount > 0 && <span className="badge-warn">{warnCount} let op</span>}
                        {!nokCount && !warnCount && <span className="badge-ok">Alles OK</span>}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <button onClick={() => viewT(r)} className="btn-secondary text-xs py-1.5 px-3">Bekijken</button>
                      <button onClick={() => { downloadTempReport(r); onToast("PDF gedownload"); }} className="btn-secondary text-xs py-1.5 px-3">PDF</button>
                      <button onClick={() => delT(r.id)} className="btn-danger text-xs py-1.5 px-3">✕</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === "clean" && (
        <div className="card overflow-hidden">
          {/* Submenu: dagelijks / wekelijks / maandelijks */}
          <div style={{ borderBottom: "1px solid var(--border)", background: "var(--beige-light)" }}>
            <div className="px-5 pt-3 pb-0 flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>Reinigingsrapporten</span>
              <button
                onClick={() => {
                  const filtered = cleanReports.filter(r => r.freq === cleanFreq);
                  if (!filtered.length) { onToast("Geen rapporten."); return; }
                  exportAllCleanCSV(filtered);
                  onToast("CSV gedownload");
                }}
                className="btn-secondary text-xs py-1.5 px-3"
              >CSV exporteren</button>
            </div>
            <div className="flex px-5 pt-2">
              {cleanFreqs.map(f => (
                <button key={f.key} onClick={() => setCleanFreq(f.key)}
                  className="px-4 py-1.5 text-xs transition-all"
                  style={{
                    background: cleanFreq === f.key ? "var(--sage)" : "transparent",
                    color: cleanFreq === f.key ? "white" : "var(--text-muted)",
                    fontWeight: cleanFreq === f.key ? 600 : 400,
                    border: "none",
                    cursor: "pointer",
                    borderRadius: "4px 4px 0 0",
                  }}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          {/* Report list filtered by freq */}
          {(() => {
            const filtered = cleanReports.filter(r => r.freq === cleanFreq);
            if (filtered.length === 0) {
              return <div className="px-5 py-8 text-center text-sm italic" style={{ color: "var(--text-muted)" }}>Nog geen {cleanFreq}e reinigingsrapporten opgeslagen</div>;
            }
            return (
              <div>
                {filtered.map((r, i) => {
                  const done = r.rows.filter(row => row.checked).length;
                  const total = r.rows.length;
                  return (
                    <div key={r.id} className="px-5 py-4 flex flex-wrap items-start justify-between gap-3"
                      style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--beige-light)" : "none" }}>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>{r.datum}</div>
                        <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Door: {r.door || "—"} · {r.time}</div>
                        <div className="mt-1.5">
                          <span className={done === total ? "badge-ok" : "badge-warn"}>{done}/{total} taken afgevinkt</span>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <button onClick={() => viewC(r)} className="btn-secondary text-xs py-1.5 px-3">Bekijken</button>
                        <button onClick={() => { downloadCleanReport(r); onToast("PDF gedownload"); }} className="btn-secondary text-xs py-1.5 px-3">PDF</button>
                        <button onClick={() => delC(r.id)} className="btn-danger text-xs py-1.5 px-3">✕</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {tab === "maand" && <MonthlyPanel tempReports={tempReports} cleanReports={cleanReports} onToast={onToast} />}
    </div>
  );
}
