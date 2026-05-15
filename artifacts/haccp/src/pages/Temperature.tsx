import { useState, useMemo } from "react";
import { OBJECTS, TempRow, TempReport, statusForTemp, worstStatus, uid, todayDate, nowTime, Status } from "../lib/data";
import { isoWeekNumber } from "../lib/schedule";
import { Badge } from "../components/Badge";
import { exportAllTempCSV } from "../lib/pdf";

interface Props {
  tempReports: TempReport[];
  onSave: (r: TempReport) => void;
  onToast: (msg: string) => void;
  autoFillParaaf?: string;
}

type Measurements = Record<string, { m1: string; m2: string; m3: string; maatregel: string }>;

function initM(): Measurements {
  const m: Measurements = {};
  OBJECTS.forEach(o => { m[o.id] = { m1: "", m2: "", m3: "", maatregel: "" }; });
  return m;
}

/** Generate last 52 weeks + next 4 weeks as "Week X – YYYY" */
function buildWeekOptions(): { label: string; value: string }[] {
  const options: { label: string; value: string }[] = [];
  const now = new Date();
  // Start 4 weeks in the future, go back 55 weeks
  for (let offset = 4; offset >= -51; offset--) {
    const d = new Date(now);
    d.setDate(d.getDate() + offset * 7);
    const week = isoWeekNumber(d);
    const year = d.getFullYear();
    // Correct year for week 1 in late December
    const label = `Week ${week} – ${year}`;
    if (!options.find(o => o.value === label)) {
      options.push({ label, value: label });
    }
  }
  return options;
}

