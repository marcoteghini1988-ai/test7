# ECLISSI STELLARE — STANDARD GRAFICO UFFICIALE DELLE CARTE

**Documento di riferimento permanente per tutte le chat, le immagini e i lotti successivi.**  
**Repository unico:** `marcoteghini1988-ai/test7`, ramo `main`.  
**Consolidato il:** 14 novembre 2026, dalle decisioni delle ultime chat e dal confronto diretto con i fronti **effettivamente approvati** dei lotti 01–03.

> **PRIMA DI GENERARE NUOVE CARTE:** aprire questo documento, `public/assets/fleet-approved-fronts/manifest.json` e almeno 2–3 dei PNG/WebP approvati indicati sotto. Non usare i mockup o le carte inventate in chat come riferimento. Questo documento non autorizza modifiche alle meccaniche.

## 1. La regola fondamentale: FUNZIONE × RARITÀ

- **FUNZIONE** = colore identificativo del contenuto, dell'icona/medaglione e del nastro con categoria; resta riconoscibile per tutte le rarità.
- **RARITÀ** = trattamento della cornice esterna, del metallo, della luminosità, dei riflessi e della targa inferiore. La rarità può aggiungere **metallo argento, riflessi ciano, accenti viola e finitura oro cromata**: non cambia la categoria della carta.
- La grafica è **sci‑fi spaziale cinematografica, ad alta definizione, con pannelli e cornici metalliche 3D, luci fluorescenti e illustrazioni differenti per soggetto**. Non usare frame sottili/piatti, miniature illustrate casuali o simboli astratti al posto di una scena.

### 1a. Palette ufficiale della FUNZIONE

| Funzione | Identità cromatica | Colore tecnico |
| --- | --- | --- |
| **ATTACCO** | Rosso energetico | `#FF594C` |
| **DIFESA** | Azzurro/ciano energetico | `#37CEFF` |
| **PERSONAGGIO** | Magenta/viola | `#EB64E1` |
| **TERRENO** | Verde | `#2BE3A2` |
| **SUPPORTO** | Arancione | `#FFB24D` |
| **CONTROLLO** | Indaco | `#9E8FFF` |

Questi HEX sono **colori guida di funzione**, non un obbligo di riempire l'intera cornice di quella tinta. Il catalogo può usare ulteriori tipologie: **non inventarne la mappatura**, leggere sempre il ruolo reale nel JSON prima di produrre.

### 1b. I quattro trattamenti di RARITÀ (prevale lo stile delle carte approvate)

| Rarità | Finitura osservata / da riprodurre | Riferimento approvato |
| --- | --- | --- |
| **COMUNE** | Metallo argentato/cromato con luci del colore di funzione; bagliore relativamente contenuto, targa inferiore argento scuro. | Difesa `gen-071`, `gen-082`; Attacco `gen-001`; Terreno `gen-219` |
| **RARA** | Cornice più luminosa e lucida, riflessi fluorescenti della funzione, targa di rarità blu/ciano per la Difesa; effetto raffinato, non oro totale. | Difesa `gen-092` |
| **EPICA** | Fluorescenza marcata, accenti viola/fucsia nella cromatura e sulla targa della rarità; l'icona, la categoria e la scena **mantengono il colore della funzione**. | Difesa `gen-106` |
| **LEGGENDARIA** | **Cornice esterna e targa con metallo oro cromato, luminosità massima, riflessi speculari**; il **nastro funzione, il simbolo e gli effetti pertinenti restano rosso, azzurro o verde**. Non trasformare la funzione in oro. | Difesa `gen-116`; Attacco `gen-067`; Terreno `gen-245` |

**RISOLUZIONE DISCORDANZA:** il vecchio file `docs/FLEET_NEXT_CARTA_GRAFICA_2026-11-14.md` riportava «Le Leggendarie NON diventano dorate». È vero **per il colore della funzione**, ma **non per la cornice esterna**, perché i tre fronti *Leggendari effettivamente approvati* (`gen-116`, `gen-067`, `gen-245`) hanno cornice e targa **oro cromato**. Questo documento e soprattutto le immagini approvate sciolgono la contraddizione. Non rigenerare le 30 già approvate per uniformarle a una vecchia frase.

## 2. Struttura VISIVA vincolante del fronte

1. **Formato verticale rettangolare 2:3**, uguale per tutte: PNG master 1024 × 1536; asset nel gioco SVG 512 × 768, eventuale WebP da PNG master mantenendo le proporzioni. Niente fronte quadrato.
2. **Cornice esterna 3D lavorata**, metallica, con angoli/giunzioni riflettenti e spessore simile ai primi 30 fronti.
3. **Medaglione circolare in alto a sinistra**, con icona coerente con la FUNZIONE (es. scudo per Difesa, mirino per Attacco, montagne per Terreno).
4. **Titolo grande in alto**, leggibile e senza variazioni inventate; sotto, **banner separato della FUNZIONE** (es. DIFESA).
5. **Illustrazione cinematografica dominante nella parte centrale**: navi, tecnologia, personaggi, ambiente o azione riferiti ALL'EFFETTO vero della carta; immagine unica e diversa per ogni ID, con dettagli, profondità e luci coerenti.
6. **Riquadro scuro inferiore dell'effetto**, con **testo identico a quello del catalogo**, completo e leggibile anche da telefono; non sostituire con bonus, danni o percentuali immaginari.
7. **Targa di RARITÀ in fondo**, molto leggibile, con cromatura e bagliore del livello corretto.
8. Nessuna scritta «Eclissi Stellare» o marchio del gioco sui fronti. No etichette `gen-###` stampate sui fronti se non presenti nel riferimento approvato. Niente logo aggiuntivo, riquadri vuoti o scritte senza verifica.
9. Le carte nuove devono apparire **della stessa serie** delle 30 approvate. **Non reinventare la cornice** in ogni generazione: usa i fronti approvati come riferimento di geometria, proporzioni, tipografia e trattamento del metallo.

