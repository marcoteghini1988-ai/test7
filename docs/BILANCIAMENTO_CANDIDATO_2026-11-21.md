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

## Controprova sul motore ufficiale, 21/11 — collaudo finale di questo turno

Dopo l'integrazione delle meccaniche effettive nella plancia, le ultime
verifiche automatizzate hanno superato **1.859 test su 1.859** e la build.

Con due giocatori simulati che impiegano circa 17 s ciascuno per turno:

| Scenario | Casi | Durata media | Nella finestra 5–6 min | KO per deterioramento componenti | KO per danni diretti |
|---|---:|---:|---:|---:|---:|
| PvP | 72 | 319 s | 54 | 60 | 12 |
| Boss | 24 | 326 s | 23 | 19 | 5 |

Una seconda simulazione, piu vicina ai tempi reali della campagna, usa
**18,6 s per il giocatore** (scelta e animazioni) e **2,3 s per la CPU**
(decisione e animazioni). Dal 21/11 la CPU utilizza un vero mazzo
di 40 carte del catalogo, con Armi ed Energie per ciascun elemento sbloccato:
questi sono i valori **aggiornati dopo il passaggio al mazzo completo**.

| Rarita | Partite | Durata media |
|---|---:|---:|
| Comune | 6 | 231 s |
| Rara | 6 | 218 s |
| Epica | 6 | 302 s |
| Leggendaria | 6 | 286 s |
| **Totale** | **24** | **259 s** |

Solo **9 partite su 24** sono nella finestra 300–360 s; **15** sono terminate
per danno diretto e **9** per deterioramento. Si registra un pareggio.
Il valore precedente di 282 secondi si riferiva al mazzo CPU sintetico di
collaudo e **non va usato per prendere decisioni sulla campagna reale**.

**CONCLUSIONE DI BILANCIAMENTO:** la media PvP e boss a 17 s per turno e'
vicina al target, ma **il bilanciamento definitivo delle 235 armi non e'
ancora certificabile**. In particolare, i timer decidono l'esito di
83% dei PvP simulati (60 su 72), mentre un avversario CPU veloce
riduce sensibilmente la durata delle partite Comune e Rara.

Non si deve rallentare artificialmente la CPU per ottenere il tempo
nominale, ne' ridurre il deterioramento senza eseguire nuovi collaudi
sul motore effettivo. Le Carte Personaggio rimangono escluse.
Le penalita' concordate di Arsenale (-30%), Centralina (75/25) e
Plancia (blocco scelta bersaglio e slot Personaggio) rimangono invariate.

I test hanno anche rilevato che alcune giocate possono essere
diventate non valide durante la preparazione quando il timer
Arsenale scade; l'attuale funzione di risoluzione recupera
le carte valide senza bloccare il turno.

### Da validare prima delle immagini definitive

- PvP reale con azioni veloci/lente, non un unico intervallo di 17 secondi.
- Varieta' dei mazzi con Difese e Trappole progettate, che ancora non
  partecipano a tutte le simulazioni.
- Quanto la vittoria derivi dalle carte rispetto al deterioramento,
  senza trasformare il timer in una condizione di sconfitta inevitabile.
- Boss su campagna reale con IA tattica e senza rallentamenti artificiali.


## Audit aggiuntivo G/H/J — 21 novembre 2026 (nessuna modifica alle statistiche live)

Dopo l'integrazione dell'attuale candidato F abbiamo eseguito **424 partite
diagnostiche aggiuntive** (112 nella matrice G, 96 nella H e 216 nella J),
tutte con il **vero risolutore della nuova modalita**, senza Personaggi.
I fattori sperimentali vengono applicati solo alla copia della battaglia
nel test `src/fleetNextWeaponPacingMatrix.test.js`: **nessun parametro
ufficiale del gioco e nessuna immagine di Carta Arma viene sostituita**.
Non sono 424 partite umane. Rimangono ipotesi di tempo dell'IA.

### Matrice G — 7 scenari, ognuno con 8 PvP e 8 boss

| Scenario | PvP medio | PvP da danni diretti | Boss medio |
|---|---:|---:|---:|
| F attuale | 316 s | 1/8 | 250 s |
| G1: deterioramento ×0,45 | 340 s | 4/8 | 267 s |
| G2: +30 s timer, deterioramento ×0,50 | 351 s | 3/8 | 274 s |
| G3: +45 s, deterioramento ×0,50, supporti HP ×0,85 | 355 s | 5/8 | 270 s |
| G4: +50 s, deterioramento ×0,50, supporti HP ×0,75 | 355 s | 4/8 | 271 s |
| G5: +60 s, deterioramento ×0,55, Armi ×1,10 | 352 s | 4/8 | 263 s |
| G6: +45 s, deterioramento ×0,50, supporti HP ×0,85, Armi ×1,15 | 333 s | 6/8 | 254 s |

