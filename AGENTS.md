# AGENT INSTRUCTIONS — ECLISSI STELLARE / test7

## Regola permanente — impatti sulle navi e prossime carte, 25/11

L'utente approva salve e partenze variabili e chiede **esplosioni o altri
effetti evidenti quando le navi vengono colpite, non solo un leggero
scossone**. Queste decisioni devono guidare anche TUTTE le prossime carte.
Leggere `docs/REGOLE_PERMANENTI_EFFETTI_CARTE.md`: consolida meccanica reale,
inventiva del dispositivo, origini A/B variabili, salve, prospettiva 3D,
impatto personalizzato sullo scafo, suono, aptica e collaudo.

Ogni Arma deve progettare insieme lancio/volo e contatto. Al colpo reale
mostrare corpo dell'impatto, frammenti/scintille, eventuali plasma/fumo o
scariche e reazione dello scafo; le rarità evolvono la sequenza. Il contatto
segue il punto sulla vera nave anche durante il rinculo e non copre tutta
la flotta. Ganasce: morso e archi; Induzione: taglio e scarica; perforanti:
getto assiale; Maglio/Recuperatore/Schegge: detonazioni differenti. Non
copiare la stessa palla di fuoco su ogni carta. Il Collassatore mantiene
l'unico BOOM fra i due scafi, senza duplicarlo per le due contabilizzazioni HP.

`src/weaponHullImpacts.js` definisce i contatti attuali e la posa condivisa
da scafo e renderer. Nessun danno, colpo, bruciatura, distruzione o bersaglio
può essere inventato dalla grafica. Una Difesa bloccante mostra il contatto
sullo scudo; una quota zero di una salva reale fa solo un piccolo contatto
sulla corazza. Nessuna esplosione di danno su colpi bloccati/non alimentati.
Movimento ridotto, preferenze audio/aptiche e ripristino restano obbligatori.
I collaudi delle versioni precedenti non attestano automaticamente questa.

## Ultima decisione utente — raffiche e punti di lancio variabili, 25/11

L'utente ha rifiutato anche la seconda revisione: cambiava il disegno ma
restava la stessa azione. SOSTITUISCE il vincolo precedente del centro USB
fisso e del singolo proiettile per tutte le rarità. Usare lanci diversi
entro il lato A/B, salve vere 3/6/9, traiettorie curve/incrociate, rotazioni,
esplosioni coerenti e finali diversi. Il catalogo vincolante è ora
`src/fleetNext/approvedWeaponSalvos.js`; dettagli e matrice in
`docs/RAFFICHE_ORIGINI_VARIABILI_2026-11-25.md`.

Il danno totale resta quello della carta ed è distribuito esattamente nei
pacchetti `projectileHits` emessi dal motore. Una salva verifica Difesa e
copertura come un'azione per bersaglio; non moltiplicare danni, costi Energia
o reazioni per il numero di proiettili. Ganasce: due agganci reali e porte
persistenti; Collassatore: un solo scontro fra due scafi. La Cascata aspetta
l'ultimo impatto della salva precedente e paga una volta per trasferimento.

La plancia usa `fleetWeaponProjectiles`, non i colpi aggregati di diagnosi
`fleetWeaponShots`. I contatori della carta si compongono con il PNG HD
approvato e `WeaponSalvoCardMarks`: sfondi estratti dalle cornici originali,
testo vettoriale `TOTAL DAMAGE` / `N SHOTS` o `6 + 1`, stessi simboli e arte.
Nel salvare/esportare un fronte completo includere entrambi gli strati.
Le descrizioni e i manifest precedenti sono storici quando indicano uno
sparo fisso; leggere sempre la definizione corrente del codice.

Eseguire anche `weaponRendererBindings.test.js`: i test del combattimento
da soli non eseguono gli effetti React. È stato corretto un import mancante
che poteva fermare il canvas della revisione precedente. Non dichiarare
collaudata in partita una dimostrazione offline o una sola build riuscita.

## Revisione generale degli effetti — 25 novembre 2026

L'utente ha fermato le nuove carte per rivedere tutti i 22 effetti già
approvati: li considera troppo simili e piatti. Ogni famiglia deve avere
dinamica, volume, contatto, reazione degli scafi e suono riconoscibili;
le rarità devono cambiare struttura e sequenza, oltre al colore. Non
sostituire questa revisione con altri bagliori o una medesima esplosione.
Vedi `docs/REVISIONE_EFFETTI_22_ARMI_2026-11-25.md`.

