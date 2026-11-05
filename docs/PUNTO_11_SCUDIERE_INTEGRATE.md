# Eclissi Stellare — Punto 11: madre e scudiere collegate

## Stato confermato al 5 novembre 2026

La collezione conserva **17 carte navicella madre**. Le scudiere non sono nuove carte collezionabili: la madre possiede i propri accessori, che si sbloccano con il suo livello.
- Livelli 1–2: sola madre.
- Livelli 3–4: madre + scudiera 1.
- Livello 5: madre + scudiera 1 e 2.

Il catalogo esistente contiene **42 armi della madre**. Nessuna di esse è stata duplicata nelle scudiere.

## Funzionamento del prototipo attivo

**Campo:** la stessa arena metallica 9:16; la madre continua a usare l'immagine approvata. Compaiono piccole sagome SVG ai lati della madre in entrambi gli schieramenti. Non sono immagini definitive.

**Scudi delle scudiere:** ciascuna ha una barra propria. La loro capacità dipende per ora da una percentuale dello scudo della madre (28% per la prima, 24% per la seconda). La madre non rigenera automaticamente gli scudi.

**Intercettazione:** ogni scudiera con scudo residuo intercetta il 20% del danno diretto alla madre; i danni intercettati vengono realmente sottratti allo scudo della scudiera. Se lo scudo non basta, la parte non assorbita raggiunge la madre.

**Bersagli:** toccando la scudiera nemica il giocatore la seleziona e i colpi la raggiungono fisicamente. Il pulsante MADRE torna a colpire lo scudo generale; i quattro vitali possono essere selezionati dopo le soglie. L'IA può bersagliare scudiere o madre.

**Finale scudiera:** a scudo zero, una formula matematica permette di distruggerla. La prima usa provvisoriamente l'addizione del duello, la seconda la sottrazione. Queste formule non sono ancora le firme fisse e pubblicate dei 17 modelli.

**Fine della battaglia:** si vince distruggendo le quattro parti vitali della madre, anche se le scudiere sono ancora presenti.

## Compatibilità dei salvataggi

Lo schema della collezione resta invariato. Gli oggetti scudiera vengono creati al momento del duello a partire dall'ID e dal livello della madre. Nessuna scudiera è aggiunta agli acquisti, e nessuna carta navicella già posseduta viene cancellata. Nel prototipo nuovo la madre/scudiere viene attivata soltanto se il giocatore ha una sola navicella equipaggiata; una precedente flotta di 2–3 carte continua temporaneamente con il motore legacy.

## Punti ancora da completare

- **17 famiglie di scudiere:** definire identità, immagini 3D coerenti con la madre, palette, caratteristiche, armi/effetti specifici e collisioni visive. Le sagome SVG attuali sono *placeholder* di test.
- **Capacità tattiche distinte:** intercettazione, assalto, supporto e sinergie con la madre; il 20% uniforme non è un bilanciamento definitivo.
- **Firme finali:** requisiti matematici o pokeristici permanenti per ogni scudiera.
- **Danni sul modello:** raccordare le scudiere ai punti fisici della plancia e all'animazione delle armi; regolare l'intercettazione e il comportamento quando la centrale di comando della madre viene distrutta.
- **Hangar/Shop:** sostituire la vecchia formazione da tre carte autonome con una madre selezionata e scudiere automatiche, preservando tutti i salvataggi storici.
- **Carte speciali:** due mazzi separati e loro effetti sulle difese in una fase successiva.

## Verifiche

`src/linkedEscorts.js`: sblocco per livello, presenza, intercettazione e impatti.
`src/linkedEscorts.test.js`: copertura delle 17 madri a ogni livello, assenza di duplicazione delle armi, danni, finale e fine battaglia.
`src/MathDuelBattle.jsx`: controllo dei bersagli e visualizzazione delle scudiere.

I test di logica possono essere eseguiti con `npm run test:combat` e `npm run verify:logic`. La **build Vite/TypeScript e il controllo visivo 9:16 in StackBlitz restano da eseguire**. Questa non è una dichiarazione di funzionamento grafico verificato.
