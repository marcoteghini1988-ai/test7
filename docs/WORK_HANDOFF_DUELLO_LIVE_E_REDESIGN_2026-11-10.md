# ECLISSI STELLARE — HANDOFF UFFICIALE A CHATGPT WORK (10/11/2026)

**Leggere PRIMA di modificare il codice.** Repository UNICO: marcoteghini1988-ai/test7, ramo main, StackBlitz collegato. NON creare fork, copie, branch di prova o un nuovo gioco. Tutto deve proseguire direttamente sulla versione ufficiale. I salvataggi e gli asset reali devono restare intatti.

Questo testo distingue **decisioni approvate**, **implementazione attuale** e **punti ancora incompleti**. Non dichiarare completati gli ultimi punti finche non sono implementati e collaudati.

## 1. Decisioni approvate dall'utente — duello in diretta

- Abbandonare nel percorso ufficiale la pianificazione simultanea 30+8 secondi. I nuovi turni sono **alternati**: 30 secondi del giocatore, poi 30 secondi dell'avversario. Durante il turno altrui si osserva e non si giocano mosse manuali.
- Le azioni producono risultati **immediati** mentre il tempo scorre: consumo carta, caricamento arma, animazione proiettile, danno barriera, attivazione trappola, scoperta/distruzione vitale o cambio di terreno.
- **Nessun fuoco automatico**. Le armi montate sulla nave sparano soltanto quando vengono alimentate da una carta numerica compatibile.
- Max **3 carte numeriche + 2 Carte Speciali** per giocatore nel proprio turno. Le trappole, già pagate e piazzate in turni passati, scattano senza sottrarre azioni al turno avversario.
- Rimangono due mazzi separati: **52 numeriche (7 in mano) e 24 Speciali equipaggiate (5 in mano)**. La scelta fra ricambio immediato o all'inizio del proprio turno successivo non è stata approvata definitivamente. Nel primo motore live implementato il ricambio avviene all'inizio del proprio turno.
- Le **17 navicelle e 42 armi REALI** sono in src/phase1FleetCatalog.js; conservare tipi, danni, semi, visuali, livelli e montaggi. Il codice usa il campo seme_trigger (H=Cuori, D=Quadri, C=Fiori, S=Picche, *=universale). N00 Aurora-0 e' universale ma meno potente. Altre navi possono avere uno, due, tre o quattro semi.
- Trascinando una numerica sulla nave, il numero e il seme si trasformano in energia che carica l'arma integrata e fa scendere la barra di protezione avversaria. La formula base concordata e' la **somma dei valori delle carte assegnate moltiplicata per il danno base dell'arma/nave**, da bilanciare senza inventare altre armi.
- Le barriere hanno soglie al **75%, 50%, 25%, 0% residui**. Quando una soglia concede l'esposizione, il giocatore sceglie quale dei quattro vitali scoprire.
- Cliccando sul vitale appare un piccolo pannello con gli slot NUMERICI della combinazione richiesta. Nessuna Carta Speciale negli slot del vitale. Le numeriche depositate **rimangono anche fra piu turni**, pur rispettando il limite 3 a turno. Poker da 4+ carte richiede almeno due turni.
- **Una combinazione completa e valida distrugge direttamente il vitale**, una sola volta: l'animazione e' un'esplosione localizzata del pezzo, non un proiettile da una nave. I quattro pezzi sono Motore, Armi, Generatore, Centralina e hanno conseguenze strategiche distinte.
- **5 slot speciali per giocatore:** Personaggio | Trappola coperta 1 | Trappola coperta 2 | Scoperta 1 | Scoperta 2. Tra ogni carta c'e' uno spazio visivo evidente; i gruppi non devono unirsi.
- La trappola rimane nascosta e si attiva da sola quando l'azione avversaria soddisfa la sua condizione. **Due trappole possono attivarsi sullo stesso attacco se hanno FUNZIONI DIVERSE**. Una trappola inutile o duplicata rimane posizionata.
- Al centro, **uno slot Terreno ORIZZONTALE**. In PvP, giocarci una Carta Terreno cambia immediatamente sfondo e regole di entrambe le flotte. Rimane fino a sostituzione da un altro terreno; non scade dopo un ciclo. I boss in campagna impongono l'arena esclusiva, non sostituibile.

