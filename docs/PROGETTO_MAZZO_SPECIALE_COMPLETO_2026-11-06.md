# Eclissi Stellare — Progetto completo del mazzo speciale

**Data:** 6 novembre 2026  
**Stato:** SPECIFICA PROGETTUALE. Questo documento fissa le scelte di design; **le nove nuove tipologie e il nuovo mazzo iniziale NON sono ancora implementati nel motore**. I numeri degli effetti sono parametri iniziali da sottoporre a test di bilanciamento.  
**Repository:** `marcoteghini1988-ai/test7`, solo `main`. Non riprogettare la plancia metallica 9:16. Non introdurre tutorial ora.

## Obiettivo

Il mazzo speciale non sostituisce le sette carte numeriche, le formule, le firme matematiche o i proiettili realmente sparati. Gestisce **scorte → barriera madre → apertura vitali → disabilitazione dei quattro sistemi** e risposta difensiva. Le carte navicella sono collectible per equipaggiare una madre, e le carte personaggio sono comandanti; **non occupano slot delle 24 tattiche**. Le fusioni sono carte tattiche effettive e consumabili.

La madre ha quattro parti vitali: Motore, Sistema armi, Generatore scudi, Centralina di comando. Il gioco le espone progressivamente secondo le soglie dello scudo al 75/50/25/0%, non soltanto allo 0%; una riparazione può richiudere finestre non stabilizzate. Ogni vitale esposto richiede la firma autentica associata al modello; tutte e quattro le parti devono arrivare a 0 HP per distruggere la madre. Le scudiere hanno scudo proprio e firma di distruzione: non vanno eliminate semplicemente facendo 0 HP allo scudo.

## Catalogo: 20 tipologie esatte

**Esistenti 1–11; proposte nuove 12–20.**

| N | Carta | Ruolo e trigger | Stato |
|---|---|---|---|
| 01 | Colpo Perforante | Prossima vera salva allo scudo madre: 20% del pacchetto aggira l'intercettazione delle scudiere, NON lo scudo né la firma vitale | Esistente |
| 02 | Impulso Ionico | Quando una vera salva danneggia lo scudo madre: intercettazioni automatiche nemiche −30% per 12 s | Esistente |
| 03 | Corrosione | Una vera salva prepara il bersaglio; il prossimo colpo autentico allo scudo madre infligge +25% contro lo scudo, per max 15 s | Esistente |
| 04 | Fusione Barriera | Madre + una scudiera viva, 100 Sincronia: fino al 60% del pacchetto assorbibile dal vero scudo scudiera, 12 s, ricarica 28 s | Esistente |
| 05 | Fusione Assalto | Madre + una scudiera, 100 Sincronia: madre +25% contro scudo avversario, ma scudiera agganciata non spara | Esistente |
| 06 | Fusione Gemellare | Due scudiere vive, 100 Sincronia: fuoco delle due scudiere sospeso, intercettazione collettiva fino al 55% usando HP reali | Esistente |
| 07 | Fusione Trina | Madre + due scudiere vive, 100 Sincronia: madre +35% allo scudo, fino al 40% intercettato con due scudi veri, scudiere agganciate non sparano | Esistente |
| 08 | Copertura Tattica | Prima scudiera protegge una volta la madre con il proprio scudo, massimo 75% del pacchetto | Esistente |
| 09 | Riparazione Scudo | Ripara fino a 20 HP alla barriera madre, penalità del generatore danneggiato, impossibile a generatore KO | Esistente |
| 10 | Pulizia Sistemi | Rimuove corrosione e ionizzazione effettivamente attive, nessun HP o danno creato | Esistente |
| 11 | Riparazione Scudiera | Fino a 15 HP dello scudo di una scudiera operativa, senza rianimare unità KO | Esistente |
| 12 | Frattura di Barriera | Arma il prossimo colpo valido contro lo scudo madre: +20% di danno lì soltanto, soggetto al cap generale | **Nuova** |
| 13 | Demolitore di Scorta | +25% sul prossimo vero colpo diretto allo **scudo di una scudiera**; con scudo a zero resta necessaria la sua firma per distruggerla | **Nuova** |
| 14 | Mira Chirurgica | +15% danno del prossimo vero colpo a una parte vitale già esposta, SOLO se la firma è rispettata; non funziona sulla barriera | **Nuova** |
| 15 | Infiltrazione Sistemi | Arma un colpo valido a un vitale esposto e produce un disturbo diverso secondo il bersaglio: motore (fusioni ostacolate per 8 s), armi (prossima salva −15%), generatore (riparazioni schermate per 10 s), comando (guadagno Sincronia sospeso 8 s). Nessun effetto senza colpo reale | **Nuova** |
| 16 | Soppressione di Scorta | Seleziona una scudiera nemica operativa: non intercetta **il prossimo singolo colpo** alla madre (entro 10 s). Non ferma l'altra scudiera, non perfora scudi, non rompe firme | **Nuova** |
| 17 | Ricambio Numerico | Scarta fino a 2 numeriche scelte e pesca lo stesso numero dal pool reale, senza creazione o duplicazione, cooldown 15 s. Differente dal ricambio gratuito/di emergenza già presente: consume una speciale reale | **Nuova** |
| 18 | Scansione Tattica | Mostra in anticipo le firme di 2 vitali ancora protetti e l'ordine delle prossime 2 numeriche del proprio mazzo; se tutte le firme sono già visibili resta utile la preview di pesca. Non rivela la mano nascosta dell'IA e non apre alcun vitale | **Nuova** |
| 19 | Schermo d'Urto | Riduce del 20% un solo impatto reale contro la madre entro 12 s; non produce scudo/HP, non cumulabile con un altro schermo d'urto, rispetta il cap difensivo | **Nuova** |
| 20 | Micro-riparazione Vitale | Cura fino a 8 HP una parte vitale danneggiata ma **non KO**, max 1 volta per parte e partita, con generatore funzionante; non ripristina scudiere, sistemi distrutti o firme | **Nuova** |

