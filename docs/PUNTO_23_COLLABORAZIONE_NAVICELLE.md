# Punto 23 della scaletta ufficiale — Collaborazione fra navicelle

**Data:** 6 novembre 2026. **Stato:** motore operativo parziale, con scenari d'integrazione e test; cooperazioni avanzate e scelte tattiche successive da completare.

## Distinguere le due fasi
- **Punto 22B**: due mani (7 numeriche / 5 speciali) e fusione attivabile **solo** giocando una carta speciale, non con il pulsante MANOVRE. Documento: `PUNTO_22B_CARTE_SPECIALI_FUSIONI.md`.
- **Punto 23 ufficiale**: far collaborare madre e scudiere **anche quando non sono fuse**, con protezione reale, fuoco coordinato e ruoli distinti. Non confondere la numerazione della scaletta da 53 punti con il nome dei moduli tecnici.

## Collaborazioni già presenti nel motore
1. **Scudiere collegate:** ogni madre ha al massimo due subordinate sbloccate a L3/L5. Scudi e danni propri, senza duplicare le 42 armi della madre.
2. **Difesa della madre:** il danno assorbito consuma realmente gli HP dello scudo scudiera. La restante parte raggiunge la madre. Con la centralina KO non c'è più coordinazione.
3. **Fuoco nello stesso attacco:** due carte numeriche possono alimentare due armi diverse della flotta. Ogni carta assegna munizioni a UNA SOLA arma; la doppia arma non duplica i proiettili.
4. **Ruoli specializzati e dottrine:** `escortTactics.js` e `escortFiring.js` differenziano intercettazione, assalto a scudi, incursione e bonus per ognuna delle 17 madri.
5. **Formazioni:** Guardia, Equilibrata, Assalto. Conseguenze di danno e protezione, valori provvisori.
6. **Fusione:** unisce madre e UNA scudiera attraverso una carta speciale e Sincronia; l'altra resta indipendente. Le sue munizioni non vengono assegnate alla scudiera agganciata.
7. **IA:** può selezionare manovre e giocare le proprie carte speciali per fondere.

## Verifiche aggiuntive di cooperazione
`src/fleetCooperation.test.js` verifica:
- Tiro di madre e scudiera nello stesso attacco, senza duplicazione delle 2 carte.
- Disattivazione dell'arma della scudiera agganciata dopo l'uso della speciale.
- Consumo degli HP reali della scudiera durante la fusione Barriera e trasferimento del danno residuo alla madre.

## Restante lavoro del punto 23
- Definire **attacchi concatenati** con interazioni specifiche tra le due scudiere e la madre, oltre ai bonus esistenti, distinguendo una cooperazione da una normale raffica simultanea.
- Definire **protezione reciproca attiva** con costo e rischio, oltre all'intercettazione automatica già operativa.
- Dare ruoli tattici riconoscibili e funzioni davvero differenti per ogni famiglia, senza attribuire alle carte nuovi poteri non decisi.
- Collegare le capacità avanzate al futuro catalogo speciale, sempre con carte consumate e separate dalla mano numerica.
- Evitare animazioni fisiche/3D definitive ora; audio e video/effetti sono una fase futura, successiva al regolamento.

## Prossimi punti
- **24**: ruoli/identità delle navicelle e loro scelte in battaglia (parte delle 7 funzioni e 17 dottrine già disponibile).
- **25**: protezione della madre e conseguenze reali.
- **26**: danni localizzati ai sistemi.
- **27**: effetti strategici delle armi.
- **28**: condizioni di attivazione, matematica 2/3 carte, coppie/tris/sequenze/semi e fusioni.
- **29**: ritmo e bilanciamento delle battaglie.
- **30**: costruzione vera del mazzo speciale, nuove tipologie oltre alle due fusioni e alla Copertura Tattica, acquisti/sblocchi/copie.
Queste sono etichette della scaletta storica: non dichiarare i blocchi conclusi solo perché esiste un prototipo.

Riferimento master: `MASTER_DECISIONI_ECLISSI_STELLARE_2026-11-06.md`.

**Aggiornamento punto 25:** alla protezione automatica si aggiunge la speciale `Copertura Tattica`, vincolata alla scudiera difensiva 1, con un singolo impatto protetto e scudo reale. Vedi `PUNTO_25_PROTEZIONE_MADRE.md`.
