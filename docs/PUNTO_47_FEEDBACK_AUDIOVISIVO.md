# Eclissi Stellare — Punto 47: feedback audiovisivo del duello continuo

Aggiornamento 6 novembre 2026. Repository `marcoteghini1988-ai/test7`, ramo `main`. Modifiche **sopra** la plancia metallica 3D in prospettiva 9:16 già approvata. Nessuna riscrittura del motore, nessuna copia del repository e nessuna modifica alle formule matematiche.

## Scelte artistiche

La plancia e le navicelle esistenti rimangono invariati. I nuovi segni sono luminosi e sottili, simili a strumenti di bordo di una nave spaziale: blu ciano per le scariche normali, viola per gli effetti strategici, verde acqua per le fusioni, arancio per danni critici, bianco caldo per una distruzione confermata. Non si aggiungono grandi varchi o fondali sostitutivi.

## Esperienza durante la partita

1. **Ingresso** — mantiene la sequenza di intro già implementata: distribuzione delle sette carte, schieramento della flotta, materializzazione delle navi e attivazione delle armi. Se è una boss fight, nel momento di attivazione compare il nome del boss in quella sequenza.
2. **Lancio di un attacco numerico valido** — le due o tre carte realmente consumate producono un breve flusso visivo con i valori e i semi originali verso la nave giocatore; il mazzo continua a utilizzare il proprio rifornimento numerico reale. L'IA non mostra la propria mano nascosta.
3. **Armi in carica** — quando un calcolo valido non scarica munizioni né produce danno, viene mostrato `ARMI IN CARICA`. Non compare un falso effetto di colpo riuscito.
4. **Salva realmente partita** — con danno reale nel pacchetto di lancio viene mostrato `ARMI IN FUOCO` o `SCARICA TRIPLA`; il feedback riporta il numero delle carte e delle armi attive. I proiettili esistenti mantengono la provenienza dalle rispettive armi, il timing e la posizione del bersaglio.
5. **Arrivo dei proiettili** — il segnale dipende dal risultato del risolutore condiviso del punto 46: `IMPATTO CONFERMATO`, `COLPO RESPINTO`, `SISTEMA DANNEGGIATO`, `SISTEMA DISTRUTTO`, `BERSAGLIO DISTRUTTO`, oppure la speciale applicata. I numeri HP mostrati vengono dal risultato effettivo, non dal danno teorico.
6. **Danni critici** — un anello luminoso compare nella posizione dell'impatto SOLO quando il risolutore comunica davvero un sistema danneggiato/distrutto o la distruzione del bersaglio. Gli status ionico e corrosivo producono un anello secondario specifico solamente dopo `strategicApplied`.
7. **Carta speciale** — soltanto dopo `playSpecialCard(...).played===true`, il giocatore vede il nome della carta realmente consumata con un feedback differenziato per fusione, difesa, colpo strategico o supporto. Gli usi falliti mantengono i messaggi d'errore esistenti senza animazione di attivazione falsa.
8. **Boss** — la barra avversario viene evidenziata con un bordo arancio e un piccolo indicatore BOSS quando è effettivamente equipaggiato un mazzo boss. I valori delle abilità e delle arene restano quelli del motore.
9. **Esito battaglia** — la scheda di vittoria/sconfitta/pareggio già presente riceve soltanto un emblema e un accento cromatico. La logica delle ricompense rimane invariata.

## Suono

Sono state aggiunte piccole varianti sintetiche al generatore Web Audio già utilizzato dal gioco: attivazione carta speciale, ricarica, colpo normale, impatto e colpo critico. Volume basso, durata inferiore a mezzo secondo; nessun campione esterno, download o servizio aggiuntivo. Il suono dipende dal supporto e dalle regole di attivazione audio del browser.

## Accessibilità e prestazioni

- Tutti gli overlay sono `pointer-events:none`: non intercettano ATTACCA, carte, menu o altre azioni.
- `aria-live="polite"` segnala gli eventi di battaglia al lettore di schermo.
- In presenza di `prefers-reduced-motion:reduce`, vengono eliminate le animazioni delle carte e degli anelli critici; resta un messaggio statico breve senza movimento.
- L'animazione dei token delle carte è CSS-only e legata all'identificatore dell'attacco già lanciato: nessun frame loop, nessuna particella WebGL e nessun timer di gioco aggiuntivo.
- Le sequenze originali dei proiettili e le quattro famiglie dell'ambiente planetario non vengono sostituite.
- I segnali usano solo valori, semi, carte e risultati confermati dal motore.

## File aggiunti

- `src/battleFeedback.js`: funzioni pure `spentCardTrail`, `launchBattleCue`, `impactBattleCue`, `specialBattleCue` (solo rappresentazione).
- `src/BattleCombatFeedback.jsx`: overlay per gli eventi e trasferimento delle carte autentiche.
- `src/BattleCombatFeedback.css`: animazioni, evidenziazione boss, emblemi di risultato e preferenze di accessibilità.
- `src/battleFeedback.test.js`: regressioni su requisiti delle cue, dati reali del colpo, nessuna modifica all'esito e rispetto dei vincoli di accessibilità.

## File aggiornato

`src/MathDuelBattle.jsx` integra i segnali nelle fasi reali: dopo l'attacco valido e il consumo numerico, dopo la riproduzione effettiva della speciale e dopo la risoluzione condivisa dell'impatto. Aggiorna inoltre le sfumature dei toni sintetici, la testata boss e la scheda di risultato.

## Limiti da verificare giocando

I controlli `verify:logic`, `build`, `preflight` dimostrano la consistenza del codice, non la qualità della grafica su uno schermo fisico. Il playtest su smartphone deve valutare l'effettiva leggibilità in verticale 9:16, la relazione tra suono e animazione, i picchi di carico con molti proiettili e la durata degli effetti sui dispositivi reali. La versione mantiene gli effetti CSS leggeri apposta per consentire una futura sostituzione selettiva con animazioni più elaborate, se utile.

## Passaggio successivo

Punto 48: verifica dell'esperienza complessiva durante una sessione reale (interfaccia, tutorial, onboarding, comprensione del turno continuo, progressione). Non modificarla nuovamente senza verificare che il nucleo del combattimento rimanga funzionante.
