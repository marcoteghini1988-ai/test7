# ECLISSI STELLARE — INCARICO RISERVATO A CHATGPT WORK
## Rifinitura visiva fedele della versione ufficiale (10/11/2026)

**ISTRUZIONE PRIORITARIA rispetto al vecchio handoff del 10/11**: la progettazione del gioco, la creazione degli asset e le modifiche al motore sono gestite nella chat principale di Eclissi Stellare. Work NON deve riprogettare le regole, le carte, i boss, il sistema di danni o la struttura delle schermate. Deve operare soltanto sulla **finitura visiva nel gioco reale** dopo che gli asset sono stati preparati e approvati.

Repository unico: `marcoteghini1988-ai/test7`, ramo `main`. Non creare copie, branch, repository dimostrativi, mockup alternativi o codice di prova. Preservare salvati, inventari, unlock e tutti gli asset.

## Base verificata
- Nuova plancia live: `src/OfficialLiveBattle3D.jsx`, `src/OfficialLiveBattle3D.css`.
- Runtime live: `src/officialLiveDuelEngine.js`, test dedicati.
- Asset nuovi: `public/assets/special-cards/` **66 carte base/Moduli/Epici**, `public/assets/boss-characters/` **12 Personaggi Boss**; gli SVG di `public/assets/terrain-pvp/` coprono **4 Carte Terreno**. In totale, tutte le **82 speciali definite nel catalogo** hanno un asset. `src/officialSpecialCardArt.js` contiene la mappatura per le 66 carte.
- Le 17 navicelle e le 42 armi native hanno modelli e asset originali separati in `public/assets/mathfleet/views/` e nel catalogo `src/phase1FleetCatalog.js`. NON sostituirli con silhouette generiche.
- In battaglia sono definiti 5 slot per lato + Terreno orizzontale, 7 numeriche in mano davanti a 5 speciali. Le trappole restano coperte. No carte arma separabili.
- I 12 Personaggi Boss, i 35 Moduli e i 6 Epici ora hanno illustrazioni SVG dedicate; non inventare altre carte e non usare screenshot generati al posto delle schermate vere.

## Ambito grafico consentito a Work
1. **Plancia di battaglia**: verificare nel browser reale il 9:16, mantenere esattamente disposizione navi, scudiere, mazzi, mano e 5+5 slot distanziati, terreno centrale orizzontale; migliorare dimensioni, nitidezza, scala, animazioni e leggibilità senza cambiare posizioni approvate.
2. **Home**: mantenere pulsanti, informazioni, ordine, funzioni, coordinate relative e struttura attuale. Migliorare SOLO trattamento grafico (sfondi, texture, bordi, font, effetti luce, immagini approvate), per portarla alla qualità visiva della plancia. Non fare una Home alternativa.
3. **Shop**: mantenere sezioni, prezzi, inventari e acquisti; migliorare qualità di schede, immagini e UI senza cambiare logica.
4. **Hangar / Assetto pre-battaglia / Flotte**: mantenere la sequenza di configurazione e tutti gli slot funzionali; usare i 17 modelli veri e le immagini reali delle scudiere, mantenere l'accesso ai mazzi, piloti e moduli.
5. **Personaggi, 24 Carte Speciali equipaggiabili, boss, epici, moduli**: integrare e rifinire gli asset originali in tutte le schede, mantenendo rettangoli proporzionati e le rarità del catalogo. Il mazzo contiene 24 carte equipaggiate, NON 24 tipi totali.
6. **Campagna / PvP / profilo e risultati**: uniformare lo stile grafico, senza riscrivere progressione e abilità. **DECISIONE UTENTE 10/11/2026: il PvP deve restare SIMULATO/LOCALE per il momento.** Non introdurre server, matchmaking, account online, Firebase, API key, websocket, costi o connessioni reali; non trasformare il PvP in una funzione online durante il restyling.

## Vincoli di verifica
- Prima di fare il restyling, recuperare l'ultimo riferimento visivo approvato nella chat del progetto. Le immagini di mockup storici o non approvati NON lo sostituiscono.
- Catturare screenshot dal gioco **REALE** prima/dopo, non immagini generate che fingono l'interfaccia funzionante.
- Non modificare gameplay, numeri, formule, AI, dati del catalogo o regole delle carte. Eventuali bug scoperti vanno segnalati alla chat principale per la correzione.
- Esclusivamente su main, con commit piccoli e testati. Non sprecare l'intera sessione Work in studio teorico.
- Verificare `npm run verify:logic`, `npm run build`, `npm run preflight` e vista mobile 9:16.

## Prima operazione della sessione Work
Controllare lo stato corrente di `main` e gli asset reali, recuperare eventuale lavoro rimasto non pubblicato nella precedente sessione, evitare di sovrascrivere modifiche recenti della chat principale. Pubblicare subito le modifiche già testate, dopo confronto con HEAD corrente.

**Obiettivo: portare l'interfaccia esistente al livello della plancia approvata, NON ricominciare la progettazione del gioco.**
