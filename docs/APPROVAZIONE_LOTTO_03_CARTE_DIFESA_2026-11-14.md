# Eclissi Stellare — Lotto 03: 10 fronti Difesa HD approvati e integrati

**Data conferma:** 14 novembre 2026.
**Repository ufficiale:** `marcoteghini1988-ai/test7`, ramo `main`.
**Sorgente approvata dall'utente:** `Eclissi_Lotto03_10_Carte_CORRETTE_DA_APPROVARE.zip`, cartella `Pacchetto03`. Include 10 PNG originali 1024×1536 e `DATI_CATALOGO_VERIFICATI.json`; la panoramica approvata è `Eclissi_Lotto03_10_Carte_MOBILE.jpg`.

## Carte

| ID | Nome | Funzione | Rarità |
|---|---|---|---|
| gen-083 | Rotta di Copertura | Difesa | Comune |
| gen-084 | Vedetta di Scorta | Difesa | Comune |
| gen-085 | Scafo Rinforzato | Difesa | Comune |
| gen-086 | Guardia degli Ugelli | Difesa | Comune |
| gen-087 | Riflesso Breve | Difesa | Comune |
| gen-088 | Diaframma di Piastre | Difesa | Comune |
| gen-089 | Pattuglia Laterale | Difesa | Comune |
| gen-090 | Serratura Tattica | Difesa | Comune |
| gen-091 | Reazione di Bordo | Difesa | Comune |
| gen-092 | Bastione a Settori | Difesa | Rara |

**Correzione del registro iniziale:** gen-081 e gen-082 erano già nel Lotto 02. I 10 ID esatti del Lotto 03 sono da gen-083 a gen-092.

## Integrazione avvenuta

- I PNG sorgente sono stati controllati: ogni immagine misura **1024×1536**, verticale 2:3.
- I 10 originali sono stati esportati come WebP ad alta qualità (qualità 96) mantenendo la risoluzione nativa.
- I 10 `public/assets/fleet-approved-fronts/gen-083.webp` … `gen-092.webp` sono stati aggiunti a GitHub nel commit `f6a5ac4c6e05f1dac08d5db7d8c4d523f5ddc576`.
- `public/assets/fleet-approved-fronts/manifest.json` contiene ora **30** approvazioni (10 Lotto 01 + 10 Lotto 02 + 10 Lotto 03), con nomi, rarità, ruolo ed effetti verificati rispetto a `src/fleetNext/catalogGeneral.json`.
- Il workflow `refresh-card-fronts.yml` ha rigenerato gli SVG incorporando i WebP approvati nei fronti del gioco (commit `0ca79381f07c896f231dc6dd757a12a8cb5a5a3a`).
- I primi 20 fronti approvati non sono stati sostituiti, e non sono state alterate le meccaniche, l'arena, la Home o le navicelle.

## Vincoli per i prossimi lotti

- In ogni lotto, i nomi, i ruoli, le rarità e i testi delle carte devono coincidere con i cataloghi in repository, senza inventare effetti.
- Colore blu/ciano = funzione Difesa; finitura luminosa/metallica = rarità (gen-092 Rara, non Leggendaria).
- Formato comune a tutte le carte: **1024×1536**; disegni coerenti con la panoramica approvata; nessun marchio ECLISSI STELLARE sui fronti.
- Non sostituire gli asset approvati nelle rigenerazioni automatiche.
- Lo stato degli effetti nel catalogo può ancora essere `proposta_da_bilanciare_non_implementata`: l'approvazione grafica **non** equivale a implementazione delle meccaniche.

**Avanzamento fronti approvati:** **30/379**. Verificare il completamento dei controlli GitHub Actions dopo l'aggiornamento di questo documento.
