interface Props { onClear: (type: "temp" | "cleaning" | "all") => void; }

export function Settings({ onClear }: Props) {
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
      <div className="card px-5 py-4">
        <div className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: "var(--text-muted)" }}>Over deze app</div>
        <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
          HACCP Beheer slaat alle gegevens lokaal op in je browser via localStorage.
          Er wordt niets naar een externe server verstuurd. Wis je browseropslag niet,
          anders gaan de registraties verloren.
        </p>
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
