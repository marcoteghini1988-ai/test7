# AGENT INSTRUCTIONS — ECLISSI STELLARE / test7

## Regola dei colpi approvata il 24 novembre 2026

**Proiettili approvati, revisione del 24/11:** il Maglio usa le quattro
sagome illustrate in `docs/riferimenti-carte/maglio-ferrogravitazionale-2026-11-24/proiettili-approvati.png`.
L'atlante PNG RGBA giocabile è in `public/assets/fleet-weapons/maglio/projectiles/`.
Conservare piastre, giroscopi, alette e prismi; mostrare questi dettagli durante
il volo. La calibrazione approvata richiede leggibilità: il Maglio viaggia per
1.400 ms e l'impatto rimane visibile 950 ms. Audio, reazione della nave e
rilascio del turno usano gli stessi tempi. Il numero di colpi deriva dal motore.

Leggere `docs/REGOLA_EFFETTI_VISIVI_CARTE_2026-11-24.md` quando si crea o
inserisce un'Arma o il suo effetto. Il colpo parte dal centro del bordo basso
per il giocatore e dal centro del bordo alto per l'avversario. Forma, colore
e rifiniture seguono l'arma e la rarità; numero di colpi, bersagli e danno
seguono esclusivamente gli eventi del motore. Il Maglio ha un colpo per
ciascuna rarità e un impatto visivo progressivamente più ricco.
Quando una carta è approvata, nello stesso inserimento implementare il colpo
univoco e il suono per ogni sua rarità, pubblicare codice e PNG su `test7/main`
e controllare visivamente e acusticamente la partita su StackBlitz. Non
attribuire automaticamente a tutte le Armi uno sparo in base al solo elemento.
Le altre Armi conservano un effetto provvisorio finché progettate una per una.

## Correzione del 24 novembre 2026 — cornici di rarità e simboli

Le quattro cornici HD Comune, Rara, Epica e Leggendaria in `docs/riferimenti-carte/basi-rarita-ufficiali-2026-11-24/` rappresentano **rarità, non categoria Arma**. Consultare [docs/BASI_UFFICIALI_RARITA_2026-11-24.md](docs/BASI_UFFICIALI_RARITA_2026-11-24.md). Sono PNG trasparenti 3072×4608, senza testi, icone o illustrazioni. L'arancione interno è il colore dell'esempio Arma: per Difesa o altra categoria adattare il colore interno; conservare geometria degli slot e finitura esterna della rarità. La Leggendaria approvata è in cristallo prismatico. Le vecchie anteprime Arma WebP del 23/11 sono ritirate. Non ridurre o ricostruire queste basi.

**Nuova regola 24/11 — scheda completa:** il pannello sotto le scritte delle caratteristiche/effetto prende il colore della categoria (Arma arancione, Attacco rosso, Difesa azzurro, Personaggio magenta, Terreno verde, Trappola viola); cornice esterna e stile delle scritte seguono la rarità. Alla richiesta «crea una carta», scegliere la cornice HD originale, cercare nel catalogo ID, valori, categoria, elemento e rarità, usare i simboli indicizzati, comporre illustrazione e testi nei rispettivi spazi, verificare il contrasto e mostrare l'anteprima completa prima di inserirla nel gioco. Le prove di adesivi esistono ma devono ancora essere approvate visivamente. Per il dettaglio e l'esempio di allineamento ENERGY / ATTACK consultare la procedura.

Il simbolo della **categoria variabile** va nello slot tondo sinistro; l'eventuale elemento nello slot tondo destro. L'utente ha autorizzato prove di nuovi simboli fedeli ai soggetti della tavola del 21/11 ma adattati ai fori circolari, senza il vecchio contenitore a rombo/esagono. Le prove non sono asset approvati: mostrarle e ottenere approvazione prima di inserirle nel gioco. La tavola del 21/11 rimane fonte visiva dei soggetti fino all'approvazione dei nuovi simboli.

Le **16 prove PNG separate** sono indicizzate in [docs/SIMBOLI_ADESIVI_2026-11-24.md](docs/SIMBOLI_ADESIVI_2026-11-24.md) e in `docs/riferimenti-carte/adesivi-slot-2026-11-24/manifest.json`: sei categorie a sinistra e dieci elementi a destra, con ID reali del motore, soggetto e coordinate dei cerchi su ciascuna rarità. La posizione è confermata; l'aspetto dei singoli adesivi è ancora da revisionare. Quando si prepara una nuova carta usare l'indice per recuperare il candidato corretto e mostrarlo prima dell'inserimento.

## Aggiornamento approvato il 23 novembre 2026 — cornici di rarità

