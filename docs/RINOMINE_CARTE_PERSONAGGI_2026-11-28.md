# Nomi correnti delle carte e dei Personaggi — 28 novembre 2026

## Decisione e perimetro

Su richiesta dell'autore, le coincidenze e le somiglianze riconoscibili con
nomi di carte o videogiochi sono state trattate in modo prudenziale. Il
registro `AUDIT_NOMI_INTERNI_COMPLETO_2026-11-27.json` contiene **460
denominazioni correnti distinte**: questo numero include anche 16 Personaggi
generici ancora **proposti**. I 42 Personaggi sono 30 generici più 12 Boss;
solo 14 generici sono confermati. Le dodici carte Personaggio Boss illustrate
non sono ancora approvate e nel gioco mantengono etichette temporanee.

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

Ogni famiglia conserva lo stesso elemento e le quattro rarità, da una a
quattro cariche. Le affinità Fuoco, Acqua e così via restano termini che
identificano il funzionamento; il **nome della carta** diventa distinto
dalla formula «Energia + elemento» presente nel GCC Pokémon.

| Elemento | ID comune | Nome italiano | Nome inglese |
| --- | --- | --- | --- |
| Fuoco | `energy-plasma` | Riserva Pirofusa | Pyrofused Reserve |
| Acqua | `energy-refrigerant` | Riserva Idropressa | Hydropressed Reserve |
| Ghiaccio | `energy-cryogenic` | Riserva Crioviva | Cryovive Reserve |
| Fulmine | `energy-ionic` | Riserva Ionolampo | Ionoflash Reserve |
| Terra | `energy-mineral` | Riserva Georisonante | Georesonant Reserve |
| Vento | `energy-aerial` | Riserva Aerotorsiva | Aerotorsion Reserve |
| Luce | `energy-radiant` | Riserva Fotoprismatica | Photoprismatic Reserve |
| Ombra | `energy-void` | Riserva Umbradensa | Umbradense Reserve |
| Metallo | `energy-metallic` | Riserva Ferropulsiva | Ferropulse Reserve |
| Gravità | `energy-gravity` | Riserva Gravitessuta | Gravithread Reserve |

Il codice delle carte usa nomi italiani distinti, mentre il livello di testo
mostra la traduzione inglese quando la lingua predefinita è `en`. Le
descrizioni continuano a indicare l'elemento e le cariche spendibili. Le
referenze meccaniche alle carte fisiche sono state aggiornate dove il nome
specifico serve a capire l'effetto.

## Evidenze e limiti del controllo

- [Yu-Gi-Oh! Neuron: Buco Nero](https://www.db.yugioh-card.com/yugiohdb/card_search.action?cid=4342&ope=2&request_locale=it) è una carta ufficiale con effetto di rimozione dal terreno.
- [Pokémon GCC: nomi delle Energie](https://www.pokemon.com/it/approfondimenti/tre-mazzi-dell-espansione-spada-e-scudo-tempesta-argentata-con-protagonisti-ho-oh-v-chesnaught-v-e-wailord) elenca fra gli altri Energia Fuoco, Acqua e Metallo.
- [Bungie: Bastione solare](https://help.bungie.net/hc/it/articles/360048720192-Problemi-conosciuti-e-informazioni-vitali-Archivio-anno-1-e-2-di-Destiny-2) e [Steam: Guardians of Gaia](https://store.steampowered.com/app/1718290/Guardians_Of_Gaia/) documentano gli usi preesistenti citati.
- [Wizards of the Coast: Archivista a Ingranaggi](https://magic.wizards.com/it/news/card-image-gallery/strixhaven-school-of-mages-card-image-gallery) documenta il termine in una carta Magic; *Archivista* compare anche come nome di carta del gioco.

La ricerca testuale preliminare dei nomi proposti non ha evidenziato nelle
risposte consultate una coincidenza immediata dei titoli composti, ma non è
una ricerca esaustiva. Restano da valutare **segni simili e marchi** nei
territori e nelle categorie pertinenti tramite UIBM/TMview e altri registri,
nonché i nomi delle carte che saranno ancora progettate. Nessun nome viene
certificato libero; la scelta del titolo commerciale del gioco è rimandata
come già deciso dall'autore.

I documenti datati prima di questa revisione conservano le denominazioni
storiche come traccia dell'approvazione e della progettazione. Le etichette
operative e il registro corrente prevalgono per la versione attiva.
