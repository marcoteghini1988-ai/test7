**AGGIORNAMENTO 8/11/2026 — TERRENI PvP:** nel ramo ufficiale `main` sono stati aggiunti quattro tipi di Carte Terreno (Detriti, Plasma, Ionica, Risonanza), effetti simmetrici di due cicli, modifica visuale con SVG separati, priorità simultanea, filtro senza nuove copie possedute nelle modalità non-PvP e test dedicati. Nessuna Carta Terreno è concessa gratuitamente o inclusa nei pacchetti; sono ancora da decidere gli sblocchi. Mancano verifica completa CI, playtest su smartphone e PNG ambientali definitivi. Fonte più recente: [`CARTE_TERRENO_PVP_INTEGRAZIONE_2026-11-08.md`](./CARTE_TERRENO_PVP_INTEGRAZIONE_2026-11-08.md). Le sezioni storiche sotto che dicono che i Terreni sono da implementare sono superate solo per la prima fase PvP.

# Eclissi Stellare — Mazzo speciale unificato: Oggetti Epici, Personaggi, Terreni

> **Stato aggiornato — 7 novembre 2026:** la sola interfaccia di gioco è la plancia 3D in `src/MathDuelBattle.jsx`; le cinque carte speciali e i due mazzi sono stati portati sulla plancia, senza cambiare navi, armi o arena originale. Le schermate `TacticalDuelPrototype.jsx/.css` e l'accesso `?tacticalPreview=1` sono stati rimossi; i motori tattici non ancora integrati restano conservati come codice da migrare. Le sezioni storiche sotto descrivono test precedenti, NON una seconda modalità disponibile.

**Data:** 7 novembre 2026 · Repository unico `marcoteghini1988-ai/test7` · `main`

## Decisioni dell'utente (vincolanti)

- La battaglia approvata resta: preparazione segreta e simultanea **30 s** per A e B, risoluzione **8 s**; armi native alla barriera, numeriche/Poker ai vitali, speciali alla strategia.
- Il giocatore prepara **un mazzo speciale da 24 carte** con **5 in mano**, unito nella stessa collezione e nello stesso costruttore (NON si creano tre mazzi separati di oggetti, personaggi e terreni). Massimo 2 speciali per una preparazione nella sandbox attuale.
- I **personaggi collezionabili** diventano **carte speciali temporanee**, NON bonus fissi per tutta la battaglia. **Un solo personaggio attivo** per volta; durata in cicli ed effetti secondo l'identità della carta. Vale anche per le **carte personaggio dei boss sbloccate sconfiggendo il relativo boss**. L'avversario boss conserva invece identità/passive speciali; la carta ottenuta dal giocatore sarà bilanciata separatamente.
- Le **carte Terreno** appartengono al mazzo speciale e sono **attivabili nel PvP**, modificando per un tempo limitato **ambiente/sfondo grafico e regole di gioco**, con benefici e penalità espliciti. Non rendono le 17 navicelle tutte uguali.
- Nei **combattimenti di campagna contro i boss**, l'arena del boss è **FISSA, esclusiva e non sovrascrivibile** per l'intera partita. Le carte Terreno del giocatore NON possono essere attivate (anche se nel mazzo preconfigurato). Al momento della preparazione dei mazzi boss, devono essere filtrate dalla pesca e sostituite con altre carte possedute compatibili, senza regalare copie.
- Anche gli **Oggetti Epici ottenuti fondendo reliquie** diventano **carte speciali temporanee**; NON passivi incondizionati.

## Progressione originale delle reliquie, verificata nel codice

Le 12 vittorie boss assegnano una reliquia ciascuna (`relic_p*`). Sei coppie generano altrettanti Oggetti Epici; conservare ID, associazioni e salvataggi di `src/newCombat/phase16ACatalog.js`:

| Coppia di boss | Reliquie | ID originale | Carta Epica |
|---|---|---|---|
| Terra + Marte | relic_p1 + relic_p2 | epic_item_8 | Calice di Drenaggio |
| Venere + Saturno | relic_p3 + relic_p6 | epic_item_6 | Pendolo d'Entropia |
| Urano + Nettuno | relic_p7 + relic_p8 | epic_item_7 | Monolite Dielettrico |
| Plutone + Europa | relic_p9 + relic_p11 | epic_item_9 | Matrice di Probabilità |
| Proxima b + Haumea | relic_p14 + relic_p17 | epic_item_1 | Anello di Möbius |
| Io + Encelado | relic_p19 + relic_p20 | epic_item_3 | Astrolabio |

