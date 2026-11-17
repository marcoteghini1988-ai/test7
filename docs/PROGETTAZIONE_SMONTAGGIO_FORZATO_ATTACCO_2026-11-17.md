# Eclissi Stellare — Smontaggio Forzato (4 carte Attacco)
**Data:** 17 novembre 2026  
**Stato:** progetto delle quattro varianti confermato come famiglia **ATTACCO**; valori e interazioni da finalizzare e implementare.  
**Fase grafica:** rinviata.

## Identità e slot
- Famiglia di carte generiche **ATTACCO** utilizzabili durante il proprio turno, nei **tre slot Attacco** della nuova modalità HP.
- Non sono carte Difesa, Trappola, Personaggio, Terreno o equipaggiamenti permanenti.
- **Non** alterano in modo permanente la progressione, il livello salvato, la proprietà della navicella o le carte esclusive.
- A differenza di un semplice malus numerico, l'effetto consiste nel **rimuovere temporaneamente dalla configurazione operativa/visiva i componenti montati o i potenziamenti aggiunti**, sopprimendone le funzioni. Il ripristino rimonta gli stessi componenti con identità, integrità e stato antecedenti all'effetto; non cura la madre né i supporti.
- Il livello di progressione salvato resta invariato, ma le capacità dipendenti da un componente smontato **non sono utilizzabili** finché è assente. Non si cancellano le carte esclusive già possedute o i relativi sblocchi.
- La configurazione iniziale **è specifica per ogni nave**: non forzare tutte le flotte ad avere identici componenti. La versione Leggendaria conserva la dotazione base del livello 1 della nave bersaglio e smonta temporaneamente solo ciò che eccede quella dotazione.

## Quattro varianti previste
| ID di progettazione (non runtime) | Nome | Rarità | Effetto proposto | Durata proposta | Categoria |
|---|---|---|---|---|---|
| `design-attack-dismantle-c` | Smontaggio Forzato | Comune | Smonta 1 componente aggiunto/potenziato selezionabile | 1 turno | **ATTACCO** |
| `design-attack-dismantle-r` | Smontaggio Forzato | Rara | Smonta 1 componente aggiunto/potenziato selezionabile | 2 turni | **ATTACCO** |
| `design-attack-dismantle-e` | Smontaggio Forzato | Epica | Smonta fino a 2 componenti aggiunti/potenziati selezionabili | 2 turni | **ATTACCO** |
| `design-attack-dismantle-l` | Smontaggio Forzato | Leggendaria | Riporta temporaneamente la nave bersaglio alla configurazione base della propria nave al livello 1, senza componenti/potenziamenti successivi | 2 turni | **ATTACCO** |

## Regole da rispettare in implementazione
1. Lo smontaggio è **temporaneo e fisico/operativo**, non una riduzione permanente del livello e non una perdita permanente del componente.
2. I componenti smontati e le relative funzioni vengono sospesi; al termine si **rimontano automaticamente**, con HP/integrità preesistenti. Non ripristinare HP della madre né annullare danni subiti.
3. Nessuna carta modifica la proprietà o l'identificativo delle 120 carte esclusive. Verificare le dipendenze fra le dieci esclusive di ciascuna delle dodici navicelle principali, i moduli, le scudiere, la Centralina, l'Arsenale, il Generatore e la Plancia.
4. L'effetto non deve rimuovere i sistemi innati necessari alla configurazione base della navicella: ogni nave usa la propria configurazione livello 1 e i propri sblocchi reali.
5. Da implementare e testare: selezione bersagli validi, durata per turni, riattivazione esclusive, restauro componenti, casi di assenza di potenziamenti, effetti sovrapposti, Buco Nero, condizione vittoria su HP e interazioni con la plancia 3D.
6. **Queste quattro carte non sono giocabili né presenti in `src/fleetNext/newCardRegistry.js`** finché non vengono integrate e testate. Le 33 carte Attacco già eseguibili restano invariate.

## Recupero futuro per la grafica
Consultare `docs/INDICE_CARTE_ATTACCO_LOTTO_33.md`, sezione «Quattro ulteriori carte Attacco — Smontaggio Forzato». Le immagini dovranno mostrare lo smontaggio temporaneo di componenti specifici della navicella; non produrre o associare asset finché non sarà richiesto.
