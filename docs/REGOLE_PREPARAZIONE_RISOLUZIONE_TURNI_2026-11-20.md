# Eclissi Stellare — preparazione e risoluzione dei turni (20 novembre 2026)

## Regola operativa confermata
- Un giocatore ha **30 secondi** per preparare fino a **tre carte**. Selezionare e spostare una carta non ne attiva l'effetto.
- Alla **terza carta**, la preparazione si conclude automaticamente: le tre carte si risolvono come un unico ordine.
- Con **zero, una o due carte** si può premere **PASSA · RISOLVI**, risolvendo le carte scelte, senza perderle.
- Alla **scadenza del timer**, le carte eventualmente preparate si risolvono. Se la selezione risulta invalida alla scadenza, si passa senza giocate per non bloccare la partita.
- Dopo la risoluzione viene avviato il conteggio di 30 secondi dell'avversario.
- Non si tratta di risoluzione simultanea dei due giocatori: i turni restano individuali e alternati.

## Audit tecnico sul ramo ufficiale
- `src/OfficialFleetBattle3D.jsx`: la mano conserva la selezione prima della risoluzione. Corretto PASSA, che prima ignorava le carte selezionate; aggiunto commit alla terza e recupero dell'ordine al timeout, anziché scartarlo.
- `src/fleetNext/combat.js`: `resolveFleetNextTurn` già elaborava un array di carte in un unico ordine. `timeoutFleetTurn` ora accetta un ordine preparato opzionale e, se valido, lo risolve prima di cambiare giocatore.
- `src/fleetNext/simpleEffects.js`: testi di aiuto aggiornati; corretta la descrizione obsoleta dell'Energia (la pila ha capienza illimitata e la rarità determina 1–4 cariche).
- Ordine già esistente nel motore: Terreno; effetti delle altre carte; abilità Energia; colpo della madre; Difese e Trappole in reazione; chiusura e prossima mano. Le carte a rilascio differito conservano la propria scadenza al turno previsto.
- `src/fleetNextTurnPreparation.test.js`: regressioni per assenza di effetti prima della conferma, due/tre carte, timeout con carte e timeout con ordine invalido.

## Punti che richiedono ancora progettazione
1. Le abilità già attive di **rigenerazione e veleno** continuano ad avanzare durante i 30 secondi tramite `advanceIndependentSupportTime`. Sono effetti persistenti preesistenti, non nuovi effetti delle carte scelte. Bisogna decidere se mantenerli in tempo reale o aggiornare anche questi soltanto alla risoluzione.
2. Alcune carte richiedono selezioni contestuali (bersagli, seconda unità, modulo da sacrificare, Pilota). Il terzo click conferma subito: l'interfaccia deve assicurare che le opzioni desiderate siano configurate **prima** del terzo click, altrimenti valgono le selezioni predefinite. Potrebbe servire una conferma contestuale senza aggiungere un'ulteriore azione di gioco.
3. L'azione speciale `sacrificeIndependentFleetSupport` resta immediata e non passa per le tre carte: va deciso se rientri nella preparazione, se consumi una delle tre giocate e quando si risolva.
4. `OfficialLiveBattle3D.jsx` utilizza il motore storico e non è stato modificato: l'uniformazione va effettuata solo dopo decisione esplicita di migrare quella modalità.
5. Il **Perforatore a Cascata** ha una meccanica progettata (danno in eccesso trasferibile consumando Energia Metallo) e durata di un turno, ma **danno base, rarità e costo preciso** sono ancora provvisori. Non inventare questi valori nel codice ufficiale fino a decisione o bilanciamento.

Non altera le 120 carte esclusive, le meccaniche dei componenti interni, le Carte Sistemi, i Terreni, le Fusioni, gli asset della plancia 3D o il PvP simulato.
