# Eclissi Stellare — Punto 22: fusioni, difesa, cooperazione e scafi
Data: 6 novembre 2026

## Stato
**Integrazione nella versione ufficiale**: `main` del repository `marcoteghini1988-ai/test7`.
Su indicazione dell'utente, ogni miglioramento deve aggiornare direttamente `test7/main`. Non creare altri repository o copie di lavoro.

## Componenti collegati
- `src/fleetManeuvers.js`: tre formazioni, sincronia 0–100, fusione Barriera / Assalto, durata/cooldown, invalidazione al KO di motore o centralina, consumi reali scudo scudiera.
- `src/fleetManeuvers.test.js`: test per regole e casi limite; inclusi in `npm run test:combat`.
- `src/escortFiring.js`: scudiera agganciata esclusa **prima** dell'assegnazione delle carte, cariche accumulate preservate, bonus/offese adattati per ruolo e fusione.
- `src/mathDuelEngine.js`: stato manovre nelle flotte con una madre, intercettazione a impatto contro HP attuali, Sincronia attribuita su evento identificato.
- `src/MathDuelBattle.jsx`: pulsante MANOVRE, pannello di scelta formazione e fusioni, barra Sincronia, attivazione/scadenza e sgancio; l'IA sceglie una formazione e può usare la fusione. Gli eventi di lancio e impatto incrementano la Sincronia senza duplicazioni.
- `src/MathDuelBattle.css`: posizioni difensive/offensive, animazione d'aggancio e aura barriera; layout originale 9:16 e sette carte mantenuti.
- `public/assets/ship-shells/<ID>.svg`: **17 nuove silhouette vettoriali** uniche, dal disco della Eclisse al doppio scafo Falco e al corpo a manta. Renderizzate sovrapposte alla nave esistente per preservare alcuni dettagli delle 85 evoluzioni, salvo futuri adeguamenti artistici.
- `.github/workflows/test7-ci.yml`: verifica automatica test logici, build Vite/TypeScript e struttura.

## Regole provvisorie (bilanciamento da playtest)
- Formazione Equilibrata: bonus assenti.
- Formazione Guardia: +8 punti percentuali intercettazione/scudiera, limite totale 45% per scudiera; -15% attacco delle scudiere.
- Formazione Assalto: -8 punti percentuali intercettazione; +10% danni delle scudiere.
- Cambio formazione: 10 secondi di cooldown.
- Sincronia: +15 per calcolo valido; +10 per intercettazione con scudo consumato; +12 quando un attacco diretto danneggia uno scudo di scudiera.
- Fusione madre + una scudiera con scudo residuo: costa 100 Sincronia, 12 secondi, 28 secondi di cooldown. L'altra scudiera resta autonoma.
- Barriera: la scudiera agganciata può assorbire fino al 60% dei danni alla madre, limitati agli HP scudo effettivamente posseduti.
- Assalto: la madre ottiene +25% danni contro **lo scudo generale nemico**, non contro i vitali. La scudiera agganciata non spara in autonomia.
- Una fusione cessa se scudo scudiera = 0 o motore/centralina madre = 0. Gli HP non vengono ripristinati.
- La difesa e le firme matematiche/Poker delle parti vitali rimangono quelle del regolamento attuale: la fusione non sostituisce il calcolo finale.

## Compatibilità e differenze non ancora definitive
- 17 carte madri, 42 armi integrate, quattro rarità, cinque livelli, collezione, Bazar, Hangar e 34 asset delle scudiere non sono stati rimossi.
- **Aggiornamento 6 novembre:** la mano separata da 5 speciali è implementata, ma al momento soltanto due tipi di carte sono giocabili: Fusione Barriera e Fusione Assalto. La fusione richiede il consumo della carta; la mano si reintegra immediatamente. Il resto delle speciali va ancora definito.
- Le nuove silhouette sono **SVG con effetti di profondità**, non veri mesh 3D. I motori e i punti d'impatto sono ancora posizionati come nell'arena esistente e richiedono revisione specifica per forma.
- Fusioni fra scudiere e fusione tripla non sono incluse nel punto 22 iniziale.
- Verifica visiva su telefono e bilanciamento delle 17 madri L1–L5 devono seguire i test automatici.

## Avvio
```bash
npm ci
npm run verify:logic
npm run build
npm run preflight
npm run dev
```

## Download della versione completa
Aprire il repository `test7` sul ramo `main`, quindi selezionare **Code → Download ZIP**. Contiene gli asset originali del repository e tutte le nuove modifiche; non è la vecchia patch isolata.

## Criteri di accettazione
Le fusioni non generano HP, non riutilizzano carte già consumate, non sparano dalle scudiere agganciate, non cambiano le firme dei vitali e non bloccano gli attacchi contemporanei. Gli HP vengono calcolati quando arrivano i proiettili; i salvataggi storici non si perdono.

## Correzione del punto 23: fusioni via carte speciali
I comandi MANOVRE cambiano soltanto la formazione; non offrono più i pulsanti di fusione gratuita. Le carte Fusione Barriera e Fusione Assalto sono le uniche attivazioni delle fusioni per il giocatore e per l'IA. La Sincronia costituisce un requisito aggiuntivo. I nuovi test sono in `src/specialCards.test.js`. Per le altre decisioni e il rinvio audiovisivo: `docs/MASTER_DECISIONI_ECLISSI_STELLARE_2026-11-06.md`.

**Numerazione scaletta:** il mazzo speciale implementato ora è una correzione del punto 22 e prepara il punto 30; il punto 23 della master ufficiale è la collaborazione navicelle, documentata in `PUNTO_23_COLLABORAZIONE_NAVICELLE.md`.
