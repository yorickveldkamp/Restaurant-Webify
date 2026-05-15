import { useState, FormEvent } from "react";
import logo from "@assets/logo.png";

interface Props {
  initialName?: string;
  title?: string;
  subtitle?: string;
  onSubmit: (name: string) => void;
  onCancel?: () => void;
}

export function NamePrompt({ initialName = "", title = "Welkom", subtitle = "Vul je naam in zodat we deze bij de rapporten kunnen zetten.", onSubmit, onCancel }: Props) {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 2) { setError("Vul een geldige naam in"); return; }
    onSubmit(trimmed);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--bg)", fontFamily: "'Jost', sans-serif" }}>
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <img src={logo} alt="Der Drahtesel" className="h-16 w-auto object-contain mb-3" />
          <div style={{ fontFamily: "'Amatic SC', cursive", fontWeight: 700, fontSize: "2.2rem", lineHeight: 1, color: "var(--text)" }}>
            Der Drahtesel
          </div>
          <div className="text-xs tracking-widest uppercase mt-1" style={{ color: "var(--text-muted)", letterSpacing: "0.14em" }}>
            HACCP Beheer
          </div>
        </div>

        <div className="card">
          <div className="px-6 py-4" style={{ borderBottom: "1px solid var(--border)", background: "var(--beige-light)" }}>
            <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>{title}</div>
            <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{subtitle}</div>
          </div>

          <form onSubmit={submit} className="px-6 py-5 space-y-4">
            <div>
              <label className="block text-xs mb-1.5 uppercase tracking-wide" style={{ color: "var(--text-muted)", fontSize: 11 }}>
                Jouw naam
              </label>
              <input
                type="text"
                value={name}
                onChange={e => { setName(e.target.value); setError(""); }}
                placeholder="bijv. Marie Janssen"
                autoFocus
                required
                className="input-brand w-full"
              />
            </div>

            {error && (
              <div className="text-xs px-3 py-2" style={{ background: "var(--danger-bg)", color: "var(--danger)", border: "1px solid #e0b4b4" }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary w-full justify-center py-2.5">
              Verder
            </button>

            {onCancel && (
              <button type="button" onClick={onCancel}
                className="w-full text-center text-xs" style={{ color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}>
                Annuleren
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
