# Eclissi Stellare — Duello dei Motori

Gioco React/Vite esistente, con Home, Shop, assetto/Hangar e campagna. Il combattimento attivo usa `MathDuelBattle.jsx`: i vecchi moduli Poker rimangono nel progetto per compatibilità, ma non sono il regolamento del duello attivo.

## Versione da proseguire

Il passo 1 del piano di lavoro è descritto in [docs/PASSO_1_VERIFICA_E_AVVIO.md](docs/PASSO_1_VERIFICA_E_AVVIO.md).

Il passo 2 integra l'arena metallica verticale ed è descritto in [docs/PASSO_2_ARENA_METALLICA.md](docs/PASSO_2_ARENA_METALLICA.md).

Il passo 3 dispone una, due o tre navi in posti fissi, con scala uniforme per lato e selezione diretta di tutti i motori installati. Verifiche e formazioni miste: [docs/PASSO_3_FORMAZIONI.md](docs/PASSO_3_FORMAZIONI.md).

Il passo 4 integra le sette armi nelle prime cinque navi e localizza il danno sulle gondole dei motori: [docs/PASSO_4_MONTAGGI_FISICI.md](docs/PASSO_4_MONTAGGI_FISICI.md).

Il passo 5 distingue proiettili, raffiche, traiettorie, suoni e impatti delle prime sette armi, sincronizzati con le munizioni effettive: [docs/PASSO_5_FIRME_DELLE_ARMI.md](docs/PASSO_5_FIRME_DELLE_ARMI.md).

Il passo 6A aggiunge quattro navicelle rare e nove armi. Dati e prove sono in [docs/PASSO_6A_FLOTTA_RARA.md](docs/PASSO_6A_FLOTTA_RARA.md).

Il passo 6B aggiunge quattro navicelle epiche e tredici armi. Le epiche sbloccano la Divisione al livello 4. Il rapporto è in [docs/PASSO_6B_FLOTTA_EPICA.md](docs/PASSO_6B_FLOTTA_EPICA.md).

Il passo 6C completa le **17 navicelle e 42 armi** del catalogo nel duello di prova. Le leggendarie hanno quattro motori dal livello 1. La memoria delle combo è visibile in arena. Il rapporto è in [docs/PASSO_6C_FLOTTA_LEGGENDARIA.md](docs/PASSO_6C_FLOTTA_LEGGENDARIA.md).

Il primo blocco del passo 7 integra le **25 evoluzioni visive delle cinque comuni**. In **Flotta** il selettore di livello aggiorna carta, scocca, armi, motori e HP di prova. [Rapporto del passo 7A](docs/PASSO_7A_EVOLUZIONE_COMUNI.md).

Il passo 7B aggiunge le **20 evoluzioni visive delle quattro rare**. Falco Binario, Manta Ionica e Iride mostrano il motore × dal livello 3. Squalo del Vuoto lo monta già al livello 1. [Rapporto del passo 7B](docs/PASSO_7B_EVOLUZIONE_RARE.md).

Il passo 7C aggiunge le **20 evoluzioni visive delle quattro epiche**. In **Flotta**, Nebulosa, Tempesta, Fenice e Orizzonte mostrano la Divisione dal livello 4. [Rapporto del passo 7C](docs/PASSO_7C_EVOLUZIONE_EPICHE.md).

Il passo 7D completa le **85 configurazioni visive delle 17 navicelle** con le evoluzioni delle quattro leggendarie. Tutte e quattro mostrano i quattro motori dal livello 1. [Rapporto del passo 7D](docs/PASSO_7D_EVOLUZIONE_LEGGENDARIE.md).

Il passo 8 salva proprietà, livelli e flotta nel browser. Prima del primo attacco, apri **Flotta → Collezione** per equipaggiare le carte possedute. **Prova** offre il catalogo completo con livelli temporanei. [Rapporto del passo 8](docs/PASSO_8_COLLEZIONE.md).

Il passo 9 collega la collezione al **Bazar → Navi** e all’**Assetto → Hangar della flotta**. Nel Bazar puoi vedere proprietà, livelli e anteprime. Nell’Hangar puoi salvare la formazione prima di entrare in battaglia. [Rapporto del passo 9](docs/PASSO_9_SHOP_HANGAR.md).

Il passo 10 introduce la sequenza di apertura del duello. Dopo la distribuzione delle sette carte, le flotte si schierano, le navi si materializzano e armi e motori entrano in linea. **Salta intro** e **Riduci movimento** sono disponibili durante la sequenza. [Rapporto del passo 10](docs/PASSO_10_INTRO_DUELLO.md).