Il risultato e' sensibile alla rarita': per G6, ad esempio, nella
campagna Comune 207 s, Rara 188 s, Epica 401 s, Leggendaria 218 s.
**Un unico coefficiente generale non bilancia tutte le quattro rarita'.**

### Matrice H — 4 scenari, ognuno con 12 PvP e 12 boss

La variante H2 con HP aggiuntivi per Comune e Rara ha portato la media
PvP a **341 s** e la campagna a **303 s** (rispetto al baseline 311 s/265 s
sugli stessi semi), ma nei PvP le morti da timer sono ancora **7/12**.
Le durate PvP per rarita' erano Comune **366 s**, Rara **317 s**,
Epica **328 s**, Leggendaria **351 s**. La sola durata media non e'
sufficiente per promuovere uno scenario a definitivo.

### Matrice J — 3 scenari, ognuno con 48 PvP e 24 boss, semi nuovi

| Scenario | PvP medio | PvP in 300–360 s | PvP KO diretti | Boss medio | Boss in 300–360 s |
|---|---:|---:|---:|---:|---:|
| F live | 319 s | 40/48 | 8/48 | 264 s | 8/24 |
| J1 per rarita'/modalita' | 329 s | 41/48 | 16/48 | 288 s | 12/24 |
| J2 per rarita'/modalita' | 332 s | 40/48 | 18/48 | 284 s | 12/24 |

J2 **aumenta l'incidenza delle vittorie ottenute giocando e danneggiando
la madre** nel PvP (da 8/48 a 18/48), ma ancora **30/48** PvP sono
decisi dal deterioramento e la campagna resta sotto il target.
J2 registra anche un pareggio nella campagna, contro nessuno del
baseline sugli stessi semi. Non va attivata alla cieca.

**Durata media J2 per rarita':**

| Rarita' | PvP | Campagna con CPU veloce |
|---|---:|---:|
| Comune | 327 s | 276 s |
| Rara | 339 s | 272 s |
| Epica | 333 s | 310 s |
| Leggendaria | 330 s | 279 s |

**Nota:** J1 e J2 non sono moltiplicatori globali: hanno scale separate
per rarita' e per PvP/campagna, definite direttamente nel test.
Le 3 matrici sono test di sensibilita', NON aggiornamenti alla scala
delle carte stampate. Gli effetti e gli slot persi per Arsenale,
Centralina e Plancia rimangono quelli approvati; il Generatore continua
a usare 2/4 Carte Energia fisiche. Nessuna carta Personaggio ha
partecipato al collaudo.

### Risultato e decisioni tecniche

1. **Non promuovere ancora G/H/J a bilanciamento ufficiale.**
   La durata generale e' migliorabile, ma J2 porta la campagna a 284 s
   e lascia troppi KO da timer nelle rarita' elevate.
2. Separare i prossimi test **PvP da campagna** e **Comune/Rara da
   Epica/Leggendaria**; fare particolare attenzione alla campagna
   Rara e ai colpi che concludono troppo presto la partita.
3. Ricontrollare i **235 profili Arma** e le combinazioni con le
   **13 navicelle di supporto**, inclusi mazzi con Difese e Trappole:
   questi campioni non rappresentano ancora tutte le strategie.
4. Non allungare artificialmente il tempo decisionale della CPU per
   ottenere 300 s; misurare tempi e cause della vittoria.
5. Prima di fissare numeri da stampare, collaudare le stesse partite
   dalla plancia mobile, includendo recupero carte, risoluzione di
   mosse diventate invalide alla scadenza di Arsenale e animazioni.

### Tracciabilita'

- G: commit `56c5f12`, 1.869 test superati + build.
- H: commit `2ce602b`, 1.870 test superati + build.
- J: commit `a1faa2a`, **1.871 test superati su 1.871** + build.
- I report raw JSON sono emessi nei log del workflow `Test7 — Eclissi Stellare checks`
  come `WEAPON_PACING_G_SWEEP`, `WEAPON_PACING_H_SWEEP` e
  `WEAPON_PACING_J_CROSSCHECK`.
