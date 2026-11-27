# Font esterni usati nell'interfaccia

`src/App.tsx` richiede via Google Fonts **Orbitron** nei pesi 600, 800 e 900 e **Rajdhani** nei pesi 600 e 700. Non ci sono copie locali di questi due font nel repository: il browser li scarica dal servizio quando la schermata viene aperta. Gli eventuali `font-weight: 800` dichiarati per Rajdhani possono essere sintetizzati dal browser a partire dal peso disponibile; non esiste un file Rajdhani 800 nel catalogo consultato.

| Famiglia | Titolare indicato nel catalogo | Licenza | Fonte |
|---|---|---|---|
| Orbitron | The Orbitron Project Authors, 2018; nome riservato «Orbitron» | SIL Open Font License 1.1 | [Catalogo Google Fonts](https://github.com/google/fonts/blob/main/ofl/orbitron/METADATA.pb) e [licenza originale](https://github.com/google/fonts/blob/main/ofl/orbitron/OFL.txt) |
| Rajdhani | Indian Type Foundry, 2014 | SIL Open Font License 1.1 | [Catalogo Google Fonts](https://github.com/google/fonts/blob/main/ofl/rajdhani/METADATA.pb) e [licenza originale](https://github.com/google/fonts/blob/main/ofl/rajdhani/OFL.txt) |

Le copie testuali delle licenze sono `Orbitron-OFL.txt` e `Rajdhani-OFL.txt`, prelevate da `google/fonts` il 27 novembre 2026. Le rispettive versioni Git dei file erano `91ede459e18c22d3f2ba7c27d925b49cc945abe4` e `6dd809659a8ccace7ccee108d024d33cd4f936da`. L'OFL permette l'uso commerciale e l'incorporamento nel gioco. Se i file font saranno inclusi nel pacchetto finale, conservarvi le relative licenze e gli avvisi di copyright; per un font modificato va rispettato anche il nome riservato Orbitron.

Il caricamento attuale richiede una connessione ai domini di Google Fonts. La verifica dei dati inviati a tali domini e la scelta se distribuire copie locali dei font sono parte del successivo controllo privacy e del pacchetto di rilascio. Il carattere creato per il progetto, `Eclissi Vettore`, ha un'origine separata documentata in `docs/riferimenti-carte/font/`.
