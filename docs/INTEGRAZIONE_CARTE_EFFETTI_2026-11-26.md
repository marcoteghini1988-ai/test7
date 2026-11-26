# Carte ed effetti confermati — integrazione del 26 novembre 2026

L'utente ha confermato la consegna visiva con «ok» e ha chiesto se fosse
già nel gioco. Sono quindi collegati all'app **37 fronti completi e i loro
effetti**: 22 varianti Metallo e 15 Fulmine. Il successivo ordine di
completamento e le due risposte sulle regole chiudono anche le cinque
revisioni Ganasce A/B e il bonus Induzione.

| Famiglia | Varianti | Effetto inserito |
| --- | --- | --- |
| Maglio Ferrogravitazionale | Comune, Rara, Epica, Leggendaria | 2/3/5/7 magli in rotazione, impatti locali e reazione della scocca |
| Cannone a Slitta d'Acciaio | Tutte e quattro | Una palla sferica, grafite/bronzo/argento/prisma, impatto balistico |
| Artiglieria Termobalistica di Recupero | Epica, Leggendaria | 3 granate base, 6 solo con conversione reale degli HP persi |
| Ganascia A — Arpioni a Ganasce Magnetiche | Rara, Epica, Leggendaria | Una presa, tre turni, strappo finale +50%, combo unica con B |
| Ganascia B — Cannone Collassatore di Lega | Epica, Leggendaria | Una presa autonoma per tre turni; insieme ad A, due scafi in collisione oppure la sola nave contro il piano |
| Frantumatore a Induzione | Epica, Leggendaria | 3/6 lame, Difesa superata conservata oppure rimossa dal relativo effetto, Energie conteggiate e non spese; senza Difese +20% / +40%, senza cumulo |
| Perforatore a Cascata | Epica, Leggendaria | Residuo che parte dal relitto, soltanto con eccedenza reale e pagamento del trasferimento |
| Artiglieria delle Schegge Erranti | Rara, Epica, Leggendaria | 3/6/9 colpi, apertura e rotazione delle salve |
| Cannone a Pettine Ionico di Vega | Tutte e quattro | Cinque archi che convergono in una scarica |
| Lanciadardi a Spirale di Tesla | Tutte e quattro | Dardo tridimensionale con due scie elicoidali |
| Sferzatore Ionico di Rame Lunare | Tutte e quattro | Una frustata elettrica a zigzag |
| Cannone del Lampo Bianco | Rara, Epica, Leggendaria | Lampo bianco rapido e contatto elettrico |

## Collegamento effettivo

`MaglioBattleEffects` monta i renderer approvati nella scena di battaglia:
proiettili 3D, effetti sul piano e sulle scocche, audio e richieste aptiche.
Le origini variano lungo il bordo del giocatore o dell'avversario; i
trasferimenti partono dal bersaglio precedente. Il renderer usa soltanto
bersagli, danni e stato di distruzione emessi dal motore. La suddivisione
in munizioni conserva il danno totale e un solo controllo della Difesa
per attivazione. Una parata produce contatto sullo scudo, senza simulare
danni alla scocca. Il supporto realmente distrutto riceve una sola
esplosione conclusiva, un segnale sonoro e una richiesta aptica coordinati.

Il feedback Energia identifica le carte fisiche effettivamente coinvolte.
Il conteggio le mantiene; il pagamento mostra le sole cariche consumate,
con rimozione della carta soltanto se esaurita. L'effetto sulla Difesa è
collegato alla sorgente reale della protezione, senza rivelare trappole
ancora coperte. Audio, vibrazione e movimento rispettano le preferenze
già presenti nel gioco. La vibrazione hardware richiede verifica su
dispositivo compatibile e non è certificata dai test automatici.

## Fronti e conservazione grafica

Tutti i 37 fronti sono PNG RGBA **3072×4608**, con pannello Arma rosso
`#ff594c`. I vecchi sorgenti Metallo restano recuperabili. L'integrazione
mantiene i pixel fuori dal pannello, l'alfa, i testi protetti e i simboli.
Il registro `src/fleetNext/approvedWeaponIntegration.json` contiene ID,
destinazione, dimensioni e SHA-256 di ciascun fronte attivo. I sette pannelli aggiornati mantengono esattamente i pixel esterni dei rispettivi fronti approvati. I fronti
completi non ricevono più la vecchia sovrapposizione dei conteggi.

Le parti binarie in `asset-sources/weapon-fronts/approved-2026-11-26/`
consentono il ripristino esatto degli stessi PNG, anche in un checkout
nuovo. `restore-weapon-fronts.mjs` verifica ogni parte e il file ricomposto
prima della sostituzione atomica. Il processo di categoria conserva queste
revisioni approvate e materializza i PNG sul repository.

## Verifiche eseguite

- Build di produzione completata.
- `npm run preflight` superato, compreso il controllo degli identificatori dei renderer.
- Suite generale dopo il completamento: 2402 test superati, zero fallimenti.
- Cinque regressioni aggiuntive superate: hash/PNG attivi, 15 profili Fulmine
  con audio, contributi Energia, conservazione della Difesa superata,
  esplosione sonora unica sull'ultimo proiettile.
