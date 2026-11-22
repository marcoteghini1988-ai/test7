# Maglio Ferrogravitazionale Comune — arma sulla plancia

22 novembre 2026, repository ufficiale `marcoteghini1988-ai/test7`.

Il Maglio Comune ora compare nei due alloggiamenti Arma reali della plancia,
con due viste dedicate e una sequenza di schieramento, carica, rinculo,
impulso gravitazionale e impatto. Vale per il giocatore e per la vera IA.
Il fronte approvato della carta non è stato ridisegnato.

## Asset

| Vista | File | Uso |
|---|---|---|
| Giocatore, retro e parte superiore | `public/assets/fleet-weapons/maglio/player.webp` | Emettitore diretto verso l'avversario |
| Avversario, fronte e parte superiore | `public/assets/fleet-weapons/maglio/enemy.webp` | Emettitore diretto verso il giocatore |

Render raster 3D con alpha reale, WebP 768×768 qualità 92, circa 207 KiB
complessivi. Non sono mesh ruotabili. La vista avversaria è un render distinto,
non la rotazione di una figura capovolta. Precaricamento delle due immagini
per evitare la comparsa tardiva al primo sparo. Nessun rettangolo di sfondo.

Fonte visiva materiale: il fronte ufficiale Comune
`public/assets/fleet-weapon-fronts/weapon-confirmed-metallic-maglio.webp`,
blob approvato `c090a26ae0bdf0bb49413b7b5ef0b05094fb5ce9`.
Il dispositivo conserva testa sdoppiata, pistone, condotti, sostegni e innesto.
Questa prima integrazione riguarda **solo il modello Comune**; non riutilizza
questo modello per rappresentare falsamente le evoluzioni Rara/Epica/Leggendaria.

## Collegamento al motore

`src/maglioBattleVisuals.js` filtra gli eventi autentici `weapon-base-shot`
del solo ID `weapon-confirmed-metallic-maglio`. Slot, parte colpita, danno
effettivo, proprietario e blocco provengono dall'evento del motore.
`src/MaglioBattleEffects.jsx` misura origine e destinazione sui pezzi reali
del DOM, nel sistema 450×800 della plancia. Può colpire madre, supporto,
modulo o macchina secondo il bersaglio effettivamente risolto.

La carta selezionata mostra una sagoma attenuata; solo uno sparo realmente
riuscito produce carica, rinculo e impulso. Un'arma bloccata compare senza
simulare un colpo riuscito. La durata visiva è 2.200 ms, con 260 ms di
separazione fra due Magli nello stesso turno; il turno successivo riparte
con i propri 30 secondi dopo gli effetti. Le Trappole conservano l'attesa
più lunga. Sono previste animazioni ridotte per `prefers-reduced-motion`.

Durante la risoluzione si conserva uno snapshot visivo del dispositivo
realmente schierato. Alla fine decide lo stato del motore: nessuna arma
permanente fittizia, nessun nuovo colpo, nessun danno calcolato dal renderer.
Danni, costi, durata, IA, inventario e geometria della plancia non cambiano.

## Collaudo riproducibile e risultati

Eseguire `node scripts/review-maglio.mjs`, avviare Vite e aprire
`/.maglio-review.html`. I due file generati sono temporanei e ignorati da Git.
Si monta **lo stesso `OfficialFleetBattle3D` della partita**, usando una
fixture di `createFleetNextBattle`, `resolvePreparedFleetTurn` e
`autoFleetTurn`. L'app distribuita mantiene il suo unico ingresso normale.
La fixture non legge né assegna inventario o ricompense; non modifica i
salvataggi del giocatore. Il Maglio base spara autonomamente secondo il
catalogo; la pila Energia vuota isola la prova dal colpo del Generatore IA.

Prova eseguita nella sessione StackBlitz ufficiale di test7, con sorgenti
runtime identici al candidato `0889f198f9a92ba6635357aafcebd36ffce21345`.
Prima della sincronizzazione sono state conservate le modifiche locali in
un backup, senza eliminare i precedenti backup o salvare tali file nel repo.

