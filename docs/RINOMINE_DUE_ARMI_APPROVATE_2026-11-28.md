# Due rinomine Arma approvate — 28 novembre 2026

L'autore ha confermato con «si» le due proposte presentate insieme dopo
l'ampliamento della ricerca sui nomi.

| Nome precedente | Nome italiano approvato | Nome inglese approvato | Rarità presenti |
| --- | --- | --- | --- |
| Cannone del Giudizio Temporale | Cannone Quervaldissio | Quervaldissio Cannon | Leggendaria |
| Inceneritore a Plasma Rotante | Turbina Svarquendica | Svarquendica Turbine | Epica, Leggendaria |

## Identità e contenuti conservati

- `weapon-designed-ionic-giudizio-temporale` mantiene il suo ID.
- `weapon-designed-plasma-inceneritore-rotante` e la sua evoluzione
  `weapon-designed-plasma-inceneritore-rotante-rarity-l` mantengono i loro ID.
- Danni, percentuali, durata, Bruciatura, condizioni, bersagli, costi,
  sequenze visive, audio e piani aptici restano quelli approvati.
- Illustrazioni, cornici, simboli e PNG originali sono conservati byte per
  byte. Il nome corrente è nel livello testo separato, con EN predefinito
  e traduzione IT; i sei SVG interessati sono rigenerati dagli stessi
  dizionari usati dalla partita.
- Il Mortaio Magmatico e le altre famiglie restano invariati. Il lotto
  continua a comprendere sei varianti e il registro giocabile 58 varianti.

Cataloghi, profilo numerico, dizionari, registro corrente dei nomi e
intestazioni dello studio sono allineati. I nomi vecchi nei percorsi
tecnici, nei filmati, nelle immagini raster originali archiviate e nei
documenti datati identificano gli stessi contenuti storici: non sono
motivo per cambiare ID o rigenerare la grafica.

## Ricerca preliminare e limiti

Cronovarca e Pirovelica sono proposte ritirate. Per Cronovarca era emerso
CHRONOFORGE nel settore videogiochi. La successiva ricerca approssimata
WIPO su Pirovelica ha restituito tredici registrazioni: fra i nomi letti
Provelia, proVetica, PROVELIC, PROTELICA e PROVENICA. Provelia risulta
registrato in Francia, n. 4742259, nelle classi 35, 36 e 41. Il ritiro
segue il criterio prudente dell'autore, non una constatazione di violazione.

Per **Quervaldissio** e **Svarquendica**, nessuna corrispondenza identica
è stata individuata nelle ricerche web IT/EN e nelle interrogazioni
riuscite di UIBM, EUIPO eSearch, USPTO, Madrid Monitor e WIPO Global Brand
Database. Sono state cercate anche radici e grafie alternative, senza
filtri di classe o di stato. Le ricerche web comprendono i nomi completi
e interrogazioni con Steam, itch.io, Google Play e App Store: dipendono
dall'indicizzazione, non sono un censimento dei cataloghi interni.

Ricerche eSearch con modalità «contiene»: `quervald`, `kervald`,
`quervalt`, `svarquend`, `svarcuend`, `svarkend`: nessun risultato.
UIBM «contiene»: `Quervald`, `Kervald`, `quervalt`, `kervalt`,
`svarquend`, `svarcuend`, `svarkend`: nessun risultato o risultati non
pubblicabili, secondo la riserva mostrata dall'ufficio.

USPTO ha completato senza risultati la query Combined mark:

```text
CM:quervald* OR CM:quervalt* OR CM:kervald* OR CM:kervalt* OR CM:svarquend* OR CM:svarcuend* OR CM:svarkend*
```

La WIPO Global Brand Database ha restituito zero risultati sia nella
ricerca testuale sia nella ricerca ortografica approssimata per entrambi.
La ricerca fonetica ha restituito 36 risultati per Quervaldissio, letti
tutti con nome, classe, stato e numero; nessun conflitto evidente col nome
completo è stato individuato nello screening. Per Svarquendica la ricerca
fonetica della Global Brand Database ha restituito zero risultati.
Madrid Monitor ha completato le ricerche testuali/approssimate senza
risultati; la sua ultima ricerca fonetica su Svarquendica ha restituito
errore 403 ed è esclusa dagli esiti validi. Per quel controllo si usa
l'esito riuscito della Global Brand Database.

TMview è rimasto fermo al caricamento anche dopo un ricaricamento.
EUIPO eSearch è stato consultato direttamente con successo; la Global
Brand Database amplia la ricerca a collezioni nazionali e regionali, ma
non sostituisce una verifica di ogni registro nazionale europeo. Gli
aggiornamenti delle sue collezioni hanno date diverse.

**Esito: screening preliminare favorevole, non certificazione di libertà
d'uso o esclusività mondiale.** Le ricerche non costituiscono un parere
legale sui marchi simili, né coprono tutti gli usi non registrati o i
depositi non ancora pubblicati. L'approvazione dell'autore riguarda la
scelta dei nomi, non elimina questi limiti.

Fonti consultate: [UIBM](https://www.uibm.gov.it/bancadati/Advanced_search/type_url?type=tm),
[EUIPO eSearch](https://euipo.europa.eu/eSearch/),
[USPTO](https://tmsearch.uspto.gov/search/search-results),
[Madrid Monitor](https://www3.wipo.int/madrid/monitor/en/),
[WIPO Global Brand Database](https://branddb.wipo.int/en),
[copertura WIPO](https://branddb.wipo.int/en/coverage),
[limiti delle ricerche EUIPO](https://www.euipo.europa.eu/the-office/help-centre/tm/faq-search-availability).

## Verifiche dell'applicazione

Superati **53 test mirati**, inclusi catalogo, evoluzioni, danno percentuale,
Bruciatura, eventi, renderer, studio condiviso e corrispondenza esatta dei
sei PNG originali, delle sei basi e dei dodici SVG del lotto. La verifica
dei dizionari conferma gli stessi ID, descrizioni e valori numerici, con
sole modifiche a nome e due righe del titolo per le tre varianti.
Compilazione TypeScript/Vite riuscita usando la modalità asset remoti già
prevista dal progetto; `git diff --check` riuscito. Nessun PNG, font o
suono modificato.

La verifica della rinomina riguarda cataloghi, testi EN/IT, livelli SVG,
conservazione di ID/valori e compilazione. Il collaudo audiovisivo del
27 novembre rimane quello storico del lotto; non viene presentato come
una nuova prova StackBlitz della rinomina. Non sono introdotti nuovi
asset o nuove meccaniche.