La revisione è implementata e verificata nel codice; il nuovo collaudo
StackBlitz è ancora da eseguire a causa dell'errore di clonazione della
sessione. Lo studio offline dei renderer NON è una registrazione in
battaglia. Non riutilizzare i precedenti collaudi per dichiarare verificata
questa nuova versione. Conservare Maglio 0,48 / 1400 / 950 ms, Collassatore
450 / 1000 / 1350 ms, prospettiva, eventi, bersagli e danni reali.

## Regola dei colpi approvata il 24 novembre 2026

### Regola obbligatoria del 25/11 — meccanica reale, immagini, suoni e vibrazione

PRIMA di progettare l'effetto di QUALSIASI carta, leggere nel codice la
definizione aggiornata, la risoluzione effettiva del motore e gli eventi
emessi. Verificare condizioni, bersagli, quantità di colpi, durata, ordine,
combo, blocchi e scadenze; il nome della carta e i ricordi della chat non
bastano. Studiare quindi come rendere leggibile l'intera meccanica con una
sequenza personalizzata di **effetti visivi, suoni e vibrazione**. La
rarità evolve la sequenza coerentemente con l'illustrazione e con le regole.
La vibrazione segue le fasi reali (aggancio, tensione, urto, ecc.), rispetta
le preferenze del giocatore e va verificata su un dispositivo compatibile:
un browser senza riscontro aptico non costituisce un collaudo della vibrazione.

Esempio vincolante: **Arpioni a Ganasce Magnetiche → Cannone Collassatore
di Lega** sono due carte. La prima aggancia i due bersagli effettivamente
colpiti; nel turno proprio successivo la seconda richiede che entrambi
siano ancora vivi e li fa collidere. Mostrare agganci e catene/cavi sui
veri scafi, mantenerli per la durata dell'aggancio, tendere i collegamenti
e muovere le due navi fino all'urto, poi rilasciarle nelle posizioni corrette.
Abbinare suono e vibrazione ad aggancio, trazione e collisione. Non ridurre
la combinazione a due proiettili generici o a una sola esplosione mentre
le navi restano ferme. La coreografia rappresenta gli eventi reali, senza
aggiungere immobilizzazione, danni, bersagli o durata non previsti dal codice.
La meccanica e la presentazione dedicata sono implementate e collaudate su
StackBlitz per le sei carte del secondo gruppo Metallo approvate il 25/11.
Vedi `docs/ARMI_METALLO_CATENE_COLLISIONI_INDUZIONE_2026-11-25.md`.
La vibrazione fisica su telefono rimane da verificare.

**Correzione utente del 25/11 — urto del Collassatore:** quando le navi
vengono tirate l'una contro l'altra, il contatto deve avere un BOOM deciso:
lampo breve, esplosione incandescente, onda sul piano, schegge e scintille,
fumo e contraccolpo degli scafi, con audio profondo sincronizzato. La
Leggendaria aggiunge frammenti prismatici. Conservare un unico urto visivo
per la coppia, i bersagli e i danni del motore, la prospettiva, la sincronia e
il rientro nelle posizioni corrette; nessuna esplosione per colpi bloccati.

**Revisione successiva — movimento vivo:** la sola esplosione aggiunta al
lento scorrimento degli scafi è stata rifiutata come grafica spenta. Il
Collassatore libera prima il corridoio davanti alla madre, poi accelera
negli ultimi 380 ms fino allo schianto, senza frenare all'arrivo. Carica
450 ms, trazione 1000 ms (prima 1800), reazione/rientro 1350 ms; lo scafo
inizia il rilascio dopo 75 ms. Animare il vero scafo con inclinazione,
torsione speculare, contraccolpo, reattori in spinta e luce del contatto.
Ritarare il suono sul nuovo tempo. Non cambiare la velocità dei video per
simulare il risultato: verificare il movimento nativo nella partita.
La posa e tutte le proprietà transitorie devono essere ripristinate; le
preferenze di movimento ridotto restano rispettate.

