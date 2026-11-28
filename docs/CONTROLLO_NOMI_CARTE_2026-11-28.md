# Controllo dei nomi interni delle carte — 28 novembre 2026

**Decisione successiva del 28/11:** l'autore ha scelto dodici nomi dei
Personaggi. I nomi correnti sono nel
[registro dei 42](REGISTRO_42_PERSONAGGI_CON_BOSS.json) e il confronto fra
nome originario, intermedio e scelto è nella
[mappatura](RINOMINE_CARTE_PERSONAGGI_2026-11-28.md). Il controllo dei
marchi simili resta preliminare; l'approvazione del nome non approva
illustrazioni o abilità ancora proposte. Il testo sottostante descrive
la ricognizione anteriore alla scelta.

## Risultato verificabile sul repository

Il registro [strutturato](AUDIT_NOMI_INTERNI_COMPLETO_2026-11-27.json)
elenca **437 denominazioni in sorgenti esistenti**, senza duplicati testuali
esatti dopo normalizzazione di accenti, maiuscole e punteggiatura. Questo
insieme include bozze di catalogo e contenuti non ancora giocabili: **437 non
significa 437 carte illustrate o approvate**. Altri **23 nomi di vecchi
Piloti** erano stati contati per errore come correnti: i due file sorgente
sono stati eliminati e i nomi sono ora conservati come storici. Le **167 bozze
storiche** restano separate.

Le 437 denominazioni comprendono: 12 navi madri; 13 supporti e 13 nomi di
Fusione; 120 esclusive delle madri; 30 Personaggi generici e 12 Boss; 48 Armi
del vecchio catalogo, 22 famiglie nuove, 35 Armi progettate, 2 trasferite e
27 Armi native; 32 Carte Sistema, 35 moduli, 25 tattiche, 1 Carta Sistema
speciale e 10 famiglie Energia. I sottogruppi possono essere cataloghi di
lavorazione: l'inventario non indica da solo se un fronte sia completato.

Le dieci famiglie Energia sono di nuovo **Energia Fuoco, Energia Acqua,
Energia Ghiaccio, Energia Fulmine, Energia Terra, Energia Vento, Energia
Luce, Energia Ombra, Energia Metallo, Energia Gravità**. Le quaranta
varianti conservano ID, affinità, rarità, cariche e meccaniche.

## Personaggi e nomi da decidere

Il [registro dei 42 Personaggi](REGISTRO_42_PERSONAGGI_CON_BOSS.json)
contiene 14 Personaggi generici con meccaniche confermate, 16 generici
proposti e 12 Boss. Nove Boss hanno meccaniche confermate in attesa di
bilanciamento e tre sono in proposta di revisione. I generici non risultano
carte giocabili complete nel registro; le dodici carte Personaggio Boss non
hanno ancora illustrazioni/fronti approvati e in gioco hanno etichette
provvisorie numerate. Non considerare i nomi delle professioni come nomi
propri definitivi dei Personaggi.

Nel [catalogo delle 120 esclusive](NUOVO_CATALOGO_ESCLUSIVE_120_2026-11-16.json)
ci sono **altre 12 carte di tipo Personaggio**, una per nave madre, con stato
`executable-in-combat-v1; final-art-pending`: Cartografo Aurora, Pilota
Helios, Artigiana Prisma, Comandante Risonante, Artigliere Binario,
Navigatrice Manta, Ammiraglio Abissale, Arconte della Bruma, Capitano di
Vortiluce, Sovrano dell’Eclisse, Magistro Ossidiana e Vegliatore delle Rotte
Celesti. Hanno ID distinti dal registro dei 42; i fronti finali attendono
arte approvata. Anche questi nomi vanno sottoposti all'autore quando si
decideranno nomi propri per i personaggi. Il vecchio campo tecnico `type`
delle esclusive non ridefinisce le categorie editoriali correnti Arma e
Strategia.

Sette denominazioni cambiate in una fase precedente sono presenti nel codice
ma restano **provvisorie**, perché l'autore vuole decidere prima di approvare
nuovi nomi: Archivista → Decifratrice degli Scarti; Guardiano di Gaia →
Curatore delle Falde Vive; Bastione Solare → Baluardo Eliovetro (anche la
Fusione); Buco Nero → Collasso dei Due Campi; Singolarità · Buco Nero →
Singolarità · Nodo di Assorbimento; Martello del Tuono → Impattatore
Folgorico. Vedere [ID e motivi](RINOMINE_CARTE_PERSONAGGI_2026-11-28.md).
Nessun ulteriore nome di Personaggio o carta è stato sostituito in questa
fase senza una scelta dell'autore.

## Quale verifica giuridica è stata fatta

La ricognizione sui cataloghi distingue nomi correnti, vecchi nomi e bozze
e rileva omonimie interne. Una precedente ricerca esatta nel database UIBM
ha riguardato **61 nomi allora prioritari**, con quattro risultati da
esaminare; vedere [evidenze e limiti](VERIFICA_MARCHI_NOMI_PRIORITARI_2026-11-27.md).
Questa copertura non si estende automaticamente ai restanti nomi o alle
somiglianze. Una ricerca web su un nome candidato è solo preliminare; non
dimostra che sia libero come marchio o titolo in tutti i mercati.

Le parole comuni che descrivono gli elementi non sono di per sé proprietà
esclusiva di un gioco. Il diritto d'autore protegge l'opera creativa; l'art.
100 della legge italiana considera anche il titolo che identifica un'opera
se riusato in modo da creare confusione. I marchi si valutano secondo il
segno, i prodotti o servizi e il territorio. Un nome proprio inventato può
essere scelto per originalità, ma **non si può promettere che sia incapace
di ricevere tutela futura o che nessun terzo abbia diritti anteriori**.

Fonti istituzionali:

- Normattiva, legge 633/1941, art. 1 e art. 100:
  https://www.normattiva.it/eli/id/1941/07/16/041U0633/CONSOLIDATED/20260915
- EUIPO, carattere descrittivo e disponibilità dei marchi:
  https://www.euipo.europa.eu/en/trade-marks/before-applying/availability
  e https://guidelines.euipo.europa.eu/1803468/1789874/trade-mark-guidelines/1-1-the-notion-of%20descriptiveness
- WIPO, *Creative Expression*, sezione su nomi e frasi brevi:
  https://www.wipo.int/edocs/pubdocs/en/wipo-pub-918-23-en-creative-expression.pdf

**Stato:** ripristino delle Energie eseguito; verifica tecnica dell'inventario
eseguita; scelta editoriale dei Personaggi e ricerca di marchi identici e
simili ancora aperte. Prima di inserire un nome definitivo, mostrarne
proposta, abilità corrispondente, eventuali somiglianze riscontrate e limiti
della verifica all'autore.
