# Eclissi Stellare — progettazione nuove carte generiche e mazzi da 40
**Data:** 17 novembre 2026  
**Stato:** regole di progettazione concordate. **NON** equivale a implementazione nel motore.  
**Ambito:** nuovo catalogo comune; immagini rinviate. Non riattivare vecchi cataloghi di carte Attacco/Difesa/Trappola.

## Mazzi
- Un mazzo contiene **40 carte totali**, incluse le esclusive e le carte speciali.
- Una navicella al livello 5 può avere 10 esclusive e quindi 30 spazi per le carte generiche; ai livelli precedenti gli spazi generici aumentano secondo le esclusive sbloccate.
- Catalogo generico condiviso; in seguito si progetteranno mazzi completi preconfezionati.

## Nuova carta generica n. 1: Buco Nero — APPROVATA COME DESIGN
- **Funzione:** Controllo.
- **Rarità prevista:** Leggendaria.
- **Copie nel mazzo:** da 0 a **3**; il giocatore sceglie liberamente 1, 2 o 3 se desidera includerla.
- **Utilizzo:** ogni copia pescata è giocabile; nessun tetto di una sola attivazione per partita.
- **Effetto:** quando viene attivata, il buco nero risucchia **tutte le carte attive sul tavolo di entrambi i giocatori**, comprese Attacco, Difesa, Trappole coperte, Personaggi attivi, Terreno e **entrambe le carte Arma temporanee eventualmente schierate nei due slot**. Le carte rimosse vanno negli scarti del rispettivo proprietario; i loro effetti attivi cessano.
- **Persistono:** nave madre, navicelle di supporto, integrità/danni e componenti distrutti, mani, mazzi e progressione. Il Boss come avversario non sparisce; solo eventuali sue carte attive sul campo vengono rimosse.
- **Senso della regola:** azzera il **campo delle carte**, non l'intera partita; non infligge danni alle navicelle.
- **Da implementare:** creazione dell'ID e dell'effetto di Buco Nero, rimozione reale delle carte/effetti del campo, sincronizzazione visuale e test. Il motore al momento NON applica questa nuova carta.
- **Attenzione al limite copie:** il motore attuale ha un limite generale Leggendaria inferiore a tre; il sistema di costruzione mazzo dovrà rispettare il limite **specifico di tre copie per Buco Nero**, senza correggere arbitrariamente gli altri limiti prima delle decisioni di bilanciamento.

## Regola dei due slot Arma — APPROVATA COME DESIGN
- Due slot per il giocatore, ciascuno ospita una **carta Arma temporanea**, che dà un contributo aggiuntivo all'attacco; le carte Arma **non** sono navicelle o scudi.
- **Non bersagliabili** tramite attacchi ordinari e **non** obbligano l'avversario a eliminarle prima di colpire la madre.
- La durata dipende dalla carta specifica: 1, 2, 3 o più turni, **ancora da definire carta per carta**; non attribuire una durata globale inventata.
- Alla scadenza l'Arma abbandona il campo, cessa di dare bonus e va negli scarti.
- Buco Nero la rimuove immediatamente, anche se non ha esaurito la sua durata.
- Le **navicelle di supporto evolutive**, invece, **devono essere distrutte o rese non operative prima di colpire la madre con un attacco normale**. Le eccezioni di aggiramento restano da verificare caso per caso in fase di integrazione.
- Le esclusive navicella, i Personaggi, i Boss, la grafica 3D e l'Arca non vanno eliminati o riscritti come parte di questa decisione.

## Nota tecnica per l'implementazione successiva
Il motore `src/fleetNext/combat.js` gestisce oggi le due carte tecniche `prog-machine-striker` e `prog-machine-guard` come `deployMachine` in `side.machines`: sono bersagliabili e contribuiscono alla protezione (`protectingFleetUnits`). Questo comportamento è **obsoleto rispetto alla nuova regola dei due slot**. 
La sostituzione deve considerare anche bersagli/UI/IA e le esclusive che fanno riferimento a `machine`, per non compromettere le 120 esclusive. Non dichiarare la regola attiva o testata finché non è stata modificata e verificata completamente.


## Revisione approvata: HP madre, HP supporti e sincronizzazione (17 novembre)
**Direzione di design approvata:** la vittoria dipende dagli **HP della nave madre**, non dalla distruzione di Arsenale, Generatore, Motori/Plancia e Centralina. Le navicelle di supporto hanno HP propri, già presenti nel motore; restano unità fisiche e possono intercettare i colpi. I componenti della madre **non vanno eliminati dai dati o dalle regole**: devono diventare sistemi interni operativi, non più bersagli visibili, e potranno essere temporaneamente disabilitati o disturbati tramite carte.

**Intercettazione percentuale:** la sincronizzazione governa la quota del danno destinata a un supporto che arriva fino alla madre. Esempio confermato: su 20 danni con una penalità del 25%, il supporto riceve 15 e la madre 5. A sincronizzazione integra, il supporto designato intercetta il 100% di quel colpo. L'eventuale perdita di sincronizzazione **non elimina** il supporto; ne riduce l'efficacia. Le interferenze non si sommano automaticamente: si applica la più forte. La durata e la percentuale effettive si decidono nelle singole carte.

**Due slot Arma:** le Armi temporanee danno bonus e non sono bersagli obbligati, non proteggono la madre e saranno rimosse alla scadenza o da Buco Nero. La durata delle nuove Armi non è ancora fissata.

### Stato reale dell'implementazione
- Aggiunto `src/fleetNext/hpSynchronization.js`: regole deterministiche di ripartizione del danno, identificatore `hp-sync-v2`, durata di interferenza e HP iniziali della madre ricavati provvisoriamente dal totale dei vecchi componenti.
- Aggiunta la modalità **opt-in** `ruleset: 'hp-sync-v2'` a `createFleetNextBattle`: la nave madre ha `hp/maxHp`, il danno al componente nella modalità nuova riduce gli HP madre senza distruggere il componente, gli attacchi alle scudiere ripartiscono il danno, le macchine non proteggono né sono bersagli selezionabili, la condizione di vittoria usa gli HP madre. La vecchia modalità rimane il default per i test/regressioni.
- Preparata la plancia a mostrare la barra HP madre e nascondere gli hot-spot dei componenti solo nella modalità nuova; le geometrie 3D della nave non sono state sostituite.
- Creati test mirati `src/fleetNextHpSynchronization.test.js` (danno 20 al 25%, durata, HP, vittoria, alloggiamenti non protettivi).
- **Non ancora completato / non dichiarare il lavoro finito:** le partite ufficiali non attivano ancora `hp-sync-v2`; occorre convertire le vecchie macchine in Armi temporanee con durate per carta, adattare completamente le 120 carte esclusive e gli effetti mirati sui componenti, creare le carte sabotaggio, gestire feedback sul danno trasferito, e verificare test/build end-to-end. Nessuna nuova immagine va prodotta in questa fase.
