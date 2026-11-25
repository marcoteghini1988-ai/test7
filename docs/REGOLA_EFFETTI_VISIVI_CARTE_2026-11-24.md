# Regola dei colpi e degli effetti delle carte — 24 novembre 2026

## Decisione più recente del 25/11 — sostituisce le partenze e i colpi fissi

L'utente chiede ora punti di lancio variabili sul lato del rispettivo
giocatore, salve da 3/6/9, curve, rotazioni ed esplosioni differenti per
famiglia e rarità. Le prescrizioni sotto sul centro USB obbligatorio e su
un unico proiettile per tutte le rarità sono superate per le 22 varianti
già approvate. Leggere `RAFFICHE_ORIGINI_VARIABILI_2026-11-25.md` e
`src/fleetNext/approvedWeaponSalvos.js` prima di lavorare sugli effetti.
Rimangono vincolanti corrispondenza con il codice, bersagli reali,
prospettiva, audio e aptica sincronizzati e distinzione fra studio offline
e collaudo nella partita. Il danno totale si ripartisce nei proiettili,
senza moltiplicarlo; Difesa e copertura verificano la salva per bersaglio.

## Prima di ogni effetto — precisazione vincolante del 25 novembre

Per **qualsiasi carta**, prima di ideare un effetto leggere nel codice la
definizione corrente, la funzione che lo risolve e gli eventi effettivi.
Controllare ID, rarità, condizioni, combo, bersagli, quantità di colpi,
tempi, durata, blocchi e scadenze. Partire da questa verifica per studiare
la rappresentazione migliore dell'intera azione; non dal nome, dal solo
elemento o da uno sparo già pronto.

Preparare una sequenza che descriva insieme **immagini e movimento,
effetti sonori e vibrazione**. Specificare per ogni fase cosa si vede,
quando si sente e quale impulso aptico accompagna l'azione. Sincronizzare
i tre canali sugli stessi eventi e sul momento dell'impatto. La vibrazione
rispetta le preferenze del giocatore; verificarla su un dispositivo che
la supporta e indicare quando il browser di prova non permette il riscontro.
Non dichiararla verificata sulla sola base della chiamata software.

### Esempio: aggancio magnetico e collisione fra navi

La sequenza reale è composta da due Carte Arma Metallo:

1. `weapon-designed-metallic-ganasce-magnetiche` e relative evoluzioni:
   i due arpioni attaccano bersagli differenti; il motore conserva soltanto
   quelli effettivamente colpiti. L'aggancio prepara il turno proprio successivo.
2. `weapon-designed-metallic-collassatore-lega` e relativa evoluzione:
   richiede l'aggancio nel turno proprio precedente e due bersagli ancora
   vivi; applica l'urto ai due bersagli, con Difese individuali.

Il relativo effetto deve rendere visibili i punti d'aggancio e le catene o
i cavi magnetici ancorati agli scafi reali. I collegamenti seguono le navi
finché l'aggancio è valido. Alla collisione si tendono, le due navi vengono
tirate l'una contro l'altra, gli scafi si urtano nel punto calcolato e poi
tornano negli alloggiamenti corretti; ripristinare la posa anche se una nave
viene distrutta. Movimento, suono metallico e impulso aptico dell'urto
devono coincidere con la risoluzione del motore. Distinguere aggancio,
trazione e urto; non sostituirli con spari o esplosioni generiche. Un aggancio
mancato, un bersaglio distrutto o una combo scaduta non producono una
collisione fittizia. Non aggiungere un blocco delle azioni nemiche: non è
previsto dalla meccanica. Conservare la prospettiva delle due flotte.

**Stato al 25/11:** fronti approvati, catene persistenti, trazione e movimento
degli scafi reali, suoni e richieste aptiche specifici sono integrati e
collaudati su StackBlitz. Il riscontro fisico della vibrazione sul telefono
resta da verificare. Vedi `ARMI_METALLO_CATENE_COLLISIONI_INDUZIONE_2026-11-25.md`.

**Correzione dell'utente, urto esplosivo:** il contatto fra le due navi deve
avere un BOOM netto, con lampo breve, nucleo incandescente, onda d'urto sul
piano, scintille, schegge metalliche, fumo e contraccolpo degli scafi. Audio
profondo e impulso aptico accompagnano lo stesso unico urto; la Leggendaria
aggiunge frammenti prismatici. Il contatto resta nel punto calcolato dagli
scafi e dalla camera reale, senza introdurre danni ad area, bersagli o colpi.
Non rendere esplosivi anche gli altri attacchi per semplice riuso dell'effetto.

