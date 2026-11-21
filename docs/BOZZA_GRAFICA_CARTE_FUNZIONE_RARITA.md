# Eclissi Stellare — BOZZA grafica: FUNZIONE × RARITÀ

> **RIFERIMENTO GRAFICO CONFERMATO — 21 novembre 2026:** le immagini originali della **base di carta** e dei **simboli approvati** sono state salvate nel repository e documentate in [CARTE_RIFERIMENTI_GRAFICI_UFFICIALI_2026-11-21.md](CARTE_RIFERIMENTI_GRAFICI_UFFICIALI_2026-11-21.md). Per i nuovi fronti usare **quella base e quei simboli**, non introdurre altre geometrie. I simboli degli ambienti barrati sono esclusi; Difesa e Trappola sono universali e senza elemento. Questo aggiornamento grafico prevale sulle indicazioni visive storiche non più pertinenti.

**Versione:** 0.1 — 17 novembre 2026. **Stato:** PROVVISORIO, da discutere e approvare insieme.
**Repository di lavoro:** marcoteghini1988-ai/test7, ramo main.
**Scopo:** decidere e fissare qui le regole di aspetto delle NUOVE carte, prima di generare i fronti. Questo file è la fonte operativa per le decisioni grafiche future; non modifica il combattimento.

## 0. Perimetro e pulizia
- Le 350 carte del catalogo Attacco/Difesa/Trappola precedente sono ritirate dal motore; restano solo i loro ID nell'archivio documentale per evitare collisioni.
- Rimosse anche le 45 immagini WebP dei fronti storici rimaste come riferimento, insieme al loro manifest: non sono più asset del gioco. Le decisioni cromatiche storiche utili vengono trascritte qui come **riferimento**, non come nuovi asset.
- NON toccare le 120 esclusive delle 12 navicelle principali, le carte Personaggio delle varianti, i Personaggi generici, i 12 Boss, le 6 carte tecniche, i Terreni ambientali, la plancia 3D o l'Arca.
- Nessun vecchio identificativo gen-/ex- ritirato va riutilizzato per una nuova carta. I nuovi ID e gli effetti provengono solo dai cataloghi attivi.

## 1. Due informazioni visive indipendenti
**COLORE = funzione principale** (che cosa fa la carta: attacca, protegge, controlla, supporta ecc.). Usare il colore nell'icona, nel nastro categoria e nelle luci della scena.

**RARITÀ = trattamento esterno della cornice** (metallo, riflessi, intensità luminosa e targa inferiore). La rarità non deve nascondere il colore della funzione.

**SOTTOTIPO = pittogramma e testo** (trappola, modulo, arma, personaggio, fusione, tattica). Non basta il solo colore per riconoscerlo.

## 2. Palette storica di funzione, da confermare nel nuovo catalogo
| Funzione base | Colore | HEX | Cosa comunica |
| --- | --- | --- | --- |
| Attacco | Rosso energetico | #FF594C | danni, colpi, offensive |
| Difesa | Ciano/azzurro | #37CEFF | scudi, protezione, intercetto |
| Personaggio | Magenta/viola | #EB64E1 | piloti, capitani, abilità personaggio |
| Terreno | Verde | #2BE3A2 | condizioni ambientali |
| Supporto | Arancione | #FFB24D | riparazioni, rinforzi, bonus |
| Controllo | Indaco | #9E8FFF | deviazione, blocco, interferenza |

Questa è la palette documentata in precedenza nel progetto, non una nuova approvazione. I colori descrivono le **funzioni**, non automaticamente tutte le categorie: il ruolo reale della carta va letto nel catalogo nuovo.

## 3. Le quattro rarità, indipendenti dalla funzione
| Rarità | Trattamento della cornice (riferimento storico) | Colore funzione |
| --- | --- | --- |
| Comune | Metallo argento/grigio, riflessi moderati | Sempre visibile |
| Rara | Cromatura più lucida, luce e dettagli più evidenti | Sempre visibile |
| Epica | Bagliore marcato, accenti viola/fucsia nel metallo | Sempre visibile |
| Leggendaria | Cornice e targa oro cromato, riflessi massimi | Sempre visibile |

**Da approvare:** intensità esatta, proporzione di oro/viola e icone delle quattro rarità. L'oro è una possibile finitura esterna della leggendaria, NON un sostituto del colore di funzione.

## 4. Sottotipi REALMENTE presenti tra le 120 esclusive (17/11/2026)
| Sottotipo catalogo | Numero carte | Proposta di lettura grafica (NON definitiva) |
| --- | ---: | --- |
| Attacco | 34 | funzione Attacco / rosso |
| Difesa | 19 | funzione Difesa / ciano |
| Personaggio | 12 | funzione Personaggio / magenta |
| Tattica | 17 | funzione Supporto oppure Controllo, secondo l'effetto |
| Modulo utilità | 12 | funzione Supporto o Controllo, icona modulo utilità |
| Modulo d’arma | 13 | funzione Attacco, icona modulo arma |
| Trappola | 10 | colore in base all'effetto di difesa/controllo, icona trappola; **dorso coperto non identificabile all'avversario** |
| Fusione | 3 | colore della funzione primaria o segno combinato: **da decidere**, icona fusione |

**Attenzione:** 120 è il numero delle esclusive. Questa tabella non include Personaggi generici, Boss, carte tecniche o Terreni. Per evitare ambiguità, non riciclare i colori dei vecchi cataloghi per una carta nuova senza verificarne l'effetto. Le trappole non sono da cancellare come meccanica: si sono ritirate soltanto le vecchie CARTE generiche.

## 5. Struttura di una nuova carta da verificare
1. Formato verticale 2:3, proporzioni identiche per mano, campo, Shop e collezione.
2. Cornice sci-fi metallica 3D; metallo e targa esprimono la rarità.
3. Simbolo in alto e nastro funzione, entrambi con colore coerente; sottotipo scritto chiaramente.
4. Titolo leggibile e illustrazione specifica, dalla quale si capisca l'azione senza leggere il testo.
5. Descrizione breve ma esatta: non inventare bonus, danni o abilità non implementati.
6. Indicazione di esclusiva navicella, se necessaria, separata dalla rarità.
7. Niente logo del gioco sul fronte. Niente cartoncini quadrati o grafica piatta al posto della carta.

## 6. Decisioni ancora APERTE
- Confermare o correggere i 6 colori base.
- Dare una regola univoca a Tattica, Modulo utilità, Modulo d’arma, Trappola e Fusione.
- Stabilire simboli per sottotipo e quattro rarità.
- Approvare quattro campioni della **stessa funzione**, uno per ogni rarità, e più funzioni alla stessa rarità: così verifichiamo che i due assi non si confondano.
- Definire cornici, spazi di illustrazione, testo e differenza tra carta coperta e scoperta.
- Solo dopo approvazione, creare i primi fronti grafici delle nuove esclusive, per lotti; non ricreare i vecchi cataloghi.

## 7. Regole di sicurezza del progetto
- Nessuna immagine o bozza entra automaticamente tra le carte giocabili.
- Le regole di combattimento e gli effetti vengono dai file attivi, non dai vecchi fronti, dai mockup o da questa bozza.
- Gli asset definitivi si produrranno soltanto dopo approvazione del sistema grafico; fino ad allora restano i fronti provvisori nativi.
- Se altre note storiche chiamano "definitivo" il vecchio stile o elencano 379 carte, per le prossime produzioni prevalgono **questo file provvisorio** e le nuove decisioni concordate.
