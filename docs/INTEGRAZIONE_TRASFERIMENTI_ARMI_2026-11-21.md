# Integrazione Carte Arma confermate — 21 novembre 2026

Il recupero delle decisioni precedenti ha ripristinato senza duplicazioni due trasferimenti da Ghiaccio:
- **Sputacristalli di Sirio → Terra:** Comune, 10 HP nominali, congela un alloggiamento Arma avversario per un suo turno se il colpo infligge HP. Arma installata non spara e slot vuoto non permette installazione, l'altro slot resta disponibile. Modalità HP, timer del blocco espresso in ply. Se è presente una macchina nemica si privilegia il suo slot, altrimenti primo libero; è supportata una scelta esplicita con `weaponFreezeSlot`. Nessun artwork aggiunto.
- **Cicloreattore Grandinifero → Vento:** registrata la meccanica nota (tre turni, tutti i bersagli, congelamento temporaneo mano con timer attivo) ma mantenuta **non giocabile**. I valori 6/12/18 HP e 2/4/6 secondi sono proposte da ribilanciare e non indicano ancora se il danno sia per singolo bersaglio.

**Perforatore a Cascata:** corretta la registrazione a **3 turni propri**, durata deliberata il 20 novembre. Il valore 35 HP resta riferimento non deliberato: mancano costo Energia per trasferimento e danno definitivo, quindi la carta resta bloccata.

Le altre 47 armi precedentemente giocabili e 20 progetti incompleti non sono rinominati né sovrascritti. Nessun prezzo, distribuzione in inventario, asset di prova o modifica grafica viene aggiunto.
Test di regressione: `src/fleetNextConfirmedTransfers.test.js`.
