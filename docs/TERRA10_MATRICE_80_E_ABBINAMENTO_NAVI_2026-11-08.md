# Eclissi Stellare — Terra 10: 80 simulazioni con 16 equipaggiamenti reali

Data: 8 novembre 2026. Repository ufficiale: `marcoteghini1988-ai/test7`, `main`. Riferimenti: `src/firstBossProgression.test.js` e `src/officialFirstBossProgression.test.js`.

## Conclusioni verificabili
* **I primi 9 settori devono essere vinti** per ottenere i premi; la matrice costruisce lo scenario condizionale, non finge di aver superato quei combattimenti.
* 100 unità iniziali + 900 unità dai premi prima vittoria dei settori 1–9 = **1000 Polvere Stellare disponibili al massimo** senza acquisti o spese diverse, entro la capienza iniziale di 1500.
* Le navi effettivamente riscattate sono **N00**, **C01** (dopo il 3), **C02** (dopo il 6) e **C03** (dopo il 9). Nessuna rara, epica o leggendaria.
* Il costo totale di una comune a **L2/L3/L4** è **100/280/580**; il totale L5 è **1080**, escluso da questo campione perché richiede una fonte extra. L'audit precedente ha già verificato lo scenario alternativo L5 con **15 stelle e prima capsula realmente riscattata**; vedi `docs/PROGRESSIONE_12_BOSS_E_TERRA10_2026-11-08.md`.
* **9 crediti pacchetto** delle prime vittorie non sono nove carte scelte: il campione NON apre pacchetti né regala Scansione, Epici, Faglia, moduli, personaggi boss o mazzi numerici boss futuri.
* Il pilota iniziale `pilot_com_1` è presente in inventario a grado 1 e il mazzo speciale resta composto dalle 24 carte possedute. Nessuna risorsa reale o salvataggio utente viene alterato dal benchmark.

## Matrice IA contro IA (5 seed ciascuno: 17, 171, 2026, 4096, 8127)
V = vittorie giocatore; S = sconfitte; P = pareggi. La condizione di vittoria rimane il KO di **tutti e 4 i vitali** entro massimo 20 cicli.

| Nave disponibile | Livello 1 V/S/P | Livello 2 V/S/P | Livello 3 V/S/P | Livello 4 V/S/P |
|---|---|---|---|---|
| N00 | 0/5/0 | 0/5/0 | 0/5/0 | 0/5/0 |
| C01 | 0/5/0 | 0/5/0 | 0/5/0 | 0/5/0 |
| C02 | 0/4/1 | 0/4/1 | 0/4/1 | 0/4/1 |
| **C03** | **3/0/2** | **2/0/3** | **4/1/0** | **4/1/0** |

**Totale 80 duelli**: 13 vittorie, 49 sconfitte, 18 pareggi. La C03 L3 con 280 Polvere di spesa ottiene quattro vittorie su cinque; la C03 L4 con 580 di spesa quattro su cinque. La C03 L3 termina in media dopo **14,8 cicli** (tempo teorico dei cicli 14,8×38 s ≈ 9,4 min, senza conteggiare intro/animazioni aggiuntive).

## Criticità tecnica rilevata: il boss cambia modello secondo la nave del giocatore
Nel motore attuale, `chooseCampaignMotherRival` sceglie un rivale fra i modelli compatibili con la nave del giocatore. Di conseguenza, a Terra 10:

* Giocatore **N00, C01, C02** → modello madre del boss **C03**.
* Giocatore **C03** → modello madre del boss **C02**.

Il comandante boss Terra, la sua identità, arena e mazzo numerico rimangono invariati, **ma le firme dei vitali e gli armamenti della nave nemica cambiano assieme al modello**. Quindi il vantaggio osservato della C03 è **confuso con una variazione dell'avversario**: non equivale alla prova che C03 sia intrinsecamente più forte delle altre. Il modello resta stabile attraverso i cinque seed e i livelli della stessa nave, come verificato dal test.

**Conseguenza per il bilanciamento:** non aumentare o diminuire i danni del boss Terra sulla base di questa matrice senza prima decidere se il modello della nave boss deve essere **fisso per pianeta** o può cambiare per compatibilità. Qualunque modifica deve conservare il motore legacy, le 17 navi reali, i 42 armamenti, le firme autentiche, il boss riconoscibile e le arene uniche. Non sostituire grafiche o spostare la plancia.

## Lavoro ancora aperto
1. Confrontare un medesimo modello rivale per tutte le quattro navi, con esperimento controllato, senza entrare nel codice ufficiale fino a verifica di compatibilità e correttezza del duello.
2. Collaudare il percorso reale dei **settori 1–9** (non basta assegnare ipoteticamente le vittorie), l'ottenimento e l'apertura dei pacchetti, e un approccio tattico manuale.
3. Estendere la progressione premiata ai boss 2–12, rispettando tutti gli sblocchi veri, comprese le differenze fra settori canonici e ID planetari.

Test automatizzati: `src/firstBossProgression.test.js`. Pipeline conclusa: [GitHub Actions 42501402162](https://github.com/marcoteghini1988-ai/test7/actions/runs/42501402162) — **778/778 test**, build e preflight plancia riusciti; non costituisce un test Android reale.
