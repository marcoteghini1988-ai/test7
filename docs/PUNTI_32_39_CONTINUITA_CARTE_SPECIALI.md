# Eclissi Stellare — Ripresa dei punti 32–39 (6 novembre 2026)

**Repository unico:** `marcoteghini1988-ai/test7`, ramo `main`. Non creare copie né nuovi rami.

## Scaletta originale e stato dei punti

| Punto | Definizione originale | Stato verificato | Decisioni ancora aperte |
| --- | --- | --- | --- |
| 32 | Cinque speciali in mano | **Implementato**: `SPECIAL_HAND_SIZE=5`, mano diversa dalle sette numeriche | Solo prova pratica UI 9:16 |
| 33 | Dimensione del mazzo speciale | **Confermato: 24 carte esatte** nel mazzo equipaggiato, con validazione comune a editor e duello | Da collaudare sul dispositivo reale |
| 34 | Costruzione personalizzata | **Implementato**: editor Hangar e schermata flotta, inventario persistente | Bilanciamento rarità/frequenze |
| 35 | Carte speciali duplicate | **Confermato: massimo 6 copie** dello stesso tipo, sempre entro il numero posseduto | Da misurare il bilanciamento nelle partite |
| 36 | Acquisizione delle speciali | **Implementato in prova**: 1 credito pacchetto alla prima vittoria per settore, 3 copie reali per apertura | Rarità, ricompense future, economia Shop |
| 37 | Combinazione numerica + speciale | **Prima implementazione**: numeriche attivano colpi validi; una o due speciali reali modificano l'effetto della scarica | Casi avanzati delle 17 flotte e nuove abilità |
| 38 | Più speciali e ripescaggio | **Implementato**: fino a due effetti offensivi distinti nella stessa scarica, refill dopo ogni carta, scarti riutilizzati | Bilanciamento del ritmo, altri effetti combinabili |
| 39 | Catalogo definitivo speciali | **Ampliamento in corso**: nove tipi giocabili, sei iniziali + tre supporti da ottenere | Provare le nuove interazioni e definire soltanto dopo il catalogo finale |

## Vincoli già approvati e preservati

- Mano: **7 carte numeriche** e **5 speciali** separate; nessuna speciale sostituisce numeriche.
- Dopo ogni carta speciale **effettivamente giocata**, la mano speciale si riporta subito a cinque; non introdurre limiti d'uso o di pescata arbitrari.
- Più copie dello stesso tipo possedute ed equipaggiate sono ammesse; ciascuna è una carta reale con propria identità.
- Una fusione richiede obbligatoriamente la relativa **carta Fusione** e 100 Sincronia: la Sincronia da sola non autorizza la fusione.
- Niente fusioni incompatibili simultanee e niente terzo effetto offensivo nella stessa scarica.
- Le speciali offensive non creano colpi gratuiti e non sostituiscono la validazione matematica e le firme dei vitali.
- Le carte speciali si spendono solo se l'azione è utilizzabile; le carte di supporto non inventano HP né curano vitali KO.
- Una volta terminata la pesca, la mano viene ricostituita con gli **scarti effettivamente giocati**; nessuna carta numerica è coinvolta.
- Catalogo, economia e probabilità delle speciali **non** sono definitivi finché le meccaniche rimangono aperte.

## Verifiche integrate

La nuova suite `src/specialFlow.test.js` copre:
1. Due speciali offensive compatibili possono essere armate consecutivamente in una singola finestra, con mano sempre di cinque, e il terzo effetto viene rifiutato senza consumo.
2. Preparare un effetto e risolvere un impatto reale sullo scudo non tocca le numeriche.
3. Due carte supporto diverse possono essere giocate consecutivamente solo quando utili; riparazione e pulizia applicano effetti veri, senza usare numeriche né perdere copie.

**CI GitHub Actions:** 311 test logici superati, build e preflight riusciti sul commit `2deda8ea393a7faff98cf23fa8e7fb13c151fdaf`: https://github.com/marcoteghini1988-ai/test7/actions/runs/42212283860

## Decisione approvata — Punti 33 e 35 (6 novembre 2026)

L'utente ha confermato **24 carte esatte per mazzo speciale** e **massimo 6 copie equipaggiate per tipologia**. La dimensione e il limite copie diventano regole del gioco; una eventuale revisione futura sarà una scelta di bilanciamento esplicita, non un valore implicito o provvisorio.

- La fonte unica dei valori è `src/specialCards.js`: `SPECIAL_DECK_SIZE=24` e `SPECIAL_DECK_COPY_LIMIT=6`. Il builder importa e riesporta questi valori, senza duplicarli.
- L'editor non consente di superare 24 slot o 6 copie per tipo; il validatore non permette di superare le copie possedute.
- L'inizializzatore del combattimento rifiuta mazzi di 23/25 carte e la settima copia. Le istanze hanno ID propri e i salvataggi esistenti rimangono sullo schema v1 (nessuna migrazione necessaria per i limiti invariati).
- Aggiunti i test ai confini in `src/specialDeckBuilder.test.js` e il test di **96 cicli di ripescaggio** in `src/specialFlow.test.js`, per verificare 24 ID stabili e mano numerica intatta.

