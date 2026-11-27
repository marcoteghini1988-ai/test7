> Aggiornamento: due fronti e direzione confermati con «confermo» il
> 27/11/2026 e inserimento autorizzato. Registro attuale: 52 varianti. I
> moduli condivisi sono collegati alla partita; gli stessi quattro PNG
> sono conservati nell'archivio di ripristino. Le attese di approvazione
> nelle note di preparazione sotto sono storiche. Il video dello studio
> rimane distinto dal successivo collaudo della partita.

# Stellar Storm Capacitor Cannon — anteprime del 27 novembre 2026

Direzione della nube approvata con «procediamo». Epica e Leggendaria sono
fronti nuovi da mostrare e approvare prima dell'inserimento. Il registro
giocabile rimane di 50 varianti; nessun fronte precedente è sostituito.

Le illustrazioni originali sono in
`asset-sources/weapon-previews/condensatore-tempesta-2026-11-27/art`.
La Leggendaria conserva i componenti dell'Epica e aggiunge tre stabilizzatori
fisici in cristallo. Generazione incorporata: prompt e riferimento sono in
`prompts.json`. Cornici e simboli restano quelli originali del progetto.

Produzione ripetibile dalla radice Test7:

```bash
node scripts/previews/condensatore-tempesta-20261127/prepare-cards.mjs OUTPUT
python3 scripts/previews/20261126/make-masks.py . OUTPUT
NODE_PATH="$CODEX_PRIMARY_RUNTIME_NODE_MODULES" node scripts/previews/condensatore-tempesta-20261127/compose-cards.mjs OUTPUT
python3 scripts/previews/nucleo-20261126/verify-frames.py . OUTPUT
node --test src/stormCapacitorPreview.test.js
NODE_PATH="$CODEX_PRIMARY_RUNTIME_NODE_MODULES" node scripts/previews/condensatore-tempesta-20261127/export.mjs OUTPUT
```

Aspettare la conclusione della composizione prima della verifica e
dell'esportazione. PNG completi 3072×4608; illustrazioni native 1448×1086.
I dizionari EN/IT e i livelli SVG sono separati dalle basi. Il segno «più»
è un glifo vettoriale nel livello testo, senza modificare il font ufficiale.

La pagina interattiva include 12 situazioni e tre turni reali per caso;
il video usa cinque sequenze, 32,9 secondi a velocità nativa, con PCM/AAC
stereo sincronizzato. È uno studio con eventi del motore, non una cattura
di StackBlitz. Non dichiarare eseguito il collaudo in partita o la verifica
fisica della vibrazione. Il renderer non è ancora collegato all'app.

Il solo aggiornamento nel motore aggiunge metadati: Carta Energia davvero
spesa e ID dei supporti vivi. Non cambia HP, costi, colpi o durate. Le vecchie
cariche non bastano; una carica nuova non alimenta due Armi; saltare un turno
permette di riprendere nei turni rimasti. Un tentativo con Arma disabilitata
spende ancora la carica secondo il motore corrente, ma non disegna una nube.

I numeri stampati provengono da `WEAPON_NEAR_FINAL_VALUES`: Epica 31 +14
per supporto, Leggendaria 43 +19. Il vecchio profilo eseguibile conserva
18 +8 / 23 +10, a cui il combattimento applica il fattore strategico e
gli altri modificatori. Il manifest conserva entrambe le sorgenti. Prima
della promozione verificare i nominali stampati contro il percorso numerico
completo ed eliminare eventuali differenze di arrotondamento senza applicare
il fattore due volte o modificare globalmente le altre 235 Armi.
