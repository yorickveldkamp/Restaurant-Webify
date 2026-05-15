import {
  OBJECTS, CLEANING_TASKS,
  TempReport, TempRow, CleanReport, CleanRow,
  statusForTemp, worstStatus, uid, nowTime, Status,
} from "./data";

/* ────────── CSV parsing (RFC-4180 style) ────────── */

/** Detect the most likely field delimiter (",", ";", or tab) from the header line.
 *  Many Excel/Numbers exports in NL/BE locale use ";" instead of ",". */
function detectDelimiter(text: string): "," | ";" | "\t" {
  // Look at the first non-empty, non-quoted-only line
  let inQuotes = false;
  let line = "";
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (inQuotes && text[i + 1] === '"') { line += '""'; i++; continue; }
      inQuotes = !inQuotes; line += c; continue;
    }
    if (!inQuotes && (c === "\n" || c === "\r")) {
      if (line.trim().length) break;
      line = "";
      continue;
    }
    line += c;
  }
  // Count occurrences of each candidate, ignoring those inside quotes
  const count = (delim: string) => {
    let n = 0; let q = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') { if (q && line[i + 1] === '"') { i++; continue; } q = !q; }
      else if (!q && c === delim) n++;
    }
    return n;
  };
  const semi = count(";");
  const comma = count(",");
  const tab = count("\t");
  if (semi > comma && semi >= tab) return ";";
  if (tab > comma && tab > semi) return "\t";
  return ",";
}

/** Parse a single raw string as a comma-delimited CSV row (RFC-4180 quoting). */
function parseCSVRow(s: string): string[] {
  const fields: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQuotes) {
      if (c === '"') {
        if (s[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ',') { fields.push(field); field = ""; }
      else field += c;
    }
  }
  fields.push(field);
  return fields;
}

/** Parse CSV text into rows of fields. Handles quoted fields, embedded delimiters,
 *  doubled-quote escaping, CRLF/LF, and a leading UTF-8 BOM. Auto-detects the
 *  delimiter (comma, semicolon, or tab) from the first line.
 *
 *  Also handles "double-encoded" files (e.g. from certain Excel exports) where
 *  each entire row is wrapped in outer quotes and inner fields are double-escaped.
 *  In that case every parsed row has exactly 1 column; we re-parse each inner
 *  value as a comma-delimited row to recover the actual fields. */
export function parseCSV(text: string): string[][] {
  // Strip BOM
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
  const delim = detectDelimiter(text);
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === delim) { row.push(field); field = ""; }
      else if (c === '\r') { /* swallow */ }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ""; }
      else field += c;
    }
  }
  // last field/row
  if (field.length || row.length) { row.push(field); rows.push(row); }
  // drop trailing empty rows
  while (rows.length && rows[rows.length - 1].every(c => c === "")) rows.pop();

  // Unwrap double/triple-encoded files: every row is a single field whose inner
  // content is itself comma-delimited. Some exports (e.g. Numbers on Mac) add
  // extra quoting layers — the header may be encoded one level deeper than the
  // data rows. We run up to 3 passes, checking after each pass whether the data
  // rows have expanded; if so we also force-unwrap any header rows that are still
  // stuck at 1 column.
  if (rows.length >= 2 && rows.every(r => r.length === 1)) {
    let fields = rows.map(r => r[0]);
    for (let pass = 0; pass < 3; pass++) {
      const parsed = fields.map(s => parseCSVRow(s.replace(/^\uFEFF/, "")));
      // Check the modal column count across data rows (ignore header at index 0)
      const dataLengths = parsed.slice(1).map(r => r.length);
      dataLengths.sort((a, b) => a - b);
      const modal = dataLengths[Math.floor(dataLengths.length / 2)] ?? 1;
      if (modal > 1) {
        // Data rows are expanded. Any row still at 1 column (e.g. header encoded
        // one level deeper) gets one additional unwrap pass.
        return parsed.map(r =>
          r.length === 1 ? parseCSVRow(r[0].replace(/^\uFEFF/, "")) : r
        );
      }
      // Nothing expanded yet — peel one more layer and retry
      fields = parsed.map(r => r[0]);
    }
  }

  return rows;
}