## 3. Riferimenti visivi REALI, da aprire nel repository

Tutti i file sotto sono parte del set **approvato e integrato**, non concept:

- **Difesa Comune:** [`gen-082.webp`](../public/assets/fleet-approved-fronts/gen-082.webp) — Barriera Locale
- **Difesa Rara:** [`gen-092.webp`](../public/assets/fleet-approved-fronts/gen-092.webp) — Bastione a Settori (**riferimento immediato per lotto 04 Rara**)
- **Difesa Epica:** [`gen-106.webp`](../public/assets/fleet-approved-fronts/gen-106.webp) — Trincea Orbitale
- **Difesa Leggendaria:** [`gen-116.webp`](../public/assets/fleet-approved-fronts/gen-116.webp) — Aegis delle Costellazioni
- **Attacco Comune:** [`gen-001.webp`](../public/assets/fleet-approved-fronts/gen-001.webp) — Colpo Calibrato
- **Attacco Leggendaria:** [`gen-067.webp`](../public/assets/fleet-approved-fronts/gen-067.webp) — Lancia degli Eoni
- **Terreno Comune:** [`gen-219.webp`](../public/assets/fleet-approved-fronts/gen-219.webp) — Distesa Gelida
- **Terreno Leggendaria:** [`gen-245.webp`](../public/assets/fleet-approved-fronts/gen-245.webp) — Trono di Antimateria

Le **30 approvazioni effettive** e i metadati sono in [`manifest.json`](../public/assets/fleet-approved-fronts/manifest.json): contiene Lotto 01, Lotto 02 e Lotto 03; usare il suo conteggio aggiornato, non una cifra presunta da chat. Il controllo è [`src/approvedFleetFronts.test.js`](../src/approvedFleetFronts.test.js). **Le illustrazioni HD di base e i fronti completi approvati sono conteggi differenti**.

## 4. Catalogo e accuratezza: mai inventare meccaniche

- Nome, `id`, ruolo, rarità ed **effetto testuale** provengono da `src/fleetNext/catalogGeneral.json` e `src/fleetNext/catalogExclusive.json`; non usare le scritte suggerite da un'immagine AI.
- Alcune voci possono avere stato `proposta_da_bilanciare_non_implementata`: l'approvazione grafica **non** prova l'implementazione dell'effetto nel motore.
- Il colore di funzione, le immagini e i livelli di rarità sono **indipendenti** dai danni, dalla forza o dalle regole. Non inventare ATK/DEF, statistiche, nuove carte o nuove risorse.
- Mantieni plancia 3D ufficiale, Home, Shop, Hangar, navicelle, PvP simulato e regole senza modifiche durante la produzione grafica.

## 5. Lotti di produzione, revisione e integrazione

- **Mai pacchetti da 4** come risultato finale: presentare **almeno 10 carte complete per lotto**, preferibilmente le **20 richieste** quando la lavorazione lo prevede.
- Ogni lotto deve includere singoli PNG HD **1024 × 1536**, un'anteprima/panoramica leggibile da telefono, e tabella/JSON con **ID, nome, funzione, rarità, effetto** copiati dal catalogo.
- Prima di dichiarare il lotto pronto, verificare i singoli fronti: soggetti differenti, **stessa struttura visiva delle immagini approvate**, testi completi senza errori e file reali presenti.
- **Mostrare il lotto all'utente e attenderne l'approvazione prima di inserirlo in `test7/main`**. Non sostituire asset dei primi tre lotti. Una proposta o una tavola montata **non equivale a un lotto approvato**.
- Solo dopo conferma: aggiornare gli asset in `public/assets/fleet-approved-fronts/`, il manifest e gli SVG in `public/assets/fleet-next-cards/`, rispettare gli ID ufficiali ed eseguire test e build.
- **Lotto 04**: vedere `docs/LOTTO_04_PREPARAZIONE_20_DIFESE_2026-11-14.md` (20 Difesa, 12 Rare e 8 Epiche). Le generazioni visivamente difformi nelle chat NON sono approvate e NON vanno aggiunte come definitive.
- Niente copie parallele o progetti di test: repository unico `test7/main`. Non confondere «descrizione dei soggetti» con «immagini prodotte».

## 6. Ordine delle fonti quando i documenti si contraddicono

1. **Decisione più recente dell'utente** e approvazione esplicita.
2. **Fronti visuali già approvati** in `public/assets/fleet-approved-fronts/` per struttura, cornici e finiture; `manifest.json` per la lista.
3. **Cataloghi ufficiali JSON** per nomi, funzioni, rarità ed effetti.
4. **Questo documento** come raccolta operativa delle decisioni.
5. Documenti storici, screenshot sperimentali, mockup non approvati e suggerimenti grafici generici: **non sovrascrivono lo standard**.

**ISTRUZIONE PER OGNI NUOVA CHAT:** «Apri `docs/STILE_UFFICIALE_CARTE_APPROVATO.md` di `marcoteghini1988-ai/test7`, guarda `gen-092.webp` e gli altri fronti approvati, controlla `manifest.json`, poi riprendi dal prossimo lotto senza cambiare grafica o regole». 
