# Eclissi Stellare — Revisione dei dodici poteri esclusivi dei boss

**Data:** 8 novembre 2026 · **repository unico:** `marcoteghini1988-ai/test7` · **ramo:** `main`.

## Regole conservate

Il motore di battaglia ufficiale è quello simultaneo con **30 s di preparazione + 8 s di risoluzione**, **52 numeriche, 7 in mano**, **24 speciali, 5 in mano**, e fino a **due Carte Speciali per ciclo**. Le **42 armi fisiche integrate** nelle 17 navicelle non sono state modificate, come non sono stati alterati gli slot e la plancia metallica 9:16.

Le **12 capacità esclusive innate dei boss nemici** non vanno confuse con gli equipaggiamenti del giocatore (che sono **Carte Modulo speciali**), le **12 Carte Personaggio Boss ottenibili da vittorie vere**, e le **23 passive dei dodici mazzi numerici**. Le capacità innate sono regole condizionali del boss, distinte dalle abilità attivabili dell'inventario del giocatore.

## Identità e verifiche in codice

Le identità e gli effetti sono configurati in `src/tacticalExclusiveBosses.js`, senza carta boss gratis al giocatore.

| Boss / pianeta | Potere esclusivo del nemico | Condizione reale che ne limita l'abuso |
| --- | --- | --- |
| Gaia (1) | Corazza Tellurica | −20% soltanto sul primo danno autentico della barriera; le scudiere non consumano l'armatura se fermano tutto |
| Tharsis (2) | Assalto Progressivo | Danni reali consecutivi aumentano il bonus 3/6/9%; si azzera senza danni |
| Matriarca Tossica / Venere (3) | Neurotossina | Solo precisione che ferisce un vitale, penalizza del 10% **una sola riparazione effettiva nel ciclo successivo** |
| Crono / Saturno (6) | Controtempo | Solo dopo una Contromisura autentica efficace: +5% alla salva nativa valida entro due cicli |
| Sentinella Ionica / Urano (7) | Sifone Quantico | Trasferisce max 8 Sincronia realmente posseduta dopo un colpo nativo efficace |
| Leviatano Abissale / Nettuno (8) | Pressione degli Abissi | +8% nativo soltanto se la barriera avversaria era al 40% o meno all'inizio del ciclo |
| Signore delle Ombre / Plutone (9) | Patto di Sangue | Paga 4 HP reali prima della fase offensiva, salvo minimo scudo / generatore KO, cooldown di tre cicli |
| Idra Criogenica / Europa (11) | Rigenerazione | +4 HP nel ciclo successivo a un vero colpo; generatore/raffreddamento/carte Cuori possono impedire o ridurre la cura |
| Generatore del Caos / Proxima b (14) | Reattore | Tre veri colpi caricano; il quarto con danno reale libera +10% e azzera la carica |
| Cristallo di Risonanza / Haumea (17) | Memoria degli Scarti | Servono almeno due numeriche scartate dall'altro lato nel ciclo precedente e danno nativo reale nel nuovo ciclo |
| Nucleo Magmatico / Io (19) | Carica, Eruzione, Raffreddamento | Fasi pubbliche fissate in tre cicli; non dipendono da carte nascoste o tiri casuali |
| Sovrano del Vuoto / Encelado (20) | Seme Dominante | Ruota ogni tre cicli; bonus precisione valido solo con seme dominante; contrastabile da un colpo vitale reale del medesimo seme |

I percorsi riconosciuti della campagna usano `officialBossEncounter` e preservano ID, arena boss esclusiva, pilota nemico e mazzo numerico progressivo. Gli equipaggiamenti non vengono regalati. La vecchia modalità compatibile rimane limitata ai salvataggi o piloti non riconosciuti; non va rimossa prima del collaudo effettivo.

## Anomalia corretta — La Neurotossina di Venere si poteva aggirare

La penalità di Venere veniva calcolata soltanto per la carta ordinaria **Riparazione Scudo**. Se il giocatore curava la barriera con altre speciali, ignorava la Neurotossina.

