**AGGIORNAMENTO CARTE PERSONAGGIO BOSS — 7/11/2026:** 12/12 Carte Personaggio Boss integrabili nel mazzo speciale vero (24 carte, 5 in mano), premio persistente e univoco dopo vittoria reale del boss, un solo personaggio attivo per due cicli, dodici effetti condizionati e testati. Il catalogo di gioco e la collezione sono completi; **non sono ancora presenti i dodici PNG definitivi né il collaudo visuale Android**. Il motore di battaglia storico supporta lo sblocco ma non ancora l'esecuzione di questi effetti giocabili. Fonte corrente: `docs/CARTE_PERSONAGGIO_BOSS_12_INTEGRAZIONE_2026-11-07.md`. Le sezioni cronologiche sottostanti che elencano le carte Personaggio come non iniziate sono superate.

**AGGIORNAMENTO SUCCESSIVO — 12 BOSS MIGRATI**: nella plancia 3D ufficiale del duello simultaneo sono ora attivati i settori boss riconosciuti, con mazzo numerico nemico storico, 12 piloti e arene esclusive. Il comportamento prima descritto come “campagna boss ancora legacy” è stato superato. I salvataggi incoerenti e i piloti non convertiti continuano sul motore precedente. Le verifiche visive su smartphone restano da fare. Specifica corrente: `docs/MIGRAZIONE_BOSS_E_ANIMAZIONI_SCUDIERE_07_11_2026.md`.

# Eclissi Stellare — scaletta aggiornata, 7 novembre 2026

**Fonte corrente per continuare lo sviluppo**: repository ufficiale `marcoteghini1988-ai/test7`, ramo `main`. Nessuna copia o modalità di prova. Tutti gli aggiornamenti descritti riguardano il motore ufficiale di duello simultaneo **30 secondi preparazione / 8 secondi risoluzione** e i suoi controlli. La grafica 9:16 resta quella originale e **non è stata ridisegnata**.

## Stato tecnico verificato

- **12/12 poteri esclusivi dei boss** scritti nel motore `src/tacticalExclusiveBosses.js`, integrati in `src/simultaneousDuelEngine.js`.
- **23/23 passive numeriche** convertite con gli stessi **tre gradi originali** di ciascuna abilità, distribuite nei dodici mazzi `src/bossNumericDecks.js` e `src/tacticalBossDecks.js`. Sono equipaggiabili solo tramite inventario reale, con livello già ottenuto.
- **17/17 famiglie scudiera** usano adesso le armi di `src/escortArmory.js` (due profili per madre; le scudiere presenti dipendono dal livello della nave). La scelta di una vera carta numerica alimenta una sola arma di scudiera per ciclo, separatamente dalle carte già impegnate in calcoli e ricambi.
- **Arene ioniche** abilitate per la campagna STANDARD: rispettano durate reali e modificatori atmosferici. I veri settori boss di livello 10 non sono ancora migrati al motore simultaneo.
- Test di stabilità: `src/tacticalFullBossRoadmapIntegration.test.js` simula i dodici boss contro tre classi di flotta e verifica HP, Sincronia, firme delle carte e unicità di tutte le **52 carte numeriche** e **24 carte speciali**. Ulteriori suite dedicated verificano le abilità una per una.

## I dodici poteri esclusivi

| # | Boss | Potere |
|---|---|---|
| 1 | Gaia, Terra | Corazza tellurica: mitiga una volta il primo impatto alla barriera |
| 2 | Tharsis, Marte | Assalto progressivo: cresce sui veri colpi consecutivi |
| 3 | Matriarca Tossica, Venere | Neurotossina: penalizza la prossima riparazione dopo vera precisione |
| 4 | Crono, Saturno | Controtempo: risposta dopo Contromisura realmente efficace |
| 5 | Sentinella Ionica, Urano | Sifone Quantico: trasferisce fino a 8 Sincronia esistente |
| 6 | Leviatano Abissale, Nettuno | Pressione degli abissi: +8% nativo con barriera nemica <=40% a inizio ciclo |
| 7 | Signore delle Ombre, Plutone | Patto di sangue: costo reale di 4 HP, bonus nativo +8%, intervallo tre cicli |
| 8 | Idra Criogenica, Europa | Rigenerazione criogenica: cura reale di 4 HP nel ciclo seguente, contrastabile con Cuori |
| 9 | Generatore del Caos, Proxima b | Reattore: tre colpi reali caricano la scarica successiva (+10%) |
| 10 | Cristallo di Risonanza, Haumea | Memoria degli scarti: ricava fino a 5 Sincronia da un colpo efficace dopo scarti autentici |
| 11 | Nucleo Magmatico, Io | Rotazione dichiarata Carica / Eruzione / Raffreddamento |
| 12 | Sovrano del Vuoto, Encelado | Seme dominante pubblico ruota ogni tre cicli; contrastabile con un colpo valido dello stesso seme |

## Le ventitré passive dei mazzi numerici

