# Fulmine, famiglia 5 — Cannone a Nucleo di Folgore Crescente

Stato: **tre fronti e revisione scenica 2 approvati e collegati alla
partita; pubblicati su GitHub e collaudati su StackBlitz**.
L'utente ha approvato prima le carte («per le carte ok») e poi il colpo
scenico 2 («ok»). Le immagini sono identiche ai PNG approvati; nessuna
cornice, illustrazione, testo o trasparenza è stata ricostruita.
Il registro attivo passa da 37 a **40 varianti (22 Metallo + 18 Fulmine)**.
Il collaudo dal vivo e le prove isolate restano distinti.

## Identità e ruolo verificati

ID base: `weapon-designed-ionic-nucleo-folgore`. Elemento Fulmine (`ionic`).
Rarità attuali: Rara, Epica, Leggendaria; nessuna Comune da inventare.
È la quinta delle dieci famiglie reali, dopo il Cannone del Lampo Bianco.

L'Arma occupa uno slot per tre turni propri. Nel primo spara al danno
base senza chiedere Energia per questo specifico colpo. Nel secondo e
nel terzo occorre giocare una nuova Carta Energia Fulmine nel relativo
turno e spendere una carica per proseguire la supercarica. Le sole Energie
accumulate nei turni precedenti non soddisfano la condizione di nuova
Energia. Il conteggio delle nuove cariche e la spesa sono condivisi dalle
Armi che le richiedono: la medesima carica non alimenta due ricariche.

Se una ricarica manca o un turno necessario viene saltato, la progressione
si interrompe definitivamente per quell'istanza: l'Arma continua al danno
minimo fino a scadenza. Un'Energia giocata dopo non riattiva la crescita;
non consumarla soltanto per simulare una ricarica ormai impossibile.
Non aggiunge bersagli o colpi. Copertura, Difese e modificatori ordinari
continuano a valere; il danno reale può differire dal nominale.

| Rarità | Stadi del profilo RAW | Nominali della vista strategica corrente |
| --- | --- | --- |
| Rara | 24 / 36 / 54 | 24 / 36 / 54 |
| Epica | 34 / 50 / 76 | 58 / 85 / 129 |
| Leggendaria | 44 / 65 / 98 | 81 / 120 / 181 |

I valori sono quelli esistenti, ancora marcati provvisori nel profilo.
Non diventano nuove decisioni di bilanciamento per effetto della proposta.
Il cambio di rarità conserva durata, requisito e costo della ricarica.

Fonti: `provisionalWeaponProfiles.js`, `designedWeaponCards.js`,
`weaponRarityEvolutions.js`, `weaponBalanceCalibration.js` e ramo
`growing-thunder-core` in `provisionalWeaponEngine.js`.

## Associazione e disegno — direzione approvata

Nel parlato è già stato accettato il motivo degli anelli elettrici sotto
il nome «Torretta ad Anelli di Faraday». Quel nome non è una famiglia
codificata. Si propone di riutilizzare il motivo per il Nucleo reale,
adattandolo alle sue ricariche: l'utente ha approvato questa direzione con «ok».
Non sostituire nomi, ID o meccaniche con la descrizione del colpo singolo
senza Energia pronunciata nella vecchia proposta. Le altre proposte
Faraday/Volta/Maxwell/Kelvin/Hertz/Ampère/Franklin/Coulomb restano conservate.

Nell'illustrazione: apparato navale con nucleo sospeso fra semianelli
sfalsati e innesto laterale, senza ripetere un cannone lungo o quattro
piedi. Mostrare insieme dispositivo ed emissione elettrica ad anelli.
Rara: dettaglio fisico in bronzo; Epica: mantiene il disegno e aggiunge
un anello orientabile d'argento; Leggendaria: mantiene i precedenti e
aggiunge una gabbia prismatica. Questi dettagli non aggiungono abilità.
Usare le cornici ufficiali PNG HD, pannello Arma rosso e simboli ufficiali.

## Sequenza — direzione approvata; anteprima da confermare visivamente

Ogni lancio entra da punti variabili del bordo del lato che spara. La
macchina resta nella carta. Un nodo di folgore bianco-azzurra avvolto
da anelli elettrici raggiunge un bersaglio e produce un solo impatto.

1. Primo turno: nodo compatto, breve scia crepitante; contatto elettrico
   concentrato, scintille e reazione locale dello scafo.
