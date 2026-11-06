# ECLISSI STELLARE — MASTER DECISIONI E RIPRESA, 6 NOVEMBRE 2026

**Documento di continuità per la scaletta generale di 53 punti.**
È un registro delle decisioni concordate e dei risultati REALMENTE collegati al gioco, non una dichiarazione che tutti i 53 punti siano implementati.

## Repository di lavoro — vincolo inderogabile
- Base storica: `marcoteghini1988-ai/test7` (`main` non modificato).
- Versione di lavoro integrata: branch `work/test8-punto22-fusioni-2026-11-06` nello stesso repository; **non esiste ancora un repository autonomo test8**.
- Il ramo incorpora sorgenti React/Vite, catalogo, asset, collezione, Shop, Hangar, duello e test.
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

## Correzione vincolante e Punto 23 — carte speciali (6 novembre)
**UNA FUSIONE SI ATTIVA ESCLUSIVAMENTE GIOCANDO LA RELATIVA CARTA DEL MAZZO SPECIALE.**
La Sincronia piena non autorizza più una fusione senza carta. Il pulsante MANOVRE può ancora cambiare formazione, ma non effettua fusioni gratuite. Anche l'IA deve possedere e consumare una speciale.

- Due mazzi e due mani separate: **7 numeriche + 5 speciali**.
- Dopo ogni speciale usata, pescata **immediata** fino a 5 speciali; nessun limite arbitrario aggiuntivo alla frequenza di pescata/uso.
- Si ammettono più copie dello stesso tipo speciale. Si potranno giocare più speciali nella stessa finestra d'azione purché gli effetti siano compatibili. Il motore attuale impedisce due fusioni simultanee della medesima madre, perché sono incompatibili.
- Catalogo attualmente **implementato**: solo `Fusione Barriera` e `Fusione Assalto` come carte speciali operative. Il mazzo dimostrativo usa 24 istanze (12 per tipo), numero provvisorio, con recupero degli scarti per mantenere la mano a cinque.
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
- **23 attuale: separazione dei mazzi e attivazione delle fusioni mediante speciali**. Presenti modulo, UI, IA e test; la restante parte delle interazioni madre/scudiere andrà ampliata.
- **24–29 (blocco meccaniche)**: ruoli/azioni cooperative, protezione, danno alle parti, effetti dei colpi, requisiti e concatenazioni dei calcoli, ritmo e bilanciamento. Ordine interno da seguire dalla master originale, senza rinumerare i 53 punti già concordati.
- **30 e successivi (mazzi speciali)**: creare le singole carte soltanto dopo le rispettive meccaniche, definire pacchetti e deckbuilding, sblocchi, varianti e compatibilità.
- **Altri blocchi master**: flotte/parti vitali (26, 28, 51–52); evoluzioni (29); piloti/comandante (40–41); arene (42–43); campagna (44–45); Shop (46); IA (9, 47); grafica e suoni (6, 7, 23, 24, 50); boss e mazzi dedicati (53). Questi riferimenti provengono dalla scaletta storica e le descrizioni potrebbero avere sovrapposizioni: per le funzioni vale questo registro, senza dichiarare chiusa l'intera master.

## Audio-visivo: RINVIATO SU RICHIESTA
**NON dedicare ora lo sviluppo alla lucidatura audio/visiva.** Le 17 sagome SVG e gli effetti di aggancio sono riferimenti tecnici temporanei. I modelli fisici 3D, l'allineamento delle bocche, l'animazione di fusione e gli effetti audiovisivi definitivi arriveranno DOPO aver inserito e provato le regole del gioco.

## Test
```sh
npm ci
npm run verify:logic
npm run build
npm run preflight
```
Verificare sempre GitHub Actions del ramo prima di dichiarare una fase conclusa. Una build automatica non certifica la giocabilità o la resa su Samsung Z Fold o altri dispositivi reali.

## Documento da seguire alla ripresa
Iniziare da **questo master**, da `docs/PUNTO_22_INTEGRAZIONE.md`, da `src/specialCards.js` e da `src/MathDuelBattle.jsx`. Aggiornare i rapporti dopo ogni nuova decisione e non modificare `test7/main` fino a una consegna espressamente richiesta.
