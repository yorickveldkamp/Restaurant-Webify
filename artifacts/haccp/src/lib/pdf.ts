import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { TempReport, CleanReport, statusLabel } from "./data";

// House style palette (mirrors src/index.css)
const C = {
  sage:       [167, 182, 157] as [number, number, number],
  sageDark:   [143, 163, 131] as [number, number, number],
  beige:      [211, 200, 189] as [number, number, number],
  beigeLight: [237, 232, 227] as [number, number, number],
  text:       [ 26,  26,  26] as [number, number, number],
  textMuted:  [122, 114, 104] as [number, number, number],
  white:      [255, 255, 255] as [number, number, number],
  ok:         [ 95, 122,  76] as [number, number, number], // sage-dark deepened for legibility
  warn:       [133,  79,  11] as [number, number, number],
  nok:        [168,  50,  50] as [number, number, number],
};

function drawHeader(doc: jsPDF, title: string, subtitle: string, dateStr: string) {
  const W = doc.internal.pageSize.getWidth();
  // Beige base strip
  doc.setFillColor(...C.beigeLight);
  doc.rect(0, 0, W, 32, "F");
  // Sage accent bar at top
  doc.setFillColor(...C.sage);
  doc.rect(0, 0, W, 4, "F");

  doc.setTextColor(...C.text);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("HACCP Registratie", 14, 15);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...C.textMuted);
  doc.text(title, 14, 22);
  doc.text(dateStr, W - 14, 22, { align: "right" });

  if (subtitle) {
    doc.setFontSize(8.5);
    doc.text(subtitle, 14, 28, { maxWidth: W - 28 });
  }

  // Sage-dark hairline divider
  doc.setDrawColor(...C.sageDark);
  doc.setLineWidth(0.4);
  doc.line(14, 32, W - 14, 32);
}

function drawFooter(doc: jsPDF, label: string) {
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setDrawColor(...C.beige);
    doc.setLineWidth(0.3);
    doc.line(14, H - 12, W - 14, H - 12);
    doc.setFontSize(8);
    doc.setTextColor(...C.textMuted);
    doc.text(label, 14, H - 7);
    doc.text(`pagina ${i} / ${pages}`, W - 14, H - 7, { align: "right" });
  }
}

const baseTableOptions = {
  margin: { left: 14, right: 14 },
  styles: {
    fontSize: 8.5,
    cellPadding: 2.6,
    overflow: "linebreak" as const,
    textColor: C.text,
    lineColor: C.beige,
    lineWidth: 0.1,
  },
  headStyles: {
    fillColor: C.sage,
    textColor: C.text,
    fontStyle: "bold" as const,
    halign: "left" as const,
    lineColor: C.sageDark,
    lineWidth: 0.2,
  },
  alternateRowStyles: { fillColor: C.beigeLight },
  bodyStyles: { fillColor: C.white },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function colorizeStatusCell(d: any) {
  if (d.section !== "body") return;
  const v = String(d.cell.raw || "");
  if (v === "NOK" || v === "Open") {
    d.cell.styles.textColor = C.nok;
    d.cell.styles.fontStyle = "bold";
  } else if (v === "Let op") {
    d.cell.styles.textColor = C.warn;
    d.cell.styles.fontStyle = "bold";
  } else if (v === "OK" || v === "Gedaan") {
    d.cell.styles.textColor = C.ok;
  }
}

function makePDF(title: string, sections: Array<{
  title: string;
  subtitle?: string;
  headers: string[];
  rows: string[][];
}>): jsPDF {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const dateStr = new Date().toLocaleDateString("nl-BE", { day: "numeric", month: "long", year: "numeric" });
  drawHeader(doc, title, "", dateStr);

  let y = 42;
  sections.forEach((sec) => {
    if (y > 250) { doc.addPage(); y = 20; }
    // Section title with sage-dark accent bar
    doc.setFillColor(...C.sageDark);
    doc.rect(14, y - 4, 2.5, 6, "F");
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.text);
    doc.text(sec.title, 19, y);
    y += 4;
    if (sec.subtitle) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...C.textMuted);
      doc.text(sec.subtitle, 19, y + 2, { maxWidth: doc.internal.pageSize.getWidth() - 33 });
      y += 5;
    }
    y += 3;
    if (!sec.rows?.length) {
      doc.setFontSize(9.5);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(...C.textMuted);
      doc.text("Geen registraties", 19, y);
      y += 10;
      return;
    }
    autoTable(doc, {
      head: [sec.headers],
      body: sec.rows,
      startY: y,
      ...baseTableOptions,
      didParseCell: colorizeStatusCell,
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;
  });

  drawFooter(doc, `HACCP – ${title} – ${dateStr}`);
  return doc;
}