**Revisione successiva, dinamica e luce:** il solo aumento dell'esplosione
non ha reso convincente lo scontro: gli scafi scorrevano lentamente e
frenavano all'arrivo. Il Collassatore ora libera il corridoio davanti alla
madre, poi accelera fino al contatto negli ultimi 380 ms della trazione di
1000 ms. Lo scafo si inclina, subisce torsione e rinculo, riflette il lampo
e reagisce con i reattori; la reazione/rientro dura 1350 ms, con rilascio
dopo 75 ms. Il risucchio sonoro termina sul nuovo istante del BOOM. I video
di prova mantengono la velocità reale. Non spostare barre e slot né lasciare
rotazioni, filtri o variabili d'animazione dopo la sequenza.

## Direzione della battaglia

Nella plancia verticale il giocatore A spara dal centro del bordo inferiore,
allineato alla porta USB del proprio telefono, verso il bersaglio avversario.
L'avversario B spara dal centro del bordo superiore, come se il colpo uscisse
dal suo dispositivo e arrivasse alle navi del giocatore. I due lati sono
speculari: nessun colpo nasce casualmente ai lati dell'arena, dalla carta o
da un punto estraneo alla prospettiva della partita.

## Contratto fra carta, motore e animazione

1. Ogni Carta Arma approvata ha un profilo visivo e sonoro esplicito per il
   proprio ID e per ciascuna rarità esistente. L'illustrazione, il suono e
   l'effetto di battaglia devono descrivere
   lo stesso apparecchio: un Maglio gravitazionale non lancia martelli a mano,
   una scarica Fulmine non diventa una palla di fuoco.
2. L'evento del motore stabilisce **se** parte un colpo, **quanti** impatti
   avvengono e **quali** bersagli e danni sono reali. Un colpo bloccato o non
   alimentato non produce un proiettile che colpisce. Un pluricolpo mostra
   gli impatti realmente calcolati, con i loro bersagli; non aggiungere danni
   o proiettili per rendere più spettacolare la rarità.
3. Comune → Rara → Epica → Leggendaria evolve la finitura dell'effetto:
   struttura del nucleo, scia, compressione, riflessi e onde d'impatto sempre
   più riconoscibili. Il **numero di colpi effettivi** cambia soltanto quando
   la meccanica della variante nel catalogo lo prevede. Per il Maglio sono
   sempre **un colpo e un bersaglio**, con danni nominali 18/46/109/154 HP;
   crescono da uno a quattro le rifiniture della scia e le onde dell'impatto.
4. Effetti con Energia usano il costo reale **per attacco**, quando previsto
   dalla carta. Energia presente per un bonus e Energia consumata sono
   visualmente distinguibili. La grafica non anticipa uno sparo che il
   motore non autorizza.
5. Il bersaglio si misura sul vero elemento della nave, supporto o modulo
   colpito nella plancia. La stessa regola vale per A e B, per gli slot Arma
   1 e 2, per il ritorno del colpo e per i colpi successivi.

## Applicazione alle categorie

Le **Armi** e le carte **Attacco** che producono danno leggono l'evento reale
e usano la traiettoria dal bordo del rispettivo giocatore. Un attacco ad area
ha un impatto per ogni bersaglio effettivamente colpito. **Difesa** e
**Trappola** reagiscono nel punto del blocco o della rivelazione; **Energia**
si carica nello slot; **Terreno** modifica il campo; **Personaggio** mostra
la propria attivazione. Queste carte non inventano un proiettile offensivo.

Il rendering legge i colpi base, criogenici, pluricolpo, progettati e
provvisori, oltre all'impatto unico delle Armi che nel motore sommano la loro
potenza. **L'elemento da solo non definisce l'effetto di una carta**: le altre
Armi mantengono la visualizzazione provvisoria precedente, senza un profilo
univoco approvato. Le prove con dieci simboli/forme elementali non erano
effetti definitivi delle singole Armi e sono state ritirate.

## Ogni nuova carta approvata

### Precisazione dell'utente, 25 novembre: inventiva e rarità

Leggere ogni carta per intero prima di disegnare l'effetto. Ogni rarità deve
avere una sequenza riconoscibile, non lo stesso sparo ricolorato: carica,
eventuali raffiche, scie, parti mobili, risonanze e impatto possono evolvere.
Gli effetti particolari reagiscono alle condizioni effettive della carta.
Una raffica mostra i colpi realmente autorizzati dal motore; i moduli
estetici non aggiungono impatti HP o bersagli. Le prossime macchine devono
variare anche forma e sistemi di aggancio, evitando una serie di cannoni o
basi a quattro piedi.

