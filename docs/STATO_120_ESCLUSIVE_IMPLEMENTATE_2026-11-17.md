# Eclissi Stellare — stato ufficiale delle 120 carte esclusive
_Consolidato il 17 novembre 2026, branch \`main\` del repository \`marcoteghini1988-ai/test7\`._

## Stato

Le **120 definizioni univoche** delle carte esclusive sono ora eseguibili: **10 per ciascuna delle 12 navicelle madri**. L'ultimo motore integrato è **Arca Astrale (L04)**.

| Ordine | Madre | Codice | Esclusive implementate |
|---:|---|---|---:|
| 1 | Aurora-0 | N00 | 10 |
| 2 | Lince Solare | C01 | 10 |
| 3 | Vespa di Vetro | C02 | 10 |
| 4 | Corvo a Impulsi | C03 | 10 |
| 5 | Falco Binario | R01 | 10 |
| 6 | Manta Ionica | R02 | 10 |
| 7 | Squalo del Vuoto | R04 | 10 |
| 8 | Nefelarca | E01 | 10 |
| 9 | Vortiluce | E02 | 10 |
| 10 | Eclisse Reale | L01 | 10 |
| 11 | Titano Ossidiana | L03 | 10 |
| 12 | Arca Astrale | L04 | 10 |

I **12 Personaggi esclusivi originari** conservano gli ID \`ex-*-01\` e sono stati aggiornati con effetti nativi. I **5 Personaggi variante**, i **12 Boss** e gli scenari ambientali preesistenti sono rimasti nel progetto.

## Fusione dell'Arca

La definizione \`nx-l04-05\` ha **due copie nel pacchetto automatico**, mentre le altre esclusive hanno una copia. Le due fusioni consumano le due disponibilità della partita e riutilizzano \`fuseFleetSupports\`: la prima unisce i supporti 1 e 2 ed eventualmente schiera il terzo dalla riserva (livello 3+); la seconda unisce il terzo e il quarto dalla riserva soltanto quando sbloccato (livello 5). È possibile usare entrambe nello stesso turno al livello 5, come già previsto dal combattimento storico, senza schierare un terzo supporto gratuito.

La vecchia carta \`prog-fusion-l04\` resta **riconosciuta per compatibilità**, ma non viene più aggiunta al pacchetto automatico: al suo posto ci sono le due copie della nuova \`nx-l04-05\`.

## Architettura e verifiche

- Fonte ufficiale: \`docs/NUOVO_CATALOGO_ESCLUSIVE_120_2026-11-16.json\` (stato di esecuzione aggiornato).
- Registro carte: \`src/fleetNext/exclusive120.js\` e \`src/fleetNext/rules.js\`.
- Motori specializzati: \`src/fleetNext/*Engine.js\`, ultimo \`src/fleetNext/arkEngine.js\`.
- Risoluzione combattimento: \`src/fleetNext/combat.js\`.
- Plancia 3D ufficiale: \`src/OfficialFleetBattle3D.jsx\` e relativo CSS.
- Test dell'ultima madre: \`src/fleetNextArkEffects.test.js\` (37 casi di collaudo dedicati).
- Verifiche automatiche: \`npm run preflight\`, \`npm run verify:logic\`, \`npm run build\`.

## Lavoro distinto ancora da eseguire

**La conclusione riguarda la logica delle carte e l'integrazione nel gioco, non gli asset grafici definitivi.** Mancano la realizzazione/approvazione delle immagini definitive nello stile concordato, l'eventuale rifinitura di effetti visivi e sonori e il collaudo di esperienza utente in gioco. Non reintrodurre schede di prova, versioni parallele o layout web al posto dell'arena 3D. Il PvP resta simulato fino alla successiva fase di sviluppo.
