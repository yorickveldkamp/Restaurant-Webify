import { useState, useEffect, FormEvent } from "react";
import { AuthUser, apiGetUsers, apiCreateUser, apiDeleteUser } from "../lib/auth";

interface Props {
  onClear: (type: "temp" | "cleaning" | "all") => void;
  isAdmin: boolean;
}

function UserManagement() {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiGetUsers().then(u => { setUsers(u); setLoading(false); });
  }, []);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const u = await apiCreateUser(username, displayName, password);
      setUsers(prev => [...prev, u]);
      setUsername(""); setDisplayName(""); setPassword("");
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fout");
    } finally {
      setSaving(false);
    }
  };

  const del = async (id: string, name: string) => {
    if (!confirm(`Medewerker "${name}" verwijderen?`)) return;
    try {
      await apiDeleteUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Verwijderen mislukt");
    }
  };

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)", background: "var(--beige-light)" }}>
        <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>Medewerkers</span>
        <button onClick={() => setShowForm(!showForm)} className="btn-secondary text-xs py-1.5 px-3">
          {showForm ? "Annuleren" : "+ Medewerker toevoegen"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={create} className="px-5 py-4 space-y-3" style={{ borderBottom: "1px solid var(--border)", background: "#fdfcfb" }}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs mb-1 uppercase tracking-wide" style={{ color: "var(--text-muted)", fontSize: 11 }}>Naam</label>
              <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="bijv. Thomas" required className="input-brand w-full" />
            </div>
            <div>
              <label className="block text-xs mb-1 uppercase tracking-wide" style={{ color: "var(--text-muted)", fontSize: 11 }}>Gebruikersnaam</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="bijv. thomas" required className="input-brand w-full" />
            </div>
            <div>
              <label className="block text-xs mb-1 uppercase tracking-wide" style={{ color: "var(--text-muted)", fontSize: 11 }}>Wachtwoord</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="min. 4 tekens" required className="input-brand w-full" />
            </div>
          </div>
          {error && <div className="text-xs px-3 py-2" style={{ background: "var(--danger-bg)", color: "var(--danger)", border: "1px solid #e0b4b4" }}>{error}</div>}
          <button type="submit" disabled={saving} className="btn-primary" style={{ opacity: saving ? 0.7 : 1 }}>
            {saving ? "Opslaan…" : "Medewerker aanmaken"}
          </button>
        </form>
      )}

      {loading ? (
        <div className="px-5 py-4 text-sm" style={{ color: "var(--text-muted)" }}>Laden…</div>
      ) : users.length === 0 ? (
        <div className="px-5 py-4 text-sm italic" style={{ color: "var(--text-muted)" }}>Geen medewerkers gevonden</div>
      ) : (
        <div>
          {users.map((u, i) => (
            <div key={u.id} className="px-5 py-3 flex items-center gap-3"
              style={{ borderBottom: i < users.length - 1 ? "1px solid var(--beige-light)" : "none" }}>
              <div className="w-8 h-8 flex items-center justify-center text-sm font-semibold"
                style={{ background: "var(--beige-light)", color: "var(--text)" }}>
                {u.displayName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium" style={{ color: "var(--text)" }}>{u.displayName}</div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>@{u.username}{u.isAdmin ? " · beheerder" : ""}</div>
              </div>
              {!u.isAdmin && (
                <button onClick={() => del(u.id, u.displayName)} className="btn-danger text-xs py-1 px-2.5">Verwijderen</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function Settings({ onClear, isAdmin }: Props) {
  const confirm_ = (type: "temp" | "cleaning" | "all") => {
    const labels = { temp: "alle temperatuurrapporten", cleaning: "alle reinigingsrapporten", all: "ALLE rapporten" };
    if (window.confirm(`Weet je zeker dat je ${labels[type]} permanent wil verwijderen?`)) onClear(type);
  };

  const rows: { title: string; desc: string; type: "temp" | "cleaning" | "all"; danger?: boolean }[] = [
    { title: "Temperatuurrapporten", desc: "Alle opgeslagen temperatuurmetingen verwijderen", type: "temp" },
    { title: "Reinigingsrapporten", desc: "Alle opgeslagen reinigingschecks verwijderen", type: "cleaning" },
    { title: "Alles wissen", desc: "Alle rapporten in één keer verwijderen", type: "all", danger: true },
  ];

  return (
    <div className="space-y-4">
      <div className="card px-5 py-4">
        <div className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: "var(--text-muted)" }}>Over deze app</div>
        <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
          HACCP Beheer slaat alle gegevens op in een centrale database op de server.
          Je gegevens zijn beschikbaar op alle apparaten voor alle medewerkers.
        </p>
      </div>

      {isAdmin && <UserManagement />}

      <div className="card overflow-hidden">
        <div className="px-5 py-3" style={{ borderBottom: "1px solid var(--border)", background: "var(--beige-light)" }}>
          <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--danger)" }}>Gegevens wissen</span>
          {!isAdmin && <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Alleen beheerders kunnen gegevens wissen</div>}
        </div>
        {rows.map((row, i) => (
          <div key={row.type} className="px-5 py-4 flex items-center justify-between gap-4"
            style={{ borderBottom: i < rows.length - 1 ? "1px solid var(--beige-light)" : "none", opacity: !isAdmin ? 0.5 : 1 }}>
            <div>
              <div className="text-sm font-medium" style={{ color: row.danger ? "var(--danger)" : "var(--text)" }}>{row.title}</div>
              <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{row.desc}</div>
            </div>
            <button onClick={() => isAdmin && confirm_(row.type)} disabled={!isAdmin} className="btn-danger shrink-0"
              style={{ opacity: !isAdmin ? 0.5 : 1, cursor: !isAdmin ? "not-allowed" : "pointer" }}>
              Wissen
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
