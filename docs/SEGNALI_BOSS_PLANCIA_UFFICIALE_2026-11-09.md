# Eclissi Stellare — Segnali pubblici dei 12 boss sulla plancia ufficiale

**9 novembre 2026 — repository:** `marcoteghini1988-ai/test7`, ramo `main`.

## Obiettivo

Rendere comprensibili le minacce dei boss nel **duello simultaneo 30 s di preparazione + 8 s di risoluzione**, senza spostare nessun elemento della plancia approvata: navi madri, scudiere, armi reali, cinque carte speciali, sette numeriche, barre, controlli e scena 9:16 restano nelle stesse coordinate.

Il vecchio messaggio di fase appariva nel registro della battaglia, che richiede l'apertura di un pannello. Per le decisioni che durano solo 30 s serve un avviso **visibile prima di confermare le mosse**.

## Implementazione

1. **`src/officialBossThreatReadout.js`**: funzione pura, presentazionale, che restituisce informazioni pubbliche per tutti i 12 boss: Gaia/Corazza, Marte/Assalto, Venere/Neurotossina, Saturno/Controtempo, Urano/Sifone, Nettuno/Pressione, Plutone/Patto, Europa/Rigenerazione, Proxima b/Reattore, Haumea/Memoria, Io/Ciclo Magmatico ed Encelado/Seme dominante. Nessuna lettura di numeriche segrete, mani avversarie o ordini sigillati.
2. **Io**: fase pubblica coerente con il ciclo `carica → eruzione → raffreddamento`. Durante la **preparazione** di Eruzione la scritta centrale segnala `IO · ERUZIONE +10%` **al posto della sola descrizione di preparazione**, preservando il countdown in secondi; durante gli 8 s compare nuovamente l'indicatore `SCONTRO · 8s` originale.
3. **HUD nemico originale**: una riga testuale contenuta nel riquadro esistente espone il rischio del boss; non vengono creati pannelli fluttuanti né cambiate posizione e altezza del campo. Il testo completo è disponibile come descrizione accessibile e nel pannello Regole/Carte.
4. **Difese realmente utilizzabili in mano**: il readout di Io segnala Riparazione (solo con Generatore integro e barriera non piena), Paratia, Schermo e Copertura (con barriera e scudiera operativa) soltanto se la rispettiva carta figura nelle cinque speciali. Non crea carte o bonus.
5. **Distinzione strategica importante**: la Contromisura difende **un vitale indicato dagli attacchi di precisione**, non assorbe il pacchetto nativo di Eruzione. Chiarimento nel pannello Carte e nella scelta del suo bersaglio durante Io; evita di consigliarla per lo scudo.

### Regressioni da mantenere

- `src/officialBossThreatReadout.test.js`: cinque prove pure per tutti i 12 boss, successione Io, suggerimenti solo con carte in mano e sistemi integri, nessun accesso a ordini o mani nascoste, rotazione seme di Encelado e corazza Gaia.
- Nessuna modifica alle formule delle 23 passive, dei 12 esclusivi boss o dei 33 piloti; nessun ritocco al bilanciamento dei danni.
- Nessuna variazione ai file che definiscono il viewBox del renderer navicelle, gli slot o le coordinate CSS di `OfficialBattle3D`. Le aggiunte CSS riguardano soltanto la tipografia dell'HUD e l'area tattile invisibile dell'icona informazioni, senza cambiare le coordinate degli slot.
- Il timer 30+8, gli ordini contemporanei e i due mazzi 52/24 rimangono invariati.

## Verifica

La pipeline del primo inserimento [GitHub Actions 42540628527](https://github.com/marcoteghini1988-ai/test7/actions/runs/42540628527) ha superato **820 test su 820**, build Vite e preflight. Una successiva revisione soltanto testuale dà precedenza al consiglio nel riquadro stretto del nemico; vedere i controlli sul commit più recente di `main`.

## Collaudi visivi ancora necessari

Il preflight automatizzato **non equivale** a uno screenshot o a una prova su Samsung/Android. Da confermare sul gioco reale aperto su smartphone:

- Leggibilità del testo `PREP · IO ERUZIONE +10%` e countdown durante i 30 s, poi `SCONTRO · 8s` nella risoluzione.
- Riquadro nemico senza sovrapposizioni sui bordi; leggibilità della riga con schermo stretto e ridimensionamento 9:16.
- Coerenza fra carte effettivamente pescate, suggerimenti nell'HUD, pannello Carte, possibilità di selezionarle e confermare un ordine.
- Contromisura su un vitale esposto vs Riparazione/Paratia sulla barriera; nessun potere gratuito.
- Boss non-Io: notifica sempre derivata dalla reale abilità del boss; nessuna rivelazione di informazioni che il giocatore non dovrebbe conoscere.
- Navi madri e scudiere, animazioni dei vitali/armi native, posizione dei cinque slot speciali e delle sette numeriche, tutte immutate.

## Collaudo strutturale mobile e comandi (successivo al primo inserimento)

Il testo lungo dei poteri, non leggibile in una riga di circa 260 px interni, ora resta **nei pannelli accessibili**. L'HUD usa un campo `compact` di massimo 40 caratteri, controllato per tutti i boss. Io indica anche quante difese contro la barriera sono effettivamente utili **fra le cinque carte in mano**, senza offrire contromisure di precisione come difese per la salva nativa. La descrizione estesa è accessibile con l'icona `i` e nel pannello Regole, non solo tramite tooltip desktop.

La scritta centrale segnala **`PREP · IO ERUZIONE +10%`** in preparazione e ripristina **`SCONTRO · 8s`** in risoluzione. Le etichette accessibili delle cinque Carte Speciali includono nome e posizione; la Contromisura mostra HP e condizione dei quattro vitali nella selezione.

L'icona `i` mantiene la posizione originale; la superficie di tocco invisibile si amplia **verso destra e in altezza**, senza coprire la quinta carta. Inoltre, dopo `PRONTO` o alla scadenza del tempo, tutti i selettori dentro i pannelli tattici (Ricambio, armamenti, Bomba, Malus, Dorata, Mutazione, Contromisura) risultano disabilitati, eliminando cambiamenti della bozza che non avrebbero avuto alcun effetto sulla partita.

### Copertura test

- `src/officialBossThreatReadout.test.js`: compattezza, dati pubblici e sicurezza delle carte.
- `src/officialIoMobileControls.test.js`: cinque prove di **ordini sigillati veri**, con cinque carte difensive e di precisione, consumi del mazzo da 24 carte, generatori KO, scudiere KO e limite di conferma 30 s. Non simula tocchi fisici.
- `src/officialMobileLayout.test.js`: cinque verifiche **strutturali** dei 450×800 px, delle coordinate di navi, mani, cinque speciali, sette numeriche, timer, menù e bersaglio tattile `i`; simula matematicamente la scala per 320×640, 360×780, 393×852, 432×920 e 450×800. Questo non è un render CSS di browser.
- Pipeline finale verificata: [GitHub Actions 42542182506](https://github.com/marcoteghini1988-ai/test7/actions/runs/42542182506), **832 test passati, zero errori**, build Vite e preflight superati.

**Rimane da fare:** screenshot e prove d'interazione reali su smartphone Android e browser mobile, con attenzione a sovrapposizioni dovute a font/zoom/touch system, ai filmati delle armi e ai vitali fisici. Le simulazioni 9:16 e gli unit test non dimostrano il risultato grafico sul dispositivo. Non toccare la plancia metallica originale né i posizionamenti fino a evidenze visive.

