# Eclissi Stellare — simulazione del tempo GIOCATORE (210 s, 1% HP/s)

**Data:** 21 novembre 2026  
**Stato:** prova isolata validata; **NON attiva** nella plancia ufficiale.
**Repository:** `marcoteghini1988-ai/test7`, `main`.  
**Test:** `src/fleetNextWeaponPacingMatrix.test.js` e `src/fleetNextOfficialGeneratorCombat.test.js`.

## Regole precise della prova

- Ogni giocatore ha tre timer **indipendenti dal tempo dell'avversario**, uno per Arsenale, Centralina e Plancia.
- I timer di una nave scalano **solo nei secondi effettivamente trascorsi durante i suoi turni**, compresi i turni conclusi con ESEGUI prima dei 30 secondi. Il tempo passato nel turno avversario non contribuisce.
- Ogni navicella conserva le tre durate differenti della matrice precedente. **Il terzo timer arriva al secondo 210 (3:30) del suo giocatore**, indipendentemente dalla rarità.
- Il deterioramento dopo lo scadere dei tre timer è **1% degli HP massimi della propria madre per secondo personale**, dal secondo 211 incluso. **Non** è l'1% degli HP rimasti.
- Quando il cronometro è fermo durante il turno avversario, anche **questo deterioramento** è fermo.
- La scadenza dei timer non distrugge automaticamente la nave né i supporti; si applicano le penalità confermate del gioco.
- Dopo l'esaurimento di tutti i timer, una nave al 100% degli HP può resistere al solo deterioramento per **altri 100 secondi personali**; a HP inferiori il tempo si riduce. L'esito può arrivare molto prima con i danni da carte.
- Generatore, slot, carte Energia, Armi e condizioni di vittoria non cambiano. **Carte Personaggio escluse dai campioni**.
- L'opzione di prova nel codice è `battle.componentClockMode='active-player-only'`. Le partite live senza questa opzione continuano a usare i valori e i timer precedenti. Non sono state cambiate le immagini delle carte.

## Durate dei tre componenti per modello (secondi personali)

| Nave | ID | Arsenale | Centralina | Plancia |
|---|---|---:|---:|---:|
| Aurora-0 | N00 | 185 | 195 | 210 |
| Lince Solare | C01 | 210 | 174 | 187 |
| Vespa di Vetro | C02 | 194 | 180 | 210 |
| Corvo a Impulsi | C03 | 171 | 210 | 191 |
| Falco Binario | R01 | 210 | 171 | 181 |
| Manta Ionica | R02 | 174 | 210 | 198 |
| Squalo del Vuoto | R04 | 167 | 210 | 186 |
| Nefelarca | E01 | 172 | 210 | 197 |
| Vortiluce | E02 | 210 | 167 | 185 |
| Eclisse Reale | L01 | 185 | 210 | 198 |
| Titano Ossidiana | L03 | 168 | 210 | 190 |
| Arca Astrale | L04 | 185 | 198 | 210 |

Sono profili sperimentali derivati dalle precedenti specializzazioni (non è approvato un nuovo bilanciamento del catalogo).

## Matrice di confronto a pari semi, mazzi e abbinamenti

Ogni scenario: **72 PvP e 24 campagne**, per un totale di **288 partite** nelle tre configurazioni. Le durate sono tempi complessivi reali simulati (somma dei secondi che i giocatori effettivamente impiegano nei propri turni); **i timer dei componenti della nuova variante sono individuali**, non la somma. Nel PvP di riferimento ciascun turno dura circa 17 s. Nella campagna circa 18,6 s per A umano e 2,3 s per B CPU; entrambi includono stime di animazione.

| Scenario | PvP medio | Vittorie PvP per danni diretti | PvP per deterioramento | Vincitori PvP con almeno un componente salvo | Campagna media |
|---|---:|---:|---:|---:|---:|
| F precedente (tempo globale) | 320 s | 12/72 | 60/72 | 7/72 | 259 s |
| Vecchia prova: 210 s globali, 2% | 236 s | 6/72 | 66/72 | 0/72 | 217 s |
| **Nuova prova: 210 s personali, 1%** | **415 s (6:55)** | **43/72** | **29/72** | **41/72** | **248 s (4:08)** |

