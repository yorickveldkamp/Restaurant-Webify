import { useState } from "react";
import { TempReport, CleanReport, statusLabel } from "../lib/data";
import { Badge } from "../components/Badge";
import { downloadTempReport, downloadCleanReport, exportAllTempCSV, exportAllCleanCSV } from "../lib/pdf";

interface ReportsProps {
  tempReports: TempReport[];
  cleanReports: CleanReport[];
  onDeleteTemp: (id: string) => void;
  onDeleteClean: (id: string) => void;
  onToast: (msg: string) => void;
}

export function Reports({ tempReports, cleanReports, onDeleteTemp, onDeleteClean, onToast }: ReportsProps) {
  const [tab, setTab] = useState<"temp" | "clean">("temp");

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

  return (
    <div>
      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setTab("temp")}
          className={`px-4 py-1.5 rounded-md border text-sm transition-all ${
            tab === "temp"
              ? "bg-gray-100 border-gray-400 text-gray-900 font-medium"
              : "bg-transparent text-gray-600 border-gray-200 hover:bg-gray-50"
          }`}
        >
          🌡️ Temperatuur
        </button>
        <button
          onClick={() => setTab("clean")}
          className={`px-4 py-1.5 rounded-md border text-sm transition-all ${
            tab === "clean"
              ? "bg-gray-100 border-gray-400 text-gray-900 font-medium"
              : "bg-transparent text-gray-600 border-gray-200 hover:bg-gray-50"
          }`}
        >
          🧹 Reiniging
        </button>
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
    </div>
  );
}
