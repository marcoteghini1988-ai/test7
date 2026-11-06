# ECLISSI STELLARE — MASTER DECISIONI E RIPRESA, 6 NOVEMBRE 2026

**Documento di continuità per la scaletta generale di 53 punti.**
È un registro delle decisioni concordate e dei risultati REALMENTE collegati al gioco, non una dichiarazione che tutti i 53 punti siano implementati.

## Repository di lavoro — vincolo inderogabile
- Repository unico di sviluppo: `marcoteghini1988-ai/test7`, ramo ufficiale `main`, aggiornato direttamente su richiesta dell'utente.
- La versione corrente del gioco è su `test7/main`. Nessuna copia/repository `test8` da usare per gli sviluppi futuri.
- `main` incorpora sorgenti React/Vite, catalogo, asset, collezione, Shop, Hangar, duello e test.
- Continuare su questa base, senza reinizializzare il progetto né reintrodurre come regolamento il vecchio Poker Battle. Tenere i vecchi componenti dove servono alla compatibilità.

## Punti già presenti nel codice

### Arena e flotta
- Arena metallica spaziale verticale **9:16**; sette carte numeriche visibili; nessun ritorno alla griglia azzurra.
- **17 navicelle madri** collezionabili, **42 armi integrate**, quattro rarità, cinque livelli e 85 varianti di presentazione delle carte/navi preesistenti.
- 17 sagome SVG differenziate `public/assets/ship-shells/` introdotte al punto 22; non sono ancora mesh 3D finali.
- UNA carta madre equipaggiata con scudiere subordinate, senza rendere le scudiere carte autonome. A L1–L2 madre soltanto; L3–L4 una scudiera; L5 due scudiere. 34 asset scudiere già presenti, 34 armi subordinate e ruoli/dottrine differenziati.
- Le nuove meccaniche madre/scudiere sono attive nella modalità di prototipo con una sola madre; una formazione storica da 2–3 carte mantiene ancora il motore legacy, in attesa della migrazione.

### Combattimento e bersagli
- Battaglia continua: il giocatore non ha timer obbligatorio; l'IA ha intervallo di scelta (attualmente 35–40 s nei settori iniziali, parametri da bilanciare).
- Numeriche da **sette carte** in mano, inizialmente standard da 52. Valore = munizioni, seme = compatibilità dell'arma; calcolo valido abilita il tiro e non costituisce il danno.
- Attacchi anche contemporanei, proiettili applicano gli HP **all'arrivo** e non sovrascrivono altri impatti.
- Scudo madre e quattro vitali: **motore, sistema armi, generatore scudi, centralina**. Soglie 75/50/25/0; l'attaccante sceglie la parte da esporre. Per vincere bisogna distruggere tutti e quattro i vitali.
- Scudiere con scudo proprio e formula finale dopo l'azzeramento; nessun HP inventato. Distruzione della centralina interrompe coordinazione e bonus collegati.
- Firme matematiche/Poker definitive PER MODELLO, valori di difesa, impatti sulla scocca: **ancora da decidere e completare**.

### Punto 22 — formazioni e fusioni
- Formazioni: equilibrata / guardia / assalto, con intercettazione e danni modificati; i valori attuali sono segnaposto.
- Sincronia 0–100: aumenta coi calcoli validi, intercettazioni e attacchi alle scudiere.
- Due fusioni PROTOTIPO: **Fusione Barriera** e **Fusione Assalto**, tra madre e una scudiera. Consumo 100 Sincronia, durata 12 s, ricarica 28 s, numeri NON definitivi. Una scudiera agganciata non spara né riceve numeriche da sola; la difesa consuma il suo scudo esistente.
- L'altra scudiera resta indipendente. Fusioni fra scudiere e fusione tripla DA PROGETTARE.

