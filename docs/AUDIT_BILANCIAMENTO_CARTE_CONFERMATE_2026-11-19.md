# Eclissi Stellare — Primo audit di bilanciamento delle carte confermate
19 novembre 2026 — repository ufficiale `test7`, ramo `main`.

## Ambito: soltanto materiale confermato
- **Attacchi generici: 37** = 32 Carte Sistemi (sabotaggio/amplificazione), 1 Buco Nero e 4 Smontaggio Forzato.
- **108 esclusive non Personaggio** delle 12 madri: 34 Attacchi, 21 Difese, 10 Trappole, 13 Moduli d'arma, 12 Moduli utilità, 18 Tattiche.
- **Armi temporanee**: 2 già esistenti (Cannone a impulso e Condensatore offensivo), Cannone della Memoria Stellare, tre stadi di Sequenza e Amplificatore di Scorta.
- **Navicelle**: 12 madri, 13 supporti indipendenti con una passiva per modello, 13 Carte Navicella Fusione.
- **10 Carte Energia**, **1 Trappola generica Interdizione di Fusione** e **10 Terreni ambientali** già attivi (i Terreni non sono tutti carte generiche acquistabili).
- **Personaggi generici, esclusivi e boss**: esclusi da questa fase per decisione del progettista. Nessun ID o effetto Personaggio è stato modificato, salvo interazioni preesistenti che rimangono nei test.

## Prima calibrazione integrata
Le navi madri conservano le statistiche distinte per rarità e modello; Arca Astrale Leggendaria = 1.000 HP. Difesa percentuale massima 18%, singolo colpo massimo 40% HP madre, somma nello stesso turno massimo 55%. PvP 4–6 minuti (obiettivo 5), boss 8–10 (obiettivo 9): *target di misura, non timer di eliminazione forzata*.

### Supporti, passive confermate
Sono ridimensionati alla nuova scala solo i valori che erano trascurabili contro madri da ~1.000 HP:
- Rigenerazione: **0,06% HP max madre per secondo**, finché il supporto è operativo. Al massimo 30 secondi di rigenerazione per turno avversario.
- Veleno reattivo: **0,07% HP max madre per secondo** e **0,10% HP max supporto per secondo**, soltanto al turno successivo all'attivazione.
- Last Shield: alla distruzione recupera **5,5% HP max madre** (massimo 80 HP), senza superare la vita massima e soltanto una volta.
- Condensatore: scarica ogni tre propri turni **2,5% HP max madre** e **4,5% HP max supporto**. Il danno alla madre è sottoposto alla mitigazione/limite normale.
- Le altre passive (Soppressione Trappole, Pescata, Terreno, Economia Energia, Sacrificio, Attacco Normale e Speciale, Tempesta, Conversione) mantengono il comportamento confermato. I duplicati delle passive nella Fusione rimangono riconosciuti.

### Armi temporanee e Arsenale
- **Memoria Stellare**: invariati 10 HP +10 per ogni proprio Attacco negli scarti, ×2 se presente almeno un'Energia Fuoco personale negli scarti. Nessun uso degli scarti avversari.
- **Sequenza I–II–III**: invariati 10 → 30 → 70 HP nominali se concatenata, senza catena 10 / 20.
- **Amplificatore di Scorta**: **15 HP base +20 per supporto vivo** (15 / 35 / 55 HP); dura due propri turni; Fusione conta un solo slot.
- Le Carte Arsenale già confermate mantengono durata e comportamento, ma su armi temporanee con danni elevati riducono o amplificano l'apporto di **8%, 12%, 17%, 23%** secondo rarità Comune/Rara/Epica/Leggendaria. La soppressione dell'arma nei turni previsti resta prioritaria.
- Il supporto `Armeria Binaria` moltiplica il contributo effettivo delle Armi secondo la passiva esistente; non permette danni oltre i limiti della madre.

### Attacco, Difesa, Trappole, Energia, Fusioni, Terreni
- Le 32 Carte Sistemi mantengono i meccanismi distinti di Centralina, Arsenale, Generatore e Plancia. Solo l'intensità numerica dell'Arsenale è stata adeguata in questa revisione, senza creare nuovi effetti.
- Smontaggio, Buco Nero, tutte le Difese, le Trappole, le Energie, le Tattiche, i Moduli, le Fusioni e i Terreni mantengono durata e condizioni. Le carte già approvate non sono state eliminate, ridenominate o riabilitate se ritirate.
- Le sei abilità Attacco Speciale e sei Effetto Speciale rimangono alternative al tiro normale; costi e 10 elementi invariati.

## Collaudo
`src/fleetNextConfirmedCardBalance.test.js` censisce i gruppi confermati e verifica la calibrazione delle passive, delle Armi e dell'Arsenale. `src/fleetNextTemporarySupportWeapons.test.js` e la suite esistente continuano a validare carte e Fusioni. `src/fleetNextConfirmedPacing.test.js` registra diagnosi con mosse da 20 secondi *senza carte né supporti*, solo per una baseline ripetibile.

## Riserva importante
Il target PvP **4–6 minuti** e boss **8–10 minuti** non è ancora dimostrato da partite con mazzi completi, supporti, carte difesa, trappole e variazioni elementali. La parità fra tutte le strategie non è certificata. Occorre usare simulazioni con questi elementi e, successivamente, il vero PvP. La fase Personaggi resta separata. Negozio, prezzi, duplicati e ricompense non sono stati modificati.
