# Passo 6B — flotta epica

Il catalogo del duello integra le quattro epiche e le tredici armi del catalogo v0.1. Tutte le epiche partono con Addizione, Sottrazione e Moltiplicazione. La Divisione si sblocca a L4.

| Nave | HP per motore L1 → L5 | Armamenti |
| --- | --- | --- |
| E01 Nebulosa | 104 → 169 | W17 Corona Solare ♥, W18 Nucleo Prismatico ♦ a soglia 16, W19 Arco Vettoriale ♣ con combo ♣ + ♦ |
| E02 Tempesta | 99 → 166 | W20 Pioggia Scura ♠, W21 Onde Verdi ♣, W22 Rottura Magnetica ♥ con combo ♥ + ♠ |
| E03 Fenice | 112 → 179 | W23 Artiglio Fenice ♥, W24 Reattore Impulso ♦ a soglia 18, W25 Lama della Rinascita ♠ con combo ♥ + ♠ |
| E04 Orizzonte | 106 → 174 | W26 Cannone Esagonale ♣, W27 Condensatore Solare ♦ a soglia 16, W28 Frecce d’Ombra ♠, W29 Lancia Bipolare ♥ con combo ♥ + ♠ |

Per ogni combo, il seme primario fornisce tutte le munizioni. Il secondo seme serve ad attivare la combo. Ogni arma ha una bocca misurata sulle due viste, un profilo di proiettile, un impatto e un suono. I montaggi riusano le forme compatibili con l’armamento.

## Verifiche locali

- Build TypeScript/Vite, 78 test e preflight.
- Aurora-0, Manta Ionica e Nebulosa a L4, con sei viste caricate e 18 letture dei motori senza sovrapposizioni. La Divisione era installata soltanto sulle due Nebulosa.
- 6 ♦ ÷ 2 ♠ = 3, selezionando prima il 2. Il motore ÷ di Nebulosa è passato da 153 a 137 HP, l’Addizione è rimasta a 153 HP e il Nucleo Prismatico è rimasto in carica a 6/16.
- Test delle quattro combo, delle tre soglie e delle progressioni L1–L5. Il test su una flotta mista colpisce un solo motore ÷ con W01, W10 e W19.

## Asset e prompt

Otto viste a 887 × 887, nei file `E01_complete.webp` fino a `E04_complete.webp` sotto `public/assets/mathfleet/views/player_to_enemy` e `enemy_to_player`. Le immagini sono state create con la generazione immagini integrata usando Squalo del Vuoto come riferimento di inquadratura. Le due viste sono state esportate separatamente e compresse in WebP con trasparenza identica agli atlanti.

```text
Production sprite for Eclissi Stellare, an existing tactical space battle game. Draw ONLY {nome}, a new epic class spacecraft. {descrizione} The supplied image is a reference for rendering detail, camera pitch, paired cell layout, and visual scale. Make this ship's silhouette and plating distinct. Use realistic 3D mechanical game rendering with bright readable bevels against true alpha. Compose one horizontal 2:1 sprite atlas, two equal SQUARE cells. Left cell: entire ship centered, nose pointing straight UP, viewed slightly from the rear and above, two clearly separated primary glowing engine exhausts pointing down. Right cell: same exact ship independently rendered from front and above, nose pointing straight DOWN, the same two primary exhausts pointing up. Both views at the same scale and centered in each cell. Each primary thruster is a visible round mechanical nacelle near the rear corners. In each view place two small separate circular armoured auxiliary reactor ports side by side on the forward half of the dorsal plating, spaced widely enough to identify at small game size. These ports have narrow bright rings and no trailing flames. Preserve all tips, engines and exhausts with at least 8% empty margin around each entire silhouette and ample empty gap at the middle. Hardpoints have visible metal housings and are attached to the hull. True transparent alpha in all empty space, no background layer, floor, shadow under craft, character, text, logo, frame, divider, stars or additional object.
```

| Nome | Descrizione nel prompt |
| --- | --- |
| Nebulosa | Broad swept crescent carrier silhouette with layered angular blue-violet iridescent titanium, a small pale cyan cockpit and restrained lavender aurora lighting. Each wing extends outward and curves slightly forwards. Three compact hardpoint housings, one on the forward centerline and one on each side. |
| Tempesta | Arrowhead interceptor with jagged swept lightning-shaped wings, deep navy titanium plating, electric lime and pale cyan accents, purple cockpit. Three compact hardpoint housings on the leading wing roots and nose. |
| Fenice | A strong swept double-feather silhouette in burnished copper and ember-red plates, gilded leading edges, dark inner plates, amber cockpit. The form reads as a spacecraft. Three compact hardpoint housings on the two sides and forward centerline. |
| Orizzonte | A heavy wide hexagonal wedge hull in brushed gunmetal and pale titanium, angular tiered side plates, dark seam work, saturated emerald and warm amber accents. Four compact weapon hardpoint housings across the forward wing edges, evenly spaced and inset. |