## Regole del combattimento attivo

- Mazzo standard da 52 carte, sette carte in mano; A=1, J=11, Q=12, K=13.
- **Combattimento continuo (nuova scaletta, punti 08–09):** il giocatore **non ha turni né limiti di tempo**, può giocare in qualsiasi momento. L'IA tenta un'azione ogni 35–40 secondi nei primi settori della campagna; diventa progressivamente più veloce fino a 25–30 secondi all'ultimo dei 120 settori (**valore avanzato provvisorio da bilanciare**). Le animazioni vengono ancora risolte una per volta.
- Si sceglie un motore nemico e si risolve il suo bersaglio con due carte. Sottrazione e divisione verificano gli ordini ammessi; la divisione deve essere esatta.
- Il risultato matematico abilita lo sparo. I valori delle carte forniscono munizioni e i semi attivano le armi; il risultato non è il danno.
- Ogni arma compatibile di ciascuna nave riceve le munizioni previste. Accumulo e danni per proiettile dipendono dal catalogo.
- Le combo a memoria raccolgono i semi degli ultimi tre o quattro calcoli validi. Quando si completano, sparano tutte le munizioni del seme primario presenti nella finestra e la memoria dell’arma si svuota. Un calcolo errato azzera la serie.
- Ogni motore ha HP propri. Dopo un KO si può selezionare un motore superstite o una nave nemica ancora attiva.
- Aurora-0 è l'universale iniziale con due motori, + e −. Le flotte di prova arrivano a tre navi; non equivalgono a proprietà e acquisti permanenti.

## Avvio e verifiche

```sh
npm ci
npm run dev
npm run build
npm run test:combat
npm run verify:logic
npm run preflight
```

`build` esegue TypeScript e Vite. `test:combat` esegue i 79 test del duello, del catalogo, della geometria e degli effetti delle armi. `verify:logic` include anche i 9 test della precedente logica matematica, per un totale di 88.

Il controllo dei simboli legacy inutilizzati è disponibile separatamente con `npm run check:unused`: al termine del passo 1 segnala ancora 94 elementi. Non sono stati cancellati componenti, hook o funzionalità per eliminare queste segnalazioni. La build continua a verificare i tipi; non usa `noCheck` o `ts-nocheck`.

## Stato reale

Il passo 1 ha verificato build, struttura, test e avvio reale della battaglia con attacco e risposta IA. Sono stati aperti anche Home, Shop, assetto e briefing di campagna.

La plancia corrente usa l'arena metallica in prospettiva nel formato 9:16, con flotte affiancate in posti fissi. Ogni colpo parte dalla propria bocca e arriva sul motore selezionato. Impatti e applicazione degli HP seguono la stessa sequenza temporale. Le armi ad accumulo sparano al raggiungimento della soglia e il danno fisico rimane localizzato sulla gondola colpita. Le evoluzioni delle epiche costituiscono il blocco successivo del passo 7.

Il primo collaudo è stato svolto nell'anteprima dell'ambiente di lavoro. Nella verifica successiva il WebContainer della copia salvata di StackBlitz è ripartito: la copia è stata aggiornata, salvata e ricaricata, e la nuova arena con le immagini delle navi è stata verificata anche lì. L'apertura diretta del repository ha invece ancora restituito un errore di clonazione.

## Copia salvata di StackBlitz

Un progetto salvato con URL `/edit/...` è una copia separata: aggiornare GitHub non ne aggiorna automaticamente i file. Dopo ogni fase occorre sincronizzare e salvare anche questa copia, oppure aprire direttamente il repository corrente.

Per le copie con spazio limitato per le immagini, `VITE_ASSET_ROOT` può indicare una cartella pubblica di asset già ospitati. In assenza della variabile il gioco usa `/assets`, come prima. La copia Test7 di StackBlitz usa questa configurazione pubblica in `.env.local`:

```text
VITE_ASSET_ROOT=https://raw.githubusercontent.com/marcoteghini1988-ai/test7/main/public/assets
```

Questa variabile contiene soltanto un URL pubblico. Le immagini restano incluse nel repository per i normali avvii e le build autonome. La copia salvata usa GitHub per le immagini del duello, incluse le due viste WebP di ciascuna nave rara, epica e leggendaria. Dopo ogni modifica verificare il salvataggio con un ricaricamento e una prova della scena reale.

La copia di consegna è https://stackblitz.com/edit/github-edu2s6xy?file=README.md. Ogni fase deve aggiornare `main` e sincronizzare esplicitamente la copia salvata, quindi verificarla dopo un ricaricamento.


