# Eclissi Stellare — integrazione delle 120 esclusive
**Aggiornamento: 17 novembre 2026** · Repository ufficiale: `marcoteghini1988-ai/test7` · Ramo: `main`

## Stato del catalogo
- **120 esclusive univoche progettate** per le 12 navicelle principali, esattamente 10 per ciascuna; distribuzione: sei dal livello 1, una nuova ai livelli 2, 3, 4 e 5.
- **30/120 definizioni riprogettate con effetti di battaglia implementati**, dieci ciascuna per Aurora-0 (`N00`), Lince Solare (`C01`) e Vespa di Vetro (`C02`).
- **81 nuove schede delle altre 9 navicelle restano `playable:false`**: non si pescano e non consumano crediti, perché gli effetti non sono ancora realizzati.
- Gli altri **9 Personaggi delle navicelle principali** mantengono il comportamento storico fino all'integrazione della rispettiva nave. I 12 Personaggi del progetto riutilizzano i propri ID, senza duplicati.
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

## Vespa di Vetro — 10/10 integrate (17 novembre 2026)
`src/fleetNext/prismaEngine.js` implementa i prerequisiti delle dieci esclusive. `src/fleetNext/combat.js` applica gli effetti agli oggetti reali del combattimento; la plancia `src/OfficialFleetBattle3D.jsx` permette di scegliere i bersagli e le destinazioni.

| Livello | Carta | Funzione nel gioco |
|---|---|---|
| 1 | Lente prismatica | Modulo d'arma: un colpo bloccato marca il bersaglio, e un colpo successivo nello stesso turno supera una protezione scoperta; massimo una marca per turno. |
| 1 | Scheggia riflessa | Colpo normale su una unità. Solo se viene bloccato, un secondo colpo leggero raggiunge un'altra unità; nessun rimbalzo ricorsivo. |
| 1 | Prisma di deviazione | Difesa scoperta: una macchina operativa prestabilita intercetta un singolo colpo diretto a un'altra macchina. Richiede due macchine operative. |
| 1 | Riflesso falso | Trappola coperta: annulla un solo colpo secondario diretto al bersaglio scelto alla posa. Non blocca raffiche ripetute sul bersaglio principale. |
| 1 | Artigiana Prisma | Personaggio originale, senza duplicati: dopo un blocco può trasferire una carica residua su un altro bersaglio della stessa categoria, una volta per turno, senza creare cariche. |
| 1 | Taglio della lente | Rimuove una carica di protezione scoperta da una unità nemica. Non infligge danni, non rivela le Trappole. |
| 2 | Geometria spezzata | Due colpi leggeri sulla prima unità e uno su una seconda unità distinta. I colpi non vengono riassegnati dopo una distruzione. |
| 3 | Custodia del Prisma | Richiede Centralina e primo supporto attivi: trasferisce una protezione scoperta dal Generatore al supporto, conservando cariche e scadenza. |
| 4 | Specchio segmentato | Modulo utilità da due integrità: il primo colpo che lo danneggia ogni turno causa al massimo un danno. Gli altri colpi seguono la regola normale. |
| 5 | Rosa di cristallo | Richiede due supporti operativi e Centralina. Fino a tre colpi leggeri a tre unità nemiche diverse; i colpi eccedenti si perdono. |

Le nuove carte hanno il fronte testuale provvisorio: **non riutilizzano le illustrazioni delle versioni precedenti**. Le difese nascoste non rivelano l'identità all'avversario. Il numero e i livelli dei vitali non sono alterati.

## Test e controlli
- `src/fleetNextAuroraEffects.test.js`: **15 casi** specifici Aurora.
- `src/fleetNextLinceEffects.test.js`: **17 casi** specifici Lince e interazioni di battaglia.
- `src/fleetNextPrismaEffects.test.js`: **18 casi** specifici Vespa e interazioni con le altre flotte.
- **12 controlli dinamici Lince superati** in questa sessione valutando il vero motore JavaScript con dipendenze simulate; comprendono modulo, aggiramento, Artiglio, Falsa scia, Helios, Rotta, Lama, Passaggio, Disimpegno, Incursione e macchina recuperata.
- **18/18 test Vespa superati eseguendo il codice JavaScript reale con dipendenze simulate**, inclusi doppio colpo, deviazioni, Trappola secondaria, Artigiana, trasferimento cariche, Specchio e Rosa. Anche la rilettura indipendente del catalogo ha confermato **10/10 Aurora, 10/10 Lince, 10/10 Vespa** e **81 schede non giocabili**. ID, testi, livelli e assenza di fronti grafici inesatti verificati.
- La sintassi JavaScript dei moduli principali e del nuovo file di test è stata controllata.
- **Non sono ancora stati eseguiti** la suite Node completa nel repository, il comando `npm run build` né un collaudo visivo sul telefono/browser. I controlli con dipendenze simulate non sostituiscono queste verifiche.

## Vincoli confermati e prossimo blocco
- Non creare immagini in questa fase. Vecchie illustrazioni restano archiviate e non vengono riutilizzate come nuove carte.
- Mantenere le navicelle, la progressione L1–L5, i Boss, i Personaggi e l'arena metallica 3D originale.
- La vittoria resta ancora determinata dalla distruzione dei vitali della madre: l'eventuale cambio dell'obiettivo verso le macchine sarà un intervento separato, non introdotto tacitamente.
- **Prossima nave: Corvo a Impulsi (`C03`)** e le sue dieci esclusive, incluse interferenze, silenziamenti e contromisure.
