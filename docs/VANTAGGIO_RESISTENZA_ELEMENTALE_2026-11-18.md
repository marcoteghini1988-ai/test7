# Eclissi Stellare — vantaggio e resistenza elementale negli attacchi
**Data:** 18 novembre 2026 · **repository:** `marcoteghini1988-ai/test7`, ramo `main`

## Decisione attuata
Le 17 flotte possono raggiungere il proprio massimo livello con un potenziale di progetto comparabile; tuttavia **gli abbinamenti elementali possono renderne una nettamente sfavorita contro un'altra**. Le differenze non dipendono dal livello né dalla rarità, ma dalle affinità di ciascuna nave.

**Prima taratura operativa nel combattimento HP:**
- Forte contro l'elemento vulnerabile: **125% del danno base (+25%)**.
- Debole contro l'elemento resistente: **50% del danno base (−50%)**.
- Neutrale o stesso elemento: **100% del danno base**.
- Non esistono immunità automatiche; l'elemento sfavorito conserva la possibilità di vincere con carte, turni, abilità e tattiche.
- Il vantaggio è applicato **anche agli attacchi normali** della nave, non soltanto alle abilità elementali a Energia. Sono comprese le salve delle 10 carte esclusive quando infliggono danno con il motore di attacco, e i contrattacchi di combattimento collegati.
- Le abilità di sola difesa, cura, sabotaggio o controllo non infliggono danni elementali e non creano bonus di danno nascosti.
- La riduzione / amplificazione avviene **dopo che il colpo ha superato Difese e Trappole e prima che il danno venga ripartito** tra supporti e madre. Non si riduce un colpo già annullato e non si applica due volte a un danno diviso tra due scudiere.
- I danni passano attraverso lo stesso sistema HP: non si aumentano né riducono gli HP massimi delle navicelle.

## Matrice completa dei 10 elementi

| Elemento | Forte contro | Debole contro |
|---|---|---|
| Fuoco | Terra, Ghiaccio | Acqua, Vento |
| Acqua | Fuoco, Metallo | Ghiaccio, Fulmine |
| Ghiaccio | Vento, Acqua | Fuoco, Gravità |
| Fulmine | Acqua, Ombra | Terra, Luce |
| Terra | Fulmine, Gravità | Fuoco, Metallo |
| Vento | Luce, Fuoco | Ghiaccio, Ombra |
| Luce | Ombra, Fulmine | Vento, Gravità |
| Ombra | Metallo, Vento | Fulmine, Luce |
| Metallo | Gravità, Terra | Acqua, Ombra |
| Gravità | Ghiaccio, Luce | Terra, Metallo |

Ogni elemento ha esattamente **due elementi da contrastare, due che lo contrastano e cinque neutrali**, oltre al confronto con sé stesso. Tutte le relazioni sono reciproche, e il motore recupera questa matrice unica da `src/fleetNext/elementalAffinities.js`.

## Caso pratico: Fuoco contro Acqua

Due navi completamente migliorate con lo stesso valore di danno base teorico si affrontano:

| Colpo base | Fuoco → Acqua (resistenza) | Acqua → Fuoco (vantaggio) |
|---:|---:|---:|
| 1 HP, primo colpo | 0 HP | 1 HP |
| 1 HP, quattro colpi complessivi | 2 HP | 5 HP |
| 4 HP, un colpo | 2 HP | 5 HP |
| 8 HP, un colpo | 4 HP | 10 HP |

**Nota sull'arrotondamento:** per i colpi da 1 HP il motore conserva i **resti frazionari** su ciascun difensore, separatamente per coppia di elementi. Fuoco → Acqua produce per quattro colpi leggeri `0, 1, 0, 1`; Acqua → Fuoco `1, 1, 1, 2`. In questo modo resistenza e vulnerabilità si manifestano davvero, invece di diventare tutte 1 HP per colpo. I resti non cambiano gli HP né contano come danno finché non raggiungono un intero.

## Una o due affinità per navicella

- **Attacco normale:** utilizza l'elemento principale della nave.
- **Attacco Speciale con Energia:** utilizza l'elemento attivo scelto dal giocatore; può essere il secondo, se sbloccato.
- **Difesa passiva:** resistenza e vulnerabilità della nave madre dipendono dall'elemento **principale**. Il secondo non concede automaticamente una seconda resistenza gratuita.
- **Carte Energia:** servono per attivare la speciale da 1 a 4 cariche, non per usufruire del danno elementale degli spari normali.
- **Scudiere, riserve e fusioni:** ciascun supporto **eredita fisicamente** nel proprio stato `element` e `elements` dalla nave madre (con `elementInheritedFrom`), anche dopo sblocco del secondo elemento. La vulnerabilità ai danni usa il suo **elemento primario ereditato**: una scudiera Fuoco subisce il 125% dei danni da Acqua e un supporto Acqua subisce il 50% da Fuoco. Non si applicano penalità due volte e la seconda affinità non concede resistenza passiva aggiuntiva. La madre e le sue scudiere hanno quindi la stessa debolezza, pur mantenendo HP e passive proprie.
- **Fusione:** mantiene le regole speciali di ciascuna famiglia senza cambiare di nascosto le affinità.
- **Scontri a pari massimo livello:** per la verifica non confrontare numeri di livello differenti come se fossero la stessa fase, ma il potenziale completato (100%) di ciascuna famiglia.

## Modifica nel codice
- `src/fleetNext/elementalDamage.js`: calcolo percentuale e memorizzazione dei resti in quarti di HP sul difensore (non nel catalogo delle carte).
- `src/fleetNext/combat.js`: tutte le salve vere passano dal calcolo elementale prima dell'assegnazione del danno. I contrattacchi usano la stessa regola, ma non attivano nuove reazioni.
- `src/fleetNext/elementalAbilities.js`: gli Attacchi Speciali non ottengono il vantaggio due volte.
- `src/OfficialFleetBattle3D.jsx`: il messaggio dopo un impatto mostra l'esito elementale (potenziato o resistito).
- `src/ShipCollectionPanels.jsx`: l'Hangar informa esplicitamente su +25% / −50%.
- `src/fleetNextElementalDamage.test.js`: verifiche per la matrice, i danni frazionari e gli scontri reali di combattimento HP.
- **I danni del ruleset storico `legacy` restano invariati**: questa modifica vale per il motore ufficiale HP.

## Verifiche e lavori successivi
- Verificato isolatamente il calcolo su **100 confronti elementali ordinati** e la somma di otto colpi da 1 HP per ogni coppia. Il totale dei danni è coerente con 50%, 100% e 125% e ogni elemento ha una relazione opposta nel verso inverso.
- Verificata sintatticamente la modifica JavaScript del motore, ma **non è stata eseguita l'intera suite o la build del repository** in questa sessione.
- Queste percentuali sono una **prima taratura**. Prima del bilanciamento finale occorre simulare tutte le 17 × 17 flotte a potenziale massimo, con mazzi, supporti, carte esclusive e AI: valutare vittorie, partite che diventano troppo lunghe e casi in cui due match-up siano quasi ingiocabili.
- Nessuna illustrazione o animazione è stata modificata. Le 10 Carte Energia già registrate mantengono i loro ID; la progettazione grafica riprenderà dopo la validazione della meccanica.

## Obiettivo della collezione
Una nave Fuoco anche al massimo livello non deve essere la scelta migliore contro Acqua. Il giocatore può usare una seconda nave con elemento favorevole, oppure provare a vincere con una strategia più difficile. L'obiettivo è incentivare **la diversificazione delle flotte**, non rendere un combattimento impossibile o subordinato agli acquisti.
