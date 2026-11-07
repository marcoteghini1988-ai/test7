# Eclissi Stellare — 12 Carte Personaggio Boss (versione giocabile)

**Stato: 7 novembre 2026. Repository ufficiale `marcoteghini1988-ai/test7`, ramo `main`.**

## Distinzione obbligatoria dei tre sistemi

1. **12 poteri esclusivi dei boss nemici** — sempre nel combattimento di campagna contro il rispettivo boss, già implementati.
2. **12 mazzi numerici boss / 23 passive** — equipaggiamento a gradi di miglioramento, ottenuto/acquistato tramite progressione esistente. Non rappresentano Personaggi schierati.
3. **12 Carte Personaggio Boss** — carte SPECIALI collezionabili, ottenute immediatamente soltanto dopo aver **sconfitto davvero** il proprio boss. Occupano **un posto vero** nel mazzo speciale di 24; quando pescate appaiono nei **cinque slot** esistenti e consumano la loro istanza quando vengono giocati gli ordini. Non cambiano le sette numeriche, le firme matematiche o la base 3D 9:16.

## Sblocco e collezione

- L'evento `claimBossCharacterFromVictory({winner:'player',mode,sectorNumber,bossPlanetId,bossSectorLevel})` richiede un **boss reale coerente col settore/pianeta** e una vera vittoria.
- Premia **una sola copia** di `boss-character-ID_PIANETA` per pianeta, con chiave persistente univoca `boss:character:ID`. Campagna e Avventura **non** possono duplicare la stessa carta.
- Sconfitta, pareggio, PvP, settore normale o incoerente non assegnano carte e **non riscrivono il salvataggio**.
- La carta **entra nella collezione**, non viene aggiunta gratuitamente al mazzo equipaggiato: è il giocatore a sostituire una delle 24 speciali nell'Hangar. Massimo una copia di ciascun Personaggio Boss nel mazzo.
- Le carte Personaggio **non compaiono nei pacchetti casuali**; restano negli 11 tipi di drop ordinari. Nessun prezzo, acquisto, valuta o probabilità inventati.
- Le vecchie collezioni `eclissi_special_collection_v1` senza queste 12 chiavi vengono lette come 0 copie: progressione, pacchetti, mazzo esistente, vittorie e claim salvati rimangono intatti.

## Regolamento comune (provvisorio di bilanciamento)

- **Un solo Personaggio Boss attivo per flotta** (A o B): anche se si possiedono carte diverse, non si possono attivare due Personaggi nello stesso ciclo o sostituire quello ancora attivo.
- Durata **2 cicli di combattimento** compreso quello in cui viene giocato; dal terzo l'effetto è scaduto e una nuova carta Personaggio può essere attivata.
- Si può giocare normalmente insieme a una seconda speciale non Personaggio, perché il limite globale di **2 speciali per ciclo** resta invariato.
- Le capacità non infliggono danni diretti gratuiti: si applicano solo a danni nativi/precisioni realmente eseguiti, contromisure efficaci, calcoli validi, status, HP e Sincronia autentici.
- Le difese non bypassano firme matematiche o protezione dei vitali; gli aumenti di fuoco nativo rispettano il cap +45% già nel duello, il boost delle scudiere il cap +45% del proprio pacchetto; la Sincronia massima resta 100.
- Le carte si consumano normalmente e vanno nel discard della pila da 24; la mano torna a cinque mediante le regole preesistenti.

## Catalogo delle 12 carte

| Pianeta | Carta (ID) | Abilità giocabile per due cicli |
|---|---|---|
| Terra (1) | `boss-character-1` — Guardiano di Gaia | Riparo tellurico: −15% ai danni veri sulla barriera madre |
| Marte (2) | `boss-character-2` — Colosso di Tharsis | Furia controllata: +8% fuoco nativo, entro cap |
| Venere (3) | `boss-character-3` — Matriarca Tossica | Spora corrosiva: un colpo nativo efficace applica vera Corrosione, rimovibile con Pulizia |
| Saturno (6) | `boss-character-6` — Crono il Distruttore | Contrattacco cronometrico: +8 Sincronia da una Contromisura che respinge davvero un colpo vitale |
| Urano (7) | `boss-character-7` — Sentinella Ionica | Gabbia dielettrica: −30% durata di Ionizzazione subita; si somma ai fattori ambiente e mazzo numerico senza cambiare i danni |
| Nettuno (8) | `boss-character-8` — Leviatano Abissale | Guardia degli abissi: −12% sulla barriera madre finché esiste almeno una scudiera viva |
| Plutone (9) | `boss-character-9` — Signore delle Ombre | Lama delle ombre: +9% fuoco nativo con scudo proprio ≤35% **all'inizio del ciclo**, anche se lo si ripara dopo |
| Europa (11) | `boss-character-11` — Idra Criogenica | Riserva criogenica: dopo danno reale alla propria barriera, +4 HP al massimo nel ciclo seguente, **una volta**, generatore attivo |
| Proxima b (14) | `boss-character-14` — Generatore del Caos | Convertitore di flusso: +5 Sincronia se la formula numerica è valida, max 100 |
| Haumea (17) | `boss-character-17` — Cristallo di Risonanza | Coro delle scudiere: +10% danno potenziale della scudiera se anche la madre ha già realmente danneggiato la barriera |
| Io (19) | `boss-character-19` — Nucleo Magmatico | Forgia instabile: +8% fuoco nativo contro nemico già corroso e ancora corroso al momento del tiro |
| Encelado (20) | `boss-character-20` — Sovrano del Vuoto | Frattura del vuoto: +8% precisione valida a un vitale esposto usando almeno due semi differenti |