**Proiettili approvati, revisione del 24/11:** il Maglio usa le quattro
sagome illustrate in `docs/riferimenti-carte/maglio-ferrogravitazionale-2026-11-24/proiettili-approvati.png`.
Il modello volumetrico è in `src/maglioProjectile3D.js`; l'atlante PNG RGBA
resta un riferimento artistico, non una faccia da ruotare per entrambi i lati.
La camera del tavolo mostra il retro nel tiro A e il fronte nel tiro B, con
verticale stabile, occlusioni reali e scala prospettica. Il naso arriva al
bersaglio misurato sulla plancia. Il renderer interpola 24 viste Cycles per
rarità dello stesso volume (fronte/retro, tre azimut e quattro elevazioni).
Le viste sono riproducibili con `scripts/build-maglio-projectile-atlas.mjs`;
la mesh CPU rimane disponibile durante il caricamento. Non tornare a un'unica
immagine obliqua ruotata nei due sensi. Conservare piastre, giroscopi, alette e prismi;
mostrare questi dettagli durante
il volo. **Correzione utente del 24/11:** testata compatta a piastre, senza
una grossa cornice quadrata vuota; scala fisica in partita 0,48 rispetto
al modello artistico. Ridimensionare anche scia e distanza naso/centro,
conservando arrivo sul bersaglio e viste fronte/retro. La calibrazione approvata richiede leggibilità: il Maglio viaggia per
1.400 ms e l'impatto rimane visibile 950 ms. Audio, reazione della nave e
rilascio del turno usano gli stessi tempi. Il numero di colpi deriva dal motore.

Leggere `docs/REGOLA_EFFETTI_VISIVI_CARTE_2026-11-24.md` quando si crea o
inserisce un'Arma o il suo effetto. La decisione successiva richiede porte
variabili entro il lato della propria flotta; forma, sequenza, contatto e
rifiniture seguono arma e rarità. Numero di colpi, bersagli e danno seguono
gli eventi del motore. Il Maglio corrente ha 1/3/6/9 colpi: la vecchia
prescrizione di un centro fisso e un solo colpo per rarità è superata.
Quando una carta è approvata, nello stesso inserimento implementare il colpo
univoco e il suono per ogni sua rarità, pubblicare codice e PNG su `test7/main`
e controllare visivamente e acusticamente la partita su StackBlitz. Non
attribuire automaticamente a tutte le Armi uno sparo in base al solo elemento.
Le altre Armi conservano un effetto provvisorio finché progettate una per una.

## Correzione del 24 novembre 2026 — cornici di rarità e simboli

Le quattro cornici HD Comune, Rara, Epica e Leggendaria in `docs/riferimenti-carte/basi-rarita-ufficiali-2026-11-24/` rappresentano **rarità, non categoria Arma**. Consultare [docs/BASI_UFFICIALI_RARITA_2026-11-24.md](docs/BASI_UFFICIALI_RARITA_2026-11-24.md). Sono PNG trasparenti 3072×4608, senza testi, icone o illustrazioni. L'arancione interno è il colore dell'esempio Arma: per Difesa o altra categoria adattare il colore interno; conservare geometria degli slot e finitura esterna della rarità. La Leggendaria approvata è in cristallo prismatico. Le vecchie anteprime Arma WebP del 23/11 sono ritirate. Non ridurre o ricostruire queste basi.

**Nuova regola 24/11 — scheda completa:** il pannello sotto le scritte delle caratteristiche/effetto prende il colore della categoria (Arma arancione, Attacco rosso, Difesa azzurro, Personaggio magenta, Terreno verde, Trappola viola); cornice esterna e stile delle scritte seguono la rarità. Alla richiesta «crea una carta», scegliere la cornice HD originale, cercare nel catalogo ID, valori, categoria, elemento e rarità, usare i simboli indicizzati, comporre illustrazione e testi nei rispettivi spazi, verificare il contrasto e mostrare l'anteprima completa prima di inserirla nel gioco. Le prove di adesivi esistono ma devono ancora essere approvate visivamente. Per il dettaglio e l'esempio di allineamento ENERGY / ATTACK consultare la procedura.

