# Fulmine, famiglia 5 — Cannone a Nucleo di Folgore Crescente

Stato: **meccanica letta nel codice; proposta grafica da approvare**.
L'utente ha chiesto di proseguire dopo l'integrazione delle 37 varianti.
Si continua una famiglia alla volta, senza riaprire le prime quattro.
Questo documento non aggiunge carte, asset giocabili o renderer.

## Identità e ruolo verificati

ID base: `weapon-designed-ionic-nucleo-folgore`. Elemento Fulmine (`ionic`).
Rarità attuali: Rara, Epica, Leggendaria; nessuna Comune da inventare.
È la quinta delle dieci famiglie reali, dopo il Cannone del Lampo Bianco.

L'Arma occupa uno slot per tre turni propri. Nel primo spara al danno
base senza chiedere Energia per questo specifico colpo. Nel secondo e
nel terzo occorre giocare una nuova Carta Energia Fulmine nel relativo
turno e spendere una carica per proseguire la supercarica. Le sole Energie
accumulate nei turni precedenti non soddisfano la condizione di nuova
Energia. Il conteggio delle nuove cariche e la spesa sono condivisi dalle
Armi che le richiedono: la medesima carica non alimenta due ricariche.

Se una ricarica manca o un turno necessario viene saltato, la progressione
si interrompe definitivamente per quell'istanza: l'Arma continua al danno
minimo fino a scadenza. Un'Energia giocata dopo non riattiva la crescita;
non consumarla soltanto per simulare una ricarica ormai impossibile.
Non aggiunge bersagli o colpi. Copertura, Difese e modificatori ordinari
continuano a valere; il danno reale può differire dal nominale.

| Rarità | Stadi del profilo RAW | Nominali della vista strategica corrente |
| --- | --- | --- |
| Rara | 24 / 36 / 54 | 24 / 36 / 54 |
| Epica | 34 / 50 / 76 | 58 / 85 / 129 |
| Leggendaria | 44 / 65 / 98 | 81 / 120 / 181 |

I valori sono quelli esistenti, ancora marcati provvisori nel profilo.
Non diventano nuove decisioni di bilanciamento per effetto della proposta.
Il cambio di rarità conserva durata, requisito e costo della ricarica.

Fonti: `provisionalWeaponProfiles.js`, `designedWeaponCards.js`,
`weaponRarityEvolutions.js`, `weaponBalanceCalibration.js` e ramo
`growing-thunder-core` in `provisionalWeaponEngine.js`.

## Proposta di associazione e disegno — non approvata

Nel parlato è già stato accettato il motivo degli anelli elettrici sotto
il nome «Torretta ad Anelli di Faraday». Quel nome non è una famiglia
codificata. Si propone di riutilizzare il motivo per il Nucleo reale,
adattandolo alle sue ricariche: l'associazione richiede la scelta dell'utente.
Non sostituire nomi, ID o meccaniche con la descrizione del colpo singolo
senza Energia pronunciata nella vecchia proposta. Le altre proposte
Faraday/Volta/Maxwell/Kelvin/Hertz/Ampère/Franklin/Coulomb restano conservate.

Nell'illustrazione: apparato navale con nucleo sospeso fra semianelli
sfalsati e innesto laterale, senza ripetere un cannone lungo o quattro
piedi. Mostrare insieme dispositivo ed emissione elettrica ad anelli.
Rara: dettaglio fisico in bronzo; Epica: mantiene il disegno e aggiunge
un anello orientabile d'argento; Leggendaria: mantiene i precedenti e
aggiunge una gabbia prismatica. Questi dettagli non aggiungono abilità.
Usare le cornici ufficiali PNG HD, pannello Arma rosso e simboli ufficiali.

## Proposta della sequenza — non approvata

Ogni lancio entra da punti variabili del bordo del lato che spara. La
macchina resta nella carta. Un nodo di folgore bianco-azzurra avvolto
da anelli elettrici raggiunge un bersaglio e produce un solo impatto.

1. Primo turno: nodo compatto, breve scia crepitante; contatto elettrico
   concentrato, scintille e reazione locale dello scafo.
2. Secondo, con ricarica riuscita: evidenziare la Carta Energia realmente
   coinvolta e il suo consumo; il nodo acquista una seconda corona
   rotante. Impatto più ramificato e sonorità di carica più tesa.
3. Terzo, con ricarica riuscita: nodo più denso, corone elettriche che
   collassano sul punto di contatto; lampo locale e detonazione elettrica
   decisa, conservando un solo colpo e il danno reale.
4. Ricarica interrotta: spegnimento progressivo delle corone sull'icona
   dell'Arma e suono discendente breve. I colpi rimasti usano la forma
   minima; niente spesa fittizia o successiva riaccensione della crescita.
5. Colpo bloccato: scarica sulla protezione e riscontro sulla vera carta
   Difesa; nessuna esplosione di danno inventata sulla nave.
6. Fine durata/interruzione: rimuovere i segni di carica e ripristinare
   pose, luci e audio persistente; seguire la destinazione reale della carta.

Audio: crepitio e tono crescente nelle ricariche reali, schiocco elettrico
al contatto, finale più profondo allo stadio massimo e breve scarica
discendente quando si perde la crescita. Aptica: impulso breve al consumo
reale, impulso di contatto distinto e più intenso ai livelli superiori;
nessun falso secondo impatto. La fine della carica usa un riscontro breve
distinto, rispettando preferenze e supporto del dispositivo.

Le rarità conservano le stesse regole, ma sviluppano filamenti, geometria
delle corone, timbro e riflessi propri. La potenza visiva deve seguire
anche lo stadio effettivo: una Leggendaria senza ricarica non deve
simulare lo stadio massimo. Scala e prospettiva devono lasciare leggibile
la nave, senza una testata enorme o un quadrato sul bersaglio.

## Verifica e passo successivo

Superata la regressione esistente «Nucleo: interruzione permanente anche
quando si gioca Energia in seguito» in `fleetNextProvisionalEdgeCases.test.js`.
Nessuna nuova verifica grafica, sonora o aptica è attestata per questa
proposta; i collaudi delle 37 varianti precedenti non la coprono.

Presentare all'utente ruolo e proposta. Dopo la scelta, preparare i fronti
completi e la prova degli effetti per approvazione visiva prima di inserirli.
Conservare invariati il gruppo già integrato e la bozza futura Super Combo.
