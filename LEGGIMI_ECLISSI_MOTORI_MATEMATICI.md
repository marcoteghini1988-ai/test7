# Eclissi Stellare — Duello dei quattro motori (React/Vite)

## Progetto sorgente
Questa edizione deriva dal file fornito dall'utente `ECLISSI_STELLARE_R12_GIOCO_COMPLETO_31_10_2026.zip`. Rimangono le directory `src/`, `public/`, i pacchetti R12, gli asset originali e la configurazione React 19 / Vite 6. **Il punto di ingresso `src/App.tsx` è stato sostituito** con `MathDuelApp.jsx`, che non chiama più la plancia Poker. Le vecchie componenti sono conservate nel codice sorgente come archivio tecnico, ma non sono nell'esperienza di gioco attiva.

Non si tratta di un singolo file HTML autonomo. Il file `index.html` è il normale ingresso Vite. Nessun servizio remoto, Firebase o API è richiesto durante la partita. La campagna usa `localStorage`.

## Avvio
- Decomprimere tutto lo ZIP dentro una cartella vuota, preservando `src` e `public`.
- Su StackBlitz: caricare tutti i file mantenendone le directory e avviare `npm install` (se necessario) e `npm run dev`.
- Su PC: Node.js 20+; `npm install`; `npm run dev`.
- Build: `npm run build`.
- Motore: `node --test src/mathDuelEngine.test.js`.

## Regole effettivamente implementate
- Schermo 9:16. Due navi, ciascuna con **quattro motori** `+`, `−`, `×`, `÷`, ciascuno con HP propri.
- Il bersaglio numerico di ogni motore viene rigenerato casualmente a ogni turno. Non viene generato appositamente per le carte possedute.
- Ogni giocatore dispone di un mazzo francese da 52 carte, **sette in mano**. Asso=1, J=11, Q=12, K=13; il seme è visivo.
- Il giocatore tocca un motore nemico, seleziona **due carte**, esegue il calcolo indicato e attacca. Sottrazione e divisione accettano l'ordine invertito quando matematicamente valido. Un attacco riuscito conclude il turno.
- Timer del giocatore: 60 secondi; si ferma durante gli effetti, il turno IA e la schermata di aiuto. L'IA agisce rapidamente invece di attendere un minuto.
- I danni partono dal risultato numerico raggiunto e ricevono eventuali riduzioni/potenziamenti dai sistemi ancora funzionanti. Ogni motore distrutto perde il suo effetto passivo.
- Tre cambi carta per turno con penalità cumulative: 1° −3 HP propri, 2° −3 secondi, 3° +3 HP a un motore nemico. Etere permette un cambio gratuito finché ci sono risorse e carte.
- Il computer dispone delle stesse 52 carte e deve trovare un calcolo possibile con le sue carte; non viene dato un risultato valido gratuitamente.
- Si vince distruggendo **tutti i quattro motori**. Quando il mazzo di uno dei due si esaurisce, la partita termina e vince chi ha la **maggiore percentuale di integrità totale dei motori**; parità = pareggio.
- 30 settori, 6 aree, boss ogni 5 livelli (più HP); ricompense, upgrade HP Hangar, duelli rapidi, audio sintetizzato e salvataggio locale.
- Scie laser animate, bagliori di impatto, numeri danno, scosse delle navi, animazioni dei motori e movimenti della plancia. I nuovi sprite PNG sono nella cartella `public/assets/mathduel/`.

## Asset e grafica
La grafica delle due navi è stata ricavata dalla **bozza verticale approvata** del duello. Le navi sono sprite raster 2D con resa tridimensionale prospettica, animate con CSS, sovrapposte a fondale spaziale e HUD interattivi; **non sono modelli Three.js 3D manipolabili**. Sono inclusi file PNG per navi, carte e impatti, JPG per fondale. L'interfaccia è in italiano.

## Collaudo e limiti
I test automatici del motore verificano carte, bersagli, matematica, sacrifici, Etere, danni, vittorie e decisioni IA. La sintassi JSX/TSX è stata analizzata dal compilatore TypeScript.

**Non dichiarata una build Vite completa**: l'ambiente di generazione non disponeva del pacchetto npm completo e l'installazione dal registro è scaduta. Anche la verifica visiva reale e un collaudo manuale in StackBlitz/Android rimangono necessari. I boss hanno più HP, ma non sono ancora dotati di comportamenti IA unici; questo è un limite di gameplay noto, non nascosto.
