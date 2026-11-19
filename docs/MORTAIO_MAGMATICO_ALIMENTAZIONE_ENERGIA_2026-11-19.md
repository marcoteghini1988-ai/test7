# Eclissi Stellare — Mortaio Magmatico ed Energia Fuoco

**Decisione del 19 novembre 2026 · Progettazione confermata nei principi.** La regola generale della pila Energia è stata implementata, mentre il Mortaio è una bozza **non ancora giocabile**: mancano i suoi danni, la durata in combattimento, la priorità automatica e i test relativi.

## Identità
- **Carta:** Mortaio Magmatico (`weapon100-plasma-04`), elemento **Fuoco**, rarità **Rara**.
- **Tipologia:** Carta Arma, uno dei due slot Arma temporanea; non è una Carta Attacco.
- **Durata prevista:** tre propri turni, compreso quello di schieramento.
- **Aspetto meccanico:** un grande mortaio con camera incandescente e condotto di alimentazione dal reattore della madre.

## Ciclo di fuoco
1. Il Mortaio spara **un colpo autonomo base** nel turno in cui è giocato e **uno in ciascuno dei due turni propri successivi**, se rimane funzionante.
2. La sua alimentazione usa **ESCLUSIVAMENTE Carte Energia Fuoco**. Energia Ghiaccio, Fulmine e tutte le altre rimangono nella pila e non sono consumate dal Mortaio.
3. Ogni Energia Fuoco **già presente nella pila** quando si installa o si mantiene il Mortaio viene assorbita automaticamente: **una carta consumata = un colpo autonomo aggiuntivo**.
4. Anche una nuova Energia Fuoco giocata **dopo l'installazione** e durante uno dei tre turni di vita del Mortaio viene consumata subito per generare un altro colpo.
5. Le Energie Fuoco assorbite sono **sottratte alle Energie disponibili per la nave madre**; non possono quindi alimentare contemporaneamente il suo Attacco/Effetto Speciale.
6. Il Mortaio non cancella la pila: vengono rimossi **solo** gli elementi Fuoco consumati, lasciando le altre Energie e tutte le non consumate.
7. A fine terzo turno proprio l'Arma si scarta e libera il suo slot.

## Pila Energia unica e SENZA LIMITE
- Ogni giocatore dispone di **un solo slot-pila** per tutte le Carte Energia, senza capienza massima (5, 10 o più Energie possono permanere se accumulate legittimamente).
- Le Carte Energia fisiche **non** passano agli scarti quando vengono giocate. Si **accumulano nello slot**, compresi i turni successivi.
- **Solo quando un effetto le consuma**, le relative carte passano agli scarti, una sola volta. Le cariche generate da passive senza una vera Carta Energia sono virtuali e non creano copie fisiche negli scarti.
- I costi delle abilità speciali rimangono i loro valori indipendenti, **da 1 a 4**, ma questi **non** sono un limite alla pila.
- Rimane il limite generale di **tre carte giocate per turno**. Anche l'attuale limite di copie di una singola carta nel mazzo è un concetto separato dal limite di accumulo.
- Lo stato di gioco usa `side.energyPile` per le Carte Energia fisiche e `side.elementalCharges` per i conteggi, inclusi quelli prodotti dalle passive. Interfaccia visiva della pila completa da rifinire in Work senza creare più slot.

## Esempio
- **Primo turno:** il Mortaio entra senza alcuna Energia Fuoco, un colpo base.
- **Secondo turno:** viene pescata e giocata una Energia Fuoco, il Mortaio spara il colpo base + uno extra e l'Energia va negli scarti.
- **Terzo turno:** sono presenti tre Energie Fuoco: un colpo base + tre extra, tutti con danno proprio; le tre carte consumate passano negli scarti, il Mortaio termina.
- **Energie non Fuoco:** anche se ne sono accumulate dieci nella stessa pila, il Mortaio le ignora.

## Da decidere e implementare
- **HP del colpo base e di ogni colpo energetico**, bersagli e combinazioni con altri danni, modificatori elementali, difese e limiti della madre.
- **Compatibilità con la nuova rarità delle Carte Energia:** una Carta Fuoco Comune contiene 1 carica, Rara 2, Epica 3 e Leggendaria 4. Prima di implementare bisogna confermare se il Mortaio genera i colpi aggiuntivi **per carta fisica** o **per carica consumata**. La scelta NON è ancora fissata, a differenza della limitazione confermata a **solo Fuoco**.
- **Ordine delle azioni e consumo automatico** quando le Energie Fuoco vengono giocate prima o dopo l'Arma nello stesso turno; garantire priorità senza duplice consumo con la Speciale madre.
- Gestione delle Energie Fuoco in presenza di pile grandi. Non imporre un limite alla pila; l'eventuale tetto di danni dell'Arma deve essere una regola **distinta**, da discutere.
- **Il Mortaio non è ancora stato implementato**: la regola Energia in pila senza tetto sì, la regola consumi automatici del Mortaio verrà introdotta solo dopo la definizione degli HP.

[Regola generale della pila Energia](./PILA_ENERGIA_ILLIMITATA_2026-11-19.md).


## Aggiornamento successivo — rarità dell'Energia e Terreni

Le Carte Energia sono ora giocabili in 4 rarità e si accumulano in un'unica pila **senza limite**. Le versioni pluricarica restano fisicamente in pila finché non spendono l'ultima carica. Un Terreno offensivo o equilibrato **Fuoco** potenzierà anche i colpi reali del Mortaio Magmatico secondo le percentuali previste (+10–16% o +5–8%); il Terreno solo difensivo non aumenta i danni. La nuova rarità non determina automaticamente un tetto alle munizioni del Mortaio.

Consultare [Energia e bonus Terreno](./ENERGIA_RARITA_E_BONUS_ARMI_TERRENO_2026-11-19.md). Il Mortaio resta **progettato ma non inserito nel motore di battaglia**.
