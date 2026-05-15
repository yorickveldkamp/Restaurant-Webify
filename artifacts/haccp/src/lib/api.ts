import { TempReport, CleanReport } from "./data";

const BASE = "/api";

function norm(r: Record<string, unknown>): Record<string, unknown> {
  return { ...r, type: r["week"] !== undefined ? "temp" : "cleaning" };
}

export async function apiGetTempReports(): Promise<TempReport[]> {
  const res = await fetch(`${BASE}/reports/temp`);
  if (!res.ok) throw new Error("Failed to load temperature reports");
  const data = await res.json() as Record<string, unknown>[];
  return data.map(r => ({
    id: r.id as string,
    week: r.week as string,
    paraaf: (r.paraaf as string) ?? "",
    date: r.date as string,
    time: r.time as string,
    rows: r.rows as TempReport["rows"],
    overallStatus: (r.overallStatus ?? null) as TempReport["overallStatus"],
    type: "temp" as const,
  }));
}

export async function apiAddTempReport(report: TempReport): Promise<void> {
  const res = await fetch(`${BASE}/reports/temp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(report),
  });
  if (!res.ok) throw new Error("Failed to save temperature report");
}

export async function apiDeleteTempReport(id: string): Promise<void> {
  const res = await fetch(`${BASE}/reports/temp/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete temperature report");
}

export async function apiGetCleanReports(): Promise<CleanReport[]> {
  const res = await fetch(`${BASE}/reports/clean`);
  if (!res.ok) throw new Error("Failed to load cleaning reports");
  const data = await res.json() as Record<string, unknown>[];
  return data.map(r => ({
    id: r.id as string,
    freq: r.freq as string,
    datum: r.datum as string,
    door: (r.door as string) ?? "",
    time: r.time as string,
    rows: r.rows as CleanReport["rows"],
    overallStatus: (r.overallStatus ?? null) as CleanReport["overallStatus"],
    type: "cleaning" as const,
  }));
}

export async function apiAddCleanReport(report: CleanReport): Promise<void> {
  const res = await fetch(`${BASE}/reports/clean`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(report),
  });
  if (!res.ok) throw new Error("Failed to save cleaning report");
}

export async function apiDeleteCleanReport(id: string): Promise<void> {
  const res = await fetch(`${BASE}/reports/clean/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete cleaning report");
}

export async function apiClearTempReports(): Promise<void> {
  const reports = await apiGetTempReports();
  await Promise.all(reports.map(r => apiDeleteTempReport(r.id)));
}

export async function apiClearCleanReports(): Promise<void> {
  const reports = await apiGetCleanReports();
  await Promise.all(reports.map(r => apiDeleteCleanReport(r.id)));
}

void norm; // suppress unused warning
