# ECLISSI STELLARE — AVVIO DEL GIOCO UFFICIALE

**Repository unico:** [marcoteghini1988-ai/test7](https://github.com/marcoteghini1988-ai/test7), ramo `main`. Non creare copie, altri repository, ingressi paralleli o schermate di prova.

## Aprire il gioco

1. Apri `test7` in StackBlitz oppure scarica il repository GitHub completo.
2. Esegui `npm ci` e poi `npm run dev` (StackBlitz può eseguire questi comandi nel terminale).
3. Entra nel gioco normalmente dalla Home: `src/main.tsx` avvia soltanto `App.tsx`, e `src/MathDuelBattle.jsx` sceglie il combattimento **3D ufficiale**.
4. Nel duello **LIVE** i lati agiscono a turni alternati da **30 secondi**: puoi giocare al massimo **3 numeriche** e **2 carte speciali** nel tuo turno. Le carte numeriche compongono le combinazioni per i vitali; le armi integrate indeboliscono la barriera. I cinque slot speciali e il mazzo da 24 carte restano distinti dalla mano numerica da sette.
5. I pulsanti **RICAMBIO**, **ARMI**, **HANGAR** e **REGISTRO** appartengono alla stessa schermata 3D. In Hangar puoi schierare le navicelle che possiedi e configurare il mazzo speciale da 24 carte. Le 7 numeriche vengono pescate dal mazzo reale di 52 carte.

Non esistono più l'ingresso `?tacticalPreview=1`, il menu `Flotta → Prova` né il vecchio pulsante **TEST/Debug** della Home.

## Pulizia delle schermate obsolete — aggiornata all'11 novembre 2026

- Eliminato il pulsante **PROVA FASE 10 · COLLAUDO COMPLETO** dall'app, la finestra temporanea associata e i blocchi di pausa dei timer che dipendevano dalla sua apertura.
- Rimossi i vecchi file di presentazione inutilizzati `src/SandboxBattleView.jsx`, `src/NewCombatPhase3Preview.jsx`, `src/NewArsenalCatalogPreview.jsx` e `src/newCombat/phase3Preview.css`.
- Il vecchio combattimento Poker/Classic (`LegacyPokerBattle.jsx`, `ClassicBattleView.jsx`, `ClassicPokerFieldBridge.jsx` e il relativo CSS) **è stato eliminato**, insieme alla `GameScreen` e al vecchio banco automatico Trappole/Terreno dentro `App.tsx`.
- Rimossi inoltre 21 PNG duplicati dalla radice `public/assets/`; le immagini corrette restano in `mathfleet/`, `mathfleet/views/`, `escorts/` e nelle cartelle delle carte speciali.
- **Pulizia verificata 11/11:** rimossi **8 file** non più integrati: `CombatJuiceOverlay.jsx`, `ProjectilesEngine.js`, `weaponEffects.js`, `uniqueWeaponVFX.js`, `vulnerabilityRift.js` e i tre file `newCombat/PokerCombatEffects.jsx`, `newCombat/pokerCombatEffects.css`, `newCombat/pokerVolleyVfx.js`. Nota: l'elenco precedente contava erroneamente la Sfida giornaliera fra le parti inutilizzate. `dailyChallengeEngine.js` e `dailyPokerChallenge.js` sono stati **ripristinati** perché ancora in uso. L'interruttore `legacyTutorialConfig.js`, ripristinato temporaneamente, è stato successivamente eliminato insieme alle vecchie guide disattivate; l'import non utilizzato di `CombatJuiceOverlay` e' stato invece eliminato da `App.tsx`. Restano attivi `officialLiveCombatVisuals.js`, `OfficialLiveCombatFx.jsx`, `tacticalVulnerabilityRift.js`, LIVE e fallback. CI con test/build/preflight superata dopo la correzione. La pulizia degli altri file richiede audit delle dipendenze.

- **Pulizia CSS 11/11:** rimosso `src/App.css`, foglio del progetto demo Vite/React non importato da alcuna schermata; impedito il suo ripristino via preflight. Mantenuti tutti gli altri CSS, ancora richiamati da Home, battaglia LIVE/fallback, Hangar e carte speciali.
- **Deduplicazione navicelle 11/11:** eliminati 8 PNG singoli alla radice `public/assets/mathfleet/` (`C01.png`, `C01_player.png`, `C02.png`, `C02_player.png`, `C03.png`, `C03_player.png`, `C04.png`, `N00.png`) che non sono caricati dall'app ufficiale. Rimangono tutte le 34 viste complete delle 17 navi, i sorgenti delle viste preliminari, i 16 PNG dei motori e le immagini `N00_player.png` / `C04_player.png` usate dalla Home. Il preflight ora blocca il ritorno dei duplicati e verifica la Home.
- **Pulizia asset 11/11:** eliminate sette sequenze WEBP della vecchia cartella `public/assets/portal_sequences/` (~3,3 MB), prive di riferimenti nel codice. I VFX della battaglia LIVE in `public/assets/battle-fx/` restano intatti e vengono verificati dal preflight; protetti anche tutti i dorsi numerici ufficiali. Gli asset grafici della nave, dei boss e delle Carte Speciali restano conservati.
- **Secondo audit dipendenze 11/11:** rimossi altri 6 file scollegati in `newCombat/`: `classicNativeBridge.css`, `index.js`, `tacticalAnalysis.js`, `phase17GProgression.js`, `phase17HProgression.js` e `pvpOnlineProtocol.js` (vecchio protocollo Poker remoto, NON PvP simulato). Verificate fonti importate dalla Home, test e script. Conservato `offlineLegacyNetwork.js` ancora importato da `App.tsx`.
- **Conservare** `BossBattle3D.jsx` (fallback 3D ancora raggiungibile), la logica boss necessaria, i test `*.test.js`, le immagini delle 17 navi in due prospettive e gli **SVG sorgente** delle 82 carte ufficiali; gli SVG servono per rigenerare i PNG HD.
- `npm run preflight` blocca il ritorno dei vecchi nomi, del pulsante di prova e degli ingressi sperimentali. Il collaudo grafico su smartphone resta un controllo separato.

- **Audit sorgenti 12/11:** rimossi quattro moduli senza riferimenti nel percorso dell'app, nei test e negli script: `bossMechanicsEngine.js` (motore boss della versione precedente), `weaponsSystem.js` (vecchio database Hardpoint/carte arma), `pvpConnectivity.js` (coda Poker online), `eliteServices.js` (servizi classifica online non integrati). Restano i motori boss LIVE, il fallback, le armi integrate, lo Shop con i Moduli reali, il PvP simulato e i dati salvati. Il preflight blocca la ricomparsa dei moduli eliminati.

- **Pulizia del 12/11:** rimossi da `App.tsx` il registro delle 31 guide tutorial 3D della versione precedente, le finestre `FeatureDiscoveryModal` e `SpotlightHomeTour`, i relativi stati e le scritture obsolete in localStorage. Eliminato `src/legacyTutorialConfig.js` e rimossi anche 10,6 KB di CSS delle sole modali tutorial (`spotlight`, `discovery`, `tactile`). Aggiunta protezione preflight. Le guide future saranno progettate sul regolamento LIVE; non vengono modificati salvataggi, mazzi, Shop o logica della campagna.

- **Componenti inattivi 12/11:** rimosse da `App.tsx` cinque vecchie schermate mai richiamate (banner risoluzione, ponte Möbius, fusione neutronica, astrolabio e celebrazione vittoria): circa 30 KB di codice inutilizzato. Conservati il varco gravitazionale, la Cripta, il briefing e tutti i componenti richiamati dall'app. Blocco di regressione aggiunto al preflight.

## Motore e compatibilità

- **Carte Arma della versione precedente** — Rimossi dal Bazar il tab Armi, l’Arsenale 2.0 e gli Hardpoint acquistabili. In Area Personale si gestiscono la flotta e le carte tramite l’Hangar e le relative sezioni del Bazar.
- **Duello ufficiale attuale:** `src/MathDuelBattle.jsx` seleziona `src/OfficialLiveBattle3D.jsx` e, dove necessario, il fallback `src/BossBattle3D.jsx`. Il motore LIVE è `src/officialLiveDuelEngine.js`. La vecchia plancia simultanea `src/OfficialBattle3D.jsx` e il componente dismesso `TacticalCombatPlayback.jsx` sono stati eliminati: i relativi test di geometria e gli effetti sono ora verificati sulla LIVE. Il CSS condiviso `OfficialBattle3D.css` resta necessario alla plancia attuale. Restano l'arena Titanio 9:16, 17 navicelle e 42 armi integrate.
- **Piloti comuni convertiti:** `pilot_com_1`–`pilot_com_4`, gradi L1-L5. I bonus delle armi valgono soltanto con calcoli matematici corretti e un pilota effettivamente sbloccato.
- **Passiva Gaia:** `planet_char_1` (Baluardo terrestre), tre gradi di aumento dello scudo iniziale/massimo.
- **Passiva Crono:** `planet_char_6` (Primo anello), tre gradi di riduzione del primo colpo efficace alla madre.
- **Passiva Tharsis:** `planet_char_2` (Pressione marziana), tre gradi di bonus sui vitali colpiti efficacemente in sequenza, senza danni gratuiti su firme sbagliate.
- **Passive Ombre:** `planet_char_9` (Potenza disperata + Oscurità terminale), sei livelli distribuiti sui due effetti: scudo ≤35% e due vitali propri KO.
- **Passive Idra:** `planet_char_11` (Precisione criogenica + Teste alternate), sei livelli: divisione esatta e alternanza di bersagli vitali realmente colpiti.
- **Passive Leviatano:** `planet_char_8` (Marea del riciclo + Profondità tattica), sei livelli: vero rimescolamento delle 52 carte e calcolo valido con tre numeriche.
- **Compatibilità preservata:** `src/BossBattle3D.jsx` continua a gestire battaglie boss, piloti avanzati, le 14 passive boss non ancora migrate e gli ambienti con effetti ionici non ancora convertiti. Non è un gioco di prova, ma il percorso 3D preesistente che conserva poteri e salvataggi fino alla migrazione.
- **IA locale:** `src/tacticalDuelAi.js` prepara gli ordini dell'avversario senza conoscere la mano o gli ordini nascosti del giocatore. Il PvP online con server autoritativo non è ancora implementato.

## Controlli automatici

```bash
npm ci
npm run verify:logic
npm run build
npm run preflight
npm run dev
```

GitHub Actions esegue test logici, compilazione e preflight su `main`. `scripts/check-official-3d.mjs` verifica l'ingresso unico, i mazzi separati e gli asset del combattimento. **I test non sostituiscono un collaudo visivo su smartphone.**

## Grafica da conservare

- Arena base: `public/assets/mathduel/arena_titanio_9x16.webp`.
- Navi in due prospettive: `public/assets/mathfleet/views/`.
- Gli SVG di sagome sovrapposte `public/assets/ship-shells/` sono stati eliminati: la plancia usa le immagini raster ufficiali delle navi.
- Scudiere originali: `public/assets/escorts/`.
- Montaggi originali delle armi: `ShipPresentation.jsx` e `mathFleetGeometry.js`.

La rappresentazione è una composizione 3D prospettica realizzata con asset raster e SVG: non è ancora una scena con mesh tridimensionali e telecamera libera. L'allineamento mobile di navi, carte e colpi deve ancora essere verificato su dispositivo reale.

## Ripristino dei quattro vitali fisici — 7 novembre 2026

La versione LIVE ufficiale **non disegna quattro caselle separate al centro della plancia**. Usa gli stessi componenti grafici che esistevano nella versione di recupero:

- `src/BossBattle3D.jsx` espone `ShipSkin` e `Engine`: maschera della scocca raster originale, scolorimento localizzato, fratture, fumo persistente sul componente KO e animazione d'impatto. Le battaglie compatibili mantengono esattamente lo stesso comportamento grafico di prima.
- `src/ShipPhysicalVitals.jsx` è ora un semplice adattatore a questi due componenti, **non** un renderer alternativo. I veri HP del duello determinano quale pezzo è integro, danneggiato, critico o KO; i bersagli si selezionano direttamente sui loro punti fisici.
- `src/officialVitalMotorAdapter.js` usa **solo le quattro coordinate storiche** di `mathFleetGeometry.js` per ogni modello: Motore → `plus`, Armi → `minus`, Generatore → `times`, Centralina → `divide`. Non introduce coordinate disegnate a mano, copie di navi o HP fittizi.
- La plancia Titanio, le navicelle e le rispettive dimensioni, le mani 7+5, i mazzi e il pannello di preparazione non sono stati riposizionati. L'area del vecchio pannello dei vitali è stata liberata, lasciando solo il timer del ciclo.
- `src/officialVitalMotorAdapter.test.js` confronta le quattro posizioni originarie su **17 navi × 2 viste**, oltre alla proiezione degli HP senza mutare i dati originali. `.github/workflows/capture-official-battle.yml` controlla nel browser quattro bersagli, allineamento pixel allo sprite e selezione del Motore.
- **Screenshot reali del browser:** `docs/screenshots/plancia-attuale-battaglia.jpg` (app avviata). `docs/screenshots/plancia-vitali-danneggiati.jpg` è invece un **test grafico a HP imposti temporaneamente nel browser**, non l'esito di una partita reale: dimostra la resa del motore KO, di Armi critico, di Generatore danneggiato e di Centralina integra. Il test temporaneo non viene aggiunto al codice del gioco.

**Rimane aperta una sola verifica distinta:** il collaudo diretto degli effetti animati durante una partita completa su dispositivo fisico, in particolare fumo in movimento, scie e fluidità Android. Il test grafico e la build non devono essere descritti come quel collaudo.

## Lavoro residuo

Le **12 Carte Personaggio Boss**, le **4 Carte Terreno PvP**, le **35 Carte Modulo** e le altre speciali hanno già il catalogo e gli asset PNG nella versione corrente. Rimangono da verificare sul dispositivo mobile le animazioni, la leggibilità della plancia 9:16 e le differenze funzionali del fallback boss, senza rimettere in funzione il vecchio Poker. Non eliminare `BossBattle3D.jsx` prima della piena copertura funzionale e dei relativi test.

**Specifiche correnti:** [Handoff del duello LIVE](docs/WORK_HANDOFF_DUELLO_LIVE_E_REDESIGN_2026-11-10.md) · [Checklist visiva](docs/WORK_HANDOFF_CONTROLLO_VISIVO_ECLISSI_STELLARE.md). Le vecchie istruzioni del regolamento simultaneo rimangono nella cartella `docs/` soltanto come archivio storico.
