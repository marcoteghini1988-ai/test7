# Eclissi Stellare — regole degli effetti e ripresa del lavoro

Aggiornamento del **26 novembre 2026**, conversazione vocale. Salvataggio
chiesto dall'utente per recuperare in un'altra chat tutte le decisioni
sugli effetti e proseguire senza doverle spiegare nuovamente.

Repository unico: `marcoteghini1988-ai/test7`, ramo `main`.
Codice letto come base: `ff600528e2117f935eab340705f459decb868ebb`.

## 1. Stato reale: decisioni, implementazione e prove

Questo aggiornamento salva istruzioni e documentazione. **Non modifica
combattimento, renderer, illustrazioni o valori delle carte.** Le nuove
direttive sotto sono approvate come direzione da realizzare; la loro
presenza nel documento non significa che siano già eseguite in partita.

| Voce | Stato al momento del salvataggio |
| --- | --- |
| Otto Armi Metallo e 22 varianti già illustrate/inserite | Presenti nel catalogo e nel codice letto; riepilogo nella sezione 8. |
| Maglio Comune/Rara/Epica/Leggendaria nel codice di partenza | Conteggi precedenti: 1/3/6/9. |
| Nuova scelta per il solo Maglio | 2/3/5/7 martelli, partenze successive, rotazione e impatto di ciascuno: da implementare. |
| Slitta nel codice di partenza | Conteggi precedenti: 3/6/9/7; non ancora adeguati alla nuova scelta. |
| Nuova scelta per il solo Cannone a Slitta | Un'unica palla in tutte le rarità, con dettagli nei colori della rarità e possibili differenze dimensionali: da implementare. |
| Precisazione generale sul punto di partenza | Tutto il bordo inferiore per il giocatore, tutto il superiore per l'avversario: istruzione salvata, adeguamento e prova ancora necessari. |
| Nuovo collaudo della revisione richiesta in questa conversazione | Non eseguito. |
| Ultima revisione precedente degli effetti | Test e studi offline documentati; il nuovo collaudo StackBlitz risultava ancora da eseguire. Non è stata ricontrollata qui la disponibilità attuale del sito. |
| Vibrazione fisica sul telefono | Ancora da verificare su dispositivo compatibile. |

Non affermare di aver già cambiato i conteggi, ruotato i martelli nel gioco
o collaudato questa revisione. Quando il lavoro viene completato, aggiornare
questa tabella con versione e riscontro effettivamente osservati.

## 2. Come lavorare con l'utente, una carta alla volta

1. Leggere definizione corrente nel catalogo e risoluzione del motore.
2. Presentare **una carta alla volta**, con nome completo, rarità ed elemento.
3. Spiegare cosa fa davvero: bersagli, durata in turni propri, condizioni,
   costi, eventuali combo e differenze effettive fra rarità. Usare parole
   semplici, distinguendo la meccanica dall'animazione.
4. Lasciare che l'utente descriva l'effetto grafico. In questa conversazione
   ha corretto più volte la presentazione: voleva la carta e la sua funzione,
   non un nuovo elenco degli effetti che l'assistente aveva già assegnato.
5. Descrivere l'effetto attuale soltanto quando richiesto. Non trasformare
   una domanda sul nome o sul ruolo in un'approvazione di un nuovo effetto.
6. Ascoltare la descrizione fino alla fine: non interromperla ripetendo una
   domanda cui l'utente sta rispondendo. Una precisazione successiva modifica
   la stessa decisione, non apre un lavoro differente.
7. Dopo la scelta, realizzare e verificare l'inserimento autorizzato: grafica,
   suoni, aptica, testi/conteggi e codice coerenti. Non chiedere di nuovo
   approvazioni di routine per ciò che l'utente ha già deciso.

L'ordine è **carta → ruolo reale → direzione grafica dell'utente →
realizzazione e collaudo**. La sola approvazione dell'immagine non autorizza
a scegliere automaticamente un effetto arbitrario per tutte le armi.

## 3. Provenienza dei colpi: regola generale

La spiegazione dell'utente riguarda il telefono in verticale e le due
direzioni di combattimento.

| Espressione usata dall'utente | Significato da applicare |
| --- | --- |
| «Dalla porta USB del telefono» | Dal lato giocatore, lungo **tutto il bordo inferiore**. |
| «Da sopra», riferito all'avversario | Dal lato avversario, lungo **tutto il bordo superiore**. |

