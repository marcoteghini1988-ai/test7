# Eclissi Stellare — Carte Terreno PvP (prima integrazione giocabile)

**Stato:** 8 novembre 2026 · repository unico `marcoteghini1988-ai/test7`, ramo `main`. Non sono state create copie o schermate separate.

## Regole implementate

- **Solo PvP locale nel duello simultaneo ufficiale** (30 secondi di preparazione + 8 secondi di risoluzione). Il multiplayer online vero non è ancora collegato.
- Le Carte Terreno sono parte dello **stesso mazzo speciale da 24 carte**, pescato nella mano da cinque. Nessun mazzo Terreno parallelo.
- Una Carta Terreno conta come una delle **massimo due speciali per ciclo**. Non è possibile giocare due Terreni dalla stessa mano nello stesso ciclo.
- Il Terreno modifica **l'ambiente comune**: i pro e i contro valgono per entrambi. Durata **due cicli**, incluso quello di attivazione (parametro provvisorio da playtest).
- Una nuova Carta Terreno, se giocata da uno solo dei giocatori, sostituisce subito il Terreno precedente. Se i due giocatori ne giocano una nello stesso ciclo, le carte vengono consumate e **si neutralizzano**, lasciando l'arena neutra. Gli ordini rimangono simultanei e segreti; nessun vantaggio al primo che conferma.
- Nei boss di Campagna/Avventura e nelle altre modalità non PvP, i Terreni vengono **filtrati** dal mazzo usato per la singola partita e sostituiti soltanto con copie **già possedute**. La collezione e il mazzo salvati restano invariati. Se non bastano copie reali, l'avvio è rifiutato anziché concedere carte gratuite. Il percorso legacy `BossBattle3D.jsx` usa lo stesso filtro per evitare carte morte.
- L'arena dei boss mantiene l'ID esclusivo `boss_ID`. Le arene planetarie ordinarie e gli sfondi cosmetici acquistati rimangono sistemi separati.
- Non vengono introdotti acquisti, ricompense, drop o percentuali di probabilità per ottenere i Terreni: queste regole devono ancora essere decise. Le quattro nuove carte nascono in collezione con **zero copie** e sono escluse dai pacchetti casuali.

## Quattro Carte Terreno iniziali (valori provvisori, entrambi i lati)

| ID | Nome | Vantaggio | Svantaggio |
| --- | --- | --- | --- |
| `terrain-debris` | Campo di Detriti | Danni alla barriera madre −12% | Fuoco nativo −10% |
| `terrain-plasma` | Faglia di Plasma | Fuoco nativo +10% | Danni alla barriera +8%; riparazioni scudo −10% |
| `terrain-ionic` | Tempesta Ionica | Fuoco nativo +8% | Intercettazione scudiere −20% |
| `terrain-resonance` | Camera Astrale | +4 Sincronia per un calcolo numerico valido | Fuoco nativo −8% |

I modificatori sono applicati a **eventi reali del motore**, non danni o cure gratuite. Lo scudo e le scudiere consumano solo HP autentici; il bonus di Sincronia non supera 100. Il Terreno non aggira alcuna firma matematica né rende attaccabili vitali protetti. I numeri dovranno essere bilanciati su 17 navi e 12 boss, senza alterare le capacità già implementate.

## File introdotti / modificati

- `src/pvpTerrainCards.js`: catalogo, durate, conflitto simultaneo, effetti neutri/finali.
- `src/pvpTerrainLoadout.js`: filtro sicuro, nessun premio o mutazione dei salvataggi.
- `src/simultaneousDuelEngine.js`: validazione ordini, modificatori autentici su madre/scudiere/riparazioni/Sincronia, scadenza e log.
- `src/specialCards.js`, `src/specialDeckBuilder.js`: catalogo collezionabile, migrazione vecchi salvataggi con nuovi tipi inizializzati a zero e esclusione dal drop.
- `src/officialBattleSetup.js`, `src/BossBattle3D.jsx`, `src/tacticalDuelAi.js`: filtro non-PvP, IA locale e tutela dei boss.
- `src/PvpTerrainPortrait.jsx`, `src/OfficialBattle3D.jsx`, `src/SpecialDeckPanel.jsx` e CSS: visualizzazione delle carte dentro gli slot e delle scene senza spostare l'arena o le navi.
- `public/assets/terrain-pvp/terrain-{debris,plasma,ionic,resonance}.svg`: **quattro fondali vettoriali provvisori distinti**, non PNG fotografici definitivi.
- `src/pvpTerrainCards.test.js`: scenari per scadenza, neutralizzazione, divieto boss, collezione, pesca, alterazione del danno, ricompense e conservazione di 52/24 carte. Conteggi aggiornati nelle suite esistenti.

## Verifiche effettuate e limiti

**Verificato in questa chat:** tutte le modifiche risultano salvate e lette da GitHub; controllo sintattico JavaScript del motore e dei nuovi moduli riuscito; esecuzione diretta delle funzioni pure dei Terreni (quattro identità, scadenza, interferenza, protezione boss) riuscita.

**Non ancora verificato:** output di `npm run verify:logic`, `npm run build`, `npm run preflight` e test visivo reale 9:16. Lo stato GitHub API di questo commit non fornisce una conferma di CI verde; non dichiarare questo punto chiuso finché non ci sarà prova reale. L'utente ha chiesto di non modificare gli asset approvati delle navicelle: i nuovi ambienti agiscono come livelli separati sopra la scenografia base.

**Ancora da decidere:** come ottenere e migliorare legittimamente le Carte Terreno nel PvP (economie, missioni, eventi); bilanciamento effettivo; eventuale ampliamento dalle quattro iniziali alle otto previste nel vecchio catalogo; PNG definitivi degli ambienti; multiplayer online autentico. Non regalare le carte per renderle testabili.

**Relazione con le Carte Personaggio Boss:** il renderer è collegato, ma i 12 ritratti PNG definitivi restano da approvare e caricare nel repository. I poster generati con identità inventate non sono stati integrati.