## Regole immutabili

- Mazzo speciale **24 carte esatte**; **massimo 6 copie** per tipo; **5 speciali in mano** con ripescaggio immediato; scarti riciclati senza aumentare il numero totale di carte.
- Mazzo numerico separato: **7 in mano**, le carte consumate restano nel pool riciclabile. Nessuna speciale crea numeriche, munizioni o proiettili dal nulla.
- Massimo **due modificatori offensivi differenti** armati per una stessa salva; un terzo è rifiutato senza consumare carta. Tipi duplicati non si sommano. Non esiste una speciale che distrugga automaticamente un vitale senza firma.
- Una preparazione/protezione non può essere accumulata in più copie; le preparazioni temporanee scadono. Supporti e ricambi hanno un cooldown per **effetto/famiglia**, così una mano che si reintegra immediatamente non diventa una fonte infinita di cure.
- Bonus offensivi sommati a fusioni, boss, comandante e arena sempre sotto il cap **+45%** del punto 45, con ordine di risoluzione dichiarato in codice. I malus difensivi rispettano il cap difesa già previsto.
- Il combattimento può concludersi anche senza speciali, se il giocatore riesce a superare le difese con le vere salve numeriche. Le carte ampliano le tattiche, non diventano chiavi obbligatorie.
- Introduzione di **Scarto tattico** nel pannello della mano: ogni 15 s una speciale inutile può essere messa negli scarti e sostituita da una carta del proprio mazzo. Non attiva nessun effetto, non moltiplica le carte. Serve per evitare blocchi con carte situazionali.
- Le nuove carte 12–20 richiedono verifica con IA, animazioni, stress del mazzo 24/5, mobile 9:16 e test di salvataggio. Non applicare numeri nuovi silenziosamente alla versione funzionante.

## Correzione critica: mazzo iniziale

Attualmente il nuovo giocatore ha 24 speciali: quattro ciascuna di Fusione Barriera, Fusione Assalto, Copertura, Perforante, Ionico, Corrosione. **Ai livelli navicella 1–2 non esistono scudiere**, rendendo impossibili le prime tre categorie (12 carte su 24); senza intercettazioni, anche Perforante e Ionico possono non avere effetto. È un problema reale di giocabilità.

**Nuovo starter scelto:**

| Carta | Copie |
|---|---:|
| Frattura di Barriera | 4 |
| Ricambio Numerico | 4 |
| Scansione Tattica | 4 |
| Schermo d'Urto | 4 |
| Riparazione Scudo | 4 |
| Mira Chirurgica | 4 |
| **Totale** | **24** |

