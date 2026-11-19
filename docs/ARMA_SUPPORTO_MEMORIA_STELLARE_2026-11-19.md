# Eclissi Stellare — Arma di Supporto «Cannone della Memoria Stellare»

**Confermata il 19 novembre 2026 e implementata sul ramo ufficiale `main`.**

Identificativo `weapon-memory-plasma`, elemento **Fuoco** (`plasma`).
Tipo **Supporto / Arma temporanea**, utilizzabile nel nuovo mazzo da 40 se posseduta.

## Effetto approvato

L'Arma aggiunge potenza al colpo della nave madre durante il **solo turno in cui viene giocata**.
Conta esclusivamente le carte con ruolo **Attacco** che sono materialmente presenti **negli scarti del proprietario dell'Arma**, **al momento dell'attacco**.

- **Danno base dell'Arma:** 10 HP.
- **Ogni propria Carta Attacco già negli scarti:** +10 HP (incluse esclusive e generiche).
- **Almeno una propria Carta Energia Fuoco (`energy-plasma`) negli scarti:** raddoppia una sola volta l'intero risultato.
- **Nessuna Energia Fuoco corrispondente:** non raddoppia.
- **Più Energie Fuoco scartate:** sempre un unico ×2.
- **Scarti avversari:** mai conteggiati.
- **Carte Attacco o Energia giocate nello stesso turno:** non sono ancora negli scarti al momento del calcolo; non contribuiscono.
- **Carte di altri ruoli, identificativi ritirati o sconosciuti:** non contano.
- L'Energia scartata non viene consumata, spostata o rimossa per il raddoppio.

**Formula:**
`dannoArma = (10 + 10 × numeroAttacchiNeiPropriScarti) × (EnergiaFuocoPresente ? 2 : 1)`.

Esempi senza difese: 0 Attacchi → 10 HP; 3 → 40 HP; 5 → 60 HP; 5 con Energia Fuoco → **120 HP**; 10 con Energia Fuoco → 220 HP.

## Regole di combattimento

- Si gioca dalla mano, occupa una delle **due postazioni per Armi temporanee**; usa una delle **tre giocate del turno**.
- Applica il danno nominale come contributo di potenza al normale attacco della madre; la somma complessiva è soggetta a difese, interferenze, reindirizzamenti, HP residui e regole ordinarie della battaglia. **120 HP nominali non significano 120 HP effettivamente subiti** se il bersaglio ne possiede meno o se interviene una difesa.
- Non è una navicella, non protegge la madre e non è attaccabile come bersaglio.
- Il bonus si calcola nel turno di utilizzo e l'Arma scade prima del successivo turno del proprietario, passando negli scarti. **Non si applica automaticamente una seconda volta.**
- Può essere neutralizzata o ridotta dai sabotaggi dell'Arsenale; `Buco Nero` rimuove l'Arma attiva.
- La carta presenta la propria affinità Fuoco, ma **non richiede che l'elemento primario della nave madre sia Fuoco**. Per ottenere il ×2 occorre comunque aver messo legittimamente negli scarti l'Energia Fuoco.
- Il display della postazione mostra il **danno nominale corrente** se è attiva.

## Stato del catalogo

**Confermato:** formula, durata di un turno, esclusione degli scarti avversari, bonus da almeno una Energia corrispondente (×2 non cumulabile).

**Ancora da decidere:** rarità, prezzo, sistema di ottenimento, numero definitivo di copie per mazzo, bilanciamento complessivo delle carte, illustrazione/animazione definitiva. Il massimo tecnico iniziale di una copia è un limite provvisorio, non una scelta commerciale.

La Carta è nel registro ed è selezionabile **se posseduta**; non è attribuita gratuitamente e non è ancora acquistabile, finché non viene progettata l'economia.

## Riferimenti di implementazione e collaudo

- Registro: `src/fleetNext/discardWeapon.js`.
- Riconoscimento catalogo e ruolo: `src/fleetNext/rules.js`, `src/fleetNext/nextDeckLoadout.js`.
- Validazione, testo: `src/fleetNext/simpleEffects.js`.
- Calcolo del danno e sabotaggi: `src/fleetNext/newCardEffects.js`.
- Montaggio, uso e scarto: `src/fleetNext/combat.js`.
- Plancia e selezione: `src/fleetNext/battlePresentation.js`, `src/OfficialFleetBattle3D.jsx`, `src/FleetCollectionWorkshop.jsx`.
- Test (20 casi): `src/fleetNextDiscardWeapon.test.js`.

Nessuna carta ritirata è stata reintrodotta; non sono stati assegnati costi o ricompense.
