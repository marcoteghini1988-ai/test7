# Regole permanenti per gli effetti delle carte

## Regola obbligatoria: corrispondenza completa fra carta, grafica, suono e vibrazione

**Richiesta permanente dell'utente — 26 novembre 2026:**
«Tutti gli effetti che vengono descritti dalle carte devono esserci una
corrispondenza visiva, sonora e di vibrazione».
L'utente chiede che questa regola sia letta spontaneamente quando si
creano gli effetti, senza doverlo ricordare.

### Quando leggerla

Prima di progettare, creare, modificare, integrare o collaudare un effetto
di qualsiasi carta, leggere questo documento e le istruzioni in
`AGENTS.md`. È un passaggio obbligatorio dell'attività, anche in una
nuova chat. Non aspettare una richiesta «leggi la regola».
Riutilizzare una lettura della versione corrente già effettuata nella
stessa sessione; rileggerla se il documento cambia, evitando recuperi
ripetuti a ogni domanda conversazionale.

### Che cosa deve corrispondere

La regola vale per tutte le categorie di carte: Arma, Attacco, Difesa,
Trappola, Personaggio, Energia, Terreno e Fusione. Riguarda ogni effetto
principale, secondario, condizionale o combinato, la sua persistenza e la
sua fine, secondo ciò che la carta prevede realmente.

Per ogni effetto previsto devono essere progettati e realizzati insieme:
- **Rappresentazione visiva:** azione riconoscibile sul vero oggetto
  coinvolto, con provenienza, bersaglio, ordine, durata e conseguenze
  corretti. Mostrare l'effetto anche sulle carte coinvolte, non soltanto
  sulle navicelle o su un generico bagliore.
- **Suono:** segnale coerente con l'azione, la macchina/materiale e la
  fase reale, sincronizzato con il contatto o cambiamento di stato.
- **Vibrazione:** riscontro coerente con gli stessi eventi e fasi,
  distinto ove serve per attivazione, tensione, impatto, rottura,
  rilascio o scadenza. Rispettare impostazioni e capacità del dispositivo.

La copertura non si esaurisce nel colpo iniziale. A seconda della carta,
comprende caricamento/attivazione, consumo o uso di risorse, movimento,
aggancio, trazione, impatto, blocco/riduzione, superamento di una Difesa,
distruzione/rimozione, passaggio agli scarti, cura, potenziamento,
indebolimento, stati persistenti, trasferimenti, fusioni, fine dell'effetto
e ripristino. Questi sono casi da verificare quando previsti, non nuove
abilità da aggiungere alle carte.

Le condizioni non soddisfatte o gli attacchi bloccati devono avere un
riscontro coerente con il mancato effetto. Non mostrare un danno riuscito,
una rottura o una rimozione che il motore non ha prodotto. Non rivelare
carte coperte o Trappole prima di quanto consentano le regole.

### Procedura obbligatoria per ogni realizzazione

1. Leggere definizione completa, ID, categoria, elemento, rarità, testo
   e valori della carta; leggere motore, eventi e decisioni approvate.
   Separare la meccanica corrente dalle revisioni ancora da realizzare.
2. Per ciascun effetto previsto annotare internamente condizioni,
   oggetti coinvolti, inizio/fine e corrispondenti animazione, suono e
   vibrazione. Individuare ogni ramo condizionale, interazione e scadenza.
3. Realizzare i tre canali sulla stessa sequenza di eventi reali,
   personalizzata per carta e rarità secondo le scelte dell'utente.
   Non sostituire effetti distinti con lo stesso sparo generico.
4. Verificare le situazioni pertinenti: attivazione riuscita e impedita,
   con/senza condizioni o risorse, Difese, bersagli realmente presenti,
   turni successivi, fine/interruzione, rarità e lati A/B quando applicabili.
   Verificare anche reazione e stato delle altre carte coinvolte.
