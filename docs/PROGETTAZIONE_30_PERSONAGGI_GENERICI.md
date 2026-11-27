# Eclissi Stellare — 30 Personaggi generici

**Revisione 27/11/2026 — registro progettuale, non implementazione.** 14 confermati, 16 proposte da verificare (6 generici da 15 a 20, 10 specialisti delle Armi da 21 a 30). Distribuzione corrente, non vincolo approvato: Comune: 6; Rara: 10; Epica: 8; Leggendaria: 6. Tutti neutri e senza evoluzioni; Boss ed esclusivi separati. Fonte strutturata: [REGISTRO_30_PERSONAGGI_GENERICI.json](REGISTRO_30_PERSONAGGI_GENERICI.json).

## Regole approvate

- Tutti i Personaggi neutri, nessuna affinità o debolezza elementale; la specializzazione Arma non è un elemento.
- Quattro rarità fisse; nessuna evoluzione. Comune 1 abilità, Rara 1–2, Epica 2, Leggendaria 3; sono ammesse eccezioni esplicitamente approvate per abilità singole molto potenti (n.11 e n.13). Le sinergie contano come abilità.
- Più Personaggi nel mazzo, uno solo attivo contemporaneamente; sostituzione volontaria prima della scadenza, con perdita degli effetti non ancora risolti e passaggio agli scarti.
- Sostituzione occupa una delle tre giocate; permanenti fino a sostituzione/rimozione, temporanei a scadenza, istantanei dopo effetto. Plancia esaurita disattiva lo slot.
- 30 generici: 20 strategici e 10 specializzati Arma. Personaggi esclusivi e Boss sono fuori da questo lotto.
- Effetti d'ingresso, passivi e istantanei attivi alla giocata valida, durante il timer dei 30 secondi; i trigger periodici e le reazioni conservano la loro fase. Consultare REGOLE_PERMANENTI_EFFETTI_CARTE.md per l'ordine ESEGUI e le combo.
- Un Personaggio con più abilità può combinare abilità già confermate e nuove coerenti; possono funzionare tutte nello stesso turno rispettando costi e limiti propri, senza un limite comune salvo regola specifica approvata.

## Criteri e punti aperti

- Le 16 schede rimanenti sono bozze; rarità, durate, meccaniche e valori da verificare. Le quantità per rarità non costituiscono una quota approvata.
- Tempo e HP da bilanciare dopo definizione. Niente recupero HP oltre maxHp o resurrezione salvo esplicita futura decisione. Nessun aumento del limite di tre carte giocate; istantanei e sostituzioni consumano una giocata.
- Nei temporanei i turni contano dal turno proprio di schieramento, incluse le finestre avversarie conseguenti; durata esatta delle azioni istantanee e trigger da verificare.
- Le cariche virtuali non creano carte fisiche Energia per la Speciale della madre; specificare fisicità, costo, cap e visual feedback nel bilanciamento.
- Blocchi, consumi, sostituzioni, scarti e bonus vanno collegati agli eventi reali e testati su entrambi i lati.

Il criterio professionale richiede un meccanismo concreto della flotta, non un semplice bonus o una Strategia travestita. I 14 confermati non vengono cambiati per imporre artificialmente nuove abilità; le schede 15–30 sono bozze, non approvazioni. Le idee di resurrezione dei supporti, trasferimento HP madre/supporto, scambio delle Armi fra slot, riciclo delle Armi e semplice bonus di tiro non sono state approvate come Personaggi.

## Schede

### 1. Medico da campo — Comune

Durata: 3 turni propri. Stato: confermato; non ancora implementato.

- Alla fine di ogni proprio turno cura automaticamente la navicella alleata viva con percentuale di HP più bassa, madre o supporto. Non rianima navi distrutte.

### 2. Ingegnere dei sistemi — Comune

Durata: istantanea. Stato: confermato; non ancora implementato.

- Ripristina una quantità di secondi del timer di un componente alleato scelto (Centralina, Arsenale o Plancia), anche già esaurito. Dopo l'effetto va negli scarti.

Da definire/verificare: Quantità di secondi e limite del timer. Conflitto con slot Personaggio disattivato quando è esaurita la Plancia: valutare eccezione istantanea senza installazione, non ancora approvata.

### 3. Tecnico del sacrificio — Rara

Durata: istantanea. Stato: confermato; non ancora implementato.

- Distrugge volontariamente un proprio componente ancora funzionante e trasferisce tutto il suo tempo residuo a un altro componente proprio scelto, anche esaurito. Va negli scarti.

