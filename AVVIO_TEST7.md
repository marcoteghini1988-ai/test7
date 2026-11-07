# ECLISSI STELLARE — AVVIO DEL GIOCO UFFICIALE

**Repository unico:** [marcoteghini1988-ai/test7](https://github.com/marcoteghini1988-ai/test7), ramo `main`. Non creare copie, altri repository, ingressi paralleli o schermate di prova.

## Aprire il gioco

1. Apri `test7` in StackBlitz oppure scarica il repository GitHub completo.
2. Esegui `npm ci` e poi `npm run dev` (StackBlitz può eseguire questi comandi nel terminale).
3. Entra nel gioco normalmente dalla Home: `src/main.tsx` avvia soltanto `App.tsx`, e `src/MathDuelBattle.jsx` sceglie il combattimento **3D ufficiale**.
4. Nel duello simultaneo seleziona **2 o 3 carte numeriche**, un **sistema vitale** e l'operazione richiesta. Puoi aggiungere **fino a 2 carte speciali** dalla mano di cinque. Usa **CONFERMA** per sigillare l'ordine; il tempo massimo è 30 secondi. La risoluzione di entrambi gli ordini dura **8 secondi**.
5. I pulsanti **RICAMBIO**, **ARMI**, **HANGAR** e **REGISTRO** appartengono alla stessa schermata 3D. In Hangar puoi schierare le navicelle che possiedi e configurare il mazzo speciale da 24 carte. Le 7 numeriche vengono pescate dal mazzo reale di 52 carte.

Non esiste più l'ingresso `?tacticalPreview=1`, né il menu `Flotta → Prova`: non seguirne le vecchie istruzioni.

## Motore e compatibilità

- **Duelli standard compatibili:** `src/OfficialBattle3D.jsx`, `src/simultaneousDuelEngine.js`, `src/officialBattleSetup.js`. Usano la plancia metallica Titanio 9:16, le 17 navicelle, le 42 armi montate e gli asset originali delle scudiere.
- **Piloti comuni convertiti:** `pilot_com_1`–`pilot_com_4`, gradi L1-L5. I bonus delle armi valgono soltanto con calcoli matematici corretti e un pilota effettivamente sbloccato.
- **Passiva Gaia:** `planet_char_1` (Baluardo terrestre), tre gradi di aumento dello scudo iniziale/massimo.
- **Passiva Crono:** `planet_char_6` (Primo anello), tre gradi di riduzione del primo colpo efficace alla madre.
- **Passiva Tharsis:** `planet_char_2` (Pressione marziana), tre gradi di bonus sui vitali colpiti efficacemente in sequenza, senza danni gratuiti su firme sbagliate.
- **Passive Ombre:** `planet_char_9` (Potenza disperata + Oscurità terminale), sei livelli distribuiti sui due effetti: scudo ≤35% e due vitali propri KO.
- **Passive Idra:** `planet_char_11` (Precisione criogenica + Teste alternate), sei livelli: divisione esatta e alternanza di bersagli vitali realmente colpiti.
- **Passive Leviatano:** `planet_char_8` (Marea del riciclo + Profondità tattica), sei livelli: vero rimescolamento delle 52 carte e calcolo valido con tre numeriche.
- **Compatibilità preservata:** `src/BossBattle3D.jsx` continua a gestire battaglie boss, piloti avanzati, le 14 passive boss non ancora migrate e gli ambienti con effetti ionici non ancora convertiti. Non è un gioco di prova, ma il percorso 3D preesistente che conserva poteri e salvataggi fino alla migrazione.
- **IA locale:** `src/tacticalDuelAi.js` prepara gli ordini dell'avversario senza conoscere la mano o gli ordini nascosti del giocatore. Il PvP online con server autoritativo non è ancora implementato.

## Controlli automatici

```bash
npm ci
npm run verify:logic
npm run build
npm run preflight
npm run dev
```

GitHub Actions esegue test logici, compilazione e preflight su `main`. `scripts/check-official-3d.mjs` verifica l'ingresso unico, i mazzi separati e gli asset del combattimento. **I test non sostituiscono un collaudo visivo su smartphone.**

## Grafica da conservare

- Arena base: `public/assets/mathduel/arena_titanio_9x16.webp`.
- Navi in due prospettive: `public/assets/mathfleet/views/`.
- Scafi sovrapposti: `public/assets/ship-shells/`.
- Scudiere originali: `public/assets/escorts/`.
- Montaggi originali delle armi: `ShipPresentation.jsx` e `mathFleetGeometry.js`.

La rappresentazione è una composizione 3D prospettica realizzata con asset raster e SVG: non è ancora una scena con mesh tridimensionali e telecamera libera. L'allineamento mobile di navi, carte e colpi deve ancora essere verificato su dispositivo reale.

## Lavoro residuo

Convertire le altre **14 passive dei boss**, i piloti non comuni, gli effetti a durata delle arene ioniche e le nuove **carte Personaggio e Terreno**; realizzare e collaudare le animazioni complete di armi, fusioni e scontri in formato 9:16. Non eliminare `BossBattle3D.jsx` prima della copertura funzionale e dei relativi test.

**Specifiche correnti:** [Roadmap del duello simultaneo](docs/ROADMAP_DUELLO_TATTICO_SIMULTANEO_2026-11-07.md) · [Trasferimento e checklist visiva](docs/WORK_HANDOFF_CONTROLLO_VISIVO_ECLISSI_STELLARE.md). Le vecchie istruzioni dei punti 22–30 restano disponibili nella cartella `docs/` come documentazione storica e non vanno usate per avviare il regolamento simultaneo.
