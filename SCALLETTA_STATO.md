# NOTA DI CONTINUITÀ — Stato nuovo, 6 novembre 2026

La scaletta che segue è **una fotografia storica** del progetto precedente. Non usarla come stato corrente del combattimento. Per la scaletta ufficiale a 53 punti, 7 numeriche + 5 speciali, fusioni SOLO da carte speciali e cooperazione madre/scudiere, leggere `docs/MASTER_DECISIONI_ECLISSI_STELLARE_2026-11-06.md`.

---

# ECLISSI STELLARE 2.1 — STATO LAVORI

## Obiettivo richiesto
- Usare `test-5-main.zip` come punto di partenza React/Vite.
- Sostituire completamente il sistema Poker con il nuovo combattimento numerico.
- Fornire ZIP completo caricabile in StackBlitz, non un gioco HTML standalone.

## Completato nel codice
- Core matematico con valori, operazioni, bersagli, malus, turni e IA.
- Nuove carte di quattro famiglie, potenziamenti, moduli, HP, scudo, Etere.
- Nuova plancia React responsive con bersagli, selezione, danni, feedback, torrette e fondali originali.
- Campagna 120 settori/12 boss, mappe, Hangar, Accademia, Arena, Addestramento, sfida giornaliera, registro.
- Persistenza locale delle partite e progressione.
- 11 controlli automatici superati (10 motore + 1 navigazione React simulata).

## Da verificare sul dispositivo
- `npm install` e `npm run build` in StackBlitz (in questo ambiente npm non ha potuto recuperare le dipendenze).
- Resa visiva e responsività su smartphone e schermi diversi.
- Bilanciamento pratico dei 120 settori e dei boss; non si può certificare senza sessioni di gioco.
- Qualità delle animazioni e audio (in questa integrazione non è presente un motore audio dedicato).

## Scelta progettuale
Non è stata mantenuta la vecchia plancia identica, perché era progettata per combinazioni di Poker. Sono state mantenute l'architettura React/Vite, le immagini e il fondale originale, adottando una plancia coerente con la meccanica dei tre bersagli.
