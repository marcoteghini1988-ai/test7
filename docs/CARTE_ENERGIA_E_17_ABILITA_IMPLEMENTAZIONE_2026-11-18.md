# Eclissi Stellare — implementazione delle Carte Energia e delle abilità uniche

> **Regola di bilanciamento aggiornata, 18 novembre 2026:** vantaggio **+25%**, svantaggio **−50%** sui danni di tutti gli attacchi delle navicelle nel combattimento HP, inclusi i colpi normali. I colpi leggeri conservano i resti frazionari. Questo aggiornamento sostituisce le ipotesi precedenti sui soli colpi speciali. Vedi [Vantaggio e resistenza elementale](./VANTAGGIO_RESISTENZA_ELEMENTALE_2026-11-18.md).

**18 novembre 2026 · repository ufficiale `test7/main`**

## Stato del codice

- 10 nuove **Carte Energia** generiche: `energy-plasma`, `energy-refrigerant`, `energy-cryogenic`, `energy-ionic`, `energy-mineral`, `energy-aerial`, `energy-radiant`, `energy-void`, `energy-metallic`, `energy-gravity`.
- Ogni carta aggiunge **una carica** del proprio elemento al reattore della madre. Le cariche restano tra i turni, massimo **4 totali**, massimo **4 copie della stessa carta** nel mazzo.
- Il caricamento avviene giocando materialmente la carta (occupa una delle **3 carte per turno**), non con monete o tempo gratuito.
- Il mazzo da **40** include Carte Energia tra le generiche. Si acquistano dal pannello mazzi con Crediti Stellari al prezzo provvisorio di una carta Comune. Aurora-0 riceve **2 copie iniziali di Energia Fulmine** per collaudare il meccanismo; le altre Energie sono acquistabili, non regalate.
- Ogni nave madre ha **esattamente una abilità**, classificata come `attack` o `effect`; non ne riceve una seconda al livello massimo o sbloccando il secondo elemento.
- L'abilità viene preparata dalla plancia, consumando **1–4 cariche tutte dello stesso elemento attivo**. Il secondo elemento, se sbloccato, può alimentare la **stessa** abilità, cambiando il tipo di colpo senza crearne un'altra.
- L'**Attacco Speciale** potenzia una **sola salva normale**, sfrutta il confronto elementale senza aggirare scudiere o difese, e non crea un secondo colpo.
- L'**Effetto Speciale** sostituisce l'attacco del turno e attiva un'azione concreta: difesa, disturbo, riparazione HP o blocco di una scudiera. Se la scudiera bersaglio non è disponibile, l'effetto di disabilitazione ripiega sul disturbo nemico.
- Rarità e gradi delle 170 esclusive sono conservati. Non vengono create nuove carte esclusive della nave; le abilità sono proprietà permanenti della navicella.
- In `elemental-special` il combattimento emette `visualKey` dell'elemento, nome, costo, categoria, potenza e contromossa: **solo metadati per le future animazioni 3D**, non VFX finali.
- Modificati `src/fleetNext/energyCards.js`, `src/fleetNext/elementalAbilities.js`, `src/fleetNext/rules.js`, `src/fleetNext/simpleEffects.js`, `src/fleetNext/combat.js`, `src/fleetNext/collection.js`, `src/fleetNext/nextDeckLoadout.js`, `src/FleetCollectionWorkshop.jsx`, `src/OfficialFleetBattle3D.jsx` e `src/OfficialFleetBattle3D.css`.
- Totale delle **schede catalogate con ID** ora **210**: 12 generiche Personaggio, 170 esclusive, 12 Boss, 6 tecniche e **10 Energie**. Le nuove 10 sono distinte dalle 170 già esistenti.

## Le 17 abilità definite

