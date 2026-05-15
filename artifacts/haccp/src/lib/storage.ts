import { TempReport, CleanReport } from "./data";

const TEMP_KEY = "haccp:temp-reports";
const CLEAN_KEY = "haccp:clean-reports";

export function loadTempReports(): TempReport[] {
  try {
    const raw = localStorage.getItem(TEMP_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveTempReports(reports: TempReport[]): void {
  localStorage.setItem(TEMP_KEY, JSON.stringify(reports));
}

export function loadCleanReports(): CleanReport[] {
  try {
    const raw = localStorage.getItem(CLEAN_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCleanReports(reports: CleanReport[]): void {
  localStorage.setItem(CLEAN_KEY, JSON.stringify(reports));
}

export function clearTempReports(): void {
  localStorage.removeItem(TEMP_KEY);
}

export function clearCleanReports(): void {
  localStorage.removeItem(CLEAN_KEY);
}
