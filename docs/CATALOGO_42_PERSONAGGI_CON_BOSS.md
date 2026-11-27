# Eclissi Stellare — catalogo completo 42 Personaggi

**Revisione 27/11/2026: 30 generici (14 confermati, 16 proposte) + 12 Boss.** Esclusivi delle macchine separati. Tutti i generici neutri, senza evoluzioni. Le nuove abilità e la rarità Leggendaria dei 12 Boss sbloccabili restano proposte; il codice conserva la rarità tecnica Boss. Nessuna nuova abilità è implementata da questo documento. Distribuzione generici corrente, non quota approvata: Comune: 6; Rara: 10; Epica: 8; Leggendaria: 6.

## Regole comuni già approvate

- Tutti i Personaggi neutri, nessuna affinità o debolezza elementale; la specializzazione Arma non è un elemento.
- Quattro rarità fisse; nessuna evoluzione. Comune 1 abilità, Rara 1–2, Epica 2, Leggendaria 3; sono ammesse eccezioni esplicitamente approvate per abilità singole molto potenti (n.11 e n.13). Le sinergie contano come abilità.
- Più Personaggi nel mazzo, uno solo attivo contemporaneamente; sostituzione volontaria prima della scadenza, con perdita degli effetti non ancora risolti e passaggio agli scarti.
- Sostituzione occupa una delle tre giocate; permanenti fino a sostituzione/rimozione, temporanei a scadenza, istantanei dopo effetto. Plancia esaurita disattiva lo slot.
- 30 generici: 20 strategici e 10 specializzati Arma. Personaggi esclusivi e Boss sono fuori da questo lotto.
- Effetti d'ingresso, passivi e istantanei attivi alla giocata valida, durante il timer dei 30 secondi; i trigger periodici e le reazioni conservano la loro fase. Consultare REGOLE_PERMANENTI_EFFETTI_CARTE.md per l'ordine ESEGUI e le combo.
- Un Personaggio con più abilità può combinare abilità già confermate e nuove coerenti; possono funzionare tutte nello stesso turno rispettando costi e limiti propri, senza un limite comune salvo regola specifica approvata.

Per le decisioni aperte leggere [PROGETTAZIONE_30_PERSONAGGI_GENERICI.md](PROGETTAZIONE_30_PERSONAGGI_GENERICI.md). Gli effetti immediati, la coda ESEGUI e lo Stratega seguono [REGOLE_PERMANENTI_EFFETTI_CARTE.md](REGOLE_PERMANENTI_EFFETTI_CARTE.md).

## Personaggi generici

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

## Personaggi Boss

Identità, ID e ordine di campagna recuperati dal catalogo ufficiale. Le abilità seguenti sono nuove proposte di adattamento al sistema HP, non poteri già attivi. Durante lo scontro sono fissi e non sostituibili; una volta sbloccati mediante vittoria, occupano il normale slot Personaggio, sono sostituibili e hanno durata propria.

### 31. Guardiano di Gaia — Terra · settore 10

**Durante lo scontro (permanente):**
- Riduce i danni ordinari subiti dalla flotta; ogni turno rinnova una protezione contro il primo colpo ordinario.
- La prima Difesa schierata da Gaia non occupa una giocata aggiuntiva del giocatore: il bonus riguarda esclusivamente il Boss.

**Dopo lo sblocco (Leggendaria proposta, 3 turni):**
- Riduce i danni del primo colpo ordinario per turno avversario.
- All'ingresso protegge una navicella alleata scelta da un colpo ordinario.
- Quando perde il primo supporto, cura la madre una sola volta.

ID conservato: `boss-character-1`.

### 32. Colosso di Tharsis — Marte · settore 20

**Durante lo scontro (permanente):**
- Dopo un turno in cui ha inflitto danni, accumula un bonus crescente alla potenza delle proprie Armi, entro un limite; un turno senza danni interrompe la serie.
- Il giocatore non può schierare due nuove Difese nello stesso turno.

**Dopo lo sblocco (Leggendaria proposta, 3 turni):**
- Potenzia il primo colpo Arma di ogni turno proprio.
- Se infligge danni in due turni propri consecutivi, applica un bonus aggiuntivo limitato.
- La prima Arma che distrugge un supporto nemico riduce di un turno il raffreddamento del Generatore.

