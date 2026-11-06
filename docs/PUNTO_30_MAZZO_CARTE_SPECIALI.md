# Eclissi Stellare — Punto 30: collezione e costruzione del mazzo speciale

**Data:** 6 novembre 2026. **Repository unico di sviluppo:** `marcoteghini1988-ai/test7`, ramo `main`.  
**Stato:** inventario, deckbuilding, pacchetti ricompensa, due nuove carte supporto, combinazioni e IA implementati come prototipo. **Prezzi, rarità, premi e bilanciamento ancora provvisori**. Non sono stati introdotti acquisti né costi in denaro reale.

## Due mazzi definitivamente distinti

| Componente | Regola attuale |
| --- | --- |
| Mazzo numerico | 52 numeriche reali (4 semi × 13), mano di **7**, riutilizzo degli scarti nelle nuove battaglie |
| Mazzo speciale | **24 carte equipaggiate** selezionate dall'inventario, mano separata di **5**, ripescaggio immediato dopo ciascun utilizzo |
| Copie | Max **6 copie dello stesso tipo nel mazzo**, senza superare il totale posseduto |
| Modifica | Editor nell'**Hangar** e nella configurazione flotta prepartita; il salvataggio si applica al prossimo duello (o al nuovo schieramento) |
| Persistenza | Collezione speciale separata da quella delle navicelle: `eclissi_special_collection_v1` in localStorage |

La composizione iniziale resta **24 carte**: 4 copie di ciascuna delle prime 6 tipologie. Il giocatore **possiede** quelle 24 carte. Le due tipologie di supporto partono con **0 copie** e si ottengono aprendo pacchetti; non vengono inserite gratuitamente in mano.

La composizione desiderata va salvata come esattamente 24 elementi; la visualizzazione mostra `equipaggiate/possedute` per tipo. Non si possono equipaggiare carte non possedute. Le copie doppie sono reali: il gioco genera istanze distinte per ciascuna carta, non condivide un unico oggetto attraverso più slot. A fine pesca speciale vengono riutilizzati soltanto gli scarti.

## Otto tipologie di speciali operative

| Tipo | Ruolo | Vincolo |
| --- | --- | --- |
| Fusione Barriera | Fusione madre/scudiera difensiva | Richiede 100 Sincronia e scudiera pronta |
| Fusione Assalto | Fusione offensiva | Richiede 100 Sincronia e scudiera pronta |
| Copertura Tattica | Scudiera 1 intercetta il prossimo colpo alla madre usando il proprio scudo | Una copertura alla volta, massimo 15 s |
| Colpo Perforante | Parte dell'attacco evita l'intercettazione delle scudiere | Non attraversa lo scudo generale né la firma matematica |
| Impulso Ionico | Riduce temporaneamente l'intercettazione automatica avversaria | Soltanto dopo colpo reale allo scudo madre |
| Corrosione | Rende più vulnerabile lo scudo contro il prossimo colpo | Un solo successivo impatto efficace entro il tempo |
| **Riparazione Scudo** | Consuma una speciale per riparare fino a **20 HP** dello scudo generale della madre | Avaria del generatore dimezza l'efficacia; generatore KO o scudo pieno impediscono il consumo |
| **Pulizia Sistemi** | Consuma una speciale per rimuovere Ionizzazione e/o Corrosione in corso | Non utilizzabile se non c'è alcun effetto negativo attivo |

La quantità di riparazione è un valore di prova, non definitivo. Nessuna nuova carta altera il risultato delle operazioni matematiche, crea munizioni numeriche, ripara componenti KO o produce automaticamente poteri dai semi.

## Combinazioni speciali

Le tre carte offensive già esistenti possono essere armate in **coppie diverse** per una stessa scarica:

- **Breccia Ionica:** Perforante + Ionico.
- **Frattura Corrosiva:** Perforante + Corrosione.
- **Disgregazione Ionica:** Ionico + Corrosione.

La combinazione applica **i due effetti già definiti**, senza moltiplicatori bonus, durata extra o effetti nascosti. Sono richieste e consumate **due vere carte speciali**. Le carte uguali non si sommano; non si possono armare tre effetti contemporaneamente.

Le altre speciali, incluse riparazioni e fusioni, funzionano separatamente con i propri limiti; non esistono ancora fusioni triple o nuove combinazioni arbitrarie.

## Pacchetti e acquisizione, senza monetizzazione

