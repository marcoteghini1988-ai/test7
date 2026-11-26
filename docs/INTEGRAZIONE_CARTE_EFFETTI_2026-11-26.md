# Carte ed effetti confermati — integrazione del 26 novembre 2026

L'utente ha confermato la consegna visiva con «ok» e ha chiesto se fosse
già nel gioco. Sono quindi collegati all'app **32 fronti completi e i loro
effetti**, nelle parti con meccaniche definite: 17 varianti Metallo e 15
Fulmine. Le cinque revisioni Ganasce A/B restano in sospeso; le vecchie
Ganasce/Collassatore già giocabili non sono sostituite.

| Famiglia | Varianti | Effetto inserito |
| --- | --- | --- |
| Maglio Ferrogravitazionale | Comune, Rara, Epica, Leggendaria | 2/3/5/7 magli in rotazione, impatti locali e reazione della scocca |
| Cannone a Slitta d'Acciaio | Tutte e quattro | Una palla sferica, grafite/bronzo/argento/prisma, impatto balistico |
| Artiglieria Termobalistica di Recupero | Epica, Leggendaria | 3 granate base, 6 solo con conversione reale degli HP persi |
| Frantumatore a Induzione | Epica, Leggendaria | 3/6 lame, Difesa superata conservata oppure rimossa dal relativo effetto, Energie conteggiate e non spese |
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

Tutti i 32 fronti sono PNG RGBA **3072×4608**, con pannello Arma rosso
`#ff594c`. I vecchi sorgenti Metallo restano recuperabili. L'integrazione
mantiene i pixel fuori dal pannello, l'alfa, i testi protetti e i simboli.
Il registro `src/fleetNext/approvedWeaponIntegration.json` contiene ID,
destinazione, dimensioni e SHA-256 di ciascun fronte attivo. I fronti
completi non ricevono più la vecchia sovrapposizione dei conteggi.

Le parti binarie in `asset-sources/weapon-fronts/approved-2026-11-26/`
consentono il ripristino esatto degli stessi PNG, anche in un checkout
nuovo. `restore-weapon-fronts.mjs` verifica ogni parte e il file ricomposto
prima della sostituzione atomica. Il processo di categoria conserva queste
revisioni approvate e materializza i PNG sul repository.

## Verifiche eseguite

- Build di produzione completata.
- `npm run preflight` superato, compreso il controllo degli identificatori dei renderer.
- Suite generale: 2366 test superati, zero fallimenti.
- Cinque regressioni aggiuntive superate: hash/PNG attivi, 15 profili Fulmine
  con audio, contributi Energia, conservazione della Difesa superata,
  esplosione sonora unica sull'ultimo proiettile.
- Sette verifiche delle anteprime ripetute sul motore integrato: HP,
  ripartizione delle salve, Maglio/Slitta, Termobalistica 3/6, Difese,
  origini e trasferimenti a pagamento.

Questi controlli non costituiscono una registrazione in StackBlitz. I tre
video della consegna precedente restano simulazioni offline e non vengono
presentati come riprese di una partita reale.

## Decisioni ancora aperte

- Nuove Ganasce A/B: bersagli, durata e parametri dell'urto non definitivi.
- Frantumatore senza Difese: valore del bonus non deliberato.
- Le altre sei famiglie Fulmine richiedono riconciliazione tra nomi proposti
  e veri ID. Non considerare chiuso l'elemento Fulmine.

Non introdurre valori sostitutivi né modificare bilanciamento o slot per
chiudere questi punti senza la decisione dell'utente.
