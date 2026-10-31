# ECLISSI STELLARE — TATTICA STELLARE 2.1 (React/Vite)

## Quale progetto è questo?

Questa è la **versione React/Vite** ricostruita partendo dal progetto `test-5-main.zip` fornito il 31 ottobre 2026. Non è il gioco HTML autonomo consegnato in precedenza e non si limita a incorporarlo in un iframe o in un componente HTML. Il punto di ingresso resta `src/main.tsx` → `src/App.tsx` → `src/tactical/TacticalStellarApp.jsx`, compilato con Vite. `index.html` è solo il bootstrap previsto da Vite.

La meccanica Poker è stata **sostituita**, non aggiunta come modalità: non ci sono più carte francesi, combinazioni Poker o il vecchio motore dei turni 20+20+30. La nuova interfaccia React usa il fondale animato originale `DeepSpaceUniverseCanvas.jsx`, immagini delle torrette dall'archivio `test-5-main`, le sue sequenze grafiche conservate in `public/` e quattro immagini del precedente pacchetto Tattica Stellare. La plancia è stata **ridisegnata per il gioco matematico**, non è una copia pixel per pixel di quella Poker R9.3.

## Avvio con StackBlitz e GitHub

1. Salva una copia del vecchio repository prima della sostituzione (se desideri poter tornare indietro).
2. Apri `test-5` in GitHub/StackBlitz. Trasferisci **tutto il contenuto dello ZIP** nella radice del progetto (`src`, `public`, `package.json`, `vite.config.ts`, `tsconfig...`, ecc.). Non creare un'altra cartella annidata.
3. In StackBlitz esegui `npm install` se richiesto, quindi `npm run dev`.
4. Sul PC con Node.js: `npm install`, `npm run dev`, poi apri l'URL indicato da Vite. Per produrre la build: `npm run build`.
5. Per la verifica automatica del motore e dei flussi React: `npm run test:logic`.

**Non aprire `index.html` come file locale:** una normale applicazione Vite richiede il server di sviluppo o la build. Nessuna API remota, Firebase o account sono necessari durante le partite. Il browser salva i dati in `localStorage`.

## Regole fondamentali

- 7 carte nella mano; ogni carta ha un numero 1–12 e una famiglia (NOVA, ION, VITA, ETER).
- Ogni turno presenta 3 bersagli, collegati a diversi sottosistemi della nave nemica. Si seleziona il bersaglio e poi 2–4 carte **nell'ordine scelto**.
- Si applica l'operazione richiesta (+, −, ×, ÷) da sinistra a destra; la divisione deve restare esatta. Il risultato deve essere **uguale** al bersaglio. I bersagli non vengono resi automaticamente raggiungibili: i cambi hanno uno scopo strategico.
- Danni base: +10, −12, ×16, ÷20. Le famiglie e i moduli danno bonus diversi; colpire uno specifico sistema modifica anche il comportamento del nemico.
- Primo cambio con sacrificio nel turno: **+3 HP al nemico**. Secondo: **−3 secondi**. Terzo: **−3 HP al giocatore**. Dal settore 15 si può scegliere un cambio per 2 Etere, senza sacrificio.
- Il primo attacco valido termina il turno. In alternativa si può passare e guadagnare 4 scudo. Non bisogna aspettare 60 secondi mentre gioca il computer.
- Turni da 60 secondi, con impostazione da 90; addestramento da 90. Durante la pausa o con scheda nascosta il cronometro è fermo.
- Campagna **120 settori**, 12 sistemi, 12 boss con proprietà speciali. Mappa, Hangar, potenziamento carte, moduli nave, Arena offline, Addestramento, Sfida giornaliera e Registro.
- Progressi conservati nello stesso browser sullo stesso dispositivo. La sfida giornaliera completa non può essere ripetuta per ottenere premi ulteriori.

## Stato dei controlli

- **Eseguiti e superati:** 10 test logici del motore, 1 test simulato della struttura e delle azioni React (mappa, Hangar, potenziamento, attacco). Parsing JavaScript/JSX/TSX controllato senza errori; file CSS analizzato senza errori sintattici.
- **Non verificati in questo ambiente:** installazione delle dipendenze npm da rete, compilazione finale Vite, rendering effettivo di Chrome/StackBlitz, prestazioni su telefono, test giocato di tutti i 120 settori. Per questo lo ZIP rappresenta una versione React integrata con test logici passati, **non** una certificazione di compatibilità grafica sul dispositivo.

## Struttura

- `src/tactical/engine.js`: simulazione e regole, indipendenti dall'interfaccia.
- `src/tactical/TacticalStellarApp.jsx`: intera UI React del gioco.
- `src/tactical/tactical.css`: plancia, responsive, animazioni e menu.
- `src/DeepSpaceUniverseCanvas.jsx`: fondale dal progetto originale.
- `public/assets/weapons` e `public/assets/portal_sequences`: asset del vecchio progetto conservati.
- `public/assets/cards`: immagini importate per la visualizzazione dei potenziamenti.
- `src/tactical/*.test.mjs`: verifiche automatiche.

**Nota:** questa versione è volutamente indipendente dai moduli Poker e dai servizi online delle versioni precedenti. Non dichiara disponibile un PvP reale o una classifica globale non presente.
