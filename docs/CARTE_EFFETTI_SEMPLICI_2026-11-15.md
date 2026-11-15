# Eclissi Stellare — revisione completa degli effetti

## Risultato

La revisione copre **391 carte**: 250 generali, 129 esclusive delle 17 navicelle e 12 Personaggi Boss già previsti come trofei della campagna. Ogni carta esegue un effetto esplicito e il testo viene prodotto dalla stessa definizione usata dal combattimento.

I testi al grado base passano da **6.722 a 4.025 parole complessive**, il **40% in meno**. Il testo più lungo contiene **22 parole**. Queste misure includono anche le durate e i requisiti dichiarati. Alcune carte condividono un effetto semplice; non vengono aggiunte condizioni soltanto per renderne diversa la descrizione.

I due audit JSON accanto a questo documento conservano ogni testo precedente e nuovo delle 379 carte generali/esclusive. `src/fleetNext/bossCards.js` conserva la precedente descrizione dei dodici Boss insieme alla nuova regola. Il rapporto semantico separato registra le correzioni delle contromosse e i problemi individuati durante la verifica indipendente.

## Regole applicate

Il lessico comune contiene 16 azioni: potenziare un attacco, ignorare protezioni, colpire più componenti, proteggere, schivare, riparare, rigenerare, contrattaccare, indebolire, bloccare un attacco, rimuovere disturbi, cambiare carte, recuperare una carta, preparare potenza, cambiare Terreno e preparare una Trappola coperta.

La protezione indica bersaglio, numero di colpi e durata; si consuma realmente. Le riparazioni non ricostruiscono componenti o scudiere distrutti. Le reazioni richiedono un danno da un attacco normale: non partono su un colpo bloccato, sui costi delle abilità o sui contrattacchi. Un blocco delle Armi non può fermare due turni avversari consecutivi.

I Personaggi applicano un solo effetto quando entrano e al successivo turno del proprietario. I Terreni giocati durano tre round e hanno una regola pubblica valida per entrambe le flotte. Un Terreno selezionato si risolve prima delle altre carte del turno e può essere annullato prima di entrare. Le affinità ambientali nascoste sono state rimosse. Gli scenari della campagna vengono scelti dal pianeta corretto anche quando non si affronta un boss.

### Difese e Trappole coperte

Su precisazione dell’utente, le Difese comprendono anche Trappole da preparare coperte nel proprio turno. **Ancora di Campo (`gen-077`)** ora dice: «Trappola coperta. Annulla il prossimo Terreno giocato dall’avversario.» Il nome, la rarità e l’illustrazione sono quelli della carta esistente.

La Trappola occupa uno dei due spazi Difesa e conta nelle tre carte e nelle due Difese del turno. Resta coperta finché scatta, senza scadenza automatica. Quando l’avversario gioca un Terreno, una sola Trappola si rivela: quel Terreno non entra e nessuno dei suoi effetti viene applicato. La Trappola e il Terreno annullato vanno negli scarti; il Terreno precedente conserva effetto e scadenza. Un secondo annullamento preparato rimane coperto. I Terreni propri, quello iniziale della campagna e le scadenze automatiche non la attivano.

Due spazi Difesa occupati impediscono di preparare un’altra Difesa, senza scartare le carte già in campo. L’avversario vede il dorso comune; nome, effetto e rarità restano nascosti anche nei tooltip e nel registro. Il proprietario può consultare la propria carta senza rivelarla. All’innesco, una notifica mostra la Trappola e il Terreno annullato.

La selezione delle carte e l’IA non consultano le identità delle Trappole avversarie. Se l’annullamento lascia un Terreno che impedisce una riparazione o una schivata selezionata nello stesso turno, quella carta torna in mano invece di essere consumata.

Gli effetti potenziabili aumentano soltanto la quantità o il numero di bersagli. Il testo e il fronte della carta mostrano il grado effettivo; un miglioramento senza beneficio non può consumare crediti. Il negozio mostra anche l'effetto del grado successivo.

## Identità, mazzi e proprietà

Sono conservati gli ID, i nomi, le rarità, i requisiti delle esclusive, le 17 configurazioni nave, il mazzo iniziale e la composizione dei dieci mazzi pronti. Le sole riclassificazioni sono Fusione della Fenice e Fusione dell'Arca: entrambe curano e sono ora Supporto.

Il mazzo base contiene 40 carte generali o Personaggi Boss ottenuti; le esclusive sbloccate dalla madre si aggiungono automaticamente. Ogni Boss ha una sola copia. I trofei già posseduti vengono riconosciuti dalla collezione precedente senza modificarla; restano sbloccabili con la vittoria sul rispettivo boss, non si comprano, non escono dai pacchetti e non si equipaggiano automaticamente.

