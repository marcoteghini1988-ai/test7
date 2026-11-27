# Eclissi Stellare — prova di bilanciamento: tre timer misti entro 3:30, perdita 2% HP/s

**Data:** 21 novembre 2026  
**Stato:** prova automatica isolata, NON attiva nelle partite ufficiali; nessuna immagine o valore di carta stampato alterato.  
**Fonte eseguibile:** `src/fleetNextWeaponPacingMatrix.test.js`, audit `AUDIT_COMPONENTI_210_*`.  
**Commit di introduzione:** `2c09405babc81ee1fff290b79486a114685821e1`.

## Regole esatte della prova

1. Tre componenti temporizzati: **Arsenale**, **Centralina**, **Plancia**.
2. Durate **diverse per ogni nave madre**, e diverse tra i tre componenti nella stessa nave. Si conserva l'ordine di vantaggio del modello nel sistema precedente: modelli offensivi privilegiano l'Arsenale, altri Centralina o Plancia.
3. L'ultimo dei tre timer termina **esattamente al secondo 210 (3:30)** per ogni nave. Non sono applicati bonus durata di rarità oltre il tetto temporale.
4. Scaduti tutti e tre, la **madre perde il 2% dei propri HP MASSIMI ogni secondo reale**, senza colpire automaticamente i supporti. Non è il 2% degli HP residui.
5. Le penalità di scadenza già confermate **NON** cambiano: Arsenale -30% Armi e da 3 a 2 slot Attacco; Centralina devia 25% dei colpi intercettati alla madre; Plancia blocca la scelta libera del primo supporto e lo slot Personaggio.
6. Generatore usa le soglie già definite (2/4 Carte Energia fisiche) e non è un quarto timer. Nessuno sparo base gratis.
7. Gli HP delle navi, armi, passive supporti e mazzi rimangono quelli del candidato F attuale. Carte Personaggio escluse dalla matrice statistica. L'IA campagna conserva decisioni rapide; **non viene rallentata per simulare cinque minuti**.

## Timer proposti (minuti:secondi)

| Nave madre | ID | Arsenale | Centralina | Plancia | Favorito |
|---|---|---:|---:|---:|---|
| Aurora-0 | N00 | 3:05 | 3:15 | 3:30 | Plancia |
| Lince Solare | C01 | 3:30 | 2:54 | 3:07 | Arsenale |
| Vespa di Vetro | C02 | 3:14 | 3:00 | 3:30 | Plancia |
| Corvo a Impulsi | C03 | 2:51 | 3:30 | 3:11 | Centralina |
| Falco Binario | R01 | 3:30 | 2:51 | 3:01 | Arsenale |
| Manta Ionica | R02 | 2:54 | 3:30 | 3:18 | Centralina |
| Squalo del Vuoto | R04 | 2:47 | 3:30 | 3:06 | Centralina |
| Nefelarca | E01 | 2:52 | 3:30 | 3:17 | Centralina |
| Vortiluce | E02 | 3:30 | 2:47 | 3:05 | Arsenale |
| Eclisse Reale | L01 | 3:05 | 3:30 | 3:18 | Centralina |
| Titano Ossidiana | L03 | 2:48 | 3:30 | 3:10 | Centralina |
| Arca Astrale | L04 | 3:05 | 3:18 | 3:30 | Plancia |

Il favore temporale è distribuito in 3 modelli Arsenale, 6 Centralina, 3 Plancia, coerentemente ai profili di ruolo già presenti. I tre valori di ogni modello sono distinti; ogni modello finisce i tre timer al secondo 210.

## Proprietà matematica verificata

Se una madre ha il 100% degli HP al secondo 210, dal secondo 211 perde
ogni secondo il 2% dei propri HP massimi, quindi il KO avviene al
secondo **260 (4:20)**, se non intervengono cure o altre modifiche.

