# Eclissi Stellare — 10 elementi e attacchi speciali tramite Carte Energia
**18 novembre 2026 · test7/main**

## Decisione di gameplay
La soluzione scelta conserva **gli spari normali e le armi integrate nelle navicelle**, aggiungendo una modalità di attacco distinta: **colpo elementale speciale** attivato da una **Carta Energia** compatibile. È un nuovo percorso strategico, non una riscrittura degli attacchi esistenti.

**Stato del codice a questa data:**
- Inseriti dieci elementi, la matrice vantaggi/debolezze, 17 assegnazioni alle flotte e lo sblocco del secondo elemento nelle navi a doppia affinità.
- La madre in battaglia espone `element` primario e `elements` effettivamente disponibili al suo livello. Hangar mostra forza, debolezza e livello della seconda affinità.
- `elementalAttackProfile` contiene il nome e il segnale grafico del colpo futuro, e dichiara `energyCardRequired: true` e `combatBonusEnabled: false`.
- **NON ancora implementati**: Carte Energia giocabili, slot/interazioni di attivazione, consumi, proiettili/VFX definitivi e danni elementali. Le 170 carte esclusive già implementate restano invarianti, e il combattimento HP non riceve bonus passivi dagli elementi.

## Matrice ufficiale di progettazione

Ogni elemento è **forte contro due**, **debole contro due**, **neutrale contro cinque** (oltre a sé stesso). La formula è simmetrica: A forte contro B corrisponde a B debole contro A.

| Elemento | Forte contro | Debole contro | Colpo elementale proposto | Token grafico |
|---|---|---|---|---|
| 🔥 Fuoco | Terra, Ghiaccio | Acqua, Vento | Raffica di Plasma | `element-fire` |
| 💧 Acqua | Fuoco, Metallo | Ghiaccio, Fulmine | Onda Idrodinamica | `element-water` |
| ❄️ Ghiaccio | Vento, Acqua | Fuoco, Gravità | Lancia Criogenica | `element-ice` |
| ⚡ Fulmine | Acqua, Ombra | Terra, Luce | Scarica Ionica | `element-lightning` |
| 🪨 Terra | Fulmine, Gravità | Fuoco, Metallo | Impatto Tectonico | `element-earth` |
| 🌪️ Vento | Luce, Fuoco | Ghiaccio, Ombra | Vortice di Pressione | `element-wind` |
| ☀️ Luce | Ombra, Fulmine | Vento, Gravità | Raggio Radiante | `element-light` |
| 🌑 Ombra | Metallo, Vento | Fulmine, Luce | Fenditura Oscura | `element-shadow` |
| ⚙️ Metallo | Gravità, Terra | Acqua, Ombra | Sciame Metallico | `element-metal` |
| 🪐 Gravità | Ghiaccio, Luce | Terra, Metallo | Impulso Gravitazionale | `element-gravity` |

Non cambiare questa matrice senza testare nuovamente gli abbinamenti delle 17 navi: una relazione si ripercuote sui ventinove/centinaia di match-up di flotta.

## Assegnazione a tutte le navicelle

| ID | Navicella | Livello max | Elemento principale | Secondo elemento (sblocco) |
|---|---|---:|---|---|
| N00 | Aurora-0 | L20 | **Fulmine** | — |
| C01 | Lince Solare | L19 | **Fuoco** | — |
| C02 | Vespa di Vetro | L18 | **Acqua** | — |
| C03 | Corvo a Impulsi | L17 | **Ombra** | Fulmine · L12 |
| C04 | Dardo Cremisi | L16 | **Vento** | Fuoco · L11 |
| R01 | Falco Binario | L15 | **Metallo** | Vento · L10 |
| R02 | Manta Ionica | L14 | **Fulmine** | Acqua · L10 |
| R03 | Iride | L13 | **Luce** | Terra · L9 |
| R04 | Squalo del Vuoto | L12 | **Ombra** | Terra · L8 |
| E01 | Nebulosa | L11 | **Ghiaccio** | Ombra · L8 |
| E02 | Tempesta | L10 | **Vento** | Fulmine · L7 |
| E03 | Fenice | L9 | **Fuoco** | Luce · L6 |
| E04 | Orizzonte | L8 | **Terra** | Gravità · L6 |
| L01 | Eclisse Reale | L7 | **Luce** | Ombra · L5 |
| L02 | Singolarità | L6 | **Gravità** | Fulmine · L4 |
| L03 | Titano Ossidiana | L5 | **Terra** | Metallo · L4 |
| L04 | Arca Astrale | L5 | **Acqua** | Luce · L4 |