Altri dettagli della nuova prova PvP:
- Mediana **408 s**; minimo **221 s**, massimo **579 s**.
- In **15/72** partite il vincitore ha tutti e tre i componenti salvi; in **41/72** ne ha almeno uno salvo.
- **15/72** PvP nella finestra di 5–6 minuti (rispetto al precedente target complessivo), ma **nessuna** partita è terminata in pareggio.
- Media consumo cronometri personali al termine: A **212 s**, B **204 s**. Solo 35/72 A e 31/72 B superano effettivamente i 210 secondi personali.

Nuova prova campagna:
- **16/24** vittorie da danni diretti, **8/24** da deterioramento.
- **21/24** vincitori con almeno un componente attivo; **16/24** con tutti e tre attivi.
- A umano vince **10/24**, B CPU **14/24** sugli stessi abbinamenti di questa matrice.
- Tempo personale medio A **214 s**, CPU B **23 s**: nessuna delle 24 CPU raggiunge 210 s, mentre 14 giocatori A superano quel tempo.
- Durata media per rarità in PvP: Comune **353 s**, Rara **352 s**, Epica **478 s**, Leggendaria **478 s**. Ne consegue che Epica/Leggendaria richiedono una nuova taratura delle armi per rientrare nella durata desiderata senza affidarsi ai timer.

## Sensibilità alla velocità dei turni

**24 partite per ciascuno di sei modelli di velocità** = 144 simulazioni ulteriori. Stesse regole e motore per tutti; cambiano solo i secondi per turno.

| Velocità A/B | Durata media | Vince A | Vince B | Pareggi | Vincitore con 3 componenti salvi |
|---|---:|---:|---:|---:|---:|
| 17 / 17 s | 407 s (6:47) | 10 | 14 | 0 | 5 |
| 6 / 26 s | 309 s (5:09) | **24** | 0 | 0 | 24 |
| 26 / 6 s | 304 s (5:04) | 2 | **22** | 0 | 22 |
| 6 / 6 s | 184 s (3:04) | 11 | 12 | 1 | 22 |
| 26 / 26 s | 487 s (8:07) | 9 | 15 | 0 | 0 |
| 18,6 / 2,3 s (CPU B) | 246 s (4:06) | 7 | **17** | 0 | 20 |

La velocità diventa quasi dominante: il giocatore da 6 s ha vinto **46 delle 48** partite contro l'avversario da 26 s. Con CPU da 2,3 s e umano da 18,6 s, la CPU vince **17/24** partite in questa matrice di sensibilità. Si tratta di casi estremi ma tecnicamente plausibili se ESEGUI è immediato e la CPU gioca quasi istantaneamente.

## Verifiche tecniche

I test di regressione assicurano che:
- Avanzando **10 s nel turno A**, il timer A sale di 10 s e B resta a 0.
- Dopo **12 s nel turno B**, A resta a 10 e B sale a 12.
- Rientrando nel turno A con altri **6 s**, A sale a 16 e B resta a 12.
- Doppio aggiornamento allo stesso timestamp non consuma due volte gli stessi secondi.
- Al proprio secondo 210 il terzo componente scade senza danno immediato; al secondo 211 la nave perde 1% degli HP massimi; durante il turno B gli HP della madre A non scendono per questo deterioramento.

**Risultato CI:** **1.877/1.877 test superati**, compilazione Vite riuscita; nessuna statistica live o grafica sostituita.

## Conclusioni di design

**La regola soddisfa il requisito della rapidità e delle vittorie con componenti ancora attivi**, nettamente più del vecchio modello globale. Tuttavia:
1. L'equilibrio fra giocatori veloci e lenti è oggi eccessivamente asimmetrico (46/48 vinti dal più veloce nei test di stress).
2. La CPU, essendo molto rapida nei propri turni, conserva sempre i componenti e può ottenere un vantaggio non dovuto alle carte (17/24 vittorie nella prova di stress).
3. Le rarità Epica e Leggendaria hanno ancora incontri lunghi (478 s medi PvP, contro 353/352 s delle più basse).

**Decisione di lavoro:** conservare i timer individuali 210 s / 1% come **candidato da discutere**, senza attivarli nel gioco ufficiale. Prima di una possibile promozione, verificare le condizioni di bilanciamento della CPU e i margini di recupero strategico di un giocatore umano lento. Non alterare il sistema Personaggio finché non sarà definito.
