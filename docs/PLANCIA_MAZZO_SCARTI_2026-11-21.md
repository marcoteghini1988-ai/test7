# Mazzo e scarti della plancia ufficiale

La plancia usa `FleetDeckPiles`: due pile di carte appoggiate sul piano del tavolo, scarti a sinistra e mazzo a destra. Lo spessore deriva dal numero effettivo delle carte; una posizione vuota mostra soltanto il segno inciso. Gli scarti mostrano l'ultima faccia e i bordi delle precedenti, usando gli asset delle carte reali.

## Inserimento del futuro dorso approvato

In `src/officialDeckBackArt.js`, sostituire `OFFICIAL_FLEET_DRAW_BACK=null` con il percorso dell'immagine approvata in `public/assets`. Il componente accetta anche `backSrc`, con precedenza al dorso del giocatore `side.deckBackPath`. Lo stesso dorso compare sulla pila e sul retro delle carte che si rimescolano. Il valore nullo conserva il cartoncino neutro provvisorio, senza imporre un nuovo stile definitivo.

Il dorso delle trappole coperte e i mazzi del renderer storico mantengono le proprie impostazioni.

## Rimescolamento effettivo

`recycleFleetDiscard` viene chiamato da tutti i nove percorsi di pesca del motore. Quando la pesca richiede carte e il mazzo è vuoto, gli scarti vengono mescolati con il generatore deterministico già usato dal combattimento. La pila degli scarti si svuota e la pesca prosegue dal nuovo mazzo, senza copie aggiuntive. Un mazzo non vuoto o gli scarti vuoti non attivano il recupero.

`side.deckShuffle` conserva una sequenza progressiva e uno snapshot delle carte trasferite per la sola presentazione. Non è una zona di carte giocabili. Il renderer anima per 1,6 secondi fino a otto carte rappresentative: si alzano dagli scarti, si voltano mostrando il dorso e ricompongono la pila. Poi torna a mostrare i conteggi finali reali, anche quando l'ultima carta riciclata è stata subito pescata. Ogni nuovo recupero avvia la sua animazione una volta sola; le preferenze di movimento ridotto vengono rispettate.

## Verifiche

`src/fleetDeckPiles.test.js` verifica conservazione delle copie, casualità deterministica, rimescolamento ripetuto, pescata di fine turno attraverso ESEGUI, mano parziale quando le carte non bastano, proiezione delle pile, facce reali e sostituzione del dorso.
