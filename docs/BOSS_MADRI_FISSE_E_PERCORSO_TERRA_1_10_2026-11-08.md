# Eclissi Stellare — madri boss canoniche e percorso Terra 1–10

**8 novembre 2026 — stato implementato in `marcoteghini1988-ai/test7`, `main`.**

## 1. La madre dei 12 boss è finalmente un'identità stabile

Prima, `chooseCampaignMotherRival` sceglieva il corpo nave avversario in funzione della nave del giocatore: per il Guardiano di Gaia la madre risultava C03 contro N00/C01/C02, ma C02 contro C03. Il giocatore cambiava quindi involontariamente le firme matematiche, le armi e la grafica fisica del medesimo boss. La controprova aveva dimostrato che questo alterava gli esiti di battaglia.

Ora `src/officialBossMotherShips.js` associa ciascuno dei dodici boss a un **modello reale fisso** del catalogo. La scelta segue l'ultima navicella che può essere stata conquistata **PRIMA** di affrontare il boss; non deriva dalla collezione posseduta né dalla madre selezionata. `src/officialBossEncounter.js` espone `motherShipId`, `src/officialBattleSetup.js` lo usa nell'arena simultanea, e il briefing di `src/OfficialBattle3D.jsx` mostra nome e ID della madre senza spostare la plancia.

| Boss | Settore globale | Madre fissa |
|---|---:|---|
| Guardiano di Gaia · Terra | 10 | C03 · Corvo a Impulsi |
| Colosso di Tharsis · Marte | 20 | R01 · Falco Binario |
| Matriarca Tossica · Venere | 30 | R03 · Iride |
| Crono il Distruttore · Saturno | 40 | R04 · Squalo del Vuoto |
| Sentinella Ionica · Urano | 50 | E01 · Nebulosa |
| Leviatano Abissale · Nettuno | 60 | E02 · Tempesta |
| Signore delle Ombre · Plutone | 70 | E03 · Fenice |
| Idra Criogenica · Europa | 80 | E04 · Orizzonte |
| Generatore del Caos · Proxima b | 90 | L01 · Eclisse Reale |
| Cristallo di Risonanza · Haumea | 100 | L02 · Singolarità |
| Nucleo Magmatico · Io | 110 | L03 · Titano Ossidiana |
| Sovrano del Vuoto · Encelado | 120 | L04 · Arca Astrale |

Questa è la scelta del **corpo madre tra i 17 modelli esistenti**, NON la promessa che ogni boss abbia già un nuovo modello esclusivo. Rimangono le dodici arene, i piloti, i mazzi numerici, le abilità esclusive e le 42 armi integrate. Il motore 3D legacy conserva la sua compatibilità storica; PvP e modalità non boss restano invariati.

## 2. Correzione della disparità nei primi nove settori

Nel gioco precedente i normali avversari iniziali ricevevano spesso **C01, C04, R03, R02** già nei settori 1–9, mentre il giocatore iniziava da N00 e sbloccava C01 solo al 3, C02 al 6, C03 al 9. Inoltre l'NPC aveva un mazzo tattico di 24 speciali con Scansione, Contromisura e Riparazioni, anziché il mazzo iniziale di 24 speciali realmente dato al giocatore.

La patch ufficiale, **solo settori Terra 1–9**, usa:

| Settori | Madre NPC | Speciali NPC |
|---|---|---|
| 1–3 | N00 · Aurora-0 | 24 speciali iniziali |
| 4–6 | C01 · Lince Solare | 24 speciali iniziali |
| 7–9 | C02 · Vespa di Vetro | 24 speciali iniziali |

Il modello NPC non segue la carta scelta dal giocatore e non usa una nave che il giocatore non avrebbe ancora potuto ottenere. Il primo boss Terra settore 10 ha invece la madre boss C03 e conserva **tutto** il suo mazzo e le sue abilità autentiche. Il mazzo nemico dei settori successivi al 9 non è stato cambiato.

Test diagnostici: `src/officialEarlyCampaignViability.test.js`, `src/officialEarlyCampaignCounterfactual.test.js` e `src/officialBossMotherShips.test.js`.

