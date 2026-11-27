# Progressione delle flotte — 16 novembre 2026

Implementazione nel sistema di battaglia ufficiale `fleetNext`, a partire da `test7/main` (35d7242). Questa revisione aggiorna il codice eseguibile, l’Hangar e i bersagli della plancia.

## Regole implementate

- Dodici modelli principali, ciascuno con cinque livelli. I cinque modelli aggiuntivi del catalogo restano varianti utilizzabili, con proprietà e livelli già acquistati conservati.
- Aurora ha Arsenale e Generatore, senza supporti a nessun livello. Lince introduce la Plancia al livello 3; Vespa introduce la Centralina con il primo supporto.
- Tutti gli slot sono disponibili dal livello 1: tre Attacco, una Difesa scoperta, una Trappola coperta, un Personaggio e due macchine d’assalto autonome.
- Ogni supporto o macchina operativi impedisce agli attacchi ordinari di raggiungere la madre. L’attaccante sceglie quale unità colpire. I danneggiati proteggono ancora; i distrutti o disattivati no.
- Aggiramento raggiunge un componente della madre attraverso le unità protettrici; le Difese restano valide. Perforazione supera una protezione senza aggirare le unità.
- Il Generatore alimenta Difesa e Trappola; alimenta anche il Personaggio finché manca una Plancia separata. La Centralina mantiene collegati i supporti. L’Arsenale distrutto lascia un tiro di emergenza, senza riattivare le carte offensive avanzate.
- Arca Astrale parte con due supporti e due carte Fusione. La riserva 3 si sblocca al livello 3; la riserva 4 al livello 5. La prima fusione unisce 1+2 e richiama 3 se sbloccata; la seconda unisce 3+4. Non ci sono mai più di due supporti sul campo.
- Fusioni e riparazioni non ricostruiscono vitali distrutti. Le fusioni conservano la proporzione dei danni e consumano definitivamente i materiali di quella partita.
- I dodici capitoli della campagna adottano l’ordine sottostante. L’ultimo boss usa Arca Astrale al livello 5. Le ricompense e le carte-navicella già ottenute restano valide.

## I sessanta livelli

Attacco è la potenza base della salva; Corazza riduce la potenza avversaria, con un minimo strutturale di 1 prima degli effetti temporanei. La potenza danneggia supporti e macchine; ogni componente vitale raggiunto perde normalmente un punto. I valori numerici sono una prima taratura, da valutare con partite giocate. G1/G2 sono i gradi dei supporti.

### 1. Aurora-0 — Versatile

Due vitali e nessun supporto evolutivo. Cresce nelle armi e nelle protezioni della madre.

| Livello | Vitali | Attacco | Corazza | Supporti in campo | Riserve | Fusioni massime | Miglioramento |
|---|---|---|---|---|---|---|---|
| 1 | 2 | 2 | 0 | Nessuno | Nessuna | 0 | Arsenale e Generatore; tutti gli slot carte disponibili. |
| 2 | 2 | 3 | 0 | Nessuno | Nessuna | 0 | Arsenale potenziato: +1 potenza di attacco. |
| 3 | 2 | 3 | 0 | Nessuno | Nessuna | 0 | Generatore rinforzato: +1 integrità. Velo di Salvataggio disponibile. |
| 4 | 2 | 3 | 1 | Nessuno | Nessuna | 0 | Corazza della madre: riduce di 1 la potenza degli attacchi nemici. |
| 5 | 2 | 3 | 1 | Nessuno | Nessuna | 0 | Arsenale rinforzato: +1 integrità. Sequenza Zero disponibile. |

### 2. Lince Solare — Assalto leggero

Più potenza e meno resistenza di Aurora. La Plancia rende indipendente il Personaggio; nessun supporto evolutivo.

| Livello | Vitali | Attacco | Corazza | Supporti in campo | Riserve | Fusioni massime | Miglioramento |
|---|---|---|---|---|---|---|---|
| 1 | 2 | 3 | 0 | Nessuno | Nessuna | 0 | Arsenale rapido e due vitali; nessun supporto evolutivo. |
| 2 | 2 | 4 | 0 | Nessuno | Nessuna | 0 | Sovralimentazione solare: +1 potenza di attacco. |
| 3 | 3 | 4 | 0 | Nessuno | Nessuna | 0 | Plancia di comando: il Personaggio ha un proprio componente vitale. |
| 4 | 3 | 4 | 0 | Nessuno | Nessuna | 0 | Arsenale rinforzato: +1 integrità. |
| 5 | 3 | 4 | 1 | Nessuno | Nessuna | 0 | Corazza leggera: riduce di 1 la potenza nemica. |

