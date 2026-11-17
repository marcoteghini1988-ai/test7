# Consolidamento catalogo dopo la rimozione dei moduli obsoleti

**17 novembre 2026** · Ramo ufficiale `main`.

## Sorgenti uniche
- **120 esclusive:** `docs/NUOVO_CATALOGO_ESCLUSIVE_120_2026-11-16.json` + `src/fleetNext/exclusive120.js`.
- **Personaggi generali:** `src/fleetNext/catalogGeneral.json`.
- **Personaggi esclusivi storici delle 17 navicelle:** `src/fleetNext/catalogExclusive.json` (solo i Personaggi e le configurazioni).
- **12 Boss:** `src/fleetNext/bossCards.js`.
- **ID di 350 carte ritirate:** `docs/ARCHIVIO_ID_CARTE_RITIRATE_2026-11-16.json` (solo archivio, mai caricato dal motore).

Eliminati i moduli non operativi `cardCutover.js`, `cardResetProtection.js`, il doppio manifesto del ritiro, il registro parallelo `redesignRegistry.js` e i quattro gruppi di proposte provvisorie. La suite verifiche è stata aggiornata per controllare il catalogo finale eseguibile e non schede in bozza.

Le carte ritirate restano identificate **solo nella documentazione**, senza dati o effetti eseguibili.
