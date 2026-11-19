# Regola ufficiale della pila Energia — Eclissi Stellare

**19 novembre 2026.** Decisione aggiornata del progettista: **nessun limite alle Carte Energia accumulabili nella pila**. Sostituisce le vecchie descrizioni che parlavano di una capienza di quattro.

## Il funzionamento
1. **Un unico slot Energia per giocatore:** è una pila di Carte Energia che possono avere elementi diversi. Non aggiungere altri slot per aumentare la capacità.
2. Quando il giocatore gioca una Carta Energia valida, essa **entra nella pila** e viene rimossa dalla mano. La pila resta presente **fra turni consecutivi** e può accumularsi senza un numero massimo.
3. Le Carte Energia nella pila **non sono ancora negli scarti**. Solo l'utilizzo effettivo da parte di una Speciale, Arma o altra meccanica autorizzata consuma quelle carte e le trasferisce negli scarti, **una volta sola**.
4. Se è attiva un'abilità della nave madre con un costo di 1, 2, 3 o 4 Energie, si spendono solo quelle richieste, dell'elemento corretto; **tutte le altre rimangono nella pila**.
5. La pila non ha limite, ma il gioco conserva **il limite di tre Carte giocabili per turno** e le regole di costruzione del mazzo (attualmente massimo quattro copie di ogni Carta Energia specifica). Non confondere il limite di copie nel mazzo con la capienza della pila.
6. Le cariche generate da passive dei supporti senza una vera Carta Energia vengono sommate per il funzionamento delle abilità, ma **non inventano carte fisiche** né generano duplicati negli scarti.

## Esempi
- Gioco 2 Carte Energia in un turno: **2 Carte Energia nella pila, 0 negli scarti**.
- Termina il turno e gioco 3 Carte Energia in quello successivo: **5 Carte Energia nella pila**, sempre senza scarti di quelle carte.
- Attivo una Speciale con costo 2 dello stesso elemento: **3 carte restano nella pila, 2 vanno negli scarti**.
- Se la pila contiene 10 Energie, **tutte e 10 possono rimanere** finché non sono usate: non esiste un limite della pila.

## Implementazione
- `src/fleetNext/energyCards.js` definisce capacità illimitata e costo massimo di una singola Speciale separato.
- `src/fleetNext/elementalAbilities.js` gestisce `side.energyPile` e trasferisce le Carte Energia fisiche negli scarti **al consumo**.
- `src/fleetNext/combat.js` conserva la pila da un turno all'altro e non scarta le Energie semplicemente per la giocata.
- `src/OfficialFleetBattle3D.jsx` non presenta un limite di capienza e mantiene il contatore Energia. Le immagini e il rendering fisico delle carte impilate sono rinviati alla fase Work.

**Applicazione al Mortaio Magmatico:** consuma **solo Energia Fuoco**. Le altre Energie non vengono tolte alla madre. Per ogni Energia Fuoco effettivamente consumata il Mortaio genererà un colpo autonomo; questa parte del Mortaio rimane da implementare dopo il bilanciamento dei danni.

[Regole del Mortaio](./MORTAIO_MAGMATICO_ALIMENTAZIONE_ENERGIA_2026-11-19.md).