## Correzione vincolante del Punto 22 e fondazione del Punto 30 — carte speciali (6 novembre)
**UNA FUSIONE SI ATTIVA ESCLUSIVAMENTE GIOCANDO LA RELATIVA CARTA DEL MAZZO SPECIALE.**
La Sincronia piena non autorizza più una fusione senza carta. Il pulsante MANOVRE può ancora cambiare formazione, ma non effettua fusioni gratuite. Anche l'IA deve possedere e consumare una speciale.

- Due mazzi e due mani separate: **7 numeriche + 5 speciali**.
- Dopo ogni speciale usata, pescata **immediata** fino a 5 speciali; nessun limite arbitrario aggiuntivo alla frequenza di pescata/uso.
- Si ammettono più copie dello stesso tipo speciale. Si potranno giocare più speciali nella stessa finestra d'azione purché gli effetti siano compatibili. Il motore attuale impedisce due fusioni simultanee della medesima madre, perché sono incompatibili.
- Catalogo **attuale implementato (Punto 27)**: sei tipologie di carte speciali: `Fusione Barriera`, `Fusione Assalto`, `Copertura Tattica`, `Colpo Perforante`, `Impulso Ionico`, `Corrosione`. Mazzo dimostrativo 24 istanze (**4 per tipo**), distribuzione temporanea con recupero degli scarti per mantenere la mano a cinque. Copertura Tattica protegge la madre dal prossimo colpo entro 15 s usando lo scudo della prima scudiera; non richiede Sincronia, non si cumula con le fusioni. Perforante, Ionico e Corrosione si applicano solo a una scarica effettiva contro lo scudo madre, fino a **due effetti distinti per attacco**, senza attribuire poteri ai semi numerici. Vedi `docs/PUNTO_27_EFFETTI_STRATEGICI_COLPI.md`.
- L'utente sceglie la carta dalla propria mano e la scudiera bersaglio. Se manca Sincronia/una scudiera disponibile, la carta NON viene consumata.
- Numeriche e speciali non si sostituiscono; l'azione speciale non utilizza o modifica le sette numeriche.
- Le altre speciali non devono essere inventate prematuramente; definire prima meccaniche, effetti, costi, sinergie e limiti. Lo schema del motore è predisposto per ampliare il catalogo.
- Il mazzo speciale potrà essere costruito da carte possedute/ottenute dai pacchetti; **economia, 20/25 carte e sblocchi NON sono ancora approvati come numeri definitivi**, né implementati.

## Decisioni consolidate MA non ancora collegate integralmente

1. **Calcoli di due O TRE carte**, consumate all'uso; risultati inizialmente interi positivi. Ora la battaglia attiva risolve le coppie; estensione a 3 numeriche in attesa del progetto dell'operazione concatenata e della UI.
2. **Un comandante per la flotta**, non un comandante distinto per ogni navicella; deve conservarsi anche se una nave viene distrutta. Da migrare nei moduli di gioco attivi.
3. Navi e scudiere devono poter scegliere tra attacco numerico e abilità strategica da 1 o 2 speciali compatibili. Gli effetti di 2 speciali si combinano in UN'azione; le altre abilità sono ancora da definire. La battaglia non deve reintrodurre turni forzati per farlo.
4. La **protezione reciproca**, l'attacco coordinato e le formazioni devono avere conseguenze sugli scudi/armi/HP reali; non creare danno o HP fittizio.
5. Le speciali potranno comportare effetti di congelamento, perforazione, incendio, elettricità, esplosione, corrosione, sabotaggio, barriera, riparazione e altri effetti strategici, ma **per-card: numeri, durata e compatibilità da stabilire**, non spacciati per già implementati.
6. I semi delle **numeriche** al momento non hanno poteri automatici di cura/danno/tempo/Etere: restano identificatori di caricamento. Eventuali ruoli universali dei semi o passivi del mazzo numerico richiedono una decisione finale coerente con questa regola; evitare di reintrodurli tacitamente.
7. Madri e scudiere devono differenziarsi nel design e nei ruoli; il sistema di danni deve far vedere chiaramente motori/vitali e le reali parti che subiscono attacchi.
8. Modalità avventura/campagna, boss, collezione, progressione, mercati di carte, piloti, IA, salvataggi e bilanciamento richiedono completamento integrato: l'esistenza dei menu/componenti legacy non equivale alla loro finalizzazione con il nuovo regolamento.

