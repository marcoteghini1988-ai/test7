# Eclissi Stellare — Punto 26: danni localizzati ai quattro vitali
Data: 6 novembre 2026. Repository ufficiale: **marcoteghini1988-ai/test7**, ramo **main**.
Stato: **prima implementazione logica e HUD con test automatici riusciti; valori e grafica finale ancora da provare**.

## Regole comuni
- Il gioco continua a usare la navicella madre con scudo generale e quattro sistemi separati: **motore, sistema armi, generatore scudi, centralina**.
- Gli HP sono **individuali** per ciascuna parte e non vengono azzerati da un singolo attacco a meno che il danno lo giustifichi.
- L'attaccante deve prima raggiungere una soglia dello scudo e **scegliere una parte esposta**. Serve la firma matematica/Poker del componente: una combinazione sbagliata o una parte protetta non subiscono danni.
- L'effetto reale di ogni colpo viene applicato **all'arrivo del proiettile**, alla situazione degli HP e delle scudiere in quel momento.
- Stato **OPERATIVO**: oltre 50% degli HP; **AVARIA**: 50% o meno, ma maggiore di zero; **KO**: zero.
- Ogni passaggio allo stato AVARIA o KO produce un avviso **una sola volta**. I colpi successivi nello stesso stato non duplicano la notifica.
- Le penalità numeriche del prototipo sono valori provvisori; nessun risultato delle carte cambia seme o produce automaticamente riparazioni.

## Conseguenze reali

| Sistema | AVARIA, 0% < HP <= 50% | KO, 0 HP |
| --- | --- | --- |
| **Motore** | -10% potenza di fuoco della madre e delle scudiere | -25% potenza di fuoco della madre e delle scudiere |
| **Sistema armi** | -20% potenza di fuoco **solo della madre** | -50% potenza di fuoco **solo della madre** |
| **Generatore scudi** | -50% efficacia delle **future riparazioni** dello scudo generale | Azzeramento immediato dello scudo generale residuo e blocco di tutte le riparazioni |
| **Centralina** | -15% potenza delle scudiere, coordinazione ancora operativa | -40% potenza scudiere e disattivazione dell'intercettazione/coordinazione |

Gli effetti di motore, armi e centralina si **combinano** sui colpi reali, tenendo conto della singola arma e delle scudiere: per esempio motore in avaria + armi in avaria implica circa 72% della potenza originaria della madre. Nessun danno o HP viene creato artificialmente.

**Nota sul generatore:** la riparazione dello scudo è già una funzione di motore, ma le carte/abilità di riparazione definitive non sono ancora state implementate nel mazzo speciale. La penalità progressiva sul generatore si applica a quella funzione quando viene invocata; non equivale a una carta di cura già presente nell'interfaccia.

## UI e battaglia
- I quattro comandi nella plancia di attacco mostrano **HP / AVARIA / KO** distinti.
- Il pannello inferiore della flotta del giocatore segnala i sistemi compromessi, senza cambiare il layout 9:16 o il numero delle carte.
- I log di battaglia notificano il passaggio da OPERATIVO ad AVARIA, e successivamente a KO, includendo le conseguenze.
- Restano le **sette numeriche + cinque speciali** separate, la Copertura Tattica, le due Fusioni tramite carta speciale, i ruoli e la collaborazione delle scudiere.
- Il prototipo madre singola usa questo sistema; la formazione legacy con due/tre madri resta in un motore separato fino alla migrazione concordata.

## Implementazione e verifica
- `src/fleetSystems.js`: stati per componente, penalità progressive e danno reale delle armi.
- `src/vitalDefense.js`: perdita di efficienza del generatore durante le riparazioni, nessuna riparazione quando è KO.
- `src/mathDuelEngine.js`: rilevazione della prima AVARIA/KO durante l'impatto.
- `src/MathDuelBattle.jsx` e `src/MathDuelBattle.css`: stato dell'unità vitale e avvisi leggibili nella plancia esistente.
- `src/localizedSystems.test.js`: 12 nuovi scenari su firme, soglie, KO, fallimenti, potenza delle armi e scudi. Totale **225 test logici** riusciti su CI, insieme a `npm run build` e `npm run preflight`.

## Restante lavoro
- Definire le firme **per modello** dei quattro vitali e l'eventuale matematica a 3 carte e le firme Poker definitive (punto 28); non attribuire capacità non concordate.
- Bilanciare le 17 famiglie e 5 livelli con veri playtest; verificare la disposizione 9:16 e i controlli da dispositivo.
- Prossimo blocco **Punto 27: effetti strategici dei colpi e delle armi**, da implementare dopo aver definito costi, durata, interazioni e contromisure. **Audio e grafica finale rinviati** come richiesto.
