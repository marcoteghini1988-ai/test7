# Prossima coppia Fulmine: Ionic Assault Probe / Thunder Hammer

Stato, 27/11/2026: **direzione B approvata con «ok per B»; sette fronti completi e animazione di studio preparati per revisione**.
Non sono nuove famiglie inventate: corrispondono ai due ID reali seguenti.
Non aggiungere fronti o effetti al registro approvato prima della verifica
e della conferma visiva previste dalla procedura.

| Nome inglese della carta | Nome attuale nel catalogo | Famiglia |
| --- | --- | --- |
| Ionic Assault Probe | Sonda Ionica d'Assalto | `weapon-designed-ionic-sonda-ionica` |
| Thunder Hammer | Martello del Tuono | `weapon-designed-ionic-martello-tuono` |

## Ruolo e valori nominali correnti

| Carta | Comune | Rara | Epica | Leggendaria |
| --- | --- | --- | --- | --- |
| Sonda: un colpo | 8 HP | 21 HP | 51 HP | 72 HP |
| Martello: colpo base | — | 28 HP | 66 HP | 94 HP |
| Martello: secondo impatto condizionale | — | 18 HP | 43 HP | 61 HP |

Fonte dei nominali: `WEAPON_NEAR_FINAL_VALUES`. Entrambe durano un turno
proprio e funzionano singolarmente; nessun costo Energia dedicato nel
profilo attuale. L'elemento è Fulmine. Non convertire il Martello in un
utensile a mano: rimane un dispositivo offensivo navale plausibile.

La Sonda applica un segnale soltanto se infligge danno reale. Il segnale
è conservato nel lato del giocatore con ID del bersaglio e `expiresPly =
ply + 3`: permette la coppia nello stesso turno (Sonda risolta prima) o
nel turno proprio successivo. Il Martello consuma il segnale e pianifica
un impatto aggiuntivo sul bersaglio segnato ancora valido. Un supporto
già distrutto non riceve un secondo colpo né trasferisce quel bonus alla
madre. Difese e copertura si applicano attraverso il motore ordinario.

Il renderer deve usare gli impatti effettivamente emessi: nessun secondo
BOOM se il motore non ha prodotto il secondo impatto. Verificare separatamente
segnale assente/scaduto, Sonda bloccata, bersaglio morto, protezione fra i
due impatti, sola madre e componenti madre diversi dall'Arsenale. Il precedente lookup trovava soltanto l’Arsenale della madre. La correzione
conserva il tipo reale del bersaglio nel segnale e usa la selezione validata.
Un bersaglio segnato già distrutto lascia il colpo base al Martello sul
prossimo bersaglio vivo, senza bonus. Entrambi i regressi sono stati
riprodotti prima della correzione e verificati dopo.

## Confronto grafico e scelta confermata

1. Sonda compatta con marchio luminoso; Martello come cuneo di fulmine
   pesante, con secondo impatto esplosivo quando si attiva la combo.
2. Sonda che imprime un reticolo elettrico; Martello come lama di fulmine
   rotante, con secondo fendente quando si attiva la combo.

L’utente ha chiesto di vedere entrambe le proposte, poi ha approvato B.
La proposta B comprende il secondo fendente con BOOM locale, contraccolpo
dello scafo e collasso del reticolo, soltanto quando il secondo impatto
è realmente presente e infligge danno. I colpi iniziali entrano dai bordi
del proprio lato. Materiali,
incrementi fisici per rarità, arte macchina+colpo, testi inglesi separati
e conferma visiva rimangono obbligatori. Suono e aptica vanno progettati
dopo aver verificato eventi reali, segnale e due impatti distinti.

## Sette nuovi fronti preparati

Le illustrazioni mantengono la stessa scena e il medesimo apparecchio
attraverso le rarità. Sonda: struttura grafite, collare e tiranti bronzo,
sensori argento, arco e stabilizzatori prismatici. Martello: tre vani
curvi bronzo, giogo/rotore argento, creste e cuscinetto prismatici.
Macchina e colpo sono insieme nella carta; nella sequenza compare il
solo colpo dal bordo, senza macchina sul campo.

