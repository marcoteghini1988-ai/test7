> **AGGIORNAMENTO PUNTO 27 (6 novembre 2026):** il catalogo attuale contiene **sei carte speciali**: Fusione Barriera, Fusione Assalto, Copertura Tattica, Colpo Perforante, Impulso Ionico e Corrosione. Il mazzo tecnico è ancora di 24 carte, ma ora contiene **4 copie per ciascuna tipologia**, non più 8 × 3. Fino a due carte offensive diverse possono armare il prossimo attacco effettivo allo scudo madre. Per le regole aggiornate leggere `docs/PUNTO_27_EFFETTI_STRATEGICI_COLPI.md`. Il resto di questo documento descrive lo stato storico del blocco 22B/25.

# Blocco 22B / fondazione punto 30 — Mazzo numerico e speciale separati

Data: 6 novembre 2026. Numerazione corretta: punto 23 ufficiale = collaborazione tra navicelle; il mazzo speciale appartiene alla scelta Attacco/Abilità (22) e alla costruzione dei mazzi (30). Stato: modulo collegato al combattimento, interfaccia funzionale essenziale, verifiche automatiche riuscite; bilanciamento e collaudo su telefono ancora aperti.

## Regola vincolante
- La fusione madre–scudiera può essere attivata **solo** consumando la relativa carta speciale. La Sincronia piena è necessaria, ma non sufficiente.
- Le sette carte numeriche restano in `side.hand` e `side.deck`; le cinque speciali in `side.specialHand` e `side.specialDeck`. Le mani non si mescolano.
- `src/specialCards.js` è la porta di ingresso alle fusioni via carte. UI giocatore e IA chiamano **la medesima** `playSpecialCard`.
- Quando una speciale funziona, la sua istanza viene scartata e la mano torna immediatamente a cinque; non è imposto un limite aggiuntivo alle pescate.
- Se la fusione non è disponibile (Sincronia, scudiere, centralina, cooldown), **la carta non si consuma**.
- Sono ammesse copie del medesimo tipo. Il mazzo di prova contiene **24 carte**: 8 Barriera, 8 Assalto e 8 Copertura Tattica, quantità tecnica NON definitiva. Gli scarti tornano nel mazzo dopo il suo esaurimento.
- L'IA sceglie la fusione soltanto se ha una carta compatibile nella mano speciale; non può ricorrere al vecchio `startFusion` direttamente.
- Durante la fusione, la scudiera agganciata non riceve munizioni numeriche e non spara autonomamente. Il consumo degli scudi resta reale.

## Due carte esistenti

| Carta | Funzione | Stato |
| --- | --- | --- |
| Fusione Barriera | Aggancia una scudiera alla madre; intercetta parte dei colpi consumando il suo scudo | Logica e mano collegate |
| Fusione Assalto | Aggancia una scudiera; potenzia il tiro della madre contro lo scudo nemico, senza tiro indipendente della scudiera | Logica e mano collegate |

Il sistema delle ulteriori carte strategiche, delle combinazioni di 1–2 speciali e delle abilità per le navi di livello 1–2 è **da progettare e implementare dopo aver fissato le meccaniche**. Il catalogo iniziale di tre carte non costituisce il mazzo definitivo.

## Percorso tecnico

1. `mathDuelEngine.initialBattle`: crea e pesca due mani speciali autonome (giocatore e IA).
2. `MathDuelBattle.jsx`: il pannello MANOVRE cambia formazione, mostra le 5 carte speciali e permette di scegliere una scudiera; il click sulla **carta** attiva la fusione.
3. `specialCards.playSpecialCard`: convalida carta e bersaglio, chiama il motore tattico, consuma la carta solo dopo il successo, reintegra la mano.
4. `escortFiring.js`: instrada le munizioni solo alle armi non agganciate.
5. `fleetManeuvers.js`: valuta durata, Sincronia, cooldown, scudi e danni.

## Valori ancora provvisori
- Sincronia per fusione: 100.
- Durata: 12 secondi.
- Cooldown: 28 secondi.
- Mazzo tecnico: 24 carte, 3 tipologie; la terza è Copertura Tattica, che non richiede Sincronia e usa lo scudo reale della scudiera 1.
- Formazione Guardia/Assalto: percentuali del precedente punto 22.

## Verifiche
`npm run verify:logic` include `src/specialCards.test.js`. La prima verifica completa di questo punto ha superato **193 test/193**, la build `tsc -b && vite build` e il preflight. I test successivi devono confermare anche le modifiche alla documentazione e alla guida.

## Prossime meccaniche, NON ancora concluse
1. Interazioni e abilità cooperative senza fusione.
2. Selezione degli effetti speciali distinti per ruolo/tipo, inclusi gli effetti temporanei e i costi.
3. Risoluzione con 2/3 numeriche e requisiti permanenti per vitali.
4. Carte di supporto non-fusione; combinazioni di due speciali, mantenendo simultaneità della battaglia.
5. Comandante unico e deckbuilding/salvataggi, pacchetti e progressione.
6. Solo dopo: finalizzazione **audio-visiva**, animazioni fisiche, 3D e collaudo grafico.

Riferimento generale: `docs/MASTER_DECISIONI_ECLISSI_STELLARE_2026-11-06.md`.

## Punto 25: Copertura Tattica (correzione al catalogo)
Una terza carta speciale, **Copertura Tattica**, consuma la carta ma non la Sincronia: la prima scudiera protegge la madre dal prossimo colpo entro 15 s, intercettando al massimo il 75% del danno grezzo, limitato agli HP di scudo esistenti. Non può attivarsi durante una fusione o sovrapporsi a un'altra copertura. La versione tecnica dimostrativa ora ha 8 copie per tipo (24 carte totali); il deckbuilding finale resta da progettare. Vedi `docs/PUNTO_25_PROTEZIONE_MADRE.md`.