2. Secondo, con ricarica riuscita: evidenziare la Carta Energia realmente
   coinvolta e il suo consumo; il nodo acquista una seconda corona
   rotante. Impatto più ramificato e sonorità di carica più tesa.
3. Terzo, con ricarica riuscita: nodo più denso, corone elettriche che
   collassano sul punto di contatto; lampo locale e detonazione elettrica
   decisa, conservando un solo colpo e il danno reale.
4. Ricarica interrotta: spegnimento progressivo delle corone sull'icona
   dell'Arma e suono discendente breve. I colpi rimasti usano la forma
   minima; niente spesa fittizia o successiva riaccensione della crescita.
5. Colpo bloccato: scarica sulla protezione e riscontro sulla vera carta
   Difesa; nessuna esplosione di danno inventata sulla nave.
6. Fine durata/interruzione: rimuovere i segni di carica e ripristinare
   pose, luci e audio persistente; seguire la destinazione reale della carta.

Audio: crepitio e tono crescente nelle ricariche reali, schiocco elettrico
al contatto, finale più profondo allo stadio massimo e breve scarica
discendente quando si perde la crescita. Aptica: impulso breve al consumo
reale, impulso di contatto distinto e più intenso ai livelli superiori;
nessun falso secondo impatto. La fine della carica usa un riscontro breve
distinto, rispettando preferenze e supporto del dispositivo.

Le rarità conservano le stesse regole, ma sviluppano filamenti, geometria
delle corone, timbro e riflessi propri. La potenza visiva deve seguire
anche lo stadio effettivo: una Leggendaria senza ricarica non deve
simulare lo stadio massimo. Scala e prospettiva devono lasciare leggibile
la nave, senza una testata enorme o un quadrato sul bersaglio.

## Realizzazione delle anteprime e verifica

Superata la regressione esistente «Nucleo: interruzione permanente anche
quando si gioca Energia in seguito» in `fleetNextProvisionalEdgeCases.test.js`.
Sono pronti tre fronti completi PNG RGBA **3072×4608**, composti sulle
cornici autentiche rosse Rara/Epica/Leggendaria con simboli corretti.
Le tre illustrazioni centrali originali sono **1536×1024**; non presentarle
come generazioni native a 3072×4608. L'Epica aggiunge l'anello fisico
d'argento; la Leggendaria mantiene bronzo e argento e aggiunge la gabbia
articolata prismatica. L'interno non duplica l'arma nello sfondo sfocato.
Il testo dei danni a tre stadi è allineato senza sovrapporsi all'icona.

Il controllo automatico delle immagini conferma tutti i pixel protetti
della cornice immutati e l'alfa esterna identica alle basi, compreso
l'antialias originale: nessun nuovo pixel o bordo esterno.

L'anteprima comprende HTML autonomo e **video di 68 secondi, 900×1600,
H.264 con AAC stereo a 48 kHz**. Sette sequenze mostrano le tre rarità,
ricarica interrotta, sole Energie precedenti, tiro dal lato avversario e
colpo bloccato: diciassette colpi calcolati dal motore, senza inventare HP,
consumi o bersagli. La scena utilizza arena e scafi originali e la
proiezione del tavolo per il nodo e le corone elettriche. Include la
reazione locale dello scafo, la carica sulle Energie realmente spese,
il blocco sulla protezione e la scadenza reale negli scarti.

**È una previsualizzazione isolata, non una registrazione StackBlitz.**
Audio e richieste aptiche condividono gli istanti della rappresentazione.
Audio misurato senza clipping: picco circa −8,29 dBFS; non si attesta
ascolto strumentale. La vibrazione fisica sul telefono non è verificata.
I collaudi precedenti delle 37 varianti non coprono questa nuova famiglia.

Verifiche superate: quattro test delle sequenze reali (crescita e costo,
rottura permanente e conservazione Energia tardiva, Difese/lati, unicità
e sincronia del contatto); `npm run preflight`; compilazione della pagina
interattiva e controllo sintattico del compositore storico. Nessun file
in `src/` né fronte giocabile è cambiato per preparare questa consegna.

Strumenti riproducibili in `scripts/previews/nucleo-20261126/`:
`prepare-cards.mjs`, `sequence.mjs`, `visuals.mjs`, `audio.mjs`,
`browser.mjs`, `export.mjs`, `verify-frames.py` e `sequence.test.mjs`.
Il compositore comune supporta ora Fulmine e valori su tre stadi,
conservando le impostazioni predefinite delle vecchie carte.

## Consegna recuperabile