## 2. Grafica: ultimo screenshot dell'utente = riferimento, NON una nuova invenzione

L'ultima schermata approvata nella conversazione mostra: arena metallica 3D spaziale 9:16; formazione nemica madre al centro alto, due scudiere laterali quando presenti; formazione propria madre al centro basso, scudiere laterali se esistono; due sottili HUD alto e basso, tre barre in presenza di tre navi; mazzo numeriche a SINISTRA, speciali a DESTRA, entrambi bassi senza scritte o contatori sotto; mano in basso con **sette numeriche davanti alle cinque speciali semi-nascoste dietro**; slot delle carte centrali in prospettiva di tavolo, una fila per lato, cinque carte distanziate; un solo slot terreno orizzontale fra le file.

**TUTTO quello che non e' oggetto della singola modifica va lasciato nella stessa identica posizione**. Non spostare navi, mano, HUD, mazzi o sfondo per inserire slot. Non creare grandi pannelli, spessori inutili o griglie astratte. Gli asset delle navi DEVONO provenire dal gioco reale.

Gli screenshot presenti in docs/screenshots potrebbero riferirsi alla vecchia plancia; l'ultimo screenshot approvato e' nella chat dell'utente: recuperarlo prima di un restyling. Riferimenti codice/materiali: public/assets/mathduel/arena_titanio_9x16.webp, public/assets/mathfleet/views, public/assets/escorts e docs/screenshots.

Tutte le carte collezionabili (navicelle, Personaggi, Speciali) dovranno usare le stesse proporzioni RETTANGOLARI delle carte numeriche, con immagini originali PNG/WebP ad alta risoluzione, bordo diverso per le quattro rarita del catalogo (Comune, Rara, Epica, Leggendaria), identita ed effetti REALI letti dal codice. Mai inventare rarita, navi, personaggi, caratteristiche o immagini a caso.

## 3. Cosa e' stato implementato su MAIN il 10/11

- src/officialLiveDuelEngine.js: nuovo stato di gioco live a turni alternati da 30s, danno immediato alla barriera per carta/suite arma originale, scelta soglia ed esposizione, combinazioni numeriche persistenti, distruzione del vitale, trappole che reagiscono e possono concatenarsi se diverse, terreno PvP persistente, limite 3+2, vittoria e turno successivo.
- src/OfficialLiveBattle3D.jsx e src/OfficialLiveBattle3D.css: nuova schermata ufficiale 9:16 con navi REALI montate, 5 slot per lato e Terreno orizzontale, 5 carte speciali dietro 7 numeriche, mazzi ai lati, barra 3 navi, timer, registro, touch/tap e drag/drop, pannello bersagli vitali e IA locale.
- src/MathDuelBattle.jsx usa la nuova schermata per tutti gli scontri abilitati. Gli incontri di salvataggi incompatibili mantengono fallback in src/BossBattle3D.jsx per evitare perdita di progressione.
- src/officialBattleSetup.js, src/officialBattleResult.js e le collezioni originali restano sorgenti di verita' per navi, mazzi, boss e premi genuini. Nuovo test src/officialLiveDuelEngine.test.js. Aggiornati i controlli in scripts/check-official-3d.mjs.
- src/simultaneousDuelEngine.js e src/OfficialBattle3D.jsx sono il **vecchio runtime** per test/regole precedenti e riferimenti: non sono piu il percorso di gioco ufficiale. NON cancellarli finche non si sono migrati i poteri boss e le Carte Speciali ancora usati.

**Importante:** il primo motore live e' un'integrazione funzionante ma ancora con capacita mancanti. Non dire a utente che tutto il gioco e' stato completato.

