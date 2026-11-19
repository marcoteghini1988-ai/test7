# Eclissi Stellare — Armi di Supporto: Sequenza e Amplificatore di Scorta
19 novembre 2026. I nomi, l'elemento Fulmine e i valori numerici sono provvisori. Nessun prezzo, assegnazione o modifica alle rarità.

## Sequenza Stellare I → II → III
Tre carte distinte nei due alloggiamenti temporanei Arma. Si gioca al massimo una carta Sequenza per proprio turno.
- I: +10 HP nominali sul colpo della madre durante due propri turni. Se non arriva la II nel proprio turno successivo, I ripete +10 e scade.
- II: se giocata nel turno immediatamente successivo a I, **sostituisce I nello stesso slot** (I negli scarti), aggiunge +30 HP e resta disponibile per essere sostituita da III. Senza I, II vale +10 HP per un solo turno e non può essere concatenata.
- III: se giocata nel turno successivo a II concatenata, **sostituisce II nello stesso slot** (II negli scarti), aggiunge +70 HP e scade dopo l'attacco. Giocata isolatamente, III aggiunge +20 HP per un turno.
- Non si possono concatenare tutte e tre nello stesso turno. Durante il passaggio non si infligge danno.

## Amplificatore di Scorta
Arma temporanea da due propri turni, con attivazione sul normale attacco della nave madre.
- Danno nominale: `15 + 20 × numero di slot supporto con navicella viva` HP.
- 0, 1, 2 supporti: **15 / 35 / 55 HP**; le fusioni non aggiungono un terzo slot.
- A ogni attacco il numero viene ricalcolato: se un supporto viene distrutto, l'effetto diminuisce.
- Il danno rimane soggetto a difese, HP reali e sabotaggio Arsenale. Buco Nero rimuove entrambe le armi.

## Stato
Effetti registrati nel catalogo e nel combattimento FleetNext, selezionabili nel mazzo solo se posseduti. Non sono assegnati gratuitamente o venduti.
Suite di regressione: `src/fleetNextTemporarySupportWeapons.test.js`; verifica globale `npm run verify:logic`, più build e preflight nella CI.
