# Eclissi Stellare — catalogo di 100 nuove Carte Arma di Supporto

**Data:** 19 novembre 2026 · **Stato:** BOZZA PER CONTROLLO del progettista, non ancora approvata o giocabile.

**Esclusioni:** quattro armi precedenti — Cannone dei Frammenti e Acceleratore Trifase I, II e III — **non** contano fra queste 100. Anche Scarica Sifone e Scarica Sifone Omega, che sono Carte Attacco, non contano. I prototipi ritirati restano ritirati.

**Distribuzione per ogni elemento:** 3 Comuni, 3 Rare, 2 Epiche, 2 Leggendarie. **Totale:** 30 Comuni, 30 Rare, 20 Epiche, 20 Leggendarie. Ogni arma ha una rarità fissa; non è un'evoluzione di altre carte.

**Regole generali di progettazione:** al massimo due slot Arma temporanea per giocatore; un'arma attiva produce il proprio effetto nell'intervallo indicato, poi si scarta. Gli effetti si sommano alla logica dei colpi normali nel rispetto delle Difese, dei supporti protettivi, della sincronizzazione, dei limiti agli HP e degli elementi. Senza nuove immagini o prezzi e senza attivazione nel motore finché l'utente non le approva.

**Durata:** proposta in *turni propri*, da confermare. Potenza, quantità di danno, percentuali, prezzi e acquisizione sono da bilanciare prima dell'inserimento nel gameplay.

## 🔥 Fuoco — 10 armi

| ID | Nome | Rarità | Turni propri | Effetto proposto | Aspetto meccanico |
|---|---|---|---:|---|---|
| `weapon100-plasma-01` | **Erogatore di Braci** | Comune | 1 | Il prossimo colpo normale applica una bruciatura breve al bersaglio effettivamente colpito; la bruciatura non si cumula con se stessa. | Ugello corto corazzato e serbatoio di scintille incandescenti. |
| `weapon100-plasma-02` | **Cannone Bifiamma** | Comune | 1 | Il prossimo attacco normale viene ripartito in due impulsi più piccoli sullo stesso bersaglio; ciascun impulso verifica le difese. | Due canne parallele, valvole a forcella e collettore termico. |
| `weapon100-plasma-03` | **Ugello Termico** | Comune | 1 | Un colpo riuscito indebolisce temporaneamente la resistenza del bersaglio ai successivi danni da Fuoco. | Lancia a bocca stretta con tre dissipatori di rame. |
| `weapon100-plasma-04` | **Mortaio Magmatico** | Rara | 3 | Mortaio di Fuoco in uno slot Arma per tre turni propri: spara un colpo base nel turno di posa e in ciascuno dei due successivi. Consuma automaticamente tutte le cariche Energia compatibili già presenti nell'accumulatore della madre, sparando un colpo aggiuntivo autonomo per ognuna; anche le Energie giocate dopo l'installazione, mentre l'Arma resta attiva, vengono convogliate subito al Mortaio per ulteriori colpi e non restano disponibili per la Speciale della madre. Unico accumulatore fino a quattro cariche, nessuno slot Energia aggiuntivo. Danni per colpo ancora da bilanciare; ordine e limiti di scarica nel turno da verificare in codice. | Mortaio pesante di Fuoco ad alimentazione energetica, tubo basculante e camera incandescente collegata al reattore della madre. |
| `weapon100-plasma-05` | **Turbina di Plasma** | Rara | 2 | Il bonus offensivo cresce quando l'arma contribuisce a due attacchi normali consecutivi; la catena si interrompe se il colpo non parte. | Rotore a pale luminose, camera anulare e scarico circolare. |
| `weapon100-plasma-06` | **Trivella Solare** | Rara | 1 | Il prossimo colpo normale riduce l'effetto di una protezione visibile, senza ignorare le altre difese del bersaglio. | Testa elicoidale incandescente e stelo telescopico. |
| `weapon100-plasma-07` | **Batteria Meteoritica** | Epica | 1 | Durante un attacco normale valido rilascia colpi supplementari leggeri verso le navicelle di supporto avversarie ancora operative; non aggira la copertura della madre. | Rastrelliera di micro-meteoriti con sei tubi di lancio. |
| `weapon100-plasma-08` | **Reattore di Cenere** | Epica | 2 | Accumula una quota dei danni che la tua flotta subisce mentre è attivo e la aggiunge, con limite da bilanciare, al successivo attacco normale. | Cilindro a camere di cenere e turbocompressore cremisi. |
| `weapon100-plasma-09` | **Lancia della Corona Solare** | Leggendaria | 2 | Richiede un turno di carica senza scarica propria; se sopravvive, concentra l'energia in un unico colpo normale potenziato, poi si consuma. | Lunga lancia fotonica con corona di anelli solari. |
| `weapon100-plasma-10` | **Obice Supernova** | Leggendaria | 1 | Al primo attacco valido produce un'esplosione che ripartisce danni addizionali fra i supporti nemici presenti; se non ve ne sono, rinforza il colpo normale alla madre. | Obice sferico con portelli radiali e nucleo stellare. |

