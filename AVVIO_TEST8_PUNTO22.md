# ECLISSI STELLARE — VERSIONE TEST8, PUNTO 22

Questa è una **copia completa di lavoro** basata su `test7/main`. Comprende tutti i sorgenti e gli asset del gioco originale, oltre alle nuove manovre e agli scafi. **Il ramo principale `main` di `test7` non è stato modificato.**

## Per provare la partita

1. Apri il ramo `work/test8-punto22-fusioni-2026-11-06` e premi **Code → Download ZIP** per ottenere il progetto completo, oppure usa questo ramo GitHub con l'importazione di StackBlitz.
2. Apri il progetto React/Vite, installa le dipendenze con `npm ci` e lancia `npm run dev`.
3. In **Flotta → Prova**, scegli una singola nave madre al livello **3 o superiore**: al livello 3 arriva la prima scudiera, al livello 5 arriva la seconda.
4. Durante un duello, usa **MANOVRE** sotto le carte per scegliere **Equilibrata**, **Guardia** o **Assalto**. I calcoli matematici corretti e gli interventi delle scudiere caricano la **Sincronia**.
5. A 100 Sincronia, premi **BARRIERA** o **ASSALTO** sulla scudiera desiderata. Una fusione dura provvisoriamente **12 secondi**. Puoi premere **SGANCIA** per separare le unità; l'attesa rimane attiva.
6. Le nuove sagome delle 17 navicelle madri sono in `public/assets/ship-shells/`. Le carte madre originali e i 34 asset delle scudiere sono conservati.

## Verifiche

```bash
npm ci
npm run verify:logic
npm run build
npm run preflight
npm run dev
```

GitHub Actions esegue le prime quattro verifiche automaticamente sul ramo. La prova grafica sullo schermo reale (soprattutto 9:16) non è sostituita dai test automatici.

## Limiti ancora aperti

- `test8` **non è un repository indipendente**: questa consegna è un ramo isolato del progetto originale, perché gli strumenti GitHub disponibili non consentono di creare un nuovo repository.
- Gli scafi sono **SVG vettoriali con stile metallico**, non modelli mesh 3D. Il posizionamento fisico di armi, parti vitali e motori sulle nuove forme richiede la rifinitura grafica finale.
- Le cinque carte speciali, la fusione tripla e le firme finali per modello non fanno parte di questa fase.
- Tutti i bonus, i tempi e le percentuali della fusione sono parametri iniziali di test.

Specifiche complete: [docs/PUNTO_22_INTEGRAZIONE.md](docs/PUNTO_22_INTEGRAZIONE.md).