**Ora tutte le fonti di riparazione autentica consultano la stessa condizione di Venere:**
- Carta **Riparazione Scudo**.
- Carte Modulo con `healing`, `life_drain`, `shield_and_ether` o `singularity`.
- **Carta Dado Quantico** quando la faccia autentica è `heal`.
- **Carta Dorata di Cuori** con formula matematica autentica.
- **Carta Personaggio Idra** quando la rigenerazione vera diventa esigibile.

La penalità è del **10%**, applicata all'ammontare della cura nominale (poi gli altri fattori autorizzati, ad esempio il Terreno Plasma e il Generatore). L'effetto si consuma **solo se si recuperano realmente HP**. Se vengono usate più cure nello stesso ciclo, la penalità viene addebitata alla **prima cura efficace**; una seconda riparazione non paga due volte. La Pulizia Sistemi autentica può ancora rimuovere la Neurotossina durante la preparazione.

Un secondo difetto riguardava due colpi consecutivi di Venere: se la tossina precedente era ancora attiva e un nuovo colpo ne preparava una per il ciclo successivo, l'assegnazione della nuova scadenza poteva **sovrascrivere il veleno corrente prima di una Carta Dorata giocata in ritardo nel ciclo**. Il nuovo campo `neurotoxinPendingRound` conserva la carica successiva senza cancellare quella corrente; a fine ciclo viene promossa. Nessun turno saltato, danno extra o valuta gratuita.

**Esempi di controllo:**
- Modulo Toro L1: cura nominale 9 → **8 HP** con Neurotossina;
- Carta Dado e Dorata Cuori: cura nominale 8 → **7 HP**;
- Rigenerazione Personaggio Idra: nominale 4 → **3 HP** con Generatore sano;
- Riparazione nominale 20 e Modulo Toro 9 nello stesso ciclo: **18 + 9** HP, non 18 + 8;
- Se Venere infligge un nuovo colpo valido nello stesso ciclo della Dorata, la Dorata paga ancora la tossina attiva e il nuovo veleno rimane per il **ciclo seguente**.

## Test utilizzati

- `src/tacticalExclusiveBosses.test.js`: Gaia/Tharsis;
- `src/tacticalVenusExclusive.test.js`: precisione reale, Contromisura, Pulizia Sistemi, scadenza;
- `src/tacticalVenusRepairSources.test.js`: **6 nuove prove** su Moduli, Riparazione+Modulo, Dado, Dorata, Personaggio Idra e tossine consecutive;
- `src/tacticalChronoExclusive.test.js`, `src/tacticalIonicSiphonExclusive.test.js`, `src/tacticalLeviatanoExclusive.test.js`, `src/tacticalBloodPactExclusive.test.js`, `src/tacticalFinalFiveBosses.test.js`: capacità esclusive condizionate;
- `src/officialBossEncounter.test.js`: **12 boss × campagna/avventura**, arene, piloti, carte autentiche, risultati e ricompense;
- `src/tacticalFullBossRoadmapIntegration.test.js`: **12 boss × tre categorie di flotte × fino a cinque cicli**, nessun duplicato nelle 52 numeriche / 24 speciali, IA con ordini autentici.

**Verifica del codice:** commit `f28d1ab3d1d2bb44f01ec9dcab9d4a3cc5e0ea5d`, [GitHub Actions 42477919404](https://github.com/marcoteghini1988-ai/test7/actions/runs/42477919404), **744 test superati, build e preflight riusciti**.

## Stato residuo

Le verifiche automatiche confermano coerenza di molte condizioni e delle quantità di carte; **non sostituiscono il playtest reale**. Restano aperti la difficoltà dei dodici boss lungo i 120 settori, il bilanciamento delle cure/contromisure, le animazioni delle capacità esclusive sulla plancia originale, i PNG definitivi delle 12 Carte Personaggio, il collaudo Android 9:16 e il PvP online con autorevolezza server.

**Nessuna modifica in questo blocco alle 42 armi, all'arena approvata, alle valute o ai salvataggi persistenti.**
