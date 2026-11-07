# Eclissi Stellare — documento di trasferimento per ChatGPT Work

> **Stato aggiornato — 7 novembre 2026:** la sola interfaccia di gioco è la plancia 3D in `src/MathDuelBattle.jsx`; le cinque carte speciali e i due mazzi sono stati portati sulla plancia, senza cambiare navi, armi o arena originale. Le schermate `TacticalDuelPrototype.jsx/.css` e l'accesso `?tacticalPreview=1` sono stati rimossi; i motori tattici non ancora integrati restano conservati come codice da migrare. Le sezioni storiche sotto descrivono test precedenti, NON una seconda modalità disponibile.
**Versione:** bozza operativa, 7 novembre 2026. **Repository:** `marcoteghini1988-ai/test7`, ramo `main`.  
**Stato:** progettazione in corso; NON considerare questa bozza un ordine di eseguire immediatamente tutte le modifiche. Da aggiornare al termine della progettazione e dopo la consegna di ogni asset PNG.

## Obiettivo della consegna a Work
Una volta terminata la progettazione e aggiunti gli asset, ChatGPT Work dovrà aprire il repository, leggere **prima** questo documento e la roadmap collegata, verificare graficamente e funzionalmente il gioco su un'anteprima eseguibile, correggere posizionamenti/asset/interfaccia, eseguire test e compilazione e riportare cosa è stato controllato. **Non dedurre che il solo caricamento del file avvii automaticamente il lavoro:** è necessario dare a Work un incarico esplicito e autorizzargli l'accesso al repository, se richiesto.

## Riferimenti obbligatori
- `docs/ROADMAP_DUELLO_TATTICO_SIMULTANEO_2026-11-07.md`: regole del nuovo combattimento, stato verificato del sandbox e lavori aperti.
- `docs/PUNTO_31_PASSIVE_MAZZI_BOSS.md`, `src/bossNumericDecks.js`: **12 mazzi numerici boss, 23 abilità passive**, fino a 1/2/3 abilità per mazzo, tre gradi ciascuna. I mazzi NON sono le carte Personaggio Boss.
- `src/newCombat/phase16DBosses.js`: dodici identità e abilità dei boss nel vecchio combattimento.
- `src/MathDuelBattle.jsx`, `src/MathDuelBattle.css`, `src/ShipPresentation.jsx`: un'unica plancia 3D ufficiale. `src/simultaneousDuelEngine.js`: meccaniche tattiche da integrare; la vecchia UI separata e `?tacticalPreview=1` sono stati rimossi.
- `src/newCombat/phase16BCombat.js`: Dadi Quantici, Numero Bomba, Malus, Carta Dorata nel codice storico.
- `src/newCombat/phase16FModules.js`: equipaggiamenti/moduli che accumulano carica e si attivano.
- `src/newCombat/phase16CEpics.js`, `src/newCombat/phase15LegacyPassives.js`, `src/vulnerabilityRift.js`: Epici, reliquie, effetti del terreno e altri sistemi preesistenti.
- `src/phase1FleetCatalog.js`: 17 navicelle e 42 armi; preservare dati e ID esistenti.
- Asset/reference artistico obbligatorio: arena spaziale metallica 3D in prospettiva e formato 9:16, grandi navicelle con armi/motori integrati. Cercare prima nel progetto l'immagine `RIFERIMENTO_VISIVO_OBBLIGATORIO_PLANCIA_3D.png`; se non è presente, richiederla nel task di Work. **Non ripristinare la griglia azzurra né il layout a cinque carte in mano.**

## Regole progettuali già approvate
1. **Due mazzi distinti**: numerico (7 carte in mano) e speciale (mazzo da 24, 5 in mano); preparazione simultanea dei due giocatori in 30 secondi e risoluzione visiva in 8 secondi.
2. **Mazzi numerici boss ≠ personaggi boss.** I 12 mazzi con le 23 passive sono un sistema proprio; gli eventuali personaggi sono carte separate, sbloccabili dopo aver sconfitto un boss.
3. **Carte Personaggio**: entrano nel mazzo speciale, restano attive per un numero limitato di cicli, un solo personaggio attivo per volta. I personaggi boss sono ricompense speciali con versioni bilanciate delle abilità dei boss. Conservarne collezione, rarità e livelli.
4. **Carte Terreno per PvP**: si giocano dal mazzo speciale, cambiano lo sfondo/ambiente visibile e modificano temporaneamente vantaggi e svantaggi. Nei combattimenti boss della campagna l'arena è imposta dal boss e **non può essere modificata**: le carte Terreno in mano/mazzo non sono attivabili. Distinguere dalle arene normali dei livelli planetari.
5. **Miglioramenti da progettare e convertire**: 12 reliquie originali (verificare il catalogo prima di assumere numero definitivo), oggetti epici, Dadi Quantici, moduli/equipaggiamenti con ricarica, Barra Malus, Faglia di Vulnerabilità, Carte Dorate e Numero Bomba. Non convertirli automaticamente senza ricostruire dipendenze, costi, protezioni e salvataggi.
6. **Carta Numero Bomba proposta**: dal mazzo speciale può rendere 'bomba' una carta/numero dell'avversario. Precisare in progettazione selezione, visibilità, durata, disinnesco e reazioni; NON confonderla con la vecchia bomba automatica del banco.
7. **Carta Dorata**: conservare l'identità della vecchia meccanica e progettare come attivarla con il nuovo duello; verificare gli effetti per seme, la scadenza e le regole di pesca prima di convertirla.
8. **Passive dei boss**: conservare identità, condizioni e progressione dei 12 mazzi/23 abilità; adattare al duello simultaneo senza danno gratuito o violazione delle firme matematiche.
9. **Salvataggi e modalità esistenti**: preservare ID, collezione e progressione; il sandbox non è il PvP online ufficiale. Non sostituire la campagna finché il nuovo sistema non è collaudato.

