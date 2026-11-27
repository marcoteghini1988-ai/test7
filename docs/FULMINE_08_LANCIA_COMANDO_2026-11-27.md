# Ionic Command Lance — tre fronti approvati

## Inserimento autorizzato — 27 novembre 2026

L'utente ha risposto «ok» dopo aver visto i tre fronti PNG HD e il video
con audio e dopo la domanda esplicita sull'inserimento nel repository
pubblico `test7/main`. Fronti e inserimento sono approvati: non richiedere
un'altra conferma, non rigenerare illustrazioni, cornici o scritte.
Il registro corrente comprende 50 varianti: 22 Metallo e 28 Fulmine.
Gli stessi sei PNG (tre fronti inglesi e tre basi senza testo) sono
archiviati byte per byte in `asset-sources/weapon-fronts/lancia-comando-2026-11-27`.
Il ripristino verifica parti, file completo e RGBA 3072×4608. StackBlitz
usa i PNG nativi pubblicati da GitHub senza copiarli nel WebContainer.

Partita e studio condividono il volume della lancia, i contatti, il
contraccolpo, la partitura PCM e i pattern aptici. Il motore emette l'ID
del Personaggio realmente contributore; quel solo slot pulsa per 600 ms
prima del lancio. Assenza/scadenza/disabilitazione non creano spari; una
Difesa bloccante reagisce sulla propria carta e sullo scudo senza danno
o contraccolpo sullo scafo. Nessuna nuova abilità Personaggio, consumo
Energia, quantità di colpi o modifica dei danni. Le sequenze con altre
Armi attendono il contatto precedente. Il collaudo della nuova versione
nella partita StackBlitz rimane da completare; la verifica fisica della
vibrazione richiede un telefono compatibile.

Le sezioni seguenti conservano la preparazione precedente all'approvazione;
le relative attese di conferma sono storiche e superate.

L'utente ha chiarito che questa conversazione crea Carte Arma ed effetti,
non Personaggi. Ha approvato con «ok» la direzione proposta per la Lancia:
impulso sulla carta Personaggio, lancia elettrica affusolata dal bordo del
proprio lato, scariche ramificate sulla corazza, scintille, contraccolpo,
schiocco elettrico e richiesta aptica sincronizzati. La macchina rimane
nell'illustrazione, insieme al suo colpo. Non è montata sulla plancia.

**La direzione è approvata. I tre nuovi fronti completi attendono la prima
approvazione visiva; non sono nel registro giocabile delle 47 varianti.**

## Catalogo e meccanica corrente

Famiglia `weapon-designed-ionic-lancia-comando-ionico`, elemento Fulmine.
Le tre rarità reali sono Rara, Epica e Leggendaria; nessuna Comune.
Un turno proprio, un bersaglio, un colpo, nessun costo Energia dedicato.
Nel codice corrente è obbligatorio un Personaggio alleato attivo; il bonus
è pertanto già compreso nel danno totale stampato. Non presentarlo come un
secondo colpo, né mostrare un attacco base senza Personaggio.

| Rarità | Base nominale | Bonus Personaggio | Totale stampato |
| --- | --- | --- | --- |
| Rara | 24 HP | 14 HP | 38 HP |
| Epica | 58 HP | 34 HP | 92 HP |
| Leggendaria | 81 HP | 46 HP | 127 HP |

Valori da `WEAPON_NEAR_FINAL_VALUES`. Difese, copertura, affinità, Arsenale
e modificatori del motore possono cambiare gli HP effettivi. La prova usa
`resolvePreparedFleetTurn`, non una simulazione autonoma del danno.
Il Personaggio dello studio è l'esistente `gen-216`; nessuna nuova scheda
Personaggio o sinergia Elettrotecnico viene creata o approvata qui.

## Illustrazioni e composizione

Tre PNG generati originali in
`asset-sources/weapon-previews/lancia-comando-2026-11-27/art`.
Rara: apparato grafite a due guide aperte con piastre e collari in bronzo.
Epica: conserva il precedente e aggiunge anello di focalizzazione, snodi,
bobine e dissipatori in argento. Leggendaria: mantiene anche questi dettagli
e aggiunge tre stabilizzatori in cristallo prismatico. Stessa scena e camera.
La lancia blu-bianca compare insieme alla macchina in tutte le illustrazioni.

Le cornici originali di rarità e gli adesivi Arma/Fulmine già utilizzati
nelle carte precedenti sono ricomposti materialmente; pannello Arma rosso.
Le basi senza testo, gli SVG EN/IT e i dizionari esterni rimangono separati.
Il canvas finale è RGBA 3072×4608; le illustrazioni generate sono native a
1448×1086, ridimensionate nell'area centrale. Non dichiararle native a 3072.
Le cornici e i livelli testo conservano invece la risoluzione originale.

## Effetto e prova

`commandLanceSpec`, `commandLanceRenderer`, `commandLanceAudio` condividono
una sola sequenza. Punta volumetrica, spessore e facce illuminate; il naso
raggiunge il bersaglio, la scala cresce verso la camera. Le ramificazioni
della scia non sono proiettili aggiuntivi. L'impatto segue il rinculo dello
scafo, non le barre. Una Difesa bloccante reagisce sullo scudo e sulla sua
carta, senza ferita dello scafo o contraccolpo di danno.

Il motore legacy emette un record diagnostico di zero HP anche quando
`fireDisabledUntil` impedisce lo sparo: la prova legge lo stato precedente
e non lo trasforma in un lancio. Personaggio assente/scaduto non produce
attacco, audio o aptica. Non si cambiano il motore o le carte approvate.

Tredici casi: tre rarità A/B, madre e supporti, Personaggio giocato nello
stesso turno, assente/scaduto, Arma disabilitata, Difesa A/B, secondo slot.
La pagina e il video sono **uno studio dell'effetto**, non una registrazione
della partita ufficiale su StackBlitz. L'integrazione e il relativo collaudo
seguiranno l'approvazione dei fronti. La vibrazione fisica resta da provare
su un dispositivo compatibile. Preferenze audio, aptiche, movimento ridotto
e sospensione della pagina sono rispettate.

Sorgenti riproducibili: `scripts/previews/lancia-comando-20261127/README.md`.
Conservare lo stato e la specifica parallela dei Personaggi senza modificarli.

Verifiche della preparazione: 2463/2463 test della suite completa, build e
preflight passati. Tre cornici controllate pixel per pixel e sei esportazioni
EN/IT controllate: zero differenze fuori dalle aree testo. Video H.264 con
audio AAC stereo, 37,8 secondi. La pagina interattiva è stata generata e
compilata; il controllo nel browser resta aperto perché la prova locale non
era accessibile. Non dichiarare quel collaudo completato. Dati e hash in
`docs/collaudi/lancia-comando-2026-11-27/`.

## Prosecuzione

Alla conferma dei tre fronti, promuovere esattamente questi PNG e le basi
senza testo, collegare gli stessi renderer e partitura alla partita e
collaudare su StackBlitz. Non rigenerare le illustrazioni già confermate.
Restano dopo questa famiglia Condensatore della Tempesta e Giudizio Temporale;
le loro meccaniche vanno lette prima della proposta grafica.
