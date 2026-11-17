# Eclissi Stellare — prima attuazione della progressione estesa delle 17 navi

**17 novembre 2026** · Repository ufficiale `test7/main` · **Parametri provvisori, bilanciamento finale rimandato.**

## Tabella operativa

| ID | Nave madre | Livello massimo | Prima scudiera | Seconda scudiera | Fusioni |
|---|---|---:|---:|---:|---|
| `N00` | Aurora-0 | **20** | L10 | L18 | — |
| `C01` | Lince Solare | **19** | L9 | L17 | — |
| `C02` | Vespa di Vetro | **18** | L3 | L5 | — |
| `C03` | Corvo a Impulsi | **17** | L1 | L1 | — |
| `C04` | Dardo Cremisi | **16** | L3 | L5 | — |
| `R01` | Falco Binario | **15** | L1 | L1 | — |
| `R02` | Manta Ionica | **14** | L1 | L1 | — |
| `R03` | Iride | **13** | L1 | L1 | — |
| `R04` | Squalo del Vuoto | **12** | L1 | L1 | — |
| `E01` | Nebulosa | **11** | L1 | L1 | — |
| `E02` | Tempesta | **10** | L1 | L1 | — |
| `E03` | Fenice | **9** | L1 | L1 | — |
| `E04` | Orizzonte | **8** | L1 | L1 | — |
| `L01` | Eclisse Reale | **7** | L1 | L1 | L5 (una) |
| `L02` | Singolarità | **6** | L1 | L1 | — |
| `L03` | Titano Ossidiana | **5** | L1 | L1 | L3 (una) |
| `L04` | Arca Astrale | **5** | L1 | L1 | due; riserve L3/L5 |

## Regola di progressione

- **Primo modello Aurora-0:** L1–L20, prima scudiera **Velo Aurora** dal L10, seconda **Lancia Aurora** dal L18. La Centralina compare insieme alla prima scudiera; prima di quel momento il modello resta autonomo come nel gioco precedente.
- **Secondo modello Lince Solare:** L1–L19, prima scudiera **Sentinella Solare** dal L9, seconda **Lama Rubino** dal L17; Centralina sbloccata insieme alla prima scudiera.
- Le altre 15 famiglie mantengono le coppie e le soglie storiche fino al L5 (alcune già possiedono due supporti dal primo livello), ma hanno tetti ulteriori secondo la tabella.
- Non si schierano mai più di **due scudiere contemporaneamente**. Arca Astrale mantiene **due riserve** sbloccate durante la propria progressione, utilizzate soltanto tramite le fusioni.
- Le fusioni restano disponibili **solo per Eclisse Reale, Titano Ossidiana e Arca Astrale**; non vengono conferite automaticamente alle altre 14 famiglie.
- Ogni livello aumenta un indice `masteryPoints/potential` da **0 a 100**, che servirà a misurare la progressione su una scala comparabile fra flotte con lunghezze diverse. Il **100 indica il traguardo di progettazione**, non un bilanciamento PvP già verificato.
- Dopo il vecchio L5, aumenti provvisori di Arsenale e Corazza e avanzamento dei gradi scudiere avvengono a soglie progressive. **I valori finali degli HP non sono stati fissati**: gli HP esistenti continuano a essere utilizzati come base temporanea.
- La maggiore durata della progressione della prima nave non implica una maggiore forza finale: Aurora-0 L20 e Arca Astrale L5 vanno calibrate perché possano competere, mantenendo stili distinti.
- I prezzi dei livelli aggiunti sono **provvisori** e non costituiscono il bilanciamento economico definitivo.

## Implementazione effettiva

- `src/fleetNext/progression.js`: tetti `SHIP_MAX_LEVELS`, soglie `shipEscortUnlockLevels`, progressione per tutti i livelli e potenziale finale 100.
- `src/fleetNext/combat.js`: crea la madre al livello reale fino al tetto della sua famiglia; usa le scudiere tecniche già definite in `src/fleetEscortSupports.js` e `src/escortArmory.js`.
- Asset visivi delle prime due coppie **già presenti**: `public/assets/escorts/N00_escort_1.svg`, `N00_escort_2.svg`, `C01_escort_1.svg`, `C01_escort_2.svg`. Non è stato creato un modello 3D alternativo.
- `src/shipCollection.js`: conserva nei salvataggi L6–L20 quando consentito dalla famiglia; non altera i salvataggi storici L1–L5.
- `src/shipUpgrades.js`: potenziamenti acquistabili un livello per volta fino al massimo di ogni famiglia, senza inventario o denaro reale aggiuntivi.
- `src/ShipCollectionPanels.jsx` e `src/ShipPresentation.jsx`: mostra livelli reali e sblocchi negli schermate Catalogo/Hangar. Il renderer tecnico di prova delle navi resta al massimo a cinque preset visuali; l'etichetta e gli attributi della nave in Hangar usano il livello nuovo.
- `src/officialCampaignRivalScaling.js` e `src/OfficialFleetBattle3D.jsx`: gli stessi cinque scaglioni storici di difficoltà vengono mappati sulla progressione della famiglia avversaria, fino al suo massimo.
- Compatibilità storica: il motore `mathDuelEngine.js` che usa preset fisici L1–L5 **non è riscritto** per la nuova progressione. Il nuovo ruleset HP utilizza il livello reale. Le vecchie modalità sono mantenute, senza promettere che siano state convertite alla nuova scala.
- Test: `src/fleetNextExtendedProgression.test.js`, `src/fleetNextProgression.test.js`, `src/shipUpgrades.test.js` e test di regressione.

## Ancora da decidere e NON implementato in questo passo

1. Valori finali degli HP della madre, degli HP delle scudiere, del danno base, della forza delle armi temporanee e dei costi.
2. Abilità definitive delle scudiere e delle fusioni, precedentemente discusse come idee.
3. **Aggiornamento successivo del 17/11:** sono attive 170 esclusive per 17 navi e la loro **rarità visiva automatica Comune→Leggendaria** segue i livelli reali (`src/fleetNext/exclusiveEvolution.js`). Restano **da completare** la ridistribuzione degli sblocchi delle 10 carte lungo L1–L20 e l'evoluzione della forza degli effetti: l'attuale sblocco carte L1–L5 e i gradi manuali sono ancora preservati. Vedere `docs/CHECKPOINT_170_ESCLUSIVE_E_RARITA_2026-11-17.md`.
4. Test di bilanciamento reale PvP fra flotte diverse al massimo livello. La parità di potenziale al 100% è **soltanto un obiettivo comune**, non una percentuale di vittoria garantita.
5. Nuove illustrazioni e animazioni: **non create**.
