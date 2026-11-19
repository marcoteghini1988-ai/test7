# Eclissi Stellare — Rarità Energia e bonus Terreno per le Carte Arma

**19 novembre 2026 · Implementazione su test7/main**

## 1. Rarità delle Carte Energia

Dieci elementi, quattro rarità per elemento, **40 schede**. La stessa Carta Energia di un certo elemento ha quattro versioni, con questi valori:

| Rarità | Cariche prodotte per carta fisica | Esempio ID Fuoco |
|---|---:|---|
| Comune | 1 | `energy-plasma` (ID storico conservato) |
| Rara | 2 | `energy-plasma-r` |
| Epica | 3 | `energy-plasma-e` |
| Leggendaria | 4 | `energy-plasma-l` |

**Regola della pila:** un solo spazio Energia per giocatore e accumulo senza limiti. Giocare una carta sposta **una carta fisica** dalla mano alla pila; le sue **1–4 cariche** si rendono disponibili. Non viene scartata a fine turno. Quando un'abilità consuma meno cariche di quelle rimaste su una Rara/Epica/Leggendaria, quella stessa carta **resta nella pila**, con il numero residuo. Soltanto all'ultima carica consumata la carta lascia la pila e va agli scarti, **una sola volta**. Le Carte Energia di altri elementi restano intatte.

Le abilità speciali mantengono i propri **costi da 1 a 4 cariche**, che NON costituiscono un limite alle Energie impilabili. Rimangono separati anche il massimo di **3 carte giocate per turno** e il limite già esistente di **4 copie di ciascun ID nel mazzo**: non sono un limite alla pila.

**Vecchi salvataggi:** `energy-ionic` e tutti i dieci ID Comuni conservano nome e ID. In `side.energyPile` le carte Comuni restano rappresentabili come stringhe (anche nei vecchi salvataggi); le versioni avanzate sono singoli oggetti `{id,elementId,remaining}`. Le cariche generate da una passiva senza Carta Energia fisica non creano carte fittizie negli scarti.

### Evoluzione, non acquisto

La regola è **riutilizzabile per tutte le famiglie di carte a rarità evolutiva**, senza convertire carte a rarità fissa:

- **3 copie identiche della stessa carta, elemento e rarità** → due copie consumate, una copia della rarità originale conservata, una copia della rarità successiva ottenuta;
- Comune → Rara → Epica → Leggendaria; la Leggendaria non evolve oltre;
- costa solo le due copie mentre lo Shop non ha stabilito costi aggiuntivi; non scala le cariche di altre Carte Energia già posizionate durante una battaglia;
- una carta **già Rara/Epica/Leggendaria potrà essere trovata direttamente** con un metodo di ottenimento che verrà deciso in futuro. L'inventario riconosce già queste versioni e permette di equipaggiarle se possedute, senza inventare nuovi pacchetti o prezzi.

Il catalogo, il mazzo, l'inventario, la battaglia HP, l'IA e l'officina delle Carte Energia sono aggiornati. I vecchi sistemi di evoluzione **Terreno** continuano a funzionare e ora condividono la funzione base `evolveCardByRarityWithDuplicates`. La grafica definitiva delle carte resta per Work.

## 2. Bonus Terreno sulle Carte Arma

La regola generale vale su **tutti i danni inflitti dalle Armi con elemento compatibile**, sia già giocabili sia da implementare, con queste condizioni:

- Il **Terreno Offensivo** dell'elemento dell'Arma aumenta i danni della stessa percentuale concessa agli altri attacchi di quell'elemento.
- Il **Terreno Equilibrato** concede la sua percentuale offensiva all'Arma e quella difensiva alle unità compatibili.
- Il **Terreno esclusivamente Difensivo** non concede aumento ai danni: la sua funzione resta proteggere.
- Il Terreno vale per **entrambi i giocatori**, dura finché non viene sostituito o annullato, e non cambia l'elemento dell'Arma né elimina svantaggi o difese.
- Non si applica due volte il bonus al medesimo colpo. Se l'Arma ha elemento diverso dalla madre, il bonus si attribuisce **solo alla quota dell'Arma**, secondo l'elemento dell'Arma. I piccoli colpi conservano i resti frazionari del moltiplicatore.

| Rarità del Terreno | Solo Attacco | Equilibrato (Attacco e Difesa) |
|---|---:|---:|
| Comune | +10% | +5% / +5% |
| Rara | +12% | +6% / +6% |
| Epica | +14% | +7% / +7% |
| Leggendaria | +16% | +8% / +8% |

Le **quattro Carte Arma già giocabili** (Cannone dei Frammenti e Acceleratore Trifase I, II, III) hanno elemento codificato e utilizzano il bonus Terreno tramite la logica di combattimento. Per le **100 Armi nuove ancora in progetto** è stata definita una funzione comune di calcolo `terrainWeaponAttackBonus` da usare durante la loro futura implementazione; non si dichiara ancora che le 100 funzionino nel motore.

## 3. Mortaio Magmatico (progettazione in corso)

Il Mortaio è **Fuoco**, dura tre turni propri, assorbirà **solo Energia Fuoco** e produrrà il suo colpo base più colpi aggiuntivi. Con le nuove rarità Energia è necessario **definire separatamente** se i colpi extra del Mortaio sono uno per **carta fisica** oppure uno per **carica** della carta (es. Rara: 2 cariche). Non decidere questa relazione automaticamente senza approvazione. Il Mortaio non è ancora giocabile.

## File operativi

- `src/fleetNext/energyCards.js`: quaranta schede, 1–4 cariche e ID.
- `src/fleetNext/elementalAbilities.js`, `src/fleetNext/combat.js`: pila, consumo parziale, scarti e attivazione HP; IA.
- `src/fleetNext/rarityDuplicateEvolution.js`, `src/fleetNext/nextDeckLoadout.js`: evoluzione e mazzo.
- `src/FleetCollectionWorkshop.jsx`: carte filtrabili per elemento/rarità e pulsante evoluzione.
- `src/fleetNext/elementalDamage.js`: bonus Terreno per Armi, con calcolo condiviso.
- `src/fleetNextEnergyRarity.test.js`, `src/fleetNextWeaponTerrainAffinities.test.js`: test di registrazione, combattimento, proprietà ed effetti.

**Non modificati:** immagini, animazioni, prezzi nuovi di Shop, 120 carte esclusive delle madri, 67 Carte Attacco da rivedere.
