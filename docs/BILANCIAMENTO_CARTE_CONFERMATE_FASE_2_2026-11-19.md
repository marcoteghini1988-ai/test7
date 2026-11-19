# Bilanciamento delle carte confermate — secondo passaggio
19 novembre 2026 — Eclissi Stellare, repository ufficiale test7.

## Perimetro
Include 34 Attacchi esclusivi, 32 Carte Sistemi e Buco Nero, 4 Smontaggi,
21 Difese esclusive, 10 Trappole esclusive e Interdizione di Fusione,
13 Moduli d'arma, 12 Moduli utilità, 18 Tattiche, 10 Energie,
13 Carte Navicella Fusione, Cannone della Memoria, Sequenza I–III e Amplificatore di Scorta.
Restano **esclusi i Personaggi (generici, esclusivi e boss)** e **il bilanciamento dei Terreni**. I 13 supporti e le loro passive rimangono ai valori già calibrati; anche il negozio rimane invariato.

## Attacchi esclusivi
I danni tecnici 1/2/3/4 HP dei comandi offensivi esclusivi, quando provengono da una carta Attacco realmente giocata, corrispondono provvisoriamente al 55%/85%/118%/150% dell'attacco base della madre. Sono valori per singolo colpo, non creano colpi aggiuntivi. Il limite 40% per colpo, 55% per turno della madre e le Difese continuano ad applicarsi. Il motore storico e le carte Personaggio non vengono toccati. I comandi con danno già maggiore di 4 mantengono la loro formula.

## Elementi
Vantaggio +25%; neutralità 0%; svantaggio −25% per madri con statistiche di rarità. Il motore storico senza nuova scala conserva −50%. Obiettivo: meno partite anormalmente lunghe dovute al solo elemento contrario, con differenze ancora significative. Il costo delle 10 Carte Energia e i dodici Attacchi/Effetti Speciali non cambiano.

## Fusioni, Difese e Trappole
Interdizione di Fusione: **Epica**, massimo **1 copia** per mazzo, coperta. Annulla una Carta Fusione valida, manda entrambe agli scarti e lascia il supporto invariato. Acquisizione da definire. Le 13 Carte Fusione restano Leggendarie e fondono un supporto del relativo slot al massimo due volte per battaglia; ferite, barra HP, elementi e passive sono conservati. Le Difese e Trappole esclusive mantengono attivazioni, durate, slot e consumi già approvati. Il Sacrificio rispetta il limite al danno materno per turno.

## Armi temporanee
Memoria Stellare: danno 10 +10 per ogni propria Carta Attacco negli scarti, ×2 una volta se Energia Fuoco presente negli scarti del proprietario. Sequenza 10 → 30 → 70 e singole 10/20. Amplificatore di Scorta 15 +20 per supporto operativo (15/35/55). Nessuna alterazione a regole, durata o elementi delle armi.

## Ritmo
Obiettivo PvP **4–6 minuti**, riferimento 5; Boss **8–10 minuti**, riferimento 9. Le prove CI in `src/fleetNextApprovedBalanceAudit.test.js` misurano duelli controllati con mazzi reali, supporti e carte. Sono simulazioni con una durata media presunta delle decisioni, NON certificazioni di durata reale in PvP. Niente scadenza imposta alla partita.

## Rarità provvisorie fissate in questa fase
- Cannone della Memoria Stellare **Epica**; Sequenza I **Comune**, II **Rara**, III **Epica**; Amplificatore di Scorta **Rara**; Interdizione di Fusione **Epica**.
- Tutte queste carte hanno una sola copia per mazzo; non sono distribuite gratuitamente e non hanno ancora un costo/acquisizione. I nomi e gli elementi provvisori della Sequenza restano da definire nella progettazione grafica.

## Precisazione sulla durata
Le finestre PvP 4–6 minuti e Boss 8–10 minuti sono **valori medi approssimativi**. Il tempo di partita non altera automaticamente i danni: eventuali prolungamenti o chiusure rapide dipendono dai mazzi e dalle carte, anche da quelle che devono essere ancora progettate. Non considerare il bilanciamento completo fino a catalogo definitivo.