Se al secondo 210 possiede il 70% degli HP, la sola perdita da timer la
porta a zero entro 35 secondi, cioè **4:05**. Al 50% degli HP il
tempo è 25 secondi, ossia **3:55**. Anche con l'intera vita iniziale,
il requisito *5–6 minuti* è incompatibile con questi parametri
senza ulteriori meccaniche capaci di prolungare la sopravvivenza.

Il test unitario di `advanceTimedComponents` conferma **100 HP al
secondo 210, 98 HP al 211, 0 HP al 260** per ciascuno dei dodici modelli.

## Prova nel motore ufficiale (nuove battaglie `hp-sync-v2`)

Stessi abbinamenti, mazzi, passivi e semi casuali per baseline e
scenario richiesto. **72 PvP e 24 campagna per ciascuno dei due scenari
= 192 battaglie simulate.** Ogni rarità comprende 18 PvP e 6 campagna;
Personaggi assenti.

Nel PvP entrambi gli attori impiegano circa 17 secondi per turno,
nell'audit campagna il giocatore circa 18,6 secondi e la CPU circa 2,3
secondi, comprese ipotesi d'animazione. Non si tratta di partite umane.

| Metrica | Candidato F attuale | Tre timer a 210 s / 2% |
|---|---:|---:|
| PvP: durata media | 318 s (5:18) | **237 s (3:57)** |
| PvP: mediana | 316 s | **236 s** |
| PvP: 5–6 min | 51/72 | **0/72** |
| PvP: KO per deterioramento | 55/72 | **66/72** |
| PvP: KO per danno diretto | 17/72 | **6/72** |
| PvP: pareggi | 1 | **4** |
| PvP: massimo tempo simulato | 374 s | **260 s** |
| Campagna: durata media | 262 s (4:22) | **219 s (3:39)** |
| Campagna: 5–6 min | 8/24 | **0/24** |
| Campagna: KO per deterioramento | 10/24 | **17/24** |
| Campagna: KO per danno diretto | 14/24 | **7/24** |
| Campagna: massimo tempo simulato | 339 s | **243 s** |

### Durate PvP per rarità

| Rarità | Baseline F | Nuova prova |
|---|---:|---:|
| Comune | 302 s | **228 s** |
| Rara | 295 s | **226 s** |
| Epica | 345 s | **249 s** |
| Leggendaria | 329 s | **245 s** |

### Durate campagna per rarità

| Rarità | Baseline F | Nuova prova |
|---|---:|---:|
| Comune | 235 s | **213 s** |
| Rara | 211 s | **199 s** |
| Epica | 311 s | **233 s** |
| Leggendaria | 290 s | **230 s** |

**Nello scenario richiesto, tutte e 96 le partite terminano entro il
secondo 260.** In PvP una su 72 termina prima del secondo 210,
le altre 71 fra 211 e 260. In campagna 5 su 24 terminano entro 210,
le altre 19 dopo, ma non oltre 260.

## Conclusione

**La prova è tecnicamente valida ma non supera i criteri precedenti del
bilanciamento strategico.** Abbassare tutti i timer a 3:30 e applicare
immediatamente -2% HP massimi/s riduce il PvP da 5:18 a 3:57, rende
66 su 72 PvP dipendenti dal deterioramento e aumenta i pareggi.

Se l'obiettivo diventa intenzionalmente una partita di 3–4 minuti con
pressione crescente, il modello è una possibile scelta di design,
pur essendo molto severo. Se resta l'obiettivo 5–6 minuti e la vittoria
deve dipendere principalmente dalle carte, occorre modificare almeno
una delle due condizioni: **istante di inizio del deterioramento** o
**ritmo del 2% ogni secondo** (o aggiungere nuove contromisure di
sopravvivenza, da bilanciare esplicitamente). Non basta differenziare
i tre timer tra navicelle: se tutti si esauriscono a 210 s,
il deterioramento simultaneo mantiene il medesimo limite.

**Decisione operativa:** nessuna modifica alle statistiche attive,
nessuna modifica ai 235 valori candidati Arma o alle immagini.
Questo scenario è documentato e riproducibile nei test. La sua
adozione nel gioco resta una decisione distinta.