## 💧 Acqua — 10 armi

| ID | Nome | Rarità | Turni propri | Effetto proposto | Aspetto meccanico |
|---|---|---|---:|---|---|
| `weapon100-refrigerant-01` | **Idrogetto Orbitale** | Comune | 1 | Il prossimo colpo normale marca il bersaglio con una pellicola d'acqua: un successivo effetto Fulmine può sfruttarla una sola volta. | Turbopompa affusolata con tubo trasparente e ugello orientabile. |
| `weapon100-refrigerant-02` | **Cannone a Marea** | Comune | 1 | Il bonus del prossimo colpo normale aumenta se il supporto bersagliato ha più della metà dei propri HP attuali rispetto al massimo. | Canna larga con pistoni idraulici e serbatoio ondulato. |
| `weapon100-refrigerant-03` | **Eiettore di Vapore** | Comune | 1 | Un colpo riuscito produce una nube che attenua il prossimo bonus offensivo dell'arma avversaria nel turno seguente. | Bocca di vapore divisa e condensatori verticali. |
| `weapon100-refrigerant-04` | **Pompa di Risacca** | Rara | 1 | Parte del danno reale inflitto dal prossimo attacco normale ripara il tuo supporto operativo più danneggiato, senza superare gli HP massimi. | Girante a spirale, tubi flessibili e valvole di ritorno. |
| `weapon100-refrigerant-05` | **Lancia di Pressione** | Rara | 1 | Il prossimo attacco concentrato riduce una parte della mitigazione percentuale del bersaglio, ma resta soggetto a coperture, scudi e limiti HP. | Cannone ad acqua compressa con quattro camere in serie. |
| `weapon100-refrigerant-06` | **Turbina Abissale** | Rara | 2 | Contribuisce agli attacchi normali per due tuoi turni e potenzia il secondo se nel primo hai danneggiato davvero un supporto. | Turbina a palette scure e camere d'acqua profonda. |
| `weapon100-refrigerant-07` | **Batteria del Diluvio** | Epica | 1 | Suddivide una salva aggiuntiva tra fino a due supporti nemici distinti; ciascun impatto può essere difeso separatamente. | Due lanciatori a ventaglio collegati a una cisterna centrale. |
| `weapon100-refrigerant-08` | **Reattore delle Correnti** | Epica | 2 | Trattiene una parte del danno nominale annullato da una difesa e la recupera come bonus limitato al tuo prossimo attacco normale. | Doppio anello di ricircolo attorno a un generatore azzurro. |
| `weapon100-refrigerant-09` | **Cannone del Maelstrom** | Leggendaria | 1 | Il colpo normale crea un vortice che può trasferire una parte del danno reale dal primo supporto a un secondo supporto vivo; non crea un attacco diretto alla madre. | Torretta a tre anelli idrodinamici concentrici. |
| `weapon100-refrigerant-10` | **Monolite Oceanico** | Leggendaria | 2 | Durante due tuoi turni riduce gradualmente il bonus delle difese energetiche nemiche soltanto dopo colpi normali riusciti; termina dopo la seconda attivazione. | Massiccia colonna blu con diaframmi mobili e reattore pressurizzato. |

## ❄️ Ghiaccio — 10 armi

