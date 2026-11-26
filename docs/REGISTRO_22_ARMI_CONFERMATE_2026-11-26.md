# Eclissi Stellare — consolidamento 22 famiglie Arma

**26 novembre 2026 · main · decisioni progettuali approvate.**

Fonte operativa: [registro strutturato](../src/fleetNext/confirmedNextWeaponDesigns.json). Questa revisione non inserisce carte giocabili, non altera il motore, non modifica i PNG o gli effetti approvati. Serve da specifica unica per le nuove famiglie confermate. Le rarità non definite e le casistiche aperte rimangono esplicite. I dati di bilanciamento sono da stabilire globalmente dopo la progettazione; non trasformare un esempio numerico in valore finale.

## Conteggio famiglie (non varianti)

| Elemento | Nel registro precedente | Nuove progettate | Totale progettate | Mancanti Personaggio | Obiettivo |
| --- | ---: | ---: | ---: | ---: | ---: |
| Fuoco | 10 | 0 | 10 | 0 | 10 |
| Ghiaccio | 10 | 0 | 10 | 0 | 10 |
| Acqua | 8 | 2 | 10 | 0 | 10 |
| Fulmine | 10 | 0 | 10 | 0 | 10 |
| Metallo | 11 | 0 | 11 | 0 | 11 |
| Terra | 4 | 4 | 8 | 2 | 10 |
| Vento | 4 | 4 | 8 | 2 | 10 |
| Luce | 4 | 4 | 8 | 2 | 10 |
| Ombra | 4 | 4 | 8 | 2 | 10 |
| Gravità | 4 | 4 | 8 | 2 | 10 |
| **Totale** | **69** | **22** | **91** | **10** | **101** |

Le 4 storiche sono escluse da questo obiettivo. Metallo conserva l'undicesima famiglia. Il conteggio di Fulmine è quello delle famiglie reali del registro, non un'approvazione delle immagini o una risoluzione delle discrepanze grafiche dei nomi. Le armi Personaggio già previste nel registro precedente e il Disgregatore di Pressione Isobarica hanno sinergie da completare. Le dieci nuove famiglie Personaggio di Terra, Vento, Luce, Ombra e Gravità si progettano insieme ai Personaggi.

## Schede

### Acqua — Condotto di Marea Laterale

- ID progettuale: `weapon-design-20261126-refrigerant-marea-laterale`
- Rarità: Rara → Epica → Leggendaria. Durata: 1 turni propri (salvo finestre indicate).
- Getto Acqua che infligge danno a un bersaglio valido.
- Rara: solo getto dannoso. Epica: getto e Centralina avversaria con deterioramento doppio per 15 secondi di tempo proprio dell'avversario (+1 s/s, +15 s totali). Leggendaria: getto più ampio e deterioramento triplo per 15 secondi (+2 s/s, +30 s totali).
- L'effetto temporale è persistente tra turni avversari; non si resetta al passaggio del turno.
- Da definire/collaudare: Danni per rarità; comportamento se Centralina già rotta; rapporto con timer attuali.

### Acqua — Disgregatore di Pressione Isobarica

- ID progettuale: `weapon-design-20261126-refrigerant-pressione-isobarica`
- Rarità: Rara → Epica → Leggendaria. Durata: 2 turni propri (salvo finestre indicate).
- T1: colpisce un bersaglio valido A con danno D. T2: se A è ancora vivo, colpisce A con 2D; se distrutto, un altro bersaglio valido con D.
- Con Personaggio compatibile: T1 colpisce A e B distinti per D ciascuno; T2 colpisce ciascuno dei due superstiti per 2D, oppure l'unico superstite per 3D.
- Stessa meccanica a ogni rarità; aumentano solo i danni. Esempio non definitivo Rara: D=40 HP.
- Da definire/collaudare: Personaggio compatibile e sua scheda; caso entrambi i bersagli distrutti; danni definitivi.

### Terra — Generatore Sismico Tettonico

- ID progettuale: `weapon-design-20261126-mineral-sismico-tettonico`
- Rarità: Rara → Epica → Leggendaria. Durata: 3 turni propri (salvo finestre indicate).
- T1: consuma 2 Energie Terra e produce un terremoto su tutte le navicelle avversarie.
- T2 e T3: consuma 1 Energia Terra per turno e produce assestamenti più deboli su tutte le navicelle avversarie.
- Se T1 non si attiva, non si attivano gli assestamenti. Se manca Energia, nessun danno, ma il turno trascorre. Scarti dopo T3. Evoluzioni aumentano solo la potenza.
- Da definire/collaudare: Danni e riduzione assestamenti per rarità.

### Terra — Generatore di Tempeste Silicee

