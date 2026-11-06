# Eclissi Stellare — recupero operativo delle decisioni aperte

Data: 6 novembre 2026. Repository ufficiale unico: `marcoteghini1988-ai/test7`, ramo `main`. Nessuna copia, nessuna migrazione distruttiva dei salvataggi, niente tutorial prima della stabilizzazione del gioco.

Questo documento distingue le nuove correzioni **in codice** dai lavori ancora aperti. Non trasforma arbitrariamente in "conclusi" tutti i 53 punti della scaletta originale; i punti 44–47 delle ultime chat avevano una numerazione locale diversa.

## Blocchi appena corretti nel gioco

### 1. Regolamento unico e salvataggio flotta

- Il duello attivo usa **una carta madre per lato**. Tutte le altre carte restano di proprietà del giocatore, ma non costituiscono altre madri contemporanee.
- In precedenza un vecchio loadout con 2–3 madri disattivava silenziosamente `vitalPrototype`: tornava il vecchio combattimento senza i quattro vitali e le scudiere. La funzione `prepareMotherDuelOptions` in `src/motherDuelLoadout.js` normalizza lo schieramento a una sola madre senza riscrivere il salvataggio storico.
- Le scudiere vengono create dai loro livelli reali: 0 a L1/L2, 1 a L3/L4 e 2 a L5.
- Hangar e selettore prima dello scontro consentono di equipaggiare UNA madre. Nessun esemplare posseduto viene perso.
- Cambiare madre prima del primo colpo ora **ricomincia correttamente** la battaglia, con bersagli numerici, firme vitali, mani, scudi, IA e ambiente coerenti. È stato eliminato un percorso che ricopiava soltanto gli scudi e le navi lasciando vecchie firme e numeriche.

### 2. Nemici e piloti della campagna

- I **120 settori** ora possono usare una vera madre rivale del catalogo, diversa da quella del giocatore e compatibile con le operazioni matematiche installate su entrambe le parti. Nessun motore richiesto viene nascosto o inventato.
- L'IA non ha più sempre lo stesso comandante: i settori ordinari ruotano tra le quattro specializzazioni matematiche disponibili; i **12 boss** usano comandanti distinti del catalogo delle 33 abilità (inclusi piloti con identità appropriate per i pianeti 14 e 17). I bonus si applicano solo quando si verifica la loro condizione reale.
- La modalità di prova conserva il rivale scelto quando compatibile. Un modello incompatibile non produce bersagli impossibili.
- Il duello in modalità PvP attuale resta chiaramente **simulato contro IA**: non viene presentato come una partita online e non attribuisce risultati o ricompense come PvP online autentico. La vera rete PvP resta un lavoro separato.

### 3. Navicelle ottenibili e potenziabili

- Le altre 16 navicelle del catalogo diventano **ricompense permanenti e non duplicabili** a traguardi di prima vittoria: 3, 6, 9, 12, 15, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 110.
- In Bazar ogni modello non posseduto mostra il settore previsto. I risultati di prova, PvP, replay e i settori senza traguardo non creano carte aggiuntive.
- Le carte possedute possono essere potenziate nel Bazar da L1 a L5 utilizzando la **Polvere Stellare già esistente**. I costi variano per rarità/livello e sono validati prima della transazione; non è ammesso saltare livelli o acquistare una nave inesistente.
- I prezzi sono attualmente **parametri di bilanciamento**. Nessun denaro reale o moneta nuova.
- La collezione delle navi, i numeri dei livelli, le risorse originali e il mazzo delle speciali mantengono le proprie chiavi di salvataggio.

### 4. Due nuove fusioni con carte vere

