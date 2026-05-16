import { useState, useMemo, useEffect, useRef } from "react";

const ALLERGENS = [
  { key: "gluten",   label: "Gluten",       icon: "🌾" },
  { key: "ei",       label: "Eieren",       icon: "🥚" },
  { key: "melk",     label: "Melk",         icon: "🥛" },
  { key: "vis",      label: "Vis",          icon: "🐟" },
  { key: "schaal",   label: "Schaaldieren", icon: "🦐" },
  { key: "noten",    label: "Noten",        icon: "🌰" },
  { key: "selderij", label: "Selderij",     icon: "🌿" },
  { key: "mosterd",  label: "Mosterd",      icon: "🟡" },
  { key: "sesam",    label: "Sesam",        icon: "⚪" },
  { key: "sulfiet",  label: "Sulfiet/SO₂",  icon: "🍷" },
  { key: "soja",     label: "Soja",         icon: "🫘" },
  { key: "pinda",    label: "Pinda's",      icon: "🥜" },
  { key: "lupine",   label: "Lupine",       icon: "🌸" },
  { key: "week",     label: "Weekdieren",   icon: "🐚" },
] as const;

type AllergenKey = typeof ALLERGENS[number]["key"];
type Val = "" | "y" | "m";

interface Dish { name: string; price: string; cat: string; a: Val[]; }

const STORAGE_KEY = "haccp:allergenen-matrix";
const PASSWORD = "Keukendrahtesel";

function row(...vals: (Val | undefined)[]): Val[] {
  return Array.from({ length: 14 }, (_, i) => vals[i] ?? "") as Val[];
}

const DEFAULT_DISHES: Dish[] = [
  // VORSPEISEN
  { name: "Knoblauchbrot",            price: "€5",  cat: "VORSPEISEN",   a: row("y","","y") },
  { name: "Bruschetta",               price: "€8",  cat: "VORSPEISEN",   a: row("y") },
  { name: "Burrata",                  price: "€10", cat: "VORSPEISEN",   a: row("y","","y","","","y") },
  { name: "Brotkorb",                 price: "€12", cat: "VORSPEISEN",   a: row("y","m","y") },
  { name: "Garnelen",                 price: "€12", cat: "VORSPEISEN",   a: row("","","","","y") },
  { name: "Carpaccio vom Rind",       price: "€14", cat: "VORSPEISEN",   a: row("","y","y","","","y","","m") },
  { name: "Überraschung Vorspeisen",  price: "€19", cat: "VORSPEISEN",   a: row("m") },
  // SUPPEN
  { name: "Tomatensuppe",             price: "€6",  cat: "SUPPEN",       a: row("","","y") },
  { name: "Fritattensuppe",           price: "€6",  cat: "SUPPEN",       a: row("y","y","","","","","m") },
  // SALATE
  { name: "Salat Pfirsich & Burrata",         price: "€15", cat: "SALATE", a: row("","","y","","","y","","","","m") },
  { name: "Salat Falafel & Gemüse (Vegan)",   price: "€15", cat: "SALATE", a: row("m","","","","","","m") },
  { name: "Salat Ziegenkäse, Birne & Feigen", price: "€15", cat: "SALATE", a: row("","","y","","","y") },
  { name: "Salat Brie",                       price: "€15", cat: "SALATE", a: row("","","y","","","y") },
  { name: "Salat Falafel & Tzatziki",         price: "€15", cat: "SALATE", a: row("m","","y","","","","m") },
  // PASTA
  { name: "Tagliatelle Aglio e Olio",       price: "€15", cat: "PASTA", a: row("y","y","y") },
  { name: "Tagliatelle Pesto",              price: "€17", cat: "PASTA", a: row("y","y","y","","","y") },
  { name: "Orzo Spinat, Chorizo & Burrata", price: "€18", cat: "PASTA", a: row("y","y","y","","","y") },
  // FISCH
  { name: "Lachs mit Wallnusskruste", price: "€23", cat: "FISCH", a: row("","","y","y","","y") },
  { name: "Lachs mit Garnelen",       price: "€26", cat: "FISCH", a: row("","","","y","y") },
  // VEGETARISCH
  { name: "Flatbread Falafel & Tzatziki", price: "€16", cat: "VEGETARISCH", a: row("y","","y","","","","","","m") },
  { name: "Kasnocken",                    price: "€16", cat: "VEGETARISCH", a: row("y","y","y") },
  { name: "Veganer Burger",               price: "€18", cat: "VEGETARISCH", a: row("y","","","","","","","","","","m","","m") },
  { name: "Käsefondue",                   price: "€25", cat: "VEGETARISCH", a: row("y","","y","","","","","","","y") },
  // FLEISCH
  { name: "Wiener Schnitzel",          price: "€18", cat: "FLEISCH", a: row("y","y") },
  { name: "Cordon Bleu",               price: "€20", cat: "FLEISCH", a: row("y","y","y") },
  { name: "Mühlbacher Schnitzel",      price: "€24", cat: "FLEISCH", a: row("y","y","y") },
  { name: "Pulled Chicken Burger",     price: "€21", cat: "FLEISCH", a: row("y") },
  { name: "Hühnerspies Tzatziki",      price: "€23", cat: "FLEISCH", a: row("","","y") },
  { name: "Rumpsteak Chimichurri",     price: "€29", cat: "FLEISCH", a: row("","","","","","","m") },
  { name: "Spare Ribs",                price: "€23", cat: "FLEISCH", a: row("","","","","","","","","","m") },
  { name: "Drahtesel Mix",             price: "€29", cat: "FLEISCH", a: row("y","y","","","","","","","","m") },
  { name: "Jagapfandl",                price: "€21", cat: "FLEISCH", a: row("y","y","y","","","","m") },
  { name: "Schnitzel Teller",          price: "€29", cat: "FLEISCH", a: row("y","y","y") },
  // DESSERT
  { name: "Tiramisu mit Lemon Curd",      price: "€11", cat: "DESSERT", a: row("y","y","y","","","","","","","m") },
  { name: "Schokolade Cake",              price: "€9",  cat: "DESSERT", a: row("y","y","y","","","","","","","","m") },
  { name: "Zuckerwaffel mit Erdbeeren",   price: "€11", cat: "DESSERT", a: row("y","y","y") },
  { name: "Hausgemachter Kaiserschmarrn", price: "€14", cat: "DESSERT", a: row("y","y","y") },
  // EISCOUPES
  { name: "Karamelbecher",   price: "€8", cat: "EISCOUPES", a: row("","","y","","","y") },
  { name: "Heisse Liebe",    price: "€9", cat: "EISCOUPES", a: row("","","y") },
  { name: "Coupe Danmark",   price: "€8", cat: "EISCOUPES", a: row("","","y") },
  { name: "Zitroneneis",     price: "€8", cat: "EISCOUPES", a: row("","","y") },
  { name: "Joghurt Amarena", price: "€8", cat: "EISCOUPES", a: row("","","y") },
];

