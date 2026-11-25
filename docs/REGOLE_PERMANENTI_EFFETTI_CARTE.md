# Regole permanenti per gli effetti delle carte

Consolidate su richiesta esplicita dell'utente il 25 novembre 2026.
Applicarle alle carte attuali e alle prossime, di qualsiasi elemento.
Sostituiscono le vecchie prescrizioni di un unico punto di lancio e dello
stesso singolo colpo per tutte le rarità. Non approvano nuove illustrazioni.

1. **Leggere la carta e il motore prima di disegnare l'effetto.** Verificare
   ID e rarità correnti, condizioni, costi, turni, combo, copertura, Difese,
   bersagli e danni effettivi. Rappresentare tutti i passaggi che contano.
2. **Inventiva e coerenza fisica.** Le Armi sono dispositivi 3D modellabili;
   non fare tutte le macchine a forma di cannone o su quattro piedi. Parti
   articolate, emettitori, munizioni e movimento devono corrispondere
   all'illustrazione approvata. Non sostituire il modello con una figura
   piatta ruotata né ingrandire una testata squadrata fino a coprire lo scafo.
3. **Origini variabili, sempre sul lato della flotta che spara.** Alternare
   zone centrali, fianchi e profondità, con prospettiva speculare A/B e
   determinismo nei replay. Non tornare a una partenza fissa per ogni tiro.
   Un trasferimento previsto dalla carta riparte invece dalla nave colpita.
4. **Variare l'azione, oltre alla sagoma.** Progettare raffiche, per esempio
   3/6/9 colpi, alternanze, ventagli, curve, scie, rotazioni e finali speciali
   dove coerenti. Ogni rarità sviluppa struttura e ritmo della sequenza,
   non solo colore o scala. Il conteggio deve essere codificato nel motore
   e indicato sulla carta; la somma dei danni resta il totale concordato,
   senza moltiplicare HP, costi Energia o controlli delle Difese.
5. **Contatto evidente sulla nave.** Al momento dell'arrivo mostrare un
   impatto locale riconoscibile: esplosione, detonazione di plasma, getto
   perforante, frattura, scintille, detriti, taglio, morso o scarica secondo
   l'arma. Un piccolo scossone da solo non basta. Usare nucleo/corpo visibile,
   strati in profondità e una coda breve quando pertinenti. Ogni proiettile
   della raffica ha un contatto leggibile; il finale è più ricco. Dimensioni
   commisurate allo scafo, con la nave ancora riconoscibile.
6. **Lo scafo reagisce e il contatto lo segue.** Misurare il vero bersaglio;
   mantenere coincidenti naso, punto d'impatto, esplosione e reazione anche
   con più colpi sovrapposti. Recoil, torsione, luce e reattori accompagnano
   il materiale del colpo. Non muovere barre, slot o la plancia. Ripristinare
   tutte le pose e proprietà transitorie alla fine o all'interruzione.
7. **Nessuna meccanica inventata dall'effetto.** Mostrare soltanto danni,
   bersagli, agganci e durate reali. Una fiammata transitoria non è una
   Bruciatura persistente. La Difesa bloccante ha un contatto sullo scudo,
   senza ferite/esplosioni dello scafo. Un proiettile reale con quota HP zero
   fa solo un piccolo contatto sulla corazza. Nessuno sparo senza Energia.
   Ganasce: due agganci reali e catene persistenti. Collassatore: vere navi
   accelerate fino a un solo schianto/BOOM, non due esplosioni duplicate.
8. **Suoni e vibrazione fanno parte della stessa sequenza.** Carica, sparo,
   tensione, contatto, esplosione e rilascio usano gli stessi istanti del
   renderer. Suoni distinti, posizione stereo coerente, impulsi brevi nelle
   raffiche e finale riconoscibile. Rispettare volume, mute, preferenze,
   visibilità e movimento ridotto. Non scambiare una richiesta software
   accettata con un collaudo fisico della vibrazione sul telefono.
9. **Verificare e salvare l'inserimento completo.** Per ogni carta approvata
   inserire illustrazione, conteggio/testo, effetto per rarità, suoni e
   aptica nella stessa versione di `test7`. Verificare entrambi i lati,
   madre/supporti, combo, blocchi e rilascio del turno. Collaudare la
   partita su StackBlitz quando operativo. Dichiarare separatamente test,
   build, studio offline e collaudo dal vivo; non accelerare un video per
   simulare un effetto più energico e non riutilizzare vecchi collaudi come
   prova di una versione nuova. Non creare versioni parallele del progetto.

## Riferimenti correnti

- `src/fleetNext/approvedWeaponSalvos.js`: conteggi delle 22 varianti.
- `src/weaponKinematics.js`: origini, contatti, curve e orientamento 3D.
- `src/weaponHullImpacts.js`: contatti per famiglia e posa condivisa.
- `src/weaponCinematicRenderer.js`: esplosioni e altri contatti volumetrici.
- `src/collisionExplosion.js`: unico BOOM del Collassatore.
- `src/weaponSalvoAudio.js`, `src/weaponHaptics.js`: cue e preferenze.
- [Raffiche e origini variabili](RAFFICHE_ORIGINI_VARIABILI_2026-11-25.md).
- [Procedura per creare una carta](PROCEDURA_OBBLIGATORIA_CREAZIONE_CARTE.md).

La forma precisa dei nuovi effetti viene valutata sul codice e nelle prove
visive; questi principi non significano che un effetto non verificato sia
già approvato o collaudato.