- `fusion-twin`: **Fusione Gemellare**, entrambe le scudiere si agganciano tra loro. Sono temporaneamente escluse dal fuoco indipendente; intercettano complessivamente fino al 55% del colpo alla madre usando soltanto i loro scudi esistenti.
- `fusion-triad`: **Fusione Trina**, madre e due scudiere. Le scudiere non sparano mentre sono agganciate; la madre ha +35% soltanto contro lo scudo avversario, mentre le due scudiere possono assorbire fino al 40% del colpo in ingresso con HP autentici.
- Entrambe: carta speciale specifica **obbligatoria** e realmente consumata, 100 Sincronia, entrambe le scudiere presenti e con scudi attivi, centralina e motore madre funzionanti, 12 secondi attivi, 28 secondi di ricarica, impossibilità di due fusioni contemporanee.
- Il danno combinato dopo le passive resta soggetto al tetto del punto 45, **+45%** sulla salva originale. Le fusioni non creano proiettili, HP o munizioni.
- IA, feedback visivo di aggancio, HUD, consumo/riciclo della mano speciale, deckbuilding e pacchetti sono collegati.
- Catalogo totale attuale: **11 tipi di carte speciali**, 24 carte equipaggiate, max 6 copie per tipologia; la composizione iniziale non cambia. Le nuove fusioni iniziano con **zero copie**, ottenibili nei pacchetti. I salvataggi v1 precedenti migrano solo questi due campi a zero, preservando le altre carte e i progressi.

## Test aggiunti o estesi

- `src/motherDuelLoadout.test.js`: tutti i 17 modelli ai cinque livelli, 120 settori, boss e salvataggi di più navi.
- `src/shipCampaignRewards.test.js`: 16 ricompense, proprietà persistente, idempotenza, assenza premi di prova e salvataggi illeggibili.
- `src/shipUpgrades.test.js`: costi per quattro rarità e cinque livelli, proprietà/risorse, progressione senza salti e persistenza.
- `src/fleetManeuvers.test.js`: fusioni avanzate, doppi agganci, scudo vero, interruzioni, fuoco di scorta disabilitato, moltiplicatori limitati.
- `src/specialCards.test.js`: due carte reali, requisito doppia scudiera, refill a cinque e 24 ID conservati.
- `src/specialDeckBuilder.test.js`: pacchetti, catalogo a undici e migrazioni v1 senza alterare vecchi salvataggi.

I controlli automatici ufficiali sono `npm run verify:logic`, `npm run build` e `npm run preflight` in GitHub Actions.

## Ancora aperto — da non spacciare per completo

1. **Firme definitive dei 17 modelli**, dei 12 boss e delle scudiere: `src/modelSignatures.js` identifica tuttora il profilo come provvisorio. Anche le vie matematiche/Poker avanzate vanno curate senza ripristinare il Poker come unica condizione.
2. **Bilanciamento giocato**: durata reale delle battaglie, scelta razionale dei bersagli da parte dell'IA, frequenza di speciali, moltiplicatori, costo/premi, tassi di vittoria per modello e fase dell'arena.
3. **Modalità**: unificare in modo verificato le modalità originarie intorno al nuovo regolamento e progettare un PvP online davvero sincronizzato, autenticato ed equo. Il vecchio codice Poker online non equivale a PvP matematico funzionante.
4. **Progressione avanzata**: valutare ricompense di boss, reliquie, attività periodiche, rarità dei pacchetti, conversione doppioni e sblocco di nuovi effetti dopo prove di economia.
5. **Grafica conclusiva**: modelli 3D e immagini personaggi; effetti visivi unici dei boss e delle arene. Le correzioni CSS attuali sono solo feedback di prototipo, non le risorse finali.
6. **Collaudo su smartphone reale**: apertura di tutti i menu, continuità dei salvataggi, navigazione dopo vittoria, prestazioni con molte raffiche, leggibilità e dimensioni 9:16.

**Tutorial sospesi esplicitamente**: non intervenire finché il regolamento non è stabile e non sono state provate partite complete.

## Fonti del codice

`src/motherDuelLoadout.js`, `src/MathDuelBattle.jsx`, `src/ShipCollectionPanels.jsx`, `src/shipCampaignRewards.js`, `src/shipUpgrades.js`, `src/App.tsx`, `src/fleetManeuvers.js`, `src/specialCards.js`, `src/specialDeckBuilder.js`.

La continuità rimane nel documento `docs/MASTER_DECISIONI_ECLISSI_STELLARE_2026-11-06.md`. Non riscrivere la master né cambiare la numerazione ufficiale di 53 punti per mascherare le fasi ancora aperte.
