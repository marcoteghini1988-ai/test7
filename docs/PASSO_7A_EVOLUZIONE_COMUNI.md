# Passo 7A — evoluzioni delle comuni

Aurora-0, Lince Solare, Vespa di Vetro, Corvo a Impulsi e Dardo Cremisi hanno cinque configurazioni visive ciascuna. Le carte-navicella sono accessibili nel selettore **Flotta**. La scelta del livello resta temporanea e serve al duello di prova.

| Livello | Modifica visibile |
| --- | --- |
| L1 | Scocca originale con le armi del modello |
| L2 | Due placche metalliche avvitate sulle ali |
| L3 | Rinforzi esterni sagomati per modello e supporti delle armi corazzati |
| L4 | Protezioni attorno ai propulsori. Il motore × compare su Corvo a Impulsi e Dardo Cremisi |
| L5 | Derive o scudi esterni aggiuntivi, alloggiamenti delle armi più larghi e rinforzo posteriore |

La carta e la battaglia condividono la stessa composizione SVG e gli stessi montaggi delle armi. La carta mostra la vista posteriore. La vista frontale in arena ha punti di ancoraggio calibrati separatamente. L’aspetto è composto dagli sprite già presenti e dai moduli vettoriali, con le maschere di danno applicate a entrambi. Le bocche di fuoco e il centro dei motori conservano le coordinate originali.

Ogni carta presenta nome, rarità, livello, numero di armi, semi, operazioni installate e HP massimi totali. Le statistiche provengono dal catalogo v0.1, che governa il duello. Le 17 carte sono consultabili nel selettore, con le evoluzioni fisiche applicate al primo gruppo di cinque comuni.

## Verifiche locali

- Consultate tutte le 25 combinazioni. Aurora-0 passa da 110 HP a L1 a 156 HP a L5, con due motori. Corvo a Impulsi passa da 176 HP e due motori a L3 a 288 HP e tre motori a L4. Dardo Cremisi passa da 170 a 282 HP nello stesso passaggio.
- Duello tre contro tre a L5 con i cinque modelli comuni. Sei sprite caricati, quindici letture dei motori senza sovrapposizioni. Per la flotta del giocatore carta e nave condividono sprite, livello, montaggi e moduli.
- 8 ♠ − 4 ♠ = 4 ha generato dodici proiettili ciascuno da W01, W05 e W06. Solo la Sottrazione di Dardo Cremisi è andata in KO, da 103 a 0 HP. Addizione e Moltiplicazione sono rimaste a 103 HP.
- Build TypeScript/Vite, 88 test e preflight riusciti.
