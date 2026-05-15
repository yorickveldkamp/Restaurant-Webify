import { TempReport, CleanReport } from "./data";

/** Parse "dd/mm/yyyy" → Date (midnight local) or null */
function parseDutchDate(s: string): Date | null {
  const parts = s.split("/");
  if (parts.length !== 3) return null;
  const d = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const y = parseInt(parts[2], 10);
  if (isNaN(d) || isNaN(m) || isNaN(y)) return null;
  return new Date(y, m, d);
}

/** Monday of the week containing `date` */
function weekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun, 1=Mon...
  const diff = (day === 0 ? -6 : 1 - day);
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Sunday of the week containing `date` */
function weekEnd(date: Date): Date {
  const start = weekStart(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

/** ISO week number */
export function isoWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

export interface TaskStatus {
  label: string;
  period: string;
  done: boolean;
  actionTab: string;
  actionLabel: string;
}

export function getSchedule(tempReports: TempReport[], cleanReports: CleanReport[]): TaskStatus[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const wStart = weekStart(today);
  const wEnd = weekEnd(today);
  const week = isoWeekNumber(today);
  const year = today.getFullYear();
  const monthStart = new Date(year, today.getMonth(), 1);
  const monthEnd = new Date(year, today.getMonth() + 1, 0, 23, 59, 59, 999);

  // Helpers
  const inRange = (d: Date, from: Date, to: Date) => d >= from && d <= to;

  // 1. Weekly temperature plan – check if any temp report was saved this week
  const tempDoneThisWeek = tempReports.some((r) => {
    const d = parseDutchDate(r.date);
    return d && inRange(d, wStart, wEnd);
  });

  // 2. Daily cleaning
  const cleanDoneToday = cleanReports.some((r) => {
    if (r.freq !== "dagelijks") return false;
    const d = parseDutchDate(r.datum);
    return d && d.getTime() === today.getTime();
  });

  // 3. Weekly cleaning
  const cleanDoneThisWeek = cleanReports.some((r) => {
    if (r.freq !== "wekelijks") return false;
    const d = parseDutchDate(r.datum);
    return d && inRange(d, wStart, wEnd);
  });

  // 4. Monthly cleaning
  const cleanDoneThisMonth = cleanReports.some((r) => {
    if (r.freq !== "maandelijks") return false;
    const d = parseDutchDate(r.datum);
    return d && inRange(d, monthStart, monthEnd);
  });

  const dayLabel = today.toLocaleDateString("nl-BE", { weekday: "long", day: "numeric", month: "long" });
  const monthLabel = today.toLocaleDateString("nl-BE", { month: "long", year: "numeric" });
  const monthCap = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

  return [
    {
      label: "Temperatuurplan",
      period: `Week ${week} – ${year}`,
      done: tempDoneThisWeek,
      actionTab: "temp",
      actionLabel: "Metingen invullen",
    },
    {
      label: "Dagelijkse reiniging",
      period: dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1),
      done: cleanDoneToday,
      actionTab: "cleaning",
      actionLabel: "Checklist invullen",
    },
    {
      label: "Wekelijkse reiniging",
      period: `Week ${week} – ${year}`,
      done: cleanDoneThisWeek,
      actionTab: "cleaning",
      actionLabel: "Checklist invullen",
    },
    {
      label: "Maandelijkse reiniging",
      period: monthCap,
      done: cleanDoneThisMonth,
      actionTab: "cleaning",
      actionLabel: "Checklist invullen",
    },
  ];
}