## 4. Punti da completare PRIMA di dichiarare la nuova meccanica definitiva

1. **Migrare TUTTE le Carte Speciali e tutte le condizioni** dal vecchio motore (Dado Quantico, Barra Malus, Numero Bomba, Carta Dorata, Faglia, Mutazione di Firma, ricambi speciali, moduli equipaggiamento, epici/reliquie, fusioni avanzate, carte Personaggio e loro durata/reazioni). Nel primo live non tutte sono supportate: unsupported e' rifiutata con special_pending_migration, senza consumare la carta. Non fingere effetti.
2. **Migrare sul runtime live le abilita dei 12 boss**, tutti e 23 gli effetti passivi mazzi boss e i 33 piloti. Il nuovo motore riceve i dati autentici dal setup ma non esegue ancora ogni regola del simultaneo. Preservare statistiche di boss e progressione, non semplificare senza richiesta.
3. **42 armi native**: completare carica Accumulo, Combo e Memoria, seme combinato, scelta scudiera, VFX uniche. NON rimuovere i record W01–W42, i supporti 3D e le animazioni montate. Eliminare solo la PRESENTAZIONE delle obsolete Carte Arma separate e gli asset non referenziati dopo audit completo.
4. **Firme vitali 4–5 carte**: il primo motore live conserva le firme del catalogo attuale, molte solo 2–3. Progettare esattamente le formule lunghe, numero di slot dinamico per bersaglio, controllo validita e salvataggio carte su turni diversi; attenzione a non bloccare per sempre mani con sequenze invalide.
5. **IA a turni in tempo reale**: assicurare ragionamento sui semi e cariche armi, uso trappole e contromisure, costruzione combinazioni senza leggere carte nascoste. Rafforzare il fallback se non possiede semi compatibili, ricambi autentici e vittorie effettive.
6. **Animazioni di combattimento**: numero+seme che entra nella navicella e si trasforma in munizione; sparo da bocca d'arma coerente; barriera ridotta in real time; esplosione del solo pezzo quando la combinazione e' completa; trappole che si girano e si attivano, cambi terreno in diretta. L'attuale versione live ha eventi e UI, ma i VFX complessi non sono tutti portati.
7. **Bilanciamento**: verificare tempi reali e danni con 1, 2, 3 navi per ciascun lato, 17 madri e boss. Limite massimo attuale 40 mezzi turni e' provvisorio, se necessario rivedere per le durate desiderate di Campagna/Boss/PvP.
8. **Collaudo visuale mobile**: confrontare il gioco DAVVERO renderizzato con l'ultimo riferimento approvato, non con una plancia nuova generata. Controllare che mano, navi e slot restino fermi.

## 5. Grafica resto del gioco — incarichi per Work, NON cambiare Home senza consenso

L'utente vuole un piano completo, ma **la grafica della Home la fara preparare da solo** e va applicata solo quando consegnera il riferimento definitivo.

- HOME e navigazione: src/HomeScreen.jsx, src/App.tsx, src/MathDuelApp.jsx — predisporre riorganizzazione visiva con accesso Campagna, PvP, Hangar, Shop, Personaggi, Mazzi e Boss. Salvare l'anteprima senza sovrascrivere l'artwork Home approvato.
- SHOP e ARSENALE: src/ShopModal.jsx, src/ArsenalCatalog.jsx — mantenere acquisti e valuta reali, oggetti del catalogo, livelli, rarita e nessuna carta arma separata in plancia. Non inventare prezzi.
- HANGAR, FLOTTA e collezionabili: src/ShipCollectionPanels.jsx, src/ShipPresentation.jsx, src/shipCollection.js — 17 navicelle, 42 armi integrate, rarita reali, 5 livelli, fino a tre navi, fusioni tramite Carte Speciali. Ogni nave deve essere riconoscibile e distruttibile nei componenti.
- PILOTI, PERSONAGGI e profilo giocatore: src/pilotsSystem.jsx, src/commanderAbilities.js, src/bossCharacterCards.js, src/BossCharacterPortrait.jsx — PNG autentici, nome, abilita e rarita esistente.
- MAZZI, SPECIALI, TERRENI ed EPICI: src/SpecialDeckPanel.jsx, src/specialDeckBuilder.js, src/pvpTerrainCards.js — inventari veri, equipaggiamento reale e nessun drop gratuito non autorizzato.
- CAMPAGNA, 12 BOSS e progressione: src/officialBossEncounter.js, src/officialBattleSetup.js, src/battleArenas.js, src/officialCampaignRouting.js — sblocchi solo dopo vittorie vere, le arene boss uniche.
- PVP e profilo: nessuna connessione online inventata; se e' PvP simulato locale, deve essere dichiarato tale.

