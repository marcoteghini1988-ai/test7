# Eclissi Stellare — bilanciamento Carte Arma (revisione 2)

**Data:** 21 novembre 2026 · **Repository:** `marcoteghini1988-ai/test7` (`main`).

## Campo di intervento

Tutte le **73 Carte Arma giocabili** sono state riesaminate: 69 nuove nel mazzo acquistabile e 4 armi storiche. Questa è una **calibrazione provvisoria verificabile nel codice**, non il bilanciamento definitivo del gioco; il PvP reale non è stato ancora validato statisticamente.

Le Armi sottraggono HP tramite gli slot Arma (massimo 2). Le Carte Attacco modificano condizioni e variabili e non vengono riclassificate. Le due navicelle di supporto non attaccano, le Difese/Trappole restano applicabili, i Terreni agiscono solo ove previsto e il vantaggio elementale rimane +25% / svantaggio −25%.

- Navi madri leggendarie: 820–1.200 HP; attacco base 95–155, difesa percentuale già definita.
- Ritmo di riferimento non imposto: PvP 4–6 minuti; boss 8–10 minuti.
- Fascia delle Armi **base semplici**: Comune 18–31 HP; Rara 33–38 HP. Le Armi condizionali sono valutate per impatto e durata complessiva, non soltanto per il primo colpo.
- Le capacità che durano più turni occupano uno slot Arma; il bersaglio, le difese, la sincronizzazione e l'affinità elementale modificano l'effettivo danno finale.

## Correzioni v2

| Problema | Correzione |
| --- | --- |
| Coppia Balestra/Dardiera troppo debole | 18 HP + 24 HP, bonus cristallo +16 HP (58 HP totali prima di Difese e bonus). |
| Raffiche Acqua/Ghiaccio deboli rispetto al costo di carta | Gemellata 2×18; Pistoni 18×2 turni; Scarica Brina 24 + fino a 2×12 con Energia. |
| Colpi multipli troppo deboli oppure superiori alle Armi di categoria | Tre Ugelli 3×14; Dardi Polari 3×10; Lanciafiamme 11 HP per bersaglio; Idrocannone 21 HP×2 turni. |
| Torretta con Personaggio poco incisiva | Piroclastica 30 HP (+35% con Artificiere). |
| Accumulatore Boreale sottodimensionato | Singolo impatto da 16+20=36 HP, una sola verifica difensiva. |
| Crescita illimitata Cannone dei Frammenti | Danno nominale massimo 120 HP; preservati +10 per Attacco scartato e ×2 Fuoco. |
| Bruciatura variabile con tanti scarti | Inceneritore limitato a 12 HP per attivazione periodica, sempre 5 turni. |
| Blocco della mano troppo lungo | Cicloreattore 2/3/4 secondi (invece di 2/4/6) nei tre stadi. |

## Registro completo delle 73 Carte Arma

La colonna **valore / effetto** descrive il danno nominale senza riduzioni dei bersagli; i profili con condizioni variabili sono riportati nelle note. Il numero di turni include la giocata.

