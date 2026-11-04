# Passo 8 — collezione persistente

La prima apertura del duello salva la carta Aurora-0 al livello 1. Ogni carta ha un identificativo stabile, un modello e il suo livello. Le carte equipaggiate sono salvate in ordine e schierate automaticamente al prossimo avvio del duello. Prima del primo attacco si può cambiare formazione in **Flotta → Collezione → Salva e schiera**, con la stessa mano e lo stesso mazzo.

La scheda **Prova** mostra tutte le 17 navi con livelli temporanei. Il duello di prova usa due unità di Etere di prova e i suoi esiti non assegnano ricompense. La formazione, i livelli e le risorse della collezione si conservano quando si ritorna alla partita normale. Acquisizione e potenziamento sono operazioni della collezione, pronte per il collegamento a Shop e Hangar nel passo 9.

## Salvataggio

- La chiave locale `eclissi_ship_collection` registra schema 1, carte e formazione in una sola scrittura. L'inizializzazione aggiunge la collezione al salvataggio R12. Le chiavi esistenti di progressione, valute e inventario rimangono quelle già in uso.
- Il caricamento conserva gli identificativi validi, rimuove i duplicati di modello, riporta i livelli fuori intervallo tra 1 e 5 e accetta da una a tre carte possedute. Aurora-0 è unica ed è esclusa dal limite di due specializzate per seme, che comprende anche i semi delle combo. Le carte escluse dalla formazione restano possedute.
- Un salvataggio illeggibile o con schema futuro viene conservato. Le operazioni leggono lo stato corrente prima di scrivere. Nei browser con Web Locks, le scritture della collezione sono serializzate tra schede dello stesso sito.
- Danno, carica delle armi, memoria e KO appartengono alla partita. I livelli dei singoli modelli stabiliscono HP, motori e armi all'avvio del duello.

## Verifiche

Build e preflight riusciti, con 93 test. I cinque test della collezione coprono l'inizializzazione con progressi R12 esistenti, l'upgrade con identità stabile, il recupero di una formazione valida, la tutela del salvataggio in caso di errore e la proprietà dopo un KO.
