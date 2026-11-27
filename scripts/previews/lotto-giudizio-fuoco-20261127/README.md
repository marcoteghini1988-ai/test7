> Sei fronti e inserimento su test7/main confermati con «procedi».
> Registro aggiornato a 58 varianti. I moduli sono ora condivisi dalla
> partita; gli originali PNG sono archiviati senza alterarne i byte.
> Le attese nelle note storiche non richiedono una nuova approvazione.
> Lo studio resta distinto dal collaudo reale della partita.

# Lotto di sei Carte Arma, 27 novembre 2026

Tre direzioni approvate: Giudizio Temporale, Mortaio Magmatico e
Inceneritore a Plasma Rotante. Sei fronti da revisionare insieme,
non ancora promossi nella partita. Registro approvato: 52 varianti.

Procedura, valori, cadenze reali, comandi ripetibili, verifiche e ripresa:
[`docs/LOTTO_6_ARMI_GIUDIZIO_FUOCO_2026-11-27.md`](../../../docs/LOTTO_6_ARMI_GIUDIZIO_FUOCO_2026-11-27.md).

`catalog.mjs` raccoglie solo le sei varianti effettive. `card-text.mjs`
mantiene EN/IT separati dalla base. `compose-cards.mjs` usa gli originali
delle cornici e i simboli; `verify-frames.py` verifica pixel e alfa.
`sequence.mjs` raccoglie gli eventi del resolver, senza cambiare gameplay.
`batch-spec.mjs`, i renderer e i moduli audio alimentano lo stesso HTML
e video dello studio. `batch.test.mjs` verifica i casi sensibili.

Le illustrazioni sono già conservate: non richiamare la generazione per
ricomporre il lotto o per la successiva approvazione. Lo studio non è
una registrazione della partita e non certifica aptica hardware.
