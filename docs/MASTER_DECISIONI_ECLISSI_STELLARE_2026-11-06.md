# ECLISSI STELLARE — MASTER DECISIONI E RIPRESA, 6 NOVEMBRE 2026

**Documento di continuità per la scaletta generale di 53 punti.**
È un registro delle decisioni concordate e dei risultati REALMENTE collegati al gioco, non una dichiarazione che tutti i 53 punti siano implementati.

## CHECKPOINT — 8 novembre 2026, Terra 10: 80 nuove prove e causa del divario di difficoltà

**Nuovo benchmark riproducibile:** `src/firstBossProgression.test.js`, 4 navicelle davvero ottenibili (N00, C01, C02, C03) × livelli L1–L4 **comprati con la Polvere Stellare reale** × cinque seed = **80 duelli aggiuntivi**. Sono presupposte nove vittorie consecutive dei settori 1–9, non simulate né garantite. Budget di base 100 iniziali + 900 vincite = 1000; la comune L4 richiede 580, la L5 richiede 1080 (solo premi base insufficienti); nove crediti pacchetto non vengono aperti automaticamente. Pilota starter `pilot_com_1` posseduto, mazzo speciale starter da 24, zero Epici, boss decks, moduli o personaggi futuri.

**Esiti 80 duelli IA/IA:** 13 vittorie, 58 sconfitte, 9 pareggi. N00 (L1–L4): 0 vittorie su 20; C01: 0/20; C02: 0/20 (4 pareggi); C03: **13/20**, con **4/5 vittorie sia L3 che L4**. Un controllo di regressione conferma che C03 L3 ha almeno due vittorie nel campione fisso, senza regalare carte.