## ORDINE DI SVILUPPO — prossimi punti della scaletta master

- **22 completato come prototipo logico e di UI**: formazioni, protezione e fusioni; corretto ora il metodo d'attivazione.
- **22B / preparazione del 30: mazzi separati e carte fusione**. Sono già presenti modulo, UI, IA e test. Non è una rinumerazione della scaletta da 53 punti.
- **23: collaborazione madre/scudiere**. Protezione, fuoco coordinato e ruoli esistenti verificati con test aggiuntivi; sinergie avanzate NON concluse. Vedi `docs/PUNTO_23_COLLABORAZIONE_NAVICELLE.md`.
- **24 (identità e ruoli)**: le 17 madri possiedono 34 scudiere con ruolo difensivo nel primo slot e offensivo nel secondo. La verifica è inclusa nei test; approfondimenti tattici da completare. Vedi `docs/PUNTO_24_RUOLI_FLOTTA.md`.
- **25 (protezione madre)**: tre difese distinte, automatica / formazione / carta Copertura Tattica da 15 s e un solo impatto, sempre consumando HP reali della scudiera 1. Logica e interfaccia create, bilanciamento aperto. Vedi `docs/PUNTO_25_PROTEZIONE_MADRE.md`.
- **26 (danni localizzati)**: AVARIA al 50% HP, KO a zero; riduzioni progressive operative a motore, armi, generatore scudi e centralina. HUD, log e test aggiornati. Vedi `docs/PUNTO_26_DANNI_LOCALIZZATI.md`; bilanciamento da collaudare.
- **27 (effetti dei colpi)**: tre nuove carte strategiche Perforante, Ionico e Corrosione, con durata, interazione e consumo verificati da test. Il catalogo completo è ora di sei tipi (dati di bilanciamento ancora provvisori). Vedi `docs/PUNTO_27_EFFETTI_STRATEGICI_COLPI.md`.
- **28 (calcoli e firme)**: 2/3 numeriche giocabili con catena esatta, firme matematiche fisse a inizio battaglia per modello, coppia/tris facoltativi su alcuni vitali, senza mai rendere Poker l'unica strada. L'IA dispone di ricerca delle triple. Firme definitive e Poker a 4/5 carte da sviluppare. Vedi `docs/PUNTO_28_CALCOLI_FIRME_VITALI.md`.
- **29 (ritmo e bilanciamento)**: IA con scelta di colpi validi contro firme math/Poker, mazzo numerico riciclato senza duplicazioni solo nelle nuove battaglie, ricambio manuale/IA da una carta quando non esiste un attacco valido (ricarica tecnica 15 s), e metriche di fine partita per calibrare durata e risorse. **Prototipo logico verificato; bilanciamento empirico ancora aperto**. Vedi `docs/PUNTO_29_RITMO_BILANCIAMENTO.md`.
- **30 (costruzione mazzi speciali)**: inventario persistente indipendente, editor di 24 carte, copia massima 6 per tipo e saldo possedute/equipaggiate, pacchetti ricompensa da tre carte sulla prima vittoria per settore, due nuove speciali di supporto e tre combinazioni offensive a due carte. Prima versione operativa, rarità/economia/bilanciamento ancora da definire. Vedi `docs/PUNTO_30_MAZZO_CARTE_SPECIALI.md`.
- **Punti successivi**: completare i sistemi speciali, le loro interazioni/rarità, le sinergie fra flotte e le meccaniche ancora aperte. La denominazione esatta del punto 31 e l'ordine dei 32–39 vanno recuperati dal documento ufficiale originale, senza inventarli.
- **Altri blocchi della master**: parti vitali (51–52), piloti/comandante (40–41), arene (42–43), campagna (44–45), Shop (46), IA (47), grafica/sonoro finale e boss/mazzi dedicati (53). Le varianti estetiche e audiovisive sono rinviate per ora, senza cambiare le decisioni tattiche.

