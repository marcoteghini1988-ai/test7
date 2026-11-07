# Eclissi Stellare — ripresa dei 12 boss: abilità ESCLUSIVE del duello simultaneo
**Data:** 7 novembre 2026. **Repository unico:** `marcoteghini1988-ai/test7`, ramo `main`.
**Stato:** SPECIFICA TECNICA DI PROGETTAZIONE, NON IMPLEMENTAZIONE NEL MOTORE.
Non modificare la grafica da questa fase; il collaudo della plancia resta assegnabile a Work.
Le identità e le associazioni pianeta-boss sono recuperate dal codice storico `src/newCombat/phase16DBosses.js`; le abilità proposte qui sono adattamenti provvisori al combattimento simultaneo da 30 s di preparazione e 8 s di risoluzione.

## Distinzioni da preservare
1. **Boss nemico — 12 poteri esclusivi**: identità degli avversari nei settori boss della campagna. Non richiedono una carta speciale gratuita: sono caratteristiche del boss, esplicite e riconoscibili; non vengono automaticamente concesse al giocatore.
2. **Mazzi numerici boss — 23 passive su 12 mazzi**: sistema collezionabile distinto, con 1/2/3 abilità e tre gradi per abilità. Il nuovo motore ha 9 passive convertite in 6 mazzi, 14 ancora da convertire. Non attribuire una passiva a un personaggio boss per semplice omonimia.
3. **Carte Personaggio Boss — futuro**: dodici carte ottenibili dopo una vittoria autentica; saranno temporanee nel mazzo speciale e dovranno avere effetti bilanciati separati, con un solo personaggio attivo alla volta.

## Regole trasversali inderogabili
- Ordini A/B simultanei, sigillati, non modificabili dopo CONFERMA, fallback a scadenza. Nessun boss può leggere l'ordine nascosto, la mano o la pesca dell'avversario prima della risoluzione.
- Le **armi native colpiscono la barriera**; i **calcoli matematici o Poker con firma compatibile** possono colpire **solo vitali esposti**. Nessuna abilità del boss supera la firma o produce un danno a un vitale protetto.
- Tutti gli attacchi aggiuntivi sono modificatori di un **colpo realmente valido e realmente avvenuto**; mai un danno gratuito a fine ciclo, un proiettile generico senza arma, né una cura che risusciti vitali KO.
- Fase/condizioni delle abilità calcolate sul medesimo stato all'inizio del ciclo per entrambe le parti; risultati in ordine deterministico e invarianti scambiando A/B.
- Bonus offensivi cumulati con carte/passive/fusioni soggetti al cap già definito, **+45% sulla salva di partenza**. Mitigazioni e riparazioni rispettano lo scudo/HP autentici e i cap delle passive.
- Un boss non acquista né consuma carte o risorse inesistenti. Ogni costo sottrae davvero la risorsa. Le capacità legate ai tre semi, alle carte scartate, alle fusioni o a status richiedono eventi storici verificati.
- Le abilità nuove devono avere un avviso leggibile prima della decisione; il piano IA deve usare solo informazioni pubbliche e possedute.
- **Tutti i valori che seguono sono candidati di bilanciamento**, non numeri approvati definitivamente. Prima dell'attivazione in campagna: unit test, simulazioni, verifica boss L1/L3/L5 e collaudo pratico.

## Catalogo — una capacità riconoscibile per ciascun boss