## 6. Procedura di consegna e collaudo

1. Leggere anche docs/MASTER_DECISIONI_ECLISSI_STELLARE_2026-11-06.md, docs/WORK_HANDOFF_CONTROLLO_VISIVO_ECLISSI_STELLARE.md e codice sorgente. In caso di conflitto sulle meccaniche, prevalgono le decisioni LIVE qui registrate.
2. Operare esclusivamente su main ufficiale senza copie, reset di salvataggi o asset di prova.
3. Portare le abilita rimaste al live, rimuovere solo i componenti legacy davvero inutilizzati, non il catalogo armi; conservare boss/ricompense/equip.
4. Eseguire npm run verify:logic, npm run build, npm run preflight. Fare catture REALI 9:16 di flotta 1, 2 e 3 navi e controllo drag/touch.
5. Verificare: nessun fuoco automatico; 3+2 carte turno; 30 s ciascuno; due trappole compatibili; terreno PvP persistente; una combinazione distrugge un vitale; nessuna Speciale negli slot del vitale; salvataggi e boss protetti.
6. Riportare esplicitamente IMPLEMENTATO, TESTATO e ANCORA DA FARE. Non dichiarare completo cio' che e' ancora in migrazione.

## PROMPT DI AVVIO PRONTO DA INCOLLARE IN CHATGPT WORK

Apri il GitHub marcoteghini1988-ai/test7, ramo main. Leggi INTEGRALMENTE docs/WORK_HANDOFF_DUELLO_LIVE_E_REDESIGN_2026-11-10.md e i cataloghi esistenti. Continua senza creare copie. Porta il sistema alternato live alla parita completa con tutte le Carte Speciali, 12 boss, 23 passive, 33 piloti, 17 navi e 42 armi autentiche; completa gli attacchi e la grafica 9:16 usando lo screenshot di battaglia approvato senza cambiare la posizione di navi, mano o barre. Rimuovi solo le vecchie Carte Arma/asset effettivamente inutilizzati, NON le armi integrate. Prepara il piano Home, Shop, Hangar, Giocatori/Personaggi, Mazzi, Campagna e PvP senza ridisegnare la Home prima di ricevere l'artwork approvato. Esegui test, build, preflight e catture di schermo del gioco reale. Aggiorna direttamente main e riferisci lo stato verificabile di ogni punto.

## 7. Audit puntuale delle vecchie Carte Arma (10/11)

La nuova plancia OfficialLiveBattle3D.jsx NON renderizza slot Carte Arma separati: usa le armi montate sulla nave dal catalogo originale W01–W42. Tuttavia src/newCombat/WeaponVisuals.jsx esporta ancora WeaponCardArt, richiamato da src/PersonalLoadoutModal.jsx e src/LegacyPokerBattle.jsx, mentre src/newCombat/weaponCatalog.js e src/newCombat/weaponArt.js forniscono asset consultati in altre sezioni del gioco. NON eliminare in blocco questi file o public/assets/weapons: servono a Shop/Assetto o fallback. Rimuovere solo gli elementi accertati come non raggiungibili nel runtime finale, dopo la migrazione e un audit delle importazioni, mantenendo immagini necessarie alle collezioni.
