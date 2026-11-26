# Eclissi Stellare — 30 Personaggi generici

**Registro progettuale, non implementazione.** 3 schede confermate e 27 proposte da verificare. 8 Comuni, 8 Rari, 8 Epici, 6 Leggendari; 20 strategici, 10 specializzati nelle Armi. Tutti neutri, senza evoluzioni. Fonte strutturata: [`REGISTRO_30_PERSONAGGI_GENERICI.json`](REGISTRO_30_PERSONAGGI_GENERICI.json).

## Regole approvate

- Tutti i Personaggi neutri, nessuna affinità o debolezza elementale; la specializzazione Arma non è un elemento.
- Quattro rarità fisse; nessuna evoluzione. Comune 1 abilità, Rara 1–2, Epica 2, Leggendaria 3. Le sinergie contano come abilità.
- Più Personaggi nel mazzo, uno solo attivo contemporaneamente; sostituzione volontaria prima della scadenza, con perdita degli effetti non ancora risolti e passaggio agli scarti.
- Sostituzione occupa una delle tre giocate; permanenti fino a sostituzione/rimozione, temporanei a scadenza, istantanei dopo effetto. Plancia esaurita disattiva lo slot.
- 30 generici: 20 strategici e 10 specializzati Arma. Personaggi esclusivi e Boss sono fuori da questo lotto.

## Criteri proposti e da verificare

- 8 Comuni, 8 Rari, 8 Epici, 6 Leggendari; durate delle 27 nuove proposte da confermare.
- Tempo e HP da bilanciare dopo definizione. Niente recupero HP oltre maxHp o resurrezione salvo esplicita futura decisione. Nessun aumento del limite di tre carte giocate; istantanei e sostituzioni consumano una giocata.
- Nei temporanei i turni contano dal turno proprio di schieramento, incluse le finestre avversarie conseguenti; durata esatta delle azioni istantanee e trigger da verificare.
- Le cariche virtuali non creano carte fisiche Energia per la Speciale della madre; specificare fisicità, costo, cap e visual feedback nel bilanciamento.
- Blocchi, consumi, sostituzioni, scarti e bonus vanno collegati agli eventi reali e testati su entrambi i lati.

## Schede

### 1. Medico da campo — Comune

- Stato: confermato. Durata: 3 turni propri.
- Abilità 1: A ogni turno proprio cura la navicella alleata viva con percentuale HP più bassa, madre o supporto. Non resuscita e non ripara componenti.

### 2. Ingegnere dei sistemi — Comune

- Stato: confermato. Durata: istantanea.
- Abilità 1: Ripristina una quantità di secondi del timer di un componente alleato scelto (Centralina, Arsenale o Plancia), anche già esaurito. Dopo l'effetto va negli scarti.
- Da decidere: Quantità di secondi e limite del timer.; Conflitto con slot Personaggio disattivato quando è esaurita la Plancia: valutare eccezione istantanea senza installazione, non ancora approvata.

### 3. Tecnico del sacrificio — Rara

- Stato: confermato. Durata: istantanea.
- Abilità 1: Distrugge volontariamente un proprio componente ancora funzionante e trasferisce tutto il suo tempo residuo a un altro componente proprio scelto, anche esaurito. Va negli scarti.
- Da decidere: Trasferimento integrale oltre durata iniziale: non imporre un tetto che annulli parte del tempo senza decisione.; Se sacrifica la Plancia, risoluzione atomica proposta prima della disattivazione dello slot; giocabilità con Plancia già esaurita da chiarire.

### 4. Operatrice degli scudi — Comune

- Stato: proposta. Durata: 2 turni propri.
- Abilità 1: Prolunga di un turno la prima Difesa temporanea giocata durante la permanenza; non aggiunge cariche o attivazioni.

### 5. Archivista — Comune

- Stato: proposta. Durata: istantanea.
- Abilità 1: Recupera una Carta Strategia scelta dai propri scarti nella mano; non la gioca gratuitamente.

### 6. Ricognitore — Comune

- Stato: proposta. Durata: istantanea.
- Abilità 1: Visualizza privatamente le prossime tre carte del mazzo avversario, o quelle effettivamente presenti. Non cambia l'ordine e non pesca.

### 7. Magazziniere — Comune

- Stato: proposta. Durata: permanente.
- Abilità 1: Una volta per turno proprio, prima della risoluzione, può mettere una carta in mano in fondo al proprio mazzo e pescare una carta; nessuna giocata extra.

### 8. Analista delle trappole — Comune

- Stato: proposta. Durata: istantanea.
- Abilità 1: Rivela l'identità di una Trappola avversaria scelta senza attivarla, consumarla o disarmarla.

### 9. Cronometrista — Comune

- Stato: proposta. Durata: istantanea.
- Abilità 1: Riduce di un turno il raffreddamento residuo del Generatore; minimo zero.

### 10. Coordinatore di scorta — Rara

- Stato: proposta. Durata: 3 turni propri.
- Abilità 1: Una volta per turno avversario devia il primo colpo singolo contro un supporto alleato verso l'altro supporto vivo e valido. Non devia area o colpi che per regola ignorano i supporti.