| Pianeta ID | Boss | Capacità storica | Proposta nel duello simultaneo e limite | Contromossa verificabile |
|---|---|---|---|---|
| 1 Gaia | Guardiano di Gaia | Corazza tellurica | Una corazza iniziale riduce del **20% il primo danno reale alla barriera**, una sola volta per battaglia. Nessun ripristino HP: mitigazione prima dell'impatto; si consuma solo se effettivamente assorbe danno. | Diversificare attacchi e consumare la corazza prima della precisione; una combinazione valida con **3 semi diversi** su vitale esposto può spezzare una corazza residua. |
| 2 Marte | Colosso di Tharsis | Assalto progressivo | Per ogni **ciclo consecutivo** in cui le armi native infliggono danno effettivo alla barriera, prepara un bonus di **+3% al successivo pacchetto nativo**, massimo **+9%**. Mancato colpo o intercettazione completa azzera la serie. | Spezzare la catena con scudiere/copertura o contromisure reali. |
| 3 Venere | Matriarca Tossica | Neurotossina | Dopo un **colpo di precisione valido e dannoso** del boss, il difensore subisce per **1 ciclo** una penalità di **−10% alla prossima riparazione di barriera**. Non infligge danno differito gratuito e non si accumula oltre una applicazione. | Pulizia Sistemi quando sarà collegata allo status tossina, oppure impedire il colpo di precisione. |
| 6 Saturno | Crono il Distruttore | Controtempo | Se una **Contromisura programmata realmente giocata** blocca una precisione nemica, Crono ottiene **+5% sul proprio successivo impatto nativo** entro 2 cicli, una sola attivazione per ciclo. Nessun ricambio o munizione inventata. | Osservare la contromisura e alternare bersaglio o concentrare la pressione sulla barriera. |
| 7 Urano | Sentinella Ionica | Sifone quantico | Se il boss ha inflitto un danno autentico alla barriera nello scontro, e il giocatore ha **Sincronia positiva**, trasferisce fino a **8 Sincronia esistente** al proprio contatore (rispettando 100). Non avviene dopo attacchi annullati. | Difendere la barriera, spendere bene la Sincronia, bloccare la progressione della Sentinella. |
| 8 Nettuno | Leviatano Abissale | Pressione degli abissi | Quando la barriera avversaria è **≤40% del massimo a inizio ciclo**, il prossimo vero pacchetto di armi native del boss riceve **+8%**, senza danni aggiunti a precisioni errate. | Riparare o proteggere la barriera prima della soglia; neutralizzare le armi. |
| 9 Plutone | Signore delle Ombre | Patto di sangue | All'inizio del ciclo può sacrificare **4 HP reali della propria barriera** (solo con generatore vivo e più di 12 HP barriera) per armare **+8% al pacchetto nativo reale** dello stesso ciclo. Non può agire gratuitamente quando il proprio fuoco fallisce: il costo resta pagato. Massimo una volta ogni 3 cicli. | Sfruttare il prezzo pagato dal boss, bloccare la sua salva o eliminare il generatore. |
| 11 Europa | Idra Criogenica | Rigenerazione criogenica | Se ha colpito realmente la barriera e il **generatore boss è operativo**, recupera all'inizio del ciclo successivo **4 HP dello scudo generale**, max originario, una volta ogni 3 cicli; **non** ripara vitali né scudiere KO. | Colpo valido con seme **Cuori** al vitale esposto nel ciclo precedente impedisce il recupero; oppure mettere KO il generatore. |
| 14 Proxima b | Generatore del Caos | Reattore crescente | Una **carica** per ciclo in cui infligge danno reale alla barriera, cap **3**. Alla terza carica, il successivo colpo nativo effettivo ha **+10%**, poi azzera il contatore. Se non c'è colpo non esplode nulla. Carica sempre visibile. | Interrompere il fuoco o resistere al ciclo di scarica. |
| 17 Haumea | Cristallo di Risonanza | Memoria degli scarti | Se nel ciclo precedente il giocatore ha realmente scartato **2 o più carte numeriche**, il boss può convertire tale informazione pubblica in **+5 Sincronia** solo quando nello scontro successivo colpisce effettivamente la barriera; cap 100, massimo una volta per ciclo. | Evitare ricambi inutili o neutralizzare il pacchetto nativo successivo. |
| 19 Io | Nucleo Magmatico | Ciclo magmatico | Sequenza telegrafata di 3 cicli: **CARICA** (nessun bonus), **ERUZIONE** (+10% sul vero impatto nativo), **RAFFREDDAMENTO** (−10% potenza nativa). Sempre ordinata e riproducibile, senza attacchi autonomi. | Concentrare la difesa nel ciclo Eruzione e contrattaccare nel Raffreddamento. |
| 20 Encelado | Sovrano del Vuoto | Dominio dei semi | Ogni 3 cicli ruota il **seme dominante** fra i quattro semi reali. Una **precisione valida** del boss che usa tale seme ottiene **+7%** danni al vitale esposto; una precisione valida del giocatore con il medesimo seme disattiva il bonus del boss per il ciclo successivo. Nessun cambio occulto della firma. | Preparare un calcolo valido che includa il seme reso pubblico. |

## Stato del codice da cui partire
- `src/newCombat/phase16DBosses.js` conserva il regolamento originale Poker (12 identità); **non** collegarne l'effetto diretto al nuovo combattimento.
- `src/tacticalSpecialPresets.js` già assegna 12 personalità, priorità bersagli e mazzi tattici diversi, con quattro Scansioni reali per scoprire le firme. Non duplicare o regalare speciali.
- `src/tacticalDuelAi.js` prepara ordini senza conoscere quelli del giocatore.
- `src/simultaneousDuelEngine.js` ha `bossPlanetId`, impatti e snapshot; deve ospitare la logica deterministica delle dodici abilità, in un nuovo modulo separato e ben testato, chiamato soltanto sui veri boss.
- `src/officialBattleSetup.js` prepara i boss con gli ID ufficiali; verificare il routing di `MathDuelBattle.jsx`: alcuni boss rimangono in `BossBattle3D.jsx` per compatibilità delle capacità ancora non convertite.
- **Non sostituire le 23 passive dei mazzi numerici** con queste dodici capacità.

## Ordine operativo di attuazione
1. Creare catalogo e stato deterministico dei poteri boss con guardrail: ID 12, una sola capacità per boss, una tantum/cooldown, telegraph e log; primi test su Gaia e Tharsis.
2. Introdurre gli effetti come modificatori nel pacchetto nativo reale (prima o dopo le intercettazioni secondo la singola capacità); per gli status usare la stessa vita/ciclo deterministica. Testare danno a zero, protezioni, ordine A/B, danno simultaneo, limite di +45%.
3. Collegare poteri a boss Venere/Crono/Urano/Nettuno/Plutone/Europa/Proxima b/Haumea/Io/Encelado, uno alla volta e senza premiare il PvP simulato.
4. Verificare la convivenza con i mazzi numerici e le loro 23 passive (9 già migrate, 14 mancanti), con i 33 piloti e con le arene esclusive boss.
5. Solo dopo la verifica dei boss, progettare le **Carte Personaggio Boss giocabili** come speciali temporanee distinte. PNG e restyling rimandati a Work.

## Condizioni di consegna
- `npm run verify:logic`, `npm run build`, `npm run preflight` verdi su `main`.
- Nessuna modifica visuale dell'arena approvata durante questa lavorazione.
- Nessuna migrazione distruttiva della collezione, nessuna copia del repo, nessun boss considerato completo perché solo elencato in questo file.
