# Eclissi Stellare — Punto 31: mazzi numerici boss (nuovo duello)

**Data:** 6 novembre 2026. **Repository:** `marcoteghini1988-ai/test7`, ramo `main`.

## Decisione: conservare la progressione originale
Non equiparare tutti i mazzi a un massimo di 9. Il codice storico in `src/App.tsx` distingue:
- **4 comuni** (Gaia, Tharsis, Anelli di Crono, Sentinella Ionica): 1 abilità, livelli **1–3**.
- **5 rari/super rari** (Afrodite, Leviatano, Ombre, Idra, Generatore): 2 abilità, livelli **1–6**.
- **3 leggendari** (Risonanza, Nucleo Magmatico, Sovrano): 3 abilità, livelli **1–9**.

Totale: **12 mazzi e 23 abilità**, non 36. Ogni abilità ha **tre gradi**. La prima cresce ai livelli 1/2/3, la seconda si apre e cresce ai 4/5/6, la terza ai 7/8/9. Alla crescita del livello non si azzera né si sostituisce l'abilità già acquisita.

Non cambiano ID originali, inventario `eclissi_deck_inventory`, selezione `eclissi_selected_deck`, costi/sblocchi dello Shop, né la grafica preesistente. Il mazzo neutro non ha passive. Un solo mazzo numerico equipaggiato per battaglia; nessuna capacità si trasferisce ad altri mazzi.

## Catalogo e valori L1/L2/L3 *della singola abilità*

| Mazzo | Grado 1→2→3 | Abilità | Effetto nel duello nuovo |
| --- | --- | --- | --- |
| **Gaia**, max L3 | 4/6/8% | Baluardo terrestre | Scudo madre iniziale e massimo aumentato una volta a inizio battaglia |
| **Tharsis**, max L3 | 3/5/7% | Pressione marziana | Danno aumentato nei successivi colpi reali sullo stesso vitale |
| **Afrodite**, max L6 | 13/11/9 s | Ricambio armonico | Ricarica ridotta del ricambio numerico, disponibile solo con mano davvero bloccata |
| | 5/8/11% | Sintesi curativa | Bonus alla carta reale Riparazione Scudo, sempre soggetta allo stato del generatore |
| **Anelli di Crono**, max L3 | 8/12/16% | Primo anello | Riduzione del primo impatto effettivo sulla madre, una sola volta |
| **Sentinella Ionica**, max L3 | 15/25/35% | Isolamento ionico | Durata ridotta della ionizzazione subita, quando realmente inflitta |
| **Leviatano**, max L6 | 4/6/8% | Marea del riciclo | Primo attacco dopo che gli scarti numerici sono stati rimescolati (non prima) |
| | 3/5/7% | Profondità tattica | Bonus di danno sui calcoli validi a tre carte |
| **Ombre**, max L6 | 5/8/11% | Potenza disperata | Bonus al danno quando la madre ha uno scudo pari o inferiore al 35% |
| | 4/6/8% | Oscurità terminale | Bonus contro un vitale avversario se due propri vitali sono KO |
| **Idra**, max L6 | 3/5/7% | Precisione criogenica | Bonus al tiro basato su divisione matematica valida |
| | 4/6/8% | Teste alternate | Bonus quando si alternano colpi effettivi su vitali nemici differenti |
| **Generatore**, max L6 | 15/25/35% | Schermatura instabile | Durata ridotta di ionizzazione e corrosione subite |
| | 10/20/30% | Accumulo energetico | Bonus percentuale sulla Sincronia guadagnata da veri eventi, cap invariato a 100 |
| **Risonanza**, max L9 | 4/6/8% | Armi armoniche | Bonus alternando l'arma effettivamente utilizzata fra impatti |
| | 3/5/7% | Frequenza multipla | Bonus se il calcolo usa almeno due semi numerici diversi |
| | 3/5/7% | Sinfonia di flotta | Bonus se **madre e scudiera** partecipano al medesimo tiro |
| **Nucleo Magmatico**, max L9 | 6/9/12% | Risonanza termica | Bonus ogni terzo colpo reale contro lo scudo madre |
| | 3/5/7% | Corrosione ardente | Bonus ai colpi armati con una vera carta Corrosione |
| | 4/6/8% | Forgia moltiplicatrice | Bonus sui colpi validi con moltiplicazione |
| **Sovrano**, max L9 | 8/12/16% | Ultimo presidio | Riduce il danno subito quando resta vivo un solo vitale |
| | 4/6/8% | Vuoto difensivo | Riduce i danni alla madre quando il suo scudo è ≤25% |
| | 4/6/8% | Supremazia | Potenzia il prossimo tiro efficace dopo un vero KO di un vitale nemico |

