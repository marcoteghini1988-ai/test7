# Revisione dei 22 effetti già approvati — 25 novembre 2026

L'utente ha fermato le nuove carte e chiesto di tornare su tutti gli effetti
esistenti: troppo simili, piatti e privi di un tratto speciale. Questo lavoro
riguarda gli otto dispositivi e le 22 rarità già approvate. Non genera altre
carte e non modifica illustrazioni, plancia, valori o regole di combattimento.

## Sequenze

| Dispositivo | Rarità | Dinamica visiva |
| --- | --- | --- |
| Maglio | C/R/E/L | Pistone e pressione; orbite bronzee; pozzo gravitazionale; gabbia prismatica e implosione. Vapori trascinati dalla massa, detriti e contraccolpo pesante. |
| Slitta | C/R/E/L | Taglio e cono di pressione; doppia elica; tunnel di compressione; caustiche triangolari. Un dardo, scintille strette nell'asse del colpo. |
| Recuperatore | E/L | Tre flussi locali di conversione e capsula calda; condensatore e petali cristallini. Fumi con altezza e luce interna; intensità dal bonus nominale reale. |
| Ganasce | R/E/L | Verricello e chiusura meccanica; arco magnetico; gabbia cristallina. Trucioli e breve strappo dello scafo, senza esplosione generica. |
| Collassatore | E/L | Convergenza volumetrica prima della trazione; gabbia prismatica. Conserva lo schianto rapido già approvato e l'unico BOOM per la coppia. |
| Induzione | E/L | Tre piani metallici interferenti; staffa triangolare mobile con prismi. Frattura, vibrazione breve e luce intermittente; blocco e smontaggio Difesa restano distinti. |
| Cascata | E/L | Nucleo rotante con espulsione assiale; ponte prismatico attorno al residuo. Ogni trasferimento parte dal vero bersaglio precedente dopo contatto e pagamento. |
| Schegge Erranti | R/E/L | Frammento irregolare rotante; rinculo e scaglie; quattro facce cristalline e frattura asimmetrica. Una munizione per attivazione, non cinque spari. |

Le scie hanno sezioni nello spazio della camera del tavolo. Fumi con
ombreggiatura, luce sul piano, ombre e schegge balistiche occupano quote
diverse. I proiettili volumetrici approvati restano visibili fra due strati
di effetti; non vengono sostituiti da un'immagine ruotata. Le velocità
hanno curve specifiche per il materiale, monotone e con arrivo allo stesso
istante del suono d'impatto. Il Maglio conserva scala 0,48, volo 1400 ms,
impatto 950 ms e le 24 viste fisiche; il Collassatore conserva 450/1000/1350
ms e la propria animazione degli scafi.

Ogni famiglia ha ora una reazione direzionale dello scafo e dei reattori,
luce riflessa anche sugli scafi vicini senza attribuire loro un danno, e
pulizia delle proprietà transitorie. Movimento ridotto disattiva spostamenti,
rotazioni, scie e detriti; rimane una breve segnalazione luminosa attenuata.

## Suono e aptica

Il Maglio ha una nuova partitura di carica, pistone, vuoto e massa. Le altre
famiglie hanno code di volo coerenti: fischio della rotaia, conversione
termica, catena e verricello, interferenza, perforazione e frammenti. Le
sorgenti di rumore sono indipendenti per famiglia/fase/strato. I contatti
sono panoramizzati verso il bersaglio misurato, sul bus SFX e limiter
esistenti. Aggiunte le richieste aptiche mancanti di Maglio, Slitta e
Recuperatore; preferenze e visibilità continuano a essere rispettate.

## Verifiche e limite attuale

- 233 test mirati passati: i 159 precedenti, sette nuovi controlli e 67
  verifiche di geometrie, supporti e volo. I controlli coprono
  tutte le 22 varianti, entrambe le direzioni, proiezione, velocità,
  assenza di eventi inventati, contatto sulla Difesa, movimento ridotto,
  ritorno neutro e profili audio/aptici.
- Build di produzione e preflight eseguiti; verificare il rapporto corrente
  prima di considerare conclusa una successiva modifica.
- Lo studio offline usa le stesse funzioni di disegno, camera e geometrie
  del codice di gioco. Serve a controllare i fotogrammi del renderer;
  **non è una registrazione della partita o un collaudo StackBlitz**.
- StackBlitz restituisce `Could not clone repository`, seguito da
  `Workspace does not exist`. Una ricarica non ha risolto. Non sono state
  abilitate nuove autorizzazioni, creati progetti paralleli o modificati i
  permessi del repository. Il collaudo completo in partita, prestazioni
  su telefono e ascolto nel browser rimangono da eseguire quando la sessione
  del progetto torna operativa.
- La vibrazione fisica su telefono rimane da verificare. Una richiesta
  software accettata non prova il funzionamento del motore aptico.

Il precedente collaudo StackBlitz dei tre gruppi descrive la versione prima
di questa revisione: non costituisce una verifica automatica degli effetti
nuovi. Non dichiarare questa revisione «perfetta» o «collaudata in partita»
sulla sola base dei test o dello studio offline.
