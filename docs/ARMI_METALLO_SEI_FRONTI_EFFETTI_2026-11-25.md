# Sei carte Metallo: fronti ed effetti integrati

Le quattro rarità del Cannone a Slitta d'Acciaio e le due dell'Artiglieria
Termobalistica di Recupero mostrate in chat sono state approvate e inserite
in `test7/main`. I PNG giocabili sono 3072×4608 RGBA. La ricodifica PNG
riduce il peso senza cambiare i pixel approvati, confrontati integralmente.
Nessuna modifica a danni, durate, costi o regole del combattimento.

| Carta | Sequenza di carica, volo e impatto |
| --- | --- |
| Slitta Comune | Dardo in acciaio con ogiva e fondello diversi, tracciante caldo, frattura metallica |
| Slitta Rara | Conserva il dardo, aggiunge stabilizzatori in bronzo, doppia elica e collare d'impatto |
| Slitta Epica | Conserva i componenti, aggiunge guide in argento, collari di compressione e onde ritardate |
| Slitta Leggendaria | Conserva i componenti, aggiunge coste, scia e fratture prismatiche |
| Recuperatore Epico | Tre flussi convergenti, capsula corta con dissipatori e nucleo ambra, tre lobi termici all'impatto |
| Recuperatore Leggendario | Conserva i collettori, aggiunge gabbia del condensatore, rifrazioni e frammenti prismatici |

Ogni riga ha tre suoni propri: carica, lancio e impatto. I suoni usano il
bus SFX esistente, con le impostazioni di volume e silenziamento del gioco.
Le scie restano collegate allo stesso volume proiettato dalla camera fissa
del tavolo. Il giocatore vede il retro del colpo uscente, l'avversario il
fronte del colpo entrante; il naso arriva al bersaglio misurato nel DOM.

La Slitta ha un colpo alla risoluzione; il Recuperatore uno in ciascuno dei
due turni propri. Non si aggiungono altri impatti HP per la rarità. La
luminosità del Recuperatore legge l'extra nominale dello specifico evento
nel profilo RAW del motore, prima dei modificatori strategici e delle
Difese; un danno mitigato non spegne erroneamente l'energia raccolta.
Il renderer non modifica lo stato della partita.

## Collaudo

- Sei PNG caricati a 3072×4608 nella mano e nello slot occupato: 12 controlli
  con bordo 0, fondo trasparente e nessuna ombra rettangolare.
- Tiri reali del giocatore e della vera IA per tutte e sei le carte, verso
  madre e supporti; verificato anche il secondo alloggiamento.
- Recuperatore provato nel secondo turno con HP effettivamente persi nei
  turni precedenti: la carica e il danno dell'evento aumentano.
- 119 controlli mirati e 2.049 test della suite completa superati, insieme
  a build, preflight e collaudo mobile automatico. Il vecchio test
  del catalogo è stato aggiornato: il Recuperatore ha ora un fronte, mentre
  le altre Armi progettate restano senza illustrazione approvata.
- Prova video con audio della scheda, H.264/AAC 900×1600 a 30 fps, circa 90
  secondi. Rimossi soltanto i tempi di attesa tra prove, senza accelerazioni.

Metadati, hash dei fronti, video e osservazioni del collaudo sono in
`riferimenti-carte/metallo-lotto-1-2026-11-25/manifest.json` e
`collaudo-stackblitz.json`. Il codice di battaglia collaudato è
`3aff7e5c7a2c5158ef71fb11a1356f92e35dd1c9`; i sei PNG sono già presenti in
`880b71ff83deb061747c1b2a60e7a3793c0477ac`.

## Prossime famiglie

La richiesta del 25/11 è salvata in `AGENTS.md` e nella procedura delle
carte: variare sagome e sistemi di aggancio, evitando che tutte le macchine
diventino cannoni o basi a quattro piedi. Leggere l'intera meccanica e
personalizzare anche le sequenze per rarità, comprese le raffiche quando
previste dalla carta. Queste indicazioni non richiedono di rifare le sei
illustrazioni già approvate.
