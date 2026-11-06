# Eclissi Stellare — Punto 44: atmosfera dinamica e arene boss

Implementazione del 6 novembre 2026 direttamente in `marcoteghini1988-ai/test7`, ramo `main`; nessuna copia o refactoring della plancia approvata.

## Obiettivo
Rendere gli ambienti percepibili e strategici, senza inventare attacchi o nuovi colpi, alterare i mazzi 7+5 o sostituire il fondale metallico 9:16.

## Regola condivisa: Calma, Turbolenza, Picco

La condizione è una funzione **pura e deterministica** del numero di attacchi matematici validi complessivi (`battle.round`). Conta l'attacco riuscito da entrambe le flotte, non il tempo di gioco:

| Attacchi validi complessivi | Condizione | Intensità |
|---|---|---|
| 0–2 | Calma | 0 |
| 3–5 | Turbolenza | 1 |
| 6–8 | Picco | 2 |
| 9–11 | Calma | 0 |
| 12–14 | Turbolenza | 1 |
| 15–17 | Picco | 2 |

Il ciclo di nove attacchi si ripete. La condizione di un colpo è memorizzata **al lancio** nell'effetto/proiettile e rimane invariata fino all'impatto, anche se nel frattempo l'altra flotta avanza la fase. Questo elimina exploit basati sui timer o proiettili che mutano potenza in volo.

L'arena base Titanio resta neutra a qualsiasi conteggio. I settori planetari 3–6 mostrano un solo tipo ambientale, 7–9 ne combinano due, il settore 10 ha l'arena del boss con due famiglie e firma visiva distintiva. Non esistono nuove condizioni nei PvP/addestramento, salvo un'eventuale scelta futura esplicita di arena.

## Modificatori all'evento reale

| Famiglia | Calma | Turbolenza | Picco | Requisito invariato |
|---|---:|---:|---:|---|
| Detriti | -8% | -8,8% | -9,6% | Solo impatto su vero scudo madre ancora attivo |
| Plasma | +6% | +7,5% | +9% | Solo scarica con tre numeriche reali e calcolo valido |
| Ionica | -25% durata | -28,5% | -32% | Solo ionizzazione effettivamente applicata da una speciale |
| Risonanza | +1 | +2 | +3 Sincronia | Solo calcolo valido accreditato, massimo 100 |

Tabella relativa alle **arene ordinarie**; le arene boss partono dai fattori esclusivi stabiliti al punto 42 e ricevono la stessa escalation. Il motore applica il limite globale già previsto per attacco e difesa. I bonus non si attivano da soli, non creano HP o carte e valgono simmetricamente per entrambe le flotte.

## Aspetto visivo (CSS animato, senza nuove immagini o dipendenze)
- **Detriti:** polvere dorata, frammenti diagonali, deriva lenta.
- **Plasma:** cortine di luce arancio/rossa ai bordi con respiro intermittente.
- **Ionica:** filamenti di luce azzurro/viola e interferenze diagonali.
- **Risonanza:** cerchi di energia concentrici, pulsazione lenta.
- **Boss:** alone perimetrale colorato e disegno distinto per tutti i dodici pianeti. Motivi: scudi esagonali (Terra), crepe della forgia (Marte), corona solare (Venere), anelli (Saturno), aurora inclinata (Urano), vortice (Nettuno), ombra (Plutone), reticolo di ghiaccio (Europa), doppio astro (Proxima b), frattura (Haumea), magma (Io), colonne di ghiaccio (Encelado).

Le intensità visive seguono le tre fasi. I livelli sono relegati all'area del campo (non coprono carte, pulsanti né HUD), hanno `pointer-events:none` e sono inseriti dopo il fondale ma dietro alle navi. La preferenza di accessibilità `prefers-reduced-motion` disabilita tutte le animazioni.

Un badge indipendente in alto a sinistra mostra **CALMA / TURBOLENZA / PICCO** e il numero di attacchi validi mancanti al cambio. Non è interattivo e ha una descrizione accessibile per gli screen reader. L'indicazione testuale nel pannello **Regole** mostra i valori realmente attivi nella fase corrente, non soltanto le percentuali base.

## Moduli modificati
- `src/battleArenas.js`: `arenaEnvironment`, `arenaPhaseModifiers`, fattori a fase, briefing contestuale.
- `src/MathDuelBattle.jsx`: fase al lancio fissata nel colpo, passaggio a motore e visualizzazione, indicatore in testata e descrizioni nella guida.
- `src/ArenaEnvironment.jsx`, `src/ArenaEnvironment.css`: scene ambientali CSS senza game loop aggiuntivi.
- `src/battleArenas.test.js`: verifiche di fasi, simmetria di regole, condizioni reali, 12 boss, neutralità e tetti.

## Criteri da validare dopo la prova sul telefono
1. Fluidità e contrasto su verticale 9:16; niente oscuramento di scudi, numeri e pulsanti.
2. Leggibilità della fase nella testata e della spiegazione delle regole.
3. Percezione di una differenza tattica concreta, ma non dominante, tra Calma e Picco.
4. Velocità della partita contro l'IA e durata delle boss fight; eventualmente ritoccare le percentuali.
5. Evitare effetti troppo ripetitivi: se la prova pratica lo richiede, sviluppare asset/audio specifici sopra questo sistema senza sostituire il motore.

I test di compilazione non sostituiscono la prova grafica sul dispositivo reale.
