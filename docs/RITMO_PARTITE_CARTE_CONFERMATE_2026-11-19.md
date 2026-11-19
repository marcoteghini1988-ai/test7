# Bilanciamento del ritmo in duelli con carte confermate
19 novembre 2026 — Nessuna modifica a Personaggi, Terreni o alle statistiche dei 13 supporti.

## Riscontro prima della correzione
Simulazioni con carte vere, due supporti, possibilita' di doppia Fusione, una Trappola e Carte Energia; tempo medio di decisione modellato: 15 secondi per giocata. Cinque PvP: **285, 330, 465, 525, 570 s**. Due battaglie boss: **420 e 465 s**. Tre PvP su cinque oltre i 6 minuti; boss troppo brevi. Nessuno di questi valori e' una misura dal PvP reale, che resta simulato.

## Correzione misurabile e priva di timeout
- **PvP**: dopo 180 secondi, i danni reali degli attacchi crescono del 35% ogni 30 secondi aggiuntivi, fino al moltiplicatore 3,5. Serve a contrastare le sequenze molto difensive, senza tagliare una partita a tempo. L'effetto e' uguale per entrambi i giocatori e appare nel log; non moltiplica danno di veleno, rigenerazione o Sacrificio.
- **Campagna ordinaria**: pressione meno rapida dopo 240 secondi, tetto 2,5.
- **Boss**: i boss con schede-rarita' hanno 15–26% di resistenza supplementare ai danni diretti, diversa secondo il boss, senza aumentare il numero di HP mostrati. La pressione del combattimento parte solo dopo 8 minuti, progressiva e senza eliminazione forzata.

I limiti di 40% HP per singolo colpo e 55% HP per turno restano attivi. L'accelerazione interessa soltanto attacchi effettivamente risolti e non aggira Difese o Trappole. Le armi e i loro danni nominali restano confermati. Non sono previsti acquisti, potenziamenti o animazioni aggiuntive.

## Verifica
Le misure dell'audit su duelli PvP e boss sono in `src/fleetNextApprovedBalanceAudit.test.js`; i valori e la resistenza in `src/fleetNext/pacingPressure.test.js`. Obiettivo statistico PvP 240–360 secondi e Boss 480–600 secondi; nessuna partita termina automaticamente allo scadere di questi intervalli.
