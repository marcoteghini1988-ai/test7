> **VERIFICA STRATEGICA 8/11/2026 — NESSUN CAMBIAMENTO ALLE 42 ARMI.** Corretti **tre problemi tra Carte Speciali**: (1) i Moduli di danno/cura sono risolti sul medesimo snapshot, senza vantaggio del lato A; (2) i due Dadi Quantici non ottengono più obbligatoriamente la stessa faccia e ciascuno può produrre tutti i sei esiti; (3) la Carta Personaggio Idra ripara con le regole vere del Generatore e richiude i vitali quando la barriera supera le soglie. Nessun pulsante di abilità gratis, nessun cambiamento alla plancia o alle 17 navicelle. **720 test riusciti + build/preflight** al commit `be5ad66`. [Rapporto della revisione](docs/REVISIONE_STRATEGICA_MODULI_DADI_BOSS_2026-11-08.md).

> **AUDIT COMPATIBILITÀ 8/11/2026 — CARTE ABILITÀ E VECCHIO POKER.** Confermato che l'ingresso dell'app usa `MathDuelBattle.jsx`: i vecchi pulsanti di `LegacyPokerBattle.jsx` rimangono soltanto nel percorso sorgente disabilitato. Il fallback **attivo** `BossBattle3D.jsx` ora non crea più un mazzo predefinito se l'inventario non è valido: chiede di correggere il mazzo nell'Hangar, senza toccare i salvataggi. I soli tipi che può eseguire sono Fusioni, Difese, Volée e Supporti; Carte Boss, Dado, Malus, Faglia, Mutazione, Epici, Terreni e 35 Moduli sono filtrati **solo nella battaglia legacy** e restano giocabili nelle modalità simultanee consentite. Sistemati inoltre Sifoni Sincronia simultanei A/B e Purificazione che non cancella più la propria carica Malus. **712 test, build/preflight superati** al commit `eaeea093`. [Rapporto di audit](docs/AUDIT_MOTORE_POKER_FALLBACK_E_MODULI_2026-11-08.md).

> **REVISIONE STRATEGICA 8/11/2026 — VISIBILITÀ DELLE FIRME E FAGLIA.** Corretta la plancia: una formula matematica non viene più suggerita per un vitale **protetto e non scansionato**. La Scansione o l'esposizione sbloccano i suggerimenti; con Faglia si può comunque tentare una formula manuale, senza conoscere in anticipo la risposta. L'IA rispetta la stessa visibilità. Verificati gli effetti reali della Faglia su motore, centralina e generatore e la difesa tramite Mutazione; la Faglia già usata è disabilitata nei cinque slot originali. **703 test superati, build/preflight riusciti** sul commit `f1e5aa84`. [Revisione completa](docs/REVISIONE_STRATEGICA_FAGLIA_E_VISIBILITA_2026-11-08.md).

> **AGGIORNAMENTO 8/11/2026 — FAGLIA DI VULNERABILITÀ.** Aggiunta al duello ufficiale la **Carta Speciale Faglia** (`tactic-vulnerability-rift`): una combinazione numerica autentica può colpire direttamente un motore, armi, generatore o centralina **senza abbattere la barriera**, con massimo 5 HP sul vitale protetto. Non apre lo scudo né aggira la firma o la Contromisura. Una copia massima nel mazzo da 24 e un utilizzo per battaglia; zero copie regalate nello starter, acquisizione tramite pacchetti speciali ordinari. È già collegata a IA, replay e plancia originale 9:16 senza spostamenti. **694 test superati, build e preflight riusciti** sul commit `c2d2800`. [Specifica Faglia](docs/FAGLIA_DI_VULNERABILITA_CARTA_SPECIALE_2026-11-08.md).

> **CORREZIONE VINCOLANTE 8/11/2026 — DADO, MALUS E MODULI SOLO VIA CARTE SPECIALI.** Il Dado Quantico ora richiede **la sua Carta Dado** oltre a tre formule valide differenti; il lancio a pulsante gratuito è rimosso dal duello simultaneo. La Barra Malus può agire soltanto consumando la sua carta dopo tre colpi efficaci. Tutti i **35 Moduli Abilità** del catalogo 16F sono stati convertiti in Carte Modulo distinte, una copia per tipo, sbloccate soltanto da acquisti registrati in `eclissi_abilities`; nessun equipaggiamento si attiva solo perché posseduto. Restano invariati mazzo 24/5, numeriche 52/7 e plancia 9:16. Verifica iniziale 685/685 test + build/preflight al commit `b6f08db`. Documento: [Carte Dado, Malus e Moduli](docs/CARTE_DADO_MALUS_EQUIPAGGIAMENTI_2026-11-08.md). Le righe precedenti sulla possibilità di lanciare il Dado senza carta sono superate.

