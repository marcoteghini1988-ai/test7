# Eclissi Stellare — progressione reale prima dei boss, 8 novembre 2026

## Metodo e confini
Questo audit non assembla un inventario gratuito. Per il boss **Terra settore 10** ricostruisce una *sequenza condizionale di vittorie* ai settori 1–9, riscuote i veri traguardi navi ai settori 3/6/9, accumula la Polvere Stellare dalle formule attive di `App.tsx`/`phase17CampaignDustAward`, usa i prezzi di `shipUpgrades.js`, le 24 carte speciali starter reali e il pilota `pilot_com_1` di grado 1. Le stelle e i premi capsula sono scenari **espliciti** e non vengono finti né riscattati automaticamente. La simulazione presuppone che l'utente abbia superato i primi nove settori: non dimostra la vincibilità delle singole battaglie precedenti.

* Partenza: **N00 L1**, **100 Polvere Stellare** e **24 speciali starter**.
* Navi ottenibili prima del settore 10: **C01** dopo la vittoria nel 3, **C02** nel 6, **C03** nel 9. Non esistono Rare/Epiche/Leggendarie assegnate dal percorso prima del settore 10.
* Prime nove ricompense al primo completamento: **900 Polvere Stellare**. Con 100 iniziali = **1000**, se non sono già state spese e ignorando ricompense opzionali, replay, missioni o sconfitte.
* Potenziamenti comuni L1→L4: **100+180+300 = 580**, quindi **C03 L4** è finanziabile dopo la vittoria nel settore 9, con **420 Polvere** residua.
* Potenziamenti comuni L1→L5: **580+500 = 1080**. Servono almeno altri 80 oltre alle ricompense ordinarie. Se si ottengono almeno 15 stelle e si **riscuote** la prima capsula, essa conferisce 160 Polvere: con due stelle per settore, si raggiungono **1160** totali, si può acquistare **C03 L5** e rimangono **80**. Senza il riscatto, le stelle non assegnano Polvere da sole.
* Le prime nove vittorie assegnano 9 **crediti per aprire pacchetti** speciali, non 27 carte nuove automaticamente. Lo scenario usa solo il mazzo starter e non assume estrazioni favorevoli.
* Le spese alternative possono ridurre la Polvere disponibile: gli importi sopra sono **budget massimo nello scenario dichiarato**, non dotazione garantita per ogni partita.

## Test effettivi sul boss Terra (7 seed ciascuno)
Le cinque flotte sono state costruite tramite vere funzioni di sblocco, acquisto ed equipaggiamento; **nessun L04 regalato**. La campagna conserva l'avversario Terra L1. Ogni duello rispetta 20 cicli massimi, due mazzi autentici, carte e pilota selezionato, vittoria solo a KO dei quattro vitali.

| Profilo | Vittorie | Sconfitte | Pareggi | Cicli medi |
|---|---:|---:|---:|---:|
| N00 L4, 1 stella/settore | 0 | 7 | 0 | 11,14 |
| C01 L4, 1 stella/settore | 0 | 6 | 1 | 12,71 |
| C02 L4, 1 stella/settore | 0 | 6 | 1 | 14,00 |
| C03 L4, 1 stella/settore | **3** | 1 | 3 | 15,71 |
| C03 L5, 2 stelle/settore, prima capsula riscattata | **6** | 1 | 0 | 13,71 |
| **Totale (35)** | **9** | **21** | **5** | — |

I risultati sono **solo IA contro IA**, non collaudo umano o percentuali di successo garantite. Il primo boss è vincibile in queste condizioni senza introdurre buff fittizi; la C03 guadagnata al settore 9 emerge come scelta più efficace delle altre comuni nel campione. **Non nerfare automaticamente Terra**: serve collaudare anche i settori 1–9 e la scoperta nell'interfaccia del potenziamento nave.

## Cancelli di sblocco delle 12 battaglie boss
Il campo `ultima nave teoricamente ottenibile` non dice che il singolo utente l'ha equipaggiata o che possiede risorse sufficienti ad alzarne il livello. Indica solo l'ultima soglia ufficiale già superata **se il giocatore ha conquistato tutti i settori precedenti**. La nave ricevuta per aver battuto il boss **non si può usare per battere quello stesso boss**.

| Boss e settore globale | Ultima nave ottenibile **prima** | Nave eventualmente concessa **dopo** la vittoria del boss |
|---|---|---|
| Terra · 10 | C03 (settore 9) | Nessuna |
| Marte · 20 | R01 (settore 15) | R02 |
| Venere · 30 | R03 (settore 25) | R04 |
| Saturno · 40 | R04 (settore 30) | E01 |
| Urano · 50 | E01 (settore 40) | E02 |
| Nettuno · 60 | E02 (settore 50) | E03 |
| Plutone · 70 | E03 (settore 60) | E04 |
| Europa · 80 | E04 (settore 70) | L01 |
| Proxima b · 90 | L01 (settore 80) | L02 |
| Haumea · 100 | L02 (settore 90) | L03 |
| Io · 110 | L03 (settore 100) | L04 |
| Encelado · 120 | L04 (settore 110) | Nessuna |

Gli ID storici planetari `1,2,3,6,7,8,9,11,14,17,19,20` **non** sono settori globali: il routing di tutti i 12 incontri è quello canonico 10,20,…120.

## Codice e prossimi controlli
* `src/officialFirstBossProgression.test.js`: budget/scenari coerenti con salvataggi, 35 duelli e telemetria `ECLISSI_TERRA10_REACHABLE`.
* `src/officialBossProgressionAudit.js`: query **read-only** sui traguardi realmente sbloccabili prima dei boss, senza cambiare l'inventario.
* `src/officialBossProgressionAudit.test.js`: 12 autentici boss con equipaggiamento acquisibile prima del loro settore, mai dopo; controlla avversario, mazzi e arena.
* Restano da verificare: **sostenibilità di vittoria dei settori 1–9**, i mazzi/piloti acquisiti dopo ogni boss, l'accessibilità economica ai livelli superiori e il bilanciamento umano per i boss 2–12. Gli audit di 108 incontri precedenti usavano anche L04 L5 per confronti tecnici, non per sostenere che fosse disponibile a Terra 10.
* Nessuna modifica a modelli 3D, layout, armi integrate, 9:16, regole di ricompensa, salute vitale o poteri boss.