### 3. Vespa di Vetro — Flotta prismatica

Introduce la Centralina e le prime due navicelle di supporto, mantenendo una madre fragile.

| Livello | Vitali | Attacco | Corazza | Supporti in campo | Riserve | Fusioni massime | Miglioramento |
|---|---|---|---|---|---|---|---|
| 1 | 3 | 2 | 0 | Nessuno | Nessuna | 0 | Tre vitali: Arsenale, Generatore e Plancia. |
| 2 | 3 | 3 | 0 | Nessuno | Nessuna | 0 | Arma prismatica: +1 potenza di attacco. |
| 3 | 4 | 3 | 0 | G1 | Nessuna | 0 | Prima navicella di supporto di grado 1 e Centralina di flotta. |
| 4 | 4 | 3 | 1 | G1 | Nessuna | 0 | Schermatura prismatica: riduce di 1 la potenza nemica. |
| 5 | 4 | 3 | 1 | G1 + G1 | Nessuna | 0 | Seconda navicella di supporto di grado 1. |

### 4. Corvo a Impulsi — Disturbo

Parte con due supporti. Migliora prima il disturbo della prima unità, poi la seconda.

| Livello | Vitali | Attacco | Corazza | Supporti in campo | Riserve | Fusioni massime | Miglioramento |
|---|---|---|---|---|---|---|---|
| 1 | 4 | 2 | 0 | G1 + G1 | Nessuna | 0 | Due navicelle di supporto di grado 1 già in campo. |
| 2 | 4 | 3 | 0 | G1 + G1 | Nessuna | 0 | Scarica a impulsi: +1 potenza di attacco. |
| 3 | 4 | 3 | 0 | G2 + G1 | Nessuna | 0 | Il primo supporto raggiunge il grado 2. |
| 4 | 4 | 3 | 1 | G2 + G1 | Nessuna | 0 | Schermatura elettronica: riduce di 1 la potenza nemica. |
| 5 | 4 | 3 | 1 | G2 + G2 | Nessuna | 0 | Il secondo supporto raggiunge il grado 2. |

### 5. Falco Binario — Pressione offensiva

Armi potenti e Generatore vulnerabile. I supporti sostengono la pressione sui bersagli scelti.

| Livello | Vitali | Attacco | Corazza | Supporti in campo | Riserve | Fusioni massime | Miglioramento |
|---|---|---|---|---|---|---|---|
| 1 | 4 | 4 | 0 | G1 + G1 | Nessuna | 0 | Flotta offensiva con due supporti di grado 1. |
| 2 | 4 | 4 | 0 | G1 + G1 | Nessuna | 0 | Arsenale rinforzato: +1 integrità. |
| 3 | 4 | 4 | 0 | G2 + G1 | Nessuna | 0 | Il supporto guardiano raggiunge il grado 2. |
| 4 | 4 | 5 | 0 | G2 + G1 | Nessuna | 0 | Accelerazione binaria: +1 potenza di attacco. |
| 5 | 4 | 5 | 0 | G2 + G2 | Nessuna | 0 | Il supporto d’assedio raggiunge il grado 2. |

### 6. Manta Ionica — Difesa ionica

Protegge il Generatore e logora l’avversario. Meno potenza iniziale, maggiore resistenza.

| Livello | Vitali | Attacco | Corazza | Supporti in campo | Riserve | Fusioni massime | Miglioramento |
|---|---|---|---|---|---|---|---|
| 1 | 4 | 2 | 1 | G1 + G1 | Nessuna | 0 | Corazza ionica e due supporti di grado 1. |
| 2 | 4 | 2 | 1 | G1 + G1 | Nessuna | 0 | Generatore rinforzato: +1 integrità. |
| 3 | 4 | 2 | 1 | G2 + G1 | Nessuna | 0 | Il supporto difensivo raggiunge il grado 2. |
| 4 | 4 | 3 | 1 | G2 + G1 | Nessuna | 0 | Risonanza ionica: +1 potenza di attacco. |
| 5 | 4 | 3 | 1 | G2 + G2 | Nessuna | 0 | Il supporto ionico raggiunge il grado 2. |

