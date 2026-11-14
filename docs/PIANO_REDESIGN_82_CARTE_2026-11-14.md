# Eclissi Stellare — Piano di ridisegno delle 82 carte ufficiali (14 novembre 2026)

**STATO: BRIEF ARTISTICO, non asset prodotti né integrazione completata.** Questo documento non cambia le meccaniche. Le illustrazioni vengono decise partendo dagli **ID reali** di `src/officialSpecialCardArt.js`, `src/bossCharacterCards.js` e `src/pvpTerrainCards.js`.

## Principi non negoziabili

- Conservare integralmente la **plancia 3D ufficiale 9:16** e i modelli navicelle; non tornare a una schermata tipo sito web.
- **Artwork narrativo diverso su ogni carta:** nave, personaggio, arma, oggetto, ambiente e azione visibili. Vietati simboli geometrici come soggetto unico. Il riferimento qualitativo è il PNG `boss-character-1.png`.
- Design su carte verticali **512×768 minimo**, stessa proporzione della mano attuale. I personaggi mostrano un protagonista; l'attacco l'impatto; la difesa l'intercettazione; il terreno una scena.
- Nome e categoria leggibili; le **rarità esistenti** restano fedeli al catalogo. Non inventare costi, ATK, DEF, punti vita, danni o abilità.
- **Le meccaniche aggiornate di flotta vincono sulle descrizioni legacy**: descrizioni che parlano di numeriche, vecchia barriera o Poker richiedono un audit prima di finire sulla carta. Nessun valore deve essere ripreso dall'anteprima grafica sperimentale.
- Non creare nuove carte, ID o salvataggi: sostituire esclusivamente le immagini realmente usate dalla collezione e dalla battaglia, dopo approvazione dello standard visivo.
- Terreni: conservare gli sfondi d'arena; per la **carta** usare una composizione dedicata/riquadrata della scena. Non alterare lo sfondo.

## Scene da illustrare (82 ID del catalogo)

### Tattiche e supporti (25)

| ID esistente | Ruolo | Scena illustrata — proposta, non nuova abilità |
|---|---|---|
| `fusion-barrier` | FUSIONE | Scudiera corazzata schierata davanti alla madre; campo di protezione azzurro che devia una salva in arrivo |
| `fusion-strike` | FUSIONE | Scudiera agganciata alla madre; condotti energetici arancioni alimentano il cannone centrale |
| `fusion-twin` | FUSIONE | Due scudiere a tenaglia intorno alla madre, scudi sovrapposti e traiettorie nemiche spezzate |
| `fusion-triad` | FUSIONE | Formazione triangolare madre e due scudiere, cannone centrale acceso e campi coordinati |
| `tactical-cover` | TATTICA | Una scudiera si interpone fisicamente tra nave madre e missile in arrivo; scintille sulla corazza |
| `shot-piercing` | ATTACCO | Proiettile perforante attraverso il rivestimento metallico di una nave nemica; cratere d'impatto |
| `shot-ion` | ATTACCO | Cannone di una nave emette scariche ioniche ramificate che disattivano i sensori avversari |
| `shot-corrosion` | ATTACCO | Sciame corrosivo verde erode le piastre di una nave, lasciando fenditure incandescenti |
| `support-shield-repair` | SUPPORTO | Droni ricuciono un campo difensivo infranto intorno alla nave madre |
| `support-status-purge` | SUPPORTO | Onda di purificazione attraversa scafo e sensori espellendo vapori tossici e interferenze |
| `support-escort-repair` | SUPPORTO | Bracci meccanici e droni sostituiscono una piastra danneggiata su una scudiera |
| `tactic-quantum-dice` | TATTICA | Dado poliedrico quantistico sospeso in un reattore, sei facce che brillano di energie distinte |
| `tactic-bomb` | TATTICA | Dispositivo esplosivo futuristico innestato nella console avversaria, conto alla rovescia visivo |
| `tactic-malus` | TATTICA | Rete di sabotaggio cremisi oscura gli ologrammi di puntamento di una nave nemica |
| `tactic-golden` | TATTICA | Una carta tecnologica si trasmuta in oro liquido in una camera alchemica stellare |
| `tactic-vulnerability-rift` | TATTICA | Faglia spaziale viola apre una traiettoria luminosa verso un componente della nave nemica |
| `tactic-signature-mutation` | TATTICA | Centralina olografica riorganizza codici energetici e tracce intorno a un vitale |
| `tactic-power-shift` | TATTICA | Condotti di energia vengono deviati da un reattore verso torrette della nave madre |
| `tactic-scan` | TATTICA | Scansione tridimensionale rivela quattro punti vitali luminosi di una nave rivale |
| `tactic-suppress` | TATTICA | Impulso di disturbo immobilizza temporaneamente una scudiera con anelli elettromagnetici |
| `tactic-counter` | TATTICA | Batteria difensiva intercetta con un raggio luminoso un colpo mirato in volo |
| `tactic-reactive` | TATTICA | Piastre corazzate articolate emergono dallo scafo durante un impatto ravvicinato |
| `tactic-kinetic` | TATTICA | Cannone elettromagnetico accelera una massa metallica in un tunnel di energia |
| `tactic-impact` | TATTICA | Schermo cinetico semicircolare devìa un'esplosione davanti alla prua |
| `tactic-numeric-recycle` | TATTICA | Terminale di ricambio tattico con carte olografiche riorganizzate; DA VERIFICARE: vecchio riferimento alle numeriche |