| ID | Nome | Rarità | Turni propri | Effetto proposto | Aspetto meccanico |
|---|---|---|---:|---|---|
| `weapon100-cryogenic-01` | **Spruzzatore di Brina** | Comune | 1 | Il prossimo colpo normale rallenta temporaneamente la ricarica di una macchina Arma avversaria operativa. | Ugello a ventaglio con serbatoio criogenico rivestito. |
| `weapon100-cryogenic-02` | **Puntale Criogenico** | Comune | 1 | Il prossimo attacco normale riceve un bonus contro un supporto già danneggiato, senza cambiare bersaglio automaticamente. | Ago di ghiaccio metallico e stabilizzatori laterali. |
| `weapon100-cryogenic-03` | **Laminatore Polare** | Comune | 1 | Dopo un impatto valido applica un velo gelato che diminuisce il primo bonus Arma dell'avversario nel turno successivo. | Tre rulli refrigerati e una bocca rettangolare. |
| `weapon100-cryogenic-04` | **Artiglieria delle Schegge Erranti** | Rara | 2 | Proposta sostitutiva Ghiaccio, ancora da rivedere: un proiettile criogenico proprio contro una navicella bersagliabile nel turno di posa; nel turno proprio successivo spara un secondo proiettile, preferibilmente verso una navicella DIFFERENTE se disponibile, senza cambiare difese o infliggere danni gratuiti. Danni da definire. | Torretta polare a due bracci rotanti con cristalli di ghiaccio in orbita, una bocca diversa si accende a ogni turno. |
| `weapon100-cryogenic-05` | **Frusta Glaciale** | Rara | 1 | Se il prossimo attacco normale colpisce un supporto, ne sospende per breve tempo la prima abilità attivabile nel turno seguente. | Braccio articolato con un conduttore criogenico flessibile. |
| `weapon100-cryogenic-06` | **Piastra Subzero** | Rara | 2 | Se nel turno di schieramento non viene sparato un attacco normale, conserva la pressione criogenica e potenzia il successivo; altrimenti concede solo il bonus base. | Piastra a lamelle fredde e camere di stoccaggio sotterranee. |
| `weapon100-cryogenic-07` | **Lancia di Permafrost** | Epica | 1 | Un colpo riuscito blocca temporaneamente la rigenerazione del supporto colpito, senza alterarne gli HP massimi. | Tridente di ghiaccio permanente con quattro tubi di raffreddamento. |
| `weapon100-cryogenic-08` | **Camera Zero Assoluto** | Epica | 2 | Dopo il primo impatto riuscito riduce la potenza di una delle Armi temporanee avversarie per il suo prossimo turno, senza eliminarne la carta. | Camera cubica con cristalli sospesi in vuoto termico. |
| `weapon100-cryogenic-09` | **Obice del Silenzio Boreale** | Leggendaria | 1 | Aggiunge al prossimo attacco normale un effetto che sospende una fonte di danno nel tempo attiva sul bersaglio, se presente, e produce danno di Ghiaccio. | Obice lungo con anelli di brina e specchi opachi. |
| `weapon100-cryogenic-10` | **Cannone del Crepaccio** | Leggendaria | 2 | La scarica finale aumenta contro i supporti con HP attuali bassi, ma non può ignorare una difesa e non genera eliminazioni automatiche. | Cannone a canna fenduta, cristalli ramificati e base glaciale. |

## ⚡ Fulmine — 10 armi