## Migrazione al nuovo regolamento: stato al 5 novembre 2026

Riferimento: scaletta master di **53 punti**, distinta dalla vecchia numerazione dei passi del motore.

- **Punto 08 — IN PROTOTIPO:** eliminati i turni alternati e ogni timer del giocatore. L'azione del giocatore non scade: prepara e attacca quando vuole. Per ora gli effetti di due attacchi simultanei vengono animati in sequenza, senza turno avversario obbligatorio.
- **Punto 09 — IN PROTOTIPO:** solo l'IA ha un intervallo di decisione (35–40 s iniziali). In campagna esso diminuisce progressivamente fino a 25–30 s all'ultimo dei 120 settori; la riduzione finale è un parametro **da collaudare**, non una scelta definitiva dell'utente. Se non ha un calcolo valido, l'IA tenta uno scambio e aspetta la prossima decisione. L'IA tattica definitiva verrà progettata separatamente.
- **Punto 13 — PARZIALE:** i bersagli matematici restano fissi per tutto lo scontro, ma devono ancora essere sostituiti con i requisiti permanenti di ogni parte vitale e con le figure Poker.
- **Punto 21 — DECISO, DA IMPLEMENTARE:** il seme è **solo un identificativo di caricamento delle munizioni**, senza cura/danno/tempo/Etere automatici. Il valore della carta determina i proiettili; ogni arma o nave accetta da uno fino a quattro semi alternativi secondo il catalogo futuro. Non confondere con le vecchie combo simultanee obbligatorie.
- **Punti 03–04, 10–12, 14, 16–20 e successivi — DA MIGRARE:** le attuali tre navi indipendenti, i quattro motori con HP, il vecchio sistema di danno e le sole coppie numeriche sono ancora codice legacy. La nuova flotta sarà madre + scudiere sbloccate ai livelli 3 e 5; scudi, quattro parti vitali, colpi finali e carte speciali richiedono implementazioni successive.
- **Carte speciali:** mano separata da 5, reintegro immediato, contenuto delle singole carte da decidere soltanto dopo il completamento delle altre meccaniche.

**Non confondere "prototipo" con "meccanica definitiva".** Non sono stati alterati gli asset delle 17 navi, le 42 armi, il Bazar e l'Hangar. La grafica finale e le nuove scudiere saranno affrontate nelle fasi dedicate.

## Combattimento continuo — colpi contemporanei (5 novembre 2026)
- Gli attacchi non si bloccano tra loro: il giocatore può continuare a scegliere e usare carte mentre i proiettili sono in volo e l'IA può sparare contemporaneamente.
- Le carte vengono consumate al lancio; gli HP vengono ridotti all'arrivo, applicandoli allo stato più recente del bersaglio. Gli attacchi in volo non possono sovrascrivere i danni fra loro.
- Il risultato per distruzione della flotta o per esaurimento del mazzo attende gli impatti ancora da applicare.
- Nessuna grafica o catalogo modificato. Le prossime fasi migreranno il vecchio sistema di quattro motori alle parti vitali, scudi e scudiere previste dalla nuova scaletta.

## Fase difesa, punto 10: implementazione logica autonoma

Prima di intervenire sull'arena attiva, la nuova macchina a stati di **scudo madre / 4 vitali / scudiere** è stata isolata in [src/vitalDefense.js](src/vitalDefense.js), con [test dedicati](src/vitalDefense.test.js). Le soglie 75/50/25/0, la scelta dell'attaccante, gli HP separati e la riprotezione dopo la riparazione sono implementati. La futura battaglia dovrà ancora collegare la nuova logica alla UI, all'IA e ai colpi delle armi. Le firme per modello e gli HP definitivi sono lasciati aperti. [Specifiche del punto 10](docs/PUNTO_10_DIFESA_MADRE_VITALI.md).

## Punto 10: scudi e vitali collegati all'arena (prototipo)

Nel duello **una madre contro una madre**, il nuovo HUD dell'arena 9:16 mostra la barra dello scudo e le quattro parti vitali. I calcoli validi scaricano lo scudo. Ogni soglia 75/50/25/0% consente al giocatore di scegliere quale sistema esporre e colpire. Gli HP dei vitali diminuiscono all'impatto. L'IA espone autonomamente un sistema della madre avversaria. **Vittoria: quattro sistemi vitali KO.**

La condizione matematica per danneggiare un sistema esposto è *temporaneamente* la stessa operazione numerica già valida nel duello precedente: **le firme permanenti per ciascuno dei 17 modelli non sono state inventate**. Gli HP di prova derivano dalle caratteristiche attuali della nave e saranno riequilibrati. Gli indicatori fisici delle vecchie gondole restano come selettori dei calcoli, ma non rappresentano più le quattro parti vitali.

