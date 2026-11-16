# Eclissi Stellare — checkpoint riprogettazione carte 16 novembre 2026

## Richiesta corrente
- Rimuovere dal **catalogo attivo** tutte le vecchie carte non-Personaggio e ridisegnarle razionalmente.
- Conservare **tutte** le carte Boss e Personaggio, compresi i rispettivi sblocchi e carte possedute.
- Realizzare il nuovo set di 10 carte esclusive per ciascuna delle 12 navicelle principali; immagini **solo dopo** codice e regole.
- Spostare il peso strategico del combattimento verso macchine e moduli, senza introdurre una condizione di vittoria non ancora definita.
- Operare direttamente su `marcoteghini1988-ai/test7`, ramo `main`; non creare copie di gioco o modificare la grafica 3D approvata.

## Sorgente di progetto recuperata
`Eclissi_120_Carte_Esclusive_Proposta_v1.html`, 16 novembre 2026.
Le 120 schede comprendono: 34 Attacco, 19 Difesa, 17 Tattica, 10 Trappola, 12 Moduli utilità, 13 Moduli d'arma, 3 Fusioni, 12 Personaggi.
Ogni nave ha 6 definizioni a L1 e 1 ciascuna a L2, L3, L4, L5.
Le regole includono moduli montabili con integrità, attacchi preparati, bersagli validi, costi, reazioni e supporti.

## Lavoro effettivamente scritto su GitHub
- `src/fleetNext/retiredLegacyCardsV2.json`: manifest degli ID da ritirare. 238 generiche e 112 esclusive, 350 in tutto.
- `src/fleetNext/redesignProposals/group01.json`–`group04.json`: 120 nuove definizioni con ID `nx-...`, nome, rarità/tipo da definire, livello, effetto testuale, stato `design_requires_logic`. Nessuna immagine.
- `src/fleetNext/redesignRegistry.js`: 12 gruppi, 120 definizioni, 108 nuove non-Personaggio, 12 referenze a Personaggi esclusivi già presenti.
- `src/fleetNextRedesign.test.js`: 3 controlli strutturali e di conservazione.
- Le 12 nuove voci Personaggio **non** sostituiscono le carte esistenti: il registro le collega a `ex-<ship>-01`. Restano anche gli altri 5 Personaggi delle navi varianti e i 12 Personaggi generici. Boss: pianeti 1, 2, 3, 6, 7, 8, 9, 11, 14, 17, 19 e 20.

## Stato da non confondere
**Le vecchie 350 carte NON sono ancora state rimosse dal catalogo di combattimento e i 108 nuovi effetti NON sono ancora eseguibili.**
Si sono inserite in codice le definizioni per il lavoro successivo, senza compromettere il gioco corrente.
Non dichiarare le carte attive, né produrre immagini, finché il codice non implementa esattamente ogni effetto.

## Ordine tecnico successivo (obbligatorio)
1. Definire il nuovo mazzo generico giocabile e i comandi d'attacco/difesa/macchina, senza bonus o testi fittizi.
2. Aggiungere nel motore di battaglia esecutori per moduli montati (slot arma/utilità, 2 integrità, distruzione), attacchi mirati, preparazione, trappole, costi e condizioni delle 108 carte nuove.
3. Scrivere e testare una migrazione idempotente di mazzi/collezioni per i 350 ID obsoleti: **non cancellare** crediti, trofei, acquisti, ricompense o progressione.
4. In un cambio controllato, rimuovere i 350 vecchi ID dai cataloghi attivi, attivare solo le carte implementate, aggiornare Shop, preset, gioco/IA, asset checker e test che citano gli ID rimossi.
5. Eseguire `npm run preflight`, `npm run verify:logic`, `npm run build`, verificare visivamente arena mobile; solo dopo creare immagini.
6. Condizione di vittoria: il motore oggi vince distruggendo tutti i vitali della madre. Il riferimento dell'utente a spostare l'«obiettivo dalle navicelle alle macchine» non definisce ancora il criterio di fine partita: evitare una modifica arbitraria.

## Verifica 16 novembre 2026
Il run GitHub Actions `43940841537` ha superato `preflight` e 1270 test su 1271. I 3 nuovi test del redesign sono passati.
Resta un test già fallito in precedenza: `approvedFleetFronts.test.js` per sovrapposizione testo in `gen-079`. La compilazione `build` non è stata eseguita perché la verifica logica ha fallito.
