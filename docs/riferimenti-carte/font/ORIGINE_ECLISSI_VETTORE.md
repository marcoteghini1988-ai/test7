# Origine del font Eclissi Vettore

Il sorgente `design_font.py` è stato creato con ChatGPT per il progetto il 24 novembre 2026; la copia originale era conservata come artefatto del progetto. Il file è stato aggiunto qui per consentire una verifica e una ricostruzione del TTF.

Il sorgente definisce le coordinate dei tratti per lettere, numeri, accenti e punteggiatura. Usa `fontTools` per compilare i contorni in TrueType. Non apre un altro font, non importa glifi da file esterni e non contiene immagini incorporate.

## Verifica tecnica

- Il TTF presente su GitHub prima di questa correzione aveva SHA-256 `d8ff8c8dc073e3523fa46d96acee0acca78d85e5c69a6431dc006ab158362520`.
- Ricompilando il sorgente originale, tutte le tabelle del TTF coincidevano con quelle del file su GitHub, tranne `head`, che conteneva la data della nuova compilazione. Riportando la data originale (`3878348262` secondi dall'epoca TrueType), coincideva anche l'intero file byte per byte.
- Il font contiene 87 caratteri mappati e 88 glifi, incluso `.notdef`.
- In questa revisione è stato impostato esplicitamente `fsType=0` nel sorgente: il valore precedente `4` indicava soltanto incorporamento per anteprima e stampa. Il nuovo TTF ha SHA-256 `54f3bfa821a833f765353c15875638e0c30ea413271bf6ee187e56450d0fe737`. I contorni e le metriche non sono cambiati.

Per ricostruirlo con `fontTools` installato: `python3 docs/riferimenti-carte/font/design_font.py`. Il timestamp incorporato è fissato al valore originale per avere un risultato riproducibile. `fsType=0` è un'informazione tecnica di incorporamento, non una licenza pubblica concessa a terzi.

Questi controlli documentano la generazione interna del file. Non equivalgono a un confronto esaustivo con ogni carattere esistente né a un parere legale su eventuali somiglianze.