## Audio-visivo: RINVIATO SU RICHIESTA
**NON dedicare ora lo sviluppo alla lucidatura audio/visiva.** Le 17 sagome SVG e gli effetti di aggancio sono riferimenti tecnici temporanei. I modelli fisici 3D, l'allineamento delle bocche, l'animazione di fusione e gli effetti audiovisivi definitivi arriveranno DOPO aver inserito e provato le regole del gioco.

## Test
```sh
npm ci
npm run verify:logic
npm run build
npm run preflight
```
Verificare sempre GitHub Actions di `main` prima di dichiarare una fase conclusa. Una build automatica non certifica la giocabilità o la resa su Samsung Z Fold o altri dispositivi reali.

## Documento da seguire alla ripresa
Iniziare da **questo master**, da `docs/PUNTO_22_INTEGRAZIONE.md`, da `src/specialCards.js` e da `src/MathDuelBattle.jsx`. Aggiornare i rapporti dopo ogni nuova decisione e applicare i prossimi aggiornamenti direttamente a `test7/main`, senza nuove copie su GitHub.

## Chiusura operativa di questa sessione
- Carta fusione obbligatoria per giocatore e IA; due mani indipendenti.
- Punto 23: nuovi test cooperazione madre e scudiere.
- Punto 24: nuovi test di tutti i ruoli per 17 famiglie, con scudiera 1 difensiva e scudiera 2 offensiva.
- 257 test logici superati (17 nuovi test Punto 28, oltre ai 240 precedenti), build e preflight automatizzati; interfaccia reale e bilanciamento da collaudare.
- **Prossima priorità: proseguire i punti originali successivi al 30, verificandone la numerazione**, senza completare ancora audio/visivo.


### Ultimo avanzamento — Punto 26 (6 novembre 2026)
- Vitali madre con soglia **AVARIA 50%**, stato **KO** e log evento senza ripetizioni.
- Effetti progressivi reali su colpi madre, colpi scudiere, capacità di riparare lo scudo e coordinazione. La protezione generale non trasmette danni ai vitali senza firma valida.
- Componente scudiere, formazioni, fusioni e carte speciali precedenti mantenuti; la parte audiovisiva finale rimane posticipata.
- **225 test automatici**, build e preflight superati. Nessun collaudo fisico sul telefono ancora effettuato.
- **Prossimo: Punto 27**. Sviluppare gli effetti speciali solo con regole distinte e verificabili, senza inventare poteri automatici dei semi.


### Ultimo avanzamento — Punto 27 (6 novembre 2026)
- **Colpo Perforante**: 20% del danno scavalca l'intercettazione delle scudiere, ma non lo scudo madre o le firme matematiche.
- **Impulso Ionico**: riduce per 12 s al 70% l'intercettazione automatica delle scudiere dopo un colpo efficace allo scudo madre; non indebolisce Copertura Tattica.
- **Corrosione**: lo scudo generale subisce +25% sul primo colpo efficace successivo entro 15 s.
- 2 effetti speciali distinti possono essere preparati per una scarica; la mano da 5 speciali si reintegra dopo ciascuna carta giocata, senza toccare le 7 numeriche. Anche l'IA consuma carte vere.
- Mazzo di **prova**: 24 istanze distribuite in 6 tipi × 4 copie. Non corrisponde a una regola definitiva di deckbuilding.
- **240 test**, build e preflight verificati su `test7/main`; playtest e qualità visiva ancora da collaudare.
- **Successivo: Punto 28**. Differenziare requisiti d'attivazione e firme per modello, includendo calcoli da 2/3 numeriche e requisiti Poker senza confondere il vecchio motore.


