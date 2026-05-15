import { useState, useMemo, useEffect, useRef } from "react";
import { OBJECTS, TempRow, TempReport, statusForTemp, worstStatus, uid, todayDate, nowTime, Status } from "../lib/data";
import { isoWeekNumber } from "../lib/schedule";
import { Badge } from "../components/Badge";
import { exportAllTempCSV } from "../lib/pdf";
import { apiGetDraft, apiPutDraft, apiDeleteDraft } from "../lib/api";

const TEMP_DRAFT_KEY = "temp";

interface Props {
  tempReports: TempReport[];
  onSave: (r: TempReport) => void;
  onToast: (msg: string) => void;
  autoFillParaaf?: string;
}

type Measurements = Record<string, { m1: string; m2: string; m3: string; maatregel: string }>;
interface DraftShape { week: string; paraaf: string; measurements: Measurements; }

function initM(): Measurements {
  const m: Measurements = {};
  OBJECTS.forEach(o => { m[o.id] = { m1: "", m2: "", m3: "", maatregel: "" }; });
  return m;
}

function buildWeekOptions(): { label: string; value: string }[] {
  const options: { label: string; value: string }[] = [];
  const now = new Date();
  for (let offset = 4; offset >= -51; offset--) {
    const d = new Date(now);
    d.setDate(d.getDate() + offset * 7);
    const week = isoWeekNumber(d);
    const year = d.getFullYear();
    const label = `Week ${week} – ${year}`;
    if (!options.find(o => o.value === label)) options.push({ label, value: label });
  }
  return options;
}

