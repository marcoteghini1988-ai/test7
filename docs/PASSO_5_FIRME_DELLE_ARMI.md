# Passo 5 — proiettili, raffiche e impatti delle prime sette armi

3 novembre 2026. Base remota: `47e133640f65069b3d2972e1447d443216d4a3a0`. Ramo: `work/arena-fleet-layout-2026-11-03`.

## Firme realizzate

| Arma | Proiettile e ritmo | Impatto |
| --- | --- | --- |
| W01 — Cannone adattivo | Piccoli impulsi sferici bianco-azzurri, collare luminoso e cadenza regolare. | Scintilla azzurra e anelli di pressione. |
| W02 — Laser Rosso | Segmenti laser cremisi separati, con nucleo chiaro; nessun raggio continuo. | Breve cicatrice incandescente. |
| W03 — Lanciatore Prisma | Sfere cristalline con facce e frammenti a diamante in scia. | Frantumazione radiale di cristalli. |
| W04 — Mitraglia Verde | Microdardi metallici verdi, alternati, in gruppi meccanici di tre. | Scintille a pettine e microperforazioni. |
| W05 — Arco Crepuscolo | Schegge viola curve, con archi alternati e leggero scarto laterale. | Taglio diagonale e frammenti. |
| W06 — Pungiglione | Aghi viola sottili e veloci, in un ventaglio stretto che converge sullo stesso motore. | Piccolo lampo perforante. |
| W07 — Serbatoio Scarlatto | Capsule termiche rosse con collari caldi e scia breve. | Fiammata cosmetica, senza danni persistenti. |

Le firme dipendono dall'ID dell'arma: W02 e W07 condividono i cuori ma hanno forme, tempi e impatti differenti; lo stesso vale per W05 e W06 a picche. Bocche illuminate e rinculo seguono le raffiche. La sintesi Web Audio usa un timbro per arma e inviluppi legati ai colpi reali, con volume ridotto quando più armi sparano insieme; non vengono aggiunti file audio.

## Quantità, bersaglio e tempi

`mathWeaponEffects.js` riceve gli eventi prodotti dal motore matematico, senza modificarli. Ogni munizione effettivamente sparata crea un proiettile: non vengono aggiunti impulsi che moltiplichino i danni. Le raffiche più numerose hanno un intervallo massimo, conservando il numero completo di colpi. La lunghezza dei segmenti laser dipende dalla distanza fisica e dal minimo intervallo fra colpi: rimane uno spazio visibile anche con 26 munizioni, evitando un falso raggio continuo.

Le traiettorie usano i riferimenti DOM della bocca della nave che spara e del motore della nave selezionata. Schegge e aghi si discostano soltanto nel tratto intermedio: partenza e arrivo restano identici. Durante il tiro l'oscillazione delle formazioni è azzerata, eliminando lo scarto residuo osservato con la sola pausa dell'animazione.

Ogni contatto segue l'arrivo del proprio proiettile; l'impatto caratteristico di ciascuna arma segue il suo ultimo colpo. Il danno complessivo compare dopo l'ultimo arrivo della flotta e gli HP vengono applicati 650 ms dopo. Le fiammate sono soltanto visive. Non sono stati introdotti critici, rimbalzi, moltiplicatori o cambi alle regole di danno e munizioni.

Prisma e Serbatoio mostrano la carica sul montaggio. Sotto soglia ricevono un segnale di carica e non producono proiettili, lampi di bocca o impatti. Una scarica consuma la soglia prevista dal catalogo e conserva il resto, sempre con una sola scarica per calcolo valido. Con movimento ridotto le traiettorie diventano dirette, lampi ripetuti e rinculo sono soppressi, gli impatti sfumano; quantità e tempi rimangono coerenti.

## Verifiche

- Build TypeScript/Vite, preflight e 61 test di logica, geometria e VFX. I nuovi controlli coprono quantità da 1 a 26 per tutte e sette le armi, accumulo reale, munizioni condivise tra navi, tempi e convergenza in entrambe le direzioni.
- Flotta Aurora, Corvo e Dardo a L5: `4♣ × 3♠ = 12` produce 17 proiettili di quattro profili e 47 danni sul × del Corvo, da 105 a 58 HP.
- `J♣ − 7♠ = 4`: 43 proiettili, 118 danni teorici, KO del solo − del Dardo; il + superstite resta selezionabile.
- `K♥ + 5♠ = 18`: 18 impulsi, 5 schegge, 5 aghi e 10 capsule; 101 danni sul + del Dardo, da 103 a 2 HP. W07 conserva tre munizioni. Dopo la correzione dell'oscillazione, l'errore tra centro fisico e coordinate d'impatto è inferiore a 0,001 unità della plancia.
- Lince e Vespa a L1: `3♠ + 8♦ = 11` carica W03 a 8/12 senza proiettili né danni. Il successivo `K♦ + 5♣ = 18` genera 12 sfere, conserva nove munizioni e infligge 36 danni al + della Lince, da 65 a 29 HP. `K♥ + 4♥ = 17` genera 17 segmenti laser e 34 danni sul + della Vespa.

L'esito della sincronizzazione, del salvataggio e del reload di StackBlitz è registrato nel piano operativo corrente. La copia mantiene `VITE_ASSET_ROOT` e usa gli asset pubblici già presenti: nessun nuovo caricamento binario.

## Confini

Questa fase completa le firme delle prime sette armi delle cinque navi già presenti. Le 35 armi restanti, le quattro rare, le epiche, le leggendarie e le evoluzioni visive L1–L5 seguono il piano. Il warning sul bundle grande e i testi legacy estranei al duello restano aperti. Il test su un telefono fisico non è stato eseguito.
