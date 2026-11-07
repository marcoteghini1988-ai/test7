# Eclissi Stellare — 12 boss ufficiali migrati e tiro delle scudiere

Stato: 7 novembre 2026. Repository **marcoteghini1988-ai/test7**, ramo **main**. Nessuna copia, nessun redesign.

## Risultato

**12/12 boss** della campagna e dell'avventura, con settore e pianeta coerenti, vengono ora instradati nel **duello simultaneo 30 s + 8 s**. Conservano:

- **Potere esclusivo** specifico del pianeta, già integrato nel nuovo motore.
- **Mazzo numerico nemico** `planet_char_ID` originale, con le passive del livello progressivo storico `min(maxLevel, 1 + floor((sectorNumber - 1)/20))`. Non assegna carte al giocatore.
- **Pilota storico del boss** scelto da `chooseCampaignRivalCommander`, con livello originale; dodici piloti convertiti senza sostituire il trigger con un bonus indiscriminato.
- **Arena esclusiva boss** `boss_ID`, colori/atmosfera e modificatori esistenti; la base metallica 3D, le immagini nave e il formato verticale 9:16 restano invariati.
- **Mazzo delle 24 speciali del boss**, 5 reali in mano, IA locale che utilizza solo le proprie carte.
- **Risultato e ricompense**: l'unico `onResult` finale riceve `winner`, `turnsElapsed`, `remainingHpPct`, `starsEarned` e `matchStats`; pacchetto speciale e sblocco navicella richiedono una vittoria in campagna/avventura. Nessuna ricompensa in PvP, sconfitta o pareggio. Non si scrive alcun salvataggio al caricamento.

## Mappa completa

| Settore globale | Pianeta (ID) | Mazzo numerico avversario | Pilota del boss |
|---|---|---|---|
| 10 | Terra (1) | planet_char_1 | pilot_boss_1 |
| 20 | Marte (2) | planet_char_2 | pilot_boss_2 |
| 30 | Venere (3) | planet_char_3 | pilot_boss_3 |
| 40 | Saturno (6) | planet_char_6 | pilot_boss_6 |
| 50 | Urano (7) | planet_char_7 | pilot_boss_7 |
| 60 | Nettuno (8) | planet_char_8 | pilot_boss_8 |
| 70 | Plutone (9) | planet_char_9 | pilot_boss_9 |
| 80 | Europa (11) | planet_char_11 | pilot_boss_11 |
| 90 | Proxima b (14) | planet_char_14 | pilot_epic_2 |
| 100 | Haumea (17) | planet_char_17 | pilot_leg_1 |
| 110 | Io (19) | planet_char_19 | pilot_boss_19 |
| 120 | Encelado (20) | planet_char_20 | pilot_boss_20 |

L'esclusivo del boss e il mazzo numerico sono *due sistemi distinti*, proprio come la vecchia modalità. I dodici piloti riutilizzano **le condizioni originali** registrate in `src/commanderAbilities.js`, mediante l'adattatore `src/tacticalBossCommanderBridge.js`. I piloti non convertiti rimangono sul motore precedente, senza venir assegnati automaticamente.

Per pianeta mancante/incoerente, settore non boss o pilota equipaggiato non ancora compatibile, `src/officialSimultaneousBridge.js` continua a instradare verso `BossBattle3D.jsx` invece di simulare un boss generico. Il nuovo sistema è abilitato solo con condizioni verificate.

## Scudiere — effetti visivi collegati

Le scudiere posseggono gli armamenti storici in `src/escortArmory.js`; i veri impatti sono `escort_barrier` e l'animazione è `escort_gun`.

La sequenza `tacticalCombatTimeline` recupera **solo** spari realmente rilasciati, il `sourceWeaponId` dell'arma e il suo profilo grafico. `TacticalCombatPlayback` misura le coordinate DOM dell'immagine laterale esistente e spara da quel punto. I colpi ad Accumulo senza soglia raggiunta non disegnano proiettili. L'impatto mostrato è quello calcolato dal motore; l'animazione non può infliggere un danno extra.

Le navi, la plancia centrale, le carte, i mazzi e le posizioni degli slot **non sono stati spostati**.

## Verifiche eseguite

- Cataloghi 12 boss, 12 arene, 12 mazzi numerici nemici, 12 piloti, 23 passive numeriche.
- `src/officialBossEncounter.test.js`: ogni boss conserva il proprio ID, bossExclusive, mazzo numerico, livello, arena e pilota storico; 3 cicli simulati con IA; 52 numeriche e 24 speciali autentiche; controlli vittoria/sconfitta/pareggio.
- `src/tacticalBossCommanderBridge.test.js`: i 12 trigger e livelli boss vengono verificati in isolamento; una formula falsa non attiva un bonus.
- `src/tacticalCombatTimeline.test.js` e `src/tacticalVisualGeometry.test.js`: nessun proiettile senza un vero sparo, origine scudiera misurata su DOM, profilo VFX coerente, zero colpi aggiuntivi.
- `npm run verify:logic`, `npm run build`, `npm run preflight` superati nell'ultima verifica GitHub.

## Collaudo ancora aperto

1. **Verifica visiva reale su smartphone 9:16**: posizionamento e profondità dei proiettili delle scudiere, sovrapposizioni e specificità delle arene boss. Non sostituire immagini originali con mockup.
2. **Playtest di bilanciamento**: 20 cicli massimi, durata target boss, differenze tra armi, poteri numerici ed esclusivi, scala scudiera massimo 12 HP.
3. **Progressione completa sul dispositivo**: osservare realmente rivendicazione reliquie, stelle, sblocchi e salvataggi preesistenti; i test automatici hanno verificato i dati e i gate delle ricompense, non una partita manuale end-to-end.

## Prossimi punti aggiuntivi della scaletta

Carte Personaggio Boss (12) e relative immagini reali, Terreni PvP nel mazzo speciale, Mutazione delle Firme, piloti non boss avanzati, reliquie e altri contenuti planetari. Vanno affrontati dopo il collaudo visivo o in un ramo logico senza alterare la plancia ufficiale.
