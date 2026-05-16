import { useState, useEffect } from "react";
import {
  DeliveryReport, SUPPLIERS, todayDate, nowTime, uid,
  tempLimitForDelivery, deliveryStatus,
} from "../lib/data";

interface Props {
  onSave: (r: DeliveryReport) => Promise<void>;
  onToast: (msg: string) => void;
  autoFillEmployee: string;
}

const PASS_FAIL_BTN = (
  val: "pass" | "fail",
  cur: "pass" | "fail",
  set: (v: "pass" | "fail") => void
) => (
  <div className="flex rounded overflow-hidden" style={{ border: "1px solid var(--border)" }}>
    <button
      type="button"
      onClick={() => set("pass")}
      className="px-5 py-2 text-sm transition-all"
      style={{
        background: cur === "pass" ? "var(--sage)" : "transparent",
        color: cur === "pass" ? "white" : "var(--text-muted)",
        fontWeight: cur === "pass" ? 600 : 400,
        border: "none",
        cursor: "pointer",
        flex: 1,
      }}
    >
      Akkoord
    </button>
    <button
      type="button"
      onClick={() => set("fail")}
      className="px-5 py-2 text-sm transition-all"
      style={{
        background: cur === "fail" ? "var(--danger)" : "transparent",
        color: cur === "fail" ? "white" : "var(--text-muted)",
        fontWeight: cur === "fail" ? 600 : 400,
        border: "none",
        borderLeft: "1px solid var(--border)",
        cursor: "pointer",
        flex: 1,
      }}
    >
      Afgekeurd
    </button>
  </div>
);

