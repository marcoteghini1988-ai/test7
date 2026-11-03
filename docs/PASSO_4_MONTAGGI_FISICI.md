# Passo 4 — motori e armamenti fisici delle prime cinque navi

Verifica del 3 novembre 2026. Base remota: `01999aa72d48eb124fb0442509fb08fdb0e85a65`. Ramo: `work/arena-fleet-layout-2026-11-03`.

## Risultato

I montaggi sono definiti per ID arma e modello, con una bocca precisa per ciascuna vista. Il corpo dell'arma si estende dalla bocca verso la scocca e segue la scala della nave. Il riferimento dei proiettili si trova sulla bocca, senza lo spostamento introdotto prima dalla dimensione o dalla rotazione di una torretta generica.

| Arma | Nave | Montaggio |
| --- | --- | --- |
| W01 — Cannone adattivo | Aurora-0 | Cannone centrale con lente e collari. |
| W02 — Laser Rosso | Lince Solare | Emettitore frontale cremisi. |
| W03 — Lanciatore Prisma | Vespa di Vetro | Camera prismatica sul corpo centrale, con carica visibile. |
| W04 — Mitraglia Verde | Corvo a Impulsi | Batteria meccanica d'ala. |
| W05 — Arco Crepuscolo | Corvo a Impulsi | Arco dorsale sulla seconda gondola. |
| W06 — Pungiglione | Dardo Cremisi | Batteria di aghi sull'ala. |
| W07 — Serbatoio Scarlatto | Dardo Cremisi | Tamburo laterale con indicatore di carica integrato. |

I punti × di Corvo e Dardo sono stati spostati sui moduli ausiliari centrali della scocca, separandoli dalle bocche delle armi. Compaiono soltanto ai livelli in cui il catalogo installa il terzo motore. Aurora continua ad avere due motori.

La carrozzeria conserva i dieci PNG originali delle due viste. Maschere e montaggi SVG riutilizzano gli stessi asset: il danno riduce saturazione e luminosità della sola gondola colpita e della sua scia; fratture, cavità e fumo persistono al KO. I motori integri restano accesi. Non sono stati generati nuovi PNG o duplicati binari.

## Verifiche effettuate

| Prova | Esito |
| --- | --- |
| Immagini reali | Le 14 bocche delle sette armi e i 24 punti dei motori installati a L5 ricadono in pixel opachi degli sprite dedicati. Due bocche del Dardo sono state corrette dopo questo controllo. |
| Nave singola | Aurora caricata in entrambe le viste; bocca normalizzata coerente con la scocca. |
| Tre navi a L5 | Aurora, Corvo e Dardo: sei sprite caricati; montaggi e moduli ausiliari entro le sagome; campo 9:16 invariato. |
| Due navi a L1 | Lince e Vespa: quattro sprite caricati, emettitore e prisma ancorati al corpo nelle due viste. |
| Riferimenti misurati nel browser | Le bocche corrispondono alle coordinate normalizzate previste, con differenze inferiori a 0,0002 dovute agli arrotondamenti di rendering. |
| Primo tiro reale | 6 picche − 3 quadri = 3 sul motore Sottrazione di Aurora: 21 traccianti da tre bocche, convergenti sul centro fisico con errore inferiore a 0,001 unità della plancia; 60 danni, HP da 78 a 18. |
| Stato critico | Una sola regione della carrozzeria oscurata, relativa alla Sottrazione a 18 HP. Addizione a 78 HP e scia integra. Stato critico osservato anche su un motore del giocatore. |
| KO e superstite | 10 fiori − 9 cuori = 1: stesso motore da 18 a 0 HP; gondola annerita e fumo, scia spenta. Addizione selezionata automaticamente e nuovamente selezionata manualmente dopo il passaggio al × del Corvo. |
| Accumulo | Dopo le nove munizioni cuori, W07 mostra il 90% della propria soglia 10 nel tamburo. Regole di accumulo e danno del motore matematico invariate. |
| Controlli | Build TypeScript/Vite, 53 test di logica/geometria, preflight e spaziature. Rimane il warning noto sul bundle grande. |

## File e confini del passo

- `src/mathFleetGeometry.js`: punti fisici, definizioni per ID arma, superfici di danno e stati visivi; i punti di tiro non dipendono dall'ordine delle armi nel catalogo.
- `src/MathDuelBattle.jsx`: rappresentazione SVG della carrozzeria e dei montaggi, carica integrata, riferimenti esatti di bocca e motore. La logica matematica non è stata modificata.
- `src/MathDuelBattle.css`: dimensioni relative, materiali, danno localizzato e fumo; movimento ridotto rispettato per i nuovi effetti.
- `src/mathFleetGeometry.test.js`: copertura del catalogo, separazione bocche/motori e leggibilità dei soli motori realmente installati per cinque livelli e tre formazioni.

La copia StackBlitz va sincronizzata tramite scritture dirette, salvata e controllata dopo reload. Conservare `VITE_ASSET_ROOT`: gli asset pubblici già presenti sono sufficienti. Il piano operativo registra il commit corrente e l'esito del controllo nella copia salvata.

La firma dei proiettili, delle raffiche e degli impatti delle sette armi è il **passo 5**. Questo intervento definisce i montaggi fisici e il danno dei motori; non completa le 42 armi, le evoluzioni L1–L5, l'economia o il test su un telefono fisico.