5. Considerare il lavoro completo soltanto quando tutti gli effetti
   della meccanica hanno la corrispondenza nei tre canali. Se un canale
   o una situazione resta da realizzare/verificare, dichiararlo
   chiaramente senza presentare l'effetto come finito.

### Fedeltà e verifica

Preservare quantità di colpi, danni totali, costi, bersagli e durate
approvati. Effetti visivi, suoni e vibrazioni non aggiungono danni,
Bruciature, immobilizzazioni o rimozioni. Coordinare animazione e stato
reale: una carta soltanto superata rimane in campo; una carta distrutta
deve mostrare la rimozione reale e la destinazione corretta.

Rispettare mute/volume, preferenze aptiche, movimento ridotto e visibilità.
Progettare sempre il riscontro aptico; la sua esecuzione dipende dal
supporto e dalle impostazioni del dispositivo. Distinguere codice del
pattern, verifica software e prova fisica sul telefono: non dichiarare
quest'ultima conclusa senza averla osservata. La mancanza di supporto in
un ambiente di prova non giustifica l'omissione del progetto aptico.

Una sola build, un test del motore o uno studio offline non certificano
grafica, audio e vibrazione nella partita. Registrare separatamente il
riscontro effettivo di ogni canale e gli eventuali controlli ancora aperti.

**Stato operativo:** questa regola governa le future realizzazioni.
L'ordine corrente resta raccolta e salvataggio delle specifiche; nessuna
implementazione degli effetti parte prima del comando dell'utente.

## Regola obbligatoria — natura del colpo coerente con l'elemento

**Richiesta dell'utente, 26 novembre 2026:** il tipo di sparo e l'effetto
scenico devono rendere riconoscibile l'elemento della carta. Vale per
tutti gli elementi e per tutte le rarità, insieme alla corrispondenza
visiva, sonora e aptica già obbligatoria.

| Elemento | Natura visiva del colpo da rispettare |
| --- | --- |
| Metallo | Corpi e frammenti metallici, massa, taglio, perforazione o urto meccanico secondo l'arma. |
| Fulmine | Scariche elettriche, saette e archi che esprimono conduzione e impatto elettrico. |
| Fuoco | Fiamme, plasma caldo, scie incandescenti e combustione scenica coerente con l'arma. |
| Acqua | Getti, onde, gocce, flussi e impatti fluidi. |
| Ghiaccio | Ghiaccio, brina, cristalli freddi e frammentazione gelida. |
| Terra | Rocce, minerali, polvere e detriti solidi coerenti con il dispositivo. |
| Vento | Flussi d'aria, vortici, pressione e distorsioni leggibili del movimento dell'aria. |
| Luce | Radiazione luminosa, raggi e geometrie di luce coerenti con il dispositivo. |
| Ombra | Ombre, oscuramento e distorsioni scure secondo la natura della carta. |
| Gravità | Distorsione spaziale, compressione e rappresentazione della massa e dei campi gravitazionali. |

La tabella orienta la rappresentazione; non approva una stessa animazione
per tutte le armi dello stesso elemento. Ogni arma e ogni evoluzione
devono conservare una sequenza riconoscibile per forma, azione, ritmo,
lancio e contatto, secondo la proposta approvata. Non limitarsi a cambiare
il colore di un proiettile generico.
Macchina e proiettile devono restare coerenti con l'illustrazione approvata.

Anche il suono e la vibrazione seguono materiale, azione ed elemento.
Gli effetti visivi non aggiungono meccaniche: una fiamma transitoria non
crea Bruciatura, la brina non congela, l'aria non respinge e la gravità
non rallenta se il motore non prevede quegli effetti.
Rispettare sempre bersagli, numero di impatti, danni, costi, Difese e
durate della carta. Una Difesa bloccante reagisce sulla protezione e
sulla carta stessa, senza simulare danno riuscito sulla nave.

Leggere e applicare questa regola autonomamente prima di progettare o
creare gli effetti. Le scelte specifiche delle carte restano distinte
dalla regola generale dell'elemento.

