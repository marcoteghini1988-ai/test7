# Eclissi Stellare — PROPOSTA: combinazioni di carte a bersagli multipli
Data: 14 novembre 2026
Stato: **PROGETTAZIONE, NON ANCORA IMPLEMENTATA**. Non modifica il motore del gioco, salvataggi, cataloghi, immagini o plancia.

## 1. Concetto
L'idea parte dal *principio di raccogliere carte complementari* (senza ricopiare Exodia e senza vittoria automatica): un mazzo può essere costruito per **preparare attacchi che colpiscono 2, 3 o 4 componenti vitali della madre avversaria nello stesso round**.

La **madre è l'unica che spara**, utilizzando i suoi armamenti fisici originali; le due navicelle evoluzione (L3 e L5) aggiungono passive e condizioni speciali. Le carte speciali creano la combinazione, non diventano navicelle o munizioni numeriche.

Nessun nuovo mazzo, nessuna barra di protezione universale, nessuna griglia o grafica web. Resta la plancia 3D originale: madre centrale, fino a due scudiere laterali, i quattro vitali reali, cinque slot centrali per lato, 24 speciali nel mazzo, cinque in mano, massimo **due speciali giocabili per round**.

## 2. Regole di danno comprensibili
| Tipologia | Bersagli | Danno per componente | Requisiti | Potere |
|---|---:|---|---|---|
| Attacco normale | 1 | Regola corrente del colpo singolo | Armi della madre funzionanti | Concentrato |
| Combinazione doppia | 2 diversi | +1 livello di danno («una frattura») ciascuno | Ricetta valida, anche senza scudiere se previsto | Pressione su due sistemi |
| Combinazione tripla | 3 diversi | +1 livello ciascuno | Preparazione precedente **e** requisito di madre/scudiera | Controllo diffuso |
| Combinazione quadrupla | 4 diversi | +1 livello ciascuno | Preparazione precedente, L5 con 2 scudiere collegate, ricetta ammessa dalla madre | Assalto raro e rischioso |

- Stato dei vitali confermato: integro (0) → fratturato (1) → distrutto (2). **Due vitali distrutti fanno perdere la madre**.
- Un colpo multiplo applica **al massimo una frattura per componente**: non ripete i colpi sullo stesso vitale e non cumula il bonus critico dei colpi singoli.
- Esempio: quattro vitali integri dopo una quadrupla passano tutti a fratturati, **non** a distrutti. Se due vitali erano già fratturati, una quadrupla può effettivamente distruggerli e vincere: è una combinazione preparata, non un effetto automatico del semplice possesso di carte.
- I componenti già distrutti vengono saltati e non raddoppiano il danno sugli altri. Se la madre non può sparare (Armi distrutte), nessuna combinazione offensiva parte.
- Le passive della nave madre e delle scudiere determinano *quali ricette sono attivabili*: non tutte le madri sbloccano la quadrupla.

## 3. Preparazione: una condizione visibile, non un sesto slot
Una carta già reale come **Scansione Tattica** può attivare un **Aggancio Multiplo**, visibile come un piccolo indicatore sullo slot attacco già esistente.

- Dura fino al prossimo round del giocatore (un solo Aggancio preparato alla volta).
- Nel round successivo si giocano al massimo altre **due** carte, come oggi.
- Se si completa la ricetta, il sistema evidenzia «DOPPIO», «TRIPLO» oppure «QUADRUPLO» e i componenti bersagliati. Il giocatore può confermare o cambiare i componenti disponibili prima di attaccare, senza trascinare quattro carte.
- Se la ricetta non si completa al round successivo, l'Aggancio scade: non si conservano cinque carte in mano in attesa di una vittoria garantita.
- Un componente necessario distrutto o una scudiera distrutta/scollegata **interrompono** la ricetta anche se le carte erano state preparate. Una carta difensiva del rivale può disturbare il colpo nella normale risoluzione simultanea.

## 4. Esempi di ricette basate su ID realmente presenti nel catalogo
**ATTENZIONE:** requisiti ed effetti multipli seguenti sono *nuove regole da implementare*; le carte esistono già ma oggi non lanciano questi attacchi multipli.