### 11. Recuperatrice energetica — Rara

- Stato: proposta. Durata: 3 turni propri.
- Abilità 1: Quando una Carta Energia esaurisce l'ultima carica, recupera una carica virtuale del suo elemento, massimo una volta per turno proprio. Non crea una nuova carta fisica.

### 12. Sabotatore — Rara

- Stato: proposta. Durata: istantanea.
- Abilità 1: Sottrae una quantità di secondi dal timer di un componente avversario a scelta ancora operativo, senza danni HP automatici.

### 13. Esperta di trappole — Rara

- Stato: proposta. Durata: 3 turni propri.
- Abilità 1: La prima Trappola alleata attivata durante la permanenza può riarmarsi per un secondo utilizzo, non nello stesso turno. Dopo la seconda attivazione o alla normale scadenza modificata va negli scarti.
- Da decidere: Se il Personaggio lascia lo slot prima della seconda attivazione, definire scadenza del riarmo.

### 14. Chirurgo meccanico — Epica

- Stato: proposta. Durata: 3 turni propri.
- Abilità 1: A ogni turno proprio cura tutte le navicelle alleate vive.
- Abilità 2: Alla prima perdita di un supporto durante la permanenza, cura d'emergenza sui superstiti.

### 15. Capo manutenzione — Epica

- Stato: proposta. Durata: 3 turni propri.
- Abilità 1: A ogni turno proprio ripristina tempo al componente ancora operativo più vicino alla scadenza.
- Abilità 2: Neutralizza il primo sabotaggio temporale avversario durante la permanenza; non congela il cronometro ordinario.

### 16. Stratega logistico — Epica

- Stato: proposta. Durata: 3 turni propri.
- Abilità 1: Alla prima pescata di ogni turno proprio sceglie una delle prime due carte del mazzo, senza pescate aggiuntive.
- Abilità 2: Una volta durante la permanenza può scambiare una carta in mano con una Carta Strategia nei propri scarti.

### 17. Ufficiale d'interdizione — Epica

- Stato: proposta. Durata: 2 turni propri.
- Abilità 1: Congela uno slot Arma avversario scelto per un turno avversario.
- Abilità 2: Sospende gli effetti di un Personaggio temporaneo avversario per un turno avversario; il suo timer continua, senza estensione.
- Da decidere: Finestra di attivazione del secondo effetto se Personaggio nemico assente.

### 18. Maestro dei sistemi — Leggendaria

- Stato: proposta. Durata: 3 turni propri.
- Abilità 1: All'ingresso distribuisce una riserva aggiuntiva di secondi tra i propri componenti.
- Abilità 2: Neutralizza il primo sabotaggio temporale subito durante la permanenza.
- Abilità 3: Riattiva brevemente, una sola volta, il primo componente che si esaurisce durante la permanenza.
- Da decidere: Ordine di risoluzione se è la Plancia a scadere; non eludere la regola di disattivazione senza approvazione.

### 19. Ammiraglia delle scorte — Leggendaria

- Stato: proposta. Durata: 3 turni propri.
- Abilità 1: Coordina l'intercettazione tra supporti reali: una deviazione di colpo singolo per turno avversario.
- Abilità 2: Cura i superstiti alla perdita di un supporto.
- Abilità 3: Protegge la madre dal primo colpo ordinario dopo la perdita dell'ultimo supporto, una volta durante la permanenza. Non protegge da eccezioni esplicitamente perforanti.
- Da decidere: Quantità cure e modalità della protezione da bilanciare.

### 20. Maestra delle manovre — Leggendaria

- Stato: proposta. Durata: 3 turni propri.
- Abilità 1: Consente di sostituire anticipatamente una propria Arma installata con un'altra giocata normalmente; l'arma sostituita finisce negli scarti, senza conservare effetti o creare una giocata extra.
- Abilità 2: Se ha giocato esattamente due carte, migliora la pescata di fine turno scegliendo fra due carte per la prima pescata, non aumenta il limite di giocate.
- Abilità 3: Una sola volta recupera una propria Difesa realmente consumata dai propri scarti nella mano.
- Da decidere: Limite di utilizzo della sostituzione anticipata e interazione con sequenze e scadenze.

### 21. Artificiere di bordo — Rara

- Stato: proposta. Durata: permanente.
- Specializzazione: Fuoco (Personaggio neutro).
- Abilità 1: Riduce il danno da bruciature subite dalla flotta alleata.
- Abilità 2: Attiva il bonus già previsto della Torretta di Puntamento Piroclastico (+35% nel profilo attuale, valori soggetti a bilanciamento).
- ID Armi già a catalogo: `weapon-designed-plasma-torretta-piroclastica`.

### 22. Criotecnica — Rara

- Stato: proposta. Durata: 3 turni propri.
- Specializzazione: Ghiaccio (Personaggio neutro).
- Abilità 1: Rimuove una volta un congelamento già applicato alla propria mano.
- Abilità 2: Attiva una sinergia di congelamento con due Armi Ghiaccio compatibili; l'esatto congelamento e le due famiglie vanno riconciliati con le decisioni precedenti, non modificati alla cieca.
- Da decidere: Collegare le due famiglie Ghiaccio dopo verifica del registro e approvazione della sinergia.

