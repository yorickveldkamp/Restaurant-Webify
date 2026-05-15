import { useState, useCallback } from "react";
import logo from "@assets/logo.png";
import { TempReport, CleanReport, todayFull } from "./lib/data";
import { loadTempReports, saveTempReports, loadCleanReports, saveCleanReports, clearTempReports, clearCleanReports } from "./lib/storage";
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

export default function App() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [tempReports, setTempReports] = useState<TempReport[]>(() => loadTempReports());
  const [cleanReports, setCleanReports] = useState<CleanReport[]>(() => loadCleanReports());
  const [toast, setToast] = useState("");

  const showToast = useCallback((msg: string) => setToast(msg), []);
  const clearToast = useCallback(() => setToast(""), []);

  const addTemp = (r: TempReport) => { const u = [r, ...tempReports]; setTempReports(u); saveTempReports(u); };
  const addClean = (r: CleanReport) => { const u = [r, ...cleanReports]; setCleanReports(u); saveCleanReports(u); };
  const delTemp = (id: string) => { const u = tempReports.filter(r => r.id !== id); setTempReports(u); saveTempReports(u); };
  const delClean = (id: string) => { const u = cleanReports.filter(r => r.id !== id); setCleanReports(u); saveCleanReports(u); };
  const clearData = (type: "temp" | "cleaning" | "all") => {
    if (type === "temp" || type === "all") { setTempReports([]); clearTempReports(); }
    if (type === "cleaning" || type === "all") { setCleanReports([]); clearCleanReports(); }
    showToast("Gegevens verwijderd");
  };
  const navigateTo = useCallback((t: string) => { setTab(t as Tab); window.scrollTo({ top: 0, behavior: "smooth" }); }, []);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)", fontFamily: "'Jost', sans-serif" }}>
      {/* Header */}
      <header className="sticky top-0 z-40" style={{ background: "var(--card)", borderBottom: "2px solid var(--sage)" }}>
        <div className="max-w-4xl mx-auto px-4">
          {/* Top bar */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Der Drahtesel" className="h-10 w-auto object-contain" style={{ filter: "none" }} />
              <div>
                <div className="font-display text-2xl leading-none" style={{ fontFamily: "'Amatic SC', cursive", fontWeight: 700, color: "var(--text)" }}>
                  Der Drahtesel
                </div>
                <div className="text-xs tracking-widest uppercase" style={{ color: "var(--text-muted)", letterSpacing: "0.12em" }}>
                  HACCP Beheer
                </div>
              </div>
            </div>
            <div className="text-right hidden sm:block">
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>{todayFull()}</div>
              <div className="text-xs mt-0.5" style={{ color: "var(--sage-dark)", fontSize: "11px" }}>☁ Opgeslagen</div>
            </div>
          </div>

          {/* Nav */}
          <div className="flex gap-0 overflow-x-auto scrollbar-hide -mb-px">
            {NAV.map(item => (
              <button
                key={item.key}
                onClick={() => setTab(item.key)}
                className="px-4 py-2.5 text-sm whitespace-nowrap border-b-2 transition-all"
                style={{
                  borderBottomColor: tab === item.key ? "var(--sage)" : "transparent",
                  color: tab === item.key ? "var(--text)" : "var(--text-muted)",
                  fontWeight: tab === item.key ? 500 : 400,
                  letterSpacing: "0.02em",
                  background: "transparent",
                  cursor: "pointer",
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-5">
        {tab === "dashboard" && <Dashboard tempReports={tempReports} cleanReports={cleanReports} onNavigate={navigateTo} />}
        {tab === "temp" && <Temperature tempReports={tempReports} onSave={addTemp} onToast={showToast} />}
        {tab === "cleaning" && <Cleaning onSave={addClean} onToast={showToast} />}
        {tab === "reports" && <Reports tempReports={tempReports} cleanReports={cleanReports} onDeleteTemp={delTemp} onDeleteClean={delClean} onToast={showToast} />}
        {tab === "settings" && <Settings onClear={clearData} />}
      </main>

      {toast && <Toast message={toast} onDone={clearToast} />}
    </div>
  );
}