L'elemento principale è immediatamente disponibile. Dove presente, il secondo si attiva verso il **65% del percorso** (`ceil(maxLevel * 0.65)`), almeno dal L2; non concede automaticamente due attacchi o due bonus. All'avvio di un match non è possibile cambiare nave per inseguire il counter.

## Disegno delle Carte Energia — non ancora create nel catalogo
- Progettare **dieci nuove carte generiche Energia**, una per elemento, separate dalle 170 esclusive di navicella. Non riutilizzare gli ID ritirati.
- La carta è giocabile solo se la nave ha l'elemento attivo: un elemento secondario non ancora sbloccato non permette di usarla.
- La carta entra nel sistema di mazzo esistente (limite 40 carte), si pesca normalmente nella mano di sette, occupa uno dei **tre utilizzi di carta per turno** e viene consumata nell'attivazione.
- In un turno si può attivare **al massimo un colpo elementale**; esso **sostituisce** lo sparo normale della madre, non aggiunge uno sparo gratuito.
- I supporti restano passivi. La normale protezione della madre da parte delle scudiere funziona anche con il colpo elementale; l'elemento non consente di bypassare i supporti senza un effetto esplicito.
- L'efficacia si calcola **sull'elemento selezionato per quel colpo**, non sommando sempre tutte le affinità disponibili.
- La debolezza **non indebolisce gli attacchi normali**: entra in gioco esclusivamente con il colpo elementale. Così un giocatore svantaggiato può competere con strategia e difese.
- Nessun costo in una nuova valuta o barra energia: **il costo è la carta spesa**. Non inventare una seconda economia.
- Come primo limite di bilanciamento: una sola Energia per turno e massimo due copie della stessa Energia nel mazzo; soglie di danno e possesso definitivo da verificare dopo il bilanciamento HP e il calcolo dei turni medi.

### Sequenza operativa
1. Il giocatore vede la forza e le vulnerabilità della propria nave e la combinazione avversaria.
2. Pesca e prepara una Carta Energia compatibile (Fuoco, Acqua, ecc.).
3. Sceglie fra **attacco normale** e **attacco elementale**; il secondo consuma la carta e seleziona il bersaglio secondo le normali regole di protezione.
4. Le armi si aprono dalle **stesse parti della navicella 3D esistente**: parte un VFX identificabile per elemento e il colpo raggiunge il bersaglio.
5. Il motore determina blocchi, protezioni, vantaggio/svantaggio elementale, danno/condizione e scarti. L'avversario può rispondere con carte difensive/trappole appropriate.

### Regola di bilanciamento non ancora finalizzata
Possibile primo test: +1 potenza al colpo speciale favorevole, -1 potenza se sfavorito con protezione da annullamento totale, 0 se neutro. **Non inserire nel combattimento questi numeri come fatti** prima di simulazioni con HP definitivi: i differenziali di danno possono essere molto diversi tra un colpo leggero e un colpo con più bersagli.

### Identità grafica obbligatoria
- Gli spari normali e l'arena metallica 3D restano intatti.
- Le dieci Energia devono condividere il formato standard **2:3** e un simbolo elementale leggibile, differenziabile anche senza distinguere i colori.
- L'effetto del colpo elementale modifica la tipologia di proiettile (fiammata, onda liquida, cristalli, archi elettrici, frammenti minerali, vortice, laser luminoso, frattura oscura, sciame metallico, onda gravitazionale).
- Il token VFX in `FLEET_ELEMENTS` è una specifica grafica, **non un'animazione implementata**.
- Illustrazioni e VFX finali da produrre per lotti e verificare prima di inserire asset. Niente modelli 3D alternativi o modifiche alle navicelle originali.

## Scopo strategico della collezione
Dieci affinità e diciassette identità di flotta rendono utili più famiglie, ma non garantiscono da sole che siano necessarie tutte e 17. Le ragioni per collezionare e migliorare devono includere dieci carte univoche, due scudiere con ruoli propri, seconda affinità, fusioni rare, Terreni e boss. Una nave non deve risultare incapace di vincere per il solo elemento nemico.

## Audit
Il registro delle affinità contiene 10 elementi × due vantaggi e due debolezze. Sui 17 modelli la funzione progettuale `projectedElementalMatchup` viene verificata su **289 coppie ordinate**, compresa l'inversione simmetrica. Questi punteggi **non sono win rate reali** e non sono attivi sui danni.
Codice: `src/fleetNext/elementalAffinities.js`, `src/fleetNextElementalAffinities.test.js`, `src/fleetNext/combat.js`, `src/ShipCollectionPanels.jsx`.
