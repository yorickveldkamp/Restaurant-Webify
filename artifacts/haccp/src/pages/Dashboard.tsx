import { TempReport, CleanReport, todayFull } from "../lib/data";
import { getSchedule } from "../lib/schedule";

interface Props {
  tempReports: TempReport[];
  cleanReports: CleanReport[];
  onNavigate: (tab: string) => void;
}

export function Dashboard({ tempReports, cleanReports, onNavigate }: Props) {
  const schedule = getSchedule(tempReports, cleanReports);
  const doneCount = schedule.filter(t => t.done).length;
  const allDone = doneCount === schedule.length;

  const allItems = [
    ...tempReports.map(r => ({ date: r.date, time: r.time, type: "Temperatuur", details: r.week, status: r.overallStatus })),
    ...cleanReports.map(r => ({ date: r.datum, time: r.time, type: "Reiniging", details: r.freq + " – " + r.datum, status: r.overallStatus })),
  ].sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time)).slice(0, 8);

  return (
    <div className="space-y-4">
      {/* Status banner */}
      <div className="card px-5 py-4" style={{ borderLeft: `4px solid ${allDone ? "var(--sage)" : "var(--beige)"}` }}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="font-semibold text-sm" style={{ color: allDone ? "var(--sage-dark)" : "var(--text)" }}>
              {allDone ? "✓ Alles gedaan voor vandaag" : `${doneCount} van ${schedule.length} taken afgerond`}
            </div>
            <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              {todayFull().charAt(0).toUpperCase() + todayFull().slice(1)}
            </div>
          </div>
          <div className="flex gap-1.5">
            {schedule.map((t, i) => (
              <div key={i} title={t.label} style={{ width: 10, height: 10, background: t.done ? "var(--sage)" : "var(--beige)", borderRadius: 0 }} />
            ))}
          </div>
        </div>
      </div>

      {/* Task schedule */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3" style={{ borderBottom: "1px solid var(--border)", background: "var(--beige-light)" }}>
          <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>Taken overzicht</span>
        </div>
        <div>
          {schedule.map((task, i) => (
            <div
              key={i}
              className="flex items-center gap-4 px-5 py-3.5"
              style={{
                borderBottom: i < schedule.length - 1 ? "1px solid var(--beige-light)" : "none",
                borderLeft: `3px solid ${task.done ? "var(--sage)" : "transparent"}`,
              }}
            >
              <div className="shrink-0 w-7 h-7 flex items-center justify-center text-sm"
                style={{ background: task.done ? "var(--sage)" : "var(--beige-light)", color: task.done ? "#fff" : "var(--text-muted)" }}>
                {task.done ? "✓" : "○"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium" style={{ color: "var(--text)" }}>{task.label}</div>
                <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{task.period}</div>
              </div>
              {task.done ? (
                <span className="badge-ok shrink-0">Gedaan</span>
              ) : (
                <button
                  onClick={() => onNavigate(task.actionTab)}
                  className="btn-secondary shrink-0 text-xs py-1.5 px-3"
                >
                  {task.actionLabel} →
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
