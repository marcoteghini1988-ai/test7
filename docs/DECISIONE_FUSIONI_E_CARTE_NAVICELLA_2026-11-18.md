# Decisione — carte-navicella indipendenti e Fusioni
**18 novembre 2026 · Eclissi Stellare · implementazione diretta su test7/main**

## Regole approvate
- Modelli navicella del progetto: **13 decisi dall'utente**. Nel codice precedente sono però ancora 17: i quattro ID da rimuovere non risultano identificati con certezza. Non vengono inventati o eliminati modelli senza mappatura.
- Ogni navicella posseduta può essere scelta come supporto indipendentemente dalla madre. Gli slot supporto sono **due**, sbloccati nella campagna ai settori **20** e **60**, mai durante il combattimento.
- Ogni modello possiede un **elemento nativo** e una **passiva nativa**. Non copia più l'elemento della madre. La scelta delle passive native è provvisoria: le 15 meccaniche già presenti restano tutte rappresentate nei 17 ID storici.
- Il mazzo da **40 carte** può contenere **Carte Navicella Fusione**, ognuna riferita a un preciso modello. Non esiste più la sola carta Fusione universale per coppie obbligate.
- Giocando la carta durante il proprio turno, si seleziona uno dei supporti in campo **non ancora fuso**. La nave della carta si aggiunge a quel supporto, formando una sola unità.
- La nave fusa eredita entrambe le passive e gli elementi della coppia, senza creare più di due affinità. Due supporti possono fondersi **una volta ciascuno**, per tutte le madri, non soltanto per Arca Astrale.
- **HP invariati:** la nave fusa mantiene esattamente HP correnti e max HP del supporto scelto. Le ferite non vengono riparate; nessun HP della navicella-carta viene sommato. Non si crea un terzo slot né una riserva gratuita.
- Limite operativo provvisorio: **una Carta Navicella Fusione per turno**, non più di due per partita con entrambi gli slot sbloccati. Danni, cooldown e altri valori verranno bilanciati alla fine.

## Implementazione
- `fusionShipCards.js`: definizioni e identificatori delle Carte Navicella Fusione, riferiti ai modelli storici presenti.
- `supportCatalog.js`: un record selezionabile per ogni modello storico. I 34 vecchi ID restano soltanto come alias compatibili, non come 34 modelli di nuova vendita.
- `supportAbilities.js`: passiva nativa, 15 effetti esistenti preservati.
- `supportDeployment.js` e `combat.js`: elementi individuali e fusioni su slot specifico, stessa barra HP e doppia passiva.
- `rules.js`, `simpleEffects.js` e `nextDeckLoadout.js`: validazione, registrazione e possibilità di equipaggiare Carte Fusione possedute fra le 40.
- `SupportHangarPanel.jsx` e `OfficialFleetBattle3D.jsx`: selezione dei modelli in Hangar e scelta dello slot da fondere in battaglia.
- `FleetCollectionWorkshop.jsx`: catalogo testuale delle carte (senza acquisti o immagini premature).
- `src/fleetNextShipFusionCards.test.js`: test per due fusioni, HP invariati e doppia passiva.

## Restano intenzionalmente da completare
1. Identificare precisamente **quali 13 ID** delle 17 definizioni storiche sono il catalogo finale, e rimuovere le quattro varianti esclusivamente dalla selezione ufficiale senza perdere dati o abilità.
2. Stabilire come ottenere le carte, i prezzi e le regole definitive delle copie; ora le definizioni sono registrate ma le nuove carte non vengono regalate né messe in vendita.
3. Sostituire le tre vecchie esclusive di fusione di Eclisse Reale, Titano Ossidiana e Arca Astrale nella lista di esclusive automaticamente pescate. Nel gameplay moderno sono escluse; i dati storici sono conservati.
4. Bilanciamento completo HP, danni, abilità, Energia, Terreni e probabilità di pescata.
5. Immagini, effetti 3D, grafica delle fusioni e collaudo completo su dispositivo.

**Note di compatibilità:** il motore legacy mantiene le fusioni storiche e i salvataggi precedenti riconoscibili. Le nuove regole sono attive per le flotte indipendenti (`independentSupportRoster`).
