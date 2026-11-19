# Eclissi Stellare — combinazione reversibile fra due Armi Ghiaccio

**19 novembre 2026 · Regola corretta in progettazione, non ancora eseguibile nel motore.** La combinazione funziona **in entrambi gli ordini**. Nessun elemento Fuoco/Acqua o Fuoco/Ghiaccio: entrambe le armi sono Ghiaccio.

## Balestra di Nebbia Gelata
- ID: `weapon-new-cryogenic-03` · **Ghiaccio** · Comune
- Spara direttamente alla **nave madre nemica**: un dardo da **15 HP nominali**.
- Se viene giocata per prima e infligge HP reali, lascia sulla madre un **cristallo di polarità criogenica positiva**.
- Se invece la madre porta già il cristallo inverso della Dardiera, il suo colpo ne provoca l'esplosione.

## Dardiera della Brina Inversa
- ID: `weapon-new-cryogenic-05` · **Ghiaccio** · Rara
- Spara direttamente alla **nave madre nemica**: un dardo da **12 HP nominali**.
- Se viene giocata per prima e infligge HP reali, lascia sulla madre un **cristallo di polarità criogenica negativa**.
- Se invece la madre porta già il cristallo positivo della Balestra, il suo colpo ne provoca l'esplosione.

## Attivazione della reazione, in entrambi gli ordini
1. Una qualunque delle due Armi viene installata in uno dei due slot Arma, spara sulla madre e, **solo se fa danno reale**, lascia il cristallo corrispondente. La carta viene scartata dopo aver sparato, mentre il cristallo rimane.
2. L'altra Arma viene installata **nello stesso turno** nel secondo slot, oppure **nel turno proprio successivo**; deve colpire **la stessa nave madre** e infliggere danno reale.
3. La seconda Arma innesca una **frattura esplosiva da +12 HP nominali**, indipendentemente da quale delle due sia stata giocata prima. Il cristallo viene consumato.
4. Se la seconda arma non arriva entro il turno proprio successivo, oppure il suo colpo viene bloccato, il cristallo **si scioglie senza esplosione** alla fine di tale turno.

**Balestra → Dardiera:** 15 + 12 + 12 = **39 HP nominali**.

**Dardiera → Balestra:** 12 + 15 + 12 = **39 HP nominali**.

Le due Armi funzionano anche **da sole**, infliggendo soltanto il danno proprio (15 o 12 HP). Non c'è esplosione senza il colpo corrispondente.

## Vincoli
- **Entrambe mirano direttamente alla madre, non ai supporti**, anche se sono presenti due supporti operativi.
- I colpi **non sono perforanti**: Difese ordinarie, resistenze, effetti elementali, cap della madre e limiti per turno si applicano normalmente, anche all'esplosione.
- Non è permesso accumulare più cristalli sullo stesso bersaglio; la reazione avviene una sola volta.
- Ogni Arma è una Carta Arma con danno proprio; non è una Carta Attacco o un effetto gratuito.
- Due Armi installate nello stesso turno occupano i **due slot Arma** esistenti; nessun terzo slot né nuova centunesima carta.
- La Balestra ha la progressione per doppioni Comune → Rara → Epica → Leggendaria con meccanica invariata; i valori per rarità vanno bilanciati. Progressione della Dardiera ancora da definire.
- Effetti approvati in forma progettuale; animazioni, Shop e codice di combattimento non sono stati modificati.

## Esempi
**Stesso turno, ordine A:** giochi Balestra, cristallo positivo; giochi Dardiera, si innesca l'esplosione.

**Stesso turno, ordine B:** giochi Dardiera, cristallo inverso; giochi Balestra, si innesca l'esplosione.

**Due turni:** giochi prima una delle due Armi, il cristallo rimane. Nel tuo turno successivo giochi l'altra, attivando l'esplosione. Non serve tenere la prima Arma installata.

**Combinazione mancata:** il cristallo si scioglie senza infliggere altri HP.
