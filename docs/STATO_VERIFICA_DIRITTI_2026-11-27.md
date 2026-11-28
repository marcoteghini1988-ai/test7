# Controllo dei diritti — stato verificato il 27/11/2026

## Aggiornamento del 28/11/2026 — Personaggi

La versione attiva e i sorgenti `src/` non contengono più gli ID del catalogo
storico `pilot_com_*`, `pilot_rare_*`, `pilot_epic_*`, `pilot_leg_*`,
`pilot_boss_*` e `pilot_sentinel_*`. Sono stati eliminati i moduli delle
abilità dei vecchi Piloti e i relativi test dedicati. Le funzioni condivise
per le navi, il renderer fisico, la scelta della nave rivale e la
rendicontazione della campagna sono state separate dal vecchio motore. I test
rimasti non inventano più un Pilota né lo assegnano a uno scontro.

Le dodici definizioni `boss-character-*` **restano come regole e ricompense
del gioco attuale**, senza illustrazioni approvate (`imagePath:null` e
`cardFacePath:null`). Le carte mostrano le etichette temporanee
**Personaggio Boss 01–12**. Questi codici e queste etichette numerate non
sono i nomi commerciali definitivi né un'affermazione che esistano dodici
carte illustrate. I nomi dei Boss avversari nella campagna sono un tema
separato e restano nomi di lavorazione.

Nessuna parola comune o inventata garantisce da sola disponibilità legale.
Prima della pubblicazione bisogna verificare segni identici e simili nei
territori e nei prodotti/servizi interessati (per esempio software di gioco
e intrattenimento online), confrontare i risultati e sottoporre i conflitti
concreti a una valutazione professionale. Anche una ricerca senza risultati
non esclude contestazioni. I documenti storici e i commit precedenti restano
nella cronologia del repository: non sono inclusi nella build corrente e non
sono stati riscritti.

Verifiche locali: `npm run preflight` e `npm run build` superati; suite completa
da 2.434 test, con due asserzioni residue sul vecchio Pilota successivamente
aggiornate e superate in una verifica mirata. Il collaudo visivo della nuova
etichetta nella partita e il run CI dello stesso commit sono ancora da
confermare. Le sezioni sotto documentano la fotografia precedente e sono
superate, dove parlano di Piloti ancora nel menu.

**Perimetro:** contenuti interni del gioco, repository `marcoteghini1988-ai/test7`. Il **titolo commerciale è escluso** su richiesta dell'utente. `Eclissi Stellare` è un nome di lavorazione.

**Aggiornamento nomi:** `E01` **Nefelarca** (ex Nebulosa), `E02` **Vortiluce** (ex Tempesta), `pilot_rare_3` **Mazziere dell'Etere** (ex Il Baro), `pilot_leg_3` **Armiere dei Tre Fronti** (ex Il Fissatore). Anche le etichette delle navi, gli eventi e le carte esclusive collegate sono stati aggiornati; ID, effetti, statistiche e immagini sono conservati. Le ricerche esatte UIBM e di base EUIPO sui quattro nuovi nomi non hanno restituito risultati pubblicabili; non certificano assenza di segni simili o libertà commerciale. I nomi precedenti nelle righe seguenti sono evidenze storiche della verifica.

**Portata nel gioco:** le due navi `E01` e `E02` sono nella battaglia 3D corrente. I due `pilot_*` sono ancora presenti nei menu/cataloghi precedenti dell'app, ma non sono carte Personaggio del catalogo `fleetNext` e il componente della battaglia ufficiale non usa il pilota selezionato. Vedere la [verifica dettagliata](VERIFICA_MARCHI_NOMI_PRIORITARI_2026-11-27.md).

## Evidenze controllate in questo passaggio