> **AGGIORNAMENTO 8 novembre 2026 — Dado Quantico / Numero Bomba / Barra Malus / Carta Dorata.** I quattro meccanismi storici sono collegati al duello simultaneo 3D senza ricreare una plancia alternativa: Dado caricato da 3 formule differenti, bomba su una delle 7 numeriche avversarie reali con disinnesco, tre tacche Malus ottenute colpendo veri vitali e Dorata temporanea con quattro bonus per seme. Le nuove speciali Bomba/Malus/Dorata partono da zero copie e possono arrivare solo dai pacchetti normali; nessun guadagno di valuta viene concesso dal duello non auditato. Verificati **677/677 test**, build e preflight al commit `0d41ebf7`. Dettagli in [Migrazione eventi 16B](docs/MIGRAZIONE_16B_DADO_BOMBA_MALUS_DORATA_2026-11-08.md); collaudo Android reale ancora aperto.

> **AGGIORNAMENTO 8 novembre 2026 — Epici e reliquie.** Sei Oggetti Epici delle dodici reliquie originali collegati alla collezione speciale da 24 carte del nuovo duello. Importazione non distruttiva dai salvataggi storici della Cripta, 1 copia per tipo, massimo 2 nel mazzo, rispetto dei due slot L20/L60. Nessun premio gratuito o doppio effetto passivo. Verificati 664 test, build e preflight sul commit `1e4bf75e`. Per dettagli e limiti: [integrazione Epici](docs/EPICI_RELIQUIE_INTEGRAZIONE_UFFICIALE_2026-11-08.md).

> **AGGIORNAMENTO 8 novembre 2026 — Mutazione della Firma.** Inserita la carta difensiva che cambia per un ciclo la formula di un proprio vitale già esposto. La mano e la plancia 9:16 non sono state riposizionate. I test ufficiali hanno raggiunto **656/656** sulla build verificata `4377ec9c` (oltre a build/preflight). Verifica visiva Android ancora necessaria. Dettagli in [Mutazione della Firma](docs/MUTAZIONE_FIRMA_TATTICA_2026-11-08.md).

> **NOVITÀ — 8 novembre 2026.** Aggiunte quattro Carte Terreno PvP nel mazzo speciale da 24 e nel motore simultaneo (due cicli, vantaggi e svantaggi per entrambi i lati, quattro fondali SVG). Le arene dei boss non vengono sostituite e i salvataggi restano invariati. Questi Terreni non sono ancora ottenibili con ricompense/pacchetti perché il sistema di sblocco non è stato definito; non sono stati verificati il collaudo mobile e l'esito completo della CI. Vedi [documentazione Terreni PvP](docs/CARTE_TERRENO_PVP_INTEGRAZIONE_2026-11-08.md). Le righe di stato del 7 novembre e le sezioni storiche sotto sono cronologia, non il riepilogo più recente.

# Eclissi Stellare — Gioco ufficiale 3D

> **STATO CORRENTE — 7 novembre 2026, `test7/main`.**
> Il gioco avvia un solo ingresso `App.tsx → MathDuelBattle.jsx`, senza schermate separate di prova. La campagna standard utilizza `OfficialBattle3D.jsx`: **30 secondi di preparazione simultanea e 8 secondi di risoluzione**, 7 carte numeriche pescate dal mazzo di 52 e 5 speciali dal mazzo di 24 carte possedute.
>
> **Già integrati:** 17 navicelle e 42 armi della grafica prospettica originale 9:16; 4 piloti comuni L1–L5; **9 passive boss in 6 mazzi**, sempre con i livelli sbloccati: Gaia 1, Tharsis 1, Crono 1, Leviatano 2, Ombre 2, Idra 2. Le altre **14 passive boss**, i piloti avanzati e alcune arene rimangono temporaneamente nel combattimento 3D preesistente per non perdere poteri o progressione.
>
> **Validazione:** GitHub Actions esegue `npm run verify:logic`, `npm run build` e `npm run preflight`; il collaudo visivo su Android resta da fare. Nessuna dichiarazione di gioco completato o di mesh 3D reali.

