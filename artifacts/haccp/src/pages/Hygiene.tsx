import { useState, useCallback } from "react";
import { HYGIENE_CHECKS, EmployeeHygiene, HygieneReport, Employee, uid, todayDate, nowTime } from "../lib/data";
import { loadEmployees, saveEmployees, loadHygieneReports, saveHygieneReports } from "../lib/storage";

const DEFAULT_EMPLOYEES: Employee[] = [
  { name: "Sep",    role: "Medewerker" },
  { name: "Yorick", role: "Küchenchef" },
  { name: "Wieke",  role: "Medewerker" },
  { name: "Britt",  role: "Medewerker" },
];

function freshEmployee(emp: Employee): EmployeeHygiene {
  return {
    name: emp.name,
    role: emp.role,
    checks: Array(HYGIENE_CHECKS.length).fill(false),
    status: "pending",
    rejectedReason: "",
  };
}

function statusDot(status: EmployeeHygiene["status"]) {
  if (status === "approved") return <span style={{ display: "inline-block", width: 9, height: 9, borderRadius: "50%", background: "#5a8a6a", marginRight: 6, flexShrink: 0 }} />;
  if (status === "rejected") return <span style={{ display: "inline-block", width: 9, height: 9, borderRadius: "50%", background: "#a83232", marginRight: 6, flexShrink: 0 }} />;
  return <span style={{ display: "inline-block", width: 9, height: 9, borderRadius: "50%", background: "#ccc", marginRight: 6, flexShrink: 0 }} />;
}

interface EmployeeCardProps {
  entry: EmployeeHygiene;
  leidinggevende: string;
  onChange: (updated: EmployeeHygiene) => void;
}

