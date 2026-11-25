# Sei armi Metallo approvate — inserimento del 25 novembre 2026

L’utente ha confermato Frantumatore a Induzione Leggendario, Perforatore a
Cascata Epico/Leggendario e Artiglieria delle Schegge Erranti Rara/Epica/
Leggendaria. I fronti riprodotti nel gioco sono identici ai PNG approvati.
Le regole e i valori del combattimento non vengono modificati.

- Frantumatore Leggendario: conserva le tre piastre e aggiunge protezioni e
  ponte prismatici snodati; carica, scia, impatto e risonanze dedicati. I bonus
  con Energia, il blocco e la rimozione della Difesa seguono gli eventi reali.
- Perforatore: tre anelli di carica e penetratore volumetrico. Ogni trasferimento
  effettivamente pagato parte dallo scafo precedente dopo il suo impatto;
  consumo di Energia, scia residua e impulso sonoro/aptico sono sincronizzati.
  Nessuna eccedenza o nessuna Energia producono soltanto l’attacco iniziale.
- Schegge Erranti Metallo: selettore a cinque cassette, un solo carrello che
  si orienta prima del lancio, una sola scheggia per turno proprio. Il secondo turno usa
  il destinatario risolto dal motore. Bronzo, rinforzi d’argento e ponte
  prismatico evolvono l’intera sequenza senza aggiungere colpi HP.

La camera del tavolo proietta volumi con fronte e retro distinti; il naso
arriva al centro misurato del vero scafo. I trasferimenti laterali usano la
stessa camera. Durata della risoluzione, suoni e reazioni degli scafi leggono
le medesime fasi. Le richieste aptiche rispettano la preferenza del giocatore;
il riscontro fisico su telefono compatibile resta da verificare.

Validazione locale: 159 test mirati passati, build e preflight passati.
Collaudo StackBlitz completato: 14 osservazioni sulle sei varianti, nelle due
direzioni A/B, slot 1/2, e sette verifiche condizionali. Registrazione reale
con audio; montaggio a velocità nativa di 78,61 secondi, H.264 900×1600 e
AAC 48 kHz, con didascalie esterne alla plancia.

Condizioni osservate: zero Energia; due Energie senza eccedenza; un solo
trasferimento pagato; arma bloccata senza sparo o consumo; Induzione a
zero Energia fermata dalla Difesa, a una Energia con varco e a due Energie
con solo smontaggio quando il fuoco è bloccato. L’opzione aptica disattivata
ha restituito `muted`; ripristinata attiva dopo la prova.

[Video delle sei carte](https://chatgpt.com/library?file_id=libfile_c756b13068f4819184480118b400bf86&account_id=personal) · [Registrazione integrale](https://chatgpt.com/library?file_id=libfile_f1ec47198ebc81918842e0b376a7e928&account_id=personal) ·
[Resoconto del collaudo](riferimenti-carte/metallo-lotto-3-2026-11-25/collaudo-stackblitz.json).

Le sorgenti PNG sono divise in dodici parti binarie e ricomposte automaticamente
prima di dev/build/preflight, con hash del file originale e di ciascuna parte.
Il salvataggio diretto di questi grandi PNG eccedeva il limite di richiesta
del collegamento GitHub; il caricamento web ha restituito errore del server.
La ricomposizione conserva tutti i byte, senza ridurre qualità o risoluzione.

Riferimenti: [manifest](riferimenti-carte/metallo-lotto-3-2026-11-25/manifest.json),
[meccaniche e storyboard](riferimenti-carte/metallo-lotto-3-2026-11-25/storyboard.md),
[fonti binarie](../asset-sources/weapon-fronts/metallo-3/manifest.json).
