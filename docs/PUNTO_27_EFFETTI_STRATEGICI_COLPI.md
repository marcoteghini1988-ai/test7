# Eclissi Stellare — Punto 27: effetti strategici dei colpi

**Stato 6 novembre 2026:** prima implementazione logica, mano speciale e IA collegate. Repository ufficiale `marcoteghini1988-ai/test7`, ramo `main`. **240 test automatici riusciti**, build Vite/TypeScript e preflight verificati; restano da bilanciare sul gioco reale.

## Regola fondamentale

**I semi delle sette carte numeriche non generano effetti offensivi.** I semi continuano a caricare le rispettive armi. Le abilità strategiche vengono **armate attraverso specifiche carte del mazzo speciale**, consumate e sostituite immediatamente nella mano separata da cinque. L'abilità viene applicata soltanto al prossimo **tiro effettivo destinato allo scudo della madre avversaria**; un tiro a scudiera, un tiro ai vitali o una scarica senza danno non consuma i modificatori già armati.

È possibile preparare **massimo due effetti differenti** per la medesima scarica. Due carte uguali non si sommano né occupano due slot. Il limite di due è coerente con la scelta già concordata di combinare 1–2 carte speciali compatibili. Le fusioni e Copertura Tattica usano invece i loro requisiti specifici.

## Le tre carte offensive attive

| Carta | Effetto all'impatto | Durata e ambito |
| --- | --- | --- |
| **Colpo Perforante** | Il 20% del danno totale viene sottratto al *pacchetto intercettabile* dalle scudiere e raggiunge direttamente lo **scudo generale della madre**. Il resto subisce l'intercettazione normale. Non aggiunge danno né oltrepassa lo scudo o la firma matematica dei vitali. | Una scarica valida allo scudo |
| **Impulso Ionico** | Un colpo che toglie HP allo scudo generale ionizza il bersaglio; le intercettazioni **automatiche** delle scudiere diventano il 70% della loro quota normale. Non riduce la protezione acquistata tramite carta Copertura Tattica e non modifica gli HP. | 12 secondi dal colpo effettivo |
| **Corrosione** | Un colpo che toglie HP allo scudo generale lascia una vulnerabilità. Il **primo successivo colpo efficace** allo scudo aumenta di 25% il danno che supera le scudiere; dopo si consuma. Una nuova corrosione può rinnovarla. | 15 secondi, un solo colpo efficace |

Tutti i valori percentuali/durate sono **provvisori e regolabili**. Nessuna speciale crea HP, sostituisce la firma matematico/pokeristica dei sistemi o infligge danno ai vitali protetti.

## Il mazzo speciale di prova

Sono **sei tipi** operativi: due fusioni (Barriera, Assalto), una Copertura Tattica e tre colpi (Perforante, Ionico, Corrosione). Il mazzo dimostrativo mantiene **24 istanze**, distribuite in **quattro copie per tipo**. Questi numeri **non sono il deckbuilding definitivo** del punto 30. Mano **5 speciali** sempre reintegrata; mano **7 numeriche** separata.

Quando giochi Perforante / Ionico / Corrosione, la carta viene spostata negli scarti e il relativo modificatore rimane **pronto** fino al primo tiro valido allo scudo madre con danno positivo. Un tiro alla scudiera o a un vitale non lo consuma. Nel pannello MANOVRE la preparazione è visibile; solo un'azione di attacco legittima avvia la scarica. Non sono introdotti turni obbligatori, costi Sincronia automatici o poteri dei semi numerici.

## Intelligenza artificiale

L'IA può preparare fino a due effetti differenti soltanto se **possiede** le carte speciali necessarie, e deve consumarle dalla propria mano come il giocatore. L'euristica iniziale prepara carte offensive quando prevede un tiro diretto allo scudo madre del giocatore. I tempi di combattimento e le altre condizioni restano invariati.

## Implementazione

- `src/strategicShots.js`: arming, differimento della scarica, effetti e stati temporanei senza dipendenze grafiche.
- `src/specialCards.js`: integrazione del catalogo speciale e delle regole di consumo, quantità provvisorie.
- `src/MathDuelBattle.jsx`: selezione carte, scelta bersaglio, carica fino a due effetti, IA, stato della difesa e log.
- `src/mathDuelEngine.js`: risoluzione reale all'arrivo del colpo, senza spostare i danni sui vitali protetti.
- `src/fleetManeuvers.js`: riduzione temporanea della sola intercettazione automatica degli scudieri ionizzati.
- `src/MathDuelBattle.css`: distinzione essenziale delle tre carte, senza modificare l'arena 9:16.
- `src/strategicShots.test.js`: 15 nuovi test di effetti, durata, copie, compatibilità, validità matematica e corretta distribuzione del danno.
- Suite completa `npm run verify:logic`, `npm run build`, `npm run preflight`.

## Cosa non è stato ancora creato

**Incendio a danno nel tempo, esplosione ad area, congelamento, sabotaggio, riparazioni tramite carte, contromisure, effetti audio/video definitivi e deckbuilding personalizzato** non fanno ancora parte del catalogo giocabile. Non confondere le animazioni già esistenti delle armi con abilità tattiche attive.

## Prossimo punto

**Punto 28:** definire i requisiti d'attivazione delle armi e delle parti vitali, nonché l'estensione dei calcoli con due/tre carte e le condizioni matematiche/Poker per modello. Evitare che firme temporanee si trasformino per errore in regole permanenti. L'audio-visivo viene rifinito soltanto dopo le meccaniche.