export function downloadTempReport(r: TempReport): void {
  const sec = {
    title: `Temperatuurrapport – ${r.week}`,
    subtitle: `Datum: ${r.date}  ·  Paraaf: ${r.paraaf || "—"}`,
    headers: ["Object", "Type", "1e meting", "2e meting", "3e meting", "Gemiddeld", "Status", "Maatregel"],
    rows: r.rows.map((row) => [
      row.object, row.type, row.m1 || "—", row.m2 || "—", row.m3 || "—",
      row.avg ? row.avg + "°C" : "—", statusLabel(row.status), row.maatregel || "",
    ]),
  };
  makePDF(`Temperatuurrapport – ${r.week}`, [sec]).save(
    "haccp_temp_" + r.week.replace(/\s/g, "_") + "_" + r.date.replace(/\//g, "-") + ".pdf"
  );
}

export function downloadCleanReport(r: CleanReport): void {
  const sec = {
    title: `Reinigingsrapport – ${r.freq} – ${r.datum}`,
    subtitle: `Uitgevoerd door: ${r.door || "—"}  ·  Opgeslagen om ${r.time}`,
    headers: ["Taak", "Afgevinkt", "Tijdstip", "Opmerking"],
    rows: r.rows.map((row) => [
      row.task, row.checked ? "Gedaan" : "Open", row.tijdstip || "—", row.note || "",
    ]),
  };
  makePDF(`Reinigingsrapport – ${r.freq} – ${r.datum}`, [sec]).save(
    "haccp_reiniging_" + r.freq + "_" + r.datum.replace(/\//g, "-") + ".pdf"
  );
}

/** Parse a Dutch date string "dd/mm/yyyy" → { month: 1-12, year: number } */
function parseDutchDate(dateStr: string): { month: number; year: number } | null {
  const parts = dateStr.split("/");
  if (parts.length !== 3) return null;
  return { month: parseInt(parts[1], 10), year: parseInt(parts[2], 10) };
}

export function downloadMonthlyOverview(
  month: number,
  year: number,
  tempReports: TempReport[],
  cleanReports: CleanReport[]
): void {
  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString("nl-BE", { month: "long", year: "numeric" });
  const monthLabelCap = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

  const filteredTemp = tempReports.filter((r) => {
    const d = parseDutchDate(r.date);
    return d && d.month === month && d.year === year;
  });

  const filteredClean = cleanReports.filter((r) => {
    const d = parseDutchDate(r.datum);
    return d && d.month === month && d.year === year;
  });

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const printDate = new Date().toLocaleDateString("nl-BE", { day: "numeric", month: "long", year: "numeric" });

  // Cover header (taller variant of the standard header)
  doc.setFillColor(...C.beigeLight);
  doc.rect(0, 0, W, 42, "F");
  doc.setFillColor(...C.sage);
  doc.rect(0, 0, W, 4, "F");
  doc.setTextColor(...C.text);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.text("HACCP Maandoverzicht", 14, 17);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(...C.text);
  doc.text(monthLabelCap, 14, 26);
  doc.setFontSize(9);
  doc.setTextColor(...C.textMuted);
  doc.text(`Gegenereerd op ${printDate}`, 14, 33);
  doc.setDrawColor(...C.sageDark);
  doc.setLineWidth(0.4);
  doc.line(14, 42, W - 14, 42);

  // Summary block
  let y = 52;
  doc.setFillColor(...C.sageDark);
  doc.rect(14, y - 4, 2.5, 6, "F");
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.text);
  doc.text("Samenvatting", 19, y);
  y += 4;
  autoTable(doc, {
    head: [["Type", "Aantal rapporten", "Opmerkingen"]],
    body: [
      [
        "Temperatuurmetingen",
        String(filteredTemp.length),
        filteredTemp.length === 0
          ? "Geen metingen deze maand"
          : `${filteredTemp.filter((r) => r.overallStatus === "nok").length} NOK, ${filteredTemp.filter((r) => r.overallStatus === "warn").length} let op`,
      ],
      [
        "Reinigingsrapporten",
        String(filteredClean.length),
        filteredClean.length === 0
          ? "Geen reinigingen deze maand"
          : `${filteredClean.filter((r) => r.overallStatus === "ok").length} volledig afgevinkt`,
      ],
    ],
    startY: y,
    ...baseTableOptions,
    styles: { ...baseTableOptions.styles, fontSize: 9 },
  });
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 14;

  const sectionHeader = (label: string) => {
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFillColor(...C.sageDark);
    doc.rect(14, y - 4, 2.5, 6, "F");
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.text);
    doc.text(label, 19, y);
    y += 4;
  };

  // Temperature sections
  sectionHeader("Temperatuurmetingen");
  if (filteredTemp.length === 0) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(...C.textMuted);
    doc.text("Geen temperatuurrapporten opgeslagen voor deze maand.", 19, y + 2);
    y += 12;
  } else {
    y += 2;
    filteredTemp.forEach((r) => {
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...C.text);
      doc.text(`Temperatuur – ${r.week}`, 19, y);
      y += 4;
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...C.textMuted);
      doc.text(`Datum: ${r.date}  ·  Paraaf: ${r.paraaf || "—"}`, 19, y);
      y += 3;
      autoTable(doc, {
        head: [["Object", "Type", "1e", "2e", "3e", "Gem.", "Status", "Maatregel"]],
        body: r.rows.map((row) => [
          row.object, row.type, row.m1 || "—", row.m2 || "—", row.m3 || "—",
          row.avg ? row.avg + "°C" : "—", statusLabel(row.status), row.maatregel || "",
        ]),
        startY: y,
        ...baseTableOptions,
        styles: { ...baseTableOptions.styles, fontSize: 7.8, cellPadding: 2.2 },
        didParseCell: colorizeStatusCell,
      });
      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 9;
    });
  }

  // Cleaning sections
  sectionHeader("Reinigingsrapporten");
  if (filteredClean.length === 0) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(...C.textMuted);
    doc.text("Geen reinigingsrapporten opgeslagen voor deze maand.", 19, y + 2);
  } else {
    y += 2;
    filteredClean.forEach((r) => {
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...C.text);
      doc.text(`Reiniging – ${r.freq.charAt(0).toUpperCase() + r.freq.slice(1)} – ${r.datum}`, 19, y);
      y += 4;
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...C.textMuted);
      doc.text(`Uitgevoerd door: ${r.door || "—"}`, 19, y);
      y += 3;
      autoTable(doc, {
        head: [["Taak", "Afgevinkt", "Tijdstip", "Opmerking"]],
        body: r.rows.map((row) => [
          row.task, row.checked ? "Gedaan" : "Open", row.tijdstip || "—", row.note || "",
        ]),
        startY: y,
        ...baseTableOptions,
        styles: { ...baseTableOptions.styles, fontSize: 7.8, cellPadding: 2.2 },
        didParseCell: colorizeStatusCell,
      });
      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 9;
    });
  }

  drawFooter(doc, `HACCP Maandoverzicht – ${monthLabelCap}`);

  const safeMonth = String(month).padStart(2, "0");
  doc.save(`haccp_maandoverzicht_${year}_${safeMonth}.pdf`);
}