/** Build a header→index map. Keys are lowercased + trimmed for resilience. */
function headerMap(headers: string[]): Record<string, number> {
  const map: Record<string, number> = {};
  headers.forEach((h, i) => { map[h.trim().toLowerCase()] = i; });
  return map;
}

function get(row: string[], map: Record<string, number>, ...names: string[]): string {
  for (const n of names) {
    const idx = map[n.toLowerCase()];
    if (idx !== undefined) return (row[idx] ?? "").trim();
  }
  return "";
}

/* ────────── Object & task lookup (case-insensitive) ────────── */

function findObject(label: string) {
  const norm = label.trim().toLowerCase();
  return OBJECTS.find(o => o.label.toLowerCase() === norm)
      ?? OBJECTS.find(o => o.id.toLowerCase() === norm);
}

function findTask(freq: string, label: string): string | null {
  const list = CLEANING_TASKS[freq];
  if (!list) return null;
  const norm = label.trim().toLowerCase();
  return list.find(t => t.toLowerCase() === norm) ?? null;
}

function normalizeFreq(s: string): "dagelijks" | "wekelijks" | "maandelijks" | null {
  const n = s.trim().toLowerCase();
  if (n === "dagelijks" || n === "daily") return "dagelijks";
  if (n === "wekelijks" || n === "weekly") return "wekelijks";
  if (n === "maandelijks" || n === "monthly") return "maandelijks";
  return null;
}

function parseChecked(s: string): boolean {
  const n = s.trim().toLowerCase();
  return ["gedaan", "ja", "yes", "true", "x", "✓", "1", "ok"].includes(n);
}

/** Normalize a date to dd/mm/yyyy. Accepts dd/mm/yyyy, dd-mm-yyyy, yyyy-mm-dd. */
function normalizeDate(s: string): string {
  const t = s.trim();
  if (!t) return "";
  let m = t.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
  if (m) return `${m[1].padStart(2, "0")}/${m[2].padStart(2, "0")}/${m[3]}`;
  m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return `${m[3].padStart(2, "0")}/${m[2].padStart(2, "0")}/${m[1]}`;
  return t;
}

/* ────────── Result types ────────── */

export interface ImportResult<T> {
  reports: T[];
  rowsRead: number;
  rowsSkipped: number;
  warnings: string[];
}

/* ────────── Temperature import ────────── */

const TEMP_REQUIRED = ["week", "object"];

