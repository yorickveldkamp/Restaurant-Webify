import { TempReport, CleanReport, statusLabel } from "../lib/data";
import { Badge } from "../components/Badge";

interface DashboardProps {
  tempReports: TempReport[];
  cleanReports: CleanReport[];
  onClear: (type: "temp" | "cleaning" | "all") => void;
}

export function Dashboard({ tempReports, cleanReports, onClear }: DashboardProps) {
  const allItems = [
    ...tempReports.map((r) => ({ date: r.date, time: r.time, type: "Temperatuur", details: r.week, status: r.overallStatus })),
    ...cleanReports.map((r) => ({ date: r.datum, time: r.time, type: "Reiniging", details: r.freq + " – " + r.datum, status: r.overallStatus })),
  ].sort((a, b) => b.time.localeCompare(a.time)).slice(0, 10);

  const confirmClear = (type: "temp" | "cleaning" | "all") => {
    const labels = { temp: "alle temperatuurrapporten", cleaning: "alle reinigingsrapporten", all: "ALLE rapporten" };
    if (window.confirm(`Weet je zeker dat je ${labels[type]} permanent wil verwijderen?`)) {
      onClear(type);
    }
  };

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-100 rounded-lg p-4 text-center">
          <div className="text-3xl font-medium text-gray-900">{tempReports.length}</div>
          <div className="text-xs text-gray-500 mt-1">Temperatuurrapporten</div>
        </div>
        <div className="bg-gray-100 rounded-lg p-4 text-center">
          <div className="text-3xl font-medium text-gray-900">{cleanReports.length}</div>
          <div className="text-xs text-gray-500 mt-1">Reinigingsrapporten</div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
        <h2 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
          🕐 Recente registraties
        </h2>
        {allItems.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-6">Nog geen registraties</p>
        ) : (
          <div className="space-y-2">
            {allItems.map((e, i) => (
              <div key={i} className="flex items-start justify-between py-2 border-b border-gray-100 last:border-0 gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-gray-900 truncate">{e.details}</div>
                  <div className="text-xs text-gray-500">{e.type} · {e.date} {e.time}</div>
                </div>
                <Badge status={e.status} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white border border-red-100 rounded-xl p-4">
        <h2 className="text-sm font-medium text-red-600 mb-1 flex items-center gap-2">
          🗑️ Gegevens wissen
        </h2>
        <p className="text-xs text-gray-500 mb-3">Verwijder opgeslagen rapporten permanent.</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => confirmClear("temp")}
            className="px-3 py-1.5 rounded-md border border-red-200 text-red-600 text-xs hover:bg-red-50 transition-colors"
          >
            🗑️ Temperaturen wissen
          </button>
          <button
            onClick={() => confirmClear("cleaning")}
            className="px-3 py-1.5 rounded-md border border-red-200 text-red-600 text-xs hover:bg-red-50 transition-colors"
          >
            🗑️ Reiniging wissen
          </button>
          <button
            onClick={() => confirmClear("all")}
            className="px-3 py-1.5 rounded-md border border-red-200 text-red-600 text-xs hover:bg-red-50 transition-colors"
          >
            ⚠️ Alles wissen
          </button>
        </div>
      </div>
    </div>
  );
}
