# Eclissi Stellare — Matematica 3D (React / Vite)

## Versione
Revisione basata **sulla plancia 3D originale R12**, non sull'app HTML autonoma 2.0 e non sul redesign React 2.1. Il progetto resta React/Vite e contiene `src/`, `public/`, `package.json`, `index.html` (solo punto d'ingresso Vite).

## Regole attive
- Mazzo francese standard: 52 carte, quattro semi ♥ ♦ ♣ ♠. A=1, J=11, Q=12, K=13. Nessun Jolly nel mazzo di base.
- Tre obiettivi matematici variabili e non generati in base alla mano. Addizione e sottrazione sempre presenti, moltiplicazione e divisione si alternano.
- Risolvi un obiettivo esattamente con 2–4 carte sul banco, anche riutilizzando le carte già presenti. Viene visualizzata la formula calcolata e un solo attacco per turno.
- Danni base: +10, −12, ×16, ÷20; +2 HP per ogni carta oltre le prime due (massimo quattro). Eventuali potenziamenti della nave e del pilota possono modificare i danni finali.
- I semi non attivano bonus segreti nel combattimento matematico. Le armi restano parte della scenografia e della progressione.
- Tre bersagli disponibili fin dal primo settore. La difficoltà è data dalle carte disponibili e dalla gestione delle risorse.
- Cambio fino a tre carte con le penalità cumulative già presenti: +3 HP al nemico per la prima, −3 secondi al turno successivo per la seconda, −3 HP propri per la terza; sblocchi e abilità preesistenti possono modificarne i costi.
- IA: seleziona realmente carte utilizzabili dal proprio mazzo e da quelle sul banco condiviso, poi può attaccare solo con una formula valida; la probabilità di esecuzione dipende dal settore.
- Campagna, sfide quotidiane e combattimenti passano dal ramo matematico nella plancia 3D. Le vecchie modalità Poker non sono selezionate come sistema di combattimento attivo.

## Installazione su StackBlitz / GitHub
1. Fai una copia del repository prima di sostituirlo.
2. Estrai questo archivio e sostituisci **tutto il contenuto** del repository (non creare una sottocartella aggiuntiva).
3. In StackBlitz attendi l'installazione delle dipendenze, quindi avvia `npm run dev`.
4. Per la versione compilata: `npm run build`.

`index.html` è necessario a Vite; il gioco è un'app React e non un HTML autonomo.

## Stato delle verifiche
- **Superati:** 9 test automatici sul motore matematico con Node (`npm run test:combat`), controllo sintattico di 74 sorgenti JS/TS/JSX/TSX e integrità del pacchetto.
- **Non eseguiti qui:** `npm run build` e test grafico su un telefono/StackBlitz. Il registry npm non è raggiungibile da questo ambiente.
- **Compatibilità storica:** nei sorgenti restano moduli e funzioni legacy non attivi, perché la loro cancellazione fisica richiederebbe un refactoring completo del monolite `App.tsx` e dei riferimenti di progressione. La modalità di combattimento attiva non applica figure Poker. Non considerare la rimozione del codice legacy ancora completata.
- Dopo la prima installazione sono indispensabili prove reali di partita completa, salvataggi e campagna; test automatici e parsing non bastano a garantire l'assenza di difetti in gioco.
