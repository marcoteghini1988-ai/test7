# Metallo, terzo gruppo — sei anteprime e progetto degli effetti

Stato aggiornato dopo la conferma dell’utente: sei fronti approvati e
sequenze implementate. Collaudo visivo StackBlitz in corso. I paragrafi
seguenti conservano il progetto letto prima dell’implementazione; non
introducono nuovi valori o nuove regole. Base meccanica:
`test7/main` a `b4596f6be804fe780b28c96098535e06c04f9a2b`.

| Carta | Rarità | Danno nominale | Durata propria |
| --- | --- | --- | --- |
| Frantumatore a Induzione | Leggendaria | 54 HP | 1 turno |
| Perforatore a Cascata | Epica | 65 HP | 3 turni |
| Perforatore a Cascata | Leggendaria | 91 HP | 3 turni |
| Artiglieria delle Schegge Erranti | Rara | 20 HP | 2 turni |
| Artiglieria delle Schegge Erranti | Epica | 48 HP | 2 turni |
| Artiglieria delle Schegge Erranti | Leggendaria | 67 HP | 2 turni |

I numeri vengono da `WEAPON_NEAR_FINAL_BY_ID`; i danni della singola partita
restano quelli risolti dal motore con affinità, Terreni, Difese e protezioni.
Non sono nuovi bilanciamenti. Ogni variante ha la propria illustrazione;
le evoluzioni mantengono i componenti precedenti e aggiungono parti fisiche.

## Frantumatore a Induzione Leggendario

Fonti: `src/fleetNext/combat.js`, `resolveDesignedWeaponShots`, ramo
`induction`; `src/fleetNext/weaponRarityEvolutions.js` e relativa carta.
Un colpo, un bersaglio. Senza Energia si applicano le Difese ordinarie;
una carta Energia Metallo fisica permette il passaggio di una Difesa;
con due ne viene distrutta una attiva e pubblica quando il motore la trova.
L'Energia non viene consumata da questo bonus e la copertura dei supporti
resta valida. Lo smontaggio può avvenire anche con il fuoco bloccato:
mostrare in quel caso soltanto l'evento reale `weapon-break-defense`.

Illustrazione: conserva tre piastre d'argento, rame, tre bracci snodati,
due condensatori posteriori e l'innesto navale dell'Epica già approvata.
Aggiunge bordi diamantati, protezioni prismatiche sui bracci e un arco
articolato sulla scocca. Non aggiunge canne o un'altra scarica.

Effetto da implementare dopo conferma: carica sulle tre piastre e sulle
giunzioni reali del nuovo arco; un solo nucleo volumetrico coerente con la
carta, retro da A e fronte da B; rifrazioni nella scia e impatto sullo scafo
misurato. Il varco e la frattura della Difesa seguono esclusivamente i
rispettivi eventi. Le particelle prismatiche non infliggono danni.
Audio: tre toni di induzione convergono in un unico attacco secco, con coda
cristallina e suono distinto per blocco/smontaggio. Aptica: carica breve,
impulso di lancio e un impatto deciso; lo smontaggio ha un cue separato
soltanto se emesso, nel rispetto della preferenza del giocatore.

## Perforatore a Cascata, Epico e Leggendario

Fonti: `src/fleetNext/provisionalWeaponEngine.js`, ramo `cascade-piercer`,
`hitOnce` e aggiunta dei trasferimenti al piano di colpi. Un attacco iniziale
per ciascuno dei tre turni propri. Soltanto quando il bersaglio effettivo è
un supporto distrutto con danno eccedente positivo, il motore può aggiungere
un colpo al successivo bersaglio vivo non ancora usato, spendendo 1 Energia
Metallo per passaggio. Sono necessari sia l'eccedenza sia l'Energia. Può
continuare attraverso un secondo supporto alle stesse condizioni; quando
arriva alla madre non inventare un ulteriore rimbalzo. Nessun trasferimento
se il colpo è bloccato, non distrugge il supporto, non avanza danno, non c'è
un altro bersaglio o non si può pagare l'Energia.