export function importTempCSV(text: string): ImportResult<TempReport> {
  const rows = parseCSV(text);
  if (rows.length < 2) {
    return { reports: [], rowsRead: 0, rowsSkipped: 0, warnings: ["Bestand bevat geen gegevens (verwacht: kop + minstens één rij)."] };
  }
  const map = headerMap(rows[0]);
  const missing = TEMP_REQUIRED.filter(h => map[h] === undefined);
  if (missing.length) {
    return { reports: [], rowsRead: 0, rowsSkipped: 0, warnings: [`Verplichte kolom(men) ontbreken: ${missing.join(", ")}.`] };
  }

  const warnings: string[] = [];
  let skipped = 0;

  // Group rows by (week|date|paraaf) into a partial report
  type Acc = { week: string; date: string; paraaf: string; rowsByObject: Map<string, TempRow> };
  const groups = new Map<string, Acc>();

  const dataRows = rows.slice(1);
  dataRows.forEach((r, idx) => {
    const lineNo = idx + 2;
    const week = get(r, map, "week").trim();
    const objectLabel = get(r, map, "object");
    if (!week || !objectLabel) { skipped++; return; }

    const obj = findObject(objectLabel);
    if (!obj) {
      warnings.push(`Regel ${lineNo}: object "${objectLabel}" niet herkend, overgeslagen.`);
      skipped++;
      return;
    }

    const date = normalizeDate(get(r, map, "datum opgeslagen", "datum"));
    const paraaf = get(r, map, "paraaf");
    const cleanNum = (raw: string): string => {
      const s = raw.replace(",", ".").replace(/°c/gi, "").trim();
      if (s === "") return "";
      if (!Number.isFinite(parseFloat(s))) {
        warnings.push(`Regel ${lineNo}: meting "${raw}" is geen geldig getal, leeg gelaten.`);
        return "";
      }
      return s;
    };
    const m1 = cleanNum(get(r, map, "1e meting", "m1"));
    const m2 = cleanNum(get(r, map, "2e meting", "m2"));
    const m3 = cleanNum(get(r, map, "3e meting", "m3"));
    const maatregel = get(r, map, "maatregel", "corrigerende maatregel");

    const key = `${week}|${date}|${paraaf}`;
    let acc = groups.get(key);
    if (!acc) {
      acc = { week, date: date || "", paraaf, rowsByObject: new Map() };
      groups.set(key, acc);
    }

    const vals = [m1, m2, m3].filter(v => v !== "");
    const statuses = vals.map(v => statusForTemp(v, obj.type)).filter(Boolean) as Status[];
    const ws = worstStatus(statuses);
    const avg = vals.length ? (vals.reduce((a, b) => a + parseFloat(b), 0) / vals.length).toFixed(1) : "";

    if (acc.rowsByObject.has(obj.id)) {
      warnings.push(`Regel ${lineNo}: dubbele invoer voor "${obj.label}" in rapport ${week}${date ? ` (${date})` : ""} — vorige waarden overschreven.`);
    }
    acc.rowsByObject.set(obj.id, {
      object: obj.label, type: obj.type,
      m1, m2, m3, avg, status: ws, maatregel,
    });
  });

  // Build reports — fill in missing objects with empty rows so structure is consistent
  const reports: TempReport[] = [];
  groups.forEach(acc => {
    const out: TempRow[] = OBJECTS.map(obj => {
      const existing = acc.rowsByObject.get(obj.id);
      if (existing) return existing;
      return { object: obj.label, type: obj.type, m1: "", m2: "", m3: "", avg: "", status: null, maatregel: "" };
    });
    const overallStatus = worstStatus(out.map(r => r.status));
    reports.push({
      id: uid(),
      week: acc.week,
      paraaf: acc.paraaf,
      date: acc.date || todayDateNL(),
      time: nowTime(),
      rows: out,
      overallStatus,
      type: "temp",
    });
  });

  return { reports, rowsRead: dataRows.length, rowsSkipped: skipped, warnings };
}

/* ────────── Cleaning import ────────── */

const CLEAN_REQUIRED = ["frequentie", "datum", "taak"];