## Prossimo sviluppo, senza decidere prematuramente l'economia

- **36 — Acquisizione:** mantenere il prototipo giocabile (un pacchetto gratuito alla prima vittoria del settore, tre carte vere a estrazione). Non dichiarare definitive le probabilità uniformi, rarità, prezzi o nuove valute prima di provarne l'effetto sulla progressione.
- **37 — Numeriche + speciali:** la firma matematica resta obbligatoria per colpire i vitali; gli effetti speciali si applicano solo ai tiri effettivi. Estendere i collaudi ai diversi ruoli delle 17 flotte senza nuovi vantaggi gratuiti.
- **38 — Uso multiplo e ripescaggio:** confermare i due effetti offensivi distinti per scarica e il reintegro immediato a cinque, verificando che il riciclo conservi solo carte realmente scartate.
- **39 — Catalogo:** otto tipologie operative, non ancora catalogo finale. Ampliare solo con nuove funzioni strategiche distinguibili emerse da playtest o da regole concordate.

## Prove pratiche indispensabili su smartphone 9:16

1. Entrare nell'Hangar, tentare di salvare 23 e 25 speciali: il salvataggio deve essere bloccato; salvare 24 è consentito se possedute.
2. Ottenere abbastanza copie dai pacchetti e tentare la settima dello stesso tipo: il controllo deve bloccarla; sei sono ammesse.
3. Entrare in duello, verificare **7 numeriche + 5 speciali separate**, e che l'uso di una speciale ripristini subito la mano a 5.
4. Preparare Perforante + Ionico per un colpo matematicamente valido; un terzo effetto offensivo deve essere rifiutato senza consumo.
5. Verificare che fusione e supporti senza requisiti non consumino carte. Giocare diversi cicli di mazzo e verificare eventuali blocchi/ripetizioni inattese.
6. Riavviare la pagina e controllare che collezione, mazzo equipaggiato e crediti pacchetto persistano. Il bilanciamento delle 24 carte va misurato giocando.

**CI precedente:** 311 test, build e preflight riusciti sul commit `2deda8ea393a7faff98cf23fa8e7fb13c151fdaf`; le modifiche alla regola 24/6 necessitano di una nuova verifica CI dopo il push.

La grafica 3D e gli effetti audio definitivi restano rinviati.

## Avanzamento — Punto 39: carta Riparazione Scudiera

Nuova carta **Riparazione Scudiera** (`support-escort-repair`), nona tipologia operativa nel prototipo. È un supporto distinto dalla riparazione dello scudo della madre: seleziona **una scudiera esistente**, restituisce fino a **15 HP** al suo scudo, senza oltrepassare il massimo, e **consuma una vera carta speciale**. Il valore 15 resta da bilanciare giocando.

- Serve una madre con **centralina funzionante**, una scudiera esistente e non distrutta, scudo non pieno. Si può riattivare uno scudo scudiera arrivato a zero se la scudiera **non è stata distrutta**, ma non si rianima una scudiera distrutta.
- Una scudiera ancora **agganciata in fusione** non può ricevere la riparazione. La carta non viene consumata in caso di bersaglio errato, scudo pieno, centralina KO, fusione incompatibile o scudiera distrutta.
- Il selettore delle speciali ora consente di scegliere anche una scudiera con scudo a zero (non distrutta). L'IA può scegliere e consumare la stessa carta se lo scudo di una propria scudiera è sotto il 55%.
- La mano speciale torna immediatamente a **5**, le **7 numeriche** restano separate e il mazzo speciale resta di **24** con massimo **6 copie** per tipo.
- Nuova tipologia **non distribuita gratuitamente** nel mazzo iniziale. È ottenibile nei pacchetti da tre; le probabilità del prototipo sono uniformi fra i nove tipi, non ancora bilanciate.
- **Compatibilità salvataggi**: una collezione v1 precedente, senza il nuovo campo di proprietà della carta, viene letta attribuendo **0 copie iniziali** al solo nuovo tipo; crediti, ricompense, mazzo e inventario preesistenti restano invariati. La mancanza di una tipologia storica resta errore, non reset automatico.
- Test in `src/escortRepair.test.js` e `src/specialDeckBuilder.test.js`: scudiera selezionata, scudo pieno/zero, distruzione, centralina/fusione, limite HP, consumo reale, ripescaggio, vecchi salvataggi e acquisizione dai pacchetti.

**Verifiche:** file pubblicati su `test7/main`; non risulta ancora disponibile un esito CI leggibile per i nuovi commit. Non dichiarare superati i nuovi test o riuscita la build finché non si ottengono risultati verificati. Prova pratica su telefono ancora necessaria.

Il catalogo NON è ancora definitivo; le nuove speciali andranno validate in partita per valore strategico e bilanciamento prima di chiudere il punto 39.
