# Durata indicativa delle partite e bilanciamento delle carte confermate
19 novembre 2026 — Eclissi Stellare.

## Decisione aggiornata
PvP 4–6 minuti e Boss 8–10 minuti sono riferimenti medi di progettazione, non soglie che ogni partita deve rispettare. Il giocatore puo' creare mazzi offensivi, difensivi, di controllo, energia e fusione; alcune partite termineranno prima e altre dopo. Anche carte non ancora progettate sposteranno queste stime.

L'aumento automatico del danno in base al tempo trascorso, inserito durante una prima serie di simulazioni, e' stato **disattivato**. Non vogliamo che una partita difensiva perda la sua identita' dopo 3 minuti o che una partita termini perche' l'orologio impone danni diversi. Il danno dipende dalla flotta, dalle carte e dalle scelte, non dai minuti passati.

## Cosa resta bilanciato ora
- Le statistiche delle dodici madri, l'elemento e la resistenza intrinseca dei boss possono essere diversi.
- Le Carte Attacco esclusive sono state portate alla nuova scala HP. Le Armi temporanee conservano formula, durata e slot; Energia, Trappole, Difese e Fusioni mantengono effetti confermati.
- I Personaggi e i Terreni sono **esclusi dal bilanciamento di questa fase** e saranno decisi successivamente.
- Le statistiche dei tredici supporti restano nel bilanciamento esistente.
- Non ci sono nuove regole che rendano obbligatori i 4–6 minuti nel PvP o gli 8–10 contro i boss.

## Verifica
Le simulazioni in `src/fleetNextApprovedBalanceAudit.test.js` controllano turni, HP, vittorie e distribuzione dei tempi per combinazioni variabili di mazzi, ma non richiedono che ogni partita rientri nella finestra. E' corretto che alcuni mazzi e alcune strategie producano durate anomale: serviranno per ulteriori regolazioni, quando tutte le carte esisteranno. Il PvP reale e' ancora simulato; i risultati dell'IA sono indicativi.
