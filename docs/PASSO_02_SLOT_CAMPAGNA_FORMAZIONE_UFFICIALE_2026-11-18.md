# Eclissi Stellare — PASSO 2: slot e schieramento ufficiale (18 novembre 2026)

Repository ufficiale \`test7/main\`. La plancia metallica 3D 9:16 e le 170 carte esclusive non vengono sostituite.

## Modifiche
- La battaglia ufficiale passa le **due carte supporto selezionate nell'Hangar** al motore; non legge più il numero di supporti calcolato dal livello della madre. Un roster vuoto schiera solo la madre anche se questa è al livello massimo.
- Supporti diversi e anche due copie dello stesso supporto possono affiancare qualunque nave madre. Non occupano posti nel mazzo da 40; sono carte-unità fisiche schierate dall'inizio dello scontro con barra HP propria.
- Nelle partite ufficiali le scudiere usano **l'elemento della madre scelta**, non quello del modello d'origine. Restano soggette ai vantaggi e svantaggi elementali di quel campo.
- Gli slot vengono sbloccati permanentemente con **vittorie** di campagna: primo slot al settore 20 e secondo al settore 60 (soglie **provvisorie**, da bilanciare sulla curva XP). Non si sbloccano in partita, con HP o con i livelli delle madri.
- Alla vittoria di ciascun traguardo viene assegnata **una copia di supporto iniziale** all'inventario separato e schierata se il relativo slot è libero. Primo: Velo Aurora; secondo: Artiglio a Impulsi. Nessun duplicato se la battaglia viene rigiocata; PvP simulato e sconfitte non assegnano premi.
- L'Hangar mostra i due slot, gli SVG delle unità possedute e permette di salvare la coppia in modo indipendente dalla selezione della madre.
- Il nemico simulato usa la progressione di campagna (nessuno/primo/secondo supporto) e non il livello della propria nave. PvP simulato rispetta il numero di slot del giocatore. La formazione storica rimane disponibile soltanto nei test/percorsi legacy.
- Nel percorso indipendente viene ammessa una Fusione storica **solo** con due supporti originali appartenenti alla famiglia L01, L03 o L04 della madre; per L04 non vengono generate di nascosto riserve aggiuntive. La seconda fusione e il trasferimento delle carte ai supporti sono fasi successive.

## Da completare
1. Sostituire le vecchie passive tecniche con le **15 abilità condivise** concordate, vincolate al singolo supporto e ai propri livelli.
2. Creare acquisti/sblocchi aggiuntivi e potenziamenti dei supporti con costi e HP bilanciati (oggi i primi due supporti sono premi campagna; gli altri 32 non sono ancora acquistabili in UI).
3. Trasferire le tre Carte Fusione dalle dieci esclusive delle madri ai supporti abilitati e creare altre tre esclusive per ripristinare le dieci per ogni madre. Preparare il funzionamento della seconda Fusione Arca con relative riserve.
4. Rivedere le carte esclusive storiche che richiedono numero di supporti, e i testi ancora riferiti allo sblocco tramite livello madre.
5. Collaudo completo di deck, energia, boss, sincronizzazione HP e UI senza cambiare il renderer.

## Compatibilità
Nessun salvataggio delle 17 madri o del mazzo viene cancellato. L'inventario delle scudiere usa la propria chiave \`eclissi_support_collection_v1\`; l'attribuzione del premio è idempotente anche se il salvataggio dei premi precedenti era già stato effettuato. Nessuna immagine nuova.
