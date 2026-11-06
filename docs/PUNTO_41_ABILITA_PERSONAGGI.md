# Eclissi Stellare — Punto 41: abilità strategiche delle carte personaggio

**Stato:** implementazione logica del duello continuo per i 33 personaggi giocabili del catalogo; bilanciamento empirico e verifica GitHub Actions ancora da confermare. Repository unico `marcoteghini1988-ai/test7`, ramo `main`, nessuna copia o branch di sviluppo.

## Separazione vincolante dei sistemi

- **Una carta personaggio equipaggiata = un comandante per flotta**, contenuto in `side.commander`, con livello L1–L5 già posseduto. Non esistono comandanti separati per madre e scudiere.
- Le **33 carte personaggio** conservano gli ID originali e le loro immagini; niente duplicazione di inventario o nuova valuta.
- Le loro abilità del duello continuo sono definite *separatamente* dal vecchio motore Poker in `src/commanderAbilities.js`. Le descrizioni Poker classiche restano nelle modalità che ne fanno uso, ma non sono importate nelle nuove battaglie.
- I **12 mazzi numerici boss** del punto 31 restano un sistema indipendente dalle carte personaggio. Le **24 speciali**, le **7 numeriche** e i quattro vitali non vengono trasformati dal comandante.
- Nessuna passiva si attiva per il solo equipaggiamento, crea proiettili/HP/carte, altera bersagli matematici o permette fusioni senza carta.

## Regola generale, livelli e bilanciamento provvisorio

- Ogni comandante ha **una abilità strategica** con condizione precisa, grado L1–L5.
- L'abilità di attacco aumenta **solo il danno di proiettili autentici** in seguito a un calcolo valido e all'uso delle munizioni numeriche. Il valore del calcolo non è il danno.
- L'abilità di difesa riduce **solo il pacchetto arrivato alla madre**, dopo l'intercettazione delle scudiere. Non applica riduzioni alle scudiere o alle carte numeriche.
- Le progressioni iniziali in percentuale sono: comuni `2/3/4/5/6%`; altri comuni/rare/eroi boss intermedi `3/4/5/6/7%`; epiche/leggendarie `4/5/6/7/8%`; tre boss finali `4/6/8/10/12%`.
- **Limite complessivo per impatto:** +35% in attacco e riduzione massima 35% alla madre, **comprese** le passive del mazzo numerico boss del punto 31. È un cap di sicurezza provvisorio da misurare nei playtest, non il bilanciamento definitivo.
- La memoria del comandante si aggiorna **solo dopo danni realmente applicati**, non dopo anteprime, miss, zero danni o calcoli invalidi. Nessun timer obbligatorio reintrodotto.

## Catalogo: 33 comandanti, una condizione verificabile ciascuno

| Famiglia | Carta | Ruolo e condizione |
|---|---|---|
| Comuni | Cadetto Additivo | Attacco: addizione valida |
| Comuni | Calibratore Sottrattivo | Attacco: sottrazione valida |
| Comuni | Cannoniere Balistico | Attacco: moltiplicazione valida |
| Comuni | Cecchino Quantico | Attacco: divisione esatta |
| Eroi boss | Guardiano di Gaia | Difesa: primo impatto efficace sulla madre |
| Eroi boss | Colosso di Tharsis | Attacco: ripetere un vitale già colpito |
| Eroi boss | Matriarca Tossica | Attacco: nemico già corroso |
| Eroi boss | Arconte Solare | Attacco: tre numeriche contro un vitale |
| Eroi boss | Occhio del Vortice | Attacco: Impulso Ionico veramente giocato sulla scarica |
| Eroi boss | Crono il Distruttore | Attacco: primo colpo efficace dopo un riciclo numerico |
| Eroi boss | Sentinella Ionica | Difesa: madre sotto ionizzazione |
| Eroi boss | Leviatano Abissale | Difesa: scudo madre sopra metà |
| Eroi boss | Signore delle Ombre | Attacco: proprio scudo sotto 35% |
| Eroi boss | Colosso di Metano | Difesa: una scudiera già perduta |
| Eroi boss | Idra Criogenica | Attacco: alternanza del vitale colpito |
| Eroi boss | Titano d'Acciaio | Difesa: ultimo vitale superstite |
| Rare | Il Vendicatore | Attacco: almeno un proprio vitale danneggiato |
| Rare | L'Adrenalinico | Attacco: proprio scudo a 60% o meno |
| Rare | Il Baro | Attacco: tre numeriche con semi differenti |
| Rare | Il Collezionista di Specchi | Difesa: almeno due vitali propri danneggiati o KO |
| Epiche | L'Artificiere di Bordo | Attacco: vera speciale Perforante/Corrosione sulla scarica |
| Epiche | L'Alchimista Aurico | Attacco: due effetti speciali differenti sulla scarica |
| Epiche | Il Viaggiatore del Tempo | Attacco: vitale nemico non ancora colpito dal comandante |
| Epiche | Il Re del Ghiaccio | Difesa: proprio scudo madre a zero |
| Leggendarie | Il Gran Maestro | Attacco: operazione diversa dall'ultima andata a segno |
| Leggendarie | Il Veggente Supremo | Attacco: colpire una scudiera diversa dalla precedente |
| Leggendarie | Il Fissatore | Attacco: terzo colpo consecutivo sullo stesso vitale |
| Leggendarie | Il Lottatore di Sumo | Attacco: formula tripla con moltiplicazione o divisione |
| Leggendarie | L'Amante del Rosso | Attacco: due carte numeriche rosse nel calcolo valido |
| Leggendarie | L'Amante del Nero | Attacco: due carte numeriche nere nel calcolo valido |
| Boss finali | Entità della Discordia | Attacco: nemico con ionizzazione e corrosione attive insieme |
| Boss finali | Nucleo Magmatico | Attacco: ogni terzo colpo efficace alla madre |
| Boss finali | Sovrano del Vuoto | Attacco: tre vitali nemici già KO |

I nomi, le identità e gli ID delle carte personaggio preesistenti sono mantenuti. Le meccaniche delle nuove abilità non trasferiscono implicitamente malus e bonus del Poker precedente.

## Integrazione

- `src/commanderAbilities.js` — catalogo 33/33, condizioni, moltiplicatori e memoria di attacchi veri.
- `src/fleetCommander.js` — assegna solo ID presenti nel catalogo, sbloccati nel vecchio inventario, non NPC.
- `src/MathDuelBattle.jsx` — combina i moltiplicatori comandante/mazzo boss all'arrivo del proiettile per giocatore e IA e aggiorna la memoria dopo l'impatto. Il titolo del proprio HUD descrive l'abilità.
- `src/pilotsSystem.jsx` — l'Hangar mostra il ruolo del comandante per il duello continuo, con il bonus del livello selezionato, **separando** il testo legacy Poker.
- `src/commanderAbilities.test.js` e `src/fleetCommander.test.js` — regressioni per tutte le identità, livelli, attacco/difesa, memoria, status, carte reali, riciclo e validazione ID.

## Lavori ancora necessari

1. Eseguire `npm ci`, `npm run verify:logic`, `npm run build`, `npm run preflight` e verificare la relativa esecuzione Actions. **Non dichiarare verde** senza riscontro.
2. Playtest: con una sola madre e scudiere, verificare se bonus percentuali piccoli sono percepibili e se il maggior danno dei comandanti finali è equilibrato con scudi, armi e 12 mazzi boss.
3. Continuare con il **punto 42 della scaletta** (arene) dopo validazione. Grafica/audio finali restano rinviati: non ridisegnare la plancia 9:16 già approvata.
