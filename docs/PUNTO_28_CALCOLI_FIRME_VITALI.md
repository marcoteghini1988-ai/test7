# Eclissi Stellare — Punto 28: calcoli a 2/3 carte e firme dei vitali

**Data:** 6 novembre 2026. **Repository unico:** `marcoteghini1988-ai/test7`, ramo `main`.
**Stato:** regole operative nel prototipo madre singola, firma di prova salvata all'inizio della battaglia, UI e IA collegate. Bilanciamento/firme definitive ancora aperti.

## 1. Calcoli numerici realmente utilizzabili

- La mano numerica rimane **di sette carte**. Il giocatore può selezionarne **due oppure tre**, in qualunque ordine; una quarta selezione sostituisce la più vecchia.
- Con **due carte**: somma, sottrazione, moltiplicazione, divisione seguono le regole preesistenti, inclusa l'inversione di `−` e `÷`.
- Con **tre carte**: si ripete **la stessa operazione due volte, da sinistra a destra**, provando anche diversi ordini delle tre carte. Esempi: `(2 + 3) + 5 = 10`, `(13 − 8) − 2 = 3`, `(12 ÷ 3) ÷ 2 = 2`. Per tre carte ogni risultato intermedio deve essere un **intero positivo**; le divisioni non esatte sono escluse.
- Il risultato deve corrispondere esattamente al bersaglio numerico dell'operazione scelta. Non è una quantità di danno: **il valore di ogni carta rappresenta le munizioni assegnate a una sola arma**.
- Solo le carte numeriche selezionate vengono consumate (2 o 3) e sostituite tramite il mazzo numerico per ritornare a sette. Le **cinque speciali** rimangono indipendenti e non contribuiscono al calcolo.
- Le armi esistenti continuano a rispettare i loro tipi: tiro normale, accumulo, combo simultanea e a memoria. Una terza carta può caricare un'arma ulteriore o aggiungere munizioni allo stesso cannone, ma non moltiplica gratuitamente le munizioni o il danno.
- L'IA conserva la scelta a due carte e può cercare una **soluzione a tre** quando necessario; non riceve numeriche gratuite.

## 2. Quattro firme matematiche fisse per ciascuna madre

- Al momento di creare il combattimento, il gioco assegna una firma di **prova** a ciascun vitale (motore, armi, generatore scudi, centralina). La firma resta **fissa per tutta quella partita**.
- La sua operazione e il bersaglio numerico dipendono dal modello della madre e dalle **operazioni realmente installate e disponibili su entrambe le flotte**; non sono scelti liberamente dall'attaccante a ogni colpo.
- Si accettano **due o tre carte** che soddisfino la firma. In tal modo è possibile completare una battaglia anche quando non emerge subito una combinazione da tre.
- La firma appare sul bersaglio esposto (simbolo operatore, bersaglio, 2/3 carte) e viene mostrata anche nella descrizione del vitale. Scegliere un vitale allinea automaticamente l'operazione della plancia alla sua firma matematica.
- La difesa del vitale mantiene **HP propri**, richiede esposizione tramite soglia di scudo ed è calcolata **all'impatto del proiettile**. Un colpo non valido non provoca danni locali.

## 3. Poker come alternativa sperimentale alla firma matematica

Per introdurre varietà senza lasciare vitale invincibile per mancanza di combinazioni Poker, alcune famiglie hanno **una seconda modalità valida**, non obbligatoria:

| Famiglia | Parte vitale | Alternativa Poker |
| --- | --- | --- |
| Aurora iniziale N00 | Nessuna obbligatoria | Solo percorso matematico |
| Navi C/R/E/L | Sistema armi | **Coppia**, con due carte numeriche dello stesso valore |
| Navi E/L | Centralina | **Tris**, con tre carte numeriche dello stesso valore |

- L'alternativa Poker viene riconosciuta con le carte **della mano numerica**, senza necessità di azzeccare il bersaglio dell'operazione contemporaneamente. Le carte alimentano le armi e si consumano come in un attacco ordinario.
- Ogni vitale che ammette Poker mantiene **sempre** anche il percorso matematico con due/tre carte. L'IA al momento sfrutta il percorso matematico, non ricerca attivamente le alternative Poker.
- Il riconoscimento del Poker classico (doppia coppia, scala, colore, full, poker, scala colore e reale) esiste già nel motore, ma la schermata attiva seleziona soltanto 2/3 numeriche: **non dichiarare queste firme a 4/5 carte già giocabili**.
- Il modello attuale è **sperimentale**, non una scelta definitiva di quali modelli avranno determinati requisiti. Le firme definitive per modello, difficoltà e boss verranno bilanciate e approvate in seguito.

## 4. Integrazione nel gioco

- `src/mathChains.js`: calcolo esatto con 2/3 carte e permutazioni.
- `src/modelSignatures.js`: firma stabile del modello in quella battaglia, alternative Poker delle famiglie, testo di aiuto.
- `src/vitalDefense.js`: verifica vincolante della firma prima di sottrarre HP e alternativa matematica/Poker.
- `src/mathDuelEngine.js`: mano, previsione dei colpi, ricarica 2/3 carte, ricerca IA di triple e inizializzazione dei quattro vitali con firma.
- `src/MathDuelBattle.jsx`, `src/MathDuelBattle.css`: selezione di 2/3 numeriche, presentazione dei risultati, munizioni reali, log e bersagli Poker.
- `src/point28Signatures.test.js`: **17 test nuovi** con calcoli esatti e divisioni, modelli, firme, Poker facoltativo, IA e munizioni. Vecchi test di danno con firma simulata conservati in fixture isolate.

## 5. Limiti dichiarati e prossime fasi

- I requisiti di Poker per combinazioni da quattro e cinque numeriche e i requisiti finali per boss e navicelle **non sono attivi**. Il vecchio motore multi-madre resta separato dalla modalità madre/scudiere.
- L'interfaccia è stata mantenuta in **9:16**, con sette numeriche e cinque speciali; test automatici non sostituiscono prove manuali sul telefono.
- Prossimo **Punto 29 — ritmo, difficoltà, equità e bilanciamento**. Solo dopo le meccaniche: animazioni 3D, grafica e sonoro finali.

**CI della fase:** `npm run verify:logic`, `npm run build`, `npm run preflight`. Prima di indicare un totale di test riusciti, verificare sempre il risultato finale dell'ultimo commit su `main`.