La porta USB era un riferimento al lato, non un unico punto centrale da
cui emettere tutte le munizioni. Usare punti differenti lungo il bordo
corretto; il chiarimento riguarda tutte le armi. Il ritmo e il numero dei
colpi, invece, dipendono dalla singola carta.

Conservare prospettiva e direzioni coerenti: il giocatore tira verso le
navi avversarie e l'avversario verso quelle del giocatore. Il punto
d'impatto viene misurato sul bersaglio effettivo. Un trasferimento previsto
dal motore, come quello del Perforatore a Cascata, riparte dalla nave
colpita: non va ricreato artificialmente sul bordo del telefono.

## 4. Maglio Ferrogravitazionale: scelta specifica dell'utente

### Carta e ruolo

Arma di elemento Metallo, disponibile nelle quattro rarità Comune, Rara,
Epica e Leggendaria, già inserite. La sua funzione è concentrare il danno
su una sola nave avversaria per un turno. Difese, copertura dei supporti
e modificatori applicabili rimangono quelli del motore.

Il numero di munizioni della nuova sequenza non aggiunge turni di durata
né nuovi bersagli. I danni totali delle varianti rimangono quelli della
carta e vanno letti dal catalogo corrente, non ricavati da vecchi ricordi.

### Numero di martelli per rarità — SOLO questa carta

| Rarità del Maglio | Martelli richiesti |
| --- | ---: |
| Comune | 2 |
| Rara | 3 |
| Epica | 5 |
| Leggendaria | 7 |

La proposta iniziale incompleta «tre martelli» è stata sostituita dalla
scelta esplicita di **due nella Comune** e poi 3/5/7 nelle altre rarità.
Il codice precedente 1/3/6/9 non è la direttiva attuale da seguire.

**L'utente ha precisato espressamente che questi numeri riguardano il
Maglio, non tutte le carte.** Non copiarli su Slitta, Recuperatore, Ganasce,
Induzione, Cascata, Schegge o armi future. Ogni carta avrà la propria
direzione scelta separatamente.

### Ritmo dei lanci

- Parte il primo martello; dopo un breve intervallo parte il secondo;
  seguono gli altri, in numero dipendente dalla rarità.
- Non partono tutti nello stesso istante.
- Non si aspetta che il primo abbia finito il volo e colpito prima di
  lanciare il secondo. L'utente ha rifiutato anche questa lettura.
- Deve vedersi una **serie di martelli in volo**, con partenze e arrivi
  distinguibili, invece di un solo blocco di munizioni.
- L'assistente ha usato «sovrapposizione»; l'utente l'ha interpretata come
  lancio simultaneo e l'ha corretta. Descrivere il ritmo come **uno dopo
  l'altro, con un breve intervallo fra le partenze**.
- L'intervallo esatto in millisecondi non è stato indicato. È un dettaglio
  da calibrare sulla leggibilità della sequenza, non un numero già approvato.

### Forma, rotazione e scia

L'utente ha osservato che l'immagine approvata sembra avere un martello
nella testa dell'apparato. La rappresentazione dei colpi deve mantenere
un legame riconoscibile con quella carta e mostrarli come **martelli**.

Ogni martello ruota mentre procede verso il bersaglio. Il corpo deve
cambiare orientamento in modo chiaramente leggibile, con volume e
prospettiva; non basta una sagoma immobile che trasla in linea retta o
una singola immagine piatta fatta girare. Si deve leggere la serie di
martelli e la relativa scia mentre si avvicinano alla nave.

L'asse preciso di rotazione, i giri al secondo, la curva esatta e i colori
aggiuntivi non sono stati fissati dall'utente. Non attribuirgli dettagli
di cui non ha parlato. Realizzare la direzione indicata usando come fonte
la carta approvata e verificandone il risultato visivo.

La discussione sul significato di «maglio» e «ferrogravitazionale» serviva
a chiarire il nome. La proposta dell'assistente di una massa accelerata
da un impulso gravitazionale non è un'abilità aggiuntiva approvata.

### Impatti e danno