| Area | Esito documentato | Cosa resta aperto |
|---|---|---|
| Cataloghi | Il registro `AUDIT_NOMI_INTERNI_COMPLETO_2026-11-27.json` contiene 460 denominazioni correnti distinte e 167 bozze storiche. Sono già presenti le rinomine dei piloti e del modulo «Saturno». | Ricerca di nomi **simili** e anteriorità commercialmente rilevanti, non solo duplicati testuali. Nessun inventario è una certificazione di disponibilità. |
| Banca dati italiana UIBM | Sono state eseguite ricerche per **61 nomi prioritari** nel campo Denominazione/Descrizione, modalità frase esatta. Quattro nomi hanno prodotto risultati: **Tempesta**, **Nebulosa**, **Il Baro**, **Il Fissatore**. Per Tempesta sono state lette schede registrate nelle classi 9 e 41. Dettagli, numeri di domanda e limiti: [verifica dei marchi prioritari](VERIFICA_MARCHI_NOMI_PRIORITARI_2026-11-27.md). | La formula UIBM «nessun risultato o risultati non pubblicabili» per altri 57 nomi non certifica disponibilità. Mancano ricerche individuali degli altri 399 nomi, segni simili e territori ulteriori. |
| TMview / EUIPO | TMview è rimasto su «Loading interface...». La banca dati ufficiale **eSearch plus** ha consentito ricerche di base per i quattro nomi precedenti e i quattro sostituti. Per l'ex Tempesta compare anche [«LA TEMPESTA City, culture & technology», EUTM 018881528](https://euipo.europa.eu/eSearch/#details/trademarks/018881528), registrato nelle classi 9, 41 e 42 con software e servizi di intrattenimento; non è un marchio identico alla sola parola. | Verifica di segni identici e somiglianti nei registri nazionali e internazionali, confronto dei prodotti e dell'uso interno delle nuove denominazioni prima del marketing. |
| WIPO Global Brand Database | La pagina https://branddb.wipo.int/ presenta una verifica anti-bot. I termini WIPO https://www.wipo.int/en/web/global-brand-database/terms_and_conditions **vietano le interrogazioni automatizzate** e l'acquisizione massiva dei dati. | Controllo manuale autorizzato dei nomi prioritari, non crawler automatico. Gli eventuali risultati andrebbero valutati per territori e prodotti. |
| Asset multimediali | Il registro `AUDIT_ASSET_PROVENIENZA_2026-11-27.json` enumera 578 file: 445 in `public/`, 36 in `asset-sources/`, 97 in `docs/`. | Identificare quali asset sono effettivamente distribuiti e raccogliere autore, origine, licenza o attestazione di creazione. |
| Illustrazioni delle Armi | I manifest consultati riportano approvazioni, percorsi, dimensioni e hash dei file. | Questi dati provano integrità tecnica, **non** diritti commerciali; le licenze/prove d'origine non risultano nei campi visionati. |
| Font | Il sorgente `docs/riferimenti-carte/font/design_font.py`, creato con ChatGPT, genera i contorni del TTF presente nel progetto. Il confronto con il file originale è risultato identico byte per byte dopo aver allineato il timestamp interno; vedere `docs/riferimenti-carte/font/ORIGINE_ECLISSI_VETTORE.md`. | Conservare sorgente e prova di generazione; il confronto tecnico non certifica l'assenza di ogni somiglianza con font esistenti. La nuova compilazione corregge `fsType` da 4 a 0. |
| Font Google | `Orbitron` e `Rajdhani` sono richiesti in `src/App.tsx`, entrambi sotto SIL OFL 1.1. Licenze e titolari sono registrati in `docs/licenze-font/`. Il peso Rajdhani 800 non disponibile è stato rimosso dalla richiesta Google Fonts. | Il caricamento da domini Google richiede un controllo privacy e una decisione sulla disponibilità offline. Se i font saranno distribuiti nel pacchetto, conservare licenze e copyright insieme ai file. |
| Librerie del gioco | Il lockfile elenca `react` 19.3.0, `react-dom` 19.3.0, `scheduler` 0.28.0 e `three` 0.187.0 come dipendenze non di sviluppo: tutte MIT. Le licenze delle versioni corrispondenti sono raccolte in `public/THIRD_PARTY_NOTICES.txt`, che Vite copia nella build. È incluso anche l'avviso MIT di Vite 6.4.3 per prudenza. | Confrontare ancora l'avviso con il pacchetto finale e aggiornare versioni/avvisi se cambia il lockfile. TypeScript, plugin React e altri strumenti di build non sono classificati come librerie runtime dal lockfile. |
| Test del gioco | Workflow GitHub [46026780833](https://github.com/marcoteghini1988-ai/test7/actions/runs/46026780833), commit `e52d27afc44868d0ae35827f2a259c3d296dc4dc`: `npm ci` e `npm run preflight` segnalati **success** all'ultima lettura. | `npm run verify:logic` era in esecuzione; `npm run build` non era ancora eseguito. Aggiornare questa riga **solo** dopo un nuovo riscontro dei risultati. |

## Criterio di completamento

1. Dare priorità alla verifica dei segni distintivi usati come nomi di Boss, personaggi, piloti, navi, supporti e carte principali, poi gli altri nomi. Cercare equivalenti tradotti e somiglianze fonetiche/concettuali, senza confondere omonimia generica e violazione.
2. Collegare ogni asset **distribuito** a una prova di titolarità/licenza o a una creazione tracciata, incluse immagini e font; distinguere risorse di test e anteprime.
3. Accertare che tutte le categorie mostrate al giocatore siano **ARMA** e **STRATEGIA** dove pertinente; le chiavi tecniche `attack` e `offense` restano possibili per compatibilità.
4. Ottenere un run GitHub con preflight, test logici e build completati sullo stesso commit e collaudare le schermate interessate.
5. Prima della pubblicazione commerciale, una valutazione legale delle collisioni significative resta consigliata; **nessun nome o file è dichiarato «libero al 100%» in base a questo documento**.

**Le quattro rinomine sopra sono state applicate; nessuna modifica funzionale al gioco è stata progettata in questa ricognizione.** Questo rapporto fissa evidenze e limiti riscontrati.
