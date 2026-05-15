import { useState, useCallback } from "react";
import { TempReport, CleanReport, todayFull } from "./lib/data";
import {
  loadTempReports, saveTempReports,
  loadCleanReports, saveCleanReports,
  clearTempReports, clearCleanReports,
} from "./lib/storage";
import { Dashboard } from "./pages/Dashboard";
import { Temperature } from "./pages/Temperature";
import { Cleaning } from "./pages/Cleaning";
import { Reports } from "./pages/Reports";
import { Toast } from "./components/Toast";

type Tab = "dashboard" | "temp" | "cleaning" | "reports";

const NAV_ITEMS: { key: Tab; label: string; icon: string }[] = [
  { key: "dashboard", label: "Dashboard", icon: "📊" },
  { key: "temp", label: "Temperatuur", icon: "🌡️" },
  { key: "cleaning", label: "Reiniging", icon: "🧹" },
  { key: "reports", label: "Rapporten", icon: "📁" },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [tempReports, setTempReports] = useState<TempReport[]>(() => loadTempReports());
  const [cleanReports, setCleanReports] = useState<CleanReport[]>(() => loadCleanReports());
  const [toast, setToast] = useState("");

  const showToast = useCallback((msg: string) => setToast(msg), []);
  const clearToast = useCallback(() => setToast(""), []);

  const addTempReport = (report: TempReport) => {
    const updated = [report, ...tempReports];
    setTempReports(updated);
    saveTempReports(updated);
  };

  const addCleanReport = (report: CleanReport) => {
    const updated = [report, ...cleanReports];
    setCleanReports(updated);
    saveCleanReports(updated);
  };

  const deleteTempReport = (id: string) => {
    const updated = tempReports.filter((r) => r.id !== id);
    setTempReports(updated);
    saveTempReports(updated);
  };

  const deleteCleanReport = (id: string) => {
    const updated = cleanReports.filter((r) => r.id !== id);
    setCleanReports(updated);
    saveCleanReports(updated);
  };

  const clearData = (type: "temp" | "cleaning" | "all") => {
    if (type === "temp" || type === "all") { setTempReports([]); clearTempReports(); }
    if (type === "cleaning" || type === "all") { setCleanReports([]); clearCleanReports(); }
    showToast("Gegevens verwijderd");
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <div className="text-base font-semibold text-gray-900 flex items-center gap-2">
              🛡️ HACCP Beheer
            </div>
            <div className="text-xs text-gray-400 mt-0.5">{todayFull()}</div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            ☁️ Opgeslagen
          </div>
        </div>

        {/* Nav */}
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto pb-0 scrollbar-hide">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-sm whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === item.key
                    ? "border-gray-900 text-gray-900 font-medium"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <span>{item.icon}</span>
                <span className="hidden sm:inline">{item.label}</span>
                <span className="sm:hidden text-xs">{item.label.split(" ")[0]}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-4">
        {activeTab === "dashboard" && (
          <Dashboard tempReports={tempReports} cleanReports={cleanReports} onClear={clearData} />
        )}
        {activeTab === "temp" && (
          <Temperature tempReports={tempReports} onSave={addTempReport} onToast={showToast} />
        )}
        {activeTab === "cleaning" && (
          <Cleaning onSave={addCleanReport} onToast={showToast} />
        )}
        {activeTab === "reports" && (
          <Reports
            tempReports={tempReports}
            cleanReports={cleanReports}
            onDeleteTemp={deleteTempReport}
            onDeleteClean={deleteCleanReport}
            onToast={showToast}
          />
        )}
      </main>

      {toast && <Toast message={toast} onDone={clearToast} />}
    </div>
  );
}
