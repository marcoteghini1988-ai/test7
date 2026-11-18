# Eclissi Stellare — carte-navicella indipendenti e Carte Navicella Fusione

> **Aggiornamento vincolante (18 novembre, ultimo criterio):** le Carte Navicella Fusione sono **tutte Leggendarie** e specifiche per modello, rappresentano esclusivamente una navicella **MAX**, e possono essere giocate solo su un supporto già schierato al **massimo livello della sua famiglia**. Non esistono Carte Fusione a livelli intermedi. La regola sostituisce le precedenti ipotesi di rarità differenziata. I livelli massimi seguono provvisoriamente `shipMaxLevel` (ad esempio Aurora L20, Arca L5). Restano due fusioni, una per slot, con HP del supporto invariati. Il metodo per migliorare i supporti fino a MAX e acquisire le Carte Fusione è una fase successiva; al momento i nuovi supporti ottenuti dalla campagna sono al livello 1.
Data: 18 novembre 2026 · repository ufficiale test7, branch main.

## Decisioni funzionali confermate
- I modelli di nave scelti definitivamente sono **13**. Il codice storico contiene ancora **17** ID: l'elenco dei quattro da escludere non è stato identificato con certezza. Non cancellare contenuti, carte o proprietà finché gli ID non saranno ricostruiti.
- Una flotta ha **una nave madre + fino a due navicelle di supporto** scelte nell'Hangar; i due slot si sbloccano con la progressione della campagna, non con gli XP del combattimento.
- I supporti sono **indipendenti dalla nave madre** e mantengono un elemento nativo e una passiva propria.
- La nuova **Carta Navicella Fusione** rappresenta un modello preciso e può stare nel mazzo da 40. Quando viene giocata il giocatore sceglie uno dei due supporti già attivi e **non ancora fusi**. La carta si combina con quel supporto senza creare un ulteriore slot.
- Ogni nave madre, comprese le leggendarie, può usare al massimo **due fusioni** per battaglia, una per ogni slot di supporto; ogni supporto si fonde una sola volta.
- Una fusione conserva **esattamente gli HP correnti, gli HP massimi e le ferite del supporto iniziale**. Non somma HP e non ripara. Conserva la passiva e l'elemento originari, aggiungendo quelli della carta giocata. I numeri e le sinergie saranno bilanciati dopo.
- La Carta Fusione generica e le fusioni esclusive delle tre vecchie madri **non fanno parte del nuovo sistema ufficiale**. I vecchi metodi rimangono nel codice per compatibilità con le partite/test storici.

## Stato attuale nel codice
- `src/fleetNext/supportCatalog.js`: un modello schierabile per ogni ID tecnico storico; le 34 definizioni di supporto vecchie restano recuperabili come **alias di compatibilità**, non nuove scudiere da collezionare.
- `src/fleetNext/supportDeployment.js` e `combat.js`: elemento autonomo del supporto anche quando cambia la madre, due fusioni libere nel ruleset con roster indipendente.
- `src/fleetNext/fusionShipCards.js`: carte Fusione con ID modello, elemento, abilità, testo e identificatore stabile. Attualmente 17 definizioni **provvisorie** in attesa della lista definitiva dei 13; non interpretarle come 17 modelli approvati.
- `src/fleetNext/rules.js`, `nextDeckLoadout.js`, `simpleEffects.js`: registrazione, verifica e possibilità di equipaggiare Carte Fusione **già possedute** nel mazzo da 40. Nessun prezzo/acquisto introdotto: l'acquisizione resta da progettare.
- `src/SupportHangarPanel.jsx`, `src/OfficialFleetBattle3D.jsx`: scelta dei due supporti prima della battaglia; selettore dello slot di fusione quando si gioca una Carta Navicella Fusione, senza sostituire l'arena 3D.
- `src/fleetNext/supportAbilities.js`: mappatura provvisoria di 15 passive ai modelli tecnici, conservando l'operatività delle vecchie alias. I trigger di distruzione riportano ora l'abilità effettiva anche su un supporto fuso.
- `src/fleetNextShipFusionCards.test.js`: test per carte, doppia fusione, elementi e HP.

## Verifiche eseguite durante il lavoro
- Controllo **isolato di funzioni estratte dal codice GitHub**: due fusioni su supporti indipendenti, 2 slot mantenuti, HP non aumentati, 2 passive e 2 elementi registrati. Risultato positivo.
- Controllo **isolato sui moduli reali** di creazione carte, controllo effetti e selezione del mazzo: 17 definizioni tecniche attuali valide, testo dell'effetto coerente e massimo 2 copie per tipo; le carte già possedute sono equipaggiabili nel limite di 40. Risultato positivo.
- **Non certificato**: esecuzione completa di `npm run verify:logic`, `npm run preflight` e `npm run build`. GitHub non ha restituito uno stato CI per i commit controllati. Le vecchie suite delle 34 scudiere e delle fusioni vincolate potrebbero richiedere altri aggiornamenti.

## Da completare prima di immagini e shop
1. Identificare esattamente i 13 ID ufficiali e i 4 ID tecnici da archiviare senza cancellare dati validi.
2. Eseguire la suite completa e correggere le regressioni, anche nel percorso grafico della battaglia.
3. Definire e implementare il metodo di acquisizione delle nuove Carte Fusione e l'integrazione definitiva degli inventari di madre/supporti.
4. Sostituire le tre vecchie esclusive Fusione delle madri con tre altre carte effettivamente diverse, preservando le dieci esclusive per nave quando il catalogo sarà confermato.
5. Solo dopo chiudere bilanciamento HP/abilità/affinità, Shop e immagini/VFX definitivi.
