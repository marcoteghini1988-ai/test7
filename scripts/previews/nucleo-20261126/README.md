# Anteprima Nucleo di Folgore Crescente

Strumenti isolati per la conferma visiva, non importati dalla partita.
I valori e le sequenze vengono dal motore corrente; non cambiano il
bilanciamento e non aggiungono la famiglia al registro dei 37 fronti attivi.

Preparare nella cartella di uscita `art-inputs.json` con le chiavi `rara`,
`epica`, `leggendaria` e i percorsi delle tre illustrazioni create per la
direzione approvata. L'archivio della consegna contiene immagini originali e
percorsi relativi. Leggere la scheda in `docs/` per recuperarne gli esatti byte.

1. `node scripts/previews/nucleo-20261126/prepare-cards.mjs OUTPUT`
2. Generare le maschere dalle basi originali con
   `python scripts/previews/20261126/make-masks.py ROOT OUTPUT`.
3. `node scripts/compose-weapon-fronts.cjs OUTPUT/manifest-carte.json OUTPUT/carte-hd`
4. `python scripts/previews/nucleo-20261126/verify-frames.py ROOT OUTPUT`
5. `node --test scripts/previews/nucleo-20261126/sequence.test.mjs`
6. `node scripts/previews/nucleo-20261126/export.mjs OUTPUT --stills`
7. Dopo il controllo, ripetere l'export senza `--stills` per il video.
   `--audio-only` conserva il video muto già calcolato e aggiorna HTML/audio.

Servono Sharp, @napi-rs/canvas, esbuild, Three, FFmpeg e DejaVu Sans.
Usare i moduli già installati tramite `NODE_PATH` o le variabili
`ECLISSI_CANVAS_MODULE` / `ECLISSI_SHARP_MODULE` per i percorsi espliciti;
non cambiare le dipendenze dell'app per produrre un'anteprima.

La pagina HTML incorpora immagini e codice, senza CDN né chiamate esterne.
Rispetta la preferenza di movimento ridotto senza cambiare i tempi dei suoni.
La vibrazione è facoltativa e dipende dal dispositivo. I test verificano
il piano e il motore, non certificano la risposta aptica hardware.