| ID | Nome | Rarità | Turni propri | Effetto proposto | Aspetto meccanico |
|---|---|---|---:|---|---|
| `weapon100-ionic-01` | **Saetta di Rame** | Comune | 1 | Il prossimo colpo normale produce un piccolo arco secondario verso un altro supporto nemico operativo, se presente. | Elettrodo di rame e forcella con due punte conduttrici. |
| `weapon100-ionic-02` | **Bobina Sincrona** | Comune | 1 | Aumenta il contributo al prossimo attacco normale se nello stesso turno è stata caricata almeno una tua Carta Energia Fulmine. | Bobina di Tesla compatta con anelli sfalsati. |
| `weapon100-ionic-03` | **Impulsore a Scatti** | Comune | 2 | Distribuisce il proprio potenziamento in due impulsi, uno per ciascuno dei prossimi due tuoi attacchi normali validi. | Doppio condensatore e contatti che scattano alternativamente. |
| `weapon100-ionic-04` | **Lancetta Tempestosa** | Rara | 2 | Premia due attacchi normali consecutivi su un bersaglio dello stesso tipo: il secondo riceve un bonus, purché l'arma rimanga installata. | Sottile asta appuntita su un pendolo elettrico. |
| `weapon100-ionic-05` | **Tridente Voltaico** | Rara | 1 | Consente al prossimo attacco normale di dividere una parte della potenza fra due supporti distinti, verificando le difese di ciascuno. | Tre lunghe punte unite da un nodo a scarica. |
| `weapon100-ionic-06` | **Induttore a Catena** | Rara | 2 | Ogni Energia Fulmine spesa per una tua abilità mentre l'arma è attiva alimenta una carica che migliora il successivo attacco normale, con tetto da definire. | Catena di trasformatori elettrici con contatti luminosi. |
| `weapon100-ionic-07` | **Fulminatore di Nodo** | Epica | 1 | Un colpo normale su un supporto può sospendere la sua prossima attivazione di passiva, senza impedirgli di difendere fisicamente. | Canna corta con arpioni elettrici e morsetti. |
| `weapon100-ionic-08` | **Centrale delle Saette** | Epica | 2 | Accumula un impulso in ciascuno dei primi due turni con attacco normale; al secondo rilascia una scarica supplementare, poi si scarta. | Torre a più bobine con due sfere di accumulo. |
| `weapon100-ionic-09` | **Martello di Giove** | Leggendaria | 2 | Necessita di un turno di preparazione; nel successivo aggiunge un forte colpo normale singolo, senza aggirare le difese, poi si disintegra. | Maglio elettromagnetico con testa a quattro piastre. |
| `weapon100-ionic-10` | **Colonna di Tesla Astrale** | Leggendaria | 1 | Il prossimo attacco normale genera un arco che passa al secondo supporto avversario, se operativo, con potenza decrescente e una verifica di difesa per bersaglio. | Alta colonna ramificata con corona elettrica e punte mobili. |

## 🪨 Terra — 10 armi

| ID | Nome | Rarità | Turni propri | Effetto proposto | Aspetto meccanico |
|---|---|---|---:|---|---|
| `weapon100-mineral-01` | **Sparachiodi di Basalto** | Comune | 1 | Il prossimo attacco normale infligge un bonus moderato alle protezioni fisiche dei supporti nemici colpiti. | Cannone corto con caricatore di punte basaltiche. |
| `weapon100-mineral-02` | **Lanciaghiaia Cosmico** | Comune | 1 | Il prossimo attacco normale rilascia un gruppo di piccoli impatti sullo stesso supporto; eventuali difese possono intercettarli uno alla volta. | Tre bocche laterali e tamburo di frammenti di roccia. |
| `weapon100-mineral-03` | **Pressa Tellurica** | Comune | 1 | Un colpo riuscito diminuisce temporaneamente la capacità difensiva del supporto bersagliato, senza disattivarne le abilità. | Pressa a due mascelle con pistoni industriali. |
| `weapon100-mineral-04` | **Mortaio dei Crateri** | Rara | 2 | Piazza una carica nel primo turno e la detona con il normale attacco del turno successivo se l'arma è ancora schierata. | Tubo di lancio massiccio incastonato in un anello di pietra. |
| `weapon100-mineral-05` | **Trivella Sismica** | Rara | 2 | Un colpo su supporto può lasciare una frattura che amplifica il prossimo danno da Terra ricevuto dallo stesso supporto. | Punta diamantata a segmenti e motore perforante. |
| `weapon100-mineral-06` | **Catapulta di Obsidiana** | Rara | 1 | Aggiunge un proiettile pesante al normale attacco se il bersaglio ha ancora una protezione visibile; non la salta automaticamente. | Braccio a contrappeso metallico con masso nero sospeso. |
| `weapon100-mineral-07` | **Batteria delle Faglie** | Epica | 1 | Distribuisce brevi scosse addizionali fra i supporti nemici vivi che hanno già subito danni in questo turno. | Piastre di roccia sospese, pistoni e magneti sismici. |
| `weapon100-mineral-08` | **Nucleo Geotermico** | Epica | 2 | Per due turni accumula una parte dei colpi normali realmente inflitti e converte la carica in un bonus limitato al secondo attacco. | Camera magmatica racchiusa in una gabbia di basalto. |
| `weapon100-mineral-09` | **Martello Continentale** | Leggendaria | 2 | Dopo un turno di preparazione produce un solo colpo normale molto pesante contro un supporto selezionato, rispettando tutte le difese. | Enorme testa a blocchi di pietra e aste di spinta. |
| `weapon100-mineral-10` | **Cannone della Frattura Planetaria** | Leggendaria | 1 | Il prossimo colpo normale crea un'onda sismica che indebolisce la resistenza degli altri supporti nemici operativi, senza colpirli direttamente. | Cannone a piastre concentriche e base a quattro pilastri. |