## Modalità corrente: raccogliere, salvare, poi creare su comando

L'utente ha chiesto di annotare per ora gli effetti carta per carta e di
crearli più avanti tutti insieme, quando lo dirà esplicitamente. Questa
fase riguarda soltanto le specifiche. Una scelta grafica non avvia ancora
l'implementazione, la modifica del motore o il collaudo. Il punto attuale
è il Frantumatore a Induzione, descritto nel documento di ripresa; le
Ganasce sono in pausa. Maglio, Slitta e Termobalistica hanno la direzione
già documentata. La Termobalistica è chiusa a 3 base / 6
potenziati, indipendentemente dalla rarità.

## Carte Difesa: rendere visibile l'interazione sulla carta stessa

Richiesta dell'utente durante la progettazione del Frantumatore a
Induzione, 26/11: quando una carta Difesa interviene, viene superata o
viene rotta, l'effetto deve vedersi **anche sulla carta Difesa coinvolta**.

Coordinare la reazione visibile della carta nel campo con protezione,
impatto, audio e stato effettivo. Un bypass lascia la carta attiva in
campo e non ne simula la distruzione; una rimozione reale mostra una
rottura/smontaggio leggibile e il passaggio agli scarti. Se la Difesa
riduce il danno, mostrare sulla nave soltanto il residuo; se lo blocca
interamente, non inventare un impatto di danno sullo scafo.
Il solo bagliore sullo scudo o sulla nave non sostituisce la reazione
richiesta sulla carta Difesa stessa.

Applicare il principio agli effetti che coinvolgono davvero una Difesa,
seguendo i relativi eventi del motore. Non animare rimozioni di altre
carte o conseguenze non previste dalla meccanica. I dettagli artistici
si definiscono coerentemente con la singola arma, la Difesa e la rarità.

Questa è una specifica da realizzare al comando di creazione, non una
dichiarazione di implementazione o collaudo già conclusi.

## Precisazioni vocali del 26 novembre 2026

Riferimento dettagliato per riprendere in un'altra chat:
[Regole effetti e ripresa del lavoro](REGOLE_EFFETTI_E_RIPRESA_LAVORO_2026-11-26.md).

**Ambito da rispettare:** i nuovi conteggi 2/3/5/7 e la serie di martelli
rotanti appartengono soltanto al Maglio Ferrogravitazionale. Ogni altra
carta conserva le proprie regole e attende una scelta grafica specifica
dell'utente. Nessun conteggio o movimento del Maglio è un modello universale.

**SOLO Cannone a Slitta d'Acciaio:** una sola palla di cannone per
attivazione in tutte e quattro le rarità. Il danno cresce con la rarità;
non aggiungere raffiche. Dimensioni o dettagli possono evolvere. L'utente
ha scelto dettagli nei colori della rarità ufficiale: Comune grafite,
Rara bronzo/sabbia bronzata, Epica argento, Leggendaria cristallo prismatico
(la base più recente del 24/11 prevale sulla vecchia Leggendaria oro).
Conservare la palla riconoscibile; non estendere questa sequenza al Maglio
o alle altre carte. Anche questa nuova direzione resta da implementare.

**SOLO Artiglieria Termobalistica di Recupero:** granate metalliche a
parabola, scie termiche ed esplosione distinta per ciascun impatto reale.
Tre proiettili se il colpo è al danno base, **sei** se il colpo è
amplificato dal bonus degli HP persi dopo la posa. Il passaggio dipende dal
bonus, non dalla rarità Epica/Leggendaria. Il numero è stato scelto con
la risposta esplicita «Sei»: nessuna scelta numerica rimane aperta. Danno
totale, due turni propri, copertura e Difese rimangono quelli del motore.
Per ora la direzione è soltanto documentata, su richiesta dell'utente.

