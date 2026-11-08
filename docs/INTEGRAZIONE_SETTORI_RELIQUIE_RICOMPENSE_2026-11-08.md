# Eclissi Stellare — Chiusura logica: settori, boss, reliquie e premi

**8 novembre 2026 · repository unico test7/main, senza modifica a plancia e 42 armi.**

## Problema scoperto
Gli ID storici dei dodici pianeti sono 1,2,3,6,7,8,9,11,14,17,19,20; la campagna è invece costituita da **120 settori consecutivi**, dieci per pianeta. L'ingresso Avventura calcolava il settore in base all'ID, non all'ordine del pianeta: Saturno era considerato settore 60 anziché 40, Encelado 200 anziché 120. Questo poteva alterare difficoltà boss, progressione, pacchetti e sblocchi.

## Correzioni effettive
- `src/officialCampaignRouting.js` e `src/MathDuelBattle.jsx`: conversione canonica settore 1..120 per entrambi i motori 3D, conservando gli ID pianeti e le altre modalità.
- `src/officialBossEncounter.js`: in Campagna e Avventura un boss è valido soltanto al settore canonico 10,20,...120 del pianeta corrispondente; non bastano un ID e un livello 10 incoerenti.
- `src/campaignBossRelics.js` e `src/App.tsx`: reliquia originale per boss effettivamente riconosciuto e vinto, idempotente nella mappa storica e nel medesimo salvataggio `eclissi_unlocked_relics`.
- `src/officialBattleSetup.js` e `src/BossBattle3D.jsx`: identità boss, settore e livello locale riportati nella telemetria del risultato, senza assegnare stelle a chi perde o pareggia in legacy.
- `src/specialDeckBuilder.js`: non più due pacchetti cambiando etichetta Campagna/Avventura per lo stesso settore, né pacchetti per settori oltre 120. Riconosciute le due forme già salvate delle chiavi di primo premio; nessuna cancellazione.
- `scripts/check-official-3d.mjs`: guardrail aggiornato al nuovo ingresso unico.

## Test
- `src/officialCampaignRouting.test.js`: 120 settori, 12 incontri boss, 12 Carte Personaggio Boss, pacchetti e navi; lettura dopo premi e replay senza duplicati.
- `src/campaignBossRelics.test.js`: 12 reliquie, 6 coppie dei Varchi, idempotenza dopo serializzazione, niente premi falsi o per sconfitta/pareggio/PvP.
- `src/officialBossEncounter.test.js`: telemetria dell'incontro convertita in reliquia verificata per ciascun boss.
- `src/specialDeckBuilder.test.js`: doppia modalità, chiavi v1 conservate e limite 120 settori.

**CI [42483315300](https://github.com/marcoteghini1988-ai/test7/actions/runs/42483315300) conclusa con successo: 753/753 test, build e preflight.**

## Limiti e prossima fase
- I test automatici verificano l'intero percorso logico, non l'uso reale su un telefono né la persistenza attraverso una sessione browser completa.
- Una vecchia chiave `adventure:sector:60` può essere ambigua: potrebbe riferirsi a Saturno con la vecchia numerazione oppure a Nettuno nella numerazione corretta. Non è possibile migrare automaticamente quelle chiavi senza rischiare di duplicare o perdere premi. Non sono state alterate.
- Restano playtest su Android 9:16, gestione premi reali nella Cripta, eventuali vecchi salvataggi incoerenti, PvP online, difficoltà dei dodici boss e bilanciamento dell'economia.
- **Prossimo punto in scaletta: bilanciamento dei quattro vitali**. Il tiro di precisione standard da 10 HP contro un vitale da 10 HP può ancora causare KO in un solo colpo, impedendo un vero gioco di avarie progressive. Definire e testare una curva, senza modifiche grafiche anticipate.

Vincoli conservati: 17 madri, 42 armi native, due mazzi 52/24 e mani 7/5, madre centrale e scudiere ai lati, tutte le abilità attivabili esclusivamente tramite Carte Speciali possedute.