### Ultimo avanzamento — Punto 28 (6 novembre 2026)
- 7 carte numeriche in mano; scelta di 2 o 3, con ripetizione della stessa operazione nelle triple, permutazioni e risultati intermedi interi positivi. Le 5 carte speciali e le carte tattiche rimangono separate.
- Quattro vitali con firme matematiche **fissate a inizio partita** in base al modello e agli operatori realmente disponibili. La firma è mostrata sul bersaglio ed è verificata quando il proiettile arriva; non può essere rimpiazzata dall'attaccante.
- Famiglie C/R/E/L: **coppia** opzionale per colpire il sistema armi. Famiglie E/L: **tris** opzionale per la centralina. È sempre disponibile anche una firma matematica di 2/3 carte. Queste varianti sono prototipi non il catalogo finale.
- L'IA può cercare triple quando necessario e mira ai vitali compatibili con la firma matematica. Non usa ancora le alternative Poker deliberatamente.
- **257 test automatici riusciti**, build e preflight superati. Playtest manuale e controlli su telefono ancora da effettuare.
- **Prossimo: Punto 29**, calibratura e ritmo. Combinazioni Poker a 4/5 carte e firme definitive dei boss non ancora implementate, grafica/sonoro finale rinviati.


### Ultimo avanzamento — Punto 29 (6 novembre 2026)
- La battaglia madre/scudiere resta continua; l'IA usa un intervallo autonomo e ora sceglie soltanto mosse che possano davvero soddisfare la firma dei vitali esposti, inclusa l'alternativa Poker quando presente.
- Nel nuovo combattimento il mazzo da 52 numeriche ricicla gli scarti quando la pesca finisce: nessuna duplicazione o creazione di carte. Le modalità precedenti non cambiano.
- Se non esiste alcun attacco valido, il giocatore può usare **RICAMBIO NUMERICO** dentro MANOVRE: un solo cambio con ricarica di 15 s. Anche l'IA può farlo, senza carte supplementari.
- Un rapporto di fine partita conta durata, coppie/triple giocate, carte spese, ricicli e ricambi per calibrare la difficoltà.
- **272 test automatici riusciti**, build e preflight superati su `test7/main`. Le durate obiettivo, il bilanciamento delle 17 flotte, la leggibilità 9:16 e la resa su telefono devono essere collaudati realmente.
- **Prossimo punto: 30**, ampliamento delle carte speciali e dei mazzi. Grafica 3D e sonoro definitivi successivamente.


### Ultimo avanzamento — Punto 30 (6 novembre 2026)
- **Due mazzi separati**: 7 numeriche e 5 speciali in mano. Il mazzo speciale equipaggiato contiene 24 carte reali, separate dalle copie possedute e personalizzabile nel pannello dell'Hangar e della flotta prepartita.
- **8 tipologie giocabili**: Fusione Barriera, Fusione Assalto, Copertura Tattica, Perforante, Ionico, Corrosione, **Riparazione Scudo**, **Pulizia Sistemi**. Le due nuove speciali di supporto sono inizialmente non possedute e si trovano nei pacchetti.
- Le carte di supporto consumano carte speciali vere: Riparazione max 20 HP, influenzata dal generatore danneggiato; Pulizia elimina Ionizzazione e Corrosione attive. Non vengono assegnati HP o effetti senza carta.
- Tre coppie di effetti offensivi compatibili con nome proprio; **nessun moltiplicatore aggiuntivo**. L'IA usa solo le carte nel proprio mazzo e sa utilizzare supporti quando servono.
- **Pacchetti da 3 carte**: un credito per la prima vittoria di ogni settore di Campagna/Avventura, senza premi nei test, senza ripetizione sullo stesso settore e senza valuta reale. Frequenze e rarità ancora provvisorie.
- Salvataggio della collezione speciale separato e non distruttivo rispetto alla collezione navicelle, con validazione proprietà/copertura. Un salvataggio corrotto non viene sovrascritto silenziosamente.
- **295 test logici riusciti**, build e preflight automatizzati su `test7/main`. Non è ancora un collaudo di giocabilità su telefono e il bilanciamento resta sperimentale.
- Riferimento `docs/PUNTO_30_MAZZO_CARTE_SPECIALI.md`. Prossimi punti 31–39: rispettare la scaletta numerata originale; il testo integrale non è incluso nei documenti correnti. La fase audio-visiva definitiva rimane rinviata.

