# Eclissi Stellare — ultimo vitale Plutone e contromisure per Io

**8 novembre 2026 — sviluppo sul repository ufficiale `marcoteghini1988-ai/test7`, ramo `main`.**

## Diagnosi e criterio di modifica

I precedenti collaudi segnalavano due problemi distinti:
- **Plutone / Signore delle Ombre / settore 70:** nell'ultimo tratto del combattimento il vitale `engine` rimaneva spesso intatto o con 4 HP, mentre generatore, armi e centralina erano già distrutti. Lo scudo madre era già a 0: aumentare i danni o ridurre la rigenerazione del boss non avrebbe affrontato il collo di bottiglia, ossia la ricerca delle formule numeriche per il quarto KO entro 20 cicli.
- **Io / Nucleo Magmatico / settore 110:** il boss è offensivo e il suo ciclo magmatico è **pubblico e fisso**: `carica`, `eruzione`, `raffreddamento`. L'IA prima non adattava le scelte delle **vere** Carte Speciali difensive alla fase d'eruzione.

Non sono stati alterati i 4 vitali da 10 HP, i danni di precisione 6/8, gli HP, le 42 armi, i poteri esclusivi, la plancia metallica 9:16, le dodici madri fisse né i mazzi 52+24.

## Correzioni in produzione

### 1. Ricambio matematico da una o due carte: valore delle formule

`src/tacticalAiExchange.js` ora restituisce gli **indici effettivi** delle carte meno utili a completare una formula sui vitali **già visibili**. Se nel turno viene giocata la Carta Speciale `tactic-numeric-recycle`, l'IA valuta entrambe le numeriche da scartare, anziché sostituire automaticamente lo slot adiacente. Quando non vi sono firme visibili, mantiene la rotazione originaria. La selezione non legge mai l'ordine del mazzo, gli ordini o le carte nemiche, né firme non rivelate.

Esempio verificato dai test: un `3` o un `5` sono da preservare quando una firma visibile richiede il prodotto `15`; la coppia è reale, non un bonus conferito alla carta. Rimangono i limiti di una sostituzione ordinaria o due solo con carta vera e già giocata.

### 2. Scansione solo quando esistono firme ancora nascoste e pertinenti

In `src/tacticalDuelAi.js` la carta `tactic-scan` non è più scelta soltanto perché `ours.seen.length<4`. L'IA verifica se esiste almeno un vitale **vivo, non esposto e non ancora rilevato**. Non vengono consumate Scansioni per quattro vitali già esposti, né per sistemi distrutti. Le firme degli altri sistemi continuano a restare segrete fino alla loro vera esposizione o a una Scansione effettiva.

### 3. Contromisure di Io guidate dal ciclo pubblico

Durante la fase `eruzione` del boss Io, l'IA prende in considerazione in anticipo, **solo se già presenti nella propria mano**, `support-shield-repair`, `tactic-reactive`, `tactic-impact`, `tactical-cover`, `tactic-counter`. Ciascuna carta conserva i propri vincoli originali (generatore attivo, barriera riparabile, scudiera vera, bersaglio esposto, e massimo due speciali/ciclo). Non concede riduzioni al danno invisibili o gratuite; l'effetto dell'eruzione e del raffreddamento del boss non è modificato.

### 4. Le munizioni delle scudiere rimangono carte numeriche reali

Durante la diagnostica è emersa una possibile regressione: **vietare tutte le munizioni scudiera dopo il KO del generatore nemico** riduceva il ricambio naturale della mano e causava un fallimento del test di vincibilità del primo boss Terra. La modifica è stata **scartata e corretta**: la scudiera può ancora consumare la sua carta numerica e ottenere una nuova pescata autentica, ma quando barriera e generatore nemici sono entrambi a zero, l'IA cerca di usare una munizione **meno utile alle firme già scoperte**, preservando le migliori combinazioni per l'ultimo vitale.

Non c'è duplicazione: `src/tacticalDuelAi.test.js` verifica risoluzione reale, 52 numeriche uniche, scarto effettivo della munizione, assenza di utilizzo doppio, e mantenimento della normale potenza delle scudiere quando la barriera avversaria è attiva.