I martelli partono a intervalli brevi, uno dopo l'altro: il successivo può
partire prima dell'arrivo del precedente, ma le partenze non sono simultanee.
Ogni martello ruota durante il volo e ha un contatto distinto sul vero
bersaglio. Il numero esatto di millisecondi fra i lanci non è stato scelto
dall'utente e non va presentato come un valore già approvato.

La provenienza, invece, è una regola generale: il lato «porta USB» è tutto
il bordo inferiore, quello avversario è tutto il bordo superiore. Variare
i punti lungo il bordo pertinente; non usare un solo emettitore centrale.

Questo salvataggio riguarda le istruzioni. L'attuazione dei chiarimenti
nel codice e il relativo collaudo restano da completare.

## Ordine aggiornato: proposta dell'assistente e approvazione dell'utente

L'utente ha chiesto di velocizzare la revisione delle carte già inserite:
le funzioni confermate sono nel codice; l'assistente deve proporre
l'effetto, poi l'utente dice se va bene o cosa cambiare.

**Sequenza:** verificare una volta carta, illustrazione e meccanica →
spiegare brevemente la funzione quando serve → proporre una sequenza
visiva, sonora e aptica completa → recepire approvazione/correzioni →
salvare la scheda confermata → passare alla successiva già nel gruppo.
Non aspettare che l'utente inventi la direzione grafica. Questa modalità
aggiorna le precedenti istruzioni che gli assegnavano ogni proposta.

Riutilizzare la versione corrente già verificata nella sessione e
controllare di nuovo soltanto dati mancanti, dubbi reali o file cambiati.
Non risalvare la stessa scheda dopo ogni semplice domanda; salvare alla
conferma o al cambio di argomento per conservare una carta sospesa.
Non presentare nomi o meccaniche come confermati senza riscontro.

Una conferma della meccanica non approva automaticamente una proposta
grafica. La progettazione approvata non equivale a un effetto già creato.
**Ora si definiscono e salvano le scelte; la realizzazione degli effetti
verrà al comando esplicito dell'utente.** Gli effetti attuali si descrivono
quando richiesto, distinguendoli sempre dalla nuova proposta.

## Criteri di realizzazione

Consolidate su richiesta esplicita dell'utente il 25 novembre 2026.
Applicarle alle carte attuali e alle prossime, di qualsiasi elemento.
Sostituiscono le vecchie prescrizioni di un unico punto di lancio e dello
stesso singolo colpo per tutte le rarità. Non approvano nuove illustrazioni.

1. **Leggere la carta e il motore prima di disegnare l'effetto.** Verificare
   ID e rarità correnti, condizioni, costi, turni, combo, copertura, Difese,
   bersagli e danni effettivi. Rappresentare tutti i passaggi che contano.
2. **Inventiva e coerenza fisica.** Le Armi sono dispositivi 3D modellabili;
   non fare tutte le macchine a forma di cannone o su quattro piedi. Parti
   articolate, emettitori, munizioni e movimento devono corrispondere
   all'illustrazione approvata. Non sostituire il modello con una figura
   piatta ruotata né ingrandire una testata squadrata fino a coprire lo scafo.
3. **Origini variabili lungo il bordo della flotta che spara.** Per il
   giocatore usare tutto il bordo inferiore; per l'avversario tutto il
   bordo superiore, con prospettiva speculare A/B e determinismo nei replay.
   «Porta USB» non significa l'unico punto centrale del telefono. La
   precisazione del 26/11 prevale sulla vecchia formulazione sulle profondità.
   Un trasferimento previsto dalla carta riparte invece dalla nave colpita.
4. **Variare l'azione, oltre alla sagoma, secondo la scelta per quella carta.**
   Raffiche, alternanze, ventagli, curve, scie, rotazioni e finali speciali
   si definiscono carta per carta. 3/6/9 erano esempi precedenti, non una
   regola universale; 2/3/5/7 sono la nuova scelta solo per il Maglio.
   Ogni rarità sviluppa struttura e ritmo della sequenza,
   non solo colore o scala. Il conteggio deve essere codificato nel motore
   e indicato sulla carta; la somma dei danni resta il totale concordato,
   senza moltiplicare HP, costi Energia o controlli delle Difese.