| Ricetta proposta | Carte effettive | Madre / componenti richiesti | Bersagli | Effetto |
|---|---|---|---|---|
| **Doppia scarica** | `shot-piercing` (Colpo Perforante) + `shot-ion` (Impulso Ionico) nello stesso round | Qualsiasi madre, Armi operative | 2 | Una frattura su due vitali scelti |
| **Tenaglia solare** | `fusion-strike` (Fusione Assalto) + `shot-corrosion` (Corrosione) | Lince Solare L5, Lama Rubino collegata (Armi e Motori madre) | 2 | Due sistemi e possibile sabotaggio lieve di un attacco successivo |
| **Doppio fulmine** | `shot-ion` + `tactic-suppress` (Soppressione Scorta) | Corvo a Impulsi o Manta Ionica L5, scudiera ionica collegata | 2 | Due fratture distribuite; interferenza sull'effetto passivo della scorta avversaria, **da bilanciare** |
| **Triangolo di precisione** | Round 1: `tactic-scan` (Scansione Tattica). Round 2: `shot-piercing` + `fusion-strike` | Falco Binario o Titano Ossidiana L5, scudiera assedio collegata; Armi e Generatore attivi | 3 | Tre componenti differenti, una frattura ciascuno |
| **Faglia a ventaglio** | Round 1: `tactic-scan`. Round 2: `tactic-vulnerability-rift` (Faglia) + `shot-corrosion` | Madre di controllo/assalto con componenti funzionanti; accesso effettivo alla Faglia nel mazzo | 3 | Tre vitali diversi; la Faglia conserva i propri limiti d'inventario |
| **Costellazione ionica** | Round 1: `tactic-scan`. Round 2: `fusion-triad` (Fusione Trina) + `shot-ion` | Corvo a Impulsi o Manta Ionica L5, **entrambe** le scudiere vive e collegate, Generatore + Centralina operativi | 4 | Un impatto per ciascuno dei quattro vitali |
| **Assedio dell'ossidiana** | Round 1: `tactic-scan`. Round 2: `fusion-triad` + `shot-piercing` | Titano Ossidiana L5; Ala del Giudizio + Lancia dell'Alba collegate; Armi, Generatore e Centralina funzionanti | 4 | Un impatto sui quattro vitali; se i supporti vengono neutralizzati, il livello scende |

I nomi delle *ricette* sono nuove etichette di combattimento, non carte inventate. Nessuna ricetta richiede una terza carta giocata nello stesso round.

## 5. Identità delle 17 madri: proposte di specializzazione
Sono **orientamenti di bilanciamento**, non livelli di potenza già assegnati nel codice.

| Madre ufficiale | Strategia privilegiata | Bersagli multipli |
|---|---|---|
| N00 Aurora-0 | Adattamento e ricambio delle carte | Doppie flessibili |
| C01 Lince Solare | Colpi rapidi ai Motori, poi attacco a tenaglia | Doppie, triple situazionali |
| C02 Vespa di Vetro | Perforazione mirata su Armi e Generatore | Doppie di precisione |
| C03 Corvo a Impulsi | Interferenza, fulmini ramificati | Doppie, quadrupla ionica L5 |
| C04 Dardo Cremisi | Disturbo e assalto opportunistico | Doppie, triple |
| R01 Falco Binario | Assedio preparato su sistemi selezionati | Doppie, triple |
| R02 Manta Ionica | Risonanza con scudiera Sting Ionico | Doppie, quadrupla ionica L5 |
| R03 Iride | Riparazione e concentrazione sulla Centralina | Doppie, difesa prolungata |
| R04 Squalo del Vuoto | Scudiera che assorbe i colpi, assalto della madre | Doppie, protezione |
| E01 Nebulosa | Controllo e soppressione avversaria | Doppie, triple situazionali |
| E02 Tempesta | Ondate distribuite con impulso delle scudiere | Doppie, quadrupla L5 |
| E03 Fenice | Riscatto offensivo su madre danneggiata | Doppie, triple |
| E04 Orizzonte | Colpi perforanti e bersagli scelti | Doppie, triple |
| L01 Eclisse Reale | Corrosione coordinata e attacco su area | Doppie, quadrupla rara |
| L02 Singolarità | Distorsione ionica e fuoco diffuso | Doppie, quadrupla rara |
| L03 Titano Ossidiana | Scudiera corazzata + artiglieria di precisione | Doppie, quadrupla d'assedio L5 |
| L04 Arca Astrale | Riparazione delle scudiere e gioco di attrito | Doppie, difesa e recupero |

