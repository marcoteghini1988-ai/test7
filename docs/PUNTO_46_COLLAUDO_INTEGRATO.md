# Eclissi Stellare — Punto 46: collaudo integrato del duello

Data: 6 novembre 2026. Modifiche applicate direttamente a `marcoteghini1988-ai/test7`, ramo `main`, senza copie del progetto.

## Obiettivo
Non verificare più soltanto i singoli bonus: attraversare gli stessi motori del combattimento giocabile, dal mazzo di partenza ai calcoli validi, consumo munizioni, proiettile, risoluzione dell'impatto, boss, pilota, ambiente e risultati.

## Codice condiviso tra gioco e verifiche

La logica dell'impatto prima contenuta nel componente React `src/MathDuelBattle.jsx` viene centralizzata in `src/resolveCombatImpact.js`.

Il risolutore si attiva solo con un impatto già autorizzato dal motore di lancio (`legalAttack: true`), e riceve l'attaccante e il difensore **attuali**, un colpo realmente lanciato, la fotografia della fase ambientale e il contesto verificato della formula. Esegue la sequenza:

1. Valutazione abilità boss (attacco/difesa).
2. Valutazione abilità pilota/comandante (attacco/difesa).
3. Condizioni e bonus dell'arena (Calma/Turbolenza/Picco).
4. Calcolo dei limiti di bilanciamento del punto 45.
5. Impatto effettivo con intercettazioni, scudi, vitali e status.
6. Resistenze ioniche, memoria delle passive e Sincronia legittima.
7. Restituzione del nuovo stato e dei dati per il registro e i contatori.

**Importante:** il validatore del calcolo matematico, il consumo di carte e la formazione dei proiettili restano nel motore di lancio esistente. Il nuovo risolutore NON deve essere chiamato da pulsanti o speciali per creare danni senza un colpo già lanciato.

## Verifiche automatiche integrate

`src/integratedBattle.test.js` esegue test con il vero catalogo e le vere funzioni del gioco:

- **120 settori**: inizializzazione campagne con 12 pianeti × 10 settori, corretta arena, due scudiere al livello cinque, 7 carte numeriche distinte in mano con 52 nel mazzo complessivo e 5 carte speciali con 24 nel mazzo complessivo, senza duplicazioni o scomparsa.
- **12 boss**: ricerca di una mano realmente valida a partire dal mazzo mescolato deterministico, selezione di una formula risolvibile, creazione della salva da munizioni autentiche, consumo carte, risoluzione effettiva sul boss e verifica che lo stato originale sia intatto.
- **Parità giocatore/IA**: lo stesso percorso di colpo per i due schieramenti in fase Picco e con il boss.
- **Fusione Assalto**: carta speciale realmente presente nella mano, requisito di Sincronia 100, consumo della carta, rifornimento mano a cinque, nessuna creazione di carte numeriche, tetto cumulativo del +45%.
- **Impulso Ionico**: carta preparata realmente dalla mano speciale, verifica dei contatori, impossibilità di giocare una carta inesistente e status legato a un impatto vero.
- **Report**: statistiche dell'incontro, eventuali limiti applicati e nessuna mutazione durante la lettura.

Ai test sono aggiunte tutte le regressioni pregresse. GitHub Actions esegue `npm run verify:logic`, `npm run build` e `npm run preflight`.

## Cosa è stato corretto

- Rimosso dalla schermata React il codice duplicato che risolveva l'impatto: da ora la UI usa la **stessa funzione** dei test integrati.
- Un'asserzione della prima versione del test interpretava un campo boss opzionale assente come `null`: corretta l'asserzione, senza alterare il comportamento del gioco.
- Il controllo del numero di carte consumate ora usa la lunghezza della combinazione reale (2 oppure 3), non presume due numeriche.

## Limiti della verifica

Questa è una verifica **automatica del motore**. Non è ancora un playtest umano completo in browser su smartphone. Non dimostra automaticamente che ogni boss sia facile o difficile al giusto livello, che una sessione duri il tempo desiderato o che su un telefono le animazioni siano sempre fluide. I test verificano la disponibilità e l'efficacia del percorso di attacco, non una simulazione temporizzata di tutta una partita fino al risultato finale in tutti i 120 livelli.

Restano da verificare nel collaudo manuale: layout 9:16, leggibilità numeri su effetti ambientali, velocità IA, animazioni, gestione di tutte le carte speciali e progressione salvataggi.

## Prossimo intervento

Punto 47: rifinitura dell'esperienza del giocatore — segnali leggibili del lancio, impatto, consumo carte, attivazione speciali, stato boss e risultato, senza ridisegnare la plancia approvata e senza riscrivere il motore.
