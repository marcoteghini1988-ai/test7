# Eclissi Stellare — dismissione dei vecchi mazzi nel gioco ufficiale

**Data:** 17 novembre 2026. Repository: marcoteghini1988-ai/test7, ramo main.

## Eseguito
- La battaglia ufficiale non legge più inventory.deck né il mazzo provvisorio di 40 carte.
- Ogni madre riceve automaticamente le sue esclusive sbloccate dal livello; i Personaggi generici e Boss posseduti sono inclusi una sola volta ciascuno.
- L'inventario passa allo schema 4 con deck vuoto. Un Personaggio comune (gen-216) assicura la settima carta ad Aurora livello 1.
- I mazzi salvati precedentemente restano in retiredDeck e non possono più essere equipaggiati. Crediti e Boss ottenuti vengono preservati.
- L'interfaccia espone Esclusive, Personaggi, Boss senza acquisti carte singole, pacchetti, mazzi pronti o editor.
- Le funzioni legacy di acquisto ed equipaggiamento restituiscono un rifiuto senza spendere crediti.

## Invariati
Le 120 carte esclusive, le loro meccaniche, gli effetti dell'Arca Astrale, Personaggi, 12 Boss, progressione navi, arena metallica 3D, immagini e PvP simulato.

## Compatibilità
Per non compromettere i test storici, STARTER_DECK, il catalogo provvisorio e alcune API di migrazione restano definiti nei moduli di compatibilità. Non sono collegati all'ingresso della battaglia ufficiale. Una cancellazione fisica completa richiede aggiornare prima tutti i test che ne dipendono.