- ID progettuale: `weapon-design-20261126-mineral-tempeste-silicee`
- Rarità: Rara → Epica → Leggendaria. Durata: 3 turni propri (salvo finestre indicate).
- Tre stadi consecutivi di tempesta: consumano rispettivamente 1, 2, 3 Energie Terra, colpiscono tutte le navicelle avversarie e rendono inattiva la protezione dei supporti durante l'effetto.
- Danno base, intermedio, triplo. Se manca Energia la tempesta si placa; al successivo turno può riprendere dallo stadio non eseguito, senza saltare livelli. Esempio: se T2 manca, T3 con 2 Energie produce solo lo stadio intermedio.
- La durata non si estende: scarti dopo T3.
- Da definire/collaudare: Danno intermedio/base per rarità e finestra esatta di sospensione della protezione fuori dalla tempesta.

### Terra — Lanciatore di Macigni Tettonici

- ID progettuale: `weapon-design-20261126-mineral-macigni-tettonici`
- Rarità: Rara → Epica → Leggendaria. Durata: 2 turni propri (salvo finestre indicate).
- Un macigno per turno su una navicella nemica valida.
- I frammenti di ritorno provocano un danno totale da contraccolpo diviso equamente fra le proprie navicelle superstiti.
- Con Collettore attivo di pari rarità, i frammenti sono intercettati e il danno alleato viene annullato; il valore recuperato alimenta il Collettore.
- Da definire/collaudare: Danni del macigno e dei frammenti, arrotondamenti e simultaneità per rarità.

### Terra — Collettore di Frammenti Minerali

- ID progettuale: `weapon-design-20261126-mineral-collettore-frammenti`
- Rarità: Rara → Epica → Leggendaria. Durata: 2 turni propri (salvo finestre indicate).
- Da solo colpisce un bersaglio valido per turno.
- In combinazione con Lanciatore di pari rarità intercetta i frammenti, annulla il loro danno alleato, somma il danno recuperato al proprio danno base e divide il totale equamente fra tutte le navicelle avversarie superstiti.
- Da definire/collaudare: Danni per rarità, arrotondamenti e ordine di risoluzione.

### Vento — Generatore di Vortici Ciclonici

- ID progettuale: `weapon-design-20261126-aerial-vortici-ciclonici`
- Rarità: Epica → Leggendaria. Durata: 1 turni propri (salvo finestre indicate).
- Consuma 3 Energie Vento in Epica, 4 in Leggendaria. Raccoglie solo le carte degli scarti avversari e le trasforma in un vortice che si abbatte sulle navicelle nemiche.
- Il danno cresce con il numero di carte negli scarti; ciascuna navicella nemica superstite riceve il valore pieno, non una frazione. Anche se ne resta una sola, riceve il valore pieno.
- Le carte tornano negli scarti. La Leggendaria ha danno superiore.
- Da definire/collaudare: Danno base/multiplicatore e limite per rarità.

### Vento — Turbina a Spinta Eolica

- ID progettuale: `weapon-design-20261126-aerial-spinta-eolica`
- Rarità: da definire. Durata: da definire.
- Infligge un piccolo danno ai supporti avversari e li respinge.
- Gli attacchi alleati successivi, durante l'effetto, puntano direttamente alla nave madre avversaria superando la protezione dei supporti.
- Da definire/collaudare: Rarità, durata, costo Energia e danni delegati al bilanciamento.

### Vento — Boato Cosmico

- ID progettuale: `weapon-design-20261126-aerial-boato-cosmico`
- Rarità: Rara → Epica → Leggendaria. Durata: 1 turni propri (salvo finestre indicate).
- Tutte le navicelle proprie vive (madre inclusa) caricano le posizioni avversarie corrispondenti, non il terreno.
- Scontro singolo: 100% del danno d'impatto alla navicella nemica corrispondente; 25% del danno nominale di contraccolpo alla propria navicella anche se la posizione nemica è vuota. Non reindirizzare lo schianto a un'altra nave.
- Il contraccolpo è sempre subito, anche con B. Il totale dei danni da contraccolpo realmente subiti è disponibile per B nello stesso turno o nel turno proprio immediatamente successivo; poi scade.
- Da definire/collaudare: Danni d'impatto per rarità, arrotondamento e gestione della distruzione propria durante la carica.

### Vento — Convertitore di Energia Cinetica

- ID progettuale: `weapon-design-20261126-aerial-convertitore-cinetico`
- Rarità: Rara → Epica → Leggendaria. Durata: 1 turni propri (salvo finestre indicate).
- Non giocabile da solo né prima di A. Giocabile insieme ad A nello stesso turno (risolve dopo A), oppure nel turno proprio immediatamente successivo.
- Somma i danni da contraccolpo effettivamente subiti dalle proprie navicelle per A e converte quel totale in un singolo attacco contro un bersaglio avversario valido.
- Rispetta la protezione dei supporti. Non guarisce, non annulla il contraccolpo. Consuma una sola volta il totale di A.
- Da definire/collaudare: Taratura per rarità; gestione di più copie di A senza duplicazione del contraccolpo.