Le quattro famiglie fondamentali sono presenti sin da subito: aprire scudo, preparare calcoli, conoscere i vitali, sopravvivere; la mira diventa utile dalla prima esposizione al 75%. **Non regalare automaticamente le altre speciali rare o fusioni avanzate**: restano ottenibili attraverso le meccaniche pacchetto/collezione.

**Migrazione non distruttiva:** il nuovo starter si applica automaticamente ai nuovi utenti e ai salvataggi il cui loadout è *esattamente* il vecchio starter predefinito, lasciando invariati carte possedute fuori dal loadout, crediti/pacchetti e ricompense. Per qualsiasi mazzo personalizzato v1 la configurazione dell'utente ha priorità: non sovrascriverla. Attribuire soltanto le copie di nuove carte necessarie allo starter, con versione di migrazione verificabile e idempotente.

## Costruzione dei mazzi dopo L3/L5

Le 20 tipologie sono un **catalogo**, non 20 carte obbligatorie nello stesso mazzo. Si selezionano 24 copie reali tra quelle possedute, in base a madre, comandante e nemico.

- **Assedio:** privilegia Frattura, Corrosione, Perforante, Demolitore e Fusione Assalto.
- **Controllo:** privilegia Ionico, Soppressione Scorta, Infiltrazione e Ricambio Numerico.
- **Chirurgico:** privilegia Scansione, Mira, Infiltrazione e poche carte di scudo per puntare presto a generatore o armi.
- **Difensivo:** privilegia Riparazione Scudo, Copertura, Schermo d'Urto, Pulizia e Barriera/Gemellare.
- **Aggressivo evoluto:** privilegia Fusione Trina quando ha due scudiere, assieme a Frattura e Mira.

Il costruttore deve dare un **avviso**, non bloccare la libertà del giocatore, quando include molte speciali impossibili con la madre equipaggiata: L1/L2 nessuna scudiera, L3/L4 una, L5 due.

## L'IA e i 12 boss non devono copiare automaticamente il mazzo del giocatore

Nel motore attuale, quando `enemySpecialDeckTypes` non è impostato, `initialBattle` usa `upgrades.specialDeckTypes` anche per l'IA. Questo rende l'avversario un riflesso della personalizzazione del giocatore.

**Scelta:** mazzi nemici da 24 carte reali, 5 in mano, 6 copie max e identiche regole del giocatore, ma distinti per piano tattico e pianeta:

| Pianeta | Identità del mazzo del boss |
|---|---|
| Terra | Barriera, Copertura e Schermo |
| Marte | Frattura, Corrosione e Assedio |
| Venere | Ricambio, Scansione e recupero |
| Saturno | Controllo, Soppressione e difesa |
| Urano | Ionico, Perforante e interdizione |
| Nettuno | Protezione delle scudiere e Fusione Gemellare |
| Plutone | Scansione, Mira Chirurgica e attacchi opportunistici |
| Europa | Infiltrazione Sistemi e attacchi mirati |
| Proxima b | Riparazioni, resilienza e disturbo |
| Haumea | Fusioni Assalto/Trina e accelerazione della pressione allo scudo |
| Io | Frattura, Demolitore e scariche aggressive |
| Encelado | Schermo, Pulizia e indebolimento delle scudiere |

I boss usano solo le speciali veramente presenti nel loro mazzo, e possono attivare le fusioni doppie solo quando hanno due scudiere vive. Ai livelli inferiori l'IA deve comporre mazzi compatibili con una madre senza scudiere.

## Ordine d'implementazione

1. **Motore di gioco:** starter giocabile e migrazione idempotente, scarto tattico; verificare 24/5/6 e assenza di carte morte all'inizio.
2. **Nuove speciali di scudo e preparazione:** Frattura, Ricambio, Scansione, Schermo.
3. **Tattiche da dopo la prima esposizione:** Demolitore, Mira, Infiltrazione, Soppressione, Micro-riparazione.
4. **IA e 12 mazzi boss separati:** scelta coerente con il contesto, nessuna carta illimitata o privilegi nascosti.
5. **Bilanciamento, UI e feedback:** test L1/L3/L5, tutte le difese e i 120 settori, verifiche su telefono. Solo dopo, tutorial.

**Attenzione:** questa è la definizione del sistema; il codice attuale include ancora soltanto 11 tipologie. Non dichiarare 20 carte implementate finché i percorsi di consumo, il motore, la collezione, l'IA e i test non saranno aggiornati e verificati.
