# Passo 6C — flotta leggendaria

Il duello integra tutte le 17 navi e le 42 armi del catalogo v0.1. Le quattro leggendarie partono con Addizione, Sottrazione, Moltiplicazione e Divisione.

| Nave | HP per motore L1 → L5 | Armamenti |
| --- | --- | --- |
| L01 Eclisse Reale | 134 → 218 | W30 Corona Reale ♥, W31 Rottura dei Diamanti ♦ a soglia 18, W32 Ciclone Verde ♣, W33 Giudizio Eclissi ♠ |
| L02 Singolarità | 130 → 207 | W34 Lame Singolari ♠, W35 Fulcro Ionico ♣ a soglia 20, W36 Esplosione Gemina ♦ con combo ♦ + ♠ |
| L03 Titano Ossidiana | 147 → 235 | W37 Cannone Titano ♥, W38 Obice Nero ♠ a soglia 20 |
| L04 Arca Astrale | 138 → 223 | W39 Stella Cremisi ♥, W40 Luce di Quadri ♦, W41 Sfera Flora ♣ a soglia 20, W42 Arca del Vuoto ♠ |

## Combo a memoria

- Giudizio Eclissi richiede ♥, ♦ e ♠ negli ultimi tre calcoli validi. Arca del Vuoto richiede tutti e quattro i semi negli ultimi quattro.
- La finestra avanza su ogni calcolo corretto confermato da quel lato. La scelta delle carte, il cambio carta e il passaggio di turno lasciano la finestra invariata. Un errore di calcolo confermato la azzera.
- La combo parte appena trova tutti i semi richiesti e usa tutte le picche ancora nella propria finestra, anche se l’ultima coppia ha altri semi. La memoria dell’arma si svuota dopo la scarica, così una munizione viene usata una sola volta dalla stessa arma a memoria. Le due armi conservano finestre indipendenti.
- L’indicatore in arena mostra i semi raccolti e il numero di calcoli nella finestra. L’IA valuta l’eventuale scarica senza consumare la memoria durante l’anteprima.
- Ogni colpo reale conserva il proprio proiettile e converge sul motore selezionato. Nelle raffiche sopra 26 colpi sono raggruppati i lampi accessori di lancio e contatto.

## Verifiche locali

- Build TypeScript/Vite, 88 test e preflight. I test verificano progressioni, soglie, attivazioni simultanee e a memoria, scadenza della finestra, indipendenza delle due combo e una scarica da 55 proiettili.
- Prova con Aurora-0, Eclisse Reale e Arca Astrale a L1. 10 ♣ + 7 ♠ = 17 ha registrato la prima coppia e portato il + di Eclisse Reale da 134 a 67 HP. Nel turno successivo Q ♣ + 7 ♣ ha dato 19 sul bersaglio +7. Entrambe le memorie sono tornate a zero, con mano e HP intatti.

## Asset e prompt

Otto viste WebP a 887 × 887, da `L01_complete.webp` a `L04_complete.webp`, in `public/assets/mathfleet/views/player_to_enemy` e `enemy_to_player`. La generazione immagini integrata ha usato Orizzonte come riferimento per l’inquadratura. Le viste sono state esportate separatamente con la trasparenza originale. I moduli sono ancorati alle scocche nelle due viste.

```text
Production game sprite for the existing space arena game Eclissi Stellare. Draw only the legendary spacecraft {nome}. {descrizione} Use the supplied image for realistic mechanical render detail, the camera angles, transparent margins, and the exact paired-cell format only. Two equal square cells side by side in one horizontal 2:1 atlas. Left: centered, whole spacecraft, nose pointing vertically UP, camera looking from above and slightly behind, two large distinct engine nacelles at the rear corners with short luminous exhausts downward. Right: centered, the same spacecraft rendered from above and slightly in front, nose pointing vertically DOWN, the same two exhausts upward. In both views put two small separated circular armoured auxiliary reactor ports across the forward-middle dorsal plating, with narrow bright rings and no flames. Keep those two ports clearly distinct from the main nacelles and from compact weapon housings attached to the hull. Same scale both sides. Show the complete outline including wing tips, engines and exhausts, with at least 8 percent empty space around the silhouettes and generous empty middle gutter. Strong silhouette contrast and bright readable metal bevels at small size. True transparent alpha, no floor, shadow underneath, divider, lettering, watermark, frame, stars or other objects.
```

| Nome | Descrizione nel prompt |
| --- | --- |
| Eclisse Reale | A regally armoured black-and-gold crown-shaped interceptor with two swept split wings, gilded teeth along the leading edges, a dark amethyst central canopy and restrained crimson illumination. |
| Singolarità | A graphite-and-indigo gravity cruiser with two substantial swept crescent arms framing two dark violet lens-like recesses, iridescent magenta edges, and a short pointed central prow. |
| Titano Ossidiana | A very heavy angular obsidian dreadnought, broad almost rectangular blunt plated prow with two oversized heavy gun housings flanking it, layered charcoal ceramic armor with ember-orange vents. |
| Arca Astrale | A split crescent-and-diamond star ark in luminous ivory titanium with cobalt insets, slender rose-gold rails and small teal lights. Four physically attached compact weapon housings across the forward wing edges. |
