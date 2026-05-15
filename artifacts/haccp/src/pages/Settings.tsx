interface SettingsProps {
  onClear: (type: "temp" | "cleaning" | "all") => void;
}

export function Settings({ onClear }: SettingsProps) {
  const confirmClear = (type: "temp" | "cleaning" | "all") => {
    const labels = {
      temp: "alle temperatuurrapporten",
      cleaning: "alle reinigingsrapporten",
      all: "ALLE rapporten",
    };
    if (window.confirm(`Weet je zeker dat je ${labels[type]} permanent wil verwijderen?`)) {
      onClear(type);
    }
  };

  return (
    <div>
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
        <h2 className="text-sm font-medium text-gray-900 mb-1">Over deze app</h2>
        <p className="text-xs text-gray-500 leading-relaxed">
          HACCP Beheer slaat alle gegevens lokaal op in je browser. Er wordt niets naar een server verstuurd.
          Wis je browsergeschiedenis of cookies niet, anders gaan de gegevens verloren.
        </p>
      </div>

      <div className="bg-white border border-red-100 rounded-xl p-4">
        <h2 className="text-sm font-medium text-red-600 mb-1 flex items-center gap-2">
          🗑️ Gegevens wissen
        </h2>
        <p className="text-xs text-gray-500 mb-4">
          Verwijder opgeslagen rapporten permanent. Deze actie kan niet ongedaan worden gemaakt.
        </p>

        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4 py-3 border-b border-gray-100">
            <div>
              <div className="text-sm font-medium text-gray-900">Temperatuurrapporten</div>
              <div className="text-xs text-gray-500 mt-0.5">Verwijder alle opgeslagen temperatuurmetingen</div>
            </div>
            <button
              onClick={() => confirmClear("temp")}
              className="shrink-0 px-3 py-1.5 rounded-md border border-red-200 text-red-600 text-xs hover:bg-red-50 transition-colors"
            >
              Wissen
            </button>
          </div>

          <div className="flex items-start justify-between gap-4 py-3 border-b border-gray-100">
            <div>
              <div className="text-sm font-medium text-gray-900">Reinigingsrapporten</div>
              <div className="text-xs text-gray-500 mt-0.5">Verwijder alle opgeslagen reinigingschecks</div>
            </div>
            <button
              onClick={() => confirmClear("cleaning")}
              className="shrink-0 px-3 py-1.5 rounded-md border border-red-200 text-red-600 text-xs hover:bg-red-50 transition-colors"
            >
              Wissen
            </button>
          </div>

          <div className="flex items-start justify-between gap-4 py-3">
            <div>
              <div className="text-sm font-medium text-red-700">Alles wissen</div>
              <div className="text-xs text-gray-500 mt-0.5">Verwijder alle rapporten in één keer</div>
            </div>
            <button
              onClick={() => confirmClear("all")}
              className="shrink-0 px-3 py-1.5 rounded-md border border-red-300 bg-red-50 text-red-700 text-xs font-medium hover:bg-red-100 transition-colors"
            >
              ⚠️ Alles wissen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
