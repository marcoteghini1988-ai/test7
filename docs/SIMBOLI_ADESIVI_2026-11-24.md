# Eclissi Stellare — simboli adesivi per gli slot circolari

**16 proposte grafiche salvate il 24 novembre 2026: 6 categorie + 10 elementi.** La posizione degli slot è stata confermata dall'utente. I soggetti riprendono la [tavola visiva del 21 novembre](riferimenti-carte/SIMBOLI_CATEGORIE_ELEMENTI_2026-11-21.png), ma sono ricreati come PNG RGBA separati senza il vecchio contorno a rombo/esagono. Gli ambienti barrati della tavola non sono inclusi. Le immagini e gli accenti di colore attendono la revisione grafica finale; non sostituire ancora le carte giocabili.

La **cornice indica la rarità**. Il simbolo di categoria entra nel **cerchio sinistro**; il simbolo dell'elemento, se presente, nel **cerchio destro**. Per una Difesa universale il cerchio destro rimane vuoto. Il nome della categoria va nel nastro della carta, non è impresso sull'adesivo.

## Categorie — cerchio sinistro

| Categoria | Soggetto riconoscibile | Anteprima PNG |
| --- | --- | --- |
| Arma | Torretta a energia | [<img src="riferimenti-carte/adesivi-slot-2026-11-24/categorie/arma.png" width="88" alt="Torretta Arma">](riferimenti-carte/adesivi-slot-2026-11-24/categorie/arma.png) |
| Attacco | Tre razzi | [<img src="riferimenti-carte/adesivi-slot-2026-11-24/categorie/attacco.png" width="88" alt="Razzi Attacco">](riferimenti-carte/adesivi-slot-2026-11-24/categorie/attacco.png) |
| Difesa | Scudo energetico | [<img src="riferimenti-carte/adesivi-slot-2026-11-24/categorie/difesa.png" width="88" alt="Scudo Difesa">](riferimenti-carte/adesivi-slot-2026-11-24/categorie/difesa.png) |
| Personaggio | Pilota | [<img src="riferimenti-carte/adesivi-slot-2026-11-24/categorie/personaggio.png" width="88" alt="Pilota Personaggio">](riferimenti-carte/adesivi-slot-2026-11-24/categorie/personaggio.png) |
| Terreno | Paesaggio alieno | [<img src="riferimenti-carte/adesivi-slot-2026-11-24/categorie/terreno.png" width="88" alt="Paesaggio Terreno">](riferimenti-carte/adesivi-slot-2026-11-24/categorie/terreno.png) |
| Trappola | Mina energetica | [<img src="riferimenti-carte/adesivi-slot-2026-11-24/categorie/trappola.png" width="88" alt="Mina Trappola">](riferimenti-carte/adesivi-slot-2026-11-24/categorie/trappola.png) |

## Elementi — cerchio destro

L'ID nella terza colonna corrisponde esattamente alle chiavi di `FLEET_ELEMENTS` in `src/fleetNext/elementalAffinities.js`.

| Elemento | Soggetto | ID nel gioco | Anteprima PNG |
| --- | --- | --- | --- |
| Fuoco | Fiamma | `plasma` | [<img src="riferimenti-carte/adesivi-slot-2026-11-24/elementi/fuoco.png" width="88" alt="Fuoco">](riferimenti-carte/adesivi-slot-2026-11-24/elementi/fuoco.png) |
| Ghiaccio | Cristallo di neve | `cryogenic` | [<img src="riferimenti-carte/adesivi-slot-2026-11-24/elementi/ghiaccio.png" width="88" alt="Ghiaccio">](riferimenti-carte/adesivi-slot-2026-11-24/elementi/ghiaccio.png) |
| Acqua | Goccia | `refrigerant` | [<img src="riferimenti-carte/adesivi-slot-2026-11-24/elementi/acqua.png" width="88" alt="Acqua">](riferimenti-carte/adesivi-slot-2026-11-24/elementi/acqua.png) |
| Metallo | Tre lingotti | `metallic` | [<img src="riferimenti-carte/adesivi-slot-2026-11-24/elementi/metallo.png" width="88" alt="Metallo">](riferimenti-carte/adesivi-slot-2026-11-24/elementi/metallo.png) |
| Fulmine | Saetta | `ionic` | [<img src="riferimenti-carte/adesivi-slot-2026-11-24/elementi/fulmine.png" width="88" alt="Fulmine">](riferimenti-carte/adesivi-slot-2026-11-24/elementi/fulmine.png) |
| Terra | Cristalli minerali | `mineral` | [<img src="riferimenti-carte/adesivi-slot-2026-11-24/elementi/terra.png" width="88" alt="Terra">](riferimenti-carte/adesivi-slot-2026-11-24/elementi/terra.png) |
| Vento | Spirale d'aria | `aerial` | [<img src="riferimenti-carte/adesivi-slot-2026-11-24/elementi/vento.png" width="88" alt="Vento">](riferimenti-carte/adesivi-slot-2026-11-24/elementi/vento.png) |
| Luce | Stella radiante | `radiant` | [<img src="riferimenti-carte/adesivi-slot-2026-11-24/elementi/luce.png" width="88" alt="Luce">](riferimenti-carte/adesivi-slot-2026-11-24/elementi/luce.png) |
| Ombra | Vortice oscuro | `void` | [<img src="riferimenti-carte/adesivi-slot-2026-11-24/elementi/ombra.png" width="88" alt="Ombra">](riferimenti-carte/adesivi-slot-2026-11-24/elementi/ombra.png) |
| Gravità | Singolarità | `gravity` | [<img src="riferimenti-carte/adesivi-slot-2026-11-24/elementi/gravita.png" width="88" alt="Gravità">](riferimenti-carte/adesivi-slot-2026-11-24/elementi/gravita.png) |

## Ingombro e recupero

Ogni adesivo è un PNG trasparente quadrato **1254×1254**. Le [quattro cornici di rarità HD](BASI_UFFICIALI_RARITA_2026-11-24.md) misurano 3072×4608. Alla scala di prova, l'adesivo completo occupa un quadrato di **300×300 pixel** centrato nel foro; i pixel del soggetto visibile restano dentro il cerchio, senza invadere il bordo. Il [manifest JSON](riferimenti-carte/adesivi-slot-2026-11-24/manifest.json) elenca per ogni file l'ID, il soggetto, lo slot, l'eventuale ID usato dal motore, gli hash e i centri misurati per ciascuna rarità. Ridimensionare insieme alla carta mantenendo queste proporzioni.

Le prove sono disponibili per la revisione grafica nel repository. I PNG delle cornici e la tavola del 21 novembre rimangono separati e intatti; i nuovi adesivi non sono ancora collegati ai fronti giocabili.