**[Guida di avvio aggiornata](AVVIO_TEST7.md)** · **[Roadmap 30+8](docs/ROADMAP_DUELLO_TATTICO_SIMULTANEO_2026-11-07.md)** · **[Checklist visiva](docs/WORK_HANDOFF_CONTROLLO_VISIVO_ECLISSI_STELLARE.md)**

Le sezioni tecniche successive documentano anche fasi storiche del progetto; quando si discostano dalla guida di avvio, prevale la guida corrente.

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


## Scudiere: sette ruoli tattici (6 novembre 2026)
Le famiglie in `src/escortArmory.js` applicano ora, tramite `src/escortTactics.js`, un ruolo difensivo o offensivo. **Guardia:** +8% intercettazione quando lo scudo madre è al 50% o meno. **Intercettore:** +10% contro colpi ai vitali. **Baluardo:** +12% con scudo madre al 25% o meno. **Assalto:** +25% danni agli scudi delle scudiere. **Incursore:** +25% danni ai vitali. **Assedio:** +35% danni allo scudo madre. **Artiglieria:** +20% danni agli scudi. I bonus all'intercettazione consumano scudo delle scudiere; la centralina KO continua a disabilitare l'intercettazione. Il seme resta un semplice instradamento di munizioni (una carta, una arma), non conferisce poteri. La previsione dei danni tiene conto del bersaglio scelto. Questi valori sono provvisori. Verifica `src/escortTactics.test.js`.


## Punto 12 — Dottrine delle 17 flotte (6 novembre 2026)
Le sette abilità di ruolo precedenti sono state mantenute e integrate con 17 dottrine di flotta. Ogni madre ha un bonus di attacco contro uno specifico bersaglio e un bonus difensivo sotto il 50% dello scudo. Le dottrine cessano di funzionare se viene distrutta la centralina. Il sistema non altera il significato dei semi né duplica le munizioni. Dettagli e valori provvisori nella scheda docs/PUNTO_12_DOTTRINE_FLOTTA.md. Verifica eseguita: 108 test logici su 108, senza compilazione completa o prova visiva browser.


## Punto 22B — Fusione SOLO con carta speciale, fondazione del punto 30 (6 novembre 2026)
I 7 valori numerici e le 5 carte speciali costituiscono **due mani distinte**. Sono disponibili **Fusione Barriera** e **Fusione Assalto** come primi due tipi di speciale (copie ammesse). Una fusione si attiva esclusivamente giocando e consumando la relativa speciale. Dopo l'uso la mano speciale viene immediatamente ripristinata a 5; l'IA usa le stesse carte. La Sincronia non autorizza fusioni gratuite. La capacità delle altre carte speciali resta da progettare con le relative meccaniche. `src/specialCards.js`, `src/specialCards.test.js`; guida e decisioni aggiornate: `docs/MASTER_DECISIONI_ECLISSI_STELLARE_2026-11-06.md`.

**Non lavorare ancora alla rifinitura audiovisiva**: priorità alla logica, ai mazzi e alla collaborazione tra navicelle.


## Punto 23 ufficiale — Cooperazione navicelle
Madre e scudiere possono sparare e proteggersi nello stesso combattimento: le numeriche sono assegnate a un solo cannone per carta, le scudiere assorbono danni con gli HP effettivi e si applicano ruoli e dottrine. I nuovi test d'integrazione sono in `src/fleetCooperation.test.js`. Resta da ampliare la cooperazione avanzata non basata sulla fusione. Vedi `docs/PUNTO_23_COLLABORAZIONE_NAVICELLE.md`.


## Punto 24 — Identità delle 34 scudiere
I 17 modelli madre hanno la scudiera 1 difensiva (Guardia/Intercettore/Baluardo) e la scudiera 2 offensiva (Assalto/Incursore/Assedio/Artiglieria). Nuovi test automatici in `src/escortRolesMatrix.test.js` e rapporto in `docs/PUNTO_24_RUOLI_FLOTTA.md`. I ruoli avanzati sono ancora aperti e il punto 25 introduce Copertura Tattica e il punto 26 aggiunge le conseguenze funzionali per danni localizzati. Il punto 27 introduce tre carte offensive di prova; il prossimo punto è il 28.


