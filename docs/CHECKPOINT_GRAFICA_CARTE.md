# Eclissi Stellare — stato grafico verificato

**Fonte di verità:** repository `marcoteghini1988-ai/test7`, branch `main`. Questo file è un checkpoint; il conteggio effettivo è calcolato da `npm run check:card-art` a ogni preflight.

## Situazione al 14 novembre 2026
- **379** fronti di carte rettangolari verticali **512×768 (2:3)**, richiamati da battaglia/collezione.
- **38** con illustrazioni pittoriche WebP realmente incorporate in SVG: **10 Terreno, 12 Attacco, 16 Difesa**.
- **341** ancora con illustrazioni vettoriali procedurali (non chiamarle HD definitive).
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

## Lotto successivo: 12 fronti dipinti e verificati
Aggiornate 9 carte **Difesa**: gen-072, gen-073, gen-074, gen-075, gen-076, gen-077, gen-078, gen-080, gen-081. Aggiornate 3 carte **Attacco**: gen-003, gen-015, gen-017. I nuovi WebP sono incorporati negli SVG ufficiali; nomi ed effetti provengono dal catalogo. Il controllo logico delle carte Attacco ora ricava automaticamente il numero HD, anziché considerarlo fisso a sei.

**Totale: 38/379 illustrazioni integrate, 341 ancora vettoriali.**

## Secondo lotto aggiuntivo — 6 artwork pittorici
Altre 3 carte Difesa: gen-083, gen-082, gen-084. Altre 3 carte Attacco: gen-018, gen-006, gen-052. Immagini WebP 876×620 incorporate in SVG verticali 512×768. Nessuna modifica alle regole. Stato aggiornato e verificabile con `npm run check:card-art`: **38 HD / 379 totali; 341 ancora vettoriali**.

## Regola grafica confermata — niente nome del gioco sulle carte
Nessuna delle **379 carte** contiene la scritta «Eclissi Stellare» nel fronte SVG. Il marchio va in Home e nelle altre schermate del gioco, non sulle carte. Le carte mostrano solo nome, illustrazione, funzione, effetto e rarità. Formato invariato 512×768 verticale (2:3). Il generatore e il controllo del catalogo impediscono il ritorno della scritta.

## Aggiornamento illustrativo — 14 novembre 2026
**Stato verificabile dopo questo lotto: 42/379 carte con illustrazioni WebP**, 337 ancora vettoriali. Aggiunte e integrate **gen-055 Crinale di Plasma (Attacco, Epica), gen-067 Lancia degli Eoni (Attacco, Leggendaria), gen-079 Finta Difensiva (Difesa, Comune), gen-117 Specchio dell’Abisso (Difesa, Leggendaria)**. Per ogni carta sono stati inseriti il WebP originale e il fronte SVG 512×768 con il disegno incorporato. Le illustrazioni includono soltanto la scena ritagliata, senza titolo/effetto inventati né marchio del gioco; la cornice ufficiale conserva il colore funzione e la finitura rarità. Proseguire dai file mancanti segnalati da `npm run check:card-art`.

## Ulteriore lotto di sei Difesa — 14 novembre 2026
Inserite le illustrazioni pittoriche WebP, tutte con fronte 512×768 e identità azzurra: **gen-085 Scafo Rinforzato; gen-087 Riflesso Breve; gen-089 Pattuglia Laterale; gen-093 Manovra di Nebbia; gen-099 Anello di Intercetto; gen-118 Rotta Intoccabile**. Il dato ufficiale di nome, effetto e rarità rimane nel catalogo JSON. Non è presente la scritta «Eclissi Stellare». **Stato attuale 48/379 HD, 331 ancora vettoriali**. La fase successiva prosegue soltanto dagli ID mancanti rilevati automaticamente da `npm run check:card-art`.

## Nuovo lotto Difesa — 14 novembre 2026, 6 illustrazioni originali
Aggiunte in `test7/main` sei illustrazioni WebP generate appositamente per: **gen-086 Guardia degli Ugelli**, **gen-088 Diaframma di Piastre**, **gen-090 Serratura Tattica**, **gen-091 Reazione di Bordo**, **gen-094 Scorta Sacrificale**, **gen-095 Sentinella Ritorsiva**. Le scene sono incorporate nei fronti SVG ufficiali 512×768, senza marchio. Nessuna regola di combattimento, plancia o funzione modificata. **Stato: 54/379 con WebP pittorico, 325 vettoriali in attesa.**
