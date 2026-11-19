# Eclissi Stellare — Primo target di durata e Attacchi Speciali
19 novembre 2026.

## Durata obiettivo, non eliminazione automatica
- **PvP**: 4-6 minuti, obiettivo circa 5. Con turni individuali di massimo 30 s equivale a 8-12 turni *solo se tutti usano il tempo intero*. Non applicare una chiusura artificiale a sei minuti.
- **Campagna ordinaria**: circa 5-6 minuti.
- **Boss**: 8-10 minuti (obiettivo 9). Ogni boss puo' richiedere una calibrazione propria.
- La durata reale dipende da quanto presto i giocatori confermano la mossa; serve cronometrare le partite, non calcolare soltanto round teorici.
- Configurazione non vincolante: `src/fleetNext/battlePacing.js`, riportata nello stato battaglia per analisi. **Non** cambia il timer individuale di 30 secondi o i limiti delle carte.

## Speciali alimentate dalle Carte Energia
- Le 10 Carte Energia conservano gli stessi elementi, accumulo massimo 4 e costi di 1-4 Energie. Una speciale sostituisce l'attacco oppure usa il proprio effetto: **non crea un secondo colpo**.
- Le **6 offensive** aggiungono potenza in proporzione all'attacco della madre e al costo energetico, non i vecchi 1-2 HP fissi.
- Le **6 non offensive** conservano la propria identita': il blocco della scudiera resta di un turno; scudi e disturbi ora scalano con l'attacco; la cura scala con gli HP massimi e non supera il 22% della vita.
- Vantaggio elementale +25%, svantaggio -50% restano applicati una sola volta. I limiti temporanei di danno alla madre rimangono attivi.
- Le battaglie tecniche HP senza rarita' conservano le precedenti grandezze per compatibilita'; i nuovi numeri si applicano ai combattimenti che attribuiscono rarita' alle madri.

## Collaudi
`src/fleetNextSpecialPacing.test.js` copre le finestre, i sei attacchi, gli effetti difensivi e la cura. Resta da fare un collaudo statistico con mazzi completi, IA, supporti, elementi e boss per verificare empiricamente il target PvP 4-6 min / Boss 8-10 min. I numeri sono prima calibrazione, non una promessa di durata garantita.
