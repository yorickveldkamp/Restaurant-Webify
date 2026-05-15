import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { TempReport, CleanReport, statusLabel } from "./data";

function makePDF(title: string, sections: Array<{
  title: string;
  subtitle?: string;
  headers: string[];
  rows: string[][];
}>): jsPDF {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const dateStr = new Date().toLocaleDateString("nl-BE", { day: "numeric", month: "long", year: "numeric" });
  const W = doc.internal.pageSize.getWidth();

  doc.setFillColor(30, 30, 30);
  doc.rect(0, 0, W, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("HACCP Registratie", 14, 12);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(title, 14, 19);
  doc.text(dateStr, W - 14, 19, { align: "right" });

  let y = 36;
  sections.forEach((sec) => {
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    doc.text(sec.title, 14, y);
    if (sec.subtitle) {
      y += 5;
      doc.setFontSize(9);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(100, 100, 100);
      doc.text(sec.subtitle, 14, y, { maxWidth: W - 28 });
    }
    y += 6;
    if (!sec.rows?.length) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(120, 120, 120);
      doc.text("Geen registraties", 14, y);
      y += 10;
      return;
    }
    autoTable(doc, {
      head: [sec.headers],
      body: sec.rows,
      startY: y,
      margin: { left: 14, right: 14 },
      styles: { fontSize: 8, cellPadding: 2.5, overflow: "linebreak" },
      headStyles: { fillColor: [30, 30, 30], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [245, 245, 242] },
      didParseCell: (d) => {
        if (d.section === "body") {
          const v = String(d.cell.raw || "");
          if (v === "NOK" || v === "Open") {
            d.cell.styles.textColor = [163, 45, 45];
            d.cell.styles.fontStyle = "bold";
          } else if (v === "Let op") {
            d.cell.styles.textColor = [133, 79, 11];
          } else if (v === "OK" || v === "Gedaan") {
            d.cell.styles.textColor = [59, 109, 17];
          }
        }
      },
    });
    // @ts-expect-error lastAutoTable is added by jspdf-autotable
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 14;
  });

  const pages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`HACCP – ${dateStr} – pagina ${i}/${pages}`, W / 2, 290, { align: "center" });
  }
  return doc;
}

export function downloadTempReport(r: TempReport): void {
  const sec = {
    title: `Temperatuurrapport – ${r.week}`,
    subtitle: `Opgeslagen: ${r.date} om ${r.time}  |  Paraaf: ${r.paraaf || "—"}  |  Koeling max 7,0°C  |  Diepvries max -18,0°C`,
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
    subtitle: `Uitgevoerd door: ${r.door || "—"}  |  Opgeslagen om ${r.time}`,
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

  // Cover header
  doc.setFillColor(30, 30, 30);
  doc.rect(0, 0, W, 38, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("HACCP Maandoverzicht", 14, 14);
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1), 14, 23);
  doc.setFontSize(9);
  doc.setTextColor(200, 200, 200);
  doc.text(`Gegenereerd op ${printDate}`, 14, 31);

  // Summary block
  let y = 48;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text("Samenvatting", 14, y);
  y += 6;
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
    margin: { left: 14, right: 14 },
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [30, 30, 30], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 245, 242] },
  });
  // @ts-expect-error lastAutoTable is added by jspdf-autotable
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 14;

  // Temperature sections
  if (filteredTemp.length === 0) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    doc.text("Temperatuurmetingen", 14, y);
    y += 6;
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(120, 120, 120);
    doc.text("Geen temperatuurrapporten opgeslagen voor deze maand.", 14, y);
    y += 12;
  } else {
    filteredTemp.forEach((r) => {
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 30, 30);
      doc.text(`Temperatuur – ${r.week}`, 14, y);
      y += 5;
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(100, 100, 100);
      doc.text(`Opgeslagen: ${r.date} om ${r.time}  |  Paraaf: ${r.paraaf || "—"}`, 14, y);
      y += 5;
      autoTable(doc, {
        head: [["Object", "Type", "1e", "2e", "3e", "Gem.", "Status", "Maatregel"]],
        body: r.rows.map((row) => [
          row.object, row.type, row.m1 || "—", row.m2 || "—", row.m3 || "—",
          row.avg ? row.avg + "°C" : "—", statusLabel(row.status), row.maatregel || "",
        ]),
        startY: y,
        margin: { left: 14, right: 14 },
        styles: { fontSize: 7.5, cellPadding: 2 },
        headStyles: { fillColor: [60, 60, 60], textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [248, 248, 246] },
        didParseCell: (d) => {
          if (d.section === "body") {
            const v = String(d.cell.raw || "");
            if (v === "NOK") { d.cell.styles.textColor = [163, 45, 45]; d.cell.styles.fontStyle = "bold"; }
            else if (v === "Let op") { d.cell.styles.textColor = [133, 79, 11]; }
            else if (v === "OK") { d.cell.styles.textColor = [59, 109, 17]; }
          }
        },
      });
      // @ts-expect-error lastAutoTable is added by jspdf-autotable
      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
    });
  }

  // Cleaning sections
  if (filteredClean.length === 0) {
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    doc.text("Reinigingsrapporten", 14, y);
    y += 6;
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(120, 120, 120);
    doc.text("Geen reinigingsrapporten opgeslagen voor deze maand.", 14, y);
  } else {
    filteredClean.forEach((r) => {
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 30, 30);
      doc.text(`Reiniging – ${r.freq.charAt(0).toUpperCase() + r.freq.slice(1)} – ${r.datum}`, 14, y);
      y += 5;
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(100, 100, 100);
      doc.text(`Uitgevoerd door: ${r.door || "—"}  |  Opgeslagen om ${r.time}`, 14, y);
      y += 5;
      autoTable(doc, {
        head: [["Taak", "Afgevinkt", "Tijdstip", "Opmerking"]],
        body: r.rows.map((row) => [
          row.task, row.checked ? "Gedaan" : "Open", row.tijdstip || "—", row.note || "",
        ]),
        startY: y,
        margin: { left: 14, right: 14 },
        styles: { fontSize: 7.5, cellPadding: 2, overflow: "linebreak" },
        headStyles: { fillColor: [60, 60, 60], textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [248, 248, 246] },
        didParseCell: (d) => {
          if (d.section === "body") {
            const v = String(d.cell.raw || "");
            if (v === "Open") { d.cell.styles.textColor = [163, 45, 45]; d.cell.styles.fontStyle = "bold"; }
            else if (v === "Gedaan") { d.cell.styles.textColor = [59, 109, 17]; }
          }
        },
      });
      // @ts-expect-error lastAutoTable is added by jspdf-autotable
      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
    });
  }

  // Page numbers
  const pages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`HACCP Maandoverzicht ${monthLabel} – pagina ${i}/${pages}`, W / 2, 290, { align: "center" });
  }

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