### Oggetti epici (6)

| ID esistente | Ruolo | Scena illustrata — proposta, non nuova abilità |
|---|---|---|
| `epic_item_1` | EPICO | Anello bifasico impossibile con due nastri metallici intrecciati, sospeso nel vuoto stellare |
| `epic_item_6` | EPICO | Pendolo d'entropia cristallino fra due istanti temporali e orologi cosmici infranti |
| `epic_item_7` | EPICO | Monolite dielettrico scolpito da fulmini viola su una luna senza atmosfera |
| `epic_item_8` | EPICO | Calice di drenaggio tecnologico che cattura energia cremisi e la converte in luce |
| `epic_item_9` | EPICO | Matrice di probabilità: un prisma quantistico con traiettorie multiple convergenti |
| `epic_item_3` | EPICO | Astrolabio stellare tridimensionale, archi meccanici intorno a una mappa di costellazioni |

### Moduli zodiacali (12)

| ID esistente | Ruolo | Scena illustrata — proposta, non nuova abilità |
|---|---|---|
| `module-card-aries` | MODULO | Ariete meccanico da sfondamento tra onde d'urto e detriti incandescenti |
| `module-card-taurus` | MODULO | Toro biotecnologico d'acciaio alimenta una camera di rigenerazione organica |
| `module-card-gemini` | MODULO | Due piloti androidi sincronizzano scelte e ologrammi tattici speculari |
| `module-card-cancer` | MODULO | Crosta a chele blindate avvolge una nave in manovra protettiva |
| `module-card-leo` | MODULO | Leone stellare armato ruggisce davanti a un cannone ad alta energia |
| `module-card-virgo` | MODULO | Cecchino astrale di precisione illumina il punto debole di una nave |
| `module-card-libra` | MODULO | Due piatti di energia bilanciano drenaggio e rigenerazione tra scafi avversari |
| `module-card-scorpio` | MODULO | Scorpione biomeccanico emette un raggio tracciante dal pungiglione |
| `module-card-sagittarius` | MODULO | Arciere cosmico tende un arco di particelle davanti a una distorsione temporale |
| `module-card-capricorn` | MODULO | Creatura corazzata montana assorbe un impatto di meteoriti con l'armatura |
| `module-card-aquarius` | MODULO | Custode acquatico riversa un fluido energetico azzurro in un generatore stellare |
| `module-card-pisces` | MODULO | Due creature luminose orbitano in spirale intorno a un nucleo di energia |

### Moduli planetari e rari (23)

| ID esistente | Ruolo | Scena illustrata — proposta, non nuova abilità |
|---|---|---|
| `module-card-planet_char_1` | MODULO | Corazza di Gaia: guscio tellurico ricopre una nave di radici minerali |
| `module-card-planet_char_2` | MODULO | Bombardamento di Marte: batterie su altopiano rosso lanciano missili in orbita |
| `module-card-planet_char_3` | MODULO | Venere: vapori dorati riconfigurano un dispositivo tattico su banco tecnologico |
| `module-card-planet_char_4` | MODULO | Mercurio: caricatore quantico sospeso sopra pianura metallica al sole |
| `module-card-planet_char_5` | MODULO | Giove: vortice ciclonico alimenta scudiere sopra una fascia tempestosa |
| `module-card-planet_char_6` | MODULO | Saturno: anelli planetari piegano lo spazio attorno a un cronometro futuristico |
| `module-card-planet_char_7` | MODULO | Urano: una nave blu trasmette energia ionica ad antenne orientate al cielo |
| `module-card-planet_char_8` | MODULO | Nettuno: onda abissale spaziale travolge una nave in uno scenario oscuro |
| `module-card-planet_char_9` | MODULO | Plutone: vortice nero assorbe fasci luminosi da una nave avversaria |
| `module-card-planet_char_10` | MODULO | Titano: metano ghiacciato crea una corazza traslucida attorno a una nave |
| `module-card-planet_char_11` | MODULO | Europa: cristalli criogenici ricostruiscono un componente danneggiato |
| `module-card-planet_char_12` | MODULO | Ganimede: bobine ferromagnetiche fermano un colpo in arrivo |
| `module-card-planet_char_13` | MODULO | Kepler: risonanza di stelle multiple potenzia il cannone di una nave |
| `module-card-planet_char_14` | MODULO | Proxima b: torre di purificazione dissolve un segnale ostile rosso |
| `module-card-planet_char_15` | MODULO | TRAPPIST-1e: arconte metallico sovrasta una formazione di battaglia |
| `module-card-planet_char_16` | MODULO | Gliese: campi azzurri sintetizzano energia da una nube cosmica |
| `module-card-planet_char_17` | MODULO | Haumea: propulsore cinetico sovralimenta una scudiera in volo |
| `module-card-planet_char_18` | MODULO | Eris: eco di disturbo viola interrompe il bersaglio nel mirino nemico |
| `module-card-planet_char_19` | MODULO | Io: eruzione magmatica investe una torretta spaziale |
| `module-card-planet_char_20` | MODULO | Encelado: getti ghiacciati si raccolgono attorno a un reattore di riparazione |
| `module-card-singularity_core` | MODULO | Nucleo a buco nero confinato da anelli superconduttori spezzati |
| `module-card-ophiuchus` | MODULO | Serpente cosmico avvolto a un serpentinario corazzato, plasma sui bordi |
| `module-card-supreme_eclipse` | MODULO | Eclissi stellare totale sopra una flotta, radiali di energia dal disco nero |

