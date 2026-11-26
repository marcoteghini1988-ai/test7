# Carte: inglese predefinito e traduzione senza rifare la grafica

## Ambito di questo inserimento

Le tre rarità del Nucleo (Rara, Epica, Leggendaria) sono migrate a testi
esterni. Nome inglese: **Growing Thunder Core Cannon**. Anche i nomi e gli
effetti delle quaranta Energie native usano gli stessi dizionari di lingua.
I 40 fronti Arma approvati restano recuperabili byte per byte; le altre
37 varianti non sono ancora migrate a questo sistema.

## Grafica e testo separati

`cardTextAssets.js` risolve una base PNG RGBA 3072×4608 senza scritte.
`cardTextPresentation.js` legge nome, descrizione e campi dai dizionari
`src/fleetNext/cardTexts.en.json` e `cardTexts.it.json`; danni e durate
provengono sempre dal catalogo corrente. `CardTextLayer.jsx` disegna le
scritte SVG con finitura della rarità, nello stesso spazio della carta.
Nessun testo deve essere generato dentro la nuova illustrazione.

Il locale predefinito è `en`. `setCardTextLocale('it')` cambia soltanto il
livello testo; le URL delle immagini e lo stato di combattimento restano
invariati. Il collaudo espone Card language e Read card. I dizionari sono
estendibili; una lingua ulteriore richiede le proprie stringhe e glifi.
Il font corrente è verificato tramite hash e metriche dei glifi: le righe
vengono ridimensionate nel loro settore senza spostare icone o cornice.

Mano, slot, collezione, scarti, rivelazione e volo della carta usano lo
stesso livello. La copia transitoria di perdita/scadenza usa il medesimo
SVG e rimuove il proprio listener al termine. La lingua non modifica il
motore, gli effetti approvati, il suono o il piano aptico.

## Migrazione degli originali

`build-core-card-text-bases.cjs` recupera i fondi dalle cornici originali
e le decorazioni non testuali dagli SVG sorgente conservati. Sostituisce
i pixel RGBA nei quattro settori delle scritte, senza sovrapporre pannelli
semitrasparenti. Tutti gli altri pixel, compresa l'illustrazione e l'alfa
esterna, sono identici al PNG approvato. Le basi nuove hanno un proprio
percorso e hash; gli originali non vengono sovrascritti.

Il manifest e le parti binarie in `asset-sources/card-text/nucleo-folgore`
permettono il ripristino verificato delle tre basi. Le parti non vengono
clonate nel WebContainer: StackBlitz serve le immagini dal commit fissato.

Le esportazioni PNG complete in inglese/italiano sono prove di lettura,
non il sorgente unico della carta. La pagina HTML incorporata usa tre
identiche immagini di fondo e sostituisce soltanto il testo SVG tramite
il selettore della lingua.

## Verifiche

- Nove confronti (base, inglese, italiano per tre rarità): nessun pixel
  modificato fuori dai settori testo. Report in
  `docs/collaudi/nucleo-localizzazione-2026-11-26/verifica-pixel.json`.
- Test: inglese iniziale, cambio EN/IT e fallback, immagini/valori
  invariati, larghezze secondo il font reale, assenza di glifi mancanti,
  gradienti isolati per carta e integrità di basi/originali.
- Suite logica completa: 2434 test passati durante lo sviluppo; i test
  mirati, preflight e build passano sulla versione preparata.
- Il collaudo StackBlitz di questo inserimento è ancora da registrare.
  Le prove precedenti del colpo non attestano il nuovo cambio lingua.

## Riproduzione

1. `node scripts/build-core-card-text-bases.cjs` (Sharp tramite NODE_PATH).
2. `node scripts/restore-weapon-fronts.mjs` verifica o ripristina le basi.
3. `node --test src/cardTextLayers.test.js`.
4. `node scripts/export-card-text-review.mjs OUTPUT` produce le prove EN/IT.
5. Avvio normale: inglese; collaudo in `/.maglio-review.html`, Card language.
