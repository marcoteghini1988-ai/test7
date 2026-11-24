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

La proposta dei quattro proiettili è approvata dall’utente. Il renderer usa
le sagome illustrate con piastre, giroscopi, dissipatori e prismi, raccolte
in un atlante PNG RGBA. Volo di 1.400 ms e impatto di 950 ms, con prospettiva
verso il bersaglio. Il suono d’impatto, la reazione della nave e il termine
della risoluzione condividono la stessa durata. Il calcolo include tutte
le carte mostrate prima dell’ultimo colpo; il timer del nuovo turno
riparte dopo l’impatto. Il collaudo StackBlitz della revisione `979bbc6553f314a6add8a935c35213aa9d0a2d5b` è concluso: quattro rarità, otto spari reali nei due sensi, tempi CSS di 1,4 s verificati, slot 1 e 2, bersagli madre e supporti. La registrazione mantiene la velocità reale di gioco. Dettagli in `docs/collaudi/effetti-2026-11-24/proiettili-velocita-verifica.json`. Validazione aggiornata: 1.998 test superati, build, controlli GitHub e collaudo mobile automatico superati.
