# Eclissi Stellare — stato grafico verificato

**Fonte di verità:** repository `marcoteghini1988-ai/test7`, branch `main`. Questo file è un checkpoint; il conteggio effettivo è calcolato da `npm run check:card-art` a ogni preflight.

## Situazione al 14 novembre 2026
- **379** fronti di carte rettangolari verticali **512×768 (2:3)**, richiamati da battaglia/collezione.
- **20** con illustrazioni pittoriche WebP realmente incorporate in SVG: **10 Terreno, 6 Attacco, 4 Difesa**.
- **359** ancora con illustrazioni vettoriali procedurali (non chiamarle HD definitive).
- **4 nuove Difesa**: `gen-071` Paratia Frontale (Comune); `gen-092` Bastione a Settori (Rara); `gen-106` Trincea Orbitale (Epica); `gen-116` Aegis delle Costellazioni (Leggendaria).

## Regola immutabile
**Colore = funzione**, blu azzurro per Difesa; **rarità = intensità di fluorescenza e finitura cromata**; non usare cornici gialle per le leggendarie. Tutti i fronti hanno esattamente rapporto 2:3; l'immagine interna può essere orizzontale, senza rendere quadrata la carta.

## Procedura di produzione, senza ripetere lavoro
1. Partire sempre da questi dati GitHub e da `npm run check:card-art -- --json` prima di creare altro.
2. Selezionare nuovi ID reali ancora senza WebP; realizzare SOLO i soggetti pittorici, senza testi/regole stampati nell'immagine.
3. Posizionare `public/assets/fleet-card-illustrations/<ID>.webp`, poi rigenerare fronte `public/assets/fleet-next-cards/<ID>.svg` tramite `node scripts/generate-fleet-card-art.mjs`.
4. Salvare modifiche su **test7/main**, mai creare progetti di prova, e verificare test + build GitHub.
5. Segnalare **solo** i numeri effettivamente confermati su GitHub; se il file manca, la carta non è finita.
6. Continuare col gruppo Difesa e poi le altre funzioni, seguendo sempre l'elenco mancante generato dallo script.

Il PvP simulato, la plancia 3D originale, le sette carte e le meccaniche non sono toccati da questo ciclo grafico.
