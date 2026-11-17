# Eclissi Stellare — checkpoint esclusive delle 17 navicelle
**Data:** 17 novembre 2026 · **repository ufficiale:** `test7/main`

## Stato del catalogo
- **170 carte esclusive attive:** 10 per ognuna delle 17 famiglie.
- **12 madri originarie:** 120 esclusive già implementate con i loro 12 motori specifici. Non sono state ricreate o modificate nelle regole.
- **5 varianti (C04, R03, E03, E04, L02):** ogni Personaggio originale è stato conservato; aggiunte **9 nuove carte per variante** (45 in tutto), con nome, funzione, effetto eseguibile, descrizione, visualBrief e ID univoco `nx-*`.
- Le nuove carte utilizzano esclusivamente effetti standard già gestiti dal combattimento: potenza, penetrazione, difesa, schivata, riparazione, indebolimento, pescata, carica, contrattacco, disarmo, rigenerazione, Trappola contro Terreno e Macchina temporanea. **Non** sono blueprint fittizi.
- Le carte avanzate nuove (numeri 07–10) richiedono Centralina e una/due scudiere operative; il requisito viene applicato dal registro `exclusiveUnlocked/exclusiveOperational` e mostrato in Hangar.
- **Nessuna nuova Fusione:** le sole tre madri con Fusione restano L01, L03, L04; Arca mantiene due fusioni con due posti attivi.

## Rarità dinamica
`src/fleetNext/exclusiveEvolution.js` assegna **Comune → Rara → Epica → Leggendaria** in quattro fasce della progressione reale della madre; tutte e 17 raggiungono Leggendaria al proprio livello massimo.

- Aurora-0 L20: Comune L1–5; Rara L6–10; Epica L11–15; Leggendaria L16–20.
- Arca Astrale L5: Comune L1–2; Rara L3; Epica L4; Leggendaria L5.
- Hangar, mano di battaglia e slot mostrano la rarità di livello, senza creare/riutilizzare illustrazioni fuori stile.
- **Rarità non equivale al grado manuale dell'effetto**: i gradi 1–3 e i costi in crediti sono ancora conservati dal sistema precedente. Non sono state introdotte statistiche non approvate.

## Integrazione
- `src/fleetNext/variantExclusives.js`: 45 nuove schede, validadore e descrizione motore.
- `src/fleetNext/rules.js`: 170 schede esclusive nel registro, nei mazzi automatici e nel motore.
- `src/FleetCollectionWorkshop.jsx`: mostra rarità e prossimi sblocchi, requisiti di scudiera/centralina.
- `src/OfficialFleetBattle3D.jsx`: rarità reale per mano e slot.
- `src/fleetNextVariantExclusives.test.js`: verifiche strutturali, registrazione degli effetti, quartili rarità e turni per le cinque nuove famiglie.
- Allineati i test/invarianti del catalogo da 155 a **200 schede totali**: 12 personaggi generici, 170 esclusive, 12 personaggi Boss e 6 carte tecniche.

## Restano da completare (non simulare come fatti)
1. **Nuova distribuzione dei singoli sblocchi** delle 120 esclusive principali oltre il vecchio intervallo L1–L5: non è stata cambiata per evitare regressioni nelle 12 batterie di test dei motori già scritti; la stessa distribuzione iniziale vale per le 45 varianti. I livelli L6–L20 ora cambiano la rarità, non la data di ottenimento delle carte.
2. **Evoluzione di potenza degli effetti** in base alla progressione estesa: attualmente grado 1–3 manuale, da calibrare senza invalidare effetti e vincoli esistenti.
3. **Bilanciamento finale** di HP, danni, passivi scudiere, costo delle Fusioni e confronto PvP su potenziale finale 100.
4. **Illustrazioni, animazioni e cornici di rarità:** non generate; mantenuto il renderer nativo.
5. **Esecuzione locale completa dei test:** non verificata da questo intervento. I nuovi test sono stati aggiunti al codice; verificare build e suite nel runtime del repository prima di distribuire il gioco.

## Regole di continuità
Modificare solo `test7/main`, senza branch di prova o duplicazione del gioco. Le 170 ID esclusive attive sono ufficiali; non riattivare le 350 carte ritirate. Non cambiare plancia 3D, mano da 7, 30 secondi a turno o PvP simulato nel corso dell'evoluzione delle carte.
