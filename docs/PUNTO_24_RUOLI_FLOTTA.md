# Punto 24 della scaletta ufficiale — Identità e ruoli delle navicelle

**Data:** 6 novembre 2026 — **stato: struttura già operativa, vincoli di ruolo ora sottoposti a test, sviluppo strategico successivo ancora aperto**.

## Ruoli confermati nel prototipo
Ogni madre è accompagnata, ai livelli autorizzati, da:
- **Scudiera 1 — Difesa:** `Guardia`, `Intercettore`, `Baluardo`. Il suo compito è proteggere la madre e intercettare colpi spendendo il proprio scudo.
- **Scudiera 2 — Attacco:** `Assalto`, `Incursore`, `Assedio`, `Artiglieria`. Il suo obiettivo è colpire i bersagli per cui è stata specializzata.
- **Madre:** può avere armi e dottrina proprie, con quattro vitali nel nuovo motore prototipo. La flotta rimane centrata sulla singola madre.

Questa suddivisione NON crea nuove carte-navicella: le scudiere sono subordinate e si sbloccano ai livelli 3 e 5.

## Codice già presente
- `src/escortArmory.js`: 17 madri con due dotazioni subordinate ognuna.
- `src/escortTactics.js`: sette ruoli, bonus collegati al tipo di bersaglio, 17 dottrine specifiche per la famiglia della madre, decadimento della coordinazione alla distruzione della centralina.
- `src/escortFiring.js`: assegnazione delle munizioni della carta ad una sola arma per volta, con effetti dei ruoli.
- `src/MathDuelBattle.jsx`: ruolo scudiera indicato in campo; formazioni e carte fusione già separate nel pannello tattico.
- `src/escortRolesMatrix.test.js`: **nuovi test** che verificano identità 17×2, descrizioni di tutti i ruoli, assegnazione corretta senza carte aggiunte ed effetti condizionati dal bersaglio.

## Non ancora concluso
- Identità tattica individuale di tutte le 17 madri e relative scudiere oltre a bonus percentuali; distinguere realmente attacco, velocità, rischio, interdizione e gestione delle armi.
- Scelta tra attacco ordinario e abilità con una/due carte speciali compatibili, non solo Fusione Barriera/Assalto.
- Eventuali interventi del comandante unico della flotta, senza trasformarlo in una carta comandante autonoma per ciascuna scudiera.
- Bilanciamento finale di tutte le percentuali, di L1–L5 e dei settori.
- Grafica 3D, reattività su telefono e effetti audiovisivi definitivi, **espressamente rinviati** finché le meccaniche non saranno stabilite.

## Punto 25 implementato come primo prototipo
La difesa della madre è articolata in intercettazione automatica, formazione Guardia e una carta Copertura Tattica che impiega gli HP dello scudo reale della prima scudiera sul successivo colpo diretto alla madre. Il catalogo comprende ora tre speciali, sempre in una mano separata da cinque. Parametri provvisori, dettagli e test in `PUNTO_25_PROTEZIONE_MADRE.md`. Passaggio successivo: punto 26, danni localizzati ai sistemi.

Riferimento: `docs/MASTER_DECISIONI_ECLISSI_STELLARE_2026-11-06.md`.
