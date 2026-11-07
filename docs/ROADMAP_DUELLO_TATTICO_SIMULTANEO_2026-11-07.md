# Eclissi Stellare — nuova meccanica approvata: duello tattico simultaneo

> **Stato aggiornato — 7 novembre 2026:** l'ingresso unico è `src/MathDuelBattle.jsx`. Le battaglie standard usano `OfficialBattle3D.jsx` con `simultaneousDuelEngine.js`: ordini simultanei 30 s, risoluzione 8 s, due mazzi della collezione reale e le immagini originali. Per le battaglie boss, le passive boss/pilota non ancora convertite e le arene ioniche con durata preesistente, `BossBattle3D.jsx` conserva il combattimento 3D precedente, senza UI di prova. `TacticalDuelPrototype` e `?tacticalPreview=1` restano eliminati. Le sezioni sotto mantengono lo storico.
**Data:** 7 novembre 2026. **Sorgente:** ultimo esempio di battaglia a sei scontri approvato dall'utente.  
**Repository unico:** `marcoteghini1988-ai/test7` su `main`; nessuna copia.  
**IMPORTANTE:** le regole della simulazione sono **valori di prototipo**, non risultati di un test reale, e la simulazione narrativa precedente aveva incongruenze da sanare nel motore. Non assegnare ricompense né sovrascrivere il combattimento attuale prima dei test.

