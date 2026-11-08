# Eclissi Stellare — Carte Terreno, Personaggi Boss e Difese: audit dell'8 novembre 2026

**Repository:** `marcoteghini1988-ai/test7` · **ramo:** `main` · **nessun nuovo sistema armi o redesign della plancia**.

## Obiettivo

Nel duello simultaneo da 30 s di preparazione + 8 s di risoluzione, le **Carte Terreno** modificano l'arena PvP globale per massimo due cicli, e le **Carte Personaggio Boss** e **Carte Modulo** sono carte realmente possedute, pescate fra cinque speciali e consumate dal mazzo di 24. Le armi delle navicelle sono componenti integrati, non Carte Modulo. Le verifiche si concentrano sui *danni e sulle riparazioni autentiche*, inclusa la simultaneità fra i giocatori.

## 1. Anomalia corretta: protezioni della barriera prima delle scudiere

Il motore calcolava Paratia Reattiva (`tactic-reactive`, assorbe 9), Schermo d'Urto (`tactic-impact`, riduzione del 20%) e Moduli Guardia come una sottrazione diretta al **pacchetto nativo in uscita dell'avversario**. Questo comportava che la Carta Barriera potesse alterare anche l'intercettazione delle scudiere, invece di proteggere i soli HP della **madre**. Inoltre una salva separata della scudiera autenticamente caricata poteva colpire la barriera senza beneficiare di queste protezioni.

Le funzioni `createTacticalBarrierGuard` e `consumeTacticalBarrierGuard` in `src/tacticalBarrierGuards.js` ora unificano il comportamento:

1. La salva nativa e, se esiste una munizione vera, la salva della scudiera vengono calcolate senza carte o proiettili extra.
2. Le scudiere del difensore assorbono una parte della salva **prima** del calcolo di protezione della madre, utilizzando i loro HP reali.
3. Sulla porzione che raggiunge la madre, un eventuale **Modulo Guardia** consuma fino all'esaurimento il proprio assorbimento per ciclo; la **Paratia** consuma **fino a 9 HP totali per ciclo**, fra tutte le salve che arrivano. Non viene ricaricata per ciascun colpo.
4. Lo **Schermo d'Urto** applica il −20% al pacchetto residuo sulla barriera in ogni impatto del ciclo, secondo il suo testo. Non riduce la capacità delle scudiere.
5. Il residuo attraversa i coefficienti difensivi reali già previsti dal motore: modificatori di boss, Personaggio Boss attivo (es. Corazza Gaia −15%), pilota, arena e **Terreno PvP** (Campo Detriti, Faglia Plasma, Tempesta Ionica, Camera Astrale). I danni vengono poi applicati una sola volta tramite `damageMotherShield`.

Il contatore di assorbimento è **temporaneo e locale a quel ciclo**: non modifica mazzi, proprietà, valute, tempi di preparazione o esposizioni in modo arbitrario. Il replay `src/tacticalCombatTimeline.js` riceve `guardAbsorbed` direttamente dal colpo autorevole e mostra **DIFESA N HP** sul relativo impatto nativo o da scudiera. Non aggiunge nessun impatto grafico fasullo.

## 2. Verifiche di combinazione con Terreni e boss

In `src/tacticalBarrierGuards.test.js` sono stati esaminati:

- Paratia + Guardia + Schermo d'Urto su più colpi: i due assorbimenti fissi sono consumati **una volta nel totale**, e il 20% è calcolato sul residuo.
- Salva nativa e scudiera carica: **l'intercettazione del difensore non cambia** per effetto della carta Paratia; i 9 HP di assorbimento non si duplicano fra le due salve.
- PvP con **Terreno Plasma giocato realmente**, **Carta Personaggio Gaia** e **Modulo Capricorno** insieme: l'arena si attiva globalmente per due cicli, le carte sono effettivamente consumate, il Modulo assorbe al massimo il suo quantitativo complessivo; restano sempre **52 numeriche / 7 in mano**, **24 speciali / 5 in mano**.
- **Carta Personaggio Idra** in Terreno Plasma: la penalità del 10% sulle riparazioni agisce prima dell'efficienza del Generatore. Idra ripara 3 HP con Generatore sano, 1 con generatore a metà, 0 con generatore distrutto. Nessuna riparazione gratuita o duplicata.
- Il replay riflette gli **stessi HP assorbiti** degli impatti del motore, senza alterare gli HP nel componente grafico.

