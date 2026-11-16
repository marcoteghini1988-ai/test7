# Eclissi Stellare — rimozione carte storiche (16 novembre 2026)

## Rimozione eseguita
- 238 vecchie carte generiche non Personaggio ritirate da `src/fleetNext/catalogGeneral.json`.
- 112 vecchie carte esclusive non Personaggio ritirate da `src/fleetNext/catalogExclusive.json`.
- 350 in totale, non pescabili, non acquistabili, non equipaggiabili e non più riconosciute da `card(id)`.

## Elementi conservati
- 12 Personaggi generici, 17 Personaggi esclusivi delle navi, 12 Personaggi Boss.
- 6 carte tecniche in `src/fleetNext/progressionCards.js`: due Macchine d'assalto, Aggiramento e tre Fusione.
- 17 modelli navicelle incluse le varianti, progressione delle 12 principali ai livelli 1–5, componenti vitali, supporti, Arena 3D, campagne e Terreni ambientali dei Boss.
- Le nuove 120 carte in `docs/NUOVO_CATALOGO_ESCLUSIVE_120_2026-11-16.json` **sono progettate ma non ancora giocabili**.

## Stato transitorio
- Mazzo provvisorio di 40 carte: Personaggi e sei carte tecniche tramite copie consentite.
- Pacchetti e mazzi preconfezionati sospesi per evitare acquisti del vecchio contenuto.
- La chiave del salvataggio resta `eclissi_fleet_collection_v2`. Lo schema passa a 3: carte dismesse conservate in `retiredOwned`, mazzo precedente in `retiredDeck`, precedenti gradi in `retiredExclusiveUpgrades`. Rimangono crediti, premi Boss, navicella scelta e progressione.
- Il file `src/fleetNext/retiredCardIds.json` contiene esclusivamente gli ID ritirati, non le loro regole.
- Gli asset SVG/WebP approvati non sono stati modificati né cancellati: restano storici nel repository, non più raggiungibili dal catalogo. La sostituzione grafica sarà svolta successivamente.

## Verifiche
- Controlli aggiornati per 47 carte attive, conservazione Personaggi/Boss, migrazione inventario, progressione e macchine.
- I test riferiti alle 350 carte ritirate non sono più applicabili e sono stati sostituiti/rimossi dalle suite correnti.
- Controlli di coerenza sulle definizioni eseguiti confrontando i contenuti aggiornati del repository.
- Non si dichiara effettuata una compilazione o prova browser in questa fase; verificare `npm run preflight`, `npm run verify:logic`, `npm run build` prima di considerare giocabile il nuovo catalogo.
