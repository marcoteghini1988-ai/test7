# Armi progettate e integrate — Eclissi Stellare, 21 novembre 2026

## Fonte e confini
Il catalogo deriva dalle decisioni del 19–20 novembre 2026 e dai codici già presenti sul ramo ufficiale. Il vecchio `CATALOGO_100_ARMI_PROPOSTA_2026-11-19.json` non è autorizzato come catalogo giocabile: contiene proposte e Carte Attacco successivamente escluse.

## Stato
- 32 Carte Arma nuove già eseguibili dalla fase precedente.
- 35 Carte Arma nominate e progettate ricostruite in `src/fleetNext/designedWeaponCards.js`.
- 15 di esse dispongono di parametri sufficienti per un effetto HP provvisorio: colpi multipli, attacchi a tutta la flotta, danni secondo Energia/Personggio/HP e danni percentuali. Restano da bilanciare. Nessuna grafica di prova, costo Shop o dono automatico.
- 20 sono catalogate con `designOnly:true` e `playable:false`: si conservano **nome, elemento, legami, durata e meccanica già decisa**, ma non si inventano danni, rarità, formule, costi o decisioni in sospeso. Il sistema ne vieta la selezione nel mazzo, mantenendo le definizioni visibili.
- Le quattro Armi storiche (Cannone dei Frammenti e i tre stadi dell'Acceleratore Trifase) sono separate.

## Avvertenze sulle quantità
Il progetto mirava a 10 nuove Armi per elemento, 100 complessive. Il recupero identifica **67 nuove carte con nome non ambiguo**, non 70 esatte. Acqua ne ha solo otto nominate univocamente; Metallo ne ha undici a causa di trasferimenti e revisioni. Due trasferimenti Terra/Vento non hanno nome ricostruibile e non sono stati inventati.

## Regole già rispettate
Ogni Arma giocabile è una carta distinta dagli Attacchi, occupa uno dei due alloggiamenti Arma e genera un colpo HP autonomo; i supporti non attaccano. Per ogni colpo si usa la pipeline di Difese, Trappole, elementi, Terreni, protezione HP e limiti della madre; PASSA con carte preparate risolve la carta senza aggiungere il tiro madre. Non si distribuiscono nuovi prezzi o modelli 3D.

## Meccaniche ancora da chiudere
Mortaio Magmatico (colpo per carta vs per carica e danni); Ago dell'Inverno Nero (danni per rarità); Inceneritore a Plasma Rotante (danno iniziale e calcolo bruciatura); Sistema Binario e Accoppiatore; Acceleratore Boreale; Torretta Crioguidata; Bassa/Alta Marea; Artiglieria delle Schegge Erranti; Recuperatore Termobalistico; Obice a Pioggia di Schegge; Ganasce/Collassatore; Perforatore a Cascata (incoerenza durata e costi); Nucleo Folgore, Sonda/Martello, Lancia Comando, Condensatore Tempesta. Questi sono **nel catalogo del codice**, ma non ancora effetti giocabili.

## Collaudo
`src/fleetNextDesignedWeapons.test.js` verifica la presenza di tutte le schede, l'esclusione dei progetti incompleti, il funzionamento del combattimento per gli effetti implementati e la compatibilità delle quattro Armi storiche.
