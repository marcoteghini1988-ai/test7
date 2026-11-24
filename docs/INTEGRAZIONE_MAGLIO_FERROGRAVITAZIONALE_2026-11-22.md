# Maglio Ferrogravitazionale — quattro fronti ufficiali integrati

**Aggiornato il 24 novembre 2026 — repository unico `marcoteghini1988-ai/test7` — quattro fronti approvati.**

La famiglia `weapon-confirmed-metallic-maglio` ora usa i fronti approvati nella
battaglia 3D, in Mano, nel Bazar/collezione, negli slot Arma e negli scarti.
Un unico collegamento `cardFacePath(id)` evita copie incoerenti tra le schermate.

| Rarità | ID catalogo | Danno nominale | Asset |
|---|---|---:|---|
| Comune | `weapon-confirmed-metallic-maglio` | 18 HP | `public/assets/fleet-weapon-fronts/weapon-confirmed-metallic-maglio.png` |
| Rara | `weapon-confirmed-metallic-maglio-rarity-r` | 46 HP | `public/assets/fleet-weapon-fronts/weapon-confirmed-metallic-maglio-rarity-r.png` |
| Epica | `weapon-confirmed-metallic-maglio-rarity-e` | 109 HP | `public/assets/fleet-weapon-fronts/weapon-confirmed-metallic-maglio-rarity-e.png` |
| Leggendaria | `weapon-confirmed-metallic-maglio-rarity-l` | 154 HP | `public/assets/fleet-weapon-fronts/weapon-confirmed-metallic-maglio-rarity-l.png` |

Le immagini derivano dalle quattro varianti finali approvate in chat. Sono
**PNG 3072×4608**, ricomposti dalle illustrazioni, dalle cornici, dagli
adesivi e dai livelli SVG del testo. I vecchi WebP 1024×1536 sono ritirati.
I livelli di testo rimangono modificabili nelle sorgenti per la localizzazione.

La categoria ARMA mantiene il simbolo ufficiale della torretta futuristica
arancione. Il METALLO mantiene il pittogramma ufficiale dei lingotti.
Base, alloggiamenti e targhette rimangono quelli approvati.

**Non sono cambiati:** danni esecutivi, rarità, costi Energia, copie possedute,
dorso delle carte, progressione, timer, IA, plancia o meccaniche del gioco.
Gli effetti ora partono dal bordo basso per A e dal bordo alto per B; la forma
del Maglio è un impulso gravitazionale con un solo impatto reale e rifiniture
progressive. Ciascuna rarità ha un timbro di lancio e impatto distinto nel
bus SFX del gioco, sincronizzato con i 1.400 ms fra sparo e impatto e soggetto
alla preferenza Effetti Sonori. Si veda
`docs/REGOLA_EFFETTI_VISIVI_CARTE_2026-11-24.md`.

Collegamento: `src/fleetNext/officialWeaponArt.js` →
`src/fleetNext/rules.js` → `cardFacePath` → schermate già esistenti.
Regressione: `src/fleetNextOfficialMaglioArt.test.js`.
Per altre carte, seguire `docs/PROCEDURA_OBBLIGATORIA_CREAZIONE_CARTE.md`.


## Collaudo concluso su StackBlitz — 24 novembre 2026

Codice e quattro PNG HD sono salvati in `test7/main`. Versione del codice
collaudata: `59c3c31c71a86d21f4ec6db97d077156a6c38d55`.

La prova ha eseguito il motore e `OfficialFleetBattle3D` originali, con
la configurazione controllata di `scripts/maglioReviewBattle.js`. Sono
verificati Comune e Rara contro la madre, Epica e Leggendaria contro i
supporti, i due slot Arma e le due direzioni di tiro. Ogni attivazione
produce un solo proiettile del Maglio e il bersaglio/danno calcolato dal
motore. I dati osservati nel browser sono in
`docs/collaudi/effetti-2026-11-24/stackblitz-verifica.json`.

Il controllo visivo ha individuato e corretto le etichette generiche
sovrapposte ai fronti completi nella mano. Sono conservati selezione,
informazioni accessibili e scheda generica in caso di immagine mancante.
I quattro fronti usati sono PNG 3072×4608, verificati tramite blob Git.

La registrazione `Maglio_4_rarita_StackBlitz_con_audio.mp4` mostra
Comune → Rara → Epica → Leggendaria, ciascuna con sparo del giocatore e
risposta avversaria. È una cattura della vera scheda StackBlitz, ritagliata
sulla plancia 9:16, con l'audio della scheda. Durata 49,915 secondi,
900×1600 a 30 fps, H.264/AAC; è stato eliminato il tempo di preparazione
e ridotto soltanto il volume dell'esportazione. La traccia audio è presente
e il picco del file finale è −2,7 dB. Il video è stato consegnato in chat.

Validazione: **1.996 test superati, zero fallimenti**, build di produzione
riuscita, controlli GitHub e collaudo mobile automatico riusciti.


## Revisione approvata: proiettili illustrati e volo leggibile

**Revisione superata per la prospettiva:** conservava la stessa vista obliqua nei due sensi.
L’illustrazione e i tempi restano approvati; il rendering è sostituito dalla revisione seguente.

