import { useState, useMemo } from "react";

const ALLERGENS = [
  { key: "gluten",    label: "Gluten",       icon: "🌾" },
  { key: "ei",        label: "Eieren",       icon: "🥚" },
  { key: "melk",      label: "Melk",         icon: "🥛" },
  { key: "vis",       label: "Vis",          icon: "🐟" },
  { key: "schaal",    label: "Schaaldieren", icon: "🦐" },
  { key: "noten",     label: "Noten",        icon: "🌰" },
  { key: "selderij",  label: "Selderij",     icon: "🌿" },
  { key: "mosterd",   label: "Mosterd",      icon: "🟡" },
  { key: "sesam",     label: "Sesam",        icon: "⚪" },
  { key: "sulfiet",   label: "Sulfiet/SO₂",  icon: "🍷" },
  { key: "soja",      label: "Soja",         icon: "🫘" },
  { key: "pinda",     label: "Pinda's",      icon: "🥜" },
  { key: "lupine",    label: "Lupine",       icon: "🌸" },
  { key: "week",      label: "Weekdieren",   icon: "🐚" },
] as const;

type AllergenKey = typeof ALLERGENS[number]["key"];
// "" = none, "y" = present, "m" = may contain
type Val = "" | "y" | "m";

interface Dish {
  name: string;
  price: string;
  cat: string;
  a: Val[]; // 14 values in allergen order above
}

const CATS = ["ALLE","VORSPEISEN","SUPPEN","SALATE","PASTA","FISCH","VEGETARISCH","FLEISCH","DESSERT","EISCOUPES"] as const;

// Helper: build 14-element array; provide only non-empty positions
function row(...vals: (Val | undefined)[]): Val[] {
  return Array.from({ length: 14 }, (_, i) => vals[i] ?? "") as Val[];
}

const DISHES: Dish[] = [
  // VORSPEISEN
  { name: "Knoblauchbrot",            price: "€5",  cat: "VORSPEISEN",    a: row("y","","y") },
  { name: "Bruschetta",               price: "€8",  cat: "VORSPEISEN",    a: row("y") },
  { name: "Burrata",                  price: "€10", cat: "VORSPEISEN",    a: row("y","","y","","","y") },
  { name: "Brotkorb",                 price: "€12", cat: "VORSPEISEN",    a: row("y","m","y") },
  { name: "Garnelen",                 price: "€12", cat: "VORSPEISEN",    a: row("","","","","y") },
  { name: "Carpaccio vom Rind",       price: "€14", cat: "VORSPEISEN",    a: row("","y","y","","","y","","m") },
  { name: "Überraschung Vorspeisen",  price: "€19", cat: "VORSPEISEN",    a: row("m") },
  // SUPPEN
  { name: "Tomatensuppe",             price: "€6",  cat: "SUPPEN",        a: row("","","y") },
  { name: "Fritattensuppe",           price: "€6",  cat: "SUPPEN",        a: row("y","y","","","","","m") },
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
  // VEGETARISCH & VEGAN
  { name: "Flatbread Falafel & Tzatziki", price: "€16", cat: "VEGETARISCH", a: row("y","","y","","","","","","m") },
  { name: "Kasnocken",                    price: "€16", cat: "VEGETARISCH", a: row("y","y","y") },
  { name: "Veganer Burger",               price: "€18", cat: "VEGETARISCH", a: row("y","","","","","","","","","","m","","m") },
  { name: "Käsefondue",                   price: "€25", cat: "VEGETARISCH", a: row("y","","y","","","","","","","y") },
  // FLEISCH
  { name: "Wiener Schnitzel",         price: "€18", cat: "FLEISCH", a: row("y","y") },
  { name: "Cordon Bleu",              price: "€20", cat: "FLEISCH", a: row("y","y","y") },
  { name: "Mühlbacher Schnitzel",     price: "€24", cat: "FLEISCH", a: row("y","y","y") },
  { name: "Pulled Chicken Burger",    price: "€21", cat: "FLEISCH", a: row("y") },
  { name: "Hühnerspies Tzatziki",     price: "€23", cat: "FLEISCH", a: row("","","y") },
  { name: "Rumpsteak Chimichurri",    price: "€29", cat: "FLEISCH", a: row("","","","","","","m") },
  { name: "Spare Ribs",               price: "€23", cat: "FLEISCH", a: row("","","","","","","","","","m") },
  { name: "Drahtesel Mix",            price: "€29", cat: "FLEISCH", a: row("y","y","","","","","","","","m") },
  { name: "Jagapfandl",               price: "€21", cat: "FLEISCH", a: row("y","y","y","","","","m") },
  { name: "Schnitzel Teller",         price: "€29", cat: "FLEISCH", a: row("y","y","y") },
  // DESSERT
  { name: "Tiramisu mit Lemon Curd",     price: "€11", cat: "DESSERT",    a: row("y","y","y","","","","","","","m") },
  { name: "Schokolade Cake",             price: "€9",  cat: "DESSERT",    a: row("y","y","y","","","","","","","","m") },
  { name: "Zuckerwaffel mit Erdbeeren",  price: "€11", cat: "DESSERT",    a: row("y","y","y") },
  { name: "Hausgemachter Kaiserschmarrn",price: "€14", cat: "DESSERT",    a: row("y","y","y") },
  // EISCOUPES
  { name: "Karamelbecher",   price: "€8", cat: "EISCOUPES", a: row("","","y","","","y") },
  { name: "Heisse Liebe",    price: "€9", cat: "EISCOUPES", a: row("","","y") },
  { name: "Coupe Danmark",   price: "€8", cat: "EISCOUPES", a: row("","","y") },
  { name: "Zitroneneis",     price: "€8", cat: "EISCOUPES", a: row("","","y") },
  { name: "Joghurt Amarena", price: "€8", cat: "EISCOUPES", a: row("","","y") },
];

