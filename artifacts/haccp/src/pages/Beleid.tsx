export function Beleid() {
  return (
    <div>
      {/* Print button */}
      <div className="no-print flex justify-end mb-4">
        <button
          onClick={() => window.print()}
          className="btn-primary"
          style={{ minWidth: 180 }}
        >
          Afdrukken / PDF
        </button>
      </div>

      <div className="card print-doc" style={{ padding: "32px 36px", maxWidth: 900, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ borderBottom: "3px solid var(--sage)", paddingBottom: 18, marginBottom: 24 }}>
          <div className="text-xs font-semibold tracking-widest uppercase mb-1" style={{ color: "var(--text-muted)" }}>
            HACCP-Beleidsdocument
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", margin: "0 0 6px" }}>
            HACCP-Beleid — Der Drahtesel Hotel Restaurant
          </h1>
          <div className="text-sm" style={{ color: "var(--text-muted)" }}>
            Versie 1.0 &nbsp;·&nbsp; Datum: [invullen] &nbsp;·&nbsp; Volgende review: [+1 jaar]
          </div>
        </div>

        {/* Section helper */}
        {[
          /* 1 */
          <section key="1">
            <h2 className="section-title">1. Inleiding &amp; Toepassingsgebied</h2>
            <p className="policy-text">
              <strong>Wettelijke basis:</strong> EU-Verordening 852/2004, LMSVG (Lebensmittelsicherheits- und Verbraucherschutzgesetz), Österreichische Lebensmittelkodex (ÖLMB).
            </p>
            <p className="policy-text">
              Dit beleid is van toepassing op alle voedselbereiding, opslag, verwerking en servering in Der Drahtesel.
              Verantwoordelijke: <strong>Merel Fidom</strong>, Küchenchef / Betriebsleiter.
            </p>
          </section>,

          /* 2 */
          <section key="2">
            <h2 className="section-title">2. HACCP-Team</h2>
            <table className="policy-table">
              <thead>
                <tr><th>Functie</th><th>Verantwoordelijkheid</th></tr>
              </thead>
              <tbody>
                <tr><td>Küchenchef</td><td>Eindverantwoordelijke HACCP</td></tr>
                <tr><td>Betriebsleiter</td><td>Documentatie &amp; audits</td></tr>
              </tbody>
            </table>
          </section>,

          /* 3 */
          <section key="3">
            <h2 className="section-title">3. Productbeschrijving</h2>
            <p className="policy-text">
              Warme maaltijden, koude voor-/nagerechten, desserts, buffetproducten en ontbijt voor hotelgasten en restaurantbezoekers.
            </p>
          </section>,

          /* 4 */
          <section key="4">
            <h2 className="section-title">4. Processtroomdiagram</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", marginTop: 10 }}>
              {["Inkoop", "Ontvangst & Controle", "Koude/Droge Opslag", "Voorbereiding", "Bereiding (verhitting)", "Warm houden / Koeling", "Servering", "Afval"].map((step, i, arr) => (
                <span key={step} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ background: "var(--beige-light)", border: "1px solid var(--border)", borderRadius: 4, padding: "4px 10px", fontSize: 12, color: "var(--text)", fontWeight: 500 }}>{step}</span>
                  {i < arr.length - 1 && <span style={{ color: "var(--sage-dark)", fontWeight: 700 }}>→</span>}
                </span>
              ))}
            </div>
          </section>,

          /* 5 */
          <section key="5">
            <h2 className="section-title">5. CCP-Tabel (Kritische Controlepunten)</h2>
            <div style={{ overflowX: "auto" }}>
              <table className="policy-table">
                <thead>
                  <tr>
                    <th>CCP</th><th>Locatie/Stap</th><th>Gevaar</th><th>Kritische Grens</th><th>Bewaking</th><th>Corrigerende Maatregel</th><th>Registratie in app</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["CCP 1","Goederenontvangst","Microbiologische besmetting, verkeerde temperatuur","Gekoeld ≤4°C, diepvries ≤-18°C","Visuele controle + thermometer bij elke levering","Weigering bij overschrijding","App: Goederenontvangst"],
                    ["CCP 2","Koude opslag","Bacteriegroei","Koelkast 2–4°C, diepvries ≤-18°C","2x daags temperatuurmeting","Product verplaatsen of vernietigen bij >7°C","App: Koelkast temperaturen"],
                    ["CCP 3","Verhitting/Bereiding","Overleven pathogenen (Salmonella, Listeria, E. coli)","Kerntemperatuur ≥75°C (gevogelte ≥80°C)","Kernthermometer per bereidingsproces","Verder verhitten of vernietigen","App: Kerntemperaturen"],
                    ["CCP 4","Warm houden","Bacteriegroei","≥65°C, max. 3 uur","Temperatuurmeting elk uur","Opnieuw verhitten tot ≥75°C of vernietigen","App: Warmhoud temperaturen"],
                    ["CCP 5","Afkoeling","Bacteriegroei bij langzame afkoeling","Van >65°C naar <10°C binnen 2 uur (blast chiller)","Meting na afkoelproces","Vernietigen bij overschrijding","App: Afkoeltemperaturen"],
                    ["CCP 6","Persoonlijke hygiëne","Kruisbesmetting via personeel","Geen infecties zichtbaar, correcte handhygiëne","Dagelijkse visuele controle Küchenchef","Medewerker vrijstellen van voedselbereiding","App: Hygiënecontrole personeel"],
                    ["CCP 7","Reiniging & Desinfectie","Kruisbesmetting via oppervlakken","Reinigingsschema volledig uitgevoerd","Dagelijks/wekelijks/maandelijks reinigingsschema","Onmiddellijk hernemen, registreren","App: Reiniging & Desinfectie"],
                    ["CCP 8","Allergenen","Allergische reacties","14 EU-allergenen correct gelabeld per gerecht","Allergenenmatrix bijgehouden per menu","Direct aanpassen, gast informeren","App: Allergenen"],
                  ].map(r => (
                    <tr key={r[0]}>
                      {r.map((c, i) => <td key={i} style={i === 0 ? { fontWeight: 700, whiteSpace: "nowrap" } : {}}>{c}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>,

          /* 6 */
          <section key="6">
            <h2 className="section-title">6. Reiniging- en Desinfectieplan</h2>
            <p className="policy-text">
              Dit plan is opgesteld door <strong>Hagleitner Hygiene Österreich GmbH</strong> en goedgekeurd op 18.01.23.
              Alle reiniging- en desinfectiemiddelen veilig gebruiken. Voor gebruik altijd etiket en productinformatie lezen.
            </p>

            {/* Sub A */}
            <h3 className="subsection-title">A — Küche Räume (keukenruimten)</h3>
            <div style={{ overflowX: "auto" }}>
              <table className="policy-table">
                <thead>
                  <tr><th>Locatie</th><th>Type</th><th>Product</th><th>Dosering / Einwirkzeit</th><th>Frequentie</th><th>Methode</th></tr>
                </thead>
                <tbody>
                  {[
                    ["Arbeitsfläche Lebensmittel roh","Reinigung","FOX","30–60 ml/10 l","Direct na gebruik","Grobschmutz entfernen, product auftragen, oppervlak reinigen, afspoelen, drogen"],
                    ["Arbeitsfläche Lebensmittel roh","Desinfektion","hygenicDES FORTE","gebrauchsfertig, 1 min","Na de reiniging","Product auftragen, inwerken, NIET afspoelen"],
                    ["Fliesenboden","Reinigung","RADIKALIN","100 ml/10 l","Dagelijks","Grobschmutz entfernen, product auftragen, oppervlak reinigen"],
                    ["Fliesenboden","Reinigung + Desinfektion","hygenicDES PERFECT","100 ml/10 l, 15 min","Na de reiniging","Product auftragen, inwerken lassen, afspoelen, drogen"],
                    ["Handbedienungsbereich","Reinigung","FOX","30–60 ml/10 l","Dagelijks","Grobschmutz entfernen, oppervlak reinigen, afspoelen, drogen"],
                    ["Handbedienungsbereich","Reinigung + Desinfektion","hygenicDES PERFECT","100 ml/10 l, 15 min","Dagelijks","Product auftragen, oppervlak reinigen, drogen"],
                    ["Regal / Schrank offen","Reinigung","FOX","30–60 ml/10 l","Wekelijks","Grobschmutz entfernen, product auftragen, oppervlak reinigen, drogen"],
                    ["Regal / Schrank offen","Reinigung + Desinfektion","hygenicDES PERFECT","100 ml/10 l, 15 min","Dagelijks","Product auftragen, inwerken lassen, afspoelen, drogen"],
                    ["Küchenkasten innen met Lebensmittel","Reinigung","FOX","30–60 ml/10 l","Wekelijks","Grobschmutz entfernen, oppervlak reinigen, afspoelen, drogen"],
                    ["Küchenkasten innen met Lebensmittel","Reinigung + Desinfektion","hygenicDES PERFECT","100 ml/10 l, 15 min","Dagelijks","Product auftragen, oppervlak reinigen, drogen"],
                    ["Kühleinrichtung","Reinigung","FOX","30–60 ml/10 l","Maandelijks","Grobschmutz entfernen, oppervlak reinigen, afspoelen, drogen"],
                    ["Kühleinrichtung","Reinigung + Desinfektion","hygenicDES PERFECT","100 ml/10 l, 15 min","Dagelijks","Product auftragen, oppervlak reinigen, drogen"],
                    ["Tiefkühleinrichtung","Reinigung","arctiCLEAN","onverdund","Bij behoefte","Product auftragen, oppervlak reinigen, afspoelen, poetsen"],
                    ["Tiefkühleinrichtung","Desinfektion","hygenicDES FORTE","gebrauchsfertig, 5–10 min","Na de reiniging","Product auftragen, inwerken lassen, NIET afspoelen"],
                    ["Trockenlager Regal","Reinigung","FOX","30–60 ml/10 l","Wekelijks","Product auftragen, oppervlak reinigen, afspoelen, drogen"],
                  ].map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}
                </tbody>
              </table>
            </div>

            {/* Sub B */}
            <h3 className="subsection-title">B — Küche Geräte (keukenapparatuur)</h3>
            <div style={{ overflowX: "auto" }}>
              <table className="policy-table">
                <thead>
                  <tr><th>Locatie</th><th>Type</th><th>Product</th><th>Dosering / Einwirkzeit</th><th>Frequentie</th><th>Methode</th></tr>
                </thead>
                <tbody>
                  {[
                    ["Aufschnittmaschine","Reinigung","FOX","30–60 ml/10 l","Direct na gebruik","Machine demonteren, product auftragen, oppervlak reinigen, afspoelen, drogen"],
                    ["Aufschnittmaschine","Desinfektion","hygenicDES FORTE","gebrauchsfertig, 5–10 min","Na de reiniging","Product auftragen, inwerken lassen, NIET afspoelen"],
                    ["Küchengerät","Reinigung","FOX","30–60 ml/10 l","Direct na gebruik","Machine demonteren, product auftragen, oppervlak reinigen, afspoelen, drogen"],
                    ["Küchengerät","Desinfektion","hygenicDES FORTE","gebrauchsfertig, 1 min","Na de reiniging","Product auftragen, inwerken lassen, NIET afspoelen"],
                    ["Bain Marie","Reinigung","FOX","30–60 ml/10 l","Direct na gebruik","Product auftragen, oppervlak reinigen, afspoelen, drogen"],
                    ["Bain Marie","Desinfektion","hygenicDES FORTE","gebrauchsfertig, 1 min","Na de reiniging","Product auftragen, inwerken lassen, NIET afspoelen"],
                    ["Abfallbehälter","Reinigung","FOX","30–60 ml/10 l","Dagelijks","Product auftragen, oppervlak reinigen, afspoelen, drogen"],
                    ["Abfallbehälter","Desinfektion","hygenicDES FORTE","gebrauchsfertig, 1 min","Na de reiniging","Product auftragen, inwerken lassen, NIET afspoelen"],
                    ["Herd Kochfeld","Reinigung","RADIKALIN","50 ml/10 l","Dagelijks","Grobschmutz entfernen, product auftragen, oppervlak reinigen, afspoelen, drogen"],
                    ["Backofen","Reinigung","grillBLITZ","gebrauchsfertig, 5–10 min","Dagelijks","Oppervlak op 50°C brengen, product auftragen, inwerken lassen, oppervlak reinigen, afspoelen, drogen"],
                    ["Grill","Reinigung","grillBLITZ","gebrauchsfertig, 5–10 min","Dagelijks","Oppervlak op 50°C brengen, product auftragen, inwerken lassen, oppervlak reinigen, drogen"],
                    ["Mikrowelle","Reinigung","RADIKALIN","50 ml/10 l","Dagelijks","Grobschmutz entfernen, product auftragen, oppervlak reinigen, afspoelen, drogen"],
                    ["Mikrowelle","Desinfektion","hygenicDES FORTE","gebrauchsfertig, 5–10 min","Voor gebruik","Product auftragen, inwerken lassen, NIET afspoelen"],
                    ["Dunstabzug","Reinigung","RADIKALIN","100 ml/10 l","Bij behoefte","Grobschmutz entfernen, product auftragen, oppervlak reinigen, afspoelen, drogen"],
                    ["Fritteuse","Reinigung","RADIKALIN","onverdund","Bij behoefte","Product auftragen, oppervlak reinigen, afspoelen, drogen"],
                  ].map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}
                </tbody>
              </table>
            </div>

            {/* Sub C */}
            <h3 className="subsection-title">C — Zimmer (hotelkamers)</h3>
            <div style={{ overflowX: "auto" }}>
              <table className="policy-table">
                <thead>
                  <tr><th>Locatie</th><th>Type</th><th>Product</th><th>Dosering / Einwirkzeit</th><th>Frequentie</th><th>Methode</th></tr>
                </thead>
                <tbody>
                  {[
                    ["Armatur","Reinigung + Desinfektion","sanitaryDES 2GO","automatische Dosierung","Dagelijks","Product auftragen, inwerken lassen, oppervlak reinigen, afspoelen, drogen"],
                    ["Toilette","Reinigung + Desinfektion","sanitaryDES 2GO","automatische Dosierung","Dagelijks","Product auftragen, inwerken lassen, oppervlak reinigen, afspoelen, drogen"],
                    ["Toilette","Grundreinigung","UROPHEN","onverdund","Bij behoefte","Product auftragen, inwerken lassen, oppervlak reinigen, afspoelen, drogen"],
                    ["Fliesenboden","Reinigung + Desinfektion","sanitaryDES 2GO","automatische Dosierung","Dagelijks","Product auftragen, inwerken lassen, oppervlak reinigen, afspoelen, drogen"],
                    ["Duchtasse","Reinigung + Desinfektion","sanitaryDES 2GO","automatische Dosierung","Dagelijks","Product auftragen, inwerken lassen, oppervlak reinigen, afspoelen, drogen"],
                    ["Abfluss","Reinigung","X PRESS","20–100 ml, 5–30 min","Bij behoefte","Product auftragen, inwerken lassen, afspoelen"],
                    ["Handbedienungsbereich","Desinfektion","hygenicDES 2GO","automatische Dosierung, 15 min","Na de reiniging","Product auftragen, inwerken lassen, afspoelen"],
                    ["Inventar","Reinigung","allround 2GO","automatische Dosierung","Dagelijks","Grobschmutz entfernen, product auftragen, oppervlak reinigen, drogen"],
                    ["Inventar met Desinfektion","Desinfektion","hygenicDES 2GO","automatische Dosierung, 15 min","Na de reiniging","Product auftragen, inwerken lassen, afspoelen"],
                    ["Glasfläche","Reinigung","allround 2GO","automatische Dosierung","Bij behoefte","Product auftragen, oppervlak reinigen"],
                  ].map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}
                </tbody>
              </table>
            </div>
          </section>,

          /* 7 */
          <section key="7">
            <h2 className="section-title">7. Registratie &amp; Documentatie</h2>
            <p className="policy-text">Alle CCP-metingen worden vastgelegd in de HACCP-app van Der Drahtesel. Bewaarplicht minimaal 1 jaar (conform Oostenrijkse richtlijnen). Bij afwijkingen: registratie met datum, naam medewerker en actie.</p>
          </section>,

          /* 8 */
          <section key="8">
            <h2 className="section-title">8. Verificatie &amp; Interne Audit</h2>
            <p className="policy-text">Maandelijkse interne audit door Betriebsleiter. Jaarlijkse herbeoordeling van het volledige HACCP-plan. Externe controle door AGES of gemeentelijke Lebensmittelinspektion.</p>
          </section>,

          /* 9 */
          <section key="9">
            <h2 className="section-title">9. Opleiding</h2>
            <p className="policy-text">Bij indiensttreding hygiëne-instructie. Jaarlijkse herhalingstraining. Trainingsrecords bijgehouden door Betriebsleiter.</p>
          </section>,

          /* 10 */
          <section key="10">
            <h2 className="section-title">10. Corrigerende Maatregelen</h2>
            <p className="policy-text">Bij overschrijding kritische grens: product isoleren, beoordelen, evt. vernietigen. Registratie in app onder "Afwijkingen". Melding aan Betriebsleiter binnen 1 uur. Bij ernstig incident: melding aan AGES.</p>
          </section>,

          /* 11 */
          <section key="11">
            <h2 className="section-title">11. Ondertekening</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 32, marginTop: 12 }}>
              {[
                { label: "Opgesteld door (Küchenchef)", value: "Yorick Veldkamp" },
                { label: "Goedgekeurd door (Betriebsleiter)", value: "Merel Fidom" },
                { label: "Datum", value: "16 mei 2026" },
              ].map(f => (
                <div key={f.label} style={{ minWidth: 200 }}>
                  <div className="text-xs uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>{f.label}</div>
                  <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: 4, minWidth: 220, color: "var(--text-muted)", fontStyle: "italic" }}>{f.value}</div>
                </div>
              ))}
            </div>
          </section>,
        ]}

      </div>

      <style>{`
        .section-title {
          font-size: 14px;
          font-weight: 700;
          color: var(--text);
          margin: 28px 0 10px;
          padding-bottom: 6px;
          border-bottom: 2px solid var(--sage);
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .section-title::before {
          content: '';
          display: inline-block;
          width: 4px;
          height: 16px;
          background: var(--sage-dark);
          border-radius: 2px;
          flex-shrink: 0;
        }
        .subsection-title {
          font-size: 12px;
          font-weight: 600;
          color: var(--text);
          margin: 18px 0 8px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--text-muted);
        }
        .policy-text {
          font-size: 13.5px;
          line-height: 1.65;
          color: var(--text);
          margin: 6px 0;
        }
        .policy-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
          margin-bottom: 8px;
        }
        .policy-table th {
          background: var(--sage);
          color: white;
          text-align: left;
          padding: 7px 10px;
          font-weight: 600;
          white-space: nowrap;
        }
        .policy-table td {
          padding: 6px 10px;
          border-bottom: 1px solid var(--beige-light);
          color: var(--text);
          vertical-align: top;
          line-height: 1.4;
        }
        .policy-table tbody tr:nth-child(even) td {
          background: var(--beige-light);
        }
        .policy-table tbody tr:hover td {
          background: #e8e2db;
        }
        @media print {
          .no-print { display: none !important; }
          .print-doc { box-shadow: none !important; border: none !important; }
          body { background: white !important; }
          .policy-table th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .policy-table tbody tr:nth-child(even) td { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .section-title::before { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </div>
  );
}
