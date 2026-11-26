# Anteprime carte ed effetti — 26 novembre 2026

**Stato: prodotte, consegnate per conferma visiva, non inserite nel gioco.**

Richiesta dell'utente: concludere le carte confermate; conservare i disegni già disponibili e preparare gli effetti pattuiti; realizzare anche il disegno quando manca; mostrare carte ed effetti prima dell'inserimento. Il nuovo comando autorizza la produzione e supera la precedente pausa per sola documentazione.

Il gruppo identificato comprende **12 famiglie, 37 varianti**: 22 Metallo e 15 Fulmine. Sono preparate 20 illustrazioni nuove o rifinite (15 Fulmine e 5 Ganasce A/B). Gli altri disegni centrali Metallo sono conservati; i pannelli riflettono le nuove coreografie. Nessuna nuova immagine è stata copiata in `public/assets/fleet-weapon-fronts`, nessun effetto candidato è importato da `src`.

I fronti sono PNG RGBA **3072×4608**, composti nelle cornici originali e con i simboli ufficiali già usati. Le illustrazioni centrali generate hanno risoluzione nativa 1448×1086 o 1536×1024; non sono illustrazioni native 3072×4608. Il bordo esterno trasparente coincide con quello della base. Nei campi non ancora definiti è scritto `TBD`, senza inventare valori.

## Confronto visivo e video

