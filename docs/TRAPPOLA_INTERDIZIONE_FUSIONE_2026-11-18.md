# Eclissi Stellare — Trappola «Interdizione di Fusione»

**Decisione del 18 novembre 2026 — nuova carta generica confermata.**
Fonte attiva: `src/fleetNext/fusionDenialTrap.js` (`trap-fusion-denial`).

## Regola
- È una carta **Difesa / Trappola**; si prepara **coperta** nel proprio slot Trappola (uno per lato). L'avversario non ne vede nome, rarità o effetto prima dell'innesco.
- Quando l'avversario **gioca validamente** una **Carta Navicella Fusione** (`fusion-ship-*`), la Trappola si rivela automaticamente **prima** dell'effetto Fusione.
- La Fusione non avviene: **nessun supporto viene sostituito**, nessuna passiva o affinità viene aggiunta, nessun HP viene curato o sommato.
- La Carta Navicella Fusione annullata **va nello scarto del giocatore che l'ha giocata**; la Trappola rivelata **va nello scarto del proprietario**.
- L'annullamento **non consuma** uno dei due usi Fusione per battaglia. Se il giocatore ottiene e gioca un'altra Carta Navicella Fusione, può riprovare in un turno successivo.
- La Trappola non si rivela se la Fusione non viene giocata, è già illegale o non ci sono supporti idonei. Non si attiva al semplice passaggio di turno.
- Rispetta le regole delle altre Trappole: non può attivarsi nel turno stesso in cui viene posata; **Soppressione Trappole** e un **Generatore inattivo** del proprietario ne impediscono l'innesco.
- L'effetto blocca **le nuove Carte Navicella Fusione dei 13 supporti indipendenti**. Non cambia i vecchi percorsi di Fusione storica dismessi dalla battaglia ufficiale.

## Stato operativo
- Carta presente nel registro eseguibile e selezionabile nel mazzo **se posseduta**; nessuna copia viene regalata all'account o aggiunta ai salvataggi.
- Battaglia 3D: slot coperto e rivelazione già gestiti dal renderer corrente; **illustrazione definitiva e animazione specifica ancora da produrre**.
- Test di integrazione: `src/fleetNextFusionDenialTrap.test.js`.
- **Da definire successivamente:** rarità commerciale, quantità definitiva di copie consentite, modalità di ottenimento, eventuale prezzo e stile visivo. Il limite tecnico iniziale di una copia è provvisorio, non una scelta di bilanciamento.

Questa scheda **si aggiunge** alle carte confermate, senza riattivare i 350 ID ritirati o modificare le 120 esclusive delle 12 madri.