### Luce — Cannone a Concentrazione Solare

- ID progettuale: `weapon-design-20261126-radiant-concentrazione-solare`
- Rarità: Epica → Leggendaria. Durata: 1 turni propri (salvo finestre indicate).
- Un solo fascio contro un bersaglio valido. Potenza dipendente dal numero di carte giocate nel turno corrente, arma inclusa: 3 carte potenza normale, 2 carte potenza aumentata, solo questa carta potenza massima.
- Da definire/collaudare: Danni per i tre livelli e per rarità; valutare il conteggio delle azioni effettivamente giocate, non quelle rimaste in campo.

### Luce — Emettitore di Fotoni Riflessi

- ID progettuale: `weapon-design-20261126-radiant-fotoni-riflessi`
- Rarità: da definire. Durata: 1 turni propri (salvo finestre indicate).
- Spara contro un bersaglio valido. Se una Carta Difesa blocca il colpo, recupera parte dell'energia luminosa respinta e la converte in cariche Energia Luce proprie.
- Se il colpo va a segno, infligge il danno normale senza generare Energia.
- Da definire/collaudare: Rarità, danno, quantità di cariche, difesa parziale e gestione slot Energia pieni.

### Luce — Replicatore Olografico

- ID progettuale: `weapon-design-20261126-radiant-replicatore-olografico`
- Rarità: Epica → Leggendaria. Durata: 3 turni propri (salvo finestre indicate).
- A ogni turno proprio per tre turni riproduce l'ultima Carta Arma utilizzata dall'avversario, aggiornandola a ogni turno.
- Se B non è contemporaneamente attiva, danno al 70% (riduzione del 30%). Se A e B sono attive contemporaneamente, danno pieno al 100%.
- Rispetta sempre la protezione dei supporti.
- Da definire/collaudare: Se l'avversario non ha ancora utilizzato armi; replica di armi con requisiti, costi, stati, durata o combo; impedire auto-replica ricorsiva; numeri/rarità della copia.

### Luce — Proiettore Olografico

- ID progettuale: `weapon-design-20261126-radiant-proiettore-olografico`
- Rarità: Epica → Leggendaria. Durata: 3 turni propri (salvo finestre indicate).
- Crea un ologramma di una propria navicella di supporto reale: con due supporti vivi compaiono tre bersagli indistinguibili, mescolati in posizione.
- Se l'avversario colpisce una nave reale, questa subisce normalmente il danno. Se colpisce l'ologramma, questo viene distrutto e restituisce un contrattacco commisurato ai propri HP.
- L'ologramma si rigenera a ogni turno proprio nei tre turni della carta e le posizioni vengono rimescolate ogni volta; HP copiati dagli HP attuali del supporto reale (scelta delegata).
- Da sola restituisce il 70% degli HP dell'ologramma; con A contemporaneamente attiva restituisce il 100%. Il contrattacco rispetta la protezione dei supporti avversari.
- Da definire/collaudare: Se non restano supporti; scelta del supporto copiato; bersaglio del contrattacco, attacchi ad area/multipli e limiti per rarità; UI non rivelare l'identità.

### Ombra — Lanciatore a Eclissi Quantistica

- ID progettuale: `weapon-design-20261126-void-eclissi-quantistica`
- Rarità: Rara → Epica → Leggendaria. Durata: 1 turni propri (salvo finestre indicate).
- Alla giocata il proiettile scompare; il giocatore seleziona segretamente uno dei tre successivi turni propri in cui ricomparirà. L'avversario prova a indovinare quel turno. Entrambe le scelte sono nascoste e bloccate fino alla comparsa.
- Se l'avversario indovina, danno base; se sbaglia, danno maggiorato. Un singolo colpo, protezione dei supporti valida. Lo slot Arma si libera dopo il lancio (proposta originaria conservata).
- Da definire/collaudare: Danno base e maggiorato; tempi di risposta dell'avversario, mancata risposta, momento della scelta del bersaglio e protezione della scelta lato rete.

### Ombra — Disgregatore a Inversione Vitale

- ID progettuale: `weapon-design-20261126-void-inversione-vitale`
- Rarità: da definire. Durata: 1 turni propri (salvo finestre indicate).
- Un colpo il cui danno aumenta con lo svantaggio di HP della propria nave madre rispetto alla madre nemica, fino a un limite massimo.
- Da definire/collaudare: Rarità, danno base, formula della differenza e limite massimo.

### Ombra — Drone Parassita

