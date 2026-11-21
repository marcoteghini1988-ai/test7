# Eclissi Stellare — bilanciamento operativo Carte Arma e navicelle madri, senza deterioramento

**Data:** 21 novembre 2026  
**Repo ufficiale:** `marcoteghini1988-ai/test7`, branch `main`  
**Stato:** applicato alla nuova arena `OfficialFleetBattle3D.jsx`; valori di playtest, non stampa grafica definitiva.

## Decisioni realizzate

1. **Nessun deterioramento automatico della madre**. Non perde HP soltanto perche' sono scaduti Arsenale, Centralina e Plancia. Si vince azzerando gli HP con gli attacchi e gli effetti previsti dalle carte e navicelle.
2. **Orologio strategico individuale**: ogni turno proprio completato consuma **20 secondi fissi** dai propri tre componenti, indipendentemente dal tempo reale usato per confermare con ESEGUI. Ogni giocatore continua ad avere massimo 30 secondi REALI per preparare la mossa. L'ultimo componente scade entro 210 secondi STRATEGICI propri (11 turni personali a quota 20). I tre componenti hanno durate differenti per ciascuna delle dodici madri.
3. **Effetti delle scadenze** invariati: Arsenale -30% danni e due slot Attacco; Centralina devia il 25% del danno intercettato sulla madre; Plancia disattiva scelta libera del primo supporto e lo slot Personaggio.
4. **Generatore della madre**: si prenota con un tocco, usa 2 Carte Energia fisiche per il colpo rapido e 4 per il potente; nessun colpo base gratuito. Le navi mantengono potenze e cooldown distinti.
5. **Ricambio mano piena**: se un turno termina senza carte risolte e senza danni, e la mano contiene 7 carte, se ne scarta una reale e se ne pesca una dal mazzo/scarti veri. Costa quel turno e non crea mai carte o Energia. Dal pannello comandi sulla plancia si puo' scegliere quale carta sacrificare; in assenza di scelta e' la prima della mano. Questo evita i pareggi artificiali causati da mani piene ma non giocabili. Non tocca immagini e layout della plancia.
6. Rigenerazione e veleno dei supporti sono valutati a **quota fissa di turno strategico**, anziche' premiare chi lascia scorrere piu' secondi reali durante la preparazione.

## Nuovi coefficienti attivi

Fonte unica: `src/fleetNext/strategicNoDrainBalance.js`.

| Rarita' | HP madre rispetto alla scala precedente | Danni nominali Carte Arma rispetto al catalogo | Moltiplicatore del colpo Generatore |
|---|---:|---:|---:|
| Comune | 1,15× | 0,60× | 1,00× |
| Rara | 1,00× | 1,00× | 1,00× |
| Epica | 1,00× | **1,70×** | **1,25×** |
| Leggendaria | 1,00× | **1,85×** | **1,30×** |

I fattori si applicano nella nuova partita e alla descrizione numerica dell'Arma, non alla grafica. La collezione delle **73 famiglie originali e 162 evoluzioni = 235 Carte Arma** rimane compatibile con i salvataggi precedenti. Le anteprime della nuova modalita' sono centralizzate in `WEAPON_STRATEGIC_PRINT_BY_ID`. I cambi numerici generali non riscrivono i costi Energia, gli elementi, le durate o i colpi multipli preesistenti.

Le **Carte Personaggio restano escluse** dal bilanciamento, come richiesto.

### Colpi delle 12 madri: esempio a rarita' Leggendaria

Gli HP e i due colpi qui sotto sono i valori NOMINALI della madre al grado Leggendario, prima delle Difese, degli elementi, dei Terreni, delle passive, dei limiti sul singolo impatto e delle altre condizioni strategiche. Il Generatore passa sempre dalle soglie fisiche 2/4.

| Nave madre | HP massimi | Rapido (2 Energie) | Potente (4 Energie) |
|---|---:|---:|---:|
| Aurora-0 | 1.050 | 191 | 382 |
| Lince Solare | 820 | 235 | 448 |
| Vespa di Vetro | 900 | 222 | 410 |
| Corvo a Impulsi | 950 | 173 | 358 |
| Falco Binario | 850 | 243 | 453 |
| Manta Ionica | 1.100 | 143 | 329 |
| Squalo del Vuoto | 1.150 | 150 | 344 |
| Nebulosa | 1.080 | 140 | 309 |
| Tempesta | 870 | 260 | 486 |
| Eclisse Reale | 990 | 206 | 425 |
| Titano Ossidiana | 1.200 | 140 | 312 |
| Arca Astrale | 1.000 | 195 | 390 |

