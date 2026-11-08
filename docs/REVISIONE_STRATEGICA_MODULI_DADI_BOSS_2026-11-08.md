# Eclissi Stellare — Interazioni strategiche: moduli simultanei, Dadi e Carta Boss Idra

**Data: 8 novembre 2026. Repository ufficiale:** `marcoteghini1988-ai/test7`, branch `main`.

## Scopo

In seguito alla decisione di non ridisegnare né modificare le **42 armi integrate nelle 17 navicelle**, la revisione riguarda unicamente **l'interazione delle Carte Speciali** con i sistemi vitali, lo scudo, la Sincronia e l'equità fra i due giocatori. Non sono state aggiunte armi, spostati slot, cambiati tempi del turno, concessi equipaggiamenti o introdotti premi.

### 1. Moduli offensivi e curativi nello stesso ciclo

**Problema:** `src/tacticalEquipmentCards.js` applicava immediatamente un Modulo su A prima di processare B. Un attacco di Ariete contro una cura di Toro poteva avere esiti diversi semplicemente invertendo i giocatori.

**Correzione:**
- Si leggono le risorse iniziali **dopo il sigillo di entrambi gli ordini**.
- Si preparano gli effetti delle Carte Modulo realmente giocate: danno diretto, esecuzione, drenaggio vitale, guarigione, scudo+energia e Singolarità.
- Si applicano **entrambi i danni reali**, quindi **entrambe le cure reali**. Un colpo e una cura dello stesso ciclo mantengono identiche priorità per A e B.
- Il Drenaggio può guarire solo in proporzione al danno **effettivamente prodotto sulla barriera**; su una barriera già a 0 HP non concede cura senza danno.
- Il Colpo Esecutivo decide il bonus sulla percentuale di scudo allo **snapshot iniziale**, non dopo l'attacco avvenuto pochi microsecondi prima nell'ordine del codice.
- Gli altri Moduli, comprese le due cariche di Sifone Sincronia che già usavano snapshot equivalenti, non subiscono cambiamenti. Rimane **una carta Modulo per lato per ciclo**, entro il tetto di due speciali.

**Valori test d'esempio:** entrambi iniziano a 30 HP di scudo; Ariete L1 causa 8 HP, Toro L1 ne cura 9: chi attacca resta a 30, chi cura va a 31 HP. Invertendo A/B il risultato non cambia. A scudi entrambi a 5 HP, due Drenaggi infliggono 5 ciascuno e ripristinano 3 ciascuno. Un Esecutivo L1 contro 25/60 HP usa il bonus **non amplificato** perché la soglia di potenziamento è 24/60 HP all'inizio della risoluzione, indipendentemente dal lato.

### 2. Dadi Quantici realmente distinti

**Problema:** la selezione delle sei facce aggiungeva 17 al seed per A e 41 per B. La differenza **24 è divisibile per 6**, quindi a parità di ciclo A e B ricevevano **sempre la stessa faccia**: non erano due lanci distinti.

**Correzione:** mantiene invariato il comportamento deterministico del lato A, applica al lato B una mescolanza riproducibile di seed e ciclo (`Math.imul` + XOR), senza leggere mano, carte coperte o ordini dell'avversario. Entrambi i lati possono ottenere **tutte le sei facce** in più partite: i risultati ora possono coincidere casualmente oppure differire. Ogni dado richiede ancora la sua **Carta Dado Quantico vera**, carica di tre categorie matematiche differenti, e consuma la propria carta del mazzo da 24. Nessun credito o valuta è assegnato dalla nuova regola.

Test: `src/tacticalLegacyEvents.test.js` verifica entrambe le distribuzioni e due Carte Dado giocate contemporaneamente, il consumo delle cariche e la conservazione di 52 numeriche/24 speciali.

### 3. Carta Personaggio Idra: rigenerazione e vulnerabilità del Generatore

**Problema:** `bossCharacterApplyRegen` sommava gli HP direttamente allo scudo. Così ignorava l'efficienza del Generatore Scudi e non ricalcolava quali sistemi vitali dovevano **restare esposti o richiudersi** quando la barriera risaliva.

**Correzione:** la Carta Personaggio Idra usa ora la stessa funzione `restoreMotherShield` che gestisce le altre riparazioni autentiche. Restano obbligatori la **Carta Personaggio giocata realmente**, la condizione di danno subìto, la scadenza dei due cicli e il limite di una rigenerazione. Non diventa un bonus passivo gratuito.

Test: se la barriera madre è a **43/60 HP**, dopo i 4 HP effettivi di Idra va a **47/60** e supera la soglia del **75%**, quindi un vitale precedentemente esposto si richiude. Se il Generatore è danneggiato a metà (5/10 HP), vengono recuperati **2 HP** e la barriera va a **45/60**, restando esposta. Con Generatore distrutto, Carta scaduta o non giocata, la cura è **zero**.

### 4. File e verifiche

Modificati:
- `src/tacticalEquipmentCards.js` e `src/tacticalEquipmentCards.test.js`
- `src/tacticalLegacyEvents.js` e `src/tacticalLegacyEvents.test.js`
- `src/bossCharacterCards.js` e `src/tacticalBossRegeneration.test.js` (nuovo)

**Ultima verifica del codice:** commit `be5ad66cdea12c4f2874ad98af7db3d42713f790`, [GitHub Actions 42467914124](https://github.com/marcoteghini1988-ai/test7/actions/runs/42467914124). **720/720 test automatici**, `npm run build` e `npm run preflight` superati.

### 5. Punti ancora aperti

- Playtest **reale** nel formato Android 9:16, inclusa leggibilità dei sette slot numerici e delle cinque speciali.
- Bilanciamento pratico di valori di salute, Dado, Malus, Faglia, Carte Modulo e difficoltà dei dodici Boss.
- Verifica visiva dei colpi e danni corrispondenti alle illustrazioni delle 42 armi già catalogate, **senza modificarne le regole per ora**.
- Altri effetti di Terreno e Boss soggetti a prove mirate prima di eventuali ribilanciamenti: non sostituire effetti esistenti senza test.
- PvP online autorevole non ancora disponibile; gli ordini simultanei e i test locali non equivalgono a una sincronizzazione umana reale.

**Vincolo permanente:** qualsiasi equipaggiamento o abilità attivabile del giocatore resta una **Carta Speciale autentica** del mazzo da 24, mai un pulsante gratis. Le armi integrate sono componenti fisiche delle navicelle, non Carte Modulo.