export function Delivery({ onSave, onToast, autoFillEmployee }: Props) {
  const [supplier, setSupplier] = useState<string>("Sinnesberger");
  const [customSupplier, setCustomSupplier] = useState("");
  const [productType, setProductType] = useState<"koeling" | "diepvries">("koeling");
  const [temperature, setTemperature] = useState("");
  const [visualCheck, setVisualCheck] = useState<"pass" | "fail">("pass");
  const [visualNote, setVisualNote] = useState("");
  const [bbdCheck, setBbdCheck] = useState<"pass" | "fail">("pass");
  const [employee, setEmployee] = useState(autoFillEmployee);
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (autoFillEmployee && !employee) setEmployee(autoFillEmployee); }, [autoFillEmployee]);

  const tempVal = parseFloat(temperature.replace(",", "."));
  const limit = tempLimitForDelivery(productType);
  const isRejectedByTemp = !isNaN(tempVal) && (
    productType === "koeling" ? tempVal > limit : tempVal > limit
  );

  const effectiveSupplier = supplier === "Overig" ? (customSupplier.trim() || "Overig") : supplier;

  const reset = () => {
    setSupplier("Sinnesberger");
    setCustomSupplier("");
    setProductType("koeling");
    setTemperature("");
    setVisualCheck("pass");
    setVisualNote("");
    setBbdCheck("pass");
    setEmployee(autoFillEmployee);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!temperature) { onToast("Vul de temperatuur in."); return; }
    if (!employee.trim()) { onToast("Vul je naam in."); return; }

    const rejected: "yes" | "no" = isRejectedByTemp ? "yes" : "no";
    const r: DeliveryReport = {
      id: uid(),
      date: todayDate(),
      time: nowTime(),
      supplier: effectiveSupplier,
      productType,
      temperature: tempVal.toString(),
      visualCheck,
      visualNote: visualCheck === "fail" ? visualNote : "",
      bbdCheck,
      employee: employee.trim(),
      rejected,
      overallStatus: deliveryStatus({ rejected, visualCheck, bbdCheck }),
      type: "delivery",
    };

    setBusy(true);
    try {
      await onSave(r);
      onToast("Levering geregistreerd");
      reset();
    } catch {
      onToast("Opslaan mislukt — probeer opnieuw");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Registration form */}
      <form onSubmit={handleSubmit} className="card overflow-hidden">
        <div className="px-5 py-3" style={{ borderBottom: "1px solid var(--border)", background: "var(--beige-light)" }}>
          <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>Nieuwe leveringscontrole</span>
        </div>
        <div className="px-5 py-5 space-y-5">

          {/* Supplier */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>Leverancier</label>
            <div className="flex flex-wrap gap-2">
              {SUPPLIERS.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSupplier(s)}
                  className="px-4 py-2 rounded text-sm transition-all"
                  style={{
                    background: supplier === s ? "var(--sage)" : "var(--beige-light)",
                    color: supplier === s ? "white" : "var(--text)",
                    border: supplier === s ? "1px solid var(--sage-dark)" : "1px solid var(--border)",
                    fontWeight: supplier === s ? 600 : 400,
                    cursor: "pointer",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
            {supplier === "Overig" && (
              <input
                type="text"
                className="input-brand mt-2 w-full"
                placeholder="Naam leverancier…"
                value={customSupplier}
                onChange={e => setCustomSupplier(e.target.value)}
              />
            )}
          </div>

          {/* Product type */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>Type product</label>
            <div className="flex rounded overflow-hidden" style={{ border: "1px solid var(--border)", width: "fit-content" }}>
              {(["koeling", "diepvries"] as const).map((t, i) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setProductType(t)}
                  className="px-5 py-2 text-sm transition-all"
                  style={{
                    background: productType === t ? "var(--sage)" : "transparent",
                    color: productType === t ? "white" : "var(--text-muted)",
                    fontWeight: productType === t ? 600 : 400,
                    border: "none",
                    borderLeft: i > 0 ? "1px solid var(--border)" : "none",
                    cursor: "pointer",
                  }}
                >
                  {t === "koeling" ? "Koeling" : "Diepvries"}
                </button>
              ))}
            </div>
          </div>

          {/* Temperature */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
              Leveringstemperatuur
              <span className="ml-2 font-normal normal-case" style={{ color: "var(--text-muted)" }}>
                (norm: {productType === "koeling" ? "≤ 7 °C" : "≤ −15 °C"})
              </span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                step="0.1"
                className="input-brand"
                style={{ width: 130 }}
                placeholder="bijv. 4.5"
                value={temperature}
                onChange={e => setTemperature(e.target.value)}
              />
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>°C</span>
              {!isNaN(tempVal) && (
                <span
                  className="text-xs font-semibold px-3 py-1 rounded"
                  style={{
                    background: isRejectedByTemp ? "#fdecea" : "#eef4ed",
                    color: isRejectedByTemp ? "var(--danger)" : "var(--sage-dark)",
                    border: `1px solid ${isRejectedByTemp ? "#f5c6c2" : "#c2d5be"}`,
                  }}
                >
                  {isRejectedByTemp ? "⚠ Afgekeurd" : "✓ Akkoord"}
                </span>
              )}
            </div>
            {isRejectedByTemp && (
              <div
                className="mt-3 rounded px-4 py-3 text-sm"
                style={{ background: "#fdecea", border: "1px solid #f5c6c2", color: "var(--danger)" }}
              >
                <strong>Automatische afkeuring:</strong> temperatuur van {temperature} °C overschrijdt de norm van {productType === "koeling" ? "7 °C" : "−15 °C"} voor {productType}. Levering wordt als afgekeurd geregistreerd.
              </div>
            )}
          </div>

          {/* Visual inspection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>Visuele inspectie</label>
            {PASS_FAIL_BTN("pass", visualCheck, setVisualCheck)}
            {visualCheck === "fail" && (
              <textarea
                className="input-brand mt-2 w-full"
                rows={2}
                placeholder="Beschrijf de afwijking…"
                value={visualNote}
                onChange={e => setVisualNote(e.target.value)}
                style={{ resize: "vertical" }}
              />
            )}
          </div>

          {/* BBD check */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>THT / houdbaarheidsdatum</label>
            {PASS_FAIL_BTN("pass", bbdCheck, setBbdCheck)}
          </div>

          {/* Employee */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>Gecontroleerd door</label>
            <input
              type="text"
              className="input-brand w-full"
              style={{ maxWidth: 280 }}
              placeholder="Naam…"
              value={employee}
              onChange={e => setEmployee(e.target.value)}
            />
          </div>

          {/* Submit */}
          <div className="pt-1">
            <button
              type="submit"
              disabled={busy}
              className="btn-primary"
              style={{ opacity: busy ? 0.6 : 1, minWidth: 180 }}
            >
              {busy ? "Opslaan…" : "Levering registreren"}
            </button>
          </div>
        </div>
      </form>

    </div>
  );
}
