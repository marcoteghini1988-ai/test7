# Eclissi Stellare — PASSO 1: supporti autonomi (18 novembre 2026)

Repository ufficiale: \`marcoteghini1988-ai/test7\`, branch \`main\`.

## Completato nel primo intervento
- Registro autonomo per **34 supporti distinti**, originati dai 17 modelli (due ciascuno), con ID stabili \`support-n00-01\` ecc. Il modello di origine NON limita le combinazioni.
- Ogni supporto ha nome, ruolo, asset già esistente, traccia della famiglia originaria e predisposizione per le tre famiglie con Fusione \`L01\`, \`L03\`, \`L04\`. Non genera attacchi normali né una propria affinità elementale.
- Inventario separato persistente (\`eclissi_support_collection_v1\`) con **copie fisiche distinte**, senza assegnazione gratuita di supporti e senza toccare i salvataggi della nave madre o delle carte.
- Due slot di formazione con sblocco **permanente e progressivo attraverso traguardi della campagna**; non dipendono dal livello di una madre o di un supporto. Lo stesso modello può essere schierato due volte solo possedendo due copie.
- Catalogo collegato anche al costruttore storico delle scudiere come fonte per identità e immagini. Il combattimento esistente NON cambia in questo passo, per evitare regressioni.
- Test: \`src/fleetNextIndependentSupports.test.js\`.

## Ancora da fare, nell'ordine
1. Fissare/collegare i due traguardi concreti a vittorie di campagna e integrare in modo atomico l'equipaggiamento dei supporti nella plancia ufficiale. All'avvio senza traguardi si schiera soltanto la madre; dopo i traguardi uno/due supporti scelti, anche uguali.
2. Separare livello, HP, costi di acquisto e miglioramenti di ogni copia dal livello e dai potenziamenti della madre. Non assegnare prezzi/HP definitivi prima del bilanciamento.
3. Assegnare ed eseguire le **15 abilità condivise** dei supporti, anche duplicate tra modelli: niente spari ordinari autonomi. Ricontrollare i limiti delle abilità reattive e del Sacrificio.
4. Trasferire le Carte Fusione dalla madre ai supporti compatibili; mantenere **10 esclusive uniche per ciascuna delle 17 madri** sostituendo le tre carte trasferite. Non attivare fusioni sulle altre 14 famiglie.
5. Testare impatti su mazzo 40, carte Energia, Terreni, Personaggi/Trappole, supporti e scontri, lasciando intatta l'arena metallica 3D 9:16, mano da 7 e PvP simulato.

**Nota di stato:** i moduli autonomi sono reali e testabili, ma lo schieramento ufficiale non legge ancora il nuovo inventario: la migrazione del motore e della UI avverrà nel prossimo passo. Nessuna carta/immagine definitiva generata. Nessun catalogo ritirato ripristinato.
