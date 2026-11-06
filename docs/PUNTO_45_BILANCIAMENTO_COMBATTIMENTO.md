# Eclissi Stellare — Punto 45: bilanciamento trasversale del combattimento

Data: 6 novembre 2026. Integrazione diretta sul ramo `main` di `marcoteghini1988-ai/test7`, senza duplicare il progetto né cambiare la plancia 9:16.

## Ambito

La nuova regolazione riguarda SOLO il combattimento reale in cui già esistono un colpo matematico autorizzato, munizioni consumate, le 7 carte numeriche, il mazzo di 5 speciali e la formazione. Si incrociano le passive dei 12 mazzi boss, le passive dei comandanti, i vantaggi reali delle fusioni, le difese e i modificatori ambientali Calma/Turbolenza/Picco.

Nessuna abilità viene cancellata; nessuna mossa può essere inventata per mezzo dei moltiplicatori. Restano validi requisito matematico, HP localizzati, scudo madre/scudiere, riciclo reale del mazzo, carta fusione fisicamente presente e 100 Sincronia.

## Limiti scelti e applicati

| Meccanismo | Valore | Motivo |
|---|---:|---|
| Passive di attacco boss × comandante × arena | massimo +35% sul danno della salva al lancio | Preserva il limite già esistente, evitando esplosioni di danno |
| Salva prima delle passive + Fusione Assalto + passive | massimo +45% rispetto alla salva **originale pre-manovra** | Una fusione mantiene il suo bonus ma la combinazione completa non arriva al +68,75% |
| Difesa passiva cumulativa alla nave madre | danno residuo minimo 65% | Scudo madre non diventa invulnerabile con combinazioni di boss, comandante e arena |
| Ionizzazione appena applicata da una speciale, boss resistente + arena ionica | durata residua minima 50% della durata originale | Protezione forte, senza cancellare l'identità della carta Ionizzazione |
| Sincronia | massimo 100 | Nessuna generazione di fusioni o attivazioni gratuite |

**Esempio:** con una salva originale da 100 danni, una Fusione Assalto che la porta a 125 e passive sufficienti per arrivare a 168, il danno finale viene fermato a 145. Una fusione da sola mantiene 125; le passive da sole mantengono un massimo di 135. Il nuovo limite è sulla **somma reale**, non sulla singola carta.

Non si riducono gli HP delle scudiere come scorciatoia. Le coperture e la fusione barriera continuano a consumare lo scudo reale per intercettare, non creano protezione gratuita. Le difese applicate alla nave madre intervengono dopo l'intercettazione.

## Ionizzazione

La speciale Ionica applica normalmente 12.000 ms. Un boss al massimo livello con resistenza del 35% porta la durata a 7.800 ms; sommando la Nebulosa Ionica nel Picco (ulteriore -32%) si scenderebbe a 5.304 ms. Il tetto deciso è 6.000 ms (resistenza complessiva massima 50%). Il correttivo non allunga mai uno status già inferiore a tale durata per altre ragioni e non crea status senza l'effettiva speciale.

## Telemetria per i playtest

`battlePacingReport` conserva già durata partita, numero di colpi 2/3 carte, ricicli e recuperi. Aggiunge:

- `playerSpecialCardsUsed`, `enemySpecialCardsUsed`
- `balanceResolvedImpacts`, `balancePlayerImpacts`, `balanceEnemyImpacts`
- `balancePassiveCaps`, `balanceFusionStackCaps`, `balanceDefenseCaps`
- `balancePeakImpacts`, `balanceSpecialImpacts`

Questi contatori non influenzano l'IA o le regole. Quando il match finisce, sono inclusi nelle statistiche di risultato già esistenti: consentono di osservare quante volte una difesa è al limite o una sinergia viene smorzata.

## Verifiche automatiche

- `src/combatBalance.js`: fonte pura dei fattori compositi e del limite combinato pre-manovra.
- `src/combatBalance.test.js`: casi limite, 12 boss × 33 comandanti × 3 fasi = **1.188 configurazioni** senza danni negativi o fattori oltre soglia; Ionizzazione combinata; nessuna mutazione in report.
- `src/battleArenas.js`: cap sulla combinazione ionica, senza interferire con eventi non applicati.
- `src/MathDuelBattle.jsx`: uso del bilanciamento a impatto e metrica cumulativa.
- `src/battlePacing.js`: dati di risultato per la verifica giocata.

La CI `verify:logic`, `build` e `preflight` è stata verificata dopo le modifiche. I test automatici verificano **vincoli e regressioni**, non stabiliscono la percentuale di vittoria né la durata effettiva di una boss fight.

## Scelte rinviate al playtest e criterio per approvarle

Le frequenze dei turni IA (inizialmente 35–40 s e progressivamente meno nella campagna), le statistiche HP per nave, il danno delle armi e la durata delle fusioni **non sono modificati adesso**: senza osservare i colpi per partita e la frequenza delle combo, ritoccarli contemporaneamente renderebbe impossibile capire cosa funziona. Dopo alcune battaglie, confrontare vittorie, tempo, colpi validi necessari, scudiere distrutte e quante volte si raggiungono i limiti; correggere un parametro alla volta.

Conservare gli asset 3D e le animazioni del punto 44. Nessuna copia del repository.
