> Aggiornamento dopo approvazione: tutti e sei i fronti sono installati negli
> asset giocabili. Ganasce, catene persistenti, collisione dei veri scafi e
> Induzione sono implementati con audio e aptica. I 2.095 test, build e preflight
> sono superati; il collaudo in partita StackBlitz con audio è completato.
> 34 osservazioni DOM e il video documentano i due lati, i bonus Energia e i
> casi limite; la vibrazione fisica resta da provare su un telefono compatibile.
> Le sezioni seguenti conservano l’analisi meccanica che precede l’integrazione.

# Metallo — gruppo 2: lettura del codice e progetto degli effetti

Stato attuale: sei fronti approvati, installati e collaudati con effetti e audio.
Fonte: test7/main, commit `27033d9a189a1ccb54f8409cd1838c64fcefd211`.
Valori stampati: `WEAPON_NEAR_FINAL_BY_ID`, non numeri RAW storici.

| Carta | Rarità | Danno nominale | Durata |
| --- | --- | --- | --- |
| Arpioni a Ganasce Magnetiche | Rara | 14 HP per bersaglio | 2 turni propri |
| Arpioni a Ganasce Magnetiche | Epica | 34 HP per bersaglio | 2 turni propri |
| Arpioni a Ganasce Magnetiche | Leggendaria | 46 HP per bersaglio | 2 turni propri |
| Cannone Collassatore di Lega | Epica | 41 HP per bersaglio agganciato | 1 turno |
| Cannone Collassatore di Lega | Leggendaria | 57 HP per bersaglio agganciato | 1 turno |
| Frantumatore a Induzione | Epica | 37 HP a un bersaglio | 1 turno |

## Ganasce: due agganci, non una raffica indistinta

Codice letto: `provisionalWeaponEngine.js`, ramo `magnetic-grapple`, funzione
`hitOnce`; `combat.js`, controllo di disponibilità `alloy-collision`.
Nel turno di posa si attaccano due navicelle diverse, se esistono.
`provisionalWeaponStatus.grapple.ids` conserva solo bersagli con danno
effettivo positivo. Nel turno proprio successivo le Ganasce non sparano
di nuovo: conservano la preparazione per il Collassatore. La durata di due
turni non significa due raffiche. Non applicano una nuova immobilizzazione.

Coreografia realizzata: due teste a ganascia partono
dal bordo del rispettivo giocatore verso i bersagli effettivi; si aprono e
si chiudono sui punti misurati degli scafi. I segmenti della catena seguono
la profondità del tavolo e restano collegati alle navi ancora agganciate.
Un arpione bloccato non produce un aggancio falso; una nave distrutta perde
il collegamento persistente. Conservare i legami durante il turno avversario
solo finché la condizione resta valida.

- Rara: verricelli bronzei, scorrimento delle maglie e chiusura delle pinze;
  scatti di catena e un colpo metallico per ciascun aggancio riuscito.
- Epica: conserva la sequenza e aggiunge l'apertura/chiusura dell'arco in
  argento e dei collari di bloccaggio, con una risonanza elettromagnetica.
- Leggendaria: conserva tutto e aggiunge assestamento dei moduli prismatici,
  rifrazioni sui cavi e armonici cristallini, senza nuovi bersagli o impatti HP.
- Aptica collegata: impulso breve distinto per aggancio riuscito; niente
  vibrazione continua durante l'attesa del turno successivo.

## Collassatore: le navi devono muoversi e urtarsi

Codice letto: `combat.js`, validazione della combo; `provisionalWeaponEngine.js`,
ramo `alloy-collision`. Servono gli Arpioni nel turno proprio precedente
(`grapple.ply === ply - 2`) e due bersagli agganciati ancora vivi. L'azione
applica due impatti reali con Difese individuali e poi consuma la preparazione.
Non basta avere gli Arpioni nella mano o mostrare due navi qualsiasi.

Coreografia realizzata: attivazione dei due poli, catene che si tendono,
trazione dei due scafi verso un punto d'urto coerente con la camera e urto
visibile fra le due navi. Animare i veri elementi delle navi e i loro effetti
di volo; lasciare ferme le barre e gli alloggiamenti della plancia. Gestire
madre/supporto se sono i bersagli reali. Rilascio e ritorno alle posizioni
corrette, con pulizia delle trasformazioni anche in caso di distruzione.
Leggere gli impatti individuali: nessun danno aggiunto dal renderer.

- Epica: poli d'argento che si chiudono, pulsazione ambra fra le bobine,
  rumore di catena in trazione, crescendo e colpo metallico al contatto.
- Leggendaria: conserva questi movimenti e aggiunge la chiusura dei rinforzi
  prismatici, rifrazione del campo e fratture di luce al contatto, con timbro
  cristallino successivo all'urto. Resta una collisione fra gli stessi bersagli.
- Aptica collegata: segnali brevi di tensione e un impulso d'urto sincronizzato
  alla collisione, senza duplicarlo solo perché il motore contabilizza due navi.

## Frantumatore: leggere il vero bonus Energia

Codice letto: `combat.js`, `resolveDesignedWeaponShots`, ramo `induction`.
Un attacco autonomo; la presenza di una carta Energia Metallo supera una
Difesa valida, due carte permettono anche di distruggere una Difesa scoperta.
Le Energie vengono contate come carte fisiche compatibili e non consumate.
La copertura dei supporti non viene automaticamente ignorata. Il testo del
fronte indica ENERGY BONUS, non un costo di attacco inventato.

Coreografia realizzata: le tre piastre in argento si disallineano e poi
si richiudono; una scarica induttiva compressa segue il bersaglio reale.
Con una Energia mostrare il passaggio nella Difesa; con due, visualizzare
lo smontaggio della Difesa soltanto quando esiste l'evento `weapon-break-defense`.
Questo evento va distinto dallo sparo: nessun impatto di danno fittizio se
il motore non autorizza il colpo. Suono di bobina in carica, scatto delle
piastre e scarica metallica; aptica breve di carica e impulso all'impatto.

La Leggendaria del Frantumatore non fa parte di queste sei immagini:
rimane da preparare nel gruppo successivo, conservando queste piastre e
aggiungendo un componente fisico in cristallo prismatico.

## Verifica richiesta per l'integrazione successiva

Usare gli eventi `weapon-provisional-shot` e `weapon-designed-shot`, gli
impatti e lo stato di aggancio reale. Collaudare i due lati, bersagli madre
e supporti, blocchi, distruzioni, scadenza della combo e bonus Energia.
Video e suoni vanno provati nella plancia ufficiale di StackBlitz.
La vibrazione rispetta le preferenze del giocatore e richiede una prova
su dispositivo compatibile; la verifica su un browser privo di riscontro
aptico non permette di dichiararla collaudata.