Le sei Slitta/Recuperatore mostrate il 25/11 sono approvate. La Slitta ha un
unico colpo per risoluzione: Comune con dardo/tracciante, Rara con doppia
elica, Epica con collari di compressione e Leggendaria con coste e scia
prismatiche. Il Recuperatore ha un colpo per ciascuno dei due turni propri:
tre flussi di conversione nell'Epica, condensatore prismatico e rifrazioni
nella Leggendaria. La carica segue il bonus nominale dello specifico evento,
nello stesso spazio RAW del motore prima dei modificatori della partita.
Suoni di carica, lancio e impatto sono distinti per tutte e sei le varianti.

Insieme al fronte completo, definire per ciascuna rarità esistente l'aspetto
dello sparo, la scia, l'impatto e il suono coerenti con il dispositivo della
carta. Collegare i profili agli ID esatti, agli eventi reali del motore e alle
due direzioni della plancia. Salvare carte, codice e suoni in `test7/main`,
quindi aprire la versione GitHub in StackBlitz e verificare visivamente in
partita card, slot, bersaglio, sequenza video e audio sincronizzato. Solo dopo
questo collaudo il fronte e il suo effetto si considerano integrati.

I quattro fronti del Maglio sono PNG 3072×4608. Comune, Rara, Epica e
Leggendaria mantengono un unico colpo reale, con scia, impatto e suono distinti.

## Proiettili e velocità approvati — revisione del 24 novembre

Il confronto `docs/riferimenti-carte/maglio-ferrogravitazionale-2026-11-24/proiettili-approvati.png`
fissa l'aspetto delle quattro munizioni: testa segmentata Comune, giroscopi
bronzei Rara, piastre e dissipatori Epica, struttura prismatica Leggendaria.
Il gioco ne ricostruisce i volumi in `src/maglioProjectile3D.js`. L'atlante PNG
con trasparenza resta come riferimento artistico. Non basta ruotare la stessa
immagine: nel tiro del giocatore si vede il retro, in quello avversario il
fronte. Una camera fissa sul tavolo proietta geometria, scia e punto di arrivo;
le superfici si coprono correttamente anche puntando i supporti laterali.
Il corpo mantiene il lato superiore verso l'alto e cambia dimensione con la
profondità. Il naso della testata, non il centro della figura, tocca il bersaglio.
Il renderer interpola 24 viste fisiche Cycles per rarità dello stesso modello:
due estremità, tre azimut (-24°, 0°, +24°) e quattro elevazioni (28°, 42°, 56°,
70°). Questo conserva riflessi, incassi e ombre anche senza WebGL. La camera
seleziona le viste durante il volo e ancora il naso al bersaglio; non ruota
un'unica immagine obliqua. La mesh CPU dello stesso modello resta disponibile
mentre si caricano gli atlanti. I render si ricostruiscono con
`node scripts/build-maglio-projectile-atlas.mjs` (Blender e Pillow richiesti).
Le prime tre varianti mantengono l'energia arancione; l'ultima aggiunge il
nucleo bianco-violetto. I dettagli devono restare visibili nella partita.

Il volo dura **1.400 ms** e l'impatto **950 ms**. La prospettiva riduce
gradualmente il proiettile che parte dal bordo basso e ingrandisce quello
che arriva dal bordo alto. La direzione della testata segue il bersaglio.
Il suono d'impatto e la reazione dello scafo iniziano all'arrivo. La durata
della risoluzione comprende tutte le carte mostrate e l'ultimo impatto,
anche con tre carte selezionate e due Armi già in campo: i 30 secondi del
turno successivo iniziano dopo questa sequenza.


## Correzione testata e ingombro — 24 novembre

La vecchia testata a quattro barre sembrava una grande cornice quadrata
vuota ed è stata rifiutata. Il Maglio usa otto piastre compatte attorno
al pistone metallico frontale. La scala fisica in partita è 0,48 rispetto
al modello artistico precedente, con ugello e scia ridotti nella stessa
proporzione. Non ridurre soltanto il bitmap: anche la distanza fra centro
e naso segue la scala, così la testata arriva esattamente al bersaglio.
Restano volo 1.400 ms, impatto 950 ms, viste A da dietro e B frontale.
La carta ingrandita prima dello sparo non era l’oggetto della correzione.
