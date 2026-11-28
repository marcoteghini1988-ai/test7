# Eclissi Stellare — audit nomi e proprietà intellettuale

**Aggiornamento 28/11/2026:** l'elenco corrente è il registro
`AUDIT_NOMI_INTERNI_COMPLETO_2026-11-27.json`, aggiornato con 17 etichette
rinominate. La [tabella delle rinomine](RINOMINE_CARTE_PERSONAGGI_2026-11-28.md)
spiega anche i nomi storici che compaiono ancora nelle sezioni sottostanti.
Le ricerche esterne di tutti i 460 nomi nei registri ufficiali restano da
completare prima di descriverli come verificati commercialmente.
**Data di ricognizione:** 27 novembre 2026. **Repository:** `marcoteghini1988-ai/test7`, ramo `main`.

**Aggiornamento successivo:** dopo le ricerche UIBM/EUIPO, i nomi correnti di `E01`, `E02`, `pilot_rare_3` e `pilot_leg_3` sono **Nefelarca**, **Vortiluce**, **Mazziere dell'Etere** e **Armiere dei Tre Fronti**. Le voci storiche dei due piloti sotto vanno lette con questa correzione. L'inventario corrente completo è [qui](AUDIT_NOMI_INTERNI_COMPLETO_2026-11-27.json); risultati e limiti della ricerca sono nella [verifica dei marchi](VERIFICA_MARCHI_NOMI_PRIORITARI_2026-11-27.md). I nomi nuovi non sono certificati liberi.

## Esito sintetico
- **Rinomine effettivamente applicate nei cataloghi attuali:** 7 Boss, 1 Personaggio generico, 4 Piloti e 2 navi madri (comprese le quattro rinomine successive sopra). Gli ID sono rimasti invariati; in questa fase non sono state riprogettate le abilità.
- **Inventario di lavoro esaminato:** 161 etichette, ricavate da 12 Boss, 30 Personaggi generici, 16 Piloti Fase 16G, 48 armi del catalogo Fase 1, 22 famiglie arma progettuali, 32 Carte Sistema e 1 carta «Buco Nero».
- **Duplicazioni esatte interne** dopo normalizzazione di maiuscole, accenti, apostrofi e spazi: **0** in questi gruppi. Non equivale a escludere tutte le omonimie fra asset, varianti, giochi altrui e documenti storici.
- **Proprietà intellettuale:** ricognizione di originalità e ricerca web preliminare; **non** è un parere legale o una certificazione di libertà d’uso commerciale. La ricerca diretta esaustiva dei marchi identici/simili nei registri ufficiali **non è stata completata**.

## Rinomine dei Boss
| ID stabile | Nome precedente | Nome corrente |
|---|---|---|
| boss-character-6 | Crono il Distruttore | **Devastatore delle Ere** |
| boss-character-8 | Leviatano Abissale | **Serpe delle Fosse Abissali** |
| boss-character-9 | Signore delle Ombre | **Predone della Penombra** |
| boss-character-14 | Generatore del Caos | **Sovvertitore del Caso** |
| boss-character-17 | Cristallo di Risonanza | **Boss del Sacrificio** |
| boss-character-19 | Nucleo Magmatico | **Divoratore delle Scorie** |
| boss-character-20 | Sovrano del Vuoto | **Custode dell’Antispazio** |

Il nome **Boss del Sacrificio** è volutamente senza nome proprio davanti, come richiesto. Nel progetto il suo ID è `boss-character-17` (settore 100). Le 12 carte Boss non devono confondersi con i nomi di oggetti o macchine. Si preservano ID, rarità, ricompense e associazioni programmatiche.