### 7. Squalo del Vuoto — Baluardo e contrattacco

Assorbe la pressione con la corazza e prepara la risposta. L’attacco base rimane contenuto.

| Livello | Vitali | Attacco | Corazza | Supporti in campo | Riserve | Fusioni massime | Miglioramento |
|---|---|---|---|---|---|---|---|
| 1 | 4 | 2 | 1 | G2 + G1 | Nessuna | 0 | Supporto baluardo di grado 2 e supporto offensivo di grado 1. |
| 2 | 4 | 2 | 1 | G2 + G1 | Nessuna | 0 | Generatore rinforzato: +1 integrità. |
| 3 | 4 | 2 | 2 | G2 + G1 | Nessuna | 0 | Corazza pesante: riduce di 2 la potenza nemica. |
| 4 | 4 | 2 | 2 | G2 + G1 | Nessuna | 0 | Arsenale rinforzato: +1 integrità. |
| 5 | 4 | 2 | 2 | G2 + G2 | Nessuna | 0 | Il supporto da contrattacco raggiunge il grado 2. |

### 8. Nefelarca — Controllo difensivo

Mantiene il Personaggio operativo e sostiene i disturbi con una flotta resistente.

| Livello | Vitali | Attacco | Corazza | Supporti in campo | Riserve | Fusioni massime | Miglioramento |
|---|---|---|---|---|---|---|---|
| 1 | 4 | 2 | 1 | G2 + G1 | Nessuna | 0 | Supporto corazzato di grado 2 e supporto di disturbo di grado 1. |
| 2 | 4 | 2 | 1 | G2 + G1 | Nessuna | 0 | Plancia rinforzata: +1 integrità. |
| 3 | 4 | 2 | 1 | G2 + G2 | Nessuna | 0 | Il supporto di disturbo raggiunge il grado 2. |
| 4 | 4 | 2 | 2 | G2 + G2 | Nessuna | 0 | Corazza nebulosa: riduce di 2 la potenza nemica. |
| 5 | 4 | 2 | 2 | G2 + G2 | Nessuna | 0 | Arsenale rinforzato: +1 integrità. |

### 9. Vortiluce — Assalto ionico

Una flotta aggressiva che migliora la protezione solo dopo aver completato il proprio attacco.

| Livello | Vitali | Attacco | Corazza | Supporti in campo | Riserve | Fusioni massime | Miglioramento |
|---|---|---|---|---|---|---|---|
| 1 | 4 | 4 | 0 | G1 + G2 | Nessuna | 0 | Supporto difensivo di grado 1 e supporto ionico di grado 2. |
| 2 | 4 | 4 | 0 | G1 + G2 | Nessuna | 0 | Generatore rinforzato: +1 integrità. |
| 3 | 4 | 4 | 0 | G2 + G2 | Nessuna | 0 | Il supporto difensivo raggiunge il grado 2. |
| 4 | 4 | 5 | 0 | G2 + G2 | Nessuna | 0 | Tuono risonante: +1 potenza di attacco. |
| 5 | 4 | 5 | 1 | G2 + G2 | Nessuna | 0 | Schermatura finale: riduce di 1 la potenza nemica. |

### 10. Eclisse Reale — Prima fusione

Mantiene una forte pressione e al quinto livello può fondere i propri due supporti.

| Livello | Vitali | Attacco | Corazza | Supporti in campo | Riserve | Fusioni massime | Miglioramento |
|---|---|---|---|---|---|---|---|
| 1 | 4 | 4 | 0 | G1 + G2 | Nessuna | 0 | Due supporti: difensivo di grado 1 e offensivo di grado 2. |
| 2 | 4 | 4 | 0 | G1 + G2 | Nessuna | 0 | Generatore rinforzato: +1 integrità. |
| 3 | 4 | 4 | 0 | G2 + G2 | Nessuna | 0 | Il supporto difensivo raggiunge il grado 2. |
| 4 | 4 | 4 | 1 | G2 + G2 | Nessuna | 0 | Corazza reale: riduce di 1 la potenza nemica. |
| 5 | 4 | 4 | 1 | G2 + G2 | Nessuna | 1 | Carta Fusione: unisce i due supporti in una sola unità potenziata. |