### 23. Specialista idrostatica — Rara

- Stato: proposta. Durata: 3 turni propri.
- Specializzazione: Acqua (Personaggio neutro).
- Abilità 1: Riduce i danni ad area ai supporti alleati reali.
- Abilità 2: Abilita i bersagli aggiuntivi già progettati della Torretta Crioguidata e del Disgregatore di Pressione Isobarica; nessuna sostituzione delle meccaniche deliberate.
- ID Armi già a catalogo: `weapon-designed-refrigerant-torretta-crioguidata`, `weapon-design-20261126-refrigerant-pressione-isobarica`.
- Da decidere: Isobarica: caso entrambi i bersagli distrutti; bersaglio aggiuntivo rispetto alla protezione.

### 24. Elettrotecnico — Epica

- Stato: proposta. Durata: permanente.
- Specializzazione: Fulmine (Personaggio neutro).
- Abilità 1: Recupera una carica virtuale Fulmine dopo una Speciale della madre effettivamente risolta, una sola volta per schieramento.
- Abilità 2: Attiva la Lancia del Comando Ionico con il bonus già previsto.
- ID Armi già a catalogo: `weapon-designed-ionic-lancia-comando-ionico`.

### 25. Comandante d’Acciaio — Epica

- Stato: proposta. Durata: permanente.
- Specializzazione: Metallo (Personaggio neutro).
- Abilità 1: Rimuove una volta il congelamento di un proprio slot Arma, senza riattivare Arsenale esaurito.
- Abilità 2: Attiva i potenziamenti dell'Impattatore del Comandante d'Acciaio alle soglie di HP già previste.
- ID Armi già a catalogo: `weapon-designed-metallic-impatto-comandante`.

### 26. Sismologo — Epica

- Stato: proposta. Durata: 3 turni propri.
- Specializzazione: Terra (Personaggio neutro).
- Abilità 1: Neutralizza una volta una disattivazione di un proprio supporto operativo causata da una carta; non annulla la scadenza della Centralina.
- Abilità 2: Le due future Armi Terra compatibili recuperano una carica Terra virtuale quando distruggono un supporto nemico, massimo una volta per turno proprio.
- Due famiglie Arma ancora da progettare: Terra-Personaggio-A, Terra-Personaggio-B.

### 27. Pilota delle correnti — Epica

- Stato: proposta. Durata: 3 turni propri.
- Specializzazione: Vento (Personaggio neutro).
- Abilità 1: Ripristina una volta un'abilità passiva sospesa di un supporto ancora operativo; non resuscita supporti o ripara Centralina.
- Abilità 2: Le due future Armi Vento compatibili ricevono un bonus di danno quando cambiano bersaglio fra colpi consecutivi, massimo una volta per turno; rispettano la protezione.
- Due famiglie Arma ancora da progettare: Vento-Personaggio-A, Vento-Personaggio-B.

### 28. Maestra dei fotoni — Leggendaria

- Stato: proposta. Durata: 3 turni propri.
- Specializzazione: Luce (Personaggio neutro).
- Abilità 1: Neutralizza una volta un occultamento avversario; non rivela Trappole non coinvolte.
- Abilità 2: La futura Arma Luce A può deviare un colpo bloccato verso un altro bersaglio valido, una sola deviazione per attivazione, con Difese normali.
- Abilità 3: La futura Arma Luce B genera una protezione alleata quando colpisce realmente; durata, bersaglio e valore da bilanciare.
- Due famiglie Arma ancora da progettare: Luce-Personaggio-A, Luce-Personaggio-B.

### 29. Signore delle ombre — Leggendaria

- Stato: proposta. Durata: permanente.
- Specializzazione: Ombra (Personaggio neutro).
- Abilità 1: Impedisce una sola volta per schieramento il recupero di una Carta dagli scarti nemici: la carta resta negli scarti.
- Abilità 2: La futura Arma Ombra A accumula una quota del danno nominale dei propri colpi bloccati per un successivo colpo, senza doppio conteggio.
- Abilità 3: La futura Arma Ombra B converte una quota del danno effettivamente inflitto in cura alleata.
- Due famiglie Arma ancora da progettare: Ombra-Personaggio-A, Ombra-Personaggio-B.

### 30. Architetto gravitazionale — Leggendaria

- Stato: proposta. Durata: 3 turni propri.
- Specializzazione: Gravità (Personaggio neutro).
- Abilità 1: Sospende per un turno proprio, una sola volta, il consumo temporale ordinario di un proprio componente scelto; non sospende il timer del turno.
- Abilità 2: La futura Arma Gravità A riceve un bonus collegato agli HP massimi del bersaglio, con limite da bilanciare.
- Abilità 3: La futura Arma Gravità B può consumare Energia Gravità per aumentare il colpo finale.
- Due famiglie Arma ancora da progettare: Gravità-Personaggio-A, Gravità-Personaggio-B.

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