Da definire/verificare: Trasferimento integrale oltre durata iniziale: non imporre un tetto che annulli parte del tempo senza decisione. Se sacrifica la Plancia, risoluzione atomica proposta prima della disattivazione dello slot; giocabilità con Plancia già esaurita da chiarire.

### 4. Operatrice degli scudi — Comune

Durata: 2 turni propri. Stato: confermato; non ancora implementato.

- Prolunga di un turno la prima Difesa temporanea giocata durante la permanenza; non aggiunge cariche o attivazioni.

### 5. Archivista — Comune

Durata: istantanea. Stato: confermato; non ancora implementato.

- Recupera una Carta Strategia scelta dai propri scarti nella mano; non la gioca gratuitamente.

### 6. Tecnico di recupero — Comune

Durata: istantanea. Stato: confermato; non ancora implementato.

- Recupera i materiali di un proprio supporto già distrutto e ripristina tempo a un componente scelto della madre. Ogni relitto è sfruttabile una sola volta. Senza relitti utilizzabili la carta va negli scarti senza effetto.

Da definire/verificare: Quantità di tempo da ripristinare e identificazione univoca dei relitti.

### 7. Capomeccanico — Comune

Durata: 3 turni propri. Stato: confermato; non ancora implementato.

- Alla fine di ogni turno proprio ripara il componente della madre con meno tempo residuo, senza superare il suo tempo iniziale.

Da definire/verificare: Quantità e gestione dei pari merito; chiarire se può intervenire su componenti esauriti.

### 8. Ingegnere energetico — Rara

Durata: 3 turni propri. Stato: confermato; non ancora implementato.

- Dimezza l'Energia richiesta dagli attacchi speciali della madre, arrotondando per eccesso: da 2 a 1 e da 4 a 2. Non modifica potenza o ricarica.

Da definire/verificare: Verificare interazioni con altri modificatori del costo e soglie.

### 9. Ufficiale del reattore — Rara

Durata: 3 turni propri. Stato: confermato; non ancora implementato.

- Una volta per turno proprio rigenera una carica Energia del tipo appena utilizzato: la carta Energia resta nel suo slot e la carica torna disponibile, non viene pescata dagli scarti.

Da definire/verificare: Gestire esaurimento dell'ultima carica e momento di rigenerazione prima dell'eventuale rimozione della carta; nessuna carta fisica aggiuntiva.

### 10. Coordinatore dei supporti — Rara

Durata: 3 turni propri. Stato: confermato; non ancora implementato.

- Finché entrambi i supporti alleati sono vivi, aumenta l'efficacia numerica delle rispettive abilità passive. Il bonus termina appena uno dei due è distrutto.

Da definire/verificare: +25% relativo è l'esempio concordato, valore definitivo da bilanciare; passive non numeriche, fusioni e arrotondamenti da definire.

### 11. Stratega di flotta — Leggendaria

Durata: 2 turni propri. Stato: confermato; non ancora implementato.

- Alla giocata porta automaticamente in cima al mazzo fino a cinque carte preselezionate durante la creazione del mazzo, nell'ordine di priorità impostato. Può preselezionare più di cinque; salta quelle non più nel mazzo. La carta non pesca. Alla scadenza dopo la seconda pesca ordinaria o all'uscita anticipata, rimescola nel mazzo le selezionate non ancora pescate. Quelle già pescate restano in mano. Nessuna finestra in battaglia o sospensione del timer.

Da definire/verificare: Eccezione esplicitamente approvata: una sola abilità Leggendaria. Gestione duplicati, selezione persistente nel deck builder e rimescolamento da implementare e collaudare. La Strategia di pesca successiva nello stesso turno deve usare immediatamente il nuovo ordine.

### 12. Tecnico di conversione energetica — Rara

Durata: 3 turni propri. Stato: confermato; non ancora implementato.

- Una volta per turno proprio sacrifica una Carta Energia fisica installata, inviandola negli scarti, e converte una carica di un'altra Energia rimasta nell'elemento richiesto. Esempio approvato: da due Fuoco e due Ghiaccio, sacrifica un Ghiaccio e converte l'altro Ghiaccio in Fuoco; rimangono tre Fuoco.

Da definire/verificare: La conversione è verso l'elemento richiesto, non quello sacrificato. Definire persistenza e rappresentazione per carte con più cariche; quantità/costo fisico da preservare.