5. **Contatto evidente sulla nave.** Al momento dell'arrivo mostrare un
   impatto locale riconoscibile: esplosione, detonazione di plasma, getto
   perforante, frattura, scintille, detriti, taglio, morso o scarica secondo
   l'arma. Un piccolo scossone da solo non basta. Usare nucleo/corpo visibile,
   strati in profondità e una coda breve quando pertinenti. Ogni proiettile
   della raffica ha un contatto leggibile; il finale è più ricco. Dimensioni
   commisurate allo scafo, con la nave ancora riconoscibile.
6. **Lo scafo reagisce e il contatto lo segue.** Misurare il vero bersaglio;
   mantenere coincidenti naso, punto d'impatto, esplosione e reazione anche
   con più colpi sovrapposti. Recoil, torsione, luce e reattori accompagnano
   il materiale del colpo. Non muovere barre, slot o la plancia. Ripristinare
   tutte le pose e proprietà transitorie alla fine o all'interruzione.
7. **Nessuna meccanica inventata dall'effetto.** Mostrare soltanto danni,
   bersagli, agganci e durate reali. Una fiammata transitoria non è una
   Bruciatura persistente. La Difesa bloccante ha un contatto sullo scudo,
   senza ferite/esplosioni dello scafo. Un proiettile reale con quota HP zero
   fa solo un piccolo contatto sulla corazza. Nessuno sparo senza Energia.
   Ganasce: due agganci reali e catene persistenti. Collassatore: vere navi
   accelerate fino a un solo schianto/BOOM, non due esplosioni duplicate.
8. **Suoni e vibrazione fanno parte della stessa sequenza.** Carica, sparo,
   tensione, contatto, esplosione e rilascio usano gli stessi istanti del
   renderer. Suoni distinti, posizione stereo coerente, impulsi brevi nelle
   raffiche e finale riconoscibile. Rispettare volume, mute, preferenze,
   visibilità e movimento ridotto. Non scambiare una richiesta software
   accettata con un collaudo fisico della vibrazione sul telefono.
9. **Verificare e salvare l'inserimento completo.** Dopo approvazione del
   fronte e indicazione/conferma dell'effetto grafico da parte dell'utente,
   inserire illustrazione, conteggio/testo, effetto per rarità, suoni e
   aptica nella stessa versione di `test7`. Verificare entrambi i lati,
   madre/supporti, combo, blocchi e rilascio del turno. Collaudare la
   partita su StackBlitz quando operativo. Dichiarare separatamente test,
   build, studio offline e collaudo dal vivo; non accelerare un video per
   simulare un effetto più energico e non riutilizzare vecchi collaudi come
   prova di una versione nuova. Non creare versioni parallele del progetto.

## Riferimenti correnti

- `src/fleetNext/approvedWeaponSalvos.js`: conteggi delle 22 varianti.
- `src/weaponKinematics.js`: origini, contatti, curve e orientamento 3D.
- `src/weaponHullImpacts.js`: contatti per famiglia e posa condivisa.
- `src/weaponCinematicRenderer.js`: esplosioni e altri contatti volumetrici.
- `src/collisionExplosion.js`: unico BOOM del Collassatore.
- `src/weaponSalvoAudio.js`, `src/weaponHaptics.js`: cue e preferenze.
- [Raffiche e origini variabili](RAFFICHE_ORIGINI_VARIABILI_2026-11-25.md).
- [Procedura per creare una carta](PROCEDURA_OBBLIGATORIA_CREAZIONE_CARTE.md).

La forma precisa dei nuovi effetti viene valutata sul codice e nelle prove
visive; questi principi non significano che un effetto non verificato sia
già approvato o collaudato.