export function importCleanCSV(text: string): ImportResult<CleanReport> {
  const rows = parseCSV(text);
  if (rows.length < 2) {
    return { reports: [], rowsRead: 0, rowsSkipped: 0, warnings: ["Bestand bevat geen gegevens (verwacht: kop + minstens één rij)."] };
  }
  const map = headerMap(rows[0]);
  const missing = CLEAN_REQUIRED.filter(h => map[h] === undefined);
  if (missing.length) {
    return { reports: [], rowsRead: 0, rowsSkipped: 0, warnings: [`Verplichte kolom(men) ontbreken: ${missing.join(", ")}.`] };
  }

  const warnings: string[] = [];
  let skipped = 0;

  type Acc = { freq: "dagelijks" | "wekelijks" | "maandelijks"; datum: string; door: string; rowsByTask: Map<string, CleanRow> };
  const groups = new Map<string, Acc>();

  const dataRows = rows.slice(1);
  dataRows.forEach((r, idx) => {
    const lineNo = idx + 2;
    const freq = normalizeFreq(get(r, map, "frequentie"));
    if (!freq) { warnings.push(`Regel ${lineNo}: frequentie onbekend, overgeslagen.`); skipped++; return; }
    const datum = normalizeDate(get(r, map, "datum"));
    const door = get(r, map, "uitgevoerd door", "door", "naam");
    const taakLabel = get(r, map, "taak");
    const task = findTask(freq, taakLabel);
    if (!task) {
      warnings.push(`Regel ${lineNo}: taak "${taakLabel}" niet bekend bij frequentie "${freq}", overgeslagen.`);
      skipped++; return;
    }
    if (!datum) { warnings.push(`Regel ${lineNo}: datum ontbreekt, overgeslagen.`); skipped++; return; }

    const checked = parseChecked(get(r, map, "afgevinkt", "checked"));
    const tijdstip = get(r, map, "tijdstip", "tijd");
    const note = get(r, map, "opmerking", "opmerkingen", "note");

    const key = `${freq}|${datum}|${door}`;
    let acc = groups.get(key);
    if (!acc) { acc = { freq, datum, door, rowsByTask: new Map() }; groups.set(key, acc); }
    if (acc.rowsByTask.has(task)) {
      warnings.push(`Regel ${lineNo}: dubbele invoer voor taak "${task}" in rapport ${freq} ${datum} — vorige waarden overschreven.`);
    }
    acc.rowsByTask.set(task, { task, checked, tijdstip, handtekening: "", note });
  });

  const reports: CleanReport[] = [];
  groups.forEach(acc => {
    const out: CleanRow[] = CLEANING_TASKS[acc.freq].map(task => {
      const existing = acc.rowsByTask.get(task);
      if (existing) return existing;
      return { task, checked: false, tijdstip: "", handtekening: "", note: "" };
    });
    const overallStatus: Status = out.every(r => r.checked) ? "ok" : "warn";
    reports.push({
      id: uid(),
      freq: acc.freq,
      datum: acc.datum,
      door: acc.door,
      time: nowTime(),
      rows: out,
      overallStatus,
      type: "cleaning",
    });
  });

  return { reports, rowsRead: dataRows.length, rowsSkipped: skipped, warnings };
}

/* ────────── Cleaning import — per frequency (no Frequentie column needed) ────────── */

const CLEAN_REQUIRED_PER_FREQ = ["datum", "taak"];

