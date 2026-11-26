# AGENT INSTRUCTIONS — ECLISSI STELLARE / test7

## Integrazione meccaniche 26/11 — nuovi nominali, collaudo pendente

Leggere `docs/INTEGRAZIONE_ARMI_26_11_2026.md` e `src/fleetNext/nextWeaponBalance20261126.json`. Le 22 famiglie hanno una tabella per rarità; 20 famiglie sono collegate al motore HP e alla collezione, 2 restano bloccate (ologrammi A/B, interazioni speciali da completare). Eclissi Quantistica è collegata alla scelta segreta nella partita locale; non dichiarare sicurezza PvP di rete. I nominali nuovi non subiscono il moltiplicatore strategico legacy. Non dichiarare bilanciamento definitivo collaudato né immagini/effetti approvati senza prove. Il registro storico 235 resta riproducibile; il catalogo corrente è CURRENT_WEAPON_CARDS. La sinergia Personaggio Isobarica aspetta la scheda Personaggio. Il lavoro parallelo grafico non viene modificato.


## Registro progettuale aggiornato — 22 nuove famiglie Arma (26/11/2026)

Prima di progettare altre Armi o i Personaggi, leggere
[`docs/REGISTRO_22_ARMI_CONFERMATE_2026-11-26.md`](docs/REGISTRO_22_ARMI_CONFERMATE_2026-11-26.md)
e il registro strutturato `src/fleetNext/confirmedNextWeaponDesigns.json`.
Sono 22 famiglie approvate nella progettazione: Acqua 2; Terra, Vento,
Luce, Ombra, Gravità 4 ciascuno. Sommate alle 69 precedenti, sono 91
famiglie nuove progettate su 101 (Metallo 11); le quattro storiche non
contano. Restano 10 famiglie Personaggio (due per Terra, Vento, Luce,
Ombra, Gravità) e la revisione delle sinergie Personaggio già previste.
**Le 22 famiglie del nuovo registro non sono ancora attive nel motore.**
Rarità/durate aperte e valori numerici rimangono espliciti. Non confondere
il conteggio progettuale con la disponibilità nel gioco o con l'approvazione
visiva. Applicare le regole permanenti di grafica, suono, aptica e collaudo.
Non sovrascrivere il lavoro parallelo Fulmine/Metallo.


## Decisione categorie del 26/11/2026 — prioritaria

