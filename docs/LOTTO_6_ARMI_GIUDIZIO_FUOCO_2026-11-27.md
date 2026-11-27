# Sei Carte Arma — Giudizio Temporale e Fuoco

Il 27 novembre l’utente ha approvato il Giudizio Temporale con «ok, ma
lavora su piu carte contemporaneamente». La lavorazione passa a più
famiglie e rarità insieme. Ha poi confermato con «Confermo entrambe le
direzioni» le proposte del Mortaio e dell’Inceneritore presentate insieme.
Queste tre direzioni non devono essere riproposte per un’altra conferma.

**Stato:** sei fronti completi da revisionare, non ancora approvati né
promossi nel gioco. Restano 52 varianti nel registro approvato, 22 Metallo
e 30 Fulmine. Lo studio è distinto dal collaudo della partita StackBlitz.
Nessun fronte già approvato o meccanica di combattimento è modificato.

| Famiglia | Rarità | Testo EN sul fronte | Nominali diretti | Durata |
| --- | --- | --- | --- | --- |
| Cannone del Giudizio Temporale | Leggendaria | Temporal Judgment Cannon | 20% degli HP massimi del bersaglio | 3 turni propri; un solo attacco alla posa |
| Mortaio Magmatico | Rara | Magmatic Mortar | 20 base; 8 per extra | 3 turni propri |
| Mortaio Magmatico | Epica | Magmatic Mortar | 48 base; 19 per extra | 3 turni propri |
| Mortaio Magmatico | Leggendaria | Magmatic Mortar | 67 base; 28 per extra | 3 turni propri |
| Inceneritore a Plasma Rotante | Epica | Rotating Plasma Incinerator | 37 al primo turno; 27 al secondo | 2 turni propri |
| Inceneritore a Plasma Rotante | Leggendaria | Rotating Plasma Incinerator | 54 al primo turno; 39 al secondo | 2 turni propri |

I valori diretti stampati sono i candidati strategici correnti di
`WEAPON_NEAR_FINAL_VALUES`, prima dei modificatori ordinari. Il manifest
conserva anche i profili legacy eseguiti, cui il motore applica già il
fattore strategico. Non sostituire il profilo con il candidato stampato
senza eliminare l’eventuale doppia applicazione. Non sono un nuovo
bilanciamento definitivo. I PNG del lotto precedente restano intatti.

## Direzioni confermate

**Giudizio:** un nucleo elettrico compatto con tre anelli di fulmine in
piani e ritmi diversi. Gli anelli si allineano sull’avvicinamento e
collassano in una sola scarica concentrata sul bersaglio reale. Lampo
prismatico locale, contraccolpo dello scafo solo con danno, suono crescente
e tuono secco. La Difesa riceve la scarica sullo scudo, senza danno o
contraccolpo dello scafo. Nessun rallentamento, blocco temporale o attacco
aggiuntivo. Macchina a forcella con sei piastre di fase e stabilizzatori
prismatici nell’illustrazione.

**Mortaio:** sfere di magma pesanti in traiettoria arcuata, un colpo base
gratuito per turno e al massimo due extra pagati con cariche Fuoco reali.
Le crepe di lava, la scia, il movimento, l’impatto e il timbro evolvono con
la rarità. Rara bronzata; Epica mantiene tutte le parti e aggiunge
dissipatori e rinforzo in argento; Leggendaria conserva l’Epica e aggiunge
stabilizzatori fisici prismatici. Frammenti e filamenti sono decorazioni
dello stesso colpo. Sprite del proiettile generato sul riferimento della
sfera Rara, PNG trasparente, usato dallo studio.

**Inceneritore:** un getto di plasma incandescente a spirale, emesso dal
rotore illustrato. L’Epica ha rotore argentato, scambiatori e supporto;
la Leggendaria conserva la macchina e aggiunge tre deviatori termici
prismatici e rinforzi. Il getto mantiene un solo contatto per attacco,
anche quando la Leggendaria intreccia più filamenti. Bruciatura, scintille,
suono e impulso aptico compaiono soltanto per gli eventi reali. Nessun
danno continuo inventato durante il volo del getto.

## Meccaniche verificate e limiti numerici

- Giudizio è soltanto Leggendaria. Il resolver non provvisorio esegue
  l’attacco nel turno di posa, poi nessun altro nei turni 2 e 3; occupa
  comunque lo slot fino alla scadenza. Usa HP massimi della nave madre
  quando mira a un suo componente, altrimenti quelli del bersaglio.
  Coperture, Difese e modificatori ordinari si applicano. Non spende Energia.
- Il Mortaio riserva le cariche prima dell’attacco del Generatore; ogni
  extra richiede una carica fisica valida. I casi con 0/1/2/3 cariche
  mostrano rispettivamente 1/2/3/3 colpi al primo turno, con una carica
  residua utilizzabile al secondo nel caso iniziale da tre. Non è un’AOE.
