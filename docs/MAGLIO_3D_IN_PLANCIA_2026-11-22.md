# Maglio Ferrogravitazionale: modello articolato

22 novembre 2026 · repository ufficiale `marcoteghini1988-ai/test7`.

Il precedente movimento traslava un intero sprite. La nuova presentazione
carica un GLB per ciascuna delle quattro rarità e anima parti meccaniche
distinte. I fronti delle carte, le cornici, i simboli, le regole, i danni e
la disposizione della plancia conservano i dati approvati.

## Parti e puntamento

| Parte GLB | Comportamento |
|---|---|
| `BaseFixed` | Basamento fermo, esterno alla gerarchia animata |
| `TurretYaw` | Ralla e sostegni ruotano verso il bersaglio |
| `ArmPitch` | Corpo dell'arma inclina sul proprio perno |
| `PistonRecoil` | Pistone e testa rinculano lungo il braccio |
| `Muzzle` | Punto 3D da cui viene proiettata l'origine dell'impulso |

Il giocatore guarda il retro dell'arma, l'avversario il fronte. Sono
orientamenti dello stesso oggetto nello spazio, senza specchi orizzontali.
La mira usa il bersaglio realmente risolto dal combattimento e misurato
sulla plancia. Il basamento non compie l'affondo di 14 px precedente.

Puntamento 180–690 ms, rinculo 810–1.160 ms, rientro entro 1.840 ms.
La sequenza conserva durata 2.200 ms e intervallo 260 ms fra due Magli.
Un evento bloccato non produce puntamento, carica o rinculo. Con movimento
ridotto il puntamento è immediato e non viene animato il rinculo.

## Asset e risoluzione

`scripts/build-maglio-3d.py` genera i quattro file in
`public/assets/fleet-weapons/maglio/models/` con Blender 4.3.2. Il manifest
registra file, dimensioni e nomi degli snodi. La geometria conserva base
corazzata bassa, sostegni triangolari, giunti laterali, corpo corto, cavi
e testa delle carte. Rara: gruppo posteriore e condensatore laterale;
Epica: tre condotti e rinforzi; Leggendaria: testa anulare a sei segmenti.

`MaglioArticulatedModel.jsx` carica i GLB con Three.js 0.187.0 e usa un
canvas con risoluzione interna almeno doppia rispetto all'ingombro
visualizzato, fino a 3×. Include antialias, materiali metallici con dettaglio
procedurale, luce ambiente, luci direzionali e ombra di contatto.

Il browser di collaudo ha WebGL disattivato. `maglioSoftwareRenderer.js`
rasterizza in CPU la stessa geometria, le stesse matrici e gli stessi
snodi. Questo percorso non usa uno sprite e conserva l'articolazione;
la sua illuminazione approssimata non dimostra la resa del percorso GPU.
Gli otto WebP precedenti restano esclusivamente come caricamento o ripiego
in caso di errore. La loro provenienza è conservata in
`collaudi/maglio/rarita/provenienza-asset.json`.

## Verifiche locali

**1.992/1.992 test**, build di produzione e preflight superati.
Il gruppo mirato contiene **97 test**:

```
node --test src/maglioArticulatedModel.test.js src/maglioBattleVisuals.test.js src/maglioRaritiesSupport.test.js src/fleetNextOfficialMaglioArt.test.js src/fleetNextProgressionUi.test.js
```

La copertura verifica la gerarchia GLB, il basamento invariato, la direzione
fisica della testa sui bersagli a sinistra/destra, entrambe le parti,
quattro rarità, rinculo e ritorno, arma bloccata, movimento ridotto,
rasterizzazione CPU, veri attacchi contro madri/supporti, scadenza e scarti.

## Collaudo visivo e procedura

Prima salvare il codice su GitHub, poi aprire StackBlitz e provarlo.
Non modificare il codice durante l'osservazione della sessione.

```
npm install
node scripts/review-maglio.mjs
npm run dev
```

Aprire `/.maglio-review.html`. Il generatore monta la plancia ufficiale e
il vero motore, senza inventario, premi o salvataggi. Permette rarità,
alloggiamenti, supporti, arma bloccata e supporti con 1 HP. Il primo piano
e il confronto usano gli stessi GLB e lo stesso renderer della partita.

## Verifica visiva riuscita su StackBlitz

