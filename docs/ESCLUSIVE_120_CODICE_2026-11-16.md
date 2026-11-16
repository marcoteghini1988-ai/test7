# Eclissi Stellare — integrazione nel codice delle 120 esclusive

## Catalogo delle dodici navicelle principali
I 120 progetti della specifica `docs/NUOVO_CATALOGO_ESCLUSIVE_120_2026-11-16.json` sono registrati in `src/fleetNext/exclusive120.js` e collegati a `src/fleetNext/rules.js`.

Ogni navicella principale dispone di **10 definizioni univoche**: sei dal livello 1, una ciascuna ai livelli 2, 3, 4 e 5. Gli ID di nave sono `N00, C01, C02, C03, R01, R02, R04, E01, E02, L01, L03, L04`. L'identità esclusiva impedisce l'uso con madri diverse.

## Personaggi e Boss preservati
Le dodici definizioni Personaggio già presenti nei 120 progetti condividono i loro ID esistenti `ex-...-01` (salvo la posizione della proposta in `L04`). Non vengono clonate. I loro **effetti attualmente eseguibili restano quelli precedenti**: i nuovi effetti descritti nel progetto sono registrati come specifica per la futura implementazione. Restano inoltre i cinque Personaggi delle varianti storiche, i dodici Personaggi generici e i dodici Boss.

## Stato tecnico verificato
- `EXCLUSIVE_DESIGNS_120`: 120 progetti esattamente, 10 per madre.
- `EXCLUSIVE_CARDS`: 125 registrazioni (120 del gruppo principale, includendo i 12 Personaggi già esistenti; più 5 Personaggi varianti).
- `GENERAL_CARDS`: 12 Personaggi.
- `BOSS_CARDS`: 12; `PROGRESSION_CARDS`: 6.
- Totale nel registro `card(id)`: **155**.
- **108 nuove schede** importate con nome, categoria, testo dell'effetto, contragioco, requisiti, livello e brief grafico. La lettura del catalogo e l'interfaccia Shop le espongono correttamente.
- Le 108 schede hanno `playable:false`: prima di avere gli effetti di combattimento corrispondenti, il validatore blocca il loro utilizzo, il mazzo non le pesca e non possono essere potenziate o acquistate. Non viene applicato un bonus inventato al posto della regola.
- Nessuna illustrazione nuova: le 108 schede usano il fronte testuale provvisorio. I Personaggi e Boss conservano le proprie immagini originali.

## Lavoro di meccanica ancora da implementare
I 120 testi descrivono nuove azioni reali non contenute nel vecchio motore: moduli d'arma e utilità montati e distruttibili, attacchi distinti dalla salva base, energia, colpi preparati, occultamenti, silenzi, ridirezioni, trappole condizionali e personaggi ad attivazione evento. Richiedono un motore dedicato con convalida dei bersagli e test delle interazioni. **Non si deve considerare la mera registrazione nel catalogo come la completa implementazione di queste azioni.**

## Verifica
I controlli sulle cardinalità, gli ID e i riferimenti sono stati aggiornati; la sintassi JavaScript dei moduli principali è stata verificata. Build Vite, test Node end-to-end e prova grafica in browser **non eseguiti in questa sessione**.