Il possesso di due reliquie rende l'oggetto **forgiabile**; soltanto un oggetto registrato come **fuso / posseduto** è equipaggiabile. La logica preesistente (`phase17HProgression.js`) mantiene le fusioni del vecchio sistema; **non attribuire né rimuovere** carte, Polvere o reliquie per il solo fatto di entrare nella sandbox.

## Nuovo comportamento Epico nella sandbox (valori sperimentali)

Nella sandbox di prova le 6 carte sono implementate in `src/tacticalEpicCards.js` e `src/tacticalEpicRuntime.js`, collegate a `src/simultaneousDuelEngine.js`:

1. **Calice di Drenaggio (2 cicli)**: converte danni reali del combattimento in una piccola Sincronia. Visualizza il calcolo storico della Polvere come **anteprima non spendibile**, senza modificarne saldo o accreditarla in PvP.
2. **Pendolo d'Entropia (2 cicli)**: se subisce danno mentre è attivo, rivela le prime 6 numeriche del proprio mazzo e concede **1 ricambio aggiuntivo nel ciclo successivo**, non oltre la durata dell'Epico.
3. **Monolite Dielettrico (2 cicli)**: neutralizza il surriscaldamento da Plasma per i due cicli; non ricrea HP.
4. **Matrice di Probabilità (1 ciclo)**: se i quattro vitali complessivi sono al 30% HP o meno e c'è un vero armamento pesante integrato, concede +2 danni a un colpo di precisione **con coppia/tris già valido**; non ignora la firma del bersaglio e non dà colpi automatici.
5. **Anello di Möbius (2 cicli)**: utilizzabile con vitali al 30% o meno; **dopo aver giocato la carta** rivela le 10 successive numeriche. Nel ciclo seguente si può scegliere quale anticipare nella pesca, senza creare carte.
6. **Astrolabio (2 cicli)**: rivela dopo l'uso le prossime 2 carte numeriche; nella preparazione seguente si può scegliere quale tra le due pescare per prima con una pesca reale. Non genera dadi o numeri dal nulla.

Limiti prototipali: **un solo Oggetto Epico attivo** per giocatore; **un utilizzo di ciascun oggetto per battaglia**; massimo **una copia per tipo** e **due Oggetti Epici nel mazzo da 24**. Sono parametri sperimentali da conciliare con le soglie di equipaggiamento originarie (1 Epico al livello pilota 20, 2 al livello 60), prima dell'integrazione delle collezioni ufficiali.

### Modalità anteprima

La vecchia selezione simulata degli Epici tramite `?tacticalPreview=1` è stata rimossa. I moduli tattici degli Epici rimangono da integrare nel gioco ufficiale 3D; nessun Epico viene concesso all'account entrando nel gioco. Il motore tattico rifiuta gli Epici non presenti fra gli oggetti sbloccati.

## Da completare nel motore ufficiale (non dichiarare implementato)

- Migrazione transazionale tra `phase16CEpics.js` (vecchi Epici passivi), inventari salvati e `specialDeckBuilder.js`: nessun Epico deve continuare ad applicare anche il bonus permanente mentre è una carta giocabile. Gestire i salvataggi senza cancellare reliquie, oggetti già fusi o livelli pilota.
- Collegare veri premi di campagna e limiti Polvere del Calice ad esiti **auditati**, non al client; mai premi monetizzabili da PvP finto/offline.
- Realizzare i **personaggi** e i **12 personaggi-boss ottenibili** come carte temporanee, con abilità/passive differenziate e animazioni proprie.
- Introdurre **carte Terreno nel PvP**, ambiente visivo + vantaggi/svantaggi con durata e priorità, senza modificare arene boss; filtrare le carte Terreno non giocabili dai mazzi in campagna.
- Testare acquisti, collezioni, vincoli di equipaggiamento, durata realistica, valore tattico, interfaccia 9:16 e confronto A/B prima di convertire la campagna.

**Stato corretto:** 6 carte Epiche temporanee in sandbox e test; i Personaggi e i Terreni sono decisioni confermate ma non ancora implementati nel nuovo motore; la campagna ufficiale mantiene per ora i moduli legacy.
