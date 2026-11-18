# Eclissi Stellare — distribuzione 170 esclusive e studio delle affinità elementali

> **Aggiornamento del 18 novembre 2026 — sistema elementale ampliato.** La sezione qui sotto descrive la precedente bozza a quattro affinità. È stata superata dalla matrice a **dieci elementi**, con i colpi elementali da attivare tramite Carte Energia. Gli sblocchi delle 170 esclusive descritti in questo file rimangono validi. Per la versione attuale consultare [Energia elementale e attacchi speciali](./ENERGIA_ELEMENTALE_E_ATTACCHI_SPECIALI_2026-11-18.md).

**17 novembre 2026 · repository ufficiale test7/main**
**Stato:** sblocchi carte attivi nel gioco; elementi assegnati alla nave, ma bonus/malus di danno ancora NON attivi nella modalità HP ufficiale.

## Distribuzione definitiva degli sblocchi (prima calibrazione)
- 17 navi × 10 carte esclusive = **170 carte**, incluse le 45 varianti introdotte nello stesso giorno.
- Ogni madre parte con **4 carte**: Personaggio, attacco, difesa e una carta identitaria/tattica (per Arca, la Fusione).
- Le altre **6 carte** si sbloccano nelle sei tappe elencate. Le tappe ripetute alle Legendary L5/L6 assegnano più carte nello stesso livello, non livelli inesistenti.
- La carta Fusion della Corona resta L5, quella di Ossidiana L3, quella dell'Arca L1. Mai più di due supporti in campo.
- Le vecchie carte tecniche `prog-fusion-*` restano nel registro per compatibilità, ma non vengono più duplicate nei mazzi automatici: le 10 carte native bastano.
- Le carte possono essere **acquisite** al livello indicato; possono comunque risultare non utilizzabili in battaglia se Arsenale, Generatore, Centralina o scudiere necessarie sono disattivati.
- Gli sblocchi sono applicati in `src/fleetNext/rules.js` da `src/fleetNext/exclusiveUnlocks.js`. `effectiveDeck`, `exclusiveOperational`, Shop/Hangar e battaglia usano gli stessi livelli.

| ID | Nave | Livello max | Sei livelli di sblocco | Elemento primario | Secondario progettato |
|---|---|---:|---|---|---|
| N00 | Aurora-0 | 20 | 4 · 7 · 10 · 13 · 18 · 20 | Elettricità | — |
| C01 | Lince Solare | 19 | 4 · 7 · 9 · 13 · 17 · 19 | Fuoco | — |
| C02 | Vespa di Vetro | 18 | 3 · 5 · 8 · 11 · 15 · 18 | Acqua | — |
| C03 | Corvo a Impulsi | 17 | 3 · 5 · 8 · 11 · 14 · 17 | Elettricità | Terra |
| C04 | Dardo Cremisi | 16 | 3 · 5 · 8 · 11 · 14 · 16 | Fuoco | Elettricità |
| R01 | Falco Binario | 15 | 3 · 5 · 7 · 10 · 13 · 15 | Fuoco | — |
| R02 | Manta Ionica | 14 | 3 · 5 · 7 · 10 · 12 · 14 | Elettricità | Acqua |
| R03 | Iride | 13 | 3 · 5 · 7 · 9 · 11 · 13 | Acqua | Terra |
| R04 | Squalo del Vuoto | 12 | 3 · 5 · 7 · 9 · 11 · 12 | Terra | — |
| E01 | Nebulosa | 11 | 2 · 4 · 6 · 8 · 10 · 11 | Acqua | Elettricità |
| E02 | Tempesta | 10 | 2 · 4 · 6 · 8 · 9 · 10 | Elettricità | Fuoco |
| E03 | Fenice | 9 | 2 · 3 · 5 · 6 · 8 · 9 | Fuoco | Acqua |
| E04 | Orizzonte | 8 | 2 · 3 · 4 · 6 · 7 · 8 | Terra | Acqua |
| L01 | Eclisse Reale | 7 | 2 · 3 · 4 · 5 · 6 · 7 | Fuoco | Terra |
| L02 | Singolarità | 6 | 2 · 3 · 4 · 5 · 5 · 6 | Elettricità | Fuoco |
| L03 | Titano Ossidiana | 5 | 2 · 2 · 3 · 3 · 4 · 5 | Terra | Fuoco |
| L04 | Arca Astrale | 5 | 2 · 2 · 3 · 3 · 4 · 5 | Acqua | Elettricità |