Le flotte con più navicelle usano temporaneamente il vecchio sistema: non vengono falsamente convertite in scudiere. Le immagini delle navi, l'arena e le carte collezionabili non sono state sostituite. Le bocche delle armi e i bersagli VFX per i quattro vitali andranno raccordati al modello visivo definitivo.


**Precisione sulla cadenza dell'IA (5 novembre 2026).** La campagna attiva nell'app usa la modalità `adventure`, non `campaign`. I 12 pianeti hanno 10 settori ciascuno e ID storici non consecutivi: il motore ora li converte nella progressione corretta di 120 settori. L'IA parte da 35–40 secondi e accelera fino a 25–30 secondi soltanto all'ultimo settore, non già al trentesimo. Il giocatore non ha timer.

## Punto 11 — Scudiere collegate (prototipo)
Ai livelli L3/L5 si schierano una/due scudiere, senza nuove carte da acquistare. Ognuna ha scudo e bersaglio separati; intercetta il 20% del danno diretto alla madre quando ha scudo attivo (bilanciamento provvisorio). Le scudiere si selezionano dall'arena e l'IA può sceglierle come bersaglio. A scudo zero la formula math visualizzata in arena distrugge la scudiera (firma provvisoria per la partita, **non definitiva per modello**). La madre può essere distrutta anche se le scudiere sono ancora vive. Sagome SVG temporanee: le immagini individuali, le armi e le sinergie di tutte le 17 flotte restano da progettare. Flotte con più carte equipaggiate mantengono temporaneamente il duello precedente. I livelli salvati nella collezione sono preservati.

**Scheda di passaggio a Work e grafica scudiere:** [docs/PUNTO_11_SCUDIERE_INTEGRATE.md](docs/PUNTO_11_SCUDIERE_INTEGRATE.md). Distingue il prototipo già nel codice dai ruoli, HP, immagini e firme ancora da progettare.


## Asset grafici delle scudiere inseriti (6 novembre 2026)
Sono state aggiunte **34 immagini SVG individuali** in `public/assets/escorts/` (17 modelli di madre × 2 scudiere). Le navicelle hanno fusoliere e ali variabili per famiglia, cannoni, corazza metallica, reattori e colori coerenti con la madre. La prima ha una silhouette da scorta difensiva, la seconda un profilo offensivo. `MathDuelBattle.jsx` legge direttamente i file dal percorso pubblico tramite `ASSET_ROOT`: le vecchie sagome SVG inline non vengono più usate. Sono immagini vettoriali operative create per la fase di sviluppo, da perfezionare con Work; le quattro anteprime raster generate in chat non sono tutte disponibili come file individuali e non sono state falsamente dichiarate già caricate. Le immagini delle madri restano intatte.

## Munizioni e armi delle scudiere (6 novembre 2026)
Sono configurate 34 armi subordinate in `src/escortArmory.js`, con semi ammessi alternativi, danni, fuoco immediato o accumulo, e intercettazione distinta per modello. Il seme non ha un effetto automatico: alimenta un cannone compatibile. Nel prototipo madre + scudiere `src/escortFiring.js` assegna ogni carta a una sola arma, e il selettore ARMA consente di scegliere la destinazione preferita. Le munizioni ad accumulo persistono fra gli attacchi. I proiettili delle scudiere partono dai rispettivi asset; i 42 armamenti della madre e le flotte legacy restano conservati. Tutti i valori di bilanciamento sono di prova.

**Correzione VFX:** i profili di armi a doppia bocca vengono adattati al punto di lancio unico della scudiera, evitando colpi senza coordinate in arena. Il comportamento della madre rimane inalterato.


## Conseguenze dei quattro sistemi vitali (6 novembre 2026)
Nel prototipo madre + scudiere, i componenti distrutti ora incidono sul combattimento: **motore KO** riduce il danno dei cannoni di tutta la flotta del 25%; **sistema armi KO** dimezza il danno della madre, mantenendo operativi i cannoni di emergenza; **generatore scudi KO** fa collassare la barriera residua e blocca le riparazioni; **centralina di comando KO** impedisce alle scudiere di intercettare e ne riduce il danno del 40%. Le penalità si cumulano, ma semi, caricatori, carte e immagini non cambiano. Tutti i valori sono provvisori e concentrati in `src/fleetSystems.js`; relativi test in `src/fleetSystems.test.js`.
