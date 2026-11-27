# Controllo dei diritti — stato verificato il 27/11/2026

**Perimetro:** contenuti interni del gioco, repository `marcoteghini1988-ai/test7`. Il **titolo commerciale è escluso** su richiesta dell'utente. `Eclissi Stellare` è un nome di lavorazione.

## Evidenze controllate in questo passaggio

| Area | Esito documentato | Cosa resta aperto |
|---|---|---|
| Cataloghi | Il registro `AUDIT_NOMI_INTERNI_COMPLETO_2026-11-27.json` contiene 460 denominazioni correnti distinte e 167 bozze storiche. Sono già presenti le rinomine dei piloti e del modulo «Saturno». | Ricerca di nomi **simili** e anteriorità commercialmente rilevanti, non solo duplicati testuali. Nessun inventario è una certificazione di disponibilità. |
| Banca dati italiana UIBM | Il portale e il modulo **Marchi** sono consultabili: https://www.uibm.gov.it/bancadati/Advanced_search/type_url?cl=1&type=tm . Il portale indica che i dati erano aggiornati alle 23:59 del 26/11/2026. | Non è stato inviato da qui alcun modulo di ricerca né sono stati verificati 460 risultati nominativi; non registrare esiti «nessun marchio» senza ricerca realmente eseguita. |
| TMview / EUIPO | Le pagine istituzionali di istruzione sono consultabili: https://www.euipo.europa.eu/en/trade-marks/before-applying/availability . Il sito TMview https://www.tmdn.org/tmview/ non espone risultati consultabili a questo accesso. | Verifica interattiva dei segni, classi e territori; nomi identici e somiglianti. |
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

**Nessuna rinomina o modifica funzionale al gioco è stata eseguita in questa ricognizione.** Questo rapporto fissa solo evidenze e limiti riscontrati.
