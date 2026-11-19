# Eclissi Stellare — Mortaio Magmatico, alimentazione automatica con Energie

**19 novembre 2026 · Scheda di progettazione. NON implementata nel motore.**

## Identità e categoria
- **Carta:** Mortaio Magmatico (`weapon100-plasma-04`) — Fuoco, Rara.
- **Categoria:** Carta Arma. Si trascina dalla mano in uno dei **due slot Arma temporanea**.
- **Durata:** **3 propri turni**, incluso quello in cui viene giocata. Non occupa slot Attacco.
- **Revisione del nome:** il Mortaio di Grandine non rimane nel gruppo Ghiaccio; per rispettare il conteggio si riutilizza il Mortaio Magmatico già esistente nell'elemento Fuoco. Il posto Ghiaccio Rara diventa provvisoriamente Artiglieria delle Schegge Erranti, da confermare.

## Sparo dell'Arma e consumo automatico
1. Appena il Mortaio è installato, **spara un colpo base autonomo** che infligge HP al bersaglio valido (nave madre o supporto secondo le regole di bersaglio; da precisare prima dell'implementazione).
2. Nel **secondo e nel terzo turno proprio** in cui rimane operativo, spara nuovamente **un colpo base** per ciascun turno. Il valore in HP del colpo base è **da stabilire**.
3. Se al momento dell'installazione sono già presenti cariche nell'**unico accumulatore di Energie della nave madre**, il Mortaio le **assorbe automaticamente** e per **ogni carica** spara **un colpo supplementare proprio**. Non somma soltanto una percentuale: l'Arma fa un colpo distinto per ogni Energia.
4. Anche quando il Mortaio è già installato da uno o due turni, ogni nuova **Carta Energia** giocata e caricabile dalla madre viene **convogliata immediatamente al Mortaio** mentre è attivo, dando un ulteriore colpo. È possibile giocare più Carte Energia nel medesimo turno, nel normale limite di 3 carte giocate per turno.
5. Le cariche assorbite vengono **sottratte all'accumulatore della nave madre**: non possono essere riutilizzate per il suo **Attacco/Effetto Speciale**. Il Mortaio ha priorità automatica sulle Energie, quindi il giocatore accetta questa limitazione schierandolo.
6. Le Carte Energia effettivamente giocate vanno **agli scarti una sola volta**, secondo le regole del motore. Le cariche accumulate nei turni precedenti derivano da carte già negli scarti: consumarle non deve creare doppioni negli scarti.
7. Alla scadenza del terzo turno proprio il Mortaio viene rimosso, la Carta Arma va negli scarti e lo slot Arma si libera. Le Energie **non assorbite** potranno di nuovo alimentare la madre normalmente.

## Esempi concreti, numeri del solo numero di colpi
- **Turno A senza Energia:** 1 colpo base.
- **Turno A con 2 Energie già accumulate:** 1 colpo base + 2 colpi energetici, con consumo delle due cariche.
- **Turno B, Mortaio ancora sul campo, giochi una Energia:** 1 colpo base + 1 colpo energetico nel medesimo turno; l'Energia non rimane alla madre.
- **Turno C, Mortaio ancora operativo, giochi tre Energie:** 1 colpo base + 3 colpi energetici, poi il Mortaio termina. La madre non può usare quelle tre cariche per la sua Speciale.

## Verifica effettuata sul codice di test7
- In `src/fleetNext/energyCards.js` il limite è **4 cariche** (`ENERGY_CAPACITY=4`).
- In `src/fleetNext/elementalAbilities.js` il motore conserva le Energie in un **unico oggetto contatore** `side.elementalCharges` per elemento, con totale massimo quattro. `chargeElementalEnergy` e `spendElementalEnergy` gestiscono le cariche.
- Il motore `src/fleetNext/combat.js` valida un limite di **tre carte giocate per turno** e attualmente fa consumare le Energie soltanto all'abilità speciale o ad altri effetti già codificati. **Non esiste ancora il consumo automatico del Mortaio** e non esistono i suoi colpi aggiuntivi.
- `src/OfficialFleetBattle3D.jsx` visualizza al momento un **contatore dell'accumulatore** (`/4`), NON quattro slot separati né una vera pila di carte sovrapposte. L'idea dell'utente è **un solo spazio Energia, impilabile visivamente**; questo si sistemerà nella fase di interfaccia con Work.

## Aspetti da definire prima di codificare
- **Danno base e danno per singolo proiettile energetico** (non devono essere necessariamente uguali).
- **Tipo di Energia consumabile:** l'utente parla di 'Carte Energia' genericamente. Il motore attuale permette cariche soltanto degli elementi disponibili alla madre. Stabilire se il Mortaio Fuoco assorbe tutte le cariche legalmente disponibili o solo Energia Fuoco.
- **Ordine effettivo delle carte** quando sono giocate nello stesso turno (Energia prima o Mortaio prima) e **priorità rispetto all'attivazione Speciale**: la regola scelta è consumo prioritario del Mortaio, ma serve estendere validazione e risoluzione senza generare azioni gratuite, doppie spese o perdita di carte.
- Con **4 Energie già accumulate** e altre Energie giocabili nella stessa fase dopo che sono state assorbite, il numero di colpi supplementari potrebbe superare quattro nel medesimo turno. Il **tetto di scariche per turno** resta da bilanciare con l'utente.
- Le **Difese** devono poter intercettare ogni impatto secondo le regole già previste; restano validi limiti HP materni, vantaggi/svantaggi elementali, durata e condizioni di sabotaggio.

**Stato:** documentazione soltanto, nessuna alterazione a codice eseguibile, Shop, immagini o 120 esclusive delle navi.
