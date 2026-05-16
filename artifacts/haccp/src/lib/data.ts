export interface TempObject {
  id: string;
  label: string;
  type: "koeling" | "diepvries";
}

export const OBJECTS: TempObject[] = [
  { id: "kuhlhaus", label: "Kühlhaus", type: "koeling" },
  { id: "koeling_vlees", label: "Koelinglade vlees", type: "koeling" },
  { id: "koeling_vis", label: "Koelinglade vis", type: "koeling" },
  { id: "koeling_overig1", label: "Koeling overig 1", type: "koeling" },
  { id: "koeling_kaas", label: "Koeling kaas & vlees", type: "koeling" },
  { id: "koeling_tapenades", label: "Koelinglade tapenades", type: "koeling" },
  { id: "koeling_overig2", label: "Koelinglade overig 2", type: "koeling" },
  { id: "koeling_frisdranken", label: "Koelinglade frisdranken", type: "koeling" },
  { id: "diepvries_klein", label: "Diepvries keuken klein", type: "diepvries" },
  { id: "diepvries1", label: "Diepvries 1", type: "diepvries" },
  { id: "diepvries2", label: "Diepvries 2", type: "diepvries" },
  { id: "diepvries3", label: "Diepvries 3", type: "diepvries" },
  { id: "diepvries4", label: "Diepvries 4 (beneden)", type: "diepvries" },
  { id: "diepvries5", label: "Diepvries 5 (beneden)", type: "diepvries" },
];

export const CLEANING_TASKS: Record<string, string[]> = {
  dagelijks: [
    "Werkbladen en snijplanken reinigen en desinfecteren",
    "Kookapparatuur (fornuis, oven, grill) schoonmaken",
    "Vloeren schrobben",
    "Koelkasten controleren en morsen verwijderen",
    "Afvalbakken legen en reinigen",
    "Handwasbakjes schoonmaken en bijvullen (zeep, papier)",
    "Vaatwas station schoonmaken en alle vaatwas wegruimen",
  ],
  wekelijks: [
    "Koel- en vriescellen volledig reinigen en desinfecteren",
    "Afzuigkap en filters reinigen",
    "Muren en deuren afnemen",
    "Achter en onder apparatuur schoonmaken",
    "Magazijn en opslagruimte opruimen en reinigen",
  ],
  maandelijks: [
    "Plafond, lampen en ventilatieroosters reinigen",
    "Waterafvoeren en sifons doorspoelen",
    "Controle op ongedierte en sporen",
    "Kleine onderhoudsreparaties uitvoeren",
  ],
};

export type Status = "ok" | "warn" | "nok" | null;

export interface TempRow {
  object: string;
  type: "koeling" | "diepvries";
  m1: string;
  m2: string;
  m3: string;
  avg: string;
  status: Status;
  maatregel: string;
}

export interface TempReport {
  id: string;
  week: string;
  paraaf: string;
  date: string;
  time: string;
  rows: TempRow[];
  overallStatus: Status;
  type: "temp";
}

export interface CleanRow {
  task: string;
  checked: boolean;
  tijdstip: string;
  handtekening: string;
  note: string;
}

export interface CleanReport {
  id: string;
  freq: string;
  datum: string;
  door: string;
  time: string;
  rows: CleanRow[];
  overallStatus: Status;
  type: "cleaning";
}

export function statusForTemp(val: string, type: "koeling" | "diepvries"): Status {
  if (val === "" || isNaN(Number(val))) return null;
  const v = parseFloat(val);
  if (type === "koeling") return v <= 7.0 ? "ok" : v <= 10 ? "warn" : "nok";
  if (type === "diepvries") return v <= -18.0 ? "ok" : v >= -21 ? "warn" : "nok";
  return "ok";
}

export function worstStatus(arr: Status[]): Status {
  if (arr.includes("nok")) return "nok";
  if (arr.includes("warn")) return "warn";
  if (arr.includes("ok")) return "ok";
  return null;
}

export function statusLabel(s: Status): string {
  if (s === "ok") return "OK";
  if (s === "warn") return "Let op";
  if (s === "nok") return "NOK";
  return "—";
}

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function todayDate(): string {
  return new Date().toLocaleDateString("nl-BE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function todayFull(): string {
  return new Date().toLocaleDateString("nl-BE", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export function nowTime(): string {
  return new Date().toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });
}

export const SUPPLIERS = ["Sinnesberger", "Bachmann", "Rumpold", "Overig"] as const;
export type SupplierOption = typeof SUPPLIERS[number];

export interface DeliveryReport {
  id: string;
  date: string;
  time: string;
  supplier: string;
  productType: "koeling" | "diepvries";
  temperature: string;
  visualCheck: "pass" | "fail";
  visualNote: string;
  bbdCheck: "pass" | "fail";
  employee: string;
  rejected: "yes" | "no";
  overallStatus: Status;
  type: "delivery";
}

export function tempLimitForDelivery(type: "koeling" | "diepvries"): number {
  return type === "koeling" ? 7 : -15;
}

export function deliveryStatus(r: Pick<DeliveryReport, "rejected" | "visualCheck" | "bbdCheck">): Status {
  if (r.rejected === "yes" || r.visualCheck === "fail" || r.bbdCheck === "fail") return "nok";
  return "ok";
}

export const HYGIENE_CHECKS = [
  "Handen gewassen en gedesinfecteerd",
  "Schone werkkleding aan",
  "Haar opgebonden of haarnetje gedragen",
  "Geen sieraden (ringen, armbanden, oorringen)",
  "Nagels kort en schoon, geen nagellak",
  "Geen zichtbare wonden of infecties aan handen",
  "Geen tekenen van ziekte (koorts, diarree, braken)",
  "Persoonlijke hygiënetraining up-to-date",
] as const;

export interface EmployeeHygiene {
  name: string;
  role: string;
  checks: boolean[];
  status: "pending" | "approved" | "rejected";
  rejectedReason: string;
  approvedAt?: string;
  approvedBy?: string;
}

export interface HygieneReport {
  id: string;
  date: string;
  shift: string;
  savedAt: string;
  savedBy: string;
  employees: EmployeeHygiene[];
  type: "hygiene";
}

export interface Employee {
  name: string;
  role: string;
}