Il simbolo della **categoria variabile** va nello slot tondo sinistro; l'eventuale elemento nello slot tondo destro. L'utente ha autorizzato prove di nuovi simboli fedeli ai soggetti della tavola del 21/11 ma adattati ai fori circolari, senza il vecchio contenitore a rombo/esagono. Le prove non sono asset approvati: mostrarle e ottenere approvazione prima di inserirle nel gioco. La tavola del 21/11 rimane fonte visiva dei soggetti fino all'approvazione dei nuovi simboli.

Le **16 prove PNG separate** sono indicizzate in [docs/SIMBOLI_ADESIVI_2026-11-24.md](docs/SIMBOLI_ADESIVI_2026-11-24.md) e in `docs/riferimenti-carte/adesivi-slot-2026-11-24/manifest.json`: sei categorie a sinistra e dieci elementi a destra, con ID reali del motore, soggetto e coordinate dei cerchi su ciascuna rarità. La posizione è confermata; l'aspetto dei singoli adesivi è ancora da revisionare. Quando si prepara una nuova carta usare l'indice per recuperare il candidato corretto e mostrarlo prima dell'inserimento.

## Aggiornamento approvato il 23 novembre 2026 — cornici di rarità

Leggere [docs/CRITERI_GRAFICI_RARITA_PER_CATEGORIA_2026-11-23.md](docs/CRITERI_GRAFICI_RARITA_PER_CATEGORIA_2026-11-23.md) per la palette del 23/11: **Comune grafite, Rara sabbia bronzata, Epica argento, Leggendaria oro**. Le quattro basi vuote Attacco del 23/11 sono approvate. Le quattro cornici HD più recenti del 24/11 sono riferimenti di rarità trasversali alle categorie, inclusa la Leggendaria prismatica; gli accenti interni e i simboli cambiano con categoria ed elemento. Le varianti delle altre categorie vanno verificate visivamente prima di diventare fronti giocabili.

## IMPORTANTISSIMO — ogni richiesta «crea una carta»

La PRIMA OPERAZIONE, anche in nuove chat o sessioni, è leggere il file
[docs/PROCEDURA_OBBLIGATORIA_CREAZIONE_CARTE.md](docs/PROCEDURA_OBBLIGATORIA_CREAZIONE_CARTE.md).
**Non saltare i passaggi perché l'utente ha scritto solo "crea la carta".**

Ordine FISSO: **catalogo + valori giocati → base PNG ufficiale → tavola
PNG dei simboli ufficiali → composizione sul modello ORIGINALE → controllo
visuale → anteprima in chat → approvazione prima dell'inserimento.**

Sorgenti obbligatorie, originali da riutilizzare MATERIALMENTE:
- `docs/riferimenti-carte/basi-rarita-ufficiali-2026-11-24/` (quattro cornici HD)
- `docs/riferimenti-carte/BASE_UFFICIALE_CARTE_2026-11-21.png`
- `docs/riferimenti-carte/SIMBOLI_CATEGORIE_ELEMENTI_2026-11-21.png`
- `docs/CARTE_RIFERIMENTI_GRAFICI_UFFICIALI_2026-11-21.md`
- `src/fleetNext/rules.js`, `src/fleetNext/weaponRarityEvolutions.js`
- `docs/VALORI_QUASI_DEFINITIVI_235_ARMI_2026-11-22.md` per le Armi

Fino all'approvazione dei nuovi simboli, usare i soggetti della tavola
ufficiale: ARMA è la torretta/cannone futuristico arancione, non cannone
storico su ruote o mirino. Le prove autorizzate possono eliminare i vecchi
contorni a rombo/esagono e adattare scala e composizione ai fori circolari,
conservando il soggetto riconoscibile. Nessun logo del gioco sulle carte.
Grafica della cornice esterna immutabile.
Le rarità cambiano la finitura esterna, non la categoria.

**Ogni evoluzione della stessa carta deve avere un dettaglio VISIVO
AGGIUNTIVO E DIVERSO nell'illustrazione centrale**, progressivo fra Comune,
Rara, Epica e Leggendaria. Non basta cambiare i danni, la cornice o il suo
colore: si deve vedere la progressione fisica del soggetto pur conservandone
identità, scena, simboli ufficiali e geometria della base. I dettagli artistici
NON aggiungono nuove abilità o modifiche al combattimento. Prima di mostrare
le varianti, verificare questa differenza a colpo d'occhio.
Riferimento operativo: `docs/PROCEDURA_OBBLIGATORIA_CREAZIONE_CARTE.md`.

