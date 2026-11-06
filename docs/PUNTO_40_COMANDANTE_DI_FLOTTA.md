# Eclissi Stellare — Punto 40: comandante unico della flotta

**Stato:** identità e collegamento al duello implementati come prima integrazione. **Abilità di gioco: non implementate**. Tutte le modifiche sono sul repository unico `marcoteghini1988-ai/test7`, ramo `main`.

## Principio già deciso

- **Un solo comandante equipaggiato per l'intera flotta**, non un pilota separato per ciascuna nave/scudiera.
- Il comandante appartiene alla struttura `side.commander` del combattimento (giocatore e IA), **non** a `side.fleet[i]` né alle scudiere.
- La perdita di una nave, la distruzione di una scudiera o il KO dei quattro vitali non cancellano il riferimento al comandante. Questo evita perdite involontarie di progressione in fase di risultato/salvataggio.
- Restano distinte la **carta personaggio/pilota**, la **carta madre**, il **mazzo numerico boss** e le **carte speciali**.
- Nessun bonus automatico di danno, HP, seme, scudo o carte è trasferito dal vecchio motore Poker: i ruoli dei personaggi vanno riprogettati per il duello matematico continuo al punto 41.

## Collegamento concreto

1. `App.tsx` passa il **pilota selezionato**, il suo inventario e il nome visibile al duello. L'ID viene controllato contro il catalogo piloti già esistente.
2. `fleetCommander.js` legge soltanto piloti realmente **sbloccati** dal relativo inventario storico, mantiene lo stesso identificativo e limita il livello **L1–L5**.
3. `mathDuelEngine.js` registra il comandante sul lato giocatore e sul lato IA tramite `equipFleetCommander`. Non aggiunge il comandante alle navi e non cambia le statistiche.
4. `MathDuelBattle.jsx` usa il comandante reale anche nelle prove e durante la ricostruzione dello schieramento; l'HUD indica `CMD L…` con nome completo nel titolo descrittivo. L'IA usa temporaneamente il cadetto base, senza abilità gratuite: i comandanti IA distinti per settore/boss sono ancora da definire.
5. La collezione dei piloti rimane quella esistente (`eclissi_selected_pilot` e `eclissi_pilot_inventory`). **Nessuna nuova chiave di salvataggio**, duplicazione delle carte o migrazione distruttiva.

## Vincoli verificabili

- Il pilota inesistente, non sbloccato o con ID non valido non viene equipaggiato.
- Livelli fuori scala o corrotti sono normalizzati in L1–L5 senza modificare l'inventario.
- L'assegnazione non cambia HP, scudo, carte numeriche, speciali, armi, firme o collisioni.
- La stessa battaglia con o senza comandante conserva i valori di gioco di partenza; **solo lo stato informativo differisce**.
- Un comandante rimane assegnato dopo un impatto vero di combattimento alle scudiere.
- Il punto 40 non equivale al punto 41: nessuna abilità dei piloti si attiva finché non esistono costi, condizioni e limiti definiti.

## File

- `src/fleetCommander.js`: modello neutro, normalizzazione e assegnazione.
- `src/fleetCommander.test.js`: inventario, unicità, livelli, persistenza e nessun buff gratuito.
- `src/mathDuelEngine.js`, `src/MathDuelBattle.jsx`, `src/App.tsx`: collegamento completo dalla selezione dell'Hangar al duello.
- `src/escortRepair.test.js`: ulteriore test integrativo della nona carta, con colpo vero risolto dal motore e riparazione successiva.

## Da completare

- **Punto 41 — Abilità delle carte personaggio:** ruoli strategici distinti, interazioni con flotta e mazzi, condizioni misurabili, livelli e bilanciamento; niente effetti del vecchio Poker trasferiti implicitamente.
- Scelta pilota avversario per boss e settori, senza assegnazioni segrete/svantaggi artificiali.
- Controlli automatici su `main`: `npm ci`, `npm run verify:logic`, `npm run build`, `npm run preflight`. I risultati dei nuovi workflow GitHub Actions **non sono disponibili mediante il collegamento attuale**; i file e i test sono pubblicati, ma non è stata confermata una nuova build verde.
- Collaudo pratico su smartphone 9:16.

Resta valida la decisione di **rinviare grafica 3D e audio definitivi** e di lavorare direttamente su `test7/main`, senza copie.