### 11. Titano Ossidiana — Fusione corazzata

Una madre resistente che accede presto alla fusione e completa poi corazza e armamento.

| Livello | Vitali | Attacco | Corazza | Supporti in campo | Riserve | Fusioni massime | Miglioramento |
|---|---|---|---|---|---|---|---|
| 1 | 4 | 3 | 1 | G2 + G1 | Nessuna | 0 | Baluardo di grado 2 e supporto d’assedio di grado 1. |
| 2 | 4 | 3 | 1 | G2 + G2 | Nessuna | 0 | Il supporto d’assedio raggiunge il grado 2. |
| 3 | 4 | 3 | 1 | G2 + G2 | Nessuna | 1 | Carta Fusione: unisce i due supporti senza aggiungere posti in campo. |
| 4 | 4 | 3 | 2 | G2 + G2 | Nessuna | 1 | Corazza di ossidiana: riduce di 2 la potenza nemica. |
| 5 | 4 | 4 | 2 | G2 + G2 | Nessuna | 1 | Armamento titanico: +1 potenza di attacco. |

### 12. Arca Astrale — Due fusioni e riserve

Parte con due supporti e due carte Fusione. Le riserve sbloccate entrano soltanto attraverso le fusioni.

| Livello | Vitali | Attacco | Corazza | Supporti in campo | Riserve | Fusioni massime | Miglioramento |
|---|---|---|---|---|---|---|---|
| 1 | 4 | 3 | 1 | G2 + G2 | Nessuna | 2 | Due supporti di grado 2 e due carte Fusione; nessuna riserva ancora disponibile. |
| 2 | 4 | 4 | 1 | G2 + G2 | Nessuna | 2 | Armamento astrale: +1 potenza di attacco. |
| 3 | 4 | 4 | 1 | G2 + G2 | G1 | 2 | Terzo supporto in riserva, di grado 1: entra dopo la prima fusione. |
| 4 | 4 | 4 | 1 | G2 + G2 | G2 | 2 | La terza navicella raggiunge il grado 2; Generatore +1 integrità. |
| 5 | 4 | 4 | 2 | G2 + G2 | G2 + G2 | 2 | Quarto supporto di grado 2 in riserva: la seconda fusione crea il secondo supporto fuso. Corazza +1. |

## Carte e salvataggi

Il mazzo base rimane di 40 carte, con mano di 7 e turni da 30 secondi. Le tre nuove carte generali — Attacco diretto, Macchina d’assalto e Bastione robotico — sostituiscono tre copie dello starter. Un mazzo già personalizzato viene conservato; le nuove carte vengono rese disponibili nella collezione. Crediti, trofei, livelli navicella e potenziamenti esclusivi non vengono azzerati.

Sono aggiunte tre carte Fusione, una per Eclisse Reale, Titano Ossidiana e Arca Astrale. Il pacchetto dell’Arca ne contiene due copie. Il catalogo complessivo comprende le 391 carte precedenti più queste sei definizioni. I fronti approvati restano invariati; le nuove carte usano un fronte testuale, in attesa delle successive decisioni sulle carte. La Sentinella in Linea della Lince protegge ora un componente della madre; il testo dei suoi tre fronti è allineato conservandone l’illustrazione. Le vecchie carte che indicano i Motori agiscono sul Generatore, che li alimenta, senza creare un vitale aggiuntivo.

## Verifica

- Test della progressione: tutti i 60 livelli principali e le 25 configurazioni delle varianti.
- Test del combattimento: precedenza bersagli, danni, supporti disattivati, macchine, gradi, prima e seconda fusione, consumo dei materiali e sistemi distrutti.
- Test dell’interfaccia: sessione reale dell’ultimo boss, cambio bersaglio dopo rimozione di Aggiramento, carte native leggibili, selezione dei propri vitali e riservatezza delle trappole.
- Esecuzione compatibile di tutte le 397 carte e conservazione dei mazzi personalizzati.
- 216 partite automatiche completate senza mosse invalide, duplicazioni di carte o superamento dei posti. Queste simulazioni verificano la logica e non certificano il bilanciamento.
- Build di produzione verificata.

Il controllo globale precedente su GitHub (35d7242) aveva già un errore grafico indipendente: sovrapposizione del testo nel pannello di gen-079, in `approvedFleetFronts.test.js`. Non è un errore introdotto dalla progressione.
