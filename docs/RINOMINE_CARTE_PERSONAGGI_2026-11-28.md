# Nomi correnti delle carte e dei Personaggi — 28 novembre 2026

## Decisione e perimetro

Su richiesta dell'autore, le coincidenze e le somiglianze riconoscibili con
nomi di carte o videogiochi sono state trattate in modo prudenziale. Il
registro `AUDIT_NOMI_INTERNI_COMPLETO_2026-11-27.json` contiene **437
denominazioni in sorgenti esistenti**: questo numero include anche 16 Personaggi
generici ancora **proposti**, e non misura le carte già completate. I 23 nomi
di vecchi Piloti, provenienti da file eliminati, sono conservati a parte come
storici. I 42 Personaggi sono 30 generici più 12 Boss;
solo 14 generici sono confermati. Le dodici carte Personaggio Boss illustrate
non sono ancora approvate e nel gioco mantengono etichette temporanee.
Le sette rinomine qui sotto sono già nel codice ma l'autore non ne ha ancora
approvato i nomi: presentarle come **provvisorie** e non introdurre altre
rinomine prima di proporle nella conversazione.

| ID invariato | Nome precedente | Nome corrente | Motivo della modifica |
| --- | --- | --- | --- |
| `character-general-05` | Archivista | **Decifratrice degli Scarti** | Nome di carta Magic e altri «Archivista»; il nuovo nome descrive il recupero di una Strategia |
| `boss-character-1` | Guardiano di Gaia | **Curatore delle Falde Vive** | Vicinanza concettuale a *Guardians of Gaia*; resta un Personaggio di cura |
| `C01` (supporto) | Bastione Solare | **Baluardo Eliovetro** | «Bastione solare» è usato in *Destiny 2* |
| `fusion-ship-c01` | Navicella Fusione — Bastione Solare | **Navicella Fusione — Baluardo Eliovetro** | Nome della Fusione derivato dal supporto |
| `sys-black-hole` | Buco Nero | **Collasso dei Due Campi** | *Buco Nero* è una carta di *Yu-Gi-Oh!* con effetto di campo riconoscibile |
| `singularity_core` | Singolarità · Buco Nero | **Singolarità · Nodo di Assorbimento** | Nome distinto per il modulo, che conserva la propria funzione |
| `weapon-designed-ionic-martello-tuono` | Martello del Tuono | **Impattatore Folgorico** | Nome tecnico per l'arma navale; anche il testo inglese diventa **Fulminant Impactor** |

Le chiavi `sys-black-hole`, `singularity_core` e
`weapon-designed-ionic-martello-tuono` rimangono stabili per i salvataggi e
le associazioni del motore; le parole nei loro ID non sono nomi mostrati al
giocatore. Nessun valore di danno, rarità, bersaglio, durata, costo, abilità,
elemento o asset illustrativo è stato cambiato.

## Dieci famiglie Energia, quaranta carte

Per decisione dell'autore, i nomi comprensibili delle carte Energia tornano
alla formula originaria **Energia + elemento**. Le dieci parole Fuoco, Acqua,
Ghiaccio, Fulmine, Terra, Vento, Luce, Ombra, Metallo e Gravità designano
le affinità del gioco. Ogni famiglia mantiene quattro rarità e da una a
quattro cariche. La corrispondenza di alcuni nomi descrittivi con Pokémon
non attribuisce a quel gioco il copyright sulle singole parole degli
elementi; il nome completo, l'illustrazione e la presentazione restano temi
distinti di verifica. Nessuna nuova famiglia di nomi va inserita senza
proposta e decisione dell'autore.

| Elemento | ID comune | Nome italiano | Nome inglese |
| --- | --- | --- | --- |
| Fuoco | `energy-plasma` | Energia Fuoco | Fire Energy |
| Acqua | `energy-refrigerant` | Energia Acqua | Water Energy |
| Ghiaccio | `energy-cryogenic` | Energia Ghiaccio | Ice Energy |
| Fulmine | `energy-ionic` | Energia Fulmine | Lightning Energy |
| Terra | `energy-mineral` | Energia Terra | Earth Energy |
| Vento | `energy-aerial` | Energia Vento | Wind Energy |
| Luce | `energy-radiant` | Energia Luce | Light Energy |
| Ombra | `energy-void` | Energia Ombra | Shadow Energy |
| Metallo | `energy-metallic` | Energia Metallo | Metal Energy |
| Gravità | `energy-gravity` | Energia Gravità | Gravity Energy |

