# Carte Arma: valori provvisori — 21 novembre 2026

> **Aggiornamento successivo:** questo documento conserva i valori della prima integrazione.
> Il bilanciamento attuale (revisione 2), con nomi corretti e registro completo delle 73 Armi,
> è in [BILANCIAMENTO_73_CARTE_ARMA_2026-11-21.md](BILANCIAMENTO_73_CARTE_ARMA_2026-11-21.md).

## Decisione dell'utente

Tutte le carte già confermate devono essere inserite e funzionare con valori
provvisori. Il bilanciamento finale avverrà dopo aver definito tutte le carte e
tutti i criteri. La mancanza di numeri definitivi non blocca più l'integrazione.
Le scelte operative qui documentate sono parametri di collaudo, da rivedere nel
bilanciamento complessivo, mantenendo le meccaniche già concordate.

## Stato del gioco

- 73 Carte Arma giocabili: 69 nuove e le quattro storiche.
- Tutte le 21 Armi prima escluse hanno un profilo eseguibile.
- Le 69 nuove Armi si trovano nella collezione e sono acquistabili con i prezzi
  provvisori già usati dal progetto: Comune 50, Rara 110, Epica 220,
  Leggendaria 440 Crediti. I limiti di copie e il possesso restano applicati.
- Tutte le carte acquistate sono selezionabili nel mazzo reale.
- Parametri centralizzati in `src/fleetNext/provisionalWeaponProfiles.js`;
  stato `provisional`, revisione `provisional-2026-11-21` e `balancePending:true`.

## Regole verificate

Ogni Arma usa gli alloggiamenti dedicati e la pipeline HP esistente, con Difese,
Trappole, elementi, Terreni e sincronizzazione. I supporti conservano soltanto
le abilità passive. I loro slot non generano attacchi aggiuntivi.

Il Perforatore trasferisce soltanto il danno effettivamente eccedente dopo la
sincronizzazione; ogni salto consuma Energia Metallo ed esegue le proprie difese.
Il Recuperatore legge le perdite effettive da attacchi, separandole dai costi
volontari e dalle riparazioni successive. L'Accoppiatore recupera al massimo gli
HP realmente sottratti. Una collisione richiede entrambe le navi agganciate vive.
Una nuova carica Fulmine non alimenta contemporaneamente due Armi diverse.
Il Cicloreattore blocca la mano in secondi reali mentre il timer continua;
l'IA attende lo sblocco prima di preparare carte.

## Collaudo

`fleetNextProvisionalWeapons.test.js` acquista ed equipaggia le 69 nuove Armi e
risolve le 21 meccaniche prima sospese. `fleetNextProvisionalEdgeCases.test.js`
verifica inoltre costi letali, recupero HP, collisioni, consumo della stessa
Energia, interruzione della carica e trasferimento effettivo del danno.

## Parametri provvisori delle 21 Armi completate

I turni indicati sono i turni del proprietario, inclusa la giocata.

