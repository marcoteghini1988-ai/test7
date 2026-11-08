# Eclissi Stellare — Audit di bilanciamento boss con configurazioni reali

**Data:** 8 novembre 2026. **Repository:** `marcoteghini1988-ai/test7`, branch `main`. Non sono stati modificati arena 9:16, 17 render navicelle, 42 armi native, 12 identità boss, 23 passive, due mazzi 52/24, mano 7+5, o salvataggi degli utenti.

## 1. Lacuna bloccante nelle ricompense, individuata dalla matrice
Nel motore simultaneo erano già registrate otto Carte Speciali tattiche, ma la collezione ufficiale non le includeva. Tra esse **Scansione tattica**, **Contromisura programmata**, **Ricambio numerico**, **Deviazione energia**, **Soppressione scorta**, **Paratia reattiva**, **Carica cinetica** e **Schermo d'urto**. Il giocatore non poteva equipaggiarle con la normale acquisizione, mentre l'IA boss riceveva anche Scansione nei propri mazzi.

- Aggiunte tutte le otto famiglie in `src/specialCards.js`, con effetti già presenti nel motore e identificatori invariati.
- `SPECIAL_PACK_TYPES` cresce **da 17 a 25**; il catalogo completo da **74 a 82**, allineandosi a `TACTICAL_SPECIALS`.
- La migrazione v1 in `src/specialDeckBuilder.js` inizializza **zero copie** per queste carte su tutti i salvataggi esistenti: nessun regalo e nessun equipaggiamento automatico. Gli starter mantengono sei tipi × quattro copie.
- Carta Scansione di un test: due vittorie su settori normali forniscono due crediti; i pacchetti sono aperti con RNG deterministico selettivo per costruire un *fixture di acquisizione possibile*, **non una garanzia** di ottenere Scansione in due pacchetti reali.
- Test `src/tacticalEarnableCardBridge.test.js`: 82 carte in entrambe le fonti, migrazione salvataggi senza distruzione, carta Scansione **pescata/giocata/consumata** e due firme rivelate nel combattimento reale.
- Aggiornato `battleFeedback.js` con segnali coerenti per supporti di ricognizione, reazione e attacco.

## 2. Difetto di progressione: potenziare la nave potenziava anche il boss
In `officialBattleSetup.js`, il rivale assumeva **lo stesso livello della navicella del giocatore** e talvolta cambiava modello quando il giocatore potenziava la propria carta. Questo rendeva le migliorie meno efficaci e il boss di uno stesso settore mutevole.

Correzione limitata al **nuovo motore 3D ufficiale**:
- `officialCampaignRivalScaling.js` distribuisce i livelli avversari sui 120 settori senza consultare l'upgrade: **1–24 L1, 25–48 L2, 49–72 L3, 73–96 L4, 97–120 L5**.
- Il modello avversario è ora selezionato a livello base per la stessa nave/settore, dunque non viene cambiato quando il giocatore potenzia quella nave.
- La scelta rispetta i modelli e gli asset già esistenti; piloti storici, arene speciali, nomi dei 12 boss e loro mazzi rimangono invariati.
- La modalità PvP e il vecchio motore di compatibilità non vengono ribilanciati.
- Test `src/officialCampaignRivalScaling.test.js`: tutte le soglie, 120 settori, invarianti di livello, boss riconoscibili, nessuna scudiera avversaria bonus da upgrade del giocatore.

## 3. Stallo numerico dell'IA
Quando la mano non consentiva una formula, `tacticalDuelAi.js` scartava **sempre lo slot 0**, lasciando bloccate a lungo sei numeriche. Ora il ricambio gratuito ruota sugli **7 slot autentici**, uno per ciclo; se è realmente presente e consumata la Carta Ricambio, può girarne due. Il vecchio stock di 52 carte non cambia. Test `tacticalDuelAi.test.js` di rotazione, legalità e conservazione.

## 4. Benchmark automatico, risultati (NON win rate umano)

`src/tacticalBossBalanceMatrix.test.js`: **213** battaglie riproducibili IA contro IA, seed 18/171/407, 12 boss, combinazioni senza carte illegali e senza crediti fittizi nel gioco. Configurazioni: N00 L1/L3/L5, C01 L3, L04 L5 starter e L04 L5 con quattro Carte Scansione da due pacchetti simulati e mazzo numerico Gaia L1 esplicitamente sbloccato **solo dopo la Terra**.

| Configurazione | Combattimenti | Vittorie A | Pareggi | Sconfitte A | Cicli medi |
| --- | ---: | ---: | ---: | ---: | ---: |
| N00 L1 starter | 36 | 0 | 0 | 36 | 11,6 |
| N00 L3 starter | 36 | 2 | 1 | 33 | 11,0 |
| N00 L5 starter | 36 | 2 | 0 | 34 | 11,8 |
| C01 L3 starter | 36 | 2 | 2 | 32 | 11,7 |
| L04 L5 starter | 36 | 11 | 9 | 16 | 15,7 |
| L04 L5 + Scansione + Gaia L1 | 33 | 13 | 6 | 14 | 15,5 |

Per la matrice dopo questi cambiamenti, le vittorie su **Terra (1/15), Europa (0/18) ed Encelado (0/18)** restano rare o assenti nel campione. I dati non dimostrano impossibilità per un essere umano, ma **non autorizzano a dichiarare il bilanciamento chiuso**. La differenza di prestazioni fra starter e leggendaria conferma che la progressione conta, anche se il ritmo e la difficoltà sono ancora da validare. Il nuovo motore continua a risolvere in massimo 20 cicli; in una partita con 30 s di preparazione e 8 s di risoluzione per ogni ciclo, 20 cicli completi corrispondono a 12m40s teorici (non durata cronometrata reale).

**Verifica di partenza:** GitHub Actions [42489947159](https://github.com/marcoteghini1988-ai/test7/actions/runs/42489947159): **770 test superati su 770**, build e preflight. Le battaglie del benchmark usano ordini dell'IA sui due lati. Non sono playtest fisici, non stimano la probabilità di vittoria di un giocatore reale e non forzano selezioni vincenti.

## 5. Prossime attività da NON saltare
1. Collaudo del primo boss con N00 e **mazzo che il giocatore può realmente costruire entro il settore 10**, distinguendo scenari senza Scansione, con Scansione e con un pilota effettivamente sbloccato. Verificare la reale accessibilità dello Shop e l'acquisizione nei nove settori normali.
2. Studiare una strategia giocatore più efficace dei piani identici dell'IA locale; testare 3–5 seed aggiuntivi e combinazioni di calcolo scelte consapevolmente, senza consultare informazioni segrete.
3. Analizzare Europa e Encelado con i mazzi che dovrebbero essere già ottenuti ai settori 80 e 120 e i bonus autentici di personaggi ed Epici; non ridurre valori su tutte le flotte a caso.
4. Controllare l'esposizione dei vitali sulla plancia Android originale, speciali realmente presenti, scudiere e animazioni senza cambiare coordinate.
5. Confrontare il ritmo delle partite con obiettivo storico circa **10–12 minuti** per i boss, 20 cicli massimi. Ribilanciare eventualmente le sole fasi anomale dopo i playtest.
