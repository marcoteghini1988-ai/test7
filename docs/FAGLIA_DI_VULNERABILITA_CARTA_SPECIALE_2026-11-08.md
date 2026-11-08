# Eclissi Stellare — Carta Faglia di Vulnerabilità (8 novembre 2026)

## Decisione di design

La **Faglia di Vulnerabilità** è una **Carta Speciale autentica**, non un pulsante o un'abilità gratuita. Si inserisce nel mazzo di 24 carte speciali, compare nella mano da 5 e conta verso il massimo di 2 carte speciali impegnabili nello stesso ciclo. Le 7 numeriche su 52 restano in un mazzo separato. La plancia 3D originale 9:16, la madre centrale e le due scudiere non cambiano posizione.

### Effetto preciso

Giocando la carta **assieme a due o tre numeriche** e indicando uno dei quattro vitali avversari (motore, sistema armi, generatore scudi, centralina di comando), la **Faglia permette di colpire quel vitale anche se lo scudo madre è ancora chiuso**. Non serve abbattere o ridurre la barriera per rendere il vitale aggredibile.

Restano invariati:
- **Firma matematica/Poker autentica** del sistema scelto: se la formula è errata, il colpo fallisce e le carte sono comunque consumate.
- **Contromisure programmate** sul sistema scelto, in grado di respingere il colpo.
- **Intercettazioni delle scudiere e fusioni difensive**: usano soltanto HP reali, non sono annullate gratuitamente.
- **Conseguenze fisiche** del danno autentico a motore/armi/generatore/centralina, con le soglie di 10 HP già implementate nel nuovo motore.

Con la Faglia, **al massimo 5 HP di danno** raggiungono un vitale ancora protetto (parametro iniziale di bilanciamento); quindi un vitale 10/10 arriva al massimo a 5/10 con un unico colpo attraverso la protezione. Se il vitale è già esposto, l'attacco segue la normale disciplina degli HP e non riceve un bonus gratuito. Nessun colpo può incidere su un componente già distrutto.

La Faglia **non danneggia la barriera** né la disattiva, **non espone permanentemente il vitale** e **non rivela la sua firma**: questa va già conosciuta con la legittima Scansione, oppure scoperta attraverso la normale esposizione. Le armi native continuano il fuoco ordinario sullo scudo nello stesso ciclo, indipendentemente dalla carta; la Faglia non aggiunge un secondo colpo nativo.

### Limiti e acquisizione

- ID `tactic-vulnerability-rift`, famiglia `rift`, versione ufficiale iniziale: **0 copie nello starter**.
- Ottenibile nei **pacchetti speciali ordinari** con le regole di drop già esistenti; nessun regalo automatico a salvataggi vecchi.
- **Massimo una copia nel mazzo da 24**, e **un'attivazione per battaglia**; ripescarla dopo l'attivazione non autorizza un altro passaggio.
- L'attacco richiede l'ordine autentico, validato durante i 30 secondi di preparazione simultanea, e viene risolto nella sequenza degli 8 secondi di combattimento. L'IA utilizza la carta soltanto quando la possiede davvero in mano e conosce legittimamente la firma del bersaglio.
- Non accredita valute, Polvere, Etere, diamanti, ricompense boss o altre risorse persistenti.

### Distinzione dalla vecchia Faglia Poker

Il file storico `src/vulnerabilityRift.js` contiene una **ruota di benefici ponderati** (premi, blocco turni, potenziamenti, pesca ecc.). Questa logica **non viene importata** nel duello simultaneo, poiché la richiesta è una carta di **perforazione tattica temporanea** con un effetto chiaro e deterministico; non una fonte di premi o stordimenti gratuiti. Il vecchio codice rimane per compatibilità storica, senza scavalcare la regola della nuova Carta Speciale.

### Codice e test

- `src/tacticalVulnerabilityRift.js`: catalogo dell'azione, requisiti e limite danno 5 HP.
- `src/vitalDefense.js`: colpo al vitale protetto con **stessa firma e stessi HP** senza alterare l'esposizione permanente.
- `src/simultaneousDuelEngine.js`: validazione ordine, consumo della carta autentica, una sola attivazione, contromisure, danni e conseguenze, replay; equità A/B.
- `src/specialCards.js`, `src/specialDeckBuilder.js`, `src/pvpTerrainLoadout.js`: catalogo, una copia, pack ordinari, migrazione sicura `schemaVersion=1` e filtro legacy limitato alla battaglia.
- `src/OfficialBattle3D.jsx`, `src/tacticalDuelAi.js`, `src/tacticalCombatTimeline.js`, `src/battleFeedback.js`: selezione nelle cinque carte originali, IA senza visione di firme segrete, segnale Faglia sul colpo e nella cronologia.
- `src/tacticalVulnerabilityRift.test.js`: colpo attraverso scudo pieno, firma errata, zero danni senza carta, intercettazione e Contromisura, danno cap 5, niente esposizione permanente, una attivazione, due lati A/B, migrazione senza oggetti gratis, IA dopo Scansione, limiti 52/24.

**Verifica CI iniziale:** commit `c2d280079ccf4fbaa823d32a761ac09e09b0854f`, [GitHub Actions 42464634149](https://github.com/marcoteghini1988-ai/test7/actions/runs/42464634149), **694 test superati su 694, build e preflight superati**.

**Ancora da verificare:** bilanciamento 5 HP tramite partite reali, resa del segnale sul display Android 9:16, VFX definitivo del passaggio attraverso la barriera e PvP online effettivo. Non modificare senza richiesta le immagini e le posizioni della plancia approvata.
