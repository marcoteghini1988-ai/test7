# Eclissi Stellare — la strategia, non la velocita, determina l'esito

Data: 21 novembre 2026
Stato: **verifica sperimentale superata, NON attivata nella partita ufficiale**.

## Problema verificato

Nella prova con cronometri di tempo personale reale (3:30, poi 1% HP massimi/s)
un giocatore con turni da 6 secondi ha vinto 46/48 duelli contro un giocatore
con turni da 26 secondi. La rapidita dominava la strategia, quindi il modello
non risponde all'obiettivo di design.

## Regola candidata

- **Il tempo dei componenti si consuma solo nei PROPRI turni**, mai nel turno avversario.
- Per evitare vantaggio da riflessi, si consuma una **quota uguale e fissa a
  conclusione di ogni turno**, indipendente da quanto tempo reale ha impiegato
  il giocatore per selezionare e confermare le carte.
- I tre componenti (Arsenale, Centralina, Plancia) conservano i diversi
  profili per nave gia' documentati in
  `docs/PROVA_TIMER_TEMPO_GIOCATORE_210S_1PCT_2026-11-21.md`.
- L'ultimo componente arriva a **210 secondi strategici (3:30)**.
- Dopo il terzo timer, la madre perde l'**1% dei propri HP massimi
  per ogni secondo strategico aggiuntivo**, attribuito a fine proprio turno.
  La stessa perdita non dipende dalla velocita dei tocchi.
- Il turno dura ancora **al massimo 30 secondi reali**, trascorsi i quali
  si risolve la giocata; non accelera, pero, la scadenza dei componenti.
- La partita puo finire con componenti operativi **perche il giocatore ha
  vinto in meno turni grazie alle carte**, non perche ha premuto piu rapidamente.
- Se la partita e gia stata vinta dall'attacco risolto nel turno, la quota
  successiva non viene addebitata: i componenti del vincitore rimangono come
  erano all'istante della vittoria.

La modalita sperimentale `strategy-per-turn` salta il vecchio deterioramento
a tempo globale. La funzione di test fa avanzare il clock strategico solo dopo
la risoluzione della mossa valida e solo se la battaglia non e gia conclusa.
**Il gioco ufficiale non e stato cambiato**; si tratta di un modello per
bilanciamento nel risolutore reale, non di una nuova UI o di nuove carte.

## Confronto quote per turno

Scenario: stesso motore delle nuove partite, stesse Carte Arma/Energia e
supporti registrati; escludiamo Carte Personaggio. Per ogni quota:
36 PvP e 24 incontri di campagna con CPU che gioca rapidamente.

| Quota strategica per proprio turno | Ultimo componente | Media PvP | PvP KO da carte | PvP KO deterioramento | Vittorie PvP con 3 componenti salvi | Media campagna |
|---|---:|---:|---:|---:|---:|---:|
| 10 secondi | 210 s | 483 s (8:03) | 31/36 | 5/36 | 27/36 | 320 s |
| **15 secondi** | 210 s | 426 s (7:06) | 25/36 | 11/36 | 21/36 | 271 s |
| **20 secondi** | 210 s | 380 s (6:20) | 23/36 | 13/36 | 4/36 | 236 s |
| 25 secondi | 210 s | 331 s (5:31) | 9/36 | 27/36 | 1/36 | 205 s |

A 15 secondi per turno, l'ultimo componente scade **esattamente dopo
14 turni personali**. Dal 15esimo turno, se la partita e ancora aperta,
il peggioramento corrisponde a **15% HP massimi per turno** (15 secondi
strategici x 1%); questo va rappresentato in UI come deterioramento
di fine turno, non come conto alla rovescia reale.

A 20 secondi per turno, il terzo timer attraversa la soglia 210 s
alla fine dell'**11esimo turno**. Il primo danno di deterioramento e
equivalente al solo tratto oltre i 210 s (10% HP massimi), poi 20% per
turno seguente, se non si verificano KO o cure.

**Tradeoff:** 15 secondi premiano maggiormente una partita vinta con
componenti ancora operativi ma allungano troppo Epica/Leggendaria;
20 secondi avvicinano il PvP ai 5–6 minuti, mantengono la prevalenza
delle vittorie da carte e introducono maggiore pressione dai componenti.
25 secondi non vanno bene: deterioramento decide 27/36 duelli.

### Medie PvP per rarita

| Quota | Comune | Rara | Epica | Leggendaria |
|---|---:|---:|---:|---:|
| 15 s | 363 s | 334 s | 506 s | 502 s |
| 20 s | 355 s | 336 s | 412 s | 417 s |

Le durate di Epica/Leggendaria richiedono una taratura delle armi
e delle difese indipendente dalla velocita personale.

## Prova rigorosa contro la velocita

24 coppie di battaglia a semi e mazzi uguali, per ciascuna quota 15 s o 20 s.
Sono stati mantenuti stessi abbinamenti e ordine decisionale, ma variati
i tempi reali impiegati per turno.

| Secondi reali A/B | Vince A | Vince B | Quota 15s | Quota 20s |
|---|---:|---:|---|---|
| 17 / 17 | 14 | 10 | esiti identici | esiti identici |
| 6 / 26 | 14 | 10 | esiti identici | esiti identici |
| 26 / 6 | 14 | 10 | esiti identici | esiti identici |
| 6 / 6 | 14 | 10 | esiti identici | esiti identici |
| 26 / 26 | 14 | 10 | esiti identici | esiti identici |

Non sono state confrontate soltanto le percentuali: un test automatico
verifica una **firma completa** per ciascuna battaglia (seme, vincitore,
numero di turni, componenti superstiti e motivo della vittoria).
**Tutte le firme sono identiche** fra le cinque velocita sopra per
entrambe le quote testate. La durata reale dell'incontro e ovviamente
diversa, ma l'esito non cambia.

La prova con CPU usa invece un mazzo/avversario boss differente e non
va usata come confronto diretto di velocita. La difficolta CPU e le
strategie dei mazzi richiedono una calibrazione autonoma: nessun vantaggio
temporale gratuito deve essere aggiunto alla CPU.

## Controlli effettuati

- Il flag `componentClockMode='strategy-per-turn'` e accessibile solo in
  via sperimentale e non modifica l'orologio delle partite normali.
- I test della CI di GitHub hanno superato **1.879 su 1.879**;
  preflight e compilazione Vite riusciti.
- Tracciati nei log:
  `AUDIT_STRATEGY_TURN_QUOTA_20261121` e
  `AUDIT_STRATEGY_SPEED_TEST_20261121`.
- Nessuna immagine, carta o valore live aggiornati.

## Decisione progettuale proposta

**Scartare i cronometri basati sui secondi reali usati dal giocatore
come meccanica che deteriora i componenti.** Quelli premiano i riflessi,
non le scelte strategiche. Scegliere un consumo per turno uguale per i
due giocatori (testati 15/20 secondi) e misurare la pressione sulle navi
dal numero di turni propri.

Prima dell'attivazione definitiva occorre rivedere le altre abilita
con durata in secondi reali (rigenerazione, veleno e congelamento) e
verificare che non reintroducano vantaggi da tempo di risposta.
La simulazione per semi mostra parita degli esiti dei casi testati,
ma non sostituisce collaudi completi con tutti i mazzi e supporti.
