# Armi Metallo — terzo gruppo, sei anteprime complete

25 novembre 2026. Stato: **in attesa dell’approvazione grafica**. Le regole
sono già nel catalogo; i nuovi fronti e i nuovi effetti non sono ancora
installati in partita. Il codice di gioco resta invariato.

| Carta | Rarità | Danno nominale | Turni propri | Anteprima |
| --- | --- | --- | --- | --- |
| Frantumatore a Induzione | Leggendaria | 54 HP | 1 | [PNG HD](https://chatgpt.com/library?file_id=libfile_94f2b222e28c8191ad92d59471d03a6f&account_id=personal) |
| Perforatore a Cascata | Epica | 65 HP | 3 | [PNG HD](https://chatgpt.com/library?file_id=libfile_3f5c737a3cc081919843bc7e8d6926d0&account_id=personal) |
| Perforatore a Cascata | Leggendaria | 91 HP | 3 | [PNG HD](https://chatgpt.com/library?file_id=libfile_6941d0c7ffac819186888c0480b76867&account_id=personal) |
| Artiglieria delle Schegge Erranti | Rara | 20 HP | 2 | [PNG HD](https://chatgpt.com/library?file_id=libfile_777624a601308191a5050c7b95f91077&account_id=personal) |
| Artiglieria delle Schegge Erranti | Epica | 48 HP | 2 | [PNG HD](https://chatgpt.com/library?file_id=libfile_8283557be2fc81918da72de1c4a7cd3c&account_id=personal) |
| Artiglieria delle Schegge Erranti | Leggendaria | 67 HP | 2 | [PNG HD](https://chatgpt.com/library?file_id=libfile_0aab4ecbd68c819188abeeaac7d1fec4&account_id=personal) |

Le nuove illustrazioni sono generate singolarmente; le evoluzioni conservano
la macchina precedente e aggiungono componenti fisici. La composizione usa
le cornici autentiche e gli adesivi esistenti. Tutti i fronti sono PNG RGBA
3072×4608, con esterno trasparente. La risoluzione nativa delle illustrazioni
centrali è 1448×1086; non viene dichiarata nativa 4K.

Le meccaniche sono state lette nei resolver, sulla base `b4596f6be804fe780b28c96098535e06c04f9a2b`:

- Frantumatore: un colpo; bonus con 1/2 carte Energia Metallo fisiche, senza
  consumo di Energia per tale bonus. Lo smontaggio della Difesa segue l’evento reale.
- Perforatore: un attacco iniziale per tre turni propri; soltanto l’eccedenza
  dopo la distruzione di un supporto può passare al prossimo bersaglio,
  pagando 1 Energia Metallo per trasferimento.
- Schegge Erranti Metallo: un colpo nel turno di posa e uno nel proprio turno
  successivo, cambiando bersaglio quando possibile. Nessun danno ad area.

Il [progetto degli effetti](riferimenti-carte/metallo-lotto-3-2026-11-25/storyboard.md)
definisce movimento, prospettiva A/B, suono e aptica per ciascuna famiglia
e rarità. La loro implementazione e il collaudo sulla plancia StackBlitz
seguono l’approvazione delle nuove carte.

Verifica completata: hash delle tre cornici originali corretti, zero pixel
aggiunti fuori dal profilo, zero pixel opachi protetti alterati e zero glifi
mancanti. Controllati visivamente i fronti completi e i confronti. Nessuna
modifica agli asset giocabili e nessun test in battaglia rivendicato per
queste nuove anteprime.

Confronti: [Frantumatore e Perforatore](https://chatgpt.com/library?file_id=libfile_dd827249237c81918df90e34607a89a9&account_id=personal), [Schegge Erranti](https://chatgpt.com/library?file_id=libfile_dda61d82c5208191a327d53f1981409b&account_id=personal).

[Pacchetto completo con sei PNG HD e sorgenti riproducibili](https://chatgpt.com/library?file_id=libfile_7e230d9bd938819183c4a1d359d42ca9&account_id=personal).

[Manifest e riferimenti dei file](riferimenti-carte/metallo-lotto-3-2026-11-25/manifest.json) · [Verifica](riferimenti-carte/metallo-lotto-3-2026-11-25/verifica.json) · [Prompt](riferimenti-carte/metallo-lotto-3-2026-11-25/prompts.json).