export function downloadCSV(rows: string[][], filename: string): void {
  const csv = rows.map((r) => r.map((v) => `"${String(v || "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const a = document.createElement("a");
  a.href = "data:text/csv;charset=utf-8,\uFEFF" + encodeURIComponent(csv);
  a.download = filename + "_" + new Date().toISOString().slice(0, 10) + ".csv";
  a.click();
}

export function exportAllTempCSV(tempReports: TempReport[]): void {
  if (!tempReports.length) return;
  const rows: string[][] = [["Week", "Datum opgeslagen", "Paraaf", "Object", "Type", "1e meting", "2e meting", "3e meting", "Gemiddeld", "Status", "Maatregel"]];
  tempReports.forEach((r) =>
    r.rows.forEach((row) =>
      rows.push([r.week, r.date, r.paraaf || "", row.object, row.type, row.m1 || "", row.m2 || "", row.m3 || "", row.avg || "", statusLabel(row.status), row.maatregel || ""])
    )
  );
  downloadCSV(rows, "haccp_temperaturen_alle");
}

export function exportAllCleanCSV(cleanReports: CleanReport[]): void {
  if (!cleanReports.length) return;
  const rows: string[][] = [["Frequentie", "Datum", "Uitgevoerd door", "Taak", "Afgevinkt", "Tijdstip", "Opmerking"]];
  cleanReports.forEach((r) =>
    r.rows.forEach((row) =>
      rows.push([r.freq, r.datum, r.door || "", row.task, row.checked ? "Gedaan" : "Open", row.tijdstip || "", row.note || ""])
    )
  );
  downloadCSV(rows, "haccp_reiniging_alle");
}