## 🌪️ Vento — 10 armi

| ID | Nome | Rarità | Turni propri | Effetto proposto | Aspetto meccanico |
|---|---|---|---:|---|---|
| `weapon100-aerial-01` | **Ventola d'Assalto** | Comune | 1 | Il prossimo attacco normale ottiene un bonus se l'arma avversaria ha appena inflitto danni nel turno precedente. | Ventola corazzata a cinque pale con ugello frontale. |
| `weapon100-aerial-02` | **Ago Anemico** | Comune | 1 | Il prossimo colpo su un supporto rapido riduce temporaneamente un suo bonus di schivata, senza annullare altre difese. | Ago aerodinamico e anelli di stabilizzazione. |
| `weapon100-aerial-03` | **Soffiatore Orbitale** | Comune | 1 | Un colpo normale riuscito disperde una parte dei bonus temporanei di precisione del bersaglio. | Turbocompressore a due prese e diffusore laterale. |
| `weapon100-aerial-04` | **Lancia di Monsoni** | Rara | 1 | Lancia un impulso normalmente leggero che diventa più incisivo se il bersaglio ha cambiato stato o elemento durante il turno. | Canna sottile ricurva e scudi aerodinamici. |
| `weapon100-aerial-05` | **Turbina Ciclonica** | Rara | 2 | Produce un bonus sul normale attacco che cresce se i due turni consecutivi hanno bersagli diversi. | Rotore con palette concentriche e scarico a spirale. |
| `weapon100-aerial-06` | **Cannoniera di Corrente** | Rara | 1 | Se il primo bersaglio supporto viene distrutto dal tiro normale, un colpo leggero residuo passa a un altro supporto operativo. | Due canne sospese su giunti a flusso d'aria. |
| `weapon100-aerial-07` | **Batteria dei Vortici** | Epica | 1 | Consente a un attacco normale valido di suddividere un effetto di vento fra due supporti nemici operativi, senza attaccare direttamente la madre protetta. | Ventagli gemelli di turbine con camere a bassa pressione. |
| `weapon100-aerial-08` | **Iniettore del Jetstream** | Epica | 2 | Il successivo colpo normale aumenta se hai subito un effetto di rallentamento o congelamento, consumando quel vantaggio una volta. | Compressore allungato con tre iniettori ad alta velocità. |
| `weapon100-aerial-09` | **Falce dell'Uragano** | Leggendaria | 1 | Il prossimo attacco normale produce un vortice che colpisce un supporto e può spostare una protezione non vincolata verso un altro bersaglio valido. | Grande lama anulare con pale a falce e motore centrale. |
| `weapon100-aerial-10` | **Cannone del Grande Ciclone** | Leggendaria | 2 | Rimane in campo per due turni: al secondo attacco normale concentra l'energia accumulata in una raffica su più supporti, senza bypass della madre. | Torretta di tre anelli e colonna di vento contenuto. |

## ☀️ Luce — 10 armi

