# Sei Armi Metallo — catene, collisioni e Induzione

Le sei immagini del secondo gruppo sono approvate dall’utente il 25/11/2026
(«confermate, procedi con gli effetti e mostrameli»), installate e collaudate
nella plancia ufficiale di test7 su StackBlitz. Nessuna meccanica o valore HP
è cambiato. I fronti restano i PNG RGBA approvati 3072×4608, con cornici e
simboli originali: i sei blob remoti corrispondono esattamente ai file locali.

| Famiglia | Varianti integrate | Sequenza visibile |
| --- | --- | --- |
| Arpioni a Ganasce Magnetiche | Rara, Epica, Leggendaria | Due ganasce volumetriche, chiusura sui bersagli realmente colpiti e maglie persistenti; collari argento e gabbia prismatica si aggiungono con la rarità. |
| Cannone Collassatore di Lega | Epica, Leggendaria | Trazione di due scafi veri fino a un unico urto; poli curvi nell’Epica, gabbia segmentata e rifrazioni nella Leggendaria; rilascio e ritorno esatto ai posti. |
| Frantumatore a Induzione | Epica | Tre piastre articolate, campo compresso, blocco sulla Difesa con zero Energie, varco con una e smontaggio pubblico con due quando emesso dal motore. |

La Leggendaria del Frantumatore resta fuori da questo gruppo.

## Riscontro con il motore

Le Ganasce sparano solo alla posa e conservano gli ID registrati dopo danni
positivi: nessuna nuova immobilizzazione, nessuna seconda raffica inventata.
Il Collassatore richiede l’aggancio nel turno proprio precedente e due bersagli
ancora vivi. Le due contabilizzazioni HP diventano una sola coreografia, un
solo suono d’urto e un solo impulso aptico, anche se una Difesa mitiga un colpo.
Le navi convergono davanti alla formazione, evitando di attraversare una madre
ferma, e conservano hovering, reattori e ombra durante il movimento. Barre HP
e slot non si spostano. Cleanup e fine animazione ripristinano la traslazione.

Il Frantumatore conta Energie Metallo fisiche senza consumarle. Un’Energia
supera una Difesa, non la copertura dei supporti. `weapon-break-defense` resta
separato dallo sparo: anche con fuoco bloccato può apparire lo smontaggio reale,
con zero proiettili e zero danni fittizi. La protezione che blocca il colpo ha
una reazione e un timbro propri.

Camera del tavolo fissa, volume con depth buffer e naso al punto di impatto:
A parte dal centro USB e mostra il retro, B dal centro alto e mostra il fronte.
Il volo delle Ganasce dura 1450 ms, quello induttivo 1350 ms. La revisione dinamica del Collassatore
arriva all’urto dopo 1000 ms e completa reazione/rientro in altri 1350 ms.
La risoluzione e il nuovo timer attendono tutti gli effetti realmente presentati.

## Audio, vibrazione e verifiche

Partiture distinte per famiglia/rarità: tamburi e chiusura delle ganasce,
tensione dei poli e urto, tre bobine e scarica induttiva. Le fasi seguono gli
stessi tempi del movimento e usano il bus SFX e il mute esistenti. La nuova
preferenza «Vibrazione» è nelle impostazioni e viene rispettata a ogni fase.
Nel browser sono stati osservati gli esiti `requested` e `muted`: una richiesta
accettata non verifica il riscontro fisico. La prova sul telefono resta aperta.
Riferimento API: https://www.w3.org/TR/vibration/.

- 2095/2095 test completi, build e preflight superati; anche le due workflow CI
  sulla base runtime `45a6cb105a29ea86f4302aecb4b177a486a56b9c` risultano verdi.
- Dopo la correzione dello spazio d’urto: 98 test dedicati e build superati.
- 34 osservazioni browser in `riferimenti-carte/metallo-lotto-2-2026-11-25/collaudo-stackblitz.json`.
- Tutte le sei carte: fronti 3072×4608, bordo CSS 0 px e sfondo trasparente.
- Registrati attacchi A/B per tutte le varianti, catene fra i turni, urto di
  due supporti e di supporto/madre, scadenza, distruzione e fuoco bloccato.
- Verificati zero/una/due Energie, evento di rottura senza colpo e mute aptico.

Video consegnato: `Metallo_catene_collisioni_induzione_in_battaglia.mp4`,
111,624 s, H.264 900×1600 e AAC 48 kHz, 21.510.647 byte. È la registrazione della
plancia reale con l’audio della scheda; sono rimosse soltanto le attese fra le
prove, senza accelerare le azioni. Audio presente in tutti e sette i segmenti
(RMS da −27,8 a −21,1 dBFS).
SHA256: `807f09c87c9cf9c9013b624a51c29c5e6d6bcc3510c519aca8a7e158d3ff9e4a`.

