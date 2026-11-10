# ECLISSI STELLARE — STATO DEL DUELLO LIVE E DEGLI ASSET
**Aggiornamento:** 10 novembre 2026  
**Repository ufficiale:** `marcoteghini1988-ai/test7` / `main`

## Cosa è stato effettivamente pubblicato
- Motore LIVE alternato a 30 secondi: `src/officialLiveDuelEngine.js`, 7 numeriche in mano, fino a 3 numeriche e 2 speciali per turno, trappole e terreno PvP persistente, colpi nativi attivati dalle numeriche compatibili, fino a quattro vitali costruiti su più turni.
- Armi native: supporto alle classi Immediata, Accumulo, Combo simultanea e Combo a memoria, senza eliminare le 42 armi integrate o le 17 navicelle.
- Faglia: contro componente ancora protetto limite iniziale 5 HP; nessuna distruzione gratuita, nessun bypass delle combinazioni.
- Carte Storiche migrate nel LIVE: **Numero Bomba, Carta Dorata, Dado Quantico, Barra Malus, Mutazione della Firma**. Restano obbligatorie le carte speciali fisiche; cariche, marcature, validità e durata vengono controllate dal runtime `src/officialLiveLegacyCards.js`.
- Ricambio numerico: fino a due numeriche scartate e ripescate dal mazzo reale; disinnesca una Bomba sul numero sostituito.
- Moduli 16F: **35 su 35 collegati al LIVE**, giocabili soltanto come carte possedute e pescate, con livelli reali e inventari tramite `src/officialLiveModules.js`. Comprendono danno e cura autentici, drenaggio, Sincronia, protezione, blocchi, ricambio, carica Dado, precisione Scorpione (-20% sui soli colpi numerici reali del turno avversario), contromisure Sagittario/Saturno e ustione Io/Ophiuchus (solo dopo salva valida, contrastabile da Monolite). La mano resta di 7 numeriche e le firme vitali a distruzione diretta NON perdono il 20% per Scorpione.
- Grafica Carte Speciali: 25 SVG base, 35 SVG Moduli, 6 SVG Epici, 12 SVG Personaggi Boss; 4 Carte Terreno già presenti. Tutti gli **82 tipi collezionabili** hanno ora un percorso immagine esistente. Si tratta di asset SVG preliminari utilizzabili, non di illustrazioni artistiche definitive approvate.
- UI in `src/OfficialLiveBattle3D.jsx`: immagini nelle carte e negli slot, scelta di 7 slot Bomba, numerica Dorata, Malus, componente da mutare o proteggere, ricambio e moduli di scambio; evidenza Bombe/Dorate sulla mano reale. Le carte dell'avversario restano segrete. Modale chiuso alla fine del turno; posizione delle navi e della plancia invariata.
- IA: non legge in anticipo la firma temporaneamente mutata dal giocatore. Quando non può caricare la madre con i semi disponibili, usa una scudiera realmente equipaggiata e compatibile, consumando la numerica. `src/officialLiveAiPlanning.js` sceglie ora combinazioni verificabili sulle carte autentiche in mano: preferisce completare i vitali gia' esposti, sostiene Poker 4 carte su due turni, rispetta il limite 3 numeriche e non occupa slot vitali a caso. Non legge la firma segretamente mutata.
- Scudiere: il LIVE ora consulta gli armamenti distinti di `src/escortArmory.js` tramite `src/tacticalEscortVolley.js` (semi, montaggi, danni limitati e Accumulo autentici) anziché simulare il loro sparo con le armi della madre; conserva il `sourceWeaponId` originale per i VFX. Gli slot dei vitali mostrano il conteggio della firma reale, non `/5` fisso.
- Oggetti Epici nel LIVE: **5 di 6** attivi e testati (Möbius, Astrolabio, Pendolo, Monolite, Calice); Matrice `epic_item_9` resta bloccata poiché il vecchio bonus al colpo pesante di precisione non si traduce automaticamente nella nuova distruzione diretta dei vitali.
- Boss Risonanza: terza passiva **Sinfonia di flotta** ora effettiva nel LIVE (`src/officialLiveNumericBossPassives.js`): solo dal livello 7, richiede impatto reale della madre e salva reale di una scudiera nello stesso ciclo; usa percentuale e resto centesimale nativi, senza spari automatici o gratis.
- Boss Leviatano: prima passiva **Marea del riciclo** ora collegata al LIVE. Solo la pesca che richiede il recupero di numeriche gia' scartate arma il bonus percentuale originale: e' consumato dal successivo colpo nativo efficace, mai da un colpo nullo. Nessuna carta nuova e nessun reshuffle artificiale; adattamento al fuoco nativo in un sistema dove la firma vitale completa distrugge subito il pezzo.
- Piloti: il catalogo conserva **33 ID**. Il LIVE supporta le **7 difese condizionate**. Ora registra anche memoria attendibile delle firme sui vitali (`src/officialLiveCommanderDefense.js`: vera operazione, vitale colpito, visite, ripetizioni), con test end-to-end. Gli **altri 26 profili offensivi non sono ancora certificati né dichiarati completamente attivi nel nuovo LIVE**: vecchi bonus danno verso vitali non vengono simulati su vitali gia' distrutti.

