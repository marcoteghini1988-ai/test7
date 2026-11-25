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
Il volo delle Ganasce dura 1450 ms, quello induttivo 1350 ms; il Collassatore
arriva all’urto dopo 1800 ms e completa rilascio/rientro in altri 1650 ms.
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