| Mazzo | Capacità numeriche, con gradi originali |
|---|---|
| Gaia — 1 | Baluardo terrestre |
| Tharsis — 1 | Pressione marziana |
| Afrodite — 2 | Ricambio armonico; Sintesi curativa |
| Anelli di Crono — 1 | Primo anello |
| Sentinella Ionica — 1 | Isolamento ionico |
| Leviatano — 2 | Marea del riciclo; Profondità tattica |
| Ombre — 2 | Potenza disperata; Oscurità terminale |
| Idra — 2 | Precisione criogenica; Teste alternate |
| Generatore — 2 | Schermatura instabile; Accumulo energetico |
| Risonanza — 3 | Armi armoniche; Frequenza multipla; Sinfonia di flotta |
| Nucleo Magmatico — 3 | Risonanza termica; Corrosione ardente; Forgia moltiplicatrice |
| Sovrano — 3 | Ultimo presidio; Vuoto difensivo; Supremazia |

### Quattro ultime regole completate

**Afrodite — Ricambio armonico.** Ricarica secondo il grado della prima abilità: L1 13s; L2 11s; L3–L6 9s. Durante i 30 secondi di preparazione il giocatore può sostituire una numerica dal proprio mazzo da 52 carte nel pannello Ricambio già esistente. Rispetta l'ordine sigillato, il timer, lo scarto autentico e la mano di sette. **Sintesi curativa** rimane la seconda abilità, sbloccata al livello 4 e potenziata ai livelli 5–6.

**Sentinella e Generatore — durate status.** Durate di partenza prese dall'arsenale storico: Ionizzazione **12 secondi**, Corrosione **15 secondi**. Sono secondi *di combattimento attivo*: i 30 secondi di pianificazione sono sospesi e ogni ciclo aggiunge 8 secondi di combattimento. Isolamento ionico riduce la sola Ionizzazione del 15/25/35%; Schermatura instabile riduce entrambi gli status del 15/25/35%. Il fattore ambientale ionico si applica alla durata, non al danno, ed è separato dalle carte Pulizia Sistemi, che azzerano flag e scadenza. Nessuna lettura delle mani avversarie.

**Risonanza — Sinfonia di flotta.** È necessaria una scudiera viva e una **carta numerica autentica** impegnata come munizione, esclusa dai calcoli e dai ricambi. La madre e la scudiera devono entrambe danneggiare realmente la barriera nello stesso ciclo. L1/L2/L3 dell'ultima abilità (sbloccata ai livelli 7/8/9) concedono **+3/5/7% sul vero colpo di scudiera**, con accumulo dei resti centesimali. Se una salva è solo caricamento, o se la madre o la scudiera non colpiscono la barriera, il bonus non viene applicato né accumulato.

**Munizioni delle scudiere.** Si utilizzano i due profili/ruoli/compatibilità di semi già esistenti in `ESCORT_ARMORY`. Una sola numerica può essere caricata per ciclo per ordine; i profili Accumulo conservano la carica autentica fino alla soglia e non sparano prima. Il motore protegge da doppio utilizzo dello stesso indice, fusione e copertura simultanee. L'IA sceglie soltanto dalla propria mano. L'impatto passa attraverso HP e intercettazione delle scudiere avversarie, difesa della madre, effetti arena e cap del tiro indipendente. Per la barriera da 60 HP del duello simultaneo si usa **scalatura di bilanciamento provvisoria ×1/4 e cap di 12 HP** per il colpo di una scudiera; questi valori richiedono playtest mobile prima della chiusura del bilanciamento.

## Cosa NON è stato ancora completato

1. **Boss in campagna ufficiale**: il settore 10 continua a usare `BossBattle3D.jsx` e i suoi boss originali. I dodici poteri esclusivi del **nuovo** motore non vengono ancora eseguiti in quel settore, poiché vanno collaudati la parità con le meccaniche storiche, l'IA boss, le arene esclusive, i ritmi e le ricompense. Non togliere la barriera di routing per il solo fatto che i test logici sono verdi.
2. **Presentazione visiva dell'attacco delle scudiere**: il modello ora registra `escort_barrier` con `escortWeaponId`, `weaponIds` e `cardId`, ma la nuova sequenza di proiettili dalla scudiera è **da collegare e verificare visivamente** nella timeline 3D. Non inventare una plancia nuova.
3. **Collaudo Android 9:16 effettivo**: servono screenshot reali del gioco, non mockup, per verificare il pannello Armamenti e il Ricambio, gli effetti e i colpi.
4. **Piloti avanzati, Carte Personaggio Boss, Terreni PvP, Mutazione della Firma, reliquie e arene aggiuntive**: restano nel piano degli ampliamenti, separati dalla conversione dei 23 passivi.

## Prossimo ordine di lavoro

- Verificare **parità effettiva** della campagna boss col motore simultaneo (12 combattimenti veri, differenze con il percorso storico, boss arena bloccata, ricompense).
- Collegare il colpo delle scudiere alla timeline delle bocche di fuoco originali con il `sourceWeaponId` già presente, senza spostare le immagini.
- Collaudare sul telefono, correggere bilanciamento 60 HP / cap12 / fusioni, e **solo dopo** rimuovere l'eventuale percorso compatibile dei settori boss.
- Passare ai punti aggiuntivi originariamente concordati e alle arene Terreno PvP senza ridisegnare l'arena standard.

**File implementativi**: `src/tacticalEscortVolley.js`, `src/tacticalTimedStatus.js`, `src/tacticalBossDecks.js`, `src/tacticalExclusiveBosses.js`, `src/simultaneousDuelEngine.js`, `src/tacticalDuelAi.js`, `src/OfficialBattle3D.jsx`. Tutte le modifiche sono nel ramo ufficiale `main`.
