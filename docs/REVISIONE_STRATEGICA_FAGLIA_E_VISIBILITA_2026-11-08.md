# Eclissi Stellare — Revisione strategica Faglia, informazioni e conseguenze reali

**8 novembre 2026 · repository unico `marcoteghini1988-ai/test7` · ramo `main`.**

## Problema rilevato e corretto

Nel duello ufficiale la formula del vitale avversario era custodita nel modello, ma il componente `OfficialBattle3D.jsx` invocava il suggeritore matematico **anche quando il vitale era ancora nascosto**. Mostrando automaticamente l'operazione valida, un giocatore poteva indovinare la firma senza usare la Scansione. Il motore IA già evitava in parte questo comportamento, creando un'asimmetria proprio quando il giocatore aveva la Carta Faglia.

Non è stata sostituita l'arena approvata o la formula delle 68 firme. È stato aggiunto il helper `src/tacticalIntelVisibility.js` e le sue verifiche:

- `visibleTacticalSignature(attacker,defender,vitalId)` restituisce **null** per un vitale non esposto e non scansionato; restituisce la firma soltanto dopo una Scansione registrata nello stato `attacker.seen` oppure l'esposizione autentica del sistema.
- `suggestedTacticalOperation(attacker,defender,vitalId,cards)` può proporre una formula soltanto se tale firma è visibile e 2/3 carte numeriche vere soddisfano il requisito.
- `OfficialBattle3D.jsx` usa ora lo **stesso controllo** sia quando il giocatore seleziona carte numeriche, sia quando cambia il sistema bersaglio, sia nel riepilogo dell'operazione. Cambiare bersaglio verso una firma nascosta azzera il suggerimento precedente. La Faglia con firma ignota mostra il messaggio **«FAGLIA · FORMULA IGNOTA: SCANSIONA O TENTA»** e permette un tentativo manuale, senza proporre operazioni segrete.
- `tacticalDuelAi.js` usa il medesimo helper, senza leggere firma nascosta per il proprio piano. Non interpreta il semplice possesso della Faglia come una Scansione.
- `ShipPhysicalVitals.jsx` continua a rappresentare visivamente le 4 parti fisiche **nelle posizioni originali**: lo stato può indicare «protetto», «scansionato», «esposto» o «distrutto» ma non rivela una firma nascosta.

**Limite tecnico:** queste sono regole di visibilità del client e dell'IA locale; il catalogo delle firme per modello è presente nel codice del gioco. **Non sono anti-cheat server-side** e non equivalgono a un server autorevole per il PvP online.

## Faglia: test sulle conseguenze dei quattro vitali

La Carta Faglia continua a richiedere 2/3 numeriche autentiche, il rispetto della firma e un solo utilizzo per battaglia. Per un vitale **non esposto** causa al massimo **5 HP**, lasciando inalterata la barriera. Una volta consumata, un'eventuale Faglia ripescata mostra «FAGLIA USATA» nei **cinque slot originali** e il pulsante resta disabilitato.

Sono stati verificati anche i collegamenti con la fisica dei sistemi:

| Sistema colpito attraverso barriera chiusa | Effetto reale del passaggio da 10 a 5 HP |
| --- | --- |
| **Motore** | Stato `damaged`, potenza degli armamenti nativi inferiore nel ciclo seguente tramite `gunEfficiency` |
| **Sistema armi** | Perdita di HP reali (già testata durante l'integrazione della Faglia); la penalità delle armi deriva dal medesimo `gunEfficiency` |
| **Generatore scudi** | `shieldRepairEfficiency` passa a **0,5**; una riparazione nominale di 20 HP diventa 10 senza creare nuova barriera |
| **Centralina** | `escortInterceptionEfficiency` passa da 1 a **0,85**: riduzione reale dell'intercettazione delle scudiere |

In caso di **Mutazione della Firma** sullo stesso vitale **già esposto**, una formula precedentemente valida può diventare errata e il colpo Faglia viene annullato; la carta resta consumata. La Contromisura programmata continua a bloccare gli attacchi compatibili. Il bersaglio nascosto può comunque essere colpito con un tentativo **manuale** se si indovina davvero la formula, ma il motore non la suggerisce.

La Faglia non rivela dati segreti, non conferisce bonus permanenti, non attraversa le Contromisure, non genera danni gratuiti alle barriere e non cambia l'esposizione dei vitali dopo il colpo. Le 24 speciali, le 5 in mano, le 52 numeriche e le 7 in mano restano intatte.

## Test, CI e voci aperte

- `src/tacticalIntelVisibility.test.js`: **68/68 firme** dei 17 modelli non rivelate prima della Scansione, rivelate solo dopo Scansione o esposizione, mai su vitali distrutti, mai inferite da bersagli o carte cambiate.
- `src/tacticalVulnerabilityRift.test.js`: motore danneggiato riduce il fuoco nativo successivo; coppia vera colpisce centralina prima della caduta degli scudi; generatore dimezza riparazioni; Mutazione e Contromisura fermano la Faglia; tentativo a formula ignota valido solo quando matematicamente corretto.
- `src/OfficialBattle3D.jsx`: suggerimenti controllati in tutti e tre i punti della plancia, avviso del bersaglio ignoto e Carta Faglia esausta non cliccabile.
- **Ultimo test del codice:** commit `f1e5aa840a24eb4b657f34b1c7c3cfe0c775b9ec`, [GitHub Actions 42465531163](https://github.com/marcoteghini1988-ai/test7/actions/runs/42465531163): **703/703** test di logica, build e preflight superati.

**Resta aperto:** collaudo grafico vero Android 9:16, bilanciamento della Faglia/5 HP, effetti visivi definitivi delle penetrazioni, passaggio di alcune modalità Poker storiche al duello simultaneo e PvP online server-authoritative. Niente modifiche alla plancia metallica approvata né alle ricompense reali in questo intervento.
