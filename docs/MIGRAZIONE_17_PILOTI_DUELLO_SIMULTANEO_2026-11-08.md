# Eclissi Stellare — Migrazione dei 17 piloti rimasti, 8 novembre 2026

**Repository unico:** `marcoteghini1988-ai/test7`, ramo `main`.

- Attivati nel ponte del duello simultaneo i 17 piloti del catalogo non ancora convertiti: boss/eroi 4, 5, 10, 12, 18; rari 1–4; epici 1, 3, 4; leggendari 2–6. Totale **33/33** abilità di comandante supportate, con ID e livelli originali.
- Nessuna modifica alla plancia 9:16, al doppio mazzo, alle 7 numeriche, alle carte speciali, alle 12 arene boss o ai tempi **30 s di pianificazione + 8 s di risoluzione**.
- La fonte delle condizioni di attacco/difesa è `commanderAbilities.js`: tutti i bonus di attacco richiedono una formula con numeriche reali, firma valida e munizioni delle armi native. Per le difese servono veri stati di scudo, scudiere e vitali. Il possesso del pilota resta verificato in inventario.
- Il Veggente Supremo non ottiene una selezione fittizia delle scudiere: può sfruttare soltanto l'alternanza del **primo intercettore reale** delle scariche native. La memoria è aggiornata soltanto se quell'intercettore ha subito danno effettivo. La contromisura Soppressione può annullare la condizione.
- Aggiornati i test che prima richiedevano il percorso storico per il raro 1; aggiunta la suite `tacticalAdvancedCommanders.test.js` (33/33, livelli, formule, status, memoria).
- **Verifiche ancora necessarie:** esito finale CI, collaudo Android 9:16, efficacia empirica dei 17 trigger contro le 12 arene boss. I test logici non equivalgono a conferma della resa visiva o del bilanciamento.
- **Punto successivo:** collaudo del percorso completo 12 boss e delle abilità personaggio con salvataggi reali, senza ridisegno.