- L’Inceneritore corrente esiste solo Epico e Leggendario. Il primo
  impatto riuscito applica la Bruciatura in funzione delle **proprie
  Strategie negli scarti**. Il valore è fissato in quel momento, cinque
  tick; il secondo colpo non applica una nuova Bruciatura. Se il primo
  colpo è bloccato, non compare alcun incendio.
- La Bruciatura eseguibile usa Epica 2 per Strategia, minimo 2 e massimo
  12; Leggendaria 3 per Strategia, minimo 3 e massimo 16, prima dei limiti
  ordinari della madre. `tickProvisionalBurns` usa il valore memorizzato
  senza moltiplicatore strategico ulteriore. Per questo i fronti usano
  questi campi eseguibili e non la diversa scalatura del candidato di stampa.
- Il motore corrente applica il primo tick alla chiusura del turno di
  posa e i successivi ad ogni passaggio di turno. Lo studio ne conserva
  esattamente i cinque eventi: non li descrivere come cinque turni propri
  o cinque soli turni avversari. La durata dell’Arma è comunque due turni.
  Questa fotografia del codice non modifica le vecchie intenzioni di
  progettazione: eventuali revisioni di tempistica sono un lavoro separato.

## Asset e produzione

Illustrazioni originali e sprite:
`asset-sources/weapon-previews/lotto-giudizio-fuoco-2026-11-27`.
Prompt e catena di riferimento sono nei due JSON della stessa directory.
Le sei illustrazioni sono PNG nativi 1448×1086; i fronti e le basi sono
RGBA 3072×4608, composti dalle cornici originali HD. La risoluzione del
fronte non è la risoluzione nativa dell’illustrazione.

Cornici `basi-rarita-ufficiali-2026-11-24/arma-rosso`, simbolo Arma nello
slot sinistro, Fuoco/Fulmine nello slot destro. Nessuna cornice o icona è
ricreata. Testi inglesi predefiniti, dizionario italiano, SVG separati;
il cambio lingua modifica soltanto le aree testo. Il font ufficiale non
contiene `%` e `+`: questi due segni sono vettori nel livello testo.

```bash
node scripts/previews/lotto-giudizio-fuoco-20261127/catalog.mjs OUTPUT
python3 scripts/previews/20261126/make-masks.py . OUTPUT
NODE_PATH="$CODEX_PRIMARY_RUNTIME_NODE_MODULES" node scripts/previews/lotto-giudizio-fuoco-20261127/compose-cards.mjs OUTPUT
python3 scripts/previews/lotto-giudizio-fuoco-20261127/verify-frames.py . OUTPUT
node --test scripts/previews/lotto-giudizio-fuoco-20261127/batch.test.mjs
NODE_PATH="$CODEX_PRIMARY_RUNTIME_NODE_MODULES" node scripts/previews/lotto-giudizio-fuoco-20261127/export.mjs OUTPUT
```

Aspettare la composizione prima della verifica e dell’esportazione.
Non rigenerare l’arte per riprodurre i fronti. Il pacchetto di revisione
conserva anche i PNG originali completi EN/IT e le basi senza testo.

## Verifiche completate

Nove test mirati passati; 33 sequenze del resolver nell’HTML. Tutte le
rarità, entrambi i lati, madre/supporti, secondo slot, cariche 0–3,
Difesa, Arma disabilitata, attacchi unici/periodici, Bruciatura e scadenze.
Nessun cambiamento al motore, ai collegamenti della partita o alle 52
varianti approvate. I renderer dei tre effetti, audio e piano aptico
rimangono isolati nello studio, pronti per la promozione dopo la revisione.

Per tutti i sei fronti: dimensioni RGBA 3072×4608, zero pixel protetti
della cornice modificati, alfa esterna identica, zero modifiche EN/IT
fuori dalle aree testo. SHA-256 dei fronti, basi e traduzioni nel rapporto.

Il video dello studio comprende otto sequenze, tutte le sei varianti,
Giudizio dai due lati e un blocco di Difesa: 62,9 secondi, 720×1280,
H.264 e AAC stereo 48 kHz. Stessa sintesi PCM e stessi tempi dell’HTML;
picco PCM 0,622, senza clipping. È un’esportazione dello studio con
eventi reali, **non una registrazione della partita StackBlitz**.
Nessuna vibrazione fisica su telefono è certificata.

## Ripresa dopo la revisione

1. Ottenere la conferma del gruppo di sei fronti e dell’aspetto concreto
   mostrato nello studio; le tre direzioni generali sono già approvate.
2. Conservare i PNG approvati byte per byte e collegare i moduli condivisi
   a partita, effetti sonori e aptica senza duplicare i danni o i costi.
3. Collaudare sulla copia StackBlitz esistente, entrambe le parti,
   salvataggio e reload, quindi consegnare il video reale con audio.

I riferimenti persistenti ai file consegnati e i risultati puntuali
sono nel registro di collaudo di questo lotto.