## Verifiche
GitHub Actions per commit `c88d4a1230d64a75f8a56c6b8e34569c40b549be`: **867 test superati (0 errori), compilazione Vite e preflight riusciti**.
Consultare la cronologia CI: https://github.com/marcoteghini1988-ai/test7/actions
Ultima verifica funzionale in questa sessione: **931 test superati, 0 falliti; compilazione Vite e preflight riusciti** al commit `9d0fb5a51b59e07c3a712cefae48de9a6471a445` (https://github.com/marcoteghini1988-ai/test7/actions/runs/42835451951). I test comprendono la terza passiva Risonanza, le combinazioni reali IA da 2/4 carte su più turni e la memoria dei piloti validata da colpi effettivi. Test automatici e build NON equivalgono a collaudo browser/mobile completo: la resa sullo smartphone rimane da verificare.

## Cosa manca nel motore
1. **Un Epico ancora non migrato**: `epic_item_9` Matrice; adattarne il significato senza trasformare i vitali a distruzione diretta in bersagli a HP arbitrari e senza regalare un colpo.
2. **Migrazione ancora parziale** dei 23 effetti passivi dei 12 mazzi boss e delle abilita' offensive dei piloti: Risonanza Sinfonia di flotta e memorie delle combinazioni sono state aggiunte, le 7 difese pilota sono operative, ma gli altri 26 profili offensivi richiedono un adattamento effettivo alla distruzione diretta dei vitali, senza introdurre danni/bonus fittizi. Anche la parita' completa dei 12 poteri esclusivi deve essere auditata.
3. Bilanciamento e controllo delle **firme vitali lunghe (4–5 numeriche)**: il motore supporta slot dinamici e costruzione su turni diversi, ma il catalogo ufficiale delle 17 navi utilizza ancora soprattutto firme da 2–3 carte. È da approvare una progressione che non blocchi le mani.
4. Ultime correzioni e test **browser/mobile reali** (9:16, touch/drag, durata scontri, salvataggi, PvP, premio boss, collisioni e artefatti grafici).
5. Pulizia finale delle vecchie Carte Arma, **soltanto dopo** aver verificato tutte le dipendenze legacy, Shop e Hangar. Le 42 armi integrate non vanno eliminate.

## Ripartizione rigorosa dei compiti
**Chat principale Eclissi Stellare:** regole, meccaniche, codice, asset nuovi, test funzionali, correzioni.

**ChatGPT Work:** SOLO rifinitura grafica visiva reale del gioco nel browser e sul mobile, secondo `docs/WORK_INCARICO_SOLO_GRAFICA_2026-11-10.md`. Non riprogettare meccaniche, boss e carte. Non spostare la plancia approvata; Home invariata nella struttura.

Quando Work torna disponibile, prima recuperare eventuali file non pubblicati nella sessione precedente, confrontarli con l'ultimo HEAD e salvare in `test7/main` soltanto modifiche compatibili e testate.
