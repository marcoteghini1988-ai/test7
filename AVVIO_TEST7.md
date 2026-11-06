# ECLISSI STELLARE — VERSIONE UFFICIALE TEST7

Questo è il progetto unico **`test7/main`**, comprensivo di sorgenti, asset, manovre, fusioni e carte speciali. Da ora i prossimi aggiornamenti si applicano direttamente a `main`, senza copie GitHub.

## Per provare la partita

1. Apri `https://github.com/marcoteghini1988-ai/test7` sul ramo `main` e premi **Code → Download ZIP** per il progetto completo, oppure importa direttamente `test7` in StackBlitz.
2. Apri il progetto React/Vite, installa le dipendenze con `npm ci` e lancia `npm run dev`.
3. In **Flotta → Prova**, scegli una singola nave madre al livello **3 o superiore**: al livello 3 arriva la prima scudiera, al livello 5 arriva la seconda.
4. Durante un duello, usa **MANOVRE** sotto le carte per scegliere **Equilibrata**, **Guardia** o **Assalto**. I calcoli matematici corretti e gli interventi delle scudiere caricano la **Sincronia**.
5. A 100 Sincronia, apri **MANOVRE**, scegli **SCUDIERA 1/2** e gioca una delle tue **5 CARTE SPECIALI** (Fusione Barriera o Fusione Assalto). La carta viene consumata e sostituita subito. Una fusione dura provvisoriamente **12 secondi**; **SGANCIA** interrompe la fusione con ricarica.
6. Le nuove sagome delle 17 navicelle madri sono in `public/assets/ship-shells/`. Le carte madre originali e i 34 asset delle scudiere sono conservati.

## Verifiche

```bash
npm ci
npm run verify:logic
npm run build
npm run preflight
npm run dev
```

GitHub Actions esegue le prime quattro verifiche automaticamente su `main`. La prova grafica sullo schermo reale (soprattutto 9:16) non è sostituita dai test automatici.

## Limiti ancora aperti

- Il repository unico di sviluppo è `test7`. Non occorre creare repository o copie denominate `test8`.
- Gli scafi sono **SVG vettoriali con stile metallico**, non modelli mesh 3D. Il posizionamento fisico di armi, parti vitali e motori sulle nuove forme richiede la rifinitura grafica finale.
- La **mano da cinque speciali** è implementata con due Fusioni e **Copertura Tattica**; ulteriori carte, fusioni triple e firme finali restano da progettare.
- Tutti i bonus, i tempi e le percentuali della fusione sono parametri iniziali di test.

Specifiche complete: [docs/PUNTO_22_INTEGRAZIONE.md](docs/PUNTO_22_INTEGRAZIONE.md).


**Ripresa successiva:** consultare `docs/MASTER_DECISIONI_ECLISSI_STELLARE_2026-11-06.md` per tutti i requisiti consolidati. Audio/visivo rinviati.

**Nota numerazione:** le carte speciali delle fusioni sono il blocco 22B / base del punto 30; la collaborazione navicelle è il punto 23 ufficiale. Vedi `docs/PUNTO_23_COLLABORAZIONE_NAVICELLE.md`.


## Punto 25: protezione attiva
In **MANOVRE**, seleziona **SCUDIERA 1**, poi gioca la carta **COPERTURA** dalla mano speciale. Non richiede 100 Sincronia; protegge dal primo successivo attacco alla madre entro 15 s, consumando fino al 75% del danno dallo scudo reale della scudiera. La carta viene sostituita immediatamente e non è cumulabile con una fusione. Documento: `docs/PUNTO_25_PROTEZIONE_MADRE.md`.


## Punto 26: danni localizzati ai vitali
Ogni sistema della madre entra in **AVARIA** quando rimane al 50% degli HP o meno, e in **KO** a zero HP. I danni influiscono realmente sulla flotta: motore -10%/-25%, armi madre -20%/-50%, centralina scudiere -15%/-40% con intercettazione disabilitata a KO, generatore scudi riparazioni dimezzate in avaria e scudo azzerato a KO. Le parti colpite devono essere esposte e richiedono la firma matematica corretta. I danni vengono applicati all'impatto; gli stati compaiono nella plancia. Regolamento completo: `docs/PUNTO_26_DANNI_LOCALIZZATI.md`. Prossimo blocco: Punto 27; audio e grafica definitiva più avanti.


## Punto 27 — Effetti dei colpi (6 novembre 2026)
Le cinque speciali possono includere **PERFORANTE** (20% scorta aggirata, mai scudo madre/vitale), **IONICO** (−30% intercettazioni automatiche nemiche per 12 s dopo un colpo efficace) e **CORROSIONE** (+25% al prossimo danno allo scudo entro 15 s). Si possono preparare fino a due effetti diversi per una scarica; vengono consumati dalla mano speciale, che torna subito a cinque. I calcoli usano ancora sette numeriche, senza nuovi poteri dei semi. Mazzo dimostrativo: 24 carte totali, quattro copie di ciascuno dei sei tipi. **240 test automatici superati** e build/preflight riusciti. I dettagli sono in `docs/PUNTO_27_EFFETTI_STRATEGICI_COLPI.md`. Prossimo: Punto 28; audio-visivo finale rinviato.


## Punto 28 — Due/tre numeriche e firme dei vitali
Il giocatore può selezionare **due o tre carte numeriche** dalla mano di sette. Con tre carte si ripete la stessa operazione due volte, da sinistra a destra, scegliendo un ordine valido e senza risultati intermedi frazionari o non positivi. La firma di ciascun vitale è assegnata **all'avvio della battaglia** e compare accanto alla parte da colpire. L'operazione richiesta dipende dal modello. Alcuni vitali ammettono **COPPIA** o **TRIS** come alternativa al calcolo, mai come obbligo; sono sperimentali. L'IA può cercare soluzioni a tre carte. I requisiti Poker a quattro/cinque carte e le firme definitive per boss restano da progettare. **257 test superati**, compilazione e preflight riusciti. Il riferimento è `docs/PUNTO_28_CALCOLI_FIRME_VITALI.md`. Punto successivo: 29, bilanciamento e ritmo; audio-visivo finale rinviato.