function loadDishes(): Dish[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored) as Dish[];
  } catch { /* ignore */ }
  return DEFAULT_DISHES.map(d => ({ ...d, a: [...d.a] as Val[] }));
}

function saveDishes(dishes: Dish[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(dishes)); } catch { /* ignore */ }
}

function nextVal(v: Val): Val {
  if (v === "") return "y";
  if (v === "y") return "m";
  return "";
}

function ValCell({ val, editMode, onClick }: { val: Val; editMode: boolean; onClick?: () => void }) {
  if (editMode) {
    return (
      <td
        onClick={onClick}
        title="Klik om te wisselen: leeg → ✓ → (✓) → leeg"
        style={{
          textAlign: "center", cursor: "pointer", userSelect: "none",
          background: val === "y" ? "#fdecea" : val === "m" ? "#fef9e7" : "transparent",
          transition: "background 0.1s",
          outline: "1px dashed var(--border)",
        }}
      >
        {val === "y" && <span style={{ color: "#a83232", fontWeight: 700, fontSize: 13 }}>✓</span>}
        {val === "m" && <span style={{ color: "#8a6800", fontWeight: 600, fontSize: 12 }}>(✓)</span>}
        {val === "" && <span style={{ color: "#ccc", fontSize: 11 }}>—</span>}
      </td>
    );
  }
  if (val === "y") return <td style={{ textAlign: "center", background: "#fdecea", color: "#a83232", fontWeight: 700, fontSize: 13 }}>✓</td>;
  if (val === "m") return <td style={{ textAlign: "center", background: "#fef9e7", color: "#8a6800", fontWeight: 600, fontSize: 12 }}>(✓)</td>;
  return <td style={{ textAlign: "center", color: "var(--beige)" }}>—</td>;
}