export function importCleanCSVForFreq(
  text: string,
  freq: "dagelijks" | "wekelijks" | "maandelijks",
): ImportResult<CleanReport> {
  const rows = parseCSV(text);
  if (rows.length < 2) {
    return { reports: [], rowsRead: 0, rowsSkipped: 0, warnings: ["Bestand bevat geen gegevens (verwacht: kop + minstens één rij)."] };
  }
  const map = headerMap(rows[0]);
  const missing = CLEAN_REQUIRED_PER_FREQ.filter(h => map[h] === undefined);
  if (missing.length) {
    return { reports: [], rowsRead: 0, rowsSkipped: 0, warnings: [`Verplichte kolom(men) ontbreken: ${missing.join(", ")}.`] };
  }

  const warnings: string[] = [];
  let skipped = 0;

  type Acc = { datum: string; door: string; rowsByTask: Map<string, CleanRow> };
  const groups = new Map<string, Acc>();

  const dataRows = rows.slice(1);
  dataRows.forEach((r, idx) => {
    const lineNo = idx + 2;
    // Optional "frequentie" column: if present and mismatched, warn and skip
    const freqRaw = get(r, map, "frequentie");
    if (freqRaw) {
      const f = normalizeFreq(freqRaw);
      if (f && f !== freq) {
        warnings.push(`Regel ${lineNo}: frequentie "${freqRaw}" past niet bij dit upload-veld (${freq}), overgeslagen.`);
        skipped++; return;
      }
    }
    const datum = normalizeDate(get(r, map, "datum"));
    const door = get(r, map, "uitgevoerd door", "door", "naam");
    const taakLabel = get(r, map, "taak");
    const task = findTask(freq, taakLabel);
    if (!task) {
      warnings.push(`Regel ${lineNo}: taak "${taakLabel}" niet bekend bij ${freq}, overgeslagen.`);
      skipped++; return;
    }
    if (!datum) { warnings.push(`Regel ${lineNo}: datum ontbreekt, overgeslagen.`); skipped++; return; }

    const checked = parseChecked(get(r, map, "afgevinkt", "checked"));
    const tijdstip = get(r, map, "tijdstip", "tijd");
    const note = get(r, map, "opmerking", "opmerkingen", "note");

    const key = `${datum}|${door}`;
    let acc = groups.get(key);
    if (!acc) { acc = { datum, door, rowsByTask: new Map() }; groups.set(key, acc); }
    if (acc.rowsByTask.has(task)) {
      warnings.push(`Regel ${lineNo}: dubbele invoer voor taak "${task}" in rapport ${datum} — vorige waarden overschreven.`);
    }
    acc.rowsByTask.set(task, { task, checked, tijdstip, handtekening: "", note });
  });

  const reports: CleanReport[] = [];
  groups.forEach(acc => {
    const out: CleanRow[] = CLEANING_TASKS[freq].map(task => {
      const existing = acc.rowsByTask.get(task);
      if (existing) return existing;
      return { task, checked: false, tijdstip: "", handtekening: "", note: "" };
    });
    const overallStatus: Status = out.every(r => r.checked) ? "ok" : "warn";
    reports.push({
      id: uid(),
      freq,
      datum: acc.datum,
      door: acc.door,
      time: nowTime(),
      rows: out,
      overallStatus,
      type: "cleaning",
    });
  });

  return { reports, rowsRead: dataRows.length, rowsSkipped: skipped, warnings };
}

/* ────────── Templates (download as CSV) ────────── */

function todayDateNL(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function downloadCsvText(filename: string, rows: string[][]): void {
  const csv = rows.map(r => r.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const a = document.createElement("a");
  a.href = "data:text/csv;charset=utf-8,\uFEFF" + encodeURIComponent(csv);
  a.download = filename;
  a.click();
}

export function downloadTempTemplate(): void {
  const headers = ["Week", "Datum opgeslagen", "Paraaf", "Object", "Type", "1e meting", "2e meting", "3e meting", "Maatregel"];
  const rows: string[][] = [headers];
  const exampleWeek = "Week 1 – 2026";
  const exampleDate = todayDateNL();
  OBJECTS.forEach(o => rows.push([exampleWeek, exampleDate, "", o.label, o.type, "", "", "", ""]));
  downloadCsvText("haccp_template_temperatuur.csv", rows);
}

export function downloadCleanTemplate(): void {
  const headers = ["Frequentie", "Datum", "Uitgevoerd door", "Taak", "Afgevinkt", "Tijdstip", "Opmerking"];
  const rows: string[][] = [headers];
  const exampleDate = todayDateNL();
  (Object.keys(CLEANING_TASKS) as Array<keyof typeof CLEANING_TASKS>).forEach(freq => {
    CLEANING_TASKS[freq].forEach(task => {
      rows.push([freq, exampleDate, "", task, "Gedaan", "", ""]);
    });
  });
  downloadCsvText("haccp_template_reiniging.csv", rows);
}

export function downloadCleanTemplateForFreq(freq: "dagelijks" | "wekelijks" | "maandelijks"): void {
  const headers = ["Datum", "Uitgevoerd door", "Taak", "Afgevinkt", "Tijdstip", "Opmerking"];
  const rows: string[][] = [headers];
  const exampleDate = todayDateNL();
  CLEANING_TASKS[freq].forEach(task => {
    rows.push([exampleDate, "", task, "Gedaan", "", ""]);
  });
  downloadCsvText(`haccp_template_reiniging_${freq}.csv`, rows);
}