## Punto 25 — Protezione della madre e Copertura Tattica
Tre difese distinte: intercettazione automatica delle scudiere, formazione Guardia e nuova carta speciale **Copertura Tattica**. Quest'ultima attiva l'intervento della scudiera 1 sul prossimo colpo diretto alla madre entro 15 s; può intercettarne fino al 75%, ma solo consumando lo scudo reale della scudiera. La carta non costa Sincronia, si consuma al gioco e non si cumula con una fusione. Anche l'IA deve possederla e consumarla. In quella fase il mazzo tecnico da 24 speciali era diviso in 8 Barriera, 8 Assalto e 8 Copertura; il punto 27 lo amplia a sei tipi. **213 test logici superati**, build e preflight verificati. I valori sono provvisori: documentazione in `docs/PUNTO_25_PROTEZIONE_MADRE.md`. Segue il punto 26: danni localizzati con AVARIA e KO; poi punto 27. Nessuna rifinitura audio/visiva in questa fase.


## Punto 26 — Danni localizzati dei quattro sistemi vitali (6 novembre 2026)
Ogni componente della madre è **operativo oltre 50% HP**, in **AVARIA tra 1 e 50%**, e **KO a zero**. Il motore riduce il fuoco di tutta la flotta (−10%/−25%), le armi riducono il fuoco della madre (−20%/−50%), la centralina indebolisce le scudiere (−15%/−40%; a KO perde la coordinazione), il generatore scudi dimezza l'efficacia delle riparazioni in AVARIA e ne azzera la possibilità con collasso dello scudo a KO. Gli effetti si applicano ai danni reali e vengono notificati al primo passaggio di stato; il requisito matematico/Poker rimane obbligatorio per colpire il vitale esposto. La plancia mostra AVARIA/KO senza redesign, mentre 7 numeriche e 5 speciali restano separate. **225 test superati**, build e preflight su `test7/main`. Valori da playtest e grafica/audio finali rinviati. Dettagli: `docs/PUNTO_26_DANNI_LOCALIZZATI.md`. Prossimo: **punto 27, effetti strategici dei colpi**.


## Punto 27 — Tre effetti strategici dei colpi (6 novembre 2026)
Il mazzo speciale da **5 carte in mano**, separato dalle **7 numeriche**, contiene ora **sei tipologie operative**: Fusione Barriera, Fusione Assalto, Copertura Tattica, Colpo Perforante, Impulso Ionico e Corrosione. I semi numerici NON generano bonus. Le nuove carte possono essere preparate fino a **due diverse per scarica** e si consumano soltanto da mano speciale: **Perforante** fa raggiungere allo scudo madre il 20% del danno senza intercettazione scudiere, senza oltrepassare lo scudo; **Ionico** riduce del 30% l'intercettazione automatica nemica per 12 s dopo un colpo efficace; **Corrosione** aumenta di 25% il prossimo danno allo scudo, entro 15 s. L'IA segue le stesse regole di possesso e consumo. Il mazzo dimostrativo ha **24 carte, 4 copie per ciascuno dei 6 tipi**; deckbuilding definitivo ancora aperto. **240 test automatici superati, build e preflight riusciti**. Documentazione: `docs/PUNTO_27_EFFETTI_STRATEGICI_COLPI.md`. Prossimo: **punto 28, firme e requisiti dei calcoli con 2/3 carte**. Grafica/sonoro definitivo rinviati.


## Punto 28 — Calcoli 2/3 carte, firme dei vitali e Poker alternativo (6 novembre 2026)
Il duello permette di selezionare **due oppure tre numeriche**, ripetendo la medesima operazione due volte da sinistra a destra per i calcoli a tre carte, con risultati intermedi interi positivi. Le sette carte numeriche restano separate dalle cinque carte speciali; la singola numerica carica una sola arma e le due/tre carte giocate vengono rimpiazzate.

Le quattro parti vitali della madre ricevono ora **una firma matematica fissa a inizio partita**, differenziata per modello e limitata alle operazioni realmente disponibili. Le firme di prova accettano 2/3 carte. Alcune famiglie ammettono **COPPIA** come alternativa per il sistema armi (C/R/E/L), oppure **TRIS** per la centralina (E/L); il percorso matematico resta sempre disponibile. Le firme Poker a quattro/cinque carte e i requisiti definitivi per boss non sono ancora giocabili. L'IA può cercare combinazioni con tre carte, ma non sfrutta ancora attivamente le alternative Poker.

