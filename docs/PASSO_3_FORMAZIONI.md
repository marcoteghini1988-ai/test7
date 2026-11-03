# Passo 3 — formazioni affiancate

Verifica del 3 novembre 2026. Base remota: `acf06bda6a4aaef416c1c626e0e826b35d7531c9`. Ramo: `work/arena-fleet-layout-2026-11-03`.

## Risultato

La selezione non sposta né ingrandisce una nave. Ogni lato ha posti fissi e una scala comune dipendente soltanto dal numero delle proprie navi. La plancia rimane 450 × 800, scalata al dispositivo nel rapporto 9:16.

| Navi per lato | Centri orizzontali nella plancia | Dimensione del canvas per nave |
| --- | --- | --- |
| 1 | 225 | 218 × 218 |
| 2 | 121, 329 | 184 × 184 |
| 3 | 83, 225, 367 | 124 × 124 |

Tutti i motori installati restano visibili sulle rispettive navi. Toccando un motore nemico si selezionano insieme l'operazione e la nave esatta. Le letture HP si riducono e si separano quando i motori sono ravvicinati. I riferimenti dei proiettili distinguono lato, indice della nave e operazione; il KO mantiene il passaggio ai bersagli superstiti.

La configurazione di prova può scegliere separatamente la flotta avversaria. L'opzione predefinita conserva la stessa flotta del giocatore. Questa scelta serve a provare quantità differenti; non acquista navi e non modifica la collezione permanente.

## File interessati

- `src/mathFleetGeometry.js`: posti fissi, dimensioni e separazione delle letture dei motori.
- `src/MathDuelBattle.jsx`: tutti i motori montati contemporaneamente, selezione diretta per nave/operazione e riferimenti dei proiettili distinti per nave; flotta avversaria configurabile nella prova.
- `src/MathDuelBattle.css`: riga e scala uniformi, oscillazione comune della formazione e indicatori compatti.
- `src/mathFleetGeometry.test.js`: invarianti di margini, centratura, intervalli e separazione degli indicatori per cinque modelli, entrambi i lati e tre quantità.
- `README.md`: stato corrente e prossimo passo.

## Collaudo dell'anteprima di lavoro

| Prova | Riscontro |
| --- | --- |
| 1 contro 1 | Aurora centrale per lato; canvas 218 × 218. |
| 2 contro 1 | Aurora e Lince affiancate, canvas 184 × 184; avversario centrale a 218 × 218. |
| 1 contro 3 | Aurora centrale contro Aurora, Lince e Vespa affiancate a 124 × 124. |
| 3 contro 3, livello 5 | Aurora, Corvo e Dardo affiancati per lato; 8 motori visibili per lato, inclusi i due × sbloccati. |
| Indicatori | Nessuna intersezione fra le letture HP misurate nei quattro casi. |
| Cambio bersaglio | Selezionato il − del Dardo a destra: coordinate orizzontali e dimensioni di tutte le navi invariate. |
| Primo tiro laterale | 13 cuori + 4 picche = 17: Addizione del Dardo da 103 a 11 HP; gli altri motori nemici invariati. |
| Tiro e KO | 4 fiori + 6 picche = 10: Addizione del Dardo da 11 a 0 HP. 26 traccianti osservati da quattro bocche di fuoco; tutti convergenti sul motore della nave destra, con errore geometrico misurato inferiore a 0,001 unità della plancia. |
| Dopo KO | Bersaglio passato al × superstite dello stesso Dardo; selezione manuale del superstite riuscita; risposta IA e turni successivi osservati. |
| Campo e mano | 526,5 × 936 pixel nel browser, rapporto 0,5625; sette carte presenti in tutti i casi. |
| `npm run build` | TypeScript e Vite completati. Warning sul bundle grande già noto. |
| `npm run verify:logic` | 51 test superati, zero errori. |
| `npm run preflight` | Struttura e import locali validi. |
| `git diff --check` | Nessun errore di spaziatura. |

## Consegna e limiti

La copia di consegna è `https://stackblitz.com/edit/github-edu2s6xy?file=README.md`. Dopo la sincronizzazione dei sorgenti va salvata e ricaricata, poi verificata nel suo WebContainer. La configurazione pubblica `VITE_ASSET_ROOT` già presente va conservata: i nuovi asset binari rimangono ospitati su GitHub.

Il layout non equivale a completare i montaggi fisici delle armi. Le torrette e le bocche di fuoco già presenti, l'aspetto fisico dei motori danneggiati e le differenze tra modelli restano da rifinire nel passo 4. Restano inoltre i testi legacy, le segnalazioni di simboli inutilizzati, il bundle grande e la prova sul telefono fisico. Non sono stati modificati catalogo, danni, economia, progressi o durata dei turni.

**Prossimo: passo 4 — prime cinque navicelle, motori e armi integrati alle parti fisiche.**
