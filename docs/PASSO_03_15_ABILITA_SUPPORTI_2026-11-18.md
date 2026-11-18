# Eclissi Stellare — PASSO 3: abilità dei supporti

Data: 18 novembre 2026. Repository ufficiale: marcoteghini1988-ai/test7, branch main.

## Implementato nel motore e nella plancia
- Registro delle 15 abilità, distribuite su tutte le 34 navicelle di supporto, con possibili ripetizioni. Ogni unità è indipendente dalla madre per identità e HP, ma mantiene l'elemento della madre schierata.
- Carte Arma: raddoppio del bonus potenza; rigenerazione continua: +0,1 HP/s della madre nel turno nemico; Super-scudiera: 50 HP e restituzione di fino a 25 HP alla distruzione.
- Soppressione Trappole: le Trappole nemiche restano posabili e coperte ma non possono attivarsi; dimezzamento della durata di un Terreno nemico; protezione dagli effetti ambientali negativi principali, mantenendo i positivi.
- Accumulo di fulmini: una carica per turno proprio e scarica dopo tre; Pescata aggiuntiva: +1 carta dopo il refill, senza aumentare le tre giocate consentite; Sacrificio: scelta volontaria solo con almeno l'80% degli HP.
- Veleno reattivo: dopo un colpo al supporto, −0,1 HP al secondo a madre e supporti nemici nel prossimo turno di chi ha colpito; aumento percentuale degli attacchi normali (+25%); aumento Attacco Speciale (+25%); riduzione costo Attacco Speciale (−1 carica, minimo 1), NON degli Effetti Speciali.
- Alla distruzione: pioggia di fulmini elimina le carte Personaggio/Attacco attive in campo avversario; conversione in 2 cariche della barra Energia della madre, senza superare il massimo di quattro.
- Il timer della plancia aggiorna progressivamente le barre HP, e il pulsante Sacrificio compare per il supporto compatibile con almeno l'80% degli HP.
- La Fusione preserva entrambe le abilità dei supporti originali. La seconda fusione dell'Arca resta da reintegrare dopo il trasferimento delle relative Carte Fusione.

## Valori provvisori
Le cifre di cura, danno, percentuali, cariche e durata sono placeholder di bilanciamento, tranne la soglia dell'80% e le condizioni specificate dall'utente. La scelta nell'abilità «pescata o giocata aggiuntiva» è provvisoriamente la pescata. Il sacrificio infligge per il momento il 25% degli HP massimi della madre avversaria per evitare KO automatici con la scala HP non definitiva.

## Test
Test dedicati: src/fleetNextSupportAbilities.test.js, inclusi test di comportamento per rigenerazione, veleno, distruzione, Energia, 80%, fusioni e trappole. La suite completa comprende ancora fixture storiche da aggiornare; non dichiarare verde l'intero progetto se restano fallimenti.

## Successivo
Trasferire le Carte Fusione alle navicelle compatibili, rimpiazzandole nelle 10 esclusive delle madri. Completare acquisti e upgrade di tutti i supporti con bilanciamento HP/XP, poi immagini e animazioni delle carte. La plancia metallica 3D, le 7 carte iniziali e i 30 secondi di turno non sono stati sostituiti.
