# Prossima coppia Fulmine: Ionic Assault Probe / Thunder Hammer

Stato: **meccaniche lette; scelta grafica chiesta all'utente, ancora in attesa**.
Non sono nuove famiglie inventate: corrispondono ai due ID reali seguenti.
Non aggiungere fronti o effetti al registro approvato prima della verifica
e della conferma visiva previste dalla procedura.

| Nome inglese della carta | Nome attuale nel catalogo | Famiglia |
| --- | --- | --- |
| Ionic Assault Probe | Sonda Ionica d'Assalto | `weapon-designed-ionic-sonda-ionica` |
| Thunder Hammer | Martello del Tuono | `weapon-designed-ionic-martello-tuono` |

## Ruolo e valori nominali correnti

| Carta | Comune | Rara | Epica | Leggendaria |
| --- | --- | --- | --- | --- |
| Sonda: un colpo | 8 HP | 21 HP | 51 HP | 72 HP |
| Martello: colpo base | — | 28 HP | 66 HP | 94 HP |
| Martello: secondo impatto condizionale | — | 18 HP | 43 HP | 61 HP |

Fonte dei nominali: `WEAPON_NEAR_FINAL_VALUES`. Entrambe durano un turno
proprio e funzionano singolarmente; nessun costo Energia dedicato nel
profilo attuale. L'elemento è Fulmine. Non convertire il Martello in un
utensile a mano: rimane un dispositivo offensivo navale plausibile.

La Sonda applica un segnale soltanto se infligge danno reale. Il segnale
è conservato nel lato del giocatore con ID del bersaglio e `expiresPly =
ply + 3`: permette la coppia nello stesso turno (Sonda risolta prima) o
nel turno proprio successivo. Il Martello consuma il segnale e pianifica
un impatto aggiuntivo sul bersaglio segnato ancora valido. Un supporto
già distrutto non riceve un secondo colpo né trasferisce quel bonus alla
madre. Difese e copertura si applicano attraverso il motore ordinario.

Il renderer deve usare gli impatti effettivamente emessi: nessun secondo
BOOM se il motore non ha prodotto il secondo impatto. Verificare separatamente
segnale assente/scaduto, Sonda bloccata, bersaglio morto, protezione fra i
due impatti, sola madre e componenti madre diversi dall'Arsenale. Il lookup
generico `byId()` del motore provvisorio elenca soltanto la parte Arsenale
della madre: questo caso richiede un controllo prima di finalizzare la
coreografia e non va nascosto dalle prove sui soli supporti.

## Direzioni grafiche presentate, non ancora approvate

1. Sonda compatta con marchio luminoso; Martello come cuneo di fulmine
   pesante, con secondo impatto esplosivo quando si attiva la combo.
2. Sonda che imprime un reticolo elettrico; Martello come lama di fulmine
   rotante, con secondo fendente quando si attiva la combo.

Attendere la scelta o la descrizione dell'utente prima di produrre queste
immagini. I colpi iniziali entrano dai bordi del proprio lato. Materiali,
incrementi fisici per rarità, arte macchina+colpo, testi inglesi separati
e conferma visiva rimangono obbligatori. Suono e aptica vanno progettati
dopo aver verificato eventi reali, segnale e due impatti distinti.
