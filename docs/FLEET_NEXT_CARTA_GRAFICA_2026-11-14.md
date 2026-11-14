# Eclissi Stellare — sistema definitivo FUNZIONE × RARITÀ

## Regola
**Il colore indica sempre la funzione; la luminosità e il trattamento del metallo indicano la rarità.** Le Leggendarie NON diventano dorate: Difesa Leggendaria = azzurro cromato molto luminoso.

## Colori delle funzioni
- ATTACCO: rosso #ff594c
- DIFESA: azzurro #37ceff
- PERSONAGGIO: magenta #eb64e1
- TERRENO: verde #2be3a2
- SUPPORTO: arancione #ffb24d
- CONTROLLO: indaco #9e8fff

## Rarità
- COMUNE: quasi opaca, riflessi minimi
- RARA: luminosa, finitura appena lucida
- EPICA: bagliore marcato, riflesso fluorescente
- LEGGENDARIA: cromatura speculare quasi bianca, superfici metallizzate e bagliore massimo nel colore della funzione

## Geometria e uso
379 fronti SVG 512×768, formato verticale 2:3. Mano 54×81; slot 40×60; Shop e mazzi rispettano 2:3. Non esistono carte quadrate nel catalogo. Le tavole illustrative prodotte in chat non sono asset di gioco.

Il generatore ufficiale è `scripts/generate-fleet-card-art.mjs`. I 379 fronti sono vettoriali procedurali, **non** artwork pittorici HD definitivi. Non cambiano costi, personaggi, turni o meccaniche. Gli asset legacy rimangono.

## Prime 10 illustrazioni Terreno differenziate
Ogni terreno (`gen-219`, `gen-220`, `gen-221`, `gen-229`, `gen-230`, `gen-231`, `gen-237`, `gen-238`, `gen-239`, `gen-245`) dispone ora di una scena vettoriale specifica per nome e ambiente, non più le stesse montagne generiche. Le scene sono codificate in `terrainScene` nel generatore; la rigenerazione è riproducibile. Restano illustrazioni SVG vettoriali e non sostituiscono artwork illustrati AI ad alta definizione.

## Terreno nel campo 3D
Oltre ai 10 fronti di carta, sono generati 10 ambienti verticali SVG `public/assets/fleet-terrain-scenes/T01.svg`–`T10.svg`. Il renderer li sovrappone con opacità leggera e `pointer-events:none` all'arena Titanio esistente, **senza sostituire plancia, navicelle, vitali o slot**. L'effetto è visivo; non modifica la logica dei Terreni.

## Illustrazioni pittoriche HD inserite nei 10 Terreni (14/11/2026)
I 10 ritagli WEBP in `public/assets/fleet-card-illustrations/` provengono dalle illustrazioni generate e sono stati ripuliti dalle intestazioni, cornici e descrizioni di esempio (alcune sbagliate). I fronti ufficiali rimangono tutti SVG verticali **512×768, identici a tutte le altre carte**. Ogni SVG Terreno contiene la propria illustrazione HD incorporata come WEBP inline, così funziona anche in `<img>` e non richiede CSS speciale. I nomi, gli effetti e la rarità sono scritti dal generatore usando i cataloghi JSON: nessuna regola derivata dai concept viene usata nel gioco. `node scripts/generate-fleet-card-art.mjs` rigenera i fronti dal materiale presente nel repository.

## Nuova serie Attacco (14 novembre)
119 fronti Attacco (70 generali e 49 esclusive) hanno ora scene SVG a composizione differenziata, generate da soggetti e nomi reali: precisione, calore/corrosione, plasma, rimbalzo, spirale, siluro, assedio, quarzo, fasatura, mira assoluta, lancia e cometa. Tutti rettangolari **512×768** con colore di funzione rosso e rarità rappresentata solo da riflessi e cromatura. La serie di sei concept pittorici separati resta in formato WebP fuori da `test7`: non indicarla come integrata. Questa modifica non sostituisce l'illustrazione vettoriale con un dipinto AI HD, ma evita il riuso della stessa scena generica su tutti i fronti.