export function Temperature({ tempReports, onSave, onToast, autoFillParaaf = "" }: Props) {
  const weekOptions = useMemo(buildWeekOptions, []);
  const defaultWeek = `Week ${isoWeekNumber(new Date())} – ${new Date().getFullYear()}`;

  const [week, setWeek] = useState(defaultWeek);
  const [paraaf, setParaaf] = useState(autoFillParaaf);
  const [measurements, setMeasurements] = useState<Measurements>(initM);

  const update = (id: string, field: "m1" | "m2" | "m3" | "maatregel", value: string) =>
    setMeasurements(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));

  const getRowStatus = (id: string): Status => {
    const obj = OBJECTS.find(o => o.id === id)!;
    const vals = [measurements[id].m1, measurements[id].m2, measurements[id].m3].filter(v => v !== "");
    return worstStatus(vals.map(v => statusForTemp(v, obj.type)));
  };

  const saveReport = () => {
    if (!week.trim()) { onToast("Selecteer een week."); return; }
    const rows: TempRow[] = [];
    let anyData = false;
    OBJECTS.forEach(obj => {
      const { m1, m2, m3, maatregel } = measurements[obj.id];
      const vals = [m1, m2, m3].filter(v => v !== "");
      if (!vals.length) { rows.push({ object: obj.label, type: obj.type, m1: "", m2: "", m3: "", avg: "", status: null, maatregel }); return; }
      anyData = true;
      const statuses = vals.map(v => statusForTemp(v, obj.type));
      const ws = worstStatus(statuses);
      const avg = vals.reduce((a, b) => a + parseFloat(b), 0) / vals.length;
      rows.push({ object: obj.label, type: obj.type, m1, m2, m3, avg: avg.toFixed(1), status: ws, maatregel });
    });
    if (!anyData) { onToast("Voer eerst metingen in."); return; }
    const allStatuses = rows.map(r => r.status).filter(Boolean) as Status[];
    onSave({ id: uid(), week, paraaf, date: todayDate(), time: nowTime(), rows, overallStatus: worstStatus(allStatuses), type: "temp" });
    onToast(`Rapport "${week}" opgeslagen`);
    setMeasurements(initM());
    setParaaf("");
  };

  const inputCls = "input-brand w-full";
  let lastType = "";

  return (
    <div className="space-y-4">
      {/* Norm info */}
      <div className="px-4 py-3 text-xs" style={{ background: "var(--beige-light)", borderLeft: "3px solid var(--sage)", color: "var(--text-muted)" }}>
        <strong style={{ color: "var(--text)" }}>Koeling:</strong> max 7,0°C | afkeur ≥ 7,1°C &nbsp;·&nbsp;
        <strong style={{ color: "var(--text)" }}>Diepvries:</strong> max −18,0°C | afkeur ≥ −17,9°C
      </div>

      <div className="card">
        {/* Meta row */}
        <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border)", background: "var(--beige-light)" }}>
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-xs mb-1.5 tracking-wide uppercase" style={{ color: "var(--text-muted)", fontSize: "11px" }}>Week</label>
              <select
                value={week}
                onChange={e => setWeek(e.target.value)}
                className="input-brand"
                style={{ minWidth: 180 }}
              >
                {weekOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs mb-1.5 tracking-wide uppercase" style={{ color: "var(--text-muted)", fontSize: "11px" }}>Paraaf</label>
              <input
                type="text"
                value={paraaf}
                onChange={e => setParaaf(e.target.value)}
                placeholder="initialen"
                className="input-brand"
                style={{ width: 100 }}
              />
            </div>
          </div>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full border-collapse" style={{ fontSize: 13 }}>
            <thead>
              <tr style={{ background: "var(--beige-light)" }}>
                {["Object", "1e meting", "2e meting", "3e meting", "Status", "Corrigerende maatregel"].map(h => (
                  <th key={h} className="text-left px-3 py-2.5 font-medium" style={{ fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.05em", textTransform: "uppercase", borderBottom: "1px solid var(--border)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {OBJECTS.map(obj => {
                const divider = obj.type !== lastType;
                if (divider) lastType = obj.type;
                return [
                  divider && (
                    <tr key={`div-${obj.type}`}>
                      <td colSpan={6} className="px-3 py-2 text-xs font-semibold tracking-wider uppercase"
                        style={{ background: "var(--beige-light)", color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}>
                        {obj.type === "koeling" ? "▸ Koeling — max 7,0°C" : "▸ Diepvries — max −18,0°C"}
                      </td>
                    </tr>
                  ),
                  <tr key={obj.id} style={{ borderBottom: "1px solid var(--beige-light)" }}>
                    <td className="px-3 py-2.5 text-sm font-medium" style={{ color: "var(--text)", width: 170 }}>{obj.label}</td>
                    {(["m1", "m2", "m3"] as const).map(m => (
                      <td key={m} className="px-3 py-2" style={{ width: 90 }}>
                        <input type="number" step="0.1" value={measurements[obj.id][m]}
                          onChange={e => update(obj.id, m, e.target.value)}
                          placeholder="°C" className="input-brand text-center" style={{ width: 72 }} />
                      </td>
                    ))}
                    <td className="px-3 py-2.5" style={{ width: 80 }}><Badge status={getRowStatus(obj.id)} /></td>
                    <td className="px-3 py-2">
                      <input type="text" value={measurements[obj.id].maatregel}
                        onChange={e => update(obj.id, "maatregel", e.target.value)}
                        placeholder="indien nodig" className={inputCls} />
                    </td>
                  </tr>,
                ];
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y" style={{ borderTop: "1px solid var(--border)" }}>
          {OBJECTS.map((obj, idx) => {
            const divider = idx === 0 || obj.type !== OBJECTS[idx - 1].type;
            return (
              <div key={obj.id}>
                {divider && (
                  <div className="px-4 py-2 text-xs font-semibold tracking-wider uppercase"
                    style={{ background: "var(--beige-light)", color: "var(--text-muted)" }}>
                    {obj.type === "koeling" ? "Koeling — max 7,0°C" : "Diepvries — max −18,0°C"}
                  </div>
                )}
                <div className="px-4 py-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium" style={{ color: "var(--text)" }}>{obj.label}</span>
                    <Badge status={getRowStatus(obj.id)} />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {(["m1", "m2", "m3"] as const).map((m, i) => (
                      <div key={m}>
                        <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>{i + 1}e meting</label>
                        <input type="number" step="0.1" value={measurements[obj.id][m]}
                          onChange={e => update(obj.id, m, e.target.value)}
                          placeholder="°C" className="input-brand text-center w-full" />
                      </div>
                    ))}
                  </div>
                  <input type="text" value={measurements[obj.id].maatregel}
                    onChange={e => update(obj.id, "maatregel", e.target.value)}
                    placeholder="Corrigerende maatregel (indien nodig)" className="input-brand w-full" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="px-5 py-4 flex flex-wrap gap-3" style={{ borderTop: "1px solid var(--border)" }}>
          <button onClick={saveReport} className="btn-primary">Opslaan als rapport</button>
          <button onClick={() => { if (!tempReports.length) { onToast("Geen rapporten."); return; } exportAllTempCSV(tempReports); onToast("CSV gedownload"); }} className="btn-secondary">CSV exporteren</button>
        </div>
      </div>
    </div>
  );
}