Archivio `nucleo-folgore-carte-e-anteprima.zip`, 63.047.878 byte,
SHA-256 `e0af4f32caac92444c0eef53baa4b6c15ec109a25dafeda0af73fb5f45cd6439`.
Contiene i tre PNG HD, le tre illustrazioni originali, confronto visivo,
video con audio, HTML autonomo, scheda italiana, valori e verifiche.
I percorsi delle illustrazioni nel manifest sono relativi e portabili.
Il file è conservato come `libfile_1217e21ff8588191958c5883325b01ba`;
backing file corrente `file_000000002d5881f6936a50263e0857dc`, versione 1.
L'HTML rispetta anche la preferenza di movimento ridotto, conservando
gli istanti reali di audio e aptica.
Per recuperarlo usare i normali strumenti del servizio file e verificare
l'hash, senza inventare un nuovo soggetto o ricreare le cornici.

Le carte e il colpo scenico 2 sono confermati. La prima anteprima del
colpo rimane un riferimento storico superato; non richiedere ancora
approvazioni delle immagini o della revisione 2.
Conservare invariati il gruppo già integrato e la bozza futura Super Combo.

## Revisione scenica 2 — carte e colpo approvati

Richiesta dell'utente: «mi immaginavo il colpo un po piu scenico, per le
carte ok». È una conferma visiva dei tre fronti e una revisione del solo
effetto. Gli SHA-256 dei tre PNG sono stati confrontati con la precedente
verifica e sono identici. Non usare la richiesta per ridisegnare le carte.

La versione 2 dà volume al nodo con filamenti longitudinali e pelle di
scariche; le corone cambiano inclinazione e precessione, con segmenti
luminosi in rotazione e una scia a imbuto che si sfilaccia. La luce
dell'emissione si proietta sul piano. Negli ultimi istanti di volo le
corone si comprimono nello stesso nucleo e arrivano sul punto effettivo
del bersaglio, senza salto di quota fra proiettile e contatto.

All'arrivo: implosione breve, un unico sboccio elettrico con lobi di
plasma e corona di fulmini, fronte luminoso sul piano, scintille e
filamenti residui. Il vero scafo bersaglio reagisce con contraccolpo,
torsione e luce. Una Difesa riceve invece la distensione dell'elettricità
sulla protezione, senza simulare danni o rinculo sulla nave. Non muovere
la madre quando il bersaglio reale è un supporto. Il nuovo spettacolo
non aggiunge HP, colpi, bersagli, costi o stati persistenti.

L'audio aggiunge compressione crescente prima del contatto e uno sbocco
più corposo, con transiente elettrico, corpo basso e risonanza. Resta un
solo evento di impatto; l'aptica distingue compressione e contatto.
Gli stessi tempi controllano video, HTML, audio e piano aptico. Restano
rispettati mute, movimento ridotto e interruzione a pagina nascosta.
Non dichiarare collaudata la vibrazione fisica.

Consegna corrente, sempre **anteprima isolata e non ripresa StackBlitz**:

| File | Contenuto | Identificatore recuperabile |
| --- | --- | --- |
| `nucleo-folgore-colpo-massimo-v2.mp4` | Quattro secondi a velocità nativa, Leggendaria T3, con audio | `libfile_0ab2c40b5ff481918c6b0c240a90b4f5` |
| `nucleo-folgore-effetto-scenico-v2.mp4` | Trentasei secondi, i nove colpi dei tre cicli Rara/Epica/Leggendaria | `libfile_008f01ce1fa081918824185c0eea9c44` |
| `nucleo-folgore-anteprima-scenica-v2.html` | Tutti i sette casi e diciassette colpi, compresi blocco, Energie vecchie, interruzione e lato B | `libfile_50297eba1b408191a4eebc42bb300b8d` |

Entrambi i video sono 900×1600 con audio AAC stereo a 48 kHz. Il picco
misurato del video completo è circa −11,01 dBFS, senza clipping; non si
attesta ascolto strumentale. La clip di quattro secondi è estratta senza
alterarne la velocità. Le carte originali rimangono nell'archivio sopra;
il suo vecchio video rappresenta la versione 1 e non la revisione attuale.

Cinque test superati: i quattro controlli sulle sequenze reali più la
verifica del punto di partenza/arrivo e della compressione per A/B.
Compilazione dell'HTML e controllo sintattico superati. Nessun file di
partita in `src/` o asset giocabile è stato modificato per questa revisione.
**Approvazione del colpo scenico 2 ricevuta con «ok»; nessuna conferma pendente.**

