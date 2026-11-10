# ECLISSI STELLARE — STATO DEL DUELLO LIVE E DEGLI ASSET
**Aggiornamento:** 10 novembre 2026  
**Repository ufficiale:** `marcoteghini1988-ai/test7` / `main`

## Cosa è stato effettivamente pubblicato
- Motore LIVE alternato a 30 secondi: `src/officialLiveDuelEngine.js`, 7 numeriche in mano, fino a 3 numeriche e 2 speciali per turno, trappole e terreno PvP persistente, colpi nativi attivati dalle numeriche compatibili, fino a quattro vitali costruiti su più turni.
- Armi native: supporto alle classi Immediata, Accumulo, Combo simultanea e Combo a memoria, senza eliminare le 42 armi integrate o le 17 navicelle.
- Faglia: contro componente ancora protetto limite iniziale 5 HP; nessuna distruzione gratuita, nessun bypass delle combinazioni.
- Carte Storiche migrate nel LIVE: **Numero Bomba, Carta Dorata, Dado Quantico, Barra Malus, Mutazione della Firma**. Restano obbligatorie le carte speciali fisiche; cariche, marcature, validità e durata vengono controllate dal runtime `src/officialLiveLegacyCards.js`.
- Ricambio numerico: fino a due numeriche scartate e ripescate dal mazzo reale; disinnesca una Bomba sul numero sostituito.
- Moduli 16F: **30 dei 35 moduli** collegati al LIVE usando livelli reali e i dati degli inventari tramite `src/officialLiveModules.js`. Sono inclusi colpi diretti alla barriera, riparazione, drenaggio, accumulo Sincronia, blocco armi, protezione, ricambio, ricarica Dado e potenziamento della scudiera quando usa una vera numerica.
- **5 moduli ancora NON migrati**, bloccati e non consumabili: `scorpio` (hand_jam), `sagittarius` e `planet_char_6` (prevent_skip), `planet_char_19` e `ophiuchus` (burn). Occorre decidere come adattare penalità alla precisione/turni e Ustione al nuovo sistema.
- Grafica Carte Speciali: 25 SVG base, 35 SVG Moduli, 6 SVG Epici, 12 SVG Personaggi Boss; 4 Carte Terreno già presenti. Tutti gli **82 tipi collezionabili** hanno ora un percorso immagine esistente. Si tratta di asset SVG preliminari utilizzabili, non di illustrazioni artistiche definitive approvate.
- UI in `src/OfficialLiveBattle3D.jsx`: immagini nelle carte e negli slot, scelta di 7 slot Bomba, numerica Dorata, Malus, componente da mutare o proteggere, ricambio e moduli di scambio; evidenza Bombe/Dorate sulla mano reale. Le carte dell'avversario restano segrete. Modale chiuso alla fine del turno; posizione delle navi e della plancia invariata.
- IA: non legge in anticipo la firma temporaneamente mutata dal giocatore.

## Verifiche
GitHub Actions per commit `c88d4a1230d64a75f8a56c6b8e34569c40b549be`: **867 test superati (0 errori), compilazione Vite e preflight riusciti**.
Consultare la cronologia CI: https://github.com/marcoteghini1988-ai/test7/actions
Test di unità e build NON equivalgono a collaudo browser/mobile completo. La resa effettiva sullo smartphone rimane da verificare.

## Cosa manca nel motore
1. Adattamento completo delle **6 Carte Oggetto Epico**, ora illustrate ma non ancora tutte eseguibili nel LIVE.
2. Migrazione/integrazione piena delle passive dei 12 boss, delle abilità esclusive, dei 33 piloti e relative interazioni con la nuova gestione delle fasi.
3. Migrazione dei 5 Moduli sopra indicati in modo coerente con la distruzione immediata dei vitali: non simulare un effetto senza conseguenza concreta.
4. Ultime correzioni di bilanciamento e test browser reali, inclusi smartphone 9:16, turni, scelta carte e risultati.
5. Pulizia finale delle vecchie Carte Arma, **soltanto dopo** aver verificato tutte le dipendenze legacy, Shop e Hangar. Le 42 armi integrate non vanno eliminate.

## Ripartizione rigorosa dei compiti
**Chat principale Eclissi Stellare:** regole, meccaniche, codice, asset nuovi, test funzionali, correzioni.

**ChatGPT Work:** SOLO rifinitura grafica visiva reale del gioco nel browser e sul mobile, secondo `docs/WORK_INCARICO_SOLO_GRAFICA_2026-11-10.md`. Non riprogettare meccaniche, boss e carte. Non spostare la plancia approvata; Home invariata nella struttura.

Quando Work torna disponibile, prima recuperare eventuali file non pubblicati nella sessione precedente, confrontarli con l'ultimo HEAD e salvare in `test7/main` soltanto modifiche compatibili e testate.