### 13. Ingegnere di ricostruzione — Epica

Durata: 3 turni propri. Stato: confermato; non ancora implementato.

- Allo schieramento sceglie un componente della madre, anche distrutto. A ogni proprio turno sacrifica una carta casuale del mazzo, mandandola negli scarti, e avanza la ricostruzione: 33%, 66%, 100% del tempo massimo dopo tre sacrifici. Se viene rimosso prima, conserva solo la riparazione già ottenuta. Senza una carta da sacrificare non avanza.

Da definire/verificare: Eccezione esplicitamente approvata: una sola abilità Epica. Definire arrotondamenti, progressione se il componente è già parzialmente operativo, consumo del tempo fra i passaggi e selezione casuale deterministica nel motore.

### 14. Maestro dell'energia — Leggendaria

Durata: 3 turni propri. Stato: confermato; non ancora implementato.

- Dimezza l'Energia richiesta dagli attacchi speciali della madre, arrotondando per eccesso: da 2 a 1 e da 4 a 2. Non modifica potenza o ricarica.
- Una volta per turno proprio rigenera una carica Energia del tipo appena utilizzato: la carta Energia resta nel suo slot e la carica torna disponibile, non viene pescata dagli scarti.
- Una volta per turno proprio sacrifica una Carta Energia fisica installata, inviandola negli scarti, e converte una carica di un'altra Energia rimasta nell'elemento richiesto. Esempio approvato: da due Fuoco e due Ghiaccio, sacrifica un Ghiaccio e converte l'altro Ghiaccio in Fuoco; rimangono tre Fuoco.

Da definire/verificare: Tutte e tre le abilità possono operare nello stesso turno, ciascuna secondo i propri limiti e costi; nessun limite comune di un intervento per turno. Preservare le schede singole 8, 9 e 12. Verificare le interazioni fra le tre abilità, le cariche effettive, il costo speciale della madre e la persistenza delle conversioni.

### 15. Tecnica delle contromisure — Epica

Durata: 3 turni propri. Stato: proposta da verificare; non ancora implementato.

- Può sacrificare una Carta Energia installata per rimuovere uno stato persistente negativo già applicato a una propria nave viva (es. bruciatura o corrosione).
- Può sacrificare una Carta Energia installata per eliminare un blocco temporaneo già applicato a uno slot Arma; non ripara l'Arsenale. Un solo intervento complessivo per turno.

Da definire/verificare: Definire stati eleggibili, eventuali vincoli elementali e costi. Non blocca preventivamente un attacco.

### 16. Tecnico delle interfacce — Rara

Durata: 3 turni propri. Stato: proposta da verificare; non ancora implementato.

- Una volta durante lo schieramento può sacrificare una Carta Energia installata per riattivare l'abilità passiva di un supporto vivo sospesa da un effetto nemico, senza rianimarlo o riparare la Centralina.

Da definire/verificare: Verificare che la sospensione dell'abilità passiva esista e non sia irreversibile per regola.

### 17. Specialista di disinnesco — Rara

Durata: 2 turni propri. Stato: proposta da verificare; non ancora implementato.

- Può sacrificare una propria Trappola coperta ancora attiva per analizzare i suoi circuiti e neutralizzare una Trappola avversaria scelta senza subirne il normale effetto; entrambe vanno negli scarti. Una volta per schieramento.

Da definire/verificare: Controllare effetti speciali delle Trappole, informazione privata e bilanciamento dello scambio. Da rivedere se troppo simile a una Strategia.

### 18. Capo della manutenzione preventiva — Epica

Durata: 3 turni propri. Stato: proposta da verificare; non ancora implementato.

- Una volta durante lo schieramento può disattivare volontariamente un proprio slot Arma libero fino al termine del proprio turno successivo per preservare una quantità di tempo del timer dell'Arsenale.
- Una volta durante lo schieramento può rinunciare a una Speciale della madre già disponibile, avviandone il normale raffreddamento senza sparo, per ripristinare una quota di tempo del Generatore.

Da definire/verificare: I due costi devono essere reali, non aggirabili; fattibilità e tempi da verificare con il motore.

### 19. Medico di terapia intensiva — Epica

Durata: 3 turni propri. Stato: proposta da verificare; non ancora implementato.

- Sceglie una nave alleata viva; può sacrificare un'intera Carta Energia installata per effettuare una cura importante una volta per turno.
- Se la nave assistita subisce un effetto persistente che riduce le cure, può dedicare la cura di quel turno alla rimozione di tale effetto anziché recuperare HP.

