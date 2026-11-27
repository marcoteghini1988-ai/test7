# Ionic Command Lance — produzione e prova, 27 novembre 2026

Direzione e tre fronti approvati con «ok» il 27/11/2026. La partita usa gli
stessi renderer e la stessa partitura; registro corrente di 50 varianti.
Questa cartella mantiene lo studio precedente, distinto dal collaudo nella
partita ufficiale e dalla vibrazione fisica su telefono.

Gli originali generati sono in `asset-sources/weapon-previews/lancia-comando-2026-11-27/art`.
Il font, le cornici PNG HD originali e i simboli Arma/Fulmine sono quelli
già presenti nel progetto. Non rigenerare cornici o testi con imagegen.

Eseguire dalla radice del solo repository Test7, passando una directory OUTPUT:

```bash
node scripts/previews/lancia-comando-20261127/prepare-cards.mjs OUTPUT
python3 scripts/previews/20261126/make-masks.py . OUTPUT
node scripts/previews/lancia-comando-20261127/compose-cards.mjs OUTPUT
python3 scripts/previews/nucleo-20261126/verify-frames.py . OUTPUT
node --test src/commandLancePreview.test.js
node scripts/previews/lancia-comando-20261127/export.mjs OUTPUT
node scripts/previews/lancia-comando-20261127/check-browser.mjs OUTPUT
```

Sharp, Napi Canvas, esbuild, Playwright e FFmpeg sono già nel runtime di
produzione. Usare `NODE_PATH=$CODEX_PRIMARY_RUNTIME_NODE_MODULES` per i
comandi di composizione/esportazione; non aggiungere dipendenze al gioco.
`--stills` nell'export prepara pagina, tavola e fotogrammi senza video.

I tre PNG inglesi in `carte-hd` sono le esportazioni da mostrare. Restano
anche `basi-senza-testo`, SVG testo EN/IT e dizionari in `src/fleetNext`.
La pagina ha cambio lingua, tredici situazioni, suono, preferenze aptiche,
movimento ridotto e cursore di riproduzione. Il video 720×1280 mostra sette
sequenze a velocità nativa con audio stereo. Entrambi sono studi e non
registrazioni della partita ufficiale o collaudi hardware del telefono.