function PasswordModal({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 50); }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pw === PASSWORD) { onSuccess(); }
    else { setErr(true); setPw(""); setTimeout(() => setErr(false), 1800); }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(26,26,26,0.45)", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div className="card" style={{ padding: "32px 36px", width: 340, maxWidth: "90vw" }}>
        <div className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: "var(--text-muted)" }}>
          Beheertoegang vereist
        </div>
        <p className="text-sm mb-5" style={{ color: "var(--text)", lineHeight: 1.55 }}>
          Voer het beheerwachtwoord in om de allergenenmatrix te bewerken.
        </p>
        <form onSubmit={submit} className="space-y-4">
          <input
            ref={inputRef}
            type="password"
            className="input-brand w-full"
            placeholder="Wachtwoord…"
            value={pw}
            onChange={e => setPw(e.target.value)}
            style={{ borderColor: err ? "var(--danger)" : undefined }}
          />
          {err && <p style={{ color: "var(--danger)", fontSize: 12, marginTop: -8 }}>Onjuist wachtwoord. Probeer opnieuw.</p>}
          <div className="flex gap-3 pt-1">
            <button type="submit" className="btn-primary" style={{ flex: 1 }}>Bevestigen</button>
            <button type="button" onClick={onCancel} className="btn-secondary" style={{ flex: 1 }}>Annuleren</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function Allergenen() {
  const [dishes, setDishes] = useState<Dish[]>(loadDishes);
  const [excludeAllergens, setExcludeAllergens] = useState<Set<AllergenKey>>(new Set());
  const [editMode, setEditMode] = useState(false);
  const [showPwModal, setShowPwModal] = useState(false);
  const [saveFlash, setSaveFlash] = useState(false);

  const toggleExclude = (key: AllergenKey) => {
    if (editMode) return;
    setExcludeAllergens(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const toggleCell = (dishIdx: number, allergenIdx: number) => {
    setDishes(prev => {
      const next = prev.map(d => ({ ...d, a: [...d.a] as Val[] }));
      next[dishIdx].a[allergenIdx] = nextVal(next[dishIdx].a[allergenIdx]);
      saveDishes(next);
      return next;
    });
    setSaveFlash(true);
    setTimeout(() => setSaveFlash(false), 1200);
  };

  const handleEditClick = () => {
    if (editMode) { setEditMode(false); return; }
    setShowPwModal(true);
  };

  const filtered = useMemo(() => {
    if (editMode) return dishes.map((d, i) => ({ ...d, _idx: i }));
    return dishes
      .map((d, i) => ({ ...d, _idx: i }))
      .filter(dish => {
        for (const key of excludeAllergens) {
          const idx = ALLERGENS.findIndex(a => a.key === key);
          if (dish.a[idx] !== "") return false;
        }
        return true;
      });
  }, [excludeAllergens, editMode, dishes]);

  return (
    <div>
      {showPwModal && (
        <PasswordModal
          onSuccess={() => { setShowPwModal(false); setEditMode(true); setExcludeAllergens(new Set()); }}
          onCancel={() => setShowPwModal(false)}
        />
      )}

      {/* Print button */}
      <div className="no-print flex justify-between items-center mb-4">
        {editMode ? (
          <div className="flex items-center gap-3">
            <span style={{ fontSize: 12, color: "var(--sage-dark)", fontWeight: 600 }}>
              ✏️ Bewerkingsmodus actief — klik een cel om te wisselen
            </span>
            {saveFlash && <span style={{ fontSize: 12, color: "var(--sage-dark)" }}>✓ Opgeslagen</span>}
          </div>
        ) : <div />}
        <button onClick={() => window.print()} className="btn-secondary" style={{ minWidth: 160 }}>
          Afdrukken / PDF
        </button>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        {/* Header card */}
        <div className="card" style={{ padding: "28px 32px", marginBottom: 16 }}>
          <div style={{ borderBottom: "3px solid var(--sage)", paddingBottom: 16, marginBottom: 20 }}>
            <div className="text-xs font-semibold tracking-widest uppercase mb-1" style={{ color: "var(--text-muted)" }}>Allergeneninformatie</div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", margin: "0 0 8px" }}>
              Allergenenmatrix — Der Drahtesel
            </h1>
            <p style={{ fontSize: 13.5, color: "var(--text)", lineHeight: 1.65, margin: 0 }}>
              Conform EU-Verordening Nr. 1169/2011 zijn wij verplicht de 14 belangrijkste allergenen te vermelden. Neem bij twijfel altijd contact op met ons personeel. Kruisbesmetting in de keuken kan niet volledig worden uitgesloten.
            </p>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {ALLERGENS.map(a => (
              <div key={a.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, minWidth: 56 }}>
                <span style={{ fontSize: 22 }}>{a.icon}</span>
                <span style={{ fontSize: 9.5, fontWeight: 600, color: "var(--text-muted)", textAlign: "center", lineHeight: 1.2 }}>{a.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Edit mode banner */}
        {editMode && (
          <div className="no-print" style={{ marginBottom: 12, padding: "12px 18px", background: "#fef9e7", border: "1px solid #f5e079", borderRadius: 8, fontSize: 13, color: "#5a4800", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 18 }}>✏️</span>
            <span><strong>Bewerkingsmodus:</strong> klik op een cel om te wisselen tussen <strong>leeg → ✓ → (✓) → leeg</strong>. Wijzigingen worden automatisch opgeslagen.</span>
          </div>
        )}

        {/* Results count */}
        {!editMode && (
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8, paddingLeft: 4 }}>
            {filtered.length} gerecht{filtered.length !== 1 ? "en" : ""} weergegeven
          </div>
        )}

        {/* Matrix table */}
        <div className="card" style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 900 }}>
            <thead>
              <tr style={{ background: "var(--sage)" }}>
                <th style={{ textAlign: "left", padding: "8px 12px", color: "white", fontWeight: 600, minWidth: 180, position: "sticky", left: 0, background: "var(--sage)" }}>Gerecht</th>
                <th style={{ textAlign: "left", padding: "8px 10px", color: "white", fontWeight: 600, whiteSpace: "nowrap" }}>Prijs</th>
                {ALLERGENS.map(a => (
                  <th key={a.key} style={{ padding: "6px 6px", color: "white", fontWeight: 600, textAlign: "center", minWidth: 52 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                      <span style={{ fontSize: 14 }}>{a.icon}</span>
                      <span style={{ fontSize: 8.5, whiteSpace: "nowrap" }}>{a.label}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={16} style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)", fontStyle: "italic" }}>
                    Geen gerechten gevonden voor de geselecteerde filters.
                  </td>
                </tr>
              ) : (() => {
                const result: React.ReactNode[] = [];
                let lastCat = "";
                filtered.forEach((dish, rowI) => {
                  if (dish.cat !== lastCat) {
                    lastCat = dish.cat;
                    result.push(
                      <tr key={`cat-${dish.cat}-${rowI}`}>
                        <td colSpan={16} style={{ padding: "8px 12px", background: "var(--beige-light)", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", borderTop: result.length ? "1px solid var(--border)" : "none" }}>
                          {dish.cat === "VEGETARISCH" ? "Vegetarisch & Vegan" : dish.cat.charAt(0) + dish.cat.slice(1).toLowerCase()}
                        </td>
                      </tr>
                    );
                  }
                  const dishIdx = dish._idx;
                  result.push(
                    <tr key={dish.name} style={{ background: rowI % 2 === 0 ? "white" : "var(--beige-light)" }}>
                      <td style={{ padding: "7px 12px", fontWeight: 500, color: "var(--text)", position: "sticky", left: 0, background: "inherit", borderRight: "1px solid var(--border)" }}>{dish.name}</td>
                      <td style={{ padding: "7px 10px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>{dish.price}</td>
                      {dish.a.map((v, ai) => (
                        <ValCell
                          key={ai}
                          val={v}
                          editMode={editMode}
                          onClick={editMode ? () => toggleCell(dishIdx, ai) : undefined}
                        />
                      ))}
                    </tr>
                  );
                });
                return result;
              })()}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="card" style={{ padding: "14px 20px", marginTop: 12, display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Legenda:</span>
          <span style={{ background: "#fdecea", color: "#a83232", fontWeight: 700, padding: "2px 10px", borderRadius: 4, fontSize: 12 }}>✓ bevat dit allergeen</span>
          <span style={{ background: "#fef9e7", color: "#8a6800", fontWeight: 600, padding: "2px 10px", borderRadius: 4, fontSize: 12 }}>(✓) mogelijk aanwezig</span>
          <span style={{ background: "white", color: "var(--text-muted)", padding: "2px 10px", border: "1px solid var(--border)", borderRadius: 4, fontSize: 12 }}>— niet aanwezig</span>
        </div>

        {/* Edit button */}
        <div className="no-print" style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={handleEditClick}
            className={editMode ? "btn-primary" : "btn-secondary"}
            style={{ fontSize: 12, padding: "8px 20px", minWidth: 140 }}
          >
            {editMode ? "✓ Bewerken afsluiten" : "🔒 Bewerken"}
          </button>
        </div>

      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          table th, table td { font-size: 9px !important; padding: 4px 5px !important; }
          table th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          table td[style*="fdecea"] { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          table td[style*="fef9e7"] { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </div>
  );
}
