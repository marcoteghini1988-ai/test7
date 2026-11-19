# Eclissi Stellare — Catalogo di 120 carte Terreno elementali
**19 novembre 2026 — progettazione iniziale**. Tutti i valori sono provvisori e richiedono collaudo prima dell'attivazione in battaglia.

## Struttura approvata
Dieci elementi ufficiali, tre varianti di terreno per elemento e quattro rarità (Comune, Rara, Epica, Leggendaria): **30 modelli / 120 carte collezionabili**.
Ogni carta dello stesso modello mantiene nome, elemento ed effetto: **cambia soltanto la percentuale**.

## Percentuali provvisorie
| Rarità | Offensivo (+danni) | Difensivo (+efficacia difese) | Equilibrato (+attacco e +difesa) |
|---|---:|---:|---:|
| Comune | 10% | 10% | 5% / 5% |
| Rara | 12% | 12% | 6% / 6% |
| Epica | 14% | 14% | 7% / 7% |
| Leggendaria | 16% | 16% | 8% / 8% |

## Elenco dei 30 modelli (ognuno presente nelle 4 rarità)
| Elemento | Terreno offensivo | Terreno difensivo | Terreno equilibrato |
|---|---|---|---|
| Fuoco (`plasma`) | Forgia delle Stelle | Bastione Magmatico | Corona di Plasma |
| Acqua (`refrigerant`) | Correnti Impetuose | Fondale Protettivo | Marea Primordiale |
| Ghiaccio (`cryogenic`) | Tempesta Criogenica | Muraglia di Brina | Regno del Permafrost |
| Fulmine (`ionic`) | Tempesta di Archi Ionici | Gabbia di Faraday | Nucleo delle Saette |
| Terra (`mineral`) | Faglia Sismica | Fortezza di Basalto | Cuore del Pianeta |
| Vento (`aerial`) | Ciclone Stellare | Barriera dei Venti | Orizzonte Turbolento |
| Luce (`radiant`) | Lancia dell'Aurora | Cupola Radiante | Alba Celeste |
| Ombra (`void`) | Vortice delle Tenebre | Velo del Vuoto | Eclisse Profonda |
| Metallo (`metallic`) | Pioggia di Titanio | Fortezza Ferrica | Cittadella Meccanica |
| Gravità (`gravity`) | Pozzo Gravitazionale | Scudo Orbitale | Singolarità Controllata |

## Effetti e durata
- **Effetto elementale globale:** il Terreno potenzia le azioni dell'elemento indicato per **entrambi i giocatori**, indipendentemente da chi lo ha schierato.
- **Persistenza:** il bonus si applica a **ogni azione compatibile in tutti i turni**, senza limite per turno, finché il Terreno non è sostituito o contrastato dalla carta prevista.
- **Un solo Terreno attivo alla volta.** Non si sommano bonus di Terreni diversi; le abilità non ottengono il bonus due volte sullo stesso effetto.
- **Offensivo:** aumenta il danno degli attacchi dell'elemento (madre, attacco speciale, Armi e supporti quando producono attacchi di quell'elemento). Il bonus percentuale è identico contro bersagli forti, deboli o neutrali; la matrice dei vantaggi rimane valida.
- **Difensivo:** aumenta l'efficacia delle difese dell'elemento, compresi scudi e carte Difesa compatibili. Non incrementa gli HP massimi.
- **Equilibrato:** assegna metà del bonus offensivo e difensivo dello stesso grado, con entrambe le applicazioni in contemporanea.
- Le carte non amplificano automaticamente cura, rigenerazione, effetti senza elemento o HP base.

## Evoluzione con doppioni — stessa logica delle navicelle
- Per passare a rarità superiore servono **3 copie fisiche dello stesso Terreno e della stessa rarità**.
- Si consumano **2 doppioni**; la carta di origine resta conservata e si genera **1 nuova carta** della rarità successiva, esattamente come per madri e supporti.
- Percorso: Comune → Rara → Epica → Leggendaria. Le carte Leggendarie non possono salire oltre.
- Il costo aggiuntivo in Crediti Stellari è previsto con il criterio navicelle, ma **l'importo per i Terreni non è ancora definito**; non è gratuito per impostazione predefinita.
- Non è consentito fondere carte di Terreni diversi o di rarità diverse per ottenere un'evoluzione.

## Stato tecnico
- Le **120 definizioni collezionabili** sono registrate in `src/fleetNext/elementalTerrainCards.js`, con ID univoci, categoria, elemento, rarità e valori di attacco e difesa.
- **Non sono ancora state integrate** nel motore di battaglia, nello Shop, nell'inventario o nel mazzo; non sono ancora carte giocabili.
- `src/fleetNext/terrains.js` conserva il vecchio sistema di Terreni ambientali della campagna e dei boss: non è stato sovrascritto, anche perché contiene scadenze incompatibili con i nuovi Terreni persistenti.
- Prima dell'integrazione occorre verificare l'ordine dei moltiplicatori e gli arrotondamenti, la difesa, i boss, i limiti di mazzo e il prezzo di evoluzione.

## ID del catalogo
Formato `ET-<ELEMENT_ID>-<ATT|DEF|EQ>-<C|R|E|L>`; esempio: `ET-REFRIGERANT-ATT-C`, `ET-REFRIGERANT-ATT-R`, `ET-REFRIGERANT-ATT-E`, `ET-REFRIGERANT-ATT-L`.
