import { useState, useMemo, useEffect, useRef } from "react";
import { CLEANING_TASKS, CleanReport, CleanRow, uid, todayDate, nowTime } from "../lib/data";
import { isoWeekNumber } from "../lib/schedule";
import { loadDraft, saveDraft, clearDraft, cleanDraftKey } from "../lib/storage";

interface Props { onSave: (r: CleanReport) => void; onToast: (msg: string) => void; autoFillDoor?: string; }
type Freq = "dagelijks" | "wekelijks" | "maandelijks";
type TaskState = { checked: boolean; tijdstip: string; note: string };
interface DraftShape { datum: string; door: string; tasks: TaskState[]; }

function pad(n: number) { return String(n).padStart(2, "0"); }
function toDutch(d: Date) { return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`; }

function isoWeekMonday(d: Date): Date {
  const result = new Date(d);
  const day = result.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

function buildDayOptions(): { label: string; value: string }[] {
  const now = new Date();
  const opts: { label: string; value: string }[] = [];
  for (let offset = 2; offset >= -14; offset--) {
    const d = new Date(now);
    d.setDate(d.getDate() + offset);
    d.setHours(0, 0, 0, 0);
    const label = d.toLocaleDateString("nl-BE", { weekday: "long", day: "numeric", month: "long" });
    opts.push({ label: label.charAt(0).toUpperCase() + label.slice(1), value: toDutch(d) });
  }
  return opts;
}

function buildWeekOptions(): { label: string; value: string }[] {
  const now = new Date();
  const opts: { label: string; value: string }[] = [];
  for (let offset = 4; offset >= -51; offset--) {
    const d = new Date(now);
    d.setDate(d.getDate() + offset * 7);
    const monday = isoWeekMonday(d);
    const week = isoWeekNumber(monday);
    const thursday = new Date(monday);
    thursday.setDate(thursday.getDate() + 3);
    const year = thursday.getFullYear();
    const label = `Week ${week} – ${year}`;
    const value = toDutch(monday);
    if (!opts.find(o => o.label === label)) opts.push({ label, value });
  }
  return opts;
}

function buildMonthOptions(): { label: string; value: string }[] {
  const now = new Date();
  const opts: { label: string; value: string }[] = [];
  for (let offset = 2; offset >= -23; offset--) {
    const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const label = d.toLocaleDateString("nl-BE", { month: "long", year: "numeric" });
    const value = toDutch(d);
    opts.push({ label: label.charAt(0).toUpperCase() + label.slice(1), value });
  }
  return opts;
}

function initTasks(freq: Freq): TaskState[] {
  return CLEANING_TASKS[freq].map(() => ({ checked: false, tijdstip: "", note: "" }));
}

function FreqPanel({ freq, onSave, onToast, autoFillDoor = "" }: { freq: Freq; onSave: (r: CleanReport) => void; onToast: (msg: string) => void; autoFillDoor?: string }) {
  const dayOptions   = useMemo(buildDayOptions,   []);
  const weekOptions  = useMemo(buildWeekOptions,  []);
  const monthOptions = useMemo(buildMonthOptions, []);

  const defaultDatum = (() => {
    if (freq === "dagelijks")   return dayOptions[2]?.value ?? todayDate();
    if (freq === "wekelijks")   return weekOptions[4]?.value ?? todayDate();
    return monthOptions[2]?.value ?? todayDate();
  })();

  const [datum, setDatum] = useState(defaultDatum);
  const [door, setDoor] = useState(autoFillDoor);
  const [tasks, setTasks] = useState<TaskState[]>(() => initTasks(freq));
  const [draftRestored, setDraftRestored] = useState(false);
  const hydrated = useRef(false);

  // Restore draft on mount (per freq)
  useEffect(() => {
    const draft = loadDraft<DraftShape>(cleanDraftKey(freq));
    if (draft && Array.isArray(draft.tasks) && draft.tasks.length === CLEANING_TASKS[freq].length) {
      setDatum(draft.datum || defaultDatum);
      setDoor(draft.door || autoFillDoor);
      setTasks(draft.tasks);
      setDraftRestored(true);
    }
    hydrated.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [freq]);

  const update = (i: number, field: keyof TaskState, value: string | boolean) =>
    setTasks(prev => prev.map((t, idx) => idx === i ? { ...t, [field]: value } : t));

  const periodLabel = (() => {
    if (freq === "dagelijks")  return dayOptions.find(o => o.value === datum)?.label ?? datum;
    if (freq === "wekelijks")  return weekOptions.find(o => o.value === datum)?.label ?? datum;
    return monthOptions.find(o => o.value === datum)?.label ?? datum;
  })();

  // Completeness: every task checked AND has a tijdstip; door + datum filled.
  const total = tasks.length;
  const fullyDoneCount = tasks.filter(t => t.checked && t.tijdstip).length;
  const allTasksDone = fullyDoneCount === total;
  const isComplete = allTasksDone && door.trim().length > 0 && datum.trim().length > 0;

  const resetForm = () => {
    setTasks(initTasks(freq));
    setDoor(autoFillDoor);
    setDatum(defaultDatum);
    clearDraft(cleanDraftKey(freq));
    setDraftRestored(false);
  };

  const saveDraftNow = () => {
    saveDraft<DraftShape>(cleanDraftKey(freq), { datum, door, tasks });
    onToast("Tussentijds opgeslagen — je kan later verder");
  };

  const discardDraft = () => {
    if (!confirm("Tussentijdse versie verwijderen?")) return;
    resetForm();
    onToast("Tussentijdse versie verwijderd");
  };

  const save = () => {
    if (!isComplete) {
      const missing: string[] = [];
      if (!allTasksDone) missing.push(`${total - fullyDoneCount} ta${total - fullyDoneCount === 1 ? "ak" : "ken"} (vink aan + tijd)`);
      if (!door.trim()) missing.push("naam");
      onToast(`Nog nodig: ${missing.join(", ")}`);
      return;
    }
    const rows: CleanRow[] = CLEANING_TASKS[freq].map((task, i) => ({
      task, checked: tasks[i].checked, tijdstip: tasks[i].tijdstip, handtekening: "", note: tasks[i].note,
    }));
    onSave({ id: uid(), freq, datum, door, time: nowTime(), rows, overallStatus: "ok", type: "cleaning" });
    onToast(`Rapport ${freq} — ${periodLabel} opgeslagen`);
    resetForm();
  };

  const pickerLabel = freq === "dagelijks" ? "Datum" : freq === "wekelijks" ? "Week" : "Maand";
  const options = freq === "dagelijks" ? dayOptions : freq === "wekelijks" ? weekOptions : monthOptions;

  return (
    <div className="space-y-3">
      {draftRestored && (
        <div className="px-4 py-2.5 text-xs flex items-center justify-between gap-3"
          style={{ background: "#fff8e6", borderLeft: "3px solid #d4a73a", color: "#6b5215" }}>
          <span>Tussentijdse versie hersteld — vink alle taken af om als rapport op te slaan.</span>
          <button onClick={discardDraft}
            className="text-xs underline shrink-0"
            style={{ color: "#6b5215", background: "none", border: "none", cursor: "pointer" }}>
            Verwijderen
          </button>
        </div>
      )}

      <div className="card">
        {/* Meta */}
        <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border)", background: "var(--beige-light)" }}>
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-xs mb-1.5 tracking-wide uppercase" style={{ color: "var(--text-muted)", fontSize: "11px" }}>{pickerLabel}</label>
              <select value={datum} onChange={e => setDatum(e.target.value)}
                className="input-brand" style={{ minWidth: freq === "dagelijks" ? 220 : 180 }}>
                {options.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-xs mb-1.5 tracking-wide uppercase" style={{ color: "var(--text-muted)", fontSize: "11px" }}>Uitgevoerd door</label>
              <input type="text" value={door} onChange={e => setDoor(e.target.value)}
                placeholder="Naam" className="input-brand" style={{ width: 160 }} />
            </div>
            <div className="ml-auto self-center text-sm">
              <span style={{ color: allTasksDone ? "var(--sage-dark)" : "var(--text)" }} className="font-semibold">{fullyDoneCount}</span>
              <span style={{ color: "var(--text-muted)" }}>/{total} volledig (vinkje + tijd)</span>
            </div>
          </div>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full border-collapse" style={{ fontSize: 13 }}>
            <thead>
              <tr style={{ background: "var(--beige-light)" }}>
                {["✓", "Taak", "Tijd", "Opmerkingen"].map((h, i) => (
                  <th key={i} className="text-left px-3 py-2.5 font-medium"
                    style={{ fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.05em", textTransform: "uppercase", borderBottom: "1px solid var(--border)", width: i === 0 ? 36 : i === 2 ? 110 : undefined }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CLEANING_TASKS[freq].map((task, i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--beige-light)", background: tasks[i].checked ? "#f7fbf5" : "transparent" }}>
                  <td className="px-3 py-3 text-center">
                    <input type="checkbox" checked={tasks[i].checked} onChange={e => update(i, "checked", e.target.checked)}
                      className="w-4 h-4 cursor-pointer" style={{ accentColor: "var(--sage)" }} />
                  </td>
                  <td className="px-3 py-3 text-sm leading-relaxed"
                    style={{ color: tasks[i].checked ? "var(--text-muted)" : "var(--text)", textDecoration: tasks[i].checked ? "line-through" : "none" }}>
                    {task}
                  </td>
                  <td className="px-3 py-2">
                    <input type="time" value={tasks[i].tijdstip} onChange={e => update(i, "tijdstip", e.target.value)}
                      className="input-brand" style={{ width: 100 }} />
                  </td>
                  <td className="px-3 py-2">
                    <input type="text" value={tasks[i].note} onChange={e => update(i, "note", e.target.value)}
                      placeholder="opmerking" className="input-brand w-full" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y" style={{ borderTop: "1px solid var(--border)" }}>
          {CLEANING_TASKS[freq].map((task, i) => (
            <div key={i} className="px-4 py-4 space-y-2.5"
              style={{ background: tasks[i].checked ? "#f7fbf5" : "transparent" }}>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={tasks[i].checked} onChange={e => update(i, "checked", e.target.checked)}
                  className="w-5 h-5 mt-0.5 shrink-0 cursor-pointer" style={{ accentColor: "var(--sage)" }} />
                <span className="text-sm leading-relaxed"
                  style={{ color: tasks[i].checked ? "var(--text-muted)" : "var(--text)", textDecoration: tasks[i].checked ? "line-through" : "none" }}>
                  {task}
                </span>
              </label>
              <div className="ml-8">
                <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>Tijd</label>
                <input type="time" value={tasks[i].tijdstip} onChange={e => update(i, "tijdstip", e.target.value)}
                  className="input-brand w-full mb-2" />
                <input type="text" value={tasks[i].note} onChange={e => update(i, "note", e.target.value)}
                  placeholder="Opmerking..." className="input-brand w-full" />
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="px-5 py-4 flex flex-wrap items-center gap-3" style={{ borderTop: "1px solid var(--border)" }}>
          <button onClick={save} disabled={!isComplete}
            className="btn-primary"
            style={{ opacity: isComplete ? 1 : 0.45, cursor: isComplete ? "pointer" : "not-allowed" }}
            title={isComplete ? "" : "Vink alle taken aan met tijd + vul je naam in"}>
            Opslaan als rapport
          </button>
          <button onClick={saveDraftNow} className="btn-secondary">Tussentijds opslaan</button>
          {!isComplete && (
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              {!allTasksDone && <>Nog {total - fullyDoneCount} ta{total - fullyDoneCount === 1 ? "ak" : "ken"} af te vinken (met tijd){!door.trim() ? " · " : ""}</>}
              {!door.trim() && "naam invullen"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function Cleaning({ onSave, onToast, autoFillDoor = "" }: Props) {
  const [freq, setFreq] = useState<Freq>("dagelijks");
  const freqs: { key: Freq; label: string }[] = [
    { key: "dagelijks", label: "Dagelijks" },
    { key: "wekelijks", label: "Wekelijks" },
    { key: "maandelijks", label: "Maandelijks" },
  ];
  return (
    <div className="space-y-4">
      <div className="flex gap-0" style={{ borderBottom: "1px solid var(--border)" }}>
        {freqs.map(f => (
          <button key={f.key} onClick={() => setFreq(f.key)}
            className="px-5 py-2.5 text-sm transition-all"
            style={{
              background: freq === f.key ? "var(--sage)" : "transparent",
              color: freq === f.key ? "white" : "var(--text-muted)",
              fontWeight: freq === f.key ? 500 : 400,
              border: "none",
              cursor: "pointer",
              letterSpacing: "0.02em",
            }}>
            {f.label}
          </button>
        ))}
      </div>
      <FreqPanel key={freq} freq={freq} onSave={onSave} onToast={onToast} autoFillDoor={autoFillDoor} />
    </div>
  );
}