**Non si introduce una rianimazione di vitali KO.** Questo adattamento cambia l'effetto legacy di Sovrano, che ripristinava HP generici prima dell'esistenza dei quattro vitali. I vecchi effetti di tempo, Jolly, Etere e Poker non vengono trasferiti automaticamente.

## Vincoli della nuova battaglia
- Due mani indipendenti: **7 numeriche** e **5 speciali**. Il mazzo numerico resta composto da **52 carte autentiche**, con riciclo degli scarti solo quando necessario.
- Una passiva **non può** generare attacchi, munizioni, HP dei vitali, carte o consumabili e non può attivare fusioni senza una carta speciale.
- Bonus offensivi valutati all'impatto, solo dopo validazione del calcolo e della firma; si applicano al danno in ingresso alle protezioni reali. La soglia massima cumulativa delle passive offensive è **+30%** e quella riduttiva è **−35%**, provvisorie.
- Il primo colpo di Crono viene consumato solo quando la madre subisce vero danno; colpi fermati interamente dalla scudiera non lo consumano.
- I contatori delle sequenze si aggiornano all'impatto, non alla sola pressione del pulsante. Il riciclo non può retroattivamente potenziare un colpo lanciato prima della rimescolata.
- La Sincronia bonus di Generatore si calcola solo su guadagno effettivamente accreditato e non supera 100.
- Il bonus Afrodite è soggetto al generatore: a metà vita la cura si dimezza, a zero è impossibile.
- L'IA utilizza lo stesso sistema. Nei settori boss della campagna (10,20,...,120) riceve il mazzo del pianeta corrispondente; altrimenti il mazzo avversario è neutro.
- Un effetto nuovo non sovrascrive i dati di salvataggio dei mazzi preesistenti. La versione legacy multi-madre rimane separata finché non viene migrata.

## File implementati
- `src/bossNumericDecks.js`: catalogo, gradi, inizializzazione, moltiplicatori, memoria reale degli impatti, supporti, status e Sincronia.
- `src/mathDuelEngine.js`: attivazione dei due mazzi e gestione degli status post-impatto.
- `src/MathDuelBattle.jsx`: passa il mazzo posseduto/equipaggiato, assegna il mazzo ai boss IA, applica i moltiplicatori all'arrivo dei colpi e mostra il nome del mazzo.
- `src/battlePacing.js`: ricarica numerica di Afrodite.
- `src/specialSupport.js`: Riparazione Scudo amplificata solo quando viene giocata una vera speciale.
- `src/App.tsx`: collegamento al salvataggio e allo Shop preesistenti.
- `src/ShopModal.jsx`: descrizioni del nuovo sistema e visibilità dei gradi sbloccati.
- `src/bossNumericDecks.test.js`: regressioni su livelli, costi effettivi, difese, status, frequenze, mazzo neutro e colpi realmente riusciti.

## Da verificare con test reali
Le percentuali sono **provvisorie**. Verificare con `npm run verify:logic`, `npm run build`, `npm run preflight`; testare inoltre mano a 7+5, riavvio/salvataggi, interfaccia 9:16 e boss IA su smartphone. Questi controlli non equivalgono a una conferma di giocabilità fino alla prova manuale. La grafica e l'audio definitivi restano rinviati.

**Prossimo lavoro:** bilanciamento empirico delle 23 abilità; mantenere il repository **test7/main** senza copie.
