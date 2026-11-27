> **Approvazione successiva:** l'utente ha confermato i sette fronti e
> l'inserimento il 27/11/2026 con «si». Il renderer, il testo e l'audio
> condivisi sono ora in `src/probeHammer*`; le carte sono nel registro
> delle 47 varianti. L'HTML/video già consegnato conserva lo studio
> storico precedente all'inserimento. Per la partita usare
> `/.maglio-review.html` e leggere il documento Sonda/Martello.

# Sonda / Martello: anteprima B, 27 novembre 2026

La risposta «ok per B» approva la direzione visiva: reticolo elettrico,
lama rotante e secondo fendente con BOOM locale, contraccolpo e consumo
del segnale. Non approva automaticamente i sette nuovi fronti completi.
Questa cartella non è importata dalla partita e non modifica il registro
delle 40 varianti grafiche già approvate.

## Sorgenti e composizione

Le sette illustrazioni PNG sono in
`asset-sources/weapon-previews/sonda-martello-2026-11-27/art`.
Le quattro cornici sono i PNG originali della rarità, con pannello Arma
rosso. I soggetti Arma/Fulmine sono quelli già usati nel Nucleo approvato.
Ogni evoluzione conserva i componenti precedenti e aggiunge un modulo:
Sonda, collare bronzo → sensori argento → arco e stabilizzatori prismatici;
Martello, tre vani bronzo → giogo/rotore argento → creste cristalline.

I testi inglesi/italiani sono dizionari esterni; `card-text.mjs` usa le
metriche del font originale per adattare 17 campi alle aree del modello.
La composizione produce una base senza scritte, due SVG testo separati
e due esportazioni PNG di lettura. Il PNG completo non è il sorgente unico.

1. `node scripts/previews/sonda-martello-20261127/prepare-cards.mjs OUTPUT`
2. `python scripts/previews/20261126/make-masks.py ROOT OUTPUT`
3. `node scripts/previews/sonda-martello-20261127/compose-cards.mjs OUTPUT`
4. `python scripts/previews/nucleo-20261126/verify-frames.py ROOT OUTPUT`
5. `node --test src/probeHammerMechanics.test.js scripts/previews/sonda-martello-20261127/review.test.mjs`
6. `node scripts/previews/sonda-martello-20261127/export.mjs OUTPUT --stills`
7. Senza `--stills` esporta il video con audio; `--audio-only` aggiorna la
   traccia lasciando il video già calcolato, `--html-only` la sola pagina.

Sharp, Napi Canvas, esbuild e FFmpeg provengono dalle dipendenze già
disponibili nel runtime di produzione degli artefatti; non sono nuove
dipendenze del gioco. Impostare NODE_PATH al percorso del runtime.

## Motore, suono e aptica

`sequence.mjs` usa `resolvePreparedFleetTurn` e i profili reali nelle due
famiglie. I nominali stampati provengono da WEAPON_NEAR_FINAL_VALUES.
`timeline.mjs` crea un proiettile per impatto emesso, non colpi decorativi.
Il secondo fendente è presente solo se il motore lo emette; il BOOM
richiede anche danno effettivo positivo e nessun blocco della Difesa.
La Sonda bloccata non crea il reticolo. Segnale scaduto, bersaglio già
morto e bersaglio ucciso dal primo fendente sono casi distinti.

`visuals.mjs` proietta un volume con facce e spessore per la lama, con
punta agganciata alla traiettoria. Non ruota una singola immagine piatta.
Reazione dello scafo e contatto condividono la posizione a ogni frame.
`audio.mjs` e la richiesta aptica usano gli stessi istanti. La risposta
fisica del dispositivo resta da verificare; il codice rispetta mute,
volume, movimento ridotto, visibilità e arresto/ripetizione.

La pagina HTML e il video sono studi con eventi del motore, non una
registrazione della partita ufficiale. La galleria cambia il solo SVG
EN/IT sopra le stesse sette basi. Video e miniature nella sequenza sono
esportazioni inglesi. La pagina è disponibile separatamente in
StackBlitz come `/.probe-hammer-review.html`, senza promuovere i fronti.

## Correzioni necessarie alla combo

Il vecchio lookup cercava solo supporti e Arsenale della madre; un segnale
sul Generatore poteva sopprimere completamente il tiro. Ora il segnale
conserva il tipo reale del bersaglio e usa la selezione validata. Le
istanze precedenti senza tipo rimangono compatibili. Un bersaglio segnato
non più valido lascia al Martello il proprio tiro normale su un bersaglio
vivo, senza bonus. Costi, nominali, durata e regole delle altre Armi restano
quelli del motore. I due regressi sono stati riprodotti prima della fix.
