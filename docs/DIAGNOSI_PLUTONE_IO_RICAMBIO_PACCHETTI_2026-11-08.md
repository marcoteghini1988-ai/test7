# Eclissi Stellare — diagnosi Plutone/Io, ricambio delle numeriche e pacchetti reali

**8 novembre 2026. Codice operativo:** `marcoteghini1988-ai/test7`, ramo `main`. Documento di collaudo automatico, **non** prova di equilibrio con giocatori umani. Nessuna modifica ai boss, al modello delle dodici madri, ai danni, alle arene o alla plancia 9:16.

## 1. Origine osservata del problema

`src/officialBossStalemateDiagnostic.test.js` riproduce gli incontri con **E03 L5 vs Plutone/settore 70** e **L03 L5 vs Io/settore 110**, entrambi con sole 24 speciali iniziali e pilota iniziale, e registra per ciascun ciclo:
- ordine numerico realmente sigillato e formula effettivamente riuscita;
- vitale colpito e HP finali dei quattro sistemi;
- speciali realmente giocati, esposizione e barriera;
- esito entro i 20 cicli.

**Prima della miglioria al ricambio** (10 seed):
- **Plutone:** **0 vinte / 2 perse / 8 pareggiate**. Su 197 cicli complessivi il giocatore tentava 81 formule, 59 colpi di precisione danneggiavano davvero i vitali, si registravano 26 KO ai vitali boss, ma **non** quattro KO in una singola battaglia. Nei casi più frequenti, il motore del boss rimaneva a 10 o 4 HP.
- **Io:** **4 vinte / 5 perse / 1 pareggiata**. 67 tentativi numerici e 67 impatti validi, 33 vitali boss KO e 36 vitali giocatore KO in totale: il problema è una **corsa contro la pressione offensiva**, non un blocco per il limite dei cicli.
- Nessuna Scansione/Riparazione del giocatore nel campione: **non erano equipaggiate nel mazzo iniziale**, non per difetto di attivazione delle carte. La barriera finale del boss risultava già a zero. **Non è corretto nerfare il generatore o le riparazioni boss** come spiegazione di questi esiti.

## 2. Miglioria implementata: ricambio matematico non casuale

La nuova funzione pura `src/tacticalAiExchange.js` sceglie quale numerica scambiare **soltanto** sulla base della propria mano e delle firme dei vitali **già rivelate**. Per ogni carta in mano calcola quante carte teoriche 1–13 dei quattro semi potrebbero completare una coppia autentica; conserva quelle con maggiore utilità potenziale. Dà priorità alle firme di vitali già danneggiati (possibile KO da 6 HP). Il controllo evita le carte già in mano, ma **non** conosce l'ordine del mazzo, le pescate future, le firme nascoste, le mani e gli ordini nemici.

Quando non ci sono firme conosciute resta il precedente ricambio ciclico 0–6; non viene concessa una seconda sostituzione gratuita. `src/tacticalDuelAi.js` usa la funzione, `src/tacticalAiExchange.test.js` verifica la coppia ipotetica 3×5=15 su un vitale E03 reale, la rotazione senza firma e un mazzo da 52 carte senza duplicati.

**A valle della miglioria**, sul medesimo campione da 10 seed, Plutone passa a **2 vinte / 3 perse / 5 pareggiate**. Io registra **3 vinte / 6 perse / 1 pareggiata**. **Non è una vittoria generale:** la stessa intelligenza viene usata anche dal boss, che può giocare meglio.

### Confronto A/B a 16 seed identici

`src/officialAiExchangeComparison.test.js` isola l'effetto del ricambio, senza cambiare boss, armi o semi. V/S/P:

| Boss | Rotazione entrambi | Ricambio intelligente entrambi | Intelligente solo al giocatore simulato |
|---|---|---|---|
| Plutone | 1/2/13 | 2/4/10 | 2/2/12 |
| Io | 6/9/1 | 5/10/1 | 7/7/2 |

Il benchmark di IA locale contro IA locale **non equivale a suggerire di depotenziare il boss**: un giocatore umano può decidere personalmente quali carte conservare. La nuova IA adotta una selezione più motivata senza conoscere informazione nascosta, e il vantaggio netto dipende dall'avversario.

## 3. I pacchetti guadagnati durante la campagna cambiano la valutazione

Il benchmark con sole speciali starter sottostima l'equipaggiamento teoricamente ottenibile al settore 70/110. `src/officialBossEarnedPacks.test.js` costruisce **quattro diverse estrazioni determinate da seed**, con queste premesse:

- Si ipotizza la vittoria precedente nei settori 1–69 (Plutone) e 1–109 (Io). **Queste partite non vengono simulate in questo test.**
- I crediti pacchetto vengono concessi soltanto tramite la vera funzione `claimFirstWinSpecialPack`: **69 crediti/207 carte estratte** per Plutone, **109 crediti/327 carte estratte** per Io.
- Le carte sono estratte esclusivamente con `openSpecialPack`; il test crea un mazzo da **24 carte** tramite `equipSpecialDeck` scegliendo fra copie possedute. La configurazione preferisce fino a cinque Scansione, cinque Ricambi Numerici, quattro Riparazioni Scudi e contromisure/altre tattiche disponibili.
- È una scelta **intenzionale del mazzo**, non un equipaggiamento automatico che il gioco concede. Non sono regalati personaggi boss, Epici, piloti, livelli, moduli o mazzi numerici boss; la madre rimane una nave ottenibile, L5 **presunto già acquistato**.

Su cinque seed dei combattimenti per ogni estrazione:

| Boss | Starter V/S/P | Mazzo da estrazione V/S/P (quattro seed pacchetti) |
|---|---|---|
| Plutone E03 L5 | **1/2/2** | **2/1/2** in ciascuna delle quattro estrazioni |
| Io L03 L5 | **0/5/0** | **1/3/1** in ciascuna delle quattro estrazioni |

La selezione era effettivamente giocata: nel totale di ciascuna serie da cinque duelli, l'IA ha utilizzato **10 Scansioni, 20 Ricambi Numerici e 11–12 Riparazioni Scudi**. I risultati sono coerenti con una progressione di mazzo reale, ma **modesti** e dipendono dal campione; non dimostrano che tutti i boss siano equamente bilanciati. Le quattro estrazioni producono mazzi simili perché tanti crediti rendono probabile ottenere le famiglie prioritarie: non vanno spacciate per quattro prove di strategie totalmente diverse.

## 4. Decisioni successive

1. **Plutone:** osservare per ciclo l'esposizione dell'ultimo vitale e l'accesso alle formule dopo il terzo KO; valutare scelta obiettivo meno rigida e veri poteri di Scansione e Ricambio, non HP gratuiti.
2. **Io:** misurare l'effetto offensivo del boss separandolo dalla qualità del mazzo, verificando gli esiti su più seed, e offrire contromisure vere e comprensibili.
3. Collaudare mazzi numerici boss già riscattati e sbloccati, Carte Personaggio ed Epici realmente posseduti, senza ammettere inventari fittizi.
4. Non considerare automaticamente definitiva la difficoltà: servono test manuali, esperienza 9:16 Android reale, tempi effettivi e chiarezza delle regole, in particolare prima degli ultimi quattro KO.

**Pipeline verificata:** [GitHub Actions 42511247122](https://github.com/marcoteghini1988-ai/test7/actions/runs/42511247122), **795 test superati**, build Vite e preflight plancia.
