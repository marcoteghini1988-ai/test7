# Eclissi Stellare — bilanciamento candidato, 21 novembre 2026

**STATO: CANDIDATO, NON VALORI DEFINITIVI DA STAMPARE.**
Il modello e' stato verificato in test automatici sul repository `test7` (branch `main`).
Le statistiche seguenti non devono essere confuse con il funzionamento attuale
della plancia ufficiale: il nuovo attacco della madre e i tre timer non sono
ancora stati attivati integralmente durante le partite.

## Regole di combattimento concordate

- Turno individuale di massimo 30 secondi. La posa di tre carte **non termina**
  automaticamente il turno; conferma con **ESEGUI** (o scadenza timer).
- Nessuno sparo base gratuito della madre.
- Una sola pressione sulla barra del Generatore prenota lo sparo della madre.
  Alla risoluzione, con almeno **2 carte Energia fisiche** disponibili parte
  l'attacco rapido, con almeno **4** parte quello potente, senza altri clic.
  Se non prenotato non parte alcuno sparo. La priorita' delle Carte Arma che
  consumano Energia viene verificata prima del rilascio.
- Le Carte Energia non consumate restano nello slot/pila. Le cariche aggiuntive
  delle carte Rara/Epica/Leggendaria non equivalgono a piu' carte fisiche.
- Dopo l'attacco il Generatore va in surriscaldamento (1 turno proprio dopo
  il rapido, 2 o 3 dopo il potente, a seconda della nave). Non si distrugge.
- Solo **Arsenale, Centralina e Plancia** hanno timer a consumo simultaneo,
  differenti secondo modello e evoluzione.
- Arsenale esaurito: -30% danni Carte Arma e da 3 a 2 slot Attacco;
  i due alloggiamenti Arma restano disponibili.
- Centralina esaurita: l'intercettazione dei supporti filtra solo il 75% del
  colpo; il restante 25% va alla madre.
- Plancia esaurita: niente scelta libera del primo supporto nemico,
  slot Personaggio disattivato.
- A **tutti e tre i timer esauriti** (NON il Generatore) la nave madre perde
  HP ogni secondo; le navicelle di supporto non subiscono automaticamente
  questo deterioramento. La partita non termina al mero scadere dei timer.
- Le Carte Personaggio sono **escluse** da questi bilanciamenti.

## Candidato numerico F

I parametri sotto sono centralizzati in
`src/fleetNext/pacingBalanceCandidate.js`.

| Parametro | Comune | Rara | Epica | Leggendaria |
|---|---:|---:|---:|---:|
| HP madre rispetto al profilo attuale | 1,15× | 1,00× | 1,00× | 1,00× |
| Danni nominali delle Carte Arma rispetto al catalogo precedente | 0,60× | 1,00× | 1,00× | 1,00× |
| Deterioramento madre dopo tutti i timer (HP massimi/secondo) | 0,9% | 0,9% | 1,2% | 1,6% |

I timer base per i **12 modelli** sono in
`src/fleetNext/componentTimerPacing.js`: i valori differiscono tra modelli
offensivi/difensivi/tattici. Gli aumenti con la rarita' sono attualmente
**+0, +7, +14, +21 secondi** rispetto al tempo base del singolo componente.
I secondi dei timer NON sono ancora numeri finali da stampare o mostrare.

Il nuovo intervallo di stampa per ciascuna delle **235 Carte Arma**
(73 famiglie base + 162 evoluzioni) e' rappresentato nel registro separato
`WEAPON_PRINT_CANDIDATES` in
`src/fleetNext/weaponRarityEvolutions.js`. Questa anteprima
non sostituisce `ALL_WEAPON_CARDS` e non cambia i danni attivi nel gioco.

## Evidenza del collaudo (17 secondi medi per turno)

La matrice crea una battaglia del motore `hp-sync-v2`, disattiva il
normale tiro gratuito e applica provvisoriamente i due colpi del Generatore,
i tre timer e il deterioramento. I mazzi usano Carte Arma, Energia, Sistemi
e Terreni gia' registrati, senza Personaggi.

### Controprova su nuovi semi casuali, dopo correzione tick a 1 secondo

| Tipo | Simulazioni | Media durata | Nella finestra 300–360 s | Pareggi |
|---|---:|---:|---:|---:|
| PvP | 72 | 323 s | 58 | 2 |
| Boss | 24 | 323 s | 20 | 0 |

Durata media PvP per rarita': Comune **311 s**, Rara **309 s**,
Epica **333 s**, Leggendaria **338 s**.

Il motore precedente elaborava il deterioramento in gruppi di circa
17 secondi: tale scelta creava pareggi artificiali. Ora il simulatore
`advanceBattleComponentClock` valuta ogni secondo e interrompe la partita
al **primo KO**; questa correzione e' testata separatamente.

## Limiti e attività ancora necessarie prima dei numeri finali

1. Il collaudo **non corrisponde a una partita realmente giocata sul telefono**:
   17 secondi per turno e decisioni dell'IA sono ipotesi statistiche.
2. Nella plancia ufficiale esistono ancora lo sparo base e la precedente
   gestione del turno. Occorre migrare tutto il gioco alla nuova regola
   prenotazione Generatore / ESEGUI.
3. Alcune armi storiche, in particolare **Cannone dei Frammenti** e
   **Cannone Acceleratore Trifase I/II/III**, aggiungono oggi danno al
   tiro normale della madre: devono sparare autonomamente o essere
   chiaramente collegate all'Attacco Speciale nella nuova meccanica.
4. Le passive dei supporti vanno sottoposte a piu' combinazioni: esistono
   potenziamenti Arma che con due supporti possono arrivare a **4×**.
5. Le future carte Attacco, Difesa e Trappola possono amplificare o
   annullare colpi; non sono inventati loro effetti prima dell'approvazione.
6. Servono nuovi collaudi con piu' tipologie di mazzo, diverse velocita'
   di decisione, bonus di Terreno e ciclo di vita completo dei componenti.
7. **Nessuna immagine di carta deve essere rigenerata o stampata** usando
   questi numeri finche' la nuova meccanica non ha superato anche il
   collaudo della partita ufficiale.

## Prossimo passo operativo

Completare il nuovo ciclo Generatore/Armi/Timer nel motore e nella plancia
approvata, poi sostituire in modo coerente i valori nominali delle carte
con i numeri candidati e aggiornare i test storici senza eliminare
le specifiche approvate delle 73 famiglie.
