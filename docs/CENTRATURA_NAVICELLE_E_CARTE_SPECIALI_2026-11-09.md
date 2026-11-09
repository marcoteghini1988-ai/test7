# Eclissi Stellare — navicelle centrali e Carte Speciali a dimensione intera

**9 novembre 2026.** Modifiche soltanto sulla versione ufficiale `marcoteghini1988-ai/test7`, ramo `main`, senza copie e senza modificare il motore tattico.

## Correzione richiesta

La nave madre del giocatore e quella dell'avversario **devono stare al centro orizzontale** della plancia metallica 450×800 (9:16), con le due scudiere laterali simmetriche. Le immagini di riferimento mostrate dall'utente erano versioni vecchie; non viene ripristinata quella plancia.

### Bug individuato e corretto

In `src/OfficialBattle3D.css` il contenitore `.official-mother` aveva `left:50%;transform:translateX(-50%);`, ma `animation:formationFloat` applicava trasformazioni `translateY` *senza* `translateX`. Le keyframe sovrascrivevano per intero la trasformazione orizzontale, spostando la navicella con centro visivo da x=225 a circa x=383 rispetto a una plancia larga 450 e a una nave larga 316.

La nuova `officialCenteredFloat` usa **sempre** `translateX(-50%) translateY(...)` durante tutta l'animazione. In modalità `prefers-reduced-motion` l'animazione viene rimossa, ma resta `translateX(-50%)`. I vitali/armi integrati continuano a essere figli della nave madre; le scudiere sono ancorate a sinistra e a destra con margine identico di 27 px.

## Fronte delle cinque Carte Speciali

La scelta di layout è **cinque speciali sopra sette numeriche**, non una mano unica mista. Ogni speciale autentica nel mazzo da 24 è visualizzata come una **carta 47×81**, della stessa dimensione della carta numerica. Le speciali non sono più etichette larghe 57 px e alte 38.

Nella parte esposta sopra le numeriche si vedono **categoria colorata, simbolo distintivo ed effetto sintetico**; quando la carta viene toccata e selezionata, si solleva di 62 px, mostra nome ed effetto per intero e viene evidenziata. L'azione è sempre la selezione reale del motore (massimo due carte speciali nel ciclo); non vengono introdotti nuovi pulsanti di attivazione o nuove carte.

La riga delle speciali inizia a `top:528px`, i sette numeri restano a `top:572px`; lo spazio disponibile mostra la metà superiore delle cinque speciali. L'impilamento lascia il ventaglio numerico selezionabile: a selezione aperta le speciali non attive vengono ritagliate sotto la parte esposta, così non rubano tocchi ai numeri.

Le identità sono generate da `src/officialSpecialCardIdentity.js`: glifi, famiglie di colore e brevi indicazioni degli effetti ufficiali per le carte comuni; le carte personaggio e terreno mantengono il proprio ritratto. Il dettaglio completo di ogni carta rimane nell'icona `i` e nell'etichetta accessibile del pulsante. Nessuna descrizione cambia le regole o i bonus del motore.

## Verifiche

- `src/officialMobileLayout.test.js`: centraggio della nave, trasformazione nel moto verticale, posizione simmetrica delle scudiere, geometria 47×81 per entrambe le mani, sollevamento in selezione, protezione del tocco sulle numeriche, tutti i layout 9:16 precedenti.
- `src/officialSpecialCardIdentity.test.js`: copertura di tutti gli ID speciali reali, distinzioni tra carte di effetti diversi, mantenimento del mazzo 24 e dei testi autentici.

## Limiti

Questi controlli sono strutturali e logici. **Rimane necessario un collaudo visivo su smartphone** per confermare leggibilità, immagini e hit target effettivi. Non è stato eseguito uno screenshot di browser reale in questa sessione, né toccate o sostituite le immagini originali delle navi.
