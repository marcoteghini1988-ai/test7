# Eclissi Stellare — bilanciamento candidato, 21 novembre 2026

**STATO: INTEGRATO NELLA NUOVA PARTITA, ANCORA IN COLLAUDO NUMERICO.**
Il modello e' stato integrato nel repository ufficiale `test7` (branch `main`)
e viene ora attivato dalla plancia `OfficialFleetBattle3D.jsx`.
I valori e gli HP sono candidati verificati da simulazioni automatiche,
non ancora numeri da stampare sulle immagini definitive delle carte.
Il vecchio comportamento del motore rimane disponibile soltanto come
compatibilita' per test storici e vecchie fixture.

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
I secondi dei timer sono VISIBILI in battaglia nella nuova modalita', ma
rimangono candidati da verificare in partite giocate da persone reali.

Il nuovo intervallo di stampa per ciascuna delle **235 Carte Arma**
(73 famiglie base + 162 evoluzioni) e' rappresentato nel registro separato
`WEAPON_PRINT_CANDIDATES` in
`src/fleetNext/weaponRarityEvolutions.js`. Questa anteprima
non sostituisce `ALL_WEAPON_CARDS` per le vecchie partite: nella nuova
modalita' i danni sono calibrati durante la risoluzione e le anteprime
numeriche sono mostrate nei testi delle Carte Arma, senza cambiare le immagini.

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

## Integrazione nel gioco ufficiale

Il modello e' stato collegato a `src/fleetNext/combat.js` tramite
`newGeneratorCombat:true`, attivato dalle nuove battaglie della plancia
`src/OfficialFleetBattle3D.jsx`. Il giocatore conferma manualmente con
**ESEGUI**, anche dopo avere giocato la terza carta. La barra del Generatore
si preme UNA volta; a fine preparazione si decide il colpo da 2/4 Carte
Energia fisiche. Le Carte Arma possono sparare autonomamente senza
sparo gratuito della madre. I tre timer scorrono durante la partita.

La nuova barra usa la geometria esistente della plancia 3D e le stesse
immagini approvate. Le descrizioni delle 235 armi nella nuova modalita'
leggono `WEAPON_PRINT_CANDIDATE_BY_ID`, separato dal catalogo legacy.

La pipeline GitHub verifica `preflight`, `verify:logic`, `build`
e il collaudo mobile Chrome 450×800. La suite completa contiene test
specifici per ESEGUI manuale, soglie Generatore, 3 timer, danno alla
nave madre e Armi Sequenza autonome.

## Esito iniziale dei test della modalita' live

Primo gruppo (24 partite PvP eseguite dal nuovo motore):
Comune **300 s**, Rara **315 s**, Epica **344 s**, Leggendaria **332 s**,
media **323 s**, 0 pareggi. Nel primo gruppo 16 incontri su 24 erano nella
finestra 300–360 s.

Controprova successiva su nuovi semi:
**72 PvP**, media **320 s**; **24 boss**, media **324 s**. 
Il motore ha risolto automaticamente alcune giocate divenute invalide
perche' un timer era scaduto durante il turno, senza bloccare il combattimento.
La prima controprova includeva ancora alcuni Personaggi esclusivi aggiunti
implicitamente: la verifica successiva li elimina del tutto. Consultare
i log CI aggiornati per i risultati esatti definitivi.

**NOTA:** il calcolo della durata assume 17 secondi medi per ogni turno.
Nel gioco mobile l'IA puo' confermare piu' rapidamente; occorre quindi
misurare la durata REALE di una partita, non solo il numero di turni.

## Lavoro ancora necessario per considerare definitivo il bilanciamento

- Fare partite pratiche da smartphone, incluse mosse immediate con ESEGUI,
  fino al KO di entrambe le navi, e confrontare con le simulazioni.
- Accertare che nessuna Carta Personaggio compaia nelle statistiche prima
  della loro revisione. Le carte esclusive Personaggio restano nel gioco ma
  non devono determinare il bilanciamento complessivo.
- Estendere i test a combinazioni di supporti con passive 2× (cumulabili
  fino a 4×), Terreni, difese e trappole esistenti.
- Completare la revisione finale di ogni famiglia Arma e usare i valori
  stampabili SOLO dopo approvazione delle relative descrizioni.
- Non generare o sostituire immagini delle carte prima della conferma.

## Riferimenti attuali

- `src/fleetNext/pacingBalanceCandidate.js`: parametri candidati della nuova
  modalita' ufficiale.
- `src/fleetNext/componentTimerPacing.js`: tre timer e danno al secondo.
- `src/fleetNext/motherGeneratorBalance.js`: attacchi 2/4 e raffreddamento.
- `src/fleetNext/weaponRarityEvolutions.js`: anteprima di 235 Carte Arma.
- `src/fleetNextWeaponPacingMatrix.test.js`: matrici statistiche e boss.
- `src/fleetNextOfficialGeneratorCombat.test.js`: regressioni di combattimento.