ARMA è rossa (#ff594c), STRATEGIA è arancione (#ffb24d) e sostituisce la denominazione ATTACCO delle carte. Il colore di categoria riguarda il pannello delle caratteristiche; conservare illustrazione, simboli, geometria, rarità e stile dei testi. Le chiavi tecniche `attack`, gli ID e la risoluzione non cambiano. Gli slot dedicati/misti e il bilanciamento sono un intervento separato, non autorizzato da questa modifica cromatica. I PNG sorgente già approvati restano recuperabili; usare i fronti derivati verificati. Le anteprime non ancora approvate restano tali.





## Punto di ripresa — 37 varianti integrate; regole mancanti confermate

**Passo successivo preparato:** l'utente ha approvato con «ok» la direzione
del Cannone a Nucleo di Folgore Crescente, quinta famiglia Fulmine reale.
Sono pronti tre fronti PNG RGBA 3072×4608 e una previsualizzazione isolata
con audio (68 secondi, 17 colpi in 7 sequenze), non una ripresa StackBlitz.
Le illustrazioni centrali originali sono 1536×1024. Cornici autentiche,
alfa esterna e pixel protetti verificati; nessun nuovo bordo esterno.
**Le tre carte sono ora approvate visivamente:** l'utente ha risposto
«mi immaginavo il colpo un po piu scenico, per le carte ok». Conservare
gli stessi PNG e hash; non rifare le illustrazioni né richiedere ancora
la conferma delle carte. Si sta rivedendo soltanto l'effetto, con nucleo
volumetrico più vivo, corone in precessione, compressione e una sola
detonazione elettrica coordinata con suono e aptica. Attendere la
conferma della nuova anteprima dell'effetto prima dell'inserimento
completo. Non contare ancora 40 varianti: i fronti attivi restano 37.
La revisione scenica 2 è pronta: clip del colpo massimo di 4 secondi,
video dei tre cicli di 36 secondi e HTML interattivo con tutti i casi.
Dettagli e identificatori dei file nella scheda del Nucleo; le nuove
consegne sono distinte dalla prima anteprima ritenuta poco scenica.
Il codice di partita in `src/` non è cambiato per questa anteprima.
Scheda, archivio recuperabile, hash e verifiche in
`docs/FULMINE_05_NUCLEO_FOLGORE_CRESCENTE_2026-11-26.md`.
Non tornare a chiedere l'approvazione della direzione già data; la scelta
pendente riguarda soltanto la revisione scenica del colpo. Dopo l'approvazione visiva
collegare immagini, effetti, audio e aptica e collaudare la partita reale.

L'utente ha chiesto «procedi a sistemare tutto» e ha scelto espressamente:
- **Ganascia A e Ganascia B entrambe per tre turni propri.** Una ganascia
  per carta; ciascuna funziona da sola. A conserva lo strappo finale +50%.
  B conserva il danno base nei tre turni. Nomi, ID e rarità restano quelli
  del catalogo; A/B identificano le due funzioni, non nuove famiglie.
- Con entrambi gli agganci validi, **una sola collisione** della coppia:
  due navi vive si scontrano; se rimane una sola nave, entrambe le prese
  la schiantano contro il piano metallico. Dopo l'urto si rilasciano i
  ganci; gli eventuali turni autonomi rimasti non ripetono la combo.
  Il danno della combo conserva il valore provvisorio del vecchio
  Collassatore per nave coinvolta, senza raddoppiare quello sulla sola madre.
- **Induzione senza Difese: +20% con una Energia Metallo, +40% con due
  o più.** Energie non consumate. La modalità si fissa prima di rimuovere
  una Difesa: non cumulare bonus, superamento e rimozione nello stesso colpo.

Sono collegate **37 varianti: 22 Metallo e 15 Fulmine**, con i fronti
completi 3072×4608 e i tre canali dell'effetto. Le cinque Ganasce sono ora
la revisione approvata; non riproporre i vecchi due arpioni per carta né
il requisito di giocare B soltanto nel turno successivo ad A. Le ipotesi
storiche sotto e i parametri aperti delle vecchie anteprime sono superati.
La Super Combo del sacrificio resta una bozza esclusa da questo lavoro.

Registro: `src/fleetNext/approvedWeaponIntegration.json`. I sorgenti
originali delle carte rimangono recuperabili; la scena usa i fronti rossi
verificati. I cinque disegni Ganasce approvati sono conservati fuori dal
pannello; nel pannello sono aggiornati durata e numeri confermati.

La copia StackBlitz già esistente è
`https://stackblitz.com/edit/github-edu2s6xy?file=README.md`.
Il caricamento GitHub diretto ha fallito la clonazione. Usare il
sincronizzatore `scripts/sync-stackblitz.mjs` nella copia esistente:
verifica gli hash dei soli sorgenti del repository Test7, conserva
`.env.local` e serve le immagini HD da GitHub. Non clonare l'archivio
binario nel WebContainer e non creare un'altra copia/fork. La grande
tavola dei simboli viene servita anch'essa da ASSET_ROOT, senza duplicarla
nel limite di caricamento della copia salvata.
**Persistenza verificata:** le sole scritture del terminale non rimangono
nella copia salvata. Il `package.json` salvato tramite l'editor contiene
ora l'avvio dal commit verificato `433d367c0c52908231a50375820240473349a892`.
Al ricaricamento completo scarica e verifica i 664 sorgenti, usa gli asset
dello stesso commit e rigenera il collaudo con tutte le 37 varianti.
Il risultato è stato osservato dopo Save e ricaricamento, con 412 file
aggiornati e il commit letto da `.stackblitz-sync.json` nell'editor.
Per aggiornare la versione, generare il package con
`node scripts/stackblitz-saved-package.mjs --ref=SHA_VERIFICATO`, incollarlo
nell'editor di `package.json` della stessa copia e salvare prima dell'avvio.
Non sostituire questo avvio persistente con il package temporaneo scritto
dal sincronizzatore né creare copie nuove. Il salvataggio globale della
sessione dopo la sincronizzazione può dare un errore del servizio;
l'avvio salvato nell'editor è quello verificato dopo il ricaricamento.
Distinguere sempre test, build e osservazioni
visive; la vibrazione hardware resta da provare su telefono compatibile.

Le altre sei famiglie Fulmine richiedono ancora riconciliazione con i nomi
pronunciati; non dichiarare «Fulmine chiuso».

**Correzione necessaria:** la frase dell'assistente «Fulmine chiuso» non
è sostenuta dal catalogo. Sono collegate con certezza alle prime quattro
voci reali le proposte di Pettine, Lanciadardi, Sferzatore e Lampo Bianco.
Nella trascrizione successiva l'assistente ha presentato altre nove
denominazioni non trovate nei due registri correnti
`approvedBaseWeapons.js` e `designedWeaponCards.js`. Le loro proposte
grafiche sono state accettate nel parlato e vanno conservate, ma non
contate come nuove famiglie codificate o come sostituzioni automatiche
delle sei famiglie reali rimanenti. Dettagli nel documento di ripresa.
Prima di cambiare elemento riconciliare proposte, veri ID e meccaniche;
non ripetere profili generici «un turno, un colpo, niente Energia»
attribuendoli a carte speciali senza leggerne il profilo operativo.

L'utente ha riconfermato il dettaglio fisico dell'arma nel materiale/
colore della rarità: Comune grafite, Rara bronzo, Epica argento,
Leggendaria cristallo diamantato prismatico. La regola già esiste nella
procedura di creazione; applicarla senza chiederne ancora conferma.


## Regola obbligatoria — coordinazione visibile tra Energia ed effetto

Per ogni elemento e carta che dipende da Energie, evidenziare sulle
Carte Energia realmente coinvolte il contributo all'attivazione o al
potenziamento e sincronizzarlo con grafica, suono e vibrazione
dell'effetto. Leggere la sezione corrispondente in
`docs/REGOLE_PERMANENTI_EFFETTI_CARTE.md`.
Il conteggio senza consumo lascia la carta nello slot; una spesa deve
mostrare solo l'aggiornamento o la rimozione realmente previsti.
I colpi continuano a entrare da fuori schermo e ogni famiglia conserva
il suo effetto. Si sta documentando: nessuna nuova implementazione qui.


## Regola corrente — in battaglia compaiono i colpi; macchina nella carta

**Correzione esplicita dell'utente, 26 novembre 2026, confermata con «Sì».**
Nella battaglia non mostrare il dispositivo/arma completo, la sua bocca
o le sue parti mentre si aprono per sparare: il lancio iniziale proviene
da fuori dello schermo del telefono.
- Lato giocatore: ingresso da punti variabili lungo il bordo inferiore.
- Lato avversario: ingresso da punti variabili lungo il bordo superiore.
- Si animano proiettile, scarica, frusta, ganascia o altre parti realmente
  emesse, traiettoria, contatto e conseguenze previste dalla carta.
  Non aggiungere modelli o immagini delle macchine al campo.
- Restano i trasferimenti successivi già previsti dalle meccaniche
  approvate, come il colpo residuo del Perforatore dal bersaglio distrutto.
- Nell'illustrazione della **carta** restano insieme macchina e suo colpo,
  con cornici e simboli ufficiali. Il colpo illustrato deve corrispondere
  a quello in battaglia. La coerenza tridimensionale della macchina nella
  carta non richiede di crearne un modello o un'animazione in battaglia.
Questa correzione prevale sulle vecchie indicazioni di mostrare macchine,
bocche, diaframmi o armi montate durante il lancio. Non rimuovere asset o
modificare codice di gioco ora: la fase corrente resta documentazione.

**Effetti distinti per famiglia:** la medesima provenienza dal bordo e
il medesimo elemento non autorizzano lo stesso sparo con un colore diverso.
Ogni famiglia mantiene la forma, il movimento, il ritmo e il contatto
approvati, con audio e aptica coerenti. Le rarità seguono la progressione
specificamente concordata; non inventare colpi o nuove abilità.


## Regola obbligatoria — leggere prima di creare qualsiasi effetto di carta

**Ordine permanente dell'utente, 26 novembre 2026.**
Prima di progettare, creare, modificare, integrare o collaudare effetti
di QUALSIASI carta, leggere autonomamente
[`docs/REGOLE_PERMANENTI_EFFETTI_CARTE.md`](docs/REGOLE_PERMANENTI_EFFETTI_CARTE.md).
Non aspettare che l'utente dica «leggi la regola». La lettura deve
precedere il lavoro sugli effetti, anche nelle chat successive. Se la
versione corrente è già stata letta nella stessa sessione, usarla senza
recuperarla di nuovo a ogni chiarimento; rileggerla se è stata aggiornata.

Poi leggere la scheda completa della carta, la variante di rarità, le
decisioni approvate e la risoluzione del motore/eventi. Distinguere sempre
il codice attuale dalle revisioni documentate ancora da implementare.

**Ogni effetto descritto dalla carta deve avere una corrispondenza visiva,
sonora e di vibrazione coerente e sincronizzata.** Vale per tutte le
categorie, per effetti principali/secondari/condizionali, durata e
scadenza, costi e conseguenze, e per ogni nave o carta realmente coinvolta.
Non limitarsi allo sparo: rappresentare anche attivazione, protezione,
superamento, rottura/rimozione, trasferimenti, cure, stati e interruzioni
quando la carta li prevede. Sulle Difese mostrare la reazione anche
sulla carta stessa. Un bypass non ne simula la distruzione.

Prima di dichiarare concluso un effetto verificare la copertura di ogni
meccanica nei tre canali e nei casi previsti, sincronizzati agli eventi
reali. Rispettare preferenze audio/aptiche, movimento ridotto e capacità
del dispositivo; non dichiarare provata la vibrazione fisica senza
riscontro sul dispositivo. Non inventare meccaniche dalla sola grafica.

La regola non autorizza la creazione anticipata delle sequenze: nella
modalità corrente si documentano le scelte; si realizzeranno al comando
esplicito dell'utente. Dettagli vincolanti nel documento collegato.

## Regola generale delle immagini — raffigurare anche il colpo dell'arma

Per **tutte le carte Arma**, tutte le famiglie e tutte le rarità,
l'illustrazione deve mostrare la macchina **insieme al tipo di colpo che
produce**, con aspetto coerente con ciò che si vedrà in battaglia.
Forma, natura elementale, materiali, scia e peculiarità del proiettile
o dell'emissione devono corrispondere; non usare un colpo scenico
estraneo al modello poi animato.

Leggere prima di creare immagini la sezione obbligatoria in
`docs/PROCEDURA_OBBLIGATORIA_CREAZIONE_CARTE.md`. Conservare cornici,
simboli e impaginazione: arma e colpo stanno nell'illustrazione centrale.
Non aggiungere impatti o abilità per sola decorazione.
La regola vale per il lavoro futuro e per rifacimenti autorizzati,
non dichiara nuove immagini già create.

Il lavoro da queste famiglie include **carte complete PNG HD nelle
rarità previste**, oltre agli effetti visivi, sonori e aptici.
Pettine, Lanciadardi, Sferzatore e Lampo Bianco sono stati approvati nella
progettazione degli effetti; le nuove immagini complete non sono ancora prodotte.
Il Lanciadardi è ora confermato in tutte le rarità: medesimo dardo con
due spirali, meccanica invariata e danno/intensità crescenti.

## Lavoro corrente — Fulmine, quattro famiglie approvate

Sono approvate nella progettazione le prime quattro famiglie Fulmine.
La fase resta documentazione: nessuna nuova carta completa o effetto
viene dichiarato già prodotto da questi appunti.
1. **Cannone a Pettine Ionico di Vega:** cinque archi/filamenti visibili
   confluiscono in una sola scarica azzurro-bianca a zigzag; reticolo
   elettrico transitorio all'impatto, crepitio e schiocco, breve impulso
   aptico. Le quattro rarità aumentano danno e intensità con variazioni lievi.
2. **Lanciadardi a Spirale di Tesla:** un dardo elettrico blu-violetto
   con due spirali di scintille rotanti; scarica locale al contatto,
   sibilo crescente e schiocco, un impulso aptico. Stessa dinamica nelle
   quattro rarità, danno e intensità crescenti.
3. **Sferzatore Ionico di Rame Lunare:** una frusta elettrica a zigzag,
   una sferzata sulla corazza, scintille, schiocco e breve impulso aptico.
   Quattro rarità, stessa dinamica e danno/intensità crescenti.
4. **Cannone del Lampo Bianco**, `weapon-base-ionic-04`, Fulmine:
   approvata la proposta corretta con «Sì». Una sola scarica elettrica
   bianca, rettilinea e rapidissima, entra dal bordo fuori schermo verso
   un solo bersaglio. Al vero contatto: scintille concentrate, bagliore
   localizzato, schiocco secco e vibrazione breve. Niente dispositivo,
   bocca, alette o diaframmi visibili in battaglia. Questi dettagli sono
   pertinenti soltanto all'illustrazione della carta.
   Rarità iniziale Rara nel catalogo; nessuna Comune inventata e nessun
   nuovo valore di danno stabilito durante questa revisione.

Queste armi hanno un attacco su un bersaglio in un turno proprio nel
profilo base, senza Energia aggiuntiva; le Difese e le protezioni ordinarie
si applicano normalmente. Gli effetti diversi non aggiungono abilità.
Tutti i lanci iniziali entrano da fuori schermo, basso per il giocatore
e alto per l'avversario. Il requisito di macchina+colpo riguarda la carta.

L'utente domanda se le prime due sono uguali al Lampo: spiegare subito
le tre firme distinte (archi convergenti a zigzag / dardo con doppia
spirale / impulso bianco rettilineo), senza ricontrolli ripetuti.
Alla ripresa successiva la quinta famiglia dell'elenco è Cannone a Nucleo
di Folgore Crescente: usare il suo profilo reale prima di presentarne la
meccanica. Non riaprire le approvazioni delle prime quattro.

## Stato corrente — otto armi riviste verbalmente; Super Combo in bozza

L'utente precisa che il completamento riguarda la **revisione verbale**,
non il codice. Per tutte le otto famiglie del gruppo è stata concordata
la direzione degli effetti; parametri tecnici/numerici ancora aperti
restano da definire. Nessuna nuova implementazione o verifica live viene
certificata da questa ricognizione e non va iniziata automaticamente.

La nuova Carta Attacco della Super Combo è **soltanto una bozza futura
approssimativa da accantonare**, per esplicita richiesta successiva
dell'utente. L'idea: Ganasce A e B già ancorate, sacrificio di uno o due
supporti propri, HP attuali convertiti in corrente lungo le catene,
rapporto ipotizzato 1:1; metà a ciascuno dei due bersagli agganciati o
tutto all'unico bersaglio. Nome e dettagli non definiti; fuori dalle dieci
Armi per elemento. Il «Sì» al riepilogo non è approvazione finale:
prevale «per ora è una bozza approssimativa e lasciamola stare».
Dettagli e riepilogo delle otto famiglie nel documento di ripresa.

## Ultima scelta approvata — Ganasce A/B; nuova idea futura Super Combo

**Due carte distinte A e B**, una sola ganascia ciascuna, entrambe
utilizzabili da sole; non due copie della stessa carta e non la vecchia
A con due ganasce seguita da una macchina diversa.

La coppia produce un solo schianto: con due navi agganciate vive,
collisione fra loro; con una sola nave presente, anche la sola madre,
due prese sullo stesso scafo, inclinazione e trazione verso il basso
contro il piano metallico dell'arena. L'utente ha approvato esplicitamente
quest'ultima soluzione con «Perfetto, aggiudicato» e ha chiesto tutti
i dettagli grafici, sonori e aptici. La specifica completa è all'inizio di
`docs/REGOLE_EFFETTI_E_RIPRESA_LAVORO_2026-11-26.md`.
Le vecchie ipotesi incompatibili sotto sono storiche. Non dichiarare
questa revisione già implementata: si stanno ancora salvando specifiche.

**Nuova idea dell'utente da conservare:** Super Combo da introdurre in
futuro **fuori dalla quota delle dieci Carte Arma per elemento**.
Non sostituire Armi approvate, non assegnare categoria o meccaniche
non ancora descritte e non iniziare la realizzazione ora.
L'utente vuole spiegare l'idea: ascoltare il seguito, senza richiedere
conferme già date o passare automaticamente ad altre carte.

## Metodo corrente e punto di ripresa — Artiglieria confermata

L'utente vuole rivedere gli effetti delle **otto armi già inserite**.
L'assistente propone la grafica, il suono e la vibrazione; l'utente
approva o corregge. Non chiedergli di inventare ogni effetto da zero.
Questa modalità aggiorna le vecchie istruzioni sul proponente della
direzione grafica; realizzare soltanto al comando esplicito.

Usare dati già verificati senza ricontrolli a ogni chiarimento; salvare
la scheda alla conferma o alla pausa, poi proseguire. Non inventare
altre carte del gruppo. Il Dissalatore citato per errore non risulta
nel catalogo e non va trattato come confermato.

L'Artiglieria delle Schegge Erranti è confermata nell'effetto corrente
3/6/9 schegge; è l'ultima del gruppo ordinato. La coppia Ganasce A/B ha ora una
nuova specifica approvata, dettagliata nella sezione più recente. Il Perforatore ha una nuova direzione
approvata: distruzione visibile, esplosione e nuovo colpo del danno residuo
formato dal relitto; non lo stesso siluro intatto fra tutti i bersagli.
Dettagli e stati reali nel documento di ripresa, da leggere per continuare.

## Revisione delle forme delle navi e grafica delle fusioni

L'utente vuole forme più particolari e varie: navi con silhouette proprie,
non scafi quasi uguali differenziati soltanto per colore. È una modifica
da realizzare; forme dei singoli modelli e nuove immagini non sono ancora
state scelte. Conservare il catalogo e le meccaniche, proporre le nuove
sagome prima di sostituire gli asset approvati.

L'utente chiede anche delle immagini delle navicelle fuse, distinte dalle
Carte Fusione. Il codice corrente usa `fusedEscortArtwork` e due livelli
in `OfficialFleetBattle3D.jsx`: sovrappone le immagini ordinarie dei due
modelli. Non sono state individuate immagini dedicate di nuove sagome
fuse negli asset del progetto. Non descrivere la sovrapposizione come
una nuova nave fusa già disegnata. Riscontro e lavoro aperto nel documento
di ripresa; nessun nuovo asset o modello è stato creato in questa fase.

## Nuova specifica navi — dimensioni dei supporti e stadi di danno

L'utente richiede **supporti più grandi** e tre-quattro stadi di rottura
visibili su **supporti e navi madri**, fino alla distruzione.
Lo stadio deve dipendere dalla percentuale reale di HP rimasta sulla
singola nave, non dal tempo. L'utente ha menzionato il 25%.

Schema operativo proposto dall'assistente, da discutere: quattro stadi
alle soglie 75% / 50% / 25% / 0% residui, oltre all'aspetto integro.
Non presentare le quattro percentuali o un fattore d'ingrandimento come
numeri già scelti esplicitamente dall'utente. Specifica dettagliata in
`docs/REGOLE_EFFETTI_E_RIPRESA_LAVORO_2026-11-26.md`.

I cambi di stadio devono avere corrispondenza visiva, sonora e aptica
secondo la regola obbligatoria sopra. Nessuna penalità o rottura di
componenti di gioco può essere introdotta dal solo aspetto danneggiato.
Per ora è una specifica: non dichiarare navi ingrandite o stadi realizzati.
La modalità corrente resta raccolta e salvataggio; creare al comando
esplicito dell'utente.

## Frantumatore a Induzione — chiarimento corrente: lame da realizzare

L'utente sta definendo il colpo desiderato, NON descrivendo un effetto già
inserito. Ha corretto esplicitamente l'assistente: «le lame vanno messe».
Per il Frantumatore annotare lame metalliche rotanti verso la navicella
bersaglio, convergenti sulla stessa nave, con contatto leggibile,
incisioni, scintille e schegge; su scudo solo quando il colpo è bloccato.

Ha aggiunto: «Primo turno si vede le lame colpiscono la navicella».
Non dedurne altri turni: la durata corrente è un turno proprio.
Conteggio delle lame e differenze grafiche per rarità non sono ancora
stati scelti in questa indicazione. Per ora salvare la specifica;
realizzazione e collaudo arriveranno al comando esplicito di creazione.
Le Ganasce sono in pausa per volontà dell'utente. Gli appunti sono nel
documento di ripresa già recuperato: non dichiararli mancanti.

## Revisione Ganasce e seconda macchina — chiarimento corrente del 26/11

Le **Ganasce Magnetiche Metallo** sono autonome: una o due navi, anche la
sola madre; tre turni propri, primi due con danno base da trazione, terzo
con distacco/strappo e danno maggiorato. La trazione appartiene alla prima
carta. La seconda deve avere danno base autonomo e bonus con le Ganasce.

L'utente ha rifiutato l'attrazione autonoma dell'Incudine e poi le proposte
Incudine a Propulsione, Pressa Orbitale e Spaccacorazze a Cuneo.
Non riproporle come alternative ancora da scegliere.

**Nuova idea dell'utente da registrare e valutare:** una macchina B di
elemento Tuono/Fulmine usa le catene delle Ganasce come conduttori per
amplificare il danno. È una proposta separata; l'utente chiede comunque
una macchina **Metallo** combinabile con le Ganasce. Non riclassificare
automaticamente il Collassatore e non sostituire una famiglia Fulmine.

La combinazione si attiva **una volta sola per bersaglio coinvolto**:
risposta esplicita «No, una volta sola». Non ripetere la domanda.
Il Percussore a Risonanza è soltanto una nuova proposta dell'assistente,
non approvata. Forma della seconda Metallo, bersagli, finestra della
combo e destino degli agganci restano da definire.

Leggere l'apertura aggiornata di
`docs/REGOLE_EFFETTI_E_RIPRESA_LAVORO_2026-11-26.md`.
**Solo documentare.** Nessuna nuova meccanica, effetto o prova di gioco
prima del comando esplicito di creazione. I vecchi scontri fra due scafi
descritti sotto appartengono al codice precedente.

## Modalità corrente — solo raccolta degli effetti, 26 novembre 2026

L'utente ha precisato: per ora scrivere gli effetti, poi li farà creare
tutti insieme quando darà il comando esplicito. **Adesso documentare
soltanto: non implementare effetti, non cambiare il motore o i renderer,
non avviare un collaudo come se la creazione fosse già stata richiesta.**
Questa indicazione sostituisce ogni precedente automatismo che faceva
seguire subito la realizzazione alla scelta della direzione grafica.

La Termobalistica è definita: **3 granate al danno base e 6 quando il
colpo è potenziato dagli HP persi dopo la posa**, in entrambe le rarità
Epica e Leggendaria. La risposta esplicita «Sei» chiude la scelta 5/6:
non richiederla più e non distinguere i numeri in base alla rarità.

Scelte documentate: Maglio, Cannone a Slitta, Termobalistica.
**Punto di ripresa:** Frantumatore a Induzione; leggere il documento di
ripresa aggiornato. Le Ganasce e la seconda Metallo sono in pausa per
volontà dell'utente. Non riproporre le alternative già rifiutate o aprire
un elenco nuovo.

Il completamento richiesto prima di passare alla carta dopo, in questa
fase, è la definizione e il salvataggio della scelta. Implementazione e
collaudo saranno una fase successiva su esplicita richiesta dell'utente.

## Ripresa obbligatoria — chiarimenti vocali del 26 novembre 2026

Leggere prima `docs/REGOLE_EFFETTI_E_RIPRESA_LAVORO_2026-11-26.md`.
L'utente ha chiesto espressamente un salvataggio dettagliato recuperabile
in un'altra chat. Questo documento distingue decisioni, codice e collaudi.

- **SOLO Maglio Ferrogravitazionale:** Comune 2 martelli, Rara 3, Epica 5,
  Leggendaria 7. Non estendere questi conteggi o la sua coreografia ad altre
  carte: gli effetti vengono decisi dall'utente carta per carta.
- **SOLO Cannone a Slitta d'Acciaio:** una sola palla di cannone per
  attivazione in tutte e quattro le rarità. Il danno cresce con la rarità;
  non aggiungere raffiche. Dimensioni o dettagli possono evolvere. L'utente
  ha scelto dettagli nei colori della rarità ufficiale: Comune grafite,
  Rara bronzo/sabbia bronzata, Epica argento, Leggendaria cristallo prismatico
  (la base più recente del 24/11 prevale sulla vecchia Leggendaria oro).
  Conservare la palla riconoscibile; non estendere questa sequenza al Maglio
  o alle altre carte. Anche questa nuova direzione resta da implementare.
- **SOLO Artiglieria Termobalistica di Recupero:** approvata la salva di
  granate metalliche tozze, con punta e nucleo incandescente, traiettorie
  a parabola, scie termiche ed esplosioni distinte sui veri impatti.
  Tre proiettili nell'attacco senza bonus; sei proiettili quando
  l'attacco è amplificato dagli HP realmente persi dalla flotta dopo la
  posa (bonus del 60%, entro il massimo). Il cambio di conteggio dipende
  dal bonus del colpo, NON dalla rarità Epica/Leggendaria. L'utente ha
  scelto esplicitamente «Sei» per il potenziato. La scelta è chiusa.
  Non inventare il conteggio e non ripetere la lettura errata «tre Epica,
  cinque Leggendaria». Due turni propri, danni totali e blocchi invariati.
  La carta successiva si affronta dopo aver completato l'attività corrente;
  documentazione salvata e implementazione/collaudo sono stati distinti.
- I martelli partono **uno dopo l'altro**, con un breve intervallo: non
  tutti nello stesso istante e non aspettando l'impatto del precedente.
  Si deve vedere una serie di martelli in volo, ciascuno in rotazione
  effettiva e con un proprio contatto leggibile sulla nave bersaglio.
  Non usare la parola «sovrapposizione» per indicare i lanci: l'utente
  l'ha interpretata come una partenza simultanea e l'ha corretta.
- **Regola generale di provenienza:** «porta USB» significa tutto il
  bordo inferiore del lato giocatore; «sopra» tutto il bordo superiore
  del lato avversario. Usare punti variabili lungo il rispettivo bordo,
  senza concentrare i colpi nel punto centrale USB o cambiarne il lato.
  Rimangono valide le eccezioni imposte da trasferimenti reali della carta.
- Nella conversazione, presentare una carta alla volta: nome completo,
  rarità, elemento e funzione reale. Poi ascoltare la scelta grafica
  dell'utente. La grafica precedente si descrive soltanto se richiesta;
  non interrompere una spiegazione in corso con la stessa domanda.
- Il nuovo conteggio non moltiplica il danno totale, i costi o i controlli
  difensivi. I pacchetti del motore, i testi, il renderer, l'audio e l'aptica
  devono risultare coerenti prima di dichiarare completato l'inserimento.

**Stato di questo salvataggio:** documentazione aggiornata; nessun codice
di combattimento o renderer modificato. Il codice di partenza `ff600528`
conta ancora 1/3/6/9 per il Maglio e 3/6/9/7 per la Slitta. Nuovi conteggi,
rotazione del Maglio, palla e dettagli di rarità della Slitta e provenienza
precisata vanno implementati e collaudati; non risultano già verificati.
Per la Termobalistica la direzione 3 base / 6 potenziati è completa.
Implementazione e collaudo restano da svolgere solo al successivo comando
esplicito dell'utente, come indicato nella modalità corrente sopra.
Le indicazioni precedenti contrastanti sono storiche e subordinate a queste.

## Ordine di lavoro deciso dall'utente — 26 novembre 2026

Da ora l'utente sceglie la direzione dell'effetto grafico di ogni carta.
Prima verificare il catalogo e il motore, creare/presentare la carta e
spiegarne chiaramente il ruolo reale: bersagli, durata, condizioni, costi,
combo e differenze fra rarità. Poi l'utente dice quale effetto realizzare.
Non inventare o implementare autonomamente una nuova coreografia prima
della sua indicazione. Nella modalità corrente, dopo la scelta salvarne
la descrizione dettagliata e passare alla carta successiva. Realizzare
le sequenze soltanto quando l'utente chiederà esplicitamente di crearle.

Per le carte già fatte, spiegare il ruolo reale e attendere la scelta della
revisione; descrivere la grafica attuale soltanto se l'utente la chiede.
La richiesta del 26/11 è una ricognizione: non cambia ancora i loro effetti.
Fotografia delle otto armi/22 varianti correnti in
`docs/RUOLI_ED_EFFETTI_CARTE_APPROVATE_2026-11-26.md`.
Questa sequenza precede le vecchie istruzioni che collegavano l'approvazione
del fronte alla creazione automatica dell'effetto. Restano valide le regole
di coerenza, impatti, prospettiva, salve e collaudo del 25/11.

## Regola permanente — impatti sulle navi e prossime carte, 25/11

L'utente approva salve e partenze variabili e chiede **esplosioni o altri
effetti evidenti quando le navi vengono colpite, non solo un leggero
scossone**. Queste decisioni devono guidare anche TUTTE le prossime carte.
Leggere `docs/REGOLE_PERMANENTI_EFFETTI_CARTE.md`: consolida meccanica reale,
inventiva del dispositivo, origini A/B variabili, salve, prospettiva 3D,
impatto personalizzato sullo scafo, suono, aptica e collaudo.

Ogni Arma deve progettare insieme lancio/volo e contatto. Al colpo reale
mostrare corpo dell'impatto, frammenti/scintille, eventuali plasma/fumo o
scariche e reazione dello scafo; le rarità evolvono la sequenza. Il contatto
segue il punto sulla vera nave anche durante il rinculo e non copre tutta
la flotta. Ganasce: morso e archi; Induzione: taglio e scarica; perforanti:
getto assiale; Maglio/Recuperatore/Schegge: detonazioni differenti. Non
copiare la stessa palla di fuoco su ogni carta. Il Collassatore mantiene
l'unico BOOM fra i due scafi, senza duplicarlo per le due contabilizzazioni HP.

`src/weaponHullImpacts.js` definisce i contatti attuali e la posa condivisa
da scafo e renderer. Nessun danno, colpo, bruciatura, distruzione o bersaglio
può essere inventato dalla grafica. Una Difesa bloccante mostra il contatto
sullo scudo; una quota zero di una salva reale fa solo un piccolo contatto
sulla corazza. Nessuna esplosione di danno su colpi bloccati/non alimentati.
Movimento ridotto, preferenze audio/aptiche e ripristino restano obbligatori.
I collaudi delle versioni precedenti non attestano automaticamente questa.

## Ultima decisione utente — raffiche e punti di lancio variabili, 25/11

L'utente ha rifiutato anche la seconda revisione: cambiava il disegno ma
restava la stessa azione. SOSTITUISCE il vincolo precedente del centro USB
fisso e del singolo proiettile per tutte le rarità. Usare lanci diversi
entro il lato A/B, salve vere 3/6/9, traiettorie curve/incrociate, rotazioni,
esplosioni coerenti e finali diversi. Il catalogo vincolante è ora
`src/fleetNext/approvedWeaponSalvos.js`; dettagli e matrice in
`docs/RAFFICHE_ORIGINI_VARIABILI_2026-11-25.md`.

Il danno totale resta quello della carta ed è distribuito esattamente nei
pacchetti `projectileHits` emessi dal motore. Una salva verifica Difesa e
copertura come un'azione per bersaglio; non moltiplicare danni, costi Energia
o reazioni per il numero di proiettili. Ganasce: due agganci reali e porte
persistenti; Collassatore: un solo scontro fra due scafi. La Cascata aspetta
l'ultimo impatto della salva precedente e paga una volta per trasferimento.

La plancia usa `fleetWeaponProjectiles`, non i colpi aggregati di diagnosi
`fleetWeaponShots`. I contatori della carta si compongono con il PNG HD
approvato e `WeaponSalvoCardMarks`: sfondi estratti dalle cornici originali,
testo vettoriale `TOTAL DAMAGE` / `N SHOTS` o `6 + 1`, stessi simboli e arte.
Nel salvare/esportare un fronte completo includere entrambi gli strati.
Le descrizioni e i manifest precedenti sono storici quando indicano uno
sparo fisso; leggere sempre la definizione corrente del codice.

Eseguire anche `weaponRendererBindings.test.js`: i test del combattimento
da soli non eseguono gli effetti React. È stato corretto un import mancante
che poteva fermare il canvas della revisione precedente. Non dichiarare
collaudata in partita una dimostrazione offline o una sola build riuscita.

## Revisione generale degli effetti — 25 novembre 2026

L'utente ha fermato le nuove carte per rivedere tutti i 22 effetti già
approvati: li considera troppo simili e piatti. Ogni famiglia deve avere
dinamica, volume, contatto, reazione degli scafi e suono riconoscibili;
le rarità devono cambiare struttura e sequenza, oltre al colore. Non
sostituire questa revisione con altri bagliori o una medesima esplosione.
Vedi `docs/REVISIONE_EFFETTI_22_ARMI_2026-11-25.md`.

La revisione è implementata e verificata nel codice; il nuovo collaudo
StackBlitz è ancora da eseguire a causa dell'errore di clonazione della
sessione. Lo studio offline dei renderer NON è una registrazione in
battaglia. Non riutilizzare i precedenti collaudi per dichiarare verificata
questa nuova versione. Conservare Maglio 0,48 / 1400 / 950 ms, Collassatore
450 / 1000 / 1350 ms, prospettiva, eventi, bersagli e danni reali.

## Regola dei colpi approvata il 24 novembre 2026

### Regola obbligatoria del 25/11 — meccanica reale, immagini, suoni e vibrazione

PRIMA di progettare l'effetto di QUALSIASI carta, leggere nel codice la
definizione aggiornata, la risoluzione effettiva del motore e gli eventi
emessi. Verificare condizioni, bersagli, quantità di colpi, durata, ordine,
combo, blocchi e scadenze; il nome della carta e i ricordi della chat non
bastano. Studiare quindi come rendere leggibile l'intera meccanica con una
sequenza personalizzata di **effetti visivi, suoni e vibrazione**. La
rarità evolve la sequenza coerentemente con l'illustrazione e con le regole.
La vibrazione segue le fasi reali (aggancio, tensione, urto, ecc.), rispetta
le preferenze del giocatore e va verificata su un dispositivo compatibile:
un browser senza riscontro aptico non costituisce un collaudo della vibrazione.

Esempio vincolante: **Arpioni a Ganasce Magnetiche → Cannone Collassatore
di Lega** sono due carte. La prima aggancia i due bersagli effettivamente
colpiti; nel turno proprio successivo la seconda richiede che entrambi
siano ancora vivi e li fa collidere. Mostrare agganci e catene/cavi sui
veri scafi, mantenerli per la durata dell'aggancio, tendere i collegamenti
e muovere le due navi fino all'urto, poi rilasciarle nelle posizioni corrette.
Abbinare suono e vibrazione ad aggancio, trazione e collisione. Non ridurre
la combinazione a due proiettili generici o a una sola esplosione mentre
le navi restano ferme. La coreografia rappresenta gli eventi reali, senza
aggiungere immobilizzazione, danni, bersagli o durata non previsti dal codice.
La meccanica e la presentazione dedicata sono implementate e collaudate su
StackBlitz per le sei carte del secondo gruppo Metallo approvate il 25/11.
Vedi `docs/ARMI_METALLO_CATENE_COLLISIONI_INDUZIONE_2026-11-25.md`.
La vibrazione fisica su telefono rimane da verificare.

**Correzione utente del 25/11 — urto del Collassatore:** quando le navi
vengono tirate l'una contro l'altra, il contatto deve avere un BOOM deciso:
lampo breve, esplosione incandescente, onda sul piano, schegge e scintille,
fumo e contraccolpo degli scafi, con audio profondo sincronizzato. La
Leggendaria aggiunge frammenti prismatici. Conservare un unico urto visivo
per la coppia, i bersagli e i danni del motore, la prospettiva, la sincronia e
il rientro nelle posizioni corrette; nessuna esplosione per colpi bloccati.

**Revisione successiva — movimento vivo:** la sola esplosione aggiunta al
lento scorrimento degli scafi è stata rifiutata come grafica spenta. Il
Collassatore libera prima il corridoio davanti alla madre, poi accelera
negli ultimi 380 ms fino allo schianto, senza frenare all'arrivo. Carica
450 ms, trazione 1000 ms (prima 1800), reazione/rientro 1350 ms; lo scafo
inizia il rilascio dopo 75 ms. Animare il vero scafo con inclinazione,
torsione speculare, contraccolpo, reattori in spinta e luce del contatto.
Ritarare il suono sul nuovo tempo. Non cambiare la velocità dei video per
simulare il risultato: verificare il movimento nativo nella partita.
La posa e tutte le proprietà transitorie devono essere ripristinate; le
preferenze di movimento ridotto restano rispettate.

**Proiettili approvati, revisione del 24/11:** il Maglio usa le quattro
sagome illustrate in `docs/riferimenti-carte/maglio-ferrogravitazionale-2026-11-24/proiettili-approvati.png`.
Il modello volumetrico è in `src/maglioProjectile3D.js`; l'atlante PNG RGBA
resta un riferimento artistico, non una faccia da ruotare per entrambi i lati.
La camera del tavolo mostra il retro nel tiro A e il fronte nel tiro B, con
verticale stabile, occlusioni reali e scala prospettica. Il naso arriva al
bersaglio misurato sulla plancia. Il renderer interpola 24 viste Cycles per
rarità dello stesso volume (fronte/retro, tre azimut e quattro elevazioni).
Le viste sono riproducibili con `scripts/build-maglio-projectile-atlas.mjs`;
la mesh CPU rimane disponibile durante il caricamento. Non tornare a un'unica
immagine obliqua ruotata nei due sensi. Conservare piastre, giroscopi, alette e prismi;
mostrare questi dettagli durante
il volo. **Correzione utente del 24/11:** testata compatta a piastre, senza
una grossa cornice quadrata vuota; scala fisica in partita 0,48 rispetto
al modello artistico. Ridimensionare anche scia e distanza naso/centro,
conservando arrivo sul bersaglio e viste fronte/retro. La calibrazione approvata richiede leggibilità: il Maglio viaggia per
1.400 ms e l'impatto rimane visibile 950 ms. Audio, reazione della nave e
rilascio del turno usano gli stessi tempi. Il numero di colpi deriva dal motore.

Leggere `docs/REGOLA_EFFETTI_VISIVI_CARTE_2026-11-24.md` quando si crea o
inserisce un'Arma o il suo effetto. La decisione successiva richiede porte
variabili entro il lato della propria flotta; forma, sequenza, contatto e
rifiniture seguono arma e rarità. Numero di colpi, bersagli e danno seguono
gli eventi del motore. Il Maglio corrente ha 1/3/6/9 colpi: la vecchia
prescrizione di un centro fisso e un solo colpo per rarità è superata.
Quando il fronte è approvato e l'utente ha indicato/confermato la direzione
grafica dell'effetto, nello stesso inserimento implementare il colpo univoco
e il suono per ogni sua rarità, pubblicare codice e PNG su `test7/main`
e controllare visivamente e acusticamente la partita su StackBlitz. Non
attribuire automaticamente a tutte le Armi uno sparo in base al solo elemento.
Le altre Armi conservano un effetto provvisorio finché progettate una per una.

## Correzione del 24 novembre 2026 — cornici di rarità e simboli

Le quattro cornici HD Comune, Rara, Epica e Leggendaria in `docs/riferimenti-carte/basi-rarita-ufficiali-2026-11-24/` rappresentano **rarità, non categoria Arma**. Consultare [docs/BASI_UFFICIALI_RARITA_2026-11-24.md](docs/BASI_UFFICIALI_RARITA_2026-11-24.md). Sono PNG trasparenti 3072×4608, senza testi, icone o illustrazioni. L'arancione interno è il colore dell'esempio Arma: per Difesa o altra categoria adattare il colore interno; conservare geometria degli slot e finitura esterna della rarità. La Leggendaria approvata è in cristallo prismatico. Le vecchie anteprime Arma WebP del 23/11 sono ritirate. Non ridurre o ricostruire queste basi.

**Nuova regola 24/11 — scheda completa:** il pannello sotto le scritte delle caratteristiche/effetto prende il colore della categoria (Arma rosso, Strategia arancione, Difesa azzurro, Personaggio magenta, Terreno verde, Trappola viola); cornice esterna e stile delle scritte seguono la rarità. Alla richiesta «crea una carta», scegliere la cornice HD originale, cercare nel catalogo ID, valori, categoria, elemento e rarità, usare i simboli indicizzati, comporre illustrazione e testi nei rispettivi spazi, verificare il contrasto e mostrare l'anteprima completa prima di inserirla nel gioco. Le prove di adesivi esistono ma devono ancora essere approvate visivamente. Per il dettaglio e l'esempio di allineamento ENERGY / ATTACK consultare la procedura.

Il simbolo della **categoria variabile** va nello slot tondo sinistro; l'eventuale elemento nello slot tondo destro. L'utente ha autorizzato prove di nuovi simboli fedeli ai soggetti della tavola del 21/11 ma adattati ai fori circolari, senza il vecchio contenitore a rombo/esagono. Le prove non sono asset approvati: mostrarle e ottenere approvazione prima di inserirle nel gioco. La tavola del 21/11 rimane fonte visiva dei soggetti fino all'approvazione dei nuovi simboli.

Le **16 prove PNG separate** sono indicizzate in [docs/SIMBOLI_ADESIVI_2026-11-24.md](docs/SIMBOLI_ADESIVI_2026-11-24.md) e in `docs/riferimenti-carte/adesivi-slot-2026-11-24/manifest.json`: sei categorie a sinistra e dieci elementi a destra, con ID reali del motore, soggetto e coordinate dei cerchi su ciascuna rarità. La posizione è confermata; l'aspetto dei singoli adesivi è ancora da revisionare. Quando si prepara una nuova carta usare l'indice per recuperare il candidato corretto e mostrarlo prima dell'inserimento.

## Aggiornamento approvato il 23 novembre 2026 — cornici di rarità

Leggere [docs/CRITERI_GRAFICI_RARITA_PER_CATEGORIA_2026-11-23.md](docs/CRITERI_GRAFICI_RARITA_PER_CATEGORIA_2026-11-23.md) per la palette del 23/11: **Comune grafite, Rara sabbia bronzata, Epica argento, Leggendaria oro**. Le quattro basi vuote Attacco del 23/11 sono approvate. Le quattro cornici HD più recenti del 24/11 sono riferimenti di rarità trasversali alle categorie, inclusa la Leggendaria prismatica; gli accenti interni e i simboli cambiano con categoria ed elemento. Le varianti delle altre categorie vanno verificate visivamente prima di diventare fronti giocabili.

## IMPORTANTISSIMO — ogni richiesta «crea una carta»

La PRIMA OPERAZIONE, anche in nuove chat o sessioni, è leggere il file
[docs/PROCEDURA_OBBLIGATORIA_CREAZIONE_CARTE.md](docs/PROCEDURA_OBBLIGATORIA_CREAZIONE_CARTE.md).
**Non saltare i passaggi perché l'utente ha scritto solo "crea la carta".**

Ordine FISSO: **catalogo + valori giocati → base PNG ufficiale → tavola
PNG dei simboli ufficiali → composizione sul modello ORIGINALE → controllo
visuale → anteprima in chat → approvazione prima dell'inserimento.**

Sorgenti obbligatorie, originali da riutilizzare MATERIALMENTE:
- `docs/riferimenti-carte/basi-rarita-ufficiali-2026-11-24/` (quattro cornici HD)
- `docs/riferimenti-carte/BASE_UFFICIALE_CARTE_2026-11-21.png`
- `docs/riferimenti-carte/SIMBOLI_CATEGORIE_ELEMENTI_2026-11-21.png`
- `docs/CARTE_RIFERIMENTI_GRAFICI_UFFICIALI_2026-11-21.md`
- `src/fleetNext/rules.js`, `src/fleetNext/weaponRarityEvolutions.js`
- `docs/VALORI_QUASI_DEFINITIVI_235_ARMI_2026-11-22.md` per le Armi

Fino all'approvazione dei nuovi simboli, usare i soggetti della tavola
ufficiale: ARMA è la torretta/cannone futuristico arancione, non cannone
storico su ruote o mirino. Le prove autorizzate possono eliminare i vecchi
contorni a rombo/esagono e adattare scala e composizione ai fori circolari,
conservando il soggetto riconoscibile. Nessun logo del gioco sulle carte.
Grafica della cornice esterna immutabile.
Le rarità cambiano la finitura esterna, non la categoria.

**Ogni evoluzione della stessa carta deve avere un dettaglio VISIVO
AGGIUNTIVO E DIVERSO nell'illustrazione centrale**, progressivo fra Comune,
Rara, Epica e Leggendaria. Non basta cambiare i danni, la cornice o il suo
colore: si deve vedere la progressione fisica del soggetto pur conservandone
identità, scena, simboli ufficiali e geometria della base. I dettagli artistici
NON aggiungono nuove abilità o modifiche al combattimento. Prima di mostrare
le varianti, verificare questa differenza a colpo d'occhio.
Riferimento operativo: `docs/PROCEDURA_OBBLIGATORIA_CREAZIONE_CARTE.md`.

**CARTE ARMA — REGOLA DI REALIZZABILITÀ 3D OBBLIGATORIA:** prima
di generare qualsiasi Arma, pensarla come un dispositivo offensivo
futuristico realmente modellabile e montabile su una navicella. La scena
deve mostrarne scocca, volumi 3D, innesti, struttura meccanica, emettitori,
nuclei e parti funzionali leggibili. **Non disegnare utensili fantasy o
martelli tradizionali**. Anche se la carta si chiama «Maglio
Ferrogravitazionale», raffigurare un apparato gravitazionale pesante
tecnologico con aggancio navale, non un martello da impugnare. Ogni
evoluzione mantiene l'identità dell'apparato ma ne evolve componenti
fisici riproducibili in 3D. Se non è plausibile modellarlo e animarlo
come arma della flotta, l'illustrazione va rifatta. Non alterare regole,
danni, simboli, cornice e base di carta. La procedura completa è in
`docs/PROCEDURA_OBBLIGATORIA_CREAZIONE_CARTE.md`.

Se una sorgente PNG non può essere letta come immagine, non dichiarare
conforme una generazione che ne imita la forma: dirlo e risolvere la lettura
della sorgente prima di proseguire.

**Le anteprime di immagini non si inseriscono negli asset giocabili finché
non sono approvate dall'utente.**

## Varietà delle Armi — decisione del 25 novembre 2026

Per le prossime illustrazioni variare davvero sagoma, struttura e agganci:
non ripetere per tutte le Armi un cannone o una base a quattro piedi.
Progettare, quando coerente con l'effetto, apparati ad anello, ganasce,
moduli laterali, bobine sospese, strutture pieghevoli o altri dispositivi
offensivi riconoscibili e modellabili. L'inventiva riguarda la macchina,
non introduce abilità, colpi o danni nuovi. Ogni famiglia conserva una
propria identità attraverso le rarità. Le sei carte Slitta e Recuperatore
mostrate il 25/11 sono approvate; questa indicazione vale dalle successive.

**Effetti per rarità, precisazione del 25/11:** leggere tutta la carta e
personalizzare anche la sequenza: carica, raffiche quando previste, scie,
componenti mobili, impatto ed effetti condizionali. Non riciclare lo stesso
colpo con un colore o una grandezza diversi per tutte le rarità. Gli effetti
seguono le condizioni effettive della carta; il numero dei colpi di danno,
le durate e i bersagli continuano a provenire dal motore. Per Slitta e
Recuperatore il catalogo prevede un colpo per turno di attivazione: le
evoluzioni rendono distinta l'intera sequenza, senza aggiungere danni.

## Lavoro sul repository

Repository unico: `marcoteghini1988-ai/test7`, ramo `main`.
Non creare cloni, progetti paralleli o versioni di prova.
Non cambiare meccaniche, valori, layout della plancia 3D o vecchie
immagini approvate mentre si crea un'anteprima carta.

**Questa è una regola operativa persistente del progetto.** Le prove di simboli restano separate dalle carte giocabili fino alla loro approvazione.

## Terzo gruppo Metallo — sei fronti confermati il 25/11

Frantumatore a Induzione Leggendario, Perforatore a Cascata Epico e
Leggendario, Artiglieria delle Schegge Erranti Metallo Rara, Epica e
Leggendaria sono approvati dall’utente. I loro PNG originali si ricompongono
con verifica SHA-256 tramite `scripts/restore-weapon-fronts.mjs`, eseguito
prima di dev/build/preflight; le parti sono in `asset-sources/weapon-fronts/`.
Conservare questa preparazione anche nei checkout nuovi. La Cascata
prosegue dallo scafo precedente soltanto per trasferimenti reali pagati;
le Schegge sparano una volta per turno proprio e usano il bersaglio reale.
Vedi `docs/ARMI_METALLO_TERZO_GRUPPO_INTEGRATO_2026-11-25.md`.

Le sei varianti del terzo gruppo sono state collaudate sulla plancia reale
StackBlitz: A/B, entrambi gli slot, turni successivi e condizioni Energia/
Difesa/blocco, con video e audio a velocità nativa. Il riscontro aptico
fisico sul telefono resta da verificare. Dettagli nel resoconto del lotto 3.
