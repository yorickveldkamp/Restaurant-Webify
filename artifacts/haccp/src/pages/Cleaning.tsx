import { useState } from "react";
import { CLEANING_TASKS, CleanReport, CleanRow, uid, todayDate, nowTime } from "../lib/data";

interface Props { onSave: (r: CleanReport) => void; onToast: (msg: string) => void; }
type Freq = "dagelijks" | "wekelijks" | "maandelijks";
type TaskState = { checked: boolean; tijdstip: string; note: string };

function initTasks(freq: Freq): TaskState[] {
  return CLEANING_TASKS[freq].map(() => ({ checked: false, tijdstip: "", note: "" }));
}

function FreqPanel({ freq, onSave, onToast }: { freq: Freq; onSave: (r: CleanReport) => void; onToast: (msg: string) => void }) {
  const [datum, setDatum] = useState(todayDate());
  const [door, setDoor] = useState("");
  const [tasks, setTasks] = useState<TaskState[]>(() => initTasks(freq));

  const update = (i: number, field: keyof TaskState, value: string | boolean) =>
    setTasks(prev => prev.map((t, idx) => idx === i ? { ...t, [field]: value } : t));

  const save = () => {
    if (!datum.trim()) { onToast("Vul de datum in."); return; }
    if (!tasks.some(t => t.checked || t.tijdstip || t.note)) { onToast("Vink minstens één taak aan of vul iets in."); return; }
    const rows: CleanRow[] = CLEANING_TASKS[freq].map((task, i) => ({ task, checked: tasks[i].checked, tijdstip: tasks[i].tijdstip, handtekening: "", note: tasks[i].note }));
    const overallStatus = rows.every(r => r.checked) ? "ok" : "warn";
    onSave({ id: uid(), freq, datum, door, time: nowTime(), rows, overallStatus, type: "cleaning" });
    onToast(`Rapport ${freq} (${datum}) opgeslagen`);
    setTasks(initTasks(freq));
    setDoor("");
  };

  const doneCount = tasks.filter(t => t.checked).length;
  const total = tasks.length;

  return (
    <div className="card">
      {/* Meta */}
      <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border)", background: "var(--beige-light)" }}>
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs mb-1.5 tracking-wide uppercase" style={{ color: "var(--text-muted)", fontSize: "11px" }}>Datum</label>
            <input type="text" value={datum} onChange={e => setDatum(e.target.value)} className="input-brand" style={{ width: 130 }} />
          </div>
          <div>
            <label className="block text-xs mb-1.5 tracking-wide uppercase" style={{ color: "var(--text-muted)", fontSize: "11px" }}>Uitgevoerd door</label>
            <input type="text" value={door} onChange={e => setDoor(e.target.value)} placeholder="Naam" className="input-brand" style={{ width: 170 }} />
          </div>
          <div className="ml-auto self-center text-sm" style={{ color: "var(--text-muted)" }}>
            <span style={{ color: doneCount === total ? "var(--sage-dark)" : "var(--text)" }} className="font-semibold">{doneCount}</span>/{total} afgevinkt
          </div>
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse" style={{ fontSize: 13 }}>
          <thead>
            <tr style={{ background: "var(--beige-light)" }}>
              {["✓", "Taak", "Tijd", "Opmerkingen"].map((h, i) => (
                <th key={i} className="text-left px-3 py-2.5 font-medium" style={{ fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.05em", textTransform: "uppercase", borderBottom: "1px solid var(--border)", width: i === 0 ? 36 : i === 2 ? 110 : undefined }}>
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
                <td className="px-3 py-3 text-sm leading-relaxed" style={{ color: tasks[i].checked ? "var(--text-muted)" : "var(--text)", textDecoration: tasks[i].checked ? "line-through" : "none" }}>{task}</td>
                <td className="px-3 py-2">
                  <input type="time" value={tasks[i].tijdstip} onChange={e => update(i, "tijdstip", e.target.value)} className="input-brand" style={{ width: 100 }} />
                </td>
                <td className="px-3 py-2">
                  <input type="text" value={tasks[i].note} onChange={e => update(i, "note", e.target.value)} placeholder="opmerking" className="input-brand w-full" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden divide-y" style={{ borderTop: "1px solid var(--border)" }}>
        {CLEANING_TASKS[freq].map((task, i) => (
          <div key={i} className="px-4 py-4 space-y-2.5" style={{ background: tasks[i].checked ? "#f7fbf5" : "transparent" }}>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={tasks[i].checked} onChange={e => update(i, "checked", e.target.checked)}
                className="w-5 h-5 mt-0.5 shrink-0 cursor-pointer" style={{ accentColor: "var(--sage)" }} />
              <span className="text-sm leading-relaxed" style={{ color: tasks[i].checked ? "var(--text-muted)" : "var(--text)", textDecoration: tasks[i].checked ? "line-through" : "none" }}>{task}</span>
            </label>
            <div className="ml-8">
              <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>Tijd</label>
              <input type="time" value={tasks[i].tijdstip} onChange={e => update(i, "tijdstip", e.target.value)} className="input-brand w-full mb-2" />
              <input type="text" value={tasks[i].note} onChange={e => update(i, "note", e.target.value)} placeholder="Opmerking..." className="input-brand w-full" />
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="px-5 py-4" style={{ borderTop: "1px solid var(--border)" }}>
        <button onClick={save} className="btn-primary">Opslaan als rapport</button>
      </div>
    </div>
  );
}

export function Cleaning({ onSave, onToast }: Props) {
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
      <FreqPanel key={freq} freq={freq} onSave={onSave} onToast={onToast} />
    </div>
  );
}
