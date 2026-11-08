# Eclissi Stellare — Dadi, Barra Malus ed equipaggiamenti: SOLO Carte Speciali

**Decisione dell'utente: 8 novembre 2026. Repository ufficiale unico:** `marcoteghini1988-ai/test7`, ramo `main`.

## Principio vincolante

Le abilità **attivabili** devono essere giocate mediante un'istanza **reale** del mazzo speciale da **24**, con mano di **5** e limite di **2 attivazioni speciali per ciclo**. La disponibilità della carica o l'acquisto dell'equipaggiamento **non dà un pulsante di attivazione gratuito**. Il mazzo numerico resta completamente distinto: **52 numeriche / 7 in mano**, stessa plancia verticale 9:16 e stesse navicelle.

### Dado Quantico — carta, non pulsante

- Tipo `tactic-quantum-dice`, presente nel catalogo acquistabile con i pacchetti ordinari, **0 copie nello starter**.
- Tre formule effettivamente valide e con categorie/operazioni differenti caricano il Dado. La carica resta disponibile finché non si gioca una **Carta Dado Quantico presente tra le cinque speciali**. Se la carta non è stata pescata/equipaggiata, non si può lanciare; se la carica manca, la carta non può essere giocata.
- Nel ciclo della carta, ordine segreto di entrambi i giocatori, poi lancio con una delle sei facce tattiche: `module,malus,heal,dust,ether,damage`. Si consumano **una carica e una carta**, e si ripristina la mano speciale dal mazzo autentico.
- Nessuna valuta/premio spendibile è accreditata dal nuovo motore. Le versioni economiche originali richiedono una futura contabilizzazione server.

### Barra Malus — carta, non pulsante

- Tipo `tactic-malus`, **0 copie iniziali**. Le tre tacche sono un semplice **requisito** generato da tre veri colpi ai sistemi vitali; non sono un quarto o un quinto mazzo né un'abilità automatica.
- A carica piena l'utente deve **pescare, scegliere e giocare** la Carta Barra Malus. La carta è consumata e la carica torna a zero. Se la carta manca non parte nessun sabotaggio.
- Un solo disturbo della durata di un ciclo: armamenti, scudo oppure Sincronia. La preparazione avversaria di 30 s non viene mai cancellata completamente.

### Equipaggiamenti Modulo — 35 carte abilità reali

`src/newCombat/phase16FModules.js` contiene **35 moduli autentici** (12 zodiacali, 20 planetari, Singolarità, 2 storici di retrocompatibilità). Essi sono ora registrati come 35 tipi distinti `module-card-<id>` nel catalogo speciale: ogni tipo ha il nome, l'effetto originale di riferimento e **massimo una copia equipaggiabile**.

- `src/tacticalEquipmentCards.js` legge `eclissi_abilities` **senza modificarlo**. Si importano nel nuovo catalogo speciale solo gli ID realmente acquistati (`unlocked:true`) con **livello reale 1–9**. Equipaggiare un modulo nello storico non significa che esso sia già attivato.
- Le Carte Modulo **non sono regalate all'inizio** e **non vengono estratte nei pacchetti normali**: si possiedono solo in seguito all'acquisto/sblocco esistente. Il ponte sulla collezione `eclissi_special_collection_v1` proietta una sola copia, una sola volta e senza alterare le valute, i livelli, il vecchio inventario o il mazzo configurato.
- Per usare un'abilità il giocatore deve **aver inserito la sua carta nelle 24 speciali**, averla in mano tra le cinque e giocarla nel ciclo. È consentita **al massimo una Carta Modulo per ciclo**, rientrando sempre nel limite generale di due speciali. Il motore verifica il livello importato ed esclude una Carta Modulo priva di acquisto.
- Gli effetti tattici sono convertiti dai 19 codici di effetto originali; valori provvisori per il nuovo duello. Cura e danno incidono su **HP veri della barriera**, Sincronia e scudiere reali; scambio/pesca non aggiungono carte oltre le sette numeriche e usano il mazzo reale da 52. I blocchi temporanei non annullano la preparazione simultanea. Alcuni effetti che nel motore storico davano Etere/Boost/munizioni vengono ricondotti alla Sincronia, agli impatti nativi o a ricambi reali del nuovo motore, **senza creare risorse persistenti né proiettili gratuiti**.
- I vecchi bonus passivi dei mazzi numerici boss, le capacità fisiche delle navicelle e i **poteri esclusivi dei nemici boss** non sono confusi con le Carte Modulo: sono sistemi distinti di progressione/combat design. Nessun modulo personale concede più un'abilità a comando separato **nel nuovo duello ufficiale**.

