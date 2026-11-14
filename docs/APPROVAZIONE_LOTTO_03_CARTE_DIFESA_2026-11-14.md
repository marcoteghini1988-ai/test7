# Eclissi Stellare — Lotto 03 di carte Difesa approvato

**Conferma utente:** 14 novembre 2026, nella conversazione successiva alla proposta del Lotto 03.
**Repository ufficiale:** `marcoteghini1988-ai/test7`, ramo `main`.
**Decisione:** le 10 carte mostrate nell'anteprima del Lotto 03 sono approvate per l'integrazione. Non occorrono ulteriori approvazioni di design per queste versioni.

## Identità delle 10 carte approvate

| ID | Nome | Funzione | Rarità |
|---|---|---|---|
| gen-081 | Doppio Rinforzo | Difesa | Comune |
| gen-082 | Barriera Locale | Difesa | Comune |
| gen-083 | Rotta di Copertura | Difesa | Comune |
| gen-084 | Vedetta di Scorta | Difesa | Comune |
| gen-085 | Scafo Rinforzato | Difesa | Comune |
| gen-087 | Riflesso Breve | Difesa | Comune |
| gen-089 | Pattuglia Laterale | Difesa | Comune |
| gen-090 | Serratura Tattica | Difesa | Comune |
| gen-091 | Reazione di Bordo | Difesa | Comune |
| gen-092 | Bastione a Settori | Difesa | Rara |

Nomi, ruoli, rarità e testi degli effetti si prendono **esattamente** dal catalogo `src/fleetNext/catalogGeneral.json`. L'approvazione grafica non è approvazione di nuove meccaniche o di modifiche al bilanciamento.

## Specifiche grafiche obbligatorie

- Formato di ogni fronte: **1024 × 1536** (rapporto **2:3**, rettangolare verticale).
- Il **colore identifica la funzione**: tutte queste carte devono essere riconoscibili come Difesa.
- I **riflessi/la finitura** identificano la rarità; `gen-092` deve distinguersi come **Rara**, non come Leggendaria.
- Nessuna scritta **Eclissi Stellare** sul fronte.
- Illustrazione diversa e specifica per ogni carta; nessuna immagine casuale.
- Conservare la plancia 3D, la logica di combattimento e la grafica delle 20 carte precedentemente approvate.
- Non rigenerare né sovrascrivere i fronti già approvati senza una sorgente **identica** o una nuova indicazione dell'utente.

## Stato verificato all'atto della conferma

Sul ramo `main`, il manifest `public/assets/fleet-approved-fronts/manifest.json` contiene **20 fronti approvati** (Lotti 01 e 02). I file `gen-081.webp` e `gen-082.webp` risultano già presenti e protetti nel manifest (parte del Lotto 02). Gli **altri 8 fronti del Lotto 03 non sono ancora nel manifest**. Le illustrazioni di base `public/assets/fleet-card-illustrations/gen-083.webp` ... `gen-092.webp` esistono, ma non vanno confuse con i **fronti completi approvati**.

L'anteprima approvata nel dialogo precedente era accompagnata dai file `Eclissi_Lotto03_10_Carte_PANORAMICA.jpg`, `Eclissi_Lotto03_10_Carte_MOBILE.jpg`, `Eclissi_Lotto03_10_Carte_CORRETTE_DA_APPROVARE.zip`. Tali file non risultavano disponibili nella sessione operativa di questa conferma. **Non dichiarare completata l'integrazione finché non sono stati recuperati i fronti esatti**.

## Integrazione operativa da completare dopo il recupero dei fronti

1. Aprire lo ZIP approvato e verificare per tutti i 10 fronti identità, dimensioni 2:3, qualità, testo, rarità e funzione.
2. Confrontare `gen-081` e `gen-082` con i due fronti già approvati: conservarli se identici, altrimenti gestire l'eventuale differenza senza sostituzioni automatiche.
3. Caricare gli 8 fronti mancanti (più eventuali sostituzioni effettivamente concordate) sotto `public/assets/fleet-approved-fronts/<ID>.webp`.
4. Integrare nel manifest i record precisi ricavati dal catalogo, senza alterare i 20 record preesistenti.
5. Rigenerare le carte mantenendo gli overlay approvati e verificare `npm run check:card-art`, `npm run preflight`, `npm run build`.
6. Solo dopo esito positivo indicare il conteggio effettivo e il commit di integrazione.

**Attenzione:** Questo file registra l'approvazione e l'inventario, **non** costituisce prova che gli 8 nuovi fronti siano stati inseriti.