| ID | Navicella | Tipo | Abilità | Carte Energia necessarie | Effetto |
|---|---|---|---|---:|---|
| N00 | Aurora-0 | Effetto | Blackout Ionico | 2 | Disattiva una scudiera nel prossimo turno |
| C01 | Lince Solare | Attacco | Lancia Solare | 3 | Salva elementale potenziata |
| C02 | Vespa di Vetro | Effetto | Scudo Prismatico | 1 | Riduce il prossimo attacco nemico |
| C03 | Corvo a Impulsi | Effetto | Eco del Vuoto | 2 | Indebolisce il prossimo attacco nemico |
| C04 | Dardo Cremisi | Attacco | Dardo Ciclonico | 2 | Salva elementale potenziata |
| R01 | Falco Binario | Attacco | Martello Binario | 3 | Salva elementale potenziata |
| R02 | Manta Ionica | Effetto | Sovraccarico Manta | 3 | Disattiva una scudiera |
| R03 | Iride | Effetto | Rifrazione Vitale | 2 | Ripara HP della madre |
| R04 | Squalo del Vuoto | Attacco | Morso Abissale | 3 | Salva elementale potenziata |
| E01 | Nefelarca | Effetto | Nebbia Gelida | 2 | Indebolisce il prossimo attacco nemico |
| E02 | Vortiluce | Attacco | Vortiluce a Catena | 3 | Salva elementale potenziata |
| E03 | Fenice | Effetto | Cuore della Fenice | 3 | Ripara HP della madre |
| E04 | Orizzonte | Effetto | Baluardo di Orizzonte | 3 | Protezione contro il prossimo attacco |
| L01 | Eclisse Reale | Attacco | Giudizio Radiante | 3 | Salva elementale potenziata |
| L02 | Singolarità | Attacco | Frattura Gravitazionale | 4 | Salva elementale potenziata |
| L03 | Titano Ossidiana | Attacco | Impatto Ossidiana | 4 | Salva elementale potenziata |
| L04 | Arca Astrale | Effetto | Custodia Astrale | 4 | Ripara HP della madre |

## Passaggi reali del turno

1. Il giocatore pesca dalla **mano da sette** e seleziona fino a tre carte. Se una è Energia compatibile, vale un punto di carica consumabile.
2. Le cariche si mantengono tra i propri turni. Si possono giocare fino a tre Carte Energia nello stesso turno, ma il reattore non supera quattro cariche totali.
3. Quando la soglia della propria abilità è raggiunta, il giocatore preme il controllo **Attacco Speciale** oppure **Effetto Speciale** (unico per la propria nave); la scelta dell'elemento compare se la nave ne possiede due già sbloccati.
4. Alla conferma, il motore verifica che la carta sia stata effettivamente giocata e che ci siano abbastanza cariche dello **stesso elemento**. Consuma esattamente il costo; tentativi non validi non mutano la partita.
5. Si risolve l'attacco/effetto; il combattimento e gli scarti restano nella stessa partita, senza duplicare la salva o introdurre una nuova fase temporale.

## Cosa non è ancora definitivo

- I **valori HP**, i danni definitivi, la frequenza media di pescata e i vantaggi elementali **devono essere calibrati** con simulazioni del PvP prima di considerare il bilanciamento completato. Le quantità attuali sono una prima scala eseguibile.
- **Nessuna immagine finale delle 10 Carte Energia** è stata generata o inserita. I fronti attuali sono testo e simbolo, destinati a essere sostituiti mantenendo gli ID e le regole.
- I `visualKey` di ciascun elemento non sono ancora il lancio 3D delle armi: restano da produrre le animazioni con i portelli, i proiettili e l'impatto coerenti con lo stile approvato.
- La suite di regressione completa e la build del repository **non sono state eseguite in questa sessione**. Sono stati aggiunti test mirati in `src/fleetNextEnergyAbilities.test.js` e sono stati controllati sintassi e dati indipendenti delle abilità.
- Questa meccanica si applica soltanto al ruleset **HP ufficiale**. Nessun nuovo vantaggio gratuito viene introdotto nel vecchio combattimento.

## Regole permanenti

Conservare il repository unico `test7/main`, la plancia 3D metallica verticale 9:16, le sette carte in mano, tre carte massime per turno, trenta secondi, nave madre + massimo due supporti, PvP simulato per il momento, 10 esclusive per nave, fusioni rare solo dove previste e 10 affinità elementali. Nessuna vecchia carta rimossa deve ritornare per via di questi cambiamenti.