La proposta dei quattro proiettili è approvata dall’utente. Il renderer usa
le sagome illustrate con piastre, giroscopi, dissipatori e prismi, raccolte
in un atlante PNG RGBA. Volo di 1.400 ms e impatto di 950 ms, con prospettiva
verso il bersaglio. Il suono d’impatto, la reazione della nave e il termine
della risoluzione condividono la stessa durata. Il calcolo include tutte
le carte mostrate prima dell’ultimo colpo; il timer del nuovo turno
riparte dopo l’impatto. Il collaudo StackBlitz della revisione `979bbc6553f314a6add8a935c35213aa9d0a2d5b` è concluso: quattro rarità, otto spari reali nei due sensi, tempi CSS di 1,4 s verificati, slot 1 e 2, bersagli madre e supporti. La registrazione mantiene la velocità reale di gioco. Dettagli in `docs/collaudi/effetti-2026-11-24/proiettili-velocita-verifica.json`. Validazione aggiornata: 1.998 test superati, build, controlli GitHub e collaudo mobile automatico superati.


## Prospettiva corretta e nuovo collaudo StackBlitz — 24 novembre

Codice verificato: `a58773e6270cfacc9b7e42070d4f8afa962f7916`.
Asset immutabili: `65d93a1b63a1839e7ce1775139f860aa431f6f8a`.
I sette file del renderer copiati nel progetto StackBlitz sono stati verificati
con il loro blob SHA Git, compreso `OfficialFleetBattle3D.jsx` completo.

La munizione è ricostruita come volume in `src/maglioProjectile3D.js`: piastre
smussate e rivetti Comune, giroscopi bronzo Rara, manicotti e dissipatori Epica,
prismi e nucleo bianco violetto Leggendaria. Una camera fissa sul tavolo
ricava la traiettoria dalle coordinate reali della plancia. Il naso della
testata arriva al bersaglio; la scala cambia con la profondità e il lato
superiore rimane verso l’alto. A mostra il retro, B mostra il fronte.

Per conservare ombre, riflessi e incassi senza WebGL, il renderer seleziona
24 viste fisiche Cycles dello stesso volume per rarità (96 in totale).
Gli atlanti sono PNG RGBA 1152×3840, con celle 384×480. Le viste coprono
fronte e retro, azimut −24°/0°/+24° e elevazioni 28°/42°/56°/70°; le brevi
transizioni evitano di lasciare a lungo sovrapposte le piastre di due viste.
La mesh CPU è disponibile durante il caricamento. Il modello non viene
ricreato a ogni aggiornamento del timer. I render sono riproducibili con
`scripts/build-maglio-projectile-atlas.mjs`.

La nuova prova ha eseguito il motore e la plancia ufficiali: Comune e Rara
contro la madre, Epica contro il supporto sinistro, Leggendaria contro
il supporto destro; risposta della vera IA in tutti e quattro i casi.
Otto spari, un proiettile per evento, volo 1.400 ms, impatto 950 ms.
Il nuovo turno ha riavuto 30 secondi dopo la fine di ciascuna sequenza.
Dati osservati in `docs/collaudi/effetti-2026-11-24/prospettiva-verifica.json`.

La registrazione `Maglio_4_rarita_prospettiva_StackBlitz.mp4` è una cattura
della scheda StackBlitz con audio della partita, ritagliata sulla plancia
9:16. La velocità di gioco è mantenuta. Sono stati controllati i fotogrammi
del volo nelle due direzioni, le finiture di rarità e gli impatti sui due
supporti laterali. Non è una dimostrazione isolata del proiettile.

Verifica: 2.007 test logici superati, nessun fallimento; test aggiuntivi
sulla proiezione, sulle viste e sul rasterizzatore CPU superati; build e
preflight riusciti. Controlli GitHub del codice `a58773e` riusciti; collaudo
mobile automatico della sorgente degli asset `65d93a1` riuscito.
I danni, i turni, le carte HD e il layout della plancia non sono modificati.

Video finale: 40,821 s, 900×1600 a 30 fps, H.264/AAC, picco audio -2.9 dB.
SHA-256: `08690a66ee186f7a79a0d7c903067108c6bfbc34d8dacc68ed507d9ad21fa72b`.


## Correzione utente: testata compatta e dimensioni — 24 novembre

La testata della prova precedente sembrava una grande cornice quadrata
vuota ed era troppo ingombrante. È sostituita con otto piastre attorno
al pistone d’urto metallico. Il proiettile in partita ha scala fisica
0,48 rispetto al modello artistico precedente; anche scia, ugello e
distanza fra centro e punta seguono questa scala. La punta rimane ancorata
al bersaglio in entrambe le direzioni. I 96 render PNG sono stati rigenerati.

Sorgente verificata in StackBlitz: `db4bcb25de8a4334c0c8d71886bd6a086df2a9c7`.
Quattro rarità, otto spari reali, slot 1 e 2, bersagli madre e supporti
sinistro/destro; dati in `testata-compatta-verifica.json` nella cartella
del collaudo. Verificati nel nuovo video scala e assenza del grande
riquadro frontale. Volo 1.400 ms e impatto 950 ms restano invariati.
21 test pertinenti, build, preflight e controlli GitHub superati.
La carta mostrata prima dello sparo non è modificata: l’utente ha precisato
che il riquadro da correggere era la testa del proiettile.

Nuova registrazione reale con audio: `Maglio_testata_compatta_StackBlitz.mp4`.