## Regole vincolanti
1. Ogni ciclo: **30 secondi di preparazione per ENTRAMBI contemporaneamente**, ordine segreto impegnato e non più modificabile al click *Pronto*; inizia la risoluzione quando entrambi pronti oppure scaduto il tempo (l'ordine non pronto diventa un piano difensivo minimo). La durata visuale della risoluzione prevista è **8 secondi**; non attribuire vantaggi all'ordine di commit.
2. **Nessun turno attacco/difesa fisso.** Entrambi possono attaccare, difendere o preparare trappole nello stesso ciclo. Lo scontro è un evento finito e riproducibile, NON uno sparatutto continuo. Timer validato da un orologio autoritativo in PvP online futuro, non dal solo client.
3. Le **armi native** associate a ciascuna delle 17 navi/42 armi (id, danno, tecnologia, cadenza, affinità) attaccano autonomamente la **barriera** secondo il piano. Nessuna speciale genera proiettili generici o sostituisce le armi.
4. Le **carte numeriche** (mano separata 7) formano calcoli di 2/3 carte o combinazioni Poker consentite; soltanto un colpo valido può danneggiare un **vitale esposto** (motore, armi, generatore, comando). La speciale non può eludere una firma. La barriera ha quattro soglie di esposizione al 75/50/25/0%, coerenti con il modulo `vitalDefense`.
5. **Carte speciali:** mazzo indipendente da 24, 5 in mano, massimo sei copie per tipo, fino a **2 carte giocate per preparazione** nel prototipo. Difese e reazioni si preparano **prima** dello scontro, non si premono freneticamente durante la salva. La carta viene effettivamente consumata/pescata.
6. Le scudiere sono vere unità con HP scudo e armi, sblocco livello nave 3/5; fusioni consumano **100 Sincronia** e usano gli HP reali delle scudiere. La fusione non rimpiazza le armi native con una scarica unica.
7. La distruzione dei vitali cambia veramente le prestazioni: **motore** −25% attacco, **armi** −50% attacco della madre, **generatore** barriera collassata e riparazioni bloccate, **centralina** intercettazioni scudiere disattivate. Vittoria alla distruzione di tutti e quattro; se entrambe le madri cadono nello stesso scontro, **pareggio**, senza priorità del client A/B.
8. Senza firma compatibile o quando il vitale resta protetto, un attacco numerico non infligge nulla; le carte impegnate si consumano. Se il giocatore non può preparare un tiro valido, può concentrare lo scontro su barriera, difesa o ricambio; **nessun soft-lock**.
9. Le tecnologie (laser/plasma/ionico/cinetico/esplosivo) descrivono gli armamenti, con differenze di comportamento verificabili; NON un sistema automatico «fuoco batte acqua». Carte e pianeti modificano tattiche/risorse, non l'identità delle navi.
10. Collezioni, inventario, progressione e PvP attuale rimangono intatti fino al passaggio graduale. Per il PvP vero occorrono protocollo di commitment, anti-cheat, orologio server, reconnect, replay e verifiche, non il falso PvP esistente.

## Scaletta tecnica e criteri di chiusura
| Fase | Lavoro | Si considera completata quando |
|---|---|---|
| **1 — Fondamenta** | Motore deterministico degli ordini preparati A/B, validazioni, commit immutabile, timer logico, fallback non-pronto, log eventi | Test dei due ready, scadenza, ordine A/B invariante, impossibilità di edit dopo commit |
| **2 — Armamenti** | Collegare 17 madri/42 armi reali alla barriera, supportare scudiere, identità di danno/cadenza/tecnologia | Nessun attacco numerico richiesto per ferire la barriera; armi distinte, stesso catalogo |
| **3 — Precisione** | Calcoli 2/3 e Poker, scelta bersaglio, esposizioni 75/50/25/0, danni e KO dei quattro sistemi | Colpo errato/protetto non ferisce; KO unico, ripercussioni su armi e barriera |
| **4 — Speciali** | Adattare 11 esistenti e selezionare dal catalogo progettato 20; ordini, trappole, deviazione energia, fusione, scambio | 24/5/6 copie, due ordini per round, nessun effetto senza carta, cooldown e cap |
| **5 — Mani e IA** | Mazzi separati, pesca senza duplicazioni, carte morte, pianificazione nemica, diversità boss | IA non legge mano segreta, capacità strategica con scorte e difese |
| **6 — Prototipo giocabile** | Schermata 9:16 sperimentale accessibile senza toccare il gioco ufficiale; scelta nave/carte/bersaglio, tempo, replay/log | Partita riproducibile da inizio a esito e responsiva sul telefono |
| **7 — Bilanciamento** | Simulazioni di migliaia di cicli, tempi base/boss/PvP, recupero dopo cattive pescate, test per L1/L3/L5 | Nessun blocco infinito o vittoria istantanea non contrastabile |
| **8 — Conversione** | Collegare progressione di 120 settori/12 boss, premi e salvataggi; rimuovere gradualmente flusso vecchio | Moduli esistenti preservati, regression test verdi |
| **9 — Audiovisivo** | Animazioni scontri 8s, feedback dei calcoli, fusione differenziata per nave, audio e ottimizzazione 9:16 | Azioni e reazioni leggibili senza spostare il layout metallico |
| **10 — PvP online vero** | Ordini cifrati/commit-reveal, server autorevole, sincronizzazione, reconnect e anti-manomissione | Due dispositivi confrontano lo stesso risultato; nessuna simulazione spacciata per multiplayer |
| **11 — Collaudo** | Android, performance, salvataggio, correttezza ricompense e campagna | Verifica reale prima dell'abilitazione come modalità principale |

## Incongruenze individuate nell'esempio narrativo
- La narrazione mostrava inizialmente coppie di calcoli diverse per lo stesso vitale: le firme definitive saranno univoche, verificabili e specifiche del modello (mai corrette «a voce»).
- Una fusione che protegge il vitale non può generare HP e non può continuare se perde la scudiera o la centralina; il difensore paga gli HP reali della scudiera.
- Non ci può essere un vantaggio del giocatore A nello stesso momento: le due salve usano lo **stato iniziale di ogni sottofase**, risolte simultaneamente; un doppio KO produce pareggio.
- Il danno numerico ai vitali è separato da quello automatico allo scudo. Le vecchie funzioni con firma esclusiva non vanno invocate per attribuire danno gratuito.
- Il primo prototipo deve usare uno **sandbox isolato**, per evitare di consegnare ricompense che non derivano da una partita ufficiale.

## Registro avanzamento
- [x] Definizione approvata: preparazione simultanea, risoluzione a eventi, armi native / precisione numerica.
- [x] **Prima implementazione del motore + test riusciti**: `src/simultaneousDuelEngine.js`, `src/simultaneousDuelEngine.test.js`. Stati di preparazione/risoluzione, clock 30s/8s, sigillo ordini A/B, fallback temporale, armi native del catalogo, barriera, precisione, trappole, fusioni e KO simultaneo.
- [x] **Storico, interfaccia rimossa il 7/11**: il vecchio `TacticalDuelPrototype.jsx` era una schermata isolata per testare motore e IA. I due file dell'interfaccia di prova sono stati cancellati; i moduli del motore e i relativi test restano per la successiva integrazione diretta in `MathDuelBattle.jsx`.
- [x] Separazione rigorosa: query opt-in in `src/main.tsx`; nessuna modifica a salvataggi, progressione o pagamenti.
- [x] **Prima curva di bilanciamento testata**: `src/tacticalArmamentBalance.js` usa i danni nativi delle 42 armi, il tipo di arma e una curva a rendimento decrescente; il reattore migliora ad ogni L1–L5 senza azzerare da solo una barriera 60/60 in un singolo scontro. `src/tacticalArmamentBalance.test.js` controlla 17×5 livelli, le 42 armi e le penalità dei vitali. **Restano da bilanciare** danno per salvo, frequenze dei colpi, sinergie dei cinque tipi di tecnologia e match-up reali: classificare una tecnologia NON equivale ancora ad averne realizzato l'effetto tattico.
- [ ] Cadenze ed economia realistica di ogni armamento, compresi i cannoni Combo: adesso il playback è visivo e la risoluzione danni resta a pacchetti per ciascun ciclo.
- [x] **Firme per ciascuna delle 17 navicelle** in `src/tacticalShipSignatures.js`: 68 profili per i vitali (motore, armi, generatore, comando), distinti per modello e risolvibili con due/tre carte; alcuni comandanti ammettono *un calcolo oppure coppia/tris Poker*. Supportati nel motore, nell'IA e nell'interfaccia, con test su tutti i profili. **I numeri e le difficoltà sono ancora prototipali**, da tarare sulle 17 navi reali.
- [x] **Scelta delle navi nella UI sandbox**: si può provare qualunque coppia di navicelle L1–L5, senza sbloccare carte o toccare la collezione reale.
- [x] **Anti-stallo della mano numerica**: una numerica può essere scartata per ciclo se non si prepara un colpo ai vitali; due scarti (o scarto assieme a un colpo) richiedono la vera carta Ricambio. IA e UI applicano la stessa regola, senza duplicazioni di carte (test del mazzo 52 e scarti).
- [x] **Tutte le 11 tipologie speciali originali adattate nel sandbox** con vera istanza e consumo: Fusioni Barriera/Assalto/Gemellare/Trina, Copertura Tattica, Perforante, Ionico, Corrosione, Riparazione Scudo, Pulizia Sistemi, Riparazione Scudiera. Il motore controlla scudiere vive, 100 Sincronia, esclusione fusioni sovrapposte, stato negativo per pulizia, HP per riparazioni e rispetto delle firme vitali. Le scudiere assorbono danni con HP reali. Test: `src/tacticalSpecialsIntegration.test.js` e `src/simultaneousTacticsEffects.test.js`.
- [x] **Catalogo sandbox di 19 tipologie**: 11 carte ufficiali + 8 ordini tattici sperimentali; 24 istanze per mazzo, 5 in mano, massimo 6 copie dello stesso tipo. Il catalogo da 20 carte del precedente concept NON è da considerarsi integralmente implementato; questa revisione è fondata sul duello simultaneo.
- [x] **Cinque preset giocabili** nel solo test: Bilanciato, Assedio, Difensivo, Controllo, Fusioni. Sono simulazioni di 24 carte, non carte regalate, e non scrivono nella collezione.
- [ ] Collegare i 19 tipi e i preset alla **collezione ufficiale** e ai salvataggi attraverso migrazione sicura; mantenere compatibilità delle 11 carte ufficiali nelle altre modalità.
- [x] **Primo playback visivo verificato dagli unit test**: `src/tacticalCombatTimeline.js`, `src/TacticalCombatPlayback.jsx`, `src/tacticalVisualGeometry.js`, relativi test. Gli 8 s mostrano prima le speciali, poi le raffiche delle armi native, impatto sulle barriere, intercettazioni e colpi validi/annullati ai vitali. Usati i **profili degli effetti preesistenti di tutte le 42 armi** e le reali coordinate di bocca da fuoco, comprese quelle doppie. Le barre HP e i quattro vitali vengono mostrati in sequenza secondo le istantanee del motore, anziché anticipare i risultati. L'animazione non genera danni aggiuntivi, è solo rappresentazione di un risultato deterministico.
- [x] **Conseguenze strategiche testate nel sandbox**: Perforante bypassa una parte dell'intercettazione senza bypassare la barriera, Soppressione blocca **una scudiera** (non due), Ionico si attiva **nel ciclo seguente** solo dopo un danno reale alla barriera; test in `src/simultaneousTacticsEffects.test.js`.
- [ ] **VFX definitivi + audio**: le salve sono animate entro gli otto secondi ma il modello di cadenza resta una rappresentazione sperimentale, con pacchetti di danno risolti logicamente in una singola sottofase. Mancano ancora proiettili fisici/eventi di danno individuali, suoni caratteristici per arma, scenografie e animazioni delle fusioni. **Non dichiarare 42 colpi fedeli nel gameplay definitivo**, solo 42 profili visivi distinti con partenza dagli agganci corretti.
- [x] **Cinque tecnologie native già funzionanti nel sandbox** con arma privilegiata scelta nei 30 s: **laser** +2 alla barriera quando non ci sono scudiere; **plasma** surriscalda il bersaglio dopo danno reale e aumenta la pressione nello scontro seguente; **ionico** riduce intercettazioni nel prossimo ciclo dopo danno reale; **cinetico** aggira il 10% dell'intercettazione delle scudiere senza perforare barriera/vitali; **esplosivo** distribuisce fino a 2 HP reali sulla seconda scudiera. Tutte le altre armi native restano installate e contribuiscono al fuoco, solo l'arma privilegiata controlla l'effetto del ciclo. Il cap offensivo +45% rimane applicato ai modificatori principali. `src/tacticalTechnologyEffects.test.js` verifica le 42 armi e tutti e cinque gli effetti.
- [x] **Dodici identità tattiche boss di prova** collegate a `src/newCombat/phase16DBosses.js`: 12 mazzi da 24 carte, personalità/pesi di scelta, compatibilità L1/L3/L5, nessuna informazione segreta letta dall'IA, quattro copie della Scansione per imparare le firme dei vitali senza cheating. `src/tacticalSpecialPresets.js` e `src/tacticalDuelDemoAi.js`, test `src/tacticalBossDecks.test.js`.
- [x] Nel menu del prototipo è possibile scegliere **qualsiasi coppia di 17 navicelle L1–L5, il preset del giocatore, il boss, e l'arma integrata da privilegiare** prima dello scontro.
- [ ] **IA definitiva e passive dei boss**: i 12 mazzi/piani sono già diversi, ma le 12 abilità boss e le 23 passive per livelli del vecchio catalogo NON sono ancora adattate al duello simultaneo. Devono restare legate alla lore e ai veri eventi di gioco, senza danno gratuito.
- [ ] **Economia e bilanciamento competitivo**: durate, odds delle mani, costi e frequenze delle speciali, efficacia per navi di diversa rarità, effetto delle arene e dei comandanti non sono ancora validati da playtest.
- [ ] Collegamento alla modalità di gioco ufficiale e ricompense.
- [ ] Verifica interattiva su telefono, ribilanciamento e vero PvP online.

**Percorso di prova rimosso il 7/11:** `?tacticalPreview=1` non è più disponibile. La schermata principale è soltanto `MathDuelBattle.jsx` tramite `App.tsx`. La logica del duello simultaneo 30 s + 8 s è conservata nei moduli tattici, ma non è ancora il combattimento ufficiale.

**Non segnare una fase come conclusa fino a commit e CI riusciti.**


## Decisioni aggiuntive di progettazione — 7 novembre 2026
**Stato di questa sezione: requisiti approvati o da precisare, NON implementazioni completate.**
- [ ] **Carte Personaggio**: non bonus fissi per tutta la partita, ma carte temporanee nel mazzo speciale, massimo un personaggio attivo alla volta, durata e potenza specifiche per carta; collezionabilità e miglioramenti conservati.
- [ ] **Carte Personaggio Boss**: si sbloccano sconfiggendo il boss; sono diverse dai **12 mazzi numerici boss** e dalle loro **23 passive**. Le abilità della carta giocabile sono versioni bilanciate di quelle del boss nemico.
- [ ] **Carte Terreno PvP**: carte speciali che sostituiscono visivamente l'ambiente dell'arena per una durata definita e applicano vantaggi/svantaggi; **nei boss di campagna le Carte Terreno non possono essere attivate**, perché l'arena è fissa e imposta dal boss. Conservare le arene normali dei livelli planetari.
- [ ] **Reliquie ed Epici storici**: inventariare e convertire in carte speciali quando opportuno, preservando inventari, sblocchi, costo e unicità dell'effetto; verificare i cataloghi per quantità e ID.
- [ ] **Dadi Quantici e moduli ricaricabili**: valutare carte speciali e/o status di carica legati alle carte, senza duplicare il modulo fisso. Riferimenti: `src/newCombat/phase16BCombat.js`, `src/newCombat/phase16FModules.js`.
- [ ] **Numero Bomba**: progettare una carta speciale che trasformi una numerica dell'avversario in una bomba; definire bersaglio, visibilità, durata, disinnesco, contromisure e condizioni di attivazione, separandola dalla vecchia bomba del banco.
- [ ] **Barra Malus / sabotaggi**: progettare attivazione e ricarica tramite carte speciali, con salvaguardie contro blocchi irreversibili.
- [ ] **Carta Dorata**: recuperare seme/bonus/scadenza dal vecchio sistema e adattare la trasformazione numerica al duello simultaneo.
- [ ] **Faglia di Vulnerabilità e altri effetti legacy**: censire il catalogo preesistente, evitare duplicati e distinguere risorse, carte, status e oggetti.
- [ ] **PNG obbligatori per le illustrazioni create oggi via codice**: mazzi (inclusi i 12 mazzi boss), personaggi (separati dai mazzi), personaggi boss, navicelle, armi, speciali, equipaggiamenti, reliquie, terreni e fondali. La produzione delle immagini avverrà in questa chat; non sostituire con PNG statici la UI interattiva React/CSS.
- [ ] **Consegna a ChatGPT Work**: completare registro degli asset PNG e istruzioni per collaudo visivo, collegando la checklist in `docs/WORK_HANDOFF_CONTROLLO_VISIVO_ECLISSI_STELLARE.md`. Work dovrà ricevere un incarico esplicito per aprire il repository e verificare il gioco.
- [ ] **Prossimo sviluppo dopo la raccolta requisiti**: 12 identità/passive boss nel duello simultaneo, preservando le 23 passive dei mazzi numerici e senza confondere l'abilità del boss di campagna con la carta Personaggio Boss sbloccabile.

**Documento di consegna per Work:** [WORK_HANDOFF_CONTROLLO_VISIVO_ECLISSI_STELLARE.md](./WORK_HANDOFF_CONTROLLO_VISIVO_ECLISSI_STELLARE.md). È una bozza che va completata man mano che le regole e i PNG sono approvati.


## 7 novembre 2026 — Sei OGGETTI EPICI trasformati in speciali (sandbox)
- [x] Ricostruiti gli sblocchi delle **12 reliquie** e delle **6 fusioni** mantenendo gli ID originali e le coppie boss: fonte `src/newCombat/phase16ACatalog.js`, effetti storici `src/newCombat/phase16CEpics.js`.
- [x] `src/tacticalEpicCards.js`: sei carte collezionabili temporanee (Calice, Pendolo, Monolite, Matrice, Möbius, Astrolabio), proprietà del proprietario da `fused`/inventario, niente Epico equipaggiabile se non ottenuto.
- [x] `src/tacticalEpicRuntime.js`: effetti reali durante 1–2 cicli, con un Epico attivo alla volta, massimo uno per tipo e due nel mazzo. Il Calice **non accredita Polvere Stellare reale**, ma registra solo una previsione nella sandbox. Möbius/Astrolabio rivelano le pescate dopo l'uso e permettono di scegliere nel ciclo successivo.
- [x] `src/TacticalDuelPrototype.jsx`: anteprima esplicita di uno dei sei Epici, in apertura della mano solo per test, senza sblocco account, senza modificare il mazzo ufficiale. Test in `src/tacticalEpicCards.test.js` con GitHub Actions verdi.
- [ ] **Resta da completare nella modalità ufficiale**: migratore di `phase16CEpics.js` (vecchi passivi) e `specialDeckBuilder.js`, rispetto dei limiti pilota L20/L60, salvataggi/ricompense; nessun bonus doppio passivo+speciale.
- [ ] **Scelte confermate ma non implementate**: carte Personaggio (anche i 12 boss ottenibili) nel mazzo speciale con durate limitate; carte Terreno PvP che cambiano scena e regole, **vietate contro il boss** il cui ambiente è immutabile; filtro in pesca per evitarne mani morte.
- [x] Specifica completa: [MAZZO_UNIFICATO_EPICI_PERSONAGGI_TERRENI_2026-11-07.md](./MAZZO_UNIFICATO_EPICI_PERSONAGGI_TERRENI_2026-11-07.md).


## Nuova carta da progettare — Mutazione della Firma del Bersaglio
**Stato: decisione di design aggiunta alla scaletta il 7 novembre 2026. NON implementata.**

- **Idea dell'utente:** quando la barriera di una nave è stata abbattuta quanto basta da esporre uno dei quattro sistemi vitali, l'attaccante può preparare numeriche per un calcolo (+, −, ×, ÷) o una combinazione Poker richiesta dalla firma visibile. Il difensore prepara in segreto una **carta speciale che cambia la firma del proprio vitale esposto**. All'avvio della risoluzione, la vecchia combinazione preparata dall'avversario può non essere più valida e il colpo al vitale viene annullato; la barriera e gli attacchi con armi integrate seguono le proprie regole.
- **Nome di lavoro:** *Mutazione della Firma* (nome definitivo da scegliere quando si creerà la carta).
- **Vincoli proposti da verificare prima del codice:** attivazione durante i 30 s di preparazione simultanea (senza conoscere la mano/ordine nascosti del nemico); effetto prima della validazione dei colpi di precisione negli 8 s; coinvolgere **un solo vitale esposto** e **un solo ciclo**; la nuova firma deve essere sempre matematicamente o tramite Poker risolvibile e ricostruibile nel replay; l'ordine delle sottofasi dev'essere indipendente dal client A/B; consumo reale della speciale dal mazzo 24 / mano 5 e rispetto del tetto di 2 speciali preparate. Non permette di riparare un vitale già distrutto. Testare attacchi già preparati, firma originaria o alternativa, contromisure, possibile coincidenza casuale e frequenza della carta prima di definire il bilanciamento.
- **Da fare successivamente:** catalogo carta, regola esatta di cambio numero/operazione/Poker, durata e limiti, UI dell'effetto (firma visiva che si riconfigura durante il playback), IA e test su tutte le firme delle 17 navicelle.

### Ordine di sviluppo e parcheggio delle nuove idee
1. **Riprendere la lavorazione interrotta dalla raccolta delle idee:** progettazione delle **12 abilità/passive dei boss nel duello simultaneo**, mantenendo separati i 23 livelli/passive dei mazzi numerici storici e le carte Personaggio Boss sbloccabili; poi procedere ai comandanti/personaggi secondo la scaletta precedente.
2. **Nuovi requisiti confermati, da realizzare dopo:** carte Personaggio temporanee, comprese quelle ottenute dai boss; carte Terreno attivabili soltanto nel PvP, con arena boss della campagna non sovrascrivibile; conversione definitiva degli Epici da reliquie in carte speciali preservando le fusioni storiche; *Mutazione della Firma*.
3. **Raccolta ancora aperta:** l'utente ha annunciato altre modifiche da aggiungere alla scaletta. Non anticipare la loro implementazione né cambiare priorità finché non sono state elencate.


## Revisione plancia 9:16 — due mani, due mazzi e slot di preparazione
**Richiesta del 7 novembre 2026 — DA PROGETTARE, NON ANCORA IMPLEMENTATA.** L'utente ha chiesto di raccogliere i requisiti nella scaletta prima di riprendere la lavorazione interrotta delle passive boss e dei personaggi.

### Componenti confermati dall'utente
- **Zona centrale della plancia:** mantenere le navicelle e il combattimento spaziale metallico 3D stabilito, senza rimettere carte arma o boss nel centro e senza tornare alla griglia azzurra.
- **Lato sinistro:** due mazzi *distinti* e riconoscibili, **Mazzo Numerico** e **Mazzo Speciale**; non un mazzo mescolato.
- **Lato destro:** cestino/scarti, chiarendo visivamente la destinazione delle carte utilizzate. Da valutare scarti separati o selettore numeriche/speciali se i regolamenti delle due pile differiscono.
- **Mani del giocatore:** **7 carte numeriche** come già stabilito e, separate da un piccolo spazio, **5 carte speciali**. Devono essere visibili e selezionabili in verticale 9:16, senza confondere le due categorie.
- **Zona di preparazione ordini:** slot sul campo nei quali il giocatore impegna le carte durante i **30 secondi di preparazione simultanea**. Serve distinguere visivamente il bersaglio ai vitali dalle manovre/tattiche generali.
- **Slot BERSAGLIO dedicato:** uno spazio mirato al sistema vitale già esposto/scoperto in cui si inseriscono le carte numeriche che costruiscono **una combinazione matematica o Poker valida per quella firma**. Il giocatore sceglie il vitale, vede la firma esposta, seleziona operatore/alternativa e impegna **2 oppure 3 numeriche secondo la regola della firma**; chiarire se e quando è ammesso usarne una. Le numeriche rimanenti non diventano automaticamente colpi extra: possono restare in mano o servire manovre consentite dalla regola del ciclo.
- **Altri slot di preparazione:** dedicati a speciali, difese, trappole, ordini o altre azioni consentite, senza confondere l'attacco matematico con il fuoco automatico delle armi native sulla barriera.
- **Numero carte per ciclo da bilanciare:** l'utente ipotizza **fino a 3 numeriche** e **2 o 3 speciali**. **MANTENERE per ora il limite sandbox di 2 speciali per preparazione** finché non verrà deciso/testato l'eventuale passaggio a 3; non cambiare unilateralmente i costi, le mani, la frequenza delle carte o la durata.

### Proposta iniziale d'impaginazione, da validare con mockup 9:16
1. Area superiore: nave avversaria, sistema vitale visibile soltanto se esposto, eventuali effetti d'arena. Durante la preparazione gli ordini avversari restano nascosti.
2. Area centrale: due navi con armi integrate, barriera/scudiere e animazioni del combattimento; niente copertura permanente della scena da parte delle carte.
3. Area immediatamente sotto il campo: **pannello bersaglio (fino a 3 alloggi numerici + formula/Poker + sistema selezionato)** e, distinta, **barra ordini speciali (2 alloggi iniziali)**. Layout compattabile/espandibile per non sacrificare le navi grandi.
4. Area bassa del giocatore: **mano numerica da 7 carte**, separatore sottile, **mano speciale da 5 carte**; sinistra: icone delle due pile; destra: cestino/scarti. Evitare l'effetto «12 carte minuscole tutte nella stessa riga»: due righe, gesti sicuri al tocco e indicatore chiaro delle carte impegnate.
5. Conferma *Pronto*: numeriche e speciali scelte diventano ordini sigillati. Nella risoluzione da **8 secondi** le speciali difensive (es. *Mutazione della Firma*) possono agire **prima** della verifica dell'attacco al vitale. Mostrare chiaramente vecchia/nuova firma e colpo valido/annullato.

### Da testare prima di implementare
- Mockup su smartphone 9:16 (incluse dimensioni touch delle 7+5 carte), visibilità navi e spazio residuo per timer/HP.
- Modalità di riordino/cambio carta impegnata finché il giocatore non preme *Pronto*, comportamento del cestino e ricambio quando non esiste firma compatibile.
- Gestione di firma aritmetica e alternative Poker nello stesso slot (nessuna carta impegnata può servire simultaneamente ad azioni incompatibili); validazione simultanea A/B e replay deterministico.
- Presentazione di effetti speciali e personaggi/terreni futuri senza aumentare arbitrariamente il numero di slot.

**Nota storica:** la scelta del duello simultaneo è ora integrata nella campagna standard; la priorità residua è convertire le 23 passive boss, poi Personaggi e Terreni, sempre nell'interfaccia ufficiale e senza creare nuove modalità di prova.

## Ripristino del riferimento grafico originale test7 — 7 novembre 2026

**Richiesta vincolante:** gli utenti hanno respinto le plance ridisegnate e i piccoli widget nave del prototipo. Il riferimento storico ESATTO è l'archivio `ECLISSI_STELLARE_TRASFERIMENTO_COMPLETO_CHAT_WORK_03_11_2026.zip` (contenente `RIFERIMENTO_VISIVO_OBBLIGATORIO_PLANCIA_3D.png` e la base Fase 1I). Lo ZIP master `ECLISSI_STELLARE_MEMORIA_MASTER_53_PUNTI_05_11_2026.zip` registra la stessa direzione artistica. Non confondere questo materiale con le nuove immagini generative della plancia del 7 novembre, che NON sono il riferimento.

- **Arena originale**: immagine REALE e già versionata `public/assets/mathduel/arena_titanio_9x16.webp`, già usata da `src/MathDuelBattle.jsx`. Pavimento metallico 3D, prospettiva, bordi e luci rossi sopra e blu sotto, pianeta e galassia. Niente griglia digitale piatta né nuovo campo generato.
- **Navicelle originali**: `src/ShipPresentation.jsx` `ShipArtwork`, viste diverse `public/assets/mathfleet/views/enemy_to_player/` e `player_to_enemy/`, evoluzione dello scafo L1-L5; `MountedWeapons` con montaggi originali e vere bocche da fuoco; scudiere con asset esistenti `public/assets/escorts/<id>_escort_<n>.svg`.
- **Stato ufficiale aggiornato:** la schermata `MathDuelBattle.jsx` avvia il duello simultaneo 30+8 nella plancia originale 9:16 con mazzi, firme e IA reali, oppure la precedente battaglia 3D nei soli casi in cui boss, passive equipaggiate o durata ionica richiedono ancora le regole pregresse. Non esiste un ingresso di prova separato.
- **Limite da verificare**: la composizione grafica finale nel browser mobile non è ancora stata osservata direttamente; serve il collaudo su StackBlitz e un ulteriore passaggio per inserire nelle stesse coordinate **fisiche della plancia storica** i due mazzi, gli slot di combinazione, le cinque speciali e il cestino. Non spostare o ridisegnare navi e scenario senza approvazione.
- **Recupero tramite GitHub**: `backup-prima-combattimento-realtime-2026-11-05` conserva un backup del progetto precedente alle variazioni in tempo reale, e `backup-prima-scudiere-collegate-2026-11-05` conserva la fase precedente alle scudiere collegate. Conservare questi riferimenti senza sostituire indiscriminatamente `main`.

**Regola:** aggiornamenti futuri = estendere la plancia originale, NON inventare una plancia nuova. Non confondere screenshot artistico, render generato e stato reale del browser.

## Consolidamento della plancia ufficiale — 7 novembre 2026

**Vincolo definitivo:** ogni modifica di gioco deve intervenire su `test7/main` e sulla schermata `src/MathDuelBattle.jsx`; non aggiungere un'altra schermata o route `?preview` / `?tacticalPreview`. Conservare e riutilizzare `public/assets/mathduel/arena_titanio_9x16.webp`, le immagini in entrambe le prospettive di `public/assets/mathfleet/views/`, i montaggi `MountedWeapons` e le scudiere `public/assets/escorts/`.

**Eseguito e confermato tramite GitHub Actions:**
- La sola app avviata è `App.tsx`, e la campagna usa ancora il componente ufficiale `MathDuelBattle`.
- Sulla stessa plancia sono presenti due mazzi visibili, 5 carte speciali reali con dettagli accessibili sul telefono, 7 carte numeriche e il bersaglio di calcolo separato.
- È stata eliminata la schermata separata `TacticalDuelPrototype.jsx/.css`, la route ad essa collegata e la scelta della flotta di prova; rimangono soltanto i moduli logici che contengono meccaniche da migrare.
- `npm run preflight` ora esegue `scripts/check-official-3d.mjs`: controlla un solo ingresso, grafica originale, 17 navi, 42 armi, 34 viste, 34 scudiere e due mani indipendenti. CI verde dopo le modifiche.

**Stato effettivo:** la campagna standard è stata collegata a `simultaneousDuelEngine.js`, con 30+8, inventario posseduto e ricompense, e sono stati convertiti al nuovo motore gli effetti ambientali Detriti (difesa barriera), Plasma (tripla numerica valida) e Risonanza (Sincronia per calcolo valido). Restano da convertire pienamente le 23 passive dei 12 mazzi boss, le abilità dei piloti non basici, la durata degli effetti delle arene ioniche e le future carte Personaggio/Terreno, prima di eliminare il percorso compatibilità `BossBattle3D.jsx`. Non attribuire ai nuovi duelli poteri ancora non integrati. La compilazione e la suite Node sono verdi, ma un collaudo grafico mobile end-to-end e il confronto materiale con lo ZIP storico non sono stati eseguiti.