Sono valori calcolati dalle percentuali specifiche gia' presenti in `motherGeneratorBalance.js`, non dodici profili di danno creati ad hoc. La Difesa e i massimali restano vincoli strategici: il valore nominale non equivale sempre agli HP effettivamente sottratti alla nave nemica.

## Evidenza sperimentale e motivo della correzione

All'inizio del collaudo senza deterioramento si verificavano 4/72 pareggi PvP e 1/24 pareggio in campagna. Gli HP residui mostravano che aumentare i danni o ridurre gli HP NON bastava: dopo round 9–17 alcune mani restavano con sette carte non giocabili, impedendo le pescate. Ridurre gli HP Leggendari del 10% o 20% non eliminava nessuno dei quattro pareggi.

La matrice precedente ha quindi testato un ricambio fisico a costo di turno: con gli stessi mazzi e semi, 72/72 PvP e 24/24 campagna si concludevano con danni effettivi (0 pareggi). Il ricambio e' stato poi trasferito nella partita ufficiale, con possibilita' di scelta della carta da scartare.

### Test del motore EFFETTIVAMENTE integrato

- **72 PvP** con nuove statistiche, timer strategici, Generatore reale e ricambio: **72/72 vittorie per danni diretti**, 0 pareggi, 0 vittorie per deterioramento.
- Durata media PvP **405 s (6:45)**, mediana **374 s (6:14)**.
- Media per rarita': Comune **380 s (6:20)**, Rara **368 s (6:08)**, Epica **453 s (7:33)**, Leggendaria **419 s (6:59)**.
- **24 campagna** con la CPU veloce e mazzi reali: **24/24 vittorie per danni effettivi**, 0 pareggi, durata media **223 s (3:43)**.
- Nelle prove: **102** ricambi fisici nel campione PvP, **9** nella campagna. Non si sono generate carte supplementari.
- Controprova della velocita' di gioco su 24 duelli a semi uguali per scenario: **esito, numero di turni e causa della vittoria identici** fra giocatori che confermano in 6/26, 26/6, 6/6, 26/26 o 17/17 secondi. Cambia solo la durata reale.

**Queste sono simulazioni automatiche, non partite umane su smartphone**. L'obiettivo 5–6 minuti non e' ancora raggiunto uniformemente: Epiche e Leggendarie tendono a durare di piu'; la campagna con CPU rapida puo' terminare prima del target.

### Verifica GitHub

Commit del motore con deterioramento esplicitamente a 0: `c3ff1fc447ee2da298aab46c60de69ce92ed10d5`.  
Suite `test7-ci.yml`: **1.891 test superati su 1.891, 0 fallimenti**, preflight e build Vite riusciti. Il collaudo mobile automatico della plancia e' passato.

## Stato delle attivita' rimanenti

**Questa e' la prima taratura OPERATIVA gia' attiva**, non la certificazione definitiva di ciascuna delle 235 Armi e di tutti gli effetti di Difesa, Trappola e Terreno. I valori delle illustrazioni definitive non devono ancora essere stampati. Servono ulteriori prove con mazzi costruiti da giocatori, composizioni estreme di due supporti (comprese passive cumulative), Difese, Trappole e Personaggi una volta approvati. La nuova regola di base, invece, non permette piu' di vincere soltanto perche' il tempo ha consumato gli HP della madre.

**File di riferimento:**
- `src/fleetNext/strategicNoDrainBalance.js`: coefficienti centralizzati
- `src/fleetNext/combat.js`: battaglia ufficiale e ricambio mano
- `src/fleetNext/motherGeneratorBalance.js`: 12 profili Generatore madre
- `src/fleetNext/componentTimerPacing.js`: timer misti e scadenze
- `src/fleetNext/weaponBalanceCalibration.js`, `weaponRarityEvolutions.js`: anteprime 235 Armi
- `src/OfficialFleetBattle3D.jsx`: plancia ufficiale e pannello di ricambio
- `src/fleetNextOfficialGeneratorCombat.test.js`, `src/fleetNextWeaponPacingMatrix.test.js`: regressioni e matrici