| ID | Nome | Rarità | Turni propri | Effetto proposto | Aspetto meccanico |
|---|---|---|---:|---|---|
| `weapon100-radiant-01` | **Proiettore di Fotoni** | Comune | 1 | Il prossimo attacco normale riceve una potenza aggiuntiva contro bersagli non nascosti o occultati. | Piccola lente esagonale con diaframma luminoso. |
| `weapon100-radiant-02` | **Raggio di Prisma** | Comune | 1 | Il prossimo colpo normale conserva una quota della potenza quando una protezione lo attenua, senza annullare il blocco della difesa. | Prisma triangolare montato su una canna corta. |
| `weapon100-radiant-03` | **Faro Balistico** | Comune | 2 | Il primo colpo riuscito marca il bersaglio; il successivo attacco normale contro lo stesso bersaglio ottiene un bonus limitato. | Faro cilindrico con sensori solari e cannocchiale di mira. |
| `weapon100-radiant-04` | **Lanciatore d'Aurora** | Rara | 1 | Durante il prossimo attacco normale conferisce un potenziamento contro supporti che possiedono effetti di oscuramento attivi. | Binario luminoso arcuato e pannelli radianti. |
| `weapon100-radiant-05` | **Specchio Concentrico** | Rara | 2 | Riflette una piccola parte di un bonus offensivo temporaneo avversario in carica per il tuo prossimo tiro normale, senza rubare carte. | Tre specchi su anelli indipendenti attorno a un nucleo. |
| `weapon100-radiant-06` | **Arco di Helios** | Rara | 1 | Il successivo attacco normale aumenta se la nave madre ha ricevuto riparazioni nel tuo turno, senza consumare HP alleati. | Arco fotonico con lamelle solari orientabili. |
| `weapon100-radiant-07` | **Corona Rifrangente** | Epica | 1 | Trasforma il prossimo attacco valido in due raggi verso supporti differenti, solo se entrambi sono bersagliabili e con controlli difensivi separati. | Corona a dodici specchi e doppio emettitore radiale. |
| `weapon100-radiant-08` | **Reattore dell'Alba** | Epica | 2 | Accumula luce durante due tuoi turni; al secondo attacco normale concede un bonus maggiore se il primo ha colpito davvero. | Reattore solare con petali ottici che si aprono. |
| `weapon100-radiant-09` | **Lancia dell'Equinozio** | Leggendaria | 1 | Il primo colpo normale valido può neutralizzare temporaneamente un singolo indebolimento offensivo applicato al tuo lato, oltre al suo danno. | Lunga lancia bianca con due aloni equidistanti. |
| `weapon100-radiant-10` | **Cannone del Solstizio** | Leggendaria | 2 | Al successivo attacco normale converte una parte della potenza accumulata in una salva luminosa distribuita sui supporti nemici vivi, senza superare i limiti materni. | Gigantesco cannone a prisma e ghiera solare mobile. |

## 🌑 Ombra — 10 armi

| ID | Nome | Rarità | Turni propri | Effetto proposto | Aspetto meccanico |
|---|---|---|---:|---|---|
| `weapon100-void-01` | **Ago dell'Eclisse** | Comune | 1 | Il prossimo colpo normale ottiene un piccolo bonus contro un supporto che è stato bersagliato nel turno precedente. | Ago nero estraibile da un manicotto opaco. |
| `weapon100-void-02` | **Silenziatore del Vuoto** | Comune | 1 | Un impatto normale valido riduce per un turno la potenza della prima Arma temporanea nemica in uso. | Canna oscurata con camera d'assorbimento e pannelli neri. |
| `weapon100-void-03` | **Proiettore di Nebbia Nera** | Comune | 1 | Il prossimo attacco normale applica una nube che impedisce un bonus di precisione sulla nave colpita nel turno successivo. | Proiettore corto con due ventole di fumo scuro. |
| `weapon100-void-04` | **Trivella d'Ombra** | Rara | 2 | Un colpo riuscito su un supporto rende più efficace il prossimo attacco Ombra contro quello stesso supporto, senza aggirare protezioni. | Spirale di lame nere e condensatore opaco. |
| `weapon100-void-05` | **Batteria dei Fantasmi** | Rara | 1 | Il prossimo attacco normale crea un secondo proiettile leggero che può dirigersi verso un altro supporto operativo non occultato. | Due canne sottili semitrasparenti e camera a doppia immagine. |
| `weapon100-void-06` | **Morsa Crepuscolare** | Rara | 1 | Quando il colpo normale danneggia davvero un supporto, ne riduce temporaneamente una sola passiva offensiva nel turno seguente. | Due ganasce scure e un anello di contenimento. |
| `weapon100-void-07` | **Fenditura delle Lame** | Epica | 1 | Con una salva normale valida produce un attacco secondario leggero contro un supporto già ferito, scegliendolo automaticamente tra quelli bersagliabili. | Anello piatto con tre lame che emergono dal bordo. |
| `weapon100-void-08` | **Cisterna dell'Oblio** | Epica | 2 | Conserva parte dei bonus offensivi temporanei avversari dispersi durante la sua durata e li trasforma in un bonus limitato al tuo prossimo colpo. | Serbatoio a spirale di materia scura con valvole magnetiche. |
| `weapon100-void-09` | **Obice della Notte Eterna** | Leggendaria | 2 | Richiede una fase di carica e rilascia sul successivo normale attacco un colpo pesante con breve riduzione della rigenerazione del supporto colpito. | Cannone massiccio nero con camera a eclisse totale. |
| `weapon100-void-10` | **Cannone del Nulla Risonante** | Leggendaria | 1 | Un attacco normale riuscito su supporto produce un'eco limitata sul secondo supporto operativo; non può scavalcare la copertura verso la madre. | Canna a vuoto con due anelli oscillanti e nucleo invisibile. |

