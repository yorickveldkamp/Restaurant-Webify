interface Props {
  onClear: (type: "temp" | "cleaning" | "all") => void;
  currentName: string;
  onChangeName: () => void;
  onNavigate: (tab: "temp" | "cleaning") => void;
}

export function Settings({ onClear, currentName, onChangeName, onNavigate }: Props) {
  const confirm_ = (type: "temp" | "cleaning" | "all") => {
    const labels = { temp: "alle temperatuurrapporten", cleaning: "alle reinigingsrapporten", all: "ALLE rapporten" };
    if (window.confirm(`Weet je zeker dat je ${labels[type]} permanent wil verwijderen?`)) onClear(type);
  };

  const rows: { title: string; desc: string; type: "temp" | "cleaning" | "all"; danger?: boolean }[] = [
    { title: "Temperatuurrapporten", desc: "Alle opgeslagen temperatuurmetingen verwijderen", type: "temp" },
    { title: "Reinigingsrapporten", desc: "Alle opgeslagen reinigingschecks verwijderen", type: "cleaning" },
    { title: "Alles wissen", desc: "Alle rapporten in één keer verwijderen", type: "all", danger: true },
  ];

  return (
    <div className="space-y-4">
      <div className="card overflow-hidden">
        <div className="px-5 py-3" style={{ borderBottom: "1px solid var(--border)", background: "var(--beige-light)" }}>
          <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>Jouw naam</span>
        </div>
        <div className="px-5 py-4 flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-medium" style={{ color: "var(--text)" }}>{currentName || "—"}</div>
            <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              Deze naam wordt automatisch ingevuld bij nieuwe rapporten
            </div>
          </div>
          <button onClick={onChangeName} className="btn-secondary shrink-0">Wijzigen</button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-3" style={{ borderBottom: "1px solid var(--border)", background: "var(--beige-light)" }}>
          <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>Papieren gegevens importeren</span>
        </div>
        <div className="px-5 py-4 space-y-3">
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
            Heb je nog rapporten op papier? Je kunt ze achteraf invoeren. Open hieronder Temperatuur of Reiniging,
            kies bovenaan een week of datum uit het verleden (tot ongeveer een jaar terug) en vul je papieren gegevens in.
            Sla daarna op als rapport en kies de volgende datum.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <button onClick={() => onNavigate("temp")} className="btn-secondary">
              Temperatuur invoeren →
            </button>
            <button onClick={() => onNavigate("cleaning")} className="btn-secondary">
              Reiniging invoeren →
            </button>
          </div>
          <div className="text-xs pt-1" style={{ color: "var(--text-muted)" }}>
            Tip: gebruik <strong>Tussentijds opslaan</strong> als je halverwege bent. Een rapport wordt pas definitief opgeslagen als alles is ingevuld.
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-3" style={{ borderBottom: "1px solid var(--border)", background: "var(--beige-light)" }}>
          <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--danger)" }}>Gegevens wissen</span>
        </div>
        {rows.map((row, i) => (
          <div key={row.type} className="px-5 py-4 flex items-center justify-between gap-4"
            style={{ borderBottom: i < rows.length - 1 ? "1px solid var(--beige-light)" : "none" }}>
            <div>
              <div className="text-sm font-medium" style={{ color: row.danger ? "var(--danger)" : "var(--text)" }}>{row.title}</div>
              <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{row.desc}</div>
            </div>
            <button onClick={() => confirm_(row.type)} className="btn-danger shrink-0">Wissen</button>
          </div>
        ))}
      </div>
    </div>
  );
}