### Ultimo avanzamento — Punto 31 (6 novembre 2026)
- Corretto un errore della progettazione provvisoria: la scala dei boss **non** è uniforme a 9 livelli. Su 12 boss attivi, 4 mazzi hanno una sola abilità (max L3), 5 ne hanno due (max L6), 3 ne hanno tre (max L9). Tutte le abilità hanno tre gradi consecutivi; **23 abilità** totali.
- Nuove abilità definite in `src/bossNumericDecks.js`, cablate alla battaglia matematica madre/scudiere, allo Shop preesistente e alla progressione equipaggiata senza sovrascrivere inventario, costi e ID originali.
- Le abilità non modificano le firme, non creano carte, non accendono fusioni senza speciale. Effetti registrati ad impatto; Sincronia e Riparazione sono bonus soltanto a eventi reali, con limiti.
- Spec: `docs/PUNTO_31_PASSIVE_MAZZI_BOSS.md`. Test: `src/bossNumericDecks.test.js`; verifiche CI, bilanciamento e playtest ancora da completare. Prossima fase: continuare la scaletta con punto 32 dopo i controlli, senza intervenire sulla grafica/sonoro definitivo.

### Verifiche dopo il Punto 31 e continuità 32–39
- Il precedente fallimento CI del punto 31 era un arrotondamento floating point nel moltiplicatore di Risonanza. Corretto; il run `42211895724` ha confermato **309/309 test**, build e preflight riusciti.
- Aggiunta `src/specialFlow.test.js` per coprire due speciali offensive sulla stessa scarica, rifiuto della terza senza consumo, reintegro immediato della mano a cinque e due supporti giocabili consecutivamente senza consumare numeriche.
- Run `42212283860`: **311/311 test** e build/preflight riusciti, su commit `2deda8ea393a7faff98cf23fa8e7fb13c151fdaf`.
- Scaletta originale ripristinata: 32 cinque speciali in mano; 33 dimensione mazzo speciale; 34 costruzione; 35 duplicate; 36 acquisizione; 37 combinazione numerica/speciale; 38 più speciali e ripescaggio; 39 catalogo definitivo.
- **Punti 33 e 35 confermati il 6 novembre 2026**: 24 speciali per mazzo e massimo 6 copie equipaggiate di ogni tipo, sempre tra quelle possedute. La regola è condivisa fra motore ed editor; limiti salvati v1 invariati. Documento: `docs/PUNTI_32_39_CONTINUITA_CARTE_SPECIALI.md`.


### Conferma successiva — Limiti speciali e avanzamento 32–39
- **24 carte speciali esatte** per mazzo costruito, **massimo 6 copie dello stesso tipo**: confermate dall'utente e non più numeri provvisori.
- In `src/specialCards.js` sono centralizzate le costanti lette da `src/specialDeckBuilder.js`; entrambi i percorsi validano 24/6. Aggiornati i test di 23/25 carte, sei/sette copie e riciclo prolungato senza creare nuove istanze o toccare le sette numeriche.
- **Punto 36:** sistema attuale di pacchetti gratuiti utilizzabile; rarità, costi e distribuzione rimangono sperimentali fino ai playtest.
- **Punti 37–38:** due effetti speciali offensivi distinti consentiti per un colpo matematico valido, il terzo rifiutato; reintegro immediato delle cinque speciali. Nuovi test di regressione sul riciclo.
- **Punto 39:** catalogo di otto tipologie operativo, ancora da ampliare dopo verifica delle meccaniche e prove pratiche. Nessuna nuova carta introdotta senza ruolo distinto.
- Resta necessario controllare la nuova esecuzione CI e provarne la giocabilità su telefono. Non anticipare la fase audiovisiva finale.
