# Eclissi Stellare — Ripresa dei punti 32–39 (6 novembre 2026)

**Repository unico:** `marcoteghini1988-ai/test7`, ramo `main`. Non creare copie né nuovi rami.

## Scaletta originale e stato dei punti

| Punto | Definizione originale | Stato verificato | Decisioni ancora aperte |
| --- | --- | --- | --- |
| 32 | Cinque speciali in mano | **Implementato**: `SPECIAL_HAND_SIZE=5`, mano diversa dalle sette numeriche | Solo prova pratica UI 9:16 |
| 33 | Dimensione del mazzo speciale | **Prototipo 24 carte**, valida costruzione e riutilizzo degli scarti | Confermare se 24 diventa definitivo |
| 34 | Costruzione personalizzata | **Implementato**: editor Hangar e schermata flotta, inventario persistente | Bilanciamento rarità/frequenze |
| 35 | Carte speciali duplicate | **Implementato**: più copie vere, fino a 6 per tipo | Confermare il tetto di 6 copie |
| 36 | Acquisizione delle speciali | **Implementato in prova**: 1 credito pacchetto alla prima vittoria per settore, 3 copie reali per apertura | Rarità, ricompense future, economia Shop |
| 37 | Combinazione numerica + speciale | **Prima implementazione**: numeriche attivano colpi validi; una o due speciali reali modificano l'effetto della scarica | Casi avanzati delle 17 flotte e nuove abilità |
| 38 | Più speciali e ripescaggio | **Implementato**: fino a due effetti offensivi distinti nella stessa scarica, refill dopo ogni carta, scarti riutilizzati | Bilanciamento del ritmo, altri effetti combinabili |
| 39 | Catalogo definitivo speciali | **Non definitivo**: otto tipi giocabili, sei iniziali + due supporti da ottenere | Completare le meccaniche prima di fissare catalogo e rarità |

## Vincoli già approvati e preservati

- Mano: **7 carte numeriche** e **5 speciali** separate; nessuna speciale sostituisce numeriche.
- Dopo ogni carta speciale **effettivamente giocata**, la mano speciale si riporta subito a cinque; non introdurre limiti d'uso o di pescata arbitrari.
- Più copie dello stesso tipo possedute ed equipaggiate sono ammesse; ciascuna è una carta reale con propria identità.
- Una fusione richiede obbligatoriamente la relativa **carta Fusione** e 100 Sincronia: la Sincronia da sola non autorizza la fusione.
- Niente fusioni incompatibili simultanee e niente terzo effetto offensivo nella stessa scarica.
- Le speciali offensive non creano colpi gratuiti e non sostituiscono la validazione matematica e le firme dei vitali.
- Le carte speciali si spendono solo se l'azione è utilizzabile; le carte di supporto non inventano HP né curano vitali KO.
- Una volta terminata la pesca, la mano viene ricostituita con gli **scarti effettivamente giocati**; nessuna carta numerica è coinvolta.
- Catalogo, economia e probabilità delle speciali **non** sono definitivi finché le meccaniche rimangono aperte.

## Verifiche integrate

La nuova suite `src/specialFlow.test.js` copre:
1. Due speciali offensive compatibili possono essere armate consecutivamente in una singola finestra, con mano sempre di cinque, e il terzo effetto viene rifiutato senza consumo.
2. Preparare un effetto e risolvere un impatto reale sullo scudo non tocca le numeriche.
3. Due carte supporto diverse possono essere giocate consecutivamente solo quando utili; riparazione e pulizia applicano effetti veri, senza usare numeriche né perdere copie.

**CI GitHub Actions:** 311 test logici superati, build e preflight riusciti sul commit `2deda8ea393a7faff98cf23fa8e7fb13c151fdaf`: https://github.com/marcoteghini1988-ai/test7/actions/runs/42212283860

## Proposta non ancora definitiva per i punti 33 e 35

Mantenere **24 carte nel mazzo** e **massimo 6 copie dello stesso tipo**, per compatibilità con le collezioni già salvate, una proporzione equilibrata su otto tipi e la possibilità di specializzare realmente il mazzo. Fino alla decisione finale, non convertire queste quantità provvisorie in vincoli irreversibili.

Dopo la conferma 33/35 si potrà definire il punto 36 (economia e frequenze), completare i casi avanzati del punto 37 e, solo al punto 39, rendere il catalogo definitivo. La grafica 3D e gli effetti audio finali restano rinviati.