- Sette verifiche delle anteprime ripetute sul motore integrato: HP,
  ripartizione delle salve, Maglio/Slitta, Termobalistica 3/6, Difese,
  origini e trasferimenti a pagamento.

I test automatici non costituiscono una registrazione in StackBlitz. I tre
video della consegna precedente restano simulazioni offline e non vengono
presentati come riprese di una partita reale.

## Decisioni ancora aperte

- Le altre sei famiglie Fulmine richiedono riconciliazione tra nomi proposti
  e veri ID. Non considerare chiuso l'elemento Fulmine.
- Ripresa dopo «procediamo»: quinta famiglia reale, **Cannone a Nucleo di
  Folgore Crescente**, Rara/Epica/Leggendaria. Meccanica riletta e proposta
  ad anelli documentata in
  `FULMINE_05_NUCLEO_FOLGORE_CRESCENTE_2026-11-26.md`.
  L'associazione con il motivo Faraday e la sequenza dei tre stadi sono
  proposte da approvare, non asset già creati o nuove integrazioni.

Non introdurre valori sostitutivi né modificare bilanciamento o slot per
chiudere questi punti senza la decisione dell'utente.

## Regole confermate nel completamento

A e B durano entrambe tre turni propri e lanciano una sola ganascia.
La trazione di A infligge il danno base nei primi due turni, poi +50%
allo strappo del terzo; B mantiene il suo danno base per i tre turni.
Si possono giocare insieme o in turni diversi entro la durata degli
agganci. I due bersagli devono esistere davvero. Un aggancio bloccato
non diventa una presa valida e non autorizza il caso della sola madre
se altre navi sono ancora vive.

La collisione è un bonus distinto, una sola volta per le due istanze
di carta: conserva il danno provvisorio del Collassatore per ciascun
bersaglio unico. Con la sola nave il danno non si raddoppia. Dopo lo
schianto i ganci vengono rilasciati; eventuali turni autonomi rimanenti
non ripetono la combo. Entrambe le pose, le catene e l'audio si ripristinano.

L'Induzione sceglie una modalità prima di risolvere il colpo. Con Difese
attive usa le soglie di bypass/rimozione; senza Difese usa +20% con una
Energia e +40% con almeno due. Il bonus è limitato a due Energie fisiche,
non consuma carte e non si somma alla rimozione della stessa attivazione.
Un'arma bloccata non rimuove comunque una Difesa.

## Ripristino della copia StackBlitz

La copia salvata `https://stackblitz.com/edit/github-edu2s6xy?file=README.md`
si avvia e accede ai sorgenti canonici. È stata trovata su una versione
precedente e sincronizzata, senza creare un fork. Il nuovo sincronizzatore
verifica ogni hash Git prima delle scritture, conserva la configurazione
degli asset e mantiene un backup temporaneo dei sorgenti sostituiti.
Il foglio ufficiale dei simboli è lo stesso PNG, servito da
`public/assets/fleet-ui/category-symbols.png`, per evitare un duplicato
locale oltre il limite di caricamento della copia. Le tre regressioni
del sincronizzatore passano; build e preflight del gioco sono superati.
Le scritture del terminale non persistevano dopo il ricaricamento. È stato
quindi salvato tramite l'editor un `package.json` di avvio che installa le
dipendenze, richiama il sincronizzatore del commit verificato
`433d367c0c52908231a50375820240473349a892`, fissa gli asset allo stesso
commit e rigenera la pagina di collaudo. La procedura è riproducibile con
`node scripts/stackblitz-saved-package.mjs --ref=SHA_VERIFICATO`.

Dopo **Save e ricaricamento completo** sono stati osservati nell'editor:
repository canonico, commit corretto, 664 sorgenti, 412 aggiornamenti e
`applied: true`. Il selettore del gioco ricaricato contiene tutte le 37
varianti. B mostra una ganascia, tre turni e combo unica. Sono state
avviate nel WebContainer reale la collisione fra due supporti e lo
schianto della sola madre sul piano. Le letture DOM hanno rilevato
rispettivamente due bersagli e un bersaglio unico, con esplosione e
renderer tridimensionale `volume-depth-buffer`.

Dopo il ricaricamento è stata eseguita anche l'Induzione Epica con due
Energie e senza Difesa pubblica: salva tridimensionale di tre lame,
contributo `counted` di due carte fisiche e pila Energia conservata.
Le prove di calcolo verificano separatamente +20% / +40% e assenza di
cumulo con bypass/rimozione. L'audio è collegato; non si attesta ascolto
strumentale né vibrazione fisica del telefono. Non è stato prodotto un
nuovo video della sessione e le vecchie simulazioni rimangono tali.

Il servizio ha mostrato un errore nel salvataggio globale dei file scritti
dall'avvio; non va confuso con l'avvio salvato nell'editor, la cui
persistenza è stata verificata. Il repository resta la fonte canonica.
Dettagli: `docs/collaudi/ganasce-2026-11-26/stackblitz-verifica.json`.