function EmployeeCard({ entry, leidinggevende, onChange }: EmployeeCardProps) {
  const [rejectInput, setRejectInput] = useState(entry.rejectedReason || "");
  const [showRejectForm, setShowRejectForm] = useState(false);

  const allChecked = entry.checks.every(Boolean);

  const toggleCheck = (i: number) => {
    if (entry.status === "approved") return;
    const next = [...entry.checks];
    next[i] = !next[i];
    onChange({ ...entry, checks: next, status: "pending" });
  };

  const approve = () => {
    onChange({
      ...entry,
      status: "approved",
      approvedAt: nowTime(),
      approvedBy: leidinggevende,
      rejectedReason: "",
    });
    setShowRejectForm(false);
  };

  const reject = () => {
    if (!rejectInput.trim()) return;
    onChange({
      ...entry,
      status: "rejected",
      rejectedReason: rejectInput.trim(),
      approvedAt: undefined,
      approvedBy: undefined,
    });
    setShowRejectForm(false);
  };

  const reopen = () => {
    onChange({ ...entry, status: "pending", rejectedReason: "", approvedAt: undefined, approvedBy: undefined });
    setRejectInput("");
    setShowRejectForm(false);
  };

  const borderColor =
    entry.status === "approved" ? "#5a8a6a" :
    entry.status === "rejected" ? "#a83232" :
    "var(--border)";

  const bgColor =
    entry.status === "approved" ? "#f0f7f2" :
    entry.status === "rejected" ? "#fdf2f2" :
    "var(--card)";

  return (
    <div style={{ border: `2px solid ${borderColor}`, borderRadius: 10, background: bgColor, padding: "20px 22px", transition: "all 0.2s" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: "var(--text)" }}>{entry.name}</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{entry.role}</div>
        </div>
        <div>
          {entry.status === "approved" && (
            <span style={{ background: "#5a8a6a", color: "white", padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
              ✓ Goedgekeurd {entry.approvedAt ? `om ${entry.approvedAt}` : ""}
            </span>
          )}
          {entry.status === "rejected" && (
            <span style={{ background: "#a83232", color: "white", padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
              ✕ Afgekeurd
            </span>
          )}
          {entry.status === "pending" && (
            <span style={{ background: "var(--beige)", color: "var(--text-muted)", padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 500 }}>
              In behandeling
            </span>
          )}
        </div>
      </div>

      {/* Checklist */}
      <div className="space-y-2 mb-4">
        {HYGIENE_CHECKS.map((label, i) => (
          <label key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: entry.status === "approved" ? "default" : "pointer" }}>
            <input
              type="checkbox"
              checked={entry.checks[i]}
              onChange={() => toggleCheck(i)}
              disabled={entry.status === "approved"}
              style={{ marginTop: 2, accentColor: "var(--sage)", width: 16, height: 16, flexShrink: 0 }}
            />
            <span style={{ fontSize: 13.5, color: entry.checks[i] ? "var(--text)" : "var(--text-muted)", lineHeight: 1.4 }}>
              {label}
            </span>
          </label>
        ))}
      </div>

      {/* Rejection reason display */}
      {entry.status === "rejected" && entry.rejectedReason && (
        <div style={{ marginBottom: 12, padding: "10px 14px", background: "#fdecea", border: "1px solid #e8b4b4", borderRadius: 6, fontSize: 13, color: "#a83232" }}>
          <strong>Reden afkeuring:</strong> {entry.rejectedReason}
        </div>
      )}

      {/* Approved by */}
      {entry.status === "approved" && entry.approvedBy && (
        <div style={{ marginBottom: 12, fontSize: 12, color: "var(--text-muted)" }}>
          Goedgekeurd door: <strong>{entry.approvedBy}</strong>
        </div>
      )}

      {/* Action buttons */}
      {entry.status === "pending" && (
        <div className="space-y-3">
          <div className="flex gap-3">
            <button
              onClick={approve}
              disabled={!allChecked}
              className={allChecked ? "btn-primary" : "btn-secondary"}
              style={{
                flex: 1, fontSize: 13, padding: "9px 0",
                opacity: allChecked ? 1 : 0.5,
                cursor: allChecked ? "pointer" : "not-allowed",
                background: allChecked ? "#5a8a6a" : undefined,
                borderColor: allChecked ? "#5a8a6a" : undefined,
              }}
              title={!allChecked ? "Vink alle punten aan om goed te keuren" : undefined}
            >
              ✓ Goedkeuren
            </button>
            <button
              onClick={() => setShowRejectForm(v => !v)}
              className="btn-danger"
              style={{ flex: 1, fontSize: 13, padding: "9px 0" }}
            >
              ✕ Afkeuren
            </button>
          </div>
          {showRejectForm && (
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                className="input-brand"
                style={{ flex: 1 }}
                placeholder="Reden van afkeuring (verplicht)…"
                value={rejectInput}
                onChange={e => setRejectInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && reject()}
                autoFocus
              />
              <button
                onClick={reject}
                disabled={!rejectInput.trim()}
                className="btn-danger"
                style={{ flexShrink: 0, opacity: rejectInput.trim() ? 1 : 0.5 }}
              >
                Opslaan
              </button>
            </div>
          )}
        </div>
      )}

      {entry.status === "rejected" && (
        <div className="flex gap-3">
          <button onClick={approve} className="btn-primary"
            style={{ flex: 1, fontSize: 13, padding: "9px 0", background: "#5a8a6a", borderColor: "#5a8a6a" }}>
            ✓ Alsnog goedkeuren
          </button>
          <button onClick={reopen} className="btn-secondary"
            style={{ flex: 1, fontSize: 13, padding: "9px 0" }}>
            Opnieuw beoordelen
          </button>
        </div>
      )}

      {entry.status === "approved" && (
        <button onClick={reopen} className="btn-secondary"
          style={{ fontSize: 12, padding: "6px 14px" }}>
          Beoordeling herzien
        </button>
      )}
    </div>
  );
}

interface Props {
  leidinggevende: string;
  onSaveReport: (r: HygieneReport) => void;
  onToast: (msg: string) => void;
}

export function Hygiene({ leidinggevende, onSaveReport, onToast }: Props) {
  const [employees, setEmployees] = useState<Employee[]>(() => {
    const stored = loadEmployees();
    return stored.length ? stored : DEFAULT_EMPLOYEES;
  });
  const [entries, setEntries] = useState<EmployeeHygiene[]>(() => {
    const stored = loadEmployees();
    return (stored.length ? stored : DEFAULT_EMPLOYEES).map(freshEmployee);
  });
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [shift, setShift] = useState<string>("ochtend");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("");
  const [showManage, setShowManage] = useState(false);
  const [saved, setSaved] = useState(false);

  const updateEntry = useCallback((i: number, updated: EmployeeHygiene) => {
    setEntries(prev => { const n = [...prev]; n[i] = updated; return n; });
    setSaved(false);
  }, []);

  const addEmployee = () => {
    if (!newName.trim()) return;
    const emp: Employee = { name: newName.trim(), role: newRole.trim() || "Medewerker" };
    const newEmps = [...employees, emp];
    setEmployees(newEmps);
    saveEmployees(newEmps);
    setEntries(prev => [...prev, freshEmployee(emp)]);
    setNewName("");
    setNewRole("");
    setSaved(false);
  };

  const removeEmployee = (i: number) => {
    if (!confirm(`Medewerker "${employees[i].name}" verwijderen?`)) return;
    const newEmps = employees.filter((_, idx) => idx !== i);
    setEmployees(newEmps);
    saveEmployees(newEmps);
    setEntries(prev => prev.filter((_, idx) => idx !== i));
    if (selectedIdx >= newEmps.length) setSelectedIdx(Math.max(0, newEmps.length - 1));
    setSaved(false);
  };

  const resetSession = () => {
    if (!confirm("Nieuwe controlebeurt starten? De huidige invoer wordt gewist.")) return;
    setEntries(employees.map(freshEmployee));
    setSelectedIdx(0);
    setSaved(false);
  };

  const saveReport = () => {
    const report: HygieneReport = {
      id: uid(),
      date: todayDate(),
      shift,
      savedAt: nowTime(),
      savedBy: leidinggevende,
      employees: entries,
      type: "hygiene",
    };
    const existing = loadHygieneReports();
    saveHygieneReports([report, ...existing]);
    onSaveReport(report);
    onToast("Hygiënerapport opgeslagen");
    setSaved(true);
  };

  const approvedCount = entries.filter(e => e.status === "approved").length;
  const rejectedCount = entries.filter(e => e.status === "rejected").length;
  const pendingCount  = entries.filter(e => e.status === "pending").length;
  const currentEntry = entries[selectedIdx];

  return (
    <div className="space-y-5" style={{ maxWidth: 680, margin: "0 auto" }}>

      {/* Header */}
      <div className="card" style={{ padding: "22px 26px" }}>
        <div className="text-xs font-semibold tracking-widest uppercase mb-1" style={{ color: "var(--text-muted)" }}>CCP 6 — Persoonlijke Hygiëne</div>
        <h1 style={{ fontSize: 19, fontWeight: 700, color: "var(--text)", margin: "0 0 14px" }}>Hygiënecontrole bij aanvang dienst</h1>
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs mb-1.5 uppercase tracking-wide" style={{ color: "var(--text-muted)", fontSize: 11 }}>Datum</label>
            <div className="input-brand" style={{ minWidth: 140, background: "var(--beige-light)", color: "var(--text-muted)", cursor: "default" }}>{todayDate()}</div>
          </div>
        </div>

        {/* Summary badges */}
        <div className="flex gap-3 flex-wrap mt-4 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
          <span className="badge-ok">{approvedCount} goedgekeurd</span>
          {rejectedCount > 0 && <span className="badge-nok">{rejectedCount} afgekeurd</span>}
          {pendingCount > 0 && <span className="badge-warn">{pendingCount} wachtend</span>}
        </div>
      </div>

      {/* Employee selector */}
      {employees.length > 0 && (
        <div className="card" style={{ padding: "14px 18px" }}>
          <div className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "var(--text-muted)" }}>Medewerker selecteren</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {entries.map((entry, i) => (
              <button
                key={i}
                onClick={() => setSelectedIdx(i)}
                style={{
                  display: "flex", alignItems: "center",
                  padding: "7px 16px", borderRadius: 6,
                  border: selectedIdx === i
                    ? entry.status === "approved" ? "2px solid #5a8a6a"
                    : entry.status === "rejected" ? "2px solid #a83232"
                    : "2px solid var(--sage)"
                    : "1px solid var(--border)",
                  background: selectedIdx === i
                    ? entry.status === "approved" ? "#f0f7f2"
                    : entry.status === "rejected" ? "#fdf2f2"
                    : "var(--beige-light)"
                    : "white",
                  cursor: "pointer",
                  fontWeight: selectedIdx === i ? 700 : 400,
                  fontSize: 13,
                  color: "var(--text)",
                  transition: "all 0.15s",
                }}
              >
                {statusDot(entry.status)}
                {entry.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Single employee card */}
      {currentEntry ? (
        <EmployeeCard
          key={`${currentEntry.name}-${selectedIdx}`}
          entry={currentEntry}
          leidinggevende={leidinggevende}
          onChange={upd => updateEntry(selectedIdx, upd)}
        />
      ) : (
        <div className="card" style={{ padding: "40px", textAlign: "center" }}>
          <div style={{ fontSize: 13, color: "var(--text-muted)", fontStyle: "italic" }}>Geen medewerkers. Voeg medewerkers toe via "Medewerkers beheren".</div>
        </div>
      )}

      {/* Navigation between employees */}
      {employees.length > 1 && (
        <div className="flex justify-between">
          <button
            onClick={() => setSelectedIdx(i => Math.max(0, i - 1))}
            disabled={selectedIdx === 0}
            className="btn-secondary"
            style={{ opacity: selectedIdx === 0 ? 0.4 : 1 }}
          >
            ← Vorige
          </button>
          <span style={{ fontSize: 12, color: "var(--text-muted)", alignSelf: "center" }}>
            {selectedIdx + 1} van {employees.length}
          </span>
          <button
            onClick={() => setSelectedIdx(i => Math.min(employees.length - 1, i + 1))}
            disabled={selectedIdx === employees.length - 1}
            className="btn-secondary"
            style={{ opacity: selectedIdx === employees.length - 1 ? 0.4 : 1 }}
          >
            Volgende →
          </button>
        </div>
      )}

      {/* Actions */}
      <div className="card" style={{ padding: "18px 22px" }}>
        <div className="flex flex-wrap gap-3">
          <button onClick={saveReport} className="btn-primary" style={{ flex: 1, minWidth: 200 }}>
            {saved ? "✓ Rapport opgeslagen" : "Opslaan als rapport"}
          </button>
          <button onClick={resetSession} className="btn-secondary">
            Nieuwe controlebeurt
          </button>
        </div>
        {pendingCount > 0 && (
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 10, marginBottom: 0 }}>
            Let op: {pendingCount} medewerker{pendingCount !== 1 ? "s" : ""} nog niet beoordeeld.
          </p>
        )}
      </div>

      {/* Employee management */}
      <div className="card" style={{ padding: "0" }}>
        <button
          onClick={() => setShowManage(v => !v)}
          style={{ width: "100%", padding: "14px 22px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "none", border: "none", cursor: "pointer" }}
        >
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Medewerkers beheren</span>
          <span style={{ color: "var(--text-muted)", fontSize: 18 }}>{showManage ? "▲" : "▼"}</span>
        </button>
        {showManage && (
          <div style={{ padding: "0 22px 20px", borderTop: "1px solid var(--border)" }}>
            <div className="space-y-2 mt-4">
              {employees.map((emp, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: i < employees.length - 1 ? "1px solid var(--beige-light)" : "none" }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{emp.name}</span>
                    <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: 8 }}>{emp.role}</span>
                  </div>
                  <button onClick={() => removeEmployee(i)} className="btn-danger" style={{ fontSize: 11, padding: "4px 10px" }}>Verwijderen</button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <input
                type="text"
                className="input-brand"
                placeholder="Naam…"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addEmployee()}
                style={{ flex: 1 }}
              />
              <input
                type="text"
                className="input-brand"
                placeholder="Functie…"
                value={newRole}
                onChange={e => setNewRole(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addEmployee()}
                style={{ width: 130 }}
              />
              <button onClick={addEmployee} className="btn-primary" style={{ flexShrink: 0 }} disabled={!newName.trim()}>
                Toevoegen
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
