# Eclissi Stellare — nuova meccanica approvata: duello tattico simultaneo
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
- [x] **Prima UI sperimentale collegata**: `src/TacticalDuelPrototype.jsx` + CSS, avviabile dalla normale anteprima Vite/StackBlitz con `?tacticalPreview=1`. IA locale e test dedicati `src/tacticalDuelDemoAi.js` / `.test.js`.
- [x] Separazione rigorosa: query opt-in in `src/main.tsx`; nessuna modifica a salvataggi, progressione o pagamenti.
- [ ] Bilanciamento realistico di ognuna delle 42 armi (ora usiamo il suo **danno catalogato**, ma la cadenza/animazione dei colpi è ancora semplificata).
- [ ] Firme dei 17 modelli (nel sandbox sono **quattro firme dimostrative condivise**, così possiamo verificare i calcoli e il Poker).
- [ ] Estensione di tutti gli equipaggiamenti e delle 11 speciali ufficiali al motore nuovo (la sandbox usa **12 effetti di prova**, alcuni già esistenti, altri ancora sperimentali).
- [ ] Proiettili audiovisivi realmente distribuiti nei 8 s di animazione (ora la risoluzione è **logica immediata** e il display resta in stato scontro per 8 s).
- [ ] IA avanzata, mazzi boss, tecnologie e compatibilità completa con le 17 navi.
- [ ] Collegamento alla modalità di gioco ufficiale e ricompense.
- [ ] Verifica interattiva su telefono, ribilanciamento e vero PvP online.

**Per provare:** apri l'anteprima del repository già collegato a StackBlitz e aggiungi `?tacticalPreview=1` all'URL della pagina dell'anteprima (non all'URL GitHub del file). Il prototipo è **A contro IA simulata**, non multiplayer online. Le speciali si selezionano per tocco, non ancora con trascinamento.

**Non segnare una fase come conclusa fino a commit e CI riusciti.**
