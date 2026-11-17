# Eclissi Stellare — integrazione delle 120 esclusive
**Aggiornamento: 17 novembre 2026** · Repository ufficiale: `marcoteghini1988-ai/test7` · Ramo: `main`

## Stato del catalogo
- **120 esclusive univoche progettate** per le 12 navicelle principali, esattamente 10 per ciascuna; distribuzione: sei dal livello 1, una nuova ai livelli 2, 3, 4 e 5.
- **20/120 definizioni riprogettate con effetti di battaglia implementati**, dieci di Aurora-0 (`N00`) e dieci di Lince Solare (`C01`).
- **90 nuove schede delle altre 10 navicelle restano `playable:false`**: non si pescano e non consumano crediti, perché gli effetti non sono ancora realizzati.
- Gli altri **10 Personaggi delle navicelle principali** mantengono il comportamento storico fino all'integrazione della rispettiva nave. I 12 Personaggi del progetto riutilizzano i propri ID, senza duplicati.
- Restano inoltre i cinque Personaggi delle varianti storiche, dodici Personaggi generici, dodici Boss e sei carte tecniche (Macchine, Aggiramento e Fusioni).
- `EXCLUSIVE_CARDS` include 125 registrazioni: 120 delle madri principali e cinque Personaggi varianti. Il catalogo complessivo, comprese generiche, Boss e tecniche, contiene **155 definizioni**.

## Aurora-0 — 10/10 implementate
`src/fleetNext/auroraEngine.js` e `src/fleetNext/combat.js` eseguono Ottica di ricognizione, Raffica di prova, Tiro di smontaggio, Velo di salvataggio, Adattamento immediato, Cartografo Aurora, Canna perforante, Corazza modulare, Cannone biforcato e Riconfigurazione Aurora. I moduli hanno due integrità e un alloggiamento arma/utilità separato; le carte restano nel campo fino alla distruzione o sostituzione. Non creano nuovi vitali.

## Lince Solare — 10/10 implementate
`src/fleetNext/linceEngine.js` definisce proprietà, limiti e stato; `src/fleetNext/combat.js` applica gli effetti alle unità e ai vitali reali.

| Livello | Carta | Azione eseguibile |
|---|---|---|
| 1 | Propulsori radenti | Dopo il primo Aggiramento che infligge danno, puoi richiamare una macchina viva mantenendone integrità e identità. Il rimontaggio non cura. |
| 1 | Sorpasso solare | Un colpo leggero raggiunge un solo vitale oltre le unità; Difese e Trappole restano valide. Non eredita Perforazione. |
| 1 | Artiglio di coda | Un danno su unità integra oppure tre su unità già danneggiata. Non raggiunge vitali. |
| 1 | Falsa scia | Trappola coperta. Il prossimo colpo a un vitale viene deviato su un altro vitale vivo scelto alla posa, senza creare colpi nuovi. |
| 1 | Pilota Helios | Un ricambio volontario dopo una carta Aggiramento, una volta per ciascuno dei due propri turni. Nessuna pescata netta. |
| 1 | Rotta marcata | Marca un vitale avversario. Nel prossimo proprio turno, il tiro leggero verso di lui può aggirare i guardiani, senza Perforazione. |
| 2 | Lama di prua | Modulo d'arma: dopo un danno riuscito su un'unità, può togliere una protezione residua visibile da quella unità, una volta per turno. |
| 3 | Passaggio scoperto | Difesa visibile, disponibile se il precedente turno ha avuto un Aggiramento riuscito. Annulla il prossimo comando di Aggiramento avversario, se la Plancia funziona. |
| 4 | Disimpegno armato | Colpo normale a una unità; permette di richiamare il modulo d'arma in mano, mantenendo danni, identità e stato. |
| 5 | Incursione cremisi | Sacrifica un modulo vivo prima delle reazioni e colpisce un solo vitale oltre i guardiani, superando una sola protezione scoperta. |

Le scelte sono collegate a `src/OfficialFleetBattle3D.jsx`, senza cambiare la composizione 3D approvata. La Trappola Lince è nascosta all'avversario anche durante la selezione.

## Test e controlli
- `src/fleetNextAuroraEffects.test.js`: **15 casi** specifici Aurora.
- `src/fleetNextLinceEffects.test.js`: **17 casi** specifici Lince e interazioni di battaglia.
- **12 controlli dinamici Lince superati** in questa sessione valutando il vero motore JavaScript con dipendenze simulate; comprendono modulo, aggiramento, Artiglio, Falsa scia, Helios, Rotta, Lama, Passaggio, Disimpegno, Incursione e macchina recuperata.
- Ricaricamento indipendente del catalogo eseguibile verificato: **10/10 Aurora e 10/10 Lince**, restanti 90 schede non giocabili; testi, ID, categorie e livelli coerenti.
- La sintassi JavaScript dei moduli principali e del nuovo file di test è stata controllata.
- **Non sono ancora stati eseguiti** la suite Node completa nel repository, il comando `npm run build` né un collaudo visivo sul telefono/browser. I controlli con dipendenze simulate non sostituiscono queste verifiche.

## Vincoli confermati e prossimo blocco
- Non creare immagini in questa fase. Vecchie illustrazioni restano archiviate e non vengono riutilizzate come nuove carte.
- Mantenere le navicelle, la progressione L1–L5, i Boss, i Personaggi e l'arena metallica 3D originale.
- La vittoria resta ancora determinata dalla distruzione dei vitali della madre: l'eventuale cambio dell'obiettivo verso le macchine sarà un intervento separato, non introdotto tacitamente.
- **Prossima nave: Vespa di Vetro (`C02`)** e le sue dieci esclusive, incluse le meccaniche di riflessione e deviazione.