| # | Elemento | Carta Arma | Rarità | Turni | Danno nominale | Effetto o condizione |
| ---: | --- | --- | --- | ---: | --- | --- |
| 1 | Fulmine | Cannone a Pettine Ionico di Vega | Comune | 1 | 20 HP | Un impatto autonomo, soggetto a Difese e Terreno. |
| 2 | Fulmine | Lanciadardi a Spirale di Tesla | Comune | 1 | 24 HP | Un impatto autonomo, soggetto a Difese e Terreno. |
| 3 | Fulmine | Sferzatore Ionico di Rame Lunare | Comune | 1 | 28 HP | Un impatto autonomo, soggetto a Difese e Terreno. |
| 4 | Fulmine | Cannone del Lampo Bianco | Rara | 1 | 34 HP | Un impatto autonomo, soggetto a Difese e Terreno. |
| 5 | Terra | Lanciagruppi di Selce | Comune | 1 | 21 HP | Un impatto autonomo, soggetto a Difese e Terreno. |
| 6 | Terra | Battipalo di Magnetite | Comune | 1 | 26 HP | Un impatto autonomo, soggetto a Difese e Terreno. |
| 7 | Terra | Obice della Crosta Spaccata | Rara | 1 | 35 HP | Un impatto autonomo, soggetto a Difese e Terreno. |
| 8 | Vento | Lancia di Pressione Lamellare | Comune | 1 | 19 HP | Un impatto autonomo, soggetto a Difese e Terreno. |
| 9 | Vento | Cannone Vorticatore a Doppia Turbina | Comune | 1 | 25 HP | Un impatto autonomo, soggetto a Difese e Terreno. |
| 10 | Vento | Arpione di Bora Astrale | Rara | 1 | 33 HP | Un impatto autonomo, soggetto a Difese e Terreno. |
| 11 | Luce | Raggio Tracciante di Eliotropio | Comune | 1 | 22 HP | Un impatto autonomo, soggetto a Difese e Terreno. |
| 12 | Luce | Batteria a Ventaglio di Fotoni Curvi | Comune | 1 | 27 HP | Un impatto autonomo, soggetto a Difese e Terreno. |
| 13 | Luce | Cannone Incisore dell'Alba | Comune | 1 | 30 HP | Un impatto autonomo, soggetto a Difese e Terreno. |
| 14 | Luce | Cannone ad Anello del Sole Spezzato | Rara | 1 | 36 HP | Un impatto autonomo, soggetto a Difese e Terreno. |
| 15 | Ombra | Perforatore dell'Antiluce | Comune | 1 | 18 HP | Un impatto autonomo, soggetto a Difese e Terreno. |
| 16 | Ombra | Cannone di Cenere Nera | Comune | 1 | 23 HP | Un impatto autonomo, soggetto a Difese e Terreno. |
| 17 | Ombra | Lama d’Eclisse Franta | Comune | 1 | 29 HP | Un impatto autonomo, soggetto a Difese e Terreno. |
| 18 | Ombra | Fucile del Crepuscolo Profondo | Rara | 1 | 37 HP | Un impatto autonomo, soggetto a Difese e Terreno. |
| 19 | Gravità | Martello a Massa Piegata | Comune | 1 | 22 HP | Un impatto autonomo, soggetto a Difese e Terreno. |
| 20 | Gravità | Cannone Fusore a Orbite Gemelle | Comune | 1 | 26 HP | Un impatto autonomo, soggetto a Difese e Terreno. |
| 21 | Gravità | Emettitore a Catenaria di Distorsione | Comune | 1 | 31 HP | Un impatto autonomo, soggetto a Difese e Terreno. |
| 22 | Gravità | Obice a Compressione Assiale | Rara | 1 | 38 HP | Un impatto autonomo, soggetto a Difese e Terreno. |
| 23 | Ghiaccio | Balestra di Nebbia Gelata | Comune | 1 | 18 HP (combo +16 HP) | Colpo diretto alla madre; cristallo positivo/negativo, la polarità opposta attiva una reazione (una volta). |
| 24 | Ghiaccio | Dardiera della Brina Inversa | Rara | 1 | 24 HP (combo +16 HP) | Colpo diretto alla madre; cristallo positivo/negativo, la polarità opposta attiva una reazione (una volta). |
| 25 | Fuoco | Cannone a Nucleo Incandescente | Comune | 1 | 28 HP | Un colpo autonomo. |
| 26 | Metallo | Maglio Ferrogravitazionale | Comune | 1 | 30 HP | Un colpo autonomo. |
| 27 | Metallo | Cannone a Slitta d'Acciaio | Comune | 1 | 24 HP | Un colpo autonomo. |
| 28 | Acqua | Cannone a Compressione Abissale | Comune | 1 | 26 HP | Colpo autonomo. |
| 29 | Acqua | Batteria Idrobalistica Gemellata | Rara | 1 | 2 × 18 HP | Due colpi separati. |
| 30 | Ghiaccio | Torretta a Pistoni Glaciali | Comune | 2 | 18 HP × 2 turni | Un colpo per turno proprio. |
| 31 | Ghiaccio | Obice a Frantumazione Polare | Comune | 1 | 12 HP per nave | Colpisce tutte le navicelle avversarie operative. |
| 32 | Ghiaccio | Batteria a Scarica di Brina | Epica | 1 | 24 + fino a 2 × 12 HP | Bonus con Energie Ghiaccio in pila, senza consumo. |
| 33 | Fuoco | Mortaio Magmatico | Rara | 3 | Variabile | Per 3 tuoi turni spara 20 HP, più fino a 2 colpi extra da 8 HP. Ogni colpo extra consuma una carica fisica Energia Fuoco; le cariche rimanenti e gli altri elementi restano nella pila. |
| 34 | Fuoco | Inceneritore a Plasma Rotante | Epica | 2 | Variabile | Spara 22 HP e 16 HP al turno successivo. Il primo colpo riuscito applica una bruciatura di 5 turni: 2 HP per propria Carta Attacco negli scarti al momento dell'impatto, minimo 2 HP e massimo 12 HP per turno, senza ricalcolo. |
| 35 | Fuoco | Cannone Binario a Sovraccarico | Leggendaria | 5 | Variabile | Per 5 tuoi turni: colpo dell'8% degli HP massimi nemici, perdita del 6% degli HP massimi della tua madre, colpo del 16%, perdita del 4% degli HP massimi di ogni alleata operativa, poi 20% a ogni nave nemica. I costi possono essere letali. |
| 36 | Fuoco | Cannone Accoppiatore Termofagico | Epica | 2 | Variabile | Richiede Sistema Binario installato. Spara 20 HP per 2 tuoi turni, costa il 3% HP massimi della madre al primo utilizzo e restituisce il 2% HP massimi se colpisce. Potenzia di 30 HP il colpo finale del Binario. |
| 37 | Fuoco | Obice a Crogiolo Pressurizzato | Rara | 1 | Variabile | Colpo autonomo: 32 HP contro una navicella di supporto, 22 HP contro la nave madre; senza consumo Energia o bruciatura. |
| 38 | Fuoco | Batteria Termica a Tre Ugelli | Rara | 1 | Variabile | Tre colpi autonomi da 14 HP, risolti separatamente con le Difese. |
| 39 | Fuoco | Lanciafiamme a Ventaglio | Comune | 1 | Variabile | Un colpo da 11 HP su ciascuna navicella avversaria operativa, incluse le due di supporto e la madre. |
| 40 | Fuoco | Torretta di Puntamento Piroclastico | Rara | 1 | Variabile | Un colpo da 30 HP, aumentato del 35% se il Personaggio Artificiere di Bordo è effettivamente attivo. |
| 41 | Fuoco | Cannone Condensatore Pirobalistico | Rara | 1 | Variabile | Un colpo da 18/30/42 HP secondo 0/1/2 Energie Fuoco fisiche disponibili; consumo futuro da definire. |
| 42 | Ghiaccio | Perforatore dell’Inverno Nero | Comune | 1 | Variabile | Colpisce entrambi i supporti per 12 HP ciascuno. Con Terreno Ghiaccio: 15 HP ciascuno e 30 HP perforanti alla madre; il perforante ignora le Difese ordinarie. Danni per rarità da ribilanciare. |
| 43 | Ghiaccio | Cannone a Condensazione Glaciale | Comune | 1 | Variabile | Un colpo Ghiaccio da 20 HP nominali sul bersaglio scelto; valori di bilanciamento provvisori. |
| 44 | Ghiaccio | Batteria di Dardi Polari | Comune | 1 | Variabile | Tre colpi da 10 HP distribuibili fra madre e supporti, ciascuno soggetto alle Difese. |
| 45 | Ghiaccio | Cannone Acceleratore Boreale | Rara | 1 | Variabile | Unisce due impulsi Ghiaccio da 16 e 20 HP in un singolo colpo da 36 HP sul bersaglio scelto, con una verifica difensiva. |
| 46 | Ghiaccio | Cannone a Compressione Criogenica d’Impulso | Rara | 1 | Variabile | Un colpo da 18 HP più 10 HP per carica Ghiaccio presente, fino a due cariche; consumo non specificato, non sottrae Energie automaticamente. |
| 47 | Acqua | Idrocannone a Doppia Mandata | Rara | 2 | Variabile | Un colpo da 21 HP per due turni propri consecutivi; due colpi totali. |
| 48 | Acqua | Torretta Crioguidata | Rara | 1 | Variabile | Spara 22 HP. Con un Personaggio attivo spara anche 14 HP su un bersaglio diverso, se disponibile. |
| 49 | Acqua | Cannone di Bassa Marea | Rara | 2 | Variabile | Un colpo da 14 HP e 2 HP extra per ciascuna carta nei due scarti (massimo 30 contate); prepara Cannone di Alta Marea per il turno proprio successivo. |
| 50 | Acqua | Cannone di Alta Marea | Epica | 1 | Variabile | Giocabile solo nel turno proprio successivo a Cannone di Bassa Marea. Travolge le Difese e le Trappole di entrambi i giocatori e colpisce con 4 volte la potenza caricata, massimo 120 HP. |
| 51 | Acqua | Diffusore di Marea a Ventaglio | Rara | 1 | Variabile | Con zero/una/due Energie Acqua in pila colpisce rispettivamente una nave da 24 HP, due navi da 18 HP ciascuna, o tre navi da 16 HP ciascuna. Energie non consumate finché non è definito il relativo costo. |
| 52 | Acqua | Ariete delle Fosse Abissali | Rara | 1 | Variabile | Un colpo da 22/36/48 HP secondo zero/una/due Energie Acqua presenti. Valori da bilanciare. |
| 53 | Metallo | Artiglieria delle Schegge Erranti | Rara | 2 | Variabile | Un colpo da 20 HP nel turno di posa e uno nel proprio turno successivo, scegliendo un bersaglio differente quando possibile. |
| 54 | Metallo | Artiglieria Termobalistica di Recupero | Epica | 2 | Variabile | Un colpo autonomo da 18 HP più il 60% degli HP realmente persi dalla tua flotta da quando l'arma è installata (massimo +54 HP). Due turni, non si combina con Artiglieria. |
| 55 | Metallo | Batteria di Rivetti Magnetici | Comune | 1 | Variabile | Tre colpi autonomi da 10 HP distribuibili tra bersagli diversi. |
| 56 | Metallo | Obice a Pioggia di Schegge | Comune | 1 | Variabile | Un colpo Metallo autonomo da 27 HP sul bersaglio scelto. |
| 57 | Metallo | Arpioni a Ganasce Magnetiche | Rara | 2 | Variabile | Due arpioni infliggono 14 HP a due navicelle diverse; se colpiscono, conservano i bersagli agganciati per Cannone Collassatore di Lega nel tuo turno successivo. |
| 58 | Metallo | Cannone Collassatore di Lega | Epica | 1 | Variabile | Richiede Arpioni a Ganasce Magnetiche nel turno proprio precedente; fa collidere i bersagli agganciati infliggendo 24 HP ciascuno (Difese individuali). |
| 59 | Metallo | Frantumatore a Induzione | Epica | 1 | Variabile | Un colpo da 22 HP. Con una Energia Metallo supera una Difesa valida, con due la distrugge e colpisce. Valori da bilanciare. |
| 60 | Metallo | Perforatore a Cascata | Epica | 3 | Variabile | Per 3 tuoi turni spara 38 HP. Se distrugge un bersaglio, può trasferire i danni eccedenti al successivo spendendo 1 carica Energia Metallo; ogni bersaglio verifica la propria Difesa. |
| 61 | Metallo | Impattatore del Comandante d’Acciaio | Rara | 1 | Variabile | Colpo autonomo da 26 HP. Con Personaggio Comandante compatibile, il danno sale a 34 HP se la madre ha perso almeno il 25% degli HP o a 42 HP se ne ha persi almeno il 50%. |
| 62 | Fulmine | Cannone a Nucleo di Folgore Crescente | Rara | 3 | Variabile | Spara 24/36/54 HP in 3 turni; per salire allo stadio successivo occorre giocare una nuova Energia Fulmine a ogni turno proprio e consumarne una carica. Se un caricamento manca, resta a 24 HP. |
| 63 | Fulmine | Sonda Ionica d’Assalto | Comune | 1 | Variabile | Un colpo Fulmine da 14 HP; sul bersaglio colpito lascia un segnale che permette la combinazione con Martello del Tuono nello stesso turno o nel prossimo turno proprio. |
| 64 | Fulmine | Martello del Tuono | Rara | 1 | Variabile | Colpo Fulmine da 28 HP; se il bersaglio è segnato da Sonda Ionica d’Assalto, un secondo impatto autonomo da 18 HP consuma il segnale. |
| 65 | Fulmine | Lancia del Comando Ionico | Rara | 1 | Variabile | Richiede un Personaggio alleato attivo: un colpo Fulmine da 24 HP più 14 HP di bonus Personaggio, per 38 HP nominali. |
| 66 | Fulmine | Cannone Condensatore della Tempesta Stellare | Epica | 3 | Variabile | Per 3 tuoi turni, se giochi una nuova Energia Fulmine ne consuma 1 carica e spara 18 HP +8 HP per ogni supporto alleato vivo, senza sacrificare HP. |
| 67 | Fulmine | Cannone del Giudizio Temporale | Leggendaria | 3 | Variabile | Una scarica autonoma nominale pari al 20% degli HP massimi del bersaglio (esempio 1000→200 HP). La carta occupa lo slot fino a 3 turni; non spara di nuovo senza ulteriore giocata. Difese applicabili. |
| 68 | Terra | Sputacristalli di Sirio | Comune | 1 | 10 HP | Un colpo; congela uno slot Arma del rivale per il prossimo turno proprio se provoca danno. |
| 69 | Vento | Cannone Cicloreattore Grandinifero | Epica | 3 | 8/12/16 HP per nave | Colpisce tutte le navi in tre turni; blocca la mano 2/3/4 secondi per stadio. |
| 70 | Fuoco | Cannone dei Frammenti | Epica | 1 | 10 +10/scarto; ×2 Fuoco; max 120 HP | Conta solo i propri scarti Attacco; il Fuoco negli scarti raddoppia una volta. |
| 71 | Fulmine | Cannone Acceleratore Trifase I (nome provvisorio) | Comune | 2 | 10 HP solo / 10 HP in catena | Evoluzione sequenziale solo al proprio turno successivo, nello stesso slot. |
| 72 | Fulmine | Cannone Acceleratore Trifase II (nome provvisorio) | Rara | 2 | 10 HP solo / 30 HP in catena | Evoluzione sequenziale solo al proprio turno successivo, nello stesso slot. |
| 73 | Fulmine | Cannone Acceleratore Trifase III (nome provvisorio) | Epica | 1 | 20 HP solo / 70 HP in catena | Evoluzione sequenziale solo al proprio turno successivo, nello stesso slot. |

## Verifiche e regole preservate

- Cataloghi e test dedicati verificano 73 ID unici, rarità valide, durate, differenziazione Comune/Rara, combo, potenze nominali e limiti.
- Restano invariati numeri di copie nel mazzo, prezzi provvisori, HP delle navi, supporti, Difese, Trappole, Personaggi, Terreni, progressione e identità delle Carte Attacco.
- Le meccaniche con costi in HP (Binario, Accoppiatore), recuperi HP (Recuperatore) e costi Energia continuano ad applicare i controlli esistenti.
- È necessario un test automatizzato completo su ambiente di gioco e un successivo collaudo di durata con mazzi aggressivi, difensivi e di controllo prima di dichiarare un bilanciamento finale.

## Riferimenti tecnici

- `src/fleetNext/approvedBaseWeapons.js`, `confirmedWeaponCards.js`, `multiWeaponCards.js`
- `src/fleetNext/designedWeaponCards.js`, `provisionalWeaponProfiles.js`, `provisionalWeaponEngine.js`
- `src/fleetNext/discardWeapon.js`, `newCardEffects.js`, `simpleEffects.js`
- `src/fleetNextWeaponBalanceV2.test.js` e test regressione delle famiglie