Collaudato il codice già salvato nel commit
`161b50f89ed7a6ba12359820bf4214162c532c42` (runtime introdotto da `09650ba`).
La sessione aveva conservato quindici file locali precedenti: sono stati
prima esportati in un backup e poi riallineati a GitHub. Durante la prova
non sono stati modificati i sorgenti. `git status --short` finale mostra
soltanto i sei backup locali non tracciati. Anche su StackBlitz passano
**97/97 test**, zero errori, in 7.159,35 ms.

La plancia è quella ufficiale e le azioni usano il vero motore, inclusa la
risposta IA. Non vengono letti né scritti inventario, premi o salvataggi.

| Prova | Colpo del giocatore | Risposta IA | HP madri |
|---|---|---|---|
| Comune, slot 1 | Prisma avversario 66 → 53 | Prisma giocatore 66 → 53 | invariati |
| Rara, slot 2 | Corvo avversario 96 → 62 | Prisma giocatore 96 → 62 | invariati |
| Epica, slot 1 | Prisma avversario 125 → 44 | Prisma giocatore 125 → 44 | invariati |
| Leggendaria, slot 2, supporti con 1 HP | Corvo avversario 1 → 0 | Corvo giocatore 1 → 0 | invariati |
| Comune contro madri | Lince Solare 339 → 321 | Aurora-0 435 → 418 | danni effettivi 18 e 17 |
| Leggendaria del giocatore bloccata | nessun impulso e zero danni | Prisma giocatore 174 → 59 | invariati |

Nelle quattro prove sui supporti si osservano per entrambi i lati:
base a posizione `0,0,0`, quaternion `0,0,0,1`, ingombro fermo,
rotazione della ralla verso il bersaglio, inclinazione del corpo,
rinculo del solo pistone e ritorno alla posa di riposo. Sono verificati
entrambi gli alloggiamenti e le direzioni verso sinistra/destra. La
Leggendaria distrugge davvero i supporti con 1 HP; l'arma bloccata resta
ferma mentre la risposta dell'avversario avviene normalmente. Il Maglio
scaduto del giocatore lascia il campo e passa negli scarti.

Il picco di rinculo dell'IA nella sola prova contro la madre non è
campionato a causa di una pausa di cattura di 3,653 secondi. Il suo
puntamento e il danno sono osservati; il rinculo IA è campionato nelle
quattro prove sui supporti. Il rapporto conserva questa limitazione.

### Limiti grafici osservati

Il browser usa il renderer **CPU**, con WebGL disattivato. Si verifica
la geometria 3D articolata effettiva, non il WebP di ripiego. Il primo piano
CPU può rallentare. La fluidità e la resa del percorso WebGL non sono state
osservate in questa sessione. I materiali risultano più dettagliati del
primo prototipo, ma restano provvisori rispetto alla qualità della carta
originale: il collaudo funzionale non equivale all'approvazione artistica.

### Prove attuali

- [Plancia: attacco del giocatore](collaudi/maglio/snodi/stackblitz/plancia-giocatore.png)
- [Plancia: risposta dell'avversario](collaudi/maglio/snodi/stackblitz/plancia-avversario.png)
- [Registrazione delle quattro rarità in partita](collaudi/maglio/snodi/stackblitz/quattro-rarita-in-partita.mp4)
- [Primo piano attuale della Comune](collaudi/maglio/snodi/stackblitz/primo-piano-comune.jpg)
- [Confronto Comune](collaudi/maglio/snodi/stackblitz/confronto-comune.jpg)
- [Confronto Rara](collaudi/maglio/snodi/stackblitz/confronto-rara.jpg)
- [Confronto Epica](collaudi/maglio/snodi/stackblitz/confronto-epica.jpg)
- [Confronto Leggendaria](collaudi/maglio/snodi/stackblitz/confronto-leggendaria.jpg)
- [97 test su StackBlitz](collaudi/maglio/snodi/stackblitz/stackblitz-test.jpg)
- [Stato dei sorgenti durante la prova](collaudi/maglio/snodi/stackblitz/stato-sorgenti.jpg)
- [Misure, danni e limiti di cattura](collaudi/maglio/snodi/stackblitz/verifica.json)

Immagini e video provengono dalla sessione StackBlitz. Le plance ritagliano
soltanto i bordi del browser, senza ridimensionare il gioco. I video
mantengono la cadenza delle catture native; non vengono interpolati
fotogrammi. I file in questa
sottocartella documentano il modello articolato attuale. Le precedenti
registrazioni negli altri percorsi di `collaudi/maglio/` appartengono alla
vecchia versione raster o ai tentativi di apertura precedenti.