Illustrazione Epica: tre anelli guida aperti, spina in grafite, placche
d'argento, camera del penetratore, circuito di ricircolo e innesto laterale
snodato. La Leggendaria conserva questi volumi e aggiunge rinforzi diamantati
attorno ai tre anelli, ponte prismatico e collettore posteriore.

Effetto da implementare dopo conferma: anelli in rotazione coordinata,
compressione del nucleo e un penetratore fisico al primo bersaglio. Se gli
eventi confermano un trasferimento, rendere leggibile il consumo di una
Energia Metallo e proseguire la scia residua dallo scafo distrutto al prossimo
bersaglio reale. Non ricreare tutta la potenza nominale nel passaggio e non
usare bersagli decorativi. L'Epica ha una scia elicoidale metallica; la
Leggendaria aggiunge rifrazioni e frammenti ottici del medesimo volume,
senza aumentare da sola il numero di impatti. Audio: rotazione degli anelli,
lancio profondo, contatto perforante e breve aggancio di trasferimento per
ogni evento pagato. Aptica: carica progressiva, impatto singolo e impulso
breve ai soli trasferimenti reali. Le due direzioni conservano prospettiva
e scala fisica, con lancio iniziale dal rispettivo bordo del dispositivo.

## Artiglieria delle Schegge Erranti, Rara/Epica/Leggendaria

Fonti: `src/fleetNext/provisionalWeaponEngine.js`, ramo
`wandering-shrapnel`, `opposite`, `ordinary` e aggiornamento
`previousTargetId` soltanto dopo danno positivo. Un colpo nel turno di posa
e uno nel turno proprio successivo; nel secondo cerca un bersaglio diverso
quando possibile. Protezioni e copertura possono modificare il destinatario
effettivo: animare sempre l'ID contenuto negli impatti risolti.
Questa è la famiglia Metallo, con questa meccanica; il nome non implica
danni ad area o la meccanica di una famiglia Ghiaccio omonima.

Illustrazione: cinque cassette sul ventaglio di alimentazione e un SOLO
carrello di lancio su guida a mezzaluna, con montaggio laterale snodato.
La Rara usa grafite e bronzo; l'Epica conserva questi componenti aggiungendo
struttura inferiore e gabbia di rinculo d'argento; la Leggendaria mantiene
anche tali parti e aggiunge il ponte di rinforzo e la guida prismatica.
Le cinque cassette sono munizioni del dispositivo e non cinque canne che
sparano insieme. Le evoluzioni non aggiungono colpi.

Effetto da implementare dopo conferma: indicizzazione di una cassetta,
rotazione del singolo carrello verso il bersaglio, rinculo e lancio di un
solo nucleo a scheggia per turno. Il secondo turno orienta di nuovo il
carrello verso l'ID reale, senza forzare un cambio che il motore non consente.
Rara: scheggia corazzata e tracciante bronzeo; Epica: collari d'argento e
frammenti superficiali estetici lungo la stessa traiettoria; Leggendaria:
guscio prismatico articolato e rifrazioni nella scia, con un solo impatto
HP per evento. Audio: scatto del selettore, motore del carrello, lancio e
impatto metallico distinti per rarità. Aptica: breve tick di selezione e
impulso al singolo contatto reale, più ricco nelle evoluzioni.

## Criteri per l'inserimento e il collaudo successivo

Dopo approvazione dei sei fronti: pubblicare PNG e codice soltanto in
`test7/main`, implementare le sequenze per gli ID esatti e provarle nella
plancia reale su StackBlitz con audio. Controllare A/B, slot 1/2, durata,
colpi bloccati, supporti vivi/distrutti, consumo di Energia e bersagli reali.
Per l'Induzione verificare 0/1/2 Energie e smontaggio senza sparo. Per la
Cascata provare nessuna eccedenza, nessuna Energia, uno e due trasferimenti.
Per le Schegge verificare entrambi i turni e il caso senza bersaglio diverso.
Niente rallentamento prima di impatti che richiedono forza; scafi, reattori,
luce, suono e vibrazione seguono lo stesso evento e vengono ripristinati.
Il riscontro fisico aptico richiede un telefono compatibile: il browser
senza riscontro non equivale a una vibrazione fisicamente collaudata.
