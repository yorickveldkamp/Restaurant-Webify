import { useState, useCallback, useEffect, useRef } from "react";
import logo from "@assets/logo.png";
import { TempReport, CleanReport, todayFull } from "./lib/data";
import { loadTempReports, loadCleanReports, clearTempReports, clearCleanReports } from "./lib/storage";
import {
  apiGetTempReports, apiAddTempReport, apiDeleteTempReport,
  apiGetCleanReports, apiAddCleanReport, apiDeleteCleanReport,
  apiClearTempReports, apiClearCleanReports,
} from "./lib/api";
import { NameProvider, useName } from "./contexts/NameContext";
import { NamePrompt } from "./components/NamePrompt";
import { Dashboard } from "./pages/Dashboard";
import { Temperature } from "./pages/Temperature";
import { Cleaning } from "./pages/Cleaning";
import { Reports } from "./pages/Reports";
import { Settings } from "./pages/Settings";
import { Toast } from "./components/Toast";

type Tab = "dashboard" | "temp" | "cleaning" | "reports" | "settings";

const NAV: { key: Tab; label: string }[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "temp", label: "Temperatuur" },
  { key: "cleaning", label: "Reiniging" },
  { key: "reports", label: "Rapporten" },
  { key: "settings", label: "Instellingen" },
];

