# Eclissi Stellare — sistema ufficiale Madre + Evoluzioni (13/11/2026)

## Struttura invariata
Una sola carta di navicella madre viene scelta fra le 17 possedute. La madre resta al centro, usa gli armamenti ufficiali già integrati e sceglie un sistema vitale avversario per l'attacco del round.

Il modello della madre, il suo livello e le sue carte collezionabili restano gli stessi: NON esistono nuove navi madre aggiuntive. Le due navicelle laterali sono evoluzioni **automatiche** della madre originale:
- L1–L2: madre senza scudiere.
- L3–L4: madre + la prima scudiera (slot sinistro).
- L5: madre + la prima e la seconda scudiera (slot sinistro e destro).

Lo sblocco non dipende dal settore né dal PvP. Il vecchio inventario e i salvataggi della campagna sono conservati. 17 modelli x 2 evoluzioni = **34 SVG originali** sotto `public/assets/escorts/<ID>_escort_1.svg` e `..._escort_2.svg`.

## Come attacca e come si difende
- **Attacca soltanto la madre:** un colpo di flotta per round, proiettato con le sue vere armi. Nessuna scudiera esegue una seconda salva autonoma.
- La madre nemica è sempre il bersaglio selezionato. I suoi **4 vitali** (Motori, Armi, Generatore, Centralina) possono essere attaccati direttamente; non esiste più una barriera generale obbligatoria.
- Due vitali distrutti eliminano la madre e fanno terminare la partita, anche se una scudiera è ancora viva.
- Ogni scudiera ha salute propria, una passiva, un ruolo e un collegamento a **specifici** vitali della madre. Si può spezzare un legame distruggendo il componente necessario; non tutto dipende dalla centralina.
- I supporti **difensivi** specializzati (es. Scudo del Vuoto, Ala titanica) possono assorbire **interamente** ogni salva destinata alla madre finché hanno HP: persino il colpo che distrugge la scudiera non produce danni residui alla madre nello stesso round.
- Altri supporti **non** intercettano sempre: possono riparare una frattura, disturbare il colpo nemico, rinforzare un attacco, agevolare un vitale specifico, produrre risonanza ionica, corrosione o ricambio di carte.
- La salute di una scudiera corazzata può essere maggiore dei 4 danni vitali complessivi che basterebbero a eliminare la madre. Questo crea davvero una scelta fra protezione e aggressione.
- Nessuna riparazione ripristina una parte **distrutta** (stato 2); soltanto una frattura (stato 1) o HP residui di un supporto non distrutto.

## Catalogo delle 34 passivE delle evoluzioni
Le identità e le immagini sono quelle originali di `src/escortArmory.js`. La tabella riassume **nuove funzioni passive** in `src/fleetEscortSupports.js`, non nuovi modelli da collezionare.

| Madre | Evoluzione L3 | Effetto | Evoluzione L5 | Effetto |
| --- | --- | --- | --- | --- |
| N00 Aurora-0 | Velo Aurora | Copertura a fase | Lancia Aurora | Ricambio tattico |
| C01 Lince Solare | Sentinella Solare | Copertura totale | Lama Rubino | Attacco mirato ai Motori |
| C02 Vespa di Vetro | Prisma Custode | Difesa del Generatore | Trapano di Vetro | Precisione contro Armi |
| C03 Corvo a Impulsi | Corvo Scudo | Disturbo di tiro | Artiglio a Impulsi | Risonanza ionica |
| C04 Dardo Cremisi | Velo Cremisi | Copertura a fase | Dardo d'Ombra | Contrattacco potenziato |
| R01 Falco Binario | Falco Sentinella | Copertura totale | Cannone Binario | Assedio al Generatore |
| R02 Manta Ionica | Manta Barriera | Difesa tattica | Sting Ionico | Risonanza ionica |
| R03 Iride | Iride Scudo | Riparazione madre | Prisma Inverso | Puntamento Centralina |
| R04 Squalo del Vuoto | Scudo del Vuoto | Corazza ad assorbimento totale | Squalo Siluro | Bonus di vendetta |
| E01 Nebulosa | Baluardo Nebulosa | Corazza ad assorbimento totale | Pulsar Nebulosa | Soppressione |
| E02 Tempesta | Fronte Tempesta | Difesa delle Armi | Tuono Doppio | Impulso ionico |
| E03 Fenice | Scudo Fenice | Riparazione vitale | Rinascita Plasma | Bonus su madre ferita |
| E04 Orizzonte | Orizzonte Aegis | Corazza ad assorbimento totale | Orizzonte Lance | Precisione |
| L01 Eclisse Reale | Corona Reale | Corazza ad assorbimento totale | Verdetto Stellare | Corrosione |
| L02 Singolarità | Sentinella Eclisse | Difesa tattica | Ascia del Vuoto | Ionico |
| L03 Titano Ossidiana | Ala del Giudizio | Corazza ad assorbimento totale | Lancia dell'Alba | Assedio alle Armi |
| L04 Arca Astrale | Arca Eterna | Riparazione madre | Sovrana del Crepuscolo | Riparazione supporti |

## Combinazioni
- Madre + scudiera L3: abilità che richiede vitali della madre ancora operativi.
- Madre + scudiera L5: altra abilità, con un'altra combinazione di vitali.
- Madre + entrambe le scudiere: **Formazione triplice**, se le evoluzioni restano collegate e Generatore/Centralina della madre sono operativi.
- Le carte Fusione Gemellare e Trina sono disponibili soltanto con entrambe le scudiere attive e collegate (L5). La Copertura Tattica permette di assegnare temporaneamente un'intercettazione anche a un supporto normalmente non difensivo.
- Gli elementi e le carte speciali modificano solo il colpo della **madre**; possono inoltre difenderla o curare le scudiere, senza creare una barriera universale.

## Stato della verifica
Aggiornati `src/fleetCardEngine.js`, `src/fleetEscortSupports.js`, `src/fleetShipPassives.js`, `src/fleetBossPassives.js`, `src/fleetSpecialProfiles.js`, `src/FleetCardBattle.jsx`, `src/FleetCardBattle.css`, `src/fleetBattleVisuals.js` e i test dedicati.

Controllata la logica con 85 configurazioni di modello/livello e 51 test eseguiti in un harness JavaScript isolato che carica il catalogo del gioco; ciò **non** sostituisce la compilazione Vite e i test completi del progetto su Node. Da verificare inoltre il bilanciamento in partita e la resa 9:16 in un browser reale.