## 3. Difese contro sabotaggi simultanei delle Carte Modulo

Le Carte Modulo originarie **Sagittario (Buffer Temporale)**, **Saturno (Crono)** e **Proxima b (Purificazione)** davano in precedenza soltanto `preventMalus=true`. Annullavano il Malus storico ma non il disturbo avversario delle nuove Carte Modulo (`lockWeapon`, `precisionFactor=.8`), per cui una carta dichiarata difensiva non difendeva da un sabotaggio equivalente nello stesso ciclo.

Ora, dopo aver letto **entrambi gli ordini simultanei**, la protezione e la Purificazione annullano, per il giocatore che le ha giocate, il Malus in arrivo e gli effetti ostili di blocco armi/precisione delle Carte Modulo. Non annullano i colpi reali, non impediscono di giocare il turno e non cancellano **le tre tacche Malus positive** già accumulate dal difensore.

Sono verificati sia A che B, con i Moduli **Vergine, Scorpione ed Eris** contro Sagittario/Saturno/Purificazione. Un test di integrazione PvP utilizza **Terreno Risonanza + Carta Barra Malus** contro Sagittario, assicurandosi che la carta Malus venga consumata, il campo comune rimanga attivo e la Sincronia/attacco difeso non subiscano penalità indebite. Nessuna carta viene regalata.

## 4. Descrizioni aggiornate delle 35 Carte Modulo

Il catalogo `src/newCombat/phase16FModules.js` e le vecchie abilità sono **rimasti intatti**. Le sole descrizioni nel nuovo mazzo speciale `src/tacticalEquipmentCards.js` ora spiegano gli effetti effettivamente realizzati dal motore simultaneo: mani da **sette** numeriche, Sincronia tattica invece di Etere spendibile, Dado pronto ma **lanciabile solo con una Carta Dado**, difese della barriera dopo l'intercettazione e nessun turno saltato. In particolare «mano max 9» e «Mano nemica ridotta» non sono più informazioni false sulle nuove Carte Modulo.

## 5. File e test

Nuovo:
- `src/tacticalBarrierGuards.js` — stato e consumo di protezioni per ciclo.
- `src/tacticalBarrierGuards.test.js` — assorbimenti, scudiere, Campo Plasma, Gaia, Capricorno, Idra, Malus, Risonanza e segnali di replay.

Aggiornati:
- `src/simultaneousDuelEngine.js` — consumo delle difese sulla madre, dopo intercettazione, in entrambe le salve; `guardAbsorbed` riportato nell'impatto reale.
- `src/tacticalEquipmentCards.js` e `src/tacticalEquipmentCards.test.js` — protezione reciproca Moduli vs Moduli/Malus e descrizioni.
- `src/tacticalCombatTimeline.js` — replay con assorbimenti reali, stessi slot.

La CI verifica `npm run verify:logic`, `npm run build` e `npm run preflight`. Sul commit `6b4f55b09bf7aafea7f0b319f93ad98167099497` [GitHub Actions 42476576303](https://github.com/marcoteghini1988-ai/test7/actions/runs/42476576303) ha superato **737 test**, build e preflight. Sono stati aggiunti dopo quel commit i soli segnali di replay e un test di corrispondenza, da confermare con l'ultima esecuzione CI.

## 6. Lavoro successivo

Rimangono il **collaudo visivo su Android 9:16**, la regolazione dei valori con partite complete, il completamento di illustrazioni ed effetti per le carte, l'audit delle rimanenti interazioni dei 12 boss e il PvP reale autorevole. I valori numerici descritti rimangono *provvisori*, non sono ricompense economiche, e non autorizzano un redesign della plancia approvata.
