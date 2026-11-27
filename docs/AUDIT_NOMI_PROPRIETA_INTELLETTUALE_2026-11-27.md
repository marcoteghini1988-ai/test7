# Eclissi Stellare — audit nomi e proprietà intellettuale
**Data di ricognizione:** 27 novembre 2026. **Repository:** `marcoteghini1988-ai/test7`, ramo `main`.

## Esito sintetico
- **Rinomine effettivamente applicate nei cataloghi attuali:** 7 Boss, 1 Personaggio generico, 2 Piloti (uno epico e uno leggendario). Gli ID sono rimasti invariati; in questa fase non sono state riprogettate le abilità.
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
- `pilot_rare_1` — Il Vendicatore
- `pilot_rare_2` — L'Adrenalinico
- `pilot_rare_3` — Il Baro
- `pilot_rare_4` — Il Collezionista di Specchi
- `pilot_epic_1` — L'Artificiere di Bordo
- `pilot_epic_2` — L'Alchimista Aurico
- `pilot_epic_3` — Il Viaggiatore del Tempo
- `pilot_epic_4` — Comandante della Galaverna
- `pilot_leg_1` — Stratega delle Tre Figure
- `pilot_leg_2` — Il Veggente Supremo
- `pilot_leg_3` — Il Fissatore
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

## Verifica commerciale ancora da completare
1. Consultare effettivamente **UIBM**, **EUIPO/TMview** e **WIPO Global Brand Database** con nomi identici e simili (anche foneticamente e in inglese), soprattutto per **classe 9** (software e videogiochi) e **classe 41** (servizi di intrattenimento/gioco). Per un gioco di carte fisico considerare anche la **classe 28**.
2. Estendere l'inventario a tutte le altre serie di carte, alle carte esclusive delle navi, ai supporti, alle navi e al **titolo del gioco**, inclusi gli asset grafici con testo. I 161 nomi sopra non rappresentano la totalità degli asset del repository.
3. Cercare eventuali nomi storici rimasti nei documenti e distinguerli dai dati usati in gioco. Non rinominare mai ID persistenti o chiavi dei salvataggi solo per cambiare un'etichetta visibile.
4. Prima del Play Store, fare una valutazione professionale delle collisioni realmente rilevanti, separando **nomi/marchi**, **titoli**, e **opere grafiche/audio**.

**Fonti ufficiali sulle ricerche di marchi:** https://www.euipo.europa.eu/en/trade-marks/before-applying/availability ; https://www.euipo.europa.eu/it/help-centre/tm/faq-search-availability ; https://www.uibm.gov.it/bancadati/ ; https://www.tmdn.org/tmview/ ; https://branddb.wipo.int/ .

**Avvertenza metodologica:** l'assenza di risultati nei motori di ricerca non equivale all'assenza di marchi. Secondo EUIPO, anche un controllo senza coincidenze non esclude conflitti con diritti anteriori.