| Materiale | Contenuto | Collegamento |
|---|---|---|
| Carte Fulmine | 15 varianti, ruolo di ogni famiglia | [Tavola completa](https://chatgpt.com/library?file_id=libfile_943647d5d7888191817e0b98d6c85be9&account_id=personal) |
| Carte Metallo | 22 varianti, comprese Ganasce A/B | [Tavola completa](https://chatgpt.com/library?file_id=libfile_5aff73e2441c8191b9c5ef31c584e027&account_id=personal) |
| Effetti Fulmine | 15 sequenze, circa 41 secondi | [Video con audio](https://chatgpt.com/library?file_id=libfile_4165a634b978819180dc60f9430b4d04&account_id=personal) |
| Effetti Metallo | 26 sequenze, circa 96 secondi | [Video con audio](https://chatgpt.com/library?file_id=libfile_505a96f98e548191b84c281cd06dce96&account_id=personal) |
| Effetti Ganasce | 7 storyboard, 60 secondi | [Video con audio](https://chatgpt.com/library?file_id=libfile_1a80295df05c8191a05d18783e27dcb7&account_id=personal) |

I tre video sono **previsualizzazioni offline a 30 fps**, 900×1600, H.264/AAC stereo 48 kHz, velocità originale. Non sono riprese di una partita né collaudi StackBlitz. Le coreografie Metallo e Fulmine sono guidate dagli eventi del motore con adattamenti isolati; le Ganasce nuove sono storyboard espliciti, senza applicare danni ipotetici. I pattern aptici sono definiti e l'icona segnala il momento del feedback: **la vibrazione fisica non è verificata**.

## Contenuto per famiglia

| Famiglia / ID di origine | Rarità nello studio | Effetto candidato |
|---|---|---|
| Maglio — `weapon-confirmed-metallic-maglio` | C/R/E/L | 2/3/5/7 martelli volumetrici rotanti, in sequenza. Un'azione, un bersaglio, totale HP ripartito. |
| Slitta — `weapon-confirmed-metallic-slitta` | C/R/E/L | Una palla in ogni rarità, finiture fisiche diverse; impatto di massa con scaglie e scintille. |
| Termobalistica — `weapon-designed-metallic-recuperatore-termobalistico` | E/L | 3 granate di base, 6 con bonus da HP realmente persi, in entrambe le rarità. Le quattro prove distinguono base e potenziamento. |
| Ganascia A — `weapon-designed-metallic-ganasce-magnetiche` | R/E/L, da confermare nella revisione | Una pinza a due dita; aggancio, tensione, strappo al T3 proprio. |
| Ganascia B — `weapon-designed-metallic-collassatore-lega` | E/L, da confermare nella revisione | Un artiglio a tre denti; funziona da solo. Con A: collisione fra due navi valide oppure schianto della sola madre sul piano. Un solo BOOM. |
| Induzione — `weapon-designed-metallic-frantumatore-induzione` | E/L | Lame rotanti e tagli. Conteggi 3/6 ripresi dal codice per lo studio, non nuovo vincolo deliberato. Mostra blocco, bypass e rimozione. |
| Cascata — `weapon-designed-metallic-perforatore-cascata` | E/L | Dal relitto nasce un nuovo residuo; trasferisce solo eccedenza valida dopo la distruzione di un supporto, pagando 1 Energia per passaggio. Conteggi E1/L3 per tratta conservati come candidato tecnico. |
| Schegge Erranti — `weapon-designed-metallic-artiglieria-schegge` | R/E/L | 3/6/9 schegge convergenti; mostra anche il secondo turno con diverso bersaglio vivo. |
| Pettine — `weapon-base-ionic-01` | C/R/E/L | Cinque archetti confluiscono in una sola scarica; griglia elettrica sottile al contatto. |
| Tesla — `weapon-base-ionic-02` | C/R/E/L | Un dardo blu-violetto con due spirali proiettate in 3D e un solo impatto. |
| Sferzatore — `weapon-base-ionic-03` | C/R/E/L | Una frustata elettrica a zig-zag; un solo contatto sulla corazza. |
| Lampo Bianco — `weapon-base-ionic-04` | R/E/L | Una scarica bianca rettilinea rapida. Non è inventata una Comune. |

Tutti i lanci iniziali provengono da punti variabili del bordo inferiore del giocatore o superiore dell'avversario, fuori campo. Non compaiono macchine complete sul tavolo. I modelli dei proiettili conservano volume, fronte e retro; la progressione sulla plancia rende leggibile anche l'arrivo dall'alto. Le reazioni sono locali allo scafo; catene e contatti seguono la sua posa. I contatori delle cariche distinguono conteggio e consumo reale.

## Parametri da chiudere prima dell'integrazione

- **Ganasce:** nomi e rarità definitivi, danno dello strappo T3 di A, durata di B, finestra/danno della combo e sorte dei ganci dopo l'urto. Le prove con una sola madre non simulano un secondo aggancio fallito quando due navi sono ancora presenti. I vecchi asset e le vecchie identità non sono cancellati.
- **Induzione senza Difese:** valore e limite del bonus danno con Energia. La prova dedicata mostra il danno base e dichiara il bonus ancora da fissare; non somma automaticamente bonus, bypass e rimozione.
- **Supporti reali:** nessun nuovo ribilanciamento di HP, fusione o abilità passive è introdotto da questi studi.

È emersa una discrepanza concreta: il vecchio `blockHit` decrementava e scartava la protezione anche se superata dal Frantumatore con una sola Energia. Il caricatore di revisione applica una correzione limitata a questa Arma: **bypass conserva la Difesa e la sua carica; rimozione la manda agli scarti**. Con zero Energia la Difesa della fixture blocca e si consuma secondo la propria regola. La correzione è candidata e non modifica il combattimento attivo.

## File PNG completi

| Pacchetto | Varianti | Collegamento |
|---|---:|---|
| Metallo: Maglio, Slitta, Termobalistica | 10 | [PNG HD e manifest](https://chatgpt.com/library?file_id=libfile_c0ba38cbe01881918842898ff7bfe7c4&account_id=personal) |
| Metallo: Induzione, Cascata, Schegge | 7 | [PNG HD e manifest](https://chatgpt.com/library?file_id=libfile_a983b4f6c0348191a0be4a169ea3f9c3&account_id=personal) |
| Ganasce A/B | 5 | [PNG HD e manifest](https://chatgpt.com/library?file_id=libfile_14a32dc0db288191867903fadf9d4bbd&account_id=personal) |
| Fulmine: Pettine e Tesla | 8 | [PNG HD e manifest](https://chatgpt.com/library?file_id=libfile_342f20b7b584819193eb79bedfd68f19&account_id=personal) |
| Fulmine: Sferzatore e Lampo | 7 | [PNG HD e manifest](https://chatgpt.com/library?file_id=libfile_99e56eeda42c8191957a04736d528625&account_id=personal) |

I pacchetti includono le illustrazioni nuove necessarie alla ricomposizione, i fronti e i manifest con SHA-256. Le 17 illustrazioni Metallo preesistenti restano ricavabili dagli asset originali del repository. Non ripetere la generazione di questi disegni.

## Verifiche e riproduzione

Base letta: `4d4e10f16a2dbd2dd7cb2a22997f420fdb3bd64c`. Sorgenti e asset del gioco attivo invariati. Sette test nuovi confrontano **42 fixture** del motore fra stato originale e candidato: nessuna moltiplicazione di HP, split esatto dei danni, 3/6 termobalistiche determinato dal bonus, Energie conteggiate conservate, cascate solo pagate, bypass corretto e origini sul bordo. `npm run preflight` passa, incluso il controllo dei riferimenti del renderer. Tutti i 37 PNG sono RGBA 3072×4608 e conservano l'alpha dei margini esterni originali. Tutti i video hanno 30 fps, durata coerente, audio presente e picco sotto 0 dBFS.

Codice: `scripts/previews/20261126/`. `candidate-loader.mjs` si attiva solo con un `--import` Node esplicito e controlla i frammenti sorgente prima di adattarli; non riscrive `src`. I test si eseguono con:

```sh
node --test scripts/previews/20261126/review-mechanics.test.mjs
npm run preflight
```

Preparare una cartella di output con `art-inputs.json` che associa le chiavi delle illustrazioni ai PNG dei pacchetti; eseguire `prepare-cards.mjs`, `make-masks.py` e il compositore da esso prodotto. `render-review.mjs` accetta `--group=fulmine`, `--group=metallo`, `--group=ganasce`, `--stills` e `--only=...`. Richiede Canvas NAPI e i modelli/versioni del repository. `export-review.mjs` richiede `web-audio-engine`, usa le partiture Metallo del gioco e le nuove partiture Fulmine proposte. `package-review.py` valida i fronti e prepara tavole e archivi; `--packages-only` riusa la verifica già eseguita sui medesimi byte.

## Fulmine non ancora chiuso

Restano da riconciliare con le nove proposte parlate: **Cannone a Nucleo di Folgore Crescente, Sonda Ionica d’Assalto, Martello del Tuono, Lancia del Comando Ionico, Cannone Condensatore della Tempesta Stellare, Cannone del Giudizio Temporale**. Sono inoltre presenti tre Acceleratori Trifase nella sezione di sequenza. Non sono stati confusi con le nove denominazioni e non appartengono al gruppo visivo consegnato qui. Non attribuire loro automaticamente «un turno, un bersaglio, nessun costo».

Dopo la conferma visiva, risolvere i parametri aperti e integrare **solo le varianti effettivamente approvate** nel solo `test7/main`; quindi fare il collaudo in partita con Difese, Energie, entrambi i lati, uno/due supporti e sola madre. Un video offline non soddisfa quel collaudo.