## File cambiati

- `src/tacticalLegacyEvents.js`: il lancio del Dado richiede la vera Carta Dado e carica sufficiente; Barra Malus resta carta.
- `src/tacticalEquipmentCards.js`: catalogo 35, progressione originale, effetti delle carte con consumi autentici.
- `src/specialCards.js`, `src/specialDeckBuilder.js`: 35 Carte Modulo + Carta Dado nel catalogo, proprietà da salvataggio e copia unica; pack solo per Dado.
- `src/simultaneousDuelEngine.js`: validazione dei moduli acquistati, attivazioni dopo sigillatura degli ordini, max un Modulo, HP/barriere/nuove carte reali, conservazione 52/24 e log.
- `src/officialBattleSetup.js`, `src/OfficialBattle3D.jsx`, `src/officialSimultaneousBridge.js`: autorizzazioni dal salvataggio personale, carta Dado selezionata tra le cinque, nessun pulsante di lancio gratuito.
- `src/tacticalDuelAi.js`: IA sceglie solo carte presenti nella propria mano e moduli di cui possiede davvero il livello.
- `src/SpecialDeckPanel.jsx`: Hangar mostra Carte Modulo possedute e livelli reali; non cambia la plancia di combattimento.
- `src/pvpTerrainLoadout.js`: filtro compatibile con motori di combattimento legacy senza scrivere nel mazzo permanente.

## Verifiche automatiche e non verificate

Test di regressione estesi in `src/tacticalLegacyEvents.test.js` e `src/tacticalEquipmentCards.test.js`: 35 moduli, cariche Dado/Malus, 52/24 autentici, limite copie, effetti giocati e non giocati, sette numeriche, nessuna attribuzione gratuita, salvataggio originale idempotente, validazione dello sblocco, difesa da JSON corrotto e IA.

Workflow [GitHub Actions 42463136879](https://github.com/marcoteghini1988-ai/test7/actions/runs/42463136879) al commit `b6f08dbf0a455d17700834f7eb7059ed8b8ee3d7`: **685 test / 685 superati**, `npm run build` e `npm run preflight` superati. Gli ulteriori commit documentali richiedono un controllo successivo.

**Restano aperti:** prova reale 9:16 su Android, bilanciamento e illustrazioni definitive delle 36 nuove speciali/abilità, revisione degli effetti convertiti, e progressiva dismissione dei vecchi pulsanti Modulo in `LegacyPokerBattle.jsx` quando tale modalità sarà migrata completamente al motore simultaneo. Finché esiste il fallback Poker storico, i suoi comandi vecchi non sono automaticamente trasformati in Carte Speciali; la nuova regola è già valida **per il duello ufficiale simultaneo**.

## Principio per le prossime abilità

Nuove capacità attivabili di oggetti, personaggi, equipaggiamenti e moduli devono sempre essere modellate come **Carte Speciali reali da 24**, con disponibilità, mano, consumo, durata, proprietà e validazione. Non aggiungere pulsanti di abilità gratuiti o un terzo mazzo. La natura fisica della navicella e le regole ambientali dei boss sono entità differenti, e non autorizzano l'attivazione gratuita di equipaggiamenti del giocatore.