Questa matrice impedisce la banalizzazione «ogni nave ha la stessa combo». Sono possibili aggiustamenti dopo la simulazione.

## 6. Contrattacco e scudiere
- Il **baluardo** autentico, come *Scudo del Vuoto* o *Ala del Giudizio*, intercetta la **salva intera**, anche se rivolta a quattro vitali. Finché vive e il collegamento funziona, il danno colpisce la sua resistenza. Il danno eccedente non passa alla madre nello stesso round: questa è una regola già confermata nel combattimento corrente.
- Un supporto **non difensivo** può interrompere la combo altrui con disturbo, congelamento o un sabotaggio **solo se il suo profilo lo prevede**; non tutte le scudiere sono scudiere corazzate.
- La contromossa può consistere nell'interrompere le Armi, il Generatore o la Centralina necessari alla ricetta; una scudiera distrutta fa decadere le ricette che la richiedevano.
- La difesa non deve risultare invincibile: per verificare la frequenza di una quadrupla efficace occorrono test contro tutte le 17 madri e i 12 boss, comprese le carte difesa.
- Le carte Personaggio Boss e Terreno restano categorie distinte e possono in futuro modificare ricette o turni senza diventare una chiave universale obbligatoria per quattro colpi.

## 7. Un esempio reale nella logica proposta (non ancora eseguito nel gioco)
**Lince Solare L5** contro una madre senza baluardo funzionante. La mano contiene Scansione Tattica, Fusione Assalto, Colpo Perforante.

- Round 1: il giocatore gioca *Scansione Tattica*. Compare «Aggancio multiplo pronto» su uno slot attacco della plancia originale. È una sola carta giocata.
- Round 2: la scudiera **Lama Rubino** è integra e collegata. Il giocatore gioca *Fusione Assalto* + *Colpo Perforante* (due carte, non tre) e conferma «Triangolo di precisione».
- La **sola Lince Solare** emette una salva ripartita verso Motori, Armi e Generatore della madre avversaria. Ognuno riceve una frattura al massimo.
- Se fra i round il nemico avesse distrutto i Motori della Lince o la scudiera necessaria, la combo fallirebbe e resterebbe il colpo normale o un fallback meno potente, con avviso chiaro **prima** della conferma.
- Se il rivale avesse un baluardo funzionante, la salva verrebbe assorbita dalla scudiera corazzata invece di danneggiare i tre vitali.

## 8. Ordine corretto di sviluppo successivo
1. Rilevare e visualizzare la ricetta disponibile direttamente dalle carte in mano, *senza creare carte nuove né una nuova UI web*.
2. Definire lo stato di preparazione, la scadenza e i requisiti madre/scudiere; impedire più di due carte spese per round.
3. Estendere la risoluzione del colpo da 1 bersaglio a **un array di 1–4 vitali** con una singola salva della madre, difesa delle scudiere e simultaneità invariata.
4. Integrare le scie delle armi sui **pezzi 3D originali**, mostrando la frattura/distruzione del bersaglio corretto.
5. Test per 17 madri a L1, L3, L5, 12 boss, carte e scudiere, bilanciamento dei casi di vittoria rapida e stallo.
6. Solo dopo, riprendere il redesign artistico delle 82 carte. La grafica della plancia 3D **non va ridisegnata**.

**Decisione richiesta prima di scrivere il motore**: validare questa proposta e la regola di una frattura per bersaglio. Per il momento è un documento di progettazione, non una modifica di gameplay applicata.