Sorgenti di presentazione: `chainWeaponBattleVisuals.js`,
`chainWeaponProjectile3D.js`, `chainWeaponCanvas.js`, `MagneticWeaponEffects.jsx`,
`chainWeaponSounds.js` e `weaponHaptics.js`, integrati nell’unica plancia
`OfficialFleetBattle3D.jsx`. I precedenti Maglio, Slitta e Recuperatore conservano
le proprie sequenze e i tempi approvati.

## Revisione richiesta dall'utente: un urto con più BOOM

Il precedente contatto era percepito come troppo morbido. Il Collassatore
ora genera un lampo breve, un nucleo incandescente multilobo, onde radenti
proiettate sul piano del tavolo, 46 scintille/schegge nell'Epica e 62 nella
Leggendaria, fumo in dissolvenza e un contraccolpo più netto dei due scafi.
La Leggendaria aggiunge frammenti prismatici. L'esplosione dura al massimo
1250 ms, dentro la finestra di rilascio già prevista, e nasce una sola volta
nel punto d'urto calcolato. Il nuovo renderer è `src/collisionExplosion.js`.

Il suono combina attacco metallico secco, corpo grave udibile sul telefono,
subgrave e coda di detriti, sul bus SFX esistente. L'impulso aptico d'urto è
più marcato, rispetta la preferenza e termina prima del cue di rilascio.
Il riscontro fisico su telefono resta da verificare. Danni, bersagli, combo,
numero di impatti, durata delle azioni e timer non sono stati modificati.
La modalità movimento ridotto conserva gli scafi fermi e attenua il lampo.

Collaudo della revisione sulla plancia reale in StackBlitz: Epica e
Leggendaria con due supporti, Leggendaria con madre e supporto, attacchi
A/B. Osservati punto d'urto, onda, traslazioni dei bersagli reali e cleanup;
nessun errore applicativo nella console. 98/98 test dedicati, build e preflight passati.
Osservazioni in `riferimenti-carte/metallo-lotto-2-2026-11-25/collaudo-urto-esplosivo.json`.

Nuovo video: `Collassatore_urto_esplosivo_prova_in_battaglia.mp4`, 38,316 s,
H.264 900×1600 a 30 fps, AAC mono 48 kHz, 7.354.796 byte. Registrazione della
plancia e dell'audio della scheda; sono tagliate soltanto le attese fra le
tre prove, senza cambiare velocità, aggiungere VFX o sostituire il suono.
Audio medio −20,3 dBFS.
SHA256: `3c9249e91037965d6af35f79169de7d3b5d8af3fedc0e4cf3ed0a59e818cdc5b`.


## Seconda revisione: strappo rapido e scafi animati

L'utente ha segnalato che il solo BOOM lasciava la grafica spenta e il
movimento troppo lento. La vecchia interpolazione rallentava prima del
contatto e traslava i contenitori senza inclinare gli scafi. La trazione
ora dura 1000 ms, con preparazione del corridoio davanti alla madre e
accelerazione negli ultimi 380 ms; non frena prima di colpire. La carica
è di 450 ms, la fase di reazione/rientro 1350 ms. Il rilascio inizia dopo
75 ms anziché mantenere gli scafi in posa per 230 ms.

I veri asset approvati della madre e dei supporti si inclinano e subiscono
torsione speculare e contraccolpo. I reattori aumentano estensione e ritmo,
lo scafo riflette il lampo e il nucleo esplosivo ha un fronte breve più
netto. Le scie compaiono dietro gli scafi nello strappo finale. Ombre sul
piano, barre e slot restano separati. Suono di tensione e risucchio sono
ritarati sul nuovo contatto; niente nuovi danni, colpi o bersagli.

Verifica sulla partita reale in StackBlitz: Epica e Leggendaria A/B con
due supporti, Leggendaria A/B con madre e supporto. Osservati matrici di
rotazione reali, luce riflessa, estensione dei reattori e bersagli del motore.
Al termine: traslazioni vuote, nessuna variabile transitoria residua e
hovering normale ripristinato su tutti gli scafi. Nessun errore applicativo.
100/100 test mirati, build e preflight superati. La prova della vibrazione
fisica sul telefono resta aperta.

Osservazioni: `riferimenti-carte/metallo-lotto-2-2026-11-25/collaudo-collisione-dinamica.json`.
La prova precedente dell'urto esplosivo rimane come cronologia ed è superata
da questa revisione del movimento.

Nuovo video: `Collassatore_schianto_rapido_navicelle_animate.mp4`, 29,898 s,
H.264 900×1600 a 30 fps e AAC mono 48 kHz, 6.846.438 byte.
Velocità nativa della partita; sono rimosse soltanto le attese fra le tre
prove, senza accelerare il video, aggiungere effetti o sostituire l'audio.
Audio medio −20,7 dBFS.
SHA256: `9a8f1f4087062acc6aac55fa0ff358185dac5ce386e4cf3cb6e09224e40920f0`.