### Personaggi Boss (12)

| ID esistente | Ruolo | Scena illustrata — proposta, non nuova abilità |
|---|---|---|
| `boss-character-1` | PERSONAGGIO | Guardiano di Gaia: ritratto integrale del guardiano corazzato, energia tellurica; mantenere se già di livello adeguato |
| `boss-character-2` | PERSONAGGIO | Colosso di Tharsis: titano marziano in armatura con crateri rossi alle spalle |
| `boss-character-3` | PERSONAGGIO | Matriarca Tossica: figura regale biomeccanica circondata da spore verdi |
| `boss-character-6` | PERSONAGGIO | Crono il Distruttore: guerriero meccanico davanti a un orologio gravitazionale |
| `boss-character-7` | PERSONAGGIO | Sentinella Ionica: sentinella corazzata blu con gabbia elettrica |
| `boss-character-8` | PERSONAGGIO | Leviatano Abissale: creatura titanica corazzata in profondità spaziale |
| `boss-character-9` | PERSONAGGIO | Signore delle Ombre: figura incappucciata d'energia oscura su ponte astrale |
| `boss-character-11` | PERSONAGGIO | Idra Criogenica: idra con colli di ghiaccio traslucido e vapori freddi |
| `boss-character-14` | PERSONAGGIO | Generatore del Caos: entità cybernetica attorno a reattore instabile |
| `boss-character-17` | PERSONAGGIO | Cristallo di Risonanza: sovrano cristallino con armoniche azzurre |
| `boss-character-19` | PERSONAGGIO | Nucleo Magmatico: colosso di lava e metallo fuso |
| `boss-character-20` | PERSONAGGIO | Sovrano del Vuoto: comandante nero e viola che domina una faglia cosmica |

### Terreni PvP (4)

| ID esistente | Ruolo | Scena illustrata — proposta, non nuova abilità |
|---|---|---|
| `terrain-debris` | TERRENO | Campo di Detriti: relitti, meteoriti e piattaforme industriali in prospettiva |
| `terrain-plasma` | TERRENO | Faglia di Plasma: pianura incandescente e nebbie energetiche arancioni |
| `terrain-ionic` | TERRENO | Tempesta Ionica: pioggia elettrica azzurra fra torri e nubi stellari |
| `terrain-resonance` | TERRENO | Camera Astrale: archi cristallini e onde di risonanza nello spazio profondo |

## Controlli prima di dichiarare completato il lavoro

1. Verificare per ogni ID l'immagine PNG con nome e categoria corretti, resa HD e soggetto ben distinguibile dalle altre carte.
2. Verificare i PNG nella collezione e in mano a scala telefono, con un gesto per vedere la carta completa senza rimpicciolirla.
3. Verificare immagini e comportamento dei 12 Personaggi Boss e dei 4 Terreni, inclusi sblocchi e restrizioni reali.
4. Riconciliare prima del rilascio le descrizioni legacy con `fleetCardEffect`; non reintrodurre scudi universali, carte numeriche o nuove risorse non richieste.
5. Eseguire build React/Vite, suite test e controllo sul dispositivo. Solo dopo questi controlli assegnare lo stato "completato".

**Progressione verificata nel codice:** deck da 24 speciali; 5 in mano. Il set iniziale usa 6 tipi ripetuti, quindi la bassa varietà iniziale non si risolve solo ridisegnando le carte.