Le cornici originali e gli adesivi Arma/Fulmine sono quelli già verificati
per il Nucleo; il pannello è rosso. Il canvas dei sette fronti è RGBA
3072×4608. Il report registra anche le dimensioni native delle singole
illustrazioni generate, senza dichiararle tutte native a 3072 pixel.
Basi PNG prive di scritte, SVG EN/IT, dizionari e metriche del font sono
separati. Il cambio lingua della galleria mantiene la stessa base.

## Verifiche della preparazione

- Sette fronti: pixel opachi protetti della cornice invariati, alfa
  esterna identica e nessun nuovo pixel oltre il bordo originale.
- Quattordici confronti EN/IT: nessuna modifica fuori dalle quattro aree
  testo; tutte le righe rientrano secondo le metriche del font originale.
- 35 test mirati del motore passati, inclusi 13 nuovi casi di regressione.
- Suite completa: 2447 test passati dopo il ripristino iniziale dei sei
  PNG già approvati conservati negli archivi. Preflight e build passati.
- Sei test dell’anteprima: eventi reali, ventidue situazioni, nessun BOOM
  inventato, nessun lancio se disabilitato, testo e sintesi senza clipping.
- Audio stereo e piano aptico condividono gli istanti dei contatti.
  Volume, silenzioso, movimento ridotto, visibilità e arresto sono gestiti.

Sorgenti riproducibili in `scripts/previews/sonda-martello-20261127/`.
Report in `docs/collaudi/sonda-martello-2026-11-27/`.
La pagina isolata è stata collaudata nella copia StackBlitz esistente sul
commit `db6327b81a369a6f8a743d87c6d71938398f4769`: sei casi osservati,
combo A/B, turno successivo, Difesa e arma disabilitata; sette carte con
17 campi testo EN/IT, cambio lingua durante la riproduzione e nessun
errore della pagina in console. Avvio salvato, ricaricamento e pin
confermati, con 725 sorgenti verificati. Controlli GitHub e Chrome mobile
passati. Report: `collaudi/sonda-martello-2026-11-27/verifica-stackblitz.json`.
Questo collaudo non equivale all’integrazione nella partita. I 40 fronti
già approvati restano gli unici promossi; questi sette nuovi fronti
aspettano conferma visiva. La vibrazione fisica resta da verificare.


## Approvazione e inserimento — 27 novembre 2026

Dopo la consegna delle due tavole dei sette fronti, del video con audio
e della prova dello studio su StackBlitz, l'utente ha risposto «si» alla
conferma dell'inserimento. Sette fronti e direzione B sono approvati.
La precedente attesa di conferma descrive il passaggio storico ed è superata.

- Registro attivo: **47 varianti, 22 Metallo e 25 Fulmine**.
- Sette fronti PNG HD e sette basi senza testo: stessi byte del pacchetto
  approvato `libfile_3b7aecb835808191a5a67f33f557e2ab`. Nessuna rigenerazione.
- Archivio versionato con ricomposizione e SHA-256 delle parti e dei file;
  anche il WebContainer della copia esistente ricompone i PNG HD locali.
- Dizionari inglese/italiano e metriche condivisi con lo studio. La carta
  completa inglese rimane recuperabile, la partita sovrappone il solo testo.
- Renderer volumetrico condiviso: un impulso della Sonda, reticolo soltanto
  su danno effettivo e bersaglio vivo; un fendente del Martello, oppure
  due se realmente emessi. Il secondo impatto riuscito concentra il BOOM.
- Il segnale segue la nave anche fra i turni; consumo, bersaglio distrutto
  e scadenza interrompono il reticolo. La Difesa reagisce senza fingere
  danno allo scafo. Nessun colpo aggiunto se il primo fendente è letale.
- Ingressi variabili dai bordi corretti e scala prospettica A/B. Il contatto
  e il contraccolpo condividono la posizione del vero scafo.
- Audio PCM e pattern aptici derivano dalla stessa partitura dello studio;
  richieste rispettano visibilità e preferenze. Il movimento ridotto
  conserva un contatto breve e fermo. La prova fisica della vibrazione
  resta distinta dal collaudo software.

`/.maglio-review.html` usa `OfficialFleetBattle3D` e il motore reali e
permette combo nello stesso turno/successivo, ordine inverso, segnale
scaduto, doppia Difesa, bersaglio distrutto, primo colpo letale e segnale
sul Generatore. Lo studio HTML/video precedente rimane un archivio della
proposta; non sostituisce il nuovo collaudo della partita.
