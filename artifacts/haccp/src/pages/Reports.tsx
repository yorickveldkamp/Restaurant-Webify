import { useState } from "react";
import { TempReport, CleanReport, statusLabel } from "../lib/data";
import { downloadTempReport, downloadCleanReport, exportAllTempCSV, exportAllCleanCSV, downloadMonthlyOverview } from "../lib/pdf";

interface ReportsProps {
  tempReports: TempReport[];
  cleanReports: CleanReport[];
  onDeleteTemp: (id: string) => void;
  onDeleteClean: (id: string) => void;
  onToast: (msg: string) => void;
}

type Tab = "temp" | "clean" | "maand";

function MonthlyOverview({ tempReports, cleanReports, onToast }: {
  tempReports: TempReport[];
  cleanReports: CleanReport[];
  onToast: (msg: string) => void;
}) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  /** Parse "dd/mm/yyyy" → { month, year } */
  function parseDutchDate(s: string) {
    const parts = s.split("/");
    if (parts.length !== 3) return null;
    return { month: parseInt(parts[1], 10), year: parseInt(parts[2], 10) };
  }

  const filteredTemp = tempReports.filter((r) => {
    const d = parseDutchDate(r.date);
    return d && d.month === month && d.year === year;
  });
  const filteredClean = cleanReports.filter((r) => {
    const d = parseDutchDate(r.datum);
    return d && d.month === month && d.year === year;
  });

  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString("nl-BE", { month: "long", year: "numeric" });
  const total = filteredTemp.length + filteredClean.length;

  const handleExport = () => {
    if (total === 0) { onToast("Geen rapporten voor deze maand."); return; }
    downloadMonthlyOverview(month, year, tempReports, cleanReports);
    onToast("Maandoverzicht PDF gedownload");
  };

  const months = [
    "Januari", "Februari", "Maart", "April", "Mei", "Juni",
    "Juli", "Augustus", "September", "Oktober", "November", "December",
  ];

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

  const nokTemp = filteredTemp.filter((r) => r.overallStatus === "nok").length;
  const warnTemp = filteredTemp.filter((r) => r.overallStatus === "warn").length;
  const doneClean = filteredClean.filter((r) => r.overallStatus === "ok").length;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <h2 className="text-sm font-medium text-gray-900 mb-4">📋 Maandoverzicht PDF</h2>

      {/* Month/year selectors */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Maand</label>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="border border-gray-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 bg-white"
          >
            {months.map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Jaar</label>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="border border-gray-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 bg-white"
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Preview card */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 mb-4">
        <div className="text-sm font-medium text-gray-700 mb-3 capitalize">
          {monthLabel}
        </div>
        {total === 0 ? (
          <p className="text-sm text-gray-400 italic">Geen rapporten gevonden voor deze maand.</p>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">🌡️ Temperatuurrapporten</span>
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">{filteredTemp.length}</span>
                {nokTemp > 0 && <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-[#FCEBEB] text-[#791F1F]">{nokTemp} NOK</span>}
                {warnTemp > 0 && <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-[#FAEEDA] text-[#633806]">{warnTemp} let op</span>}
                {filteredTemp.length > 0 && nokTemp === 0 && warnTemp === 0 && <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-[#EAF3DE] text-[#27500A]">Alles OK</span>}
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">🧹 Reinigingsrapporten</span>
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">{filteredClean.length}</span>
                {filteredClean.length > 0 && (
                  <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${doneClean === filteredClean.length ? "bg-[#EAF3DE] text-[#27500A]" : "bg-[#FAEEDA] text-[#633806]"}`}>
                    {doneClean}/{filteredClean.length} volledig
                  </span>
                )}
              </div>
            </div>
            <div className="border-t border-gray-200 pt-2 mt-2 flex items-center justify-between text-xs text-gray-500">
              <span>Totaal rapporten in overzicht</span>
              <span className="font-medium text-gray-900">{total}</span>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={handleExport}
        disabled={total === 0}
        className={`w-full sm:w-auto px-5 py-2.5 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
          total === 0
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-gray-900 text-white hover:bg-gray-700"
        }`}
      >
        📄 Maandoverzicht downloaden
      </button>
    </div>
  );
}

export function Reports({ tempReports, cleanReports, onDeleteTemp, onDeleteClean, onToast }: ReportsProps) {
  const [tab, setTab] = useState<Tab>("temp");

  const handleDeleteTemp = (id: string) => {
    if (window.confirm("Dit rapport permanent verwijderen?")) {
      onDeleteTemp(id);
      onToast("Rapport verwijderd");
    }
  };
  const handleDeleteClean = (id: string) => {
    if (window.confirm("Dit rapport permanent verwijderen?")) {
      onDeleteClean(id);
      onToast("Rapport verwijderd");
    }
  };

  const viewTemp = (r: TempReport) => {
    const lines = r.rows
      .filter((row) => row.avg)
      .map((row) => `${row.object}: gem. ${row.avg}°C (${statusLabel(row.status)})${row.maatregel ? " – " + row.maatregel : ""}`)
      .join("\n");
    alert(`Rapport: ${r.week}\nDatum: ${r.date} | Paraaf: ${r.paraaf || "—"}\n\n${lines || "Geen metingen"}`);
  };

  const viewClean = (r: CleanReport) => {
    const lines = r.rows.map((row) => `${row.checked ? "✓" : "✗"} ${row.task}${row.note ? " – " + row.note : ""}`).join("\n");
    alert(`${r.freq.charAt(0).toUpperCase() + r.freq.slice(1)} – ${r.datum}\nUitgevoerd door: ${r.door || "—"}\n\n${lines}`);
  };

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "temp", label: "Temperatuur", icon: "🌡️" },
    { key: "clean", label: "Reiniging", icon: "🧹" },
    { key: "maand", label: "Maandoverzicht", icon: "📋" },
  ];

  return (
    <div>
      <div className="flex gap-2 mb-4 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-md border text-sm transition-all ${
              tab === t.key
                ? "bg-gray-100 border-gray-400 text-gray-900 font-medium"
                : "bg-transparent text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === "temp" && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h2 className="text-sm font-medium text-gray-900">🌡️ Temperatuurrapporten per week</h2>
            <button
              onClick={() => { if (!tempReports.length) { onToast("Geen rapporten om te exporteren."); return; } exportAllTempCSV(tempReports); onToast("CSV gedownload"); }}
              className="px-3 py-1.5 border border-gray-200 rounded-md text-xs text-gray-600 hover:bg-gray-50 transition-colors"
            >
              📊 Alles als CSV
            </button>
          </div>
          {tempReports.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-6">Nog geen temperatuurrapporten opgeslagen</p>
          ) : (
            <div className="space-y-3">
              {tempReports.map((r) => {
                const nokCount = r.rows.filter((row) => row.status === "nok").length;
                const warnCount = r.rows.filter((row) => row.status === "warn").length;
                const measCount = r.rows.filter((row) => row.avg).length;
                return (
                  <div key={r.id} className="border border-gray-100 rounded-lg p-3 flex flex-wrap items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900">🌡️ {r.week}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {measCount} objecten · {r.date} om {r.time}{r.paraaf ? ` · paraaf: ${r.paraaf}` : ""}
                      </div>
                      <div className="flex gap-1.5 mt-1.5 flex-wrap">
                        {nokCount > 0 && <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-[#FCEBEB] text-[#791F1F]">{nokCount} NOK</span>}
                        {warnCount > 0 && <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-[#FAEEDA] text-[#633806]">{warnCount} let op</span>}
                        {!nokCount && !warnCount && <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-[#EAF3DE] text-[#27500A]">Alles OK</span>}
                      </div>
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      <button onClick={() => viewTemp(r)} className="px-2.5 py-1.5 border border-gray-200 rounded-md text-xs text-gray-600 hover:bg-gray-50 transition-colors">👁️ Bekijken</button>
                      <button onClick={() => { downloadTempReport(r); onToast("PDF gedownload"); }} className="px-2.5 py-1.5 border border-gray-200 rounded-md text-xs text-gray-600 hover:bg-gray-50 transition-colors">📄 PDF</button>
                      <button onClick={() => handleDeleteTemp(r.id)} className="px-2.5 py-1.5 border border-red-200 rounded-md text-xs text-red-600 hover:bg-red-50 transition-colors">🗑️</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === "clean" && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h2 className="text-sm font-medium text-gray-900">🧹 Reinigingsrapporten</h2>
            <button
              onClick={() => { if (!cleanReports.length) { onToast("Geen rapporten om te exporteren."); return; } exportAllCleanCSV(cleanReports); onToast("CSV gedownload"); }}
              className="px-3 py-1.5 border border-gray-200 rounded-md text-xs text-gray-600 hover:bg-gray-50 transition-colors"
            >
              📊 Alles als CSV
            </button>
          </div>
          {cleanReports.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-6">Nog geen reinigingsrapporten opgeslagen</p>
          ) : (
            <div className="space-y-3">
              {cleanReports.map((r) => {
                const doneCount = r.rows.filter((row) => row.checked).length;
                const total = r.rows.length;
                const allDone = doneCount === total;
                return (
                  <div key={r.id} className="border border-gray-100 rounded-lg p-3 flex flex-wrap items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900">🧹 {r.freq.charAt(0).toUpperCase() + r.freq.slice(1)} – {r.datum}</div>
                      <div className="text-xs text-gray-500 mt-0.5">Uitgevoerd door: {r.door || "—"} · om {r.time}</div>
                      <div className="mt-1.5">
                        <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${allDone ? "bg-[#EAF3DE] text-[#27500A]" : "bg-[#FAEEDA] text-[#633806]"}`}>
                          {doneCount}/{total} taken afgevinkt
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      <button onClick={() => viewClean(r)} className="px-2.5 py-1.5 border border-gray-200 rounded-md text-xs text-gray-600 hover:bg-gray-50 transition-colors">👁️ Bekijken</button>
                      <button onClick={() => { downloadCleanReport(r); onToast("PDF gedownload"); }} className="px-2.5 py-1.5 border border-gray-200 rounded-md text-xs text-gray-600 hover:bg-gray-50 transition-colors">📄 PDF</button>
                      <button onClick={() => handleDeleteClean(r.id)} className="px-2.5 py-1.5 border border-red-200 rounded-md text-xs text-red-600 hover:bg-red-50 transition-colors">🗑️</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === "maand" && (
        <MonthlyOverview tempReports={tempReports} cleanReports={cleanReports} onToast={onToast} />
      )}
    </div>
  );
}
