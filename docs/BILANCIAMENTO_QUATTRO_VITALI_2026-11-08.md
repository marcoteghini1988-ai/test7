# Eclissi Stellare — quattro vitali, avaria progressiva ed esposizione scelta

**Checkpoint operativo: 8 novembre 2026. Repository unico:** `marcoteghini1988-ai/test7`, `main`. Nessuna copia, nessun redesign della plancia 9:16 o modifica alle 42 armi native.

## 1. Problema verificato
Nel duello simultaneo 30+8, un normale calcolo autentico a 2/3 numeriche produceva 10 HP contro un sistema vitale standard da 10 HP. Un singolo successo non mitigato causava immediatamente KO, saltando la condizione **danneggiato (HP 1–5)** e rendendo poco utilizzabili le differenze fra colpire prima motore, armi, generatore o centralina.

La barriera rimane 60 HP; quattro soglie a 45, 30, 15 e 0 HP permettono di esporre progressivamente i vitali. I bonus di boss, personaggi e carte rimangono condizionati a veri eventi del motore, non concessi gratis.

## 2. Nuovo bilanciamento di base
`src/tacticalPrecisionBalance.js` è l'unica fonte del nuovo danno iniziale della precisione:
- **2 carte numeriche autentiche, calcolo valido: 6 HP**; un vitale 10/10 termina a 4/10 → avaria reale.
- **3 carte numeriche autentiche, calcolo valido: 8 HP**; un vitale 10/10 termina a 2/10 → avaria reale.
- Un secondo colpo valido al medesimo vitale può chiudere il KO. Il danno è sempre limitato agli HP reali disponibili e non dà HP negativi.
- Un bonus condizionato di boss, carta, arena o altra fonte può ancora aumentare/ridurre il colpo ed eccezionalmente permettere KO immediati; le percentuali sono valutate sul **nuovo danno reale di base**. I boss conservano le identità precedenti.
- La Carta Speciale **Faglia** resta a un massimo di 5 HP su un vitale ancora protetto. Non diventa un'attivazione gratuita; mantiene la firma corretta e le contromisure.
- HP standard dei vitali, soglie delle avarie, sincronia, 42 armamenti e massimo **20 cicli** non sono alterati.

La verifica `src/tacticalPrecisionBalance.test.js` copre il colpo da 2 e 3 carte, il secondo KO, le 17 madri x 4 parti x livelli L1/L5 (**136 impatti validi**) con 52 numeriche/24 speciali vere e nessuna distruzione immediata non potenziata.

## 3. Lacuna ulteriore recuperata: target esposto senza Scanner
La simulazione dei dodici boss ha rilevato un blocco: il mazzo iniziale non contiene la carta `tactic-scan`, e l'IA del giocatore non legge le firme nascoste (correttamente). Il motore precedente apriva un vitale dopo il superamento delle soglie **soltanto se il giocatore aveva già indovinato la firma**, rendendo impraticabile il normale percorso di scoperta. Senza Scansione il primo benchmark mostrava **0 danni ai vitali da A in tutti e 12 gli scontri**.

Correzione in `simultaneousDuelEngine.js`, `tacticalDuelAi.js` e `OfficialBattle3D.jsx`:
- Il giocatore seleziona nella plancia **quale** vitale desidera esporre (i pulsanti fisici già presenti sulle quattro parti); l'ordine sigillato trasporta `exposureTarget` distinto da `vitalId` usato per le formule.
- Dopo i **veri impatti** di armi native/scudiere, se la barriera ha aperto una quota e il vitale scelto è integro e ancora nascosto, il motore lo espone. **Zero danni** dal semplice puntamento, zero modifiche agli HP e nessuna carta inventata.
- La firma diventa visibile **solo dopo esposizione effettiva** o dopo una vera Carta Scansione; non è visibile prima nel suggeritore e non è conosciuta dall'IA tramite ordini segreti.
- L'IA ora sceglie un bersaglio da esporre senza conoscere la sua firma. I due lati applicano la stessa regola. Il bersaglio inesistente/distrutto viene rifiutato.
- Se la barriera non raggiunge le soglie, la selezione non concede alcuna informazione; la **Scansione** mantiene il valore strategico di rivelare firme in anticipo. Il semplice puntamento non è un equipaggiamento, un malus o un potere gratis.
- Nessuno spostamento della madre, degli slot, delle scudiere o delle sette numeriche/cinque speciali.

Test: `src/tacticalExposureChoice.test.js` (quattro verifiche nuove su visibilità, soglie, entrambe le flotte, legittimità del targeting e IA senza Scansione). Le suite precedenti che assumevano 10 danni sono state allineate ai valori effettivi, preservando trigger e resti percentuali delle passive boss.

## 4. Benchmark IA x IA (non equivalente a playtest umano)
`src/officialBossEncounter.test.js` stampa un osservatorio deterministico su tutti i 12 boss, seed 171, una configurazione di carta madre L5 con **solo mazzo iniziale** e senza rendere equipaggiabili premi non posseduti. Dopo il fix di esposizione:
- **C01 L5 vs 12 boss**: 11/12 combattimenti producono almeno un colpo A ai vitali nemici (prima 0/12), ma 12/12 si concludono in sconfitta nel campione.
- **L04 L5 vs 12 boss**: 8 sconfitte, **4 pareggi**, 0 vittorie. Undici dei dodici boss ricevono almeno 30 HP di precisione; spesso raggiungono 3 vitali KO su 4, ma non basta a vincere.
- La diversa disponibilità dei poteri/boss, la riproducibilità di un solo seed, l'assenza di mazzi boss giocatore ottenuti realmente, i piloti e l'IA non umana rendono questi risultati **segnali di squilibrio da approfondire**, non una probabilità di vittoria reale.
- Non sono stati manipolati occultamente HP, premi, mani, costi o forza boss sulla base di questi soli dati.

## 5. Stato test e continuità
**GitHub Actions [42486214955](https://github.com/marcoteghini1988-ai/test7/actions/runs/42486214955): 762/762 test, build TypeScript/Vite e preflight grafico ufficiale riusciti.** Il vecchio motore rimane fallback; nessun vero PvP online è stato introdotto.

### Ancora aperto (prossimo punto)
1. Eseguire una matrice di benchmark con più seed, navicelle equipaggiate davvero a vari livelli, mazzi boss e pilotaggi sbloccati, verificando **tempi reali** e non solo risultati teorici; obiettivo storico boss circa 10–12 minuti e 20 cicli massimo.
2. Misurare distribuzione di vittorie, pareggi, frequenza delle 2/3 carte, scelta/ricambio, effetti di scudiere, generatori, centralina e speciali, senza incentivare un unico vitale.
3. Verificare sul telefono che pulsante bersaglio, esposizione visiva e firma rivelata siano chiari, senza spostamenti della grafica metallica approvata. Il collaudo browser Android non è stato eseguito.
4. Non dichiarare definitiva l'economia di pacchetti o il PvP umano sulla base dei test locali. I tutorial rimangono sospesi fino alla stabilizzazione delle regole.
