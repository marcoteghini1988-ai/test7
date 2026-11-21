# Plancia — primo passaggio grafico, 21 novembre 2026

La schermata di riferimento definisce qualità e disposizione. Navi, supporti,
armi, mano, scarti e dorso del mazzo sono elementi della partita e dipendono
dall'equipaggiamento del giocatore.

## Modifiche di questo passaggio

- Sostituita la texture ufficiale `arena_titanio_9x16.webp` con la plancia vuota
  approvata in 940 × 1672 pixel. Il tavolo è continuo nella zona mazzi e mano.
- Consolidate in `OfficialApprovedBattleHud.css` le quote delle due formazioni,
  delle due righe di slot, dei mazzi, dei posti Arma, della mano e dei comandi.
  Rimosse le vecchie correzioni sovrapposte e le torrette decorative inutilizzate.
- Adeguate scala e prospettiva della nave del giocatore e dei supporti esistenti,
  mantenendo i modelli scelti e gli ancoraggi fisici del renderer.
- Le sette carte hanno dimensioni uniformi e i comandi non coprono la mano.
- La scena 450 × 800 segue le dimensioni effettive del contenitore tramite
  ResizeObserver, anche durante ridimensionamenti e cambi di orientamento.

Il motore, il catalogo e i salvataggi restano quelli esistenti. Non sono state
aggiunte unità scenografiche: gli spazi Arma vuoti e i supporti non schierati
rimangono vuoti. La mano continua a usare le carte realmente pescate.

## Verifiche

- `npm run verify:logic`: 1766 test superati, zero fallimenti, dopo l'integrazione
  dell'aggiornamento confermato delle Carte Arma.
- Preservata la successiva correzione dei messaggi degli slot arrivata da `main`;
  rieseguiti i 61 test sulle Armi, sugli slot e sui nuovi trasferimenti.
- `npm run build`: superato.
- `npm run preflight`: superato.
- Browser: selezione di Energia Fulmine, conferma del turno, carta nel relativo
  slot, diminuzione della pila e reintegro della mano verificati.
- Formato 390 × 844: plancia completa, sette carte e comandi entro lo schermo.
  Il vincolo temporaneo del contenitore usato nel controllo è stato rimosso.

## Passaggi grafici successivi concordati

1. Rifinitura dei singoli modelli di nave e supporto.
2. Resa grafica di mazzi e carte e dorso ricavato dalla selezione del giocatore:
   il dorso fisso provvisorio attuale deve essere sostituito.
3. Asset specifici e animazioni delle Carte Arma giocate.

La schermata mostrata all'utente è una cattura del gioco funzionante, con i
componenti della partita aperta. La qualità dei singoli asset viene affrontata
nei passaggi successivi.