## ⚙️ Metallo — 10 armi

| ID | Nome | Rarità | Turni propri | Effetto proposto | Aspetto meccanico |
|---|---|---|---:|---|---|
| `weapon100-metallic-01` | **Chiodatrice Magnetica** | Comune | 1 | Il prossimo attacco normale colpisce con una testata che riceve un bonus contro protezioni di tipo fisico. | Canna a sei bobine con caricatore di chiodi metallici. |
| `weapon100-metallic-02` | **Cannoncino a Cuscinetti** | Comune | 1 | Al prossimo attacco normale lancia più pallini leggeri contro un solo supporto; le difese intercettano i singoli impatti. | Cannoncino rotante con magazzino sferico a sfere d'acciaio. |
| `weapon100-metallic-03` | **Estrattore di Schegge** | Comune | 1 | Quando il normale attacco colpisce un supporto, rimuove un piccolo bonus di armatura temporaneo, se presente. | Tre pinze magnetiche intorno a una canna corta. |
| `weapon100-metallic-04` | **Trivella Ferritica** | Rara | 2 | Contribuisce ai colpi normali per due tuoi turni e aumenta il secondo bonus se il primo ha consumato una protezione. | Trivella d'acciaio con rotori magnetici e una punta dentata. |
| `weapon100-metallic-05` | **Balestra a Binari** | Rara | 2 | Carica un proiettile per il prossimo turno e lo aggiunge al tiro normale contro un supporto bersagliabile. | Due rotaie elettromagnetiche e un carrello scorrevole. |
| `weapon100-metallic-06` | **Martello d'Acciaio** | Rara | 1 | Il prossimo colpo normale danneggia più efficacemente un supporto con armatura o difesa temporanea ancora attiva. | Maglio metallico su pistone a tre stadi. |
| `weapon100-metallic-07` | **Batteria di Lame Rotanti** | Epica | 1 | Al normale attacco valido aggiunge una raffica ravvicinata sul medesimo supporto, con danni ripartiti in impulsi separati. | Tamburo di lame circolari protette da gabbia metallica. |
| `weapon100-metallic-08` | **Fucina Magnetar** | Epica | 2 | Una carica si accumula quando una Difesa avversaria intercetta il tuo colpo normale; la carica aumenta il successivo attacco, con tetto da bilanciare. | Anello di forgia al plasma circondato da calamite stellari. |
| `weapon100-metallic-09` | **Cannone a Massa Critica** | Leggendaria | 2 | Richiede preparazione; al turno successivo concentra in un unico tiro normale potenziato le riserve magnetiche, poi si scarta. | Railgun lungo con grandi moduli di accelerazione. |
| `weapon100-metallic-10` | **Colosso delle Leghe** | Leggendaria | 2 | Per due tuoi turni aggiunge potenza ai colpi normali e, dopo un impatto reale, riduce temporaneamente una protezione metallica del bersaglio. | Torretta pesante con placche mobili e quattro canne integrate. |

## 🪐 Gravità — 10 armi