Restano la mano da sette carte, i turni da 30 secondi, massimo tre carte giocate e due Difese per turno, una madre e le sue scudiere. Un Personaggio già attivo impedisce di giocarne un altro. Se non c’è già un vincitore, dopo 50 round si dichiara il pareggio; lo stesso vale quando entrambe le navi hanno le Armi distrutte.

Le 18 ricette precedenti rimangono documentate come archivio e non introducono condizioni nascoste: le carte multibersaglio indicano direttamente quanti componenti possono colpire.

## Schermate e immagini

Negozio e Hangar usano ora la stessa collezione e lo stesso mazzo del combattimento. È stato rimosso dall'Hangar l'editor precedente da 24 carte. La mano permette di scegliere il proprio componente per protezione/riparazione, mostra il testo del grado effettivo e rende consultabili le regole, il Terreno e l'abilità del boss. Il catalogo permette di mostrare tutte le 250 generali.

I vecchi Moduli non vengono più venduti come carte utilizzabili nel nuovo mazzo. La Cripta conserva varchi, reliquie, progressione e serbatoio; i sei manufatti restano collezionabili. Sono stati tolti equipaggiamenti e acquisti di effetti da combattimento che il motore attivo non eseguiva. I dati già posseduti, i livelli e le lavorazioni in corso sono conservati; le lavorazioni storiche non offrono accelerazioni a pagamento.

Sono stati rigenerati **649 fronti**: 379 base, 258 varianti dei gradi 2 e 3 delle esclusive, 12 Boss. I testi sono interi e non terminano con puntini di troncamento. I 30 WebP già approvati e le 54 illustrazioni centrali HD restano identici; sui fronti approvati cambia soltanto il pannello testuale sovrapposto. Il manifest distingue la precedente approvazione dell'immagine dalla revisione delle regole.

Le **39 nuove illustrazioni Difesa non sono inserite nel gioco**: attendono l'approvazione dell'utente. I fronti di revisione vengono aggiornati con gli stessi nuovi effetti prima della prossima approvazione.

## Verifica e limiti

La suite completa `npm run verify:logic` ha superato **1.221 test**, senza fallimenti. Dopo le ultime correzioni dell’interfaccia sono stati rieseguiti 76 controlli mirati, tutti superati, insieme a build e preflight. La suite degli effetti del motore attivo comprende 34 test, la risoluzione individuale di tutte le 391 carte e partite automatiche con tutte le 17 flotte.

La revisione delle Trappole aggiunge 17 test del motore e 6 della presentazione, compreso il rendering React reale. Un audit indipendente ha superato altri 8 scenari con tutti i dieci Terreni, conservazione delle carte, persistenza per dodici turni senza innesco, restituzioni in mano, limiti degli spazi e riservatezza delle informazioni.

Sono verificati bersagli, consumo/scadenza delle protezioni, perforazione e scudiere, tutti i dieci Terreni, danni reali, rigenerazione, contrattacchi senza ricorsione, blocchi, potenziamenti, durata dei Personaggi, proprietà dei Boss e assenza di addebiti senza beneficio. Build e preflight sono inclusi nella verifica conclusiva.

Nella revisione iniziale, dieci scenari interattivi con i componenti React reali sono stati provati in jsdom: mano, bersaglio proprio, limite Difese, regole, conferma/IA, catalogo completo, miglioramento esclusiva, Boss nel mazzo, Hangar e area personale. Per le Trappole sono stati verificati altri sette scenari interattivi: selezione/deselezione, preparazione e persistenza, consultazione del proprietario, rifiuto della terza Difesa, dorso e registro avversari anonimi, annullamento del Terreno e rivelazione persistente dopo l’aggiornamento dell’IA. Nessun errore nella console.

I fronti sono stati renderizzati e ispezionati visivamente. La geometria della plancia non è stata verificata con screenshot di un browser: Chromium locale è bloccato dall'ambiente. Queste verifiche dimostrano la coerenza di regole, testi, proprietà e azioni; non costituiscono un bilanciamento competitivo completo delle combinazioni di mazzo.

## Riproduzione

```sh
node --test src/fleetNextSimpleEffects.test.js src/fleetNextCatalogConsistency.test.js src/fleetNextLegacyUi.test.js src/fleetNextTraps.test.js src/fleetNextTrapUi.test.js
node scripts/generate-fleet-card-art.mjs
npm run check:card-art
npm run build
npm run preflight
node scripts/export-simple-card-review.mjs /percorso/Eclissi_391_Carte_Effetti_Semplificati.html
```
