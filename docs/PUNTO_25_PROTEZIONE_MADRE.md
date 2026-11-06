# Eclissi Stellare — Punto 25: protezione della navicella madre

**Stato: implementazione logica e interfaccia inserite su `test7/main`; valori provvisori.**
La rifinitura audiovisiva rimane rinviata, come richiesto.

## Tre livelli difensivi distinti

1. **Difesa automatica.** Le scudiere intercettano parte dei colpi destinati alla madre, secondo ruolo, dottrina, scudo residuo e stato della centralina. Lo scudo reale della scudiera perde gli HP effettivamente intercettati.
2. **Formazione Guardia.** Il giocatore può spostare la flotta in assetto Guardia, aumentando le percentuali di intercettazione ma sacrificando parte della potenza offensiva delle scudiere. Non richiede una carta speciale. Cambiare formazione rispetta la ricarica del comando tattico.
3. **Copertura Tattica — nuova carta speciale.** Il giocatore sceglie **Scudiera 1** (difensiva) e gioca una **carta Copertura Tattica** dalla propria mano speciale. Per il primo successivo proiettile diretto alla madre, entro **15 secondi**, la scudiera selezionata può intercettare fino al **75% del danno grezzo**, **sempre limitato al suo scudo residuo**. L'eventuale danno residuo raggiunge la madre e le altre scudiere possono applicare la normale intercettazione. La carta vale un solo impatto che abbia assorbimento effettivo, poi si esaurisce.
   - **Nessun HP aggiuntivo, cura o invulnerabilità.** Il danno assorbito viene sottratto dal vero scudo della scudiera.
   - **Zero costo Sincronia**: è la carta speciale a pagare la manovra. Questo parametro è provvisorio.
   - La carta usata torna negli scarti e la mano separata si reintegra immediatamente a **cinque**.
   - Non può essere giocata se la prima scudiera è assente, con scudo a zero, se la centralina madre è distrutta, se una copertura è già attiva o durante una fusione.
   - Finché esiste una copertura in attesa, una fusione sulla stessa madre non può iniziare. Copertura e fusione, essendo incompatibili, non si sommano.
   - Se la protezione scade senza ricevere colpi, la carta **non torna** in mano; non sono stati persi HP dello scudo.
   - I colpi diretti alle scudiere non consumano l'ordine di copertura della madre.
   - Con 1–2 scudiere presenti, **solo la prima scudiera** può essere assegnata a Copertura Tattica.

## Regole di battaglia e AI

- L'effetto viene risolto all'arrivo del proiettile. Due impatti simultanei si applicano in sequenza allo stato aggiornato; solo il primo può consumare Copertura.
- Anche l'IA deve **possedere e giocare la carta**. La prima euristica automatica cerca una Copertura disponibile **dopo il lancio di un colpo diretto alla madre**, se il danno previsto è almeno `max(12, 15% dello scudo massimo della madre)`. Nessuna carta, nessun bonus.
- La protezione passiva e la formazione Guardia restano disponibili anche se la mano speciale non contiene la nuova carta.

## Carte speciali ora operative

| Carta | Utilizzo | Requisito aggiuntivo |
| --- | --- | --- |
| Fusione Barriera | Madre + scudiera, protezione con scudo reale | Sincronia 100; 12 s |
| Fusione Assalto | Madre + scudiera, bonus contro lo scudo madre avversario | Sincronia 100; 12 s |
| **Copertura Tattica** | Scudiera 1 protegge la madre dal prossimo colpo | Scudo attivo; entro 15 s; nessuna fusione in corso |

Il mazzo **dimostrativo** conserva 24 carte ma distribuite in **8 copie per ciascuno dei 3 tipi**. Questi quantitativi non sono un modello economico definitivo e saranno sostituiti durante il punto 30 (deckbuilding).

## File e controlli
- `src/fleetManeuvers.js`: ordine di copertura, scadenza, assorbimento all'impatto, esclusione delle fusioni contemporanee.
- `src/specialCards.js`: carta `tactical-cover`, controlli di eleggibilità e consumo carta.
- `src/MathDuelBattle.jsx`: selezione scudiera, pulsante sulla carta speciale e IA reattiva.
- `src/motherCover.test.js`: durata, centralina, scudi reali, scadenza, sovrapposizioni, protezione di un solo colpo e incompatibilità.
- `npm run verify:logic`, `npm run build`, `npm run preflight` attraverso GitHub Actions.

## Passaggio al punto 26

La meccanica difensiva di base esiste. Il prossimo passo è definire **danni localizzati e conseguenze funzionali ai quattro vitali**, senza trasformare ogni colpo matematico in distruzione indiscriminata. Il punto 25 rimane aperto per la validazione di giocabilità, bilanciamento e casi limite sulle navicelle L1–L5.

**Importante:** nessun modello 3D o audio definitivo è stato creato in questa fase; la presentazione viene perfezionata dopo le regole.