Ogni martello deve arrivare sulla nave e avere un impatto visibile nel
proprio istante. Applicare la regola già richiesta: un semplice leggero
scossone non basta. Contatto, scintille/frammenti ed eventuale esplosione
coerente devono essere sincronizzati con la reazione dello scafo, l'audio
e la richiesta aptica.

I nuovi conteggi suddividono il danno totale esistente: non assegnare
l'intero danno della carta a ognuno dei 2/3/5/7 martelli. Il motore deve
emettere i pacchetti reali, conservarne la somma e rispettare bersaglio,
Difese, copertura e costi senza moltiplicarli per il numero di munizioni.

## 4 bis. Cannone a Slitta d'Acciaio: scelta successiva dell'utente

Arma Metallo con quattro versioni: Comune e tre evoluzioni, Rara, Epica e
Leggendaria. Danno concentrato su una sola nave, durata un turno; il danno
base è inferiore a quello del Maglio. Difese, copertura e modificatori
restano applicabili.

L'utente ha scelto **un solo colpo visibile: una palla di cannone**. Questa
scelta vale per tutte e quattro le rarità della Slitta; l'aumento di rarità
accresce il danno, senza aggiungere munizioni, bersagli o nuove abilità.

| Rarità della Slitta | Colpi visibili per attivazione | Dettagli visivi della rarità ufficiale |
| --- | ---: | --- |
| Comune | 1 palla | Grafite/grigio scuro. |
| Rara | 1 palla | Bronzo/sabbia bronzata. |
| Epica | 1 palla | Argento. |
| Leggendaria | 1 palla | Cristallo e riflessi prismatici della cornice approvata più recente. |

L'utente ha prima proposto di cambiare dimensioni o qualche dettaglio con
la rarità e poi ha indicato espressamente **i dettagli visivi del colore
della rarità**. Le finiture devono riprendere quelle ufficiali del
progetto: per la Leggendaria vale il riferimento prismatico approvato il
24/11, successivo alla vecchia palette oro. Non reinterpretare questi
colori come nuovi elementi della carta o nuove proprietà di combattimento.

Mantenere riconoscibile il corpo sferico metallico. Dimensioni e
rifiniture possono rendere leggibile la progressione, senza nascondere la
nave all'impatto; i fattori dimensionali esatti non sono stati fissati.
Non attribuire all'utente dettagli aggiuntivi che non ha scelto.

Le partenze seguono la regola generale dei bordi descritta sopra; ogni
attivazione produce un solo arrivo e un contatto coerente con il danno
reale. Suono e aptica devono seguire lo stesso unico contatto.

**Ambito:** questa è la direzione del solo Cannone a Slitta d'Acciaio.
Non ridurre a un colpo i martelli del Maglio e non applicare automaticamente
la palla, la sua finitura o il suo conteggio alle altre famiglie.

**Stato:** direzione documentata, animazione e conteggi ancora da adeguare.
Il catalogo precedente della Slitta usa 3/6/9/7 colpi: non presentarlo come
attuazione della nuova scelta 1/1/1/1.

## 5. Regole permanenti valide anche per le prossime carte

- **Coerenza con la meccanica:** prima leggere carta e motore; grafica,
  suono e vibrazione rappresentano eventi reali. Nessuna nuova Bruciatura,
  immobilizzazione, esplosione ad area o abilità viene introdotta dal renderer.
- **Identità dell'arma:** non assegnare a tutte lo stesso sparo variando
  soltanto colore o grandezza. Forma, movimento, ritmo e contatto devono
  seguire la singola carta e la direzione scelta dall'utente.
- **Rarità riconoscibili:** la sequenza può evolvere secondo la scelta
  specifica; non imporre a tutte le famiglie gli stessi conteggi o finali.
- **Volumi 3D:** mantenere vista frontale/posteriore, scala prospettica,
  parti articolate e occlusioni coerenti con la plancia. L'immagine della
  carta guida il modello, invece di un apparato generico non corrispondente.
- **Impatti evidenti e locali:** esplosioni o altri contatti riconoscibili
  sulla nave effettivamente colpita, commisurati allo scafo. Ogni colpo
  della serie ha il suo riscontro; la nave deve rimanere leggibile.
- **Reazione dello scafo:** rinculo, torsione e luce seguono lo stesso
  contatto. Non muovere barre, slot o plancia; ripristinare tutte le pose
  e proprietà transitorie alla conclusione o all'interruzione.
