# Pulizia definitiva del vecchio mazzo manuale

**17 novembre 2026** — repository ufficiale `test7`, ramo `main`.

Il mazzo iniziale da 40 carte e i mazzi preconfigurati sono stati rimossi da `src/fleetNext/catalogGeneral.json`, senza alterare i 12 Personaggi generali. Dal motore `rules.js` sono state eliminate le esportazioni di `STARTER_DECK`, `PREMADE_DECKS`, `validateBaseDeck`, i prezzi dei vecchi pacchetti e la funzione `getPrebuilt`. Dalla collezione sono state eliminate fisicamente le API per comprare e equipaggiare mazzi ritirati, non più soltanto disattivate.

I test che avevano bisogno di un campione deterministico ora leggono `src/fleetNext/testDeckFixtures.js`, usato **solo nelle prove Node**. Questo campione non viene importato dal gioco, non viene equipaggiato e non entra nel bundle Vite.

Non sono state rimosse le **sei carte tecniche** conservate durante la riprogettazione: esse servono a preservare le regole di Macchine e Fusione già implementate. Restano invariate le 120 esclusive delle 12 madri, i Personaggi delle 17 navi, i 12 Boss, il sistema a 7 carte, la plancia 3D e il PvP simulato. Le immagini approvate restano nella cartella di riferimento.
