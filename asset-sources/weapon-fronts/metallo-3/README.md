# Sei fronti Arma Metallo approvati

Le parti binarie contengono, senza conversione, i sei PNG RGBA 3072×4608
confermati dall’utente il 25 novembre 2026. La suddivisione permette il
trasferimento attraverso il limite per singola richiesta del collegamento
GitHub; non cambia immagini, compressione o trasparenza.

`node scripts/restore-weapon-fronts.mjs` verifica le parti e ricompone i file
originali in `public/assets/fleet-weapon-fronts/`. Il manifest contiene
per ciascuna carta dimensione e SHA-256 del PNG completo e di ogni parte.
`npm run dev`, `npm run build` e `npm run preflight` eseguono automaticamente
questa verifica. I sei file riprodotti sono ignorati da Git; gli altri fronti
approvati già versionati restano invariati.

Il pacchetto originale delle sei carte complete resta collegato nel manifest
`docs/riferimenti-carte/metallo-lotto-3-2026-11-25/manifest.json`.
