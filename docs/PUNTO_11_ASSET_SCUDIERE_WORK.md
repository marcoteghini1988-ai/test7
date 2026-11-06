# Eclissi Stellare — scudiere: consegna asset grafici a Work
Data: 6 novembre 2026

## Realizzato
- Immagini autonome in `public/assets/escorts/`: 17 madri × 2 slot = **34 SVG**.
- I file sono già caricati nell'app tramite `ASSET_ROOT/escorts/<shipId>_escort_<1|2>.svg`.
- Palette, silhouette e dettaglio di corazze, motori e cannoni variano con il modello e lo slot.
- Nessuna immagine delle madri, nessuna carta navicella collezionabile è stata eliminata.
- Le scudiere continuano a sbloccarsi ai livelli L3/L5, come da `src/linkedEscorts.js`.

## Istruzioni grafiche per Work
1. **Non eliminare né ripartire da zero**: conserva meccaniche, salvataggi e codice.
2. Sostituisci o rifinisci gli asset SVG mantenendo **esattamente** nomi e percorsi dei 34 file.
3. Per ogni famiglia la scudiera 1 deve essere una vera scorta difensiva e la 2 un modello d'attacco distinto e riconoscibile.
4. Le superfici devono essere metalliche sci-fi 3D, coerenti con l'arena spaziale 9:16 già approvata.
5. Mantieni fondo trasparente, orientamento coerente con le navi presenti in battaglia e spazio laterale per i proiettili.
6. Verifica visivamente allineamento, collisioni, scala e animazioni su telefono in 9:16.
7. Il motore degli scudi e le firme di distruzione sono ancora prototipi: non scambiare effetti visivi con meccaniche finali.

## Limiti attuali
Questa consegna contiene **immagini SVG disegnate per il gioco**, non i PNG originali del generatore di immagini. Una delle anteprime PNG può essere consegnata separatamente. Mancano ancora prova visiva browser e verifica build Vite.
