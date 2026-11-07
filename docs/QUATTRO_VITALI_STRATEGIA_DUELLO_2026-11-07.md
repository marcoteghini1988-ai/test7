# Eclissi Stellare — strategia dei quattro vitali
Stato verificato nel codice ufficiale `test7/main`, 7 novembre 2026. Il motore Poker compatibile conserva le sue logiche; le nuove regole qui si riferiscono al duello simultaneo 30 s + 8 s.

## Bersagli della nave madre
Quattro componenti reali e visualizzati in punti della scocca preesistenti:
- Motore (`engine`): influenza la potenza delle **armi native**, ma non invalida i calcoli numerici. KO impedisce nuove fusioni.
- Sistema armi (`weapons`): compromette la potenza delle **armi native** senza eliminare carte numeriche o firme.
- Generatore (`shieldGenerator`): alimenta la **riparazione della barriera**. A KO fa crollare lo scudo rimasto, che non può più essere riparato.
- Centralina (`command`): coordina le **scudiere**. Con HP ridotti intercettano meno; con 0 HP non intercettano, non possono fornire coperture tattiche, nuove fusioni o riparazioni scudiere. Non distrugge automaticamente le scudiere.

## Tre condizioni funzionali
I valori correnti sono `10 HP` per sistema; le soglie si riferiscono alla frazione di HP massimi (`fleetSystems.systemState`) e quindi funzionano anche se un modello ha HP diversi.

| Parte | Integra >50% HP | Danneggiata (1–50% HP) | KO (0 HP) |
|---|---|---|---|
| Motore | nessuna penalità | −10% danno armi native | −25% danno armi native, blocco nuove fusioni |
| Armi | nessuna penalità | −20% danno armi native | −50% danno armi native |
| Generatore | riparazione normale | riparazione −50% | collasso barriera e riparazione vietata |
| Centralina | intercettazioni normali | intercettazioni scudiere −15% (anche copertura e fusione) | intercettazioni a zero, coperture e nuove fusioni bloccate |

I fattori Motore × Armi si combinano sul pacchetto reale calcolato dalle armi native, con arrotondamento deterministico; non toccano lo stesso valore due volte e non generano proiettili. Le scudiere sottraggono **HP effettivi** quando intercettano. Il KO non può essere aggirato da un potenziamento o da un beneficio puramente grafico.

## Scelta strategica
- Se il nemico ha **due scudiere**, colpire prima **Centralina** può azzerare la loro protezione. Tuttavia la nave madre continua a sparare.
- Contro armamenti molto potenti, **Armi** riduce fino al 50% il fuoco nativo, ma non blocca il calcolo numerico del nemico.
- Se il nemico punta sulle **fusioni**, **Motore** interrompe nuovi agganci e riduce il fuoco nativo del 25% al KO.
- Se il nemico **ripara frequentemente**, **Generatore** rende impossibili le riparazioni future, e al KO collassa anche la barriera.

## Come si espone un vitale
La barriera iniziale vale 60 HP nei valori correnti. Le soglie per aprire progressivamente slot di esposizione sono 45, 30, 15 e 0 HP. Il giocatore sceglie quale vitale esporre; una combinazione matematica o Poker deve rispettare la firma reale del vitale per danneggiarlo. Un bersaglio non esposto/protetto non prende danni da una formula errata. Quattro vitali KO definiscono la distruzione della madre (salvo doppio KO simultaneo, che è pareggio).

## Modifiche apportate e verificate
- `src/tacticalArmamentBalance.js`: usa le stesse soglie danneggiato/KO del sistema storico, applicando i fattori a Motore/Armi nel duello simultaneo.
- `src/fleetSystems.js`: `escortInterceptionEfficiency` espone 1/.85/0 in base alla salute della Centralina.
- `src/simultaneousDuelEngine.js`: applica la penalità su intercettazione nativa, Copertura Tattica e fusioni; logga il passaggio effettivo del vitale a danneggiato/KO.
- `src/tacticalVitalConsequences.js`: fonte unica per i testi delle conseguenze attive e gli avvisi di cambio stato.
- `src/OfficialBattle3D.jsx`: descrizioni consultabili nelle **Regole** esistenti. Nessuna modifica alle coordinate della plancia o agli asset.
- Test: `src/tacticalVitalConsequences.test.js`, `src/tacticalVitalConsequencesStates.test.js`. Verificano 17 navi, quattro stati, cap HP, scudiere, fusioni, log e firme.

## Punto di bilanciamento ancora aperto — NON modificato
Attualmente il colpo di precisione standard ha base `10` danni e ciascun vitale standard ha `10 HP`. **Un calcolo valido non intercettato può quindi mandare KO un vitale intatto in un solo colpo**, saltando lo stato intermedio. La penalità da 1–5 HP ha effetto quando l'attacco è parzialmente assorbito o mitigato, e nelle configurazioni con HP maggiori.

Per fare sì che il danno parziale diventi una parte regolare e importante della strategia, il prossimo passo è **bilanciare danni di precisione e HP dei vitali** tenendo conto di difficoltà della formula, bonus, scudiere, massimo 20 cicli e identità dei boss. Non alterare silenziosamente valori precedenti finché non è definito un criterio coerente e testato.

**Nota:** la grafica fisica degli scafi resta affidata ai componenti recuperati `ShipSkin` e `Engine`; il presente documento tratta esclusivamente conseguenze tattiche e logiche.