- La **prima vittoria** in un determinato settore di **Campagna** o **Avventura** assegna **un credito pacchetto**, al completamento e uscita dalla battaglia.
- La vittoria ripetuta nello stesso settore non assegna un altro credito. Un settore diverso può assegnarne uno nuovo.
- Una battaglia di prova, un pareggio o una sconfitta non assegna crediti.
- Nell'Hangar è presente **APRI PACCHETTO · 3 CARTE**, utilizzabile soltanto se è disponibile un credito.
- Ogni pacchetto aggiunge **tre copie reali** all'inventario; possono essere dello stesso tipo. Il mazzo equipaggiato **non cambia automaticamente** dopo l'apertura.
- Nel prototipo tutti gli **otto tipi** hanno la stessa probabilità di estrazione. Rarità, economie, prezzi, condizionamenti per boss e pacchetti tematici sono ancora **da decidere**.
- L'attribuzione del premio salva l'identificativo del settore già premiato, evitando la ripetizione automatica. I dati della collezione delle navicelle restano inalterati.

**Non è stato realizzato un acquisto di pacchetti in Shop.** Il sistema supporta pacchetti gratuiti guadagnati giocando; il futuro Shop potrà collegarsi a queste operazioni soltanto dopo la definizione della sua economia.

## IA e partita reale

Le speciali del mazzo salvato sono usate nell'inizializzazione della nuova battaglia. Il rivale riceve, nel prototipo, la stessa distribuzione equipaggiata, ma un proprio mazzo mescolato e una propria mano: non può giocare carte che non possiede. L'IA dispone ora anche della possibilità di giocare **Riparazione Scudo** e **Pulizia Sistemi** quando utili e disponibili; ogni azione consuma una carta.

Il mazzo da 7 numeriche continua a essere separato, così il sistema matematico non rimane bloccato dalla pesca di sole speciali.

## File e controlli

- `src/specialDeckBuilder.js`: inventario, limiti copie, valida/salva mazzo, credito ricompensa e pacchetti con copie reali.
- `src/SpecialDeckPanel.jsx` e `src/SpecialDeckPanel.css`: editor utilizzabile da Hangar e configurazione della flotta.
- `src/ShipCollectionPanels.jsx`: accesso dall'Hangar.
- `src/MathDuelBattle.jsx`: composizione salvata, IA, combo, ricompense uniche per settore, supporti giocabili.
- `src/mathDuelEngine.js`, `src/specialCards.js`: inizializzazione dell'esatto mazzo selezionato; limite copie e consumo effettivo.
- `src/specialSupport.js`: riparazione scudo e cancellazione status esistenti.
- `src/strategicShots.js`: identificazione delle combinazioni compatibili senza potenziamenti impliciti.
- `src/specialDeckBuilder.test.js`, `src/specialSupport.test.js`, `src/specialCards.test.js` e `src/strategicShots.test.js`: proprietà, salvataggi, duplicati, pacchetti, protezioni, consumo carta, supporti e combo.
- **295/295 test automatici riusciti**, compilazione React/Vite e preflight eseguiti su `test7/main` durante lo sviluppo del punto 30.

## Conferma successiva — Punti 33 e 35 (6 novembre 2026)

La dimensione di **24 speciali equipaggiate** e il massimo di **6 copie per tipo** sono stati confermati come regole, senza cambiare i salvataggi esistenti. Il motore di combattimento è la fonte unica dei due valori e il builder li riesporta, così editor e partita non possono divergere per errore. I pacchetti da tre carte, le probabilità uniformi e le regole economiche rimangono invece soggette ai playtest del punto 36. Verifiche aggiunte in `src/specialDeckBuilder.test.js` e `src/specialFlow.test.js`.

## Da provare e completare

- Collaudo della scelta del mazzo e dell'apertura dei pacchetti sullo schermo 9:16, inclusa persistenza fra riavvii.
- Economia dello Shop, rarità dei pacchetti, acquisizioni permanenti avanzate e conversione dei doppioni.
- Nuove famiglie di speciali e combo che siano realmente differenti, compatibili con i ruoli di ciascuna flotta.
- Allineamento con i boss e i loro mazzi; eventuali premi diversi per rarità/livello.
- Bilanciamento delle copie e del ritmo usando i rapporti di fine partita, non soltanto i test.
- Grafica, effetti 3D e audio definitivi rimandati fino al consolidamento delle meccaniche.

**Continuità:** sviluppare direttamente `test7/main`, senza creare altri repository o rami-copia.