- ID progettuale: `weapon-design-20261126-void-drone-parassita`
- Rarità: da definire. Durata: 3 turni propri (salvo finestre indicate).
- Si aggancia a una navicella avversaria valida per tre turni e le sottrae HP, accumulando gli HP realmente sottratti.
- Da definire/collaudare: Rarità, danno per turno, bersaglio distrutto, finestra di conservazione della riserva e modalità di consumo da B.

### Ombra — Estrattore di Materia Oscura

- ID progettuale: `weapon-design-20261126-void-estrattore-materia-oscura`
- Rarità: da definire. Durata: da definire.
- Da solo infligge danno normale. In combinazione con A recupera gli HP accumulati dal Drone e li usa per riparare una propria navicella.
- Da definire/collaudare: Rarità, durata, danno autonomo, limite cura, esatta finestra e consumo; la cura non può superare HP massimi.

### Gravità — Generatore di Massa Inerziale

- ID progettuale: `weapon-design-20261126-gravity-massa-inerziale`
- Rarità: Epica → Leggendaria. Durata: 3 turni propri (salvo finestre indicate).
- Aumenta artificialmente il peso di una navicella avversaria per tre turni. Più carte l'avversario gioca durante il suo turno, maggiore è il danno per pressione gravitazionale.
- Da definire/collaudare: Danno per numero di carte giocate, conteggio zero, tempistica e cap.

### Gravità — Implosore a Singolarità

- ID progettuale: `weapon-design-20261126-gravity-implosore-singolarita`
- Rarità: Epica → Leggendaria. Durata: 2 turni propri (salvo finestre indicate).
- Crea un piccolo buco nero sul campo per due turni propri.
- Assorbe i proiettili delle proprie altre armi, impedendo loro di colpire. Alla scadenza collassa e libera tutti i danni accumulati maggiorati da un bonus gravitazionale, su un singolo bersaglio avversario valido.
- Da definire/collaudare: Bonus/cap per rarità, gestione armi ad area, condizionali e momento di calcolo del danno assorbito.

### Gravità — Generatore di Oscurità Gravitazionale

- ID progettuale: `weapon-design-20261126-gravity-oscurita-gravitazionale`
- Rarità: Epica → Leggendaria. Durata: 3 turni propri (salvo finestre indicate).
- Un'ombra ricopre porzioni della plancia di entrambi i giocatori: 33% T1, 66% T2, 100% T3.
- A ogni turno infligge a un solo bersaglio nemico valido il danno base moltiplicato per il numero delle carte sul campo comprese nell'ombra.
- Le carte restano sul campo e conservano tutti gli effetti; non vengono distrutte né consumate. Con B attiva a T3, al conteggio si aggiungono gli scarti di entrambi i giocatori.
- Da definire/collaudare: Geometria esatta delle tre porzioni, categorie di carte contate (inclusione dell'arma stessa e del Terreno), danno base, limite e caso zero carte.

### Gravità — Tenebre Infinite

- ID progettuale: `weapon-design-20261126-gravity-tenebre-infinite`
- Rarità: Leggendaria. Durata: 1 turni propri (salvo finestre indicate).
- Giocabile soltanto mentre A è attiva; non ha effetto autonomo. Deve essere presente al terzo turno di A per potenziare esclusivamente il colpo di quel turno.
- Conta tutte le carte negli scarti di entrambi i giocatori in aggiunta alle carte sul campo ricoperto. Gli scarti non vengono rimossi. Il danno risultante è concentrato in un solo bersaglio valido, con normale protezione dei supporti.
- Da definire/collaudare: Finestra esatta in cui può essere giocata per essere presente a T3; cap e regola su compatibilità con A Epica/Leggendaria.

## Passo successivo

1. Progettare Personaggi e le 10 famiglie ancora mancanti; consolidare le sinergie esistenti.
2. Chiudere le casistiche aperte e i valori provvisori senza alterare le decisioni approvate. In particolare Tenebre Infinite è Leggendaria, A è Epica/Leggendaria: non presumere la compatibilità inter-rarità.
3. Integrare le meccaniche nel motore con test per attacchi, supporti, Difese, tempi, Energia, scarti, scadenze, scelte segrete, rarità e entrambi i lati. I profili in questo registro non sono ancora importati in partita.
4. Leggere AGENTS.md e REGOLE_PERMANENTI_EFFETTI_CARTE.md, realizzare le illustrazioni ufficiali, sequenze VFX/SFX/aptica e ottenere l'approvazione visiva prima della connessione al gioco. Collaudare il motore e la partita reale separatamente.

Le vecchie decisioni di bilanciamento si riferiscono al catalogo precedente e non rendono queste 22 famiglie già giocabili. Nessun asset o lavoro parallelo viene sovrascritto.
