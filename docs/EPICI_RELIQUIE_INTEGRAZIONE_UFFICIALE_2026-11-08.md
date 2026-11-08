# Eclissi Stellare — 12 reliquie e 6 carte Oggetto Epico nel mazzo ufficiale

**8 novembre 2026 · repository unico `marcoteghini1988-ai/test7` · ramo `main`.**

## Cosa è ora realmente integrato

I sei Oggetti Epici delle fusioni originali della Cripta sono **carte speciali temporanee** giocabili nel duello simultaneo. Nel mazzo rimangono **24 speciali**, con **5 in mano** e **massimo 2 attivate per ciclo**. Ogni carta Epica ha **una sola copia** possibile nel mazzo e **un solo utilizzo per battaglia**; si possono equipaggiare **massimo due Epici** complessivi, compatibilmente con i due slot storici.

Il motore degli effetti esisteva già in `tacticalEpicCards.js` e `tacticalEpicRuntime.js`. Il lavoro di questo intervento è la connessione **non distruttiva** con il salvataggio storico, la collezione speciale vera, il costruttore del mazzo, l'Hangar e l'ingresso del combattimento ufficiale. Nessuna carta Epica viene assegnata a un nuovo giocatore o estratta dai pacchetti generici.

### Associazioni ORIGINALI preservate

| Reliquie originali | Varco / Oggetto Epico | Durata attiva |
| --- | --- | --- |
| Terra `relic_p1` + Marte `relic_p2` | `epic_item_8` Calice di Drenaggio | 2 cicli |
| Venere `relic_p3` + Saturno `relic_p6` | `epic_item_6` Pendolo d'Entropia | 2 cicli |
| Urano `relic_p7` + Nettuno `relic_p8` | `epic_item_7` Monolite Dielettrico | 2 cicli |
| Plutone `relic_p9` + Europa `relic_p11` | `epic_item_9` Matrice di Probabilità | 1 ciclo |
| Proxima b `relic_p14` + Haumea `relic_p17` | `epic_item_1` Anello Bifasico di Möbius | 2 cicli |
| Io `relic_p19` + Encelado `relic_p20` | `epic_item_3` Astrolabio a Coordinate Libere | 2 cicli |

Le 12 reliquie sono **12 ID tra i 20 del catalogo della campagna storica**. Le sei coppie rimangono quelle di `PHASE16A_RIFTS`, senza cambiare pianeti, ricompense o costi.

### Lettura delle proprietà esistenti

`src/officialEpicOwnership.js` legge solo queste chiavi storiche:

- `eclissi_unlocked_relics`: reliquie guadagnate dopo una vittoria boss
- `eclissi_unlocked_rifts`: Varchi completati
- `eclissi_epic_inventory`: oggetti esplicitamente fusi e posseduti
- `eclissi_equipped_epic_items`: vecchi slot equipaggiati; **non è prova autonoma di possesso**
- `eclissi_level`: livello pilota storico

L'oggetto è considerato ottenuto quando l'inventario originale indica `unlocked:true`, **oppure** il Varco risulta completato e le due reliquie associate risultano ottenute. Le sole due reliquie **non forniscono automaticamente** la carta, che deve essere prima forgiata; i vecchi slot equipaggiati senza prova d'inventario/fusione non regalano carte.

`readSpecialCollection` proietta il possesso storico sulle speciali **in sola lettura**; `updateSpecialCollection` lo materializza in una **singola scrittura** sulla chiave `eclissi_special_collection_v1`, soltanto quando il giocatore compie una modifica ordinaria. Una successiva lettura non duplica le copie. Gli altri salvataggi (reliquie, Varchi, Epici, valute, pilotaggio) **non vengono scritti o sovrascritti** dalla migrazione. Gli Epici già acquisiti restano posseduti anche se lo stato legacy viene successivamente consultato in altro modo.

In presenza di JSON storico illeggibile l'operazione fallisce **senza modificare i salvataggi**.

### Limiti originali degli slot

- **0 slot** prima del livello pilota 20, salvo apertura anticipata tramite un Varco realmente completato
- **1 slot** dal livello 20 **oppure** dopo un Varco stabilizzato
- **2 slot** dal livello 60

L'Hangar disabilita il pulsante di aggiunta quando il limite è raggiunto. Anche il vero ingresso `officialBattleSetup` ricontrolla gli slot: non dipende soltanto dall'UI. Il nuovo duello usa i dati di progresso letti dallo stesso archivio storico; nessuna copia demo o bonus incondizionato è attribuito.

### Compatibilità dei vecchi combattimenti

`src/BossBattle3D.jsx` e l'adattatore `combatSpecialLoadout(...,'legacy')` **filtrano la nuova carta Epica temporanea** insieme ai Terreni e alla Mutazione non supportati dal motore storico, per quella sola partita. La carta viene rimpiazzata soltanto con **una copia già posseduta** di una speciale effettivamente giocabile; l'inventario e il mazzo persistenti non cambiano.

I vecchi moduli `phase16CEpics.js` rimangono nel motore Poker storico; il **nuovo** motore simultaneo non li legge per attivare bonus passivi. La sola presenza nell'Hangar non rende attivo un Epico. Il bonus parte solo dopo il **consumo della carta autentica** e termina secondo la durata programmata, senza creare nuove carte né duplicare gli effetti storici.

### Verifiche completate

- `src/officialEpicOwnership.test.js`: tutte le 12 reliquie/6 coppie, fusione autentica, storico senza inventario duplicato, vecchi slot senza proprietà, migrazione idempotente, protezione dei salvataggi corrotti, slot 0/1/2, effetto attivato nel duello e mazzo storico.
- Test precedenti `tacticalEpicCards.test.js`: Calice, Pendolo, Monolite, Matrice, Möbius, Astrolabio; durate, HP reali, carte numeriche e permessi.
- [Workflow GitHub Actions 42457460025](https://github.com/marcoteghini1988-ai/test7/actions/runs/42457460025) sul commit `1e4bf75eb86a79710e8aab5c82824da35f754be4`: **664/664 test riusciti**, build Vite/TypeScript e preflight superati. Eventuali commit successivi devono essere ricontrollati a loro volta.

**Limiti:** la progressione è attualmente locale e non una certificazione lato server contro manomissioni manuali; non attribuire premi PvP verificati senza backend. Il Calice mantiene la sua anteprima di Polvere simulata, **non** premi spendibili. Le percentuali e durate sono sperimentali. **Mancano** la verifica visiva sul Samsung/Android 9:16, gli asset Epici definitivi e un playtest reale su più partite.

## Prossima scaletta

Collezioni Epici, Personaggi Boss, Terreni PvP e Mutazione della Firma sono collegate al motore contemporaneo, con le limitazioni sopra. Rimangono da adattare: Dadi Quantici, Numero Bomba, Barra Malus e Carta Dorata; i Personaggi avanzati e l'audiovisivo di impatti e scudiere; test reali Android e PvP online vero. La plancia 3D e le posizioni delle 7 numeriche / 5 speciali non devono essere riprogettate.