Da definire/verificare: Quantità cura, natura del trattamento e costo da bilanciare; nessuna rianimazione.

### 20. Ingegnere della rete di bordo — Leggendaria

Durata: 3 turni propri. Stato: proposta da verificare; non ancora implementato.

- Una volta per schieramento può isolare un componente della madre ancora funzionante da un sabotaggio temporale già in corso, rinunciando a una quota del suo tempo residuo.
- Una volta per schieramento può sacrificare una Carta Energia fisica installata per rimuovere un blocco temporaneo già applicato a un altro componente operativo.
- Una volta per schieramento può interrompere volontariamente il proprio Personaggio dopo avere pagato un'ulteriore Carta Energia per ripristinare una quota di tempo a un componente scelto; nessun ritorno del Personaggio in mano.

Da definire/verificare: Tre funzioni da rivedere insieme per evitare sovrapposizioni con Ingegnere dei sistemi e Tecnico del sacrificio; valori e interazioni da bilanciare.

### 21. Artificiere di bordo — Rara

Durata: permanente. Stato: proposta da verificare; non ancora implementato.

- Riduce il danno da bruciature subite dalla flotta alleata.
- Attiva il bonus già previsto della Torretta di Puntamento Piroclastico (+35% nel profilo attuale, valori soggetti a bilanciamento).

Da definire/verificare: Riesaminare la sinergia con le Armi effettivamente confermate e il criterio professionale; nessuna approvazione nuova.

### 22. Criotecnica — Rara

Durata: 3 turni propri. Stato: proposta da verificare; non ancora implementato.

- Rimuove una volta un congelamento già applicato alla propria mano.
- Attiva una sinergia di congelamento con due Armi Ghiaccio compatibili; l'esatto congelamento e le due famiglie vanno riconciliati con le decisioni precedenti, non modificati alla cieca.

Da definire/verificare: Collegare le due famiglie Ghiaccio dopo verifica del registro e approvazione della sinergia. Riesaminare la sinergia con le Armi effettivamente confermate e il criterio professionale; nessuna approvazione nuova.

### 23. Specialista idrostatica — Rara

Durata: 3 turni propri. Stato: proposta da verificare; non ancora implementato.

- Riduce i danni ad area ai supporti alleati reali.
- Abilita i bersagli aggiuntivi già progettati della Torretta Crioguidata e del Disgregatore di Pressione Isobarica; nessuna sostituzione delle meccaniche deliberate.

Da definire/verificare: Isobarica: caso entrambi i bersagli distrutti; bersaglio aggiuntivo rispetto alla protezione. Riesaminare la sinergia con le Armi effettivamente confermate e il criterio professionale; nessuna approvazione nuova.

### 24. Elettrotecnico — Epica

Durata: permanente. Stato: proposta da verificare; non ancora implementato.

- Recupera una carica virtuale Fulmine dopo una Speciale della madre effettivamente risolta, una sola volta per schieramento.
- Attiva la Lancia del Comando Ionico con il bonus già previsto.

Da definire/verificare: Riesaminare la sinergia con le Armi effettivamente confermate e il criterio professionale; nessuna approvazione nuova.

### 25. Comandante d’Acciaio — Epica

Durata: permanente. Stato: proposta da verificare; non ancora implementato.

- Rimuove una volta il congelamento di un proprio slot Arma, senza riattivare Arsenale esaurito.
- Attiva i potenziamenti dell'Impattatore del Comandante d'Acciaio alle soglie di HP già previste.

Da definire/verificare: Riesaminare la sinergia con le Armi effettivamente confermate e il criterio professionale; nessuna approvazione nuova.

### 26. Sismologo — Epica

Durata: 3 turni propri. Stato: proposta da verificare; non ancora implementato.

- Neutralizza una volta una disattivazione di un proprio supporto operativo causata da una carta; non annulla la scadenza della Centralina.
- Le due future Armi Terra compatibili recuperano una carica Terra virtuale quando distruggono un supporto nemico, massimo una volta per turno proprio.

Da definire/verificare: Riesaminare la sinergia con le Armi effettivamente confermate e il criterio professionale; nessuna approvazione nuova.

### 27. Pilota delle correnti — Epica

Durata: 3 turni propri. Stato: proposta da verificare; non ancora implementato.

