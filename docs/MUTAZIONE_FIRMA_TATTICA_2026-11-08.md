# Eclissi Stellare — Mutazione della Firma del Bersaglio

**8 novembre 2026 · repository ufficiale `marcoteghini1988-ai/test7` · ramo `main`.**

## Regola codificata

- `tactic-signature-mutation` è una normale **Carta Speciale** nel mazzo da 24 e nella mano da 5, sottoposta al limite già approvato di **2 speciali per ciclo**.
- Il difensore sceglie **un proprio sistema vitale ancora vivo e già esposto** durante i 30 secondi di preparazione. Non può selezionare un vitale nemico o protetto.
- La scelta è sigillata insieme agli altri ordini e non legge la mano, la formula preparata o il bersaglio segreto del rivale.
- Nella risoluzione simultanea la firma del proprio vitale diventa per **un solo ciclo** un requisito matematico diverso dall'originale. La nuova firma viene scelta deterministicamente da una tabella compatibile con 2 o 3 carte (+9, −3, ×12, ÷2), escludendo l'operatore matematico già presente nel requisito originale. Le firme Poker canoniche si trasformano temporaneamente in un requisito matematico, sempre risolvibile.
- La nuova firma governa la **validazione reale** del colpo di precisione. Un attacco che segue la precedente firma viene respinto per `signature_mutated` e consuma soltanto le numeriche realmente impegnate. Se è stata preparata la combinazione corretta per la firma nuova, il colpo può ancora riuscire.
- Le armi native e gli attacchi alle barriere procedono normalmente. Mutazione non concede HP, non ripara i sistemi e non aggira le esposizioni.
- Il motore conserva l'originale e lo **ripristina dopo il confronto**, prima del ciclo successivo. Cronologia e istantanee di combattimento includono la mutazione per il replay.
- Nella visualizzazione esistente, una notifica mostra **quale vitale è stato mutato** e la nuova formula con operatore e numero. Le posizioni di navi, scudiere, mazzi, cinque speciali e sette numeriche rimangono invariate.
- L'IA locale può scegliere la carta soltanto quando un **proprio** vitale è effettivamente esposto, senza accedere agli ordini o alle carte dell'avversario.

## Collezione e acquisizione

La nuova tipologia si aggiunge al catalogo persistente versione 1 **senza convertire o cancellare salvataggi**: collezioni preesistenti ricevono la voce con possesso iniziale **0**. È inclusa nell'estrazione del pacchetto normale, a differenza dei dodici Personaggi Boss (solo trofeo) e dei Terreni PvP (sblocco ancora non definito). Nessuna copia è regalata entrando nella partita e non viene equipaggiata automaticamente.

I vecchi motori di combattimento che non supportano la Mutazione la filtrano solo dalla composizione della singola partita e, ove possibile, rimpiazzano con carte già possedute senza scrivere nell'inventario.

## File e test

- `src/tacticalSignatureMutation.js`: firme matematiche alternative, bersagli, durata.
- `src/simultaneousDuelEngine.js`: ordini, priorità della risoluzione e ripristino.
- `src/specialCards.js` e `src/specialDeckBuilder.js`: catalogo e migrazione conservativa.
- `src/tacticalDuelAi.js`: decisione difensiva autonoma legittima.
- `src/OfficialBattle3D.jsx`: selezione di un proprio vitale esposto, messaggi e istruzioni.
- `src/tacticalCombatTimeline.js`: annuncio della nuova formula e dell'eventuale attacco respinto.
- `src/pvpTerrainLoadout.js` e `src/BossBattle3D.jsx`: compatibilità legacy senza cambi di inventario.
- `src/tacticalSignatureMutation.test.js`: 68 firme, tutti i 17 modelli, soluzioni da due numeriche, scadenza, colpo valido bloccato, attacco alla barriera preservato, lato A e B, 52 numeriche / 24 speciali, salvataggi e IA.

## Verifica automatica

Il workflow [GitHub Actions n. 710](https://github.com/marcoteghini1988-ai/test7/actions/runs/42456284930) sul commit `4377ec9c90a5b83f141625f3371cf428188affca` ha eseguito con successo **656 test di logica**, **build Vite/TypeScript** e **preflight**. Le modifiche documentali o grafiche successive richiedono un nuovo controllo sul commit finale. Questo risultato **non sostituisce il playtest 9:16 su Android**.

## Ancora da completare

- Bilanciare frequenza della carta e interazioni con Contromisura e altre difese dopo sessioni reali.
- Verificare leggibilità del bersaglio fisico mutato e della formula nel replay su telefono, senza redesign della plancia.
- Proseguire con la **migrazione delle sei carte Oggetto Epico e delle dodici reliquie**, collegando soltanto inventari e fusioni autenticamente persistiti. L'attuale sistema Epico del motore non è ancora associato a un inventario ufficiale completo: nessun premio deve essere inventato.