function MainApp() {
  const { name, setName } = useName();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [tempReports, setTempReports] = useState<TempReport[]>([]);
  const [cleanReports, setCleanReports] = useState<CleanReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [toast, setToast] = useState("");
  const [editName, setEditName] = useState(false);
  const migrated = useRef(false);

  const showToast = useCallback((msg: string) => setToast(msg), []);
  const clearToast = useCallback(() => setToast(""), []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [serverTemp, serverClean] = await Promise.all([
          apiGetTempReports(),
          apiGetCleanReports(),
        ]);

        if (!migrated.current) {
          migrated.current = true;
          const localTemp = loadTempReports();
          const localClean = loadCleanReports();
          const serverTempIds = new Set(serverTemp.map(r => r.id));
          const serverCleanIds = new Set(serverClean.map(r => r.id));
          const newTemp = localTemp.filter(r => !serverTempIds.has(r.id));
          const newClean = localClean.filter(r => !serverCleanIds.has(r.id));
          if (newTemp.length || newClean.length) {
            await Promise.all([...newTemp.map(apiAddTempReport), ...newClean.map(apiAddCleanReport)]);
            clearTempReports();
            clearCleanReports();
            const [mt, mc] = await Promise.all([apiGetTempReports(), apiGetCleanReports()]);
            setTempReports(mt);
            setCleanReports(mc);
          } else {
            setTempReports(serverTemp);
            setCleanReports(serverClean);
          }
        } else {
          setTempReports(serverTemp);
          setCleanReports(serverClean);
        }
      } catch {
        showToast("Kon rapporten niet laden");
      } finally {
        setLoading(false);
      }
    })();
  }, [showToast]);

  const addTemp = async (r: TempReport) => {
    setSaveStatus("saving");
    try {
      await apiAddTempReport(r);
      setTempReports(prev => [r, ...prev]);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      setSaveStatus("error");
      showToast("Fout bij opslaan — probeer opnieuw");
    }
  };

  const addClean = async (r: CleanReport) => {
    setSaveStatus("saving");
    try {
      await apiAddCleanReport(r);
      setCleanReports(prev => [r, ...prev]);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      setSaveStatus("error");
      showToast("Fout bij opslaan — probeer opnieuw");
    }
  };

  const delTemp = async (id: string) => {
    try {
      await apiDeleteTempReport(id);
      setTempReports(prev => prev.filter(r => r.id !== id));
    } catch { showToast("Fout bij verwijderen"); }
  };

  const delClean = async (id: string) => {
    try {
      await apiDeleteCleanReport(id);
      setCleanReports(prev => prev.filter(r => r.id !== id));
    } catch { showToast("Fout bij verwijderen"); }
  };

  const clearData = async (type: "temp" | "cleaning" | "all") => {
    setSaveStatus("saving");
    try {
      if (type === "temp" || type === "all") { await apiClearTempReports(); setTempReports([]); }
      if (type === "cleaning" || type === "all") { await apiClearCleanReports(); setCleanReports([]); }
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
      showToast("Gegevens verwijderd");
    } catch {
      setSaveStatus("error");
      showToast("Fout bij verwijderen");
    }
  };

  const navigateTo = useCallback((t: string) => {
    setTab(t as Tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const statusText = saveStatus === "saving" ? "Opslaan…" : saveStatus === "saved" ? "Opgeslagen" : saveStatus === "error" ? "Fout" : "Verbonden";
  const statusColor = saveStatus === "error" ? "#c0392b" : saveStatus === "saving" ? "#B0A795" : "var(--sage-dark)";

  if (editName) {
    return (
      <NamePrompt
        initialName={name}
        title="Naam wijzigen"
        subtitle="Deze naam wordt gebruikt bij nieuwe rapporten."
        onSubmit={(n) => { setName(n); setEditName(false); }}
        onCancel={() => setEditName(false)}
      />
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)", fontFamily: "'Jost', sans-serif" }}>
      <header className="sticky top-0 z-40" style={{ background: "var(--card)", borderBottom: "2px solid var(--sage)" }}>
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Der Drahtesel" className="h-10 w-auto object-contain" />
              <div>
                <div style={{ fontFamily: "'Amatic SC', cursive", fontWeight: 700, fontSize: "1.5rem", lineHeight: 1, color: "var(--text)" }}>
                  Der Drahtesel
                </div>
                <div className="text-xs tracking-widest uppercase" style={{ color: "var(--text-muted)", letterSpacing: "0.12em" }}>
                  HACCP Beheer
                </div>
              </div>
            </div>
            <div className="text-right hidden sm:flex flex-col items-end gap-0.5">
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>{todayFull()}</div>
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: statusColor }}>
                  {saveStatus === "saving" ? "↑ " : saveStatus === "error" ? "✕ " : "☁ "}{statusText}
                </span>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>·</span>
                <button onClick={() => setEditName(true)}
                  className="text-xs font-medium underline-offset-2 hover:underline"
                  style={{ color: "var(--text)", background: "transparent", border: "none", padding: 0, cursor: "pointer" }}>
                  {name}
                </button>
              </div>
            </div>
          </div>
          <div className="flex gap-0 overflow-x-auto scrollbar-hide -mb-px">
            {NAV.map(item => (
              <button key={item.key} onClick={() => setTab(item.key)}
                className="px-4 py-2.5 text-sm whitespace-nowrap border-b-2 transition-all"
                style={{
                  borderBottomColor: tab === item.key ? "var(--sage)" : "transparent",
                  color: tab === item.key ? "var(--text)" : "var(--text-muted)",
                  fontWeight: tab === item.key ? 500 : 400,
                  letterSpacing: "0.02em",
                  background: "transparent",
                  cursor: "pointer",
                }}>
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-5">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: "var(--sage)", borderTopColor: "transparent" }} />
            <div className="text-sm" style={{ color: "var(--text-muted)" }}>Rapporten laden…</div>
          </div>
        ) : (
          <>
            {tab === "dashboard" && <Dashboard tempReports={tempReports} cleanReports={cleanReports} onNavigate={navigateTo} />}
            {tab === "temp" && <Temperature tempReports={tempReports} onSave={addTemp} onToast={showToast} autoFillParaaf={name} />}
            {tab === "cleaning" && <Cleaning onSave={addClean} onToast={showToast} autoFillDoor={name} />}
            {tab === "reports" && <Reports tempReports={tempReports} cleanReports={cleanReports} onDeleteTemp={delTemp} onDeleteClean={delClean} onToast={showToast} />}
            {tab === "settings" && <Settings onClear={clearData} currentName={name} onChangeName={() => setEditName(true)} />}
          </>
        )}
      </main>

      {toast && <Toast message={toast} onDone={clearToast} />}
    </div>
  );
}

function AppRoot() {
  const { name, setName, loaded } = useName();

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: "var(--sage)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (!name) return <NamePrompt onSubmit={setName} />;
  return <MainApp />;
}

export default function App() {
  return (
    <NameProvider>
      <AppRoot />
    </NameProvider>
  );
}
