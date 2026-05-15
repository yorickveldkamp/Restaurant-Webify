import { useState } from "react";
import { CLEANING_TASKS, CleanReport, CleanRow, uid, todayDate, nowTime } from "../lib/data";

interface CleaningProps {
  onSave: (report: CleanReport) => void;
  onToast: (msg: string) => void;
}

type Freq = "dagelijks" | "wekelijks" | "maandelijks";

type TaskState = {
  checked: boolean;
  tijdstip: string;
  note: string;
};

function initTasks(freq: Freq): TaskState[] {
  return CLEANING_TASKS[freq].map(() => ({ checked: false, tijdstip: "", note: "" }));
}

function FreqPanel({ freq, onSave, onToast }: { freq: Freq; onSave: (r: CleanReport) => void; onToast: (msg: string) => void }) {
  const [datum, setDatum] = useState(todayDate());
  const [door, setDoor] = useState("");
  const [tasks, setTasks] = useState<TaskState[]>(() => initTasks(freq));

  const updateTask = (i: number, field: keyof TaskState, value: string | boolean) => {
    setTasks((prev) => prev.map((t, idx) => idx === i ? { ...t, [field]: value } : t));
  };

  const save = () => {
    if (!datum.trim()) { onToast("Vul de datum in."); return; }
    const anyChecked = tasks.some((t) => t.checked || t.tijdstip || t.note);
    if (!anyChecked) { onToast("Vink minstens één taak aan of vul iets in."); return; }
    const rows: CleanRow[] = CLEANING_TASKS[freq].map((task, i) => ({
      task,
      checked: tasks[i].checked,
      tijdstip: tasks[i].tijdstip,
      handtekening: "",
      note: tasks[i].note,
    }));
    const allDone = rows.every((r) => r.checked);
    const overallStatus = allDone ? "ok" : "warn";
    const report: CleanReport = { id: uid(), freq, datum, door, time: nowTime(), rows, overallStatus, type: "cleaning" };
    onSave(report);
    onToast(`Rapport ${freq} (${datum}) opgeslagen`);
    setTasks(initTasks(freq));
    setDoor("");
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500">Datum:</label>
          <input
            type="text"
            value={datum}
            onChange={(e) => setDatum(e.target.value)}
            className="border border-gray-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 w-32"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500">Uitgevoerd door:</label>
          <input
            type="text"
            value={door}
            onChange={(e) => setDoor(e.target.value)}
            placeholder="Naam"
            className="border border-gray-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 w-40"
          />
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left px-2 py-2 text-xs font-medium text-gray-500 border-b border-gray-200 w-8">✓</th>
              <th className="text-left px-2 py-2 text-xs font-medium text-gray-500 border-b border-gray-200">Taak</th>
              <th className="text-left px-2 py-2 text-xs font-medium text-gray-500 border-b border-gray-200 w-28">Tijd</th>
              <th className="text-left px-2 py-2 text-xs font-medium text-gray-500 border-b border-gray-200">Opmerkingen</th>
            </tr>
          </thead>
          <tbody>
            {CLEANING_TASKS[freq].map((task, i) => (
              <tr key={i} className="border-b border-gray-100 last:border-0">
                <td className="px-2 py-2 text-center">
                  <input
                    type="checkbox"
                    checked={tasks[i].checked}
                    onChange={(e) => updateTask(i, "checked", e.target.checked)}
                    className="w-4 h-4 cursor-pointer accent-gray-900"
                  />
                </td>
                <td className="px-2 py-2 text-xs text-gray-900 leading-relaxed">{task}</td>
                <td className="px-2 py-2">
                  <input
                    type="time"
                    value={tasks[i].tijdstip}
                    onChange={(e) => updateTask(i, "tijdstip", e.target.value)}
                    className="border border-gray-200 rounded px-1.5 py-1 text-xs w-full focus:outline-none focus:ring-1 focus:ring-gray-400"
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    type="text"
                    value={tasks[i].note}
                    onChange={(e) => updateTask(i, "note", e.target.value)}
                    placeholder="opmerking"
                    className="border border-gray-200 rounded px-1.5 py-1 text-xs w-full focus:outline-none focus:ring-1 focus:ring-gray-400"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {CLEANING_TASKS[freq].map((task, i) => (
          <div key={i} className="border border-gray-200 rounded-lg p-3">
            <label className="flex items-start gap-3 cursor-pointer mb-2">
              <input
                type="checkbox"
                checked={tasks[i].checked}
                onChange={(e) => updateTask(i, "checked", e.target.checked)}
                className="w-5 h-5 mt-0.5 cursor-pointer accent-gray-900 shrink-0"
              />
              <span className={`text-sm leading-relaxed ${tasks[i].checked ? "line-through text-gray-400" : "text-gray-900"}`}>{task}</span>
            </label>
            <div className="mt-2">
              <label className="text-xs text-gray-400 block mb-0.5">Tijd</label>
              <input
                type="time"
                value={tasks[i].tijdstip}
                onChange={(e) => updateTask(i, "tijdstip", e.target.value)}
                className="border border-gray-200 rounded px-2 py-1.5 text-sm w-full focus:outline-none focus:ring-1 focus:ring-gray-400 mb-2"
              />
              <input
                type="text"
                value={tasks[i].note}
                onChange={(e) => updateTask(i, "note", e.target.value)}
                placeholder="Opmerking..."
                className="border border-gray-200 rounded px-2 py-1.5 text-sm w-full focus:outline-none focus:ring-1 focus:ring-gray-400"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <button
          onClick={save}
          className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-700 transition-colors flex items-center gap-1.5"
        >
          💾 Opslaan als rapport
        </button>
      </div>
    </div>
  );
}

export function Cleaning({ onSave, onToast }: CleaningProps) {
  const [freq, setFreq] = useState<Freq>("dagelijks");

  const freqOptions: { key: Freq; label: string; icon: string }[] = [
    { key: "dagelijks", label: "Dagelijks", icon: "☀️" },
    { key: "wekelijks", label: "Wekelijks", icon: "📅" },
    { key: "maandelijks", label: "Maandelijks", icon: "🗓️" },
  ];

  return (
    <div>
      <div className="flex gap-2 mb-4 flex-wrap">
        {freqOptions.map((f) => (
          <button
            key={f.key}
            onClick={() => setFreq(f.key)}
            className={`px-4 py-1.5 rounded-md border text-sm transition-all ${
              freq === f.key
                ? "bg-gray-900 text-white border-gray-900 font-medium"
                : "bg-transparent text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
          >
            {f.icon} {f.label}
          </button>
        ))}
      </div>
      <FreqPanel key={freq} freq={freq} onSave={onSave} onToast={onToast} />
    </div>
  );
}