export function Temperature({ tempReports, onSave, onToast, autoFillParaaf = "" }: Props) {
  const weekOptions = useMemo(buildWeekOptions, []);
  const defaultWeek = `Week ${isoWeekNumber(new Date())} – ${new Date().getFullYear()}`;

  const [week, setWeek] = useState(defaultWeek);
  const [paraaf, setParaaf] = useState(autoFillParaaf);
  const [measurements, setMeasurements] = useState<Measurements>(initM);
  const [draftRestored, setDraftRestored] = useState(false);
  const [draftMeta, setDraftMeta] = useState<{ updatedBy: string; updatedAt: string } | null>(null);
  const [draftBusy, setDraftBusy] = useState(false);
  const [remoteUpdate, setRemoteUpdate] = useState<{ data: DraftShape; meta: { updatedBy: string; updatedAt: string } } | null>(null);
  const hydrated = useRef(false);
  const dirty = useRef(false);
  const lastAppliedAt = useRef<string>("");
  const fetchSeq = useRef(0);
  const markDirty = () => { dirty.current = true; };

  const applyDraft = (draft: DraftShape | null) => {
    if (draft && draft.measurements && typeof draft.measurements === "object") {
      const sanitized = initM();
      OBJECTS.forEach(o => {
        const src = (draft.measurements as Measurements)[o.id];
        if (src && typeof src === "object") {
          sanitized[o.id] = {
            m1: typeof src.m1 === "string" ? src.m1 : "",
            m2: typeof src.m2 === "string" ? src.m2 : "",
            m3: typeof src.m3 === "string" ? src.m3 : "",
            maatregel: typeof src.maatregel === "string" ? src.maatregel : "",
          };
        }
      });
      setWeek(typeof draft.week === "string" && draft.week ? draft.week : defaultWeek);
      setParaaf(typeof draft.paraaf === "string" ? draft.paraaf : autoFillParaaf);
      setMeasurements(sanitized);
      setDraftRestored(true);
    }
  };

  const fetchDraft = async (opts: { initial?: boolean } = {}) => {
    const seq = ++fetchSeq.current;
    try {
      const d = await apiGetDraft<DraftShape>(TEMP_DRAFT_KEY);
      if (seq !== fetchSeq.current) return; // stale response
      if (!d) {
        if (opts.initial) { setDraftMeta(null); setDraftRestored(false); lastAppliedAt.current = ""; }
        return;
      }
      // Only auto-apply if (a) we haven't applied anything yet, or (b) form is clean and the remote is newer
      const remoteMs = Date.parse(d.updatedAt);
      const lastMs = lastAppliedAt.current ? Date.parse(lastAppliedAt.current) : 0;
      const isNewer = !Number.isNaN(remoteMs) && (Number.isNaN(lastMs) || remoteMs > lastMs);
      if (!dirty.current && (opts.initial || isNewer)) {
        applyDraft(d.data);
        setDraftMeta({ updatedBy: d.updatedBy, updatedAt: d.updatedAt });
        lastAppliedAt.current = d.updatedAt;
        setRemoteUpdate(null);
      } else if (dirty.current && isNewer) {
        // Don't clobber local edits; surface a banner so user can choose.
        setRemoteUpdate({ data: d.data, meta: { updatedBy: d.updatedBy, updatedAt: d.updatedAt } });
      }
    } catch {
      onToast("Kon tussentijdse versie niet laden van server");
    }
  };

  const acceptRemote = () => {
    if (!remoteUpdate) return;
    applyDraft(remoteUpdate.data);
    setDraftMeta(remoteUpdate.meta);
    lastAppliedAt.current = remoteUpdate.meta.updatedAt;
    dirty.current = false;
    setRemoteUpdate(null);
  };
  const dismissRemote = () => setRemoteUpdate(null);

  // Restore draft on mount + when window regains focus (so colleagues' updates appear)
  useEffect(() => {
    void fetchDraft({ initial: true });
    const onFocus = () => { void fetchDraft(); };
    window.addEventListener("focus", onFocus);
    hydrated.current = true;
    return () => window.removeEventListener("focus", onFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = (id: string, field: "m1" | "m2" | "m3" | "maatregel", value: string) => {
    markDirty();
    setMeasurements(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const getRowStatus = (id: string): Status => {
    const obj = OBJECTS.find(o => o.id === id)!;
    const vals = [measurements[id].m1, measurements[id].m2, measurements[id].m3].filter(v => v !== "");
    return worstStatus(vals.map(v => statusForTemp(v, obj.type)));
  };

  // Completeness: every object must have all 3 measurements + paraaf must be set
  const totalRequired = OBJECTS.length * 3;
  const filledCount = OBJECTS.reduce((acc, obj) => {
    const m = measurements[obj.id];
    return acc + (m.m1 !== "" ? 1 : 0) + (m.m2 !== "" ? 1 : 0) + (m.m3 !== "" ? 1 : 0);
  }, 0);
  const allMeasurementsFilled = filledCount === totalRequired;
  const isComplete = allMeasurementsFilled && paraaf.trim().length > 0 && week.trim().length > 0;

  const resetForm = () => {
    setMeasurements(initM());
    setParaaf(autoFillParaaf);
    setWeek(defaultWeek);
    setDraftRestored(false);
    setDraftMeta(null);
    setRemoteUpdate(null);
    dirty.current = false;
    lastAppliedAt.current = "";
    void apiDeleteDraft(TEMP_DRAFT_KEY).catch(() => {});
  };

  const saveDraftNow = async () => {
    setDraftBusy(true);
    try {
      const saved = await apiPutDraft<DraftShape>(TEMP_DRAFT_KEY, { week, paraaf, measurements }, autoFillParaaf || paraaf || "");
      setDraftMeta({ updatedBy: saved.updatedBy, updatedAt: saved.updatedAt });
      lastAppliedAt.current = saved.updatedAt;
      dirty.current = false;
      setRemoteUpdate(null);
      setDraftRestored(true);
      onToast("Tussentijds opgeslagen op de server — iedereen ziet de voortgang");
    } catch {
      onToast("Tussentijds opslaan mislukt — probeer opnieuw");
    } finally { setDraftBusy(false); }
  };

  const discardDraft = async () => {
    if (!confirm("Tussentijdse versie verwijderen voor iedereen?")) return;
    setDraftBusy(true);
    try {
      await apiDeleteDraft(TEMP_DRAFT_KEY);
      setMeasurements(initM());
      setParaaf(autoFillParaaf);
      setWeek(defaultWeek);
      setDraftRestored(false);
      setDraftMeta(null);
      onToast("Tussentijdse versie verwijderd");
    } catch { onToast("Verwijderen mislukt"); }
    finally { setDraftBusy(false); }
  };

  const saveReport = () => {
    if (!isComplete) {
      onToast(`Vul eerst alle metingen in (${filledCount}/${totalRequired}) en je paraaf.`);
      return;
    }
    const rows: TempRow[] = OBJECTS.map(obj => {
      const { m1, m2, m3, maatregel } = measurements[obj.id];
      const statuses = [m1, m2, m3].map(v => statusForTemp(v, obj.type));
      const ws = worstStatus(statuses);
      const avg = ([m1, m2, m3].reduce((a, b) => a + parseFloat(b), 0) / 3).toFixed(1);
      return { object: obj.label, type: obj.type, m1, m2, m3, avg, status: ws, maatregel };
    });
    const allStatuses = rows.map(r => r.status).filter(Boolean) as Status[];
    onSave({ id: uid(), week, paraaf, date: todayDate(), time: nowTime(), rows, overallStatus: worstStatus(allStatuses), type: "temp" });
    onToast(`Rapport "${week}" opgeslagen`);
    resetForm();
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

      {remoteUpdate && (
        <div className="px-4 py-2.5 text-xs flex items-center justify-between gap-3"
          style={{ background: "#eaf3fb", borderLeft: "3px solid #3a7bd4", color: "#1c4a82" }}>
          <span>
            Een collega heeft de tussentijdse versie net bijgewerkt
            {remoteUpdate.meta.updatedBy ? ` (${remoteUpdate.meta.updatedBy})` : ""}.
            Je hebt zelf wijzigingen openstaan.
          </span>
          <span className="flex gap-3 shrink-0">
            <button onClick={acceptRemote} className="text-xs underline"
              style={{ color: "#1c4a82", background: "none", border: "none", cursor: "pointer" }}>
              Versie laden (mijn wijzigingen vervallen)
            </button>
            <button onClick={dismissRemote} className="text-xs underline"
              style={{ color: "#1c4a82", background: "none", border: "none", cursor: "pointer" }}>
              Negeren
            </button>
          </span>
        </div>
      )}

      {draftRestored && (
        <div className="px-4 py-2.5 text-xs flex items-center justify-between gap-3"
          style={{ background: "#fff8e6", borderLeft: "3px solid #d4a73a", color: "#6b5215" }}>
          <span>
            Tussentijdse versie geladen — vul aan en sla op als rapport zodra alles ingevuld is.
            {draftMeta && (draftMeta.updatedBy || draftMeta.updatedAt) && (
              <> {" "}<em style={{ fontStyle: "normal", opacity: 0.8 }}>
                (laatst bijgewerkt{draftMeta.updatedBy ? ` door ${draftMeta.updatedBy}` : ""}
                {draftMeta.updatedAt ? ` om ${new Date(draftMeta.updatedAt).toLocaleString("nl-BE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}` : ""})
              </em></>
            )}
          </span>
          <button onClick={discardDraft} disabled={draftBusy}
            className="text-xs underline shrink-0"
            style={{ color: "#6b5215", background: "none", border: "none", cursor: draftBusy ? "wait" : "pointer", opacity: draftBusy ? 0.5 : 1 }}>
            Verwijderen
          </button>
        </div>
      )}

      <div className="card">
        {/* Meta row */}
        <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border)", background: "var(--beige-light)" }}>
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-xs mb-1.5 tracking-wide uppercase" style={{ color: "var(--text-muted)", fontSize: "11px" }}>Week</label>
              <select value={week} onChange={e => { markDirty(); setWeek(e.target.value); }} className="input-brand" style={{ minWidth: 180 }}>
                {weekOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs mb-1.5 tracking-wide uppercase" style={{ color: "var(--text-muted)", fontSize: "11px" }}>Paraaf</label>
              <input type="text" value={paraaf} onChange={e => { markDirty(); setParaaf(e.target.value); }}
                placeholder="initialen" className="input-brand" style={{ width: 100 }} />
            </div>
            <div className="ml-auto self-center text-sm">
              <span className="font-semibold" style={{ color: allMeasurementsFilled ? "var(--sage-dark)" : "var(--text)" }}>{filledCount}</span>
              <span style={{ color: "var(--text-muted)" }}>/{totalRequired} metingen ingevuld</span>
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
        <div className="px-5 py-4 flex flex-wrap items-center gap-3" style={{ borderTop: "1px solid var(--border)" }}>
          <button onClick={saveReport} disabled={!isComplete}
            className="btn-primary"
            style={{ opacity: isComplete ? 1 : 0.45, cursor: isComplete ? "pointer" : "not-allowed" }}
            title={isComplete ? "" : "Vul eerst alle metingen + paraaf in"}>
            Opslaan als rapport
          </button>
          <button onClick={saveDraftNow} disabled={draftBusy} className="btn-secondary"
            style={{ opacity: draftBusy ? 0.5 : 1 }}>
            {draftBusy ? "Bezig…" : "Tussentijds opslaan"}
          </button>
          <button onClick={() => { if (!tempReports.length) { onToast("Geen rapporten."); return; } exportAllTempCSV(tempReports); onToast("CSV gedownload"); }} className="btn-secondary">CSV exporteren</button>
          {!isComplete && (
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              Nog {totalRequired - filledCount} meting{totalRequired - filledCount === 1 ? "" : "en"} en{paraaf.trim() ? "" : " een paraaf"} nodig om als rapport op te slaan
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
