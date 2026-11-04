# Passo 7B — evoluzioni delle rare

Falco Binario, Manta Ionica, Iride e Squalo del Vuoto hanno cinque configurazioni visive ciascuna. Si provano dal selettore **Flotta**, dove livello, HP e motori della carta coincidono con quelli della nave schierata.

| Nave | Profilo delle protezioni | Motore × |
| --- | --- | --- |
| Falco Binario | Ali con derive a lame sovrapposte | Dal livello 3 |
| Manta Ionica | Rinforzi curvi che seguono le ali | Dal livello 3 |
| Iride | Scudi sfaccettati su entrambe le ali | Dal livello 3 |
| Squalo del Vuoto | Placche larghe e pinne corazzate | Dal livello 1 |

Il livello 1 usa la scocca di base. Il livello 2 aggiunge le placche. Il livello 3 introduce rinforzi esterni e supporti corazzati per le armi. Il livello 4 aggiunge protezioni attorno ai propulsori e il livello 5 estende le derive e gli alloggiamenti delle armi. Le due viste riusano gli sprite e hanno punti di attacco distinti. Il danno ai propulsori coinvolge anche le nuove protezioni attraverso le maschere esistenti.

## Verifiche

- Verificate tutte le 20 combinazioni di nave e livello nel selettore. Squalo del Vuoto passa da 261 HP a livello 1 a 435 HP a livello 5, con tre motori a ogni livello.
- Duello tre contro tre a livello 5 con tutte le rare. Sei sprite caricati, 16 letture dei motori senza sovrapposizioni. Le carte delle rare schierate dal giocatore coincidono con sprite, rinforzi, armi e motori effettivi.
- 10 ♥ − A ♣ = 9. Batteria Gemella ha sparato dieci proiettili alternando le due bocche per cinque colpi ciascuna. La raffica complessiva ha inflitto 77 danni alla Sottrazione di Squalo del Vuoto, da 145 a 68 HP. Gli altri due motori sono rimasti a 145 HP. Errore massimo di partenza e arrivo dei colpi di Batteria Gemella inferiore a 0,001 unità della plancia.
- Build TypeScript/Vite, 88 test e preflight riusciti.
