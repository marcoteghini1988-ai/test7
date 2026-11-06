# Eclissi Stellare — Punto 12: dottrine delle 17 flotte
Aggiornamento del 6 novembre 2026.

## Implementazione confermata
- src/escortTactics.js: sette ruoli tattici e 17 dottrine specifiche, una per navicella madre.
- src/escortFiring.js: bonus di dottrina applicati a ogni scarica indirizzata a un bersaglio compatibile.
- src/MathDuelBattle.jsx: la dottrina attiva appare nello stato del combattimento.
- src/escortDoctrine.test.js: sette test aggiunti; il gruppo di otto suite logiche ha superato 108 test su 108 in verifica JavaScript isolata.
- package.json: test:combat include ora i test delle scudiere, delle dottrine, degli armamenti e dei sistemi vitali.
- Nessuna nuova carta collezionabile e nessuna modifica ai 34 asset grafici delle scudiere.

## Ruoli già operativi
| Ruolo | Competenza |
|---|---|
| Guardia | +8% intercettazione sotto il 50% dello scudo madre |
| Intercettore | +10% intercettazione contro attacchi ai vitali |
| Baluardo | +12% intercettazione sotto il 25% dello scudo madre |
| Assalto | +25% danni contro scudi delle scudiere |
| Incursore | +25% danni contro parti vitali esposte |
| Assedio | +35% danni contro scudo della madre |
| Artiglieria | +20% danni contro scudo madre o scudiere |

## Dottrine aggiunte, specifiche per famiglia
| Nave madre | Dottrina | Bersaglio preferito | Bonus attacco | Bonus intercettazione in difficoltà |
|---|---|---|---|---|
| N00 | Scorta Aurora | Scudiere | 5% | 0% |
| C01 | Fuoco Solare | Scudo madre | 6% | 1% |
| C02 | Taglio di Cristallo | Scudo madre | 7% | 1,5% |
| C03 | Richiamo del Corvo | Scudiere | 8% | 1,2% |
| C04 | Penombra Cremisi | Vitali | 7% | 1,5% |
| R01 | Circuito Binario | Scudo madre | 8% | 2% |
| R02 | Marea Ionica | Scudiere | 9% | 1,8% |
| R03 | Frazione Iride | Vitali | 9% | 2% |
| R04 | Morsa del Vuoto | Scudo madre | 10% | 2,2% |
| E01 | Campo Nebulosa | Vitali | 10% | 2,7% |
| E02 | Scarica Tempesta | Scudiere | 11% | 2,1% |
| E03 | Forgia Fenice | Vitali | 12% | 2,6% |
| E04 | Linea Orizzonte | Scudiere | 12% | 3% |
| L01 | Corona di Guerra | Vitali | 13% | 3,2% |
| L02 | Eclissi Tattica | Scudiere | 14% | 2,8% |
| L03 | Giudizio d'Assedio | Scudo madre | 15% | 3,5% |
| L04 | Sovranità Stellare | Vitali | 16% | 4% |

Il bonus di attacco è cumulabile con il ruolo, quando corrispondono le condizioni.
Il bonus difensivo della dottrina si aggiunge ai ruoli soltanto quando lo scudo della madre scende al 50% o meno. La quota d'intercettazione rimane limitata al 45% per scudiera, e i danni assorbiti vengono sottratti ai suoi HP.
Quando la centralina madre è distrutta, le dottrine non forniscono bonus offensivi e le scudiere non possono più intercettare i colpi diretti alla madre.
I semi delle carte servono solo come chiave di caricamento dell'arma; non generano cure o effetti propri.

## Da verificare e rifinire con Work
- Compilazione completa Vite/TypeScript e prova interattiva dell'arena 9:16.
- Visibilità sul telefono dei nomi delle dottrine e dell'arma selezionata.
- Bilanciamento di percentuali, tempi e frequenza di attivazione su tutti i 17 modelli.
- Sinergie più profonde tra madre e scudiere, senza eliminare le capacità individuali.
- Tutti i valori di questa tabella sono segnaposto di bilanciamento, non numeri finali approvati.