| Controllo | Esito osservato |
|---|---|
| Maglio giocatore | 18 HP effettivi, Lince Solare 339 → 321 |
| Maglio vera IA | 17 HP effettivi dopo difese, Aurora-0 435 → 418 |
| Primo e secondo alloggiamento, entrambi i lati | Arma e impulso nello slot corretto |
| Immagini durante la registrazione | Nessuna immagine mancante; due viste precaricate |
| Arma bloccata | Zero cariche, zero proiettili, Lince Solare ferma a 339 HP |
| Scadenza | Arma del giocatore rimossa, carta reale negli scarti, zero effetti residui |
| Copertura del supporto | Test del motore: destinazione e danno del supporto intercettore |
| Due Magli insieme | Due eventi distinti, separazione visiva e attesa di 2.460 ms |

Verifica completa del codice: **1.913 test superati**. Build di produzione e
preflight superati. Dopo le rifiniture finali, su StackBlitz sono passati
**18/18 test**, eseguiti con:

```
node --test src/maglioBattleVisuals.test.js src/fleetNextOfficialMaglioArt.test.js src/fleetNextProgressionUi.test.js
```

Registrazione e immagini autentiche della plancia in `docs/collaudi/maglio/`:
`maglio-in-partita.gif`, `attacco-giocatore.jpg`, `attacco-avversario.jpg`.
`verifica.json` riporta le misurazioni DOM osservate. La GIF riproduce gli
screenshot catturati, non immagini generate della partita.

## Generazione dei due asset

Strumento: imagegen integrato, modalità generazione con riferimento visivo,
`transparent_background: true`. Prima vista riferita al fronte ufficiale;
seconda vista riferita sia al fronte sia al primo render. I PNG generati
1254×1254 sono stati convertiti in WebP per il gioco, senza cambiare il disegno.

Prompt vista giocatore:

> Create the official in-game 3D rendered weapon sprite for the MAGLIO FERROGRAVITAZIONALE COMMON model illustrated inside the provided approved card. Use the CENTRAL DEVICE as the exact design reference, NOT the card frame. This is the same heavy spaceship-mounted gravitational mass driver: brushed steel rectangular split impact head surrounding a circular recessed emitter, short thick cylindrical piston barrel, small amber power conduits, flexible black cables, angular twin supporting struts, compact armored rotating attachment pedestal. Preserve the recognizable mechanical construction and COMMON level simplicity; do not invent extra barrels, wings or fantasy hammers. Render a premium realistic PBR game asset, physically coherent modeled parts, readable silver steel edges and dark gunmetal recesses. IN-GAME CAMERA: fixed orthographic camera elevated about 55 degrees above a horizontal tabletop, viewing the BACK and TOP of the weapon, the firing axis points exactly AWAY from the viewer towards the TOP CENTER of the canvas (north, not sideways). It must sit flat on the same tabletop as spaceship game pieces, NOT stand like a vertical trading card. The rear body is lower on the canvas, front emitter further up, central axis straight vertical in screen space, pedestal visible, full silhouette with comfortable 8 percent transparent margin. Only subtle amber status lights, emitter mostly dormant; NO firing beams, NO large glow, NO flames, NO particles. Neutral overhead studio lighting with bright beveled metal details suitable at small 110px game size. ISOLATED ONE COMPLETE DEVICE ON TRUE TRANSPARENT BACKGROUND. No card, no text, no numbers, no icons, no environment, no floor, no large shadow plane. Square high resolution composition.

Prompt vista avversario:

> Create the REVERSE CAMERA VIEW of the EXACT SAME common spaceship-mounted gravitational cannon as image 1, with image 2 only reinforcing approved design. This is for the opponent side of a tabletop game. Keep same dimensions, steel plates, split rectangular front impact head around recessed circular emitter, piston barrel, black cables, support struts and round mechanical mounting base. Camera is elevated 55 degrees ABOVE the horizontal tabletop looking at the FRONT and TOP of the same device. The firing axis points directly TOWARD the viewer and the BOTTOM CENTER of the canvas (south), NOT sideways. The rear body and circular pedestal are in the upper part of the image, the muzzle/front square split metal head is in the lower part closer to camera. This is a physical 180 degree turn of the weapon on the tabletop while retaining the SAME overhead camera and gravity, NOT rotating or flipping an existing flat picture upside down. Have clear readable front recess, dark center and restrained amber ring in the emitter, no projectile or firing light. Same premium photorealistic PBR game asset quality with crisp silver beveled metal and charcoal mechanical cavities, physically plausible volume and foreshortening. Single complete device centered, generous transparent margin, isolated TRUE TRANSPARENT background, no floor, no card frame, no text, no icons, no environment, no particles, no big bloom. Square high resolution composition.
