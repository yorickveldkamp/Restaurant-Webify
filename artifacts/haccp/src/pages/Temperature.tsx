import { useState } from "react";
import { OBJECTS, TempRow, TempReport, statusForTemp, worstStatus, uid, todayDate, nowTime, Status } from "../lib/data";
import { Badge } from "../components/Badge";
import { exportAllTempCSV } from "../lib/pdf";

interface TemperatureProps {
  tempReports: TempReport[];
  onSave: (report: TempReport) => void;
  onToast: (msg: string) => void;
}

type Measurements = Record<string, { m1: string; m2: string; m3: string; maatregel: string }>;

function initMeasurements(): Measurements {
  const m: Measurements = {};
  OBJECTS.forEach((o) => { m[o.id] = { m1: "", m2: "", m3: "", maatregel: "" }; });
  return m;
}

export function Temperature({ tempReports, onSave, onToast }: TemperatureProps) {
  const [week, setWeek] = useState("");
  const [paraaf, setParaaf] = useState("");
  const [measurements, setMeasurements] = useState<Measurements>(initMeasurements);

  const updateMeasurement = (id: string, field: "m1" | "m2" | "m3" | "maatregel", value: string) => {
    setMeasurements((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const getRowStatus = (id: string): Status => {
    const obj = OBJECTS.find((o) => o.id === id)!;
    const vals = [measurements[id].m1, measurements[id].m2, measurements[id].m3].filter((v) => v !== "");
    const statuses = vals.map((v) => statusForTemp(v, obj.type));
    return worstStatus(statuses);
  };

  const saveReport = () => {
    if (!week.trim()) { onToast("Vul het weeknummer in voor je opslaat."); return; }
    const rows: TempRow[] = [];
    let anyData = false;
    OBJECTS.forEach((obj) => {
      const { m1, m2, m3, maatregel } = measurements[obj.id];
      const vals = [m1, m2, m3].filter((v) => v !== "");
      if (!vals.length) {
        rows.push({ object: obj.label, type: obj.type, m1: "", m2: "", m3: "", avg: "", status: null, maatregel });
        return;
      }
      anyData = true;
      const statuses = vals.map((v) => statusForTemp(v, obj.type));
      const ws = worstStatus(statuses);
      const avg = vals.reduce((a, b) => a + parseFloat(b), 0) / vals.length;
      rows.push({ object: obj.label, type: obj.type, m1, m2, m3, avg: avg.toFixed(1), status: ws, maatregel });
    });
    if (!anyData) { onToast("Voer eerst metingen in."); return; }
    const allStatuses = rows.map((r) => r.status).filter(Boolean) as Status[];
    const ws = worstStatus(allStatuses);
    const report: TempReport = { id: uid(), week, paraaf, date: todayDate(), time: nowTime(), rows, overallStatus: ws, type: "temp" };
    onSave(report);
    onToast(`Rapport "${week}" opgeslagen`);
    setMeasurements(initMeasurements());
    setWeek("");
    setParaaf("");
  };

  let lastType = "";

  return (
    <div>
      <div className="bg-gray-100 rounded-lg px-3 py-2.5 mb-4 text-xs text-gray-600">
        <strong>Koeling:</strong> max 7,0°C | afkeur: 7,1°C en hoger &nbsp;
        <strong>Diepvries:</strong> max -18,0°C | afkeur: -17,9°C en warmer
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 whitespace-nowrap">📅 Week + jaar:</label>
            <input
              type="text"
              value={week}
              onChange={(e) => setWeek(e.target.value)}
              placeholder="bv. week 21 – 2026"
              className="border border-gray-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 w-36"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">Paraaf:</label>
            <input
              type="text"
              value={paraaf}
              onChange={(e) => setParaaf(e.target.value)}
              placeholder="initialen"
              className="border border-gray-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 w-20"
            />
          </div>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-2 py-2 text-xs font-medium text-gray-500 border-b border-gray-200 w-44">Object</th>
                <th className="text-left px-2 py-2 text-xs font-medium text-gray-500 border-b border-gray-200 w-20">1e meting</th>
                <th className="text-left px-2 py-2 text-xs font-medium text-gray-500 border-b border-gray-200 w-20">2e meting</th>
                <th className="text-left px-2 py-2 text-xs font-medium text-gray-500 border-b border-gray-200 w-20">3e meting</th>
                <th className="text-left px-2 py-2 text-xs font-medium text-gray-500 border-b border-gray-200 w-20">Status</th>
                <th className="text-left px-2 py-2 text-xs font-medium text-gray-500 border-b border-gray-200">Corrigerende maatregel</th>
              </tr>
            </thead>
            <tbody>
              {OBJECTS.map((obj) => {
                const showDivider = obj.type !== lastType;
                if (showDivider) lastType = obj.type;
                const rowStatus = getRowStatus(obj.id);
                return [
                  showDivider && (
                    <tr key={`div-${obj.type}`}>
                      <td colSpan={6} className="bg-gray-50 text-xs font-medium text-gray-500 px-2 py-1.5 tracking-wide uppercase">
                        {obj.type === "koeling" ? "Koeling — norm max 7,0°C" : "Diepvries — norm max -18,0°C"}
                      </td>
                    </tr>
                  ),
                  <tr key={obj.id} className="border-b border-gray-100 last:border-0">
                    <td className="px-2 py-2 text-xs text-gray-900">{obj.label}</td>
                    {(["m1", "m2", "m3"] as const).map((m) => (
                      <td key={m} className="px-2 py-2">
                        <input
                          type="number"
                          step="0.1"
                          value={measurements[obj.id][m]}
                          onChange={(e) => updateMeasurement(obj.id, m, e.target.value)}
                          placeholder="°C"
                          className="border border-gray-200 rounded px-1.5 py-1 text-xs w-16 text-center focus:outline-none focus:ring-1 focus:ring-gray-400"
                        />
                      </td>
                    ))}
                    <td className="px-2 py-2"><Badge status={rowStatus} /></td>
                    <td className="px-2 py-2">
                      <input
                        type="text"
                        value={measurements[obj.id].maatregel}
                        onChange={(e) => updateMeasurement(obj.id, "maatregel", e.target.value)}
                        placeholder="indien nodig"
                        className="border border-gray-200 rounded px-1.5 py-1 text-xs w-full focus:outline-none focus:ring-1 focus:ring-gray-400"
                      />
                    </td>
                  </tr>,
                ];
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden space-y-3">
          {OBJECTS.map((obj, idx) => {
            const prevType = idx > 0 ? OBJECTS[idx - 1].type : "";
            const showDivider = obj.type !== prevType;
            const rowStatus = getRowStatus(obj.id);
            return (
              <div key={obj.id}>
                {showDivider && (
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide bg-gray-50 px-2 py-1.5 rounded -mx-0 mb-2">
                    {obj.type === "koeling" ? "Koeling — norm max 7,0°C" : "Diepvries — norm max -18,0°C"}
                  </div>
                )}
                <div className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">{obj.label}</span>
                    <Badge status={rowStatus} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    {(["m1", "m2", "m3"] as const).map((m, i) => (
                      <div key={m}>
                        <label className="text-xs text-gray-400 block mb-0.5">{i + 1}e meting</label>
                        <input
                          type="number"
                          step="0.1"
                          value={measurements[obj.id][m]}
                          onChange={(e) => updateMeasurement(obj.id, m, e.target.value)}
                          placeholder="°C"
                          className="border border-gray-200 rounded px-2 py-1.5 text-sm w-full text-center focus:outline-none focus:ring-1 focus:ring-gray-400"
                        />
                      </div>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={measurements[obj.id].maatregel}
                    onChange={(e) => updateMeasurement(obj.id, "maatregel", e.target.value)}
                    placeholder="Corrigerende maatregel (indien nodig)"
                    className="border border-gray-200 rounded px-2 py-1.5 text-xs w-full focus:outline-none focus:ring-1 focus:ring-gray-400"
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <button
            onClick={saveReport}
            className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-700 transition-colors flex items-center gap-1.5"
          >
            💾 Opslaan als rapport
          </button>
          <button
            onClick={() => { if (!tempReports.length) { onToast("Geen rapporten om te exporteren."); return; } exportAllTempCSV(tempReports); onToast("CSV gedownload"); }}
            className="px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-1.5"
          >
            📊 CSV
          </button>
        </div>
      </div>
    </div>
  );
}