ID conservato: `boss-character-2`.

### 33. Matriarca Tossica — Venere · settore 30

**Durante lo scontro (permanente):**
- Il primo colpo Arma dannoso di ogni turno applica corrosione temporanea al bersaglio.
- Le cure del giocatore sono ridotte finché il bersaglio è corroso; un effetto di purificazione valido rimuove la corrosione.

**Dopo lo sblocco (Leggendaria proposta, 3 turni):**
- Il primo colpo dannoso applica corrosione per due turni avversari.
- Riduce le cure ricevute dal bersaglio corroso.
- La prima cura nemica ridotta dalla corrosione genera una protezione temporanea su una propria nave viva.

ID conservato: `boss-character-3`.

### 34. Crono il Distruttore — Saturno · settore 40

**Durante lo scontro (permanente):**
- Una Difesa del Boss che blocca realmente un colpo carica il prossimo attacco.
- A intervalli regolari accelera il consumo dei timer dei componenti avversari; non accelera gli HP.

**Dopo lo sblocco (Leggendaria proposta, 3 turni):**
- Dopo il primo colpo bloccato, potenzia il successivo colpo Arma.
- Una volta rallenta per un turno il consumo di un proprio componente.
- Una volta sottrae tempo a un componente avversario scelto.

ID conservato: `boss-character-6`.

### 35. Sentinella Ionica — Urano · settore 50

**Durante lo scontro (permanente):**
- Riduce la durata dei disturbi elettrici sul Boss.
- La prima Carta Energia fisica schierata dal giocatore in ciascun turno diventa disponibile solo dal proprio turno seguente; le risorse già disponibili restano utilizzabili.

**Dopo lo sblocco (Leggendaria proposta, 3 turni):**
- Riduce la durata di congelamenti e disturbi agli slot Arma.
- Rimuove una volta un blocco temporaneo su un proprio slot Arma.
- Dopo aver consumato Energia per una propria Arma, recupera una carica virtuale del medesimo elemento, una sola volta.

ID conservato: `boss-character-7`.

### 36. Leviatano Abissale — Nettuno · settore 60

**Durante lo scontro (permanente):**
- Riduce i danni alla propria madre mentre sono presenti supporti vivi.
- Potenzia gli attacchi contro navicelle già danneggiate; il giocatore deve scegliere se concentrare i colpi o distribuire il danno.

**Dopo lo sblocco (Leggendaria proposta, 3 turni):**
- Riduce il danno alla propria madre quando almeno un supporto è vivo.
- Potenzia un colpo contro una nave avversaria già ferita, una volta per turno.
- Cura una volta un supporto alleato sopravvissuto a un attacco.

ID conservato: `boss-character-8`.

### 37. Signore delle Ombre — Plutone · settore 70

**Durante lo scontro (permanente):**
- Sacrifica periodicamente HP di un supporto vivo per potenziare il successivo colpo; interrompe il sacrificio se non ha supporti idonei.
- Il giocatore non può recuperare carte dagli scarti mentre affronta il Boss.

**Dopo lo sblocco (Leggendaria proposta, 3 turni):**
- Può sacrificare una quota degli HP di un supporto vivo, una sola volta, per aumentare un colpo Arma.
- Potenzia il primo colpo quando la propria madre è sotto una soglia HP critica.
- Blocca il primo recupero nemico di una carta dagli scarti durante la permanenza.

ID conservato: `boss-character-9`.

### 38. Idra Criogenica — Europa · settore 80

**Durante lo scontro (permanente):**
- Recupera HP a ogni proprio turno finché il Generatore è operativo.
- Al primo colpo dannoso subito in ciascun turno avversario accumula una riparazione per il turno successivo; cure limitate e non applicabili a navi distrutte.

**Dopo lo sblocco (Leggendaria proposta, 3 turni):**
- Cura la nave alleata più danneggiata a ogni turno proprio.
- Dopo il primo danno subito, prepara una cura aggiuntiva per il proprio turno successivo, una volta.
- Neutralizza una volta una riduzione delle cure alleate, non una distruzione.

ID conservato: `boss-character-11`.

### 39. Generatore del Caos — Proxima b · settore 90