| Arma | Rarità provvisoria | Turni | Effetto di collaudo |
| --- | --- | ---: | --- |
| Mortaio Magmatico | Rara | 3 | Per 3 tuoi turni spara 20 HP, più fino a 2 colpi extra da 8 HP. Ogni colpo extra consuma una carica fisica Energia Fuoco; le cariche rimanenti e gli altri elementi restano nella pila. |
| Inceneritore a Plasma Rotante | Epica | 2 | Spara 22 HP e 16 HP al turno successivo. Il primo colpo riuscito applica una bruciatura di 5 turni: 2 HP per propria Carta Attacco negli scarti al momento dell'impatto, minimo 2 HP, senza ricalcolo. |
| Sistema Binario a Sovraccarico | Leggendaria | 5 | Per 5 tuoi turni: colpo dell'8% degli HP massimi nemici, perdita del 6% degli HP massimi della tua madre, colpo del 16%, perdita del 4% degli HP massimi di ogni alleata operativa, poi 20% a ogni nave nemica. I costi possono essere letali. |
| Accoppiatore Termofagico | Epica | 2 | Richiede Sistema Binario installato. Spara 20 HP per 2 tuoi turni, costa il 3% HP massimi della madre al primo utilizzo e restituisce il 2% HP massimi se colpisce. Potenzia di 30 HP il colpo finale del Binario. |
| Ago dell'Inverno Nero | Comune | 1 | Colpisce entrambi i supporti per 12 HP ciascuno. Con Terreno Ghiaccio: 15 HP ciascuno e 30 HP perforanti alla madre; il perforante ignora le Difese ordinarie. Danni per rarità da ribilanciare. |
| Acceleratore Boreale Binario | Rara | 1 | Unisce due impulsi Ghiaccio da 13 e 17 HP in un singolo colpo da 30 HP sul bersaglio scelto, con una verifica difensiva. |
| Torretta Crioguidata | Rara | 1 | Spara 22 HP. Con un Personaggio attivo spara anche 14 HP su un bersaglio diverso, se disponibile. |
| Bassa Marea | Rara | 2 | Un colpo da 14 HP e 2 HP extra per ciascuna carta nei due scarti (massimo 30 contate); prepara Alta Marea per il turno proprio successivo. |
| Alta Marea | Epica | 1 | Giocabile solo nel turno proprio successivo a Bassa Marea. Travolge le Difese e le Trappole di entrambi i giocatori e colpisce con 4 volte la potenza caricata, massimo 120 HP. |
| Artiglieria delle Schegge Erranti | Rara | 2 | Un colpo da 20 HP nel turno di posa e uno nel proprio turno successivo, scegliendo un bersaglio differente quando possibile. |
| Recuperatore Termobalistico | Epica | 2 | Un colpo autonomo da 18 HP più il 60% degli HP realmente persi dalla tua flotta da quando l'arma è installata (massimo +54 HP). Due turni, non si combina con Artiglieria. |
| Obice a Pioggia di Schegge | Comune | 1 | Un colpo Metallo autonomo da 27 HP sul bersaglio scelto. |
| Ganasce Magnetiche | Rara | 2 | Due arpioni infliggono 14 HP a due navicelle diverse; se colpiscono, conservano i bersagli agganciati per Collassatore di Lega nel tuo turno successivo. |
| Collassatore di Lega | Epica | 1 | Richiede Ganasce Magnetiche nel turno proprio precedente; fa collidere i bersagli agganciati infliggendo 24 HP ciascuno (Difese individuali). |
| Perforatore a Cascata | Epica | 3 | Per 3 tuoi turni spara 38 HP. Se distrugge un bersaglio, può trasferire i danni eccedenti al successivo spendendo 1 carica Energia Metallo; ogni bersaglio verifica la propria Difesa. |
| Nucleo della Folgore Crescente | Rara | 3 | Spara 24/36/54 HP in 3 turni; per salire allo stadio successivo occorre giocare una nuova Energia Fulmine a ogni turno proprio e consumarne una carica. Se un caricamento manca, resta a 24 HP. |
| Sonda Ionica | Comune | 1 | Un colpo Fulmine da 14 HP; sul bersaglio colpito lascia un segnale che permette la combinazione con Martello del Tuono nello stesso turno o nel prossimo turno proprio. |
| Martello del Tuono | Rara | 1 | Colpo Fulmine da 28 HP; se il bersaglio è segnato da Sonda Ionica, un secondo impatto autonomo da 18 HP consuma il segnale. |
| Lancia del Comando Ionico | Rara | 1 | Richiede un Personaggio alleato attivo: un colpo Fulmine da 24 HP più 14 HP di bonus Personaggio, per 38 HP nominali. |
| Condensatore della Tempesta Stellare | Epica | 3 | Per 3 tuoi turni, se giochi una nuova Energia Fulmine ne consuma 1 carica e spara 18 HP +8 HP per ogni supporto alleato vivo, senza sacrificare HP. |
| Cicloreattore Grandinifero | Epica | 3 | Per 3 tuoi turni colpisce ogni nave nemica da 8/12/16 HP e congela la mano del rivale per 2/4/6 secondi mentre il timer continua. |