**257 test automatici superati**, compilazione React/Vite e preflight verificati. Documentazione: `docs/PUNTO_28_CALCOLI_FIRME_VITALI.md`. Il blocco successivo è **Punto 29: ritmo e bilanciamento**. Grafica/audio definitivi sempre rinviati.


## Punto 29 — Ritmo e bilanciamento tecnico (6 novembre 2026)
L'IA valuta i **calcoli a 2/3 carte** e le **firme matematiche o Poker** realmente colpibili, evitando attacchi sprecati contro vitali incompatibili. Il giocatore continua a combattere **senza timer di turno**. Nel nuovo duello madre/scudiere gli scarti delle **52 numeriche** vengono riciclati alla fine della pesca senza carte doppie o nuove, così il combattimento non finisce soltanto per esaurimento del mazzo. Le modalità legacy conservano la regola precedente. Quando non esiste nessun colpo valido, il pulsante **RICAMBIO NUMERICO** nelle MANOVRE scambia una sola carta vera, con ricarica provvisoria di **15 s**; anche l'IA può usarlo con le stesse condizioni. Il risultato finale registra durata effettiva, attacchi a 2/3 carte, numeriche consumate, ricicli e ricambi, per il bilanciamento successivo. **272 test superati**, build/preflight verificati; non significa che la durata definitiva delle partite sia già calibrata. Vedi `docs/PUNTO_29_RITMO_BILANCIAMENTO.md`. **Prossimo: Punto 30, costruzione del mazzo delle carte speciali.** I perfezionamenti audio-visivi restano rinviati.


## Punto 30 — Mazzo speciale personalizzabile e pacchetti (6 novembre 2026)
Il nuovo inventario **separa copie possedute e 24 carte speciali equipaggiate** (mano tattica sempre da 5, mazzo numerico sempre separato da 7). Nell'**Hangar** e nel pannello prepartita puoi modificare e salvare la composizione, usando al massimo **6 copie per tipo** e mai più delle copie possedute. Il mazzo iniziale contiene 24 carte: 4 copie di ciascuno dei **6 tipi già disponibili**. Il primo completamento vincente di un settore Campagna/Avventura assegna **un pacchetto da tre carte**, ottenibile una sola volta per settore. I pacchetti si aprono nell'Hangar, aggiungono copie reali e possono sbloccare due nuove speciali: **Riparazione Scudo** (max 20 HP, soggetta allo stato del generatore) e **Pulizia Sistemi** (rimuove Ionizzazione/Corrosione attive). Il catalogo giocabile è ora di **8 tipologie**. Sono inoltre riconosciute le tre coppie offensive: Breccia Ionica, Frattura Corrosiva, Disgregazione Ionica; si applicano solo i due effetti esistenti, senza danni extra. Anche l'IA deve possedere e usare le speciali. Salvataggio indipendente da quello delle navicelle; nessun prezzo o pagamento inventato. **295 test superati**, compilazione React/Vite e preflight verificati. Le probabilità dei pacchetti, la quantità da 24 e i limiti copie sono provvisori e vanno bilanciati sul gioco reale. Documento: `docs/PUNTO_30_MAZZO_CARTE_SPECIALI.md`. I prossimi punti della scaletta ufficiale sulle carte speciali richiedono una verifica della numerazione originale; niente rifinitura audio-visiva definitiva per ora.

## Punto 31 — Mazzi numerici boss (6 novembre 2026)
Il duello madre/scudiere collega ora i mazzi boss equipaggiati nello Shop: **4 comuni con una abilità (L1–L3), 5 rari/super rari con due (L1–L6), 3 leggendari con tre (L1–L9)**. Sono **23 passive** riprogettate per scudi reali, danni ai vitali, status, Sincronia e ricambio numerico, senza modificare le sette numeriche o le cinque speciali. La progressione salvata resta compatibile. Vedi [specifica del Punto 31](docs/PUNTO_31_PASSIVE_MAZZI_BOSS.md). Valori sperimentali: occorrono test CI e playtest su smartphone.