**Durante lo scontro (permanente):**
- Alterna in sequenza pubblica un turno di potenziamento Armi, uno di potenziamento Difese e uno di potenziamento Energia.
- Nella fase attiva una categoria diversa è temporaneamente limitata per il giocatore; ordine e icona annunciati prima della scelta delle carte.

**Dopo lo sblocco (Leggendaria proposta, 3 turni):**
- Prima di risolvere il turno sceglie una modalità di potenziamento: Arma, Difesa o Energia, una modalità differente nei tre turni.
- Nella modalità Difesa neutralizza una sola volta un sabotaggio.
- Nella modalità Energia recupera una sola volta una carica virtuale del medesimo elemento effettivamente speso.

ID conservato: `boss-character-14`.

### 40. Cristallo di Risonanza — Haumea · settore 100

**Durante lo scontro (permanente):**
- Aumenta la potenza dei propri colpi con il numero di carte avversarie negli scarti, entro un limite.
- Con supporti vivi coordina un bonus di Arma, non attacchi autonomi dei supporti.

**Dopo lo sblocco (Leggendaria proposta, 3 turni):**
- Potenzia un colpo Arma in funzione delle carte negli scarti avversari, con limite.
- Con due supporti vivi applica un piccolo bonus al primo colpo Arma di ogni turno.
- Quando un supporto viene distrutto, trasferisce una carica virtuale dell'elemento di quel supporto alla flotta, una sola volta.

ID conservato: `boss-character-17`.

### 41. Nucleo Magmatico — Io · settore 110

**Durante lo scontro (permanente):**
- Ciclo pubblico a tre fasi: riscaldamento, sovraccarico con danni maggiorati, raffreddamento con penalità.
- Durante il sovraccarico le Armi Fuoco del Boss applicano bruciatura al primo bersaglio realmente danneggiato.

**Dopo lo sblocco (Leggendaria proposta, 3 turni):**
- Primo turno: prepara una carica termica.
- Secondo turno: aumenta il primo colpo Arma Fuoco e può applicare una bruciatura se colpisce.
- Terzo turno: riduce il danno da bruciature subito dalla propria flotta durante il raffreddamento.

ID conservato: `boss-character-19`.

### 42. Sovrano del Vuoto — Encelado · settore 120

**Durante lo scontro (permanente):**
- Ogni turno annuncia la famiglia Arma usata dal giocatore nel turno precedente; giocare nuovamente quella stessa famiglia è vietato soltanto nel turno successivo.
- Blocca il primo colpo ordinario a intervalli prestabiliti; potenzia gli attacchi contro flotte con componenti già disattivati.

**Dopo lo sblocco (Leggendaria proposta, 3 turni):**
- Se gioca un'Arma di famiglia diversa dall'ultima giocata, potenzia il primo colpo.
- Blocca una sola volta un colpo ordinario diretto alla propria madre.
- Potenzia un colpo contro un avversario con almeno un componente disattivato, una sola volta per turno.

ID conservato: `boss-character-20`.

## Decisioni aperte

- Il nome Signore delle ombre del generico n.29 coincide con il Boss di Plutone. Proposta: rinominare il generico Custode della Penombra, conservando il suo ID. Nessuna rinomina applicata al registro generici.
- Il codice attuale usa la rarità tecnica Boss e abilità semplificate (src/fleetNext/bossCards.js). La classificazione Leggendaria dei trofei e le 3 abilità per ciascuno sono proposte da approvare, non modifiche già eseguite.
- Il Personaggio Boss dell'incontro resta fisso per tutto lo scontro. Proposta: trattarlo come profilo speciale separato dallo slot del giocatore, così la Plancia esaurita non rimuove il Boss; le sue abilità possono avere condizioni e controgioco.
- Le restrizioni della sfida non vengono trasferite integralmente nella versione sbloccata. La rarità non modifica le regole del trofeo già assegnato: riutilizzare ID e salvataggi esistenti.
- I valori, le soglie, i cap, il tempo di corrosione, l'effettiva applicabilità dei poteri e gli effetti audiovisivi sono da approvare e collaudare, inclusa la coerenza con lo slot Personaggio e il limite delle tre giocate. Non eseguire ancora le nuove abilità.