## Confronti oggettivi dopo le correzioni

I numeri sono **simulazioni IA/IA**, non stime di vittoria per una persona. Un mazzo preparato con pacchetti usa solo crediti guadagnati da **precedenti vittorie presunte**, aperti realmente con `openSpecialPack` e poi equipaggiati con `equipSpecialDeck`; le vittorie precedenti non sono simulate in quel test.

| Scenario (5 semi identici) | Risultato precedente V/S/P | Risultato aggiornato V/S/P |
|---|---|---|
| Plutone E03 L5 con starter | 1/2/2 | 1/2/2 |
| **Plutone E03 L5 con mazzo 69 pacchetti** | **2/1/2** | **3/0/2** |
| Io L03 L5 con starter | 0/5/0 | 0/5/0 |
| Io L03 L5 con mazzo 109 pacchetti | 1/3/1 | 1/2/2 |

Le Carte Speciali sono realmente state pescate e utilizzate nel motore. Il confronto è limitato a cinque semi: **non** costituisce una vittoria certa sulla difficoltà di Plutone o Io.

### Io: confronto isolato del momento difensivo (16 semi)

`src/officialIoDefensiveTiming.test.js` esegue 64 duelli A/B, mantenendo stesso seed, boss, configurazione e mazzo. La variante *neutra* non utilizza la fase magmatica per riordinare le carte; la variante *consapevole* protegge la barriera nella fase pubblica `eruzione`. V/S/P:

| Carte possedute | IA neutra | IA attenta all'eruzione |
|---|---|---|
| Mazzo speciale iniziale | 4/9/3 | **5/8/3** |
| Mazzo da 109 pacchetti reali (prima vittoria precedente presunta) | 11/4/1 | 11/4/1 |

La strategia riduce una sconfitta nel campione starter, ma non migliora ulteriormente l'esito del mazzo evoluto: non si promette un risultato universale.

### Regola di regressione Terra

È mantenuto il test di accessibilità del boss Terra con `C03 L3` ottenibile dal settore 9 e potenziamenti acquistabili. L'ultimo campione da 5 semi registra **2 vittorie, 1 sconfitta e 2 pareggi**. La progressione iniziale rimane quindi possibile, ma resta da testare manualmente per evitare eccessivo attrito.

## File interessati

- `src/tacticalAiExchange.js`, `src/tacticalDuelAi.js`: IA matematicamente conservativa, Scanner non sprecato, Contromisure Io, scelta reale delle munizioni scudiera.
- `src/tacticalAiExchange.test.js`, `src/tacticalDuelAi.test.js`: conservazione della mano, carte davvero scartate, informazioni pubbliche, due slot ricambio e legalità degli ordini.
- `src/officialIoDefensiveTiming.test.js`: A/B 64 duelli Io in due condizioni di equipaggiamento.
- Benchmark storici, non cancellati: `src/officialBossStalemateDiagnostic.test.js`, `src/officialBossEarnedPacks.test.js`, `src/officialAiExchangeComparison.test.js`, `src/officialFirstBossProgression.test.js`.

## Ancora da fare

1. Verificare il completamento del quarto vitale di Plutone su altri semi, con confronto **manuale** tra Scansione, Ricambio e utilizzo di scudiera: il successo è migliorato solo nel campione con mazzo evoluto.
2. Per Io, verificare il vero rapporto danni/prevenzione a eruzione, opportunità di Pulizia e Contromisura nei mazzi realmente posseduti; non ridurre i colpi nativi del boss senza prove.
3. Collaudare ritmo/animazioni e controlli reali su smartphone 9:16, che i test GitHub non possono dimostrare.
4. Continuare la scaletta generale sulle carte, piloti, moduli e ulteriori boss solo dopo la verifica di regressione.

**Suite di riferimento:** [GitHub Actions](https://github.com/marcoteghini1988-ai/test7/actions/runs/42514382863), 800 test superati, build Vite e preflight della plancia confermati.