- Ripristina una volta un'abilità passiva sospesa di un supporto ancora operativo; non resuscita supporti o ripara Centralina.
- Le due future Armi Vento compatibili ricevono un bonus di danno quando cambiano bersaglio fra colpi consecutivi, massimo una volta per turno; rispettano la protezione.

Da definire/verificare: Riesaminare la sinergia con le Armi effettivamente confermate e il criterio professionale; nessuna approvazione nuova.

### 28. Maestra dei fotoni — Leggendaria

Durata: 3 turni propri. Stato: proposta da verificare; non ancora implementato.

- Neutralizza una volta un occultamento avversario; non rivela Trappole non coinvolte.
- La futura Arma Luce A può deviare un colpo bloccato verso un altro bersaglio valido, una sola deviazione per attivazione, con Difese normali.
- La futura Arma Luce B genera una protezione alleata quando colpisce realmente; durata, bersaglio e valore da bilanciare.

Da definire/verificare: Riesaminare la sinergia con le Armi effettivamente confermate e il criterio professionale; nessuna approvazione nuova.

### 29. Signore delle ombre — Leggendaria

Durata: permanente. Stato: proposta da verificare; non ancora implementato.

- Impedisce una sola volta per schieramento il recupero di una Carta dagli scarti nemici: la carta resta negli scarti.
- La futura Arma Ombra A accumula una quota del danno nominale dei propri colpi bloccati per un successivo colpo, senza doppio conteggio.
- La futura Arma Ombra B converte una quota del danno effettivamente inflitto in cura alleata.

Da definire/verificare: Riesaminare la sinergia con le Armi effettivamente confermate e il criterio professionale; nessuna approvazione nuova.

### 30. Architetto gravitazionale — Leggendaria

Durata: 3 turni propri. Stato: proposta da verificare; non ancora implementato.

- Sospende per un turno proprio, una sola volta, il consumo temporale ordinario di un proprio componente scelto; non sospende il timer del turno.
- La futura Arma Gravità A riceve un bonus collegato agli HP massimi del bersaglio, con limite da bilanciare.
- La futura Arma Gravità B può consumare Energia Gravità per aumentare il colpo finale.

Da definire/verificare: Riesaminare la sinergia con le Armi effettivamente confermate e il criterio professionale; nessuna approvazione nuova.

## Blocchi prima dell'integrazione

- Motore corrente rifiuta un secondo Personaggio con uno già attivo: implementare la sostituzione approvata, senza rompere le 12 esclusive.
- Riparazione della Plancia quando lo slot è già disattivato: serve decisione sull'eccezione per gli istantanei, prima dell'integrazione.
- Le 16 rimanenti schede sono proposte; le famiglie Arma da associare agli specialisti vanno riconciliate con il catalogo corrente.
- I valori di bilanciamento non sono ancora definitivi; nessun asset o effetto approvato viene sostituito.
- Implementazione della fase di attivazione immediata e della coda ESEGUI, configurazione Stratega e test non ancora realizzati.

## Note storiche del documento precedente (da rileggere alla luce della revisione)

## Boss: profilo di scontro e profilo sbloccabile

- Personaggio Boss fisso per tutto lo scontro, non sostituibile.
- Abilità uniche, boost aggiuntivi e regole speciali come restrizioni su determinate carte, definite per singolo Boss.
- Personaggio utilizzabile nel normale slot dopo sblocco, con effetti leggermente adattati e bilanciati; durata e abilità della carta sbloccata specifiche.
- Non trasferire automaticamente i vantaggi e le restrizioni dell'intero scontro Boss alla carta del giocatore.

## Blocchi prima dell'integrazione

- Motore corrente rifiuta un secondo Personaggio con uno già attivo: implementare la sostituzione approvata, senza rompere le 12 esclusive.
- Riparazione della Plancia quando lo slot è già disattivato: serve decisione sull'eccezione per gli istantanei, prima dell'integrazione.
- Le 27 nuove schede sono proposte di progettazione, non approvate singolarmente. Le dieci future famiglie Arma non sono ancora progettate né attive.
- I valori di bilanciamento non sono ancora definitivi; nessun asset o effetto approvato viene sostituito.

Prima di creare immagini o effetti leggere le procedure ufficiali. Personaggi: pannello categoria magenta, rarità fissa, nessun simbolo elementale inventato. Definire il simbolo neutro/assenza del simbolo in fase grafica; ottenere approvazione delle immagini e collaudare VFX, SFX, aptica. Non modificare le Carte Arma esistenti per legami non approvati.