function AllergenBadge({ allergen }: { allergen: typeof ALLERGENS[number] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, minWidth: 56 }}>
      <span style={{ fontSize: 22 }}>{allergen.icon}</span>
      <span style={{ fontSize: 9.5, fontWeight: 600, color: "var(--text-muted)", textAlign: "center", lineHeight: 1.2 }}>{allergen.label}</span>
    </div>
  );
}

function ValCell({ val }: { val: Val }) {
  if (val === "y") return (
    <td style={{ textAlign: "center", background: "#fdecea", color: "#a83232", fontWeight: 700, fontSize: 13 }}>✓</td>
  );
  if (val === "m") return (
    <td style={{ textAlign: "center", background: "#fef9e7", color: "#8a6800", fontWeight: 600, fontSize: 12 }}>(✓)</td>
  );
  return <td style={{ textAlign: "center", color: "var(--beige)" }}>—</td>;
}

export function Allergenen() {
  const [activeCat, setActiveCat] = useState<string>("ALLE");
  const [excludeAllergens, setExcludeAllergens] = useState<Set<AllergenKey>>(new Set());

  const toggleExclude = (key: AllergenKey) => {
    setExcludeAllergens(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const filtered = useMemo(() => {
    return DISHES.filter(dish => {
      if (activeCat !== "ALLE" && dish.cat !== activeCat) return false;
      for (const key of excludeAllergens) {
        const idx = ALLERGENS.findIndex(a => a.key === key);
        if (dish.a[idx] !== "") return false;
      }
      return true;
    });
  }, [activeCat, excludeAllergens]);

  return (
    <div>
      {/* Print button */}
      <div className="no-print flex justify-end mb-4">
        <button onClick={() => window.print()} className="btn-primary" style={{ minWidth: 180 }}>
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

          {/* 14 allergen legend */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {ALLERGENS.map(a => <AllergenBadge key={a.key} allergen={a} />)}
          </div>
        </div>

        {/* Filter card */}
        <div className="card no-print" style={{ padding: "20px 24px", marginBottom: 16 }}>
          {/* Category filter */}
          <div className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "var(--text-muted)" }}>
            Filter op categorie
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20 }}>
            {CATS.map(cat => (
              <button key={cat} onClick={() => setActiveCat(cat)}
                style={{
                  padding: "5px 12px", fontSize: 12, fontWeight: activeCat === cat ? 700 : 400,
                  borderRadius: 4, border: "1px solid var(--border)", cursor: "pointer",
                  background: activeCat === cat ? "var(--sage)" : "var(--beige-light)",
                  color: activeCat === cat ? "white" : "var(--text)",
                  transition: "all 0.15s",
                }}>
                {cat === "VEGETARISCH" ? "VEGETARISCH & VEGAN" : cat}
              </button>
            ))}
          </div>

          {/* Allergen exclude toggles */}
          <div className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "var(--text-muted)" }}>
            Toon alleen gerechten zonder…
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {ALLERGENS.map(a => {
              const active = excludeAllergens.has(a.key);
              return (
                <button key={a.key} onClick={() => toggleExclude(a.key)}
                  style={{
                    display: "flex", alignItems: "center", gap: 5,
                    padding: "5px 11px", fontSize: 12, fontWeight: active ? 700 : 400,
                    borderRadius: 4, cursor: "pointer", transition: "all 0.15s",
                    border: active ? "1px solid #a83232" : "1px solid var(--border)",
                    background: active ? "#fdecea" : "var(--beige-light)",
                    color: active ? "#a83232" : "var(--text)",
                  }}>
                  <span>{a.icon}</span> {a.label}
                </button>
              );
            })}
          </div>
          {excludeAllergens.size > 0 && (
            <button onClick={() => setExcludeAllergens(new Set())}
              style={{ marginTop: 10, fontSize: 11, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
              Wis filters
            </button>
          )}
        </div>

        {/* Results count */}
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8, paddingLeft: 4 }}>
          {filtered.length} gerecht{filtered.length !== 1 ? "en" : ""} weergegeven
        </div>

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
                const cats = CATS.filter(c => c !== "ALLE");
                const result: React.ReactNode[] = [];
                let lastCat = "";
                filtered.forEach((dish, i) => {
                  if (dish.cat !== lastCat) {
                    lastCat = dish.cat;
                    result.push(
                      <tr key={`cat-${dish.cat}`}>
                        <td colSpan={16} style={{ padding: "8px 12px", background: "var(--beige-light)", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", borderTop: result.length ? "1px solid var(--border)" : "none" }}>
                          {dish.cat === "VEGETARISCH" ? "Vegetarisch & Vegan" : dish.cat.charAt(0) + dish.cat.slice(1).toLowerCase()}
                        </td>
                      </tr>
                    );
                  }
                  result.push(
                    <tr key={dish.name} style={{ background: i % 2 === 0 ? "white" : "var(--beige-light)" }}>
                      <td style={{ padding: "7px 12px", fontWeight: 500, color: "var(--text)", position: "sticky", left: 0, background: "inherit", borderRight: "1px solid var(--border)" }}>{dish.name}</td>
                      <td style={{ padding: "7px 10px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>{dish.price}</td>
                      {dish.a.map((v, ai) => <ValCell key={ai} val={v} />)}
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

        {/* Disclaimer */}
        <div style={{ marginTop: 14, padding: "14px 18px", background: "#fef9e7", border: "1px solid #f5e079", borderRadius: 8, fontSize: 12, color: "#5a4800", lineHeight: 1.6 }}>
          ⚠️ Deze allergenenlijst is opgesteld op basis van de ingrediënten van onze recepten (zomer 2026). (✓) = mogelijk aanwezig of te controleren bij leverancier. Kruisbesmetting in onze keuken kan niet volledig worden uitgesloten. Bij ernstige allergieën altijd ons personeel informeren. Laatste update: mei 2026.
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          table th, table td { font-size: 9px !important; padding: 4px 5px !important; }
          table th[style*="background"] { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </div>
  );
}
