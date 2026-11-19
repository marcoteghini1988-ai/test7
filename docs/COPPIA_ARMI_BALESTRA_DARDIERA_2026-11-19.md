# Eclissi Stellare — due Armi complementari: cristallo e catalizzatore

**Data:** 19 novembre 2026 · **Stato:** progettazione, abbinamento deciso, numeri ancora da bilanciare e testare. **Nessuna modifica al codice giocabile.**

## Prima Arma: Balestra di Nebbia Gelata

- **Categoria:** Carta Arma, slot Arma temporanea
- **Elemento:** Ghiaccio
- **Rarità iniziale:** Comune, evolve con 3 doppioni identici per grado fino a Leggendaria (meccanica invariata)
- **Danno proprio:** 15 HP nominali, tiro singolo
- **Bersaglio:** supporto o madre nemica raggiungibile
- **Effetto:** se il colpo fa danno reale, resta un **cristallo di ghiaccio visibile** sulla navicella colpita. La Balestra si scarta alla fine del turno e libera il suo slot.
- **Durata cristallo:** fino alla **fine del prossimo turno proprio** di chi ha usato la Balestra. Se non innescato, si scioglie senza danno. Uno per bersaglio (nessun accumulo gratuito).

## Seconda Arma: Dardiera Catalitica Cremisi

- **Categoria:** Carta Arma indipendente, slot Arma temporanea
- **Elemento:** Fuoco (arma termocatalitica, complementare al Ghiaccio)
- **Rarità iniziale:** Comune (evoluzione da decidere)
- **Danno proprio:** 12 HP nominali, un singolo dardo
- **Bersaglio:** supporto o madre nemica raggiungibile
- **Funzionamento da sola:** infligge il proprio danno di Fuoco e termina; non ha bisogno del cristallo per essere giocabile
- **Interazione:** se il colpo di questa Dardiera infligge danno reale alla **stessa navicella che ha il cristallo**, il reagente destabilizza il cristallo: **esplosione criotermica di +12 HP nominali**, una sola volta, poi il cristallo si consuma

## Esempio operativo, stessi due slot esistenti

**Caso A — nello stesso turno:** gioco Balestra in slot Arma 1, sparo al supporto avversario A (15 nominali) e deposito il cristallo. Gioco Dardiera in slot Arma 2, sparo **allo stesso supporto A** (12 nominali). Se i colpi passano le difese, reazione **+12 nominali**: totale nominale 39. Entrambe le Carte Arma vanno agli scarti alla chiusura del turno, senza creare un terzo slot.

**Caso B — in due turni propri consecutivi:** gioco Balestra nel mio turno, deposito il cristallo, carta negli scarti. Dopo il turno nemico, al mio turno immediatamente successivo gioco Dardiera sullo stesso bersaglio: se il cristallo esiste ancora e il colpo passa, esplosione +12; diversamente solo il danno proprio della Dardiera. Alla fine del mio secondo turno ogni cristallo precedente non consumato si scioglie.

**Caso C — non completo la combinazione:** il cristallo si scioglie alla scadenza senza danneggiare ulteriormente il bersaglio.

## Regole da preservare

1. Sono entrambe **Carte Arma** e fanno danni attribuiti all'arma; non sono Carte Attacco che alterano soltanto lo stato della partita.
2. Il bersaglio di entrambe è una **navicella**, non uno slot Arma. Non congelano slot o passivi.
3. Il colpo della Dardiera e la reazione rispettano le difese ordinarie, le relazioni fra elementi e i limiti HP esistenti; **nessun Aggiramento gratuito**.
4. Se il secondo colpo viene interamente bloccato, il cristallo non si attiva.
5. I proiettili vanno eseguiti in **ordine di posa** se le due armi sono installate nello stesso turno; la Balestra deve risolvere il colpo prima della Dardiera.
6. La Dardiera occupa il posto di bozza **`weapon-new-plasma-03`**, già riservato a una delle 100 Armi, sostituendo il nome provvisorio «Siluro Piromante». La Balestra è `weapon-new-cryogenic-03`. **Il totale rimane 100**: 33 precedenti + 67 nuove. Le 67 bozze Attacco originali non cambiano.

**Da approvare:** potenza effettiva, rarità/upgrade della Dardiera, possibilità di ulteriori contromisure delle future Trappole; le immagini e le animazioni saranno elaborate successivamente.
