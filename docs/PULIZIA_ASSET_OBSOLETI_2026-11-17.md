# Pulizia grafica delle carte ritirate — 17 novembre 2026

Il catalogo giocabile non comprende più le 350 carte dismesse. Nel repository `test7` sono stati eliminati fisicamente **362 SVG dei vecchi fronti**, **248 SVG di vecchi gradi** e **54 WebP di illustrazioni non utilizzate**: **664 asset** in totale. La differenza rispetto ai 628 file delle sole carte ritirate è dovuta a 36 vecchi SVG di Personaggi oggi resi nativamente e quindi non più richiamabili.

Restano soltanto **17 fronti SVG effettivamente richiamati da `cardFacePath`** e **10 fronti SVG di potenziamento realmente richiamati**, oltre alle **12 carte Boss** e ai Terreni della campagna. Le 120 nuove esclusive continuano a usare i fronti nativi provvisori in attesa delle illustrazioni finali.

I **45 WebP in `public/assets/fleet-approved-fronts` e il relativo manifest** sono conservati come riferimento grafico approvato, anche se le carte storiche raffigurate non sono più giocabili. Restano inoltre i ritratti originali Boss e le immagini delle navicelle. Il vecchio generatore `scripts/generate-fleet-card-art.mjs` e la sua automazione sono rimossi per evitare la rigenerazione degli asset obsoleti.

Il controllo `scripts/check-fleet-card-assets.mjs` ora verifica l'assenza di SVG extra, non solo la presenza di quelli attivi. Nessuna modifica al motore delle 120 esclusive, alla plancia metallica 3D o al PvP simulato.
