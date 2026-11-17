# Eclissi Stellare — decisione di design: fusioni rare, bilanciamento fra stili
**Data:** 17 novembre 2026  
**Stato:** scelta di progettazione; **non** è un bilanciamento numerico implementato nel codice.

## Decisioni confermate
1. La fusione **NON** sarà disponibile per ogni famiglia di navicelle, nemmeno al massimo livello. È una caratteristica identitaria di **pochissime famiglie (orientativamente due o tre)**.
2. Le altre navicelle manterranno punti di forza propri, altrettanto incisivi: sopravvivenza autonoma, controllo Personaggi/Trappole, gestione dei Terreni, rigenerazione, sacrifici volontari, pescaggio, effetto temporizzato e accumulo. **Non aggiungere fusioni per uniformare i mezzi di combattimento.**
3. La potenza va misurata sull'**intera flotta** (nave madre, due supporti, eventuali riserve/fusioni, carte esclusive e abilità), non sul danno né sugli HP della sola madre.
4. **Una fusione ha un costo competitivo.** In fase di bilanciamento, una famiglia che dispone di fusione deve rinunciare a qualcosa rispetto a una senza fusione: per esempio meno HP della madre, minore potenza prima della fusione, preparazione più lunga, maggiore dipendenza dai supporti, rischio concentrato in un unico bersaglio, sacrificio di carte o perdita di flessibilità. Non applicare automaticamente la **stessa penalità** a tutte le flotte con fusione.
5. Le navicelle **senza fusione** non devono risultare inferiori a parità di progressione completata: il loro vantaggio dovrà essere reale e verificabile, non una semplice compensazione estetica.
6. Alla fine della propria progressione (anche se il numero massimo di livelli sarà diverso per ciascuna famiglia), tutte le flotte devono avere **potenziale competitivo comparabile nel PvP**, con match-up e identità differenti. Non devono avere gli stessi HP, lo stesso danno o la stessa durata.
7. La progressione di campagna resta; il suo futuro ampliamento, per esempio 20 livelli per le prime navi contro 5 per una Leggendaria, **è un esempio e non un valore già programmato**.
8. Le dieci esclusive di ogni nave seguiranno una futura evoluzione coerente con la sua progressione, ma rarità e valori finali richiedono una progettazione distinta. Non introdurre una fusione in tutte le famiglie per uniformare le dieci carte.

## Situazione reale nel codice, prima del bilanciamento
Il registro `src/fleetNext/progression.js` e `src/fleetNext/progressionCards.js` prevedono fusioni solo per **tre famiglie delle dodici principali**:
| Famiglia | Fusioni attuali | Sblocco attuale | Nota |
|---|---|---|---|
| Eclisse Reale (`L01`) | 1 | livello 5 | Fonde i due supporti |
| Titano Ossidiana (`L03`) | 1 | livello 3 | Fonde i due supporti |
| Arca Astrale (`L04`) | fino a 2 | due carte disponibili, ma seconda fusione legata alla riserva sbloccata al livello 5 | Due coppie fuse; non quattro supporti contemporanei |
Le altre **14 famiglie del catalogo completo da 17** non hanno fusioni. Il fatto che attualmente siano queste tre a fonderle non obbliga a mantenerle definitivamente tutte e tre: il gruppo definitivo verrà congelato quando approveremo le abilità delle scudiere.

## Regola specifica delle fusioni
- Una fusione non crea un terzo posto nel campo: **al massimo due supporti schierati**. La nave madre non si fonde.
- La forma fusa deve offrire una **nuova meccanica distintiva**, non limitarsi a sommare HP e due passivi.
- La forma fusa mantiene controgioco: l'avversario può impedire la preparazione, distruggere i supporti o colpire la debolezza della flotta. La fusione non equivale alla vittoria.
- Le eventuali carte e le riserve già sbloccate restano soggette alla progressione della famiglia e ai requisiti reali.

## Criteri obbligatori del futuro bilanciamento
- Confrontare la stessa **fascia di progresso completato** e lo stesso accesso a mazzi/carte, non una nave iniziale L1 con una Leggendaria L5.
- Simulare anche **prima** della fusione, **durante** e **dopo** la sua distruzione: danno medio, sopravvivenza, capacità di difesa della madre, turni necessari e controgioco.
- Non scegliere i valori definitivi di HP/danno ora: gli esempi (es. un supporto che si sacrifica per 50 HP) devono essere ridimensionati sulla scala effettiva del motore.
- Testare contro flotte **senza fusione**, contro flotte **con una fusione** e contro **Arca a doppia fusione**.
- Evitare che la fusione annulli la convenienza di sacrifici, sabotaggi, cure, gestione della mano e altre meccaniche alternative.

## Stato delle modifiche
Questo documento registra la decisione. Non cambia `combat.js`, le progressioni, i livelli, gli HP, le fusioni esistenti, le 120 carte esclusive o la grafica.
