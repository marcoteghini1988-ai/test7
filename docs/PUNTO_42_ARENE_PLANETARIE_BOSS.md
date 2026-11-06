# Eclissi Stellare — Punto 42: arene in base al pianeta e boss

Decisione del 6 novembre 2026. Si lavora direttamente sul ramo `main` di `marcoteghini1988-ai/test7`; nessuna copia del progetto.

## Regola concordata
- **Arena base**: la Piattaforma di Titanio già integrata, grafica e plancia 9:16 immutate, **nessun effetto tattico**.
- **Arene ordinarie**: i settori del pianeta possono introdurre più o meno effetti, con difficoltà crescente all'interno del pianeta.
- **Arene boss**: il settore 10 di ogni pianeta ha una **propria arena esclusiva**, distinta dalle altre undici.
- Gli sfondi acquistabili nello Shop sono soltanto estetici e non concedono vantaggi.
- Gli effetti sono simmetrici per giocatore e IA; non creano colpi, HP, carte o alterazioni matematiche dal nulla.
- La grafica 3D e l'audio di ciascuna arena saranno sviluppati dopo il consolidamento delle regole.

## Prima progressione giocabile, da bilanciare con test sul campo

| Settore del pianeta | Tipo arena | Numero di effetti |
|---|---|---|
| 1–2 | Piattaforma di Titanio, neutra | 0 |
| 3–6 | Una delle quattro arene tattiche ordinarie, dipendente dal pianeta | 1 |
| 7–9 | Arena avanzata specifica del pianeta | 2 |
| 10 | Arena esclusiva del boss planetario | 2, con intensità specifica |

Il numero di settori non cambia: 12 pianeti da 10 livelli ciascuno. La ripartizione 2/4/3/1 è **provvisoria** e si può correggere dopo i playtest; la neutralità della base e l'unicità delle arene boss sono requisiti fissi.

## Effetti tattici implementati (solo su eventi reali)
- **Detriti:** riduzione del danno a un vero scudo della nave madre (base −8%). Non modifica scudiere o firme dei quattro vitali.
- **Plasma:** +6% al danno di una scarica con **tre numeriche reali e calcolo valido** (non avvia scariche in autonomia).
- **Ionizzazione controllata:** accorcia del 25% la durata della ionizzazione **già applicata da una carta speciale**; non ne crea una.
- **Risonanza:** +1 Sincronia a seguito di un calcolo realmente registrato, senza superare 100.

Le arene avanzate combinano due di questi meccanismi. Le dodici arene boss hanno ID e nomi esclusivi e due effetti di combinazione/intensità differenziata; i valori sono ancora da testare. Non esistono boss che guadagnino automaticamente danno o carte soltanto perché giocano nella propria arena.

## Dodici arene boss

| Pianeta | Arena esclusiva |
|---|---|
| Terra | Bastione della Terra |
| Marte | Forgia di Marte |
| Venere | Corona di Venere |
| Saturno | Anelli di Saturno |
| Urano | Tempesta di Urano |
| Nettuno | Abisso di Nettuno |
| Plutone | Ombra di Plutone |
| Europa | Ghiacci di Europa |
| Proxima b | Orizzonte di Proxima b |
| Haumea | Frattura di Haumea |
| Io | Cuore di Io |
| Encelado | Cripta di Encelado |

## Collegamenti e verifiche
- `src/battleArenas.js`: selettore di arena per pianeta e settore, catalogo 29 varianti (1 neutra, 4 semplici, 12 avanzate e 12 boss), condizioni degli effetti.
- `src/mathDuelEngine.js`: riceve il contesto del pianeta e del livello dal combattimento.
- `src/MathDuelBattle.jsx`: passa i valori reali dell'avventura; mantiene lo sfondo metallico esistente e mostra l'arena tattica corrente.
- `src/battleArenas.test.js`: nove gruppi di test con tutti i 12 pianeti, 120 settori, boss esclusivi, simmetria, colpi reali e mani 7+5.
- Richiedono ancora verifica completa GitHub Actions (`verify:logic`, `build`, `preflight`) e prova interattiva sul telefono; i test scritti non sono automaticamente test riusciti.

## Punto 43 — condizioni ambientali e lettura tattica (6 novembre 2026)

- L'arena neutra resta senza effetti e non viene sostituita graficamente.
- Il pannello **REGOLE DEL DUELLO** mostra la condizione dell'arena corrente, il suo requisito di attivazione e una contromossa concreta. L'indicazione può usare dati esistenti della partita (scudo nemico, numero di numeriche selezionate, Sincronia).
- I quattro effetti già implementati non cambiano la matematica, non creano attacchi e non favoriscono l'IA o il giocatore: Detriti soltanto sullo scudo madre, Plasma soltanto con tre numeriche e calcolo legale, Ionica soltanto su ionizzazione speciale realmente applicata, Risonanza soltanto dopo calcolo accreditato.
- I boss condividono le quattro famiglie ambientali, ma le **12 combinazioni di fattori effettivi** sono ora realmente distinte anche a prescindere dall'ordine delle proprietà. Le variazioni addizionali sono moderate, basate sui gruppi di pianeti; le percentuali con decimali vengono mostrate in modo preciso.
- Il limite di attacco e difesa complessivo resta quello del motore esistente; nessuna modifica alla plancia 9:16, alla mano 7+5, ai mazzi, alle flotte o agli asset.
- La nuova funzione pura `arenaTacticalBriefing` produce testo contestuale senza mutare lo stato. I test verificano tutte le arene boss, l'assenza di effetti collaterali, la progressione dei 120 settori e l'unicità numerica ordinata.

### Rimane da progettare senza introdurlo ora
Cicli ambientali dinamici, nuove condizioni meteo spaziali e grafica/audio esclusiva: non erano stati approvati i valori, la frequenza o le interazioni con carte e boss. Per evitare regole arbitrarie, restano fuori dal codice fino al consolidamento del bilanciamento e ai test di partita.