Il codice delle carte usa i nomi italiani originari; il livello di testo
mostra la traduzione inglese quando la lingua predefinita è `en`. Le
descrizioni indicano l'elemento e le cariche spendibili. ID, rarità,
effetti, affinità e illustrazioni restano invariati.

### Seconda verifica delle famiglie Energia, 28 novembre

Una seconda ricerca aveva trovato corrispondenze o somiglianze nelle
denominazioni sperimentali: **Pirofusa/Pyrofused → Braciotramata**,
**Crioviva/Cryovive → Gelitessuta**,
**Ionolampo/Ionoflash → Saettatrama**,
**Georisonante/Georesonant → Rocciatrama** e
**Ferropulsiva/Ferropulse → Ferrintrama**. Tutte queste denominazioni con
*Riserva/Reserve* sono ora **ritirate** a favore dei nomi originari con
l'elemento esplicito. Le corrispondenze rilevate includevano
*PyroFused™* in una pubblicità Scorpion BMX, *CRIOVIVA* in un bollettino
brasiliano dei marchi, *CRYOVIVE* nei documenti USPTO, il prodotto
*IONIFLASH MACH®* del produttore e *FERROPULSE* come nome di un'app.
*Georesonant* compare inoltre nel nome di un dispositivo di un'ambientazione
fittizia. Il controllo non stabiliva se tali usi comportassero un divieto
giuridico per il gioco.

Fonti per la seconda verifica:
[Scorpion BMX](https://oldschoolmags.com/mags/SuperBMX_8104.pdf),
[INPI Brasile, CRIOVIVA](https://revistas.inpi.gov.br/pdf/marcas1922.pdf),
[USPTO, CRYOVIVE](https://ttabvue.uspto.gov/ttabvue/v?pnam=Vive+Health%2C+LLC++),
[France Paratonnerres, IONIFLASH](https://ioniflash.com/),
[FERROPULSE](https://ferropulse.com/),
[Atlantis: The Dig](https://www.atlantisbahamas.com/the-dig-tour).

## Evidenze e limiti del controllo

- [Yu-Gi-Oh! Neuron: Buco Nero](https://www.db.yugioh-card.com/yugiohdb/card_search.action?cid=4342&ope=2&request_locale=it) è una carta ufficiale con effetto di rimozione dal terreno.
- [Pokémon GCC: nomi delle Energie](https://www.pokemon.com/it/approfondimenti/tre-mazzi-dell-espansione-spada-e-scudo-tempesta-argentata-con-protagonisti-ho-oh-v-chesnaught-v-e-wailord) elenca fra gli altri Energia Fuoco, Acqua e Metallo.
- [Bungie: Bastione solare](https://help.bungie.net/hc/it/articles/360048720192-Problemi-conosciuti-e-informazioni-vitali-Archivio-anno-1-e-2-di-Destiny-2) e [Steam: Guardians of Gaia](https://store.steampowered.com/app/1718290/Guardians_Of_Gaia/) documentano gli usi preesistenti citati.
- [Wizards of the Coast: Archivista a Ingranaggi](https://magic.wizards.com/it/news/card-image-gallery/strixhaven-school-of-mages-card-image-gallery) documenta il termine in una carta Magic; *Archivista* compare anche come nome di carta del gioco.

La ricerca web fatta sulle denominazioni sperimentali non è esaustiva. Per
le carte Energia sono stati ripristinati i nomi originari su scelta
dell'autore. Restano da valutare **segni simili e marchi** nei
territori e nelle categorie pertinenti tramite UIBM/TMview e altri registri,
nonché i nomi delle carte che saranno ancora progettate. Nessun nome viene
certificato libero; la scelta del titolo commerciale del gioco è rimandata
come già deciso dall'autore.

I documenti datati prima di questa revisione conservano le denominazioni
storiche come traccia dell'approvazione e della progettazione. Le etichette
operative e il registro corrente prevalgono per la versione attiva.
