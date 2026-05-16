import { TempReport, CleanReport, HygieneReport, Employee } from "./data";

const TEMP_KEY = "haccp:temp-reports";
const CLEAN_KEY = "haccp:clean-reports";
const TEMP_DRAFT_KEY = "haccp:draft:temp";
const CLEAN_DRAFT_PREFIX = "haccp:draft:clean:";

export function loadTempReports(): TempReport[] {
  try {
    const raw = localStorage.getItem(TEMP_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveTempReports(reports: TempReport[]): void {
  localStorage.setItem(TEMP_KEY, JSON.stringify(reports));
}

export function loadCleanReports(): CleanReport[] {
  try {
    const raw = localStorage.getItem(CLEAN_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveCleanReports(reports: CleanReport[]): void {
  localStorage.setItem(CLEAN_KEY, JSON.stringify(reports));
}

export function clearTempReports(): void { localStorage.removeItem(TEMP_KEY); }
export function clearCleanReports(): void { localStorage.removeItem(CLEAN_KEY); }

/* ── Draft (intermediate save) helpers ─────────────────── */

export function loadDraft<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : null;
  } catch { return null; }
}

export function saveDraft<T>(key: string, value: T): void {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}

export function clearDraft(key: string): void {
  try { localStorage.removeItem(key); } catch { /* ignore */ }
}

export const tempDraftKey = () => TEMP_DRAFT_KEY;
export const cleanDraftKey = (freq: string) => `${CLEAN_DRAFT_PREFIX}${freq}`;

const HYGIENE_KEY = "haccp:hygiene-reports";
const EMPLOYEES_KEY = "haccp:hygiene-employees";

export function loadHygieneReports(): HygieneReport[] {
  try {
    const raw = localStorage.getItem(HYGIENE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveHygieneReports(reports: HygieneReport[]): void {
  localStorage.setItem(HYGIENE_KEY, JSON.stringify(reports));
}

export function loadEmployees(): Employee[] {
  try {
    const raw = localStorage.getItem(EMPLOYEES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveEmployees(employees: Employee[]): void {
  localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(employees));
}

export function clearTempDraft(): void { clearDraft(TEMP_DRAFT_KEY); }
export function clearAllCleanDrafts(): void {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.startsWith(CLEAN_DRAFT_PREFIX)) localStorage.removeItem(k);
    }
  } catch { /* ignore */ }
}