## Rinomine aggiuntive
| Identificativo | Prima | Ora | Nota |
|---|---|---|---|
| `character-general-29` | Signore delle Ombre / alternativa di lavorazione Custode della Penombra | **Tracciatore del Buio Astrale** | Elimina collisione interna con il Boss |
| `pilot_epic_4` | Il Re del Ghiaccio | **Comandante della Galaverna** | Titolo da personaggio, non modifica le abilità |
| `pilot_leg_1` | Il Gran Maestro | **Stratega delle Tre Figure** | Evita somiglianza evitabile con il Gran Maestro/Grandmaster della Marvel |

**Evidenze pubbliche rilevanti:** Crono è il protagonista nominato da Square Enix in *Chrono Trigger* (https://www.square-enix-games.com/en_AU/games/chrono-trigger). «Grandmaster» è un personaggio noto nell'universo Marvel (https://www.marvel.com/comics/collection/40917/avengers_the_contest_trade_paperback). Il solo uso di parole uguali non dimostra automaticamente violazione del copyright o del marchio; per prudenza i nomi di progetto sono stati resi più distintivi.

## Nomi ufficiali dei 12 Boss (settore, nome)
- 10: **Guardiano di Gaia** — `boss-character-1`, Comune
- 20: **Colosso di Tharsis** — `boss-character-2`, Comune
- 30: **Matriarca Tossica** — `boss-character-3`, Comune
- 40: **Devastatore delle Ere** — `boss-character-6`, Rara
- 50: **Sentinella Ionica** — `boss-character-7`, Rara
- 60: **Serpe delle Fosse Abissali** — `boss-character-8`, Rara
- 70: **Predone della Penombra** — `boss-character-9`, Epica
- 80: **Idra Criogenica** — `boss-character-11`, Epica
- 90: **Sovvertitore del Caso** — `boss-character-14`, Epica
- 100: **Boss del Sacrificio** — `boss-character-17`, Leggendaria
- 110: **Divoratore delle Scorie** — `boss-character-19`, Leggendaria
- 120: **Custode dell’Antispazio** — `boss-character-20`, Leggendaria

## Inventario di lavoro dei nomi
Questi elenchi sono un controllo **interno** dei cataloghi; l'indicizzazione web individuale e l'esame dei marchi sono attività distinte.

### Personaggi generici (30)
- `character-general-01` — Medico da campo
- `character-general-02` — Ingegnere dei sistemi
- `character-general-03` — Tecnico del sacrificio
- `character-general-04` — Operatrice degli scudi
- `character-general-05` — Archivista
- `character-general-06` — Tecnico di recupero
- `character-general-07` — Capomeccanico
- `character-general-08` — Ingegnere energetico
- `character-general-09` — Ufficiale del reattore
- `character-general-10` — Coordinatore dei supporti
- `character-general-11` — Stratega di flotta
- `character-general-12` — Tecnico di conversione energetica
- `character-general-13` — Ingegnere di ricostruzione
- `character-general-14` — Maestro dell'energia
- `character-general-15` — Tecnica delle contromisure
- `character-general-16` — Tecnico delle interfacce
- `character-general-17` — Specialista di disinnesco
- `character-general-18` — Capo della manutenzione preventiva
- `character-general-19` — Medico di terapia intensiva
- `character-general-20` — Ingegnere della rete di bordo
- `character-general-21` — Artificiere di bordo
- `character-general-22` — Criotecnica
- `character-general-23` — Specialista idrostatica
- `character-general-24` — Elettrotecnico
- `character-general-25` — Comandante d’Acciaio
- `character-general-26` — Sismologo
- `character-general-27` — Pilota delle correnti
- `character-general-28` — Maestra dei fotoni
- `character-general-29` — Tracciatore del Buio Astrale
- `character-general-30` — Architetto gravitazionale

### Piloti Fase 16G (16)
- `pilot_com_1` — Cadetto Additivo
- `pilot_com_2` — Calibratore Sottrattivo
- `pilot_com_3` — Cannoniere Balistico
- `pilot_com_4` — Cecchino Quantico
- `pilot_rare_1` — Corsaro della Rivalsa
- `pilot_rare_2` — L'Adrenalinico
- `pilot_rare_3` — Mazziere dell'Etere
- `pilot_rare_4` — Mercante dei Riflessi Gemelli
- `pilot_epic_1` — L'Artificiere di Bordo
- `pilot_epic_2` — L'Alchimista Aurico
- `pilot_epic_3` — Il Viaggiatore del Tempo
- `pilot_epic_4` — Comandante della Galaverna
- `pilot_leg_1` — Stratega delle Tre Figure
- `pilot_leg_2` — Il Veggente Supremo
- `pilot_leg_3` — Armiere dei Tre Fronti
- `pilot_leg_4` — Il Lottatore di Sumo

### Armi Fase 1 (48)
- `es_common_light_01` — Gatling Cinetica
- `es_common_light_02` — Spillo Pulsar
- `es_common_light_03` — Falce di Rimbalzo
- `es_common_light_04` — Ago Gravitico
- `es_common_medium_01` — Doppio Arco Ionico
- `es_common_medium_02` — Cannone a Prisma
- `es_common_medium_03` — Turbina Fotonica
- `es_common_medium_04` — Scudo-Arpione
- `es_common_heavy_01` — Obice del Crepuscolo
- `es_common_heavy_02` — Lanciatore Leviatano
- `es_common_heavy_03` — Mortaio Gravem
- `es_common_heavy_04` — Forgia Stellare
- `es_rare_light_01` — Vespa Quantum
- `es_rare_light_02` — Gemelli Mirage
- `es_rare_light_03` — Lancia Aurora
- `es_rare_light_04` — Scintilla Nera
- `es_rare_medium_01` — Spettro Ferrico
- `es_rare_medium_02` — Lente di Nyx
- `es_rare_medium_03` — Raggio Bifronte
- `es_rare_medium_04` — Draga Volt
- `es_rare_heavy_01` — Martello Quasar
- `es_rare_heavy_02` — Arca di Tritone
- `es_rare_heavy_03` — Cataclisma Polare
- `es_rare_heavy_04` — Faro del Vuoto
- `es_epic_light_01` — Colibrì Tachionico
- `es_epic_light_02` — Sette Veli
- `es_epic_light_03` — Serpe Nebulare
- `es_epic_light_04` — Chiave del Paradosso
- `es_epic_medium_01` — Matrice Helios
- `es_epic_medium_02` — Idra Sinaptica
- `es_epic_medium_03` — Orizzonte Blu
- `es_epic_medium_04` — Corvo di Antimateria
- `es_epic_heavy_01` — Giudizio di Orione
- `es_epic_heavy_02` — Cripta del Sole
- `es_epic_heavy_03` — Anello di Marea
- `es_epic_heavy_04` — Cattedrale di Plasma
- `es_legendary_light_01` — Filo dell’Eternità
- `es_legendary_light_02` — Luce Fantasma
- `es_legendary_light_03` — Artiglio del Tempo
- `es_legendary_light_04` — Penna del Destino
- `es_legendary_medium_01` — Bussola di Andromeda
- `es_legendary_medium_02` — Corona di Eclisse
- `es_legendary_medium_03` — Biblioteca degli Astri
- `es_legendary_medium_04` — Macchina del Crepuscolo
- `es_legendary_heavy_01` — Trono della Singolarità
- `es_legendary_heavy_02` — Ultima Supernova
- `es_legendary_heavy_03` — Portale del Nulla
- `es_legendary_heavy_04` — Sentenza Cosmica

### Famiglie Arma progettuali (22)
- `weapon-design-20261126-refrigerant-marea-laterale` — Condotto di Marea Laterale
- `weapon-design-20261126-refrigerant-pressione-isobarica` — Disgregatore di Pressione Isobarica
- `weapon-design-20261126-mineral-sismico-tettonico` — Generatore Sismico Tettonico
- `weapon-design-20261126-mineral-tempeste-silicee` — Generatore di Tempeste Silicee
- `weapon-design-20261126-mineral-macigni-tettonici` — Lanciatore di Macigni Tettonici
- `weapon-design-20261126-mineral-collettore-frammenti` — Collettore di Frammenti Minerali
- `weapon-design-20261126-aerial-vortici-ciclonici` — Generatore di Vortici Ciclonici
- `weapon-design-20261126-aerial-spinta-eolica` — Turbina a Spinta Eolica
- `weapon-design-20261126-aerial-boato-cosmico` — Boato Cosmico
- `weapon-design-20261126-aerial-convertitore-cinetico` — Convertitore di Energia Cinetica
- `weapon-design-20261126-radiant-concentrazione-solare` — Cannone a Concentrazione Solare
- `weapon-design-20261126-radiant-fotoni-riflessi` — Emettitore di Fotoni Riflessi
- `weapon-design-20261126-radiant-replicatore-olografico` — Replicatore Olografico
- `weapon-design-20261126-radiant-proiettore-olografico` — Proiettore Olografico
- `weapon-design-20261126-void-eclissi-quantistica` — Lanciatore a Eclissi Quantistica
- `weapon-design-20261126-void-inversione-vitale` — Disgregatore a Inversione Vitale
- `weapon-design-20261126-void-drone-parassita` — Drone Parassita
- `weapon-design-20261126-void-estrattore-materia-oscura` — Estrattore di Materia Oscura
- `weapon-design-20261126-gravity-massa-inerziale` — Generatore di Massa Inerziale
- `weapon-design-20261126-gravity-implosore-singolarita` — Implosore a Singolarità
- `weapon-design-20261126-gravity-oscurita-gravitazionale` — Generatore di Oscurità Gravitazionale
- `weapon-design-20261126-gravity-tenebre-infinite` — Tenebre Infinite

### Carte Sistema (32) e carta controllo
- Fruscio di telemetria
- Interferenza di collegamento
- Sfasamento di formazione
- Silenzio di comando
- Riallineamento del canale
- Relè di riserva
- Trama risonante
- Rete di comando totale
- Tubo surriscaldato
- Munizioni interferite
- Alimentazione inceppata
- Arsenale in ombra
- Carica rapida
- Doppia camera
- Sovralimentazione multipla
- Furia coordinata
- Calo di tensione
- Perdita di flusso
- Scarica di ritorno
- Soffocamento del nucleo
- Condensatore ausiliario
- Flusso stabilizzato
- Nucleo potenziato
- Risonanza del Generatore
- Coordinate falsate
- Confusione della rotta
- Rotta fantasma
- Cortocircuito tattico
- Calcolo di tiro
- Navigazione assistita
- Analisi predittiva
- Strategia a fuoco
- Buco Nero


## Estensione audit — cataloghi di gioco completi al 27/11/2026

**Decisione editoriale dell'utente:** il **titolo commerciale del gioco è escluso** da questa fase; verrà scelto soltanto dopo il completamento del progetto. *Eclissi Stellare* resta un'etichetta interna di lavoro; non avviare la sua rinomina o un'altra ricerca sul titolo durante l'audit delle carte.

È disponibile il [manifest strutturato di 460 nomi correnti e 167 bozze storiche non approvate](AUDIT_NOMI_INTERNI_COMPLETO_2026-11-27.json). Le **460 denominazioni attuali** sono confrontate per grafia, maiuscole, accenti e apostrofi; **non restano duplicati testuali esatti tra i cataloghi esaminati**. Le dieci chiavi `shipId` condivise tra madri e supporti indicano l'origine del modello e non costituiscono un conflitto di identificativi delle carte.

### Cataloghi aggiunti al controllo

- 12 madri e 13 supporti indipendenti, più 13 carte Fusione supporto generate
- 120 carte esclusive delle madri (fra cui 12 Personaggi con ruoli/persona, non nomi di macchine)
- 35 Armi progettate e 27 Armi native delle madri; 22 famiglie nuove e 2 armi trasferite
- 35 moduli, 25 carte tattiche e 10 famiglie Energia; oltre ai 161 nomi già inventariati nella prima fase
- 100 proposte e 67 bozze storiche mantenute **separate** perché non approvate come carte giocabili

### Correzioni effettuate sulla versione di gioco

1. `ex-l04-01` (design `nx-l04-04`), carta Personaggio dell'Arca Astrale: **Custode Astrale → Vegliatore delle Rotte Celesti**. Esiste un videogioco con titolo italiano esatto «Custode Astrale», pubblicato il 12 aprile 2023 su Steam: https://store.steampowered.com/app/2346320/Astral_Guardian/?l=italian . Modificati cataloghi e testi UI/log/test, lasciando fissi ID e meccanica.
2. `nx-l03-02`, carta **Strategia** del Titano Ossidiana: **Obice nero → Tiro d’Assedio Ossidiano**. Era duplicata con `W38`, arma nativa «Obice Nero». L'arma W38 è rimasta invariata; sono state aggiornate le etichette della Strategia in catalogo, UI/log e test.

Le descrizioni e le etichette storiche delle vecchie bozze possono conservare il nome precedente come documentazione; **non** sono approvazioni per carte nuove o per vendita. Nessun valore HP, costo, slot, durata, ID o abilità è stato intenzionalmente modificato.

### Esito giuridico e limiti

Il controllo corrente documenta nomi e collisioni visibili, **non** attesta che 460 nomi siano legalmente liberi. Le ricerche esterne mirate non sostituiscono una ricerca per marchi identici/simili. Il modulo UIBM è accessibile, TMview non offre risultati consultabili da questa modalità e WIPO richiede una verifica automatica; nessuna ricerca esaustiva di classi 9/41 (e 28 se carte fisiche) è stata conclusa. È ancora aperto il controllo di eventuali scritte nei file grafici non presenti nei cataloghi e della licenza di immagini, musica ed effetti sonori.

## Verifica commerciale ancora da completare
1. Consultare effettivamente **UIBM**, **EUIPO/TMview** e **WIPO Global Brand Database** con nomi identici e simili (anche foneticamente e in inglese), soprattutto per **classe 9** (software e videogiochi) e **classe 41** (servizi di intrattenimento/gioco). Per un gioco di carte fisico considerare anche la **classe 28**.
2. Estendere la verifica ai **restanti asset grafici con scritte** e ad eventuali nuovi cataloghi non inclusi nel manifest di 453 nomi; il titolo commerciale del gioco è volutamente rinviato a progetto terminato.
3. Cercare eventuali nomi storici rimasti nei documenti e distinguerli dai dati usati in gioco. Non rinominare mai ID persistenti o chiavi dei salvataggi solo per cambiare un'etichetta visibile.
4. Prima del Play Store, fare una valutazione professionale delle collisioni realmente rilevanti, separando **nomi/marchi**, **titoli**, e **opere grafiche/audio**.

**Fonti ufficiali sulle ricerche di marchi:** https://www.euipo.europa.eu/en/trade-marks/before-applying/availability ; https://www.euipo.europa.eu/it/help-centre/tm/faq-search-availability ; https://www.uibm.gov.it/bancadati/ ; https://www.tmdn.org/tmview/ ; https://branddb.wipo.int/ .

**Avvertenza metodologica:** l'assenza di risultati nei motori di ricerca non equivale all'assenza di marchi. Secondo EUIPO, anche un controllo senza coincidenze non esclude conflitti con diritti anteriori.

## Seconda ricognizione — Strategia, cataloghi aggiuntivi e diritti (27/11/2026)

**Nomenclatura approvata:** ci sono **Carte Arma** e **Carte Strategia**, non una categoria «Carte Attacco». Le chiavi tecniche `attack` e `offense` possono restare, così come «attacco» nella descrizione di un colpo, nei ruoli dei piloti e nei documenti storici. La categoria *visibile* per `offense` è stata corretta da ATTACCO a STRATEGIA in `src/officialSpecialCardIdentity.js` e `src/officialSpecialVisualMeta.js`, con test aggiornati.

**Inventario ampliato a 460 etichette correnti** (+7): i 33 comandanti di `src/commanderAbilities.js` comprendono due Piloti aggiuntivi (L'Amante del Rosso, L'Amante del Nero) e cinque alias della famiglia comandante boss non inclusi nei 12 Boss giocabili (Arconte Solare, Vegliardo del Vortice, Colosso di Metano, Titano d'Acciaio, Entità della Discordia). Gli altri riferimenti allo stesso Boss sono alias e non nuove identità. Rimangono 167 nomi di bozze storiche separati. **Nessun duplicato normalizzato nel perimetro delle 460 definizioni**, ma non è la prova che tutto il codice e tutti gli asset siano stati controllati.

### Rinomine precauzionali applicate

| Identificativo stabile | Vecchio nome | Nome corrente | Motivo |
|---|---|---|---|
| `pilot_rare_1` | Il Vendicatore | **Corsaro della Rivalsa** | «Il vendicatore» è titolo italiano di *The Punisher*, associato al personaggio Marvel (https://www.imdb.com/it/title/tt0098141/). Il nuovo nome evita una coincidenza non necessaria, non certifica la disponibilità del marchio |
| `planet_char_6` | Saturno · Crono | **Saturno · Contromossa degli Anelli** | Rimuove «Crono» dall'etichetta del modulo, differenziandolo dal personaggio omonimo del videogioco *Chrono Trigger*; il nome mitologico in sé non comporta automaticamente violazione |

Il primo cambio è salvato nei cataloghi `newCombat/phase16GPilots.js`, `commanderAbilities.js` e `pilotsSystem.jsx` (anche monogramma del ritratto). Il secondo è soltanto la stringa del modulo in `newCombat/phase16FModules.js`: soglie, carica, effetto e ID sono invariati. Altri usi storici di «Crono» compaiono in testi, log e test di meccaniche: non sono stati sostituiti indistintamente per non modificare comportamenti.

### Asset e copyright: verifica separata

La scansione dei percorsi nel repository ha individuato **320 PNG, 33 JPG, 51 WebP, 169 SVG, 1 GIF, 3 MP4 e 1 font TTF** (inclusi file sorgenti, anteprime e collaudi). Non è stato individuato un file generale `LICENSE` o `ATTRIBUTION`: questo **non dimostra che gli asset siano illeciti**, ma non consente di verificarne automaticamente le licenze e la provenienza. Va compilato un registro dei soli elementi effettivamente inclusi nel prodotto distribuito: illustrazioni, font, musiche, effetti audio, video e risorse software di terze parti.

**Conclusione commerciale al 27 novembre:** nomi e grafica non sono dichiarati «liberi da copyright». La ricerca delle anteriorità nei registri ufficiali per marchi identici/simili, classi 9 e 41 (e 28 per carte fisiche), e la verifica dei diritti degli asset restano aperte. L'<https://www.euipo.europa.eu/en/trade-marks/before-applying/availability> spiega che coincidono o possono confliggere anche segni simili e che una ricerca preliminare non garantisce piena disponibilità.

### Terza collisione individuata nello screening esterno del 27/11

Il nome del pilota `pilot_rare_4`, **Il Collezionista di Specchi**, corrisponde esattamente al titolo del romanzo omonimo di Salvatore Niffoi, pubblicato nel 2024 da La nave di Teseo: https://lanavediteseo.eu/portfolio/il-collezionista-di-specchi/ . Per evitare una coincidenza non necessaria è stato rinominato **Mercante dei Riflessi Gemelli** in tutti e tre i cataloghi sorgente del pilota. Identificativo, effetti, rarità e costo non cambiano. La coincidenza con un libro non implicherebbe automaticamente una violazione; la rinomina è una misura prudenziale, non un esito ufficiale dei registri marchi.
