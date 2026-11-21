# Carte Arma base — integrazione eseguibile del 21 novembre 2026

Recepita la richiesta di inserire nel motore solo carte già definite e non inventare meccaniche aperte.

- Sono registrate, selezionabili se possedute e funzionanti le 22 Carte Arma base del documento `ARMI_BASE_ELEMENTI_APERTI_2026-11-20.md`, prima soltanto progettate.
- Ciascuna occupa uno dei due slot, dura un turno e infligge **un colpo HP indipendente** soltanto durante la risoluzione del turno di installazione. La madre conserva il suo normale attacco; i supporti non attaccano.
- Rispettati scudi e difese, copertura dei supporti, relazione elementale, Terreni, sabotaggio dell'Arsenale, scarti e limiti delle tre carte preparate. Nessun nuovo asset grafico; la plancia esistente è invariata.
- I 22 nuovi ID sono `weapon-base-{elementId}-{01..04}`, con `designId` delle rispettive schede conservato.
- Non sono distribuiti gratis né acquistabili con prezzi inventati: compaiono nel catalogo e nei mazzi se posseduti.
- Collaudo automatico aggiunto: `src/fleetNextApprovedBaseWeapons.test.js`; CI esegue preflight, verify:logic e build.
- Le quattro Armi storiche restano immutate. Le Armi avanzate con danni, costo Energia o interazioni ancora incompleti non vengono attivate fingendo che siano pronte. Due basi già trasferite a Terra e Vento non identificate rimangono fuori per evitare duplicazioni.