**Avvertenza di design:** le madri NPC si ripetono in gruppi di tre: non è la varietà visiva finale ideale. La correzione privilegia una curva d'accesso senza navi Rare anticipate. Gli scontri introduttivi restano da collaudare con una persona, e la differenza fra IA e tattica umana è significativa.

## 3. Tre campagne Terra veramente giocate dalla simulazione

`src/officialFirstPlanetRealRun.test.js` riproduce **tre percorsi indipendenti** dei settori 1–10, senza dichiarare vittorie inesistenti:

- All'inizio: N00 L1, **100 Polvere**, pilota starter reale e 24 speciali starter.
- Ogni scontro usa il duello simultaneo ufficiale e l'IA locale, risolvendo entrambi gli ordini fino a vittoria/sconfitta/pareggio.
- **Soltanto dopo una vittoria** riscuote la vera Polvere del settore, il credito pacchetto e l'eventuale navicella milestone 3/6/9.
- Le sconfitte concedono soltanto la **telemetria realmente prevista** da `calculateTelemetryOnDefeat`; i pareggi non concedono premi.
- Scelta esplicita del giocatore simulato: usa la nave sbloccata più recentemente, acquistando al massimo L3 se il portafoglio lo consente e conservando almeno 100 Polvere. Nessun upgrade o equipaggiamento è regalato.
- **I pacchetti non vengono aperti**, non vengono introdotte Carte Boss o Epiche anticipate, e non sono assunte capsule o missioni bonus.
- Il boss Terra, raggiunto veramente dopo i nove settori, mantiene l'arena e la sua abilità. Soltanto alla vittoria viene riscattata la sua vera Carta Personaggio, posseduta ma non equipaggiata gratuitamente.

### Risultati della simulazione

| Seed iniziale | Settori vinti | Sconfitte prima del completamento | Pareggi | Tentativi boss Terra | Nave contro Terra |
|---|---:|---:|---:|---:|---|
| 37 | 10/10 | 3 | 6 | 7 | C03 L3 |
| 113 | 10/10 | 13 | 11 | 12 | C03 L3 |
| 397 | 10/10 | 17 | 7 | 11 | C03 L3 |
| **Totale** | **30 vittorie** | **33** | **24** | **30 tentativi boss** | — |

Sono **87 combattimenti reali del motore**, includendo le ripetizioni per sconfitta o pareggio. Le vittorie in ciascun settore sono certificate dal risultato del motore: i premi non vengono dati prima. Questo test non implica che le 87 partite siano state giocate da persone, né che la difficoltà sia perfetta. Le **7–12 prove del primo boss** segnalano un problema di ritmo/fatica da valutare.

Codice: `src/officialFirstPlanetRealRun.test.js`, log `ECLISSI_TERRA_REAL_1_TO_10`. La regola limite dell'esperimento è 48 tentativi per settore; le tre traiettorie sono concluse senza raggiungerlo.

## 4. Verifiche e limiti

- `src/officialBossMotherShips.test.js` verifica 12 identità distinte e stabili su **17 navicelle**, livelli L1/L5, modelli e firme, nessuna ricompensa boss assegnata prima, e percorso 3D legacy invariato.
- `src/officialEarlyCampaignCounterfactual.test.js` conserva il confronto con il vecchio selettore come **diagnostica**, senza riattivarlo nel gioco nuovo.
- Le prove automatiche non sostituiscono **collaudi Android, animazioni sul dispositivo, abilità manuali e playtest con persone**.
- Restano aperti bilanciamento dei boss 2–12 con equipaggiamento veramente conquistato, durata dei combattimenti (obiettivo boss 10–12 minuti), varietà delle prime battaglie, piloti, Carte Speciali acquisite e resa visiva dell'avaria reale.
- **Non modificare** la plancia 9:16 metallica, la nave centrale, le due scudiere laterali, il mazzo numerico da 52, lo speciale da 24, i 7/5 slot, le 42 armi o le 12 arene boss.

[Ultima pipeline verificata (786 test e preflight)](https://github.com/marcoteghini1988-ai/test7/actions/runs/42503660074).