- **Blocchi reali:** una Difesa bloccante riceve il contatto sullo scudo,
  senza mostrare danni allo scafo. Un pacchetto con zero HP ha soltanto un
  contatto leggero. Un'azione non alimentata o disabilitata non produce
  una falsa esplosione di danno.
- **Audio e aptica:** carica, lancio, volo, impatto e rilascio usano gli
  stessi tempi. Rispettare volume, mute, preferenze del giocatore,
  visibilità della pagina e movimento ridotto.
- **Pulizia e timer:** finire la sequenza reale prima del rilascio del
  turno; eliminare pose e suoni transitori quando l'azione termina.
- **Prove sincere:** distinguere test logici, build, studio offline,
  collaudo visivo/acustico in partita e prova aptica fisica sul telefono.
  Non accelerare un video per simulare un movimento diverso e non usare
  il collaudo di una versione precedente come prova di quella nuova.

Le specifiche complete e i vincoli del Collassatore/Ganasce sono in
[REGOLE_PERMANENTI_EFFETTI_CARTE.md](REGOLE_PERMANENTI_EFFETTI_CARTE.md)
e in `AGENTS.md`. Nel dubbio su un dettaglio non ridiscusso, leggere le
decisioni specifiche della famiglia anziché trasferirle dal Maglio.

## 6. Immagini e progetto: vincoli da conservare

- Lavorare soltanto su `marcoteghini1988-ai/test7`, ramo `main`; non creare
  versioni parallele del gioco. StackBlitz è il riferimento richiesto
  per il collaudo della partita quando il workspace è operativo.
- Non cambiare plancia, meccaniche, valori o immagini approvate per
  realizzare questa revisione degli effetti.
- Per nuove carte seguire la procedura del progetto: catalogo e valori,
  cornice PNG HD originale, simboli ufficiali, composizione e controllo
  visivo, anteprima e approvazione prima dell'inserimento.
- Le quattro cornici sono riferimenti di rarità; categoria ed elemento
  devono usare simboli e alloggiamenti corretti. Conservare gli asset
  approvati; non inventare cornici o sostituire i PNG HD con WebP ridotti.
- Le Armi restano dispositivi futuristici modellabili in 3D. La scelta
  dei martelli come munizioni del Maglio non autorizza a ridisegnare la
  carta o a sostituire l'apparato navale con un'arma fantasy impugnata.

Riferimento: [PROCEDURA_OBBLIGATORIA_CREAZIONE_CARTE.md](PROCEDURA_OBBLIGATORIA_CREAZIONE_CARTE.md).

## 7. Da dove riprendere tecnicamente

1. Leggere questo documento e `AGENTS.md`, poi controllare il ramo `main`
   corrente. Il salvataggio documenta ciò che era presente nella base
   indicata; cambi successivi possono aver implementato parte del lavoro.
2. Verificare i profili del Maglio in
   `src/fleetNext/approvedWeaponSalvos.js`: al momento sono ancora 1/3/6/9.
3. Applicare 2/3/5/7 soltanto agli ID della famiglia
   `weapon-confirmed-metallic-maglio` e alle sue evoluzioni.
4. Adeguare anche i soli ID della famiglia `weapon-confirmed-metallic-slitta`
   a un colpo per tutte le rarità: una palla con dettagli nei colori della
   rarità ufficiale, come nella sezione 4 bis. Non trasferire i conteggi
   del Maglio alla Slitta né il colpo singolo della Slitta alle altre carte.
   Adeguare ritardi reali e testi/conteggi della carta, rotazione fisica,
   provenienza dai bordi, contatti, suoni e aptica. Le partenze dai bordi
   sono generali; il numero e il movimento dei martelli sono specifici.
5. Controllare anche `src/weaponKinematics.js`,
   `src/MaglioProjectileScene.jsx`, `src/maglioProjectile3D.js`,
   `src/maglioBattleVisuals.js`, `src/weaponCinematicRenderer.js`,
   `src/weaponHullImpacts.js`, audio e aptica.
6. Verificare conteggio, somma dei danni, tempi di partenza/arrivo,
   bersaglio reale e blocchi. Eseguire anche i controlli di collegamento
   React `weaponRendererBindings.test.js`; una sola build non basta.