**Nota:** le percentuali delle Carte Personaggio sono valori provvisori per playtest, differenti dai poteri nemici e dalle 23 passive numeriche. Se risultano troppo potenti si equilibrano i personaggi, **non** si modifica la meccanica del boss o del suo mazzo per compensare.

## Implementazione

- `src/bossCharacterCards.js`: ID, catalogo, durata, cooldown logico, abilità separate e condizioni.
- `src/bossCharacterRewards.js`: vittoria autentica e sblocco persistente univoco; usato da `OfficialBattle3D.jsx` e dal percorso compatibile `BossBattle3D.jsx` (solo ricompensa).
- `src/specialCards.js`, `src/specialDeckBuilder.js`, `src/SpecialDeckPanel.jsx`: collezione con migrazione non distruttiva, drop esclusi, una copia massima, editor del mazzo speciale.
- `src/simultaneousDuelEngine.js`: eventi di gioco della singola abilità, slot 24/5 e consumo; una sola attivazione contemporanea; 2 cicli, poi scadenza.
- `src/tacticalTimedStatus.js`: Gabbia dielettrica modifica la durata ionica in secondi di combattimento.
- `src/OfficialBattle3D.jsx`: descrizione Personaggio attivo e tempo residuo nel pannello carte **già esistente**, senza spostamento della plancia. La timeline mostra il consumo/attivazione della carta.

## Asset PNG mancanti — checklist grafica obbligatoria

**I dodici ritratti PNG non sono ancora presenti nel repository** e **non sono stati inventati** con immagini di navicelle o grafiche generiche. Il catalogo stabilisce il percorso di ciascuna immagine definitiva in `public/assets/boss-characters/boss-character-ID.png` (riferimento client `/assets/boss-characters/boss-character-ID.png`). Sono necessari **12 PNG individuali**, non soltanto un foglio riassuntivo: ID `1,2,3,6,7,8,9,11,14,17,19,20`.

Indicazioni artistiche coerenti con le identità esistenti: Gaia armatura tellurica; Tharsis guerriero marziano; Venere matriarca tossica; Crono entità temporale degli anelli; Urano sentinella ionica; Nettuno leviatano abissale; Plutone signore delle ombre; Europa idra criogenica; Proxima b generatore del caos; Haumea cristallo di risonanza; Io nucleo magmatico; Encelado sovrano del vuoto. Ogni carta deve apparire sullo slot speciale **esistente**, senza spostare le sette numeriche o la madre centrale.

**Nessun controllo visivo reale è stato eseguito su Android**. Prima di considerare chiuso il punto grafico verificare: identità boss coerente, proporzioni card, ritratto ritagliato nello slot corretto, leggibilità, uso in PvP, durata sul HUD e nessuna sovrapposizione alle navicelle.

## Suite automatizzate

- `src/bossCharacterRewards.test.js`: 12 sblocchi coerenti, mai doppi, niente pacchetti, vecchi salvataggi, equipaggiamento e ponte al duello.
- `src/bossCharacterCombat.test.js`: dodici effetti, mano 5/mazzo 24, durata 2 cicli, validazioni, controesempi a zero colpi, rigenerazione una sola volta, status veri e cap.
- `npm run verify:logic`, `npm run build`, `npm run preflight` su GitHub Actions.

## Punti non completati

1. **12 asset PNG e collaudo visivo**: nessuna anteprima generica usata come surrogato.
2. **Playtest su telefono** per bilanciare numeri provvisori e impedire sovrapposizioni nei pannelli.
3. **Compatibilità giocabile nel percorso di battaglia storico** per utenti con piloti/abilità non ancora convertiti: il fallback legacy può ricevere lo sblocco della carta, ma attualmente l'esecuzione delle 12 capacità temporanee è collegata al nuovo duello simultaneo. Non dichiarare entrambi i motori equivalenti finché questa limitazione non è rimossa.

**Prossima scaletta:** immagini 12 Personaggi Boss; prova di 12 incontri reali; Carte Terreno PvP (solo PvP, mai sostituire l'arena fissa dei boss), piloti avanzati e ulteriori punti strategici.
