import { useState, FormEvent } from "react";
import logo from "@assets/logo.png";
import { useAuth } from "../contexts/AuthContext";
import { apiSetup } from "../lib/auth";

export function Login() {
  const { login, setUser } = useAuth();

  const [mode, setMode] = useState<"login" | "setup">("login");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Inloggen mislukt");
    } finally {
      setLoading(false);
    }
  };

  const handleSetup = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 4) { setError("Wachtwoord minimaal 4 tekens"); return; }
    setLoading(true);
    try {
      const u = await apiSetup(username, displayName, password);
      setUser(u);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Setup mislukt");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--bg)", fontFamily: "'Jost', sans-serif" }}>
      <div className="w-full max-w-sm">

        {/* Logo + brand */}
        <div className="flex flex-col items-center mb-8">
          <img src={logo} alt="Der Drahtesel" className="h-16 w-auto object-contain mb-3" />
          <div style={{ fontFamily: "'Amatic SC', cursive", fontWeight: 700, fontSize: "2.2rem", lineHeight: 1, color: "var(--text)" }}>
            Der Drahtesel
          </div>
          <div className="text-xs tracking-widest uppercase mt-1" style={{ color: "var(--text-muted)", letterSpacing: "0.14em" }}>
            HACCP Beheer
          </div>
        </div>

        {/* Card */}
        <div className="card">
          <div className="px-6 py-4" style={{ borderBottom: "1px solid var(--border)", background: "var(--beige-light)" }}>
            <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>
              {mode === "login" ? "Inloggen" : "Eerste setup — beheerder aanmaken"}
            </div>
            {mode === "login" && (
              <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                Geen account?{" "}
                <button type="button" onClick={() => { setMode("setup"); setError(""); }}
                  className="underline cursor-pointer" style={{ color: "var(--sage-dark)", background: "none", border: "none", padding: 0 }}>
                  Eerste setup
                </button>
              </div>
            )}
          </div>

          <form onSubmit={mode === "login" ? handleLogin : handleSetup} className="px-6 py-5 space-y-4">
            {mode === "setup" && (
              <div>
                <label className="block text-xs mb-1.5 uppercase tracking-wide" style={{ color: "var(--text-muted)", fontSize: 11 }}>
                  Volledige naam
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="bijv. Marie Janssen"
                  required
                  className="input-brand w-full"
                />
              </div>
            )}

            <div>
              <label className="block text-xs mb-1.5 uppercase tracking-wide" style={{ color: "var(--text-muted)", fontSize: 11 }}>
                Gebruikersnaam
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="bijv. marie"
                required
                autoComplete="username"
                className="input-brand w-full"
              />
            </div>

            <div>
              <label className="block text-xs mb-1.5 uppercase tracking-wide" style={{ color: "var(--text-muted)", fontSize: 11 }}>
                Wachtwoord
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="input-brand w-full"
              />
            </div>

            {error && (
              <div className="text-xs px-3 py-2" style={{ background: "var(--danger-bg)", color: "var(--danger)", border: "1px solid #e0b4b4" }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5"
              style={{ opacity: loading ? 0.7 : 1 }}>
              {loading ? "Even geduld…" : mode === "login" ? "Inloggen" : "Account aanmaken & inloggen"}
            </button>

            {mode === "setup" && (
              <button type="button" onClick={() => { setMode("login"); setError(""); }}
                className="w-full text-center text-xs" style={{ color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}>
                ← Terug naar inloggen
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
