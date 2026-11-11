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
- **Conservare** `BossBattle3D.jsx` (fallback 3D ancora raggiungibile), la logica boss necessaria, i test `*.test.js`, le immagini delle 17 navi in due prospettive e gli **SVG sorgente** delle 82 carte ufficiali; gli SVG servono per rigenerare i PNG HD.
- `npm run preflight` blocca il ritorno dei vecchi nomi, del pulsante di prova e degli ingressi sperimentali. Il collaudo grafico su smartphone resta un controllo separato.

## Motore e compatibilità

- **Carte Arma della versione precedente** — Rimossi dal Bazar il tab Armi, l’Arsenale 2.0 e gli Hardpoint acquistabili. In Area Personale si gestiscono la flotta e le carte tramite l’Hangar e le relative sezioni del Bazar.
- **Duello ufficiale attuale:** `src/MathDuelBattle.jsx` seleziona `src/OfficialLiveBattle3D.jsx` e, dove necessario, il fallback `src/BossBattle3D.jsx`. Il motore LIVE è `src/officialLiveDuelEngine.js`. La vecchia plancia simultanea `src/OfficialBattle3D.jsx` è mantenuta come riferimento tecnico, non è l'ingresso principale. Restano l'arena Titanio 9:16, 17 navicelle e 42 armi integrate.
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

La versione standard simultanea **non disegna più quattro caselle nel centro della plancia**. Usa gli stessi componenti grafici che esistevano nella versione di recupero:

- `src/BossBattle3D.jsx` espone `ShipSkin` e `Engine`: maschera della scocca raster originale, scolorimento localizzato, fratture, fumo persistente sul componente KO e animazione d'impatto. Le battaglie compatibili mantengono esattamente lo stesso comportamento grafico di prima.
- `src/ShipPhysicalVitals.jsx` è ora un semplice adattatore a questi due componenti, **non** un renderer alternativo. I veri HP del duello determinano quale pezzo è integro, danneggiato, critico o KO; i bersagli si selezionano direttamente sui loro punti fisici.
- `src/officialVitalMotorAdapter.js` usa **solo le quattro coordinate storiche** di `mathFleetGeometry.js` per ogni modello: Motore → `plus`, Armi → `minus`, Generatore → `times`, Centralina → `divide`. Non introduce coordinate disegnate a mano, copie di navi o HP fittizi.
- La plancia Titanio, le navicelle e le rispettive dimensioni, le mani 7+5, i mazzi e il pannello di preparazione non sono stati riposizionati. L'area del vecchio pannello dei vitali è stata liberata, lasciando solo il timer del ciclo.
- `src/officialVitalMotorAdapter.test.js` confronta le quattro posizioni originarie su **17 navi × 2 viste**, oltre alla proiezione degli HP senza mutare i dati originali. `.github/workflows/capture-official-battle.yml` controlla nel browser quattro bersagli, allineamento pixel allo sprite e selezione del Motore.
- **Screenshot reali del browser:** `docs/screenshots/plancia-attuale-battaglia.jpg` (app avviata). `docs/screenshots/plancia-vitali-danneggiati.jpg` è invece un **test grafico a HP imposti temporaneamente nel browser**, non l'esito di una partita reale: dimostra la resa del motore KO, di Armi critico, di Generatore danneggiato e di Centralina integra. Il test temporaneo non viene aggiunto al codice del gioco.

**Rimane aperta una sola verifica distinta:** il collaudo diretto degli effetti animati durante una partita completa su dispositivo fisico, in particolare fumo in movimento, scie e fluidità Android. Il test grafico e la build non devono essere descritti come quel collaudo.

## Lavoro residuo

Le **12 Carte Personaggio Boss**, le **4 Carte Terreno PvP**, le **35 Carte Modulo** e le altre speciali hanno già il catalogo e gli asset PNG nella versione corrente. Rimangono da verificare sul dispositivo mobile le animazioni, la leggibilità della plancia 9:16 e le differenze funzionali del fallback boss, senza rimettere in funzione il vecchio Poker. Non eliminare `BossBattle3D.jsx` prima della piena copertura funzionale e dei relativi test.

**Specifiche correnti:** [Roadmap del duello simultaneo](docs/ROADMAP_DUELLO_TATTICO_SIMULTANEO_2026-11-07.md) · [Trasferimento e checklist visiva](docs/WORK_HANDOFF_CONTROLLO_VISIVO_ECLISSI_STELLARE.md). Le vecchie istruzioni dei punti 22–30 restano disponibili nella cartella `docs/` come documentazione storica e non vanno usate per avviare il regolamento simultaneo.