### Esempio Aurora-0
L1: Cartografo Aurora, Ottica di ricognizione, Raffica di prova, Velo di salvataggio. 
L4: Tiro di smontaggio. L7: Adattamento immediato.
L10: Canna perforante e prima scudiera Velo Aurora.
L13: Corazza modulare. L18: Cannone biforcato e seconda scudiera Lancia Aurora.
L20: Riconfigurazione Aurora; tutte le 10 carte sbloccate.

## Studio del sistema elementale
Il precedente `src/fleetCardEngine.js` aveva già quattro affinità e una relazione ciclica. Il nuovo file `src/fleetNext/elementalAffinities.js` conserva i 17 **primari preesistenti**, aggiunge la classificazione progettuale delle doppie affinità e rende disponibile una funzione di confronto calcolabile. Il codice `createFleetMother` espone ora `element` e `elements`, e l'Hangar mostra i nomi; **il combattimento HP NON applica ancora i punteggi del confronto elementale**.

### Contromosse, coerenti con il vecchio motore
- **Acqua/Ghiaccio (refrigerant) > Fuoco/Plasma (plasma)**
- **Fuoco/Plasma > Terra/Minerale (mineral)**
- **Terra/Minerale > Elettricità/Ionico (ionic)**
- **Elettricità/Ionico > Acqua/Ghiaccio**

Esempio: nel modello preesistente, un giocatore con una nave **Fuoco** contro **Acqua** è svantaggiato, a parità di progressione. La nave Acqua ha il vantaggio. Un'inversione di questa regola richiede una decisione esplicita, per non contraddire il sistema storico.

### Come rendere competitivo il secondo elemento
- L'elemento **primario** conserva l'impatto maggiore. Il **secondario** pesa meno: nel calcolatore progettuale, primario peso 2 e secondario peso 1.
- L'elemento secondario può mitigare una debolezza, non concede automaticamente un doppio bonus.
- La funzione `projectedElementalMatchup` restituisce `favorevole`, `sfavorevole` o `neutrale` in maniera simmetrica sui 289 accoppiamenti possibili; il punteggio non viene usato per infliggere danno.
- **Da decidere:** sblocco del secondo elemento a metà della progressione della nave o presente dal primo livello. Un secondo elemento sempre attivo non deve essere un potenziamento gratuito rispetto alle monoelementali.

### Ipotesi per il futuro bonus battaglia (non applicata)
- Vantaggio elementale lieve, ad esempio **+1 potenza al primo attacco valido di un round**, oppure un bonus percentuale controllato quando gli HP sono definitivi.
- Svantaggio speculare, ma **nessun blocco totale del danno e nessuna vittoria automatica**.
- Niente somma illimitata di vantaggi fra elemento, Terreno e carte, niente doppia attivazione di due elementi nello stesso colpo.
- Un effetto strategico esplicito può neutralizzare temporaneamente la debolezza elementale, senza cambiare permanentemente nave o renderla onnipotente.
- Contro gli avversari della campagna si dovrebbe conoscere l'elemento prima di scegliere la madre; una volta avviato il match, **nessuna sostituzione**.

### Perché il solo elemento non basta a far migliorare 17 navi
Con quattro elementi, al giocatore potrebbero bastare quattro navi per coprire i match-up. Per valorizzare tutte e 17 servono inoltre **abilità delle scudiere, sinergie delle 10 esclusive, doppi elementi, condizioni dei Boss e Terreni**, con ruoli veramente differenti. Il vantaggio elementale deve aumentare le scelte senza trasformarsi in obbligo di acquisto o in vantaggio pay-to-win.

## Verifica e stato operativo
- Sblocchi: nuova suite `src/fleetNextExclusiveUnlocks.test.js`; verifica di costruzione del registro 170/170 e soglie confermate su tutte le navi.
- Elementi: nuova suite `src/fleetNextElementalAffinities.test.js` e 289 confronti di simmetria.
- Sintassi dei moduli JS modificati controllata; suite completa npm/build **non eseguita** in questo passaggio per mancanza dell'ambiente Git nella sessione. Le vecchie suite di combattimento progettate per tutte le 10 esclusive al L5 richiederanno una rivalutazione delle fixture a livelli inferiori alla nuova soglia.
- Bilanciamento complessivo HP, danni, passivi, contromosse elementali e test PvP a potenziale 100: **ancora da svolgere**. Non aggiornare i valori delle armi in questa fase.
