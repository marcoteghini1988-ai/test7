# Eclissi Stellare — Io: verifica delle tre fasi e delle contromisure

**Data:** 9 novembre 2026. **Repository ufficiale:** `marcoteghini1988-ai/test7`, ramo `main`.

## Scopo e vincoli

L'obiettivo è capire il rapporto fra i bonus del **Nucleo Magmatico (Io, settore 110)**, il danno veramente subito e la capacità di difendersi con carte possedute. Non sono cambiati i quattro vitali, le firme matematiche, la potenza delle armi, i mazzi 52/24, la plancia metallica 9:16, le dodici madri canoniche, l'arena, la progressione, i salvataggi o le ricompense.

Il boss mantiene la sequenza **Carica → Eruzione (+10% sul pacchetto nativo) → Raffreddamento (−10%)**; è pubblica e deterministica, una fase per ciclo.

## Verifica 1 — 20 duelli con controprova per ciclo

Il test aggiunto a `src/officialIoDefensiveTiming.test.js` esegue **10 seed con mazzo starter** e **10 seed con mazzo speciale da 109 crediti/pacchetti precedenti**. I 109 settori precedenti sono *ipotizzati vinti*, le carte però sono estratte tramite il percorso reale `claimFirstWinSpecialPack → openSpecialPack → equipSpecialDeck`. Nave L03 L5 assunta già ottenuta e acquistata; il pilota è il comune iniziale L1.

A **ogni ciclo** si sigillano gli ordini IA autentici di entrambe le parti e si risolve il combattimento reale; una seconda risoluzione sulla **copia dello stesso stato con gli stessi ordini** disabilita soltanto `bossExclusive`. La differenza misura il contributo istantaneo del potere magmatico senza confonderlo con mazzi, piloti e bersagli. La copia non aggiorna la partita o alcun inventario.

| Mazzo | Fase | Cicli osservati | Differenza nel pacchetto armi Io | Differenza danno reale barriera | HP assorbiti da guardie barriera | HP riparati |
|---|---|---:|---:|---:|---:|---:|
| Starter | Carica | 46 | 0 | 0 | 0 | 0 |
| Starter | Eruzione | 43 | +105 | **+12** | 0 | 0 |
| Starter | Raffreddamento | 39 | −104 | 0 | 0 | 0 |
| Pacchetti | Carica | 52 | 0 | 0 | 92 | 140 |
| Pacchetti | Eruzione | 48 | +103 | **+13** | 100 | 184 |
| Pacchetti | Raffreddamento | 46 | −117 | −24 | 49 | 147 |

**Lettura corretta:** la differenza sul pacchetto è *prima* di scudiere, guardie, altri fattori e HP residui; non equivale a danno ricevuto. Quando la barriera è già a 0, il potere può potenziare la salva senza infliggere HP aggiuntivi. Gli HP riparati sono cure autentiche dopo aver giocato le relative Carte Speciali, non vita gratuita.

La diagnostica registra anche gli assorbimenti precisione e le contromisure ai vitali: nel campione con pacchetti si sono osservate **4 precisioni respinte da Contromisure**; le riduzioni `tactical-cover` della precisione vanno interpretate separatamente dalle guardie della barriera. Le fasi non alterano direttamente la formula matematica di precisione.

## Verifica 2 — 40 incontri completi con/senza potere magmatico

Per ciascun mazzo si risolvono dieci duelli ufficiali con Io integro e dieci con il solo potere esclusivo disattivato nella copia. Armi, IA, arena, semi, mazzo numerico boss e avversario restano invariati; gli ordini possono però *divergere nei cicli successivi* in risposta agli HP cambiati. Per l'isolamento matematico rigoroso valgono i confronti per ciclo della sezione precedente.

| Mazzo | Potere magmatico | Vittorie giocatore IA | Sconfitte | Pareggi | Cicli complessivi |
|---|---|---:|---:|---:|---:|
| Starter | Attivo | 3 | 5 | 2 | 128 |
| Starter | Disattivato | 2 | 5 | 3 | 130 |
| Pacchetti | Attivo | 6 | 3 | 1 | 146 |
| Pacchetti | Disattivato | 6 | 3 | 1 | 145 |

**Conclusione:** in questo campione non emerge un'evidenza che il +10% di Eruzione renda il boss eccessivamente potente. Il contributo alla barriera è relativamente piccolo; restano importanti il pacchetto nativo ordinario e le precisioni ai vitali, che non sono modificati direttamente dalla fase. Con mazzo evoluto i due casi ottengono risultati identici sui dieci seed. È un'indicazione diagnostica, non una prova definitiva di bilanciamento umano.

## Anomalia concreta corretta (solo testo)

Il registro di combattimento indicava `Eruzione +10% (+X HP effettivi)`, anche quando `X` rappresentava soltanto l'incremento *prima delle difese*. Non era corretto presentarlo come HP effettivamente perduti.

Ora il registro specifica: **`+X HP al pacchetto nativo, prima di intercettazione e difese; non danno garantito`**. Non è stata modificata la formula o il danno dell'arma. La suite `src/tacticalFinalFiveBosses.test.js` verifica anche il nuovo messaggio.

## Stato del collaudo

- Nuova telemetria per fase e controprova per ciclo.
- Nuova comparazione di 40 scontri completi.
- Registro Eruzione corretto senza toccare valori o grafica.
- Ultima pipeline confermata: [GitHub Actions 42539458901](https://github.com/marcoteghini1988-ai/test7/actions/runs/42539458901), **815/815 test superati**, build e preflight riusciti.

**Ancora aperto:** playtest manuale su Android 9:16, verifica della leggibilità di fase/armi/bersagli, conferma delle decisioni umane sulle carte e delle durate percepite, confronto con gli equipaggiamenti effettivamente posseduti nei salvataggi del giocatore.

**Prossimo punto:** testare la leggibilità delle minacce e il timing di Contromisura/Scansione/Riparazione nella plancia ufficiale, mantenendo le coordinate e l'asset grafico invariati. Non alterare il bilanciamento di Io senza evidenza ulteriore.
