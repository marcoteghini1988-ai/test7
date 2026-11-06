# Eclissi Stellare — Punto 29: ritmo e bilanciamento del duello

**Stato:** prototipo operativo aggiornato sul solo repository `marcoteghini1988-ai/test7`, ramo `main`, il 6 novembre 2026. **Non è il bilanciamento finale**: le durate desiderate e l'equità competitiva restano da misurare durante vere partite, anche su smartphone.

## Principi conservati
- **Battaglia continua** senza obbligo di azione ogni 20 secondi per il giocatore.
- L'IA decide autonomamente durante il gioco. Il parametro già previsto per i settori iniziali è un intervallo indicativo **35–40 secondi** e può ridursi fino a circa **25–30 secondi** nei settori più avanzati della campagna. Non sono timer di turno per il giocatore.
- La mano standard è sempre **7 carte numeriche**; la mano tattica è sempre **5 carte speciali**; i due mazzi restano separati.
- Tutte le manovre, fusioni, scudiere, armi, firme matematiche/Poker e danni ai quattro sistemi vitali mantengono gli effetti reali già concordati.

## Punto 29A — Mazzo numerico senza fine prematura
Nel **nuovo combattimento madre + scudiere**, dopo aver usato le carte numeriche, queste passano negli scarti. Quando il mazzo da cui si pesca è finito, **gli scarti numerici vengono rimescolati e riutilizzati**. Le carte disponibili rimangono esattamente **le 52 iniziali, ciascuna una sola volta** tra mano, mazzo e scarti: nessuna carta aggiunta, nessuna duplicazione, nessun cambio di seme o valore.

Questo evita che la partita venga dichiarata conclusa soltanto perché non rimangono nuove carte da pescare, prima che le difese e i vitali siano realmente distrutti. Le modalità precedenti con mazzo finito **mantengono la vecchia regola** per non modificare retroattivamente il gioco.

## Punto 29B — Attacchi IA utilizzabili, non sprecati
- L'IA analizza sia le **coppie** sia i calcoli a **tre numeriche**.
- Quando gli scudi generali della madre avversaria sono esauriti, la scelta viene fatta **solo su una parte vitale effettivamente colpibile**, con la combinazione compatibile con la firma di quel modello.
- Le alternative Poker del punto 28 (**COPPIA/TRIS**, dove realmente previste) possono essere usate anche dall'IA, senza concederle carte supplementari.
- Dove più bersagli sono validi, il prototipo attribuisce un punteggio al danno previsto e favorisce in parte le combinazioni a due carte, risparmiando risorse rispetto a tre quando il risultato è comparabile.
- L'IA non può aggirare lo scudo, la firma o le regole di consumo della mano numerica.

## Punto 29C — Ricambio quando non esiste un attacco valido
- Il pulsante **RICAMBIO NUMERICO** nel pannello **MANOVRE** funziona soltanto quando **non esiste alcun attacco consentito con la mano attuale**, tenendo conto delle operazioni installate e delle firme esposte.
- Il ricambio sostituisce **una sola carta numerica reale**, pescandone una dal proprio mazzo. La carta scartata resta disponibile per futuri cicli di pesca.
- Ricarica tecnica provvisoria: **15 secondi**. Non genera scudi, HP, danni, carte speciali o numeriche extra. Non impone un limite di tempo alle normali mosse del giocatore.
- Anche l'IA può effettuare il ricambio, con **le stesse condizioni e la stessa ricarica**, quando le sue combinazioni e i normali cambi non sono sufficienti.
- Non è consentito rimescolare liberamente una mano che già contiene un attacco valido.

## Punto 29D — Misurazione per il bilanciamento finale
Nel risultato finale ora vengono calcolati e inviati ai dati di partita:
- **Durata effettiva in secondi**, misurata dall'inizio del duello dopo l'introduzione.
- Numero di **attacchi a due numeriche** e **attacchi a tre numeriche**, distinti per giocatore/IA.
- Quantità di **numeriche realmente consumate** da entrambi.
- Numero di **ricicli del mazzo numerico** e di **ricambi per mano bloccata**, distinti per lato.

Si potranno valutare con questi dati i tempi obiettivo storicamente proposti (livelli normali circa 4–5 minuti, boss circa 10–12 minuti, PvP circa 6–8 minuti). **Questi tempi NON sono stati ancora verificati**: il rapporto raccoglie le metriche, non dichiara il bilanciamento completato. La logica legacy e il PvP simulato devono essere allineati successivamente alla nuova architettura.

## Codice modificato e verifiche
- `src/aiBattleTactics.js`: selezione del colpo IA con controllo delle firme e delle alternative Poker.
- `src/mathDuelEngine.js`: riutilizzo delle stesse 52 carte, compatibilità con il vecchio mazzo finito e conteggi reali di attacchi e numeriche spese.
- `src/battlePacing.js`: verifica del blocco effettivo, ricambio singola carta e rapporto di fine partita.
- `src/MathDuelBattle.jsx`: integrazione della logica di scelta IA, pulsante RICAMBIO e telemetria restituita a `onResult`.
- `src/battlePacing.test.js`: test su ciclo di 80 attacchi senza duplicazioni, firme valide, Poker IA, ricambio e durata.
- **272 test automatici** previsti dopo le nuove verifiche, oltre a build e preflight da controllare sull'ultimo commit.

## Restante lavoro — necessario prima di considerare chiuso il bilanciamento
1. Effettuare partite complete per ogni rarità/livello e difficoltà, confrontando durata, win rate e distribuzione dei tipi di attacco.
2. Verificare la leggibilità e la reattività della plancia 9:16 in una vera sessione mobile.
3. Calibrare il danno relativo di armi/scudiere e i vantaggi delle fusioni/speciali sulla base delle statistiche raccolte.
4. Testare missioni boss, salvataggi, campagna e l'eventuale nuova esperienza PvP integrata.
5. Rimandare l'ultima fase **audio-visiva/3D** fino alla stabilizzazione di tutte le regole.

## Prossimo blocco
**Punto 30 — costruzione e ampliamento del mazzo delle carte speciali**. Non modificare `test7` creando copie su GitHub: continuare direttamente su `main`.