Leggere [docs/CRITERI_GRAFICI_RARITA_PER_CATEGORIA_2026-11-23.md](docs/CRITERI_GRAFICI_RARITA_PER_CATEGORIA_2026-11-23.md) per la palette del 23/11: **Comune grafite, Rara sabbia bronzata, Epica argento, Leggendaria oro**. Le quattro basi vuote Attacco del 23/11 sono approvate. Le quattro cornici HD più recenti del 24/11 sono riferimenti di rarità trasversali alle categorie, inclusa la Leggendaria prismatica; gli accenti interni e i simboli cambiano con categoria ed elemento. Le varianti delle altre categorie vanno verificate visivamente prima di diventare fronti giocabili.

## IMPORTANTISSIMO — ogni richiesta «crea una carta»

La PRIMA OPERAZIONE, anche in nuove chat o sessioni, è leggere il file
[docs/PROCEDURA_OBBLIGATORIA_CREAZIONE_CARTE.md](docs/PROCEDURA_OBBLIGATORIA_CREAZIONE_CARTE.md).
**Non saltare i passaggi perché l'utente ha scritto solo "crea la carta".**

Ordine FISSO: **catalogo + valori giocati → base PNG ufficiale → tavola
PNG dei simboli ufficiali → composizione sul modello ORIGINALE → controllo
visuale → anteprima in chat → approvazione prima dell'inserimento.**

Sorgenti obbligatorie, originali da riutilizzare MATERIALMENTE:
- `docs/riferimenti-carte/basi-rarita-ufficiali-2026-11-24/` (quattro cornici HD)
- `docs/riferimenti-carte/BASE_UFFICIALE_CARTE_2026-11-21.png`
- `docs/riferimenti-carte/SIMBOLI_CATEGORIE_ELEMENTI_2026-11-21.png`
- `docs/CARTE_RIFERIMENTI_GRAFICI_UFFICIALI_2026-11-21.md`
- `src/fleetNext/rules.js`, `src/fleetNext/weaponRarityEvolutions.js`
- `docs/VALORI_QUASI_DEFINITIVI_235_ARMI_2026-11-22.md` per le Armi

Fino all'approvazione dei nuovi simboli, usare i soggetti della tavola
ufficiale: ARMA è la torretta/cannone futuristico arancione, non cannone
storico su ruote o mirino. Le prove autorizzate possono eliminare i vecchi
contorni a rombo/esagono e adattare scala e composizione ai fori circolari,
conservando il soggetto riconoscibile. Nessun logo del gioco sulle carte.
Grafica della cornice esterna immutabile.
Le rarità cambiano la finitura esterna, non la categoria.

**Ogni evoluzione della stessa carta deve avere un dettaglio VISIVO
AGGIUNTIVO E DIVERSO nell'illustrazione centrale**, progressivo fra Comune,
Rara, Epica e Leggendaria. Non basta cambiare i danni, la cornice o il suo
colore: si deve vedere la progressione fisica del soggetto pur conservandone
identità, scena, simboli ufficiali e geometria della base. I dettagli artistici
NON aggiungono nuove abilità o modifiche al combattimento. Prima di mostrare
le varianti, verificare questa differenza a colpo d'occhio.
Riferimento operativo: `docs/PROCEDURA_OBBLIGATORIA_CREAZIONE_CARTE.md`.

**CARTE ARMA — REGOLA DI REALIZZABILITÀ 3D OBBLIGATORIA:** prima
di generare qualsiasi Arma, pensarla come un dispositivo offensivo
futuristico realmente modellabile e montabile su una navicella. La scena
deve mostrarne scocca, volumi 3D, innesti, struttura meccanica, emettitori,
nuclei e parti funzionali leggibili. **Non disegnare utensili fantasy o
martelli tradizionali**. Anche se la carta si chiama «Maglio
Ferrogravitazionale», raffigurare un apparato gravitazionale pesante
tecnologico con aggancio navale, non un martello da impugnare. Ogni
evoluzione mantiene l'identità dell'apparato ma ne evolve componenti
fisici riproducibili in 3D. Se non è plausibile modellarlo e animarlo
come arma della flotta, l'illustrazione va rifatta. Non alterare regole,
danni, simboli, cornice e base di carta. La procedura completa è in
`docs/PROCEDURA_OBBLIGATORIA_CREAZIONE_CARTE.md`.

Se una sorgente PNG non può essere letta come immagine, non dichiarare
conforme una generazione che ne imita la forma: dirlo e risolvere la lettura
della sorgente prima di proseguire.

**Le anteprime di immagini non si inseriscono negli asset giocabili finché
non sono approvate dall'utente.**

## Lavoro sul repository

Repository unico: `marcoteghini1988-ai/test7`, ramo `main`.
Non creare cloni, progetti paralleli o versioni di prova.
Non cambiare meccaniche, valori, layout della plancia 3D o vecchie
immagini approvate mentre si crea un'anteprima carta.

**Questa è una regola operativa persistente del progetto.** Le prove di simboli restano separate dalle carte giocabili fino alla loro approvazione.
