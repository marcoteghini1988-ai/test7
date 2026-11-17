# INDICE UFFICIALE — CARTE ATTACCO DA ILLUSTRARE (LOTTO 33)

**Parole chiave per ricerche future:** `carte attacco`, `attacco`, `immagini carte attacco`, `33 carte`, `sabotaggio`, `amplificazione`, `buco nero`.

**Decisione di gioco (17 novembre 2026):** tutte le **33 carte** qui sotto sono di **tipo ATTACCO**, anche quando il loro effetto è un potenziamento o un reset del campo. Si giocano nel proprio turno di attacco, negli **slot Attacco** (tre disponibili); **non** sono carte Difesa, Trappola, Personaggio, Terreno o Arma temporanea. Gli effetti con durata continuano per i turni previsti dopo la giocata, senza occupare gli slot nei turni successivi.

Questo è l'indice **del lotto delle 33 carte nuove**; non sostituisce l'elenco delle carte Attacco esclusive delle navicelle.

## Elenco per la futura produzione delle immagini

| # | ID tecnico | Nome carta | Sistema | Funzione | Rarità | Slot |
|---:|---|---|---|---|---|---|
| 1 | `sys-command-minus-c` | Fruscio di telemetria | Centralina | Sabotaggio | Comune | **ATTACCO** |
| 2 | `sys-command-minus-r` | Interferenza di collegamento | Centralina | Sabotaggio | Rara | **ATTACCO** |
| 3 | `sys-command-minus-e` | Sfasamento di formazione | Centralina | Sabotaggio | Epica | **ATTACCO** |
| 4 | `sys-command-minus-l` | Silenzio di comando | Centralina | Sabotaggio | Leggendaria | **ATTACCO** |
| 5 | `sys-command-plus-c` | Riallineamento del canale | Centralina | Amplificazione | Comune | **ATTACCO** |
| 6 | `sys-command-plus-r` | Relè di riserva | Centralina | Amplificazione | Rara | **ATTACCO** |
| 7 | `sys-command-plus-e` | Trama risonante | Centralina | Amplificazione | Epica | **ATTACCO** |
| 8 | `sys-command-plus-l` | Rete di comando totale | Centralina | Amplificazione | Leggendaria | **ATTACCO** |
| 9 | `sys-weapons-minus-c` | Tubo surriscaldato | Arsenale | Sabotaggio | Comune | **ATTACCO** |
| 10 | `sys-weapons-minus-r` | Munizioni interferite | Arsenale | Sabotaggio | Rara | **ATTACCO** |
| 11 | `sys-weapons-minus-e` | Alimentazione inceppata | Arsenale | Sabotaggio | Epica | **ATTACCO** |
| 12 | `sys-weapons-minus-l` | Arsenale in ombra | Arsenale | Sabotaggio | Leggendaria | **ATTACCO** |
| 13 | `sys-weapons-plus-c` | Carica rapida | Arsenale | Amplificazione | Comune | **ATTACCO** |
| 14 | `sys-weapons-plus-r` | Doppia camera | Arsenale | Amplificazione | Rara | **ATTACCO** |
| 15 | `sys-weapons-plus-e` | Sovralimentazione multipla | Arsenale | Amplificazione | Epica | **ATTACCO** |
| 16 | `sys-weapons-plus-l` | Furia coordinata | Arsenale | Amplificazione | Leggendaria | **ATTACCO** |
| 17 | `sys-generator-minus-c` | Calo di tensione | Generatore | Sabotaggio | Comune | **ATTACCO** |
| 18 | `sys-generator-minus-r` | Perdita di flusso | Generatore | Sabotaggio | Rara | **ATTACCO** |
| 19 | `sys-generator-minus-e` | Scarica di ritorno | Generatore | Sabotaggio | Epica | **ATTACCO** |
| 20 | `sys-generator-minus-l` | Soffocamento del nucleo | Generatore | Sabotaggio | Leggendaria | **ATTACCO** |
| 21 | `sys-generator-plus-c` | Condensatore ausiliario | Generatore | Amplificazione | Comune | **ATTACCO** |
| 22 | `sys-generator-plus-r` | Flusso stabilizzato | Generatore | Amplificazione | Rara | **ATTACCO** |
| 23 | `sys-generator-plus-e` | Nucleo potenziato | Generatore | Amplificazione | Epica | **ATTACCO** |
| 24 | `sys-generator-plus-l` | Risonanza del Generatore | Generatore | Amplificazione | Leggendaria | **ATTACCO** |
| 25 | `sys-bridge-minus-c` | Coordinate falsate | Plancia | Sabotaggio | Comune | **ATTACCO** |
| 26 | `sys-bridge-minus-r` | Confusione della rotta | Plancia | Sabotaggio | Rara | **ATTACCO** |
| 27 | `sys-bridge-minus-e` | Rotta fantasma | Plancia | Sabotaggio | Epica | **ATTACCO** |
| 28 | `sys-bridge-minus-l` | Cortocircuito tattico | Plancia | Sabotaggio | Leggendaria | **ATTACCO** |
| 29 | `sys-bridge-plus-c` | Calcolo di tiro | Plancia | Amplificazione | Comune | **ATTACCO** |
| 30 | `sys-bridge-plus-r` | Navigazione assistita | Plancia | Amplificazione | Rara | **ATTACCO** |
| 31 | `sys-bridge-plus-e` | Analisi predittiva | Plancia | Amplificazione | Epica | **ATTACCO** |
| 32 | `sys-bridge-plus-l` | Strategia a fuoco | Plancia | Amplificazione | Leggendaria | **ATTACCO** |
| 33 | `sys-black-hole` | Buco Nero | Campo globale | Reset del campo | Leggendaria | **ATTACCO** |

## Istruzioni per creare le immagini (fase successiva)

- Quando viene chiesto **«cerca le carte Attacco»**, consultare prima questo indice, poi il catalogo tecnico. Le 33 carte sono da includere nella ricerca insieme alle altre Attacco del gioco quando richieste.
- Utilizzare l'**ID tecnico** come chiave stabile per collegare ogni futura immagine alla carta giusta; non rinominare ID o cambiare effetti durante la produzione grafica.
- Per ogni immagine mantenere identificabili a colpo d'occhio **Attacco**, la funzione (Sabotaggio, Amplificazione o Buco Nero) e la rarità (Comune, Rara, Epica, Leggendaria). Non generare o inserire immagini senza la fase di approvazione prevista.
- Sorgente delle definizioni: `src/fleetNext/newCardRegistry.js` (`kind: 'attack'` per tutte le 33). Test automatici di riferimento: `src/fleetNextNewCardsCombat.test.js`. Specifiche: `docs/CATALOGO_32_CARTE_SISTEMI_2026-11-17.json` e `docs/PROGETTAZIONE_32_CARTE_SISTEMI_2026-11-17.md`.
