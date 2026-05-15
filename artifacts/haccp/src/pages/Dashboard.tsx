import { TempReport, CleanReport, todayFull } from "../lib/data";
import { getSchedule } from "../lib/schedule";

interface DashboardProps {
  tempReports: TempReport[];
  cleanReports: CleanReport[];
  onNavigate: (tab: string) => void;
}

export function Dashboard({ tempReports, cleanReports, onNavigate }: DashboardProps) {
  const schedule = getSchedule(tempReports, cleanReports);
  const doneCount = schedule.filter((t) => t.done).length;
  const allDone = doneCount === schedule.length;

  return (
    <div>
      {/* Status summary */}
      <div className={`rounded-xl p-4 mb-4 border ${allDone ? "bg-[#EAF3DE] border-[#c3e0a0]" : "bg-white border-gray-200"}`}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className={`text-sm font-semibold ${allDone ? "text-[#27500A]" : "text-gray-900"}`}>
              {allDone ? "✅ Alles gedaan voor vandaag!" : `📋 ${doneCount} van ${schedule.length} taken afgerond`}
            </div>
            <div className={`text-xs mt-0.5 ${allDone ? "text-[#3a6e12]" : "text-gray-500"}`}>
              {todayFull().charAt(0).toUpperCase() + todayFull().slice(1)}
            </div>
          </div>
          {!allDone && (
            <div className="flex gap-1">
              {schedule.map((t, i) => (
                <div
                  key={i}
                  title={t.label}
                  className={`w-2.5 h-2.5 rounded-full ${t.done ? "bg-green-500" : "bg-gray-300"}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Task schedule */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-4">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-medium text-gray-900">Taken overzicht</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {schedule.map((task, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              {/* Status dot */}
              <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-base ${
                task.done ? "bg-[#EAF3DE]" : "bg-gray-100"
              }`}>
                {task.done ? "✅" : "⏳"}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900">{task.label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{task.period}</div>
              </div>

              {/* Action or done badge */}
              {task.done ? (
                <span className="shrink-0 px-2.5 py-1 rounded-full text-xs font-medium bg-[#EAF3DE] text-[#27500A]">
                  Gedaan
                </span>
              ) : (
                <button
                  onClick={() => onNavigate(task.actionTab)}
                  className="shrink-0 px-3 py-1.5 rounded-md border border-gray-200 text-xs text-gray-700 font-medium hover:bg-gray-50 transition-colors whitespace-nowrap"
                >
                  {task.actionLabel} →
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Recent log */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <h2 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
          🕐 Recente registraties
        </h2>
        {(() => {
          const allItems = [
            ...tempReports.map((r) => ({ date: r.date, time: r.time, type: "Temperatuur", details: r.week, status: r.overallStatus })),
            ...cleanReports.map((r) => ({ date: r.datum, time: r.time, type: "Reiniging", details: r.freq + " – " + r.datum, status: r.overallStatus })),
          ].sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time)).slice(0, 8);

          if (allItems.length === 0) {
            return <p className="text-center text-gray-400 text-sm py-4">Nog geen registraties</p>;
          }
          return (
            <div className="space-y-2">
              {allItems.map((e, i) => {
                const badgeClass = e.status === "ok"
                  ? "bg-[#EAF3DE] text-[#27500A]"
                  : e.status === "warn"
                  ? "bg-[#FAEEDA] text-[#633806]"
                  : e.status === "nok"
                  ? "bg-[#FCEBEB] text-[#791F1F]"
                  : "bg-gray-100 text-gray-500";
                const badgeLabel = e.status === "ok" ? "OK" : e.status === "warn" ? "Let op" : e.status === "nok" ? "NOK" : "—";
                return (
                  <div key={i} className="flex items-start justify-between py-2 border-b border-gray-100 last:border-0 gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-gray-900 truncate">{e.details}</div>
                      <div className="text-xs text-gray-500">{e.type} · {e.date} {e.time}</div>
                    </div>
                    {e.status && (
                      <span className={`shrink-0 px-2 py-0.5 rounded-md text-xs font-medium ${badgeClass}`}>
                        {badgeLabel}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
