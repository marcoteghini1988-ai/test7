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
- Catalogo attualmente **implementato**: `Fusione Barriera`, `Fusione Assalto`, `Copertura Tattica`. Il mazzo dimostrativo contiene 24 istanze (8 per tipo), distribuzione provvisoria, con recupero degli scarti per mantenere la mano a cinque. Copertura Tattica protegge la madre dal prossimo colpo entro 15 secondi usando lo scudo della prima scudiera; non richiede Sincronia, non si cumula con le fusioni.
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
- **26–29**: danni ai sistemi (26), effetti dei colpi (27), requisiti matematici/armi/condizioni (28), ritmo (29). Da proseguire nell'ordine della master.
- **30 e successivi (costruzione mazzi speciali)**: estendere la base già pronta con le singole carte decise, pacchetti e deckbuilding, sblocchi, varianti e compatibilità, dopo la definizione delle relative meccaniche.
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
- 213 test logici superati (13 nuovi test Punto 25, oltre ai 200 precedenti), build e preflight automatizzati; interfaccia reale e bilanciamento da collaudare.
- **Prossima priorità: punto 26, danni localizzati ai sistemi vitali**, senza completare ancora audio/visivo.
