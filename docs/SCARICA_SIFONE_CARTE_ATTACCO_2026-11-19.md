# Eclissi Stellare — Scarica Sifone e Scarica Sifone Omega

**Decisione approvata il 19 novembre 2026.** Due **Carte Attacco generiche**, non Armi di Supporto né carte esclusive delle 12 madri. La loro logica è integrata nel ruleset ufficiale `hp-sync-v2` del ramo `main`.

## Identità
| ID | Carta | Rarità | Danno |
| --- | --- | --- | --- |
| `atk-siphon-e` | Scarica Sifone | Epica | Danno totale suddiviso fra tutte le navi nemiche ancora in campo |
| `atk-siphon-l` | Scarica Sifone Omega | Leggendaria | Danno totale inflitto *a ciascuna* nave nemica ancora in campo |

La versione Epica e quella Leggendaria sono due carte autonome. **Non** sono livelli di rarità evolutivi della stessa carta.

## Regole in battaglia
1. Ogni carta occupa **uno dei tre slot Attacco** durante la preparazione/risoluzione del turno. **Non** occupa i due slot Arma temporanea e non schiera macchine. Alla fine del turno la carta è negli scarti e il suo slot Attacco si libera.
2. Per giocarla serve almeno una navicella di supporto operativa in uno dei due slot del giocatore. Con due supporti operativi il sacrificio avviene su entrambi; con uno, soltanto su quello. Le fusioni non aumentano il numero di slot.
3. Ogni supporto alleato operante sacrifica il **20% degli HP che possiede in quel preciso momento**, non dei suoi HP massimi. Il calcolo è per singola nave con **arrotondamento per eccesso**, minimo **1 HP**: 150 HP→30, 50 HP→10, 7 HP→2, 2 HP→1.
4. Il sacrificio **non può distruggere** un supporto: se anche uno dei supporti attivi possiede soltanto 1 HP, non è possibile giocare la carta. Con zero supporti disponibili non è giocabile.
5. La somma degli HP sacrificati produce la quantità di danno **nominale**. La carta colpisce **automaticamente** tutte le navicelle avversarie presenti: prima i supporti attivi, poi la nave madre. Il giocatore non seleziona un bersaglio specifico per la Scarica.
6. **Epica:** ripartizione quanto più possibile uniforme, dando gli eventuali resti interi ai primi bersagli in ordine di slot. **Leggendaria:** ogni bersaglio riceve nominalmente l'intera somma.
7. Le **Difese**, le **resistenze elementali**, la **sincronizzazione** e i limiti sugli HP della nave madre esistenti possono ridurre il danno realmente subito. Il sacrificio HP del giocatore non è un attacco e non trasferisce danni alla propria madre.
8. I valori vengono ricalcolati a ogni giocata. Se due copie sono usate nello stesso turno, la seconda consuma il 20% degli **HP già ridotti** dalla prima.

### Esempio
Due supporti alleati a 150 HP ciascuno: 30 + 30 = **60 HP sacrificati**.
- **Scarica Sifone (Epica)**: con due supporti nemici e una madre, **20/20/20 danni nominali**.
- **Scarica Sifone Omega (Leggendaria)**: con gli stessi bersagli, **60/60/60 danni nominali**, ossia 180 prima delle difese.

## File di implementazione
- `src/fleetNext/siphonAttacks.js`: catalogo di entrambe le carte, costi HP, bersagli e distribuzione.
- `src/fleetNext/rules.js`, `src/fleetNext/simpleEffects.js`, `src/fleetNext/nextDeckLoadout.js`: riconoscimento, testo, validazione e costruzione del mazzo.
- `src/fleetNext/combat.js`: esecuzione, scarti, liberazione dello slot Attacco e registrazione dell'evento `siphon-strike`.
- `src/FleetCollectionWorkshop.jsx`: visualizzazione nelle Carte Attacco.
- `src/fleetNextSiphonAttacks.test.js`: regressioni su rarità, categorie, costo, ripartizione, giocabilità, limite 1 HP, turno e slot.

## Non incluso in questa modifica
Non vengono concessi duplicati o carte gratuitamente, non vengono inventati prezzi di Shop, non vengono generate illustrazioni o animazioni. Le **120 esclusive delle navicelle** rimangono intatte. Prezzo, metodo di ottenimento, estetica e bilanciamento in partita vanno affrontati separatamente.