## Collegamento alla partita

Renderer in `src/coreThunderRenderer.js`, partitura PCM condivisa in
`src/coreThunderAudio.js`, profilo per ID e rarità in
`src/coreThunderBattleVisuals.js`. I moduli dell'anteprima riesportano gli
stessi renderer: la partita non usa una nuova approssimazione del colpo.
Il tempo nativo è 880 ms preparazione, 1250 ms volo e 1150 ms contatto.
Le partenze variano sul bordo del proprio lato; arrivo e scarica seguono
il punto della nave misurato sulla plancia e la sua reazione reale.
Nessuna macchina Arma viene aggiunta al campo.

Gli eventi `weapon-provisional-shot` includono stadio reale, interruzione,
transizione di perdita e contributi delle Carte Energia prima della spesa.
Una carta con cariche residue resta nella pila. Nessuna ricarica è simulata
al primo turno, con sole Energie vecchie o dopo l'interruzione permanente.
La scadenza viene emessa solo quando il motore rimuove davvero l'istanza,
al successivo confine previsto; non subito dopo il terzo impatto.
`CoreThunderCardState` mostra interruzione e uscita della carta pubblica;
le proprietà temporanee vengono ripristinate. Protezione, mute, pagina
nascosta e movimento ridotto mantengono i controlli della partita.

Il collaudo ufficiale espone tutti i 40 fronti e, per il Nucleo, turni
1/2/3, Energia nuova, ricarica T2 saltata, sole Energie precedenti e Difesa.
I turni precedenti delle prove sono risolti dal motore, non iniettati come
stadi o danni inventati.

## Collaudo concluso nella partita StackBlitz

La copia esistente `https://stackblitz.com/edit/github-edu2s6xy` è aggiornata
e l'avvio dal commit nativo `f00344fecc1a947ef39473d11f1eab960e441d1e`
è stato verificato dopo riapertura completa: 690 sorgenti controllati,
438 aggiornamenti e 40 carte nel selettore. I PNG del Nucleo caricati dal
browser misurano davvero 3072×4608.

Osservati Rara T1 autonoma (23 HP effettivi nella fixture), Epica T2
ricaricata su un supporto (53 HP), Leggendaria T3 sulla madre anche nel
secondo slot (172 HP); ciascun caso ha un solo proiettile reale.
Le corone seguono lo stadio di carica, non il solo numero del turno.
Due casi Epica T2 senza Energia nuova mantengono lo stadio 1 e non
spendono cariche. La Leggendaria T3 bloccata dalla Difesa mantiene la
ricarica pagata ma produce zero HP, contatto sulla protezione e nessun
movimento dello scafo. Il tiro B parte dal proprio bordo superiore e
mostra il fronte del volume; nel caso osservato l'IA aveva perso la
crescita, quindi il nodo resta correttamente minimo. L'uscita della carta
A è stata osservata al confine reale dopo il terzo turno, con slot poi
vuoto e nessuna proprietà di rinculo residua.

Il contributo Energia nello slot A-5 identifica la vera carta fisica,
indice 0, una carica prima e zero dopo, scarto reale. Nessuna carta
Energia virtuale viene aggiunta dal renderer. I nominali rimangono quelli
della scheda: le differenze fra fixture dipendono da bersaglio e difese.

CI del commit `ed3489c7f103cc645d4ac163562d329946140f4c` superata:
preflight, intera verifica logica e build, run 45900846619. Chrome mobile
superato, run 45900846659. Il commit figlio materializza soltanto i tre
PNG nativi approvati e aggiorna la verifica dei fronti; i loro hash
corrispondono ai sorgenti. I test sui 40 PNG nativi passano anche dopo
il recupero del commit pubblicato. Il test di estrazione della UI include
ora la dipendenza reale degli ologrammi, conservando tutte le asserzioni.

Prova dal vivo recuperabile: `nucleo-leggendario-battaglia-stackblitz.mp4`,
`libfile_9b30d8b0817881919408edb698047603`, 277.952 byte, 474×842, 2,8 s.
È ricavata da venti catture del vero colpo nella scheda StackBlitz, con
intervalli temporali originali: circa 7,5 fotogrammi catturati al secondo,
non una misura del frame rate del gioco. Non include audio registrato e
non altera la velocità; l'audio approvato è integrato nella partita.
La vibrazione fisica e l'ascolto strumentale restano non verificati.
Dati dei casi in `docs/collaudi/nucleo-folgore-2026-11-26/verifica-stackblitz.json`.
