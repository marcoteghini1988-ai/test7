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

Stato al salvataggio: il prototipo degli snodi è stato visualizzato su
StackBlitz e 96 test del gruppo precedente sono passati nella sessione.
Il successivo aggiornamento dei materiali non è stato ancora collaudato:
la sessione ha bloccato i nuovi processi Node e al riavvio ha mostrato
`Could not clone repository`. Il collaudo dell'ultima versione deve essere
eseguito dopo questo salvataggio. Le immagini e registrazioni già presenti
in `collaudi/maglio/` documentano la precedente versione raster finché non
vengono sostituite da nuove prove; non provano questa nuova presentazione.