**CARTE ARMA — REGOLA DI REALIZZABILITÀ 3D OBBLIGATORIA:** prima
di generare qualsiasi Arma, pensarla come un dispositivo offensivo
futuristico realmente modellabile e montabile su una navicella. La scena
deve mostrarne scocca, volumi 3D, innesti, struttura meccanica, emettitori,
nuclei e parti funzionali leggibili. **Non disegnare utensili fantasy o
martelli tradizionali**. Anche se la carta si chiama «Maglio
Ferrogravitazionale», raffigurare un apparato gravitazionale pesante
tecnologico con aggancio navale, non un martello da impugnare. Ogni
evoluzione mantiene l'identità dell'apparato ma ne evolve componenti
fisici riproducibili in 3D. Se non è plausibile modellarlo e animarlo
come arma della flotta, l'illustrazione va rifatta. Non alterare regole,
danni, simboli, cornice e base di carta. La procedura completa è in
`docs/PROCEDURA_OBBLIGATORIA_CREAZIONE_CARTE.md`.

Se una sorgente PNG non può essere letta come immagine, non dichiarare
conforme una generazione che ne imita la forma: dirlo e risolvere la lettura
della sorgente prima di proseguire.

**Le anteprime di immagini non si inseriscono negli asset giocabili finché
non sono approvate dall'utente.**

## Varietà delle Armi — decisione del 25 novembre 2026

Per le prossime illustrazioni variare davvero sagoma, struttura e agganci:
non ripetere per tutte le Armi un cannone o una base a quattro piedi.
Progettare, quando coerente con l'effetto, apparati ad anello, ganasce,
moduli laterali, bobine sospese, strutture pieghevoli o altri dispositivi
offensivi riconoscibili e modellabili. L'inventiva riguarda la macchina,
non introduce abilità, colpi o danni nuovi. Ogni famiglia conserva una
propria identità attraverso le rarità. Le sei carte Slitta e Recuperatore
mostrate il 25/11 sono approvate; questa indicazione vale dalle successive.

**Effetti per rarità, precisazione del 25/11:** leggere tutta la carta e
personalizzare anche la sequenza: carica, raffiche quando previste, scie,
componenti mobili, impatto ed effetti condizionali. Non riciclare lo stesso
colpo con un colore o una grandezza diversi per tutte le rarità. Gli effetti
seguono le condizioni effettive della carta; il numero dei colpi di danno,
le durate e i bersagli continuano a provenire dal motore. Per Slitta e
Recuperatore il catalogo prevede un colpo per turno di attivazione: le
evoluzioni rendono distinta l'intera sequenza, senza aggiungere danni.

## Lavoro sul repository

Repository unico: `marcoteghini1988-ai/test7`, ramo `main`.
Non creare cloni, progetti paralleli o versioni di prova.
Non cambiare meccaniche, valori, layout della plancia 3D o vecchie
immagini approvate mentre si crea un'anteprima carta.

**Questa è una regola operativa persistente del progetto.** Le prove di simboli restano separate dalle carte giocabili fino alla loro approvazione.

## Terzo gruppo Metallo — sei fronti confermati il 25/11

Frantumatore a Induzione Leggendario, Perforatore a Cascata Epico e
Leggendario, Artiglieria delle Schegge Erranti Metallo Rara, Epica e
Leggendaria sono approvati dall’utente. I loro PNG originali si ricompongono
con verifica SHA-256 tramite `scripts/restore-weapon-fronts.mjs`, eseguito
prima di dev/build/preflight; le parti sono in `asset-sources/weapon-fronts/`.
Conservare questa preparazione anche nei checkout nuovi. La Cascata
prosegue dallo scafo precedente soltanto per trasferimenti reali pagati;
le Schegge sparano una volta per turno proprio e usano il bersaglio reale.
Vedi `docs/ARMI_METALLO_TERZO_GRUPPO_INTEGRATO_2026-11-25.md`.

Le sei varianti del terzo gruppo sono state collaudate sulla plancia reale
StackBlitz: A/B, entrambi gli slot, turni successivi e condizioni Energia/
Difesa/blocco, con video e audio a velocità nativa. Il riscontro aptico
fisico sul telefono resta da verificare. Dettagli nel resoconto del lotto 3.