**Esperimento controllato sullo stesso boss (40 duelli, `src/terraBossShipControlled.test.js`):** 4 madri a L3, 5 seed, boss Terra L1 sempre C02 o sempre C03, con stato iniziale equivalente al gioco originale quando il modello coincide. C03 L3 ottiene **4/5 vittorie contro C02** e **2/5 contro C03**; C02 L3 passa da 1/5 a 0/5, N00 e C01 restano 0/5 con entrambi. **Non tutto il divario dipende dal modello boss**; nessun algoritmo di selezione è stato modificato. [Actions 42501804052](https://github.com/marcoteghini1988-ai/test7/actions/runs/42501804052), **779/779 test**.

**Causa strutturale individuata:** il selettore `chooseCampaignMotherRival` dà al boss Terra il modello **C03** se il giocatore usa N00/C01/C02, ma **C02** se usa C03; il boss cambia quindi le proprie firme vitali e il corpo nave per il solo cambio madre del giocatore. **Non interpretare il rendimento di C03 come differenza di potenza a parità di avversario**. Il vero prossimo passaggio è un confronto controllato del modello boss fisso per pianeta, **senza alterare il layout o i 42 armamenti e senza cambiare silenziosamente compatibilità della 3D legacy**. Restano necessari playtest dei settori 1–9 e dei 12 boss umani.

Rapporto: [TERRA10_MATRICE_80_E_ABBINAMENTO_NAVI_2026-11-08.md](TERRA10_MATRICE_80_E_ABBINAMENTO_NAVI_2026-11-08.md). Pipeline: [Actions 42501402162](https://github.com/marcoteghini1988-ai/test7/actions/runs/42501402162), **778 test**, build Vite e preflight approvati.

---

## CHECKPOINT — 8 novembre 2026: matrice boss, acquisizione vere speciali e scala progressiva

**Correzione concreta dopo i 12 boss:** l'inventario ufficiale non conosceva **otto** Carte Speciali già valide nel motore: Scansione, Contromisura, Ricambio Numerico, Deviazione, Soppressione, Paratia, Carica e Schermo d'Urto. Ora catalogo e motore coincidono a **82 famiglie**, 25 tipi sono nei pacchetti (17 precedenti +8) e la migrazione dei vecchi salvataggi mantiene **zero copie nuove** e tutte le copie/prezzi/sblocchi originali. Non sono carte gratis; i pacchetti vanno guadagnati, aperti e poi le carte equipaggiate nel mazzo reale 24.

**Progressione corretta:** nel duello 3D ufficiale l'avversario non cresce ogni volta che il giocatore migliora la propria nave. I 120 settori sono ripartiti in cinque livelli del rivale (24 settori per livello); gli asset originali e i modelli non cambiano all'aumento del livello della stessa nave del giocatore. Modalità legacy e PvP escluse. L'IA inoltre non scarta sempre la stessa numerica quando non trova la firma: il ricambio gratuito ruota attraverso gli slot 0–6, senza duplicazioni e senza bypassare Scansione.

**Collaudo:** 213 scontri IA contro IA, tre seed × sei configurazioni (per Gaia 33 incontri dopo la Terra). Il campione mostra N00 L1 0 vittorie/36, N00 L3 2/36, N00 L5 2/36, C01 L3 2/36, L04 L5 11/36, L04 L5 Scansione+Gaia L1 13/33. Terra 1/15 vittorie, Europa 0/18 ed Encelado 0/18 nel campione: restano punti di difficoltà critica, non prova di impossibilità umana. **770 test superati**, build e preflight su [Actions 42489947159](https://github.com/marcoteghini1988-ai/test7/actions/runs/42489947159). Rapporto: [AUDIT_BILANCIAMENTO_12_BOSS_MULTI_CONFIG_2026-11-08.md](AUDIT_BILANCIAMENTO_12_BOSS_MULTI_CONFIG_2026-11-08.md).

**Non chiudere ancora "bilanciamento definitivo":** dopo gli upgrade vanno testati collezioni storiche realmente ottenibili, sblocchi, piloti, mazzi, speciali e boss di Europa/Encelado, con vari seed e una strategia umana; serve ancora prova Android. La grafica e i 42 armamenti restano invariati.

---

## CHECKPOINT — 8 novembre 2026, audit reale prima di tutti i boss

**Verificato in GitHub:** 35 duelli contro **Terra settore 10** con cinque configurazioni ricavate soltanto da vittorie, sblocchi e potenziamenti reali dei settori 1–9. Premi ordinari + partenza: **1000 Polvere Stellare**. Prima del boss ottenibili N00, C01 (3), C02 (6), C03 (9). Con spesa di 580, **C03 L4** è accessibile senza capsule e ha registrato **3 vittorie, 1 sconfitta, 3 pareggi su 7 seed**; con almeno 15 stelle e *prima capsula riscattata*, la Polvere disponibile sale a 1160, acquistare C03 L5 costa 1080 e le simulazioni registrano **6 vittorie su 7**. Nessun personaggio o carta boss futura concessa. È una simulazione IA, non prova di bilanciamento umano o dei settori antecedenti.

**Sblocco e boss 2–12:** introdotto il helper **sola lettura** `src/officialBossProgressionAudit.js` con test automatici che ricostruiscono la flotta teoricamente disponibile **prima** di ogni boss e impediscono l'uso anticipato delle navicelle premio assegnate alla vittoria dello stesso. I 12 boss conservano ID planetari storici, settori canonici 10…120 e curva di livello rivale. Nessun gating inventato sugli inventari già posseduti: l'helper non cambia i salvataggi.

**Punti rimasti aperti:** verificare i primi 9 settori con una nave effettivamente disponibile in ciascuno; verificare i reali acquisti/carte speciali/piloti entro boss 2–12 e la sostenibilità economica; playtest tattico umano, in particolare acquisizione di C03 e apertura capsule. Non abbassare preventivamente le statistiche di Terra.

Rapporto e test: [PROGRESSIONE_12_BOSS_E_TERRA10_2026-11-08.md](PROGRESSIONE_12_BOSS_E_TERRA10_2026-11-08.md), `src/officialFirstBossProgression.test.js`, `src/officialBossProgressionAudit.test.js`. **776 test e 3 verifiche della plancia/build superati**.

---

## CHECKPOINT — 8 novembre 2026, 108 duelli boss e scelta efficiente delle formule

**Codice verificato:** `src/tacticalDuelAi.js` ora preferisce una formula a **3 numeriche autentiche** quando può concludere un vitale a 7–8 HP (8 danni) invece di una formula da 2 carte (6 danni). Se 2 carte bastano o il vitale è ancora a 10 HP, l'IA non consuma la terza numerica inutilmente. Nessun potere, carta o conoscenza segreta aggiunta. Test mirato e suite completa superati.

**Benchmark multi-seed:** 12 boss × 3 configurazioni realmente costruite × 3 seed = **108 combattimenti IA**, max 20 cicli. C01 L1 con starter: **0 vinte, 35 perse, 1 pareggio**; R04 L3 con starter: **5 vinte, 22 perse, 9 pareggi**; L04 L5 con starter: **8 vinte, 14 perse, 14 pareggi**. Questi numeri non sono una percentuale di successo umana e non giustificano da soli la modifica indiscriminata delle abilità dei boss.

**Punto ancora aperto:** verificare la reale collezione ottenibile entro Terra settore 10, e poi ai 12 boss, incluse carte numeriche boss, carte speciali acquisite, piloti/personaggi, moduli, Epici e upgrade. Non usare inventari fittizi per proclamare un boss battibile. Il 9:16 metallico e le armi fisiche restano invariati.

Rapporto e prove: [MATRICE_BOSS_12_MULTI_SEED_2026-11-08.md](MATRICE_BOSS_12_MULTI_SEED_2026-11-08.md). Ultimo controllo di riferimento: [Actions 42493597908](https://github.com/marcoteghini1988-ai/test7/actions/runs/42493597908), **772 test, build e preflight superati**.

---

## CHECKPOINT SUCCESSIVO — 8 novembre 2026, quattro vitali e sistema di esposizione

**Stato codice su `test7/main`:** attacchi di precisione di base a **6 HP con 2 numeriche** o **8 HP con 3 numeriche** contro quattro vitali da 10 HP; primo impatto ordinario crea un'avaria (4/10 o 2/10) invece del KO immediato. Bonus autentici restano attivi; le 42 armi native, l'HP iniziale e i 20 cicli non cambiano. Copertura reale dei **136 casi 17 navi × 4 vitali × 2 livelli** nei test, oltre ai normali boss.

**Omissione corretta nella scoperta delle firme:** la scelta del vitale da esporre attraverso i quattro pezzi già presenti della plancia è ora un ordine reale `exposureTarget`, distinto dal colpo numerico. Quando il danno reale alla barriera apre uno slot, il bersaglio selezionato viene esposto e da quel momento la sua firma è visibile; **zero danno, zero bonus/Carte Speciali inventate, zero visibilità prima della soglia**. Chi vuole conoscere prima le firme deve usare una Carta Scansione autentica. L'IA di entrambi i lati segue la stessa regola e non legge mani o firme nascoste. Nessun asset o slot spostato.

**Verifica:** [Actions 42486214955](https://github.com/marcoteghini1988-ai/test7/actions/runs/42486214955), **762/762 test, build e preflight riusciti**.

**Benchmark avversari, non bilanciamento definitivo:** con stessa seed171, 12 boss reali e solo mazzo starter, C01 L5 = 12 sconfitte; L04 L5 = 8 sconfitte e 4 pareggi. L'IA A infligge ora danni ai vitali in 11/12 incontri usando C01 (prima erano 0/12), ma il campione resta sfavorevole. Richiede confronto di più seed, collezioni/sblocchi corretti, 33 personaggi, equipaggiamenti e partite umane; non cambiare silenziosamente bonus boss o ricompense sulla base di una sola serie IA.

**Prossimo blocco:** matrice multi-configurazione di difficoltà dei 12 boss, decisioni razionali su motore/armi/generatore/centralina, tempi reali fino al limite 20, leggibilità della nuova esposizione su smartphone; asset/audio definitivi sempre rinviati. Rapporto: [BILANCIAMENTO_QUATTRO_VITALI_2026-11-08.md](BILANCIAMENTO_QUATTRO_VITALI_2026-11-08.md).

---

## AGGIORNAMENTO DOPO L'AUDIT — 8 novembre 2026, settori e premi boss

È stata corretta nel codice **la numerazione canonica 1–120 dei settori** per i dodici pianeti del catalogo, pur conservando gli ID storici: Saturno/ID 6 → settore 40, Encelado/ID 20 → settore 120. L'ingresso `MathDuelBattle.jsx` normalizza la numerazione prima di scegliere tra il motore simultaneo e il fallback, senza modificare la plancia. Il controllo del boss reale ora rifiuta in entrambe le modalità le coppie settore/pianeta incoerenti. L'App assegna la reliquia storica solo se il risultato contiene un boss autentico vinto; la stessa reliquia non si duplica. I pacchetti primo settore non si duplicano fra Campagna e Avventura e non vengono attribuiti oltre il 120. Salvate le chiavi storiche dei premi senza migrazione distruttiva. **753 test, build e preflight riusciti** su [Actions 42483315300](https://github.com/marcoteghini1988-ai/test7/actions/runs/42483315300). Rapporto dettagliato: [INTEGRAZIONE_SETTORI_RELIQUIE_RICOMPENSE_2026-11-08.md](INTEGRAZIONE_SETTORI_RELIQUIE_RICOMPENSE_2026-11-08.md). Da non considerare chiuso il collaudo Android, il percorso Cripta post-vittoria reale o la migrazione dei claim storici ambigui. **Prossimo blocco operativo: vitali, danni 10/10, scelta strategica dei bersagli e durata dei boss.**

---

## CHECKPOINT OPERATIVO — 8 novembre 2026: audit incrociato delle scalette

**Questo checkpoint prevale sulle descrizioni di stato più vecchie presenti sotto, senza alterare la numerazione originale dei 53 punti.** Raccolta basata sullo storico progettuale recuperabile, sui documenti in `docs/` e sul codice di `test7/main`. Il testo integrale originale di tutti i 53 punti non è disponibile: NON ricostruire o segnare come conclusi i numeri mancanti per deduzione. I punti 44–47 di una scaletta locale del 6 novembre non sono necessariamente gli stessi della scaletta originale.

**Codice controllato:** commit `ecc33110227c61dacb72dbbb2b3920a319b0036d`; workflow [GitHub Actions 42478304288](https://github.com/marcoteghini1988-ai/test7/actions/runs/42478304288) riuscito. L'ultimo audit boss documenta 744 test, build e preflight; la CI NON costituisce collaudo Android né una partita completa.

### Decisioni più recenti, in ordine di prevalenza

- **Duello ufficiale simultaneo**: A e B preparano segretamente per 30 s, risoluzione comune di 8 s; in caso di doppio KO, pareggio. Questa decisione del 7/11 sostituisce l'originaria battaglia continua e i turni alternati. Vecchi motori solo per compatibilità controllata.
- **Arena originale 9:16 invariata**: madre centrale, fino a due scudiere ai lati (zero a L1–L2; una a L3–L4; due a L5). **17 madri, 42 armi fisiche**, quattro rarità e cinque livelli restano. Un precedente schieramento di 2–3 madri indipendenti NON è ancora operativo nel motore simultaneo e non va confuso con la formazione madre+scudiere.
- **Due mazzi veri e distinti**: 52 numeriche, 7 in mano; 24 Carte Speciali equipaggiate, massimo 6 copie per tipo e 5 in mano, reintegro reale fino a cinque. Limite attuale: massimo due speciali preparate per ciclo. Calcoli validi con 2/3 numeriche, a volte Poker alternativo, attaccano vitali; le 42 armi native attaccano barriera. I semi delle numeriche servono alla compatibilità/caricamento delle armi, NON attribuiscono cure o attacchi universali.
- **Quattro vitali fisici** (motore, armi, generatore, centralina) con danni localizzati e conseguenze vere; tutti e quattro a zero = KO della madre. La **Faglia** è una Carta Speciale: permette un colpo mirato con firma valida senza abbattere prima la difesa, una volta per partita e fino a 5 HP ai vitali; non azzera la barriera e ha contromisure. Non creare attivazioni gratuite.
- **Fusioni, Dado, Numero Bomba, Barra Malus, Dorata, Mutazione Firma, 35 Moduli/equipaggiamenti e ogni abilità ATTIVABILE** si usano soltanto come Carte Speciali autentiche possedute, pescate e consumate. Le armi montate non diventano carte; identità/passive innate dei boss e le passive numeriche sono sistemi distinti, non pulsanti gratuiti.
- **Dodici boss**, una capacità nemica esclusiva ciascuno; **dodici mazzi numerici boss e 23 passive**, ciascuna con tre gradi (4 mazzi con una abilità, 5 con due, 3 con tre). **Dodici Carte Personaggio Boss** del giocatore, sbloccate dopo vittorie autentiche, sono un'altra categoria: temporanee e max un personaggio attivo. I **33 comandanti/personaggi storici** non devono essere scambiati automaticamente per queste dodici carte temporanee.
- **12 reliquie → 6 Epici** via fusioni reali, convertiti in Carte Speciali temporanee, senza doppio bonus passivo e senza sblocchi gratis; inventario e slot legacy conservati. **4 Carte Terreno** nel mazzo speciale esclusivamente PvP: 2 cicli, ambiente/effetti simmetrici; due terreni opposti giocati insieme si annullano. Le **arene boss** sono esclusive e invariabili; arene ordinarie planetarie hanno effetti graduati.
- **Campagna**: 120 settori / 12 boss, mazzi nemici, piloti e ricompense già collegati logicamente al motore simultaneo per i casi riconosciuti. I salvataggi/piloti incompatibili entrano in fallback 3D con sole famiglie speciali eseguibili e carte realmente possedute; non assegnare copie di riserva gratuite. PvP attuale contro IA **non è multiplayer umano online**.

### Cosa risulta eseguito e cosa no

| Blocco | Stato controllato al checkpoint | Da non confondere con |
| --- | --- | --- |
| 12 poteri esclusivi + 23 passive boss + 12 incontri e piloti | **Codice e test**; ultima correzione: Neurotossina Venere sulle cure reali e sovrapposizioni | Bilanciamento e percorso umano fino alla vittoria non verificati |
| Carte Modulo/Dado/Bomba/Malus/Dorata/Faglia/Mutazione | **Logica e test nel simultaneo**, consumo condizionato alla carta | Compatibilità universale del fallback legacy |
| Carte Personaggio Boss, 6 Epici, 4 Terreni PvP | **Primo collegamento logico**, inventari e vincoli; immagini/valori ancora prototipali | Carte liberamente possedute, PNG finali, PvP online |
| Navi, scudiere, impatti fisici, cockpit e plancia | **Asset e implementazione iniziali** | Verifica visiva su 17 modelli, accuratezza delle 42 armi, mesh/animazioni finali |
| Shop, Hangar, collezioni, settori e premi | **Percorsi automatici presenti** | Economia definitiva e percorso end-to-end giocato |
| GitHub Actions | **Verde** al commit sopra | Test di usabilità, difficoltà, Android e rete |

### Omissioni recuperate dalle scalette: ordine di lavoro senza cambiare grafica

1. **CHIUDERE LA RIPRESA DEI 12 BOSS**: consolidare i percorsi Campagna/Avventura, arene bloccate, requisiti di proprietà delle carte e del mazzo, risultati, reliquie e 12 identità; aggiungere verifiche di fine battaglia e di persistenza dove oggi si testano principalmente pochi cicli IA. Fonti: [audit boss](AUDIT_12_BOSS_ESCLUSIVI_2026-11-08.md), [migrazione boss](MIGRAZIONE_BOSS_E_ANIMAZIONI_SCUDIERE_07_11_2026.md), [scaletta delle passive](SCALLETTA_BOSS_23_PASSIVE_COMPLETE_2026-11-07.md).
2. **QUATTRO VITALI E DURATA**: precisione standard 10 HP contro vitali standard 10 HP può abbattere un sistema intatto con un colpo. Misurare frequenza e risposte strategiche a danni parziali, riparazioni, Faglia, Mutazione, barriera e scudiere; poi stabilire valori coerenti, senza cambiare numeri tacitamente. Fonte: [strategia vitali](QUATTRO_VITALI_STRATEGIA_DUELLO_2026-11-07.md).
3. **CARTE PERSONAGGIO, COMANDANTI E PILOTI**: separare comandante passivo di flotta, 33 personaggi storici e nuove carte temporanee attivabili; verificare conversione dei piloti avanzati, sblocchi, livelli e che NESSUNA abilità attivabile rimanga un pulsante gratis. Sono categorie con sovrapposizioni storiche, non da contare come "tutte concluse".
4. **MAZZI E PROGRESSIONE**: sblocco 1 mazzo numerico iniziale senza passiva + 12 mazzi boss con grafica/abilità associate; gradi 3/6/9, acquisto/miglioramento nello Shop, ricompense autentiche, rarità e pacchetti, Epici da reliquie e 16 navi ottenibili. Verificare reali flussi inventario→equipaggiamento→battaglia→premio→salvataggio, non solo funzioni isolate.
5. **FIRME E VARIETÀ TATTICA**: 68 firme sulle 17 navi sono in codice ma i valori restano prototipali. Completare firme dei 12 boss e scudiere, alternative Poker senza farne l'unico sistema, colpi native e cadenza delle 42 armi, contromisure, scelta dell'IA e target fino a 20 cicli.
6. **MODALITÀ E SERVIZI STORICI**: verificare compatibilità Avventura, Campagna, sfida giornaliera e collezione; non riattivare l'antico Poker Battle. Il vero PvP online sincronizzato/server autorevole, eventuali classifiche e ricompense attendono progettazione e test separati.
7. **CONTROLLO VISIVO FINALE** (post-regole, come richiesto): confronto della plancia vera con screenshot/ZIP, 7+5 carte, mazzi a sinistra e slot bersaglio distinto, danni localizzati ai pezzi REALI, scudiere e 42 colpi per arma. Completare PNG distinti per personaggi/boss, speciali, terreni e fondali, oltre all'audio; non spostare arena o slot come test. Controllo Android 9:16 e prestazioni.
8. **TEST DI PARTITE COMPLETE**: non fermarsi al conteggio test. Simulare e poi giocare i 120 settori e i boss, verificare ritmo, sblocco premi, ricicli di tutte le carte, parità A/B e 17×L1–L5. Tutorial sospesi fino a regole stabili.

**Numerazione originale:** dai registri recuperabili risultano riferimenti a 21 (semi), 22–30 (flotta, calcoli, mazzi), 31 (passive boss), 32–39 (speciali), 40–41 (comandante/personaggi), 42–43 (arene), 50 (carte navicella/personaggio), 51–52 (flotte/vitali) e 53 (mazzi boss); **i testi integrali dei punti intermedi e di 43–53 non sono disponibili in modo completo**, quindi non assegnare nuove descrizioni o percentuali di completamento per numero.

**Avanzamento dopo l'audit (8/11):** aggiunta verifica automatica completa di tutti e 12 i boss, dall'avvio all'esito entro **20 cicli**, con IA sui due lati e controllo a ogni ciclo di arena fissa, boss/mazzo corretto, 52 numeriche senza duplicati, 24 speciali senza duplicati, mani 7/5, vittoria/sconfitta/pareggio e idoneità ai premi **solo per vittoria**. Codice: `src/officialBossEncounter.test.js`, commit `2928ee232678e251fb62b909d49279e94ffeb7e2`. [Actions 42481027062](https://github.com/marcoteghini1988-ai/test7/actions/runs/42481027062): **test logici, build e preflight riusciti**. È un'integrazione simulata, NON un playtest umano né un controllo della persistenza reale dopo riavvio. La prima priorità di seguito resta valida per quest'ultima verifica di salvataggi/premi e per il collaudo manuale.

### Continuità immediata

Dopo il controllo della Neurotossina Venere, la priorità resta **verificare la chiusura dei dodici percorsi boss e il loro risultato**, poi affrontare il **colpo standard 10/10 ai vitali**, prima di toccare parametri del bilanciamento o la grafica. Le correzioni vanno direttamente su `test7/main`, senza creare una copia del progetto. I valori attuali, soprattutto quelli di bilanciamento, restano provvisori.

---

## Repository di lavoro — vincolo inderogabile
- Repository unico di sviluppo: `marcoteghini1988-ai/test7`, ramo ufficiale `main`, aggiornato direttamente su richiesta dell'utente.
- La versione corrente del gioco è su `test7/main`. Nessuna copia/repository `test8` da usare per gli sviluppi futuri.
- `main` incorpora sorgenti React/Vite, catalogo, asset, collezione, Shop, Hangar, duello e test.
- Continuare su questa base, senza reinizializzare il progetto né reintrodurre come regolamento il vecchio Poker Battle. Tenere i vecchi componenti dove servono alla compatibilità.

## Punti già presenti nel codice

### Arena e flotta
- Arena metallica spaziale verticale **9:16**; sette carte numeriche visibili; nessun ritorno alla griglia azzurra.
- **17 navicelle madri** collezionabili, **42 armi integrate**, quattro rarità, cinque livelli e 85 varianti di presentazione delle carte/navi preesistenti.
- 17 sagome SVG differenziate `public/assets/ship-shells/` introdotte al punto 22; non sono ancora mesh 3D finali.
- UNA carta madre equipaggiata con scudiere subordinate, senza rendere le scudiere carte autonome. A L1–L2 madre soltanto; L3–L4 una scudiera; L5 due scudiere. 34 asset scudiere già presenti, 34 armi subordinate e ruoli/dottrine differenziati.
- Le nuove meccaniche madre/scudiere sono attive nella modalità di prototipo con una sola madre; una formazione storica da 2–3 carte mantiene ancora il motore legacy, in attesa della migrazione.

### Combattimento e bersagli
- Battaglia continua: il giocatore non ha timer obbligatorio; l'IA ha intervallo di scelta (attualmente 35–40 s nei settori iniziali, parametri da bilanciare).
- Numeriche da **sette carte** in mano, inizialmente standard da 52. Valore = munizioni, seme = compatibilità dell'arma; calcolo valido abilita il tiro e non costituisce il danno.
- Attacchi anche contemporanei, proiettili applicano gli HP **all'arrivo** e non sovrascrivono altri impatti.
- Scudo madre e quattro vitali: **motore, sistema armi, generatore scudi, centralina**. Soglie 75/50/25/0; l'attaccante sceglie la parte da esporre. Per vincere bisogna distruggere tutti e quattro i vitali.
- Scudiere con scudo proprio e formula finale dopo l'azzeramento; nessun HP inventato. Distruzione della centralina interrompe coordinazione e bonus collegati.
- Firme matematiche/Poker definitive PER MODELLO, valori di difesa, impatti sulla scocca: **ancora da decidere e completare**.

### Punto 22 — formazioni e fusioni
- Formazioni: equilibrata / guardia / assalto, con intercettazione e danni modificati; i valori attuali sono segnaposto.
- Sincronia 0–100: aumenta coi calcoli validi, intercettazioni e attacchi alle scudiere.
- Due fusioni PROTOTIPO: **Fusione Barriera** e **Fusione Assalto**, tra madre e una scudiera. Consumo 100 Sincronia, durata 12 s, ricarica 28 s, numeri NON definitivi. Una scudiera agganciata non spara né riceve numeriche da sola; la difesa consuma il suo scudo esistente.
- L'altra scudiera resta indipendente. Fusioni fra scudiere e fusione tripla DA PROGETTARE.

## Correzione vincolante del Punto 22 e fondazione del Punto 30 — carte speciali (6 novembre)
**UNA FUSIONE SI ATTIVA ESCLUSIVAMENTE GIOCANDO LA RELATIVA CARTA DEL MAZZO SPECIALE.**
La Sincronia piena non autorizza più una fusione senza carta. Il pulsante MANOVRE può ancora cambiare formazione, ma non effettua fusioni gratuite. Anche l'IA deve possedere e consumare una speciale.

- Due mazzi e due mani separate: **7 numeriche + 5 speciali**.
- Dopo ogni speciale usata, pescata **immediata** fino a 5 speciali; nessun limite arbitrario aggiuntivo alla frequenza di pescata/uso.
- Si ammettono più copie dello stesso tipo speciale. Si potranno giocare più speciali nella stessa finestra d'azione purché gli effetti siano compatibili. Il motore attuale impedisce due fusioni simultanee della medesima madre, perché sono incompatibili.
- Catalogo **attuale implementato (Punto 27)**: sei tipologie di carte speciali: `Fusione Barriera`, `Fusione Assalto`, `Copertura Tattica`, `Colpo Perforante`, `Impulso Ionico`, `Corrosione`. Mazzo dimostrativo 24 istanze (**4 per tipo**), distribuzione temporanea con recupero degli scarti per mantenere la mano a cinque. Copertura Tattica protegge la madre dal prossimo colpo entro 15 s usando lo scudo della prima scudiera; non richiede Sincronia, non si cumula con le fusioni. Perforante, Ionico e Corrosione si applicano solo a una scarica effettiva contro lo scudo madre, fino a **due effetti distinti per attacco**, senza attribuire poteri ai semi numerici. Vedi `docs/PUNTO_27_EFFETTI_STRATEGICI_COLPI.md`.
- L'utente sceglie la carta dalla propria mano e la scudiera bersaglio. Se manca Sincronia/una scudiera disponibile, la carta NON viene consumata.
- Numeriche e speciali non si sostituiscono; l'azione speciale non utilizza o modifica le sette numeriche.
- Le altre speciali non devono essere inventate prematuramente; definire prima meccaniche, effetti, costi, sinergie e limiti. Lo schema del motore è predisposto per ampliare il catalogo.
- Il mazzo speciale potrà essere costruito da carte possedute/ottenute dai pacchetti; **economia, 20/25 carte e sblocchi NON sono ancora approvati come numeri definitivi**, né implementati.

## Decisioni consolidate MA non ancora collegate integralmente

1. **Calcoli di due O TRE carte**, consumate all'uso; risultati inizialmente interi positivi. Ora la battaglia attiva risolve le coppie; estensione a 3 numeriche in attesa del progetto dell'operazione concatenata e della UI.
2. **Un comandante per la flotta**, non un comandante distinto per ogni navicella; deve conservarsi anche se una nave viene distrutta. Da migrare nei moduli di gioco attivi.
3. Navi e scudiere devono poter scegliere tra attacco numerico e abilità strategica da 1 o 2 speciali compatibili. Gli effetti di 2 speciali si combinano in UN'azione; le altre abilità sono ancora da definire. La battaglia non deve reintrodurre turni forzati per farlo.
4. La **protezione reciproca**, l'attacco coordinato e le formazioni devono avere conseguenze sugli scudi/armi/HP reali; non creare danno o HP fittizio.
5. Le speciali potranno comportare effetti di congelamento, perforazione, incendio, elettricità, esplosione, corrosione, sabotaggio, barriera, riparazione e altri effetti strategici, ma **per-card: numeri, durata e compatibilità da stabilire**, non spacciati per già implementati.
6. I semi delle **numeriche** al momento non hanno poteri automatici di cura/danno/tempo/Etere: restano identificatori di caricamento. Eventuali ruoli universali dei semi o passivi del mazzo numerico richiedono una decisione finale coerente con questa regola; evitare di reintrodurli tacitamente.
7. Madri e scudiere devono differenziarsi nel design e nei ruoli; il sistema di danni deve far vedere chiaramente motori/vitali e le reali parti che subiscono attacchi.
8. Modalità avventura/campagna, boss, collezione, progressione, mercati di carte, piloti, IA, salvataggi e bilanciamento richiedono completamento integrato: l'esistenza dei menu/componenti legacy non equivale alla loro finalizzazione con il nuovo regolamento.

## ORDINE DI SVILUPPO — prossimi punti della scaletta master

- **22 completato come prototipo logico e di UI**: formazioni, protezione e fusioni; corretto ora il metodo d'attivazione.
- **22B / preparazione del 30: mazzi separati e carte fusione**. Sono già presenti modulo, UI, IA e test. Non è una rinumerazione della scaletta da 53 punti.
- **23: collaborazione madre/scudiere**. Protezione, fuoco coordinato e ruoli esistenti verificati con test aggiuntivi; sinergie avanzate NON concluse. Vedi `docs/PUNTO_23_COLLABORAZIONE_NAVICELLE.md`.
- **24 (identità e ruoli)**: le 17 madri possiedono 34 scudiere con ruolo difensivo nel primo slot e offensivo nel secondo. La verifica è inclusa nei test; approfondimenti tattici da completare. Vedi `docs/PUNTO_24_RUOLI_FLOTTA.md`.
- **25 (protezione madre)**: tre difese distinte, automatica / formazione / carta Copertura Tattica da 15 s e un solo impatto, sempre consumando HP reali della scudiera 1. Logica e interfaccia create, bilanciamento aperto. Vedi `docs/PUNTO_25_PROTEZIONE_MADRE.md`.
- **26 (danni localizzati)**: AVARIA al 50% HP, KO a zero; riduzioni progressive operative a motore, armi, generatore scudi e centralina. HUD, log e test aggiornati. Vedi `docs/PUNTO_26_DANNI_LOCALIZZATI.md`; bilanciamento da collaudare.
- **27 (effetti dei colpi)**: tre nuove carte strategiche Perforante, Ionico e Corrosione, con durata, interazione e consumo verificati da test. Il catalogo completo è ora di sei tipi (dati di bilanciamento ancora provvisori). Vedi `docs/PUNTO_27_EFFETTI_STRATEGICI_COLPI.md`.
- **28 (calcoli e firme)**: 2/3 numeriche giocabili con catena esatta, firme matematiche fisse a inizio battaglia per modello, coppia/tris facoltativi su alcuni vitali, senza mai rendere Poker l'unica strada. L'IA dispone di ricerca delle triple. Firme definitive e Poker a 4/5 carte da sviluppare. Vedi `docs/PUNTO_28_CALCOLI_FIRME_VITALI.md`.
- **29 (ritmo e bilanciamento)**: IA con scelta di colpi validi contro firme math/Poker, mazzo numerico riciclato senza duplicazioni solo nelle nuove battaglie, ricambio manuale/IA da una carta quando non esiste un attacco valido (ricarica tecnica 15 s), e metriche di fine partita per calibrare durata e risorse. **Prototipo logico verificato; bilanciamento empirico ancora aperto**. Vedi `docs/PUNTO_29_RITMO_BILANCIAMENTO.md`.
- **30 (costruzione mazzi speciali)**: inventario persistente indipendente, editor di 24 carte, copia massima 6 per tipo e saldo possedute/equipaggiate, pacchetti ricompensa da tre carte sulla prima vittoria per settore, due nuove speciali di supporto e tre combinazioni offensive a due carte. Prima versione operativa, rarità/economia/bilanciamento ancora da definire. Vedi `docs/PUNTO_30_MAZZO_CARTE_SPECIALI.md`.
- **Punti successivi**: completare i sistemi speciali, le loro interazioni/rarità, le sinergie fra flotte e le meccaniche ancora aperte. La denominazione esatta del punto 31 e l'ordine dei 32–39 vanno recuperati dal documento ufficiale originale, senza inventarli.
- **Altri blocchi della master**: parti vitali (51–52), piloti/comandante (40–41), arene (42–43), campagna (44–45), Shop (46), IA (47), grafica/sonoro finale e boss/mazzi dedicati (53). Le varianti estetiche e audiovisive sono rinviate per ora, senza cambiare le decisioni tattiche.

## Audio-visivo: RINVIATO SU RICHIESTA
**NON dedicare ora lo sviluppo alla lucidatura audio/visiva.** Le 17 sagome SVG e gli effetti di aggancio sono riferimenti tecnici temporanei. I modelli fisici 3D, l'allineamento delle bocche, l'animazione di fusione e gli effetti audiovisivi definitivi arriveranno DOPO aver inserito e provato le regole del gioco.

## Test
```sh
npm ci
npm run verify:logic
npm run build
npm run preflight
```
Verificare sempre GitHub Actions di `main` prima di dichiarare una fase conclusa. Una build automatica non certifica la giocabilità o la resa su Samsung Z Fold o altri dispositivi reali.

## Documento da seguire alla ripresa
Iniziare da **questo master**, da `docs/PUNTO_22_INTEGRAZIONE.md`, da `src/specialCards.js` e da `src/MathDuelBattle.jsx`. Aggiornare i rapporti dopo ogni nuova decisione e applicare i prossimi aggiornamenti direttamente a `test7/main`, senza nuove copie su GitHub.

## Chiusura operativa di questa sessione
- Carta fusione obbligatoria per giocatore e IA; due mani indipendenti.
- Punto 23: nuovi test cooperazione madre e scudiere.
- Punto 24: nuovi test di tutti i ruoli per 17 famiglie, con scudiera 1 difensiva e scudiera 2 offensiva.
- 257 test logici superati (17 nuovi test Punto 28, oltre ai 240 precedenti), build e preflight automatizzati; interfaccia reale e bilanciamento da collaudare.
- **Prossima priorità: proseguire i punti originali successivi al 30, verificandone la numerazione**, senza completare ancora audio/visivo.


### Ultimo avanzamento — Punto 26 (6 novembre 2026)
- Vitali madre con soglia **AVARIA 50%**, stato **KO** e log evento senza ripetizioni.
- Effetti progressivi reali su colpi madre, colpi scudiere, capacità di riparare lo scudo e coordinazione. La protezione generale non trasmette danni ai vitali senza firma valida.
- Componente scudiere, formazioni, fusioni e carte speciali precedenti mantenuti; la parte audiovisiva finale rimane posticipata.
- **225 test automatici**, build e preflight superati. Nessun collaudo fisico sul telefono ancora effettuato.
- **Prossimo: Punto 27**. Sviluppare gli effetti speciali solo con regole distinte e verificabili, senza inventare poteri automatici dei semi.


### Ultimo avanzamento — Punto 27 (6 novembre 2026)
- **Colpo Perforante**: 20% del danno scavalca l'intercettazione delle scudiere, ma non lo scudo madre o le firme matematiche.
- **Impulso Ionico**: riduce per 12 s al 70% l'intercettazione automatica delle scudiere dopo un colpo efficace allo scudo madre; non indebolisce Copertura Tattica.
- **Corrosione**: lo scudo generale subisce +25% sul primo colpo efficace successivo entro 15 s.
- 2 effetti speciali distinti possono essere preparati per una scarica; la mano da 5 speciali si reintegra dopo ciascuna carta giocata, senza toccare le 7 numeriche. Anche l'IA consuma carte vere.
- Mazzo di **prova**: 24 istanze distribuite in 6 tipi × 4 copie. Non corrisponde a una regola definitiva di deckbuilding.
- **240 test**, build e preflight verificati su `test7/main`; playtest e qualità visiva ancora da collaudare.
- **Successivo: Punto 28**. Differenziare requisiti d'attivazione e firme per modello, includendo calcoli da 2/3 numeriche e requisiti Poker senza confondere il vecchio motore.


### Ultimo avanzamento — Punto 28 (6 novembre 2026)
- 7 carte numeriche in mano; scelta di 2 o 3, con ripetizione della stessa operazione nelle triple, permutazioni e risultati intermedi interi positivi. Le 5 carte speciali e le carte tattiche rimangono separate.
- Quattro vitali con firme matematiche **fissate a inizio partita** in base al modello e agli operatori realmente disponibili. La firma è mostrata sul bersaglio ed è verificata quando il proiettile arriva; non può essere rimpiazzata dall'attaccante.
- Famiglie C/R/E/L: **coppia** opzionale per colpire il sistema armi. Famiglie E/L: **tris** opzionale per la centralina. È sempre disponibile anche una firma matematica di 2/3 carte. Queste varianti sono prototipi non il catalogo finale.
- L'IA può cercare triple quando necessario e mira ai vitali compatibili con la firma matematica. Non usa ancora le alternative Poker deliberatamente.
- **257 test automatici riusciti**, build e preflight superati. Playtest manuale e controlli su telefono ancora da effettuare.
- **Prossimo: Punto 29**, calibratura e ritmo. Combinazioni Poker a 4/5 carte e firme definitive dei boss non ancora implementate, grafica/sonoro finale rinviati.


### Ultimo avanzamento — Punto 29 (6 novembre 2026)
- La battaglia madre/scudiere resta continua; l'IA usa un intervallo autonomo e ora sceglie soltanto mosse che possano davvero soddisfare la firma dei vitali esposti, inclusa l'alternativa Poker quando presente.
- Nel nuovo combattimento il mazzo da 52 numeriche ricicla gli scarti quando la pesca finisce: nessuna duplicazione o creazione di carte. Le modalità precedenti non cambiano.
- Se non esiste alcun attacco valido, il giocatore può usare **RICAMBIO NUMERICO** dentro MANOVRE: un solo cambio con ricarica di 15 s. Anche l'IA può farlo, senza carte supplementari.
- Un rapporto di fine partita conta durata, coppie/triple giocate, carte spese, ricicli e ricambi per calibrare la difficoltà.
- **272 test automatici riusciti**, build e preflight superati su `test7/main`. Le durate obiettivo, il bilanciamento delle 17 flotte, la leggibilità 9:16 e la resa su telefono devono essere collaudati realmente.
- **Prossimo punto: 30**, ampliamento delle carte speciali e dei mazzi. Grafica 3D e sonoro definitivi successivamente.


### Ultimo avanzamento — Punto 30 (6 novembre 2026)
- **Due mazzi separati**: 7 numeriche e 5 speciali in mano. Il mazzo speciale equipaggiato contiene 24 carte reali, separate dalle copie possedute e personalizzabile nel pannello dell'Hangar e della flotta prepartita.
- **8 tipologie giocabili**: Fusione Barriera, Fusione Assalto, Copertura Tattica, Perforante, Ionico, Corrosione, **Riparazione Scudo**, **Pulizia Sistemi**. Le due nuove speciali di supporto sono inizialmente non possedute e si trovano nei pacchetti.
- Le carte di supporto consumano carte speciali vere: Riparazione max 20 HP, influenzata dal generatore danneggiato; Pulizia elimina Ionizzazione e Corrosione attive. Non vengono assegnati HP o effetti senza carta.
- Tre coppie di effetti offensivi compatibili con nome proprio; **nessun moltiplicatore aggiuntivo**. L'IA usa solo le carte nel proprio mazzo e sa utilizzare supporti quando servono.
- **Pacchetti da 3 carte**: un credito per la prima vittoria di ogni settore di Campagna/Avventura, senza premi nei test, senza ripetizione sullo stesso settore e senza valuta reale. Frequenze e rarità ancora provvisorie.
- Salvataggio della collezione speciale separato e non distruttivo rispetto alla collezione navicelle, con validazione proprietà/copertura. Un salvataggio corrotto non viene sovrascritto silenziosamente.
- **295 test logici riusciti**, build e preflight automatizzati su `test7/main`. Non è ancora un collaudo di giocabilità su telefono e il bilanciamento resta sperimentale.
- Riferimento `docs/PUNTO_30_MAZZO_CARTE_SPECIALI.md`. Prossimi punti 31–39: rispettare la scaletta numerata originale; il testo integrale non è incluso nei documenti correnti. La fase audio-visiva definitiva rimane rinviata.

### Ultimo avanzamento — Punto 31 (6 novembre 2026)
- Corretto un errore della progettazione provvisoria: la scala dei boss **non** è uniforme a 9 livelli. Su 12 boss attivi, 4 mazzi hanno una sola abilità (max L3), 5 ne hanno due (max L6), 3 ne hanno tre (max L9). Tutte le abilità hanno tre gradi consecutivi; **23 abilità** totali.
- Nuove abilità definite in `src/bossNumericDecks.js`, cablate alla battaglia matematica madre/scudiere, allo Shop preesistente e alla progressione equipaggiata senza sovrascrivere inventario, costi e ID originali.
- Le abilità non modificano le firme, non creano carte, non accendono fusioni senza speciale. Effetti registrati ad impatto; Sincronia e Riparazione sono bonus soltanto a eventi reali, con limiti.
- Spec: `docs/PUNTO_31_PASSIVE_MAZZI_BOSS.md`. Test: `src/bossNumericDecks.test.js`; verifiche CI, bilanciamento e playtest ancora da completare. Prossima fase: continuare la scaletta con punto 32 dopo i controlli, senza intervenire sulla grafica/sonoro definitivo.

### Verifiche dopo il Punto 31 e continuità 32–39
- Il precedente fallimento CI del punto 31 era un arrotondamento floating point nel moltiplicatore di Risonanza. Corretto; il run `42211895724` ha confermato **309/309 test**, build e preflight riusciti.
- Aggiunta `src/specialFlow.test.js` per coprire due speciali offensive sulla stessa scarica, rifiuto della terza senza consumo, reintegro immediato della mano a cinque e due supporti giocabili consecutivamente senza consumare numeriche.
- Run `42212283860`: **311/311 test** e build/preflight riusciti, su commit `2deda8ea393a7faff98cf23fa8e7fb13c151fdaf`.
- Scaletta originale ripristinata: 32 cinque speciali in mano; 33 dimensione mazzo speciale; 34 costruzione; 35 duplicate; 36 acquisizione; 37 combinazione numerica/speciale; 38 più speciali e ripescaggio; 39 catalogo definitivo.
- **Punti 33 e 35 confermati il 6 novembre 2026**: 24 speciali per mazzo e massimo 6 copie equipaggiate di ogni tipo, sempre tra quelle possedute. La regola è condivisa fra motore ed editor; limiti salvati v1 invariati. Documento: `docs/PUNTI_32_39_CONTINUITA_CARTE_SPECIALI.md`.


### Conferma successiva — Limiti speciali e avanzamento 32–39
- **24 carte speciali esatte** per mazzo costruito, **massimo 6 copie dello stesso tipo**: confermate dall'utente e non più numeri provvisori.
- In `src/specialCards.js` sono centralizzate le costanti lette da `src/specialDeckBuilder.js`; entrambi i percorsi validano 24/6. Aggiornati i test di 23/25 carte, sei/sette copie e riciclo prolungato senza creare nuove istanze o toccare le sette numeriche.
- **Punto 36:** sistema attuale di pacchetti gratuiti utilizzabile; rarità, costi e distribuzione rimangono sperimentali fino ai playtest.
- **Punti 37–38:** due effetti speciali offensivi distinti consentiti per un colpo matematico valido, il terzo rifiutato; reintegro immediato delle cinque speciali. Nuovi test di regressione sul riciclo.
- **Punto 39:** catalogo di otto tipologie operativo, ancora da ampliare dopo verifica delle meccaniche e prove pratiche. Nessuna nuova carta introdotta senza ruolo distinto.
- Resta necessario controllare la nuova esecuzione CI e provarne la giocabilità su telefono. Non anticipare la fase audiovisiva finale.


### Proseguimento del punto 39 — Riparazione Scudiera (6 novembre 2026)
- Aggiunta nona carta speciale `support-escort-repair`: ripara **fino a 15 HP dello scudo di una scudiera selezionata** usando una copia reale, senza creare una nuova scudiera, rianimare distrutte o oltrepassare il massimo.
- Il bersaglio della riparazione può avere scudo a 0 se la scudiera non è distrutta. Centrale madre KO, scudiera fusa ancora agganciata, scudo pieno o bersaglio assente impediscono l'uso e non consumano la carta.
- Il giocatore sceglie la scudiera dal pannello, l'IA usa lo stesso percorso con la carta effettivamente nella sua mano; nessuna modifica alle sette numeriche.
- Collezioni precedenti nello schema v1 senza la nuova tipologia vengono migrate in lettura con 0 copie del solo nuovo tipo. Non azzerare gli sblocchi; la nona carta può arrivare dai pacchetti, senza assegnazione automatica.
- Aggiunti `src/escortRepair.test.js` e test di migrazione/acquisizione in `src/specialDeckBuilder.test.js`.
- Resta aperta la verifica della nuova CI, il playtest, il bilanciamento del valore 15 e il catalogo speciale definitivo. Fase audiovisiva invariata e rinviata. Per dettagli: `docs/PUNTI_32_39_CONTINUITA_CARTE_SPECIALI.md`.


### Avanzamento successivo — Fondazione punto 40: comandante unico di flotta (6 novembre 2026)
- **Un comandante per l'intera flotta**, equipaggiato dallo stesso inventario di piloti già salvato nell'app. Nessun comandante separato per madre o scudiere.
- `App.tsx` comunica il pilota selezionato e l'inventario a `MathDuelBattle.jsx`; `src/fleetCommander.js` ammette solo piloti sbloccati e normalizza il loro livello L1–L5.
- `src/mathDuelEngine.js` conserva l'assegnazione su `side.commander`, fuori dai singoli elementi di `fleet`; l'assegnazione non sparisce quando una scudiera o un vitale viene distrutto.
- Visibilità iniziale `CMD L…` nell'HUD; riuso della stessa assegnazione anche nei duelli di prova e nelle riconfigurazioni di flotta, senza nuove chiavi di salvataggio o perdita di progressione.
- Nessuna vecchia passiva dei personaggi Poker viene applicata automaticamente al nuovo combattimento. **Punto 41** ancora da progettare: ruoli delle carte personaggio, abilità e bilanciamento coerenti con le quattro parti vitali e la flotta.
- Test aggiunti in `src/fleetCommander.test.js` e test integrato colpo/scudo/riparazione scudiera in `src/escortRepair.test.js`. Test e build dei nuovi commit **non ancora certificati** tramite Actions, che non restituisce i workflow push con l'integrazione disponibile; verificare su Actions o eseguire `npm run verify:logic`, `npm run build` e `npm run preflight`.
- Specifica: `docs/PUNTO_40_COMANDANTE_DI_FLOTTA.md`. Grafica/audio finali rinviati, repository unico `test7/main` senza copie.


### Avanzamento — Punto 41 (6 novembre 2026)
- **33 carte personaggio** del catalogo esistente, ciascuna con una nuova abilità tattica unica nel combattimento continuo e cinque livelli, senza importare passivi del Poker classico. La loro identità e gli ID originali rimangono invariati.
- Un solo comandante per flotta, preso dall'inventario originale; rifiutati gli ID non catalogati e gli NPC sentinella. Nessuna copia di carte o nuova chiave di salvataggio.
- Bonus condizionati a veri calcoli/proiettili, oppure a danni veri alla madre, scudi e vitali. Memoria aggiornata solo dopo gli impatti efficaci. Effetti simmetrici per giocatore e IA.
- Combinazione con le 12 passive dei mazzi numerici boss: cap condiviso +35% danno e -35% protezione madre, senza applicare protezione extra alle scudiere.
- Le nuove descrizioni L1-L5 sono visibili nell'Hangar, tenendo separati i testi delle modalità classiche. Moduli: `src/commanderAbilities.js`, `src/commanderAbilities.test.js`, `src/MathDuelBattle.jsx`, `src/fleetCommander.js`, `src/pilotsSystem.jsx`.
- Dettagli e condizioni delle 33 abilità: `docs/PUNTO_41_ABILITA_PERSONAGGI.md`. **Le nuove verifiche CI/test e il playtest 9:16 non sono confermati** dal connettore (combined statuses vuoti). Non dichiarare il punto collaudato o il bilanciamento definitivo.
- Prossimo: **punto 42 — arene**. Non rifare la plancia artistica già approvata, non anticipare asset 3D/audio finali e non creare copie di `test7`.


## Aggiornamento dopo la ricognizione dei punti aperti — 6 novembre 2026

**Nuovo rapporto vincolante:** [`docs/RECUPERO_E_COMPLETAMENTO_SISTEMI_APERTI.md`](RECUPERO_E_COMPLETAMENTO_SISTEMI_APERTI.md).

La precedente numerazione locale dei punti 44–47 NON è la chiusura della master originale di 53 punti. Sono stati eseguiti interventi nel codice ufficiale `test7/main`, non semplici definizioni:
- duello madre unica in ogni avvio (senza ritorno nascosto al motore legacy per collezioni con 2–3 carte);
- madre avversaria compatibile e differenziata per settore, comandante IA diverso per i 12 boss;
- Hangar coerente, ricompense permanenti di 16 navicelle nella campagna e upgrade fino a L5 con Polvere Stellare;
- due nuove carte di fusione **Gemellare** e **Trina**: 100 Sincronia, due scudiere, HP veri, mano speciale ancora 5 e mazzo ancora 24/6;
- catalogo di 11 speciali, nuovi tipi non regalati e salvataggi v1 migrati solo con copia iniziale 0;
- PvP del nuovo motore identificato come simulazione IA finché non esisterà un protocollo online autentico.

**Non risultano risolti** tutti i 53 punti. Restano le firme matematiche definitive, l'ulteriore varietà di attacchi e boss, il bilanciamento in partite reali, la migrazione/realizzazione del PvP online, le economie più avanzate, gli asset 3D e il collaudo fisico. Non anticipare i tutorial: richiesta dell'utente. Utilizzare il nuovo rapporto operativo per le prossime correzioni senza ripetere domande già decise.


## 7 novembre 2026 — Nuovo DUELLO TATTICO simultaneo (decisione successiva)
- L'utente ha approvato come nuova meccanica di riferimento la simulazione a sei scontri: **30 secondi preparazione simultanea** di A e B, ordini sigillati o scadenza, **8 secondi di risoluzione**; non turni attacco/difesa alternati, non sparatutto continuo.
- **Armi integrate delle navicelle** = danni alla barriera; **calcoli 2/3 carte e Poker** = attacchi ai quattro vitali esposti. Carte speciali = ordini, contromisure, potenziamenti tattici, fusioni e riparazioni, non munizioni generiche. Struttura collezionabile 17 navi/42 armi, 24/5 speciali e 7 numeriche.
- Specifica e checklist: [ROADMAP_DUELLO_TATTICO_SIMULTANEO_2026-11-07.md](./ROADMAP_DUELLO_TATTICO_SIMULTANEO_2026-11-07.md).
- Prima implementazione reale separata in `src/simultaneousDuelEngine.js`, `src/tacticalDuelDemoAi.js`, `src/TacticalDuelPrototype.jsx` e relativi test e CSS. Accesso anteprima soltanto via `?tacticalPreview=1`. Non attribuisce ricompense; l'App ufficiale resta disponibile senza parametro.
- Ancora mancanti: firme definitive per 17 modelli, armamenti/animazioni fedeli nel tempo, tutte le speciali, IA boss, integrazione alle modalità, vero PvP online e collaudo telefono.


## 7 novembre 2026 — Decisioni nuove per mazzo speciale: Personaggi, Terreni, Oggetti Epici
- **Personaggi** inclusi nel mazzo speciale, con abilità temporanee e massimo uno attivo; anche i personaggi-boss sbloccati dopo la vittoria diventano carte giocabili, non bonus permanenti.
- **Terreni** come carte speciali attivabili nel PvP, con ambiente di sfondo diverso e bonus/malus temporanei. **Boss campagna**: il boss porta sempre il suo terreno esclusivo, che non si può sostituire; carte Terreno del giocatore non giocabili durante il boss anche se nel mazzo.
- **Reliquie**: 12 reliquie ottenute dai 12 boss, fuse in sei Oggetti Epici usando le coppie storiche. Gli Oggetti Epici passano da passivi legacy a speciali temporanee senza cambiare gli ID delle ricompense o cancellare sblocchi.
- **Codice sperimentale disponibile**: `src/tacticalEpicCards.js`, `src/tacticalEpicRuntime.js`, `src/tacticalEpicCards.test.js`, schermata `?tacticalPreview=1`. La migrazione ufficiale di salvataggi/bonus non è ancora attiva.
- Regole dettagliate e limiti d'integrazione: [MAZZO_UNIFICATO_EPICI_PERSONAGGI_TERRENI_2026-11-07.md](./MAZZO_UNIFICATO_EPICI_PERSONAGGI_TERRENI_2026-11-07.md).