## Piano degli asset grafici PNG
**Decisione artistica:** illustrazioni e elementi grafici del gioco oggi disegnati programmaticamente o come segnaposto vanno sostituiti, quando appropriato, con **PNG definitivi** creati in questa conversazione. Includere anche le immagini dei **12 mazzi boss** separatamente dai personaggi boss, carte personaggio comuni/rare/epiche/leggendarie, carte Personaggio Boss, carte Terreno, carte speciali, equipaggiamenti/epici, nave, armamenti e ambienti. L'elenco esatto dei file e degli ID rimane da produrre durante la progettazione; NON inventare che i PNG siano già stati generati.

**Distinzione tecnica importante:** rasterizzare le **illustrazioni** e gli asset disegnati, non trasformare in un unico PNG gli elementi interattivi (testi locali, barre HP, timer, bersagli, pulsanti, accessibility labels): questi devono rimanere React/HTML/CSS per funzionare e adattarsi agli schermi. Preferire PNG trasparenti per figure, navi, oggetti e illustrazioni delle carte; fondali separati per arene. Verificare leggibilità, risoluzione, proporzioni, orientamenti e caricamento senza errori 404. Mantenere gli ID originali e collegare le immagini senza alterare il bilanciamento.

**Registro asset da completare:** per ogni PNG registrare: elemento/ID ufficiale, tipo (mazzo/personaggio/nave/arma/terreno/speciale/equipaggiamento/sfondo), file sorgente di oggi, nuovo percorso PNG, formato/dimensioni, trasparenza sì/no, stato di approvazione, punti della UI in cui compare, test visivo effettuato. Nessun asset va segnato completato prima che il file esista nel repository e sia visibile nel gioco.

## Checklist di collaudo Work (quando incaricato)
- [ ] Leggere la roadmap aggiornata, questo file e ogni scheda di immagine prima di cambiare componenti.
- [ ] Aprire l'app di `test7/main` e confrontare i principali schermi con i riferimenti artistici forniti.
- [ ] Controllare formato verticale **9:16**, area sicura mobile, mani 7 numeriche + 5 speciali, pulsanti sempre cliccabili, nessuna sovrapposizione tra navicelle e carte.
- [ ] Verificare tutte le immagini PNG approvate: nessuna rotta sbagliata, proporzioni o versioni scambiate, illustrazioni dei mazzi diverse dalle carte personaggio, nessun segnaposto grafico rimasto dove previsto un PNG.
- [ ] Testare sandbox `?tacticalPreview=1`: 30 s preparazione simultanea, 8 s playback, entrambe le flotte, attacchi/firme, scudiere/fusioni, carte ed effetti; non attribuire funzionalità implementate a voci ancora in scaletta.
- [ ] Verificare le restrizioni delle Carte Terreno nei boss e la resa dello sfondo nel PvP, **solo dopo che saranno state implementate**.
- [ ] Verificare sblocco e funzionamento delle Carte Personaggio Boss **solo dopo l'implementazione**.
- [ ] Fare controlli di responsive su Android/schermo pieghevole e desktop, testare asset e interazioni con screenshot.
- [ ] Eseguire test logici, build/preflight secondo `package.json` e, se configurata, GitHub Actions; segnalare esiti e fallimenti senza dichiarare verifiche mai eseguite.
- [ ] Correggere nel solo repository `test7/main` (nessuna copia superflua); per cambi che toccano dati, progressione o intere modalità, documentare e testare la migrazione.
- [ ] Aggiornare il rapporto di collaudo con schermate, file toccati, errori risolti, questioni aperte e commit.

## Ordine delle fasi
A. **ORA:** completare progettazione, regole e inventario delle meccaniche storiche; poi realizzare e approvare i PNG in questa conversazione.  
B. **DOPO:** integrare gli asset PNG nel progetto con file e mapping verificati.  
C. **ALLA CONSEGNA A WORK:** fornire link a questo file, verificare accesso GitHub e chiedere esplicitamente revisione visiva/funzionale secondo la checklist.  
D. **ALLA FINE:** aggiornare questo documento con stato reale, riferimenti precisi agli asset e problemi residui.

## Testo breve da inviare a Work al termine
> Apri il repository GitHub `marcoteghini1988-ai/test7`, ramo `main`. Leggi per primo `docs/WORK_HANDOFF_CONTROLLO_VISIVO_ECLISSI_STELLARE.md` e `docs/ROADMAP_DUELLO_TATTICO_SIMULTANEO_2026-11-07.md`. Segui la checklist, usa esclusivamente gli asset PNG approvati, esegui il confronto visivo e i test funzionali sull'app, correggi gli errori direttamente in `test7/main` senza creare copie. Riporta prove, file modificati, test e aspetti da rivedere. Se manca il riferimento artistico richiesto, segnalalo prima di cambiare il layout.

_Questo documento è una bozza controllata. Le voci progettuali non significano codice già implementato o immagini già prodotte._