| ID | Nome | Rarità | Turni propri | Effetto proposto | Aspetto meccanico |
|---|---|---|---:|---|---|
| `weapon100-gravity-01` | **Impulsore di Massa** | Comune | 1 | Il prossimo colpo normale ottiene un bonus contro supporti con HP massimi elevati, senza infliggere danni proporzionali automatici. | Emettitore sferico con due masse sospese. |
| `weapon100-gravity-02` | **Lanciapesi Orbitale** | Comune | 1 | Il prossimo attacco normale aggiunge un singolo proiettile pesante che segue il bersaglio selezionato. | Braccio di lancio ad anelli con blocco metallico orbitante. |
| `weapon100-gravity-03` | **Compressore Gravitico** | Comune | 1 | Un colpo riuscito riduce temporaneamente un bonus di schivata o mobilità del supporto colpito. | Due piastre parallele attorno a un nucleo nero. |
| `weapon100-gravity-04` | **Mortaio delle Orbite** | Rara | 2 | Prepara una massa in rotazione nel primo turno; nel secondo aggiunge un impatto al normale attacco se l'arma non è stata rimossa. | Mortaio con tre sfere in orbita intorno alla camera. |
| `weapon100-gravity-05` | **Trattore d'Assalto** | Rara | 1 | Il prossimo normale attacco può trasferire una parte del danno verso un secondo supporto operativo, senza scavalcare la copertura della madre. | Due bracci ad artiglio e campo gravitazionale anulare. |
| `weapon100-gravity-06` | **Vortice di Compressione** | Rara | 2 | Il bonus del normale attacco cresce quando il bersaglio è già stato rallentato o immobilizzato da un effetto temporaneo. | Ugello ad anello con vortice di detriti interno. |
| `weapon100-gravity-07` | **Batteria delle Maree Nere** | Epica | 1 | Distribuisce piccoli impatti gravitazionali tra tutti i supporti nemici ancora operativi; la madre resta un bersaglio separato. | Fila di generatori a pozzo gravitazionale sopra una rastrelliera. |
| `weapon100-gravity-08` | **Reattore di Orbita Spezzata** | Epica | 2 | Assorbe una parte delle spinte nemiche che hanno modificato un bersaglio e le trasforma in un bonus limitato al prossimo colpo normale. | Nucleo spezzato in tre anelli eccentrici. |
| `weapon100-gravity-09` | **Cannone dell'Orizzonte** | Leggendaria | 2 | Dopo una fase di carica concentra un unico colpo gravitazionale molto forte sul bersaglio normale valido, rispettando difese e limite HP. | Cannone a pozzo centrale circondato da un orizzonte luminoso. |
| `weapon100-gravity-10` | **Singolarità da Assedio** | Leggendaria | 2 | Durante il secondo turno attivo genera una scarica che danneggia il supporto bersagliato e comprime parte della potenza residua verso un altro supporto vivo; non elimina o risucchia carte come Buco Nero. | Massiccio acceleratore con quattro anelli e mini-singolarità centrale. |

## Come revisionare

Controllare nell'ordine: 1) tipologia e nome, 2) elemento, 3) rarità, 4) meccanica e possibili sovrapposizioni, 5) durata, 6) aspetto fisico. Solo dopo le modifiche confermate si definiscono numeri bilanciati, implementazione, immagini e animazioni.

**Nota:** questa bozza non modifica le 120 esclusive delle navicelle, le carte Arma già confermate, il mazzo ufficiale o lo Shop.

## Revisione Mortaio ed Energia — 19 novembre 2026

Il **Mortaio Magmatico, Fuoco/Rara** ha sostituito la propria vecchia meccanica con un **colpo base a ogni turno proprio per 3 turni** e **un colpo aggiuntivo per ogni Carta Energia sottratta automaticamente all'accumulatore della madre**, già presente o giocata dopo l'installazione. L'Energia sottratta non può alimentare la Speciale della nave madre. L'**unico accumulatore** ha **4 cariche massime**, senza quattro caselle separate; nel codice attuale l'interfaccia ne mostra il contatore, non una pila visiva di carte. Il Mortaio è una proposta progettuale e non è ancora nel motore.

**Al posto del Mortaio di Grandine nell'elemento Ghiaccio** è stata inserita come semplice candidata l'**Artiglieria delle Schegge Erranti** (Rara): da rivedere una per volta. Restano esattamente 10 progetti Fuoco e 10 Ghiaccio, 100 totali. Tutti i danni, le condizioni numeriche e le limitazioni sono da bilanciare.

[Specifica Mortaio ed Energia](./MORTAIO_MAGMATICO_ALIMENTAZIONE_ENERGIA_2026-11-19.md).
