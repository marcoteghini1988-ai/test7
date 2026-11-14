# Eclissi Stellare — Lotto 03: dieci carte Difesa confermate

**Data conferma:** 14 novembre 2026. **Riferimento visivo definitivo:** l'immagine caricata `Eclissi_Lotto03_10_Carte_MOBILE.jpg` (montaggio di 10 fronti approvati).

## Identità corrette — lette direttamente dall'immagine e confrontate con il catalogo

| Posizione nell'immagine | ID catalogo | Nome esatto | Tipo | Rarità |
|---|---|---|---|---|
| 1 sinistra | gen-083 | Rotta di Copertura | Difesa | Comune |
| 1 destra | gen-084 | Vedetta di Scorta | Difesa | Comune |
| 2 sinistra | gen-085 | Scafo Rinforzato | Difesa | Comune |
| 2 destra | gen-086 | Guardia degli Ugelli | Difesa | Comune |
| 3 sinistra | gen-087 | Riflesso Breve | Difesa | Comune |
| 3 destra | gen-088 | Diaframma di Piastre | Difesa | Comune |
| 4 sinistra | gen-089 | Pattuglia Laterale | Difesa | Comune |
| 4 destra | gen-090 | Serratura Tattica | Difesa | Comune |
| 5 sinistra | gen-091 | Reazione di Bordo | Difesa | Comune |
| 5 destra | gen-092 | Bastione a Settori | Difesa | Rara |

**Correzione del registro precedente:** `gen-081` (Doppio Rinforzo) e `gen-082` (Barriera Locale) NON sono nel Lotto 03 mostrato: appartengono già al Lotto 02. La lista corretta comprende `gen-086` e `gen-088`.

Fonte di verità per testo, nomi, ID, effetto, ruolo e rarità: `src/fleetNext/catalogGeneral.json`. Gli effetti sono ancora marcati `proposta_da_bilanciare_non_implementata` nel catalogo; l'approvazione grafica non modifica lo stato delle meccaniche.

## Vincoli artistici da conservare

- Carte verticali rettangolari 2:3, fronti finali 1024×1536.
- Design esattamente nello stile visibile nella panoramica approvata, non immagini casuali.
- Difesa identificata dal colore blu/ciano; rarità distinta dai riflessi e dalla finitura. Solo `gen-092` reca `RARA`; le altre sono `COMUNE`.
- Niente marchio `Eclissi Stellare` sui fronti.
- Tutti i 20 fronti approvati in precedenza sono intoccabili; non modificare Home, arena 3D, navicelle o regole combat.

## Disponibilità degli asset e qualità

La sola panoramica caricata ha **416×1536 pixel in totale**. Ogni carta occupa circa **201×300 pixel**, quindi è una **anteprima mobile**, non un PNG/WebP HD sorgente. I dieci ritagli ottenibili sono fedeli al montaggio ma non sostituiscono i fronti finali HD di qualità paragonabile ai lotti precedenti. Ingrandirli a 1024×1536 non ripristina i dettagli o il testo originale.

Al controllo, nel repository `public/assets/fleet-approved-fronts/manifest.json` risultavano **20 carte approvate** dei Lotti 01 e 02. I 10 ID `gen-083` ... `gen-092` **non risultavano registrati** come fronti completi approvati, benché esistano illustrazioni di base sotto `public/assets/fleet-card-illustrations/` e fronti generati ordinari sotto `public/assets/fleet-next-cards/`.

## Procedura di integrazione ancora aperta

1. Recuperare gli originali separati ad alta risoluzione del Lotto 03 (archivio della precedente chat `Eclissi_Lotto03_10_Carte_CORRETTE_DA_APPROVARE.zip` o esportazioni equivalenti) e confrontarli con questa panoramica.
2. Controllare per ciascuna carta dimensioni, testi, colore funzione, finitura rarità, identità e artwork.
3. Inserire i 10 fronti completi in `public/assets/fleet-approved-fronts/<ID>.webp` e aggiungere i 10 record nel manifest, copiando effetto e rarità dal catalogo.
4. Eseguire il generatore conservando gli overlay approvati, e superare `npm run check:card-art`, `npm run preflight`, `npm run build`.
5. Solo allora riportare **30/379** fronti HD integrati, citando il commit verificato.

**Stato di questo documento:** conferma corretta e tracciata, **non** certificazione dell'inserimento HD.