7. Provare le quattro rarità nei due sensi A/B, contro madre e supporti,
   negli slot previsti e con Difese/blocchi; controllare le impostazioni
   di accessibilità e il ritorno al turno successivo. Presentare una prova
   visiva della revisione, dichiarando se è una partita o uno studio offline.
8. Salvare su `test7/main` e aggiornare lo stato effettivo. Poi proseguire
   con la prossima carta, una alla volta, lasciando all'utente la scelta
   del suo effetto. Nessuna altra carta ha ricevuto qui i numeri del Maglio.

## 8. Carte già presenti: indice per continuare

L'elenco fotografa le otto famiglie/22 varianti già realizzate, non una
nuova approvazione delle loro animazioni. Maglio e Cannone a Slitta sono stati
ridiscussi in questa conversazione; le loro nuove direzioni sono sopra.

| Famiglia | Rarità presenti | Ruolo reale in sintesi |
| --- | --- | --- |
| Maglio Ferrogravitazionale | Comune, Rara, Epica, Leggendaria | Danno concentrato su un bersaglio, un turno. Nuova direzione 2/3/5/7 descritta sopra. |
| Cannone a Slitta d'Acciaio | Comune, Rara, Epica, Leggendaria | Danno diretto su un bersaglio, un turno; base inferiore al Maglio. Nuova direzione: una palla per tutte le rarità con dettagli nei colori della rarità. |
| Artiglieria Termobalistica di Recupero | Epica, Leggendaria | Due turni; bonus dal 60% degli HP realmente persi dalla propria flotta dopo la posa, entro il massimo della variante. |
| Arpioni a Ganasce Magnetiche | Rara, Epica, Leggendaria | Due agganci reali nel turno di posa; preparano il Collassatore nel turno proprio successivo. |
| Cannone Collassatore di Lega | Epica, Leggendaria | Combo con Ganasce del turno proprio precedente e due bersagli agganciati ancora vivi; danni ai due bersagli, un solo urto visivo. |
| Frantumatore a Induzione | Epica, Leggendaria | Un turno; con 1 Energia Metallo supera una Difesa, con 2 ne rimuove anche una visibile. Le Energie del bonus non vengono consumate. |
| Perforatore a Cascata | Epica, Leggendaria | Tre turni; il danno eccedente di un supporto distrutto può passare al bersaglio successivo pagando una carica Energia Metallo per trasferimento. |
| Artiglieria delle Schegge Erranti Metallo | Rara, Epica, Leggendaria | Due turni, un bersaglio per attivazione; cerca di cambiarlo nel secondo turno. |

Dettagli della fotografia del codice e delle precedenti animazioni:
[RUOLI_ED_EFFETTI_CARTE_APPROVATE_2026-11-26.md](RUOLI_ED_EFFETTI_CARTE_APPROVATE_2026-11-26.md).
Le regole dettagliate vanno sempre confrontate con il motore corrente.

## 9. Precedenze per evitare di perdere le correzioni

Le indicazioni esplicite più recenti dell'utente prevalgono sulle
prescrizioni precedenti in conflitto. In particolare:

- Centro USB fisso: superato dalla provenienza variabile lungo tutto il
  bordo corretto. Non interpretare «USB» come un emettitore unico.
- Un solo colpo o 1/3/6/9 per il Maglio: superati, come direzione richiesta,
  dalla scelta specifica 2/3/5/7; il codice non è ancora stato adeguato.
- Lancio simultaneo: rifiutato. Attesa dell'intero viaggio precedente
  prima del lancio successivo: rifiutata. Vale la serie a brevi intervalli.
- Raffiche 3/6/9/7 del vecchio Cannone a Slitta: superate come direzione
  richiesta da un solo colpo sferico in tutte le rarità, con finiture nei
  colori della rarità ufficiale; il codice non è ancora stato adeguato.
- Numeri o coreografia del Maglio applicati a tutte le carte: rifiutati
  espressamente. L'utente sceglie carta per carta.
- Effetto inventato automaticamente dall'assistente dopo il solo fronte:
  superato dal nuovo ordine carta, ruolo, scelta dell'utente, realizzazione.

Per riprendere basta riferirsi a **«regole effetti e ripresa del 26 novembre
2026 in test7»** e leggere questo file, senza affidarsi soltanto alla memoria
della chat o a una vecchia registrazione.
