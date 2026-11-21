# Eclissi Stellare — simulazione SENZA deterioramento della nave madre

**Data:** 21 novembre 2026  
**Stato:** esperimento isolato su `test7`; **NON attivato nelle partite ufficiali**.  
**Motivazione:** nel progetto conta la strategia, non la rapidita del tocco.

## Modello testato

La perdita automatica di HP dovuta a tutti e tre i timer scaduti e'
**0 HP/s**, in tutte le rarita'. Non viene aggiunta una regola di morte
per timeout. **Per vincere bisogna ridurre gli HP della madre a zero
tramite colpi, carte e abilita di combattimento.**

Le tre scadenze individuali di **Arsenale, Centralina e Plancia** restano
diverse per nave madre come nel rapporto
`docs/PROVA_TIMER_TEMPO_GIOCATORE_210S_1PCT_2026-11-21.md`,
con l'ultimo componente al secondo **210 di tempo strategico proprio**.
Sono valutate quote fisse **15, 20, 25 secondi per turno personale**, senza
dipendere dai 6/17/26 secondi reali necessari a selezionare le carte.

Dopo le scadenze valgono ancora le penalita confermate:
- **Arsenale:** danno Carte Arma al 70% e riduzione slot Attacco 3→2;
- **Centralina:** perdite verso la madre per il 25% dei colpi intercettati;
- **Plancia:** niente scelta libera del primo supporto e slot Personaggio
  disattivato (Personaggi esclusi dai test numerici);
- **Generatore:** invariato, energia fisica 2/4 e raffreddamento.

La **nave madre non perde HP soltanto perche passa il tempo**.
Il giocatore puo vincere anche dopo tutte le scadenze se le carte
danno abbastanza danni.

### Implementazione sperimentale

In `src/fleetNext/componentTimerPacing.js`,
`advanceTimedComponents` accetta `drainFraction:0`, mantenendo attiva
la gestione delle scadenze. Il test
`src/fleetNextWeaponPacingMatrix.test.js` applica `drainFraction:0`
nel ramo isolato `calibration.noDeterioration=true`
assieme a `componentClockMode='strategy-per-turn'`.
La logica ufficiale e i suoi coefficienti NON sono stati sostituiti.

Un test dedicato parte con 775/1000 HP, fa scadere i tre componenti
al secondo 210 e porta il tempo strategico a 510 secondi:
**775 HP rimangono 775**, con tutti i tre componenti scaduti.

## Risultati comparativi

Il codice esegue gli stessi abbinamenti, mazzi e semi per ogni quota
con e senza deterioramento, nel nuovo risolutore.
**36 PvP e 24 campagne per scenario**, quote 15/20/25 e due varianti
= **360 partite**. Personaggi esclusi dai campioni, ma presenti nella
modalita generale del gioco. In campagna si usa un vero mazzo CPU.

| Quota strategica personale | HP perso dopo l'ultimo componente | Durata media PvP | Mediana PvP | PvP KO da carte | PvP pareggi al limite 50 round | Campagna media | Campagna pareggi |
|---|---|---:|---:|---:|---:|---:|---:|
| 15 s | 1% HP massimi / secondo strategico | 416 s | 391 s | 26/36 | 0/36 | 266 s | 0/24 |
| **15 s** | **nessuno** | **605 s** | **391 s** | **30/36** | **6/36** | **370 s** | **3/24** |
| 20 s | 1% HP massimi / secondo strategico | 372 s | 374 s | 18/36 | 0/36 | 238 s | 0/24 |
| **20 s** | **nessuno** | **613 s** | **391 s** | **30/36** | **6/36** | **373 s** | **3/24** |
| 25 s | 1% HP massimi / secondo strategico | 323 s | 323 s | 9/36 | 0/36 | 207 s | 0/24 |
| **25 s** | **nessuno** | **626 s** | **425 s** | **30/36** | **6/36** | **381 s** | **3/24** |

### Dove si bloccano gli incontri

Con deterioramento rimosso e quota 20 s, i **6 pareggi PvP**
sono distribuiti tra **3 Epici e 3 Leggendari**. Nessuna partita Comune
o Rara va in pareggio in questa matrice.

- Comune: media PvP **361 s**, 0 pareggi su 9.
- Rara: media PvP **332 s**, 0 pareggi su 9.
- Epica: media PvP **871 s**, 3 pareggi su 9.
- Leggendaria: media PvP **890 s**, 3 pareggi su 9.

I pareggi arrivano al limite tecnico attuale di
`FLEET_MAX_ROUNDS=50` round: in PvP simmetrico a 17 s/turno,
questo corrisponde a circa **1700 s (28:20)**.
Il tempo reale dipende dalla velocita dei turni, ma la fine per
round e' una condizione di gameplay e non e' sconfitta automatica
della nave per deterioramento.

La media di 613 s e' fortemente influenzata dalle partite che
arrivano al limite round; **la mediana di 391 s** descrive
meglio lo scontro tipico. Anche in campagna il
deterioramento rimosso comporta **3 pareggi su 24**.

### Indipendenza dalla velocita

Test supplementare su **120 scontri**:
2 quote (15/20 s) × 5 scenari di durata reale (17/17, 6/26,
26/6, 6/6, 26/26 secondi per turno) × 12 abbinamenti.
Un'asserzione verifica, seme per seme, che vincitore, numero
di turni, componenti salvi e causa di termine restino identici
a prescindere dalla rapidita.

Per ogni quota e ogni configurazione sono state rilevate
**7 vittorie A, 2 vittorie B, 3 pareggi**.
La durata complessiva reale cambia, **l'esito strategico no**.

## Verifiche tecniche

`npm run preflight`, `npm run verify:logic` e `npm run build`
sono passati su GitHub Actions:
**1.882 test riusciti, 0 fallimenti**.

Log consultabili con identificatori:
- `AUDIT_NO_DRAIN_COMPARISON`
- `AUDIT_NO_DRAIN_SPEED`

## Conclusione

Rimuovere il deterioramento elimina il rischio che la nave venga
sconfitta semplicemente per essere rimasta oltre 3:30:
l'unica eliminazione della madre e' il danno effettivo.
La strategia prevale e la velocita dei tocchi
non altera gli esiti nel confronto per semi.

**Resta pero un problema di stallo nelle rarita Epica e
Leggendaria** (6 pareggi PvP su 36 e 3 su 24 in campagna).
Cambiare semplicemente la quota temporale da 15 a 20 o 25
secondi non elimina questo problema.

**Prossima verifica consigliata:** tarare armi, resistenze, cura
e difese Epiche/Leggendarie per ottenere piu vittorie per danni
diretti, senza reinserire perdita HP automatica.
Se serve un limite massimo alla partita, studiare una
condizione di spareggio **legata alle decisioni strategiche**
e non alla velocita. Non modificare ancora in automatico
tutte le armi e non attivare il modello senza approvazione.

**Nessuna modifica alla plancia, alle immagini e ai valori
live di combattimento.**
